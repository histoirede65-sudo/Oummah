import assert from 'node:assert/strict';
import { test } from 'node:test';
import { analyzeHealthIngredients } from '../healthIngredientAnalyzer.ts';
import { ADDITIVE_PENALTIES, aggregateAdditiveScores, analyzeHealthScore, getHealthGradeForScore, getHealthGradePresentation, HEALTH_SCORE_VERSION, NOVA_PENALTIES } from '../healthScoreAnalyzer.ts';
import { classifyScientificAxes, getAdditiveInfo, getAdditiveScientificAssessment, normalizeAdditiveCode, resolveAdditiveScience } from '../additiveInfoRepository.ts';
import { analyzeHalalCertification } from '../halalCertificationAnalyzer.ts';
import { getActiveHalalCertifierNotices, getHalalCertifier, setHalalCertificationBodies } from '../halalCertifierRepository.ts';
import { getBrandControversyDossier } from '../brandControversyRepository.ts';
import { acceptedGrades, isBoycottCandidate, selectAlternatives } from '../productAlternatives.ts';
import { isRecallActive, recallLots, toProductRecall } from '../productRecalls.ts';
import { assessScanKnowledge } from '../scanKnowledge.ts';
import { getAdditiveReviewCandidates, getLocalAdditiveScientificProfile, resolveAdditiveScientificProfile } from '../foodAdditiveScienceRepository.ts';
import { detectIngredientAdditives, detectOtherFoodComponents, getAdditivesDataStatus } from '../ingredientAdditiveDetector.ts';
import { mergeProductData, mergeVerifiedHealthData, resolveNutritionBasis } from '../data/BoycottRepository.ts';

const lookup = (overrides = {}) => ({ barcode: '5000112680171', assessment: 'ok', source: 'openfoodfacts', ...overrides });

test('sante: donnees totalement absentes = informations insuffisantes', () => {
  const result = analyzeHealthIngredients();
  assert.equal(result.hasReliableData, false);
  assert.equal(result.watchItems.length, 0);
  assert.equal(result.hasAdditiveData, false);
  assert.equal(result.hasAllergenData, false);
});

test('sante: tableau additifs vide sans ingredients reste partiel', () => {
  const result = analyzeHealthIngredients({ additivesTags: [] });
  assert.equal(result.hasAdditiveData, false);
  assert.equal(result.additives.length, 0);
  assert.equal(result.hasIngredientText, false);
});

test('additifs: donnees absentes = insufficient_data et jamais score additif favorable', () => {
  assert.equal(getAdditivesDataStatus({}), 'insufficient_data');
  const result = analyzeHealthScore({ nutritionGrade: 'E' });
  assert.equal(result.available, true);
  assert.equal(result.pillars.find((pillar) => pillar.pillar === 'additives')?.available, false);
  assert.equal(result.score, 0);
});

test('additifs: tableau vide sans preuve complete reste insufficient_data', () => {
  assert.equal(getAdditivesDataStatus({ additivesTags: [], ingredientsText: 'eau, sucre' }), 'insufficient_data');
});

test('additifs: additives_n zero et ingredients renseignes permettent known_none', () => {
  assert.equal(getAdditivesDataStatus({ additivesTags: [], additivesNumber: 0, ingredientsText: 'eau, sucre' }), 'known_none');
});

test('additifs: aliases E150d et E338 detectes depuis le texte', () => {
  const result = detectIngredientAdditives({ ingredientsText: 'colorant : caramel au sulfite d’ammonium, acidifiant : acide phosphorique' });
  assert.deepEqual(result.map((item) => item.code), ['E150D', 'E338']);
});

test('additifs: un code E dans le texte devient known_with_additives', () => {
  const data = { additivesTags: [], ingredientsText: 'colorant E150d' };
  assert.equal(getAdditivesDataStatus(data), 'known_with_additives');
});

test('additifs: code structure et alias textuel sont dedoublonnes', () => {
  const result = detectIngredientAdditives({ additivesTags: ['en:e150d'], ingredientsText: 'caramel au sulfite d’ammonium' });
  assert.equal(result.filter((item) => item.code === 'E150D').length, 1);
  assert.equal(result[0].detectionSource, 'both');
});

