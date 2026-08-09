import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "20mb" }));

// Helper to get lazy Gemini AI instance
function getGeminiAI() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is missing.");
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// --- API ROUTES ---

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// 1. Morphological & Syntactic Analysis (تحلیل صرفی و نحوی و ریشه‌یابی)
app.post("/api/ai/analyze-word", async (req, res) => {
  try {
    const { word, context } = req.body;
    if (!word) {
      return res.status(400).json({ error: "Word or phrase is required." });
    }

    const ai = getGeminiAI();
    const prompt = `
تو یک استاد خبیر زبان عربی، ادبیات، علوم قرآنی و صرف و نحو هستی.
کلمه یا عبارت زیر را تحلیل جامع کن:
کلمه/عبارت: "${word}"
${context ? `متن کامل زمینه: "${context}"` : ""}

لطفاً پاسخ را دقیقاً با فرمت JSON با کلیدهای زیر برگردان:
{
  "word": "${word}",
  "root": "ریشه ثلاثی مجرد یا رباعی (مثلاً: ن-ص-ر)",
  "vazn": "وزن/باب (مثلاً: فاعِل / باب تفتیل / ...)",
  "type": "نوع کلمه (اسم / فعل / حرف / مشتق)",
  "meaning": "معنا و ترجمه دقیق کلمه در این سیاق",
  "sarf": "تحلیل کامل صرفی (زمان فعل، شخص، جنس، عدد، متعدی/لازم، جامد/مشتق)",
  "nahv": "نقش نحوی دقیق در جمله (مبتدا/خبر/فاعل/مفعول/مضاف‌الیه/مجرور...)",
  "synonyms": ["مترادف1", "مترادف2", "مترادف3"],
  "examples": ["نمونه کاربردی دیگر در قرآن یا حدیث یا شعر"]
}
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const result = JSON.parse(response.text || "{}");
    res.json(result);
  } catch (error: any) {
    console.error("AI word analysis error:", error);
    res.status(500).json({ error: error.message || "Failed to analyze word." });
  }
});

// 2. Tafsir & Text Explanation (تفسیر، شرح و ترجمه روان)
app.post("/api/ai/tafsir-explanation", async (req, res) => {
  try {
    const { text, bookName } = req.body;
    if (!text) {
      return res.status(400).json({ error: "Text is required." });
    }

    const ai = getGeminiAI();
    const prompt = `
تو پژوهشگر بزرگ متون اسلامی، حدیث، تفسیر و علوم قرآنی بر اساس منابع و علوم اهل سنت و الجماعة هستی.
عبارت زیر را از کتاب ${bookName || "متن اسلامی/کلاسیک"} تحلیل و شرح ده (با استناد به تفاسیر و شروح معتبر مانند تفسیر ابن کثیر، طبری، قرطبی یا شروح صحاح):

متن:
"${text}"

پاسخ را در قالب JSON با ساختار زیر ارسال کن:
{
  "translation": "ترجمه روان و دقیق فارسی",
  "tafsir": "شرح و تفسیر محتوایی و پیام اصلی آیه/حدیث/عبارت بر اساس منابع معتبر اهل سنت",
  "difficultWords": [
    {"word": "واژه سخت 1", "meaning": "معنی واژه"},
    {"word": "واژه سخت 2", "meaning": "معنی واژه"}
  ],
  "contextAndSource": "شان نزول / زمینه تاریخی / منبع و شواهد مرتبط در کتب حدیث و تفسیر",
  "keyLessons": ["نکته یا آموزه اخلاقی/اعتقادی 1", "نکته 2"]
}
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const result = JSON.parse(response.text || "{}");
    res.json(result);
  } catch (error: any) {
    console.error("AI Tafsir error:", error);
    res.status(500).json({ error: error.message || "Failed to generate Tafsir." });
  }
});

// 3. Diacritize (اعراب‌گذاری خودکار)
app.post("/api/ai/diacritize", async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ error: "Text is required." });
    }

    const ai = getGeminiAI();
    const prompt = `لطفاً عبارت عربی زیر را با اعراب کامل، دقیق و فصیح (تعدیل حرکات و تشکیل) اعراب‌گذاری کن. تنها متن اعراب‌گذاری شده را برگردان بدون توضیحات اضافی.\n\nمتن بدون اعراب:\n${text}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
    });

    res.json({ diacritizedText: response.text?.trim() || text });
  } catch (error: any) {
    console.error("AI Diacritize error:", error);
    res.status(500).json({ error: error.message || "Failed to diacritize text." });
  }
});

// 4. Semantic QA over Library / Ask Question (پرسش و پاسخ هوشمند از کتابخانه)
app.post("/api/ai/ask-library", async (req, res) => {
  try {
    const { question, bookSnippets } = req.body;
    if (!question) {
      return res.status(400).json({ error: "Question is required." });
    }

    const ai = getGeminiAI();
    let snippetsText = "";
    if (Array.isArray(bookSnippets) && bookSnippets.length > 0) {
      snippetsText = bookSnippets
        .map((s: any, idx: number) => `--- منبع ${idx + 1} (${s.bookName}): ---\n${s.text}`)
        .join("\n\n");
    }

    const prompt = `
تو دستیار هوشمند و پژوهشگر کتابخانه متون اسلامی بر اساس مذهب و منابع اهل سنت و الجماعة هستی.
کاربر سؤال زیر را پرسیده است:
"${question}"

${snippetsText ? `شواهد و متون استخراج شده از کتابخانه کاربر:\n${snippetsText}` : "اطلاعات تخصصی خود را بر اساس منابع معتبر اهل سنت (صحاح ستة، تفاسیر ابن کثیر، طبری و کتب فقه و اخلاق) ارائه بده."}

لطفاً پاسخی جامع، علمی، مستند با ذکر آیات، احادیث صحیح یا منابع معتبر اهل سنت ارائه کن.
پاسخ را به زبان فارسی شواهددار، روان و بخش‌بندی شده بده.
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
    });

    res.json({ answer: response.text });
  } catch (error: any) {
    console.error("AI Ask library error:", error);
    res.status(500).json({ error: error.message || "Failed to get AI answer." });
  }
});

// 5. Auto Categorization & Summarization for uploaded book
app.post("/api/ai/auto-summarize-categorize", async (req, res) => {
  try {
    const { fileName, textSample } = req.body;
    if (!textSample) {
      return res.status(400).json({ error: "Text sample is required." });
    }

    const ai = getGeminiAI();
    const prompt = `
با توجه به عنوان فایل "${fileName}" و نمونه متن زیر از کتاب:
"${textSample.substring(0, 1500)}"

لطفاً اطلاعات زیر را به صورت JSON استخراج کن:
{
  "summary": "خلاصه کوتاه 2 الی 3 جمله‌ای از موضوع کتاب",
  "suggestedCategory": "یکی از دسته‌های: صرف / نحو / قرآن / حدیث / فقه / عقاید / تاریخ / ادبیات / ادعیه / عمومی",
  "keyTopics": ["موضوع اصلی 1", "موضوع اصلی 2", "موضوع اصلی 3"],
  "language": "عربی / فارسی / عربی-فارسی"
}
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const result = JSON.parse(response.text || "{}");
    res.json(result);
  } catch (error: any) {
    console.error("AI Summarize error:", error);
    res.status(500).json({ error: error.message || "Failed to summarize text." });
  }
});

// --- VITE MIDDLEWARE / PRODUCTION STATIC ---

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
