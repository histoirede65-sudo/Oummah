#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { extractExplicitExposureStatements } from './efsa-exposure-patterns.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const SOURCE_AUDIT = path.join(ROOT, 'scripts/output/additive-science-source-audit-priority-321-v3.json');
const LEGACY = path.join(ROOT, 'scripts/data/additives-scientific-batch-02.json');
const INDEX_OUT = path.join(ROOT, 'scripts/output/efsa-public-assessment-index-v1.json');
const AUDIT_OUT = path.join(ROOT, 'scripts/output/efsa-exposure-extraction-audit-v1.json');
const DEFAULT_TIMEOUT = 20000;

const readJson = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));
const unique = (values) => [...new Set(values.filter(Boolean))];
const normalizeCode = (value) => String(value ?? '').toUpperCase().replace(/\s+/g, '');
const assessmentKey = (item) => item.efsaOutputId || item.doi || item.publicEfsaUrl || item.sourceUrl || null;
const clean = (value) => String(value ?? '').replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/gi, ' ').replace(/&amp;/gi, '&').replace(/&quot;/gi, '"').replace(/&#39;/gi, "'").replace(/\s+/g, ' ').trim();
const decode = (value) => clean(value).replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)));

function arg(name, fallback) { const index = process.argv.indexOf(name); return index >= 0 && process.argv[index + 1] ? process.argv[index + 1] : fallback; }

function doiPublicationId(doi) {
  return String(doi ?? '').match(/10\.2903\/j\.efsa\.(?:\d{4}\.)?(\d+)$/i)?.[1] ?? null;
}

function collectAssessments() {
  const source = readJson(SOURCE_AUDIT);
  const byKey = new Map();
  for (const item of source.items ?? []) {
    for (const reference of item.efsa?.assessmentReferences ?? []) {
      const doi = reference.doi ?? String(reference.url ?? '').match(/10\.2903\/j\.efsa\.[^/?#"']+/i)?.[0] ?? null;
      const key = reference.efsaOutputId || doi || reference.url;
      if (!key) continue;
      const current = byKey.get(key) ?? { efsaOutputId: reference.efsaOutputId ?? null, doi, title: reference.title ?? null, publicationYear: reference.year ? Number(reference.year) : null, additiveCodes: [] };
      current.title ||= reference.title ?? null;
      current.doi ||= doi;
      current.publicationYear ||= reference.year ? Number(reference.year) : null;
      current.additiveCodes.push(normalizeCode(item.code));
      byKey.set(key, current);
    }
  }
  try {
    const legacy = readJson(LEGACY);
    const walk = (value, code) => {
      if (typeof value === 'string' && /https?:\/\/www\.efsa\.europa\.eu\/(?:[a-z]{2}\/)?plain-language-summary\//i.test(value)) {
        const key = value;
        const current = byKey.get(key) ?? { efsaOutputId: null, doi: null, title: null, publicationYear: null, additiveCodes: [] };
        current.plainLanguageSummaryUrls = unique([...(current.plainLanguageSummaryUrls ?? []), value]);
        current.additiveCodes.push(normalizeCode(code));
        byKey.set(key, current);
      } else if (Array.isArray(value)) value.forEach((item) => walk(item, code));
      else if (value && typeof value === 'object') Object.values(value).forEach((item) => walk(item, code));
    };
    for (const profile of Array.isArray(legacy) ? legacy : legacy.profiles ?? []) walk(profile, profile.code);
  } catch {}
  return [...byKey.values()].map((item) => ({ ...item, additiveCodes: unique(item.additiveCodes) }));
}

function publicUrlForAssessment(item) {
  const id = doiPublicationId(item.doi);
  return id ? `https://www.efsa.europa.eu/en/efsajournal/pub/${id}` : item.plainLanguageSummaryUrls?.[0] ?? null;
}

function extractMeta(html, names) {
  for (const name of names) {
    const pattern = new RegExp(`<meta[^>]+(?:name|property)=["']${name}["'][^>]+content=["']([^"']*)["']`, 'i');
    const reverse = new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]+(?:name|property)=["']${name}["']`, 'i');
    const match = pattern.exec(html) ?? reverse.exec(html);
    if (match?.[1]) return decode(match[1]);
  }
  return null;
}

function extractAbstract(html) {
  const labelled = html.match(/(?:abstract|summary)[^>]*>[\s\S]{0,500}?<[^>]*>([\s\S]{100,12000}?)<\/[^>]+>/i);
  return decode(labelled?.[1] ?? extractMeta(html, ['description', 'og:description']) ?? '');
}

function extractMainText(html) {
  const main = html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i)?.[1] ?? html;
  return decode(main);
}

function extractTitle(html) { return extractMeta(html, ['og:title', 'twitter:title']) ?? decode(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? ''); }

function extractCodes(text, fallback) {
  const codes = [...String(text ?? '').matchAll(/\bE\s*(\d{3}[A-Z]?)\b/gi)].map((match) => normalizeCode(`E${match[1]}`));
  return unique([...fallback, ...codes]);
}

function normalizedExposureAssessment(statement, record) {
  const comparisonStatus = statement.normalizedMeaning === 'below_reference' ? 'below_reference'
    : statement.normalizedMeaning === 'confirmed_exceedance' ? 'confirmed_exceedance'
      : statement.normalizedMeaning === 'possible_exceedance' ? 'possible_exceedance' : 'not_quantified';
  const authorityConclusion = statement.normalizedMeaning === 'no_safety_concern_at_assessed_exposure' ? 'no_safety_concern_at_assessed_exposure'
    : statement.normalizedMeaning === 'additional_data_required' ? 'additional_data_required'
      : statement.normalizedMeaning === 'unable_to_conclude' ? 'unable_to_conclude' : 'no_explicit_conclusion';
  return { authority: 'EFSA', assessmentId: record.efsaOutputId || record.doi || record.publicEfsaUrl, year: record.publicationYear, sourceUrl: record.publicEfsaUrl, scope: record.assessmentScope, coveredCodes: record.additiveCodes, comparisonStatus, authorityConclusion, sourceSentence: statement.sourceSentence, sourceSection: record.sourceType === 'plain_language_summary' ? 'plain_language_summary' : 'abstract' };
}

async function fetchOfficial(url) {
  if (!url) return { pageAvailable: false, failure: 'no_public_efsa_url' };
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT);
  try {
    const response = await fetch(url, { redirect: 'manual', signal: controller.signal, headers: { accept: 'text/html,application/xhtml+xml' } });
    const location = response.headers.get('location');
    if (response.status >= 300 && response.status < 400) return { pageAvailable: false, failure: 'redirect_not_accepted', redirectLocation: location };
    if (!response.ok) return { pageAvailable: false, failure: `http_${response.status}` };
    const finalHost = new URL(response.url).hostname.toLowerCase();
    if (!finalHost.endsWith('efsa.europa.eu')) return { pageAvailable: false, failure: 'non_efsa_host' };
    return { pageAvailable: true, html: await response.text(), finalUrl: response.url };
  } catch (error) {
    return { pageAvailable: false, failure: error?.name === 'AbortError' ? 'timeout' : String(error?.message ?? error) };
  } finally { clearTimeout(timer); }
}

