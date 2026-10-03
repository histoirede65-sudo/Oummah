#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseJecfaIntakeAssessment } from './jecfa-intake-parser.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const JECFA = path.join(ROOT, 'scripts/output/jecfa-index.json');
const CATALOG = path.join(ROOT, 'src/features/boycott/data/eu-additive-catalog.json');
const OUT = path.join(ROOT, 'scripts/output/jecfa-intake-exposure-audit-v2.json');
const V1 = path.join(ROOT, 'scripts/output/jecfa-intake-exposure-audit-v1.json');
const normalize = (value) => String(value ?? '').normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim().replace(/\s+/g, ' ');
const unique = (values) => [...new Set(values.filter(Boolean))];
const codeOf = (value) => String(value ?? '').toUpperCase().replace(/\s+/g, '');
const foodCode = (item) => codeOf(item.code);

function matchesForItem(item, records) {
  const numeric = item.code?.match(/^E(\d{3,4})$/)?.[1] ?? null;
  const names = [item.names?.en, item.canonicalNameEn, ...(item.aliases ?? [])].map(normalize).filter(Boolean);
  return records.filter((record) => {
    const insMatch = numeric && record.ins && record.ins.replace(/[^0-9]/g, '') === numeric && !/[A-Z]$/i.test(item.code);
    const exactName = [record.name, ...(record.synonyms ?? []), ...(record.chemicalNames ?? [])].some((name) => names.includes(normalize(name)));
    return insMatch || exactName;
  });
}

