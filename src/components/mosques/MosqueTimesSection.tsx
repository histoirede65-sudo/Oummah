import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { MosquePrayerSchedule } from '../../features/mosques/data/mosquePrayerTimes';
import {
  getIqamaTime,
  type MosquePrayerTimes,
  type MosqueSpecialTimes,
} from '../../features/mosques/data/mosquePrayerUpdates';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';

const PRAYERS = [
  { key: 'fajr', label: 'Fajr' },
  { key: 'dhuhr', label: 'Dhuhr' },
  { key: 'asr', label: 'Asr' },
  { key: 'maghrib', label: 'Maghrib' },
  { key: 'isha', label: 'Isha' },
] as const;

const SPECIAL_LABELS: Record<MosqueSpecialTimes['kind'], string> = {
  ramadan: 'Ramadan',
  eid_fitr: 'Aïd al-Fitr',
  eid_adha: 'Aïd al-Adha',
};

function todayKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

function daysBetween(from: string, to: string) {
  return Math.round((Date.parse(`${to}T12:00:00`) - Date.parse(`${from}T12:00:00`)) / 86_400_000);
}

function formatDay(value: string, withWeekday = false) {
  try {
    return new Date(`${value}T12:00:00`).toLocaleDateString('fr-FR', {
      ...(withWeekday ? { weekday: 'long' } : {}), day: 'numeric', month: 'long',
    });
  } catch {
    return value;
  }
}

/** Ramadan shown from 30 days before its start until its last day; Aïd up to 60 days ahead. */
function visibleSpecialTimes(special: MosqueSpecialTimes[]) {
  const today = todayKey();
  return special
    .filter((item) => item.kind === 'ramadan'
      ? daysBetween(today, item.validFrom) <= 30 && daysBetween(today, item.validTo ?? item.validFrom) >= 0
      : daysBetween(today, item.validFrom) >= 0 && daysBetween(today, item.validFrom) <= 60)
    .sort((a, b) => a.validFrom.localeCompare(b.validFrom));
}

type Props = {
  schedule: MosquePrayerSchedule | null;
  approved: MosquePrayerTimes | null;
  special: MosqueSpecialTimes[];
  onPropose: () => void;
};

