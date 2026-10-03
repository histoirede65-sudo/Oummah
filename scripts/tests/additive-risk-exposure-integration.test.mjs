import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const report = JSON.parse(fs.readFileSync('scripts/output/additive-risk-exposure-integration-audit-v1.json', 'utf8'));

test('les 13 profils JECFA avec exposition sont audités', () => assert.equal(report.totalProfilesWithActualExposure, 13));
test('deriveExposureAssessment ne lit pas les nouveaux champs', () => { assert.equal(report.engineFieldUsage.readsExposureAssessments, false); assert.equal(report.engineFieldUsage.readsLatestExposureAssessment, false); assert.equal(report.engineFieldUsage.readsComparisonStatus, false); });
test('les 6 comparaisons explicites sont identifiées', () => assert.equal(report.profilesWithExplicitComparison.length, 6));
test('les 5 conclusions officielles sont identifiées', () => assert.equal(report.profilesWithAuthorityConclusion.length, 5));
test('le blocage principal est l’absence de normalisation moteur', () => assert.equal(report.blockingReasonCounts.ENGINE_NOT_READING_NEW_EXPOSURE_FIELDS, 13));
test('aucun fichier fonctionnel n’a été modifié par cet audit', () => { assert.equal(report.validation.evaluateAdditiveRiskModified, false); assert.equal(report.validation.deriveExposureAssessmentModified, false); assert.equal(report.validation.profilesModified, false); });
