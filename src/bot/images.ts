/** Long edge of an image sent to the assistant: readable screenshots at about 1,200 image tokens. */
export const MAX_EDGE = 1280;
/** Services refuses images above 1.5 MB; stay under it. */
const MAX_BYTES = 1_400_000;
const THUMB_EDGE = 160;
export const MAX_IMAGES = 2;

/** An image ready to send: what the model gets, and a small preview for the chat. */
export interface PreparedImage {
  media_type: "image/webp" | "image/jpeg";
  /** Base64 without the data: prefix. */
  data: string;
  /** Small JPEG data URL shown in the chat (and kept in sessionStorage). */
  preview: string;
}

/** The shrunk image as a data URL, for viewing it full size. */
export const imageSrc = (image: PreparedImage) => `data:${image.media_type};base64,${image.data}`;

/** The size that fits `edge` on the long side, never enlarging. */
export function fitWithin(width: number, height: number, edge: number): { width: number; height: number } {
  const scale = Math.min(1, edge / Math.max(width, height));
  return { width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)) };
}

/** Draws the image at `edge` on a white canvas (JPEG has no transparency). */
function draw(bitmap: ImageBitmap, edge: number): HTMLCanvasElement {
  const size = fitWithin(bitmap.width, bitmap.height, edge);
  const canvas = document.createElement("canvas");
  canvas.width = size.width;
  canvas.height = size.height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas isn't available.");
  context.fillStyle = "#FFFFFF";
  context.fillRect(0, 0, size.width, size.height);
  context.drawImage(bitmap, 0, 0, size.width, size.height);
  return canvas;
}

const toBlob = (canvas: HTMLCanvasElement, type: string, quality: number) =>
  new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality));

const toBase64 = (blob: Blob) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",")[1] ?? "");
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });

/**
 * Shrinks a pasted, dropped or chosen image in the browser before it's sent: long edge at most
 * MAX_EDGE, WebP (JPEG where the browser can't make WebP), lower quality if still too large.
 * Phone photos are turned upright; an animated GIF keeps its first frame.
 */
export async function prepareImage(file: Blob): Promise<PreparedImage> {
  if (!file.type.startsWith("image/")) throw new Error("not an image");
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  try {
    const canvas = draw(bitmap, MAX_EDGE);
    let blob: Blob | null = null;
    for (const quality of [0.85, 0.7, 0.55]) {
      blob = await toBlob(canvas, "image/webp", quality);
      if (!blob || blob.type !== "image/webp") blob = await toBlob(canvas, "image/jpeg", quality);
      if (blob && blob.size <= MAX_BYTES) break;
    }
    if (!blob || blob.size > MAX_BYTES) throw new Error("too large");
    const preview = draw(bitmap, THUMB_EDGE).toDataURL("image/jpeg", 0.7);
    return { media_type: blob.type === "image/webp" ? "image/webp" : "image/jpeg", data: await toBase64(blob), preview };
  } finally {
    bitmap.close();
  }
}
