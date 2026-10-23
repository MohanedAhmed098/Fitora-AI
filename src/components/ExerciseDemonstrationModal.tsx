import React from 'react';
import { X, ShieldAlert, ArrowLeftRight, CheckCircle2, AlertTriangle, Wind, Info } from 'lucide-react';
import { Exercise, Language } from '../types/index.ts';
import { ExerciseAnimationPlayer } from './ExerciseAnimationPlayer.tsx';

interface ExerciseDemonstrationModalProps {
  exercise: Exercise | null;
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  onSelectAlternative?: (altId: string) => void;
}

export const ExerciseDemonstrationModal: React.FC<ExerciseDemonstrationModalProps> = ({
  exercise,
  isOpen,
  onClose,
  language,
  onSelectAlternative,
}) => {
  if (!isOpen || !exercise) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/70 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white dark:bg-[#1a2217] w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden border border-stone-200 dark:border-stone-800 text-stone-900 dark:text-stone-100 my-8 transition-colors">
        
        {/* Header */}
        <div className="p-4 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between bg-stone-50/70 dark:bg-stone-800/40">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-base sm:text-lg">
                {language === 'ar' ? exercise.nameAr : exercise.nameEn}
              </h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-[#EBF2E8] dark:bg-[#283620] text-[#4D6A34] dark:text-[#85A947]">
                {exercise.exerciseType || 'Compound'}
              </span>
            </div>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
              {language === 'ar' ? exercise.primaryMuscleAr : exercise.primaryMuscleEn} • {language === 'ar' ? exercise.equipmentAr : exercise.equipmentEn}
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 space-y-5 max-h-[78vh] overflow-y-auto">
          {/* Animated Demonstration Player */}
          <ExerciseAnimationPlayer exercise={exercise} language={language} />

          {/* Primary & Secondary Muscles */}
          <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-[#151c13] border border-stone-200 dark:border-stone-800 text-xs space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="font-bold text-[#4D6A34] dark:text-[#85A947]">
                {language === 'ar' ? 'العضلة المستهدفة الأساسية:' : 'Primary Muscle Target:'}
              </span>
              <span>{language === 'ar' ? exercise.primaryMuscleAr : exercise.primaryMuscleEn}</span>
            </div>

            {exercise.secondaryMusclesEn && exercise.secondaryMusclesEn.length > 0 && (
              <div className="flex items-center gap-2 text-stone-500">
                <span className="font-semibold">
                  {language === 'ar' ? 'العضلات المساعدة:' : 'Secondary Muscles:'}
                </span>
                <span>
                  {language === 'ar' ? exercise.secondaryMusclesAr?.join('، ') : exercise.secondaryMusclesEn.join(', ')}
                </span>
              </div>
            )}
          </div>

          {/* Setup & Movement Technique Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 rounded-2xl bg-white dark:bg-[#151c13] border border-stone-200 dark:border-stone-800">
              <h4 className="font-extrabold text-[#4D6A34] dark:text-[#85A947] mb-1.5 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>{language === 'ar' ? 'وضع البداية والانطلاق' : 'Starting Setup Position'}</span>
              </h4>
              <p className="text-stone-600 dark:text-stone-300 leading-relaxed text-[11px]">
                {language === 'ar' ? exercise.startingPositionAr : exercise.startingPositionEn}
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-white dark:bg-[#151c13] border border-stone-200 dark:border-stone-800">
              <h4 className="font-extrabold text-[#4D6A34] dark:text-[#85A947] mb-1.5 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>{language === 'ar' ? 'مسار الحركة والانقباض' : 'Movement & Range of Motion'}</span>
              </h4>
              <p className="text-stone-600 dark:text-stone-300 leading-relaxed text-[11px]">
                {language === 'ar' ? exercise.movementAr : exercise.movementEn}
              </p>
            </div>
          </div>

          {/* Breathing Instruction */}
          <div className="p-3.5 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-900/40 text-xs flex items-start gap-2.5">
            <Wind className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-emerald-800 dark:text-emerald-300 block mb-0.5">
                {language === 'ar' ? 'التنفس الصحيح أثناء التمرين:' : 'Proper Breathing Technique:'}
              </span>
              <p className="text-emerald-950 dark:text-emerald-200 text-[11px] leading-relaxed">
                {language === 'ar' ? exercise.breathingAr : exercise.breathingEn}
              </p>
            </div>
          </div>

          {/* Safety Warnings & Common Mistakes */}
          <div className="space-y-3">
            {exercise.safetyNotesEn && (
              <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 text-xs flex items-start gap-2.5 text-amber-900 dark:text-amber-200">
                <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block mb-0.5">
                    {language === 'ar' ? 'إرشادات السلامة والوقاية:' : 'Safety & Injury Prevention:'}
                  </span>
                  <p className="text-[11px] leading-relaxed">
                    {language === 'ar' ? exercise.safetyNotesAr : exercise.safetyNotesEn}
                  </p>
                </div>
              </div>
            )}

            <div className="p-3.5 rounded-2xl bg-red-50/50 dark:bg-red-950/20 border border-red-200/70 dark:border-red-900/30 text-xs">
              <span className="font-bold text-red-800 dark:text-red-300 flex items-center gap-1.5 mb-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                <span>{language === 'ar' ? 'أخطاء شائعة يجب تجنبها:' : 'Common Mistakes to Avoid:'}</span>
              </span>
              <ul className="list-disc list-inside space-y-1 text-red-950 dark:text-red-200 text-[11px]">
                {(language === 'ar' ? exercise.commonMistakesAr : exercise.commonMistakesEn).map((m, idx) => (
                  <li key={idx}>{m}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Easier & Harder Variations */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-stone-50 dark:bg-[#151c13] border border-stone-200 dark:border-stone-800">
              <span className="text-[10px] uppercase font-bold text-stone-400 block mb-1">
                {language === 'ar' ? 'تعديل أسهل (للمبتدئين):' : 'Easier Progression:'}
              </span>
              <p className="font-semibold text-stone-700 dark:text-stone-300 text-[11px]">
                {language === 'ar' ? exercise.easierVariationAr : exercise.easierVariationEn}
              </p>
            </div>

            <div className="p-3 rounded-xl bg-stone-50 dark:bg-[#151c13] border border-stone-200 dark:border-stone-800">
              <span className="text-[10px] uppercase font-bold text-stone-400 block mb-1">
                {language === 'ar' ? 'تعديل أصعب (للمتقدمين):' : 'Harder Progression:'}
              </span>
              <p className="font-semibold text-stone-700 dark:text-stone-300 text-[11px]">
                {language === 'ar' ? exercise.harderVariationAr : exercise.harderVariationEn}
              </p>
            </div>
          </div>

          {/* Exercise Alternatives with Explained Differences */}
          {exercise.alternatives && exercise.alternatives.length > 0 && (
            <div className="p-4 rounded-2xl bg-[#EBF2E8]/60 dark:bg-[#283620]/30 border border-[#D4DFCD] dark:border-[#384c2d] space-y-2.5">
              <h4 className="font-bold text-xs text-[#3B5323] dark:text-[#85A947] flex items-center gap-1.5">
                <ArrowLeftRight className="w-4 h-4" />
                <span>{language === 'ar' ? 'بدائل مناسبة حسب الأدوات المتوفرة:' : 'Smart Equipment Alternatives:'}</span>
              </h4>

              <div className="space-y-2">
                {exercise.alternatives.map((alt) => (
                  <div
                    key={alt.exerciseId}
                    className="p-2.5 rounded-xl bg-white dark:bg-[#1a2217] border border-stone-200 dark:border-stone-800 flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-bold block text-stone-800 dark:text-stone-200">
                        {language === 'ar' ? alt.nameAr : alt.nameEn}
                      </span>
                      <span className="text-[10px] text-stone-500 dark:text-stone-400 block mt-0.5">
                        {language === 'ar' ? alt.differenceAr : alt.differenceEn}
                      </span>
                    </div>

                    {onSelectAlternative && (
                      <button
                        onClick={() => {
                          onSelectAlternative(alt.exerciseId);
                        }}
                        className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-[#4D6A34] text-white hover:bg-[#3B5323] transition-colors"
                      >
                        {language === 'ar' ? 'عرض البديل' : 'View'}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 border-t border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-[#151c13] flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-[#4D6A34] hover:bg-[#3B5323] text-white text-xs font-bold transition-all"
          >
            {language === 'ar' ? 'إغلاق' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
