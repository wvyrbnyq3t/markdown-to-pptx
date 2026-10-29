import paths from "./materialIconPaths.json";
import license from "../../../public/licenses/material-icons-LICENSE.txt?raw";
import notice from "../../../public/licenses/material-icons-NOTICE.txt?raw";

const icons: Readonly<Record<string, string>> = paths;
export const MATERIAL_ICON_NAMES = Object.keys(paths).sort();
export const MATERIAL_ICONS_LICENSE = `${notice}\n\n${license}`;

/** Google Material Icons（Filled）の名前。未登録名はhelp_outlineへ置換する。 */
export function materialIconPath(name: string): string {
  const normalized = name.trim().toLowerCase();
  return Object.hasOwn(icons, normalized) ? icons[normalized] : icons.help_outline;
}

/** 表示とPPTXで同じ輪郭を使用。外部通信やフォントのインストールは不要。 */
export function materialIconData(name: string, color: string): string {
  const fill = /^#?[\da-f]{6}$/i.test(color) ? `#${color.replace('#', '')}` : '#000000';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 24 24"><path fill="${fill}" d="${materialIconPath(name)}"/></svg>`;
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}
