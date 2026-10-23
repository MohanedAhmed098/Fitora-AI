import React, { useState, useEffect, useRef } from 'react';
import {
  WorkoutProgram,
  Exercise,
  WorkoutLog,
  LiveWorkoutState,
  PersonalRecord,
  Language,
  UserProfile,
  TrainingEnvironment,
} from '../types/index.ts';
import { translations } from '../data/translations.ts';
import { WORKOUT_PROGRAMS } from '../data/workoutPrograms.ts';
import { EXERCISE_DATABASE } from '../data/exerciseDatabase.ts';
import { estimateWorkoutCalories } from '../utils/nutritionCalculations.ts';
import { ExerciseDemonstrationModal } from './ExerciseDemonstrationModal.tsx';
import {
  Dumbbell,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  Check,
  Circle,
  Timer,
  ChevronRight,
  ChevronDown,
  Search,
  Filter,
  Flame,
  Clock,
  History,
  AlertTriangle,
  Info,
  ShieldAlert,
  Trophy,
  Calendar,
  CalendarDays,
  Plus,
  Trash2,
  Edit2,
  Copy,
  Sparkles,
  BedDouble,
  Layers,
  ChevronLeft,
  X,
} from 'lucide-react';

interface WorkoutsViewProps {
  profile: UserProfile;
  workoutLogs: WorkoutLog[];
  personalRecords: PersonalRecord[];
  customRoutines: WorkoutProgram[];
  liveWorkout: LiveWorkoutState | null;
  onUpdateLiveWorkout: (state: LiveWorkoutState | null) => void;
  onSaveWorkoutLog: (log: WorkoutLog) => void;
  onSavePersonalRecord: (pr: PersonalRecord) => void;
  onDeletePersonalRecord: (id: string) => void;
  onUpdateProfile: (profile: UserProfile) => void;
  onSaveCustomRoutine: (routine: WorkoutProgram) => void;
  onDeleteCustomRoutine: (id: string) => void;
  language: Language;
}

