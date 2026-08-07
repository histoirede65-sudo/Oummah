import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

type JsonObject = Record<string, unknown>;
type Payload = { source: JsonObject; records: JsonObject[] };
type SourceCategory = {
  sourceCategoryId: string;
  sourceCategoryLabel: string;
  language: string;
  parentSourceCategoryId: string | null;
  sourceHadeethsCount: number | null;
  retrievedAt: string;
};
type CategoryIndex = Map<string, SourceCategory>;
type State = {
  payloadHash: string;
  recordCount: number;
  completedBatches: number[];
  updatedAt: string;
};

const DEFAULT_FILE = "scripts/hadith/data/hadeethenc-fr-v1.17.0.payload.json";
const DEFAULT_STATE_FILE = join(tmpdir(), "oummah-hadeethenc-category-import-state.json");
const DEFAULT_API = "https://hadeethenc.com/api/v1";
const MAX_BATCH_SIZE = 50;

function arg(name: string): string | null {
  const prefix = `--${name}=`;
  return process.argv.slice(2).find((value) => value.startsWith(prefix))?.slice(prefix.length) ?? null;
}

function flag(name: string): boolean {
  return process.argv.includes(`--${name}`);
}

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function positiveInt(value: string | null, fallback: number): number {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isSafeInteger(parsed) || parsed <= 0) throw new Error(`Valeur invalide pour --${value}: entier positif attendu.`);
  return parsed;
}

function sha256(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

function sleep(milliseconds: number): Promise<void> {
  return new Promise((resolvePromise) => setTimeout(resolvePromise, milliseconds));
}

async function fetchJson(url: string, timeoutMs: number, retries: number, delayMs: number): Promise<unknown> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(url, { headers: { Accept: "application/json" }, signal: controller.signal });
      const body = await response.text();
      if (response.status === 404) return { __notFound: true };
      if (!response.ok) {
        if (![408, 429, 500, 502, 503, 504].includes(response.status) || attempt >= retries) {
          throw new Error(`HadeethEnc HTTP ${response.status} pour ${url}`);
        }
        throw new Error(`retryable HTTP ${response.status}`);
      }
      try {
        return body ? JSON.parse(body) : null;
      } catch {
        throw new Error(`Réponse JSON invalide pour ${url}`);
      }
    } catch (error) {
      lastError = error;
      if (attempt >= retries) break;
      await sleep(Math.min(1000 * 2 ** attempt, 8000));
    } finally {
      clearTimeout(timer);
    }
    await sleep(delayMs);
  }
  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}

function categoryFromApi(value: unknown, index: CategoryIndex, retrievedAt: string): SourceCategory | null {
  const sourceCategoryId = typeof value === "object" && value !== null
    ? text((value as JsonObject).id ?? (value as JsonObject).category_id)
    : text(value);
  if (!sourceCategoryId) return null;
  const known = index.get(sourceCategoryId);
  if (known) return { ...known, retrievedAt };
  const object = typeof value === "object" && value !== null ? value as JsonObject : {};
  const label = text(object.title ?? object.name);
  if (!label) return null;
  const count = Number.parseInt(text(object.hadeeths_count ?? object.hadith_count), 10);
  return {
    sourceCategoryId,
    sourceCategoryLabel: label,
    language: "fr",
    parentSourceCategoryId: text(object.parent_id) || null,
    sourceHadeethsCount: Number.isSafeInteger(count) ? count : null,
    retrievedAt,
  };
}

async function loadCategoryIndex(apiBase: string, timeoutMs: number, retries: number, delayMs: number): Promise<CategoryIndex> {
  const result = await fetchJson(`${apiBase}/categories/list/?language=fr`, timeoutMs, retries, delayMs);
  if (!Array.isArray(result)) throw new Error("La réponse HadeethEnc categories/list n'est pas un tableau.");
  const index: CategoryIndex = new Map();
  const retrievedAt = new Date().toISOString();
  for (const item of result) {
    const category = categoryFromApi(item, new Map(), retrievedAt);
    if (category) index.set(category.sourceCategoryId, category);
  }
  return index;
}

