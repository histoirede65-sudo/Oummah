import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useMemo, type ReactNode } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';

import { useReciter } from '../../context/ReciterProvider';
import { useI18n } from '../../i18n';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { useDoubleTapGesture } from './PlayerGestures';
import ReciterImage from './ReciterImage';
import ReciterInfo from './ReciterInfo';
import ReciterTransition, { type ReciterTransitionData } from './ReciterTransition';
import WaveVisualizer from './WaveVisualizer';

type ReciterHeroProps = {
  previousReciter?: ReciterTransitionData;
  nextReciter?: ReciterTransitionData;
  surahName: string;
  verses: number;
  revelation: string;
  height: number;
  isPlaying: boolean;
  isFavorite?: boolean;
  onFavorite: () => void;
  onReciterPress?: () => void;
  onReciterDoubleTap?: () => void;
  focusContent?: ReactNode;
  verseContent?: ReactNode;
  surahNumber: number;
  surahArabicName: string;
  surahFrenchName: string;
  onBack?: () => void;
  onMenu?: () => void;
};

const NOOP = () => undefined;

export default function ReciterHero({
  previousReciter,
  nextReciter,
  surahName,
  verses,
  revelation,
  height,
  isPlaying,
  isFavorite,
  onFavorite,
  onReciterPress,
  onReciterDoubleTap = NOOP,
  focusContent,
  verseContent,
  surahNumber,
  surahFrenchName,
  onBack,
  onMenu,
}: ReciterHeroProps) {
  const { t } = useI18n();
  const { currentReciter } = useReciter();
  const portraitGesture = useDoubleTapGesture(onReciterDoubleTap);

  const reciter = useMemo<ReciterTransitionData | null>(
    () =>
      currentReciter
        ? {
            id: currentReciter.id,
            name: currentReciter.name,
            country: currentReciter.country,
            style: currentReciter.style,
            image: currentReciter.image,
            recitationCount: currentReciter.availableSurahs,
          }
        : null,
    [currentReciter],
  );

  if (!reciter) return null;

  const palette = getReciterPalette(reciter.id);

  return (
    <View style={[styles.hero, { height }]}>
      <LinearGradient
        pointerEvents="none"
        colors={palette.background}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View pointerEvents="none" style={styles.goldOrbLarge} />
      <View pointerEvents="none" style={styles.goldOrbSmall} />

      <ReciterTransition
        reciter={reciter}
        previousReciter={previousReciter}
        nextReciter={nextReciter}
      >
        <ReciterImage isPlaying={isPlaying} />

        <LinearGradient
          pointerEvents="none"
          colors={[
            'rgba(8,7,19,0.08)',
            'rgba(8,7,19,0.26)',
            'rgba(8,7,19,0.86)',
          ]}
          locations={[0, 0.5, 1]}
          start={{ x: 0, y: 0.2 }}
          end={{ x: 1, y: 0.62 }}
          style={StyleSheet.absoluteFill}
        />

        <LinearGradient
          pointerEvents="none"
          colors={['transparent', colors.background]}
          locations={[0.84, 1]}
          style={StyleSheet.absoluteFill}
        />

        {focusContent ?? (
          <>
            <View style={styles.topBar}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('common.back')}
                onPress={onBack}
                style={({ pressed }) => [styles.roundButton, styles.backButton, pressed && styles.pressed]}
              >
                <Ionicons name="arrow-back" size={28} color={stylesConstants.premiumGold} />
              </Pressable>

              <View style={styles.topActions}>
                <Pressable
                  accessibilityLabel={t('recitations.addFavorite')}
                  onPress={onFavorite}
                  style={({ pressed }) => [styles.roundButton, pressed && styles.pressed]}
                >
                  <Ionicons
                    name={isFavorite ? 'bookmark' : 'bookmark-outline'}
                    size={24}
                    color={stylesConstants.premiumGold}
                  />
                </Pressable>

                <Pressable
                  accessibilityRole="button"
                  onPress={onMenu}
                  style={({ pressed }) => [styles.roundButton, pressed && styles.pressed]}
                >
                  <Ionicons name="ellipsis-horizontal" size={25} color={colors.text} />
                </Pressable>
              </View>
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('recitations.toggleReciterFavorite')}
              onPress={portraitGesture.onPress}
              style={styles.portraitGesture}
            >
              <Animated.View
                pointerEvents="none"
                style={[styles.favoriteFeedback, portraitGesture.heartStyle]}
              >
                <Ionicons name="heart" size={42} color={colors.goldMuted} />
              </Animated.View>
            </Pressable>

            <View style={styles.identity}>
              <Text numberOfLines={1} adjustsFontSizeToFit style={styles.title}>
                {surahFrenchName}
              </Text>

              <Text style={styles.subtitle}>Sourate {surahNumber}  •</Text>

              <ReciterInfo>
                {(displayed) => (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={t('recitations.viewReciter', {
                      name: displayed.name,
                    })}
                    onPress={onReciterPress}
                  >
                    <Text
                      numberOfLines={1}
                      adjustsFontSizeToFit
                      style={styles.reciter}
                    >
                      {displayed.name}
                    </Text>
                  </Pressable>
                )}
              </ReciterInfo>

              <Text style={styles.nowPlaying}>Lecture en cours</Text>
            </View>

            <View style={styles.wave}>
              <WaveVisualizer
                isPlaying={isPlaying}
                progress={0}
                audioLevel={0.58}
              />
            </View>

            {verseContent ? (
              <View pointerEvents="box-none" style={styles.verseOverlay}>
                {verseContent}
              </View>
            ) : null}
          </>
        )}
      </ReciterTransition>
    </View>
  );
}

