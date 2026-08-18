import { useEffect, useRef } from 'react';
import { Animated, Easing, Image, StyleSheet, type ImageSourcePropType } from 'react-native';

import { colors } from '../../theme/colors';

type AnimatedReciterPortraitProps = {
  photo: ImageSourcePropType;
  isPlaying: boolean;
  onLoad?: () => void;
  onError?: () => void;
};

const HALF_CYCLE_DURATION = 2500;

export default function AnimatedReciterPortrait({ photo, isPlaying, onLoad, onError }: AnimatedReciterPortraitProps) {
  const scale = useRef(new Animated.Value(1)).current;
  const loop = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    if (!isPlaying) {
      loop.current?.stop();
      loop.current = null;
      scale.stopAnimation();
      return;
    }

    const breathing = Animated.loop(
      Animated.sequence([
        Animated.timing(scale, {
          toValue: 1.02,
          duration: HALF_CYCLE_DURATION,
          easing: Easing.inOut(Easing.sin),
          isInteraction: false,
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 1,
          duration: HALF_CYCLE_DURATION,
          easing: Easing.inOut(Easing.sin),
          isInteraction: false,
          useNativeDriver: true,
        }),
      ]),
      { resetBeforeIteration: false },
    );

    loop.current = breathing;
    breathing.start();

    return () => {
      breathing.stop();
      if (loop.current === breathing) loop.current = null;
    };
  }, [isPlaying, scale]);

  return (
    <Animated.View
      pointerEvents="none"
      renderToHardwareTextureAndroid
      shouldRasterizeIOS
      style={[styles.portrait, { transform: [{ scale }] }]}
    >
      <Animated.View style={styles.halo} />
      <Image source={photo} resizeMode="cover" style={styles.image} onLoad={onLoad} onError={onError} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  portrait: {
    position: 'absolute',
    bottom: -34,
    left: -32,
    width: '108%',
    height: '146%',
  },
  halo: {
    position: 'absolute',
    top: '10%',
    right: '14%',
    bottom: '7%',
    left: '8%',
    borderRadius: 999,
    backgroundColor: 'rgba(200,148,58,0.025)',
    shadowColor: colors.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 18,
    elevation: 2,
  },
  image: {
    width: '100%',
    height: '100%',
  },
});
