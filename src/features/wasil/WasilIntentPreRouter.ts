export type WasilPreRoute = { normalized: string; explicitMemoryIntent: boolean; subject: string; qualifications: string[]; hasQualifyingCondition: boolean };
function normalize(value: string) { return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[’'`-]/g, " ").replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim(); }
const QUALIFICATION_PATTERNS: Array<[string, RegExp]> = [
  ["restriction", /\b(?:sans|impossible|ne peut pas|ne peux pas|interdit|obligatoire|condition|sauf|excepte|en cas de)\b/u],
  ["context", /\b(?:en voyage|voyageur|malade|maladie|pendant le ramadan|durant le ramadan|avant l aube|a l aube|pendant la priere|dans la priere)\b/u],
  ["exception", /\b(?:oubli|oublie|oublier|erreur|accidentellement|intentionnellement|necessite|besoin particulier)\b/u],
];
function hasExplicitPersonalMemoryIntent(normalized: string) {
  const personal = /\b(?:ma|mes|mon|moi|ce que tu sais de moi|ce que tu as memorise|mes preferences)\b/u.test(normalized);
  const action = /\b(?:memorise|retiens|garde en memoire|note que|supprime|efface|oublie|enregistre)\b/u.test(normalized);
  const object = /\b(?:preference|preferences|memoire|information personnelle|recitateur|traduction|tafsir|objectif|langue|temps quotidien|moment d etude|style de reponse|reponse(?:s)? detaillee(?:s)?|reponse(?:s)? courte(?:s)?)\b/u.test(normalized);
  const explicitMemoryTarget = /\b(?:ce que tu sais de moi|ce que tu as memorise|mes preferences memorisees|ta memoire|de ta memoire)\b/u.test(normalized);
  return explicitMemoryTarget || (action && personal && object);
}
export function preRouteWasilIntent(value: string): WasilPreRoute { const normalized = normalize(value); const qualifications = QUALIFICATION_PATTERNS.filter(([, p]) => p.test(normalized)).map(([label]) => label); return { normalized, explicitMemoryIntent: hasExplicitPersonalMemoryIntent(normalized), subject: normalized, qualifications, hasQualifyingCondition: qualifications.length > 0 }; }
export function allowsGenericFastPath(value: string) { return !preRouteWasilIntent(value).hasQualifyingCondition; }
