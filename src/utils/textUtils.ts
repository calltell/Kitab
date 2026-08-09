import {
  BookFile,
  ProximityMode,
  SearchFilterState,
  SearchOccurrence,
  BookPage,
} from '../types';

/**
 * Remove Arabic / Persian Tashkeel (Diacritics & Vowel Marks) & Tatweel
 */
export function removeTashkeel(text: string): string {
  if (!text) return '';
  return text.replace(/[\u064B-\u065F\u0670\u0640\u0653-\u0655\u0671]/g, '');
}

/**
 * Normalize Arabic / Persian characters (Alif, Ya, Kaf, Ta Marbuta)
 */
export function normalizeArabicPersian(text: string): string {
  if (!text) return '';
  let str = removeTashkeel(text);
  str = str.replace(/[\u0622\u0623\u0625\u0671]/g, 'ا'); // Alif variations -> Alif
  str = str.replace(/[\u064A\u0649\u06CC]/g, 'ی'); // Ya variations -> Persian Ya
  str = str.replace(/[\u0643\u06A9]/g, 'ک'); // Kaf variations -> Persian Kaf
  str = str.replace(/[\u0629]/g, 'ه'); // Ta Marbuta -> Ha
  return str;
}

export function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Builds flexible RegExp for Arabic / Persian text search
 */
export function buildArabicRegex(
  query: string,
  options: {
    isExactWord?: boolean;
    ignoreTashkeel?: boolean;
    enablePrefixes?: boolean;
    enableSuffixes?: boolean;
  } = {},
  extraFlags = ''
): RegExp | null {
  if (!query || !query.trim()) return null;

  const {
    isExactWord = true,
    ignoreTashkeel = true,
    enablePrefixes = false,
    enableSuffixes = false,
  } = options;

  const tashkeelPattern = ignoreTashkeel ? '[\\u064B-\\u065F\\u0670\\u0640]*' : '';
  let pattern = '';

  const normQuery = ignoreTashkeel ? removeTashkeel(query) : query;

  for (let i = 0; i < normQuery.length; i++) {
    const char = normQuery[i];
    if (ignoreTashkeel) {
      if (['ا', 'أ', 'إ', 'آ'].includes(char)) {
        pattern += '[\\u0627\\u0623\\u0625\\u0622\\u0671]' + tashkeelPattern;
      } else if (['ی', 'ي', 'ى'].includes(char)) {
        pattern += '[\\u06CC\\u064A\\u0649]' + tashkeelPattern;
      } else if (['ک', 'ك'].includes(char)) {
        pattern += '[\\u06A9\\u0643]' + tashkeelPattern;
      } else if (['ه', 'ة'].includes(char)) {
        pattern += '[\\u0647\\u0629]' + tashkeelPattern;
      } else {
        pattern += escapeRegExp(char) + tashkeelPattern;
      }
    } else {
      pattern += escapeRegExp(char);
    }
  }

  const prefixRegex = enablePrefixes
    ? '(?:و|ف|ب|ک|ك|ل|ال|بال|فال|وال|لل)?' + tashkeelPattern
    : '';
  const suffixRegex = enableSuffixes
    ? '(?:ها|هم|هن|کم|کن|نا|نی|ان|ین|ون|ات|تما|تم|تن|ت|ه|ک|ی)?' + tashkeelPattern
    : '';

  const nonWordBoundary =
    '[^a-zA-Z0-9\\u0600-\\u06FF\\u0750-\\u077F\\u08A0-\\u08FF\\uFB50-\\uFDFF\\uFE70-\\uFEFF]';

  if (isExactWord) {
    pattern = `(?:^|${nonWordBoundary})(${prefixRegex}${pattern}${suffixRegex})(?=$|${nonWordBoundary})`;
  } else {
    pattern = `(${prefixRegex}${pattern}${suffixRegex})`;
  }

  const flags = Array.from(new Set(('ui' + extraFlags).split(''))).join('');
  try {
    return new RegExp(pattern, flags);
  } catch (e) {
    return null;
  }
}

/**
 * Searches across all books with proximity and filter capabilities
 */
