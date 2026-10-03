#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const INPUT = path.join(ROOT, 'scripts/data/OpenFoodTox-3.0.xlsx');
const WORK = path.join(ROOT, 'scripts/output/openfoodtox/unpacked-index');
const INDEX = path.join(ROOT, 'scripts/output/openfoodtox-index.json');
const CATALOG = path.join(ROOT, 'src/features/boycott/data/eu-additive-catalog.json');
const OUTPUT = path.join(ROOT, 'scripts/output/openfoodtox-hazard-evidence-structure-audit-v1.json');

const SHEETS = [
  'DATA_DICTIONARY', 'SUB', 'REF_SUB', 'DOSSIER', 'DOSSIER_DOCS', 'FLEX_REC', 'LIT',
  'FLEX_SUM.ToxRefValues', 'FLEX_SUM.Metabolites', 'END_STUDY_REC.HumanHealth',
  'END_STUDY_REC.AnimalHealth', 'END_SUM', 'FLEX_SUM.ExpectedExposure',
];

function decode(value) {
  return String(value ?? '')
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(Number.parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, decimal) => String.fromCodePoint(Number(decimal)))
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'").replace(/&amp;/g, '&');
}
function clean(value) { return decode(String(value ?? '').replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim(); }
function colNumber(ref) { let n = 0; for (const c of ref.match(/[A-Z]+/i)?.[0] ?? '') n = n * 26 + c.toUpperCase().charCodeAt(0) - 64; return n - 1; }
function uuid(value) { return String(value ?? '').match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i)?.[0].toLowerCase() ?? null; }
function text(value) { return String(value ?? '').trim(); }
function nonEmpty(value) { return text(value) !== ''; }
function unique(values) { return [...new Set(values.filter(nonEmpty))]; }
function keyValues(row, pattern) { return Object.entries(row).filter(([key, value]) => pattern.test(key) && nonEmpty(value)); }
function short(value, max = 500) { const result = text(value).replace(/\s+/g, ' '); return result ? result.slice(0, max) : null; }
function normalize(value) { return text(value).normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim(); }

