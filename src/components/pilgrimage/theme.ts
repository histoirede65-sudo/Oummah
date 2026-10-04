import { typography } from "../../theme/typography";

/** Hajj & ‘Umra: night ink, sand and gold. Opaque surfaces, white text. */
export const pil = {
  bg: "#0C0A12",
  surface: "#17131F",
  surfaceHigh: "#211B2C",
  line: "rgba(255,255,255,0.09)",
  gold: "#E8BB62",
  goldDeep: "#C9973F",
  goldSoft: "rgba(232,187,98,0.15)",
  goldLine: "rgba(232,187,98,0.40)",
  text: "#FFFFFF",
  textSoft: "rgba(255,255,255,0.88)",
  muted: "rgba(255,255,255,0.66)",
  green: "#7BD4A8",
  greenSoft: "rgba(123,212,168,0.15)",
  red: "#F2A59B",
  redSoft: "rgba(242,165,155,0.12)",
  sand: "#F3E3C3",
  ink: "#1B1208",
} as const;

export const pilType = {
  display: { fontFamily: typography.serifSemibold },
  arabic: { fontFamily: "UthmanicHafs" },
  sans: { fontFamily: typography.sans },
} as const;
