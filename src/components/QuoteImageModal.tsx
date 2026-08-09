import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Download,
  Copy,
  Share2,
  Check,
  Palette,
  Type as TypeIcon,
  Sparkles,
  BookOpen,
  Image as ImageIcon,
} from 'lucide-react';

interface QuoteImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  quoteText: string;
  bookTitle: string;
}

export type QuoteTheme =
  | 'classic-gold'
  | 'emerald-islamic'
  | 'midnight-dark'
  | 'sepia-paper'
  | 'minimal-light';

export const QuoteImageModal: React.FC<QuoteImageModalProps> = ({
  isOpen,
  onClose,
  quoteText,
  bookTitle,
}) => {
  const [selectedTheme, setSelectedTheme] = useState<QuoteTheme>('classic-gold');
  const [showBismillah, setShowBismillah] = useState(true);
  const [showWatermark, setShowWatermark] = useState(true);
  const [fontStyle, setFontStyle] = useState<'vazir' | 'serif'>('vazir');
  const [isCopied, setIsCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const cardPreviewRef = useRef<HTMLDivElement | null>(null);

  if (!isOpen) return null;

  // Render canvas to data URL / Blob for exporting
  const drawCardToCanvas = (): HTMLCanvasElement | null => {
    const canvas = document.createElement('canvas');
    const width = 1200;
    const height = 1200;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // Theme Configs
    let bgGradient: [string, string] = ['#fffdf7', '#fdf6e2'];
    let textColor = '#291e11';
    let accentColor = '#b45309';
    let borderColor = 'rgba(180, 83, 9, 0.3)';
    let footerBg = 'rgba(180, 83, 9, 0.06)';

    if (selectedTheme === 'emerald-islamic') {
      bgGradient = ['#064e3b', '#022c22'];
      textColor = '#fef3c7';
      accentColor = '#f59e0b';
      borderColor = 'rgba(245, 158, 11, 0.4)';
      footerBg = 'rgba(245, 158, 11, 0.1)';
    } else if (selectedTheme === 'midnight-dark') {
      bgGradient = ['#0f172a', '#1e293b'];
      textColor = '#f8fafc';
      accentColor = '#fbbf24';
      borderColor = 'rgba(251, 191, 36, 0.3)';
      footerBg = 'rgba(251, 191, 36, 0.08)';
    } else if (selectedTheme === 'sepia-paper') {
      bgGradient = ['#fef3c7', '#fde68a'];
      textColor = '#451a03';
      accentColor = '#92400e';
      borderColor = 'rgba(146, 64, 14, 0.3)';
      footerBg = 'rgba(146, 64, 14, 0.08)';
    } else if (selectedTheme === 'minimal-light') {
      bgGradient = ['#ffffff', '#f8fafc'];
      textColor = '#0f172a';
      accentColor = '#d97706';
      borderColor = 'rgba(217, 119, 6, 0.25)';
      footerBg = 'rgba(217, 119, 6, 0.05)';
    }

    // 1. Draw Background Gradient
    const grad = ctx.createLinearGradient(0, 0, width, height);
    grad.addColorStop(0, bgGradient[0]);
    grad.addColorStop(1, bgGradient[1]);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // 2. Outer Ornamental Border
    ctx.lineWidth = 10;
    ctx.strokeStyle = accentColor;
    ctx.strokeRect(40, 40, width - 80, height - 80);

    ctx.lineWidth = 2;
    ctx.strokeStyle = borderColor;
    ctx.strokeRect(55, 55, width - 110, height - 110);

    // Corner Accents
    const cornerSize = 40;
    ctx.strokeStyle = accentColor;
    ctx.lineWidth = 4;
    // Top-Left
    ctx.beginPath();
    ctx.moveTo(70, 70 + cornerSize);
    ctx.lineTo(70, 70);
    ctx.lineTo(70 + cornerSize, 70);
    ctx.stroke();
    // Top-Right
    ctx.beginPath();
    ctx.moveTo(width - 70 - cornerSize, 70);
    ctx.lineTo(width - 70, 70);
    ctx.lineTo(width - 70, 70 + cornerSize);
    ctx.stroke();
    // Bottom-Left
    ctx.beginPath();
    ctx.moveTo(70, height - 70 - cornerSize);
    ctx.lineTo(70, height - 70);
    ctx.lineTo(70 + cornerSize, height - 70);
    ctx.stroke();
    // Bottom-Right
    ctx.beginPath();
    ctx.moveTo(width - 70 - cornerSize, height - 70);
    ctx.lineTo(width - 70, height - 70);
    ctx.lineTo(width - 70, height - 70 - cornerSize);
    ctx.stroke();

    // 3. Header (Bismillah)
    let currentY = 150;
    ctx.textAlign = 'center';

    if (showBismillah) {
      ctx.font = 'bold 36px "Amiri", "Vazirmatn", serif';
      ctx.fillStyle = accentColor;
      ctx.fillText('بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ', width / 2, currentY);
      currentY += 60;
    }

    // Header Ornamental Symbol
    ctx.font = '28px "Vazirmatn", sans-serif';
    ctx.fillStyle = accentColor;
    ctx.fillText('❖ ─── ✤ ─── ❖', width / 2, currentY);
    currentY += 80;

    // 4. Quote Content Text Wrapping
    const fontFamilyName =
      fontStyle === 'serif'
        ? '"Amiri", "Traditional Arabic", serif'
        : '"Vazirmatn", sans-serif';

    // Calculate dynamic font size based on text length
    let fontSize = 42;
    if (quoteText.length > 300) fontSize = 32;
    else if (quoteText.length > 200) fontSize = 36;
    else if (quoteText.length < 80) fontSize = 48;

    ctx.font = `${fontSize}px ${fontFamilyName}`;
    ctx.fillStyle = textColor;
    ctx.direction = 'rtl';

    const maxLineWidth = width - 240;
    const words = quoteText.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    for (let n = 0; n < words.length; n++) {
      const testLine = currentLine ? `${currentLine} ${words[n]}` : words[n];
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxLineWidth && n > 0) {
        lines.push(currentLine);
        currentLine = words[n];
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine) lines.push(currentLine);

    // Limit lines to fit canvas comfortably
    const maxAllowedLines = 12;
    const displayedLines = lines.slice(0, maxAllowedLines);
    if (lines.length > maxAllowedLines) {
      displayedLines[maxAllowedLines - 1] += ' ...';
    }

    const lineHeight = fontSize * 1.6;
    const totalTextHeight = displayedLines.length * lineHeight;

    // Adjust starting Y to keep text centered vertically
    const availableHeight = height - currentY - 220;
    let startTextY = currentY + Math.max(20, (availableHeight - totalTextHeight) / 2);

    for (let i = 0; i < displayedLines.length; i++) {
      ctx.fillText(displayedLines[i], width / 2, startTextY + i * lineHeight);
    }

    // 5. Divider Line Before Footer
    const footerY = height - 150;
    ctx.beginPath();
    ctx.moveTo(200, footerY - 40);
    ctx.lineTo(width - 200, footerY - 40);
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 2;
    ctx.stroke();

    // 6. Book Title & Watermark
    ctx.font = 'bold 30px "Vazirmatn", sans-serif';
    ctx.fillStyle = accentColor;
    ctx.fillText(`📖 ${bookTitle}`, width / 2, footerY);

    if (showWatermark) {
      ctx.font = '22px "Vazirmatn", sans-serif';
      ctx.fillStyle = textColor;
      ctx.globalAlpha = 0.7;
      ctx.fillText('کتابخانه متون اسلامی', width / 2, footerY + 45);
      ctx.globalAlpha = 1.0;
    }

    return canvas;
  };

  const handleDownload = () => {
    setIsGenerating(true);
    setTimeout(() => {
      const canvas = drawCardToCanvas();
      if (!canvas) {
        setIsGenerating(false);
        return;
      }
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `عکس‌نوشته_${bookTitle.slice(0, 15).replace(/\s+/g, '_')}.png`;
      link.href = dataUrl;
      link.click();
      setIsGenerating(false);
    }, 50);
  };

  const handleCopyImage = async () => {
    setIsGenerating(true);
    setTimeout(async () => {
      try {
        const canvas = drawCardToCanvas();
        if (!canvas) {
          setIsGenerating(false);
          return;
        }
        canvas.toBlob(async (blob) => {
          if (blob && 'ClipboardItem' in window) {
            await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
          } else {
            handleDownload();
          }
          setIsGenerating(false);
        }, 'image/png');
      } catch (err) {
        handleDownload();
        setIsGenerating(false);
      }
    }, 50);
  };

  const handleShare = () => {
    setIsGenerating(true);
    setTimeout(() => {
      const canvas = drawCardToCanvas();
      if (!canvas) {
        setIsGenerating(false);
        return;
      }
      canvas.toBlob(async (blob) => {
        setIsGenerating(false);
        if (blob && navigator.share && navigator.canShare) {
          const file = new File([blob], 'quote.png', { type: 'image/png' });
          if (navigator.canShare({ files: [file] })) {
            try {
              await navigator.share({
                title: bookTitle,
                text: quoteText,
                files: [file],
              });
              return;
            } catch (e) {}
          }
        }
        // Fallback to download
        handleDownload();
      }, 'image/png');
    }, 50);
  };

  const themeOptions: { id: QuoteTheme; name: string; bgClass: string; borderClass: string }[] = [
    {
      id: 'classic-gold',
      name: 'زرین کلاسیک',
      bgClass: 'bg-amber-100/80 text-amber-950',
      borderClass: 'border-amber-500',
    },
    {
      id: 'emerald-islamic',
      name: 'زمردی اسلامی',
      bgClass: 'bg-emerald-900 text-emerald-100',
      borderClass: 'border-emerald-500',
    },
    {
      id: 'midnight-dark',
      name: 'شب تاریک',
      bgClass: 'bg-slate-900 text-slate-100',
      borderClass: 'border-amber-400',
    },
    {
      id: 'sepia-paper',
      name: 'کاغذ کهن',
      bgClass: 'bg-amber-200/90 text-amber-900',
      borderClass: 'border-amber-700',
    },
    {
      id: 'minimal-light',
      name: 'مینیمال سپید',
      bgClass: 'bg-white text-slate-900',
      borderClass: 'border-amber-600',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-slate-900 dark:text-slate-100">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
              <ImageIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm">ساخت عکس‌نوشته و کارت اشتراک</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                تولید تصویر با کیفیت از فراز منتخب برای اشتراک‌گذاری
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col gap-5">
          {/* Live Card Preview Box */}
          <div className="flex flex-col items-center justify-center">
            <div
              ref={cardPreviewRef}
              className={`w-full max-w-md aspect-square rounded-2xl p-6 sm:p-8 flex flex-col justify-between shadow-xl transition-all relative overflow-hidden border-4 ${
                selectedTheme === 'classic-gold'
                  ? 'bg-gradient-to-br from-[#fffdf7] to-[#fdf6e2] text-[#291e11] border-amber-500/40'
                  : selectedTheme === 'emerald-islamic'
                  ? 'bg-gradient-to-br from-[#064e3b] to-[#022c22] text-[#fef3c7] border-amber-400/50'
                  : selectedTheme === 'midnight-dark'
                  ? 'bg-gradient-to-br from-[#0f172a] to-[#1e293b] text-[#f8fafc] border-amber-400/40'
                  : selectedTheme === 'sepia-paper'
                  ? 'bg-gradient-to-br from-[#fef3c7] to-[#fde68a] text-[#451a03] border-amber-800/40'
                  : 'bg-gradient-to-br from-white to-slate-50 text-slate-900 border-amber-600/30'
              }`}
            >
              {/* Decorative Corner Ornaments */}
              <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-current opacity-60" />
              <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-current opacity-60" />
              <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-current opacity-60" />
              <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-current opacity-60" />

              {/* Bismillah Header */}
              <div className="text-center flex flex-col items-center gap-1">
                {showBismillah && (
                  <p className="font-serif font-bold text-amber-600 dark:text-amber-400 text-xs sm:text-sm">
                    بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
                  </p>
                )}
                <span className="text-[10px] opacity-70 tracking-widest">❖ ─── ✤ ─── ❖</span>
              </div>

              {/* Quote Content Text */}
              <div className="my-auto py-2 text-center">
                <p
                  className={`leading-relaxed text-sm sm:text-base font-semibold ${
                    fontStyle === 'serif' ? 'font-serif' : 'font-sans'
                  } line-clamp-8`}
                  style={{ direction: 'rtl' }}
                >
                  «{quoteText}»
                </p>
              </div>

              {/* Card Footer */}
              <div className="pt-3 border-t border-current/15 text-center flex flex-col items-center gap-1">
                <p className="font-bold text-xs flex items-center justify-center gap-1.5 opacity-90">
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>{bookTitle}</span>
                </p>
                {showWatermark && (
                  <p className="text-[10px] opacity-60 font-medium">کتابخانه متون اسلامی</p>
                )}
              </div>
            </div>
          </div>

          {/* Customization Options */}
          <div className="flex flex-col gap-4 bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-700/60">
            {/* Theme Selector */}
            <div>
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-amber-600" />
                <span>پوسته و رنگ‌بندی کارت:</span>
              </label>
              <div className="flex flex-wrap items-center gap-2">
                {themeOptions.map((th) => (
                  <button
                    key={th.id}
                    onClick={() => setSelectedTheme(th.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${
                      th.bgClass
                    } ${
                      selectedTheme === th.id
                        ? 'ring-2 ring-amber-500 scale-105 shadow-xs'
                        : 'opacity-80 hover:opacity-100'
                    }`}
                  >
                    <span>{th.name}</span>
                    {selectedTheme === th.id && <Check className="w-3.5 h-3.5" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Font & Toggles */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
              {/* Font Choice */}
              <div>
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 flex items-center gap-1.5">
                  <TypeIcon className="w-3.5 h-3.5 text-amber-600" />
                  <span>قلم و قلم‌نویسی:</span>
                </label>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setFontStyle('vazir')}
                    className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold border ${
                      fontStyle === 'vazir'
                        ? 'bg-amber-600 text-white border-amber-600'
                        : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    وزیرمتن (نرم)
                  </button>
                  <button
                    onClick={() => setFontStyle('serif')}
                    className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-serif font-bold border ${
                      fontStyle === 'serif'
                        ? 'bg-amber-600 text-white border-amber-600'
                        : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    امیری (نسخ کتبی)
                  </button>
                </div>
              </div>

              {/* Toggles */}
              <div className="flex flex-col justify-end gap-2">
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showBismillah}
                    onChange={(e) => setShowBismillah(e.target.checked)}
                    className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4"
                  />
                  <span>نمایش «بسم الله الرحمن الرحيم»</span>
                </label>
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showWatermark}
                    onChange={(e) => setShowWatermark(e.target.checked)}
                    className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4"
                  />
                  <span>نمایش نشان «کتابخانه متون اسلامی»</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex flex-wrap items-center justify-between gap-2">
          <button
            onClick={handleCopyImage}
            disabled={isGenerating}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 font-bold text-xs transition-colors"
          >
            {isCopied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            <span>{isCopied ? 'تصویر کپی شد!' : 'کپی تصویر'}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              disabled={isGenerating}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors"
            >
              <Share2 className="w-4 h-4" />
              <span>اشتراک‌گذاری</span>
            </button>

            <button
              onClick={handleDownload}
              disabled={isGenerating}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-md transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>ذخیره / دانلود PNG</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
