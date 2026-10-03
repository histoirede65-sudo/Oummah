// Halal certification bodies — generic model. The source of truth is the Supabase table
// public.halal_certification_bodies (loaded by halalCertificationBodiesLoader); the list below only
// identifies bodies so detection still works offline. Editorial rules: a body's sheet never changes a
// product's halal status by itself; undocumented facts are shown as "Information non vérifiée".

export type HalalSource = { title: string; organisation: string; publishedAt?: string; url: string };
/** verified = independent official source (institution, official document); declared_by_body = the body's own website;
 * reported = identified, dated third party (consumer association survey, trade press quoting the body). */
export type HalalFactStatus = 'verified' | 'declared_by_body' | 'reported';
export type HalalFact = { value: string; status: HalalFactStatus; sources: HalalSource[] };
export type HalalFactKey = 'legalForm' | 'officialApproval' | 'scope' | 'slaughterMethod' | 'stunningPolicy' | 'controlMethod' | 'traceability' | 'audits' | 'accreditation' | 'partners';
export type HalalNoticeLevel = 'historical' | 'vigilance' | 'info';
export type HalalNotice = { id: string; type: string; level: HalalNoticeLevel; title: string; summary: string; scope?: string; issuedBy: string; publishedAt?: string; sources: HalalSource[] };
export type HalalScholarlyNote = { theme: string; text: string; sources: HalalSource[] };
export type HalalDocumentationLevel = 'documented' | 'to_verify' | 'vigilance' | 'insufficient';

// Grid of criteria — never a score. A criterion the body does not publish, and no identified source
// documents, is shown as "Non garanti": nothing public commits the body to it.
export type HalalCriterionKey = 'slaughterer' | 'tasmiya' | 'noStunning' | 'manualSlaughter' | 'permanentControl' | 'traceability' | 'ingredients' | 'noPork' | 'noMSM';
/** yes / partial = stated by the body (or verified); no = the body (or a cited source) says it accepts the practice; missing = "Non garanti". */
export type HalalCriterionStatus = 'yes' | 'partial' | 'no';
export type HalalCriterion = { status: HalalCriterionStatus; value: string; sourceStatus: HalalFactStatus; sources: HalalSource[] };
/** validity = the religious condition itself is at stake; prudence = goes beyond the condition; quality = no religious condition of its own. */
export type HalalCriterionKind = 'validity' | 'prudence' | 'quality';
export type HalalReligiousGuideId = 'stunning' | 'tasmiya' | 'slaughterer' | 'mechanical' | 'contamination';
export type HalalCriterionDefinition = { key: HalalCriterionKey; label: string; kind: HalalCriterionKind; rule: string; guideId?: HalalReligiousGuideId };

export const HALAL_CRITERIA: HalalCriterionDefinition[] = [
  { key: 'slaughterer', label: 'Sacrificateur musulman', kind: 'prudence', guideId: 'slaughterer', rule: 'Condition de validité : un musulman ou un homme du Livre. Exiger un musulman est une précaution supplémentaire.' },
  { key: 'tasmiya', label: 'Invocation sur chaque bête', kind: 'validity', guideId: 'tasmiya', rule: 'Condition exigée par les savants retenus ; divergence sur le cas de l’oubli.' },
  { key: 'noStunning', label: 'Sans étourdissement', kind: 'prudence', guideId: 'stunning', rule: 'Condition de validité : la bête doit être vivante au moment de l’égorgement. Refuser tout étourdissement écarte le risque d’une bête morte avant.' },
  { key: 'manualSlaughter', label: 'Abattage manuel', kind: 'prudence', guideId: 'mechanical', rule: 'La machine est permise si sa lame tranche la gorge et que l’invocation est prononcée ; l’abattage manuel est une précaution.' },
  { key: 'permanentControl', label: 'Contrôleur présent en permanence', kind: 'prudence', guideId: 'contamination', rule: 'Permet d’attester les conditions de l’abattage sur chaque bête.' },
  { key: 'traceability', label: 'Traçabilité jusqu’au conditionnement', kind: 'prudence', guideId: 'contamination', rule: 'Garantit que la viande vendue est celle qui a été contrôlée, sans mélange.' },
  { key: 'ingredients', label: 'Contrôle des ingrédients et additifs', kind: 'prudence', guideId: 'contamination', rule: 'Écarte le porc, ses dérivés et les viandes non conformes dans les produits transformés.' },
  { key: 'noPork', label: 'Aucun site manipulant du porc', kind: 'prudence', guideId: 'contamination', rule: 'Précaution contre la contamination ; la règle exige au minimum de laver ce qui a été souillé.' },
  { key: 'noMSM', label: 'Refus de la VSM', kind: 'quality', rule: 'Critère de qualité (viande séparée mécaniquement), sans condition religieuse propre.' },
];

