#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ensureWorkdir, sharedStrings, workbookRelations, readSheet, sourceMappings, linkForCode } from './audit-openfoodtox-hazard-evidence-structure.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const INPUT = path.join(ROOT, 'scripts/data/OpenFoodTox-3.0.xlsx');
const OUTPUT = path.join(ROOT, 'scripts/output/additive-hazard-evidence-basis-audit-v1.json');
const INDEX = path.join(ROOT, 'scripts/output/openfoodtox-index.json');
const SHEETS = ['SUB', 'REF_SUB', 'DOSSIER', 'DOSSIER_DOCS', 'FLEX_SUM.ToxRefValues', 'END_SUM', 'END_STUDY_REC.HumanHealth', 'END_STUDY_REC.AnimalHealth'];
const CODES = ['E102', 'E122', 'E124', 'E129', 'E132', 'E133', 'E171'];
const CLASSES = ['carcinogenicity', 'genotoxicity', 'reproductive', 'developmental', 'neurotoxicity', 'organ_toxicity', 'haematological', 'immunological', 'endocrine_related', 'gastrointestinal', 'metabolic', 'general_toxicity', 'other', 'unknown'];

const nonEmpty = (value) => String(value ?? '').trim() !== '';
const text = (value) => String(value ?? '').trim();
const unique = (values) => [...new Set(values.filter(nonEmpty))];
const uuid = (value) => text(value).match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i)?.[0].toLowerCase() ?? null;
const short = (value, max = 600) => text(value).replace(/\s+/g, ' ').slice(0, max) || null;
const normalize = (value) => text(value).normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
const asObjectKey = (value) => JSON.stringify(value);

function values(row, fields) { return fields.flatMap((field) => nonEmpty(row[field]) ? [text(row[field])] : []); }
function distinctObjects(items) { return [...new Map(items.map((item) => [asObjectKey(item), item])).values()]; }
function sourceRef(sourceTable, row, field = 'Document UUID') { return { sourceTable, sourceRecordId: (uuid(row[field]) ?? text(row[field])) || null }; }

function studyRowsFor(link, tables) {
  const rows = [
    ...(tables['END_STUDY_REC.HumanHealth'] ?? []).filter((row) => link.matches(row)).map((row) => ({ row, sourceTable: 'END_STUDY_REC.HumanHealth' })),
    ...(tables['END_STUDY_REC.AnimalHealth'] ?? []).filter((row) => link.matches(row)).map((row) => ({ row, sourceTable: 'END_STUDY_REC.AnimalHealth' })),
  ];
  return rows.map((item) => ({ ...item, context: studyContextFor(item.row, item.sourceTable) }));
}

function studyContextFor(row, sourceTable) {
  const species = values(row, ['MaterialsAndMethods.TestAnimals.Species', 'MaterialsAndMethods.TestAnimals.Species.Other', 'MaterialsAndMethods.Method.SpeciesStrain.SpeciesStrain', 'MaterialsAndMethods.Method.SpeciesStrain.SpeciesStrain.Other']).join(' ');
  const contextText = Object.entries(row).filter(([key]) => /organism|test.?system|objective|study.?type|endpoint/i.test(key)).map(([, value]) => text(value)).join(' ');
  if (/in[ -]?vitro/i.test(contextText)) return 'in_vitro';
  if (sourceTable === 'END_STUDY_REC.AnimalHealth') return 'animal';
  if (species && !/\bhuman\b|\bvolunteer\b|\bpatient\b/i.test(species)) return 'animal';
  if (/\bhuman\b|\bvolunteer\b|\bpatient\b/i.test(`${species} ${contextText}`)) return 'human';
  return sourceTable === 'END_STUDY_REC.HumanHealth' ? 'human' : 'unknown';
}

