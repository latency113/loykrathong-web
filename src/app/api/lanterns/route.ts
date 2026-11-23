import { createHash, randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import {
  LANTERN,
  lanternReleaseSchema,
  type Lantern,
  type LanternColor,
} from "@/lib/krathong/schema";
import {
  moderateKrathongWithGemini,
  screenWish,
} from "@/lib/krathong/moderation";
import { adminClient, isSupabaseConfigured } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Releases allowed per IP inside the window, shared with krathong releases. */
const RATE_LIMIT = 5;
const RATE_WINDOW_MINUTES = 10;

type Row = {
  id: string;
  nickname: string;
  wish: string;
  color: LanternColor;
  blessings: number | null;
  position_x: number;
  position_y: number;
  created_at: string;
};

function toLantern(row: Row): Lantern {
  return {
    id: row.id,
    nickname: row.nickname,
    wish: row.wish,
    color: row.color,
    blessings: row.blessings ?? 0,
    x: row.position_x,
    y: row.position_y,
    createdAt: row.created_at,
  };
}

function hashIp(ip: string): string {
  const salt = process.env.IP_HASH_SALT ?? "loykrathong";
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex");
}

/** Place each new lantern at a pure random point in the sky. */
function pickSkyPosition(): { x: number; y: number } {
  return {
    x: Number(((Math.random() * 2 - 1) * 0.92).toFixed(3)),
    y: Number((0.08 + Math.random() * 0.8).toFixed(3)),
  };
}

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ lanterns: [], demo: true });
  }

  const { data, error } = await adminClient()
    .from("lanterns")
    .select("id,nickname,wish,color,blessings,position_x,position_y,created_at")
    .is("hidden_at", null)
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false })
    .limit(LANTERN.pageSize);

  if (error) {
    return NextResponse.json(
      { error: "อ่านโคมจากท้องฟ้าไม่สำเร็จ" },
      { status: 500 },
    );
  }

  return NextResponse.json({
    lanterns: (data as Row[]).map(toLantern),
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

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
  }

  const parsed = lanternReleaseSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" },
      { status: 422 },
    );
  }

  const screened = screenWish(parsed.data.nickname, parsed.data.wish);
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
  });

  if (!moderation.ok) {
    return NextResponse.json(
      { error: moderation.reason },
      { status: moderation.status },
    );
  }

  await db.from("wish_events").insert({ ip_hash: ipHash });

  const { x, y } = pickSkyPosition();

  const { data, error } = await db
    .from("lanterns")
    .insert({
      id: randomUUID(),
      nickname: screened.nickname,
      wish: screened.wish,
      color: parsed.data.color,
      position_x: x,
      position_y: y,
    })
    .select("id,nickname,wish,color,blessings,position_x,position_y,created_at")
    .single();

  if (error) {
    console.error("[lanterns] insert failed:", error.code, error.message);
    return NextResponse.json(
      { error: "ลอยโคมไม่สำเร็จ ลองอีกครั้ง" },
      { status: 500 },
    );
  }

  return NextResponse.json({ lantern: toLantern(data as Row) }, { status: 201 });
}
