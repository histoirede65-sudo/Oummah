#!/usr/bin/env node
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const DEFAULT_INPUT = path.join(ROOT, 'scripts', 'data', 'OpenFoodTox-3.0.xlsx');
export const DEFAULT_OUTPUT = path.join(ROOT, 'scripts', 'output', 'openfoodtox-top25-dry-run.json');
const DEFAULT_TOP25 = path.join(ROOT, 'scripts', 'data', 'openfoodtox-top25.json');
const DEFAULT_EXISTING = path.join(ROOT, 'scripts', 'data', 'food-additive-science-existing.json');
const SOURCE_VERSION = 'OpenFoodTox 3.0 / EFSA export repository';
const INGESTION_VERSION = 'oummah-openfoodtox-dry-run-v2';

export function normalize(value) {
  return String(value ?? '').normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim().replace(/\s+/g, ' ');
}
export function normalizeCas(value) { return String(value ?? '').trim().replace(/\s+/g, ''); }
function decodeXml(value) {
  return value
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(Number.parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, decimal) => String.fromCodePoint(Number.parseInt(decimal, 10)))
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, '&');
}
function excelColumnName(index) { let output = ''; for (let value = index + 1; value > 0; value = Math.floor((value - 1) / 26)) output = String.fromCharCode(65 + ((value - 1) % 26)) + output; return output; }
const USEFUL_COLUMN_PATTERNS = [/cas/, /ins/, /substance.*name/, /^name$/, /chemical.*name/, /preferred.*name/, /efsa.*id/, /substance.*id/, /chemical.*id/, /reference/, /toxicological/, /adi/, /tdi/, /health.*based/, /unit/, /concentration/, /date/, /year/, /opinion/, /document/, /parent.*uuid/, /uuid$/, /publication/, /output/, /doi/, /efsa.*link/];
const TARGET_SHEET_NAMES = new Set(['REF_SUB', 'SUB', 'FLEX_SUM.ToxRefValues', 'DATA_DICTIONARY']);
function isUsefulColumn(column) { return USEFUL_COLUMN_PATTERNS.some((pattern) => pattern.test(normalize(column))); }

function readZipEntry(zipPath, entryName) {
  const temporaryDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'oummah-openfoodtox-'));
  try {
    const result = spawnSync('tar', ['-xf', zipPath, '-C', temporaryDirectory, entryName], { encoding: 'utf8' });
    if (result.status !== 0) throw new Error(`Could not extract ${entryName}: ${result.stderr}`);
    return fs.readFileSync(path.join(temporaryDirectory, entryName), 'utf8');
  } finally { fs.rmSync(temporaryDirectory, { recursive: true, force: true }); }
}

