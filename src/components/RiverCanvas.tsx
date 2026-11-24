"use client";

import { memo, useCallback, useMemo, useRef, useState } from "react";
import ClassicKrathongSvg, { PhotoKrathongFrame } from "./ClassicKrathongSvg";
import HorizonBackdrop from "./HorizonBackdrop";
import PixiRiverBackground from "./PixiRiverBackground";
import SkyLanternSvg from "./SkyLanternSvg";
import {
  LANTERN_COLOR_STYLES,
  RIVER,
  type Krathong,
  type Lantern,
  type RiverScene,
} from "@/lib/krathong/schema";

const STARS = [
  { left: "8%", top: "7%", size: 2, delay: "0s" },
  { left: "16%", top: "16%", size: 1.5, delay: "1.2s" },
  { left: "24%", top: "5%", size: 2, delay: "2.4s" },
  { left: "34%", top: "13%", size: 1.5, delay: "0.7s" },
  { left: "44%", top: "8%", size: 2.5, delay: "1.9s" },
  { left: "53%", top: "18%", size: 1.5, delay: "2.8s" },
  { left: "62%", top: "6%", size: 2, delay: "0.4s" },
  { left: "71%", top: "21%", size: 1.5, delay: "1.5s" },
  { left: "89%", top: "9%", size: 2, delay: "2.1s" },
  { left: "93%", top: "22%", size: 1.5, delay: "0.9s" },
];

const SKY_LANTERNS = [
  { left: "12%", top: "22%", scale: 0.72, duration: "13s", delay: "0s" },
  { left: "25%", top: "14%", scale: 0.56, duration: "16s", delay: "-4s" },
  { left: "38%", top: "24%", scale: 0.85, duration: "14s", delay: "-2s" },
  { left: "54%", top: "16%", scale: 0.62, duration: "15s", delay: "-7s" },
  { left: "67%", top: "23%", scale: 0.78, duration: "12s", delay: "-5s" },
  { left: "75%", top: "12%", scale: 0.5, duration: "17s", delay: "-9s" },
  { left: "18%", top: "9%", scale: 0.52, duration: "15s", delay: "-3s" },
  { left: "46%", top: "11%", scale: 0.66, duration: "13.5s", delay: "-6s" },
  { left: "7%", top: "15%", scale: 0.6, duration: "14.5s", delay: "-1s" },
  { left: "31%", top: "19%", scale: 0.48, duration: "18s", delay: "-8s" },
  { left: "42%", top: "7%", scale: 0.44, duration: "19s", delay: "-11s" },
  { left: "59%", top: "26%", scale: 0.82, duration: "12.5s", delay: "-3.5s" },
  { left: "63%", top: "10%", scale: 0.54, duration: "16.5s", delay: "-5.5s" },
  { left: "72%", top: "18%", scale: 0.68, duration: "14s", delay: "-2.5s" },
  { left: "81%", top: "24%", scale: 0.74, duration: "13s", delay: "-6.5s" },
  { left: "88%", top: "16%", scale: 0.58, duration: "15.5s", delay: "-4.5s" },
  { left: "94%", top: "21%", scale: 0.64, duration: "14s", delay: "-7.5s" },
  { left: "22%", top: "27%", scale: 0.76, duration: "13s", delay: "-9.5s" },
  { left: "50%", top: "21%", scale: 0.5, duration: "17.5s", delay: "-1.5s" },
  { left: "15%", top: "18%", scale: 0.46, duration: "16s", delay: "-10s" },
];

const SCENE_THEME: Record<
  RiverScene,
  { sky: string; water: string; horizonGlow: string }
> = {
  "chao-phraya": {
    sky: "from-[#07061f] via-[#17184b] to-[#2a2768]",
    water: "from-[#0d2c59] via-[#0a234a] to-[#05122b]",
    horizonGlow: "from-amber-500/15 via-pink-500/10 to-transparent",
  },
  "yi-peng": {
    sky: "from-[#17091e] via-[#34163b] to-[#572146]",
    water: "from-[#281b47] via-[#1c163a] to-[#0b0d24]",
    horizonGlow: "from-orange-400/25 via-amber-500/15 to-transparent",
  },
  "moonlight-lake": {
    sky: "from-[#03121c] via-[#09293d] to-[#11425a]",
    water: "from-[#09334a] via-[#072638] to-[#031420]",
    horizonGlow: "from-emerald-400/15 via-cyan-400/10 to-transparent",
  },
};

