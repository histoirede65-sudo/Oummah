import { Share } from "react-native";
import type { Hadith } from "../domain/Hadith";

export type HadithShareContent = "arabic" | "french" | "both";
export function hadithShareText(hadith: Hadith, content: HadithShareContent, includeSource = true) {
  const body = content === "arabic" ? hadith.arabic : content === "french" ? hadith.french : [hadith.arabic, hadith.french].filter(Boolean).join("\n\n");
  return `${body}${includeSource ? `\n\n${hadith.attribution}\n${hadith.grade}\n${hadith.reference}\nSource : HadeethEnc — ${hadith.sourceUrl}` : ""}`;
}
export function shareHadithText(hadith: Hadith, content: HadithShareContent = "both", includeSource = true) { return Share.share({ message: hadithShareText(hadith, content, includeSource) }); }
