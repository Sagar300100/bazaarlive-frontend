/* ─────────────────────────────────────────────────────────
   claudeScript.ts  (powered by Groq + Llama 3.3-70b)

   AI Skills trained into every prompt:
   1. Product explaining    — size, colour, material, condition, price
   2. Live selling pitch    — energetic, persuasive, never fake
   3. Buyer Q&A             — original, return, defect, delivery
   4. Auction handling      — start price, bids, countdown, winner
   5. Truth control         — NEVER invent; if unknown → say unknown
   6. Hinglish / Indian     — natural Hindi+English mix for Indian buyers
   7. Objection handling    — price zyada, Amazon sasta, quality doubt
   8. Visual guidance       — "front dikhao", "zip close-up", "defect zoom"
   9. Compliance / safety   — no fake brands, fake discounts, fake scarcity
  10. Stream flow control   — intro → pitch → Q&A → bid → sold → next
───────────────────────────────────────────────────────── */

export interface Product {
  id: string;
  name: string;
  price: string;
  description: string;
  keyPoints: string[];
  imageUrl?: string;
  bidDuration?: number;   // seconds for auction round, default 30
  // ── Seller-entered product details (truth-controlled by AI) ──
  brand?: string;         // brand name if known — controls authenticity claims
  color?: string;         // colour(s) of the product
  material?: string;      // fabric / material / build
  size?: string;          // size / dimensions
  condition?: 'new' | 'like_new' | 'good' | 'fair'; // item condition
  defects?: string;       // honest defect notes, "" = none
  mrp?: string;           // original MRP — only used when set
  hasInvoice?: boolean;   // whether a GST/purchase invoice exists
  // ── AI-verified fields (from camera photo analysis) ──
  photos?: string[];      // base64 data URLs of captured product photos
  aiVerified?: boolean;   // true when AI has analysed the photos
  aiColor?: string;       // AI-extracted color from photos
  aiMaterial?: string;    // AI-extracted material
  aiCondition?: 'new' | 'like_new' | 'good' | 'fair' | '';
  aiDefects?: string;     // AI-detected defects (overrides seller claim if different)
  aiBrand?: string;       // brand visible in photos
  aiSize?: string;        // size visible in photos
  aiMatchScore?: number;  // 0-100: how well photos match seller description
  aiWarnings?: string[];  // discrepancies found by AI
  aiSummary?: string;     // AI's honest one-line product description
}

export interface StreamConfig {
  language: 'english' | 'hindi' | 'hinglish';
  tone: 'energetic' | 'calm' | 'luxury' | 'friendly';
  sellerName: string;
}

export interface GeneratedScript {
  intro: string;
  products: { productId: string; segment: string }[];
  outro: string;
  qaResponses: { question: string; answer: string }[];
}

const BACKEND_URL    = import.meta.env.VITE_SCRIPT_API_URL  || '';
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY  || '';
const GROQ_API_KEY   = import.meta.env.VITE_GROQ_API_KEY    || '';
const OPENAI_MODEL   = 'gpt-4o-mini';
const GROQ_MODEL     = 'llama-3.3-70b-versatile';