function makeAssessment(item, page) {
  if (!page.pageAvailable) return { ...item, publicEfsaUrl: publicUrlForAssessment(item), pageAvailable: false, failure: page.failure, redirectLocation: page.redirectLocation ?? null, abstractText: null, plainLanguageSummaryText: null, assessmentScope: item.additiveCodes.length > 1 ? 'family' : 'individual', additiveCodes: item.additiveCodes };
  const abstractText = extractAbstract(page.html);
  const pageText = extractMainText(page.html);
  const title = extractTitle(page.html) || item.title;
  const statements = extractExplicitExposureStatements(abstractText);
  const isPlainLanguageSummary = !item.doi && Boolean(item.plainLanguageSummaryUrls?.length);
  const documentText = isPlainLanguageSummary ? pageText : (abstractText || pageText);
  const documentStatements = extractExplicitExposureStatements(documentText);
  const record = { ...item, sourceType: isPlainLanguageSummary ? 'plain_language_summary' : 'scientific_opinion', title, publicEfsaUrl: page.finalUrl, pageAvailable: true, abstractText: isPlainLanguageSummary ? null : (abstractText || null), plainLanguageSummaryText: isPlainLanguageSummary ? (pageText || null) : null, assessmentScope: extractCodes(title, item.additiveCodes).length > 1 ? 'family' : 'individual', additiveCodes: extractCodes(title, item.additiveCodes), explicitExposureStatements: documentStatements.recognized, unmatchedExplicitStatements: documentStatements.unmatched };
  record.authorityExposureAssessments = documentStatements.recognized.map((statement) => normalizedExposureAssessment(statement, record));
  return record;
}

function reextractExistingRecord(record) {
  const text = record.sourceType === 'plain_language_summary' ? record.plainLanguageSummaryText : record.abstractText;
  const statements = extractExplicitExposureStatements(text ?? '');
  const refreshed = { ...record, explicitExposureStatements: statements.recognized, unmatchedExplicitStatements: statements.unmatched };
  refreshed.authorityExposureAssessments = statements.recognized.map((statement) => normalizedExposureAssessment(statement, refreshed));
  return refreshed;
}

