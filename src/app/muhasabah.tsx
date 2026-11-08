import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useRef, useState, type ReactNode } from 'react';
import { ActivityIndicator, Alert, InputAccessoryView, Keyboard, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import type { ScrollViewInstance, TextInputInstance } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { getValidSession } from '../features/auth/SupabaseAuthService';
import {
  addFollowup, createCommitment, deleteCommitment, deleteEntry, deleteLocalEntry, listActivities, listCommitments, listEntries, listLocalEntries,
  localDateKey, loadDraft, saveDraft, saveEntry, saveLocalEntry, syncLocalEntries, updateCommitment,
  type CommitmentStatus, type FollowupResponse, type MuhasabahActivity, type MuhasabahActivityKind, type MuhasabahCommitment, type MuhasabahDraft, type MuhasabahEntry,
} from '../features/muhasabah/MuhasabahService';
import { muhasabahLocale, muhasabahText, type MuhasabahStringKey } from '../features/muhasabah/muhasabahStrings';
import { useI18n } from '../i18n';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';

type Tab = 'today' | 'calendar' | 'efforts';
type T = ReturnType<typeof muhasabahText>;
const emptyDraft: MuhasabahDraft = { goodDeeds: '', couldImprove: '', effort: '' };
const questions = [
  { key: 'goodDeeds', icon: 'sunny-outline', title: 'q1', placeholder: 'q1Ph' },
  { key: 'couldImprove', icon: 'refresh-outline', title: 'q2', placeholder: 'q2Ph' },
  { key: 'effort', icon: 'trending-up-outline', title: 'q3', placeholder: 'q3Ph' },
] as const;
const responses: FollowupResponse[] = ['success', 'progress', 'not_yet'];
const activityIcons: Record<MuhasabahActivityKind, keyof typeof Ionicons.glyphMap> = {
  quran_verse: 'book-outline', hadith: 'chatbubble-ellipses-outline', tafsir: 'bulb-outline', dua: 'hand-left-outline', dhikr: 'ellipse-outline', content: 'reader-outline',
};
const ACTIVITY_COLOR = '#B68CFF';
const normalize = (text: string) => text.trim().toLocaleLowerCase().replace(/\s+/g, ' ');
const draftFrom = (entry: MuhasabahEntry): MuhasabahDraft => ({ goodDeeds: entry.goodDeeds, couldImprove: entry.couldImprove, effort: entry.effort });
const sameDraft = (a: MuhasabahDraft, b: MuhasabahDraft) => a.goodDeeds.trim() === b.goodDeeds.trim() && a.couldImprove.trim() === b.couldImprove.trim() && a.effort.trim() === b.effort.trim();

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

export default function MuhasabahScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { language } = useI18n();
  const t = useMemo(() => muhasabahText(language), [language]);
  const locale = muhasabahLocale(language);
  const dateLabel = useCallback((date: string) => new Date(`${date}T12:00:00`).toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long' }), [locale]);
  const shortDate = useCallback((date: string) => new Date(`${date}T12:00:00`).toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' }), [locale]);
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
  const [busyCommitment, setBusyCommitment] = useState<string | null>(null);

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
  useFocusEffect(useCallback(() => { void refresh(); }, [refresh]));

  const openDate = async (date: string, goToToday = false) => {
    if (date > today) return;
    setSelectedDate(date);
    await applyDate(date, entries, userId);
    if (goToToday) { setTab('today'); scrollRef.current?.scrollTo({ y: 0, animated: false }); }
  };
  const update = (key: keyof MuhasabahDraft, value: string) => {
    const next = { ...draft, [key]: value };
    setDraft(next);
    void saveDraft(userId, selectedDate, next).catch(() => undefined);
  };
  const focusQuestion = (index: number) => {
    setTimeout(() => {
      const y = questionY.current[index];
      if (y !== undefined) scrollRef.current?.scrollTo({ y: Math.max(0, y - 16), animated: true });
    }, 120);
  };
  const askLogin = (body: string) => Alert.alert(t('loginTitle'), body, [{ text: t('later'), style: 'cancel' }, { text: t('openProfile'), onPress: () => router.push('/profile') }]);

  const save = async () => {
    if (sameDraft(draft, emptyDraft)) { Alert.alert(t('incompleteTitle'), t('incompleteBody')); return; }
    Keyboard.dismiss();
    setSaving(true);
    try {
      if (session) {
        await saveEntry(selectedDate, draft);
        Alert.alert(t('savedTitle'), t('savedBody', { date: shortDate(selectedDate) }));
      } else {
        await saveLocalEntry(selectedDate, draft);
        Alert.alert(t('savedTitle'), t('savedLocalBody', { date: shortDate(selectedDate) }), [{ text: 'OK', style: 'cancel' }, { text: t('openProfile'), onPress: () => router.push('/profile') }]);
      }
      await refresh();
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
          setDraft(emptyDraft);
          await refresh();
        } catch { Alert.alert(t('errorTitle'), t('retryLater')); }
      },
    }]);
  };
  const proposeEffort = async () => {
    if (!draft.effort.trim()) return;
    if (!session) { askLogin(t('loginToFollow')); return; }
    try { await createCommitment(draft.effort); await refresh(); Alert.alert(t('effortAddedTitle'), t('effortAddedBody')); }
    catch { Alert.alert(t('errorTitle'), t('retryLater')); }
  };
  const runOnCommitment = async (id: string, action: () => Promise<unknown>) => {
    setBusyCommitment(id);
    try { await action(); await refresh(); }
    catch { Alert.alert(t('errorTitle'), t('retryLater')); }
    finally { setBusyCommitment(null); }
  };

  const entryDates = useMemo(() => new Set(entries.map((item) => item.entryDate)), [entries]);
  const activityDates = useMemo(() => new Set(activities.map((item) => item.activityDate)), [activities]);
  const days = useMemo(() => calendarDays(month), [month]);
  const monthPrefix = localDateKey(month).slice(0, 7);
  const monthCount = entries.filter((item) => item.entryDate.startsWith(monthPrefix)).length;
  const isCurrentMonth = monthPrefix === today.slice(0, 7);
  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, index) => new Date(2024, 0, 1 + index).toLocaleDateString(locale, { weekday: 'narrow' })), [locale]);
  const selectedActivities = activities.filter((item) => item.activityDate === selectedDate);
  const answeredCount = [draft.goodDeeds, draft.couldImprove, draft.effort].filter((value) => value.trim()).length;
  const unchanged = entry ? sameDraft(draft, draftFrom(entry)) : false;
  const hasDraft = !entry && answeredCount > 0;
  const effortTracked = commitments.some((item) => normalize(item.text) === normalize(draft.effort));
  const openCommitments = commitments.filter((item) => item.status !== 'completed');
  const doneCommitments = commitments.filter((item) => item.status === 'completed');

  if (loading) return <SafeAreaView style={styles.safe}><ActivityIndicator color={colors.goldLight} style={{ marginTop: 40 }} /></SafeAreaView>;
  return (
    <SafeAreaView edges={['top']} style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex} keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}>
        <ScrollView ref={scrollRef} contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 30 }]} keyboardShouldPersistTaps="handled" keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'none'} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Pressable onPress={() => router.back()} accessibilityRole="button" style={styles.back}><Ionicons name="arrow-back" size={21} color={colors.text} /></Pressable>
            <Text style={styles.eyebrow}>{t('eyebrow')}</Text>
            <Text style={styles.title}>{t('title')}</Text>
            <Text style={styles.intro}>{t('intro')}</Text>
            <View style={styles.privateRow}>
              <Ionicons name={session ? 'lock-closed-outline' : 'phone-portrait-outline'} size={13} color={colors.goldLight} />
              <Text style={styles.private}>{session ? t('private') : t('privateGuest')}</Text>
            </View>
          </View>

          {loadError ? (
            <View style={styles.errorBanner}>
              <Ionicons name="cloud-offline-outline" size={20} color={colors.goldLight} />
              <View style={styles.flex}><Text style={styles.errorTitle}>{t('offlineTitle')}</Text><Text style={styles.errorText}>{t('offlineBody')}</Text></View>
              <Pressable onPress={() => void refresh()} style={styles.retry}><Text style={styles.retryText}>{t('retry')}</Text></Pressable>
            </View>
          ) : null}

          <View style={styles.segmented}>
            {([['today', 'tabToday', 'create-outline'], ['calendar', 'tabCalendar', 'calendar-outline'], ['efforts', 'tabEfforts', 'trending-up-outline']] as const).map(([value, label, icon]) => (
              <Pressable key={value} accessibilityRole="tab" accessibilityState={{ selected: tab === value }} onPress={() => setTab(value)} style={[styles.segment, tab === value && styles.segmentActive]}>
                <Ionicons name={icon} size={16} color={tab === value ? colors.goldLight : colors.textMuted} />
                <Text numberOfLines={1} style={[styles.segmentText, tab === value && styles.segmentTextActive]}>{t(label)}</Text>
                {value === 'efforts' && openCommitments.length ? <View style={styles.badge}><Text style={styles.badgeText}>{openCommitments.length}</Text></View> : null}
              </Pressable>
            ))}
          </View>

          {tab === 'today' ? <View>
            <View style={styles.dateHeading}>
              <View style={styles.flex}>
                <Text style={styles.sectionKicker}>{selectedDate === today ? t('today') : t('entryOf')}</Text>
                <Text style={styles.selectedDate}>{dateLabel(selectedDate)}</Text>
              </View>
              {selectedDate !== today ? <Pressable onPress={() => void openDate(today)} style={styles.todayChip}><Text style={styles.todayChipText}>{t('tabToday')}</Text></Pressable> : null}
            </View>
            <View style={styles.progressRow}>
              {[0, 1, 2].map((index) => <View key={index} style={[styles.progressBar, index < answeredCount && styles.progressBarOn]} />)}
              <Text style={styles.progressText}>{entry && unchanged ? t('saved') : t('answered', { count: answeredCount })}</Text>
            </View>

            {selectedActivities.length ? (
              <View style={styles.activityCard}>
                <Text style={styles.activityCardTitle}>{selectedDate === today ? t('alreadyToday') : t('alreadyDay')}</Text>
                <Text style={styles.activityCardLead}>{t('alreadyLead')}</Text>
                {selectedActivities.slice(0, 5).map((activity) => <ActivityLine key={activity.id} activity={activity} />)}
                {selectedActivities.length > 5 ? <Text style={styles.moreText}>+{selectedActivities.length - 5}</Text> : null}
              </View>
            ) : null}

            {questions.map((question, index) => {
              const filled = Boolean(draft[question.key].trim());
              return (
                <View key={question.key} onLayout={(event) => { questionY.current[index] = event.nativeEvent.layout.y; }} style={[styles.questionCard, filled && styles.questionCardFilled]}>
                  <View style={styles.questionTop}>
                    <View style={[styles.questionIcon, filled && styles.questionIconFilled]}><Ionicons name={filled ? 'checkmark' : question.icon} size={18} color={filled ? '#211329' : colors.goldLight} /></View>
                    <Text style={styles.questionTitle}>{t(index === 0 && selectedDate !== today ? 'q1Day' : question.title)}</Text>
                  </View>
                  <TextInput
                    ref={(ref) => { inputRefs.current[index] = ref; }}
                    multiline value={draft[question.key]} onFocus={() => focusQuestion(index)} onChangeText={(value) => update(question.key, value)}
                    placeholder={t(question.placeholder)} placeholderTextColor={colors.textMuted} style={styles.input} textAlignVertical="top" maxLength={2000}
                    inputAccessoryViewID="muhasabah-input"
                  />
                </View>
              );
            })}

            {hasDraft ? <Text style={styles.draftNote}><Ionicons name="cloud-done-outline" size={12} color={colors.textMuted} />  {t('draftKept')}</Text> : null}
            <Pressable disabled={saving || unchanged} onPress={() => void save()} style={({ pressed }) => [styles.save, (saving || unchanged) && styles.saveDisabled, pressed && styles.pressed]}>
              {saving ? <ActivityIndicator color="#211329" /> : <Ionicons name={unchanged ? 'checkmark-done' : 'checkmark-circle-outline'} size={20} color="#211329" />}
              <Text style={styles.saveText}>{saving ? t('saving') : unchanged ? t('saved') : entry ? t('update') : t('save')}</Text>
            </Pressable>
            {entry ? <Pressable onPress={remove} style={styles.delete}><Ionicons name="trash-outline" size={15} color={colors.danger} /><Text style={styles.deleteText}>{t('delete')}</Text></Pressable> : null}
            {draft.effort.trim() && !effortTracked ? (
              <View style={styles.prompt}>
                <Ionicons name="leaf-outline" size={20} color={colors.goldLight} />
                <View style={styles.flex}><Text style={styles.promptTitle}>{t('followPromptTitle')}</Text><Text numberOfLines={2} style={styles.promptText}>{draft.effort.trim()}</Text></View>
                <Pressable onPress={() => void proposeEffort()} style={styles.smallButton}><Text style={styles.smallButtonText}>{t('follow')}</Text></Pressable>
              </View>
            ) : null}
          </View> : null}

          {tab === 'calendar' ? <View>
            <View style={styles.monthHeader}>
              <Pressable accessibilityRole="button" onPress={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))} style={styles.monthButton}><Ionicons name="chevron-back" size={18} color={colors.goldLight} /></Pressable>
              <View style={styles.monthCenter}>
                <Text style={styles.monthTitle}>{month.toLocaleDateString(locale, { month: 'long', year: 'numeric' })}</Text>
                <Text style={styles.monthCount}>{t('monthCount', { count: monthCount })}</Text>
              </View>
              <Pressable accessibilityRole="button" disabled={isCurrentMonth} onPress={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))} style={[styles.monthButton, isCurrentMonth && styles.disabled]}><Ionicons name="chevron-forward" size={18} color={colors.goldLight} /></Pressable>
            </View>
            <View style={styles.calendarCard}>
              <View style={styles.weekRow}>{weekDays.map((day, index) => <Text key={index} style={styles.weekDay}>{day.toLocaleUpperCase(locale)}</Text>)}</View>
              <View style={styles.grid}>
                {days.map((date, index) => {
                  if (!date) return <View key={`empty-${index}`} style={styles.day} />;
                  const future = date > today;
                  const selected = date === selectedDate;
                  const hasEntry = entryDates.has(date);
                  const hasActivity = activityDates.has(date);
                  return (
                    <Pressable key={date} disabled={future} onPress={() => void openDate(date)} style={styles.day}>
                      <View style={[styles.dayInner, hasEntry && styles.dayHasEntry, date === today && styles.dayToday, selected && styles.daySelected]}>
                        <Text style={[styles.dayText, future && styles.dayFuture, selected && styles.dayTextSelected]}>{Number(date.slice(-2))}</Text>
                      </View>
                      {hasEntry || hasActivity ? <View style={styles.dots}>{hasEntry ? <View style={styles.entryDot} /> : null}{hasActivity ? <View style={[styles.entryDot, { backgroundColor: ACTIVITY_COLOR }]} /> : null}</View> : null}
                    </Pressable>
                  );
                })}
              </View>
              <View style={styles.legend}>
                <View style={styles.legendItem}><View style={styles.entryDot} /><Text style={styles.legendText}>{t('legendEntry')}</Text></View>
                <View style={styles.legendItem}><View style={[styles.entryDot, { backgroundColor: ACTIVITY_COLOR }]} /><Text style={styles.legendText}>{t('legendActivity')}</Text></View>
              </View>
            </View>
            <View style={styles.calendarPreview}>
              <Text style={styles.previewKicker}>{selectedDate === today ? t('today') : t('selected')}</Text>
              <Text style={styles.previewTitle}>{dateLabel(selectedDate)}</Text>
              {entry ? <>
                <PreviewLine icon="sunny-outline" text={entry.goodDeeds} />
                <PreviewLine icon="refresh-outline" text={entry.couldImprove} />
                <PreviewLine icon="trending-up-outline" text={entry.effort} />
              </> : <Text style={styles.emptyText}>{t('noEntry')}</Text>}
              {selectedActivities.length ? <View style={styles.automaticSection}>
                <Text style={styles.automaticTitle}>{selectedDate === today ? t('alreadyToday') : t('alreadyDay')}</Text>
                {selectedActivities.map((activity) => <ActivityLine key={activity.id} activity={activity} />)}
              </View> : null}
              <Pressable onPress={() => void openDate(selectedDate, true)} style={entry ? styles.outlineButton : styles.fillButton}>
                <Ionicons name={entry ? 'create-outline' : 'add'} size={17} color={entry ? colors.goldLight : '#211329'} />
                <Text style={entry ? styles.outlineButtonText : styles.fillButtonText}>{entry ? t('editEntry') : t('writeEntry')}</Text>
              </Pressable>
            </View>
          </View> : null}

          {tab === 'efforts' ? <View>
            <Text style={styles.sectionHeading}>{t('tabEfforts')}</Text>
            <Text style={styles.sectionLead}>{t('effortsLead')}</Text>
            {!session ? (
              <View style={styles.emptyCard}>
                <Ionicons name="person-circle-outline" size={30} color={colors.goldLight} />
                <Text style={styles.emptyText}>{t('effortsLogin')}</Text>
                <Pressable onPress={() => router.push('/profile')} style={[styles.fillButton, { alignSelf: 'stretch' }]}><Text style={styles.fillButtonText}>{t('openProfile')}</Text></Pressable>
              </View>
            ) : !commitments.length ? (
              <View style={styles.emptyCard}>
                <Ionicons name="leaf-outline" size={28} color={colors.goldLight} />
                <Text style={styles.emptyTitle}>{t('effortsEmptyTitle')}</Text>
                <Text style={[styles.emptyText, { textAlign: 'center' }]}>{t('effortsEmptyBody')}</Text>
              </View>
            ) : <>
              {openCommitments.map((item) => <CommitmentCard key={item.id} item={item} t={t} today={today} shortDate={shortDate} busy={busyCommitment === item.id} run={runOnCommitment} />)}
              {doneCommitments.length ? <CompletedSection t={t} count={doneCommitments.length}>
                {doneCommitments.map((item) => <CommitmentCard key={item.id} item={item} t={t} today={today} shortDate={shortDate} busy={busyCommitment === item.id} run={runOnCommitment} />)}
              </CompletedSection> : null}
            </>}
          </View> : null}
        </ScrollView>
      </KeyboardAvoidingView>
      {Platform.OS === 'ios' ? <InputAccessoryView nativeID="muhasabah-input"><View style={styles.accessory}><Pressable onPress={Keyboard.dismiss}><Text style={styles.done}>{t('done')}</Text></Pressable></View></InputAccessoryView> : null}
    </SafeAreaView>
  );
}

