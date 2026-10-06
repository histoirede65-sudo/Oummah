import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import type { ReactElement, ReactNode } from 'react';
import { ActivityIndicator, FlatList, KeyboardAvoidingView, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { CommunityAvatar } from '../../features/tahajjud/tahajjudCommunity';
import { MemberAvatar } from './MemberAvatar';
import { NightSky } from './NightSky';
import { night, nightType } from './theme';
import { tx, tahajjudLocale } from '../../features/tahajjud/tahajjudI18n';

/** Shared frame of private and group conversations (night sky, header, inverted list, composer). */

export const timeOf = (iso: string) => new Date(iso).toLocaleTimeString(tahajjudLocale(), { hour: '2-digit', minute: '2-digit' });

export function dayLabel(iso: string) {
  const date = new Date(iso);
  const today = new Date();
  const yesterday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1);
  if (date.toDateString() === today.toDateString()) return tx('Aujourd’hui');
  if (date.toDateString() === yesterday.toDateString()) return tx('Hier');
  return date.toLocaleDateString(tahajjudLocale(), { weekday: 'long', day: 'numeric', month: 'long' });
}

type Base = { id: string; createdAt: string; pending?: boolean };

/** Keeps the latest page from the server, older pages already loaded, and messages still sending. */
export function mergeThread<T extends Base>(latest: T[], current: T[]) {
  const oldestLatest = latest[latest.length - 1]?.createdAt;
  const ids = new Set(latest.map((message) => message.id));
  const older = current.filter((message) => !message.pending && !ids.has(message.id) && oldestLatest && message.createdAt < oldestLatest);
  const pending = current.filter((message) => message.pending);
  return [...pending, ...latest, ...older];
}

/** True when the item (newest-first list) starts a new day. */
export function startsDay<T extends Base>(list: T[], index: number) {
  const older = list[index + 1];
  return !older || new Date(older.createdAt).toDateString() !== new Date(list[index].createdAt).toDateString();
}

export function DayLabel({ iso }: { iso: string }) {
  return <Text style={styles.day}>{dayLabel(iso)}</Text>;
}

export function ChatBubble({ mine, body, meta, author, tail, onLongPress }: {
  mine: boolean;
  body: string;
  meta: string;
  author?: ReactNode;
  tail: boolean;
  onLongPress?: () => void;
}) {
  return (
    <Pressable onLongPress={onLongPress} delayLongPress={350} style={[styles.bubbleRow, mine && styles.bubbleRowMine]}>
      {author}
      <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleOther, tail && (mine ? styles.tailMine : styles.tailOther)]}>
        <Text style={[styles.bubbleText, mine && styles.bubbleTextMine]}>{body}</Text>
        <Text style={[styles.time, mine && styles.timeMine]}>{meta}</Text>
      </View>
    </Pressable>
  );
}

