import { useEffect, useState } from 'react';
import { Alert, Linking, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import {
  getMosqueReminderSettings,
  saveMosqueReminderSettings,
  type MosqueReminderSettings,
  type ReminderPrayer,
} from '../../features/mosques/mosqueReminders';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';

const PRAYERS: readonly { key: ReminderPrayer; label: string }[] = [
  { key: 'fajr', label: 'Fajr' },
  { key: 'dhuhr', label: 'Dhuhr' },
  { key: 'asr', label: 'Asr' },
  { key: 'maghrib', label: 'Maghrib' },
  { key: 'isha', label: 'Isha' },
  { key: 'jumuah', label: 'Joumou’a' },
];

type Props = { mosque: MosqueReminderSettings['mosque']; hasJumuahTime: boolean };

export default function MosqueRemindersSection({ mosque, hasJumuahTime }: Props) {
  const [events, setEvents] = useState(false);
  const [leaveNow, setLeaveNow] = useState<ReminderPrayer[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    void getMosqueReminderSettings(mosque.id).then((settings) => {
      if (!active) return;
      setEvents(settings?.events ?? false);
      setLeaveNow(settings?.leaveNow ?? []);
    });
    return () => { active = false; };
  }, [mosque.id]);

  const save = async (next: { events: boolean; leaveNow: ReminderPrayer[] }) => {
    if (saving) return;
    const previous = { events, leaveNow };
    setEvents(next.events);
    setLeaveNow(next.leaveNow);
    setSaving(true);
    try {
      const result = await saveMosqueReminderSettings({ mosque, ...next });
      if (!result.ok) {
        setEvents(previous.events);
        setLeaveNow(previous.leaveNow);
        Alert.alert(
          result.reason === 'location' ? 'Position nécessaire' : 'Notifications désactivées',
          result.reason === 'location'
            ? 'Autorisez la localisation pour calculer le moment de partir vers la mosquée.'
            : 'Autorisez les notifications d’OUMMAH dans les réglages du téléphone.',
          [{ text: 'Plus tard', style: 'cancel' }, { text: 'Réglages', onPress: () => void Linking.openSettings() }],
        );
      }
    } finally {
      setSaving(false);
    }
  };

  const togglePrayer = (key: ReminderPrayer) => {
    const next = leaveNow.includes(key) ? leaveNow.filter((item) => item !== key) : [...leaveNow, key];
    void save({ events, leaveNow: next });
  };

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Notifications</Text>
      <View style={styles.card}>
        <View style={styles.row}>
          <View style={styles.copy}>
            <Text style={styles.title}>Annonces et événements</Text>
            <Text style={styles.text}>
              Une notification dès qu’une annonce ou un événement est publié (compte connecté), et un rappel
              2 heures avant chaque événement.
            </Text>
          </View>
          <Switch
            value={events}
            disabled={saving}
            onValueChange={(value) => void save({ events: value, leaveNow })}
            trackColor={{ false: 'rgba(255,255,255,0.16)', true: colors.goldDark }}
            thumbColor={events ? colors.goldLight : '#CFC6D6'}
          />
        </View>

        <View style={styles.divider} />

        <Text style={styles.title}>Pars maintenant</Text>
        <Text style={styles.text}>
          Une notification au moment de partir pour arriver 5 minutes avant l’iqama, selon le temps de trajet
          depuis votre position.
        </Text>
        <View style={styles.chips}>
          {PRAYERS.map(({ key, label }) => {
            const active = leaveNow.includes(key);
            return (
              <Pressable
                key={key}
                disabled={saving}
                onPress={() => togglePrayer(key)}
                style={[styles.chip, active && styles.chipActive]}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
              </Pressable>
            );
          })}
        </View>
        {leaveNow.includes('jumuah') && !hasJumuahTime ? (
          <Text style={styles.warning}>
            L’heure de Joumou’a de cette mosquée n’est pas encore connue : proposez-la dans les horaires.
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginTop: 24 },
  sectionTitle: { marginBottom: 11, color: colors.goldLight, fontFamily: typography.serifMedium, fontSize: 24 },
  card: { backgroundColor: '#18131F', borderRadius: 22, borderWidth: 1, borderColor: 'rgba(242,181,61,0.18)', padding: 16 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  copy: { flex: 1 },
  title: { color: colors.text, fontFamily: typography.sansBold, fontSize: 16 },
  text: { marginTop: 3, color: colors.textMuted, fontFamily: typography.sans, fontSize: 13, lineHeight: 18 },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.08)', marginVertical: 14 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  chip: { minHeight: 36, paddingHorizontal: 13, borderRadius: 18, borderWidth: 1, borderColor: 'rgba(242,181,61,0.24)', justifyContent: 'center' },
  chipActive: { backgroundColor: colors.goldLight, borderColor: colors.goldLight },
  chipText: { color: colors.text, fontFamily: typography.sansMedium, fontSize: 13 },
  chipTextActive: { color: colors.background, fontFamily: typography.sansBold },
  warning: { marginTop: 10, color: colors.goldLight, fontFamily: typography.sans, fontSize: 12, lineHeight: 17 },
});
