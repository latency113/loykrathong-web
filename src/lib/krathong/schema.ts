import { z } from "zod";

export const FLOWERS = ["marigold", "lotus", "orchid"] as const;
export type Flower = (typeof FLOWERS)[number];

export const BASES = ["banana", "lotus", "bowl"] as const;
export type Base = (typeof BASES)[number];

export const BASE_LABELS: Record<Base, string> = {
  banana: "ใบตอง",
  lotus: "กลีบบัว",
  bowl: "ถ้วย",
};

export const BASE_HINTS: Record<Base, string> = {
  banana: "จีบใบตอง 9 กลีบ แบบดั้งเดิม",
  lotus: "กลีบบัวซ้อนสองชั้น",
  bowl: "ถ้วยเรียบ ๆ แต่งง่าย",
};

export const FLOWER_LABELS: Record<Flower, string> = {
  marigold: "ดาวเรือง",
  lotus: "บัว",
  orchid: "กล้วยไม้",
};

export const CLASSIC_PRESETS = [
  "lotus-pink",
  "banana-leaf",
  "lotus-gold",
  "lotus-purple",
] as const;
export type ClassicPreset = (typeof CLASSIC_PRESETS)[number];

export const CLASSIC_PRESET_LABELS: Record<ClassicPreset, string> = {
  "lotus-pink": "บัวชมพู",
  "banana-leaf": "ใบตองดั้งเดิม",
  "lotus-gold": "บัวทอง",
  "lotus-purple": "บัวม่วง",
};

const hexColor = z.string().regex(/^#[0-9a-fA-F]{6}$/, "สีต้องอยู่ในรูป #rrggbb");

export const krathongConfigSchema = z.object({
  preset: z.enum(CLASSIC_PRESETS).optional(),
  base: z.enum(BASES).default("lotus"),
  petalColor: hexColor,
  flowerColor: hexColor,
  flower: z.enum(FLOWERS),
  flowers: z.number().int().min(3).max(7),
  candle: z.boolean(),
  incense: z.boolean(),
});

export const releaseTextSchema = z.object({
  nickname: z.string().trim().min(1, "ใส่ชื่อด้วย").max(24, "ชื่อยาวเกิน 24 ตัวอักษร"),
  wish: z.string().trim().max(140, "คำอธิษฐานยาวเกิน 140 ตัวอักษร").default(""),
});

export type KrathongConfig = z.infer<typeof krathongConfigSchema>;

export type ReleaseInput =
  | {
      mode: "image";
      nickname: string;
      wish: string;
      imageFile: File;
      previewUrl: string;
    }
  | {
      mode: "classic";
      nickname: string;
      wish: string;
      config: KrathongConfig;
    };

export const LANTERN_COLORS = ["amber", "rose", "sky", "violet"] as const;
export type LanternColor = (typeof LANTERN_COLORS)[number];

export const LANTERN_COLOR_LABELS: Record<LanternColor, string> = {
  amber: "ทองอบอุ่น",
  rose: "ชมพูเรืองรอง",
  sky: "ฟ้าเย็นตา",
  violet: "ม่วงคราม",
};

/** Tailwind classes must stay literal so the scanner sees them. */
export const LANTERN_COLOR_STYLES: Record<
  LanternColor,
  { body: string; glow: string; border: string; dot: string }
> = {
  amber: {
    body: "from-amber-100 via-amber-300 to-orange-500",
    glow: "bg-amber-400/30",
    border: "border-amber-200/60",
    dot: "bg-amber-300",
  },
  rose: {
    body: "from-rose-100 via-rose-300 to-pink-500",
    glow: "bg-rose-400/30",
    border: "border-rose-200/60",
    dot: "bg-rose-300",
  },
  sky: {
    body: "from-cyan-100 via-sky-300 to-blue-500",
    glow: "bg-sky-400/30",
    border: "border-sky-200/60",
    dot: "bg-sky-300",
  },
  violet: {
    body: "from-violet-100 via-violet-300 to-purple-600",
    glow: "bg-violet-400/30",
    border: "border-violet-200/60",
    dot: "bg-violet-300",
  },
};

export const lanternReleaseSchema = z.object({
  nickname: z.string().trim().min(1, "ใส่ชื่อด้วย").max(24, "ชื่อยาวเกิน 24 ตัวอักษร"),
  wish: z.string().trim().max(140, "คำอธิษฐานยาวเกิน 140 ตัวอักษร").default(""),
  color: z.enum(LANTERN_COLORS).default("amber"),
});

export type LanternReleaseInput = z.infer<typeof lanternReleaseSchema>;

/** A wish-carrying sky lantern. Rendered in the sky, not on the water. */
export type Lantern = {
  id: string;
  nickname: string;
  wish: string;
  color: LanternColor;
  blessings: number;
  /** normalized sky position: x -1..1, y 0..1 */
  x: number;
  y: number;
  createdAt: string;
};

export const LANTERN = {
  /** max lanterns sent to one client */
  pageSize: 120,
  /** a lantern lives this long in the sky */
  ttlDays: 7,
} as const;

export const RIVER_SCENES = ["chao-phraya", "yi-peng", "moonlight-lake"] as const;
export type RiverScene = (typeof RIVER_SCENES)[number];

export const RIVER_SCENE_LABELS: Record<RiverScene, string> = {
  "chao-phraya": "เจ้าพระยา",
  "yi-peng": "โคมยี่เป็ง",
  "moonlight-lake": "ทะเลสาบแสงจันทร์",
};

/** What the client sees. Never includes ip hash or moderation state. */
export type Krathong = {
  id: string;
  nickname: string;
  wish: string;
  imageUrl: string | null;
  config?: KrathongConfig | null;
  blessings: number;
  /** normalized river position (-14..14, -30..10) */
  x: number;
  z: number;
  createdAt: string;
};

export const IMAGE_LIMITS = {
  maxDimension: 512,
  maxUploadBytes: 250 * 1024,
  allowedMimeTypes: ["image/webp", "image/jpeg", "image/png"] as const,
} as const;

export const RIVER = {
  /** half-width of the floatable area */
  halfWidth: 14,
  /** z range; used to map depth on the 2D river */
  minZ: -30,
  maxZ: 10,
  /** a krathong lives this long in the river */
  ttlDays: 7,
  /** max krathongs sent to one client */
  pageSize: 200,
} as const;
