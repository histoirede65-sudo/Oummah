import type { ProductHalalData } from './data/BoycottRepository';
import { findHalalCertificationBody, getHalalCertifier } from './halalCertifierRepository';

export type HalalVerificationLevel = 'verified' | 'likely' | 'uncertain' | 'insufficient_data';
export type HalalVerificationAlert = { organisme: string; typeAlerte: string; description: string; source?: string; dateSource?: string; urlSource?: string };
export type HalalVerificationAnalysis = { level: HalalVerificationLevel; certification?: string; certifierId?: string; certificationSource?: string; halalMention: boolean; ingredientChecks: string[]; alerts: HalalVerificationAlert[]; explanation: string };

const HALAL_WORD = /(^|[^a-z])halal([^a-z]|$)/i;

function normalize(value: string) { return value.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase(); }
function hasHalalMention(values: string[]) { return values.some((value) => HALAL_WORD.test(normalize(value))); }
function ingredientChecks(ingredientsText?: string) {
  if (!ingredientsText?.trim()) return [];
  const text = normalize(ingredientsText); const checks: string[] = [];
  if (/gelatine|gelatin/.test(text) && !/gelatine\s+(vegetale|vegetarian|vegan)/.test(text)) checks.push('Gélatine — origine non précisée.');
  if (/presure|rennet/.test(text)) checks.push('Présure — origine non précisée.');
  if (/mono\s*-?\s*diglyceride|mono\s*et\s*diglyceride|e471|e472/.test(text) && !/vegetal|plant|vegetale/.test(text)) checks.push('E471/E472 ou mono/diglycérides — origine végétale ou animale non précisée.');
  if (/arome[^,;]*(alcool|ethanol)|flavou?r[^,;]*(alcohol|ethanol)/.test(text)) checks.push('Arôme mentionnant un alcool — origine et procédé à vérifier.');
  if (/graisse\s+animale|animal\s+fat/.test(text) && !/porc|pork|boeuf|beef|volaille|poultry/.test(text)) checks.push('Graisse animale — espèce ou origine non précisée.');
  return checks;
}

/** confirmedCertifierId: certifier read by the OUMMAH team on a photo of the packaging, for this barcode. Open Food Facts wins when it names one. */
export function analyzeHalalCertification(data?: ProductHalalData, ingredientsText?: string, confirmedCertifierId?: string | null): HalalVerificationAnalysis {
  const labels = data?.labels ?? []; const certifications = data?.certifications ?? []; // Open Food Facts stores the certifier in labels ("fr:a-votre-service"), not in a certifications field.
  const declared = findHalalCertificationBody([...labels, ...certifications]); const confirmed = !declared && confirmedCertifierId ? getHalalCertifier(confirmedCertifierId) : null;
  const body = declared ?? confirmed; const certification = body?.name; const halalMention = hasHalalMention([...labels, ...certifications]); const checks = ingredientChecks(ingredientsText); const alerts: HalalVerificationAlert[] = [];
  const hasProductData = labels.length > 0 || certifications.length > 0 || Boolean(data?.manufacturer) || (data?.countries?.length ?? 0) > 0 || checks.length > 0;
  let level: HalalVerificationLevel = 'insufficient_data'; let explanation = 'Aucune information de certification disponible.';
  if (confirmed) { level = 'verified'; explanation = 'Certificateur vérifié par l’équipe OUMMAH sur une photo de l’emballage envoyée par un utilisateur. La fiche de l’organisme précise ce qui est documenté.'; } else if (certification) { level = 'verified'; explanation = 'Certification détectée dans les données du produit (déclarée sur Open Food Facts). La fiche de l’organisme précise ce qui est documenté.'; } else if (halalMention) { level = 'likely'; explanation = 'Produit déclaré halal. Le certificateur n’est pas encore renseigné pour ce code-barres : regardez le logo sur l’emballage (AVS, ARGML, Achahada…).'; } else if (hasProductData) { level = 'uncertain'; explanation = 'Les données disponibles ne permettent pas d’identifier une certification halal.'; }
  return { level, certification, certifierId: body?.id, certificationSource: confirmed ? 'OUMMAH' : certification ? 'OpenFoodFacts' : undefined, halalMention, ingredientChecks: checks, alerts, explanation };
}
