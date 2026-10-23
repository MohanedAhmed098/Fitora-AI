import React, { useState } from 'react';
import {
  ProgressRecord,
  DailyLog,
  WorkoutLog,
  Language,
  UserProfile,
  InBodyReport,
} from '../types/index.ts';
import { translations } from '../data/translations.ts';
import {
  TrendingUp,
  Plus,
  Scale,
  Calendar,
  Award,
  Printer,
  Trash2,
  Camera,
  ShieldCheck,
  Info,
  CheckCircle,
  Activity,
  FileText,
  Sparkles,
  TrendingDown,
} from 'lucide-react';

interface ProgressViewProps {
  profile: UserProfile;
  progressRecords: ProgressRecord[];
  dailyLogs: Record<string, DailyLog>;
  workoutLogs: WorkoutLog[];
  inBodyReports?: InBodyReport[];
  onAddRecord: (record: ProgressRecord) => void;
  onDeleteRecord: (id: string) => void;
  onOpenInBodyModal?: () => void;
  language: Language;
}

export const ProgressView: React.FC<ProgressViewProps> = ({
  profile,
  progressRecords,
  dailyLogs,
  workoutLogs,
  inBodyReports = [],
  onAddRecord,
  onDeleteRecord,
  onOpenInBodyModal,
  language,
}) => {
  const t = translations[language];

  const [activeTab, setActiveTab] = useState<'weight' | 'inbody' | 'measurements' | 'photos' | 'reports'>('weight');
  const [timeRange, setTimeRange] = useState<'7' | '30' | 'all'>('30');

  // New weight modal state
  const [showLogModal, setShowLogModal] = useState<boolean>(false);
  const [newWeight, setNewWeight] = useState<number>(profile.weightKg || 75);
  const [newWaist, setNewWaist] = useState<number>(0);
  const [newChest, setNewChest] = useState<number>(0);
  const [newHips, setNewHips] = useState<number>(0);
  const [newArms, setNewArms] = useState<number>(0);
  const [newNotes, setNewNotes] = useState<string>('');
  const [newPhotoUrl, setNewPhotoUrl] = useState<string | null>(null);

  // Filter progress records by time range
  const sortedRecords = [...progressRecords].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const filteredRecords = sortedRecords.filter((r) => {
    if (timeRange === 'all') return true;
    const days = Number(timeRange);
    const cutoff = Date.now() - days * 86400000;
    return new Date(r.date).getTime() >= cutoff;
  });

  const handleSaveRecord = () => {
    if (!newWeight) return;

    const record: ProgressRecord = {
      id: `pr_${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      weightKg: Number(newWeight),
      waistCm: newWaist ? Number(newWaist) : undefined,
      chestCm: newChest ? Number(newChest) : undefined,
      hipsCm: newHips ? Number(newHips) : undefined,
      armsCm: newArms ? Number(newArms) : undefined,
      photoUrl: newPhotoUrl || undefined,
      notes: newNotes || undefined,
    };

    onAddRecord(record);
    setShowLogModal(false);
    setNewNotes('');
    setNewPhotoUrl(null);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setNewPhotoUrl(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Monthly stats calculations
  const totalDaysLogged = Object.keys(dailyLogs).length;
  const allLoggedMeals = Object.values(dailyLogs).flatMap((d) => d.meals);
  const totalCaloriesAll = allLoggedMeals.reduce((s, m) => s + (m.calories || 0), 0);
  const avgCalories = totalDaysLogged > 0 ? Math.round(totalCaloriesAll / totalDaysLogged) : 0;
  const totalWorkouts = workoutLogs.length;
  const totalDurationMin = workoutLogs.reduce((s, w) => s + (w.durationMinutes || 0), 0);
  const totalVolumeLifted = workoutLogs.reduce((s, w) => s + (w.totalVolumeKg || 0), 0);

  // SVG Chart points calculation
  const chartHeight = 160;
  const chartWidth = 360;
  const weights = filteredRecords.map((r) => r.weightKg);
  const minW = weights.length > 0 ? Math.min(...weights) - 1 : 60;
  const maxW = weights.length > 0 ? Math.max(...weights) + 1 : 90;
  const weightRange = maxW - minW || 1;

  const points = filteredRecords.map((r, i) => {
    const x = (i / Math.max(1, filteredRecords.length - 1)) * (chartWidth - 40) + 20;
    const y = chartHeight - ((r.weightKg - minW) / weightRange) * (chartHeight - 40) - 20;
    return `${x},${y}`;
  });

  return (
    <div className="space-y-6 pb-24 max-w-4xl mx-auto px-4 pt-4">
      {/* Tab Navigation */}
      <div className="bg-white dark:bg-[#1a2217] rounded-2xl p-1.5 border border-stone-200 dark:border-stone-800 shadow-xs flex items-center justify-between text-xs overflow-x-auto gap-1">
        <button
          onClick={() => setActiveTab('weight')}
          className={`flex-1 min-w-[70px] py-2 px-2 rounded-xl font-bold transition-all text-center ${
            activeTab === 'weight'
              ? 'bg-[#4D6A34] text-white shadow-xs'
              : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
          }`}
        >
          {t.progress.weightTab}
        </button>

        <button
          onClick={() => setActiveTab('inbody')}
          className={`flex-1 min-w-[75px] py-2 px-2 rounded-xl font-bold transition-all flex items-center justify-center gap-1 ${
            activeTab === 'inbody'
              ? 'bg-[#4D6A34] text-white shadow-xs'
              : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>InBody</span>
        </button>

        <button
          onClick={() => setActiveTab('measurements')}
          className={`flex-1 min-w-[70px] py-2 px-2 rounded-xl font-bold transition-all text-center ${
            activeTab === 'measurements'
              ? 'bg-[#4D6A34] text-white shadow-xs'
              : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
          }`}
        >
          {t.progress.measurementsTab}
        </button>

        <button
          onClick={() => setActiveTab('photos')}
          className={`flex-1 min-w-[65px] py-2 px-2 rounded-xl font-bold transition-all text-center ${
            activeTab === 'photos'
              ? 'bg-[#4D6A34] text-white shadow-xs'
              : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
          }`}
        >
          {t.progress.photosTab}
        </button>

        <button
          onClick={() => setActiveTab('reports')}
          className={`flex-1 min-w-[65px] py-2 px-2 rounded-xl font-bold transition-all text-center ${
            activeTab === 'reports'
              ? 'bg-[#4D6A34] text-white shadow-xs'
              : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
          }`}
        >
          {t.progress.reportsTab}
        </button>
      </div>

      {/* TAB: InBody Body Composition */}
      {activeTab === 'inbody' && (
        <div className="space-y-4">
          {/* Header Action Card */}
          <div className="bg-gradient-to-tr from-[#3B5323] to-[#5C7F40] rounded-2xl p-5 text-white shadow-md relative overflow-hidden">
            <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2 py-0.5 rounded-full bg-white/20 text-[10px] font-bold uppercase tracking-wider">
                    {language === 'ar' ? 'تحليل التكوين الجسماني' : 'Body Composition'}
                  </span>
                  <span className="text-emerald-200 text-xs font-semibold">
                    {inBodyReports.length} {language === 'ar' ? 'تقارير مسجلة' : 'scans logged'}
                  </span>
                </div>
                <h3 className="text-xl font-black">
                  {language === 'ar' ? 'سجل تقارير InBody والدهون والعضلات' : 'InBody Reports & Composition'}
                </h3>
                <p className="text-xs text-white/80 mt-1 max-w-md">
                  {language === 'ar'
                    ? 'تابع نسبة الدهون، الكتلة العضلية، ومياه الجسم مع إمكانية مسح تقرير InBody بالذكاء الاصطناعي أو الإدخال اليدوي.'
                    : 'Track body fat %, skeletal muscle mass, and water balance. Scan InBody sheets via AI OCR or enter manually.'}
                </p>
              </div>

              {onOpenInBodyModal && (
                <button
                  onClick={onOpenInBodyModal}
                  className="px-4 py-2.5 rounded-xl bg-white text-[#3B5323] hover:bg-stone-100 font-extrabold text-xs shadow-sm flex items-center justify-center gap-2 self-start sm:self-auto shrink-0 transition-transform active:scale-95"
                >
                  <Sparkles className="w-4 h-4 text-[#4D6A34]" />
                  <span>{language === 'ar' ? 'فتح الماسح والتقارير' : 'Open InBody Scanner'}</span>
                </button>
              )}
            </div>
          </div>

          {/* Latest Scan Overview */}
          {inBodyReports.length > 0 ? (
            (() => {
              const sorted = [...inBodyReports].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
              const latest = sorted[0];
              const prev = sorted[1];
              const weightDiff = prev ? (latest.weightKg - prev.weightKg).toFixed(1) : null;
              const fatPctDiff = prev && latest.bodyFatPercentage != null && prev.bodyFatPercentage != null
                ? (latest.bodyFatPercentage - prev.bodyFatPercentage).toFixed(1)
                : null;
              const muscleDiff = prev && latest.skeletalMuscleMassKg != null && prev.skeletalMuscleMassKg != null
                ? (latest.skeletalMuscleMassKg - prev.skeletalMuscleMassKg).toFixed(1)
                : null;

              return (
                <div className="bg-white dark:bg-[#1a2217] rounded-2xl p-5 border border-stone-200 dark:border-stone-800 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-3">
                    <div>
                      <span className="text-[10px] font-bold text-[#4D6A34] uppercase tracking-wider block">
                        {language === 'ar' ? 'أحدث فحص مسجل' : 'Latest Scan'}
                      </span>
                      <span className="text-xs text-stone-500 font-semibold">{latest.date}</span>
                    </div>
                    {onOpenInBodyModal && (
                      <button
                        onClick={onOpenInBodyModal}
                        className="text-xs text-[#4D6A34] font-bold hover:underline flex items-center gap-1"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>{language === 'ar' ? 'عرض كافة التقارير' : 'View All Scans'}</span>
                      </button>
                    )}
                  </div>

                  {/* 4 Core InBody Metrics */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3.5 rounded-xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200 dark:border-stone-700/60">
                      <span className="text-[10px] text-stone-400 font-bold block">{language === 'ar' ? 'الوزن الكلي' : 'Total Weight'}</span>
                      <div className="text-xl font-black text-stone-900 dark:text-stone-100 mt-1">
                        {latest.weightKg} <span className="text-xs font-normal text-stone-500">kg</span>
                      </div>
                      {weightDiff && (
                        <span className={`text-[10px] font-bold mt-1 block ${Number(weightDiff) <= 0 ? 'text-emerald-600' : 'text-amber-600'}`}>
                          {Number(weightDiff) > 0 ? `+${weightDiff}` : weightDiff} kg
                        </span>
                      )}
                    </div>

                    <div className="p-3.5 rounded-xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200 dark:border-stone-700/60">
                      <span className="text-[10px] text-stone-400 font-bold block">{language === 'ar' ? 'نسبة الدهون' : 'Body Fat %'}</span>
                      <div className="text-xl font-black text-amber-600 dark:text-amber-400 mt-1">
                        {latest.bodyFatPercentage != null ? `${latest.bodyFatPercentage}%` : '—'}
                      </div>
                      {fatPctDiff && (
                        <span className={`text-[10px] font-bold mt-1 block ${Number(fatPctDiff) <= 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
                          {Number(fatPctDiff) > 0 ? `+${fatPctDiff}` : fatPctDiff}%
                        </span>
                      )}
                    </div>

                    <div className="p-3.5 rounded-xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200 dark:border-stone-700/60">
                      <span className="text-[10px] text-stone-400 font-bold block">{language === 'ar' ? 'الكتلة العضلية (SMM)' : 'Muscle Mass'}</span>
                      <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                        {latest.skeletalMuscleMassKg != null ? `${latest.skeletalMuscleMassKg} kg` : '—'}
                      </div>
                      {muscleDiff && (
                        <span className={`text-[10px] font-bold mt-1 block ${Number(muscleDiff) >= 0 ? 'text-emerald-600' : 'text-amber-600'}`}>
                          {Number(muscleDiff) > 0 ? `+${muscleDiff}` : muscleDiff} kg
                        </span>
                      )}
                    </div>

                    <div className="p-3.5 rounded-xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200 dark:border-stone-700/60">
                      <span className="text-[10px] text-stone-400 font-bold block">{language === 'ar' ? 'مياه الجسم' : 'Body Water'}</span>
                      <div className="text-xl font-black text-sky-600 dark:text-sky-400 mt-1">
                        {latest.totalBodyWaterL != null ? `${latest.totalBodyWaterL} L` : '—'}
                      </div>
                      <span className="text-[10px] text-stone-400 mt-1 block">
                        {latest.visceralFatLevel != null ? `${language === 'ar' ? 'دهون حشوية:' : 'Visceral:'} ${latest.visceralFatLevel}` : ''}
                      </span>
                    </div>
                  </div>

                  {latest.notes && (
                    <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-800/40 text-xs text-stone-600 dark:text-stone-300">
                      <span className="font-bold text-stone-400 block text-[10px] uppercase">{language === 'ar' ? 'ملاحظات الفحص' : 'Scan Notes'}</span>
                      {latest.notes}
                    </div>
                  )}
                </div>
              );
            })()
          ) : (
            <div className="bg-white dark:bg-[#1a2217] rounded-2xl p-8 border border-stone-200 dark:border-stone-800 text-center space-y-3">
              <Activity className="w-10 h-10 text-stone-300 dark:text-stone-600 mx-auto" />
              <h4 className="text-sm font-bold text-stone-700 dark:text-stone-300">
                {language === 'ar' ? 'لم تقم بتسجيل أي تقرير InBody بعد' : 'No InBody Scans Recorded Yet'}
              </h4>
              <p className="text-xs text-stone-400 max-w-sm mx-auto">
                {language === 'ar'
                  ? 'التقط صورة لورقة فحص InBody الخاصة بك في الجيم، أو أدخل القيم يدوياً لمتابعة نسبة الدهون والعضلات.'
                  : 'Snap a photo of your gym InBody printout or enter your measurements manually to track recomposition.'}
              </p>
              {onOpenInBodyModal && (
                <button
                  onClick={onOpenInBodyModal}
                  className="px-4 py-2 rounded-xl bg-[#4D6A34] text-white text-xs font-bold hover:bg-[#3B5323] transition-colors"
                >
                  + {language === 'ar' ? 'إضافة تقرير InBody الآن' : 'Add First InBody Scan'}
                </button>
              )}
            </div>
          )}

          {/* Medical Disclaimer */}
          <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-[11px] text-amber-900 dark:text-amber-200 flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p>
              {language === 'ar'
                ? 'إخلاء مسؤولية طبي وتقني: كاميرا الهاتف لا تقيس تكوين الجسم بشكل مباشر؛ ماسح Fitora AI يستخدم تقنية التعرف الضوئي (OCR) لقراءة واستخراج البيانات من أوراق تقارير InBody والأجهزة المعتمدة. استشر طبيباً قبل البدء بأي حمية قاسية.'
                : 'Medical & Technical Notice: Smartphone cameras do not directly scan bodily tissues; Fitora AI uses OCR to read and digitize certified InBody / bioimpedance paper printouts. Always review extracted values before saving.'}
            </p>
          </div>
        </div>
      )}

      {/* TAB 1: Weight Trend */}
      {activeTab === 'weight' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-[#1a2217] rounded-2xl p-5 border border-stone-200 dark:border-stone-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                  {language === 'ar' ? 'الوزن الحالي' : 'Current Weight'}
                </span>
                <div className="text-2xl font-black text-stone-900 dark:text-stone-100 mt-0.5">
                  {filteredRecords[filteredRecords.length - 1]?.weightKg || profile.weightKg} {t.common.kg}
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-xs">
                {(['7', '30', 'all'] as const).map((r) => (
                  <button
                    key={r}
                    onClick={() => setTimeRange(r)}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-colors ${
                      timeRange === r
                        ? 'bg-[#4D6A34] text-white'
                        : 'bg-stone-100 dark:bg-stone-800 text-stone-500 hover:text-stone-800'
                    }`}
                  >
                    {r === '7' ? t.progress.sevenDays : r === '30' ? t.progress.thirtyDays : t.progress.allTime}
                  </button>
                ))}
              </div>
            </div>

            {/* SVG Weight Chart */}
            {filteredRecords.length > 1 ? (
              <div className="p-3 bg-stone-50 dark:bg-stone-800/40 rounded-xl border border-stone-200 dark:border-stone-700/60 overflow-hidden">
                <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-44 overflow-visible">
                  {/* Subtle Grid Lines */}
                  <line x1="0" y1="40" x2={chartWidth} y2="40" stroke="currentColor" strokeOpacity="0.08" />
                  <line x1="0" y1="80" x2={chartWidth} y2="80" stroke="currentColor" strokeOpacity="0.08" />
                  <line x1="0" y1="120" x2={chartWidth} y2="120" stroke="currentColor" strokeOpacity="0.08" />

                  {/* Trend Line */}
                  <polyline
                    fill="none"
                    stroke="#4D6A34"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={points.join(' ')}
                  />

                  {/* Nodes */}
                  {points.map((pt, idx) => {
                    const [px, py] = pt.split(',');
                    return (
                      <g key={idx}>
                        <circle cx={px} cy={py} r="5" fill="#4D6A34" />
                        <circle cx={px} cy={py} r="2.5" fill="#FFFFFF" />
                        <text
                          x={px}
                          y={Number(py) - 10}
                          textAnchor="middle"
                          fontSize="9"
                          fill="currentColor"
                          className="font-bold fill-stone-600 dark:fill-stone-300"
                        >
                          {filteredRecords[idx].weightKg}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>
            ) : (
              <p className="text-center py-6 text-xs text-stone-400 italic">
                {t.common.insufficientData}
              </p>
            )}

            <button
              onClick={() => setShowLogModal(true)}
              className="w-full py-2.5 rounded-xl bg-[#4D6A34] hover:bg-[#3B5323] text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-transform active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>{t.progress.logWeight}</span>
            </button>
          </div>

          {/* Historical Logged Records */}
          <div className="bg-white dark:bg-[#1a2217] rounded-2xl p-4 border border-stone-200 dark:border-stone-800 shadow-xs space-y-2">
            <h4 className="text-xs font-bold text-stone-900 dark:text-stone-100 mb-2">
              {language === 'ar' ? 'سجل الأوزان السابقة' : 'Logged Weight History'}
            </h4>
            <div className="divide-y divide-stone-100 dark:divide-stone-800 text-xs">
              {sortedRecords.map((r) => (
                <div key={r.id} className="py-2.5 flex items-center justify-between">
                  <div>
                    <span className="font-extrabold text-stone-900 dark:text-stone-100">
                      {r.weightKg} {t.common.kg}
                    </span>
                    <span className="text-[11px] text-stone-400 ms-2">{r.date}</span>
                    {r.notes && <p className="text-[10px] text-stone-400 mt-0.5">{r.notes}</p>}
                  </div>
                  <button
                    onClick={() => onDeleteRecord(r.id)}
                    className="text-stone-300 hover:text-rose-500 p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Circumferences */}
      {activeTab === 'measurements' && (
        <div className="bg-white dark:bg-[#1a2217] rounded-2xl p-5 border border-stone-200 dark:border-stone-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold">{t.progress.measurementsTab}</h4>
            <button
              onClick={() => setShowLogModal(true)}
              className="px-3 py-1.5 rounded-lg bg-[#4D6A34] text-white text-xs font-bold"
            >
              + {language === 'ar' ? 'تسجيل قياس' : 'Add Measurement'}
            </button>
          </div>

          <div className="space-y-3">
            {sortedRecords.filter((r) => r.waistCm || r.chestCm).length === 0 ? (
              <p className="text-center py-6 text-xs text-stone-400 italic">
                {t.common.insufficientData}
              </p>
            ) : (
              sortedRecords
                .filter((r) => r.waistCm || r.chestCm)
                .map((r) => (
                  <div
                    key={r.id}
                    className="p-3.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800/40 text-xs space-y-1.5"
                  >
                    <div className="flex justify-between font-bold text-stone-900 dark:text-stone-100">
                      <span>{r.date}</span>
                      <span>{r.weightKg} kg</span>
                    </div>
                    <div className="grid grid-cols-4 gap-2 text-center text-[11px] pt-1">
                      {r.waistCm && (
                        <div className="p-1.5 rounded bg-white dark:bg-stone-800">
                          <span className="text-[9px] text-stone-400 block">{t.progress.waist}</span>
                          <span className="font-extrabold">{r.waistCm} cm</span>
                        </div>
                      )}
                      {r.chestCm && (
                        <div className="p-1.5 rounded bg-white dark:bg-stone-800">
                          <span className="text-[9px] text-stone-400 block">{t.progress.chest}</span>
                          <span className="font-extrabold">{r.chestCm} cm</span>
                        </div>
                      )}
                      {r.hipsCm && (
                        <div className="p-1.5 rounded bg-white dark:bg-stone-800">
                          <span className="text-[9px] text-stone-400 block">{t.progress.hips}</span>
                          <span className="font-extrabold">{r.hipsCm} cm</span>
                        </div>
                      )}
                      {r.armsCm && (
                        <div className="p-1.5 rounded bg-white dark:bg-stone-800">
                          <span className="text-[9px] text-stone-400 block">{t.progress.arms}</span>
                          <span className="font-extrabold">{r.armsCm} cm</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>
      )}

      {/* TAB 3: Photos */}
      {activeTab === 'photos' && (
        <div className="bg-white dark:bg-[#1a2217] rounded-2xl p-5 border border-stone-200 dark:border-stone-800 shadow-xs space-y-4">
          <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-[11px] text-amber-900 dark:text-amber-200 flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 flex-shrink-0 text-amber-600 mt-0.5" />
            <span>{t.progress.photoDisclaimer}</span>
          </div>

          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-stone-800 dark:text-stone-200">
              {language === 'ar' ? 'معرض الصور الخاص بك' : 'Your Private Photo Gallery'}
            </h4>
            <button
              onClick={() => setShowLogModal(true)}
              className="px-3 py-1.5 rounded-lg bg-[#4D6A34] text-white text-xs font-bold flex items-center gap-1.5"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>{t.progress.uploadPhoto}</span>
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {sortedRecords.filter((r) => r.photoUrl).length === 0 ? (
              <p className="col-span-full text-center py-8 text-xs text-stone-400 italic">
                {language === 'ar' ? 'لا توجد صور مسجلة بعد.' : 'No progress photos uploaded yet.'}
              </p>
            ) : (
              sortedRecords
                .filter((r) => r.photoUrl)
                .map((r) => (
                  <div
                    key={r.id}
                    className="rounded-xl overflow-hidden border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 relative group"
                  >
                    <img src={r.photoUrl} alt="Progress" className="w-full aspect-square object-cover" />
                    <div className="p-2 bg-white/90 dark:bg-stone-900/90 text-xs flex justify-between items-center">
                      <span className="font-bold text-[10px]">{r.date}</span>
                      <span className="text-[10px] font-extrabold text-[#4D6A34]">{r.weightKg} kg</span>
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>
      )}

      {/* TAB 4: Monthly Reports & Achievements */}
      {activeTab === 'reports' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-[#1a2217] rounded-2xl p-5 border border-stone-200 dark:border-stone-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-[#4D6A34] uppercase tracking-wider">
                  {language === 'ar' ? 'التقرير الشهري الملخص' : 'Monthly Performance Report'}
                </span>
                <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
                  {new Date().toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', {
                    month: 'long',
                    year: 'numeric',
                  })}
                </h3>
              </div>
              <button
                onClick={() => window.print()}
                className="px-3 py-1.5 rounded-xl border border-stone-300 dark:border-stone-700 text-xs font-bold flex items-center gap-1.5 hover:bg-stone-50 dark:hover:bg-stone-800"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>{t.progress.exportReport}</span>
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-xs">
              <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-800/40">
                <span className="text-[10px] text-stone-400 block">Days Logged</span>
                <span className="text-xl font-black text-stone-900 dark:text-stone-100">{totalDaysLogged}</span>
              </div>
              <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-800/40">
                <span className="text-[10px] text-stone-400 block">Avg Calories</span>
                <span className="text-xl font-black text-stone-900 dark:text-stone-100">{avgCalories} kcal</span>
              </div>
              <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-800/40">
                <span className="text-[10px] text-stone-400 block">Workouts Done</span>
                <span className="text-xl font-black text-stone-900 dark:text-stone-100">{totalWorkouts}</span>
              </div>
              <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-800/40">
                <span className="text-[10px] text-stone-400 block">Volume Lifted</span>
                <span className="text-xl font-black text-stone-900 dark:text-stone-100">{totalVolumeLifted} kg</span>
              </div>
            </div>
          </div>

          {/* Achievement Badges */}
          <div className="bg-white dark:bg-[#1a2217] rounded-2xl p-5 border border-stone-200 dark:border-stone-800 shadow-xs space-y-3">
            <h4 className="text-xs font-bold flex items-center gap-1.5 text-stone-800 dark:text-stone-200">
              <Award className="w-4 h-4 text-amber-500" />
              <span>{t.progress.achievements}</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
              <div className="p-3 rounded-xl bg-gradient-to-tr from-amber-50 to-amber-100/40 dark:from-amber-950/40 dark:to-stone-800 border border-amber-200 dark:border-amber-800 flex items-center gap-2.5">
                <span className="text-2xl">🔥</span>
                <div>
                  <h5 className="font-bold text-amber-900 dark:text-amber-200">
                    {language === 'ar' ? 'التزام البداية' : 'Consistency Starter'}
                  </h5>
                  <p className="text-[10px] text-stone-500">
                    {language === 'ar' ? 'سجلت وجباتك بنجاح' : 'Logged meals consistently'}
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-gradient-to-tr from-sky-50 to-sky-100/40 dark:from-sky-950/40 dark:to-stone-800 border border-sky-200 dark:border-sky-800 flex items-center gap-2.5">
                <span className="text-2xl">💧</span>
                <div>
                  <h5 className="font-bold text-sky-900 dark:text-sky-200">
                    {language === 'ar' ? 'بطل الترطيب' : 'Hydration Champion'}
                  </h5>
                  <p className="text-[10px] text-stone-500">
                    {language === 'ar' ? 'حققت هدف شرب الماء' : 'Hit daily water intake targets'}
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-gradient-to-tr from-emerald-50 to-emerald-100/40 dark:from-emerald-950/40 dark:to-stone-800 border border-emerald-200 dark:border-emerald-800 flex items-center gap-2.5">
                <span className="text-2xl">🏋️</span>
                <div>
                  <h5 className="font-bold text-emerald-900 dark:text-emerald-200">
                    {language === 'ar' ? 'قوة الحديد' : 'Iron Will'}
                  </h5>
                  <p className="text-[10px] text-stone-500">
                    {language === 'ar' ? 'جلسة تمرين مباشر مكتملة' : 'Completed live workout session'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Log Today's Weight Modal */}
      {showLogModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white dark:bg-[#1a2217] w-full max-w-md rounded-2xl shadow-2xl border border-stone-200 dark:border-stone-800 p-5 my-auto text-stone-900 dark:text-stone-100 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 pb-3">
              <h3 className="font-bold text-sm">{t.progress.logWeight}</h3>
              <button onClick={() => setShowLogModal(false)} className="text-stone-400 font-bold">
                ✕
              </button>
            </div>

            <div>
              <label className="text-xs font-semibold block mb-1">
                {t.onboarding.currentWeight} ({t.common.kg})
              </label>
              <input
                type="number"
                step="0.1"
                value={newWeight}
                onChange={(e) => setNewWeight(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-sm font-bold"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-[10px] text-stone-400 block mb-0.5">{t.progress.waist}</label>
                <input
                  type="number"
                  value={newWaist || ''}
                  onChange={(e) => setNewWaist(Number(e.target.value))}
                  placeholder="cm"
                  className="w-full px-2.5 py-1.5 rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-xs"
                />
              </div>
              <div>
                <label className="text-[10px] text-stone-400 block mb-0.5">{t.progress.chest}</label>
                <input
                  type="number"
                  value={newChest || ''}
                  onChange={(e) => setNewChest(Number(e.target.value))}
                  placeholder="cm"
                  className="w-full px-2.5 py-1.5 rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-xs"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold block mb-1">{t.progress.notes}</label>
              <input
                type="text"
                value={newNotes}
                onChange={(e) => setNewNotes(e.target.value)}
                placeholder={language === 'ar' ? 'مثل: طاقة ممتازة، شرب ماء كافي...' : 'Feeling energized, well hydrated...'}
                className="w-full px-3 py-1.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-xs"
              />
            </div>

            <div>
              <label className="text-xs font-semibold block mb-1">{t.progress.uploadPhoto}</label>
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="text-xs text-stone-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowLogModal(false)}
                className="px-3 py-1.5 rounded-lg border text-xs"
              >
                {t.common.cancel}
              </button>
              <button
                type="button"
                onClick={handleSaveRecord}
                className="px-5 py-2 rounded-xl bg-[#4D6A34] text-white font-bold text-xs shadow-xs"
              >
                {t.common.save}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
