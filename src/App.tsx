/**
 * Fitora AI - Master Application Entry Point
 * Your Food, Your Workout, Your Progress — All in One Place.
 */

import React, { useState, useEffect } from 'react';
import {
  UserProfile,
  DailyLog,
  FoodItem,
  Recipe,
  WorkoutLog,
  ProgressRecord,
  PantryItem,
  GroceryItem,
  HabitReminder,
  LiveWorkoutState,
  MealType,
  LoggedMealItem,
  Language,
  ThemeMode,
  ThemePreference,
  PersonalRecord,
  InBodyReport,
  WorkoutProgram,
} from './types/index.ts';
import {
  DEFAULT_USER_PROFILE,
  loadUserProfile,
  saveUserProfile,
  loadDailyLogs,
  saveDailyLogs,
  getOrCreateDailyLog,
  getTodayDateString,
  loadCustomFoods,
  saveCustomFoods,
  getAllFoods,
  loadRecipes,
  saveRecipes,
  loadWorkoutLogs,
  saveWorkoutLogs,
  loadPersonalRecords,
  savePersonalRecords,
  loadInBodyReports,
  saveInBodyReports,
  loadCustomRoutines,
  saveCustomRoutines,
  loadProgressRecords,
  saveProgressRecords,
  loadPantryItems,
  savePantryItems,
  loadGroceryItems,
  saveGroceryItems,
  loadReminders,
  saveReminders,
  loadLiveWorkout,
  saveLiveWorkout,
} from './utils/storage.ts';

import { Navbar } from './components/Navbar.tsx';
import { HomeDashboard } from './components/HomeDashboard.tsx';
import { NutritionDiary } from './components/NutritionDiary.tsx';
import { WorkoutsView } from './components/WorkoutsView.tsx';
import { ProgressView } from './components/ProgressView.tsx';
import { SettingsView } from './components/SettingsView.tsx';
import { OnboardingModal } from './components/OnboardingModal.tsx';
import { FoodScannerModal } from './components/FoodScannerModal.tsx';
import { RecipeCalculatorModal } from './components/RecipeCalculatorModal.tsx';
import { NutritionPlansModal } from './components/NutritionPlansModal.tsx';
import { PantryModal } from './components/PantryModal.tsx';
import { AiCoachDrawer } from './components/AiCoachDrawer.tsx';
import { InBodyModal } from './components/InBodyModal.tsx';