test('additifs: le catalogue UE permet la detection generique des codes et suffixes', () => {
  const result = detectIngredientAdditives({ ingredientsText: 'E407, E471, E250, E252, E450, E412, E407a' });
  assert.deepEqual(result.map((item) => item.code), ['E407', 'E471', 'E250', 'E252', 'E450', 'E412', 'E407A']);
});

test('additifs: un code E syntaxiquement plausible mais absent du catalogue est ignore', () => {
  assert.equal(detectIngredientAdditives({ ingredientsText: 'E9999' }).length, 0);
});

test('additifs: un code connu sans profil scientifique reste insufficient_data', () => {
  const result = analyzeHealthScore({ nutritionGrade: 'A', additivesTags: ['en:e471'] });
  assert.equal(result.additiveCounts.insufficient_data, 1);
  assert.equal(result.score, 100);
});

test('additifs: arome artificiel ne fabrique aucun code E', () => {
  const data = { ingredientsText: 'arôme artificiel, arômes naturels' };
  assert.equal(detectIngredientAdditives(data).length, 0);
  assert.equal(detectOtherFoodComponents(data).length, 1);
});

test('nutrition: boisson avec valeurs 100ml utilise la base 100 ml', () => {
  assert.equal(resolveNutritionBasis({ productType: 'beverage', nutrimentDataPer: '100 ml', nutriments: { 'energy-kcal_100ml': 42 } }), '100 ml');
});

test('source sante: les donnees OFF completes sont fusionnees sans perdre le classement boycott', () => {
  const result = mergeProductData(
    lookup({ healthData: { nutritionGrade: 'E', nutriments: { sugars_100ml: 10 } } }),
    lookup({ source: 'cache', assessment: 'boycott', boycottEntity: { id: 'brand', name: 'Marque', boycott: true }, healthData: { ingredientsText: 'eau, sucre' } }),
  );
  assert.equal(result.assessment, 'boycott');
  assert.equal(result.healthData?.nutritionGrade, 'E');
  assert.equal(result.healthData?.ingredientsText, 'eau, sucre');
});

test('source sante: un cache partiel ne remplace pas les champs OFF disponibles', () => {
  const result = mergeProductData(
    lookup({ healthData: { ingredientsText: 'eau, sucre', nutriments: { sugars_100ml: 10 }, nutritionGrade: 'E' } }),
    lookup({ source: 'cache', healthData: { nutritionGrade: 'E' } }),
  );
  assert.equal(result.healthData?.ingredientsText, 'eau, sucre');
  assert.equal(result.healthData?.nutriments?.sugars_100ml, 10);
});

test('source sante: les additifs OFF fusionnes sont detectes', () => {
  const result = mergeProductData(
    lookup({ healthData: { additivesTags: ['en:e150d', 'en:e338'], ingredientsText: 'colorant, acidifiant' } }),
    lookup({ source: 'cache', healthData: { nutritionGrade: 'E' } }),
  );
  assert.deepEqual(detectIngredientAdditives(result.healthData).map((item) => item.code), ['E150D', 'E338']);
});

test('source sante: l absence de OFF conserve les donnees disponibles sans en inventer', () => {
  const result = mergeProductData(lookup({ healthData: { nutritionGrade: 'E' } }), lookup({ source: 'cache', healthData: { nutritionGrade: 'E' } }));
  assert.equal(result.healthData?.ingredientsText, undefined);
  assert.equal(result.healthData?.nutriments, undefined);
});

test('sante verifiee: complete uniquement le barcode exact Coca-Cola', () => {
  const result = mergeVerifiedHealthData('5000112680171', { nutritionGrade: 'E', nutriments: { sugars_100g: 10.6 } });
  assert.equal(result.verifiedRecordFound, true);
  assert.equal(result.healthData?.ingredientsText, 'Eau, sucre, dioxyde de carbone, colorant : E150d, acide : acide phosphorique, arômes naturels, arôme caféine.');
  assert.deepEqual(detectIngredientAdditives(result.healthData).map((item) => item.code), ['E150D', 'E338']);
  assert.equal(result.healthData?.nutritionBasis, '100 ml');
  assert.equal(result.healthData?.novaGroup, undefined);
});

