#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PROPOSAL_PATH = path.join(ROOT, 'scripts', 'output', 'food-additive-science-proposed-top25.json');
const REPORT_PATH = path.join(ROOT, 'scripts', 'output', 'food-additive-science-supabase-import-dry-run.json');
const EXISTING_PATH = path.join(ROOT, 'scripts', 'data', 'food-additive-science-existing.json');
const FORBIDDEN = new Set(['E150D', 'E331', 'E621', 'E160C', 'E220']);
const EXISTING_CODES = new Set(['E150D', 'E331', 'E338', 'E950', 'E951']);
const DB_COLUMNS = new Set([
  'code', 'canonical_name', 'function_classes', 'regulatory_status', 'eu_authorized', 'eu_conditions',
  'adi_value', 'adi_unit', 'adi_display', 'adi_authority', 'severity', 'evidence_strength',
  'exposure_concern', 'scientific_classification', 'scientific_summary', 'health_effects',
  'sensitive_populations', 'exposure_assessment', 'assessment_history', 'sources',
  'regulatory_source_updated_at', 'scientific_reviewed_at', 'needs_scientific_review', 'data_version',
  'created_at', 'updated_at',
]);
const PROPOSAL_TO_DB = {
  code: 'code', canonical_name: 'canonical_name', function_classes: 'function_classes', regulatory_status: 'regulatory_status',
  eu_authorized: 'eu_authorized', eu_conditions: 'eu_conditions', adi_value: 'adi_value', adi_unit: 'adi_unit',
  adi_display: 'adi_display', adi_authority: 'adi_authority', severity: 'severity', evidence_strength: 'evidence_strength',
  exposure_concern: 'exposure_concern', scientific_classification: 'scientific_classification', scientific_summary: 'scientific_summary',
  sensitive_populations: 'sensitive_populations', exposure_assessment: 'exposure_assessment', assessment_history: 'assessment_history',
  sources: 'sources', regulatory_source_updated_at: 'regulatory_source_updated_at', scientific_reviewed_at: 'scientific_reviewed_at',
  needs_scientific_review: 'needs_scientific_review', data_version: 'data_version',
};

function readJson(filePath) { return JSON.parse(fs.readFileSync(filePath, 'utf8')); }
function argument(name) { const index = process.argv.indexOf(name); return index >= 0 ? process.argv[index + 1] : undefined; }
function nonEmpty(value) { return value !== null && value !== undefined && value !== '' && !(Array.isArray(value) && value.length === 0); }

export function loadProposal(filePath = PROPOSAL_PATH) {
  if (!fs.existsSync(filePath)) throw new Error(`Proposal file not found: ${filePath}`);
  const proposal = readJson(filePath);
  if (!Array.isArray(proposal.records)) throw new Error('Proposal must contain a records array');
  return proposal;
}

export function selectImportRecords(proposal) {
  const records = proposal.records.filter((record) => !FORBIDDEN.has(String(record.code).toUpperCase()));
  const invalid = records.filter((record) => !record.code || !record.opentox_ref_sub_uuid || !record.opentox_sub_uuid);
  if (invalid.length) throw new Error(`Reliable proposal records missing identity: ${invalid.map((record) => record.code).join(', ')}`);
  return records;
}

export function buildDbRow(record) {
  const source = {
    sourceId: `openfoodtox-${String(record.code).toLowerCase()}`,
    organisation: 'EFSA',
    sourceOrganization: 'EFSA',
    sourceDataset: 'OpenFoodTox 3.0',
    sourceType: 'official_information',
    title: 'OpenFoodTox 3.0 structured record',
    url: record.efsa_document_urls?.[0] ?? null,
    retrievedAt: record.retrievedAt,
    sourceVersion: record.sourceVersion,
    sourceFileHash: record.sourceFileHash,
    ingestionVersion: 'oummah-openfoodtox-supabase-import-v1',
    fieldsSupported: ['identity', 'cas', 'reference_values', 'provenance'],
  };
  return {
    code: record.code,
    canonical_name: record.canonical_name,
    function_classes: record.function_classes ?? [],
    regulatory_status: record.regulatory_status,
    eu_authorized: record.eu_authorized,
    eu_conditions: { ...(record.eu_conditions ?? {}), openFoodTox: { casNumbers: record.cas_numbers, subUuid: record.opentox_sub_uuid, refSubUuid: record.opentox_ref_sub_uuid, matchingMethod: record.matching_method, matchingConfidence: record.matching_confidence } },
    adi_value: null,
    adi_unit: null,
    adi_display: null,
    adi_authority: record.adi_authority,
    severity: 'none',
    evidence_strength: 'insufficient',
    exposure_concern: 'unknown',
    scientific_classification: 'insufficient_data',
    scientific_summary: null,
    health_effects: [],
    sensitive_populations: record.population ?? [],
    exposure_assessment: { referenceValueStatus: record.reference_value_status, referenceValues: record.reference_values ?? [], criticalEndpoints: record.critical_endpoints ?? [], justifications: record.justifications ?? [], sourceVersion: record.sourceVersion, sourceFileHash: record.sourceFileHash, retrievedAt: record.retrievedAt },
    assessment_history: [{ organisation: 'EFSA', date: record.retrievedAt, conclusion: 'Import structure OpenFoodTox propose ; aucune classification scientifique deduite.', sourceId: source.sourceId }],
    sources: [source],
    regulatory_source_updated_at: null,
    scientific_reviewed_at: null,
    needs_scientific_review: true,
    data_version: '1.0',
  };
}

