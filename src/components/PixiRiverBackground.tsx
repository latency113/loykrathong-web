"use client";

import { useEffect, useRef } from "react";
import { Application, Graphics } from "pixi.js";
import type { RiverScene } from "@/lib/krathong/schema";

type FireworkBurst = {
  x: number;
  y: number;
  age: number;
  life: number;
  color: number;
  spokes: number;
  radius: number;
};

const FIREWORK_COLORS = [0xfde047, 0xf472b6, 0x38bdf8, 0xfb923c, 0xc084fc];

const SCENE_WAVE_COLORS: Record<RiverScene, [number, number]> = {
  "chao-phraya": [0x7dd3fc, 0xc4b5fd],
  "yi-peng": [0xfcd34d, 0xfb7185],
  "moonlight-lake": [0x67e8f9, 0x6ee7b7],
};

/**
 * PixiJS WebGL/Canvas background rendering festive night fireworks,
 * layered luminous river waves, warm moonbeam reflections, and fireflies.
 */
export default function PixiRiverBackground({
  scene,
  celebrationKey,
}: {
  scene: RiverScene;
  celebrationKey: number;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<RiverScene>(scene);
  const celebrationQueueRef = useRef(0);

  useEffect(() => {
    sceneRef.current = scene;
  }, [scene]);

  useEffect(() => {
    if (celebrationKey > 0) {
      celebrationQueueRef.current += 3;
    }
  }, [celebrationKey]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    let destroyed = false;
    let initialized = false;
    const app = new Application();

    const init = async () => {
      await app.init({
        resizeTo: host,
        backgroundAlpha: 0,
        antialias: true,
        autoDensity: true,
        resolution: Math.min(window.devicePixelRatio || 1, 1.5),
      });

      if (destroyed) {
        app.destroy(true);
        return;
      }
      initialized = true;

      app.canvas.style.width = "100%";
      app.canvas.style.height = "100%";
      app.canvas.style.display = "block";
      host.appendChild(app.canvas);

      const fireworkGfx = new Graphics();
      const waveGfx = new Graphics();
      const reflectionGfx = new Graphics();
      const sparkleGfx = new Graphics();
      app.stage.addChild(fireworkGfx, waveGfx, reflectionGfx, sparkleGfx);

      const sparkles = Array.from({ length: 32 }, (_, i) => ({
        xRatio: ((i * 37) % 100) / 100,
        yRatio: 0.37 + (((i * 23) % 58) / 100),
        speed: 0.008 + (i % 5) * 0.004,
        phase: i * 0.8,
        warm: i % 3 !== 0,
      }));

      const bursts: FireworkBurst[] = [];
      let nextBurstIn = 0.8;
      let colorIdx = 0;

      let elapsed = 0;
      app.ticker.add((ticker) => {
        const dt = ticker.deltaMS * 0.001;
        elapsed += dt;
        const w = app.screen.width;
        const h = app.screen.height;
        const horizon = h * 0.35;

        // Celebration bursts on krathong release
        while (celebrationQueueRef.current > 0 && w > 0 && h > 0) {
          celebrationQueueRef.current -= 1;
          bursts.push({
            x: w * (0.25 + Math.random() * 0.5),
            y: h * (0.09 + Math.random() * 0.14),
            age: 0,
            life: 2.1,
            color: FIREWORK_COLORS[colorIdx % FIREWORK_COLORS.length],
            spokes: 18,
            radius: 56 + Math.random() * 30,
          });
          colorIdx += 1;
        }

        // Ambient periodic fireworks
        nextBurstIn -= dt;
        if (nextBurstIn <= 0 && w > 0 && h > 0) {
          bursts.push({
            x: w * (0.14 + Math.random() * 0.62),
            y: h * (0.08 + Math.random() * 0.16),
            age: 0,
            life: 1.7 + Math.random() * 0.6,
            color: FIREWORK_COLORS[colorIdx % FIREWORK_COLORS.length],
            spokes: 14,
            radius: 36 + Math.random() * 34,
          });
          colorIdx += 1;
          nextBurstIn = 1.6 + Math.random() * 1.8;
        }

        fireworkGfx.clear();
        for (let i = bursts.length - 1; i >= 0; i -= 1) {
          const b = bursts[i];
          b.age += dt;
          if (b.age >= b.life) {
            bursts.splice(i, 1);
            continue;
          }
          const p = b.age / b.life;
          const easeOut = 1 - Math.pow(1 - p, 3);
          const alpha = (1 - p) * 0.85;
          const dist = b.radius * easeOut;
          const gravity = p * p * 14;

          for (let s = 0; s < b.spokes; s += 1) {
            const angle = (s / b.spokes) * Math.PI * 2;
            const px = b.x + Math.cos(angle) * dist;
            const py = b.y + Math.sin(angle) * dist + gravity;
            const innerDist = Math.max(0, dist - 10 * (1 - p));
            const ix = b.x + Math.cos(angle) * innerDist;
            const iy = b.y + Math.sin(angle) * innerDist + gravity * 0.7;

            fireworkGfx.moveTo(ix, iy);
            fireworkGfx.lineTo(px, py);
            fireworkGfx.stroke({ width: 1.6, color: b.color, alpha });

            fireworkGfx.circle(px, py, 1.8);
            fireworkGfx.fill({ color: 0xffffff, alpha: alpha * 0.9 });
          }
        }

        // Flowing luminous river waves
        const [waveA, waveB] = SCENE_WAVE_COLORS[sceneRef.current];
        waveGfx.clear();
        const waveRows = 6;
        for (let r = 0; r < waveRows; r += 1) {
          const yBase = horizon + ((h - horizon) * (r + 0.5)) / (waveRows + 0.4);
          const amp = 3.5 + r * 1.3;
          const speed = (r % 2 === 0 ? 1 : -1) * (0.45 + r * 0.14);
          const alpha = 0.1 + r * 0.025;
          const color = r % 2 === 0 ? waveA : waveB;

          waveGfx.moveTo(0, yBase);
          for (let x = 0; x <= w; x += 36) {
            const y =
              yBase +
              Math.sin(x * 0.012 + elapsed * speed + r) * amp +
              Math.cos(x * 0.006 - elapsed * 0.3) * 2;
            waveGfx.lineTo(x, y);
          }
          waveGfx.stroke({ width: 1.6, color, alpha });
        }

        // Soft golden moonbeam reflection on water
        reflectionGfx.clear();
        const moonX = w * 0.85;
        for (let b = 0; b < 11; b += 1) {
          const t = b / 10;
          const y = horizon + 12 + t * (h - horizon - 28);
          const sway = Math.sin(elapsed * 2.2 + b * 0.85) * (5 + t * 9);
          const bw = (54 + (b % 3) * 20) * (1 - t * 0.2);
          const alpha = 0.24 * (1 - t * 0.68);
          reflectionGfx.roundRect(moonX - bw / 2 + sway, y, bw, 4.5, 3);
          reflectionGfx.fill({ color: 0xfde68a, alpha });
        }

        // Warm golden fireflies + cool water sparkles
        sparkleGfx.clear();
        for (const sp of sparkles) {
          const sx = ((sp.xRatio + elapsed * sp.speed) % 1) * w;
          const sy = sp.yRatio * h + Math.sin(elapsed * 1.5 + sp.phase) * 3;
          const alpha = 0.2 + 0.48 * (0.5 + 0.5 * Math.sin(elapsed * 2.2 + sp.phase));
          if (sp.warm) {
            sparkleGfx.circle(sx, sy, 2.2);
            sparkleGfx.fill({ color: 0xfde047, alpha });
          } else {
            sparkleGfx.roundRect(sx, sy, 11, 2, 1);
            sparkleGfx.fill({ color: waveA, alpha: alpha * 0.85 });
          }
        }
      });
    };

    void init();

    return () => {
      destroyed = true;
      if (!initialized) return;
      if (app.canvas.parentNode === host) {
        host.removeChild(app.canvas);
      }
      app.destroy(true, { children: true });
    };
  }, []);

  return <div ref={hostRef} className="pointer-events-none absolute inset-0" />;
}
