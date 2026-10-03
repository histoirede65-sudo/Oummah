#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const INPUT = path.join(ROOT, 'scripts/output/scientific-profile-priority.json');
const EFSA_INDEX = path.join(ROOT, 'scripts/output/openfoodtox-index.json');
const JECFA_INDEX = path.join(ROOT, 'scripts/output/jecfa-index.json');
const V1 = path.join(ROOT, 'scripts/output/additive-science-source-audit-01.json');
const V2 = path.join(ROOT, 'scripts/output/additive-science-source-audit-01-v2.json');
const OUTPUT = path.join(ROOT, 'scripts/output/additive-science-source-audit-01-v3.json');

function read(file) { return JSON.parse(fs.readFileSync(file, 'utf8')); }
function save(file, value) { fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`, 'utf8'); }
function maxByYear(items) { return [...items].sort((a, b) => Number(b?.year ?? 0) - Number(a?.year ?? 0))[0] ?? null; }
function arg(name, fallback) { const i = process.argv.indexOf(name); return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : fallback; }

function main() {
  const limit = Number(arg('--limit', '30'));
  const priority = read(INPUT).entries.slice(0, limit);
  const efsa = read(EFSA_INDEX).priorityBatch;
  const jecfa = read(JECFA_INDEX).priorityBatch;
  const old1 = read(V1); const old2 = read(V2);
  const efsaByCode = new Map(efsa.map((item) => [item.code, item]));
  const jecfaByCode = new Map(jecfa.map((item) => [item.code, item]));
  const items = priority.map((item) => {
    const e = efsaByCode.get(item.code) ?? { matchConfidence: null, matchedReferenceSubstances: [], assessmentReferences: [], referenceValues: [], assessmentDomain: null };
    const j = jecfaByCode.get(item.code) ?? { matchConfidence: null, matches: [], matchingMethod: null };
    const efsaAssessmentCount = e.assessmentReferences.length;
    const efsaReferenceValueCount = e.referenceValues.length;
    const jRecords = j.matches ?? [];
    const jEvaluations = jRecords.flatMap((record) => record.evaluations ?? []);
    const jAdi = jEvaluations.filter((evaluation) => evaluation.adi?.rawText);
    const efsaUsable = ['exact', 'strong'].includes(e.matchConfidence) && e.assessmentDomain === 'food_additive_human' && (efsaAssessmentCount > 0 || efsaReferenceValueCount > 0);
    const jecfaUsable = ['exact', 'strong'].includes(j.matchConfidence) && jRecords.length > 0 && jEvaluations.length > 0;
    const authorities = [];
    if (efsaUsable) authorities.push('EFSA/OpenFoodTox');
    if (jecfaUsable) authorities.push('WHO/JECFA');
    let reasonIfNotAutomatable = null;
    if (!authorities.length) reasonIfNotAutomatable = e.matchConfidence === 'possible' || j.matchConfidence === 'possible' ? 'MATCH_AMBIGUOUS' : !e.matchConfidence && !jRecords.length ? 'NO_MATCH' : 'SOURCE_EXISTS_EXTRACTION_FAILED';
    return {
      code: item.code,
      canonicalName: item.names?.en ?? item.code,
      efsa: { discoveryFound: efsaAssessmentCount > 0 || e.matchedReferenceSubstances.length > 0, openFoodToxMatch: e.matchedReferenceSubstances.length > 0, matchConfidence: e.matchConfidence ?? 'rejected', assessmentCount: efsaAssessmentCount, referenceValuesFound: efsaReferenceValueCount > 0, latestAssessment: maxByYear(e.assessmentReferences), assessmentReferences: e.assessmentReferences, assessmentDomain: e.assessmentDomain, referenceValues: e.referenceValues, humanHealthEffects: e.humanHealthEffects ?? [], uncertaintyInformation: e.uncertaintyInformation ?? [] },
      jecfa: { matchFound: jRecords.length > 0, ins: [...new Set(jRecords.map((record) => record.ins).filter(Boolean))], matchConfidence: j.matchConfidence ?? 'rejected', matchingMethods: j.matchingMethods ?? [], evaluationCount: jEvaluations.length, adiFound: jAdi.length > 0, latestAssessment: maxByYear(jEvaluations), assessments: jEvaluations, sourceRecords: jRecords.map((record) => ({ chemicalId: record.chemicalId, name: record.name, url: record.url, ins: record.ins, cas: record.cas })) },
      combined: { officialAuthoritiesFound: authorities, scientificDataAvailable: authorities.length > 0, automatable: authorities.length > 0, reasonIfNotAutomatable },
    };
  });
  const count = (predicate) => items.filter(predicate).length;
  const report = {
    schemaVersion: '3.0', generatedAt: new Date().toISOString(), input: { totalRequested: items.length, codes: items.map((item) => item.code) },
    sources: { efsa: { authority: 'EFSA', dataset: 'OpenFoodTox 3.0', doi: '10.5281/zenodo.19388272', index: path.relative(ROOT, EFSA_INDEX) }, jecfa: { authority: 'WHO/JECFA', database: 'https://apps.who.int/food-additives-contaminants-jecfa-database/Home', index: path.relative(ROOT, JECFA_INDEX) } },
    totals: {
      totalCodes: items.length,
      efsa: { discoveredOnEfsa: count((item) => item.efsa.discoveryFound), matchedInOpenFoodTox: count((item) => item.efsa.openFoodToxMatch), codesWithEfsaReferenceValue: count((item) => item.efsa.referenceValuesFound), codesWithEfsaAssessment: count((item) => item.efsa.assessmentCount > 0) },
      jecfa: { matchedByINS: count((item) => item.jecfa.matchingMethods.includes('ins_exact')), matchedByCAS: count((item) => item.jecfa.matchingMethods.includes('cas_exact')), matchedByName: count((item) => item.jecfa.matchingMethods.includes('name_or_synonym_exact')), codesWithJecfaADI: count((item) => item.jecfa.adiFound), codesWithJecfaEvaluation: count((item) => item.jecfa.evaluationCount > 0) },
      combined: { codesWithAtLeastOneOfficialAssessment: count((item) => item.combined.officialAuthoritiesFound.length > 0), codesWithTwoAuthorities: count((item) => item.combined.officialAuthoritiesFound.length > 1), exactMatches: count((item) => item.efsa.matchConfidence === 'exact' || item.jecfa.matchConfidence === 'exact'), strongMatches: count((item) => item.efsa.matchConfidence === 'strong' || item.jecfa.matchConfidence === 'strong'), possibleMatches: count((item) => item.efsa.matchConfidence === 'possible' || item.jecfa.matchConfidence === 'possible'), automatableProfiles: count((item) => item.combined.automatable) },
    },
    comparison: { v1: old1.totals, v2: old2.totals, v3: 'This report uses structured OpenFoodTox 3.0 and WHO/JECFA public evaluation records; no page-level Wiley extraction is required.' },
    items,
    interpretation: 'Audit-only structured-source collection. No evaluateAdditiveRisk, OUMMAH colour, Score Santé, runtime mobile change or Supabase upsert was performed.',
  };
  save(path.resolve(arg('--output', OUTPUT)), report);
  console.log(JSON.stringify({ output: OUTPUT, totals: report.totals }, null, 2));
}
main();
