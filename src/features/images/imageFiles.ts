import type { ImageAsset, ImageMimeType } from "../../types/image";

export const IMAGE_ACCEPT = "image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp";
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const MAX_IMAGE_PIXELS = 40_000_000;

function imageMimeType(bytes: Uint8Array): ImageMimeType | null {
  if ([137, 80, 78, 71, 13, 10, 26, 10].every((byte, index) => bytes[index] === byte)) return "image/png";
  if (bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255) return "image/jpeg";
  const header = String.fromCharCode(...bytes);
  if (header.startsWith("RIFF") && header.slice(8, 12) === "WEBP") return "image/webp";
  return null;
}

async function withDecodedImage<T>(blob: Blob, useImage: (image: HTMLImageElement) => T | Promise<T>): Promise<T> {
  const url = URL.createObjectURL(blob);
  try {
    const image = new Image();
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error("画像を読み込めませんでした。画像ファイルが破損していないか確認してください。"));
      image.src = url;
    });
    return await useImage(image);
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** 拡張子だけに頼らず、実際のファイル形式と画像サイズを確認する。 */
export async function prepareImageAsset(file: File): Promise<ImageAsset> {
  if (file.size === 0) throw new Error(`${file.name}: 空のファイルは追加できません。`);
  if (file.size > MAX_IMAGE_BYTES) throw new Error(`${file.name}: 画像は1枚10MB以内にしてください。`);
  const mimeType = imageMimeType(new Uint8Array(await file.slice(0, 12).arrayBuffer()));
  if (!mimeType) throw new Error(`${file.name}: PNG・JPEG・WebP形式の画像を選択してください。`);
  const blob = file.slice(0, file.size, mimeType);
  const size = await withDecodedImage(blob, (image) => ({ width: image.naturalWidth, height: image.naturalHeight }));
  if (size.width <= 0 || size.height <= 0 || size.width * size.height > MAX_IMAGE_PIXELS) {
    throw new Error(`${file.name}: 画像サイズが大きすぎます。4,000万画素以内にしてください。`);
  }
  return { id: crypto.randomUUID(), name: file.name, mimeType, ...size, createdAt: Date.now(), blob };
}

function readAsDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => typeof reader.result === "string"
      ? resolve(reader.result)
      : reject(new Error("画像データを変換できませんでした。"));
    reader.onerror = () => reject(reader.error ?? new Error("画像データを読み込めませんでした。"));
    reader.onabort = () => reject(new Error("画像の読み込みが中断されました。"));
    reader.readAsDataURL(blob);
  });
}

/** PowerPointで扱いやすいよう、WebPだけPNGへ変換して埋め込む。 */
export async function imageToPptxData(blob: Blob): Promise<string> {
  if (blob.type !== "image/webp") return readAsDataUrl(blob);
  const png = await withDecodedImage(blob, (image) => new Promise<Blob>((resolve, reject) => {
    const canvas = document.createElement("canvas");
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    const context = canvas.getContext("2d");
    if (!context) { reject(new Error("画像をPNGに変換できませんでした。")); return; }
    context.drawImage(image, 0, 0);
    canvas.toBlob((result) => result ? resolve(result) : reject(new Error("画像をPNGに変換できませんでした。")), "image/png");
  }));
  return readAsDataUrl(png);
}
