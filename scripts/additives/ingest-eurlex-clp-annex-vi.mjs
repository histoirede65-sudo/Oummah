#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const ZIP = path.join(ROOT, 'scripts/data/clp-annex-vi-2026-07-01-fmx4.zip');
const XML_NAME = 'CL2008R1272EN0310010.0001.xml';
const OUTPUT = path.join(ROOT, 'scripts/data/clp-annex-vi-table3-2026-07-01.json');
const SOURCE_URL = 'https://eur-lex.europa.eu/eli/reg/2008/1272/2026-07-01';

function decode(value) {
  return String(value ?? '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(Number.parseInt(hex, 16))).replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)));
}
function clean(value) { return decode(String(value ?? '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()); }
function values(cell) { return [...cell.matchAll(/<P[^>]*>([\s\S]*?)<\/P>/g)].map((m) => clean(m[1])).filter(Boolean); }
function splitIdentifier(value) { return [...new Set(clean(value).split(/[,;\n]+/).map((item) => item.trim()).filter((item) => /^\d{3}-\d{3}-\d$/.test(item) || /^\d{1,3}-\d{2,3}-\d$/.test(item)))]; }
function splitCas(value) { return [...new Set(clean(value).split(/[,;\n]+/).map((item) => item.trim()).filter((item) => /^\d{2,7}-\d{2}-\d$/.test(item)))]; }
function parseRows(table) {
  return [...table.matchAll(/<ROW\b[^>]*>([\s\S]*?)<\/ROW>/g)].map((rowMatch) => {
    const cells = {};
    for (const cell of rowMatch[1].matchAll(/<CELL\s+COL="(\d+)"[^>]*>([\s\S]*?)<\/CELL>/g)) {
      const column = Number(cell[1]);
      const parts = values(cell[2]);
      cells[column] = parts.length ? parts : [clean(cell[2])];
    }
    return cells;
  });
}

function ingest() {
  if (!fs.existsSync(ZIP)) throw new Error(`Source EUR-Lex absente: ${ZIP}`);
  const xml = execFileSync('tar', ['-xOf', ZIP, XML_NAME], { encoding: 'utf8', maxBuffer: 40 * 1024 * 1024 });
  const tableStart = xml.indexOf('<TBL', xml.indexOf('PART 3: HARMONISED CLASSIFICATION AND LABELLING TABLE'));
  const end = xml.indexOf('</TBL>', tableStart);
  if (tableStart < 0 || end < 0) throw new Error('Annex VI Part 3 Table 3 introuvable dans le Formex EUR-Lex');
  const table = xml.slice(tableStart, end + '</TBL>'.length);
  const rows = parseRows(table).filter((row) => row[1]?.length && row[1][0] !== 'Index No');
  const entries = rows.map((row) => {
    const hazard = row[5] ?? [];
    const statements = row[6] ?? [];
    return {
      indexNumber: row[1]?.join(' ') ?? null,
      chemicalName: row[2]?.join(' ') ?? null,
      ecNumber: splitIdentifier(row[3]?.join(' ') ?? ''),
      casNumber: splitCas(row[4]?.join(' ') ?? ''),
      hazardClassAndCategoryCodes: hazard,
      hazardStatementCodes: statements,
      pictogramSignalWordCodes: row[7] ?? [],
      supplementalHazardStatements: row[8] ?? [],
      specificConcentrationLimits: row[10] ?? [],
      mFactors: row[10]?.filter((item) => /M-factor/i.test(item)) ?? [],
      acuteToxicityEstimates: row[10]?.filter((item) => /ATE/i.test(item)) ?? [],
      notes: row[11] ?? [],
      source: { sourceOrganisation: 'European Union / EUR-Lex', regulation: 'Regulation (EC) No 1272/2008', annex: 'VI', part: '3', table: '3', consolidatedDate: '2026-07-01', sourceUrl: SOURCE_URL, sourceLocation: 'Annex VI / Part 3 / Table 3' },
    };
  }).filter((entry) => entry.indexNumber && entry.chemicalName);
  const sha256 = crypto.createHash('sha256').update(fs.readFileSync(ZIP)).digest('hex');
  const snapshot = { schemaVersion: 'clp-annex-vi-table3-v1', sourceOrganisation: 'European Union / EUR-Lex', sourceTitle: 'Regulation (EC) No 1272/2008 — Annex VI, Part 3, Table 3', sourceUrl: SOURCE_URL, retrievedAt: new Date().toISOString(), regulatoryVersion: '02008R1272-20260701', applicableATPOrRevision: 'consolidated version 2026-07-01', fileFormat: 'EUR-Lex Formex XML extracted from official ZIP', sha256, sourceArchive: 'scripts/data/clp-annex-vi-2026-07-01-fmx4.zip', entries };
  fs.writeFileSync(OUTPUT, `${JSON.stringify(snapshot, null, 2)}\n`, 'utf8');
  console.log(JSON.stringify({ output: path.relative(ROOT, OUTPUT), entries: entries.length, sha256, tableRows: rows.length }, null, 2));
  return snapshot;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) ingest();
export { ingest, parseRows, splitIdentifier, splitCas };
