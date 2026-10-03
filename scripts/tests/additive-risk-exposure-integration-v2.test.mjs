import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const integration = JSON.parse(fs.readFileSync('scripts/output/additive-risk-exposure-integration-audit-v2.json', 'utf8'));
const globalAudit = JSON.parse(fs.readFileSync('scripts/output/additive-risk-engine-audit-v4.json', 'utf8'));

test('les 13 profils sont rejoués avant/après', () => assert.equal(integration.totalProfilesWithActualExposure, 13));
test('deriveExposureAssessment consomme désormais les assessments modernes', () => assert.equal(integration.engineFieldUsage.readsExposureAssessments, true));
test('les 6 comparaisons explicites produisent un niveau moderne', () => assert.equal(integration.profiles.filter((profile) => profile.exposureAfter.level !== 'unknown').length, 6));
test('les profils sans comparaison restent unknown', () => assert.equal(integration.profiles.filter((profile) => profile.exposureAfter.level === 'unknown').length, 7));
test('la matrice finale ne classe aucun profil sans hazard/evidence suffisant', () => assert.equal(globalAudit.exitedInsufficientData.length, 0));
test('la distribution V4 est complète sur 341 codes', () => assert.equal(Object.values(globalAudit.distribution).reduce((sum, value) => sum + value, 0), 341));
