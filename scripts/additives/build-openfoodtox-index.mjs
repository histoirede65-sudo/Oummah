#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const RECORD_URL = 'https://zenodo.org/records/19388272/files/OFT3.0%20export%20repository.xlsx?download=1';
const DEFAULT_INPUT = path.join(ROOT, 'scripts/output/openfoodtox/OFT3.0-export-repository.xlsx');
const DEFAULT_OUTPUT = path.join(ROOT, 'scripts/output/openfoodtox-index.json');
const DEFAULT_WORK = path.join(ROOT, 'scripts/output/openfoodtox/unpacked-index');
const PRIORITY_INPUT = path.join(ROOT, 'scripts/output/scientific-profile-priority.json');
const CATALOG_INPUT = path.join(ROOT, 'src/features/boycott/data/eu-additive-catalog.json');

function arg(name, fallback) { const i = process.argv.indexOf(name); return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : fallback; }
function decode(value) { return String(value).replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n))); }
function clean(value) { return decode(String(value ?? '').replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim(); }
function colNumber(ref) { let n = 0; for (const char of ref.match(/[A-Z]+/i)?.[0] ?? '') n = n * 26 + char.toUpperCase().charCodeAt(0) - 64; return n - 1; }
function xmlFile(work, name) { return path.join(work, 'xl', name); }

function sharedStrings(work) {
  const xml = fs.readFileSync(xmlFile(work, 'sharedStrings.xml'), 'utf8');
  return [...xml.matchAll(/<si>([\s\S]*?)<\/si>/g)].map((match) => clean(match[1]));
}

function sheetRows(work, sheetName, strings) {
  const workbook = fs.readFileSync(path.join(work, 'xl/workbook.xml'), 'utf8');
  const relationshipXml = fs.readFileSync(path.join(work, 'xl/_rels/workbook.xml.rels'), 'utf8');
  const sheet = [...workbook.matchAll(/<sheet\b[^>]*name="([^"]+)"[^>]*r:id="([^"]+)"/g)].find((match) => match[1] === sheetName);
  if (!sheet) throw new Error(`Sheet not found: ${sheetName}`);
  const relation = [...relationshipXml.matchAll(/<Relationship\b[^>]*>/g)].map((match) => {
    const id = /\bId="([^"]+)"/.exec(match[0])?.[1];
    const target = /\bTarget="([^"]+)"/.exec(match[0])?.[1];
    return { id, target };
  }).find((candidate) => candidate.id === sheet[2]);
  if (!relation?.target) throw new Error(`Relationship not found for sheet: ${sheetName}`);
  const sheetPath = path.join(work, 'xl', relation.target.replace(/^\//, '').replace(/^xl\//, ''));
  const xml = fs.readFileSync(sheetPath, 'utf8');
  return [...xml.matchAll(/<row\b[^>]*>([\s\S]*?)<\/row>/g)].map((rowMatch) => {
    const cells = [];
    for (const cell of rowMatch[1].matchAll(/<c\b([^>]*)>([\s\S]*?)<\/c>/g)) {
      const attrs = cell[1];
      const ref = /\br="([A-Z]+\d+)"/.exec(attrs)?.[1];
      const value = /<v>([\s\S]*?)<\/v>/.exec(cell[2])?.[1] ?? '';
      if (!ref) continue;
      const index = colNumber(ref);
      cells[index] = /\bt="s"/.test(attrs) ? strings[Number(value)] ?? '' : clean(value);
    }
    return cells;
  });
}

function records(rows) {
  const headers = rows[0] ?? [];
  const width = Math.max(headers.length, ...rows.slice(1, 2).map((row) => row.length), 0);
  return rows.slice(1).map((row) => Object.fromEntries(Array.from({ length: width }, (_, index) => [headers[index] || `column_${index}`, row[index] ?? null]))).filter((row) => Object.values(row).some(Boolean));
}

function normalize(value) {
  return String(value ?? '').normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim().replace(/\s+/g, ' ');
}
function values(row, keys) { return keys.flatMap((key) => String(row[key] ?? '').split(/[|;]/)).map((value) => value.trim()).filter(Boolean); }
function unique(valuesToKeep) { return [...new Set(valuesToKeep.filter(Boolean))]; }
function uuid(value) { return String(value ?? '').match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i)?.[0].toLowerCase() ?? null; }
function year(value) { return String(value ?? '').match(/\b(?:19|20)\d{2}\b/)?.[0] ?? null; }
function number(value) { const match = String(value ?? '').match(/-?\d+(?:[.,]\d+)?/); return match ? Number(match[0].replace(',', '.')) : null; }
function compactText(value, max = 800) { return String(value ?? '').replace(/\s+/g, ' ').trim().slice(0, max) || null; }

