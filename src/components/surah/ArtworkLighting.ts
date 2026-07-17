export type ArtworkTheme = 'morning' | 'afternoon' | 'evening' | 'night';

export interface ArtworkLightingPalette {
  ambient: string;
  highlight: string;
  halo: string;
  shadow: string;
}

const PALETTES: Readonly<Record<ArtworkTheme, ArtworkLightingPalette>> = {
  morning: {
    ambient: 'rgba(177,205,226,0.035)',
    highlight: 'rgba(211,228,238,0.085)',
    halo: 'rgba(176,199,215,0.04)',
    shadow: '#AFC9DA',
  },
  afternoon: {
    ambient: 'rgba(226,190,130,0.035)',
    highlight: 'rgba(239,205,148,0.085)',
    halo: 'rgba(218,174,99,0.04)',
    shadow: '#D6A963',
  },
  evening: {
    ambient: 'rgba(200,148,58,0.035)',
    highlight: 'rgba(227,181,90,0.085)',
    halo: 'rgba(200,148,58,0.045)',
    shadow: '#C8943A',
  },
  night: {
    ambient: 'rgba(83,45,112,0.045)',
    highlight: 'rgba(116,72,145,0.08)',
    halo: 'rgba(90,43,115,0.045)',
    shadow: '#5A2B73',
  },
};

/** Fixed until a future settings/time source selects the active period. */
export const DEFAULT_ARTWORK_THEME: ArtworkTheme = 'evening';

export function getArtworkLighting(theme: ArtworkTheme): ArtworkLightingPalette {
  return PALETTES[theme];
}
