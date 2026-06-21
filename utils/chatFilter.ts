/* ─────────────────────────────────────────────────────────
   chatFilter.ts
   - Bad word detection (English + Hindi/Hinglish)
   - Message classifier: should the AI answer this or not?
   - Tracks answered question types to avoid repetition
───────────────────────────────────────────────────────── */

/* ── Bad word patterns (English + common Hindi transliterations) ── */
const BAD_PATTERNS: RegExp[] = [
  /* English */
  /\bf+u+c+k+(i+n+g?)?\b/i,
  /\bs+h+i+t+\b/i,
  /\bb+i+t+c+h+\b/i,
  /\ba+s+s+h+o+l+e+\b/i,
  /\bbastard\b/i,
  /\bcunt\b/i,
  /\bdick\b/i,
  /\bwhore\b/i,
  /\bslut\b/i,
  /* Hindi/Hinglish transliterated */
  /\b(bc|bsdk|bsdka|bsdke)\b/i,
  /\b(mc|mchod)\b/i,
  /\b(bhench[o0]d)\b/i,
  /\b(madarc?h[o0]d)\b/i,
  /\b(ch[u0]t(iya|iye|iyo)?)\b/i,
  /\bharami\b/i,
  /\b(gaandu?|g[a@]ndu?)\b/i,
  /\blawda?\b/i,
  /\bchodu?\b/i,
  /\brandi\b/i,
];

export function containsBadWords(text: string): boolean {
  return BAD_PATTERNS.some(p => p.test(text));
}

/* ── Question types — track which ones were already answered ── */
export type QuestionType =
  | 'shipping' | 'returns' | 'authenticity' | 'discount'
  | 'payment'  | 'price'   | 'size'         | 'stock'
  | 'warranty' | 'other';

export function getQuestionType(text: string): QuestionType | null {
  const t = text.toLowerCase();
  if (/ship|deliver|delivery|kitne din|kab aayega/.test(t))      return 'shipping';
  if (/return|refund|exchange|wapas/.test(t))                     return 'returns';
  if (/authentic|original|real|fake|genuine|asli/.test(t))       return 'authenticity';
  if (/discount|offer|kam karo|negotiat|price kam/.test(t))      return 'discount';
  if (/cod|cash on delivery|upi|payment|pay kaise/.test(t))      return 'payment';
  if (/price|kitna|cost|rate|daam|how much/.test(t))             return 'price';
  if (/size|fit|fitting|measurements/.test(t))                    return 'size';
  if (/stock|available|kitne hai|left|remaining/.test(t))        return 'stock';
  if (/warranty|guarantee|kitne saal/.test(t))                   return 'warranty';
  return null;
}

/* ── Priority levels ── */
export type MessagePriority =
  | 'block'        // bad words → ban user
  | 'skip'         // comment/hype, not a question → no answer needed
  | 'answered'     // same question type already answered → skip
  | 'answer';      // genuine question → queue for answer

const HYPE_PATTERNS = /^[🔥❤️💯⚡🙌👍😍🤩✨💰🎉🔴]+$|^(want!*|bhejdo!*|lelo!*|chahiye!*|fire!*|🔥+|❤️+|wow!*|amazing!*|🙌+|sold!*)$/i;

export function classifyMessage(
  text: string,
  answeredTypes: Set<QuestionType>
): MessagePriority {
  /* 1. Bad words → block */
  if (containsBadWords(text)) return 'block';

  /* 2. Pure hype / emojis / short comments → skip */
  if (HYPE_PATTERNS.test(text.trim())) return 'skip';
  if (text.trim().length < 4)           return 'skip';

  /* 3. Does it look like a question? */
  const isQuestion =
    text.includes('?') ||
    /\b(kya|what|how|when|where|why|kitna|kaisa|kab|kahan|kaun|is this|will|can i|do you|does it|are you|milega|hoga|hai kya)\b/i.test(text);

  if (!isQuestion) return 'skip'; // statement/comment, not a question

  /* 4. Already answered this type? → skip */
  const qType = getQuestionType(text);
  if (qType && answeredTypes.has(qType)) return 'answered';

  /* 5. Genuine new question → answer */
  return 'answer';
}
