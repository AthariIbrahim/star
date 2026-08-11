import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const currentFilename = typeof __filename !== 'undefined'
  ? __filename
  : (import.meta && import.meta.url ? fileURLToPath(import.meta.url) : '');
const currentDirname = typeof __dirname !== 'undefined'
  ? __dirname
  : path.dirname(currentFilename || process.cwd());

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '50mb' }));

// Server-side Gemini Client setup
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('مفتاح Gemini API غير متاح في متغيرات البيئة. في منصة AI Studio يتم توفير المفتاح تلقائياً أو يمكنك إضافته من قائمة الإعدادات (Settings).');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
};

// --- API ENDPOINTS ---

// 1. Google Quick Login / Auth simulation & persistence
app.post('/api/auth/google', (req: Request, res: Response) => {
  const { email, name, avatarUrl } = req.body;
  const user = {
    id: `usr_${Date.now()}`,
    name: name || 'طالب جديد',
    email: email || 'student@gmail.com',
    avatarUrl: avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',
    isLoggedIn: true,
    provider: 'google' as const,
    streakDays: 8,
    points: 1350,
    level: 'طالب نشط',
    joinedDate: new Date().toISOString().split('T')[0],
  };
  res.json({ success: true, user });
});

// Helper function to sanitize and normalize MIME types for Gemini API
const sanitizeMimeType = (mimeType: string, fileName?: string): string => {
  let mime = (mimeType || '').toLowerCase().trim();
  const ext = fileName ? fileName.split('.').pop()?.toLowerCase() : '';

  if (ext === 'pdf') return 'application/pdf';
  if (ext === 'png') return 'image/png';
  if (ext === 'jpg' || ext === 'jpeg') return 'image/jpeg';
  if (ext === 'webp') return 'image/webp';
  if (ext === 'gif') return 'image/gif';
  if (ext === 'mp3' || ext === 'mpeg') return 'audio/mp3';
  if (ext === 'wav') return 'audio/wav';
  if (ext === 'm4a') return 'audio/m4a';
  if (ext === 'aac') return 'audio/aac';
  if (ext === 'ogg') return 'audio/ogg';
  if (ext === 'mp4') return 'video/mp4';
  if (ext === 'webm') return 'video/webm';
  if (ext === 'mov') return 'video/mov';
  if (['txt', 'md', 'csv', 'json', 'js', 'ts', 'html', 'css', 'py', 'doc', 'docx'].includes(ext || '')) return 'text/plain';

  if (mime === 'audio/mpeg' || mime === 'audio/mp3' || mime === 'audio/x-mp3') return 'audio/mp3';
  if (mime === 'audio/x-m4a' || mime === 'audio/m4a') return 'audio/m4a';
  if (mime === 'audio/wav' || mime === 'audio/x-wav') return 'audio/wav';
  if (mime === 'audio/webm') return 'audio/webm';
  if (mime === 'audio/ogg') return 'audio/ogg';
  if (mime === 'image/jpeg' || mime === 'image/jpg') return 'image/jpeg';
  if (mime === 'image/png') return 'image/png';
  if (mime === 'image/webp') return 'image/webp';
  if (mime === 'application/pdf') return 'application/pdf';

  if (mime.startsWith('image/')) return mime;
  if (mime.startsWith('audio/')) return mime;
  if (mime.startsWith('video/')) return mime;
  if (mime.startsWith('text/')) return 'text/plain';

  return 'text/plain';
};

// Track quota exhausted models temporarily to avoid repeated 429 failures
const modelQuotaCooldown: Record<string, number> = {};

