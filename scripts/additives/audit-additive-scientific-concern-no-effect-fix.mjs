#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { adaptProfile, loadCurrentEngine } from './audit-additive-risk-engine.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const read = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));
const save = (file, value) => fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
const master = read(path.join(ROOT, 'scripts/data/additives-scientific-master-v3-effects.json')).profiles;
const before = read(path.join(ROOT, 'scripts/output/additive-scientific-concern-audit-v1.json'));
const after = read(path.join(ROOT, 'scripts/output/additive-scientific-concern-audit-v3.json'));
const profileByCode = new Map(master.map((profile) => [profile.code, profile]));
const afterByCode = new Map(after.rows.map((row) => [row.code, row]));
const engine = await loadCurrentEngine();
const beforeRows = before.rows.filter((row) => row.scientificConcern?.concernLevel === 'no_identified_concern');
const auditRows = beforeRows.map((row) => {
  const raw = profileByCode.get(row.code);
  const profile = raw ? adaptProfile(raw, raw.names?.en ?? raw.code).profile : null;
  if (profile && raw) { profile.exposureAssessments = raw.exposureAssessments ?? []; profile.latestExposureAssessment = raw.latestExposureAssessment ?? null; }
  const hazardAfter = profile ? engine.deriveHazardAssessment(profile) : { level: 'unknown', reasons: ['Profil absent.'] };
  const afterRow = afterByCode.get(row.code);
  const structuredNoConcernSignalPresent = Boolean(raw?.assessment?.hazardStatus === 'none_identified' || raw?.assessment?.noIdentifiedHazard === true || (raw?.potentialEffects ?? []).some((effect) => effect.severity === 'none' && effect.normalization?.severitySource === 'explicit'));
  return { code: row.code, name: row.name, potentialEffectCount: raw?.potentialEffects?.length ?? 0, structuredNoConcernSignalPresent, hazardBefore: row.scientificConcern.hazard, hazardAfter: hazardAfter.level, concernBefore: row.scientificConcern.concernLevel, concernAfter: afterRow?.scientificConcern?.concernLevel ?? 'insufficient_data', reason: structuredNoConcernSignalPresent ? 'structured no-concern signal preserved' : 'absence d’effet documenté ≠ absence de danger identifié' };
});
const report = { schemaVersion: '1.0', auditVersion: '17D-v1', generatedAt: new Date().toISOString(), totalAudited: auditRows.length, switchedToUnknown: auditRows.filter((row) => row.hazardAfter === 'unknown').length, structuredNoConcernSignals: auditRows.filter((row) => row.structuredNoConcernSignalPresent).length, rows: auditRows, distributionBefore: before.distribution, distributionAfter: after.distribution, engineSource: 'src/features/boycott/additiveRiskEngine.ts', runtimeMatrixUnchanged: true, noScientificDataModified: true };
save(path.join(ROOT, 'scripts/output/additive-scientific-concern-no-effect-fix-audit-v1.json'), report);
console.log(JSON.stringify({ totalAudited: report.totalAudited, switchedToUnknown: report.switchedToUnknown, structuredNoConcernSignals: report.structuredNoConcernSignals, distributionBefore: report.distributionBefore, distributionAfter: report.distributionAfter }, null, 2));