/* ── Unified chat completion — tries OpenAI first, falls back to Groq ── */
async function chatComplete(
  messages:   { role: string; content: any }[],
  maxTokens:  number,
  temperature = 0.7,
  jsonMode    = true,
): Promise<string> {
  // 1 — OpenAI GPT-4o-mini (primary: better quality, better Hinglish, better engagement)
  if (OPENAI_API_KEY) {
    const body: any = {
      model:       OPENAI_MODEL,
      temperature,
      max_tokens:  maxTokens,
      messages,
    };
    if (jsonMode) body.response_format = { type: 'json_object' };

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${OPENAI_API_KEY}` },
      body:    JSON.stringify(body),
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`OpenAI error: ${res.status} — ${err.slice(0, 200)}`);
    }
    return (await res.json()).choices?.[0]?.message?.content?.trim() || '';
  }

  // 2 — Groq Llama (fallback: free tier, good quality)
  if (GROQ_API_KEY) {
    const body: any = {
      model:       GROQ_MODEL,
      temperature,
      max_tokens:  maxTokens,
      messages,
    };
    if (jsonMode) body.response_format = { type: 'json_object' };

    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${GROQ_API_KEY}` },
      body:    JSON.stringify(body),
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Groq error: ${res.status} — ${err.slice(0, 200)}`);
    }
    return (await res.json()).choices?.[0]?.message?.content?.trim() || '';
  }

  throw new Error('No AI API key set. Add VITE_OPENAI_API_KEY or VITE_GROQ_API_KEY to .env.local');
}

/* ═══════════════════════════════════════════════════════════
   INDIAN LIVE COMMERCE DIALOGUE STYLE GUIDE
   Injected into every prompt so Llama sounds like a real
   Indian live seller — not a translated generic AI.
═══════════════════════════════════════════════════════════ */
const INDIAN_STYLE_GUIDE = `
━━━ INDIAN LIVE COMMERCE STYLE GUIDE (MUST FOLLOW) ━━━

── PRICING LANGUAGE ──
✅ Say "do hazaar" not "two thousand" in Hinglish/Hindi
✅ Say "teen sau nabbe" for ₹390 (psychological pricing sounds natural)
✅ Say "paanch hazaar mein le lo" not "take it for five thousand"
✅ Use "MRP tha X, aaj Y mein" only when MRP is known
✅ "Ek hazaar mein solid deal hai yeh" — keep it conversational
✅ Use "lakh" for amounts above ₹1,00,000
⛔ Never say "thousand" in Hinglish — always "hazaar"
⛔ Never say round numbers when psychological price works better (₹999 not ₹1,000)

── FOMO & URGENCY PHRASES (use 1-2 per segment) ──
- "Yaar bahut log dekh rahe hain abhi — jaldi karo"
- "Ek baar gaya toh dobaara nahi milega"
- "Pehle aao pehle pao — simple rule hai yeh"
- "Seedha bol raha hoon — yeh 5 minute mein gone ho jaata hai"
- "Chat mein dekho kitne log hain — sab ek hi item chahte hain"
- "Last round hai aaj ke liye — kal nahi milega yeh price"
- "Abhi bid lagao — sochte raho toh haath se nikal jaayega"

── TRUST BUILDERS (use 1 per segment) ──
- "Meri guarantee pe le lo yaar — main dhoka nahi karta"
- "Personally verify kiya hai maine — haath mein pakda hai"
- "Jo dikhaya wahi milega — koi surprise nahi, koi dhoka nahi"
- "10+ saal ka experience hai mujhe is business mein"
- "Mere hazaaron buyers hain — ek bhi complaint nahi aayi"
- "Main khud use karta hoon iska — isliye bech raha hoon"
- "Ek bhi fake item nahi gaya mere shows se — apni reputation lagata hoon"

── ENERGY & EXCITEMENT WORDS ──
Casual energy: "Zabardast!", "Ekdum mast!", "Dhamaka deal!", "Bhai sunna!", "Yaar dekho!"
Premium feel: "World class quality", "Top notch", "Ekdum premium feel", "Hands down best"
Approval: "Bilkul sahi", "Ekdum pakka", "100%", "Guaranteed"
Reaction: "Kya baat hai!", "Wah wah!", "Mind blown yaar!"

── AUCTION DIALOGUE (exact phrases for bidding rounds) ──
Opening: "Bidding khul gayi! [Product] ke liye! [Price] se shuru — abhi bid lagao!"
New bid arrives: "Aa gayi bid! [Name] ne [amount] lagayi! Kaun counter karega?"
Heating up: "Bhai bhai bhai, laga lo bid — time kam hai!"
10 seconds: "10 second bacha hai! Abhi nahi lagaya toh choot jaayega!"
5 seconds: "5... 4... 3... hammer aa raha hai!"
Winner: "Sold! [Name] ne jeeta! Congratulations bhai! Notifications check karna!"
No bid: "Arey koi nahi aaya? Koi baat nahi — next round mein try karna sabko!"

── NATURAL TRANSITIONS BETWEEN PRODUCTS ──
- "Chalo, yeh toh gaya — ab agle item ki taraf badhte hain. Yeh bhi zabardast hai yaar."
- "Next item aa raha hai — aur bhi kuch khaas hai abhi."
- "Congratulations winner ko! Baki sab — mat daro, aur items hain."
- "Ek minute — yeh item bhi sun lo, bahut kaam ki cheez hai."

── OBJECTION PRE-EMPTS (natural, not defensive) ──
Price high: "Suno, yeh live price hai — isse sasta kahin nahi milega aaj. Amazon pe jaao, delivery alag, wait alag. Yahan abhi, direct."
Quality doubt: "Main honest hoon — condition [X] hai. Jo hai woh dikhaya hai — koi chhupa ke nahi rakha."
Brand doubt (no invoice): "Invoice nahi hai, seedha bol raha hoon — seller-verified quality hai. Meri reputation daav pe hai."
Delivery: "3-5 din mein ghar pe — full tracking link aayega. Tension mat lo."
COD: "UPI aur card abhi, COD jaldi aa raha hai. Safe transaction guaranteed."

── VISUAL DIRECTION PHRASES (natural, spoken style) ──
- "Dekho, yeh dekho — [describe what's shown]"
- "Zoom kar raha hoon label pe"
- "Front side — ekdum clean hai"
- "Yeh defect area hai — honest hoon main, isliye dikhaya"
- "Back side bhi dekho — koi damage nahi"
- "Size tag dekho — clearly mention kiya hai"

── WHAT NEVER TO SAY ──
⛔ "As an AI..." or "I am programmed to..." — you ARE the seller
⛔ "Guaranteed 100% original" without invoice proof
⛔ "Only 1 left!" — you don't know actual stock
⛔ Fake MRP comparison when MRP is not provided
⛔ Switching languages mid-sentence in a way that sounds broken
⛔ Over-using "amazing", "incredible", "fantastic" — sounds fake
⛔ Robotic phrases like "I would like to present" — speak naturally
`;

/* ── Language-specific example phrases (for Q&A few-shot) ── */
const DIALOGUE_EXAMPLES: Record<string, string> = {

  hinglish: `━━━ HINGLISH DIALOGUE EXAMPLES (match this style exactly) ━━━

PRODUCT PITCH STYLE:
"Yaar dekho, yeh [item] ekdum zabardast hai. [Color] color mein hai, [material] ka bana hua — haath mein pakdo toh samajh jaoge quality. [Condition] condition mein hai, personally verify kiya hai maine. Starting bid sirf [price] — abhi bid lagao, ek baar gaya toh gaya!"

AUTHENTIC Q&A RESPONSES (2 sentences max, end with readiness CTA — NOT "bid lagao" since bidding hasn't opened):
Q: "Original hai?" (no invoice) → "[Product] seller-verified quality hai yaar — meri guarantee pe le lo. Ready raho, bidding jald khulegi!"
Q: "Original hai?" (has invoice) → "Bilkul original — full GST invoice hai mere paas! Taiyaar raho jab bid khule seedha laga dena!"
Q: "Defect hai kya?" (no defects) → "[Product] [condition] condition mein hai yaar — personally verify kiya hai. Bidding mein aane pe seedha le lena!"
Q: "Defect hai kya?" (has defects) → "Honest hoon main — [defects]. Isliye itni kamaal price hai [price] mein. Yeh transparency ki wajah se trust karo mujhe — bid karo!"
Q: "Price kam karo" → "Yaar live price hi sabse kam price hai — isse sasta kahin nahi milega aaj. Amazon pe check karo plus delivery charge. Yahan [price] mein direct. Bid lagao!"
Q: "Amazon pe sasta milta" → "Amazon pe fake bhi milta hai yaar — yahan live dekh rahe ho, main dikhata hoon. Koi surprise nahi. [Price] mein le lo abhi!"
Q: "Delivery kab?" → "[Product] 3-5 din mein ghar pe — free shipping, full tracking link milega. Rukna mat, bid karo!"
Q: "Return hoga?" → "7 din return policy hai — kuch problem? Wapas karo. Zero tension. Abhi bid lagao!"
Q: "Invoice milega?" (no invoice) → "Invoice nahi hai seedha bol raha hoon — par quality aur condition personally guaranteed hai meri taraf se. Bid karo!"
Q: "Invoice milega?" (has invoice) → "Haan yaar, full GST invoice milega [product] ke saath — proper documentation. Abhi bid lagao!"
Q: "COD hai?" → "UPI aur card abhi available hai — COD bahut jaldi aa raha hai platform pe. [Price] miss mat karo!"
Q: "Quality kaisi hai?" → "[Product] ki quality ekdum [material/condition] hai yaar — [key feature]. Meri guarantee pe le lo. Bid lagao!"
Q: "Dikhao / show karo" → "[📷 Showing now!] Dekho — [describe what's being shown]. Kaisi lagi? Bid karo abhi!"`,

  hindi: `━━━ HINDI DIALOGUE EXAMPLES (शुद्ध हिंदी) ━━━

उत्पाद प्रस्तुति शैली:
"देखिए, यह [item] बिल्कुल शानदार है। [color] रंग में है, [material] का बना हुआ। [condition] स्थिति में है, मैंने खुद जाँचा है। शुरुआती बोली सिर्फ [price] — अभी बोली लगाइए!"

प्रश्नोत्तर उदाहरण:
Q: "असली है?" → "[Product] विक्रेता-प्रमाणित गुणवत्ता है — मेरी गारंटी पर लीजिए। अभी बोली लगाइए!"
Q: "वापस कर सकते हैं?" → "7 दिन में वापसी होती है — कोई समस्या? बिना सवाल वापस करें। अभी बोली लगाइए!"
Q: "डिफेक्ट है?" → "ईमानदारी से बताता हूँ — [defects/none]. इसीलिए इतनी अच्छी कीमत है। बोली लगाइए!"
Q: "कीमत कम करो" → "लाइव कीमत ही सबसे कम कीमत है — अभी बोली लगाइए!"`,

  english: `━━━ ENGLISH DIALOGUE EXAMPLES ━━━

PITCH STYLE:
"Alright everyone, check this out — [product] in [color], [material] build, [condition] condition. I've personally verified every piece. Starting bid just [price] — hit that bid button, this goes fast!"

Q&A RESPONSES:
Q: "Is it original?" (no invoice) → "[Product] is seller-verified quality — I stake my reputation on every item I sell. Bid now before it's gone!"
Q: "Any defects?" → "[Honest answer about condition]. That's exactly why the price is this low — full transparency. Bid now!"
Q: "Price too high" → "This live price IS the lowest you'll find today — Amazon adds shipping and wait time. Right here, right now at [price]. Bid!"
Q: "What about shipping?" → "[Product] ships pan-India in 3-5 days with full tracking, completely free. Bid now!"`,
};

/* ── Condition label helpers ── */
const CONDITION_LABEL: Record<string, string> = {
  new:       'Brand New (unused, tags on)',
  like_new:  'Like New (used once or twice, perfect condition)',
  good:      'Good (used, normal wear, no major issues)',
  fair:      'Fair (visible wear, minor issues — read defects)',
};

/* ── Build product info block (used in both prompts) ──
   AI-verified fields take priority over seller-entered fields.
   This ensures the script is based on what the camera actually saw. ── */
function buildProductBlock(p: Product, index: number): string {
  // Use AI-verified values when available (camera-verified beats seller claim)
  const color     = p.aiVerified && p.aiColor     ? `${p.aiColor} [AI verified from photos]`     : (p.color     || 'not specified — do not invent');
  const material  = p.aiVerified && p.aiMaterial  ? `${p.aiMaterial} [AI verified from photos]`   : (p.material  || 'not specified — do not invent');
  const size      = p.aiVerified && p.aiSize      ? `${p.aiSize} [AI verified from photos]`       : (p.size      || 'not specified — do not invent');
  const brand     = p.aiVerified && p.aiBrand && p.aiBrand !== 'not visible'
                    ? `${p.aiBrand} [visible in photos]`
                    : (p.brand || 'unbranded / not stated — DO NOT claim any brand name');

  // For condition + defects: if AI found something worse, use AI's finding (buyer protection)
  const condKey   = (p.aiVerified && p.aiCondition) ? p.aiCondition : p.condition;
  const cond      = condKey ? CONDITION_LABEL[condKey] : 'not specified';

  const sellerDefects = p.defects?.trim() || '';
  const aiDefects     = p.aiVerified && p.aiDefects && p.aiDefects !== 'none visible' ? p.aiDefects : '';
  const defectFinal   = aiDefects || sellerDefects;
  const defectInfo    = defectFinal
    ? `⚠️ DEFECTS — must mention honestly: ${defectFinal}${aiDefects && sellerDefects && aiDefects !== sellerDefects ? ` (AI also found: ${aiDefects})` : ''}`
    : 'Defects: none detected';

  const invoiceInfo   = p.hasInvoice
    ? '✅ Invoice: YES — GST invoice available'
    : '❌ Invoice: NO — no invoice/bill';
  const mrpInfo       = p.mrp
    ? `MRP / Original Retail Price: ${p.mrp}`
    : 'MRP: unknown — DO NOT invent a fake MRP';

  /* ── Price intelligence — CRITICAL for resale markets ── */
  const priceNum = parseFloat(String(p.price).replace(/[₹,\s]/gi, ''));
  const mrpNum   = p.mrp ? parseFloat(p.mrp.replace(/[₹,\s]/gi, '')) : 0;
  let priceIntel = '';
  if (mrpNum > 0 && !isNaN(priceNum) && !isNaN(mrpNum) && priceNum > 0) {
    if (priceNum > mrpNum * 1.05) {
      const pct = Math.round(((priceNum - mrpNum) / mrpNum) * 100);
      priceIntel = `
🚨 PRICE INTELLIGENCE — RESALE / PREMIUM ITEM (${pct}% ABOVE RETAIL):
⛔ DO NOT say "cheap", "sasta", "discount", "saving", or compare to retail as a bargain. The price IS above retail.
✅ This ABOVE-RETAIL price proves high market demand — use it as a SELLING POINT.
✅ SAY THINGS LIKE: "Yeh exclusive piece hai", "Retail se zyada demand hai isliye price premium hai",
   "Market mein barely milta hai", "Collector's item — jo log isse jaante hain woh price se mat poochho",
   "Limited availability — isliye yeh price market se competitive hai."
✅ Hinglish example: "Yaar yeh Travis Scott collab retail se gone tha — secondary market mein aur mahnga milega.
   Yahan ₹${p.price} mein mil raha hai — ekdum solid deal for the sneakerhead community!"`;
    } else if (priceNum < mrpNum * 0.95) {
      const saving = (mrpNum - priceNum).toLocaleString('en-IN');
      priceIntel = `
💰 PRICE INTELLIGENCE — BELOW RETAIL (saving ₹${saving}):
✅ Genuine saving vs retail — mention it honestly as a selling point.
✅ Example: "MRP tha ${p.mrp} — aaj live mein ₹${saving} bachao!"`;
    } else {
      priceIntel = `
💰 PRICE INTELLIGENCE — AT RETAIL PRICE:
✅ Selling at approximately retail — emphasise value and live convenience, not a price cut.`;
    }
  }

  // AI verification summary for context
  const verificationNote = p.aiVerified
    ? `\n📸 AI VERIFIED from ${p.photos?.length || 0} live camera photos (match score: ${p.aiMatchScore ?? '?'}/100)${p.aiSummary ? `\nAI Photo Summary: ${p.aiSummary}` : ''}${p.aiWarnings?.length ? `\n⚠️ AI Warnings: ${p.aiWarnings.join('; ')}` : ''}`
    : '\n⚠️ NOT AI VERIFIED — seller claims only, no photos taken';

  return `━━━ PRODUCT ${index + 1}: ${p.name} ━━━
Bid Start Price: ${p.price}
${mrpInfo}${priceIntel}
Brand: ${brand}
Color: ${color}
Material/Fabric: ${material}
Size/Dimensions: ${size}
Condition: ${cond}
${defectInfo}
${invoiceInfo}
Description: ${p.description || 'none provided'}
Key Selling Points: ${p.keyPoints.filter(Boolean).join(' | ') || 'none listed'}${verificationNote}`;
}