export function parseXlsxRows(filePath, onProgress = () => {}) {
  onProgress('Ouverture du classeur XLSX...');
  const workbook = readZipEntry(filePath, 'xl/workbook.xml');
  const relationships = readZipEntry(filePath, 'xl/_rels/workbook.xml.rels');
  let sharedStrings = [];
  try { sharedStrings = [...readZipEntry(filePath, 'xl/sharedStrings.xml').matchAll(/<si[\s\S]*?<\/si>/g)].map((match) => [...match[0].matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map((part) => decodeXml(part[1])).join('')); } catch {}
  const relationMap = new Map([...relationships.matchAll(/<Relationship[^>]+Id="([^"]+)"[^>]+Target="([^"]+)"/g)].map((match) => [match[1], `xl/${match[2].replace(/^\/+/, '')}`]));
  const sheets = [...workbook.matchAll(/<sheet[^>]+name="([^"]+)"[^>]+r:id="([^"]+)"/g)].map((match) => ({ name: decodeXml(match[1]), path: relationMap.get(match[2]) }));
  onProgress(`Feuilles détectées : ${sheets.map((sheet) => sheet.name).join(', ')}`);
  const usableSheets = sheets.filter((sheet) => sheet.path && TARGET_SHEET_NAMES.has(sheet.name));
  onProgress(`Feuilles détectées : ${usableSheets.map((sheet) => sheet.name).join(', ')}`);
  return usableSheets.map((sheet) => {
    onProgress(`Lecture de la feuille ${sheet.name}...`);
    const xml = readZipEntry(filePath, sheet.path);
    const rowMatches = [...xml.matchAll(/<row[\s\S]*?<\/row>/g)];
    const readCells = (rowXml, usefulColumns = undefined) => {
      const values = {};
      for (const cell of rowXml.matchAll(/<c(?:[^>]*?)r="([A-Z]+)\d+"([^>]*)>([\s\S]*?)<\/c>/g)) {
        if (usefulColumns && !usefulColumns.has(cell[1])) continue;
        const type = cell[2].match(/t="([^"]+)"/)?.[1];
        const sharedIndex = cell[3].match(/<v>([\s\S]*?)<\/v>/)?.[1];
        const inlineText = [...cell[3].matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map((match) => decodeXml(match[1])).join('');
        const raw = sharedIndex ?? inlineText;
        values[cell[1]] = type === 's' ? (sharedStrings[Number(raw)] ?? '') : decodeXml(raw ?? '');
      }
      return values;
    };
    const headerCells = readCells(rowMatches[0]?.[0] ?? '');
    const headersByColumn = new Map(Object.entries(headerCells));
    const headerEntries = [...headersByColumn.entries()];
    const headers = headerEntries.map(([, header]) => header);
    const usefulColumns = new Set([...headersByColumn.entries()].filter(([, header]) => isUsefulColumn(header)).map(([column]) => column));
    const dataRows = [];
    for (let rowIndex = 1; rowIndex < rowMatches.length; rowIndex += 1) {
      const values = readCells(rowMatches[rowIndex][0], usefulColumns);
      dataRows.push(Object.fromEntries(headerEntries.map(([column, header], index) => [header || `column_${index + 1}`, values[column] ?? '']).filter(([header]) => isUsefulColumn(header))));
      if (rowIndex % 10000 === 0) onProgress(`Lecture ${sheet.name} : ${rowIndex} lignes`);
    }
    const result = { name: sheet.name, columns: headers, rows: dataRows };
    onProgress(`Feuille ${sheet.name} : ${result.rows.length} lignes`);
    return result;
  });
}

function parseCsv(text) {
  const rows = text.split(/\r?\n/).filter(Boolean).map((line) => line.split(','));
  const headers = rows.shift() ?? [];
  return [{ name: 'csv', columns: headers, rows: rows.map((row) => Object.fromEntries(headers.map((header, index) => [header, row[index] ?? '']).filter(([header]) => isUsefulColumn(header))))}];
}

export function readInput(filePath, onProgress = () => {}) {
  if (!fs.existsSync(filePath)) throw new Error(`Input file not found: ${filePath}`);
  const extension = path.extname(filePath).toLowerCase();
  if (extension === '.xlsx') return parseXlsxRows(filePath, onProgress);
  const text = fs.readFileSync(filePath, 'utf8');
  if (extension === '.json') { const value = JSON.parse(text); return [{ name: 'json', rows: Array.isArray(value) ? value : value.rows ?? [] }]; }
  if (extension === '.csv') return parseCsv(text);
  throw new Error(`Unsupported input format: ${extension}`);
}

function valuesFor(row, patterns) { return Object.entries(row).filter(([key]) => patterns.some((pattern) => pattern.test(normalize(key)))).map(([, value]) => String(value ?? '').trim()).filter(Boolean); }
function firstValue(row, patterns) { return valuesFor(row, patterns)[0]; }
function identity(row) { return row.__identity ?? firstValue(row, [/efsa.*id/, /substance.*id/, /chemical.*id/]) ?? firstValue(row, [/cas/]) ?? firstValue(row, [/substance.*name/, /^name$/, /chemical.*name/, /preferred.*name/]) ?? JSON.stringify(row); }
function rowOf(record) { return record.row ?? record; }
function toxicology(row) { return { referenceValues: valuesFor(row, [/reference.*value/, /toxicological.*reference/, /adi/, /tdi/, /health.*based/]), types: valuesFor(row, [/reference.*type/, /value.*type/, /guidance.*type/, /endpoint/]), units: valuesFor(row, [/unit/, /concentration/]), dates: valuesFor(row, [/date/, /year/]), sourceDocuments: valuesFor(row, [/opinion/, /document/, /publication/, /output/, /doi/, /efsa.*link/]) }; }

export function normalizeIuclidReference(value) {
  const match = String(value ?? '').match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
  return match?.[0].toLowerCase() ?? '';
}

function exactNames(row) {
  return ['ReferenceSubstanceName', 'CAS name', 'Name', 'ChemicalName']
    .flatMap((key) => String(row[key] ?? '').split('|'))
    .map(normalize).filter(Boolean);
}
function exactCasNumbers(row) { return ['Inventory.CASNumber', 'CAS number', 'CAS'].flatMap((key) => String(row[key] ?? '').split(/[|;,]/)).map(normalizeCas).filter(Boolean); }
function referenceValueRows(row) {
  const entries = Object.entries(row);
  const output = [];
  for (const type of ['ADI', 'TDI']) {
    const prefix = type === 'ADI' ? 'AcceptableDailyIntake.Adi.' : 'TolerableDailyIntake.Tdi.';
    const fields = Object.fromEntries(entries.filter(([key, value]) => key.includes(prefix) && String(value ?? '').trim()).map(([key, value]) => [key.slice(key.indexOf(prefix) + prefix.length), String(value).trim()]));
    if (Object.keys(fields).length) output.push({ type, ...fields });
  }
  return output;
}

function addToIndex(index, value, row) {
  if (!value) return;
  const bucket = index.get(value) ?? new Set();
  bucket.add(row);
  index.set(value, bucket);
}

function buildGenericIndexes(sheets, onProgress) {
  const indexes = { cas: new Map(), names: new Map(), ids: new Map(), ins: new Map(), rows: [], buildCount: 1 };
  let processed = 0;
  for (const sheet of sheets) {
    for (const row of sheet.rows) {
      const indexedRow = { ...row, __sheet: sheet.name, __identity: `${sheet.name}:${processed}` };
      indexes.rows.push(indexedRow);
      for (const value of valuesFor(indexedRow, [/cas/])) addToIndex(indexes.cas, normalizeCas(value), indexedRow);
      for (const value of valuesFor(indexedRow, [/substance.*name/, /^name$/, /chemical.*name/, /preferred.*name/])) addToIndex(indexes.names, normalize(value), indexedRow);
      for (const value of valuesFor(indexedRow, [/efsa.*id/, /substance.*id/, /chemical.*id/])) addToIndex(indexes.ids, normalize(value), indexedRow);
      for (const value of valuesFor(indexedRow, [/ins/])) addToIndex(indexes.ins, normalize(value), indexedRow);
      processed += 1;
      if (processed === 1 || processed % 10000 === 0) onProgress(`Indexation : ${processed} lignes`);
    }
  }
  onProgress(`Index CAS construit : ${indexes.cas.size} entrées`);
  onProgress(`Index noms construit : ${indexes.names.size} entrées`);
  onProgress(`Index identifiants construit : ${indexes.ids.size} entrées`);
  onProgress(`Index INS construit : ${indexes.ins.size} entrées`);
  return indexes;
}

function buildOpenFoodToxIndexes(sheets, onProgress) {
  const refSheet = sheets.find((sheet) => sheet.name === 'REF_SUB');
  if (!refSheet) return buildGenericIndexes(sheets, onProgress);
  const subSheet = sheets.find((sheet) => sheet.name === 'SUB');
  const toxSheet = sheets.find((sheet) => sheet.name === 'FLEX_SUM.ToxRefValues');
  const refsByUuid = new Map();
  const indexes = { cas: new Map(), names: new Map(), ids: new Map(), ins: new Map(), rows: [], buildCount: 1 };
  let validReferenceSubstances = 0;
  let uniqueCas = new Set();
  let uniqueNames = new Set();
  for (const row of refSheet.rows) {
    const uuid = normalizeIuclidReference(row['Document UUID']);
    const casNumbers = exactCasNumbers(row);
    const names = exactNames(row);
    if (!uuid && !casNumbers.length && !names.length) continue;
    if (uuid) validReferenceSubstances += 1;
    casNumbers.forEach((value) => uniqueCas.add(value));
    names.forEach((value) => uniqueNames.add(value));
    const record = { row: { ...row, __sheet: 'REF_SUB' }, __identity: uuid || `REF_SUB:${validReferenceSubstances}`, uuid, casNumbers, names, subRows: [], toxRows: [] };
    if (uuid) refsByUuid.set(uuid, record);
  }
  let linkedSubstances = 0;
  let orphanSubstances = 0;
  const subsByUuid = new Map();
  for (const row of subSheet?.rows ?? []) {
    const subUuid = normalizeIuclidReference(row['Document UUID']);
    const refUuid = normalizeIuclidReference(row['ReferenceSubstance.ReferenceSubstance']);
    const ref = refsByUuid.get(refUuid);
    if (subUuid) subsByUuid.set(subUuid, refUuid);
    if (ref) { ref.subRows.push(row); linkedSubstances += 1; exactNames(row).forEach((value) => { ref.names.push(value); uniqueNames.add(value); }); exactCasNumbers(row).forEach((value) => { ref.casNumbers.push(value); uniqueCas.add(value); }); }
    else if (subUuid || refUuid) orphanSubstances += 1;
  }
  const refUuids = new Set(refsByUuid.keys());
  const subUuids = new Set(subsByUuid.keys());
  let toxLinked = 0;
  let toxRelation = 'unknown';
  const toxRows = toxSheet?.rows ?? [];
  const toxLinkValue = (row) => normalizeIuclidReference(row['Parent UUID']) || normalizeIuclidReference(row['Document UUID']);
  const toxHitsSub = toxRows.filter((row) => subUuids.has(toxLinkValue(row))).length;
  const toxHitsRef = toxRows.filter((row) => refUuids.has(toxLinkValue(row))).length;
  if (toxHitsSub && !toxHitsRef) toxRelation = 'SUB via Parent UUID';
  else if (toxHitsRef && !toxHitsSub) toxRelation = 'REF_SUB via Parent UUID';
  else if (toxHitsSub && toxHitsRef) toxRelation = 'ambiguous:SUB-or-REF_SUB via Parent UUID';
  for (const row of toxRows) {
    const uuid = toxLinkValue(row);
    const refUuid = toxRelation.startsWith('SUB') ? subsByUuid.get(uuid) : uuid;
    const ref = refsByUuid.get(refUuid);
    if (ref) { ref.toxRows.push(row); toxLinked += 1; }
  }
  for (const ref of refsByUuid.values()) {
    ref.casNumbers = [...new Set(ref.casNumbers.map(normalizeCas).filter(Boolean))];
    ref.names = [...new Set(ref.names.map(normalize).filter(Boolean))];
    indexes.rows.push(ref);
    ref.casNumbers.forEach((value) => addToIndex(indexes.cas, value, ref));
    ref.names.forEach((value) => addToIndex(indexes.names, value, ref));
  }
  indexes.referenceStats = { validReferenceSubstances, uniqueCas: uniqueCas.size, uniqueNames: uniqueNames.size, linkedSubstances, orphanSubstances, toxRows: toxRows.length, toxLinked, toxRelation, toxHitsSub, toxHitsRef };
  indexes.referenceSamples = { REF_SUB: refSheet.rows.filter((row) => Object.values(row).some(Boolean)).slice(0, 5), SUB: (subSheet?.rows ?? []).filter((row) => Object.values(row).some(Boolean)).slice(0, 5), 'FLEX_SUM.ToxRefValues': toxRows.filter((row) => Object.values(row).some(Boolean)).slice(0, 5) };
  onProgress(`Références REF_SUB valides : ${validReferenceSubstances} | CAS uniques : ${uniqueCas.size} | noms uniques : ${uniqueNames.size}`);
  onProgress(`SUB liés : ${linkedSubstances} | orphelins : ${orphanSubstances}`);
  onProgress(`ToxRefValues liés : ${toxLinked} | relation : ${toxRelation}`);
  onProgress(`Index CAS construit : ${indexes.cas.size} entrées`);
  onProgress(`Index noms construit : ${indexes.names.size} entrées`);
  onProgress(`Index identifiants construit : ${indexes.ids.size} entrées`);
  onProgress(`Index INS construit : ${indexes.ins.size} entrées`);
  return indexes;
}

export function buildIndexes(sheets, onProgress = () => {}) { return buildOpenFoodToxIndexes(sheets, onProgress); }

function matchCandidate(candidate, indexes) {
  const names = [candidate.canonicalName, ...(candidate.synonyms ?? [])].map(normalize).filter(Boolean);
  const cas = (candidate.casNumbers ?? []).map(normalizeCas);
  const ins = normalize(candidate.insCode);
  const efsa = (candidate.efsaIdentifiers ?? []).map(normalize);
  const candidates = new Map();
  const addMatches = (rows, key) => { for (const row of rows ?? []) { const current = candidates.get(row) ?? { row, evidence: { exactCas: false, exactId: false, exactName: false, exactIns: false } }; current.evidence[key] = true; candidates.set(row, current); } };
  for (const value of cas) addMatches(indexes.cas.get(value), 'exactCas');
  for (const value of efsa) addMatches(indexes.ids.get(value), 'exactId');
  for (const value of names) addMatches(indexes.names.get(value), 'exactName');
  if (ins) addMatches(indexes.ins.get(ins), 'exactIns');
  return [...candidates.values()];
}

const MANUAL_CHECKS = [
  { name: 'Aspartame', aliases: [] },
  { name: 'Acesulfame K', aliases: ['Acesulfame potassium'] },
  { name: 'Phosphoric acid', aliases: [] },
  { name: 'Citric acid', aliases: [] },
  { name: 'Sodium benzoate', aliases: [] },
];

function buildManualChecks(indexes) {
  return MANUAL_CHECKS.map((query) => {
    const matches = matchCandidate({ canonicalName: query.name, synonyms: query.aliases, casNumbers: [], efsaIdentifiers: [], insCode: '' }, indexes);
    const unique = new Map(matches.map(({ row, evidence }) => [identity(row), { row, evidence }]));
    return { query: query.name, status: unique.size === 1 ? 'matched' : unique.size > 1 ? 'ambiguous' : 'not_found', matches: [...unique.values()].map(({ row, evidence }) => ({ substance: row.names?.[0] ?? firstValue(rowOf(row), [/substance.*name/, /^name$/, /chemical.*name/]), cas: row.casNumbers ?? valuesFor(rowOf(row), [/cas/]), referenceUuid: row.uuid ?? '', evidence })) };
  });
}

function buildProposalArtifacts(proposals, effectiveExistingRecords, metadata) {
  const existingCodes = new Set(effectiveExistingRecords.map((record) => record.codeE));
  const reliable = proposals.filter((proposal) => proposal.status === 'matched' && proposal.candidates.length === 1);
  const proposedRecords = reliable.map((proposal) => {
    const match = proposal.candidates[0];
    const isExisting = existingCodes.has(proposal.codeE);
    const referenceValues = match.referenceValues ?? [];
    const sourceIds = referenceValues.flatMap((value) => Object.entries(value).filter(([key]) => /reference|opinion|document|publication|doi/i.test(key)).map(([, value]) => value)).filter(Boolean);
    return {
      code: proposal.codeE,
      canonical_name: proposal.canonicalName,
      function_classes: [],
      regulatory_status: null,
      eu_authorized: null,
      eu_conditions: {},
      cas_numbers: match.cas,
      opentox_substance_name: match.substance,
      opentox_sub_uuid: match.subUuid,
      opentox_ref_sub_uuid: match.refSubUuid,
      matching_method: proposal.matchMethod,
      matching_confidence: proposal.matchConfidence,
      reference_values: referenceValues,
      reference_value_status: referenceValues.length ? 'available' : 'reference_value_not_found',
      adi_value: null,
      adi_unit: null,
      adi_display: null,
      adi_authority: referenceValues.flatMap((value) => Object.entries(value).filter(([key]) => /assessmentbody/i.test(key)).map(([, item]) => item)).find(Boolean) ?? null,
      assessment_date: referenceValues.flatMap((value) => Object.entries(value).filter(([key]) => /date|year/i.test(key)).map(([, item]) => item)).find(Boolean) ?? null,
      efsa_document_ids: [...new Set(sourceIds)],
      efsa_document_urls: [],
      population: referenceValues.flatMap((value) => Object.entries(value).filter(([key]) => /population/i.test(key)).map(([, item]) => item)).filter(Boolean),
      critical_endpoints: referenceValues.flatMap((value) => Object.entries(value).filter(([key]) => /criticalendpoint/i.test(key)).map(([, item]) => item)).filter(Boolean),
      justifications: referenceValues.flatMap((value) => Object.entries(value).filter(([key]) => /justification|comment/i.test(key)).map(([, item]) => item)).filter(Boolean),
      severity: null,
      evidence_strength: null,
      exposure_concern: null,
      scientific_classification: isExisting ? null : 'insufficient_data',
      classification_action: isExisting ? 'preserve_existing' : 'requires_scientific_review',
      sources: [{ sourceId: sourceIds[0] ?? `openfoodtox-${proposal.codeE.toLowerCase()}`, organisation: match.adiAuthority ?? 'OpenFoodTox / EFSA', sourceType: 'openfoodtox_record', title: 'OpenFoodTox 3.0 record', url: null, retrievedAt: metadata.retrievedAt }],
      sourceVersion: metadata.sourceVersion,
      sourceFileHash: metadata.sourceFileHash,
      retrievedAt: metadata.retrievedAt,
      needs_scientific_review: !isExisting,
      data_version: 'proposed-1.0',
    };
  });
  const ambiguous = proposals.filter((proposal) => proposal.status === 'ambiguous').map((proposal) => ({ codeE: proposal.codeE, canonicalName: proposal.canonicalName, reason: proposal.reason, candidates: proposal.candidates.map((candidate) => ({ substance: candidate.substance, cas: candidate.cas, subUuid: candidate.subUuid, refSubUuid: candidate.refSubUuid, referenceValues: candidate.referenceValues })) }));
  const existingDiffs = [...existingCodes].map((codeE) => {
    const proposal = proposals.find((item) => item.codeE === codeE);
    return { codeE, comparison: proposal?.status === 'matched' ? 'information_supplementary' : 'no_new_data', details: proposal?.status === 'matched' ? 'OpenFoodTox apporte une identité et/ou des données structurées proposées, sans remplacement de la fiche existante.' : 'Aucune correspondance OpenFoodTox fiable supplémentaire.' };
  });
  return {
    proposedRecords,
    ambiguous,
    groups: {
      ready_for_structured_import: proposedRecords.map((record) => record.code),
      needs_manual_identity_review: ambiguous.map((item) => item.codeE),
      needs_scientific_review: proposedRecords.filter((record) => record.needs_scientific_review).map((record) => record.code),
    },
    existingDiffs,
  };
}

export function buildDryRunReport({ candidates, sheets, sourceFileHash, existingRecords = [], existingCodes = [], retrievedAt = new Date().toISOString(), onProgress = () => {} }) {
  const effectiveExistingRecords = existingRecords.length ? existingRecords : existingCodes.map((codeE) => ({ codeE }));
  const indexes = buildIndexes(sheets, onProgress);
  const proposals = candidates.map((candidate, index) => {
    onProgress(`Analyse ${candidate.codeE} (${index + 1}/${candidates.length})...`);
    const matches = matchCandidate(candidate, indexes);
    const unique = new Map(matches.map(({ row, evidence }) => [identity(row), { row, evidence }]));
    const candidatesFound = [...unique.values()];
    const ambiguous = candidatesFound.length > 1;
    const first = candidatesFound[0];
    const method = first?.evidence.exactCas ? 'cas_exact' : first?.evidence.exactId ? 'identifiant_exact' : first?.evidence.exactName ? 'nom_ou_alias_exact' : first?.evidence.exactIns ? 'ins_exact' : undefined;
    return { codeE: candidate.codeE, canonicalName: candidate.canonicalName, status: ambiguous ? 'ambiguous' : candidatesFound.length ? 'matched' : 'not_found', matchStatus: ambiguous ? 'ambiguous' : candidatesFound.length ? 'matched' : 'unmatched', matchMethod: ambiguous ? undefined : method, matchConfidence: ambiguous || !candidatesFound.length ? 'none' : 'high', candidates: candidatesFound.map(({ row, evidence }) => { const base = rowOf(row); const referenceValues = row.toxRows?.flatMap(referenceValueRows) ?? []; return { substance: row.names?.[0] ?? firstValue(base, [/substance.*name/, /^name$/, /chemical.*name/, /preferred.*name/]), cas: row.casNumbers ?? valuesFor(base, [/cas/]), subUuid: row.subRows?.map((sub) => normalizeIuclidReference(sub['Document UUID'])).find(Boolean) ?? null, refSubUuid: row.uuid ?? null, efsaIdentifiers: valuesFor(base, [/efsa.*id/, /substance.*id/, /chemical.*id/]), sheet: base.__sheet, evidence, toxicology: referenceValues.length ? referenceValues : toxicology(base), referenceValues }; }), matchedRows: matches.length, needsManualReview: Boolean(candidate.needsManualReview || ambiguous || !candidatesFound.length), existingComparison: effectiveExistingRecords.find((record) => record.codeE === candidate.codeE) ?? null, reason: ambiguous ? 'Multiple distinct OpenFoodTox substances matched; no automatic selection.' : !candidatesFound.length ? 'No exact match by CAS, identifier, INS, canonical name or alias.' : candidate.needsManualReview ? 'Exact match found; human validation is still required.' : 'Exact match found.' };
  });
  const metadata = { sourceVersion: SOURCE_VERSION, sourceFileHash, retrievedAt };
  return { ...metadata, ingestionVersion: INGESTION_VERSION, totalRowsAnalyzed: sheets.reduce((total, sheet) => total + sheet.rows.length, 0), indexing: { buildCount: indexes.buildCount, casEntries: indexes.cas.size, nameEntries: indexes.names.size, identifierEntries: indexes.ids.size, insEntries: indexes.ins.size }, mapping: indexes.referenceStats ?? null, diagnosticSamples: indexes.referenceSamples ?? null, manualChecks: buildManualChecks(indexes), sheets: sheets.map((sheet) => ({ name: sheet.name, rows: sheet.rows.length, columns: sheet.columns ?? Object.keys(sheet.rows[0] ?? {}) })), summary: { analyzed: proposals.length, reliableMatches: proposals.filter((item) => item.status === 'matched').length, ambiguous: proposals.filter((item) => item.status === 'ambiguous').length, notFound: proposals.filter((item) => item.status === 'not_found').length, withAdiOrTdi: proposals.filter((item) => item.candidates.some((candidate) => candidate.referenceValues?.length)).length, needsManualReview: proposals.filter((item) => item.needsManualReview).length }, existingCodes: effectiveExistingRecords.map((record) => record.codeE), wouldAdd: proposals.filter((item) => item.status === 'matched' && !effectiveExistingRecords.some((record) => record.codeE === item.codeE)).map((item) => item.codeE), wouldReview: proposals.filter((item) => item.needsManualReview).map((item) => item.codeE), ...buildProposalArtifacts(proposals, effectiveExistingRecords, metadata), proposals };
}

function argument(name) { const index = process.argv.indexOf(name); return index >= 0 ? process.argv[index + 1] : undefined; }

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  if (!process.argv.includes('--dry-run')) { console.error('Dry-run is mandatory. Use: node scripts/import-openfoodtox-additives.mjs --dry-run'); process.exitCode = 2; }
  else {
    const startedAt = Date.now();
    const log = (message) => console.log(`[+${((Date.now() - startedAt) / 1000).toFixed(1)}s] ${message}`);
    const inputPath = path.resolve(argument('--input') ?? DEFAULT_INPUT);
    try {
      log(`Lecture du classeur... ${inputPath}`);
      const stat = fs.statSync(inputPath);
      log(`Fichier ouvert : ${stat.size} octets`);
      const hashStartedAt = Date.now();
      const sourceFileHash = crypto.createHash('sha256').update(fs.readFileSync(inputPath)).digest('hex');
      log(`SHA-256 calculé en ${Date.now() - hashStartedAt} ms : ${sourceFileHash}`);
      const sheets = readInput(inputPath, log);
      for (const sheet of sheets) log(`Feuille ${sheet.name} : ${sheet.rows.length} lignes | colonnes : ${Object.keys(sheet.rows[0] ?? {}).join(', ')}`);
      const candidates = JSON.parse(fs.readFileSync(DEFAULT_TOP25, 'utf8'));
      const existingPath = path.resolve(argument('--existing') ?? DEFAULT_EXISTING);
      const existingRecords = fs.existsSync(existingPath) ? JSON.parse(fs.readFileSync(existingPath, 'utf8')) : [];
      const report = buildDryRunReport({ candidates, sheets, existingRecords, sourceFileHash, onProgress: log });
      report.input = { path: inputPath, bytes: stat.size };
      const outputPath = path.resolve(argument('--output') ?? DEFAULT_OUTPUT);
      fs.mkdirSync(path.dirname(outputPath), { recursive: true });
      fs.writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
      const proposalPath = path.join(path.dirname(outputPath), 'food-additive-science-proposed-top25.json');
      fs.writeFileSync(proposalPath, `${JSON.stringify({ sourceVersion: report.sourceVersion, sourceFileHash: report.sourceFileHash, retrievedAt: report.retrievedAt, records: report.proposedRecords, ambiguous: report.ambiguous, groups: report.groups, existingDiffs: report.existingDiffs }, null, 2)}\n`, 'utf8');
      console.log(`OpenFoodTox: ${inputPath}`);
      console.log(`Taille: ${stat.size} octets | SHA-256: ${report.sourceFileHash}`);
      console.log(`Feuilles: ${report.sheets.map((sheet) => `${sheet.name} (${sheet.rows} lignes)`).join(', ')}`);
      console.log(`Lignes analysées: ${report.totalRowsAnalyzed}`);
      console.log(`25 analysés | ${report.summary.reliableMatches} fiables | ${report.summary.ambiguous} ambiguës | ${report.summary.notFound} non trouvées | ${report.summary.withAdiOrTdi} avec ADI/TDI | ${report.summary.needsManualReview} revues humaines`);
      console.log(`Rapport: ${outputPath}`);
      console.log(`Proposition JSON: ${proposalPath}`);
      log(`Temps total : ${((Date.now() - startedAt) / 1000).toFixed(1)} s`);
    } catch (error) { console.error(error instanceof Error ? error.message : String(error)); process.exitCode = 1; }
  }
}
