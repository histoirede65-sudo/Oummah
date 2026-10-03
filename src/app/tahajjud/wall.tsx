import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import type { Href } from 'expo-router';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { TahajjudShell } from '../../components/tahajjud/TahajjudShell';
import { night, nightType } from '../../components/tahajjud/theme';
import {
  deleteWall,
  getWallFeed,
  markAnswered,
  publishDua,
  reportWall,
  setAmeen,
  timeAgo,
  wallErrorMessage,
  type WallFilter,
  type WallPost,
} from '../../features/tahajjud/duaWall';
import { getCommunityProfile, isSignedIn, type CommunityProfile } from '../../features/tahajjud/tahajjudCommunity';

const FILTERS: readonly { id: WallFilter; label: string }[] = [
  { id: 'recent', label: 'Récentes' },
  { id: 'answered', label: 'Exaucées' },
  { id: 'mine', label: 'Les miennes' },
];

function PostCard({ post, canWrite, onChanged }: { post: WallPost; canWrite: boolean; onChanged: () => void }) {
  const [ameen, setAmeenState] = useState({ on: post.myAmeen, count: post.ameenCount });
  const replyCount = post.replyCount;
  const openDetail = () => router.push({ pathname: '/tahajjud/dua', params: { id: post.id } } as unknown as Href);
  const [answerSheet, setAnswerSheet] = useState(false);

  const toggleAmeen = async () => {
    if (!canWrite) {
      Alert.alert('Amine', 'Créez votre profil OUMMAH pour dire Amine.');
      return;
    }
    const next = !ameen.on;
    setAmeenState({ on: next, count: ameen.count + (next ? 1 : -1) });
    if (next) void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => undefined);
    try {
      const count = await setAmeen(post.id, next);
      setAmeenState({ on: next, count });
    } catch (error) {
      setAmeenState({ on: !next, count: ameen.count });
      Alert.alert('Amine', wallErrorMessage(error));
    }
  };

  const menu = () => {
    if (post.mine) {
      Alert.alert('Ma doua', undefined, [
        ...(!post.answered && !post.pending ? [{ text: 'Allah m’a exaucé', onPress: () => setAnswerSheet(true) }] : []),
        { text: 'Supprimer', style: 'destructive' as const, onPress: () => void deleteWall('post', post.id).then(onChanged) },
        { text: 'Annuler', style: 'cancel' as const },
      ]);
    } else {
      Alert.alert('Doua', undefined, [
        { text: 'Signaler', onPress: () => void reportWall('post', post.id).then(() => Alert.alert('Merci', 'La doua a été signalée. Elle sera masquée si plusieurs membres la signalent.')).catch((error) => Alert.alert('Signalement', wallErrorMessage(error))) },
        { text: 'Annuler', style: 'cancel' },
      ]);
    }
  };

  return (
    <View style={[styles.card, post.answered && styles.cardAnswered, post.pending && styles.cardPending]}>
      {post.pending ? (
        <View style={styles.pendingPill}>
          <Ionicons name="time-outline" size={14} color={night.lavender} />
          <Text style={styles.pendingText}>En attente de validation</Text>
        </View>
      ) : post.answered ? (
        <View style={styles.answeredPill}>
          <Ionicons name="sparkles" size={14} color={night.sky0} />
          <Text style={styles.answeredText}>Allah l’a exaucée</Text>
        </View>
      ) : null}

      <Text onPress={post.pending ? undefined : openDetail} style={styles.body}>{post.body}</Text>
      {post.gratitude ? (
        <View style={styles.gratitude}>
          <Text style={styles.gratitudeLabel}>Gratitude</Text>
          <Text style={styles.gratitudeText}>{post.gratitude}</Text>
        </View>
      ) : null}

      <View style={styles.meta}>
        <Text style={styles.author}>{post.author ?? 'Anonyme'} · {timeAgo(post.createdAt)}</Text>
        <Pressable onPress={menu} hitSlop={10}>
          <Ionicons name="ellipsis-horizontal" size={18} color={night.muted} />
        </Pressable>
      </View>

      {!post.pending ? (
        <View style={styles.actions}>
          <Pressable onPress={() => void toggleAmeen()} style={[styles.ameen, ameen.on && styles.ameenOn]}>
            <Ionicons name={ameen.on ? 'hand-left' : 'hand-left-outline'} size={18} color={ameen.on ? night.sky0 : night.goldSoft} />
            <Text style={[styles.ameenText, ameen.on && styles.ameenTextOn]}>Amine</Text>
            <View style={[styles.ameenCount, ameen.on && styles.ameenCountOn]}>
              <Text style={[styles.ameenCountText, ameen.on && styles.ameenCountTextOn]}>{ameen.count}</Text>
            </View>
          </Pressable>
          <Pressable onPress={openDetail} style={styles.replyToggle}>
            <Ionicons name="chatbubble-outline" size={17} color={night.textSoft} />
            <Text style={styles.replyToggleText}>{replyCount ? `${replyCount} réponse${replyCount > 1 ? 's' : ''}` : 'Répondre'}</Text>
          </Pressable>
        </View>
      ) : null}


      <AnswerSheet visible={answerSheet} onClose={() => setAnswerSheet(false)} onConfirm={async (gratitude) => {
        await markAnswered(post.id, gratitude);
        setAnswerSheet(false);
        onChanged();
      }} />
    </View>
  );
}

