#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadCurrentEngine } from './audit-additive-risk-engine.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const OUTPUT = path.join(ROOT, 'scripts/output/additive-risk-matrix-coverage-v1.json');
const save = (file, value) => fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`, 'utf8');

const engine = await loadCurrentEngine();
const combinations = engine.getRiskMatrixCoverage();
const report = {
  schemaVersion: '1.0',
  generatedAt: new Date().toISOString(),
  dimensions: { hazard: 5, evidence: 4, exposure: 5 },
  totalCombinations: combinations.length,
  explicitlyDecided: combinations.length,
  intentionalInsufficientData: combinations.filter((item) => item.riskLevel === 'insufficient_data').length,
  combinations,
};
save(OUTPUT, report);
console.log(JSON.stringify({ output: path.relative(ROOT, OUTPUT), totalCombinations: report.totalCombinations, explicitlyDecided: report.explicitlyDecided, intentionalInsufficientData: report.intentionalInsufficientData }, null, 2));
