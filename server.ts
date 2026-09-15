import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));

  // Health check
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      hasGeminiKey: Boolean(process.env.GEMINI_API_KEY)
    });
  });

  // Lazy-initialized Gemini client
  let geminiClient: GoogleGenAI | null = null;
  function getGeminiClient(): GoogleGenAI | null {
    if (!geminiClient && process.env.GEMINI_API_KEY) {
      geminiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    }
    return geminiClient;
  }

  // Translation endpoint for subtitle chunks with Gemini and fallback
  app.post('/api/translate', async (req, res) => {
    try {
      const { items } = req.body;
      if (!Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: 'items array is required' });
      }

      // Try Gemini first if key available with 4s timeout
      const ai = getGeminiClient();
      if (ai) {
        try {
          const prompt = `Translate the following English subtitle segments into natural, fluent French suitable for spoken dubbing and university computer science lectures.
Keep the translations conversational, clear, and well-paced.
Input segments (JSON):
${JSON.stringify(items.map(it => ({ id: it.id, text: it.text })))}

Respond strictly in JSON array: [{"id": 1, "frText": "..."}]`;

          const generatePromise = ai.models.generateContent({
            model: 'gemini-3.8-flash',
            contents: prompt,
            config: {
              responseMimeType: 'application/json'
            }
          });

          // 5-second timeout race
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Gemini API timeout')), 5000)
          );

          const response: any = await Promise.race([generatePromise, timeoutPromise]);
          const responseText = response.text || '';
          const cleaned = responseText.trim().replace(/^```json\s*/i, '').replace(/```\s*$/i, '');
          const parsed = JSON.parse(cleaned);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return res.json({ translations: parsed, engine: 'gemini' });
          }
        } catch (geminiError: any) {
          console.warn('Gemini translation failed, using neural web fallback:', geminiError?.message || geminiError);
        }
      }

      // High-speed fallback via MyMemory neural translation
      const fallbackTranslations: Array<{ id: number; frText: string }> = [];
      for (const item of items) {
        try {
          const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(item.text)}&langpair=en|fr`;
          const resp = await fetch(url, { signal: AbortSignal.timeout(3000) });
          const data: any = await resp.json();
          const translated = data?.responseData?.translatedText || item.text;
          fallbackTranslations.push({ id: item.id, frText: translated });
        } catch (e) {
          fallbackTranslations.push({ id: item.id, frText: item.text });
        }
      }

      return res.json({ translations: fallbackTranslations, engine: 'mymemory' });
    } catch (err: any) {
      console.error('Translation endpoint error:', err);
      return res.status(500).json({ error: err?.message || 'Translation failed' });
    }
  });

  // Vite middleware in development or static serve in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
