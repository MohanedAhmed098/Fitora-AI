import React, { useState, useRef } from 'react';
import { Language, MealType, LoggedMealItem } from '../types/index.ts';
import { translations } from '../data/translations.ts';
import {
  Camera,
  Upload,
  Sparkles,
  AlertCircle,
  Plus,
  Trash2,
  Check,
  RotateCcw,
  Info,
  Clock,
} from 'lucide-react';

interface ScannedIngredient {
  nameEn: string;
  nameAr: string;
  grams: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  notes?: string;
}

interface ScanResult {
  dishNameEn: string;
  dishNameAr: string;
  confidence: string;
  totalGrams: number;
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  totalFiber: number;
  ingredients: ScannedIngredient[];
  estimateNoticeEn?: string;
  estimateNoticeAr?: string;
}

interface FoodScannerModalProps {
  language: Language;
  onClose: () => void;
  onSaveMeal: (items: LoggedMealItem[], mealType: MealType) => void;
}

export const FoodScannerModal: React.FC<FoodScannerModalProps> = ({
  language,
  onClose,
  onSaveMeal,
}) => {
  const t = translations[language];

  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string>('image/jpeg');
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [mealType, setMealType] = useState<MealType>('lunch');

  // Interactive camera stream state
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const startCamera = async () => {
    setErrorMessage(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setIsCameraActive(true);
    } catch (err: any) {
      console.warn('Camera access denied or unsupported:', err);
      setErrorMessage(
        language === 'ar'
          ? 'تعذر الوصول للكاميرا المباشرة. يمكنك رفع صورة مباشرة من جهازك.'
          : 'Unable to access camera directly. Please upload a photo from your device.'
      );
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      setSelectedImage(dataUrl);
      setMimeType('image/jpeg');
      stopCamera();
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMessage(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMessage(
        language === 'ar' ? 'يرجى اختيار ملف صورة صالح (JPEG أو PNG)' : 'Please select a valid image file (JPEG or PNG)'
      );
      return;
    }

    setMimeType(file.type);
    const reader = new FileReader();
    reader.onload = (event) => {
      setSelectedImage(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const analyzeImage = async () => {
    if (!selectedImage) return;

    setIsAnalyzing(true);
    setErrorMessage(null);

    try {
      const response = await fetch('/api/scan-food', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: selectedImage,
          mimeType,
          userLanguage: language,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (data.quotaExceeded && data.ingredients) {
        setScanResult(data);
        return;
      }

      if (!response.ok) {
        setErrorMessage(
          data.message ||
            (language === 'ar'
              ? 'خدمة فحص الصور غير متاحة حالياً أو تم استهلاك الحصة. يمكنك تسجيل الوجبة يدوياً من قاعدة الأطعمة.'
              : 'Food scanner is currently unavailable or quota reached. You can log food manually.')
        );
        return;
      }

      setScanResult(data);
    } catch {
      setErrorMessage(
        language === 'ar'
          ? 'تعذر الاتصال بخدمة التحليل. يمكنك تسجيل مكونات وجبتك يدوياً عبر البحث.'
          : 'Unable to reach analysis service. Please log your food manually using search.'
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Ingredient editing
  const updateIngredient = (index: number, field: keyof ScannedIngredient, value: any) => {
    if (!scanResult) return;
    const updatedIngredients = [...scanResult.ingredients];
    updatedIngredients[index] = {
      ...updatedIngredients[index],
      [field]: value,
    };

    // Recalculate totals
    const totalCals = updatedIngredients.reduce((sum, item) => sum + (Number(item.calories) || 0), 0);
    const totalP = updatedIngredients.reduce((sum, item) => sum + (Number(item.protein) || 0), 0);
    const totalC = updatedIngredients.reduce((sum, item) => sum + (Number(item.carbs) || 0), 0);
    const totalF = updatedIngredients.reduce((sum, item) => sum + (Number(item.fat) || 0), 0);
    const totalG = updatedIngredients.reduce((sum, item) => sum + (Number(item.grams) || 0), 0);

    setScanResult({
      ...scanResult,
      ingredients: updatedIngredients,
      totalCalories: Math.round(totalCals),
      totalProtein: Math.round(totalP),
      totalCarbs: Math.round(totalC),
      totalFat: Math.round(totalF),
      totalGrams: Math.round(totalG),
    });
  };

  const removeIngredient = (index: number) => {
    if (!scanResult) return;
    const updated = scanResult.ingredients.filter((_, i) => i !== index);
    const totalCals = updated.reduce((sum, item) => sum + (Number(item.calories) || 0), 0);
    setScanResult({
      ...scanResult,
      ingredients: updated,
      totalCalories: Math.round(totalCals),
    });
  };

  const addCustomIngredient = () => {
    if (!scanResult) return;
    const newIng: ScannedIngredient = {
      nameEn: 'Cooking Oil / Sauce',
      nameAr: 'زيت طهي / صلصة إضافية',
      grams: 15,
      calories: 120,
      protein: 0,
      carbs: 0,
      fat: 14,
      fiber: 0,
    };
    setScanResult({
      ...scanResult,
      ingredients: [...scanResult.ingredients, newIng],
      totalCalories: scanResult.totalCalories + 120,
      totalFat: scanResult.totalFat + 14,
      totalGrams: scanResult.totalGrams + 15,
    });
  };

  const confirmAndSave = () => {
    if (!scanResult) return;

    const loggedItems: LoggedMealItem[] = scanResult.ingredients.map((ing, idx) => ({
      id: `ai_scan_${Date.now()}_${idx}`,
      foodId: `custom_ai_${idx}`,
      nameEn: ing.nameEn,
      nameAr: ing.nameAr || ing.nameEn,
      grams: ing.grams,
      calories: ing.calories,
      protein: ing.protein,
      carbs: ing.carbs,
      fat: ing.fat,
      fiber: ing.fiber || 0,
      mealType,
      loggedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isAiEstimated: true,
      notes: `AI Scan: ${language === 'ar' ? scanResult.dishNameAr : scanResult.dishNameEn}`,
    }));

    onSaveMeal(loggedItems, mealType);
    stopCamera();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/80 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-[#1a2217] w-full max-w-2xl rounded-2xl shadow-2xl border border-stone-200 dark:border-stone-800 p-5 sm:p-6 my-auto text-stone-900 dark:text-stone-100 max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold">{t.scanner.title}</h2>
              <span className="text-[11px] text-stone-500 dark:text-stone-400">
                {language === 'ar' ? 'مدعوم بنموذج Gemini 4 Argon مع تفكيك المكونات' : 'Powered by Gemini 4 Argon with ingredient deconstruction'}
              </span>
            </div>
          </div>
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 font-bold text-sm"
          >
            ✕
          </button>
        </div>

        {/* Camera or Image Preview Section */}
        {!scanResult && (
          <div className="space-y-4">
            {/* Live Camera View */}
            {isCameraActive ? (
              <div className="relative rounded-2xl overflow-hidden bg-black aspect-video flex items-center justify-center">
                <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                <div className="absolute bottom-4 left-0 right-0 flex items-center justify-center gap-4">
                  <button
                    onClick={capturePhoto}
                    className="w-14 h-14 rounded-full border-4 border-white bg-emerald-500 text-white flex items-center justify-center shadow-lg hover:scale-105 active:scale-95"
                    title="Capture Photo"
                  >
                    <Camera className="w-6 h-6" />
                  </button>
                  <button
                    onClick={stopCamera}
                    className="px-4 py-2 rounded-xl bg-stone-900/80 text-white text-xs font-semibold"
                  >
                    {t.common.cancel}
                  </button>
                </div>
              </div>
            ) : selectedImage ? (
              /* Selected Image Preview */
              <div className="relative rounded-2xl overflow-hidden border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800/40">
                <img src={selectedImage} alt="Food to scan" className="w-full max-h-72 object-contain mx-auto" />
                <button
                  onClick={() => setSelectedImage(null)}
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-stone-900/70 text-white hover:bg-stone-900"
                  title="Remove image"
                >
                  ✕
                </button>
              </div>
            ) : (
              /* Upload Options Box */
              <div className="border-2 border-dashed border-stone-300 dark:border-stone-700 rounded-2xl p-6 text-center space-y-4">
                <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
                  <Camera className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm font-bold">{t.scanner.subtitle}</h3>
                  <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 max-w-md mx-auto">
                    {language === 'ar'
                      ? 'التقط صورة لطبقك (فول، كشري، كبدة، دجاج مشوي) أو ارفع صورة لتحليل سعراتها وماكروزها.'
                      : 'Take a photo of your meal (koshari, foul, grilled chicken, salmon) to estimate calories and ingredients.'}
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                  <button
                    onClick={startCamera}
                    className="px-4 py-2.5 rounded-xl bg-[#4D6A34] text-white font-bold text-xs flex items-center gap-2 hover:bg-[#3B5323] transition-colors"
                  >
                    <Camera className="w-4 h-4" />
                    <span>{t.scanner.takePhoto}</span>
                  </button>

                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 font-bold text-xs flex items-center gap-2 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                  >
                    <Upload className="w-4 h-4" />
                    <span>{t.scanner.uploadPhoto}</span>
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </div>
              </div>
            )}

            {/* Error message */}
            {errorMessage && (
              <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Analyze Action Button */}
            {selectedImage && !isCameraActive && (
              <button
                onClick={analyzeImage}
                disabled={isAnalyzing}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-[#4D6A34] to-[#6E9447] text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-md hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 transition-all"
              >
                <Sparkles className="w-4 h-4" />
                <span>{isAnalyzing ? t.scanner.analyzing : (language === 'ar' ? 'تحليل الوجبة الآن بالذكاء الاصطناعي' : 'Analyze Meal with Gemini')}</span>
              </button>
            )}
          </div>
        )}

        {/* Scan Results & Interactive Breakdown Section */}
        {scanResult && (
          <div className="space-y-5">
            {/* Dish Summary Banner */}
            <div className="bg-[#EBF2E8] dark:bg-[#283620] p-4 rounded-xl border border-[#4D6A34]/20">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#4D6A34] dark:text-[#85A947]">
                    {language === 'ar' ? 'الطبق المكتشف' : 'Identified Dish'}
                  </span>
                  <h3 className="text-lg font-black text-[#2D3E1E] dark:text-[#D4DFCD]">
                    {language === 'ar' ? scanResult.dishNameAr : scanResult.dishNameEn}
                  </h3>
                </div>
                <div className="text-end">
                  <span className="text-2xl font-black text-[#3B5323] dark:text-[#A7D184]">
                    {scanResult.totalCalories}
                  </span>
                  <span className="text-xs text-stone-500 block">{t.common.kcal}</span>
                </div>
              </div>

              {/* Total Macros Summary */}
              <div className="grid grid-cols-4 gap-2 text-center mt-3 pt-3 border-t border-[#4D6A34]/20 text-xs">
                <div>
                  <span className="text-[10px] text-stone-500 block">{t.common.protein}</span>
                  <span className="font-extrabold text-sky-700 dark:text-sky-300">{scanResult.totalProtein}g</span>
                </div>
                <div>
                  <span className="text-[10px] text-stone-500 block">{t.common.carbs}</span>
                  <span className="font-extrabold text-amber-700 dark:text-amber-300">{scanResult.totalCarbs}g</span>
                </div>
                <div>
                  <span className="text-[10px] text-stone-500 block">{t.common.fat}</span>
                  <span className="font-extrabold text-emerald-700 dark:text-emerald-300">{scanResult.totalFat}g</span>
                </div>
                <div>
                  <span className="text-[10px] text-stone-500 block">{t.common.fiber}</span>
                  <span className="font-extrabold text-purple-700 dark:text-purple-300">{scanResult.totalFiber || 0}g</span>
                </div>
              </div>
            </div>

            {/* Disclaimer */}
            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-[11px] text-amber-900 dark:text-amber-200 flex items-start gap-2">
              <Info className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-600" />
              <span>{t.scanner.disclaimer}</span>
            </div>

            {/* Constituent Ingredients Breakdown (Editable) */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-bold text-stone-800 dark:text-stone-200">
                  {t.scanner.ingredientsBreakdown} ({scanResult.ingredients.length})
                </h4>
                <button
                  type="button"
                  onClick={addCustomIngredient}
                  className="text-xs font-bold text-[#4D6A34] dark:text-[#85A947] hover:underline flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{t.scanner.addIngredient}</span>
                </button>
              </div>

              <div className="space-y-2">
                {scanResult.ingredients.map((ing, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200 dark:border-stone-700 space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <input
                        type="text"
                        value={language === 'ar' ? ing.nameAr || ing.nameEn : ing.nameEn}
                        onChange={(e) =>
                          updateIngredient(
                            idx,
                            language === 'ar' ? 'nameAr' : 'nameEn',
                            e.target.value
                          )
                        }
                        className="font-bold bg-transparent border-b border-dashed border-stone-300 dark:border-stone-600 focus:outline-none flex-1 text-xs"
                      />
                      <button
                        onClick={() => removeIngredient(idx)}
                        className="text-stone-400 hover:text-rose-500 p-1"
                        title={t.common.delete}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-4 gap-2 text-[11px]">
                      <div>
                        <label className="text-[10px] text-stone-400 block">{t.common.weight} (g)</label>
                        <input
                          type="number"
                          value={ing.grams}
                          onChange={(e) => updateIngredient(idx, 'grams', Number(e.target.value))}
                          className="w-full px-2 py-1 rounded border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-stone-400 block">{t.common.calories}</label>
                        <input
                          type="number"
                          value={ing.calories}
                          onChange={(e) => updateIngredient(idx, 'calories', Number(e.target.value))}
                          className="w-full px-2 py-1 rounded border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-stone-400 block">{t.common.protein} (g)</label>
                        <input
                          type="number"
                          value={ing.protein}
                          onChange={(e) => updateIngredient(idx, 'protein', Number(e.target.value))}
                          className="w-full px-2 py-1 rounded border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-stone-400 block">{t.common.carbs} (g)</label>
                        <input
                          type="number"
                          value={ing.carbs}
                          onChange={(e) => updateIngredient(idx, 'carbs', Number(e.target.value))}
                          className="w-full px-2 py-1 rounded border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-xs"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Meal Type Picker */}
            <div>
              <label className="block text-xs font-semibold mb-1">{t.scanner.selectMealType}</label>
              <div className="grid grid-cols-4 gap-2 text-xs">
                {(['breakfast', 'lunch', 'dinner', 'snack'] as MealType[]).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMealType(m)}
                    className={`py-2 rounded-xl border text-center capitalize transition-all ${
                      mealType === m
                        ? 'border-[#4D6A34] bg-[#EBF2E8] dark:bg-[#283620] text-[#3B5323] dark:text-[#A7D184] font-bold'
                        : 'border-stone-200 dark:border-stone-700'
                    }`}
                  >
                    {t.nutrition[m === 'snack' ? 'snacks' : m]}
                  </button>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setScanResult(null)}
                className="px-4 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 text-xs font-semibold flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{language === 'ar' ? 'إعادة التصوير' : 'Rescan'}</span>
              </button>

              <button
                type="button"
                onClick={confirmAndSave}
                className="px-6 py-2.5 rounded-xl bg-[#4D6A34] hover:bg-[#3B5323] text-white text-xs font-extrabold flex items-center gap-2 shadow-md shadow-[#4D6A34]/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                <Check className="w-4 h-4" />
                <span>{t.scanner.saveToDiary}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
