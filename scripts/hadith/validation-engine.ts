export type ValidationLevel = 'INFO' | 'WARNING' | 'ERROR';
export type ValidationStructure = 'structured_collection' | 'documentary_source';

export interface ValidationContent {
  text?: string;
  author?: string;
  editor?: string;
  source?: string;
  version?: string;
  license?: string;
  [key: string]: unknown;
}

export interface ValidationCategory {
  sourceCategoryId?: string;
  sourceCategoryLabel?: string;
  language?: string;
  parentSourceCategoryId?: string | null;
  sourceHadeethsCount?: number | null;
  [key: string]: unknown;
}

export interface ValidationTheme {
  stableKey?: string;
  status?: string;
  sourceCategoryId?: string;
  sourceCategoryLabel?: string;
  [key: string]: unknown;
}

export interface ValidationHadith {
  structure?: ValidationStructure;
  id?: string;
  sourceHadithId?: string;
  collectionId?: string;
  bookId?: string;
  bookNumber?: number;
  bookName?: string;
  chapterId?: string;
  chapterNumber?: number;
  chapterTitle?: string;
  globalNumber?: number;
  hadithNumberInBook?: number;
  arabicText?: string;
  narrator?: string;
  chain?: string;
  chainText?: string;
  authenticity?: string;
  authenticityGrade?: string;
  source?: string;
  sourceReference?: string | null;
  sourceUrl?: string | null;
  version?: string;
  corpusVersion?: string;
  license?: string | null;
  documentHash?: string;
  translation?: ValidationContent;
  translationFrench?: ValidationContent;
  explanation?: ValidationContent;
  explanationFrench?: ValidationContent;
  lessons?: ValidationContent[];
  lessonsFrench?: ValidationContent[];
  categories?: ValidationCategory[];
  themes?: ValidationTheme[];
  [key: string]: unknown;
}

export interface ValidationCorpus {
  structure?: ValidationStructure;
  hadiths?: ValidationHadith[];
  collectionId?: string;
  source?: string;
  version?: string;
  license?: string | null;
  requireLicense?: boolean;
  knownThemeKeys?: Iterable<string>;
  [key: string]: unknown;
}

export interface ValidationIssue {
  level: ValidationLevel;
  code: string;
  path: string;
  message: string;
  value?: unknown;
  recordIndex?: number;
}

export interface ValidationReport {
  engineVersion: '2.0.0';
  generatedAt: string;
  structure: ValidationStructure;
  total: number;
  valid: number;
  withWarnings: number;
  errors: number;
  warnings: number;
  infos: number;
  issues: ValidationIssue[];
  duplicates: ValidationIssue[];
  gaps: ValidationIssue[];
  inconsistencies: ValidationIssue[];
  missingTranslations: number;
  missingCategories: number;
  hashConflicts: number;
  canImport: boolean;
}

const HASH_RE = /^[0-9a-f]{64}$/;
const present = (value: unknown): boolean =>
  typeof value === 'string'
    ? value.trim().length > 0
    : value !== undefined && value !== null;
const positiveInteger = (value: unknown): value is number =>
  typeof value === 'number' && Number.isInteger(value) && value > 0;
const first = <T>(...values: Array<T | undefined>): T | undefined =>
  values.find((value) => value !== undefined);
const makeIssue = (
  level: ValidationLevel,
  code: string,
  path: string,
  message: string,
  value?: unknown,
  recordIndex?: number,
): ValidationIssue => ({ level, code, path, message, value, recordIndex });

function content(
  hadith: ValidationHadith,
  key: 'translation' | 'explanation' | 'lessons',
): ValidationContent | ValidationContent[] | undefined {
  if (key === 'translation') return first(hadith.translation, hadith.translationFrench);
  if (key === 'explanation') return first(hadith.explanation, hadith.explanationFrench);
  return first(hadith.lessons, hadith.lessonsFrench);
}

