import React from 'react';
import { X, Sparkles, Layers, BookOpen, CheckCircle } from 'lucide-react';
import { AIWordAnalysis } from '../types';

interface AIWordModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: AIWordAnalysis | null;
  loading: boolean;
  word: string;
}

export const AIWordModal: React.FC<AIWordModalProps> = ({
  isOpen,
  onClose,
  result,
  loading,
  word,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg p-5 shadow-2xl max-h-[85vh] overflow-y-auto flex flex-col gap-4 text-slate-900 dark:text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2 font-bold text-sm text-amber-600 dark:text-amber-400">
            <Sparkles className="w-5 h-5" />
            <span>تحلیل صرفی و نحوی هوشمند کلمه: «{word}»</span>
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
          <div className="py-12 flex flex-col items-center justify-center gap-3 text-amber-600">
            <Sparkles className="w-8 h-8 animate-spin" />
            <span className="text-xs font-bold">
              در حال استخراج ریشه، وزن، باب و نقش نحوی...
            </span>
          </div>
        ) : result ? (
          <div className="flex flex-col gap-3 text-xs leading-relaxed animate-fadeIn">
            <div className="flex items-center justify-between p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800">
              <span className="font-bold text-sm text-amber-900 dark:text-amber-100">
                عبارت: {result.word}
              </span>
              <span className="bg-amber-200 dark:bg-amber-900 text-amber-950 dark:text-amber-100 font-bold px-2.5 py-0.5 rounded-md">
                ریشه: {result.root}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200/80 dark:border-slate-700/80">
                <span className="text-slate-400 font-bold block mb-0.5">
                  وزن / باب:
                </span>
                <span className="font-bold">{result.vazn || '-'}</span>
              </div>

              <div className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200/80 dark:border-slate-700/80">
                <span className="text-slate-400 font-bold block mb-0.5">
                  نوع کلمه:
                </span>
                <span className="font-bold">{result.type || '-'}</span>
              </div>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200/80 dark:border-slate-700/80">
              <span className="text-slate-400 font-bold block mb-1">
                معنای دقیق در سیاق:
              </span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">
                {result.meaning}
              </span>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200/80 dark:border-slate-700/80">
              <span className="font-bold text-amber-600 block mb-1">
                تحلیل صرفی کامل:
              </span>
              <span>{result.sarf}</span>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200/80 dark:border-slate-700/80">
              <span className="font-bold text-emerald-600 block mb-1">
                نقش نحوی و اعراب:
              </span>
              <span>{result.nahv}</span>
            </div>

            {result.synonyms && result.synonyms.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-bold text-slate-400">واژگان هم‌معنا:</span>
                {result.synonyms.map((syn, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-200 font-semibold"
                  >
                    {syn}
                  </span>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="py-8 text-center text-slate-400">
            اطلاعاتی استخراج نشد.
          </div>
        )}
      </div>
    </div>
  );
};
