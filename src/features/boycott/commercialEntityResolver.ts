import type { BoycottEntity } from './domain/BoycottEntity';
import {
  COMMERCIAL_ENTITY_REPOSITORY_VERSION,
  COMMERCIAL_OWNERSHIP_DATA_VERSION,
  resolveCommercialEntity,
  type BoycottResolutionEvidence,
  type CommercialClassificationEvidence,
  type CommercialOwnershipEvidence,
  type CommercialIdentityInput,
} from './commercialEntityRepository';

export type { BoycottResolutionEvidence, CommercialClassificationEvidence, CommercialIdentityInput, CommercialOwnershipEvidence } from './commercialEntityRepository';
export type CommercialResolutionStatus = 'NOT_CLASSIFIED_BY_OUMMAH' | 'UNCLASSIFIED_AFTER_RESOLUTION' | 'NOT_YET_RESOLVED' | 'BOYCOTT';
export type IdentityResolutionConfidence = 'high' | 'medium' | 'low' | 'unresolved';

export type CommercialEntityResolution = {
  status: CommercialResolutionStatus;
  canonicalEntity?: string;
  entity?: BoycottEntity;
  normalizedEntities: string[];
  aliasesMatched: string[];
  resolverInput: CommercialIdentityInput;
  resolverReason: string;
  parentEntity?: string;
  boycottResolverSource: 'catalog' | 'identity_fields' | 'unresolved';
  identityResolutionConfidence: IdentityResolutionConfidence;
  boycottResolutionEvidence: BoycottResolutionEvidence;
  classificationEvidence?: CommercialClassificationEvidence;
  ownershipConfidence: 'high' | 'medium' | 'low' | 'unresolved';
  ownershipEvidence: CommercialOwnershipEvidence[];
};

function identityFields(input: CommercialIdentityInput) {
  return Boolean(input.productName?.trim() && (input.brands?.trim() || input.brandsTags?.length || input.brandOwner?.trim() || input.manufacturer?.trim() || input.company?.trim() || input.owner?.trim() || input.parentCompany?.trim() || input.group?.trim()));
}

function ownershipChain(input: CommercialIdentityInput) {
  const owner = input.parentCompany?.trim() ?? input.brandOwner?.trim() ?? input.owner?.trim() ?? input.company?.trim() ?? input.group?.trim();
  return owner ? { owner, sources: ['brands', input.parentCompany ? 'parent_company' : input.brandOwner ? 'brand_owner' : input.owner ? 'owner' : input.company ? 'company' : 'group'] } : undefined;
}

function evidenceForRecord(record: NonNullable<ReturnType<typeof resolveCommercialEntity>>['record']): BoycottResolutionEvidence {
  const evidence = record?.evidence ?? [];
  return {
    entity: record?.canonicalName,
    parentEntity: record?.parentEntity,
    matchedCatalogEntry: record?.status === 'boycott' ? record.id : undefined,
    matchedAlias: record ? [record.canonicalName, ...record.aliases] : undefined,
    ownershipSource: record?.status === 'boycott' ? 'catalog' : record?.status === 'not_classified_by_oummah' ? 'positive_registry' : 'none',
    resolutionConfidence: record?.status === 'boycott' || record?.status === 'not_classified_by_oummah' ? 'high' : evidence.length ? 'medium' : 'low',
  };
}

