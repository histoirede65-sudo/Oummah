#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ensureWorkdir, sharedStrings, workbookRelations, readSheet } from './audit-openfoodtox-hazard-evidence-structure.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const INDEX_PATH = path.join(ROOT, 'scripts/output/openfoodtox-index.json');
const CATALOG_PATH = path.join(ROOT, 'src/features/boycott/data/eu-additive-catalog.json');
const CLP_PATH = path.join(ROOT, 'scripts/data/clp-annex-vi-table3-2026-07-01.json');
const IARC_PATH = path.join(ROOT, 'scripts/data/official-iarc-classifications.json');
const OUTPUT_PATH = path.join(ROOT, 'scripts/output/additive-official-substance-hazard-classification-audit-v1.json');
const OUTPUT_V2_PATH = path.join(ROOT, 'scripts/output/additive-official-substance-hazard-classification-audit-v2.json');
const OUTPUT_V3_PATH = path.join(ROOT, 'scripts/output/additive-official-substance-hazard-classification-audit-v3.json');
const IDENTITY_AUDIT_PATH = path.join(ROOT, 'scripts/output/openfoodtox-identity-identifier-audit-v1.json');
const OPENFOODTOX_XLSX = path.join(ROOT, 'scripts/data/OpenFoodTox-3.0.xlsx');

const HUMAN_CLASSES = new Set([
  'Carcinogenicity', 'Germ Cell Mutagenicity', 'Reproductive Toxicity', 'STOT SE',
  'STOT RE', 'Acute Toxicity', 'Skin Sensitisation', 'Respiratory Sensitisation',
  'Skin Corrosion/Irritation', 'Serious Eye Damage/Eye Irritation', 'Aspiration Hazard',
]);
const ENVIRONMENTAL_CLASSES = new Set(['Aquatic Acute', 'Aquatic Chronic', 'Hazardous to the Ozone Layer']);
const FAMILY_MARKERS = /\b(group|mixture|mixtures|famil(?:y|ies)|salts?|complex|extracts?|preparations?|compounds?|derivatives?)\b/i;

function text(value) { return String(value ?? '').trim(); }
function unique(values) { return [...new Set(values.map(text).filter(Boolean))]; }
function normalizeCas(value) { return text(value).replace(/[\s–—]/g, '-').toUpperCase(); }
function normalizeEc(value) { return text(value).replace(/[\s–—]/g, '-').toUpperCase(); }
function normalizeId(value) { return text(value).toUpperCase(); }
function loadJson(file) { return fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : null; }
function array(value) { return Array.isArray(value) ? value : []; }

function identities(index, catalog, refSubRows = []) {
  const priority = new Map(array(index.priorityBatch).map((item) => [text(item.code).toUpperCase(), item]));
  const refsByUuid = new Map(refSubRows.map((row) => [text(row['Document UUID']).toLowerCase(), row]));
  return array(catalog.entries).map((item) => {
    const code = text(item.code).toUpperCase();
    const source = priority.get(code);
    const refs = array(source?.matchedReferenceSubstances);
    const linkedRefRows = refs.map((ref) => refsByUuid.get(text(ref.referenceSubstanceUuid).toLowerCase())).filter(Boolean);
    const cas = unique([...refs.flatMap((ref) => array(ref.cas)), ...linkedRefRows.flatMap((row) => [row['Inventory.CASNumber'], row['CAS number']])]).map(normalizeCas);
    const ec = unique([...refs.flatMap((ref) => array(ref.ec ?? ref.ecNumbers ?? ref['EC number'])), ...linkedRefRows.map((row) => row['EC number'])]).map(normalizeEc);
    const identifiers = unique(refs.flatMap((ref) => array(ref.identifiers))).map(normalizeId);
    const names = unique([item.names?.en, item.canonicalNameEn, item.sourceDisplayName, ...refs.flatMap((ref) => array(ref.names))]);
    const strong = source?.matchConfidence === 'strong' && refs.length === 1;
    return {
      code, substanceName: names[0] ?? code, names, CAS: cas, EC: ec,
      officialIdentifiers: identifiers, referenceSubstanceUuid: refs[0]?.referenceSubstanceUuid ?? null,
      rawIdentifiers: { rawCAS: linkedRefRows.flatMap((row) => [row['Inventory.CASNumber'], row['CAS number']]).filter(Boolean), rawEC: linkedRefRows.map((row) => row['EC number']).filter(Boolean) },
      identityStatus: strong && (cas.length || ec.length || identifiers.length) ? 'exact_substance_identity' : refs.length ? 'ambiguous_or_incomplete' : 'no_identity',
      sourceMatchConfidence: source?.matchConfidence ?? null,
      familyOrMixtureHint: names.some((name) => FAMILY_MARKERS.test(name)),
    };
  });
}

