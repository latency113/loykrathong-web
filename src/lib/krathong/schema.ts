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