/* ── Build the main script generation prompt ── */
function buildPrompt(products: Product[], config: StreamConfig): string {
  const productBlocks = products.map(buildProductBlock).join('\n\n');

  const toneGuide: Record<string, string> = {
    energetic: 'High energy — urgent, exciting. Short punchy sentences. "Who wants this?!", "Grab it now!", countdowns, fast pace.',
    friendly:  'Warm and genuine — like a trusted friend recommending a product. Casual, conversational, honest.',
    luxury:    'Sophisticated, exclusive, premium. Speak to connoisseurs. Slow, confident, refined.',
    calm:      'Relaxed, informative. Let product facts speak. No pressure. Clear and trustworthy.',
  };

  const langGuide: Record<string, string> = {
    english:  'Write entirely in English.',
    hindi:    'Write entirely in Hindi (Devanagari script).',
    hinglish: 'Mix Hindi and English naturally like young Indians speak. Examples: "Yaar yeh toh kamaal hai!", "Ekdum solid build quality", "Bilkul original hai", "Abhi bid lagao!", "Price dekho — itna sasta kahin nahi milega!"',
  };

  // Compact style reminder for script generation (full guide is in Q&A prompts)
  const styleReminder = config.language === 'hinglish'
    ? `KEY STYLE: Say "hazaar" not "thousand". Use: "Zabardast!", "Yaar dekho", "Meri guarantee pe le lo", "Abhi bid lagao!". Sound like a real Indian seller, not a robot.`
    : config.language === 'hindi'
    ? `KEY STYLE: शुद्ध हिंदी में बोलें। "अभी बोली लगाइए", "मेरी गारंटी पर लीजिए", "एकदम शानदार है" जैसे phrases use करें।`
    : `KEY STYLE: Warm, natural English. Sound like a knowledgeable friend, not a salesperson.`;

  return `You are an expert live shopping host script writer for "Any & All" — India's top live commerce app.

Seller: ${config.sellerName}
Tone: ${toneGuide[config.tone]}
Language: ${langGuide[config.language]}
${styleReminder}

━━━ PRODUCTS TO SELL — ${products.length} item${products.length === 1 ? '' : 's'} TOTAL (say EXACTLY this number in the intro, never more, never less) ━━━
${productBlocks}

━━━ RULES ━━━

🔴 PRICE RULE (MOST IMPORTANT — NEVER BREAK):
The "Bid Start Price" in each product block is the SELLER'S EXACT PRICE. It is 100% correct.
DO NOT change it, adjust it, or replace it with any market value you know.
DO NOT use your training knowledge about what a product "should" cost.
If a Travis Scott sneaker is listed at ₹15,999 — the price IS ₹15,999. Say "₹15,999". Nothing else.
If a Louis Vuitton bag is listed at ₹500 — the price IS ₹500. The seller decides, not you.
ALWAYS read the price DIRECTLY from the product data. Never invent or "correct" it.

TRUTH: Never invent specs not in the product data. If unknown, skip or say "details listing mein hain".
HONESTY: Mention defects if present — with positive spin ("isliye itni kamaal price hai").
AUTHENTICITY: Only say "original/authentic" if brand + invoice both provided.
ENGAGEMENT: Intro must acknowledge viewers already present ("Dekho kitne log aa gaye!") — DO NOT ask "kahan se ho?" (warm-up already did that). Each product segment needs 1 hook ("Chat mein WANT likho!").
BID CTA RULE: NEVER say "abhi bid lagao" or "bid karo" during pitch or Q&A — bidding is not open yet. Say "Ready raho bidding ke liye!" or "Jab bidding khule, seedha laga dena!" instead. Only actual bid announcements (when bid opens) should say "bid lagao".
VISUAL: Include 1 camera cue per segment e.g. [📷 Show front of item] on its own line.
FLOW: INTRO → product pitches → OUTRO. Each pitch ends with a bid call.
VOICE SAFE: No ALL-CAPS (spelled out), no **bold**, no !! (use single !), no [📷 cues] inside spoken text.
PACE: ~150 words per product segment. Short sentences. Natural pauses. Not a rushed list.
COMPLIANCE: No fake GST promise without invoice. No "guaranteed original" without invoice.

━━━ OUTPUT FORMAT ━━━
Return ONLY valid JSON with this exact structure:
{
  "intro": "30-45 second opening — greet viewers, build excitement, mention seller name. You are selling EXACTLY ${products.length} item${products.length === 1 ? '' : 's'} today — say this exact number. Do NOT say 2 or 3 if there is only 1. Count the product blocks above.",
  "products": [
    {
      "productId": "0",
      "segment": "60-90 second segment — visual cues [📷 ...], honest product description, sales pitch, pre-empt objections, clear bid call with start price"
    }
  ],
  "outro": "COPY THIS STYLE EXACTLY — write in this same warm, personal tone: 'Yaar kya show tha aaj! Sach mein aap sab ki energy ke bina yeh show kuch bhi nahi hota. Jo log jeete — bahut bahut badhai, notifications check karo, aapka order process ho raha hai. Aur jo log jeete nahi — mat udaas hona yaar, agla show aur bhi amazing hoga. Abhi follow kar lo channel ko taaki next show miss na ho — main promise karta hoon aur bhi dhamaka items laaunga. Aap sab ka bahut bahut shukriya. Lots of love — phir milenge jaldi!' — Adapt for the seller name and tone, keep the same energy and warmth. 50-70 words. Natural sentences, not bullet points.",
  "qaResponses": [
    { "question": "Original hai kya?", "answer": "..." },
    { "question": "Return milega?", "answer": "..." },
    { "question": "Delivery kab hogi?", "answer": "..." },
    { "question": "Defect toh nahi hai?", "answer": "..." },
    { "question": "Invoice milega?", "answer": "..." },
    { "question": "Amazon se sasta kaise?", "answer": "..." },
    { "question": "Price thoda kam karo?", "answer": "..." },
    { "question": "Quality kaisi hai?", "answer": "..." }
  ]
}

Return ONLY valid JSON. No markdown, no explanation.`;
}