function contextRecords(studies) {
  const result = [];
  for (const { row, sourceTable, context } of studies) {
    const rawStudyType = values(row, ['MaterialsAndMethods.StudyType', 'MaterialsAndMethods.StudyType.Other', 'MaterialsAndMethods.ObjectiveOfStudyPick']);
    const rawSpecies = values(row, ['MaterialsAndMethods.TestAnimals.Species', 'MaterialsAndMethods.TestAnimals.Species.Other', 'MaterialsAndMethods.Method.SpeciesStrain.SpeciesStrain', 'MaterialsAndMethods.Method.SpeciesStrain.SpeciesStrain.Other']);
    const rawTestSystem = values(row, ['MaterialsAndMethods.TestAnimals.OrganismDetails', 'MaterialsAndMethods.TestMaterials.SpecificDetailsOnTestMaterialUsedForTheStudy']);
    if (rawStudyType.length || rawSpecies.length || rawTestSystem.length) result.push({ studyContext: context, rawStudyType, rawSpecies, rawTestSystem, ...sourceRef(sourceTable, row) });
  }
  return distinctObjects(result);
}

function rawStudyTypes(studies) {
  return distinctObjects(studies.flatMap(({ row, sourceTable }) => values(row, ['MaterialsAndMethods.StudyType', 'MaterialsAndMethods.StudyType.Other', 'MaterialsAndMethods.ObjectiveOfStudyPick']).map((rawValue) => ({ rawValue, source: sourceRef(sourceTable, row) }))));
}
function rawSpecies(studies) {
  return distinctObjects(studies.flatMap(({ row, sourceTable }) => values(row, ['MaterialsAndMethods.TestAnimals.Species', 'MaterialsAndMethods.TestAnimals.Species.Other', 'MaterialsAndMethods.Method.SpeciesStrain.SpeciesStrain', 'MaterialsAndMethods.Method.SpeciesStrain.SpeciesStrain.Other']).map((rawValue) => ({ rawValue, source: sourceRef(sourceTable, row) }))));
}

function endpointClass(rawLabel) {
  const value = normalize(rawLabel);
  if (!value) return 'unknown';
  if (/carcinogen|tumou?r|neoplasm/.test(value)) return 'carcinogenicity';
  if (/genotox|mutagen|micronucleus|chromosom|dna damage/.test(value)) return 'genotoxicity';
  if (/reproduct|fertilit|mating|sperm|ovary|testis/.test(value)) return 'reproductive';
  if (/development|teratogen|embryo|foetus|fetus|prenatal/.test(value)) return 'developmental';
  if (/neurotox|nervous|brain/.test(value)) return 'neurotoxicity';
  if (/haemat|hemat|blood|erythro|leukocyt|platelet/.test(value)) return 'haematological';
  if (/immun|immune/.test(value)) return 'immunological';
  if (/endocrine|thyroid|hormone/.test(value)) return 'endocrine_related';
  if (/gastro|intestinal|stomach|colon/.test(value)) return 'gastrointestinal';
  if (/metabol|liver|hepatic|kidney|renal|organ/.test(value)) return 'organ_toxicity';
  if (/toxicit|adverse|effect|endpoint/.test(value)) return 'general_toxicity';
  return 'unknown';
}

function endpointRowsForCritical(rawLabel, studies) {
  const id = uuid(rawLabel);
  if (!id) return [];
  return studies.filter(({ row }) => id === uuid(row['Document UUID']) || id === uuid(row['Parent UUID']));
}

function assessmentSources(link, tables) {
  return distinctObjects(link.humanDossiers.map((row) => {
    const persistent = text(row['LiteratureReference.LinkToPersistentIdentifier']);
    const doi = persistent.match(/10\.\d{4,9}\/[^^\s]+/i)?.[0] ?? null;
    return { assessmentId: row['DataSource.EFSAQuestionNumber'] || uuid(row['Document UUID']), title: short(row['LiteratureReference.EFSAOutputTitle'], 500), year: text(row['LiteratureReference.DateOfEvaluation']) || null, sourceUrl: doi ? `https://doi.org/${doi}` : persistent || null, ...sourceRef('DOSSIER', row) };
  }));
}

