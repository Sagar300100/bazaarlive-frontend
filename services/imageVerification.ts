/* ─────────────────────────────────────────────────────────
   imageVerification.ts
   Uses Groq vision (Llama 3.2 vision) to analyse live-captured
   product photos and verify them against the seller's description.

   Flow:
   1. Seller takes photos with camera (no gallery)
   2. Photos are resized and sent to Groq vision model
   3. AI extracts real details: color, condition, material, defects
   4. AI checks if seller description matches what it actually sees
   5. Returns verified data + any discrepancy warnings
   6. Verified data pre-fills the product form + enriches the script
───────────────────────────────────────────────────────── */

const OPENAI_API_KEY   = import.meta.env.VITE_OPENAI_API_KEY || '';
const GROQ_API_KEY     = import.meta.env.VITE_GROQ_API_KEY   || '';
// GPT-4o-mini: native vision, no separate model needed
// Groq: llama-4-scout as fallback
const OPENAI_MODEL     = 'gpt-4o-mini';
const VISION_MODEL     = 'meta-llama/llama-4-scout-17b-16e-instruct';
const VISION_MODEL_HQ  = 'meta-llama/llama-4-maverick-17b-128e-instruct';

export interface VerificationResult {
  verified:           boolean;
  extractedColor:     string;
  extractedMaterial:  string;
  extractedCondition: 'new' | 'like_new' | 'good' | 'fair' | '';
  extractedDefects:   string;
  extractedBrand:     string;
  extractedSize:      string;
  matchScore:         number;     // 0–100: how well photos match description
  warnings:           string[];   // list of discrepancies found
  aiSummary:          string;     // one-sentence honest product description from photos
  confidence:         'high' | 'medium' | 'low';
}