async function main() {
  const limit = Number(arg('--limit', '0')) || 0;
  const assessments = collectAssessments();
  const selected = limit > 0 ? assessments.slice(0, limit) : assessments;
  const existingIndexPath = path.join(ROOT, 'scripts/output/efsa-public-assessment-index-v1.json');
  const records = process.argv.includes('--reuse-existing') && fs.existsSync(existingIndexPath)
    ? (readJson(existingIndexPath).records ?? []).map(reextractExistingRecord)
    : [];
  if (!records.length) for (const item of selected) {
    const page = await fetchOfficial(publicUrlForAssessment(item));
    records.push(makeAssessment(item, page));
  }
  const recognized = records.flatMap((record) => (record.explicitExposureStatements ?? []).map((statement) => ({ ...statement, sourceUrl: record.publicEfsaUrl, efsaOutputId: record.efsaOutputId, doi: record.doi, year: record.publicationYear, additiveCodes: record.additiveCodes, scope: record.assessmentScope, sourceSection: 'abstract' })));
  const valid = recognized.filter((item) => item.sourceUrl && item.sourceSentence);
  const byMeaning = (meaning) => valid.filter((item) => item.normalizedMeaning === meaning);
  const enrichedCodes = unique(valid.flatMap((item) => item.additiveCodes));
  const pageFailures = Object.fromEntries([...new Set(records.map((record) => record.failure).filter(Boolean))].map((failure) => [failure, records.filter((record) => record.failure === failure).length]));
  const report = { schemaVersion: '1.0', generatedAt: new Date().toISOString(), source: 'EFSA official public pages only; Wiley redirects rejected; no DietEx calculation and no NLP interpretation.', totalEfsaAssessmentsKnown: assessments.length, publicEfsaPagesResolved: records.filter((item) => item.pageAvailable).length, pagesWithAbstract: records.filter((item) => item.abstractText).length, pagesWithPlainLanguageSummary: records.filter((item) => item.plainLanguageSummaryText).length, pageResolutionFailures: pageFailures, assessmentsWithExplicitExposureStatement: unique(valid.map(assessmentKey)).length, assessmentsWithNoConcernConclusion: unique(byMeaning('no_safety_concern_at_assessed_exposure').map(assessmentKey)).length, assessmentsWithExceedance: unique([...byMeaning('possible_exceedance'), ...byMeaning('confirmed_exceedance')].map(assessmentKey)).length, assessmentsWithPopulationSpecificConcern: unique(valid.filter((item) => /\b(?:children|infants|toddlers|adolescents|pregnant|elderly|high consumers)\b/i.test(item.sourceSentence)).map(assessmentKey)).length, assessmentsUnableToConclude: unique([...byMeaning('unable_to_conclude'), ...byMeaning('additional_data_required')].map(assessmentKey)).length, uniqueAdditiveCodesEnriched: enrichedCodes.length, familyAssessmentsEnriched: unique(valid.filter((item) => item.scope === 'family').map(assessmentKey)).length, unmatchedExplicitStatements: records.flatMap((record) => (record.unmatchedExplicitStatements ?? []).map((sentence) => ({ sourceUrl: record.publicEfsaUrl, sentence }))), ambiguousStatements: [], sourceSentenceRule: 'Every accepted normalized conclusion has sourceUrl and sourceSentence; otherwise it is rejected.', spotChecks: ['E150D', 'E338', 'E621', 'E951', 'E955', 'E202', 'E330', 'E407', 'E471', 'E250'].map((code) => { const matches = records.filter((record) => record.additiveCodes.includes(code)); return { code, pageFound: matches.some((record) => record.pageAvailable), abstractFound: matches.some((record) => Boolean(record.abstractText)), explicitExposureFound: matches.some((record) => (record.explicitExposureStatements ?? []).length > 0), conclusions: matches.flatMap((record) => record.explicitExposureStatements ?? []), scenariosOrPopulations: matches.flatMap((record) => (record.explicitExposureStatements ?? []).filter((statement) => /\b(?:children|infants|toddlers|adolescents|pregnant|elderly|high consumers|mean|percentile|maximum|refined|brand-loyal)\b/i.test(statement.sourceSentence)).map((statement) => statement.sourceSentence)) }; }), records, validation: { evaluateAdditiveRiskModified: false, profilesModified: false, supabaseUpsertPerformed: false, uiModified: false } };
  fs.writeFileSync(INDEX_OUT, `${JSON.stringify({ schemaVersion: '1.0', generatedAt: new Date().toISOString(), authority: 'EFSA', sourcePolicy: 'official EFSA host only; no Wiley dependency', records }, null, 2)}\n`);
  fs.writeFileSync(AUDIT_OUT, `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify({ index: path.relative(ROOT, INDEX_OUT), audit: path.relative(ROOT, AUDIT_OUT), totalEfsaAssessmentsKnown: assessments.length, processed: records.length, publicEfsaPagesResolved: report.publicEfsaPagesResolved }, null, 2));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main().catch((error) => { console.error(error.stack ?? error.message); process.exitCode = 1; });
