import assert from 'node:assert/strict';
import { test } from 'node:test';
import { buildPotentialEffects, buildProfile } from '../additives/build-additive-scientific-profiles.mjs';
import { buildImportPlan } from '../additives/additive-science-pipeline.mjs';

function item(overrides = {}) {
  return {
    code: 'E150A', canonicalName: 'Plain caramel',
    efsa: { matchConfidence: 'strong', assessmentCount: 1, assessmentDomain: 'food_additive_human', assessmentReferences: [{ title: 'Scientific opinion on caramel colours (E 150 a,b,c,d)', year: '2011', url: 'https://doi.org/10.2903/j.efsa.2011.2004', efsaOutputId: 'EFSA-Q-2008-237' }], referenceValues: [{ type: 'ADI', upperValue: 300, unit: 'mg/kg bw/day' }], latestAssessment: { url: 'https://doi.org/10.2903/j.efsa.2011.2004' }, humanHealthEffects: [] },
    jecfa: { matchConfidence: 'strong', evaluationCount: 1, assessments: [{ year: 2011, meeting: '75', adi: { rawText: 'ADI NOT LIMITED', status: 'not_limited' } }], sourceRecords: [{ url: 'https://apps.who.int/food-additives-contaminants-jecfa-database/Home/Chemical/1' }], ins: ['150a'] },
    ...overrides,
  };
}

test('conserve EFSA et JECFA comme deux autorités', () => {
  const profile = buildProfile(item(), { names: { en: 'Plain caramel' }, aliases: [], euRegulatoryStatus: 'PUBLISHED' });
  assert.deepEqual([...new Set(profile.authorityEvaluations.map((evaluation) => evaluation.authority))].sort(), ['EFSA', 'JECFA']);
});

test('ne fusionne pas deux valeurs de référence différentes', () => {
  const profile = buildProfile(item({ jecfa: { ...item().jecfa, assessments: [{ year: 2011, adi: { rawText: 'ADI 0-10 mg/kg bw/day', status: null } }] } }), { names: { en: 'Plain caramel' }, aliases: [], euRegulatoryStatus: 'PUBLISHED' });
  assert.ok(profile.referenceValues.length >= 2);
  assert.equal(new Set(profile.referenceValues.map((value) => value.authority)).size, 2);
});

test('préserve NOT SPECIFIED et NOT LIMITED', () => {
  const profile = buildProfile(item({ jecfa: { ...item().jecfa, assessments: [{ year: 2011, adi: { rawText: 'ADI NOT SPECIFIED', status: 'not_specified' } }, { year: 2010, adi: { rawText: 'ADI NOT LIMITED', status: 'not_limited' } }] } }), { names: { en: 'Plain caramel' }, aliases: [], euRegulatoryStatus: 'PUBLISHED' });
  assert.ok(profile.referenceValues.some((value) => value.type === 'not_specified'));
  assert.ok(profile.referenceValues.some((value) => value.type === 'not_limited'));
});

test('conserve le périmètre GROUP ADI', () => {
  const profile = buildProfile(item({ jecfa: { ...item().jecfa, assessments: [{ year: 2011, adi: { rawText: 'group ADI not specified', status: null } }] } }), { names: { en: 'Plain caramel' }, aliases: [], euRegulatoryStatus: 'PUBLISHED' });
  assert.ok(profile.referenceValues.some((value) => value.scope === 'group' && value.type === 'group_ADI'));
});

test('conserve les évaluations EFSA familiales', () => {
  const profile = buildProfile(item(), { names: { en: 'Plain caramel' }, aliases: [], euRegulatoryStatus: 'PUBLISHED' });
  const evaluation = profile.authorityEvaluations.find((value) => value.authority === 'EFSA');
  assert.equal(evaluation.assessmentScope, 'family');
  assert.deepEqual(evaluation.coveredCodes, ['E150A', 'E150B', 'E150C', 'E150D']);
});

test('conserve le contexte contaminant sans le transformer en risque humain', () => {
  const effects = buildPotentialEffects({ efsa: { humanHealthEffects: [{ endpoint: 'contaminant endpoint' }, { endpoint: 'animal endpoint' }], assessmentDomain: 'food_additive_human', latestAssessment: { url: 'https://example.org' } } });
  assert.equal(effects[0].appliesTo, 'contaminant');
  assert.equal(effects[0].severity, 'unknown');
});

test('un effet sans gravité ni preuve explicites reste unknown/insufficient', () => {
  const effects = buildPotentialEffects({ efsa: { humanHealthEffects: [{ endpoint: 'un effet documenté' }], assessmentDomain: 'food_additive_human', latestAssessment: { url: 'https://example.org' } } });
  assert.equal(effects[0].severity, 'unknown');
  assert.equal(effects[0].evidenceLevel, 'insufficient');
  assert.equal(effects[0].studyContext.type, 'unknown');
  assert.equal(effects[0].normalization.severitySource, 'unknown');
  assert.equal(effects[0].normalization.evidenceSource, 'unknown');
});

test('les contextes structurés distinguent animal, humain et in vitro', () => {
  const effects = buildPotentialEffects({ efsa: { humanHealthEffects: [{ effect: 'rat endpoint', species: 'rat' }, { effect: 'clinical endpoint', studyType: 'clinical human' }, { effect: 'cell endpoint', testSystem: 'in vitro cell line' }], assessmentDomain: 'food_additive_human', latestAssessment: { url: 'https://example.org' } } });
  assert.deepEqual(effects.map((effect) => effect.studyContext.type), ['animal', 'human', 'in_vitro']);
});

test('assessmentDomain ne devient pas un type étude humain', () => {
  const effects = buildPotentialEffects({ efsa: { humanHealthEffects: [{ endpoint: 'endpoint' }], assessmentDomain: 'food_additive_human', latestAssessment: { url: 'https://example.org' } } });
  assert.equal(effects[0].studyContext.type, 'unknown');
});

test('critical endpoint et provenance structurée sont conservés sans severity inventée', () => {
  const effects = buildPotentialEffects({ code: 'E999', efsa: { humanHealthEffects: [{ endpoint: 'endpoint' }], assessmentDomain: 'food_additive_human', latestAssessment: { url: 'https://example.org', efsaOutputId: 'EFSA-Q-1' }, referenceValues: [{ field: 'CriticalEndpoint', value: 'liver' }] } });
  assert.equal(effects[0].criticalEndpoint, 'liver');
  assert.equal(effects[0].source.dataset, 'OpenFoodTox 3.0');
  assert.equal(effects[0].source.sourceTable, 'humanHealthEffects');
  assert.equal(effects[0].severity, 'unknown');
});

test('source sans conclusion : conclusion null autorisée par le dry-run', () => {
  const profile = buildProfile(item(), { names: { en: 'Plain caramel' }, aliases: [], euRegulatoryStatus: 'PUBLISHED' });
  const plan = buildImportPlan([profile], [], new Set(['E150A']));
  assert.equal(plan.validation.rejected.length, 0);
  assert.equal(profile.authorityEvaluations[0].conclusion, null);
});