/* ── Parse Groq's JSON response safely ── */
function parseGroqResponse(text: string): GeneratedScript {
  const cleaned = text.replace(/^```json?\s*/i, '').replace(/```\s*$/i, '').trim();
  const parsed  = JSON.parse(cleaned);
  return {
    intro: parsed.intro || '',
    products: (parsed.products || []).map((p: { productId: string; segment: string }, i: number) => ({
      productId: p.productId ?? String(i),
      segment:   p.segment   || '',
    })),
    outro:       parsed.outro        || '',
    qaResponses: parsed.qaResponses  || [],
  };
}

/* ─────────────────────────────────────────────────────────
   LIVE Q&A — answers viewer questions in real-time
   All 10 skills applied: truth control, objection handling,
   Hinglish, visual guidance, compliance, auction context
───────────────────────────────────────────────────────── */
export async function answerLiveQuestion(
  question: string,
  products: Product[],
  config: StreamConfig,
  currentProductIndex: number = 0,
  chatHistory: { role: 'user' | 'assistant'; content: string }[] = [],
  buyerName: string = ''
): Promise<string> {

  const validProducts = products.filter(p => p.name && p.price);
  const prod          = validProducts[currentProductIndex] ?? validProducts[0];
  if (!prod) return "Great question! I'll answer that after showing you this amazing deal!";

  /* ── Build full product context ── */
  const name      = prod.name;
  const price     = prod.price;
  const brand     = prod.brand || '';
  const color     = prod.color || '';
  const material  = prod.material || '';
  const size      = prod.size || '';
  const condition = prod.condition ? CONDITION_LABEL[prod.condition] : '';
  const defects   = prod.defects?.trim() || '';
  const hasInv    = prod.hasInvoice ?? false;
  const mrp       = prod.mrp || '';
  const desc      = prod.description || '';
  const pts       = prod.keyPoints.filter(Boolean).join(', ');

  /* ── Tone map ── */
  const toneMap: Record<string, string> = {
    energetic: 'HIGH ENERGY and urgent — create FOMO, make them act NOW!',
    friendly:  'Warm and genuine — like a trusted friend giving honest advice.',
    luxury:    'Sophisticated and confident — exclusive, premium, refined.',
    calm:      'Clear and reassuring — factual, no pressure, trustworthy.',
  };

  /* ── Price intelligence (must come before productExamples) ── */
  const priceNumQA = parseFloat(String(price).replace(/[₹,\s]/gi, ''));
  const mrpNumQA   = mrp ? parseFloat(mrp.replace(/[₹,\s]/gi, '')) : 0;
  const isResale   = mrpNumQA > 0 && priceNumQA > mrpNumQA * 1.05;
  const isBelowMRP = mrpNumQA > 0 && priceNumQA < mrpNumQA * 0.95;
  const priceRule  = isResale
    ? `🚨 PRICE = ABOVE RETAIL (resale/premium item). NEVER say "cheap" or "sasta". If asked "price zyada hai", say: "Yaar yeh limited piece hai — secondary market mein aur mahnga milega. Yahan best price hai."`
    : isBelowMRP
    ? `💰 PRICE = BELOW RETAIL. If asked about price, mention saving vs retail: "MRP se ₹${Math.round(mrpNumQA - priceNumQA).toLocaleString('en-IN')} kam mein de rahe hain — live best price."`
    : `💰 PRICE = AT RETAIL. Emphasise value and live convenience, not a price cut.`;

  /* ── Product-specific Q&A examples (inject actual product data into examples) ── */
  const productExamples = config.language === 'hinglish' ? `
━━━ THIS PRODUCT'S SPECIFIC ANSWERS ━━━
Q: "Original hai?" → ${hasInv ? `"${name} ka full GST invoice hai mere paas yaar — 100% verified. Abhi bid lagao!"` : `"${name} seller-verified quality hai — meri reputation pe le lo. Maine khud check kiya. Bid karo!"`}
Q: "Defect hai?" → ${defects ? `"Honest hoon main — ${defects}. Isliye ${name} sirf ${price} mein mil raha hai — full transparency. Bid lagao!"` : `"${name} bilkul ${condition || 'sahi condition'} mein hai — personally verify kiya hai. Koi issue nahi. Bid lagao!"`}
Q: "Invoice?" → ${hasInv ? `"Haan yaar, GST invoice milega ${name} ke saath — proper documentation. Bid karo!"` : `"Invoice nahi hai seedha bol raha hoon — par quality guaranteed hai meri taraf se. Bid lagao!"`}
Q: "Price zyada hai" → ${isResale ? `"Yaar yeh limited piece hai — secondary market mein aur mahnga milega. Yahan ${price} mein best deal hai. Bid lagao!"` : `"${price} live price hai — isse sasta kahin nahi milega aaj. Amazon pe delivery alag. Yahan direct. Bid karo!"`}
Q: "Quality?" → "${name} ${condition ? CONDITION_LABEL[condition] : 'sahi condition'} mein hai${material ? `, ${material} material` : ''}${defects ? ` — honest note: ${defects}` : ''}. Meri guarantee pe le lo. Bid lagao!"
Q: "Delivery?" → "${name} 3-5 din mein ghar pe — free shipping, full tracking link milega. Bid karo!"
` : config.language === 'hindi' ? `
━━━ IS PRODUCT KE SPECIFIC UTTAR ━━━
Q: "असली है?" → ${hasInv ? `"${name} के साथ पूरा GST invoice है — 100% verified! बोली लगाइए!"` : `"${name} seller-verified quality है — मैंने खुद जाँचा है। बोली लगाइए!"`}
Q: "डिफेक्ट है?" → ${defects ? `"ईमानदारी से — ${defects}। इसीलिए ${price} में दे रहा हूँ। बोली लगाइए!"` : `"${name} ${condition ? CONDITION_LABEL[condition] : 'अच्छी'} स्थिति में है। बोली लगाइए!"`}
Q: "वापसी?" → "7 दिन में वापसी — कोई जोखिम नहीं। बोली लगाइए!"
` : `
━━━ THIS PRODUCT'S SPECIFIC ANSWERS ━━━
Q: "Original?" → ${hasInv ? `"${name} comes with full GST invoice — 100% verified. Bid now!"` : `"${name} is seller-verified quality — I stake my reputation on every piece. Bid now!"`}
Q: "Any defects?" → ${defects ? `"Honest answer — ${defects}. That's why ${name} is priced at ${price}. Full transparency. Bid now!"` : `"${name} is in ${condition || 'great'} condition — personally checked. No issues. Bid now!"`}
Q: "Shipping?" → "${name} ships pan-India in 3-5 days, free tracking. Bid now!"
Q: "Price too high?" → "${price} is the live best price for ${name} — you won't find it cheaper today. Bid now!"
`;

  /* Price rule string used in system prompt */
  const _priceRule = isResale
    ? `🚨 PRICE = ABOVE RETAIL (resale/premium item). NEVER say "cheap" or "sasta". If asked "price zyada hai", say: "Yaar yeh limited piece hai — secondary market mein aur mahnga milega. Yahan best price hai."`
    : isBelowMRP
    ? `💰 PRICE = BELOW RETAIL. If asked about price, mention saving vs retail: "MRP se ₹${Math.round(mrpNumQA - priceNumQA).toLocaleString('en-IN')} kam mein de rahe hain — live best price."`
    : `💰 PRICE = AT RETAIL. Emphasise value and convenience.`;

  const systemPrompt = `You are ${config.sellerName || 'the host'}, a professional live shopping host on "Any & All" — India's biggest live commerce platform. You are LIVE on camera with hundreds of viewers watching RIGHT NOW.

${INDIAN_STYLE_GUIDE}

${DIALOGUE_EXAMPLES[config.language] || DIALOGUE_EXAMPLES.hinglish}

${productExamples}

━━━ PRODUCT ON SCREEN RIGHT NOW ━━━
Name: ${name}
Price: ${price}
${brand     ? `Brand: ${brand}` : 'Brand: none / not stated'}
${color     ? `Color: ${color}` : ''}
${material  ? `Material: ${material}` : ''}
${size      ? `Size: ${size}` : ''}
${condition ? `Condition: ${condition}` : ''}
${defects   ? `⚠️ Known defects: ${defects}` : 'Defects: none'}
${hasInv    ? '✅ Invoice: Available' : '❌ Invoice: Not available'}
${mrp       ? `MRP / Original Retail: ${mrp}` : ''}
${desc      ? `About: ${desc}` : ''}
${pts       ? `Why it's great: ${pts}` : ''}
${_priceRule}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

━━━ ABSOLUTE RULES — NEVER BREAK ━━━
1. MAX 2 SHORT sentences. You are LIVE — every second counts.
2. ADDRESS THE BUYER BY NAME at the START of your answer: "${buyerName ? buyerName + ', ' : ''}[your answer here]"
   ${buyerName ? `The buyer's name is "${buyerName}" — use it naturally, e.g. "${buyerName} yaar, ..." or "Great question ${buyerName}!"` : 'No buyer name available — skip the name address.'}
3. ALWAYS mention the product name "${name}" or price "${price}" somewhere in the answer.
4. END with a readiness CTA — NOT "abhi bid lagao" (bidding isn't open during Q&A).
   ✅ Say: "Taiyaar raho bidding ke liye!" / "Jab bid khule seedha laga dena!" / "Ready ho jao!"
   ⛔ NEVER say: "abhi bid lagao" / "bid karo" / "bid lagao" during Q&A phase.
5. NEVER say "I am an AI", "I'm a bot", "as an AI". You ARE ${config.sellerName}.
6. LANGUAGE: You MUST respond in ${config.language === 'hinglish' ? 'Hinglish (Hindi + English mix)' : config.language === 'hindi' ? 'Hindi (Devanagari)' : 'English'}. NEVER switch language mid-answer.
7. TRUTH CONTROL:
   - If asked about invoice → only say "invoice hai" if hasInvoice = YES
   - If asked about defects → be HONEST about: ${defects || 'no defects'}
   - If asked about color/size/material and it's unknown → say "exact details listing mein hain"
   - NEVER invent specs, MRP, brand claims, or stock info
8. OBJECTION HANDLING:
   - "price zyada" → use the PRICE RULE above — resale items are premium, not cheap
   - "Amazon pe sasta" → Amazon has fakes + wait time, here you see it live
   - "quality?" → mention condition honestly: ${condition || 'good condition'}
9. VISUAL GUIDANCE: If someone asks to see something ("dikhao", "show me") → say "[📷 Showing now]" + description
10. RUDE/OFF-TOPIC questions → deflect: "Let's focus on ${name} — bid karo abhi!"
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

TONE: ${toneMap[config.tone] || toneMap.energetic}

Now answer this viewer's question in MAX 2 sentences. Use the style guide and examples above. Stay in character as ${config.sellerName}.`;

  /* ── OpenAI GPT-4o-mini (primary) or Groq Llama (fallback) ── */
  if (OPENAI_API_KEY || GROQ_API_KEY) {
    try {
      const answer = await chatComplete(
        [
          { role: 'system', content: systemPrompt },
          ...chatHistory.slice(-4),
          { role: 'user', content: question },
        ],
        220,    // short answer: 2 sentences max
        0.5,    // low temperature = focused, on-script, no hallucination
        false,  // plain text, not JSON
      );
      if (answer && answer.length > 5) return answer;
    } catch (e) {
      console.warn('answerLiveQuestion AI call failed:', e);
    }
  }

  /* ── Local fallback (no API key / network failure) — authentic Indian style ── */
  const q    = question.toLowerCase();
  const lang = config.language;
  const H    = lang === 'hindi';
  const E    = lang === 'english';

  const ok  = H ? 'बिल्कुल!'        : E ? 'Absolutely!'       : 'Bilkul yaar!';
  // Readiness CTA — NOT "bid lagao" since bidding isn't open during Q&A
  const bid = H ? 'तैयार रहो बोली के लिए!' : E ? 'Get ready for bidding!' : 'Taiyaar raho bidding ke liye!';
  const grt = H ? 'बढ़िया सवाल!'    : E ? 'Great question!'   : 'Zabardast sawaal!';
  const hn  = H ? 'है'              : E ? 'is'                : 'hai';
  const by  = buyerName ? (H ? `${buyerName} जी, ` : E ? `${buyerName}, ` : `${buyerName} yaar, `) : '';

  // Authenticity / original
  if (/original|authentic|real|fake|asli|genuine|verify/.test(q)) {
    if (hasInv) return H
      ? `${by}${name} के साथ पूरा GST invoice ${hn} — 100% verified! ${bid}`
      : E ? `${by}${name} comes with full GST invoice — 100% verified purchase. ${bid}`
      : `${by}${name} ka full GST invoice ${hn} mere paas — 100% verified yaar. ${bid}`;
    return H
      ? `${by}${name} seller-verified quality ${hn} — मैंने खुद जाँचा है। ${bid}`
      : E ? `${by}${name} is seller-verified quality — I personally checked every piece. ${bid}`
      : `${by}${name} seller-verified quality ${hn} — meri guarantee pe le lo, maine khud check kiya. ${bid}`;
  }
  // Defects
  if (/defect|problem|issue|kharabi|damage|scratch|broken|kharab/.test(q)) {
    if (defects) return H
      ? `${by}ईमानदारी से — ${defects}। इसीलिए ${name} ${price} में है। ${bid}`
      : E ? `${by}Honest answer — ${defects}. That's why ${name} is priced at ${price}. ${bid}`
      : `${by}Honest hoon main — ${defects}. Isliye ${name} sirf ${price} mein mil raha ${hn}. ${bid}`;
    return H
      ? `${by}${name} बिल्कुल ${condition ? CONDITION_LABEL[condition] : 'अच्छी'} स्थिति में ${hn}। ${bid}`
      : E ? `${by}${name} is in ${condition || 'great'} condition — personally verified. ${bid}`
      : `${by}${name} bilkul ${condition ? CONDITION_LABEL[condition] : 'sahi condition'} mein ${hn} — personally verify kiya ${hn}. ${bid}`;
  }
  // Invoice / GST
  if (/invoice|gst|bill|receipt|pucca|pakka.*bill/.test(q)) {
    if (hasInv) return H
      ? `${by}हाँ, ${name} के साथ GST invoice मिलेगा। ${bid}`
      : E ? `${by}Yes, full GST invoice available with ${name}. ${bid}`
      : `${by}Haan yaar, full GST invoice milega ${name} ke saath — proper documentation. ${bid}`;
    return H
      ? `${by}${name} के साथ invoice नहीं ${hn} — पर quality personally guaranteed ${hn}। ${bid}`
      : E ? `${by}No invoice for ${name} — but quality is personally guaranteed by me. ${bid}`
      : `${by}Invoice nahi hai seedha bol raha hoon — par ${name} ki quality meri guarantee pe ${hn}. ${bid}`;
  }
  // Price too high / bargaining
  if (/price.*zyada|zyada.*price|mehnga|expensive|costly|kam karo|reduce|negotiate|bargain|sasta karo/.test(q))
    return isResale
      ? (H ? `${by}यह limited piece ${hn} — secondary market में और महंगा मिलेगा। यहाँ ${price} best deal ${hn}। ${bid}`
           : E ? `${by}This is a limited piece — you'd pay more elsewhere. ${price} is the best deal. ${bid}`
           : `${by}Yaar yeh limited piece ${hn} — secondary market mein aur mahnga milega. Yahan ${price} best deal ${hn}. ${bid}`)
      : (H ? `${by}Live price sabse kam price hoti ${hn} — kahin nahi milega itna sasta. ${bid}`
           : E ? `${by}Live price is always the best price — you won't find it cheaper anywhere today. ${bid}`
           : `${by}Yaar live price hi sabse sasti price hoti ${hn} — Amazon pe delivery charge alag. Yahan ${price} direct. ${bid}`);
  // Amazon / competitor comparison
  if (/amazon|flipkart|meesho|myntra|online.*sasta|sasta.*online|cheaper|market mein/.test(q))
    return H
      ? `${by}Amazon पर fake भी मिलता ${hn} — यहाँ live देख रहे हो, कोई surprise नहीं। ${bid}`
      : E ? `${by}Amazon has fakes and delivery charges — here you see ${name} live, no surprises. ${bid}`
      : `${by}Amazon pe fake bhi milta ${hn} yaar — yahan live dekh rahe ho, koi dhoka nahi. ${price} mein direct. ${bid}`;
  // Quality / material
  if (/quality|kaisi.*hai|acchi hai|build|material|fabric|kitna.*accha/.test(q)) {
    const mat  = material ? (H ? `${material} material` : E ? `${material} material` : `${material} material`) : '';
    const cond = condition ? CONDITION_LABEL[condition] : (H ? 'अच्छी' : E ? 'great' : 'sahi');
    return H
      ? `${by}${name} ${mat ? mat + ', ' : ''}${cond} स्थिति में ${hn}${defects ? ` — ${defects}` : ''}। ${bid}`
      : E ? `${by}${name} is ${mat ? mat + ', ' : ''}${cond} condition${defects ? ` — note: ${defects}` : ''}. ${bid}`
      : `${by}${name} ${mat ? mat + ', ' : ''}${cond} condition mein ${hn}${defects ? ` — honest note: ${defects}` : ''}. Meri guarantee. ${bid}`;
  }
  // Shipping / delivery
  if (/ship|deliver|kitne din|kab.*aayega|kab milega|dispatch|courier/.test(q))
    return H
      ? `${by}${name} 3-5 दिन में घर पे — free shipping, full tracking। ${bid}`
      : E ? `${by}${name} ships pan-India in 3-5 days, free tracking. ${bid}`
      : `${by}${name} 3-5 din mein ghar pe yaar — free shipping, full tracking link milega. ${bid}`;
  // Return / refund
  if (/return|refund|wapas|exchange|vapas|return.*policy/.test(q))
    return H
      ? `${by}7 दिन में वापसी — zero risk, कोई सवाल नहीं। ${bid}`
      : E ? `${by}7-day easy returns on ${name} — zero risk, no questions asked. ${bid}`
      : `${by}7 din return policy ${hn} — koi problem? Seedha wapas karo, koi sawaal nahi. ${bid}`;
  // COD
  if (/cod|cash.?on.?delivery|cash pe|cash mein/.test(q))
    return H
      ? `${by}UPI और card अभी available ${hn} — COD जल्दी आ रहा ${hn}। ${bid}`
      : E ? `${by}UPI and card available now — COD coming very soon. ${bid}`
      : `${by}UPI aur card abhi available ${hn} — COD jaldi aa raha ${hn} platform pe. ${price} miss mat karo. ${bid}`;
  // Size / fit
  if (/size|fit|fitting|measurement|kaisa fit|kitna bada|kitna chota/.test(q))
    return size
      ? (H ? `${by}${name} ${size} में available ${hn}। ${bid}`
           : E ? `${by}${name} available in ${size}. ${bid}`
           : `${by}${name} ${size} mein available ${hn} yaar. ${bid}`)
      : (H ? `${by}${name} की sizing listing में detail में है। ${bid}`
           : E ? `${by}Size details are in the listing — check and bid. ${bid}`
           : `${by}${name} ki sizing listing mein clearly hai — check karo aur ${bid}`);
  // Warranty
  if (/warranty|guarantee|kitne saal|kitne mahine|durability/.test(q))
    return H
      ? `${by}${name} के साथ quality guarantee ${hn} — कोई issue? हम sort करेंगे। ${bid}`
      : E ? `${by}${name} comes with my quality guarantee — any issue and we'll sort it. ${bid}`
      : `${by}${name} ke saath quality guarantee ${hn} — koi bhi issue aaya toh seedha baat karo. ${bid}`;
  // Visual / show request
  if (/dikhao|dikha|show|dekh|zoom|front|back|close.?up|rotate|ghuma/.test(q))
    return H
      ? `${by}[📷 अभी दिखा रहा हूँ!] देखो — ${condition || 'अच्छी'} स्थिति में ${hn}। ${bid}`
      : E ? `${by}[📷 Showing now!] Look — ${condition || 'great'} condition. ${bid}`
      : `${by}[📷 Abhi dikha raha hoon!] Dekho yaar — ${condition || 'bilkul sahi'} condition mein ${hn}. ${bid}`;
  // Color
  if (/color|colour|rang|kaisa rang|kaunsa color/.test(q))
    return color
      ? (H ? `${by}${name} का रंग ${color} ${hn}। ${bid}`
           : E ? `${by}${name} is in ${color}. ${bid}`
           : `${by}${name} ${color} color mein ${hn} yaar. ${bid}`)
      : (H ? `${by}${name} का exact color listing में है। ${bid}`
           : E ? `${by}Exact color is in the listing. ${bid}`
           : `${by}${name} ka exact color listing mein ${hn} — check karo. ${bid}`);

  // Generic fallback — still sounds natural
  return H
    ? `${by}${grt} ${name} ${price} में — ekdum solid deal ${hn}। ${bid}`
    : E ? `${by}${grt} ${name} at ${price} — an incredible live deal. ${bid}`
    : `${by}${grt} ${name} ${price} mein — zabardast deal ${hn} yaar. Ek baar gaya toh gaya. ${bid}`;
}

/* ─────────────────────────────────────────────────────────
   MAIN: Generate full live stream script
   Primary: GPT-4o-mini (better Hinglish, engagement, quality)
   Fallback: Groq Llama-3.3-70b (free tier, batched for 4+ products)
───────────────────────────────────────────────────────── */
export async function generateLiveScript(
  products: Product[],
  config: StreamConfig
): Promise<GeneratedScript> {

  /* 1 — Your own backend (production best practice) */
  if (BACKEND_URL) {
    const res = await fetch(`${BACKEND_URL}/generate-script`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ products, config }),
    });
    if (!res.ok) throw new Error('Script generation failed');
    return res.json();
  }

  const sysMsg = 'You are an expert live shopping host script writer for the Indian market. Strictly follow truth control — never invent product specs. Always respond with valid JSON only.';

  /* 2 — OpenAI GPT-4o-mini (primary — no batching needed, 2M TPM limit) */
  if (OPENAI_API_KEY) {
    const text = await chatComplete(
      [
        { role: 'system', content: sysMsg },
        { role: 'user',   content: buildPrompt(products, config) },
      ],
      4000,  // generous budget — GPT-4o-mini handles 10 products in one shot
    );
    return parseGroqResponse(text);
  }

  /* 3 — Groq Llama fallback with batching (respects 6k TPM free limit) */
  if (GROQ_API_KEY) {
    const BATCH_SIZE = 3;

    if (products.length <= BATCH_SIZE) {
      const text = await chatComplete(
        [
          { role: 'system', content: sysMsg },
          { role: 'user',   content: buildPrompt(products, config) },
        ],
        2000,
      );
      return parseGroqResponse(text);
    }

    // Batch into groups of 3 for Groq's token limit
    const batches: Product[][] = [];
    for (let i = 0; i < products.length; i += BATCH_SIZE)
      batches.push(products.slice(i, i + BATCH_SIZE));

    const allSegments: { productId: string; segment: string }[] = [];
    let intro = '', outro = '';
    let qaResponses: { question: string; answer: string }[] = [];

    for (let b = 0; b < batches.length; b++) {
      const isFirst = b === 0;
      const isLast  = b === batches.length - 1;
      const offset  = b * BATCH_SIZE;

      const batchPrompt = buildPrompt(batches[b], config)
        + `\nproductId values must start at "${offset}".`
        + (!isFirst ? '\nSet intro to "".' : '')
        + (!isLast  ? '\nSet outro to "" and qaResponses to [].' : '');

      const text = await chatComplete(
        [{ role: 'system', content: sysMsg }, { role: 'user', content: batchPrompt }],
        1800,
      );
      const batch = parseGroqResponse(text);

      if (isFirst)  intro       = batch.intro;
      if (isLast) { outro       = batch.outro; qaResponses = batch.qaResponses; }
      allSegments.push(...batch.products);

      if (!isLast) await new Promise(r => setTimeout(r, 400));
    }

    return { intro, products: allSegments, outro, qaResponses };
  }

  /* 3 — Offline mock */
  await new Promise(r => setTimeout(r, 1800));

  const lang  = config.language;
  const greet = lang === 'hindi' ? 'नमस्ते दोस्तों' : lang === 'hinglish' ? 'Hey everyone, kya haal hai!' : 'Hey everyone!';
  const hype  = lang === 'hindi' ? 'बिल्कुल!' : lang === 'hinglish' ? 'Bilkul!' : 'Absolutely!';
  const bye   = lang === 'hinglish' ? 'Phir milenge!' : lang === 'hindi' ? 'फिर मिलेंगे!' : 'See you next time!';

  return {
    intro: `${greet} Welcome to ${config.sellerName}'s live show on Any & All! 🔥 We have ${products.length} incredible ${products.length === 1 ? 'item' : 'items'} lined up today — things I personally hand-picked and verified just for you. Drop a 👋 in the chat! Let's start!`,

    products: products.map((p, i) => {
      const condNote  = p.condition ? `Condition: ${CONDITION_LABEL[p.condition]}.` : '';
      const defNote   = p.defects   ? `Note: ${p.defects} — isliye itni achhi price.` : '';
      const invNote   = p.hasInvoice ? 'Invoice available.' : '';
      const mrpNote   = p.mrp       ? `Original MRP: ${p.mrp}.` : '';
      const visualCue = `[📷 Show ${p.name} — front and details]`;

      return {
        productId: String(i),
        segment: `${i > 0 ? `Item ${i + 1} ab aa raha hai —` : 'Pehle item ke saath shuru karte hain —'} ${p.name}!

${visualCue}

${condNote} ${defNote} ${invNote} ${mrpNote}
${p.description}

${p.keyPoints.filter(Boolean).map(pt => `✅ ${pt}`).join('\n')}

And the price? Starting bid: **${p.price}**! ${hype}${p.mrp ? ` MRP tha ${p.mrp} — aaj live mein ekdum best price!` : ''}

${config.tone === 'energetic' ? `WHO WANTS THIS?! Drop "WANT" in chat! Bid button dabao — abhi! ⚡` : ''}
${config.tone === 'luxury'    ? 'A premium piece for those with refined taste. Place your bid now.' : ''}
${config.tone === 'friendly'  ? "I'd love for one of you to take this home. Tap bid! 😊" : ''}
${config.tone === 'calm'      ? "Take your time. When you're ready, place your bid." : ''}`.trim(),
      };
    }),

    outro: `That's a wrap! Thank you SO much for being here — you guys are the best. 🙏\nIf you won, check notifications for shipping details. Miss out today? Follow the channel — next show is coming soon!\n${bye} ❤️`,

    qaResponses: [
      { question: 'Original hai kya?',        answer: `${hype} Har item personally verify kiya hai maine — seller-guaranteed quality.` },
      { question: 'Return milega?',            answer: '7-day easy returns on all items — zero risk, koi question nahi.' },
      { question: 'Delivery kab hogi?',        answer: 'Pan-India 3-5 din mein — free shipping, full tracking link milega.' },
      { question: 'Defect toh nahi hai?',      answer: 'Har item condition listed hai — koi hidden surprise nahi. Jo dikha wahi hai.' },
      { question: 'Invoice milega?',           answer: 'Invoice availability har item ke listing mein mention hai — check karo.' },
      { question: 'Amazon se sasta kaise?',    answer: 'Amazon pe delivery charge + wait + fake risk. Yahan live dekh rahe ho — koi surprise nahi!' },
      { question: 'Price thoda kam karo?',     answer: 'Live price hamesha best price hoti hai — yahi toh live shopping ka magic hai!' },
      { question: 'Quality kaisi hai?',        answer: 'Condition aur details har product ke listing mein clearly mentioned hai — full transparency.' },
    ],
  };
}
