import type {
  AdditiveEvidenceStrength,
  AdditiveExposureConcern,
  AdditiveInfo,
  AdditiveScientificAssessment,
  AdditiveScientificClassification,
  AdditiveSeverity,
} from './additiveInfoRepository';
import { getAdditiveInfo, getAdditiveScientificAssessment } from './additiveInfoRepository';

export type ScientificSourceProvenance = {
  sourceId: string;
  organisation: string;
  sourceType: 'scientific_opinion' | 'regulation' | 'international_agency' | 'official_information';
  title: string;
  url: string;
  publishedAt?: string;
  retrievedAt: string;
  fieldsSupported: string[];
};

export type AdditiveHealthEffect = {
  category: string;
  effect: string;
  severity: AdditiveSeverity;
  evidenceStrength: AdditiveEvidenceStrength;
  population?: string;
  sourceIds: string[];
};

export type AdditiveExposureAssessment = {
  adiValue?: number;
  adiUnit?: string;
  adiDisplay?: string;
  averageExposure?: string;
  highConsumerExposure?: string;
  sensitivePopulationExposure?: string;
  exposureConclusion: string;
  sourceIds: string[];
};

export type AdditiveAssessmentHistory = {
  organisation: string;
  date: string;
  conclusion: string;
  sourceId: string;
};

export type AdditiveScientificProfile = {
  code: string;
  canonicalName?: string;
  functionClasses: string[];
  regulatoryStatus?: string;
  euAuthorized?: boolean;
  euConditions?: Record<string, unknown>;
  adiValue?: number;
  adiUnit?: string;
  adiDisplay?: string;
  adiAuthority?: string;
  assessment: AdditiveScientificAssessment;
  scientificSummary: string;
  healthEffects: AdditiveHealthEffect[];
  sensitivePopulations: string[];
  exposureAssessment: AdditiveExposureAssessment;
  assessmentHistory: AdditiveAssessmentHistory[];
  sources: ScientificSourceProvenance[];
  regulatorySourceUpdatedAt?: string;
  scientificReviewedAt?: string;
  needsScientificReview: boolean;
  dataVersion: string;
  completeness: 'complete' | 'partial' | 'insufficient_data';
};

const RETRIEVED_AT = '2026-09-16';
const EU_DATABASE_URL = 'https://food.ec.europa.eu/food-safety/food-improvement-agents/additives/database_en';

function source(sourceId: string, organisation: ScientificSourceProvenance['organisation'], sourceType: ScientificSourceProvenance['sourceType'], title: string, url: string, fieldsSupported: string[], publishedAt?: string): ScientificSourceProvenance {
  return { sourceId, organisation, sourceType, title, url, publishedAt, retrievedAt: RETRIEVED_AT, fieldsSupported };
}

function localSources(info: AdditiveInfo): ScientificSourceProvenance[] {
  return info.sources.map((item, index) => source(`${info.code.toLowerCase()}-local-${index + 1}`, item.organisation, item.sourceType, item.title, item.url, ['scientific_summary', 'scientific_classification', 'exposure_concern'], item.publishedAt));
}

