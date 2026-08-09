import React, { useState, useEffect } from 'react';
import {
  Search,
  Library,
  Sparkles,
  Bookmark,
  History,
  Settings,
  X,
  Upload,
} from 'lucide-react';
import { AppLanguage } from '../types';
import { translations, formatDigits } from '../utils/i18n';

export type TabType =
  | 'search'
  | 'library'
  | 'bookmarks'
  | 'history'
  | 'settings';

interface BottomNavProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  bookmarksCount?: number;
  appLanguage?: AppLanguage;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onTabChange,
  bookmarksCount = 0,
  appLanguage = 'fa',
}) => {
  const t = translations[appLanguage] || translations.fa;
  const [showLibraryTooltip, setShowLibraryTooltip] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowLibraryTooltip(false);
    }, 10000); // 10 seconds auto-dismiss
    return () => clearTimeout(timer);
  }, []);

  const tooltipText =
    appLanguage === 'ar'
      ? 'أدخل الملفات من هنا'
      : appLanguage === 'en'
      ? 'Import files here'
      : 'اینجا فایل را وارد کنید';

  const tabs: { id: TabType; label: string; icon: React.ReactNode; badge?: number }[] =
    [
      { id: 'search', label: t.tabs.search, icon: <Search className="w-5 h-5" /> },
      { id: 'library', label: t.tabs.library, icon: <Library className="w-5 h-5" /> },
      {
        id: 'bookmarks',
        label: t.tabs.bookmarks,
        icon: <Bookmark className="w-5 h-5" />,
        badge: bookmarksCount,
      },
      { id: 'history', label: t.tabs.history, icon: <History className="w-5 h-5" /> },
      { id: 'settings', label: t.tabs.settings, icon: <Settings className="w-5 h-5" /> },
    ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg border-t border-slate-200/80 dark:border-slate-800 px-2 py-1.5 shadow-lg shadow-slate-900/10 transition-colors">
      <div className="max-w-2xl mx-auto flex justify-around items-center">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <div key={tab.id} className="relative flex flex-col items-center">
              {/* Floating Tooltip Callout for Library */}
              {tab.id === 'library' && showLibraryTooltip && (
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    onTabChange('library');
                    setShowLibraryTooltip(false);
                  }}
                  className="absolute bottom-full mb-3 right-1/2 translate-x-1/2 z-50 animate-bounce-short cursor-pointer group"
                >
                  <div className="relative bg-amber-600 dark:bg-amber-700 text-white text-xs font-bold py-2 px-3 rounded-2xl shadow-xl border border-amber-400/40 flex items-center justify-between gap-2.5 whitespace-nowrap min-w-[160px]">
                    <div className="flex items-center gap-1.5">
                      <Upload className="w-3.5 h-3.5 text-amber-200 animate-pulse" />
                      <span>{tooltipText}</span>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowLibraryTooltip(false);
                      }}
                      className="w-5 h-5 rounded-full bg-black/20 hover:bg-black/40 flex items-center justify-center text-white/90 transition-colors ml-1"
                      title="بستن"
                    >
                      <X className="w-3 h-3" />
                    </button>

                    {/* Down Arrow Indicator */}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-x-[6px] border-x-transparent border-t-[7px] border-t-amber-600 dark:border-t-amber-700" />

                    {/* 10s Timer bar */}
                    <div className="absolute bottom-0.5 left-2 right-2 h-0.5 bg-amber-900/30 rounded-full overflow-hidden">
                      <div className="h-full bg-amber-200 animate-timer-10s" />
                    </div>
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={() => {
                  if (tab.id === 'library') setShowLibraryTooltip(false);
                  onTabChange(tab.id);
                }}
                className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all duration-200 ${
                  isActive
                    ? 'text-amber-600 dark:text-amber-400 font-bold scale-105'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-medium'
                }`}
              >
                <div className="relative">
                  {tab.icon}
                  {tab.badge && tab.badge > 0 ? (
                    <span className="absolute -top-1.5 -left-2 bg-rose-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                      {tab.badge > 99 ? '99+' : formatDigits(tab.badge, appLanguage)}
                    </span>
                  ) : null}
                </div>
                <span className="text-[11px] mt-0.5 tracking-tight">{tab.label}</span>
                {isActive && (
                  <div className="w-1 h-1 rounded-full bg-amber-500 mt-0.5" />
                )}
              </button>
            </div>
          );
        })}
      </div>
    </nav>
  );
};