function ActivityLine({ activity }: { activity: MuhasabahActivity }) {
  return (
    <View style={styles.activityLine}>
      <View style={styles.activityIcon}><Ionicons name={activityIcons[activity.kind] ?? 'book-outline'} size={14} color={ACTIVITY_COLOR} /></View>
      <View style={styles.flex}><Text style={styles.activityTitle}>{activity.title}</Text>{activity.detail ? <Text numberOfLines={2} style={styles.activityDetail}>{activity.detail}</Text> : null}</View>
    </View>
  );
}

function PreviewLine({ icon, text }: { icon: keyof typeof Ionicons.glyphMap; text: string }) {
  return text ? <View style={styles.previewLine}><Ionicons name={icon} size={16} color={colors.goldLight} /><Text style={styles.previewText}>{text}</Text></View> : null;
}

function CompletedSection({ t, count, children }: { t: T; count: number; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <View style={styles.completedSection}>
      <Pressable onPress={() => setOpen(!open)} style={styles.completedHeader}>
        <Ionicons name="trophy-outline" size={17} color={colors.goldLight} />
        <Text style={styles.completedTitle}>{t('completedSection', { count })}</Text>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={17} color={colors.textMuted} />
      </Pressable>
      {open ? <View style={{ marginTop: 10 }}>{children}</View> : null}
    </View>
  );
}

