import { useEffect, useState } from 'react';
import { Alert, Linking, StyleSheet, Switch, Text, View } from 'react-native';
import {
  getMosqueReminderSettings,
  saveMosqueReminderSettings,
  type MosqueReminderSettings,
} from '../../features/mosques/mosqueReminders';
import { useI18n } from '../../i18n';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';

// « Partez maintenant » was removed: the travel time came from where the phone was when the reminders were
// scheduled (up to 3 days before), not from where the user is when it rings. Only event reminders remain.
type Props = { mosque: MosqueReminderSettings['mosque']; hasJumuahTime?: boolean };

export default function MosqueRemindersSection({ mosque }: Props) {
  const { t } = useI18n();
  const [events, setEvents] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    void getMosqueReminderSettings(mosque.id).then((settings) => {
      if (!active) return;
      setEvents(settings?.events ?? false);
    });
    return () => { active = false; };
  }, [mosque.id]);

  const save = async (next: { events: boolean }) => {
    if (saving) return;
    const previous = events;
    setEvents(next.events);
    setSaving(true);
    try {
      const result = await saveMosqueReminderSettings({ mosque, events: next.events, leaveNow: [] });
      if (!result.ok) {
        setEvents(previous);
        Alert.alert(
          result.reason === 'location' ? t('mosque.locationNeededTitle') : t('mosque.notificationsOffTitle'),
          result.reason === 'location' ? t('mosque.locationNeededText') : t('mosque.notificationsOffText'),
          [
            { text: t('mosque.later'), style: 'cancel' },
            { text: t('mosques.settings'), onPress: () => void Linking.openSettings() },
          ],
        );
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{t('mosque.notifications')}</Text>
      <View style={styles.card}>
        <View style={styles.row}>
          <View style={styles.copy}>
            <Text style={styles.title}>{t('mosque.postsTitle')}</Text>
            <Text style={styles.text}>{t('mosque.eventsNotifText')}</Text>
          </View>
          <Switch
            value={events}
            disabled={saving}
            onValueChange={(value) => void save({ events: value })}
            trackColor={{ false: 'rgba(255,255,255,0.16)', true: colors.goldDark }}
            thumbColor={events ? colors.goldLight : '#CFC6D6'}
          />
        </View>

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
});