function validatePayload(payload: Payload): void {
  if (!payload || typeof payload !== "object" || !payload.source || !Array.isArray(payload.records)) {
    throw new Error("Le payload doit contenir source et records[].");
  }
  const ids = new Set<string>();
  for (const [index, record] of payload.records.entries()) {
    const id = text(record.sourceHadithId);
    if (!id) throw new Error(`records[${index}].sourceHadithId est absent.`);
    if (ids.has(id)) throw new Error(`Identifiant HadeethEnc dupliqué: ${id}.`);
    ids.add(id);
  }
}

async function readState(file: string): Promise<State | null> {
  try {
    return JSON.parse(await readFile(file, "utf8")) as State;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw error;
  }
}

async function writeState(file: string, state: State): Promise<void> {
  await writeFile(file, JSON.stringify(state, null, 2), "utf8");
}

async function callRpc(url: string, key: string, payload: Payload, options: {
  timeoutMs: number; lifecycleAuthor: string; lifecycleJustification: string; lifecycleEvidence: string;
}): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), options.timeoutMs);
  try {
    const response = await fetch(`${url.replace(/\/+$/, "")}/rest/v1/rpc/import_hadeethenc_batch`, {
      method: "POST",
      headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        p_payload: payload,
        p_lifecycle_author: options.lifecycleAuthor,
        p_lifecycle_justification: options.lifecycleJustification,
        p_lifecycle_version: text(payload.source.corpusVersion),
        p_lifecycle_evidence: options.lifecycleEvidence,
      }),
      signal: controller.signal,
    });
    const body = await response.text();
    if (!response.ok) throw new Error(`RPC HTTP ${response.status}: ${body}`);
    return body ? JSON.parse(body) : null;
  } finally {
    clearTimeout(timer);
  }
}

function enrichedRecord(record: JsonObject, categories: SourceCategory[]): JsonObject {
  return {
    ...record,
    categories,
    // This runner deliberately does not forward OUMMAH theme assignments.
    themes: [],
  };
}

