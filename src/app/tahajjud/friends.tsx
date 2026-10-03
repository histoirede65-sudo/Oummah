import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import type { Href } from 'expo-router';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { MemberAvatar } from '../../components/tahajjud/MemberAvatar';
import { GlassCard, shellStyles, TahajjudShell } from '../../components/tahajjud/TahajjudShell';
import { night, nightType } from '../../components/tahajjud/theme';
import { getCommunityProfile, isSignedIn, type CommunityProfile } from '../../features/tahajjud/tahajjudCommunity';
import { timeAgo } from '../../features/tahajjud/duaWall';
import {
  blockMember,
  ENCOURAGEMENTS,
  encouragementText,
  friendsErrorMessage,
  getFriendsOverview,
  markEncouragementsRead,
  removeFriend,
  reportMember,
  requestFriend,
  respondFriend,
  searchMembers,
  sendEncouragement,
  unblockMember,
  type Friend,
  type FriendRelation,
  type FriendsOverview,
  type Member,
} from '../../features/tahajjud/tahajjudFriends';

type SearchResult = Member & { relation: FriendRelation };

function friendStatus(friend: Friend) {
  if (!friend.shared) return { icon: 'lock-closed-outline' as const, text: 'Activité privée', color: night.muted };
  if (friend.tonight === 'prayed') return { icon: 'checkmark-circle' as const, text: 'A prié cette nuit', color: night.success };
  if (friend.tonight === 'awake') return { icon: 'sunny' as const, text: 'Réveillé pour Tahajjud', color: night.goldSoft };
  return { icon: 'moon-outline' as const, text: 'Pas encore cette nuit', color: night.muted };
}

