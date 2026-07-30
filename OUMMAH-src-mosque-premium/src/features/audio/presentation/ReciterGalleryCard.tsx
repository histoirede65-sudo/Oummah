import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { memo, useEffect, useMemo, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import Reanimated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { useI18n } from '../../../i18n';
import { colors } from '../../../theme/colors';
import { typography } from '../../../theme/typography';
import type { CatalogReciter } from '../domain/audio';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function ReciterGalleryCard({ reciter, selected, onPress, onSelect }: {
  reciter: CatalogReciter;
  selected: boolean;
  onPress: () => void;
  onSelect: () => void;
}) {
  const { t } = useI18n();
  const initials = useMemo(() => reciter.name.split(' ').slice(0, 2).map((word) => word[0]).join(''), [reciter.name]);
  const favoriteScale = useRef(new Animated.Value(1)).current;
  const favoriteRotation = useRef(new Animated.Value(0)).current;
  const favoriteAnimation = useRef<Animated.CompositeAnimation | null>(null);
  const previousSelected = useRef(selected);
  const cardPress = useSharedValue(0);
  const cardPressStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 - cardPress.value * 0.03 }],
    shadowOpacity: 0.1 + cardPress.value * 0.07,
    shadowRadius: 12 + cardPress.value * 3,
    elevation: 3 + cardPress.value * 2,
  }));
  const pressCard = () => {
    cardPress.value = withTiming(1, { duration: 85, easing: Easing.out(Easing.quad) });
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
  };
  const releaseCard = () => {
    cardPress.value = withTiming(0, { duration: 170, easing: Easing.out(Easing.cubic) });
  };

  useEffect(() => {
    const wasSelected = previousSelected.current;
    previousSelected.current = selected;
    if (wasSelected === selected) return;

    favoriteAnimation.current?.stop();
    favoriteRotation.setValue(0);
    const animation = Animated.sequence([
      Animated.parallel([
        Animated.timing(favoriteScale, { toValue: 1.1, duration: 100, useNativeDriver: true }),
        Animated.timing(favoriteRotation, { toValue: 1, duration: 100, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.spring(favoriteScale, { toValue: 1, speed: 24, bounciness: 6, useNativeDriver: true }),
        Animated.timing(favoriteRotation, { toValue: 0, duration: 160, useNativeDriver: true }),
      ]),
    ]);
    favoriteAnimation.current = animation;
    animation.start(() => {
      if (favoriteAnimation.current === animation) favoriteAnimation.current = null;
    });
    return () => animation.stop();
  }, [favoriteRotation, favoriteScale, selected]);
  const toggleFavorite = () => {
    favoriteAnimation.current?.stop();
    favoriteRotation.setValue(0);
    void Haptics.selectionAsync().catch(() => undefined);
    onSelect();
    const animation = Animated.sequence([
      Animated.parallel([
        Animated.timing(favoriteScale, { toValue: 1.15, duration: 120, useNativeDriver: true }),
        Animated.timing(favoriteRotation, { toValue: 1, duration: 120, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.spring(favoriteScale, { toValue: 1, speed: 24, bounciness: 7, useNativeDriver: true }),
        Animated.timing(favoriteRotation, { toValue: 0, duration: 180, useNativeDriver: true }),
      ]),
    ]);
    favoriteAnimation.current = animation;
    animation.start(() => {
      if (favoriteAnimation.current === animation) favoriteAnimation.current = null;
    });
  };
  const favoriteRotate = favoriteRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', selected ? '-6deg' : '7deg'],
  });
  return (
    <Reanimated.View style={[styles.card, selected && styles.preferredCard, cardPressStyle]}>
      <LinearGradient pointerEvents="none" colors={[colors.surfaceAlt, colors.surface]} style={styles.cardDepth} />
      <Pressable onPress={onPress} onPressIn={pressCard} onPressOut={releaseCard} style={styles.main}>
        <View style={styles.portrait}>
          {reciter.image ? (
            <Image source={reciter.image} contentFit="cover" cachePolicy="memory-disk" priority="high" transition={120} style={styles.portraitImage} />
          ) : (
            <LinearGradient colors={[colors.purpleMid, colors.backgroundSecondary]} style={StyleSheet.absoluteFill}>
              <Text style={styles.initials}>{initials}</Text>
            </LinearGradient>
          )}
          <LinearGradient colors={['transparent', 'rgba(8,7,19,0.92)']} style={StyleSheet.absoluteFill} />
          <View style={styles.portraitCopy}>
            <Text numberOfLines={2} ellipsizeMode="tail" style={styles.name}>{reciter.name}</Text>
            <Text numberOfLines={1} style={styles.country}>{reciter.country}</Text>
          </View>
        </View>
        <Text numberOfLines={1} ellipsizeMode="tail" style={styles.meta}>{t(`recitations.style.${reciter.style}`)} · {t('recitations.surahAvailableCount', { count: reciter.availableSurahs })}</Text>
      </Pressable>
      <View pointerEvents="none" style={styles.luminousBorder} />
      <AnimatedPressable
        accessibilityLabel={t('recitations.toggleReciterFavorite')}
        accessibilityState={{ selected }}
        onPress={toggleFavorite}
        style={[styles.favorite, selected && styles.favoriteActive, { transform: [{ scale: favoriteScale }, { rotate: favoriteRotate }] }]}
      >
        <Ionicons name={selected ? 'star' : 'star-outline'} size={19} color={colors.goldMuted} />
      </AnimatedPressable>
    </Reanimated.View>
  );
}

export default memo(ReciterGalleryCard);

const styles = StyleSheet.create({
  card: { width: '100%', height: 183, borderRadius: 20, borderWidth: 1, borderColor: colors.borderSoft, backgroundColor: colors.surface, shadowColor: '#000', shadowOffset: { width: 0, height: 4 } },
  cardDepth: { ...StyleSheet.absoluteFillObject, borderRadius: 20, opacity: 0.28 },
  luminousBorder: { ...StyleSheet.absoluteFillObject, borderRadius: 20, borderWidth: 1, borderColor: colors.goldDark, opacity: 0.2 },
  preferredCard: { borderColor: colors.goldDark },
  main: { flex: 1, padding: 8 },
  portrait: { height: 136, overflow: 'hidden', borderRadius: 15, backgroundColor: colors.purpleDeep },
  portraitImage: { width: '100%', height: '100%' },
  initials: { flex: 1, color: colors.goldMuted, fontFamily: typography.serifMedium, fontSize: 31, textAlign: 'center', textAlignVertical: 'center' },
  portraitCopy: { position: 'absolute', right: 10, bottom: 9, left: 10 },
  name: { height: 34, color: colors.text, fontFamily: typography.serifMedium, fontSize: 15, lineHeight: 17, textAlignVertical: 'bottom' },
  country: { height: 10, marginTop: 2, color: colors.textMuted, fontFamily: typography.sans, fontSize: 8, lineHeight: 10 },
  meta: { height: 10, marginTop: 8, color: colors.textMuted, fontFamily: typography.sans, fontSize: 7.5, lineHeight: 10, textAlign: 'center' },
  favorite: { position: 'absolute', top: 14, right: 14, zIndex: 2, width: 31, height: 31, alignItems: 'center', justifyContent: 'center', borderRadius: 16, borderWidth: 1, borderColor: colors.borderSoft, backgroundColor: colors.surfaceAlt, shadowColor: colors.gold, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.28, shadowRadius: 8, elevation: 5 },
  favoriteActive: { borderColor: colors.goldDark, backgroundColor: colors.surfaceLight, shadowOpacity: 0.42 },
  pressed: { opacity: 0.67 },
});
