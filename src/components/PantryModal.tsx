import React, { useState } from 'react';
import { PantryItem, GroceryItem, Language } from '../types/index.ts';
import { translations } from '../data/translations.ts';
import {
  ShoppingBag,
  Plus,
  Trash2,
  Check,
  RefreshCw,
  Sparkles,
  CheckSquare,
  Square,
  DollarSign,
  Info,
} from 'lucide-react';

interface PantryModalProps {
  language: Language;
  pantryItems: PantryItem[];
  groceryItems: GroceryItem[];
  onUpdatePantry: (items: PantryItem[]) => void;
  onUpdateGrocery: (items: GroceryItem[]) => void;
  onClose: () => void;
  onAskCoachAboutPantry?: () => void;
}

export const PantryModal: React.FC<PantryModalProps> = ({
  language,
  pantryItems,
  groceryItems,
  onUpdatePantry,
  onUpdateGrocery,
  onClose,
  onAskCoachAboutPantry,
}) => {
  const t = translations[language];

  const [activeTab, setActiveTab] = useState<'pantry' | 'substitutions' | 'groceries'>('pantry');
  const [newPantryName, setNewPantryName] = useState<string>('');
  const [newPantryQty, setNewPantryQty] = useState<string>('');

  // Grocery new item
  const [newGroceryName, setNewGroceryName] = useState<string>('');
  const [newGroceryPrice, setNewGroceryPrice] = useState<number>(0);

  // Substitution target selector
  const [substitutionTarget, setSubstitutionTarget] = useState<string>('chicken');

  const addPantryItem = () => {
    if (!newPantryName) return;
    const newItem: PantryItem = {
      id: `pantry_${Date.now()}`,
      nameEn: newPantryName,
      nameAr: newPantryName,
      category: 'general',
      quantity: newPantryQty || '1 unit',
    };
    onUpdatePantry([...pantryItems, newItem]);
    setNewPantryName('');
    setNewPantryQty('');
  };

  const removePantryItem = (id: string) => {
    onUpdatePantry(pantryItems.filter((p) => p.id !== id));
  };

  const addGroceryItem = () => {
    if (!newGroceryName) return;
    const newItem: GroceryItem = {
      id: `groc_${Date.now()}`,
      nameEn: newGroceryName,
      nameAr: newGroceryName,
      amount: '1 unit',
      category: 'general',
      checked: false,
      userPrice: newGroceryPrice || undefined,
      currency: 'EGP',
    };
    onUpdateGrocery([...groceryItems, newItem]);
    setNewGroceryName('');
    setNewGroceryPrice(0);
  };

  const toggleGroceryChecked = (id: string) => {
    onUpdateGrocery(
      groceryItems.map((g) => (g.id === id ? { ...g, checked: !g.checked } : g))
    );
  };

  const removeGroceryItem = (id: string) => {
    onUpdateGrocery(groceryItems.filter((g) => g.id !== id));
  };

  // Pre-calculated verified substitutions data
  const SUBSTITUTION_PRESETS: Record<
    string,
    {
      nameEn: string;
      nameAr: string;
      originalNutrition: string;
      options: {
        altEn: string;
        altAr: string;
        reasonEn: string;
        reasonAr: string;
        budgetFriendly: boolean;
      }[];
    }
  > = {
    chicken: {
      nameEn: 'Chicken Breast (High Protein / Lean)',
      nameAr: 'صدور الدجاج (بروتين عالي / قليل الدهون)',
      originalNutrition: '100g = 165 kcal, 31g protein, 3.6g fat',
      options: [
        {
          altEn: 'Canned Tuna in water (140g drained)',
          altAr: 'تونة معلبة مصفاة في ماء',
          reasonEn: 'Matches high lean protein (30g protein) with zero prep and shelf stability.',
          reasonAr: 'توفر 30 جم بروتين صافي بدون أي تحضير وسهلة الحفظ.',
          budgetFriendly: true,
        },
        {
          altEn: 'Egyptian Gibna Areesh (Cottage Cheese) (200g)',
          altAr: 'جبنة قريش بلدية (200 جم)',
          reasonEn: 'Very budget-friendly in Egypt; provides ~24g slow-digesting casein protein.',
          reasonAr: 'اقتصادية جداً وتوفر 24 جم بروتين كازين بطيء الامتصاص.',
          budgetFriendly: true,
        },
        {
          altEn: '4 Boiled Egg Whites + 1 Whole Egg',
          altAr: '4 بياض بيض مسلوق + بيضة كاملة',
          reasonEn: 'High biological value protein (~20g) with very low saturated fat.',
          reasonAr: 'أعلى قيمة حيوية للبروتين (~20 جم) مع دهون صحية منخفضة.',
          budgetFriendly: true,
        },
      ],
    },
    oil: {
      nameEn: 'Cooking Oil / Butter (High Calorie Density)',
      nameAr: 'زيوت الطهي والسمن (كثافة سعرات عالية)',
      originalNutrition: '1 tbsp (14g) = ~120 kcal, 14g fat',
      options: [
        {
          altEn: 'Olive Oil spray (controlled 1-second mist)',
          altAr: 'بخاخ زيت الزيتون (رشة خفيفة ثانية واحدة)',
          reasonEn: 'Reduces fat from 14g (~120 kcal) down to 1-2g (~15 kcal) per pan coating.',
          reasonAr: 'يقلل الدهون من 14 جم (120 سعرة) إلى 1-2 جم (15 سعرة) فقط لدهن المقلاة.',
          budgetFriendly: false,
        },
        {
          altEn: 'Simmering with broth or water deglazing',
          altAr: 'التشويح بالمرق الخفيف أو رذاذ الماء',
          reasonEn: 'Eliminates added fats entirely when cooking vegetables and chicken.',
          reasonAr: 'يلغي الدهون المضافة تماماً أثناء تسوية الخضار والدجاج.',
          budgetFriendly: true,
        },
      ],
    },
    rice: {
      nameEn: 'White Rice (Starchy Carbohydrate)',
      nameAr: 'الأرز الأبيض (كربوهيدرات نشوية)',
      originalNutrition: '100g cooked = 130 kcal, 28g carbs',
      options: [
        {
          altEn: 'Egyptian Baladi Bread (1 loaf / 100g)',
          altAr: 'عيش بلدي مصري بالردة (رغيف واحد)',
          reasonEn: 'Provides high dietary bran fiber (6.8g) which slows glucose spikes.',
          reasonAr: 'يحتوي على ألياف الردة العالية (6.8 جم) مما يمنح شبعاً أطول واستقراراً لسكر الدم.',
          budgetFriendly: true,
        },
        {
          altEn: 'Baked Sweet Potato (Batata Mashweya)',
          altAr: 'بطاطا حلوة مشوية',
          reasonEn: 'Lower calorie density (90 kcal/100g) and rich in beta-carotene and potassium.',
          reasonAr: 'أقل في كثافة السعرات (90 سعرة/100 جم) وغنية بالبوتاسيوم وفيتامين أ.',
          budgetFriendly: true,
        },
      ],
    },
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/70 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-[#1a2217] w-full max-w-2xl rounded-2xl shadow-2xl border border-stone-200 dark:border-stone-800 p-5 my-auto max-h-[90vh] overflow-y-auto text-stone-900 dark:text-stone-100">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-[#EBF2E8] dark:bg-[#283620] text-[#4D6A34] dark:text-[#85A947]">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold">{t.nutrition.pantryManager}</h3>
              <p className="text-[11px] text-stone-500">
                {language === 'ar' ? 'إدارة المكونات المتاحة بالبيت والبدائل الذكية' : 'Home pantry inventory & smart substitution guide'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-600 font-bold">
            ✕
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex gap-2 border-b border-stone-200 dark:border-stone-800 pb-2 mb-4 text-xs font-bold">
          <button
            onClick={() => setActiveTab('pantry')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              activeTab === 'pantry' ? 'bg-[#4D6A34] text-white' : 'text-stone-500'
            }`}
          >
            {language === 'ar' ? 'الأطعمة في بيتي' : 'Foods at Home'} ({pantryItems.length})
          </button>

          <button
            onClick={() => setActiveTab('substitutions')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              activeTab === 'substitutions' ? 'bg-[#4D6A34] text-white' : 'text-stone-500'
            }`}
          >
            {language === 'ar' ? 'بدائل الأطعمة والميزانية' : 'Food Substitutions'}
          </button>

          <button
            onClick={() => setActiveTab('groceries')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              activeTab === 'groceries' ? 'bg-[#4D6A34] text-white' : 'text-stone-500'
            }`}
          >
            {language === 'ar' ? 'قائمة المشتريات' : 'Smart Grocery List'} ({groceryItems.length})
          </button>
        </div>

        {/* Tab 1: Foods at Home */}
        {activeTab === 'pantry' && (
          <div className="space-y-4">
            {/* Quick add item */}
            <div className="p-3.5 rounded-xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200 dark:border-stone-700 flex gap-2">
              <input
                type="text"
                value={newPantryName}
                onChange={(e) => setNewPantryName(e.target.value)}
                placeholder={language === 'ar' ? 'اسم الصنف (مثل: بيض، أرز، تونة...)' : 'Item name (e.g. Eggs, Rice, Tuna...)'}
                className="flex-1 px-3 py-1.5 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-xs"
              />
              <input
                type="text"
                value={newPantryQty}
                onChange={(e) => setNewPantryQty(e.target.value)}
                placeholder={language === 'ar' ? 'الكمية (مثل: 1 كجم)' : 'Quantity (e.g. 1kg)'}
                className="w-24 px-2 py-1.5 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-xs"
              />
              <button
                type="button"
                onClick={addPantryItem}
                className="px-3 py-1.5 rounded-lg bg-[#4D6A34] text-white text-xs font-bold flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{t.common.add}</span>
              </button>
            </div>

            {/* Pantry List */}
            <div className="space-y-1.5 max-h-64 overflow-y-auto">
              {pantryItems.map((item) => (
                <div
                  key={item.id}
                  className="p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#4D6A34]" />
                    <span className="font-bold text-stone-800 dark:text-stone-200">
                      {language === 'ar' ? item.nameAr : item.nameEn}
                    </span>
                    {item.quantity && <span className="text-[11px] text-stone-400">({item.quantity})</span>}
                  </div>
                  <button
                    onClick={() => removePantryItem(item.id)}
                    className="text-stone-300 hover:text-rose-500 p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {onAskCoachAboutPantry && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onAskCoachAboutPantry();
                }}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#4D6A34] to-[#6E9447] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs"
              >
                <Sparkles className="w-4 h-4" />
                <span>{language === 'ar' ? 'طلب اقتراح وجبة من مكونات بيتي بواسطة المدرب' : 'Ask AI Coach to suggest a meal with my pantry'}</span>
              </button>
            )}
          </div>
        )}

        {/* Tab 2: Smart Substitutions */}
        {activeTab === 'substitutions' && (
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold block mb-1">
                {language === 'ar' ? 'اختر الصنف المراد استبداله' : 'Select Food to Substitute'}
              </label>
              <select
                value={substitutionTarget}
                onChange={(e) => setSubstitutionTarget(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-xs font-bold"
              >
                <option value="chicken">
                  {language === 'ar' ? 'صدور دجاج (بروتين عالي)' : 'Chicken Breast (High Protein)'}
                </option>
                <option value="oil">
                  {language === 'ar' ? 'زيوت الطهي والسمن (دهون وسعرات)' : 'Cooking Oil / Butter (Fats & Calories)'}
                </option>
                <option value="rice">
                  {language === 'ar' ? 'الأرز الأبيض (كربوهيدرات ونشويات)' : 'White Rice (Carbohydrates)'}
                </option>
              </select>
            </div>

            {SUBSTITUTION_PRESETS[substitutionTarget] && (
              <div className="space-y-3">
                <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200 dark:border-stone-700 text-xs">
                  <span className="font-bold text-stone-700 dark:text-stone-300">
                    {language === 'ar'
                      ? SUBSTITUTION_PRESETS[substitutionTarget].nameAr
                      : SUBSTITUTION_PRESETS[substitutionTarget].nameEn}
                  </span>
                  <p className="text-[11px] text-stone-400 mt-0.5">
                    {SUBSTITUTION_PRESETS[substitutionTarget].originalNutrition}
                  </p>
                </div>

                <div className="space-y-2">
                  {SUBSTITUTION_PRESETS[substitutionTarget].options.map((opt, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-[#4D6A34] dark:text-[#85A947]">
                          {language === 'ar' ? opt.altAr : opt.altEn}
                        </span>
                        {opt.budgetFriendly && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded font-bold bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
                            {language === 'ar' ? 'اقتصادي' : 'Budget Friendly'}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-stone-500 dark:text-stone-400">
                        {language === 'ar' ? opt.reasonAr : opt.reasonEn}
                      </p>
                    </div>
                  ))}
                </div>

                <p className="text-[10px] text-stone-400 flex items-center gap-1.5 italic">
                  <Info className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>
                    {language === 'ar'
                      ? 'لا نزعم تطابق قيمتين غذائياً إلا إذا أكدت بيانات الماكروز ذلك.'
                      : 'We do not claim two foods are nutritionally identical unless validated by data.'}
                  </span>
                </p>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Grocery List */}
        {activeTab === 'groceries' && (
          <div className="space-y-4">
            {/* Add grocery item */}
            <div className="p-3.5 rounded-xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200 dark:border-stone-700 flex gap-2">
              <input
                type="text"
                value={newGroceryName}
                onChange={(e) => setNewGroceryName(e.target.value)}
                placeholder={language === 'ar' ? 'اسم الصنف المراد شراؤه...' : 'Grocery item to buy...'}
                className="flex-1 px-3 py-1.5 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-xs"
              />
              <input
                type="number"
                value={newGroceryPrice || ''}
                onChange={(e) => setNewGroceryPrice(Number(e.target.value))}
                placeholder={language === 'ar' ? 'السعر (ج.م)' : 'Price (EGP)'}
                className="w-24 px-2 py-1.5 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-xs"
              />
              <button
                type="button"
                onClick={addGroceryItem}
                className="px-3 py-1.5 rounded-lg bg-[#4D6A34] text-white text-xs font-bold"
              >
                {t.common.add}
              </button>
            </div>

            {/* List */}
            <div className="space-y-1.5 max-h-64 overflow-y-auto">
              {groceryItems.map((g) => (
                <div
                  key={g.id}
                  className={`p-2.5 rounded-xl border flex items-center justify-between text-xs transition-colors ${
                    g.checked
                      ? 'bg-stone-50 dark:bg-stone-900 border-stone-200 dark:border-stone-800 opacity-60'
                      : 'bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => toggleGroceryChecked(g.id)}
                    className="flex items-center gap-2.5 text-start flex-1"
                  >
                    {g.checked ? (
                      <CheckSquare className="w-4 h-4 text-[#4D6A34]" />
                    ) : (
                      <Square className="w-4 h-4 text-stone-400" />
                    )}
                    <span className={g.checked ? 'line-through text-stone-400' : 'font-bold'}>
                      {language === 'ar' ? g.nameAr : g.nameEn}
                    </span>
                    {g.amount && <span className="text-[11px] text-stone-400">({g.amount})</span>}
                  </button>

                  <div className="flex items-center gap-3">
                    {g.userPrice !== undefined && g.userPrice > 0 && (
                      <span className="font-extrabold text-[#4D6A34] dark:text-[#85A947]">
                        {g.userPrice} {g.currency || 'EGP'}
                      </span>
                    )}
                    <button
                      onClick={() => removeGroceryItem(g.id)}
                      className="text-stone-300 hover:text-rose-500 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <p className="text-[10px] text-stone-400 italic">
              {language === 'ar'
                ? 'ملاحظة: لا نقوم باختلاق أسعار من الخيال؛ يتم عرض الأسعار فقط عند إدخالها من قبلك أو من مصادر محلية موثوقة.'
                : 'Note: Prices are only displayed when entered by you or verified from local sources without fabrication.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
