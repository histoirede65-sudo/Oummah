import type { BoycottEntity } from './domain/BoycottEntity';

export type CommercialEntityStatus = 'boycott' | 'not_classified_by_oummah' | 'unclassified';
export type CommercialEvidenceConfidence = 'high' | 'medium' | 'low';
export type CommercialEvidenceLevel = 'official' | 'structured_provider' | 'secondary';
export type CommercialOwnershipEvidence = {
  brandCanonicalName: string;
  canonicalEntity: string;
  ownerEntity?: string;
  parentEntity?: string;
  sourceType: 'official' | 'structured_provider' | 'secondary';
  sourceName: string;
  sourceUrl?: string;
  sourceTitle?: string;
  evidenceLevel: CommercialEvidenceLevel;
  confidence: CommercialEvidenceConfidence;
  verifiedAt: string;
  reviewAfter?: string;
  market?: string;
  notes?: string;
};
export type ResolvedCommercialChain = {
  brand: string;
  canonicalEntity?: string;
  ownerEntity?: string;
  parentEntity?: string;
  identityConfidence: CommercialEvidenceConfidence | 'unresolved';
  ownershipConfidence: CommercialEvidenceConfidence | 'unresolved';
  evidence: CommercialOwnershipEvidence[];
};
export type CommercialIdentityProvider = {
  id: 'oummah' | 'openfoodfacts' | 'gs1';
  resolveBrand: (input: CommercialIdentityInput) => Promise<ResolvedCommercialChain | undefined>;
  getEvidence: (input: CommercialIdentityInput) => Promise<CommercialOwnershipEvidence[]>;
};
export type CommercialEntityEvidence = {
  sourceType: 'boycott_catalog' | 'positive_registry';
  sourceName: string;
  sourceUrl?: string;
  statement?: string;
  verifiedAt: string;
  reviewAfter?: string;
  confidence: CommercialEvidenceConfidence;
};
export type BoycottResolutionEvidence = {
  entity?: string;
  parentEntity?: string;
  matchedCatalogEntry?: string;
  matchedAlias?: string[];
  ownershipSource?: 'catalog' | 'positive_registry' | 'identity_fields' | 'none';
  resolutionConfidence: 'high' | 'medium' | 'low' | 'unresolved';
};
export type CommercialClassificationEvidence = {
  canonicalEntity?: string;
  parentEntity?: string;
  ownershipEvidence?: string;
  identitySources: string[];
  catalogVersion: string;
  checkedAt: string;
  matchedBoycottEntries: string[];
};
export type CommercialEntityRecord = {
  id: string;
  canonicalName: string;
  aliases: string[];
  parentEntity?: string;
  owner?: string;
  status: CommercialEntityStatus;
  evidence: CommercialEntityEvidence[];
  lastVerifiedAt: string;
  reviewAfter?: string;
  resolverVersion: string;
  boycottEntity?: BoycottEntity;
  classificationEvidence?: CommercialClassificationEvidence;
  ownershipEvidence?: CommercialOwnershipEvidence[];
  ownershipConfidence?: CommercialEvidenceConfidence | 'unresolved';
  identityConfidence?: CommercialEvidenceConfidence | 'unresolved';
};
export type CommercialIdentityInput = {
  barcode?: string;
  productName?: string;
  brands?: string;
  brandsTags?: string[];
  brandOwner?: string;
  manufacturer?: string;
  company?: string;
  owner?: string;
  parentCompany?: string;
  group?: string;
  manufacturingPlaces?: string;
};

export const COMMERCIAL_ENTITY_REPOSITORY_VERSION = 'commercial-entity-repository-v1';
export const COMMERCIAL_OWNERSHIP_DATA_VERSION = 'commercial-ownership-evidence-v2-verified-relations';

const VERIFIED_RELATIONS_DATE = '2026-10-02';

