import { NextResponse } from "next/server";
import { adminClient, isSupabaseConfigured } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Reports needed before a krathong is pulled out of the river. */
const HIDE_AFTER_REPORTS = 3;

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "ยังไม่ได้ตั้งค่า Supabase" }, { status: 503 });
  }

  const { id } = await params;
  const { data, error } = await adminClient().rpc("report_krathong", {
    p_id: id,
    p_hide_after: HIDE_AFTER_REPORTS,
  });

  if (error) {
    return NextResponse.json({ error: "รายงานไม่สำเร็จ" }, { status: 500 });
  }

  return NextResponse.json({ reports: data ?? 0 });
}
