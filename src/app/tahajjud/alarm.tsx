import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Linking, Platform, Pressable, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { GlassCard, shellStyles, TahajjudShell } from '../../components/tahajjud/TahajjudShell';
import { night, nightType } from '../../components/tahajjud/theme';
import { formatTimeInput, parseTime } from '../../features/mosques/timeInput';
import {
  ALARM_MODES,
  alarmTime,
  bedtimeSuggestions,
  clock,
  formatDuration,
  type AlarmMode,
} from '../../features/tahajjud/tahajjudNight';
import {
  canSetSystemAlarm,
  ensureTahajjudNotificationPermission,
  refreshTahajjudNotifications,
  setSystemAlarm,
} from '../../features/tahajjud/tahajjudService';
import { loadTahajjudSettings, saveTahajjudSettings, type TahajjudSettings } from '../../features/tahajjud/TahajjudStore';
import { useTahajjudNight } from '../../features/tahajjud/useTahajjudNight';

const NOTIFICATIONS: readonly { key: keyof TahajjudSettings['notifications']; title: string; text: string }[] = [
  { key: 'bedtime', title: 'Heure du coucher', text: 'Selon le nombre de cycles de sommeil choisi ci-dessus' },
  { key: 'evening', title: 'Rappel du soir', text: '45 min après ‘Isha, pour formuler l’intention' },
  { key: 'soon', title: 'Le dernier tiers commence bientôt', text: '15 minutes avant' },
  { key: 'start', title: 'Le dernier tiers commence maintenant', text: 'Au début exact du dernier tiers' },
  { key: 'fajr', title: 'Fajr approche', text: '30 minutes avant Fajr, pour le Witr' },
];