function ensureWorkdir() {
  if (fs.existsSync(path.join(WORK, 'xl/sharedStrings.xml'))) return;
  fs.mkdirSync(WORK, { recursive: true });
  execFileSync('tar', ['-xf', INPUT, '-C', WORK]);
}
function sharedStrings() {
  const xml = fs.readFileSync(path.join(WORK, 'xl/sharedStrings.xml'), 'utf8');
  return [...xml.matchAll(/<si>([\s\S]*?)<\/si>/g)].map((m) =>
    [...m[1].matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map((part) => decode(part[1])).join(''));
}
function workbookRelations() {
  const workbook = fs.readFileSync(path.join(WORK, 'xl/workbook.xml'), 'utf8');
  const relations = fs.readFileSync(path.join(WORK, 'xl/_rels/workbook.xml.rels'), 'utf8');
  const byId = new Map([...relations.matchAll(/<Relationship\b[^>]*>/g)].map((m) => {
    const id = /\bId="([^"]+)"/.exec(m[0])?.[1];
    const target = /\bTarget="([^"]+)"/.exec(m[0])?.[1];
    return [id, target];
  }));
  return new Map([...workbook.matchAll(/<sheet\b[^>]*name="([^"]+)"[^>]*r:id="([^"]+)"/g)].map((m) => {
    const target = byId.get(m[2]);
    return [decode(m[1]), path.join(WORK, 'xl', target.replace(/^\//, '').replace(/^xl[\\/]/, ''))];
  }));
}
function readSheet(name, strings, relationMap) {
  const xml = fs.readFileSync(relationMap.get(name), 'utf8');
  const rows = [...xml.matchAll(/<row\b[^>]*>([\s\S]*?)<\/row>/g)].map((rowMatch) => {
    const cells = [];
    for (const cell of rowMatch[1].matchAll(/<c\b([^>]*)>([\s\S]*?)<\/c>/g)) {
      const ref = /\br="([A-Z]+\d+)"/.exec(cell[1])?.[1];
      if (!ref) continue;
      const value = /<v>([\s\S]*?)<\/v>/.exec(cell[2])?.[1] ?? '';
      cells[colNumber(ref)] = /\bt="s"/.test(cell[1]) ? strings[Number(value)] ?? '' : clean(value);
    }
    return cells;
  });
  const headers = rows[0] ?? [];
  return rows.slice(1).map((row) => Object.fromEntries(
    headers.map((header, i) => [header || `column_${i}`, row[i] ?? '']).filter(([key, value]) => key && nonEmpty(value)),
  )).filter((row) => Object.keys(row).length);
}
function recordsWithColumns(rows) {
  const columns = unique(rows.flatMap((row) => Object.keys(row)));
  return { rows, columns };
}

function sourceMappings(index) {
  const catalog = JSON.parse(fs.readFileSync(CATALOG, 'utf8')).entries ?? [];
  const existing = new Map((index.priorityBatch ?? []).map((entry) => [String(entry.code).toUpperCase(), entry]));
  const byCode = new Map(catalog.map((item) => [String(item.code).toUpperCase(), item]));
  return catalog.map((catalogItem) => {
    const code = String(catalogItem.code).toUpperCase();
    const entry = existing.get(code);
    return {
      code,
      canonicalName: entry?.canonicalName ?? catalogItem.names?.en ?? code,
      refs: unique((entry?.matchedReferenceSubstances ?? []).map((item) => uuid(item.referenceSubstanceUuid))),
      catalog: byCode.get(code) ?? null,
    };
  });
}

function linkForCode(mapping, tables) {
  const refs = new Set(mapping.refs);
  const sub = tables.SUB.filter((row) => refs.has(uuid(row['ReferenceSubstance.ReferenceSubstance'])));
  const subDocs = new Set(sub.map((row) => uuid(row['Document UUID'])).filter(Boolean));
  const parentDocs = new Set(sub.map((row) => uuid(row['Parent UUID'])).filter(Boolean));
  const dossierDocs = tables.DOSSIER_DOCS;
  const dossiers = new Set([
    ...parentDocs,
    ...dossierDocs.filter((row) => refs.has(uuid(row['DOCUMENT UUID'])) || subDocs.has(uuid(row['DOCUMENT UUID']))).map((row) => uuid(row['DOSSIER UUID'])).filter(Boolean),
  ]);
  const linkedDocuments = new Set(dossierDocs.filter((row) => dossiers.has(uuid(row['DOSSIER UUID']))).map((row) => uuid(row['DOCUMENT UUID'])).filter(Boolean));
  const humanDossiers = tables.DOSSIER.filter((row) => dossiers.has(uuid(row['Document UUID'])) && /food additive|food-additive|human|food/i.test(`${row['Domain.FoodDomain'] ?? ''} ${row['Domain.ExpertGroup'] ?? ''} ${row['DossierSubject.Name'] ?? ''}`));
  const humanDossierIds = new Set(humanDossiers.map((row) => uuid(row['Document UUID'])).filter(Boolean));
  const humanDocuments = new Set(dossierDocs.filter((row) => humanDossierIds.has(uuid(row['DOSSIER UUID']))).map((row) => uuid(row['DOCUMENT UUID'])).filter(Boolean));
  const matches = (row, docs = linkedDocuments) => docs.has(uuid(row['Document UUID'])) || docs.has(uuid(row['Parent UUID']));
  return { refs, sub, subDocs, parentDocs, dossiers, linkedDocuments, humanDossiers, humanDocuments, matches };
}

function fieldInventory(rows, patterns) {
  const fields = unique(rows.flatMap((row) => Object.keys(row)).filter((key) => patterns.some((pattern) => pattern.test(key))));
  return fields.map((field) => ({ field, nonEmptyRecords: rows.filter((row) => nonEmpty(row[field])).length, distinctValues: new Set(rows.map((row) => text(row[field])).filter(Boolean)).size }));
}
function valuesForFields(rows, fields) { return rows.flatMap((row) => fields.flatMap((field) => nonEmpty(row[field]) ? [text(row[field])] : [])); }
function topValues(values, limit = 30) {
  const counts = new Map(); for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, limit).map(([value, count]) => ({ value, count }));
}
function classifySpecies(value) {
  const n = normalize(value);
  if (!n) return null;
  if (/\bhuman\b|\bpeople\b|\bvolunteer|patient/.test(n)) return 'human';
  if (/\brat\b|\brats\b/.test(n)) return 'rat';
  if (/\bmouse\b|\bmice\b/.test(n)) return 'mouse';
  if (/\bdog\b|\bbeagle\b/.test(n)) return 'dog';
  if (/\brabbit\b/.test(n)) return 'rabbit';
  return 'other';
}

function endpointAudit(tables) {
  const sources = ['END_SUM', 'END_STUDY_REC.HumanHealth', 'END_STUDY_REC.AnimalHealth'];
  const rows = sources.flatMap((name) => (tables[name] ?? []).map((row) => ({ ...row, __sourceTable: name })));
  const endpointFields = fieldInventory(rows, [/\.Endpoint(?:\.|$)/i, /EndpointConclusion/i]);
  const recordsWithEndpoint = rows.filter((row) => endpointFields.some((field) => nonEmpty(row[field.field]))).length;
  return { sourceTables: sources, rowCount: rows.length, endpointFields, recordsWithEndpoint, distinctEndpointLikeValues: new Set(valuesForFields(rows, endpointFields.map((f) => f.field))).size };
}

function criticalAudit(toxRows, mappings, linksByCode) {
  const fields = fieldInventory(toxRows, [/CriticalEndpoint/i]);
  const records = toxRows.flatMap((row, index) => fields.filter((field) => nonEmpty(row[field.field])).map((field) => ({ rowIndex: index + 2, field: field.field, value: text(row[field.field]), documentUuid: uuid(row['Document UUID']), parentUuid: uuid(row['Parent UUID']) })));
  const codeSet = new Set();
  for (const mapping of mappings) {
    const link = linksByCode.get(mapping.code);
    if (link && toxRows.some((row) => link.matches(row) && fields.some((field) => nonEmpty(row[field.field])))) codeSet.add(mapping.code);
  }
  const matchedReferenceSubstanceCount = new Set(mappings.filter((mapping) => codeSet.has(mapping.code)).flatMap((mapping) => mapping.refs)).size;
  return { sourceTable: 'FLEX_SUM.ToxRefValues', fields, totalRecords: records.length, documentsWithCriticalEndpoint: new Set(records.map((r) => r.documentUuid || r.parentUuid).filter(Boolean)).size, matchedOummahReferenceSubstanceCount: matchedReferenceSubstanceCount, oummahCodes: [...codeSet], oummahCodeCount: codeSet.size, distinctValues: topValues(records.map((r) => r.value), 100), linkedRecords: records.slice(0, 50) };
}

function referenceAudit(toxRows, mappings, linksByCode) {
  const prefixes = ['AcceptableDailyIntake.Adi', 'AcceptableOperatorExposureLevel.Aoel', 'AcuteAcceptableOperatorExposureLevel.Aaoel', 'AcuteReferenceDose.Arfd', 'OtherReferenceValues'];
  const records = [];
  for (let i = 0; i < toxRows.length; i += 1) {
    const row = toxRows[i];
    for (const prefix of prefixes) {
      const entries = Object.entries(row).filter(([key, value]) => key.includes(prefix) && nonEmpty(value));
      if (!entries.length) continue;
      const descriptor = entries.find(([key]) => /ReferenceValueDescriptor|lowerQualifier|upperQualifier/i.test(key))?.[1] ?? null;
      const value = entries.find(([key]) => /\.lowerValue$|\.upperValue$|\.Value$/i.test(key))?.[1] ?? null;
      const unit = entries.find(([key]) => /\.Unit$/i.test(key))?.[1] ?? null;
      const endpoint = entries.find(([key]) => /CriticalEndpoint/i.test(key))?.[1] ?? null;
      const population = entries.find(([key]) => /Population(?:\.Other)?$/i.test(key))?.[1] ?? null;
      const assessment = entries.find(([key]) => /AssessmentBody|ReferenceToEFSAOpinion/i.test(key))?.[1] ?? null;
      records.push({ rowIndex: i + 2, type: prefix, descriptor: short(descriptor, 200), value, unit, criticalEndpoint: short(endpoint, 200), population: short(population, 200), assessment: short(assessment, 200), documentUuid: uuid(row['Document UUID']), parentUuid: uuid(row['Parent UUID']) });
    }
  }
  const codeSet = new Set(); for (const mapping of mappings) { const link = linksByCode.get(mapping.code); if (link && records.some((record) => link.linkedDocuments.has(record.documentUuid) || link.linkedDocuments.has(record.parentUuid))) codeSet.add(mapping.code); }
  return { sourceTable: 'FLEX_SUM.ToxRefValues', typeCounts: topValues(records.map((r) => r.type), 20), totalReferenceRecords: records.length, recordsWithValue: records.filter((r) => nonEmpty(r.value)).length, recordsWithUnit: records.filter((r) => nonEmpty(r.unit)).length, recordsWithCriticalEndpoint: records.filter((r) => nonEmpty(r.criticalEndpoint)).length, recordsWithPopulation: records.filter((r) => nonEmpty(r.population)).length, recordsWithAssessmentOrSource: records.filter((r) => nonEmpty(r.assessment)).length, oummahCodeCount: codeSet.size, oummahCodes: [...codeSet], samples: records.slice(0, 30) };
}

function coverageForCodes(mappings, linksByCode, tables, audits) {
  const output = { totalOummahCodes: mappings.length };
  const sets = { studyContext: new Set(), species: new Set(), criticalEndpoint: new Set(), referencePoint: new Set(), studyType: new Set(), reliabilityEvidence: new Set(), explicitSeverity: new Set(), explicitEvidence: new Set() };
  const toxFields = audits.criticalFields;
  const speciesFields = audits.speciesFields.map((x) => x.field);
  const studyFields = audits.studyFields.map((x) => x.field);
  const reliabilityFields = audits.reliabilityFields.map((x) => x.field);
  const severityFields = audits.severityFields.map((x) => x.field);
  const evidenceFields = audits.evidenceFields.map((x) => x.field);
  for (const mapping of mappings) {
    const link = linksByCode.get(mapping.code); if (!link) continue;
    const tox = tables['FLEX_SUM.ToxRefValues'].filter((row) => link.matches(row));
    const endpoints = [...tables.END_SUM, ...tables['END_STUDY_REC.HumanHealth'], ...tables['END_STUDY_REC.AnimalHealth']].filter((row) => link.matches(row));
    const study = [...tables['END_STUDY_REC.HumanHealth'], ...tables['END_STUDY_REC.AnimalHealth']].filter((row) => link.matches(row));
    const hasContext = study.length > 0 || study.some((row) => Object.keys(row).some((k) => /human|animal|in.?vitro/i.test(k) && nonEmpty(row[k])));
    if (hasContext) sets.studyContext.add(mapping.code);
    if (study.some((row) => speciesFields.some((field) => nonEmpty(row[field])))) sets.species.add(mapping.code);
    if (tox.some((row) => toxFields.some((field) => nonEmpty(row[field])))) sets.criticalEndpoint.add(mapping.code);
    if (tox.some((row) => Object.keys(row).some((field) => /AcceptableDailyIntake|ReferenceDose|OtherReferenceValues|ExposureLevel/i.test(field) && /Value|Descriptor/i.test(field) && nonEmpty(row[field])))) sets.referencePoint.add(mapping.code);
    if (study.some((row) => studyFields.some((field) => nonEmpty(row[field])))) sets.studyType.add(mapping.code);
    if (study.some((row) => reliabilityFields.some((field) => nonEmpty(row[field])))) sets.reliabilityEvidence.add(mapping.code);
    if (endpoints.some((row) => severityFields.some((field) => nonEmpty(row[field])))) sets.explicitSeverity.add(mapping.code);
    if (endpoints.some((row) => evidenceFields.some((field) => nonEmpty(row[field])))) sets.explicitEvidence.add(mapping.code);
  }
  for (const [key, set] of Object.entries(sets)) output[key] = { count: set.size, codes: [...set] };
  return output;
}

function codeCheck(code, mapping, link, tables, audits) {
  const tox = tables['FLEX_SUM.ToxRefValues'].filter((row) => link.matches(row));
  const study = [...tables['END_STUDY_REC.HumanHealth'], ...tables['END_STUDY_REC.AnimalHealth']].filter((row) => link.matches(row));
  const critical = tox.flatMap((row) => audits.criticalFields.filter((field) => nonEmpty(row[field])).map((field) => ({ field, value: short(row[field], 300) }))).slice(0, 20);
  const refs = tox.flatMap((row, i) => audits.referencePrefixes.filter((prefix) => Object.keys(row).some((key) => key.includes(prefix) && nonEmpty(row[key]))).map((prefix) => ({ row: i + 2, type: prefix, fields: Object.fromEntries(Object.entries(row).filter(([key, value]) => key.includes(prefix) && nonEmpty(value)).slice(0, 12)) }))).slice(0, 20);
  const species = topValues(valuesForFields(study, audits.speciesFields.map((x) => x.field)), 15);
  const studyTypes = topValues(valuesForFields(study, audits.studyFields.map((x) => x.field)), 15);
  const context = { humanRecords: tables['END_STUDY_REC.HumanHealth'].filter((row) => link.matches(row)).length, animalRecords: tables['END_STUDY_REC.AnimalHealth'].filter((row) => link.matches(row)).length, inVitroRecords: study.filter((row) => Object.entries(row).some(([key, value]) => /in.?vitro/i.test(key) && /in.?vitro/i.test(text(value)))).length };
  return { code, canonicalName: mapping.canonicalName, referenceSubstanceUuids: mapping.refs, linkCounts: { sub: link.sub.length, dossiers: link.dossiers.size, linkedDocuments: link.linkedDocuments.size, humanDocuments: link.humanDocuments.size, toxRows: tox.length, studyRows: study.length }, criticalEndpoints: critical, referencePoints: refs, species, studyTypes, studyContext: context, evidenceFields: fieldInventory([...study, ...tox], [/evidence|reliab|quality|confidence|uncertainty|weight/i]), severityFields: fieldInventory([...study, ...tox], [/severity|serious|adverse/i]) };
}

function jecfaAudit() {
  const file = path.join(ROOT, 'scripts/output/jecfa-index.json');
  if (!fs.existsSync(file)) return { available: false, reason: 'jecfa-index.json not found' };
  const value = JSON.parse(fs.readFileSync(file, 'utf8'));
  const rows = Array.isArray(value) ? value : Array.isArray(value.entries) ? value.entries : Array.isArray(value.records) ? value.records : [];
  const flattened = [];
  const walk = (node, prefix = '') => {
    if (!node || typeof node !== 'object') return;
    if (Array.isArray(node)) return node.forEach((item) => walk(item, prefix));
    for (const [key, child] of Object.entries(node)) {
      const next = prefix ? `${prefix}.${key}` : key;
      if (child && typeof child === 'object') walk(child, next);
      else if (nonEmpty(child)) flattened.push({ path: next, value: text(child) });
    }
  };
  rows.forEach((row) => walk(row));
  const relevant = unique(flattened.map((item) => item.path)).filter((key) => /critical.?effect|species|toxicological|basis|reason.*adi|evidence|quality/i.test(key));
  const fields = relevant.map((field) => ({ field, nonEmptyRecords: flattened.filter((item) => item.path === field).length, samples: topValues(flattened.filter((item) => item.path === field).map((item) => item.value), 5) }));
  const structuredReferenceFields = unique(flattened.map((item) => item.path)).filter((key) => /(^|\.)(adi|intake|lower|upper|unit|status|meeting|evaluationScope)(\.|$)/i.test(key)).map((field) => ({ field, nonEmptyRecords: flattened.filter((item) => item.path === field).length, samples: topValues(flattened.filter((item) => item.path === field).map((item) => item.value), 5) }));
  return { available: true, rootKeys: Object.keys(value), recordCount: rows.length, structuredFields: fields, structuredReferenceFields, note: 'Comments libres non analysés.' };
}

function main() {
  ensureWorkdir();
  const strings = sharedStrings(); const relationMap = workbookRelations();
  const tables = {}; for (const name of SHEETS) if (relationMap.has(name)) tables[name] = readSheet(name, strings, relationMap);
  const rawTableStructure = Object.fromEntries(Object.entries(tables).map(([name, rows]) => [name, { rowCount: rows.length, columns: unique(rows.flatMap((row) => Object.keys(row))) }]));
  const dictionary = tables.DATA_DICTIONARY ?? [];
  const dictionaryByTable = {};
  for (const row of dictionary) { const table = text(row['Table name']); if (!table) continue; (dictionaryByTable[table] ??= []).push({ field: row['Field name'] ?? null, genericType: row['Field generic type'] ?? null, dataType: row['Field data type'] ?? null, referencedDocument: row['Referenced IUCLID document'] ?? null }); }
  const index = JSON.parse(fs.readFileSync(INDEX, 'utf8')); const mappings = sourceMappings(index);
  const linksByCode = new Map(mappings.map((mapping) => [mapping.code, linkForCode(mapping, tables)]));
  const toxRows = tables['FLEX_SUM.ToxRefValues'] ?? [];
  const allEndpointRows = [...(tables.END_SUM ?? []), ...(tables['END_STUDY_REC.HumanHealth'] ?? []), ...(tables['END_STUDY_REC.AnimalHealth'] ?? [])];
  const studyRows = [...(tables['END_STUDY_REC.HumanHealth'] ?? []), ...(tables['END_STUDY_REC.AnimalHealth'] ?? [])];
  const criticalFields = fieldInventory(toxRows, [/CriticalEndpoint/i]);
  const speciesFields = fieldInventory(studyRows, [/\.Species(?:\.|$)/i, /Organism/i]);
  const studyFields = fieldInventory(studyRows, [/StudyType/i, /StudyNameType/i, /ObjectiveOfStudyPick/i, /StudyDesign/i]);
  const reliabilityFields = fieldInventory([...studyRows, ...toxRows, ...tables.END_SUM], [/reliab|quality|weight.?of.?evidence|adequacy|guideline|uncertainty|confidence/i]);
  const severityFields = fieldInventory([...studyRows, ...toxRows, ...tables.END_SUM], [/severity|seriousness|serious|adverse.?effect/i]);
  const evidenceFields = fieldInventory([...studyRows, ...toxRows, ...tables.END_SUM], [/evidence|strength|weight.?of.?evidence|confidence/i]);
  const endpoint = endpointAudit(tables);
  const critical = criticalAudit(toxRows, mappings, linksByCode);
  const reference = referenceAudit(toxRows, mappings, linksByCode);
  const audits = { toxFields: Object.keys(toxRows[0] ?? {}), speciesFields, studyFields, reliabilityFields, severityFields, evidenceFields, criticalFields: criticalFields.map((x) => x.field), referencePrefixes: ['AcceptableDailyIntake.Adi', 'AcceptableOperatorExposureLevel.Aoel', 'AcuteAcceptableOperatorExposureLevel.Aaoel', 'AcuteReferenceDose.Arfd', 'OtherReferenceValues'] };
  const coverage = coverageForCodes(mappings, linksByCode, tables, audits);
  const studyContextRecords = { humanRecords: tables['END_STUDY_REC.HumanHealth']?.length ?? 0, animalRecords: tables['END_STUDY_REC.AnimalHealth']?.length ?? 0, inVitroRecords: studyRows.filter((row) => Object.entries(row).some(([key, value]) => /in.?vitro/i.test(key) && /in.?vitro/i.test(text(value)))).length, mixedRecords: 0, unknownRecords: 0 };
  const speciesValues = valuesForFields(studyRows, speciesFields.map((x) => x.field));
  const speciesCounts = { human: 0, rat: 0, mouse: 0, dog: 0, rabbit: 0, other: 0 };
  for (const value of speciesValues) { const kind = classifySpecies(value); if (kind) speciesCounts[kind] += 1; }
  const studyTypeValues = valuesForFields(studyRows, studyFields.map((x) => x.field));
  const seven = ['E102', 'E122', 'E124', 'E129', 'E132', 'E133', 'E171'].map((code) => { const mapping = mappings.find((item) => item.code === code); return codeCheck(code, mapping, linksByCode.get(code), tables, audits); });
  const representative = {};
  const findSample = (predicate) => mappings.map((mapping) => ({ mapping, link: linksByCode.get(mapping.code) })).find(({ link }) => link && predicate(link));
  for (const [name, predicate] of Object.entries({ withCriticalEndpoint: (link) => toxRows.some((row) => link.matches(row) && criticalFields.some((field) => nonEmpty(row[field.field]))), withReferencePoint: (link) => toxRows.some((row) => link.matches(row) && Object.keys(row).some((field) => /AcceptableDailyIntake|ReferenceDose|OtherReferenceValues|ExposureLevel/i.test(field) && /Value|Descriptor/i.test(field) && nonEmpty(row[field]))), withAnimalStudy: (link) => tables['END_STUDY_REC.AnimalHealth'].some((row) => link.matches(row)), withHumanStudy: (link) => tables['END_STUDY_REC.HumanHealth'].some((row) => link.matches(row)), withMultipleEndpoints: (link) => [...tables.END_SUM, ...studyRows].filter((row) => link.matches(row) && Object.keys(row).some((field) => /endpoint|effect|conclusion/i.test(field) && nonEmpty(row[field]))).length > 1, withoutStructuredContext: (link) => !studyRows.some((row) => link.matches(row)) })) { const found = findSample(predicate); representative[name] = found ? codeCheck(found.mapping.code, found.mapping, found.link, tables, audits) : null; }
  const report = {
    schemaVersion: 'openfoodtox-hazard-evidence-structure-audit-v1', source: { workbook: path.relative(ROOT, INPUT), index: path.relative(ROOT, INDEX), readOnly: true },
    tableStructure: { sheets: rawTableStructure, dataDictionary: { rowCount: dictionary.length, fieldsByTable: dictionaryByTable } },
    joinStructure: { substance: 'REF_SUB.Document UUID', subReference: 'SUB.ReferenceSubstance.ReferenceSubstance -> REF_SUB.Document UUID', subDocument: 'SUB.Document UUID', subParent: 'SUB.Parent UUID', dossier: 'DOSSIER_DOCS.DOSSIER UUID -> DOSSIER.Document UUID', dossierDocument: 'DOSSIER_DOCS.DOCUMENT UUID -> document UUID / Parent UUID', codeMatch: 'OUMMAH code -> existing openfoodtox-index priorityBatch matchedReferenceSubstances' },
    endpointCoverage: endpoint,
    criticalEndpointCoverage: critical,
    studyContextCoverage: { structuredSourceTables: ['END_STUDY_REC.HumanHealth', 'END_STUDY_REC.AnimalHealth'], fields: fieldInventory(studyRows, [/human|animal|in.?vitro|context|study/i]), ...studyContextRecords },
    speciesCoverage: { fields: speciesFields, explicitValueCounts: speciesCounts, distinctRawValues: topValues(speciesValues, 50), recordsWithSpecies: studyRows.filter((row) => speciesFields.some((field) => nonEmpty(row[field.field]))).length, distinctSpeciesValues: new Set(speciesValues).size },
    studyTypeCoverage: { fields: studyFields, distinctRawValues: topValues(studyTypeValues, 100), recordsWithStudyType: studyTypeValues.length },
    referencePointCoverage: reference,
    reliabilityCoverage: { fields: reliabilityFields, recordsWithAnyField: [...studyRows, ...toxRows, ...tables.END_SUM].filter((row) => reliabilityFields.some((field) => nonEmpty(row[field.field]))).length, note: 'Un dossier/une autorité EFSA n’est pas compté comme preuve structurée.' },
    explicitSeverityCoverage: { fields: severityFields, recordsWithAnyField: allEndpointRows.filter((row) => severityFields.some((field) => nonEmpty(row[field.field]))).length, oummahCodeCount: coverage.explicitSeverity.count },
    explicitEvidenceCoverage: { fields: evidenceFields, recordsWithAnyField: allEndpointRows.filter((row) => evidenceFields.some((field) => nonEmpty(row[field.field]))).length, oummahCodeCount: coverage.explicitEvidence.count },
    oummahCodeCoverage: coverage,
    sevenCodeChecks: seven,
    representativeSamples: representative,
    normalizationFeasibility: { severityExplicit: severityFields.length > 0 ? 'PARTIALLY' : 'NON', severityDerivable: critical.totalRecords > 0 && reference.recordsWithValue > 0 ? 'PARTIALLY' : 'NON', evidenceExplicit: evidenceFields.length > 0 ? 'PARTIALLY' : 'NON', evidenceDerivable: reliabilityFields.length > 0 ? 'PARTIALLY' : 'NON', limits: ['Les champs CriticalEndpoint et les points de référence ne constituent pas à eux seuls une gravité.', 'Les résumés END_SUM ne relient pas toujours explicitement un effet à une valeur de référence.', 'Les commentaires libres ne sont pas normalisés dans cet audit.'] },
    jecfa: jecfaAudit(),
  };
  fs.mkdirSync(path.dirname(OUTPUT), { recursive: true }); fs.writeFileSync(OUTPUT, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  console.log(JSON.stringify({ output: path.relative(ROOT, OUTPUT), codes: mappings.length, criticalRecords: critical.totalRecords, referenceRecords: reference.totalReferenceRecords, endpointRecords: endpoint.recordsWithEndpoint, severityFields: severityFields.length, evidenceFields: evidenceFields.length }, null, 2));
}

export { ensureWorkdir, sharedStrings, workbookRelations, readSheet, sourceMappings, linkForCode };

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