export const HALAL_CRITERION_KIND_LABELS: Record<HalalCriterionKind, string> = { validity: 'Condition religieuse', prudence: 'Précaution', quality: 'Qualité' };

export type HalalQuranRef = { reference: string; text: string };
export type HalalTextRef = { reference: string; text: string; sources: HalalSource[] };
export type HalalCompanionRef = { name: string; text: string; reference: string; sources: HalalSource[] };
export type HalalScholarRef = { scholar: string; position: string; reference: string; sources: HalalSource[] };
export type HalalReligiousGuide = {
  id: HalalReligiousGuideId;
  title: string;
  question: string;
  quran: HalalQuranRef[];
  sunnah: HalalTextRef[];
  companions: HalalCompanionRef[];
  scholars: HalalScholarRef[];
  agreement?: string;
  divergence?: string;
  reading?: string;
  lastVerifiedAt: string;
};

export type HalalCertificationBody = {
  id: string;
  name: string;
  fullName?: string;
  aliases: string[];
  offLabelTags: string[];
  logoUrl?: string;
  country?: string;
  officialWebsite?: string;
  bodyType?: string;
  documentationLevel: HalalDocumentationLevel;
  summary: string;
  facts: Partial<Record<HalalFactKey, HalalFact>>;
  criteria: Partial<Record<HalalCriterionKey, HalalCriterion>>;
  warnings: HalalNotice[];
  criticisms: HalalNotice[];
  scholarlyNotes: HalalScholarlyNote[];
  sources: HalalSource[];
  lastVerifiedAt: string;
};
/** @deprecated kept for existing imports. */
export type HalalCertifier = HalalCertificationBody;

export const HALAL_FACT_LABELS: Record<HalalFactKey, string> = {
  legalForm: 'Statut et création',
  officialApproval: 'Agrément officiel',
  scope: 'Périmètre',
  slaughterMethod: 'Méthode d’abattage',
  stunningPolicy: 'Étourdissement / électronarcose',
  controlMethod: 'Contrôle (permanent ou ponctuel)',
  traceability: 'Traçabilité',
  audits: 'Audits / contrôleurs',
  accreditation: 'Accréditations',
  partners: 'Partenaires et reconnaissances',
};

export const HALAL_DOCUMENTATION_LABELS: Record<HalalDocumentationLevel, string> = {
  documented: 'Organisme documenté',
  to_verify: 'Organisme à vérifier',
  vigilance: 'Vigilance recommandée',
  insufficient: 'Informations insuffisantes',
};

const OFFLINE_SUMMARY = 'Fiche détaillée indisponible hors connexion.';
function offline(id: string, name: string, aliases: string[], offLabelTags: string[], country?: string): HalalCertificationBody {
  return { id, name, aliases, offLabelTags, country, documentationLevel: 'insufficient', summary: OFFLINE_SUMMARY, facts: {}, criteria: {}, warnings: [], criticisms: [], scholarlyNotes: [], sources: [], lastVerifiedAt: '2026-10-02' };
}

