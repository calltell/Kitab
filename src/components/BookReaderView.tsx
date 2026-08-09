import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  ArrowRight,
  BookOpen,
  ChevronRight,
  ChevronLeft,
  Volume2,
  VolumeX,
  Star,
  Trash2,
  Highlighter,
  Copy,
  BookMarked,
  SlidersHorizontal,
  Sliders,
  Check,
  Image as ImageIcon,
  Search,
  X,
  Filter,
  FileText,
  Palette,
  Minus,
  Plus,
  BookmarkPlus,
  ListFilter,
  Type,
  ChevronDown,
} from 'lucide-react';
import { QuoteImageModal } from './QuoteImageModal';
import { translations, formatDigits } from '../utils/i18n';
import {
  BookFile,
  ReaderSettings,
  BookPage,
  ReaderTheme,
  ReaderFont,
  HighlightBookmark,
} from '../types';
import {
  splitTextIntoPages,
  buildArabicRegex,
} from '../utils/textUtils';

interface BookReaderViewProps {
  book: BookFile;
  readerSettings: ReaderSettings;
  categories: string[];
  targetMatchPos?: number;
  searchQuery?: string;
  onBack: () => void;
  onUpdateSettings: (settings: Partial<ReaderSettings>) => void;
  onUpdateBookCategory: (bookId: number, category: string) => void;
  onToggleStar: (bookId: number) => void;
  onDeleteBook: (bookId: number, name: string) => void;
  onSaveBookmark: (bookmark: HighlightBookmark) => void;
}

interface InBookMatch {
  matchPos: number;
  matchLength: number;
  pageIndex: number;
  snippet: string;
}

