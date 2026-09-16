import assert from 'node:assert/strict';
import { test } from 'node:test';
import { analyzeHealthIngredients } from '../healthIngredientAnalyzer.ts';
import { aggregateAdditiveScores, analyzeHealthScore, getHealthGradeForScore, getHealthGradePresentation, HEALTH_SCORE_VERSION } from '../healthScoreAnalyzer.ts';
import { classifyScientificAxes, getAdditiveInfo, getAdditiveScientificAssessment, normalizeAdditiveCode, resolveAdditiveScience } from '../additiveInfoRepository.ts';
import { analyzeHalalCertification } from '../halalCertificationAnalyzer.ts';
import { getActiveHalalCertifierNotices, getHalalCertifier } from '../halalCertifierRepository.ts';
import { getBrandControversyDossier } from '../brandControversyRepository.ts';
import { findProductAlternative } from '../productAlternativeFinder.ts';
import { assessScanKnowledge } from '../scanKnowledge.ts';
import { getAdditiveReviewCandidates, getLocalAdditiveScientificProfile, resolveAdditiveScientificProfile } from '../foodAdditiveScienceRepository.ts';
import { detectIngredientAdditives } from '../ingredientAdditiveDetector.ts';

test('sante: donnees totalement absentes = informations insuffisantes', () => {
  const result = analyzeHealthIngredients();
  assert.equal(result.hasReliableData, false);
  assert.equal(result.watchItems.length, 0);
  assert.equal(result.hasAdditiveData, false);
  assert.equal(result.hasAllergenData, false);
});

test('sante: tableau additifs vide sans ingredients reste partiel', () => {
  const result = analyzeHealthIngredients({ additivesTags: [] });
  assert.equal(result.hasAdditiveData, true);
  assert.equal(result.additives.length, 0);
  assert.equal(result.hasIngredientText, false);
});

test('sante: additifs presents sont comptes', () => {
  const result = analyzeHealthIngredients({ ingredientsText: 'e950, e951, e338', additivesTags: ['en:e950', 'en:e951', 'en:e338'] });
  assert.equal(result.additives.length, 3);
  assert.equal(result.additives[0].additiveCode, 'E950');
});

test('détection ingrédients: E960C est reconnu sur la formulation réglementaire exacte', () => {
  const result = detectIngredientAdditives({ ingredientsText: 'eau, glycosides de stéviol produits par voie enzymatique' });
  assert.deepEqual(result, [{ code: 'E960C', detectionSource: 'ingredient_text_verified_mapping', matchedText: 'eau, glycosides de stéviol produits par voie enzymatique' }]);
});

test('détection ingrédients: E960C accepte la coquille contrôlée « vole enzymatique »', () => {
  const result = detectIngredientAdditives({ ingredientsText: 'glycosides de stéviol produits par vole enzymatique' });
  assert.deepEqual(result.map((item) => item.code), ['E960C']);
});

test('détection ingrédients: E960C accepte la formulation anglaise vérifiée', () => {
  const result = detectIngredientAdditives({ ingredientsText: 'enzymatically produced steviol glycosides' });
  assert.deepEqual(result.map((item) => item.code), ['E960C']);
});

test('détection ingrédients: les glycosides de stéviol sans procédé enzymatique ne sont pas E960C', () => {
  assert.equal(detectIngredientAdditives({ ingredientsText: 'glycosides de stéviol' }).length, 0);
  assert.equal(detectIngredientAdditives({ ingredientsText: 'steviol glycosides' }).length, 0);
});

test('détection ingrédients: E960C est dédoublonné avec additives_tags', () => {
  const result = detectIngredientAdditives({ additivesTags: ['en:e960c'], ingredientsText: 'glycosides de stéviol produits par voie enzymatique' });
  assert.equal(result.length, 1);
  assert.equal(result[0].code, 'E960C');
  assert.equal(result[0].detectionSource, 'both');
});

test('compteur générique: les codes trouvés dans le texte complètent les tags structurés', () => {
  const result = detectIngredientAdditives({ additivesTags: ['en:e150d', 'en:e338', 'en:e950', 'en:e951', 'en:e331'], ingredientNames: ['glycosides de stéviol produits par voie enzymatique'] });
  assert.equal(result.length, 6);
});

