"use client";

import { useId } from "react";
import type { LanternColor } from "@/lib/krathong/schema";

const PALETTES: Record<
  LanternColor,
  { top: string; mid: string; rim: string; glow: string; rib: string }
> = {
  amber: {
    top: "#c2410c",
    mid: "#f97316",
    rim: "#fef08a",
    glow: "#fde047",
    rib: "#9a3412",
  },
  rose: {
    top: "#be185d",
    mid: "#f43f5e",
    rim: "#fecdd3",
    glow: "#fda4af",
    rib: "#9d174d",
  },
  sky: {
    top: "#0369a1",
    mid: "#0ea5e9",
    rim: "#e0f2fe",
    glow: "#7dd3fc",
    rib: "#075985",
  },
  violet: {
    top: "#6d28d9",
    mid: "#9333ea",
    rim: "#f3e8ff",
    glow: "#d8b4fe",
    rib: "#5b21b6",
  },
};

export default function SkyLanternSvg({
  color = "amber",
  className = "h-12 w-10",
}: {
  color?: LanternColor;
  className?: string;
}) {
  const uid = useId().replace(/:/g, "");
  const p = PALETTES[color];

  return (
    <svg viewBox="0 0 80 100" className={className} aria-hidden="true">
      <defs>
        <radialGradient id={`${uid}-paper`} cx="50%" cy="74%" r="65%">
          <stop offset="0%" stopColor="#fffbeb" />
          <stop offset="28%" stopColor={p.rim} />
          <stop offset="68%" stopColor={p.mid} />
          <stop offset="100%" stopColor={p.top} />
        </radialGradient>

        <radialGradient id={`${uid}-flame`} cx="50%" cy="62%" r="55%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="48%" stopColor="#fef08a" />
          <stop offset="100%" stopColor="#f97316" />
        </radialGradient>
      </defs>

      {/* Tapered curved paper lantern body */}
      <path
        d="M40 8 C58 8, 68 18, 66 36 C64 56, 58 72, 54 82 Q40 88 26 82 C22 72, 16 56, 14 36 C12 18, 22 8, 40 8 Z"
        fill={`url(#${uid}-paper)`}
        stroke={p.rim}
        strokeOpacity="0.45"
        strokeWidth="0.9"
      />

      {/* Subtle top cap highlight */}
      <ellipse
        cx="40"
        cy="13"
        rx="16"
        ry="3.5"
        fill={p.top}
        fillOpacity="0.35"
      />

      {/* Vertical bamboo paper ribs */}
      <g fill="none" stroke={p.rib} strokeOpacity="0.32" strokeWidth="0.8">
        <path d="M40 9 L40 84" />
        <path d="M31 10 C25 32, 26 60, 31 83" />
        <path d="M49 10 C55 32, 54 60, 49 83" />
        <path d="M22 15 C17 36, 19 62, 26 82" />
        <path d="M58 15 C63 36, 61 62, 54 82" />
      </g>

      {/* Open bottom bamboo rim */}
      <ellipse
        cx="40"
        cy="82"
        rx="14"
        ry="4.2"
        fill="#451a03"
        fillOpacity="0.72"
        stroke={p.rim}
        strokeOpacity="0.7"
        strokeWidth="1.2"
      />

      {/* Wire cross holding the fuel cell */}
      <line
        x1="28"
        y1="82"
        x2="52"
        y2="82"
        stroke="#78350f"
        strokeOpacity="0.8"
        strokeWidth="0.9"
      />

      {/* Inner glowing flame */}
      <circle cx="40" cy="79" r="6" fill={p.glow} fillOpacity="0.45" />
      <path
        d="M40 71 Q44.5 77 40 82 Q35.5 77 40 71 Z"
        fill={`url(#${uid}-flame)`}
      />
      <path
        d="M40 74.5 Q42 78 40 81 Q38 78 40 74.5 Z"
        fill="#ffffff"
        fillOpacity="0.95"
      />
    </svg>
  );
}
