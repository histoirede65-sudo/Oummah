import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { ActivityIndicator, Alert, InputAccessoryView, Keyboard, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View, type StyleProp, type ViewStyle } from 'react-native';
import type { ScrollViewInstance, TextInputInstance } from 'react-native';
import Reanimated, { Easing, FadeIn, FadeInDown, ZoomIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getValidSession } from '../features/auth/SupabaseAuthService';
import {
  addFollowup, createCommitment, deleteCommitment, deleteEntry, deleteLocalEntry, listActivities, listCommitments, listEntries, listLocalEntries,
  localDateKey, loadDraft, saveDraft, saveEntry, saveLocalEntry, syncLocalEntries, updateCommitment,
  type CommitmentStatus, type FollowupResponse, type MuhasabahActivity, type MuhasabahActivityKind, type MuhasabahCommitment, type MuhasabahDraft, type MuhasabahEntry,
} from '../features/muhasabah/MuhasabahService';
import { muhasabahLocale, muhasabahText, type MuhasabahStringKey } from '../features/muhasabah/muhasabahStrings';
import { cancelTodayMuhasabahReminder, getMuhasabahReminderState, setMuhasabahReminderEnabled } from '../features/notifications/NotificationCenter';
import { useI18n } from '../i18n';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';

type Tab = 'today' | 'review';
type T = ReturnType<typeof muhasabahText>;
type RunAction = (id: string, action: () => Promise<unknown>) => Promise<void>;
const GREEN = '#5BD08A';
const AMBER = '#F2A65A';
const VIOLET = '#B68CFF';
const GOLD = colors.goldLight;
const INK = '#211329';
const HERO_HEIGHT = 330;
const emptyDraft: MuhasabahDraft = { goodDeeds: '', couldImprove: '', effort: '' };
const questions = [
  { key: 'goodDeeds', icon: 'checkmark', color: GREEN, title: 'q1', placeholder: 'q1Ph', optional: false },
  { key: 'couldImprove', icon: 'refresh', color: AMBER, title: 'q2', placeholder: 'q2Ph', optional: true },
  { key: 'effort', icon: 'flag', color: VIOLET, title: 'q3', placeholder: 'q3Ph', optional: true },
] as const;
const responses: FollowupResponse[] = ['success', 'progress', 'not_yet'];
const responseIcons: Record<FollowupResponse, keyof typeof Ionicons.glyphMap> = { success: 'checkmark-circle', progress: 'trending-up', not_yet: 'ellipse-outline' };
const activityIcons: Record<MuhasabahActivityKind, keyof typeof Ionicons.glyphMap> = {
  quran_verse: 'book-outline', hadith: 'chatbubble-ellipses-outline', tafsir: 'bulb-outline', dua: 'hand-left-outline', dhikr: 'ellipse-outline', content: 'reader-outline',
};
const enter = (index: number) => FadeInDown.duration(520).delay(120 + index * 70).easing(Easing.out(Easing.cubic));
const normalize = (text: string) => text.trim().toLocaleLowerCase().replace(/\s+/g, ' ');
const draftFrom = (entry: MuhasabahEntry): MuhasabahDraft => ({ goodDeeds: entry.goodDeeds, couldImprove: entry.couldImprove, effort: entry.effort });
const sameDraft = (a: MuhasabahDraft, b: MuhasabahDraft) => a.goodDeeds.trim() === b.goodDeeds.trim() && a.couldImprove.trim() === b.couldImprove.trim() && a.effort.trim() === b.effort.trim();
const shiftDay = (date: string, delta: number) => { const d = new Date(`${date}T12:00:00`); d.setDate(d.getDate() + delta); return localDateKey(d); };

type DisplayActivity = { id: string; kind: MuhasabahActivityKind; title: string; detail: string };
const verseOrder = (key: string) => { const [surah, verse] = key.split(':').map(Number); return (surah || 0) * 1000 + (verse || 0); };

/** Lectures du jour affichées dans la langue de l'app ; les versets du Coran sont regroupés en une ligne. */
function displayActivities(list: MuhasabahActivity[], t: T): DisplayActivity[] {
  const verses = list.filter((item) => item.kind === 'quran_verse').map((item) => item.reference.replace(/^quran:/, '')).sort((a, b) => verseOrder(a) - verseOrder(b));
  const result: DisplayActivity[] = [];
  if (verses.length) {
    const range = verses.length === 1 ? verses[0] : `${verses[0]} → ${verses[verses.length - 1]}`;
    result.push({ id: 'quran', kind: 'quran_verse', title: t('act_quran'), detail: t('act_quranDetail', { count: verses.length, range }) });
  }
  for (const item of list) {
    if (item.kind === 'quran_verse') continue;
    const title = item.kind === 'tafsir' ? t('act_tafsir') : item.kind === 'hadith' ? t('act_hadith') : item.kind === 'dua' ? t('act_dua') : item.kind === 'dhikr' ? t('act_dhikr') : t('act_content');
    const detail = item.kind === 'tafsir' ? t('act_tafsirDetail', { ref: item.reference.replace(/^tafsir:/, '') }) : item.detail;
    result.push({ id: item.id, kind: item.kind, title, detail });
  }
  return result;
}

function calendarDays(cursor: Date) {
  const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
  const start = (first.getDay() + 6) % 7;
  const total = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
  const cells = Math.ceil((start + total) / 7) * 7;
  return Array.from({ length: cells }, (_, index) => {
    const day = index - start + 1;
    return day < 1 || day > total ? null : localDateKey(new Date(cursor.getFullYear(), cursor.getMonth(), day));
  });
}

/** Carte « verre » : fond translucide, bord clair et reflet en haut. */
function Glass({ children, style, tint }: { children: ReactNode; style?: StyleProp<ViewStyle>; tint?: string }) {
  return (
    <View style={[styles.glass, tint ? { borderColor: `${tint}55`, backgroundColor: `${tint}14` } : null, style]}>
      <LinearGradient pointerEvents="none" colors={['rgba(255,255,255,0.10)', 'rgba(255,255,255,0)']} style={styles.glassShine} />
      {children}
    </View>
  );
}

