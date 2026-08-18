import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View } from 'react-native';

import { colors } from '../theme/colors';
import { useI18n } from '../i18n';

type SmallCardProps = {
  icon: keyof typeof Ionicons.glyphMap;
  children: React.ReactNode;
};

function SmallCard({ icon, children }: SmallCardProps) {
  return (
    <LinearGradient
      colors={['#28183F', '#1A1231']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.card}
    >
      <Ionicons
        name={icon}
        size={25}
        color={colors.primaryLight}
        style={styles.icon}
      />

      {children}
    </LinearGradient>
  );
}

export default function HomeInfoCards() {
  const { t } = useI18n();
  return (
    <View style={styles.row}>
      <SmallCard icon="calendar-outline">
        <Text style={styles.bigValue}>{t('home.hijriDay')}</Text>
        <Text style={styles.mainText}>{t('home.hijriMonth')}</Text>
        <Text style={styles.mainText}>{t('home.hijriYear')}</Text>
      </SmallCard>

      <SmallCard icon="partly-sunny-outline">
        <Text style={styles.bigValue}>{t('home.temperature')}</Text>
        <Text style={styles.mainText}>{t('home.weatherCloudy')}</Text>
      </SmallCard>

      <LinearGradient
        colors={['#28183F', '#1A1231']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.card, styles.wideCard]}
      >
        <View style={styles.cardHeader}>
          <Ionicons
            name="book-outline"
            size={22}
            color={colors.primaryLight}
          />

          <Text style={styles.title}>{t('home.verseToday')}</Text>
        </View>

        <Text style={styles.bodyText}>
          {t('home.verseExcerpt')}
        </Text>

        <Text style={styles.reference}>{t('home.verseReference')}</Text>
      </LinearGradient>

      <LinearGradient
        colors={['#28183F', '#1A1231']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.card, styles.wideCard]}
      >
        <View style={styles.cardHeader}>
          <Ionicons
            name="chatbubble-ellipses-outline"
            size={21}
            color={colors.primaryLight}
          />

          <Text style={styles.title}>{t('home.hadithToday')}</Text>
        </View>

        <Text style={styles.bodyText}>
          {t('home.hadithExcerpt')}
        </Text>

        <Text style={styles.reference}>{t('home.hadithSource')}</Text>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 18,
  },

  card: {
    width: '22.8%',
    minHeight: 150,
    padding: 12,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(229, 193, 255, 0.12)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 7,
    elevation: 3,
  },

  wideCard: {
    width: '36.7%',
  },

  icon: {
    marginBottom: 12,
  },

  bigValue: {
    color: colors.text,
    fontSize: 23,
    fontWeight: '700',
    marginBottom: 4,
  },

  mainText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 18,
  },

  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginBottom: 11,
  },

  title: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '600',
  },

  bodyText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 17,
  },

  reference: {
    marginTop: 'auto',
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '500',
    lineHeight: 15,
  },
});
