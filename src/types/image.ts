/** 画像の実体はIndexedDBだけに保存し、Markdownにはidを記録する。 */
export type ImageMimeType = "image/png" | "image/jpeg" | "image/webp";

export interface ImageAsset {
  id: string;
  name: string;
  mimeType: ImageMimeType;
  width: number;
  height: number;
  createdAt: number;
  blob: Blob;
}
