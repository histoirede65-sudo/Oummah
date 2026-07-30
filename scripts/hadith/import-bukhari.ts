import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import type {
  ImportReport, NormalizedCollection, NormalizedCorpus, NormalizedHadith,
  SourceFile, SourceHadith, SourceLesson, SourceTranslation, SourceExplanation,
  VerificationStatus, ValidationError, ValidationWarning,
} from './types';
import { validateCorpus, type ValidationCorpus, type ValidationIssue, type ValidationReport } from './validation-engine';

declare const require: { main?: unknown } | undefined;
declare const module: unknown;

const STATUSES = new Set<VerificationStatus>(['unverified', 'partially_verified', 'verified']);
const text = (value: unknown): string => typeof value === 'string' ? value.trim() : '';
const optionalText = (value: unknown): string | null => text(value) || null;
const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);
const positiveInt = (value: unknown): value is number => typeof value === 'number' && Number.isInteger(value) && value > 0;
const status = (value: unknown, path: string, errors: ValidationError[]): VerificationStatus => {
  if (typeof value === 'string' && STATUSES.has(value as VerificationStatus)) return value as VerificationStatus;
  errors.push({ path, message: 'verificationStatus invalide' });
  return 'unverified';
};
const hash = (value: string): string => createHash('sha256').update(value, 'utf8').digest('hex');
const stable = (value: unknown): string => {
  if (value === null || typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stable).join(',')}]`;
  if (isRecord(value)) return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stable(value[key])}`).join(',')}}`;
  return 'null';
};
const sourceKey = (name: string, item: string | null, version: string): string => `${name}\u001f${item ?? ''}\u001f${version}`;

function parseArgs(argv: string[]): { file: string; limit: number; dryRun: boolean; validateOnly: boolean; corpusVersion: string; lifecycleAuthor: string | null; lifecycleJustification: string | null; lifecycleEvidence: string | null; sourceIdJustification: string | null; sourceIdEvidence: string | null } {
  const get = (name: string): string | null => argv.find((arg) => arg.startsWith(`--${name}=`))?.slice(name.length + 3) ?? null;
  const file = get('file');
  const rawLimit = get('limit') ?? '20';
  const corpusVersion = get('corpus-version');
  const lifecycleAuthor = get('lifecycle-author');
  const lifecycleJustification = get('lifecycle-justification');
  const lifecycleEvidence = get('lifecycle-evidence');
  const sourceIdJustification = get('source-hadith-id-justification');
  const sourceIdEvidence = get('source-hadith-id-evidence');
  const dryRun = argv.includes('--dry-run');
  const validateOnly = argv.includes('--validate-only');
  if (!file) throw new Error('--file est obligatoire');
  if (!/^\d+$/.test(rawLimit) || Number(rawLimit) <= 0) throw new Error('--limit doit être un entier strictement positif');
  if (!corpusVersion?.trim()) throw new Error('--corpus-version doit être non vide');
  if (dryRun && validateOnly) throw new Error('--dry-run et --validate-only sont exclusifs');
  return { file, limit: Number(rawLimit), dryRun, validateOnly, corpusVersion: corpusVersion.trim(), lifecycleAuthor, lifecycleJustification, lifecycleEvidence, sourceIdJustification, sourceIdEvidence };
}

function rejectEnglish(root: unknown, errors: ValidationError[], path = '$'): void {
  if (Array.isArray(root)) { root.forEach((item, index) => rejectEnglish(item, errors, `${path}[${index}]`)); return; }
  if (!isRecord(root)) return;
  for (const [key, value] of Object.entries(root)) {
    if (/english|language(code)?/i.test(key) && (key.toLowerCase().includes('english') || value === 'en')) errors.push({ path: `${path}.${key}`, message: 'contenu anglais interdit' });
    rejectEnglish(value, errors, `${path}.${key}`);
  }
}

function normalize(raw: unknown, fileHash: string, requestedVersion: string, limit: number): NormalizedCorpus {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  const duplicates: string[] = [];
  rejectEnglish(raw, errors);
  if (!isRecord(raw) || !isRecord(raw.source) || !isRecord(raw.collection) || !Array.isArray(raw.hadiths)) {
    throw new Error('Le JSON doit contenir source, collection et hadiths[]');
  }
  const source = raw.source;
  const collectionRaw = raw.collection;
  const collection: NormalizedCollection = {
    slug: text(collectionRaw.sourceId), name: text(collectionRaw.nameFrench), arabicName: text(collectionRaw.nameArabic),
    sourceName: text(source.name), sourceUrl: optionalText(source.url), license: optionalText(source.license),
    corpusVersion: requestedVersion, verificationStatus: 'unverified',
  };
  if (!collection.slug || !collection.name || !collection.sourceName) errors.push({ path: '$.collection', message: 'identité de collection incomplète' });
  const rows = raw.hadiths.slice(0, limit);
  const globalNumbers = new Set<number>(); const sourceIds = new Set<string>(); const bookHadiths = new Set<string>();
  const books = new Map<number, { sourceId: string; number: number; name: string; arabicName: string }>();
  const chapters = new Map<string, { sourceId: string; number: number; name: string; arabicName: string; sourceReference: string | null }>();
  const hadiths: NormalizedHadith[] = [];
  rows.forEach((item, index) => {
    const path = `$.hadiths[${index}]`;
    if (!isRecord(item)) { errors.push({ path, message: 'hadith invalide' }); return; }
    const book = isRecord(item.book) ? item.book : {}; const chapter = isRecord(item.chapter) ? item.chapter : null;
    const sourceHadithId = text(item.sourceHadithId); const globalNumber = item.globalNumber; const hadithNumber = item.hadithNumberInBook;
    const bookNumber = book.number; const chapterNumber = chapter?.number;
    if (!sourceHadithId || !positiveInt(globalNumber) || !positiveInt(hadithNumber) || !positiveInt(bookNumber)) errors.push({ path, message: 'identifiants et numéros positifs obligatoires' });
    if (chapter && !positiveInt(chapterNumber)) errors.push({ path: `${path}.chapter.number`, message: 'numéro de chapitre invalide' });
    const arabicText = text(item.arabicText); if (!arabicText) errors.push({ path: `${path}.arabicText`, message: 'texte arabe vide' });
    const bookId = text(book.sourceId); const chapterId = chapter ? text(chapter.sourceId) : null;
    if (!globalNumbers.has(globalNumber as number)) globalNumbers.add(globalNumber as number); else duplicates.push(`globalNumber=${String(globalNumber)}`);
    if (!sourceIds.has(sourceHadithId)) sourceIds.add(sourceHadithId); else duplicates.push(`sourceHadithId=${sourceHadithId}`);
    const bookHadithKey = `${String(bookNumber)}:${String(hadithNumber)}`; if (bookHadiths.has(bookHadithKey)) duplicates.push(`book+hadith=${bookHadithKey}`); else bookHadiths.add(bookHadithKey);
    if (positiveInt(bookNumber) && bookId) { const prior = books.get(bookNumber); if (prior && prior.sourceId !== bookId) duplicates.push(`book sourceId incohérent=${bookId}`); else books.set(bookNumber, { sourceId: bookId, number: bookNumber, name: text(book.titleFrench), arabicName: text(book.titleArabic) }); }
    if (chapter && positiveInt(bookNumber) && positiveInt(chapterNumber) && chapterId) { const key = `${bookNumber}:${chapterNumber}`; const prior = chapters.get(key); if (prior && prior.sourceId !== chapterId) duplicates.push(`chapter sourceId incohérent=${chapterId}`); else chapters.set(key, { sourceId: chapterId, number: chapterNumber, name: text(chapter.titleFrench), arabicName: text(chapter.titleArabic), sourceReference: optionalText(chapter.sourceReference) }); }
    const translation = isRecord(item.translationFrench) ? parseTranslation(item.translationFrench, `${path}.translationFrench`, errors) : null;
    const explanation = isRecord(item.explanationFrench) ? parseExplanation(item.explanationFrench, `${path}.explanationFrench`, errors) : null;
    const lessons = Array.isArray(item.lessonsFrench) ? item.lessonsFrench.flatMap((lesson, lessonIndex) => parseLesson(lesson, `${path}.lessonsFrench[${lessonIndex}]`, errors)) : [];
    const orders = new Set<number>(); lessons.forEach((lesson) => { if (orders.has(lesson.order)) duplicates.push(`${path}: lesson_order=${lesson.order}`); orders.add(lesson.order); });
    const explanationKeys = new Set<string>(); if (explanation) { const key = sourceKey(explanation.sourceName, explanation.sourceItemId, requestedVersion); if (explanationKeys.has(key)) duplicates.push(`${path}: explanation logical key=${key}`); explanationKeys.add(key); }
    const lessonKeys = new Set<string>(); lessons.forEach((lesson) => { const key = `${sourceKey(lesson.sourceName, lesson.sourceItemId, requestedVersion)}:${lesson.order}`; if (lessonKeys.has(key)) duplicates.push(`${path}: lesson logical key=${key}`); lessonKeys.add(key); });
    if (!translation) warnings.push({ path, message: 'traduction française absente' }); if (!explanation) warnings.push({ path, message: 'explication française absente' }); if (!lessons.length) warnings.push({ path, message: 'enseignements français absents' });
    const normalizedIdentity = stable({ sourceHadithId, globalNumber: Number(globalNumber), bookNumber: Number(bookNumber), hadithNumberInBook: Number(hadithNumber) });
    hadiths.push({ sourceHadithId, globalNumber: Number(globalNumber), bookNumber: Number(bookNumber), chapterNumber: positiveInt(chapterNumber) ? chapterNumber : null, hadithNumberInBook: Number(hadithNumber), arabicText, narrator: optionalText(item.narrator), chainText: optionalText(item.chainText), authenticityGrade: optionalText(item.authenticityGrade), sourceReference: optionalText(item.sourceReference), sourceName: collection.sourceName, sourceUrl: collection.sourceUrl, license: collection.license, corpusVersion: requestedVersion, verificationStatus: 'unverified', translation, explanation, lessons, hash: hash(`${normalizedIdentity}\n${arabicText}`) });
  });
  const normalizedChapters = [...chapters.entries()].map(([key, chapter]) => ({ ...chapter, bookSourceId: books.get(Number(key.split(':')[0]))?.sourceId ?? '' }));
  return { collection, books: [...books.values()], chapters: normalizedChapters, hadiths, fileHash, errors, warnings, duplicates: [...new Set(duplicates)] };
}

function parseTranslation(raw: Record<string, unknown>, path: string, errors: ValidationError[]): SourceTranslation {
  const result: SourceTranslation = { text: text(raw.text), translator: optionalText(raw.translator), sourceName: text(raw.sourceName), sourceUrl: optionalText(raw.sourceUrl), sourceReference: optionalText(raw.sourceReference), license: optionalText(raw.license), verificationStatus: status(raw.verificationStatus, `${path}.verificationStatus`, errors) };
  if (!result.text || !result.sourceName) errors.push({ path, message: 'traduction : texte et sourceName obligatoires' }); return result;
}
function parseExplanation(raw: Record<string, unknown>, path: string, errors: ValidationError[]): SourceExplanation {
  const result: SourceExplanation = { text: text(raw.text), sourceName: text(raw.sourceName), sourceUrl: optionalText(raw.sourceUrl), sourceReference: optionalText(raw.sourceReference), sourceItemId: optionalText(raw.sourceItemId), license: optionalText(raw.license), verificationStatus: status(raw.verificationStatus, `${path}.verificationStatus`, errors) };
  if (!result.text || !result.sourceName) errors.push({ path, message: 'explication : texte et sourceName obligatoires' }); return result;
}
function parseLesson(raw: unknown, path: string, errors: ValidationError[]): SourceLesson[] {
  if (!isRecord(raw)) { errors.push({ path, message: 'enseignement invalide' }); return []; }
  const order = raw.order; const result: SourceLesson = { order: Number(order), text: text(raw.text), sourceName: text(raw.sourceName), sourceUrl: optionalText(raw.sourceUrl), sourceReference: optionalText(raw.sourceReference), sourceItemId: optionalText(raw.sourceItemId), license: optionalText(raw.license), verificationStatus: status(raw.verificationStatus, `${path}.verificationStatus`, errors) };
  if (!positiveInt(order) || !result.text || !result.sourceName) errors.push({ path, message: 'enseignement : order, texte et sourceName obligatoires' }); return [result];
}

function report(corpus: NormalizedCorpus, file: string, corpusVersion: string, limit: number): ImportReport {
  return { file, fileHash: corpus.fileHash, corpusVersion, limit, collections: 1, books: corpus.books.length, chapters: corpus.chapters.length, hadiths: corpus.hadiths.length, translationsFrench: corpus.hadiths.filter((h) => h.translation).length, explanationsFrench: corpus.hadiths.filter((h) => h.explanation).length, lessonsFrench: corpus.hadiths.reduce((sum, h) => sum + h.lessons.length, 0), incompleteHadiths: corpus.warnings.map((w) => w.path).filter((path, i, a) => a.indexOf(path) === i).length, errors: corpus.errors.length, warnings: corpus.warnings.length, duplicates: corpus.duplicates };
}

function print(corpus: NormalizedCorpus, result: ImportReport): void {
  console.log(JSON.stringify(result, null, 2));
  console.log('Erreurs:', corpus.errors); console.log('Avertissements:', corpus.warnings); console.log('Doublons:', corpus.duplicates);
  console.log('Trois premiers hadiths normalisés:', JSON.stringify(corpus.hadiths.slice(0, 3), null, 2));
}

interface RestClient { request(path: string, method: string, body?: Record<string, unknown>): Promise<Record<string, unknown>[]>; }
const REST_TIMEOUT_MS = 30_000;
const isUuid = (value: unknown): value is string => typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
function restClient(url: string, key: string): RestClient {
  return { async request(path, method, body) {
    const controller = new AbortController(); const timer = setTimeout(() => controller.abort(), REST_TIMEOUT_MS);
    try {
      const normalizedPath = path.replace('source_item_id,corpus_version,lesson_order', 'source_item_id_normalized,corpus_version,lesson_order').replace('source_item_id,corpus_version', 'source_item_id_normalized,corpus_version');
      const payload = body && typeof body.source_hash === 'string' ? { ...body, source_hash: hash(stable(body)) } : body;
      const response = await fetch(`${url.replace(/\/+$/, '')}/rest/v1/${normalizedPath}`, { method, headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', Prefer: 'resolution=merge-duplicates,return=representation' }, body: payload === undefined ? undefined : JSON.stringify(payload), signal: controller.signal });
      const raw = await response.text(); let parsed: unknown = null; if (raw) { try { parsed = JSON.parse(raw); } catch { throw new Error(`Réponse JSON invalide (${method} ${path})`); } }
      if (!response.ok) throw new Error(`Supabase ${method} ${path}: ${response.status}`);
      if (isRecord(parsed) && ('error' in parsed || 'code' in parsed || 'message' in parsed)) throw new Error(`Supabase ${method} ${path}: erreur dans la réponse`);
      if (parsed === null) return [];
      if (!Array.isArray(parsed) || !parsed.every(isRecord)) throw new Error(`Réponse REST inattendue (${method} ${path})`);
      if (method === 'POST' && parsed.length !== 1) throw new Error(`Réponse REST ambiguë (${method} ${normalizedPath})`);
      return parsed;
    } catch (error) { if (error instanceof Error && error.name === 'AbortError') throw new Error(`Timeout réseau après ${REST_TIMEOUT_MS} ms (${method} ${path})`); throw error; } finally { clearTimeout(timer); }
  } };
}

async function importHadithBatch(url: string, key: string, payload: unknown, args: ReturnType<typeof parseArgs>): Promise<Record<string, unknown>> {
  const context = [args.lifecycleAuthor, args.lifecycleJustification, args.lifecycleEvidence, args.sourceIdJustification, args.sourceIdEvidence];
  if (context.some((value) => !value?.trim())) throw new Error('Les cinq paramètres de contexte documentaire sont obligatoires pour un import RPC');
  const controller = new AbortController(); const timer = setTimeout(() => controller.abort(), REST_TIMEOUT_MS);
  try {
    const response = await fetch(`${url.replace(/\/+$/, '')}/rest/v1/rpc/import_hadith_batch`, { method: 'POST', headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ p_payload: payload, p_lifecycle_author: args.lifecycleAuthor, p_lifecycle_justification: args.lifecycleJustification, p_lifecycle_version: args.corpusVersion, p_lifecycle_evidence: args.lifecycleEvidence, p_source_hadith_id_justification: args.sourceIdJustification, p_source_hadith_id_evidence: args.sourceIdEvidence }), signal: controller.signal });
    const raw = await response.text(); let parsed: unknown = null; if (raw) { try { parsed = JSON.parse(raw); } catch { throw new Error('Réponse RPC JSON invalide'); } }
    if (!response.ok) throw new Error(`Supabase RPC import_hadith_batch: ${response.status} ${raw}`);
    if (!isRecord(parsed) || 'error' in parsed || 'message' in parsed) throw new Error('Réponse RPC invalide ou erreur serveur');
    return parsed;
  } catch (error) { if (error instanceof Error && error.name === 'AbortError') throw new Error(`Timeout réseau après ${REST_TIMEOUT_MS} ms (RPC import_hadith_batch)`); throw error; } finally { clearTimeout(timer); }
}
const filterValue = (value: string): string => encodeURIComponent(value);
async function deactivate(client: RestClient, table: string, hadithId: string, sourceName: string, sourceItemId: string | null): Promise<void> {
  const itemFilter = sourceItemId === null ? 'is.null' : `eq.${filterValue(sourceItemId)}`;
  await client.request(`${table}?hadith_id=eq.${filterValue(hadithId)}&language_code=eq.fr&source_name=eq.${filterValue(sourceName)}&source_item_id=${itemFilter}&is_active=eq.true`, 'PATCH', { is_active: false });
}
async function one(rows: Record<string, unknown>[], label: string): Promise<string> { if (rows.length !== 1 || !isUuid(rows[0]?.id)) throw new Error(`${label}: réponse attendue exactement une ligne UUID`); return rows[0].id; }
async function importReal(corpus: NormalizedCorpus, client: RestClient): Promise<void> {
  const c = await client.request('hadith_collections?on_conflict=slug', 'POST', { slug: corpus.collection.slug, name: corpus.collection.name, arabic_name: corpus.collection.arabicName, source_name: corpus.collection.sourceName, source_url: corpus.collection.sourceUrl, license: corpus.collection.license, corpus_version: corpus.collection.corpusVersion, verification_status: corpus.collection.verificationStatus }); const collectionId = await one(c, 'Collection');
  const bookIds = new Map<number, string>(); for (const book of corpus.books) { const rows = await client.request('hadith_books?on_conflict=collection_id,book_number', 'POST', { collection_id: collectionId, book_number: book.number, name: book.name, arabic_name: book.arabicName, source_book_number: book.sourceId }); const id = rows[0]?.id; if (typeof id !== 'string') throw new Error(`Livre ${book.number} non retourné`); bookIds.set(book.number, id); }
  const chapterIds = new Map<string, string>(); for (const chapter of corpus.chapters) { const book = corpus.books.find((b) => b.sourceId === chapter.bookSourceId); const bookId = book ? bookIds.get(book.number) : undefined; if (!bookId) throw new Error(`Livre du chapitre ${chapter.sourceId} introuvable`); const id = await one(await client.request('hadith_chapters?on_conflict=book_id,chapter_number', 'POST', { book_id: bookId, chapter_number: chapter.number, name: chapter.name, arabic_name: chapter.arabicName, source_reference: chapter.sourceReference }), `Chapitre ${chapter.sourceId}`); chapterIds.set(chapter.sourceId, id); }
  for (const hadith of corpus.hadiths) { const bookId = bookIds.get(hadith.bookNumber); if (!bookId) throw new Error(`Livre du hadith ${hadith.sourceHadithId} introuvable`); const chapter = hadith.chapterNumber ? corpus.chapters.find((item) => item.number === hadith.chapterNumber) : undefined; const hadithRows = await client.request('hadiths?on_conflict=collection_id,global_number', 'POST', { collection_id: collectionId, book_id: bookId, chapter_id: chapter ? chapterIds.get(chapter.sourceId) ?? null : null, global_number: hadith.globalNumber, hadith_number_in_book: hadith.hadithNumberInBook, arabic_text: hadith.arabicText, narrator: hadith.narrator, chain_text: hadith.chainText, authenticity_grade: hadith.authenticityGrade, source_reference: hadith.sourceReference, source_name: hadith.sourceName, source_url: hadith.sourceUrl, license: hadith.license, verification_status: hadith.verificationStatus, corpus_version: hadith.corpusVersion }); const hadithId = hadithRows[0]?.id; if (typeof hadithId !== 'string') throw new Error(`Hadith ${hadith.sourceHadithId} non retourné`); if (hadith.translation) await client.request('hadith_translations?on_conflict=hadith_id,language_code', 'POST', { hadith_id: hadithId, language_code: 'fr', translation_text: hadith.translation.text, translator: hadith.translation.translator, source_name: hadith.translation.sourceName, source_url: hadith.translation.sourceUrl, license: hadith.translation.license, verification_status: hadith.translation.verificationStatus, corpus_version: hadith.corpusVersion }); if (hadith.explanation) { await deactivate(client, 'hadith_explanations', hadithId, hadith.explanation.sourceName, hadith.explanation.sourceItemId); await client.request('hadith_explanations?on_conflict=hadith_id,language_code,source_name,source_item_id,corpus_version', 'POST', { hadith_id: hadithId, language_code: 'fr', explanation_text: hadith.explanation.text, source_name: hadith.explanation.sourceName, source_url: hadith.explanation.sourceUrl, source_reference: hadith.explanation.sourceReference, source_item_id: hadith.explanation.sourceItemId, license: hadith.explanation.license, corpus_version: hadith.corpusVersion, verification_status: hadith.explanation.verificationStatus, source_hash: hash(stable({ text: hadith.explanation.text, source: hadith.explanation.sourceName })), is_active: true }); } if (hadith.lessons.length) await deactivate(client, 'hadith_lessons', hadithId, hadith.lessons[0].sourceName, hadith.lessons[0].sourceItemId); for (const lesson of hadith.lessons) await client.request('hadith_lessons?on_conflict=hadith_id,language_code,source_name,source_item_id,corpus_version,lesson_order', 'POST', { hadith_id: hadithId, language_code: 'fr', lesson_order: lesson.order, lesson_text: lesson.text, source_name: lesson.sourceName, source_url: lesson.sourceUrl, source_reference: lesson.sourceReference, source_item_id: lesson.sourceItemId, license: lesson.license, corpus_version: hadith.corpusVersion, verification_status: lesson.verificationStatus, source_hash: hash(stable({ text: lesson.text, order: lesson.order, source: lesson.sourceName })), is_active: true }); }
}

function validationContent(value: unknown, version: string, license: string | null): Record<string, unknown> | undefined {
  if (!isRecord(value)) return undefined;
  return { text: value.text, author: value.author ?? value.translator, editor: value.editor, source: value.source ?? value.sourceName, version: value.version ?? version, license: value.license ?? license };
}

export function validateSourceFile(raw: unknown, requestedVersion: string): ValidationReport {
  if (!isRecord(raw) || !Array.isArray(raw.hadiths)) return validateCorpus({ hadiths: undefined });
  const source = isRecord(raw.source) ? raw.source : {};
  const collection = isRecord(raw.collection) ? raw.collection : {};
  const sourceVersion = typeof source.corpusVersion === 'string' && source.corpusVersion.trim() ? source.corpusVersion : requestedVersion;
  const sourceLicense = typeof source.license === 'string' ? source.license : undefined;
  const hadiths = raw.hadiths.map((item): Record<string, unknown> => {
    const row = isRecord(item) ? item : {};
    const book = isRecord(row.book) ? row.book : {};
    const chapter = isRecord(row.chapter) ? row.chapter : {};
    const translation = validationContent(row.translationFrench, sourceVersion, sourceLicense ?? null);
    const explanation = validationContent(row.explanationFrench, sourceVersion, sourceLicense ?? null);
    const lessons = Array.isArray(row.lessonsFrench) ? row.lessonsFrench.map((lesson) => validationContent(lesson, sourceVersion, sourceLicense ?? null)).filter((lesson): lesson is Record<string, unknown> => lesson !== undefined) : undefined;
    return { id: row.sourceHadithId, sourceHadithId: row.sourceHadithId, collectionId: collection.sourceId, bookId: book.sourceId, bookNumber: book.number, bookName: book.titleFrench, chapterId: chapter.sourceId, chapterNumber: chapter.number, chapterTitle: chapter.titleFrench, globalNumber: row.globalNumber, hadithNumberInBook: row.hadithNumberInBook, arabicText: row.arabicText, narrator: row.narrator, chain: row.chainText, authenticity: row.authenticityGrade, source: source.name, sourceReference: row.sourceReference, version: sourceVersion, license: sourceLicense, translation, explanation, lessons };
  });
  return validateCorpus({ hadiths, version: sourceVersion, license: sourceLicense } as ValidationCorpus);
}

function printValidationReport(report: ValidationReport): void {
  console.log(`Validation : total=${report.total}, valides=${report.valid}, avertissements=${report.withWarnings}, erreurs=${report.errors}`);
  console.log(`Doublons=${report.duplicates.length}, trous=${report.gaps.length}, incohérences=${report.inconsistencies.length}`);
  report.issues.forEach((item: ValidationIssue) => console.log(`[${item.level}] ${item.code} ${item.path} — ${item.message}`));
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2)); const filePath = resolve(args.file); const bytes = await readFile(filePath); const raw: unknown = JSON.parse(bytes.toString('utf8')); const validation = validateSourceFile(raw, args.corpusVersion); printValidationReport(validation); if (!validation.canImport) throw new Error('Validation échouée : aucune écriture effectuée'); if (args.validateOnly) return; const corpus = normalize(raw, hash(bytes.toString('utf8')), args.corpusVersion, args.limit); const result = report(corpus, filePath, args.corpusVersion, args.limit); print(corpus, result); if (corpus.errors.length) throw new Error('Validation échouée après normalisation : aucune écriture effectuée'); if (args.dryRun) return; const url = process.env.SUPABASE_URL; const key = process.env.SUPABASE_SERVICE_ROLE_KEY; if (!url || !key) throw new Error('SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont obligatoires hors dry-run'); const rpcReport = await importHadithBatch(url, key, raw, args); console.log('Rapport RPC transactionnel:', JSON.stringify(rpcReport, null, 2));
}
if (typeof require !== 'undefined' && require.main === module) main().catch((error: unknown) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });
