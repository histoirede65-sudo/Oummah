#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const DEFAULT_INPUT = path.join(ROOT, 'scripts/output/scientific-profile-priority.json');
const DEFAULT_OUTPUT = path.join(ROOT, 'scripts/output/additive-science-source-audit-01-v2.json');
const CACHE_PATH = path.join(ROOT, 'scripts/output/additive-science-source-cache.v2.json');
const USER_AGENT = 'OUMMAH-official-additive-science-audit/2.0 (read-only)';

export const EFSA_DISCOVERY_SOURCES = [
  { category: 'food-colours', url: 'https://www.efsa.europa.eu/en/topics/topic/food-colours', scope: 'food_additive_human' },
];

const OTHER_DISCOVERY_SOURCES = [
  { authority: 'JECFA', url: 'https://apps.who.int/food-additives-contaminants-jecfa-database/Home' },
  { authority: 'JECFA specifications', url: 'https://www.fao.org/food/food-safety-quality/scientific-advice/jecfa/jecfa-additives/en/' },
  { authority: 'ANSES', url: 'https://www.anses.fr/en/search' },
  { authority: 'ECHA', url: 'https://echa.europa.eu/search-for-chemicals' },
  { authority: 'CIRC/IARC', url: 'https://www.iarc.who.int/search/' },
];

