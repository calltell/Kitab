import {
  BookFile,
  HistoryItem,
  ReaderSettings,
  HighlightBookmark,
} from '../types';
import { INITIAL_SAMPLE_BOOKS } from '../data/sampleBooks';

const DB_NAME = 'IslamicLibraryDB';
const DB_VERSION = 2;

let dbInstance: IDBDatabase | null = null;

function openDB(): Promise<IDBDatabase> {
  if (dbInstance) return Promise.resolve(dbInstance);

  return new Promise((resolve, reject) => {
    try {
      if (typeof indexedDB === 'undefined') {
        return reject(new Error('IndexedDB unavailable'));
      }

      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
        try {
          const db = (event.target as IDBOpenDBRequest).result;

          if (!db.objectStoreNames.contains('books')) {
            db.createObjectStore('books', { keyPath: 'id', autoIncrement: true });
          }
          if (!db.objectStoreNames.contains('categories')) {
            db.createObjectStore('categories', { keyPath: 'name' });
          }
          if (!db.objectStoreNames.contains('bookmarks')) {
            db.createObjectStore('bookmarks', { keyPath: 'id' });
          }
          if (!db.objectStoreNames.contains('history')) {
            db.createObjectStore('history', { keyPath: 'id', autoIncrement: true });
          }
        } catch (e) {
          console.error('IndexedDB upgrade error:', e);
        }
      };

  request.onsuccess = (event: Event) => {
    dbInstance = (event.target as IDBOpenDBRequest).result;
    dbInstance.onclose = () => { dbInstance = null; };
    dbInstance.onerror = () => { dbInstance = null; };
    resolve(dbInstance);
  };

      request.onerror = () => {
        reject(new Error('Failed to open IndexedDB'));
      };

      request.onblocked = () => {
        reject(new Error('IndexedDB blocked'));
      };
    } catch (e) {
      reject(e);
    }
  });
}

// Default Categories
export const DEFAULT_CATEGORIES = [
  'صرف',
  'نحو',
  'قرآن',
  'حدیث',
  'فقه',
  'عقاید',
  'ادعیه',
  'تاریخ',
  'ادبیات',
  'بدون دسته‌بندی',
];

export const DEFAULT_READER_SETTINGS: ReaderSettings = {
  mode: 'paginated',
  fontSize: 18,
  lineHeight: 2.1,
  theme: 'cream',
  fontFamily: 'vazir',
  paginationMode: 'WORDS',
  paginationWordCount: 400,
  paginationPattern: '[صفحه #]\n(ص: #)\nجـ #(ص: #)',
  appLanguage: 'fa',
  appTheme: 'navy_gold',
};

// Purge/Sanitize Shia books helper keyword matcher
function isShiaBook(name: string): boolean {
  const keywords = [
    'نهج البلاغ',
    'نهج‌البلاغ',
    'الكافي',
    'الكافي',
    'اصول کافی',
    'أصول الكافي',
    'تفسير الميزان',
    'الميزان',
    'صحيفة سجادية',
    'الصحيفة السجادية',
    'بحار الأنوار',
    'الاستبصار',
    'التهذيب',
    'من لا يحضره الفقيه',
  ];
  return keywords.some((kw) => name.includes(kw));
}

function isDefaultSampleBook(name: string): boolean {
  if (!name) return false;
  return (
    name.includes('البناء') ||
    name.includes('الآجرومية') ||
    name.includes('الاجرومية') ||
    name.includes('آجروم') ||
    name.includes('اجروم') ||
    name.includes('الأذكار') ||
    name.includes('الاذكار') ||
    name.includes('النووي') ||
    name.includes('صحيح البخاري') ||
    name.includes('صحيح مسلم') ||
    name.includes('تفسير ابن كثير') ||
    name.includes('رياض الصالحين')
  );
}

function deduplicateBooks(list: BookFile[]): BookFile[] {
  const seen = new Set<number>();
  const result: BookFile[] = [];
  for (const item of list) {
    if (item && item.id && !seen.has(item.id)) {
      seen.add(item.id);
      result.push(item);
    }
  }
  return result;
}

// Books API
export async function getBooks(): Promise<BookFile[]> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction('books', 'readonly');
      const store = tx.objectStore('books');
      const req = store.getAll();

      req.onsuccess = () => {
        let list: BookFile[] = [];
        try {
          list = deduplicateBooks(req.result || []);
        } catch (e) {
          console.error('Error processing books list:', e);
        }

        try {
          saveFallbackBooks(list);
        } catch (e) {
          // Never let localStorage quota errors interrupt IndexedDB resolution
        }

        resolve(list.reverse());
      };

      req.onerror = () => {
        console.error('IndexedDB getAll error:', req.error);
        resolve(getFallbackBooksSanitized());
      };
    });
  } catch (e) {
    console.error('Failed to open IndexedDB in getBooks:', e);
    return getFallbackBooksSanitized();
  }
}

function getFallbackBooksSanitized(): BookFile[] {
  return deduplicateBooks(getFallbackBooks());
}

