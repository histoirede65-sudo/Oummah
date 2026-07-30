import { createHash } from "node:crypto";
import { appendFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

type JsonObject = Record<string, unknown>;
type Payload = { source: JsonObject; records: JsonObject[] };

type ImportOptions = {
  file: string;
  importMode: boolean;
  resume: boolean;
  batchSize: number;
  timeoutMs: number;
  retries: number;
  reportFile: string;
  checkpointFile: string;
  lifecycleAuthor: string;
  lifecycleJustification: string;
  lifecycleEvidence: string;
};

type BatchResult = {
  batch: number;
  records: number;
  attempt: number;
  result: unknown;
};

const MAX_RPC_BATCH = 50;

function getArg(name: string): string | null {
  const prefix = `--${name}=`;
  return process.argv.slice(2).find((value) => value.startsWith(prefix))?.slice(prefix.length) ?? null;
}

function hasFlag(name: string): boolean {
  return process.argv.includes(`--${name}`);
}

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function positiveInt(value: string | null, fallback: number): number {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isSafeInteger(parsed) || parsed <= 0) {
    throw new Error(`Valeur invalide: ${value}`);
  }
  return parsed;
}

function sha256(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

function validate(payload: Payload): string[] {
  const errors: string[] = [];
  const ids = new Set<string>();

  if (!payload || typeof payload !== "object") return ["Payload JSON invalide."];
  if (!payload.source || typeof payload.source !== "object") errors.push("source doit être un objet.");
  if (!Array.isArray(payload.records)) return [...errors, "records doit être un tableau."];

  const source = payload.source ?? {};
  for (const field of ["name", "officialUrl", "corpusVersion", "attribution"] as const) {
    if (!text(source[field])) errors.push(`source.${field} est vide.`);
  }

  payload.records.forEach((record, index) => {
    const id = text(record.sourceHadithId);
    const prefix = id || `records[${index}]`;

    if (!id) errors.push(`records[${index}].sourceHadithId est vide.`);
    if (id && ids.has(id)) errors.push(`Identifiant dupliqué: ${id}.`);
    if (id) ids.add(id);

    if (!text(record.sourceUrl)) errors.push(`${prefix}: sourceUrl vide.`);
    if (!text(record.title)) errors.push(`${prefix}: titre français vide.`);
    if (!text(record.hadeethAr)) errors.push(`${prefix}: texte arabe vide.`);
    if (!text(record.hadeeth)) errors.push(`${prefix}: traduction française vide.`);
    if (!text(record.explanation)) errors.push(`${prefix}: explication française vide.`);
    if (!text(record.sourceReference)) errors.push(`${prefix}: sourceReference vide.`);
    if (!/^[0-9a-f]{64}$/.test(text(record.documentHash))) {
      errors.push(`${prefix}: documentHash SHA-256 invalide.`);
    }
    if (record.categories != null && !Array.isArray(record.categories)) {
      errors.push(`${prefix}: categories doit être un tableau ou null.`);
    }
    if (record.themes != null && !Array.isArray(record.themes)) {
      errors.push(`${prefix}: themes doit être un tableau ou null.`);
    }
  });

  return errors;
}

function chunk<T>(rows: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let index = 0; index < rows.length; index += size) {
    result.push(rows.slice(index, index + size));
  }
  return result;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolvePromise) => setTimeout(resolvePromise, ms));
}

async function ensureParent(file: string): Promise<void> {
  await mkdir(dirname(file), { recursive: true });
}

async function readCheckpoint(file: string): Promise<number> {
  try {
    const raw = await readFile(file, "utf8");
    const parsed = JSON.parse(raw) as { completedBatches?: unknown };
    return typeof parsed.completedBatches === "number" ? parsed.completedBatches : 0;
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === "ENOENT") return 0;
    throw error;
  }
}

async function writeCheckpoint(file: string, completedBatches: number, totalBatches: number): Promise<void> {
  await ensureParent(file);
  await writeFile(
    file,
    JSON.stringify({ completedBatches, totalBatches, updatedAt: new Date().toISOString() }, null, 2),
    "utf8",
  );
}

async function callRpc(
  url: string,
  serviceRoleKey: string,
  payload: Payload,
  options: ImportOptions,
): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), options.timeoutMs);

  try {
    const response = await fetch(`${url.replace(/\/+$/, "")}/rest/v1/rpc/import_hadeethenc_batch`, {
      method: "POST",
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        "Content-Type": "application/json",
      },
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
    if (!response.ok) {
      throw new Error(`RPC import_hadeethenc_batch ${response.status}: ${body}`);
    }
    return body ? JSON.parse(body) : null;
  } finally {
    clearTimeout(timer);
  }
}

