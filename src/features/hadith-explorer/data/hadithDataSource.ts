import type { Hadith, HadithSummary } from "../domain/Hadith";
import { classifyHadithGrade } from "../domain/HadithGrade";

const API_ROOT = "https://hadeethenc.com/api/v1";

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

async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(`${API_ROOT}${path}`);
  if (!response.ok) throw new Error(`HadeethEnc: ${response.status}`);
  return response.json() as Promise<T>;
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