// These records contain only verified ownership relations. The resolver still
// compares owner/parent entities with the OUMMAH boycott catalog; no boycott
// or non-boycott decision is authored in this registry.
const positiveRecords: CommercialEntityRecord[] = [
  {
    id: 'commercial-kinley',
    canonicalName: 'Kinley',
    aliases: ['Kinley'],
    owner: 'The Coca-Cola Company',
    parentEntity: 'The Coca-Cola Company',
    status: 'not_classified_by_oummah',
    evidence: [{ sourceType: 'positive_registry', sourceName: 'The Coca-Cola Company — page officielle Kinley', sourceUrl: 'https://www.coca-cola.com/in/en/brands/kinley', statement: 'La page officielle Coca-Cola indique que Kinley est une marque déposée de The Coca-Cola Company.', verifiedAt: VERIFIED_RELATIONS_DATE, confidence: 'high' }],
    lastVerifiedAt: VERIFIED_RELATIONS_DATE,
    resolverVersion: COMMERCIAL_ENTITY_REPOSITORY_VERSION,
    identityConfidence: 'high',
    ownershipConfidence: 'high',
    ownershipEvidence: [{ brandCanonicalName: 'Kinley', canonicalEntity: 'Kinley', ownerEntity: 'The Coca-Cola Company', parentEntity: 'The Coca-Cola Company', sourceType: 'official', sourceName: 'The Coca-Cola Company — page officielle Kinley', sourceUrl: 'https://www.coca-cola.com/in/en/brands/kinley', sourceTitle: 'Kinley — marque officielle', evidenceLevel: 'official', confidence: 'high', verifiedAt: VERIFIED_RELATIONS_DATE, market: 'global', notes: 'La page officielle Coca-Cola indique que Kinley est une marque déposée de The Coca-Cola Company.' }],
    classificationEvidence: { canonicalEntity: 'Kinley', parentEntity: 'The Coca-Cola Company', ownershipEvidence: 'Preuve officielle de propriété Coca-Cola.', identitySources: ['official_ownership_registry'], catalogVersion: COMMERCIAL_ENTITY_REPOSITORY_VERSION, checkedAt: VERIFIED_RELATIONS_DATE, matchedBoycottEntries: [] },
  },
  {
    id: 'commercial-orangina',
    canonicalName: 'Orangina',
    aliases: ['Orangina'],
    owner: 'Suntory Beverage & Food France',
    parentEntity: 'Suntory Group',
    status: 'not_classified_by_oummah',
    evidence: [{ sourceType: 'positive_registry', sourceName: 'Suntory Beverage & Food France — pages officielles À propos / Marques', sourceUrl: 'https://suntorybeverageandfood-europe.com/fr-fr/france/', statement: 'Suntory Beverage & Food France liste Orangina parmi ses marques et indique faire partie du groupe Suntory.', verifiedAt: VERIFIED_RELATIONS_DATE, confidence: 'high' }],
    lastVerifiedAt: VERIFIED_RELATIONS_DATE,
    resolverVersion: COMMERCIAL_ENTITY_REPOSITORY_VERSION,
    identityConfidence: 'high',
    ownershipConfidence: 'high',
    ownershipEvidence: [{ brandCanonicalName: 'Orangina', canonicalEntity: 'Orangina', ownerEntity: 'Suntory Beverage & Food France', parentEntity: 'Suntory Group', sourceType: 'official', sourceName: 'Suntory Beverage & Food France — pages officielles À propos / Marques', sourceUrl: 'https://suntorybeverageandfood-europe.com/fr-fr/france/', sourceTitle: 'Suntory Beverage & Food France — marques', evidenceLevel: 'official', confidence: 'high', verifiedAt: VERIFIED_RELATIONS_DATE, market: 'France', notes: 'Suntory Beverage & Food France liste Orangina parmi ses marques et indique faire partie du groupe Suntory.' }],
    classificationEvidence: { canonicalEntity: 'Orangina', parentEntity: 'Suntory Group', ownershipEvidence: 'Preuve officielle Suntory Beverage & Food France.', identitySources: ['official_ownership_registry'], catalogVersion: COMMERCIAL_ENTITY_REPOSITORY_VERSION, checkedAt: VERIFIED_RELATIONS_DATE, matchedBoycottEntries: [] },
  },
  {
    id: 'commercial-yass',
    canonicalName: 'YASS',
    aliases: ['YASS', 'Pinky', 'Pinky Lemonade'],
    owner: 'SOLINEST SAS',
    status: 'not_classified_by_oummah',
    evidence: [{ sourceType: 'positive_registry', sourceName: 'YASS — site officiel / mentions légales', sourceUrl: 'https://www.drinkyass.com/', statement: 'Le site officiel YASS présente Pinky Lemonade comme produit YASS et les informations légales identifient SOLINEST SAS comme éditeur/opérateur.', verifiedAt: VERIFIED_RELATIONS_DATE, confidence: 'high' }],
    lastVerifiedAt: VERIFIED_RELATIONS_DATE,
    resolverVersion: COMMERCIAL_ENTITY_REPOSITORY_VERSION,
    identityConfidence: 'high',
    ownershipConfidence: 'high',
    ownershipEvidence: [{ brandCanonicalName: 'YASS', canonicalEntity: 'YASS', ownerEntity: 'SOLINEST SAS', sourceType: 'official', sourceName: 'YASS — site officiel / mentions légales', sourceUrl: 'https://www.drinkyass.com/', sourceTitle: 'YASS — site officiel', evidenceLevel: 'official', confidence: 'high', verifiedAt: VERIFIED_RELATIONS_DATE, market: 'France', notes: 'Le site officiel YASS présente Pinky Lemonade comme produit YASS et les informations légales identifient SOLINEST SAS comme éditeur/opérateur.' }],
    classificationEvidence: { canonicalEntity: 'YASS', ownershipEvidence: 'Preuve officielle YASS/SOLINEST SAS.', identitySources: ['official_ownership_registry'], catalogVersion: COMMERCIAL_ENTITY_REPOSITORY_VERSION, checkedAt: VERIFIED_RELATIONS_DATE, matchedBoycottEntries: [] },
  },
];

