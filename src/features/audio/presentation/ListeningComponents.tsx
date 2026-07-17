import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { memo, useRef } from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type GestureResponderEvent,
} from 'react-native';

import { animationCurves } from '../../../core/animations';
import type { AudioTrack } from '../../../core/audio';
import { useI18n } from '../../../i18n';
import { colors } from '../../../theme/colors';
import { typography } from '../../../theme/typography';
import type {
  CatalogReciter,
  SurahCatalogItem,
} from '../domain/audio';
import type { DownloadState } from '../../../core/repositories';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function ListeningHeader({
  title,
  subtitle,
  onBack,
  onAction,
}: {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  onAction?: () => void;
}) {
  const { t } = useI18n();

  return (
    <View style={styles.header}>
      <Pressable
        accessibilityLabel={
          onBack ? t('common.back') : t('common.menu')
        }
        onPress={onBack}
        disabled={!onBack}
        style={styles.headerButton}
      >
        <Ionicons
          name={onBack ? 'arrow-back' : 'headset-outline'}
          size={21}
          color={colors.goldMuted}
        />
      </Pressable>

      <View style={styles.headerCopy}>
        <Text style={styles.headerTitle}>{title}</Text>

        {subtitle ? (
          <Text style={styles.headerSubtitle}>{subtitle}</Text>
        ) : null}
      </View>

      <Pressable
        accessibilityLabel={t('recitations.playlists')}
        onPress={onAction}
        disabled={!onAction}
        style={styles.headerButton}
      >
        <Ionicons
          name="albums-outline"
          size={19}
          color={colors.goldMuted}
        />
      </Pressable>
    </View>
  );
}

export function SectionHeader({
  title,
  onPress,
  actionLabel,
}: {
  title: string;
  onPress?: () => void;
  actionLabel?: string;
}) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>

      {onPress && actionLabel ? (
        <Pressable onPress={onPress}>
          <Text style={styles.sectionAction}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function ReciterAvatar({
  reciter,
  size = 66,
}: {
  reciter: CatalogReciter;
  size?: number;
}) {
  const initials = reciter.name
    .split(' ')
    .slice(0, 2)
    .map((word) => word[0])
    .join('');

  /*
   * Les portraits de grande taille correspondent à la page
   * individuelle du récitateur.
   *
   * Sur cette page, "contain" évite que le visage soit trop zoomé.
   * Les petites cartes conservent "cover" pour remplir leur cercle.
   */
  const isLargePortrait = size >= 100;

  if (reciter.image) {
    return (
      <View
        style={[
          styles.avatarImageFrame,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
          },
        ]}
      >
        <Image
          source={reciter.image}
          contentFit={isLargePortrait ? 'contain' : 'cover'}
          contentPosition="center"
          cachePolicy="memory-disk"
          transition={180}
          style={[
            styles.avatarImage,
            {
              width: size,
              height: size,
            },
          ]}
        />
      </View>
    );
  }

  return (
    <View
      style={[
        styles.avatarFallback,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
        },
      ]}
    >
      <Text style={styles.avatarInitials}>{initials}</Text>
    </View>
  );
}

export function ReciterCard({
  reciter,
  onPress,
}: {
  reciter: CatalogReciter;
  onPress: () => void;
}) {
  const { t } = useI18n();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.reciterCard,
        pressed && styles.pressed,
      ]}
    >
      <ReciterAvatar reciter={reciter} />

      <Text numberOfLines={2} style={styles.reciterName}>
        {reciter.name}
      </Text>

      <Text numberOfLines={1} style={styles.reciterCountry}>
        {reciter.country}
      </Text>

      <Text style={styles.reciterCount}>
        {t('recitations.surahAvailableCount', {
          count: reciter.availableSurahs,
        })}
      </Text>
    </Pressable>
  );
}

