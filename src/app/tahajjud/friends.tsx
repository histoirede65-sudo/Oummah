import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import type { Href } from 'expo-router';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { ActivityIndicator, Alert, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import ReanimatedSwipeable, { type SwipeableMethods } from 'react-native-gesture-handler/ReanimatedSwipeable';
import { scheduleOnRN } from 'react-native-worklets';
import Animated, { FadeInDown, FadeOutLeft, interpolate, LinearTransition, useAnimatedReaction, useAnimatedStyle, useSharedValue, withSpring, type SharedValue } from 'react-native-reanimated';
import { MemberAvatar } from '../../components/tahajjud/MemberAvatar';
import { GlassCard, shellStyles, TahajjudShell } from '../../components/tahajjud/TahajjudShell';
import { night, nightType } from '../../components/tahajjud/theme';
import { getCommunityProfile, isSignedIn, type CommunityProfile } from '../../features/tahajjud/tahajjudCommunity';
import { timeAgo } from '../../features/tahajjud/duaWall';
import { getGroups, type GroupSummary } from '../../features/tahajjud/tahajjudGroups';
import {
  blockMember,
  deleteConversation,
  ENCOURAGEMENTS,
  encouragementText,
  friendsErrorMessage,
  getConversations,
  getFriendsOverview,
  getOummahSummary,
  markEncouragementsRead,
  removeFriend,
  reportMember,
  requestFriend,
  respondFriend,
  searchMembers,
  sendEncouragement,
  unblockMember,
  type Conversation,
  type Friend,
  type FriendRelation,
  type FriendsOverview,
  type Member,
  type OummahSummary,
  OUMMAH_CONVERSATION,
} from '../../features/tahajjud/tahajjudFriends';
import { tx, txCount } from '../../features/tahajjud/tahajjudI18n';

type SearchResult = Member & { relation: FriendRelation };

const ACTION_WIDTH = 104;
const tick = () => void Haptics.selectionAsync().catch(() => undefined);

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/** A card that sinks a little under the finger and springs back. */
function SpringCard({ style, children, ...props }: { style: (object | false)[]; children: ReactNode; onPress: () => void; accessibilityLabel: string }) {
  const scale = useSharedValue(1);
  const animated = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <AnimatedPressable
      {...props}
      accessibilityRole="button"
      onPressIn={() => { scale.value = withSpring(0.975, { damping: 18, stiffness: 320 }); }}
      onPressOut={() => { scale.value = withSpring(1, { damping: 14, stiffness: 220 }); }}
      style={[...style, animated]}
    >
      {children}
    </AnimatedPressable>
  );
}
// Dragged at least this far (px) and released: deleted without tapping the button.
const FULL_SWIPE = 200;

/** Red « Supprimer » revealed by swiping left; it stretches with the finger, WhatsApp-like. */
function DeleteAction({ progress, translation, onPress }: {
  progress: SharedValue<number>;
  translation: SharedValue<number>;
  onPress: () => void;
}) {
  // A tick when the drag reaches the point where releasing deletes (and back).
  useAnimatedReaction(
    () => -translation.value > FULL_SWIPE,
    (full, previous) => {
      if (previous !== null && full !== previous) scheduleOnRN(tick);
    },
  );
  const container = useAnimatedStyle(() => ({ width: Math.max(ACTION_WIDTH, -translation.value) }));
  const content = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.4, 1], [0, 0.6, 1], 'clamp'),
    transform: [{ scale: -translation.value > FULL_SWIPE ? 1.15 : interpolate(progress.value, [0, 1], [0.6, 1], 'clamp') }],
  }));
  return (
    <Animated.View style={[styles.swipeAction, container]}>
      <Pressable onPress={onPress} style={styles.swipeActionPress}>
        <Animated.View style={[styles.swipeActionInner, content]}>
          <Ionicons name="trash" size={22} color="#FFFFFF" />
          <Text style={styles.swipeActionText}>{tx('Supprimer')}</Text>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

/** Swipe left: the button appears; dragged to the end or button tapped, it is deleted (no question). */
function SwipeToDelete({ enabled, onDelete, children }: { enabled: boolean; onDelete: () => void; children: ReactNode }) {
  const ref = useRef<SwipeableMethods>(null);
  const translationRef = useRef<SharedValue<number> | null>(null);
  if (!enabled) return <>{children}</>;
  const remove = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => undefined);
    ref.current?.reset();
    onDelete();
  };
  return (
    <ReanimatedSwipeable
      ref={ref}
      friction={1.2}
      dragOffsetFromRight={12}
      animationOptions={{ damping: 22, stiffness: 240, mass: 0.9 }}
      rightThreshold={50}
      overshootRight
      overshootFriction={1}
      onSwipeableWillOpen={() => {
        if ((translationRef.current?.value ?? 0) < -FULL_SWIPE) remove();
      }}
      renderRightActions={(progress, translation) => {
        translationRef.current = translation;
        return <DeleteAction progress={progress} translation={translation} onPress={remove} />;
      }}
    >
      {children}
    </ReanimatedSwipeable>
  );
}