function argValue(name, fallback) { const index = process.argv.indexOf(name); return index >= 0 && process.argv[index + 1] ? process.argv[index + 1] : fallback; }
function clean(value) { return String(value ?? '').replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/gi, ' ').replace(/&amp;/gi, '&').replace(/&#39;/gi, "'").replace(/\s+/g, ' ').trim(); }
function unique(values) { return [...new Set(values.filter(Boolean))]; }
function normalizeCode(value) { const match = String(value ?? '').trim().toUpperCase().match(/^E\s?(\d{3,4}[A-Z]?)$/); return match ? `E${match[1]}` : null; }
function yearFrom(text) { return String(text).match(/\b(?:19|20)\d{2}\b/)?.[0] ?? null; }
function isHttp(status) { return typeof status === 'number' && status >= 200 && status < 400; }
function stripTags(value) { return clean(value); }

function loadJson(filePath, fallback) { return fs.existsSync(filePath) ? JSON.parse(fs.readFileSync(filePath, 'utf8')) : fallback; }
function saveJson(filePath, value) { fs.mkdirSync(path.dirname(filePath), { recursive: true }); fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8'); }

async function get(url, cache) {
  if (cache[url]?.body) return cache[url];
  const fetchedAt = new Date().toISOString();
  try {
    const response = await fetch(url, { headers: { Accept: 'text/html,application/xhtml+xml', 'User-Agent': USER_AGENT }, redirect: 'follow' });
    const body = await response.text();
    const record = { sourceUrl: url, fetchedAt, status: response.status, contentType: response.headers.get('content-type'), body, excerpt: clean(body).slice(0, 2000) };
    cache[url] = record;
    return record;
  } catch (error) {
    const record = { sourceUrl: url, fetchedAt, status: 'network_error', error: error instanceof Error ? error.message : String(error), body: '' };
    cache[url] = record;
    return record;
  }
}

function parseEfsaFoodColours(html) {
  const rows = [];
  const rowPattern = /<tr\b[^>]*>\s*<td\b[^>]*>\s*(E\s*\d{3,4}[A-Z]?)\s*<\/td>\s*<td\b[^>]*>([\s\S]*?)<\/td>\s*<td\b[^>]*>([\s\S]*?)<\/td>\s*<\/tr>/gi;
  for (const match of html.matchAll(rowPattern)) {
    const code = normalizeCode(match[1]);
    const name = clean(match[2]);
    if (!code || !name) continue;
    const assessments = [];
    const linkPattern = /<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
    for (const link of match[3].matchAll(linkPattern)) {
      const url = new URL(link[1], 'https://www.efsa.europa.eu').toString();
      const label = clean(link[2]);
      const status = /re-?evaluation/i.test(label) ? 're-evaluation' : /follow-?up/i.test(label) ? 'follow-up' : /exposure/i.test(label) ? 'exposure_refinement' : /extension/i.test(label) ? 'extension_of_use' : 'other';
      assessments.push({ url, label, status, publicationYear: yearFrom(label) });
    }
    rows.push({ code, name, assessments });
  }
  return rows;
}

function extractMeta(html, name) {
  const pattern = new RegExp(`<meta\\b[^>]*(?:name|property)=["']${name}["'][^>]*content=["']([\\s\\S]*?)["'][^>]*>`, 'i');
  return pattern.exec(html)?.[1] ? clean(pattern.exec(html)[1]) : null;
}

function extractEfsaAssessment(html, item, row, assessment) {
  const title = extractMeta(html, 'citation_title') || /<title[^>]*>([\s\S]*?)<\/title>/i.exec(html)?.[1] || assessment.label;
  const abstract = extractMeta(html, 'citation_abstract') || /<(?:div|section)[^>]*(?:abstract|article-abstract)[^>]*>([\s\S]*?)<\/(?:div|section)>/i.exec(html)?.[1] || '';
  const sourceText = clean(`${title} ${abstract}`);
  const sameCode = new RegExp(`\\b${item.code.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(sourceText) || sourceText.includes(item.code.slice(1));
  const sameName = sourceText.toLowerCase().includes(String(row.name).toLowerCase()) || String(item.names?.en ?? '').toLowerCase() === String(row.name).toLowerCase();
  const matchConfidence = sameCode && sameName ? 'exact' : sameName || sameCode ? 'strong' : 'possible';
  const sentences = abstract.split(/(?<=[.!?])\s+/).map((sentence) => sentence.trim()).filter(Boolean);
  const conclusion = sentences.filter((sentence) => /conclu|safe|ADI|acceptable daily intake/i.test(sentence)).slice(0, 5).join(' ') || null;
  const exposure = sentences.filter((sentence) => /exposure|intake|consumption|estimated/i.test(sentence)).slice(0, 5).join(' ') || null;
  const adiText = sentences.find((sentence) => /ADI|acceptable daily intake/i.test(sentence)) || null;
  return {
    authority: 'EFSA', documentTitle: clean(title), publicationYear: yearFrom(`${title} ${abstract}`) || assessment.publicationYear,
    url: assessment.url, doi: assessment.url.match(/10\.2903\/j\.efsa\.[^/?#"']+/i)?.[0] ?? null,
    additiveCode: item.code, matchedName: row.name, matchConfidence, assessmentStatus: assessment.status,
    assessmentScope: 'food_additive_human', coveredCodes: [item.code], assessmentType: 'individualAssessment',
    authorityConclusion: conclusion, adi: adiText ? { type: 'ADI', rawText: adiText, value: null, unit: null, authority: 'EFSA', year: yearFrom(adiText) } : null,
    tdi: null, otherReferenceValues: [], identifiedEffects: [], exposureFindings: exposure, populationsOfConcern: [], restrictionsOrRecommendations: [],
    uncertaintyNotes: abstract ? [] : ['Abstract not accessible; metadata only.'], sourceExcerpt: abstract.slice(0, 4000),
  };
}

function assessFamily(rows) {
  const grouped = new Map();
  for (const row of rows) {
    const key = row.name.toLowerCase().replace(/\b(?:plain|caustic|ammonia|sulphite)\b/g, '').replace(/\s+/g, ' ').trim();
    if (key.length > 8) grouped.set(key, [...(grouped.get(key) ?? []), row.code]);
  }
  const byNumericCode = new Map();
  for (const row of rows) {
    const numericRoot = row.code.match(/^E(\d{3,4})[A-Z]$/)?.[1];
    if (numericRoot) byNumericCode.set(numericRoot, [...(byNumericCode.get(numericRoot) ?? []), row.code]);
  }
  for (const codes of byNumericCode.values()) if (codes.length > 1) grouped.set(`numeric-family:${codes[0].replace(/^E/, '').replace(/[A-Z]$/, '')}`, codes);
  return [...grouped.values()].filter((codes) => codes.length > 1);
}

function emptyJecfa(item, status) {
  return { found: false, authority: 'JECFA', matchedName: null, assessmentFound: false, adiFound: false, status, query: `${item.code} ${item.names?.en ?? ''}` };
}

async function main() {
  const inputPath = path.resolve(argValue('--input', DEFAULT_INPUT));
  const outputPath = path.resolve(argValue('--output', DEFAULT_OUTPUT));
  const limit = Number(argValue('--limit', '30'));
  const input = loadJson(inputPath, null);
  if (!input?.entries || !Array.isArray(input.entries)) throw new Error(`Invalid priority input: ${inputPath}`);
  if (!Number.isInteger(limit) || limit < 1) throw new Error('--limit must be a positive integer');
  const items = input.entries.slice(0, limit);
  const cache = loadJson(CACHE_PATH, {});

  const efsaDiscovery = [];
  for (const source of EFSA_DISCOVERY_SOURCES) {
    const response = await get(source.url, cache);
    efsaDiscovery.push({ ...source, status: response.status, rows: isHttp(response.status) ? parseEfsaFoodColours(response.body) : [], discoveryState: isHttp(response.status) ? 'retrieved' : 'blocked_or_unavailable' });
  }

  const familyGroups = assessFamily(efsaDiscovery.flatMap((source) => source.rows));
  const results = [];
  for (const item of items) {
    const efsaRows = efsaDiscovery.flatMap((source) => source.rows.filter((row) => row.code === item.code));
    const assessments = [];
    const assessmentLinks = [];
    const assessmentFetchFailures = [];
    const discoveryPages = [];
    for (const source of efsaDiscovery) {
      if (source.rows.some((row) => row.code === item.code)) discoveryPages.push(source.url);
    }
    for (const row of efsaRows) {
      for (const assessment of row.assessments) {
        assessmentLinks.push(assessment);
        const response = await get(assessment.url, cache);
        if (isHttp(response.status)) assessments.push(extractEfsaAssessment(response.body, item, row, assessment));
        else assessmentFetchFailures.push({ url: assessment.url, status: response.status });
      }
    }
    const coveredFamily = familyGroups.find((codes) => codes.includes(item.code));
    if (coveredFamily) for (const assessment of assessments) { assessment.assessmentScope = 'family'; assessment.assessmentType = 'familyAssessment'; assessment.coveredCodes = coveredFamily; }
    const exactOrStrong = assessments.filter((assessment) => ['exact', 'strong'].includes(assessment.matchConfidence));
    const bestMatchConfidence = assessments.some((assessment) => assessment.matchConfidence === 'exact') ? 'exact' : assessments.some((assessment) => assessment.matchConfidence === 'strong') ? 'strong' : assessments.length ? 'possible' : null;
    const jecfaPage = await get(OTHER_DISCOVERY_SOURCES[0].url, cache);
    results.push({
      code: item.code, canonicalName: item.names?.en ?? item.names?.fr ?? item.code,
      efsaDiscovery: { found: efsaRows.length > 0, discoveryPage: discoveryPages[0] ?? EFSA_DISCOVERY_SOURCES[0].url, assessmentLinksFound: assessmentLinks.length, assessmentFetchFailures, assessmentsFound: assessments.length, assessments, latestAssessment: exactOrStrong.sort((a, b) => String(b.publicationYear ?? '').localeCompare(String(a.publicationYear ?? '')))[0] ?? null },
      jecfaDiscovery: emptyJecfa(item, jecfaPage.status), otherOfficialSources: OTHER_DISCOVERY_SOURCES.slice(1).map((source) => ({ authority: source.authority, url: source.url, status: cache[source.url]?.status ?? null })),
      bestMatchConfidence, automatable: exactOrStrong.length > 0 && exactOrStrong.some((assessment) => assessment.assessmentScope === 'food_additive_human'),
      reasonIfNotAutomatable: exactOrStrong.length ? null : efsaRows.length ? 'Official discovery row found, but linked assessment was not accessible or not a strong match.' : 'No official individual or family assessment was discovered for this code.',
    });
  }

  const allAssessments = results.flatMap((result) => result.efsaDiscovery.assessmentsFound ? result.efsaDiscovery.assessments : []);
  const count = (predicate) => results.filter(predicate).length;
  const report = {
    schemaVersion: '2.0', generatedAt: new Date().toISOString(), input: { totalRequested: items.length, codes: items.map((item) => item.code) },
    discoverySources: EFSA_DISCOVERY_SOURCES, otherOfficialSources: OTHER_DISCOVERY_SOURCES,
    totals: {
      totalCodes: items.length, codesWithEfsaSource: count((r) => r.efsaDiscovery.found), codesWithEfsaAssessmentLink: count((r) => r.efsaDiscovery.assessmentLinksFound > 0), codesWithAssessmentUnavailable: count((r) => r.efsaDiscovery.assessmentLinksFound > 0 && r.efsaDiscovery.assessmentsFound === 0), codesWithJecfaSource: count((r) => r.jecfaDiscovery.found),
      codesWithOtherOfficialSource: count((r) => r.otherOfficialSources.some((s) => isHttp(s.status))), codesWithExactMatch: count((r) => r.bestMatchConfidence === 'exact'),
      codesWithStrongMatch: count((r) => r.bestMatchConfidence === 'strong'), codesWithPossibleOnly: count((r) => r.bestMatchConfidence === 'possible'),
      codesWithNoOfficialDiscoveryData: count((r) => !r.efsaDiscovery.found && !r.jecfaDiscovery.found), codesWithAmbiguousMatch: count((r) => r.bestMatchConfidence === 'possible'), codesWithNoOfficialMatch: count((r) => !r.bestMatchConfidence && !r.efsaDiscovery.found && !r.jecfaDiscovery.found), codesWithADI: count((r) => r.efsaDiscovery.assessments.some((a) => a.adi !== null)),
      codesWithExposureAssessment: count((r) => r.efsaDiscovery.assessments.some((a) => a.exposureFindings)), codesWithEffects: count((r) => r.efsaDiscovery.assessments.some((a) => a.identifiedEffects.length)),
      codesWithAuthorityConclusion: count((r) => r.efsaDiscovery.assessments.some((a) => a.authorityConclusion)), documentsFoundTotal: allAssessments.length,
      profilesAutomatable: count((r) => r.automatable), feedCasesRejected: 0, familyAssessments: allAssessments.filter((a) => a.assessmentScope === 'family').length, familyCandidateGroups: familyGroups,
    },
    previousAudit: { efsa: 0, jecfa: 0, exact: 0, strong: 0, automatable: 0 },
    items: results,
    cache: { path: path.relative(ROOT, CACHE_PATH), entries: Object.keys(cache).length },
    interpretation: 'Discovery and explicit-source extraction only. No evaluateAdditiveRisk, OUMMAH classification, colour, health score or Supabase write was performed.',
  };
  saveJson(CACHE_PATH, cache);
  saveJson(outputPath, report);
  console.log(JSON.stringify({ output: outputPath, cache: CACHE_PATH, totalCodes: items.length, totals: report.totals }, null, 2));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main().catch((error) => { console.error(error instanceof Error ? error.message : String(error)); process.exitCode = 1; });
