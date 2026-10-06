import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
  halalCategoryLabel,
  halalDisplayAddress,
  halalDistanceLabel,
  halalVerificationText,
  type HalalPlace,
  type HalalPlaceCategory,
} from '../../features/halal/domain/HalalPlace';
import { useI18n } from '../../i18n';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { getGoogleHalalPhotoSource } from '../../features/halal/data/googleHalalPlaces';

type HalalPlaceCardProps = {
  place: HalalPlace;
  favorite: boolean;
  onPress: () => void;
  onFavorite: () => void;
  compact?: boolean;
};

const CATEGORY_ICONS: Record<HalalPlaceCategory, keyof typeof Ionicons.glyphMap> = {
  restaurant: 'restaurant-outline',
  fast_food: 'fast-food-outline',
  butcher: 'storefront-outline',
  grocery: 'basket-outline',
  bakery: 'cafe-outline',
  other: 'storefront-outline',
};

function verificationColors(place: HalalPlace) {
  if (place.verificationStatus === 'verified_certificate') {
    return { color: colors.success, background: 'rgba(98,197,139,0.13)', border: 'rgba(98,197,139,0.42)' };
  }
  if (place.verificationStatus === 'declared') {
    return { color: colors.goldLight, background: 'rgba(227,181,90,0.12)', border: 'rgba(227,181,90,0.35)' };
  }
  return { color: colors.textSecondary, background: 'rgba(43,34,56,0.12)', border: 'rgba(43,34,56,0.30)' };
}

