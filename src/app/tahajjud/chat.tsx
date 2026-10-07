import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { Alert, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { night, nightType } from '../../components/tahajjud/theme';
import { ChatBubble, ChatFrame, DayLabel, mergeThread, startsDay, timeOf } from '../../components/tahajjud/ChatFrame';
import { COMMUNITY_AVATARS, type CommunityAvatar } from '../../features/tahajjud/tahajjudCommunity';
import {
  CHAT_REACTIONS,
  deleteChatMessage,
  friendsErrorMessage,
  getChatReactions,
  getChatThread,
  reactToChatMessage,
  reportChatMessage,
  sendChatMessage,
  type ChatMessage,
  type ChatReaction,
} from '../../features/tahajjud/tahajjudFriends';
import { tx } from '../../features/tahajjud/tahajjudI18n';

const POLL_MS = 4_000;

/** Private conversation with a friend (friends only, filtered, reportable). */
export default function TahajjudChatScreen() {
  const params = useLocalSearchParams<{ id: string; pseudo?: string; avatar?: string }>();
  const friendId = String(params.id ?? '');
  const pseudo = params.pseudo ? String(params.pseudo) : tx('Ami');
  const avatar: CommunityAvatar = (COMMUNITY_AVATARS as readonly string[]).includes(String(params.avatar)) ? params.avatar as CommunityAvatar : 'moon';

  const [messages, setMessages] = useState<ChatMessage[] | null>(null);
  const [draft, setDraft] = useState('');
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sendingRef = useRef(false);
  const [reactions, setReactions] = useState<Record<string, ChatReaction[]>>({});
  const [picker, setPicker] = useState<ChatMessage | null>(null);
  const messagesRef = useRef<ChatMessage[] | null>(null);
  messagesRef.current = messages;

  // Reactions of the loaded messages; silent if they can't be read (server not up to date…).
  const refreshReactions = useCallback(async () => {
    const loaded = messagesRef.current?.filter((message) => !message.pending) ?? [];
    const since = loaded[loaded.length - 1]?.createdAt;
    try {
      setReactions(await getChatReactions(friendId, since));
    } catch {
      // Kept as they are.
    }
  }, [friendId]);

  const react = async (message: ChatMessage, emoji: string) => {
    setPicker(null);
    const previous = reactions;
    const others = (reactions[message.id] ?? []).filter((reaction) => !reaction.mine);
    const mineNow = (reactions[message.id] ?? []).find((reaction) => reaction.mine)?.emoji;
    setReactions({ ...reactions, [message.id]: mineNow === emoji ? others : [...others, { emoji, mine: true }] });
    try {
      await reactToChatMessage(message.id, emoji);
    } catch (reason) {
      setReactions(previous);
      Alert.alert(tx('Réaction'), friendsErrorMessage(reason));
    }
  };

  const refresh = useCallback(async () => {
    try {
      const latest = await getChatThread(friendId);
      setMessages((current) => (current ? mergeThread(latest, current) : latest));
      setHasMore((value) => value && latest.length >= 40);
      setError(null);
      void refreshReactions();
    } catch (reason) {
      setError(friendsErrorMessage(reason));
      setMessages((current) => current ?? []);
    }
  }, [friendId, refreshReactions]);

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
      Alert.alert(tx('Message'), friendsErrorMessage(reason));
    } finally {
      sendingRef.current = false;
    }
  };

  const onLongPress = (message: ChatMessage) => {
    if (message.pending) return;
    setPicker(message);
  };

  const messageActions = (message: ChatMessage) => {
    setPicker(null);
    if (message.mine) {
      Alert.alert(tx('Mon message'), tx('Le supprimer pour vous deux ?'), [
        { text: tx('Annuler'), style: 'cancel' },
        {
          text: tx('Supprimer'), style: 'destructive', onPress: () => {
            setMessages((current) => (current ?? []).filter((item) => item.id !== message.id));
            void deleteChatMessage(message.id).catch(() => void refresh());
          },
        },
      ]);
    } else {
      Alert.alert(tx('Message'), undefined, [
        { text: tx('Signaler ce message'), onPress: () => void reportChatMessage(message.id).then(() => Alert.alert(tx('Merci'), tx('Le message a été signalé à l’équipe OUMMAH.'))).catch((reason) => Alert.alert(tx('Signalement'), friendsErrorMessage(reason))) },
        { text: tx('Annuler'), style: 'cancel' },
      ]);
    }
  };

  const lastMineId = messages?.find((message) => message.mine)?.id;

  const myReaction = picker ? (reactions[picker.id] ?? []).find((reaction) => reaction.mine)?.emoji : undefined;

  return (
    <>
    <Modal visible={Boolean(picker)} transparent animationType="fade" onRequestClose={() => setPicker(null)}>
      <Pressable style={styles.backdrop} onPress={() => setPicker(null)}>
        <View style={styles.sheet}>
          <Text style={styles.preview} numberOfLines={2}>{picker?.body}</Text>
          <View style={styles.emojiRow}>
            {CHAT_REACTIONS.map((emoji) => (
              <Pressable
                key={emoji}
                onPress={() => picker && void react(picker, emoji)}
                style={({ pressed }) => [styles.emojiButton, myReaction === emoji && styles.emojiButtonOn, pressed && styles.emojiPressed]}
              >
                <Text style={styles.emoji}>{emoji}</Text>
              </Pressable>
            ))}
          </View>
          <Pressable onPress={() => picker && messageActions(picker)} style={styles.action}>
            <Text style={[styles.actionText, picker?.mine && styles.actionDanger]}>
              {picker?.mine ? tx('Supprimer le message') : tx('Signaler ce message')}
            </Text>
          </Pressable>
        </View>
      </Pressable>
    </Modal>
    <ChatFrame
      title={pseudo}
      subtitle={tx("Message privé · entre amis")}
      avatar={avatar}
      messages={messages}
      onEndReached={() => void loadMore()}
      loadingMore={loadingMore}
      emptyTitle={tx("As-salamu ‘alaykum")}
      emptyText={tx("Commencez la conversation avec {0}. Restez bienveillant : les messages peuvent être signalés.", [pseudo])}
      error={error}
      draft={draft}
      onDraft={setDraft}
      onSend={() => void send()}
      renderItem={(item, index) => {
        const list = messages ?? [];
        const newer = list[index - 1];
        const status = item.id === lastMineId && !item.pending ? (item.read ? tx(' · Vu') : tx(' · Envoyé')) : '';
        return (
          <View>
            {startsDay(list, index) ? <DayLabel iso={item.createdAt} /> : null}
            <ChatBubble
              mine={item.mine}
              body={item.body}
              meta={item.pending ? tx('Envoi…') : `${timeOf(item.createdAt)}${status}`}
              tail={!newer || newer.mine !== item.mine}
              onLongPress={() => onLongPress(item)}
              onDoublePress={item.pending ? undefined : () => void react(item, '❤️')}
              reactions={reactions[item.id]}
              onPressReactions={() => onLongPress(item)}
            />
          </View>
        );
      }}
    />
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: 'rgba(4,3,14,0.7)' },
  sheet: { borderRadius: 24, padding: 18, gap: 14, backgroundColor: night.glassStrong, borderWidth: 1, borderColor: night.goldLine },
  preview: { color: night.textSoft, fontSize: 15, lineHeight: 21, ...nightType.body },
  emojiRow: { flexDirection: 'row', justifyContent: 'space-between' },
  emojiButton: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
  emojiButtonOn: { backgroundColor: 'rgba(244,217,149,0.22)', borderWidth: 1, borderColor: night.goldLine },
  emojiPressed: { transform: [{ scale: 1.15 }] },
  emoji: { fontSize: 28 },
  action: { paddingVertical: 10, alignItems: 'center', borderTopWidth: 1, borderTopColor: night.line },
  actionText: { color: night.text, fontSize: 16, ...nightType.semibold },
  actionDanger: { color: '#FF8A8A' },
});