test('compteur générique: la variante textuelle « vole enzymatique » complète les tags structurés', () => {
  const result = detectIngredientAdditives({ additivesTags: ['en:e150d', 'en:e338', 'en:e950', 'en:e951', 'en:e331'], ingredientsText: 'glycosides de stéviol produits par vole enzymatique' });
  assert.deepEqual(result.map((item) => item.code), ['E150D', 'E338', 'E950', 'E951', 'E331', 'E960C']);
});

test('compteur générique: une détection OFF et texte du même code ne compte qu’une fois', () => {
  const result = detectIngredientAdditives({ additivesTags: ['en:e960c'], ingredientsText: 'E960C, glycosides de stéviol produits par voie enzymatique' });
  assert.equal(result.length, 1);
  assert.equal(result[0].code, 'E960C');
});

test('compteur générique: les signaux informatifs sans code E sont exclus', () => {
  assert.equal(detectIngredientAdditives({ ingredientsText: 'Arôme artificiel, arômes naturels, caféine' }).length, 0);
});

test('compteur générique: les variantes de casse et de préfixe sont dédoublonnées', () => {
  const result = detectIngredientAdditives({ additivesTags: ['e150d', 'E150d', 'en:e150D'] });
  assert.deepEqual(result.map((item) => item.code), ['E150D']);
});

test('détection générique: un identifiant OpenFoodFacts localisé active le mapping E960C', () => {
  const result = detectIngredientAdditives({ ingredientNames: ['en:enzymatically-produced-steviol-glycosides'] });
  assert.deepEqual(result.map((item) => item.code), ['E960C']);
});

test('analyse santé: la liste détaillée reprend E960C et les classifications de la liste finale', () => {
  const result = analyzeHealthIngredients({
    additivesTags: ['en:e150d', 'en:e331', 'en:e338', 'en:e950', 'en:e951'],
    ingredientNames: ['en:enzymatically-produced-steviol-glycosides', 'Arôme artificiel'],
    scientificAssessments: {
      E150D: { severity: 'none', evidenceStrength: 'strong', exposureConcern: 'unlikely', classification: 'no_particular_signal', conclusion: 'Test', sources: [] },
      E331: { severity: 'none', evidenceStrength: 'strong', exposureConcern: 'unlikely', classification: 'no_particular_signal', conclusion: 'Test', sources: [] },
      E338: { severity: 'moderate', evidenceStrength: 'strong', exposureConcern: 'possible', classification: 'limited_concern', conclusion: 'Test', sources: [] },
      E950: { severity: 'low', evidenceStrength: 'strong', exposureConcern: 'unlikely', classification: 'no_particular_signal', conclusion: 'Test', sources: [] },
      E951: { severity: 'serious', evidenceStrength: 'limited', exposureConcern: 'unknown', classification: 'limited_concern', conclusion: 'Test', sources: [] },
      E960C: { severity: 'low', evidenceStrength: 'strong', exposureConcern: 'unlikely', classification: 'no_particular_signal', conclusion: 'Test', sources: [] },
    },
  });
  assert.equal(result.additives.length, 6);
  assert.equal(result.additives.some((item) => item.additiveCode === 'E960C'), true);
  assert.deepEqual(result.additives.reduce((counts, item) => { counts[item.scientificClassification] += 1; return counts; }, { no_particular_signal: 0, limited_concern: 0, moderate_concern: 0, high_concern: 0, insufficient_data: 0 }), { no_particular_signal: 4, limited_concern: 2, moderate_concern: 0, high_concern: 0, insufficient_data: 0 });
  assert.equal(result.additives.find((item) => item.additiveCode === 'E960C')?.detail, 'Pas de signal particulier');
});

test('détection ingrédients: les formulations génériques ne sont pas surspécifiées', () => {
  assert.equal(detectIngredientAdditives({ ingredientsText: 'steviol glycosides, arômes naturels, caféine' }).length, 0);
});

test('détection ingrédients: E960C inconnu reste partiel sans pénalité', () => {
  const result = analyzeHealthScore({ nutritionGrade: 'A', ingredientsText: 'glycosides de stéviol produits par voie enzymatique' });
  assert.equal(result.available, true);
  assert.equal(result.score, 100);
  assert.deepEqual(result.additiveCoverage, { totalDetected: 1, scientificallyReviewed: 0, insufficientData: 0, unknown: 1 });
  assert.equal(result.scoreCompleteness, 'partial');
});

