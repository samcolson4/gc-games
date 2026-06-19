export const colors = {
  ink: "#121212",
  body: "#1a1a1a",
  soft: "#333333",
  meta: "#5a5a5a",
  meta2: "#6b6b6b",
  meta3: "#7a7a7a",
  faintLabel: "#9a9a9a",
  rank: "#b0b0b0",
  ruleStrong: "#121212",
  rule: "#e2e2e2",
  ruleFaint: "#ececec",
  inputBorder: "#cfcfcf",
  accent: "#d0021b",
  paper: "#ffffff",
  inputFocus: "#f7f4ec",
  sepiaPaper: "#f6f1e6",
  sepiaFocus: "#efe7d4",
} as const;

export const fonts = {
  masthead: "'Cloister Black', serif",
  serif: "'Libre Caslon Text', Georgia, serif",
  numbers: "Georgia, serif",
  franklin: "'Libre Franklin', sans-serif",
} as const;

export const layout = {
  maxWidth: 1180,
  sidePadding: 40,
  railWidth: 312,
  gridGap: 48,
  collapseBreakpoint: 860,
} as const;

export type ThemeMode = "newsprint" | "sepia";

export function getThemeColors(mode: ThemeMode) {
  if (mode === "sepia") {
    return { ...colors, paper: colors.sepiaPaper, inputFocus: colors.sepiaFocus };
  }
  return colors;
}