function normalizeOfficialRecord(record, sourceType) {
  const classification = record.classification ?? record.hazardClasses ?? array(record.hazardClassAndCategoryCodes).map((item) => ({ hazardClass: item, category: '', hazardStatement: array(record.hazardStatementCodes).join(' ') }));
  return {
    substanceName: text(record.substanceName ?? record.name ?? record.chemicalName),
    CAS: unique(array(record.CAS ?? record.cas ?? record.casNumbers ?? record.casNumber)).map(normalizeCas),
    EC: unique(array(record.EC ?? record.ec ?? record.ecNumbers ?? record.ecNumber)).map(normalizeEc),
    officialIdentifiers: unique(array(record.officialIdentifiers ?? record.identifiers ?? record.indexNumbers)).map(normalizeId),
    classificationSource: text(record.classificationSource ?? sourceType),
    harmonised: record.harmonised === true || record.harmonized === true || sourceType === 'HARMONISED_CLASSIFICATION',
    hazardClasses: array(classification).map((item) => ({
      hazardClass: text(item.hazardClass ?? item.class ?? item.hazardClassAndCategory),
      category: text(item.category), hazardStatement: text(item.hazardStatement ?? item.hStatements ?? item.hStatement),
      specificConcentrationLimit: item.specificConcentrationLimit ?? item.scl ?? null,
      notes: item.notes ?? null, sourceReference: item.sourceReference ?? record.sourceReference ?? null,
    })),
    indexNumber: record.indexNumber ?? null,
    provenance: record.provenance ?? record.sourceReference ?? record.source ?? null,
  };
}

function officialRecords(source, sourceType) {
  if (!source) return [];
  const rows = Array.isArray(source) ? source : source.records ?? source.classifications ?? source.entries ?? [];
  return rows.map((row) => normalizeOfficialRecord(row, sourceType));
}

function matchIdentity(identity, record) {
  const cas = identity.CAS.filter((value) => record.CAS.includes(value));
  const ec = identity.EC.filter((value) => record.EC.includes(value));
  const identifiers = identity.officialIdentifiers.filter((value) => record.officialIdentifiers.includes(value));
  if (ec.length) return { matchType: 'EC_EXACT', values: ec };
  if (cas.length) return { matchType: 'CAS_EXACT', values: cas };
  if (identifiers.length) return { matchType: 'OFFICIAL_IDENTIFIER_EXACT', values: identifiers };
  return null;
}

function relevance(hazardClass) {
  if (HUMAN_CLASSES.has(hazardClass) || /^(Acute Tox\.|Carc\.|Muta\.|Repr\.|STOT SE|STOT RE|Resp\. Sens\.|Skin ?\.?? Sens\.|Skin ?\.?? Corr\.|Eye Dam\.|Eye Irrit\.)/.test(hazardClass)) return { domain: 'humanHealthHazards', foodAdditiveRelevance: 'potentially_relevant', reason: 'Classe CLP de danger pour la santé humaine ; le contexte d’exposition alimentaire reste à examiner séparément.' };
  if (ENVIRONMENTAL_CLASSES.has(hazardClass) || /^(Aquatic Acute|Aquatic Chronic|Hazardous to the Ozone Layer)/.test(hazardClass)) return { domain: 'environmentalHazards', foodAdditiveRelevance: 'not_relevant_to_health_score', reason: 'Classe environnementale conservée mais exclue du futur score Santé alimentaire.' };
  if (/^(Flam\.|Press\.|Explos\.|Ox\.|Self-react\.|Pyrophor\.|Water-react\.|Org\. Perox\.)/.test(hazardClass)) return { domain: 'physicalHazards', foodAdditiveRelevance: 'context_required', reason: 'Classe de danger physique conservée, sans influence sur le futur score Santé alimentaire.' };
  return { domain: 'other', foodAdditiveRelevance: 'context_required', reason: 'Classe conservée ; sa pertinence alimentaire et humaine doit être vérifiée au cas par cas.' };
}

