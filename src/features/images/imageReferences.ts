const ASSET_REFERENCE = /^asset:([a-zA-Z0-9_-]{1,80})$/;

export function imageIdFromSource(source: string): string | null {
  return ASSET_REFERENCE.exec(source)?.[1] ?? null;
}

/** 改行・角括弧をエスケープして、画像名がMarkdown構文を壊さないようにする。 */
export function createImageMarkdown(assetId: string, alt: string): string {
  const escapedAlt = alt.replace(/[\r\n]+/g, " ").replace(/[\\[\]]/g, "\\$&");
  return `![${escapedAlt}](asset:${assetId})`;
}
