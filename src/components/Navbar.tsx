import React from 'react';
import { Home, Utensils, Dumbbell, TrendingUp, Settings, Sun, Moon, Globe, Bot } from 'lucide-react';
import { Language, ThemeMode } from '../types/index.ts';
import { translations } from '../data/translations.ts';

interface NavbarProps {
  activeTab: 'home' | 'nutrition' | 'workouts' | 'progress' | 'settings';
  onSelectTab: (tab: 'home' | 'nutrition' | 'workouts' | 'progress' | 'settings') => void;
  language: Language;
  onToggleLanguage: () => void;
  theme: ThemeMode;
  onToggleTheme: () => void;
  onOpenCoach: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onSelectTab,
  language,
  onToggleLanguage,
  theme,
  onToggleTheme,
  onOpenCoach,
}) => {
  const t = translations[language];

  return (
    <>
      {/* Top Header Bar */}
      <header className="sticky top-0 z-30 bg-white/90 dark:bg-[#1a2217]/90 backdrop-blur-md border-b border-stone-200 dark:border-stone-800 transition-colors">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          {/* Logo & Brand */}
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => onSelectTab('home')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#3B5323] to-[#6E9447] flex items-center justify-center text-white shadow-md shadow-[#4D6A34]/20">
              <span className="font-extrabold text-xl tracking-tighter">F</span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-lg text-stone-900 dark:text-stone-50 tracking-tight">Fitora</span>
                <span className="text-xs px-1.5 py-0.5 rounded font-bold bg-[#EBF2E8] dark:bg-[#283620] text-[#4D6A34] dark:text-[#85A947]">AI</span>
              </div>
              <p className="text-[11px] text-stone-500 dark:text-stone-400 hidden sm:block truncate max-w-xs">
                {t.appSlogan}
              </p>
            </div>
          </div>

          {/* Quick Header Controls */}
          <div className="flex items-center gap-2">
            {/* AI Coach Floating Button */}
            <button
              onClick={onOpenCoach}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-[#4D6A34] hover:bg-[#3B5323] text-white shadow-sm transition-all hover:scale-105 active:scale-95"
              title="Open Fitora AI Coach"
            >
              <Bot className="w-4 h-4" />
              <span className="hidden sm:inline">{language === 'ar' ? 'المدرب الذكي' : 'AI Coach'}</span>
            </button>

            {/* Language Switcher */}
            <button
              onClick={onToggleLanguage}
              className="p-2 rounded-lg text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors flex items-center gap-1 text-xs font-bold"
              aria-label="Toggle language"
              title="Switch language between English and Arabic"
            >
              <Globe className="w-4 h-4 text-[#4D6A34] dark:text-[#85A947]" />
              <span>{language === 'en' ? 'عربي' : 'EN'}</span>
            </button>

            {/* Theme Switcher */}
            <button
              onClick={onToggleTheme}
              className="p-2 rounded-lg text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
              aria-label="Toggle light and dark mode"
              title="Toggle theme"
            >
              {theme === 'light' ? (
                <Moon className="w-4 h-4 text-stone-700" />
              ) : (
                <Sun className="w-4 h-4 text-amber-400" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Bottom Navigation for Mobile & Responsive Bar */}
      <nav 
        aria-label="Main Navigation"
        className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 dark:bg-[#1a2217]/95 backdrop-blur-md border-t border-stone-200 dark:border-stone-800 pb-safe md:top-16 md:bottom-auto md:border-b md:border-t-0 md:bg-white dark:md:bg-[#151b13]"
      >
        <div className="max-w-md md:max-w-2xl mx-auto flex items-center justify-around h-16 px-2">
          <button
            onClick={() => onSelectTab('home')}
            className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${
              activeTab === 'home'
                ? 'text-[#4D6A34] dark:text-[#85A947] font-bold scale-105'
                : 'text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200'
            }`}
          >
            <Home className="w-5 h-5 mb-0.5" />
            <span className="text-[11px]">{t.nav.home}</span>
          </button>

          <button
            onClick={() => onSelectTab('nutrition')}
            className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${
              activeTab === 'nutrition'
                ? 'text-[#4D6A34] dark:text-[#85A947] font-bold scale-105'
                : 'text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200'
            }`}
          >
            <Utensils className="w-5 h-5 mb-0.5" />
            <span className="text-[11px]">{t.nav.nutrition}</span>
          </button>

          <button
            onClick={() => onSelectTab('workouts')}
            className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${
              activeTab === 'workouts'
                ? 'text-[#4D6A34] dark:text-[#85A947] font-bold scale-105'
                : 'text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200'
            }`}
          >
            <Dumbbell className="w-5 h-5 mb-0.5" />
            <span className="text-[11px]">{t.nav.workouts}</span>
          </button>

          <button
            onClick={() => onSelectTab('progress')}
            className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${
              activeTab === 'progress'
                ? 'text-[#4D6A34] dark:text-[#85A947] font-bold scale-105'
                : 'text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200'
            }`}
          >
            <TrendingUp className="w-5 h-5 mb-0.5" />
            <span className="text-[11px]">{t.nav.progress}</span>
          </button>

          <button
            onClick={() => onSelectTab('settings')}
            className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${
              activeTab === 'settings'
                ? 'text-[#4D6A34] dark:text-[#85A947] font-bold scale-105'
                : 'text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200'
            }`}
          >
            <Settings className="w-5 h-5 mb-0.5" />
            <span className="text-[11px]">{t.nav.settings}</span>
          </button>
        </div>
      </nav>
    </>
  );
};
