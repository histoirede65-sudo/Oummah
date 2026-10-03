/**
 * Official product recalls (RappelConso, DGCCRF — Licence Ouverte Etalab 2.0).
 * A recall targets specific lots: the app shows it as a warning to check the package, never as a
 * verdict on every unit of the product.
 */

export type ProductRecall = {
  id: string;
  title: string;
  brand?: string;
  reason?: string;
  risks?: string;
  actions: string[];
  lots: string[];
  publishedAt: string;
  endsAt?: string;
  url?: string;
  imageUrl?: string;
};

type RecallRecord = {
  numero_fiche?: string;
  libelle?: string;
  marque_produit?: string;
  motif_rappel?: string;
  risques_encourus?: string;
  conduites_a_tenir_par_le_consommateur?: string;
  identification_produits?: string[];
  date_publication?: string;
  date_de_fin_de_la_procedure_de_rappel?: string | null;
  lien_vers_la_fiche_rappel?: string;
  liens_vers_les_images?: string;
};

const ENDPOINT = 'https://data.economie.gouv.fr/api/explore/v2.1/catalog/datasets/rappelconso-v2-gtin-espaces/records';
const FIELDS = 'numero_fiche,libelle,marque_produit,motif_rappel,risques_encourus,conduites_a_tenir_par_le_consommateur,identification_produits,date_publication,date_de_fin_de_la_procedure_de_rappel,lien_vers_la_fiche_rappel,liens_vers_les_images';
/** A recall without an end date stops being shown as "in progress" after this delay. */
const OPEN_ENDED_RECALL_MAX_AGE_DAYS = 365;
const CACHE_TTL_MS = 6 * 60 * 60 * 1000;
const REQUEST_TIMEOUT_MS = 5000;

const cache = new Map<string, { at: number; recalls: ProductRecall[] }>();

function capitalize(value?: string) {
  const text = value?.trim();
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : undefined;
}

function readableLotPart(part: string) {
  const date = part.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (date) return `${date[3]}/${date[2]}/${date[1]}`;
  return part
    .replace(/^n°\s*(de\s*)?lot\s*:?\s*/i, 'Lot ')
    .replace(/^date limite de consommation$/i, 'DLC')
    .replace(/^date de durabilit[ée] minimale$/i, 'DDM');
}

/** identification_produits = [gtin, lot, date kind, date, "|gtin", lot, …] → "Lot 73728848 · DLC 07/10/2026". */
export function recallLots(identification: string[] = [], barcode: string): string[] {
  const groups: string[][] = [];
  for (const value of identification) {
    const part = value.replace(/^\|/, '').trim();
    if (value.startsWith('|') || !groups.length) groups.push([]);
    if (part && part !== barcode) groups[groups.length - 1].push(part);
  }
  const lines = groups.map((group) => group.map(readableLotPart).join(' · ').replace(/(DLC|DDM) · /g, '$1 '));
  return Array.from(new Set(lines.filter(Boolean))).slice(0, 8);
}

/** In progress = no end date (and published less than a year ago) or an end date not yet passed. */
export function isRecallActive(record: Pick<RecallRecord, 'date_publication' | 'date_de_fin_de_la_procedure_de_rappel'>, now = new Date()) {
  const end = record.date_de_fin_de_la_procedure_de_rappel;
  if (end) return new Date(`${end.slice(0, 10)}T23:59:59`) >= now;
  const published = record.date_publication ? new Date(record.date_publication) : undefined;
  return Boolean(published && now.getTime() - published.getTime() <= OPEN_ENDED_RECALL_MAX_AGE_DAYS * 86400000);
}

export function toProductRecall(record: RecallRecord, barcode: string): ProductRecall {
  return {
    id: record.numero_fiche ?? record.lien_vers_la_fiche_rappel ?? record.libelle ?? barcode,
    title: capitalize(record.libelle) ?? 'Produit rappelé',
    brand: capitalize(record.marque_produit),
    reason: capitalize(record.motif_rappel),
    risks: capitalize(record.risques_encourus),
    actions: (record.conduites_a_tenir_par_le_consommateur ?? '').split('|').map((item) => capitalize(item)).filter((item): item is string => Boolean(item)),
    lots: recallLots(record.identification_produits, barcode),
    publishedAt: record.date_publication ?? '',
    endsAt: record.date_de_fin_de_la_procedure_de_rappel ?? undefined,
    url: record.lien_vers_la_fiche_rappel,
    imageUrl: record.liens_vers_les_images?.split(/\s|\|/)[0] || undefined,
  };
}

/** Recalls in progress for this exact barcode; an unreachable service returns no recall (never a false alert). */
export async function findActiveRecalls(barcode: string): Promise<ProductRecall[]> {
  const clean = barcode.replace(/\D/g, '');
  if (clean.length < 8) return [];
  const cached = cache.get(clean);
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) return cached.recalls;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const where = encodeURIComponent(`identification_produits="${clean}"`);
    const response = await fetch(`${ENDPOINT}?where=${where}&select=${FIELDS}&order_by=date_publication%20desc&limit=20`, { headers: { Accept: 'application/json' }, signal: controller.signal });
    if (!response.ok) return [];
    const payload = await response.json() as { results?: RecallRecord[] };
    const recalls = (payload.results ?? []).filter((record) => isRecallActive(record)).map((record) => toProductRecall(record, clean));
    cache.set(clean, { at: Date.now(), recalls });
    return recalls;
  } catch {
    return [];
  } finally {
    clearTimeout(timer);
  }
}
