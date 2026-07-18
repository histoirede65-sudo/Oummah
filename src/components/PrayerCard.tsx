import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { useFocusEffect } from 'expo-router';
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import Svg, {
  Circle,
  Path,
  Text as SvgText,
} from 'react-native-svg';

import {
  getMosquePrayerSchedule,
  getNextPrayer,
  type MosquePrayerKey,
  type MosquePrayerSchedule,
  type MosquePrayerTime,
} from '../features/mosques/data/mosquePrayerTimes';
import {
  getMainMosque,
  type StoredMosque,
} from '../features/mosques/data/mosquePreferences';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';

const curve = {
  start: { x: 7, y: 112 },
  control: { x: 200, y: 56 },
  end: { x: 393, y: 112 },
};

const prayerPositions = [0.08, 0.29, 0.5, 0.67, 0.84, 0.96];

const PRAYER_LABELS: Record<MosquePrayerKey, string> = {
  Fajr: 'Fajr',
  Dhuhr: 'Dhohr',
  Asr: 'Asr',
  Maghrib: 'Maghrib',
  Isha: 'Isha',
};

type PrayerTimelineItem = {
  key: MosquePrayerKey | 'Sunrise';
  name: string;
  time: string;
  active: boolean;
  x: number;
  y: number;
};

type PrayerSource = {
  latitude: number;
  longitude: number;
  label: string;
  type: 'mosque' | 'location';
};

function pointOnCurve(t: number) {
  const u = 1 - t;

  return {
    x:
      u ** 2 * curve.start.x +
      2 * u * t * curve.control.x +
      t ** 2 * curve.end.x,
    y:
      u ** 2 * curve.start.y +
      2 * u * t * curve.control.y +
      t ** 2 * curve.end.y,
  };
}

