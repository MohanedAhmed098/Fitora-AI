import {
  UserProfile,
  FoodItem,
  DailyLog,
  Recipe,
  WorkoutLog,
  ProgressRecord,
  PantryItem,
  GroceryItem,
  HabitReminder,
  LiveWorkoutState,
  InBodyReport,
  PersonalRecord,
  WorkoutProgram,
} from '../types/index.ts';
import { INITIAL_FOOD_DATABASE } from '../data/foodDatabase.ts';

const KEYS = {
  USER_PROFILE: 'fitora_user_profile',
  CUSTOM_FOODS: 'fitora_custom_foods',
  DAILY_LOGS: 'fitora_daily_logs',
  CUSTOM_RECIPES: 'fitora_custom_recipes',
  WORKOUT_LOGS: 'fitora_workout_logs',
  PROGRESS_RECORDS: 'fitora_progress_records',
  INBODY_REPORTS: 'fitora_inbody_reports',
  PERSONAL_RECORDS: 'fitora_personal_records',
  CUSTOM_ROUTINES: 'fitora_custom_routines',
  PANTRY_ITEMS: 'fitora_pantry_items',
  GROCERY_ITEMS: 'fitora_grocery_items',
  REMINDERS: 'fitora_reminders',
  LIVE_WORKOUT: 'fitora_live_workout',
};

export const DEFAULT_WEEKLY_SCHEDULE: Record<string, string | null> = {
  '0': 'ppl_push',          // Sunday (Day 0)
  '1': 'ppl_pull',          // Monday (Day 1)
  '2': null,                // Tuesday (Rest Day)
  '3': 'ppl_legs',          // Wednesday (Day 3)
  '4': 'upper_lower_upper', // Thursday (Day 4)
  '5': null,                // Friday (Rest & Recovery)
  '6': null,                // Saturday (Active Recovery / Rest)
};

export const DEFAULT_USER_PROFILE: UserProfile = {
  name: 'Ahmed',
  age: 26,
  gender: 'male',
  heightCm: 178,
  weightKg: 78,
  targetWeightKg: 75,
  preferredUnits: 'metric',
  activityLevel: 'moderate',
  workoutExperience: 'intermediate',
  trainingDaysPerWeek: 4,
  primaryGoal: 'balanced',
  dietaryPattern: 'omnivore',
  allergies: [],
  dislikedFoods: [],
  foodBudget: 'moderate',
  country: 'Egypt',
  preferredCuisine: 'Egyptian Traditional',
  equipment: ['gym', 'home_weights'],
  isMinor: false,
  addBurnedCaloriesToBudget: false,
  consentAiDataUsage: true,
  dailyCalorieTarget: 2200,
  dailyProteinTarget: 140,
  dailyCarbsTarget: 250,
  dailyFatTarget: 65,
  dailyFiberTarget: 32,
  waterTargetMl: 2750,
  language: 'ar',
  theme: 'light',
  themePreference: 'system',
  isOnboarded: true,
  weeklySchedule: DEFAULT_WEEKLY_SCHEDULE,
};

export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function loadUserProfile(): UserProfile | null {
  try {
    const raw = localStorage.getItem(KEYS.USER_PROFILE);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed.weeklySchedule) {
      parsed.weeklySchedule = DEFAULT_WEEKLY_SCHEDULE;
    }
    if (!parsed.themePreference) {
      parsed.themePreference = 'system';
    }
    return parsed;
  } catch (e) {
    console.warn('Error loading user profile:', e);
    return null;
  }
}

export function saveUserProfile(profile: UserProfile): void {
  try {
    localStorage.setItem(KEYS.USER_PROFILE, JSON.stringify(profile));
  } catch (e) {
    console.warn('Error saving user profile:', e);
  }
}

