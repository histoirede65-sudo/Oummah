export type HadithGradeKind = "sahih" | "hasan" | "daif" | "disputed" | "unclassified";

export function classifyHadithGrade(grade: string): HadithGradeKind {
  const normalized = grade.toLocaleLowerCase("fr");
  if (normalized.includes("authentique") || normalized.includes("authentic") || normalized.includes("sahih")) return "sahih";
  if (normalized.includes("bon") || normalized.includes("good") || normalized.includes("hasan")) return "hasan";
  if (normalized.includes("faible") || normalized.includes("weak") || normalized.includes("da'if") || normalized.includes("da‘if")) return "daif";
  if (normalized.includes("diverg") || normalized.includes("différ") || normalized.includes("disputed")) return "disputed";
  return "unclassified";
}

