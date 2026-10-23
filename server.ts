import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Body parser limits for base64 photo uploads
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Server-side Gemini client with recommended User-Agent header
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

/**
 * Helper to identify 429 quota exhaustion or rate limit errors
 */
function isQuotaOrRateLimitError(err: any): boolean {
  if (!err) return false;
  const status = err.status || err.code || err.statusCode;
  if (status === 429 || status === 'RESOURCE_EXHAUSTED') return true;
  const raw = typeof err === 'string' ? err : err.message || JSON.stringify(err);
  return (
    raw.includes('429') ||
    raw.includes('RESOURCE_EXHAUSTED') ||
    raw.includes('quota') ||
    raw.includes('rate-limit') ||
    raw.includes('rate limit') ||
    raw.includes('exceeded your current quota')
  );
}

/**
 * Intelligent, personalized local fitness coach response generator
 * Used when Gemini API is unavailable, offline, or quota is exhausted.
 */
function generateLocalCoachResponse(userMessage: string, userContext: any, language: string = 'en'): string {
  const isArabic = language === 'ar';
  const cals = userContext.loggedCalories || 0;
  const target = userContext.dailyCalorieTarget || 2200;
  const remaining = userContext.remainingCalories !== undefined ? userContext.remainingCalories : (target - cals);
  const p = userContext.loggedProtein || 0;
  const c = userContext.loggedCarbs || 0;
  const f = userContext.loggedFat || 0;
  const goal = userContext.primaryGoal || (isArabic ? 'تغذية متوازنة وتحسين اللياقة' : 'Balanced nutrition & fitness');
  const isMinor = Boolean(userContext.isMinor);
  const meals: any[] = userContext.todayMeals || [];
  const pantry: string[] = userContext.pantryItems || [];
  const q = (userMessage || '').toLowerCase();

  let advice = '';

  if (isArabic) {
    const mealNames = meals.length > 0
      ? meals.map((m) => m.name || m.dishNameAr || m.nameEn).join('، ')
      : 'لم يتم تسجيل وجبات بعد اليوم';
    const pantryList = pantry.length > 0 ? pantry.slice(0, 5).join('، ') : 'الأرز، البيض، الشوفان، زيت الزيتون';

    advice = `أهلاً بك! بصفتي مدربك الذكي في فيتورا (Fitora AI)، إليك تحليلي المباشر لسجلاتك اليوم:\n\n` +
      `📊 **حالة السعرات والعناصر الغذائية اليوم:**\n` +
      `• السعرات المسجلة: ${cals} من إجمالي هدفك ${target} سعرة حرارية (${remaining > 0 ? `متبقي ${remaining} سعرة` : `تجاوزت الهدف بـ ${Math.abs(remaining)} سعرة`}).\n` +
      `• البروتين: ${p} جم | الكربوهيدرات: ${c} جم | الدهون: ${f} جم.\n` +
      `• الوجبات المسجلة: ${mealNames}.\n\n`;

    if (isMinor) {
      advice += `⚠️ **تنبيه صحي هام (أقل من 18 عاماً):** هدفنا الأساسي هو النمو البدني الصحي والطاقة والنشاط المستدام، دون أي عجز حاد في السعرات أو حميات مقيدة. استشر دائماً ولي أمرك أو أخصائي تغذية مؤهل.\n\n`;
    }

    if (q.includes('وجب') || q.includes('اكل') || q.includes('غدا') || q.includes('عشا') || q.includes('فطار') || q.includes('بيت') || q.includes('منزل') || q.includes('اقتراح')) {
      advice += `💡 **اقتراح لوجبتك القادمة من المكونات المتوفرة في منزلك (${pantryList}):**\n` +
        `يمكنك تحضير وجبة مصرية/عربية متكاملة: مصدر بروتين (بيض مسلوق أو دجاج أو تونة أو فول بزيت زيتون)، مع كربوهيدرات معقدة (خبز بلدي أو أرز)، وطبق سلطة خضراء مع خيار وطماطم ورشة كمون.\n\n`;
    } else if (q.includes('تمرين') || q.includes('جدول') || q.includes('عضل') || q.includes('جيم') || q.includes('وزن')) {
      advice += `🏋️ **توجيه التمرين والأداء:**\n` +
        `لتحقيق هدفك (${goal})، ركز على الزيادة التدريجية في الأحمال (Progressive Overload) بحركات منضبطة، وخذ قسطاً من الراحة من 60-90 ثانية بين المجموعات، واشرب الماء باستمرار أثناء التمرين.\n\n`;
    } else {
      advice += `🎯 **نصيحة Coach Fitora لتحقيق هدفك (${goal}):**\n` +
        `احرص على توزيع جرعات البروتين بانتظام على مدار اليوم، واشرب 2.5 إلى 3 لترات من الماء، ونم ما بين 7-8 ساعات لدعم الاستشفاء ونشاطك اليومي.\n\n`;
    }

    advice += `ℹ️ *ملاحظة الحصة:* تم استهلاك الحصة الحالية لـ Gemini API. يمكنك ربط مفتاح API مفعل الفوترة من قائمة **Settings > Secrets** للاستفادة الكاملة من البحث المباشر والذكاء التوليدي اللامحدود.`;
  } else {
    const mealNames = meals.length > 0
      ? meals.map((m) => m.name || m.nameEn).join(', ')
      : 'No meals logged yet today';
    const pantryList = pantry.length > 0 ? pantry.slice(0, 5).join(', ') : 'Oats, Eggs, Rice, Olive oil';

    advice = `Hello! As your Fitora AI Coach, here is a real-time summary based on your actual data today:\n\n` +
      `📊 **Calories & Macronutrient Breakdown:**\n` +
      `• Calories Logged: ${cals} / ${target} kcal (${remaining > 0 ? `${remaining} kcal remaining` : `${Math.abs(remaining)} kcal over target`}).\n` +
      `• Protein: ${p}g | Carbs: ${c}g | Fat: ${f}g.\n` +
      `• Meals Logged: ${mealNames}.\n\n`;

    if (isMinor) {
      advice += `⚠️ **Health & Safety Notice:** As you are under 18, our top priority is healthy physical growth, energy, and balanced nutrition—never severe caloric deficits or restrictive diets. Always consult a parent or qualified healthcare professional.\n\n`;
    }

    if (q.includes('meal') || q.includes('eat') || q.includes('dinner') || q.includes('lunch') || q.includes('breakfast') || q.includes('food') || q.includes('home') || q.includes('suggest')) {
      advice += `💡 **Meal Suggestion from your Home Pantry (${pantryList}):**\n` +
        `Prepare a nutrient-dense plate with a quality protein source (eggs, tuna, or chicken), complex carbs (brown rice or baladi bread), and a large bowl of fresh greens with olive oil.\n\n`;
    } else if (q.includes('workout') || q.includes('exercise') || q.includes('train') || q.includes('gym')) {
      advice += `🏋️ **Workout Guidance:**\n` +
        `To advance toward your goal (${goal}), follow progressive overload with controlled eccentric movement, rest 60-90 seconds between working sets, and log your weights in the Live Workout tracker.\n\n`;
    } else {
      advice += `🎯 **Coach Tip for your goal (${goal}):**\n` +
        `Distribute your protein intake evenly across meals, drink at least 2.5-3 liters of water, and get 7-8 hours of sleep for optimal recovery and hormone balance.\n\n`;
    }

    advice += `ℹ️ *API Quota Notice:* Your free-tier Gemini API quota has been reached. Upgrading to a paid tier increases your quota, and you can use the **Settings > Secrets** panel to select a billing-enabled API key. Your local coach insights remain fully functional.`;
  }

  return advice;
}

// Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    hasApiKey: Boolean(process.env.GEMINI_API_KEY),
    timestamp: new Date().toISOString(),
  });
});

/**
 * 1. AI Food Scanner
 * Analyzes meals using gemini-3.8-flash (multimodal vision available on standard tier)
 * with fallback to gemini-3.1-flash-lite and resilient quota-exceeded fallback.
 */
app.post('/api/scan-food', async (req: Request, res: Response) => {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({
        error: 'API_KEY_UNAVAILABLE',
        message: 'Gemini API key is not configured. Manual food logging is available.',
      });
    }

    const { imageBase64, mimeType = 'image/jpeg', userLanguage = 'en' } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: 'Missing imageBase64 in request body' });
    }

    const cleanBase64 = imageBase64.replace(/^data:image\/[a-zA-Z]+;base64,/, '');

    const systemPrompt = `You are a professional nutrition expert specializing in Egyptian, Arabic, and International foods.
Analyze the provided food photo. Identify all dishes and deconstruct the meal into its primary constituent ingredients (e.g. rice, meat, bread, cooking oil, sauces, vegetables).
Estimate serving size in grams, calories, protein (g), carbs (g), fat (g), and fiber (g) for each ingredient and the total meal.
Return results with both English and Arabic dish & ingredient names.
Clearly note that all numbers are approximations based on visual estimates.`;

    const promptText = `Analyze this meal. Break it down into ingredients. Language priority: ${userLanguage}. Provide structured JSON.`;

    const schemaConfig = {
      type: Type.OBJECT,
      properties: {
        dishNameEn: { type: Type.STRING },
        dishNameAr: { type: Type.STRING },
        confidence: { type: Type.STRING },
        totalGrams: { type: Type.NUMBER },
        totalCalories: { type: Type.NUMBER },
        totalProtein: { type: Type.NUMBER },
        totalCarbs: { type: Type.NUMBER },
        totalFat: { type: Type.NUMBER },
        totalFiber: { type: Type.NUMBER },
        estimateNoticeEn: { type: Type.STRING },
        estimateNoticeAr: { type: Type.STRING },
        ingredients: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              nameEn: { type: Type.STRING },
              nameAr: { type: Type.STRING },
              grams: { type: Type.NUMBER },
              calories: { type: Type.NUMBER },
              protein: { type: Type.NUMBER },
              carbs: { type: Type.NUMBER },
              fat: { type: Type.NUMBER },
              fiber: { type: Type.NUMBER },
              notes: { type: Type.STRING },
            },
            required: ['nameEn', 'nameAr', 'grams', 'calories', 'protein', 'carbs', 'fat'],
          },
        },
      },
      required: ['dishNameEn', 'dishNameAr', 'totalCalories', 'totalProtein', 'totalCarbs', 'totalFat', 'ingredients'],
    };

    let responseText: string | undefined;

    // Primary: use gemini-3.8-flash (standard tier multimodal vision)
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: {
          parts: [
            { inlineData: { mimeType, data: cleanBase64 } },
            { text: promptText },
          ],
        },
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: 'application/json',
          responseSchema: schemaConfig,
        },
      });
      responseText = response.text;
    } catch {
      // Fallback 1: gemini-3.1-flash-lite
      try {
        const liteResponse = await ai.models.generateContent({
          model: 'gemini-3.1-flash-lite',
          contents: {
            parts: [
              { inlineData: { mimeType, data: cleanBase64 } },
              { text: promptText },
            ],
          },
          config: {
            systemInstruction: systemPrompt,
            responseMimeType: 'application/json',
            responseSchema: schemaConfig,
          },
        });
        responseText = liteResponse.text;
      } catch {
        // Return structured fallback meal with quota notification
        return res.json({
          quotaExceeded: true,
          dishNameEn: 'Scanned Meal (Estimate)',
          dishNameAr: 'وجبة مصورة (تقديري)',
          confidence: 'Estimate',
          totalGrams: 350,
          totalCalories: 480,
          totalProtein: 28,
          totalCarbs: 52,
          totalFat: 16,
          totalFiber: 6,
          estimateNoticeEn: 'Gemini API quota reached. You can select a billing-enabled key in Settings > Secrets. Default estimate provided; please adjust grams and ingredients below.',
          estimateNoticeAr: 'تم بلوغ حد استخدام Gemini API. يمكنك اختيار مفتاح مفعل الفوترة في Settings > Secrets. تم توفير تقدير مبدئي؛ يرجى تعديل الجرامات والمكونات بالأسفل.',
          ingredients: [
            {
              nameEn: 'Main dish portion (chicken/meat/beans & rice)',
              nameAr: 'الوجبة الرئيسية (بروتين ونشويات)',
              grams: 250,
              calories: 360,
              protein: 24,
              carbs: 45,
              fat: 10,
              fiber: 4,
              notes: 'Adjust grams as needed'
            },
            {
              nameEn: 'Cooking oil / dressing',
              nameAr: 'زيت طهي / صوص مضاف',
              grams: 12,
              calories: 105,
              protein: 0,
              carbs: 0,
              fat: 12,
              fiber: 0,
              notes: 'Visual estimate'
            },
            {
              nameEn: 'Fresh salad greens',
              nameAr: 'خضار وسلطة طازجة',
              grams: 80,
              calories: 25,
              protein: 2,
              carbs: 5,
              fat: 0,
              fiber: 2,
              notes: 'Fiber & vitamins'
            }
          ]
        });
      }
    }

    if (!responseText) {
      return res.status(500).json({ error: 'EMPTY_RESPONSE', message: 'No analysis returned from model' });
    }

    const parsed = JSON.parse(responseText);
    res.json(parsed);
  } catch {
    res.status(500).json({
      error: 'SCAN_FAILED',
      message: 'Failed to analyze food image',
    });
  }
});

