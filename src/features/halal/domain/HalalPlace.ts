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
