import React, { useState } from 'react';
import { History, Trash2, Clock, BookOpen, ArrowLeft } from 'lucide-react';
import { HistoryItem, AppLanguage } from '../types';
import { translations } from '../utils/i18n';

interface HistoryViewProps {
  historyItems: HistoryItem[];
  onOpenReader: (fileId: number, pageIndex?: number) => void;
  onClearHistory: () => void;
  appLanguage?: AppLanguage;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  historyItems,
  onOpenReader,
  onClearHistory,
  appLanguage = 'fa',
}) => {
  const t = translations[appLanguage]?.historyView || translations.fa.historyView;
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  return (
    <div className="flex flex-col gap-4 pb-24 max-w-4xl mx-auto px-4 pt-3">
      {/* Header */}
      <div className="flex items-center justify-between px-2">
        <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <History className="w-4 h-4 text-amber-600" />
          <span>{t.title}</span>
        </h3>

        {historyItems.length > 0 && (
          <button
            onClick={() => setShowClearConfirm(true)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-100 text-xs font-bold transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{t.clearHistory}</span>
          </button>
        )}
      </div>

      {/* History List */}
      {historyItems.length > 0 ? (
        <div className="flex flex-col gap-2.5">
          {historyItems.map((item, idx) => {
            const dateStr = new Date(item.timestamp).toLocaleTimeString(
              appLanguage === 'fa' ? 'fa-IR' : appLanguage === 'ar' ? 'ar-EG' : 'en-US',
              {
                hour: '2-digit',
                minute: '2-digit',
                day: 'numeric',
                month: 'short',
              }
            );

            return (
              <div
                key={`${item.id}-${idx}`}
                onClick={() => onOpenReader(item.fileId, item.pageIndex)}
                className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-amber-400 dark:hover:border-amber-500 shadow-xs hover:shadow-md transition-all cursor-pointer flex items-center justify-between gap-3 group"
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                    <BookOpen className="w-5 h-5" />
                  </div>

                  <div className="overflow-hidden">
                    <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100 truncate group-hover:text-amber-600 transition-colors">
                      {item.fileName}
                    </h4>
                    <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400">
                      <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-md font-semibold">
                        {item.fileCategory}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {dateStr}
                      </span>
                    </div>
                  </div>
                </div>

                <ArrowLeft className="w-4 h-4 text-slate-400 group-hover:text-amber-600 group-hover:-translate-x-1 transition-all shrink-0" />
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center text-slate-400">
          <History className="w-12 h-12 mb-2 text-slate-300 dark:text-slate-700" />
          <p className="text-sm font-medium">{t.noHistory}</p>
        </div>
      )}

      {/* Modal: Clear History Confirmation */}
      {showClearConfirm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl text-right">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center mb-4">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 mb-2">
              {t.clearConfirmTitle}
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 mb-6 leading-relaxed">
              {t.clearConfirmDesc}
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  onClearHistory();
                  setShowClearConfirm(false);
                }}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer"
              >
                {t.clearHistory}
              </button>
              <button
                onClick={() => setShowClearConfirm(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold text-xs transition-all cursor-pointer"
              >
                {t.cancel}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
