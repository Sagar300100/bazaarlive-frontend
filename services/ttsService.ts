/* ─────────────────────────────────────────────────────────
   ttsService.ts
   Speaks text using (priority order):

   1. Google Cloud TTS  (VITE_GOOGLE_TTS_KEY)
      → 1,000,000 chars FREE/month · Neural2 voices · Indian English + Hindi
      → Voices: en-IN-Neural2-A (female), en-IN-Neural2-B (male), hi-IN-Neural2-A

   2. Microsoft Azure TTS  (VITE_AZURE_TTS_KEY)
      → 500,000 chars FREE/month · NeerjaNeural / SwaraNeural

   3. ElevenLabs  (VITE_ELEVENLABS_API_KEY)
      → 10,000 chars FREE/month

   4. Browser built-in  — always available, zero cost, lower quality
───────────────────────────────────────────────────────── */

const GOOGLE_KEY   = (import.meta as any).env?.VITE_GOOGLE_TTS_KEY       || '';
const AZURE_KEY    = (import.meta as any).env?.VITE_AZURE_TTS_KEY        || '';
const AZURE_REGION = (import.meta as any).env?.VITE_AZURE_TTS_REGION     || 'centralindia';
const EL_KEY       = (import.meta as any).env?.VITE_ELEVENLABS_API_KEY   || '';

/* ─────────────────────────────────────────────────────────
   GOOGLE CLOUD TTS CONFIG
───────────────────────────────────────────────────────── */

// Neural2 voices — best quality Google has for Indian languages
// Docs: https://cloud.google.com/text-to-speech/docs/voices
const GOOGLE_VOICES: Record<string, { name: string; languageCode: string }> = {
  // Indian English
  'en-energetic': { name: 'en-IN-Neural2-A', languageCode: 'en-IN' }, // female, warm
  'en-friendly':  { name: 'en-IN-Neural2-A', languageCode: 'en-IN' },
  'en-calm':      { name: 'en-IN-Neural2-D', languageCode: 'en-IN' }, // female, softer
  'en-luxury':    { name: 'en-IN-Neural2-B', languageCode: 'en-IN' }, // male, deep
  // Hindi
  'hi-energetic': { name: 'hi-IN-Neural2-B', languageCode: 'hi-IN' }, // male, strong
  'hi-friendly':  { name: 'hi-IN-Neural2-A', languageCode: 'hi-IN' }, // female, warm
  'hi-calm':      { name: 'hi-IN-Neural2-A', languageCode: 'hi-IN' },
  'hi-luxury':    { name: 'hi-IN-Neural2-B', languageCode: 'hi-IN' },
  // Hinglish — EN-IN voice handles mixed language best
  'hinglish-energetic': { name: 'en-IN-Neural2-A', languageCode: 'en-IN' },
  'hinglish-friendly':  { name: 'en-IN-Neural2-A', languageCode: 'en-IN' },
  'hinglish-calm':      { name: 'en-IN-Neural2-D', languageCode: 'en-IN' },
  'hinglish-luxury':    { name: 'en-IN-Neural2-B', languageCode: 'en-IN' },
};

// Speaking rate & pitch per tone
// speakingRate: 0.25–4.0 (1.0 = normal)
// pitch: -20.0 to +20.0 semitones (0 = normal)
const GOOGLE_PROSODY: Record<string, { speakingRate: number; pitch: number }> = {
  // Slowed down — a human host talks at a natural conversational pace, not a race
  energetic: { speakingRate: 1.05, pitch:  2.5  }, // energetic but NOT breathless
  friendly:  { speakingRate: 0.95, pitch:  1.0  }, // warm, conversational
  luxury:    { speakingRate: 0.82, pitch: -3.0  }, // slow, commanding, exclusive
  calm:      { speakingRate: 0.88, pitch:  0.0  }, // clear, unhurried
};

/* ─────────────────────────────────────────────────────────
   AZURE TTS CONFIG
───────────────────────────────────────────────────────── */

