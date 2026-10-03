#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildCoverageReport, buildImportPlan, parseImportFile } from './additive-science-pipeline.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const DEFAULT_REPORT = path.join(ROOT, 'scripts/output/additive-science-import-dry-run.json');
const KNOWN_CODES = new Set(JSON.parse(fs.readFileSync(path.join(ROOT, 'src/features/boycott/data/eu-additive-catalog.json'), 'utf8')).entries.map((entry) => entry.code));

function arg(name) { const index = process.argv.indexOf(name); return index >= 0 ? process.argv[index + 1] : undefined; }
function loadEnv() {
  const envPath = path.join(ROOT, '.env');
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (match && !process.env[match[1]]) process.env[match[1]] = match[2].replace(/^['\"]|['\"]$/g, '');
  }
}
async function readRemoteRows() {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL?.replace(/\/+$/, '');
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('Supabase read requires EXPO_PUBLIC_SUPABASE_URL and a key');
  const response = await fetch(`${url}/rest/v1/food_additive_science?select=*`, { headers: { apikey: key, Authorization: `Bearer ${key}`, Accept: 'application/json' } });
  if (!response.ok) throw new Error(`Supabase read failed: ${response.status} ${await response.text()}`);
  return response.json();
}
async function writeRow(row, existing) {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL?.replace(/\/+$/, '');
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('--apply requires SUPABASE_SERVICE_ROLE_KEY');
  const headers = { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' };
  const method = existing ? 'PATCH' : 'POST';
  const endpoint = existing ? `${url}/rest/v1/food_additive_science?code=eq.${encodeURIComponent(row.code)}` : `${url}/rest/v1/food_additive_science`;
  const response = await fetch(endpoint, { method, headers, body: JSON.stringify(row) });
  if (!response.ok) throw new Error(`${method} ${row.code} failed: ${response.status} ${await response.text()}`);
}

async function main() {
  loadEnv();
  const inputPath = path.resolve(arg('--input') ?? path.join(ROOT, 'scripts/data/additives-scientific-data.json'));
  const reportPath = path.resolve(arg('--report') ?? DEFAULT_REPORT);
  const records = parseImportFile(inputPath);
  if (!Array.isArray(records)) throw new Error('Input must be a JSON array, {records: []}, or CSV');
  const existingRows = await readRemoteRows();
  const plan = buildImportPlan(records, existingRows, KNOWN_CODES);
  const { validation, decisions } = plan;
  const existingByCode = new Map(existingRows.map((row) => [String(row.code).toUpperCase(), row]));
  const report = {
    mode: process.argv.includes('--apply') ? 'apply' : 'dry-run',
    input: inputPath,
    dryRun: !process.argv.includes('--apply'),
    validation: { valid: validation.valid.length, rejected: validation.rejected, incomplete: validation.incomplete },
    coverageBefore: buildCoverageReport(existingRows, [...KNOWN_CODES]),
    decisions: decisions.map(({ row, ...decision }) => decision),
    summary: {
      new: decisions.filter((item) => item.action === 'insert').length,
      updates: decisions.filter((item) => item.action === 'update').length,
      conflicts: decisions.filter((item) => item.action === 'conflict').length,
      skipped: decisions.filter((item) => item.action === 'skip').length,
      rejected: validation.rejected.length,
      incomplete: validation.incomplete.length,
    },
  };
  if (process.argv.includes('--apply')) {
    for (const item of decisions.filter((decision) => decision.action === 'insert' || decision.action === 'update')) await writeRow(item.row, existingByCode.get(item.code));
    report.writes = decisions.filter((item) => item.action === 'insert' || item.action === 'update').map((item) => item.code);
  }
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  console.log(JSON.stringify({ mode: report.mode, summary: report.summary, report: reportPath }, null, 2));
}
main().catch((error) => { console.error(error instanceof Error ? error.message : String(error)); process.exitCode = 1; });