export default function MuhasabahScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ write?: string }>();
  const insets = useSafeAreaInsets();
  const { language } = useI18n();
  const t = useMemo(() => muhasabahText(language), [language]);
  const locale = muhasabahLocale(language);
  const longDate = useCallback((date: string) => new Date(`${date}T12:00:00`).toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long' }), [locale]);
  const shortDate = useCallback((date: string) => new Date(`${date}T12:00:00`).toLocaleDateString(locale, { day: 'numeric', month: 'long' }), [locale]);
  const inputRefs = useRef<(TextInputInstance | null)[]>([]);
  const questionY = useRef<number[]>([]);
  const scrollRef = useRef<ScrollViewInstance | null>(null);
  const today = localDateKey();
  const [session, setSession] = useState<boolean | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(today);
  const selectedDateRef = useRef(today);
  selectedDateRef.current = selectedDate;
  const [draft, setDraft] = useState<MuhasabahDraft>(emptyDraft);
  const [entries, setEntries] = useState<MuhasabahEntry[]>([]);
  const [activities, setActivities] = useState<MuhasabahActivity[]>([]);
  const [commitments, setCommitments] = useState<MuhasabahCommitment[]>([]);
  const [tab, setTab] = useState<Tab>('today');
  const [month, setMonth] = useState(() => new Date());
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [justSaved, setJustSaved] = useState<'account' | 'local' | null>(null);
  const [busyCommitment, setBusyCommitment] = useState<string | null>(null);
  const [reminder, setReminder] = useState<{ enabled: boolean; time: string; auto: boolean } | null>(null);

  const entry = entries.find((item) => item.entryDate === selectedDate) ?? null;

  const applyDate = useCallback(async (date: string, all: MuhasabahEntry[], uid: string | null) => {
    const found = all.find((item) => item.entryDate === date) ?? null;
    const local = await loadDraft(uid, date).catch(() => null);
    setDraft(found ? draftFrom(found) : local ?? emptyDraft);
  }, []);

  const refresh = useCallback(async (date = selectedDateRef.current) => {
    const current = await getValidSession().catch(() => null);
    const uid = current?.user.id ?? null;
    setSession(Boolean(current));
    setUserId(uid);
    try {
      if (!current) {
        const local = await listLocalEntries();
        setEntries(local); setActivities([]); setCommitments([]); setLoadError(false);
        await applyDate(date, local, null);
        return;
      }
      let allEntries = await listEntries();
      if (await syncLocalEntries(new Set(allEntries.map((item) => item.entryDate))).catch(() => false)) allEntries = await listEntries();
      const [allCommitments, allActivities] = await Promise.all([listCommitments(), listActivities()]);
      setEntries(allEntries); setCommitments(allCommitments); setActivities(allActivities); setLoadError(false);
      await applyDate(date, allEntries, uid);
    } catch {
      setLoadError(true);
      const local = await loadDraft(uid, date).catch(() => null);
      setDraft((previous) => (sameDraft(previous, emptyDraft) ? local ?? emptyDraft : previous));
    } finally {
      setLoading(false);
    }
  }, [applyDate]);
  const loadReminder = useCallback(() => { void getMuhasabahReminderState().then(setReminder).catch(() => setReminder(null)); }, []);
  useFocusEffect(useCallback(() => { void refresh(); loadReminder(); }, [loadReminder, refresh]));
  const toggleReminder = async (enabled: boolean) => {
    setReminder((previous) => (previous ? { ...previous, enabled } : previous));
    const ok = await setMuhasabahReminderEnabled(enabled).catch(() => false);
    if (!ok && enabled) Alert.alert(t('reminderDeniedTitle'), t('reminderDeniedBody'));
    loadReminder();
  };

  // Ouvert depuis le rappel du soir : directement sur la première question, clavier sorti.
  const autoFocused = useRef(false);
  useEffect(() => {
    if (loading || autoFocused.current || params.write !== '1') return;
    autoFocused.current = true;
    if (!entry) setTimeout(() => inputRefs.current[0]?.focus(), 700);
  }, [entry, loading, params.write]);

  const openDate = async (date: string, goToToday = false) => {
    if (date > today) return;
    setJustSaved(null);
    setSelectedDate(date);
    await applyDate(date, entries, userId);
    if (goToToday) { setTab('today'); scrollRef.current?.scrollTo({ y: HERO_HEIGHT - 80, animated: true }); }
  };
  const update = (key: keyof MuhasabahDraft, value: string) => {
    const next = { ...draft, [key]: value };
    setDraft(next);
    setJustSaved(null);
    void saveDraft(userId, selectedDate, next).catch(() => undefined);
  };
  const focusQuestion = (index: number) => {
    setTimeout(() => {
      const y = questionY.current[index];
      if (y !== undefined) scrollRef.current?.scrollTo({ y: Math.max(0, y - 20), animated: true });
    }, 120);
  };
  const askLogin = (body: string) => Alert.alert(t('loginTitle'), body, [{ text: t('later'), style: 'cancel' }, { text: t('openProfile'), onPress: () => router.push('/profile') }]);

  const save = async () => {
    if (sameDraft(draft, emptyDraft)) { Alert.alert(t('incompleteTitle'), t('incompleteBody')); return; }
    Keyboard.dismiss();
    setSaving(true);
    try {
      if (session) await saveEntry(selectedDate, draft);
      else await saveLocalEntry(selectedDate, draft);
      if (selectedDate === today) void cancelTodayMuhasabahReminder().catch(() => undefined);
      await refresh();
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
      setJustSaved(session ? 'account' : 'local');
    } catch {
      Alert.alert(t('saveErrorTitle'), t('saveErrorBody'));
    } finally {
      setSaving(false);
    }
  };
  const remove = () => {
    if (!entry) return;
    Alert.alert(t('deleteTitle'), t('deleteBody'), [{ text: t('cancel'), style: 'cancel' }, {
      text: t('confirmDelete'), style: 'destructive', onPress: async () => {
        try {
          if (entry.id.startsWith('local-')) await deleteLocalEntry(selectedDate);
          else await deleteEntry(entry.id, selectedDate);
          setDraft(emptyDraft); setJustSaved(null);
          await refresh();
        } catch { Alert.alert(t('errorTitle'), t('retryLater')); }
      },
    }]);
  };
  const proposeEffort = async () => {
    if (!draft.effort.trim()) return;
    if (!session) { askLogin(t('loginToFollow')); return; }
    try { await createCommitment(draft.effort); await refresh(); }
    catch { Alert.alert(t('errorTitle'), t('retryLater')); }
  };
  const runOnCommitment: RunAction = async (id, action) => {
    setBusyCommitment(id);
    try { await action(); await refresh(); }
    catch { Alert.alert(t('errorTitle'), t('retryLater')); }
    finally { setBusyCommitment(null); }
  };

  const entryDates = useMemo(() => new Set(entries.map((item) => item.entryDate)), [entries]);
  const activityDates = useMemo(() => new Set(activities.map((item) => item.activityDate)), [activities]);
  const days = useMemo(() => calendarDays(month), [month]);
  const monthPrefix = localDateKey(month).slice(0, 7);
  const monthEntries = useMemo(() => entries.filter((item) => item.entryDate.startsWith(monthPrefix)).sort((a, b) => b.entryDate.localeCompare(a.entryDate)), [entries, monthPrefix]);
  const currentMonthCount = entries.filter((item) => item.entryDate.startsWith(today.slice(0, 7))).length;
  const monthReadingDays = useMemo(() => new Set(activities.filter((item) => item.activityDate.startsWith(monthPrefix)).map((item) => item.activityDate)).size, [activities, monthPrefix]);
  const repeatedEfforts = useMemo(() => {
    const counts = new Map<string, { text: string; count: number }>();
    for (const item of monthEntries) {
      if (!item.effort.trim()) continue;
      const key = normalize(item.effort);
      const found = counts.get(key);
      counts.set(key, { text: found?.text ?? item.effort.trim(), count: (found?.count ?? 0) + 1 });
    }
    return [...counts.values()].filter((item) => item.count > 1).sort((a, b) => b.count - a.count).slice(0, 3);
  }, [monthEntries]);
  const goodNotes = monthEntries.filter((item) => item.goodDeeds.trim()).slice(0, 3);
  const isCurrentMonth = monthPrefix === today.slice(0, 7);
  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, index) => new Date(2024, 0, 1 + index).toLocaleDateString(locale, { weekday: 'narrow' })), [locale]);
  const selectedActivities = useMemo(() => displayActivities(activities.filter((item) => item.activityDate === selectedDate), t), [activities, selectedDate, t]);
  const unchanged = entry ? sameDraft(draft, draftFrom(entry)) : false;
  const hasDraft = !entry && !sameDraft(draft, emptyDraft);
  const effortTracked = commitments.some((item) => normalize(item.text) === normalize(draft.effort));
  const ongoing = commitments.filter((item) => item.status === 'active' || item.status === 'progressing');
  const others = commitments.filter((item) => item.status === 'completed' || item.status === 'paused');
  const isToday = selectedDate === today;
  const yesterdayEffort = isToday ? entries.find((item) => item.entryDate === shiftDay(today, -1))?.effort.trim() : undefined;
  const dayTitle = isToday ? `${t('tabTonight')} – ${longDate(selectedDate)}` : selectedDate === shiftDay(today, -1) ? `${t('yesterdayShort')} – ${longDate(selectedDate)}` : longDate(selectedDate);

  return (
    <View style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        <ScrollView ref={scrollRef} contentContainerStyle={{ paddingBottom: insets.bottom + 34 }} keyboardShouldPersistTaps="handled" keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'none'} showsVerticalScrollIndicator={false}>
          {/* En-tête photo */}
          <View style={styles.hero}>
            <Reanimated.Image entering={FadeIn.duration(900)} source={require('../assets/images/home/home-mosque-sunset.jpg')} resizeMode="cover" style={styles.heroImage} />
            <LinearGradient colors={['rgba(11,9,22,0.15)', 'rgba(11,9,22,0.25)', 'rgba(11,9,22,0.85)', colors.background]} locations={[0, 0.45, 0.82, 1]} style={StyleSheet.absoluteFill} />
            <Pressable onPress={() => router.back()} accessibilityRole="button" style={[styles.back, { top: insets.top + 8 }]}><Ionicons name="chevron-back" size={22} color="#fff" /></Pressable>
            <View style={[styles.heroCopy, { paddingTop: insets.top + 64 }]}>
              <Reanimated.Text entering={FadeInDown.duration(700).delay(150)} style={styles.title}>{t('title')}</Reanimated.Text>
              <Reanimated.Text entering={FadeInDown.duration(700).delay(260)} style={styles.intro}>{t('intro')}</Reanimated.Text>
            </View>
          </View>

          <View style={styles.body}>
            <Reanimated.View entering={enter(0)}>
              <Glass style={styles.privateCard}>
                <View style={styles.lockBubble}><Ionicons name={session ? 'lock-closed' : 'phone-portrait'} size={19} color={INK} /></View>
                <View style={styles.flex}>
                  <Text style={styles.privateTitle}>{t('privateTitle')}</Text>
                  <Text style={styles.privateText}>{session ? t('privateBody') : t('privateGuestBody')}</Text>
                </View>
              </Glass>
            </Reanimated.View>

            {reminder ? (
              <Reanimated.View entering={enter(1)}>
                <Glass style={styles.reminderRow}>
                  <View style={[styles.bubble, { backgroundColor: reminder.enabled ? VIOLET : 'rgba(255,255,255,0.1)' }]}><Ionicons name={reminder.enabled ? 'notifications' : 'notifications-off-outline'} size={16} color={reminder.enabled ? INK : colors.textMuted} /></View>
                  <View style={styles.flex}>
                    <Text style={styles.reminderTitle}>{t('reminderTitle')}</Text>
                    <Text style={styles.reminderText}>{reminder.enabled ? t(reminder.auto ? 'reminderAuto' : 'reminderFixed', { time: reminder.time }) : t('reminderOff')}</Text>
                  </View>
                  <Switch value={reminder.enabled} onValueChange={(value) => void toggleReminder(value)} trackColor={{ false: 'rgba(255,255,255,0.15)', true: VIOLET }} thumbColor="#fff" ios_backgroundColor="rgba(255,255,255,0.15)" />
                </Glass>
              </Reanimated.View>
            ) : null}

            {loadError ? (
              <Glass tint={GOLD} style={styles.errorBanner}>
                <Ionicons name="cloud-offline-outline" size={20} color={GOLD} />
                <View style={styles.flex}><Text style={styles.errorTitle}>{t('offlineTitle')}</Text><Text style={styles.errorText}>{t('offlineBody')}</Text></View>
                <Pressable onPress={() => void refresh()} style={styles.retry}><Text style={styles.retryText}>{t('retry')}</Text></Pressable>
              </Glass>
            ) : null}

            <Reanimated.View entering={enter(1)} style={styles.segmented}>
              {([['today', 'tabTonight', 'create-outline'], ['review', 'tabReview', 'albums-outline']] as const).map(([value, label, icon]) => (
                <Pressable key={value} accessibilityRole="tab" accessibilityState={{ selected: tab === value }} onPress={() => setTab(value)} style={[styles.segment, tab === value && styles.segmentActive]}>
                  <Ionicons name={icon} size={16} color={tab === value ? INK : colors.textSecondary} />
                  <Text numberOfLines={1} style={[styles.segmentText, tab === value && styles.segmentTextActive]}>{t(label)}</Text>
                </Pressable>
              ))}
            </Reanimated.View>

            {loading ? <ActivityIndicator color={GOLD} style={{ marginTop: 30 }} /> : null}

            {!loading && tab === 'today' ? <View>
              <Reanimated.View entering={enter(2)} style={styles.dateNav}>
                <Pressable accessibilityRole="button" onPress={() => void openDate(shiftDay(selectedDate, -1))} style={styles.dateArrow}><Ionicons name="chevron-back" size={18} color={colors.text} /></Pressable>
                <Pressable onPress={() => setTab('review')} style={styles.datePill}>
                  <Ionicons name="calendar-outline" size={16} color={GOLD} />
                  <Text numberOfLines={1} style={styles.datePillText}>{dayTitle}</Text>
                </Pressable>
                <Pressable accessibilityRole="button" disabled={isToday} onPress={() => void openDate(shiftDay(selectedDate, 1))} style={[styles.dateArrow, isToday && styles.disabled]}><Ionicons name="chevron-forward" size={18} color={colors.text} /></Pressable>
              </Reanimated.View>

              {yesterdayEffort ? (
                <Reanimated.View entering={enter(3)}>
                  <Glass tint={GOLD} style={styles.yesterday}>
                    <View style={[styles.bubble, { backgroundColor: GOLD }]}><Ionicons name="sunny" size={17} color={INK} /></View>
                    <View style={styles.flex}>
                      <Text style={styles.yesterdayKicker}>{t('yesterdayKicker')}</Text>
                      <Text style={styles.yesterdayText}>{yesterdayEffort}</Text>
                    </View>
                  </Glass>
                </Reanimated.View>
              ) : null}

              {selectedActivities.length ? (
                <Reanimated.View entering={enter(3)}>
                  <Glass tint={VIOLET} style={styles.cardPad}>
                    <Text style={styles.cardTitle}>{isToday ? t('alreadyToday') : t('alreadyDay')}</Text>
                    <Text style={styles.cardLead}>{t('alreadyLead')}</Text>
                    {selectedActivities.slice(0, 4).map((activity) => <ActivityLine key={activity.id} activity={activity} />)}
                    {selectedActivities.length > 4 ? <Text style={styles.moreText}>+{selectedActivities.length - 4}</Text> : null}
                  </Glass>
                </Reanimated.View>
              ) : null}

              {questions.map((question, index) => {
                const filled = Boolean(draft[question.key].trim());
                return (
                  <Reanimated.View key={question.key} entering={enter(4 + index)} onLayout={(event) => { questionY.current[index] = event.nativeEvent.layout.y; }}>
                    <Glass style={[styles.questionCard, filled && { borderColor: `${question.color}66` }]}>
                      <View style={styles.questionTop}>
                        <View style={[styles.bubble, { backgroundColor: question.color }]}><Ionicons name={question.icon} size={17} color={INK} /></View>
                        <Text style={styles.questionTitle}>{t(index === 0 && !isToday ? 'q1Day' : question.title)}</Text>
                        {question.optional && !filled ? <Text style={styles.optionalTag}>{t('optional')}</Text> : null}
                      </View>
                      <TextInput
                        ref={(ref) => { inputRefs.current[index] = ref; }}
                        multiline value={draft[question.key]} onFocus={() => focusQuestion(index)} onChangeText={(value) => update(question.key, value)}
                        placeholder={t(question.placeholder)} placeholderTextColor="rgba(235,225,245,0.38)" style={styles.input} textAlignVertical="top" maxLength={2000}
                        inputAccessoryViewID="muhasabah-input"
                      />
                    </Glass>
                  </Reanimated.View>
                );
              })}

              {justSaved ? (
                <Reanimated.View entering={ZoomIn.duration(380).easing(Easing.out(Easing.back(1.4)))}>
                  <Glass tint={GREEN} style={styles.savedCard}>
                    <View style={[styles.savedCheck]}><Ionicons name="checkmark" size={26} color={INK} /></View>
                    <View style={styles.flex}>
                      <Text style={styles.savedTitle}>{t('savedInline')}</Text>
                      <Text style={styles.savedText}>{justSaved === 'local' ? t('savedLocalBody', { date: shortDate(selectedDate) }) : t('savedInlineSub', { count: currentMonthCount })}</Text>
                    </View>
                  </Glass>
                  {reminder && !reminder.enabled ? (
                    <Glass tint={VIOLET} style={styles.prompt}>
                      <Ionicons name="notifications-outline" size={20} color={VIOLET} />
                      <View style={styles.flex}><Text style={styles.promptTitle}>{t('reminderAsk')}</Text><Text style={styles.promptText}>{t('reminderAskBody')}</Text></View>
                      <Pressable onPress={() => void toggleReminder(true)} style={styles.smallButton}><Text style={styles.smallButtonText}>{t('reminderEnable')}</Text></Pressable>
                    </Glass>
                  ) : null}
                </Reanimated.View>
              ) : (
                <Reanimated.View entering={enter(7)}>
                  {hasDraft ? <Text style={styles.draftNote}>{t('draftKept')}</Text> : null}
                  <Pressable disabled={saving || unchanged} onPress={() => void save()} style={({ pressed }) => [styles.saveWrap, (saving || unchanged) && styles.saveDisabled, pressed && styles.pressed]}>
                    <LinearGradient colors={['#FFD978', '#E9A93A']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.save}>
                      {saving ? <ActivityIndicator color={INK} /> : <Ionicons name={unchanged ? 'checkmark-done' : 'checkmark'} size={21} color={INK} />}
                      <Text style={styles.saveText}>{saving ? t('saving') : unchanged ? t('saved') : entry ? t('update') : t('save')}</Text>
                    </LinearGradient>
                  </Pressable>
                </Reanimated.View>
              )}
              {entry ? <Pressable onPress={remove} style={styles.delete}><Text style={styles.deleteText}>{t('delete')}</Text></Pressable> : null}

              {draft.effort.trim() && !effortTracked ? (
                <Glass tint={VIOLET} style={styles.prompt}>
                  <Ionicons name="leaf-outline" size={20} color={VIOLET} />
                  <View style={styles.flex}><Text style={styles.promptTitle}>{t('followPromptTitle')}</Text><Text numberOfLines={2} style={styles.promptText}>{draft.effort.trim()}</Text></View>
                  <Pressable onPress={() => void proposeEffort()} style={styles.smallButton}><Text style={styles.smallButtonText}>{t('follow')}</Text></Pressable>
                </Glass>
              ) : null}

              {ongoing.length ? (
                <Reanimated.View entering={enter(8)}>
                  <Glass style={styles.cardPad}>
                    <View style={styles.blockHeading}>
                      <Ionicons name="leaf" size={20} color={GOLD} />
                      <Text style={styles.blockTitle}>{t('yourEfforts')}</Text>
                    </View>
                    <Text style={styles.cardLead}>{t('yourEffortsLead')}</Text>
                    {ongoing.map((item) => <CommitmentRow key={item.id} item={item} t={t} today={today} shortDate={shortDate} busy={busyCommitment === item.id} run={runOnCommitment} />)}
                  </Glass>
                </Reanimated.View>
              ) : null}
            </View> : null}

            {!loading && tab === 'review' ? <View>
              <View style={styles.monthHeader}>
                <Pressable accessibilityRole="button" onPress={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))} style={styles.dateArrow}><Ionicons name="chevron-back" size={18} color={colors.text} /></Pressable>
                <Text style={styles.monthTitle}>{month.toLocaleDateString(locale, { month: 'long', year: 'numeric' })}</Text>
                <Pressable accessibilityRole="button" disabled={isCurrentMonth} onPress={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))} style={[styles.dateArrow, isCurrentMonth && styles.disabled]}><Ionicons name="chevron-forward" size={18} color={colors.text} /></Pressable>
              </View>

              <Reanimated.View entering={enter(0)}>
                <Glass tint={GOLD} style={styles.cardPad}>
                  <Text style={styles.kicker}>{t('monthTitle').toLocaleUpperCase(locale)}</Text>
                  <View style={styles.statsRow}>
                    <Stat value={monthEntries.length} label={t('monthEntries')} color={GOLD} />
                    <View style={styles.statDivider} />
                    <Stat value={monthReadingDays} label={t('monthReadings')} color={VIOLET} />
                    <View style={styles.statDivider} />
                    <Stat value={ongoing.length} label={t('monthEfforts')} color={GREEN} />
                  </View>
                  {repeatedEfforts.length ? <View style={styles.monthSection}>
                    <Text style={styles.monthSectionTitle}>{t('repeatedEfforts')}</Text>
                    {repeatedEfforts.map((item) => <View key={item.text} style={styles.repeatLine}><Text style={styles.repeatText}>« {item.text} »</Text><Text style={styles.repeatCount}>{t('timesCount', { count: item.count })}</Text></View>)}
                  </View> : null}
                  {goodNotes.length ? <View style={styles.monthSection}>
                    <Text style={styles.monthSectionTitle}>{t('goodNotes')}</Text>
                    {goodNotes.map((item) => <View key={item.id} style={styles.noteLine}><Ionicons name="checkmark-circle" size={15} color={GREEN} /><Text numberOfLines={2} style={styles.noteText}>{item.goodDeeds}</Text></View>)}
                  </View> : null}
                </Glass>
              </Reanimated.View>

              <Reanimated.View entering={enter(1)}>
                <Glass style={styles.calendarCard}>
                  <View style={styles.weekRow}>{weekDays.map((day, index) => <Text key={index} style={styles.weekDay}>{day.toLocaleUpperCase(locale)}</Text>)}</View>
                  <View style={styles.grid}>
                    {days.map((date, index) => {
                      if (!date) return <View key={`empty-${index}`} style={styles.day} />;
                      const future = date > today;
                      const hasEntry = entryDates.has(date);
                      return (
                        <Pressable key={date} disabled={future} onPress={() => void openDate(date, true)} style={styles.day}>
                          <View style={[styles.dayInner, hasEntry && styles.dayHasEntry, date === today && styles.dayToday]}>
                            <Text style={[styles.dayText, future && styles.dayFuture, hasEntry && styles.dayTextEntry]}>{Number(date.slice(-2))}</Text>
                          </View>
                          {activityDates.has(date) ? <View style={styles.activityDot} /> : null}
                        </Pressable>
                      );
                    })}
                  </View>
                  <View style={styles.legend}>
                    <View style={styles.legendItem}><View style={styles.legendSwatch} /><Text style={styles.legendText}>{t('legendEntry')}</Text></View>
                    <View style={styles.legendItem}><View style={[styles.activityDot, { position: 'relative', bottom: 0 }]} /><Text style={styles.legendText}>{t('legendActivity')}</Text></View>
                  </View>
                </Glass>
              </Reanimated.View>

              <Text style={styles.feedTitle}>{t('monthFeed')}</Text>
              {monthEntries.length ? monthEntries.map((item, index) => (
                <Reanimated.View key={item.id} entering={enter(2 + Math.min(index, 5))}>
                  <Pressable onPress={() => void openDate(item.entryDate, true)} style={({ pressed }) => [pressed && styles.pressed]}>
                    <Glass style={styles.cardPad}>
                      <View style={styles.feedHeader}><Text style={styles.feedDate}>{longDate(item.entryDate)}</Text><Ionicons name="chevron-forward" size={16} color={colors.textMuted} /></View>
                      <PreviewLine color={GREEN} text={item.goodDeeds} />
                      <PreviewLine color={AMBER} text={item.couldImprove} />
                      <PreviewLine color={VIOLET} text={item.effort} />
                    </Glass>
                  </Pressable>
                </Reanimated.View>
              )) : <Glass style={styles.emptyCard}><Ionicons name="moon-outline" size={26} color={GOLD} /><Text style={styles.emptyText}>{t('noEntriesMonth')}</Text></Glass>}

              {others.length ? <CollapsibleSection title={t('otherEfforts', { count: others.length })}>
                {others.map((item) => <CommitmentRow key={item.id} item={item} t={t} today={today} shortDate={shortDate} busy={busyCommitment === item.id} run={runOnCommitment} />)}
              </CollapsibleSection> : null}
            </View> : null}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      {Platform.OS === 'ios' ? <InputAccessoryView nativeID="muhasabah-input"><View style={styles.accessory}><Pressable onPress={Keyboard.dismiss}><Text style={styles.done}>{t('done')}</Text></Pressable></View></InputAccessoryView> : null}
    </View>
  );
}