test('compteur scan: 6 codes E uniques et un signal informatif = 6 additifs', () => {
  const result = analyzeHealthScore({
    nutritionGrade: 'A',
    additivesTags: ['en:e150d', 'en:e338', 'en:e950', 'en:e951', 'en:e331', 'en:e338'],
    ingredientNames: ['glycosides de stéviol produits par voie enzymatique', 'Arôme artificiel'],
  });
  assert.equal(result.available, true);
  const additivesPillar = result.pillars.find((pillar) => pillar.pillar === 'additives');
  assert.equal(additivesPillar?.detail.startsWith('6 additifs détectés'), true);
  assert.equal(result.additiveCoverage.totalDetected, 6);
});

test('file de revue: un additif détecté dans le texte peut être envoyé à la queue', () => {
  assert.deepEqual(getAdditiveReviewCandidates(['E960C']), ['E960C']);
});

test('sante: allergenes presents sont comptes', () => {
  const result = analyzeHealthIngredients({ ingredientsText: 'lait, soja', allergensTags: ['en:milk', 'en:soybeans'] });
  assert.equal(result.allergens.length, 2);
});

test('sante: sucre eleve est signale', () => {
  const result = analyzeHealthIngredients({ nutrientLevels: { sugars: 'high' } });
  assert.equal(result.watchItems.some((item) => item.label.includes('Sucre')), true);
});

test('sante: NOVA 4 est signale', () => {
  const result = analyzeHealthIngredients({ novaGroup: 4 });
  assert.equal(result.watchItems.some((item) => item.label.includes('Transformation')), true);
});

test('sante: huile de palme est signalee', () => {
  const result = analyzeHealthIngredients({ ingredientsText: 'eau, huile de palme' });
  assert.equal(result.watchItems.some((item) => item.label === 'Huile de palme'), true);
});

test('indice santé: données insuffisantes ne produisent pas de note', () => {
  assert.equal(analyzeHealthScore().available, false);
});

test('indice santé: allergène seul ne pénalise pas la note', () => {
  const without = analyzeHealthScore({ nutritionGrade: 'B' });
  const withAllergen = analyzeHealthScore({ nutritionGrade: 'B', allergensTags: ['en:milk'] });
  assert.equal(without.available && withAllergen.available, true);
  assert.equal(without.finalGrade, withAllergen.finalGrade);
});

test('indice santé: version et résultat sont reproductibles', () => {
  const first = analyzeHealthScore({ nutritionGrade: 'B', additivesTags: ['en:e338'], novaGroup: 4 });
  const second = analyzeHealthScore({ nutritionGrade: 'B', additivesTags: ['en:e338'], novaGroup: 4 });
  assert.equal(first.available && second.available, true);
  assert.equal(first.finalGrade, second.finalGrade);
  assert.equal(first.scoreVersion, HEALTH_SCORE_VERSION);
});

test('indice santé: composant sépare source scientifique et pénalité OUMMAH', () => {
  const result = analyzeHealthScore({ nutritionGrade: 'B', additivesTags: ['en:e338'] });
  assert.equal(result.available, true);
  const additive = result.components.find((item) => item.type === 'additive');
  assert.equal(additive?.evidenceSource.includes('EFSA'), true);
  assert.equal(additive?.oummahPenalty, 35);
  assert.equal(result.scoreVersion, HEALTH_SCORE_VERSION);
});

test('indice santé v2: normalisation centrale des codes additifs', () => {
  assert.equal(normalizeAdditiveCode('E150d'), 'E150D');
  assert.equal(normalizeAdditiveCode('E150D'), 'E150D');
  assert.equal(normalizeAdditiveCode('en:e150d'), 'E150D');
});

test('indice santé v2: Nutri-Score A sans signal additif reste très favorable', () => {
  const result = analyzeHealthScore({ nutritionGrade: 'A', additivesTags: ['en:e150d'] });
  assert.equal(result.available, true);
  assert.equal(result.finalGrade, 'A');
  assert.equal(result.score, 100);
});

test('indice santé v2: Nutri-Score E reste défavorable', () => {
  const result = analyzeHealthScore({ nutritionGrade: 'E' });
  assert.equal(result.available, true);
  assert.equal(result.finalGrade, 'E');
});

