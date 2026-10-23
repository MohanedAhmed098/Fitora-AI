/**
 * Fitora AI - Type Definitions
 */

export type Language = 'en' | 'ar';
export type ThemeMode = 'light' | 'dark';
export type ThemePreference = 'light' | 'dark' | 'system';

export type PrimaryGoal = 
  | 'balanced' 
  | 'maintenance' 
  | 'strength' 
  | 'muscle_building' 
  | 'fitness';

export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'very_active' | 'extra_active';
export type WorkoutExperience = 'beginner' | 'intermediate' | 'advanced';
export type DietaryPattern = 'omnivore' | 'vegetarian' | 'vegan' | 'mediterranean' | 'halal' | 'low_carb';
export type EquipmentType = 'gym' | 'home_weights' | 'bands' | 'bodyweight';

export type TrainingEnvironment = 
  | 'gym' 
  | 'home_gym' 
  | 'home_no_equipment' 
  | 'bands' 
  | 'dumbbell_only' 
  | 'barbell_only' 
  | 'machine_only' 
  | 'bodyweight_only' 
  | 'outdoor';

export interface UserProfile {
  name: string;
  age: number;
  gender: 'male' | 'female';
  heightCm: number;
  weightKg: number;
  targetWeightKg?: number;
  preferredUnits: 'metric' | 'imperial';
  activityLevel: ActivityLevel;
  workoutExperience: WorkoutExperience;
  trainingDaysPerWeek: number;
  primaryGoal: PrimaryGoal;
  dietaryPattern: DietaryPattern;
  allergies: string[];
  dislikedFoods: string[];
  foodBudget: 'low' | 'moderate' | 'flexible';
  country: string;
  preferredCuisine: string;
  equipment: EquipmentType[];
  isMinor: boolean;
  addBurnedCaloriesToBudget: boolean;
  consentAiDataUsage: boolean;
  dailyCalorieTarget: number;
  dailyProteinTarget: number;
  dailyCarbsTarget: number;
  dailyFatTarget: number;
  dailyFiberTarget: number;
  waterTargetMl: number;
  language: Language;
  theme: ThemeMode;
  themePreference?: ThemePreference;
  isOnboarded: boolean;
  weeklySchedule?: Record<string, string | null>; // day index '0'..'6' -> program day ID or null for rest day
}

export type FoodCategory = 'egyptian' | 'arabic' | 'international' | 'basic';

export interface FoodItem {
  id: string;
  nameEn: string;
  nameAr: string;
  category: FoodCategory;
  subCategory?: string;
  caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
  fiberPer100g: number;
  servingUnitEn: string;
  servingUnitAr: string;
  gramsPerServing: number;
  cookingMethodEn?: string;
  cookingMethodAr?: string;
  source: 'USDA' | 'Egyptian Nutrition Institute' | 'Verified' | 'Custom' | 'AI Estimate';
  isCustom?: boolean;
  notes?: string;
}

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface LoggedMealItem {
  id: string;
  foodId: string;
  nameEn: string;
  nameAr: string;
  grams: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  mealType: MealType;
  loggedAt: string; // ISO String or HH:MM
  notes?: string;
  isAiEstimated?: boolean;
}

export interface DailyLog {
  date: string; // YYYY-MM-DD
  waterMl: number;
  sleepHours?: number;
  steps?: number;
  meals: LoggedMealItem[];
  completedHabits: {
    water?: boolean;
    foodLogged?: boolean;
    workout?: boolean;
    sleep?: boolean;
    steps?: boolean;
  };
}

export interface RecipeIngredient {
  foodId: string;
  nameEn: string;
  nameAr: string;
  grams: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
}

export interface Recipe {
  id: string;
  nameEn: string;
  nameAr: string;
  servings: number;
  totalWeightGrams: number;
  ingredients: RecipeIngredient[];
  caloriesTotal: number;
  proteinTotal: number;
  carbsTotal: number;
  fatTotal: number;
  fiberTotal: number;
  caloriesPerServing: number;
  proteinPerServing: number;
  carbsPerServing: number;
  fatPerServing: number;
  fiberPerServing: number;
  instructionsEn?: string;
  instructionsAr?: string;
  isCustom?: boolean;
}

export type MuscleGroup = 
  | 'chest' 
  | 'back' 
  | 'shoulders' 
  | 'biceps' 
  | 'triceps' 
  | 'forearms'
  | 'legs' 
  | 'quads'
  | 'hamstrings'
  | 'glutes' 
  | 'calves'
  | 'abs' 
  | 'cardio' 
  | 'mobility'
  | 'full_body';

export interface ExerciseAlternative {
  exerciseId: string;
  nameEn: string;
  nameAr: string;
  differenceEn: string;
  differenceAr: string;
}

