import { Ionicons } from '@expo/vector-icons';
import type { Href } from 'expo-router';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { getMosqueImageSource } from '../../features/mosques/data/mosqueImage';
import type { MosquePost } from '../../features/mosques/data/mosquePosts';
import type { StoredMosque } from '../../features/mosques/data/mosquePreferences';
import type { MosquePrayerTime } from '../../features/mosques/data/mosquePrayerTimes';
import { formatEventMoment, openStoredMosque } from '../../features/mosques/mosquesScreenData';
import { useI18n } from '../../i18n';
import { colors } from '../../theme/colors';
import { styles } from './mosquesScreenStyles';

type Props = {
  mainMosque: StoredMosque | null;
  nextPrayer: MosquePrayerTime | null;
  iqama: string | null;
  nextEvent: MosquePost | null;
  favorites: StoredMosque[];
};

/**
 * « Ma mosquée » of the Mosquées screen: main mosque with its next prayer and iqama, next event,
 * then the other favorites.
 */
export default function MyMosqueSection({ mainMosque, nextPrayer, iqama, nextEvent, favorites }: Props) {
  const { language, t } = useI18n();
  return (
  <>
        <Pressable
          onPress={() => {
            if (mainMosque) {
              openStoredMosque(mainMosque);
              return;
            }

            Alert.alert(t('mosques.myMosque'), t('mosques.chooseMainHint'));
          }}
          style={({ pressed }) => [
            styles.myMosqueCard,
            mainMosque && styles.myMosqueCardFirst,
            mainMosque && styles.myMosqueCardActive,
            pressed && styles.pressed,
          ]}
        >
          <View style={styles.myMosqueImageWrap}>
            <Image
              source={getMosqueImageSource(mainMosque?.id ?? 'main', mainMosque?.imageKey)}
              contentFit="cover"
              style={StyleSheet.absoluteFill}
            />
            <LinearGradient
              colors={['transparent', 'rgba(8,7,19,0.50)']}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.myMosqueImageBadge}>
              <Ionicons
                name={mainMosque ? 'home' : 'home-outline'}
                size={14}
                color={colors.background}
              />
            </View>
          </View>

          <View style={styles.myMosqueCopy}>
            <Text style={styles.sectionEyebrow}>{t('mosques.myMosqueEyebrow')}</Text>
            <Text numberOfLines={2} style={styles.myMosqueTitle}>
              {mainMosque ? mainMosque.name : t('mosques.chooseMainTitle')}
            </Text>
            <Text numberOfLines={2} style={styles.myMosqueText}>
              {mainMosque ? mainMosque.address : t('mosques.chooseMainText')}
            </Text>

            {mainMosque && nextPrayer ? (
              <View style={styles.nextPrayerRow}>
                <Ionicons
                  name="time-outline"
                  size={14}
                  color={colors.textMuted}
                />
                <Text style={styles.nextPrayerLabel}>{t('mosques.nextPrayer')}</Text>
                <View style={styles.nextPrayerDot} />
                <Text style={styles.nextPrayerValue}>
                  {nextPrayer.label} {nextPrayer.time}
                  {iqama ? ` · ${t('mosques.iqama', { time: iqama })}` : ''}
                </Text>
              </View>
            ) : null}
          </View>

          <Ionicons name="chevron-forward" size={21} color={colors.goldLight} />
        </Pressable>

        {mainMosque && nextEvent ? (
          <Pressable
            onPress={() => openStoredMosque(mainMosque)}
            style={({ pressed }) => [styles.nextEventCard, pressed && styles.pressed]}
          >
            <View style={styles.nextEventIcon}>
              <Ionicons name="calendar-outline" size={17} color={colors.background} />
            </View>
            <View style={styles.nextEventCopy}>
              <Text style={styles.sectionEyebrow}>{t('mosques.nextEvent')}</Text>
              <Text numberOfLines={1} style={styles.nextEventTitle}>{nextEvent.title}</Text>
              <Text numberOfLines={1} style={styles.nextEventDate}>{formatEventMoment(nextEvent, language, t)}</Text>
            </View>
            <Ionicons name="chevron-forward" size={19} color={colors.goldLight} />
          </Pressable>
        ) : null}

        {favorites.some((mosque) => !mainMosque || (mosque.id !== mainMosque.id && (!mosque.mosqueId || mosque.mosqueId !== mainMosque.mosqueId))) ? (
          <View style={styles.favoritesBlock}>
            <View style={styles.favoritesHeader}>
              <Text style={styles.sectionEyebrow}>{t('mosques.myFavorites')}</Text>
              <Pressable onPress={() => router.push('/mosque/favorites' as Href)} hitSlop={8}>
                <Text style={styles.favoritesSeeAll}>{t('mosques.seeAll')}</Text>
              </Pressable>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.favoritesRow}>
              {favorites
                .filter((mosque) => !mainMosque || (mosque.id !== mainMosque.id && (!mosque.mosqueId || mosque.mosqueId !== mainMosque.mosqueId)))
                .map((mosque) => (
                  <Pressable
                    key={mosque.id}
                    onPress={() => openStoredMosque(mosque)}
                    style={({ pressed }) => [styles.favoriteChip, pressed && styles.pressed]}
                  >
                    <Image source={getMosqueImageSource(mosque.id)} contentFit="cover" style={styles.favoriteChipImage} />
                    <Text numberOfLines={2} style={styles.favoriteChipName}>{mosque.name}</Text>
                  </Pressable>
                ))}
            </ScrollView>
          </View>
        ) : null}

  </>
  );
}