export function findSearchOccurrences(
  rawQuery: string,
  wordsList: string[],
  books: BookFile[],
  filterState: SearchFilterState
): SearchOccurrence[] {
  let words = wordsList;
  if (!filterState.enableMultiWord || words.length === 0) {
    words = rawQuery.trim().split(/\s+/).filter((w) => w.length > 0);
  }

  if (words.length === 0 || !words[0] || !words[0].trim()) return [];

  const occurrences: SearchOccurrence[] = [];

  // Handle Multi-Word Proximity / AND / OR modes
  if (filterState.enableMultiWord && words.length > 1) {
    return findMultiWordOccurrences(words, books, filterState);
  }

  const targetWord = words[0] || rawQuery;
  const reg = buildArabicRegex(
    targetWord,
    {
      isExactWord: filterState.isExactWord,
      ignoreTashkeel: filterState.ignoreTashkeel,
      enablePrefixes: filterState.enableArabicPrefixes,
      enableSuffixes: filterState.enableArabicSuffixes,
    },
    'g'
  );

  if (!reg) return [];

  for (const book of books) {
    if (filterState.onlyFavorites && !book.isFavorite) continue;
    if (
      filterState.selectedCategories.length > 0 &&
      !filterState.selectedCategories.includes(book.category)
    ) {
      continue;
    }

    const searchInContent =
      filterState.searchScope === 'ALL' || filterState.searchScope === 'CONTENT';
    const searchInTitle =
      filterState.searchScope === 'ALL' || filterState.searchScope === 'TITLE';

    if (!searchInContent && !searchInTitle) continue;

    reg.lastIndex = 0;
    let match: RegExpExecArray | null;
    let countInFile = 0;
    const fileMatches: SearchOccurrence[] = [];

    if (searchInContent) {
      while ((match = reg.exec(book.content)) !== null) {
        countInFile++;
        const matchedText = match[1] || match[0];
        const matchPos = match.index + match[0].indexOf(matchedText);

        fileMatches.push({
          fileId: book.id,
          fileName: book.name,
          fileCategory: book.category,
          fileSize: book.size || book.content.length,
          isFavorite: book.isFavorite,
          matchPos,
          matchLength: matchedText.length,
          occurrenceIndex: countInFile,
          totalInFile: 0,
        });

        if (match.index === reg.lastIndex) reg.lastIndex++;
      }
    }

    fileMatches.forEach((m) => {
      m.totalInFile = countInFile;
      occurrences.push(m);
    });
  }

  return occurrences;
}