const referencePrefixes = [
  ['AcceptableDailyIntake.Adi', 'ADI'],
  ['AcceptableOperatorExposureLevel.Aoel', 'AOEL'],
  ['AcuteAcceptableOperatorExposureLevel.Aaoel', 'AAOEL'],
  ['AcuteReferenceDose.Arfd', 'ARfD'],
  ['OtherReferenceValues', 'other'],
];
function referencePoints(toxRows) {
  const result = [];
  for (const row of toxRows) {
    for (const [prefix, defaultType] of referencePrefixes) {
      const entries = Object.entries(row).filter(([key, value]) => key.includes(prefix) && nonEmpty(value));
      if (!entries.length) continue;
      const get = (pattern) => entries.find(([key]) => pattern.test(key))?.[1] ?? null;
      const descriptor = get(/ReferenceValueDescriptor\.Other$|ReferenceValueDescriptor$/i);
      const descriptorText = text(descriptor);
      const explicitType = descriptorText.match(/\b(NO[A-Z]*EL|LO[A-Z]*EL|BMDL?|ADI|ARfD|AOEL|AAOEL)\b/i)?.[1] ?? null;
      result.push({ type: explicitType?.toUpperCase() ?? defaultType, value: get(/(?:\.lowerValue|\.upperValue|\.Value)$/i), lower: get(/\.lowerValue$/i), upper: get(/\.upperValue$/i), unit: get(/\.Unit$/i), linkedCriticalEndpoint: get(/CriticalEndpoint/i), population: get(/Population(?:\.Other)?$/i), source: { ...sourceRef('FLEX_SUM.ToxRefValues', row), assessmentId: get(/ReferenceToEFSAOpinion/i) } });
    }
  }
  return distinctObjects(result);
}

function signals(rows, fields, sourceTable) {
  return distinctObjects(rows.flatMap((row) => fields.flatMap((field) => nonEmpty(row[field]) ? [{ rawValue: text(row[field]), sourceField: field, source: sourceRef(sourceTable, row) }] : [])));
}
function studySignals(studies, pattern) {
  return distinctObjects(studies.flatMap(({ row, sourceTable }) => Object.keys(row).filter((field) => pattern.test(field) && nonEmpty(row[field])).map((field) => ({ rawValue: text(row[field]), sourceField: field, source: sourceRef(sourceTable, row) }))));
}

function criticalEndpoints(toxRows, studies, tables) {
  const output = [];
  for (const row of toxRows) {
    const refPoints = referencePoints([row]);
    for (const [field, value] of Object.entries(row)) {
      if (!/CriticalEndpoint/i.test(field) || !nonEmpty(value)) continue;
      const linkedStudies = endpointRowsForCritical(value, studies);
      const endpointLabels = linkedStudies.flatMap(({ row }) => values(row, ['AdministrativeData.Endpoint', 'ResultsAndDiscussion.EffectLevels.Endpoint', 'ResultsAndDiscussion.EffectLevels.Endpoint.Other']));
      const study = linkedStudies[0];
      output.push({ rawLabel: text(value), sourceEndpointLabels: unique(endpointLabels), normalizedEndpointClass: endpointClass(endpointLabels[0] ?? ''), assessmentId: refPoints.find((point) => point.linkedCriticalEndpoint === text(value))?.source?.assessmentId ?? uuid(row['Document UUID']), ...sourceRef('FLEX_SUM.ToxRefValues', row), linkedReferencePoint: refPoints.find((point) => point.linkedCriticalEndpoint === text(value)) ?? null, species: study ? values(study.row, ['MaterialsAndMethods.TestAnimals.Species', 'MaterialsAndMethods.TestAnimals.Species.Other']).join(' | ') || null : null, studyContext: study?.context ?? null, studyType: study ? values(study.row, ['MaterialsAndMethods.StudyType', 'MaterialsAndMethods.StudyType.Other', 'MaterialsAndMethods.ObjectiveOfStudyPick']).join(' | ') || null : null, reliability: study ? short(Object.entries(study.row).find(([key, value]) => /Reliability|Guideline|Qualifier/i.test(key) && nonEmpty(value))?.[1]) : null, population: refPoints.find((point) => point.linkedCriticalEndpoint === text(value))?.population ?? null, justification: refPoints.find((point) => point.linkedCriticalEndpoint === text(value)) ? short(Object.entries(row).find(([key]) => /JustificationAndComments|Justification$/i.test(key) && nonEmpty(row[key]))?.[1]) : null, uncertainty: short(Object.entries(row).find(([key]) => /OverallUncertainty/i.test(key) && nonEmpty(row[key]))?.[1]), sourceUrl: null });
    }
  }
  return distinctObjects(output);
}