function Stat({ value, label, color }: { value: number; label: string; color: string }) {
  return <View style={styles.stat}><Text style={[styles.statValue, { color }]}>{value}</Text><Text style={styles.statLabel}>{label}</Text></View>;
}

function ActivityLine({ activity }: { activity: DisplayActivity }) {
  return (
    <View style={styles.activityLine}>
      <View style={styles.activityIcon}><Ionicons name={activityIcons[activity.kind] ?? 'book-outline'} size={14} color={VIOLET} /></View>
      <View style={styles.flex}><Text style={styles.activityTitle}>{activity.title}</Text>{activity.detail ? <Text numberOfLines={2} style={styles.activityDetail}>{activity.detail}</Text> : null}</View>
    </View>
  );
}

function PreviewLine({ color, text }: { color: string; text: string }) {
  return text ? <View style={styles.previewLine}><View style={[styles.previewDot, { backgroundColor: color }]} /><Text numberOfLines={3} style={styles.previewText}>{text}</Text></View> : null;
}

function CollapsibleSection({ title, children }: { title: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <Glass style={[styles.cardPad, { marginTop: 16 }]}>
      <Pressable onPress={() => setOpen(!open)} style={styles.completedHeader}>
        <Ionicons name="archive-outline" size={17} color={GOLD} />
        <Text style={styles.completedTitle}>{title}</Text>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={17} color={colors.textMuted} />
      </Pressable>
      {open ? <View style={{ marginTop: 6 }}>{children}</View> : null}
    </Glass>
  );
}

