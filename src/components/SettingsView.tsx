import React, { useState } from 'react';
import {
  UserProfile,
  Language,
  ThemeMode,
  ThemePreference,
  HabitReminder,
} from '../types/index.ts';
import { translations } from '../data/translations.ts';
import {
  exportAllDataJson,
  importAllDataJson,
  clearAllData,
} from '../utils/storage.ts';
import {
  Globe,
  Moon,
  Sun,
  Monitor,
  User,
  Bell,
  Download,
  Upload,
  Trash2,
  Shield,
  Smartphone,
  Check,
  AlertTriangle,
  Info,
} from 'lucide-react';

interface SettingsViewProps {
  profile: UserProfile;
  reminders: HabitReminder[];
  onUpdateProfile: (profile: UserProfile) => void;
  onUpdateReminders: (reminders: HabitReminder[]) => void;
  onOpenEditProfile: () => void;
  onToggleLanguage: () => void;
  onToggleTheme: () => void;
  onSetThemePreference?: (pref: ThemePreference) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  profile,
  reminders,
  onUpdateProfile,
  onUpdateReminders,
  onOpenEditProfile,
  onToggleLanguage,
  onToggleTheme,
  onSetThemePreference,
}) => {
  const language = profile.language;
  const t = translations[language];

  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState<boolean>(false);

  const handleExportData = () => {
    const json = exportAllDataJson();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fitora-ai-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const success = importAllDataJson(content);
      if (success) {
        setImportStatus(language === 'ar' ? 'تم استيراد البيانات بنجاح! جاري التحديث...' : 'Data imported successfully! Reloading...');
        setTimeout(() => window.location.reload(), 1000);
      } else {
        setImportStatus(language === 'ar' ? 'فشل استيراد الملف. تأكد من صحة تنسيق JSON.' : 'Failed to import. Invalid JSON file format.');
      }
    };
    reader.readAsText(file);
  };

  const toggleReminder = (id: string) => {
    const updated = reminders.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r));
    onUpdateReminders(updated);
  };

  const updateReminderTime = (id: string, time: string) => {
    const updated = reminders.map((r) => (r.id === id ? { ...r, time } : r));
    onUpdateReminders(updated);
  };

  return (
    <div className="space-y-6 pb-24 max-w-4xl mx-auto px-4 pt-4">
      {/* Profile Overview Card */}
      <div className="bg-white dark:bg-[#1a2217] rounded-2xl p-5 border border-stone-200 dark:border-stone-800 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#3B5323] to-[#6E9447] text-white flex items-center justify-center font-black text-xl shadow-xs">
            {profile.name?.charAt(0) || 'F'}
          </div>
          <div>
            <h3 className="font-bold text-sm text-stone-900 dark:text-stone-100">{profile.name}</h3>
            <p className="text-[11px] text-stone-400">
              {profile.age} yo • {profile.weightKg} kg • {profile.heightCm} cm • Goal: {profile.primaryGoal}
            </p>
          </div>
        </div>

        <button
          onClick={onOpenEditProfile}
          className="px-3.5 py-1.5 rounded-xl border border-stone-300 dark:border-stone-700 hover:border-[#4D6A34] text-xs font-bold transition-colors"
        >
          {t.common.edit}
        </button>
      </div>

      {/* Language & Appearance */}
      <div className="bg-white dark:bg-[#1a2217] rounded-2xl p-5 border border-stone-200 dark:border-stone-800 shadow-xs space-y-4">
        <h4 className="text-xs font-bold text-stone-900 dark:text-stone-100 uppercase tracking-wider">
          {language === 'ar' ? 'التفضيلات العامة والمظهر' : 'General & Appearance'}
        </h4>

        {/* Language switch */}
        <div className="flex items-center justify-between py-2 border-b border-stone-100 dark:border-stone-800">
          <div className="flex items-center gap-2.5">
            <Globe className="w-4 h-4 text-[#4D6A34] dark:text-[#85A947]" />
            <div>
              <span className="text-xs font-bold block">{t.settings.language}</span>
              <span className="text-[11px] text-stone-400">
                {language === 'ar' ? 'اللغة الحالية: العربية (RTL)' : 'Current Language: English (LTR)'}
              </span>
            </div>
          </div>
          <button
            onClick={onToggleLanguage}
            className="px-3 py-1.5 rounded-xl bg-stone-100 dark:bg-stone-800 text-xs font-bold hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors"
          >
            {language === 'ar' ? 'Switch to English' : 'التحويل للعربية'}
          </button>
        </div>

        {/* Theme mode switch */}
        <div className="py-2.5 border-b border-stone-100 dark:border-stone-800 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              {profile.theme === 'light' ? (
                <Sun className="w-4 h-4 text-amber-500" />
              ) : (
                <Moon className="w-4 h-4 text-sky-400" />
              )}
              <div>
                <span className="text-xs font-bold block">{t.settings.theme}</span>
                <span className="text-[11px] text-stone-400">
                  {profile.themePreference === 'system' || !profile.themePreference
                    ? (language === 'ar' ? 'تلقائي مع إعدادات نظام الجهاز' : 'System Default (Matches OS)')
                    : profile.theme === 'light' ? t.settings.lightMode : t.settings.darkMode}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-1">
            <button
              onClick={() => onSetThemePreference ? onSetThemePreference('light') : onToggleTheme()}
              className={`py-2 px-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                profile.themePreference === 'light'
                  ? 'bg-amber-500/10 border-amber-500 text-amber-800 dark:text-amber-300 shadow-xs ring-1 ring-amber-500/30'
                  : 'border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800'
              }`}
            >
              <Sun className="w-3.5 h-3.5 text-amber-500" />
              <span>{language === 'ar' ? 'فاتح' : 'Light'}</span>
            </button>

            <button
              onClick={() => onSetThemePreference ? onSetThemePreference('dark') : onToggleTheme()}
              className={`py-2 px-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                profile.themePreference === 'dark'
                  ? 'bg-[#4D6A34]/15 border-[#4D6A34] text-[#4D6A34] dark:text-[#85A947] shadow-xs ring-1 ring-[#4D6A34]/30'
                  : 'border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800'
              }`}
            >
              <Moon className="w-3.5 h-3.5 text-sky-400" />
              <span>{language === 'ar' ? 'داكن' : 'Dark'}</span>
            </button>

            <button
              onClick={() => onSetThemePreference ? onSetThemePreference('system') : onToggleTheme()}
              className={`py-2 px-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                (!profile.themePreference || profile.themePreference === 'system')
                  ? 'bg-blue-500/10 border-blue-500 text-blue-700 dark:text-blue-300 shadow-xs ring-1 ring-blue-500/30'
                  : 'border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800'
              }`}
            >
              <Monitor className="w-3.5 h-3.5 text-blue-500" />
              <span>{language === 'ar' ? 'تلقائي' : 'System'}</span>
            </button>
          </div>
        </div>

        {/* Unit system switch */}
        <div className="flex items-center justify-between py-2">
          <div>
            <span className="text-xs font-bold block">{t.settings.units}</span>
            <span className="text-[11px] text-stone-400">
              {profile.preferredUnits === 'metric' ? t.onboarding.metric : t.onboarding.imperial}
            </span>
          </div>
          <div className="flex gap-1.5 text-xs">
            <button
              onClick={() => onUpdateProfile({ ...profile, preferredUnits: 'metric' })}
              className={`px-3 py-1 rounded-lg font-bold ${
                profile.preferredUnits === 'metric'
                  ? 'bg-[#4D6A34] text-white'
                  : 'bg-stone-100 dark:bg-stone-800 text-stone-500'
              }`}
            >
              Metric
            </button>
            <button
              onClick={() => onUpdateProfile({ ...profile, preferredUnits: 'imperial' })}
              className={`px-3 py-1 rounded-lg font-bold ${
                profile.preferredUnits === 'imperial'
                  ? 'bg-[#4D6A34] text-white'
                  : 'bg-stone-100 dark:bg-stone-800 text-stone-500'
              }`}
            >
              Imperial
            </button>
          </div>
        </div>
      </div>

      {/* Calorie Burn Behavior Toggle */}
      <div className="bg-white dark:bg-[#1a2217] rounded-2xl p-5 border border-stone-200 dark:border-stone-800 shadow-xs space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h4 className="text-xs font-bold text-stone-900 dark:text-stone-100">
              {t.settings.calorieAdjustment}
            </h4>
            <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5 leading-relaxed">
              {t.settings.calorieAdjustmentHint}
            </p>
          </div>
          <input
            type="checkbox"
            checked={profile.addBurnedCaloriesToBudget}
            onChange={(e) =>
              onUpdateProfile({ ...profile, addBurnedCaloriesToBudget: e.target.checked })
            }
            className="w-4 h-4 text-[#4D6A34] rounded mt-1"
          />
        </div>
      </div>

      {/* Daily Reminders Management */}
      <div className="bg-white dark:bg-[#1a2217] rounded-2xl p-5 border border-stone-200 dark:border-stone-800 shadow-xs space-y-3">
        <h4 className="text-xs font-bold text-stone-900 dark:text-stone-100 uppercase tracking-wider flex items-center gap-1.5">
          <Bell className="w-4 h-4 text-[#4D6A34]" />
          <span>{t.settings.remindersTitle}</span>
        </h4>

        <div className="space-y-2 text-xs">
          {reminders.map((rem) => (
            <div
              key={rem.id}
              className="p-3 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800/40 flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-2.5">
                <input
                  type="checkbox"
                  checked={rem.enabled}
                  onChange={() => toggleReminder(rem.id)}
                  className="rounded text-[#4D6A34]"
                />
                <div>
                  <span className="font-bold block">
                    {language === 'ar' ? rem.titleAr : rem.titleEn}
                  </span>
                  <span className="text-[10px] text-stone-400">
                    {language === 'ar' ? rem.messageAr : rem.messageEn}
                  </span>
                </div>
              </div>

              <input
                type="time"
                value={rem.time}
                onChange={(e) => updateReminderTime(rem.id, e.target.value)}
                className="px-2 py-1 rounded border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-xs font-mono"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Android APK & Offline Guidance Card */}
      <div className="bg-stone-900 text-white rounded-2xl p-5 shadow-sm space-y-2">
        <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold">
          <Smartphone className="w-4 h-4" />
          <span>{t.settings.androidApkTitle}</span>
        </div>
        <p className="text-xs text-stone-300 leading-relaxed">
          {t.settings.androidApkBody}
        </p>
        <div className="bg-black/40 p-2.5 rounded-xl font-mono text-[11px] text-emerald-300 overflow-x-auto">
          npx @bubblewrap/cli init --manifest=http://localhost:3000/manifest.json
        </div>
      </div>

      {/* Privacy and Local Storage Statement */}
      <div className="bg-white dark:bg-[#1a2217] rounded-2xl p-5 border border-stone-200 dark:border-stone-800 shadow-xs space-y-2 text-xs">
        <div className="flex items-center gap-2 text-[#4D6A34] dark:text-[#85A947] font-bold">
          <Shield className="w-4 h-4" />
          <span>{t.settings.privacyStatementTitle}</span>
        </div>
        <p className="text-stone-600 dark:text-stone-300 leading-relaxed text-[11px]">
          {t.settings.privacyStatementBody}
        </p>
      </div>

      {/* Data Export / Import / Clear */}
      <div className="bg-white dark:bg-[#1a2217] rounded-2xl p-5 border border-stone-200 dark:border-stone-800 shadow-xs space-y-3">
        <h4 className="text-xs font-bold text-stone-900 dark:text-stone-100 uppercase tracking-wider">
          {t.settings.dataTitle}
        </h4>

        <div className="flex flex-wrap items-center gap-2.5 text-xs">
          <button
            onClick={handleExportData}
            className="px-3.5 py-2 rounded-xl border border-stone-300 dark:border-stone-700 font-bold flex items-center gap-1.5 hover:bg-stone-50 dark:hover:bg-stone-800"
          >
            <Download className="w-3.5 h-3.5 text-[#4D6A34]" />
            <span>{t.settings.exportData}</span>
          </button>

          <label className="px-3.5 py-2 rounded-xl border border-stone-300 dark:border-stone-700 font-bold flex items-center gap-1.5 hover:bg-stone-50 dark:hover:bg-stone-800 cursor-pointer">
            <Upload className="w-3.5 h-3.5 text-sky-600" />
            <span>{t.settings.importData}</span>
            <input type="file" accept=".json" onChange={handleImportFile} className="hidden" />
          </label>

          <button
            onClick={() => setShowClearConfirm(true)}
            className="px-3.5 py-2 rounded-xl border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 font-bold flex items-center gap-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/40"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{t.settings.clearData}</span>
          </button>
        </div>

        {importStatus && (
          <p className="text-xs text-stone-500 italic mt-1">{importStatus}</p>
        )}
      </div>

      {/* Clear Confirmation Dialog */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/70 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-[#1a2217] rounded-2xl p-5 max-w-sm w-full border border-stone-200 dark:border-stone-800 text-stone-900 dark:text-stone-100 space-y-3">
            <h4 className="font-bold text-sm text-rose-600 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4" />
              <span>{t.settings.clearData}</span>
            </h4>
            <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
              {t.settings.clearConfirm}
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="px-3 py-1.5 rounded-lg border text-xs"
              >
                {t.common.cancel}
              </button>
              <button
                onClick={() => {
                  clearAllData();
                  window.location.reload();
                }}
                className="px-4 py-1.5 rounded-lg bg-rose-600 text-white font-bold text-xs"
              >
                {t.common.delete}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
