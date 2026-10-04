import { createHadithPreview } from "../presentation/hadithPreview";

/** HadeethEnc wraps grades and references in brackets ("[Authentique]"): shown without them. */
export function cleanHadithLabel(value: string | undefined | null) {
  const trimmed = (value ?? "").trim();
  const match = /^\[([\s\S]*)\]$/.exec(trimmed);
  return (match ? match[1] : trimmed).trim();
}

const UNKNOWN_ATTRIBUTION = /^attribution (non précisée|not specified)$/i;
const MISSING_REFERENCE = /^(référence détaillée non fournie|detailed reference not provided)$/i;

export function knownAttribution(value: string | undefined | null) {
  const clean = cleanHadithLabel(value);
  return clean && !UNKNOWN_ATTRIBUTION.test(clean) ? clean : "";
}

export function knownReference(value: string | undefined | null) {
  const clean = cleanHadithLabel(value);
  return clean && !MISSING_REFERENCE.test(clean) ? clean : "";
}

/** Some records carry their reference ("[Rapporté par Muslim]") as title: that is not a title. */
export function isReferenceTitle(title: string | undefined | null, reference?: string | null) {
  const clean = cleanHadithLabel(title);
  if (!clean || clean === "Hadith") return true;
  if (reference && clean === cleanHadithLabel(reference)) return true;
  return /^(rapporté par|reported by|narrated by)\b/i.test(clean);
}

/** A readable title: the record's own title, or else the opening words of the hadith. */
export function hadithDisplayTitle(item: { title?: string | null; reference?: string | null; french?: string | null; excerpt?: string | null }) {
  if (!isReferenceTitle(item.title, item.reference)) return cleanHadithLabel(item.title);
  const text = item.excerpt || item.french;
  return text ? createHadithPreview(text).title : cleanHadithLabel(item.title) || "Hadith";
}
