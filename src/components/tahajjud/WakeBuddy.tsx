import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { getCommunityProfile, isSignedIn } from '../../features/tahajjud/tahajjudCommunity';
import { getFriendsOverview, type Member } from '../../features/tahajjud/tahajjudFriends';
import { getGroups, type GroupSummary } from '../../features/tahajjud/tahajjudGroups';
import { clock, type NightPhase } from '../../features/tahajjud/tahajjudNight';
import {
  cancelWakeRequest,
  getMyWakeRequest,
  getWakeRequestsForMe,
  requestWakeUp,
  sendWakeUp,
  wakeErrorMessage,
  type MyWakeRequest,
  type WakeRequestForMe,
} from '../../features/tahajjud/tahajjudWakeBuddy';
import { FriendPicker } from './FriendPicker';
import { MemberAvatar } from './MemberAvatar';
import { GlassCard, shellStyles } from './TahajjudShell';
import { night, nightType } from './theme';
import { tx, txCount } from '../../features/tahajjud/tahajjudI18n';

/** People who asked me to wake them tonight, with a « Réveiller » button each. */
export function WakeOthers({ requests, onChanged, compact = false }: {
  requests: WakeRequestForMe[];
  onChanged: () => void;
  compact?: boolean;
}) {
  const [sending, setSending] = useState<string | null>(null);
  if (!requests.length) return null;

  const wake = async (request: WakeRequestForMe) => {
    setSending(request.id);
    try {
      const already = await sendWakeUp(request.id);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
      if (already) Alert.alert(tx('Déjà réveillé'), tx("{0} a réveillé {1} avant vous. Barak Allahou fik.", [already, request.pseudo]));
      onChanged();
    } catch (error) {
      Alert.alert(tx('Réveiller'), wakeErrorMessage(error));
    } finally {
      setSending(null);
    }
  };

  return (
    <GlassCard gold style={compact ? styles.othersCompact : styles.others}>
      <View style={styles.othersHead}>
        <Ionicons name="people" size={17} color={night.goldSoft} />
        <Text style={styles.othersTitle}>{tx("Ils comptent sur vous cette nuit")}</Text>
      </View>
      {requests.map((request) => (
        <View key={request.id} style={styles.row}>
          <MemberAvatar avatar={request.avatar} size={38} dim={request.woken} />
          <View style={styles.flex}>
            <Text style={styles.name} numberOfLines={1}>{request.pseudo}</Text>
            <Text style={styles.sub}>
              {request.woken ? (request.wokenByMe ? tx('Réveillé par vous 🤍') : tx('Déjà réveillé')) : request.wakeAt ? tx("Souhaite se lever vers {0}", [clock(Date.parse(request.wakeAt))]) : tx('Souhaite se lever pour prier')}
            </Text>
          </View>
          {request.woken ? (
            <Ionicons name="checkmark-circle" size={24} color={night.success} />
          ) : (
            <Pressable onPress={() => void wake(request)} disabled={sending === request.id} style={styles.wakeButton}>
              {sending === request.id ? <ActivityIndicator color={night.sky0} /> : (
                <>
                  <Ionicons name="sunny" size={15} color={night.sky0} />
                  <Text style={styles.wakeText}>{tx("Réveiller")}</Text>
                </>
              )}
            </Pressable>
          )}
        </View>
      ))}
    </GlassCard>
  );
}

