"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateCorpus = validateCorpus;
const present = (value) => typeof value === 'string' ? value.trim().length > 0 : value !== undefined && value !== null;
const first = (...values) => values.find((value) => value !== undefined);
const content = (hadith, key) => {
    if (key === 'translation')
        return first(hadith.translation, hadith.translationFrench);
    if (key === 'explanation')
        return first(hadith.explanation, hadith.explanationFrench);
    return first(hadith.lessons, hadith.lessonsFrench);
};
const issue = (level, code, path, message, value) => ({ level, code, path, message, value });
function validateCorpus(corpus) {
    const issues = [];
    const hadiths = Array.isArray(corpus.hadiths) ? corpus.hadiths : [];
    if (!Array.isArray(corpus.hadiths))
        issues.push(issue('ERROR', 'CORPUS_HADITHS_MISSING', 'hadiths', 'Le tableau hadiths est obligatoire.'));
    const ids = new Map();
    const globals = new Map();
    const sourceIds = new Map();
    const numbers = hadiths.map((hadith) => hadith.globalNumber).filter((value) => Number.isInteger(value));
    hadiths.forEach((hadith, index) => {
        const path = `hadiths[${index}]`;
        const id = first(hadith.id, hadith.sourceHadithId);
        if (!present(id))
            issues.push(issue('ERROR', 'IDENTIFIER_MISSING', `${path}.id`, 'Identifiant unique absent.'));
        else
            ids.set(String(id), [...(ids.get(String(id)) ?? []), index]);
        if (!present(hadith.collectionId) && !present(corpus.collectionId))
            issues.push(issue('ERROR', 'COLLECTION_MISSING', `${path}.collectionId`, 'Collection absente.'));
        if (!present(hadith.bookId))
            issues.push(issue('ERROR', 'BOOK_ID_MISSING', `${path}.bookId`, 'bookId absent.'));
        if (!Number.isInteger(hadith.bookNumber) || hadith.bookNumber <= 0)
            issues.push(issue('ERROR', 'BOOK_NUMBER_INVALID', `${path}.bookNumber`, 'bookNumber doit être un entier positif.'));
        if (!present(hadith.bookName))
            issues.push(issue('ERROR', 'BOOK_NAME_MISSING', `${path}.bookName`, 'bookName absent.'));
        if (!present(hadith.chapterId))
            issues.push(issue('ERROR', 'CHAPTER_ID_MISSING', `${path}.chapterId`, 'chapterId absent.'));
        if (!Number.isInteger(hadith.chapterNumber) || hadith.chapterNumber <= 0)
            issues.push(issue('ERROR', 'CHAPTER_NUMBER_INVALID', `${path}.chapterNumber`, 'chapterNumber doit être un entier positif.'));
        if (!present(hadith.chapterTitle))
            issues.push(issue('ERROR', 'CHAPTER_TITLE_MISSING', `${path}.chapterTitle`, 'chapterTitle absent.'));
        if (!Number.isInteger(hadith.globalNumber) || hadith.globalNumber <= 0)
            issues.push(issue('ERROR', 'GLOBAL_NUMBER_INVALID', `${path}.globalNumber`, 'globalNumber doit être un entier positif.'));
        else
            globals.set(hadith.globalNumber, [...(globals.get(hadith.globalNumber) ?? []), index]);
        if (!Number.isInteger(hadith.hadithNumberInBook) || hadith.hadithNumberInBook <= 0)
            issues.push(issue('ERROR', 'BOOK_HADITH_NUMBER_INVALID', `${path}.hadithNumberInBook`, 'Numéro dans le livre invalide.'));
        if (!present(hadith.arabicText))
            issues.push(issue('ERROR', 'ARABIC_TEXT_MISSING', `${path}.arabicText`, 'Texte arabe absent ou vide.'));
        if (!present(hadith.source))
            issues.push(issue('ERROR', 'SOURCE_MISSING', `${path}.source`, 'Source documentaire absente.'));
        if (!present(first(hadith.version, hadith.corpusVersion, corpus.version)))
            issues.push(issue('ERROR', 'VERSION_MISSING', `${path}.version`, 'Version documentaire absente.'));
        const translation = content(hadith, 'translation');
        if (translation && !Array.isArray(translation))
            checkContent(issues, translation, `${path}.translation`, 'TRANSLATION');
        const explanation = content(hadith, 'explanation');
        if (explanation && !Array.isArray(explanation))
            checkContent(issues, explanation, `${path}.explanation`, 'EXPLANATION');
        const lessons = content(hadith, 'lessons');
        if (lessons && Array.isArray(lessons))
            lessons.forEach((lesson, lessonIndex) => { if (typeof lesson.order !== 'number' || !Number.isInteger(lesson.order) || lesson.order <= 0)
                issues.push(issue('ERROR', 'LESSON_ORDER_INVALID', `${path}.lessons[${lessonIndex}].order`, 'order doit être un entier positif.')); checkContent(issues, lesson, `${path}.lessons[${lessonIndex}]`, 'LESSON'); });
        const sourceId = first(hadith.collectionId, corpus.collectionId);
        if (present(sourceId))
            sourceIds.set(String(sourceId), [...(sourceIds.get(String(sourceId)) ?? []), index]);
    });
    ids.forEach((indexes, value) => { if (indexes.length > 1)
        issues.push(issue('ERROR', 'DUPLICATE_ID', 'hadiths', `Identifiant dupliqué : ${value}.`, indexes)); });
    globals.forEach((indexes, value) => { if (indexes.length > 1)
        issues.push(issue('ERROR', 'DUPLICATE_GLOBAL_NUMBER', 'hadiths', `Numéro global dupliqué : ${value}.`, indexes)); });
    const gaps = [];
    const ordered = [...new Set(numbers)].sort((a, b) => a - b);
    for (let index = 1; index < ordered.length; index += 1)
        for (let value = ordered[index - 1] + 1; value < ordered[index]; value += 1)
            gaps.push(issue('WARNING', 'NUMBERING_GAP', 'globalNumber', `Trou de numérotation détecté avant ${ordered[index]} : ${value}.`, value));
    issues.push(...gaps);
    for (let index = 1; index < numbers.length; index += 1)
        if (numbers[index] < numbers[index - 1])
            issues.push(issue('ERROR', 'NUMBERING_INVERSION', `hadiths[${index}].globalNumber`, 'Inversion dans l’ordre des numéros globaux.'));
    const inconsistencies = issues.filter((item) => item.code.includes('INVALID') || item.code.includes('MISSING') || item.code === 'NUMBERING_INVERSION');
    const errors = issues.filter((item) => item.level === 'ERROR');
    const warningIndexes = new Set(issues.filter((item) => item.level === 'WARNING').map((item) => item.path));
    const errorIndexes = new Set(errors.map((item) => item.path.split('.')[0]));
    return { total: hadiths.length, valid: hadiths.filter((_, index) => !errorIndexes.has(`hadiths[${index}]`)).length, withWarnings: warningIndexes.size, errors: errors.length, issues, duplicates: issues.filter((item) => item.code.startsWith('DUPLICATE_')), gaps, inconsistencies, canImport: errors.length === 0 };
}
function checkContent(issues, value, path, codePrefix) {
    if (!present(value.text))
        issues.push(issue('ERROR', `${codePrefix}_TEXT_MISSING`, `${path}.text`, 'Contenu absent ou vide.'));
    if (!present(value.source))
        issues.push(issue('ERROR', `${codePrefix}_SOURCE_MISSING`, `${path}.source`, 'Source absente.'));
    if (!present(value.version))
        issues.push(issue('ERROR', `${codePrefix}_VERSION_MISSING`, `${path}.version`, 'Version absente.'));
}
