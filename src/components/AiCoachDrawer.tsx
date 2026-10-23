import React, { useState, useRef, useEffect } from 'react';
import {
  UserProfile,
  DailyLog,
  PantryItem,
  ChatMessage,
  Language,
} from '../types/index.ts';
import { translations } from '../data/translations.ts';
import {
  Bot,
  Send,
  Volume2,
  VolumeX,
  Sparkles,
  ExternalLink,
  ShieldAlert,
  Loader2,
  Info,
} from 'lucide-react';

interface AiCoachDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile;
  dailyLog: DailyLog;
  pantryItems: PantryItem[];
  language: Language;
}

export const AiCoachDrawer: React.FC<AiCoachDrawerProps> = ({
  isOpen,
  onClose,
  profile,
  dailyLog,
  pantryItems,
  language,
}) => {
  const t = translations[language];

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text:
        language === 'ar'
          ? `أهلاً بك يا ${profile.name}! أنا مدربك الذكي في فيتورا AI. يمكنني مساعدتك في تحليل ما سجلته اليوم، واقتراح وجبات لذيذة وصحية من الأطعمة المتوفرة في بيتك، أو تعديل تمرينك. بماذا ترغب في البدء؟`
          : `Hello ${profile.name}! I am your Fitora AI Coach. I can analyze what you've logged today, suggest delicious balanced meals using the ingredients in your pantry, or guide your workouts. What would you like to explore today?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const [inputMessage, setInputMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const [hasQuotaNotice, setHasQuotaNotice] = useState<boolean>(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  if (!isOpen) return null;

  // Build context payload
  const buildUserContext = () => {
    const loggedCals = dailyLog.meals.reduce((sum, m) => sum + (m.calories || 0), 0);
    const loggedP = Math.round(dailyLog.meals.reduce((sum, m) => sum + (m.protein || 0), 0));
    const loggedC = Math.round(dailyLog.meals.reduce((sum, m) => sum + (m.carbs || 0), 0));
    const loggedF = Math.round(dailyLog.meals.reduce((sum, m) => sum + (m.fat || 0), 0));

    return {
      name: profile.name,
      primaryGoal: profile.primaryGoal,
      dailyCalorieTarget: profile.dailyCalorieTarget,
      loggedCalories: loggedCals,
      remainingCalories: (profile.dailyCalorieTarget || 2200) - loggedCals,
      loggedProtein: loggedP,
      loggedCarbs: loggedC,
      loggedFat: loggedF,
      todayMeals: dailyLog.meals.map((m) => ({ name: m.nameEn, grams: m.grams, cals: m.calories })),
      pantryItems: pantryItems.map((p) => p.nameEn || p.nameAr),
      allergies: profile.allergies,
      dislikedFoods: profile.dislikedFoods,
      isMinor: profile.isMinor,
      preferredCuisine: profile.preferredCuisine,
    };
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputMessage;
    if (!text.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: `usr_${Date.now()}`,
      sender: 'user',
      text: text.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai-coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text.trim(),
          history: messages.slice(-6),
          userContext: buildUserContext(),
          language,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (data.quotaExceeded) {
        setHasQuotaNotice(true);
      }

      const botMsgText = data.reply || (
        language === 'ar'
          ? `أهلاً بك! إليك ملخص بياناتك اليوم:\n• السعرات المستهلكة: ${buildUserContext().loggedCalories} سعرة (المتبقي: ${buildUserContext().remainingCalories} سعرة).\n• البروتين: ${buildUserContext().loggedProtein} جم | الكارب: ${buildUserContext().loggedCarbs} جم | الدهون: ${buildUserContext().loggedFat} جم.\n\nاستمر في الالتزام بهدفك!`
          : `Hello! Here is a summary of your data today:\n• Calories Logged: ${buildUserContext().loggedCalories} kcal (${buildUserContext().remainingCalories} kcal remaining).\n• Protein: ${buildUserContext().loggedProtein}g | Carbs: ${buildUserContext().loggedCarbs}g | Fat: ${buildUserContext().loggedFat}g.\n\nStay focused on your goal!`
      );

      const botMsg: ChatMessage = {
        id: `bot_${Date.now()}`,
        sender: 'assistant',
        text: botMsgText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        groundingSources: data.sources || [],
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch {
      const fallbackMsg: ChatMessage = {
        id: `fallback_${Date.now()}`,
        sender: 'assistant',
        text:
          language === 'ar'
            ? `أهلاً بك! ملخص سجلاتك اليوم:\n• السعرات: ${buildUserContext().loggedCalories} من ${buildUserContext().dailyCalorieTarget || 2200} سعرة.\n• البروتين: ${buildUserContext().loggedProtein} جم | الكارب: ${buildUserContext().loggedCarbs} جم | الدهون: ${buildUserContext().loggedFat} جم.\n\nتنبيه: يمكنك اختيار مفتاح مفعل الفوترة من Settings > Secrets لزيادة حصة الذكاء الاصطناعي.`
            : `Hello! Summary of your daily records:\n• Calories: ${buildUserContext().loggedCalories} / ${buildUserContext().dailyCalorieTarget || 2200} kcal.\n• Protein: ${buildUserContext().loggedProtein}g | Carbs: ${buildUserContext().loggedCarbs}g | Fat: ${buildUserContext().loggedFat}g.\n\nTip: You can select a billing-enabled key in Settings > Secrets to increase AI quota.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  // Play audio using gemini-3.8-flash-tts or Web Speech API fallback
  const handlePlayVoice = async (msg: ChatMessage) => {
    if (playingAudioId === msg.id) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      setPlayingAudioId(null);
      return;
    }

    try {
      setPlayingAudioId(msg.id);

      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: msg.text,
          language,
          voice: 'Kore',
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (data.audioBase64) {
        const audioUrl = `data:audio/wav;base64,${data.audioBase64}`;
        if (audioRef.current) {
          audioRef.current.src = audioUrl;
          audioRef.current.onended = () => setPlayingAudioId(null);
          audioRef.current.onerror = () => fallbackBrowserSpeech(msg.text);
          audioRef.current.play().catch(() => fallbackBrowserSpeech(msg.text));
        }
      } else {
        fallbackBrowserSpeech(msg.text);
      }
    } catch {
      fallbackBrowserSpeech(msg.text);
    }
  };

  const fallbackBrowserSpeech = (rawText: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const clean = rawText.replace(/[*#_~`•]/g, '').slice(0, 300);
      const utterance = new SpeechSynthesisUtterance(clean);
      utterance.lang = language === 'ar' ? 'ar-SA' : 'en-US';
      utterance.onend = () => setPlayingAudioId(null);
      utterance.onerror = () => setPlayingAudioId(null);
      window.speechSynthesis.speak(utterance);
    } else {
      setPlayingAudioId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-stone-900/60 backdrop-blur-xs">
      <audio ref={audioRef} className="hidden" />

      <div className="bg-white dark:bg-[#1a2217] w-full max-w-md h-full shadow-2xl flex flex-col text-stone-900 dark:text-stone-100 border-s border-stone-200 dark:border-stone-800 transition-colors">
        
        {/* Drawer Header */}
        <div className="p-4 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between bg-stone-50/60 dark:bg-stone-800/40">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#3B5323] to-[#6E9447] text-white flex items-center justify-center shadow-xs">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-extrabold text-sm">{t.coach.title}</h3>
                <span className="text-[9px] px-1.5 py-0.2 rounded font-bold bg-[#EBF2E8] dark:bg-[#283620] text-[#4D6A34] dark:text-[#85A947]">
                  Gemini 3.8 Flash
                </span>
              </div>
              <span className="text-[10px] text-stone-400 block">{t.common.searchGrounding}</span>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-stone-400 hover:text-stone-600 font-bold">
            ✕
          </button>
        </div>

        {/* Quota Notice Banner */}
        {hasQuotaNotice && (
          <div className="bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-900/50 px-3.5 py-2 text-[11px] text-amber-800 dark:text-amber-200 flex items-start gap-2">
            <span className="text-sm shrink-0">⚡</span>
            <div className="flex-1 leading-tight">
              <span>
                {language === 'ar'
                  ? 'تم بلوغ الحصة المجانية لـ Gemini API. يمكنك ربط مفتاح مفعل الفوترة من Settings > Secrets لزيادة السعة. تم تفعيل نظام التوجيه الرياضي والغذائي المباشر.'
                  : 'Free-tier Gemini API quota reached. You can select a billing-enabled key in Settings > Secrets. Real-time smart nutrition coach fallback is active.'}
              </span>
            </div>
          </div>
        )}

        {/* Messages Stream */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[85%] p-3.5 rounded-2xl shadow-xs leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-[#4D6A34] text-white rounded-br-none'
                    : 'bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-200 rounded-bl-none border border-stone-200/60 dark:border-stone-700/60'
                }`}
              >
                <p className="whitespace-pre-line">{msg.text}</p>

                {/* Grounding Sources */}
                {msg.groundingSources && msg.groundingSources.length > 0 && (
                  <div className="mt-2.5 pt-2 border-t border-stone-200 dark:border-stone-700 space-y-1">
                    <span className="text-[9px] font-bold text-stone-400 block uppercase tracking-wider">
                      {t.common.sources}:
                    </span>
                    {msg.groundingSources.slice(0, 3).map((src, i) => (
                      <a
                        key={i}
                        href={src.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1 truncate block"
                      >
                        <ExternalLink className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate">{src.title}</span>
                      </a>
                    ))}
                  </div>
                )}
              </div>

              {/* Message metadata & TTS Voice Trigger */}
              <div className="flex items-center gap-2 mt-1 px-1 text-[10px] text-stone-400">
                <span>{msg.timestamp}</span>
                {msg.sender === 'assistant' && (
                  <button
                    onClick={() => handlePlayVoice(msg)}
                    className="flex items-center gap-1 hover:text-[#4D6A34] transition-colors"
                    title={t.common.speak}
                  >
                    {playingAudioId === msg.id ? (
                      <>
                        <VolumeX className="w-3 h-3 text-[#4D6A34] animate-pulse" />
                        <span className="text-[#4D6A34] font-bold">{t.common.speaking}</span>
                      </>
                    ) : (
                      <>
                        <Volume2 className="w-3 h-3" />
                        <span>{t.common.speak}</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex items-center gap-2 text-xs text-stone-400 italic py-2">
              <Loader2 className="w-4 h-4 animate-spin text-[#4D6A34]" />
              <span>{language === 'ar' ? 'المدرب يراجع سجلاتك ويبحث في المراجع...' : 'AI Coach is checking your logs and references...'}</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Prompts Suggestions */}
        <div className="px-3 py-1.5 border-t border-stone-200 dark:border-stone-800 flex gap-1.5 overflow-x-auto text-[10px]">
          <button
            onClick={() => handleSendMessage(t.coach.suggestMeal)}
            className="px-2.5 py-1 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 whitespace-nowrap hover:bg-[#EBF2E8] hover:text-[#4D6A34]"
          >
            🥗 {t.coach.suggestMeal}
          </button>
          <button
            onClick={() => handleSendMessage(t.coach.whatsToday)}
            className="px-2.5 py-1 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 whitespace-nowrap hover:bg-[#EBF2E8] hover:text-[#4D6A34]"
          >
            📊 {t.coach.whatsToday}
          </button>
          <button
            onClick={() => handleSendMessage(t.coach.substitutePrompt)}
            className="px-2.5 py-1 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 whitespace-nowrap hover:bg-[#EBF2E8] hover:text-[#4D6A34]"
          >
            🔄 {t.coach.substitutePrompt}
          </button>
        </div>

        {/* Chat Input Bar */}
        <div className="p-3 border-t border-stone-200 dark:border-stone-800 bg-white dark:bg-[#1a2217]">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder={t.coach.placeholder}
              className="flex-1 px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-xs focus:outline-none focus:ring-2 focus:ring-[#4D6A34]"
            />
            <button
              type="submit"
              disabled={!inputMessage.trim() || isLoading}
              className="p-2.5 rounded-xl bg-[#4D6A34] hover:bg-[#3B5323] text-white disabled:opacity-50 transition-all"
              title={t.coach.send}
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

          <p className="text-[9px] text-stone-400 mt-2 text-center leading-tight">
            {t.coach.disclaimer}
          </p>
        </div>
      </div>
    </div>
  );
};
