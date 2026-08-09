import React, { useState } from 'react';
import {
  Search,
  SlidersHorizontal,
  X,
  ChevronDown,
  ChevronUp,
  Star,
  Trash2,
  BookOpen,
  Plus,
} from 'lucide-react';
import {
  BookFile,
  SearchFilterState,
  SearchOccurrence,
  AppLanguage,
} from '../types';
import {
  findSearchOccurrences,
  getSnippetForMatch,
} from '../utils/textUtils';
import { translations, formatDigits } from '../utils/i18n';

interface SearchViewProps {
  books: BookFile[];
  filterState: SearchFilterState;
  onOpenFilterModal: () => void;
  onOpenReader: (bookId: number, matchPos?: number, query?: string) => void;
  onToggleStar: (bookId: number) => void;
  onDeleteBook: (bookId: number, bookName: string) => void;
  appLanguage?: AppLanguage;
}

export const SearchView: React.FC<SearchViewProps> = ({
  books,
  filterState,
  onOpenFilterModal,
  onOpenReader,
  onToggleStar,
  onDeleteBook,
  appLanguage = 'fa',
}) => {
  const t = translations[appLanguage]?.searchView || translations.fa.searchView;
  const tTab = translations[appLanguage]?.tabs || translations.fa.tabs;
  const tSet = translations[appLanguage]?.settings || translations.fa.settings;

  const [searchInput, setSearchInput] = useState('');
  const [multiWords, setMultiWords] = useState<string[]>([]);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<number>>(new Set());
  const [pendingDeleteBook, setPendingDeleteBook] = useState<{ id: number; name: string } | null>(null);
  const [occurrenceLimits, setOccurrenceLimits] = useState<Map<number, number>>(
    new Map()
  );
  const [renderLimit, setRenderLimit] = useState(20);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!filterState.enableMultiWord) return;
    const val = searchInput.trim();
    if ((e.key === ' ' || e.key === 'Enter') && val.length > 0) {
      e.preventDefault();
      if (!multiWords.includes(val)) {
        setMultiWords([...multiWords, val]);
      }
      setSearchInput('');
    } else if (e.key === 'Backspace' && searchInput === '' && multiWords.length > 0) {
      setMultiWords(multiWords.slice(0, -1));
    }
  };

  const removeMultiWord = (index: number) => {
    setMultiWords(multiWords.filter((_, idx) => idx !== index));
  };

  const occurrences = findSearchOccurrences(
    searchInput,
    multiWords,
    books,
    filterState
  );

  // Group occurrences by fileId
  const fileGroupsMap = new Map<
    number,
    {
      fileId: number;
      fileName: string;
      fileCategory: string;
      fileSize: number;
      isFavorite: boolean;
      items: SearchOccurrence[];
    }
  >();

  occurrences.forEach((occ) => {
    if (!fileGroupsMap.has(occ.fileId)) {
      fileGroupsMap.set(occ.fileId, {
        fileId: occ.fileId,
        fileName: occ.fileName,
        fileCategory: occ.fileCategory,
        fileSize: occ.fileSize,
        isFavorite: occ.isFavorite,
        items: [],
      });
    }
    fileGroupsMap.get(occ.fileId)!.items.push(occ);
  });

  let groups = Array.from(fileGroupsMap.values());

  if (filterState.searchSortMode === 'OCCURRENCES_DESC') {
    groups.sort((a, b) => b.items.length - a.items.length);
  } else if (filterState.searchSortMode === 'SIZE_DESC') {
    groups.sort((a, b) => (b.fileSize || 0) - (a.fileSize || 0));
  } else if (filterState.searchSortMode === 'NAME_ASC') {
    groups.sort((a, b) => a.fileName.localeCompare(b.fileName, appLanguage));
  }

  const toggleGroupCollapse = (fileId: number) => {
    const updated = new Set(collapsedGroups);
    if (updated.has(fileId)) {
      updated.delete(fileId);
    } else {
      updated.add(fileId);
    }
    setCollapsedGroups(updated);
  };

  const getFileOccurrenceLimit = (fileId: number) => {
    return occurrenceLimits.get(fileId) || 8;
  };

  const increaseOccurrenceLimit = (fileId: number, amount: number) => {
    const current = getFileOccurrenceLimit(fileId);
    setOccurrenceLimits(new Map(occurrenceLimits.set(fileId, current + amount)));
  };

  const showAllOccurrencesForFile = (fileId: number, total: number) => {
    setOccurrenceLimits(new Map(occurrenceLimits.set(fileId, total)));
  };

  const queryWordsList =
    filterState.enableMultiWord && multiWords.length > 0
      ? multiWords
      : searchInput.trim().split(/\s+/).filter((w) => w.length > 0);

  const placeholderText = filterState.enableMultiWord
    ? (appLanguage === 'ar' ? 'اكتب الكلمة واضغط مسافة (Space)...' : appLanguage === 'en' ? 'Type word & press Space...' : 'کلمه را بنویسید و کلید فاصله (Space) را بزنید...')
    : t.placeholder;

  return (
    <div className="flex flex-col gap-3 pb-24 max-w-5xl mx-auto px-4 pt-1">
      {/* Sticky Search & Stats Header Container */}
      <div className="sticky top-[52px] z-20 bg-slate-50 dark:bg-slate-950 -mx-4 px-4 py-2 border-b border-slate-200/90 dark:border-slate-800/90 shadow-sm transition-all">
        <div className="max-w-5xl mx-auto flex flex-col gap-2">
          {/* Main Search Input & Filters Box */}
          <div className="bg-white dark:bg-slate-900 p-2 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <div className="relative flex-1 flex items-center">
                <Search className="w-4 h-4 absolute right-3 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={placeholderText}
                  className="w-full pr-9 pl-3 py-2 text-sm rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                />
                {searchInput && (
                  <button
                    onClick={() => setSearchInput('')}
                    className="absolute left-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              <button
                onClick={onOpenFilterModal}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold border border-slate-200/80 dark:border-slate-700/80 transition-all active:scale-95 cursor-pointer shrink-0"
                title={t.filtering}
              >
                <SlidersHorizontal className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span className="hidden sm:inline">{t.filtering}</span>
              </button>
            </div>

            {/* Multi-Word Chips Container */}
            {filterState.enableMultiWord && (
              <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-100 dark:border-slate-800/60">
                {multiWords.length === 0 ? (
                  <span className="text-[11px] text-slate-400 dark:text-slate-500">
                    {appLanguage === 'ar'
                      ? 'اكتب كلمة ثم اضغط مسافة للفصل بين الكلمات.'
                      : appLanguage === 'en'
                      ? 'Type a word and press Space to add keywords.'
                      : 'کلمه‌ای بنویسید و کلید فاصله (Space) را بزنید تا کلمات تفکیک شوند.'}
                  </span>
                ) : (
                  multiWords.map((word, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-200 border border-amber-300 dark:border-amber-800 text-xs font-semibold"
                    >
                      <span className="text-[10px] opacity-70">
                        {appLanguage === 'ar' ? `كلمة ${formatDigits(idx + 1, appLanguage)}:` : appLanguage === 'en' ? `Word ${formatDigits(idx + 1, appLanguage)}:` : `کلمه ${formatDigits(idx + 1, appLanguage)}:`}
                      </span>
                      <span>{word}</span>
                      <button
                        onClick={() => removeMultiWord(idx)}
                        className="hover:text-rose-600 font-bold ml-0.5 cursor-pointer"
                      >
                        ×
                      </button>
                    </span>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Integrated Stats Summary Bar */}
          {(searchInput.trim().length > 0 || multiWords.length > 0) && (
            <div className="flex items-center justify-between px-3 py-1.5 bg-amber-500/10 dark:bg-amber-950/40 border border-amber-300/60 dark:border-amber-700/60 rounded-xl text-xs font-bold shadow-2xs animate-fadeIn">
              <div className="text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                {occurrences.length > 0 ? (
                  <span>
                    {appLanguage === 'ar'
                      ? 'إجمالي النتائج:'
                      : appLanguage === 'en'
                      ? 'Total results:'
                      : 'تعداد کل یافته‌ها:'}{' '}
                    <span className="text-amber-800 dark:text-amber-300 font-extrabold text-sm ml-1">
                      {formatDigits(occurrences.length, appLanguage)}
                    </span>
                  </span>
                ) : (
                  <span className="text-rose-600 dark:text-rose-400">{t.noResults}</span>
                )}

                {occurrences.length > 0 && filterState.enableMultiWord && multiWords.length > 0 && (
                  <span className="text-slate-400 dark:text-slate-500 text-[11px] font-normal mr-1">
                    ({formatDigits(multiWords.length, appLanguage)}{' '}
                    {appLanguage === 'en' ? 'keywords' : 'کلمه'})
                  </span>
                )}
              </div>

              {occurrences.length > 0 && (
                <span className="bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-200 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold border border-amber-300/60 dark:border-amber-800/60 shrink-0">
                  {appLanguage === 'ar'
                    ? `في ${formatDigits(groups.length, appLanguage)} كتاب`
                    : appLanguage === 'en'
                    ? `in ${formatDigits(groups.length, appLanguage)} books`
                    : `در ${formatDigits(groups.length, appLanguage)} فایل`}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Grouped Results List */}
      {groups.length > 0 ? (
        <div className="flex flex-col gap-3">
          {groups.slice(0, renderLimit).map((group, idx) => {
            const isCollapsed = collapsedGroups.has(group.fileId);
            const limit = getFileOccurrenceLimit(group.fileId);
            const displayedItems = group.items.slice(0, limit);
            const bookObj = books.find((b) => b.id === group.fileId);

            return (
              <div
                key={`${group.fileId}-${idx}`}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden transition-all duration-200"
              >
                {/* Book Header */}
                <div
                  onClick={() => toggleGroupCollapse(group.fileId)}
                  className="px-4 py-3 bg-slate-50/80 dark:bg-slate-800/50 hover:bg-amber-50/50 dark:hover:bg-slate-800 border-b border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between gap-3 cursor-pointer select-none"
                >
                  <div className="flex items-center gap-2 overflow-hidden flex-1">
                    <BookOpen className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                    <span className="font-bold text-sm truncate text-slate-900 dark:text-slate-100">
                      {group.fileName}
                    </span>
                    <span className="bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 text-[11px] font-bold px-2 py-0.5 rounded-md border border-amber-200/60 dark:border-amber-800/60 shrink-0">
                      {formatDigits(group.items.length, appLanguage)} {appLanguage === 'ar' ? 'نتيجة' : appLanguage === 'en' ? 'matches' : 'مورد'}
                    </span>
                    <span className="bg-slate-200/60 dark:bg-slate-700/60 text-slate-700 dark:text-slate-300 text-[10px] font-semibold px-2 py-0.5 rounded-md shrink-0">
                      {group.fileCategory}
                    </span>
                  </div>

                  <div
                    className="flex items-center gap-1.5 shrink-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() => onToggleStar(group.fileId)}
                      className={`p-1.5 rounded-lg transition-colors ${
                        group.isFavorite
                          ? 'text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/40'
                          : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <Star
                        className={`w-4 h-4 ${group.isFavorite ? 'fill-amber-500' : ''}`}
                      />
                    </button>
                    <button
                      onClick={() => setPendingDeleteBook({ id: group.fileId, name: group.fileName })}
                      className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                      title="حذف کتاب"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => toggleGroupCollapse(group.fileId)}
                      className="p-1.5 text-slate-400"
                    >
                      {isCollapsed ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronUp className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Items Body */}
                {!isCollapsed && (
                  <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {displayedItems.map((item, idx) => {
                      const snippetHTML = bookObj
                        ? getSnippetForMatch(
                            bookObj.content,
                            item.matchPos,
                            item.matchLength,
                            queryWordsList
                          )
                        : '';

                      return (
                        <div
                          key={idx}
                          onClick={() => onOpenReader(item.fileId, item.matchPos, queryWordsList.join(' '))}
                          className="p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer transition-colors flex flex-col gap-1.5"
                        >
                          <div className="text-[11px] font-semibold text-slate-400 dark:text-slate-500">
                            {appLanguage === 'ar'
                              ? `نتيجة ${formatDigits(item.occurrenceIndex, appLanguage)} من ${formatDigits(item.totalInFile, appLanguage)}`
                              : appLanguage === 'en'
                              ? `Match ${formatDigits(item.occurrenceIndex, appLanguage)} of ${formatDigits(item.totalInFile, appLanguage)}`
                              : `مورد ${formatDigits(item.occurrenceIndex, appLanguage)} از ${formatDigits(item.totalInFile, appLanguage)}`}
                          </div>
                          <div
                            className="text-xs leading-relaxed text-slate-800 dark:text-slate-200 bg-slate-50/50 dark:bg-slate-800/30 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/80 font-[Vazirmatn] text-justify"
                            dangerouslySetInnerHTML={{ __html: snippetHTML }}
                          />
                        </div>
                      );
                    })}

                    {group.items.length > limit && (
                      <div className="p-2.5 bg-slate-50/50 dark:bg-slate-800/20 flex flex-wrap gap-2 items-center justify-center border-t border-slate-100 dark:border-slate-800">
                        <button
                          onClick={() => increaseOccurrenceLimit(group.fileId, 10)}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold border border-slate-200 dark:border-slate-700 shadow-xs"
                        >
                          <Plus className="w-3.5 h-3.5 text-amber-600" />
                          <span>
                            {appLanguage === 'ar'
                              ? `عرض ١٠ المزيد (${formatDigits(group.items.length - limit, appLanguage)} متبقي)`
                              : appLanguage === 'en'
                              ? `10 More (${formatDigits(group.items.length - limit, appLanguage)} left)`
                              : `۱۰ مورد بیشتر (${formatDigits(group.items.length - limit, appLanguage)} باقی‌مانده)`}
                          </span>
                        </button>

                        <button
                          onClick={() =>
                            showAllOccurrencesForFile(group.fileId, group.items.length)
                          }
                          className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-xs"
                        >
                          {appLanguage === 'ar'
                            ? `عرض الكل (${formatDigits(group.items.length, appLanguage)})`
                            : appLanguage === 'en'
                            ? `Show All (${formatDigits(group.items.length, appLanguage)})`
                            : `نمایش همه (${formatDigits(group.items.length, appLanguage)})`}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {groups.length > renderLimit && (
            <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-center flex flex-col items-center gap-2">
              <span className="text-xs text-slate-500">
                {appLanguage === 'ar'
                  ? `عرض ${formatDigits(renderLimit, appLanguage)} من ${formatDigits(groups.length, appLanguage)} كتاب`
                  : appLanguage === 'en'
                  ? `Showing ${formatDigits(renderLimit, appLanguage)} of ${formatDigits(groups.length, appLanguage)} books`
                  : `نمایش ${formatDigits(renderLimit, appLanguage)} کتاب از ${formatDigits(groups.length, appLanguage)} کتاب`}
              </span>
              <button
                onClick={() => setRenderLimit((prev) => prev + 20)}
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-sm"
              >
                + {appLanguage === 'ar' ? 'عرض ٢٠ كتاباً إضافياً' : appLanguage === 'en' ? 'Show 20 More Books' : 'نمایش ۲۰ کتاب بیشتر'}
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center text-slate-400 dark:text-slate-500">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-800/60 flex items-center justify-center text-amber-600 dark:text-amber-400 mb-3">
            <Search className="w-8 h-8" />
          </div>
          <h3 className="font-bold text-base text-slate-800 dark:text-slate-200 mb-1">
            {appLanguage === 'ar' ? 'محرك البحث والمستكشف للنصوص' : appLanguage === 'en' ? 'Islamic Library Search Engine' : 'موتور کاوش متون اسلامی'}
          </h3>
          <p className="text-xs max-w-sm leading-relaxed">
            {appLanguage === 'ar'
              ? 'ابحث عن العبارات والكلمات والتركيبات في كافة كتب المكتبة.'
              : appLanguage === 'en'
              ? 'Search for words, phrases, and expressions across all books in your library.'
              : 'برای استخراج تمام موارد تکرار واژه‌ها، عبارات، ترکیبات و ریشه‌ها در تمام کتب، عبارت مورد نظر خود را تایپ فرمایید.'}
          </p>
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
              {appLanguage === 'en' ? 'Confirm Book Deletion' : appLanguage === 'ar' ? 'تأكيد حذف الكتاب' : 'تأیید حذف کتاب'}
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 mb-6 leading-relaxed">
              {appLanguage === 'en' ? (
                <>Are you sure you want to delete "<span className="font-bold text-slate-900 dark:text-white">{pendingDeleteBook.name}</span>"?</>
              ) : appLanguage === 'ar' ? (
                <>هل أنت تأكيد من حذف الكتاب «<span className="font-bold text-slate-900 dark:text-white">{pendingDeleteBook.name}</span>»؟</>
              ) : (
                <>آیا از حذف کتاب «<span className="font-bold text-slate-900 dark:text-white">{pendingDeleteBook.name}</span>» اطمینان دارید؟</>
              )}
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  onDeleteBook(pendingDeleteBook.id, pendingDeleteBook.name);
                  setPendingDeleteBook(null);
                }}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer"
              >
                {appLanguage === 'en' ? 'Delete Book' : appLanguage === 'ar' ? 'حذف الكتاب' : 'حذف کتاب'}
              </button>
              <button
                onClick={() => setPendingDeleteBook(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold text-xs transition-all cursor-pointer"
              >
                {appLanguage === 'en' ? 'Cancel' : appLanguage === 'ar' ? 'إلغاء' : 'انصراف'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
