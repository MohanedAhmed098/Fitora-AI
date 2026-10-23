import React, { useState, useRef } from 'react';
import {
  X,
  Upload,
  Camera,
  CheckCircle2,
  AlertCircle,
  FileText,
  Calendar,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Percent,
  Activity,
  Droplets,
  Scale,
  Trash2,
  Edit2,
  ShieldCheck,
  Loader2,
} from 'lucide-react';
import { InBodyReport, Language, UserProfile } from '../types/index.ts';

interface InBodyModalProps {
  isOpen: boolean;
  onClose: () => void;
  reports: InBodyReport[];
  profile: UserProfile;
  language: Language;
  onSaveReport: (report: InBodyReport) => void;
  onDeleteReport: (id: string) => void;
}

export const InBodyModal: React.FC<InBodyModalProps> = ({
  isOpen,
  onClose,
  reports,
  profile,
  language,
  onSaveReport,
  onDeleteReport,
}) => {
  const isArabic = language === 'ar';

  const [activeTab, setActiveTab] = useState<'history' | 'add_manual' | 'add_ocr' | 'compare'>('history');
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [reportDate, setReportDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [weightKg, setWeightKg] = useState<string>(profile.weightKg ? String(profile.weightKg) : '');
  const [bodyFatPercentage, setBodyFatPercentage] = useState<string>('');
  const [fatMassKg, setFatMassKg] = useState<string>('');
  const [skeletalMuscleMassKg, setSkeletalMuscleMassKg] = useState<string>('');
  const [totalBodyWaterL, setTotalBodyWaterL] = useState<string>('');
  const [visceralFatLevel, setVisceralFatLevel] = useState<string>('');
  const [bmrKcal, setBmrKcal] = useState<string>('');
  const [reportNotes, setReportNotes] = useState<string>('');
  const [reportSource, setReportSource] = useState<'inbody_device' | 'manual' | 'ai_extracted'>('inbody_device');

  // OCR Upload State
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [ocrError, setOcrError] = useState<string | null>(null);
  const [ocrConfirmationPrompt, setOcrConfirmationPrompt] = useState<boolean>(false);
  const [extractedFields, setExtractedFields] = useState<any>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  // Sorted reports newest first
  const sortedReports = [...reports].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const resetForm = () => {
    setReportDate(new Date().toISOString().split('T')[0]);
    setWeightKg(profile.weightKg ? String(profile.weightKg) : '');
    setBodyFatPercentage('');
    setFatMassKg('');
    setSkeletalMuscleMassKg('');
    setTotalBodyWaterL('');
    setVisceralFatLevel('');
    setBmrKcal('');
    setReportNotes('');
    setReportSource('inbody_device');
    setSelectedImage(null);
    setOcrConfirmationPrompt(false);
    setExtractedFields(null);
    setEditingId(null);
  };

  const handleEditClick = (rep: InBodyReport) => {
    setEditingId(rep.id);
    setReportDate(rep.date);
    setWeightKg(String(rep.weightKg));
    setBodyFatPercentage(rep.bodyFatPercentage ? String(rep.bodyFatPercentage) : '');
    setFatMassKg(rep.fatMassKg ? String(rep.fatMassKg) : '');
    setSkeletalMuscleMassKg(rep.skeletalMuscleMassKg ? String(rep.skeletalMuscleMassKg) : '');
    setTotalBodyWaterL(rep.totalBodyWaterL ? String(rep.totalBodyWaterL) : '');
    setVisceralFatLevel(rep.visceralFatLevel ? String(rep.visceralFatLevel) : '');
    setBmrKcal(rep.bmrKcal ? String(rep.bmrKcal) : '');
    setReportNotes(rep.notes || '');
    setReportSource(rep.source);
    setActiveTab('add_manual');
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!weightKg || isNaN(parseFloat(weightKg))) return;

    const report: InBodyReport = {
      id: editingId || `inbody_${Date.now()}`,
      date: reportDate,
      weightKg: parseFloat(weightKg),
      bodyFatPercentage: bodyFatPercentage ? parseFloat(bodyFatPercentage) : undefined,
      fatMassKg: fatMassKg ? parseFloat(fatMassKg) : undefined,
      skeletalMuscleMassKg: skeletalMuscleMassKg ? parseFloat(skeletalMuscleMassKg) : undefined,
      totalBodyWaterL: totalBodyWaterL ? parseFloat(totalBodyWaterL) : undefined,
      visceralFatLevel: visceralFatLevel ? parseFloat(visceralFatLevel) : undefined,
      bmrKcal: bmrKcal ? parseFloat(bmrKcal) : undefined,
      source: reportSource,
      notes: reportNotes || undefined,
    };

    onSaveReport(report);
    resetForm();
    setActiveTab('history');
  };

  const handleImageFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    setOcrError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      setSelectedImage(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleAnalyzeInBodyImage = async () => {
    if (!selectedImage) return;

    setIsAnalyzing(true);
    setOcrError(null);

    try {
      const response = await fetch('/api/analyze-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageType: 'inbody',
          imageBase64: selectedImage,
          language,
        }),
      });

      const result = await response.json().catch(() => ({}));

      if (result.extracted) {
        setExtractedFields(result.extracted);
        if (result.extracted.weightKg) setWeightKg(String(result.extracted.weightKg));
        if (result.extracted.bodyFatPercentage) setBodyFatPercentage(String(result.extracted.bodyFatPercentage));
        if (result.extracted.fatMassKg) setFatMassKg(String(result.extracted.fatMassKg));
        if (result.extracted.skeletalMuscleMassKg) setSkeletalMuscleMassKg(String(result.extracted.skeletalMuscleMassKg));
        if (result.extracted.totalBodyWaterL) setTotalBodyWaterL(String(result.extracted.totalBodyWaterL));
        if (result.extracted.visceralFatLevel) setVisceralFatLevel(String(result.extracted.visceralFatLevel));
        if (result.extracted.bmrKcal) setBmrKcal(String(result.extracted.bmrKcal));
        if (result.extracted.date) setReportDate(result.extracted.date);
        setReportSource('ai_extracted');
        setOcrConfirmationPrompt(true);
      } else {
        setOcrError(
          isArabic
            ? 'تعذر قراءة بعض الأرقام من الصورة بوضوح. يرجى إدخال القيم الظاهرة في التقرير يدوياً لضمان الدقة.'
            : 'Could not clearly extract all numbers. Please confirm or enter values manually for complete accuracy.'
        );
        setActiveTab('add_manual');
      }
    } catch {
      setOcrError(
        isArabic
          ? 'خدمة المسح الذكي غير متوفرة حالياً. يمكنك إدخال الأرقام من ورقة InBody يدوياً.'
          : 'AI image extraction service unavailable. Please enter numbers manually from your printout.'
      );
      setActiveTab('add_manual');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/70 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white dark:bg-[#1a2217] w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden border border-stone-200 dark:border-stone-800 text-stone-900 dark:text-stone-100 my-8 transition-colors">
        
        {/* Header */}
        <div className="p-4 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between bg-stone-50/70 dark:bg-stone-800/40">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#3B5323] to-[#5C7E3E] text-white flex items-center justify-center shadow-xs">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base">
                {isArabic ? 'سجل InBody وتركيب الجسم' : 'InBody & Body Composition Tracking'}
              </h3>
              <p className="text-[10px] text-stone-400">
                {isArabic ? 'تتبع نسبة الدهون، الكتلة العضلية، والماء بدقة معتمدة' : 'Track Body Fat %, Skeletal Muscle & Water'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Top Tabs */}
        <div className="flex items-center border-b border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-[#151c13] px-3 pt-2 gap-1 text-xs overflow-x-auto">
          <button
            onClick={() => setActiveTab('history')}
            className={`px-3 py-2 border-b-2 font-bold whitespace-nowrap transition-colors ${
              activeTab === 'history'
                ? 'border-[#4D6A34] text-[#4D6A34] dark:text-[#85A947]'
                : 'border-transparent text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
            }`}
          >
            📋 {isArabic ? 'التقارير المسجلة' : 'Saved Reports'} ({reports.length})
          </button>

          <button
            onClick={() => {
              resetForm();
              setActiveTab('add_ocr');
            }}
            className={`px-3 py-2 border-b-2 font-bold flex items-center gap-1.5 whitespace-nowrap transition-colors ${
              activeTab === 'add_ocr'
                ? 'border-[#4D6A34] text-[#4D6A34] dark:text-[#85A947]'
                : 'border-transparent text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
            }`}
          >
            <Camera className="w-3.5 h-3.5 text-[#4D6A34]" />
            <span>{isArabic ? 'مسح تقرير بالكاميرا (OCR)' : 'Scan Report (AI)'}</span>
          </button>

          <button
            onClick={() => {
              resetForm();
              setActiveTab('add_manual');
            }}
            className={`px-3 py-2 border-b-2 font-bold whitespace-nowrap transition-colors ${
              activeTab === 'add_manual'
                ? 'border-[#4D6A34] text-[#4D6A34] dark:text-[#85A947]'
                : 'border-transparent text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
            }`}
          >
            ✏️ {isArabic ? 'إدخال يدوي' : 'Manual Entry'}
          </button>

          {reports.length >= 2 && (
            <button
              onClick={() => setActiveTab('compare')}
              className={`px-3 py-2 border-b-2 font-bold whitespace-nowrap transition-colors ${
                activeTab === 'compare'
                  ? 'border-[#4D6A34] text-[#4D6A34] dark:text-[#85A947]'
                  : 'border-transparent text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
              }`}
            >
              📊 {isArabic ? 'مقارنة التقارير' : 'Compare Scans'}
            </button>
          )}
        </div>

        {/* Modal Content */}
        <div className="p-4 sm:p-6 max-h-[75vh] overflow-y-auto">
          {/* NOTICE: Safe Medical & Body Composition Disclaimer */}
          <div className="p-3 mb-4 rounded-xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200 dark:border-stone-700/60 text-[11px] text-stone-500 dark:text-stone-400 flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-[#4D6A34] shrink-0 mt-0.5" />
            <p className="leading-snug">
              {isArabic
                ? 'تنبيه: لا تدعي كاميرا الهاتف قياس تركيب الجسم مباشرة؛ يتم استخراج الأرقام من تقرير جهاز InBody الفعلي. الأرقام تقديرات مبنية على المقاومة الكهربائية الحيوية (BIA).'
                : 'Notice: Phone cameras do not measure body composition directly; numbers are extracted from your verified InBody device printout. Bioelectrical impedance is an estimate.'}
            </p>
          </div>

          {/* TAB 1: REPORT HISTORY LIST */}
          {activeTab === 'history' && (
            <div className="space-y-4">
              {sortedReports.length === 0 ? (
                <div className="text-center py-10 space-y-3">
                  <div className="w-12 h-12 rounded-full bg-stone-100 dark:bg-stone-800 flex items-center justify-center mx-auto text-stone-400">
                    <FileText className="w-6 h-6" />
                  </div>
                  <h4 className="font-bold text-sm text-stone-700 dark:text-stone-300">
                    {isArabic ? 'لا توجد تقارير InBody مسجلة بعد' : 'No InBody reports recorded yet'}
                  </h4>
                  <p className="text-xs text-stone-400 max-w-sm mx-auto">
                    {isArabic
                      ? 'قم برفع صورة تقرير InBody من الجيم أو إدخال قياساتك يدوياً لمتابعة تطور نسبة الدهون والكتلة العضلية عبر الوقت.'
                      : 'Upload an InBody scan photo or enter measurements manually to track body fat % and muscle mass changes over time.'}
                  </p>
                  <div className="flex justify-center gap-2 pt-2">
                    <button
                      onClick={() => setActiveTab('add_ocr')}
                      className="px-4 py-2 rounded-xl bg-[#4D6A34] text-white text-xs font-bold hover:bg-[#3B5323]"
                    >
                      {isArabic ? 'مسح تقرير مصور' : 'Scan a Report'}
                    </button>
                    <button
                      onClick={() => setActiveTab('add_manual')}
                      className="px-4 py-2 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 text-xs font-bold hover:bg-stone-200"
                    >
                      {isArabic ? 'إدخال يدوي' : 'Manual Entry'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {sortedReports.map((rep, idx) => {
                    const isLatest = idx === 0;
                    return (
                      <div
                        key={rep.id}
                        className={`p-4 rounded-2xl border transition-all ${
                          isLatest
                            ? 'bg-[#EBF2E8]/40 dark:bg-[#283620]/20 border-[#4D6A34]/40'
                            : 'bg-white dark:bg-[#151c13] border-stone-200 dark:border-stone-800'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2.5">
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-xs sm:text-sm">
                              {rep.date}
                            </span>
                            {isLatest && (
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-[#4D6A34] text-white">
                                {isArabic ? 'أحدث فحص' : 'Latest Scan'}
                              </span>
                            )}
                            <span className="px-2 py-0.5 rounded-md text-[9px] font-semibold bg-stone-100 dark:bg-stone-800 text-stone-500">
                              {rep.source === 'inbody_device'
                                ? (isArabic ? 'جهاز InBody' : 'InBody Device')
                                : rep.source === 'ai_extracted'
                                ? (isArabic ? 'استخراج ذكي (OCR)' : 'AI Extracted')
                                : (isArabic ? 'إدخال يدوي' : 'Manual')}
                            </span>
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleEditClick(rep)}
                              className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200"
                              title="Edit report"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => onDeleteReport(rep.id)}
                              className="p-1.5 rounded-lg text-red-400 hover:text-red-600"
                              title="Delete report"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Metrics Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                          <div className="p-2 rounded-xl bg-stone-50 dark:bg-stone-800/60 text-center">
                            <span className="text-[10px] text-stone-400 block">{isArabic ? 'الوزن' : 'Weight'}</span>
                            <span className="font-extrabold text-sm">{rep.weightKg} kg</span>
                          </div>

                          <div className="p-2 rounded-xl bg-stone-50 dark:bg-stone-800/60 text-center">
                            <span className="text-[10px] text-stone-400 block">{isArabic ? 'نسبة الدهون' : 'Body Fat %'}</span>
                            <span className="font-extrabold text-sm text-amber-600 dark:text-amber-400">
                              {rep.bodyFatPercentage ? `${rep.bodyFatPercentage}%` : '—'}
                            </span>
                          </div>

                          <div className="p-2 rounded-xl bg-stone-50 dark:bg-stone-800/60 text-center">
                            <span className="text-[10px] text-stone-400 block">{isArabic ? 'العضلات الهيكلية' : 'Muscle Mass'}</span>
                            <span className="font-extrabold text-sm text-[#4D6A34] dark:text-[#85A947]">
                              {rep.skeletalMuscleMassKg ? `${rep.skeletalMuscleMassKg} kg` : '—'}
                            </span>
                          </div>

                          <div className="p-2 rounded-xl bg-stone-50 dark:bg-stone-800/60 text-center">
                            <span className="text-[10px] text-stone-400 block">{isArabic ? 'ماء الجسم' : 'Body Water'}</span>
                            <span className="font-extrabold text-sm text-sky-600 dark:text-sky-400">
                              {rep.totalBodyWaterL ? `${rep.totalBodyWaterL} L` : '—'}
                            </span>
                          </div>
                        </div>

                        {rep.notes && (
                          <p className="text-[10px] text-stone-500 dark:text-stone-400 mt-2 italic">
                            "{rep.notes}"
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: OCR SCANNER */}
          {activeTab === 'add_ocr' && (
            <div className="space-y-4">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageFile}
                className="hidden"
              />

              {!selectedImage ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-stone-300 dark:border-stone-700 rounded-3xl p-8 text-center cursor-pointer hover:border-[#4D6A34] transition-colors"
                >
                  <div className="w-14 h-14 rounded-full bg-[#EBF2E8] dark:bg-[#283620] text-[#4D6A34] dark:text-[#85A947] flex items-center justify-center mx-auto mb-3">
                    <Upload className="w-7 h-7" />
                  </div>
                  <h4 className="font-bold text-sm text-stone-800 dark:text-stone-200 mb-1">
                    {isArabic ? 'ارفع صورة تقرير InBody أو التقط صورة بالكاميرا' : 'Upload or Photograph InBody Printout'}
                  </h4>
                  <p className="text-xs text-stone-400 max-w-sm mx-auto">
                    {isArabic
                      ? 'سيقوم الذكاء الاصطناعي بقراءة واستخراج الوزن، نسبة الدهون، والكتلة العضلية لتراجعها وتؤكدها بنفسك.'
                      : 'AI will extract visible measurements for your verification before saving.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="relative rounded-2xl overflow-hidden max-h-56 bg-black flex items-center justify-center">
                    <img src={selectedImage} alt="InBody Scan" className="max-h-56 object-contain" />
                    <button
                      onClick={() => setSelectedImage(null)}
                      className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white hover:bg-black/80"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {!ocrConfirmationPrompt ? (
                    <div className="flex gap-2">
                      <button
                        onClick={handleAnalyzeInBodyImage}
                        disabled={isAnalyzing}
                        className="flex-1 py-3 rounded-xl bg-[#4D6A34] text-white text-xs font-bold hover:bg-[#3B5323] flex items-center justify-center gap-2"
                      >
                        {isAnalyzing ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>{isArabic ? 'جاري قراءة الأرقام من الورقة...' : 'Reading numbers from sheet...'}</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4" />
                            <span>{isArabic ? 'بدء الاستخراج الذكي (OCR)' : 'Extract Measurements with AI'}</span>
                          </>
                        )}
                      </button>
                    </div>
                  ) : (
                    <div className="p-4 rounded-2xl bg-[#EBF2E8] dark:bg-[#283620]/40 border border-[#4D6A34]/50 space-y-3">
                      <div className="flex items-center gap-2 text-[#4D6A34] dark:text-[#85A947] font-bold text-xs">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>{isArabic ? 'تم استخراج البيانات! يرجى مراجعتها وتأكيدها:' : 'Extracted! Please verify the values:'}</span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                        <div className="p-2 rounded-lg bg-white dark:bg-[#1a2217]">
                          <span className="text-[10px] text-stone-400 block">{isArabic ? 'الوزن' : 'Weight'}</span>
                          <span className="font-extrabold">{weightKg || '—'} kg</span>
                        </div>
                        <div className="p-2 rounded-lg bg-white dark:bg-[#1a2217]">
                          <span className="text-[10px] text-stone-400 block">{isArabic ? 'نسبة الدهون' : 'Body Fat %'}</span>
                          <span className="font-extrabold text-amber-600">{bodyFatPercentage || '—'}%</span>
                        </div>
                        <div className="p-2 rounded-lg bg-white dark:bg-[#1a2217]">
                          <span className="text-[10px] text-stone-400 block">{isArabic ? 'العضلات الهيكلية' : 'Muscle'}</span>
                          <span className="font-extrabold text-[#4D6A34]">{skeletalMuscleMassKg || '—'} kg</span>
                        </div>
                      </div>

                      <div className="flex gap-2 pt-2">
                        <button
                          onClick={handleSaveForm}
                          className="flex-1 py-2.5 rounded-xl bg-[#4D6A34] text-white text-xs font-bold hover:bg-[#3B5323]"
                        >
                          {isArabic ? 'تأكيد وحفظ التقرير' : 'Confirm & Save Report'}
                        </button>
                        <button
                          onClick={() => setActiveTab('add_manual')}
                          className="px-3 py-2.5 rounded-xl bg-white dark:bg-[#1a2217] text-stone-700 dark:text-stone-300 text-xs font-bold border border-stone-200 dark:border-stone-700"
                        >
                          {isArabic ? 'تعديل الأرقام' : 'Edit Values'}
                        </button>
                      </div>
                    </div>
                  )}

                  {ocrError && (
                    <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200 text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
                      <span>{ocrError}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: MANUAL ENTRY FORM */}
          {activeTab === 'add_manual' && (
            <form onSubmit={handleSaveForm} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="font-bold text-stone-700 dark:text-stone-300 block mb-1">
                    {isArabic ? 'تاريخ الفحص' : 'Scan Date'} *
                  </label>
                  <input
                    type="date"
                    required
                    value={reportDate}
                    onChange={(e) => setReportDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-[#151c13] focus:outline-none focus:ring-2 focus:ring-[#4D6A34]"
                  />
                </div>

                <div>
                  <label className="font-bold text-stone-700 dark:text-stone-300 block mb-1">
                    {isArabic ? 'الوزن الإجمالي (كجم)' : 'Total Weight (kg)'} *
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    placeholder="e.g. 78.5"
                    value={weightKg}
                    onChange={(e) => setWeightKg(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-[#151c13] focus:outline-none focus:ring-2 focus:ring-[#4D6A34]"
                  />
                </div>

                <div>
                  <label className="font-bold text-stone-700 dark:text-stone-300 block mb-1">
                    {isArabic ? 'نسبة الدهون (%)' : 'Body Fat Percentage (%)'}
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="e.g. 16.5"
                    value={bodyFatPercentage}
                    onChange={(e) => setBodyFatPercentage(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-[#151c13] focus:outline-none focus:ring-2 focus:ring-[#4D6A34]"
                  />
                </div>

                <div>
                  <label className="font-bold text-stone-700 dark:text-stone-300 block mb-1">
                    {isArabic ? 'كتلة العضلات الهيكلية SMM (كجم)' : 'Skeletal Muscle Mass (kg)'}
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="e.g. 36.8"
                    value={skeletalMuscleMassKg}
                    onChange={(e) => setSkeletalMuscleMassKg(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-[#151c13] focus:outline-none focus:ring-2 focus:ring-[#4D6A34]"
                  />
                </div>

                <div>
                  <label className="font-bold text-stone-700 dark:text-stone-300 block mb-1">
                    {isArabic ? 'كتلة الدهون الفردية (كجم)' : 'Fat Mass (kg)'}
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="e.g. 13.0"
                    value={fatMassKg}
                    onChange={(e) => setFatMassKg(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-[#151c13] focus:outline-none focus:ring-2 focus:ring-[#4D6A34]"
                  />
                </div>

                <div>
                  <label className="font-bold text-stone-700 dark:text-stone-300 block mb-1">
                    {isArabic ? 'ماء الجسم الكلي TBW (لتر)' : 'Total Body Water (L)'}
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="e.g. 47.5"
                    value={totalBodyWaterL}
                    onChange={(e) => setTotalBodyWaterL(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-[#151c13] focus:outline-none focus:ring-2 focus:ring-[#4D6A34]"
                  />
                </div>

                <div>
                  <label className="font-bold text-stone-700 dark:text-stone-300 block mb-1">
                    {isArabic ? 'مستوى الدهون الحشوية (1-20)' : 'Visceral Fat Level (1-20)'}
                  </label>
                  <input
                    type="number"
                    step="1"
                    placeholder="e.g. 5"
                    value={visceralFatLevel}
                    onChange={(e) => setVisceralFatLevel(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-[#151c13] focus:outline-none focus:ring-2 focus:ring-[#4D6A34]"
                  />
                </div>

                <div>
                  <label className="font-bold text-stone-700 dark:text-stone-300 block mb-1">
                    {isArabic ? 'معدل الأيض الأساسي BMR من التقرير' : 'BMR from Report (kcal)'}
                  </label>
                  <input
                    type="number"
                    step="1"
                    placeholder="e.g. 1790"
                    value={bmrKcal}
                    onChange={(e) => setBmrKcal(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-[#151c13] focus:outline-none focus:ring-2 focus:ring-[#4D6A34]"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-stone-700 dark:text-stone-300 block mb-1 text-xs">
                  {isArabic ? 'ملاحظات إضافية (المكان / الجهاز)' : 'Notes / Location'}
                </label>
                <input
                  type="text"
                  placeholder={isArabic ? 'مثال: فحص جيم النادي صباحاً قبل الإفطار' : 'e.g. Gold Gym morning scan, fasting'}
                  value={reportNotes}
                  onChange={(e) => setReportNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-[#151c13] text-xs focus:outline-none focus:ring-2 focus:ring-[#4D6A34]"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl bg-[#4D6A34] text-white text-xs font-bold hover:bg-[#3B5323] transition-colors"
                >
                  {isArabic ? 'حفظ تقرير InBody' : 'Save InBody Report'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    resetForm();
                    setActiveTab('history');
                  }}
                  className="px-4 py-3 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 text-xs font-bold"
                >
                  {isArabic ? 'إلغاء' : 'Cancel'}
                </button>
              </div>
            </form>
          )}

          {/* TAB 4: COMPARE REPORTS (DELTAS) */}
          {activeTab === 'compare' && sortedReports.length >= 2 && (
            <div className="space-y-4">
              <h4 className="font-extrabold text-xs text-stone-700 dark:text-stone-300">
                {isArabic ? 'مقارنة بين أحدث فحصين:' : 'Comparison Between Last 2 Scans:'}
              </h4>

              {(() => {
                const latest = sortedReports[0];
                const prev = sortedReports[1];

                const deltaWeight = (latest.weightKg - prev.weightKg).toFixed(1);
                const deltaFatPct = latest.bodyFatPercentage && prev.bodyFatPercentage
                  ? (latest.bodyFatPercentage - prev.bodyFatPercentage).toFixed(1)
                  : null;
                const deltaMuscle = latest.skeletalMuscleMassKg && prev.skeletalMuscleMassKg
                  ? (latest.skeletalMuscleMassKg - prev.skeletalMuscleMassKg).toFixed(1)
                  : null;

                return (
                  <div className="p-4 rounded-2xl bg-stone-50 dark:bg-[#151c13] border border-stone-200 dark:border-stone-800 space-y-4 text-xs">
                    <div className="flex items-center justify-between text-stone-500 border-b border-stone-200 dark:border-stone-800 pb-2">
                      <span>{prev.date} ({isArabic ? 'السابق' : 'Previous'})</span>
                      <span className="font-bold text-[#4D6A34]">➔</span>
                      <span>{latest.date} ({isArabic ? 'الأحدث' : 'Latest'})</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
                      <div className="p-3 rounded-xl bg-white dark:bg-[#1a2217] border border-stone-200 dark:border-stone-800">
                        <span className="text-[10px] text-stone-400 block">{isArabic ? 'تغير الوزن' : 'Weight Change'}</span>
                        <div className="flex items-center justify-center gap-1 mt-1">
                          {Number(deltaWeight) < 0 ? (
                            <TrendingDown className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <TrendingUp className="w-4 h-4 text-amber-600" />
                          )}
                          <span className="font-extrabold text-sm">
                            {Number(deltaWeight) > 0 ? `+${deltaWeight}` : deltaWeight} kg
                          </span>
                        </div>
                      </div>

                      <div className="p-3 rounded-xl bg-white dark:bg-[#1a2217] border border-stone-200 dark:border-stone-800">
                        <span className="text-[10px] text-stone-400 block">{isArabic ? 'نسبة الدهون' : 'Body Fat %'}</span>
                        <div className="flex items-center justify-center gap-1 mt-1">
                          {deltaFatPct ? (
                            <>
                              {Number(deltaFatPct) < 0 ? (
                                <TrendingDown className="w-4 h-4 text-emerald-600" />
                              ) : (
                                <TrendingUp className="w-4 h-4 text-amber-600" />
                              )}
                              <span className="font-extrabold text-sm">
                                {Number(deltaFatPct) > 0 ? `+${deltaFatPct}` : deltaFatPct}%
                              </span>
                            </>
                          ) : (
                            <span>—</span>
                          )}
                        </div>
                      </div>

                      <div className="p-3 rounded-xl bg-white dark:bg-[#1a2217] border border-stone-200 dark:border-stone-800">
                        <span className="text-[10px] text-stone-400 block">{isArabic ? 'الكتلة العضلية' : 'Muscle Mass'}</span>
                        <div className="flex items-center justify-center gap-1 mt-1">
                          {deltaMuscle ? (
                            <>
                              {Number(deltaMuscle) > 0 ? (
                                <TrendingUp className="w-4 h-4 text-emerald-600" />
                              ) : (
                                <TrendingDown className="w-4 h-4 text-amber-600" />
                              )}
                              <span className="font-extrabold text-sm">
                                {Number(deltaMuscle) > 0 ? `+${deltaMuscle}` : deltaMuscle} kg
                              </span>
                            </>
                          ) : (
                            <span>—</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 border-t border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-[#151c13] flex justify-between items-center text-xs">
          <span className="text-[10px] text-stone-400">
            {isArabic ? 'تقارير InBody المعتمدة' : 'Verified InBody Composition Data'}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-stone-200 dark:bg-stone-800 font-bold hover:bg-stone-300"
          >
            {isArabic ? 'إغلاق' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
