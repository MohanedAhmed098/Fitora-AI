/**
 * Pure calculation utilities for Fitora AI
 * Tested thoroughly via node:test and tsx.
 */

import { ActivityLevel, PrimaryGoal, RecipeIngredient } from '../types/index.ts';

export interface BmrParams {
  gender: 'male' | 'female';
  weightKg: number;
  heightCm: number;
  age: number;
  isMinor?: boolean;
}

/**
 * Calculates Basal Metabolic Rate using the validated Mifflin-St Jeor equation.
 */
export function calculateBmr(params: BmrParams): number {
  const { gender, weightKg, heightCm, age } = params;
  
  if (weightKg <= 0 || heightCm <= 0 || age <= 0) {
    return 0;
  }

  // Base Mifflin-St Jeor calculation: 10 * weight(kg) + 6.25 * height(cm) - 5 * age
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  const bmr = gender === 'male' ? base + 5 : base - 161;

  return Math.max(800, Math.round(bmr));
}

/**
 * Multipliers based on physical activity level.
 */
export function getActivityMultiplier(level: ActivityLevel): number {
  switch (level) {
    case 'sedentary':
      return 1.2;
    case 'light':
      return 1.375;
    case 'moderate':
      return 1.55;
    case 'very_active':
      return 1.725;
    case 'extra_active':
      return 1.9;
    default:
      return 1.2;
  }
}

/**
 * Calculates Total Daily Energy Expenditure (TDEE).
 */
export function calculateTdee(bmr: number, activityLevel: ActivityLevel): number {
  return Math.round(bmr * getActivityMultiplier(activityLevel));
}

export interface TargetCalculationParams {
  tdee: number;
  weightKg: number;
  age: number;
  primaryGoal: PrimaryGoal;
  isMinor?: boolean;
}

export interface NutritionTargets {
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG: number;
  waterMl: number;
  safetyNoticeEn?: string;
  safetyNoticeAr?: string;
}

/**
 * Calculates safe daily calorie and macronutrient targets.
 * Strict Safety Rule: If user is under 18 (minor), calorie deficit is strictly disallowed.
 */
export function calculateNutritionTargets(params: TargetCalculationParams): NutritionTargets {
  const { tdee, weightKg, age, primaryGoal, isMinor = age < 18 } = params;

  let calorieAdjustment = 0;
  let safetyNoticeEn: string | undefined;
  let safetyNoticeAr: string | undefined;

  if (isMinor || age < 18) {
    // Under 18 safety guard: Focus on growth, healthy fueling, no deficit.
    if (primaryGoal === 'muscle_building') {
      calorieAdjustment = 200; // gentle growth surplus
    } else {
      calorieAdjustment = 0; // maintenance for growth
    }
    safetyNoticeEn = "Under 18 Notice: Nutrition targets prioritize healthy growth, adequate energy, and balanced nourishment. Deficit diets are excluded.";
    safetyNoticeAr = "تنبيه لمن هم دون 18 عاماً: تركز الأهداف على النمو الصحي وتوازن الطاقة. يُحظر اتباع حميات عجز السعرات القاسية.";
  } else {
    // Adults
    switch (primaryGoal) {
      case 'muscle_building':
        calorieAdjustment = 250;
        break;
      case 'strength':
        calorieAdjustment = 150;
        break;
      case 'maintenance':
      case 'balanced':
      case 'fitness':
      default:
        calorieAdjustment = 0;
        break;
    }
  }

  const targetCalories = Math.max(1200, Math.round(tdee + calorieAdjustment));

  // Protein targets (g per kg bodyweight)
  let proteinFactor = 1.6;
  if (primaryGoal === 'muscle_building' || primaryGoal === 'strength') {
    proteinFactor = 2.0;
  } else if (primaryGoal === 'fitness') {
    proteinFactor = 1.7;
  }

  const proteinG = Math.round(Math.min(weightKg * proteinFactor, targetCalories * 0.35 / 4));
  const proteinCals = proteinG * 4;

  // Fat target: ~25% of daily calories (9 kcal/g)
  const fatCalories = targetCalories * 0.25;
  const fatG = Math.round(fatCalories / 9);

  // Remainder is Carbohydrates (4 kcal/g)
  const remainingCals = Math.max(0, targetCalories - (proteinCals + fatG * 9));
  const carbsG = Math.round(remainingCals / 4);

  // Fiber target: roughly 14g per 1000 kcal, clamped between 25g and 45g
  const fiberG = Math.round(Math.min(45, Math.max(25, (targetCalories / 1000) * 14)));

  // Water target: ~35ml per kg bodyweight, minimum 2000ml
  const waterMl = Math.max(2000, Math.round((weightKg * 35) / 250) * 250);

  return {
    calories: targetCalories,
    proteinG,
    carbsG,
    fatG,
    fiberG,
    waterMl,
    safetyNoticeEn,
    safetyNoticeAr,
  };
}

