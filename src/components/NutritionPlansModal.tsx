import React, { useState } from 'react';
import { NutritionPlan, Language } from '../types/index.ts';
import { translations } from '../data/translations.ts';
import { NUTRITION_PLANS } from '../data/workoutPrograms.ts';
import { BookOpen, Check, ShieldCheck, ShoppingCart, RefreshCw, Sparkles } from 'lucide-react';

interface NutritionPlansModalProps {
  language: Language;
  onClose: () => void;
  onApplyPlanCalories?: (targetCals: number, p: number, c: number, f: number) => void;
}

export const NutritionPlansModal: React.FC<NutritionPlansModalProps> = ({
  language,
  onClose,
  onApplyPlanCalories,
}) => {
  const t = translations[language];
  const [selectedPlan, setSelectedPlan] = useState<NutritionPlan>(NUTRITION_PLANS[0]);
  const [activeTab, setActiveTab] = useState<'meals' | 'shopping' | 'storage' | 'alternatives'>('meals');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/70 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-[#1a2217] w-full max-w-2xl rounded-2xl shadow-2xl border border-stone-200 dark:border-stone-800 p-5 my-auto max-h-[90vh] overflow-y-auto text-stone-900 dark:text-stone-100">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-[#EBF2E8] dark:bg-[#283620] text-[#4D6A34] dark:text-[#85A947]">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold">{t.nutrition.mealPlans}</h3>
              <p className="text-[11px] text-stone-500">
                {language === 'ar' ? 'خطط تغذية متكاملة وقابلة للتعديل' : 'Customizable scientific nutrition plans'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-600 font-bold">
            ✕
          </button>
        </div>

        {/* Plan Selector Carousel/Tabs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-4">
          {NUTRITION_PLANS.map((plan) => (
            <button
              key={plan.id}
              onClick={() => setSelectedPlan(plan)}
              className={`p-3 rounded-xl border text-start transition-all ${
                selectedPlan.id === plan.id
                  ? 'border-[#4D6A34] bg-[#EBF2E8] dark:bg-[#283620] shadow-xs'
                  : 'border-stone-200 dark:border-stone-700 hover:bg-stone-50'
              }`}
            >
              <span className="text-[10px] font-bold text-[#4D6A34] dark:text-[#85A947] block">
                {language === 'ar' ? plan.tagAr : plan.tagEn}
              </span>
              <h4 className="text-xs font-bold mt-0.5 line-clamp-1">
                {language === 'ar' ? plan.titleAr : plan.titleEn}
              </h4>
              <span className="text-[11px] text-stone-400 block mt-1">
                {plan.targetCalories} kcal • P: {plan.proteinG}g
              </span>
            </button>
          ))}
        </div>

        {/* Plan Overview Card */}
        <div className="p-4 rounded-xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200 dark:border-stone-700 mb-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-stone-900 dark:text-stone-100">
              {language === 'ar' ? selectedPlan.titleAr : selectedPlan.titleEn}
            </h3>
            <span className="text-xs font-black text-[#4D6A34] dark:text-[#85A947]">
              {selectedPlan.targetCalories} kcal / day
            </span>
          </div>
          <p className="text-xs text-stone-600 dark:text-stone-300 mt-1">
            {language === 'ar' ? selectedPlan.descriptionAr : selectedPlan.descriptionEn}
          </p>

          <div className="grid grid-cols-4 gap-2 text-center text-xs mt-3 pt-3 border-t border-stone-200 dark:border-stone-700">
            <div>
              <span className="text-[10px] text-stone-400 block">{t.common.protein}</span>
              <span className="font-bold text-sky-600">{selectedPlan.proteinG}g</span>
            </div>
            <div>
              <span className="text-[10px] text-stone-400 block">{t.common.carbs}</span>
              <span className="font-bold text-amber-600">{selectedPlan.carbsG}g</span>
            </div>
            <div>
              <span className="text-[10px] text-stone-400 block">{t.common.fat}</span>
              <span className="font-bold text-emerald-600">{selectedPlan.fatG}g</span>
            </div>
            <div>
              <span className="text-[10px] text-stone-400 block">{t.common.fiber}</span>
              <span className="font-bold text-purple-600">{selectedPlan.fiberG}g</span>
            </div>
          </div>
        </div>

        {/* Sub-tabs inside plan */}
        <div className="flex gap-2 border-b border-stone-200 dark:border-stone-800 pb-2 mb-3 text-xs font-bold">
          <button
            onClick={() => setActiveTab('meals')}
            className={`px-3 py-1 rounded-lg transition-colors ${
              activeTab === 'meals' ? 'bg-[#4D6A34] text-white' : 'text-stone-500'
            }`}
          >
            {language === 'ar' ? 'الوجبات المقترحة' : 'Suggested Meals'}
          </button>
          <button
            onClick={() => setActiveTab('shopping')}
            className={`px-3 py-1 rounded-lg transition-colors ${
              activeTab === 'shopping' ? 'bg-[#4D6A34] text-white' : 'text-stone-500'
            }`}
          >
            {language === 'ar' ? 'قائمة التسوق' : 'Shopping List'}
          </button>
          <button
            onClick={() => setActiveTab('storage')}
            className={`px-3 py-1 rounded-lg transition-colors ${
              activeTab === 'storage' ? 'bg-[#4D6A34] text-white' : 'text-stone-500'
            }`}
          >
            {language === 'ar' ? 'نصائح الحفظ السليم' : 'Storage Tips'}
          </button>
          <button
            onClick={() => setActiveTab('alternatives')}
            className={`px-3 py-1 rounded-lg transition-colors ${
              activeTab === 'alternatives' ? 'bg-[#4D6A34] text-white' : 'text-stone-500'
            }`}
          >
            {language === 'ar' ? 'البدائل الغذائية' : 'Alternatives'}
          </button>
        </div>

        {/* Content based on sub-tab */}
        {activeTab === 'meals' && (
          <div className="space-y-3">
            {(language === 'ar' ? selectedPlan.mealsAr : selectedPlan.mealsEn).map((m, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200 dark:border-stone-700 text-xs"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-extrabold text-stone-900 dark:text-stone-100">{m.name}</span>
                  <span className="text-[10px] text-stone-400">{m.time} • ~{m.approxCalories} kcal</span>
                </div>
                <ul className="list-disc list-inside space-y-0.5 text-stone-600 dark:text-stone-300 text-[11px]">
                  {m.items.map((it, i) => (
                    <li key={i}>{it}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'shopping' && (
          <div className="p-4 rounded-xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200 dark:border-stone-700 text-xs space-y-2">
            <h4 className="font-bold flex items-center gap-1.5 text-stone-800 dark:text-stone-200">
              <ShoppingCart className="w-4 h-4 text-[#4D6A34]" />
              <span>{language === 'ar' ? 'مكونات التسوق الأسبوعية' : 'Weekly Grocery Items'}</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              {(language === 'ar' ? selectedPlan.shoppingListAr : selectedPlan.shoppingListEn).map((item, idx) => (
                <div key={idx} className="flex items-center gap-2 p-2 rounded-lg bg-white dark:bg-stone-800 text-xs">
                  <Check className="w-3.5 h-3.5 text-[#4D6A34]" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'storage' && (
          <div className="p-4 rounded-xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200 dark:border-stone-700 text-xs space-y-2">
            <h4 className="font-bold flex items-center gap-1.5 text-stone-800 dark:text-stone-200">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>{language === 'ar' ? 'إرشادات سلامة الغذاء والتخزين الصحي' : 'Food Safety & Meal Prep Storage'}</span>
            </h4>
            <p className="text-stone-600 dark:text-stone-300 leading-relaxed text-xs">
              {language === 'ar' ? selectedPlan.safeStorageTipsAr : selectedPlan.safeStorageTipsEn}
            </p>
          </div>
        )}

        {activeTab === 'alternatives' && (
          <div className="p-4 rounded-xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200 dark:border-stone-700 text-xs space-y-2">
            <h4 className="font-bold flex items-center gap-1.5 text-stone-800 dark:text-stone-200">
              <RefreshCw className="w-4 h-4 text-[#4D6A34]" />
              <span>{language === 'ar' ? 'خيارات الاستبدال المرنة' : 'Flexible Food Substitutions'}</span>
            </h4>
            <ul className="list-disc list-inside space-y-1 text-stone-600 dark:text-stone-300 text-xs">
              {(language === 'ar' ? selectedPlan.alternativesAr : selectedPlan.alternativesEn).map((alt, idx) => (
                <li key={idx}>{alt}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Disclaimer footer */}
        <p className="text-[10px] text-stone-400 mt-4 italic text-center">
          {language === 'ar'
            ? 'تنبيه: الخطط الغذائية تثقيفية وإرشادية وليست بديلاً عن العلاج الطبي أو المتابعة السريرية.'
            : 'Notice: Nutrition plans are educational guidelines and not medical treatment.'}
        </p>
      </div>
    </div>
  );
};