// Helper function to call Gemini with retry logic and model fallback for 503/429/404/UNAVAILABLE errors
const callGeminiWithRetry = async (
  ai: GoogleGenAI,
  options: {
    contents: any;
    config?: any;
    primaryModel?: string;
    fallbackModel?: string;
  }
) => {
  const allCandidateModels = Array.from(
    new Set([
      options.primaryModel || 'gemini-3.6-flash',
      options.fallbackModel || 'gemini-3.1-flash-lite',
      'gemini-3.6-flash',
      'gemini-3.5-flash',
      'gemini-3.1-flash-lite',
      'gemini-2.5-flash',
    ])
  );

  const now = Date.now();
  let modelsToTry = allCandidateModels.filter(m => !modelQuotaCooldown[m] || modelQuotaCooldown[m] < now);
  if (modelsToTry.length === 0) {
    modelsToTry = allCandidateModels;
  }

  let lastError: any = null;

  for (const model of modelsToTry) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const res = await ai.models.generateContent({
          model,
          contents: options.contents,
          config: options.config,
        });
        return res;
      } catch (err: any) {
        lastError = err;
        const errMsg = err?.message || String(err);
        const errCode = err?.code || err?.status;
        const isNotFound = errCode === 'NOT_FOUND' || errCode === 404 || errMsg.includes('no longer available') || errMsg.includes('NOT_FOUND');
        const isQuotaOrUnavailable =
          isNotFound ||
          errCode === 'RESOURCE_EXHAUSTED' ||
          errCode === 'UNAVAILABLE' ||
          errCode === 429 ||
          errCode === 503 ||
          errCode === 502 ||
          errCode === 504 ||
          errMsg.includes('429') ||
          errMsg.includes('503') ||
          errMsg.includes('UNAVAILABLE') ||
          errMsg.includes('unavailable') ||
          errMsg.includes('RESOURCE_EXHAUSTED') ||
          errMsg.includes('Quota exceeded') ||
          errMsg.includes('Overloaded');

        if (isQuotaOrUnavailable) {
          // Permanently disable deprecated 404 models, 5 min cooldown for temporary rate limits
          modelQuotaCooldown[model] = Date.now() + (isNotFound ? 24 * 60 * 60 * 1000 : 5 * 60 * 1000);
          console.log(`Model ${model} placed on ${isNotFound ? '24h' : '5m'} cooldown (${errCode || 'unavailable'}). Switching to fallback model...`);
          break;
        }

        console.warn(`Gemini attempt ${attempt} for model ${model}:`, errMsg);
        await new Promise((resolve) => setTimeout(resolve, 500 * attempt));
      }
    }
  }

  throw lastError || new Error('فشل الاتصال بنماذج الذكاء الاصطناعي بسبب الضغط العالي.');
};

