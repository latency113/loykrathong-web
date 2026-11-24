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
 * Wraps an uploaded user photo inside a golden circular medallion nestled
 * on top of the illustrated banana-leaf krathong with Lottie sparkles.
 */
export function PhotoKrathongFrame({
  imageUrl,
  alt,
  className = "h-24 w-24",
  sparkle = false,
}: {
  imageUrl: string;
  alt: string;
  className?: string;
  sparkle?: boolean;
}) {
  return (
    <div className={`relative ${className}`}>
      {/* Circular golden photo medallion (always 1:1, never squished) */}
      <div className="absolute left-1/2 top-0 z-10 aspect-square w-[62%] -translate-x-1/2 overflow-hidden rounded-full border-2 border-amber-300 bg-[#0b1726]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl}
          alt={alt}
          loading="lazy"
          decoding="async"
          draggable={false}
          className="h-full w-full object-cover"
        />
      </div>

      {/* Illustrated krathong base cradling the photo */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/krathongs/banana-leaf.png"
        alt=""
        decoding="async"
        draggable={false}
        className="pointer-events-none absolute bottom-0 left-1/2 z-0 h-[58%] w-[94%] -translate-x-1/2 object-contain"
      />

      {sparkle && (
        <Lottie
          src={sparkleAnimation}
          autoplay
          loop
          className="pointer-events-none absolute inset-0 z-20 h-full w-full opacity-75"
        />
      )}
    </div>
  );
}

export default function ClassicKrathongSvg({
  config,
  className = "h-full w-full",
  sparkle = false,
}: {
  config: KrathongConfig;
  className?: string;
  sparkle?: boolean;
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
        decoding="async"
        draggable={false}
        className="h-full w-full object-contain"
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
      {sparkle && config.candle && (
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
