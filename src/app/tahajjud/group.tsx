import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import type { Href } from 'expo-router';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { Alert, KeyboardAvoidingView, Modal, Pressable, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { ChatBubble, ChatFrame, chatStyles, DayLabel, mergeThread, startsDay, timeOf } from '../../components/tahajjud/ChatFrame';
import { night, nightType } from '../../components/tahajjud/theme';
import { formatTimeInput, parseTime } from '../../features/mosques/timeInput';
import {
  addGroupReminder,
  cancelGroupReminder,
  deleteGroupMessage,
  getGroupDetail,
  getGroupThread,
  groupsErrorMessage,
  nextOccurrence,
  reminderLabel,
  reportGroupMessage,
  sendGroupMessage,
  type GroupMessage,
} from '../../features/tahajjud/tahajjudGroups';
import { tx, txCount } from '../../features/tahajjud/tahajjudI18n';

const POLL_MS = 4_000;
const AUTHOR_COLORS = ['#F4D995', '#B7ABF2', '#7FD8A6', '#8EC5FF', '#F7A8C4', '#FFB37A'];
const REMINDER_PRESETS = ['Debout pour la prière de la nuit', 'Lecture de sourate Al-Mulk', 'Witr avant de dormir', 'Dua du dernier tiers'];

function colorOf(id: string | null) {
  if (!id) return AUTHOR_COLORS[0];
  let hash = 0;
  for (const char of id) hash = (hash * 31 + char.charCodeAt(0)) | 0;
  return AUTHOR_COLORS[Math.abs(hash) % AUTHOR_COLORS.length];
}

function ReminderSheet({ visible, onClose, onCreate }: {
  visible: boolean;
  onClose: () => void;
  onCreate: (body: string, at: Date, repeatDaily: boolean) => Promise<void>;
}) {
  const [body, setBody] = useState(() => tx(REMINDER_PRESETS[0]));
  const [time, setTime] = useState('04:00');
  const [repeat, setRepeat] = useState(false);
  const [saving, setSaving] = useState(false);
  const parsed = parseTime(time);
  const at = parsed ? nextOccurrence(Number(parsed.slice(0, 2)), Number(parsed.slice(3, 5))) : null;

  const create = async () => {
    if (!at || !body.trim() || saving) return;
    setSaving(true);
    try {
      await onCreate(body.trim(), at, repeat);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior="padding" style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={styles.sheet}>
          <LinearGradient colors={['#1C1546', '#0E0A26']} style={StyleSheet.absoluteFill} />
          <View style={styles.sheetHead}>
            <Ionicons name="alarm" size={26} color={night.goldSoft} />
            <Text style={styles.sheetTitle}>{tx("Rappel pour le groupe")}</Text>
          </View>
          <Text style={styles.sheetText}>{tx("Chaque membre reçoit une notification à l’heure choisie.")}</Text>

          <View style={styles.presets}>
            {REMINDER_PRESETS.map((preset) => (
              <Pressable key={preset} onPress={() => setBody(tx(preset))} style={[styles.preset, body === tx(preset) && styles.presetOn]}>
                <Text style={[styles.presetText, body === tx(preset) && styles.presetTextOn]}>{tx(preset)}</Text>
              </Pressable>
            ))}
          </View>
          <TextInput value={body} onChangeText={setBody} maxLength={200} placeholder={tx("Texte du rappel")} placeholderTextColor={night.placeholder} style={styles.field} />

          <View style={styles.timeRow}>
            <Text style={styles.label}>{tx("Heure")}</Text>
            <TextInput
              value={time}
              onChangeText={(value) => setTime(formatTimeInput(value))}
              keyboardType="number-pad"
              maxLength={5}
              placeholder="04:00"
              placeholderTextColor={night.placeholder}
              style={[styles.field, styles.timeField]}
            />
          </View>
          <View style={styles.timeRow}>
            <Text style={styles.label}>{tx("Chaque jour")}</Text>
            <Switch value={repeat} onValueChange={setRepeat} trackColor={{ false: 'rgba(255,255,255,0.15)', true: night.gold }} thumbColor={night.text} />
          </View>
          <Text style={styles.when}>{at ? reminderLabel(at.toISOString(), repeat) : tx('Heure invalide (format HH:MM)')}</Text>

          <Pressable disabled={!at || !body.trim() || saving} onPress={() => void create()} style={[styles.primary, (!at || !body.trim() || saving) && styles.disabled]}>
            <Text style={styles.primaryText}>{saving ? tx('Programmation…') : tx('Programmer le rappel')}</Text>
          </Pressable>
          <Pressable onPress={onClose} style={styles.cancel}><Text style={styles.cancelText}>{tx("Annuler")}</Text></Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

/** Group conversation: messages, reminders and system events. */
export default function TahajjudGroupScreen() {
  const params = useLocalSearchParams<{ id: string; name?: string }>();
  const groupId = String(params.id ?? '');
  const [name, setName] = useState(params.name ? String(params.name) : tx('Groupe'));
  const [memberCount, setMemberCount] = useState<number | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [messages, setMessages] = useState<GroupMessage[] | null>(null);
  const [draft, setDraft] = useState('');
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reminderSheet, setReminderSheet] = useState(false);
  const sendingRef = useRef(false);

  const refresh = useCallback(async () => {
    try {
      const latest = await getGroupThread(groupId);
      setMessages((current) => (current ? mergeThread(latest, current) : latest));
      setHasMore((value) => value && latest.length >= 40);
      setError(null);
    } catch (reason) {
      setError(groupsErrorMessage(reason));
      setMessages((current) => current ?? []);
    }
  }, [groupId]);

  useFocusEffect(useCallback(() => {
    void refresh();
    void getGroupDetail(groupId).then((detail) => {
      setName(detail.name);
      setMemberCount(detail.members.length);
      setIsOwner(detail.isOwner);
    }).catch(() => undefined);
    const timer = setInterval(() => void refresh(), POLL_MS);
    return () => clearInterval(timer);
  }, [groupId, refresh]));

  const loadMore = async () => {
    if (!hasMore || loadingMore || !messages?.length) return;
    const oldest = [...messages].reverse().find((message) => !message.pending);
    if (!oldest) return;
    setLoadingMore(true);
    try {
      const page = await getGroupThread(groupId, oldest.createdAt);
      setMessages((current) => [...(current ?? []), ...page.filter((message) => !current?.some((item) => item.id === message.id))]);
      setHasMore(page.length >= 40);
    } catch {
      // Retried on next scroll.
    } finally {
      setLoadingMore(false);
    }
  };

  const send = async () => {
    const body = draft.trim();
    if (!body || sendingRef.current) return;
    sendingRef.current = true;
    const tempId = `pending-${Date.now()}`;
    setDraft('');
    setMessages((current) => [{
      id: tempId, body, kind: 'text', remindAt: null, repeatDaily: false, reminderActive: false,
      sender: null, senderPseudo: null, senderAvatar: 'moon', mine: true, createdAt: new Date().toISOString(), pending: true,
    }, ...(current ?? [])]);
    try {
      const id = await sendGroupMessage(groupId, body);
      setMessages((current) => (current ?? []).map((message) => (message.id === tempId ? { ...message, id, pending: false } : message)));
    } catch (reason) {
      setMessages((current) => (current ?? []).filter((message) => message.id !== tempId));
      setDraft(body);
      Alert.alert(tx('Message'), groupsErrorMessage(reason));
    } finally {
      sendingRef.current = false;
    }
  };

  const createReminder = async (body: string, at: Date, repeatDaily: boolean) => {
    try {
      await addGroupReminder(groupId, body, at, repeatDaily);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
      setReminderSheet(false);
      await refresh();
    } catch (reason) {
      Alert.alert(tx('Rappel'), groupsErrorMessage(reason));
    }
  };

  const onLongPress = (message: GroupMessage) => {
    if (message.pending || message.kind === 'system') return;
    const canCancel = message.kind === 'reminder' && message.reminderActive && (message.mine || isOwner);
    const actions = [
      ...(canCancel ? [{ text: tx('Annuler le rappel'), onPress: () => void cancelGroupReminder(message.id).then(refresh).catch((reason) => Alert.alert(tx('Rappel'), groupsErrorMessage(reason))) }] : []),
      ...(message.mine
        ? [{
          text: tx('Supprimer'), style: 'destructive' as const, onPress: () => {
            setMessages((current) => (current ?? []).filter((item) => item.id !== message.id));
            void deleteGroupMessage(message.id).catch(() => void refresh());
          },
        }]
        : [{ text: tx('Signaler ce message'), onPress: () => void reportGroupMessage(message.id).then(() => Alert.alert(tx('Merci'), tx('Le message a été signalé à l’équipe OUMMAH.'))).catch((reason) => Alert.alert(tx('Signalement'), groupsErrorMessage(reason))) }]),
      { text: tx('Fermer'), style: 'cancel' as const },
    ];
    Alert.alert(message.kind === 'reminder' ? tx('Rappel') : tx('Message'), undefined, actions);
  };

  const openInfo = () => router.push({ pathname: '/tahajjud/group-info', params: { id: groupId } } as unknown as Href);

  return (
    <>
      <ChatFrame
        title={name}
        subtitle={memberCount ? txCount(memberCount, '{0} membre · touchez pour les infos', '{0} membres · touchez pour les infos') : tx('Groupe')}
        icon="people"
        onPressHeader={openInfo}
        right={(
          <Pressable onPress={openInfo} hitSlop={10}>
            <Ionicons name="information-circle-outline" size={26} color={night.goldSoft} />
          </Pressable>
        )}
        messages={messages}
        onEndReached={() => void loadMore()}
        loadingMore={loadingMore}
        emptyTitle={tx("Bismillah")}
        emptyText={tx("Lancez la discussion, ou programmez un rappel pour tout le groupe avec le réveil.")}
        error={error}
        draft={draft}
        onDraft={setDraft}
        onSend={() => void send()}
        composerAction={(
          <Pressable onPress={() => setReminderSheet(true)} style={chatStyles.composerAction} accessibilityLabel={tx("Programmer un rappel")}>
            <Ionicons name="alarm-outline" size={21} color={night.goldSoft} />
          </Pressable>
        )}
        renderItem={(item, index) => {
          const list = messages ?? [];
          const newer = list[index - 1];
          const older = list[index + 1];
          const day = startsDay(list, index) ? <DayLabel iso={item.createdAt} /> : null;
          if (item.kind === 'system') {
            return <View>{day}<Text style={chatStyles.system}>{item.body}</Text></View>;
          }
          if (item.kind === 'reminder') {
            return (
              <View>
                {day}
                <Pressable onLongPress={() => onLongPress(item)} delayLongPress={350} style={[styles.reminder, !item.reminderActive && styles.reminderDone]}>
                  <View style={styles.reminderHead}>
                    <Ionicons name={item.reminderActive ? 'alarm' : 'checkmark-done'} size={18} color={night.sky0} />
                    <Text style={styles.reminderWhen}>
                      {item.remindAt ? (item.reminderActive ? reminderLabel(item.remindAt, item.repeatDaily) : tx('Rappel envoyé')) : tx('Rappel')}
                    </Text>
                  </View>
                  <Text style={styles.reminderBody}>{item.body}</Text>
                  <Text style={styles.reminderBy}>{item.mine ? tx('Vous') : item.senderPseudo ?? tx('Membre')} · {timeOf(item.createdAt)}</Text>
                </Pressable>
              </View>
            );
          }
          const firstOfGroup = !older || older.sender !== item.sender || older.kind !== 'text' || startsDay(list, index);
          return (
            <View>
              {day}
              <ChatBubble
                mine={item.mine}
                body={item.body}
                meta={item.pending ? tx('Envoi…') : timeOf(item.createdAt)}
                tail={!newer || newer.sender !== item.sender || newer.kind !== 'text'}
                author={!item.mine && firstOfGroup ? (
                  <Text style={[chatStyles.author, { color: colorOf(item.sender) }]}>{item.senderPseudo ?? tx('Membre')}</Text>
                ) : undefined}
                onLongPress={() => onLongPress(item)}
              />
            </View>
          );
        }}
      />
      <ReminderSheet visible={reminderSheet} onClose={() => setReminderSheet(false)} onCreate={createReminder} />
    </>
  );
}

const styles = StyleSheet.create({
  reminder: {
    alignSelf: 'center', width: '88%', marginVertical: 8, padding: 14, borderRadius: 20, backgroundColor: night.goldSoft,
    shadowColor: night.goldSoft, shadowOpacity: 0.35, shadowRadius: 14, shadowOffset: { width: 0, height: 0 }, elevation: 4,
  },
  reminderDone: { opacity: 0.6 },
  reminderHead: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  reminderWhen: { color: night.sky0, fontSize: 14, textTransform: 'uppercase', letterSpacing: 0.6, ...nightType.bold },
  reminderBody: { marginTop: 6, color: night.sky0, fontSize: 18, lineHeight: 24, ...nightType.semibold },
  reminderBy: { marginTop: 6, color: 'rgba(4,3,12,0.6)', fontSize: 12, ...nightType.medium },
  backdrop: { flex: 1, backgroundColor: 'rgba(5,3,18,0.7)', justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, overflow: 'hidden', padding: 22, paddingBottom: 34, gap: 12 },
  sheetHead: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  sheetTitle: { color: night.text, fontSize: 24, ...nightType.display },
  sheetText: { color: night.textSoft, fontSize: 15, lineHeight: 21, ...nightType.body },
  presets: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  preset: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16, borderWidth: 1, borderColor: night.goldLine },
  presetOn: { backgroundColor: night.gold, borderColor: night.gold },
  presetText: { color: night.goldSoft, fontSize: 14, ...nightType.semibold },
  presetTextOn: { color: night.sky0 },
  field: {
    minHeight: 50, borderRadius: 16, paddingHorizontal: 16, borderWidth: 1, borderColor: night.goldLine,
    backgroundColor: '#080518', color: night.text, fontSize: 17, ...nightType.medium,
  },
  timeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  label: { color: night.text, fontSize: 17, ...nightType.semibold },
  timeField: { width: 110, textAlign: 'center', fontSize: 22 },
  when: { color: night.goldSoft, fontSize: 15, textAlign: 'center', ...nightType.semibold },
  primary: { minHeight: 54, borderRadius: 27, alignItems: 'center', justifyContent: 'center', backgroundColor: night.gold },
  primaryText: { color: night.sky0, fontSize: 17, ...nightType.bold },
  disabled: { opacity: 0.45 },
  cancel: { alignSelf: 'center', paddingVertical: 8 },
  cancelText: { color: night.muted, fontSize: 15, ...nightType.semibold },
});