function AnswerSheet({ visible, onClose, onConfirm }: { visible: boolean; onClose: () => void; onConfirm: (gratitude: string) => Promise<void> }) {
  const [gratitude, setGratitude] = useState('');
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior="padding" style={styles.backdrop}>
        <View style={styles.sheet}>
          <LinearGradient colors={['#1C1546', '#0E0A26']} style={StyleSheet.absoluteFill} />
          <Ionicons name="sparkles" size={34} color={night.goldSoft} />
          <Text style={styles.sheetTitle}>Allah m’a exaucé</Text>
          <Text style={styles.sheetText}>Al-hamdu lillah. Un mot de gratitude pour encourager les autres ? (facultatif)</Text>
          <TextInput
            value={gratitude}
            onChangeText={setGratitude}
            placeholder="Ce qu’Allah m’a accordé…"
            placeholderTextColor={night.muted}
            maxLength={600}
            multiline
            style={styles.composeInput}
          />
          <Pressable onPress={() => void onConfirm(gratitude).catch((error) => Alert.alert('Gratitude', wallErrorMessage(error)))} style={styles.primary}>
            <Text style={styles.primaryText}>Partager ma gratitude</Text>
          </Pressable>
          <Pressable onPress={onClose} style={styles.cancel}><Text style={styles.cancelText}>Annuler</Text></Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export default function DuaWallScreen() {
  const [filter, setFilter] = useState<WallFilter>('recent');
  const [posts, setPosts] = useState<WallPost[] | null>(null);
  const [more, setMore] = useState(true);
  const [signedIn, setSignedIn] = useState(false);
  const [profile, setProfile] = useState<CommunityProfile | null>(null);
  const [compose, setCompose] = useState(false);
  const [draft, setDraft] = useState('');
  const [anonymous, setAnonymous] = useState(true);
  const [sending, setSending] = useState(false);

  const load = useCallback(async (nextFilter: WallFilter) => {
    setPosts(null);
    const list = await getWallFeed(nextFilter).catch(() => []);
    setPosts(list);
    setMore(list.length === 20);
  }, []);

  useFocusEffect(useCallback(() => {
    void load(filter);
    void (async () => {
      const connected = await isSignedIn();
      setSignedIn(connected);
      setProfile(connected ? await getCommunityProfile() : null);
    })();
  }, [filter, load]));

  const loadMore = async () => {
    if (!posts?.length) return;
    const list = await getWallFeed(filter, posts[posts.length - 1].createdAt).catch(() => []);
    setPosts([...posts, ...list]);
    setMore(list.length === 20);
  };

  const openCompose = () => {
    if (!signedIn) return router.push('/profile' as Href);
    if (!profile) return router.push('/tahajjud/profile' as Href);
    setCompose(true);
  };

  const send = async () => {
    if (sending || draft.trim().length < 10) return;
    setSending(true);
    try {
      await publishDua(draft, anonymous);
      setCompose(false);
      setDraft('');
      Alert.alert('Doua publiée', 'Votre doua est sur le Mur. Qu’Allah l’exauce.');
      void load(filter);
    } catch (error) {
      Alert.alert('Mur des duas', wallErrorMessage(error));
    } finally {
      setSending(false);
    }
  };

  return (
    <TahajjudShell title="Mur des duas" eyebrow="Communauté">
      <Text style={styles.intro}>Faites doua les uns pour les autres et dites Amine. Votre doua est publiée tout de suite.</Text>

      <Pressable onPress={openCompose} style={({ pressed }) => [pressed && styles.pressed]}>
        <LinearGradient colors={[night.goldSoft, night.gold]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.composeButton}>
          <Ionicons name="create-outline" size={20} color={night.sky0} />
          <Text style={styles.composeButtonText}>Partager une doua</Text>
        </LinearGradient>
      </Pressable>

      <View style={styles.filters}>
        {FILTERS.filter((item) => item.id !== 'mine' || profile).map((item) => (
          <Pressable key={item.id} onPress={() => setFilter(item.id)} style={[styles.filter, filter === item.id && styles.filterOn]}>
            <Text style={[styles.filterText, filter === item.id && styles.filterTextOn]}>{item.label}</Text>
          </Pressable>
        ))}
      </View>

      {posts === null ? (
        <ActivityIndicator color={night.gold} style={styles.loader} />
      ) : posts.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="hand-left-outline" size={36} color={night.lavender} />
          <Text style={styles.emptyText}>
            {filter === 'answered' ? 'Les duas exaucées apparaîtront ici, avec la gratitude de leurs auteurs.' : 'Aucune doua pour le moment. Soyez le premier à en partager une.'}
          </Text>
        </View>
      ) : (
        posts.map((post, index) => (
          <Animated.View key={post.id} entering={FadeInDown.delay(Math.min(index, 6) * 50).duration(350)}>
            <PostCard post={post} canWrite={Boolean(profile)} onChanged={() => void load(filter)} />
          </Animated.View>
        ))
      )}
      {posts?.length && more ? (
        <Pressable onPress={() => void loadMore()} style={styles.more}><Text style={styles.moreText}>Voir plus</Text></Pressable>
      ) : null}

      <Modal visible={compose} transparent animationType="slide" onRequestClose={() => setCompose(false)}>
        <KeyboardAvoidingView behavior="padding" style={styles.backdrop}>
          <View style={styles.sheet}>
            <LinearGradient colors={['#1C1546', '#0E0A26']} style={StyleSheet.absoluteFill} />
            <Text style={styles.sheetTitle}>Partager une doua</Text>
            <Text style={styles.sheetText}>Demandez à vos frères et sœurs de faire doua pour vous. Restez bienveillant.</Text>
            <TextInput
              value={draft}
              onChangeText={setDraft}
              placeholder="Faites doua pour… "
              placeholderTextColor={night.muted}
              maxLength={600}
              multiline
              autoFocus
              style={[styles.composeInput, styles.composeInputTall]}
            />
            <Text style={styles.counter}>{draft.length}/600</Text>
            <View style={styles.anonRow}>
              <View style={styles.anonCopy}>
                <Text style={styles.anonTitle}>Publier anonymement</Text>
                <Text style={styles.anonText}>{anonymous ? 'Votre pseudo ne sera pas affiché.' : `Signé « ${profile?.pseudo ?? ''} ».`}</Text>
              </View>
              <Switch value={anonymous} onValueChange={setAnonymous} trackColor={{ false: 'rgba(255,255,255,0.15)', true: night.gold }} thumbColor={night.text} />
            </View>
            <Text style={styles.rules}>Validée par la modération avant publication. Pas de malédiction contre une personne, pas d’informations permettant d’identifier quelqu’un.</Text>
            <Pressable disabled={sending || draft.trim().length < 10} onPress={() => void send()} style={[styles.primary, (sending || draft.trim().length < 10) && styles.disabled]}>
              <Text style={styles.primaryText}>{sending ? 'Envoi…' : 'Envoyer'}</Text>
            </Pressable>
            <Pressable onPress={() => setCompose(false)} style={styles.cancel}><Text style={styles.cancelText}>Annuler</Text></Pressable>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </TahajjudShell>
  );
}

