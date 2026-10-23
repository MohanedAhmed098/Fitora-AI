import React, { useState } from 'react';
import { UserProfile, Language, ActivityLevel, PrimaryGoal, DietaryPattern, EquipmentType, WorkoutExperience } from '../types/index.ts';
import { translations } from '../data/translations.ts';
import { calculateBmr, calculateTdee, calculateNutritionTargets } from '../utils/nutritionCalculations.ts';
import { AlertCircle, Check, Sparkles, User, Dumbbell, Apple, Shield } from 'lucide-react';

interface OnboardingModalProps {
  initialProfile: UserProfile;
  onSave: (profile: UserProfile) => void;
  onClose?: () => void;
  isEditing?: boolean;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  initialProfile,
  onSave,
  onClose,
  isEditing = false,
}) => {
  const [step, setStep] = useState<number>(1);
  const [profile, setProfile] = useState<UserProfile>(initialProfile);
  const t = translations[profile.language];

  const isMinor = profile.age > 0 && profile.age < 18;

  const handleNext = () => {
    if (step < 5) {
      setStep((s) => s + 1);
    } else {
      finalizeProfile();
    }
  };

  const handleBack = () => {
    if (step > 1) setStep((s) => s - 1);
  };

  const finalizeProfile = (overrideProfile?: UserProfile) => {
    const p = overrideProfile || profile;
    const bmr = calculateBmr({
      gender: p.gender,
      weightKg: p.weightKg,
      heightCm: p.heightCm,
      age: p.age,
      isMinor: p.age < 18,
    });
    const tdee = calculateTdee(bmr, p.activityLevel);
    const targets = calculateNutritionTargets({
      tdee,
      weightKg: p.weightKg,
      age: p.age,
      primaryGoal: p.primaryGoal,
      isMinor: p.age < 18,
    });

    const completeProfile: UserProfile = {
      ...p,
      isMinor: p.age < 18,
      isOnboarded: true,
      dailyCalorieTarget: targets.calories,
      dailyProteinTarget: targets.proteinG,
      dailyCarbsTarget: targets.carbsG,
      dailyFatTarget: targets.fatG,
      dailyFiberTarget: targets.fiberG,
      waterTargetMl: targets.waterMl,
    };

    onSave(completeProfile);
  };

  const toggleEquipment = (eq: EquipmentType) => {
    const current = [...profile.equipment];
    const index = current.indexOf(eq);
    if (index >= 0) {
      current.splice(index, 1);
    } else {
      current.push(eq);
    }
    setProfile({ ...profile, equipment: current });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/70 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white dark:bg-[#1a2217] w-full max-w-xl rounded-2xl shadow-2xl border border-stone-200 dark:border-stone-800 p-6 my-auto text-stone-900 dark:text-stone-100 transition-colors">
        
        {/* Progress header */}
        <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 pb-4 mb-5">
          <div>
            <span className="text-xs font-bold text-[#4D6A34] dark:text-[#85A947] uppercase tracking-wider">
              {isEditing ? (profile.language === 'ar' ? 'تعديل الملف الشخصي' : 'Edit Profile') : `${profile.language === 'ar' ? 'الخطوة' : 'Step'} ${step} / 5`}
            </span>
            <h2 className="text-xl font-extrabold tracking-tight mt-0.5">
              {step === 1 && t.onboarding.stepLanguage}
              {step === 2 && t.onboarding.stepBasics}
              {step === 3 && t.onboarding.stepActivity}
              {step === 4 && t.onboarding.stepNutrition}
              {step === 5 && t.onboarding.stepEquipment}
            </h2>
          </div>
          {isEditing && onClose && (
            <button
              onClick={onClose}
              className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 text-sm font-semibold"
            >
              {t.common.close}
            </button>
          )}
        </div>

        {/* Step 1: Language & Units */}
        {step === 1 && (
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-semibold mb-2">{t.settings.language}</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setProfile({ ...profile, language: 'ar' })}
                  className={`p-4 rounded-xl border-2 text-center transition-all ${
                    profile.language === 'ar'
                      ? 'border-[#4D6A34] bg-[#EBF2E8] dark:bg-[#283620] text-[#3B5323] dark:text-[#A7D184] font-bold shadow-sm'
                      : 'border-stone-200 dark:border-stone-700 hover:border-stone-300'
                  }`}
                >
                  <span className="text-lg block font-cairo">العربية (Arabic)</span>
                  <span className="text-xs text-stone-500 dark:text-stone-400">واجهة كاملة باللغة العربية (RTL)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setProfile({ ...profile, language: 'en' })}
                  className={`p-4 rounded-xl border-2 text-center transition-all ${
                    profile.language === 'en'
                      ? 'border-[#4D6A34] bg-[#EBF2E8] dark:bg-[#283620] text-[#3B5323] dark:text-[#A7D184] font-bold shadow-sm'
                      : 'border-stone-200 dark:border-stone-700 hover:border-stone-300'
                  }`}
                >
                  <span className="text-lg block">English</span>
                  <span className="text-xs text-stone-500 dark:text-stone-400">English Interface (LTR)</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">{t.onboarding.units}</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setProfile({ ...profile, preferredUnits: 'metric' })}
                  className={`p-3 rounded-xl border-2 text-sm text-center transition-all ${
                    profile.preferredUnits === 'metric'
                      ? 'border-[#4D6A34] bg-[#EBF2E8] dark:bg-[#283620] text-[#4D6A34] dark:text-[#85A947] font-bold'
                      : 'border-stone-200 dark:border-stone-700'
                  }`}
                >
                  {t.onboarding.metric}
                </button>
                <button
                  type="button"
                  onClick={() => setProfile({ ...profile, preferredUnits: 'imperial' })}
                  className={`p-3 rounded-xl border-2 text-sm text-center transition-all ${
                    profile.preferredUnits === 'imperial'
                      ? 'border-[#4D6A34] bg-[#EBF2E8] dark:bg-[#283620] text-[#4D6A34] dark:text-[#85A947] font-bold'
                      : 'border-stone-200 dark:border-stone-700'
                  }`}
                >
                  {t.onboarding.imperial}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1">{profile.language === 'ar' ? 'اسم المستخدم' : 'Your Name'}</label>
              <input
                type="text"
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                placeholder="Ahmed / سارة"
                className="w-full px-4 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-[#4D6A34]"
              />
            </div>
          </div>
        )}

        {/* Step 2: Metrics */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold mb-1">{t.onboarding.age}</label>
                <input
                  type="number"
                  min="10"
                  max="100"
                  value={profile.age || ''}
                  onChange={(e) => setProfile({ ...profile, age: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 focus:ring-2 focus:ring-[#4D6A34]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">{t.onboarding.gender}</label>
                <select
                  value={profile.gender}
                  onChange={(e) => setProfile({ ...profile, gender: e.target.value as 'male' | 'female' })}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 focus:ring-2 focus:ring-[#4D6A34]"
                >
                  <option value="male">{t.onboarding.male}</option>
                  <option value="female">{t.onboarding.female}</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold mb-1">
                  {t.onboarding.height} ({profile.preferredUnits === 'metric' ? 'cm' : 'in'})
                </label>
                <input
                  type="number"
                  value={profile.heightCm || ''}
                  onChange={(e) => setProfile({ ...profile, heightCm: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 focus:ring-2 focus:ring-[#4D6A34]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">
                  {t.onboarding.currentWeight} ({profile.preferredUnits === 'metric' ? 'kg' : 'lbs'})
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={profile.weightKg || ''}
                  onChange={(e) => setProfile({ ...profile, weightKg: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 focus:ring-2 focus:ring-[#4D6A34]"
                />
              </div>
            </div>

            {/* Under 18 safety alert banner */}
            {isMinor && (
              <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs flex gap-2.5 items-start">
                <AlertCircle className="w-5 h-5 flex-shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
                <p className="leading-relaxed">
                  {t.onboarding.under18Warning}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Activity & Goal */}
        {step === 3 && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold mb-1">{t.onboarding.activityLevel}</label>
              <select
                value={profile.activityLevel}
                onChange={(e) => setProfile({ ...profile, activityLevel: e.target.value as ActivityLevel })}
                className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 focus:ring-2 focus:ring-[#4D6A34] text-xs"
              >
                <option value="sedentary">{t.onboarding.sedentary}</option>
                <option value="light">{t.onboarding.light}</option>
                <option value="moderate">{t.onboarding.moderate}</option>
                <option value="very_active">{t.onboarding.veryActive}</option>
                <option value="extra_active">{t.onboarding.extraActive}</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1">{t.onboarding.goal}</label>
              <div className="space-y-1.5">
                {[
                  { id: 'balanced', label: t.onboarding.goalBalanced },
                  { id: 'maintenance', label: t.onboarding.goalMaintenance },
                  { id: 'strength', label: t.onboarding.goalStrength },
                  { id: 'muscle_building', label: t.onboarding.goalMuscle },
                  { id: 'fitness', label: t.onboarding.goalFitness },
                ].map((g) => (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => setProfile({ ...profile, primaryGoal: g.id as PrimaryGoal })}
                    className={`w-full p-2.5 rounded-xl border text-xs text-start flex items-center justify-between transition-all ${
                      profile.primaryGoal === g.id
                        ? 'border-[#4D6A34] bg-[#EBF2E8] dark:bg-[#283620] font-bold text-[#3B5323] dark:text-[#A7D184]'
                        : 'border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800/50'
                    }`}
                  >
                    <span>{g.label}</span>
                    {profile.primaryGoal === g.id && <Check className="w-4 h-4 text-[#4D6A34]" />}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold mb-1">{t.onboarding.experience}</label>
                <select
                  value={profile.workoutExperience}
                  onChange={(e) => setProfile({ ...profile, workoutExperience: e.target.value as WorkoutExperience })}
                  className="w-full px-2.5 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-xs"
                >
                  <option value="beginner">{t.onboarding.beginner}</option>
                  <option value="intermediate">{t.onboarding.intermediate}</option>
                  <option value="advanced">{t.onboarding.advanced}</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">{t.onboarding.trainingDays}</label>
                <input
                  type="number"
                  min="1"
                  max="7"
                  value={profile.trainingDaysPerWeek}
                  onChange={(e) => setProfile({ ...profile, trainingDaysPerWeek: Number(e.target.value) })}
                  className="w-full px-2.5 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-xs"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Food Preferences & Budget */}
        {step === 4 && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold mb-1">{t.onboarding.dietPattern}</label>
                <select
                  value={profile.dietaryPattern}
                  onChange={(e) => setProfile({ ...profile, dietaryPattern: e.target.value as DietaryPattern })}
                  className="w-full px-2.5 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-xs"
                >
                  <option value="omnivore">{t.onboarding.omnivore}</option>
                  <option value="vegetarian">{t.onboarding.vegetarian}</option>
                  <option value="vegan">{t.onboarding.vegan}</option>
                  <option value="mediterranean">{t.onboarding.mediterranean}</option>
                  <option value="halal">{t.onboarding.halal}</option>
                  <option value="low_carb">{t.onboarding.lowCarb}</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">{t.onboarding.budget}</label>
                <select
                  value={profile.foodBudget}
                  onChange={(e) => setProfile({ ...profile, foodBudget: e.target.value as 'low' | 'moderate' | 'flexible' })}
                  className="w-full px-2.5 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-xs"
                >
                  <option value="low">{t.onboarding.budgetLow}</option>
                  <option value="moderate">{t.onboarding.budgetModerate}</option>
                  <option value="flexible">{t.onboarding.budgetFlexible}</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1">{t.onboarding.cuisine}</label>
              <select
                value={profile.preferredCuisine}
                onChange={(e) => setProfile({ ...profile, preferredCuisine: e.target.value })}
                className="w-full px-2.5 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-xs"
              >
                <option value="Egyptian Traditional">{t.onboarding.cuisineEgyptian}</option>
                <option value="Arabic / Middle Eastern">{t.onboarding.cuisineArab}</option>
                <option value="International / Clean Staples">{t.onboarding.cuisineInternational}</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1">{t.onboarding.allergies}</label>
              <input
                type="text"
                placeholder={profile.language === 'ar' ? 'مثل: حساسية اللاكتوز، الفول السوداني...' : 'e.g. Dairy, Peanuts, Gluten...'}
                value={profile.allergies.join(', ')}
                onChange={(e) =>
                  setProfile({
                    ...profile,
                    allergies: e.target.value ? e.target.value.split(',').map((s) => s.trim()) : [],
                  })
                }
                className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-xs"
              />
            </div>
          </div>
        )}

        {/* Step 5: Equipment & AI Consent */}
        {step === 5 && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold mb-2">{t.onboarding.equipment}</label>
              <div className="grid grid-cols-2 gap-2.5">
                {[
                  { id: 'gym', label: t.onboarding.gym },
                  { id: 'home_weights', label: t.onboarding.homeWeights },
                  { id: 'bands', label: t.onboarding.bands },
                  { id: 'bodyweight', label: t.onboarding.bodyweight },
                ].map((item) => {
                  const isChecked = profile.equipment.includes(item.id as EquipmentType);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => toggleEquipment(item.id as EquipmentType)}
                      className={`p-3 rounded-xl border text-xs text-start flex items-center justify-between transition-all ${
                        isChecked
                          ? 'border-[#4D6A34] bg-[#EBF2E8] dark:bg-[#283620] text-[#3B5323] dark:text-[#A7D184] font-bold'
                          : 'border-stone-200 dark:border-stone-700'
                      }`}
                    >
                      <span>{item.label}</span>
                      {isChecked && <Check className="w-4 h-4 text-[#4D6A34]" />}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="p-3.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-800/40 text-xs space-y-2">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={profile.consentAiDataUsage}
                  onChange={(e) => setProfile({ ...profile, consentAiDataUsage: e.target.checked })}
                  className="mt-0.5 rounded text-[#4D6A34] focus:ring-[#4D6A34]"
                />
                <span className="text-stone-600 dark:text-stone-300">
                  {t.onboarding.consentAi}
                </span>
              </label>
            </div>
          </div>
        )}

        {/* Footer Buttons */}
        <div className="mt-6 pt-4 border-t border-stone-200 dark:border-stone-800 flex items-center justify-between gap-3">
          {step > 1 ? (
            <button
              type="button"
              onClick={handleBack}
              className="px-4 py-2 rounded-xl text-xs font-semibold border border-stone-300 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
            >
              {profile.language === 'ar' ? 'السابق' : 'Back'}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => finalizeProfile()}
              className="text-xs text-stone-500 hover:underline"
            >
              {t.onboarding.skipDemo}
            </button>
          )}

          <button
            type="button"
            onClick={handleNext}
            className="px-5 py-2.5 rounded-xl text-xs font-bold bg-[#4D6A34] hover:bg-[#3B5323] text-white shadow-md shadow-[#4D6A34]/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            {step === 5 ? t.onboarding.startJourney : (profile.language === 'ar' ? 'التالي' : 'Next')}
          </button>
        </div>
      </div>
    </div>
  );
};