test('indice santé v2: NOVA 4 est distinct de la nutrition', () => {
  const result = analyzeHealthScore({ nutritionGrade: 'A', novaGroup: 4 });
  assert.equal(result.available, true);
  assert.equal(result.pillars.find((pillar) => pillar.pillar === 'transformation')?.score, 20);
  assert.equal(result.finalGrade, 'B');
});

test('indice santé v2: données insuffisantes ne pénalisent pas arbitrairement', () => {
  const result = analyzeHealthScore({ nutritionGrade: 'A', additivesTags: ['en:e999'] });
  assert.equal(result.available, true);
  assert.equal(result.score, 100);
  assert.equal(result.additiveCounts.insufficient_data, 1);
  assert.deepEqual(result.additiveCoverage, { totalDetected: 1, scientificallyReviewed: 0, insufficientData: 0, unknown: 1 });
  assert.equal(result.scoreCompleteness, 'partial');
});

test('indice santé v2: absence de Nutri-Score rend la note indisponible', () => {
  assert.equal(analyzeHealthScore({ additivesTags: ['en:e338'], novaGroup: 4 }).available, false);
});

test('indice santé v2: classifications scientifiques contribuent séparément', () => {
  const result = analyzeHealthScore({ nutritionGrade: 'B', additivesTags: ['en:e338', 'en:e951', 'en:e150d'] });
  assert.equal(result.available, true);
  assert.equal(result.additiveCounts.limited_concern, 2);
  assert.equal(result.additiveCounts.no_particular_signal, 1);
  assert.equal(result.components.filter((item) => item.type === 'additive').length, 3);
});

test('indice santé v2: calcul pondéré et déterministe', () => {
  const first = analyzeHealthScore({ nutritionGrade: 'B', additivesTags: ['en:e338'], novaGroup: 4 });
  const second = analyzeHealthScore({ nutritionGrade: 'B', additivesTags: ['en:e338'], novaGroup: 4 });
  assert.equal(first.available && second.available, true);
  assert.equal(first.score, second.score);
  assert.equal(first.scoreVersion, '2.2');
  assert.equal(first.score, 63.5);
  assert.equal(first.scoreCompleteness, 'complete');
});

test('indice santé v2.2: Coca-Cola sans sucres 5449000214799', () => {
  const result = analyzeHealthScore({ nutritionGrade: 'C', novaGroup: 4, additivesTags: ['en:e150d', 'en:e331', 'en:e338', 'en:e950', 'en:e951', 'en:e960c'], scientificAssessments: {
    E331: { severity: 'none', evidenceStrength: 'strong', exposureConcern: 'unlikely', classification: 'no_particular_signal', conclusion: 'Distant', sources: [] },
    E960C: { severity: 'low', evidenceStrength: 'strong', exposureConcern: 'unlikely', classification: 'no_particular_signal', conclusion: 'Distant', sources: [{ sourceId: 'efsa-e960c', organisation: 'EFSA', title: 'E960C', url: 'https://example.test/e960c' }] },
  } });
  assert.equal(result.available, true);
  assert.equal(result.finalGrade, 'D');
  assert.equal(result.score, 40);
  assert.deepEqual(result.pillars.map((pillar) => pillar.score), [60, 20, 20]);
  assert.equal(result.scoreCompleteness, 'complete');
  assert.deepEqual(result.additiveCounts, { no_particular_signal: 4, limited_concern: 2, moderate_concern: 0, high_concern: 0, insufficient_data: 0 });
  assert.deepEqual(result.additiveCoverage, { totalDetected: 6, scientificallyReviewed: 6, insufficientData: 0, unknown: 0 });
});

