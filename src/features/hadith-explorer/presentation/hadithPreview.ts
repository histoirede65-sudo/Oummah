export type HadithPreview = { title: string; subtitle: string };

function splitAtWord(text: string, limit: number) {
  if (text.length <= limit) return [text, ""] as const;
  const candidate = text.slice(0, limit + 1);
  const cut = Math.max(candidate.lastIndexOf(" "), Math.floor(limit * 0.72));
  return [text.slice(0, cut).trim(), text.slice(cut).trim()] as const;
}

export function createHadithPreview(text: string): HadithPreview {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (!normalized) return { title: "Hadith", subtitle: "" };

  const opening = normalized.search(/[«“\"]/);
  if (opening >= 0) {
    const opener = normalized[opening];
    const closer = opener === "«" ? "»" : opener === "“" ? "”" : "\"";
    const closing = normalized.indexOf(closer, opening + 1);
    const quotation = normalized.slice(opening + 1, closing >= 0 ? closing : undefined).trim();
    const continuation = closing >= 0 ? normalized.slice(closing + 1).trim() : "";
    const [title, quotationRemainder] = splitAtWord(quotation, 105);
    return {
      title,
      subtitle: [quotationRemainder, continuation].filter(Boolean).join(" ").slice(0, 220).trim(),
    };
  }

  const [title, subtitle] = splitAtWord(normalized, 105);
  return { title, subtitle: subtitle.slice(0, 220).trim() };
}
