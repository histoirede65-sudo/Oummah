import { Animated } from 'react-native';

import { animationPresets, type AnimatedProperty, type AnimationPreset, type AnimationPresetName } from './AnimationPresets';
import { animationCurves, animationDurations } from './AnimationTokens';

export type PremiumAnimatedValues = Partial<Record<AnimatedProperty, Animated.Value>>;

export interface PremiumAnimationOptions {
  initialize?: boolean;
  loop?: boolean;
}

function propertiesFor(presetName: AnimationPresetName): readonly AnimatedProperty[] {
  const preset: AnimationPreset = animationPresets[presetName];
  return [...new Set<AnimatedProperty>([
    ...Object.keys(preset.initial) as AnimatedProperty[],
    ...preset.stages.flatMap((stage) => stage.parallel.map((item) => item.property)),
  ])];
}

/** Factory for every application animation. No screen should call Animated.timing directly. */
export class PremiumAnimations {
  createValues(presetName: AnimationPresetName): PremiumAnimatedValues {
    const preset: AnimationPreset = animationPresets[presetName];
    return Object.fromEntries(
      propertiesFor(presetName).map((property) => [property, new Animated.Value(preset.initial[property] ?? 0)]),
    ) as PremiumAnimatedValues;
  }

  prepare(presetName: AnimationPresetName, values: PremiumAnimatedValues): void {
    const initial: AnimationPreset['initial'] = animationPresets[presetName].initial;
    propertiesFor(presetName).forEach((property) => {
      const value = values[property];
      const initialValue = initial[property];
      if (value && initialValue !== undefined) value.setValue(initialValue);
    });
  }

  create(
    presetName: AnimationPresetName,
    values: PremiumAnimatedValues,
    options: PremiumAnimationOptions = {},
  ): Animated.CompositeAnimation {
    if (options.initialize !== false) this.prepare(presetName, values);
    const stages = animationPresets[presetName].stages.map((stage) => Animated.parallel(
      stage.parallel.flatMap((item) => {
        const value = values[item.property];
        return value ? [Animated.timing(value, {
          toValue: item.toValue,
          duration: animationDurations[item.duration],
          easing: animationCurves.premium,
          isInteraction: false,
          useNativeDriver: true,
        })] : [];
      }),
    ));
    const animation = Animated.sequence(stages);
    return options.loop ? Animated.loop(animation, { resetBeforeIteration: true }) : animation;
  }

  start(
    presetName: AnimationPresetName,
    values: PremiumAnimatedValues,
    options?: PremiumAnimationOptions,
  ): Animated.CompositeAnimation {
    const animation = this.create(presetName, values, options);
    animation.start();
    return animation;
  }
}

export const premiumAnimations = new PremiumAnimations();
