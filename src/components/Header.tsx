import React from 'react';
import { BookOpen, Moon, Sun } from 'lucide-react';
import { AppLanguage } from '../types';
import { translations, formatDigits } from '../utils/i18n';

interface HeaderProps {
  title?: string;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  bookCount?: number;
  appLanguage?: AppLanguage;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  theme,
  onToggleTheme,
  bookCount = 0,
  appLanguage = 'fa',
}) => {
  const t = translations[appLanguage] || translations.fa;
  const displayTitle = title || t.appTitle;

  return (
    <header className="sticky top-0 z-30 h-[52px] bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 flex items-center transition-colors duration-200">
      <div className="w-full max-w-5xl mx-auto flex items-center justify-between">
        {/* Title & App Branding */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-600 dark:bg-amber-700 flex items-center justify-center text-white shadow-sm">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span>{displayTitle}</span>
              {bookCount > 0 && (
                <span className="text-[10px] font-semibold bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-200 px-2 py-0.5 rounded-full border border-amber-200/60 dark:border-amber-800/60">
                  {formatDigits(bookCount, appLanguage)} {t.settings.booksCount}
                </span>
              )}
            </h1>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium hidden sm:block">
              {t.appSubtitle}
            </p>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleTheme}
            className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center transition-colors border border-slate-200/60 dark:border-slate-700/60 active:scale-95"
            title="Theme"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-slate-600" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
};