function findMultiWordOccurrences(
  words: string[],
  books: BookFile[],
  filterState: SearchFilterState
): SearchOccurrence[] {
  const occurrences: SearchOccurrence[] = [];
  let proximityWindow = 2200; // default page window
  if (filterState.multiWordMode === 'PROXIMITY_1_SENTENCE') proximityWindow = 200;
  else if (filterState.multiWordMode === 'PROXIMITY_2_SENTENCES') proximityWindow = 450;
  else if (filterState.multiWordMode === 'PROXIMITY_3_SENTENCES') proximityWindow = 700;

  for (const book of books) {
    if (filterState.onlyFavorites && !book.isFavorite) continue;
    if (
      filterState.selectedCategories.length > 0 &&
      !filterState.selectedCategories.includes(book.category)
    ) {
      continue;
    }

    const regs = words.map((w) =>
      buildArabicRegex(
        w,
        {
          isExactWord: filterState.isExactWord,
          ignoreTashkeel: filterState.ignoreTashkeel,
          enablePrefixes: filterState.enableArabicPrefixes,
          enableSuffixes: filterState.enableArabicSuffixes,
        },
        'g'
      )
    );

    if (filterState.multiWordMode === 'OR') {
      regs.forEach((reg) => {
        if (!reg) return;
        reg.lastIndex = 0;
        let match: RegExpExecArray | null;
        while ((match = reg.exec(book.content)) !== null) {
          const matchedText = match[1] || match[0];
          const matchPos = match.index + match[0].indexOf(matchedText);

          occurrences.push({
            fileId: book.id,
            fileName: book.name,
            fileCategory: book.category,
            fileSize: book.size || book.content.length,
            isFavorite: book.isFavorite,
            matchPos,
            matchLength: matchedText.length,
            occurrenceIndex: occurrences.length + 1,
            totalInFile: 1,
          });
          if (match.index === reg.lastIndex) reg.lastIndex++;
        }
      });
    } else {
      // AND or Proximity Modes
      const allExist = regs.every((r) => r && r.test(book.content));
      if (!allExist) continue;

      const primaryReg = regs[0];
      if (!primaryReg) continue;
      primaryReg.lastIndex = 0;

      let match: RegExpExecArray | null;
      let countInFile = 0;
      const fileMatches: SearchOccurrence[] = [];

      while ((match = primaryReg.exec(book.content)) !== null) {
        const matchedText = match[1] || match[0];
        const matchPos = match.index + match[0].indexOf(matchedText);

        let isValid = true;
        if (filterState.multiWordMode.startsWith('PROXIMITY_')) {
          const windowStart = Math.max(0, matchPos - proximityWindow);
          const windowEnd = Math.min(
            book.content.length,
            matchPos + proximityWindow
          );
          const windowText = book.content.substring(windowStart, windowEnd);
          isValid = regs.slice(1).every((r) => {
            if (!r) return false;
            r.lastIndex = 0;
            return r.test(windowText);
          });
        }

        if (isValid) {
          countInFile++;
          fileMatches.push({
            fileId: book.id,
            fileName: book.name,
            fileCategory: book.category,
            fileSize: book.size || book.content.length,
            isFavorite: book.isFavorite,
            matchPos,
            matchLength: matchedText.length,
            occurrenceIndex: countInFile,
            totalInFile: 0,
          });
        }
        if (match.index === primaryReg.lastIndex) primaryReg.lastIndex++;
      }

      fileMatches.forEach((m) => {
        m.totalInFile = countInFile;
        occurrences.push(m);
      });
    }
  }

  return occurrences;
}

export function getSnippetForMatch(
  content: string,
  matchPos: number,
  matchLength: number,
  queryWords: string[]
): string {
  const start = Math.max(0, matchPos - 70);
  const end = Math.min(content.length, matchPos + matchLength + 70);
  let snippet = content.substring(start, end);

  // Escape HTML
  snippet = snippet
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  queryWords.forEach((w) => {
    if (!w) return;
    const highlightReg = buildArabicRegex(w, { isExactWord: false }, 'g');
    if (highlightReg) {
      snippet = snippet.replace(
        highlightReg,
        '<mark class="mark-normal">$1</mark>'
      );
    }
  });

  return `...${snippet}...`;
}

/**
 * Helper to check if character at index is a sentence boundary
 */