async function importBatchWithRetry(
  batchNumber: number,
  url: string,
  serviceRoleKey: string,
  payload: Payload,
  options: ImportOptions,
): Promise<BatchResult> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= options.retries + 1; attempt += 1) {
    try {
      const result = await callRpc(url, serviceRoleKey, payload, options);
      return { batch: batchNumber, records: payload.records.length, attempt, result };
    } catch (error) {
      lastError = error;
      if (attempt > options.retries) break;
      const waitMs = Math.min(1_000 * 2 ** (attempt - 1), 8_000);
      console.warn(`Lot ${batchNumber}: tentative ${attempt} échouée, nouvel essai dans ${waitMs} ms.`);
      await sleep(waitMs);
    }
  }

  throw lastError;
}

function optionsFromArgs(): ImportOptions {
  const file = resolve(getArg("file") ?? "scripts/hadith/data/hadeethenc-fr-v1.17.0.payload.json");
  const reportFile = resolve(getArg("report") ?? "scripts/hadith/reports/hadeethenc-import.ndjson");
  const checkpointFile = resolve(getArg("checkpoint") ?? "scripts/hadith/reports/hadeethenc-checkpoint.json");
  const batchSize = Math.min(positiveInt(getArg("batch-size"), MAX_RPC_BATCH), MAX_RPC_BATCH);

  return {
    file,
    importMode: hasFlag("import"),
    resume: hasFlag("resume"),
    batchSize,
    timeoutMs: positiveInt(getArg("timeout-ms"), 45_000),
    retries: positiveInt(getArg("retries"), 3),
    reportFile,
    checkpointFile,
    lifecycleAuthor: getArg("lifecycle-author") ?? "",
    lifecycleJustification: getArg("lifecycle-justification") ?? "",
    lifecycleEvidence: getArg("lifecycle-evidence") ?? "",
  };
}

async function main(): Promise<void> {
  const options = optionsFromArgs();
  const raw = await readFile(options.file, "utf8");
  const payload = JSON.parse(raw) as Payload;
  const errors = validate(payload);

  const validationReport = {
    file: options.file,
    payloadSha256: sha256(raw),
    records: payload.records.length,
    arabic: payload.records.filter((record) => text(record.hadeethAr)).length,
    french: payload.records.filter((record) => text(record.hadeeth)).length,
    explanations: payload.records.filter((record) => text(record.explanation)).length,
    benefits: payload.records.filter((record) => Array.isArray(record.hints) && record.hints.length > 0).length,
    mode: options.importMode ? "import" : "validation-only",
    errors,
  };

  console.log(JSON.stringify(validationReport, null, 2));
  if (errors.length > 0) {
    throw new Error(`Validation échouée: ${errors.length} erreur(s). Aucun import lancé.`);
  }
  if (!options.importMode) return;

  const url = text(process.env.SUPABASE_URL);
  const serviceRoleKey = text(process.env.SUPABASE_SERVICE_ROLE_KEY);
  if (!url || !serviceRoleKey) {
    throw new Error("SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont obligatoires pour --import.");
  }
  if (!options.lifecycleAuthor || !options.lifecycleJustification || !options.lifecycleEvidence) {
    throw new Error(
      "Contexte lifecycle incomplet: --lifecycle-author, --lifecycle-justification et --lifecycle-evidence sont obligatoires.",
    );
  }

  await ensureParent(options.reportFile);
  const batches = chunk(payload.records, options.batchSize);
  const completedBeforeStart = options.resume ? await readCheckpoint(options.checkpointFile) : 0;

  console.log(
    JSON.stringify(
      {
        totalBatches: batches.length,
        batchSize: options.batchSize,
        resumeFromBatch: completedBeforeStart + 1,
      },
      null,
      2,
    ),
  );

  for (let index = completedBeforeStart; index < batches.length; index += 1) {
    const batchNumber = index + 1;
    const result = await importBatchWithRetry(
      batchNumber,
      url,
      serviceRoleKey,
      { source: payload.source, records: batches[index] },
      options,
    );

    const reportRow = { ...result, importedAt: new Date().toISOString() };
    console.log(JSON.stringify(reportRow, null, 2));
    await appendFile(options.reportFile, `${JSON.stringify(reportRow)}\n`, "utf8");
    await writeCheckpoint(options.checkpointFile, batchNumber, batches.length);
  }

  console.log(
    JSON.stringify(
      {
        status: "completed",
        records: payload.records.length,
        batches: batches.length,
        reportFile: options.reportFile,
        checkpointFile: options.checkpointFile,
      },
      null,
      2,
    ),
  );
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
