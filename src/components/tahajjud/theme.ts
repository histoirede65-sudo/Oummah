import { typography } from '../../theme/typography';

/** Night palette of the Tahajjud space: deep indigo sky, moonlight, gold of the last third. */
export const night = {
  sky0: '#04030C',
  sky1: '#0A0720',
  sky2: '#151036',
  glass: 'rgba(255,255,255,0.045)',
  glassStrong: 'rgba(255,255,255,0.08)',
  line: 'rgba(196,184,255,0.14)',
  goldLine: 'rgba(227,181,90,0.35)',
  gold: '#E3B55A',
  goldSoft: '#F4D995',
  moon: '#F7EDD2',
  lavender: '#B7ABF2',
  text: '#F8F4EE',
  textSoft: '#CFC6E2',
  muted: '#8F86A8',
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
