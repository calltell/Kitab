import React, { useState, useEffect } from 'react';
import {
  BookFile,
  SearchFilterState,
  ReaderSettings,
  HighlightBookmark,
  HistoryItem,
  OperationProgressState,
} from './types';
import {
  getBooks,
  saveBooksBatch,
  updateBook,
  updateBooksBatch,
  deleteBook,
  deleteBooksBatch,
  clearAllBooks,
  getCategories,
  saveCategories,
  resetCategoriesToDefault,
  getBookmarks,
  saveBookmark,
  deleteBookmark,
  clearAllBookmarks,
  getHistory,
  addToHistory,
  clearHistory,
  getReaderSettings,
  saveReaderSettings,
} from './utils/storage';

import { Header } from './components/Header';
import { BottomNav, TabType } from './components/BottomNav';
import { SearchView } from './components/SearchView';
import { LibraryView } from './components/LibraryView';
import { BookReaderView } from './components/BookReaderView';
import { BookmarksNotesView } from './components/BookmarksNotesView';
import { HistoryView } from './components/HistoryView';
import { SettingsView } from './components/SettingsView';
import { SearchFilterModal } from './components/SearchFilterModal';
import { ProgressModal } from './components/ProgressModal';


export default function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('app_theme') as 'light' | 'dark') || 'light';
  });
  const [activeTab, setActiveTab] = useState<TabType | 'reader'>('search');

  // Application Data States
  const [books, setBooks] = useState<BookFile[]>([]);
  const [categories, setCategoriesState] = useState<string[]>([]);
  const [bookmarks, setBookmarksState] = useState<HighlightBookmark[]>([]);
  const [historyItems, setHistoryItemsState] = useState<HistoryItem[]>([]);
  const [readerSettings, setReaderSettingsState] = useState<ReaderSettings>(
    getReaderSettings()
  );

  // Search Filter State
  const [filterState, setFilterState] = useState<SearchFilterState>({
    isExactWord: true,
    ignoreTashkeel: true,
    enableArabicPrefixes: false,
    enableArabicSuffixes: false,
    enableMultiWord: false,
    multiWordMode: 'PROXIMITY_PAGE',
    searchSortMode: 'DEFAULT',
    searchScope: 'ALL',
    onlyFavorites: false,
    selectedCategories: [],
  });

  // Reader States
  const [currentBookId, setCurrentBookId] = useState<number | null>(null);
  const [targetMatchPos, setTargetMatchPos] = useState<number>(-1);
  const [searchQueryState, setSearchQueryState] = useState<string>('');

  // Modals States
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

  // Global Progress Overlay State
  const [progressState, setProgressState] = useState<OperationProgressState>({
    isOpen: false,
    title: '',
    subtitle: '',
    currentStep: 0,
    totalSteps: 0,
    percentage: 0,
    statusText: '',
    details: '',
    type: 'import',
  });

  // Initial Data Loader
  useEffect(() => {
    async function initData() {
      const bList = await getBooks();
      setBooks(bList);
      setCategoriesState(getCategories());
      setBookmarksState(getBookmarks());
      setHistoryItemsState(getHistory());
      setReaderSettingsState(getReaderSettings());
    }
    initData();
  }, []);

  // Sync theme with HTML root class & localStorage
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark');
    }
  }, [theme]);

  // Sync app theme scheme palette attribute
  useEffect(() => {
    const currentThemeScheme = readerSettings.appTheme || 'navy_gold';
    document.documentElement.setAttribute('data-theme', currentThemeScheme);
  }, [readerSettings.appTheme]);

  const toggleTheme = () => {
    setTheme((prev) => {
      const next = prev === 'light' ? 'dark' : 'light';
      localStorage.setItem('app_theme', next);
      return next;
    });
  };

  // File Upload Handler with Progress Percentage
  const handleUploadFiles = async (files: File[]) => {
    if (files.length === 0) return;

    setProgressState({
      isOpen: true,
      title: 'درحال ورود و پردازش فایل‌ها',
      subtitle: `${files.length.toLocaleString('fa-IR')} فایل انتخاب شد`,
      currentStep: 0,
      totalSteps: files.length,
      percentage: 0,
      statusText: 'آغاز خواندن متون...',
      type: 'import',
    });

    const parsedChunk: Omit<BookFile, 'id'>[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const stepPct = Math.round(((i + 0.5) / files.length) * 85);

      setProgressState({
        isOpen: true,
        title: 'درحال ورود و پردازش فایل‌ها',
        subtitle: file.name,
        currentStep: i + 1,
        totalSteps: files.length,
        percentage: stepPct,
        statusText: `استخراج متن: ${file.name}`,
        details: `حجم: ${Math.round(file.size / 1024)}KB`,
        type: 'import',
      });

      // Small UI tick for smooth animation
      await new Promise((r) => setTimeout(r, 60));

      try {
        const text = await file.text();
        let detectedCat = 'بدون دسته‌بندی';
        for (const c of categories) {
          if (c !== 'بدون دسته‌بندی' && file.name.includes(c)) {
            detectedCat = c;
            break;
          }
        }
        parsedChunk.push({
          name: file.name,
          content: text,
          size: file.size || text.length,
          category: detectedCat,
          isFavorite: false,
          dateAdded: Date.now(),
        });
      } catch (err) {
        console.error('Failed to read file:', file.name, err);
      }
    }

    if (parsedChunk.length > 0) {
      const batchSize = 25;
      const totalBatches = Math.ceil(parsedChunk.length / batchSize);
      for (let b = 0; b < totalBatches; b++) {
        const chunk = parsedChunk.slice(b * batchSize, (b + 1) * batchSize);
        setProgressState((p) => ({
          ...p,
          percentage: 85 + Math.round(((b + 1) / totalBatches) * 12),
          statusText: `ذخیره‌سازی بخش ${b + 1} از ${totalBatches} در بانک اطلاعاتی...`,
        }));
        await saveBooksBatch(chunk);
      }
      const refreshed = await getBooks();
      setBooks(refreshed);
    }

    setProgressState({
      isOpen: true,
      title: 'ورود متون با موفقیت انجام شد',
      subtitle: `${parsedChunk.length.toLocaleString('fa-IR')} کتاب به کتابخانه اضافه گردید`,
      currentStep: files.length,
      totalSteps: files.length,
      percentage: 100,
      statusText: 'تکمیل عملیات!',
      type: 'import',
    });

    setTimeout(() => {
      setProgressState((p) => ({ ...p, isOpen: false }));
    }, 1000);
  };

  // Open Book Reader
  const handleOpenReader = (bookId: number, matchPos: number = -1, query: string = '') => {
    const book = books.find((b) => b.id === bookId);
    if (!book) return;

    setCurrentBookId(bookId);
    setTargetMatchPos(matchPos);
    setSearchQueryState(query);

    // Update last opened timestamp & history
    const updatedBook: BookFile = {
      ...book,
      lastOpened: Date.now(),
    };
    updateBook(updatedBook);

    setBooks((prev) => prev.map((b) => (b.id === bookId ? updatedBook : b)));

    const nextHistory = addToHistory(
      book.id,
      book.name,
      book.category,
      book.lastReadPage || 0
    );
    setHistoryItemsState(nextHistory);

    setActiveTab('reader');
  };

  // Toggle Favorite Star
  const handleToggleStar = async (bookId: number) => {
    const book = books.find((b) => b.id === bookId);
    if (!book) return;

    const updated = { ...book, isFavorite: !book.isFavorite };
    await updateBook(updated);
    setBooks((prev) => prev.map((b) => (b.id === bookId ? updated : b)));
  };

  // Delete Single Book
  const handleDeleteBook = async (bookId: number) => {
    const updated = await deleteBook(bookId, books);
    setBooks(updated);
    if (currentBookId === bookId) {
      setActiveTab('search');
      setCurrentBookId(null);
    }
  };

  // Restore Batch Handler with Progress Percentage

  const handleRestoreBooksBatch = async (imported: Omit<BookFile, 'id'>[]) => {
    if (imported.length === 0) return;

    setProgressState({
      isOpen: true,
      title: 'درحال بازیابی فایل پشتیبان',
      subtitle: `${imported.length.toLocaleString('fa-IR')} کتاب در فایل پشتیبان`,
      currentStep: 0,
      totalSteps: imported.length,
      percentage: 0,
      statusText: 'آماده‌سازی برای ذخیره...',
      type: 'import',
    });

    const batchSize = 3;
    const totalBatches = Math.ceil(imported.length / batchSize);

    for (let b = 0; b < totalBatches; b++) {
      const chunk = imported.slice(b * batchSize, (b + 1) * batchSize);
      const stepPct = Math.round(((b + 1) / totalBatches) * 90);

      setProgressState({
        isOpen: true,
        title: 'درحال بازیابی فایل پشتیبان',
        subtitle: `بخش ${b + 1} از ${totalBatches}`,
        currentStep: Math.min((b + 1) * batchSize, imported.length),
        totalSteps: imported.length,
        percentage: stepPct,
        statusText: `ذخیره‌سازی ${chunk.length} کتاب در بانک داده...`,
        type: 'import',
      });

      await saveBooksBatch(chunk);
      await new Promise((r) => setTimeout(r, 80));
    }

    const refreshed = await getBooks();
    setBooks(refreshed);

    setProgressState({
      isOpen: true,
      title: 'پشتیبان با موفقیت بازیابی شد',
      subtitle: `${imported.length.toLocaleString('fa-IR')} کتاب بازیابی گردید`,
      currentStep: imported.length,
      totalSteps: imported.length,
      percentage: 100,
      statusText: 'تکمیل بازنویسی داده‌ها!',
      type: 'import',
    });

    setTimeout(() => {
      setProgressState((p) => ({ ...p, isOpen: false }));
    }, 1000);
  };

  // Export JSON Backup with Progress Percentage
  const handleExportBackup = async () => {
    if (books.length === 0) return;

    setProgressState({
      isOpen: true,
      title: 'درحال خروجی گرفتن از متون کتابخانه',
      subtitle: `${books.length.toLocaleString('fa-IR')} کتاب موجود`,
      currentStep: 0,
      totalSteps: books.length,
      percentage: 10,
      statusText: 'جمع‌آوری متون...',
      type: 'export',
    });

    await new Promise((r) => setTimeout(r, 120));

    setProgressState({
      isOpen: true,
      title: 'درحال خروجی گرفتن از متون کتابخانه',
      subtitle: 'فرمت‌بندی فایل JSON...',
      currentStep: Math.round(books.length / 2),
      totalSteps: books.length,
      percentage: 60,
      statusText: 'فشرده‌سازی و آمادگی دانلود...',
      type: 'export',
    });

    await new Promise((r) => setTimeout(r, 150));

    const jsonString = JSON.stringify(books, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Islamic_Library_Backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);

    setProgressState({
      isOpen: true,
      title: 'فایل پشتیبان آماده و دانلود شد',
      subtitle: 'ذخیره در سیستم با موفقیت انجام یافت',
      currentStep: books.length,
      totalSteps: books.length,
      percentage: 100,
      statusText: 'تکمیل دانلود!',
      type: 'export',
    });

    setTimeout(() => {
      setProgressState((p) => ({ ...p, isOpen: false }));
    }, 1000);
  };

  // Bulk Delete with Progress
  const handleBulkDelete = async (bookIds: number[]) => {
    if (bookIds.length === 0) return;

    const total = bookIds.length;
    const deleteSet = new Set(bookIds);

    if (total > 1) {
      setProgressState({
        isOpen: true,
        title: 'درحال حذف گروهی کتاب‌ها',
        subtitle: `${total.toLocaleString('fa-IR')} کتاب در حال حذف`,
        currentStep: 0,
        totalSteps: total,
        percentage: 0,
        statusText: 'پاک‌سازی از بانک داده...',
        type: 'delete',
      });
    }

    const updated = await deleteBooksBatch(
      bookIds,
      (current, count) => {
        if (total > 1) {
          const pct = Math.round((current / count) * 95);
          setProgressState((p) => ({
            ...p,
            currentStep: current,
            percentage: pct,
            statusText: `حذف ${current.toLocaleString('fa-IR')} از ${count.toLocaleString('fa-IR')} کتاب...`,
          }));
        }
      },
      books
    );

    setBooks(updated);

    if (currentBookId !== null && deleteSet.has(currentBookId)) {
      setCurrentBookId(null);
      setActiveTab('search');
    }

    if (total > 1) {
      setProgressState({
        isOpen: true,
        title: 'حذف گروهی با موفقیت انجام شد',
        subtitle: `${total.toLocaleString('fa-IR')} کتاب حذف شدند`,
        currentStep: total,
        totalSteps: total,
        percentage: 100,
        statusText: 'پایان پاک‌سازی!',
        type: 'delete',
      });

      setTimeout(() => {
        setProgressState((p) => ({ ...p, isOpen: false }));
      }, 600);
    }
  };

  // Bulk Category with Progress
  const handleBulkChangeCategory = async (bookIds: number[], newCategory: string) => {
    if (bookIds.length === 0) return;

    const total = bookIds.length;
    const idSet = new Set(bookIds);

    if (total > 1) {
      setProgressState({
        isOpen: true,
        title: 'درحال تغییر دسته‌بندی گروهی',
        subtitle: `انتقال به «${newCategory}»`,
        currentStep: 0,
        totalSteps: total,
        percentage: 0,
        statusText: 'اعمال بر روی متون...',
        type: 'import',
      });
    }

    const booksToUpdate = books.filter((b) => idSet.has(b.id)).map((b) => ({ ...b, category: newCategory }));

    await updateBooksBatch(booksToUpdate, (current, count) => {
      if (total > 1) {
        const pct = Math.round((current / count) * 90);
        setProgressState((p) => ({
          ...p,
          currentStep: current,
          percentage: pct,
          statusText: `بروزرسانی ${current.toLocaleString('fa-IR')} از ${count.toLocaleString('fa-IR')} کتاب...`,
        }));
      }
    });

    setBooks((prev) =>
      prev.map((b) => (idSet.has(b.id) ? { ...b, category: newCategory } : b))
    );

    if (total > 1) {
      setProgressState({
        isOpen: true,
        title: 'دسته‌بندی با موفقیت تغییر کرد',
        subtitle: `${total.toLocaleString('fa-IR')} کتاب بروزرسانی شدند`,
        currentStep: total,
        totalSteps: total,
        percentage: 100,
        statusText: 'تکمیل بروزرسانی!',
        type: 'import',
      });

      setTimeout(() => {
        setProgressState((p) => ({ ...p, isOpen: false }));
      }, 800);
    }
  };


  // Category Management
  const handleAddCategory = (catName: string) => {
    if (categories.includes(catName)) return;
    const updated = [...categories, catName];
    setCategoriesState(updated);
    saveCategories(updated);
  };

  const handleDeleteCategory = async (catName: string) => {
    const affected = books.filter((b) => b.category === catName);
    if (affected.length > 0) {
      const updatedList = affected.map((b) => ({ ...b, category: 'بدون دسته‌بندی' }));
      await updateBooksBatch(updatedList);
      setBooks((prev) =>
        prev.map((b) => (b.category === catName ? { ...b, category: 'بدون دسته‌بندی' } : b))
      );
    }

    const updatedCats = categories.filter((c) => c !== catName);
    setCategoriesState(updatedCats);
    saveCategories(updatedCats);
  };

  // Bookmarks & Highlights
  const handleSaveBookmark = (bookmark: HighlightBookmark) => {
    const updated = saveBookmark(bookmark);
    setBookmarksState(updated);
  };

  const handleDeleteBookmark = (id: string) => {
    const updated = deleteBookmark(id);
    setBookmarksState(updated);
  };

  // Reader Settings Update
  const handleUpdateReaderSettings = (settingsPartial: Partial<ReaderSettings>) => {
    const updated = saveReaderSettings(settingsPartial);
    setReaderSettingsState(updated);
  };

  // Reset Specific Storage Sections
  const handleClearAllBooks = async () => {
    const emptyBooks = await clearAllBooks();
    setBooks(emptyBooks);
    if (currentBookId !== null) {
      setCurrentBookId(null);
      setActiveTab('search');
    }
  };

  const handleClearAllBookmarks = () => {
    const empty = clearAllBookmarks();
    setBookmarksState(empty);
  };

  const handleClearAllHistory = () => {
    clearHistory();
    setHistoryItemsState([]);
  };

  const handleResetCategories = async () => {
    const defaultCats = resetCategoriesToDefault();
    setCategoriesState(defaultCats);
    for (const b of books) {
      if (b.category && !defaultCats.includes(b.category)) {
        await updateBook({ ...b, category: 'بدون دسته‌بندی' });
      }
    }
    const refreshed = await getBooks();
    setBooks(refreshed);
  };

  // Reset Application Data
  const handleResetAllData = () => {
    localStorage.clear();
    try {
      indexedDB.deleteDatabase('IslamicLibraryDB');
    } catch (e) {}
    window.location.reload();
  };

  const currentBook = books.find((b) => b.id === currentBookId);

  return (
    <div className={`min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-['Vazirmatn',sans-serif] selection:bg-amber-500/30 selection:text-amber-900 dark:selection:text-amber-200 ${theme === 'dark' ? 'dark' : ''}`}>
      {/* Top Header (Shown unless in full reader view) */}
      {activeTab !== 'reader' && (
        <Header
          theme={theme}
          onToggleTheme={toggleTheme}
          bookCount={books.length}
          appLanguage={readerSettings.appLanguage || 'fa'}
        />
      )}

      {/* Main View Router */}
      <main className="flex-1 w-full max-w-full">
        {activeTab === 'search' && (
          <SearchView
            books={books}
            filterState={filterState}
            onOpenFilterModal={() => setIsFilterModalOpen(true)}
            onOpenReader={handleOpenReader}
            onToggleStar={handleToggleStar}
            onDeleteBook={handleDeleteBook}
            appLanguage={readerSettings.appLanguage || 'fa'}
          />
        )}

        {activeTab === 'library' && (
          <LibraryView
            books={books}
            categories={categories}
            onUploadFiles={handleUploadFiles}
            onOpenReader={handleOpenReader}
            onToggleStar={handleToggleStar}
            onDeleteBook={handleDeleteBook}
            onBulkDelete={handleBulkDelete}
            onBulkChangeCategory={handleBulkChangeCategory}
            appLanguage={readerSettings.appLanguage || 'fa'}
          />
        )}

        {activeTab === 'bookmarks' && (
          <BookmarksNotesView
            bookmarks={bookmarks}
            onOpenReader={handleOpenReader}
            onDeleteBookmark={handleDeleteBookmark}
            appLanguage={readerSettings.appLanguage || 'fa'}
          />
        )}

        {activeTab === 'history' && (
          <HistoryView
            historyItems={historyItems}
            onOpenReader={handleOpenReader}
            onClearHistory={() => {
              clearHistory();
              setHistoryItemsState([]);
            }}
            appLanguage={readerSettings.appLanguage || 'fa'}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsView
            categories={categories}
            readerSettings={readerSettings}
            books={books}
            onAddCategory={handleAddCategory}
            onDeleteCategory={handleDeleteCategory}
            onUpdateSettings={handleUpdateReaderSettings}
            onRestoreBooksBatch={handleRestoreBooksBatch}
            onExportBackup={handleExportBackup}
            onResetAllData={handleResetAllData}
            onClearAllBooks={handleClearAllBooks}
            onClearAllBookmarks={handleClearAllBookmarks}
            onClearAllHistory={handleClearAllHistory}
            onResetCategories={handleResetCategories}
          />
        )}

        {activeTab === 'reader' && currentBook && (
          <BookReaderView
            book={currentBook}
            readerSettings={readerSettings}
            categories={categories}
            targetMatchPos={targetMatchPos}
            searchQuery={searchQueryState}
            onBack={() => setActiveTab('search')}
            onUpdateSettings={handleUpdateReaderSettings}
            onUpdateBookCategory={async (bId, cat) => {
              const b = books.find((x) => x.id === bId);
              if (b) {
                const updated = { ...b, category: cat };
                await updateBook(updated);
                setBooks((prev) => prev.map((x) => (x.id === bId ? updated : x)));
              }
            }}
            onToggleStar={handleToggleStar}
            onDeleteBook={handleDeleteBook}
            onSaveBookmark={handleSaveBookmark}
          />
        )}
      </main>

      {/* Global Operation Progress Modal */}
      <ProgressModal
        progress={progressState}
        onClose={() => setProgressState((prev) => ({ ...prev, isOpen: false }))}
        appLanguage={readerSettings.appLanguage || 'fa'}
      />

      {/* Bottom Floating Navigation (Shown unless in reader view) */}

      {activeTab !== 'reader' && (
        <BottomNav
          activeTab={activeTab as TabType}
          onTabChange={(tab) => setActiveTab(tab)}
          bookmarksCount={bookmarks.length}
          appLanguage={readerSettings.appLanguage || 'fa'}
        />
      )}

      {/* Search Filter Modal */}
      <SearchFilterModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        filterState={filterState}
        onChangeFilter={(updated) =>
          setFilterState((prev) => ({ ...prev, ...updated }))
        }
        categories={categories}
        appLanguage={readerSettings.appLanguage || 'fa'}
      />
    </div>
  );
}
