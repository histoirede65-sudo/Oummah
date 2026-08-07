import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { useI18n } from '../../i18n';

type ContinueListeningCardProps = {
  onResume: () => void;
  onOpenRecitations: () => void;
  surahName?: string;
  reciterName?: string;
  progress?: number;
};

export default function ContinueListeningCard({
  onResume,
  onOpenRecitations,
  surahName,
  reciterName,
  progress = 0,
}: ContinueListeningCardProps) {
  const { t } = useI18n();
  const safeProgress = Math.min(1, Math.max(0, progress));

  return (
    <View style={styles.card}>
      <LinearGradient
        colors={['rgba(44,27,58,0.94)', 'rgba(17,14,28,0.98)']}
        style={StyleSheet.absoluteFill}
      />
      <View pointerEvents="none" style={styles.gloss} />

      <Pressable
        onPress={onResume}
        style={({ pressed }) => [styles.main, pressed && styles.pressed]}
      >
        <View style={styles.icon}>
          <Ionicons name="headset" size={22} color="#F1BE55" />
        </View>
        <View style={styles.copy}>
          <Text style={styles.caption}>{t('quran.continueListening')}</Text>
          <Text numberOfLines={1} style={styles.title}>
            {surahName ?? t('quran.alFatiha')}
          </Text>
          <Text numberOfLines={1} style={styles.detail}>
            {reciterName ?? 'Choisir un récitateur'}
          </Text>
          <View style={styles.progressTrack}>
            <LinearGradient
              colors={['#C88D2B', '#F6CE72']}
              style={[styles.progress, { width: `${safeProgress * 100}%` }]}
            />
          </View>
        </View>
        <View style={styles.play}>
          <Ionicons name="play" size={18} color="#17101D" />
        </View>
      </Pressable>

      <Pressable
        onPress={onOpenRecitations}
        style={({ pressed }) => [styles.library, pressed && styles.pressed]}
      >
        <Text style={styles.libraryText}>Tous les récitateurs</Text>
        <Ionicons name="arrow-forward" size={15} color="#E7B655" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    height: 96,
    marginTop: 11,
    overflow: 'hidden',
    flexDirection: 'row',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(227,181,90,0.25)',
    backgroundColor: colors.surface,
  },
  gloss: {
    position: 'absolute',
    top: -70,
    left: 54,
    width: 190,
    height: 130,
    borderRadius: 95,
    backgroundColor: 'rgba(255,255,255,0.055)',
  },
  main: {
    flex: 1,
    minWidth: 0,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 17,
    borderWidth: 1,
    borderColor: 'rgba(227,181,90,0.22)',
    backgroundColor: 'rgba(16,10,27,0.74)',
  },
  copy: { flex: 1, minWidth: 0, marginHorizontal: 10 },
  caption: {
    color: '#DFAE4D',
    fontFamily: typography.sans,
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.9,
    textTransform: 'uppercase',
  },
  title: {
    marginTop: 1,
    color: colors.text,
    fontFamily: typography.serifMedium,
    fontSize: 18,
    lineHeight: 21,
  },
  detail: {
    color: colors.textSecondary,
    fontFamily: typography.sans,
    fontSize: 9,
  },
  progressTrack: {
    height: 3,
    marginTop: 6,
    overflow: 'hidden',
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.10)',
  },
  progress: { height: '100%', borderRadius: 2 },
  play: {
    width: 39,
    height: 39,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: '#E5AF43',
  },
  library: {
    width: 86,
    paddingHorizontal: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(227,181,90,0.18)',
    backgroundColor: 'rgba(10,8,19,0.24)',
  },
  libraryText: {
    marginBottom: 5,
    color: '#E6DDE5',
    fontFamily: typography.sans,
    fontSize: 8.5,
    lineHeight: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
  pressed: { opacity: 0.64 },
});
