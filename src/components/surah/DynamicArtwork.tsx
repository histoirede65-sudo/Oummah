import { Image } from 'expo-image';
import { memo } from 'react';
import {
  Animated,
  StyleSheet,
  View,
  type ImageSourcePropType,
} from 'react-native';

import { useArtworkAnimator } from './ArtworkAnimator';
import {
  getArtworkLighting,
  type ArtworkTheme,
} from './ArtworkLighting';

export type ArtworkFraming = {
  widthPercent?: number;
  heightPercent?: number;
  leftPercent?: number;
  bottomPercent?: number;
  scale?: number;
  position?: 'center' | 'top' | 'bottom';
};

type DynamicArtworkProps = {
  image: ImageSourcePropType;
  isPlaying: boolean;
  theme: ArtworkTheme;
  framing?: ArtworkFraming;
};

function DynamicArtwork({
  image,
  isPlaying,
  theme,
  framing,
}: DynamicArtworkProps) {
  const lighting = getArtworkLighting(theme);
  const animator = useArtworkAnimator(isPlaying);

  const widthPercent = framing?.widthPercent ?? 104;
  const heightPercent = framing?.heightPercent ?? 130;
  const leftPercent = framing?.leftPercent ?? -2;
  const bottomPercent = framing?.bottomPercent ?? 0;
  const portraitScale = framing?.scale ?? 1;
  const contentPosition = framing?.position ?? 'center';

  const animatedScale = Animated.multiply(
    animator.portraitScale,
    portraitScale,
  );

  return (
    <Animated.View
      pointerEvents="none"
      renderToHardwareTextureAndroid
      shouldRasterizeIOS
      style={[
        styles.portrait,
        {
          width: `${widthPercent}%`,
          height: `${heightPercent}%`,
          left: `${leftPercent}%`,
          bottom: `${bottomPercent}%`,
          transform: [
            { translateY: animator.portraitTranslateY },
            { scale: animatedScale },
          ],
        },
      ]}
    >
      <Animated.View
        style={[
          styles.halo,
          {
            backgroundColor: lighting.halo,
            shadowColor: lighting.shadow,
            transform: [{ scale: animator.haloScale }],
          },
        ]}
      />

      <View style={styles.artworkSurface}>
        <View style={styles.loadingBase} />

        <Image
          source={image}
          contentFit="cover"
          contentPosition={contentPosition}
          cachePolicy="memory-disk"
          priority="high"
          transition={180}
          style={styles.image}
        />

        <View
          pointerEvents="none"
          style={[
            styles.ambient,
            {
              backgroundColor: lighting.ambient,
            },
          ]}
        />
      </View>
    </Animated.View>
  );
}

export default memo(DynamicArtwork);

const styles = StyleSheet.create({
  portrait: {
    position: 'absolute',
  },

  artworkSurface: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },

  loadingBase: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#150C24',
  },

  halo: {
    position: 'absolute',
    top: '-1%',
    right: '-1%',
    bottom: '-1%',
    left: '-1%',
    borderRadius: 999,
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.1,
    shadowRadius: 22,
    elevation: 2,
  },

  image: {
    width: '100%',
    height: '100%',
  },

  ambient: {
    ...StyleSheet.absoluteFillObject,
  },
});