const AZURE_VOICES = {
  'en-IN-energetic': 'en-IN-NeerjaNeural',
  'en-IN-friendly':  'en-IN-NeerjaNeural',
  'en-IN-calm':      'en-IN-NeerjaNeural',
  'en-IN-luxury':    'en-IN-PrabhatNeural',
  'hi-IN-energetic': 'hi-IN-MadhurNeural',
  'hi-IN-friendly':  'hi-IN-SwaraNeural',
  'hi-IN-calm':      'hi-IN-SwaraNeural',
  'hi-IN-luxury':    'hi-IN-MadhurNeural',
  'hinglish-energetic': 'en-IN-NeerjaNeural',
  'hinglish-friendly':  'en-IN-NeerjaNeural',
  'hinglish-calm':      'en-IN-NeerjaNeural',
  'hinglish-luxury':    'en-IN-PrabhatNeural',
} as const;

const AZURE_PROSODY: Record<string, { rate: string; pitch: string }> = {
  energetic: { rate: '+22%', pitch: '+12%' },
  friendly:  { rate: '+8%',  pitch: '+3%'  },
  luxury:    { rate: '-10%', pitch: '-6%'  },
  calm:      { rate: '-5%',  pitch: '+0%'  },
};

/* ─────────────────────────────────────────────────────────
   ELEVENLABS CONFIG
───────────────────────────────────────────────────────── */

const EL_VOICES: Record<string, string> = {
  energetic: 'pNInz6obpgDQGcFmaJgB', // Adam
  friendly:  'EXAVITQu4vr4xnSDxMaL', // Bella
  luxury:    'VR6AewLTigWG4xSOukaG', // Arnold
  calm:      '21m00Tcm4TlvDq8ikWAM', // Rachel
};

/* ─────────────────────────────────────────────────────────
   BROWSER VOICE CONFIG
───────────────────────────────────────────────────────── */

const VOICE_PRIORITY = [
  'Microsoft Neerja Online (Natural) - English (India)',
  'Microsoft Ravi Online (Natural) - English (India)',
  'Microsoft Aria Online (Natural) - English (United States)',
  'Microsoft Jenny Online (Natural) - English (United States)',
  'Microsoft Guy Online (Natural) - English (United States)',
  'Microsoft Zira Online (Natural) - English (United States)',
  'Google UK English Female',
  'Google UK English Male',
  'Google US English',
  'Google हिन्दी',
  'Neerja',
  'Rishi',
  'Samantha',
];

let _bestVoice: SpeechSynthesisVoice | null | undefined = undefined;

/* ── Active audio element — tracked so we can stop it from outside ── */
let _currentAudio: HTMLAudioElement | null = null;

/* ── Speech intent flag + cancellation token ──
   _speechInProgress: true from the moment speak() is called until audio ends.
   _speechToken: increments every time stopAllSpeech() is called.
   Each speak() captures its token at start. If the token changes before the
   HTTP response arrives, the request is stale and its audio is discarded.
   This is the fix for: stopAllSpeech() → new speak() starts → old HTTP response
   arrives late → both audios play simultaneously. ── */
let _speechInProgress = false;
let _speechToken      = 0;

/* ── Cloned voice ID (ElevenLabs Instant Voice Clone) ── */
let _clonedVoiceId: string | null = (() => {
  try { return localStorage.getItem('anyandall_cloned_voice_id'); } catch { return null; }
})();

export function getBestBrowserVoice(): SpeechSynthesisVoice | null {
  if (_bestVoice !== undefined) return _bestVoice;
  const voices = window.speechSynthesis?.getVoices?.() ?? [];
  if (!voices.length) return null;
  for (const name of VOICE_PRIORITY) {
    const v = voices.find(v => v.name === name);
    if (v) { _bestVoice = v; return v; }
  }
  const natural = voices.find(v =>
    /natural|neural|online|enhanced/i.test(v.name) && /^en/i.test(v.lang)
  );
  if (natural) { _bestVoice = natural; return natural; }
  const inEn = voices.find(v => v.lang === 'en-IN');
  if (inEn)  { _bestVoice = inEn; return inEn; }
  const anyEn = voices.find(v => /^en/i.test(v.lang));
  _bestVoice = anyEn ?? null;
  return _bestVoice;
}

if (typeof window !== 'undefined' && window.speechSynthesis) {
  window.speechSynthesis.onvoiceschanged = () => { _bestVoice = undefined; };
}

/* ─────────────────────────────────────────────────────────
   STATUS HELPERS
───────────────────────────────────────────────────────── */

export function hasGoogleTTS():   boolean { return !!GOOGLE_KEY; }
export function hasAzureTTS():    boolean { return !!AZURE_KEY; }
export function hasElevenLabs():  boolean { return !!EL_KEY; }

