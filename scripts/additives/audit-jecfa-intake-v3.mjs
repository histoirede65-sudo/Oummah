#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseJecfaIntakeAssessment } from './jecfa-intake-parser.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const JECFA = path.join(ROOT, 'scripts/output/jecfa-index.json');
const CATALOG = path.join(ROOT, 'src/features/boycott/data/eu-additive-catalog.json');
const OUT = path.join(ROOT, 'scripts/output/jecfa-intake-exposure-audit-v3.json');
const V2 = path.join(ROOT, 'scripts/output/jecfa-intake-exposure-audit-v2.json');
const normalize = (value) => String(value ?? '').normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim().replace(/\s+/g, ' ');
const unique = (values) => [...new Set(values.filter(Boolean))];
const codeOf = (value) => String(value ?? '').toUpperCase().replace(/\s+/g, '');

function matchesForItem(item, records) {
  const numeric = item.code?.match(/^E(\d{3,4})$/)?.[1] ?? null;
  const names = [item.names?.en, item.canonicalNameEn, ...(item.aliases ?? [])].map(normalize).filter(Boolean);
  return records.filter((record) => {
    const insMatch = numeric && record.ins && record.ins.replace(/[^0-9]/g, '') === numeric && !/[A-Z]$/i.test(item.code);
    const exactName = [record.name, ...(record.synonyms ?? []), ...(record.chemicalNames ?? [])].some((name) => names.includes(normalize(name)));
    return insMatch || exactName;
  });
}

// Reproduction minimale du critère numérique de la V2, uniquement pour mesurer
// les faux positifs de classification; cette fonction n'est pas utilisée par le moteur V3.
function legacyV2HasNumericExposure(rawText) {
  const text = String(rawText ?? '');
  return /-?\d+(?:[.,]\d+)?\s*(?:ng|Âµg|Î¼g|ug|mg|g)\s*\/\s*[^,;.\s]+/i.test(text)
    || /-?\d+(?:[.,]\d+)?\s*(?:-|to)\s*-?\d+(?:[.,]\d+)?\s*(?:ng|Âµg|Î¼g|ug|mg|g)\s*\//i.test(text)
    || /-?\d+(?:[.,]\d+)?\s*%\s*(?:of\s+)?(?:the\s+)?(?:upper\s+bound\s+of\s+)?(?:group\s+)?ADI/i.test(text);
}

function legacyV2Status(rawText) {
  const source = String(rawText ?? '').trim();
  if (!source) return 'NO_INTAKE_FIELD';
  if (/^(?:see\s+[^.]+|not calculated|none calculated|none established|not established|ptwi withdrawn|trace amount only present)/i.test(source)) return 'INTAKE_PRESENT_NO_EXPLICIT_COMPARISON';
  let parsed = false;
  for (const sentence of source.split(/(?<=[.!?])\s+|;\s+(?=[A-Z])/)) {
    const numeric = legacyV2HasNumericExposure(sentence);
    const comparison = /\b(?:below the upper bound|within the upper bound|did not exceed|does not exceed|exceeded the upper bound|may exceed)\b[^.]{0,80}\b(?:ADI|TDI|MTDI|PMTDI|PTWI|PTMI)\b/i.test(sentence);
    const conclusion = /\b(?:does not pose a health concern|does not represent a safety concern|could be underestimated)\b/i.test(sentence);
    const context = /\b(?:exposure|intake|dietary|EDI|estimated daily intake|ADI|group ADI)\b/i.test(sentence);
    if (numeric || comparison || conclusion || context) { if (numeric || comparison || conclusion) parsed = true; }
  }
  return parsed ? 'PARSED_EXPOSURE' : 'INTAKE_PRESENT_NO_EXPLICIT_COMPARISON';
}