function CommitmentRow({ item, t, today, shortDate, busy, run }: {
  item: MuhasabahCommitment; t: T; today: string; shortDate: (date: string) => string; busy: boolean; run: RunAction;
}) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(item.text);
  const todayFollowup = item.followups.find((followup) => localDateKey(new Date(followup.createdAt)) === today);
  const completed = item.status === 'completed';
  const ongoing = item.status === 'active' || item.status === 'progressing';
  const status = (next: CommitmentStatus) => void run(item.id, () => updateCommitment(item.id, { status: next }));
  const confirmDelete = () => Alert.alert(t('deleteEffortTitle'), t('deleteEffortBody'), [{ text: t('cancel'), style: 'cancel' }, { text: t('confirmDelete'), style: 'destructive', onPress: () => void run(item.id, () => deleteCommitment(item.id)) }]);
  const saveText = () => {
    if (!text.trim() || text.trim() === item.text) { setEditing(false); setText(item.text); return; }
    void run(item.id, () => updateCommitment(item.id, { text })).then(() => setEditing(false));
  };
  // Les 7 derniers jours de suivi, en petits points.
  const week = Array.from({ length: 7 }, (_, index) => {
    const d = new Date(`${today}T12:00:00`); d.setDate(d.getDate() - (6 - index));
    const key = localDateKey(d);
    return item.followups.find((followup) => localDateKey(new Date(followup.createdAt)) === key)?.response ?? null;
  });
  const ringColor = completed ? GREEN : todayFollowup ? GOLD : VIOLET;

  return (
    <View style={[styles.commitRow, busy && { opacity: 0.55 }]}>
      <Pressable onPress={() => setOpen(!open)} style={styles.commitMain}>
        <View style={[styles.ring, { borderColor: ringColor }, (completed || todayFollowup) && { backgroundColor: ringColor }]}>
          {completed || todayFollowup ? <Ionicons name={completed ? 'checkmark' : responseIcons[todayFollowup!.response]} size={15} color={INK} /> : null}
        </View>
        <View style={styles.flex}>
          <Text style={[styles.commitText, !ongoing && styles.commitTextDone]}>{item.text}</Text>
          {ongoing ? (
            <View style={styles.weekDots}>
              {week.map((response, index) => <View key={index} style={[styles.weekDot, response === 'success' && { backgroundColor: GOLD, borderColor: GOLD }, response === 'progress' && { backgroundColor: VIOLET, borderColor: VIOLET }, response === 'not_yet' && { borderColor: colors.textSecondary }]} />)}
            </View>
          ) : <Text style={styles.commitMeta}>{t(`status_${item.status}` as MuhasabahStringKey)} · {t('createdOn', { date: shortDate(item.createdAt.slice(0, 10)) })}</Text>}
        </View>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={18} color={colors.textMuted} />
      </Pressable>

      {open ? (
        <Reanimated.View entering={FadeIn.duration(220)} style={styles.commitPanel}>
          {editing ? (
            <View>
              <TextInput value={text} onChangeText={setText} multiline maxLength={500} autoFocus style={[styles.input, { minHeight: 52, marginTop: 0 }]} />
              <View style={styles.editRow}>
                <Pressable onPress={() => { setEditing(false); setText(item.text); }}><Text style={styles.linkText}>{t('cancel')}</Text></Pressable>
                <Pressable onPress={saveText} style={styles.smallButton}><Text style={styles.smallButtonText}>{t('saveEdit')}</Text></Pressable>
              </View>
            </View>
          ) : null}
          {ongoing && !editing ? (todayFollowup ? (
            <Text style={styles.followedToday}>{t('followedToday', { answer: t(`respLong_${todayFollowup.response}` as MuhasabahStringKey) })}</Text>
          ) : (
            <View style={styles.responseRow}>
              {responses.map((response) => (
                <Pressable key={response} disabled={busy} onPress={() => void run(item.id, () => addFollowup(item.id, response, item.status))} style={({ pressed }) => [styles.response, pressed && styles.pressed]}>
                  <Ionicons name={responseIcons[response]} size={16} color={response === 'success' ? GOLD : response === 'progress' ? VIOLET : colors.textSecondary} />
                  <Text style={styles.responseText}>{t(`resp_${response}` as MuhasabahStringKey)}</Text>
                </Pressable>
              ))}
            </View>
          )) : null}
          {!editing ? (
            <View style={styles.actions}>
              <ActionChip icon="create-outline" label={t('edit')} onPress={() => { setText(item.text); setEditing(true); }} />
              {!completed ? <ActionChip icon="trophy-outline" label={t('markDone')} onPress={() => status('completed')} /> : null}
              {ongoing ? <ActionChip icon="pause-outline" label={t('pause')} onPress={() => status('paused')} /> : <ActionChip icon="play-outline" label={t('resume')} onPress={() => status('active')} />}
              <ActionChip icon="trash-outline" label={t('confirmDelete')} danger onPress={confirmDelete} />
            </View>
          ) : null}
        </Reanimated.View>
      ) : null}
    </View>
  );
}