export default function App() {
  // Query param check for ?autostart=1 or skipping onboarding
  const searchParams = new URLSearchParams(window.location.search);
  const autostart = searchParams.get('autostart') === '1';

  // Core Persistent States
  const [profile, setProfile] = useState<UserProfile>(() => {
    const saved = loadUserProfile();
    if (saved) return saved;
    if (autostart) {
      saveUserProfile(DEFAULT_USER_PROFILE);
      return DEFAULT_USER_PROFILE;
    }
    return DEFAULT_USER_PROFILE;
  });

  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState<boolean>(() => {
    if (autostart) return true;
    const saved = loadUserProfile();
    return Boolean(saved && saved.isOnboarded);
  });

  const [activeTab, setActiveTab] = useState<'home' | 'nutrition' | 'workouts' | 'progress' | 'settings'>('home');
  const [currentDate, setCurrentDate] = useState<string>(getTodayDateString());
  const [dailyLogs, setDailyLogs] = useState<Record<string, DailyLog>>(loadDailyLogs);
  const [allFoods, setAllFoods] = useState<FoodItem[]>(getAllFoods);
  const [recipes, setRecipes] = useState<Recipe[]>(loadRecipes);
  const [workoutLogs, setWorkoutLogs] = useState<WorkoutLog[]>(loadWorkoutLogs);
  const [personalRecords, setPersonalRecords] = useState<PersonalRecord[]>(loadPersonalRecords);
  const [inBodyReports, setInBodyReports] = useState<InBodyReport[]>(loadInBodyReports);
  const [customRoutines, setCustomRoutines] = useState<WorkoutProgram[]>(loadCustomRoutines);
  const [progressRecords, setProgressRecords] = useState<ProgressRecord[]>(loadProgressRecords);
  const [pantryItems, setPantryItems] = useState<PantryItem[]>(loadPantryItems);
  const [groceryItems, setGroceryItems] = useState<GroceryItem[]>(loadGroceryItems);
  const [reminders, setReminders] = useState<HabitReminder[]>(loadReminders);
  const [liveWorkout, setLiveWorkout] = useState<LiveWorkoutState | null>(loadLiveWorkout);

  // Modals visibility state
  const [isEditingProfile, setIsEditingProfile] = useState<boolean>(false);
  const [isScannerOpen, setIsScannerOpen] = useState<boolean>(false);
  const [isRecipeCalcOpen, setIsRecipeCalcOpen] = useState<boolean>(false);
  const [isNutritionPlansOpen, setIsNutritionPlansOpen] = useState<boolean>(false);
  const [isPantryOpen, setIsPantryOpen] = useState<boolean>(false);
  const [isCoachOpen, setIsCoachOpen] = useState<boolean>(false);
  const [isInBodyOpen, setIsInBodyOpen] = useState<boolean>(false);

  // Current active date's daily log
  const todayLog = dailyLogs[currentDate] || getOrCreateDailyLog(currentDate);

  // Sync RTL/LTR & language to document
  useEffect(() => {
    document.documentElement.lang = profile.language;
    document.documentElement.dir = profile.language === 'ar' ? 'rtl' : 'ltr';
  }, [profile.language]);

  // Sync theme to document body with System Default preference listener
  useEffect(() => {
    const applyTheme = (theme: ThemeMode) => {
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    };

    const pref = profile.themePreference || 'system';
    if (pref === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      applyTheme(mediaQuery.matches ? 'dark' : 'light');

      const listener = (e: MediaQueryListEvent) => {
        applyTheme(e.matches ? 'dark' : 'light');
      };
      mediaQuery.addEventListener('change', listener);
      return () => mediaQuery.removeEventListener('change', listener);
    } else {
      applyTheme(profile.theme);
    }
  }, [profile.theme, profile.themePreference]);

  // Update profile
  const handleUpdateProfile = (updated: UserProfile) => {
    setProfile(updated);
    saveUserProfile(updated);
    setHasCompletedOnboarding(true);
    setIsEditingProfile(false);
  };

  // Toggle language
  const handleToggleLanguage = () => {
    const nextLang: Language = profile.language === 'ar' ? 'en' : 'ar';
    const updated: UserProfile = { ...profile, language: nextLang };
    handleUpdateProfile(updated);
  };

  // Toggle theme
  const handleToggleTheme = () => {
    const nextTheme: ThemeMode = profile.theme === 'light' ? 'dark' : 'light';
    const updated: UserProfile = { ...profile, theme: nextTheme, themePreference: nextTheme };
    handleUpdateProfile(updated);
  };

  // Set 3-way theme preference (light | dark | system)
  const handleSetThemePreference = (pref: ThemePreference) => {
    let computedTheme: ThemeMode = profile.theme;
    if (pref === 'system') {
      computedTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    } else {
      computedTheme = pref;
    }
    const updated: UserProfile = { ...profile, themePreference: pref, theme: computedTheme };
    handleUpdateProfile(updated);
  };

  // Update daily log
  const handleUpdateDailyLog = (updatedLog: DailyLog) => {
    const updatedLogs = { ...dailyLogs, [updatedLog.date]: updatedLog };
    setDailyLogs(updatedLogs);
    saveDailyLogs(updatedLogs);
  };

  // Save new custom food
  const handleSaveCustomFood = (food: FoodItem) => {
    const custom = loadCustomFoods();
    const updated = [food, ...custom];
    saveCustomFoods(updated);
    setAllFoods(getAllFoods());
  };

  // Save recipe
  const handleSaveRecipe = (recipe: Recipe) => {
    const updated = [recipe, ...recipes];
    setRecipes(updated);
    saveRecipes(updated);
  };

  // Save workout log
  const handleSaveWorkoutLog = (log: WorkoutLog) => {
    const updated = [log, ...workoutLogs];
    setWorkoutLogs(updated);
    saveWorkoutLogs(updated);

    // Also mark workout habit completed for today's log
    const today = getTodayDateString();
    const currentDayLog = dailyLogs[today] || getOrCreateDailyLog(today);
    const updatedDayLog = {
      ...currentDayLog,
      completedHabits: {
        ...currentDayLog.completedHabits,
        workout: true,
      },
    };
    handleUpdateDailyLog(updatedDayLog);
  };

  // Save / Update Personal Record
  const handleSavePersonalRecord = (pr: PersonalRecord) => {
    const existingIndex = personalRecords.findIndex((r) => r.id === pr.id);
    let updated: PersonalRecord[];
    if (existingIndex >= 0) {
      updated = [...personalRecords];
      updated[existingIndex] = pr;
    } else {
      updated = [pr, ...personalRecords];
    }
    setPersonalRecords(updated);
    savePersonalRecords(updated);
  };

  // Delete Personal Record
  const handleDeletePersonalRecord = (id: string) => {
    const updated = personalRecords.filter((r) => r.id !== id);
    setPersonalRecords(updated);
    savePersonalRecords(updated);
  };

  // Save / Update Custom Routine
  const handleSaveCustomRoutine = (routine: WorkoutProgram) => {
    const existingIdx = customRoutines.findIndex((r) => r.id === routine.id);
    let updated: WorkoutProgram[];
    if (existingIdx >= 0) {
      updated = [...customRoutines];
      updated[existingIdx] = routine;
    } else {
      updated = [routine, ...customRoutines];
    }
    setCustomRoutines(updated);
    saveCustomRoutines(updated);
  };

  // Delete Custom Routine
  const handleDeleteCustomRoutine = (id: string) => {
    const updated = customRoutines.filter((r) => r.id !== id);
    setCustomRoutines(updated);
    saveCustomRoutines(updated);
  };

  // Save / Update InBody Report
  const handleSaveInBodyReport = (report: InBodyReport) => {
    const existingIdx = inBodyReports.findIndex((r) => r.id === report.id);
    let updated: InBodyReport[];
    if (existingIdx >= 0) {
      updated = [...inBodyReports];
      updated[existingIdx] = report;
    } else {
      updated = [report, ...inBodyReports];
    }
    setInBodyReports(updated);
    saveInBodyReports(updated);

    // Sync weight with profile if available
    if (report.weightKg) {
      handleUpdateProfile({ ...profile, weightKg: report.weightKg });
    }
  };

  // Delete InBody Report
  const handleDeleteInBodyReport = (id: string) => {
    const updated = inBodyReports.filter((r) => r.id !== id);
    setInBodyReports(updated);
    saveInBodyReports(updated);
  };

  // Add progress record
  const handleAddProgressRecord = (record: ProgressRecord) => {
    const updated = [record, ...progressRecords];
    setProgressRecords(updated);
    saveProgressRecords(updated);
    // Also update current weight on profile
    handleUpdateProfile({ ...profile, weightKg: record.weightKg });
  };

  // Delete progress record
  const handleDeleteProgressRecord = (id: string) => {
    const updated = progressRecords.filter((r) => r.id !== id);
    setProgressRecords(updated);
    saveProgressRecords(updated);
  };

  // Save AI scanned meal items to today's log
  const handleSaveScannedMeal = (items: LoggedMealItem[], mealType: MealType) => {
    const currentDayLog = dailyLogs[currentDate] || getOrCreateDailyLog(currentDate);
    const updatedMeals = [...currentDayLog.meals, ...items];
    handleUpdateDailyLog({
      ...currentDayLog,
      meals: updatedMeals,
      completedHabits: { ...currentDayLog.completedHabits, foodLogged: true },
    });
  };

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-[#151b13] text-stone-900 dark:text-stone-100 flex flex-col font-sans transition-colors selection:bg-[#4D6A34]/20 selection:text-[#3B5323]">
      
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        language={profile.language}
        onToggleLanguage={handleToggleLanguage}
        theme={profile.theme}
        onToggleTheme={handleToggleTheme}
        onOpenCoach={() => setIsCoachOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 w-full">
        {activeTab === 'home' && (
          <HomeDashboard
            profile={profile}
            dailyLog={todayLog}
            onUpdateDailyLog={handleUpdateDailyLog}
            onOpenAddMeal={() => setActiveTab('nutrition')}
            onOpenScanFood={() => setIsScannerOpen(true)}
            onOpenLiveWorkout={() => {
              setActiveTab('workouts');
            }}
            onOpenLogWeight={() => {
              setActiveTab('progress');
            }}
            onOpenCoach={() => setIsCoachOpen(true)}
            onNavigateToTab={setActiveTab}
          />
        )}

        {activeTab === 'nutrition' && (
          <NutritionDiary
            profile={profile}
            dailyLog={todayLog}
            allFoods={allFoods}
            currentDate={currentDate}
            onChangeDate={setCurrentDate}
            onUpdateDailyLog={handleUpdateDailyLog}
            onOpenScanFood={() => setIsScannerOpen(true)}
            onOpenRecipeCalculator={() => setIsRecipeCalcOpen(true)}
            onOpenNutritionPlans={() => setIsNutritionPlansOpen(true)}
            onOpenPantry={() => setIsPantryOpen(true)}
            onSaveCustomFood={handleSaveCustomFood}
          />
        )}

        {activeTab === 'workouts' && (
          <WorkoutsView
            profile={profile}
            workoutLogs={workoutLogs}
            personalRecords={personalRecords}
            customRoutines={customRoutines}
            liveWorkout={liveWorkout}
            onUpdateLiveWorkout={(state) => {
              setLiveWorkout(state);
              saveLiveWorkout(state);
            }}
            onSaveWorkoutLog={handleSaveWorkoutLog}
            onSavePersonalRecord={handleSavePersonalRecord}
            onDeletePersonalRecord={handleDeletePersonalRecord}
            onUpdateProfile={handleUpdateProfile}
            onSaveCustomRoutine={handleSaveCustomRoutine}
            onDeleteCustomRoutine={handleDeleteCustomRoutine}
            language={profile.language}
          />
        )}

        {activeTab === 'progress' && (
          <ProgressView
            profile={profile}
            progressRecords={progressRecords}
            dailyLogs={dailyLogs}
            workoutLogs={workoutLogs}
            inBodyReports={inBodyReports}
            onAddRecord={handleAddProgressRecord}
            onDeleteRecord={handleDeleteProgressRecord}
            onOpenInBodyModal={() => setIsInBodyOpen(true)}
            language={profile.language}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsView
            profile={profile}
            reminders={reminders}
            onUpdateProfile={handleUpdateProfile}
            onUpdateReminders={(rems) => {
              setReminders(rems);
              saveReminders(rems);
            }}
            onOpenEditProfile={() => setIsEditingProfile(true)}
            onToggleLanguage={handleToggleLanguage}
            onToggleTheme={handleToggleTheme}
            onSetThemePreference={handleSetThemePreference}
          />
        )}
      </main>

      {/* Onboarding Modal (On first visit or edit) */}
      {(!hasCompletedOnboarding || isEditingProfile) && (
        <OnboardingModal
          initialProfile={profile}
          onSave={handleUpdateProfile}
          isEditing={isEditingProfile}
          onClose={() => setIsEditingProfile(false)}
        />
      )}

      {/* Food Scanner Modal */}
      {isScannerOpen && (
        <FoodScannerModal
          language={profile.language}
          onClose={() => setIsScannerOpen(false)}
          onSaveMeal={handleSaveScannedMeal}
        />
      )}

      {/* Recipe Calculator Modal */}
      {isRecipeCalcOpen && (
        <RecipeCalculatorModal
          language={profile.language}
          allFoods={allFoods}
          savedRecipes={recipes}
          onSaveRecipe={handleSaveRecipe}
          onAddServingToDiary={(item, slot) => {
            handleSaveScannedMeal([item], slot);
          }}
          onClose={() => setIsRecipeCalcOpen(false)}
        />
      )}

      {/* Nutrition Plans Modal */}
      {isNutritionPlansOpen && (
        <NutritionPlansModal
          language={profile.language}
          onClose={() => setIsNutritionPlansOpen(false)}
        />
      )}

      {/* Pantry & Substitutions Modal */}
      {isPantryOpen && (
        <PantryModal
          language={profile.language}
          pantryItems={pantryItems}
          groceryItems={groceryItems}
          onUpdatePantry={(items) => {
            setPantryItems(items);
            savePantryItems(items);
          }}
          onUpdateGrocery={(items) => {
            setGroceryItems(items);
            saveGroceryItems(items);
          }}
          onClose={() => setIsPantryOpen(false)}
          onAskCoachAboutPantry={() => {
            setIsCoachOpen(true);
          }}
        />
      )}

      {/* Dedicated InBody & Body Composition Modal */}
      <InBodyModal
        isOpen={isInBodyOpen}
        onClose={() => setIsInBodyOpen(false)}
        reports={inBodyReports}
        profile={profile}
        language={profile.language}
        onSaveReport={handleSaveInBodyReport}
        onDeleteReport={handleDeleteInBodyReport}
      />

      {/* AI Coach Drawer */}
      <AiCoachDrawer
        isOpen={isCoachOpen}
        onClose={() => setIsCoachOpen(false)}
        profile={profile}
        dailyLog={todayLog}
        pantryItems={pantryItems}
        language={profile.language}
      />
    </div>
  );
}