/** True while a cloud TTS audio element is actively playing */
export function isCurrentlyPlaying(): boolean {
  return _currentAudio !== null && !_currentAudio.paused && !_currentAudio.ended;
}

/**
 * True from the moment speak() is called until audio fully ends.
 * Covers the HTTP-fetch window where _currentAudio is still null.
 * Use this instead of isCurrentlyPlaying() to prevent race-condition overlaps.
 */
export function isAnySpeechPending(): boolean {
  return _speechInProgress || isCurrentlyPlaying();
}
export function hasClonedVoice(): boolean { return !!(_clonedVoiceId && EL_KEY); }
export function getClonedVoiceId(): string | null { return _clonedVoiceId; }

/** Save a cloned voice ID so all future TTS uses the seller's own voice */
export function setClonedVoice(id: string | null): void {
  _clonedVoiceId = id;
  try {
    if (id) localStorage.setItem('anyandall_cloned_voice_id', id);
    else    localStorage.removeItem('anyandall_cloned_voice_id');
  } catch {}
}

/**
 * Stop ALL currently playing audio — browser TTS + any Audio element.
 *
 * IMPORTANT: We MUST nullify onended/onerror BEFORE pausing.
 * If we don't, setting audio.src='' triggers onerror → googleSpeak returns false
 * → speak() falls through to browserSpeak as fallback → two voices play.
 * Nullifying callbacks first makes the promise simply never resolve (tiny leak,
 * perfectly acceptable for a stop operation).
 */
export function stopAllSpeech(): void {
  _speechToken++;                // invalidate ALL in-flight requests instantly
  _speechInProgress = false;     // clear intent flag immediately
  // Stop Web Speech API
  try { window.speechSynthesis?.cancel(); } catch {}
  // Stop any active Audio element (Google/Azure/ElevenLabs)
  if (_currentAudio) {
    const a = _currentAudio;
    _currentAudio = null;          // clear ref FIRST so onerror can't re-enter
    a.onended = null;              // prevent onDone callback firing after stop
    a.onerror = null;              // prevent fallthrough to browserSpeak
    a.onpause = null;
    try { a.pause(); a.currentTime = 0; } catch {}
    try { a.src = ''; } catch {}  // release resource
  }
}

/** Same as stopAllSpeech but keeps the speech synthesis paused (for pause button) */
export function pauseAllSpeech(): void {
  try { window.speechSynthesis?.pause(); } catch {}
  if (_currentAudio) { try { _currentAudio.pause(); } catch {} }
}

export function resumeAllSpeech(): void {
  try { window.speechSynthesis?.resume(); } catch {}
  if (_currentAudio) { try { _currentAudio.play().catch(() => {}); } catch {} }
}

/* ── Helper: play an Audio blob and track it globally ──
   tokenAtFetchStart: the _speechToken value captured BEFORE the HTTP fetch.
   If _speechToken changed by the time the blob is ready to play, a newer
   speak() or stopAllSpeech() happened → discard this blob silently.       */
function playAudioBlob(
  blob: Blob,
  onDone?: () => void,
  tokenAtFetchStart?: number,
): Promise<boolean> {
  return new Promise(resolve => {
    const url   = URL.createObjectURL(blob);
    const audio = new Audio(url);

    const discard = () => {
      audio.onended = null; audio.onerror = null;
      URL.revokeObjectURL(url);
      if (_currentAudio === audio) _currentAudio = null;
      resolve(false);
    };

    // Race-condition guard: if ANY new speak() or stopAllSpeech() happened
    // while the HTTP response was in-flight, discard this blob silently.
    if (!_speechInProgress || (tokenAtFetchStart !== undefined && _speechToken !== tokenAtFetchStart)) {
      discard(); return;
    }

    _currentAudio = audio;

    audio.onended = () => {
      _speechInProgress = false;
      URL.revokeObjectURL(url);
      if (_currentAudio === audio) _currentAudio = null;
      onDone?.();
      resolve(true);
    };
    audio.onerror = () => {
      _speechInProgress = false;
      URL.revokeObjectURL(url);
      if (_currentAudio === audio) _currentAudio = null;
      resolve(false);
    };

    audio.play().catch(() => {
      _speechInProgress = false;
      URL.revokeObjectURL(url);
      if (_currentAudio === audio) _currentAudio = null;
      resolve(false);
    });
  });
}

