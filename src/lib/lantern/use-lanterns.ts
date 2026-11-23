"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import {
  LANTERN,
  LANTERN_COLORS,
  type Lantern,
  type LanternColor,
  type LanternReleaseInput,
} from "@/lib/krathong/schema";

type ReleaseResult =
  | { ok: true; lantern: Lantern; demo: boolean }
  | { ok: false; error: string };

function isLanternColor(value: unknown): value is LanternColor {
  return (
    typeof value === "string" &&
    (LANTERN_COLORS as readonly string[]).includes(value)
  );
}

function rowToLantern(row: Record<string, unknown>): Lantern | null {
  if (
    typeof row.id !== "string" ||
    typeof row.nickname !== "string" ||
    typeof row.position_x !== "number" ||
    typeof row.position_y !== "number" ||
    typeof row.created_at !== "string"
  ) {
    return null;
  }

  return {
    id: row.id,
    nickname: row.nickname,
    wish: typeof row.wish === "string" ? row.wish : "",
    color: isLanternColor(row.color) ? row.color : "amber",
    blessings: typeof row.blessings === "number" ? row.blessings : 0,
    x: row.position_x,
    y: row.position_y,
    createdAt: row.created_at,
  };
}

export function useLanterns() {
  const [lanterns, setLanterns] = useState<Lantern[]>([]);
  const ids = useRef(new Set<string>());

  const add = useCallback((incoming: Lantern[], replace = false) => {
    setLanterns((prev) => {
      if (replace) {
        ids.current = new Set(incoming.map((l) => l.id));
        return incoming.slice(0, LANTERN.pageSize);
      }
      const fresh = incoming.filter((l) => !ids.current.has(l.id));
      if (fresh.length === 0) return prev;
      for (const l of fresh) ids.current.add(l.id);
      return [...fresh, ...prev].slice(0, LANTERN.pageSize);
    });
  }, []);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/lanterns")
      .then((res) => res.json())
      .then((data: { lanterns?: Lantern[] }) => {
        if (cancelled) return;
        add(data.lanterns ?? [], true);
      })
      .catch(() => {
        if (!cancelled) add([], true);
      });

    return () => {
      cancelled = true;
    };
  }, [add]);

  // Realtime: newly released lanterns appear without polling.
  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key =
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) return;

    const supabase = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const channel = supabase
      .channel("lanterns")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "lanterns" },
        (payload) => {
          const lantern = rowToLantern(payload.new as Record<string, unknown>);
          if (lantern) add([lantern]);
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [add]);

  const release = useCallback(
    async (input: LanternReleaseInput): Promise<ReleaseResult> => {
      try {
        const res = await fetch("/api/lanterns", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(input),
        });
        const data = (await res.json()) as {
          lantern?: Lantern;
          error?: string;
        };

        if (res.status === 503 && data.error?.includes("Supabase")) {
          // No database configured: keep the experience playable locally.
          const local: Lantern = {
            id: `local-lantern-${Date.now()}`,
            nickname: input.nickname,
            wish: input.wish,
            color: input.color,
            blessings: 0,
            x: Number(((Math.random() * 2 - 1) * 0.92).toFixed(3)),
            y: Number((0.08 + Math.random() * 0.8).toFixed(3)),
            createdAt: new Date().toISOString(),
          };
          add([local]);
          return { ok: true, lantern: local, demo: true };
        }

        if (!res.ok || !data.lantern) {
          return { ok: false, error: data.error ?? "ลอยโคมไม่สำเร็จ" };
        }

        add([data.lantern]);
        return { ok: true, lantern: data.lantern, demo: false };
      } catch {
        return { ok: false, error: "เครือข่ายขัดข้อง ลองอีกครั้ง" };
      }
    },
    [add],
  );

  const hide = useCallback((id: string) => {
    setLanterns((prev) => prev.filter((l) => l.id !== id));
    ids.current.delete(id);
  }, []);

  const bless = useCallback((id: string, delta: 1 | -1 = 1) => {
    setLanterns((prev) =>
      prev.map((l) =>
        l.id === id ? { ...l, blessings: Math.max(0, l.blessings + delta) } : l,
      ),
    );
    if (!id.startsWith("demo-") && !id.startsWith("local-")) {
      void fetch(`/api/lanterns/${id}/bless`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ delta }),
      }).catch(() => null);
    }
  }, []);

  return { lanterns, release, hide, bless };
}
