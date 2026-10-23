import React from 'react';
import {
  UserProfile,
  DailyLog,
  Language,
  LoggedMealItem,
} from '../types/index.ts';
import { translations } from '../data/translations.ts';
import {
  Flame,
  Plus,
  Dumbbell,
  Scale,
  Bot,
  Droplets,
  CheckCircle2,
  Circle,
  Clock,
  Sparkles,
  Info,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';

interface HomeDashboardProps {
  profile: UserProfile;
  dailyLog: DailyLog;
  onUpdateDailyLog: (log: DailyLog) => void;
  onOpenAddMeal: () => void;
  onOpenScanFood: () => void;
  onOpenLiveWorkout: () => void;
  onOpenLogWeight: () => void;
  onOpenCoach: () => void;
  onNavigateToTab: (tab: 'nutrition' | 'workouts' | 'progress') => void;
}

export const HomeDashboard: React.FC<HomeDashboardProps> = ({
  profile,
  dailyLog,
  onUpdateDailyLog,
  onOpenAddMeal,
  onOpenScanFood,
  onOpenLiveWorkout,
  onOpenLogWeight,
  onOpenCoach,
  onNavigateToTab,
}) => {
  const language = profile.language;
  const t = translations[language];

  // Calculate today's totals
  const totalCalories = dailyLog.meals.reduce((sum, m) => sum + (m.calories || 0), 0);
  const totalProtein = Math.round(dailyLog.meals.reduce((sum, m) => sum + (m.protein || 0), 0));
  const totalCarbs = Math.round(dailyLog.meals.reduce((sum, m) => sum + (m.carbs || 0), 0));
  const totalFat = Math.round(dailyLog.meals.reduce((sum, m) => sum + (m.fat || 0), 0));
  const totalFiber = Math.round(dailyLog.meals.reduce((sum, m) => sum + (m.fiber || 0), 0));

  const targetCalories = profile.dailyCalorieTarget || 2200;
  const remainingCalories = targetCalories - totalCalories;
  const caloriePercent = Math.min(100, Math.round((totalCalories / targetCalories) * 100));

  // Water calculations
  const waterTarget = profile.waterTargetMl || 2500;
  const waterPercent = Math.min(100, Math.round((dailyLog.waterMl / waterTarget) * 100));

  const addWater = (amountMl: number) => {
    const updatedWater = Math.max(0, dailyLog.waterMl + amountMl);
    const updatedHabits = { ...dailyLog.completedHabits, water: updatedWater >= waterTarget };
    onUpdateDailyLog({
      ...dailyLog,
      waterMl: updatedWater,
      completedHabits: updatedHabits,
    });
  };

  const toggleHabit = (key: keyof DailyLog['completedHabits']) => {
    const current = dailyLog.completedHabits[key] || false;
    onUpdateDailyLog({
      ...dailyLog,
      completedHabits: {
        ...dailyLog.completedHabits,
        [key]: !current,
      },
    });
  };

  const removeMealItem = (id: string) => {
    const filtered = dailyLog.meals.filter((m) => m.id !== id);
    onUpdateDailyLog({
      ...dailyLog,
      meals: filtered,
    });
  };

  return (
    <div className="space-y-6 pb-24 max-w-4xl mx-auto px-4 pt-4">
      {/* Welcome & Slogan Banner */}
      <div className="bg-gradient-to-r from-[#4D6A34] via-[#5C7E3E] to-[#3B5323] text-white rounded-2xl p-5 shadow-lg relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-[#D4DFCD] px-2 py-0.5 rounded-full bg-white/15 backdrop-blur-xs">
              {profile.country || 'Fitora AI'}
            </span>
            <span className="text-xs text-white/80">
              {new Date().toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', {
                weekday: 'long',
                month: 'short',
                day: 'numeric',
              })}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            {language === 'ar' ? `مرحباً، ${profile.name}` : `Welcome, ${profile.name}`}
          </h1>
          <p className="text-xs sm:text-sm text-stone-100/90 mt-1 max-w-xl">
            {t.appSlogan}
          </p>
        </div>
        {/* Subtle decorative leaf accent */}
        <div className="absolute -right-8 -bottom-8 w-36 h-36 rounded-full bg-white/5 pointer-events-none" />
      </div>

      {/* Main Calorie Progress Card */}
      <div className="bg-white dark:bg-[#1a2217] rounded-2xl p-5 shadow-sm border border-stone-200 dark:border-stone-800 transition-colors">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-[#EBF2E8] dark:bg-[#283620] text-[#4D6A34] dark:text-[#85A947]">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-stone-900 dark:text-stone-100">{t.dashboard.dailyCalories}</h2>
              <p className="text-[11px] text-stone-500 dark:text-stone-400">
                {language === 'ar' ? 'معادلة ميفلين سانت جيور' : 'Mifflin-St Jeor Formula'}
              </p>
            </div>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300">
            {caloriePercent}%
          </span>
        </div>

        {/* Large Numbers Grid */}
        <div className="grid grid-cols-3 gap-2 text-center py-2">
          <div className="bg-stone-50 dark:bg-stone-800/40 p-3 rounded-xl">
            <span className="text-xs text-stone-500 dark:text-stone-400 block mb-0.5">{t.dashboard.consumed}</span>
            <span className="text-xl sm:text-2xl font-black text-stone-900 dark:text-stone-100">{totalCalories}</span>
            <span className="text-[10px] text-stone-400 block">{t.common.kcal}</span>
          </div>

          <div className="bg-[#EBF2E8]/60 dark:bg-[#283620]/60 p-3 rounded-xl border border-[#4D6A34]/20">
            <span className="text-xs text-[#4D6A34] dark:text-[#85A947] block mb-0.5">{t.onboarding.goal}</span>
            <span className="text-xl sm:text-2xl font-black text-[#3B5323] dark:text-[#A7D184]">{targetCalories}</span>
            <span className="text-[10px] text-[#4D6A34]/70 block">{t.common.kcal}</span>
          </div>

          <div className="bg-stone-50 dark:bg-stone-800/40 p-3 rounded-xl">
            <span className="text-xs text-stone-500 dark:text-stone-400 block mb-0.5">
              {remainingCalories >= 0 ? t.dashboard.remaining : t.dashboard.overBudget}
            </span>
            <span
              className={`text-xl sm:text-2xl font-black ${
                remainingCalories >= 0 ? 'text-stone-900 dark:text-stone-100' : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              {Math.abs(remainingCalories)}
            </span>
            <span className="text-[10px] text-stone-400 block">{t.common.kcal}</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-stone-100 dark:bg-stone-800 h-2.5 rounded-full overflow-hidden mt-3">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              totalCalories > targetCalories ? 'bg-amber-500' : 'bg-[#4D6A34]'
            }`}
            style={{ width: `${caloriePercent}%` }}
          />
        </div>

        {/* Estimation Notice */}
        <p className="text-[11px] text-stone-400 dark:text-stone-500 mt-2.5 flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 flex-shrink-0" />
          <span>{t.common.estimateNotice}</span>
        </p>
      </div>

      {/* Macronutrient Bars */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Protein */}
        <div className="bg-white dark:bg-[#1a2217] rounded-xl p-3.5 border border-stone-200 dark:border-stone-800 shadow-xs">
          <div className="flex justify-between items-center text-xs mb-1">
            <span className="font-bold text-sky-700 dark:text-sky-400">{t.common.protein}</span>
            <span className="text-[11px] text-stone-400">{profile.dailyProteinTarget}g</span>
          </div>
          <div className="text-lg font-black text-stone-900 dark:text-stone-100">
            {totalProtein} <span className="text-xs font-normal text-stone-400">/ {profile.dailyProteinTarget}g</span>
          </div>
          <div className="w-full bg-stone-100 dark:bg-stone-800 h-1.5 rounded-full mt-2 overflow-hidden">
            <div
              className="bg-sky-500 h-full rounded-full transition-all"
              style={{ width: `${Math.min(100, (totalProtein / (profile.dailyProteinTarget || 140)) * 100)}%` }}
            />
          </div>
        </div>

        {/* Carbs */}
        <div className="bg-white dark:bg-[#1a2217] rounded-xl p-3.5 border border-stone-200 dark:border-stone-800 shadow-xs">
          <div className="flex justify-between items-center text-xs mb-1">
            <span className="font-bold text-amber-700 dark:text-amber-400">{t.common.carbs}</span>
            <span className="text-[11px] text-stone-400">{profile.dailyCarbsTarget}g</span>
          </div>
          <div className="text-lg font-black text-stone-900 dark:text-stone-100">
            {totalCarbs} <span className="text-xs font-normal text-stone-400">/ {profile.dailyCarbsTarget}g</span>
          </div>
          <div className="w-full bg-stone-100 dark:bg-stone-800 h-1.5 rounded-full mt-2 overflow-hidden">
            <div
              className="bg-amber-500 h-full rounded-full transition-all"
              style={{ width: `${Math.min(100, (totalCarbs / (profile.dailyCarbsTarget || 240)) * 100)}%` }}
            />
          </div>
        </div>

        {/* Fat */}
        <div className="bg-white dark:bg-[#1a2217] rounded-xl p-3.5 border border-stone-200 dark:border-stone-800 shadow-xs">
          <div className="flex justify-between items-center text-xs mb-1">
            <span className="font-bold text-emerald-700 dark:text-emerald-400">{t.common.fat}</span>
            <span className="text-[11px] text-stone-400">{profile.dailyFatTarget}g</span>
          </div>
          <div className="text-lg font-black text-stone-900 dark:text-stone-100">
            {totalFat} <span className="text-xs font-normal text-stone-400">/ {profile.dailyFatTarget}g</span>
          </div>
          <div className="w-full bg-stone-100 dark:bg-stone-800 h-1.5 rounded-full mt-2 overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all"
              style={{ width: `${Math.min(100, (totalFat / (profile.dailyFatTarget || 65)) * 100)}%` }}
            />
          </div>
        </div>

        {/* Fiber */}
        <div className="bg-white dark:bg-[#1a2217] rounded-xl p-3.5 border border-stone-200 dark:border-stone-800 shadow-xs">
          <div className="flex justify-between items-center text-xs mb-1">
            <span className="font-bold text-purple-700 dark:text-purple-400">{t.common.fiber}</span>
            <span className="text-[11px] text-stone-400">{profile.dailyFiberTarget}g</span>
          </div>
          <div className="text-lg font-black text-stone-900 dark:text-stone-100">
            {totalFiber} <span className="text-xs font-normal text-stone-400">/ {profile.dailyFiberTarget}g</span>
          </div>
          <div className="w-full bg-stone-100 dark:bg-stone-800 h-1.5 rounded-full mt-2 overflow-hidden">
            <div
              className="bg-purple-500 h-full rounded-full transition-all"
              style={{ width: `${Math.min(100, (totalFiber / (profile.dailyFiberTarget || 32)) * 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Quick Actions Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <button
          onClick={onOpenAddMeal}
          className="p-3.5 rounded-xl bg-white dark:bg-[#1a2217] border border-stone-200 dark:border-stone-800 text-stone-800 dark:text-stone-100 hover:border-[#4D6A34] transition-all flex items-center gap-2 text-xs font-bold shadow-xs active:scale-95"
        >
          <div className="w-8 h-8 rounded-lg bg-[#EBF2E8] dark:bg-[#283620] text-[#4D6A34] dark:text-[#85A947] flex items-center justify-center">
            <Plus className="w-4 h-4" />
          </div>
          <span>{t.dashboard.quickLogMeal}</span>
        </button>

        <button
          onClick={onOpenScanFood}
          className="p-3.5 rounded-xl bg-white dark:bg-[#1a2217] border border-stone-200 dark:border-stone-800 text-stone-800 dark:text-stone-100 hover:border-[#4D6A34] transition-all flex items-center gap-2 text-xs font-bold shadow-xs active:scale-95"
        >
          <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <Sparkles className="w-4 h-4" />
          </div>
          <span>{t.scanner.title}</span>
        </button>

        <button
          onClick={onOpenLiveWorkout}
          className="p-3.5 rounded-xl bg-white dark:bg-[#1a2217] border border-stone-200 dark:border-stone-800 text-stone-800 dark:text-stone-100 hover:border-[#4D6A34] transition-all flex items-center gap-2 text-xs font-bold shadow-xs active:scale-95"
        >
          <div className="w-8 h-8 rounded-lg bg-orange-50 dark:bg-orange-950 text-orange-600 dark:text-orange-400 flex items-center justify-center">
            <Dumbbell className="w-4 h-4" />
          </div>
          <span>{t.dashboard.quickLiveWorkout}</span>
        </button>

        <button
          onClick={onOpenLogWeight}
          className="p-3.5 rounded-xl bg-white dark:bg-[#1a2217] border border-stone-200 dark:border-stone-800 text-stone-800 dark:text-stone-100 hover:border-[#4D6A34] transition-all flex items-center gap-2 text-xs font-bold shadow-xs active:scale-95"
        >
          <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <Scale className="w-4 h-4" />
          </div>
          <span>{t.dashboard.quickLogWeight}</span>
        </button>
      </div>

      {/* Water & Habits Dual Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Water Tracker */}
        <div className="bg-white dark:bg-[#1a2217] rounded-2xl p-4 border border-stone-200 dark:border-stone-800 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-sky-50 dark:bg-sky-950 text-sky-600 dark:text-sky-400">
                  <Droplets className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-stone-900 dark:text-stone-100">{t.dashboard.waterTracker}</h3>
                  <p className="text-[10px] text-stone-400">
                    {t.dashboard.waterTarget}: {waterTarget} {t.common.ml}
                  </p>
                </div>
              </div>
              <span className="text-xs font-bold text-sky-600 dark:text-sky-400">
                {dailyLog.waterMl} / {waterTarget} ml
              </span>
            </div>

            <div className="w-full bg-stone-100 dark:bg-stone-800 h-2 rounded-full overflow-hidden mb-3">
              <div
                className="bg-sky-500 h-full rounded-full transition-all duration-300"
                style={{ width: `${waterPercent}%` }}
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={() => addWater(250)}
              className="flex-1 py-1.5 px-3 rounded-lg bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 text-xs font-bold hover:bg-sky-100 transition-colors"
            >
              {t.dashboard.addWater250}
            </button>
            <button
              onClick={() => addWater(500)}
              className="flex-1 py-1.5 px-3 rounded-lg bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 text-xs font-bold hover:bg-sky-100 transition-colors"
            >
              {t.dashboard.addWater500}
            </button>
          </div>
        </div>

        {/* Daily Habits Checklist */}
        <div className="bg-white dark:bg-[#1a2217] rounded-2xl p-4 border border-stone-200 dark:border-stone-800 shadow-xs">
          <div className="flex items-center justify-between mb-2.5">
            <h3 className="text-xs font-bold text-stone-900 dark:text-stone-100">{t.dashboard.habitTracker}</h3>
            <span className="text-[10px] text-stone-400">
              {Object.values(dailyLog.completedHabits).filter(Boolean).length} / 5
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={() => toggleHabit('water')}
              className={`p-2 rounded-lg border text-start flex items-center gap-2 transition-all ${
                dailyLog.completedHabits.water
                  ? 'border-sky-300 bg-sky-50/50 dark:bg-sky-950/30 text-sky-800 dark:text-sky-200 font-semibold'
                  : 'border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-400'
              }`}
            >
              {dailyLog.completedHabits.water ? (
                <CheckCircle2 className="w-4 h-4 text-sky-600" />
              ) : (
                <Circle className="w-4 h-4 text-stone-400" />
              )}
              <span className="truncate">{t.dashboard.habitWater}</span>
            </button>

            <button
              type="button"
              onClick={() => toggleHabit('foodLogged')}
              className={`p-2 rounded-lg border text-start flex items-center gap-2 transition-all ${
                dailyLog.completedHabits.foodLogged
                  ? 'border-[#4D6A34] bg-[#EBF2E8]/50 dark:bg-[#283620]/30 text-[#3B5323] dark:text-[#A7D184] font-semibold'
                  : 'border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-400'
              }`}
            >
              {dailyLog.completedHabits.foodLogged ? (
                <CheckCircle2 className="w-4 h-4 text-[#4D6A34]" />
              ) : (
                <Circle className="w-4 h-4 text-stone-400" />
              )}
              <span className="truncate">{t.dashboard.habitFood}</span>
            </button>

            <button
              type="button"
              onClick={() => toggleHabit('workout')}
              className={`p-2 rounded-lg border text-start flex items-center gap-2 transition-all ${
                dailyLog.completedHabits.workout
                  ? 'border-orange-300 bg-orange-50/50 dark:bg-orange-950/30 text-orange-800 dark:text-orange-200 font-semibold'
                  : 'border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-400'
              }`}
            >
              {dailyLog.completedHabits.workout ? (
                <CheckCircle2 className="w-4 h-4 text-orange-600" />
              ) : (
                <Circle className="w-4 h-4 text-stone-400" />
              )}
              <span className="truncate">{t.dashboard.habitWorkout}</span>
            </button>

            <button
              type="button"
              onClick={() => toggleHabit('sleep')}
              className={`p-2 rounded-lg border text-start flex items-center gap-2 transition-all ${
                dailyLog.completedHabits.sleep
                  ? 'border-indigo-300 bg-indigo-50/50 dark:bg-indigo-950/30 text-indigo-800 dark:text-indigo-200 font-semibold'
                  : 'border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-400'
              }`}
            >
              {dailyLog.completedHabits.sleep ? (
                <CheckCircle2 className="w-4 h-4 text-indigo-600" />
              ) : (
                <Circle className="w-4 h-4 text-stone-400" />
              )}
              <span className="truncate">{t.dashboard.habitSleep}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Today's Logged Meals Summary */}
      <div className="bg-white dark:bg-[#1a2217] rounded-2xl p-5 border border-stone-200 dark:border-stone-800 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">{t.dashboard.todaysMeals}</h3>
          <button
            onClick={() => onNavigateToTab('nutrition')}
            className="text-xs font-bold text-[#4D6A34] dark:text-[#85A947] hover:underline flex items-center gap-1"
          >
            <span>{language === 'ar' ? 'عرض السجل الكامل' : 'View Full Diary'}</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {dailyLog.meals.length === 0 ? (
          <div className="text-center py-8 text-stone-400 text-xs">
            <p>{t.dashboard.noMealsLogged}</p>
            <button
              onClick={onOpenAddMeal}
              className="mt-3 px-4 py-2 rounded-xl bg-[#4D6A34] text-white font-bold text-xs hover:bg-[#3B5323] transition-colors"
            >
              {t.nutrition.addFood}
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {dailyLog.meals.map((item) => (
              <div
                key={item.id}
                className="p-3 rounded-xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200/60 dark:border-stone-700/60 flex items-center justify-between text-xs"
              >
                <div>
                  <div className="font-bold text-stone-800 dark:text-stone-200">
                    {language === 'ar' ? item.nameAr || item.nameEn : item.nameEn}
                  </div>
                  <div className="text-[11px] text-stone-400 flex items-center gap-2 mt-0.5">
                    <span>{item.grams}g</span>
                    <span>•</span>
                    <span className="capitalize">{item.mealType}</span>
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
                    onClick={() => removeMealItem(item.id)}
                    className="text-stone-300 hover:text-rose-500 transition-colors p-1"
                    title={t.common.delete}
                    aria-label={`Delete ${item.nameEn}`}
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Live Workout Mode CTA */}
      <div className="bg-stone-900 text-white rounded-2xl p-4 shadow-md flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#4D6A34] text-white flex items-center justify-center">
            <Dumbbell className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold">{t.dashboard.activeWorkoutPrompt}</h4>
            <p className="text-[11px] text-stone-400">
              {language === 'ar'
                ? 'تتبع التكرارات والأوزان ومؤقت الراحة خطوة بخطوة'
                : 'Track sets, weights, and rest timer step-by-step'}
            </p>
          </div>
        </div>
        <button
          onClick={onOpenLiveWorkout}
          className="px-4 py-2 rounded-xl text-xs font-extrabold bg-[#6E9447] hover:bg-[#5C7E3E] text-white transition-all shadow-xs"
        >
          {t.dashboard.startTodaysWorkout}
        </button>
      </div>
    </div>
  );
};
