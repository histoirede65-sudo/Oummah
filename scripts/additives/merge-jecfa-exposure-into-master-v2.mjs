#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseJecfaIntakeAssessment } from './jecfa-intake-parser.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const AUDIT = path.join(ROOT, 'scripts/output/jecfa-intake-exposure-audit-v3.json');
const SOURCE_AUDIT = path.join(ROOT, 'scripts/output/additive-science-source-audit-priority-321-v3.json');
const MASTER = path.join(ROOT, 'scripts/data/additives-scientific-master-v1.json');
const JECFA = path.join(ROOT, 'scripts/output/jecfa-index.json');
const CATALOG = path.join(ROOT, 'src/features/boycott/data/eu-additive-catalog.json');
const OUT = path.join(ROOT, 'scripts/data/additives-scientific-master-v2-exposure.json');
const MERGE_AUDIT = path.join(ROOT, 'scripts/output/additive-exposure-merge-audit-v1.json');
const read = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));
const save = (file, value) => fs.writeFileSync(file, JSON.stringify(value, null, 2) + '\n', 'utf8');
const normalize = (value) => String(value ?? '').normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim().replace(/\s+/g, ' ');
const codeOf = (value) => String(value ?? '').toUpperCase().replace(/\s+/g, '');

function matchesForCode(code, records, catalogItem) {
  const numeric = code.match(/^E(\d{3,4})$/)?.[1] ?? null;
  const names = [catalogItem?.names?.en, catalogItem?.canonicalNameEn, ...(catalogItem?.aliases ?? [])].map(normalize).filter(Boolean);
  return records.filter((record) => {
    const insMatch = numeric && record.ins && record.ins.replace(/[^0-9]/g, '') === numeric && !/[A-Z]$/i.test(code);
    const exactName = [record.name, ...(record.synonyms ?? []), ...(record.chemicalNames ?? [])].some((name) => names.includes(normalize(name)));
    return insMatch || exactName;
  });
}

function provenanceComplete(item) { return Boolean(item.authority && item.year && item.sourceUrl && item.sourceSentence && (item.rawText || item.sourceSentence)); }
function valueKey(value) { return JSON.stringify([value.type, value.year ?? value.evaluationYear, value.sourceUrl, value.sourceSentence, value.rawText, value.value, value.lower, value.upper]); }
function assessmentKey(item) { return JSON.stringify([item.authority, item.year, item.sourceUrl, item.sourceSentence, item.scenarioType, item.comparisonStatus]); }