function profileFor(code: string, info: AdditiveInfo, assessment: AdditiveScientificAssessment): AdditiveScientificProfile {
  const normalized = code.toUpperCase();
  const sources = localSources(info);
  const base: AdditiveScientificProfile = {
    code: normalized,
    canonicalName: info.name,
    functionClasses: info.function ? [info.function] : [],
    regulatoryStatus: info.euRegulatoryStatus,
    euAuthorized: info.euRegulatoryStatus ? true : undefined,
    assessment,
    scientificSummary: assessment.conclusion,
    healthEffects: [],
    sensitivePopulations: info.specialPopulations ?? [],
    exposureAssessment: { adiValue: undefined, adiUnit: undefined, adiDisplay: info.acceptableDailyIntake, exposureConclusion: assessment.conclusion, sourceIds: sources.map((item) => item.sourceId) },
    assessmentHistory: info.lastReevaluation ? [{ organisation: info.lastReevaluation.split(',')[0], date: info.lastVerifiedAt, conclusion: assessment.conclusion, sourceId: sources[0]?.sourceId ?? '' }] : [],
    sources,
    scientificReviewedAt: info.lastVerifiedAt,
    needsScientificReview: sources.length === 0,
    dataVersion: '1.0',
    completeness: sources.length > 0 ? 'partial' : 'insufficient_data',
  };

  if (normalized === 'E338') {
    base.adiValue = 40;
    base.adiUnit = 'mg de phosphore/kg de poids corporel/jour';
    base.adiAuthority = 'EFSA';
    base.exposureAssessment = { adiValue: 40, adiUnit: base.adiUnit, adiDisplay: '40 mg de phosphore/kg de poids corporel/jour', exposureConclusion: 'La DJA concerne l’exposition totale aux phosphates ; la dose de ce produit est inconnue.', sourceIds: sources.map((item) => item.sourceId) };
  }
  if (normalized === 'E950') {
    base.adiValue = 15;
    base.adiUnit = 'mg/kg de poids corporel/jour';
    base.adiAuthority = 'EFSA';
    base.exposureAssessment = { adiValue: 15, adiUnit: base.adiUnit, adiDisplay: '15 mg/kg de poids corporel/jour', exposureConclusion: 'DJA officielle disponible ; l’exposition individuelle du produit n’est pas mesurée.', sourceIds: sources.map((item) => item.sourceId) };
  }
  if (normalized === 'E951') {
    base.adiAuthority = 'JECFA';
    base.exposureAssessment = { adiDisplay: '0 à 40 mg/kg de poids corporel/jour', exposureConclusion: 'DJA réaffirmée par le JECFA ; l’exposition individuelle du produit n’est pas mesurée.', sourceIds: sources.map((item) => item.sourceId) };
    base.healthEffects = [{ category: 'carcinogenicity', effect: 'Danger potentiel classé groupe 2B par le CIRC, avec indices limités.', severity: 'serious', evidenceStrength: 'limited', sourceIds: sources.map((item) => item.sourceId).slice(0, 1) }];
  }
  return base;
}

export function getLocalAdditiveScientificProfile(code: string): AdditiveScientificProfile {
  const info = getAdditiveInfo(code);
  return profileFor(info.code, info, getAdditiveScientificAssessment(info.code));
}

export function getAdditiveReviewCandidates(tags: string[], knownCodes: ReadonlySet<string> = new Set()): string[] {
  return [...new Set(tags.map((tag) => tag.toUpperCase().match(/E\d{3,4}[A-Z]?/)?.[0]).filter((code): code is string => typeof code === 'string' && !knownCodes.has(code)))];
}

export type SupabaseAdditiveScienceRow = Partial<AdditiveScientificProfile> & {
  code: string;
  canonical_name?: string;
  function_classes?: string[];
  regulatory_status?: string;
  eu_authorized?: boolean;
  eu_conditions?: Record<string, unknown>;
  adi_value?: number | null;
  adi_unit?: string;
  adi_display?: string;
  adi_authority?: string;
  severity?: AdditiveSeverity;
  evidence_strength?: AdditiveScientificAssessment['evidenceStrength'];
  exposure_concern?: AdditiveExposureConcern;
  scientific_classification?: AdditiveScientificClassification;
  scientific_summary?: string;
  health_effects?: AdditiveHealthEffect[];
  sensitive_populations?: string[];
  exposure_assessment?: AdditiveExposureAssessment;
  assessment_history?: AdditiveAssessmentHistory[];
  sources?: ScientificSourceProvenance[];
  regulatory_source_updated_at?: string;
  scientific_reviewed_at?: string;
  needs_scientific_review?: boolean;
  data_version?: string;
};

