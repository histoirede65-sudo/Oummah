import type { ProductHalalData } from './data/BoycottRepository';
import { findHalalCertificationBody, getHalalCertifier } from './halalCertifierRepository';
import { translate } from '../../i18n/translate';

export type HalalVerificationLevel = 'verified' | 'likely' | 'uncertain' | 'insufficient_data';
export type HalalVerificationAlert = { organisme: string; typeAlerte: string; description: string; source?: string; dateSource?: string; urlSource?: string };
export type HalalVerificationAnalysis = { level: HalalVerificationLevel; certification?: string; certifierId?: string; certificationSource?: string; halalMention: boolean; ingredientChecks: string[]; alerts: HalalVerificationAlert[]; explanation: string };

const HALAL_WORD = /(^|[^a-z])halal([^a-z]|$)/i;

function normalize(value: string) { return value.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase(); }
function hasHalalMention(values: string[]) { return values.some((value) => HALAL_WORD.test(normalize(value))); }
function ingredientChecks(ingredientsText?: string) {
  if (!ingredientsText?.trim()) return [];
  const text = normalize(ingredientsText); const checks: string[] = [];
  if (/gelatine|gelatin/.test(text) && !/gelatine\s+(vegetale|vegetarian|vegan)/.test(text)) checks.push(translate("halalCheck.gelatin"));
  if (/presure|rennet/.test(text)) checks.push(translate("halalCheck.rennet"));
  if (/mono\s*-?\s*diglyceride|mono\s*et\s*diglyceride|e471|e472/.test(text) && !/vegetal|plant|vegetale/.test(text)) checks.push(translate("halalCheck.e471"));
  if (/arome[^,;]*(alcool|ethanol)|flavou?r[^,;]*(alcohol|ethanol)/.test(text)) checks.push(translate("halalCheck.alcoholFlavour"));
  if (/graisse\s+animale|animal\s+fat/.test(text) && !/porc|pork|boeuf|beef|volaille|poultry/.test(text)) checks.push(translate("halalCheck.animalFat"));
  return checks;
}

/** confirmedCertifierId: certifier read by the OUMMAH team on a photo of the packaging, for this barcode. Open Food Facts wins when it names one. */
export function analyzeHalalCertification(data?: ProductHalalData, ingredientsText?: string, confirmedCertifierId?: string | null): HalalVerificationAnalysis {
  const labels = data?.labels ?? []; const certifications = data?.certifications ?? []; // Open Food Facts stores the certifier in labels ("fr:a-votre-service"), not in a certifications field.
  const declared = findHalalCertificationBody([...labels, ...certifications]); const confirmed = !declared && confirmedCertifierId ? getHalalCertifier(confirmedCertifierId) : null;
  const body = declared ?? confirmed; const certification = body?.name; const halalMention = hasHalalMention([...labels, ...certifications]); const checks = ingredientChecks(ingredientsText); const alerts: HalalVerificationAlert[] = [];
  const hasProductData = labels.length > 0 || certifications.length > 0 || Boolean(data?.manufacturer) || (data?.countries?.length ?? 0) > 0 || checks.length > 0;
  let level: HalalVerificationLevel = 'insufficient_data'; let explanation = translate("halalCheck.noInfo");
  if (confirmed) { level = 'verified'; explanation = translate("halalCheck.confirmed"); } else if (certification) { level = 'verified'; explanation = translate("halalCheck.declared"); } else if (halalMention) { level = 'likely'; explanation = translate("halalCheck.mention"); } else if (hasProductData) { level = 'uncertain'; explanation = translate("halalCheck.uncertain"); }
  return { level, certification, certifierId: body?.id, certificationSource: confirmed ? 'OUMMAH' : certification ? 'OpenFoodFacts' : undefined, halalMention, ingredientChecks: checks, alerts, explanation };
}