function main() {
  const jecfa = JSON.parse(fs.readFileSync(JECFA, 'utf8'));
  const catalog = JSON.parse(fs.readFileSync(CATALOG, 'utf8')).entries;
  const records = jecfa.records ?? [];
  const evaluations = [];
  for (const record of records) for (const evaluation of record.evaluations ?? []) {
    const intake = evaluation.intake ?? null;
    const parsed = parseJecfaIntakeAssessment(intake?.rawText ?? null, { year: evaluation.year, sourceUrl: record.url, adiRawText: evaluation.adi?.rawText ?? null });
    evaluations.push({ chemicalId: record.chemicalId, name: record.name, ins: record.ins, year: evaluation.year, sourceUrl: record.url, intakeStatus: parsed.status, intake: intake?.rawText ? { ...intake, sourceUrl: record.url } : null, parsedAssessments: parsed.assessments ?? [] });
  }
  const byCode = new Map();
  for (const item of catalog) {
    const matched = matchesForItem(item, records);
    const withIntake = matched.flatMap((record) => evaluations.filter((evaluation) => evaluation.chemicalId === record.chemicalId && evaluation.intakeStatus !== 'NO_INTAKE_FIELD'));
    byCode.set(foodCode(item), { code: foodCode(item), matched: matched.length > 0, evaluations: withIntake });
  }
  const intakeEvaluations = evaluations.filter((evaluation) => evaluation.intakeStatus !== 'NO_INTAKE_FIELD');
  const parsedAssessments = intakeEvaluations.flatMap((evaluation) => evaluation.parsedAssessments.map((assessment) => ({ ...assessment, chemicalId: evaluation.chemicalId, name: evaluation.name, ins: evaluation.ins })));
  const statuses = (status) => parsedAssessments.filter((assessment) => assessment.comparisonStatus === status);
  const conclusions = (conclusion) => parsedAssessments.filter((assessment) => assessment.authorityConclusion === conclusion);
  const codesWith = (predicate) => unique([...byCode.values()].filter((item) => item.evaluations.some((evaluation) => evaluation.parsedAssessments.some(predicate))).map((item) => item.code));
  const codesWithMultipleScenarios = unique([...byCode.values()].filter((item) => item.evaluations.flatMap((evaluation) => evaluation.parsedAssessments).length > 1).map((item) => item.code));
  const latestJecfaExposureAssessment = unique(intakeEvaluations.filter((evaluation) => evaluation.ins).map((evaluation) => String(evaluation.ins))).map((ins) => {
    const sameIns = intakeEvaluations.filter((candidate) => String(candidate.ins) === ins).sort((a, b) => b.year - a.year);
    const latest = sameIns[0];
    return { ins, year: latest.year, chemicalId: latest.chemicalId, sourceUrl: latest.sourceUrl, intakeStatus: latest.intakeStatus };
  }).sort((a, b) => String(a.ins).localeCompare(String(b.ins), undefined, { numeric: true }));
  const spotCodes = ['E951', 'E250', 'E150D', 'E338', 'E621', 'E955', 'E202', 'E330', 'E407', 'E471'];
  const previous = fs.existsSync(V1) ? JSON.parse(fs.readFileSync(V1, 'utf8')) : null;
  const newlyExploitableCodes = previous ? unique([...codesWith((assessment) => assessment.exposureValues.length > 0)].filter((code) => !previous.codesWithNumericExposure.includes(code))) : [];
  const metricsBeforeAfter = previous ? {
    before: {
      codesWithJecfaIntake: previous.codesWithJecfaIntake.length,
      codesWithNumericExposure: previous.codesWithNumericExposure.length,
      codesWithPopulationExposure: previous.codesWithPopulationExposure.length,
      codesWithMultipleScenarios: previous.codesWithMultipleScenarios.length,
    },
    after: {
      codesWithJecfaIntake: codesWith((assessment) => assessment.sourceUrl).length,
      codesWithNumericExposure: codesWith((assessment) => assessment.exposureValues.length > 0).length,
      codesWithPopulationExposure: codesWith((assessment) => Boolean(assessment.population)).length,
      codesWithMultipleScenarios: codesWithMultipleScenarios.length,
    },
  } : null;
  const report = {
    schemaVersion: '1.0', generatedAt: new Date().toISOString(), source: 'WHO/JECFA official public chemical pages, rebuilt from the existing cache; no profile or risk-engine integration.',
    totalJecfaChemicals: records.length, totalEvaluations: evaluations.length, evaluationsWithIntake: intakeEvaluations.length, chemicalsWithAtLeastOneIntake: unique(intakeEvaluations.map((item) => item.chemicalId)).length, foodAdditivesWithIntake: [...byCode.values()].filter((item) => item.evaluations.length > 0).length, uniqueInsCodesWithIntake: unique(intakeEvaluations.map((item) => item.ins)),
    totalEuCodes: catalog.length, jecfaMatchedCodes: [...byCode.values()].filter((item) => item.matched).length, codesWithJecfaIntake: codesWith((assessment) => assessment.sourceUrl), codesWithNumericExposure: codesWith((assessment) => assessment.exposureValues.length > 0), codesWithPopulationExposure: codesWith((assessment) => Boolean(assessment.population)), codesBelowReference: codesWith((assessment) => assessment.comparisonStatus === 'below_reference'), codesWithinReference: codesWith((assessment) => assessment.comparisonStatus === 'within_reference'), codesWithPossibleExceedance: codesWith((assessment) => assessment.comparisonStatus === 'possible_exceedance'), codesWithConfirmedExceedance: codesWith((assessment) => assessment.comparisonStatus === 'confirmed_exceedance'), codesWithNoConcernConclusion: codesWith((assessment) => assessment.authorityConclusion === 'no_safety_concern_at_assessed_exposure'), codesWithConcernConclusion: codesWith((assessment) => ['safety_concern_at_assessed_exposure', 'concern_for_some_populations'].includes(assessment.authorityConclusion)), codesWithUnderestimationWarning: codesWith((assessment) => assessment.authorityConclusion === 'exposure_may_be_underestimated'), codesWithMultipleScenarios: codesWithMultipleScenarios,
    statusCounts: Object.fromEntries(['NO_INTAKE_FIELD', 'INTAKE_PRESENT_NO_EXPLICIT_COMPARISON', 'PARSED_EXPOSURE', 'PARSE_FAILED'].map((status) => [status, evaluations.filter((evaluation) => evaluation.intakeStatus === status).length])), latestJecfaExposureAssessment, parseFailed: evaluations.filter((evaluation) => evaluation.intakeStatus === 'PARSE_FAILED').map((evaluation) => ({ chemicalId: evaluation.chemicalId, year: evaluation.year, sourceUrl: evaluation.sourceUrl, sourceText: evaluation.intake?.rawText ?? null })),
    spotChecks: spotCodes.map((code) => { const item = byCode.get(code); const matches = item?.evaluations ?? []; return { code, jecfaMatch: item?.matched ?? false, intakePresent: matches.length > 0, evaluations: matches.map((evaluation) => ({ year: evaluation.year, sourceUrl: evaluation.sourceUrl, intakeStatus: evaluation.intakeStatus, intakeText: evaluation.intake?.rawText ?? null, parsed: evaluation.parsedAssessments })) }; }),
    comparisonWithV1: { parsedExposureBefore: 344, noExplicitComparisonBefore: 204, parseFailedBefore: 92, parsedExposureAfter: evaluations.filter((evaluation) => evaluation.intakeStatus === 'PARSED_EXPOSURE').length, noExplicitComparisonAfter: evaluations.filter((evaluation) => evaluation.intakeStatus === 'INTAKE_PRESENT_NO_EXPLICIT_COMPARISON').length, parseFailedAfter: evaluations.filter((evaluation) => evaluation.intakeStatus === 'PARSE_FAILED').length }, metricsBeforeAfter, newlyExploitableCodes, validation: { evaluateAdditiveRiskModified: false, profilesModified: false, supabaseUpsertPerformed: false, mobileOrUiModified: false },
  };
  fs.writeFileSync(OUT, `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify({ output: path.relative(ROOT, OUT), totalJecfaChemicals: report.totalJecfaChemicals, totalEvaluations: report.totalEvaluations, evaluationsWithIntake: report.evaluationsWithIntake, foodAdditivesWithIntake: report.foodAdditivesWithIntake, parseFailed: report.statusCounts.PARSE_FAILED }, null, 2));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
