export type AdditiveEvidenceLevel = 'established' | 'limited_evidence' | 'under_review' | 'no_particular_signal' | 'insufficient_data';
export type AdditivePresentationLevel = 'risk_high' | 'risk_limited' | 'neutral_or_no_particular_signal' | 'insufficient_data';
export type AdditiveSeverity = 'none' | 'low' | 'moderate' | 'serious';
export type AdditiveEvidenceStrength = 'insufficient' | 'limited' | 'moderate' | 'strong';
export type AdditiveExposureConcern = 'none' | 'unlikely' | 'possible' | 'concerning' | 'unknown';
export type AdditiveScientificClassification = 'no_particular_signal' | 'limited_concern' | 'moderate_concern' | 'high_concern' | 'insufficient_data';
export type AdditiveScientificAssessment = { severity: AdditiveSeverity; evidenceStrength: AdditiveEvidenceStrength; exposureConcern: AdditiveExposureConcern; classification: AdditiveScientificClassification; conclusion: string; sources: AdditiveSource[] };
export type AdditiveScientificOverride = { classification: AdditiveScientificClassification; sourceId: string; justification: string };
export type AdditiveScienceRecord = AdditiveScientificAssessment & { code: string; scientificReviewedAt?: string; regulatorySourceUpdatedAt?: string; dataVersion?: string };
export type AdditiveConcern = { title: string; evidenceLevel: AdditiveEvidenceLevel; summary: string; populationConcerned?: string; conditions?: string };
export type AdditiveSource = { title: string; organisation: string; publishedAt?: string; url: string; sourceType: 'scientific_opinion' | 'regulation' | 'international_agency' | 'official_information' };
export type AdditiveInfo = { code: string; name?: string; function?: string; useSummary?: string; attentionLevel: AdditiveEvidenceLevel; justification?: string; effects?: string[]; acceptableDailyIntake?: string; specialPopulations?: string[]; euRegulatoryStatus?: string; lastReevaluation?: string; concerns: AdditiveConcern[]; regulatoryNotes?: string[]; sources: AdditiveSource[]; lastVerifiedAt: string };

export function normalizeAdditiveCode(value: string): string | undefined {
  const match = value.trim().toUpperCase().match(/E\d{3,4}[A-Z]?/);
  return match?.[0];
}