const stylesConstants = {
  premiumGold: '#D8B65A',
  premiumGoldLight: '#E6D6A8',
} as const;

function getReciterPalette(id: string): {
  background: readonly [string, string, string];
} {
  const palettes = [
    ['#2A183C', '#150C24', '#080713'],
    ['#283042', '#121927', '#080713'],
    ['#3A2419', '#1E1210', '#080713'],
    ['#17342F', '#0E1C1A', '#080713'],
  ] as const;
  const index = [...id].reduce((total, char) => total + char.charCodeAt(0), 0) % palettes.length;
  return { background: palettes[index] };
}

const styles = StyleSheet.create({
  hero: {
    position: 'relative',
    marginTop: 0,
    marginHorizontal: -16,
    overflow: 'hidden',
    backgroundColor: colors.background,
  },

  topBar: {
    position: 'absolute',
    top: 12,
    right: 18,
    left: 18,
    zIndex: 5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  topActions: {
    flexDirection: 'row',
    gap: 10,
  },

  roundButton: {
    width: 58,
    height: 58,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 29,
    borderWidth: 1.3,
    borderColor: 'rgba(216,182,90,0.72)',
    backgroundColor: 'rgba(8,7,19,0.42)',
  },

  backButton: {
    borderColor: 'rgba(126,78,151,0.62)',
  },

  goldOrbLarge: {
    position: 'absolute',
    top: 80,
    left: 52,
    width: 150,
    height: 210,
    borderRadius: 80,
    backgroundColor: 'rgba(216,182,90,0.16)',
    shadowColor: colors.goldLight,
    shadowOpacity: 0.62,
    shadowRadius: 48,
    transform: [{ rotate: '-12deg' }],
  },

  goldOrbSmall: {
    position: 'absolute',
    top: 170,
    right: 28,
    width: 72,
    height: 160,
    borderRadius: 50,
    backgroundColor: 'rgba(216,182,90,0.13)',
    shadowColor: colors.goldLight,
    shadowOpacity: 0.42,
    shadowRadius: 34,
  },

  identity: {
    position: 'absolute',
    top: 138,
    right: 24,
    maxWidth: '48%',
    alignItems: 'flex-end',
    zIndex: 4,
  },

  title: {
    color: colors.text,
    fontFamily: typography.serifSemibold,
    fontSize: 29,
    lineHeight: 34,
    fontWeight: '700',
    textAlign: 'right',
    textShadowColor: 'rgba(0,0,0,0.82)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 18,
  },

  subtitle: {
    marginTop: 5,
    color: stylesConstants.premiumGold,
    fontFamily: typography.sans,
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'right',
  },

  reciter: {
    marginTop: 96,
    color: colors.text,
    fontFamily: typography.sans,
    fontSize: 17,
    fontWeight: '600',
    textAlign: 'right',
  },

  surahRow: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },

  surah: {
    maxWidth: '100%',
    color: stylesConstants.premiumGold,
    fontFamily: typography.arabic,
    fontSize: 42,
    lineHeight: 56,
    fontWeight: '500',
    textAlign: 'right',
    writingDirection: 'rtl',
    textShadowColor: 'rgba(216,182,90,0.35)',
    textShadowOffset: {
      width: 0,
      height: 1,
    },
    textShadowRadius: 8,
  },

  metaRow: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },

  revelation: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: 'rgba(8,7,19,0.58)',
  },

  revelationText: {
    marginLeft: 5,
    color: stylesConstants.premiumGoldLight,
    fontFamily: typography.sans,
    fontSize: 9.5,
    fontWeight: '600',
  },

  metaText: {
    marginLeft: 10,
    color: stylesConstants.premiumGoldLight,
    fontFamily: typography.sans,
    fontSize: 9.5,
  },

  wave: {
    position: 'absolute',
    right: 24,
    bottom: 18,
    left: 24,
  },

  verseOverlay: {
    position: 'absolute',
    right: 16,
    bottom: 42,
    left: 16,
    zIndex: 3,
  },

  pressed: {
    opacity: 0.62,
  },

  portraitGesture: {
    position: 'absolute',
    top: 76,
    right: 0,
    bottom: 72,
    width: '58%',
    zIndex: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },

  favoriteFeedback: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.gold,
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 5,
  },

  nowPlaying: {
    marginTop: 4,
    color: stylesConstants.premiumGoldLight,
    fontFamily: typography.sans,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 2.2,
    textAlign: 'right',
  },

  surahNumberPill: {
    marginTop: 12,
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.goldDark,
    backgroundColor: 'rgba(8,7,19,0.58)',
  },

  surahNumber: {
    color: stylesConstants.premiumGoldLight,
    fontFamily: typography.sans,
    fontSize: 9.5,
    fontWeight: '800',
  },

  surahFrench: {
    marginTop: 2,
    color: colors.text,
    fontFamily: typography.serifMedium,
    fontSize: 24,
    lineHeight: 27,
    textAlign: 'right',
  },

  surahLatin: {
    marginTop: 4,
    color: colors.textSecondary,
    fontFamily: typography.sans,
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'right',
  },
});