function main() {
  const jecfa = JSON.parse(fs.readFileSync(JECFA, 'utf8'));
  const catalog = JSON.parse(fs.readFileSync(CATALOG, 'utf8')).entries;
  const records = jecfa.records ?? [];
  const evaluations = [];
  for (const record of records) for (const evaluation of record.evaluations ?? []) {
    const intake = evaluation.intake?.rawText ?? null;
    const parsed = parseJecfaIntakeAssessment(intake, { year: evaluation.year, sourceUrl: record.url, adiRawText: evaluation.adi?.rawText ?? null });
    evaluations.push({ chemicalId: record.chemicalId, name: record.name, ins: record.ins, year: evaluation.year, sourceUrl: record.url, intake: intake ? { ...evaluation.intake, sourceUrl: record.url } : null, intakeStatus: parsed.status, assessments: parsed.assessments ?? [] });
  }
  const withExposure = (evaluation) => evaluation.assessments.some((item) => item.exposureScenarios?.length > 0);
  const withReference = (evaluation) => evaluation.assessments.some((item) => item.referenceValues?.length > 0);
  const numericExposure = (evaluation) => evaluation.assessments.some((item) => (item.exposureScenarios ?? []).some((scenario) => scenario.values?.length > 0));
  const byCode = new Map();
  for (const item of catalog) {
    const matched = matchesForItem(item, records);
    const itemEvaluations = matched.flatMap((record) => evaluations.filter((evaluation) => evaluation.chemicalId === record.chemicalId && evaluation.intakeStatus !== 'NO_INTAKE_FIELD'));
    byCode.set(codeOf(item.code), { code: codeOf(item.code), matched: matched.length > 0, evaluations: itemEvaluations });
  }
  const intakeEvaluations = evaluations.filter((evaluation) => evaluation.intakeStatus !== 'NO_INTAKE_FIELD');
  const codes = (predicate) => unique([...byCode.values()].filter((item) => item.evaluations.some(predicate)).map((item) => item.code));
  const v2FalsePositives = intakeEvaluations.filter((evaluation) => !withExposure(evaluation) && withReference(evaluation) && legacyV2Status(evaluation.intake?.rawText) === 'PARSED_EXPOSURE').map((evaluation) => ({ chemicalId: evaluation.chemicalId, name: evaluation.name, year: evaluation.year, sourceUrl: evaluation.sourceUrl, sourceText: evaluation.intake?.rawText ?? null, statusV2: 'PARSED_EXPOSURE', statusV3: 'INTAKE_PRESENT_REFERENCE_ONLY' }));
  const spotCodes = ['E951', 'E250', 'E150D', 'E338', 'E621', 'E955', 'E202', 'E330', 'E407', 'E471'];
  const spotChecks = spotCodes.map((code) => {
    const item = byCode.get(code);
    return { code, jecfaMatch: item?.matched ?? false, evaluations: (item?.evaluations ?? []).map((evaluation) => ({ year: evaluation.year, intakeStatus: evaluation.intakeStatus, intakeText: evaluation.intake?.rawText ?? null, exposureScenarios: evaluation.assessments.flatMap((assessment) => assessment.exposureScenarios ?? []), referenceValues: evaluation.assessments.flatMap((assessment) => assessment.referenceValues ?? []), comparisonStatus: unique(evaluation.assessments.map((assessment) => assessment.comparisonStatus)) })) };
  });
  const previous = fs.existsSync(V2) ? JSON.parse(fs.readFileSync(V2, 'utf8')) : null;
  const report = {
    schemaVersion: '1.0',
    generatedAt: new Date().toISOString(),
    source: 'WHO/JECFA official public chemical pages, same 640 Intake evaluations as V2.',
    totalJecfaChemicals: records.length,
    totalEvaluations: evaluations.length,
    evaluationsWithIntake: intakeEvaluations.length,
    evaluationsWithExposureScenario: intakeEvaluations.filter(withExposure).length,
    evaluationsWithReferenceValue: intakeEvaluations.filter(withReference).length,
    evaluationsWithBoth: intakeEvaluations.filter((evaluation) => withExposure(evaluation) && withReference(evaluation)).length,
    statusCounts: Object.fromEntries(['NO_INTAKE_FIELD', 'PARSED_EXPOSURE', 'INTAKE_PRESENT_REFERENCE_ONLY', 'INTAKE_PRESENT_NO_EXPLICIT_COMPARISON', 'PARSE_FAILED'].map((status) => [status, evaluations.filter((evaluation) => evaluation.intakeStatus === status).length])),
    totalEuCodes: catalog.length,
    codesWithActualExposure: codes(withExposure),
    codesWithReferenceOnly: codes((evaluation) => !withExposure(evaluation) && withReference(evaluation)),
    codesWithExplicitComparison: codes((evaluation) => evaluation.assessments.some((assessment) => assessment.comparisonStatus !== 'not_quantified')),
    codesWithNumericExposure: codes(numericExposure),
    v2Comparison: { parsedExposureBefore: previous?.comparisonWithV1?.parsedExposureAfter ?? null, referenceOnlyFalsePositivesCount: v2FalsePositives.length, referenceOnlyFalsePositives: v2FalsePositives },
    spotChecks,
    parseFailed: evaluations.filter((evaluation) => evaluation.intakeStatus === 'PARSE_FAILED').map((evaluation) => ({ chemicalId: evaluation.chemicalId, year: evaluation.year, sourceUrl: evaluation.sourceUrl, sourceText: evaluation.intake?.rawText ?? null })),
    validation: { evaluateAdditiveRiskModified: false, profilesModified: false, supabaseUpsertPerformed: false, mobileOrUiModified: false, eNumberSpecificRulesAdded: false },
  };
  fs.writeFileSync(OUT, `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify({ output: path.relative(ROOT, OUT), evaluationsWithExposureScenario: report.evaluationsWithExposureScenario, evaluationsWithReferenceValue: report.evaluationsWithReferenceValue, evaluationsWithBoth: report.evaluationsWithBoth, referenceOnlyFalsePositives: v2FalsePositives.length, parseFailed: report.statusCounts.PARSE_FAILED }, null, 2));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