const VERIFIED_AT = '2026-09-15';
const ADDITIVES: Record<string, AdditiveInfo> = {
  E150D: { code: 'E150D', name: 'Caramel au sulfite d’ammonium', function: 'Colorant', useSummary: 'Utilisé pour donner une couleur brune au produit.', attentionLevel: 'no_particular_signal', concerns: [], regulatoryNotes: ['Réévaluation EFSA terminée ; l’exposition estimée est généralement sous les DJA rapportées pour les caramels autorisés.'], sources: [{ title: 'Food colours', organisation: 'EFSA', publishedAt: '2026-09-15', url: 'https://www.efsa.europa.eu/en/topics/topic/food-colours', sourceType: 'official_information' }, { title: 'Caramel colours: consumer exposure lower than previously estimated', organisation: 'EFSA', publishedAt: '2012-12-19', url: 'https://www.efsa.europa.eu/en/press/news/121219', sourceType: 'scientific_opinion' }], lastVerifiedAt: VERIFIED_AT },
  E331: { code: 'E331', name: 'Citrates de sodium', function: 'Correcteur d’acidité / séquestrant', useSummary: 'Utilisés pour ajuster l’acidité et stabiliser certaines formulations.', attentionLevel: 'insufficient_data', concerns: [], regulatoryNotes: ['La forme exacte du citrate n’est pas distinguée par le code produit agrégé ; les informations intégrées ici ne permettent pas de conclure sur un risque spécifique au produit.'], sources: [{ title: 'Open call for food additives analytical data and use levels', organisation: 'EFSA', url: 'https://www.efsa.europa.eu/en/call/open-call-food-additives-analytical-data-and-use-levels-food-and-beverages-intended-human', sourceType: 'official_information' }], lastVerifiedAt: VERIFIED_AT },
  E338: { code: 'E338', name: 'Acide phosphorique', function: 'Correcteur d’acidité', useSummary: 'Utilisé pour ajuster l’acidité et le goût du produit.', attentionLevel: 'limited_evidence', concerns: [{ title: 'Exposition totale aux phosphates à prendre en compte', evidenceLevel: 'established', summary: 'L’EFSA a établi une DJA groupée de 40 mg de phosphore/kg de poids corporel/jour pour les phosphates. Le scan ne fournit pas la dose réellement consommée.', populationConcerned: 'Toute personne exposée à plusieurs sources de phosphates', conditions: 'La DJA concerne l’exposition totale aux phosphates, pas ce seul produit.' }], regulatoryNotes: ['Le code E338 seul ne permet pas d’estimer l’exposition ni de conclure sur la consommation d’un produit particulier.'], sources: [{ title: 'Nouvel avis scientifique de l’EFSA sur les phosphates', organisation: 'EFSA', publishedAt: '2019-06-12', url: 'https://www.efsa.europa.eu/fr/press/news/190612', sourceType: 'scientific_opinion' }, { title: 'Re-evaluation of phosphoric acid–phosphates', organisation: 'EFSA', publishedAt: '2019-06-04', url: 'https://doi.org/10.2903/j.efsa.2019.5674', sourceType: 'scientific_opinion' }], lastVerifiedAt: VERIFIED_AT },
  E950: { code: 'E950', name: 'Acésulfame-K', function: 'Édulcorant', useSummary: 'Utilisé pour donner un goût sucré avec peu ou pas de sucre.', attentionLevel: 'no_particular_signal', concerns: [], regulatoryNotes: ['L’EFSA a réévalué l’E950 en 2025 et indique une DJA de 15 mg/kg de poids corporel/jour. Le scan ne mesure pas l’exposition individuelle.'], sources: [{ title: 'Réévaluation de l’acésulfame K (E950)', organisation: 'EFSA', publishedAt: '2025-04-30', url: 'https://www.efsa.europa.eu/fr/plain-language-summary/re-evaluation-acesulfame-k-e-950-food-additive', sourceType: 'scientific_opinion' }, { title: 'Sweeteners', organisation: 'EFSA', url: 'https://www.efsa.europa.eu/en/topics/topic/sweeteners', sourceType: 'official_information' }], lastVerifiedAt: VERIFIED_AT },
  E951: { code: 'E951', name: 'Aspartame', function: 'Édulcorant', useSummary: 'Utilisé pour donner un goût sucré sans apporter le même niveau de sucre qu’une boisson sucrée.', attentionLevel: 'limited_evidence', concerns: [{ title: 'Classification de danger par le CIRC', evidenceLevel: 'limited_evidence', summary: 'Le CIRC a classé l’aspartame comme « peut-être cancérogène » (groupe 2B), sur la base d’indices limités. Cette classification identifie un danger potentiel et ne mesure pas le risque aux niveaux d’exposition usuels.', conditions: 'Ne constitue pas un diagnostic ni une conclusion sur ce produit particulier.' }, { title: 'Phénylcétonurie', evidenceLevel: 'established', summary: 'L’aspartame est une source de phénylalanine et doit être évité par les personnes atteintes de phénylcétonurie.', populationConcerned: 'Personnes atteintes de phénylcétonurie' }], regulatoryNotes: ['Le JECFA a réaffirmé une DJA de 0 à 40 mg/kg de poids corporel/jour en 2023 ; le scan ne mesure pas l’exposition individuelle.'], sources: [{ title: 'Aspartame hazard and risk assessment results released', organisation: 'OMS / CIRC / JECFA', publishedAt: '2023-07-14', url: 'https://www.who.int/news/item/14-07-2023-aspartame-hazard-and-risk-assessment-results-released', sourceType: 'international_agency' }, { title: 'Aspartame', organisation: 'EFSA', publishedAt: '2026-09-10', url: 'https://www.efsa.europa.eu/en/topics/topic/aspartame', sourceType: 'official_information' }, { title: 'JECFA — Aspartame', organisation: 'OMS / JECFA', publishedAt: '2023', url: 'https://apps.who.int/food-additives-contaminants-jecfa-database/Home/Chemical/62', sourceType: 'international_agency' }], lastVerifiedAt: VERIFIED_AT },
  E202: { code: 'E202', name: 'Sorbate de potassium', function: 'Conservateur', useSummary: 'Utilisé pour limiter le développement de certains micro-organismes.', attentionLevel: 'insufficient_data', concerns: [], sources: [], lastVerifiedAt: VERIFIED_AT },
  E322: { code: 'E322', name: 'Lécithines', function: 'Émulsifiant', useSummary: 'Utilisées pour aider à mélanger des ingrédients qui se séparent naturellement.', attentionLevel: 'insufficient_data', concerns: [], sources: [], lastVerifiedAt: VERIFIED_AT },
  E330: { code: 'E330', name: 'Acide citrique', function: 'Correcteur d’acidité', useSummary: 'Utilisé pour ajuster l’acidité du produit.', attentionLevel: 'insufficient_data', concerns: [], sources: [], lastVerifiedAt: VERIFIED_AT },
  E621: { code: 'E621', name: 'Glutamate monosodique', function: 'Exhausteur de goût', useSummary: 'Utilisé pour renforcer la perception de certaines saveurs.', attentionLevel: 'insufficient_data', concerns: [], sources: [], lastVerifiedAt: VERIFIED_AT },
  E955: { code: 'E955', name: 'Sucralose', function: 'Édulcorant', useSummary: 'Utilisé pour donner un goût sucré.', attentionLevel: 'insufficient_data', concerns: [], sources: [], lastVerifiedAt: VERIFIED_AT },
};

