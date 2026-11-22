import type { RiverScene } from "@/lib/krathong/schema";

const BACK_TOWERS = [
  { x: 460, w: 34, h: 68 },
  { x: 502, w: 40, h: 88 },
  { x: 552, w: 28, h: 62 },
  { x: 650, w: 44, h: 96 },
  { x: 706, w: 32, h: 74 },
  { x: 750, w: 38, h: 84 },
  { x: 1085, w: 36, h: 78 },
  { x: 1132, w: 48, h: 102 },
  { x: 1192, w: 30, h: 66 },
  { x: 1290, w: 42, h: 86 },
  { x: 1344, w: 36, h: 64 },
];

const FRONT_TOWERS = [
  { x: 482, w: 30, h: 76, top: "flat" },
  { x: 522, w: 36, h: 104, top: "spire" },
  { x: 570, w: 28, h: 64, top: "slope" },
  { x: 608, w: 38, h: 118, top: "mahanakhon" },
  { x: 662, w: 32, h: 84, top: "flat" },
  { x: 704, w: 40, h: 98, top: "crown" },
  { x: 754, w: 26, h: 62, top: "flat" },
  { x: 1104, w: 34, h: 92, top: "slope" },
  { x: 1148, w: 44, h: 116, top: "iconsiam" },
  { x: 1204, w: 32, h: 86, top: "spire" },
  { x: 1246, w: 38, h: 102, top: "crown" },
  { x: 1296, w: 30, h: 72, top: "flat" },
] as const;

const PINE_TREES = [
  { x: 72, h: 52 },
  { x: 105, h: 68 },
  { x: 138, h: 48 },
  { x: 310, h: 56 },
  { x: 342, h: 72 },
  { x: 375, h: 50 },
  { x: 980, h: 58 },
  { x: 1015, h: 74 },
  { x: 1050, h: 52 },
  { x: 1290, h: 62 },
  { x: 1326, h: 78 },
  { x: 1362, h: 54 },
];

/** Curved Khmer-style prang silhouette (never a straight triangle). */
function PrangPath({
  cx,
  baseY,
  halfW,
  height,
  fill,
}: {
  cx: number;
  baseY: number;
  halfW: number;
  height: number;
  fill: string;
}) {
  const topY = baseY - height;
  const t1 = baseY - height * 0.25;
  const t2 = baseY - height * 0.52;
  const t3 = baseY - height * 0.76;
  return (
    <g>
      <path
        d={[
          `M${cx - halfW},${baseY}`,
          `Q${cx - halfW * 0.92},${t1} ${cx - halfW * 0.72},${t1}`,
          `Q${cx - halfW * 0.65},${t2} ${cx - halfW * 0.48},${t2}`,
          `Q${cx - halfW * 0.42},${t3} ${cx - halfW * 0.26},${t3}`,
          `Q${cx - halfW * 0.14},${topY + 12} ${cx},${topY}`,
          `Q${cx + halfW * 0.14},${topY + 12} ${cx + halfW * 0.26},${t3}`,
          `Q${cx + halfW * 0.42},${t3} ${cx + halfW * 0.48},${t2}`,
          `Q${cx + halfW * 0.65},${t2} ${cx + halfW * 0.72},${t1}`,
          `Q${cx + halfW * 0.92},${t1} ${cx + halfW},${baseY}`,
          "Z",
        ].join(" ")}
        fill={fill}
        stroke="#fde68a"
        strokeOpacity="0.28"
        strokeWidth="0.7"
      />
      {/* Tiered cornice highlights */}
      <line
        x1={cx - halfW * 0.72}
        y1={t1}
        x2={cx + halfW * 0.72}
        y2={t1}
        stroke="#fef08a"
        strokeOpacity="0.45"
        strokeWidth="1"
      />
      <line
        x1={cx - halfW * 0.48}
        y1={t2}
        x2={cx + halfW * 0.48}
        y2={t2}
        stroke="#fef08a"
        strokeOpacity="0.45"
        strokeWidth="1"
      />
      <line
        x1={cx - halfW * 0.26}
        y1={t3}
        x2={cx + halfW * 0.26}
        y2={t3}
        stroke="#fef08a"
        strokeOpacity="0.45"
        strokeWidth="0.9"
      />
      {/* Finial spire */}
      <line
        x1={cx}
        y1={topY - 9}
        x2={cx}
        y2={topY + 1}
        stroke="#fef08a"
        strokeWidth="1.4"
      />
    </g>
  );
}

