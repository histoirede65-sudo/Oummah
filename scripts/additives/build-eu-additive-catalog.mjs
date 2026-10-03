#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const API_URL = 'https://ec.europa.eu/food/food-feed-portal/backend/api/policy-items?foodDomain=fin&authorisationType=fad_auth';
const DATABASE_URL = 'https://food.ec.europa.eu/food-safety/food-improvement-agents/additives/database_en';
const OUTPUT = path.join(ROOT, 'src/features/boycott/data/eu-additive-catalog.json');
const REPORT = path.join(ROOT, 'scripts/output/eu-additive-catalog-report.json');

function normalizeCode(value) {
  const match = String(value ?? '').trim().toUpperCase().match(/^E\s?(\d{3,4}[A-Z]?)$/);
  return match ? `E${match[1]}` : undefined;
}
function cleanText(value) { return String(value ?? '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(); }
function walk(node, fields = new Map()) {
  if (!node) return fields;
  if (node.valueIdentifier && node.value !== null && node.value !== undefined && String(node.value).trim()) {
    const values = fields.get(node.valueIdentifier) ?? [];
    values.push(String(node.value).trim());
    fields.set(node.valueIdentifier, values);
  }
  for (const child of node.childrenValues ?? []) walk(child, fields);
  return fields;
}
function first(fields, key) { return fields.get(key)?.[0]; }
function unique(values) { return [...new Set(values.filter(Boolean))]; }
const FUNCTION_CATEGORY_SOURCE = 'Not exposed as an explicit field by the Commission policy-items API; no category inferred.';
const AUDITED_API_FIELDS = ['displayName', 'identifyingName', 'synonyms', 'eNumber', 'policyItemStatus', 'policyItemCode', 'legislationTitle', 'eurlexLink', 'group', 'memberOfFADGroup', 'groupMemberRefs', 'policyItemMessageText', 'foodCategory', 'conditionsOfUse'];

export function parseOfficialEntries(payload, retrievedAt = new Date().toISOString().slice(0, 10)) {
  const rawEntries = [];
  const anomalies = [];
  for (const item of payload) {
    const fields = walk(item);
    const code = normalizeCode(first(fields, 'eNumber'));
    if (!code) { anomalies.push({ kind: 'entry_without_e_code', policyItemCode: first(fields, 'policyItemCode'), displayName: cleanText(first(fields, 'displayName')) }); continue; }
    const names = unique([...(fields.get('identifyingName') ?? []), ...(fields.get('displayName') ?? [])].map(cleanText));
    const canonicalNameEn = names[0] ?? code;
    const aliases = unique((fields.get('synonyms') ?? []).map(cleanText)).filter((alias) => alias !== canonicalNameEn);
    const aliasRecords = aliases.map((value) => ({ value, source: DATABASE_URL }));
    const regulations = unique(fields.get('eurlexLink') ?? []).filter((url) => /^https?:\/\//i.test(url)).map((url, index) => ({ authority: 'European Commission', regulation: first(fields, 'legislationTitle') ?? first(fields, 'ojNumber') ?? 'Union list reference', annex: 'Annex II, Regulation (EC) No 1333/2008', url, retrievedAt }));
    if (!names.length) anomalies.push({ kind: 'entry_without_name', code, policyItemCode: first(fields, 'policyItemCode') });
    if (!regulations.length) regulations.push({ authority: 'European Commission', regulation: 'Union list reference', annex: 'Annex II, Regulation (EC) No 1333/2008', url: DATABASE_URL, retrievedAt });
    rawEntries.push({
      code,
      names: { en: canonicalNameEn },
      canonicalNameFr: null,
      canonicalNameEn,
      aliases,
      aliasRecords,
      functionCategories: [],
      functionCategorySource: FUNCTION_CATEGORY_SOURCE,
      euRegulatoryStatus: first(fields, 'policyItemStatus') ?? 'published',
      regulatoryReferences: regulations,
      catalogVersion: retrievedAt,
      retrievedAt,
      sourcePolicyItemCode: first(fields, 'policyItemCode'),
      sourceDisplayName: canonicalNameEn,
    });
  }
  const byCode = new Map();
  for (const entry of rawEntries) {
    const previous = byCode.get(entry.code);
    if (!previous) byCode.set(entry.code, entry);
    else {
      previous.aliases = unique([...previous.aliases, ...entry.aliases]);
      previous.aliasRecords = [...previous.aliasRecords, ...entry.aliasRecords.filter((candidate) => !previous.aliasRecords.some((existing) => existing.value === candidate.value))];
      previous.regulatoryReferences = [...previous.regulatoryReferences, ...entry.regulatoryReferences.filter((candidate) => !previous.regulatoryReferences.some((existing) => existing.url === candidate.url))];
    }
  }
  const entries = [...byCode.values()].sort((a, b) => a.code.localeCompare(b.code, 'en', { numeric: true }));
  const subcodes = entries.filter((entry) => /[A-Z]$/.test(entry.code)).map((entry) => entry.code);
  return { entries, anomalies, subcodes, rawEntryCount: payload.length, entriesWithoutECode: anomalies.filter((item) => item.kind === 'entry_without_e_code').length };
}

async function main() {
  const response = await fetch(API_URL, { headers: { Accept: 'application/json' } });
  if (!response.ok) throw new Error(`European Commission API failed: ${response.status}`);
  const payload = await response.json();
  const retrievedAt = new Date().toISOString().slice(0, 10);
  const parsed = parseOfficialEntries(payload, retrievedAt);
  const snapshot = {
    schemaVersion: '1.0',
    source: { authority: 'European Commission', url: DATABASE_URL, apiUrl: API_URL, retrievedAt, referenceVersion: 'Union list / Annex II, Regulation (EC) No 1333/2008', auditedApiFields: AUDITED_API_FIELDS, functionCategoryFieldFound: false },
    totalRegulatoryEntries: parsed.rawEntryCount,
    totalUniqueECodes: parsed.entries.length,
    entriesWithoutECode: parsed.entriesWithoutECode,
    entriesWithoutFrenchName: parsed.entries.filter((entry) => !entry.canonicalNameFr).length,
    entriesWithoutFunctionCategories: parsed.entries.filter((entry) => !(entry.functionCategories?.length)).length,
    nomenclatureCoverage: buildNomenclatureCoverage(parsed.entries),
    subcodes: parsed.subcodes,
    anomalies: parsed.anomalies,
    entries: parsed.entries,
  };
  fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });
  fs.mkdirSync(path.dirname(REPORT), { recursive: true });
  fs.writeFileSync(OUTPUT, `${JSON.stringify(snapshot, null, 2)}\n`, 'utf8');
  fs.writeFileSync(REPORT, `${JSON.stringify({ ...snapshot, entries: undefined }, null, 2)}\n`, 'utf8');
  console.log(JSON.stringify({ output: OUTPUT, report: REPORT, totalRegulatoryEntries: snapshot.totalRegulatoryEntries, totalUniqueECodes: snapshot.totalUniqueECodes, entriesWithoutECode: snapshot.entriesWithoutECode, subcodes: snapshot.subcodes.length, anomalies: snapshot.anomalies.length }, null, 2));
}

function buildNomenclatureCoverage(entries) {
  const totalEuCodes = entries.length;
  const count = (predicate) => entries.filter(predicate).length;
  const percentage = (value) => Number(((value / totalEuCodes) * 100).toFixed(1));
  const codesWithAnyName = count((entry) => Boolean(entry.canonicalNameFr || entry.canonicalNameEn));
  const codesWithFrenchName = count((entry) => Boolean(entry.canonicalNameFr));
  const codesWithEnglishName = count((entry) => Boolean(entry.canonicalNameEn));
  const codesWithFunction = count((entry) => entry.functionCategories?.length > 0);
  const codesWithAliases = count((entry) => entry.aliases?.length > 0);
  return {
    totalEuCodes,
    codesWithAnyName,
    codesWithFrenchName,
    codesWithEnglishName,
    codesWithFunction,
    codesWithAliases,
    codesWithoutName: totalEuCodes - codesWithAnyName,
    codesWithoutFunction: totalEuCodes - codesWithFunction,
    percentages: {
      anyName: percentage(codesWithAnyName),
      frenchName: percentage(codesWithFrenchName),
      englishName: percentage(codesWithEnglishName),
      function: percentage(codesWithFunction),
      aliases: percentage(codesWithAliases),
    },
  };
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main().catch((error) => { console.error(error instanceof Error ? error.message : String(error)); process.exitCode = 1; });
