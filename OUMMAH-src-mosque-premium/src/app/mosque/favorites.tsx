import { Ionicons } from '@expo/vector-icons';
import type { Href } from 'expo-router';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
    getFavoriteMosques,
    getMainMosque,
    setMosqueFavorite,
    type StoredMosque,
} from '../../features/mosques/data/mosquePreferences';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';

function openMosqueDetails(mosque: StoredMosque) {
  router.push({
    pathname: '/mosque/[id]',
    params: {
      id: mosque.id,
      name: mosque.name,
      address: mosque.address,
      latitude: String(mosque.latitude),
      longitude: String(mosque.longitude),
      distance: mosque.distanceLabel ?? '',
      phone: mosque.phone ?? '',
      website: mosque.website ?? '',
      openingHours: mosque.openingHours ?? '',
    },
  } as Href);
}

export default function FavoriteMosquesScreen() {
  const [favorites, setFavorites] = useState<StoredMosque[]>([]);
  const [mainMosqueId, setMainMosqueId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [removingFavoriteId, setRemovingFavoriteId] = useState<string | null>(
    null,
  );

  const loadData = useCallback(async () => {
    setLoading(true);

    const [favoriteMosques, mainMosque] = await Promise.all([
      getFavoriteMosques(),
      getMainMosque(),
    ]);

    setFavorites(favoriteMosques);
    setMainMosqueId(mainMosque?.id ?? null);
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadData();
    }, [loadData]),
  );

  const removeFavorite = async (mosque: StoredMosque) => {
    if (removingFavoriteId) return;

    const previousFavorites = favorites;

    setRemovingFavoriteId(mosque.id);
    setFavorites((currentFavorites) =>
      currentFavorites.filter((favorite) => favorite.id !== mosque.id),
    );

    try {
      await setMosqueFavorite(mosque, false);
    } catch {
      setFavorites(previousFavorites);
      Alert.alert(
        'Suppression impossible',
        'La mosquée n’a pas pu être retirée des favoris.',
      );
    } finally {
      setRemovingFavoriteId(null);
    }
  };

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <View style={styles.header}>
        <Pressable
          accessibilityLabel="Retour"
          onPress={() => router.back()}
          style={styles.headerButton}
        >
          <Ionicons
            name="arrow-back"
            size={23}
            color={colors.goldLight}
          />
        </Pressable>

        <View style={styles.headerCopy}>
          <Text style={styles.eyebrow}>VOS REPÈRES</Text>
          <Text style={styles.title}>Mes mosquées</Text>
        </View>

        <View style={styles.headerButtonPlaceholder} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.emptyCard}>
            <ActivityIndicator
              size="large"
              color={colors.goldLight}
            />
            <Text style={styles.emptyTitle}>Chargement</Text>
          </View>
        ) : favorites.length === 0 ? (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIcon}>
              <Ionicons
                name="heart-outline"
                size={34}
                color={colors.goldLight}
              />
            </View>

            <Text style={styles.emptyTitle}>
              Aucun favori pour le moment
            </Text>

            <Text style={styles.emptyText}>
              Ouvrez la fiche d’une mosquée puis appuyez sur le cœur
              pour la retrouver ici.
            </Text>

            <Pressable
              onPress={() => router.replace('/mosques' as Href)}
              style={({ pressed }) => [
                styles.exploreButton,
                pressed && styles.pressed,
              ]}
            >
              <Ionicons
                name="search-outline"
                size={18}
                color={colors.background}
              />
              <Text style={styles.exploreButtonText}>
                Explorer les mosquées
              </Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.list}>
            {favorites.map((mosque) => {
              const isMain = mosque.id === mainMosqueId;

              return (
                <View
                  key={mosque.id}
                  style={[
                    styles.card,
                    isMain && styles.cardMain,
                  ]}
                >
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Ouvrir la fiche de ${mosque.name}`}
                    onPress={() => openMosqueDetails(mosque)}
                    style={({ pressed }) => [
                      styles.cardContent,
                      pressed && styles.pressed,
                    ]}
                  >
                    <View style={styles.iconWrap}>
                      <Ionicons
                        name="business-outline"
                        size={25}
                        color={colors.goldLight}
                      />
                    </View>

                    <View style={styles.copy}>
                      <View style={styles.nameRow}>
                        <Text
                          numberOfLines={2}
                          style={styles.name}
                        >
                          {mosque.name}
                        </Text>

                        {isMain ? (
                          <View style={styles.mainBadge}>
                            <Ionicons
                              name="home"
                              size={11}
                              color={colors.background}
                            />
                            <Text style={styles.mainBadgeText}>
                              Ma mosquée
                            </Text>
                          </View>
                        ) : null}
                      </View>

                      <Text
                        numberOfLines={2}
                        style={styles.address}
                      >
                        {mosque.address}
                      </Text>

                      {mosque.distanceLabel ? (
                        <Text style={styles.distance}>
                          {mosque.distanceLabel}
                        </Text>
                      ) : null}
                    </View>

                    <Ionicons
                      name="chevron-forward"
                      size={20}
                      color={colors.goldLight}
                    />
                  </Pressable>

                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Retirer ${mosque.name} des favoris`}
                    disabled={removingFavoriteId !== null}
                    hitSlop={8}
                    onPress={() => void removeFavorite(mosque)}
                    style={({ pressed }) => [
                      styles.removeFavoriteButton,
                      pressed && styles.pressed,
                    ]}
                  >
                    {removingFavoriteId === mosque.id ? (
                      <ActivityIndicator
                        size="small"
                        color={colors.goldLight}
                      />
                    ) : (
                      <Ionicons
                        name="heart"
                        size={22}
                        color={colors.goldLight}
                      />
                    )}
                  </Pressable>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    minHeight: 78,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderSoft,
    backgroundColor: colors.backgroundSecondary,
  },
  headerButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    backgroundColor: colors.purpleDeep,
  },
  headerButtonPlaceholder: {
    width: 44,
    height: 44,
  },
  headerCopy: {
    flex: 1,
    marginHorizontal: 13,
  },
  eyebrow: {
    color: colors.textMuted,
    fontFamily: typography.sans,
    fontSize: 10,
    letterSpacing: 1.5,
  },
  title: {
    marginTop: 2,
    color: colors.goldLight,
    fontFamily: typography.serifMedium,
    fontSize: 29,
  },
  content: {
    width: '100%',
    maxWidth: 760,
    paddingHorizontal: 14,
    paddingTop: 18,
    paddingBottom: 56,
    alignSelf: 'center',
  },
  emptyCard: {
    minHeight: 360,
    paddingHorizontal: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: colors.surfaceAlt,
  },
  emptyIcon: {
    width: 72,
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 36,
    backgroundColor: 'rgba(126,72,148,0.20)',
  },
  emptyTitle: {
    marginTop: 17,
    color: colors.text,
    fontFamily: typography.serifMedium,
    fontSize: 23,
    textAlign: 'center',
  },
  emptyText: {
    maxWidth: 320,
    marginTop: 8,
    color: colors.textMuted,
    fontFamily: typography.sans,
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
  },
  exploreButton: {
    minHeight: 48,
    marginTop: 19,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 17,
    backgroundColor: colors.goldLight,
  },
  exploreButtonText: {
    color: colors.background,
    fontFamily: typography.sans,
    fontSize: 13,
    fontWeight: '700',
  },
  list: {
    gap: 12,
  },
  card: {
    minHeight: 128,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 21,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: colors.backgroundSecondary,
  },
  cardContent: {
    flex: 1,
    minHeight: 126,
    paddingLeft: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardMain: {
    borderColor: 'rgba(224,188,112,0.55)',
  },
  iconWrap: {
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 26,
    backgroundColor: 'rgba(126,72,148,0.20)',
  },
  copy: {
    flex: 1,
    minWidth: 0,
    marginHorizontal: 12,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  name: {
    flex: 1,
    color: colors.text,
    fontFamily: typography.serifMedium,
    fontSize: 20,
    lineHeight: 25,
  },
  mainBadge: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 10,
    backgroundColor: colors.goldLight,
  },
  mainBadgeText: {
    color: colors.background,
    fontFamily: typography.sans,
    fontSize: 8.5,
    fontWeight: '700',
  },
  address: {
    marginTop: 5,
    color: colors.textMuted,
    fontFamily: typography.sans,
    fontSize: 12.5,
    lineHeight: 18,
  },
  distance: {
    marginTop: 8,
    color: colors.goldLight,
    fontFamily: typography.sans,
    fontSize: 11.5,
    fontWeight: '700',
  },
  removeFavoriteButton: {
    width: 44,
    height: 44,
    marginHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    backgroundColor: colors.purpleDeep,
  },
  pressed: {
    opacity: 0.72,
    transform: [{ scale: 0.99 }],
  },
});