export function planImport({ proposal, existingRows = [], existingCodes = [] }) {
  const records = selectImportRecords(proposal);
  const existingByCode = new Map(existingRows.map((row) => [String(row.code).toUpperCase(), row]));
  const knownCodes = new Set([...EXISTING_CODES, ...existingCodes.map((code) => String(code).toUpperCase()), ...existingByCode.keys()]);
  const inserts = records.filter((record) => !knownCodes.has(String(record.code).toUpperCase()));
  const updates = records.filter((record) => knownCodes.has(String(record.code).toUpperCase())).map((record) => {
    const current = existingByCode.get(String(record.code).toUpperCase());
    const proposed = buildDbRow(record);
    const fieldsToAdd = current ? Object.keys(proposed).filter((field) => nonEmpty(proposed[field]) && !nonEmpty(current[field]) && !['severity', 'evidence_strength', 'exposure_concern', 'scientific_classification', 'needs_scientific_review'].includes(field)) : [];
    return { code: record.code, fieldsToAdd, fieldsToUpdate: Object.fromEntries(fieldsToAdd.map((field) => [field, proposed[field]])), fieldsPreserved: current ? Object.keys(proposed).filter((field) => nonEmpty(current[field])) : [], scientificFieldsPreserved: true };
  });
  return {
    inserts: inserts.map(buildDbRow),
    existingEnrichments: updates,
    ignored: [...new Set([...FORBIDDEN, 'E331'])],
    schema: { table: 'public.food_additive_science', dbColumns: [...DB_COLUMNS], proposalFields: [...new Set(proposal.records.flatMap((record) => Object.keys(record)))], unmappedProposalFields: [...new Set(proposal.records.flatMap((record) => Object.keys(record)))].filter((field) => !PROPOSAL_TO_DB[field] && !['cas_numbers', 'opentox_substance_name', 'opentox_sub_uuid', 'opentox_ref_sub_uuid', 'matching_method', 'matching_confidence', 'reference_values', 'reference_value_status', 'assessment_date', 'efsa_document_ids', 'efsa_document_urls', 'population', 'critical_endpoints', 'justifications', 'classification_action', 'sourceVersion', 'sourceFileHash', 'retrievedAt'].includes(field)), migrationRequired: false },
    noAutomaticScientificChange: true,
  };
}

async function applyPlan(plan) {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL?.replace(/\/+$/, '');
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Apply requires EXPO_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  const headers = { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' };
  for (const row of plan.inserts) {
    const response = await fetch(`${url}/rest/v1/food_additive_science`, { method: 'POST', headers, body: JSON.stringify(row) });
    if (!response.ok) throw new Error(`Insert ${row.code} failed: ${response.status} ${await response.text()}`);
  }
  for (const update of plan.existingEnrichments.filter((item) => item.fieldsToAdd.length)) {
    const response = await fetch(`${url}/rest/v1/food_additive_science?code=eq.${encodeURIComponent(update.code)}`, { method: 'PATCH', headers, body: JSON.stringify(update.fieldsToUpdate) });
    if (!response.ok) throw new Error(`Update ${update.code} failed: ${response.status} ${await response.text()}`);
  }
  return { inserted: plan.inserts.map((row) => row.code), updated: plan.existingEnrichments.filter((item) => item.fieldsToAdd.length).map((item) => item.code) };
}

async function fetchExistingRows() {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL?.replace(/\/+$/, '');
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Apply requires EXPO_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  const response = await fetch(`${url}/rest/v1/food_additive_science?select=*`, { headers: { apikey: key, Authorization: `Bearer ${key}`, Accept: 'application/json' } });
  if (!response.ok) throw new Error(`Cannot read food_additive_science before apply: ${response.status} ${await response.text()}`);
  return response.json();
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const apply = process.argv.includes('--apply');
  try {
    const proposal = loadProposal(path.resolve(argument('--proposal') ?? PROPOSAL_PATH));
    const existing = fs.existsSync(EXISTING_PATH) ? readJson(EXISTING_PATH) : [];
    let plan = planImport({ proposal, existingCodes: existing.map((row) => row.codeE) });
    if (apply) plan = planImport({ proposal, existingRows: await fetchExistingRows(), existingCodes: existing.map((row) => row.codeE) });
    const report = { mode: apply ? 'apply' : 'dry-run', proposal: path.resolve(argument('--proposal') ?? PROPOSAL_PATH), ...plan, summary: { newRecords: plan.inserts.length, existingEnrichments: plan.existingEnrichments.filter((item) => item.fieldsToAdd.length).length, ignored: plan.ignored.length, fieldsToAdd: plan.existingEnrichments.flatMap((item) => item.fieldsToAdd), fieldsPreserved: plan.existingEnrichments.flatMap((item) => item.fieldsPreserved), noAutomaticScientificChange: true } };
    if (apply) report.result = await applyPlan(plan);
    const outputPath = path.resolve(argument('--report') ?? REPORT_PATH);
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
    console.log(`Mode: ${report.mode}`);
    console.log(`Nouvelles fiches: ${report.summary.newRecords}`);
    console.log(`Fiches existantes enrichies: ${report.summary.existingEnrichments}`);
    console.log(`Ignorées: ${report.summary.ignored}`);
    console.log(`Aucun changement scientifique automatique: oui`);
    console.log(`Rapport: ${outputPath}`);
  } catch (error) { console.error(error instanceof Error ? error.message : String(error)); process.exitCode = 1; }
}