/**
 * Clone the seller's voice using ElevenLabs Instant Voice Cloning.
 * Requires: ElevenLabs API key + ~30-60s of audio.
 * Returns the new voice_id, or throws on failure.
 */
export async function cloneVoice(
  audioBlob: Blob,
  sellerName: string,
): Promise<string> {
  if (!EL_KEY) throw new Error('ElevenLabs API key required for voice cloning');

  const form = new FormData();
  form.append('name',        `${sellerName} - Any & All`);
  form.append('description', 'Live commerce seller voice clone');
  form.append('files',       new File([audioBlob], 'voice_sample.webm', { type: audioBlob.type }));
  form.append('labels',      JSON.stringify({ platform: 'anyandall', seller: sellerName }));

  const res = await fetch('https://api.elevenlabs.io/v1/voices/add', {
    method:  'POST',
    headers: { 'xi-api-key': EL_KEY },
    body:    form,
  });

  if (!res.ok) {
    const err = await res.text().catch(() => '');
    throw new Error(`Voice cloning failed: ${res.status} — ${err}`);
  }

  const data = await res.json();
  const voiceId = data.voice_id as string;
  if (!voiceId) throw new Error('No voice_id in ElevenLabs response');

  setClonedVoice(voiceId);
  return voiceId;
}

export function getActiveVoiceLabel(): string {
  if (GOOGLE_KEY) return '🎤 Google Neural (Human AI)';
  if (AZURE_KEY)  return '🎤 Azure Neural (Human AI)';
  if (EL_KEY)     return '🎤 ElevenLabs (Human AI)';
  const v = getBestBrowserVoice();
  if (!v) return '🔊 Browser Default';
  const name = v.name;
  if (/natural|neural|online/i.test(name))
    return `🎤 ${name.replace(/microsoft|google/gi, '').trim()} (Neural)`;
  return `🔊 ${name}`;
}

/* ─────────────────────────────────────────────────────────
   1. GOOGLE CLOUD TTS
───────────────────────────────────────────────────────── */
export async function googleSpeak(
  text:    string,
  tone:    'energetic' | 'friendly' | 'luxury' | 'calm',
  lang:    'english' | 'hindi' | 'hinglish',
  onDone?: () => void,
): Promise<boolean> {
  if (!GOOGLE_KEY) return false;

  const langKey = lang === 'english' ? 'en' : lang === 'hindi' ? 'hi' : 'hinglish';
  const voiceConfig = GOOGLE_VOICES[`${langKey}-${tone}`] ?? GOOGLE_VOICES['en-energetic'];
  const prosody     = GOOGLE_PROSODY[tone] ?? GOOGLE_PROSODY.energetic;
  const fetchToken  = _speechToken; // capture before async fetch

  try {
    const res = await fetch(
      `https://texttospeech.googleapis.com/v1/text:synthesize?key=${GOOGLE_KEY}`,
      {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input:       { text },
          voice:       { languageCode: voiceConfig.languageCode, name: voiceConfig.name },
          audioConfig: {
            audioEncoding: 'MP3',
            speakingRate:  prosody.speakingRate,
            pitch:         prosody.pitch,
            effectsProfileId: ['headphone-class-device'], // richer audio profile
          },
        }),
      }
    );

    if (!res.ok) {
      const err = await res.text().catch(() => '');
      console.warn('Google TTS error:', res.status, err);
      return false;
    }

    const data: { audioContent: string } = await res.json();
    if (!data.audioContent) return false;

    const binary = atob(data.audioContent);
    const bytes  = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    const blob   = new Blob([bytes], { type: 'audio/mp3' });
    return playAudioBlob(blob, onDone, fetchToken); // token check inside playAudioBlob
  } catch (e) {
    console.warn('Google TTS fetch failed:', e);
    return false;
  }
}