/**
 * Aggregates a list of ingredients into recipe totals and per-serving amounts.
 */
export function calculateRecipeNutrition(ingredients: RecipeIngredient[], servings: number) {
  const safeServings = Math.max(1, servings);

  const totals = ingredients.reduce(
    (acc, ing) => {
      acc.calories += ing.calories || 0;
      acc.protein += ing.protein || 0;
      acc.carbs += ing.carbs || 0;
      acc.fat += ing.fat || 0;
      acc.fiber += ing.fiber || 0;
      acc.weight += ing.grams || 0;
      return acc;
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, weight: 0 }
  );

  return {
    totalWeightGrams: Math.round(totals.weight),
    caloriesTotal: Math.round(totals.calories),
    proteinTotal: Math.round(totals.protein * 10) / 10,
    carbsTotal: Math.round(totals.carbs * 10) / 10,
    fatTotal: Math.round(totals.fat * 10) / 10,
    fiberTotal: Math.round(totals.fiber * 10) / 10,
    perServing: {
      calories: Math.round(totals.calories / safeServings),
      protein: Math.round((totals.protein / safeServings) * 10) / 10,
      carbs: Math.round((totals.carbs / safeServings) * 10) / 10,
      fat: Math.round((totals.fat / safeServings) * 10) / 10,
      fiber: Math.round((totals.fiber / safeServings) * 10) / 10,
    },
  };
}

/**
 * Calculates estimated calorie burn for workout activities.
 * Clearly identified as an estimate.
 */
export function estimateWorkoutCalories(
  durationMinutes: number, 
  userWeightKg: number, 
  category: 'resistance' | 'cardio' | 'bodyweight' | 'mobility'
): number {
  if (durationMinutes <= 0 || userWeightKg <= 0) return 0;

  // Approximate MET values:
  // Resistance: 5.0 MET
  // Cardio: 7.5 MET
  // Bodyweight/HIIT: 6.0 MET
  // Mobility/Yoga: 2.5 MET
  let met = 5.0;
  if (category === 'cardio') met = 7.5;
  else if (category === 'bodyweight') met = 6.0;
  else if (category === 'mobility') met = 2.5;

  // Calories burned = (MET * 3.5 * weightKg / 200) * durationMinutes
  const cals = ((met * 3.5 * userWeightKg) / 200) * durationMinutes;
  return Math.round(cals);
}

/**
 * Unit conversions
 */
export function kgToLbs(kg: number): number {
  return Math.round(kg * 2.20462 * 10) / 10;
}

export function lbsToKg(lbs: number): number {
  return Math.round((lbs / 2.20462) * 10) / 10;
}

export function cmToInches(cm: number): number {
  return Math.round((cm / 2.54) * 10) / 10;
}

export function inchesToCm(inches: number): number {
  return Math.round(inches * 2.54 * 10) / 10;
}