async function main(): Promise<void> {
  const url = text(process.env.SUPABASE_URL);
  const key = text(process.env.SUPABASE_SERVICE_ROLE_KEY);
  if (!url) throw new Error("SUPABASE_URL est obligatoire au moment de l'exécution.");
  if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY est obligatoire au moment de l'exécution.");
  if (/^(sb_anon_|sb_publishable_)/i.test(key)) throw new Error("Une clé anon/publishable est interdite pour cet import.");

  const file = resolve(arg("file") ?? DEFAULT_FILE);
  const raw = await readFile(file, "utf8");
  const payload = JSON.parse(raw) as Payload;
  validatePayload(payload);

  const timeoutMs = positiveInt(arg("timeout-ms"), 30000);
  const retries = positiveInt(arg("retries"), 3);
  const delayMs = Number.parseInt(arg("delay-ms") ?? "150", 10);
  if (!Number.isSafeInteger(delayMs) || delayMs < 0) throw new Error("--delay-ms doit être un entier positif ou nul.");
  const batchSize = Math.min(positiveInt(arg("batch-size"), 25), MAX_BATCH_SIZE);
  const apiBase = (arg("api-base") ?? DEFAULT_API).replace(/\/+$/, "");
  const stateFile = resolve(arg("state-file") ?? DEFAULT_STATE_FILE);
  const importMode = flag("import");
  const resume = flag("resume");
  const dryRun = flag("dry-run") || !importMode;

  if (importMode) {
    for (const [name, value] of [["--lifecycle-author", arg("lifecycle-author")], ["--lifecycle-justification", arg("lifecycle-justification")], ["--lifecycle-evidence", arg("lifecycle-evidence")]] as const) {
      if (!text(value)) throw new Error(`${name} est obligatoire avec --import.`);
    }
  }

  const categoryIndex = await loadCategoryIndex(apiBase, timeoutMs, retries, delayMs);
  const enriched: JsonObject[] = [];
  let notFound = 0;
  let recordsWithCategories = 0;
  let categoryLinks = 0;
  const uniqueCategories = new Set<string>();
  const warnings: string[] = [];

  for (let index = 0; index < payload.records.length; index += 1) {
    const record = payload.records[index];
    const id = text(record.sourceHadithId);
    const response = await fetchJson(`${apiBase}/hadeeths/one/?language=fr&id=${encodeURIComponent(id)}`, timeoutMs, retries, delayMs);
    if (typeof response === "object" && response !== null && (response as JsonObject).__notFound === true) {
      notFound += 1;
      warnings.push(`${id}: fiche HadeethEnc introuvable (404), aucune catégorie ajoutée.`);
      enriched.push(enrichedRecord(record, []));
      continue;
    }
    const responseObject = response && typeof response === "object" ? response as JsonObject : {};
    const rawCategories = Array.isArray(responseObject.categories) ? responseObject.categories : [];
    const retrievedAt = new Date().toISOString();
    const categories = rawCategories
      .map((category) => categoryFromApi(category, categoryIndex, retrievedAt))
      .filter((category): category is SourceCategory => category !== null)
      .filter((category, categoryIndexInRecord, all) => all.findIndex((item) => item.sourceCategoryId === category.sourceCategoryId) === categoryIndexInRecord);
    if (rawCategories.length !== categories.length) warnings.push(`${id}: catégorie officielle sans identifiant/libellé exploitable ignorée.`);
    if (categories.length > 0) recordsWithCategories += 1;
    categoryLinks += categories.length;
    categories.forEach((category) => uniqueCategories.add(category.sourceCategoryId));
    enriched.push(enrichedRecord(record, categories));
    if ((index + 1) % 50 === 0 || index + 1 === payload.records.length) console.log(`Catégories récupérées: ${index + 1}/${payload.records.length}`);
  }

  const enrichedPayload: Payload = { source: payload.source, records: enriched };
  const payloadHash = sha256(JSON.stringify(enrichedPayload));
  const batchCount = Math.ceil(enriched.length / batchSize);
  const previous = resume ? await readState(stateFile) : null;
  const completed = new Set<number>(previous && previous.payloadHash === payloadHash && previous.recordCount === enriched.length ? previous.completedBatches : []);
  const rpcResults: unknown[] = [];

  if (!dryRun) {
    for (let batchIndex = 0; batchIndex < batchCount; batchIndex += 1) {
      if (completed.has(batchIndex)) continue;
      const batch: Payload = { source: enrichedPayload.source, records: enriched.slice(batchIndex * batchSize, (batchIndex + 1) * batchSize) };
      rpcResults.push(await callRpc(url, key, batch, {
        timeoutMs,
        lifecycleAuthor: text(arg("lifecycle-author")),
        lifecycleJustification: text(arg("lifecycle-justification")),
        lifecycleEvidence: text(arg("lifecycle-evidence")),
      }));
      completed.add(batchIndex);
      await writeState(stateFile, { payloadHash, recordCount: enriched.length, completedBatches: [...completed].sort((a, b) => a - b), updatedAt: new Date().toISOString() });
      console.log(`Lot RPC terminé: ${batchIndex + 1}/${batchCount}`);
    }
  }

  console.log(JSON.stringify({
    mode: dryRun ? "dry-run" : "import",
    records: enriched.length,
    detailsFetched: enriched.length - notFound,
    notFound,
    recordsWithCategories,
    uniqueCategories: uniqueCategories.size,
    categoryLinksPrepared: categoryLinks,
    batches: batchCount,
    batchesCompleted: completed.size,
    rpcCalls: rpcResults.length,
    warnings,
  }, null, 2));
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
