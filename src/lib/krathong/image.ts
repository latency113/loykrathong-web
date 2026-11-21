"use client";

import { IMAGE_LIMITS } from "./schema";

export type CompressedImage = {
  file: File;
  previewUrl: string;
  bytes: number;
  width: number;
  height: number;
};

async function canvasToBlob(
  canvas: HTMLCanvasElement,
  mime: string,
  quality: number,
): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), mime, quality);
  });
}

async function loadDrawable(file: File): Promise<{
  source: CanvasImageSource;
  width: number;
  height: number;
  cleanup: () => void;
}> {
  if (typeof createImageBitmap === "function") {
    const bitmap = await createImageBitmap(file);
    return {
      source: bitmap,
      width: bitmap.width,
      height: bitmap.height,
      cleanup: () => bitmap.close(),
    };
  }

  const url = URL.createObjectURL(file);
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    el.onload = () => resolve(el);
    el.onerror = () => reject(new Error("อ่านไฟล์รูปไม่สำเร็จ"));
    el.src = url;
  });

  return {
    source: img,
    width: img.naturalWidth,
    height: img.naturalHeight,
    cleanup: () => URL.revokeObjectURL(url),
  };
}

/**
 * Resize and compress an uploaded image client-side to WebP (fallback JPEG)
 * so Supabase Storage Free Tier (1 GB) holds tens of thousands of krathongs.
 */
export async function compressImageToWebp(file: File): Promise<CompressedImage> {
  if (!file.type.startsWith("image/")) {
    throw new Error("กรุณาเลือกไฟล์รูปภาพเท่านั้น");
  }

  const drawable = await loadDrawable(file);
  try {
    const scale = Math.min(
      1,
      IMAGE_LIMITS.maxDimension / Math.max(drawable.width, drawable.height),
    );
    const width = Math.max(1, Math.round(drawable.width * scale));
    const height = Math.max(1, Math.round(drawable.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("เบราว์เซอร์ไม่รองรับการย่อรูป");
    }
    ctx.drawImage(drawable.source, 0, 0, width, height);

    const qualities = [0.78, 0.62, 0.48, 0.35];
    let bestBlob: Blob | null = null;
    let chosenMime: "image/webp" | "image/jpeg" = "image/webp";

    for (const quality of qualities) {
      const webp = await canvasToBlob(canvas, "image/webp", quality);
      if (webp && webp.type === "image/webp") {
        bestBlob = webp;
        chosenMime = "image/webp";
      } else {
        bestBlob = await canvasToBlob(canvas, "image/jpeg", quality);
        chosenMime = "image/jpeg";
      }
      if (bestBlob && bestBlob.size <= 100 * 1024) break;
    }

    if (!bestBlob) {
      throw new Error("บีบอัดรูปไม่สำเร็จ");
    }
    if (bestBlob.size > IMAGE_LIMITS.maxUploadBytes) {
      throw new Error("รูปยังใหญ่เกิน 250 KB กรุณาเลือกรูปอื่น");
    }

    const ext = chosenMime === "image/webp" ? "webp" : "jpg";
    const compressedFile = new File([bestBlob], `krathong.${ext}`, {
      type: chosenMime,
    });

    return {
      file: compressedFile,
      previewUrl: URL.createObjectURL(compressedFile),
      bytes: compressedFile.size,
      width,
      height,
    };
  } finally {
    drawable.cleanup();
  }
}