function friendStatus(friend: Friend) {
  if (!friend.shared) return { icon: 'lock-closed-outline' as const, text: tx('Activité privée'), color: night.muted };
  if (friend.tonight === 'prayed') return { icon: 'checkmark-circle' as const, text: tx('A prié cette nuit'), color: night.success };
  if (friend.tonight === 'awake') return { icon: 'sunny' as const, text: tx('Réveillé pour prier'), color: night.goldSoft };
  return null;
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
      Alert.alert(tx('Encouragement envoyé'), tx("{0} va recevoir votre message. Qu’Allah vous récompense.", [friend.pseudo]));
    } catch (error) {
      Alert.alert(tx('Encourager'), friendsErrorMessage(error));
    } finally {
      setSending(null);
    }
  };
  return (
    <Modal visible={Boolean(friend)} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={() => undefined}>
          <LinearGradient colors={['#291A3E', '#160E21']} style={StyleSheet.absoluteFill} />
          <Text style={styles.sheetTitle}>{tx("Encourager ")}{friend?.pseudo}</Text>
          <Text style={styles.sheetText}>{tx("Choisissez un message. Votre ami le reçoit en notification.")}</Text>
          {ENCOURAGEMENTS.map((item) => (
            <Pressable key={item.kind} disabled={Boolean(sending)} onPress={() => void send(item.kind)} style={({ pressed }) => [styles.encourageOption, pressed && styles.pressed]}>
              <Ionicons name={item.icon} size={20} color={night.goldSoft} />
              <Text style={styles.encourageText}>{item.text}</Text>
              {sending === item.kind ? <ActivityIndicator color={night.gold} /> : null}
            </Pressable>
          ))}
          <Pressable onPress={onClose} style={styles.cancel}><Text style={styles.cancelText}>{tx("Annuler")}</Text></Pressable>
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
  const [conversations, setConversations] = useState<Record<string, Conversation>>({});
  const [groups, setGroups] = useState<GroupSummary[]>([]);
  const [oummah, setOummah] = useState<OummahSummary | null>(null);
  const searchSeq = useRef(0);

  const load = useCallback(async () => {
    void getOummahSummary().then(setOummah).catch(() => undefined);
    try {
      const [overview, threads, myGroups] = await Promise.all([
        getFriendsOverview(),
        getConversations().catch(() => []),
        getGroups().catch(() => null),
      ]);
      setData(overview);
      if (myGroups) setGroups(myGroups);
      setConversations(Object.fromEntries(threads.map((thread) => [thread.userId, thread])));
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
      Alert.alert(tx('Amis'), friendsErrorMessage(error));
    }
  };

  const add = (member: SearchResult) => act(async () => {
    const relation = await requestFriend(member.id);
    setResults((list) => list?.map((item) => (item.id === member.id ? { ...item, relation } : item)) ?? null);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
  });

  const confirmDeleteConversation = (id: string, name: string, onCancel?: () => void) => {
    Alert.alert(
      tx("Supprimer la conversation avec {0} ?", [name]),
      tx('Les messages disparaissent de votre téléphone seulement. Un nouveau message fera réapparaître la conversation.'),
      [
        { text: tx('Annuler'), style: 'cancel', onPress: onCancel },
        { text: tx('Supprimer'), style: 'destructive', onPress: () => void act(() => deleteConversation(id)) },
      ],
      { cancelable: true, onDismiss: onCancel },
    );
  };

  // From a swipe: no question, the gesture is the confirmation. Hidden at once, then saved.
  const swipeDelete = (id: string) => {
    if (id === OUMMAH_CONVERSATION) setOummah(null);
    else setConversations((current) => Object.fromEntries(Object.entries(current).filter(([key]) => key !== id)));
    void act(() => deleteConversation(id));
  };

  const friendMenu = (friend: Friend) => {
    Alert.alert(friend.pseudo, undefined, [
      ...(conversations[friend.id] ? [{ text: tx('Supprimer la conversation'), style: 'destructive' as const, onPress: () => confirmDeleteConversation(friend.id, friend.pseudo) }] : []),
      { text: tx('Retirer de mes amis'), onPress: () => void act(() => removeFriend(friend.id)) },
      {
        text: tx('Bloquer'), style: 'destructive', onPress: () => Alert.alert(
          tx("Bloquer {0} ?", [friend.pseudo]),
          tx('Il ne pourra plus vous trouver, vous écrire ni vous encourager. Vous pourrez le débloquer plus tard.'),
          [{ text: tx('Annuler'), style: 'cancel' }, { text: tx('Bloquer'), style: 'destructive', onPress: () => void act(() => blockMember(friend.id)) }],
        ),
      },
      { text: tx('Signaler'), onPress: () => reportFlow(friend) },
      { text: tx('Annuler'), style: 'cancel' },
    ]);
  };

  const reportFlow = (member: Member) => {
    Alert.alert(tx("Signaler {0}", [member.pseudo]), tx('Pourquoi signalez-vous ce membre ?'), [
      ...[tx('Pseudo inapproprié'), tx('Harcèlement'), tx('Comportement suspect')].map((reason) => ({
        text: reason,
        onPress: () => void act(() => reportMember(member.id, reason), () => Alert.alert(tx('Merci'), tx('Le signalement a été transmis à l’équipe OUMMAH.'))),
      })),
      { text: tx('Annuler'), style: 'cancel' as const },
    ]);
  };

  if (!ready) {
    return <TahajjudShell title={tx("Mes amis")} eyebrow={tx("Communauté")}><ActivityIndicator color={night.gold} /></TahajjudShell>;
  }

  if (!signedIn || !profile) {
    return (
      <TahajjudShell title={tx("Mes amis")} eyebrow={tx("Communauté")}>
        <GlassCard gold style={styles.center}>
          <Ionicons name="people-circle-outline" size={52} color={night.goldSoft} />
          <Text style={styles.lead}>{tx("Se réveiller ensemble, s’encourager, sans classement ni comparaison.")}</Text>
          <Pressable onPress={() => router.push((signedIn ? '/tahajjud/profile' : '/profile') as Href)} style={styles.primary}>
            <Text style={styles.primaryText}>{signedIn ? tx('Créer mon profil OUMMAH') : tx('Se connecter')}</Text>
          </Pressable>
        </GlassCard>
      </TahajjudShell>
    );
  }

  // Most recent message first; friends without a conversation after.
  const friends = [...(data?.friends ?? [])].sort((a, b) => {
    const ca = conversations[a.id];
    const cb = conversations[b.id];
    return (cb ? Date.parse(cb.lastAt) : 0) - (ca ? Date.parse(ca.lastAt) : 0);
  });
  // OUMMAH among the conversations: the most recent message first.
  const oummahIndex = oummah
    ? friends.findIndex((friend) => !conversations[friend.id] || Date.parse(conversations[friend.id].lastAt) < Date.parse(oummah.lastAt))
    : -1;
  const oummahCard = oummah ? (
        <Animated.View exiting={FadeOutLeft.duration(260)} layout={LinearTransition} style={styles.oummahWrap}>
        <SwipeToDelete enabled onDelete={() => swipeDelete(OUMMAH_CONVERSATION)}>
        <Pressable
          onPress={() => router.push('/tahajjud/oummah' as Href)}
          onLongPress={() => confirmDeleteConversation(OUMMAH_CONVERSATION, 'OUMMAH')}
          style={({ pressed }) => [pressed && styles.pressed]}>
          <GlassCard gold style={styles.oummahCard}>
            <View style={styles.row}>
              <View style={styles.oummahIcon}><Ionicons name="moon" size={20} color={night.sky0} /></View>
              <View style={styles.flex}>
                <Text style={styles.name}>OUMMAH</Text>
                <Text style={[styles.groupLast, oummah.unread > 0 && styles.lastMessageUnread]} numberOfLines={1}>{oummah.lastBody}</Text>
              </View>
              <View style={styles.groupSide}>
                <Pressable onPress={() => confirmDeleteConversation(OUMMAH_CONVERSATION, 'OUMMAH')} hitSlop={10}>
                  <Ionicons name="ellipsis-horizontal" size={18} color={night.muted} />
                </Pressable>
                <Text style={styles.time}>{timeAgo(oummah.lastAt)}</Text>
                {oummah.unread ? (
                  <View style={styles.badgeInline}><Text style={styles.badgeText}>{oummah.unread > 9 ? '9+' : oummah.unread}</Text></View>
                ) : null}
              </View>
            </View>
          </GlassCard>
        </Pressable>
        </SwipeToDelete>
        </Animated.View>
  ) : null;
  const openChat = (friend: Friend) => router.push({ pathname: '/tahajjud/chat', params: { id: friend.id, pseudo: friend.pseudo, avatar: friend.avatar } } as unknown as Href);
  const prayedTonight = friends.filter((friend) => friend.shared && friend.tonight === 'prayed').length;
  const awakeTonight = friends.filter((friend) => friend.shared && friend.tonight).length;

  return (
    <TahajjudShell title={tx("Mes amis")} eyebrow={tx("Communauté")}>
      <View style={styles.search}>
        <Ionicons name="search" size={19} color={night.muted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder={tx("Rechercher un pseudo")}
          placeholderTextColor={night.placeholder}
          autoCapitalize="none"
          autoCorrect={false}
          style={styles.searchInput}
        />
        {query ? <Pressable onPress={() => setQuery('')} hitSlop={8}><Ionicons name="close-circle" size={19} color={night.muted} /></Pressable> : null}
      </View>

      {results ? (
        <GlassCard style={styles.block}>
          {results.length === 0 ? <Text style={styles.empty}>{tx("Aucun membre avec ce pseudo.")}</Text> : results.map((member, index) => (
            <View key={member.id} style={[styles.row, index > 0 && styles.rowBorder]}>
              <MemberAvatar avatar={member.avatar} size={40} />
              <Text style={styles.name} numberOfLines={1}>{member.pseudo}</Text>
              {member.relation === 'none' ? (
                <Pressable onPress={() => void add(member)} style={styles.smallGold}><Text style={styles.smallGoldText}>{tx("Ajouter")}</Text></Pressable>
              ) : member.relation === 'received' ? (
                <Pressable onPress={() => void add(member)} style={styles.smallGold}><Text style={styles.smallGoldText}>{tx("Accepter")}</Text></Pressable>
              ) : (
                <Text style={styles.tag}>{member.relation === 'friend' ? tx('Ami') : tx('Demande envoyée')}</Text>
              )}
            </View>
          ))}
        </GlassCard>
      ) : null}

      {friends.length === 0 ? oummahCard : null}

      {friends.length ? (
        <Animated.View entering={FadeInDown.duration(450)}>
          <GlassCard gold style={styles.summary}>
            <Ionicons name="moon" size={22} color={night.goldSoft} />
            <Text style={styles.summaryText}>
              {awakeTonight
                ? `${txCount(awakeTonight, '{0} ami éveillé cette nuit', '{0} amis éveillés cette nuit')}${prayedTonight ? txCount(prayedTonight, ', dont {0} a prié', ', dont {0} ont prié') : ''}.`
                : tx('Aucun ami éveillé pour l’instant. Envoyez-leur un encouragement.')}
            </Text>
          </GlassCard>
        </Animated.View>
      ) : null}

      <View style={[styles.sectionHead, styles.section]}>
        <Text style={[shellStyles.sectionLabel, styles.noMargin]}>{tx("Mes groupes")}{groups.length ? ` · ${groups.length}` : ''}</Text>
        <Pressable onPress={() => router.push('/tahajjud/group-new' as Href)} style={styles.newGroup}>
          <Ionicons name="add" size={17} color={night.sky0} />
          <Text style={styles.newGroupText}>{tx("Créer")}</Text>
        </Pressable>
      </View>
      {groups.length === 0 ? (
        <Pressable onPress={() => router.push('/tahajjud/group-new' as Href)}>
          <GlassCard style={styles.groupEmpty}>
            <Ionicons name="people-circle-outline" size={24} color={night.lavender} />
            <Text style={styles.groupEmptyText}>{tx("Échangez avec vos amis et programmez vos rappels.")}</Text>
          </GlassCard>
        </Pressable>
      ) : (
        <GlassCard style={styles.block}>
          {groups.map((group, index) => (
            <Pressable
              key={group.id}
              onPress={() => router.push({ pathname: '/tahajjud/group', params: { id: group.id, name: group.name } } as unknown as Href)}
              style={[styles.row, index > 0 && styles.rowBorder]}
            >
              <View style={styles.groupIcon}><Ionicons name="people" size={19} color={night.sky0} /></View>
              <View style={styles.flex}>
                <View style={styles.groupTitleRow}>
                  <Text style={styles.name} numberOfLines={1}>{group.name}</Text>
                  {group.muted ? <Ionicons name="notifications-off-outline" size={14} color={night.muted} /> : null}
                </View>
                <Text style={[styles.groupLast, group.unread > 0 && styles.lastMessageUnread]} numberOfLines={1}>
                  {group.lastKind === 'reminder' ? '⏰ ' : ''}
                  {group.lastKind === 'text' && group.lastSender ? `${group.lastSender} : ` : ''}
                  {group.lastBody ?? txCount(group.members, '{0} membre', '{0} membres')}
                </Text>
              </View>
              <View style={styles.groupSide}>
                <Text style={styles.time}>{timeAgo(group.lastAt)}</Text>
                {group.unread ? (
                  <View style={styles.badgeInline}><Text style={styles.badgeText}>{group.unread > 9 ? '9+' : group.unread}</Text></View>
                ) : null}
              </View>
            </Pressable>
          ))}
        </GlassCard>
      )}

      {data?.encouragements.length ? (
        <>
          <Text style={[shellStyles.sectionLabel, styles.section]}>{tx("Encouragements reçus")}</Text>
          <GlassCard style={styles.block}>
            {data.encouragements.slice(0, 6).map((item, index) => (
              <View key={item.id} style={[styles.row, index > 0 && styles.rowBorder]}>
                <MemberAvatar avatar={item.avatar} size={38} />
                <View style={styles.flex}>
                  <Text style={styles.encFrom}>{item.from}{item.unread ? <Text style={styles.newDot}>  {tx("• nouveau")}</Text> : null}</Text>
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
          <Text style={[shellStyles.sectionLabel, styles.section]}>{tx("Demandes reçues")}</Text>
          <GlassCard gold style={styles.block}>
            {data.received.map((member, index) => (
              <View key={member.id} style={[styles.row, index > 0 && styles.rowBorder]}>
                <MemberAvatar avatar={member.avatar} size={40} />
                <Text style={styles.name} numberOfLines={1}>{member.pseudo}</Text>
                <Pressable onPress={() => void act(() => respondFriend(member.id, false))} style={styles.smallGhost}><Text style={styles.smallGhostText}>{tx("Refuser")}</Text></Pressable>
                <Pressable onPress={() => void act(() => respondFriend(member.id, true))} style={styles.smallGold}><Text style={styles.smallGoldText}>{tx("Accepter")}</Text></Pressable>
              </View>
            ))}
          </GlassCard>
        </>
      ) : null}

      <Text style={[shellStyles.sectionLabel, styles.section]}>{tx("Mes amis")}{friends.length ? ` · ${friends.length}` : ''}</Text>
      {!data ? <ActivityIndicator color={night.gold} /> : friends.length === 0 ? (
        <GlassCard style={styles.center}>
          <Ionicons name="people-outline" size={36} color={night.lavender} />
          <Text style={styles.emptyTitle}>{tx("Pas encore d’amis")}</Text>
          <Text style={styles.emptyText}>{tx("Cherchez le pseudo d’un proche ci-dessus. Vous verrez ses nuits seulement s’il l’autorise.")}</Text>
        </GlassCard>
      ) : friends.map((friend, index) => {
        const status = friendStatus(friend);
        const thread = conversations[friend.id];
        const unread = Boolean(thread?.unread);
        return (
          <View key={friend.id}>
          {index === oummahIndex ? oummahCard : null}
          <Animated.View entering={FadeInDown.delay(60 * index).duration(400)} layout={LinearTransition} style={styles.friendWrap}>
            <SwipeToDelete enabled={Boolean(thread)} onDelete={() => swipeDelete(friend.id)}>
            <SpringCard
              onPress={() => openChat(friend)}
              accessibilityLabel={friend.pseudo}
              style={[styles.friendCard, unread && styles.friendCardUnread]}
            >
              <LinearGradient
                colors={unread ? ['#4A3A2A', '#2A2050', '#1A1128'] : ['#2B2254', '#201531', '#170F23']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
              <View style={styles.friendCardSheen} />
              <View style={styles.row}>
                <View style={styles.friendAvatarRing}>
                  <MemberAvatar avatar={friend.avatar} size={48} dim={!friend.tonight} />
                  {unread ? <View style={styles.unreadDot} /> : null}
                </View>
                <View style={styles.flex}>
                  <View style={styles.nameRow}>
                    <Text style={[styles.friendName, styles.flexShrink]} numberOfLines={1}>{friend.pseudo}</Text>
                    {unread ? <Text style={styles.newLabel}>{tx('Nouveau message')}</Text> : null}
                  </View>
                  {status ? (
                    <View style={styles.statusRow}>
                      <Ionicons name={status.icon} size={15} color={status.color} />
                      <Text style={[styles.statusText, { color: status.color }]}>{status.text}</Text>
                    </View>
                  ) : null}
                </View>
                <Pressable onPress={() => friendMenu(friend)} hitSlop={10}>
                  <Ionicons name="ellipsis-horizontal" size={20} color={night.muted} />
                </Pressable>
              </View>
              {thread ? (
                <View style={styles.lastMessage}>
                  <Text style={[styles.lastMessageText, thread.unread > 0 && styles.lastMessageUnread]} numberOfLines={1}>
                    {thread.lastMine ? tx('Vous : ') : ''}{thread.lastBody}
                  </Text>
                  <Text style={styles.time}>{timeAgo(thread.lastAt)}</Text>
                </View>
              ) : null}
              <View style={styles.friendFooter}>
                <View style={styles.messageButton}>
                  <Ionicons name="chatbubble-ellipses" size={15} color={night.goldSoft} />
                  <Text style={styles.messageButtonText}>{tx("Message")}</Text>
                  {thread?.unread ? (
                    <View style={styles.badge}><Text style={styles.badgeText}>{thread.unread > 9 ? '9+' : thread.unread}</Text></View>
                  ) : null}
                </View>
                <Pressable onPress={() => setEncourage(friend)} style={styles.encourageButton}>
                  <Ionicons name="heart" size={15} color={night.sky0} />
                  <Text style={styles.encourageButtonText}>{tx("Encourager")}</Text>
                </Pressable>
              </View>
            </SpringCard>
            </SwipeToDelete>
          </Animated.View>
          </View>
        );
      })}
      {friends.length && oummahIndex === -1 ? oummahCard : null}

      {data?.sent.length ? (
        <>
          <Text style={[shellStyles.sectionLabel, styles.section]}>{tx("Demandes envoyées")}</Text>
          <GlassCard style={styles.block}>
            {data.sent.map((member, index) => (
              <View key={member.id} style={[styles.row, index > 0 && styles.rowBorder]}>
                <MemberAvatar avatar={member.avatar} size={36} dim />
                <Text style={styles.name} numberOfLines={1}>{member.pseudo}</Text>
                <Pressable onPress={() => void act(() => removeFriend(member.id))} style={styles.smallGhost}><Text style={styles.smallGhostText}>{tx("Annuler")}</Text></Pressable>
              </View>
            ))}
          </GlassCard>
        </>
      ) : null}

      {data?.blocked.length ? (
        <>
          <Pressable onPress={() => setShowBlocked((value) => !value)} style={styles.blockedToggle}>
            <Text style={styles.blockedToggleText}>{tx("Membres bloqués (")}{data.blocked.length})</Text>
            <Ionicons name={showBlocked ? 'chevron-up' : 'chevron-down'} size={16} color={night.muted} />
          </Pressable>
          {showBlocked ? (
            <GlassCard style={styles.block}>
              {data.blocked.map((member, index) => (
                <View key={member.id} style={[styles.row, index > 0 && styles.rowBorder]}>
                  <MemberAvatar avatar={member.avatar} size={36} dim />
                  <Text style={styles.name} numberOfLines={1}>{member.pseudo}</Text>
                  <Pressable onPress={() => void act(() => unblockMember(member.id))} style={styles.smallGhost}><Text style={styles.smallGhostText}>{tx("Débloquer")}</Text></Pressable>
                </View>
              ))}
            </GlassCard>
          ) : null}
        </>
      ) : null}

      <Pressable onPress={() => router.push('/tahajjud/profile' as Href)} style={styles.privacyLink}>
        <Ionicons name="shield-checkmark-outline" size={17} color={night.goldSoft} />
        <Text style={styles.privacyText}>{tx("Ce que mes amis voient · confidentialité")}</Text>
      </Pressable>
      <Text style={styles.footer}>{tx("Encourageons-nous avec bienveillance, sans classement ni compétition.")}</Text>

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
    borderWidth: 1, borderColor: night.goldLine, backgroundColor: '#0E0915',
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
  friendWrap: { marginBottom: 14 },
  oummahWrap: { marginTop: 4, marginBottom: 14 },
  friendCard: {
    padding: 18, borderRadius: 24, overflow: 'hidden',
    borderWidth: 1, borderColor: 'rgba(227,181,90,0.28)',
    shadowColor: '#000', shadowOpacity: 0.45, shadowRadius: 16, shadowOffset: { width: 0, height: 8 }, elevation: 8,
  },
  friendCardUnread: { borderColor: night.gold, borderWidth: 1.5 },
  unreadDot: {
    position: 'absolute', top: 0, right: 0, width: 14, height: 14, borderRadius: 7,
    backgroundColor: '#FF4D5E', borderWidth: 2, borderColor: '#201531',
  },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  flexShrink: { flexShrink: 1 },
  newLabel: {
    overflow: 'hidden', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10,
    backgroundColor: '#FF4D5E', color: '#FFFFFF', fontSize: 11, ...nightType.bold,
  },
  friendCardSheen: { position: 'absolute', top: 0, left: 24, right: 24, height: 1, backgroundColor: 'rgba(244,217,149,0.45)' },
  friendAvatarRing: { padding: 2, borderRadius: 30, borderWidth: 1, borderColor: 'rgba(244,217,149,0.4)' },
  friendName: { color: night.text, fontSize: 22, ...nightType.display },
  statusRow: { marginTop: 3, flexDirection: 'row', alignItems: 'center', gap: 6 },
  statusText: { fontSize: 14, ...nightType.semibold },
  friendFooter: { marginTop: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 10 },
  sectionHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  noMargin: { marginBottom: 0 },
  newGroup: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 16, backgroundColor: night.gold },
  newGroupText: { color: night.sky0, fontSize: 14, ...nightType.bold },
  groupEmpty: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  groupEmptyText: { flex: 1, color: night.textSoft, fontSize: 15, lineHeight: 21, ...nightType.body },
  oummahCard: { paddingVertical: 8 },
  swipeAction: { marginLeft: 10, borderRadius: 24, backgroundColor: '#E5484D', overflow: 'hidden' },
  swipeActionPress: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  swipeActionInner: { alignItems: 'center', gap: 4 },
  swipeActionText: { color: '#FFFFFF', fontSize: 13, ...nightType.bold },
  oummahIcon: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: night.gold },
  groupIcon: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: night.lavender },
  groupTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  groupLast: { marginTop: 2, color: night.muted, fontSize: 14, ...nightType.medium },
  groupSide: { alignItems: 'flex-end', gap: 5 },
  badgeInline: { minWidth: 20, height: 20, borderRadius: 10, paddingHorizontal: 5, alignItems: 'center', justifyContent: 'center', backgroundColor: night.success },
  messageButton: { flexDirection: 'row', gap: 6, paddingHorizontal: 15, paddingVertical: 9, borderRadius: 18, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: night.goldLine },
  messageButtonText: { color: night.goldSoft, fontSize: 14, ...nightType.semibold },
  badge: {
    position: 'absolute', top: -6, right: -6, minWidth: 20, height: 20, borderRadius: 10, paddingHorizontal: 5,
    alignItems: 'center', justifyContent: 'center', backgroundColor: night.success,
  },
  badgeText: { color: night.sky0, fontSize: 11, ...nightType.bold },
  lastMessage: { marginTop: 10, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 9, borderRadius: 14, backgroundColor: 'rgba(15,9,22,0.55)', borderWidth: 1, borderColor: 'rgba(201,163,219,0.12)' },
  lastMessageText: { flex: 1, color: night.muted, fontSize: 14, ...nightType.medium },
  lastMessageUnread: { color: night.text, ...nightType.bold },
  encourageButton: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 15, paddingVertical: 9, borderRadius: 18, backgroundColor: night.goldSoft },
  encourageButtonText: { color: night.sky0, fontSize: 14, ...nightType.bold },
  blockedToggle: { marginTop: 22, flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'center' },
  blockedToggleText: { color: night.muted, fontSize: 14, ...nightType.semibold },
  privacyLink: { marginTop: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  privacyText: { color: night.goldSoft, fontSize: 15, ...nightType.semibold },
  footer: { marginTop: 12, color: night.muted, fontSize: 13, lineHeight: 18, textAlign: 'center', ...nightType.body },
  backdrop: { flex: 1, backgroundColor: 'rgba(11,7,16,0.7)', justifyContent: 'flex-end' },
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