function EncourageSheet({ friend, onClose }: { friend: Friend | null; onClose: () => void }) {
  const [sending, setSending] = useState<string | null>(null);
  const send = async (kind: typeof ENCOURAGEMENTS[number]['kind']) => {
    if (!friend || sending) return;
    setSending(kind);
    try {
      await sendEncouragement(friend.id, kind);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
      onClose();
      Alert.alert('Encouragement envoyé', `${friend.pseudo} va recevoir votre message. Qu’Allah vous récompense.`);
    } catch (error) {
      Alert.alert('Encourager', friendsErrorMessage(error));
    } finally {
      setSending(null);
    }
  };
  return (
    <Modal visible={Boolean(friend)} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={() => undefined}>
          <LinearGradient colors={['#1C1546', '#0E0A26']} style={StyleSheet.absoluteFill} />
          <Text style={styles.sheetTitle}>Encourager {friend?.pseudo}</Text>
          <Text style={styles.sheetText}>Choisissez un message. Votre ami le reçoit en notification.</Text>
          {ENCOURAGEMENTS.map((item) => (
            <Pressable key={item.kind} disabled={Boolean(sending)} onPress={() => void send(item.kind)} style={({ pressed }) => [styles.encourageOption, pressed && styles.pressed]}>
              <Ionicons name={item.icon} size={20} color={night.goldSoft} />
              <Text style={styles.encourageText}>{item.text}</Text>
              {sending === item.kind ? <ActivityIndicator color={night.gold} /> : null}
            </Pressable>
          ))}
          <Pressable onPress={onClose} style={styles.cancel}><Text style={styles.cancelText}>Annuler</Text></Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export default function TahajjudFriendsScreen() {
  const [ready, setReady] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [profile, setProfile] = useState<CommunityProfile | null>(null);
  const [data, setData] = useState<FriendsOverview | null>(null);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[] | null>(null);
  const [encourage, setEncourage] = useState<Friend | null>(null);
  const [showBlocked, setShowBlocked] = useState(false);
  const searchSeq = useRef(0);

  const load = useCallback(async () => {
    try {
      const overview = await getFriendsOverview();
      setData(overview);
      if (overview.encouragements.some((item) => item.unread)) void markEncouragementsRead().catch(() => undefined);
    } catch {
      setData((current) => current ?? { friends: [], received: [], sent: [], blocked: [], encouragements: [] });
    }
  }, []);

  useFocusEffect(useCallback(() => {
    void (async () => {
      const connected = await isSignedIn();
      const mine = connected ? await getCommunityProfile() : null;
      setSignedIn(connected);
      setProfile(mine);
      if (mine) await load();
      setReady(true);
    })();
  }, [load]));

  useEffect(() => {
    const text = query.trim();
    if (text.length < 2) {
      setResults(null);
      return;
    }
    const seq = ++searchSeq.current;
    const timer = setTimeout(() => {
      void searchMembers(text).then((list) => { if (seq === searchSeq.current) setResults(list); }).catch(() => undefined);
    }, 350);
    return () => clearTimeout(timer);
  }, [query]);

  const act = async (action: () => Promise<unknown>, after?: () => void) => {
    try {
      await action();
      after?.();
      await load();
    } catch (error) {
      Alert.alert('Amis', friendsErrorMessage(error));
    }
  };

  const add = (member: SearchResult) => act(async () => {
    const relation = await requestFriend(member.id);
    setResults((list) => list?.map((item) => (item.id === member.id ? { ...item, relation } : item)) ?? null);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
  });

  const friendMenu = (friend: Friend) => {
    Alert.alert(friend.pseudo, undefined, [
      { text: 'Retirer de mes amis', onPress: () => void act(() => removeFriend(friend.id)) },
      {
        text: 'Bloquer', style: 'destructive', onPress: () => Alert.alert(
          `Bloquer ${friend.pseudo} ?`,
          'Il ne pourra plus vous trouver, vous écrire ni vous encourager. Vous pourrez le débloquer plus tard.',
          [{ text: 'Annuler', style: 'cancel' }, { text: 'Bloquer', style: 'destructive', onPress: () => void act(() => blockMember(friend.id)) }],
        ),
      },
      { text: 'Signaler', onPress: () => reportFlow(friend) },
      { text: 'Annuler', style: 'cancel' },
    ]);
  };

  const reportFlow = (member: Member) => {
    Alert.alert(`Signaler ${member.pseudo}`, 'Pourquoi signalez-vous ce membre ?', [
      ...['Pseudo inapproprié', 'Harcèlement', 'Comportement suspect'].map((reason) => ({
        text: reason,
        onPress: () => void act(() => reportMember(member.id, reason), () => Alert.alert('Merci', 'Le signalement a été transmis à l’équipe OUMMAH.')),
      })),
      { text: 'Annuler', style: 'cancel' as const },
    ]);
  };

  if (!ready) {
    return <TahajjudShell title="Mes amis" eyebrow="Communauté"><ActivityIndicator color={night.gold} /></TahajjudShell>;
  }

  if (!signedIn || !profile) {
    return (
      <TahajjudShell title="Mes amis" eyebrow="Communauté">
        <GlassCard gold style={styles.center}>
          <Ionicons name="people-circle-outline" size={52} color={night.goldSoft} />
          <Text style={styles.lead}>Se réveiller ensemble, s’encourager, sans classement ni comparaison.</Text>
          <Pressable onPress={() => router.push((signedIn ? '/tahajjud/profile' : '/profile') as Href)} style={styles.primary}>
            <Text style={styles.primaryText}>{signedIn ? 'Créer mon profil OUMMAH' : 'Se connecter'}</Text>
          </Pressable>
        </GlassCard>
      </TahajjudShell>
    );
  }

  const friends = data?.friends ?? [];
  const prayedTonight = friends.filter((friend) => friend.shared && friend.tonight === 'prayed').length;
  const awakeTonight = friends.filter((friend) => friend.shared && friend.tonight).length;

  return (
    <TahajjudShell title="Mes amis" eyebrow="Communauté">
      <View style={styles.search}>
        <Ionicons name="search" size={19} color={night.muted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Ajouter un ami par son pseudo"
          placeholderTextColor={night.muted}
          autoCapitalize="none"
          autoCorrect={false}
          style={styles.searchInput}
        />
        {query ? <Pressable onPress={() => setQuery('')} hitSlop={8}><Ionicons name="close-circle" size={19} color={night.muted} /></Pressable> : null}
      </View>

      {results ? (
        <GlassCard style={styles.block}>
          {results.length === 0 ? <Text style={styles.empty}>Aucun membre avec ce pseudo.</Text> : results.map((member, index) => (
            <View key={member.id} style={[styles.row, index > 0 && styles.rowBorder]}>
              <MemberAvatar avatar={member.avatar} size={40} />
              <Text style={styles.name} numberOfLines={1}>{member.pseudo}</Text>
              {member.relation === 'none' ? (
                <Pressable onPress={() => void add(member)} style={styles.smallGold}><Text style={styles.smallGoldText}>Ajouter</Text></Pressable>
              ) : member.relation === 'received' ? (
                <Pressable onPress={() => void add(member)} style={styles.smallGold}><Text style={styles.smallGoldText}>Accepter</Text></Pressable>
              ) : (
                <Text style={styles.tag}>{member.relation === 'friend' ? 'Ami' : 'Demande envoyée'}</Text>
              )}
            </View>
          ))}
        </GlassCard>
      ) : null}

      {friends.length ? (
        <Animated.View entering={FadeInDown.duration(450)}>
          <GlassCard gold style={styles.summary}>
            <Ionicons name="moon" size={22} color={night.goldSoft} />
            <Text style={styles.summaryText}>
              {awakeTonight
                ? `${awakeTonight} ami${awakeTonight > 1 ? 's' : ''} éveillé${awakeTonight > 1 ? 's' : ''} cette nuit${prayedTonight ? `, dont ${prayedTonight} ${prayedTonight > 1 ? 'ont' : 'a'} prié` : ''}.`
                : 'Aucun ami éveillé pour l’instant. Envoyez-leur un encouragement.'}
            </Text>
          </GlassCard>
        </Animated.View>
      ) : null}

      {data?.encouragements.length ? (
        <>
          <Text style={[shellStyles.sectionLabel, styles.section]}>Encouragements reçus</Text>
          <GlassCard style={styles.block}>
            {data.encouragements.slice(0, 6).map((item, index) => (
              <View key={item.id} style={[styles.row, index > 0 && styles.rowBorder]}>
                <MemberAvatar avatar={item.avatar} size={38} />
                <View style={styles.flex}>
                  <Text style={styles.encFrom}>{item.from}{item.unread ? <Text style={styles.newDot}>  • nouveau</Text> : null}</Text>
                  <Text style={styles.encText}>{encouragementText(item.kind)}</Text>
                </View>
                <Text style={styles.time}>{timeAgo(item.at)}</Text>
              </View>
            ))}
          </GlassCard>
        </>
      ) : null}

      {data?.received.length ? (
        <>
          <Text style={[shellStyles.sectionLabel, styles.section]}>Demandes reçues</Text>
          <GlassCard gold style={styles.block}>
            {data.received.map((member, index) => (
              <View key={member.id} style={[styles.row, index > 0 && styles.rowBorder]}>
                <MemberAvatar avatar={member.avatar} size={40} />
                <Text style={styles.name} numberOfLines={1}>{member.pseudo}</Text>
                <Pressable onPress={() => void act(() => respondFriend(member.id, false))} style={styles.smallGhost}><Text style={styles.smallGhostText}>Refuser</Text></Pressable>
                <Pressable onPress={() => void act(() => respondFriend(member.id, true))} style={styles.smallGold}><Text style={styles.smallGoldText}>Accepter</Text></Pressable>
              </View>
            ))}
          </GlassCard>
        </>
      ) : null}

      <Text style={[shellStyles.sectionLabel, styles.section]}>Mes amis{friends.length ? ` · ${friends.length}` : ''}</Text>
      {!data ? <ActivityIndicator color={night.gold} /> : friends.length === 0 ? (
        <GlassCard style={styles.center}>
          <Ionicons name="people-outline" size={36} color={night.lavender} />
          <Text style={styles.emptyTitle}>Pas encore d’amis</Text>
          <Text style={styles.emptyText}>Cherchez le pseudo d’un proche ci-dessus. Vous verrez ses nuits seulement s’il l’autorise.</Text>
        </GlassCard>
      ) : friends.map((friend, index) => {
        const status = friendStatus(friend);
        return (
          <Animated.View key={friend.id} entering={FadeInDown.delay(60 * index).duration(400)}>
            <GlassCard style={styles.friendCard}>
              <View style={styles.row}>
                <MemberAvatar avatar={friend.avatar} size={48} dim={!friend.tonight} />
                <View style={styles.flex}>
                  <Text style={styles.friendName} numberOfLines={1}>{friend.pseudo}</Text>
                  <View style={styles.statusRow}>
                    <Ionicons name={status.icon} size={15} color={status.color} />
                    <Text style={[styles.statusText, { color: status.color }]}>{status.text}</Text>
                  </View>
                </View>
                <Pressable onPress={() => friendMenu(friend)} hitSlop={10}>
                  <Ionicons name="ellipsis-horizontal" size={20} color={night.muted} />
                </Pressable>
              </View>
              <View style={styles.friendFooter}>
                {friend.shared ? (
                  <View style={styles.weekRow}>
                    {Array.from({ length: 7 }, (_, i) => (
                      <View key={i} style={[styles.weekDot, i < friend.week && styles.weekDotOn]} />
                    ))}
                    <Text style={styles.weekText}>{friend.week} nuit{friend.week > 1 ? 's' : ''} / 7 jours</Text>
                  </View>
                ) : <View style={styles.flex} />}
                <Pressable onPress={() => setEncourage(friend)} style={styles.encourageButton}>
                  <Ionicons name="heart" size={15} color={night.sky0} />
                  <Text style={styles.encourageButtonText}>Encourager</Text>
                </Pressable>
              </View>
            </GlassCard>
          </Animated.View>
        );
      })}

      {data?.sent.length ? (
        <>
          <Text style={[shellStyles.sectionLabel, styles.section]}>Demandes envoyées</Text>
          <GlassCard style={styles.block}>
            {data.sent.map((member, index) => (
              <View key={member.id} style={[styles.row, index > 0 && styles.rowBorder]}>
                <MemberAvatar avatar={member.avatar} size={36} dim />
                <Text style={styles.name} numberOfLines={1}>{member.pseudo}</Text>
                <Pressable onPress={() => void act(() => removeFriend(member.id))} style={styles.smallGhost}><Text style={styles.smallGhostText}>Annuler</Text></Pressable>
              </View>
            ))}
          </GlassCard>
        </>
      ) : null}

      {data?.blocked.length ? (
        <>
          <Pressable onPress={() => setShowBlocked((value) => !value)} style={styles.blockedToggle}>
            <Text style={styles.blockedToggleText}>Membres bloqués ({data.blocked.length})</Text>
            <Ionicons name={showBlocked ? 'chevron-up' : 'chevron-down'} size={16} color={night.muted} />
          </Pressable>
          {showBlocked ? (
            <GlassCard style={styles.block}>
              {data.blocked.map((member, index) => (
                <View key={member.id} style={[styles.row, index > 0 && styles.rowBorder]}>
                  <MemberAvatar avatar={member.avatar} size={36} dim />
                  <Text style={styles.name} numberOfLines={1}>{member.pseudo}</Text>
                  <Pressable onPress={() => void act(() => unblockMember(member.id))} style={styles.smallGhost}><Text style={styles.smallGhostText}>Débloquer</Text></Pressable>
                </View>
              ))}
            </GlassCard>
          ) : null}
        </>
      ) : null}

      <Pressable onPress={() => router.push('/tahajjud/profile' as Href)} style={styles.privacyLink}>
        <Ionicons name="shield-checkmark-outline" size={17} color={night.goldSoft} />
        <Text style={styles.privacyText}>Ce que mes amis voient · confidentialité</Text>
      </Pressable>
      <Text style={styles.footer}>Pas de classement ni de comparaison : on s’encourage, Allah seul compte les nuits.</Text>

      <EncourageSheet friend={encourage} onClose={() => setEncourage(null)} />
    </TahajjudShell>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { alignItems: 'center', gap: 12, paddingVertical: 26 },
  lead: { color: night.text, fontSize: 18, lineHeight: 25, textAlign: 'center', ...nightType.medium },
  primary: { minHeight: 52, borderRadius: 26, paddingHorizontal: 26, alignItems: 'center', justifyContent: 'center', backgroundColor: night.gold },
  primaryText: { color: night.sky0, fontSize: 17, ...nightType.bold },
  search: {
    flexDirection: 'row', alignItems: 'center', gap: 10, height: 54, borderRadius: 27, paddingHorizontal: 18,
    borderWidth: 1, borderColor: night.goldLine, backgroundColor: 'rgba(0,0,0,0.25)',
  },
  searchInput: { flex: 1, color: night.text, fontSize: 17, ...nightType.medium },
  block: { marginTop: 12, paddingVertical: 6 },
  section: { marginTop: 26 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 },
  rowBorder: { borderTopWidth: 1, borderTopColor: night.line },
  name: { flex: 1, color: night.text, fontSize: 17, ...nightType.semibold },
  tag: { color: night.muted, fontSize: 14, ...nightType.medium },
  empty: { color: night.muted, fontSize: 15, paddingVertical: 10, textAlign: 'center', ...nightType.body },
  smallGold: { paddingHorizontal: 16, paddingVertical: 9, borderRadius: 18, backgroundColor: night.gold },
  smallGoldText: { color: night.sky0, fontSize: 14, ...nightType.bold },
  smallGhost: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 18, borderWidth: 1, borderColor: night.line },
  smallGhostText: { color: night.textSoft, fontSize: 14, ...nightType.semibold },
  summary: { marginTop: 16, flexDirection: 'row', alignItems: 'center', gap: 12 },
  summaryText: { flex: 1, color: night.text, fontSize: 16, lineHeight: 22, ...nightType.semibold },
  encFrom: { color: night.goldSoft, fontSize: 15, ...nightType.bold },
  newDot: { color: night.success, fontSize: 13, ...nightType.semibold },
  encText: { marginTop: 2, color: night.text, fontSize: 16, lineHeight: 22, ...nightType.medium },
  time: { color: night.muted, fontSize: 12, ...nightType.body },
  emptyTitle: { color: night.text, fontSize: 20, ...nightType.display },
  emptyText: { color: night.textSoft, fontSize: 15, lineHeight: 21, textAlign: 'center', ...nightType.body },
  friendCard: { marginBottom: 12 },
  friendName: { color: night.text, fontSize: 19, ...nightType.semibold },
  statusRow: { marginTop: 3, flexDirection: 'row', alignItems: 'center', gap: 6 },
  statusText: { fontSize: 14, ...nightType.semibold },
  friendFooter: { marginTop: 10, flexDirection: 'row', alignItems: 'center', gap: 10 },
  weekRow: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 5 },
  weekDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: 'rgba(255,255,255,0.1)' },
  weekDotOn: { backgroundColor: night.goldSoft },
  weekText: { marginLeft: 6, color: night.muted, fontSize: 13, ...nightType.medium },
  encourageButton: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 15, paddingVertical: 9, borderRadius: 18, backgroundColor: night.goldSoft },
  encourageButtonText: { color: night.sky0, fontSize: 14, ...nightType.bold },
  blockedToggle: { marginTop: 22, flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'center' },
  blockedToggleText: { color: night.muted, fontSize: 14, ...nightType.semibold },
  privacyLink: { marginTop: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  privacyText: { color: night.goldSoft, fontSize: 15, ...nightType.semibold },
  footer: { marginTop: 12, color: night.muted, fontSize: 13, lineHeight: 18, textAlign: 'center', ...nightType.body },
  backdrop: { flex: 1, backgroundColor: 'rgba(5,3,18,0.7)', justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, overflow: 'hidden', padding: 22, paddingBottom: 34, gap: 10 },
  sheetTitle: { color: night.text, fontSize: 24, ...nightType.display },
  sheetText: { color: night.textSoft, fontSize: 15, lineHeight: 21, marginBottom: 4, ...nightType.body },
  encourageOption: {
    flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 56, paddingHorizontal: 16, borderRadius: 18,
    borderWidth: 1, borderColor: night.goldLine, backgroundColor: night.glass,
  },
  encourageText: { flex: 1, color: night.text, fontSize: 16, ...nightType.medium },
  cancel: { alignSelf: 'center', paddingVertical: 10, marginTop: 4 },
  cancelText: { color: night.muted, fontSize: 15, ...nightType.semibold },
  pressed: { opacity: 0.8 },
});