const MIN_ZOOM = 0.65;
const MAX_ZOOM = 1.85;

function clampPan(value: number, maxPan: number) {
  return Math.max(-maxPan, Math.min(maxPan, value));
}

function clampZoom(value: number) {
  return Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, Number(value.toFixed(3))));
}

function layoutKrathongs(krathongs: Krathong[], spreadX: number): PositionedKrathong[] {
  const items = krathongs.map((k, index) => {
    const offsetX = (k.x / RIVER.halfWidth) * spreadX;
    const depthNorm = Math.min(
      1,
      Math.max(0, (k.z - RIVER.minZ) / (RIVER.maxZ - RIVER.minZ)),
    );
    const topPct = 39 + depthNorm * 43;
    const scale = 0.74 + depthNorm * 0.34;
    const durationSec = 14 + (index % 7) * 2.5;
    const delaySec = -((index * 1.7) % 12);
    return { k, offsetX, topPct, scale, durationSec, delaySec };
  });

  // Gentle 2D repulsion so dense clusters spread out without overlapping wishes.
  const minDx = 175;
  const minDy = 13; // % of viewport height
  for (let pass = 0; pass < 16; pass += 1) {
    for (let i = 0; i < items.length; i += 1) {
      for (let j = i + 1; j < items.length; j += 1) {
        const a = items[i];
        const b = items[j];
        const dx = b.offsetX - a.offsetX;
        const dy = b.topPct - a.topPct;
        const nx = dx / minDx;
        const ny = dy / minDy;
        const distSq = nx * nx + ny * ny;
        if (distSq < 1) {
          const dist = Math.sqrt(distSq) || 0.01;
          const push = (1 - dist) * 0.5;
          const ux = (dx === 0 && dy === 0 ? (i % 2 === 0 ? 1 : -1) : nx / dist) * push;
          const uy = (dy === 0 ? 0.3 : ny / dist) * push;
          a.offsetX = Math.max(-spreadX, Math.min(spreadX, a.offsetX - ux * minDx));
          b.offsetX = Math.max(-spreadX, Math.min(spreadX, b.offsetX + ux * minDx));
          a.topPct = Math.max(39, Math.min(82, a.topPct - uy * minDy));
          b.topPct = Math.max(39, Math.min(82, b.topPct + uy * minDy));
        }
      }
    }
  }

  return items;
}

function layoutLanterns(lanterns: Lantern[], spreadX: number): PositionedLantern[] {
  const items = lanterns.map((l, index) => {
    const offsetX = l.x * spreadX;
    const topPct = 36 + l.y * 50;
    const scale = 0.82 + l.y * 0.22;
    const durationSec = 9 + (index % 6) * 1.6;
    const delaySec = -((index * 2.3) % 10);
    return { l, offsetX, topPct, scale, durationSec, delaySec };
  });

  const minDx = 125; // px horizontal clearance
  const minDy = 24; // % of sky height
  for (let pass = 0; pass < 16; pass += 1) {
    for (let i = 0; i < items.length; i += 1) {
      for (let j = i + 1; j < items.length; j += 1) {
        const a = items[i];
        const b = items[j];
        const dx = b.offsetX - a.offsetX;
        const dy = b.topPct - a.topPct;
        const nx = dx / minDx;
        const ny = dy / minDy;
        const distSq = nx * nx + ny * ny;
        if (distSq < 1) {
          const dist = Math.sqrt(distSq) || 0.01;
          const push = (1 - dist) * 0.5;
          const ux = (dx === 0 && dy === 0 ? (i % 2 === 0 ? 1 : -1) : nx / dist) * push;
          const uy = (dy === 0 ? 0.3 : ny / dist) * push;
          a.offsetX = Math.max(-spreadX, Math.min(spreadX, a.offsetX - ux * minDx));
          b.offsetX = Math.max(-spreadX, Math.min(spreadX, b.offsetX + ux * minDx));
          a.topPct = Math.max(32, Math.min(86, a.topPct - uy * minDy));
          b.topPct = Math.max(32, Math.min(86, b.topPct + uy * minDy));
        }
      }
    }
  }

  return items;
}

type PositionedKrathong = {
  k: Krathong;
  offsetX: number;
  topPct: number;
  scale: number;
  durationSec: number;
  delaySec: number;
};

type PositionedLantern = {
  l: Lantern;
  offsetX: number;
  topPct: number;
  scale: number;
  durationSec: number;
  delaySec: number;
};