function makeBasis(mapping, link, tables) {
  const toxRows = tables['FLEX_SUM.ToxRefValues'].filter((row) => link.matches(row));
  const studies = studyRowsFor(link, tables);
  const context = contextRecords(studies);
  const species = rawSpecies(studies);
  const studyTypes = rawStudyTypes(studies);
  const refs = referencePoints(toxRows);
  const critical = criticalEndpoints(toxRows, studies, tables);
  const reliability = studySignals(studies, /Reliability|Guideline|Qualifier/i);
  const uncertainty = signals(toxRows, Object.keys(toxRows[0] ?? {}).filter((key) => /OverallUncertainty/i.test(key)), 'FLEX_SUM.ToxRefValues');
  const sources = assessmentSources(link, tables);
  const components = [critical.length, context.length, species.length, refs.length, reliability.length || uncertainty.length, sources.length].filter(Boolean).length;
  const evidenceBasisStatus = components >= 5 ? 'rich' : components >= 3 ? 'partial' : components >= 1 ? 'minimal' : 'insufficient';
  const allProvenanced = [...critical, ...context, ...species, ...studyTypes, ...refs, ...reliability, ...uncertainty, ...sources].every((item) => item.sourceTable || item.source?.sourceTable);
  return { code: mapping.code, canonicalName: mapping.canonicalName, criticalEndpoints: critical, studyContexts: context, species, studyTypes, referencePoints: refs, reliabilitySignals: reliability, uncertaintySignals: uncertainty, assessmentSources: sources, evidenceBasisStatus, provenanceComplete: Boolean(allProvenanced && (critical.length + context.length + species.length + studyTypes.length + refs.length + reliability.length + uncertainty.length + sources.length > 0)), provenance: { sourceWorkbook: 'OpenFoodTox 3.0', sourceTables: unique([...critical, ...context, ...species, ...studyTypes, ...refs, ...reliability, ...uncertainty, ...sources].flatMap((item) => [item.sourceTable, item.source?.sourceTable])) } };
}

