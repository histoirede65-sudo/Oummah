import { Ionicons } from '@expo/vector-icons';
import type { Href } from 'expo-router';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { getMosqueImageSource } from '../../features/mosques/data/mosqueImage';
import type { MosquePost } from '../../features/mosques/data/mosquePosts';
import type { StoredMosque } from '../../features/mosques/data/mosquePreferences';
import type { MosquePrayerTime } from '../../features/mosques/data/mosquePrayerTimes';
import { formatEventMoment, openStoredMosque } from '../../features/mosques/mosquesScreenData';
import { colors } from '../../theme/colors';
import { styles } from './mosquesScreenStyles';

type Props = {
  mainMosque: StoredMosque | null;
  nextPrayer: MosquePrayerTime | null;
  iqama: string | null;
  nextEvent: MosquePost | null;
  favorites: StoredMosque[];
  onRemoveMainMosque: () => void;
};

/**
 * « Ma mosquée » of the Mosquées screen: main mosque with its next prayer and iqama, next event,
 * then the other favorites.
 */
export default function MyMosqueSection({ mainMosque, nextPrayer, iqama, nextEvent, favorites, onRemoveMainMosque }: Props) {
  return (
  <>
        <Pressable
          onPress={() => {
            if (mainMosque) {
              openStoredMosque(mainMosque);
              return;
            }

            Alert.alert(
              'Ma mosquée',
              'Ouvrez une fiche puis choisissez « Définir comme ma mosquée ».',
            );
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
              source={getMosqueImageSource(mainMosque?.id ?? 'main')}
              resizeMode="cover"
              style={styles.myMosqueImage}
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
            <Text style={styles.sectionEyebrow}>MA MOSQUÉE</Text>
            <Text numberOfLines={2} style={styles.myMosqueTitle}>
              {mainMosque
                ? mainMosque.name
                : 'Choisissez votre mosquée principale'}
            </Text>
            <Text numberOfLines={2} style={styles.myMosqueText}>
              {mainMosque
                ? mainMosque.address
                : 'Retrouvez ses horaires et ses événements en un geste.'}
            </Text>

            {mainMosque && nextPrayer ? (
              <View style={styles.nextPrayerRow}>
                <Ionicons
                  name="time-outline"
                  size={14}
                  color={colors.textMuted}
                />
                <Text style={styles.nextPrayerLabel}>Prochaine prière</Text>
                <View style={styles.nextPrayerDot} />
                <Text style={styles.nextPrayerValue}>
                  {nextPrayer.label} {nextPrayer.time}
                  {iqama ? ` · iqama ${iqama}` : ''}
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
              <Text style={styles.sectionEyebrow}>PROCHAIN ÉVÉNEMENT</Text>
              <Text numberOfLines={1} style={styles.nextEventTitle}>{nextEvent.title}</Text>
              <Text numberOfLines={1} style={styles.nextEventDate}>{formatEventMoment(nextEvent)}</Text>
            </View>
            <Ionicons name="chevron-forward" size={19} color={colors.goldLight} />
          </Pressable>
        ) : null}

        {favorites.some((mosque) => !mainMosque || (mosque.id !== mainMosque.id && (!mosque.mosqueId || mosque.mosqueId !== mainMosque.mosqueId))) ? (
          <View style={styles.favoritesBlock}>
            <View style={styles.favoritesHeader}>
              <Text style={styles.sectionEyebrow}>MES FAVORIS</Text>
              <Pressable onPress={() => router.push('/mosque/favorites' as Href)} hitSlop={8}>
                <Text style={styles.favoritesSeeAll}>Tout voir</Text>
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
                    <Image source={getMosqueImageSource(mosque.id)} resizeMode="cover" style={styles.favoriteChipImage} />
                    <Text numberOfLines={2} style={styles.favoriteChipName}>{mosque.name}</Text>
                  </Pressable>
                ))}
            </ScrollView>
          </View>
        ) : null}

        {mainMosque ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Retirer ma mosquée principale"
            onPress={onRemoveMainMosque}
            style={({ pressed }) => [
              styles.removeMainMosqueButton,
              pressed && styles.pressed,
            ]}
          >
            <Ionicons name="trash-outline" size={18} color={colors.goldLight} />
            <Text style={styles.removeMainMosqueText}>Retirer ma mosquée</Text>
          </Pressable>
        ) : null}
  </>
  );
}
