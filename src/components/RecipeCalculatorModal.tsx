import React, { useState } from 'react';
import { FoodItem, Recipe, RecipeIngredient, Language, MealType, LoggedMealItem } from '../types/index.ts';
import { translations } from '../data/translations.ts';
import { calculateRecipeNutrition } from '../utils/nutritionCalculations.ts';
import { ChefHat, Plus, Trash2, Check, Info } from 'lucide-react';

interface RecipeCalculatorModalProps {
  language: Language;
  allFoods: FoodItem[];
  savedRecipes: Recipe[];
  onSaveRecipe: (recipe: Recipe) => void;
  onAddServingToDiary: (item: LoggedMealItem, mealType: MealType) => void;
  onClose: () => void;
}

export const RecipeCalculatorModal: React.FC<RecipeCalculatorModalProps> = ({
  language,
  allFoods,
  savedRecipes,
  onSaveRecipe,
  onAddServingToDiary,
  onClose,
}) => {
  const t = translations[language];

  const [activeTab, setActiveTab] = useState<'create' | 'saved'>('create');
  const [recipeName, setRecipeName] = useState<string>('');
  const [servings, setServings] = useState<number>(4);
  const [selectedFoodId, setSelectedFoodId] = useState<string>(allFoods[0]?.id || '');
  const [ingredientGrams, setIngredientGrams] = useState<number>(100);
  const [ingredients, setIngredients] = useState<RecipeIngredient[]>([]);

  // Calculate totals
  const computed = calculateRecipeNutrition(ingredients, servings);

  const addIngredient = () => {
    const food = allFoods.find((f) => f.id === selectedFoodId);
    if (!food) return;

    const factor = ingredientGrams / 100;
    const newIng: RecipeIngredient = {
      foodId: food.id,
      nameEn: food.nameEn,
      nameAr: food.nameAr,
      grams: ingredientGrams,
      calories: Math.round(food.caloriesPer100g * factor),
      protein: Math.round(food.proteinPer100g * factor * 10) / 10,
      carbs: Math.round(food.carbsPer100g * factor * 10) / 10,
      fat: Math.round(food.fatPer100g * factor * 10) / 10,
      fiber: Math.round(food.fiberPer100g * factor * 10) / 10,
    };

    setIngredients([...ingredients, newIng]);
  };

  const removeIngredient = (idx: number) => {
    setIngredients(ingredients.filter((_, i) => i !== idx));
  };

  const handleSaveRecipe = () => {
    if (!recipeName || ingredients.length === 0) return;

    const newRecipe: Recipe = {
      id: `recipe_${Date.now()}`,
      nameEn: recipeName,
      nameAr: recipeName,
      servings,
      totalWeightGrams: computed.totalWeightGrams,
      ingredients,
      caloriesTotal: computed.caloriesTotal,
      proteinTotal: computed.proteinTotal,
      carbsTotal: computed.carbsTotal,
      fatTotal: computed.fatTotal,
      fiberTotal: computed.fiberTotal,
      caloriesPerServing: computed.perServing.calories,
      proteinPerServing: computed.perServing.protein,
      carbsPerServing: computed.perServing.carbs,
      fatPerServing: computed.perServing.fat,
      fiberPerServing: computed.perServing.fiber,
      isCustom: true,
    };

    onSaveRecipe(newRecipe);
    setActiveTab('saved');
  };

  const logServingOfRecipe = (recipe: Recipe, mealType: MealType = 'lunch') => {
    const logged: LoggedMealItem = {
      id: `rec_log_${Date.now()}`,
      foodId: recipe.id,
      nameEn: `${recipe.nameEn} (1 Serving)`,
      nameAr: `${recipe.nameAr} (حصة واحدة)`,
      grams: Math.round(recipe.totalWeightGrams / recipe.servings),
      calories: recipe.caloriesPerServing,
      protein: recipe.proteinPerServing,
      carbs: recipe.carbsPerServing,
      fat: recipe.fatPerServing,
      fiber: recipe.fiberPerServing,
      mealType,
      loggedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    onAddServingToDiary(logged, mealType);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/70 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-[#1a2217] w-full max-w-2xl rounded-2xl shadow-2xl border border-stone-200 dark:border-stone-800 p-5 my-auto max-h-[90vh] overflow-y-auto text-stone-900 dark:text-stone-100">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-[#EBF2E8] dark:bg-[#283620] text-[#4D6A34] dark:text-[#85A947]">
              <ChefHat className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold">{t.recipe.title}</h3>
              <p className="text-[11px] text-stone-500">{t.recipe.subtitle}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-600 font-bold">
            ✕
          </button>
        </div>

        {/* Tab switch (Build Recipe vs Saved Recipes) */}
        <div className="flex gap-2 border-b border-stone-200 dark:border-stone-800 pb-2 mb-4">
          <button
            onClick={() => setActiveTab('create')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              activeTab === 'create'
                ? 'bg-[#4D6A34] text-white'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            {language === 'ar' ? 'حساب وصفة جديدة' : 'New Recipe'}
          </button>
          <button
            onClick={() => setActiveTab('saved')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              activeTab === 'saved'
                ? 'bg-[#4D6A34] text-white'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            {language === 'ar' ? 'الوصفات المحفوظة' : 'Saved Recipes'} ({savedRecipes.length})
          </button>
        </div>

        {activeTab === 'create' ? (
          <div className="space-y-4">
            {/* Recipe Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold block mb-1">{t.recipe.recipeName}</label>
                <input
                  type="text"
                  value={recipeName}
                  onChange={(e) => setRecipeName(e.target.value)}
                  placeholder={language === 'ar' ? 'مثل: صينية بطاطس بالفراخ دايت' : 'e.g. Diet Baked Chicken & Potatoes'}
                  className="w-full px-3 py-1.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-xs"
                />
              </div>
              <div>
                <label className="text-xs font-semibold block mb-1">{t.recipe.servingsCount}</label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={servings}
                  onChange={(e) => setServings(Math.max(1, Number(e.target.value)))}
                  className="w-full px-3 py-1.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-xs"
                />
              </div>
            </div>

            {/* Add Ingredients Section */}
            <div className="p-3.5 rounded-xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200 dark:border-stone-700 space-y-2">
              <label className="text-xs font-bold block">{t.recipe.addIngredient}</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <select
                  value={selectedFoodId}
                  onChange={(e) => setSelectedFoodId(e.target.value)}
                  className="col-span-2 px-3 py-1.5 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-xs"
                >
                  {allFoods.map((f) => (
                    <option key={f.id} value={f.id}>
                      {language === 'ar' ? f.nameAr : f.nameEn} ({f.caloriesPer100g} kcal/100g)
                    </option>
                  ))}
                </select>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="1"
                    value={ingredientGrams}
                    onChange={(e) => setIngredientGrams(Math.max(1, Number(e.target.value)))}
                    className="w-20 px-2 py-1.5 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-xs"
                    placeholder="Grams"
                  />
                  <button
                    type="button"
                    onClick={addIngredient}
                    className="flex-1 px-3 py-1.5 rounded-lg bg-[#4D6A34] text-white text-xs font-bold flex items-center justify-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{t.common.add}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Current Ingredients List */}
            {ingredients.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-xs font-bold text-stone-500 block">{t.recipe.ingredientsList}:</span>
                {ingredients.map((ing, idx) => (
                  <div
                    key={idx}
                    className="p-2 rounded-lg bg-stone-100 dark:bg-stone-800/60 flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-bold">{language === 'ar' ? ing.nameAr : ing.nameEn}</span>
                      <span className="text-[11px] text-stone-400 ms-2">
                        {ing.grams}g • {ing.calories} kcal
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeIngredient(idx)}
                      className="text-stone-400 hover:text-rose-500 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Totals & Per Serving Calculations */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200 dark:border-stone-700">
                <span className="text-[10px] font-bold text-stone-400 block mb-1">{t.recipe.totals}</span>
                <div className="text-xl font-black text-stone-900 dark:text-stone-100">{computed.caloriesTotal} kcal</div>
                <div className="text-[11px] text-stone-500 mt-1">
                  P: {computed.proteinTotal}g • C: {computed.carbsTotal}g • F: {computed.fatTotal}g
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#EBF2E8] dark:bg-[#283620] border border-[#4D6A34]/20">
                <span className="text-[10px] font-bold text-[#4D6A34] dark:text-[#85A947] block mb-1">
                  {t.recipe.perServing} (1 / {servings})
                </span>
                <div className="text-xl font-black text-[#3B5323] dark:text-[#A7D184]">
                  {computed.perServing.calories} kcal
                </div>
                <div className="text-[11px] text-[#4D6A34] mt-1 font-semibold">
                  P: {computed.perServing.protein}g • C: {computed.perServing.carbs}g • F: {computed.perServing.fat}g
                </div>
              </div>
            </div>

            <p className="text-[11px] text-stone-400 flex items-center gap-1">
              <Info className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{t.recipe.estimateNotice}</span>
            </p>

            <button
              type="button"
              onClick={handleSaveRecipe}
              disabled={!recipeName || ingredients.length === 0}
              className="w-full py-2.5 rounded-xl bg-[#4D6A34] hover:bg-[#3B5323] disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-[#4D6A34]/20 transition-all"
            >
              <Check className="w-4 h-4" />
              <span>{t.recipe.saveRecipe}</span>
            </button>
          </div>
        ) : (
          /* Saved Recipes List */
          <div className="space-y-3">
            {savedRecipes.length === 0 ? (
              <p className="text-xs text-stone-400 text-center py-8">
                {language === 'ar' ? 'لا توجد وصفات محفوظة بعد.' : 'No saved recipes yet.'}
              </p>
            ) : (
              savedRecipes.map((rec) => (
                <div
                  key={rec.id}
                  className="p-3.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800/40 space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-stone-900 dark:text-stone-100">
                        {language === 'ar' ? rec.nameAr : rec.nameEn}
                      </h4>
                      <p className="text-[11px] text-stone-400">
                        {rec.servings} {t.common.servings} • Total: {rec.caloriesTotal} kcal
                      </p>
                    </div>
                    <div className="text-end">
                      <span className="font-extrabold text-[#4D6A34] dark:text-[#85A947]">
                        {rec.caloriesPerServing} kcal / {t.common.portion}
                      </span>
                      <span className="text-[10px] text-stone-400 block">
                        P: {rec.proteinPerServing}g • C: {rec.carbsPerServing}g • F: {rec.fatPerServing}g
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-1 border-t border-stone-200/50 dark:border-stone-700/50">
                    <button
                      onClick={() => logServingOfRecipe(rec, 'lunch')}
                      className="px-3 py-1 rounded-lg bg-[#4D6A34] text-white font-bold text-xs hover:bg-[#3B5323]"
                    >
                      + {language === 'ar' ? 'إضافة حصة لسجل اليوم' : 'Log 1 Serving'}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};