function catalogItems(limit = null) {
  const priority = JSON.parse(fs.readFileSync(PRIORITY_INPUT, 'utf8')).entries;
  const catalog = JSON.parse(fs.readFileSync(CATALOG_INPUT, 'utf8')).entries;
  const byCode = new Map(catalog.map((item) => [item.code, item]));
  return (limit === null ? priority : priority.slice(0, limit)).map((item) => ({ ...item, ...(byCode.get(item.code) ?? {}) }));
}

function matchOpenFoodTox(items, refRows, subRows) {
  const candidates = refRows.map((row) => ({
    row,
    refUuid: uuid(row['Document UUID']),
    names: unique(values(row, ['ReferenceSubstanceName', 'CAS name', 'Name', 'PARAM NAME', 'SUB NAME [EFSA OFT2.0]', 'COM NAME [EFSA OFT2.0]'])),
    identifiers: unique(values(row, ['EFSA PARAM CODE', 'EC number', 'CMS-ID', 'PUBCHEM CID'])),
    cas: unique(values(row, ['Inventory.CASNumber', 'CAS number'])),
  }));
  const refsByUuid = new Map(candidates.filter((item) => item.refUuid).map((item) => [item.refUuid, item]));
  for (const row of subRows) {
    const ref = refsByUuid.get(uuid(row['ReferenceSubstance.ReferenceSubstance']));
    if (ref) ref.names = unique([...ref.names, ...values(row, ['ChemicalName', 'ReferenceSubstance.ReferenceSubstance'])]);
  }
  return items.map((item) => {
    const names = unique([item.names?.en, item.canonicalNameEn, ...(item.aliases ?? [])]).filter(Boolean);
    const normalizedNames = names.map(normalize).filter(Boolean);
    const code = String(item.code).toUpperCase();
    const hits = candidates.filter((candidate) => {
      const candidateNames = candidate.names.map(normalize);
      const candidateIds = candidate.identifiers.map((value) => String(value).toUpperCase().replace(/\s+/g, ''));
      const codeVariants = [code, code.replace(/^E/, 'E '), code.replace(/^E/, '')];
      return candidateIds.some((value) => codeVariants.includes(value)) || candidateNames.some((value) => normalizedNames.includes(value));
    });
    const uniqueHits = [...new Map(hits.map((hit) => [hit.refUuid ?? JSON.stringify(hit.row), hit])).values()];
    const nameHits = uniqueHits.filter((hit) => hit.names.some((name) => normalizedNames.includes(normalize(name))));
    const idHits = uniqueHits.filter((hit) => hit.identifiers.some((value) => [code, code.replace(/^E/, '')].includes(String(value).toUpperCase().replace(/\s+/g, ''))));
    let matchConfidence = null;
    if (idHits.length === 1) matchConfidence = 'exact';
    else if (nameHits.length === 1) matchConfidence = 'strong';
    else if (uniqueHits.length > 0) matchConfidence = 'possible';
    return { item, matches: uniqueHits, matchConfidence };
  });
}