function normalize(value: string) {
  return value.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function compact(value: string) { return value.replace(/\s+/g, ''); }

function identityMatches(candidate: string, term: string) {
  if (candidate === term || compact(candidate) === compact(term)) return true;
  const boundary = new RegExp(`(?:^| )${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?:$| )`);
  if (term.length >= 5 && boundary.test(candidate)) return true;
  const suffix = compact(candidate).startsWith(compact(term)) ? compact(candidate).slice(compact(term).length) : '';
  return Boolean(suffix && /^(?:mini|zero|light|diet|original|classic|sugar|sucres|sans|cola|drink)/.test(suffix));
}

// Brand names that are also everyday words ("Gourmet", "Simply"…). They only count when the
// record's parent group is also present in the identity fields, and never from the product name.
const AMBIGUOUS_BRAND_TERMS = new Set([
  'bakers', 'bare', 'beyond', 'bonjour', 'boost', 'caro', 'chef', 'ciel', 'crunch', 'crystal', 'essentia', 'evolve', 'extreme', 'felix', 'fitness', 'georgia', 'gourmet',
  'kas', 'lion', 'matrix', 'nuts', 'perfecto', 'propel', 'resource', 'santa clara', 'simply', 'starry', 'wagner',
]);

function identityValues(input: CommercialIdentityInput) {
  return [input.brands, ...(input.brands?.split(',') ?? []), ...(input.brandsTags ?? []), input.brandOwner, input.manufacturer, input.company, input.owner, input.parentCompany, input.group, input.manufacturingPlaces]
    .filter((value): value is string => Boolean(value?.trim())).map(normalize).filter(Boolean);
}

function inputValues(input: CommercialIdentityInput) {
  return [...identityValues(input), ...(input.productName?.trim() ? [normalize(input.productName)] : [])].filter(Boolean);
}

// "Bright Dairy & Food / Tnuva" or "Israel Aerospace Industries (IAI)" are matched on each part too.
function nameVariants(value: string) {
  const parts = [value, ...value.split(/\s+\/\s+/), value.replace(/\s*\([^)]*\)\s*/g, ' '), ...[...value.matchAll(/\(([^)]+)\)/g)].map((match) => match[1])];
  return parts.filter((part) => part.trim());
}

