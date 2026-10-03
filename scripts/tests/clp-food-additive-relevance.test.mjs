import test from 'node:test';
import assert from 'node:assert/strict';
import { classFamily, evaluateRelevance, routeFor } from '../additives/audit-clp-food-additive-relevance.mjs';

const record = (hazardClass, hazardStatement = 'H318') => ({ clpIdentity: { substanceName: 'Example' }, provenance: { sourceLocation: 'Annex VI / Part 3 / Table 3' }, specificConcentrationLimits: [], notes: [], hazardClasses: [], ...{ hazardClass, hazardStatement } });

test('Skin Corr. sans ingestion n’est pas directement alimentaire', () => {
  const result = evaluateRelevance({ hazardClass: 'Skin Corr. 1A', category: '', hazardStatement: 'H314' }, { ...record('Skin Corr. 1A', 'H314') }, null);
  assert.equal(result.relevance, 'occupational_or_handling_only');
});

test('Eye Irrit. est classé manipulation/contact', () => {
  assert.equal(classFamily('Eye Irrit. 2'), 'eye_irritation');
});

test('Acute Tox. sans voie orale reste route-specific', () => {
  assert.equal(routeFor('acute_toxicity', 'H332'), 'inhalation');
  const result = evaluateRelevance({ hazardClass: 'Acute Tox. 3', category: '', hazardStatement: 'H332' }, { ...record('Acute Tox. 3', 'H332') }, null);
  assert.equal(result.relevance, 'route_specific');
});

test('Carc. reste un signal conditionnel, sans severity ni couleur', () => {
  const result = evaluateRelevance({ hazardClass: 'Carc. 2', category: '', hazardStatement: 'H351' }, { ...record('Carc. 2', 'H351') }, null);
  assert.equal(result.relevance, 'conditionally_relevant');
});

test('une voie inhalation explicite reste route-specific pour une classe systémique', () => {
  const result = evaluateRelevance({ hazardClass: 'Carc. 2', category: '', hazardStatement: 'H351 (inhalation)' }, { ...record('Carc. 2', 'H351 (inhalation)') }, null);
  assert.equal(result.exposureRoute, 'inhalation');
  assert.equal(result.relevance, 'route_specific');
});

test('Skin Irrit. est traité comme un signal de contact', () => {
  const result = evaluateRelevance({ hazardClass: 'Skin Irrit. 2', category: '', hazardStatement: 'H315' }, { ...record('Skin Irrit. 2', 'H315') }, null);
  assert.equal(result.relevance, 'occupational_or_handling_only');
});

test('une SCL est conservée sans créer de seuil métier', () => {
  const result = evaluateRelevance({ hazardClass: 'Acute Tox. 4', category: '', hazardStatement: 'H302', specificConcentrationLimit: ['>= 10 %'] }, { ...record('Acute Tox. 4', 'H302') }, null);
  assert.equal(result.concentrationContext.value, 'specific_limit_available');
  assert.deepEqual(result.concentrationContext.values, ['>= 10 %']);
  assert.equal(result.relevance, 'concentration_dependent');
});

test('la provenance est obligatoire dans la sortie', () => {
  const result = evaluateRelevance({ hazardClass: 'Carc. 2', category: '', hazardStatement: 'H351' }, { clpIdentity: { substanceName: 'Example' }, specificConcentrationLimits: [], notes: [] }, null);
  assert.deepEqual(result.provenance, []);
});

test('aucune règle ne dépend du E-number', () => {
  assert.equal(classFamily('Carc. 2'), classFamily('Carc. 1B'));
});
