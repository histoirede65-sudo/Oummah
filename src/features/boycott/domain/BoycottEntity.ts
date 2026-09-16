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
  evidenceKind: BoycottEvidenceKind;
  sources: BoycottSource[];
  barcodePrefixes?: string[];
  productBarcodes?: string[];
  alternativeIds?: string[];
  lastVerifiedAt: string;
  boycott: true;
};

export const BOYCOTT_CATEGORY_LABELS: Record<BoycottCategory, string> = {
  restaurant: 'Restaurants',
  beverage: 'Boissons',
  food: 'Alimentation',
  technology: 'Technologie',
  retail: 'Commerce',
  finance: 'Banque & finance',
  travel: 'Voyage',
  energy: 'Énergie',
  automotive: 'Automobile',
  other: 'Autres',
};