test('sante verifiee: un barcode different ne peut jamais etre enrichi', () => {
  const result = mergeVerifiedHealthData('5449000000996', { nutritionGrade: 'E' });
  assert.equal(result.verifiedRecordFound, false);
  assert.equal(result.healthData?.ingredientsText, undefined);
});

test('sante verifiee: une donnee OFF existante reste prioritaire et le conflit est trace', () => {
  const result = mergeVerifiedHealthData('5000112680171', { nutritionGrade: 'E', ingredientsText: 'eau, sucre, formule OFF differente', additivesTags: ['en:e950'] });
  assert.equal(result.healthData?.ingredientsText, 'eau, sucre, formule OFF differente');
  assert.deepEqual(result.healthData?.additivesTags, ['en:e950']);
  assert.equal(result.fieldsConflicted.includes('ingredients'), true);
  assert.equal(result.fieldsConflicted.includes('additives'), true);
  assert.equal(result.healthData?.healthDataConflicts?.length, 2);
});

test('sante verifiee: les additifs verifies passent par le detecteur standard', () => {
  const result = mergeVerifiedHealthData('5000112680171', {});
  const detections = detectIngredientAdditives(result.healthData);
  assert.equal(detections.some((item) => item.code === 'E150D'), true);
  assert.equal(detections.some((item) => item.code === 'E338'), true);
});

test('sante: additifs presents sont comptes', () => {
  const result = analyzeHealthIngredients({ ingredientsText: 'e950, e951, e338', additivesTags: ['en:e950', 'en:e951', 'en:e338'] });
  assert.equal(result.additives.length, 3);
  assert.equal(result.additives[0].additiveCode, 'E950');
});

