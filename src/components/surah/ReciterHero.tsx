import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useMemo, useState, type ReactNode } from 'react';
import { Animated, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useReciter } from '../../context/ReciterProvider';
import { useI18n } from '../../i18n';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { useDoubleTapGesture } from './PlayerGestures';
import ReciterImage from './ReciterImage';
import ReciterTransition, { type ReciterTransitionData } from './ReciterTransition';

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
  progressContent?: ReactNode;
  surahNumber: number;
  surahArabicName: string;
  surahFrenchName: string;
  onBack?: () => void;
  onMenu?: () => void;
  rangeStart: number;
  rangeEnd: number;
  onRangeStartChange: (value: number) => void;
  onRangeEndChange: (value: number) => void;
  onPlayRange: () => void;
  onTogglePlay: () => void;
  onStop: () => void;
  onSkipBackward: () => void;
  onSkipForward: () => void;
  onPrevious: () => void;
  onNext: () => void;
  previousDisabled?: boolean;
  nextDisabled?: boolean;
  transportDisabled?: boolean;
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
  progressContent,
  surahNumber,
  surahFrenchName,
  onBack,
  onMenu,
  rangeStart,
  rangeEnd,
  onRangeStartChange,
  onRangeEndChange,
  onPlayRange,
  onTogglePlay,
  onStop,
  onSkipBackward,
  onSkipForward,
  onPrevious,
  onNext,
  previousDisabled = false,
  nextDisabled = false,
  transportDisabled = false,
}: ReciterHeroProps) {
  const { t } = useI18n();
  const { currentReciter } = useReciter();
  const portraitGesture = useDoubleTapGesture(onReciterDoubleTap);
  const [rangeExpanded, setRangeExpanded] = useState(false);

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
    <View style={[styles.hero, { height: height + (rangeExpanded ? 58 : 0) }]}>
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
        <View style={[styles.artwork, { height: height - 175 }]}>
          <ReciterImage isPlaying={isPlaying} />
        </View>

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
                  accessibilityRole="button"
                  onPress={onMenu}
                  style={({ pressed }) => [styles.roundButton, pressed && styles.pressed]}
                >
                  <Ionicons name="ellipsis-horizontal" size={20} color={colors.text} />
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

            <View style={[styles.identity, rangeExpanded && { bottom: 242 }]}>
              <Pressable onPress={onReciterPress} accessibilityRole="button" accessibilityLabel={t('recitations.viewReciter', { name: reciter.name })}>
                <Text style={styles.topReciterName}>{reciter.name}</Text>
              </Pressable>
              <Text
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.6}
                style={[
                  styles.title,
                  surahFrenchName.length > 14 && styles.titleLong,
                ]}
              >
                {surahName}
              </Text>

              <Text style={styles.subtitle}>{surahFrenchName}</Text>

              <Pressable onPress={onFavorite} accessibilityRole="button" accessibilityLabel={t('recitations.favorite')} accessibilityState={{ selected: isFavorite }} style={styles.surahFavorite}>
                <Ionicons name={isFavorite ? 'heart' : 'heart-outline'} size={22} color={colors.goldLight} />
              </Pressable>
            </View>

            <View style={styles.transportPosition}>
              {progressContent}
              <LinearGradient
                colors={['rgba(34,20,49,0.94)', 'rgba(12,9,24,0.97)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.transportBar}
              >
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t('audio.restartOrPreviousSurah')}
                  disabled={previousDisabled}
                  onPress={onPrevious}
                  style={({ pressed }) => [styles.transportButton, previousDisabled && styles.transportDisabled, pressed && styles.transportPressed]}
                >
                  <Ionicons name="play-skip-back" size={17} color={previousDisabled ? colors.textMuted : stylesConstants.premiumGoldLight} />
                </Pressable>

                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t('audio.skipBackFiveSeconds')}
                  disabled={transportDisabled}
                  onPress={onSkipBackward}
                  style={({ pressed }) => [styles.transportButton, transportDisabled && styles.transportDisabled, pressed && styles.transportPressed]}
                >
                  <Text style={[styles.seekLabel, transportDisabled && styles.seekLabelDisabled]}>−5</Text>
                </Pressable>

                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={isPlaying ? t('common.pause') : t('audio.startPlayback')}
                  onPress={onTogglePlay}
                  style={({ pressed }) => [styles.transportPlayButton, pressed && styles.transportPlayPressed]}
                >
                  <Ionicons name={isPlaying ? 'pause' : 'play'} size={20} color={colors.background} style={!isPlaying ? styles.transportPlayIcon : undefined} />
                </Pressable>

                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t('audio.stopAndRestart')}
                  disabled={transportDisabled}
                  onPress={onStop}
                  style={({ pressed }) => [styles.transportButton, transportDisabled && styles.transportDisabled, pressed && styles.transportPressed]}
                >
                  <Ionicons name="stop" size={14} color={transportDisabled ? colors.textMuted : stylesConstants.premiumGoldLight} />
                </Pressable>

                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t('audio.skipForwardFiveSeconds')}
                  disabled={transportDisabled}
                  onPress={onSkipForward}
                  style={({ pressed }) => [styles.transportButton, transportDisabled && styles.transportDisabled, pressed && styles.transportPressed]}
                >
                  <Text style={[styles.seekLabel, transportDisabled && styles.seekLabelDisabled]}>+5</Text>
                </Pressable>

                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t('audio.next')}
                  disabled={nextDisabled}
                  onPress={onNext}
                  style={({ pressed }) => [styles.transportButton, nextDisabled && styles.transportDisabled, pressed && styles.transportPressed]}
                >
                  <Ionicons name="play-skip-forward" size={17} color={nextDisabled ? colors.textMuted : stylesConstants.premiumGoldLight} />
                </Pressable>
              </LinearGradient>
              <View style={styles.rangePanel}>
                <Pressable onPress={() => setRangeExpanded((value) => !value)} accessibilityRole="button" accessibilityState={{ expanded: rangeExpanded }} style={styles.rangeSummary}>
                  <Text style={styles.rangeTitle}>{t('audio.listenToVerseRange')}</Text>
                  <Text style={styles.rangeValue}>{rangeStart} – {rangeEnd}</Text>
                  <Ionicons name={rangeExpanded ? 'chevron-up' : 'chevron-down'} size={16} color={colors.goldMuted} />
                </Pressable>
                {rangeExpanded ? <View style={styles.rangeControls}>
                  <RangeControl label={t('audio.from')} value={rangeStart} minimum={1} maximum={rangeEnd} onChange={onRangeStartChange} />
                  <RangeControl label={t('audio.to')} value={rangeEnd} minimum={rangeStart} maximum={verses} onChange={onRangeEndChange} />
                  <Pressable onPress={onPlayRange} accessibilityLabel={t('audio.startPlayback')} style={({ pressed }) => [styles.rangePlay, pressed && styles.pressed]}>
                    <Ionicons name="play" size={15} color={colors.background} />
                  </Pressable>
                </View> : null}
              </View>
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

