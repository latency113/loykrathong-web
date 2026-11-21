"use client";

import { useEffect, useState } from "react";
import ClassicKrathongSvg, { PhotoKrathongFrame } from "./ClassicKrathongSvg";
import { compressImageToWebp, type CompressedImage } from "@/lib/krathong/image";
import {
  CLASSIC_PRESETS,
  CLASSIC_PRESET_LABELS,
  FLOWERS,
  FLOWER_LABELS,
  type ClassicPreset,
  type Flower,
  type KrathongConfig,
  type ReleaseInput,
} from "@/lib/krathong/schema";

const PRESET_DEFAULTS: Record<ClassicPreset, Partial<KrathongConfig>> = {
  "lotus-pink": { base: "lotus", petalColor: "#f472b6", flowerColor: "#f5b731" },
  "banana-leaf": { base: "banana", petalColor: "#2f8f5b", flowerColor: "#f5b731" },
  "lotus-gold": { base: "lotus", petalColor: "#f59e0b", flowerColor: "#fef08a" },
  "lotus-purple": { base: "lotus", petalColor: "#a855f7", flowerColor: "#f8fafc" },
};

const FLOWER_COLORS = ["#f5b731", "#f472b6", "#e8e4f5", "#38bdf8", "#ff8a3d"];

type ReleaseOutcome =
  | { ok: true; demo: boolean }
  | { ok: false; error: string };

