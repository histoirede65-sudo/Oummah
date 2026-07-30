import { strict as assert } from 'node:assert';
import { validateHadeethEncPayload } from './import-hadeethenc';

const payload = {
  source: {
    name: 'HadeethEnc' as const,
    organization: 'HadeethEnc' as const,
    officialUrl: 'https://hadeethenc.com/fr',
    termsUrl: 'https://hadeethenc.com/fr',
    language: 'fr' as const,
    corpusVersion: 'hadeethenc-fr-v1',
    attribution: 'HadeethEnc.com',
    license: null,
  },
  records: [{
    sourceHadithId: '1',
    sourceUrl: 'https://hadeethenc.com/fr/browse/hadith/1',
    title: 'Titre',
    hadeethAr: 'نص عربي',
    hadeeth: 'Traduction française',
    hadeethIntro: null,
    hadeethIntroAr: null,
    attribution: 'D’après un compagnon',
    attributionAr: null,
    grade: 'Authentique',
    gradeAr: null,
    explanation: 'Explication',
    explanationAr: null,
    hints: [],
    hintsAr: [],
    wordsMeaningsAr: [],
    sourceReference: 'HadeethEnc 1',
    categories: [{ sourceCategoryId: '10', sourceCategoryLabel: 'Patience', language: 'fr', parentSourceCategoryId: null, sourceHadeethsCount: 1, retrievedAt: '2026-07-30T00:00:00.000Z' }],
    themes: [{ stableKey: 'illness-trials.patience', status: 'certain' as const, sourceCategoryId: '10', sourceCategoryLabel: 'Patience' }],
    retrievedAt: '2026-07-30T00:00:00.000Z',
    documentHash: 'a'.repeat(64),
  }],
};

const valid = validateHadeethEncPayload(payload, ['illness-trials.patience']);
assert.equal(valid.canImport, true);
assert.equal(valid.errors, 0);
assert.equal(valid.total, 1);

const invalid = validateHadeethEncPayload({
  ...payload,
  records: [{ ...payload.records[0], documentHash: 'invalid' }],
}, ['illness-trials.patience']);
assert.equal(invalid.canImport, false);
assert.equal(invalid.issues.some((item) => item.code === 'DOCUMENT_HASH_INVALID'), true);

console.log('Validation HadeethEnc V2 : tests réussis');