export default function TahajjudAlarmScreen() {
  const { state } = useTahajjudNight();
  const [settings, setSettings] = useState<TahajjudSettings | null>(null);
  const [custom, setCustom] = useState('');

  useFocusEffect(useCallback(() => {
    void loadTahajjudSettings().then((value) => {
      setSettings(value);
      setCustom(value.alarm.customTime ? formatTimeInput(value.alarm.customTime) : '');
    });
  }, []));

  const update = async (next: TahajjudSettings) => {
    const enabling = next.alarm.enabled || Object.values(next.notifications).some(Boolean);
    if (enabling && !(await ensureTahajjudNotificationPermission())) {
      Alert.alert('Notifications désactivées', 'Autorisez les notifications d’OUMMAH pour être réveillé.', [
        { text: 'Plus tard', style: 'cancel' },
        { text: 'Réglages', onPress: () => void Linking.openSettings() },
      ]);
      return;
    }
    setSettings(next);
    await saveTahajjudSettings(next);
    void refreshTahajjudNotifications(true);
  };

  if (!settings) return <TahajjudShell title="Mon réveil" eyebrow="Qiyam al-Layl"><View /></TahajjudShell>;

  const tonight = state?.night ?? null;
  const wakeUp = tonight ? alarmTime(tonight, settings.alarm.mode, settings.alarm.customTime) : null;
  const available = tonight && wakeUp ? tonight.fajr - wakeUp : null;
  const rest = available !== null ? available - 40 * 60_000 : null;
  const bedtimes = tonight && wakeUp ? bedtimeSuggestions(tonight, wakeUp) : [];

  const chooseMode = (mode: AlarmMode) => void update({ ...settings, alarm: { ...settings.alarm, mode, enabled: true } });

  const saveCustom = (value: string) => {
    const formatted = formatTimeInput(value);
    setCustom(formatted);
    const time = parseTime(formatted);
    if (time) void update({ ...settings, alarm: { ...settings.alarm, mode: 'custom', customTime: time, enabled: true } });
  };

  const addSystemAlarm = async () => {
    if (!wakeUp) return;
    const ok = await setSystemAlarm(wakeUp);
    if (!ok) Alert.alert('Réveil du téléphone', 'Impossible d’ouvrir l’application Horloge sur ce téléphone.');
  };

  return (
    <TahajjudShell title="Mon réveil" eyebrow="Qiyam al-Layl">
      <GlassCard gold>
        <View style={styles.row}>
          <View style={styles.rowCopy}>
            <Text style={styles.cardTitle}>Me réveiller pour prier la nuit</Text>
            <Text style={styles.cardText}>Chaque nuit, recalculé selon vos horaires.</Text>
          </View>
          <Switch
            value={settings.alarm.enabled}
            onValueChange={(enabled) => void update({ ...settings, alarm: { ...settings.alarm, enabled } })}
            trackColor={{ false: 'rgba(255,255,255,0.15)', true: night.gold }}
            thumbColor={night.text}
          />
        </View>
        {wakeUp ? (
          <View style={styles.bigTime}>
            <Text style={styles.bigTimeValue}>{clock(wakeUp)}</Text>
            <Text style={styles.bigTimeLabel}>{settings.alarm.enabled ? 'cette nuit' : 'désactivé'}</Text>
          </View>
        ) : null}
      </GlassCard>

      <Text style={[shellStyles.sectionLabel, styles.section]}>Quand me réveiller</Text>
      <GlassCard style={styles.list}>
        {ALARM_MODES.map(({ mode, label }, index) => {
          const selected = settings.alarm.mode === mode;
          const time = tonight && mode !== 'custom' ? clock(alarmTime(tonight, mode)) : null;
          return (
            <Pressable key={mode} onPress={() => chooseMode(mode)} style={[styles.option, index > 0 && styles.optionBorder]}>
              <View style={[styles.radio, selected && styles.radioOn]}>{selected ? <View style={styles.radioDot} /> : null}</View>
              <Text style={[styles.optionLabel, selected && styles.optionLabelOn]}>{label}</Text>
              {mode === 'custom' ? (
                <TextInput
                  value={custom}
                  onChangeText={saveCustom}
                  onFocus={() => settings.alarm.mode !== 'custom' && chooseMode('custom')}
                  placeholder="04H00"
                  placeholderTextColor={night.muted}
                  keyboardType="number-pad"
                  maxLength={5}
                  style={styles.customInput}
                />
              ) : (
                <Text style={styles.optionTime}>{time}</Text>
              )}
            </Pressable>
          );
        })}
      </GlassCard>

      {tonight && wakeUp ? (
        <>
          <Text style={[shellStyles.sectionLabel, styles.section]}>Ma nuit</Text>
          <GlassCard>
            <View style={styles.metric}>
              <Ionicons name="hourglass-outline" size={18} color={night.goldSoft} />
              <Text style={styles.metricText}>
                <Text style={styles.metricStrong}>{formatDuration(available ?? 0)}</Text> pour prier, du réveil à Fajr ({clock(tonight.fajr)})
              </Text>
            </View>
            {rest !== null && rest >= 45 * 60_000 ? (
              <View style={styles.metric}>
                <Ionicons name="bed-outline" size={18} color={night.lavender} />
                <Text style={styles.metricText}>
                  Après une prière d’environ 30 min, <Text style={styles.metricStrong}>{formatDuration(rest)}</Text> pour vous recoucher avant Fajr
                </Text>
              </View>
            ) : null}
            {bedtimes.length ? (
              <>
                <Text style={styles.bedTitle}>Se coucher à</Text>
                <Text style={styles.bedHint}>Cycles de sommeil complets (≈ 1 h 30) : on se réveille plus facilement. Touchez un horaire pour être prévenu chaque soir.</Text>
                <View style={styles.bedRow}>
                  {[...bedtimes].reverse().slice(0, 3).map((item) => {
                    const chosen = settings.notifications.bedtime && settings.bedtimeCycles === item.cycles;
                    return (
                      <Pressable
                        key={item.cycles}
                        onPress={() => void update({ ...settings, bedtimeCycles: item.cycles, notifications: { ...settings.notifications, bedtime: !chosen } })}
                        style={[styles.bedChip, chosen && styles.bedChipOn]}
                      >
                        {chosen ? <Ionicons name="notifications" size={13} color={night.sky0} /> : null}
                        <Text style={[styles.bedTime, chosen && styles.bedTextOn]}>{clock(item.at)}</Text>
                        <Text style={[styles.bedSleep, chosen && styles.bedTextOn]}>{formatDuration(item.sleep)} de sommeil</Text>
                      </Pressable>
                    );
                  })}
                </View>
              </>
            ) : null}
          </GlassCard>

          {canSetSystemAlarm ? (
            <Pressable onPress={() => void addSystemAlarm()} style={({ pressed }) => [styles.systemButton, pressed && styles.pressed]}>
              <Ionicons name="alarm-outline" size={20} color={night.goldSoft} />
              <View style={styles.rowCopy}>
                <Text style={styles.cardTitle}>Ajouter au réveil du téléphone</Text>
                <Text style={styles.cardText}>Une vraie sonnerie à {clock(wakeUp)}, même en mode silencieux.</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={night.muted} />
            </Pressable>
          ) : Platform.OS === 'ios' ? (
            <Text style={styles.note}>
              Sur iPhone, OUMMAH vous réveille par une notification : gardez le son activé, ou ajoutez aussi une alarme dans l’app Horloge.
            </Text>
          ) : null}
        </>
      ) : null}

      <Text style={[shellStyles.sectionLabel, styles.section]}>Notifications</Text>
      <GlassCard style={styles.list}>
        {NOTIFICATIONS.map((item, index) => (
          <View key={item.key} style={[styles.option, index > 0 && styles.optionBorder]}>
            <View style={styles.rowCopy}>
              <Text style={styles.optionLabelOn}>{item.title}</Text>
              <Text style={styles.cardText}>{item.text}</Text>
            </View>
            <Switch
              value={settings.notifications[item.key]}
              onValueChange={(value) => void update({ ...settings, notifications: { ...settings.notifications, [item.key]: value } })}
              trackColor={{ false: 'rgba(255,255,255,0.15)', true: night.gold }}
              thumbColor={night.text}
            />
          </View>
        ))}
      </GlassCard>
      <Text style={styles.note}>Tout peut être désactivé à tout moment. Une nuit enregistrée ne reçoit plus de rappel.</Text>
    </TahajjudShell>
  );
}