const styles = StyleSheet.create({
  intro: { color: night.textSoft, fontSize: 17, lineHeight: 24, marginBottom: 16, ...nightType.body },
  composeButton: { minHeight: 56, borderRadius: 28, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  composeButtonText: { color: night.sky0, fontSize: 17, ...nightType.bold },
  filters: { marginTop: 18, marginBottom: 14, flexDirection: 'row', gap: 8 },
  filter: { paddingHorizontal: 16, height: 40, borderRadius: 20, justifyContent: 'center', borderWidth: 1, borderColor: night.line, backgroundColor: night.glass },
  filterOn: { backgroundColor: night.gold, borderColor: night.gold },
  filterText: { color: night.textSoft, fontSize: 15, ...nightType.semibold },
  filterTextOn: { color: night.sky0, ...nightType.bold },
  loader: { marginTop: 40 },
  empty: { marginTop: 30, alignItems: 'center', gap: 12, paddingHorizontal: 20 },
  emptyText: { color: night.textSoft, fontSize: 16, lineHeight: 23, textAlign: 'center', ...nightType.body },
  card: { marginBottom: 12, padding: 18, borderRadius: 24, backgroundColor: night.glass, borderWidth: 1, borderColor: night.line },
  cardAnswered: { borderColor: night.goldLine, backgroundColor: 'rgba(227,181,90,0.07)' },
  cardPending: { borderStyle: 'dashed', borderColor: 'rgba(183,171,242,0.35)' },
  pendingPill: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  pendingText: { color: night.lavender, fontSize: 13, ...nightType.semibold },
  answeredPill: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10, paddingHorizontal: 11, paddingVertical: 5, borderRadius: 14, backgroundColor: night.goldSoft },
  answeredText: { color: night.sky0, fontSize: 13, ...nightType.bold },
  body: { color: night.text, fontSize: 18, lineHeight: 27, ...nightType.medium },
  gratitude: { marginTop: 12, padding: 12, borderRadius: 16, borderLeftWidth: 2, borderLeftColor: night.gold, backgroundColor: 'rgba(0,0,0,0.2)' },
  gratitudeLabel: { color: night.gold, fontSize: 12, letterSpacing: 1.4, textTransform: 'uppercase', ...nightType.bold },
  gratitudeText: { marginTop: 4, color: night.textSoft, fontSize: 16, lineHeight: 23, fontStyle: 'italic', ...nightType.body },
  meta: { marginTop: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  author: { color: night.muted, fontSize: 14, ...nightType.medium },
  actions: { marginTop: 12, flexDirection: 'row', gap: 10 },
  ameen: { flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 16, height: 42, borderRadius: 21, borderWidth: 1, borderColor: night.goldLine },
  ameenOn: { backgroundColor: night.gold, borderColor: night.gold },
  ameenText: { color: night.goldSoft, fontSize: 15, ...nightType.bold },
  ameenTextOn: { color: night.sky0 },
  ameenCount: { minWidth: 26, height: 24, paddingHorizontal: 7, borderRadius: 12, backgroundColor: 'rgba(244,217,149,0.16)', alignItems: 'center', justifyContent: 'center' },
  ameenCountOn: { backgroundColor: 'rgba(14,10,38,0.22)' },
  ameenCountText: { color: night.goldSoft, fontSize: 14, ...nightType.bold },
  ameenCountTextOn: { color: night.sky0 },
  replyToggle: { flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 14, height: 42 },
  replyToggleText: { color: night.textSoft, fontSize: 15, ...nightType.semibold },
  more: { alignSelf: 'center', marginTop: 6, padding: 12 },
  moreText: { color: night.goldSoft, fontSize: 16, ...nightType.semibold },
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(2,1,8,0.72)' },
  sheet: { overflow: 'hidden', padding: 24, paddingBottom: 34, borderTopLeftRadius: 30, borderTopRightRadius: 30, borderWidth: 1, borderColor: night.goldLine, gap: 8 },
  sheetTitle: { color: night.text, fontSize: 30, ...nightType.display },
  sheetText: { color: night.textSoft, fontSize: 16, lineHeight: 22, ...nightType.body },
  composeInput: { marginTop: 8, minHeight: 90, maxHeight: 200, borderRadius: 18, padding: 14, textAlignVertical: 'top', borderWidth: 1, borderColor: night.goldLine, backgroundColor: 'rgba(0,0,0,0.25)', color: night.text, fontSize: 17, ...nightType.body },
  composeInputTall: { minHeight: 140 },
  counter: { alignSelf: 'flex-end', color: night.muted, fontSize: 12, ...nightType.body },
  anonRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 4 },
  anonCopy: { flex: 1 },
  anonTitle: { color: night.text, fontSize: 16, ...nightType.semibold },
  anonText: { marginTop: 2, color: night.muted, fontSize: 14, ...nightType.body },
  rules: { marginTop: 6, color: night.muted, fontSize: 13, lineHeight: 18, ...nightType.body },
  primary: { marginTop: 10, minHeight: 54, borderRadius: 27, alignItems: 'center', justifyContent: 'center', backgroundColor: night.gold },
  primaryText: { color: night.sky0, fontSize: 17, ...nightType.bold },
  cancel: { alignSelf: 'center', padding: 10 },
  cancelText: { color: night.muted, fontSize: 15, ...nightType.medium },
  disabled: { opacity: 0.45 },
  pressed: { opacity: 0.85 },
});
