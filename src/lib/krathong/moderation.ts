/**
 * Server-side screening for wish text and uploaded krathong images.
 * First-line keyword filter runs locally; image + text safety uses Gemini API
 * in a single fail-closed request.
 */

const BANNED = [
  "http://",
  "https://",
  "www.",
  "ufabet",
  "บาคาร่า",
  "คาสิโน",
  "แทงบอล",
  "พนัน",
  "เงินกู้",
  "คลิกเลย",
  "โปรโมท",
  "รับทำเว็บ",
  "ขายของ",
];

/** Same character repeated 8+ times: "!!!!!!!!" or "ากากากา" spam. */
const REPEATED = /(.)\1{7,}/u;
/** Control chars and bidi overrides that can spoof layout. */
const UNSAFE_CHARS = /[\u0000-\u001f\u007f\u200b-\u200f\u202a-\u202e\u2066-\u2069]/g;

export type ScreenResult =
  | { ok: true; nickname: string; wish: string }
  | { ok: false; reason: string };

export function screenWish(nickname: string, wish: string): ScreenResult {
  const cleanNickname = nickname.replace(UNSAFE_CHARS, "").trim();
  const cleanWish = wish.replace(UNSAFE_CHARS, "").trim();

  if (cleanNickname.length === 0) {
    return { ok: false, reason: "ชื่อว่างไม่ได้" };
  }

  const haystack = `${cleanNickname}\n${cleanWish}`.toLowerCase();
  const hit = BANNED.find((word) => haystack.includes(word));
  if (hit) {
    return { ok: false, reason: "ข้อความมีเนื้อหาที่ไม่เหมาะสม" };
  }

  if (REPEATED.test(cleanWish)) {
    return { ok: false, reason: "ข้อความซ้ำเกินไป" };
  }

  return { ok: true, nickname: cleanNickname, wish: cleanWish };
}

export type ModerationOutcome =
  | { ok: true }
  | { ok: false; status: number; reason: string };

const GEMINI_MODEL = "gemini-3.5-flash-lite";

/**
 * Moderate image + nickname + wish in one Gemini request.
 * Fail-closed: rate limits (429) or provider errors reject the upload
 * rather than letting unscreened images onto the public river.
 */
export async function moderateKrathongWithGemini(params: {
  nickname: string;
  wish: string;
  imageBytes?: Uint8Array;
  mimeType?: string;
}): Promise<ModerationOutcome> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return {
      ok: false,
      status: 503,
      reason: "ยังไม่ได้ตั้งค่า GEMINI_API_KEY สำหรับตรวจเนื้อหา",
    };
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const prompt = [
    "You are a strict content moderator for a public Thai Loy Krathong website.",
    params.imageBytes
      ? "Check BOTH the attached image AND the user's nickname/wish text."
      : "Check the user's nickname/wish text.",
    "Reject (safe=false) if there is ANY:",
    "1) Nudity, pornography, sexually explicit or suggestive NSFW content",
    "2) Gore, graphic violence, self-harm, or disturbing imagery",
    "3) Gambling, scam, illegal ads, URLs, or hate speech (including text inside the image)",
    'Respond ONLY with JSON: {"safe": boolean, "reason": string}',
    `Nickname: ${params.nickname}`,
    `Wish: ${params.wish || "(none)"}`,
  ].join("\n");

  const parts: Array<
    { text: string } | { inline_data: { mime_type: string; data: string } }
  > = [{ text: prompt }];

  if (params.imageBytes && params.mimeType) {
    parts.push({
      inline_data: {
        mime_type: params.mimeType,
        data: Buffer.from(params.imageBytes).toString("base64"),
      },
    });
  }

  let response: Response;
  try {
    response = await fetch(endpoint, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts }],
        generationConfig: {
          temperature: 0,
          responseMimeType: "application/json",
        },
      }),
    });
  } catch {
    return {
      ok: false,
      status: 503,
      reason: "เชื่อมต่อระบบตรวจรูปไม่ได้ กรุณาลองใหม่",
    };
  }

  if (response.status === 429) {
    return {
      ok: false,
      status: 429,
      reason: "ระบบตรวจรูปกำลังหนาแน่น กรุณารอสักครู่แล้วลองใหม่",
    };
  }

  if (!response.ok) {
    return {
      ok: false,
      status: 503,
      reason: "ระบบตรวจรูปขัดข้องชั่วคราว กรุณาลองใหม่",
    };
  }

  try {
    const payload = (await response.json()) as {
      candidates?: Array<{
        finishReason?: string;
        content?: { parts?: Array<{ text?: string }> };
      }>;
      promptFeedback?: { blockReason?: string };
    };

    if (payload.promptFeedback?.blockReason) {
      return {
        ok: false,
        status: 422,
        reason: "รูปภาพหรือข้อความไม่เหมาะสม กรุณาเปลี่ยนใหม่",
      };
    }

    const candidate = payload.candidates?.[0];
    if (candidate?.finishReason === "SAFETY") {
      return {
        ok: false,
        status: 422,
        reason: "รูปภาพไม่ผ่านเกณฑ์ความปลอดภัย กรุณาเลือกรูปอื่น",
      };
    }

    const rawText = candidate?.content?.parts?.[0]?.text ?? "";
    const parsed = JSON.parse(rawText) as { safe?: unknown; reason?: unknown };
    if (parsed.safe === true) {
      return { ok: true };
    }
    return {
      ok: false,
      status: 422,
      reason: "รูปภาพหรือข้อความไม่เหมาะสมสำหรับพื้นที่สาธารณะ",
    };
  } catch {
    return {
      ok: false,
      status: 503,
      reason: "ไม่สามารถยืนยันผลการตรวจรูปได้ กรุณาลองใหม่",
    };
  }
}
