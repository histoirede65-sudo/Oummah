#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildCoverageReport } from './additive-science-pipeline.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const REPORT = path.join(ROOT, 'scripts/output/food-additive-science-coverage.json');
const PRIORITY_REPORT = path.join(ROOT, 'scripts/output/scientific-profile-priority.json');
const SNAPSHOT_PATH = path.join(ROOT, 'src/features/boycott/data/eu-additive-catalog.json');
function loadCatalog() { return JSON.parse(fs.readFileSync(SNAPSHOT_PATH, 'utf8')); }
function catalogFunctionCounts() {
  const counts = {};
  for (const entry of loadCatalog().entries) for (const category of entry.functionCategories ?? []) counts[category] = (counts[category] ?? 0) + 1;
  return counts;
}
function loadEnv() {
  const file = path.join(ROOT, '.env');
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) { const match = line.match(/^([A-Z0-9_]+)=(.*)$/); if (match && !process.env[match[1]]) process.env[match[1]] = match[2].replace(/^['\"]|['\"]$/g, ''); }
}
async function main() {
  loadEnv();
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL?.replace(/\/+$/, '');
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('Supabase configuration missing');
  const response = await fetch(`${url}/rest/v1/food_additive_science?select=*`, { headers: { apikey: key, Authorization: `Bearer ${key}`, Accept: 'application/json' } });
  if (!response.ok) throw new Error(`Supabase read failed: ${response.status} ${await response.text()}`);
  const rows = await response.json();
  const catalog = loadCatalog();
  const knownCodes = catalog.entries.map((entry) => entry.code);
  const coverage = buildCoverageReport(rows, knownCodes);
  const incompleteCodes = new Set(coverage.incompleteCodes);
  const missingCodes = new Set(coverage.missingKnownCodes);
  const priorityEntries = catalog.entries
    .filter((entry) => entry.canonicalNameFr || entry.canonicalNameEn)
    .filter((entry) => incompleteCodes.has(entry.code) || missingCodes.has(entry.code))
    .map((entry) => ({
      code: entry.code,
      names: entry.names ?? { en: entry.canonicalNameEn },
      reason: missingCodes.has(entry.code) ? 'missing_scientific_profile' : 'incomplete_scientific_profile',
    }));
  const report = { generatedAt: new Date().toISOString(), table: 'public.food_additive_science', totalEuCodes: knownCodes.length, scientificProfilesAvailable: coverage.totalProfiles, completeScientificProfiles: coverage.completeProfiles, incompleteScientificProfiles: coverage.incompleteProfiles, missingScientificProfiles: coverage.missingKnownCodes.length, scientificCoveragePercent: Number(((coverage.totalProfiles / knownCodes.length) * 100).toFixed(1)), completeScientificCoveragePercent: Number(((coverage.completeProfiles / knownCodes.length) * 100).toFixed(1)), functionCategoryCounts: catalogFunctionCounts(), ...coverage, schemaColumns: rows[0] ? Object.keys(rows[0]) : [] };
  fs.mkdirSync(path.dirname(REPORT), { recursive: true });
  fs.writeFileSync(PRIORITY_REPORT, `${JSON.stringify({ generatedAt: report.generatedAt, sourceCatalog: catalog.source, totalEuCodes: knownCodes.length, totalPriorityCodes: priorityEntries.length, entries: priorityEntries }, null, 2)}\n`, 'utf8');
  fs.writeFileSync(REPORT, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  console.log(JSON.stringify(report, null, 2));
}
main().catch((error) => { console.error(error instanceof Error ? error.message : String(error)); process.exitCode = 1; });