const KrathongItem = memo(function KrathongItem({
  item,
  isSelected,
  isBlessed,
  onSelect,
  onBless,
  wasDragged,
}: {
  item: PositionedKrathong;
  isSelected: boolean;
  isBlessed: boolean;
  onSelect: (id: string) => void;
  onBless: (id: string) => void;
  wasDragged: () => boolean;
}) {
  const { k, offsetX, topPct, scale, durationSec, delaySec } = item;
  return (
    <div
      style={{
        left: `calc(50% + ${offsetX}px)`,
        top: `${topPct}%`,
        transform: `translate(-50%, -50%) scale(${isSelected ? scale * 1.14 : scale})`,
        contain: "layout style",
      }}
      className={`group absolute flex flex-col items-center transition-transform duration-300 ${
        isSelected ? "z-20" : "z-10 hover:z-20"
      }`}
    >
      <div
        style={{
          animation: `float-drift ${durationSec}s ease-in-out ${delaySec}s infinite`,
          willChange: "transform",
        }}
        className="flex flex-col items-center"
      >
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (!wasDragged()) onSelect(k.id);
          }}
          className="relative flex flex-col items-center focus:outline-none"
        >
          <span
            className="pointer-events-none absolute top-2 h-20 w-20 rounded-full opacity-75 transition group-hover:opacity-100"
            style={{
              background:
                "radial-gradient(circle, rgba(252,211,77,0.28) 0%, rgba(252,211,77,0) 70%)",
            }}
          />

          {k.imageUrl ? (
            <PhotoKrathongFrame
              imageUrl={k.imageUrl}
              alt={`กระทงของ ${k.nickname}`}
              className={`h-24 w-24 transition-transform sm:h-28 sm:w-28 ${
                isSelected ? "scale-105" : "group-hover:scale-105"
              }`}
            />
          ) : k.config ? (
            <div
              className={`relative h-24 w-24 transition-transform sm:h-28 sm:w-28 ${
                isSelected ? "scale-105" : "group-hover:scale-105"
              }`}
            >
              <ClassicKrathongSvg config={k.config} />
            </div>
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-amber-200/45 bg-emerald-950/80 text-xs text-amber-200 shadow-lg sm:h-20 sm:w-20">
              กระทง
            </div>
          )}
        </button>

        <div className="mt-0.5 flex items-center gap-1">
          <span className="max-w-[96px] truncate rounded-full border border-amber-200/20 bg-[#071226]/90 px-2.5 py-0.5 text-[11px] font-medium text-amber-100">
            {k.nickname}
          </span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (!wasDragged()) onBless(k.id);
            }}
            aria-label={isBlessed ? "ยกเลิกส่งใจ" : "ส่งใจอวยพร"}
            className={`rounded-full border px-2 py-0.5 text-[10px] transition ${
              isBlessed
                ? "border-rose-400/50 bg-rose-950/90 text-rose-200"
                : "border-white/15 bg-[#071226]/90 text-slate-200 hover:border-rose-300/50 hover:text-rose-200"
            }`}
          >
            ♥ {k.blessings}
          </button>
        </div>

        {k.wish && (
          <span className="mt-1 max-w-[155px] line-clamp-2 rounded-xl border border-amber-200/15 bg-[#0c1733]/92 px-2.5 py-1 text-center text-[11px] leading-snug text-amber-50/95 shadow-md">
            “{k.wish}”
          </span>
        )}
      </div>
    </div>
  );
});