function ActionChip({ icon, label, onPress, danger }: { icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void; danger?: boolean }) {
  return <Pressable onPress={onPress} style={styles.actionChip}><Ionicons name={icon} size={13} color={danger ? colors.danger : colors.textSecondary} /><Text style={[styles.actionText, danger && { color: colors.danger }]}>{label}</Text></Pressable>;
}

const styles: any = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  hero: { height: HERO_HEIGHT, overflow: 'hidden' },
  heroImage: { position: 'absolute', top: 0, left: 0, right: 0, width: '100%', height: HERO_HEIGHT + 40 },
  back: { position: 'absolute', left: 16, width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(15,10,28,0.45)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.22)', zIndex: 2 },
  heroCopy: { alignItems: 'center', paddingHorizontal: 28 },
  title: { color: '#fff', fontFamily: typography.serifMedium, fontSize: 40, textAlign: 'center', textShadowColor: 'rgba(0,0,0,0.45)', textShadowRadius: 14, textShadowOffset: { width: 0, height: 2 } },
  intro: { color: 'rgba(255,255,255,0.88)', fontFamily: typography.sans, fontSize: 15, lineHeight: 21, marginTop: 8, textAlign: 'center', textShadowColor: 'rgba(0,0,0,0.5)', textShadowRadius: 10 },
  body: { paddingHorizontal: 16, marginTop: -92 },
  glass: { borderRadius: 22, borderWidth: 1, borderColor: 'rgba(255,255,255,0.13)', backgroundColor: 'rgba(36,28,52,0.62)', overflow: 'hidden', marginBottom: 12 },
  glassShine: { position: 'absolute', top: 0, left: 0, right: 0, height: 46 },
  cardPad: { padding: 16 },
  reminderRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 11 },
  reminderTitle: { color: colors.text, fontWeight: '700', fontSize: 14 },
  reminderText: { color: colors.textMuted, fontSize: 12, marginTop: 1 },
  privateCard: { flexDirection: 'row', alignItems: 'center', gap: 13, padding: 14 },
  lockBubble: { width: 44, height: 44, borderRadius: 22, backgroundColor: GOLD, alignItems: 'center', justifyContent: 'center', shadowColor: GOLD, shadowOpacity: 0.5, shadowRadius: 10, shadowOffset: { width: 0, height: 0 } },
  privateTitle: { color: colors.text, fontWeight: '700', fontSize: 15 },
  privateText: { color: colors.textSecondary, fontSize: 13, lineHeight: 18, marginTop: 2 },
  errorBanner: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12 },
  errorTitle: { color: colors.text, fontWeight: '700', fontSize: 13 },
  errorText: { color: colors.textMuted, fontSize: 12, lineHeight: 16, marginTop: 2 },
  retry: { paddingHorizontal: 11, paddingVertical: 7, borderRadius: 10, borderWidth: 1, borderColor: GOLD },
  retryText: { color: GOLD, fontWeight: '700', fontSize: 12 },
  segmented: { flexDirection: 'row', padding: 4, borderRadius: 18, backgroundColor: 'rgba(36,28,52,0.62)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.13)', marginBottom: 14 },
  segment: { flex: 1, minHeight: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6 },
  segmentActive: { backgroundColor: GOLD },
  segmentText: { color: colors.textSecondary, fontSize: 14, fontWeight: '600' },
  segmentTextActive: { color: INK, fontWeight: '700' },
  dateNav: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  dateArrow: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(36,28,52,0.62)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.13)' },
  datePill: { flex: 1, height: 42, borderRadius: 21, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 12, backgroundColor: 'rgba(36,28,52,0.62)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.13)' },
  datePillText: { flexShrink: 1, color: colors.text, fontWeight: '700', fontSize: 14 },
  bubble: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  yesterday: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  yesterdayKicker: { color: GOLD, fontSize: 10, letterSpacing: 1.6, fontWeight: '700' },
  yesterdayText: { color: colors.text, fontFamily: typography.serifMedium, fontSize: 18, lineHeight: 23, marginTop: 3 },
  cardTitle: { color: colors.text, fontWeight: '700', fontSize: 15 },
  cardLead: { color: colors.textMuted, fontSize: 12, marginTop: 2, marginBottom: 4 },
  moreText: { color: colors.textMuted, fontSize: 12, marginTop: 8, marginLeft: 36 },
  questionCard: { padding: 14 },
  questionTop: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  questionTitle: { flex: 1, color: colors.text, fontFamily: typography.sans, fontWeight: '700', fontSize: 16, lineHeight: 21 },
  optionalTag: { color: colors.textMuted, fontSize: 11, fontStyle: 'italic' },
  input: { minHeight: 64, maxHeight: 190, marginTop: 11, paddingHorizontal: 13, paddingVertical: 11, borderRadius: 15, borderWidth: 1, borderColor: 'rgba(255,255,255,0.09)', backgroundColor: 'rgba(8,6,18,0.45)', color: colors.text, fontFamily: typography.sans, fontSize: 14, lineHeight: 20 },
  draftNote: { color: colors.textMuted, fontSize: 12, textAlign: 'center', marginBottom: 8 },
  saveWrap: { marginTop: 6, marginHorizontal: 18, borderRadius: 28, shadowColor: '#F2B53D', shadowOpacity: 0.55, shadowRadius: 18, shadowOffset: { width: 0, height: 4 }, elevation: 8 },
  save: { minHeight: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 9 },
  saveDisabled: { opacity: 0.55, shadowOpacity: 0 },
  saveText: { color: INK, fontFamily: typography.sans, fontWeight: '800', fontSize: 16 },
  savedCard: { flexDirection: 'row', alignItems: 'center', gap: 13, padding: 15, marginTop: 4 },
  savedCheck: { width: 46, height: 46, borderRadius: 23, backgroundColor: GREEN, alignItems: 'center', justifyContent: 'center', shadowColor: GREEN, shadowOpacity: 0.6, shadowRadius: 12, shadowOffset: { width: 0, height: 0 } },
  savedTitle: { color: colors.text, fontWeight: '800', fontSize: 16 },
  savedText: { color: colors.textSecondary, fontSize: 13, lineHeight: 18, marginTop: 2 },
  pressed: { opacity: 0.8 },
  disabled: { opacity: 0.35 },
  delete: { alignItems: 'center', padding: 12 },
  deleteText: { color: colors.textMuted, fontSize: 13, textDecorationLine: 'underline' },
  prompt: { flexDirection: 'row', alignItems: 'center', gap: 11, padding: 14, marginTop: 6 },
  promptTitle: { color: colors.text, fontWeight: '700', fontSize: 14 },
  promptText: { color: colors.textSecondary, marginTop: 2, fontSize: 13 },
  smallButton: { paddingHorizontal: 15, paddingVertical: 9, borderRadius: 14, backgroundColor: GOLD },
  smallButtonText: { color: INK, fontWeight: '700', fontSize: 13 },
  blockHeading: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  blockTitle: { color: colors.text, fontWeight: '800', fontSize: 18 },
  commitRow: { marginTop: 10, borderRadius: 17, borderWidth: 1, borderColor: 'rgba(255,255,255,0.09)', backgroundColor: 'rgba(8,6,18,0.32)' },
  commitMain: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 13 },
  ring: { width: 30, height: 30, borderRadius: 15, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  commitText: { color: colors.text, fontSize: 15, fontWeight: '700', lineHeight: 20 },
  commitTextDone: { color: colors.textSecondary },
  commitMeta: { color: colors.textMuted, fontSize: 12, marginTop: 3 },
  weekDots: { flexDirection: 'row', gap: 5, marginTop: 7 },
  weekDot: { width: 9, height: 9, borderRadius: 5, borderWidth: 1, borderColor: 'rgba(221,187,142,0.3)' },
  commitPanel: { paddingHorizontal: 13, paddingBottom: 13 },
  followedToday: { color: colors.textSecondary, fontSize: 13, lineHeight: 18 },
  responseRow: { flexDirection: 'row', gap: 7 },
  response: { flex: 1, paddingVertical: 10, paddingHorizontal: 4, borderRadius: 13, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', alignItems: 'center', gap: 4 },
  responseText: { color: colors.textSecondary, fontSize: 12, fontWeight: '600', textAlign: 'center' },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 11 },
  actionChip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 11, backgroundColor: 'rgba(255,255,255,0.05)' },
  actionText: { color: colors.textSecondary, fontSize: 12, fontWeight: '600' },
  linkText: { color: GOLD, fontSize: 13, fontWeight: '600' },
  editRow: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 16, marginTop: 10 },
  monthHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  monthTitle: { color: colors.text, fontFamily: typography.serifMedium, fontSize: 23, textTransform: 'capitalize' },
  kicker: { color: GOLD, fontSize: 10, letterSpacing: 1.8, fontWeight: '700' },
  statsRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
  stat: { flex: 1, alignItems: 'center' },
  statValue: { fontFamily: typography.serifMedium, fontSize: 32 },
  statLabel: { color: colors.textMuted, fontSize: 11, marginTop: 1, textAlign: 'center' },
  statDivider: { width: 1, height: 34, backgroundColor: 'rgba(255,255,255,0.1)' },
  monthSection: { marginTop: 15, paddingTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.09)' },
  monthSectionTitle: { color: colors.text, fontWeight: '700', fontSize: 14, marginBottom: 3 },
  repeatLine: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 7 },
  repeatText: { flex: 1, color: colors.textSecondary, fontSize: 14, lineHeight: 19, fontStyle: 'italic' },
  repeatCount: { color: GOLD, fontSize: 12, fontWeight: '700' },
  noteLine: { flexDirection: 'row', gap: 8, marginTop: 8 },
  noteText: { flex: 1, color: colors.textSecondary, fontSize: 13, lineHeight: 18 },
  calendarCard: { padding: 13 },
  weekRow: { flexDirection: 'row', marginBottom: 5 },
  weekDay: { width: `${100 / 7}%`, textAlign: 'center', color: colors.textMuted, fontSize: 11, fontWeight: '700' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  day: { width: `${100 / 7}%`, height: 44, alignItems: 'center', justifyContent: 'center' },
  dayInner: { width: 33, height: 33, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  dayHasEntry: { backgroundColor: GOLD },
  dayToday: { borderWidth: 1.5, borderColor: GOLD },
  dayText: { color: colors.textSecondary, fontSize: 14 },
  dayTextEntry: { color: INK, fontWeight: '800' },
  dayFuture: { opacity: 0.3 },
  activityDot: { position: 'absolute', bottom: 1, width: 5, height: 5, borderRadius: 3, backgroundColor: VIOLET },
  legend: { flexDirection: 'row', justifyContent: 'center', gap: 18, marginTop: 8, paddingTop: 10, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.09)' },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendSwatch: { width: 12, height: 12, borderRadius: 6, backgroundColor: GOLD },
  legendText: { color: colors.textMuted, fontSize: 11 },
  feedTitle: { color: colors.text, fontWeight: '800', fontSize: 18, marginTop: 10, marginBottom: 10 },
  feedHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  feedDate: { color: GOLD, fontWeight: '700', fontSize: 13, textTransform: 'capitalize' },
  previewLine: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginTop: 9 },
  previewDot: { width: 7, height: 7, borderRadius: 4, marginTop: 7 },
  previewText: { flex: 1, color: colors.textSecondary, lineHeight: 20, fontSize: 14 },
  activityLine: { flexDirection: 'row', gap: 10, marginTop: 10 },
  activityIcon: { width: 26, height: 26, borderRadius: 13, backgroundColor: 'rgba(182,140,255,0.16)', alignItems: 'center', justifyContent: 'center' },
  activityTitle: { color: colors.text, fontSize: 13, fontWeight: '600' },
  activityDetail: { color: colors.textMuted, fontSize: 12, lineHeight: 17, marginTop: 1 },
  emptyCard: { padding: 22, alignItems: 'center' },
  emptyText: { color: colors.textMuted, lineHeight: 20, fontSize: 14, marginTop: 10, textAlign: 'center' },
  completedHeader: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  completedTitle: { flex: 1, color: colors.textSecondary, fontWeight: '700', fontSize: 14 },
  accessory: { height: 40, paddingHorizontal: 16, backgroundColor: colors.surface, alignItems: 'flex-end', justifyContent: 'center', borderTopWidth: 1, borderTopColor: colors.border },
  done: { color: GOLD, fontSize: 15, fontWeight: '700' },
});
