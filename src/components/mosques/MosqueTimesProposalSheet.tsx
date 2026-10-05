import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import type { MosquePrayerSchedule } from '../../features/mosques/data/mosquePrayerTimes';
import {
  proposeMosquePrayerTimes,
  type IqamaRule,
  type MosquePrayerTimes,
  type MosqueProposalKind,
  type MosqueSpecialTimes,
} from '../../features/mosques/data/mosquePrayerUpdates';
import { formatDateInput, formatTimeInput, isoToDateInput as isoToInput, parseDate, parseTime } from '../../features/mosques/timeInput';
import { useI18n } from '../../i18n';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';

const PRAYERS = [
  { key: 'fajr', label: 'Fajr' },
  { key: 'dhuhr', label: 'Dhuhr' },
  { key: 'asr', label: 'Asr' },
  { key: 'maghrib', label: 'Maghrib' },
  { key: 'isha', label: 'Isha' },
] as const;
type PrayerKey = typeof PRAYERS[number]['key'];

const KINDS = [
  { kind: 'regular', labelKey: 'mosque.kindRegular' },
  { kind: 'ramadan', labelKey: 'mosque.ramadan' },
  { kind: 'eid_fitr', labelKey: 'mosque.eidFitr' },
  { kind: 'eid_adha', labelKey: 'mosque.eidAdha' },
] as const satisfies readonly { kind: MosqueProposalKind; labelKey: string }[];

const MAX_JUMUAH = 3;
const MAX_EID_TIMES = 3;

function timeToInput(value?: string | null) {
  return value ? formatTimeInput(value) : '';
}

// ----- Form state ----------------------------------------------------------------------------

type IqamaInput = { mode: 'after' | 'at'; value: string };
type RegularForm = {
  adhan: Record<PrayerKey, string>;
  iqama: Record<PrayerKey, IqamaInput>;
  jumuah: { time: string; language: string }[];
};

function initialRegularForm(schedule: MosquePrayerSchedule | null, approved: MosquePrayerTimes | null): RegularForm {
  const hasMosqueTimes = Boolean(approved && !approved.stale);
  const adhan = {} as Record<PrayerKey, string>;
  const iqama = {} as Record<PrayerKey, IqamaInput>;
  for (const { key } of PRAYERS) {
    // Today's mosque times (they follow the sun), only when the mosque already has validated times.
    const today = schedule?.prayers.find((prayer) => prayer.key.toLowerCase() === key)?.time;
    adhan[key] = hasMosqueTimes && approved?.[key] ? timeToInput(today ?? approved[key]) : '';
    const rule = approved?.iqama?.[key];
    iqama[key] = !rule
      ? { mode: 'after', value: '' }
      : 'after' in rule ? { mode: 'after', value: String(rule.after) } : { mode: 'at', value: timeToInput(rule.at) };
  }
  const jumuah = (approved?.jumuahTimes ?? []).map((slot) => ({ time: timeToInput(slot.time), language: slot.language ?? '' }));
  return { adhan, iqama, jumuah: jumuah.length ? jumuah : [{ time: '', language: '' }] };
}

type Props = {
  visible: boolean;
  onClose: () => void;
  mosque: { id: string; name: string; address?: string };
  schedule: MosquePrayerSchedule | null;
  approved: MosquePrayerTimes | null;
  special: MosqueSpecialTimes[];
};