export const WorkoutsView: React.FC<WorkoutsViewProps> = ({
  profile,
  workoutLogs,
  personalRecords,
  customRoutines,
  liveWorkout,
  onUpdateLiveWorkout,
  onSaveWorkoutLog,
  onSavePersonalRecord,
  onDeletePersonalRecord,
  onUpdateProfile,
  onSaveCustomRoutine,
  onDeleteCustomRoutine,
  language,
}) => {
  const t = translations[language];
  const isArabic = language === 'ar';

  // Primary active tab defaults to 'today' as required!
  const [activeTab, setActiveTab] = useState<'today' | 'programs' | 'library' | 'prs' | 'live' | 'history'>('today');

  // Modal states
  const [demonstrationExercise, setDemonstrationExercise] = useState<Exercise | null>(null);
  const [showScheduleModal, setShowScheduleModal] = useState<boolean>(false);
  const [showPrModal, setShowPrModal] = useState<boolean>(false);
  const [showRoutineBuilder, setShowRoutineBuilder] = useState<boolean>(false);
  const [showUpcomingSchedule, setShowUpcomingSchedule] = useState<boolean>(false);

  // Selected date for reviewing past days
  const [selectedReviewDate, setSelectedReviewDate] = useState<string>(new Date().toISOString().split('T')[0]);

  // PR Form State
  const [editingPrId, setEditingPrId] = useState<string | null>(null);
  const [prExerciseId, setPrExerciseId] = useState<string>('ex_bench_press');
  const [prWeight, setPrWeight] = useState<string>('80');
  const [prReps, setPrReps] = useState<string>('6');
  const [prDate, setPrDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [prNotes, setPrNotes] = useState<string>('');

  // Routine Builder State
  const [routineNameEn, setRoutineNameEn] = useState<string>('');
  const [routineNameAr, setRoutineNameAr] = useState<string>('');
  const [routineSplitType, setRoutineSplitType] = useState<'ppl' | 'upper_lower' | 'full_body' | 'custom'>('custom');
  const [selectedRoutineExercises, setSelectedRoutineExercises] = useState<string[]>([]);

  // Library filter & smart search state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [muscleFilter, setMuscleFilter] = useState<string>('all');
  const [equipmentFilter, setEquipmentFilter] = useState<string>('all');
  const [environmentFilter, setEnvironmentFilter] = useState<string>('all');

  // Combined programs (built-in + user custom)
  const allPrograms = [...WORKOUT_PROGRAMS, ...customRoutines];

  // Rest timer sound helper
  const playTimerBeep = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.4);
    } catch {
      // AudioContext unavailable
    }
  };

  // Live Workout tick interval
  useEffect(() => {
    let interval: any = null;

    if (liveWorkout?.isActive && !liveWorkout.isPaused) {
      interval = setInterval(() => {
        onUpdateLiveWorkout({
          ...liveWorkout,
          elapsedSeconds: liveWorkout.elapsedSeconds + 1,
          restTimerSeconds:
            liveWorkout.restTimerRunning && liveWorkout.restTimerSeconds > 0
              ? liveWorkout.restTimerSeconds - 1
              : liveWorkout.restTimerSeconds,
          restTimerRunning:
            liveWorkout.restTimerRunning && liveWorkout.restTimerSeconds <= 1
              ? (playTimerBeep(), false)
              : liveWorkout.restTimerRunning,
        });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [liveWorkout]);

  // Determine Today's local day index (0 = Sun, 1 = Mon ... 6 = Sat)
  const today = new Date();
  const currentDayIndex = today.getDay();
  const todayFormattedDate = today.toLocaleDateString(isArabic ? 'ar-EG' : 'en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Get scheduled program day for today
  const scheduleMap = profile.weeklySchedule || {
    '0': 'ppl_push',
    '1': 'ppl_pull',
    '2': null,
    '3': 'ppl_legs',
    '4': 'upper_lower_upper',
    '5': null,
    '6': null,
  };

  const todayScheduledKey = scheduleMap[String(currentDayIndex)];

  // Resolve today's scheduled workout
  const getTodayWorkout = () => {
    if (!todayScheduledKey) return null;

    // Search programs
    for (const p of allPrograms) {
      for (let dIdx = 0; dIdx < p.days.length; dIdx++) {
        const day = p.days[dIdx];
        if (day.id === todayScheduledKey || `${p.id}_day${dIdx}` === todayScheduledKey || p.id === todayScheduledKey) {
          const exercises = day.exerciseIds
            .map((id) => EXERCISE_DATABASE.find((e) => e.id === id))
            .filter(Boolean) as Exercise[];
          return { program: p, day, dayIndex: dIdx, exercises };
        }
      }
    }

    // Fallback: match by PPL split convention
    const defaultProgram = WORKOUT_PROGRAMS[0];
    const day = defaultProgram.days[0];
    const exercises = day.exerciseIds
      .map((id) => EXERCISE_DATABASE.find((e) => e.id === id))
      .filter(Boolean) as Exercise[];
    return { program: defaultProgram, day, dayIndex: 0, exercises };
  };

  const todayWorkout = getTodayWorkout();

  // Check if today's workout has already been logged in history
  const todayDateStr = new Date().toISOString().split('T')[0];
  const isTodayAlreadyLogged = workoutLogs.some((l) => l.date === todayDateStr);

  // Start Live Workout
  const handleStartWorkout = (program: WorkoutProgram, dayIndex: number) => {
    const day = program.days[dayIndex];
    const exercisesForDay = day.exerciseIds
      .map((id) => EXERCISE_DATABASE.find((e) => e.id === id))
      .filter(Boolean) as Exercise[];

    const liveExercises = exercisesForDay.map((ex) => ({
      exerciseId: ex.id,
      nameEn: ex.nameEn,
      nameAr: ex.nameAr,
      targetMuscle: ex.primaryMuscleEn || ex.muscleGroup,
      sets: Array.from({ length: ex.suggestedSets || 3 }).map((_, i) => ({
        setNumber: i + 1,
        reps: Number(ex.suggestedReps?.match(/\d+/)?.[0]) || 10,
        weightKg: 20,
        completed: false,
      })),
    }));

    const newState: LiveWorkoutState = {
      isActive: true,
      isPaused: false,
      programId: program.id,
      dayIndex,
      workoutName: isArabic ? day.dayNameAr : day.dayNameEn,
      startTime: Date.now(),
      elapsedSeconds: 0,
      currentExerciseIndex: 0,
      exercises: liveExercises,
      restTimerSeconds: 60,
      restTimerTotal: 60,
      restTimerRunning: false,
    };

    onUpdateLiveWorkout(newState);
    setActiveTab('live');
  };

  // Toggle Live Set completion and check for new Personal Record
  const handleToggleSet = (exIndex: number, setIndex: number) => {
    if (!liveWorkout) return;
    const updatedExercises = [...liveWorkout.exercises];
    const targetSet = updatedExercises[exIndex].sets[setIndex];
    const newCompleted = !targetSet.completed;
    targetSet.completed = newCompleted;

    // Check if this set is a personal record
    if (newCompleted && targetSet.weightKg > 0) {
      const existingPr = personalRecords.find((p) => p.exerciseId === updatedExercises[exIndex].exerciseId);
      if (!existingPr || targetSet.weightKg > existingPr.weightKg) {
        targetSet.isPr = true;
      }
    }

    onUpdateLiveWorkout({
      ...liveWorkout,
      exercises: updatedExercises,
      restTimerSeconds: newCompleted ? liveWorkout.restTimerTotal : liveWorkout.restTimerSeconds,
      restTimerRunning: newCompleted,
    });
  };

  // Update Set Weight / Reps (free manual entry)
  const handleUpdateSetNumber = (
    exIndex: number,
    setIndex: number,
    field: 'weightKg' | 'reps',
    val: number
  ) => {
    if (!liveWorkout) return;
    const updatedExercises = [...liveWorkout.exercises];
    updatedExercises[exIndex].sets[setIndex][field] = val;
    onUpdateLiveWorkout({
      ...liveWorkout,
      exercises: updatedExercises,
    });
  };

  // Finish Live Workout
  const handleFinishWorkout = () => {
    if (!liveWorkout) return;

    let setsCount = 0;
    let totalVolume = 0;
    const summary: any[] = [];

    liveWorkout.exercises.forEach((ex) => {
      const completedSets = ex.sets.filter((s) => s.completed);
      setsCount += completedSets.length;
      let bestWeight = 0;
      let bestReps = 0;

      completedSets.forEach((s) => {
        totalVolume += s.weightKg * s.reps;
        if (s.weightKg > bestWeight) {
          bestWeight = s.weightKg;
          bestReps = s.reps;
        }

        // Auto-save any detected new Personal Records!
        if (s.isPr) {
          const estimated1Rm = Math.round(s.weightKg * (1 + s.reps / 30));
          const newPr: PersonalRecord = {
            id: `pr_${Date.now()}_${ex.exerciseId}`,
            exerciseId: ex.exerciseId,
            exerciseNameEn: ex.nameEn,
            exerciseNameAr: ex.nameAr,
            weightKg: s.weightKg,
            reps: s.reps,
            estimated1RmKg: estimated1Rm,
            date: new Date().toISOString().split('T')[0],
            source: 'workout_log',
            notes: `${liveWorkout.workoutName} - Set #${s.setNumber}`,
          };
          onSavePersonalRecord(newPr);
        }
      });

      if (completedSets.length > 0) {
        summary.push({
          nameEn: ex.nameEn,
          nameAr: ex.nameAr,
          setsCompleted: completedSets.length,
          bestWeightKg: bestWeight,
          bestReps,
        });
      }
    });

    const durationMin = Math.max(1, Math.round(liveWorkout.elapsedSeconds / 60));
    const estimatedCals = estimateWorkoutCalories(
      durationMin,
      profile.weightKg || 75,
      'resistance'
    );

    const log: WorkoutLog = {
      id: `wl_${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      timestamp: Date.now(),
      workoutName: liveWorkout.workoutName,
      durationMinutes: durationMin,
      estimatedCaloriesBurned: estimatedCals,
      exercisesCount: liveWorkout.exercises.length,
      setsCompleted: setsCount,
      totalVolumeKg: totalVolume,
      exercisesSummary: summary,
    };

    onSaveWorkoutLog(log);
    onUpdateLiveWorkout(null);
    setActiveTab('today');
  };

  // Save manual Personal Record form
  const handleSavePrForm = (e: React.FormEvent) => {
    e.preventDefault();
    const w = parseFloat(prWeight);
    const r = parseInt(prReps, 10);
    if (!w || !r) return;

    const selectedEx = EXERCISE_DATABASE.find((e) => e.id === prExerciseId);
    const est1Rm = Math.round(w * (1 + r / 30));

    const pr: PersonalRecord = {
      id: editingPrId || `pr_${Date.now()}`,
      exerciseId: prExerciseId,
      exerciseNameEn: selectedEx?.nameEn || 'Exercise PR',
      exerciseNameAr: selectedEx?.nameAr || 'رقم قياسي للتمرين',
      weightKg: w,
      reps: r,
      estimated1RmKg: est1Rm,
      date: prDate,
      source: 'user_manual',
      notes: prNotes || undefined,
    };

    onSavePersonalRecord(pr);
    setShowPrModal(false);
    setEditingPrId(null);
    setPrNotes('');
  };

  // Smart Exercise Library Search filter
  const filteredExercises = EXERCISE_DATABASE.filter((ex) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      ex.nameEn.toLowerCase().includes(q) ||
      ex.nameAr.includes(q) ||
      (ex.primaryMuscleEn && ex.primaryMuscleEn.toLowerCase().includes(q)) ||
      (ex.primaryMuscleAr && ex.primaryMuscleAr.includes(q));

    const matchesMuscle = muscleFilter === 'all' || ex.muscleGroup === muscleFilter;
    const matchesEquipment =
      equipmentFilter === 'all' ||
      (equipmentFilter === 'dumbbell' && ex.suitableFor?.includes('dumbbell_only')) ||
      (equipmentFilter === 'barbell' && ex.suitableFor?.includes('barbell_only')) ||
      (equipmentFilter === 'bodyweight' && ex.suitableFor?.includes('bodyweight_only')) ||
      (equipmentFilter === 'bands' && ex.suitableFor?.includes('bands'));

    const matchesEnv =
      environmentFilter === 'all' ||
      (environmentFilter === 'home' && (ex.suitableFor?.includes('home_gym') || ex.suitableFor?.includes('home_no_equipment'))) ||
      (environmentFilter === 'gym' && ex.suitableFor?.includes('gym'));

    return matchesSearch && matchesMuscle && matchesEquipment && matchesEnv;
  });

  return (
    <div className="space-y-5 pb-24 max-w-4xl mx-auto px-4 pt-3">
      {/* Exercise Demonstration Modal */}
      <ExerciseDemonstrationModal
        exercise={demonstrationExercise}
        isOpen={Boolean(demonstrationExercise)}
        onClose={() => setDemonstrationExercise(null)}
        language={language}
        onSelectAlternative={(altId) => {
          const altEx = EXERCISE_DATABASE.find((e) => e.id === altId);
          if (altEx) setDemonstrationExercise(altEx);
        }}
      />

      {/* Main Top Navigation Tabs */}
      <div className="bg-white dark:bg-[#1a2217] rounded-2xl p-1.5 border border-stone-200 dark:border-stone-800 shadow-xs flex items-center justify-between text-xs overflow-x-auto gap-1">
        <button
          onClick={() => setActiveTab('today')}
          className={`px-3 py-2 rounded-xl font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'today'
              ? 'bg-[#4D6A34] text-white shadow-xs'
              : 'text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800'
          }`}
        >
          <CalendarDays className="w-4 h-4" />
          <span>{isArabic ? 'تمرين وجدول اليوم' : "Today's Workout"}</span>
        </button>

        <button
          onClick={() => setActiveTab('programs')}
          className={`px-3 py-2 rounded-xl font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'programs'
              ? 'bg-[#4D6A34] text-white shadow-xs'
              : 'text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>{isArabic ? 'البرامج والجدول' : 'Programs & Schedule'}</span>
        </button>

        <button
          onClick={() => setActiveTab('library')}
          className={`px-3 py-2 rounded-xl font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'library'
              ? 'bg-[#4D6A34] text-white shadow-xs'
              : 'text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800'
          }`}
        >
          <Dumbbell className="w-4 h-4" />
          <span>{isArabic ? 'مكتبة التمارين' : 'Exercise Library'}</span>
        </button>

        <button
          onClick={() => setActiveTab('prs')}
          className={`px-3 py-2 rounded-xl font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'prs'
              ? 'bg-[#4D6A34] text-white shadow-xs'
              : 'text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800'
          }`}
        >
          <Trophy className="w-4 h-4" />
          <span>{isArabic ? 'الأرقام القياسية (PRs)' : 'Personal Records'}</span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`px-3 py-2 rounded-xl font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'history'
              ? 'bg-[#4D6A34] text-white shadow-xs'
              : 'text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800'
          }`}
        >
          <History className="w-4 h-4" />
          <span>{isArabic ? 'سجل التمارين' : 'History'}</span>
        </button>

        {liveWorkout?.isActive && (
          <button
            onClick={() => setActiveTab('live')}
            className="px-3 py-2 rounded-xl font-bold whitespace-nowrap flex items-center gap-1.5 bg-amber-500 text-white animate-pulse"
          >
            <Play className="w-3.5 h-3.5" />
            <span>{isArabic ? 'التمرين المباشر' : 'Live Workout'}</span>
          </button>
        )}
      </div>

      {/* ======================================================== */}
      {/* 1. PRIMARY VIEW: TODAY'S SCHEDULE AND WORKOUT            */}
      {/* ======================================================== */}
      {activeTab === 'today' && (
        <div className="space-y-4">
          {/* Header Card with Local Time & Schedule Status */}
          <div className="bg-gradient-to-tr from-[#3B5323] to-[#55753a] text-white rounded-3xl p-5 shadow-sm relative overflow-hidden">
            <div className="relative z-10">
              <div className="flex items-center justify-between text-xs text-[#D4DFCD] mb-1">
                <span>{todayFormattedDate}</span>
                <span className="px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-xs font-semibold">
                  {isArabic ? `تدريب ${profile.trainingDaysPerWeek} أيام أسبوعياً` : `${profile.trainingDaysPerWeek} Days/Week`}
                </span>
              </div>

              {todayWorkout ? (
                <>
                  <h2 className="text-xl sm:text-2xl font-black mt-1">
                    {isArabic ? todayWorkout.day.dayNameAr : todayWorkout.day.dayNameEn}
                  </h2>
                  <p className="text-xs text-[#EBF2E8] mt-1 max-w-md">
                    {isArabic
                      ? `العضلات المستهدفة: ${todayWorkout.day.targetMuscleAr} • المدة التقديرية: ${todayWorkout.day.targetDurationMin} دقيقة`
                      : `Target: ${todayWorkout.day.targetMuscleEn} • Approx duration: ${todayWorkout.day.targetDurationMin} mins`}
                  </p>

                  <div className="flex flex-wrap items-center gap-2 mt-4">
                    <button
                      onClick={() => handleStartWorkout(todayWorkout.program, todayWorkout.dayIndex)}
                      className="px-4 py-2.5 rounded-xl bg-white text-[#3B5323] hover:bg-stone-100 font-extrabold text-xs shadow-xs flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all"
                    >
                      <Play className="w-4 h-4 fill-current" />
                      <span>{isArabic ? 'بدء تمرين اليوم المباشر' : 'Start Today\'s Live Workout'}</span>
                    </button>

                    <button
                      onClick={() => setShowScheduleModal(true)}
                      className="px-3.5 py-2.5 rounded-xl bg-white/20 hover:bg-white/30 text-white font-bold text-xs backdrop-blur-xs transition-colors"
                    >
                      {isArabic ? 'تعديل جدول التمارين' : 'Change Training Days'}
                    </button>
                  </div>
                </>
              ) : (
                /* Rest Day Card */
                <div className="py-2 space-y-2">
                  <div className="flex items-center gap-2 text-white">
                    <BedDouble className="w-6 h-6 text-[#D4DFCD]" />
                    <h2 className="text-xl sm:text-2xl font-black">
                      {isArabic ? 'اليوم يوم راحة مجدول 🧘' : 'Today is a Scheduled Rest Day 🧘'}
                    </h2>
                  </div>
                  <p className="text-xs text-[#EBF2E8] leading-relaxed max-w-lg">
                    {isArabic
                      ? 'الراحة والترطيب جزء أساسي من بناء العضلات والاستشفاء العصبي. احرص على تناول وجبات غنية بالبروتين وشرب الماء الكافي لتكون مستعداً لحصة الغد.'
                      : 'Rest, proper sleep, and hydration are essential for muscle repair, glycogen replenishment, and injury prevention. Hit your protein targets and recharge.'}
                  </p>

                  <div className="flex flex-wrap items-center gap-2 pt-2">
                    <button
                      onClick={() => setShowScheduleModal(true)}
                      className="px-4 py-2 rounded-xl bg-white/25 hover:bg-white/35 text-white font-bold text-xs transition-colors"
                    >
                      {isArabic ? 'تعديل أيام التدريب' : 'Edit Training Days'}
                    </button>
                    <button
                      onClick={() => handleStartWorkout(WORKOUT_PROGRAMS[0], 0)}
                      className="px-4 py-2 rounded-xl bg-white text-[#3B5323] hover:bg-stone-100 font-bold text-xs transition-colors"
                    >
                      {isArabic ? 'بدء تمرين إضافي اختياري' : 'Start Optional Session'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Today's Exercises List */}
          {todayWorkout && (
            <div className="bg-white dark:bg-[#1a2217] rounded-3xl p-5 border border-stone-200 dark:border-stone-800 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-extrabold text-sm sm:text-base">
                    {isArabic ? 'تمارين اليوم المقررة بالتفصيل' : "Today's Planned Exercises"}
                  </h3>
                  <span className="text-[11px] text-stone-400">
                    {isArabic ? `${todayWorkout.exercises.length} تمارين مبرمجة` : `${todayWorkout.exercises.length} exercises programmed`}
                  </span>
                </div>

                {isTodayAlreadyLogged && (
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{isArabic ? 'تم إكمال تمرين اليوم' : 'Completed Today'}</span>
                  </span>
                )}
              </div>

              <div className="space-y-3">
                {todayWorkout.exercises.map((ex, idx) => {
                  const existingPr = personalRecords.find((p) => p.exerciseId === ex.id);

                  return (
                    <div
                      key={ex.id}
                      className="p-3.5 rounded-2xl bg-stone-50 dark:bg-[#151c13] border border-stone-200 dark:border-stone-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-[#4D6A34]/50 transition-all"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-7 h-7 rounded-xl bg-[#EBF2E8] dark:bg-[#283620] text-[#4D6A34] dark:text-[#85A947] font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                          {idx + 1}
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-xs sm:text-sm">
                              {isArabic ? ex.nameAr : ex.nameEn}
                            </h4>
                            <span className="text-[9px] px-1.5 py-0.2 rounded font-semibold bg-stone-200 dark:bg-stone-800 text-stone-600 dark:text-stone-300">
                              {ex.exerciseType || 'Compound'}
                            </span>
                          </div>

                          <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">
                            {isArabic ? ex.primaryMuscleAr : ex.primaryMuscleEn} • {ex.suggestedSets} {isArabic ? 'مجموعات' : 'sets'} × {ex.suggestedReps}
                          </p>

                          {existingPr && (
                            <div className="flex items-center gap-1 text-[10px] text-amber-700 dark:text-amber-400 font-bold mt-1">
                              <Trophy className="w-3 h-3" />
                              <span>
                                {isArabic ? `رقمك القياسي: ${existingPr.weightKg} كجم × ${existingPr.reps} تكرار` : `Your PR: ${existingPr.weightKg} kg × ${existingPr.reps} reps`}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Demonstration & Technique Button */}
                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                        <button
                          onClick={() => setDemonstrationExercise(ex)}
                          className="px-3 py-1.5 rounded-xl bg-white dark:bg-[#1a2217] border border-stone-200 dark:border-stone-700 text-[#4D6A34] dark:text-[#85A947] hover:bg-[#EBF2E8] dark:hover:bg-[#283620] text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
                        >
                          <Play className="w-3 h-3" />
                          <span>{isArabic ? 'شاهد الحركة والتكنيك' : 'Animated Demo'}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Collapsible Upcoming Workouts / Weekly Schedule Accordion */}
          <div className="bg-white dark:bg-[#1a2217] rounded-3xl border border-stone-200 dark:border-stone-800 overflow-hidden shadow-xs">
            <button
              onClick={() => setShowUpcomingSchedule(!showUpcomingSchedule)}
              className="w-full p-4 flex items-center justify-between hover:bg-stone-50 dark:hover:bg-stone-800/40 text-xs font-bold text-stone-700 dark:text-stone-200 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#4D6A34] dark:text-[#85A947]" />
                <span>{isArabic ? 'عرض الجدول الأسبوعي والتمارين القادمة' : 'View Weekly Schedule & Upcoming Workouts'}</span>
              </div>
              <ChevronDown className={`w-4 h-4 transition-transform ${showUpcomingSchedule ? 'rotate-180' : ''}`} />
            </button>

            {showUpcomingSchedule && (
              <div className="p-4 border-t border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-[#151c13] space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                  {['الأحد / Sun', 'الإثنين / Mon', 'الثلاثاء / Tue', 'الأربعاء / Wed', 'الخميس / Thu', 'الجمعة / Fri', 'السبت / Sat'].map((dayName, dIndex) => {
                    const scheduledId = scheduleMap[String(dIndex)];
                    const isToday = dIndex === currentDayIndex;

                    return (
                      <div
                        key={dIndex}
                        className={`p-3 rounded-2xl border ${
                          isToday
                            ? 'bg-[#EBF2E8] dark:bg-[#283620]/40 border-[#4D6A34]'
                            : 'bg-white dark:bg-[#1a2217] border-stone-200 dark:border-stone-800'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-extrabold text-[11px] text-stone-800 dark:text-stone-200">
                            {dayName}
                          </span>
                          {isToday && (
                            <span className="text-[9px] px-2 py-0.5 rounded-full font-bold bg-[#4D6A34] text-white">
                              {isArabic ? 'اليوم' : 'Today'}
                            </span>
                          )}
                        </div>

                        <span className="text-[11px] font-semibold text-stone-600 dark:text-stone-400 block">
                          {scheduledId
                            ? (isArabic ? 'حصة تمرين مبرمجة' : 'Scheduled Workout')
                            : (isArabic ? 'يوم راحة واستشفاء 🧘' : 'Rest & Recovery Day 🧘')}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    onClick={() => setShowScheduleModal(true)}
                    className="px-3.5 py-2 rounded-xl bg-[#4D6A34] text-white text-xs font-bold hover:bg-[#3B5323]"
                  >
                    {isArabic ? 'تخصيص أيام التدريب والراحة' : 'Customize Days & Rest Schedule'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. TAB: PERSONAL RECORDS (PRs)                           */}
      {/* ======================================================== */}
      {activeTab === 'prs' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-[#1a2217] rounded-3xl p-5 border border-stone-200 dark:border-stone-800 shadow-xs flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-sm sm:text-base flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-500" />
                <span>{isArabic ? 'سجل الأرقام القياسية الشخصية (Personal Records)' : 'Personal Records (PRs)'}</span>
              </h3>
              <p className="text-xs text-stone-400 mt-0.5">
                {isArabic
                  ? 'أقصى أوزان مسجلة، التكرارات، وتقدير 1RM المحسوب لكل تمرين'
                  : 'Track your best lifts, highest weights, and estimated 1-Rep Max'}
              </p>
            </div>

            <button
              onClick={() => {
                setEditingPrId(null);
                setPrWeight('80');
                setPrReps('6');
                setPrDate(new Date().toISOString().split('T')[0]);
                setShowPrModal(true);
              }}
              className="px-3.5 py-2 rounded-xl bg-[#4D6A34] hover:bg-[#3B5323] text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>{isArabic ? 'تسجيل رقم جديد' : 'Log New PR'}</span>
            </button>
          </div>

          {/* PRs Grid */}
          {personalRecords.length === 0 ? (
            <div className="text-center py-10 bg-white dark:bg-[#1a2217] rounded-3xl border border-stone-200 dark:border-stone-800 space-y-2">
              <Trophy className="w-10 h-10 text-stone-300 mx-auto" />
              <p className="text-xs font-bold text-stone-500">{isArabic ? 'لا توجد أرقام قياسية مسجلة بعد' : 'No personal records logged yet'}</p>
              <p className="text-[11px] text-stone-400">{isArabic ? 'سجل أوزانك الشخصية أو قم بإنهائها في التمرين المباشر.' : 'Enter your PRs manually or complete live workout sets.'}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {personalRecords.map((pr) => (
                <div
                  key={pr.id}
                  className="p-4 rounded-2xl bg-white dark:bg-[#1a2217] border border-stone-200 dark:border-stone-800 shadow-xs space-y-2 hover:border-[#4D6A34]/50 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-extrabold text-xs sm:text-sm">
                        {isArabic ? pr.exerciseNameAr : pr.exerciseNameEn}
                      </h4>
                      <span className="text-[10px] text-stone-400 block mt-0.5">{pr.date}</span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setEditingPrId(pr.id);
                          setPrExerciseId(pr.exerciseId);
                          setPrWeight(String(pr.weightKg));
                          setPrReps(String(pr.reps));
                          setPrDate(pr.date);
                          setPrNotes(pr.notes || '');
                          setShowPrModal(true);
                        }}
                        className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200"
                        title="Edit PR"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDeletePersonalRecord(pr.id)}
                        className="p-1.5 rounded-lg text-red-400 hover:text-red-600"
                        title="Delete PR"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center text-xs pt-1">
                    <div className="p-2 rounded-xl bg-stone-50 dark:bg-stone-800/60">
                      <span className="text-[10px] text-stone-400 block">{isArabic ? 'الوزن' : 'Weight'}</span>
                      <span className="font-extrabold text-sm">{pr.weightKg} kg</span>
                    </div>

                    <div className="p-2 rounded-xl bg-stone-50 dark:bg-stone-800/60">
                      <span className="text-[10px] text-stone-400 block">{isArabic ? 'التكرارات' : 'Reps'}</span>
                      <span className="font-extrabold text-sm">{pr.reps} reps</span>
                    </div>

                    <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/40">
                      <span className="text-[10px] text-amber-600 dark:text-amber-400 block">{isArabic ? 'تقدير 1RM' : 'Est. 1RM'}</span>
                      <span className="font-extrabold text-sm text-amber-700 dark:text-amber-300">{pr.estimated1RmKg} kg</span>
                    </div>
                  </div>

                  {/* Distinction Badge */}
                  <div className="flex items-center justify-between text-[10px] pt-1 border-t border-stone-100 dark:border-stone-800">
                    <span className="px-2 py-0.5 rounded-md font-semibold bg-stone-100 dark:bg-stone-800 text-stone-500">
                      {pr.source === 'user_manual'
                        ? (isArabic ? 'إدخال يدوي بواسطة المستخدم' : 'User Manual Entry')
                        : pr.source === 'workout_log'
                        ? (isArabic ? 'محققة من التمرين المباشر' : 'From Live Workout')
                        : (isArabic ? 'اقتراح ذكي' : 'AI Recommendation')}
                    </span>
                    {pr.notes && <span className="text-stone-400 truncate max-w-[150px]">"{pr.notes}"</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. TAB: EXERCISE LIBRARY (SMART SEARCH & ALTERNATIVES)   */}
      {/* ======================================================== */}
      {activeTab === 'library' && (
        <div className="space-y-4">
          {/* Smart Search Bar */}
          <div className="bg-white dark:bg-[#1a2217] rounded-3xl p-4 border border-stone-200 dark:border-stone-800 shadow-xs space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute top-3.5 left-3 text-stone-400" />
              <input
                type="text"
                placeholder={isArabic ? 'ابحث عن تمرين (مثال: الصدر العلوي، بدائل العقلة، تمارين البيت...)' : 'Search exercises (e.g. Upper Chest, Pull-up alternatives, Home no-equipment)...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-[#151c13] text-xs focus:outline-none focus:ring-2 focus:ring-[#4D6A34]"
              />
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap gap-1.5 text-[11px]">
              <select
                value={muscleFilter}
                onChange={(e) => setMuscleFilter(e.target.value)}
                className="px-2.5 py-1.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-[#151c13] font-semibold text-stone-700 dark:text-stone-300 focus:outline-none"
              >
                <option value="all">{isArabic ? 'جميع العضلات' : 'All Muscle Groups'}</option>
                <option value="chest">{isArabic ? 'الصدر' : 'Chest'}</option>
                <option value="back">{isArabic ? 'الظهر والمجنص' : 'Back & Lats'}</option>
                <option value="shoulders">{isArabic ? 'الأكتاف' : 'Shoulders'}</option>
                <option value="biceps">{isArabic ? 'البايسبس' : 'Biceps'}</option>
                <option value="triceps">{isArabic ? 'الترايسبس' : 'Triceps'}</option>
                <option value="forearms">{isArabic ? 'الساعد والقبضة' : 'Forearms & Grip'}</option>
                <option value="quads">{isArabic ? 'الفخذ الأمامي' : 'Quadriceps'}</option>
                <option value="hamstrings">{isArabic ? 'الفخذ الخلفي' : 'Hamstrings'}</option>
                <option value="glutes">{isArabic ? 'المؤخرة والحوض' : 'Glutes & Hips'}</option>
                <option value="calves">{isArabic ? 'السمانة' : 'Calves'}</option>
                <option value="abs">{isArabic ? 'البطن والكور' : 'Abs & Core'}</option>
                <option value="cardio">{isArabic ? 'الكارديو' : 'Cardio'}</option>
                <option value="mobility">{isArabic ? 'المرونة والإطالة' : 'Mobility & Stretching'}</option>
              </select>

              <select
                value={equipmentFilter}
                onChange={(e) => setEquipmentFilter(e.target.value)}
                className="px-2.5 py-1.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-[#151c13] font-semibold text-stone-700 dark:text-stone-300 focus:outline-none"
              >
                <option value="all">{isArabic ? 'جميع الأدوات' : 'All Equipment'}</option>
                <option value="dumbbell">{isArabic ? 'دمبل فقط' : 'Dumbbell-only'}</option>
                <option value="barbell">{isArabic ? 'بار أولمبي' : 'Barbell-only'}</option>
                <option value="bodyweight">{isArabic ? 'وزن الجسم فقط' : 'Bodyweight-only'}</option>
                <option value="bands">{isArabic ? 'أشرطة مقاومة' : 'Resistance Bands'}</option>
              </select>

              <select
                value={environmentFilter}
                onChange={(e) => setEnvironmentFilter(e.target.value)}
                className="px-2.5 py-1.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-[#151c13] font-semibold text-stone-700 dark:text-stone-300 focus:outline-none"
              >
                <option value="all">{isArabic ? 'كل الأماكن' : 'All Environments'}</option>
                <option value="home">{isArabic ? 'تمارين منزلية' : 'Home Workouts'}</option>
                <option value="gym">{isArabic ? 'تمارين الجيم' : 'Gym Workouts'}</option>
              </select>
            </div>
          </div>

          {/* Exercises List */}
          <div className="space-y-3">
            {filteredExercises.map((ex) => (
              <div
                key={ex.id}
                className="p-4 rounded-2xl bg-white dark:bg-[#1a2217] border border-stone-200 dark:border-stone-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-[#4D6A34]/50 transition-all"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-extrabold text-xs sm:text-sm">
                      {isArabic ? ex.nameAr : ex.nameEn}
                    </h4>
                    <span className="text-[9px] px-2 py-0.5 rounded-md font-bold bg-[#EBF2E8] dark:bg-[#283620] text-[#4D6A34] dark:text-[#85A947]">
                      {ex.primaryMuscleEn || ex.muscleGroup}
                    </span>
                  </div>

                  <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-1">
                    {isArabic ? ex.equipmentAr : ex.equipmentEn} • {ex.suggestedSets} {isArabic ? 'مجموعات' : 'sets'} × {ex.suggestedReps}
                  </p>

                  {ex.alternatives && ex.alternatives.length > 0 && (
                    <span className="text-[10px] text-[#4D6A34] dark:text-[#85A947] font-semibold block mt-1">
                      🔄 {isArabic ? `${ex.alternatives.length} بدائل ذكية متوفرة` : `${ex.alternatives.length} alternatives available`}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => setDemonstrationExercise(ex)}
                    className="px-3.5 py-2 rounded-xl bg-[#4D6A34] hover:bg-[#3B5323] text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>{isArabic ? 'شاهد التكنيك والمفاصل' : 'Animated Demo'}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 4. TAB: PROGRAMS & CUSTOM ROUTINE BUILDER                */}
      {/* ======================================================== */}
      {activeTab === 'programs' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-[#1a2217] rounded-3xl p-5 border border-stone-200 dark:border-stone-800 shadow-xs flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-sm sm:text-base">
                {isArabic ? 'برامج التمارين وجدول التدريب' : 'Workout Programs & Schedule'}
              </h3>
              <p className="text-xs text-stone-400 mt-0.5">
                {isArabic ? 'خطط معتمدة (PPL، علوي/سفلي، شامل) وروتيناتك الخاصة' : 'Curated splits and your custom built routines'}
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setShowRoutineBuilder(true)}
                className="px-3.5 py-2 rounded-xl bg-[#4D6A34] hover:bg-[#3B5323] text-white text-xs font-bold flex items-center gap-1.5 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>{isArabic ? 'إنشاء روتين خاص' : 'Create Custom Routine'}</span>
              </button>
            </div>
          </div>

          {/* Programs Cards */}
          <div className="space-y-4">
            {allPrograms.map((prog) => (
              <div
                key={prog.id}
                className="bg-white dark:bg-[#1a2217] rounded-3xl p-5 border border-stone-200 dark:border-stone-800 shadow-xs space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-extrabold text-sm sm:text-base">
                      {isArabic ? prog.nameAr : prog.nameEn}
                    </h4>
                    <p className="text-xs text-stone-400 mt-0.5">
                      {isArabic ? prog.descriptionAr : prog.descriptionEn}
                    </p>
                  </div>

                  {prog.splitType === 'custom' && (
                    <button
                      onClick={() => onDeleteCustomRoutine(prog.id)}
                      className="p-1.5 rounded-lg text-red-400 hover:text-red-600"
                      title="Delete routine"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Days inside Program */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                  {prog.days.map((day, dIdx) => (
                    <div
                      key={dIdx}
                      className="p-3 rounded-2xl bg-stone-50 dark:bg-[#151c13] border border-stone-200 dark:border-stone-800 space-y-2 flex flex-col justify-between"
                    >
                      <div>
                        <span className="font-bold text-xs block text-stone-800 dark:text-stone-200">
                          {isArabic ? day.dayNameAr : day.dayNameEn}
                        </span>
                        <span className="text-[10px] text-stone-400 block">
                          {isArabic ? day.targetMuscleAr : day.targetMuscleEn} ({day.exerciseIds.length} {isArabic ? 'تمارين' : 'exercises'})
                        </span>
                      </div>

                      <button
                        onClick={() => handleStartWorkout(prog, dIdx)}
                        className="w-full py-1.5 rounded-xl bg-white dark:bg-[#1a2217] hover:bg-[#EBF2E8] dark:hover:bg-[#283620] text-[#4D6A34] dark:text-[#85A947] border border-stone-200 dark:border-stone-700 text-[11px] font-bold flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <Play className="w-3 h-3 fill-current" />
                        <span>{isArabic ? 'بدء هذا اليوم' : 'Start Day'}</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 5. TAB: LIVE WORKOUT TRACKER WITH UNLOCKED NUMBERS       */}
      {/* ======================================================== */}
      {activeTab === 'live' && liveWorkout && (
        <div className="space-y-4">
          {/* Live Workout Active Header */}
          <div className="bg-[#4D6A34] text-white rounded-3xl p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#D4DFCD] block">
                  {isArabic ? 'نمط التمرين المباشر النشط' : 'Active Live Workout Mode'}
                </span>
                <h2 className="text-xl font-black">{liveWorkout.workoutName}</h2>
              </div>

              <div className="text-end">
                <span className="text-xl font-black font-mono">
                  {Math.floor(liveWorkout.elapsedSeconds / 60)}:
                  {String(liveWorkout.elapsedSeconds % 60).padStart(2, '0')}
                </span>
                <span className="text-[10px] text-[#D4DFCD] block">{isArabic ? 'الوقت المنقضي' : 'Elapsed Time'}</span>
              </div>
            </div>

            {/* Rest Timer Widget */}
            <div className="p-3 rounded-2xl bg-black/20 backdrop-blur-xs flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs">
                <Timer className="w-4 h-4 text-[#D4DFCD]" />
                <span>
                  {isArabic ? 'مؤقت الراحة:' : 'Rest Timer:'}{' '}
                  <strong className="font-mono text-sm">{liveWorkout.restTimerSeconds}s</strong>
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() =>
                    onUpdateLiveWorkout({
                      ...liveWorkout,
                      restTimerRunning: !liveWorkout.restTimerRunning,
                    })
                  }
                  className="px-2.5 py-1 rounded-lg bg-white/20 text-xs font-bold hover:bg-white/30"
                >
                  {liveWorkout.restTimerRunning ? 'Pause' : 'Start'}
                </button>
                <button
                  onClick={() =>
                    onUpdateLiveWorkout({
                      ...liveWorkout,
                      restTimerSeconds: 60,
                      restTimerRunning: false,
                    })
                  }
                  className="px-2 py-1 rounded-lg bg-white/20 text-xs font-bold hover:bg-white/30"
                >
                  60s
                </button>
                <button
                  onClick={() =>
                    onUpdateLiveWorkout({
                      ...liveWorkout,
                      restTimerSeconds: 90,
                      restTimerRunning: false,
                    })
                  }
                  className="px-2 py-1 rounded-lg bg-white/20 text-xs font-bold hover:bg-white/30"
                >
                  90s
                </button>
              </div>
            </div>
          </div>

          {/* Exercises in Live Workout */}
          <div className="space-y-3">
            {liveWorkout.exercises.map((ex, exIdx) => (
              <div
                key={ex.exerciseId}
                className="bg-white dark:bg-[#1a2217] rounded-3xl p-5 border border-stone-200 dark:border-stone-800 shadow-xs space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-extrabold text-sm sm:text-base">
                      {isArabic ? ex.nameAr : ex.nameEn}
                    </h4>
                    <span className="text-[11px] text-stone-400">{ex.targetMuscle}</span>
                  </div>

                  <button
                    onClick={() => {
                      const fullEx = EXERCISE_DATABASE.find((e) => e.id === ex.exerciseId);
                      if (fullEx) setDemonstrationExercise(fullEx);
                    }}
                    className="px-2.5 py-1 rounded-xl bg-stone-100 dark:bg-stone-800 text-[#4D6A34] dark:text-[#85A947] text-[11px] font-bold flex items-center gap-1"
                  >
                    <Play className="w-3 h-3" />
                    <span>{isArabic ? 'شاهد التكنيك' : 'Demo'}</span>
                  </button>
                </div>

                {/* Sets Table: UNLOCKED MANUAL ENTRY */}
                <div className="space-y-2">
                  <div className="grid grid-cols-12 text-[10px] uppercase font-bold text-stone-400 px-2">
                    <span className="col-span-2">{isArabic ? 'مجموعة' : 'Set'}</span>
                    <span className="col-span-4">{isArabic ? 'الوزن (كجم)' : 'Weight (kg)'}</span>
                    <span className="col-span-4">{isArabic ? 'التكرارات' : 'Reps'}</span>
                    <span className="col-span-2 text-center">{isArabic ? 'تم' : 'Done'}</span>
                  </div>

                  {ex.sets.map((s, sIdx) => (
                    <div
                      key={s.setNumber}
                      className={`grid grid-cols-12 items-center p-2 rounded-xl transition-colors ${
                        s.completed
                          ? 'bg-[#EBF2E8] dark:bg-[#283620]/40'
                          : 'bg-stone-50 dark:bg-[#151c13]'
                      }`}
                    >
                      <span className="col-span-2 font-bold text-xs">#{s.setNumber}</span>

                      {/* Weight Input (Free Manual Edit) */}
                      <div className="col-span-4 pr-2">
                        <input
                          type="number"
                          step="0.5"
                          value={s.weightKg}
                          onChange={(e) =>
                            handleUpdateSetNumber(
                              exIdx,
                              sIdx,
                              'weightKg',
                              parseFloat(e.target.value) || 0
                            )
                          }
                          className="w-full px-2 py-1 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-[#1a2217] text-xs font-bold text-center focus:outline-none focus:ring-1 focus:ring-[#4D6A34]"
                        />
                      </div>

                      {/* Reps Input (Free Manual Edit) */}
                      <div className="col-span-4 pr-2">
                        <input
                          type="number"
                          value={s.reps}
                          onChange={(e) =>
                            handleUpdateSetNumber(
                              exIdx,
                              sIdx,
                              'reps',
                              parseInt(e.target.value, 10) || 0
                            )
                          }
                          className="w-full px-2 py-1 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-[#1a2217] text-xs font-bold text-center focus:outline-none focus:ring-1 focus:ring-[#4D6A34]"
                        />
                      </div>

                      {/* Completion Checkbox */}
                      <div className="col-span-2 flex justify-center">
                        <button
                          onClick={() => handleToggleSet(exIdx, sIdx)}
                          className={`w-7 h-7 rounded-xl flex items-center justify-center transition-all ${
                            s.completed
                              ? 'bg-[#4D6A34] text-white shadow-xs'
                              : 'bg-stone-200 dark:bg-stone-700 text-stone-400'
                          }`}
                        >
                          <Check className="w-4 h-4 stroke-[3]" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Finish & Save Workout Bar */}
          <div className="flex gap-2 pt-2">
            <button
              onClick={handleFinishWorkout}
              className="flex-1 py-3.5 rounded-2xl bg-[#4D6A34] hover:bg-[#3B5323] text-white font-extrabold text-sm shadow-md transition-all flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>{isArabic ? 'إنهاء وحفظ التمرين في السجل' : 'Finish & Save Workout'}</span>
            </button>

            <button
              onClick={() => onUpdateLiveWorkout(null)}
              className="px-4 py-3.5 rounded-2xl bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300 font-bold text-xs"
            >
              {isArabic ? 'إلغاء' : 'Discard'}
            </button>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 6. TAB: WORKOUT HISTORY & PREVIOUS DAYS                  */}
      {/* ======================================================== */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-[#1a2217] rounded-3xl p-5 border border-stone-200 dark:border-stone-800 shadow-xs flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-sm sm:text-base">
                {isArabic ? 'سجل التمارين السابقة' : 'Past Workout Logs'}
              </h3>
              <p className="text-xs text-stone-400 mt-0.5">
                {isArabic ? `${workoutLogs.length} حصة تدريبية مسجلة بنجاح` : `${workoutLogs.length} sessions logged`}
              </p>
            </div>

            <input
              type="date"
              value={selectedReviewDate}
              onChange={(e) => setSelectedReviewDate(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-stone-300 dark:border-stone-700 text-xs font-bold bg-transparent cursor-pointer"
            />
          </div>

          <div className="space-y-3">
            {workoutLogs.map((log) => (
              <div
                key={log.id}
                className="p-4 rounded-3xl bg-white dark:bg-[#1a2217] border border-stone-200 dark:border-stone-800 shadow-xs space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-extrabold text-xs sm:text-sm">{log.workoutName}</h4>
                    <span className="text-[10px] text-stone-400 block mt-0.5">{log.date}</span>
                  </div>

                  <div className="flex items-center gap-2 text-xs">
                    <span className="px-2 py-0.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 font-bold">
                      🔥 {log.estimatedCaloriesBurned} kcal
                    </span>
                    <span className="px-2 py-0.5 rounded-lg bg-stone-100 dark:bg-stone-800 font-bold">
                      ⏱️ {log.durationMinutes} min
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-center">
                  <div className="p-2 rounded-xl bg-stone-50 dark:bg-stone-800/60">
                    <span className="text-[10px] text-stone-400 block">{isArabic ? 'التمارين' : 'Exercises'}</span>
                    <span className="font-bold">{log.exercisesCount}</span>
                  </div>
                  <div className="p-2 rounded-xl bg-stone-50 dark:bg-stone-800/60">
                    <span className="text-[10px] text-stone-400 block">{isArabic ? 'المجموعات' : 'Sets'}</span>
                    <span className="font-bold">{log.setsCompleted}</span>
                  </div>
                  <div className="p-2 rounded-xl bg-stone-50 dark:bg-stone-800/60">
                    <span className="text-[10px] text-stone-400 block">{isArabic ? 'الحجم الإجمالي' : 'Total Volume'}</span>
                    <span className="font-bold text-[#4D6A34] dark:text-[#85A947]">{log.totalVolumeKg} kg</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: EDIT TRAINING SCHEDULE DAYS                       */}
      {/* ======================================================== */}
      {showScheduleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/70 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white dark:bg-[#1a2217] w-full max-w-lg rounded-3xl p-5 shadow-2xl border border-stone-200 dark:border-stone-800 text-stone-900 dark:text-stone-100 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 pb-3">
              <h3 className="font-black text-sm sm:text-base">
                {isArabic ? 'تخصيص أيام التدريب والراحة' : 'Customize Training & Rest Days'}
              </h3>
              <button onClick={() => setShowScheduleModal(false)} className="p-1.5 text-stone-400 hover:text-stone-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              {['الأحد (Sun)', 'الإثنين (Mon)', 'الثلاثاء (Tue)', 'الأربعاء (Wed)', 'الخميس (Thu)', 'الجمعة (Fri)', 'السبت (Sat)'].map((dayLabel, idx) => {
                const currentVal = scheduleMap[String(idx)];

                return (
                  <div key={idx} className="flex items-center justify-between p-2 rounded-xl bg-stone-50 dark:bg-stone-800/40">
                    <span className="font-bold text-xs">{dayLabel}</span>
                    <select
                      value={currentVal || 'rest'}
                      onChange={(e) => {
                        const newSchedule = { ...scheduleMap, [String(idx)]: e.target.value === 'rest' ? null : e.target.value };
                        onUpdateProfile({ ...profile, weeklySchedule: newSchedule });
                      }}
                      className="px-2.5 py-1 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-[#1a2217] text-xs font-semibold focus:outline-none"
                    >
                      <option value="rest">{isArabic ? '🧘 يوم راحة (Rest Day)' : '🧘 Rest Day'}</option>
                      <option value="ppl_push">{isArabic ? 'Push (صدر، كتف، ترايسبس)' : 'Push (Chest, Delts, Triceps)'}</option>
                      <option value="ppl_pull">{isArabic ? 'Pull (ظهر، بايسبس، كتف خلفي)' : 'Pull (Back, Biceps, Rear Delts)'}</option>
                      <option value="ppl_legs">{isArabic ? 'Legs (أرجل، سمانة، بطن)' : 'Legs (Quads, Hamstrings, Glutes)'}</option>
                      <option value="upper_lower_upper">{isArabic ? 'Upper Body (جزء علوي شامل)' : 'Upper Body'}</option>
                      <option value="upper_lower_lower">{isArabic ? 'Lower Body (جزء سفلي شامل)' : 'Lower Body'}</option>
                    </select>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowScheduleModal(false)}
                className="px-4 py-2 rounded-xl bg-[#4D6A34] text-white text-xs font-bold"
              >
                {isArabic ? 'تم وحفظ الجدول' : 'Save Schedule'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: LOG OR EDIT PERSONAL RECORD                       */}
      {/* ======================================================== */}
      {showPrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/70 backdrop-blur-xs p-4 overflow-y-auto">
          <form
            onSubmit={handleSavePrForm}
            className="bg-white dark:bg-[#1a2217] w-full max-w-md rounded-3xl p-5 shadow-2xl border border-stone-200 dark:border-stone-800 text-stone-900 dark:text-stone-100 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 pb-3">
              <h3 className="font-black text-sm sm:text-base flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-500" />
                <span>{isArabic ? 'تسجيل رقم قياسي جديد (PR)' : 'Log Personal Record'}</span>
              </h3>
              <button type="button" onClick={() => setShowPrModal(false)} className="p-1.5 text-stone-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold block mb-1">{isArabic ? 'التمرين' : 'Exercise'}</label>
                <select
                  value={prExerciseId}
                  onChange={(e) => setPrExerciseId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-[#151c13] focus:outline-none"
                >
                  {EXERCISE_DATABASE.map((ex) => (
                    <option key={ex.id} value={ex.id}>
                      {isArabic ? ex.nameAr : ex.nameEn}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold block mb-1">{isArabic ? 'الوزن (كجم)' : 'Weight (kg)'}</label>
                  <input
                    type="number"
                    step="0.5"
                    required
                    value={prWeight}
                    onChange={(e) => setPrWeight(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-[#151c13]"
                  />
                </div>
                <div>
                  <label className="font-bold block mb-1">{isArabic ? 'التكرارات' : 'Reps'}</label>
                  <input
                    type="number"
                    required
                    value={prReps}
                    onChange={(e) => setPrReps(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-[#151c13]"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold block mb-1">{isArabic ? 'التاريخ' : 'Date'}</label>
                <input
                  type="date"
                  required
                  value={prDate}
                  onChange={(e) => setPrDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-[#151c13]"
                />
              </div>

              <div>
                <label className="font-bold block mb-1">{isArabic ? 'ملاحظات (الأداء / الحزام)' : 'Notes'}</label>
                <input
                  type="text"
                  placeholder={isArabic ? 'مثال: وقفة مريحة، قبضة محكمة' : 'e.g. Belted, paused at chest'}
                  value={prNotes}
                  onChange={(e) => setPrNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-[#151c13]"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                className="flex-1 py-2.5 rounded-xl bg-[#4D6A34] text-white font-bold text-xs hover:bg-[#3B5323]"
              >
                {isArabic ? 'حفظ الرقم القياسي' : 'Save PR'}
              </button>
              <button
                type="button"
                onClick={() => setShowPrModal(false)}
                className="px-4 py-2.5 rounded-xl bg-stone-200 dark:bg-stone-800 text-xs font-bold"
              >
                {isArabic ? 'إلغاء' : 'Cancel'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: CUSTOM ROUTINE BUILDER                            */}
      {/* ======================================================== */}
      {showRoutineBuilder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/70 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white dark:bg-[#1a2217] w-full max-w-lg rounded-3xl p-5 shadow-2xl border border-stone-200 dark:border-stone-800 text-stone-900 dark:text-stone-100 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 pb-3">
              <h3 className="font-black text-sm sm:text-base">
                {isArabic ? 'بناء وتخصيص روتين تدريبي جديد' : 'Create Custom Workout Routine'}
              </h3>
              <button onClick={() => setShowRoutineBuilder(false)} className="p-1.5 text-stone-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold block mb-1">{isArabic ? 'اسم الروتين بالإنجليزية' : 'Routine Name (English)'} *</label>
                <input
                  type="text"
                  placeholder="e.g. 3-Day Full Body Blast"
                  value={routineNameEn}
                  onChange={(e) => setRoutineNameEn(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-[#151c13]"
                />
              </div>

              <div>
                <label className="font-bold block mb-1">{isArabic ? 'اسم الروتين بالعربية' : 'Routine Name (Arabic)'} *</label>
                <input
                  type="text"
                  placeholder="مثال: روتين الجسم الكامل 3 أيام"
                  value={routineNameAr}
                  onChange={(e) => setRoutineNameAr(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-[#151c13]"
                />
              </div>

              <div>
                <label className="font-bold block mb-1">{isArabic ? 'اختر تمارين الحصة التدريبية:' : 'Select Exercises:'}</label>
                <div className="max-h-48 overflow-y-auto space-y-1.5 border border-stone-200 dark:border-stone-800 rounded-xl p-2 bg-stone-50 dark:bg-[#151c13]">
                  {EXERCISE_DATABASE.map((ex) => {
                    const isSelected = selectedRoutineExercises.includes(ex.id);
                    return (
                      <div
                        key={ex.id}
                        onClick={() => {
                          if (isSelected) {
                            setSelectedRoutineExercises(selectedRoutineExercises.filter((id) => id !== ex.id));
                          } else {
                            setSelectedRoutineExercises([...selectedRoutineExercises, ex.id]);
                          }
                        }}
                        className={`p-2 rounded-lg cursor-pointer flex items-center justify-between text-[11px] ${
                          isSelected ? 'bg-[#EBF2E8] dark:bg-[#283620] text-[#4D6A34] dark:text-[#85A947] font-bold' : 'hover:bg-stone-100 dark:hover:bg-stone-800'
                        }`}
                      >
                        <span>{isArabic ? ex.nameAr : ex.nameEn}</span>
                        {isSelected && <Check className="w-3.5 h-3.5" />}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => {
                  if (!routineNameEn || selectedRoutineExercises.length === 0) return;
                  const newProg: WorkoutProgram = {
                    id: `custom_prog_${Date.now()}`,
                    nameEn: routineNameEn,
                    nameAr: routineNameAr || routineNameEn,
                    descriptionEn: 'Custom user routine',
                    descriptionAr: 'روتين مخصص بواسطة المستخدم',
                    splitType: 'custom',
                    days: [
                      {
                        dayNameEn: 'Session A',
                        dayNameAr: 'الحصة الأولى',
                        targetMuscleEn: 'Full Body Focus',
                        targetMuscleAr: 'تركيز شامل',
                        exerciseIds: selectedRoutineExercises,
                        targetDurationMin: 45,
                      },
                    ],
                  };
                  onSaveCustomRoutine(newProg);
                  setShowRoutineBuilder(false);
                  setRoutineNameEn('');
                  setRoutineNameAr('');
                  setSelectedRoutineExercises([]);
                }}
                className="px-4 py-2 rounded-xl bg-[#4D6A34] text-white text-xs font-bold hover:bg-[#3B5323]"
              >
                {isArabic ? 'حفظ الروتين' : 'Save Routine'}
              </button>
              <button
                onClick={() => setShowRoutineBuilder(false)}
                className="px-4 py-2 rounded-xl bg-stone-200 dark:bg-stone-800 text-xs font-bold"
              >
                {isArabic ? 'إلغاء' : 'Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
