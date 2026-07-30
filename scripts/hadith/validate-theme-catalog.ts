import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

type Translation = { name?: unknown; description?: unknown };
type Theme = { stableKey?: unknown; slug?: unknown; parentStableKey?: unknown; status?: unknown; version?: unknown; sortOrder?: unknown; visualKey?: unknown; learningPriority?: unknown; translations?: unknown; children?: unknown };
type Catalog = { catalogVersion?: unknown; language?: unknown; themes?: unknown };

const ALLOWED_STATUS = new Set(['Importée','Validée','Juridiquement validée','Disponible en développement','Disponible en bêta','Disponible en production','Suspendue','Retirée','Archivée','Rejetée']);
const SOURCE_LIKE = /https?:\/\/|www\.|[«»"“”]|\b(d['’]après|rapporté|a dit|source|référence|citation)\b/i;
const text = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0;
const fail = (message: string): never => { throw new Error(`Theme catalog invalid: ${message}`); };

function validateTranslation(theme: Theme, path: string): void {
  if (!theme.translations || typeof theme.translations !== 'object' || Array.isArray(theme.translations)) fail(`${path}.translations must be an object`);
  const fr = (theme.translations as Record<string, unknown>).fr;
  if (!fr || typeof fr !== 'object' || Array.isArray(fr)) fail(`${path}.translations.fr is required`);
  const translation = fr as Translation;
  if (!text(translation.name)) fail(`${path}.translations.fr.name is required`);
  if (translation.description !== undefined && translation.description !== null && !text(translation.description)) fail(`${path}.translations.fr.description must be non-empty when present`);
  if (typeof translation.description === 'string' && SOURCE_LIKE.test(translation.description)) fail(`${path}.translations.fr.description looks like source content`);
}

function flatten(roots: Theme[]): Theme[] {
  const result: Theme[] = [];
  const visit = (theme: Theme, parent: string | null, inherited: Theme | null, path: string): void => {
    const copy: Theme = { ...theme, parentStableKey: parent, status: theme.status ?? inherited?.status, version: theme.version ?? inherited?.version };
    delete copy.children; result.push(copy);
    if (theme.children !== undefined && !Array.isArray(theme.children)) fail(`${path}.children must be an array`);
    (theme.children as Theme[] | undefined ?? []).forEach((child, index) => visit(child, text(theme.stableKey) ? theme.stableKey : null, theme, `${path}.children[${index}]`));
  };
  roots.forEach((theme, index) => visit(theme, null, null, `themes[${index}]`));
  return result;
}

function validateTheme(theme: Theme, index: number, keys: Set<string>, slugs: Set<string>): void {
  const path = `themes[${index}]`;
  if (!text(theme.stableKey) || !text(theme.slug)) fail(`${path}.stableKey and slug are required`);
  const stableKey = String(theme.stableKey); const slug = String(theme.slug);
  if (keys.has(stableKey)) fail(`duplicate stableKey: ${stableKey}`);
  if (slugs.has(slug)) fail(`duplicate slug: ${slug}`);
  keys.add(stableKey); slugs.add(slug);
  if (!ALLOWED_STATUS.has(String(theme.status))) fail(`${path}.status is not allowed`);
  if (!text(theme.version)) fail(`${path}.version is required`);
  if (typeof theme.sortOrder !== 'number' || !Number.isInteger(theme.sortOrder) || theme.sortOrder < 0) fail(`${path}.sortOrder must be a non-negative integer`);
  if (theme.parentStableKey !== null && (!text(theme.parentStableKey) || !stableKey.startsWith(`${theme.parentStableKey}.`))) fail(`${path}.stableKey is inconsistent with its parent`);
  if (theme.learningPriority !== undefined && theme.learningPriority !== null && (typeof theme.learningPriority !== 'number' || !Number.isFinite(theme.learningPriority))) fail(`${path}.learningPriority must be numeric when present`);
  validateTranslation(theme, path);
}

function validateHierarchy(themes: Theme[]): void {
  const byKey = new Map(themes.map((theme) => [String(theme.stableKey), theme]));
  for (const theme of themes) {
    let current: string | null = String(theme.stableKey); const seen = new Set<string>();
    while (current) { if (seen.has(current)) fail(`hierarchy cycle detected at ${current}`); seen.add(current); const node = byKey.get(current); if (!node) { fail(`missing parent ${current}`); } current = node?.parentStableKey == null ? null : String(node.parentStableKey); }
  }
}

export async function validateThemeCatalog(file = resolve('scripts/hadith/data/oummah-themes.catalog.json')): Promise<{ total: number; roots: number; children: number }> {
  const catalog = JSON.parse(await readFile(file, 'utf8')) as Catalog;
  if (!text(catalog.catalogVersion) || catalog.language !== 'fr' || !Array.isArray(catalog.themes)) fail('catalogVersion, language=fr and themes[] are required');
  const themes = flatten(catalog.themes as Theme[]); const keys = new Set<string>(); const slugs = new Set<string>();
  themes.forEach((theme, index) => validateTheme(theme, index, keys, slugs)); validateHierarchy(themes);
  const roots = themes.filter((theme) => theme.parentStableKey === null).length;
  return { total: themes.length, roots, children: themes.length - roots };
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(__filename)) {
  validateThemeCatalog().then((result) => console.log(JSON.stringify({ status: 'valid', ...result }, null, 2))).catch((error: unknown) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });
}