export function resolveCanonicalCommercialEntity(catalog: BoycottEntity[], input: CommercialIdentityInput): CommercialEntityResolution {
  const lookup = resolveCommercialEntity(input, catalog);
  const record = lookup.record;
  if (record?.status === 'boycott') return { status: 'BOYCOTT', canonicalEntity: record.canonicalName, entity: record.boycottEntity, normalizedEntities: lookup.normalizedEntities, aliasesMatched: lookup.matchedAliases, resolverInput: input, resolverReason: 'identite commerciale reliee au catalogue boycott', parentEntity: record.parentEntity, boycottResolverSource: 'catalog', identityResolutionConfidence: 'high', boycottResolutionEvidence: evidenceForRecord(record), ownershipConfidence: record.ownershipConfidence ?? 'unresolved', ownershipEvidence: record.ownershipEvidence ?? [] };
  if (record?.status === 'not_classified_by_oummah' && record.identityConfidence === 'high' && record.ownershipConfidence === 'high') return { status: 'NOT_CLASSIFIED_BY_OUMMAH', canonicalEntity: record.canonicalName, normalizedEntities: lookup.normalizedEntities, aliasesMatched: lookup.matchedAliases, resolverInput: input, resolverReason: 'identite et propriete resolues, aucune classification boycott OUMMAH', parentEntity: record.parentEntity, boycottResolverSource: 'identity_fields', identityResolutionConfidence: 'high', boycottResolutionEvidence: evidenceForRecord(record), classificationEvidence: record.classificationEvidence, ownershipConfidence: 'high', ownershipEvidence: record.ownershipEvidence ?? [] };
  if (!lookup.normalizedEntities.length) return { status: 'NOT_YET_RESOLVED', normalizedEntities: [], aliasesMatched: [], resolverInput: input, resolverReason: 'aucune identite commerciale exploitable', boycottResolverSource: 'unresolved', identityResolutionConfidence: 'unresolved', boycottResolutionEvidence: { ownershipSource: 'none', resolutionConfidence: 'unresolved' }, ownershipConfidence: 'unresolved', ownershipEvidence: [] };
  const canonicalEntity = input.brandOwner?.trim() ?? input.brands?.split(',')[0]?.trim() ?? input.brandsTags?.[0]?.trim();
  const chain = ownershipChain(input);
  if (identityFields(input) && chain && canonicalEntity) {
    const checkedAt = new Date().toISOString();
    const ownershipEvidence: CommercialOwnershipEvidence[] = [{ brandCanonicalName: canonicalEntity, canonicalEntity, ownerEntity: chain.owner, parentEntity: chain.owner, sourceType: 'structured_provider', sourceName: 'OpenFoodFacts identity fields', evidenceLevel: 'structured_provider', confidence: 'medium', verifiedAt: checkedAt, market: 'FR', notes: 'Chaine issuee de champs OFF; non suffisante seule pour ownershipConfidence=high.' }];
    const classificationEvidence: CommercialClassificationEvidence = { canonicalEntity, parentEntity: chain.owner, ownershipEvidence: `OFF identity field: ${chain.sources[1]}`, identitySources: chain.sources, catalogVersion: COMMERCIAL_ENTITY_REPOSITORY_VERSION, checkedAt, matchedBoycottEntries: [] };
    return { status: 'UNCLASSIFIED_AFTER_RESOLUTION', canonicalEntity, normalizedEntities: lookup.normalizedEntities, aliasesMatched: lookup.matchedAliases, resolverInput: input, resolverReason: 'chaine issuee de champs OFF mais aucune preuve forte ou concordante suffisante', parentEntity: chain.owner, boycottResolverSource: 'identity_fields', identityResolutionConfidence: 'medium', boycottResolutionEvidence: { entity: canonicalEntity, parentEntity: chain.owner, ownershipSource: 'identity_fields', resolutionConfidence: 'medium' }, classificationEvidence, ownershipConfidence: 'medium', ownershipEvidence };
  }
  if (identityFields(input)) return { status: 'UNCLASSIFIED_AFTER_RESOLUTION', canonicalEntity, normalizedEntities: lookup.normalizedEntities, aliasesMatched: lookup.matchedAliases, resolverInput: input, resolverReason: 'identite resolue mais chaine proprietaire insuffisante', boycottResolverSource: 'identity_fields', identityResolutionConfidence: 'medium', boycottResolutionEvidence: { entity: canonicalEntity, ownershipSource: 'none', resolutionConfidence: 'medium' }, ownershipConfidence: 'unresolved', ownershipEvidence: [] };
  return { status: 'NOT_YET_RESOLVED', canonicalEntity, normalizedEntities: lookup.normalizedEntities, aliasesMatched: lookup.matchedAliases, resolverInput: input, resolverReason: 'identite commerciale incomplete pour conclure', boycottResolverSource: 'unresolved', identityResolutionConfidence: 'unresolved', boycottResolutionEvidence: { entity: canonicalEntity, ownershipSource: 'none', resolutionConfidence: 'unresolved' }, ownershipConfidence: 'unresolved', ownershipEvidence: [] };
}

export const COMMERCIAL_ENTITY_RESOLVER_VERSION = 'commercial-entity-resolver-v6-factual-status';