/**
 * 2. Multi-Modal Image Understanding (InBody, Exercise, General)
 * Analyzes InBody scans for OCR extraction, or exercise equipment/posture images
 */
app.post('/api/analyze-image', async (req: Request, res: Response) => {
  const reqLang = req.body?.language === 'ar' ? 'ar' : 'en';
  try {
    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({
        error: 'API_KEY_UNAVAILABLE',
        message: 'Gemini API key is not configured. Manual entry is available.',
      });
    }

    const { imageBase64, mimeType = 'image/jpeg', imageType = 'general' } = req.body;
    const language = reqLang;
    if (!imageBase64) {
      return res.status(400).json({ error: 'Missing imageBase64' });
    }

    const cleanBase64 = imageBase64.replace(/^data:image\/[a-zA-Z]+;base64,/, '');

    if (imageType === 'inbody') {
      const prompt = `Analyze this InBody or body composition report scan.
Extract ONLY visible numerical values into JSON:
- weightKg (number or null)
- bodyFatPercentage (number or null)
- fatMassKg (number or null)
- skeletalMuscleMassKg (number or null)
- totalBodyWaterL (number or null)
- visceralFatLevel (number or null)
- bmrKcal (number or null)
- date (string YYYY-MM-DD if printed, or null)
- confidenceNotes (string in ${language === 'ar' ? 'Arabic' : 'English'} explaining what was read and any blurry fields)
CRITICAL: Do NOT invent missing numbers. If a field is not printed or not readable, set it to null.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: {
          parts: [
            { inlineData: { mimeType, data: cleanBase64 } },
            { text: prompt },
          ],
        },
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              weightKg: { type: Type.NUMBER },
              bodyFatPercentage: { type: Type.NUMBER },
              fatMassKg: { type: Type.NUMBER },
              skeletalMuscleMassKg: { type: Type.NUMBER },
              totalBodyWaterL: { type: Type.NUMBER },
              visceralFatLevel: { type: Type.NUMBER },
              bmrKcal: { type: Type.NUMBER },
              date: { type: Type.STRING },
              confidenceNotes: { type: Type.STRING },
            },
          },
        },
      });

      const parsed = JSON.parse(response.text || '{}');
      return res.json({ extracted: parsed });
    } else if (imageType === 'exercise') {
      const prompt = `Analyze this fitness or workout image. Explain in simple, direct ${language === 'ar' ? 'Arabic' : 'English'}:
1. What exercise, movement, or gym equipment is shown.
2. The primary target muscles.
3. 2-3 key technical setup points visible.
4. General safety tips.
Do NOT attempt to diagnose injuries or assess hidden anatomy. Be concise and direct.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: {
          parts: [
            { inlineData: { mimeType, data: cleanBase64 } },
            { text: prompt },
          ],
        },
      });

      return res.json({ analysis: response.text || '' });
    } else {
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: {
          parts: [
            { inlineData: { mimeType, data: cleanBase64 } },
            { text: `Explain the contents of this image concisely in ${language === 'ar' ? 'Arabic' : 'English'}.` },
          ],
        },
      });
      return res.json({ analysis: response.text || '' });
    }
  } catch {
    return res.json({
      extracted: null,
      analysis: null,
      quotaExceeded: true,
      message: reqLang === 'ar' 
        ? 'خدمة التحليل المصور تواجه ضغطاً مؤقتاً. يرجى المتابعة بالإدخال اليدوي.'
        : 'Image analysis service temporarily limited. Please proceed with manual entry.',
    });
  }
});

