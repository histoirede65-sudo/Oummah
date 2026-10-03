#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const read = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));
const save = (file, value) => { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`, 'utf8'); };
const rel = (file) => path.relative(ROOT, file);
const unique = (values) => [...new Set(values)];
const codes = (items) => unique(items.map((item) => String(item.code ?? item.codeE ?? '').trim().toUpperCase()).filter(Boolean));
const sortCodes = (values) => [...new Set(values)].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

const catalogFile = path.join(ROOT, 'src/features/boycott/data/eu-additive-catalog.json');
const coverageFile = path.join(ROOT, 'scripts/output/food-additive-science-coverage.json');
const masterFile = path.join(ROOT, 'scripts/data/additives-scientific-master-v1.json');
const auditDatasetFile = path.join(ROOT, 'scripts/output/additive-risk-engine-resolved-dataset-v1.json');
const proposalFile = path.join(ROOT, 'scripts/output/food-additive-science-proposed-top25.json');
const dryRunFile = path.join(ROOT, 'scripts/output/food-additive-science-supabase-import-dry-run.json');
const oldBatchFiles = [path.join(ROOT, 'scripts/data/additives-scientific-batch-01.json'), path.join(ROOT, 'scripts/data/additives-scientific-batch-02.json')];

function normalizeCode(value) { return String(value ?? '').trim().toUpperCase().replace(/^E\s*/, 'E'); }
function profileComplete(profile) { return profile?.completeness?.complete === true; }
function sourceLabel(profile) { return profile ? (profile.needsScientificReview || profile.needs_scientific_review ? 'incomplete' : 'complete') : 'missing'; }

function main() {
  const catalogItems = read(catalogFile).entries;
  const catalogCodes = sortCodes(catalogItems.map((item) => normalizeCode(item.code)));
  const catalogByCode = new Map(catalogItems.map((item) => [normalizeCode(item.code), item]));
  const coverage = read(coverageFile);
  const declaredExistingCodes = new Set(catalogCodes.filter((code) => !coverage.missingKnownCodes.includes(code)));
  const existingIncompleteCodes = new Set(coverage.incompleteCodes.map(normalizeCode));
  const existingCompleteCodes = new Set([...declaredExistingCodes].filter((code) => !existingIncompleteCodes.has(code)));
  const masterProfiles = read(masterFile).profiles;
  const masterByCode = new Map(masterProfiles.map((profile) => [normalizeCode(profile.code), profile]));
  const masterCompleteCodes = new Set(masterProfiles.filter(profileComplete).map((profile) => normalizeCode(profile.code)));
  const masterIncompleteCodes = new Set(masterProfiles.filter((profile) => !profileComplete(profile)).map((profile) => normalizeCode(profile.code)));
  const localProfiles = oldBatchFiles.filter(fs.existsSync).flatMap((file) => read(file)).concat(read(proposalFile).records);
  const localCodes = new Set(codes(localProfiles));
  const auditRows = read(auditDatasetFile).rows;
  const finalResolvedCompleteCodes = new Set(auditRows.filter((row) => row.profileStatus === 'complete').map((row) => normalizeCode(row.code)));
  const finalResolvedIncompleteCodes = new Set(auditRows.filter((row) => row.profileStatus === 'incomplete').map((row) => normalizeCode(row.code)));
  const finalMissingCodes = new Set(auditRows.filter((row) => row.profileStatus === 'missing').map((row) => normalizeCode(row.code)));
  const expectedCompleteCodes = new Set([...existingCompleteCodes, ...masterCompleteCodes]);
  const overlapExistingMasterComplete = sortCodes([...existingCompleteCodes].filter((code) => masterCompleteCodes.has(code)));
  const overlapExistingMasterAny = sortCodes([...existingCompleteCodes].filter((code) => masterByCode.has(code)));
  const masterInCatalog = sortCodes(masterProfiles.filter((profile) => catalogByCode.has(normalizeCode(profile.code))).map((profile) => normalizeCode(profile.code)));
  const masterOutsideCatalog = sortCodes(masterProfiles.filter((profile) => !catalogByCode.has(normalizeCode(profile.code))).map((profile) => normalizeCode(profile.code)));
  const downgradedByCompleteness = sortCodes([...masterCompleteCodes].filter((code) => finalResolvedIncompleteCodes.has(code)));
  const existingCompleteResolvedAsIncomplete = sortCodes([...existingCompleteCodes].filter((code) => finalResolvedIncompleteCodes.has(code)));
  const masterCompleteResolvedAsIncomplete = sortCodes([...masterCompleteCodes].filter((code) => finalResolvedIncompleteCodes.has(code)));
  const expectedButNotActuallyComplete = sortCodes([...expectedCompleteCodes].filter((code) => !finalResolvedCompleteCodes.has(code)));
  const missingFromAudit = sortCodes([...expectedCompleteCodes].filter((code) => finalMissingCodes.has(code)));
  const resolutionErrors = sortCodes([...expectedCompleteCodes].filter((code) => !finalResolvedCompleteCodes.has(code) && !finalResolvedIncompleteCodes.has(code) && !finalMissingCodes.has(code)));
  const dryRun = read(dryRunFile);
  const protectedOrIgnoredCodes = sortCodes([...(dryRun.ignored ?? []), ...(dryRun.existingEnrichments ?? []).map((item) => item.code).filter(Boolean)]);
  const expectedCompleteButNotActuallyComplete = expectedButNotActuallyComplete.map((code) => {
    const master = masterByCode.get(code);
    const currentStatus = finalResolvedIncompleteCodes.has(code) && existingCompleteCodes.has(code) ? 'completeness_rule_difference' : finalResolvedIncompleteCodes.has(code) ? 'incomplete' : finalMissingCodes.has(code) ? 'missing' : resolutionErrors.includes(code) ? 'resolution_error' : overlapExistingMasterAny.includes(code) ? 'overlap' : 'other';
    const reason = currentStatus === 'missing' ? 'Le code est déclaré complet dans la couverture théorique mais aucun profil utilisable n’est chargé par le dataset de l’audit.' : currentStatus === 'completeness_rule_difference' ? 'La couverture Supabase déclare ce code complet, mais le profil local disponible porte needs_scientific_review=true ; assessScientificProfileCompleteness n’a pas été modifié.' : currentStatus === 'incomplete' ? 'Le profil a été résolu mais sa complétude effective est incomplète.' : currentStatus === 'overlap' ? 'Le compteur théorique provient d’un recouvrement existant/master.' : 'Aucune cause de perte identifiée dans la résolution.';
    return { code, canonicalName: catalogByCode.get(code)?.names?.en ?? master?.names?.en ?? code, expectedSource: existingCompleteCodes.has(code) && !masterCompleteCodes.has(code) ? 'existing' : masterCompleteCodes.has(code) ? 'master' : 'existing', currentStatus, reason };
  });
  const normalizationChecks = ['E150d', 'E407a', 'E960c'].map((value) => ({ input: value, normalized: normalizeCode(value), catalogMatch: catalogByCode.has(normalizeCode(value)), masterMatch: masterByCode.has(normalizeCode(value)) }));
  const report = {
    schemaVersion: '1.0', generatedAt: new Date().toISOString(), totalEuCodes: 341,
    sources: { coverage: rel(coverageFile), master: rel(masterFile), auditDataset: rel(auditDatasetFile), localProfiles: oldBatchFiles.filter(fs.existsSync).map(rel), proposal: rel(proposalFile) },
    sets: { existingSupabaseCompleteCodes: sortCodes(existingCompleteCodes), existingSupabaseIncompleteCodes: sortCodes(existingIncompleteCodes), masterGeneratedCompleteCodes: sortCodes(masterCompleteCodes), masterGeneratedIncompleteCodes: sortCodes(masterIncompleteCodes), finalResolvedCompleteCodes: sortCodes(finalResolvedCompleteCodes), finalResolvedIncompleteCodes: sortCodes(finalResolvedIncompleteCodes), finalMissingCodes: sortCodes(finalMissingCodes) },
    existingComplete: existingCompleteCodes.size, masterComplete: masterCompleteCodes.size, theoreticalSum: existingCompleteCodes.size + masterCompleteCodes.size, uniqueUnionComplete: expectedCompleteCodes.size,
    finalAuditComplete: finalResolvedCompleteCodes.size, finalAuditIncomplete: finalResolvedIncompleteCodes.size, finalAuditMissing: finalMissingCodes.size,
    overlaps: { existingAndMasterComplete: overlapExistingMasterComplete, existingAndMasterAny: overlapExistingMasterAny, existingCompleteMasterCompleteCount: overlapExistingMasterComplete.length, localProfilesOverlappingMaster: sortCodes([...localCodes].filter((code) => masterByCode.has(code))), localProfilesOverlappingExisting: sortCodes([...localCodes].filter((code) => existingCompleteCodes.has(code))) },
    downgradedByCompleteness, existingCompleteResolvedAsIncomplete, masterCompleteResolvedAsIncomplete, resolutionErrors, missingFromAudit, protectedOrIgnoredCodes,
    masterInspection: { totalProfiles: masterProfiles.length, completeProfiles: masterCompleteCodes.size, incompleteProfiles: masterIncompleteCodes.size, duplicateCodes: sortCodes(masterProfiles.map((profile) => normalizeCode(profile.code)).filter((code, index, all) => all.indexOf(code) !== index)), codesInEuCatalogue: masterInCatalog.length, codesOutsideEuCatalogue: masterOutsideCatalog, lostDuringFusion: missingFromAudit },
    normalizationChecks,
    completenessRule: { step11MasterUsesStoredCompletenessObject: true, auditUsesProfileStatusResolution: true, assessScientificProfileCompletenessWasNotChanged: true, difference: 'Étape 11 additionnait deux compteurs ; l’audit déduplique et applique la priorité de résolution.' },
    expectedCompleteButNotActuallyComplete,
    reconciliation: { missingExpectedCount: expectedCompleteButNotActuallyComplete.length, formulaError: existingCompleteCodes.size + masterCompleteCodes.size !== expectedCompleteCodes.size, sourceOfGap: expectedCompleteButNotActuallyComplete.length === 17 ? 'Les 17 codes sont dans la couverture existante théorique mais absents du master/dataset local effectivement chargé.' : 'Écart à examiner dans les ensembles détaillés.' },
  };
  save(path.join(ROOT, 'scripts/output/additive-scientific-coverage-reconciliation-v1.json'), report);
  console.log(JSON.stringify({ report: 'scripts/output/additive-scientific-coverage-reconciliation-v1.json', counts: { existingComplete: report.existingComplete, masterComplete: report.masterComplete, theoreticalSum: report.theoreticalSum, uniqueUnionComplete: report.uniqueUnionComplete, finalAuditComplete: report.finalAuditComplete, finalAuditIncomplete: report.finalAuditIncomplete, finalAuditMissing: report.finalAuditMissing, gap: expectedCompleteButNotActuallyComplete.length }, expectedCompleteButNotActuallyComplete }, null, 2));
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) main();
