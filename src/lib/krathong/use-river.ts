"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import {
  krathongConfigSchema,
  RIVER,
  type Krathong,
  type ReleaseInput,
} from "./schema";

type ReleaseResult =
  | { ok: true; krathong: Krathong; demo: boolean }
  | { ok: false; error: string };

function rowToKrathong(row: Record<string, unknown>): Krathong | null {
  if (
    typeof row.id !== "string" ||
    typeof row.nickname !== "string" ||
    typeof row.position_x !== "number" ||
    typeof row.position_z !== "number" ||
    typeof row.created_at !== "string"
  ) {
    return null;
  }
  const parsedConfig = krathongConfigSchema.safeParse(row.config);
  return {
    id: row.id,
    nickname: row.nickname,
    wish: typeof row.wish === "string" ? row.wish : "",
    imageUrl: typeof row.image_url === "string" ? row.image_url : null,
    config: parsedConfig.success ? parsedConfig.data : null,
    blessings: typeof row.blessings === "number" ? row.blessings : 0,
    x: row.position_x,
    z: row.position_z,
    createdAt: row.created_at,
  };
}

export function useRiver() {
  const [krathongs, setKrathongs] = useState<Krathong[]>([]);
  const [demo, setDemo] = useState(false);
  const [ready, setReady] = useState(false);
  const ids = useRef(new Set<string>());

  const add = useCallback((incoming: Krathong[], replace = false) => {
    setKrathongs((prev) => {
      if (replace) {
        ids.current = new Set(incoming.map((k) => k.id));
        return incoming.slice(0, RIVER.pageSize);
      }
      const fresh = incoming.filter((k) => !ids.current.has(k.id));
      if (fresh.length === 0) return prev;
      for (const k of fresh) ids.current.add(k.id);
      return [...fresh, ...prev].slice(0, RIVER.pageSize);
    });
  }, []);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/krathongs")
      .then((res) => res.json())
      .then((data: { krathongs?: Krathong[]; demo?: boolean }) => {
        if (cancelled) return;
        const list = data.krathongs ?? [];
        add(list, true);
        setDemo(Boolean(data.demo));
      })
      .catch(() => {
        if (!cancelled) {
          add([], true);
        }
      })
      .finally(() => {
        if (!cancelled) setReady(true);
      });

    return () => {
      cancelled = true;
    };
  }, [add]);

  // Realtime: new krathongs appear without polling.
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
      .channel("river")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "krathongs" },
        (payload) => {
          const krathong = rowToKrathong(payload.new as Record<string, unknown>);
          if (krathong) add([krathong]);
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [add]);

  const release = useCallback(
    async (input: ReleaseInput): Promise<ReleaseResult> => {
      try {
        const body = new FormData();
        body.append("mode", input.mode);
        body.append("nickname", input.nickname);
        body.append("wish", input.wish);
        if (input.mode === "image") {
          body.append("image", input.imageFile);
        } else {
          body.append("config", JSON.stringify(input.config));
        }

        const res = await fetch("/api/krathongs", {
          method: "POST",
          body,
        });
        const data = (await res.json()) as {
          krathong?: Krathong;
          error?: string;
        };

        if (res.status === 503 && data.error?.includes("Supabase")) {
          // No database configured: keep the experience playable locally.
          const local: Krathong = {
            id: `local-${Date.now()}`,
            nickname: input.nickname,
            wish: input.wish,
            imageUrl: input.mode === "image" ? input.previewUrl : null,
            config: input.mode === "classic" ? input.config : null,
            blessings: 0,
            x: (Math.random() * 2 - 1) * 6,
            z: -2 - Math.random() * 6,
            createdAt: new Date().toISOString(),
          };
          add([local]);
          setDemo(true);
          return { ok: true, krathong: local, demo: true };
        }

        if (!res.ok || !data.krathong) {
          return { ok: false, error: data.error ?? "ปล่อยกระทงไม่สำเร็จ" };
        }

        add([data.krathong]);
        setDemo(false);
        return { ok: true, krathong: data.krathong, demo: false };
      } catch {
        return { ok: false, error: "เครือข่ายขัดข้อง ลองอีกครั้ง" };
      }
    },
    [add],
  );

  const hide = useCallback((id: string) => {
    setKrathongs((prev) => prev.filter((k) => k.id !== id));
    ids.current.delete(id);
  }, []);

  const bless = useCallback((id: string, delta: 1 | -1 = 1) => {
    setKrathongs((prev) =>
      prev.map((k) =>
        k.id === id ? { ...k, blessings: Math.max(0, k.blessings + delta) } : k,
      ),
    );
    if (!id.startsWith("demo-") && !id.startsWith("local-")) {
      void fetch(`/api/krathongs/${id}/bless`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ delta }),
      }).catch(() => null);
    }
  }, []);

  return { krathongs, demo, ready, release, hide, bless };
}
