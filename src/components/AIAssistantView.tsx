import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Search,
  BookOpen,
  CheckCircle,
  AlertCircle,
  Loader2,
  Copy,
  BookMarked,
  Languages,
  Layers,
  HelpCircle,
} from 'lucide-react';
import { BookFile, AIWordAnalysis, AITafsirResult, AppLanguage } from '../types';
import { translations } from '../utils/i18n';

interface AIAssistantViewProps {
  books: BookFile[];
  appLanguage?: AppLanguage;
}

export const AIAssistantView: React.FC<AIAssistantViewProps> = ({
  books,
  appLanguage = 'fa',
}) => {
  const t = translations[appLanguage]?.aiAssistantView || translations.fa.aiAssistantView;

  const [activeSubTab, setActiveSubTab] = useState<
    'sarf' | 'tafsir' | 'qa' | 'diacritize'
  >('sarf');

  // Sarf State
  const [wordInput, setWordInput] = useState('');
  const [sarfContext, setSarfContext] = useState('');
  const [sarfLoading, setSarfLoading] = useState(false);
  const [sarfResult, setSarfResult] = useState<AIWordAnalysis | null>(null);

  // Tafsir State
  const [tafsirText, setTafsirText] = useState('');
  const [tafsirBookName, setTafsirBookName] = useState('');
  const [tafsirLoading, setTafsirLoading] = useState(false);
  const [tafsirResult, setTafsirResult] = useState<AITafsirResult | null>(null);

  // Library QA State
  const [qaQuestion, setQaQuestion] = useState('');
  const [qaLoading, setQaLoading] = useState(false);
  const [qaAnswer, setQaAnswer] = useState('');

  // Diacritize State
  const [diacritizeText, setDiacritizeText] = useState('');
  const [diacritizeLoading, setDiacritizeLoading] = useState(false);
  const [diacritizedResult, setDiacritizedResult] = useState('');

  // AI Progress Percentage Tracker
  const [aiProgress, setAiProgress] = useState(0);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    const isLoading = sarfLoading || tafsirLoading || qaLoading || diacritizeLoading;

    if (isLoading) {
      setAiProgress(10);
      timer = setInterval(() => {
        setAiProgress((prev) => {
          if (prev >= 95) return 95;
          return prev + Math.floor(Math.random() * 8 + 5);
        });
      }, 250);
    } else {
      setAiProgress(0);
    }

    return () => clearInterval(timer);
  }, [sarfLoading, tafsirLoading, qaLoading, diacritizeLoading]);

  // 1. Analyze Word Sarf & Nahv
  const handleAnalyzeSarf = async () => {
    if (!wordInput.trim()) return;
    setSarfLoading(true);
    setSarfResult(null);

    try {
      const res = await fetch('/api/ai/analyze-word', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ word: wordInput, context: sarfContext }),
      });
      const data = await res.json();
      if (res.ok) {
        setSarfResult(data);
      } else {
        alert(data.error || 'خطا در تحلیل کلمه.');
      }
    } catch (e) {
      alert('خطا در ارتباط با سرور.');
    } finally {
      setSarfLoading(false);
    }
  };


  // 2. Tafsir & Explanation
  const handleTafsir = async () => {
    if (!tafsirText.trim()) return;
    setTafsirLoading(true);
    setTafsirResult(null);

    try {
      const res = await fetch('/api/ai/tafsir-explanation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: tafsirText, bookName: tafsirBookName }),
      });
      const data = await res.json();
      if (res.ok) {
        setTafsirResult(data);
      } else {
        alert(data.error || 'خطا در تولید تفسیر.');
      }
    } catch (e) {
      alert('خطا در ارتباط با سرور.');
    } finally {
      setTafsirLoading(false);
    }
  };

  // 3. Ask Library QA
  const handleAskLibrary = async () => {
    if (!qaQuestion.trim()) return;
    setQaLoading(true);
    setQaAnswer('');

    try {
      // Find relevant snippets from library
      const snippets = books.slice(0, 5).map((b) => ({
        bookName: b.name,
        text: b.content.substring(0, 800),
      }));

      const res = await fetch('/api/ai/ask-library', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: qaQuestion,
          bookSnippets: snippets,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setQaAnswer(data.answer);
      } else {
        alert(data.error || 'خطا در پاسخ‌دهی.');
      }
    } catch (e) {
      alert('خطا در ارتباط با سرور.');
    } finally {
      setQaLoading(false);
    }
  };

  // 4. Diacritize Text
  const handleDiacritize = async () => {
    if (!diacritizeText.trim()) return;
    setDiacritizeLoading(true);
    setDiacritizedResult('');

    try {
      const res = await fetch('/api/ai/diacritize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: diacritizeText }),
      });
      const data = await res.json();
      if (res.ok) {
        setDiacritizedResult(data.diacritizedText);
      } else {
        alert(data.error || 'خطا در اعراب‌گذاری.');
      }
    } catch (e) {
      alert('خطا در ارتباط با سرور.');
    } finally {
      setDiacritizeLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-5 pb-24 max-w-4xl mx-auto px-4 pt-3">
      {/* AI Assistant Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-600 via-amber-500 to-emerald-600 text-white shadow-xl shadow-amber-500/10 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="font-bold text-base">
              {t.bannerTitle}
            </h2>
            <p className="text-xs text-amber-100 mt-1 leading-relaxed">
              {t.bannerDesc}
            </p>
          </div>
        </div>
      </div>

      {/* Progress Bar Indicator for AI tasks */}
      {aiProgress > 0 && (
        <div className="bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 p-4 rounded-2xl animate-fadeIn">
          <div className="flex items-center justify-between text-xs font-bold text-amber-800 dark:text-amber-300 mb-2">
            <span className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-amber-600" />
              <span>{t.analyzing}</span>
            </span>
            <span className="font-mono dir-ltr">{aiProgress}%</span>
          </div>
          <div className="w-full h-2.5 bg-amber-100 dark:bg-amber-900/60 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-600 to-emerald-500 transition-all duration-300 rounded-full"
              style={{ width: `${aiProgress}%` }}
            />
          </div>
        </div>
      )}


      {/* Sub Tabs Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80">
        <button
          onClick={() => setActiveSubTab('sarf')}
          className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            activeSubTab === 'sarf'
              ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>{t.tabSarf}</span>
        </button>

        <button
          onClick={() => setActiveSubTab('tafsir')}
          className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            activeSubTab === 'tafsir'
              ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <BookMarked className="w-4 h-4" />
          <span>{t.tabTafsir}</span>
        </button>

        <button
          onClick={() => setActiveSubTab('qa')}
          className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            activeSubTab === 'qa'
              ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <HelpCircle className="w-4 h-4" />
          <span>{t.tabQA}</span>
        </button>

        <button
          onClick={() => setActiveSubTab('diacritize')}
          className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            activeSubTab === 'diacritize'
              ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <Languages className="w-4 h-4" />
          <span>{t.tabDiacritize}</span>
        </button>
      </div>

      {/* Sub Tab 1: Sarf & Nahv Analysis */}
      {activeSubTab === 'sarf' && (
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-4">
          <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Layers className="w-4 h-4 text-amber-600" />
            <span>{t.sarfTitle}</span>
          </h3>

          <div className="flex flex-col gap-3">
            <div>
              <label className="text-xs font-bold text-slate-500 mb-1 block">
                {t.sarfWordLabel}
              </label>
              <input
                type="text"
                value={wordInput}
                onChange={(e) => setWordInput(e.target.value)}
                placeholder={t.sarfWordPlaceholder}
                className="w-full p-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-500 mb-1 block">
                {t.sarfContextLabel}
              </label>
              <textarea
                value={sarfContext}
                onChange={(e) => setSarfContext(e.target.value)}
                placeholder={t.sarfContextPlaceholder}
                className="w-full h-16 p-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
              />
            </div>

            <button
              onClick={handleAnalyzeSarf}
              disabled={sarfLoading || !wordInput.trim()}
              className="py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-emerald-600 hover:from-amber-700 hover:to-emerald-700 text-white font-bold text-xs shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 transition-all active:scale-[0.98]"
            >
              {sarfLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{t.processing}</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>{t.startAnalyze}</span>
                </>
              )}
            </button>
          </div>

          {/* Sarf Result Display Card */}
          {sarfResult && (
            <div className="mt-2 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 flex flex-col gap-3 animate-fadeIn">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
                <span className="font-bold text-base text-amber-600 dark:text-amber-400">
                  {sarfResult.word}
                </span>
                <span className="bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-200 text-xs font-bold px-2.5 py-0.5 rounded-md">
                  {t.root}: {sarfResult.root}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                <div className="p-2.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
                  <span className="text-slate-400 font-bold block mb-0.5">
                    {t.vazn}:
                  </span>
                  <span className="font-bold">{sarfResult.vazn || '-'}</span>
                </div>

                <div className="p-2.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
                  <span className="text-slate-400 font-bold block mb-0.5">
                    {t.wordType}:
                  </span>
                  <span className="font-bold">{sarfResult.type || '-'}</span>
                </div>

                <div className="p-2.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200/60 dark:border-slate-700/60 col-span-2 sm:col-span-1">
                  <span className="text-slate-400 font-bold block mb-0.5">
                    {t.exactMeaning}:
                  </span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    {sarfResult.meaning || '-'}
                  </span>
                </div>
              </div>

              <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200/60 dark:border-slate-700/60 text-xs leading-relaxed">
                <span className="font-bold text-amber-600 block mb-1">
                  {t.sarfAnalysis}:
                </span>
                <span>{sarfResult.sarf}</span>
              </div>

              <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200/60 dark:border-slate-700/60 text-xs leading-relaxed">
                <span className="font-bold text-emerald-600 block mb-1">
                  {t.nahvRole}:
                </span>
                <span>{sarfResult.nahv}</span>
              </div>

              {sarfResult.synonyms && sarfResult.synonyms.length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap text-xs">
                  <span className="font-bold text-slate-400">{t.synonyms}:</span>
                  {sarfResult.synonyms.map((s, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-200 border border-amber-200/60 text-[11px]"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Sub Tab 2: Tafsir & Explanation */}
      {activeSubTab === 'tafsir' && (
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-4">
          <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <BookMarked className="w-4 h-4 text-amber-600" />
            <span>{t.tafsirTitle}</span>
          </h3>

          <div className="flex flex-col gap-3">
            <div>
              <label className="text-xs font-bold text-slate-500 mb-1 block">
                {t.bookSourceLabel}
              </label>
              <input
                type="text"
                value={tafsirBookName}
                onChange={(e) => setTafsirBookName(e.target.value)}
                placeholder={t.bookSourcePlaceholder}
                className="w-full p-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-500 mb-1 block">
                {t.verseTextLabel}
              </label>
              <textarea
                value={tafsirText}
                onChange={(e) => setTafsirText(e.target.value)}
                placeholder={t.verseTextPlaceholder}
                className="w-full h-24 p-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
              />
            </div>

            <button
              onClick={handleTafsir}
              disabled={tafsirLoading || !tafsirText.trim()}
              className="py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 transition-all active:scale-[0.98]"
            >
              {tafsirLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{t.generatingTafsir}</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>{t.generateTafsirBtn}</span>
                </>
              )}
            </button>
          </div>

          {/* Tafsir Result */}
          {tafsirResult && (
            <div className="mt-2 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 flex flex-col gap-3 animate-fadeIn text-xs leading-relaxed">
              <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
                <span className="font-bold text-emerald-600 block mb-1">
                  {t.fluentTranslation}:
                </span>
                <span className="font-medium text-slate-900 dark:text-slate-100">
                  {tafsirResult.translation}
                </span>
              </div>

              <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
                <span className="font-bold text-amber-600 block mb-1">
                  {t.contentTafsir}:
                </span>
                <span>{tafsirResult.tafsir}</span>
              </div>

              {tafsirResult.difficultWords &&
                tafsirResult.difficultWords.length > 0 && (
                  <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
                    <span className="font-bold text-slate-500 block mb-1.5">
                      {t.difficultWords}:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {tafsirResult.difficultWords.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-1.5 p-1.5 bg-slate-50 dark:bg-slate-900 rounded-lg text-[11px]"
                        >
                          <span className="font-bold text-amber-600">
                            {item.word}:
                          </span>
                          <span>{item.meaning}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
            </div>
          )}
        </div>
      )}

      {/* Sub Tab 3: QA across Library */}
      {activeSubTab === 'qa' && (
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-4">
          <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-amber-600" />
            <span>{t.qaTitle}</span>
          </h3>

          <div className="flex flex-col gap-3">
            <div>
              <label className="text-xs font-bold text-slate-500 mb-1 block">
                {t.questionLabel}
              </label>
              <textarea
                value={qaQuestion}
                onChange={(e) => setQaQuestion(e.target.value)}
                placeholder={t.questionPlaceholder}
                className="w-full h-24 p-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
              />
            </div>

            <button
              onClick={handleAskLibrary}
              disabled={qaLoading || !qaQuestion.trim()}
              className="py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-emerald-600 hover:from-amber-700 hover:to-emerald-700 text-white font-bold text-xs shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 transition-all active:scale-[0.98]"
            >
              {qaLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{t.extractingAnswer}</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>{t.getAnswerBtn}</span>
                </>
              )}
            </button>
          </div>

          {/* QA Answer */}
          {qaAnswer && (
            <div className="mt-2 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 leading-relaxed text-xs text-slate-900 dark:text-slate-100 whitespace-pre-wrap animate-fadeIn">
              <span className="font-bold text-emerald-600 block mb-2 text-sm">
                {t.documentedAnswer}:
              </span>
              {qaAnswer}
            </div>
          )}
        </div>
      )}

      {/* Sub Tab 4: Diacritize */}
      {activeSubTab === 'diacritize' && (
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-4">
          <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Languages className="w-4 h-4 text-amber-600" />
            <span>{t.diacritizeTitle}</span>
          </h3>

          <div className="flex flex-col gap-3">
            <div>
              <label className="text-xs font-bold text-slate-500 mb-1 block">
                {t.rawArabicTextLabel}
              </label>
              <textarea
                value={diacritizeText}
                onChange={(e) => setDiacritizeText(e.target.value)}
                placeholder={t.rawArabicTextPlaceholder}
                className="w-full h-28 p-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
              />
            </div>

            <button
              onClick={handleDiacritize}
              disabled={diacritizeLoading || !diacritizeText.trim()}
              className="py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 transition-all active:scale-[0.98]"
            >
              {diacritizeLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{t.diacritizing}</span>
                </>
              ) : (
                <>
                  <Languages className="w-4 h-4" />
                  <span>{t.applyDiacritizeBtn}</span>
                </>
              )}
            </button>
          </div>

          {diacritizedResult && (
            <div className="mt-2 p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-xs leading-loose font-[Amiri] text-justify font-bold text-slate-900 dark:text-amber-100 animate-fadeIn relative">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(diacritizedResult);
                  alert(appLanguage === 'en' ? 'Copied to clipboard.' : appLanguage === 'ar' ? 'تم النسخ إلى الحافظة.' : 'متن با موفقیت کپی شد.');
                }}
                className="absolute left-3 top-3 p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"
                title={t.copyResult}
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
              {diacritizedResult}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