export async function saveBooksBatch(newBooks: Omit<BookFile, 'id'>[]): Promise<BookFile[]> {
  if (newBooks.length === 0) return await getBooks();

  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction('books', 'readwrite');
      const store = tx.objectStore('books');

      const baseTime = Date.now();
      for (let i = 0; i < newBooks.length; i++) {
        const b = newBooks[i];
        const book: BookFile = {
          ...b,
          id: baseTime + i + Math.floor(Math.random() * 100000) + 1,
        };
        store.put(book);
      }

      tx.oncomplete = () => resolve();
      tx.onerror = (e) => reject(tx.error || e);
      tx.onabort = (e) => reject(tx.error || e);
    });

    const allBooks = await getBooks();
    try {
      saveFallbackBooks(allBooks);
    } catch (e) {}
    return allBooks;
  } catch (e) {
    console.error('Error saving batch to IndexedDB:', e);
    return await getBooks();
  }
}

export async function updateBook(book: BookFile): Promise<void> {
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction('books', 'readwrite');
      const store = tx.objectStore('books');
      store.put(book);
      tx.oncomplete = () => resolve();
      tx.onerror = (e) => reject(tx.error || e);
    });
  } catch (e) {
    console.error('Error updating book in IndexedDB:', e);
  }
}

export async function deleteBook(
  id: number,
  existingBooks?: BookFile[]
): Promise<BookFile[]> {
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction('books', 'readwrite');
      const store = tx.objectStore('books');
      store.delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = (e) => reject(tx.error || e);
    });
  } catch (e) {
    console.error('Error deleting book from IndexedDB:', e);
  }

  if (existingBooks) {
    return existingBooks.filter((b) => b.id !== id);
  }
  return await getBooks();
}

export async function deleteBooksBatch(
  ids: number[],
  onProgress?: (current: number, total: number) => void,
  existingBooks?: BookFile[]
): Promise<BookFile[]> {
  if (!ids || ids.length === 0) {
    return existingBooks ? existingBooks : await getBooks();
  }

  try {
    const db = await openDB();
    const total = ids.length;
    // Chunk size 150 gives optimal balance between IndexedDB write throughput
    // and letting the browser render frame updates so UI never freezes.
    const chunkSize = 150;

    for (let i = 0; i < total; i += chunkSize) {
      const chunk = ids.slice(i, i + chunkSize);
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction('books', 'readwrite');
        const store = tx.objectStore('books');
        for (const id of chunk) {
          store.delete(id);
        }
        tx.oncomplete = () => resolve();
        tx.onerror = (e) => reject(tx.error || e);
        tx.onabort = (e) => reject(tx.error || e);
      });

      const currentDone = Math.min(i + chunkSize, total);
      if (onProgress) {
        onProgress(currentDone, total);
      }

      // Yield event loop tick for UI frame rendering
      if (total > chunkSize) {
        await new Promise((r) => setTimeout(r, 0));
      }
    }
  } catch (e) {
    console.error('Error deleting batch from IndexedDB:', e);
  }

  if (existingBooks) {
    const idSet = new Set(ids);
    return existingBooks.filter((b) => !idSet.has(b.id));
  }
  return await getBooks();
}

export async function updateBooksBatch(
  updatedBooks: BookFile[],
  onProgress?: (current: number, total: number) => void
): Promise<void> {
  if (!updatedBooks || updatedBooks.length === 0) return;

  try {
    const db = await openDB();
    const total = updatedBooks.length;
    const chunkSize = 150;

    for (let i = 0; i < total; i += chunkSize) {
      const chunk = updatedBooks.slice(i, i + chunkSize);
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction('books', 'readwrite');
        const store = tx.objectStore('books');
        for (const book of chunk) {
          store.put(book);
        }
        tx.oncomplete = () => resolve();
        tx.onerror = (e) => reject(tx.error || e);
        tx.onabort = (e) => reject(tx.error || e);
      });

      const currentDone = Math.min(i + chunkSize, total);
      if (onProgress) {
        onProgress(currentDone, total);
      }

      if (total > chunkSize) {
        await new Promise((r) => setTimeout(r, 0));
      }
    }
  } catch (e) {
    console.error('Error updating batch in IndexedDB:', e);
  }
}

export async function clearAllBooks(): Promise<BookFile[]> {
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction('books', 'readwrite');
      const store = tx.objectStore('books');
      store.clear();
      tx.oncomplete = () => resolve();
      tx.onerror = (e) => reject(tx.error || e);
    });
  } catch (e) {
    console.error('Error clearing books from IndexedDB:', e);
  }
  try {
    localStorage.removeItem('app_books_fallback');
  } catch (e) {}
  return [];
}

// Categories API
export function getCategories(): string[] {
  try {
    const stored = localStorage.getItem('app_categories');
    if (stored) return JSON.parse(stored);
  } catch (e) {}
  return DEFAULT_CATEGORIES;
}

export function saveCategories(categories: string[]): void {
  try {
    localStorage.setItem('app_categories', JSON.stringify(categories));
  } catch (e) {}
}

