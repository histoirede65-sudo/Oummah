import { Easing } from 'react-native';

/** Shared timing vocabulary. Components must never use raw durations. */
export const animationDurations = {
  fast: 150,
  reciterTransition: 200,
  normal: 250,
  slow: 450,
  hero: 650,
} as const;

/** A single calm curve keeps motion consistent across every module. */
export const animationCurves = {
  premium: Easing.bezier(0.22, 1, 0.36, 1),
} as const;

export const animationValues = {
  hiddenOpacity: 0,
  visibleOpacity: 1,
  subtleGlowOpacity: 0.08,
  activeGlowOpacity: 0.16,
  scaleIn: 0.96,
  scaleOut: 0.96,
  cardPressed: 0.975,
  buttonPressed: 0.94,
  bounceStart: 0.985,
  bouncePeak: 1.012,
  pulsePeak: 1.025,
  heroScale: 0.985,
  heroOffset: 8,
  modalScale: 0.985,
  modalOffset: 6,
  bottomSheetOffset: 28,
} as const;

export type AnimationDurationToken = keyof typeof animationDurations;