function formatCountdown(milliseconds: number) {
  const totalSeconds = Math.max(
    0,
    Math.floor(milliseconds / 1_000),
  );

  const hours = Math.floor(totalSeconds / 3_600);
  const minutes = Math.floor(
    (totalSeconds % 3_600) / 60,
  );
  const seconds = totalSeconds % 60;

  return `${String(hours).padStart(2, '0')}:${String(
    minutes,
  ).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function formatDateLabel(date: Date) {
  return new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(date);
}

function getPrayerByKey(
  schedule: MosquePrayerSchedule,
  key: MosquePrayerKey,
) {
  return schedule.prayers.find(
    (prayer) => prayer.key === key,
  );
}

function makeTimeline(
  schedule: MosquePrayerSchedule,
  nextPrayer: MosquePrayerTime | null,
): PrayerTimelineItem[] {
  const fajr = getPrayerByKey(schedule, 'Fajr');
  const dhuhr = getPrayerByKey(schedule, 'Dhuhr');
  const asr = getPrayerByKey(schedule, 'Asr');
  const maghrib = getPrayerByKey(schedule, 'Maghrib');
  const isha = getPrayerByKey(schedule, 'Isha');

  const sunriseTime = fajr
    ? new Date(fajr.timestamp + 90 * 60 * 1_000)
    : null;

  const rawItems: Array<{
    key: PrayerTimelineItem['key'];
    name: string;
    time: string;
    active: boolean;
  }> = [
    {
      key: 'Fajr',
      name: 'Fajr',
      time: fajr?.time ?? '--:--',
      active:
        nextPrayer?.key === 'Fajr' &&
        nextPrayer.timestamp === fajr?.timestamp,
    },
    {
      key: 'Sunrise',
      name: 'Lever',
      time: sunriseTime
        ? `${String(sunriseTime.getHours()).padStart(
            2,
            '0',
          )}:${String(sunriseTime.getMinutes()).padStart(
            2,
            '0',
          )}`
        : '--:--',
      active: false,
    },
    {
      key: 'Dhuhr',
      name: 'Dhohr',
      time: dhuhr?.time ?? '--:--',
      active:
        nextPrayer?.key === 'Dhuhr' &&
        nextPrayer.timestamp === dhuhr?.timestamp,
    },
    {
      key: 'Asr',
      name: 'Asr',
      time: asr?.time ?? '--:--',
      active:
        nextPrayer?.key === 'Asr' &&
        nextPrayer.timestamp === asr?.timestamp,
    },
    {
      key: 'Maghrib',
      name: 'Maghrib',
      time: maghrib?.time ?? '--:--',
      active:
        nextPrayer?.key === 'Maghrib' &&
        nextPrayer.timestamp === maghrib?.timestamp,
    },
    {
      key: 'Isha',
      name: 'Isha',
      time: isha?.time ?? '--:--',
      active:
        nextPrayer?.key === 'Isha' &&
        nextPrayer.timestamp === isha?.timestamp,
    },
  ];

  return rawItems.map((prayer, index) => ({
    ...prayer,
    ...pointOnCurve(prayerPositions[index]),
  }));
}

async function resolvePrayerSource(
  mainMosque: StoredMosque | null,
): Promise<PrayerSource> {
  if (mainMosque) {
    return {
      latitude: mainMosque.latitude,
      longitude: mainMosque.longitude,
      label: mainMosque.name,
      type: 'mosque',
    };
  }

  const permission =
    await Location.requestForegroundPermissionsAsync();

  if (!permission.granted) {
    throw new Error('LOCATION_DENIED');
  }

  const lastKnown =
    await Location.getLastKnownPositionAsync();

  const position =
    lastKnown ??
    (await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    }));

  return {
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
    label: 'Votre position actuelle',
    type: 'location',
  };
}

export default function PrayerCard() {
  const { width } = useWindowDimensions();
  const compact = width < 370;

  const [mainMosque, setMainMosque] =
    useState<StoredMosque | null>(null);
  const [source, setSource] =
    useState<PrayerSource | null>(null);
  const [schedule, setSchedule] =
    useState<MosquePrayerSchedule | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [now, setNow] = useState(() => Date.now());
  const [refreshKey, setRefreshKey] = useState(0);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      const loadMainMosque = async () => {
        const mosque = await getMainMosque();

        if (active) {
          setMainMosque(mosque);
        }
      };

      void loadMainMosque();

      return () => {
        active = false;
      };
    }, []),
  );

  useEffect(() => {
    const intervalId = setInterval(() => {
      setNow(Date.now());
    }, 1_000);

    return () => {
      clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    const loadPrayerTimes = async () => {
      setLoading(true);
      setErrorMessage('');

      try {
        const resolvedSource =
          await resolvePrayerSource(mainMosque);

        const result = await getMosquePrayerSchedule(
          resolvedSource.latitude,
          resolvedSource.longitude,
          controller.signal,
        );

        if (!controller.signal.aborted) {
          setSource(resolvedSource);
          setSchedule(result);
        }
      } catch (error) {
        if (
          error instanceof Error &&
          error.name === 'AbortError'
        ) {
          return;
        }

        if (!controller.signal.aborted) {
          setSchedule(null);
          setSource(null);

          setErrorMessage(
            error instanceof Error &&
              error.message === 'LOCATION_DENIED'
              ? 'Autorisez la localisation ou choisissez une mosquée principale.'
              : 'Les horaires sont momentanément indisponibles.',
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    void loadPrayerTimes();

    return () => {
      controller.abort();
    };
  }, [
    mainMosque?.id,
    mainMosque?.latitude,
    mainMosque?.longitude,
    refreshKey,
  ]);

  const nextPrayer = useMemo(
    () =>
      schedule
        ? getNextPrayer(schedule, now)
        : null,
    [now, schedule],
  );

  const countdown = nextPrayer
    ? formatCountdown(nextPrayer.timestamp - now)
    : '--:--:--';

  const timeline = useMemo(
    () =>
      schedule
        ? makeTimeline(schedule, nextPrayer)
        : [],
    [nextPrayer, schedule],
  );

  return (
    <View style={[styles.card, compact && styles.cardCompact]}>
      <Image
        source={require('../../assets/images/mosquee-hero.png')}
        contentFit="cover"
        cachePolicy="memory-disk"
        priority="high"
        style={styles.mosque}
      />

      <LinearGradient
        colors={[
          'rgba(8,7,19,0.18)',
          'rgba(8,7,19,0.01)',
          'rgba(8,7,19,0.55)',
        ]}
        locations={[0, 0.48, 1]}
        style={StyleSheet.absoluteFill}
      />

      <LinearGradient
        colors={[
          'rgba(7,4,19,0.88)',
          'rgba(10,5,24,0.73)',
          'rgba(10,5,24,0.06)',
        ]}
        locations={[0, 0.42, 0.74]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={StyleSheet.absoluteFill}
      />

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator
            size="small"
            color={colors.primaryLight}
          />
          <Text style={styles.loadingText}>
            Calcul des horaires…
          </Text>
        </View>
      ) : errorMessage ? (
        <View style={styles.errorWrap}>
          <Ionicons
            name="warning-outline"
            size={20}
            color={colors.primaryLight}
          />
          <Text style={styles.errorText}>
            {errorMessage}
          </Text>

          <Pressable
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
              size={17}
              color={colors.background}
            />
          </Pressable>
        </View>
      ) : (
        <>
          <View style={styles.info}>
            <Text style={styles.eyebrow}>
              PROCHAINE PRIÈRE
            </Text>

            <Text
              style={[
                styles.name,
                compact && styles.nameCompact,
              ]}
            >
              {nextPrayer
                ? PRAYER_LABELS[nextPrayer.key]
                : 'Fajr'}
            </Text>

            <View style={styles.countdownBox}>
              <Text
                style={[
                  styles.countdownLabel,
                  compact &&
                    styles.countdownLabelCompact,
                ]}
              >
                {countdown}
              </Text>

              <Text style={styles.countdownCaption}>
                avant la prière
              </Text>
            </View>

            <Text
              style={[
                styles.date,
                compact && styles.dateCompact,
              ]}
            >
              {formatDateLabel(new Date())}
            </Text>

            <View style={styles.locationRow}>
              <Ionicons
                name={
                  source?.type === 'mosque'
                    ? 'business'
                    : 'location'
                }
                size={12}
                color={colors.primaryLight}
              />

              <Text
                numberOfLines={1}
                style={styles.location}
              >
                {source?.label ?? 'Votre position'}
              </Text>
            </View>
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.adhan,
              compact && styles.adhanCompact,
              pressed && styles.pressed,
            ]}
          >
            <Ionicons
              name="volume-medium-outline"
              size={16}
              color={colors.primaryLight}
            />
            <Text style={styles.adhanText}>
              Adhan
            </Text>
          </Pressable>

          <View style={styles.timeline}>
            <Svg
              width="100%"
              height="114"
              viewBox="0 0 400 114"
            >
              <Path
                d="M 7 112 Q 200 56 393 112"
                fill="none"
                stroke={colors.primary}
                strokeWidth={1}
              />

              {timeline
                .filter((prayer) => prayer.active)
                .map((prayer) => (
                  <Circle
                    key={`${prayer.key}-glow`}
                    cx={prayer.x}
                    cy={prayer.y}
                    r={15}
                    fill="rgba(240,217,154,0.13)"
                  />
                ))}

              {timeline
                .filter((prayer) => !prayer.active)
                .map((prayer) => (
                  <Circle
                    key={`${prayer.key}-glow`}
                    cx={prayer.x}
                    cy={prayer.y}
                    r={7.5}
                    fill="rgba(227,181,90,0.14)"
                  />
                ))}

              {timeline.map((prayer) => (
                <Circle
                  key={`${prayer.key}-outer`}
                  cx={prayer.x}
                  cy={prayer.y}
                  r={prayer.active ? 10 : 4.3}
                  fill={
                    prayer.active
                      ? 'rgba(16,10,36,0.86)'
                      : colors.primaryLight
                  }
                  stroke={colors.primaryLight}
                  strokeWidth={
                    prayer.active ? 2 : 1
                  }
                />
              ))}

              {timeline
                .filter((prayer) => prayer.active)
                .map((prayer) => (
                  <Circle
                    key={`${prayer.key}-inner`}
                    cx={prayer.x}
                    cy={prayer.y}
                    r={6.5}
                    fill={colors.primary}
                  />
                ))}

              {timeline.map((prayer) => (
                <SvgText
                  key={`${prayer.key}-label`}
                  x={prayer.x}
                  y={Math.max(13, prayer.y - 25)}
                  fill={colors.text}
                  fontSize={
                    prayer.key === 'Sunrise'
                      ? 8.4
                      : 9.2
                  }
                  fontWeight="600"
                  textAnchor="middle"
                >
                  {prayer.name}
                </SvgText>
              ))}

              {timeline.map((prayer) => (
                <SvgText
                  key={`${prayer.key}-time`}
                  x={prayer.x}
                  y={Math.max(26, prayer.y - 12)}
                  fill={
                    prayer.active
                      ? colors.primaryLight
                      : colors.textSecondary
                  }
                  fontSize={8.3}
                  fontWeight={
                    prayer.active ? '700' : '500'
                  }
                  textAnchor="middle"
                >
                  {prayer.time}
                </SvgText>
              ))}
            </Svg>
          </View>
        </>
      )}

      <View style={styles.downButton}>
        <Ionicons
          name="chevron-down"
          size={20}
          color={colors.text}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    height: 276,
    marginBottom: 8,
    overflow: 'hidden',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  cardCompact: {
    height: 266,
  },
  mosque: {
    position: 'absolute',
    top: 0,
    right: '-6%',
    bottom: 0,
    left: '-2%',
    width: '108%',
    height: '100%',
  },
  info: {
    position: 'absolute',
    top: 18,
    left: 16,
    width: '58%',
  },
  eyebrow: {
    color: colors.textSecondary,
    fontFamily: typography.sans,
    fontSize: 10.5,
    fontWeight: '600',
    letterSpacing: 1,
  },
  name: {
    marginTop: 2,
    color: colors.text,
    fontFamily: typography.serifSemibold,
    fontSize: 34,
    fontWeight: '400',
  },
  nameCompact: {
    fontSize: 30,
  },
  countdownBox: {
    alignSelf: 'flex-start',
    minWidth: 172,
    marginTop: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(240,217,154,0.50)',
    backgroundColor: 'rgba(19,10,34,0.88)',
  },
  countdownLabel: {
    color: colors.primaryLight,
    fontFamily: typography.serifSemibold,
    fontSize: 31,
    fontWeight: '600',
    letterSpacing: 1.7,
    fontVariant: ['tabular-nums'],
  },
  countdownLabelCompact: {
    fontSize: 27,
    letterSpacing: 0.7,
  },
  countdownCaption: {
    marginTop: 1,
    color: colors.textSecondary,
    fontFamily: typography.sans,
    fontSize: 9.5,
  },
  date: {
    marginTop: 6,
    color: colors.textSecondary,
    fontFamily: typography.sans,
    fontSize: 10.5,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  dateCompact: {
    fontSize: 9.5,
  },
  locationRow: {
    marginTop: 5,
    flexDirection: 'row',
    alignItems: 'center',
  },
  location: {
    flexShrink: 1,
    marginLeft: 4,
    color: colors.text,
    fontFamily: typography.sans,
    fontSize: 10.5,
    fontWeight: '500',
  },
  adhan: {
    position: 'absolute',
    top: 10,
    right: 12,
    paddingHorizontal: 13,
    paddingVertical: 9,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 22,
    backgroundColor: 'rgba(21,12,36,0.86)',
  },
  adhanCompact: {
    right: 9,
    paddingHorizontal: 10,
  },
  adhanText: {
    marginLeft: 5,
    color: colors.primaryLight,
    fontFamily: typography.sans,
    fontSize: 11,
  },
  timeline: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    left: 0,
  },
  downButton: {
    position: 'absolute',
    bottom: -1,
    left: '50%',
    width: 34,
    height: 27,
    marginLeft: -17,
    alignItems: 'center',
    justifyContent: 'center',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: '#60406F',
    backgroundColor: '#2A153D',
  },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
  },
  loadingText: {
    color: colors.textSecondary,
    fontFamily: typography.sans,
    fontSize: 12,
  },
  errorWrap: {
    flex: 1,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    marginTop: 8,
    color: colors.text,
    fontFamily: typography.sans,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
  },
  retryButton: {
    width: 40,
    height: 40,
    marginTop: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: colors.primaryLight,
  },
  pressed: {
    opacity: 0.6,
  },
});