export function TrackCard({
  track,
  detail,
  onPress,
}: {
  track: AudioTrack;
  detail?: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.trackCard,
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.trackIcon}>
        <Ionicons
          name="play"
          size={18}
          color={colors.goldMuted}
        />
      </View>

      <Text numberOfLines={1} style={styles.trackTitle}>
        {track.title}
      </Text>

      <Text numberOfLines={1} style={styles.trackDetail}>
        {detail ?? track.creator.name}
      </Text>
    </Pressable>
  );
}

export const SurahAudioRow = memo(function SurahAudioRow({
  item,
  onPress,
  onDownload,
  downloadState,
  downloadProgress,
}: {
  item: SurahCatalogItem;
  onPress: () => void;
  onDownload?: () => void;
  downloadState?: DownloadState;
  downloadProgress?: number;
}) {
  const scale = useRef(new Animated.Value(1)).current;

  const animate = (toValue: number) => {
    scale.stopAnimation();

    Animated.timing(scale, {
      toValue,
      duration: 165,
      easing: animationCurves.premium,
      useNativeDriver: true,
      isInteraction: false,
    }).start();
  };

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={() => animate(0.98)}
      onPressOut={() => animate(1)}
      style={[
        styles.surahRow,
        {
          transform: [{ scale }],
        },
      ]}
    >
      <View style={styles.surahNumber}>
        <Text style={styles.surahNumberText}>
          {item.surah.id}
        </Text>
      </View>

      <View style={styles.surahCopy}>
        <Text style={styles.surahName}>
          {item.surah.arabicName}
        </Text>

        <Text style={styles.surahMeta}>
          {item.surah.frenchName} · {formatDuration(item.track.durationHint)}
        </Text>
      </View>

      {item.isFavorite ? (
        <Ionicons
          name="heart"
          size={14}
          color={colors.goldMuted}
        />
      ) : null}

      {item.isDownloaded ? (
        <Ionicons
          name="download"
          size={14}
          color={colors.success}
        />
      ) : null}

      <Text numberOfLines={1} style={styles.surahArabic}>
        {item.surah.transliteration}
      </Text>

      <DownloadButton
        downloaded={item.isDownloaded || downloadState === 'downloaded'}
        state={downloadState}
        progress={downloadProgress}
        onPress={onDownload}
      />

      <PlayButton onPress={onPress} />
    </AnimatedPressable>
  );
});

function formatDuration(seconds?: number) {
  if (!seconds || seconds <= 0) return '--:--';
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.round(seconds % 60);
  return `${minutes}:${String(remainingSeconds).padStart(2, '0')}`;
}

function PlayButton({
  onPress,
}: {
  onPress: () => void;
}) {
  const scale = useRef(new Animated.Value(1)).current;

  const animate = (toValue: number) => {
    scale.stopAnimation();

    Animated.timing(scale, {
      toValue,
      duration: 165,
      easing: animationCurves.premium,
      useNativeDriver: true,
      isInteraction: false,
    }).start();
  };

  const play = (event: GestureResponderEvent) => {
    event.stopPropagation();
    onPress();
  };

  return (
    <AnimatedPressable
      accessibilityRole="button"
      onPress={play}
      onPressIn={() => animate(0.94)}
      onPressOut={() => animate(1)}
      style={[
        styles.rowPlay,
        {
          transform: [{ scale }],
        },
      ]}
    >
      <Ionicons
        name="play"
        size={14}
        color={colors.goldMuted}
      />
    </AnimatedPressable>
  );
}