// Helper function to clean English filler/gibberish words
const cleanGarbageText = (text: string): string => {
  if (typeof text !== 'string') return text;
  return text
    .replace(/(?:\b(?:Lecture\s*\d+|Chemistry_Chapter_\d+|Dedicated_Guide|Detailed|Guide|Direct|Summary|Note|Manual|sheet|template|layout|schema|generator|standard|output|system|text|processing|structure|context|set|formatting|rules|check|valid|input|reference|parsing|correct|compliance|JSON|result|strictly|data|format|syntax|standards|generation|strict|specification|validation|logic|Matrix|Balance|Density|Dynamics|Scale|Value|Metric|Operations|Scope|Interface|Process|Dynamic|Vector|Analysis|Unit|Strategy|Framework|Engine|Pattern|Control|Core|Base|Platform|Execution|Systems|validate|string)\b[\s_()\-:]*){2,}/gi, '')
    .replace(/Chemistry_Chapter_\d+_Dedicated_Guide/gi, '')
    .replace(/Lecture\s*\d+:\s*Semiconductor\s*Chemistry/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
};

const sanitizeObjectText = (obj: any): any => {
  if (typeof obj === 'string') {
    return cleanGarbageText(obj);
  }
  if (Array.isArray(obj)) {
    return obj.map(sanitizeObjectText);
  }
  if (obj && typeof obj === 'object') {
    const cleaned: any = {};
    for (const [k, v] of Object.entries(obj)) {
      cleaned[k] = sanitizeObjectText(v);
    }
    return cleaned;
  }
  return obj;
};

// Helper function to safely parse JSON from Gemini text response
const safeParseJson = (rawText: string | undefined): any => {
  if (!rawText) return {};
  let cleaned = rawText.trim();
  // Strip Markdown code fences if present
  cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();

  const tryParse = (str: string) => {
    try {
      return JSON.parse(str);
    } catch {
      return null;
    }
  };

  let parsed = tryParse(cleaned);
  if (parsed) return sanitizeObjectText(parsed);

  const match = cleaned.match(/\{[\s\S]*\}/) || cleaned.match(/\[[\s\S]*\]/);
  if (match) {
    let candidate = match[0];
    parsed = tryParse(candidate);
    if (parsed) return sanitizeObjectText(parsed);

    // Fix trailing commas and control characters
    let fixed = candidate
      .replace(/,\s*([\}\]])/g, '$1')
      .replace(/[\u0000-\u001F\u007F-\u009F]/g, (c) => {
        if (c === '\n') return '\\n';
        if (c === '\r') return '\\r';
        if (c === '\t') return '\\t';
        return '';
      });

    parsed = tryParse(fixed);
    if (parsed) return sanitizeObjectText(parsed);
  }

  console.warn('safeParseJson could not parse response, returning empty object fallback. Raw output:', rawText?.slice(0, 150));
  return {};
};
app.post('/api/content/extract', async (req: Request, res: Response) => {
  try {
    const { type, content, title, topic, fileData, attachments } = req.body;
    const ai = getGeminiClient();

    const promptText = `أنت أستاذ ومستشار أكاديمي خبير في استخراج وتحليل وبناء الملخصات التعليمية والامتحانات التفاعلية عالية الجودة.
المادة الدراسية: ${topic || 'عام'}
عنوان المحتوى: ${title || 'محتوى دراسي'}
نوع المحتوى المرفق الأساسي: ${type}
الوصف أو الملاحظات النصية: ${content || 'مرفقات متعددة للاستخراج والدراسة'}

المطلوب: قم بتحليل المرفقات بدقة بالغة واستخراج دراسة أكاديمية مسهبة ومفصلة بأسلوب محترف:
1. صغ ملخصاً رئيسياً شاملاً ومسهباً (summary) يحتوي على تقديم متكامل للموضوع وركائزه.
2. تفكيك المحتوى إلى محاور وعناوين فرعية مفصلة (sections) تحتوي كل منها على فقرات واضحة وشرح معمق.
3. استخرج النص التفصيلي المستخرج الكامل (extractedText) بدون اختصار مخل.
4. استخرج أهم القواعد والنقاط الجوهرية (keyTakeaways) كقائمة من نواتج التعلم المركزة.
5. صغ روشتة مراجعة سريعة (cheatSheet) للقوانين والمفاهيم المفتاحية.
6. صغ بطاقات استذكار غنية (suggestedFlashcards).
7. صغ أسئلة كويز متنوعة ومختلفة بالكامل (suggestedQuizQuestions) بـ 4 خيارات دقيقة وشرح تعليمي تعليلي ممتاز بدون تكرار.
8. تنبيه حازم: يُمنع استخدام أي إيموجي نهائياً في المخرجات. استخدم لغة عربية سليمة وواضحة ومنظمة.`;

    let partsPayload: any[] = [];

    // Process multiple attachments if provided
    if (Array.isArray(attachments) && attachments.length > 0) {
      attachments.forEach((att: any, idx: number) => {
        if (att.base64) {
          const sanitizedMime = sanitizeMimeType(att.mimeType, att.name || `file_${idx}`);
          if (sanitizedMime === 'text/plain') {
            try {
              const textFromFile = Buffer.from(att.base64, 'base64').toString('utf-8');
              partsPayload.push({ text: `[المرفق ${idx + 1}: ${att.name || 'ملف نصي'}]:\n${textFromFile}` });
            } catch (e) {
              partsPayload.push({ text: `[المرفق ${idx + 1}: ${att.name}]` });
            }
          } else {
            partsPayload.push({
              inlineData: {
                data: att.base64,
                mimeType: sanitizedMime,
              },
            });
            partsPayload.push({ text: `[وصف المرفق ${idx + 1}: ${att.name}]` });
          }
        } else if (att.text) {
          partsPayload.push({ text: `[المرفق ${idx + 1}: ${att.name || 'نص'}]:\n${att.text}` });
        }
      });
    } else if (fileData && fileData.base64) {
      // Legacy single attachment fallback
      const sanitizedMime = sanitizeMimeType(fileData.mimeType, fileData.fileName);
      if (sanitizedMime === 'text/plain') {
        let textFromFile = '';
        try {
          textFromFile = Buffer.from(fileData.base64, 'base64').toString('utf-8');
        } catch (e) {
          textFromFile = '';
        }
        partsPayload.push({ text: `[المستند النصي المرفق]:\n${textFromFile || content || ''}` });
      } else {
        partsPayload.push({
          inlineData: {
            data: fileData.base64,
            mimeType: sanitizedMime,
          },
        });
      }
    }

    partsPayload.push({ text: promptText });

    const contentsPayload = partsPayload.length === 1 ? partsPayload[0].text : { parts: partsPayload };

    const response = await callGeminiWithRetry(ai, {
      contents: contentsPayload,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            extractedText: {
              type: Type.STRING,
              description: 'النص التفصيلي المستخرج أو المنقح من جميع المرفقات المرفوعة باللغة العربية بدون إيموجيات',
            },
            summary: {
              type: Type.STRING,
              description: 'ملخص شامل ومسهب ومباشر لجميع المفاهيم الواردة بالمرفقات',
            },
            sections: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  heading: { type: Type.STRING },
                  content: { type: Type.STRING },
                },
              },
            },
            keyTakeaways: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'قائمة النقاط الجوهرية المستفادة',
            },
            cheatSheet: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'روشتة مراجعة سريعة وقوانين',
            },
            suggestedFlashcards: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  question: { type: Type.STRING },
                  answer: { type: Type.STRING },
                },
              },
            },
            suggestedQuizQuestions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  question: { type: Type.STRING },
                  options: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                  correctAnswerIndex: { type: Type.INTEGER },
                  explanation: { type: Type.STRING },
                },
                required: ['question', 'options', 'correctAnswerIndex', 'explanation'],
              },
            },
          },
        },
      },
    });

    const parsedData = safeParseJson(response.text);

    // Sanitize suggested quiz questions
    if (parsedData && Array.isArray(parsedData.suggestedQuizQuestions)) {
      parsedData.suggestedQuizQuestions = parsedData.suggestedQuizQuestions.filter((q: any) => {
        if (!q || typeof q.question !== 'string' || !q.question.trim()) return false;
        if (!Array.isArray(q.options) || q.options.length < 2) return false;
        if (q.options.some((opt: any) => typeof opt !== 'string' || !opt.trim() || opt.includes('خيار غير صحيح'))) return false;
        return true;
      });
    }

    res.json({ success: true, data: parsedData });
  } catch (error: any) {
    console.error('Content extraction error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'حدث خطأ أثناء استخراج وتحليل المحتوى بواسطة الذكاء الاصطناعي',
    });
  }
});

