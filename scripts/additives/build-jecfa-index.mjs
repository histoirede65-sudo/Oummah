#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseJecfaIntakeAssessment } from './jecfa-intake-parser.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const BASE = 'https://apps.who.int/food-additives-contaminants-jecfa-database/Home/Chemical';
const CACHE = path.join(ROOT, 'scripts/output/jecfa-source-cache.v1.json');
const OUTPUT = path.join(ROOT, 'scripts/output/jecfa-index.json');
const CATALOG = path.join(ROOT, 'src/features/boycott/data/eu-additive-catalog.json');
const USER_AGENT = 'OUMMAH-official-jecfa-audit/1.0 (read-only)';

function normalize(value) { return String(value ?? '').normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim().replace(/\s+/g, ' '); }
function clean(value) { return String(value ?? '').replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/gi, ' ').replace(/&amp;/gi, '&').replace(/&#39;/gi, "'").replace(/&quot;/gi, '"').replace(/\s+/g, ' ').trim(); }
function arg(name, fallback) { const i = process.argv.indexOf(name); return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : fallback; }
function save(file, value) { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`, 'utf8'); }
function extractBetween(text, start, end) { const a = text.toLowerCase().indexOf(start.toLowerCase()); if (a < 0) return ''; const b = end ? text.toLowerCase().indexOf(end.toLowerCase(), a + start.length) : -1; return text.slice(a + start.length, b >= 0 ? b : a + 600); }

function parsePage(id, html) {
  const text = clean(html);
  const title = clean(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i.exec(html)?.[1] ?? '') || extractBetween(text, 'Evaluations of the Joint', 'Overview').trim();
  if (!title || /privacy legal|evaluations of the joint/i.test(title)) return null;
  const chemicalNames = extractBetween(text, 'Chemical Names', 'Synonyms').trim();
  const synonyms = extractBetween(text, 'Synonyms', 'CAS number').trim();
  const cas = text.match(/\b\d{2,7}-\d{2}-\d\b/)?.[0] ?? null;
  const ins = /\bINS\s+([0-9]{2,4}[a-z]{0,3})\b/i.exec(text)?.[1]?.toUpperCase() ?? null;
  const functionalClass = extractBetween(text, 'Functional Class', 'INS matches').trim();
  const evaluations = [];
  for (const match of text.matchAll(/Evaluation year:\s*(\d{4})([\s\S]*?)(?=Evaluation year:|Previous Years:|$)/gi)) {
    const block = match[2].trim();
    const adiRaw = /ADI:\s*([\s\S]*?)(?=Intake:|Meeting:|Specs Code:|Report:|$)/i.exec(block)?.[1]?.trim() ?? null;
    const status = adiRaw ? (/not limited/i.test(adiRaw) ? 'not_limited' : /not specified/i.test(adiRaw) ? 'not_specified' : /temporary/i.test(adiRaw) ? 'temporary' : /withdrawn/i.test(adiRaw) ? 'withdrawn' : /not evaluated/i.test(adiRaw) ? 'not_evaluated' : null) : null;
    const intakeRaw = /(?:^|\s)Intake:\s*([\s\S]*?)(?=Meeting:|Report:|Tox Monograph:|Specification:|$)/i.exec(block)?.[1]?.trim() ?? null;
    const year = Number(match[1]);
    const sourceUrl = `${BASE}/${id}`;
    evaluations.push({ year, adi: { rawText: adiRaw, status, lower: null, upper: null, unit: null }, comments: null, intake: intakeRaw ? { rawText: intakeRaw, sourceUrl } : null, meeting: /Meeting:\s*([^ ]+)/i.exec(block)?.[1] ?? null, report: /Report:\s*([^T]+?)(?=Tox Monograph:|Specification:|$)/i.exec(block)?.[1]?.trim() ?? null, toxicologyMonograph: /Tox Monograph:\s*([^S]+?)(?=Specification:|$)/i.exec(block)?.[1]?.trim() ?? null, evaluationScope: 'JECFA public evaluation summary' });
  }
  return { chemicalId: String(id), name: title, synonyms: synonyms ? synonyms.split(/\s*;\s*|\s*,\s*/).map((v) => v.trim()).filter(Boolean) : [], chemicalNames: chemicalNames ? chemicalNames.split(/\s*;\s*|\s*,\s*/).map((v) => v.trim()).filter(Boolean) : [], cas, jecfaNumber: null, ins, functionalClasses: functionalClass ? functionalClass.split(/\s+/).filter(Boolean) : [], url: `${BASE}/${id}`, evaluations, latestAssessment: evaluations.at(-1) ?? null };
}

function targetItems(limit = 30) {
  return JSON.parse(fs.readFileSync(CATALOG, 'utf8')).entries.slice(0, limit);
}

async function main() {
  const maxId = Number(arg('--max-id', '7000'));
  const concurrency = Number(arg('--concurrency', '16'));
  const cache = fs.existsSync(CACHE) ? JSON.parse(fs.readFileSync(CACHE, 'utf8')) : {};
  let next = 1; let fetched = 0; let errors = 0;
  async function worker() {
    while (true) {
      const id = next++;
      if (id > maxId) return;
      const key = String(id);
      if (!cache[key]) {
        try {
          const response = await fetch(`${BASE}/${id}`, { headers: { 'User-Agent': USER_AGENT, Accept: 'text/html' }, signal: AbortSignal.timeout(20000) });
          const body = await response.text();
          cache[key] = { status: response.status, body: response.ok ? body : '', fetchedAt: new Date().toISOString() };
          fetched += 1;
        } catch (error) { cache[key] = { status: 'network_error', body: '', error: String(error), fetchedAt: new Date().toISOString() }; errors += 1; }
      }
      if ((id % 100) === 0) console.log(`JECFA pages ${id}/${maxId}`);
    }
  }
  await Promise.all(Array.from({ length: concurrency }, worker));
  const records = Object.entries(cache).map(([id, value]) => value.status === 200 ? parsePage(id, value.body) : null).filter(Boolean);
  const targets = targetItems(Number(arg('--priority-limit', '30')));
  const matched = targets.map((item) => {
    const numeric = item.code.match(/^E(\d{3,4})$/)?.[1] ?? null;
    const variants = [item.names?.en, item.canonicalNameEn, ...(item.aliases ?? [])].map(normalize).filter(Boolean);
    const hits = records.filter((record) => (numeric && record.ins && record.ins.replace(/[^0-9]/g, '') === numeric && !item.code.match(/[A-Z]$/)) || [record.name, ...record.synonyms, ...record.chemicalNames].some((name) => variants.includes(normalize(name))));
    const unique = [...new Map(hits.map((hit) => [hit.chemicalId, hit])).values()];
    const exactNameHits = unique.filter((record) => [record.name, ...record.synonyms, ...record.chemicalNames].some((name) => variants.includes(normalize(name))));
    const validInsHits = unique.filter((record) => numeric && record.ins && record.ins.replace(/[^0-9]/g, '') === numeric && !item.code.match(/[A-Z]$/));
    const confidence = exactNameHits.length === 1 ? 'strong' : unique.length === 1 ? (unique[0].ins && numeric && unique[0].ins.replace(/[^0-9]/g, '') === numeric ? 'exact' : 'strong') : unique.length ? 'possible' : null;
    return { code: item.code, canonicalName: item.names?.en ?? item.code, matches: unique, matchConfidence: confidence, matchingMethods: [...new Set([validInsHits.length ? 'ins_exact' : null, exactNameHits.length === 1 ? 'name_or_synonym_exact' : null].filter(Boolean))] };
  });
  save(CACHE, cache);
  save(OUTPUT, { schemaVersion: '1.0', source: { authority: 'WHO/JECFA', url: 'https://apps.who.int/food-additives-contaminants-jecfa-database/Home', retrievedAt: new Date().toISOString(), method: 'official public Home/Chemical/<id> pages' }, scan: { maxId, fetched, errors, recordsParsed: records.length }, records, priorityLimit: matched.length, priorityBatch: matched });
  console.log(JSON.stringify({ output: OUTPUT, records: records.length, fetched, errors, matches: matched.filter((item) => item.matches.length).length }, null, 2));
}
main().catch((error) => { console.error(error.stack ?? error.message ?? String(error)); process.exitCode = 1; });