/* ── Resize image before sending to API (reduces payload, faster) ── */
export function resizeImageForAPI(
  dataUrl: string,
  maxDim:  number = 800,
  quality: number = 0.72,
): Promise<string> {
  return new Promise(resolve => {
    const img = new Image();
    img.onload = () => {
      const scale  = Math.min(1, maxDim / Math.max(img.width || 1, img.height || 1));
      const canvas = document.createElement('canvas');
      canvas.width  = Math.round(img.width  * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext('2d')?.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => resolve(dataUrl); // fallback: use original
    img.src = dataUrl;
  });
}

/* ── Strip the data:image/...;base64, prefix for Groq ── */
function toBase64Content(dataUrl: string): string {
  return dataUrl; // Groq accepts full data URLs in image_url
}

/* ── Build the vision verification prompt ── */
function buildVerificationPrompt(
  productName:  string,
  description:  string,
  keyPoints:    string[],
  sellerClaims: { condition?: string; color?: string; material?: string; defects?: string; brand?: string }
): string {
  const claimsText = [
    sellerClaims.color     && `Color claimed: ${sellerClaims.color}`,
    sellerClaims.material  && `Material claimed: ${sellerClaims.material}`,
    sellerClaims.condition && `Condition claimed: ${sellerClaims.condition}`,
    sellerClaims.defects   && `Defects disclosed: ${sellerClaims.defects}`,
    sellerClaims.brand     && `Brand claimed: ${sellerClaims.brand}`,
  ].filter(Boolean).join('\n') || 'No specific claims made by seller.';

  return `You are a product quality verification AI for "Any & All" — a live commerce platform for Indian buyers. Your job is to look at these product photos and provide an honest, accurate assessment.

PRODUCT NAME: ${productName}
SELLER'S DESCRIPTION: ${description || 'not provided'}
SELLER'S KEY POINTS: ${keyPoints.filter(Boolean).join(', ') || 'none'}
SELLER'S CLAIMS:
${claimsText}

Carefully examine ALL the provided images and return a JSON object with EXACTLY this structure:
{
  "extractedColor": "exact color(s) you see — e.g. 'Navy Blue with white trim'",
  "extractedMaterial": "material/fabric you can identify from visuals — e.g. 'appears to be canvas/cotton blend'",
  "extractedCondition": "new|like_new|good|fair — based on what you actually see",
  "extractedDefects": "describe any visible scratches, stains, tears, fading, damage — or 'none visible'",
  "extractedBrand": "any brand name/logo visible in photos — or 'not visible'",
  "extractedSize": "any size labels, measurements visible — or 'not visible'",
  "matchScore": 0-100 (how well the photos match seller's claims — 100=perfect match),
  "warnings": ["list any discrepancies between what you see and what seller claims", "e.g. 'Seller says Like New but scratch visible on front'"],
  "aiSummary": "One honest sentence describing what you actually see — as if you're a trusted buyer's friend",
  "confidence": "high|medium|low — based on photo quality and clarity",
  "verified": true/false — true only if photos clearly show the claimed product in claimed condition
}

IMPORTANT RULES:
- Be HONEST and ACCURATE — Indian buyers trust this platform
- If you cannot clearly see something, say "not clearly visible" — do NOT guess
- Flag ALL discrepancies in warnings — even small ones
- If photos are blurry/unclear, set confidence to "low" and verified to false
- Never approve a product if claimed condition doesn't match visible condition
- Return ONLY valid JSON, no markdown, no explanation`;
}

/* ─────────────────────────────────────────────────────────
   AUTO-FILL: Extract product info from photos when seller
   hasn't filled in any details yet.
   Returns everything needed to pre-populate the product form.
───────────────────────────────────────────────────────── */

export interface ProductExtraction {
  suggestedName:  string;   // what the product appears to be
  description:    string;   // 1-2 sentence honest description
  keyPoints:      string[]; // 3-4 selling points
  color:          string;
  material:       string;
  condition:      'new' | 'like_new' | 'good' | 'fair' | '';
  defects:        string;
  brand:          string;
  size:           string;
  confidence:     'high' | 'medium' | 'low';
}

export async function extractProductInfoFromPhotos(
  photos: string[],
): Promise<ProductExtraction> {

  const empty: ProductExtraction = {
    suggestedName: '', description: '', keyPoints: [],
    color: '', material: '', condition: '', defects: '',
    brand: '', size: '', confidence: 'low',
  };

  if (!OPENAI_API_KEY && !GROQ_API_KEY) return empty;
  if (!photos.length) return empty;

  try {
    const resized = await Promise.all(
      photos.slice(0, 4).map(p => resizeImageForAPI(p, 800, 0.72))
    );

    const angleLabels = ['Front view', 'Back view', 'Label/Tag', 'Detail'];
    const imageContent = resized.flatMap((photo, i) => [
      { type: 'text' as const, text: `[Image ${i + 1}: ${angleLabels[i] || `Photo ${i + 1}`}]` },
      { type: 'image_url' as const, image_url: { url: photo } },
    ]);

    const prompt = `You are a product listing assistant for "Any & All" — an Indian live commerce platform.
Look at these product photos and fill in a complete listing. Be specific and honest.
Return ONLY valid JSON:
{
  "suggestedName": "marketable product name (2-6 words)",
  "description": "1-2 honest sentences about what you see — condition, style, features",
  "keyPoints": ["selling point 1", "selling point 2", "selling point 3"],
  "color": "exact colors visible",
  "material": "material/fabric if visible — or 'not clearly visible'",
  "condition": "new|like_new|good|fair",
  "defects": "visible defects — or 'none visible'",
  "brand": "brand name if clearly visible — or 'not visible'",
  "size": "size tag if visible — or 'not visible'",
  "confidence": "high|medium|low"
}`;

    const apiKey = OPENAI_API_KEY || GROQ_API_KEY;
    const apiUrl = OPENAI_API_KEY
      ? 'https://api.openai.com/v1/chat/completions'
      : 'https://api.groq.com/openai/v1/chat/completions';
    const model  = OPENAI_API_KEY ? OPENAI_MODEL : VISION_MODEL;

    const res = await fetch(apiUrl, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify({
        model, max_tokens: 600, temperature: 0.2,
        messages: [{ role: 'user', content: [...imageContent, { type: 'text', text: prompt }] }],
      }),
    });

    if (!res.ok) {
      // Fallback to HQ model
      const res2 = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${GROQ_API_KEY}` },
        body: JSON.stringify({
          model:       VISION_MODEL_HQ,
          max_tokens:  600,
          temperature: 0.2,
          messages: [{ role: 'user', content: [...imageContent, { type: 'text', text: prompt }] }],
        }),
      });
      if (!res2.ok) return empty;
      const d = await res2.json();
      return parseExtraction(d);
    }

    return parseExtraction(await res.json());
  } catch (e) {
    console.warn('extractProductInfoFromPhotos failed:', e);
    return empty;
  }
}

function parseExtraction(data: any): ProductExtraction {
  const raw  = data.choices?.[0]?.message?.content || '{}';
  const text = raw.replace(/^```json?\s*/i, '').replace(/```\s*$/i, '').trim();
  try {
    const p = JSON.parse(text);
    return {
      suggestedName: p.suggestedName || '',
      description:   p.description   || '',
      keyPoints:     Array.isArray(p.keyPoints) ? p.keyPoints.filter(Boolean).slice(0, 4) : [],
      color:         p.color       || '',
      material:      p.material    || '',
      condition:     (['new','like_new','good','fair'].includes(p.condition) ? p.condition : '') as ProductExtraction['condition'],
      defects:       p.defects !== 'none visible' ? (p.defects || '') : '',
      brand:         p.brand  !== 'not visible'   ? (p.brand   || '') : '',
      size:          p.size   !== 'not visible'   ? (p.size    || '') : '',
      confidence:    (['high','medium','low'].includes(p.confidence) ? p.confidence : 'medium') as 'high'|'medium'|'low',
    };
  } catch {
    return { suggestedName:'', description:'', keyPoints:[], color:'', material:'', condition:'', defects:'', brand:'', size:'', confidence:'low' };
  }
}

/* ── Main verification function ── */
export async function verifyProductImages(
  photos:      string[],   // base64 data URLs from camera
  productName: string,
  description: string,
  keyPoints:   string[],
  sellerClaims: {
    condition?: string;
    color?:     string;
    material?:  string;
    defects?:   string;
    brand?:     string;
  } = {}
): Promise<VerificationResult> {

  const fallback: VerificationResult = {
    verified:           false,
    extractedColor:     '',
    extractedMaterial:  '',
    extractedCondition: '',
    extractedDefects:   '',
    extractedBrand:     '',
    extractedSize:      '',
    matchScore:         0,
    warnings:           ['AI verification unavailable — add VITE_OPENAI_API_KEY to .env.local'],
    aiSummary:          'Could not verify — no AI key configured',
    confidence:         'low',
  };

  if (!OPENAI_API_KEY && !GROQ_API_KEY) return { ...fallback, warnings: ['No AI key set. Add VITE_OPENAI_API_KEY to .env.local'] };
  if (!photos.length) return fallback;

  try {
    const resizedPhotos = await Promise.all(
      photos.slice(0, 4).map(p => resizeImageForAPI(p, 800, 0.72))
    );

    const angleLabels = ['Front view', 'Back view', 'Label/Tag', 'Detail/Defect'];
    const imageContent = resizedPhotos.flatMap((photo, i) => [
      { type: 'text' as const, text: `[Image ${i + 1}: ${angleLabels[i] || `Angle ${i + 1}`}]` },
      { type: 'image_url' as const, image_url: { url: toBase64Content(photo) } },
    ]);

    const messages = [{
      role: 'user' as const,
      content: [
        ...imageContent,
        { type: 'text' as const, text: buildVerificationPrompt(productName, description, keyPoints, sellerClaims) },
      ],
    }];

    // Try OpenAI GPT-4o-mini first (better vision quality)
    const apiKey  = OPENAI_API_KEY || GROQ_API_KEY;
    const apiUrl  = OPENAI_API_KEY
      ? 'https://api.openai.com/v1/chat/completions'
      : 'https://api.groq.com/openai/v1/chat/completions';
    const model   = OPENAI_API_KEY ? OPENAI_MODEL : VISION_MODEL;

    const res = await fetch(apiUrl, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify({ model, max_tokens: 800, temperature: 0.1, messages }),
    });

    if (!res.ok) {
      // Try Groq HQ model as last resort
      if (!OPENAI_API_KEY && (res.status === 404 || res.status === 400)) {
        console.warn('Vision model failed, trying HQ model...');
        const res2 = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${GROQ_API_KEY}` },
          body: JSON.stringify({
            model: VISION_MODEL_HQ, max_tokens: 800, temperature: 0.1,
            messages: [{ role: 'user', content: [...imageContent, { type: 'text', text: buildVerificationPrompt(productName, description, keyPoints, sellerClaims) }] }],
          }),
        });
        if (!res2.ok) throw new Error(`Vision API error: ${res2.status}`);
        return parseVisionResponse(await res2.json());
      }
      throw new Error(`Vision API error: ${res.status} ${await res.text().catch(() => '')}`);
    }

    return parseVisionResponse(await res.json());

  } catch (e) {
    console.warn('Image verification failed:', e);
    return {
      ...fallback,
      warnings: [`Verification error: ${(e as Error).message}`],
    };
  }
}