const OFFLINE_BODIES: HalalCertificationBody[] = [
  offline('avs', 'AVS', ['A Votre Service', 'Association À Votre Service', 'AVS Halal'], ['fr:a-votre-service', 'fr:controle-certification-avs-halal', 'fr:avs', 'en:avs'], 'France'),
  offline('argml', 'ARGML', ['Association Rituelle de la Grande Mosquée de Lyon', 'Grande Mosquée de Lyon', 'Mosquée de Lyon'], ['fr:association-rituelle-de-la-grande-mosquee-de-lyon', 'fr:argml', 'en:argml'], 'France'),
  offline('achahada', 'Achahada', ['ACHAHADA'], ['fr:achahada', 'en:achahada'], 'France'),
  offline('sfcvh', 'SFCVH', ['Société Française de Contrôle de Viande Halal'], ['fr:societe-francaise-de-controle-de-viande-halal', 'en:societe-francaise-de-controle-de-viande-halal', 'en:societe-francaise-de-controle-de-viande-halal-grande-mosquee-de-paris', 'fr:sfcvh'], 'France'),
  offline('hqc-france', 'HQC France', ['HQC', 'Halal Quality Control', 'Halal Quality Control France', 'Halal Office France'], ['en:halal-quality-control', 'en:hqc', 'fr:hqc-france', 'fr:halal-quality-control'], 'France'),
  offline('halal-services', 'Halal Services', ['Halal Service', 'Halal Services France'], ['fr:halal-services', 'en:halal-services'], 'France'),
  offline('mosquee-evry', 'Mosquée d’Évry-Courcouronnes', ['Mosquée d\'Évry', 'Mosquee d\'Evry', 'Mosquée d\'Évry-Courcouronnes', 'ACMIF'], ['fr:controle-de-la-mosquee-d-evry-courcouronnes', 'fr:halal-mosquee-courcouronnes', 'fr:mosquee-d-evry'], 'France'),
  offline('grande-mosquee-de-paris', 'Grande Mosquée de Paris', ['Mosquée de Paris', 'Grande Mosquee de Paris'], ['fr:controle-mosquee-de-paris-halal', 'fr:grande-mosquee-de-paris', 'en:grande-mosquee-de-paris'], 'France'),
  offline('hfce', 'HFCE', ['Halal Food Council of Europe'], ['en:halal-food-council-of-europe', 'fr:halal-food-council-of-europe'], 'Belgique'),
  offline('hfa-uk', 'HFA', ['Halal Food Authority'], ['en:halal-food-authority'], 'Royaume-Uni'),
  offline('jakim', 'JAKIM', ['Halal Malaysia'], ['en:halal-malaysia', 'en:jakim'], 'Malaisie'),
  offline('muis', 'MUIS', ['Halal Singapore'], ['en:halal-singapore'], 'Singapour'),
  offline('cicot', 'CICOT', ['Central Islamic Committee of Thailand'], ['en:the-central-islamic-committee-of-thailand'], 'Thaïlande'),
  offline('ifanca', 'IFANCA', ['Islamic Food and Nutrition Council'], ['en:islamic-food-and-nutrition-council-of-canada', 'en:islamic-food-and-nutrition-council-of-america', 'en:ifanca']),
  offline('eurohalal', 'Eurohalal', ['Euro Halal'], ['en:eurohalal']),
  offline('ehz', 'EHZ', ['Europäisches Halal Zertifizierungsinstitut'], ['fr:europaisches-halal-zertifizierungsinstitut', 'en:europaisches-halal-zertifizierungsinstitut'], 'Allemagne'),
];

let bodies: HalalCertificationBody[] = OFFLINE_BODIES;

/** Replaces the in-memory list with the sheets loaded from Supabase (offline identification kept for missing ids). */
export function setHalalCertificationBodies(next: HalalCertificationBody[]) {
  if (!next.length) return;
  const ids = new Set(next.map((body) => body.id));
  bodies = [...next, ...OFFLINE_BODIES.filter((body) => !ids.has(body.id))];
}

export function getHalalCertificationBodies() { return bodies; }

let guides: HalalReligiousGuide[] = [];
export function setHalalReligiousGuides(next: HalalReligiousGuide[]) { if (next.length) guides = next; }
export function getHalalReligiousGuides() { return guides; }
export function getHalalReligiousGuide(id?: HalalReligiousGuideId) { return id ? guides.find((guide) => guide.id === id) ?? null : null; }

function normalize(value: string) { return value.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim(); }
function containsWords(text: string, term: string) { return Boolean(term) && ` ${text} `.includes(` ${term} `); }

/** Finds the body named in Open Food Facts labels ("fr:a-votre-service") or free text ("Halal AVS"). */
export function findHalalCertificationBody(values: string[]): HalalCertificationBody | null {
  const cleaned = values.map((value) => value.trim().toLowerCase()).filter(Boolean);
  for (const body of bodies) {
    if (cleaned.some((value) => body.offLabelTags.some((tag) => value === tag || value.startsWith(`${tag}-`)))) return body;
  }
  const texts = cleaned.map((value) => normalize(value.replace(/^[a-z]{2}:/, '')));
  for (const body of bodies) {
    const terms = [body.name, body.fullName, ...body.aliases].filter((term): term is string => Boolean(term)).map(normalize);
    if (texts.some((text) => terms.some((term) => containsWords(text, term)))) return body;
  }
  return null;
}

export function getHalalCertifier(nameOrId?: string): HalalCertificationBody | null {
  if (!nameOrId) return null;
  return bodies.find((body) => body.id === nameOrId) ?? findHalalCertificationBody([nameOrId]);
}

/** Notices that call for checking a product's certification today (historical notices excluded). */
export function getActiveHalalCertifierNotices(body?: HalalCertificationBody | null) {
  return body?.warnings.filter((notice) => notice.level === 'vigilance') ?? [];
}