function fromSupabase(row: SupabaseAdditiveScienceRow): AdditiveScientificProfile | undefined {
  if (!row.sources?.length || !row.scientific_reviewed_at || !row.data_version || !/^(?:reviewed-)?\d+\.\d+$/.test(row.data_version) || !row.scientific_summary || !row.severity || !row.evidence_strength || !row.exposure_concern || !row.scientific_classification) return undefined;
  const local = getLocalAdditiveScientificProfile(row.code);
  return {
    ...local,
    code: row.code.toUpperCase(),
    canonicalName: row.canonical_name ?? local.canonicalName,
    functionClasses: row.function_classes ?? local.functionClasses,
    regulatoryStatus: row.regulatory_status ?? local.regulatoryStatus,
    euAuthorized: row.eu_authorized ?? local.euAuthorized,
    euConditions: row.eu_conditions ?? local.euConditions,
    adiValue: row.adi_value ?? undefined,
    adiUnit: row.adi_unit ?? local.adiUnit,
    adiDisplay: row.adi_display ?? local.adiDisplay,
    adiAuthority: row.adi_authority ?? local.adiAuthority,
    assessment: { severity: row.severity, evidenceStrength: row.evidence_strength, exposureConcern: row.exposure_concern, classification: row.scientific_classification, conclusion: row.scientific_summary ?? local.assessment.conclusion, sources: row.sources },
    scientificSummary: row.scientific_summary ?? local.scientificSummary,
    healthEffects: row.health_effects ?? local.healthEffects,
    sensitivePopulations: row.sensitive_populations ?? local.sensitivePopulations,
    exposureAssessment: row.exposure_assessment ?? local.exposureAssessment,
    assessmentHistory: row.assessment_history ?? local.assessmentHistory,
    sources: row.sources,
    regulatorySourceUpdatedAt: row.regulatory_source_updated_at,
    scientificReviewedAt: row.scientific_reviewed_at,
    needsScientificReview: row.needs_scientific_review ?? true,
    dataVersion: row.data_version ?? '1.0',
    completeness: 'complete',
  };
}

export function resolveAdditiveScientificProfile(local: AdditiveScientificProfile, remote?: SupabaseAdditiveScienceRow): AdditiveScientificProfile {
  const candidate = remote ? fromSupabase(remote) : undefined;
  if (!candidate) return local;
  const remoteDate = candidate.scientificReviewedAt ?? candidate.regulatorySourceUpdatedAt ?? '';
  const localDate = local.scientificReviewedAt ?? local.regulatorySourceUpdatedAt ?? '';
  return remoteDate >= localDate || local.completeness !== 'complete' ? candidate : local;
}

export async function fetchSupabaseAdditiveScience(code: string): Promise<SupabaseAdditiveScienceRow | undefined> {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim().replace(/\/+$/, '');
  const key = (process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY)?.trim();
  if (!url || !key) return undefined;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 1500);
  try {
    const response = await fetch(`${url}/rest/v1/food_additive_science?select=*&code=eq.${encodeURIComponent(code.toUpperCase())}&limit=1`, { headers: { apikey: key, Authorization: `Bearer ${key}`, Accept: 'application/json' }, signal: controller.signal });
    if (!response.ok) return undefined;
    const rows = await response.json() as SupabaseAdditiveScienceRow[];
    return rows[0];
  } catch {
    return undefined;
  } finally {
    clearTimeout(timeout);
  }
}

export async function fetchSupabaseAdditiveScienceProfiles(codes: readonly string[]): Promise<Record<string, AdditiveScientificAssessment>> {
  const normalizedCodes = [...new Set(codes.map((code) => code.toUpperCase()))];
  if (!normalizedCodes.length) return {};
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim().replace(/\/+$/, '');
  const key = (process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY)?.trim();
  if (!url || !key) return {};
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 1500);
  try {
    const response = await fetch(`${url}/rest/v1/food_additive_science?select=*&code=in.(${normalizedCodes.map(encodeURIComponent).join(',')})`, { headers: { apikey: key, Authorization: `Bearer ${key}`, Accept: 'application/json' }, signal: controller.signal });
    if (!response.ok) return {};
    const rows = await response.json() as SupabaseAdditiveScienceRow[];
    return Object.fromEntries(rows.map((row) => {
      const profile = fromSupabase(row);
      return profile ? [profile.code, profile.assessment] : null;
    }).filter((entry): entry is [string, AdditiveScientificAssessment] => entry !== null));
  } catch {
    return {};
  } finally {
    clearTimeout(timeout);
  }
}

export { EU_DATABASE_URL };
