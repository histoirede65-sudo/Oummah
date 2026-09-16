export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith('.') && !/[.]m?js$|[.]tsx?$/.test(specifier)) {
    try { return await nextResolve(`${specifier}.ts`, context); } catch {}
  }
  return nextResolve(specifier, context);
}