function DownloadButton({
  downloaded,
  state,
  progress = 0,
  onPress,
}: {
  downloaded: boolean;
  state?: DownloadState;
  progress?: number;
  onPress?: () => void;
}) {
  const scale = useRef(new Animated.Value(1)).current;

  const animate = (toValue: number) => {
    scale.stopAnimation();

    Animated.timing(scale, {
      toValue,
      duration: 165,
      easing: animationCurves.premium,
      useNativeDriver: true,
      isInteraction: false,
    }).start();
  };

  const download = (event: GestureResponderEvent) => {
    event.stopPropagation();
    onPress?.();
  };

  const isDownloading = state === 'downloading' || state === 'queued';
  const isFailed = state === 'failed';

  return (
    <AnimatedPressable
      accessibilityRole="button"
      onPress={download}
      onPressIn={() => animate(0.94)}
      onPressOut={() => animate(1)}
      style={[
        styles.rowDownload,
        downloaded && styles.rowDownloadActive,
        isFailed && styles.rowDownloadFailed,
        {
          transform: [{ scale }],
        },
      ]}
    >
      <Ionicons
        name={downloaded ? 'checkmark' : isFailed ? 'warning-outline' : isDownloading ? 'close' : 'download-outline'}
        size={14}
        color={downloaded ? colors.background : isFailed ? colors.danger : colors.goldMuted}
      />
      {isDownloading ? (
        <Text style={styles.rowDownloadProgress}>{Math.round(progress * 100)}%</Text>
      ) : null}
    </AnimatedPressable>
  );
}

export function SearchBar({
  value,
  onChangeText,
  placeholder = 'Rechercher un récitateur...',
}: {
  value?: string;
  onChangeText?: (text: string) => void;
  placeholder?: string;
}) {
  return (
    <View style={styles.searchBarContainer}>
      <Ionicons
        name="search"
        size={18}
        color={colors.goldMuted}
        style={styles.searchIcon}
      />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        style={styles.searchInput}
        selectionColor={colors.goldMuted}
        returnKeyType="search"
      />
    </View>
  );
}

export function ContinueListeningCard({
  title = 'CONTINUER L\'ÉCOUTE',
  reciterName,
  subtitle,
  onPress,
}: {
  title?: string;
  reciterName: string;
  subtitle?: string;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.continueCard,
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.continueCardContent}>
        <View style={styles.continueCardText}>
          <Text style={styles.continueCardTitle}>{title}</Text>
          <Text style={styles.continueCardReciter}>{reciterName}</Text>
          {subtitle ? (
            <Text style={styles.continueCardSubtitle}>{subtitle}</Text>
          ) : null}
        </View>

        <View style={styles.continueCardIconWrap}>
          <Ionicons
            name="play-circle"
            size={24}
            color={colors.goldMuted}
          />
        </View>
      </View>
    </Pressable>
  );
}

export const listeningStyles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },

  content: {
    paddingHorizontal: 16,
    paddingBottom: 130,
  },

  horizontal: {
    gap: 10,
    paddingRight: 16,
  },

  empty: {
    minHeight: 74,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: colors.surface,
  },

  emptyText: {
    color: colors.textMuted,
    fontFamily: typography.sans,
    fontSize: 10,
    textAlign: 'center',
  },

  loading: {
    paddingVertical: 30,
    color: colors.textMuted,
    fontFamily: typography.sans,
    fontSize: 10,
    textAlign: 'center',
  },
});