function parseVisionResponse(data: any): VerificationResult {
  const raw  = data.choices?.[0]?.message?.content || '{}';
  const text = raw.replace(/^```json?\s*/i, '').replace(/```\s*$/i, '').trim();

  try {
    const parsed = JSON.parse(text);
    return {
      verified:           Boolean(parsed.verified),
      extractedColor:     parsed.extractedColor     || '',
      extractedMaterial:  parsed.extractedMaterial  || '',
      extractedCondition: (['new','like_new','good','fair'].includes(parsed.extractedCondition)
                           ? parsed.extractedCondition : '') as VerificationResult['extractedCondition'],
      extractedDefects:   parsed.extractedDefects   || '',
      extractedBrand:     parsed.extractedBrand     || '',
      extractedSize:      parsed.extractedSize      || '',
      matchScore:         Number(parsed.matchScore)  || 0,
      warnings:           Array.isArray(parsed.warnings) ? parsed.warnings : [],
      aiSummary:          parsed.aiSummary           || '',
      confidence:         (['high','medium','low'].includes(parsed.confidence) ? parsed.confidence : 'medium') as 'high'|'medium'|'low',
    };
  } catch {
    return {
      verified: false, extractedColor: '', extractedMaterial: '', extractedCondition: '',
      extractedDefects: '', extractedBrand: '', extractedSize: '',
      matchScore: 0, warnings: ['Could not parse AI response'], aiSummary: raw.slice(0, 200),
      confidence: 'low',
    };
  }
}
