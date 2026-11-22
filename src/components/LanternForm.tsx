"use client";

import { useState } from "react";
import SkyLanternSvg from "./SkyLanternSvg";
import {
  LANTERN_COLORS,
  LANTERN_COLOR_LABELS,
  LANTERN_COLOR_STYLES,
  type LanternColor,
  type LanternReleaseInput,
} from "@/lib/krathong/schema";

type ReleaseOutcome =
  | { ok: true; demo: boolean }
  | { ok: false; error: string };

export default function LanternForm({
  onRelease,
  onClose,
}: {
  onRelease: (input: LanternReleaseInput) => Promise<ReleaseOutcome>;
  onClose: () => void;
}) {
  const [nickname, setNickname] = useState("");
  const [wish, setWish] = useState("");
  const [color, setColor] = useState<LanternColor>("amber");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const style = LANTERN_COLOR_STYLES[color];

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (nickname.trim().length === 0) {
      setError("ใส่ชื่อก่อนลอยโคม");
      return;
    }

    setSending(true);
    const result = await onRelease({
      nickname: nickname.trim(),
      wish: wish.trim(),
      color,
    });
    setSending(false);

    if (result.ok) {
      onClose();
    } else {
      setError(result.error);
    }
  };

  return (
    <div className="fixed inset-0 z-30 flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center sm:p-4">
      <form
        onSubmit={submit}
        className="flex max-h-[94dvh] w-full max-w-md flex-col overflow-hidden rounded-t-3xl border border-white/10 bg-[#0b1726]/95 shadow-2xl sm:rounded-3xl"
      >
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-3.5">
          <div>
            <h2 className="text-base font-semibold text-amber-100">ลอยโคมคำอธิษฐาน</h2>
            <p className="text-xs text-slate-400">
              ปล่อยโคมขึ้นฟ้าให้คำอธิษฐานลอยไปกับสายลม
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 transition hover:bg-white/10 hover:text-white"
            aria-label="ปิด"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4 overflow-y-auto p-5">
          <div className="flex flex-col items-center rounded-2xl border border-white/10 bg-gradient-to-b from-[#0a1a35] to-[#081528] py-5">
            <div className="relative">
              <div className={`absolute -inset-5 rounded-full blur-xl ${style.glow}`} />
              <SkyLanternSvg
                color={color}
                className="relative h-20 w-16 drop-shadow-[0_0_18px_rgba(251,191,36,0.5)]"
              />
            </div>
            <p className="mt-3 text-xs text-slate-400">{LANTERN_COLOR_LABELS[color]}</p>
            {wish.trim() && (
              <p className="mt-2 max-w-[16rem] text-center text-xs leading-snug text-amber-100/90">
                “{wish.trim()}”
              </p>
            )}
          </div>

          <div>
            <p className="text-xs text-slate-300">สีโคม</p>
            <div className="mt-2 grid grid-cols-4 gap-2">
              {LANTERN_COLORS.map((item) => {
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setColor(item)}
                    className={`flex flex-col items-center gap-1.5 rounded-xl border px-1 py-2 text-[10px] transition ${
                      color === item
                        ? "border-amber-300/70 bg-amber-300/15 text-amber-100"
                        : "border-white/10 bg-black/25 text-slate-400 hover:bg-white/10"
                    }`}
                  >
                    <SkyLanternSvg color={item} className="h-7 w-6" />
                    {LANTERN_COLOR_LABELS[item]}
                  </button>
                );
              })}
            </div>
          </div>

          <label className="block text-sm text-slate-300">
            ชื่อเล่น <span className="text-amber-300">*</span>
            <input
              type="text"
              maxLength={24}
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="เช่น น้ำ, ต้น"
              className="mt-1.5 w-full rounded-xl border border-white/10 bg-black/30 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-amber-300/60 focus:outline-none"
            />
          </label>

          <label className="block text-sm text-slate-300">
            คำอธิษฐาน (ไม่บังคับ)
            <textarea
              rows={3}
              maxLength={140}
              value={wish}
              onChange={(e) => setWish(e.target.value)}
              placeholder="ขอให้มีความสุขตลอดปี…"
              className="mt-1.5 w-full resize-none rounded-xl border border-white/10 bg-black/30 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-amber-300/60 focus:outline-none"
            />
          </label>

          <p className="rounded-xl border border-amber-400/25 bg-amber-400/10 px-3.5 py-2.5 text-xs leading-relaxed text-amber-100/90">
            <strong className="font-semibold text-amber-200">คำเตือน:</strong> ห้ามใช้ถ้อยคำหยาบคาย
            อนาจาร ความรุนแรง โฆษณาเว็บพนัน สแปม หรือเนื้อหาผิดกฎหมาย
          </p>

          {error && (
            <p className="rounded-xl border border-red-400/30 bg-red-500/10 px-3.5 py-2 text-xs text-red-200">
              {error}
            </p>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-white/10 px-5 py-3.5">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full px-4 py-2 text-sm text-slate-300 transition hover:bg-white/10"
          >
            ยกเลิก
          </button>
          <button
            type="submit"
            disabled={sending}
            className="rounded-full bg-gradient-to-r from-amber-300 to-orange-400 px-6 py-2 text-sm font-semibold text-[#2a1606] shadow-md transition hover:brightness-110 disabled:opacity-50"
          >
            {sending ? "กำลังตรวจสอบและลอย…" : "ลอยโคม"}
          </button>
        </div>
      </form>
    </div>
  );
}