export default function HorizonBackdrop({ scene }: { scene: RiverScene }) {
  return (
    <svg
      viewBox="0 -90 1440 270"
      preserveAspectRatio="xMidYMax slice"
      className="pointer-events-none absolute inset-x-0 bottom-0 h-full w-full"
      aria-hidden="true"
    >
      <defs>
        <radialGradient id="wat-arun-glow" cx="50%" cy="72%" r="54%">
          <stop offset="0%" stopColor="#fde047" stopOpacity="0.46" />
          <stop offset="55%" stopColor="#f59e0b" stopOpacity="0.16" />
          <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="prang-main" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#fef08a" stopOpacity="0.9" />
          <stop offset="38%" stopColor="#d97706" stopOpacity="0.72" />
          <stop offset="100%" stopColor="#1e1b4b" stopOpacity="0.95" />
        </linearGradient>
        <linearGradient id="prang-side" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#fcd34d" stopOpacity="0.7" />
          <stop offset="55%" stopColor="#92400e" stopOpacity="0.65" />
          <stop offset="100%" stopColor="#141842" stopOpacity="0.95" />
        </linearGradient>
        <linearGradient id="pylon-gold" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#fef08a" />
          <stop offset="50%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#78350f" />
        </linearGradient>
        <radialGradient id="lanna-glow" cx="50%" cy="70%" r="52%">
          <stop offset="0%" stopColor="#fb923c" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#fb923c" stopOpacity="0" />
        </radialGradient>
      </defs>

      {scene === "chao-phraya" && (
        <g>
          {/* Warm golden temple aura behind Wat Arun */}
          <ellipse cx="260" cy="126" rx="185" ry="74" fill="url(#wat-arun-glow)" />

          {/* Back misty skyline layer */}
          <g fill="#111944" opacity="0.72">
            {BACK_TOWERS.map((t, idx) => (
              <rect
                key={idx}
                x={t.x}
                y={160 - t.h}
                width={t.w}
                height={t.h}
                rx="1.5"
              />
            ))}
          </g>

          {/* Front Bangkok skyline with varied rooflines & window grids */}
          {FRONT_TOWERS.map((t, idx) => {
            const top = 160 - t.h;
            return (
              <g key={idx}>
                {t.top === "mahanakhon" ? (
                  <path
                    d={`M${t.x},160 L${t.x},${top} L${t.x + t.w},${top} L${t.x + t.w},${top + 26} L${t.x + t.w - 7},${top + 26} L${t.x + t.w - 7},${top + 46} L${t.x + t.w},${top + 46} L${t.x + t.w},160 Z`}
                    fill="#080e2b"
                  />
                ) : t.top === "iconsiam" ? (
                  <g fill="#080e2b">
                    <rect x={t.x} y={top + 14} width={19} height={t.h - 14} rx="2" />
                    <rect x={t.x + 23} y={top} width={21} height={t.h} rx="2" />
                    <line
                      x1={t.x + 33}
                      y1={top - 12}
                      x2={t.x + 33}
                      y2={top}
                      stroke="#94a3b8"
                      strokeOpacity="0.55"
                      strokeWidth="1.2"
                    />
                    <circle cx={t.x + 33} cy={top - 12} r="1.5" fill="#f87171" />
                  </g>
                ) : t.top === "slope" ? (
                  <path
                    d={`M${t.x},160 L${t.x},${top + 12} L${t.x + t.w},${top} L${t.x + t.w},160 Z`}
                    fill="#080e2b"
                  />
                ) : t.top === "crown" ? (
                  <g fill="#080e2b">
                    <rect x={t.x} y={top + 8} width={t.w} height={t.h - 8} rx="1.5" />
                    <rect x={t.x + 6} y={top} width={t.w - 12} height={10} rx="1" />
                  </g>
                ) : (
                  <g fill="#080e2b">
                    <rect x={t.x} y={top} width={t.w} height={t.h} rx="1.5" />
                    {t.top === "spire" && (
                      <>
                        <line
                          x1={t.x + t.w / 2}
                          y1={top - 14}
                          x2={t.x + t.w / 2}
                          y2={top}
                          stroke="#94a3b8"
                          strokeOpacity="0.55"
                          strokeWidth="1.2"
                        />
                        <circle cx={t.x + t.w / 2} cy={top - 14} r="1.4" fill="#f87171" />
                      </>
                    )}
                  </g>
                )}

                {/* Crisp dotted skyscraper window grids */}
                {Array.from({ length: Math.floor((t.h - 20) / 10) }, (_, row) =>
                  [0, 1, 2].map((col) => {
                    if ((row + col + idx) % 4 === 0) return null;
                    const wx = t.x + 5 + col * 8;
                    if (wx + 4 > t.x + t.w - 3) return null;
                    return (
                      <rect
                        key={`${row}-${col}`}
                        x={wx}
                        y={top + 14 + row * 10}
                        width="4"
                        height="2.5"
                        rx="0.5"
                        fill={(row + idx) % 3 === 0 ? "#7dd3fc" : "#fde68a"}
                        fillOpacity={0.55}
                      />
                    );
                  }),
                )}
              </g>
            );
          })}

          {/* Rama VIII Bridge — graceful golden asymmetric harp */}
          <g>
            <g stroke="#fef08a" strokeOpacity="0.5" strokeWidth="0.9">
              {[0, 1, 2, 3, 4, 5, 6].map((i) => (
                <line
                  key={`l-${i}`}
                  x1="948"
                  y1={28 + i * 5}
                  x2={795 + i * 21}
                  y2="144"
                />
              ))}
              {[0, 1, 2, 3].map((i) => (
                <line
                  key={`r-${i}`}
                  x1="948"
                  y1={30 + i * 6}
                  x2={1062 - i * 18}
                  y2="144"
                />
              ))}
            </g>

            {/* Tapered inverted-Y golden pylon */}
            <path
              d="M945,28 L951,28 L954,84 L965,152 L958,152 L948,94 L938,152 L931,152 L942,84 Z"
              fill="url(#pylon-gold)"
            />
            <circle cx="948" cy="28" r="2.2" fill="#ffffff" />

            {/* Illuminated bridge deck & tiny streetlights */}
            <rect x="780" y="143" width="296" height="4" rx="1" fill="#1e293b" />
            <line
              x1="780"
              y1="143"
              x2="1076"
              y2="143"
              stroke="#fde68a"
              strokeOpacity="0.7"
              strokeWidth="1.2"
            />
            {[796, 828, 860, 892, 924, 974, 1006, 1038, 1066].map((lx, i) => (
              <circle key={i} cx={lx} cy="141.5" r="1.4" fill="#fef08a" />
            ))}
          </g>

          {/* Wat Arun (Temple of Dawn) — 5 curved Khmer prangs + terraced base */}
          <g>
            <rect x="155" y="144" width="210" height="18" rx="2" fill="#090e2b" />
            <rect x="178" y="130" width="164" height="16" rx="2" fill="#111842" />
            <line
              x1="178"
              y1="130"
              x2="342"
              y2="130"
              stroke="#fde68a"
              strokeOpacity="0.4"
              strokeWidth="1.2"
            />

            {/* Outer corner prangs */}
            <PrangPath cx={194} baseY={132} halfW={13} height={52} fill="url(#prang-side)" />
            <PrangPath cx={326} baseY={132} halfW={13} height={52} fill="url(#prang-side)" />

            {/* Inner flanking mondops/prangs */}
            <PrangPath cx={224} baseY={132} halfW={11} height={44} fill="url(#prang-side)" />
            <PrangPath cx={296} baseY={132} halfW={11} height={44} fill="url(#prang-side)" />

            {/* Central tall Phra Prang */}
            <PrangPath cx={260} baseY={132} halfW={22} height={94} fill="url(#prang-main)" />
            <circle cx={260} cy={29} r="1.8" fill="#ffffff" />
          </g>

          {/* Foreground Chao Phraya embankment */}
          <path
            d="M0,180 L0,156 Q260,146 540,158 T1080,154 T1440,158 L1440,180 Z"
            fill="#060b22"
          />
        </g>
      )}

      {scene === "yi-peng" && (
        <g>
          <ellipse cx="320" cy="130" rx="200" ry="66" fill="url(#lanna-glow)" />

          {/* Rolling Doi Suthep mountain range */}
          <path
            d="M0,180 L0,112 Q190,52 410,100 T840,88 T1240,102 T1440,84 L1440,180 Z"
            fill="#1f1030"
            opacity="0.92"
          />

          {/* Wat Phra That Doi Suthep glowing on the mountain ridge */}
          <PrangPath cx={184} baseY={86} halfW={9} height={40} fill="url(#prang-main)" />

          {/* Lanna multi-tiered Wihan & Chedi along Ping River */}
          <g fill="#120922">
            <PrangPath cx={280} baseY={156} halfW={16} height={82} fill="url(#prang-side)" />
            <path d="M322,156 L322,134 L306,134 L362,98 L418,134 L402,134 L402,156 Z" />
            <path d="M328,120 L362,88 L396,120 Z" />
            <path d="M338,104 L362,80 L386,104 Z" />
            <line x1="362" y1="70" x2="362" y2="82" stroke="#fde68a" strokeWidth="1.8" />
            {[210, 250, 308, 362, 420, 470, 520].map((lx, i) => (
              <circle key={i} cx={lx} cy={150} r="2.5" fill="#fbbf24" fillOpacity="0.9" />
            ))}
          </g>

          <path
            d="M0,180 L0,150 Q280,136 620,152 T1120,144 T1440,150 L1440,180 Z"
            fill="#100820"
          />
        </g>
      )}

      {scene === "moonlight-lake" && (
        <g>
          {/* Misty mountain peaks (Pang Ung style) */}
          <path
            d="M0,180 L0,120 L160,68 L320,112 L510,58 L700,116 L890,72 L1100,118 L1290,64 L1440,108 L1440,180 Z"
            fill="#072233"
            opacity="0.92"
          />

          {/* Tall northern pine tree silhouettes framing the lake */}
          <g fill="#041521">
            {PINE_TREES.map((p, idx) => (
              <path
                key={idx}
                d={`M${p.x},154 L${p.x - 10},154 L${p.x - 4},${154 - p.h * 0.45} L${p.x - 8},${154 - p.h * 0.45} L${p.x},${154 - p.h} L${p.x + 8},${154 - p.h * 0.45} L${p.x + 4},${154 - p.h * 0.45} L${p.x + 10},154 Z`}
              />
            ))}
          </g>

          {/* Wooden lakeside sala & pier with warm lantern */}
          <g fill="#03111c">
            <rect x="190" y="146" width="90" height="4" />
            <rect x="200" y="150" width="4" height="14" />
            <rect x="266" y="150" width="4" height="14" />
            <path d="M196,146 L196,126 L186,126 L224,104 L262,126 L252,126 L252,146 Z" />
            <circle cx="224" cy="132" r="3.2" fill="#fde68a" fillOpacity="0.85" />
          </g>

          <path
            d="M0,180 L0,152 Q180,138 380,150 T820,146 T1200,150 T1440,144 L1440,180 Z"
            fill="#041420"
          />
        </g>
      )}
    </svg>
  );
}
