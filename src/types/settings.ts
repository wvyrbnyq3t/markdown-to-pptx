export interface PresentationSettings {
  margin: number;
  gap: number;
  fontSize: {
    title: number;
    subTitle: number;
    text: number;
    code: number;
    formula: number;
  };
  color: {
    primary: string;
    secondary: string;
    text: string;
    accent: string;
    tableHeader: string;
  };
  pageNumber: { isEnabled: boolean; fontSize: number };
  pageTitle: {
    isEnabled: boolean;
    title: { content: string; fontSize: number };
    subTitle: { content: string; fontSize: number };
  };
}

export const DEFAULT_SETTINGS: PresentationSettings = {
  margin: 64,
  gap: 8,
  fontSize: { title: 56, subTitle: 40, text: 40, code: 26, formula: 48 },
  color: {
    primary: "#2563EB",
    secondary: "#1E293B",
    text: "#1E293B",
    accent: "#2563EB",
    tableHeader: "#1E293B",
  },
  pageNumber: { isEnabled: true, fontSize: 20 },
  pageTitle: {
    isEnabled: true,
    title: { content: "プレゼンテーション", fontSize: 96 },
    subTitle: { content: "", fontSize: 48 },
  },
};
