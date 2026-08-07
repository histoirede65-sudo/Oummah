import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { validateCorpus, type ValidationCorpus } from "../validation-engine.ts";

type RawHadith = {
  hadithnumber?: number;
  arabicnumber?: number;
  text?: string;
  grades?: unknown[];
  reference?: { book?: number; hadith?: number };
};

type RawEdition = {
  metadata?: unknown;
  hadiths?: RawHadith[];
};

const ROOT = dirname(fileURLToPath(import.meta.url));
const ARABIC_FILE = resolve(ROOT, "nawawi-ara-v1.json");
const FRENCH_FILE = resolve(ROOT, "nawawi-fra-v1.json");
const ARABIC_URL = "https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions/ara-nawawi.json";
const FRENCH_URL = "https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions/fra-nawawi.json";
const SOURCE_NAME = "fawazahmed0/hadith-api";
const COLLECTION_NAME = "Les 40 hadiths d’An-Nawawi";
const VERSION = "fawazahmed0-hadith-api@1:nawawi:ara+fra";
const RETRIEVED_AT = "2026-07-31";

const text = (value: unknown): string => typeof value === "string" ? value : "";
const hash = (bytes: Buffer): string => createHash("sha256").update(bytes).digest("hex");

function readEdition(raw: string, file: string): { bytes: Buffer; edition: RawEdition; hadiths: RawHadith[] } {
  const bytes = Buffer.from(raw, "utf8");
  const edition = JSON.parse(raw) as RawEdition;
  if (!Array.isArray(edition.hadiths)) throw new Error(`${file}: hadiths[] absent`);
  return { bytes, edition, hadiths: edition.hadiths };
}

function indexByNumber(items: RawHadith[], language: string): Map<number, RawHadith> {
  const result = new Map<number, RawHadith>();
  for (const [index, item] of items.entries()) {
    if (!Number.isInteger(item.hadithnumber)) throw new Error(`${language}[${index}]: hadithnumber invalide`);
    if (result.has(item.hadithnumber as number)) throw new Error(`${language}: doublon hadithnumber=${item.hadithnumber}`);
    result.set(item.hadithnumber as number, item);
  }
  return result;
}

function normalize(arabicRaw: string, frenchRaw: string) {
  const arabic = readEdition(arabicRaw, "ara-nawawi.json");
  const french = readEdition(frenchRaw, "fra-nawawi.json");
  const arabicByNumber = indexByNumber(arabic.hadiths, "arabic");
  const frenchByNumber = indexByNumber(french.hadiths, "french");
  const numbers = Array.from({ length: 42 }, (_, index) => index + 1);
  const errors: string[] = [];
  const hadiths = numbers.map((number) => {
    const ar = arabicByNumber.get(number);
    const fr = frenchByNumber.get(number);
    if (!ar) errors.push(`arabic: numéro manquant ${number}`);
    if (!fr) errors.push(`french: numéro manquant ${number}`);
    if (!ar || !fr) return null;
    if (ar.hadithnumber !== fr.hadithnumber) errors.push(`hadithnumber non aligné ${number}`);
    if (ar.reference?.hadith !== fr.reference?.hadith) errors.push(`reference.hadith non alignée ${number}`);
    if (!text(ar.text).trim()) errors.push(`texte arabe vide ${number}`);
    if (!text(fr.text).trim()) errors.push(`texte français vide ${number}`);
    return {
      sourceHadithId: `nawawi:${number}`,
      globalNumber: number,
      book: { number: 1, sourceId: "nawawi:book:1", titleArabic: "الأربعون النووية", titleFrench: COLLECTION_NAME },
      chapter: { number: 1, sourceId: "nawawi:section:1", titleArabic: "الأربعون النووية", titleFrench: COLLECTION_NAME },
      hadithNumberInBook: number,
      arabicText: text(ar.text),
      narrator: null,
      chainText: null,
      authenticityGrade: null,
      sourceReference: null,
      translationFrench: {
        text: text(fr.text),
        translator: null,
        sourceName: SOURCE_NAME,
        sourceUrl: FRENCH_URL,
        sourceReference: null,
        license: null,
        verificationStatus: "unverified",
      },
      explanationFrench: null,
      lessonsFrench: [],
    };
  }).filter((item): item is NonNullable<typeof item> => item !== null);

  const metadata = {
    repository: SOURCE_NAME,
    version: "@1",
    retrievedAt: RETRIEVED_AT,
    files: {
      arabic: { url: ARABIC_URL, sha256: hash(arabic.bytes) },
      french: { url: FRENCH_URL, sha256: hash(french.bytes) },
    },
    note: "La traduction française n’indique pas clairement son traducteur dans le JSON source.",
  };
  return {
    source: { name: SOURCE_NAME, url: "https://github.com/fawazahmed0/hadith-api", license: null, corpusVersion: VERSION, importedAt: RETRIEVED_AT },
    collection: { sourceId: "nawawi", nameArabic: "الأربعون النووية", nameFrench: COLLECTION_NAME },
    metadataPolicy: "source_limited" as const,
    hadiths,
    metadata,
    validation: {
      arabicTexts: hadiths.filter((item) => item.arabicText.trim()).length,
      frenchTranslations: hadiths.filter((item) => item.translationFrench?.text.trim()).length,
      numbers: hadiths.map((item) => item.hadithNumberInBook),
      duplicateNumbers: [],
      missingNumbers: numbers.filter((number) => !arabicByNumber.has(number) || !frenchByNumber.has(number)),
      emptyTexts: hadiths.filter((item) => !item.arabicText.trim() || !item.translationFrench?.text.trim()).map((item) => item.hadithNumberInBook),
      mismatches: errors,
      errors,
    },
  };
}

