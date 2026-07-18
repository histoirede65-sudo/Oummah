// @ts-ignore -- Supabase Edge utilise des imports Deno avec extension TypeScript.
import {
  handleGet,
  json,
  RequestError,
} from "../_shared/http.ts";

// @ts-ignore -- Supabase Edge utilise des imports Deno avec extension TypeScript.
import { serve } from "../_shared/runtime.ts";

const DEFAULT_SOURCE = "french_mokhtasar";
const QURAN_ENC_BASE_URL = "https://quranenc.com/api/v1";

type QuranEncAya = {
  sura?: number | string;
  surah?: number | string;
  sura_number?: number | string;
  chapter?: number | string;
  aya?: number | string;
  ayah?: number | string;
  aya_number?: number | string;
  verse?: number | string;
  verse_number?: number | string;
  translation?: string;
  tafsir?: string;
  explanation?: string;
  text?: string;
  footnotes?: string;
};

function getPositiveInteger(...values: unknown[]) {
  for (const value of values) {
    const parsed = Number(value);

    if (Number.isInteger(parsed) && parsed > 0) {
      return parsed;
    }
  }

  return undefined;
}

function getText(value: unknown) {
  return typeof value === "string" && value.trim()
    ? value.trim()
    : undefined;
}

function getAyaExplanation(aya: QuranEncAya) {
  return (
    getText(aya.translation) ??
    getText(aya.tafsir) ??
    getText(aya.explanation) ??
    getText(aya.text)
  );
}

function findAya(
  payload: unknown,
  requestedChapter: number,
  requestedVerse: number,
): QuranEncAya | undefined {
  const pending: unknown[] = [payload];
  const visited = new Set<object>();

  while (pending.length > 0) {
    const current = pending.shift();

    if (Array.isArray(current)) {
      pending.push(...current);
      continue;
    }

    if (!current || typeof current !== "object") {
      continue;
    }

    if (visited.has(current)) {
      continue;
    }

    visited.add(current);

    const record = current as Record<string, unknown>;
    const aya = record as QuranEncAya;

    const chapterNumber = getPositiveInteger(
      aya.sura,
      aya.surah,
      aya.sura_number,
      aya.chapter,
    );

    const verseNumber = getPositiveInteger(
      aya.aya,
      aya.ayah,
      aya.aya_number,
      aya.verse,
      aya.verse_number,
    );

    const hasExplanation = Boolean(getAyaExplanation(aya));

    const chapterMatches =
      chapterNumber === undefined ||
      chapterNumber === requestedChapter;

    const verseMatches =
      verseNumber === undefined ||
      verseNumber === requestedVerse;

    if (
      hasExplanation &&
      chapterMatches &&
      verseMatches
    ) {
      return aya;
    }

    for (const value of Object.values(record)) {
      if (value && typeof value === "object") {
        pending.push(value);
      }
    }
  }

  return undefined;
}

async function fetchJson(url: string) {
  const response = await fetch(url, {
    method: "GET",
    redirect: "follow",
    headers: {
      Accept: "application/json",
    },
  });

  const body = await response.text();

  let payload: unknown;

  try {
    payload = body ? JSON.parse(body) : undefined;
  } catch {
    payload = undefined;
  }

  return {
    response,
    payload,
    body,
  };
}

async function fetchAya(
  source: string,
  chapterNumber: number,
  verseNumber: number,
) {
  const ayaUrl =
    `${QURAN_ENC_BASE_URL}/translation/aya/` +
    `${encodeURIComponent(source)}/` +
    `${chapterNumber}/${verseNumber}`;

  try {
    const result = await fetchJson(ayaUrl);

    if (result.response.ok) {
      const aya = findAya(
        result.payload,
        chapterNumber,
        verseNumber,
      );

      if (aya) {
        return aya;
      }
    }

    console.warn(
      `[quran-tafsir] Endpoint aya en échec : ` +
        `${result.response.status} ${ayaUrl}`,
    );
  } catch (error) {
    console.warn(
      "[quran-tafsir] Erreur endpoint aya",
      error instanceof Error
        ? error.message
        : error,
    );
  }

  /*
   * Solution de secours :
   * on récupère toute la sourate puis on sélectionne
   * le verset demandé.
   */
  const suraUrl =
    `${QURAN_ENC_BASE_URL}/translation/sura/` +
    `${encodeURIComponent(source)}/` +
    `${chapterNumber}`;

  try {
    const result = await fetchJson(suraUrl);

    if (!result.response.ok) {
      console.error(
        `[quran-tafsir] Endpoint sourate en échec : ` +
          `${result.response.status} ${suraUrl}`,
      );

      return undefined;
    }

    return findAya(
      result.payload,
      chapterNumber,
      verseNumber,
    );
  } catch (error) {
    console.error(
      "[quran-tafsir] Erreur endpoint sourate",
      error instanceof Error
        ? error.message
        : error,
    );

    return undefined;
  }
}

serve(
  handleGet(async (request) => {
    const { searchParams } = new URL(request.url);

    const verseKey =
      searchParams.get("verse_key")?.trim();

    if (
      !verseKey ||
      !/^\d{1,3}:\d{1,3}$/.test(verseKey)
    ) {
      throw new RequestError(
        "Paramètre verse_key invalide",
      );
    }

    const [chapterNumber, verseNumber] =
      verseKey.split(":").map(Number);

    if (
      !Number.isInteger(chapterNumber) ||
      chapterNumber < 1 ||
      chapterNumber > 114 ||
      !Number.isInteger(verseNumber) ||
      verseNumber < 1
    ) {
      throw new RequestError(
        "Identifiant de verset invalide",
      );
    }

    const source =
      searchParams.get("source")?.trim() ||
      DEFAULT_SOURCE;

    if (!/^[a-z0-9_]+$/.test(source)) {
      throw new RequestError(
        "Source du tafsir invalide",
      );
    }

    const aya = await fetchAya(
      source,
      chapterNumber,
      verseNumber,
    );

    const explanation = aya
      ? getAyaExplanation(aya)
      : undefined;

    if (!aya || !explanation) {
      throw new RequestError(
        `Tafsir indisponible pour le verset ${verseKey}`,
        404,
      );
    }

    const footnotes = getText(aya.footnotes);

    return json({
      verseKey,
      source,
      resourceName:
        "Résumé de l’Exégèse du noble Coran — Al-Mukhtasar",
      languageName: "french",
      text: footnotes
        ? `${explanation}\n\n${footnotes}`
        : explanation,
    });
  }),
);