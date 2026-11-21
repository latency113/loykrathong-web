import { createHash, randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import {
  IMAGE_LIMITS,
  krathongConfigSchema,
  releaseTextSchema,
  RIVER,
  type Krathong,
} from "@/lib/krathong/schema";
import {
  moderateKrathongWithGemini,
  screenWish,
} from "@/lib/krathong/moderation";
import { adminClient, isSupabaseConfigured } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Releases allowed per IP inside the window. */
const RATE_LIMIT = 5;
const RATE_WINDOW_MINUTES = 10;
const STORAGE_BUCKET = "krathongs";

type Row = {
  id: string;
  nickname: string;
  wish: string;
  image_url: string | null;
  config: Krathong["config"] | null;
  blessings: number | null;
  position_x: number;
  position_z: number;
  created_at: string;
};

function toKrathong(row: Row): Krathong {
  return {
    id: row.id,
    nickname: row.nickname,
    wish: row.wish,
    imageUrl: row.image_url,
    config: row.config,
    blessings: row.blessings ?? 0,
    x: row.position_x,
    z: row.position_z,
    createdAt: row.created_at,
  };
}

function hashIp(ip: string): string {
  const salt = process.env.IP_HASH_SALT ?? "loykrathong";
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex");
}

function extForMime(mime: string): string {
  if (mime === "image/webp") return "webp";
  if (mime === "image/jpeg") return "jpg";
  if (mime === "image/png") return "png";
  return "webp";
}

async function pickPosition(
  db: ReturnType<typeof adminClient>,
): Promise<{ x: number; z: number }> {
  const { data } = await db
    .from("krathongs")
    .select("position_x,position_z")
    .is("hidden_at", null)
    .order("created_at", { ascending: false })
    .limit(40);

  const taken = (data ?? []) as { position_x: number; position_z: number }[];
  let best = { x: 0, z: -5 };
  let bestGap = -1;

  for (let attempt = 0; attempt < 16; attempt += 1) {
    const x = (Math.random() * 2 - 1) * 8;
    const z = -2 - Math.random() * 8;
    const gap =
      taken.length === 0
        ? Number.POSITIVE_INFINITY
        : Math.min(
            ...taken.map((p) => Math.hypot(p.position_x - x, p.position_z - z)),
          );
    if (gap > bestGap) {
      bestGap = gap;
      best = { x, z };
    }
    if (gap > 4) break;
  }

  return {
    x: Number(best.x.toFixed(2)),
    z: Number(best.z.toFixed(2)),
  };
}

/**
 * Lazy batch cleanup so expired images do not accumulate in the 1 GB free
 * Storage bucket even without pg_cron.
 */
async function cleanupExpiredBatch(db: ReturnType<typeof adminClient>) {
  try {
    const nowIso = new Date().toISOString();
    const { data } = await db
      .from("krathongs")
      .select("id,image_path")
      .lt("expires_at", nowIso)
      .limit(20);

    const expired = (data ?? []) as { id: string; image_path: string | null }[];
    if (expired.length === 0) return;

    const paths = expired
      .map((r) => r.image_path)
      .filter((p): p is string => Boolean(p));
    if (paths.length > 0) {
      await db.storage.from(STORAGE_BUCKET).remove(paths);
    }

    await db
      .from("krathongs")
      .delete()
      .in(
        "id",
        expired.map((r) => r.id),
      );
  } catch {
    // Best-effort housekeeping; never fail the user request.
  }
}

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ krathongs: [], demo: true });
  }

  const { data, error } = await adminClient()
    .from("krathongs")
    .select("id,nickname,wish,image_url,config,blessings,position_x,position_z,created_at")
    .is("hidden_at", null)
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false })
    .limit(RIVER.pageSize);

  if (error) {
    return NextResponse.json(
      { error: "อ่านกระทงจากแม่น้ำไม่สำเร็จ" },
      { status: 500 },
    );
  }

  return NextResponse.json({
    krathongs: (data as Row[]).map(toKrathong),
    demo: false,
  });
}

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "ยังไม่ได้ตั้งค่า Supabase — ดู .env.example" },
      { status: 503 },
    );
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
  }

  const parsedText = releaseTextSchema.safeParse({
    nickname: form.get("nickname"),
    wish: form.get("wish") ?? "",
  });
  if (!parsedText.success) {
    return NextResponse.json(
      { error: parsedText.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" },
      { status: 422 },
    );
  }

  const mode = form.get("mode") === "classic" ? "classic" : "image";
  const imageEntry = form.get("image");
  let imageBytes: Uint8Array | undefined;
  let mimeType: string | undefined;
  let classicConfig: Krathong["config"] = null;

  if (mode === "classic") {
    let rawConfig: unknown;
    try {
      rawConfig = JSON.parse(String(form.get("config") ?? "{}"));
    } catch {
      return NextResponse.json({ error: "ข้อมูลกระทงไม่ถูกต้อง" }, { status: 422 });
    }
    const parsedConfig = krathongConfigSchema.safeParse(rawConfig);
    if (!parsedConfig.success) {
      return NextResponse.json({ error: "รูปแบบกระทงไม่ถูกต้อง" }, { status: 422 });
    }
    classicConfig = parsedConfig.data;
  } else {
    if (!(imageEntry instanceof File)) {
      return NextResponse.json({ error: "กรุณาอัปโหลดรูปภาพ" }, { status: 422 });
    }
    if (
      !IMAGE_LIMITS.allowedMimeTypes.includes(
        imageEntry.type as (typeof IMAGE_LIMITS.allowedMimeTypes)[number],
      )
    ) {
      return NextResponse.json(
        { error: "รองรับเฉพาะไฟล์ WebP, JPEG หรือ PNG" },
        { status: 422 },
      );
    }
    if (imageEntry.size === 0 || imageEntry.size > IMAGE_LIMITS.maxUploadBytes) {
      return NextResponse.json(
        { error: "ขนาดรูปต้องไม่เกิน 250 KB" },
        { status: 422 },
      );
    }
    imageBytes = new Uint8Array(await imageEntry.arrayBuffer());
    mimeType = imageEntry.type;
  }

  const screened = screenWish(parsedText.data.nickname, parsedText.data.wish);
  if (!screened.ok) {
    return NextResponse.json({ error: screened.reason }, { status: 422 });
  }

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown";
  const ipHash = hashIp(ip);
  const db = adminClient();
  const since = new Date(Date.now() - RATE_WINDOW_MINUTES * 60_000).toISOString();

  const { count } = await db
    .from("wish_events")
    .select("id", { count: "exact", head: true })
    .eq("ip_hash", ipHash)
    .gt("created_at", since);

  if ((count ?? 0) >= RATE_LIMIT) {
    return NextResponse.json(
      { error: `ปล่อยได้ ${RATE_LIMIT} ครั้งต่อ ${RATE_WINDOW_MINUTES} นาที ลองใหม่ภายหลัง` },
      { status: 429 },
    );
  }

  const moderation = await moderateKrathongWithGemini({
    nickname: screened.nickname,
    wish: screened.wish,
    imageBytes,
    mimeType,
  });

  if (!moderation.ok) {
    return NextResponse.json(
      { error: moderation.reason },
      { status: moderation.status },
    );
  }

  await db.from("wish_events").insert({ ip_hash: ipHash });

  const id = randomUUID();
  let imagePath: string | null = null;
  let imageUrl: string | null = null;

  if (mode === "image" && imageBytes && mimeType) {
    imagePath = `${id}.${extForMime(mimeType)}`;

    const { error: uploadError } = await db.storage
      .from(STORAGE_BUCKET)
      .upload(imagePath, imageBytes, {
        contentType: mimeType,
        cacheControl: "31536000",
        upsert: false,
      });

    if (uploadError) {
      console.error("[krathongs] storage upload failed:", uploadError.message);
      return NextResponse.json(
        { error: "บันทึกรูปไม่สำเร็จ ลองอีกครั้ง" },
        { status: 500 },
      );
    }

    const { data: urlData } = db.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(imagePath);
    imageUrl = urlData.publicUrl;
  }

  const { x, z } = await pickPosition(db);

  const { data, error } = await db
    .from("krathongs")
    .insert({
      id,
      nickname: screened.nickname,
      wish: screened.wish,
      config: classicConfig,
      image_path: imagePath,
      image_url: imageUrl,
      position_x: x,
      position_z: z,
    })
    .select("id,nickname,wish,image_url,config,blessings,position_x,position_z,created_at")
    .single();

  if (error) {
    if (imagePath) {
      await db.storage.from(STORAGE_BUCKET).remove([imagePath]);
    }
    console.error("[krathongs] insert failed:", error.code, error.message);
    return NextResponse.json(
      { error: "ปล่อยกระทงไม่สำเร็จ ลองอีกครั้ง" },
      { status: 500 },
    );
  }

  void cleanupExpiredBatch(db);

  return NextResponse.json({ krathong: toKrathong(data as Row) }, { status: 201 });
}
