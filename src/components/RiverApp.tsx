"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useState } from "react";
import ClassicKrathongSvg from "./ClassicKrathongSvg";
import KrathongForm from "./KrathongForm";
import LanternForm from "./LanternForm";
import SkyLanternSvg from "./SkyLanternSvg";
import { riverAudio } from "@/lib/krathong/audio";
import { useRiver } from "@/lib/krathong/use-river";
import { useLanterns } from "@/lib/lantern/use-lanterns";
import {
  LANTERN_COLOR_STYLES,
  RIVER_SCENES,
  RIVER_SCENE_LABELS,
  type LanternReleaseInput,
  type ReleaseInput,
  type RiverScene,
} from "@/lib/krathong/schema";

const RiverCanvas = dynamic(() => import("./RiverCanvas"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center text-sm text-slate-400">
      กำลังเปิดแม่น้ำ…
    </div>
  ),
});

type Toast = { text: string; tone: "ok" | "error" };

function timeAgo(iso: string): string {
  const minutes = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000);
  if (minutes < 1) return "เมื่อสักครู่";
  if (minutes < 60) return `${minutes} นาทีที่แล้ว`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} ชั่วโมงที่แล้ว`;
  return `${Math.floor(hours / 24)} วันที่แล้ว`;
}

export default function RiverApp() {
  const { krathongs, demo, ready, release, hide, bless } = useRiver();
  const {
    lanterns,
    release: releaseLantern,
    hide: hideLantern,
    bless: blessLantern,
  } = useLanterns();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedLanternId, setSelectedLanternId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [lanternFormOpen, setLanternFormOpen] = useState(false);
  const [welcomeOpen, setWelcomeOpen] = useState(false);
  const [scene, setScene] = useState<RiverScene>("chao-phraya");
  const [soundOn, setSoundOn] = useState(false);
  const [celebrationKey, setCelebrationKey] = useState(0);
  const [blessedIds, setBlessedIds] = useState<Set<string>>(() => new Set());
  const [blessedLanternIds, setBlessedLanternIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [toast, setToast] = useState<Toast | null>(null);
  const [reporting, setReporting] = useState(false);
  const [reportingLantern, setReportingLantern] = useState(false);

  const selected = krathongs.find((k) => k.id === selectedId) ?? null;
  const selectedLantern =
    lanterns.find((l) => l.id === selectedLanternId) ?? null;

  useEffect(() => {
    try {
      if (!sessionStorage.getItem("loykrathong-welcomed")) {
        setWelcomeOpen(true);
      }
      const saved = localStorage.getItem("loykrathong-blessed");
      if (saved) {
        setBlessedIds(new Set(JSON.parse(saved) as string[]));
      }
      const savedLanterns = localStorage.getItem("loykrathong-blessed-lanterns");
      if (savedLanterns) {
        setBlessedLanternIds(new Set(JSON.parse(savedLanterns) as string[]));
      }
    } catch {
      setWelcomeOpen(true);
    }

    return () => {
      riverAudio.stop();
    };
  }, []);

  const dismissWelcome = (openForm = false) => {
    setWelcomeOpen(false);
    try {
      sessionStorage.setItem("loykrathong-welcomed", "1");
    } catch {
      // ignore storage errors
    }
    if (openForm) setFormOpen(true);
  };

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 4200);
    return () => clearTimeout(timer);
  }, [toast]);

  const toggleSound = () => {
    if (soundOn) {
      riverAudio.stop();
      setSoundOn(false);
    } else {
      riverAudio.start();
      setSoundOn(true);
    }
  };

  const handleBless = useCallback(
    (id: string) => {
      const alreadyBlessed = blessedIds.has(id);
      const delta: 1 | -1 = alreadyBlessed ? -1 : 1;

      setBlessedIds((prev) => {
        const next = new Set(prev);
        if (alreadyBlessed) {
          next.delete(id);
        } else {
          next.add(id);
        }
        try {
          localStorage.setItem(
            "loykrathong-blessed",
            JSON.stringify(Array.from(next).slice(-100)),
          );
        } catch {
          // ignore
        }
        return next;
      });
      bless(id, delta);
    },
    [bless, blessedIds],
  );

  const handleBlessLantern = useCallback(
    (id: string) => {
      const alreadyBlessed = blessedLanternIds.has(id);
      const delta: 1 | -1 = alreadyBlessed ? -1 : 1;

      setBlessedLanternIds((prev) => {
        const next = new Set(prev);
        if (alreadyBlessed) {
          next.delete(id);
        } else {
          next.add(id);
        }
        try {
          localStorage.setItem(
            "loykrathong-blessed-lanterns",
            JSON.stringify(Array.from(next).slice(-100)),
          );
        } catch {
          // ignore
        }
        return next;
      });
      blessLantern(id, delta);
    },
    [blessLantern, blessedLanternIds],
  );

  const handleRelease = useCallback(
    async (input: ReleaseInput) => {
      const result = await release(input);
      if (result.ok) {
        setSelectedId(result.krathong.id);
        setSelectedLanternId(null);
        setCelebrationKey((k) => k + 1);
        setToast({
          text: result.demo
            ? "ลอยแล้ว — โหมดตัวอย่าง ยังไม่บันทึกลงฐานข้อมูล"
            : "ลอยกระทงสำเร็จ ขอให้สมปรารถนา",
          tone: "ok",
        });
        return { ok: true as const, demo: result.demo };
      }
      setToast({ text: result.error, tone: "error" });
      return { ok: false as const, error: result.error };
    },
    [release],
  );

  const handleReleaseLantern = useCallback(
    async (input: LanternReleaseInput) => {
      const result = await releaseLantern(input);
      if (result.ok) {
        setSelectedLanternId(result.lantern.id);
        setSelectedId(null);
        setCelebrationKey((k) => k + 1);
        setToast({
          text: result.demo
            ? "ลอยโคมแล้ว — โหมดตัวอย่าง ยังไม่บันทึกลงฐานข้อมูล"
            : "ลอยโคมสำเร็จ ขอให้สมปรารถนา",
          tone: "ok",
        });
        return { ok: true as const, demo: result.demo };
      }
      setToast({ text: result.error, tone: "error" });
      return { ok: false as const, error: result.error };
    },
    [releaseLantern],
  );

  const report = async (id: string) => {
    setReporting(true);
    if (!id.startsWith("demo-") && !id.startsWith("local-")) {
      await fetch(`/api/krathongs/${id}/report`, { method: "POST" }).catch(() => null);
    }
    hide(id);
    setSelectedId(null);
    setReporting(false);
    setToast({ text: "ขอบคุณที่รายงาน กระทงถูกนำออกจากแม่น้ำ", tone: "ok" });
  };

  const reportLantern = async (id: string) => {
    setReportingLantern(true);
    if (!id.startsWith("demo-") && !id.startsWith("local-")) {
      await fetch(`/api/lanterns/${id}/report`, { method: "POST" }).catch(
        () => null,
      );
    }
    hideLantern(id);
    setSelectedLanternId(null);
    setReportingLantern(false);
    setToast({ text: "ขอบคุณที่รายงาน โคมถูกนำออกจากท้องฟ้า", tone: "ok" });
  };

  return (
    <main className="relative h-dvh w-full overflow-hidden bg-[#071528]">
      <div className="absolute inset-0 z-0">
        <RiverCanvas
          krathongs={krathongs}
          lanterns={lanterns}
          selectedId={selectedId}
          selectedLanternId={selectedLanternId}
          scene={scene}
          celebrationKey={celebrationKey}
          blessedIds={blessedIds}
          blessedLanternIds={blessedLanternIds}
          onSelect={(id) => {
            setSelectedId(id);
            setSelectedLanternId(null);
          }}
          onSelectLantern={(id) => {
            setSelectedLanternId(id);
            setSelectedId(null);
          }}
          onBless={handleBless}
          onBlessLantern={handleBlessLantern}
        />
      </div>

      <header className="pointer-events-none absolute inset-x-0 top-0 z-20 flex flex-wrap items-start justify-between gap-3 p-4 sm:p-5">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-amber-100 drop-shadow-lg sm:text-3xl">
            ลอยกระทงออนไลน์
          </h1>
          <p className="mt-1 max-w-xs text-sm text-slate-300/80">
            ปล่อยกระทงลงแม่น้ำ หรือลอยโคมคำอธิษฐานขึ้นฟ้า
          </p>
        </div>

        <div className="pointer-events-auto flex flex-wrap items-center justify-end gap-2 text-xs">
          {/* Scene switcher */}
          <div className="flex items-center gap-1 rounded-full border border-white/10 bg-black/35 p-1 backdrop-blur">
            {RIVER_SCENES.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setScene(item)}
                className={`rounded-full px-2.5 py-1 text-[11px] transition ${
                  scene === item
                    ? "bg-amber-300/25 text-amber-100"
                    : "text-slate-300 hover:text-white"
                }`}
              >
                {RIVER_SCENE_LABELS[item]}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={toggleSound}
            aria-label={soundOn ? "ปิดเสียงบรรยากาศ" : "เปิดเสียงบรรยากาศ"}
            className={`rounded-full border px-3 py-1 backdrop-blur transition ${
              soundOn
                ? "border-amber-300/45 bg-amber-300/20 text-amber-100"
                : "border-white/10 bg-black/35 text-slate-300 hover:bg-black/55"
            }`}
          >
            {soundOn ? "🔊 เสียงเปิด" : "🔇 เสียงปิด"}
          </button>

          <span className="whitespace-nowrap rounded-full border border-white/10 bg-black/35 px-3 py-1 text-slate-300 backdrop-blur">
            {krathongs.length} กระทง · {lanterns.length} โคม
          </span>

          {demo && (
            <span className="rounded-full border border-amber-300/30 bg-amber-300/10 px-3 py-1 text-amber-200/90">
              โหมดตัวอย่าง
            </span>
          )}
        </div>
      </header>

      {!ready && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <span className="rounded-full bg-black/40 px-4 py-2 text-sm text-slate-300 backdrop-blur">
            กำลังโหลดกระทง…
          </span>
        </div>
      )}

      {ready && krathongs.length === 0 && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center px-4">
          <span className="rounded-full border border-white/10 bg-black/35 px-4 py-2 text-sm text-slate-300 backdrop-blur">
            ยังไม่มีกระทงในแม่น้ำ — กดปล่อยกระทงเป็นคนแรกได้เลย
          </span>
        </div>
      )}

      {selected && (
        <aside className="absolute right-4 top-24 z-20 w-[min(20rem,calc(100vw-2rem))] rounded-2xl border border-white/10 bg-[#0b1726]/90 p-4 shadow-xl backdrop-blur">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs text-slate-400">กระทงของ</p>
              <p className="text-lg font-semibold text-amber-100">{selected.nickname}</p>
            </div>
            <button
              type="button"
              onClick={() => setSelectedId(null)}
              className="rounded-full p-1.5 text-slate-400 transition hover:bg-white/10 hover:text-white"
              aria-label="ปิด"
            >
              ✕
            </button>
          </div>
          {selected.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={selected.imageUrl}
              alt={`กระทงของ ${selected.nickname}`}
              className="mt-3 max-h-64 w-full rounded-xl border border-white/10 bg-[#081528] object-contain"
            />
          ) : selected.config ? (
            <div className="mt-3 flex h-40 w-full items-center justify-center rounded-xl border border-white/10 bg-[#081528]">
              <ClassicKrathongSvg config={selected.config} className="h-32 w-32" />
            </div>
          ) : null}
          {selected.wish ? (
            <p className="mt-3 text-sm leading-relaxed text-slate-200">“{selected.wish}”</p>
          ) : (
            <p className="mt-3 text-sm italic text-slate-500">ไม่มีคำอธิษฐาน</p>
          )}
          <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
            <span>{timeAgo(selected.createdAt)}</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleBless(selected.id)}
                className={`rounded-full border px-2.5 py-1 transition ${
                  blessedIds.has(selected.id)
                    ? "border-rose-400/40 bg-rose-500/20 text-rose-200 hover:bg-rose-500/30"
                    : "border-white/15 bg-white/5 text-slate-300 hover:border-rose-300/40 hover:text-rose-200"
                }`}
              >
                {blessedIds.has(selected.id) ? "♥ ส่งใจแล้ว" : "♥ ส่งใจ"} ({selected.blessings})
              </button>
              <button
                type="button"
                disabled={reporting}
                onClick={() => void report(selected.id)}
                className="rounded-full px-2 py-1 text-slate-400 transition hover:bg-red-500/10 hover:text-red-300 disabled:opacity-50"
              >
                รายงาน
              </button>
            </div>
          </div>
        </aside>
      )}

      {selectedLantern && (
        <aside className="absolute right-4 top-24 z-20 w-[min(20rem,calc(100vw-2rem))] rounded-2xl border border-white/10 bg-[#0b1726]/90 p-4 shadow-xl backdrop-blur">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs text-slate-400">โคมของ</p>
              <p className="text-lg font-semibold text-amber-100">
                {selectedLantern.nickname}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSelectedLanternId(null)}
              className="rounded-full p-1.5 text-slate-400 transition hover:bg-white/10 hover:text-white"
              aria-label="ปิด"
            >
              ✕
            </button>
          </div>

          <div className="mt-3 flex h-40 w-full flex-col items-center justify-center rounded-xl border border-white/10 bg-[#081528]">
            <div className="relative">
              <div
                className={`absolute -inset-6 rounded-full blur-xl ${LANTERN_COLOR_STYLES[selectedLantern.color].glow}`}
              />
              <SkyLanternSvg
                color={selectedLantern.color}
                className="relative h-24 w-20 drop-shadow-[0_0_22px_rgba(251,191,36,0.55)]"
              />
            </div>
            <p className="mt-2 text-[11px] text-slate-500">โคมลอยคำอธิษฐาน</p>
          </div>

          {selectedLantern.wish ? (
            <p className="mt-3 text-sm leading-relaxed text-slate-200">
              “{selectedLantern.wish}”
            </p>
          ) : (
            <p className="mt-3 text-sm italic text-slate-500">ไม่มีคำอธิษฐาน</p>
          )}

          <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
            <span>{timeAgo(selectedLantern.createdAt)}</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleBlessLantern(selectedLantern.id)}
                className={`rounded-full border px-2.5 py-1 transition ${
                  blessedLanternIds.has(selectedLantern.id)
                    ? "border-rose-400/40 bg-rose-500/20 text-rose-200 hover:bg-rose-500/30"
                    : "border-white/15 bg-white/5 text-slate-300 hover:border-rose-300/40 hover:text-rose-200"
                }`}
              >
                {blessedLanternIds.has(selectedLantern.id)
                  ? "♥ ส่งใจแล้ว"
                  : "♥ ส่งใจ"}{" "}
                ({selectedLantern.blessings})
              </button>
              <button
                type="button"
                disabled={reportingLantern}
                onClick={() => void reportLantern(selectedLantern.id)}
                className="rounded-full px-2 py-1 text-slate-400 transition hover:bg-red-500/10 hover:text-red-300 disabled:opacity-50"
              >
                รายงาน
              </button>
            </div>
          </div>
        </aside>
      )}

      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex flex-col items-center gap-2.5 pb-4">
        <p className="hidden text-xs text-slate-300/80 sm:block">
          ลากซ้าย-ขวาเพื่อเลื่อน · สกรอลล์เพื่อซูม · กด ♥ ส่งใจ · กดโคมเพื่ออ่านคำอธิษฐาน
        </p>
        <div className="pointer-events-auto flex items-center gap-2">
          <button
            type="button"
            onClick={() => setFormOpen(true)}
            className="rounded-full bg-gradient-to-r from-amber-300 to-orange-400 px-7 py-3.5 text-base font-semibold text-[#2a1606] shadow-lg shadow-orange-500/25 transition hover:brightness-110 active:scale-95"
          >
            ปล่อยกระทง
          </button>
          <button
            type="button"
            onClick={() => setLanternFormOpen(true)}
            className="rounded-full border border-amber-200/40 bg-black/45 px-6 py-3.5 text-base font-semibold text-amber-100 shadow-lg backdrop-blur transition hover:bg-black/65 active:scale-95"
          >
            ลอยโคม
          </button>
        </div>
        <p className="text-[11px] text-slate-400/75">
          Made by <span className="font-medium text-amber-200/85">khan.nn03</span>
        </p>
      </div>

      {welcomeOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-amber-200/20 bg-[#0b1726]/95 p-6 text-center shadow-2xl">
            <p className="text-xs font-medium tracking-wider text-amber-300/90">
              สวัสดีคืนวันเพ็ญ
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-amber-100">
              ยินดีต้อนรับสู่ลอยกระทงออนไลน์
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-300">
              ร่วมลอยกระทงด้วยรูปภาพของคุณเอง หรือเลือกกระทงแบบปกติ เขียนคำอธิษฐาน
              แล้วปล่อยลอยลงแม่น้ำใต้แสงจันทร์ หรือลอยโคมคำอธิษฐานขึ้นสู่ท้องฟ้า
            </p>
            <p className="mt-2 rounded-xl border border-amber-400/20 bg-amber-400/10 px-3 py-2 text-xs text-amber-100/90">
              คำเตือน: ห้ามลงรูปอนาจาร ความรุนแรง โฆษณาเว็บพนัน หรือเนื้อหาผิดกฎหมาย
            </p>
            <div className="mt-6 flex flex-col gap-2.5 sm:flex-row sm:justify-center">
              <button
                type="button"
                onClick={() => dismissWelcome(true)}
                className="rounded-full bg-gradient-to-r from-amber-300 to-orange-400 px-6 py-2.5 text-sm font-semibold text-[#2a1606] shadow-md transition hover:brightness-110"
              >
                อัปโหลดรูปปล่อยกระทง
              </button>
              <button
                type="button"
                onClick={() => dismissWelcome(false)}
                className="rounded-full border border-white/15 bg-white/5 px-6 py-2.5 text-sm text-slate-200 transition hover:bg-white/10"
              >
                เข้าชมแม่น้ำ
              </button>
            </div>
          </div>
        </div>
      )}

      {formOpen && (
        <KrathongForm onRelease={handleRelease} onClose={() => setFormOpen(false)} />
      )}

      {lanternFormOpen && (
        <LanternForm
          onRelease={handleReleaseLantern}
          onClose={() => setLanternFormOpen(false)}
        />
      )}

      {toast && (
        <div
          className={`fixed left-1/2 top-6 z-40 -translate-x-1/2 rounded-full px-4 py-2 text-sm shadow-lg backdrop-blur ${
            toast.tone === "ok"
              ? "bg-emerald-500/15 text-emerald-200"
              : "bg-red-500/15 text-red-200"
          }`}
        >
          {toast.text}
        </div>
      )}
    </main>
  );
}