test('indice santé v2.1: score, libellé et couleur sont cohérents', () => {
  assert.deepEqual(getHealthGradePresentation('A'), { grade: 'A', label: 'Très bon', color: '#E3B55A', backgroundColor: 'rgba(227,181,90,0.16)', accentColor: '#C8943A' });
  assert.deepEqual(getHealthGradePresentation('B'), { grade: 'B', label: 'Bon', color: '#62C58B', backgroundColor: 'rgba(98,197,139,0.16)', accentColor: '#62C58B' });
  assert.deepEqual(getHealthGradePresentation('C'), { grade: 'C', label: 'Moyen', color: '#F0C85A', backgroundColor: 'rgba(240,200,90,0.16)', accentColor: '#F0C85A' });
  assert.deepEqual(getHealthGradePresentation('D'), { grade: 'D', label: 'Médiocre', color: '#E58A4F', backgroundColor: 'rgba(229,138,79,0.16)', accentColor: '#E58A4F' });
  assert.deepEqual(getHealthGradePresentation('E'), { grade: 'E', label: 'Mauvais', color: '#E96B72', backgroundColor: 'rgba(233,107,114,0.16)', accentColor: '#E96B72' });
  assert.equal(getHealthGradeForScore(55), 'C');
});

test('indice santé v2.2: recalibrage réduit réellement NOVA 4 et deux signaux limités', () => {
  const favorable = analyzeHealthScore({ nutritionGrade: 'A', additivesTags: ['en:e150d'], novaGroup: 1 });
  const nova4 = analyzeHealthScore({ nutritionGrade: 'A', additivesTags: ['en:e150d'], novaGroup: 4 });
  const twoLimited = analyzeHealthScore({ nutritionGrade: 'C', additivesTags: ['en:e338', 'en:e951'], novaGroup: 3 });
  assert.equal(favorable.available && favorable.score, 100);
  assert.equal(nova4.available && nova4.score, 84);
  assert.equal(twoLimited.available && twoLimited.score, 48);
});

test('indice santé v2.1: les nutriments détaillés n’ajoutent pas de double pénalité', () => {
  const without = analyzeHealthScore({ nutritionGrade: 'C', additivesTags: [], novaGroup: 3 });
  const withDetails = analyzeHealthScore({ nutritionGrade: 'C', additivesTags: [], novaGroup: 3, nutritionValues: { energyKcal: 0, sugarsG: 0, saltG: 0, saturatedFatG: 0, proteinsG: 0, fiberG: 0 }, nutritionBasis: '100 ml' });
  assert.equal(without.available && withDetails.available, true);
  assert.equal(withDetails.score, without.score);
});

test('indice santé v2.2: agrégation additive cumulative et non diluable', () => {
  assert.equal(aggregateAdditiveScores(['no_particular_signal', 'no_particular_signal', 'no_particular_signal', 'no_particular_signal', 'no_particular_signal']).score, 100);
  assert.equal(aggregateAdditiveScores(['limited_concern']).score, 65);
  assert.equal(aggregateAdditiveScores(['limited_concern', 'limited_concern']).score, 20);
  assert.equal(aggregateAdditiveScores(['limited_concern', 'limited_concern', 'limited_concern']).score, 0);
  assert.equal(aggregateAdditiveScores(['moderate_concern']).score, 40);
  assert.equal(aggregateAdditiveScores(['moderate_concern', 'limited_concern']).score, 5);
  assert.equal(aggregateAdditiveScores(['high_concern']).score, 10);
  assert.equal(aggregateAdditiveScores(['high_concern', ...Array(10).fill('no_particular_signal')]).score, 10);
  assert.equal(aggregateAdditiveScores(['insufficient_data', 'insufficient_data', 'insufficient_data']).score, 100);
});

test('indice santé v2: complétude et garde-fou nutritionnel', () => {
  const nutritionOnly = analyzeHealthScore({ nutritionGrade: 'B' });
  assert.equal(nutritionOnly.available, true);
  assert.equal(nutritionOnly.score, 80);
  assert.equal(nutritionOnly.finalGrade, 'B');
  assert.equal(nutritionOnly.scoreCompleteness, 'nutrition_only');
  assert.equal(analyzeHealthScore({ nutritionGrade: 'B', novaGroup: 4 }).scoreCompleteness, 'partial');
  assert.equal(analyzeHealthScore({ nutritionGrade: 'B', novaGroup: 4, additivesTags: [] }).scoreCompleteness, 'complete');
});