export default function MosqueTimesSection({ schedule, approved, special, onPropose }: Props) {
  const iqamaFor = (key: typeof PRAYERS[number]['key']) => {
    const adhan = schedule?.prayers.find((prayer) => prayer.key.toLowerCase() === key);
    return adhan && schedule ? getIqamaTime(approved?.iqama?.[key], adhan, schedule.timezone) : null;
  };
  const hasIqama = PRAYERS.some(({ key }) => iqamaFor(key));
  const jumuahTimes = approved?.jumuahTimes ?? [];
  const specialTimes = visibleSpecialTimes(special);
  const hasMosqueTimes = Boolean(approved && !approved.stale);

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Horaires de la mosquée</Text>

      {specialTimes.map((item) => (
        <View key={item.kind} style={styles.specialCard}>
          <View style={styles.specialHeader}>
            <Ionicons name={item.kind === 'ramadan' ? 'moon-outline' : 'star-outline'} size={18} color={colors.goldLight} />
            <Text style={styles.specialTitle}>{SPECIAL_LABELS[item.kind]}</Text>
          </View>
          {item.kind === 'ramadan' ? (
            <>
              <Text style={styles.specialDates}>
                Du {formatDay(item.validFrom)} au {formatDay(item.validTo ?? item.validFrom)}
              </Text>
              {item.tarawih ? (
                <View style={styles.row}>
                  <Text style={styles.label}>Tarawih</Text>
                  <Text style={styles.specialValue}>{item.tarawih}</Text>
                </View>
              ) : null}
            </>
          ) : (
            <>
              <Text style={styles.specialDates}>{formatDay(item.validFrom, true)}</Text>
              <View style={styles.row}>
                <Text style={styles.label}>{(item.eidTimes?.length ?? 0) > 1 ? 'Prières' : 'Prière'}</Text>
                <Text style={styles.specialValue}>{item.eidTimes?.join(' · ') ?? 'Non renseigné'}</Text>
              </View>
            </>
          )}
          {item.note ? <Text style={styles.specialNote}>{item.note}</Text> : null}
        </View>
      ))}

      <View style={styles.card}>
        {hasIqama ? (
          <View style={styles.row}>
            <Text style={styles.columnSpacer} />
            <Text style={styles.columnTitle}>Adhan</Text>
            <Text style={styles.columnTitle}>Iqama</Text>
          </View>
        ) : null}
        {PRAYERS.map(({ key, label }) => {
          const adhan = schedule?.prayers.find((prayer) => prayer.key.toLowerCase() === key)?.time;
          const iqama = iqamaFor(key);
          return (
            <View key={key} style={styles.row}>
              <Text style={styles.label}>{label}</Text>
              <Text style={[styles.value, hasIqama && styles.column]}>{adhan ?? '—'}</Text>
              {hasIqama ? <Text style={[styles.iqama, styles.column]}>{iqama ?? '—'}</Text> : null}
            </View>
          );
        })}

        <View style={styles.divider} />

        {jumuahTimes.length === 0 ? (
          <View style={styles.row}>
            <Text style={styles.jumuahLabel}>Joumou’a</Text>
            <Text style={styles.jumuahValue}>Non renseigné</Text>
          </View>
        ) : jumuahTimes.map((slot, index) => (
          <View key={`${slot.time}-${index}`} style={styles.row}>
            <View style={styles.jumuahCopy}>
              <Text style={styles.jumuahLabel}>
                {jumuahTimes.length > 1 ? `${index === 0 ? '1re' : `${index + 1}e`} Joumou’a` : 'Joumou’a'}
              </Text>
              {slot.language ? <Text style={styles.jumuahLanguage}>Khoutba : {slot.language}</Text> : null}
            </View>
            <Text style={styles.jumuahValue}>{slot.time}</Text>
          </View>
        ))}

        <Text style={styles.footnote}>
          {hasMosqueTimes && approved?.updatedAt
            ? `Horaires communiqués par les fidèles, validés le ${new Date(approved.updatedAt).toLocaleDateString('fr-FR')}.`
            : 'Horaires calculés : aucun fidèle n’a encore communiqué les horaires de cette mosquée.'}
        </Text>

        <Pressable onPress={onPropose} style={({ pressed }) => [styles.proposeButton, pressed && styles.pressed]}>
          <Ionicons name="create-outline" size={18} color={colors.background} />
          <Text style={styles.proposeButtonText}>Proposer une modification</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginTop: 24 },
  sectionTitle: { marginBottom: 11, color: colors.goldLight, fontFamily: typography.serifMedium, fontSize: 24 },
  card: { backgroundColor: '#18131F', borderRadius: 22, borderWidth: 1, borderColor: 'rgba(242,181,61,0.18)', padding: 18 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8, gap: 10 },
  label: { flex: 1, color: colors.text, fontFamily: typography.sans, fontSize: 15 },
  value: { color: colors.textMuted, fontFamily: typography.sansMedium, fontSize: 15 },
  column: { width: 64, textAlign: 'right' },
  columnSpacer: { flex: 1 },
  columnTitle: { width: 64, textAlign: 'right', color: colors.textMuted, fontFamily: typography.sansBold, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.6 },
  iqama: { color: colors.goldLight, fontFamily: typography.sansBold, fontSize: 15 },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.08)', marginVertical: 8 },
  jumuahCopy: { flex: 1 },
  jumuahLabel: { color: colors.goldLight, fontFamily: typography.sansBold, fontSize: 17 },
  jumuahLanguage: { marginTop: 2, color: colors.textMuted, fontFamily: typography.sans, fontSize: 12 },
  jumuahValue: { color: colors.goldLight, fontFamily: typography.sansBold, fontSize: 19 },
  footnote: { marginTop: 10, color: colors.textMuted, fontFamily: typography.sans, fontSize: 12, lineHeight: 17 },
  proposeButton: { marginTop: 16, minHeight: 46, borderRadius: 14, backgroundColor: colors.goldLight, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  proposeButtonText: { color: colors.background, fontFamily: typography.sansBold, fontSize: 14 },
  specialCard: { marginBottom: 12, backgroundColor: '#1F1628', borderRadius: 20, borderWidth: 1, borderColor: 'rgba(227,181,90,0.42)', padding: 16 },
  specialHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  specialTitle: { color: colors.goldLight, fontFamily: typography.sansBold, fontSize: 17 },
  specialDates: { marginTop: 4, color: colors.textSecondary, fontFamily: typography.sans, fontSize: 13 },
  specialValue: { color: colors.goldLight, fontFamily: typography.sansBold, fontSize: 17 },
  specialNote: { marginTop: 4, color: colors.textMuted, fontFamily: typography.sans, fontSize: 12 },
  pressed: { opacity: 0.72 },
});