function main() {
  const audit = read(AUDIT);
  const sourceAudit = read(SOURCE_AUDIT);
  const validCodes = new Set(sourceAudit.items.filter((item) => ['exact', 'strong'].includes(item.jecfa.matchConfidence)).map((item) => codeOf(item.code)));
  const master = read(MASTER);
  const jecfa = read(JECFA);
  const catalog = read(CATALOG).entries;
  const catalogByCode = new Map(catalog.map((item) => [codeOf(item.code), item]));
  const existingByCode = new Map((master.profiles ?? []).map((profile) => [codeOf(profile.code), profile]));
  const additions = [];

  for (const code of validCodes) {
    const profile = existingByCode.get(code);
    if (!profile) continue;
    const records = matchesForCode(code, jecfa.records ?? [], catalogByCode.get(code));
    const assessments = [];
    const referenceValues = [];
    for (const record of records) for (const evaluation of record.evaluations ?? []) {
      const rawText = evaluation.intake?.rawText ?? null;
      if (!rawText) continue;
      const parsed = parseJecfaIntakeAssessment(rawText, { year: evaluation.year, sourceUrl: record.url, adiRawText: evaluation.adi?.rawText ?? null });
      for (const parsedAssessment of parsed.assessments ?? []) {
        const exposures = parsedAssessment.exposureScenarios ?? [];
        const refs = parsedAssessment.referenceValues ?? [];
        const normalizedRefs = refs.map((value) => ({ ...value, authority: 'JECFA', year: evaluation.year, sourceUrl: record.url, rawText: value.rawText ?? rawText }));
        referenceValues.push(...normalizedRefs);
        if (!exposures.length) continue;
        const scenarioType = exposures.some((scenario) => scenario.type === 'TMDI') ? 'theoretical_maximum_daily_intake' : undefined;
        assessments.push({ authority: 'JECFA', year: evaluation.year, sourceUrl: record.url, scope: parsedAssessment.scope ?? 'unknown', population: parsedAssessment.population ?? undefined, scenario: parsedAssessment.scenario ?? undefined, scenarioType, exposureValues: parsedAssessment.exposureValues ?? [], referenceValues: normalizedRefs, comparisonStatus: parsedAssessment.comparisonStatus ?? 'unknown', authorityConclusion: parsedAssessment.authorityConclusion ?? 'no_explicit_conclusion', exposureUncertainty: parsedAssessment.exposureUncertainty ?? [], sourceSentence: parsedAssessment.sourceSentence, rawText });
      }
    }
    const oldAssessments = Array.isArray(profile.exposureAssessments) ? profile.exposureAssessments : [];
    const oldReferences = Array.isArray(profile.referenceValues) ? profile.referenceValues : [];
    const mergedAssessments = [...oldAssessments, ...assessments].filter((item, index, all) => all.findIndex((candidate) => assessmentKey(candidate) === assessmentKey(item)) === index);
    const mergedReferences = [...oldReferences, ...referenceValues].filter((item, index, all) => all.findIndex((candidate) => valueKey(candidate) === valueKey(item)) === index);
    const addedAssessments = mergedAssessments.length - oldAssessments.length;
    const addedReferences = mergedReferences.length - oldReferences.length;
    const latestExposureAssessment = [...mergedAssessments].sort((a, b) => Number(b.year ?? 0) - Number(a.year ?? 0))[0] ?? profile.latestExposureAssessment ?? null;
    const next = { ...profile, referenceValues: mergedReferences, exposureAssessments: mergedAssessments, latestExposureAssessment, dataVersion: 'reviewed-2.0-exposure' };
    existingByCode.set(code, next);
    if (addedAssessments || addedReferences) additions.push({ code, jecfaMatch: 'exact_or_strong', assessmentsAdded: addedAssessments, scenariosAdded: assessments.reduce((sum, item) => sum + item.exposureValues.length, 0), referenceValuesAdded: addedReferences, conclusionsAdded: assessments.filter((item) => item.authorityConclusion !== 'no_explicit_conclusion').length, uncertaintiesAdded: assessments.reduce((sum, item) => sum + item.exposureUncertainty.length, 0), provenanceComplete: [...assessments, ...referenceValues].every(provenanceComplete) });
  }

  const profiles = [...existingByCode.values()];
  const profilesEnriched = additions.length;
  const profilesWithActualExposure = profiles.filter((profile) => (profile.exposureAssessments ?? []).length > 0).length;
  const profilesReferenceOnly = profiles.filter((profile) => !(profile.exposureAssessments ?? []).length && (profile.referenceValues ?? []).some((value) => value.authority === 'JECFA')).length;
  const profilesWithMultipleExposureScenarios = profiles.filter((profile) => (profile.exposureAssessments ?? []).length > 1).length;
  const profilesWithExplicitComparison = profiles.filter((profile) => (profile.exposureAssessments ?? []).some((item) => item.comparisonStatus !== 'not_quantified' && item.comparisonStatus !== 'unknown')).length;
  const profilesWithAuthorityConclusion = profiles.filter((profile) => (profile.exposureAssessments ?? []).some((item) => item.authorityConclusion !== 'no_explicit_conclusion')).length;
  const profilesWithExposureUncertainty = profiles.filter((profile) => (profile.exposureAssessments ?? []).some((item) => item.exposureUncertainty?.length)).length;
  const totals = { profilesEnriched, profilesWithActualExposure, profilesReferenceOnly, profilesWithMultipleExposureScenarios, profilesWithExplicitComparison, profilesWithAuthorityConclusion, profilesWithExposureUncertainty };
  const spotCodes = ['E951', 'E338', 'E150D', 'E250', 'E621', 'E955', 'E202', 'E330', 'E407', 'E471'];
  save(OUT, { ...master, schemaVersion: '2.0', generatedAt: new Date().toISOString(), sourceAudit: 'scripts/output/jecfa-intake-exposure-audit-v3.json', profiles });
  save(MERGE_AUDIT, { schemaVersion: '1.0', generatedAt: new Date().toISOString(), sourceAudit: 'scripts/output/jecfa-intake-exposure-audit-v3.json', intakeAuditStatusCounts: audit.statusCounts, validMatchPolicy: 'JECFA exact or strong only; possible_match excluded', totals, items: additions, spotChecks: spotCodes.map((code) => { const profile = profiles.find((item) => item.code === code); const item = additions.find((entry) => entry.code === code); return { code, enriched: Boolean(item), exposureAssessments: profile?.exposureAssessments?.length ?? 0, jecfaReferenceValues: (profile?.referenceValues ?? []).filter((value) => value.authority === 'JECFA').length, latestExposureAssessment: profile?.latestExposureAssessment ?? null }; }) });
  console.log(JSON.stringify({ master: path.relative(ROOT, OUT), audit: path.relative(ROOT, MERGE_AUDIT), totals }, null, 2));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