export function getAdditiveInfo(code: string): AdditiveInfo {
  const normalizedCode = normalizeAdditiveCode(code) ?? code.trim().toUpperCase();
  const info = ADDITIVES[normalizedCode] ?? { code: normalizedCode, attentionLevel: 'insufficient_data' as const, concerns: [], sources: [], lastVerifiedAt: VERIFIED_AT };
  const scientific: Partial<AdditiveInfo> = normalizedCode === 'E338' ? { justification: 'La DJA concerne l’exposition totale aux phosphates, pas ce seul produit.', acceptableDailyIntake: '40 mg de phosphore/kg de poids corporel/jour', euRegulatoryStatus: 'Autorisé sous conditions dans l’Union européenne', lastReevaluation: 'EFSA, 2019' } : normalizedCode === 'E951' ? { justification: 'Le niveau reflète des éléments documentés mais ne mesure pas le risque aux niveaux d’exposition usuels.', specialPopulations: ['Personnes atteintes de phénylcétonurie'], acceptableDailyIntake: '0 à 40 mg/kg de poids corporel/jour', lastReevaluation: 'JECFA, 2023', euRegulatoryStatus: 'Autorisé sous conditions dans l’Union européenne' } : normalizedCode === 'E950' ? { acceptableDailyIntake: '15 mg/kg de poids corporel/jour', lastReevaluation: 'EFSA, 2025', euRegulatoryStatus: 'Autorisé sous conditions dans l’Union européenne' } : {};
  return { ...info, ...scientific };
}

/** Presentation-only grouping. It never upgrades the evidence recorded above. */
export function getAdditivePresentationLevel(info: AdditiveInfo): AdditivePresentationLevel {
  if (info.attentionLevel === 'established') return 'risk_high';
  if (info.attentionLevel === 'limited_evidence' || info.attentionLevel === 'under_review') return 'risk_limited';
  if (info.attentionLevel === 'no_particular_signal') return 'neutral_or_no_particular_signal';
  return 'insufficient_data';
}

export function getAdditivePresentationLevelForScientificClassification(classification: AdditiveScientificClassification): AdditivePresentationLevel {
  if (classification === 'high_concern') return 'risk_high';
  if (classification === 'limited_concern' || classification === 'moderate_concern') return 'risk_limited';
  if (classification === 'no_particular_signal') return 'neutral_or_no_particular_signal';
  return 'insufficient_data';
}