function isSentenceEnd(str: string, index: number): boolean {
  if (index < 0 || index >= str.length) return false;
  const ch = str[index];

  // Newline is always a sentence/paragraph end
  if (ch === '\n') return true;

  // Sentence ending punctuation: period, exclamation, question mark, colon, semicolon
  if (/[.?!؟:؛;]/.test(ch)) {
    if (index + 1 >= str.length) return true;
    const nextChar = str[index + 1];
    // Must be followed by whitespace, newline, quote, or closing bracket (avoids breaking decimals like 12.5)
    return /\s|["'»\)\}\]\n]/.test(nextChar);
  }

  return false;
}

/**
 * Splits book content into pages by Word Count or Multi-Pattern Regex
 */
export function splitTextIntoPages(
  text: string,
  paginationMode: 'WORDS' | 'PATTERN',
  wordCountTarget: number = 400,
  patternStr: string = '[صفحه #]\n(ص: #)'
): BookPage[] {
  if (!text) return [{ pageIndex: 0, startPos: 0, endPos: 0, content: '' }];

  const pages: BookPage[] = [];

  if (paginationMode === 'PATTERN' && patternStr.trim().length > 0) {
    try {
      const patternLines = patternStr
        .split('\n')
        .map((p) => p.trim())
        .filter((p) => p.length > 0);

      if (patternLines.length > 0) {
        const regexParts = patternLines.map((pattern) => {
          let escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&');
          escaped = escaped.replace(/ /g, '\\s*');
          escaped = escaped.replace(/#/g, '[0-9۰-۹]+'); // # = number
          escaped = escaped.replace(/\*/g, '[^\\s]+'); // * = word
          return `(?:${escaped})`;
        });

        const combinedRegexStr = regexParts.join('|');
        const regexExec = new RegExp(combinedRegexStr, 'g');

        let match: RegExpExecArray | null;
        let lastIndex = 0;
        let firstMatch = true;

        while ((match = regexExec.exec(text)) !== null) {
          if (firstMatch && match.index > 0) {
            pages.push({
              pageIndex: pages.length,
              startPos: 0,
              endPos: match.index,
              content: text.substring(0, match.index),
            });
          } else if (!firstMatch) {
            pages.push({
              pageIndex: pages.length,
              startPos: lastIndex,
              endPos: match.index,
              content: text.substring(lastIndex, match.index),
            });
          }
          lastIndex = match.index;
          firstMatch = false;
        }

        if (lastIndex < text.length) {
          pages.push({
            pageIndex: pages.length,
            startPos: lastIndex,
            endPos: text.length,
            content: text.substring(lastIndex),
          });
        }

        const filteredPages = pages.filter((p) => p.content.trim().length > 0);
        if (
          filteredPages.length > 1 ||
          (filteredPages.length === 1 && !firstMatch)
        ) {
          return filteredPages.map((p, idx) => ({ ...p, pageIndex: idx }));
        }
      }
    } catch (e) {
      console.error('Failed to parse page pattern regex:', e);
    }
  }

  // Fallback / Word count pagination mode (Sentence-aware)
  let pos = 0;
  const targetWords = wordCountTarget || 400;

  while (pos < text.length) {
    let wordCount = 0;
    let end = pos;
    let inWord = false;

    // 1. Count up to targetWords
    while (end < text.length && wordCount < targetWords) {
      const char = text[end];
      const isSpace = /\s/.test(char);
      if (!isSpace && !inWord) {
        inWord = true;
        wordCount++;
      } else if (isSpace && inWord) {
        inWord = false;
      }
      end++;

      if (wordCount >= targetWords && isSpace) {
        break;
      }
    }

    // Advance to end of current word so targetEnd is at a clean whitespace/word boundary
    while (end < text.length && !/\s/.test(text[end])) {
      end++;
    }

    const targetEnd = end;

    // 2. Look for sentence boundary near targetEnd if we haven't reached end of text
    if (targetEnd < text.length) {
      const maxForward = Math.min(text.length, targetEnd + 500); // ~70-80 words forward
      const minBackward = Math.max(pos + 100, targetEnd - 500); // ~70-80 words backward

      let sentenceEndFound = -1;

      // First search FORWARD for the next sentence boundary
      for (let i = targetEnd; i < maxForward; i++) {
        if (isSentenceEnd(text, i)) {
          sentenceEndFound = i + 1;
          break;
        }
      }

      // If no sentence boundary found forward, search BACKWARD
      if (sentenceEndFound === -1) {
        for (let i = targetEnd - 1; i >= minBackward; i--) {
          if (isSentenceEnd(text, i)) {
            sentenceEndFound = i + 1;
            break;
          }
        }
      }

      if (sentenceEndFound > pos) {
        end = sentenceEndFound;
      } else {
        end = targetEnd;
      }
    }

    // Safety checks: ensure end > pos and doesn't split a word in two
    if (end <= pos) {
      end = Math.min(text.length, pos + 1);
    }
    while (end < text.length && !/\s/.test(text[end]) && !/\s/.test(text[end - 1])) {
      end++;
    }

    pages.push({
      pageIndex: pages.length,
      startPos: pos,
      endPos: end,
      content: text.substring(pos, end),
    });

    pos = end;
  }

  return pages.length > 0
    ? pages
    : [{ pageIndex: 0, startPos: 0, endPos: text.length, content: text }];
}

export function formatBytes(bytes: number): string {
  if (!bytes || bytes === 0) return '۰ بایت';
  const k = 1024;
  const sizes = ['بایت', 'کیلوبایت', 'مگابایت', 'گیگابایت'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const val = parseFloat((bytes / Math.pow(k, i)).toFixed(1));
  return `${val.toLocaleString('fa-IR')} ${sizes[i]}`;
}
