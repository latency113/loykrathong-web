import { NextResponse } from "next/server";
import { adminClient, isSupabaseConfigured } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "ยังไม่ได้ตั้งค่า Supabase" }, { status: 503 });
  }

  let delta = 1;
  try {
    const body = (await request.json()) as { delta?: unknown };
    if (body?.delta === -1) delta = -1;
  } catch {
    // Empty body defaults to +1
  }

  const { id } = await params;
  const { data, error } = await adminClient().rpc("bless_krathong", {
    p_id: id,
    p_delta: delta,
  });

  if (error) {
    return NextResponse.json({ error: "ส่งใจไม่สำเร็จ" }, { status: 500 });
  }

  return NextResponse.json({ blessings: data ?? 0 });
}
