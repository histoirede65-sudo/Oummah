import { Ionicons } from '@expo/vector-icons';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Pressable,
    StyleSheet,
    Text,
    View,
} from 'react-native';

import {
    getMosquePrayerSchedule,
    type MosquePrayerSchedule,
    type MosquePrayerTime,
} from '../features/mosques/data/mosquePrayerTimes';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';

type MosquePrayerCountdownProps = {
  latitude: number;
  longitude: number;
};

function getNextPrayer(
  schedule: MosquePrayerSchedule,
  now: number,
): MosquePrayerTime | null {
  const prayers = [
    ...schedule.prayers,
    schedule.tomorrowFajr,
  ];

  return (
    prayers.find(
      (prayer) => prayer.timestamp > now,
    ) ?? null
  );
}

function formatRemainingTime(milliseconds: number) {
  const totalSeconds = Math.max(
    0,
    Math.floor(milliseconds / 1_000),
  );

  const hours = Math.floor(totalSeconds / 3_600);
  const minutes = Math.floor(
    (totalSeconds % 3_600) / 60,
  );
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${String(hours).padStart(2, '0')} h ${String(
      minutes,
    ).padStart(2, '0')} min ${String(seconds).padStart(
      2,
      '0',
    )} s`;
  }

  return `${String(minutes).padStart(
    2,
    '0',
  )} min ${String(seconds).padStart(2, '0')} s`;
}

function MosquePrayerCountdown({
  latitude,
  longitude,
}: MosquePrayerCountdownProps) {
  const [schedule, setSchedule] =
    useState<MosquePrayerSchedule | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [now, setNow] = useState(() => Date.now());
  const [refreshKey, setRefreshKey] = useState(0);

  const loadSchedule = useCallback(
    async (signal: AbortSignal) => {
      setLoading(true);
      setErrorMessage('');

      try {
        const result = await getMosquePrayerSchedule(
          latitude,
          longitude,
          signal,
        );

        if (!signal.aborted) {
          setSchedule(result);
        }
      } catch (error) {
        if (
          error instanceof Error &&
          error.name === 'AbortError'
        ) {
          return;
        }

        if (!signal.aborted) {
          setErrorMessage(
            'Les horaires de prière sont momentanément indisponibles.',
          );
        }
      } finally {
        if (!signal.aborted) {
          setLoading(false);
        }
      }
    },
    [latitude, longitude],
  );

  useEffect(() => {
    const controller = new AbortController();

    void loadSchedule(controller.signal);

    return () => {
      controller.abort();
    };
  }, [loadSchedule, refreshKey]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setNow(Date.now());
    }, 1_000);

    return () => {
      clearInterval(intervalId);
    };
  }, []);

  const nextPrayer = useMemo(
    () =>
      schedule
        ? getNextPrayer(schedule, now)
        : null,
    [now, schedule],
  );

  const remainingTime = nextPrayer
    ? formatRemainingTime(nextPrayer.timestamp - now)
    : '';

  if (loading && !schedule) {
    return (
      <View style={styles.loadingCard}>
        <ActivityIndicator
          size="small"
          color={colors.goldLight}
        />
        <View style={styles.loadingCopy}>
          <Text style={styles.loadingTitle}>
            Horaires de prière
          </Text>
          <Text style={styles.loadingText}>
            Calcul en cours pour cette mosquée…
          </Text>
        </View>
      </View>
    );
  }

  if (!schedule) {
    return (
      <View style={styles.errorCard}>
        <Ionicons
          name="cloud-offline-outline"
          size={25}
          color={colors.goldLight}
        />

        <View style={styles.errorCopy}>
          <Text style={styles.errorTitle}>
            Horaires indisponibles
          </Text>
          <Text style={styles.errorText}>
            {errorMessage}
          </Text>
        </View>

        <Pressable
          accessibilityLabel="Réessayer le chargement des horaires"
          onPress={() =>
            setRefreshKey((value) => value + 1)
          }
          style={({ pressed }) => [
            styles.retryButton,
            pressed && styles.pressed,
          ]}
        >
          <Ionicons
            name="refresh"
            size={18}
            color={colors.background}
          />
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <View>
          <Text style={styles.sectionEyebrow}>
            HORAIRES CALCULÉS
          </Text>
          <Text style={styles.sectionTitle}>
            Prières du jour
          </Text>
        </View>

        {schedule.fromCache ? (
          <View style={styles.cacheBadge}>
            <Ionicons
              name="cloud-offline-outline"
              size={12}
              color={colors.goldLight}
            />
            <Text style={styles.cacheBadgeText}>
              Enregistrés
            </Text>
          </View>
        ) : null}
      </View>

      <View style={styles.nextPrayerCard}>
        <View style={styles.nextPrayerGlow} />

        <View style={styles.nextPrayerIcon}>
          <Ionicons
            name="moon-outline"
            size={25}
            color={colors.background}
          />
        </View>

        <View style={styles.nextPrayerCopy}>
          <Text style={styles.nextPrayerEyebrow}>
            PROCHAINE PRIÈRE
          </Text>
          <Text style={styles.nextPrayerName}>
            {nextPrayer?.label ?? 'Fajr'}
          </Text>
          <Text style={styles.dateText}>
            {schedule.dateLabel}
          </Text>
        </View>

        <View style={styles.countdownCopy}>
          <Text style={styles.nextPrayerTime}>
            {nextPrayer?.time ?? '--:--'}
          </Text>
          <Text style={styles.countdown}>
            {remainingTime || 'Actualisation…'}
          </Text>
        </View>
      </View>

      <View style={styles.prayerGrid}>
        {schedule.prayers.map((prayer) => {
          const active =
            prayer.timestamp === nextPrayer?.timestamp;

          return (
            <View
              key={prayer.key}
              style={[
                styles.prayerItem,
                active && styles.prayerItemActive,
              ]}
            >
              <Text
                style={[
                  styles.prayerLabel,
                  active && styles.prayerLabelActive,
                ]}
              >
                {prayer.label}
              </Text>
              <Text
                style={[
                  styles.prayerTime,
                  active && styles.prayerTimeActive,
                ]}
              >
                {prayer.time}
              </Text>

              {active ? (
                <View style={styles.activeDot} />
              ) : null}
            </View>
          );
        })}
      </View>

      <View style={styles.methodNotice}>
        <Ionicons
          name="information-circle-outline"
          size={17}
          color={colors.goldLight}
        />
        <Text style={styles.methodText}>
          Méthode France/UOIF (12°). Les horaires calculés
          peuvent différer de quelques minutes du calendrier
          affiché par la mosquée.
        </Text>
      </View>
    </View>
  );
}

export default memo(MosquePrayerCountdown);

const styles = StyleSheet.create({
  section: {
    marginTop: 14,
  },
  sectionHeader: {
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  sectionEyebrow: {
    color: colors.textMuted,
    fontFamily: typography.sans,
    fontSize: 9.5,
    fontWeight: '700',
    letterSpacing: 1.1,
  },
  sectionTitle: {
    marginTop: 3,
    color: colors.goldLight,
    fontFamily: typography.serifMedium,
    fontSize: 23,
  },
  cacheBadge: {
    paddingHorizontal: 9,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 11,
    backgroundColor: 'rgba(224,188,112,0.08)',
  },
  cacheBadgeText: {
    color: colors.goldLight,
    fontFamily: typography.sans,
    fontSize: 9.5,
    fontWeight: '600',
  },
  loadingCard: {
    minHeight: 96,
    marginTop: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: colors.backgroundSecondary,
  },
  loadingCopy: {
    flex: 1,
  },
  loadingTitle: {
    color: colors.text,
    fontFamily: typography.serifMedium,
    fontSize: 18,
  },
  loadingText: {
    marginTop: 3,
    color: colors.textMuted,
    fontFamily: typography.sans,
    fontSize: 11.5,
  },
  errorCard: {
    minHeight: 104,
    marginTop: 14,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: colors.backgroundSecondary,
  },
  errorCopy: {
    flex: 1,
  },
  errorTitle: {
    color: colors.text,
    fontFamily: typography.serifMedium,
    fontSize: 17,
  },
  errorText: {
    marginTop: 3,
    color: colors.textMuted,
    fontFamily: typography.sans,
    fontSize: 11.5,
    lineHeight: 17,
  },
  retryButton: {
    width: 39,
    height: 39,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: colors.goldLight,
  },
  nextPrayerCard: {
    overflow: 'hidden',
    minHeight: 116,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(224,188,112,0.50)',
    backgroundColor: colors.surfaceAlt,
  },
  nextPrayerGlow: {
    position: 'absolute',
    top: -70,
    right: -30,
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: 'rgba(126,72,148,0.28)',
  },
  nextPrayerIcon: {
    width: 51,
    height: 51,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 26,
    backgroundColor: colors.goldLight,
  },
  nextPrayerCopy: {
    flex: 1,
    minWidth: 0,
    marginLeft: 12,
  },
  nextPrayerEyebrow: {
    color: colors.goldLight,
    fontFamily: typography.sans,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1,
  },
  nextPrayerName: {
    marginTop: 3,
    color: colors.text,
    fontFamily: typography.serifMedium,
    fontSize: 24,
  },
  dateText: {
    marginTop: 2,
    color: colors.textMuted,
    fontFamily: typography.sans,
    fontSize: 10.5,
    textTransform: 'capitalize',
  },
  countdownCopy: {
    marginLeft: 8,
    alignItems: 'flex-end',
  },
  nextPrayerTime: {
    color: colors.goldLight,
    fontFamily: typography.serifMedium,
    fontSize: 25,
  },
  countdown: {
    marginTop: 4,
    color: colors.textSecondary,
    fontFamily: typography.sans,
    fontSize: 10.5,
    fontVariant: ['tabular-nums'],
  },
  prayerGrid: {
    marginTop: 9,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  prayerItem: {
    position: 'relative',
    overflow: 'hidden',
    width: '31%',
    minHeight: 69,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: colors.backgroundSecondary,
  },
  prayerItemActive: {
    borderColor: colors.goldLight,
    backgroundColor: 'rgba(224,188,112,0.08)',
  },
  prayerLabel: {
    color: colors.textMuted,
    fontFamily: typography.sans,
    fontSize: 10.5,
  },
  prayerLabelActive: {
    color: colors.goldLight,
    fontWeight: '700',
  },
  prayerTime: {
    marginTop: 5,
    color: colors.text,
    fontFamily: typography.serifMedium,
    fontSize: 17,
    fontVariant: ['tabular-nums'],
  },
  prayerTimeActive: {
    color: colors.goldLight,
  },
  activeDot: {
    position: 'absolute',
    bottom: 6,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.goldLight,
  },
  methodNotice: {
    marginTop: 9,
    padding: 11,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 7,
    borderRadius: 14,
    backgroundColor: 'rgba(224,188,112,0.06)',
  },
  methodText: {
    flex: 1,
    color: colors.textMuted,
    fontFamily: typography.sans,
    fontSize: 9.5,
    lineHeight: 14,
  },
  pressed: {
    opacity: 0.72,
  },
});