function getLegacyAdditiveScientificAssessment(code: string): AdditiveScientificAssessment {
  const info = getAdditiveInfo(code);
  const common = { sources: info.sources };
  if (info.code === 'E150D') return { ...common, severity: 'none', evidenceStrength: 'insufficient', exposureConcern: 'unknown', classification: 'insufficient_data', conclusion: 'Données scientifiques suffisamment validées non disponibles pour conclure.' };
  switch (info.code) {
    case 'E150D': return { ...common, severity: 'none', evidenceStrength: 'strong', exposureConcern: 'unlikely', classification: 'no_particular_signal', conclusion: 'Évaluations officielles rassurantes dans les conditions autorisées.' };
    case 'E331': return { ...common, severity: 'none', evidenceStrength: 'insufficient', exposureConcern: 'unknown', classification: 'insufficient_data', conclusion: 'La forme exacte et l’exposition du produit ne permettent pas de conclure.' };
    case 'E338': return { ...common, severity: 'moderate', evidenceStrength: 'strong', exposureConcern: 'possible', classification: 'limited_concern', conclusion: 'L’exposition totale aux phosphates doit être prise en compte ; la quantité de ce produit est inconnue.' };
    case 'E950': return { ...common, severity: 'low', evidenceStrength: 'strong', exposureConcern: 'unknown', classification: 'no_particular_signal', conclusion: 'Réévaluation officielle et DJA disponibles ; l’exposition individuelle n’est pas mesurée.' };
    case 'E951': return { ...common, severity: 'serious', evidenceStrength: 'limited', exposureConcern: 'unknown', classification: 'limited_concern', conclusion: 'Un danger potentiel a été signalé avec des preuves limitées ; cela ne mesure pas le risque aux expositions usuelles.' };
    default: return { ...common, severity: 'none', evidenceStrength: 'insufficient', exposureConcern: 'unknown', classification: 'insufficient_data', conclusion: 'Données structurées insuffisantes pour conclure.' };
  }
}

export function getAdditiveScientificAssessment(code: string): AdditiveScientificAssessment {
  const assessment = getLegacyAdditiveScientificAssessment(code);
  const override = assessment.sources.length > 0 && assessment.severity === 'moderate' && assessment.exposureConcern === 'possible'
    ? { classification: 'limited_concern' as const, sourceId: 'efsa-e338-2019', justification: 'La DJA concerne l’exposition totale aux phosphates et la quantité de cet additif dans le produit est inconnue.' }
    : assessment.sources.length > 0 && assessment.severity === 'low' && assessment.exposureConcern === 'unknown'
      ? { classification: 'no_particular_signal' as const, sourceId: 'efsa-e950-2025', justification: 'La réévaluation officielle fournit une DJA ; aucune exposition individuelle du produit n’est disponible.' }
      : undefined;
  return { ...assessment, classification: classifyScientificAxes(assessment.severity, assessment.evidenceStrength, assessment.exposureConcern, override) };
}

export function classifyScientificAxes(severity: AdditiveSeverity, evidenceStrength: AdditiveEvidenceStrength, exposureConcern: AdditiveExposureConcern, override?: AdditiveScientificOverride): AdditiveScientificClassification {
  if (override?.sourceId.trim() && override.justification.trim()) return override.classification;
  if (evidenceStrength === 'insufficient') return 'insufficient_data';
  if (severity === 'serious' && evidenceStrength === 'strong' && exposureConcern === 'concerning') return 'high_concern';
  if ((severity === 'moderate' || severity === 'serious') && (evidenceStrength === 'moderate' || evidenceStrength === 'strong') && (exposureConcern === 'possible' || exposureConcern === 'concerning')) return 'moderate_concern';
  if (severity === 'none' && evidenceStrength === 'strong' && (exposureConcern === 'none' || exposureConcern === 'unlikely')) return 'no_particular_signal';
  if (severity === 'none' && evidenceStrength === 'strong' && exposureConcern === 'unknown') return 'no_particular_signal';
  if (exposureConcern === 'unknown' || evidenceStrength === 'limited' || severity === 'low') return 'limited_concern';
  return 'insufficient_data';
}

/** Chooses a remote row only when it is sourced and at least as recent as local data. */
export function resolveAdditiveScience(local: AdditiveScienceRecord, remote?: AdditiveScienceRecord): AdditiveScienceRecord {
  if (!remote || remote.sources.length === 0) return local;
  const remoteDate = remote.scientificReviewedAt ?? remote.regulatorySourceUpdatedAt ?? '';
  const localDate = local.scientificReviewedAt ?? local.regulatorySourceUpdatedAt ?? '';
  return remoteDate >= localDate ? remote : local;
}
