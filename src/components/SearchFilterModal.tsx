import React from 'react';
import { X, SlidersHorizontal, Check } from 'lucide-react';
import { SearchFilterState, ProximityMode, SearchSortMode, SearchScope, AppLanguage } from '../types';
import { translations, formatDigits } from '../utils/i18n';

interface SearchFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  filterState: SearchFilterState;
  onChangeFilter: (updated: Partial<SearchFilterState>) => void;
  categories: string[];
  appLanguage?: AppLanguage;
}

export const SearchFilterModal: React.FC<SearchFilterModalProps> = ({
  isOpen,
  onClose,
  filterState,
  onChangeFilter,
  categories,
  appLanguage = 'fa',
}) => {
  if (!isOpen) return null;

  const t = translations[appLanguage]?.searchModal || translations.fa.searchModal;

  const toggleCategory = (cat: string) => {
    const current = filterState.selectedCategories;
    if (current.includes(cat)) {
      onChangeFilter({
        selectedCategories: current.filter((c) => c !== cat),
      });
    } else {
      onChangeFilter({
        selectedCategories: [...current, cat],
      });
    }
  };

  const selectAllCats = () => {
    onChangeFilter({ selectedCategories: [...categories] });
  };

  const clearCats = () => {
    onChangeFilter({ selectedCategories: [] });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg p-5 shadow-xl max-h-[85vh] overflow-y-auto flex flex-col gap-5 text-slate-900 dark:text-slate-100">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2 font-bold text-base">
            <SlidersHorizontal className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            <span>{t.title}</span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Toggles List */}
        <div className="flex flex-col gap-3">
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            {t.linguisticSection}
          </h4>

          {/* Exact Word Switch */}
          <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 cursor-pointer">
            <div>
              <div className="text-sm font-semibold">{t.exactWord}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                {t.exactWordDesc}
              </div>
            </div>
            <input
              type="checkbox"
              checked={filterState.isExactWord}
              onChange={(e) => onChangeFilter({ isExactWord: e.target.checked })}
              className="w-5 h-5 accent-amber-600 rounded cursor-pointer"
            />
          </label>

          {/* Tashkeel Ignore */}
          <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 cursor-pointer">
            <div>
              <div className="text-sm font-semibold">{t.tashkeel}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                {t.tashkeelDesc}
              </div>
            </div>
            <input
              type="checkbox"
              checked={filterState.ignoreTashkeel}
              onChange={(e) =>
                onChangeFilter({ ignoreTashkeel: e.target.checked })
              }
              className="w-5 h-5 accent-amber-600 rounded cursor-pointer"
            />
          </label>

          {/* Arabic Prefixes */}
          <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 cursor-pointer">
            <div>
              <div className="text-sm font-semibold">{t.prefixes}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                {t.prefixesDesc}
              </div>
            </div>
            <input
              type="checkbox"
              checked={filterState.enableArabicPrefixes}
              onChange={(e) =>
                onChangeFilter({ enableArabicPrefixes: e.target.checked })
              }
              className="w-5 h-5 accent-amber-600 rounded cursor-pointer"
            />
          </label>

          {/* Arabic Suffixes */}
          <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 cursor-pointer">
            <div>
              <div className="text-sm font-semibold">{t.suffixes}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                {t.suffixesDesc}
              </div>
            </div>
            <input
              type="checkbox"
              checked={filterState.enableArabicSuffixes}
              onChange={(e) =>
                onChangeFilter({ enableArabicSuffixes: e.target.checked })
              }
              className="w-5 h-5 accent-amber-600 rounded cursor-pointer"
            />
          </label>

          {/* Multi-word Proximity Toggle */}
          <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 cursor-pointer">
            <div>
              <div className="text-sm font-semibold">{t.multiWord}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                {t.multiWordDesc}
              </div>
            </div>
            <input
              type="checkbox"
              checked={filterState.enableMultiWord}
              onChange={(e) =>
                onChangeFilter({ enableMultiWord: e.target.checked })
              }
              className="w-5 h-5 accent-amber-600 rounded cursor-pointer"
            />
          </label>

          {filterState.enableMultiWord && (
            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 flex flex-col gap-1.5">
              <span className="text-xs font-bold text-amber-800 dark:text-amber-300">
                {t.proximityLabel}
              </span>
              <select
                value={filterState.multiWordMode}
                onChange={(e) =>
                  onChangeFilter({
                    multiWordMode: e.target.value as ProximityMode,
                  })
                }
                className="w-full p-2 text-xs rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-medium"
              >
                <option value="PROXIMITY_1_SENTENCE">{t.prox1Sent}</option>
                <option value="PROXIMITY_2_SENTENCES">{t.prox2Sent}</option>
                <option value="PROXIMITY_3_SENTENCES">{t.prox3Sent}</option>
                <option value="PROXIMITY_PAGE">{t.proxPage}</option>
                <option value="AND">{t.andMode}</option>
                <option value="OR">{t.orMode}</option>
              </select>
            </div>
          )}

          {/* Favorites only */}
          <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 cursor-pointer">
            <div>
              <div className="text-sm font-semibold">{t.onlyFavs}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                {t.onlyFavsDesc}
              </div>
            </div>
            <input
              type="checkbox"
              checked={filterState.onlyFavorites}
              onChange={(e) =>
                onChangeFilter({ onlyFavorites: e.target.checked })
              }
              className="w-5 h-5 accent-amber-600 rounded cursor-pointer"
            />
          </label>
        </div>

        {/* Search Scope & Sorting */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">
              {t.scopeLabel}
            </label>
            <select
              value={filterState.searchScope}
              onChange={(e) =>
                onChangeFilter({ searchScope: e.target.value as SearchScope })
              }
              className="w-full p-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium"
            >
              <option value="ALL">{t.scopeAll}</option>
              <option value="CONTENT">{t.scopeContent}</option>
              <option value="TITLE">{t.scopeTitle}</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">
              {t.sortLabel}
            </label>
            <select
              value={filterState.searchSortMode}
              onChange={(e) =>
                onChangeFilter({
                  searchSortMode: e.target.value as SearchSortMode,
                })
              }
              className="w-full p-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium"
            >
              <option value="DEFAULT">{t.sortDefault}</option>
              <option value="OCCURRENCES_DESC">{t.sortOccurrences}</option>
              <option value="SIZE_DESC">{t.sortSize}</option>
              <option value="NAME_ASC">{t.sortName}</option>
            </select>
          </div>
        </div>

        {/* Category Filters */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {t.catsFilter} ({formatDigits(filterState.selectedCategories.length, appLanguage)} {t.of}{' '}
              {formatDigits(categories.length, appLanguage)})
            </h4>
            <div className="flex items-center gap-2 text-xs">
              <button
                type="button"
                onClick={selectAllCats}
                className="text-amber-600 dark:text-amber-400 font-semibold hover:underline"
              >
                {t.selectAll}
              </button>
              <span className="text-slate-300 dark:text-slate-700">|</span>
              <button
                type="button"
                onClick={clearCats}
                className="text-rose-600 dark:text-rose-400 font-semibold hover:underline"
              >
                {t.clearAll}
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80">
            {categories.map((cat) => {
              const isSelected = filterState.selectedCategories.includes(cat);
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => toggleCategory(cat)}
                  className={`text-xs px-3 py-1.5 rounded-full font-medium transition-all flex items-center gap-1 border ${
                    isSelected
                      ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-amber-400'
                  }`}
                >
                  {isSelected && <Check className="w-3 h-3" />}
                  <span>{cat}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Apply Button */}
        <button
          onClick={onClose}
          className="w-full py-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm shadow-md transition-all active:scale-[0.98]"
        >
          {t.applyBtn}
        </button>
      </div>
    </div>
  );
};