function directTerms(record: CommercialEntityRecord) {
  return [...new Set([record.canonicalName, ...record.aliases].flatMap(nameVariants).map(normalize).filter(Boolean))];
}

function parentTerms(record: CommercialEntityRecord) {
  return [...new Set([record.parentEntity, record.owner].filter((value): value is string => Boolean(value?.trim())).map(normalize).filter(Boolean))];
}

function recordTerms(record: CommercialEntityRecord) {
  return [...directTerms(record), ...parentTerms(record)];
}

export function boycottEntityToCommercialRecord(entity: BoycottEntity): CommercialEntityRecord {
  const evidence = entity.sources.map((source) => ({ sourceType: 'boycott_catalog' as const, sourceName: source.label, sourceUrl: source.url, statement: entity.summary, verifiedAt: entity.lastVerifiedAt, confidence: 'high' as const }));
  return { id: entity.id, canonicalName: entity.name, aliases: entity.aliases ?? [], parentEntity: entity.parentGroup, status: 'boycott', evidence, lastVerifiedAt: entity.lastVerifiedAt, resolverVersion: COMMERCIAL_ENTITY_REPOSITORY_VERSION, boycottEntity: entity, ownershipConfidence: 'unresolved', identityConfidence: 'high' };
}

function allRecords(catalog: BoycottEntity[]) {
  return [...catalog.map(boycottEntityToCommercialRecord), ...positiveRecords];
}

type RecordMatch = { record: CommercialEntityRecord; matches: string[]; score: number };

// Identity fields (brands, owner, manufacturer…) match every term; the product name only matches
// distinctive brand names. A brand/alias hit outranks a parent-group-only hit.
function matchRecord(identity: string[], productNames: string[], record: CommercialEntityRecord): RecordMatch {
  const parents = parentTerms(record);
  const parentHits = parents.filter((term) => identity.some((candidate) => identityMatches(candidate, term)));
  const directHits = directTerms(record).filter((term) => {
    if (AMBIGUOUS_BRAND_TERMS.has(term)) return parentHits.length > 0 && identity.some((candidate) => identityMatches(candidate, term));
    return identity.some((candidate) => identityMatches(candidate, term)) || productNames.some((candidate) => identityMatches(candidate, term));
  });
  const parentNameHits = parentHits.length ? [] : parents.filter((term) => productNames.some((candidate) => identityMatches(candidate, term)));
  const matches = [...new Set([...directHits, ...parentHits, ...parentNameHits])];
  return { record, matches, score: directHits.length * 10 + parentHits.length + parentNameHits.length };
}

function bestMatch(identity: string[], productNames: string[], records: CommercialEntityRecord[]) {
  return records
    .map((record) => matchRecord(identity, productNames, record))
    .filter(({ matches }) => matches.length)
    .sort((a, b) => b.score - a.score)[0];
}

export function getCommercialEntity(name: string, catalog: BoycottEntity[] = []) {
  const normalized = normalize(name);
  return allRecords(catalog).find((record) => recordTerms(record).some((term) => identityMatches(normalized, term)));
}

