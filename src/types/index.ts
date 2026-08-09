export interface BookFile {
  id: number;
  name: string;
  content: string;
  size: number;
  category: string;
  isFavorite: boolean;
  dateAdded: number;
  lastOpened?: number;
  lastReadPage?: number;
  lastReadPosition?: number;
  summary?: string;
  language?: string;
}

export type ProximityMode =
  | 'PROXIMITY_1_SENTENCE'
  | 'PROXIMITY_2_SENTENCES'
  | 'PROXIMITY_3_SENTENCES'
  | 'PROXIMITY_PAGE'
  | 'AND'
  | 'OR';

export type SearchSortMode =
  | 'DEFAULT'
  | 'OCCURRENCES_DESC'
  | 'SIZE_DESC'
  | 'NAME_ASC';

export type SearchScope = 'ALL' | 'CONTENT' | 'TITLE';

export type FilesSortMode =
  | 'DEFAULT'
  | 'LAST_VIEWED'
  | 'NAME_ASC'
  | 'NAME_DESC'
  | 'SIZE_DESC'
  | 'SIZE_ASC'
  | 'FAVORITE';

export interface SearchFilterState {
  isExactWord: boolean;
  ignoreTashkeel: boolean;
  enableArabicPrefixes: boolean;
  enableArabicSuffixes: boolean;
  enableMultiWord: boolean;
  multiWordMode: ProximityMode;
  searchSortMode: SearchSortMode;
  searchScope: SearchScope;
  onlyFavorites: boolean;
  selectedCategories: string[];
}

export interface SearchOccurrence {
  fileId: number;
  fileName: string;
  fileCategory: string;
  fileSize: number;
  isFavorite: boolean;
  matchPos: number;
  matchLength: number;
  occurrenceIndex: number;
  totalInFile: number;
}

export interface BookPage {
  pageIndex: number;
  startPos: number;
  endPos: number;
  content: string;
}

export type ReaderTheme = 'light' | 'sepia' | 'cream' | 'dark' | 'emerald';
export type ReaderFont = 'vazir' | 'amiri' | 'scheherazade';
export type AppLanguage = 'fa' | 'ar' | 'en';
export type AppThemeScheme =
  | 'navy_gold'
  | 'emerald'
  | 'turquoise'
  | 'amber'
  | 'lapis'
  | 'amethyst'
  | 'ruby'
  | 'olive'
  | 'slate'
  | 'obsidian_gold'
  | 'cyberpunk_neon'
  | 'rose_gold'
  | 'nordic_frost';

export interface ReaderSettings {
  mode: 'paginated' | 'full';
  fontSize: number; // 12 to 32
  lineHeight: number; // 1.5 to 2.8
  theme: ReaderTheme;
  fontFamily: ReaderFont;
  paginationMode: 'WORDS' | 'PATTERN';
  paginationWordCount: number;
  paginationPattern: string;
  appLanguage?: AppLanguage;
  appTheme?: AppThemeScheme;
}

export interface HighlightBookmark {
  id: string;
  fileId: number;
  fileName: string;
  text: string;
  note?: string;
  color: 'yellow' | 'green' | 'blue' | 'pink' | 'purple';
  startPos: number;
  endPos: number;
  createdAt: number;
}

export interface HistoryItem {
  id: number;
  fileId: number;
  fileName: string;
  fileCategory: string;
  timestamp: number;
  pageIndex?: number;
}

export interface OperationProgressState {
  isOpen: boolean;
  title: string;
  subtitle?: string;
  currentStep: number;
  totalSteps: number;
  percentage: number;
  statusText?: string;
  details?: string;
  type?: 'import' | 'export' | 'delete' | 'search';
}