function audit() {
  const index = loadJson(INDEX_PATH) ?? {};
  const catalog = loadJson(CATALOG_PATH) ?? { entries: [] };
  let refSubRows = [];
  if (fs.existsSync(OPENFOODTOX_XLSX)) {
    ensureWorkdir();
    const relations = workbookRelations();
    if (relations.has('REF_SUB')) refSubRows = readSheet('REF_SUB', sharedStrings(), relations);
  }
  const identitiesList = identities(index, catalog, refSubRows);
  const clpSource = loadJson(CLP_PATH);
  const iarcSource = loadJson(IARC_PATH);
  const clp = officialRecords(clpSource, 'HARMONISED_CLASSIFICATION');
  const notified = clpSource?.notifiedRecords ? officialRecords(clpSource.notifiedRecords, 'NOTIFIED_SELF_CLASSIFICATION') : [];
  const iarc = officialRecords(iarcSource, 'IARC');
  const classifications = [];
  const notifiedOnly = [];
  const ambiguousMatches = [];
  const noMatches = [];
  const exactIdentity = identitiesList.filter((item) => item.identityStatus === 'exact_substance_identity');
  const byCode = Object.fromEntries(identitiesList.map((item) => [item.code, item]));

  for (const identity of identitiesList) {
    const clpMatches = clp.filter((record) => matchIdentity(identity, record));
    const notifiedMatches = notified.filter((record) => matchIdentity(identity, record));
    const iarcMatches = iarc.filter((record) => matchIdentity(identity, record));
    if (clpMatches.length > 1) {
      ambiguousMatches.push({ code: identity.code, substanceName: identity.substanceName, reason: 'Multiple exact CLP records; no automatic transfer.', matches: clpMatches.map((record) => record.substanceName) });
    } else if (clpMatches.length === 1 && !identity.familyOrMixtureHint) {
      const record = clpMatches[0];
      classifications.push({ code: identity.code, substanceName: identity.substanceName, CAS: identity.CAS, EC: identity.EC, clpIdentity: { indexNumber: record.indexNumber, substanceName: record.substanceName, CAS: record.CAS, EC: record.EC }, matchType: matchIdentity(identity, record).matchType, classificationSource: record.classificationSource, harmonised: true, hazardClasses: record.hazardClasses.map((item) => ({ ...item, ...relevance(item.hazardClass) })), provenance: record.provenance, scopeMatch: 'exact_substance' });
    } else if (notifiedMatches.length && !clpMatches.length) {
      notifiedOnly.push({ code: identity.code, substanceName: identity.substanceName, matchType: matchIdentity(identity, notifiedMatches[0]).matchType, provenance: notifiedMatches[0].provenance });
    } else if (!clpMatches.length && !notifiedMatches.length) {
      noMatches.push({ code: identity.code, substanceName: identity.substanceName, reason: identity.identityStatus === 'exact_substance_identity' ? 'No exact CLP/notified record loaded or matched.' : 'No safe exact identity for transfer.' });
    }
  }

  const distribution = {};
  for (const row of classifications.flatMap((item) => item.hazardClasses)) distribution[row.hazardClass] = (distribution[row.hazardClass] ?? 0) + 1;
  const healthRows = classifications.flatMap((item) => item.hazardClasses.filter((hazard) => hazard.foodAdditiveRelevance === 'potentially_relevant').map((hazard) => ({ ...item, hazard })));
  const iarcMatches = identitiesList.flatMap((identity) => iarc.filter((record) => matchIdentity(identity, record)).map((record) => ({ code: identity.code, substanceName: identity.substanceName, matchType: matchIdentity(identity, record).matchType, classification: record.hazardClasses, provenance: record.provenance })));
  const report = {
    schemaVersion: 'additive-official-substance-hazard-classification-audit-v1', mode: 'offline-audit-only', generatedAt: new Date().toISOString(),
    source: { clp: { authority: 'ECHA / EU CLP Annex VI', url: 'https://echa.europa.eu/information-on-chemicals/annex-vi-to-clp', legalSource: 'https://eur-lex.europa.eu/eli/reg/2008/1272/oj/eng', localSnapshot: path.relative(ROOT, CLP_PATH), status: clpSource ? 'loaded' : 'not_loaded' }, iarc: { authority: 'IARC Monographs', url: 'https://monographs.iarc.who.int/iarc-monographs-preamble-preamble-to-the-iarc-monographs/', localSnapshot: path.relative(ROOT, IARC_PATH), status: iarcSource ? 'loaded' : 'not_loaded' } },
    matchingPolicy: { priority: ['EC_EXACT', 'CAS_EXACT', 'OFFICIAL_IDENTIFIER_EXACT'], nameOnly: 'rejected', fuzzy: false, noENumberRule: true, familiesAndMixtures: 'ambiguous_or_excluded' },
    identityCoverage: { totalCodes: identitiesList.length, codesWithExactSubstanceIdentity: exactIdentity.length, codesWithCAS: identitiesList.filter((item) => item.CAS.length).length, codesWithEC: identitiesList.filter((item) => item.EC.length).length, codesWithOfficialIdentifier: identitiesList.filter((item) => item.officialIdentifiers.length).length, codesWithoutSafeIdentity: identitiesList.filter((item) => item.identityStatus !== 'exact_substance_identity').length, identitySource: 'OpenFoodTox priorityBatch + EU additive catalog' },
    clpCoverage: { codesWithHarmonisedCLP: classifications.length, codesWithHumanHealthHarmonisedCLP: new Set(healthRows.map((row) => row.code)).size, codesWithOnlyEnvironmentalCLP: classifications.filter((item) => item.hazardClasses.length > 0 && item.hazardClasses.every((hazard) => hazard.domain === 'environmentalHazards')).length, codesWithOnlyPhysicalCLP: classifications.filter((item) => item.hazardClasses.length > 0 && item.hazardClasses.every((hazard) => hazard.domain === 'physicalHazards')).length, codesWithoutHarmonisedClassification: identitiesList.length - classifications.length, codesWithOnlyNotifiedClassification: notifiedOnly.length, codesWithNoCLPClassification: noMatches.length, sourceAvailable: Boolean(clpSource) },
    harmonisedClassifications: classifications, notifiedOnly, ambiguousMatches, noMatches,
    iarcMatches, coverage: { codesWithIARCClassification: new Set(iarcMatches.map((item) => item.code)).size }, hazardClassDistribution: distribution,
    foodAdditiveRelevanceAudit: { potentiallyRelevantHumanHealthRows: healthRows.map((row) => ({ code: row.code, substanceName: row.substanceName, hazardClass: row.hazard.hazardClass, category: row.hazard.category, hazardStatement: row.hazard.hazardStatement, reason: row.hazard.reason })), humanHealthHazards: classifications.flatMap((item) => item.hazardClasses.filter((hazard) => hazard.domain === 'humanHealthHazards')).length, environmentalHazards: classifications.flatMap((item) => item.hazardClasses.filter((hazard) => hazard.domain === 'environmentalHazards')).length, physicalHazards: classifications.flatMap((item) => item.hazardClasses.filter((hazard) => hazard.domain === 'physicalHazards')).length, environmentalExcludedFromHealthScore: classifications.flatMap((item) => item.hazardClasses.filter((hazard) => hazard.foodAdditiveRelevance === 'not_relevant_to_health_score')).length },
    scopeAudit: { familyOrMixtureHints: identitiesList.filter((item) => item.familyOrMixtureHint).map((item) => ({ code: item.code, substanceName: item.substanceName, scopeMatch: 'ambiguous' })), excludedFromTransfer: identitiesList.filter((item) => item.familyOrMixtureHint).length },
    provenance: { required: true, allTransferredRecordsHaveProvenance: classifications.every((item) => Boolean(item.provenance)), officialClassificationIsNotSeverity: true, noOummahColour: true },
    conclusion: { usableAsHazardSignal: clpSource ? (classifications.length ? 'PARTIALLY' : 'NO') : 'NO', limitation: clpSource ? 'Only exact, provenance-backed official classifications are retained.' : 'The official CLP snapshot is not present locally; no classification is claimed. Acquire the ECHA Annex VI export and rerun this audit.' },
  };
  const identityAudit = { schemaVersion: 'openfoodtox-identity-identifier-audit-v1', sourceWorkbook: path.relative(ROOT, OPENFOODTOX_XLSX), refSubRows: refSubRows.length, rowsWithEC: refSubRows.filter((row) => text(row['EC number'])).length, rowsWithCAS: refSubRows.filter((row) => text(row['Inventory.CASNumber']) || text(row['CAS number'])).length, oummahMatchedRowsWithEC: identitiesList.filter((item) => item.EC.length).length, oummahMatchedRowsWithCAS: identitiesList.filter((item) => item.CAS.length).length, ecParsingIssues: refSubRows.filter((row) => text(row['EC number']) && !/^\d{3}-\d{3}-\d$/.test(normalizeEc(row['EC number']))).map((row) => ({ rawEC: row['EC number'], uuid: row['Document UUID'] })).slice(0, 100), joinLosses: identitiesList.filter((item) => item.identityStatus !== 'no_identity' && !item.EC.length && !item.CAS.length).map((item) => item.code) };
  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true }); fs.writeFileSync(OUTPUT_PATH, `${JSON.stringify(report, null, 2)}\n`, 'utf8'); fs.writeFileSync(IDENTITY_AUDIT_PATH, `${JSON.stringify(identityAudit, null, 2)}\n`, 'utf8'); fs.writeFileSync(OUTPUT_V2_PATH, `${JSON.stringify({ ...report, schemaVersion: 'additive-official-substance-hazard-classification-audit-v2', identityAudit: path.relative(ROOT, IDENTITY_AUDIT_PATH), sourceSnapshotStatus: report.source.clp.status }, null, 2)}\n`, 'utf8'); fs.writeFileSync(OUTPUT_V3_PATH, `${JSON.stringify({ ...report, schemaVersion: 'additive-official-substance-hazard-classification-audit-v3', identityAudit: path.relative(ROOT, IDENTITY_AUDIT_PATH), sourceSnapshotStatus: report.source.clp.status, snapshot: path.relative(ROOT, CLP_PATH) }, null, 2)}\n`, 'utf8');
  report.identityAudit = identityAudit;
  return report;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const report = audit();
  console.log(JSON.stringify({ output: path.relative(ROOT, OUTPUT_V3_PATH), total: report.identityCoverage.totalCodes, exactIdentity: report.identityCoverage.codesWithExactSubstanceIdentity, refSubRows: report.identityAudit.refSubRows, rowsWithEC: report.identityAudit.rowsWithEC, matchedWithEC: report.identityAudit.oummahMatchedRowsWithEC, matchedWithCAS: report.identityAudit.oummahMatchedRowsWithCAS, harmonised: report.clpCoverage.codesWithHarmonisedCLP, humanHealth: report.clpCoverage.codesWithHumanHealthHarmonisedCLP, notifiedOnly: report.clpCoverage.codesWithOnlyNotifiedClassification, noClassification: report.clpCoverage.codesWithNoCLPClassification, ambiguous: report.ambiguousMatches.length, iarc: report.coverage.codesWithIARCClassification, sourceStatus: report.source.clp.status }, null, 2));
}

export { audit, identities, matchIdentity, normalizeOfficialRecord };