/**
 * 3. AI Coach with Google Search Grounding & Concise Resilient Multi-tier Fallback
 * Primary: gemini-3.8-flash with googleSearch tool
 * Fallback 1: gemini-3.8-flash without tools
 * Fallback 2: gemini-3.1-flash-lite
 * Fallback 3: Comprehensive local rule-based response with user context & quota guidance
 */
app.post('/api/ai-coach', async (req: Request, res: Response) => {
  try {
    const { message, history = [], userContext = {}, language = 'en' } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Missing message parameter' });
    }

    if (!process.env.GEMINI_API_KEY) {
      const reply = generateLocalCoachResponse(message, userContext, language);
      return res.json({
        reply,
        sources: [],
        quotaExceeded: false,
        isLocalFallback: true,
      });
    }

    const systemInstruction = `You are Fitora AI Coach, a supportive, science-backed fitness and nutrition mentor.
Language: Respond in ${language === 'ar' ? 'natural Egyptian Arabic / Standard Arabic with warm, encouraging, clear phrasing' : 'English with motivating, clear phrasing'}.
Tone & Brevity (CRITICAL):
1. Provide CONCISE, direct, easy-to-understand answers by default.
2. Answer the user's actual question first in 1-2 direct sentences.
3. Follow with 2-4 actionable bullet points when necessary.
4. Avoid long, essay-like explanations unless the user explicitly asks for more detail.
5. Base answers on the user's actual recorded logs (meals, remaining calories, workouts, pantry ingredients).
6. Safety: Never provide medical diagnoses or guarantee specific weight changes. For users under 18, promote healthy growth, balanced meals, and consulting guardians/doctors.
7. Never sacrifice accuracy or safety merely to make an answer shorter.`;

    const userContextString = `User Context Data:
- Primary Goal: ${userContext.primaryGoal || 'Not specified'}
- Daily Calorie Target: ${userContext.dailyCalorieTarget || 'N/A'} kcal
- Today's Logged Calories: ${userContext.loggedCalories || 0} kcal (Remaining: ${userContext.remainingCalories || 'N/A'} kcal)
- Today's Logged Macros: Protein: ${userContext.loggedProtein || 0}g, Carbs: ${userContext.loggedCarbs || 0}g, Fat: ${userContext.loggedFat || 0}g
- Today's Logged Meals: ${JSON.stringify(userContext.todayMeals || [])}
- Scheduled / Completed Workouts: ${JSON.stringify(userContext.workouts || [])}
- Foods Available At Home: ${JSON.stringify(userContext.pantryItems || [])}
- Food Allergies: ${JSON.stringify(userContext.allergies || [])}
- Disliked Foods: ${JSON.stringify(userContext.dislikedFoods || [])}
- User is minor (<18): ${Boolean(userContext.isMinor)}`;

    // Build contents with past history
    const contents: any[] = [];
    for (const h of history.slice(-6)) {
      contents.push({
        role: h.sender === 'user' ? 'user' : 'model',
        parts: [{ text: h.text }],
      });
    }

    contents.push({
      role: 'user',
      parts: [{ text: `${userContextString}\n\nUser Question:\n${message}` }],
    });

    let replyText = '';
    const sources: { title: string; url: string }[] = [];
    let quotaHit = false;

    // Tier 1: gemini-3.8-flash with googleSearch tool
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents,
        config: {
          systemInstruction,
          tools: [{ googleSearch: {} }],
        },
      });

      replyText = response.text || '';
      const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
      if (Array.isArray(chunks)) {
        for (const chunk of chunks) {
          if (chunk?.web?.uri) {
            sources.push({
              title: chunk.web.title || chunk.web.uri,
              url: chunk.web.uri,
            });
          }
        }
      }
    } catch (err1: any) {
      if (isQuotaOrRateLimitError(err1)) {
        quotaHit = true;
      }

      // Tier 2: gemini-3.8-flash without tools
      try {
        const response2 = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents,
          config: { systemInstruction },
        });
        replyText = response2.text || '';
        quotaHit = false;
      } catch (err2: any) {
        if (isQuotaOrRateLimitError(err2)) {
          quotaHit = true;
        }

        // Tier 3: gemini-3.1-flash-lite
        try {
          const response3 = await ai.models.generateContent({
            model: 'gemini-3.1-flash-lite',
            contents,
            config: { systemInstruction },
          });
          replyText = response3.text || '';
          quotaHit = false;
        } catch {
          quotaHit = true;
        }
      }
    }

    // If models are unavailable or quota is exceeded, return local synthesized response
    if (!replyText) {
      replyText = generateLocalCoachResponse(message, userContext, language);
      return res.json({
        reply: replyText,
        sources: [],
        quotaExceeded: quotaHit,
        isLocalFallback: true,
      });
    }

    res.json({
      reply: replyText,
      sources,
      quotaExceeded: quotaHit,
    });
  } catch {
    const { message = '', userContext = {}, language = 'en' } = req.body || {};
    const fallbackReply = generateLocalCoachResponse(message, userContext, language);
    res.json({
      reply: fallbackReply,
      sources: [],
      quotaExceeded: true,
      isLocalFallback: true,
    });
  }
});

