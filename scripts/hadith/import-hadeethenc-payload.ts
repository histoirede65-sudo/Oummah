import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

type JsonObject = Record<string, unknown>;
type Payload = { source: JsonObject; records: JsonObject[] };

const MAX_BATCH = 50;
const TIMEOUT_MS = 30_000;
const STATE_FILE = ".hadeethenc-import-state.json";

function arg(name: string): string | null {
  const prefix = `--${name}=`;
  return process.argv.slice(2).find((value) => value.startsWith(prefix))?.slice(prefix.length) ?? null;
}

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function sha256(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

function validate(payload: Payload): string[] {
  const errors: string[] = [];
  const ids = new Set<string>();

  if (!payload || typeof payload !== "object") return ["Payload JSON invalide."];
  if (!payload.source || typeof payload.source !== "object" || Array.isArray(payload.source)) {
    errors.push("source doit être un objet.");
  }
  if (!Array.isArray(payload.records)) return ["records doit être un tableau."];
  if (!text(payload.source?.name)) errors.push("source.name est vide.");
  if (!text(payload.source?.officialUrl) && !text(payload.source?.url)) errors.push("source.officialUrl/source.url est vide.");
  if (!text(payload.source?.attribution)) errors.push("source.attribution est vide.");
  if (!text(payload.source?.corpusVersion)) errors.push("source.corpusVersion est vide.");

  payload.records.forEach((record, index) => {
    if (!record || typeof record !== "object" || Array.isArray(record)) {
      errors.push(`records[${index}] doit être un objet.`);
      return;
    }
    const id = text(record.sourceHadithId);
    if (!id) errors.push(`records[${index}].sourceHadithId est vide.`);
    if (ids.has(id)) errors.push(`Identifiant dupliqué: ${id}.`);
    ids.add(id);
    if (!text(record.hadeethAr)) errors.push(`${id || index}: texte arabe vide.`);
    if (!text(record.hadeeth)) errors.push(`${id || index}: traduction française vide.`);
    if (!text(record.explanation)) errors.push(`${id || index}: explication française vide.`);
    if (!/^[0-9a-f]{64}$/.test(text(record.documentHash))) errors.push(`${id || index}: hash documentaire invalide.`);
    for (const field of ["hints", "hintsAr", "wordsMeaningsAr", "categories", "themes"]) {
      const value = record[field];
      if (value !== null && value !== undefined && !Array.isArray(value)) {
        errors.push(`${id || index}: ${field} doit être un tableau ou null.`);
      }
    }
  });

  return errors;
}

function batches<T>(rows: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let index = 0; index < rows.length; index += size) result.push(rows.slice(index, index + size));
  return result;
}

function environmentValue(name: string): string {
  const direct = process.env[name];
  if (typeof direct === "string" && direct.trim()) return direct.trim();
  const matchingKey = Object.keys(process.env).find((key) => key.toUpperCase() === name.toUpperCase());
  const matchingValue = matchingKey ? process.env[matchingKey] : undefined;
  return typeof matchingValue === "string" ? matchingValue.trim() : "";
}

function environmentDiagnostic(): string {
  const names = Object.keys(process.env)
    .filter((name) => /SUPABASE|NODE_ENV|TERM_PROGRAM/i.test(name))
    .sort()
    .map((name) => {
      const value = process.env[name] ?? "";
      return `${name}=${/KEY|SECRET|TOKEN/i.test(name) ? `<redacted length=${value.length}>` : JSON.stringify(value)}`;
    });
  return [
    `platform=${process.platform}`,
    `node=${process.version}`,
    `execPath=${process.execPath}`,
    `cwd=${process.cwd()}`,
    `argv=${JSON.stringify(process.argv)}`,
    `environmentKeys=${names.length ? names.join(", ") : "<none>"}`,
    `SUPABASE_URL length=${environmentValue("SUPABASE_URL").length}`,
    `SUPABASE_SERVICE_ROLE_KEY length=${environmentValue("SUPABASE_SERVICE_ROLE_KEY").length}`,
  ].join("\n");
}