const styles = StyleSheet.create({
  section: { marginTop: 26 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rowCopy: { flex: 1 },
  cardTitle: { color: night.text, fontSize: 20, ...nightType.semibold },
  cardText: { marginTop: 3, color: night.muted, fontSize: 16, lineHeight: 20, ...nightType.body },
  bigTime: { marginTop: 14, flexDirection: 'row', alignItems: 'baseline', gap: 10 },
  bigTimeValue: { color: night.goldSoft, fontSize: 58, lineHeight: 62, ...nightType.display },
  bigTimeLabel: { color: night.textSoft, fontSize: 17, ...nightType.medium },
  list: { paddingVertical: 4 },
  option: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 56, paddingVertical: 8 },
  optionBorder: { borderTopWidth: 1, borderTopColor: night.line },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, borderColor: night.muted, alignItems: 'center', justifyContent: 'center' },
  radioOn: { borderColor: night.gold },
  radioDot: { width: 11, height: 11, borderRadius: 6, backgroundColor: night.gold },
  optionLabel: { flex: 1, color: night.textSoft, fontSize: 18, ...nightType.medium },
  optionLabelOn: { color: night.text, fontSize: 18, ...nightType.semibold },
  optionTime: { color: night.goldSoft, fontSize: 20, ...nightType.bold },
  customInput: { width: 84, height: 40, borderRadius: 12, borderWidth: 1, borderColor: night.goldLine, color: night.text, textAlign: 'center', fontSize: 20, ...nightType.bold },
  metric: { flexDirection: 'row', gap: 10, alignItems: 'flex-start', marginBottom: 12 },
  metricText: { flex: 1, color: night.textSoft, fontSize: 17, lineHeight: 24, ...nightType.body },
  metricStrong: { color: night.text, ...nightType.bold },
  bedTitle: { marginTop: 6, color: night.text, fontSize: 18, ...nightType.semibold },
  bedHint: { marginTop: 2, color: night.muted, fontSize: 15, ...nightType.body },
  bedRow: { marginTop: 12, flexDirection: 'row', gap: 8 },
  bedChip: { flex: 1, borderRadius: 16, paddingVertical: 12, alignItems: 'center', backgroundColor: '#181431', borderWidth: 1, borderColor: night.line },
  bedTime: { color: night.text, fontSize: 22, ...nightType.bold },
  bedSleep: { marginTop: 2, color: night.muted, fontSize: 14, ...nightType.body },
  bedChipOn: { backgroundColor: night.gold, borderColor: night.gold },
  bedTextOn: { color: night.sky0 },
  systemButton: { marginTop: 14, flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderRadius: 22, borderWidth: 1, borderColor: night.goldLine, backgroundColor: '#191324' },
  note: { marginTop: 12, color: night.muted, fontSize: 15, lineHeight: 21, ...nightType.body },
  pressed: { opacity: 0.85 },
});