export function ChatFrame<T extends Base>({
  title, subtitle, avatar, icon, onPressHeader, right,
  messages, renderItem, onEndReached, loadingMore, emptyTitle, emptyText, error,
  draft, onDraft, onSend, composerAction, placeholder = tx('Votre message…'), readOnly,
}: {
  /** Replaces the composer with this note (conversation one cannot answer). */
  readOnly?: string;
  title: string;
  subtitle: string;
  avatar?: CommunityAvatar;
  icon?: keyof typeof Ionicons.glyphMap;
  onPressHeader?: () => void;
  right?: ReactNode;
  messages: T[] | null;
  renderItem: (item: T, index: number) => ReactElement;
  onEndReached?: () => void;
  loadingMore?: boolean;
  emptyTitle: string;
  emptyText: string;
  error?: string | null;
  draft: string;
  onDraft: (text: string) => void;
  onSend: () => void;
  composerAction?: ReactNode;
  placeholder?: string;
}) {
  return (
    <View style={styles.root}>
      <NightSky />
      <SafeAreaView edges={['top', 'bottom']} style={styles.flex}>
        <View style={styles.header}>
          <Pressable accessibilityRole="button" accessibilityLabel={tx("Retour")} onPress={() => router.back()} hitSlop={10} style={styles.back}>
            <Ionicons name="chevron-back" size={22} color={night.text} />
          </Pressable>
          <Pressable disabled={!onPressHeader} onPress={onPressHeader} style={styles.headerMain}>
            {avatar ? <MemberAvatar avatar={avatar} size={40} /> : (
              <View style={styles.groupIcon}><Ionicons name={icon ?? 'people'} size={20} color={night.sky0} /></View>
            )}
            <View style={styles.flex}>
              <Text style={styles.name} numberOfLines={1}>{title}</Text>
              <Text style={styles.sub} numberOfLines={1}>{subtitle}</Text>
            </View>
          </Pressable>
          {right}
        </View>

        <KeyboardAvoidingView behavior="padding" style={styles.flex}>
          {messages === null ? (
            <View style={styles.center}><ActivityIndicator color={night.gold} /></View>
          ) : (
            <FlatList
              data={messages}
              inverted
              keyExtractor={(item) => item.id}
              renderItem={({ item, index }) => renderItem(item, index)}
              contentContainerStyle={styles.list}
              keyboardShouldPersistTaps="handled"
              onEndReached={onEndReached}
              onEndReachedThreshold={0.3}
              ListFooterComponent={loadingMore ? <ActivityIndicator color={night.gold} style={styles.more} /> : null}
              ListEmptyComponent={(
                <View style={styles.empty}>
                  <Ionicons name="chatbubbles-outline" size={40} color={night.lavender} />
                  <Text style={styles.emptyTitle}>{emptyTitle}</Text>
                  <Text style={styles.emptyText}>{emptyText}</Text>
                </View>
              )}
            />
          )}

          {error ? <Text style={styles.error}>{error}</Text> : null}

          {readOnly ? <Text style={styles.readOnly}>{readOnly}</Text> : <View style={styles.composer}>
            {composerAction}
            <TextInput
              value={draft}
              onChangeText={onDraft}
              placeholder={placeholder}
              placeholderTextColor={night.placeholder}
              multiline
              maxLength={1000}
              style={styles.input}
            />
            <Pressable onPress={onSend} disabled={!draft.trim()} style={[styles.send, !draft.trim() && styles.disabled]}>
              <Ionicons name="send" size={18} color={night.sky0} />
            </Pressable>
          </View>}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

export const chatStyles = StyleSheet.create({
  author: { marginLeft: 4, marginBottom: 3, fontSize: 13, ...nightType.bold },
  composerAction: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: night.goldLine },
  system: { alignSelf: 'center', marginVertical: 6, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 14, backgroundColor: '#19162D', color: night.muted, fontSize: 13, textAlign: 'center', ...nightType.medium },
});

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: night.sky0 },
  flex: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 18, paddingTop: 6, paddingBottom: 12,
    borderBottomWidth: 1, borderBottomColor: night.line,
  },
  headerMain: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  back: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: night.glassStrong, borderWidth: 1, borderColor: night.line },
  groupIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: night.lavender },
  name: { color: night.text, fontSize: 20, ...nightType.semibold },
  sub: { color: night.muted, fontSize: 13, ...nightType.body },
  list: { paddingHorizontal: 14, paddingVertical: 14, flexGrow: 1 },
  more: { marginVertical: 12 },
  day: { alignSelf: 'center', marginVertical: 12, color: night.muted, fontSize: 13, ...nightType.semibold },
  bubbleRow: { marginVertical: 2, alignItems: 'flex-start' },
  bubbleRowMine: { alignItems: 'flex-end' },
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
  readOnly: { paddingHorizontal: 24, paddingTop: 10, paddingBottom: 14, color: night.muted, fontSize: 13.5, lineHeight: 19, textAlign: 'center', ...nightType.medium },
  error: { color: '#F28B82', fontSize: 14, textAlign: 'center', paddingHorizontal: 18, paddingBottom: 6, ...nightType.medium },
  composer: { flexDirection: 'row', alignItems: 'flex-end', gap: 10, paddingHorizontal: 14, paddingVertical: 10, borderTopWidth: 1, borderTopColor: night.line },
  input: {
    flex: 1, minHeight: 46, maxHeight: 130, borderRadius: 23, paddingHorizontal: 18, paddingTop: 12, paddingBottom: 12,
    backgroundColor: '#070516', borderWidth: 1, borderColor: night.goldLine, color: night.text, fontSize: 17, ...nightType.medium,
  },
  send: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center', backgroundColor: night.gold },
  disabled: { opacity: 0.45 },
});
