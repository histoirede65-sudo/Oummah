import { typography } from '../../theme/typography';

/** Night palette of the Tahajjud space: deep indigo sky, moonlight, gold of the last third. */
export const night = {
  sky0: '#04030C',
  sky1: '#0A0720',
  sky2: '#151036',
  /** Opaque night surfaces (cards, panels): never see-through, easier on the eyes. */
  glass: '#16122E',
  glassStrong: '#1F1A3A',
  line: 'rgba(196,184,255,0.14)',
  goldLine: 'rgba(227,181,90,0.35)',
  gold: '#E3B55A',
  goldSoft: '#F4D995',
  moon: '#F7EDD2',
  lavender: '#B7ABF2',
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