export interface Exercise {
  id: string;
  nameEn: string;
  nameAr: string;
  muscleGroup: MuscleGroup;
  primaryMuscleEn?: string;
  primaryMuscleAr?: string;
  secondaryMusclesEn?: string[];
  secondaryMusclesAr?: string[];
  category: 'resistance' | 'cardio' | 'bodyweight' | 'mobility';
  exerciseType?: 'compound' | 'isolation' | 'cardio' | 'mobility' | 'hiit';
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  equipmentEn: string;
  equipmentAr: string;
  suitableFor?: TrainingEnvironment[];
  startingPositionEn: string;
  startingPositionAr: string;
  movementEn: string;
  movementAr: string;
  breathingEn: string;
  breathingAr: string;
  commonMistakesEn: string[];
  commonMistakesAr: string[];
  safetyNotesEn?: string;
  safetyNotesAr?: string;
  easierVariationEn: string;
  easierVariationAr: string;
  harderVariationEn: string;
  harderVariationAr: string;
  alternatives?: ExerciseAlternative[];
  suggestedSets: number;
  suggestedReps: string;
  estimatedCaloriesPerMin?: number;
  videoUrl?: string; // Licensed instructional video
  animationKey?: string; // Biomechanical animated demo key
}

export interface WorkoutProgram {
  id: string;
  nameEn: string;
  nameAr: string;
  descriptionEn: string;
  descriptionAr: string;
  splitType: 'ppl' | 'upper_lower' | 'full_body' | 'custom';
  days: {
    id?: string;
    dayNameEn: string;
    dayNameAr: string;
    targetMuscleEn: string;
    targetMuscleAr: string;
    exerciseIds: string[];
    targetDurationMin: number;
  }[];
}

export interface WorkoutSetTracker {
  setNumber: number;
  reps: number;
  weightKg: number;
  completed: boolean;
  isPr?: boolean;
}

export interface LiveWorkoutState {
  isActive: boolean;
  isPaused: boolean;
  programId?: string;
  dayIndex?: number;
  workoutName: string;
  startTime: number; // timestamp
  elapsedSeconds: number;
  currentExerciseIndex: number;
  exercises: {
    exerciseId: string;
    nameEn: string;
    nameAr: string;
    targetMuscle: string;
    sets: WorkoutSetTracker[];
  }[];
  restTimerSeconds: number;
  restTimerTotal: number;
  restTimerRunning: boolean;
}

export interface WorkoutLog {
  id: string;
  date: string; // YYYY-MM-DD
  timestamp: number;
  workoutName: string;
  durationMinutes: number;
  estimatedCaloriesBurned: number;
  exercisesCount: number;
  setsCompleted: number;
  totalVolumeKg: number;
  exercisesSummary: {
    nameEn: string;
    nameAr: string;
    setsCompleted: number;
    bestWeightKg: number;
    bestReps?: number;
  }[];
}

export interface PersonalRecord {
  id: string;
  exerciseId: string;
  exerciseNameEn: string;
  exerciseNameAr: string;
  weightKg: number;
  reps: number;
  estimated1RmKg: number;
  date: string; // YYYY-MM-DD
  source: 'user_manual' | 'workout_log' | 'ai_suggestion';
  notes?: string;
}

export interface InBodyReport {
  id: string;
  date: string; // YYYY-MM-DD
  weightKg: number;
  bodyFatPercentage?: number;
  fatMassKg?: number;
  skeletalMuscleMassKg?: number;
  totalBodyWaterL?: number;
  visceralFatLevel?: number;
  bmrKcal?: number;
  source: 'inbody_device' | 'manual' | 'ai_extracted';
  imageUrl?: string;
  notes?: string;
}

export interface ProgressRecord {
  id: string;
  date: string; // YYYY-MM-DD
  weightKg: number;
  waistCm?: number;
  chestCm?: number;
  hipsCm?: number;
  armsCm?: number;
  photoUrl?: string; // stored in local IndexedDB or base64
  notes?: string;
}

export interface NutritionPlan {
  id: string;
  titleEn: string;
  titleAr: string;
  tagEn: string;
  tagAr: string;
  targetCalories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG: number;
  descriptionEn: string;
  descriptionAr: string;
  mealsEn: {
    time: string;
    name: string;
    items: string[];
    approxCalories: number;
  }[];
  mealsAr: {
    time: string;
    name: string;
    items: string[];
    approxCalories: number;
  }[];
  shoppingListEn: string[];
  shoppingListAr: string[];
  safeStorageTipsEn: string;
  safeStorageTipsAr: string;
  alternativesEn: string[];
  alternativesAr: string[];
}

export interface PantryItem {
  id: string;
  nameEn: string;
  nameAr: string;
  category: string;
  quantity?: string;
}

export interface GroceryItem {
  id: string;
  nameEn: string;
  nameAr: string;
  amount: string;
  category: string;
  checked: boolean;
  userPrice?: number;
  currency?: string;
}

export interface HabitReminder {
  id: string;
  habitKey: 'water' | 'food' | 'workout' | 'sleep';
  titleEn: string;
  titleAr: string;
  time: string; // HH:MM
  enabled: boolean;
  messageEn: string;
  messageAr: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  audioBase64?: string;
  imageUrl?: string;
  groundingSources?: { title: string; url: string }[];
}