/**
 * 3. Text-to-Speech (TTS)
 * Generates natural audio using model gemini-3.8-flash-tts
 * Returns WAV audio as base64 string, or gracefully indicates client fallback to Web Speech API
 */
app.post('/api/tts', async (req: Request, res: Response) => {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return res.json({
        quotaExceeded: false,
        audioBase64: null,
        message: 'TTS requires Gemini API key. Browser speech synthesis fallback is active.',
      });
    }

    const { text, language = 'en', voice = 'Kore' } = req.body;

    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Missing text parameter' });
    }

    const cleanText = text.slice(0, 600);
    const voiceName = ['Puck', 'Charon', 'Zephyr', 'Fenrir'].includes(voice) ? voice : 'Kore';

    let base64Audio: string | undefined;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash-tts',
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: cleanText,
                speechMetadata: {
                  style: language === 'ar'
                    ? 'Warm, clear, and encouraging Arabic fitness coach'
                    : 'Friendly, motivating, and articulate fitness coach',
                },
              },
            ],
          },
        ],
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName },
            },
          },
        },
      });

      base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    } catch (ttsErr: any) {
      return res.json({
        quotaExceeded: isQuotaOrRateLimitError(ttsErr),
        audioBase64: null,
        message: 'TTS quota reached; browser speech synthesis fallback enabled.',
      });
    }

    if (!base64Audio) {
      return res.json({
        quotaExceeded: true,
        audioBase64: null,
        message: 'No audio returned; browser speech synthesis fallback enabled.',
      });
    }

    res.json({
      mimeType: 'audio/wav',
      audioBase64: base64Audio,
    });
  } catch {
    res.json({
      quotaExceeded: true,
      audioBase64: null,
      message: 'TTS unavailable; browser speech synthesis fallback enabled.',
    });
  }
});

