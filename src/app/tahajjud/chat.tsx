import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, KeyboardAvoidingView, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MemberAvatar } from '../../components/tahajjud/MemberAvatar';
import { NightSky } from '../../components/tahajjud/NightSky';
import { night, nightType } from '../../components/tahajjud/theme';
import { COMMUNITY_AVATARS, type CommunityAvatar } from '../../features/tahajjud/tahajjudCommunity';
import {
  deleteChatMessage,
  friendsErrorMessage,
  getChatThread,
  reportChatMessage,
  sendChatMessage,
  type ChatMessage,
} from '../../features/tahajjud/tahajjudFriends';

const POLL_MS = 4_000;

const timeOf = (iso: string) => new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

function dayLabel(iso: string) {
  const date = new Date(iso);
  const today = new Date();
  const yesterday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1);
  if (date.toDateString() === today.toDateString()) return 'Aujourd’hui';
  if (date.toDateString() === yesterday.toDateString()) return 'Hier';
  return date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
}

/** Keeps the latest page from the server, older pages already loaded, and messages still sending. */
function merge(latest: ChatMessage[], current: ChatMessage[]) {
  const oldestLatest = latest[latest.length - 1]?.createdAt;
  const ids = new Set(latest.map((message) => message.id));
  const older = current.filter((message) => !message.pending && !ids.has(message.id) && oldestLatest && message.createdAt < oldestLatest);
  const pending = current.filter((message) => message.pending);
  return [...pending, ...latest, ...older];
}

