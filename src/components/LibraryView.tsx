import React, { useState, useEffect } from 'react';
import {
  UploadCloud,
  FileText,
  Star,
  Trash2,
  FolderPlus,
  Sliders,
  CheckSquare,
  Square,
  Download,
  Search,
} from 'lucide-react';
import { BookFile, FilesSortMode, AppLanguage } from '../types';
import { formatBytes } from '../utils/textUtils';
import { translations, formatDigits } from '../utils/i18n';

interface LibraryViewProps {
  books: BookFile[];
  categories: string[];
  onUploadFiles: (files: File[]) => void;
  onOpenReader: (bookId: number) => void;
  onToggleStar: (bookId: number) => void;
  onDeleteBook: (bookId: number) => void;
  onBulkDelete: (bookIds: number[]) => void;
  onBulkChangeCategory: (bookIds: number[], newCategory: string) => void;
  appLanguage?: AppLanguage;
}

export const LibraryView: React.FC<LibraryViewProps> = ({
  books,
  categories,
  onUploadFiles,
  onOpenReader,
  onToggleStar,
  onDeleteBook,
  onBulkDelete,
  onBulkChangeCategory,
  appLanguage = 'fa',
}) => {
  const t = translations[appLanguage]?.libraryView || translations.fa.libraryView;

  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [sortMode, setSortMode] = useState<FilesSortMode>('DEFAULT');
  const [filterQuery, setFilterQuery] = useState('');
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [visibleCount, setVisibleCount] = useState<number>(20);

  // Reset pagination when category, sort, or search filter changes
  useEffect(() => {
    setVisibleCount(20);
  }, [selectedCategory, sortMode, filterQuery]);

  // Modal States
  const [pendingDeleteBook, setPendingDeleteBook] = useState<{ id: number; name: string } | null>(null);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [showBulkCatModal, setShowBulkCatModal] = useState(false);
  const [targetCategory, setTargetCategory] = useState<string>('');

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onUploadFiles(Array.from(e.target.files));
      e.target.value = '';
    }
  };

  // Filter books
  let filtered = books.filter((b) => {
    const matchesCat = selectedCategory === 'ALL' || b.category === selectedCategory;
    const matchesSearch =
      !filterQuery ||
      b.name.toLowerCase().includes(filterQuery.toLowerCase()) ||
      b.category.toLowerCase().includes(filterQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  // Sort books
  let sorted = [...filtered];
  if (sortMode === 'NAME_ASC') {
    sorted.sort((a, b) => a.name.localeCompare(b.name, 'fa'));
  } else if (sortMode === 'NAME_DESC') {
    sorted.sort((a, b) => b.name.localeCompare(a.name, 'fa'));
  } else if (sortMode === 'SIZE_DESC') {
    sorted.sort((a, b) => (b.size || 0) - (a.size || 0));
  } else if (sortMode === 'SIZE_ASC') {
    sorted.sort((a, b) => (a.size || 0) - (b.size || 0));
  } else if (sortMode === 'FAVORITE') {
    sorted.sort((a, b) => (b.isFavorite ? 1 : 0) - (a.isFavorite ? 1 : 0));
  } else if (sortMode === 'LAST_VIEWED') {
    sorted.sort((a, b) => (b.lastOpened || 0) - (a.lastOpened || 0));
  }

  const toggleSelectBook = (id: number) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === sorted.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(sorted.map((b) => b.id)));
    }
  };

  const confirmBulkDelete = () => {
    onBulkDelete(Array.from(selectedIds));
    setSelectedIds(new Set());
    setIsSelectionMode(false);
    setShowBulkDeleteConfirm(false);
  };

  const confirmBulkCatChange = () => {
    if (targetCategory) {
      onBulkChangeCategory(Array.from(selectedIds), targetCategory);
      setSelectedIds(new Set());
      setIsSelectionMode(false);
      setShowBulkCatModal(false);
      setTargetCategory('');
    }
  };

  const exportBackupJSON = () => {
    const dataStr = JSON.stringify(books, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Islamic_Library_Backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const totalBytes = sorted.reduce((acc, b) => acc + (b.size || 0), 0);

  return (
    <div className="flex flex-col gap-4 pb-24 max-w-5xl mx-auto px-4 pt-3">
      {/* Upload Drop Zone Card */}
      <div className="relative group border-2 border-dashed border-amber-500/50 hover:border-amber-600 dark:border-amber-500/40 dark:hover:border-amber-400 bg-amber-50/40 dark:bg-amber-950/20 rounded-2xl p-6 text-center cursor-pointer transition-all duration-200 shadow-sm">
        <input
          type="file"
          multiple
          accept=".txt,.TXT,text/plain,text/*"
          onChange={handleFileInput}
          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
        />
        <div className="flex flex-col items-center gap-2">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 flex items-center justify-center group-hover:scale-110 transition-transform">
            <UploadCloud className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
              {t.uploadTitle}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {t.uploadDesc}
            </p>
          </div>
        </div>
      </div>

      {/* Category Chips Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => setSelectedCategory('ALL')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
            selectedCategory === 'ALL'
              ? 'bg-amber-600 text-white shadow-sm'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}
        >
          {t.allBooks} ({formatDigits(books.length, appLanguage)})
        </button>
        {categories.map((cat) => {
          const count = books.filter((b) => b.category === cat).length;
          const isSelected = selectedCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                isSelected
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {cat} ({formatDigits(count, appLanguage)})
            </button>
          );
        })}
      </div>

      {/* Toolbar: Search inside list, Sort, Bulk Mode Toggle */}
      <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute right-3 top-2.5 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              placeholder={t.searchBookPlaceholder}
              className="w-full pr-9 pl-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Sort Selector */}
          <select
            value={sortMode}
            onChange={(e) => setSortMode(e.target.value as FilesSortMode)}
            className="p-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium"
          >
            <option value="DEFAULT">{t.sortLabel} {t.sortEntryTime}</option>
            <option value="LAST_VIEWED">{t.sortLastViewed}</option>
            <option value="NAME_ASC">{t.sortAlphabeticalAsc}</option>
            <option value="NAME_DESC">{t.sortAlphabeticalDesc}</option>
            <option value="SIZE_DESC">{t.sortSizeDesc}</option>
            <option value="SIZE_ASC">{t.sortSizeAsc}</option>
            <option value="FAVORITE">{t.sortFavorites}</option>
          </select>

          {/* Selection Mode Toggle Button */}
          <button
            onClick={() => {
              setIsSelectionMode(!isSelectionMode);
              setSelectedIds(new Set());
            }}
            className={`p-2 rounded-xl border text-xs font-semibold flex items-center gap-1 transition-all ${
              isSelectionMode
                ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
            }`}
            title={t.multiSelect}
          >
            <CheckSquare className="w-4 h-4" />
            <span className="hidden sm:inline">{t.multiSelect}</span>
          </button>

          {/* Backup Export */}
          <button
            onClick={exportBackupJSON}
            className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            title={t.backupJSON}
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Bulk Action Bar if selection mode is active */}
      {isSelectionMode && (
        <div className="bg-amber-500 text-white p-3 rounded-2xl flex items-center justify-between gap-2 shadow-md animate-fadeIn">
          <div className="flex items-center gap-2">
            <button
              onClick={toggleSelectAll}
              className="p-1 bg-white/20 hover:bg-white/30 rounded-lg text-xs font-bold"
            >
              {selectedIds.size === sorted.length ? t.multiSelectCancelAll : t.multiSelectAll}
            </button>
            <span className="text-xs font-bold">
              {formatDigits(selectedIds.size, appLanguage)} {t.selectedBooks}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (selectedIds.size > 0) {
                  setTargetCategory(categories[0] || 'بدون دسته‌بندی');
                  setShowBulkCatModal(true);
                }
              }}
              disabled={selectedIds.size === 0}
              className="px-3 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white font-bold text-xs disabled:opacity-50 transition-all cursor-pointer"
            >
              {t.changeCategory}
            </button>
            <button
              onClick={() => {
                if (selectedIds.size > 0) setShowBulkDeleteConfirm(true);
              }}
              disabled={selectedIds.size === 0}
              className="px-3 py-1.5 rounded-xl bg-rose-700 hover:bg-rose-800 text-white font-bold text-xs disabled:opacity-50 transition-all cursor-pointer"
            >
              {t.bulkDelete}
            </button>
          </div>
        </div>
      )}

      {/* Stats Summary */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-100 dark:bg-slate-800/60 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-400">
        <span>
          {sorted.length > 20 && visibleCount < sorted.length
            ? `${t.showingBooks} ${formatDigits(Math.min(visibleCount, sorted.length), appLanguage)} ${t.of} ${formatDigits(sorted.length, appLanguage)} ${t.books}`
            : `${t.showingBooks} ${formatDigits(sorted.length, appLanguage)} ${t.books}`}
        </span>
        <span>{t.totalSize} {formatBytes(totalBytes)}</span>
      </div>

      {/* Books List Grid */}
      {sorted.length > 0 ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {sorted.slice(0, visibleCount).map((book, idx) => {
              const isChecked = selectedIds.has(book.id);

              return (
                <div
                  key={`${book.id}-${idx}`}
                  onClick={() =>
                    isSelectionMode
                      ? toggleSelectBook(book.id)
                      : onOpenReader(book.id)
                  }
                  className={`group bg-white dark:bg-slate-900 border rounded-2xl p-4 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between gap-3 ${
                    isChecked
                      ? 'border-amber-500 bg-amber-50/20 dark:bg-amber-950/20 ring-2 ring-amber-500/30'
                      : 'border-slate-200 dark:border-slate-800 hover:border-amber-400 dark:hover:border-amber-500/60'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {isSelectionMode ? (
                      <div className="mt-0.5 text-amber-600">
                        {isChecked ? (
                          <CheckSquare className="w-5 h-5 fill-amber-600 text-white" />
                        ) : (
                          <Square className="w-5 h-5 text-slate-400" />
                        )}
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 group-hover:bg-amber-100 dark:group-hover:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 transition-colors">
                        <FileText className="w-5 h-5" />
                      </div>
                    )}

                    <div className="flex-1 overflow-hidden">
                      <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors truncate">
                        {book.name}
                      </h4>
                      {book.summary && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                          {book.summary}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        <span className="bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded-md border border-amber-200/60 dark:border-amber-800/60">
                          {book.category}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {formatBytes(book.size || book.content.length)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div
                    className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800/60 pt-2.5 mt-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <span className="text-[11px] text-slate-400">
                      {t.addedDate} {new Date(book.dateAdded).toLocaleDateString(appLanguage === 'fa' ? 'fa-IR' : appLanguage === 'ar' ? 'ar-EG' : 'en-US')}
                    </span>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleStar(book.id);
                        }}
                        className={`p-1.5 rounded-lg transition-colors ${
                          book.isFavorite
                            ? 'text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/40'
                            : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                        }`}
                        title={t.addFavorite}
                      >
                        <Star
                          className={`w-4 h-4 ${book.isFavorite ? 'fill-amber-500' : ''}`}
                        />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setPendingDeleteBook({ id: book.id, name: book.name });
                        }}
                        className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                        title={t.deleteBook}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination Controls */}
          {sorted.length > visibleCount && (
            <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-3 pb-1">
              <button
                onClick={() => setVisibleCount((prev) => prev + 20)}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-sm transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2"
              >
                <span>{t.showMore}</span>
                <span className="text-[11px] bg-slate-950/10 px-2 py-0.5 rounded-md font-semibold">
                  ({formatDigits(sorted.length - visibleCount, appLanguage)} {t.remaining})
                </span>
              </button>
              <button
                onClick={() => setVisibleCount(sorted.length)}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs transition-all cursor-pointer"
              >
                {t.showAll} ({formatDigits(sorted.length, appLanguage)} {t.books})
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center text-slate-400">
          <FileText className="w-12 h-12 mb-2 text-slate-300 dark:text-slate-700" />
          <p className="text-sm font-medium">{t.noBooksFound}</p>
        </div>
      )}

      {/* Modal: Single Book Delete Confirmation */}
      {pendingDeleteBook && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl text-right">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center mb-4">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 mb-2">
              {t.deleteConfirmTitle}
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 mb-6 leading-relaxed">
              {t.deleteConfirmDesc} «<span className="font-bold text-slate-900 dark:text-white">{pendingDeleteBook.name}</span>»
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  onDeleteBook(pendingDeleteBook.id);
                  setPendingDeleteBook(null);
                }}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer"
              >
                {t.deleteBook}
              </button>
              <button
                onClick={() => setPendingDeleteBook(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold text-xs transition-all cursor-pointer"
              >
                {t.cancel}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Bulk Delete Confirmation */}
      {showBulkDeleteConfirm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl text-right">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center mb-4">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 mb-2">
              {t.bulkDeleteTitle}
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 mb-6 leading-relaxed">
              {t.bulkDeleteDesc} (<span className="font-bold text-rose-600">{formatDigits(selectedIds.size, appLanguage)}</span> {t.books})
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={confirmBulkDelete}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer"
              >
                {t.deleteAllSelected}
              </button>
              <button
                onClick={() => setShowBulkDeleteConfirm(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold text-xs transition-all cursor-pointer"
              >
                {t.cancel}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Bulk Change Category */}
      {showBulkCatModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl text-right">
            <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 mb-2">
              {t.bulkCategoryTitle}
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 mb-4 leading-relaxed">
              {t.bulkCategoryDesc} (<span className="font-bold">{formatDigits(selectedIds.size, appLanguage)}</span> {t.books})
            </p>
            <select
              value={targetCategory}
              onChange={(e) => setTargetCategory(e.target.value)}
              className="w-full p-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-semibold mb-6"
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <div className="flex items-center gap-3">
              <button
                onClick={confirmBulkCatChange}
                className="flex-1 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer"
              >
                {t.applyCategory}
              </button>
              <button
                onClick={() => setShowBulkCatModal(false)}
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
