import JSZip from "jszip";
import type { ImageAsset } from "../../types/image";
import type { PresentationSettings } from "../../types/settings";
import { normalizeSettings } from "../../lib/settingsFile";
import { parseMarkdown, referencedImageIds, remapImageReferences } from "../markdown/parseMarkdown";
import { getImageAsset, saveImageAssets } from "../images/imageStore";
import { prepareImageAsset } from "../images/imageFiles";
import { imageIdFromSource } from "../images/imageReferences";

const PROJECT_FORMAT = "pon-slide-project";
const PROJECT_VERSION = 1;
const MAX_PROJECT_BYTES = 100 * 1024 * 1024;
const MAX_TEXT_BYTES = 5 * 1024 * 1024;
const MAX_PROJECT_IMAGES = 100;

export interface ProjectContent {
  markdown: string;
  settings: PresentationSettings;
  filename: string;
}

interface ProjectImage { id: string; name: string; path: string }
interface ProjectManifest {
  format: typeof PROJECT_FORMAT;
  version: typeof PROJECT_VERSION;
  filename: string;
  settings: PresentationSettings;
  images: ProjectImage[];
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseManifest(value: unknown): ProjectManifest {
  if (!isObject(value) || value.format !== PROJECT_FORMAT || value.version !== PROJECT_VERSION ||
      typeof value.filename !== "string" || !isObject(value.settings) || !Array.isArray(value.images) || value.images.length > MAX_PROJECT_IMAGES) {
    throw new Error("ポンっ！の画像込みZIPファイルを選択してください。");
  }
  const ids = new Set<string>();
  const images: ProjectImage[] = value.images.map((image: unknown) => {
    if (!isObject(image) || typeof image.id !== "string" || !imageIdFromSource(`asset:${image.id}`) ||
        typeof image.name !== "string" || typeof image.path !== "string" ||
        !["png", "jpg", "webp"].some((extension) => image.path === `assets/${image.id}.${extension}`) || ids.has(image.id)) {
      throw new Error("ZIP内の画像情報が不正です。");
    }
    ids.add(image.id);
    return { id: image.id, name: image.name, path: image.path };
  });
  return { format: PROJECT_FORMAT, version: PROJECT_VERSION, filename: value.filename, settings: normalizeSettings(value.settings), images };
}

/** Markdown・設定・参照中の画像だけを、ひとつのZIPにまとめる。 */
export async function createProjectArchive(project: ProjectContent): Promise<Blob> {
  const zip = new JSZip();
  const ids = referencedImageIds(parseMarkdown(project.markdown));
  if (ids.length > MAX_PROJECT_IMAGES) throw new Error("画像込みZIPは100枚以内に分けて保存してください。");
  let totalBytes = new Blob([project.markdown]).size;
  if (totalBytes > MAX_TEXT_BYTES) throw new Error("Markdownは5MB以内にしてください。");
  const images: ProjectImage[] = [];
  for (const id of ids) {
    const image = await getImageAsset(id);
    if (!image) throw new Error(`画像「${id}」が見つかりません。画像を再挿入してから保存してください。`);
    totalBytes += image.blob.size;
    if (totalBytes > MAX_PROJECT_BYTES) throw new Error("画像込みZIPは合計100MB以内にしてください。");
    const extension = image.mimeType === "image/jpeg" ? "jpg" : image.mimeType === "image/webp" ? "webp" : "png";
    const path = `assets/${id}.${extension}`;
    zip.file(path, await image.blob.arrayBuffer());
    images.push({ id, name: image.name, path });
  }
  const manifest: ProjectManifest = {
    format: PROJECT_FORMAT, version: PROJECT_VERSION,
    filename: project.filename, settings: project.settings, images,
  };
  zip.file("project.json", JSON.stringify(manifest, null, 2));
  zip.file("slides.md", project.markdown);
  return zip.generateAsync({ type: "blob", compression: "STORE" });
}

async function readTextEntry(zip: JSZip, path: string): Promise<string> {
  const entry = zip.file(path);
  if (!entry) throw new Error(`ZIP内に${path}がありません。`);
  const bytes = await entry.async("uint8array");
  if (bytes.byteLength > MAX_TEXT_BYTES) throw new Error(`${path}が大きすぎます。`);
  return new TextDecoder().decode(bytes);
}

/** 全画像を検証してから一括保存する。既存文書の画像と衝突しないようIDは振り直す。 */
export async function importProjectArchive(file: File): Promise<ProjectContent> {
  if (file.size > MAX_PROJECT_BYTES + MAX_TEXT_BYTES) throw new Error("画像込みZIPは100MB程度までにしてください。");
  let zip: JSZip;
  try { zip = await JSZip.loadAsync(await file.arrayBuffer()); }
  catch { throw new Error("ZIPファイルを読み込めませんでした。ファイルが破損していないか確認してください。"); }
  if (Object.keys(zip.files).length > 250) throw new Error("ZIP内のファイル数が多すぎます。");
  let manifest: ProjectManifest;
  try { manifest = parseManifest(JSON.parse(await readTextEntry(zip, "project.json"))); }
  catch (error) {
    if (error instanceof SyntaxError) throw new Error("ZIP内のproject.jsonが不正です。");
    throw error;
  }
  const markdown = await readTextEntry(zip, "slides.md");
  const ids = referencedImageIds(parseMarkdown(markdown));
  const entries = new Map(manifest.images.map((image) => [image.id, image]));
  const assets: ImageAsset[] = [];
  const idMap = new Map<string, string>();
  let totalBytes = new Blob([markdown]).size;
  for (const id of ids) {
    const metadata = entries.get(id);
    const entry = metadata ? zip.file(metadata.path) : null;
    if (!entry || !metadata) throw new Error(`ZIP内に画像「${id}」がありません。`);
    const bytes = await entry.async("uint8array");
    totalBytes += bytes.byteLength;
    if (totalBytes > MAX_PROJECT_BYTES) throw new Error("展開後の画像とMarkdownは合計100MB以内にしてください。");
    const asset = await prepareImageAsset(new File([Uint8Array.from(bytes).buffer], metadata.name));
    assets.push(asset);
    idMap.set(id, asset.id);
  }
  const remappedMarkdown = remapImageReferences(markdown, idMap);
  await saveImageAssets(assets);
  return { markdown: remappedMarkdown, settings: manifest.settings, filename: manifest.filename };
}