const styles = StyleSheet.create({
  header: {
    height: 76,
    flexDirection: 'row',
    alignItems: 'center',
  },

  headerButton: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 21,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: colors.purpleDeep,
  },

  headerCopy: {
    flex: 1,
    marginHorizontal: 12,
  },

  headerTitle: {
    color: colors.text,
    fontFamily: typography.serifMedium,
    fontSize: 27,
  },

  headerSubtitle: {
    color: colors.textMuted,
    fontFamily: typography.sans,
    fontSize: 9.5,
    fontWeight: '500',
  },

  sectionHeader: {
    marginTop: 22,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  sectionTitle: {
    color: colors.goldMuted,
    fontFamily: typography.serifMedium,
    fontSize: 20,
  },

  sectionAction: {
    color: colors.textMuted,
    fontFamily: typography.sans,
    fontSize: 9.5,
    fontWeight: '600',
  },

  avatarImageFrame: {
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.goldDark,
    backgroundColor: colors.purpleDeep,
  },

  avatarImage: {
    alignSelf: 'center',
  },

  avatarFallback: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.goldDark,
    backgroundColor: colors.purpleMid,
  },

  avatarInitials: {
    color: colors.goldLight,
    fontFamily: typography.serifMedium,
    fontSize: 20,
  },

  reciterCard: {
    width: 126,
    minHeight: 166,
    padding: 12,
    alignItems: 'center',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: colors.surface,
  },

  reciterName: {
    minHeight: 35,
    marginTop: 8,
    color: colors.text,
    fontFamily: typography.serifMedium,
    fontSize: 14,
    textAlign: 'center',
  },

  reciterCountry: {
    color: colors.textMuted,
    fontFamily: typography.sans,
    fontSize: 8.5,
  },

  reciterCount: {
    marginTop: 4,
    color: colors.goldMuted,
    fontFamily: typography.sans,
    fontSize: 7.5,
  },

  trackCard: {
    width: 148,
    minHeight: 116,
    padding: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: colors.surfaceAlt,
  },

  trackIcon: {
    width: 39,
    height: 39,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: colors.purpleDeep,
  },

  trackTitle: {
    marginTop: 10,
    color: colors.text,
    fontFamily: typography.serifMedium,
    fontSize: 16,
  },

  trackDetail: {
    marginTop: 2,
    color: colors.textMuted,
    fontFamily: typography.sans,
    fontSize: 8.5,
  },

  surahRow: {
    minHeight: 68,
    paddingHorizontal: 11,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: colors.surface,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.11,
    shadowRadius: 8,
    elevation: 2,
  },

  surahNumber: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 17,
    borderWidth: 1,
    borderColor: colors.goldDark,
    backgroundColor: colors.purpleDeep,
  },

  surahNumberText: {
    color: colors.goldMuted,
    fontFamily: typography.sans,
    fontSize: 9,
    fontWeight: '700',
  },

  surahCopy: {
    flex: 1,
    minWidth: 0,
  },

  surahName: {
    color: colors.text,
    fontFamily: typography.serifMedium,
    fontSize: 15,
  },

  surahMeta: {
    color: colors.textMuted,
    fontFamily: typography.sans,
    fontSize: 8.5,
  },

  surahArabic: {
    maxWidth: '24%',
    color: colors.goldMuted,
    fontFamily: typography.arabic,
    fontSize: 17,
    writingDirection: 'rtl',
  },

  rowPlay: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    backgroundColor: colors.purpleDeep,
    shadowColor: colors.gold,
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.28,
    shadowRadius: 7,
    elevation: 4,
  },

  rowDownload: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: colors.surfaceAlt,
  },

  rowDownloadActive: {
    borderColor: colors.success,
    backgroundColor: colors.success,
  },

  rowDownloadFailed: {
    borderColor: colors.danger,
  },

  rowDownloadProgress: {
    position: 'absolute',
    bottom: -10,
    color: colors.goldMuted,
    fontFamily: typography.sans,
    fontSize: 6.5,
    fontWeight: '800',
  },

  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: '#181818',
  },

  searchIcon: {
    marginRight: 8,
  },

  searchInput: {
    flex: 1,
    color: colors.text,
    fontFamily: typography.sans,
    fontSize: 13,
    padding: 0,
  },

  continueCard: {
    marginTop: 12,
    padding: 16,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: colors.surface,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 3,
  },

  continueCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  continueCardText: {
    flex: 1,
    paddingRight: 12,
  },

  continueCardTitle: {
    color: colors.goldMuted,
    fontFamily: typography.sans,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },

  continueCardReciter: {
    marginTop: 6,
    color: colors.text,
    fontFamily: typography.serifMedium,
    fontSize: 16,
  },

  continueCardSubtitle: {
    marginTop: 4,
    color: colors.textMuted,
    fontFamily: typography.sans,
    fontSize: 11,
  },

  continueCardIconWrap: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: colors.purpleDeep,
  },

  pressed: {
    opacity: 0.64,
  },
});
