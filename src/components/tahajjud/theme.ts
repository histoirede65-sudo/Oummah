import { typography } from '../../theme/typography';

/** Night palette of the Tahajjud space: OUMMAH plum night, moonlight, gold of the last third. */
export const night = {
  /** Fond vert discret de tout ce qui permet de valider sa nuit. */
  validateBg: 'rgba(127,216,166,0.13)',
  validateLine: 'rgba(127,216,166,0.38)',
  sky0: '#080713',
  sky1: '#110B1F',
  sky2: '#24123A',
  /** Opaque night surfaces (cards, panels): never see-through, easier on the eyes. */
  glass: '#171026',
  glassStrong: '#211331',
  line: 'rgba(126,78,151,0.35)',
  goldLine: 'rgba(227,181,90,0.35)',
  gold: '#E3B55A',
  goldSoft: '#F4D995',
  moon: '#F7EDD2',
  lavender: '#C9A3DB',
  text: '#FFFFFF',
  textSoft: '#FFFFFF',
  /** Secondary text: white too (no grey in the Qiyam space). */
  muted: '#FFFFFF',
  /** Example text of empty fields, slightly dimmed so it is not mistaken for typed text. */
  placeholder: 'rgba(255,255,255,0.6)',
  success: '#7FD8A6',
} as const;

/** Text styles (family + weight: typography.sansBold is a weight, not a family). */
export const nightType = {
  display: { fontFamily: typography.serifMedium },
  displayBold: { fontFamily: typography.serifSemibold },
  body: { fontFamily: typography.sans, fontWeight: '400' as const },
  medium: { fontFamily: typography.sans, fontWeight: '500' as const },
  semibold: { fontFamily: typography.sans, fontWeight: '600' as const },
  bold: { fontFamily: typography.sans, fontWeight: '700' as const },
  arabic: { fontFamily: typography.arabic },
} as const;
