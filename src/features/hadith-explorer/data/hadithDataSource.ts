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

async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(`${API_ROOT}${path}`);
  if (!response.ok) throw new Error(`HadeethEnc: ${response.status}`);
  return response.json() as Promise<T>;
}

async function getSupabase<T>(query: string): Promise<T> {
  if (!SUPABASE_URL || !SUPABASE_KEY) throw new Error("Supabase Hadith non configuré.");
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${SUPABASE_VIEW}?${query}`, {
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, Accept: "application/json" },
  });
  if (!response.ok) throw new Error(`Supabase Hadith: ${response.status}`);
  return response.json() as Promise<T>;
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
  const rows = await getSupabase<SupabaseRow[]>(`select=hadith_id,arabic_text,narrator,authenticity_grade,source_reference,translation_text,source_name,source_url,corpus_version&hadith_id=eq.${encodeURIComponent(id)}&language_code=eq.fr&limit=1`);
  if (!rows[0]) throw new Error("Hadith Supabase introuvable.");
  const value = supabaseRowToHadith(rows[0]);
  try {
    const metadata = await getSupabase<SupabaseMetadata[]>(`select=hadith_id,explanation_french,hints_french&hadith_id=eq.${encodeURIComponent(id)}&limit=1`);
    if (metadata[0]) {
      value.explanation = metadata[0].explanation_french?.trim() || "";
      value.lessons = Array.isArray(metadata[0].hints_french) ? metadata[0].hints_french.filter(Boolean) : [];
    }
  } catch {
    // The canonical published view remains sufficient for the core detail.
  }
  return value;
}

export async function fetchSupabaseCollectionPage(sourceReferences: readonly string[], offset: number, limit: number): Promise<HadithSummary[]> {
  const filters = sourceReferences.map((reference) => `source_reference.ilike.*${reference}*`).join(",");
  const rows = await getSupabase<SupabaseRow[]>(`select=hadith_id,source_reference&language_code=eq.fr&or=${encodeURIComponent(`(${filters})`)}&order=hadith_id&offset=${offset}&limit=${limit}`);
  return rows.map(supabaseRowToSummary);
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

export async function fetchHadithPage(page = 1, perPage = 20, categoryId = "5"): Promise<HadithSummary[]> {
  const payload = await getJson<ApiList>(`/hadeeths/list/?language=fr&category_id=${encodeURIComponent(categoryId)}&page=${page}&per_page=${perPage}`);
  return summaries(payload);
}