const LanternItem = memo(function LanternItem({
  item,
  isSelected,
  isBlessed,
  onSelect,
  wasDragged,
}: {
  item: PositionedLantern;
  isSelected: boolean;
  isBlessed: boolean;
  onSelect: (id: string) => void;
  wasDragged: () => boolean;
}) {
  const { l, offsetX, topPct, scale, durationSec, delaySec } = item;
  const lanternStyle = LANTERN_COLOR_STYLES[l.color];
  return (
    <div
      style={{
        left: `calc(50% + ${offsetX}px)`,
        top: `${topPct}%`,
        transform: `translate(-50%, -50%) scale(${isSelected ? scale * 1.22 : scale})`,
        contain: "layout style",
      }}
      className={`group absolute ${isSelected ? "z-20" : "z-10 hover:z-20"}`}
    >
      <div
        style={{
          animation: `lantern-drift ${durationSec}s ease-in-out ${delaySec}s infinite`,
          willChange: "transform",
        }}
      >
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (!wasDragged()) onSelect(l.id);
          }}
          className="pointer-events-auto relative flex flex-col items-center focus:outline-none"
          aria-label={`โคมของ ${l.nickname}`}
        >
          <SkyLanternSvg
            color={l.color}
            className="relative h-12 w-10 transition-transform group-hover:scale-110"
          />
          <span
            className={`mt-1 max-w-[96px] truncate rounded-full border bg-[#071226]/90 px-2 py-0.5 text-[10px] font-medium text-amber-50 ${lanternStyle.border}`}
          >
            {l.nickname}
          </span>
          <span
            className={`mt-0.5 rounded-full border px-1.5 text-[9px] ${
              isBlessed
                ? "border-rose-400/50 bg-rose-950/90 text-rose-200"
                : "border-white/10 bg-[#071226]/90 text-slate-300"
            }`}
          >
            ♥ {l.blessings}
          </span>
          {l.wish && (
            <span className="pointer-events-none absolute top-full mt-1 hidden w-max max-w-[200px] rounded-xl border border-amber-200/20 bg-[#0e1938]/95 px-3 py-1.5 text-center text-[11px] leading-snug text-amber-50/95 shadow-md group-hover:block">
              “{l.wish}”
            </span>
          )}
        </button>
      </div>
    </div>
  );
});

