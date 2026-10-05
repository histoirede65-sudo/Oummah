import type { I18nContextValue, LanguageCode, TranslationKey } from '../../../i18n';

export type HalalPlaceCategory =
  | 'restaurant'
  | 'fast_food'
  | 'butcher'
  | 'grocery'
  | 'bakery'
  | 'other';

export type HalalVerificationStatus =
  | 'verified_certificate'
  | 'declared'
  | 'community'
  | 'unknown';

export type HalalPlaceSource = 'openstreetmap' | 'google' | 'community' | 'oummah';

export type HalalCoordinates = {
  latitude: number;
  longitude: number;
};

export type HalalPlace = HalalCoordinates & {
  id: string;
  name: string;
  category: HalalPlaceCategory;
  address: string;
  distanceMeters: number;
  distanceLabel: string;
  verificationStatus: HalalVerificationStatus;
  verificationLabel: string;
  verificationDetail: string;
  source: HalalPlaceSource;
  phone?: string;
  website?: string;
  googlePlaceId?: string;
  googleMapsUri?: string;
  googleDetailsLoaded?: boolean;
  photoName?: string;
  photoAttribution?: string;
  communityPhotoUrl?: string;
  communityPhotoAttribution?: string;
  openingHours?: string;
  openNow?: boolean;
  cuisine?: string;
  takeaway?: boolean;
  delivery?: boolean;
  wheelchair?: boolean;
  alcohol?: 'yes' | 'no' | 'unknown';
  certificateBody?: string;
  certificateExpiresAt?: string;
  lastCheckedAt?: string;
};

export type HalalSearchFilters = {
  category: HalalPlaceCategory | 'all';
  radiusMeters: number;
  verifiedOnly: boolean;
  openNow: boolean;
  favoritesOnly: boolean;
};

export const HALAL_CATEGORY_LABELS: Record<HalalPlaceCategory, string> = {
  restaurant: 'Restaurant',
  fast_food: 'Fast-food',
  butcher: 'Boucherie',
  grocery: 'Épicerie',
  bakery: 'Boulangerie',
  other: 'Autre commerce',
};

export const DEFAULT_HALAL_FILTERS: HalalSearchFilters = {
  category: 'all',
  radiusMeters: 10_000,
  verifiedOnly: false,
  openNow: false,
  favoritesOnly: false,
};

type Translate = I18nContextValue['t'];

export function halalCategoryLabel(category: HalalPlaceCategory, t: Translate) {
  return t(`halal.category.${category}` as TranslationKey);
}

/** Libellé et explication du niveau de preuve, dans la langue de l'app (les données gardent le texte français). */
export function halalVerificationText(place: HalalPlace, t: Translate) {
  const status = place.verificationStatus;
  const defaultDetail = getHalalVerificationCopy(status).detail;
  // Une contribution peut porter la note de son auteur : elle s'affiche telle quelle.
  const ownNote = (place.source === 'community' || place.source === 'oummah')
    && place.verificationDetail
    && place.verificationDetail !== defaultDetail;
  return {
    label: t(`halal.status.${status}` as TranslationKey),
    detail: ownNote
      ? place.verificationDetail
      : place.source === 'google' && status === 'unknown'
        ? t('halal.detail.google')
        : t(`halal.detail.${status}` as TranslationKey),
  };
}

export function halalDistanceLabel(place: HalalPlace, language: LanguageCode, t: Translate) {
  if (place.source === 'community' && place.distanceMeters === 0) return t('halal.personalAdd');
  const meters = place.distanceMeters;
  if (meters < 1_000) return `${Math.max(1, Math.round(meters))} m`;
  const km = meters / 1_000;
  return `${km.toLocaleString(language === 'fr' ? 'fr-FR' : 'en-GB', { maximumFractionDigits: km < 10 ? 1 : 0 })} km`;
}

/** Google ajoute « , France » à la fin des adresses : inutile dans la liste. */
export function halalDisplayAddress(address: string) {
  return address.replace(/,\s*(France|FR)\s*$/i, '');
}

export function getHalalVerificationCopy(status: HalalVerificationStatus) {
  switch (status) {
    case 'verified_certificate':
      return {
        label: 'Certificat vérifié',
        detail: 'Un justificatif valide a été contrôlé par OUMMAH.',
      };
    case 'declared':
      return {
        label: 'Déclaré halal',
        detail: 'L’établissement ou sa fiche publique indique une offre halal. Aucun certificat n’a été contrôlé par OUMMAH.',
      };
    case 'community':
      return {
        label: 'Signalé par la communauté',
        detail: 'Cette information provient de contributeurs et reste à vérifier.',
      };
    default:
      return {
        label: 'Information à vérifier',
        detail: 'Aucune preuve suffisante n’est disponible pour le moment.',
      };
  }
}