async function main(): Promise<void> {
  const [arabicRaw, frenchRaw] = await Promise.all([readFile(ARABIC_FILE, "utf8"), readFile(FRENCH_FILE, "utf8")]);
  const payload = normalize(arabicRaw, frenchRaw);
  const validationCorpus: ValidationCorpus = {
    structure: "structured_collection",
    metadataPolicy: payload.metadataPolicy,
    collectionId: payload.collection.sourceId,
    source: payload.source.name,
    version: payload.source.corpusVersion,
    license: payload.source.license,
    hadiths: payload.hadiths.map((item) => ({
      structure: "structured_collection",
      sourceHadithId: item.sourceHadithId,
      collectionId: payload.collection.sourceId,
      bookId: item.book.sourceId,
      bookNumber: item.book.number,
      bookName: item.book.titleFrench,
      chapterId: item.chapter.sourceId,
      chapterNumber: item.chapter.number,
      chapterTitle: item.chapter.titleFrench,
      globalNumber: item.globalNumber,
      hadithNumberInBook: item.hadithNumberInBook,
      arabicText: item.arabicText,
      narrator: item.narrator,
      chainText: item.chainText,
      authenticityGrade: item.authenticityGrade,
      source: payload.source.name,
      sourceReference: item.sourceReference,
      version: payload.source.corpusVersion,
      license: payload.source.license,
      translationFrench: {
        text: item.translationFrench.text,
        source: item.translationFrench.sourceName,
        version: VERSION,
        license: item.translationFrench.license,
      },
    })),
  };
  const validation = validateCorpus(validationCorpus);
  await writeFile(resolve(ROOT, "nawawi-normalized-payload.json"), `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  await writeFile(resolve(ROOT, "nawawi-validation-report.json"), `${JSON.stringify({ ...payload.metadata, metadataPolicy: validation.metadataPolicy, validation: payload.validation, engineValidation: validation, tableRows: { hadith_sources: 1, hadith_source_versions: 1, hadith_collections: 1, hadith_books: 1, hadith_chapters: 1, hadiths: 42, hadith_translations_fr: 42, hadith_explanations: 0, hadith_lessons: 0 }, canImport: validation.canImport }, null, 2)}\n`, "utf8");
  await writeFile(resolve(ROOT, "nawawi-normalized-preview.json"), `${JSON.stringify(payload.hadiths.filter((item) => [1, 2, 42].includes(item.hadithNumberInBook)), null, 2)}\n`, "utf8");
  console.log(JSON.stringify(validation, null, 2));
  if (!validation.canImport) process.exitCode = 1;
}

if (process.argv[1]?.endsWith("nawawi-import.ts")) void main();

export { normalize };