export default function RiverCanvas({
  krathongs,
  lanterns,
  selectedId,
  selectedLanternId,
  scene,
  celebrationKey,
  blessedIds,
  blessedLanternIds,
  onSelect,
  onSelectLantern,
  onBless,
  onBlessLantern,
}: {
  krathongs: Krathong[];
  lanterns: Lantern[];
  selectedId: string | null;
  selectedLanternId: string | null;
  scene: RiverScene;
  celebrationKey: number;
  blessedIds: Set<string>;
  blessedLanternIds: Set<string>;
  onSelect: (id: string | null) => void;
  onSelectLantern: (id: string | null) => void;
  onBless: (id: string) => void;
  onBlessLantern: (id: string) => void;
}) {
  const [panX, setPanX] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [dragging, setDragging] = useState(false);
  const dragRef = useRef({ active: false, startX: 0, startPan: 0, moved: false });
  const pointersRef = useRef(new Map<number, { x: number; y: number }>());
  const pinchRef = useRef<{ dist: number; zoom: number } | null>(null);

  const spreadX = Math.max(1200, krathongs.length * 46);
  const skySpreadX = Math.max(760, lanterns.length * 85);
  const maxPan = Math.max(spreadX, skySpreadX);

  const positioned = useMemo(
    () => layoutKrathongs(krathongs, spreadX),
    [krathongs, spreadX],
  );

  const positionedLanterns = useMemo(
    () => layoutLanterns(lanterns, skySpreadX),
    [lanterns, skySpreadX],
  );

  const wasDragged = useCallback(() => dragRef.current.moved, []);

  const theme = SCENE_THEME[scene];
  const visibleLanterns =
    scene === "yi-peng"
      ? SKY_LANTERNS
      : scene === "chao-phraya"
        ? SKY_LANTERNS.slice(0, 5)
        : SKY_LANTERNS.slice(0, 2);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointersRef.current.size === 2) {
      const pts = Array.from(pointersRef.current.values());
      pinchRef.current = {
        dist: Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y),
        zoom,
      };
      dragRef.current.active = false;
      setDragging(true);
      return;
    }

    if (e.button !== 0) return;
    dragRef.current = {
      active: true,
      startX: e.clientX,
      startPan: panX,
      moved: false,
    };
    setDragging(true);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (pointersRef.current.has(e.pointerId)) {
      pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    }

    if (pointersRef.current.size === 2 && pinchRef.current) {
      const pts = Array.from(pointersRef.current.values());
      const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      if (pinchRef.current.dist > 0) {
        dragRef.current.moved = true;
        setZoom(clampZoom(pinchRef.current.zoom * (dist / pinchRef.current.dist)));
      }
      return;
    }

    if (!dragRef.current.active) return;
    const dx = e.clientX - dragRef.current.startX;
    if (Math.abs(dx) > 6) dragRef.current.moved = true;
    setPanX(clampPan(dragRef.current.startPan + dx, maxPan));
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    pointersRef.current.delete(e.pointerId);
    if (pointersRef.current.size < 2) {
      pinchRef.current = null;
    }
    dragRef.current.active = false;
    setDragging(false);
  };

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
      setPanX((prev) => clampPan(prev - e.deltaX, maxPan));
    } else if (e.deltaY !== 0) {
      setZoom((prev) => clampZoom(prev - e.deltaY * 0.0012));
    }
  };

  return (
    <div
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onWheel={handleWheel}
      onClick={() => {
        if (!dragRef.current.moved) onSelect(null);
      }}
      className="relative h-full w-full cursor-grab overflow-hidden bg-[#06091e] select-none touch-none active:cursor-grabbing"
    >
      {/* Night sky */}
      <div
        className={`pointer-events-none absolute inset-x-0 top-0 h-[35%] bg-gradient-to-b transition-colors duration-700 ${theme.sky}`}
      >
        <div
          className={`absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t ${theme.horizonGlow}`}
        />

        {STARS.map((star, idx) => (
          <span
            key={idx}
            style={{
              left: star.left,
              top: star.top,
              width: star.size,
              height: star.size,
              animation: `star-twinkle 4s ease-in-out ${star.delay} infinite`,
            }}
            className="absolute rounded-full bg-amber-50/90 shadow-[0_0_8px_rgba(254,243,199,0.85)]"
          />
        ))}

        {/* Floating warm sky lanterns */}
        {visibleLanterns.map((lantern, idx) => (
          <div
            key={idx}
            style={{
              left: lantern.left,
              top: lantern.top,
              transform: `scale(${lantern.scale})`,
            }}
            className="absolute"
          >
            <div
              style={{
                animation: `lantern-rise ${lantern.duration} ease-in-out ${lantern.delay} infinite`,
                willChange: "transform",
              }}
            >
              <SkyLanternSvg color="amber" className="relative h-9 w-7" />
            </div>
          </div>
        ))}

        {/* Full Moon */}
        <div className="absolute right-[13%] top-10 sm:right-[15%] sm:top-12">
          <div className="absolute -inset-20 rounded-full bg-amber-200/15 blur-3xl sm:-inset-28" />
          <div className="absolute -inset-8 rounded-full bg-amber-100/25 blur-xl sm:-inset-12" />

          <div className="relative h-20 w-20 overflow-hidden rounded-full bg-[radial-gradient(circle_at_35%_32%,#fffdf5_0%,#fef3c7_48%,#fde68a_78%,#f59e0b_100%)] shadow-[0_0_55px_16px_rgba(253,230,138,0.48)] sm:h-28 sm:w-28">
            <div className="absolute left-[22%] top-[24%] h-6 w-7 rounded-full bg-amber-900/10 blur-[2px] sm:h-8 sm:w-9" />
            <div className="absolute left-[54%] top-[36%] h-5 w-6 rounded-full bg-amber-900/10 blur-[2px] sm:h-7 sm:w-8" />
            <div className="absolute left-[32%] top-[58%] h-4 w-8 rounded-full bg-amber-900/10 blur-[2px] sm:h-6 sm:w-10" />
            <div className="absolute right-[18%] bottom-[20%] h-3 w-4 rounded-full bg-amber-900/10 blur-[1.5px]" />
            <div className="absolute inset-0 rounded-full ring-1 ring-inset ring-white/50" />
          </div>
        </div>

        {/* Scene-specific skyline: smooth parallax on both desktop & mobile without edge cutoff */}
        <div
          style={{
            transform: `translate3d(calc(-50% + ${clampPan(panX * 0.22, 360)}px), 0, 0)`,
            transition: dragging
              ? "none"
              : "transform 280ms cubic-bezier(0.22, 1, 0.36, 1)",
          }}
          className="horizon-parallax pointer-events-none absolute bottom-0 left-1/2 h-full w-[max(145vw,2200px)]"
        >
          <HorizonBackdrop scene={scene} />
        </div>

        <div className="absolute inset-x-0 bottom-0 h-3 bg-gradient-to-t from-[#0d2a56]/90 to-transparent" />
      </div>

      {/* Luminous animated river surface powered by PixiJS */}
      <div
        className={`pointer-events-none absolute inset-x-0 bottom-0 top-[35%] overflow-hidden bg-gradient-to-b transition-colors duration-700 ${theme.water}`}
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_15%,rgba(167,139,250,0.16),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_85%_10%,rgba(251,191,36,0.16),transparent_48%)]" />
      </div>
      <PixiRiverBackground scene={scene} celebrationKey={celebrationKey} />

      {/* Pannable & zoomable krathong layer */}
      <div
        style={{
          transformOrigin: "50% 62%",
          transform: `translate3d(${panX}px, 0, 0) scale(${zoom})`,
          transition: dragging ? "none" : "transform 280ms cubic-bezier(0.22, 1, 0.36, 1)",
        }}
        className="relative z-10 h-full w-full"
      >
        {positioned.map((item) => (
          <KrathongItem
            key={item.k.id}
            item={item}
            isSelected={item.k.id === selectedId}
            isBlessed={blessedIds.has(item.k.id)}
            onSelect={onSelect}
            onBless={onBless}
            wasDragged={wasDragged}
          />
        ))}
      </div>

      {/* Released sky lanterns — pannable & zoomable like the river */}
      <div
        style={{
          transformOrigin: "50% 60%",
          transform: `translate3d(${panX * 0.75}px, 0, 0) scale(${zoom})`,
          transition: dragging ? "none" : "transform 280ms cubic-bezier(0.22, 1, 0.36, 1)",
        }}
        className="pointer-events-none absolute inset-x-0 top-0 z-20 h-[35%]"
      >
        {positionedLanterns.map((item) => (
          <LanternItem
            key={item.l.id}
            item={item}
            isSelected={item.l.id === selectedLanternId}
            isBlessed={blessedLanternIds.has(item.l.id)}
            onSelect={onSelectLantern}
            wasDragged={wasDragged}
          />
        ))}
      </div>

      {/* Left / Right pan controls */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setPanX((prev) => clampPan(prev + 340, maxPan));
        }}
        disabled={panX >= maxPan}
        aria-label="เลื่อนดูฝั่งซ้าย"
        className="absolute left-2 top-1/2 z-20 -translate-y-1/2 rounded-full border border-amber-200/20 bg-black/35 px-2.5 py-1.5 text-base text-amber-100 backdrop-blur transition hover:bg-black/55 disabled:opacity-25 sm:left-3 sm:px-3 sm:py-2 sm:text-lg"
      >
        ‹
      </button>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setPanX((prev) => clampPan(prev - 340, maxPan));
        }}
        disabled={panX <= -maxPan}
        aria-label="เลื่อนดูฝั่งขวา"
        className="absolute right-2 top-1/2 z-20 -translate-y-1/2 rounded-full border border-amber-200/20 bg-black/35 px-2.5 py-1.5 text-base text-amber-100 backdrop-blur transition hover:bg-black/55 disabled:opacity-25 sm:right-3 sm:px-3 sm:py-2 sm:text-lg"
      >
        ›
      </button>

      {/* Zoom controls */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="absolute bottom-24 right-3 z-20 flex items-center gap-0.5 rounded-full border border-amber-200/20 bg-black/45 p-1 text-xs text-amber-100 backdrop-blur sm:bottom-6 sm:right-4 sm:gap-1"
      >
        <button
          type="button"
          onClick={() => setZoom((prev) => clampZoom(prev - 0.2))}
          disabled={zoom <= MIN_ZOOM}
          aria-label="ซูมออก"
          className="rounded-full px-2.5 py-1 transition hover:bg-white/10 disabled:opacity-30"
        >
          −
        </button>
        <button
          type="button"
          onClick={() => {
            setZoom(1);
            setPanX(0);
          }}
          aria-label="รีเซ็ตมุมมอง"
          className="min-w-[3.2rem] rounded-full px-2 py-1 text-center text-[11px] text-slate-200 transition hover:bg-white/10"
        >
          {Math.round(zoom * 100)}%
        </button>
        <button
          type="button"
          onClick={() => setZoom((prev) => clampZoom(prev + 0.2))}
          disabled={zoom >= MAX_ZOOM}
          aria-label="ซูมเข้า"
          className="rounded-full px-2.5 py-1 transition hover:bg-white/10 disabled:opacity-30"
        >
          +
        </button>
      </div>

      <style jsx>{`
        @keyframes float-drift {
          0%,
          100% {
            transform: translate3d(-6px, 0px, 0);
          }
          50% {
            transform: translate3d(6px, -7px, 0);
          }
        }
        @keyframes star-twinkle {
          0%,
          100% {
            opacity: 0.35;
            transform: scale(0.9);
          }
          50% {
            opacity: 1;
            transform: scale(1.15);
          }
        }
        @keyframes lantern-rise {
          0%,
          100% {
            transform: translate3d(-4px, 4px, 0);
          }
          50% {
            transform: translate3d(5px, -10px, 0);
          }
        }
        @keyframes lantern-drift {
          0%,
          100% {
            transform: translate3d(-4px, 3px, 0);
          }
          50% {
            transform: translate3d(5px, -9px, 0);
          }
        }
      `}</style>
    </div>
  );
}
