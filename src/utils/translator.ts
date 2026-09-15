import { SubtitleItem } from '../types';
import { countWords, calculateTargetRate } from './timecode';
import { CS_GLOSSARY } from '../data/csGlossary';

// Conversational and Lecture Discourse markers frequently used by university professors
const CONVERSATIONAL_MAP: Record<string, string> = {
  'all': 'Tous',
  'all right': 'Très bien',
  'all right,': 'Très bien,',
  'all right.': 'Très bien.',
  'right': 'D\'accord',
  'right,': 'd\'accord,',
  'right.': 'd\'accord.',
  'this is': 'voici',
  'this is.': 'voici.',
  'this is,': 'voici,',
  'ok': 'D\'accord',
  'ok.': 'D\'accord.',
  'ok,': 'D\'accord,',
  'okay': 'D\'accord',
  'okay.': 'D\'accord.',
  'okay,': 'D\'accord,',
  'so': 'Donc',
  'so,': 'donc,',
  'so.': 'Donc.',
  'now': 'Maintenant',
  'now,': 'maintenant,',
  'now.': 'Maintenant.',
  'welcome': 'Bienvenue',
  'welcome everyone': 'Bienvenue à tous',
  'welcome back': 'Bon retour à tous',
  'let\'s begin': 'Commençons',
  'let\'s get started': 'Commençons',
  'let\'s start': 'Démarrons',
  'today': 'Aujourd\'hui',
  'today we will': 'Aujourd\'hui nous allons',
  'today we tackle': 'Aujourd\'hui nous abordons',
  'in this lecture': 'Dans ce cours',
  'in this video': 'Dans cette vidéo',
  'for example': 'Par exemple',
  'for instance': 'Par exemple',
  'as you can see': 'Comme vous pouvez le constater',
  'as we saw': 'Comme nous l\'avons vu',
  'take a look at': 'Regardons',
  'notice that': 'Remarquez que',
  'here': 'Ici',
  'here,': 'ici,',
  'there': 'Là',
  'yes': 'Oui',
  'no': 'Non',
  'first': 'Premièrement',
  'second': 'Deuxièmement',
  'finally': 'Enfin',
  'next': 'Ensuite',
  'thank you': 'Merci',
  'any questions?': 'Des questions ?',
  'does that make sense?': 'Est-ce que c\'est clair ?'
};

// Common academic verbs & structures
const WORD_REPLACEMENTS: [RegExp, string][] = [
  [/\bwelcome everyone to\b/gi, 'bienvenue à tous au'],
  [/\bwelcome to\b/gi, 'bienvenue au'],
  [/\btoday we tackle\b/gi, 'aujourd\'hui nous abordons'],
  [/\btoday we will\b/gi, 'aujourd\'hui nous allons'],
  [/\bwhen multiple\b/gi, 'lorsque plusieurs'],
  [/\bwithout proper\b/gi, 'sans approprié'],
  [/\byou will experience\b/gi, 'vous subirez'],
  [/\blet's take a look\b/gi, 'regardons'],
  [/\bas you can see\b/gi, 'comme vous pouvez le constater'],
  [/\bin this case\b/gi, 'dans ce cas'],
  [/\bon the other hand\b/gi, 'd\'autre part'],
  [/\bfor example\b/gi, 'par exemple'],
  [/\bin order to\b/gi, 'afin de'],
  [/\bwe can see that\b/gi, 'nous constatons que'],
  [/\bthis means that\b/gi, 'cela signifie que'],
  [/\bshared mutable state\b/gi, 'l\'état partagé mutable'],
  [/\brace conditions\b/gi, 'conditions de concurrence'],
  [/\brace condition\b/gi, 'condition de concurrence'],
  [/\bdata corruption\b/gi, 'corruption de données'],
  [/\bdeadlocks?\b/gi, 'interblocages'],
  [/\bthreads?\b/gi, 'threads'],
  [/\bcache coherence\b/gi, 'cohérence de cache'],
  [/\bmemory models?\b/gi, 'modèles de mémoire'],
  [/\bvirtual memory\b/gi, 'mémoire virtuelle'],
  [/\boperating system\b/gi, 'système d\'exploitation'],
  [/\bfile system\b/gi, 'système de fichiers'],
  [/\bgarbage collector\b/gi, 'ramasse-miettes'],
  [/\bhash tables?\b/gi, 'tables de hachage'],
  [/\bhash maps?\b/gi, 'tables de hachage'],
  [/\bbinary search\b/gi, 'recherche binaire'],
  [/\blinked lists?\b/gi, 'listes chaînées'],
  [/\bqueues?\b/gi, 'files d\'attente'],
  [/\bstacks?\b/gi, 'piles d\'exécution'],
  [/\btime complexity\b/gi, 'complexité temporelle'],
  [/\bspace complexity\b/gi, 'complexité spatiale'],
];

/**
 * Decode HTML entities returned by some translation APIs (e.g. &#39; -> ')
 */
function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/');
}

