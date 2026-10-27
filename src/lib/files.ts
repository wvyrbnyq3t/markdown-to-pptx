export function downloadText(filename: string, text: string, mimeType = "text/plain;charset=utf-8"): void {
  const blob = new Blob([text], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function readTextFile(file: File): Promise<string> {
  return file.text();
}

export function sanitizeFilename(filename: string): string {
  return filename.trim().replace(/[\\/:*?"<>|\x00-\x1f]/g, "_").slice(0, 120) || "presentation";
}
