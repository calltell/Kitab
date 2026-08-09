import React, { useState } from 'react';
import {
  FolderPlus,
  Trash2,
  Sliders,
  RotateCcw,
  Upload,
  Download,
  BookOpen,
  Check,
  Globe,
  ChevronDown,
  Database,
  HardDrive,
  Bookmark,
  History,
  Folder,
  Palette,
} from 'lucide-react';
import { ReaderSettings, BookFile, AppLanguage, AppThemeScheme } from '../types';
import { translations, formatDigits } from '../utils/i18n';
import { calculateStorageDetails, getBookmarks, getHistory } from '../utils/storage';

interface SettingsViewProps {
  categories: string[];
  readerSettings: ReaderSettings;
  books: BookFile[];
  onAddCategory: (name: string) => void;
  onDeleteCategory: (name: string) => void;
  onUpdateSettings: (settings: Partial<ReaderSettings>) => void;
  onRestoreBooksBatch: (imported: Omit<BookFile, 'id'>[]) => void;
  onExportBackup?: () => void;
  onResetAllData: () => void;
  onClearAllBooks?: () => void;
  onClearAllBookmarks?: () => void;
  onClearAllHistory?: () => void;
  onResetCategories?: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  categories,
  readerSettings,
  books,
  onAddCategory,
  onDeleteCategory,
  onUpdateSettings,
  onRestoreBooksBatch,
  onExportBackup,
  onResetAllData,
  onClearAllBooks,
  onClearAllBookmarks,
  onClearAllHistory,
  onResetCategories,
}) => {
  const currentLang = readerSettings.appLanguage || 'fa';
  const t = translations[currentLang] || translations.fa;

  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);
  const [isThemeOpen, setIsThemeOpen] = useState(false);
  const [isPaginationOpen, setIsPaginationOpen] = useState(false);
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [isBackupOpen, setIsBackupOpen] = useState(false);
  const [pendingDeleteCategory, setPendingDeleteCategory] = useState<string | null>(null);
  const [pendingDeleteSection, setPendingDeleteSection] = useState<
    'books' | 'bookmarks' | 'history' | 'categories' | 'all' | null
  >(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [newCategoryInput, setNewCategoryInput] = useState('');
  const [wordsInput, setWordsInput] = useState(
    readerSettings.paginationWordCount || 400
  );
  const [patternInput, setPatternInput] = useState(
    readerSettings.paginationPattern || '[صفحه #]\n(ص: #)\nجـ #(ص: #)'
  );

  const appThemeOptions: Array<{
    id: AppThemeScheme;
    nameFa: string;
    nameAr: string;
    nameEn: string;
    descFa: string;
    descAr: string;
    descEn: string;
    colors: string[];
    badgeColor: string;
  }> = [
    {
      id: 'navy_gold',
      nameFa: 'طلا و سرمه‌ای سلطنتی',
      nameAr: 'الذهبي والتحلي الملكي',
      nameEn: 'Royal Gold & Navy',
      descFa: 'ترکیب سرمه‌ای عمیق با جلوه طلایی کهربایی',
      descAr: 'تركيب الكحلي الداكن مع لمسات ذهبية براقة',
      descEn: 'Deep navy background with rich gold accents',
      colors: ['#0f172a', '#d97706', '#f59e0b'],
      badgeColor: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-200 dark:border-amber-800',
    },
    {
      id: 'emerald',
      nameFa: 'زمردی اسلامی',
      nameAr: 'الزمردي الإسلامي',
      nameEn: 'Islamic Emerald',
      descFa: 'سبز زمردی اصیل با حس آرامش‌بخش متون کهن',
      descAr: 'الزمردي الأصيل المريح لقراءة النصوص القديمة',
      descEn: 'Classic Islamic emerald green with gold accents',
      colors: ['#064e3b', '#059669', '#10b981'],
      badgeColor: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
    },
    {
      id: 'turquoise',
      nameFa: 'فیروزه‌ای اصفهان',
      nameAr: 'الفيروزي الأصفهاني',
      nameEn: 'Isfahan Turquoise',
      descFa: 'الهام‌گرفته از کاشی‌کاری‌های فیروزه‌ای مساجد تاریخی',
      descAr: 'مستوحى من الزخارف الفيروزية للمساجد التاريخية',
      descEn: 'Persian turquoise tile design scheme',
      colors: ['#083344', '#028090', '#06b6d4'],
      badgeColor: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800',
    },
    {
      id: 'amber',
      nameFa: 'کهربایی و نسخ خطی',
      nameAr: 'الكهرماني والمخطوطات',
      nameEn: 'Amber Manuscript',
      descFa: 'گرما و وقار کاغذهای قدیمی و جلد چرمی',
      descAr: 'دفء المخطوطات القديمة وأغلفة الكتب الكلاسيكية',
      descEn: 'Warm amber sepia and manuscript tones',
      colors: ['#451a03', '#b45309', '#f59e0b'],
      badgeColor: 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200 border-amber-300 dark:border-amber-800',
    },
    {
      id: 'lapis',
      nameFa: 'لاجوردی و شفق',
      nameAr: 'اللازوردي والشفك',
      nameEn: 'Lapis Lazuli & Sapphire',
      descFa: 'آبی لاجوردی و نیلی عمیق با شفافیت آسمانی',
      descAr: 'اللازوردي والنيلي العميق مع شفافية السماء',
      descEn: 'Deep lapis lazuli and sapphire blue highlights',
      colors: ['#172554', '#2563eb', '#60a5fa'],
      badgeColor: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border-blue-200 dark:border-blue-800',
    },
    {
      id: 'amethyst',
      nameFa: 'یاقوت ارغوانی',
      nameAr: 'الجمشت الملكي',
      nameEn: 'Royal Amethyst',
      descFa: 'بنفش ارغوانی مجلل با جلوه یاقوتی فاخر',
      descAr: 'الأرجواني الفاخر بلمسات الياقوت الأنيقة',
      descEn: 'Luxurious violet purple and amethyst accents',
      colors: ['#3b0764', '#7c3aed', '#c084fc'],
      badgeColor: 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border-purple-200 dark:border-purple-800',
    },
    {
      id: 'ruby',
      nameFa: 'عقیقی و سرخ',
      nameAr: 'العقيقي والأحمر',
      nameEn: 'Crimson Ruby',
      descFa: 'سرخ عقیقی مجلل و جذاب',
      descAr: 'الأحمر العقيقي الفاخر والرمادي الدافئ',
      descEn: 'Rich carnelian red & ruby rose accents',
      colors: ['#4c0519', '#e11d48', '#fb7185'],
      badgeColor: 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border-rose-200 dark:border-rose-800',
    },
    {
      id: 'olive',
      nameFa: 'زیتونی و سپیده',
      nameAr: 'الزيتوني الهادئ',
      nameEn: 'Olive Oasis',
      descFa: 'سبز زیتونی ملایم و چشم‌نواز',
      descAr: 'الزيتوني الهادئ اللطيف للعين',
      descEn: 'Calm olive sage & natural green palette',
      colors: ['#1a2e05', '#65a30d', '#a3e635'],
      badgeColor: 'bg-lime-100 text-lime-900 dark:bg-lime-950 dark:text-lime-200 border-lime-300 dark:border-lime-800',
    },
    {
      id: 'slate',
      nameFa: 'سرمه‌ای کلاسیک',
      nameAr: 'السرمائي الكلاسيكي',
      nameEn: 'Classic Slate',
      descFa: 'طراحی کلاسیک و فولادی برای پژوهش‌های طولانی',
      descAr: 'التصميم الكلاسيكي الفولاذي للدراسات الطويلة',
      descEn: 'Minimalist steel slate and grey classic theme',
      colors: ['#0f172a', '#475569', '#94a3b8'],
      badgeColor: 'bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-700',
    },
    {
      id: 'obsidian_gold',
      nameFa: 'آبنوس و طلای سیاه',
      nameAr: 'الآبنوس والذهب',
      nameEn: 'Obsidian & Luxury Gold',
      descFa: 'مشکی عمیق آبنوسی با کنتراست طلایی درخشان',
      descAr: 'الأسود الآبنوسي مع لمسات الذهب اللامع',
      descEn: 'Deep obsidian black with bright luxury gold',
      colors: ['#09090b', '#27272a', '#eab308'],
      badgeColor: 'bg-yellow-100 text-yellow-900 dark:bg-zinc-900 dark:text-yellow-400 border-yellow-300 dark:border-yellow-700',
    },
    {
      id: 'cyberpunk_neon',
      nameFa: 'سایبرپانک و نئون',
      nameAr: 'النيون والسيبربانك',
      nameEn: 'Cyberpunk Neon',
      descFa: 'سبز نئون مدرن و پرانرژی با کنتراست شفاف',
      descAr: 'أخضر نيون حديث ونابض بالحياة',
      descEn: 'Vibrant cyberpunk neon green & dark slate contrast',
      colors: ['#052e16', '#16a34a', '#4ade80'],
      badgeColor: 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300 border-green-200 dark:border-green-800',
    },
    {
      id: 'rose_gold',
      nameFa: 'رز گلد و مرمر فاخر',
      nameAr: 'الذهب الوردي والرخام',
      nameEn: 'Rose Gold Luxury',
      descFa: 'صورتی رزگلد ملايم با حس لطيف و لوكس',
      descAr: 'الوردي الناعم مع لمسات الذهب الأنيق',
      descEn: 'Elegant rose gold & soft luxury pink tones',
      colors: ['#500724', '#db2777', '#f472b6'],
      badgeColor: 'bg-pink-100 text-pink-800 dark:bg-pink-950 dark:text-pink-300 border-pink-200 dark:border-pink-800',
    },
    {
      id: 'nordic_frost',
      nameFa: 'مینیمال قطبی و نیلی',
      nameAr: 'الشمالي الجليدي',
      nameEn: 'Nordic Frost',
      descFa: 'آبی قطبی و شفاف مینیمال برای تمرکز فوق‌العاده',
      descAr: 'الأزرق القطبي الهادئ للتركيز العالي',
      descEn: 'Minimalist ice blue and clean arctic breeze',
      colors: ['#082f49', '#0284c7', '#38bdf8'],
      badgeColor: 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300 border-sky-200 dark:border-sky-800',
    },
  ];

  const currentAppTheme = readerSettings.appTheme || 'navy_gold';
  const selectedThemeObj =
    appThemeOptions.find((t) => t.id === currentAppTheme) || appThemeOptions[0];

  const langOptions = [
    { id: 'fa' as AppLanguage, label: 'فارسی', sub: 'Persian', flag: '🇮🇷' },
    { id: 'ar' as AppLanguage, label: 'العربية', sub: 'Arabic', flag: '🇸🇦' },
    { id: 'en' as AppLanguage, label: 'English', sub: 'English', flag: '🇬🇧' },
  ];

  const selectedLangObj =
    langOptions.find((l) => l.id === currentLang) || langOptions[0];

  const handleAddCat = () => {
    if (!newCategoryInput.trim()) return;
    onAddCategory(newCategoryInput.trim());
    setNewCategoryInput('');
  };

  const handleSavePagination = () => {
    onUpdateSettings({
      paginationWordCount: Math.max(50, Math.min(5000, wordsInput)),
      paginationPattern: patternInput.trim(),
    });
    alert(t.settings.saveSuccessAlert);
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          if (Array.isArray(parsed)) {
            onRestoreBooksBatch(parsed);
            alert(`${parsed.length} ${t.settings.booksCount}`);
          } else {
            alert('JSON Invalid');
          }
        } catch (err) {
          alert('JSON Read Error');
        }
      };
      reader.readAsText(file);
      e.target.value = '';
    }
  };

  const storageStats = calculateStorageDetails(
    books,
    getBookmarks(),
    getHistory(),
    categories
  );

  return (
    <div className="flex flex-col gap-5 pb-24 max-w-4xl mx-auto px-4 pt-3 text-slate-900 dark:text-slate-100">
      {/* App Language Switcher (Sleek Slide-Down Accordion / Dropdown) */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-3">
        <h3 className="font-bold text-sm flex items-center gap-2 text-amber-600">
          <Globe className="w-4 h-4" />
          <span>{t.settings.languageTitle}</span>
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {t.settings.languageDesc}
        </p>

        {/* Dropdown trigger button */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsLangDropdownOpen(!isLangDropdownOpen)}
            className="w-full bg-slate-50 dark:bg-slate-800/90 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/80 rounded-xl p-3.5 flex items-center justify-between transition-all shadow-sm active:scale-[0.99] cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <span className="text-lg">{selectedLangObj.flag}</span>
              <div className="flex flex-col text-right">
                <span className="font-bold text-sm text-slate-800 dark:text-slate-100">
                  {selectedLangObj.label}
                </span>
                <span className="text-[10px] text-slate-400">
                  {selectedLangObj.sub}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
              <span className="text-xs bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 font-semibold px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-800/80">
                {selectedLangObj.id.toUpperCase()}
              </span>
              <ChevronDown
                className={`w-4 h-4 transition-transform duration-300 ${
                  isLangDropdownOpen ? 'rotate-180 text-amber-600' : ''
                }`}
              />
            </div>
          </button>

          {/* Slide-Down Menu */}
          {isLangDropdownOpen && (
            <div className="mt-2 bg-white dark:bg-slate-850 rounded-xl border border-slate-200 dark:border-slate-700 shadow-lg overflow-hidden flex flex-col divide-y divide-slate-100 dark:divide-slate-800 animate-in fade-in slide-in-from-top-2 duration-200 z-20">
              {langOptions.map((item) => {
                const isSelected = currentLang === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      onUpdateSettings({ appLanguage: item.id });
                      setIsLangDropdownOpen(false);
                    }}
                    className={`p-3.5 flex items-center justify-between transition-colors cursor-pointer text-right ${
                      isSelected
                        ? 'bg-amber-50/80 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 font-bold'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{item.flag}</span>
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold">{item.label}</span>
                        <span className="text-[10px] opacity-70">{item.sub}</span>
                      </div>
                    </div>
                    {isSelected && (
                      <Check className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* App Visual Theme Accordion Drawer */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col overflow-hidden">
        <button
          type="button"
          onClick={() => setIsThemeOpen(!isThemeOpen)}
          className="p-5 flex items-center justify-between w-full text-right cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors gap-3"
        >
          <h3 className="font-bold text-sm flex items-center gap-2 text-amber-600 shrink min-w-0">
            <Palette className="w-4 h-4 shrink-0" />
            <span className="truncate">{t.settings.appThemeTitle}</span>
          </h3>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 max-w-[120px] sm:max-w-none truncate">
              {currentLang === 'ar' ? selectedThemeObj.nameAr : currentLang === 'en' ? selectedThemeObj.nameEn : selectedThemeObj.nameFa}
            </span>
            <ChevronDown
              className={`w-4 h-4 text-amber-600 transition-transform duration-300 ${
                isThemeOpen ? 'rotate-180' : ''
              }`}
            />
          </div>
        </button>

        {isThemeOpen && (
          <div className="p-5 pt-0 border-t border-slate-100 dark:border-slate-800 animate-in fade-in duration-300">
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-4 mb-3">
              {t.settings.appThemeDesc}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {appThemeOptions.map((scheme) => {
                const isSelected = (readerSettings.appTheme || 'navy_gold') === scheme.id;
                const name =
                  currentLang === 'ar'
                    ? scheme.nameAr
                    : currentLang === 'en'
                    ? scheme.nameEn
                    : scheme.nameFa;
                const desc =
                  currentLang === 'ar'
                    ? scheme.descAr
                    : currentLang === 'en'
                    ? scheme.descEn
                    : scheme.descFa;

                return (
                  <button
                    key={scheme.id}
                    type="button"
                    onClick={() => {
                      onUpdateSettings({ appTheme: scheme.id });
                    }}
                    className={`p-3.5 rounded-xl border text-right transition-all flex flex-col justify-between gap-2.5 cursor-pointer relative overflow-hidden ${
                      isSelected
                        ? 'border-amber-500 dark:border-amber-400 bg-amber-50/70 dark:bg-amber-950/40 shadow-md ring-2 ring-amber-500/20'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-100/70 dark:hover:bg-slate-800/80'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {/* Color Swatch Circles */}
                        <div className="flex -space-x-1.5 space-x-reverse items-center">
                          {scheme.colors.map((c, i) => (
                            <span
                              key={i}
                              className="w-4 h-4 rounded-full border-2 border-white dark:border-slate-900 shadow-xs"
                              style={{ backgroundColor: c }}
                            />
                          ))}
                        </div>
                        <span className="font-bold text-xs text-slate-800 dark:text-slate-100">
                          {name}
                        </span>
                      </div>
                      {isSelected ? (
                        <span className="w-5 h-5 rounded-full bg-amber-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </span>
                      ) : (
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${scheme.badgeColor}`}>
                          انتخاب
                        </span>
                      )}
                    </div>

                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                      {desc}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Category Management */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col overflow-hidden">
        <button
          onClick={() => setIsCategoryOpen(!isCategoryOpen)}
          className="p-5 flex items-center justify-between w-full text-right cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
        >
          <h3 className="font-bold text-sm flex items-center gap-2 text-amber-600">
            <FolderPlus className="w-4 h-4" />
            <span>{t.settings.catTitle}</span>
          </h3>
          <ChevronDown
            className={`w-4 h-4 text-amber-600 transition-transform duration-300 ${
              isCategoryOpen ? 'rotate-180' : ''
            }`}
          />
        </button>

        {isCategoryOpen && (
          <div className="p-5 pt-0 flex flex-col gap-4 border-t border-slate-100 dark:border-slate-800 animate-in fade-in duration-300">
            <div className="flex items-center gap-2 mt-4">
              <input
                type="text"
                value={newCategoryInput}
                onChange={(e) => setNewCategoryInput(e.target.value)}
                placeholder={t.settings.newCatPlaceholder}
                className="flex-1 p-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none"
              />
              <button
                onClick={handleAddCat}
                className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-sm cursor-pointer"
              >
                {t.settings.addBtn}
              </button>
            </div>

            <div className="flex flex-col divide-y divide-slate-100 dark:divide-slate-800 border border-slate-100 dark:border-slate-800 rounded-xl overflow-hidden">
              {categories.map((cat) => {
                const count = books.filter((b) => b.category === cat).length;
                const isDefault = cat === 'بدون دسته‌بندی';

                return (
                  <div
                    key={cat}
                    className="p-3 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2 font-bold">
                      <span>{cat}</span>
                      <span className="text-[11px] text-slate-400 font-normal">
                        ({formatDigits(count, currentLang)} {t.settings.booksCount})
                      </span>
                    </div>

                    {!isDefault && (
                      <button
                        onClick={() => setPendingDeleteCategory(cat)}
                        className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>{t.settings.delete}</span>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Reader & Pagination Settings */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col overflow-hidden">
        <button
          onClick={() => setIsPaginationOpen(!isPaginationOpen)}
          className="p-5 flex items-center justify-between w-full text-right cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
        >
          <h3 className="font-bold text-sm flex items-center gap-2 text-amber-600">
            <Sliders className="w-4 h-4" />
            <span>{t.settings.paginationTitle}</span>
          </h3>
          <ChevronDown
            className={`w-4 h-4 text-amber-600 transition-transform duration-300 ${
              isPaginationOpen ? 'rotate-180' : ''
            }`}
          />
        </button>
        
        {isPaginationOpen && (
          <div className="p-5 pt-0 flex flex-col gap-4 border-t border-slate-100 dark:border-slate-800 animate-in fade-in duration-300">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
              <div>
                <label className="text-xs font-bold text-slate-500 mb-1 block">
                  {t.settings.pagingModeLabel}
                </label>
                <select
                  value={readerSettings.paginationMode}
                  onChange={(e) =>
                    onUpdateSettings({
                      paginationMode: e.target.value as 'WORDS' | 'PATTERN',
                    })
                  }
                  className="w-full p-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium"
                >
                  <option value="WORDS">{t.settings.wordsMode}</option>
                  <option value="PATTERN">{t.settings.patternMode}</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 mb-1 block">
                  {t.settings.wordsPerContainer}
                </label>
                <input
                  type="number"
                  value={wordsInput}
                  onChange={(e) => setWordsInput(Number(e.target.value))}
                  min={50}
                  max={5000}
                  className="w-full p-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium"
                />
              </div>
            </div>

            {/* Pattern Input */}
            <div>
              <label className="text-xs font-bold text-slate-500 mb-1 block">
                {t.settings.patternsLabel}
              </label>
              <textarea
                value={patternInput}
                onChange={(e) => setPatternInput(e.target.value)}
                className="w-full h-20 p-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-left dir-ltr"
                placeholder={t.settings.patternPlaceholder}
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                {t.settings.patternHint}
              </span>
            </div>

            <button
              onClick={handleSavePagination}
              className="py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>{t.settings.savePaginationBtn}</span>
            </button>
          </div>
        )}
      </div>

      {/* Backup & Data Controls */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col overflow-hidden">
        <button
          onClick={() => setIsBackupOpen(!isBackupOpen)}
          className="p-5 flex items-center justify-between w-full text-right cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
        >
          <h3 className="font-bold text-sm flex items-center gap-2 text-amber-600">
            <RotateCcw className="w-4 h-4" />
            <span>{t.settings.backupTitle}</span>
          </h3>
          <ChevronDown
            className={`w-4 h-4 text-amber-600 transition-transform duration-300 ${
              isBackupOpen ? 'rotate-180' : ''
            }`}
          />
        </button>

        {isBackupOpen && (
          <div className="p-5 pt-0 flex flex-col gap-4 border-t border-slate-100 dark:border-slate-800 animate-in fade-in duration-300">
            {/* Storage Consumption Card */}
            <div className="bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/50 rounded-xl p-4 mt-3 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-xs text-amber-900 dark:text-amber-200">
                  <HardDrive className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <span>{t.settings.storageTitle}</span>
                </div>
                <span className="px-2.5 py-1 rounded-lg bg-amber-200/70 dark:bg-amber-900/60 text-amber-950 dark:text-amber-100 font-extrabold text-xs dir-ltr">
                  {formatDigits(storageStats.formattedSize, currentLang)}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div className="bg-white/80 dark:bg-slate-900/80 p-2.5 rounded-lg border border-amber-100 dark:border-amber-950 flex flex-col justify-between gap-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-500 flex items-center gap-1 font-semibold">
                      <BookOpen className="w-3 h-3 text-amber-600" />
                      {t.settings.booksStored}
                    </span>
                    {books.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setPendingDeleteSection('books')}
                        className="p-1 px-1.5 text-[10px] font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded flex items-center gap-0.5 cursor-pointer transition-colors"
                        title="حذف فقط کتب"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>حذف</span>
                      </button>
                    )}
                  </div>
                  <span className="font-extrabold text-slate-800 dark:text-slate-200 text-xs">
                    {formatDigits(books.length, currentLang)} {t.settings.booksCount}
                  </span>
                </div>

                <div className="bg-white/80 dark:bg-slate-900/80 p-2.5 rounded-lg border border-amber-100 dark:border-amber-950 flex flex-col justify-between gap-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-500 flex items-center gap-1 font-semibold">
                      <Bookmark className="w-3 h-3 text-amber-600" />
                      {t.settings.bookmarksStored}
                    </span>
                    {storageStats.bookmarksCount > 0 && (
                      <button
                        type="button"
                        onClick={() => setPendingDeleteSection('bookmarks')}
                        className="p-1 px-1.5 text-[10px] font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded flex items-center gap-0.5 cursor-pointer transition-colors"
                        title="حذف فقط نشان‌ها"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>حذف</span>
                      </button>
                    )}
                  </div>
                  <span className="font-extrabold text-slate-800 dark:text-slate-200 text-xs">
                    {formatDigits(storageStats.bookmarksCount, currentLang)} مورد
                  </span>
                </div>

                <div className="bg-white/80 dark:bg-slate-900/80 p-2.5 rounded-lg border border-amber-100 dark:border-amber-950 flex flex-col justify-between gap-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-500 flex items-center gap-1 font-semibold">
                      <History className="w-3 h-3 text-amber-600" />
                      {t.settings.historyStored}
                    </span>
                    {storageStats.historyCount > 0 && (
                      <button
                        type="button"
                        onClick={() => setPendingDeleteSection('history')}
                        className="p-1 px-1.5 text-[10px] font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded flex items-center gap-0.5 cursor-pointer transition-colors"
                        title="حذف فقط تاریخچه"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>حذف</span>
                      </button>
                    )}
                  </div>
                  <span className="font-extrabold text-slate-800 dark:text-slate-200 text-xs">
                    {formatDigits(storageStats.historyCount, currentLang)} ثبت
                  </span>
                </div>

                <div className="bg-white/80 dark:bg-slate-900/80 p-2.5 rounded-lg border border-amber-100 dark:border-amber-950 flex flex-col justify-between gap-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-500 flex items-center gap-1 font-semibold">
                      <Folder className="w-3 h-3 text-amber-600" />
                      {t.settings.categoriesStored}
                    </span>
                    {categories.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setPendingDeleteSection('categories')}
                        className="p-1 px-1.5 text-[10px] font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded flex items-center gap-0.5 cursor-pointer transition-colors"
                        title="بازنشانی دسته‌ها"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>حذف</span>
                      </button>
                    )}
                  </div>
                  <span className="font-extrabold text-slate-800 dark:text-slate-200 text-xs">
                    {formatDigits(categories.length, currentLang)} دسته
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 mt-1">
              {onExportBackup && (
                <button
                  onClick={onExportBackup}
                  disabled={books.length === 0}
                  className="flex-1 min-w-[180px] p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 font-bold text-xs hover:bg-amber-100 transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Download className="w-4 h-4 text-amber-600" />
                  <span>{t.settings.exportBtn} ({formatDigits(books.length, currentLang)} {t.settings.booksCount})</span>
                </button>
              )}

              <label className="flex-1 min-w-[200px] p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 cursor-pointer flex items-center justify-center gap-2 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                <Upload className="w-4 h-4 text-emerald-600" />
                <span>{t.settings.importBtn}</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportJSON}
                  className="hidden"
                />
              </label>

              <button
                onClick={() => setShowResetConfirm(true)}
                className="w-full sm:w-auto p-3 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 font-bold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>{t.settings.resetBtn}</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal: Delete Category Confirmation */}
      {pendingDeleteCategory && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl text-right">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center mb-4">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 mb-2">
              تأیید حذف دسته‌بندی
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 mb-6 leading-relaxed">
              آیا از حذف دسته‌بندی «<span className="font-bold text-slate-900 dark:text-white">{pendingDeleteCategory}</span>» اطمینان دارید؟ کتب این دسته به «بدون دسته‌بندی» منتقل خواهند شد.
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  onDeleteCategory(pendingDeleteCategory);
                  setPendingDeleteCategory(null);
                }}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer"
              >
                حذف دسته
              </button>
              <button
                onClick={() => setPendingDeleteCategory(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold text-xs transition-all cursor-pointer"
              >
                انصراف
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Reset All Data & Selective Cleardown */}
      {showResetConfirm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl text-right">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center mb-4">
              <Database className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 mb-2">
              تأیید پاک‌سازی و آزادسازی حافظه
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 mb-4 leading-relaxed">
              هیچ اطلاعاتی به صورت خودکار پاک نمی‌شود. می‌توانید موارد را به صورت تکی حذف نمایید، یا کل حافظه را یکجا پاکسازی کنید:
            </p>

            <div className="bg-slate-50 dark:bg-slate-800/80 rounded-xl p-3.5 border border-slate-200 dark:border-slate-700 mb-5 flex flex-col gap-2 text-xs">
              <div className="flex items-center justify-between py-1.5 border-b border-slate-200/60 dark:border-slate-700/60">
                <span className="text-slate-600 dark:text-slate-300 flex items-center gap-1.5 font-medium">
                  <BookOpen className="w-3.5 h-3.5 text-amber-600" />
                  کتب و متون بارگذاری‌شده:
                </span>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 dark:text-white">
                    {formatDigits(books.length, currentLang)} کتاب ({formatDigits(storageStats.formattedSize, currentLang)})
                  </span>
                  {books.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setPendingDeleteSection('books')}
                      className="p-1 px-2 text-[11px] font-bold bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>حذف</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between py-1.5 border-b border-slate-200/60 dark:border-slate-700/60">
                <span className="text-slate-600 dark:text-slate-300 flex items-center gap-1.5 font-medium">
                  <Bookmark className="w-3.5 h-3.5 text-amber-600" />
                  نشان‌ها و یادداشت‌های ثبت‌شده:
                </span>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 dark:text-white">
                    {formatDigits(storageStats.bookmarksCount, currentLang)} مورد
                  </span>
                  {storageStats.bookmarksCount > 0 && (
                    <button
                      type="button"
                      onClick={() => setPendingDeleteSection('bookmarks')}
                      className="p-1 px-2 text-[11px] font-bold bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>حذف</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between py-1.5 border-b border-slate-200/60 dark:border-slate-700/60">
                <span className="text-slate-600 dark:text-slate-300 flex items-center gap-1.5 font-medium">
                  <History className="w-3.5 h-3.5 text-amber-600" />
                  تاریخچه مطالعه و سرچ:
                </span>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 dark:text-white">
                    {formatDigits(storageStats.historyCount, currentLang)} ثبت
                  </span>
                  {storageStats.historyCount > 0 && (
                    <button
                      type="button"
                      onClick={() => setPendingDeleteSection('history')}
                      className="p-1 px-2 text-[11px] font-bold bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>حذف</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-slate-600 dark:text-slate-300 flex items-center gap-1.5 font-medium">
                  <Folder className="w-3.5 h-3.5 text-amber-600" />
                  دسته‌بندی‌های شخصی:
                </span>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 dark:text-white">
                    {formatDigits(categories.length, currentLang)} دسته
                  </span>
                  {categories.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setPendingDeleteSection('categories')}
                      className="p-1 px-2 text-[11px] font-bold bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>حذف</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setPendingDeleteSection('all')}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer"
              >
                تأیید و پاک‌سازی کامل حافظه
              </button>
              <button
                onClick={() => setShowResetConfirm(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold text-xs transition-all cursor-pointer"
              >
                انصراف
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Confirmation Alert Prompt for Selective / Full Delete */}
      {pendingDeleteSection && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl text-right">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center mb-4">
              <Trash2 className="w-6 h-6" />
            </div>

            <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 mb-2">
              {pendingDeleteSection === 'books' && 'تأیید حذف تمامی کتب'}
              {pendingDeleteSection === 'bookmarks' && 'تأیید حذف تمامی نشان‌ها و یادداشت‌ها'}
              {pendingDeleteSection === 'history' && 'تأیید حذف تاریخچه فعالیت‌ها'}
              {pendingDeleteSection === 'categories' && 'تأیید بازنشانی دسته‌بندی‌ها'}
              {pendingDeleteSection === 'all' && 'تأیید پاک‌سازی کامل حافظه'}
            </h3>

            <p className="text-xs text-slate-600 dark:text-slate-300 mb-6 leading-relaxed">
              {pendingDeleteSection === 'books' &&
                `آیا از پاک‌سازی تمامی متون و کتب بارگذاری‌شده (${formatDigits(books.length, currentLang)} کتاب) اطمینان دارید؟`}
              {pendingDeleteSection === 'bookmarks' &&
                `آیا از پاک‌سازی تمامی نشان‌ها و یادداشت‌های ثبت‌شده (${formatDigits(storageStats.bookmarksCount, currentLang)} مورد) اطمینان دارید؟`}
              {pendingDeleteSection === 'history' &&
                `آیا از پاک‌سازی تمامی سوابق مطالعه و جستجو (${formatDigits(storageStats.historyCount, currentLang)} ثبت) اطمینان دارید؟`}
              {pendingDeleteSection === 'categories' &&
                `آیا از حذف دسته‌بندی‌های شخصی و بازگشت به دسته‌بندی‌های پیش‌فرض اطمینان دارید؟`}
              {pendingDeleteSection === 'all' &&
                'آیا از پاک‌سازی کامل تمام اطلاعات (کتب، نشان‌ها، تاریخچه و دسته‌بندی‌ها) از حافظه مرورگر اطمینان دارید؟ این عمل غیرقابل بازگشت است.'}
            </p>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  if (pendingDeleteSection === 'books' && onClearAllBooks) {
                    onClearAllBooks();
                  } else if (pendingDeleteSection === 'bookmarks' && onClearAllBookmarks) {
                    onClearAllBookmarks();
                  } else if (pendingDeleteSection === 'history' && onClearAllHistory) {
                    onClearAllHistory();
                  } else if (pendingDeleteSection === 'categories' && onResetCategories) {
                    onResetCategories();
                  } else if (pendingDeleteSection === 'all') {
                    onResetAllData();
                    setShowResetConfirm(false);
                  }
                  setPendingDeleteSection(null);
                }}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer"
              >
                {pendingDeleteSection === 'all' ? 'تأیید و پاک‌سازی کامل' : 'بله، حذف شود'}
              </button>
              <button
                type="button"
                onClick={() => setPendingDeleteSection(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold text-xs transition-all cursor-pointer"
              >
                انصراف
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
