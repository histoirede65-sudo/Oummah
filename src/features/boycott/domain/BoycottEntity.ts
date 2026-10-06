import { getActiveLanguage, localizedRecord } from '../../../i18n/translate';

export type BoycottCategory =
  | 'restaurant'
  | 'beverage'
  | 'food'
  | 'technology'
  | 'retail'
  | 'finance'
  | 'travel'
  | 'energy'
  | 'automotive'
  | 'other';

export type BoycottEvidenceKind =
  | 'military_supply'
  | 'government_contract'
  | 'material_support'
  | 'parent_group'
  | 'subsidiary_or_franchise'
  | 'occupation_economy'
  | 'financial_link'
  | 'other_documented_link';

export type BoycottSource = {
  label: string;
  url: string;
  publishedAt?: string;
};

export type BoycottEntity = {
  id: string;
  name: string;
  aliases?: string[];
  category: BoycottCategory;
  parentGroup?: string;
  summary: string;
  /** English summary (boycott_entities.summary_en); French is used when missing. */
  summaryEn?: string;
  evidenceKind: BoycottEvidenceKind;
  sources: BoycottSource[];
  barcodePrefixes?: string[];
  productBarcodes?: string[];
  alternativeIds?: string[];
  lastVerifiedAt: string;
  boycott: true;
};

/** Sheet summary in the active language. */
export function boycottSummary(entity: Pick<BoycottEntity, 'summary' | 'summaryEn'>): string {
  return getActiveLanguage() === 'en' && entity.summaryEn ? entity.summaryEn : entity.summary;
}

export const BOYCOTT_CATEGORY_LABELS: Record<BoycottCategory, string> = localizedRecord({
  restaurant: 'boycottCat.restaurant',
  beverage: 'boycottCat.beverage',
  food: 'boycottCat.food',
  technology: 'boycottCat.technology',
  retail: 'boycottCat.retail',
  finance: 'boycottCat.finance',
  travel: 'boycottCat.travel',
  energy: 'boycottCat.energy',
  automotive: 'boycottCat.automotive',
  other: 'boycottCat.other',
});