/**
 * Clean up translated text (spacing, capitalization, punctuation)
 */
function cleanTranslatedText(text: string, originalText: string): string {
  let cleaned = decodeHtmlEntities(text).trim();

  // If translation came back with multiple slash-separated options (dictionary entry from MyMemory)
  if (cleaned.includes('/') && cleaned.split('/').length > 2) {
    const firstChoice = cleaned.split('/')[0].trim();
    cleaned = firstChoice || cleaned;
  }

  // Preserve trailing punctuation from original text
  if (originalText.endsWith('.') && !cleaned.endsWith('.')) cleaned += '.';
  if (originalText.endsWith(',') && !cleaned.endsWith(',')) cleaned += ',';
  if (originalText.endsWith('?') && !cleaned.endsWith('?')) cleaned += '?';
  if (originalText.endsWith('!') && !cleaned.endsWith('!')) cleaned += '!';

  // Capitalize first letter if original is capitalized
  if (/^[A-Z]/.test(originalText) && /^[a-z]/.test(cleaned)) {
    cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  }

  return cleaned;
}

/**
 * Translates a single text string from English to French using a fast multi-tier approach:
 * 1. Direct conversational & lecture phrase dictionary
 * 2. Public neural translation API (MyMemory)
 * 3. CS terminology & pattern substitution engine
 */
export async function translateSingleSegment(enText: string): Promise<string> {
  const trimmed = enText.trim();
  if (!trimmed) return '';

  const lower = trimmed.toLowerCase();

  // 1. Direct exact dictionary match (instant, 0ms)
  if (CONVERSATIONAL_MAP[lower]) {
    const match = CONVERSATIONAL_MAP[lower];
    return cleanTranslatedText(match, trimmed);
  }

  // Strip trailing punctuation for dictionary check
  const stripped = lower.replace(/[.,?!]+$/, '');
  if (CONVERSATIONAL_MAP[stripped]) {
    const match = CONVERSATIONAL_MAP[stripped];
    return cleanTranslatedText(match, trimmed);
  }

  // 2. Try MyMemory Neural API with a 3.5s timeout
  try {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(trimmed)}&langpair=en|fr`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3500);

    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (response.ok) {
      const data = await response.json();
      const rawTranslated = data?.responseData?.translatedText;
      if (rawTranslated && typeof rawTranslated === 'string' && rawTranslated.toLowerCase() !== lower) {
        return cleanTranslatedText(rawTranslated, trimmed);
      }
    }
  } catch (_netErr) {
    // Fall back smoothly to local dictionary
  }

  // 3. Fallback: Rule-based & CS glossary replacement engine
  let result = trimmed;

  // Apply CS glossary terms
  for (const term of CS_GLOSSARY) {
    const regex = new RegExp(`\\b${term.en}\\b`, 'gi');
    if (regex.test(result)) {
      result = result.replace(regex, term.fr);
    }
  }

  // Apply word patterns
  for (const [regex, replacement] of WORD_REPLACEMENTS) {
    result = result.replace(regex, replacement);
  }

  return cleanTranslatedText(result, trimmed);
}

/**
 * Batch translation pipeline for an array of subtitles.
 * Runs concurrent workers with progress updates.
 */
export async function translateSubtitlesBatch(
  subtitles: SubtitleItem[],
  onProgress?: (current: number, total: number) => void
): Promise<SubtitleItem[]> {
  const total = subtitles.length;
  if (total === 0) return [];

  const results: SubtitleItem[] = [...subtitles];
  let completed = 0;
  const CONCURRENCY = 4;

  // Worker queue
  let currentIndex = 0;

  async function worker() {
    while (currentIndex < total) {
      const idx = currentIndex++;
      const item = results[idx];

      try {
        const frText = await translateSingleSegment(item.enText);
        const words = countWords(frText);
        const rateInfo = calculateTargetRate(words, item.durationMs, 175);

        results[idx] = {
          ...item,
          frText: frText || item.enText,
          wordCountFr: words,
          calculatedRateWpm: rateInfo.targetRateWpm,
          rateMultiplier: rateInfo.rateMultiplier,
          pacingCategory: rateInfo.pacingCategory,
          isEdited: true
        };
      } catch (err) {
        console.warn(`Translation fallback on row ${item.id}:`, err);
      }

      completed++;
      if (onProgress) {
        onProgress(completed, total);
      }
    }
  }

  const workers = Array.from({ length: Math.min(CONCURRENCY, total) }, () => worker());
  await Promise.all(workers);

  return results;
}

/**
 * Detects if a subtitle list still contains untranslated English text in the French column
 */
export function hasUntranslatedSubtitles(subtitles: SubtitleItem[]): boolean {
  if (subtitles.length === 0) return false;
  // If more than 50% of the subtitles have frText identical to enText
  let identicalCount = 0;
  for (const sub of subtitles) {
    if (sub.frText.trim().toLowerCase() === sub.enText.trim().toLowerCase()) {
      identicalCount++;
    }
  }
  return identicalCount / subtitles.length > 0.4;
}
