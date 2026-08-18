import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { useI18n } from '../../i18n';

type LastReadingCardProps = {
  onResume?: () => void;
  surahName?: string;
  page?: number;
  verse?: number;
  progress?: number;
};

export default function LastReadingCard({
  onResume,
  surahName,
  page,
  verse,
  progress = 0,
}: LastReadingCardProps) {
  const { t } = useI18n();
  const safeProgress = Math.min(100, Math.max(0, progress));

  return (
    <View style={styles.card}>
      <Image
        source={require('../../assets/images/home/shortcuts/quran-real.jpg')}
        contentFit="cover"
        transition={180}
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        colors={[
          'rgba(8,8,18,0.96)',
          'rgba(13,9,25,0.80)',
          'rgba(13,9,24,0.12)',
        ]}
        locations={[0, 0.52, 1]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        pointerEvents="none"
        colors={[
          'rgba(255,255,255,0.20)',
          'rgba(255,255,255,0.025)',
          'transparent',
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.82, y: 0.8 }}
        style={StyleSheet.absoluteFill}
      />
      <View pointerEvents="none" style={styles.liquidOrb} />

      <View style={styles.content}>
        <View style={styles.captionRow}>
          <View style={styles.bookmarkCircle}>
            <Ionicons name="bookmark" size={14} color="#16101D" />
          </View>
          <Text style={styles.caption}>{t('quran.continueReading')}</Text>
        </View>

        <Text numberOfLines={1} style={styles.name}>
          {surahName ?? t('quran.alBaqara')}
        </Text>
        <Text style={styles.detail}>
          {t('quran.lastPosition', {
            page: page ?? 1,
            verse: verse ?? 1,
          })}
        </Text>

        <View style={styles.progressRow}>
          <View style={styles.progressTrack}>
            <LinearGradient
              colors={['#D99B27', '#FFE58B']}
              style={[
                styles.progress,
                { width: `${Math.max(2, safeProgress)}%` },
              ]}
            />
          </View>
          <Text style={styles.percent}>{safeProgress}%</Text>
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={onResume}
          style={({ pressed }) => [styles.resume, pressed && styles.pressed]}
        >
          <View style={styles.playCircle}>
            <Ionicons name="book-outline" size={18} color="#17101D" />
          </View>
          <Text
            numberOfLines={1}
            adjustsFontSizeToFit
            style={styles.resumeText}
          >
            {t('quran.resumeReading')}
          </Text>
          <Ionicons name="arrow-forward" size={17} color="#17101D" />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    height: 205,
    overflow: 'hidden',
    borderRadius: 26,
    borderWidth: 1,
    borderColor: 'rgba(255,233,196,0.30)',
    backgroundColor: colors.surface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.34,
    shadowRadius: 18,
    elevation: 9,
  },
  liquidOrb: {
    position: 'absolute',
    top: -105,
    left: 52,
    width: 230,
    height: 230,
    borderRadius: 115,
    backgroundColor: 'rgba(255,255,255,0.055)',
  },
  content: {
    width: '64%',
    height: '100%',
    paddingTop: 19,
    paddingRight: 4,
    paddingBottom: 15,
    paddingLeft: 18,
  },
  captionRow: { flexDirection: 'row', alignItems: 'center' },
  bookmarkCircle: {
    width: 27,
    height: 27,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: '#E8B447',
  },
  caption: {
    marginLeft: 8,
    color: '#F0BD54',
    fontFamily: typography.sans,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.1,
    textTransform: 'uppercase',
  },
  name: {
    marginTop: 8,
    color: '#FFF9F3',
    fontFamily: typography.serifSemibold,
    fontSize: 30,
    lineHeight: 34,
    textShadowColor: 'rgba(0,0,0,0.75)',
    textShadowRadius: 8,
  },
  detail: {
    marginTop: 2,
    color: '#DCD2DC',
    fontFamily: typography.sans,
    fontSize: 11.5,
    fontWeight: '600',
  },
  progressRow: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressTrack: {
    flex: 1,
    height: 5,
    overflow: 'hidden',
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  progress: { height: '100%', borderRadius: 3 },
  percent: {
    width: 32,
    color: '#EBC26F',
    fontFamily: typography.sans,
    fontSize: 9.5,
    fontWeight: '700',
    textAlign: 'right',
  },
  resume: {
    height: 43,
    marginTop: 'auto',
    paddingHorizontal: 7,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 23,
    backgroundColor: '#E8B447',
    shadowColor: '#F2B53D',
    shadowOpacity: 0.5,
    shadowRadius: 9,
  },
  playCircle: {
    width: 31,
    height: 31,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.28)',
  },
  resumeText: {
    flex: 1,
    marginHorizontal: 8,
    color: '#17101D',
    fontFamily: typography.sans,
    fontSize: 10.5,
    fontWeight: '800',
  },
  pressed: { opacity: 0.68, transform: [{ scale: 0.99 }] },
});