export function resolveCommercialEntity(input: CommercialIdentityInput, catalog: BoycottEntity[] = []) {
  const normalizedEntities = [...new Set(inputValues(input))];
  const identity = [...new Set(identityValues(input))];
  // "Lipton" + "Ice Tea pêche" must reach the "Lipton Ice Tea" record, while Lipton hot tea stays apart.
  const productNames = input.productName?.trim() ? [normalize(input.productName), ...(input.brands?.split(',') ?? []).filter((brand) => brand.trim()).map((brand) => normalize(`${brand} ${input.productName}`))] : [];
  const catalogRecords = catalog.map(boycottEntityToCommercialRecord);
  const matchedAliases: string[] = [];
  const positiveMatch = bestMatch(identity, productNames, positiveRecords);

  if (positiveMatch) {
    const relationTerms = [positiveMatch.record.canonicalName, positiveMatch.record.owner, positiveMatch.record.parentEntity, ...positiveMatch.record.aliases]
      .filter((value): value is string => Boolean(value?.trim()))
      .map(normalize);
    const boycottMatch = bestMatch(relationTerms, [], catalogRecords);

    if (boycottMatch) {
      return { record: boycottMatch.record, normalizedEntities, matchedAliases: boycottMatch.matches };
    }
    return { record: positiveMatch.record, normalizedEntities, matchedAliases: positiveMatch.matches };
  }

  const fallbackMatch = bestMatch(identity, productNames, catalogRecords);
  return { record: fallbackMatch?.record, normalizedEntities, matchedAliases: fallbackMatch?.matches ?? matchedAliases };
}

export function resolveCommercialEntityStatus(input: CommercialIdentityInput, catalog: BoycottEntity[] = []) {
  return resolveCommercialEntity(input, catalog).record?.status;
}

export function getCommercialEntityStatus(entityId: string, catalog: BoycottEntity[] = []) {
  return allRecords(catalog).find((record) => record.id === entityId)?.status;
}

export function getCommercialEntityEvidence(entityId: string, catalog: BoycottEntity[] = []) {
  return allRecords(catalog).find((record) => record.id === entityId)?.evidence ?? [];
}

export function isNotClassifiedByOummah(entityId: string, catalog: BoycottEntity[] = []) {
  return getCommercialEntityStatus(entityId, catalog) === 'not_classified_by_oummah';
}

export const isNonBoycottVerified = isNotClassifiedByOummah;

export function isBoycott(entityId: string, catalog: BoycottEntity[] = []) {
  return getCommercialEntityStatus(entityId, catalog) === 'boycott';
}

export function getParentEntity(entityId: string, catalog: BoycottEntity[] = []) {
  return allRecords(catalog).find((record) => record.id === entityId)?.parentEntity;
}

export function getCommercialIdentityProviderStatus() {
  return {
    oummah: { configured: true, usableAtRuntime: true, usableForImportOnly: false },
    openfoodfacts: { configured: true, usableAtRuntime: true, usableForImportOnly: false },
    gs1: { configured: Boolean(process.env.EXPO_PUBLIC_GS1_API_URL && process.env.EXPO_PUBLIC_GS1_API_KEY), usableAtRuntime: Boolean(process.env.EXPO_PUBLIC_GS1_API_URL && process.env.EXPO_PUBLIC_GS1_API_KEY), usableForImportOnly: false },
  } as const;
}

export function auditCommercialChain(name: string, catalog: BoycottEntity[] = []) {
  const input: CommercialIdentityInput = { brands: name, productName: name };
  const lookup = resolveCommercialEntity(input, catalog);
  const record = lookup.record;
  const ownershipEvidence = record?.ownershipEvidence ?? [];
  return {
    input: name,
    canonicalEntity: record?.canonicalName,
    ownerEntity: record?.owner,
    parentEntity: record?.parentEntity,
    identityConfidence: record?.identityConfidence ?? (record ? 'medium' : 'unresolved'),
    ownershipConfidence: record?.ownershipConfidence ?? (ownershipEvidence.length ? 'medium' : 'unresolved'),
    evidence: ownershipEvidence,
    boycottMatches: record?.status === 'boycott' ? [record.id] : [],
    finalStatus: record?.status,
  };
}
