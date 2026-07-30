import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

type Rule = { sourceName?: unknown; ruleId?: unknown; sourceCategoryId?: unknown; sourceCategoryLabel?: unknown; sourceLanguage?: unknown; normalizedLabel?: unknown; targetStableKeys?: unknown; status?: unknown; confidence?: unknown; rationale?: unknown; validationStatus?: unknown; reviewedBy?: unknown; reviewedAt?: unknown; notes?: unknown };
type Theme = { stableKey?: unknown; children?: unknown };
const STATUSES = new Set(['exact', 'certain', 'ambiguous', 'unmapped']);
const VALIDATION_STATUSES = new Set(['pending', 'validated', 'rejected']);
const text = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0;
const fail = (message: string): never => { throw new Error(`Theme mapping invalid: ${message}`); };

function flattenThemes(value: unknown, output = new Set<string>()): Set<string> {
  if (!Array.isArray(value)) return output;
  for (const theme of value as Theme[]) {
    if (text(theme.stableKey)) output.add(theme.stableKey);
    flattenThemes(theme.children, output);
  }
  return output;
}

function validateRule(rule: Rule, index: number, keys: Set<string>, themeKeys: Set<string>): void {
  const path = `rules[${index}]`;
  if (!text(rule.sourceName) || !text(rule.ruleId)) fail(`${path}.sourceName and ruleId are required`);
  const identity = `${rule.sourceName}\u001f${rule.ruleId}`;
  if (keys.has(identity)) fail(`duplicate rule identity: ${rule.sourceName}/${rule.ruleId}`);
  keys.add(identity);
  if (!STATUSES.has(String(rule.status))) fail(`${path}.status is invalid`);
  if (!VALIDATION_STATUSES.has(String(rule.validationStatus))) fail(`${path}.validationStatus is invalid`);
  if (typeof rule.confidence !== 'number' || !Number.isFinite(rule.confidence) || rule.confidence < 0 || rule.confidence > 1) fail(`${path}.confidence must be between 0 and 1`);
  if (!text(rule.sourceCategoryLabel) && rule.sourceCategoryId == null) fail(`${path} needs a source category id or label`);
  if (!text(rule.sourceLanguage)) fail(`${path}.sourceLanguage is required`);
  if (!text(rule.normalizedLabel)) fail(`${path}.normalizedLabel is required`);
  if (!Array.isArray(rule.targetStableKeys)) fail(`${path}.targetStableKeys must be an array`);
  for (const target of rule.targetStableKeys as unknown[]) if (!text(target) || !themeKeys.has(target)) fail(`${path} references an unknown OUMMAH theme: ${String(target)}`);
  if (rule.reviewedBy !== undefined && rule.reviewedBy !== null && !text(rule.reviewedBy)) fail(`${path}.reviewedBy must be non-empty when present`);
  if (rule.reviewedAt !== undefined && rule.reviewedAt !== null && (typeof rule.reviewedAt !== 'string' || Number.isNaN(Date.parse(rule.reviewedAt)))) fail(`${path}.reviewedAt must be an ISO date when present`);
  if (rule.notes !== undefined && rule.notes !== null && typeof rule.notes !== 'string') fail(`${path}.notes must be text when present`);
}

export async function validateThemeMapping(mappingFile = resolve('scripts/hadith/data/hadeethenc-theme-mapping.json'), catalogFile = resolve('scripts/hadith/data/oummah-themes.catalog.json')): Promise<{ rules: number }> {
  const mapping = JSON.parse(await readFile(mappingFile, 'utf8')) as { mappingVersion?: unknown; rules?: unknown };
  const catalog = JSON.parse(await readFile(catalogFile, 'utf8')) as { themes?: unknown };
  if (!text(mapping.mappingVersion) || !Array.isArray(mapping.rules)) fail('mappingVersion and rules[] are required');
  const keys = new Set<string>(); const themeKeys = flattenThemes(catalog.themes);
  (mapping.rules as Rule[]).forEach((rule, index) => validateRule(rule, index, keys, themeKeys));
  return { rules: (mapping.rules as Rule[]).length };
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(__filename)) {
  validateThemeMapping().then((result) => console.log(JSON.stringify({ status: 'valid', ...result }, null, 2))).catch((error: unknown) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });
}