for (const [code, expectedName, expectedLevel] of [
  ['E150d', 'Caramel au sulfite d’ammonium', 'no_particular_signal'],
  ['E331', 'Citrates de sodium', 'insufficient_data'],
  ['E338', 'Acide phosphorique', 'limited_evidence'],
  ['E950', 'Acésulfame-K', 'no_particular_signal'],
  ['E951', 'Aspartame', 'limited_evidence'],
]) {
  test(`additif ${code}: fiche locale coherente`, () => {
    const result = getAdditiveInfo(code);
    assert.equal(result.code, code.toUpperCase());
    assert.equal(result.name, expectedName);
    assert.equal(result.attentionLevel, expectedLevel);
    assert.equal(result.function !== undefined, true);
  });
}

test('additif inconnu: fallback prudent', () => {
  const result = getAdditiveInfo('E999');
  assert.equal(result.code, 'E999');
  assert.equal(result.attentionLevel, 'insufficient_data');
  assert.equal(result.sources.length, 0);
});

for (const [code, expected] of [['E150d', 'insufficient_data'], ['E331', 'insufficient_data'], ['E338', 'limited_concern'], ['E950', 'no_particular_signal'], ['E951', 'limited_concern']]) {
  test(`classification scientifique ${code}`, () => assert.equal(getAdditiveScientificAssessment(code).classification, expected));
}

test('classification scientifique: preuve limitée ne devient jamais high_concern', () => {
  const assessment = getAdditiveScientificAssessment('E951');
  assert.equal(assessment.evidenceStrength, 'limited');
  assert.notEqual(assessment.classification, 'high_concern');
});

test('classification scientifique: exposition inconnue empêche une conclusion excessive', () => {
  const assessment = getAdditiveScientificAssessment('E338');
  assert.equal(assessment.exposureConcern, 'possible');
  assert.notEqual(assessment.classification, 'high_concern');
});

test('classification scientifique: grave + forte + préoccupante = high_concern', () => {
  assert.equal(classifyScientificAxes('serious', 'strong', 'concerning'), 'high_concern');
});

test('classification scientifique: absence de données = insufficient_data', () => {
  assert.equal(classifyScientificAxes('none', 'insufficient', 'unknown'), 'insufficient_data');
});

test('référentiel scientifique: fiche locale complète et DJA nullable', () => {
  const e338 = getLocalAdditiveScientificProfile('E338');
  const e331 = getLocalAdditiveScientificProfile('E331');
  assert.equal(e338.exposureAssessment.adiValue, 40);
  assert.equal(e331.exposureAssessment.adiValue, undefined);
  assert.equal(e338.sources.length > 0, true);
});

test('référentiel scientifique: fiche Supabase complète prioritaire, fiche incomplète ignorée', () => {
  const local = getLocalAdditiveScientificProfile('E338');
  const incomplete = { code: 'E338', data_version: '1.0', scientific_classification: 'high_concern', sources: [] };
  assert.equal(resolveAdditiveScientificProfile(local, incomplete).assessment.classification, local.assessment.classification);
  const complete = { code: 'E338', data_version: '1.0', scientific_reviewed_at: '2026-09-16', scientific_summary: 'Résumé sourcé', severity: 'moderate', evidence_strength: 'strong', exposure_concern: 'possible', scientific_classification: 'limited_concern', sources: [{ sourceId: 'efsa', organisation: 'EFSA', sourceType: 'scientific_opinion', title: 'Avis', url: 'https://example.test/efsa', retrievedAt: '2026-09-16', fieldsSupported: ['scientific_summary'] }] };
  assert.equal(resolveAdditiveScientificProfile(local, complete).scientificSummary, 'Résumé sourcé');
});

test('file de revue: additif inconnu détecté sans conclusion scientifique', () => {
  assert.deepEqual(getAdditiveReviewCandidates(['en:e999', 'en:e950'], new Set(['E950'])), ['E999']);
  assert.equal(getLocalAdditiveScientificProfile('E999').assessment.classification, 'insufficient_data');
});

test('classification scientifique: modéré + preuve forte + exposition possible = moderate_concern', () => {
  assert.equal(classifyScientificAxes('moderate', 'strong', 'possible'), 'moderate_concern');
});

test('classification scientifique: une surcharge sans source ne peut pas forcer un classement', () => {
  assert.equal(classifyScientificAxes('none', 'strong', 'unlikely', { classification: 'high_concern', sourceId: '', justification: '' }), 'no_particular_signal');
});

