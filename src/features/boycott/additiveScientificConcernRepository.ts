import dataset from './data/additive-scientific-concern-v1.json';
import methodology from './data/additive-methodology-v1.json';

export type AdditiveScientificConcernLevel = 'no_identified_concern' | 'limited' | 'moderate' | 'high' | 'insufficient_data';
export type AdditiveScientificConcernConfidence = 'low' | 'medium' | 'high';

export type AdditiveScientificConcernRecord = {
  code: string;
  canonicalName: string;
  scientificConcern: {
    level: AdditiveScientificConcernLevel;
    confidence: AdditiveScientificConcernConfidence;
    reasons: string[];
    limitations: string[];
  };
  exposureRisk: { status: string; confidence: string; reasons: string[] };
  usableHazardSignals: unknown[];
  contextualSignals: unknown[];
  excludedSignals: unknown[];
  clp?: { harmonised: boolean; hazardClasses: unknown[]; foodRelevance: unknown[] };
  authorityAssessments: unknown[];
  sources: unknown[];
  methodologyVersion: string;
  provenance: Record<string, unknown>;
};

export type AdditiveScientificConcernMethodology = typeof methodology;

const entries = (dataset as { entries: AdditiveScientificConcernRecord[] }).entries;
const byCode = new Map(entries.map((entry) => [entry.code.toUpperCase(), entry]));

export function getAdditiveScientificConcern(code: string): AdditiveScientificConcernRecord | null {
  const normalized = code.trim().toUpperCase();
  return byCode.get(normalized) ?? null;
}

export function getAdditiveScientificConcernMethodology(): AdditiveScientificConcernMethodology {
  return methodology;
}

export function hasScientificConcernData(code: string): boolean {
  return getAdditiveScientificConcern(code) !== null;
}