function checkContent(
  issues: ValidationIssue[],
  value: ValidationContent,
  path: string,
  codePrefix: string,
  index: number,
): void {
  if (!present(value.text)) issues.push(makeIssue('ERROR', `${codePrefix}_TEXT_MISSING`, `${path}.text`, 'Contenu absent ou vide.', undefined, index));
  if (!present(value.source)) issues.push(makeIssue('ERROR', `${codePrefix}_SOURCE_MISSING`, `${path}.source`, 'Source absente.', undefined, index));
  if (!present(value.version)) issues.push(makeIssue('ERROR', `${codePrefix}_VERSION_MISSING`, `${path}.version`, 'Version absente.', undefined, index));
  if (value.license !== undefined && value.license !== null && !present(value.license)) issues.push(makeIssue('ERROR', `${codePrefix}_LICENSE_INVALID`, `${path}.license`, 'Licence vide.', value.license, index));
}

function duplicateIssues(map: Map<string, number[]>, code: string, label: string): ValidationIssue[] {
  const result: ValidationIssue[] = [];
  for (const [value, indexes] of map) {
    if (indexes.length > 1) result.push(makeIssue('ERROR', code, 'hadiths', `${label} dupliqué : ${value}.`, indexes));
  }
  return result;
}

export function validateCorpus(corpus: ValidationCorpus): ValidationReport {
  const generatedAt = new Date().toISOString();
  const issues: ValidationIssue[] = [];
  const hadiths = Array.isArray(corpus.hadiths) ? corpus.hadiths : [];
  const structure = corpus.structure ?? hadiths[0]?.structure ?? 'structured_collection';
  const knownThemeKeys = corpus.knownThemeKeys ? new Set(corpus.knownThemeKeys) : null;

  if (!Array.isArray(corpus.hadiths)) {
    issues.push(makeIssue('ERROR', 'CORPUS_HADITHS_MISSING', 'hadiths', 'Le tableau hadiths est obligatoire.'));
  }
  if (!present(first(corpus.version, hadiths[0]?.version, hadiths[0]?.corpusVersion))) {
    issues.push(makeIssue('ERROR', 'CORPUS_VERSION_MISSING', 'version', 'Version documentaire absente.'));
  }
  if (corpus.requireLicense && !present(corpus.license)) {
    issues.push(makeIssue('ERROR', 'CORPUS_LICENSE_MISSING', 'license', 'Licence documentaire obligatoire.'));
  } else if (!present(corpus.license)) {
    issues.push(makeIssue('WARNING', 'CORPUS_LICENSE_UNVALIDATED', 'license', 'Licence absente ou non documentée.'));
  }

  const ids = new Map<string, number[]>();
  const globalNumbers = new Map<string, number[]>();
  const bookNumbers = new Map<string, number[]>();
  const hashes = new Map<string, { hash: string; indexes: number[] }>();
  const sequenceByCollection = new Map<string, number[]>();
  let missingTranslations = 0;
  let missingCategories = 0;

  hadiths.forEach((hadith, index) => {
    const path = `hadiths[${index}]`;
    const rowStructure = hadith.structure ?? structure;
    if (rowStructure !== structure) issues.push(makeIssue('ERROR', 'MIXED_STRUCTURE', `${path}.structure`, 'Un lot ne peut pas mélanger plusieurs structures documentaires.', rowStructure, index));

    const id = first(hadith.sourceHadithId, hadith.id);
    if (!present(id)) issues.push(makeIssue('ERROR', 'IDENTIFIER_MISSING', `${path}.sourceHadithId`, 'Identifiant source absent.', undefined, index));
    else ids.set(String(id), [...(ids.get(String(id)) ?? []), index]);

    if (!present(hadith.arabicText)) issues.push(makeIssue('ERROR', 'ARABIC_TEXT_MISSING', `${path}.arabicText`, 'Texte arabe absent ou vide.', undefined, index));
    if (!present(first(hadith.source, corpus.source))) issues.push(makeIssue('ERROR', 'SOURCE_MISSING', `${path}.source`, 'Source documentaire absente.', undefined, index));
    if (!present(first(hadith.version, hadith.corpusVersion, corpus.version))) issues.push(makeIssue('ERROR', 'VERSION_MISSING', `${path}.version`, 'Version documentaire absente.', undefined, index));
    if (!present(hadith.sourceReference)) issues.push(makeIssue(rowStructure === 'structured_collection' ? 'ERROR' : 'WARNING', 'SOURCE_REFERENCE_MISSING', `${path}.sourceReference`, 'Référence source absente.', undefined, index));
    if (!present(hadith.narrator)) issues.push(makeIssue('ERROR', 'NARRATOR_MISSING', `${path}.narrator`, 'Narrateur ou attribution absent.', undefined, index));
    if (corpus.requireLicense && !present(first(hadith.license ?? undefined, corpus.license ?? undefined))) issues.push(makeIssue('ERROR', 'LICENSE_MISSING', `${path}.license`, 'Licence absente.', undefined, index));

    if (rowStructure === 'structured_collection') {
      const collectionId = first(hadith.collectionId, corpus.collectionId);
      if (!present(collectionId)) issues.push(makeIssue('ERROR', 'COLLECTION_MISSING', `${path}.collectionId`, 'Collection absente.', undefined, index));
      if (!present(hadith.bookId)) issues.push(makeIssue('ERROR', 'BOOK_ID_MISSING', `${path}.bookId`, 'bookId absent.', undefined, index));
      if (!positiveInteger(hadith.bookNumber)) issues.push(makeIssue('ERROR', 'BOOK_NUMBER_INVALID', `${path}.bookNumber`, 'bookNumber doit être un entier positif.', hadith.bookNumber, index));
      if (!present(hadith.bookName)) issues.push(makeIssue('ERROR', 'BOOK_NAME_MISSING', `${path}.bookName`, 'bookName absent.', undefined, index));
      if (hadith.chapterId !== undefined || hadith.chapterNumber !== undefined || hadith.chapterTitle !== undefined) {
        if (!present(hadith.chapterId)) issues.push(makeIssue('ERROR', 'CHAPTER_ID_MISSING', `${path}.chapterId`, 'chapterId absent.', undefined, index));
        if (!positiveInteger(hadith.chapterNumber)) issues.push(makeIssue('ERROR', 'CHAPTER_NUMBER_INVALID', `${path}.chapterNumber`, 'chapterNumber doit être un entier positif.', hadith.chapterNumber, index));
        if (!present(hadith.chapterTitle)) issues.push(makeIssue('ERROR', 'CHAPTER_TITLE_MISSING', `${path}.chapterTitle`, 'chapterTitle absent.', undefined, index));
      }
      if (!positiveInteger(hadith.globalNumber)) issues.push(makeIssue('ERROR', 'GLOBAL_NUMBER_INVALID', `${path}.globalNumber`, 'globalNumber doit être un entier positif.', hadith.globalNumber, index));
      if (!positiveInteger(hadith.hadithNumberInBook)) issues.push(makeIssue('ERROR', 'BOOK_HADITH_NUMBER_INVALID', `${path}.hadithNumberInBook`, 'Numéro dans le livre invalide.', hadith.hadithNumberInBook, index));
      if (present(collectionId) && positiveInteger(hadith.globalNumber)) {
        const key = `${String(collectionId)}:${hadith.globalNumber}`;
        globalNumbers.set(key, [...(globalNumbers.get(key) ?? []), index]);
        const sequence = sequenceByCollection.get(String(collectionId)) ?? [];
        sequence.push(hadith.globalNumber);
        sequenceByCollection.set(String(collectionId), sequence);
      }
      if (present(hadith.bookId) && positiveInteger(hadith.hadithNumberInBook)) {
        const key = `${String(hadith.bookId)}:${hadith.hadithNumberInBook}`;
        bookNumbers.set(key, [...(bookNumbers.get(key) ?? []), index]);
      }
    } else {
      if (!present(hadith.documentHash) || !HASH_RE.test(String(hadith.documentHash))) issues.push(makeIssue('ERROR', 'DOCUMENT_HASH_INVALID', `${path}.documentHash`, 'Hash documentaire SHA-256 invalide.', hadith.documentHash, index));
      if (present(id) && present(hadith.documentHash)) {
        const key = String(id);
        const prior = hashes.get(key);
        if (!prior) hashes.set(key, { hash: String(hadith.documentHash), indexes: [index] });
        else if (prior.hash !== String(hadith.documentHash)) {
          prior.indexes.push(index);
          issues.push(makeIssue('ERROR', 'DOCUMENT_HASH_CONFLICT', `${path}.documentHash`, `Même identifiant source avec un contenu différent : ${key}.`, prior.indexes, index));
        }
      }
      if (!present(hadith.sourceUrl)) issues.push(makeIssue('WARNING', 'SOURCE_URL_MISSING', `${path}.sourceUrl`, 'URL source absente.', undefined, index));
      if (!Array.isArray(hadith.categories) || hadith.categories.length === 0) {
        missingCategories += 1;
        issues.push(makeIssue('WARNING', 'CATEGORIES_MISSING', `${path}.categories`, 'Aucune catégorie source.', undefined, index));
      } else {
        const categoryIds = new Set<string>();
        hadith.categories.forEach((category, categoryIndex) => {
          const categoryPath = `${path}.categories[${categoryIndex}]`;
          if (!present(category.sourceCategoryId)) issues.push(makeIssue('ERROR', 'CATEGORY_ID_MISSING', `${categoryPath}.sourceCategoryId`, 'Identifiant de catégorie absent.', undefined, index));
          if (!present(category.sourceCategoryLabel)) issues.push(makeIssue('ERROR', 'CATEGORY_LABEL_MISSING', `${categoryPath}.sourceCategoryLabel`, 'Libellé de catégorie absent.', undefined, index));
          const categoryId = String(category.sourceCategoryId ?? '');
          if (categoryId && categoryIds.has(categoryId)) issues.push(makeIssue('ERROR', 'DUPLICATE_SOURCE_CATEGORY', `${path}.categories`, `Catégorie source dupliquée : ${categoryId}.`, categoryId, index));
          categoryIds.add(categoryId);
          if (category.sourceHadeethsCount !== null && category.sourceHadeethsCount !== undefined && (!Number.isInteger(category.sourceHadeethsCount) || category.sourceHadeethsCount < 0)) issues.push(makeIssue('ERROR', 'CATEGORY_COUNT_INVALID', `${categoryPath}.sourceHadeethsCount`, 'Le compteur de catégorie doit être un entier positif ou nul.', category.sourceHadeethsCount, index));
        });
      }
      if (Array.isArray(hadith.themes)) {
        const themeKeys = new Set<string>();
        hadith.themes.forEach((theme, themeIndex) => {
          const themePath = `${path}.themes[${themeIndex}]`;
          if (!['exact', 'certain', 'ambiguous', 'unmapped'].includes(String(theme.status))) issues.push(makeIssue('ERROR', 'THEME_STATUS_INVALID', `${themePath}.status`, 'Statut de mapping thématique invalide.', theme.status, index));
          if (theme.status === 'exact' || theme.status === 'certain') {
            if (!present(theme.stableKey)) issues.push(makeIssue('ERROR', 'THEME_KEY_MISSING', `${themePath}.stableKey`, 'stableKey obligatoire pour un mapping exact ou certain.', undefined, index));
            const stableKey = String(theme.stableKey ?? '');
            if (stableKey && themeKeys.has(stableKey)) issues.push(makeIssue('WARNING', 'DUPLICATE_THEME_PROPOSAL', `${path}.themes`, `Proposition thématique dupliquée : ${stableKey}.`, stableKey, index));
            themeKeys.add(stableKey);
            if (stableKey && knownThemeKeys && !knownThemeKeys.has(stableKey)) issues.push(makeIssue('ERROR', 'UNKNOWN_THEME', `${themePath}.stableKey`, `Thème OUMMAH inconnu : ${stableKey}.`, stableKey, index));
          }
        });
      }
    }

    const translation = content(hadith, 'translation');
    if (!translation || Array.isArray(translation)) {
      missingTranslations += 1;
      issues.push(makeIssue('WARNING', 'TRANSLATION_MISSING', `${path}.translation`, 'Traduction française absente.', undefined, index));
    } else checkContent(issues, translation, `${path}.translation`, 'TRANSLATION', index);

    const explanation = content(hadith, 'explanation');
    if (explanation && !Array.isArray(explanation)) checkContent(issues, explanation, `${path}.explanation`, 'EXPLANATION', index);
    const lessons = content(hadith, 'lessons');
    if (lessons && Array.isArray(lessons)) {
      const orders = new Set<number>();
      lessons.forEach((lesson, lessonIndex) => {
        const order = lesson.order;
        if (!positiveInteger(order)) issues.push(makeIssue('ERROR', 'LESSON_ORDER_INVALID', `${path}.lessons[${lessonIndex}].order`, 'order doit être un entier positif.', order, index));
        else if (orders.has(order)) issues.push(makeIssue('ERROR', 'DUPLICATE_LESSON_ORDER', `${path}.lessons`, `Ordre de leçon dupliqué : ${order}.`, order, index));
        else orders.add(order);
        checkContent(issues, lesson, `${path}.lessons[${lessonIndex}]`, 'LESSON', index);
      });
    }
  });

  issues.push(...duplicateIssues(ids, 'DUPLICATE_ID', 'Identifiant source'));
  if (structure === 'structured_collection') {
    issues.push(...duplicateIssues(globalNumbers, 'DUPLICATE_GLOBAL_NUMBER', 'Numéro global'));
    issues.push(...duplicateIssues(bookNumbers, 'DUPLICATE_BOOK_HADITH_NUMBER', 'Numéro dans le livre'));
  }

  const gaps: ValidationIssue[] = [];
  for (const [collectionId, sequence] of sequenceByCollection) {
    const ordered = [...new Set(sequence)].sort((a, b) => a - b);
    for (let index = 1; index < ordered.length; index += 1) {
      for (let value = ordered[index - 1] + 1; value < ordered[index]; value += 1) gaps.push(makeIssue('WARNING', 'NUMBERING_GAP', `collection:${collectionId}.globalNumber`, `Trou de numérotation : ${value}.`, value));
    }
    for (let index = 1; index < sequence.length; index += 1) if (sequence[index] < sequence[index - 1]) issues.push(makeIssue('ERROR', 'NUMBERING_INVERSION', `collection:${collectionId}.globalNumber`, 'Inversion dans l’ordre des numéros globaux.', [sequence[index - 1], sequence[index]]));
  }
  issues.push(...gaps);

  const duplicates = issues.filter((item) => item.code.startsWith('DUPLICATE_'));
  const inconsistencies = issues.filter((item) => item.code.includes('INVALID') || item.code.includes('MISSING') || item.code.includes('CONFLICT') || item.code === 'NUMBERING_INVERSION' || item.code === 'MIXED_STRUCTURE');
  const errorIssues = issues.filter((item) => item.level === 'ERROR');
  const warningIssues = issues.filter((item) => item.level === 'WARNING');
  const infoIssues = issues.filter((item) => item.level === 'INFO');
  const recordErrors = new Set(errorIssues.flatMap((item) => item.recordIndex === undefined ? [] : [item.recordIndex]));
  const recordWarnings = new Set(warningIssues.flatMap((item) => item.recordIndex === undefined ? [] : [item.recordIndex]));

  return {
    engineVersion: '2.0.0',
    generatedAt,
    structure,
    total: hadiths.length,
    valid: hadiths.filter((_, index) => !recordErrors.has(index)).length,
    withWarnings: recordWarnings.size,
    errors: errorIssues.length,
    warnings: warningIssues.length,
    infos: infoIssues.length,
    issues,
    duplicates,
    gaps,
    inconsistencies,
    missingTranslations,
    missingCategories,
    hashConflicts: issues.filter((item) => item.code === 'DOCUMENT_HASH_CONFLICT').length,
    canImport: errorIssues.length === 0,
  };
}
