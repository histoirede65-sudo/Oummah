import { strict as assert } from 'node:assert';
import { validateCorpus, type ValidationCorpus } from './validation-engine';

const structuredHadith = (overrides: Record<string, unknown> = {}): Record<string, unknown> => ({
  structure: 'structured_collection',
  id: 'bukhari-1', sourceHadithId: 'bukhari-1', collectionId: 'bukhari',
  bookId: 'book-1', bookNumber: 1, bookName: 'Livre',
  chapterId: 'chapter-1', chapterNumber: 1, chapterTitle: 'Chapitre',
  globalNumber: 1, hadithNumberInBook: 1, arabicText: 'نص عربي',
  narrator: 'Narrateur', authenticity: 'sahih', source: 'Source validée',
  sourceReference: 'Référence', version: 'v1', license: 'licence-validée',
  translationFrench: { text: 'Traduction', source: 'Source', version: 'v1', license: 'licence-validée' },
  ...overrides,
});

const structuredReport = (hadiths: Record<string, unknown>[]) => validateCorpus({
  structure: 'structured_collection', version: 'v1', license: 'licence-validée',
  requireLicense: true, hadiths,
} as ValidationCorpus);

const perfect = structuredReport([structuredHadith()]);
assert.equal(perfect.engineVersion, '2.0.0');
assert.equal(perfect.canImport, true);
assert.equal(perfect.errors, 0);
assert.equal(perfect.valid, 1);

const duplicate = structuredReport([
  structuredHadith(),
  structuredHadith({ globalNumber: 2, hadithNumberInBook: 2 }),
]);
assert.equal(duplicate.duplicates.some((item) => item.code === 'DUPLICATE_ID'), true);
assert.equal(duplicate.canImport, false);

const gap = structuredReport([
  structuredHadith(),
  structuredHadith({ id: 'bukhari-3', sourceHadithId: 'bukhari-3', globalNumber: 3, hadithNumberInBook: 3 }),
]);
assert.equal(gap.gaps.some((item) => item.value === 2), true);
assert.equal(gap.canImport, true);

for (const field of ['arabicText', 'narrator', 'sourceReference', 'license'] as const) {
  const result = structuredReport([structuredHadith({ [field]: '' })]);
  assert.equal(result.canImport, false, `${field} doit bloquer l'import structuré`);
}

const optionalChapter = structuredReport([structuredHadith({ chapterId: undefined, chapterNumber: undefined, chapterTitle: undefined })]);
assert.equal(optionalChapter.canImport, true, 'Un chapitre entièrement absent reste facultatif');

const documentary = validateCorpus({
  structure: 'documentary_source', version: 'hadeethenc-fr-v1', license: null,
  knownThemeKeys: ['patience'],
  hadiths: [{
    structure: 'documentary_source', sourceHadithId: '42', arabicText: 'نص عربي',
    narrator: 'D’après...', source: 'HadeethEnc', sourceUrl: 'https://example.test/42',
    sourceReference: null, version: 'hadeethenc-fr-v1',
    documentHash: 'a'.repeat(64),
    translationFrench: { text: 'Traduction', source: 'HadeethEnc', version: 'hadeethenc-fr-v1' },
    categories: [{ sourceCategoryId: '7', sourceCategoryLabel: 'Patience', language: 'fr' }],
    themes: [{ stableKey: 'patience', status: 'certain' }],
  }],
});
assert.equal(documentary.canImport, true);
assert.equal(documentary.warnings >= 2, true, 'Licence et référence peuvent rester en avertissement documentaire');

const hashConflict = validateCorpus({
  structure: 'documentary_source', version: 'v1',
  hadiths: [
    { structure: 'documentary_source', sourceHadithId: '1', arabicText: 'أ', narrator: 'A', source: 'S', sourceReference: 'R', documentHash: 'a'.repeat(64), version: 'v1', categories: [], translationFrench: { text: 'T', source: 'S', version: 'v1' } },
    { structure: 'documentary_source', sourceHadithId: '1', arabicText: 'ب', narrator: 'A', source: 'S', sourceReference: 'R', documentHash: 'b'.repeat(64), version: 'v1', categories: [], translationFrench: { text: 'T', source: 'S', version: 'v1' } },
  ],
});
assert.equal(hashConflict.hashConflicts, 1);
assert.equal(hashConflict.canImport, false);

const unknownTheme = validateCorpus({
  structure: 'documentary_source', version: 'v1', knownThemeKeys: ['known'],
  hadiths: [{ structure: 'documentary_source', sourceHadithId: '1', arabicText: 'أ', narrator: 'A', source: 'S', sourceReference: 'R', documentHash: 'a'.repeat(64), version: 'v1', categories: [{ sourceCategoryId: '1', sourceCategoryLabel: 'C' }], themes: [{ stableKey: 'unknown', status: 'exact' }], translationFrench: { text: 'T', source: 'S', version: 'v1' } }],
});
assert.equal(unknownTheme.issues.some((item) => item.code === 'UNKNOWN_THEME'), true);
assert.equal(unknownTheme.canImport, false);

console.log('Validation Engine V2 : tests réussis');
