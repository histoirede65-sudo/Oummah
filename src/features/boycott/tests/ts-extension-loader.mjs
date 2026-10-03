import { readFile } from 'node:fs/promises';

export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith('.') && !/[.]m?js$|[.]tsx?$|[.]json$/.test(specifier)) {
    try { return await nextResolve(`${specifier}.ts`, context); } catch {}
  }
  return nextResolve(specifier, context);
}

// Metro imports JSON without an attribute; Node requires `with { type: 'json' }`. Serve it as an ES module.
export async function load(url, context, nextLoad) {
  if (url.endsWith('.json')) return { format: 'module', source: `export default ${await readFile(new URL(url), 'utf8')};`, shortCircuit: true };
  return nextLoad(url, context);
}
