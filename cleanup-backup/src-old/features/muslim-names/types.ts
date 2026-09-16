export type NameGender = 'boy' | 'girl';
export type NameStatus = 'recommended' | 'permitted' | 'note' | 'discouraged' | 'forbidden';
export type NameEditorialLevel = 'sourced' | 'reviewed' | 'catalogue';
export type NameSourceKind = 'quran' | 'hadith' | 'linguistic' | 'historical' | 'catalogue' | 'editorial';
export type NameSource = {
  kind: NameSourceKind;
  label: string;
  reference?: string;
  url?: string;
  supports: string[];
  note?: string;
};
export type NameTag =
  | 'court'
  | 'rare'
  | 'classique'
  | 'coranique'
  | 'prophete'
  | 'compagnon'
  | 'sahabiyya'
  | 'foi'
  | 'force'
  | 'sagesse'
  | 'doux'
  | 'facile-france';

export type MuslimName = {
  id: string;
  gender: NameGender;
  name: string;
  arabic: string;
  transliteration: string;
  pronunciation?: string;
  origin: string[];
  meaning: string;
  story: string;
  status: NameStatus;
  statusReason: string;
  variants: string[];
  tags: NameTag[];
  historicalRole?: string;
  quranReference?: string;
  sourceNote?: string;
  nuance?: string;
  language?: string[];
  culture?: string[];
  etymology?: string;
  meaningConfidence?: 'high' | 'medium' | 'to-review';
  sources?: NameSource[];
  editorialLevel?: NameEditorialLevel;
};

export const NAME_STATUS_META: Record<NameStatus, { label: string; symbol: string; description: string }> = {
  recommended: {
    label: 'Recommandé',
    symbol: '✓',
    description: 'Nom explicitement valorisé par un texte ou choix particulièrement noble par son sens et son précédent.',
  },
  permitted: {
    label: 'Permis',
    symbol: '✓',
    description: 'Aucun problème religieux connu dans son sens ou son usage.',
  },
  note: {
    label: 'À connaître',
    symbol: '△',
    description: 'Prénom permis, mais une nuance de sens, d’origine ou d’usage mérite d’être connue.',
  },
  discouraged: {
    label: 'Déconseillé',
    symbol: '!',
    description: 'Mieux vaut privilégier un autre choix en raison du sens ou de l’usage.',
  },
  forbidden: {
    label: 'Interdit',
    symbol: '✕',
    description: 'Le nom entre dans une interdiction religieuse claire.',
  },
};
