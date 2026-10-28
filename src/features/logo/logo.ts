import type { PresentationSettings } from "../../types/settings";
import { SLIDE_WIDTH, SLIDE_HEIGHT } from "../../types/slide";
import { prepareImageAsset, imageToPptxData } from "../images/imageFiles";

export const MAX_LOGO_BYTES = 512 * 1024;
export interface LogoSettings {
  isEnabled: boolean;
  position: "left" | "right";
  size: number;
  dataUrl: string;
  fileName: string;
}
export const DEFAULT_LOGO: LogoSettings = {
  isEnabled: false, position: "right", size: 120, dataUrl: "", fileName: "",
};

/** 外部URLは受け付けず、PNGの署名とIHDRから寸法を読み取る。 */
export function pngDimensions(dataUrl: unknown): { width: number; height: number } | null {
  if (typeof dataUrl !== "string" || dataUrl.length > Math.ceil(MAX_LOGO_BYTES / 3) * 4 + 22 ||
      !/^data:image\/png;base64,[A-Za-z0-9+/]+={0,2}$/.test(dataUrl)) return null;
  try {
    const bytes = Uint8Array.from(atob(dataUrl.slice(22)), (char) => char.charCodeAt(0));
    if (bytes.length < 33 || ![137,80,78,71,13,10,26,10].every((byte, i) => bytes[i] === byte) ||
        String.fromCharCode(...bytes.slice(12, 16)) !== "IHDR") return null;
    const view = new DataView(bytes.buffer);
    const width = view.getUint32(16), height = view.getUint32(20);
    return width > 0 && height > 0 && width * height <= 40_000_000 ? { width, height } : null;
  } catch { return null; }
}

export async function readLogoFile(file: File): Promise<Pick<LogoSettings, "dataUrl" | "fileName">> {
  if (file.size > MAX_LOGO_BYTES) throw new Error("ロゴは512KB以内のPNGを選択してください。");
  const image = await prepareImageAsset(file);
  if (image.mimeType !== "image/png") throw new Error("ロゴにはPNGファイルを選択してください。");
  return { dataUrl: await imageToPptxData(image.blob), fileName: file.name };
}

/** プレビュー・発表・PPTXで共通の配置。縦長のロゴは高さ200px以内に収める。 */
export function logoLayout(settings: PresentationSettings) {
  const dimensions = pngDimensions(settings.logo.dataUrl);
  if (!settings.logo.isEnabled || !dimensions) return null;
  const scale = Math.min(settings.logo.size / dimensions.width, 200 / dimensions.height,
    (SLIDE_WIDTH - settings.margin * 2) / dimensions.width,
    (SLIDE_HEIGHT - settings.margin * 2) / dimensions.height);
  const width = dimensions.width * scale, height = dimensions.height * scale;
  const gap = settings.gap * 3;
  return {
    width, height, y: settings.margin,
    x: settings.logo.position === "left" ? settings.margin : SLIDE_WIDTH - settings.margin - width,
    titleX: settings.margin + (settings.logo.position === "left" ? width + gap : 0),
    titleWidth: SLIDE_WIDTH - settings.margin * 2 - width - gap,
  };
}
