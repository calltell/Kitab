import React from 'react';
import { Loader2, FileUp, Download, Trash2, Search, CheckCircle2, X } from 'lucide-react';
import { OperationProgressState, AppLanguage } from '../types';
import { formatDigits } from '../utils/i18n';

interface ProgressModalProps {
  progress: OperationProgressState;
  onClose?: () => void;
  appLanguage?: AppLanguage;
}

export const ProgressModal: React.FC<ProgressModalProps> = ({
  progress,
  onClose,
  appLanguage = 'fa',
}) => {
  if (!progress.isOpen) return null;

  const renderIcon = () => {
    switch (progress.type) {
      case 'import':
        return <FileUp className="w-5 h-5 text-amber-600 animate-bounce" />;
      case 'export':
        return <Download className="w-5 h-5 text-emerald-600 animate-pulse" />;
      case 'delete':
        return <Trash2 className="w-5 h-5 text-rose-600 animate-pulse" />;
      case 'search':
        return <Search className="w-5 h-5 text-indigo-600 animate-spin" />;
      default:
        return <Loader2 className="w-5 h-5 text-amber-600 animate-spin" />;
    }
  };

  const isComplete = progress.percentage >= 100;

  const statusMsg = progress.statusText || (
    appLanguage === 'ar'
      ? 'جاري تنفيذ العملية...'
      : appLanguage === 'en'
      ? 'Processing...'
      : 'در حال انجام عملیات...'
  );

  const closeText = (
    appLanguage === 'ar'
      ? 'إغلاق'
      : appLanguage === 'en'
      ? 'Close'
      : 'بستن'
  );

  return (
    <div className="fixed bottom-20 right-4 left-4 sm:left-auto sm:right-6 sm:w-96 z-40 animate-slideUp pointer-events-auto">
      <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xl text-right dir-rtl relative overflow-hidden transition-all">

        <div className="flex items-center justify-between gap-3 mb-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200/60 dark:border-amber-800/60 flex items-center justify-center shrink-0 shadow-xs">
              {isComplete ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : renderIcon()}
            </div>
            <div className="flex flex-col min-w-0">
              <h3 className="font-bold text-xs text-slate-900 dark:text-slate-100 truncate">
                {progress.title}
              </h3>
              {progress.subtitle && (
                <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                  {progress.subtitle}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="font-mono font-bold text-xs text-amber-600 dark:text-amber-400 dir-ltr bg-amber-50 dark:bg-amber-950/80 px-2 py-0.5 rounded-md border border-amber-200/50 dark:border-amber-800/50">
              {formatDigits(Math.round(progress.percentage), appLanguage)}%
            </span>
            {onClose && (
              <button
                onClick={onClose}
                className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-500 transition-colors"
                title={closeText}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Progress Bar Container */}
        <div className="mt-2">
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
            <span className="truncate">{statusMsg}</span>
            {progress.totalSteps > 0 && (
              <span className="font-mono text-[10px] text-slate-400 dir-ltr shrink-0">
                {formatDigits(progress.currentStep, appLanguage)} / {formatDigits(progress.totalSteps, appLanguage)}
              </span>
            )}
          </div>

          <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-200 dark:border-slate-700">
            <div
              className="h-full bg-amber-600 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${Math.min(100, Math.max(0, progress.percentage))}%` }}
            />
          </div>
        </div>

        {progress.details && (
          <div className="bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg border border-slate-100 dark:border-slate-800 text-[10px] text-slate-500 dark:text-slate-400 mt-2 font-mono truncate text-left dir-ltr">
            {progress.details}
          </div>
        )}
      </div>
    </div>
  );
};