export const BookReaderView: React.FC<BookReaderViewProps> = ({
  book,
  readerSettings,
  categories,
  targetMatchPos = -1,
  searchQuery = '',
  onBack,
  onUpdateSettings,
  onUpdateBookCategory,
  onToggleStar,
  onDeleteBook,
  onSaveBookmark,
}) => {
  const currentLang = readerSettings.appLanguage || 'fa';
  const t = translations[currentLang] || translations.fa;

  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [pages, setPages] = useState<BookPage[]>([]);
  const [selectedText, setSelectedText] = useState('');
  const [selectionContext, setSelectionContext] = useState('');
  const [popupPos, setPopupPos] = useState<{ x: number; y: number; isBelow?: boolean } | null>(null);

  // Consolidated Tools Drawer state
  const [showToolsDrawer, setShowToolsDrawer] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // In-Book Search overlay state
  const [showInBookSearch, setShowInBookSearch] = useState(false);
  const [inBookQuery, setInBookQuery] = useState(searchQuery || '');
  const [showInBookFilters, setShowInBookFilters] = useState(false);
  const [inBookFilterState, setInBookFilterState] = useState({
    isExactWord: false,
    ignoreTashkeel: true,
    enableArabicPrefixes: false,
    enableArabicSuffixes: false,
  });

  const [selectedMatchPos, setSelectedMatchPos] = useState<number>(targetMatchPos);
  const [activeMatchIndex, setActiveMatchIndex] = useState<number>(0);

  // Highlight & Note modal states
  const [noteInput, setNoteInput] = useState('');
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [selectedHighlightColor, setSelectedHighlightColor] = useState<
    'yellow' | 'green' | 'blue' | 'pink'
  >('yellow');

  const readerRef = useRef<HTMLDivElement>(null);

  // Calculate pages when book or pagination settings change
  useEffect(() => {
    const p = splitTextIntoPages(
      book.content,
      readerSettings.paginationMode,
      readerSettings.paginationWordCount,
      readerSettings.paginationPattern
    );
    setPages(p);

    const initialPos = selectedMatchPos !== -1 ? selectedMatchPos : targetMatchPos;
    if (initialPos !== -1 && p.length > 0) {
      const foundIdx = p.findIndex(
        (page) => initialPos >= page.startPos && initialPos < page.endPos
      );
      if (foundIdx !== -1) {
        setCurrentPageIndex(foundIdx);
      } else {
        setCurrentPageIndex(0);
      }
    } else {
      setCurrentPageIndex(book.lastReadPage || 0);
    }
  }, [
    book.content,
    readerSettings.paginationMode,
    readerSettings.paginationWordCount,
    readerSettings.paginationPattern,
    targetMatchPos,
  ]);

  // Compute In-Book Search Matches
  const inBookMatches = useMemo(() => {
    if (!inBookQuery.trim()) return [];

    const query = inBookQuery.trim();
    const words = query.split(/\s+/).filter((w) => w.length > 0);
    if (words.length === 0) return [];

    const patterns = words
      .map((w) => {
        const r = buildArabicRegex(
          w,
          {
            isExactWord: inBookFilterState.isExactWord,
            ignoreTashkeel: inBookFilterState.ignoreTashkeel,
            enablePrefixes: inBookFilterState.enableArabicPrefixes,
            enableSuffixes: inBookFilterState.enableArabicSuffixes,
          },
          'gi'
        );
        return r ? r.source : null;
      })
      .filter(Boolean);

    if (patterns.length === 0) return [];

    const combinedReg = new RegExp(`(${patterns.join('|')})`, 'gi');
    const matches: InBookMatch[] = [];
    const text = book.content;
    let m: RegExpExecArray | null;

    while ((m = combinedReg.exec(text)) !== null) {
      const pos = m.index;
      const len = m[0].length;
      const pIdx = pages.findIndex((p) => pos >= p.startPos && pos < p.endPos);

      const sStart = Math.max(0, pos - 35);
      const sEnd = Math.min(text.length, pos + len + 35);
      const rawSnippet = text.substring(sStart, sEnd).replace(/\s+/g, ' ');
      const snippet =
        (sStart > 0 ? '...' : '') +
        rawSnippet +
        (sEnd < text.length ? '...' : '');

      matches.push({
        matchPos: pos,
        matchLength: len,
        pageIndex: pIdx >= 0 ? pIdx : 0,
        snippet,
      });

      if (m.index === combinedReg.lastIndex) combinedReg.lastIndex++;
    }

    return matches;
  }, [book.content, inBookQuery, inBookFilterState, pages]);

  // Jump to a specific search result match
  const handleJumpToMatch = (
    matchPos: number,
    pageIdx: number,
    matchIdx: number
  ) => {
    setSelectedMatchPos(matchPos);
    setActiveMatchIndex(matchIdx);
    if (pageIdx >= 0 && pageIdx < pages.length) {
      setCurrentPageIndex(pageIdx);
    }
  };

  // Handle Text Selection Popup Menu
  useEffect(() => {
    const handleSelection = () => {
      const selection = window.getSelection();
      if (selection && !selection.isCollapsed) {
        const text = selection.toString().trim();
        if (text.length > 0) {
          const range = selection.getRangeAt(0);
          const rect = range.getBoundingClientRect();
          setSelectedText(text);

          const fullText = book.content;
          const pos = selectedMatchPos !== -1 ? selectedMatchPos : 0;
          const contextStart = Math.max(0, pos - 200);
          const contextEnd = Math.min(fullText.length, pos + 200);
          setSelectionContext(fullText.substring(contextStart, contextEnd));

          // Calculate position to prevent collision with screen edges and native toolbars
          const isNearTop = rect.top < 110;
          const yPos = isNearTop ? rect.bottom + 12 : rect.top - 54;
          const minX = 130;
          const maxX = Math.max(minX, window.innerWidth - 130);
          const xPos = Math.max(minX, Math.min(maxX, rect.left + rect.width / 2));

          setPopupPos({
            x: xPos,
            y: yPos,
            isBelow: isNearTop,
          });
          return;
        }
      }
      setPopupPos(null);
    };

    document.addEventListener('selectionchange', handleSelection);
    return () =>
      document.removeEventListener('selectionchange', handleSelection);
  }, [book.content, selectedMatchPos]);

  const handleCopyFullPageText = () => {
    const textToCopy =
      readerSettings.mode === 'full'
        ? book.content
        : pages[currentPageIndex]?.content || '';
    if (textToCopy) {
      navigator.clipboard.writeText(textToCopy);
      alert(t.readerView.pageCopiedAlert);
    } else {
      alert(t.readerView.noTextToCopyAlert);
    }
  };

  const handleCopyText = () => {
    if (selectedText) {
      navigator.clipboard.writeText(selectedText);
      alert(t.readerView.selectedTextCopiedAlert);
      setPopupPos(null);
    }
  };

  const handleSaveHighlight = () => {
    if (!selectedText) return;
    const newBookmark: HighlightBookmark = {
      id: Date.now().toString(),
      fileId: book.id,
      fileName: book.name,
      text: selectedText,
      note: noteInput || undefined,
      color: selectedHighlightColor,
      startPos: selectedMatchPos > -1 ? selectedMatchPos : 0,
      endPos:
        (selectedMatchPos > -1 ? selectedMatchPos : 0) + selectedText.length,
      createdAt: Date.now(),
    };
    onSaveBookmark(newBookmark);
    setShowNoteModal(false);
    setNoteInput('');
    setPopupPos(null);
    alert(t.readerView.bookmarkSavedAlert);
  };

  const currentPage = pages[currentPageIndex] || { content: '' };

  // Generate Highlighted Page HTML
  const generateFormattedHTML = (rawText: string) => {
    if (!rawText) return '';

    const queryToHighlight = inBookQuery.trim() || searchQuery.trim();

    if (queryToHighlight) {
      const words = queryToHighlight
        .trim()
        .split(/\s+/)
        .filter((w) => w.length > 0);

      const patterns = words
        .map((w) => {
          const r = buildArabicRegex(
            w,
            {
              isExactWord: inBookFilterState.isExactWord,
              ignoreTashkeel: inBookFilterState.ignoreTashkeel,
              enablePrefixes: inBookFilterState.enableArabicPrefixes,
              enableSuffixes: inBookFilterState.enableArabicSuffixes,
            },
            ''
          );
          return r ? r.source : null;
        })
        .filter(Boolean);

      if (patterns.length > 0) {
        const reg = new RegExp(`(${patterns.join('|')})`, 'gi');
        let lastIdx = 0;
        let result = '';
        let match: RegExpExecArray | null;

        const effectiveTargetPos =
          selectedMatchPos !== -1 ? selectedMatchPos : targetMatchPos;

        while ((match = reg.exec(rawText)) !== null) {
          const matchedText = match[0];
          const matchInPagePos = match.index;
          const globalPos = currentPage.startPos + matchInPagePos;

          const textBefore = rawText.substring(lastIdx, matchInPagePos);
          result += textBefore
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');

          const isTarget =
            effectiveTargetPos !== -1 &&
            Math.abs(globalPos - effectiveTargetPos) < 50;
          const markClass = isTarget ? 'mark-target' : 'mark-normal';

          const escapedMatch = matchedText
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
          result += `<mark class="${markClass}" ${
            isTarget ? 'id="targetMatch"' : ''
          }>${escapedMatch}</mark>`;

          lastIdx = matchInPagePos + matchedText.length;
          if (match.index === reg.lastIndex) reg.lastIndex++;
        }

        const textAfter = rawText.substring(lastIdx);
        result += textAfter
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;');

        return result;
      }
    }

    return rawText
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  };

  // Scroll target highlight into view
  useEffect(() => {
    setTimeout(() => {
      const targetEl = document.getElementById('targetMatch');
      if (targetEl) {
        targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else if (readerRef.current) {
        readerRef.current.scrollTop = 0;
      }
    }, 100);
  }, [currentPageIndex, readerSettings.mode, selectedMatchPos, targetMatchPos]);

  // Theme Class Resolver
  const getThemeClass = (theme: ReaderTheme) => {
    switch (theme) {
      case 'sepia':
        return 'reader-theme-sepia';
      case 'dark':
        return 'reader-theme-dark';
      case 'emerald':
        return 'reader-theme-emerald';
      case 'cream':
        return 'reader-theme-cream';
      default:
        return 'reader-theme-light';
    }
  };

  const getFontClass = (font: ReaderFont) => {
    switch (font) {
      case 'amiri':
        return 'font-amiri';
      case 'scheherazade':
        return 'font-scheherazade';
      default:
        return 'font-vazir';
    }
  };

  return (
    <div
      className={`fixed inset-0 z-40 flex flex-col h-screen overflow-hidden transition-colors duration-200 ${getThemeClass(
        readerSettings.theme
      )}`}
    >
      {/* Streamlined Professional Top Header */}
      <header className="sticky top-0 z-20 px-3 py-2 border-b border-black/10 dark:border-white/10 flex items-center justify-between backdrop-blur-md bg-white/80 dark:bg-slate-900/80 shadow-xs select-none">
        {/* Right Section: Back, Title, Category */}
        <div className="flex items-center gap-2 overflow-hidden min-w-0">
          <button
            onClick={onBack}
            className="p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 transition-colors flex items-center gap-1.5 font-bold text-xs shrink-0"
          >
            <ArrowRight className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span className="hidden sm:inline">{t.readerView.back}</span>
          </button>

          <div className="h-4 w-[1px] bg-black/10 dark:bg-white/10 shrink-0" />

          <div className="flex items-center gap-2 overflow-hidden min-w-0">
            <FileText className="w-4 h-4 text-slate-400 shrink-0 hidden xs:inline" />
            <h2 className="font-bold text-xs sm:text-sm truncate max-w-[140px] sm:max-w-xs md:max-w-md">
              {book.name}
            </h2>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 shrink-0 hidden md:inline">
              {book.category || t.readerView.uncategorized}
            </span>
          </div>
        </div>

        {/* Left Section: Action Buttons */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Quick In-Book Search Button */}
          <button
            onClick={() => setShowInBookSearch(!showInBookSearch)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs transition-all ${
              showInBookSearch || inBookQuery
                ? 'bg-amber-500 text-slate-950 shadow-xs'
                : 'bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20'
            }`}
            title={t.readerView.inBookSearchTitle}
          >
            <Search className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t.readerView.inBookSearch}</span>
            {inBookMatches.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-slate-950 text-amber-300 text-[10px] font-extrabold">
                {formatDigits(inBookMatches.length, currentLang)}
              </span>
            )}
          </button>

          {/* Single Consolidated Tools & Settings Drawer Button */}
          <button
            onClick={() => setShowToolsDrawer(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 text-white dark:bg-amber-500 dark:text-slate-950 hover:bg-slate-800 dark:hover:bg-amber-400 font-bold text-xs shadow-xs transition-all"
            title={t.readerView.settingsAndToolsTitle}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span className="hidden md:inline">{t.readerView.settingsAndTools}</span>
          </button>
        </div>
      </header>

      {/* Embedded In-Book Search Drawer / Header Bar */}
      {showInBookSearch && (
        <div className="z-30 bg-white/95 dark:bg-slate-900/95 border-b border-slate-200 dark:border-slate-800 p-3 shadow-lg transition-all animate-fadeIn select-none">
          <div className="max-w-3xl mx-auto flex flex-col gap-2.5">
            {/* Search Input Row */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute right-3 top-2.5 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  value={inBookQuery}
                  onChange={(e) => {
                    setInBookQuery(e.target.value);
                    setActiveMatchIndex(0);
                  }}
                  placeholder={t.readerView.searchPlaceholder}
                  className="w-full pr-9 pl-8 py-1.5 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-amber-500"
                  autoFocus
                />
                {inBookQuery && (
                  <button
                    onClick={() => setInBookQuery('')}
                    className="absolute left-2.5 top-2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Compact Sensible Filter Toggle Button */}
              <button
                onClick={() => setShowInBookFilters(!showInBookFilters)}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                  showInBookFilters ||
                  inBookFilterState.isExactWord ||
                  inBookFilterState.enableArabicPrefixes ||
                  inBookFilterState.enableArabicSuffixes
                    ? 'bg-amber-500/10 border-amber-500 text-amber-600 dark:text-amber-400'
                    : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                }`}
                title={t.readerView.filters}
              >
                <Filter className="w-3.5 h-3.5" />
                <span className="hidden xs:inline">{t.readerView.filters}</span>
              </button>

              <button
                onClick={() => setShowInBookSearch(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Collapsible Filter Panel */}
            {showInBookFilters && (
              <div className="p-2.5 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200/80 dark:border-slate-700/80 flex flex-wrap items-center gap-3 text-xs">
                <label className="flex items-center gap-1.5 cursor-pointer font-medium text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={inBookFilterState.isExactWord}
                    onChange={(e) =>
                      setInBookFilterState({
                        ...inBookFilterState,
                        isExactWord: e.target.checked,
                      })
                    }
                    className="accent-amber-500 rounded"
                  />
                  <span>{t.readerView.exactWord}</span>
                </label>

                <label className="flex items-center gap-1.5 cursor-pointer font-medium text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={inBookFilterState.ignoreTashkeel}
                    onChange={(e) =>
                      setInBookFilterState({
                        ...inBookFilterState,
                        ignoreTashkeel: e.target.checked,
                      })
                    }
                    className="accent-amber-500 rounded"
                  />
                  <span>{t.readerView.ignoreTashkeel}</span>
                </label>

                <label className="flex items-center gap-1.5 cursor-pointer font-medium text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={inBookFilterState.enableArabicPrefixes}
                    onChange={(e) =>
                      setInBookFilterState({
                        ...inBookFilterState,
                        enableArabicPrefixes: e.target.checked,
                      })
                    }
                    className="accent-amber-500 rounded"
                  />
                  <span>{t.readerView.arabicPrefixes}</span>
                </label>

                <label className="flex items-center gap-1.5 cursor-pointer font-medium text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={inBookFilterState.enableArabicSuffixes}
                    onChange={(e) =>
                      setInBookFilterState({
                        ...inBookFilterState,
                        enableArabicSuffixes: e.target.checked,
                      })
                    }
                    className="accent-amber-500 rounded"
                  />
                  <span>{t.readerView.arabicSuffixes}</span>
                </label>
              </div>
            )}

            {/* In-Book Search Matches List & Quick Navigation */}
            {inBookQuery.trim() && (
              <div className="flex flex-col gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-400">
                  <span>
                    {t.readerView.totalMatches}{' '}
                    <strong className="text-amber-600 dark:text-amber-400">
                      {formatDigits(inBookMatches.length, currentLang)}
                    </strong>
                  </span>

                  {inBookMatches.length > 0 && (
                    <div className="flex items-center gap-2">
                      <button
                        disabled={activeMatchIndex <= 0}
                        onClick={() => {
                          const prevIdx = activeMatchIndex - 1;
                          handleJumpToMatch(
                            inBookMatches[prevIdx].matchPos,
                            inBookMatches[prevIdx].pageIndex,
                            prevIdx
                          );
                        }}
                        className="px-2 py-0.5 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 disabled:opacity-40"
                      >
                        {t.readerView.prev}
                      </button>
                      <span>
                        {formatDigits(activeMatchIndex + 1, currentLang)} {t.readerView.of}{' '}
                        {formatDigits(inBookMatches.length, currentLang)}
                      </span>
                      <button
                        disabled={activeMatchIndex >= inBookMatches.length - 1}
                        onClick={() => {
                          const nextIdx = activeMatchIndex + 1;
                          handleJumpToMatch(
                            inBookMatches[nextIdx].matchPos,
                            inBookMatches[nextIdx].pageIndex,
                            nextIdx
                          );
                        }}
                        className="px-2 py-0.5 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 disabled:opacity-40"
                      >
                        {t.readerView.next}
                      </button>
                    </div>
                  )}
                </div>

                {/* Match Snippets Horizontal or Vertical Scroll Container */}
                {inBookMatches.length > 0 && (
                  <div className="max-h-40 overflow-y-auto flex flex-col gap-1.5 p-1">
                    {inBookMatches.slice(0, 30).map((m, idx) => (
                      <button
                        key={idx}
                        onClick={() =>
                          handleJumpToMatch(m.matchPos, m.pageIndex, idx)
                        }
                        className={`text-right p-2 rounded-xl text-xs transition-all border ${
                          activeMatchIndex === idx
                            ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-400 font-semibold'
                            : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200/60 dark:border-slate-800 hover:border-amber-300'
                        }`}
                      >
                        <div className="flex items-center justify-between text-[11px] text-slate-400 mb-0.5">
                          <span>{t.readerView.match} {formatDigits(idx + 1, currentLang)}</span>
                          <span className="font-bold text-amber-600 dark:text-amber-400">
                            {t.readerView.page} {formatDigits(m.pageIndex + 1, currentLang)}
                          </span>
                        </div>
                        <p className="line-clamp-1 font-serif text-slate-700 dark:text-slate-300">
                          {m.snippet}
                        </p>
                      </button>
                    ))}
                    {inBookMatches.length > 30 && (
                      <div className="text-center text-[11px] text-slate-400 py-1">
                        {t.readerView.moreMatches.replace('#', formatDigits(inBookMatches.length - 30, currentLang))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Floating/Top Page Navigation Bar (In Paginated Mode) */}
      {readerSettings.mode === 'paginated' && pages.length > 0 && (
        <div className="px-2 sm:px-3 py-1.5 border-b border-slate-200/80 dark:border-slate-800 bg-slate-100/90 dark:bg-slate-900/90 backdrop-blur-md flex items-center justify-between text-xs font-bold select-none gap-1 sm:gap-2 w-full max-w-full overflow-hidden">
          <button
            onClick={() =>
              setCurrentPageIndex((prev) => Math.max(0, prev - 1))
            }
            disabled={currentPageIndex === 0}
            className="flex items-center gap-0.5 sm:gap-1 px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 shadow-2xs border border-slate-200/80 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 shrink-0 whitespace-nowrap active:scale-95 transition-all text-slate-800 dark:text-slate-100 text-[11px] sm:text-xs cursor-pointer"
          >
            <ChevronRight className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span className="whitespace-nowrap">{t.readerView.prevPage}</span>
          </button>

          <div className="flex items-center gap-1 shrink-0 whitespace-nowrap bg-white/90 dark:bg-slate-800/90 px-2 sm:px-2.5 py-1 rounded-xl border border-slate-200/80 dark:border-slate-700 shadow-2xs text-[11px] sm:text-xs font-bold">
            <span className="text-slate-500 dark:text-slate-400">{t.readerView.page}</span>
            <select
              value={currentPageIndex}
              onChange={(e) => setCurrentPageIndex(Number(e.target.value))}
              className="px-1.5 py-0.5 rounded-lg bg-amber-500/10 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 font-extrabold text-xs text-center border border-amber-500/30 outline-none cursor-pointer hover:bg-amber-500/20 transition-colors"
            >
              {pages.map((_, idx) => (
                <option
                  key={idx}
                  value={idx}
                  className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-bold"
                >
                  {formatDigits(idx + 1, currentLang)}
                </option>
              ))}
            </select>
            <span className="text-slate-500 dark:text-slate-400">
              {t.readerView.of} {formatDigits(pages.length, currentLang)}
            </span>
          </div>

          <button
            onClick={() =>
              setCurrentPageIndex((prev) =>
                Math.min(pages.length - 1, prev + 1)
              )
            }
            disabled={currentPageIndex === pages.length - 1}
            className="flex items-center gap-0.5 sm:gap-1 px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 shadow-2xs border border-slate-200/80 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 shrink-0 whitespace-nowrap active:scale-95 transition-all text-slate-800 dark:text-slate-100 text-[11px] sm:text-xs cursor-pointer"
          >
            <span className="whitespace-nowrap">{t.readerView.nextPage}</span>
            <ChevronLeft className="w-3.5 h-3.5 text-amber-500 shrink-0" />
          </button>
        </div>
      )}

      {/* Main Text Content Container */}
      <div
        ref={readerRef}
        className="flex-1 overflow-y-auto px-6 py-8 max-w-4xl mx-auto w-full select-text transition-all duration-150"
      >
        <div
          style={{
            fontSize: `${readerSettings.fontSize}px`,
            lineHeight: readerSettings.lineHeight,
          }}
          className={`${getFontClass(
            readerSettings.fontFamily
          )} whitespace-pre-wrap word-break-words text-justify leading-relaxed`}
          dangerouslySetInnerHTML={{
            __html:
              readerSettings.mode === 'full'
                ? generateFormattedHTML(book.content)
                : generateFormattedHTML(currentPage.content),
          }}
        />
      </div>

      {/* Single Popover Bottom Drawer for Tools & Settings */}
      {showToolsDrawer && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-xs p-0 sm:p-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-t-3xl sm:rounded-3xl w-full max-w-xl max-h-[85vh] overflow-y-auto p-5 shadow-2xl flex flex-col gap-5 text-slate-900 dark:text-slate-100">
            {/* Drawer Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-5 h-5 text-amber-500" />
                <h3 className="font-extrabold text-sm">{t.readerView.readerSettingsTitle}</h3>
              </div>
              <button
                onClick={() => setShowToolsDrawer(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Actions: Copy Entire Page */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-3 bg-amber-500/5 dark:bg-amber-500/10 rounded-2xl border border-amber-500/20">
              <button
                onClick={handleCopyFullPageText}
                className="flex-1 flex items-center justify-center gap-2 px-3.5 py-2.5 bg-amber-500 hover:bg-amber-600 active:scale-98 text-slate-950 rounded-xl font-bold text-xs transition-all shadow-xs cursor-pointer"
                title={t.readerView.copyWholePageTitle}
              >
                <Copy className="w-4 h-4 text-slate-950" />
                <span>{t.readerView.copyWholePage}</span>
              </button>
            </div>

            {/* Section 1: Themes */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Palette className="w-4 h-4 text-amber-500" />
                <span>{t.readerView.themeLabel}</span>
              </label>

              <div className="grid grid-cols-5 gap-2">
                {(
                  [
                    { id: 'light', name: t.readerView.themeLight, bg: 'bg-white', text: 'text-slate-900' },
                    { id: 'cream', name: t.readerView.themeCream, bg: 'bg-[#faf8f5]', text: 'text-slate-800' },
                    { id: 'sepia', name: t.readerView.themeSepia, bg: 'bg-[#fbf0d9]', text: 'text-[#5f4b32]' },
                    { id: 'dark', name: t.readerView.themeDark, bg: 'bg-slate-900', text: 'text-slate-100' },
                    { id: 'emerald', name: t.readerView.themeEmerald, bg: 'bg-[#062c24]', text: 'text-[#d1fae5]' },
                  ] as const
                ).map((th) => (
                  <button
                    key={th.id}
                    onClick={() => onUpdateSettings({ theme: th.id as ReaderTheme })}
                    className={`flex flex-col items-center gap-1 p-2 rounded-2xl border-2 transition-all ${th.bg} ${th.text} ${
                      readerSettings.theme === th.id
                        ? 'border-amber-500 scale-105 shadow-md'
                        : 'border-slate-200 dark:border-slate-700 hover:border-amber-300'
                    }`}
                  >
                    <span className="text-[11px] font-bold">{th.name}</span>
                    {readerSettings.theme === th.id && (
                      <Check className="w-3.5 h-3.5 text-amber-500" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Section 2: Font Family & Font Size */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
              {/* Font Family */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Type className="w-4 h-4 text-amber-500" />
                  <span>{t.readerView.fontLabel}</span>
                </label>
                <div className="flex flex-col gap-1.5">
                  {(
                    [
                      { id: 'vazir', name: t.readerView.fontVazir, cls: 'font-vazir' },
                      { id: 'amiri', name: t.readerView.fontAmiri, cls: 'font-amiri' },
                      { id: 'scheherazade', name: t.readerView.fontScheherazade, cls: 'font-scheherazade' },
                    ] as const
                  ).map((f) => (
                    <button
                      key={f.id}
                      onClick={() => onUpdateSettings({ fontFamily: f.id as ReaderFont })}
                      className={`px-3 py-2 rounded-xl text-xs font-bold transition-all text-right border flex items-center justify-between ${
                        readerSettings.fontFamily === f.id
                          ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-500 text-amber-700 dark:text-amber-400'
                          : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <span className={f.cls}>{f.name}</span>
                      {readerSettings.fontFamily === f.id && (
                        <Check className="w-3.5 h-3.5 text-amber-500" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Font Size Adjuster */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Sliders className="w-4 h-4 text-amber-500" />
                  <span>{t.readerView.fontSizeAndSpacing}</span>
                </label>

                <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() =>
                        onUpdateSettings({
                          fontSize: Math.max(12, readerSettings.fontSize - 2),
                        })
                      }
                      className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100"
                    >
                      <Minus className="w-4 h-4" />
                    </button>

                    <span className="font-extrabold text-sm text-amber-600 dark:text-amber-400">
                      {formatDigits(readerSettings.fontSize, currentLang)}px
                    </span>

                    <button
                      onClick={() =>
                        onUpdateSettings({
                          fontSize: Math.min(36, readerSettings.fontSize + 2),
                        })
                      }
                      className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  <input
                    type="range"
                    min="12"
                    max="36"
                    value={readerSettings.fontSize}
                    onChange={(e) =>
                      onUpdateSettings({ fontSize: Number(e.target.value) })
                    }
                    className="accent-amber-500 cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Section 3: Reading Mode & Pagination */}
            <div className="flex flex-col gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-amber-500" />
                <span>{t.readerView.displayMode}</span>
              </label>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => onUpdateSettings({ mode: 'paginated' })}
                  className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                    readerSettings.mode === 'paginated'
                      ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-sm'
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <BookOpen className="w-4 h-4" />
                  <span>{t.readerView.pageByPage}</span>
                </button>

                <button
                  onClick={() => onUpdateSettings({ mode: 'full' })}
                  className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                    readerSettings.mode === 'full'
                      ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-sm'
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  <span>{t.readerView.continuous}</span>
                </button>
              </div>

              {readerSettings.mode === 'paginated' && (
                <div className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl text-xs font-semibold border border-slate-200/80 dark:border-slate-700/80 mt-1">
                  <span>{t.readerView.wordsPerPage}</span>
                  <select
                    value={readerSettings.paginationWordCount}
                    onChange={(e) =>
                      onUpdateSettings({
                        paginationWordCount: Number(e.target.value),
                      })
                    }
                    className="px-2 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold"
                  >
                    <option value={200}>{formatDigits(200, currentLang)} {t.readerView.wordsCount}</option>
                    <option value={300}>{formatDigits(300, currentLang)} {t.readerView.wordsCount}</option>
                    <option value={400}>{formatDigits(400, currentLang)} {t.readerView.wordsCount} ({t.readerView.defaultWords})</option>
                    <option value={500}>{formatDigits(500, currentLang)} {t.readerView.wordsCount}</option>
                    <option value={700}>{formatDigits(700, currentLang)} {t.readerView.wordsCount}</option>
                  </select>
                </div>
              )}
            </div>

            {/* Section 4: Category & Actions */}
            <div className="flex flex-col gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400">
                {t.readerView.fileManagement}
              </label>

              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold">{t.readerView.category}</span>
                  <select
                    value={book.category}
                    onChange={(e) =>
                      onUpdateBookCategory(book.id, e.target.value)
                    }
                    className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold"
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onToggleStar(book.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all ${
                      book.isFavorite
                        ? 'bg-amber-500/10 border-amber-500 text-amber-600 dark:text-amber-400'
                        : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <Star
                      className={`w-4 h-4 ${
                        book.isFavorite ? 'fill-amber-500 text-amber-500' : ''
                      }`}
                    />
                    <span>
                      {book.isFavorite ? t.readerView.inBookmarks : t.readerView.addToBookmarks}
                    </span>
                  </button>

                  <button
                    onClick={() => {
                      setShowToolsDrawer(false);
                      setShowDeleteConfirm(true);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/20 text-xs font-bold"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>{t.readerView.deleteFile}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating Text Selection Context Menu Popup */}
      {popupPos && (
        <div
          style={{
            left: `${popupPos.x}px`,
            top: `${popupPos.y}px`,
            transform: popupPos.isBelow ? 'translate(-50%, 0)' : 'translate(-50%, -100%)',
          }}
          className="fixed z-50 bg-slate-900/95 dark:bg-slate-900/95 backdrop-blur-md text-white rounded-xl p-1 shadow-2xl flex items-center gap-1 text-xs font-medium animate-fadeIn border border-slate-700/80 max-w-[calc(100vw-24px)] dir-rtl"
        >
          <button
            onClick={handleCopyText}
            className="flex items-center gap-1 px-2.5 py-1.5 hover:bg-slate-800 rounded-lg transition-colors shrink-0 cursor-pointer"
            title={t.readerView.copyTextTitle}
          >
            <Copy className="w-3.5 h-3.5 text-slate-300" />
            <span>{t.readerView.copy}</span>
          </button>

          <div className="w-px h-3.5 bg-slate-700 shrink-0" />

          <button
            onClick={() => setShowNoteModal(true)}
            className="flex items-center gap-1 px-2.5 py-1.5 hover:bg-slate-800 text-amber-400 rounded-lg transition-colors shrink-0 cursor-pointer font-semibold"
            title={t.readerView.highlightAndNoteTitle}
          >
            <Highlighter className="w-3.5 h-3.5" />
            <span>{t.readerView.highlight}</span>
          </button>

          <div className="w-px h-3.5 bg-slate-700 shrink-0" />

          <button
            onClick={() => setShowQuoteModal(true)}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg shadow-xs transition-colors shrink-0 cursor-pointer"
            title={t.readerView.quoteImageTitle}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>{t.readerView.quoteImage}</span>
          </button>
        </div>
      )}

      {/* Note & Highlight Modal */}
      {showNoteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md p-5 shadow-2xl flex flex-col gap-4 text-slate-900 dark:text-slate-100">
            <h3 className="font-bold text-sm flex items-center gap-2 text-amber-600">
              <Highlighter className="w-4 h-4" />
              <span>{t.readerView.addNoteTitle}</span>
            </h3>

            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs font-serif italic text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60 line-clamp-3">
              "{selectedText}"
            </div>

            {/* Color Tag Selection */}
            <div>
              <label className="text-xs font-bold text-slate-500 mb-1.5 block">
                {t.readerView.highlightColors}
              </label>
              <div className="flex items-center gap-2">
                {(['yellow', 'green', 'blue', 'pink'] as const).map((clr) => (
                  <button
                    key={clr}
                    onClick={() => setSelectedHighlightColor(clr)}
                    className={`w-7 h-7 rounded-full flex items-center justify-center border-2 ${
                      selectedHighlightColor === clr
                        ? 'border-slate-900 dark:border-white scale-110'
                        : 'border-transparent'
                    } ${
                      clr === 'yellow'
                        ? 'bg-yellow-300'
                        : clr === 'green'
                        ? 'bg-emerald-300'
                        : clr === 'blue'
                        ? 'bg-sky-300'
                        : 'bg-pink-300'
                    }`}
                  >
                    {selectedHighlightColor === clr && (
                      <Check className="w-3.5 h-3.5 text-slate-900" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Note Input */}
            <div>
              <label className="text-xs font-bold text-slate-500 mb-1 block">
                {t.readerView.yourNoteLabel}
              </label>
              <textarea
                value={noteInput}
                onChange={(e) => setNoteInput(e.target.value)}
                placeholder={t.readerView.notePlaceholder}
                className="w-full h-24 p-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setShowNoteModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                {t.readerView.cancel}
              </button>
              <button
                onClick={handleSaveHighlight}
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs"
              >
                {t.readerView.saveHighlight}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quote Image Generator Modal */}
      <QuoteImageModal
        isOpen={showQuoteModal}
        onClose={() => setShowQuoteModal(false)}
        quoteText={selectedText}
        bookTitle={book.name}
      />

      {/* Modal: Single Book Delete Confirmation */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl text-right">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center mb-4">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 mb-2">
              {t.readerView.deleteBookConfirmTitle}
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 mb-6 leading-relaxed">
              {t.readerView.deleteBookConfirmDesc.replace('{title}', book.name)}
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  onDeleteBook(book.id, book.name);
                }}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer"
              >
                {t.readerView.deleteBookBtn}
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold text-xs transition-all cursor-pointer"
              >
                {t.readerView.cancel}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