/* ─────────────────────────────────────────────────────────
   2. MICROSOFT AZURE TTS
───────────────────────────────────────────────────────── */
export async function azureSpeak(
  text:    string,
  tone:    'energetic' | 'friendly' | 'luxury' | 'calm',
  lang:    'english' | 'hindi' | 'hinglish',
  onDone?: () => void,
): Promise<boolean> {
  if (!AZURE_KEY) return false;

  const langKey   = lang === 'english' ? 'en-IN' : lang === 'hindi' ? 'hi-IN' : 'hinglish';
  const voiceName = AZURE_VOICES[`${langKey}-${tone}` as keyof typeof AZURE_VOICES]
                 ?? AZURE_VOICES['en-IN-friendly'];
  const prosody   = AZURE_PROSODY[tone] ?? AZURE_PROSODY.energetic;
  const speakLang = lang === 'hindi' ? 'hi-IN' : 'en-IN';

  const fetchToken = _speechToken; // capture before async fetch
  const ssml = `<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xmlns:mstts='http://www.w3.org/2001/mstts' xml:lang='${speakLang}'>
  <voice name='${voiceName}'>
    <prosody rate='${prosody.rate}' pitch='${prosody.pitch}'>
      ${text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}
    </prosody>
  </voice>
</speak>`;

  try {
    const res = await fetch(
      `https://${AZURE_REGION}.tts.speech.microsoft.com/cognitiveservices/v1`,
      {
        method:  'POST',
        headers: {
          'Ocp-Apim-Subscription-Key': AZURE_KEY,
          'Content-Type':              'application/ssml+xml',
          'X-Microsoft-OutputFormat':  'audio-16khz-128kbitrate-mono-mp3',
          'User-Agent':                'AnyAndAll-LiveCommerce',
        },
        body: ssml,
      }
    );

    if (!res.ok) {
      console.warn('Azure TTS error:', res.status, await res.text().catch(() => ''));
      return false;
    }

    const blob = await res.blob();
    return playAudioBlob(blob, onDone, fetchToken);
  } catch (e) {
    console.warn('Azure TTS fetch failed:', e);
    return false;
  }
}

/* ─────────────────────────────────────────────────────────
   3. ELEVENLABS TTS
───────────────────────────────────────────────────────── */
export async function elSpeak(
  text:       string,
  tone:       'energetic' | 'friendly' | 'luxury' | 'calm',
  onDone?:    () => void,
  customVoiceId?: string,   // pass cloned voice ID to use seller's own voice
): Promise<boolean> {
  if (!EL_KEY) return false;

  const fetchToken = _speechToken; // capture before async fetch
  const voiceId   = customVoiceId ?? EL_VOICES[tone] ?? EL_VOICES.energetic;
  const stability = tone === 'luxury' ? 0.6 : customVoiceId ? 0.75 : 0.4;
  const similarity = customVoiceId ? 0.9 : 0.78;
  const style     = tone === 'energetic' ? 0.65 : tone === 'luxury' ? 0.2 : 0.45;

  try {
    const res = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method:  'POST',
        headers: {
          'xi-api-key':   EL_KEY,
          'Content-Type': 'application/json',
          'Accept':       'audio/mpeg',
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_multilingual_v2',
          voice_settings: { stability, similarity_boost: similarity, style, use_speaker_boost: true },
        }),
      }
    );

    if (!res.ok) {
      console.warn('ElevenLabs TTS error:', res.status, await res.text().catch(() => ''));
      return false;
    }

    const blob = await res.blob();
    return playAudioBlob(blob, onDone, fetchToken);
  } catch (e) {
    console.warn('ElevenLabs fetch failed:', e);
    return false;
  }
}

/* ─────────────────────────────────────────────────────────
   TEXT CLEANER — applied before every TTS call
   Fixes the most common issues:
   • ALL-CAPS words (WHO→Who) get spelled letter-by-letter by browser TTS
   • Camera cues [📷 Show front] are not meant to be spoken
   • Emojis get announced as their unicode name on some voices
   • Markdown bold/italic markers (**text**) remain as literal asterisks
───────────────────────────────────────────────────────── */
export function cleanTextForTTS(raw: string): string {
  // Abbreviations that SHOULD stay ALL-CAPS (spoken as initials or as a word)
  const KEEP_CAPS = new Set([
    'UPI','GST','COD','EMI','MRP','FAQ','AI','ID',
    'PIN','KYC','OTP','TV','QR','FOMO','TDS','CEO',
  ]);

  return raw
    // 1. Strip stage-direction / camera cues — not spoken
    .replace(/\[📷[^\]]*\]/g, '')
    .replace(/\[[^\]]{0,80}\]/g, '')

    // 2. Strip markdown bold/italic
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g,     '$1')

    // 3. Strip emojis — browser TTS reads their unicode names aloud
    .replace(/[\u{1F000}-\u{1FFFF}]/gu, '')   // extended emoji
    .replace(/[\u{2600}-\u{27BF}]/gu,   '')   // misc symbols & dingbats
    .replace(/[\u{FE00}-\u{FE0F}]/gu,   '')   // variation selectors

    // 4. Convert ALL-CAPS words to Title Case so browser TTS reads them as words
    //    e.g.  WHO→Who  SOLD→Sold  OPEN→Open  LIVE→Live  FOMO stays FOMO
    .replace(/\b([A-Z]{2,})\b/g, word =>
      KEEP_CAPS.has(word) ? word : word[0] + word.slice(1).toLowerCase()
    )

    // 5. Improve punctuation for natural speech pauses
    .replace(/[—–]/g,  ', ')   // em-dash / en-dash → comma
    .replace(/\.\.\./g, '. ')  // ellipsis → full stop + space
    .replace(/!{2,}/g,  '!')   // !! → !
    .replace(/\?{2,}/g, '?')   // ?? → ?

    // 6. Collapse whitespace
    .replace(/[\n\r\t]+/g, ' ')
    .replace(/ {2,}/g, ' ')
    .trim();
}

