import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { View } from 'react-native';
import { ChatBubble, ChatFrame, DayLabel, startsDay, timeOf } from '../../components/tahajjud/ChatFrame';
import { friendsErrorMessage, getOummahThread, type OummahMessage } from '../../features/tahajjud/tahajjudFriends';
import { tx } from '../../features/tahajjud/tahajjudI18n';

/** Messages from the OUMMAH team: updates and news about the app. Read only. */
export default function OummahMessagesScreen() {
  const [messages, setMessages] = useState<OummahMessage[] | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(useCallback(() => {
    void getOummahThread()
      .then((list) => {
        setMessages(list);
        setHasMore(list.length >= 40);
        setError(null);
      })
      .catch((reason) => {
        setError(friendsErrorMessage(reason));
        setMessages((current) => current ?? []);
      });
  }, []));

  const loadMore = async () => {
    const oldest = messages?.[messages.length - 1];
    if (!hasMore || loadingMore || !oldest) return;
    setLoadingMore(true);
    try {
      const page = await getOummahThread(oldest.createdAt);
      setMessages((current) => [...(current ?? []), ...page.filter((message) => !current?.some((item) => item.id === message.id))]);
      setHasMore(page.length >= 40);
    } catch {
      // Retried on next scroll.
    } finally {
      setLoadingMore(false);
    }
  };

  return (
    <ChatFrame
      title="OUMMAH"
      subtitle={tx("Messages de l’équipe")}
      icon="moon"
      messages={messages}
      onEndReached={() => void loadMore()}
      loadingMore={loadingMore}
      emptyTitle={tx("As-salamu ‘alaykum")}
      emptyText={tx("Les nouveautés et messages de l’équipe OUMMAH apparaîtront ici.")}
      error={error}
      draft=""
      onDraft={() => undefined}
      onSend={() => undefined}
      readOnly={tx("Messages de l’équipe OUMMAH. Pour nous écrire : Profil › Aide et support.")}
      renderItem={(item, index) => {
        const list = messages ?? [];
        const newer = list[index - 1];
        return (
          <View>
            {startsDay(list, index) ? <DayLabel iso={item.createdAt} /> : null}
            <ChatBubble mine={false} body={item.body} meta={timeOf(item.createdAt)} tail={!newer} />
          </View>
        );
      }}
    />
  );
}