function main() {
  ensureWorkdir();
  const strings = sharedStrings(); const relations = workbookRelations(); const tables = {};
  for (const sheet of SHEETS) if (relations.has(sheet)) tables[sheet] = readSheet(sheet, strings, relations);
  const mappings = sourceMappings(JSON.parse(fs.readFileSync(INDEX, 'utf8')));
  const basis = mappings.map((mapping) => makeBasis(mapping, linkForCode(mapping, tables), tables));
  const count = (predicate) => basis.filter(predicate).length;
  const endpointClassDistribution = Object.fromEntries(CLASSES.map((name) => [name, basis.flatMap((item) => item.criticalEndpoints).filter((endpoint) => endpoint.normalizedEndpointClass === name).length]));
  const critical = basis.flatMap((item) => item.criticalEndpoints);
  const rawCriticalEndpointOccurrences = tables['FLEX_SUM.ToxRefValues'].reduce((total, row) => total + Object.entries(row).filter(([field, value]) => /CriticalEndpoint/i.test(field) && nonEmpty(value)).length, 0);
  const refs = basis.filter((item) => item.referencePoints.length);
  const report = { schemaVersion: 'additive-hazard-evidence-basis-audit-v1', mode: 'offline-audit-only', source: { workbook: path.relative(ROOT, INPUT), structureAudit: 'scripts/output/openfoodtox-hazard-evidence-structure-audit-v1.json' }, statusDefinition: { rich: '5 ou davantage de composantes factuelles non vides parmi criticalEndpoint, studyContext, species, studyType, referencePoint, reliabilityOrUncertainty, assessmentSource.', partial: '3 ou 4 composantes.', minimal: '1 ou 2 composantes.', insufficient: 'Aucune composante factuelle exploitable.', warning: 'evidenceBasisStatus mesure uniquement la complétude factuelle et ne signifie jamais evidenceLevel scientifique.' }, codesWithHazardEvidenceBasis: basis.filter((item) => item.evidenceBasisStatus !== 'insufficient').length, statusCounts: Object.fromEntries(['rich', 'partial', 'minimal', 'insufficient'].map((status) => [status, count((item) => item.evidenceBasisStatus === status)])), codesWithCriticalEndpoint: count((item) => item.criticalEndpoints.length > 0), codesWithReferencePoint: count((item) => item.referencePoints.length > 0), codesWithStudyContext: count((item) => item.studyContexts.length > 0), codesWithSpecies: count((item) => item.species.length > 0), codesWithStudyType: count((item) => item.studyTypes.length > 0), codesWithReliability: count((item) => item.reliabilitySignals.length > 0), codesWithUncertainty: count((item) => item.uncertaintySignals.length > 0), endpointClassDistribution, criticalEndpointLinks: { rawCriticalEndpointOccurrences, criticalEndpointsTotal: critical.length, criticalEndpointsWithReferencePoint: critical.filter((item) => item.linkedReferencePoint).length, criticalEndpointsWithSpecies: critical.filter((item) => item.species).length, criticalEndpointsWithStudyContext: critical.filter((item) => item.studyContext).length, criticalEndpointsWithReliability: critical.filter((item) => item.uncertainty || item.reliability).length }, referencePointCoverage: { codesWithReferencePointOnly: refs.filter((item) => !item.criticalEndpoints.length && !item.studyContexts.length).length, codesWithReferencePointAndCriticalEndpoint: refs.filter((item) => item.criticalEndpoints.length > 0).length, codesWithReferencePointAndStudyContext: refs.filter((item) => item.studyContexts.length > 0).length, codesWithReferencePointCriticalContextSpecies: refs.filter((item) => item.criticalEndpoints.length > 0 && item.studyContexts.length > 0 && item.species.length > 0).length }, sevenCodeChecks: basis.filter((item) => CODES.includes(item.code)), representativeSamples: { withCriticalEndpoint: basis.find((item) => item.criticalEndpoints.length > 0) ?? null, withReferencePoint: basis.find((item) => item.referencePoints.length > 0) ?? null, withAnimalStudy: basis.find((item) => item.studyContexts.some((context) => context.studyContext === 'animal')) ?? null, withHumanStudy: basis.find((item) => item.studyContexts.some((context) => context.studyContext === 'human')) ?? null, withMultipleEndpoints: basis.find((item) => item.criticalEndpoints.length > 1) ?? null, withoutStructuredContext: basis.find((item) => !item.studyContexts.length) ?? null }, normalizationFeasibility: { scientificConcernRule: 'PARTIALLY', explanation: 'La couche fournit des faits structurés et leur provenance, mais les liens endpoint-effet, la gravité explicite et le niveau de preuve explicite restent incomplets. Une règle générale documentable nécessiterait une validation scientifique supplémentaire.', noScientificSeverityCreated: true, noScientificEvidenceLevelCreated: true }, basisByCode: basis };
  fs.mkdirSync(path.dirname(OUTPUT), { recursive: true }); fs.writeFileSync(OUTPUT, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  console.log(JSON.stringify({ output: path.relative(ROOT, OUTPUT), codes: basis.length, statusCounts: report.statusCounts, criticalEndpoints: critical.length, classes: endpointClassDistribution }, null, 2));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
