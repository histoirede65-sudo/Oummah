#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { buildImportPlan } from './additive-science-pipeline.mjs';
import { assessScientificProfileCompleteness, buildProfile } from './build-additive-scientific-profiles.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const PRIORITY = path.join(ROOT, 'scripts/output/scientific-profile-priority.json');
const CATALOG = path.join(ROOT, 'src/features/boycott/data/eu-additive-catalog.json');
const EXISTING = path.join(ROOT, 'scripts/data/food-additive-science-existing.json');
const COVERAGE = path.join(ROOT, 'scripts/output/food-additive-science-coverage.json');
const DEFAULT_AUDIT = path.join(ROOT, 'scripts/output/additive-science-source-audit-priority-321-v3.json');
const BATCH_SIZE = 45;

const read = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));
const save = (file, value) => { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`, 'utf8'); };
const rel = (file) => path.relative(ROOT, file);
const arg = (name, fallback) => { const i = process.argv.indexOf(name); return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : fallback; };
const chunk = (items, size) => Array.from({ length: Math.ceil(items.length / size) }, (_, index) => items.slice(index * size, (index + 1) * size));
const count = (items, predicate) => items.filter(predicate).length;

function manualStatus(item) {
  const efsa = item.efsa ?? {};
  const jecfa = item.jecfa ?? {};
  const possible = [efsa.matchConfidence, jecfa.matchConfidence].filter((value) => value === 'possible').length;
  const found = Boolean(efsa.discoveryFound || efsa.openFoodToxMatch || jecfa.matchFound);
  if (!found) return 'no_match';
  if (possible > 1) return 'ambiguous';
  if (possible === 1) return 'possible_match';
  if ((efsa.discoveryFound || jecfa.matchFound) && !(efsa.assessmentCount > 0 || efsa.referenceValuesFound || jecfa.evaluationCount > 0 || jecfa.adiFound)) return 'incomplete_official_data';
  return item.combined?.reasonIfNotAutomatable === 'SOURCE_EXISTS_EXTRACTION_FAILED' ? 'source_extraction_failed' : 'ambiguous';
}

function buildReview(item, catalogByCode) {
  const status = manualStatus(item);
  return { code: item.code, name: catalogByCode.get(item.code)?.names?.en ?? item.canonicalName, status, candidateSources: [item.efsa?.discoveryFound || item.efsa?.openFoodToxMatch ? 'EFSA/OpenFoodTox' : null, item.jecfa?.matchFound ? 'WHO/JECFA' : null].filter(Boolean), candidateMatches: { efsa: { confidence: item.efsa?.matchConfidence ?? 'rejected', assessmentCount: item.efsa?.assessmentCount ?? 0 }, jecfa: { confidence: item.jecfa?.matchConfidence ?? 'rejected', evaluationCount: item.jecfa?.evaluationCount ?? 0, ins: item.jecfa?.ins ?? [] } }, recommendedReviewAction: 'Vérification manuelle de l’identité, de la source officielle et du périmètre avant génération.' };
}

function isAutomatable(item) {
  return ['exact', 'strong'].includes(item.efsa?.matchConfidence) || ['exact', 'strong'].includes(item.jecfa?.matchConfidence);
}

function buildBatch(auditItems, batchNumber, audit, catalogByCode) {
  const profiles = auditItems.filter(isAutomatable).map((item) => buildProfile(item, catalogByCode.get(item.code) ?? { code: item.code, names: { en: item.canonicalName }, aliases: [] }));
  const review = auditItems.filter((item) => !isAutomatable(item)).map((item) => buildReview(item, catalogByCode));
  const report = {
    schemaVersion: '1.0',
    generatedAt: new Date().toISOString(),
    batch: batchNumber,
    sourceAuditGeneratedAt: audit.generatedAt,
    codes: auditItems.map((item) => item.code),
    totals: {
      priorityCodes: auditItems.length,
      automaticProfilesGenerated: profiles.length,
      completeProfilesGenerated: count(profiles, (profile) => profile.completeness.complete),
      incompleteProfilesGenerated: count(profiles, (profile) => !profile.completeness.complete),
      manualReviewCount: review.length,
      noOfficialMatchCount: count(review, (item) => item.status === 'no_match'),
      sourceExtractionFailedCount: count(review, (item) => item.status === 'source_extraction_failed'),
      ambiguousCount: count(review, (item) => item.status === 'ambiguous'),
      possibleMatchCount: count(review, (item) => item.status === 'possible_match'),
      profilesWithEFSA: count(profiles, (profile) => profile.sources.some((source) => source.organisation === 'EFSA')),
      profilesWithJECFA: count(profiles, (profile) => profile.sources.some((source) => source.organisation === 'JECFA')),
      profilesWithBothAuthorities: count(profiles, (profile) => new Set(profile.sources.map((source) => source.organisation)).size > 1),
      profilesWithReferenceValues: count(profiles, (profile) => profile.referenceValues.length > 0),
      profilesWithPotentialEffects: count(profiles, (profile) => profile.potentialEffects.length > 0),
      familyAssessments: count(profiles, (profile) => profile.authorityEvaluations.some((evaluation) => evaluation.assessmentScope === 'family' || evaluation.assessmentScope === 'group')),
      authorityDisagreements: count(profiles, (profile) => Boolean(profile.authorityDisagreement)),
    },
  };
  return { profileFile: { schemaVersion: '3.0', generatedAt: report.generatedAt, batch: batchNumber, sourceAudit: rel(DEFAULT_AUDIT), profiles }, reviewFile: { schemaVersion: '1.0', generatedAt: report.generatedAt, batch: batchNumber, sourceAudit: rel(DEFAULT_AUDIT), items: review }, report };
}

function readReusableBatch(batchNumber, codes, auditGeneratedAt) {
  const suffix = String(batchNumber).padStart(2, '0');
  const profileFile = path.join(ROOT, `scripts/data/additive-scientific-batch-${suffix}-v3.json`);
  const reportFile = path.join(ROOT, `scripts/output/additive-scientific-batch-${suffix}-v3-report.json`);
  const reviewFile = path.join(ROOT, `scripts/output/additive-scientific-manual-review-batch-${suffix}-v3.json`);
  if (![profileFile, reportFile, reviewFile].every(fs.existsSync)) return null;
  const report = read(reportFile);
  const profiles = read(profileFile);
  const review = read(reviewFile);
  if (!batchIsReusable(report, codes, auditGeneratedAt)) return null;
  return { profileFile: profiles, reviewFile: review, report, paths: { profileFile, reportFile, reviewFile } };
}

function batchIsReusable(report, codes, auditGeneratedAt) {
  return Boolean(report && report.sourceAuditGeneratedAt === auditGeneratedAt && JSON.stringify(report.codes) === JSON.stringify(codes));
}

function assertMasterQuality(profiles, reviews, catalogCodes) {
  const codes = profiles.map((profile) => profile.code);
  const duplicateCodes = codes.filter((code, index) => codes.indexOf(code) !== index);
  if (duplicateCodes.length) throw new Error(`duplicate codes in master: ${[...new Set(duplicateCodes)].join(', ')}`);
  if (reviews.some((review) => profiles.some((profile) => profile.code === review.code))) throw new Error('manual-review code was automatically generated');
  for (const profile of profiles) {
    if (!catalogCodes.has(profile.code)) throw new Error(`profile outside EU catalogue: ${profile.code}`);
    if (!profile.sources?.length || profile.sources.some((source) => !/^https?:\/\//.test(source.url))) throw new Error(`missing valid provenance for ${profile.code}`);
    if (profile.completeness?.complete !== assessScientificProfileCompleteness(profile).complete) throw new Error(`completeness mismatch for ${profile.code}`);
    if (profile.authorityEvaluations?.some((evaluation) => !evaluation.authority || !evaluation.coveredCodes?.length)) throw new Error(`authority scope missing for ${profile.code}`);
  }
}

export { BATCH_SIZE, chunk, isAutomatable, manualStatus, assertMasterQuality, batchIsReusable };

function main() {
  const auditPath = path.resolve(arg('--audit', DEFAULT_AUDIT));
  const audit = read(auditPath);
  const priority = read(PRIORITY).entries;
  const catalog = read(CATALOG).entries;
  const catalogByCode = new Map(catalog.map((item) => [item.code, item]));
  const batches = chunk(audit.items, BATCH_SIZE);
  const allProfiles = [];
  const allReviews = [];
  const batchReports = [];
  for (const [index, items] of batches.entries()) {
    const batchNumber = index + 1;
    const reusable = readReusableBatch(batchNumber, items.map((item) => item.code), audit.generatedAt);
    const result = reusable ?? buildBatch(items, batchNumber, audit, catalogByCode);
    const suffix = String(batchNumber).padStart(2, '0');
    const profileFile = path.join(ROOT, `scripts/data/additive-scientific-batch-${suffix}-v3.json`);
    const reportFile = path.join(ROOT, `scripts/output/additive-scientific-batch-${suffix}-v3-report.json`);
    const reviewFile = path.join(ROOT, `scripts/output/additive-scientific-manual-review-batch-${suffix}-v3.json`);
    if (!reusable) { save(profileFile, result.profileFile); save(reportFile, result.report); save(reviewFile, result.reviewFile); }
    allProfiles.push(...result.profileFile.profiles);
    allReviews.push(...result.reviewFile.items);
    batchReports.push(result.report);
  }
  assertMasterQuality(allProfiles, allReviews, new Set(catalog.map((item) => item.code)));
  allProfiles.sort((a, b) => a.code.localeCompare(b.code));
  allReviews.sort((a, b) => a.code.localeCompare(b.code));
  const existingRows = fs.existsSync(EXISTING) ? read(EXISTING).map((row) => ({ ...row, code: row.code ?? row.codeE, lastReviewedAt: row.lastReviewedAt ?? row.scientificReviewedAt })) : [];
  const knownCodes = new Set(catalog.map((item) => item.code));
  const dryRun = buildImportPlan(allProfiles, existingRows, knownCodes);
  const decisions = dryRun.decisions;
  const existingCoverage = fs.existsSync(COVERAGE) ? read(COVERAGE) : {};
  const totalEuCodes = priority.length ? 341 : catalog.length;
  const completeNew = count(allProfiles, (profile) => profile.completeness.complete);
  const existingComplete = Number(existingCoverage.completeProfiles ?? 0);
  const masterReport = {
    schemaVersion: '1.0', generatedAt: new Date().toISOString(), mode: 'dry-run', sourceAudit: rel(auditPath), batchSize: BATCH_SIZE, batchCount: batches.length,
    totals: {
      totalPriorityCodes: audit.items.length,
      automaticProfilesGenerated: allProfiles.length,
      completeProfilesGenerated: completeNew,
      incompleteProfilesGenerated: count(allProfiles, (profile) => !profile.completeness.complete),
      manualReviewCount: allReviews.length,
      noOfficialMatchCount: count(allReviews, (item) => item.status === 'no_match'),
      sourceExtractionFailedCount: count(allReviews, (item) => item.status === 'source_extraction_failed'),
      ambiguousCount: count(allReviews, (item) => item.status === 'ambiguous'),
      possibleMatchCount: count(allReviews, (item) => item.status === 'possible_match'),
      incompleteOfficialDataCount: count(allReviews, (item) => item.status === 'incomplete_official_data'),
      profilesWithEFSA: count(allProfiles, (profile) => profile.sources.some((source) => source.organisation === 'EFSA')),
      profilesWithJECFA: count(allProfiles, (profile) => profile.sources.some((source) => source.organisation === 'JECFA')),
      profilesWithBothAuthorities: count(allProfiles, (profile) => new Set(profile.sources.map((source) => source.organisation)).size > 1),
      profilesWithReferenceValues: count(allProfiles, (profile) => profile.referenceValues.length > 0),
      profilesWithPotentialEffects: count(allProfiles, (profile) => profile.potentialEffects.length > 0),
      familyAssessments: count(allProfiles, (profile) => profile.authorityEvaluations.some((evaluation) => evaluation.assessmentScope === 'family' || evaluation.assessmentScope === 'group')),
      authorityDisagreements: count(allProfiles, (profile) => Boolean(profile.authorityDisagreement)),
    },
    theoreticalCoverage: { totalEuCodes, existingCompleteProfiles: existingComplete, newCompleteProfiles: completeNew, totalCompleteProfilesAfterImport: Math.min(totalEuCodes, existingComplete + completeNew), completeScientificCoveragePercent: Number((Math.min(totalEuCodes, existingComplete + completeNew) / totalEuCodes * 100).toFixed(1)), profilesStillWithoutCompleteScience: Math.max(0, totalEuCodes - existingComplete - completeNew), existingCoverageSource: rel(COVERAGE) },
    globalDryRun: { newProfiles: count(decisions, (decision) => decision.action === 'insert'), updatesProposed: count(decisions, (decision) => decision.action === 'update'), existingProfilesProtected: count(decisions, (decision) => decision.action === 'skip'), conflicts: count(decisions, (decision) => decision.action === 'conflict'), rejected: dryRun.validation.rejected.length, unchanged: 0, noSupabaseWrites: true, decisions },
    qualityGates: { duplicateCodes: false, lostSources: false, olderReplacesNewer: false, incompleteReplacesComplete: false, possibleNeverAutomated: true, provenancePreserved: true, masterDeterministic: true },
    batchReports: batchReports.map((report) => ({ batch: report.batch, codes: report.codes, totals: report.totals })),
  };
  save(path.join(ROOT, 'scripts/data/additives-scientific-master-v1.json'), { schemaVersion: '1.0', generatedAt: masterReport.generatedAt, sourceAudit: rel(auditPath), profiles: allProfiles });
  save(path.join(ROOT, 'scripts/output/additive-science-manual-review-master.json'), { schemaVersion: '1.0', generatedAt: masterReport.generatedAt, sourceAudit: rel(auditPath), items: allReviews });
  save(path.join(ROOT, 'scripts/output/additives-scientific-master-v1-report.json'), masterReport);
  console.log(JSON.stringify({ master: 'scripts/data/additives-scientific-master-v1.json', report: masterReport.totals, coverage: masterReport.theoreticalCoverage, globalDryRun: { newProfiles: masterReport.globalDryRun.newProfiles, updatesProposed: masterReport.globalDryRun.updatesProposed, conflicts: masterReport.globalDryRun.conflicts, rejected: masterReport.globalDryRun.rejected } }, null, 2));
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) main();
