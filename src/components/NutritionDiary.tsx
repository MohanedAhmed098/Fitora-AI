import React, { useState } from 'react';
import {
  UserProfile,
  DailyLog,
  FoodItem,
  MealType,
  LoggedMealItem,
  Language,
} from '../types/index.ts';
import { translations } from '../data/translations.ts';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  Sparkles,
  Search,
  BookOpen,
  ChefHat,
  ShoppingBag,
  Clock,
  ArrowRightLeft,
  Calendar,
  Check,
  Info,
} from 'lucide-react';

interface NutritionDiaryProps {
  profile: UserProfile;
  dailyLog: DailyLog;
  allFoods: FoodItem[];
  currentDate: string;
  onChangeDate: (date: string) => void;
  onUpdateDailyLog: (log: DailyLog) => void;
  onOpenScanFood: () => void;
  onOpenRecipeCalculator: () => void;
  onOpenNutritionPlans: () => void;
  onOpenPantry: () => void;
  onSaveCustomFood: (food: FoodItem) => void;
}

export const NutritionDiary: React.FC<NutritionDiaryProps> = ({
  profile,
  dailyLog,
  allFoods,
  currentDate,
  onChangeDate,
  onUpdateDailyLog,
  onOpenScanFood,
  onOpenRecipeCalculator,
  onOpenNutritionPlans,
  onOpenPantry,
  onSaveCustomFood,
}) => {
  const language = profile.language;
  const t = translations[language];

  const [activeAddMealType, setActiveAddMealType] = useState<MealType | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);
  const [gramsInput, setGramsInput] = useState<number>(100);

  // Custom food creator state
  const [showCreateCustom, setShowCreateCustom] = useState<boolean>(false);
  const [customNameEn, setCustomNameEn] = useState<string>('');
  const [customNameAr, setCustomNameAr] = useState<string>('');
  const [customCalories, setCustomCalories] = useState<number>(150);
  const [customProtein, setCustomProtein] = useState<number>(10);
  const [customCarbs, setCustomCarbs] = useState<number>(15);
  const [customFat, setCustomFat] = useState<number>(5);
  const [customFiber, setCustomFiber] = useState<number>(2);

  // Search grounding state
  const [isSearchingWithAi, setIsSearchingWithAi] = useState<boolean>(false);
  const [aiSearchResult, setAiSearchResult] = useState<any | null>(null);

  const mealSlots: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];

  // Navigate date
  const shiftDate = (days: number) => {
    const current = new Date(currentDate);
    current.setDate(current.getDate() + days);
    const yyyy = current.getFullYear();
    const mm = String(current.getMonth() + 1).padStart(2, '0');
    const dd = String(current.getDate()).padStart(2, '0');
    onChangeDate(`${yyyy}-${mm}-${dd}`);
  };

  const getSlotMeals = (slot: MealType) => {
    return dailyLog.meals.filter((m) => m.mealType === slot);
  };

  const getSlotTotals = (slot: MealType) => {
    const meals = getSlotMeals(slot);
    return {
      calories: meals.reduce((s, m) => s + (m.calories || 0), 0),
      protein: Math.round(meals.reduce((s, m) => s + (m.protein || 0), 0)),
      carbs: Math.round(meals.reduce((s, m) => s + (m.carbs || 0), 0)),
      fat: Math.round(meals.reduce((s, m) => s + (m.fat || 0), 0)),
    };
  };

  const deleteMealItem = (id: string) => {
    const updated = dailyLog.meals.filter((m) => m.id !== id);
    onUpdateDailyLog({ ...dailyLog, meals: updated });
  };

  // Add food selection to diary
  const confirmAddFoodToSlot = () => {
    if (!selectedFood || !activeAddMealType) return;

    const factor = gramsInput / 100;
    const newItem: LoggedMealItem = {
      id: `meal_log_${Date.now()}`,
      foodId: selectedFood.id,
      nameEn: selectedFood.nameEn,
      nameAr: selectedFood.nameAr,
      grams: gramsInput,
      calories: Math.round(selectedFood.caloriesPer100g * factor),
      protein: Math.round(selectedFood.proteinPer100g * factor * 10) / 10,
      carbs: Math.round(selectedFood.carbsPer100g * factor * 10) / 10,
      fat: Math.round(selectedFood.fatPer100g * factor * 10) / 10,
      fiber: Math.round(selectedFood.fiberPer100g * factor * 10) / 10,
      mealType: activeAddMealType,
      loggedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    onUpdateDailyLog({
      ...dailyLog,
      meals: [...dailyLog.meals, newItem],
      completedHabits: { ...dailyLog.completedHabits, foodLogged: true },
    });

    setSelectedFood(null);
    setActiveAddMealType(null);
  };

  // Handle saving new custom food
  const handleSaveCustomFood = () => {
    if (!customNameEn && !customNameAr) return;

    const newFood: FoodItem = {
      id: `custom_food_${Date.now()}`,
      nameEn: customNameEn || customNameAr,
      nameAr: customNameAr || customNameEn,
      category: 'basic',
      caloriesPer100g: Number(customCalories) || 0,
      proteinPer100g: Number(customProtein) || 0,
      carbsPer100g: Number(customCarbs) || 0,
      fatPer100g: Number(customFat) || 0,
      fiberPer100g: Number(customFiber) || 0,
      servingUnitEn: '100g',
      servingUnitAr: '100 جم',
      gramsPerServing: 100,
      source: 'Custom',
      isCustom: true,
    };

    onSaveCustomFood(newFood);
    setSelectedFood(newFood);
    setShowCreateCustom(false);
  };

  // Search grounded nutrition lookup
  const searchVerifiedNutritionWithAi = async () => {
    if (!searchQuery) return;
    setIsSearchingWithAi(true);
    setAiSearchResult(null);
    try {
      const res = await fetch('/api/search-nutrition', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery, language }),
      });
      const data = await res.json();
      if (data.data) {
        const item: FoodItem = {
          id: `ai_verified_${Date.now()}`,
          nameEn: data.data.nameEn || searchQuery,
          nameAr: data.data.nameAr || searchQuery,
          category: 'basic',
          caloriesPer100g: Number(data.data.caloriesPer100g) || 100,
          proteinPer100g: Number(data.data.proteinPer100g) || 5,
          carbsPer100g: Number(data.data.carbsPer100g) || 15,
          fatPer100g: Number(data.data.fatPer100g) || 2,
          fiberPer100g: Number(data.data.fiberPer100g) || 2,
          servingUnitEn: data.data.servingUnitEn || '1 portion',
          servingUnitAr: data.data.servingUnitAr || 'حصة',
          gramsPerServing: Number(data.data.gramsPerServing) || 100,
          source: 'Verified',
        };
        onSaveCustomFood(item);
        setSelectedFood(item);
        setAiSearchResult(data);
      }
    } catch {
      // Graceful fallback to local food database
    } finally {
      setIsSearchingWithAi(false);
    }
  };

  // Filter foods by query & category
  const filteredFoods = allFoods.filter((f) => {
    const matchesCat = selectedCategory === 'all' || f.category === selectedCategory;
    const q = searchQuery.toLowerCase().trim();
    const matchesQuery = !q || f.nameEn.toLowerCase().includes(q) || f.nameAr.includes(q);
    return matchesCat && matchesQuery;
  });

  return (
    <div className="space-y-6 pb-24 max-w-4xl mx-auto px-4 pt-4">
      {/* Date Navigation Header */}
      <div className="bg-white dark:bg-[#1a2217] rounded-2xl p-4 border border-stone-200 dark:border-stone-800 shadow-xs flex items-center justify-between">
        <button
          onClick={() => shiftDate(-1)}
          className="p-2 rounded-xl text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
          title="Previous Day"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-[#4D6A34] dark:text-[#85A947]" />
          <input
            type="date"
            value={currentDate}
            onChange={(e) => onChangeDate(e.target.value)}
            className="text-xs sm:text-sm font-bold bg-transparent text-stone-900 dark:text-stone-100 focus:outline-none cursor-pointer"
          />
        </div>

        <button
          onClick={() => shiftDate(1)}
          className="p-2 rounded-xl text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
          title="Next Day"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Auxiliary Tools Bar (AI Scanner, Recipe Calc, Plans, Pantry) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <button
          onClick={onOpenScanFood}
          className="p-3 rounded-xl bg-gradient-to-tr from-[#3B5323] to-[#5C7E3E] text-white flex items-center gap-2 text-xs font-bold shadow-xs hover:scale-[1.02] active:scale-[0.98] transition-all"
        >
          <Sparkles className="w-4 h-4 text-[#D4DFCD]" />
          <span>{t.scanner.title}</span>
        </button>

        <button
          onClick={onOpenRecipeCalculator}
          className="p-3 rounded-xl bg-white dark:bg-[#1a2217] border border-stone-200 dark:border-stone-800 text-stone-800 dark:text-stone-100 hover:border-[#4D6A34] flex items-center gap-2 text-xs font-bold shadow-xs transition-colors"
        >
          <ChefHat className="w-4 h-4 text-[#4D6A34] dark:text-[#85A947]" />
          <span>{t.nutrition.recipeCalculator}</span>
        </button>

        <button
          onClick={onOpenNutritionPlans}
          className="p-3 rounded-xl bg-white dark:bg-[#1a2217] border border-stone-200 dark:border-stone-800 text-stone-800 dark:text-stone-100 hover:border-[#4D6A34] flex items-center gap-2 text-xs font-bold shadow-xs transition-colors"
        >
          <BookOpen className="w-4 h-4 text-[#4D6A34] dark:text-[#85A947]" />
          <span>{t.nutrition.mealPlans}</span>
        </button>

        <button
          onClick={onOpenPantry}
          className="p-3 rounded-xl bg-white dark:bg-[#1a2217] border border-stone-200 dark:border-stone-800 text-stone-800 dark:text-stone-100 hover:border-[#4D6A34] flex items-center gap-2 text-xs font-bold shadow-xs transition-colors"
        >
          <ShoppingBag className="w-4 h-4 text-[#4D6A34] dark:text-[#85A947]" />
          <span>{t.nutrition.pantryManager}</span>
        </button>
      </div>

      {/* Meal Diary Slots */}
      <div className="space-y-4">
        {mealSlots.map((slot) => {
          const meals = getSlotMeals(slot);
          const totals = getSlotTotals(slot);
          const slotTitle = t.nutrition[slot === 'snack' ? 'snacks' : slot];

          return (
            <div
              key={slot}
              className="bg-white dark:bg-[#1a2217] rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs overflow-hidden transition-colors"
            >
              {/* Slot Header */}
              <div className="p-4 bg-stone-50/60 dark:bg-stone-800/30 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-extrabold text-stone-900 dark:text-stone-100 capitalize">
                    {slotTitle}
                  </h3>
                  <div className="text-[11px] text-stone-400 flex items-center gap-2 mt-0.5">
                    <span>{totals.calories} kcal</span>
                    <span>•</span>
                    <span>P: {totals.protein}g</span>
                    <span>•</span>
                    <span>C: {totals.carbs}g</span>
                    <span>•</span>
                    <span>F: {totals.fat}g</span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setActiveAddMealType(slot);
                    setSelectedFood(null);
                    setSearchQuery('');
                  }}
                  className="px-3 py-1.5 rounded-xl bg-[#EBF2E8] dark:bg-[#283620] text-[#3B5323] dark:text-[#A7D184] hover:bg-[#D4DFCD] text-xs font-bold flex items-center gap-1.5 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{t.nutrition.addFood}</span>
                </button>
              </div>

              {/* Slot Meals List */}
              <div className="p-3 divide-y divide-stone-100 dark:divide-stone-800">
                {meals.length === 0 ? (
                  <p className="text-center py-4 text-xs text-stone-400 italic">
                    {language === 'ar' ? 'لم يتم تسجيل أطعمة في هذه الوجبة' : 'No food items logged in this meal yet.'}
                  </p>
                ) : (
                  meals.map((item) => (
                    <div key={item.id} className="py-2.5 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-bold text-stone-800 dark:text-stone-200">
                          {language === 'ar' ? item.nameAr || item.nameEn : item.nameEn}
                          {item.isAiEstimated && (
                            <span className="ms-1.5 px-1.5 py-0.2 rounded text-[9px] bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 font-semibold">
                              AI
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-stone-400 flex items-center gap-2 mt-0.5">
                          <span>{item.grams}g</span>
                          <span>•</span>
                          <span>P: {item.protein}g</span>
                          <span>•</span>
                          <span>C: {item.carbs}g</span>
                          <span>•</span>
                          <span>F: {item.fat}g</span>
                          {item.loggedAt && (
                            <>
                              <span>•</span>
                              <span className="flex items-center gap-0.5">
                                <Clock className="w-3 h-3" /> {item.loggedAt}
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-end">
                          <span className="font-extrabold text-stone-900 dark:text-stone-100">{item.calories}</span>
                          <span className="text-[10px] text-stone-400 block">{t.common.kcal}</span>
                        </div>
                        <button
                          onClick={() => deleteMealItem(item.id)}
                          className="text-stone-300 hover:text-rose-500 transition-colors p-1"
                          title={t.common.delete}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Food Modal */}
      {activeAddMealType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/70 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white dark:bg-[#1a2217] w-full max-w-xl rounded-2xl shadow-2xl border border-stone-200 dark:border-stone-800 p-5 my-auto max-h-[90vh] overflow-y-auto text-stone-900 dark:text-stone-100">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 pb-3 mb-4">
              <div>
                <span className="text-xs font-bold text-[#4D6A34] dark:text-[#85A947] uppercase tracking-wider">
                  {t.nutrition[activeAddMealType === 'snack' ? 'snacks' : activeAddMealType]}
                </span>
                <h3 className="text-base font-bold">{t.nutrition.addFood}</h3>
              </div>
              <button
                onClick={() => {
                  setActiveAddMealType(null);
                  setSelectedFood(null);
                }}
                className="text-stone-400 hover:text-stone-600 font-bold"
              >
                ✕
              </button>
            </div>

            {/* Custom Food Creation Form */}
            {showCreateCustom ? (
              <div className="space-y-4">
                <h4 className="text-xs font-bold">{t.nutrition.customFood}</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold block mb-1">Name (English)</label>
                    <input
                      type="text"
                      value={customNameEn}
                      onChange={(e) => setCustomNameEn(e.target.value)}
                      placeholder="e.g. Grandma's Lentil Soup"
                      className="w-full px-3 py-1.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold block mb-1">الاسم بالعربية</label>
                    <input
                      type="text"
                      value={customNameAr}
                      onChange={(e) => setCustomNameAr(e.target.value)}
                      placeholder="مثال: شوربة عدس بيتي"
                      className="w-full px-3 py-1.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-xs font-cairo"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-5 gap-2 text-xs">
                  <div>
                    <label className="text-[10px] text-stone-400 block">Kcal / 100g</label>
                    <input
                      type="number"
                      value={customCalories}
                      onChange={(e) => setCustomCalories(Number(e.target.value))}
                      className="w-full px-2 py-1 rounded border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-stone-400 block">Protein (g)</label>
                    <input
                      type="number"
                      value={customProtein}
                      onChange={(e) => setCustomProtein(Number(e.target.value))}
                      className="w-full px-2 py-1 rounded border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-stone-400 block">Carbs (g)</label>
                    <input
                      type="number"
                      value={customCarbs}
                      onChange={(e) => setCustomCarbs(Number(e.target.value))}
                      className="w-full px-2 py-1 rounded border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-stone-400 block">Fat (g)</label>
                    <input
                      type="number"
                      value={customFat}
                      onChange={(e) => setCustomFat(Number(e.target.value))}
                      className="w-full px-2 py-1 rounded border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-stone-400 block">Fiber (g)</label>
                    <input
                      type="number"
                      value={customFiber}
                      onChange={(e) => setCustomFiber(Number(e.target.value))}
                      className="w-full px-2 py-1 rounded border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-xs"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateCustom(false)}
                    className="px-3 py-1.5 rounded-lg border text-xs"
                  >
                    {t.common.cancel}
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveCustomFood}
                    className="px-4 py-1.5 rounded-lg bg-[#4D6A34] text-white font-bold text-xs"
                  >
                    {t.common.save}
                  </button>
                </div>
              </div>
            ) : selectedFood ? (
              /* Selected Food Portion Config */
              <div className="space-y-4">
                <div className="p-3.5 rounded-xl bg-[#EBF2E8] dark:bg-[#283620] border border-[#4D6A34]/20">
                  <h4 className="font-bold text-sm text-[#2D3E1E] dark:text-[#D4DFCD]">
                    {language === 'ar' ? selectedFood.nameAr : selectedFood.nameEn}
                  </h4>
                  <p className="text-[11px] text-stone-500 mt-0.5">
                    {language === 'ar' ? selectedFood.servingUnitAr : selectedFood.servingUnitEn} • Source:{' '}
                    {selectedFood.source}
                  </p>
                </div>

                <div>
                  <label className="text-xs font-semibold block mb-1">{t.nutrition.gramsAmount}</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="1"
                      value={gramsInput}
                      onChange={(e) => setGramsInput(Math.max(1, Number(e.target.value)))}
                      className="flex-1 px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-sm font-bold"
                    />
                    {selectedFood.gramsPerServing > 0 && (
                      <button
                        type="button"
                        onClick={() => setGramsInput(selectedFood.gramsPerServing)}
                        className="px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 text-xs font-semibold hover:bg-stone-100"
                      >
                        1 {language === 'ar' ? selectedFood.servingUnitAr : selectedFood.servingUnitEn}
                      </button>
                    )}
                  </div>
                </div>

                {/* Macro preview for specified grams */}
                <div className="grid grid-cols-4 gap-2 text-center text-xs bg-stone-50 dark:bg-stone-800/40 p-3 rounded-xl">
                  <div>
                    <span className="text-[10px] text-stone-400 block">{t.common.calories}</span>
                    <span className="font-black text-stone-900 dark:text-stone-100">
                      {Math.round(selectedFood.caloriesPer100g * (gramsInput / 100))}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-stone-400 block">{t.common.protein}</span>
                    <span className="font-bold text-sky-600">
                      {(selectedFood.proteinPer100g * (gramsInput / 100)).toFixed(1)}g
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-stone-400 block">{t.common.carbs}</span>
                    <span className="font-bold text-amber-600">
                      {(selectedFood.carbsPer100g * (gramsInput / 100)).toFixed(1)}g
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-stone-400 block">{t.common.fat}</span>
                    <span className="font-bold text-emerald-600">
                      {(selectedFood.fatPer100g * (gramsInput / 100)).toFixed(1)}g
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedFood(null)}
                    className="px-4 py-2 rounded-xl border text-xs"
                  >
                    {language === 'ar' ? 'اختيار صنف آخر' : 'Change Item'}
                  </button>
                  <button
                    type="button"
                    onClick={confirmAddFoodToSlot}
                    className="px-6 py-2.5 rounded-xl bg-[#4D6A34] hover:bg-[#3B5323] text-white font-bold text-xs shadow-md shadow-[#4D6A34]/20"
                  >
                    {t.common.confirm}
                  </button>
                </div>
              </div>
            ) : (
              /* Search and Selection List */
              <div className="space-y-3">
                {/* Search Bar */}
                <div className="relative">
                  <Search className="w-4 h-4 absolute top-3 left-3 text-stone-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t.nutrition.searchPlaceholder}
                    className="w-full ps-9 pe-4 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-xs focus:ring-2 focus:ring-[#4D6A34]"
                  />
                </div>

                {/* Category Filter Pills */}
                <div className="flex gap-1.5 overflow-x-auto pb-1 text-[11px]">
                  {[
                    { id: 'all', label: t.nutrition.categoryAll },
                    { id: 'egyptian', label: t.nutrition.categoryEgyptian },
                    { id: 'arabic', label: t.nutrition.categoryArabic },
                    { id: 'international', label: t.nutrition.categoryInternational },
                    { id: 'basic', label: t.nutrition.categoryBasic },
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`px-3 py-1 rounded-full whitespace-nowrap transition-colors ${
                        selectedCategory === cat.id
                          ? 'bg-[#4D6A34] text-white font-bold'
                          : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>

                {/* Foods list */}
                <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1">
                  {filteredFoods.length > 0 ? (
                    filteredFoods.map((food) => (
                      <button
                        key={food.id}
                        onClick={() => {
                          setSelectedFood(food);
                          setGramsInput(food.gramsPerServing || 100);
                        }}
                        className="w-full p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 hover:border-[#4D6A34] text-start flex items-center justify-between text-xs transition-colors hover:bg-stone-50 dark:hover:bg-stone-800/50"
                      >
                        <div>
                          <span className="font-bold block text-stone-800 dark:text-stone-200">
                            {language === 'ar' ? food.nameAr : food.nameEn}
                          </span>
                          <span className="text-[10px] text-stone-400">
                            {food.caloriesPer100g} kcal / 100g • P: {food.proteinPer100g}g • C: {food.carbsPer100g}g • F:{' '}
                            {food.fatPer100g}g
                          </span>
                        </div>
                        <span className="text-[11px] font-semibold text-[#4D6A34] dark:text-[#85A947]">
                          + {food.gramsPerServing}g
                        </span>
                      </button>
                    ))
                  ) : (
                    <div className="text-center py-6 space-y-3">
                      <p className="text-xs text-stone-400">{t.nutrition.noFoodsFound}</p>
                      <button
                        type="button"
                        onClick={searchVerifiedNutritionWithAi}
                        disabled={isSearchingWithAi}
                        className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs flex items-center justify-center gap-2 mx-auto disabled:opacity-50"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>{isSearchingWithAi ? t.common.loading : t.nutrition.searchWithAi}</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Add Custom Food Trigger */}
                <div className="pt-2 border-t border-stone-200 dark:border-stone-800 flex justify-between items-center text-xs">
                  <button
                    type="button"
                    onClick={() => setShowCreateCustom(true)}
                    className="font-bold text-[#4D6A34] dark:text-[#85A947] hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{t.nutrition.customFood}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
