import type { Hadith, HadithSummary } from "../domain/Hadith";
import { classifyHadithGrade } from "../domain/HadithGrade";

const API_ROOT = "https://hadeethenc.com/api/v1";
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim().replace(/\/$/, "");
const SUPABASE_KEY = (process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY)?.trim();
const SUPABASE_VIEW = "hadith_published_translations";

type ApiSummary = { id?: string | number; title?: string; translations?: string[] };
type ApiList = { data?: ApiSummary[] } | ApiSummary[];
type ApiHadith = {
  id?: string | number;
  title?: string;
  hadeeth?: string;
  hadeeth_ar?: string;
  attribution?: string;
  grade?: string;
  explanation?: string;
  hints?: string[];
  categories?: (string | number)[];
  reference?: string;
};

type SupabaseRow = {
  hadith_id: string;
  language_code?: string | null;
  arabic_text?: string | null;
  narrator?: string | null;
  authenticity_grade?: string | null;
  source_reference?: string | null;
  translation_text?: string | null;
  source_name?: string | null;
  source_url?: string | null;
  corpus_version?: string | null;
};

type SupabaseMetadata = {
  hadith_id: string;
  explanation_french?: string | null;
  hints_french?: string[] | null;
};

export type SupabaseSourceCategory = {
  id: string;
  language_code?: string | null;
  source_category_label?: string | null;
};

export type SupabaseSourceCategoryAssignment = {
  hadith_id: string;
  source_category_id: string;
};

async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(`${API_ROOT}${path}`);
  if (!response.ok) throw new Error(`HadeethEnc: ${response.status}`);
  return response.json() as Promise<T>;
}

async function getSupabaseFrom<T>(resource: string, query: string): Promise<T> {
  console.log("[Hadith Supabase Request]", {
    resource,
    query,
    url: `${SUPABASE_URL}/rest/v1/${resource}?${query}`,
  });
  if (!SUPABASE_URL || !SUPABASE_KEY) throw new Error("Supabase Hadith non configuré.");
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${resource}?${query}`, {
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, Accept: "application/json" },
  });
  if (!response.ok) {
    const body = await response.text();
    console.error("[Hadith Supabase HTTP]", {
      resource,
      url: `${SUPABASE_URL}/rest/v1/${resource}?${query}`,
      status: response.status,
      statusText: response.statusText,
      body,
    });
    throw new Error(`Supabase ${resource}: ${response.status}`);
  }
  console.log("[Hadith Supabase OK]", { resource, status: response.status });
  return response.json() as Promise<T>;
}

async function getSupabase<T>(query: string): Promise<T> {
  return getSupabaseFrom<T>(SUPABASE_VIEW, query);
}

function supabaseRowToSummary(row: SupabaseRow): HadithSummary {
  return { id: row.hadith_id, title: row.source_reference?.trim() || "Hadith", translations: [row.language_code ?? "fr"] };
}

function supabaseRowToHadith(row: SupabaseRow): Hadith {
  const grade = row.authenticity_grade?.trim() || "Non classé";
  return {
    id: row.hadith_id,
    title: row.source_reference?.trim() || "Hadith",
    arabic: row.arabic_text?.trim() || "",
    french: row.translation_text?.trim() || "",
    attribution: row.narrator?.trim() || "Attribution non précisée",
    grade,
    gradeKind: classifyHadithGrade(grade),
    explanation: "",
    lessons: [],
    categories: [],
    reference: row.source_reference?.trim() || "Référence détaillée non fournie",
    sourceName: "HadeethEnc",
    sourceUrl: row.source_url?.trim() || `https://hadeethenc.com/fr/browse/hadith/${encodeURIComponent(row.hadith_id)}`,
    sourceVersion: "Flux API courant",
  };
}

export async function fetchSupabaseHadith(id: string): Promise<Hadith> {
  let internalHadithId = id;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
    const sourceRows = await getSupabaseFrom<{ id: string }[]>("hadiths", `select=id&source_hadith_id=eq.${encodeURIComponent(id)}&limit=1`);
    if (!sourceRows[0]) throw new Error("Hadith Supabase introuvable.");
    internalHadithId = sourceRows[0].id;
  }
  const rows = await getSupabase<SupabaseRow[]>(`select=hadith_id,arabic_text,narrator,authenticity_grade,source_reference,translation_text,source_name,source_url,corpus_version&hadith_id=eq.${encodeURIComponent(internalHadithId)}&language_code=eq.fr&limit=1`);
  if (!rows[0]) throw new Error("Hadith Supabase introuvable.");
  const value = supabaseRowToHadith(rows[0]);
  try {
    const metadata = await getSupabaseFrom<SupabaseMetadata[]>("hadith_documentary_metadata", `select=hadith_id,explanation_french,hints_french&hadith_id=eq.${encodeURIComponent(internalHadithId)}&limit=1`);
    if (metadata[0]) {
      value.explanation = metadata[0].explanation_french?.trim() || "";
      value.lessons = Array.isArray(metadata[0].hints_french) ? metadata[0].hints_french.filter(Boolean) : [];
    }
  } catch {
    // The canonical published view remains sufficient for the core detail.
  }
  return value;
}