export function resetCategoriesToDefault(): string[] {
  try {
    localStorage.removeItem('app_categories');
  } catch (e) {}
  return DEFAULT_CATEGORIES;
}

// Bookmarks & Highlights API
export function getBookmarks(): HighlightBookmark[] {
  try {
    const stored = localStorage.getItem('app_bookmarks');
    if (stored) return JSON.parse(stored);
  } catch (e) {}
  return [];
}

export function saveBookmark(bookmark: HighlightBookmark): HighlightBookmark[] {
  const current = getBookmarks();
  const updated = [bookmark, ...current];
  try {
    localStorage.setItem('app_bookmarks', JSON.stringify(updated));
  } catch (e) {}
  return updated;
}

export function deleteBookmark(id: string): HighlightBookmark[] {
  const current = getBookmarks();
  const updated = current.filter((b) => b.id !== id);
  try {
    localStorage.setItem('app_bookmarks', JSON.stringify(updated));
  } catch (e) {}
  return updated;
}

export function clearAllBookmarks(): HighlightBookmark[] {
  try {
    localStorage.removeItem('app_bookmarks');
  } catch (e) {}
  return [];
}

// History API
export function getHistory(): HistoryItem[] {
  try {
    const stored = localStorage.getItem('app_history');
    if (stored) return JSON.parse(stored);
  } catch (e) {}
  return [];
}

export function addToHistory(
  fileId: number,
  fileName: string,
  fileCategory: string,
  pageIndex?: number
): HistoryItem[] {
  let list = getHistory();
  list = list.filter((h) => h.fileId !== fileId);
  const newItem: HistoryItem = {
    id: Date.now(),
    fileId,
    fileName,
    fileCategory,
    timestamp: Date.now(),
    pageIndex,
  };
  list.unshift(newItem);
  if (list.length > 50) list = list.slice(0, 50); // limit 50
  try {
    localStorage.setItem('app_history', JSON.stringify(list));
  } catch (e) {}
  return list;
}

export function clearHistory(): void {
  try {
    localStorage.removeItem('app_history');
  } catch (e) {}
}

// Reader Settings API
export function getReaderSettings(): ReaderSettings {
  try {
    const stored = localStorage.getItem('app_reader_settings');
    if (stored) return { ...DEFAULT_READER_SETTINGS, ...JSON.parse(stored) };
  } catch (e) {}
  return DEFAULT_READER_SETTINGS;
}

export function saveReaderSettings(settings: Partial<ReaderSettings>): ReaderSettings {
  const current = getReaderSettings();
  const updated = { ...current, ...settings };
  try {
    localStorage.setItem('app_reader_settings', JSON.stringify(updated));
  } catch (e) {}
  return updated;
}

// Fallback LocalStorage Helpers
function getFallbackBooks(): BookFile[] {
  try {
    const stored = localStorage.getItem('app_books_fallback');
    if (stored) return deduplicateBooks(JSON.parse(stored));
  } catch (e) {}
  return INITIAL_SAMPLE_BOOKS.map((b, idx) => ({ ...b, id: idx + 1 }));
}

function saveFallbackBooks(books: BookFile[]): void {
  try {
    const str = JSON.stringify(books);
    // localStorage maximum size limit is ~5MB across browser origin.
    // If str length exceeds 1MB, skip saving to localStorage to prevent QuotaExceededError.
    if (str.length < 1024 * 1024) {
      localStorage.setItem('app_books_fallback', str);
    }
  } catch (e) {
    // QuotaExceededError - silently ignore so IndexedDB primary storage remains active
  }
}

export interface StorageDetails {
  booksCount: number;
  totalBytes: number;
  formattedSize: string;
  bookmarksCount: number;
  historyCount: number;
  categoriesCount: number;
}

export function calculateStorageDetails(
  books: BookFile[],
  bookmarks: HighlightBookmark[] = [],
  history: HistoryItem[] = [],
  categories: string[] = []
): StorageDetails {
  let totalBytes = 0;
  for (const b of books) {
    if (b.size) {
      totalBytes += b.size;
    } else if (b.content) {
      totalBytes += b.content.length * 2;
    }
  }

  try {
    const bkmStr = localStorage.getItem('app_bookmarks') || '';
    const histStr = localStorage.getItem('app_history') || '';
    const catStr = localStorage.getItem('app_categories') || '';
    totalBytes += (bkmStr.length + histStr.length + catStr.length) * 2;
  } catch (e) {}

  let formattedSize = '۰ بایت';
  if (totalBytes > 0) {
    if (totalBytes < 1024) {
      formattedSize = `${totalBytes} بایت`;
    } else if (totalBytes < 1024 * 1024) {
      formattedSize = `${(totalBytes / 1024).toFixed(1)} کیلوبایت`;
    } else {
      formattedSize = `${(totalBytes / (1024 * 1024)).toFixed(2)} مگابایت`;
    }
  }

  return {
    booksCount: books.length,
    totalBytes,
    formattedSize,
    bookmarksCount: bookmarks.length,
    historyCount: history.length,
    categoriesCount: categories.length,
  };
}
