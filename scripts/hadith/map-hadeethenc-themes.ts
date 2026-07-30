import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

type Category = { id?: unknown; label?: unknown; name?: unknown } | string;
type RecordItem = { id?: unknown; categories?: unknown; themes?: unknown };
type Rule = { sourceName?: string; ruleId?: string; sourceCategoryId?: string | null; sourceCategoryLabel?: string; sourceLanguage?: string; normalizedLabel?: string; targetStableKeys?: string[]; status?: string; confidence?: number; validationStatus?: string };

const normalize = (value: string): string => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('fr').trim().replace(/\s+/g, ' ');
const categoryParts = (value: Category): { id: string | null; label: string } => typeof value === 'string' ? { id: null, label: value.trim() } : { id: value.id == null ? null : String(value.id), label: String(value.label ?? value.name ?? '').trim() };

async function load(file: string, mappingFile: string, themesFile: string) {
  const sample = JSON.parse(await readFile(file, 'utf8')) as { records?: RecordItem[] };
  const mapping = JSON.parse(await readFile(mappingFile, 'utf8')) as { rules?: Rule[] };
  const catalog = JSON.parse(await readFile(themesFile, 'utf8')) as { themes?: unknown[] };
  const rules = mapping.rules ?? [];
  const records = sample.records ?? [];
  const categories = new Map<string, { id: string | null; label: string }>();
  for (const record of records) for (const raw of [...(Array.isArray(record.categories) ? record.categories : []), ...(Array.isArray(record.themes) ? record.themes : [])] as Category[]) { const part = categoryParts(raw); if (part.label) categories.set(`${part.id ?? ''}\u001f${normalize(part.label)}`, part); }
  const classified = [...categories.values()].map((category) => { const matches = rules.filter((rule) => (category.id != null && rule.sourceCategoryId === category.id) || normalize(rule.sourceCategoryLabel ?? '') === normalize(category.label)); const statuses = matches.map((rule) => rule.status); const status = matches.length === 0 ? 'unmapped' : matches.length > 1 ? 'ambiguous' : statuses[0] ?? 'unmapped'; return { ...category, status, rules: matches.map((rule) => ({ sourceName: rule.sourceName, ruleId: rule.ruleId, targetStableKeys: rule.targetStableKeys ?? [], confidence: rule.confidence ?? 0, validationStatus: rule.validationStatus })) }; });
  const used = new Set(classified.flatMap((item) => item.rules.flatMap((rule) => rule.targetStableKeys)));
  const themeKeys = new Set<string>(); const collect = (items: unknown[]): void => { for (const item of items as { stableKey?: unknown; children?: unknown[] }[]) { if (typeof item.stableKey === 'string') themeKeys.add(item.stableKey); if (Array.isArray(item.children)) collect(item.children); } }; collect(catalog.themes ?? []);
  return { sourceName: 'HadeethEnc', records: records.length, uniqueCategories: classified.length, exact: classified.filter((x) => x.status === 'exact'), certain: classified.filter((x) => x.status === 'certain'), ambiguous: classified.filter((x) => x.status === 'ambiguous'), unmapped: classified.filter((x) => x.status === 'unmapped'), unusedOummahThemes: [...themeKeys].filter((key) => !used.has(key)), conflicts: rules.filter((rule, index) => rules.some((other, otherIndex) => otherIndex !== index && other.sourceName === rule.sourceName && other.sourceCategoryId === rule.sourceCategoryId && other.sourceCategoryId != null && JSON.stringify(other.targetStableKeys) !== JSON.stringify(rule.targetStableKeys))) };
}

const args = new Map(process.argv.slice(2).filter((arg) => arg.startsWith('--')).map((arg) => { const [key, ...rest] = arg.slice(2).split('='); return [key, rest.join('=')]; }));
const file = resolve(args.get('file') ?? 'scripts/hadith/data/hadeethenc-theme-pilot.sample.json'); const mapping = resolve(args.get('mapping') ?? 'scripts/hadith/data/hadeethenc-theme-mapping.json'); const themes = resolve(args.get('themes') ?? 'scripts/hadith/data/oummah-themes.catalog.json');
load(file, mapping, themes).then((report) => console.log(JSON.stringify(report, null, 2))).catch((error: unknown) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });
