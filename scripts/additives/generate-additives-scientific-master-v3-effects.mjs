#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const INPUT = path.join(ROOT, 'scripts/output/additive-science-source-audit-01-v3.json');
const PREVIOUS = path.join(ROOT, 'scripts/data/additives-scientific-master-v2-exposure.json');
const OUTPUT = path.join(ROOT, 'scripts/data/additives-scientific-master-v3-effects.json');
const read = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));
const save = (file, value) => fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
const audit = read(INPUT);
const previous = read(PREVIOUS).profiles;
const sourceByCode = new Map(audit.items.map((item) => [item.code, item]));
const profiles = previous.map((profile) => {
  const source = sourceByCode.get(profile.code);
  const criticalEndpoints = (source?.efsa?.referenceValues ?? []).filter((value) => /criticalendpoint/i.test(String(value.field ?? '')) && value.value).map((value) => String(value.value));
  const potentialEffects = (profile.potentialEffects ?? []).map((effect, index) => ({
    effect: effect.effect,
    severity: 'unknown',
    evidenceLevel: 'insufficient',
    appliesTo: effect.appliesTo ?? 'additive',
    studyContext: { type: 'unknown' },
    ...(criticalEndpoints[0] ? { criticalEndpoint: criticalEndpoints[0] } : {}),
    evidenceContext: effect.evidenceContext ?? source?.efsa?.assessmentDomain ?? null,
    source: { authority: effect.authority ?? 'EFSA', dataset: source?.efsa?.openFoodToxMatch ? 'OpenFoodTox 3.0' : 'official_scientific_profile', assessmentId: source?.efsa?.latestAssessment?.efsaOutputId || source?.efsa?.latestAssessment?.doi || null, sourceUrl: effect.source ?? source?.efsa?.latestAssessment?.url ?? null, sourceTable: 'humanHealthEffects', sourceRecordId: `${profile.code}:humanHealthEffects:${index}` },
    normalization: { severitySource: 'unknown', evidenceSource: 'unknown' },
  }));
  return { ...profile, potentialEffects };
});
save(OUTPUT, { schemaVersion: '3.0-effects', generatedAt: new Date().toISOString(), mode: 'offline-only', sourceAudit: 'scripts/output/additive-science-source-audit-01-v3.json', sourceIndexes: { efsa: 'scripts/output/openfoodtox-index.json', jecfa: 'scripts/output/jecfa-index.json' }, profiles });
console.log(JSON.stringify({ output: path.relative(ROOT, OUTPUT), profiles: profiles.length, profilesWithPotentialEffects: profiles.filter((profile) => profile.potentialEffects.length).length, potentialEffects: profiles.reduce((sum, profile) => sum + profile.potentialEffects.length, 0), noSupabaseWrites: true }, null, 2));