test('classification scientifique: le repli conserve la donnée locale plus récente', () => {
  const local = { code: 'E331', severity: 'none', evidenceStrength: 'insufficient', exposureConcern: 'unknown', classification: 'insufficient_data', conclusion: 'local', sources: [{ title: 'Local', organisation: 'EFSA', url: 'https://example.test/local', sourceType: 'official_information' }], scientificReviewedAt: '2026-09-15' };
  const remote = { ...local, conclusion: 'remote', scientificReviewedAt: '2026-09-14' };
  assert.equal(resolveAdditiveScience(local, remote).conclusion, 'local');
  assert.equal(resolveAdditiveScience(local, { ...remote, scientificReviewedAt: '2026-09-16' }).conclusion, 'remote');
});

for (const name of ['AVS', 'ARGML', 'Achahada', 'Halal Services']) {
  test(`certificateur ${name}: organisme identifiable`, () => {
    const result = getHalalCertifier(name);
    assert.equal(result?.name, name);
  });
}

test('halal: mention simple differente d un organisme', () => {
  const result = analyzeHalalCertification({ labels: ['halal'] });
  assert.equal(result.halalMention, true);
  assert.equal(result.certification, undefined);
  assert.equal(result.level, 'likely');
});

test('halal: absence de certification reste distincte', () => {
  const result = analyzeHalalCertification({});
  assert.equal(result.certification, undefined);
  assert.equal(result.level, 'insufficient_data');
});

for (const ingredient of ['E471', 'E472', 'gelatine', 'presure']) {
  test(`halal: ${ingredient} produit une verification prudente`, () => {
    const result = analyzeHalalCertification({}, ingredient);
    assert.equal(result.ingredientChecks.length > 0, true);
    assert.equal(result.level === 'uncertain' || result.level === 'insufficient_data', true);
  });
}

test('halal: organisme identifie ne signifie pas documentation independante', () => {
  assert.equal(getHalalCertifier('AVS')?.notices.length, 0);
  assert.equal(getHalalCertifier('ARGML')?.notices.length, 1);
});

const entity = { id: 'brand-1', name: 'Brand One', category: 'beverage', summary: 'Lien documente.', evidenceKind: 'parent_group', sources: [{ label: 'Source officielle', url: 'https://example.test/source' }, { label: 'Source officielle', url: 'https://example.test/source' }, { label: 'Sans URL', url: '' }], lastVerifiedAt: '2026-09-15', boycott: true };

test('controverse: sources dedoublonnees et sans URL exclues', () => {
  const result = getBrandControversyDossier(entity);
  assert.equal(result?.sources.length, 1);
  assert.equal(result?.involvementType, 'parent_company');
});

test('controverse: absence de sources = aucun dossier', () => {
  assert.equal(getBrandControversyDossier({ ...entity, sources: [] }), null);
});

test('controverse: campagne BDS reste une campagne', () => {
  const result = getBrandControversyDossier({ ...entity, sources: [{ label: 'BDS', url: 'https://example.test/bds' }] });
  assert.equal(result?.involvementType, 'documented_campaign');
  assert.equal(result?.category, 'boycott_campaign');
});

const original = { barcode: '111', productName: 'Soda cola', assessment: 'ok', healthData: { nutritionGrade: 'd' }, comparisonData: { categoriesTags: ['en:sodas'], quantity: '330 ml' } };
function mockProducts(products) { globalThis.fetch = async () => ({ ok: true, json: async () => ({ products }) }); }

test('alternative: categorie precise commune accepte un candidat', async () => {
  mockProducts([{ code: '222', product_name: 'Soda cola light', categories_tags: ['en:beverages', 'en:sodas'], quantity: '330 ml', nutrition_grades: 'b' }]);
  const result = await findProductAlternative(original);
  assert.equal(result?.barcode, '222');
});

test('alternative: categorie trop generale seule refusee', async () => {
  const previous = globalThis.fetch;
  globalThis.fetch = async () => { throw new Error('fetch should not be called'); };
  try { assert.equal(await findProductAlternative({ ...original, comparisonData: { categoriesTags: ['en:beverages'] } }), null); } finally { globalThis.fetch = previous; }
});

test('alternative: produit identique exclu', async () => {
  mockProducts([{ code: '111', product_name: 'Soda cola', categories_tags: ['en:sodas'] }]);
  assert.equal(await findProductAlternative(original), null);
});

