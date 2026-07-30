import { strict as assert } from 'node:assert';
import { validateSourceFile } from './import-bukhari';

const sourceHadith = (globalNumber: number, sourceHadithId: string): Record<string, unknown> => ({
  sourceHadithId,
  globalNumber,
  hadithNumberInBook: globalNumber,
  arabicText: 'Arabic source text',
  narrator: 'Narrator',
  authenticityGrade: 'sahih',
  sourceReference: 'Reference',
  book: { number: 1, sourceId: 'book-1', titleFrench: 'Book', titleArabic: 'Book' },
  chapter: { number: 1, sourceId: 'chapter-1', titleFrench: 'Chapter', titleArabic: 'Chapter' },
});

const corpus = (hadiths: Record<string, unknown>[]): Record<string, unknown> => ({
  source: { name: 'Validated source', corpusVersion: 'v1', license: 'validated-license' },
  collection: { sourceId: 'bukhari', nameFrench: 'Sahih al-Bukhari', nameArabic: 'Collection' },
  hadiths,
});

const perfect = validateSourceFile(corpus([sourceHadith(1, 'bukhari-1')]), 'v1');
assert.equal(perfect.canImport, true);

const warning = validateSourceFile(corpus([sourceHadith(1, 'bukhari-1'), sourceHadith(3, 'bukhari-3')]), 'v1');
assert.equal(warning.canImport, true);
assert.equal(warning.gaps.length, 1);

const error = validateSourceFile(corpus([{ ...sourceHadith(1, 'bukhari-1'), arabicText: '' }]), 'v1');
assert.equal(error.canImport, false);
assert.equal(error.issues.some((item) => item.code === 'ARABIC_TEXT_MISSING'), true);

// validateSourceFile is pure: validation-only execution does not construct a REST client.
assert.equal(perfect.issues.some((item) => item.code.startsWith('SUPABASE')), false);

console.log('Validation pipeline V1: tests réussis');