async function rpc(url: string, key: string, payload: Payload, lifecycle: Record<string, string>): Promise<unknown> {
  const endpoint = `${url.replace(/\/+$/, "")}/rest/v1/rpc/import_hadeethenc_batch`;
  if (!/^https:\/\//i.test(endpoint)) throw new Error(`Endpoint Supabase invalide: ${endpoint}`);
  if (!key.trim()) throw new Error("SUPABASE_SERVICE_ROLE_KEY est vide.");
  if (/^(sb_publishable_|sb_anon_)/i.test(key)) {
    throw new Error("La clé fournie n'est pas une clé service_role. Utilisez une clé secrète sb_secret_... ou l'ancienne clé service_role JWT.");
  }
  try {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      p_payload: payload,
      p_lifecycle_author: lifecycle.author,
      p_lifecycle_justification: lifecycle.justification,
      p_lifecycle_version: text(payload.source.corpusVersion),
      p_lifecycle_evidence: lifecycle.evidence,
    }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  const body = await response.text();
  if (!response.ok) throw new Error(`HTTP ${response.status} ${response.statusText}: ${body}`);
  try { return body ? JSON.parse(body) : null; } catch { throw new Error(`Réponse JSON invalide: ${body}`); }
  } catch (error: unknown) {
    const details = error instanceof Error ? `${error.name}: ${error.message}${error.cause ? ` | cause=${formatCause(error.cause)}` : ""}` : String(error);
    throw new Error(`Échec réseau RPC import_hadeethenc_batch\nEndpoint: ${endpoint}\nCause complète: ${details}`);
  }
}

function formatCause(cause: unknown): string {
  if (cause instanceof Error) return `${cause.name}: ${cause.message}${cause.cause ? ` | cause=${formatCause(cause.cause)}` : ""}`;
  if (typeof cause === "object" && cause !== null) { try { return JSON.stringify(cause); } catch { return String(cause); } }
  return String(cause);
}

async function main(): Promise<void> {
  const file = resolve(arg("file") ?? "scripts/hadith/data/hadeethenc-fr-v1.17.0.payload.json");
  const shouldImport = process.argv.includes("--import");
  const dryRun = process.argv.includes("--dry-run") || !shouldImport;
  const raw = await readFile(file, "utf8");
  const payload = JSON.parse(raw) as Payload;
  const errors = validate(payload);

  const report = {
    file,
    payloadSha256: sha256(raw),
    records: payload.records.length,
    arabic: payload.records.filter((r) => text(r.hadeethAr)).length,
    french: payload.records.filter((r) => text(r.hadeeth)).length,
    explanations: payload.records.filter((r) => text(r.explanation)).length,
    benefits: payload.records.filter((r) => Array.isArray(r.hints) && r.hints.length > 0).length,
    mode: dryRun ? "dry-run" : "import",
    errors,
  };
  console.log(JSON.stringify(report, null, 2));
  if (errors.length) throw new Error(`Validation échouée: ${errors.length} erreur(s).`);
  if (dryRun) return;

  const url = arg("supabase-url") ?? process.env.SUPABASE_URL;
  const key = arg("service-role-key") ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  const lifecycle = {
    author: arg("lifecycle-author") ?? "",
    justification: arg("lifecycle-justification") ?? "",
    evidence: arg("lifecycle-evidence") ?? "",
  };
  if (!url || !key) {
    throw new Error(`SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont obligatoires.\nDiagnostic process.env:\n${environmentDiagnostic()}`);
  }
  if (!lifecycle.author || !lifecycle.justification || !lifecycle.evidence) {
    throw new Error("Contexte lifecycle incomplet. Aucun import n'a été lancé.");
  }

  const chunks = batches(payload.records, MAX_BATCH);
  let completedBatches = 0;
  try {
    const state = JSON.parse(await readFile(STATE_FILE, "utf8")) as { payloadSha256?: string; completedBatches?: number };
    if (state.payloadSha256 === sha256(raw)) completedBatches = Number(state.completedBatches ?? 0);
  } catch { completedBatches = 0; }
  for (const [index, records] of chunks.entries()) {
    if (index < completedBatches) {
      console.log(JSON.stringify({ batch: index + 1, skipped: true }, null, 2));
      continue;
    }
    const result = await rpc(url, key, { source: payload.source, records }, lifecycle);
    console.log(JSON.stringify({ batch: index + 1, totalBatches: chunks.length, records: records.length, result }, null, 2));
    await writeFile(STATE_FILE, JSON.stringify({ payloadSha256: sha256(raw), completedBatches: index + 1, totalBatches: chunks.length }, null, 2), "utf8");
  }
  await writeFile(STATE_FILE, JSON.stringify({ payloadSha256: sha256(raw), completedBatches: chunks.length, totalBatches: chunks.length, completedAt: new Date().toISOString() }, null, 2), "utf8");
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
