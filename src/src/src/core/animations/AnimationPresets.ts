import type { AnimationDurationToken } from './AnimationTokens';
import { animationValues } from './AnimationTokens';

export type AnimatedProperty = 'opacity' | 'scale' | 'translateX' | 'translateY';

export interface AnimationStep {
  property: AnimatedProperty;
  toValue: number;
  duration: AnimationDurationToken;
}

export interface AnimationStage {
  parallel: readonly AnimationStep[];
}

export interface AnimationPreset {
  initial: Readonly<Partial<Record<AnimatedProperty, number>>>;
  stages: readonly AnimationStage[];
}

const step = (property: AnimatedProperty, toValue: number, duration: AnimationDurationToken): AnimationStep => ({
  property,
  toValue,
  duration,
});

export const animationPresets = {
  fadeIn: {
    initial: { opacity: animationValues.hiddenOpacity },
    stages: [{ parallel: [step('opacity', animationValues.visibleOpacity, 'normal')] }],
  },
  fadeOut: {
    initial: { opacity: animationValues.visibleOpacity },
    stages: [{ parallel: [step('opacity', animationValues.hiddenOpacity, 'normal')] }],
  },
  scaleIn: {
    initial: { scale: animationValues.scaleIn },
    stages: [{ parallel: [step('scale', 1, 'normal')] }],
  },
  scaleOut: {
    initial: { scale: 1 },
    stages: [{ parallel: [step('scale', animationValues.scaleOut, 'normal')] }],
  },
  softBounce: {
    initial: { scale: animationValues.bounceStart },
    stages: [
      { parallel: [step('scale', animationValues.bouncePeak, 'normal')] },
      { parallel: [step('scale', 1, 'fast')] },
    ],
  },
  softPulse: {
    initial: { scale: 1 },
    stages: [
      { parallel: [step('scale', animationValues.pulsePeak, 'slow')] },
      { parallel: [step('scale', 1, 'slow')] },
    ],
  },
  gentleGlow: {
    initial: { opacity: animationValues.subtleGlowOpacity },
    stages: [
      { parallel: [step('opacity', animationValues.activeGlowOpacity, 'slow')] },
      { parallel: [step('opacity', animationValues.subtleGlowOpacity, 'slow')] },
    ],
  },
  premiumCardPress: {
    initial: { scale: 1 },
    stages: [
      { parallel: [step('scale', animationValues.cardPressed, 'fast')] },
      { parallel: [step('scale', 1, 'fast')] },
    ],
  },
  premiumButtonPress: {
    initial: { scale: 1 },
    stages: [
      { parallel: [step('scale', animationValues.buttonPressed, 'fast')] },
      { parallel: [step('scale', 1, 'fast')] },
    ],
  },
  heroTransition: {
    initial: { opacity: 0, scale: animationValues.heroScale, translateY: animationValues.heroOffset },
    stages: [{
      parallel: [
        step('opacity', 1, 'hero'),
        step('scale', 1, 'hero'),
        step('translateY', 0, 'hero'),
      ],
    }],
  },
  modalTransition: {
    initial: { opacity: 0, scale: animationValues.modalScale, translateY: animationValues.modalOffset },
    stages: [{
      parallel: [
        step('opacity', 1, 'normal'),
        step('scale', 1, 'normal'),
        step('translateY', 0, 'normal'),
      ],
    }],
  },
  bottomSheetTransition: {
    initial: { opacity: 0, translateY: animationValues.bottomSheetOffset },
    stages: [{
      parallel: [
        step('opacity', 1, 'slow'),
        step('translateY', 0, 'slow'),
      ],
    }],
  },
} as const satisfies Record<string, AnimationPreset>;

export type AnimationPresetName = keyof typeof animationPresets;