export default function KrathongForm({
  onRelease,
  onClose,
}: {
  onRelease: (input: ReleaseInput) => Promise<ReleaseOutcome>;
  onClose: () => void;
}) {
  const [mode, setMode] = useState<"image" | "classic">("image");
  const [nickname, setNickname] = useState("");
  const [wish, setWish] = useState("");
  const [image, setImage] = useState<CompressedImage | null>(null);
  const [config, setConfig] = useState<KrathongConfig>({
    preset: "lotus-pink",
    base: "lotus",
    petalColor: "#f472b6",
    flowerColor: "#f5b731",
    flower: "lotus",
    flowers: 5,
    candle: true,
    incense: true,
  });
  const [compressing, setCompressing] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (image?.previewUrl) URL.revokeObjectURL(image.previewUrl);
    };
  }, [image]);

  const setField = <K extends keyof KrathongConfig>(
    key: K,
    value: KrathongConfig[K],
  ) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  const selectPreset = (preset: ClassicPreset) => {
    setConfig((prev) => ({
      ...prev,
      preset,
      ...PRESET_DEFAULTS[preset],
    }));
  };

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setError(null);
    setCompressing(true);
    try {
      const next = await compressImageToWebp(file);
      setImage((prev) => {
        if (prev?.previewUrl) URL.revokeObjectURL(prev.previewUrl);
        return next;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "อ่านไฟล์รูปไม่สำเร็จ");
    } finally {
      setCompressing(false);
    }
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (mode === "image" && !image) {
      setError("กรุณาอัปโหลดรูปภาพ หรือเลือกใช้กระทงแบบปกติ");
      return;
    }
    if (nickname.trim().length === 0) {
      setError("ใส่ชื่อก่อนปล่อยกระทง");
      return;
    }

    setSending(true);
    const result = await onRelease(
      mode === "image" && image
        ? {
            mode: "image",
            nickname: nickname.trim(),
            wish: wish.trim(),
            imageFile: image.file,
            previewUrl: image.previewUrl,
          }
        : {
            mode: "classic",
            nickname: nickname.trim(),
            wish: wish.trim(),
            config,
          },
    );
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
        className="flex max-h-[94dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl border border-white/10 bg-[#0b1726]/95 shadow-2xl sm:rounded-3xl"
      >
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-3.5">
          <div>
            <h2 className="text-base font-semibold text-amber-100">
              เลือกรูปแบบกระทง
            </h2>
            <p className="text-xs text-slate-400">
              อัปโหลดรูปภาพตัวเอง หรือเลือกกระทงแบบปกติได้
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
          <div className="grid grid-cols-2 gap-2 rounded-2xl border border-white/10 bg-black/25 p-1">
            <button
              type="button"
              onClick={() => {
                setMode("image");
                setError(null);
              }}
              className={`rounded-xl py-2 text-xs font-medium transition ${
                mode === "image"
                  ? "bg-amber-300/20 text-amber-100"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              อัปโหลดรูปภาพ
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("classic");
                setError(null);
              }}
              className={`rounded-xl py-2 text-xs font-medium transition ${
                mode === "classic"
                  ? "bg-amber-300/20 text-amber-100"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              กระทงแบบปกติ
            </button>
          </div>

          {mode === "image" ? (
            <>
              <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-white/20 bg-white/5 p-4 text-center transition hover:border-amber-300/60 hover:bg-white/10">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => void handleFile(e.target.files?.[0])}
                />
                {image ? (
                  <div className="flex flex-col items-center gap-2">
                    <PhotoKrathongFrame
                      imageUrl={image.previewUrl}
                      alt="ตัวอย่างรูปกระทง"
                      className="h-36 w-36"
                    />
                    <span className="text-xs text-slate-300">
                      {Math.round(image.bytes / 1024)} KB · {image.width}×{image.height} (คลิกเพื่อเปลี่ยนรูป)
                    </span>
                  </div>
                ) : (
                  <div className="py-5">
                    <p className="text-sm font-medium text-amber-100">
                      {compressing ? "กำลังย่อรูป…" : "เลือกรูปภาพ"}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      PNG, JPG, WebP (วางบนฐานกระทงอัตโนมัติ)
                    </p>
                  </div>
                )}
              </label>

              <div className="rounded-xl border border-amber-400/25 bg-amber-400/10 px-3.5 py-2.5 text-xs leading-relaxed text-amber-100/90">
                <strong className="font-semibold text-amber-200">คำเตือน:</strong>{" "}
                ห้ามลงรูปภาพอนาจาร โป๊เปลือย ความรุนแรง โฆษณาเว็บพนัน สแปม หรือเนื้อหาผิดกฎหมาย
                ระบบจะตรวจสอบด้วย AI ก่อนนำขึ้นแม่น้ำ
              </div>
            </>
          ) : (
            <div className="space-y-3.5 rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="flex flex-col items-center">
                <div className="h-28 w-28 overflow-hidden rounded-2xl bg-[#081528]/80 p-1">
                  <ClassicKrathongSvg config={config} />
                </div>
                <p className="mt-1 text-xs text-amber-200">
                  {CLASSIC_PRESET_LABELS[config.preset ?? "lotus-pink"]}
                </p>
              </div>

              {/* 4 Presets */}
              <div className="grid grid-cols-4 gap-2">
                {CLASSIC_PRESETS.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => selectPreset(item)}
                    className={`flex flex-col items-center gap-1 rounded-xl border p-2 transition ${
                      config.preset === item
                        ? "border-amber-300/80 bg-amber-300/15"
                        : "border-white/10 bg-black/25 hover:bg-white/10"
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`/krathongs/${item}.png`}
                      alt={CLASSIC_PRESET_LABELS[item]}
                      className="h-11 w-11 object-contain"
                    />
                    <span className="text-[11px] text-slate-200">
                      {CLASSIC_PRESET_LABELS[item]}
                    </span>
                  </button>
                ))}
              </div>

              {/* Decoration controls */}
              <div className="space-y-2.5 border-t border-white/10 pt-3">
                <div>
                  <p className="text-xs text-slate-300">ดอกไม้ประดับ</p>
                  <div className="mt-1.5 grid grid-cols-3 gap-1.5">
                    {FLOWERS.map((flower) => (
                      <button
                        key={flower}
                        type="button"
                        onClick={() => setField("flower", flower as Flower)}
                        className={`rounded-lg border py-1 text-[11px] transition ${
                          config.flower === flower
                            ? "border-amber-300/70 bg-amber-300/15 text-amber-100"
                            : "border-white/10 bg-black/25 text-slate-300 hover:bg-white/10"
                        }`}
                      >
                        {FLOWER_LABELS[flower]}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs text-slate-300">สีดอกไม้ประดับ</p>
                    <div className="mt-1.5 flex gap-1.5">
                      {FLOWER_COLORS.map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setField("flowerColor", color)}
                          aria-label={`สีดอก ${color}`}
                          style={{ backgroundColor: color }}
                          className={`h-6 w-6 rounded-full border-2 transition ${
                            config.flowerColor === color
                              ? "scale-110 border-amber-200"
                              : "border-white/20"
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  <label className="w-32 text-xs text-slate-300">
                    จำนวนดอก: <span className="text-amber-200">{config.flowers}</span>
                    <input
                      type="range"
                      min={3}
                      max={7}
                      value={config.flowers}
                      onChange={(e) => setField("flowers", Number(e.target.value))}
                      className="mt-1.5 w-full accent-amber-300"
                    />
                  </label>
                </div>

                <div className="flex items-center gap-5 pt-1 text-xs text-slate-300">
                  <label className="flex items-center gap-1.5">
                    <input
                      type="checkbox"
                      checked={config.candle}
                      onChange={(e) => setField("candle", e.target.checked)}
                      className="h-3.5 w-3.5 accent-amber-300"
                    />
                    แสงประกายเทียน
                  </label>
                </div>
              </div>
            </div>
          )}

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
            disabled={sending || compressing}
            className="rounded-full bg-gradient-to-r from-amber-300 to-orange-400 px-6 py-2 text-sm font-semibold text-[#2a1606] shadow-md transition hover:brightness-110 disabled:opacity-50"
          >
            {sending ? "กำลังตรวจสอบและปล่อย…" : "ปล่อยกระทง"}
          </button>
        </div>
      </form>
    </div>
  );
}
