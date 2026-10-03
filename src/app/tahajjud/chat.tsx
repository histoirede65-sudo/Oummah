import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { Alert, View } from 'react-native';
import { ChatBubble, ChatFrame, DayLabel, mergeThread, startsDay, timeOf } from '../../components/tahajjud/ChatFrame';
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
      setMessages((current) => (current ? mergeThread(latest, current) : latest));
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

  const lastMineId = messages?.find((message) => message.mine)?.id;

  return (
    <ChatFrame
      title={pseudo}
      subtitle="Message privé · entre amis"
      avatar={avatar}
      messages={messages}
      onEndReached={() => void loadMore()}
      loadingMore={loadingMore}
      emptyTitle="As-salamu ‘alaykum"
      emptyText={`Commencez la conversation avec ${pseudo}. Restez bienveillant : les messages peuvent être signalés.`}
      error={error}
      draft={draft}
      onDraft={setDraft}
      onSend={() => void send()}
      renderItem={(item, index) => {
        const list = messages ?? [];
        const newer = list[index - 1];
        const status = item.id === lastMineId && !item.pending ? (item.read ? ' · Vu' : ' · Envoyé') : '';
        return (
          <View>
            {startsDay(list, index) ? <DayLabel iso={item.createdAt} /> : null}
            <ChatBubble
              mine={item.mine}
              body={item.body}
              meta={item.pending ? 'Envoi…' : `${timeOf(item.createdAt)}${status}`}
              tail={!newer || newer.mine !== item.mine}
              onLongPress={() => onLongPress(item)}
            />
          </View>
        );
      }}
    />
  );
}
