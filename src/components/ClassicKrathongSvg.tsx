"use client";

import { Lottie } from "lottie-react";
import sparkleAnimation from "@/lib/krathong/sparkle-lottie.json";
import type { ClassicPreset, Flower, KrathongConfig } from "@/lib/krathong/schema";

function FlowerShapes({ flower, color }: { flower: Flower; color: string }) {
  return (
    <>
      {flower === "marigold" && (
        <g>
          {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
            <ellipse
              key={deg}
              cx="0"
              cy="-4.8"
              rx="2.3"
              ry="4.3"
              transform={`rotate(${deg})`}
              fill={color}
              stroke="#fef3c7"
              strokeOpacity="0.45"
              strokeWidth="0.6"
            />
          ))}
          <circle cx="0" cy="0" r="2.6" fill="#fef08a" />
        </g>
      )}
      {flower === "lotus" && (
        <g>
          <path
            d="M0 -8 C3.5 -4, 4.5 2, 0 6 C-4.5 2, -3.5 -4, 0 -8 Z"
            fill={color}
            stroke="#ffffff"
            strokeOpacity="0.55"
            strokeWidth="0.7"
          />
          <path
            d="M-6 -2 C-3 -4, -1 1, 0 6 C-4 5, -7 2, -6 -2 Z"
            fill={color}
            fillOpacity="0.9"
            stroke="#ffffff"
            strokeOpacity="0.45"
            strokeWidth="0.6"
          />
          <path
            d="M6 -2 C3 -4, 1 1, 0 6 C4 5, 7 2, 6 -2 Z"
            fill={color}
            fillOpacity="0.9"
            stroke="#ffffff"
            strokeOpacity="0.45"
            strokeWidth="0.6"
          />
        </g>
      )}
      {flower === "orchid" && (
        <g>
          {[0, 72, 144, 216, 288].map((deg) => (
            <path
              key={deg}
              d="M0 0 C-2.8 -3, -2.2 -7.5, 0 -8 C2.2 -7.5, 2.8 -3, 0 0 Z"
              transform={`rotate(${deg})`}
              fill={color}
              stroke="#f5f3ff"
              strokeOpacity="0.45"
              strokeWidth="0.6"
            />
          ))}
          <circle cx="0" cy="0" r="2.2" fill="#f43f5e" />
        </g>
      )}
    </>
  );
}

function FlowerIcon({
  flower,
  color,
  size = 15,
}: {
  flower: Flower;
  color: string;
  size?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="-10 -10 20 20"
      aria-hidden="true"
      className="overflow-visible drop-shadow-[0_1px_3px_rgba(0,0,0,0.65)]"
    >
      <FlowerShapes flower={flower} color={color} />
    </svg>
  );
}

/**
 * Wraps an uploaded user photo inside a golden circular medallion resting
 * on a festive krathong base with glowing candle flame.
 */
export function PhotoKrathongFrame({
  imageUrl,
  alt,
  className = "h-24 w-24",
}: {
  imageUrl: string;
  alt: string;
  className?: string;
}) {
  return (
    <div className={`relative flex flex-col items-center justify-end ${className}`}>
      {/* Circular golden photo frame */}
      <div className="relative z-10 h-[72%] w-[72%] overflow-hidden rounded-full border-2 border-amber-300 bg-[#0b1726] shadow-[0_0_20px_rgba(251,191,36,0.4)]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl}
          alt={alt}
          loading="lazy"
          draggable={false}
          className="h-full w-full object-cover"
        />
      </div>

      {/* Tiny candle flame perched at the top of the frame */}
      <span className="pointer-events-none absolute top-0 left-1/2 z-20 h-3.5 w-2.5 -translate-x-1/2 rounded-full bg-gradient-to-t from-orange-400 via-amber-200 to-white shadow-[0_0_10px_rgba(253,224,71,0.9)]" />

      {/* Festive lotus/leaf krathong base beneath the medallion */}
      <svg
        viewBox="0 0 120 42"
        className="pointer-events-none -mt-3.5 h-[36%] w-[94%] drop-shadow-[0_6px_10px_rgba(0,0,0,0.6)]"
        aria-hidden="true"
      >
        <path
          d="M12 16 Q60 44 108 16 L98 30 Q60 46 22 30 Z"
          fill="#15803d"
          stroke="#bef264"
          strokeOpacity="0.4"
          strokeWidth="1"
        />
        <path
          d="M14 18 L24 6 L34 18 L46 5 L60 17 L74 5 L86 18 L96 6 L106 18 Q60 30 14 18 Z"
          fill="#22c55e"
          fillOpacity="0.88"
          stroke="#fef08a"
          strokeOpacity="0.45"
          strokeWidth="0.9"
        />
        <circle cx="32" cy="21" r="3" fill="#fde047" />
        <circle cx="60" cy="24" r="3.2" fill="#f472b6" />
        <circle cx="88" cy="21" r="3" fill="#fde047" />
      </svg>
    </div>
  );
}

export default function ClassicKrathongSvg({
  config,
  className = "h-full w-full",
}: {
  config: KrathongConfig;
  className?: string;
}) {
  const preset: ClassicPreset = config.preset ?? "lotus-pink";
  const garland = Array.from({ length: config.flowers }, (_, i) => {
    const t = config.flowers === 1 ? 0.5 : i / (config.flowers - 1);
    const leftPct = 20 + t * 60;
    const topPct = 67 + Math.sin(t * Math.PI) * 9;
    return { leftPct, topPct };
  });

  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`/krathongs/${preset}.png`}
        alt="กระทง"
        draggable={false}
        className="h-full w-full object-contain drop-shadow-[0_8px_16px_rgba(0,0,0,0.45)]"
      />
      {garland.map((pos, idx) => (
        <span
          key={idx}
          style={{ left: `${pos.leftPct}%`, top: `${pos.topPct}%` }}
          className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2"
        >
          <FlowerIcon flower={config.flower} color={config.flowerColor} size={15} />
        </span>
      ))}
      {config.candle && (
        <Lottie
          src={sparkleAnimation}
          autoplay
          loop
          className="pointer-events-none absolute inset-0 h-full w-full opacity-85"
        />
      )}
    </div>
  );
}