function AskSheet({ visible, onClose, onSend }: {
  visible: boolean;
  onClose: () => void;
  onSend: (users: string[], group: string | null) => Promise<void>;
}) {
  const [friends, setFriends] = useState<Member[] | null>(null);
  const [groups, setGroups] = useState<GroupSummary[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [group, setGroup] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!visible) return;
    void getFriendsOverview().then((data) => setFriends(data.friends)).catch(() => setFriends([]));
    void getGroups().then(setGroups).catch(() => undefined);
  }, [visible]);

  const send = async () => {
    if (sending || (!selected.size && !group)) return;
    setSending(true);
    try {
      await onSend([...selected], group);
    } finally {
      setSending(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={() => undefined}>
          <LinearGradient colors={['#1C1546', '#0E0A26']} style={StyleSheet.absoluteFill} />
          <Text style={styles.sheetTitle}>{tx("Qui peut vous réveiller ?")}</Text>
          <Text style={styles.sheetText}>{tx("Ils reçoivent une notification. Le premier debout vous réveille avec le son OUMMAH.")}</Text>
          <ScrollView style={styles.sheetList} showsVerticalScrollIndicator={false}>
            {groups.length ? (
              <>
                <Text style={shellStyles.sectionLabel}>{tx("Un groupe")}</Text>
                <View style={styles.groups}>
                  {groups.map((item) => (
                    <Pressable key={item.id} onPress={() => setGroup(group === item.id ? null : item.id)} style={[styles.groupChip, group === item.id && styles.groupChipOn]}>
                      <Ionicons name="people" size={14} color={group === item.id ? night.sky0 : night.goldSoft} />
                      <Text style={[styles.groupText, group === item.id && styles.groupTextOn]}>{item.name}</Text>
                    </Pressable>
                  ))}
                </View>
              </>
            ) : null}
            <Text style={[shellStyles.sectionLabel, styles.section]}>{tx("Des amis")}</Text>
            {friends === null ? <ActivityIndicator color={night.gold} /> : (
              <FriendPicker
                friends={friends}
                selected={selected}
                onToggle={(id) => setSelected((current) => {
                  const next = new Set(current);
                  if (next.has(id)) next.delete(id); else next.add(id);
                  return next;
                })}
                emptyText={tx("Ajoutez d’abord des amis OUMMAH dans « Amis ».")}
              />
            )}
          </ScrollView>
          <Pressable disabled={sending || (!selected.size && !group)} onPress={() => void send()} style={[styles.primary, (sending || (!selected.size && !group)) && styles.disabled]}>
            <Text style={styles.primaryText}>{sending ? tx('Envoi…') : tx('Demander à être réveillé')}</Text>
          </Pressable>
          <Pressable onPress={onClose} style={styles.cancel}><Text style={styles.cancelText}>{tx("Annuler")}</Text></Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

/** « Binôme de réveil » card of the Qiyam screen. */
export function WakeBuddyCard({ phase, nightKey, wakeAt, validated }: {
  phase: NightPhase;
  nightKey: string;
  wakeAt: number | null;
  validated: boolean;
}) {
  const [ready, setReady] = useState(false);
  const [mine, setMine] = useState<MyWakeRequest | null>(null);
  const [forMe, setForMe] = useState<WakeRequestForMe[]>([]);
  const [sheet, setSheet] = useState(false);

  const load = useCallback(async () => {
    if (!(await isSignedIn()) || !(await getCommunityProfile())) {
      setReady(false);
      return;
    }
    const [request, requests] = await Promise.all([
      getMyWakeRequest(nightKey).catch(() => null),
      getWakeRequestsForMe().catch(() => []),
    ]);
    setMine(request);
    setForMe(requests);
    setReady(true);
  }, [nightKey]);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  if (!ready) return null;
  const nightOn = phase !== 'day';

  const ask = async (users: string[], group: string | null) => {
    try {
      const count = await requestWakeUp(nightKey, users, group, wakeAt ? new Date(wakeAt) : null);
      setSheet(false);
      Alert.alert(tx('Demande envoyée'), txCount(count, '{0} ami prévenu. Le premier debout vous réveillera.', '{0} amis prévenus. Le premier debout vous réveillera.'));
      await load();
    } catch (error) {
      Alert.alert(tx('Binôme de réveil'), wakeErrorMessage(error));
    }
  };

  return (
    <View style={styles.wrap}>
      <WakeOthers requests={forMe} onChanged={() => void load()} />

      {nightOn && !validated ? (
        mine ? (
          <GlassCard style={styles.mine}>
            <Ionicons name={mine.wokenBy ? 'sunny' : 'notifications-outline'} size={20} color={night.goldSoft} />
            <View style={styles.flex}>
              <Text style={styles.name}>
                {mine.wokenBy ? tx("{0} vous a réveillé", [mine.wokenBy]) : txCount(mine.targets, '{0} ami prêt à vous réveiller', '{0} amis prêts à vous réveiller')}
              </Text>
              <Text style={styles.sub}>{mine.wokenBy && mine.wokenAt ? tx("à {0} · qu’Allah le récompense", [clock(Date.parse(mine.wokenAt))]) : tx('Binôme de réveil')}</Text>
            </View>
            {!mine.wokenBy ? (
              <Pressable onPress={() => void cancelWakeRequest(nightKey).then(load)} hitSlop={8}>
                <Text style={styles.cancelLink}>{tx("Annuler")}</Text>
              </Pressable>
            ) : null}
          </GlassCard>
        ) : (
          <Pressable onPress={() => setSheet(true)} style={({ pressed }) => [pressed && styles.pressed]}>
            <GlassCard style={styles.mine}>
              <View style={styles.icon}><Ionicons name="people-outline" size={19} color={night.goldSoft} /></View>
              <View style={styles.flex}>
                <Text style={styles.name}>{tx("Binôme de réveil")}</Text>
                <Text style={styles.sub}>{tx("Demandez à un ami ou à un groupe de vous réveiller cette nuit.")}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={night.muted} />
            </GlassCard>
          </Pressable>
        )
      ) : null}

      <AskSheet visible={sheet} onClose={() => setSheet(false)} onSend={ask} />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  wrap: { marginTop: 14, gap: 12 },
  others: { gap: 10 },
  othersCompact: { marginTop: 18, gap: 10 },
  othersHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  othersTitle: { color: night.goldSoft, fontSize: 15, ...nightType.bold },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  name: { color: night.text, fontSize: 16, ...nightType.semibold },
  sub: { marginTop: 2, color: night.muted, fontSize: 13, lineHeight: 18, ...nightType.body },
  wakeButton: { minWidth: 104, height: 38, borderRadius: 19, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: night.gold },
  wakeText: { color: night.sky0, fontSize: 14, ...nightType.bold },
  mine: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  icon: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: night.goldLine },
  cancelLink: { color: night.muted, fontSize: 13, textDecorationLine: 'underline', ...nightType.medium },
  backdrop: { flex: 1, backgroundColor: 'rgba(5,3,18,0.7)', justifyContent: 'flex-end' },
  sheet: { maxHeight: '85%', borderTopLeftRadius: 28, borderTopRightRadius: 28, overflow: 'hidden', padding: 22, paddingBottom: 30 },
  sheetTitle: { color: night.text, fontSize: 24, ...nightType.display },
  sheetText: { marginTop: 6, marginBottom: 14, color: night.textSoft, fontSize: 15, lineHeight: 21, ...nightType.body },
  sheetList: { flexGrow: 0 },
  section: { marginTop: 16 },
  groups: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  groupChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16, borderWidth: 1, borderColor: night.goldLine },
  groupChipOn: { backgroundColor: night.gold, borderColor: night.gold },
  groupText: { color: night.goldSoft, fontSize: 14, ...nightType.semibold },
  groupTextOn: { color: night.sky0 },
  primary: { marginTop: 16, minHeight: 54, borderRadius: 27, alignItems: 'center', justifyContent: 'center', backgroundColor: night.gold },
  primaryText: { color: night.sky0, fontSize: 17, ...nightType.bold },
  disabled: { opacity: 0.45 },
  cancel: { alignSelf: 'center', paddingTop: 12 },
  cancelText: { color: night.muted, fontSize: 15, ...nightType.semibold },
  pressed: { opacity: 0.85 },
});