/**
 * 4. Search Grounded Nutrition Lookup
 * Uses gemini-3.8-flash with googleSearch to find up-to-date accurate nutritional values
 * With graceful fallback if quota is exceeded
 */
app.post('/api/search-nutrition', async (req: Request, res: Response) => {
  try {
    const { query, language = 'en' } = req.body;
    if (!query) {
      return res.status(400).json({ error: 'Missing query parameter' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.json({
        data: null,
        rawText: '',
        sources: [],
        quotaExceeded: false,
        message: 'API key not configured; please search from local database.',
      });
    }

    let responseText = '';
    const sources: { title: string; url: string }[] = [];

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: `Find the official nutritional value per 100 grams for: "${query}".
Return a JSON object with:
- nameEn (string)
- nameAr (string)
- caloriesPer100g (number)
- proteinPer100g (number)
- carbsPer100g (number)
- fatPer100g (number)
- fiberPer100g (number)
- servingUnitEn (string, e.g. "1 medium portion (150g)")
- servingUnitAr (string)
- gramsPerServing (number)
- verifiedSource (string, e.g. "USDA FoodData" or "Egyptian Nutrition Institute")
Language: ${language}`,
        config: {
          tools: [{ googleSearch: {} }],
        },
      });

      responseText = response.text || '';
      const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
      for (const c of chunks) {
        if (c?.web?.uri) {
          sources.push({
            title: c.web.title || c.web.uri,
            url: c.web.uri,
          });
        }
      }
    } catch (searchErr: any) {
      return res.json({
        data: null,
        rawText: '',
        sources: [],
        quotaExceeded: isQuotaOrRateLimitError(searchErr),
        message: 'Nutrition search quota reached; please select from built-in verified Egyptian & Arabic foods.',
      });
    }

    let parsedData = null;
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedData = JSON.parse(jsonMatch[0]);
      }
    } catch {
      // ignore parse fail
    }

    res.json({
      data: parsedData,
      rawText: responseText,
      sources,
      quotaExceeded: false,
    });
  } catch {
    res.json({
      data: null,
      rawText: '',
      sources: [],
      quotaExceeded: true,
      message: 'Search unavailable; please use local database.',
    });
  }
});

// Setup Vite middleware in dev or static files in production
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Fitora AI server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(() => {
  process.exit(1);
});
