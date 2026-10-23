import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Maximize2, Sparkles, AlertCircle, Wifi, ShieldAlert } from 'lucide-react';
import { Exercise, Language } from '../types/index.ts';

interface ExerciseAnimationPlayerProps {
  exercise: Exercise;
  language: Language;
  onOpenEnlarged?: () => void;
  compact?: boolean;
}

export const ExerciseAnimationPlayer: React.FC<ExerciseAnimationPlayerProps> = ({
  exercise,
  language,
  onOpenEnlarged,
  compact = false,
}) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [speed, setSpeed] = useState<number>(1);
  const [progress, setProgress] = useState<number>(0); // 0 to 1
  const [activeMediaTab, setActiveMediaTab] = useState<'animation' | 'video' | 'steps'>('animation');
  const animFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(performance.now());

  // Kinematic loop duration in ms (scaled by speed)
  const baseDuration = 3200; // 3.2s per full rep (concentric + eccentric)

  useEffect(() => {
    if (!isPlaying) {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      return;
    }

    const animate = (now: number) => {
      const delta = now - lastTimeRef.current;
      lastTimeRef.current = now;

      setProgress((prev) => {
        const next = prev + (delta / (baseDuration / speed));
        return next >= 1 ? 0 : next;
      });

      animFrameRef.current = requestAnimationFrame(animate);
    };

    lastTimeRef.current = performance.now();
    animFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isPlaying, speed]);

  const handleTogglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const handleReplay = () => {
    setProgress(0);
    setIsPlaying(true);
  };

  // Phase computation: 0..0.45 = concentric (contracting), 0.45..0.55 = peak hold, 0.55..1.0 = eccentric (lowering)
  const isConcentric = progress < 0.45;
  const isPeak = progress >= 0.45 && progress <= 0.55;
  const isEccentric = progress > 0.55;

  // Breathing state: during eccentric descent inhale, during concentric push/pull exhale
  const breathingText = isConcentric 
    ? (language === 'ar' ? 'زفير قوي 💨' : 'Exhale Forcefully 💨')
    : (language === 'ar' ? 'شهيق عميق 🫁' : 'Inhale Deeply 🫁');

  const phaseText = isPeak
    ? (language === 'ar' ? 'عصر وثبات القمة' : 'Peak Contraction Hold')
    : isConcentric
    ? (language === 'ar' ? 'الدفع / السحب الإيجابي' : 'Concentric Drive')
    : (language === 'ar' ? 'النزول والتحكم السلبي' : 'Controlled Eccentric');

  // Compute kinematic joint angles based on progress and exercise type
  interface KinematicValues {
    displacementY: number;
    hipY: number;
    kneeAngle: number;
    pullY: number;
    elbowDropY: number;
    forearmAngle: number;
    extensionY: number;
    armAngle: number;
    hipHingeX: number;
    barY: number;
    highlightMuscle: string;
  }

  const getKinematicValues = (): KinematicValues => {
    const cycle = Math.sin(progress * Math.PI); // 0 -> 1 -> 0
    const base: KinematicValues = {
      displacementY: cycle * 35,
      hipY: cycle * 50,
      kneeAngle: cycle * 85,
      pullY: cycle * 45,
      elbowDropY: cycle * 35,
      forearmAngle: cycle * 120,
      extensionY: cycle * 45,
      armAngle: cycle * 80,
      hipHingeX: cycle * 40,
      barY: cycle * 55,
      highlightMuscle: 'general',
    };

    switch (exercise.animationKey) {
      case 'bench_press':
      case 'incline_press':
      case 'pushup':
        return {
          ...base,
          displacementY: cycle * 45,
          highlightMuscle: 'chest',
        };
      case 'squat':
      case 'leg_press':
        return {
          ...base,
          hipY: cycle * 50,
          kneeAngle: cycle * 85,
          highlightMuscle: 'quads',
        };
      case 'deadlift':
      case 'rdl':
        return {
          ...base,
          hipHingeX: cycle * 40,
          barY: cycle * 55,
          highlightMuscle: 'back',
        };
      case 'pullup':
      case 'lat_pulldown':
        return {
          ...base,
          pullY: cycle * 45,
          elbowDropY: cycle * 35,
          highlightMuscle: 'lats',
        };
      case 'bicep_curl':
        return {
          ...base,
          forearmAngle: cycle * 120,
          highlightMuscle: 'biceps',
        };
      case 'tricep_pushdown':
      case 'dips':
        return {
          ...base,
          extensionY: cycle * 45,
          highlightMuscle: 'triceps',
        };
      case 'lateral_raise':
        return {
          ...base,
          armAngle: cycle * 80,
          highlightMuscle: 'shoulders',
        };
      default:
        return {
          ...base,
          displacementY: cycle * 35,
          highlightMuscle: 'general',
        };
    }
  };

  const kinematics = getKinematicValues();

  return (
    <div className="bg-stone-50 dark:bg-[#151c13] rounded-2xl border border-stone-200 dark:border-stone-800 overflow-hidden shadow-xs">
      {/* Media Format Selector Tabs */}
      <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 px-3 py-1.5 bg-white dark:bg-[#1a2217] text-[11px]">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveMediaTab('animation')}
            className={`px-2.5 py-1 rounded-lg font-bold transition-colors ${
              activeMediaTab === 'animation'
                ? 'bg-[#EBF2E8] dark:bg-[#283620] text-[#4D6A34] dark:text-[#85A947]'
                : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
            }`}
          >
            {language === 'ar' ? '🎬 الحركة والمفاصل' : '🎬 Kinematic Loop'}
          </button>

          <button
            onClick={() => setActiveMediaTab('video')}
            className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 transition-colors ${
              activeMediaTab === 'video'
                ? 'bg-[#EBF2E8] dark:bg-[#283620] text-[#4D6A34] dark:text-[#85A947]'
                : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
            }`}
          >
            <Wifi className="w-3 h-3 text-stone-400" />
            <span>{language === 'ar' ? 'فيديو تعليمي' : 'Video Demo'}</span>
          </button>

          <button
            onClick={() => setActiveMediaTab('steps')}
            className={`px-2.5 py-1 rounded-lg font-bold transition-colors ${
              activeMediaTab === 'steps'
                ? 'bg-[#EBF2E8] dark:bg-[#283620] text-[#4D6A34] dark:text-[#85A947]'
                : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
            }`}
          >
            {language === 'ar' ? '📋 خطوات التكنيك' : '📋 Form Steps'}
          </button>
        </div>

        {onOpenEnlarged && (
          <button
            onClick={onOpenEnlarged}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200"
            title={language === 'ar' ? 'تكبير العرض' : 'Enlarge view'}
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Main Canvas / Screen */}
      <div className={`relative flex items-center justify-center bg-radial from-stone-100 to-stone-200/80 dark:from-[#1b2518] dark:to-[#121810] ${compact ? 'h-48' : 'h-64'} transition-all`}>
        {activeMediaTab === 'animation' && (
          <div className="w-full h-full flex flex-col items-center justify-center p-3 relative">
            {/* Live Vector Kinematic Canvas */}
            <svg
              viewBox="0 0 200 180"
              className="w-full h-full max-h-48 filter drop-shadow-sm select-none"
            >
              <defs>
                <linearGradient id="muscleActive" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#4D6A34" />
                  <stop offset="100%" stopColor="#85A947" />
                </linearGradient>
                <linearGradient id="boneStructure" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#78716c" />
                  <stop offset="100%" stopColor="#57534e" />
                </linearGradient>
              </defs>

              {/* Bench or Ground Line */}
              <line x1="20" y1="150" x2="180" y2="150" stroke="#a8a29e" strokeWidth="3" strokeLinecap="round" strokeDasharray="4 4" />

              {/* Specialized dynamic vector animation by exercise key */}
              {exercise.animationKey === 'bench_press' || exercise.animationKey === 'incline_press' ? (
                <g>
                  {/* Bench */}
                  <rect x="40" y="115" width="120" height="12" rx="3" fill="#44403c" />
                  <line x1="60" y1="127" x2="60" y2="150" stroke="#44403c" strokeWidth="4" />
                  <line x1="140" y1="127" x2="140" y2="150" stroke="#44403c" strokeWidth="4" />

                  {/* Lifter Body Torso */}
                  <path d="M65,115 Q100,108 135,115" stroke="#78716c" strokeWidth="14" fill="none" strokeLinecap="round" />
                  
                  {/* Head */}
                  <circle cx="55" cy="113" r="8" fill="#78716c" />

                  {/* Chest Highlight */}
                  <path
                    d="M85,112 Q100,105 115,112"
                    stroke="url(#muscleActive)"
                    strokeWidth={isPeak ? "8" : "5"}
                    fill="none"
                    strokeLinecap="round"
                    className="transition-all duration-150"
                  />

                  {/* Arms & Barbell moving vertically */}
                  {/* Upper Arm */}
                  <line
                    x1="95"
                    y1="110"
                    x2={80 + (1 - kinematics.displacementY / 45) * 15}
                    y2={95 + (1 - kinematics.displacementY / 45) * 15}
                    stroke="url(#boneStructure)"
                    strokeWidth="5"
                    strokeLinecap="round"
                  />
                  {/* Forearm to bar */}
                  <line
                    x1={80 + (1 - kinematics.displacementY / 45) * 15}
                    y1={95 + (1 - kinematics.displacementY / 45) * 15}
                    x2="95"
                    y2={100 - kinematics.displacementY}
                    stroke="url(#boneStructure)"
                    strokeWidth="5"
                    strokeLinecap="round"
                  />

                  {/* Barbell Bar */}
                  <line
                    x1="35"
                    y1={100 - kinematics.displacementY}
                    x2="155"
                    y2={100 - kinematics.displacementY}
                    stroke="#1c1917"
                    strokeWidth="4"
                    strokeLinecap="round"
                  />
                  {/* Barbell Plates */}
                  <rect x="30" y={88 - kinematics.displacementY} width="7" height="24" rx="2" fill="#4D6A34" />
                  <rect x="153" y={88 - kinematics.displacementY} width="7" height="24" rx="2" fill="#4D6A34" />
                </g>
              ) : exercise.animationKey === 'squat' ? (
                <g>
                  {/* Squat Lifter: Head, Torso, Hips, Legs */}
                  {/* Head */}
                  <circle cx="100" cy={40 + kinematics.hipY * 0.7} r="9" fill="#78716c" />
                  {/* Barbell on upper traps */}
                  <line x1="60" y1={42 + kinematics.hipY * 0.7} x2="140" y2={42 + kinematics.hipY * 0.7} stroke="#1c1917" strokeWidth="4" strokeLinecap="round" />
                  <rect x="54" y={32 + kinematics.hipY * 0.7} width="7" height="20" rx="2" fill="#4D6A34" />
                  <rect x="139" y={32 + kinematics.hipY * 0.7} width="7" height="20" rx="2" fill="#4D6A34" />

                  {/* Torso */}
                  <line x1="100" y1={49 + kinematics.hipY * 0.7} x2={100 - kinematics.hipY * 0.15} y2={85 + kinematics.hipY} stroke="url(#muscleActive)" strokeWidth="12" strokeLinecap="round" />
                  
                  {/* Thigh / Quad */}
                  <line x1={100 - kinematics.hipY * 0.15} y1={85 + kinematics.hipY} x2={120 + kinematics.hipY * 0.25} y2={115 + kinematics.hipY * 0.4} stroke="url(#muscleActive)" strokeWidth="10" strokeLinecap="round" />
                  
                  {/* Shin / Calf */}
                  <line x1={120 + kinematics.hipY * 0.25} y1={115 + kinematics.hipY * 0.4} x2="110" y2="150" stroke="#78716c" strokeWidth="8" strokeLinecap="round" />
                  
                  {/* Foot */}
                  <line x1="105" y1="150" x2="125" y2="150" stroke="#44403c" strokeWidth="5" strokeLinecap="round" />
                </g>
              ) : exercise.animationKey === 'pullup' || exercise.animationKey === 'lat_pulldown' ? (
                <g>
                  {/* Pull-Up Bar / High Pulley */}
                  <line x1="30" y1="20" x2="170" y2="20" stroke="#1c1917" strokeWidth="5" strokeLinecap="round" />

                  {/* Hands on Bar */}
                  <circle cx="70" cy="20" r="5" fill="#44403c" />
                  <circle cx="130" cy="20" r="5" fill="#44403c" />

                  {/* Lifter: Rises from y=120 to y=65 */}
                  <circle cx="100" cy={100 - kinematics.pullY} r="9" fill="#78716c" />
                  {/* Back / Lats V-taper */}
                  <path
                    d={`M85,${120 - kinematics.pullY} L115,${120 - kinematics.pullY} L108,${155 - kinematics.pullY} L92,${155 - kinematics.pullY} Z`}
                    fill="url(#muscleActive)"
                  />
                  {/* Arms */}
                  <line x1="70" y1="20" x2="85" y2={115 - kinematics.pullY} stroke="url(#boneStructure)" strokeWidth="6" strokeLinecap="round" />
                  <line x1="130" y1="20" x2="115" y2={115 - kinematics.pullY} stroke="url(#boneStructure)" strokeWidth="6" strokeLinecap="round" />
                </g>
              ) : exercise.animationKey === 'bicep_curl' ? (
                <g>
                  {/* Standing Lifter Torso */}
                  <circle cx="90" cy="40" r="9" fill="#78716c" />
                  <line x1="90" y1="49" x2="90" y2="100" stroke="#78716c" strokeWidth="12" strokeLinecap="round" />
                  {/* Legs */}
                  <line x1="90" y1="100" x2="85" y2="150" stroke="#57534e" strokeWidth="8" strokeLinecap="round" />
                  <line x1="90" y1="100" x2="100" y2="150" stroke="#57534e" strokeWidth="8" strokeLinecap="round" />

                  {/* Upper Arm Pinned */}
                  <line x1="90" y1="58" x2="92" y2="92" stroke="#78716c" strokeWidth="8" strokeLinecap="round" />
                  
                  {/* Bicep Muscle Bulk */}
                  <circle cx="94" cy="75" r={isPeak ? "7" : "5"} fill="url(#muscleActive)" />

                  {/* Forearm Rotating with Dumbbell */}
                  <line
                    x1="92"
                    y1="92"
                    x2={92 + Math.sin(kinematics.forearmAngle * Math.PI / 180) * 35}
                    y2={92 - Math.cos(kinematics.forearmAngle * Math.PI / 180) * 35}
                    stroke="url(#boneStructure)"
                    strokeWidth="6"
                    strokeLinecap="round"
                  />
                  {/* Dumbbell */}
                  <circle
                    cx={92 + Math.sin(kinematics.forearmAngle * Math.PI / 180) * 35}
                    cy={92 - Math.cos(kinematics.forearmAngle * Math.PI / 180) * 35}
                    r="8"
                    fill="#1c1917"
                  />
                </g>
              ) : (
                /* Generalized High-Quality Biomechanical Figure */
                <g>
                  <circle cx="100" cy={55 - kinematics.displacementY * 0.3} r="9" fill="#78716c" />
                  <line x1="100" y1={64 - kinematics.displacementY * 0.3} x2="100" y2={105 - kinematics.displacementY * 0.2} stroke="url(#muscleActive)" strokeWidth="12" strokeLinecap="round" />
                  <line x1="100" y1={105 - kinematics.displacementY * 0.2} x2="85" y2="150" stroke="#57534e" strokeWidth="7" strokeLinecap="round" />
                  <line x1="100" y1={105 - kinematics.displacementY * 0.2} x2="115" y2="150" stroke="#57534e" strokeWidth="7" strokeLinecap="round" />
                  <line x1="100" y1={72 - kinematics.displacementY * 0.3} x2={75 + kinematics.displacementY * 0.4} y2={90 - kinematics.displacementY * 0.5} stroke="url(#boneStructure)" strokeWidth="6" strokeLinecap="round" />
                  <line x1="100" y1={72 - kinematics.displacementY * 0.3} x2={125 - kinematics.displacementY * 0.4} y2={90 - kinematics.displacementY * 0.5} stroke="url(#boneStructure)" strokeWidth="6" strokeLinecap="round" />
                </g>
              )}
            </svg>

            {/* Breathing & Form Phase Overlay Badges */}
            <div className="absolute top-2 left-2 right-2 flex items-center justify-between text-[10px]">
              <span className={`px-2 py-0.5 rounded-full font-bold shadow-xs ${
                isConcentric
                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-200'
                  : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-200'
              }`}>
                {breathingText}
              </span>

              <span className="px-2 py-0.5 rounded-full font-bold bg-white/80 dark:bg-stone-800/80 backdrop-blur-xs text-stone-700 dark:text-stone-300 shadow-xs">
                {phaseText}
              </span>
            </div>

            {/* Targeted Muscle Highlight Pill */}
            <div className="absolute bottom-2 left-2 flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-white/85 dark:bg-stone-800/85 backdrop-blur-xs border border-stone-200/50 dark:border-stone-700/50 text-[10px] text-stone-600 dark:text-stone-300">
              <span className="w-2 h-2 rounded-full bg-[#4D6A34] animate-pulse" />
              <span className="font-semibold">{language === 'ar' ? exercise.primaryMuscleAr : exercise.primaryMuscleEn}</span>
            </div>
          </div>
        )}

        {/* Video Demonstration Tab */}
        {activeMediaTab === 'video' && (
          <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center">
            <div className="w-12 h-12 rounded-full bg-white dark:bg-stone-800 flex items-center justify-center shadow-md mb-2">
              <Play className="w-6 h-6 text-[#4D6A34] dark:text-[#85A947] translate-x-0.5" />
            </div>
            <h4 className="text-xs font-bold text-stone-800 dark:text-stone-100 mb-1">
              {language === 'ar' ? 'فيديو توضيحي معتمد للحركة' : 'Official Instructional Movement Demo'}
            </h4>
            <p className="text-[10px] text-stone-500 max-w-xs mb-2">
              {language === 'ar'
                ? 'فيديو تمرين مرخص بجودة عالية يوضح زوايا المفصل والأداء المعتمد.'
                : 'Licensed educational fitness demonstration showing multi-angle joint alignment.'}
            </p>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 text-[10px] text-amber-800 dark:text-amber-200">
              <Wifi className="w-3 h-3 shrink-0" />
              <span>{language === 'ar' ? 'يتطلب الفيديو اتصالاً نشطاً بالإنترنت' : 'Online connection required for video streaming'}</span>
            </div>
          </div>
        )}

        {/* Step-by-Step Illustrated Frames Tab */}
        {activeMediaTab === 'steps' && (
          <div className="w-full h-full overflow-y-auto p-3.5 text-xs text-start space-y-2.5">
            <div className="p-2.5 rounded-xl bg-white dark:bg-[#1a2217] border border-stone-200 dark:border-stone-800">
              <span className="text-[10px] font-bold text-[#4D6A34] dark:text-[#85A947] block mb-0.5">
                {language === 'ar' ? '1. وضع البداية الصحيح:' : '1. Proper Starting Setup:'}
              </span>
              <p className="text-[11px] text-stone-700 dark:text-stone-300 leading-snug">
                {language === 'ar' ? exercise.startingPositionAr : exercise.startingPositionEn}
              </p>
            </div>

            <div className="p-2.5 rounded-xl bg-white dark:bg-[#1a2217] border border-stone-200 dark:border-stone-800">
              <span className="text-[10px] font-bold text-[#4D6A34] dark:text-[#85A947] block mb-0.5">
                {language === 'ar' ? '2. مسار الحركة والانقباض:' : '2. Movement Range of Motion:'}
              </span>
              <p className="text-[11px] text-stone-700 dark:text-stone-300 leading-snug">
                {language === 'ar' ? exercise.movementAr : exercise.movementEn}
              </p>
            </div>

            {exercise.safetyNotesEn && (
              <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 text-[10px] text-amber-900 dark:text-amber-200 flex items-start gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span>{language === 'ar' ? exercise.safetyNotesAr : exercise.safetyNotesEn}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Animation Player Control Bar */}
      {activeMediaTab === 'animation' && (
        <div className="p-2.5 bg-white dark:bg-[#1a2217] border-t border-stone-200 dark:border-stone-800 flex items-center justify-between gap-3 text-xs">
          {/* Play/Pause & Replay */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleTogglePlay}
              className="p-1.5 rounded-lg bg-[#4D6A34] hover:bg-[#3B5323] text-white transition-colors"
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 translate-x-0.2" />}
            </button>

            <button
              onClick={handleReplay}
              className="p-1.5 rounded-lg text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 transition-colors"
              title="Replay from start"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Interactive Progress Scrubber */}
          <div className="flex-1 flex items-center gap-2">
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={progress}
              onChange={(e) => {
                setProgress(parseFloat(e.target.value));
                setIsPlaying(false);
              }}
              className="w-full accent-[#4D6A34] h-1.5 bg-stone-200 dark:bg-stone-700 rounded-lg cursor-pointer"
            />
          </div>

          {/* Speed Buttons */}
          <div className="flex items-center gap-1 text-[10px] font-bold">
            {[0.5, 0.75, 1].map((s) => (
              <button
                key={s}
                onClick={() => setSpeed(s)}
                className={`px-1.5 py-0.5 rounded transition-colors ${
                  speed === s
                    ? 'bg-[#4D6A34] text-white'
                    : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300'
                }`}
              >
                {s}x
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
