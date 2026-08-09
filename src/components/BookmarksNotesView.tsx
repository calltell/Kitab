import React, { useState } from 'react';
import {
  Bookmark,
  Highlighter,
  Trash2,
  BookOpen,
  Search,
  Tag,
  Clock,
  Image as ImageIcon,
} from 'lucide-react';
import { HighlightBookmark, AppLanguage } from '../types';
import { QuoteImageModal } from './QuoteImageModal';
import { translations, formatDigits } from '../utils/i18n';

interface BookmarksNotesViewProps {
  bookmarks: HighlightBookmark[];
  onOpenReader: (bookId: number, matchPos?: number) => void;
  onDeleteBookmark: (id: string) => void;
  appLanguage?: AppLanguage;
}

export const BookmarksNotesView: React.FC<BookmarksNotesViewProps> = ({
  bookmarks,
  onOpenReader,
  onDeleteBookmark,
  appLanguage = 'fa',
}) => {
  const t = translations[appLanguage]?.bookmarksView || translations.fa.bookmarksView;

  const [filterColor, setFilterColor] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [pendingDeleteBookmarkId, setPendingDeleteBookmarkId] = useState<string | null>(null);
  const [activeQuoteItem, setActiveQuoteItem] = useState<{ text: string; bookTitle: string } | null>(
    null
  );

  const filtered = bookmarks.filter((b) => {
    const matchesColor = filterColor === 'ALL' || b.color === filterColor;
    const matchesSearch =
      !searchQuery ||
      b.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.fileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (b.note && b.note.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesColor && matchesSearch;
  });

  const getColorClass = (color: string) => {
    switch (color) {
      case 'green':
        return 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200';
      case 'blue':
        return 'bg-sky-50 dark:bg-sky-950/30 border-sky-300 dark:border-sky-800 text-sky-900 dark:text-sky-200';
      case 'pink':
        return 'bg-pink-50 dark:bg-pink-950/30 border-pink-300 dark:border-pink-800 text-pink-900 dark:text-pink-200';
      default:
        return 'bg-amber-50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200';
    }
  };

  return (
    <div className="flex flex-col gap-4 pb-24 max-w-4xl mx-auto px-4 pt-3">
      {/* Search & Color Filter Header */}
      <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute right-3 top-2.5 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t.searchPlaceholder}
            className="w-full pr-9 pl-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none"
          />
        </div>

        {/* Color Filter Chips */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setFilterColor('ALL')}
            className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
              filterColor === 'ALL'
                ? 'bg-amber-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            {t.allColor} ({formatDigits(bookmarks.length, appLanguage)})
          </button>

          {(['yellow', 'green', 'blue', 'pink'] as const).map((clr) => (
            <button
              key={clr}
              onClick={() => setFilterColor(clr)}
              className={`w-6 h-6 rounded-full border-2 transition-transform ${
                filterColor === clr ? 'scale-110 border-slate-900 dark:border-white' : 'border-transparent'
              } ${
                clr === 'yellow'
                  ? 'bg-yellow-300'
                  : clr === 'green'
                  ? 'bg-emerald-300'
                  : clr === 'blue'
                  ? 'bg-sky-300'
                  : 'bg-pink-300'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Bookmarks Cards Grid */}
      {filtered.length > 0 ? (
        <div className="flex flex-col gap-3">
          {filtered.map((b, idx) => (
            <div
              key={`${b.id}-${idx}`}
              onClick={() => onOpenReader(b.fileId, b.startPos)}
              className={`p-4 rounded-2xl border ${getColorClass(
                b.color
              )} shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col gap-2 relative group`}
            >
              <div className="flex items-center justify-between gap-2 border-b border-black/10 dark:border-white/10 pb-2">
                <div className="flex items-center gap-2 font-bold text-xs truncate">
                  <BookOpen className="w-4 h-4 shrink-0" />
                  <span className="truncate">{b.fileName}</span>
                </div>

                <div
                  className="flex items-center gap-2 shrink-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  <span className="text-[10px] text-slate-500 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(b.createdAt).toLocaleDateString(appLanguage === 'fa' ? 'fa-IR' : appLanguage === 'ar' ? 'ar-EG' : 'en-US')}
                  </span>
                  <button
                    onClick={() => setActiveQuoteItem({ text: b.text, bookTitle: b.fileName })}
                    className="p-1 text-amber-600 hover:bg-amber-100 dark:hover:bg-amber-950/40 rounded-lg transition-colors flex items-center gap-1 text-[11px] font-bold"
                    title={t.quoteCard}
                  >
                    <ImageIcon className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">{t.quoteCard}</span>
                  </button>
                  <button
                    onClick={() => setPendingDeleteBookmarkId(b.id)}
                    className="p-1 text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-950/40 rounded-lg cursor-pointer"
                    title={t.deleteBookmark}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Highlighted Text */}
              <div className="text-xs font-serif leading-relaxed italic bg-white/40 dark:bg-black/20 p-2.5 rounded-xl border border-black/5 dark:border-white/5">
                "{b.text}"
              </div>

              {/* User Note if available */}
              {b.note && (
                <div className="text-xs font-bold text-slate-800 dark:text-slate-200 bg-white/60 dark:bg-slate-900/60 p-2 rounded-xl flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>{t.noteLabel} {b.note}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center text-slate-400">
          <Bookmark className="w-12 h-12 mb-2 text-slate-300 dark:text-slate-700" />
          <p className="text-sm font-medium">{t.noBookmarksFound}</p>
          <p className="text-xs text-slate-400 mt-1">
            {t.noBookmarksTip}
          </p>
        </div>
      )}
      {/* Quote Image Modal */}
      {activeQuoteItem && (
        <QuoteImageModal
          isOpen={!!activeQuoteItem}
          onClose={() => setActiveQuoteItem(null)}
          quoteText={activeQuoteItem.text}
          bookTitle={activeQuoteItem.bookTitle}
        />
      )}

      {/* Modal: Delete Bookmark Confirmation */}
      {pendingDeleteBookmarkId && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl text-right">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center mb-4">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 mb-2">
              {t.deleteConfirmTitle}
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 mb-6 leading-relaxed">
              {t.deleteConfirmDesc}
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  onDeleteBookmark(pendingDeleteBookmarkId);
                  setPendingDeleteBookmarkId(null);
                }}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer"
              >
                {t.deleteBookmark}
              </button>
              <button
                onClick={() => setPendingDeleteBookmarkId(null)}
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