export function loadCustomFoods(): FoodItem[] {
  try {
    const raw = localStorage.getItem(KEYS.CUSTOM_FOODS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveCustomFoods(foods: FoodItem[]): void {
  try {
    localStorage.setItem(KEYS.CUSTOM_FOODS, JSON.stringify(foods));
  } catch (e) {
    console.warn('Error saving custom foods:', e);
  }
}

export function getAllFoods(): FoodItem[] {
  const custom = loadCustomFoods();
  return [...custom, ...INITIAL_FOOD_DATABASE];
}

export function loadDailyLogs(): Record<string, DailyLog> {
  try {
    const raw = localStorage.getItem(KEYS.DAILY_LOGS);
    if (raw) return JSON.parse(raw);

    // Initial seed for today so home screen shows functional state
    const today = getTodayDateString();
    const seed: Record<string, DailyLog> = {
      [today]: {
        date: today,
        waterMl: 1500,
        sleepHours: 7.5,
        steps: 7200,
        completedHabits: {
          water: true,
          foodLogged: true,
          workout: false,
          sleep: true,
        },
        meals: [
          {
            id: 'm1',
            foodId: 'foul_olive_oil',
            nameEn: 'Foul Medames with Olive Oil',
            nameAr: 'فول مدمس بالزيت والكمون',
            grams: 200,
            calories: 220,
            protein: 14,
            carbs: 28,
            fat: 6,
            fiber: 10,
            mealType: 'breakfast',
            loggedAt: '08:30',
          },
          {
            id: 'm2',
            foodId: 'baladi_bread',
            nameEn: 'Egyptian Baladi Bread',
            nameAr: 'عيش بلدي مصري',
            grams: 100,
            calories: 245,
            protein: 8.5,
            carbs: 48,
            fat: 1.2,
            fiber: 4.5,
            mealType: 'breakfast',
            loggedAt: '08:30',
          },
          {
            id: 'm3',
            foodId: 'grilled_chicken_breast',
            nameEn: 'Grilled Chicken Breast',
            nameAr: 'صدر دجاج مشوي',
            grams: 180,
            calories: 297,
            protein: 55.8,
            carbs: 0,
            fat: 6.5,
            fiber: 0,
            mealType: 'lunch',
            loggedAt: '14:00',
          },
          {
            id: 'm4',
            foodId: 'white_rice',
            nameEn: 'White Rice',
            nameAr: 'أرز أبيض مصري',
            grams: 200,
            calories: 260,
            protein: 5.4,
            carbs: 56.4,
            fat: 0.8,
            fiber: 1.2,
            mealType: 'lunch',
            loggedAt: '14:00',
          },
          {
            id: 'm5',
            foodId: 'molokhia_soup',
            nameEn: 'Molokhia Soup',
            nameAr: 'شوربة ملوخية مصرية بالطشة',
            grams: 200,
            calories: 96,
            protein: 8,
            carbs: 12,
            fat: 3,
            fiber: 8,
            mealType: 'lunch',
            loggedAt: '14:00',
          },
        ],
      },
    };

    saveDailyLogs(seed);
    return seed;
  } catch {
    return {};
  }
}

export function saveDailyLogs(logs: Record<string, DailyLog>): void {
  try {
    localStorage.setItem(KEYS.DAILY_LOGS, JSON.stringify(logs));
  } catch (e) {
    console.warn('Error saving daily logs:', e);
  }
}

export function getOrCreateDailyLog(dateStr: string): DailyLog {
  const logs = loadDailyLogs();
  if (logs[dateStr]) return logs[dateStr];

  const emptyLog: DailyLog = {
    date: dateStr,
    waterMl: 0,
    meals: [],
    completedHabits: {},
  };
  logs[dateStr] = emptyLog;
  saveDailyLogs(logs);
  return emptyLog;
}

export function loadRecipes(): Recipe[] {
  try {
    const raw = localStorage.getItem(KEYS.CUSTOM_RECIPES);
    if (raw) return JSON.parse(raw);

    const initialRecipes: Recipe[] = [
      {
        id: 'rec_egyptian_koshari',
        nameEn: 'Healthy Egyptian Koshari Bowl',
        nameAr: 'طاجن كشري مصري خفيف',
        servings: 4,
        totalWeightGrams: 800,
        ingredients: [
          { foodId: 'brown_lentils', nameEn: 'Brown Lentils', nameAr: 'عدس بجُبة', grams: 200, calories: 232, protein: 18, carbs: 40, fat: 0.8, fiber: 16 },
          { foodId: 'white_rice', nameEn: 'White Rice', nameAr: 'أرز أبيض', grams: 200, calories: 260, protein: 5.4, carbs: 56.4, fat: 0.8, fiber: 1.2 },
          { foodId: 'pasta', nameEn: 'Macaroni', nameAr: 'مكرونة مسلوقة', grams: 200, calories: 316, protein: 11.6, carbs: 62, fat: 1.8, fiber: 3.6 },
          { foodId: 'chickpeas', nameEn: 'Chickpeas', nameAr: 'حمص شام مسلوق', grams: 100, calories: 164, protein: 8.9, carbs: 27.4, fat: 2.6, fiber: 7.6 },
          { foodId: 'tomato_sauce', nameEn: 'Spiced Tomato Daqqa Sauce', nameAr: 'صلصة طماطم بالخل والثوم', grams: 100, calories: 50, protein: 2, carbs: 10, fat: 0.5, fiber: 2 },
        ],
        caloriesTotal: 1022,
        proteinTotal: 45.9,
        carbsTotal: 195.8,
        fatTotal: 6.5,
        fiberTotal: 30.4,
        caloriesPerServing: 256,
        proteinPerServing: 11.5,
        carbsPerServing: 49,
        fatPerServing: 1.6,
        fiberPerServing: 7.6,
        instructionsEn: 'Cook lentils and rice together. Boil macaroni separately. Layer lentils, rice, macaroni, and chickpeas, then top with spiced garlic-tomato daqqa sauce.',
        instructionsAr: 'اسلق العدس والأرز معاً. اسلق المكرونة بمفردها. رتّب الطبقات وضع ملعقة صلصة الطماطم الخفيفة بالخل والثوم على الوجه.',
      },
    ];

    saveRecipes(initialRecipes);
    return initialRecipes;
  } catch {
    return [];
  }
}

export function saveRecipes(recipes: Recipe[]): void {
  try {
    localStorage.setItem(KEYS.CUSTOM_RECIPES, JSON.stringify(recipes));
  } catch (e) {
    console.warn('Error saving recipes:', e);
  }
}

export function loadWorkoutLogs(): WorkoutLog[] {
  try {
    const raw = localStorage.getItem(KEYS.WORKOUT_LOGS);
    if (raw) return JSON.parse(raw);

    const initialWorkouts: WorkoutLog[] = [
      {
        id: 'wl_yesterday',
        date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
        timestamp: Date.now() - 86400000,
        workoutName: 'Push Day (Chest, Shoulders, Triceps)',
        durationMinutes: 48,
        estimatedCaloriesBurned: 320,
        exercisesCount: 4,
        setsCompleted: 14,
        totalVolumeKg: 4620,
        exercisesSummary: [
          { nameEn: 'Barbell Flat Bench Press', nameAr: 'ضغط الصدر بالبار', setsCompleted: 4, bestWeightKg: 80, bestReps: 8 },
          { nameEn: 'Incline Dumbbell Press', nameAr: 'ضغط بالدمبل مائل', setsCompleted: 3, bestWeightKg: 28, bestReps: 10 },
          { nameEn: 'Dumbbell Lateral Raise', nameAr: 'رفرفة جانبي بالدمبل', setsCompleted: 4, bestWeightKg: 12, bestReps: 12 },
          { nameEn: 'Tricep Rope Pushdown', nameAr: 'سحب ترايسبس بالحبل', setsCompleted: 3, bestWeightKg: 25, bestReps: 12 },
        ],
      },
      {
        id: 'wl_3days_ago',
        date: new Date(Date.now() - 3 * 86400000).toISOString().split('T')[0],
        timestamp: Date.now() - 3 * 86400000,
        workoutName: 'Pull Day (Back, Biceps, Rear Delts)',
        durationMinutes: 52,
        estimatedCaloriesBurned: 345,
        exercisesCount: 4,
        setsCompleted: 15,
        totalVolumeKg: 5240,
        exercisesSummary: [
          { nameEn: 'Conventional Barbell Deadlift', nameAr: 'الرفعة الميتة بالبار', setsCompleted: 4, bestWeightKg: 120, bestReps: 6 },
          { nameEn: 'Lat Pulldown', nameAr: 'سحب علوي للظهر', setsCompleted: 4, bestWeightKg: 65, bestReps: 10 },
          { nameEn: 'Seated Cable Row', nameAr: 'سحب أرضي للكابل', setsCompleted: 4, bestWeightKg: 60, bestReps: 10 },
          { nameEn: 'Incline Dumbbell Curl', nameAr: 'تبادل بايسبس مائل', setsCompleted: 3, bestWeightKg: 16, bestReps: 10 },
        ],
      },
    ];

    saveWorkoutLogs(initialWorkouts);
    return initialWorkouts;
  } catch {
    return [];
  }
}

export function saveWorkoutLogs(logs: WorkoutLog[]): void {
  try {
    localStorage.setItem(KEYS.WORKOUT_LOGS, JSON.stringify(logs));
  } catch (e) {
    console.warn('Error saving workout logs:', e);
  }
}

// Personal Records (PRs)
export function loadPersonalRecords(): PersonalRecord[] {
  try {
    const raw = localStorage.getItem(KEYS.PERSONAL_RECORDS);
    if (raw) return JSON.parse(raw);

    const initialPrs: PersonalRecord[] = [
      {
        id: 'pr_bench',
        exerciseId: 'ex_bench_press',
        exerciseNameEn: 'Barbell Flat Bench Press',
        exerciseNameAr: 'ضغط الصدر بالبار على مقعد مستوٍ',
        weightKg: 85,
        reps: 6,
        estimated1RmKg: 102,
        date: new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0],
        source: 'user_manual',
        notes: 'Good clean pause at the bottom',
      },
      {
        id: 'pr_deadlift',
        exerciseId: 'ex_deadlift',
        exerciseNameEn: 'Conventional Barbell Deadlift',
        exerciseNameAr: 'الرفعة الميتة التقليدية بالبار',
        weightKg: 130,
        reps: 5,
        estimated1RmKg: 151,
        date: new Date(Date.now() - 14 * 86400000).toISOString().split('T')[0],
        source: 'user_manual',
        notes: 'Belted, double overhand with hook grip',
      },
      {
        id: 'pr_squat',
        exerciseId: 'ex_back_squat',
        exerciseNameEn: 'Barbell Back Squat',
        exerciseNameAr: 'تمرين القرفصاء الخلفي بالبار',
        weightKg: 110,
        reps: 6,
        estimated1RmKg: 132,
        date: new Date(Date.now() - 10 * 86400000).toISOString().split('T')[0],
        source: 'workout_log',
        notes: 'Below parallel depth',
      },
      {
        id: 'pr_ohp',
        exerciseId: 'ex_overhead_press',
        exerciseNameEn: 'Overhead Barbell Shoulder Press',
        exerciseNameAr: 'ضغط الأكتاف بالبار واقفاً',
        weightKg: 55,
        reps: 8,
        estimated1RmKg: 69,
        date: new Date(Date.now() - 18 * 86400000).toISOString().split('T')[0],
        source: 'user_manual',
      },
    ];

    savePersonalRecords(initialPrs);
    return initialPrs;
  } catch {
    return [];
  }
}

export function savePersonalRecords(prs: PersonalRecord[]): void {
  try {
    localStorage.setItem(KEYS.PERSONAL_RECORDS, JSON.stringify(prs));
  } catch (e) {
    console.warn('Error saving personal records:', e);
  }
}

// InBody & Body Composition Reports
export function loadInBodyReports(): InBodyReport[] {
  try {
    const raw = localStorage.getItem(KEYS.INBODY_REPORTS);
    if (raw) return JSON.parse(raw);

    const initialReports: InBodyReport[] = [
      {
        id: 'inbody_1',
        date: new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0],
        weightKg: 79.5,
        bodyFatPercentage: 18.2,
        fatMassKg: 14.5,
        skeletalMuscleMassKg: 36.2,
        totalBodyWaterL: 47.1,
        visceralFatLevel: 6,
        bmrKcal: 1780,
        source: 'inbody_device',
        notes: 'InBody 270 scan at Gold Gym Egypt',
      },
      {
        id: 'inbody_2',
        date: new Date(Date.now() - 5 * 86400000).toISOString().split('T')[0],
        weightKg: 78.0,
        bodyFatPercentage: 16.8,
        fatMassKg: 13.1,
        skeletalMuscleMassKg: 36.8,
        totalBodyWaterL: 47.6,
        visceralFatLevel: 5,
        bmrKcal: 1810,
        source: 'inbody_device',
        notes: 'Follow-up scan. Gained 0.6kg muscle, lost 1.4kg fat!',
      },
    ];

    saveInBodyReports(initialReports);
    return initialReports;
  } catch {
    return [];
  }
}

export function saveInBodyReports(reports: InBodyReport[]): void {
  try {
    localStorage.setItem(KEYS.INBODY_REPORTS, JSON.stringify(reports));
  } catch (e) {
    console.warn('Error saving InBody reports:', e);
  }
}

// Custom Workout Routines created by user
export function loadCustomRoutines(): WorkoutProgram[] {
  try {
    const raw = localStorage.getItem(KEYS.CUSTOM_ROUTINES);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveCustomRoutines(routines: WorkoutProgram[]): void {
  try {
    localStorage.setItem(KEYS.CUSTOM_ROUTINES, JSON.stringify(routines));
  } catch (e) {
    console.warn('Error saving custom routines:', e);
  }
}

export function loadProgressRecords(): ProgressRecord[] {
  try {
    const raw = localStorage.getItem(KEYS.PROGRESS_RECORDS);
    if (raw) return JSON.parse(raw);

    const initialProgress: ProgressRecord[] = [
      { id: 'pr_1', date: new Date(Date.now() - 28 * 86400000).toISOString().split('T')[0], weightKg: 80.2, waistCm: 89, chestCm: 104, hipsCm: 102, armsCm: 36.5, notes: 'Starting month check-in' },
      { id: 'pr_2', date: new Date(Date.now() - 21 * 86400000).toISOString().split('T')[0], weightKg: 79.5, waistCm: 88, chestCm: 104.5, hipsCm: 101.5, armsCm: 37 },
      { id: 'pr_3', date: new Date(Date.now() - 14 * 86400000).toISOString().split('T')[0], weightKg: 78.8, waistCm: 87.2, chestCm: 105, hipsCm: 101, armsCm: 37.2 },
      { id: 'pr_4', date: new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0], weightKg: 78.4, waistCm: 86.5, chestCm: 105.2, hipsCm: 100.5, armsCm: 37.5 },
      { id: 'pr_5', date: getTodayDateString(), weightKg: 78.0, waistCm: 86, chestCm: 105.5, hipsCm: 100, armsCm: 37.8, notes: 'Reached target body recomposition milestone' },
    ];

    saveProgressRecords(initialProgress);
    return initialProgress;
  } catch {
    return [];
  }
}

export function saveProgressRecords(records: ProgressRecord[]): void {
  try {
    localStorage.setItem(KEYS.PROGRESS_RECORDS, JSON.stringify(records));
  } catch (e) {
    console.warn('Error saving progress records:', e);
  }
}

export function loadPantryItems(): PantryItem[] {
  try {
    const raw = localStorage.getItem(KEYS.PANTRY_ITEMS);
    if (raw) return JSON.parse(raw);

    const initialPantry: PantryItem[] = [
      { id: 'pi_1', nameEn: 'Eggs', nameAr: 'بيض بلدي', category: 'protein', quantity: '12 pcs' },
      { id: 'pi_2', nameEn: 'Egyptian Baladi Bread', nameAr: 'عيش بلدي', category: 'grains', quantity: '5 loaves' },
      { id: 'pi_3', nameEn: 'Oats', nameAr: 'شوفان كامل الحبة', category: 'grains', quantity: '1 kg' },
      { id: 'pi_4', nameEn: 'Extra Virgin Olive Oil', nameAr: 'زيت زيتون بكر ممتاز', category: 'oils', quantity: '500 ml' },
      { id: 'pi_5', nameEn: 'Foul Medames (Canned/Cooked)', nameAr: 'فول مدمس', category: 'legumes', quantity: '3 cans' },
      { id: 'pi_6', nameEn: 'Canned Tuna in Water', nameAr: 'تونة قطع في ماء', category: 'protein', quantity: '4 cans' },
      { id: 'pi_7', nameEn: 'Cottage Cheese (Quraish)', nameAr: 'جبنة قريش فلاحي', category: 'dairy', quantity: '500 g' },
      { id: 'pi_8', nameEn: 'Tomatoes & Cucumbers', nameAr: 'طماطم وخيار طازج', category: 'vegetables', quantity: '1 kg' },
    ];

    savePantryItems(initialPantry);
    return initialPantry;
  } catch {
    return [];
  }
}

export function savePantryItems(items: PantryItem[]): void {
  try {
    localStorage.setItem(KEYS.PANTRY_ITEMS, JSON.stringify(items));
  } catch (e) {
    console.warn('Error saving pantry items:', e);
  }
}

export function loadGroceryItems(): GroceryItem[] {
  try {
    const raw = localStorage.getItem(KEYS.GROCERY_ITEMS);
    if (raw) return JSON.parse(raw);

    const initialGroceries: GroceryItem[] = [
      { id: 'g1', nameEn: 'Chicken Breasts (Fresh)', nameAr: 'صدور دجاج مخلية طازجة', amount: '1 kg', category: 'protein', checked: false, userPrice: 180, currency: 'EGP' },
      { id: 'g2', nameEn: 'Greek Yogurt (Plain 0%)', nameAr: 'زبادي يوناني سادة', amount: '2 tubs', category: 'dairy', checked: false, userPrice: 65, currency: 'EGP' },
      { id: 'g3', nameEn: 'Bananas', nameAr: 'موز بلدي', amount: '1 kg', category: 'fruits', checked: true, userPrice: 30, currency: 'EGP' },
      { id: 'g4', nameEn: 'Raw Almonds', nameAr: 'لوز نيء غير مملح', amount: '250 g', category: 'nuts', checked: false, userPrice: 120, currency: 'EGP' },
      { id: 'g5', nameEn: 'Spinach / Molokhia leaves', nameAr: 'سبانخ / ملوخية طازجة', amount: '1 bundle', category: 'vegetables', checked: false, userPrice: 20, currency: 'EGP' },
    ];

    saveGroceryItems(initialGroceries);
    return initialGroceries;
  } catch {
    return [];
  }
}

export function saveGroceryItems(items: GroceryItem[]): void {
  try {
    localStorage.setItem(KEYS.GROCERY_ITEMS, JSON.stringify(items));
  } catch (e) {
    console.warn('Error saving grocery items:', e);
  }
}

export function loadReminders(): HabitReminder[] {
  try {
    const raw = localStorage.getItem(KEYS.REMINDERS);
    if (raw) return JSON.parse(raw);

    const initialReminders: HabitReminder[] = [
      { id: 'r1', habitKey: 'water', titleEn: 'Drink Water (500ml)', titleAr: 'شرب 500 مل ماء', time: '10:00', enabled: true, messageEn: 'Hydration supports recovery and metabolic rate.', messageAr: 'الترطيب المنتظم يدعم حرق السعرات والأداء العضلي.' },
      { id: 'r2', habitKey: 'food', titleEn: 'Log Lunch Meal', titleAr: 'تسجيل وجبة الغداء', time: '14:30', enabled: true, messageEn: 'Keep macros on target for today.', messageAr: 'سجل غداءك لمتابعة استهلاك البروتين والسعرات.' },
      { id: 'r3', habitKey: 'workout', titleEn: 'Today\'s Training Session', titleAr: 'تمرين اليوم المجدول', time: '17:00', enabled: true, messageEn: 'Ready for today\'s scheduled workout!', messageAr: 'حان وقت تمرينك المجدول اليوم لتحقيق هدفك!' },
      { id: 'r4', habitKey: 'sleep', titleEn: 'Wind Down for 7-8h Sleep', titleAr: 'الاستعداد للنوم الكافي', time: '22:30', enabled: true, messageEn: 'Optimal muscle growth occurs during deep sleep.', messageAr: 'النوم العميق أساسي للبناء العضلي وتوازن الهرمونات.' },
    ];

    saveReminders(initialReminders);
    return initialReminders;
  } catch {
    return [];
  }
}

export function saveReminders(reminders: HabitReminder[]): void {
  try {
    localStorage.setItem(KEYS.REMINDERS, JSON.stringify(reminders));
  } catch (e) {
    console.warn('Error saving reminders:', e);
  }
}

export function loadLiveWorkout(): LiveWorkoutState | null {
  try {
    const raw = localStorage.getItem(KEYS.LIVE_WORKOUT);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveLiveWorkout(state: LiveWorkoutState | null): void {
  try {
    if (!state) {
      localStorage.removeItem(KEYS.LIVE_WORKOUT);
    } else {
      localStorage.setItem(KEYS.LIVE_WORKOUT, JSON.stringify(state));
    }
  } catch (e) {
    console.warn('Error saving live workout:', e);
  }
}

export function exportAllDataJson(): string {
  const data = {
    profile: loadUserProfile(),
    customFoods: loadCustomFoods(),
    dailyLogs: loadDailyLogs(),
    recipes: loadRecipes(),
    workoutLogs: loadWorkoutLogs(),
    personalRecords: loadPersonalRecords(),
    inBodyReports: loadInBodyReports(),
    customRoutines: loadCustomRoutines(),
    progressRecords: loadProgressRecords(),
    pantry: loadPantryItems(),
    groceries: loadGroceryItems(),
    reminders: loadReminders(),
    exportedAt: new Date().toISOString(),
    version: '2.0.0',
  };
  return JSON.stringify(data, null, 2);
}

export function importAllDataJson(jsonStr: string): boolean {
  try {
    const parsed = JSON.parse(jsonStr);
    if (parsed.profile) saveUserProfile(parsed.profile);
    if (parsed.customFoods) saveCustomFoods(parsed.customFoods);
    if (parsed.dailyLogs) saveDailyLogs(parsed.dailyLogs);
    if (parsed.recipes) saveRecipes(parsed.recipes);
    if (parsed.workoutLogs) saveWorkoutLogs(parsed.workoutLogs);
    if (parsed.personalRecords) savePersonalRecords(parsed.personalRecords);
    if (parsed.inBodyReports) saveInBodyReports(parsed.inBodyReports);
    if (parsed.customRoutines) saveCustomRoutines(parsed.customRoutines);
    if (parsed.progressRecords) saveProgressRecords(parsed.progressRecords);
    if (parsed.pantry) savePantryItems(parsed.pantry);
    if (parsed.groceries) saveGroceryItems(parsed.groceries);
    if (parsed.reminders) saveReminders(parsed.reminders);
    return true;
  } catch (e) {
    console.warn('Import failed:', e);
    return false;
  }
}

export function clearAllData(): void {
  Object.values(KEYS).forEach((k) => localStorage.removeItem(k));
}