function extractOpenFoodToxAssessments(match, subRows, dossierRows, dossierDocsRows, toxRows, endRows) {
  const refIds = new Set(match.matches.map((hit) => hit.refUuid).filter(Boolean));
  const linkedSubRows = subRows.filter((row) => refIds.has(uuid(row['ReferenceSubstance.ReferenceSubstance'])));
  const subIds = new Set(linkedSubRows.map((row) => uuid(row['Document UUID'])).filter(Boolean));
  const parentIds = new Set(linkedSubRows.map((row) => uuid(row['Parent UUID'])).filter(Boolean));
  // DOSSIER_DOCS links a dossier to SUB/summary documents; use exact UUIDs only.
  const dossierIds = new Set([...parentIds, ...dossierDocsRows.filter((row) => refIds.has(uuid(row['DOCUMENT UUID'])) || subIds.has(uuid(row['DOCUMENT UUID']))).map((row) => uuid(row['DOSSIER UUID'])).filter(Boolean)]);
  const relatedDocs = new Set(dossierDocsRows.filter((row) => dossierIds.has(uuid(row['DOSSIER UUID']))).map((row) => uuid(row['DOCUMENT UUID'])).filter(Boolean));
  const relevantDossiers = dossierRows.filter((row) => dossierIds.has(uuid(row['Document UUID'])));
  const humanDossiers = relevantDossiers.filter((row) => /food additive|food-additive|human|food/i.test(`${row['Domain.FoodDomain'] ?? ''} ${row['Domain.ExpertGroup'] ?? ''} ${row['DossierSubject.Name'] ?? ''}`));
  const humanDossierIds = new Set(humanDossiers.map((row) => uuid(row['Document UUID'])).filter(Boolean));
  const humanRelatedDocs = new Set(dossierDocsRows.filter((row) => humanDossierIds.has(uuid(row['DOSSIER UUID']))).map((row) => uuid(row['DOCUMENT UUID'])).filter(Boolean));
  const relevantTox = toxRows.filter((row) => relatedDocs.has(uuid(row['Document UUID'])) || relatedDocs.has(uuid(row['Parent UUID'])));
  const relevantEnd = endRows.filter((row) => humanRelatedDocs.has(uuid(row['Document UUID'])) || humanRelatedDocs.has(uuid(row['Parent UUID'])));
  const references = humanDossiers.map((row) => { const persistent = String(row['LiteratureReference.LinkToPersistentIdentifier'] ?? '').trim(); const doi = persistent.match(/10\.\d{4,9}\/[^\s]+/i)?.[0] ?? null; return { title: compactText(row['LiteratureReference.EFSAOutputTitle'], 500), year: year(row['LiteratureReference.DateOfEvaluation']), doi, url: doi ? `https://doi.org/${doi}` : persistent || null, efsaOutputId: row['DataSource.EFSAQuestionNumber'] || null }; });
  const referenceValues = relevantTox.flatMap((row) => {
    const adi = {
      lowerQualifier: row['HumanHealthHazardCharacteristics.AcceptableDailyIntake.Adi.lowerQualifier'] || null,
      lowerValue: number(row['HumanHealthHazardCharacteristics.AcceptableDailyIntake.Adi.lowerValue']),
      upperQualifier: row['HumanHealthHazardCharacteristics.AcceptableDailyIntake.Adi.upperQualifier'] || null,
      upperValue: number(row['HumanHealthHazardCharacteristics.AcceptableDailyIntake.Adi.upperValue']),
      unit: row['HumanHealthHazardCharacteristics.AcceptableDailyIntake.Adi.Unit'] || null,
      population: row['HumanHealthHazardCharacteristics.AcceptableDailyIntake.Adi.Population'] || null,
      assessmentBody: row['HumanHealthHazardCharacteristics.AcceptableDailyIntake.Adi.AssessmentBody'] || null,
      criticalEndpoint: row['HumanHealthHazardCharacteristics.AcceptableDailyIntake.Adi.CriticalEndpoint'] || null,
      noAllocated: row['HumanHealthHazardCharacteristics.AcceptableDailyIntake.Adi.NoAllocated'] || null,
      justification: compactText(row['HumanHealthHazardCharacteristics.AcceptableDailyIntake.Adi.JustificationAndComments'] || row['HumanHealthHazardCharacteristics.AcceptableDailyIntake.Adi.Justification']),
      type: 'ADI',
    };
    const hasAdi = Object.values(adi).some((value) => value !== null && value !== '');
    const other = Object.entries(row).filter(([key, value]) => /OtherReferenceValues|AcuteReferenceDose|TolerableDailyIntake/i.test(key) && value).map(([key, value]) => ({ field: key, value: compactText(value, 300) }));
    return hasAdi ? [adi, ...other] : other;
  });
  const effects = relevantEnd.map((row) => Object.fromEntries(Object.entries(row).filter(([key, value]) => value && /endpoint|effect|hazard|discussion|keyinformation/i.test(key)).map(([key, value]) => [key, compactText(value, 500)])));
  return { assessmentReferences: unique(references.map((item) => JSON.stringify(item))).map((item) => JSON.parse(item)), referenceValues, referencePoints: [], humanHealthEffects: effects, uncertaintyInformation: unique(relevantTox.flatMap((row) => Object.entries(row).filter(([key, value]) => value && /uncertainty/i.test(key)).map(([, value]) => compactText(value)))).slice(0, 30), assessmentDomain: humanDossiers.length ? 'food_additive_human' : relevantDossiers.length ? 'other_or_unresolved' : null, assessmentContext: unique(relevantDossiers.map((row) => row['Domain.FoodDomain']).filter(Boolean)), dossierCount: relevantDossiers.length, linkDiagnostics: { matchedReferenceSubstances: refIds.size, linkedSubstances: subIds.size, parentIds: parentIds.size, matchedDossiers: dossierIds.size, relatedDocuments: relatedDocs.size, toxRows: relevantTox.length, endpointRows: relevantEnd.length } };
}