/** Private conversation with a friend (friends only, filtered, reportable). */
export default function TahajjudChatScreen() {
  const params = useLocalSearchParams<{ id: string; pseudo?: string; avatar?: string }>();
  const friendId = String(params.id ?? '');
  const pseudo = params.pseudo ? String(params.pseudo) : 'Ami';
  const avatar: CommunityAvatar = (COMMUNITY_AVATARS as readonly string[]).includes(String(params.avatar)) ? params.avatar as CommunityAvatar : 'moon';

  const [messages, setMessages] = useState<ChatMessage[] | null>(null);
  const [draft, setDraft] = useState('');
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sendingRef = useRef(false);

  const refresh = useCallback(async () => {
    try {
      const latest = await getChatThread(friendId);
      setMessages((current) => (current ? merge(latest, current) : latest));
      setHasMore((value) => value && latest.length >= 40);
      setError(null);
    } catch (reason) {
      setError(friendsErrorMessage(reason));
      setMessages((current) => current ?? []);
    }
  }, [friendId]);

  useFocusEffect(useCallback(() => {
    void refresh();
    const timer = setInterval(() => void refresh(), POLL_MS);
    return () => clearInterval(timer);
  }, [refresh]));

  const loadMore = async () => {
    if (!hasMore || loadingMore || !messages?.length) return;
    const oldest = [...messages].reverse().find((message) => !message.pending);
    if (!oldest) return;
    setLoadingMore(true);
    try {
      const page = await getChatThread(friendId, oldest.createdAt);
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
    setMessages((current) => [{ id: tempId, body, mine: true, createdAt: new Date().toISOString(), read: false, pending: true }, ...(current ?? [])]);
    try {
      const id = await sendChatMessage(friendId, body);
      setMessages((current) => (current ?? []).map((message) => (message.id === tempId ? { ...message, id, pending: false } : message)));
    } catch (reason) {
      setMessages((current) => (current ?? []).filter((message) => message.id !== tempId));
      setDraft(body);
      Alert.alert('Message', friendsErrorMessage(reason));
    } finally {
      sendingRef.current = false;
    }
  };

  const onLongPress = (message: ChatMessage) => {
    if (message.pending) return;
    if (message.mine) {
      Alert.alert('Mon message', 'Le supprimer pour vous deux ?', [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer', style: 'destructive', onPress: () => {
            setMessages((current) => (current ?? []).filter((item) => item.id !== message.id));
            void deleteChatMessage(message.id).catch(() => void refresh());
          },
        },
      ]);
    } else {
      Alert.alert('Message', undefined, [
        { text: 'Signaler ce message', onPress: () => void reportChatMessage(message.id).then(() => Alert.alert('Merci', 'Le message a été signalé à l’équipe OUMMAH.')).catch((reason) => Alert.alert('Signalement', friendsErrorMessage(reason))) },
        { text: 'Annuler', style: 'cancel' },
      ]);
    }
  };

  const renderItem = ({ item, index }: { item: ChatMessage; index: number }) => {
    const older = messages?.[index + 1];
    const newer = messages?.[index - 1];
    const showDay = !older || new Date(older.createdAt).toDateString() !== new Date(item.createdAt).toDateString();
    const lastOfGroup = !newer || newer.mine !== item.mine;
    const lastMine = item.mine && messages?.find((message) => message.mine)?.id === item.id;
    return (
      <View>
        {showDay ? <Text style={styles.day}>{dayLabel(item.createdAt)}</Text> : null}
        <Pressable onLongPress={() => onLongPress(item)} delayLongPress={350} style={[styles.bubbleRow, item.mine && styles.bubbleRowMine]}>
          <View style={[styles.bubble, item.mine ? styles.bubbleMine : styles.bubbleOther, lastOfGroup && (item.mine ? styles.tailMine : styles.tailOther)]}>
            <Text style={[styles.bubbleText, item.mine && styles.bubbleTextMine]}>{item.body}</Text>
            <Text style={[styles.time, item.mine && styles.timeMine]}>
              {item.pending ? 'Envoi…' : timeOf(item.createdAt)}
              {lastMine && !item.pending ? (item.read ? ' · Vu' : ' · Envoyé') : ''}
            </Text>
          </View>
        </Pressable>
      </View>
    );
  };

  return (
    <View style={styles.root}>
      <NightSky />
      <SafeAreaView edges={['top', 'bottom']} style={styles.flex}>
        <View style={styles.header}>
          <Pressable accessibilityRole="button" accessibilityLabel="Retour" onPress={() => router.back()} hitSlop={10} style={styles.back}>
            <Ionicons name="chevron-back" size={22} color={night.text} />
          </Pressable>
          <MemberAvatar avatar={avatar} size={40} />
          <View style={styles.flex}>
            <Text style={styles.name} numberOfLines={1}>{pseudo}</Text>
            <Text style={styles.sub}>Message privé · entre amis</Text>
          </View>
        </View>

        <KeyboardAvoidingView behavior="padding" style={styles.flex}>
          {messages === null ? (
            <View style={styles.center}><ActivityIndicator color={night.gold} /></View>
          ) : (
            <FlatList
              data={messages}
              inverted
              keyExtractor={(item) => item.id}
              renderItem={renderItem}
              contentContainerStyle={styles.list}
              keyboardShouldPersistTaps="handled"
              onEndReached={() => void loadMore()}
              onEndReachedThreshold={0.3}
              ListFooterComponent={loadingMore ? <ActivityIndicator color={night.gold} style={styles.more} /> : null}
              ListEmptyComponent={(
                <View style={styles.empty}>
                  <Ionicons name="chatbubbles-outline" size={40} color={night.lavender} />
                  <Text style={styles.emptyTitle}>As-salamu ‘alaykum</Text>
                  <Text style={styles.emptyText}>Commencez la conversation avec {pseudo}. Restez bienveillant : les messages peuvent être signalés.</Text>
                </View>
              )}
            />
          )}

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <View style={styles.composer}>
            <TextInput
              value={draft}
              onChangeText={setDraft}
              placeholder="Votre message…"
              placeholderTextColor={night.muted}
              multiline
              maxLength={1000}
              style={styles.input}
            />
            <Pressable onPress={() => void send()} disabled={!draft.trim()} style={[styles.send, !draft.trim() && styles.disabled]}>
              <Ionicons name="send" size={18} color={night.sky0} />
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: night.sky0 },
  flex: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 18, paddingTop: 6, paddingBottom: 12,
    borderBottomWidth: 1, borderBottomColor: night.line,
  },
  back: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: night.glassStrong, borderWidth: 1, borderColor: night.line },
  name: { color: night.text, fontSize: 20, ...nightType.semibold },
  sub: { color: night.muted, fontSize: 13, ...nightType.body },
  list: { paddingHorizontal: 14, paddingVertical: 14, flexGrow: 1 },
  more: { marginVertical: 12 },
  day: { alignSelf: 'center', marginVertical: 12, color: night.muted, fontSize: 13, ...nightType.semibold },
  bubbleRow: { flexDirection: 'row', marginVertical: 2 },
  bubbleRowMine: { justifyContent: 'flex-end' },
  bubble: { maxWidth: '80%', paddingHorizontal: 14, paddingTop: 9, paddingBottom: 7, borderRadius: 20 },
  bubbleOther: { backgroundColor: night.glassStrong, borderWidth: 1, borderColor: night.line },
  bubbleMine: { backgroundColor: night.goldSoft },
  tailOther: { borderBottomLeftRadius: 6 },
  tailMine: { borderBottomRightRadius: 6 },
  bubbleText: { color: night.text, fontSize: 17, lineHeight: 23, ...nightType.medium },
  bubbleTextMine: { color: night.sky0 },
  time: { marginTop: 3, alignSelf: 'flex-end', color: night.muted, fontSize: 11, ...nightType.medium },
  timeMine: { color: 'rgba(4,3,12,0.6)' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, paddingHorizontal: 30, transform: [{ scaleY: -1 }] },
  emptyTitle: { color: night.text, fontSize: 22, ...nightType.display },
  emptyText: { color: night.textSoft, fontSize: 15, lineHeight: 21, textAlign: 'center', ...nightType.body },
  error: { color: '#F28B82', fontSize: 14, textAlign: 'center', paddingHorizontal: 18, paddingBottom: 6, ...nightType.medium },
  composer: { flexDirection: 'row', alignItems: 'flex-end', gap: 10, paddingHorizontal: 14, paddingVertical: 10, borderTopWidth: 1, borderTopColor: night.line },
  input: {
    flex: 1, minHeight: 46, maxHeight: 130, borderRadius: 23, paddingHorizontal: 18, paddingTop: 12, paddingBottom: 12,
    backgroundColor: 'rgba(0,0,0,0.3)', borderWidth: 1, borderColor: night.goldLine, color: night.text, fontSize: 17, ...nightType.medium,
  },
  send: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center', backgroundColor: night.gold },
  disabled: { opacity: 0.45 },
});