// 3. Enhanced AI Quiz Generator
app.post('/api/quiz/generate', async (req: Request, res: Response) => {
  try {
    const { topic, subject, sourceText, questionCount = 5, difficulty = 'متوسط', questionType = 'choice' } = req.body;
    const ai = getGeminiClient();

    const typeInstruction = questionType === 'tf'
      ? 'جميع الأسئلة يجب أن تكون من نوع (صح أم خطأ) حيث تكون الخيارات دائماً بالضبط ["صح", "خطأ"] وخيارين فقط.'
      : questionType === 'mixed'
      ? 'امزج بنسبة متوازنة بين أسئلة متعدد الخيارات (4 خيارات متمايزة) وأسئلة (صح أم خطأ خياران).'
      : 'جميع الأسئلة تكون اختيار من متعدد مع 4 خيارات واضحة، متمايزة وموضوعية بدون غموض.';

    const prompt = `أنت أستاذ ومستشار أكاديمي خبير ومُعدّ امتحانات قياسية معتمد ومشهود له بالدقة المتناهية.
الموضوع الأساسي: ${topic || subject || 'اختبار عام'}
المادة الدراسية: ${subject || 'عام'}
مستوى الصعوبة المطلوبة: ${difficulty}
عدد الأسئلة المطلوب صياغتها بالضبط: ${questionCount} أسئلة.
نوع الأسئلة: ${typeInstruction}

المحتوى النصي المرجعي/المرفق للمادة:
${sourceText || `المفاهيم الشاملة والقواعد والأفكار الخاصة بموضوع ${topic}`}

تعليمات حاسمة وصارمة لصياغة الأسئلة والخيارات والشروح:
1. ارتبط كلياً وبشكل دقيق ومباشر بالموضوع المرفق (${topic}) وبالمحتوى النصي المعتمد أعلاه. صغ أسئلة حقيقية تقيس الفهم والاستيعاب والتحليل من سياق المادة.
2. لكل سؤال اختيار من متعدد:
   - صغ 4 خيارات حقيقية وموجزة وواقعية (لا تتجاوز 15 كلمة لكل خيار) تنتمي لنفس المجال الأكاديمي.
   - خيار واحد فقط هو الإجابة الصحيحة الدقيقة علمياً والمحددة بـ correctAnswerIndex (بين 0 و 3).
   - باق الخيارات الـ 3 يجب أن تكون خيارات مضللة منطقية وموضوعية تعبر عن مفاهيم حقيقية أو أخطاء شائعة في نفس المادة، ولا يجوز إطلاقاً صياغة خيارات وهمية أو عبارات عامة مثل "جميع ما سبق" أو "لا شيء مما سبق" أو "خيار غير صحيح".
3. الشرح والتفسير (explanation): صغ لكل سؤال شرحاً تعليلياً وأكاديمياً شاملاً ومفصلاً يوضح العلة والدليل العلمي الذي يجعل الخيار المحدد هو الصحيح وسبب استبعاد الخيارات الأخرى.
4. التنوع: تأكد من أن جميع الأسئلة الـ ${questionCount} مختلفة تماماً وتغطي جوانب متفرقة من المادة وتصاغ بأسئلة وقوالب متنوعة بدون تكرار.
5. تنبيه حازم: يُمنع منعاً باتاً استخدام أي إيموجي في أي مكان من المخرجات.
6. حظر التكرار والحشو: يُمنع إطلاقاً استخدام نصوص أو كلمات إنجليزية مكررة أو مصطلحات حشو عشوائية مثل Matrix, System, Balance وغيرها.
7. الالتزام بالتنسيق المطلوب كائن JSON يحتوي على (title, subject, questions).`;

    const response = await callGeminiWithRetry(ai, {
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            subject: { type: Type.STRING },
            questions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  question: { type: Type.STRING },
                  options: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                  correctAnswerIndex: { type: Type.INTEGER },
                  explanation: { type: Type.STRING },
                },
                required: ['question', 'options', 'correctAnswerIndex', 'explanation'],
              },
            },
          },
        },
      },
    });

    const quizResult = safeParseJson(response.text);

    // Sanitize generated quiz questions
    if (quizResult && Array.isArray(quizResult.questions)) {
      quizResult.questions = quizResult.questions.filter((q: any) => {
        if (!q || typeof q.question !== 'string' || !q.question.trim()) return false;
        if (!Array.isArray(q.options) || q.options.length < 2) return false;
        if (q.options.some((opt: any) => typeof opt !== 'string' || !opt.trim() || opt.includes('خيار غير صحيح'))) return false;
        return true;
      });
    }

    res.json({ success: true, quiz: quizResult });
  } catch (error: any) {
    console.error('Quiz generation error:', error);
    res.status(500).json({ success: false, error: 'تعذر توليد الكويز بالذكاء الاصطناعي: ' + (error.message || '') });
  }
});