export default function HalalPlaceCard({ place, favorite, onPress, onFavorite, compact }: HalalPlaceCardProps) {
  const { language, t } = useI18n();
  const verification = verificationColors(place);
  const verificationText = halalVerificationText(place, t);
  // Vignette légère (≈ 35 Ko au lieu de plusieurs centaines) : la carte n'affiche que 78 px de large.
  const [photoAttempt, setPhotoAttempt] = useState(0);
  const googleSource = getGoogleHalalPhotoSource(place.photoName, 240);
  const photoSource = place.communityPhotoUrl
    ? { uri: place.communityPhotoUrl }
    : googleSource && photoAttempt > 0
      ? { ...googleSource, uri: `${googleSource.uri}&retry=${photoAttempt}` }
      : googleSource;
  const [photoFailed, setPhotoFailed] = useState(false);
  useEffect(() => {
    setPhotoFailed(false);
    setPhotoAttempt(0);
  }, [place.photoName, place.communityPhotoUrl]);
  useEffect(() => {
    if (!photoFailed || photoAttempt >= 2 || place.communityPhotoUrl) return;
    // Trop de photos demandées en même temps (refus 429) : on réessaie un peu plus tard.
    const timer = setTimeout(() => {
      setPhotoAttempt((attempt) => attempt + 1);
      setPhotoFailed(false);
    }, 1200 * (photoAttempt + 1));
    return () => clearTimeout(timer);
  }, [photoFailed, photoAttempt, place.communityPhotoUrl]);
  const displayPhoto = photoSource && !photoFailed;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t('halal.openPlace', { name: place.name })}
      onPress={onPress}
      style={({ pressed }) => [styles.shell, compact && styles.shellCompact, pressed && styles.pressed]}
    >
      <LinearGradient
        colors={['rgba(30,23,48,0.98)', 'rgba(21,16,34,0.98)', 'rgba(10,9,21,0.99)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={[styles.iconWrap, displayPhoto && styles.photoWrap, compact && displayPhoto && styles.photoWrapCompact]}>
        {displayPhoto ? (
          <Image source={photoSource} cachePolicy="memory-disk" recyclingKey={place.id} contentFit="cover" transition={120} onError={() => setPhotoFailed(true)} style={StyleSheet.absoluteFill} />
        ) : (
          <Ionicons name={CATEGORY_ICONS[place.category]} size={compact ? 19 : 22} color={colors.goldLight} />
        )}
      </View>
      <View style={styles.copy}>
        <View style={styles.titleRow}>
          <Text numberOfLines={1} style={styles.title}>{place.name}</Text>
          <Text style={styles.distance}>{halalDistanceLabel(place, language, t)}</Text>
        </View>
        <Text numberOfLines={1} style={styles.category}>
          {halalCategoryLabel(place.category, t)}{place.cuisine ? ` · ${place.cuisine}` : ''}
        </Text>
        <Text numberOfLines={1} style={styles.address}>{halalDisplayAddress(place.address)}</Text>
        <View style={[styles.verification, { backgroundColor: verification.background, borderColor: verification.border }]}> 
          <Ionicons
            name={place.verificationStatus === 'verified_certificate' ? 'shield-checkmark' : 'information-circle-outline'}
            size={12}
            color={verification.color}
          />
          <Text numberOfLines={1} style={[styles.verificationText, { color: verification.color }]}>
            {verificationText.label}
          </Text>
        </View>
        {place.communityPhotoUrl ? (
          <Text numberOfLines={1} style={styles.googleAttribution}>{t('halal.communityPhoto')}</Text>
        ) : place.source === 'google' || place.photoName ? (
          <Text numberOfLines={1} style={styles.googleAttribution}>
            Google Maps{place.photoAttribution ? ` · ${t('halal.photoBy', { author: place.photoAttribution })}` : ''}
          </Text>
        ) : null}
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t(favorite ? 'halal.removeFavorite' : 'halal.addFavorite')}
        hitSlop={9}
        onPress={(event) => {
          event.stopPropagation();
          onFavorite();
        }}
        style={styles.favorite}
      >
        <Ionicons name={favorite ? 'heart' : 'heart-outline'} size={20} color={favorite ? colors.goldLight : colors.textMuted} />
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  shell: {
    minHeight: 132,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 14,
    borderRadius: 23,
    borderWidth: 1,
    borderColor: 'rgba(227,181,90,0.26)',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 7 },
    elevation: 6,
  },
  shellCompact: { minHeight: 116, borderRadius: 20, padding: 12 },
  pressed: { opacity: 0.83, transform: [{ scale: 0.99 }] },
  iconWrap: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'rgba(227,181,90,0.34)',
    backgroundColor: 'rgba(200,148,58,0.10)',
    overflow: 'hidden',
  },
  photoWrap: { width: 78, height: 98, borderRadius: 18 },
  photoWrapCompact: { width: 65, height: 84, borderRadius: 16 },
  copy: { flex: 1, minWidth: 0, marginLeft: 11, paddingRight: 22 },
  titleRow: { flexDirection: 'row', alignItems: 'center' },
  title: { flex: 1, minWidth: 0, color: colors.text, fontFamily: typography.serifSemibold, fontSize: 19, fontWeight: '700' },
  distance: { marginLeft: 7, color: colors.goldLight, fontFamily: typography.sans, fontSize: 11, fontWeight: '800', fontVariant: ['lining-nums', 'tabular-nums'] },
  category: { marginTop: 2, color: colors.goldMuted, fontFamily: typography.sans, fontSize: 10.5, fontWeight: '700' },
  address: { marginTop: 5, color: colors.textSecondary, fontFamily: typography.sans, fontSize: 11, lineHeight: 15 },
  verification: { alignSelf: 'flex-start', maxWidth: '100%', marginTop: 8, paddingHorizontal: 7, paddingVertical: 4, flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 10, borderWidth: 1 },
  verificationText: { flexShrink: 1, fontFamily: typography.sans, fontSize: 9.5, fontWeight: '700' },
  googleAttribution: { marginTop: 6, color: colors.textMuted, fontFamily: typography.sans, fontSize: 10, fontWeight: '400' },
  favorite: { position: 'absolute', top: 10, right: 10, width: 30, height: 30, alignItems: 'center', justifyContent: 'center' },
});
