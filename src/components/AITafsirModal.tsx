import React from 'react';
import { X, Sparkles, BookMarked, CheckCircle } from 'lucide-react';
import { AITafsirResult } from '../types';

interface AITafsirModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: AITafsirResult | null;
  loading: boolean;
  selectedText: string;
}

export const AITafsirModal: React.FC<AITafsirModalProps> = ({
  isOpen,
  onClose,
  result,
  loading,
  selectedText,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg p-5 shadow-2xl max-h-[85vh] overflow-y-auto flex flex-col gap-4 text-slate-900 dark:text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2 font-bold text-sm text-emerald-600 dark:text-emerald-400">
            <BookMarked className="w-5 h-5" />
            <span>تفسیر، شرح و مفردات عبارت</span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center gap-3 text-emerald-600">
            <Sparkles className="w-8 h-8 animate-spin" />
            <span className="text-xs font-bold">
              در حال نگارش ترجمه روان و شرح تفسیر...
            </span>
          </div>
        ) : result ? (
          <div className="flex flex-col gap-3 text-xs leading-relaxed animate-fadeIn">
            <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 font-serif italic border border-slate-200/80 dark:border-slate-700/80">
              "{selectedText}"
            </div>

            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
              <span className="font-bold text-emerald-800 dark:text-emerald-200 block mb-1">
                ترجمه روان فارسی:
              </span>
              <span className="font-medium">{result.translation}</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
              <span className="font-bold text-amber-600 block mb-1">
                شرح و پیام اصلی:
              </span>
              <span>{result.tafsir}</span>
            </div>

            {result.difficultWords && result.difficultWords.length > 0 && (
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                <span className="font-bold text-slate-500 block mb-2">
                  شرح واژگان دشوار (مفردات):
                </span>
                <div className="grid grid-cols-1 gap-1.5">
                  {result.difficultWords.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 p-1.5 bg-white dark:bg-slate-900 rounded-lg"
                    >
                      <span className="font-bold text-amber-600">
                        {item.word}:
                      </span>
                      <span>{item.meaning}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="py-8 text-center text-slate-400">
            اطلاعاتی دریافت نشد.
          </div>
        )}
      </div>
    </div>
  );
};