export async function fetchSupabaseCollectionPage(sourceReferences: readonly string[], offset: number, limit: number, collectionId?: string): Promise<HadithSummary[]> {
  const collectionFilter = collectionId === "nawawi" ? "&corpus_version=eq.fawazahmed0-hadith-api%401%3Anawawi%3Aara%2Bfra" : "";
  const rows = await getSupabase<SupabaseRow[]>(`select=hadith_id,source_reference&language_code=eq.fr${collectionFilter}&order=hadith_id&offset=${offset}&limit=${limit}`);
  const normalizedReferences = sourceReferences.map((reference) => normalizeCollectionReference(reference));
  if (collectionId === "nawawi") return rows.map(supabaseRowToSummary);
  return rows
    .filter((row) => {
      const sourceReference = normalizeCollectionReference(row.source_reference ?? "");
      return normalizedReferences.some((reference) => sourceReference.includes(reference) || reference.includes(sourceReference));
    })
    .map(supabaseRowToSummary);
}

export async function fetchPublishedCollectionAvailability(
  collections: readonly { id: string; query: string; queryAliases?: readonly string[] }[],
): Promise<Set<string>> {
  const rows = await getSupabase<{ source_reference?: string | null }[]>(
    "select=source_reference&source_reference=not.is.null&limit=10000",
  );
  const normalizedCollections = collections.map((collection) => ({
    id: collection.id,
    references: [collection.query, ...(collection.queryAliases ?? [])].map(normalizeCollectionReference),
  }));
  const available = new Set<string>();
  for (const row of rows) {
    const reference = normalizeCollectionReference(row.source_reference ?? "");
    for (const collection of normalizedCollections) {
      if (collection.references.some((candidate) => reference.includes(candidate) || candidate.includes(reference))) {
        available.add(collection.id);
      }
    }
  }
  return available;
}

function normalizeCollectionReference(value: string): string {
  return value
    .toLocaleLowerCase("fr")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "")
    .replace(/^(sahih|sunan|jami|musnad)/, "");
}

export async function fetchSupabaseSourceCategories(): Promise<SupabaseSourceCategory[]> {
  const rows = await getSupabaseFrom<SupabaseSourceCategory[]>("hadith_source_categories",
    "select=id,language_code,source_category_label&language_code=eq.fr&order=id&limit=1000",
  );
  console.log("[Hadith categories]", { count: rows.length });
  return rows;
}

export async function fetchSupabaseSourceCategoryAssignments(
  categoryIds: readonly string[],
  hadithIds: readonly string[],
): Promise<SupabaseSourceCategoryAssignment[]> {
  if (!categoryIds.length) return [];
  const categories = `(${categoryIds.join(",")})`;
  if (!hadithIds.length) {
    const query = `select=hadith_id,source_category_id&source_category_id=in.${categories}&validation_status=eq.validated&limit=10000`;
    return getSupabaseFrom<SupabaseSourceCategoryAssignment[]>("hadith_source_category_assignments", query);
  }

  const categoryIdSet = new Set(categoryIds);
  const rows: SupabaseSourceCategoryAssignment[] = [];
  for (let index = 0; index < hadithIds.length; index += 10) {
    const batch = hadithIds.slice(index, index + 10);
    const query = `select=hadith_id,source_category_id&hadith_id=in.(${batch.join(",")})&validation_status=eq.validated&limit=10000`;
    const batchRows = await getSupabaseFrom<SupabaseSourceCategoryAssignment[]>("hadith_source_category_assignments", query);
    rows.push(...batchRows.filter((row) => categoryIdSet.has(row.source_category_id)));
  }
  return rows;
}

function summaries(payload: ApiList): HadithSummary[] {
  const rows = Array.isArray(payload) ? payload : payload.data ?? [];
  return rows
    .filter((row) => row.id != null && row.title)
    .map((row) => ({ id: String(row.id), title: row.title ?? "", translations: row.translations ?? [] }));
}

export async function fetchHadith(id: string): Promise<Hadith> {
  const item = await getJson<ApiHadith>(`/hadeeths/one/?language=fr&id=${encodeURIComponent(id)}`);
  const grade = item.grade?.trim() || "Non classé";
  return {
    id: String(item.id ?? id),
    title: item.title?.trim() || "Hadith",
    arabic: item.hadeeth_ar?.trim() || "",
    french: item.hadeeth?.trim() || "",
    attribution: item.attribution?.trim() || "Attribution non précisée",
    grade,
    gradeKind: classifyHadithGrade(grade),
    explanation: item.explanation?.trim() || "",
    lessons: (item.hints ?? []).filter(Boolean),
    categories: (item.categories ?? []).map(String),
    reference: item.reference?.trim() || "Référence détaillée non fournie",
    sourceName: "HadeethEnc",
    sourceUrl: `https://hadeethenc.com/fr/browse/hadith/${encodeURIComponent(String(item.id ?? id))}`,
    sourceVersion: "Flux API courant",
  };
}

export async function searchHadiths(phrase: string): Promise<HadithSummary[]> {
  const payload = await getJson<ApiList>(`/hadeeths/search/?language=fr&phrase=${encodeURIComponent(phrase)}`);
  return summaries(payload);
}

export async function searchSupabaseHadiths(phrase: string): Promise<HadithSummary[]> {
  const value = encodeURIComponent(`*${phrase.trim()}*`);
  const rows = await getSupabase<SupabaseRow[]>(`select=hadith_id,source_reference,language_code&language_code=eq.fr&translation_text=ilike.${value}&limit=10000`);
  return rows.map(supabaseRowToSummary);
}

export async function fetchHadithPage(page = 1, perPage = 20, categoryId = "5"): Promise<HadithSummary[]> {
  const payload = await getJson<ApiList>(`/hadeeths/list/?language=fr&category_id=${encodeURIComponent(categoryId)}&page=${page}&per_page=${perPage}`);
  return summaries(payload);
}