// 4. Enhanced AI Summaries & Flashcards Generator with Multimodal Image Analysis
app.post('/api/summaries/generate', async (req: Request, res: Response) => {
  try {
    const { topic, subject, text, detailLevel = 'deep', customInstructions, attachments, fileData } = req.body;
    const ai = getGeminiClient();

    const promptText = `أنت خبير تلخيص أكاديمي ومستشار دراسي متقدم متخصص في الاستيعاب العميق والتحليل الشامل والمركز للدروس والمواد المرفقة الأساسية، إلى جانب الرؤية البصرية الدقيقة للمرفقات والصور (مثل صفحات الكتب، الملاحظات بخط اليد، الرسومات، وأوراق الامتحانات) وتحويلها إلى ملخصات فائقة الجودة والدقة والوضوح.
الموضوع الأساسي: ${topic}
المادة الدراسية: ${subject || 'عام'}
مستوى التفصيل المطلوب: ${detailLevel === 'deep' ? 'ملخص مفصل ومسهب جداً يغطي كافة الجزئيات مقسم إلى محاور فرعية غنية' : detailLevel === 'bullet' ? 'ملخص مباشر في نقاط خالية من الحشو' : 'ملخص قياسي متوازن ومكتمل'}
توجيهات الطالب الإضافية: ${customInstructions || 'لا يوجد'}

المحتوى والنصوص الأساسية والمرفقة المراد استيعابها وتلخيصها بالكامل:
${text || 'مرفقات ومستندات متعددة للتلخيص والاستخراج الأكاديمي'}

تعليمات حاسمة لصياغة التلخيص والتنسيق الأكاديمي الممتاز:
1. قم بقراءة وفهم المادة الأساسية المرفقة والنصوص وجميع الصور والمرفقات الإضافية بدقة وشمولية متناهية، واستخرج منها كامل الحقائق والأفكار والمفاهيم والعلاقات الأكاديمية الفعلية بين الجزئيات.
2. صياغة عنوان شامل ودقيق للملخص يعبر تماماً عن مضمون الدرس والمحتوى المرفق.
3. صياغة خلاصة تنفيذية شاملة ومفصلة (summaryText) تبرز الفكرة العامة والمضمون بأسلوب ماركداون منسق أنيق (استخدم **الخط العريض** للمفاهيم الأساسية، القوائم النقطية، والصناديق الإيضاحية).
4. تحديد واستخراج **قائمة شاملة ومفصلة من أهم النقاط الجوهرية والمحورية الحقيقية** (keyPoints) المستخلصة مباشرة من النص والمرفق. يجب أن تتكون من نقاط واضحة ومحددة، بحيث تبدأ كل نقطة بـ **عنوان أو مفهوم بارز بالخط العريض** يليه شرح توضيحي وافٍ ومبسط ومباشر للمعلومة الحقيقية المذكورة في النص (مثال: "**المفهوم/الحقيقة العلمية**: الشرح والتوضيح الدقيق والكامل للمعلومة والقاعدة الأكاديمية").
5. تفكيك المحتوى كاملاً إلى محاور وعناوين تفصيلية (sections)، يحتوي كل محور على عنوان واضح (heading) وشرح عميق ومبسط (content) يوضح التعاليل والقوانين والأمثلة بأسلوب سلس وتنسيق ماركداون منظم.
6. إنشاء بطاقات استذكار (flashcards) شاملة وممتازة تغطي كافة الأسئلة والتعريفات المفتاحية من المحتوى الأساسي والمرفقات.
7. إعداد روشتة مراجعة سريعة (cheatSheet) للقوانين والملاحظات الذهبية المنسقة.
8. تنبيه حازم: يُمنع استخدام أي إيموجي نهائياً في المخرجات. التزم بلغة عربية رصينة وأكاديمية وسليمة.`;

    let partsPayload: any[] = [];

    // Process attachments array (images, pdfs, texts)
    if (Array.isArray(attachments) && attachments.length > 0) {
      attachments.forEach((att: any, idx: number) => {
        if (att.base64) {
          const sanitizedMime = sanitizeMimeType(att.mimeType, att.name || `file_${idx}`);
          if (sanitizedMime === 'text/plain') {
            try {
              const textFromFile = Buffer.from(att.base64, 'base64').toString('utf-8');
              partsPayload.push({ text: `[المرفق النصي ${idx + 1}: ${att.name || 'ملف'}] :\n${textFromFile}` });
            } catch (e) {
              partsPayload.push({ text: `[المرفق ${idx + 1}: ${att.name}]` });
            }
          } else {
            partsPayload.push({
              inlineData: {
                data: att.base64,
                mimeType: sanitizedMime,
              },
            });
            partsPayload.push({ text: `[صورة/مرفق ${idx + 1}: ${att.name}]` });
          }
        } else if (att.text) {
          partsPayload.push({ text: `[المرفق ${idx + 1}: ${att.name || 'نص'}]:\n${att.text}` });
        }
      });
    } else if (fileData && fileData.base64) {
      const sanitizedMime = sanitizeMimeType(fileData.mimeType, fileData.fileName);
      partsPayload.push({
        inlineData: {
          data: fileData.base64,
          mimeType: sanitizedMime,
        },
      });
    }

    partsPayload.push({ text: promptText });

    const contentsPayload = partsPayload.length === 1 ? partsPayload[0].text : { parts: partsPayload };

    const response = await callGeminiWithRetry(ai, {
      contents: contentsPayload,
      primaryModel: 'gemini-3.6-flash',
      fallbackModel: 'gemini-3.1-flash-lite',
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            summaryText: { type: Type.STRING },
            sections: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  heading: { type: Type.STRING },
                  content: { type: Type.STRING },
                },
              },
            },
            keyPoints: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            flashcards: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  question: { type: Type.STRING },
                  answer: { type: Type.STRING },
                  category: { type: Type.STRING },
                },
              },
            },
            cheatSheet: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
          },
        },
      },
    });

    const summaryData = safeParseJson(response.text);
    res.json({ success: true, summary: summaryData });
  } catch (error: any) {
    console.error('Summary generation error:', error);
    res.status(500).json({ success: false, error: 'تعذر إنشاء الملخص بالذكاء الاصطناعي: ' + (error.message || '') });
  }
});

