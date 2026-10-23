import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateBmr,
  calculateTdee,
  calculateNutritionTargets,
  calculateRecipeNutrition,
  estimateWorkoutCalories,
  kgToLbs,
  lbsToKg,
  cmToInches,
  inchesToCm
} from './nutritionCalculations.ts';

test('calculateBmr: computes correct Mifflin-St Jeor for males', () => {
  // Male, 80kg, 180cm, 25 years: 10*80 + 6.25*180 - 5*25 + 5 = 800 + 1125 - 125 + 5 = 1805
  const bmr = calculateBmr({ gender: 'male', weightKg: 80, heightCm: 180, age: 25 });
  assert.equal(bmr, 1805);
});

test('calculateBmr: computes correct Mifflin-St Jeor for females', () => {
  // Female, 60kg, 165cm, 30 years: 10*60 + 6.25*165 - 5*30 - 161 = 600 + 1031.25 - 150 - 161 = 1320.25 -> 1320
  const bmr = calculateBmr({ gender: 'female', weightKg: 60, heightCm: 165, age: 30 });
  assert.equal(bmr, 1320);
});

test('calculateTdee: correctly applies activity multipliers', () => {
  const bmr = 1800;
  assert.equal(calculateTdee(bmr, 'sedentary'), Math.round(1800 * 1.2));
  assert.equal(calculateTdee(bmr, 'moderate'), Math.round(1800 * 1.55));
  assert.equal(calculateTdee(bmr, 'very_active'), Math.round(1800 * 1.725));
});

test('calculateNutritionTargets: enforces under-18 safety policy', () => {
  const minorTargets = calculateNutritionTargets({
    tdee: 2200,
    weightKg: 65,
    age: 16,
    primaryGoal: 'balanced',
    isMinor: true
  });
  // Must NOT have a calorie deficit
  assert.ok(minorTargets.calories >= 2200, 'Minor must not have calorie deficit');
  assert.ok(minorTargets.safetyNoticeEn !== undefined, 'Safety notice must be provided');
  assert.ok(minorTargets.safetyNoticeEn.includes('Under 18 Notice'));
});

test('calculateNutritionTargets: assigns muscle building surplus and protein', () => {
  const adultTargets = calculateNutritionTargets({
    tdee: 2000,
    weightKg: 75,
    age: 26,
    primaryGoal: 'muscle_building'
  });
  // Surplus 250 kcal
  assert.equal(adultTargets.calories, 2250);
  // Protein factor 2.0g/kg -> 150g
  assert.equal(adultTargets.proteinG, 150);
  assert.ok(adultTargets.carbsG > 0);
  assert.ok(adultTargets.fatG > 0);
  assert.ok(adultTargets.waterMl >= 2000);
});

test('calculateRecipeNutrition: calculates total and per-serving amounts accurately', () => {
  const ingredients = [
    { foodId: '1', nameEn: 'Rice', nameAr: 'أرز', grams: 200, calories: 260, protein: 5, carbs: 56, fat: 1, fiber: 2 },
    { foodId: '2', nameEn: 'Chicken', nameAr: 'دجاج', grams: 200, calories: 330, protein: 62, carbs: 0, fat: 7, fiber: 0 },
    { foodId: '3', nameEn: 'Olive Oil', nameAr: 'زيت زيتون', grams: 14, calories: 120, protein: 0, carbs: 0, fat: 14, fiber: 0 },
  ];

  const result = calculateRecipeNutrition(ingredients, 2);
  assert.equal(result.totalWeightGrams, 414);
  assert.equal(result.caloriesTotal, 710);
  assert.equal(result.proteinTotal, 67);
  assert.equal(result.perServing.calories, 355);
  assert.equal(result.perServing.protein, 33.5);
});

test('estimateWorkoutCalories: produces positive estimates for activities', () => {
  const cardioCals = estimateWorkoutCalories(30, 70, 'cardio');
  const liftingCals = estimateWorkoutCalories(30, 70, 'resistance');
  assert.ok(cardioCals > 0);
  assert.ok(liftingCals > 0);
  assert.ok(cardioCals > liftingCals, 'Cardio should estimate higher MET than resistance');
});

test('unit conversions: accurate round-trip values', () => {
  const kg = 80;
  const lbs = kgToLbs(kg);
  assert.equal(lbs, 176.4);
  const backKg = lbsToKg(lbs);
  assert.equal(Math.round(backKg), 80);

  const cm = 180;
  const inches = cmToInches(cm);
  assert.equal(inches, 70.9);
  const backCm = inchesToCm(inches);
  assert.equal(Math.round(backCm), 180);
});