test('détection ingrédients: E960C est reconnu sur la formulation réglementaire exacte', () => {
  const result = detectIngredientAdditives({ ingredientsText: 'eau, glycosides de stéviol produits par voie enzymatique' });
  assert.equal(result.length, 1);
  assert.equal(result[0].code, 'E960C');
  assert.equal(result[0].matchedText, 'eau, glycosides de stéviol produits par voie enzymatique');
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

test('détection ingrédients: E960C sans conclusion scientifique reste partiel sans pénalité', () => {
  const result = analyzeHealthScore({ nutritionGrade: 'A', ingredientsText: 'glycosides de stéviol produits par voie enzymatique' });
  assert.equal(result.available, true);
  assert.equal(result.score, 100);
  assert.deepEqual(result.additiveCoverage, { totalDetected: 1, scientificallyReviewed: 1, insufficientData: 1, unknown: 0 });
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
  const result = analyzeHealthScore({ nutritionGrade: 'B', additivesTags: ['en:e222'] });
  assert.equal(result.available, true);
  const additive = result.components.find((item) => item.type === 'additive');
  assert.equal(additive?.evidenceSource, 'Référentiel scientifique OUMMAH V1');
  assert.equal(additive?.scientificClassification, 'limited');
  assert.equal(additive?.oummahPenalty, ADDITIVE_PENALTIES.limited.perAdditive);
  assert.equal(result.score, 75 - ADDITIVE_PENALTIES.limited.perAdditive);
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
  assert.equal(result.pillars.find((pillar) => pillar.pillar === 'nutrition')?.score, 100);
  assert.equal(result.components.find((item) => item.type === 'transformation')?.oummahPenalty, NOVA_PENALTIES[4]);
  assert.equal(result.score, 90);
  assert.equal(result.finalGrade, 'A');
});

test('indice santé v2: données insuffisantes ne pénalisent pas arbitrairement', () => {
  const result = analyzeHealthScore({ nutritionGrade: 'A', additivesTags: ['en:e999'] });
  assert.equal(result.available, true);
  assert.equal(result.score, 100);
  assert.equal(result.additiveCounts.insufficient_data, 1);
  assert.deepEqual(result.additiveCoverage, { totalDetected: 1, scientificallyReviewed: 1, insufficientData: 1, unknown: 0 });
  assert.equal(result.scoreCompleteness, 'partial');
});

test('indice santé v2: absence de Nutri-Score rend la note indisponible', () => {
  assert.equal(analyzeHealthScore({ additivesTags: ['en:e338'], novaGroup: 4 }).available, false);
});

test('indice santé v2: classifications scientifiques contribuent séparément', () => {
  const result = analyzeHealthScore({ nutritionGrade: 'B', additivesTags: ['en:e222', 'en:e249', 'en:e330'] });
  assert.equal(result.available, true);
  assert.equal(result.additiveCounts.limited, 2);
  assert.equal(result.additiveCounts.insufficient_data, 1);
  assert.equal(result.components.filter((item) => item.type === 'additive').length, 2);
  assert.equal(result.score, 75 - 2 * ADDITIVE_PENALTIES.limited.perAdditive);
});

test('indice santé v2: calcul déterministe', () => {
  const first = analyzeHealthScore({ nutritionGrade: 'B', additivesTags: ['en:e222'], novaGroup: 4 });
  const second = analyzeHealthScore({ nutritionGrade: 'B', additivesTags: ['en:e222'], novaGroup: 4 });
  assert.equal(first.available && second.available, true);
  assert.equal(first.score, second.score);
  assert.equal(first.scoreVersion, 'oummah-health-score-v2');
  assert.equal(first.score, 75 - ADDITIVE_PENALTIES.limited.perAdditive - NOVA_PENALTIES[4]);
  assert.equal(first.scoreCompleteness, 'complete');
});

test('indice santé v2: Coca-Cola sans sucres 5449000214799', () => {
  // Nutri-Score C (50), NOVA 4 (-10); the six additives have no penalising classification in the V1 referential.
  const result = analyzeHealthScore({ nutritionGrade: 'C', novaGroup: 4, additivesTags: ['en:e150d', 'en:e331', 'en:e338', 'en:e950', 'en:e951', 'en:e960c'] });
  assert.equal(result.available, true);
  assert.equal(result.score, 40);
  assert.equal(result.finalGrade, 'C');
  assert.deepEqual(result.additiveCoverage, { totalDetected: 6, scientificallyReviewed: 6, insufficientData: 6, unknown: 0 });
  assert.equal(result.scoreCompleteness, 'partial');
});

test('indice santé v2.1: score, libellé et couleur sont cohérents', () => {
  assert.deepEqual(getHealthGradePresentation('A'), { grade: 'A', label: 'Très bon', color: '#E3B55A', backgroundColor: 'rgba(227,181,90,0.16)', accentColor: '#C8943A' });
  assert.deepEqual(getHealthGradePresentation('B'), { grade: 'B', label: 'Bon', color: '#62C58B', backgroundColor: 'rgba(98,197,139,0.16)', accentColor: '#62C58B' });
  assert.deepEqual(getHealthGradePresentation('C'), { grade: 'C', label: 'Moyen', color: '#F0C85A', backgroundColor: 'rgba(240,200,90,0.16)', accentColor: '#F0C85A' });
  assert.deepEqual(getHealthGradePresentation('D'), { grade: 'D', label: 'Médiocre', color: '#E58A4F', backgroundColor: 'rgba(229,138,79,0.16)', accentColor: '#E58A4F' });
  assert.deepEqual(getHealthGradePresentation('E'), { grade: 'E', label: 'Mauvais', color: '#E96B72', backgroundColor: 'rgba(233,107,114,0.16)', accentColor: '#E96B72' });
  assert.equal(getHealthGradeForScore(55), 'C');
});

test('indice santé v2: NOVA et additifs limités ne font que réduire la base', () => {
  const favorable = analyzeHealthScore({ nutritionGrade: 'A', additivesTags: ['en:e150d'], novaGroup: 1 });
  const nova4 = analyzeHealthScore({ nutritionGrade: 'A', additivesTags: ['en:e150d'], novaGroup: 4 });
  const twoLimited = analyzeHealthScore({ nutritionGrade: 'C', additivesTags: ['en:e222', 'en:e249'], novaGroup: 3 });
  assert.equal(favorable.available && favorable.score, 100);
  assert.equal(nova4.available && nova4.score, 90);
  assert.equal(twoLimited.available && twoLimited.score, 50 - 2 * ADDITIVE_PENALTIES.limited.perAdditive - NOVA_PENALTIES[3]);
});

test('indice santé v2.1: les nutriments détaillés n’ajoutent pas de double pénalité', () => {
  const without = analyzeHealthScore({ nutritionGrade: 'C', additivesTags: [], novaGroup: 3 });
  const withDetails = analyzeHealthScore({ nutritionGrade: 'C', additivesTags: [], novaGroup: 3, nutritionValues: { energyKcal: 0, sugarsG: 0, saltG: 0, saturatedFatG: 0, proteinsG: 0, fiberG: 0 }, nutritionBasis: '100 ml' });
  assert.equal(without.available && withDetails.available, true);
  assert.equal(withDetails.score, without.score);
});

test('indice santé v2: agrégation additive cumulative et plafonnée par niveau', () => {
  assert.equal(aggregateAdditiveScores(Array(5).fill('no_identified_concern')).score, 100);
  assert.equal(aggregateAdditiveScores(['limited']).score, 95);
  assert.equal(aggregateAdditiveScores(['limited', 'limited']).score, 90);
  assert.equal(aggregateAdditiveScores(Array(5).fill('limited')).score, 100 - ADDITIVE_PENALTIES.limited.cap);
  assert.equal(aggregateAdditiveScores(['moderate']).score, 88);
  assert.equal(aggregateAdditiveScores(['moderate', 'limited']).score, 83);
  assert.equal(aggregateAdditiveScores(['high']).score, 75);
  assert.equal(aggregateAdditiveScores(Array(4).fill('high')).score, 100 - ADDITIVE_PENALTIES.high.cap);
  assert.equal(aggregateAdditiveScores(['insufficient_data', 'insufficient_data', 'insufficient_data']).score, 100);
});

test('indice santé v2: complétude et garde-fou nutritionnel', () => {
  const nutritionOnly = analyzeHealthScore({ nutritionGrade: 'B' });
  assert.equal(nutritionOnly.available, true);
  assert.equal(nutritionOnly.score, 75);
  assert.equal(nutritionOnly.finalGrade, 'B');
  assert.equal(nutritionOnly.scoreCompleteness, 'partial');
  assert.equal(analyzeHealthScore({ nutritionGrade: 'B', novaGroup: 4, additivesTags: [] }).scoreCompleteness, 'complete');
  assert.equal(analyzeHealthScore({ nutritionGrade: 'B', novaGroup: 4, additivesTags: ['en:e999'] }).scoreCompleteness, 'partial');
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
  assert.equal(getHalalCertifier('AVS')?.warnings.length, 0);
  assert.equal(getHalalCertifier('ARGML')?.criticisms.length, 0);
});

test('halal: organisme detecte depuis les labels Open Food Facts', () => {
  assert.equal(analyzeHalalCertification({ labels: ['fr:A Votre Service', 'en:halal', 'fr:a-votre-service'] }).certifierId, 'avs');
  assert.equal(analyzeHalalCertification({ labels: ['en:halal', 'fr:association-rituelle-de-la-grande-mosquee-de-lyon'] }).certifierId, 'argml');
  assert.equal(analyzeHalalCertification({ labels: ['en:halal', 'fr:controle-de-la-mosquee-d-evry-courcouronnes'] }).certifierId, 'mosquee-evry');
  assert.equal(analyzeHalalCertification({ labels: ['fr:cavas-surgeles'] }).certifierId, undefined);
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

const original = { barcode: '111', productName: 'Soda cola', brandLabel: 'Marque A', assessment: 'ok', healthData: { nutritionGrade: 'd' }, comparisonData: { comparedToCategory: 'en:sodas' } };
const row = (overrides = {}) => ({ barcode: '222', category: 'en:sodas', product_name: 'Soda cola light', brands: 'Marque neutre', brands_tags: ['marque-neutre'], nutriscore_grade: 'b', popularity: 10, halal_labels: [], image_url: 'https://images.openfoodfacts.org/x.jpg', ...overrides });
const boycottCatalog = [{ id: 'coca-cola', name: 'Coca-Cola', aliases: ['Fanta'], category: 'beverage', summary: 's', evidenceKind: 'parent_group', sources: [], lastVerifiedAt: '2026-10-03', boycott: true, barcodePrefixes: ['544900'] }];

test('alternative: meilleur Nutri-Score et meme categorie acceptes, avec raison explicite', () => {
  const [first] = selectAlternatives(original, [row()], []);
  assert.equal(first?.barcode, '222');
  assert.equal(first.reasons[1], 'Nutri-Score B au lieu de D');
});

test('alternative: Nutri-Score egal ou pire refuse pour un produit non boycotte', () => {
  assert.deepEqual(selectAlternatives(original, [row({ nutriscore_grade: 'd' }), row({ barcode: '333', nutriscore_grade: 'e' })], []), []);
});

test('alternative: produit boycotte accepte une note egale, jamais pire', () => {
  const boycotted = { ...original, assessment: 'boycott', healthData: { nutritionGrade: 'b' } };
  const result = selectAlternatives(boycotted, [row({ nutriscore_grade: 'b' }), row({ barcode: '333', product_name: 'Autre', brands: 'M9', nutriscore_grade: 'c' })], []);
  assert.deepEqual(result.map((item) => item.barcode), ['222']);
});

test('alternative: Score Sante OUMMAH minimum 50/100, avec note et couleur', () => {
  const result = selectAlternatives(original, [row({ barcode: '1', product_name: 'C NOVA 4', brands: 'M1', nutriscore_grade: 'c', nova_group: 4 }), row({ barcode: '2', product_name: 'C NOVA 1', brands: 'M2', nutriscore_grade: 'c', nova_group: 1 })], []);
  assert.deepEqual(result.map((item) => item.barcode), ['2']);
  assert.equal(result[0].healthScore, 50);
  assert.equal(result[0].healthGrade, 'C');
  assert.equal(result[0].reasons[0], 'Score Santé 50/100 au lieu de 25/100');
});

test('alternative: additifs preoccupants pris en compte dans le seuil', () => {
  const result = selectAlternatives(original, [row({ nutriscore_grade: 'c', nova_group: 1, additives_tags: ['en:e222'] })], []);
  assert.deepEqual(result, []);
});

test('alternative: Nutri-Score A deja optimal = aucune alternative sauf boycott', () => {
  assert.deepEqual(acceptedGrades('a', false), []);
  assert.deepEqual(acceptedGrades('a', true), ['a']);
});

test('alternative: marque, alias et prefixe GS1 boycottes exclus', () => {
  assert.equal(isBoycottCandidate(boycottCatalog, row({ brands: 'Coca-Cola' })), true);
  assert.equal(isBoycottCandidate(boycottCatalog, row({ brands: 'Fanta' })), true);
  assert.equal(isBoycottCandidate(boycottCatalog, row({ barcode: '5449000000996', brands: '' })), true);
  assert.equal(isBoycottCandidate(boycottCatalog, row()), false);
});

test('alternative: produit identique et doublons de format exclus', () => {
  const result = selectAlternatives(original, [row({ barcode: '111' }), row(), row({ barcode: '444', popularity: 1 })], []);
  assert.deepEqual(result.map((item) => item.barcode), ['222']);
});

test('alternative: produit certifie halal = alternatives certifiees uniquement', () => {
  const certified = { ...original, halalData: { labels: ['fr:a-votre-service'] } };
  const result = selectAlternatives(certified, [row(), row({ barcode: '555', product_name: 'Cola certifie', halal_labels: ['fr:a-votre-service'] })], []);
  assert.deepEqual(result.map((item) => item.barcode), ['555']);
});

test('alternative: la categorie la plus precise passe avant la categorie large', () => {
  const result = selectAlternatives(original, [row({ barcode: '7', product_name: 'Soupe', category: 'en:sweetened-beverages', category_size: 900, nutriscore_grade: 'a', popularity: 999 }), row({ barcode: '8', product_name: 'Cola bio', category: 'en:colas', category_size: 40 })], []);
  assert.deepEqual(result.map((item) => item.barcode), ['8']);
});

test('alternative: categorie precise sans resultat = aucune alternative, pas de repli large', () => {
  const result = selectAlternatives(original, [row({ barcode: '7', product_name: 'Soda citron', category: 'en:sodas', category_size: 300 }), row({ barcode: '8', product_name: 'Cola E', category: 'en:colas', category_size: 40, nutriscore_grade: 'e' })], []);
  assert.deepEqual(result, []);
});

test('alternative: meme marque sous une autre ecriture exclue, produit sans marque exclu', () => {
  const heinz = { ...original, productName: 'Tomato Ketchup', brandLabel: 'H.J. Heinz B.V.' };
  assert.deepEqual(selectAlternatives(heinz, [row({ product_name: 'Ketchup Zero', brands: 'Heinz' })], []), []);
  const danone = { ...original, productName: 'Activia Cereales', brandLabel: 'Danone' };
  assert.deepEqual(selectAlternatives(danone, [row({ product_name: 'Activia nature', brands: 'Activia' }), row({ barcode: '9', product_name: 'Bifidus', brands: 'DANONE S.A.' })], []), []);
  assert.deepEqual(selectAlternatives(original, [row({ brands: '' })], []), []);
});

test('alternative: meme marque exclue et deux produits maximum par marque', () => {
  const result = selectAlternatives(original, [row({ barcode: '1', product_name: 'Cola A light', brands: 'Marque A' }), row({ barcode: '2', product_name: 'Cola 1' }), row({ barcode: '3', product_name: 'Cola 2' }), row({ barcode: '4', product_name: 'Cola 3' })], []);
  assert.deepEqual(result.map((item) => item.barcode), ['2', '3']);
});

test('alternative: tri par Nutri-Score puis popularite', () => {
  const result = selectAlternatives(original, [row({ barcode: '1', product_name: 'B peu connu', brands: 'M1', nutriscore_grade: 'b', popularity: 1 }), row({ barcode: '2', product_name: 'A', brands: 'M2', nutriscore_grade: 'a', popularity: 1 }), row({ barcode: '3', product_name: 'B connu', brands: 'M3', nutriscore_grade: 'b', popularity: 99 })], []);
  assert.deepEqual(result.map((item) => item.barcode), ['2', '3', '1']);
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

const notice = (id, level) => ({ id, type: 'test', level, title: id, summary: id, issuedBy: 'test', sources: [] });
const sheet = (id, name, warnings) => ({ id, name, aliases: [], offLabelTags: [], documentationLevel: 'insufficient', summary: '', facts: {}, warnings, criticisms: [], scholarlyNotes: [], sources: [], lastVerifiedAt: '2026-10-02' });
setHalalCertificationBodies([sheet('sfcvh', 'SFCVH', [notice('sfcvh-gmp', 'historical')]), sheet('hqc-france', 'HQC France', [notice('hqc-scope', 'vigilance')])]);

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

test('indice santé: une donnée manquante n’améliore jamais le score', () => {
  const result = analyzeHealthScore({ nutritionGrade: 'B', additivesTags: ['en:e950', 'en:e331'] });
  assert.equal(result.available, true);
  assert.equal(result.additiveCounts.insufficient_data, 2);
  assert.equal(result.scoreCompleteness, 'partial');
  assert.equal(result.score, 75);
});

test('rappel: lots lisibles par groupe, sans le code-barres', () => {
  const lots = recallLots(['3245414264410', 'n° lot : 73728848', 'date limite de consommation', '2026-10-07', '|3245414264410', 'n° lot : 73728848', 'date limite de consommation', '2026-10-08'], '3245414264410');
  assert.deepEqual(lots, ['Lot 73728848 · DLC 07/10/2026', 'Lot 73728848 · DLC 08/10/2026']);
});

test('rappel: en cours seulement si la procedure n est pas terminee', () => {
  const now = new Date('2026-10-03T12:00:00Z');
  assert.equal(isRecallActive({ date_publication: '2026-10-02T17:50:11+00:00', date_de_fin_de_la_procedure_de_rappel: null }, now), true);
  assert.equal(isRecallActive({ date_publication: '2021-04-09T17:24:32+00:00', date_de_fin_de_la_procedure_de_rappel: '2021-04-19' }, now), false);
  assert.equal(isRecallActive({ date_publication: '2026-09-20T10:00:00+00:00', date_de_fin_de_la_procedure_de_rappel: '2026-10-03' }, now), true);
  assert.equal(isRecallActive({ date_publication: '2024-01-01T10:00:00+00:00', date_de_fin_de_la_procedure_de_rappel: null }, now), false);
});

test('rappel: conduites a tenir decoupees et capitalisees', () => {
  const recall = toProductRecall({ libelle: 'haché de veau', conduites_a_tenir_par_le_consommateur: 'ne plus consommer|détruire le produit' }, '3245414264410');
  assert.equal(recall.title, 'Haché de veau');
  assert.deepEqual(recall.actions, ['Ne plus consommer', 'Détruire le produit']);
});