async function download(input) {
  if (fs.existsSync(input)) return;
  fs.mkdirSync(path.dirname(input), { recursive: true });
  const response = await fetch(RECORD_URL, { headers: { Accept: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' } });
  if (!response.ok) throw new Error(`OpenFoodTox download failed: ${response.status}`);
  fs.writeFileSync(input, Buffer.from(await response.arrayBuffer()));
}

async function main() {
  const input = path.resolve(arg('--input', DEFAULT_INPUT));
  const output = path.resolve(arg('--output', DEFAULT_OUTPUT));
  const work = path.resolve(arg('--work', DEFAULT_WORK));
  const inspectOnly = process.argv.includes('--inspect');
  const sampleOnly = process.argv.includes('--sample');
  await download(input);
  if (!fs.existsSync(path.join(work, 'xl/sharedStrings.xml'))) {
    fs.mkdirSync(work, { recursive: true });
    execFileSync('tar', ['-xf', input, '-C', work]);
  }
  const strings = sharedStrings(work);
  const sheetNames = ['DATA_DICTIONARY', 'SUB', 'REF_SUB', 'DOSSIER', 'DOSSIER_DOCS', 'FLEX_SUM.ToxRefValues', 'FLEX_SUM.ExpectedExposure', 'END_SUM'];
  const indexed = {};
  for (const sheetName of sheetNames) {
    const rows = sheetRows(work, sheetName, strings);
    const data = records(rows);
    indexed[sheetName] = { rowCount: data.length, columns: Object.keys(data[0] ?? {}), ...(inspectOnly ? {} : sampleOnly ? { samples: data.slice(0, 3) } : { records: data }) };
  }
  if (!inspectOnly && !sampleOnly) {
    const requestedLimit = process.argv.includes('--all-priority') ? null : Number(arg('--priority-limit', '30'));
    const items = catalogItems(Number.isFinite(requestedLimit) ? requestedLimit : null);
    const refRows = indexed.REF_SUB.records;
    const subRows = indexed.SUB.records;
    const matches = matchOpenFoodTox(items, refRows, subRows);
    const dossierRows = indexed.DOSSIER.records;
    const dossierDocsRows = indexed.DOSSIER_DOCS.records;
    const toxRows = indexed['FLEX_SUM.ToxRefValues'].records;
    const endRows = indexed.END_SUM.records;
    indexed.SUB = { rowCount: indexed.SUB.rowCount, columns: indexed.SUB.columns };
    indexed.REF_SUB = { rowCount: indexed.REF_SUB.rowCount, columns: indexed.REF_SUB.columns };
    indexed.DOSSIER = { rowCount: indexed.DOSSIER.rowCount, columns: indexed.DOSSIER.columns };
    indexed.DOSSIER_DOCS = { rowCount: indexed.DOSSIER_DOCS.rowCount, columns: indexed.DOSSIER_DOCS.columns };
    indexed['FLEX_SUM.ToxRefValues'] = { rowCount: indexed['FLEX_SUM.ToxRefValues'].rowCount, columns: indexed['FLEX_SUM.ToxRefValues'].columns };
    indexed.END_SUM = { rowCount: indexed.END_SUM.rowCount, columns: indexed.END_SUM.columns };
    indexed.DATA_DICTIONARY = { rowCount: indexed.DATA_DICTIONARY.rowCount, columns: indexed.DATA_DICTIONARY.columns };
    indexed.priorityBatch = matches.map((match) => {
      const extraction = extractOpenFoodToxAssessments(match, subRows, dossierRows, dossierDocsRows, toxRows, endRows);
      const identifiers = match.matches.map((hit) => ({ referenceSubstanceUuid: hit.refUuid, names: hit.names.slice(0, 12), cas: hit.cas, identifiers: hit.identifiers }));
      return { code: match.item.code, canonicalName: match.item.names?.en ?? match.item.code, matchConfidence: match.matchConfidence, matchedReferenceSubstances: identifiers, ...extraction };
    });
  }
  const priorityBatch = indexed.priorityBatch ?? [];
  delete indexed.priorityBatch;
  const index = { schemaVersion: '1.1', source: { authority: 'EFSA', dataset: 'OpenFoodTox 3.0', doi: '10.5281/zenodo.19388272', recordUrl: 'https://zenodo.org/records/19388272', downloadUrl: RECORD_URL, retrievedAt: new Date().toISOString() }, workbook: { input: path.relative(ROOT, input), sheets: indexed }, substanceCount: indexed.SUB.rowCount, referenceSubstanceCount: indexed.REF_SUB.rowCount, priorityLimit: priorityBatch.length, priorityBatch };
  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(output, `${JSON.stringify(index, null, 2)}\n`, 'utf8');
  console.log(JSON.stringify({ output, input, substanceCount: index.substanceCount, sheets: Object.fromEntries(Object.entries(indexed).map(([name, value]) => [name, { rowCount: value.rowCount, columns: value.columns }])) }, null, 2));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main().catch((error) => { console.error(error instanceof Error ? error.stack ?? error.message : String(error)); process.exitCode = 1; });
