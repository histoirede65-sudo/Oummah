import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo } from 'react';
import {
  Animated,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { preloadReciterArtwork } from '../../features/audio/presentation/reciterArtwork';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { DEFAULT_ARTWORK_THEME } from './ArtworkLighting';
import DynamicArtwork, {
  type ArtworkFraming,
} from './DynamicArtwork';
import {
  useReciterTransition,
  type ReciterTransitionData,
} from './ReciterTransition';

const loadedImages = new Set<string>();

function cacheKey(reciter: ReciterTransitionData) {
  return reciter.id;
}

function preload(reciter: ReciterTransitionData | undefined) {
  if (!reciter?.image || loadedImages.has(cacheKey(reciter))) {
    return;
  }

  void preloadReciterArtwork(reciter.image)
    .then((loaded) => {
      if (loaded) {
        loadedImages.add(cacheKey(reciter));
      }
    })
    .catch(() => undefined);
}

function normalizeName(name: string) {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

function getReciterFraming(
  reciter: ReciterTransitionData,
): ArtworkFraming {
  const name = normalizeName(reciter.name);
  const id = normalizeName(reciter.id);

  /*
   * Hani Ar-Rifaï :
   * image moins agrandie et cadrée vers le haut afin de montrer
   * davantage le turban, les épaules et la tenue.
   */
  if (
    name.includes('haniarrifai')
    || name.includes('hanialrifai')
    || id.includes('hani')
    || id.includes('rifai')
  ) {
    return {
      widthPercent: 112,
      heightPercent: 118,
      leftPercent: -6,
      bottomPercent: 0,
      scale: 1.01,
      position: 'top',
    };
  }

  /*
   * Cadrage général du lecteur.
   * Il est nettement moins zoomé que l'ancien réglage à 146 %.
   */
  return {
    widthPercent: 112,
    heightPercent: 120,
    leftPercent: -6,
    bottomPercent: 0,
    scale: 1.01,
    position: 'top',
  };
}

export default function ReciterImage({
  isPlaying,
}: {
  isPlaying: boolean;
}) {
  const {
    reciter,
    previousReciter,
    nextReciter,
    photoOpacity,
  } = useReciterTransition();

  const source = useMemo(
    () => reciter.image,
    [reciter.image],
  );

  const framing = useMemo(
    () => getReciterFraming(reciter),
    [reciter],
  );

  useEffect(() => {
    preload(previousReciter);
    preload(nextReciter);
  }, [
    nextReciter,
    previousReciter,
  ]);

  const initials = reciter.name
    .split(' ')
    .slice(0, 2)
    .map((word) => word[0])
    .join('');

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        StyleSheet.absoluteFill,
        {
          opacity: photoOpacity,
        },
      ]}
    >
      {source ? (
        <DynamicArtwork
          image={source}
          isPlaying={isPlaying}
          theme={DEFAULT_ARTWORK_THEME}
          framing={framing}
        />
      ) : (
        <View style={styles.placeholder}>
          <View style={styles.placeholderHalo} />

          <Ionicons
            name="mic-outline"
            size={32}
            color={colors.goldMuted}
          />

          <Text style={styles.initials}>
            {initials}
          </Text>
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  placeholder: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: '100%',
    height: '125%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.purpleDeep,
  },

  placeholderHalo: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: colors.surfaceLight,
    shadowColor: colors.gold,
    shadowOpacity: 0.1,
    shadowRadius: 18,
    elevation: 2,
  },

  initials: {
    marginTop: 8,
    color: colors.goldMuted,
    fontFamily: typography.serifMedium,
    fontSize: 22,
  },
});