/* ─────────────────────────────────────────────────────────
   4. BROWSER TTS
───────────────────────────────────────────────────────── */
export function browserSpeak(
  text:    string,
  lang:    'english' | 'hindi' | 'hinglish',
  rate:    number,
  onDone?: () => void,
): void {
  const clean = cleanTextForTTS(text);
  if (!clean) { _speechInProgress = false; onDone?.(); return; }
  _speechInProgress = true;
  const utt   = new SpeechSynthesisUtterance(clean);
  const langs = { english: 'en-IN', hindi: 'hi-IN', hinglish: 'en-IN' };
  utt.lang    = langs[lang] || 'en-IN';
  utt.rate    = rate;
  const best  = getBestBrowserVoice();
  if (best) utt.voice = best;
  utt.onend  = () => { _speechInProgress = false; onDone?.(); };
  utt.onerror = () => { _speechInProgress = false; onDone?.(); };
  window.speechSynthesis.speak(utt);
}

/* ─────────────────────────────────────────────────────────
   COMBINED: Google → Azure → ElevenLabs → Browser
   Use for script segments and Q&A where quality matters.
   NOTE: For low-latency bid announcements use browserSpeak() directly
         (cloud TTS adds ~400-800ms network latency per call).
───────────────────────────────────────────────────────── */
export async function speak(
  text:    string,
  tone:    'energetic' | 'friendly' | 'luxury' | 'calm',
  lang:    'english' | 'hindi' | 'hinglish',
  rate:    number,
  onDone?: () => void,
): Promise<void> {
  // Capture token at start — if stopAllSpeech() is called while we're fetching,
  // _speechToken changes and we know this request is stale/cancelled.
  const myToken = ++_speechToken; // each speak() gets a unique token
  _speechInProgress = true;

  const clean = cleanTextForTTS(text);
  if (!clean) { _speechInProgress = false; onDone?.(); return; }

  // Helper: check if this speak() call has been cancelled
  const isCancelled = () => _speechToken !== myToken;

  // After each async engine attempt, check if we were cancelled while waiting
  // for the HTTP response. If yes, discard this request silently.

  // 0 — Cloned voice
  if (_clonedVoiceId && EL_KEY) {
    if (isCancelled()) { _speechInProgress = false; return; }
    const ok = await elSpeak(clean, tone, onDone, _clonedVoiceId);
    if (ok) return;
  }
  // 1 — Google Cloud TTS
  if (GOOGLE_KEY) {
    if (isCancelled()) { _speechInProgress = false; return; }
    const ok = await googleSpeak(clean, tone, lang, onDone);
    if (ok) return;
  }
  // 2 — Azure Neural TTS
  if (AZURE_KEY) {
    if (isCancelled()) { _speechInProgress = false; return; }
    const ok = await azureSpeak(clean, tone, lang, onDone);
    if (ok) return;
  }
  // 3 — ElevenLabs preset
  if (EL_KEY) {
    if (isCancelled()) { _speechInProgress = false; return; }
    const ok = await elSpeak(clean, tone, onDone);
    if (ok) return;
  }
  // 4 — Browser built-in
  if (!isCancelled()) browserSpeak(clean, lang, rate, onDone);
  else { _speechInProgress = false; }
}
