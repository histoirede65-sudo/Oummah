import type { Href } from 'expo-router';
import { router } from 'expo-router';
import {
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import Svg, {
  Circle,
  Defs,
  Ellipse,
  G,
  LinearGradient,
  Path,
  Rect,
  Stop,
} from 'react-native-svg';

import { useI18n, type TranslationKey } from '../i18n';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';

const shortcuts = [
  {
    id: 'quran',
    labelKey: 'home.shortcutQuran',
    subtitleKey: 'home.shortcutQuranSubtitle',
    href: '/quran',
  },
  {
    id: 'dhikr',
    labelKey: 'home.shortcutDhikr',
    subtitleKey: 'home.shortcutDhikrSubtitle',
  },
  {
    id: 'mosques',
    label: 'Mosquées',
    subtitle: 'Autour de vous',
    href: '/mosques',
  },
  {
    id: 'qibla',
    labelKey: 'home.shortcutQibla',
    subtitleKey: 'home.shortcutQiblaSubtitle',
  },
  {
    id: 'calendar',
    labelKey: 'home.shortcutCalendar',
    subtitleKey: 'home.shortcutCalendarSubtitle',
  },
] as const;

type ShortcutId = (typeof shortcuts)[number]['id'];

function QuranArtwork({ size }: { size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 88 88">
      <Defs>
        <LinearGradient id="quran-cover" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#3f315f" />
          <Stop offset="1" stopColor="#1b132d" />
        </LinearGradient>
        <LinearGradient id="quran-page" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#fff8df" />
          <Stop offset="1" stopColor="#d8c390" />
        </LinearGradient>
      </Defs>

      <Ellipse cx="45" cy="72" rx="27" ry="7" fill="rgba(0,0,0,0.26)" />
      <Path
        d="M19 25c11-4 20-1 27 6v40c-7-7-16-10-27-7V25Z"
        fill="url(#quran-page)"
        stroke="#8f6e34"
        strokeWidth="1.4"
      />
      <Path
        d="M69 25c-11-4-20-1-27 6v40c7-7 16-10 27-7V25Z"
        fill="url(#quran-page)"
        stroke="#8f6e34"
        strokeWidth="1.4"
      />
      <Path
        d="M17 21c12-5 22-1 29 7v43c-8-8-18-11-29-8V21Z"
        fill="url(#quran-cover)"
        stroke="#d9b45f"
        strokeWidth="2"
      />
      <Path
        d="M71 21c-12-5-22-1-29 7v43c8-8 18-11 29-8V21Z"
        fill="url(#quran-cover)"
        stroke="#d9b45f"
        strokeWidth="2"
      />
      <Path
        d="M44 30v38"
        stroke="#d9b45f"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <Path
        d="M27 35h12M27 41h10M49 35h12M51 41h10"
        stroke="#ead795"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <Path
        d="M31 49c4-3 8-3 12 0M45 49c4-3 8-3 12 0"
        fill="none"
        stroke="#d9b45f"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
    </Svg>
  );
}

function DhikrArtwork({ size }: { size: number }) {
  const beads = [
    [44, 15],
    [56, 19],
    [66, 28],
    [70, 41],
    [68, 54],
    [60, 64],
    [48, 70],
    [35, 69],
    [24, 63],
    [17, 53],
    [15, 40],
    [18, 28],
    [28, 19],
  ];

  return (
    <Svg width={size} height={size} viewBox="0 0 88 88">
      <Defs>
        <LinearGradient id="bead" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#d8b46b" />
          <Stop offset="1" stopColor="#7f5424" />
        </LinearGradient>
      </Defs>

      <Ellipse cx="43" cy="72" rx="25" ry="6" fill="rgba(0,0,0,0.22)" />
      <Path
        d="M44 15c18 0 29 12 27 29-2 19-17 29-34 26-17-3-25-18-20-34 4-13 14-21 27-21Z"
        fill="none"
        stroke="#87612e"
        strokeWidth="2"
      />

      {beads.map(([cx, cy], index) => (
        <G key={`${cx}-${cy}-${index}`}>
          <Circle
            cx={cx}
            cy={cy}
            r={5.3}
            fill="url(#bead)"
            stroke="#efd18c"
            strokeWidth="1"
          />
          <Circle cx={cx - 1.7} cy={cy - 1.7} r={1.2} fill="#f3dca4" />
        </G>
      ))}

      <Path
        d="M47 69c1 7 5 9 10 10"
        fill="none"
        stroke="#c99b4d"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <Path
        d="M57 78l5-2 2 6-5 2Z"
        fill="#d3ab61"
        stroke="#7d5325"
        strokeWidth="1"
      />
      <Path
        d="M63 82c4 1 7 0 9-3"
        fill="none"
        stroke="#d9b45f"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </Svg>
  );
}

function MosqueArtwork({ size }: { size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 88 88">
      <Defs>
        <LinearGradient id="mosque-body" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#f1dfae" />
          <Stop offset="1" stopColor="#b98c45" />
        </LinearGradient>
        <LinearGradient id="mosque-roof" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#6f4e8e" />
          <Stop offset="1" stopColor="#2c1c46" />
        </LinearGradient>
      </Defs>

      <Ellipse cx="44" cy="73" rx="30" ry="7" fill="rgba(0,0,0,0.25)" />
      <Rect
        x="18"
        y="42"
        width="52"
        height="28"
        rx="3"
        fill="url(#mosque-body)"
        stroke="#8b662e"
        strokeWidth="1.5"
      />
      <Path
        d="M28 42c0-12 7-20 16-24 9 4 16 12 16 24H28Z"
        fill="url(#mosque-roof)"
        stroke="#d8b15a"
        strokeWidth="1.6"
      />
      <Circle cx="44" cy="18" r="2.5" fill="#e3c16d" />
      <Path
        d="M43 14c5-4 9 0 7 4-2 3-6 4-9 2"
        fill="none"
        stroke="#e3c16d"
        strokeWidth="1.5"
        strokeLinecap="round"
      />

      <Rect x="10" y="29" width="8" height="41" rx="2" fill="#d5b166" />
      <Path
        d="M10 29h8l-4-9-4 9Z"
        fill="#684382"
        stroke="#d8b15a"
        strokeWidth="1"
      />
      <Circle cx="14" cy="18" r="1.7" fill="#e3c16d" />

      <Rect x="70" y="29" width="8" height="41" rx="2" fill="#d5b166" />
      <Path
        d="M70 29h8l-4-9-4 9Z"
        fill="#684382"
        stroke="#d8b15a"
        strokeWidth="1"
      />
      <Circle cx="74" cy="18" r="1.7" fill="#e3c16d" />

      <Path
        d="M38 70V55c0-4 2-7 6-7s6 3 6 7v15"
        fill="#2a1b42"
        stroke="#e3c16d"
        strokeWidth="1.5"
      />
      <Rect x="24" y="51" width="7" height="9" rx="3.5" fill="#6e4f87" />
      <Rect x="57" y="51" width="7" height="9" rx="3.5" fill="#6e4f87" />
    </Svg>
  );
}

function KaabaArtwork({ size }: { size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 88 88">
      <Defs>
        <LinearGradient id="kaaba-front" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#26202b" />
          <Stop offset="1" stopColor="#0c0910" />
        </LinearGradient>
        <LinearGradient id="kaaba-side" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#19131d" />
          <Stop offset="1" stopColor="#050407" />
        </LinearGradient>
      </Defs>

      <Ellipse cx="44" cy="72" rx="27" ry="7" fill="rgba(0,0,0,0.28)" />
      <Path
        d="M20 28l31-9 18 10-31 10-18-11Z"
        fill="#34283d"
        stroke="#b9984f"
        strokeWidth="1.2"
      />
      <Path
        d="M20 28l18 11v34L20 62V28Z"
        fill="url(#kaaba-side)"
        stroke="#b9984f"
        strokeWidth="1.2"
      />
      <Path
        d="M38 39l31-10v33L38 73V39Z"
        fill="url(#kaaba-front)"
        stroke="#b9984f"
        strokeWidth="1.2"
      />
      <Path
        d="M20 37l18 10 31-10v7L38 54 20 44v-7Z"
        fill="#d5ae55"
      />
      <Path
        d="M44 48l18-6"
        stroke="#f0d07a"
        strokeWidth="1"
        strokeDasharray="2 2"
      />
      <Rect x="53" y="49" width="7" height="14" rx="1" fill="#b98e39" />
      <Circle cx="54.5" cy="56" r="0.8" fill="#f3d883" />
    </Svg>
  );
}

function CalendarArtwork({ size }: { size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 88 88">
      <Defs>
        <LinearGradient id="calendar-body" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#f3e3b8" />
          <Stop offset="1" stopColor="#c89d52" />
        </LinearGradient>
      </Defs>

      <Ellipse cx="44" cy="73" rx="26" ry="6" fill="rgba(0,0,0,0.22)" />
      <Rect
        x="18"
        y="21"
        width="52"
        height="49"
        rx="8"
        fill="url(#calendar-body)"
        stroke="#8c652d"
        strokeWidth="1.5"
      />
      <Path
        d="M18 34h52"
        stroke="#6e4a84"
        strokeWidth="5"
      />
      <Path
        d="M30 15v13M58 15v13"
        stroke="#e7c76e"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <Path
        d="M45 41c8-5 15 3 10 10-4 6-14 6-19 0 2 9 10 15 19 14 9-1 15-8 15-17-1 12-13 18-25 13-10-4-11-16 0-20Z"
        fill="#65477f"
        opacity="0.92"
      />
      <Circle cx="60" cy="44" r="2" fill="#d6b15e" />
    </Svg>
  );
}

function ShortcutArtwork({
  id,
  size,
}: {
  id: ShortcutId;
  size: number;
}) {
  if (id === 'quran') return <QuranArtwork size={size} />;
  if (id === 'dhikr') return <DhikrArtwork size={size} />;
  if (id === 'mosques') return <MosqueArtwork size={size} />;
  if (id === 'qibla') return <KaabaArtwork size={size} />;
  return <CalendarArtwork size={size} />;
}

export default function HomeShortcuts() {
  const { t } = useI18n();
  const { width } = useWindowDimensions();
  const compact = width < 370;

  return (
    <View style={styles.wrapper}>
      <View style={styles.headerRow}>
        <Text style={styles.sectionTitle}>Accès rapides</Text>
        <Text style={styles.sectionHint}>Vos essentiels</Text>
      </View>

      <View style={styles.grid}>
        {shortcuts.map((item, index) => {
          const label =
            'label' in item
              ? item.label
              : t(item.labelKey as TranslationKey);
          const subtitle =
            'subtitle' in item
              ? item.subtitle
              : t(item.subtitleKey as TranslationKey);

          return (
            <Pressable
              key={item.id}
              accessibilityRole="button"
              accessibilityLabel={`${label} — ${subtitle}`}
              onPress={() => {
                if ('href' in item && item.href) {
                  router.push(item.href as Href);
                }
              }}
              style={({ pressed }) => [
                styles.card,
                compact && styles.cardCompact,
                index === 0 && styles.primaryCard,
                pressed && styles.pressed,
              ]}
            >
              <View style={styles.artworkWrap}>
                <View style={styles.artworkHalo} />
                <ShortcutArtwork
                  id={item.id}
                  size={compact ? 64 : 72}
                />
              </View>

              <Text
                numberOfLines={1}
                adjustsFontSizeToFit
                style={styles.label}
              >
                {label}
              </Text>

              <Text
                numberOfLines={1}
                adjustsFontSizeToFit
                style={styles.subtitle}
              >
                {subtitle}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 12,
  },
  headerRow: {
    marginBottom: 10,
    paddingHorizontal: 2,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    color: colors.goldLight,
    fontFamily: typography.serifMedium,
    fontSize: 20,
  },
  sectionHint: {
    color: colors.textMuted,
    fontFamily: typography.sans,
    fontSize: 9,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  card: {
    width: '31.8%',
    minHeight: 142,
    paddingHorizontal: 7,
    paddingTop: 8,
    paddingBottom: 12,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(224,188,112,0.28)',
    backgroundColor: colors.surfaceAlt,
  },
  cardCompact: {
    width: '31.4%',
    minHeight: 134,
  },
  primaryCard: {
    borderColor: 'rgba(224,188,112,0.48)',
    backgroundColor: colors.backgroundSecondary,
  },
  artworkWrap: {
    width: 78,
    height: 76,
    alignItems: 'center',
    justifyContent: 'center',
  },
  artworkHalo: {
    position: 'absolute',
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: 'rgba(126,72,148,0.18)',
  },
  label: {
    width: '100%',
    marginTop: 2,
    color: colors.text,
    fontFamily: typography.serifMedium,
    fontSize: 14,
    textAlign: 'center',
  },
  subtitle: {
    width: '100%',
    marginTop: 3,
    color: colors.textSecondary,
    fontFamily: typography.sans,
    fontSize: 9.5,
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.72,
    transform: [{ scale: 0.98 }],
  },
});