function CommitmentCard({ item, t, today, shortDate, busy, run }: {
  item: MuhasabahCommitment; t: T; today: string; shortDate: (date: string) => string; busy: boolean;
  run: (id: string, action: () => Promise<unknown>) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(item.text);
  const todayFollowup = item.followups.find((followup) => localDateKey(new Date(followup.createdAt)) === today);
  const completed = item.status === 'completed';
  const status = (next: CommitmentStatus) => run(item.id, () => updateCommitment(item.id, { status: next }));
  const confirmDelete = () => Alert.alert(t('deleteEffortTitle'), t('deleteEffortBody'), [{ text: t('cancel'), style: 'cancel' }, { text: t('confirmDelete'), style: 'destructive', onPress: () => void run(item.id, () => deleteCommitment(item.id)) }]);
  const saveText = () => {
    if (!text.trim() || text.trim() === item.text) { setEditing(false); setText(item.text); return; }
    void run(item.id, () => updateCommitment(item.id, { text })).then(() => setEditing(false));
  };
  const history = item.followups.filter((followup) => followup !== todayFollowup).slice(0, 3);

  return (
    <View style={[styles.commitment, completed && styles.commitmentDone, busy && { opacity: 0.6 }]}>
      <View style={styles.commitmentHeader}>
        <View style={[styles.statusPill, styles[`pill_${item.status}`]]}><Text style={[styles.statusPillText, styles[`pillText_${item.status}`]]}>{t(`status_${item.status}` as MuhasabahStringKey)}</Text></View>
        <Text style={styles.commitmentDate}>{t('createdOn', { date: shortDate(item.createdAt.slice(0, 10)) })}</Text>
        <Pressable hitSlop={10} onPress={() => { setText(item.text); setEditing(!editing); }}><Ionicons name="create-outline" size={17} color={colors.textMuted} /></Pressable>
        <Pressable hitSlop={10} onPress={confirmDelete}><Ionicons name="trash-outline" size={16} color={colors.textMuted} /></Pressable>
      </View>
      {editing ? (
        <View>
          <TextInput value={text} onChangeText={setText} multiline maxLength={500} autoFocus style={[styles.input, { minHeight: 56 }]} placeholderTextColor={colors.textMuted} />
          <View style={styles.editRow}>
            <Pressable onPress={() => { setEditing(false); setText(item.text); }}><Text style={styles.statusAction}>{t('cancel')}</Text></Pressable>
            <Pressable onPress={saveText} style={styles.smallButton}><Text style={styles.smallButtonText}>{t('saveEdit')}</Text></Pressable>
          </View>
        </View>
      ) : <Text style={[styles.commitmentText, completed && { color: colors.textSecondary }]}>{item.text}</Text>}

      {!completed && item.status !== 'paused' ? (todayFollowup ? (
        <View style={styles.followedToday}><Ionicons name="checkmark-circle" size={16} color={colors.goldLight} /><Text style={styles.followedTodayText}>{t('followedToday', { answer: t(`respLong_${todayFollowup.response}` as MuhasabahStringKey) })}</Text></View>
      ) : <>
        <Text style={styles.followupQuestion}>{t('followQuestion')}</Text>
        <View style={styles.responseRow}>
          {responses.map((response) => (
            <Pressable key={response} disabled={busy} onPress={() => void run(item.id, () => addFollowup(item.id, response, item.status))} style={({ pressed }) => [styles.response, pressed && styles.pressed]}>
              <Text style={styles.responseText}>{t(`resp_${response}` as MuhasabahStringKey)}</Text>
            </Pressable>
          ))}
        </View>
      </>) : null}

      {history.length ? <View style={styles.followups}>{history.map((followup) => (
        <View key={followup.id} style={styles.followupLine}>
          <View style={[styles.followupDot, followup.response === 'success' ? { backgroundColor: colors.goldLight } : followup.response === 'progress' ? { backgroundColor: ACTIVITY_COLOR } : null]} />
          <Text style={styles.followup}>{t(`respLong_${followup.response}` as MuhasabahStringKey)} · {shortDate(localDateKey(new Date(followup.createdAt)))}</Text>
        </View>
      ))}</View> : null}

      <View style={styles.statusRow}>
        {!completed ? <StatusButton icon="trophy-outline" label={t('markDone')} onPress={() => void status('completed')} /> : null}
        {item.status === 'completed' || item.status === 'paused' ? <StatusButton icon="play-outline" label={t('resume')} onPress={() => void status('active')} /> : null}
        {item.status !== 'paused' && !completed ? <StatusButton icon="pause-outline" label={t('pause')} onPress={() => void status('paused')} /> : null}
      </View>
    </View>
  );
}

function StatusButton({ icon, label, onPress }: { icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void }) {
  return <Pressable onPress={onPress} style={styles.statusButton}><Ionicons name={icon} size={14} color={colors.goldLight} /><Text style={styles.statusAction}>{label}</Text></Pressable>;
}

const styles: any = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  content: { padding: 18 },
  header: { paddingTop: 4, marginBottom: 16 },
  back: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface, marginBottom: 16 },
  eyebrow: { color: colors.goldLight, fontFamily: typography.sans, fontSize: 10, letterSpacing: 2 },
  title: { color: colors.text, fontFamily: typography.serifMedium, fontSize: 36, marginTop: 5 },
  intro: { color: colors.textSecondary, fontFamily: typography.sans, fontSize: 15, lineHeight: 21, marginTop: 5 },
  privateRow: { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 11 },
  private: { flex: 1, color: colors.textMuted, fontFamily: typography.sans, fontSize: 12, lineHeight: 17 },
  errorBanner: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 15, borderWidth: 1, borderColor: 'rgba(242,181,61,0.35)', backgroundColor: 'rgba(40,27,48,0.9)', marginBottom: 14 },
  errorTitle: { color: colors.text, fontWeight: '700', fontSize: 13 },
  errorText: { color: colors.textMuted, fontSize: 12, lineHeight: 16, marginTop: 2 },
  retry: { paddingHorizontal: 11, paddingVertical: 7, borderRadius: 10, borderWidth: 1, borderColor: colors.goldLight },
  retryText: { color: colors.goldLight, fontWeight: '700', fontSize: 12 },
  segmented: { flexDirection: 'row', padding: 4, borderRadius: 17, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, marginBottom: 20 },
  segment: { flex: 1, minHeight: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 5, paddingHorizontal: 4 },
  segmentActive: { backgroundColor: 'rgba(242,181,61,0.14)' },
  segmentText: { color: colors.textMuted, fontSize: 12, fontWeight: '600', flexShrink: 1 },
  segmentTextActive: { color: colors.goldLight },
  badge: { minWidth: 17, height: 17, borderRadius: 9, paddingHorizontal: 4, backgroundColor: colors.goldLight, alignItems: 'center', justifyContent: 'center' },
  badgeText: { color: '#211329', fontSize: 10, fontWeight: '800' },
  dateHeading: { flexDirection: 'row', alignItems: 'flex-end', gap: 10 },
  sectionKicker: { color: colors.goldLight, fontSize: 10, letterSpacing: 1.8, fontWeight: '700' },
  selectedDate: { color: colors.text, fontFamily: typography.serifMedium, fontSize: 25, marginTop: 3, textTransform: 'capitalize' },
  todayChip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 12, borderWidth: 1, borderColor: colors.goldLight, marginBottom: 3 },
  todayChipText: { color: colors.goldLight, fontSize: 12, fontWeight: '700' },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 10, marginBottom: 14 },
  progressBar: { width: 28, height: 4, borderRadius: 2, backgroundColor: 'rgba(221,187,142,0.18)' },
  progressBarOn: { backgroundColor: colors.goldLight },
  progressText: { color: colors.textMuted, fontSize: 12, marginLeft: 6 },
  activityCard: { padding: 14, borderRadius: 18, borderWidth: 1, borderColor: 'rgba(182,140,255,0.32)', backgroundColor: 'rgba(36,26,54,0.85)', marginBottom: 12 },
  activityCardTitle: { color: colors.text, fontWeight: '700', fontSize: 15 },
  activityCardLead: { color: colors.textMuted, fontSize: 12, marginTop: 2, marginBottom: 2 },
  moreText: { color: colors.textMuted, fontSize: 12, marginTop: 8, marginLeft: 36 },
  questionCard: { padding: 14, borderRadius: 18, borderWidth: 1, borderColor: colors.border, backgroundColor: 'rgba(28,22,39,0.88)', marginBottom: 12 },
  questionCardFilled: { borderColor: 'rgba(242,181,61,0.38)' },
  questionTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  questionIcon: { width: 32, height: 32, borderRadius: 11, backgroundColor: 'rgba(242,181,61,0.13)', alignItems: 'center', justifyContent: 'center' },
  questionIconFilled: { backgroundColor: colors.goldLight },
  questionTitle: { flex: 1, color: colors.text, fontFamily: typography.sans, fontWeight: '700', fontSize: 15, lineHeight: 20 },
  input: { minHeight: 78, maxHeight: 190, marginTop: 10, padding: 11, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(221,187,142,0.22)', backgroundColor: 'rgba(11,11,25,0.42)', color: colors.text, fontFamily: typography.sans, fontSize: 14, lineHeight: 20 },
  draftNote: { color: colors.textMuted, fontSize: 12, textAlign: 'center', marginBottom: 8 },
  save: { minHeight: 50, borderRadius: 16, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 7, backgroundColor: colors.goldLight, marginTop: 2 },
  saveDisabled: { opacity: 0.55 },
  saveText: { color: '#211329', fontFamily: typography.sans, fontWeight: '700', fontSize: 15 },
  pressed: { opacity: 0.78 },
  disabled: { opacity: 0.35 },
  delete: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, padding: 13 },
  deleteText: { color: colors.danger, fontFamily: typography.sans, fontSize: 13 },
  prompt: { marginTop: 8, padding: 14, borderRadius: 17, borderWidth: 1, borderColor: 'rgba(242,181,61,0.4)', backgroundColor: 'rgba(40,27,48,0.9)', flexDirection: 'row', alignItems: 'center', gap: 11 },
  promptTitle: { color: colors.goldLight, fontWeight: '700', fontSize: 14 },
  promptText: { color: colors.textSecondary, marginTop: 3, fontSize: 13 },
  smallButton: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 12, backgroundColor: colors.goldLight },
  smallButtonText: { color: '#211329', fontWeight: '700', fontSize: 13 },
  monthHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  monthCenter: { alignItems: 'center' },
  monthButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  monthTitle: { color: colors.text, fontFamily: typography.serifMedium, fontSize: 22, textTransform: 'capitalize' },
  monthCount: { color: colors.textMuted, fontSize: 12, marginTop: 1 },
  calendarCard: { padding: 13, borderRadius: 19, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  weekRow: { flexDirection: 'row', marginBottom: 5 },
  weekDay: { width: `${100 / 7}%`, textAlign: 'center', color: colors.textMuted, fontSize: 11, fontWeight: '700' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  day: { width: `${100 / 7}%`, height: 46, alignItems: 'center', justifyContent: 'center' },
  dayInner: { width: 34, height: 34, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  dayHasEntry: { backgroundColor: 'rgba(242,181,61,0.12)' },
  dayToday: { borderWidth: 1, borderColor: colors.goldLight },
  daySelected: { backgroundColor: colors.goldLight },
  dayText: { color: colors.textSecondary, fontSize: 14 },
  dayFuture: { opacity: 0.3 },
  dayTextSelected: { color: '#211329', fontWeight: '800' },
  dots: { position: 'absolute', bottom: 2, flexDirection: 'row', gap: 3 },
  entryDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: colors.goldLight },
  legend: { flexDirection: 'row', justifyContent: 'center', gap: 18, marginTop: 8, paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.border },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendText: { color: colors.textMuted, fontSize: 11 },
  calendarPreview: { marginTop: 14, padding: 16, borderRadius: 18, backgroundColor: 'rgba(28,22,39,0.88)', borderWidth: 1, borderColor: colors.border },
  previewKicker: { color: colors.goldLight, fontSize: 10, letterSpacing: 1.5, fontWeight: '700' },
  previewTitle: { color: colors.text, fontFamily: typography.serifMedium, fontSize: 23, marginTop: 4, textTransform: 'capitalize' },
  previewLine: { flexDirection: 'row', gap: 9, marginTop: 13 },
  previewText: { flex: 1, color: colors.textSecondary, lineHeight: 20, fontSize: 14 },
  automaticSection: { marginTop: 16, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.border },
  automaticTitle: { color: colors.text, fontWeight: '700', fontSize: 14 },
  activityLine: { flexDirection: 'row', gap: 10, marginTop: 10 },
  activityIcon: { width: 26, height: 26, borderRadius: 9, backgroundColor: 'rgba(182,140,255,0.14)', alignItems: 'center', justifyContent: 'center' },
  activityTitle: { color: colors.text, fontSize: 13, fontWeight: '600' },
  activityDetail: { color: colors.textMuted, fontSize: 12, lineHeight: 17, marginTop: 1 },
  outlineButton: { marginTop: 16, minHeight: 44, borderRadius: 13, borderWidth: 1, borderColor: colors.goldLight, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6 },
  outlineButtonText: { color: colors.goldLight, fontWeight: '700' },
  fillButton: { marginTop: 16, minHeight: 44, borderRadius: 13, backgroundColor: colors.goldLight, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6 },
  fillButtonText: { color: '#211329', fontWeight: '700' },
  emptyText: { color: colors.textMuted, lineHeight: 20, fontSize: 14, marginTop: 10 },
  sectionHeading: { color: colors.text, fontFamily: typography.serifMedium, fontSize: 29 },
  sectionLead: { color: colors.textMuted, fontSize: 14, lineHeight: 20, marginTop: 4, marginBottom: 16 },
  emptyCard: { padding: 22, borderRadius: 18, alignItems: 'center', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  emptyTitle: { color: colors.text, fontWeight: '700', fontSize: 16, marginTop: 10 },
  commitment: { padding: 15, borderRadius: 18, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, marginBottom: 12 },
  commitmentDone: { backgroundColor: 'rgba(28,22,39,0.6)' },
  commitmentHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  statusPill: { paddingHorizontal: 9, paddingVertical: 3, borderRadius: 9, backgroundColor: 'rgba(242,181,61,0.14)' },
  statusPillText: { color: colors.goldLight, fontSize: 11, fontWeight: '700' },
  pill_active: {}, pillText_active: {},
  pill_progressing: { backgroundColor: 'rgba(182,140,255,0.16)' }, pillText_progressing: { color: ACTIVITY_COLOR },
  pill_completed: { backgroundColor: colors.goldLight }, pillText_completed: { color: '#211329' },
  pill_paused: { backgroundColor: colors.surfaceAlt }, pillText_paused: { color: colors.textMuted },
  commitmentDate: { flex: 1, color: colors.textMuted, fontSize: 11 },
  commitmentText: { color: colors.text, fontSize: 16, lineHeight: 22, fontWeight: '600', marginTop: 12 },
  editRow: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 16, marginTop: 10 },
  followedToday: { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 13, padding: 10, borderRadius: 12, backgroundColor: 'rgba(242,181,61,0.08)' },
  followedTodayText: { flex: 1, color: colors.textSecondary, fontSize: 13, lineHeight: 18 },
  followupQuestion: { color: colors.textMuted, fontSize: 13, marginTop: 14 },
  responseRow: { flexDirection: 'row', gap: 7, marginTop: 9 },
  response: { flex: 1, paddingVertical: 10, paddingHorizontal: 6, borderRadius: 12, backgroundColor: colors.surfaceAlt, alignItems: 'center' },
  responseText: { color: colors.textSecondary, fontSize: 12, fontWeight: '600', textAlign: 'center' },
  followups: { gap: 5, marginTop: 12 },
  followupLine: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  followupDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.textMuted },
  followup: { flex: 1, color: colors.textMuted, fontSize: 12, lineHeight: 17 },
  statusRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.border },
  statusButton: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, backgroundColor: 'rgba(242,181,61,0.08)' },
  statusAction: { color: colors.goldLight, fontSize: 13, fontWeight: '600' },
  completedSection: { marginTop: 6, padding: 13, borderRadius: 16, borderWidth: 1, borderColor: colors.border },
  completedHeader: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  completedTitle: { flex: 1, color: colors.textSecondary, fontWeight: '700', fontSize: 14 },
  accessory: { height: 40, paddingHorizontal: 16, backgroundColor: colors.surface, alignItems: 'flex-end', justifyContent: 'center', borderTopWidth: 1, borderTopColor: colors.border },
  done: { color: colors.goldLight, fontSize: 15, fontWeight: '700' },
});
