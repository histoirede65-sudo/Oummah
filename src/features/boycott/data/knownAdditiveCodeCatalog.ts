import euCatalogSnapshot from './eu-additive-catalog.json';

export type KnownAdditiveCode = {
  code: string;
  names?: { fr?: string; en?: string };
  canonicalNameFr: string | null;
  canonicalNameEn: string;
  aliases: string[];
  aliasRecords?: Array<{ value: string; language?: string; source: string }>;
  functionCategories: string[];
  functionCategorySource?: string;
  euRegulatoryStatus: string;
  regulatoryReferences: Array<{ authority: string; regulation: string; annex: string; url: string; retrievedAt: string }>;
  catalogVersion?: string;
  retrievedAt?: string;
};

type Snapshot = { entries: KnownAdditiveCode[] };

/** Snapshot généré depuis la base officielle UE ; aucune information de risque n'y figure. */
export const KNOWN_ADDITIVE_CODES: readonly KnownAdditiveCode[] = (euCatalogSnapshot as Snapshot).entries;

export function getKnownAdditiveCode(code: string): KnownAdditiveCode | undefined {
  const normalized = code.trim().toUpperCase().replace(/^E\s*/, 'E');
  return KNOWN_ADDITIVE_CODES.find((item) => item.code === normalized);
}

export function getEuCatalogCoverage() {
  return { totalEuCodes: KNOWN_ADDITIVE_CODES.length, subcodes: KNOWN_ADDITIVE_CODES.filter((item) => /[A-Z]$/.test(item.code)).length };
}
