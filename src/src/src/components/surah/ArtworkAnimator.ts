import { useEffect, useRef } from 'react';
import { Animated, Easing } from 'react-native';

const LIGHTING_HALF_CYCLE = 7000;
export const ARTWORK_BREATHING_HALF_CYCLE = 1900;
const PORTRAIT_BREATHING_HALF_CYCLE = 3000;

export function useArtworkAnimator(isPlaying: boolean) {
  const lightPosition = useRef(new Animated.Value(0)).current;
  const haloScale = useRef(new Animated.Value(1)).current;
  const portraitScale = useRef(new Animated.Value(1)).current;
  const portraitTranslateY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const movement = Animated.loop(
      Animated.sequence([
        Animated.timing(lightPosition, {
          toValue: 1,
          duration: LIGHTING_HALF_CYCLE,
          easing: Easing.inOut(Easing.sin),
          isInteraction: false,
          useNativeDriver: true,
        }),
        Animated.timing(lightPosition, {
          toValue: 0,
          duration: LIGHTING_HALF_CYCLE,
          easing: Easing.inOut(Easing.sin),
          isInteraction: false,
          useNativeDriver: true,
        }),
      ]),
      { resetBeforeIteration: false },
    );
    movement.start();
    return () => movement.stop();
  }, [lightPosition]);

  useEffect(() => {
    const halo = Animated.timing(haloScale, {
      toValue: isPlaying ? 1.05 : 1,
      duration: ARTWORK_BREATHING_HALF_CYCLE,
      easing: Easing.out(Easing.cubic),
      isInteraction: false,
      useNativeDriver: true,
    });
    halo.start();
    return () => halo.stop();
  }, [haloScale, isPlaying]);

  useEffect(() => {
    if (!isPlaying) {
      portraitScale.stopAnimation();
      portraitTranslateY.stopAnimation();
      portraitScale.setValue(1);
      portraitTranslateY.setValue(0);
      return;
    }
    const breathing = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(portraitScale, {
            toValue: 1.018,
            duration: PORTRAIT_BREATHING_HALF_CYCLE,
            easing: Easing.inOut(Easing.sin),
            isInteraction: false,
            useNativeDriver: true,
          }),
          Animated.timing(portraitTranslateY, {
            toValue: -3,
            duration: PORTRAIT_BREATHING_HALF_CYCLE,
            easing: Easing.inOut(Easing.sin),
            isInteraction: false,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(portraitScale, {
            toValue: 1,
            duration: PORTRAIT_BREATHING_HALF_CYCLE,
            easing: Easing.inOut(Easing.sin),
            isInteraction: false,
            useNativeDriver: true,
          }),
          Animated.timing(portraitTranslateY, {
            toValue: 0,
            duration: PORTRAIT_BREATHING_HALF_CYCLE,
            easing: Easing.inOut(Easing.sin),
            isInteraction: false,
            useNativeDriver: true,
          }),
        ]),
      ]),
      { resetBeforeIteration: false },
    );
    breathing.start();
    return () => breathing.stop();
  }, [isPlaying, portraitScale, portraitTranslateY]);

  return {
    haloScale,
    portraitScale,
    portraitTranslateY,
    lightTranslateX: lightPosition.interpolate({
      inputRange: [0, 1],
      outputRange: [-18, 18],
    }),
  };
}