// 5. General AI Tutor Assistant Chat
app.post('/api/chat/ask', async (req: Request, res: Response) => {
  try {
    const { question, history, fileData, studyContext } = req.body;
    const ai = getGeminiClient();

    const rawHistory = Array.isArray(history)
      ? history
          .filter((msg: any) => msg && typeof msg.text === 'string' && msg.text.trim().length > 0)
          .slice(-8)
      : [];

    const formattedHistory: any[] = [];
    for (const msg of rawHistory) {
      const role = msg.sender === 'user' ? 'user' : 'model';
      if (formattedHistory.length === 0) {
        if (role === 'user') {
          formattedHistory.push({ role: 'user', parts: [{ text: msg.text.trim() }] });
        }
      } else {
        const lastRole = formattedHistory[formattedHistory.length - 1].role;
        if (role !== lastRole) {
          formattedHistory.push({ role, parts: [{ text: msg.text.trim() }] });
        }
      }
    }
    // Remove trailing user turn if history ends with user (since the new question will be the next user turn)
    if (formattedHistory.length > 0 && formattedHistory[formattedHistory.length - 1].role === 'user') {
      formattedHistory.pop();
    }

    let contextPrompt = '';
    if (studyContext && Array.isArray(studyContext) && studyContext.length > 0) {
      contextPrompt = `\n\n[المحتوى الدراسي والملفات التي رفعها الطالب سابقاً في المكتبة]:\n` +
        studyContext.slice(0, 10).map((item: any, idx: number) => 
          `--- مادة ${idx + 1}: ${item.title} (${item.topic || 'عام'})\nالملخص: ${item.summary || ''}\nالنص/النقاط: ${(item.extractedText || item.keyTakeaways?.join(', ') || '').slice(0, 400)}`
        ).join('\n\n') + '\n\nيمكنك الاستعانة بالمحتوى والمواد المرفوعة أعلاه لإجابة أسئلة الطالب بدقة إذا كانت مرتبطة بها.';
    }

    const systemInstruction = `أنت "المساعد الأكاديمي الذكي" للطلاب في منصة طالب التعليمية.
وظيفتك: إجابة أسئلة الطالب واستفساراته الدراسية بأسلوب مشجع، دقيق، منظم ومفهوم، بالإضافة إلى تحليل المرفقات البصرية (الصور) والصوتية (تسجيلات/ملفات صوت) بدقة شمولية.
${contextPrompt}
قواعد الإجابة:
1. يمنع منعاً باتاً استخدام أي إيموجيات أو رموز تعبيرية في النص.
2. استخدم التنسيق المنظم بالنقاط والعناوين الفرعية عند الإجابة على المفاهيم المعقدة أو تفريغ وشرح الصور والأصوات.
3. قدم أمثلة توضيحية عملية خطوة بخطوة للحلول الرياضية أو العلمية.
4. حافظ على نبرة أكاديمية واضحة ومباشرة وداعية للتفوق.`;

    let replyText = '';

    if (fileData && fileData.base64) {
      const sanitizedMime = sanitizeMimeType(fileData.mimeType, fileData.fileName);

      if (sanitizedMime === 'text/plain') {
        let textFromFile = '';
        try {
          textFromFile = Buffer.from(fileData.base64, 'base64').toString('utf-8');
        } catch (e) {
          textFromFile = '';
        }
        const textPrompt = `[الملف النصي المرفق: ${fileData.fileName || 'مستند'}]\n${textFromFile}\n\n[السؤال/الطلب]: ${question || 'شرح وتحليل محتوى الملف المرفق.'}`;

        const response = await callGeminiWithRetry(ai, {
          contents: textPrompt,
          config: { systemInstruction },
        });
        replyText = response.text || 'عذراً، لم أتمكن من الحصول على إجابة دقيقة من الملف المرفق.';
      } else {
        const filePart = {
          inlineData: {
            data: fileData.base64,
            mimeType: sanitizedMime,
          },
        };
        const textPart = {
          text: question || (fileData.type === 'audio' ? 'استمع إلى التسجيل الصوتي المرفق وقم بتحليله والإجابة عنه بالكامل.' : 'احلل هذا الملف المرفق واستخرج منه المعلومات والتوضيحات الدراسية المطلوبة.')
        };

        const response = await callGeminiWithRetry(ai, {
          contents: { parts: [filePart, textPart] },
          config: { systemInstruction },
        });
        replyText = response.text || 'عذراً، لم أتمكن من الحصول على إجابة دقيقة من الملف المرفق.';
      }
    } else {
      const userMessageText = (question && typeof question === 'string' && question.trim()) ? question.trim() : 'مرحباً';

      if (formattedHistory.length > 0) {
        try {
          const chatModel = (!modelQuotaCooldown['gemini-3.6-flash'] || modelQuotaCooldown['gemini-3.6-flash'] < Date.now())
            ? 'gemini-3.6-flash'
            : 'gemini-3.1-flash-lite';

          const chat = ai.chats.create({
            model: chatModel,
            config: { systemInstruction },
            history: formattedHistory,
          });

          const chatResponse = await chat.sendMessage({ message: userMessageText });
          replyText = chatResponse.text || 'عذراً، لم أتمكن من الحصول على إجابة دقيقة حالياً.';
        } catch (chatErr) {
          console.warn('Chat history failed, falling back to direct generateContent:', chatErr);
          const response = await callGeminiWithRetry(ai, {
            contents: [{ role: 'user', parts: [{ text: userMessageText }] }],
            config: { systemInstruction },
          });
          replyText = response.text || 'عذراً، لم أتمكن من الحصول على إجابة دقيقة حالياً.';
        }
      } else {
        const response = await callGeminiWithRetry(ai, {
          contents: [{ role: 'user', parts: [{ text: userMessageText }] }],
          config: { systemInstruction },
        });
        replyText = response.text || 'عذراً، لم أتمكن من الحصول على إجابة دقيقة حالياً.';
      }
    }

    res.json({ success: true, answer: replyText });
  } catch (error: any) {
    console.error('Chat AI error:', error);
    res.status(500).json({ success: false, error: 'تعذر الاتصال بالمساعد الذكي: ' + (error.message || '') });
  }
});

// 6. Dynamic Encouraging Message Generator based on study completion
app.post('/api/tasks/encourage', async (req: Request, res: Response) => {
  try {
    const { completionRate, totalTasks, completedTasks } = req.body;
    const ai = getGeminiClient();

    const prompt = `اكتب عبارة تشجيعية قصيرة ومحفزة جداً باللغة العربية لطالب أنجز ${completedTasks} من أصل ${totalTasks} مهام دراسية، ونسبة إنجازه هي ${completionRate}%.
تنبيه حازم: يُمنع استخدام أي إيموجيات في العبارة. العبارة يجب أن تكون بين 12 إلى 20 كلمة متناسقة وراقية المظهر.`;

    const response = await callGeminiWithRetry(ai, {
      contents: prompt,
    });

    const phrase = response.text?.trim() || `إنجاز رائع! أتممت ${completionRate}% من خطتك الدراسية بنجاح، واصل السعي نحو التميز.`;
    res.json({ success: true, phrase });
  } catch (error: any) {
    res.json({
      success: true,
      phrase: `إنجاز رائع! أتممت ${req.body.completionRate || 0}% من خطتك الدراسية بنجاح، واصل السعي نحو التميز.`,
    });
  }
});

// Server Initialization
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Educational Platform Server running on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