test('alternative: meilleure nutrition conserve une raison explicite', async () => {
  mockProducts([{ code: '222', product_name: 'Soda cola light', categories_tags: ['en:sodas'], nutrition_grades: 'b', quantity: '330 ml' }]);
  const result = await findProductAlternative({ ...original, healthData: { nutritionGrade: 'd' } });
  assert.equal(result?.reasons.some((reason) => reason.includes('Nutri-Score')), true);
});

test('alternative: quantite tres differente refusee', async () => {
  mockProducts([{ code: '222', product_name: 'Soda cola', categories_tags: ['en:sodas'], quantity: '2 l' }]);
  assert.equal(await findProductAlternative(original), null);
});

test('alternative: aucun candidat comparable = null', async () => {
  mockProducts([{ code: '222', product_name: 'Jus orange', categories_tags: ['en:juices'], quantity: '1 l' }]);
  assert.equal(await findProductAlternative(original), null);
});

test('connaissance: produit incomplet = needsReview', () => {
  const result = assessScanKnowledge({ barcode: '111', assessment: 'unknown' });
  assert.equal(result.needsReview, true);
  assert.equal(result.completeness, 'unknown');
  assert.equal(result.reviewReasons.includes('missing_ingredients'), true);
});

test('connaissance: Coca-Cola sans mention halal n’a pas unknown_certifier', () => {
  const result = assessScanKnowledge({ barcode: '111', productName: 'Coca-Cola Sans Sucres', brandLabel: 'Coca-Cola', healthData: { nutritionGrade: 'B' }, assessment: 'ok' });
  assert.equal(result.reviewReasons.includes('unknown_certifier'), false);
});

test('connaissance: produit suffisamment documenté = complet', () => {
  const result = assessScanKnowledge({ barcode: '111', productName: 'Produit', brandLabel: 'Marque', imageUrl: 'https://example.test/image', healthData: { ingredientsText: 'eau', nutritionGrade: 'b' }, comparisonData: { categoriesTags: ['en:sodas'] }, halalData: { certifications: ['AVS'] }, assessment: 'ok' });
  assert.equal(result.completeness, 'complete');
  assert.equal(result.needsReview, false);
});

test('certificateur: notice historique non active', () => {
  assert.equal(getActiveHalalCertifierNotices(getHalalCertifier('SFCVH')).length, 0);
});

test('certificateur: notice active documentaire ne change pas le verdict halal', () => {
  assert.equal(getActiveHalalCertifierNotices(getHalalCertifier('HQC France')).length, 1);
  assert.equal(analyzeHalalCertification({ certifications: ['HQC France'] }).level, 'verified');
});

test('classification scientifique: une fiche Supabase reviewed-1.0 est exploitable', () => {
  const local = getLocalAdditiveScientificProfile('E950');
  const remote = { code: 'E950', data_version: 'reviewed-1.0', scientific_reviewed_at: '2026-09-16', scientific_summary: 'Revue distante', severity: 'low', evidence_strength: 'strong', exposure_concern: 'unlikely', scientific_classification: 'no_particular_signal', sources: [{ sourceId: 'efsa', organisation: 'EFSA', sourceType: 'scientific_opinion', title: 'Avis', url: 'https://example.test/efsa', retrievedAt: '2026-09-16', fieldsSupported: ['scientific_summary'] }] };
  assert.equal(resolveAdditiveScientificProfile(local, remote).scientificSummary, 'Revue distante');
});

test('indice santé: classification distante et couverture sont partagees par le score', () => {
  const result = analyzeHealthScore({ nutritionGrade: 'B', additivesTags: ['en:e950', 'en:e331'], scientificAssessments: {
    E950: { severity: 'low', evidenceStrength: 'strong', exposureConcern: 'unlikely', classification: 'no_particular_signal', conclusion: 'Distant', sources: [] },
    E331: { severity: 'none', evidenceStrength: 'insufficient', exposureConcern: 'unknown', classification: 'insufficient_data', conclusion: 'Distant', sources: [] },
  } });
  assert.equal(result.available, true);
  assert.equal(result.additiveCounts.no_particular_signal, 1);
  assert.equal(result.additiveCounts.insufficient_data, 1);
  assert.equal(result.scoreCompleteness, 'partial');
  assert.equal(result.score, 87.5);
});