export default function MosqueTimesProposalSheet({ visible, onClose, mosque, schedule, approved, special }: Props) {
  const { t } = useI18n();
  const [kind, setKind] = useState<MosqueProposalKind>('regular');
  const [regular, setRegular] = useState<RegularForm>(() => initialRegularForm(schedule, approved));
  const [tarawih, setTarawih] = useState('');
  const [ramadanFrom, setRamadanFrom] = useState('');
  const [ramadanTo, setRamadanTo] = useState('');
  const [eidDate, setEidDate] = useState('');
  const [eidTimes, setEidTimes] = useState<string[]>(['']);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  // Each opening starts from what the mosque already shows.
  useEffect(() => {
    if (!visible) return;
    setKind('regular');
    setRegular(initialRegularForm(schedule, approved));
    const ramadan = special.find((item) => item.kind === 'ramadan');
    setTarawih(timeToInput(ramadan?.tarawih));
    setRamadanFrom(isoToInput(ramadan?.validFrom));
    setRamadanTo(isoToInput(ramadan?.validTo));
    setEidDate('');
    setEidTimes(['']);
    setNote('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const selectKind = (next: MosqueProposalKind) => {
    setKind(next);
    if (next === 'eid_fitr' || next === 'eid_adha') {
      const eid = special.find((item) => item.kind === next);
      setEidDate(isoToInput(eid?.validFrom));
      setEidTimes(eid?.eidTimes?.length ? eid.eidTimes.map(timeToInput) : ['']);
    }
  };

  const fail = (message: string) => {
    Alert.alert(t('mosque.checkInputTitle'), message);
    return null;
  };

  const buildProposal = () => {
    const base = { kind, mosqueId: mosque.id, mosqueName: mosque.name, mosqueAddress: mosque.address, note };

    if (kind === 'regular') {
      const times: Partial<Record<PrayerKey, string>> = {};
      const iqama: Partial<Record<PrayerKey, IqamaRule>> = {};
      for (const { key, label } of PRAYERS) {
        const adhan = parseTime(regular.adhan[key]);
        if (adhan === null) return fail(t('mosque.timesErrorAdhan', { prayer: label }));
        if (adhan) times[key] = adhan;
        const rule = regular.iqama[key];
        if (!rule.value.trim()) continue;
        if (rule.mode === 'after') {
          const minutes = Number(rule.value);
          if (!Number.isInteger(minutes) || minutes < 0 || minutes > 90) return fail(t('mosque.timesErrorIqamaRange', { prayer: label }));
          iqama[key] = { after: minutes };
        } else {
          const at = parseTime(rule.value);
          if (!at) return fail(t('mosque.timesErrorIqama', { prayer: label }));
          iqama[key] = { at };
        }
      }
      const jumuahTimes = [];
      for (const slot of regular.jumuah) {
        const time = parseTime(slot.time);
        if (time === null) return fail(t('mosque.timesErrorJumuah'));
        if (time) jumuahTimes.push({ time, language: slot.language });
      }
      if (!Object.keys(times).length && !Object.keys(iqama).length && !jumuahTimes.length) {
        return fail(t('mosque.timesErrorEmpty'));
      }
      return { ...base, ...times, iqama, jumuahTimes };
    }

    if (kind === 'ramadan') {
      const time = parseTime(tarawih);
      if (!time) return fail(t('mosque.timesErrorTarawih'));
      const from = parseDate(ramadanFrom);
      const to = parseDate(ramadanTo);
      if (!from || !to) return fail(t('mosque.timesErrorRamadanDates'));
      const days = (Date.parse(to) - Date.parse(from)) / 86_400_000;
      if (days < 0 || days > 31) return fail(t('mosque.timesErrorRamadanOrder'));
      return { ...base, tarawih: time, validFrom: from, validTo: to };
    }

    const date = parseDate(eidDate);
    if (!date) return fail(t('mosque.timesErrorEidDate'));
    const times = [];
    for (const value of eidTimes) {
      const time = parseTime(value);
      if (time === null) return fail(t('mosque.timesErrorEidTime'));
      if (time) times.push(time);
    }
    if (!times.length) return fail(t('mosque.timesErrorEidMissing'));
    return { ...base, eidTimes: times, validFrom: date };
  };

  const submit = async () => {
    if (saving) return;
    const proposal = buildProposal();
    if (!proposal) return;
    setSaving(true);
    try {
      await proposeMosquePrayerTimes(proposal);
      onClose();
      Alert.alert(t('mosque.proposalSentTitle'), t('mosque.timesSentText'));
    } catch (error) {
      Alert.alert(t('mosque.sendFailedTitle'), error instanceof Error && error.message === 'AUTH_REQUIRED'
        ? t('mosque.timesAuthRequired')
        : error instanceof Error && error.message === 'HORAIRE_INVALIDE'
          ? t('mosque.timesInvalidHour')
          : t('mosque.sendFailedText'));
    } finally {
      setSaving(false);
    }
  };

  const timeInputProps = {
    placeholder: '00H00',
    placeholderTextColor: '#837789',
    keyboardType: 'number-pad' as const,
    inputMode: 'numeric' as const,
    maxLength: 5,
    returnKeyType: 'done' as const,
  };
  const dateInputProps = {
    placeholder: t('mosque.datePlaceholder'),
    placeholderTextColor: '#837789',
    keyboardType: 'number-pad' as const,
    inputMode: 'numeric' as const,
    maxLength: 10,
    returnKeyType: 'done' as const,
  };

  const setAdhan = (key: PrayerKey, value: string) =>
    setRegular((current) => ({ ...current, adhan: { ...current.adhan, [key]: formatTimeInput(value) } }));
  const setIqama = (key: PrayerKey, next: Partial<IqamaInput>) =>
    setRegular((current) => ({ ...current, iqama: { ...current.iqama, [key]: { ...current.iqama[key], ...next } } }));
  const setJumuah = (index: number, next: Partial<{ time: string; language: string }>) =>
    setRegular((current) => ({ ...current, jumuah: current.jumuah.map((slot, i) => (i === index ? { ...slot, ...next } : slot)) }));

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.backdrop}>
        <ScrollView bounces={false} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.scrollContent}>
          <View style={styles.sheet}>
            <Text style={styles.title}>{t('mosque.timesSheetTitle')}</Text>
            <Text style={styles.subtitle}>
              {t('mosque.timesSheetSubtitle')}
            </Text>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.kinds}>
              {KINDS.map((item) => (
                <Pressable
                  key={item.kind}
                  onPress={() => selectKind(item.kind)}
                  style={[styles.kindChip, kind === item.kind && styles.kindChipActive]}
                >
                  <Text style={[styles.kindChipText, kind === item.kind && styles.kindChipTextActive]}>{t(item.labelKey)}</Text>
                </Pressable>
              ))}
            </ScrollView>

            {kind === 'regular' ? (
              <>
                <View style={styles.tableHeader}>
                  <Text style={styles.tablePrayer} />
                  <Text style={styles.tableColumn}>Adhan</Text>
                  <Text style={styles.tableIqama}>Iqama</Text>
                </View>
                {PRAYERS.map(({ key, label }) => {
                  const iqama = regular.iqama[key];
                  return (
                    <View key={key} style={styles.prayerRow}>
                      <Text style={styles.tablePrayer}>{label}</Text>
                      <TextInput
                        {...timeInputProps}
                        value={regular.adhan[key]}
                        onChangeText={(value) => setAdhan(key, value)}
                        style={[styles.input, styles.tableColumn]}
                      />
                      <View style={styles.tableIqama}>
                        <TextInput
                          {...timeInputProps}
                          placeholder={iqama.mode === 'after' ? '10' : '00H00'}
                          maxLength={iqama.mode === 'after' ? 2 : 5}
                          value={iqama.value}
                          onChangeText={(value) => setIqama(key, {
                            value: iqama.mode === 'after' ? value.replace(/\D/g, '').slice(0, 2) : formatTimeInput(value),
                          })}
                          style={[styles.input, styles.iqamaInput]}
                        />
                        <Pressable
                          accessibilityLabel={iqama.mode === 'after' ? t('mosque.iqamaAfterAccessibility') : t('mosque.iqamaAtAccessibility')}
                          onPress={() => setIqama(key, { mode: iqama.mode === 'after' ? 'at' : 'after', value: '' })}
                          style={styles.unitButton}
                        >
                          <Text style={styles.unitText}>{iqama.mode === 'after' ? '+ min' : t('mosque.hour')}</Text>
                        </Pressable>
                      </View>
                    </View>
                  );
                })}
                <Text style={styles.help}>
                  {t('mosque.iqamaHelp')}
                </Text>

                <Text style={styles.groupTitle}>{t('mosque.jumuah')}</Text>
                {regular.jumuah.map((slot, index) => (
                  <View key={index} style={styles.jumuahRow}>
                    <TextInput
                      {...timeInputProps}
                      value={slot.time}
                      onChangeText={(value) => setJumuah(index, { time: formatTimeInput(value) })}
                      style={[styles.input, styles.jumuahTime]}
                    />
                    <TextInput
                      value={slot.language}
                      onChangeText={(value) => setJumuah(index, { language: value })}
                      placeholder={t('mosque.khutbaPlaceholder')}
                      placeholderTextColor="#837789"
                      maxLength={40}
                      style={[styles.input, styles.jumuahLanguage]}
                    />
                    {regular.jumuah.length > 1 ? (
                      <Pressable
                        accessibilityLabel={t('mosque.removeJumuah')}
                        onPress={() => setRegular((current) => ({ ...current, jumuah: current.jumuah.filter((_, i) => i !== index) }))}
                        style={styles.removeButton}
                      >
                        <Ionicons name="close" size={18} color={colors.textMuted} />
                      </Pressable>
                    ) : null}
                  </View>
                ))}
                {regular.jumuah.length < MAX_JUMUAH ? (
                  <Pressable
                    onPress={() => setRegular((current) => ({ ...current, jumuah: [...current.jumuah, { time: '', language: '' }] }))}
                    style={styles.addButton}
                  >
                    <Ionicons name="add" size={17} color={colors.goldLight} />
                    <Text style={styles.addText}>{t('mosque.addJumuah')}</Text>
                  </Pressable>
                ) : null}
              </>
            ) : null}

            {kind === 'ramadan' ? (
              <>
                <Text style={styles.label}>{t('mosque.tarawihTime')}</Text>
                <TextInput {...timeInputProps} value={tarawih} onChangeText={(value) => setTarawih(formatTimeInput(value))} style={styles.input} />
                <View style={styles.dateRow}>
                  <View style={styles.dateBlock}>
                    <Text style={styles.label}>{t('mosque.firstDay')}</Text>
                    <TextInput {...dateInputProps} value={ramadanFrom} onChangeText={(value) => setRamadanFrom(formatDateInput(value))} style={styles.input} />
                  </View>
                  <View style={styles.dateBlock}>
                    <Text style={styles.label}>{t('mosque.lastDay')}</Text>
                    <TextInput {...dateInputProps} value={ramadanTo} onChangeText={(value) => setRamadanTo(formatDateInput(value))} style={styles.input} />
                  </View>
                </View>
              </>
            ) : null}

            {kind === 'eid_fitr' || kind === 'eid_adha' ? (
              <>
                <Text style={styles.label}>{t('mosque.eidDate')}</Text>
                <TextInput {...dateInputProps} value={eidDate} onChangeText={(value) => setEidDate(formatDateInput(value))} style={styles.input} />
                <Text style={styles.label}>{eidTimes.length > 1 ? t('mosque.eidTimesPlural') : t('mosque.eidTimeSingle')}</Text>
                {eidTimes.map((value, index) => (
                  <View key={index} style={styles.jumuahRow}>
                    <TextInput
                      {...timeInputProps}
                      value={value}
                      onChangeText={(next) => setEidTimes((current) => current.map((time, i) => (i === index ? formatTimeInput(next) : time)))}
                      style={[styles.input, styles.eidTime]}
                    />
                    {eidTimes.length > 1 ? (
                      <Pressable
                        accessibilityLabel={t('mosque.removeTime')}
                        onPress={() => setEidTimes((current) => current.filter((_, i) => i !== index))}
                        style={styles.removeButton}
                      >
                        <Ionicons name="close" size={18} color={colors.textMuted} />
                      </Pressable>
                    ) : null}
                  </View>
                ))}
                {eidTimes.length < MAX_EID_TIMES ? (
                  <Pressable onPress={() => setEidTimes((current) => [...current, ''])} style={styles.addButton}>
                    <Ionicons name="add" size={17} color={colors.goldLight} />
                    <Text style={styles.addText}>{t('mosque.addPrayer')}</Text>
                  </Pressable>
                ) : null}
              </>
            ) : null}

            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder={t('mosque.notePlaceholder')}
              placeholderTextColor="#837789"
              maxLength={300}
              style={[styles.input, styles.noteInput]}
            />

            <View style={styles.actions}>
              <Pressable onPress={onClose} style={styles.cancel}>
                <Text style={styles.cancelText}>{t('mosques.cancel')}</Text>
              </Pressable>
              <Pressable disabled={saving} onPress={() => void submit()} style={styles.submit}>
                <Text style={styles.submitText}>{saving ? t('mosque.sending') : t('mosque.send')}</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(7,5,11,0.72)' },
  scrollContent: { flexGrow: 1, justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#18131F', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 22, paddingBottom: 32 },
  title: { color: colors.goldLight, fontFamily: typography.serifMedium, fontSize: 24 },
  subtitle: { marginTop: 6, color: colors.textMuted, fontFamily: typography.sans, fontSize: 13, lineHeight: 18 },
  kinds: { gap: 8, paddingVertical: 14 },
  kindChip: { minHeight: 36, paddingHorizontal: 14, borderRadius: 18, borderWidth: 1, borderColor: 'rgba(242,181,61,0.24)', justifyContent: 'center' },
  kindChipActive: { backgroundColor: colors.goldLight, borderColor: colors.goldLight },
  kindChipText: { color: colors.text, fontFamily: typography.sansMedium, fontSize: 13 },
  kindChipTextActive: { color: colors.background, fontFamily: typography.sansBold },
  tableHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  prayerRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  tablePrayer: { width: 64, color: colors.text, fontFamily: typography.sansMedium, fontSize: 14 },
  tableColumn: { width: 78, color: colors.textMuted, fontFamily: typography.sansBold, fontSize: 11, textTransform: 'uppercase' },
  tableIqama: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6, color: colors.textMuted, fontFamily: typography.sansBold, fontSize: 11, textTransform: 'uppercase' },
  iqamaInput: { flex: 1 },
  unitButton: { minHeight: 45, minWidth: 58, paddingHorizontal: 8, borderRadius: 12, backgroundColor: 'rgba(242,181,61,0.14)', alignItems: 'center', justifyContent: 'center' },
  unitText: { color: colors.goldLight, fontFamily: typography.sansBold, fontSize: 12 },
  help: { marginTop: 2, color: colors.textMuted, fontFamily: typography.sans, fontSize: 12, lineHeight: 17 },
  groupTitle: { marginTop: 18, marginBottom: 8, color: colors.goldLight, fontFamily: typography.sansBold, fontSize: 16 },
  jumuahRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  jumuahTime: { width: 86 },
  jumuahLanguage: { flex: 1 },
  eidTime: { width: 110 },
  removeButton: { width: 36, height: 45, alignItems: 'center', justifyContent: 'center' },
  addButton: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', paddingVertical: 8 },
  addText: { color: colors.goldLight, fontFamily: typography.sansBold, fontSize: 13 },
  label: { marginTop: 10, marginBottom: 5, color: colors.text, fontFamily: typography.sansMedium, fontSize: 13 },
  dateRow: { flexDirection: 'row', gap: 10 },
  dateBlock: { flex: 1 },
  input: { minHeight: 45, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(242,181,61,0.24)', backgroundColor: '#100C16', paddingHorizontal: 12, color: colors.text, fontFamily: typography.sans, fontSize: 15 },
  noteInput: { marginTop: 16 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 18 },
  cancel: { flex: 1, minHeight: 48, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  cancelText: { color: colors.text, fontFamily: typography.sansBold },
  submit: { flex: 1, minHeight: 48, borderRadius: 14, backgroundColor: colors.goldLight, alignItems: 'center', justifyContent: 'center' },
  submitText: { color: colors.background, fontFamily: typography.sansBold },
});