function RangeControl({ label, value, minimum, maximum, onChange }: { label: string; value: number; minimum: number; maximum: number; onChange: (value: number) => void }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  return (
    <>
      <Pressable onPress={() => setOpen(true)} style={styles.rangeControl}>
        <Text style={styles.rangeLabel}>{label}</Text>
        <Text style={styles.rangeValue}>{value}</Text>
        <Ionicons name="chevron-down" size={13} color={colors.goldMuted} />
      </Pressable>
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.rangeModalBackdrop} onPress={() => setOpen(false)}>
          <Pressable style={styles.rangeModal} onPress={(event) => event.stopPropagation()}>
            <Text style={styles.rangeModalTitle}>{t('audio.verseBoundary', { boundary: label.toLowerCase() })}</Text>
            <ScrollView style={styles.rangeList} contentContainerStyle={styles.rangeListContent}>
              {Array.from({ length: maximum - minimum + 1 }, (_, index) => minimum + index).map((item) => (
                <Pressable
                  key={item}
                  onPress={() => {
                    onChange(item);
                    setOpen(false);
                  }}
                  style={[styles.rangeOption, item === value && styles.rangeOptionActive]}
                >
                  <Text style={[styles.rangeOptionText, item === value && styles.rangeOptionTextActive]}>{item}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </>
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
  artwork: { position: 'absolute', top: 0, left: 0, right: 0, overflow: 'hidden' },
  surahFavorite: { position: 'absolute', bottom: 8, right: 0, width: 44, height: 44, borderRadius: 22, borderWidth: 1, borderColor: colors.borderSoft, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(8,7,19,0.5)' },
  rangeSummary: { minHeight: 40, flexDirection: 'row', alignItems: 'center', gap: 8 },
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
    width: 46,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 23,
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
    bottom: 184,
    left: 24,
    right: 24,
    alignItems: 'flex-start',
    paddingRight: 46,
    zIndex: 4,
  },

  title: {
    color: colors.text,
    fontFamily: typography.serifSemibold,
    fontSize: 29,
    lineHeight: 34,
    fontWeight: '700',
    textAlign: 'left',
    textShadowColor: 'rgba(0,0,0,0.82)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 18,
  },

  titleLong: {
    maxWidth: '100%',
    fontSize: 21,
    lineHeight: 25,
  },

  subtitle: {
    marginTop: 5,
    color: stylesConstants.premiumGold,
    fontFamily: typography.sans,
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'left',
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

  transportPosition: {
    position: 'absolute',
    right: 24,
    bottom: 10,
    left: 24,
  },

  transportBar: {
    height: 62,
    marginTop: 6,
    paddingHorizontal: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 23,
    borderWidth: 0,
    borderColor: 'rgba(216,182,90,0.48)',
    shadowColor: stylesConstants.premiumGold,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 9,
    elevation: 5,
  },

  transportButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(216,182,90,0.25)',
    backgroundColor: 'rgba(8,7,19,0.46)',
  },

  transportPlayButton: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 24,
    backgroundColor: stylesConstants.premiumGold,
    shadowColor: stylesConstants.premiumGold,
    shadowOpacity: 0.42,
    shadowRadius: 7,
    elevation: 5,
  },

  transportPlayIcon: { marginLeft: 2 },
  transportPressed: { opacity: 0.58, transform: [{ scale: 0.94 }] },
  transportPlayPressed: { opacity: 0.78, transform: [{ scale: 0.94 }] },
  transportDisabled: { opacity: 0.34 },
  seekLabel: { color: stylesConstants.premiumGoldLight, fontFamily: typography.sans, fontSize: 11, fontWeight: '800' },
  seekLabelDisabled: { color: colors.textMuted },

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
    bottom: 190,
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
  topReciterName: { marginBottom: 8, color: colors.text, fontFamily: typography.serifMedium, fontSize: 17, lineHeight: 22, textShadowColor: 'rgba(0,0,0,0.9)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 7 },
  reciterHint: { marginTop: 3, color: colors.textMuted, fontFamily: typography.sans, fontSize: 9, textAlign: 'center' },
  rangePanel: { marginTop: 8, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 16, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderSoft },
  rangeTitle: { flex: 1, color: colors.text, fontFamily: typography.sans, fontSize: 11, fontWeight: '600' },
  rangeControls: { marginTop: 6, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  rangeControl: { minWidth: 70, height: 34, paddingHorizontal: 5, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderRadius: 10, backgroundColor: 'rgba(126,78,151,0.28)' },
  rangeLabel: { marginRight: 4, color: colors.textMuted, fontFamily: typography.sans, fontSize: 9 },
  rangeValue: { minWidth: 22, color: colors.goldLight, fontFamily: typography.sans, fontSize: 13, fontWeight: '800', textAlign: 'center' },
  rangeArrow: { padding: 3 },
  rangePlay: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center', borderRadius: 17, backgroundColor: colors.goldLight },
  rangeModalBackdrop: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: 'rgba(0,0,0,0.68)' },
  rangeModal: { width: '100%', maxWidth: 340, maxHeight: '70%', padding: 16, borderRadius: 22, backgroundColor: colors.backgroundSecondary, borderWidth: 1, borderColor: colors.goldDark },
  rangeModalTitle: { marginBottom: 10, color: colors.goldLight, fontFamily: typography.serifMedium, fontSize: 21, textAlign: 'center' },
  rangeList: { maxHeight: 360 },
  rangeListContent: { gap: 6 },
  rangeOption: { minHeight: 42, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: colors.purpleDeep },
  rangeOptionActive: { backgroundColor: colors.surfaceLight, borderWidth: 1, borderColor: colors.goldDark },
  rangeOptionText: { color: colors.textSecondary, fontFamily: typography.sans, fontSize: 15, fontWeight: '700' },
  rangeOptionTextActive: { color: colors.goldLight },

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
