import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import type { Href } from 'expo-router';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MemberAvatar } from '../../components/tahajjud/MemberAvatar';
import { NightSky } from '../../components/tahajjud/NightSky';
import { night, nightType } from '../../components/tahajjud/theme';
import {
  deleteWall,
  getWallPost,
  getWallReplies,
  replyToDua,
  reportWall,
  setAmeen,
  timeAgo,
  wallErrorMessage,
  type WallPost,
  type WallReply,
} from '../../features/tahajjud/duaWall';
import { COMMUNITY_AVATARS, getCommunityProfile, isSignedIn, type CommunityAvatar } from '../../features/tahajjud/tahajjudCommunity';
import { tx, txCount } from '../../features/tahajjud/tahajjudI18n';

const KIND_REPLIES = ['Amine 🤲', 'Qu’Allah t’exauce', 'Je fais dua pour toi', 'Qu’Allah te facilite'];

const avatarOf = (value: string | null): CommunityAvatar =>
  (COMMUNITY_AVATARS as readonly string[]).includes(String(value)) ? value as CommunityAvatar : 'moon';

/** One dua of the wall: Amine, kind replies (keyboard-safe composer). */
export default function DuaDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const postId = String(id ?? '');
  const [post, setPost] = useState<WallPost | null | undefined>(undefined);
  const [replies, setReplies] = useState<WallReply[]>([]);
  const [canWrite, setCanWrite] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [ameen, setAmeenState] = useState({ on: false, count: 0 });
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [focused, setFocused] = useState(false);
  const scroll = useRef<ScrollView>(null);

  const load = useCallback(async () => {
    const [found, list] = await Promise.all([getWallPost(postId).catch(() => null), getWallReplies(postId).catch(() => [])]);
    setPost(found);
    setReplies(list);
    if (found) setAmeenState({ on: found.myAmeen, count: found.ameenCount });
  }, [postId]);

  useFocusEffect(useCallback(() => {
    void load();
    void (async () => {
      const connected = await isSignedIn();
      setSignedIn(connected);
      setCanWrite(connected && Boolean(await getCommunityProfile()));
    })();
  }, [load]));

  const toggleAmeen = async () => {
    if (!post) return;
    if (!canWrite) {
      Alert.alert(tx('Amine'), tx('Créez votre profil OUMMAH pour dire Amine.'));
      return;
    }
    const next = !ameen.on;
    const previous = ameen;
    setAmeenState({ on: next, count: ameen.count + (next ? 1 : -1) });
    if (next) void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => undefined);
    try {
      setAmeenState({ on: next, count: await setAmeen(post.id, next) });
    } catch (error) {
      setAmeenState(previous);
      Alert.alert(tx('Amine'), wallErrorMessage(error));
    }
  };

  const send = async () => {
    const text = draft.trim();
    if (!text || sending) return;
    setSending(true);
    try {
      await replyToDua(postId, text);
      setDraft('');
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
      setReplies(await getWallReplies(postId).catch(() => replies));
      setTimeout(() => scroll.current?.scrollToEnd({ animated: true }), 150);
    } catch (error) {
      Alert.alert(tx('Réponse'), wallErrorMessage(error));
    } finally {
      setSending(false);
    }
  };

  const replyOptions = (reply: WallReply) => {
    Alert.alert(tx('Réponse'), undefined, reply.mine
      ? [{ text: tx('Supprimer'), style: 'destructive', onPress: () => void deleteWall('reply', reply.id).then(load) }, { text: tx('Annuler'), style: 'cancel' }]
      : [{ text: tx('Signaler'), onPress: () => void reportWall('reply', reply.id).then(() => Alert.alert(tx('Merci'), tx('La réponse a été signalée.'))) }, { text: tx('Annuler'), style: 'cancel' }]);
  };

  const postOptions = () => {
    if (!post || post.mine) return;
    Alert.alert(tx('Dua'), undefined, [
      { text: tx('Signaler'), onPress: () => void reportWall('post', post.id).then(() => Alert.alert(tx('Merci'), tx('La dua a été signalée. Elle sera masquée si plusieurs membres la signalent.'))).catch((error) => Alert.alert(tx('Signalement'), wallErrorMessage(error))) },
      { text: tx('Annuler'), style: 'cancel' },
    ]);
  };

  return (
    <View style={styles.root}>
      <NightSky />
      <SafeAreaView edges={['top', 'bottom']} style={styles.flex}>
        <View style={styles.header}>
          <Pressable accessibilityRole="button" accessibilityLabel={tx("Retour")} onPress={() => router.back()} hitSlop={10} style={styles.back}>
            <Ionicons name="chevron-back" size={22} color={night.text} />
          </Pressable>
          <View style={styles.flex}>
            <Text style={styles.eyebrow}>{tx("Mur des duas")}</Text>
            <Text style={styles.title}>{tx("Dua")}</Text>
          </View>
          {post && !post.mine ? (
            <Pressable onPress={postOptions} hitSlop={10}><Ionicons name="ellipsis-horizontal" size={22} color={night.muted} /></Pressable>
          ) : null}
        </View>

        <KeyboardAvoidingView behavior="padding" style={styles.flex}>
          {post === undefined ? (
            <View style={styles.center}><ActivityIndicator color={night.gold} /></View>
          ) : post === null ? (
            <View style={styles.center}>
              <Ionicons name="moon-outline" size={36} color={night.lavender} />
              <Text style={styles.gone}>{tx("Cette dua n’est plus disponible.")}</Text>
              <Pressable onPress={() => router.replace('/tahajjud/wall' as Href)} style={styles.primary}>
                <Text style={styles.primaryText}>{tx("Voir le Mur des duas")}</Text>
              </Pressable>
            </View>
          ) : (
            <ScrollView ref={scroll} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              <Animated.View entering={FadeInDown.duration(450)} style={[styles.card, post.answered && styles.cardAnswered]}>
                {post.answered ? (
                  <View style={styles.answeredPill}>
                    <Ionicons name="sparkles" size={14} color={night.sky0} />
                    <Text style={styles.answeredText}>{tx("Allah l’a exaucée")}</Text>
                  </View>
                ) : null}
                <Text style={styles.body}>{post.body}</Text>
                {post.gratitude ? (
                  <View style={styles.gratitude}>
                    <Text style={styles.gratitudeLabel}>{tx("Gratitude")}</Text>
                    <Text style={styles.gratitudeText}>{post.gratitude}</Text>
                  </View>
                ) : null}
                <View style={styles.metaRow}>
                  {post.author ? <MemberAvatar avatar={avatarOf(post.authorAvatar)} size={26} /> : null}
                  <Text style={styles.meta}>{post.author ?? tx('Anonyme')} · {timeAgo(post.createdAt)}</Text>
                </View>
                <Pressable onPress={() => void toggleAmeen()} style={[styles.ameen, ameen.on && styles.ameenOn]}>
                  <Ionicons name={ameen.on ? 'hand-left' : 'hand-left-outline'} size={19} color={ameen.on ? night.sky0 : night.goldSoft} />
                  <Text style={[styles.ameenText, ameen.on && styles.ameenTextOn]}>{tx("Amine")}</Text>
                  <View style={[styles.ameenCount, ameen.on && styles.ameenCountOn]}>
                    <Text style={[styles.ameenCountText, ameen.on && styles.ameenTextOn]}>{ameen.count}</Text>
                  </View>
                </Pressable>
              </Animated.View>

              <Text style={styles.section}>{replies.length ? txCount(replies.length, '{0} réponse', '{0} réponses') : tx('Aucune réponse pour l’instant')}</Text>
              {replies.map((reply) => (
                <Animated.View key={reply.id} entering={FadeIn}>
                  <Pressable onLongPress={() => replyOptions(reply)} delayLongPress={350} style={[styles.reply, reply.mine && styles.replyMine]}>
                    <View style={styles.replyHead}>
                      <MemberAvatar avatar={avatarOf(reply.authorAvatar)} size={24} />
                      <Text style={styles.replyAuthor}>{reply.mine ? tx('Vous') : reply.author ?? tx('Membre')}</Text>
                      <Text style={styles.replyTime}>{timeAgo(reply.createdAt)}</Text>
                    </View>
                    <Text style={styles.replyBody}>{reply.body}</Text>
                  </Pressable>
                </Animated.View>
              ))}
              {replies.length ? <Text style={styles.hint}>{tx("Appui long sur une réponse pour la signaler.")}</Text> : null}
            </ScrollView>
          )}

          {post ? (
            canWrite ? (
              <View style={styles.composerWrap}>
                <View style={[styles.kindBanner, focused && styles.kindBannerFocused]}>
                  <Ionicons name="heart" size={15} color={night.goldSoft} />
                  <Text style={styles.kindText}>
                    {tx("Réponse bienveillante uniquement : une dua, un encouragement. Pas de jugement ni de conseil non demandé.")}
                  </Text>
                </View>
                {focused && !draft ? (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="always" contentContainerStyle={styles.chips}>
                    {KIND_REPLIES.map((text) => (
                      <Pressable key={text} onPress={() => setDraft(tx(text))} style={styles.chip}>
                        <Text style={styles.chipText}>{tx(text)}</Text>
                      </Pressable>
                    ))}
                  </ScrollView>
                ) : null}
                <View style={styles.composer}>
                  <TextInput
                    value={draft}
                    onChangeText={setDraft}
                    onFocus={() => {
                      setFocused(true);
                      setTimeout(() => scroll.current?.scrollToEnd({ animated: true }), 250);
                    }}
                    onBlur={() => setFocused(false)}
                    placeholder={tx("Écrire une réponse bienveillante…")}
                    placeholderTextColor={night.placeholder}
                    maxLength={300}
                    multiline
                    style={styles.input}
                  />
                  <Pressable onPress={() => void send()} disabled={!draft.trim() || sending} style={[styles.send, (!draft.trim() || sending) && styles.disabled]}>
                    {sending ? <ActivityIndicator color={night.sky0} /> : <Ionicons name="send" size={18} color={night.sky0} />}
                  </Pressable>
                </View>
                {draft.length > 240 ? <Text style={styles.counter}>{300 - draft.length} {tx("caractères restants")}</Text> : null}
              </View>
            ) : (
              <Pressable
                onPress={() => router.push((signedIn ? '/tahajjud/profile' : '/profile') as Href)}
                style={styles.joinBar}
              >
                <Ionicons name="person-circle-outline" size={20} color={night.goldSoft} />
                <Text style={styles.joinText}>{signedIn ? tx('Créez votre profil OUMMAH pour répondre') : tx('Connectez-vous pour répondre')}</Text>
              </Pressable>
            )
          ) : null}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: night.sky0 },
  flex: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14, paddingHorizontal: 30 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 18, paddingTop: 6, paddingBottom: 10 },
  back: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: night.glassStrong, borderWidth: 1, borderColor: night.line },
  eyebrow: { color: night.gold, fontSize: 12, letterSpacing: 2.4, textTransform: 'uppercase', ...nightType.bold },
  title: { color: night.text, fontSize: 28, lineHeight: 32, ...nightType.display },
  content: { paddingHorizontal: 18, paddingBottom: 24 },
  gone: { color: night.text, fontSize: 18, textAlign: 'center', ...nightType.medium },
  primary: { minHeight: 50, borderRadius: 25, paddingHorizontal: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: night.gold },
  primaryText: { color: night.sky0, fontSize: 16, ...nightType.bold },
  card: { borderRadius: 24, padding: 20, backgroundColor: night.glass, borderWidth: 1, borderColor: night.goldLine },
  cardAnswered: { backgroundColor: '#1B1525' },
  answeredPill: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12, backgroundColor: night.goldSoft, marginBottom: 12 },
  answeredText: { color: night.sky0, fontSize: 13, ...nightType.bold },
  body: { color: night.text, fontSize: 21, lineHeight: 30, ...nightType.medium },
  gratitude: { marginTop: 14, padding: 14, borderRadius: 16, backgroundColor: '#1D1829' },
  gratitudeLabel: { color: night.goldSoft, fontSize: 12, letterSpacing: 1.4, textTransform: 'uppercase', ...nightType.bold },
  gratitudeText: { marginTop: 4, color: night.textSoft, fontSize: 16, lineHeight: 23, ...nightType.body },
  metaRow: { marginTop: 14, flexDirection: 'row', alignItems: 'center', gap: 8 },
  meta: { color: night.muted, fontSize: 14, ...nightType.medium },
  ameen: { marginTop: 16, alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 18, height: 46, borderRadius: 23, borderWidth: 1, borderColor: night.goldLine },
  ameenOn: { backgroundColor: night.gold, borderColor: night.gold },
  ameenText: { color: night.goldSoft, fontSize: 16, ...nightType.bold },
  ameenTextOn: { color: night.sky0 },
  ameenCount: { minWidth: 28, height: 26, paddingHorizontal: 8, borderRadius: 13, backgroundColor: '#2F2933', alignItems: 'center', justifyContent: 'center' },
  ameenCountOn: { backgroundColor: 'rgba(14,10,38,0.22)' },
  ameenCountText: { color: night.goldSoft, fontSize: 15, ...nightType.bold },
  section: { marginTop: 24, marginBottom: 10, color: night.muted, fontSize: 14, letterSpacing: 1.8, textTransform: 'uppercase', ...nightType.bold },
  reply: { marginBottom: 10, padding: 14, borderRadius: 18, backgroundColor: night.glassStrong, borderWidth: 1, borderColor: night.line },
  replyMine: { borderColor: night.goldLine },
  replyHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  replyAuthor: { flex: 1, color: night.goldSoft, fontSize: 14, ...nightType.bold },
  replyTime: { color: night.muted, fontSize: 12, ...nightType.body },
  replyBody: { marginTop: 6, color: night.text, fontSize: 17, lineHeight: 24, ...nightType.medium },
  hint: { marginTop: 4, color: night.muted, fontSize: 12, textAlign: 'center', ...nightType.body },
  composerWrap: { paddingHorizontal: 14, paddingTop: 10, paddingBottom: 10, borderTopWidth: 1, borderTopColor: night.line, backgroundColor: '#05040F', gap: 8 },
  kindBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 14, backgroundColor: '#1A1628' },
  kindBannerFocused: { backgroundColor: '#2B2430', borderWidth: 1, borderColor: night.goldLine },
  kindText: { flex: 1, color: night.textSoft, fontSize: 13, lineHeight: 18, ...nightType.medium },
  chips: { gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16, borderWidth: 1, borderColor: night.goldLine },
  chipText: { color: night.goldSoft, fontSize: 14, ...nightType.semibold },
  composer: { flexDirection: 'row', alignItems: 'flex-end', gap: 10 },
  input: {
    flex: 1, minHeight: 48, maxHeight: 140, borderRadius: 24, paddingHorizontal: 18, paddingTop: 13, paddingBottom: 13,
    backgroundColor: '#060515', borderWidth: 1, borderColor: night.goldLine, color: night.text, fontSize: 17, ...nightType.medium,
  },
  send: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: night.gold },
  disabled: { opacity: 0.45 },
  counter: { alignSelf: 'flex-end', color: night.muted, fontSize: 12, ...nightType.body },
  joinBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16, borderTopWidth: 1, borderTopColor: night.line },
  joinText: { color: night.goldSoft, fontSize: 15, ...nightType.semibold },
});
