import { strict as assert } from 'node:assert';
import { validateLegalPublication } from './legal-validation';

const source = {
  sourceName: 'HadeethEnc',
  sourceStatus: 'Validée',
  sourceVersion: 'fr-v1',
  languageCode: 'fr',
  license: 'LICENSE-ID',
  attribution: 'Attribution officielle',
  termsUrl: 'https://example.test/terms',
  sourceUrl: 'https://example.test/source',
};

const review = {
  decision: 'approved' as const,
  redistributionAllowed: true,
  commercialUseAllowed: null,
  modificationAllowed: null,
  licenseIdentifier: 'LICENSE-ID',
  licenseEvidenceReference: 'legal/evidence/2026-07-30',
  attributionSnapshot: 'Attribution officielle',
  termsUrlSnapshot: 'https://example.test/terms',
  sourceUrlSnapshot: 'https://example.test/source',
  reviewedBy: 'Responsable juridique',
  justification: 'Droits de redistribution vérifiés.',
};

const valid = validateLegalPublication(source, review);
assert.equal(valid.errors, 0);
assert.equal(valid.canApprove, true);
assert.equal(valid.canPublish, true);

const missingLicense = validateLegalPublication({ ...source, license: null }, review);
assert.equal(missingLicense.canPublish, false);
assert.equal(missingLicense.issues.some((item) => item.code === 'LICENSE_MISSING'), true);

const staleAttribution = validateLegalPublication(
  { ...source, attribution: 'Nouvelle attribution' },
  review,
);
assert.equal(staleAttribution.canPublish, false);
assert.equal(staleAttribution.issues.some((item) => item.code === 'ATTRIBUTION_SNAPSHOT_MISMATCH'), true);

const redistributionDenied = validateLegalPublication(source, {
  ...review,
  redistributionAllowed: false,
});
assert.equal(redistributionDenied.canPublish, false);
assert.equal(redistributionDenied.issues.some((item) => item.code === 'REDISTRIBUTION_NOT_ALLOWED'), true);

const rejected = validateLegalPublication(source, { ...review, decision: 'rejected' });
assert.equal(rejected.canPublish, false);
assert.equal(rejected.issues.some((item) => item.code === 'LEGAL_REVIEW_NOT_APPROVED'), true);

console.log('Validation juridique Hadith V1 : tests réussis');
