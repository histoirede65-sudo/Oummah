import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { FriendPicker } from '../../components/tahajjud/FriendPicker';
import { MemberAvatar } from '../../components/tahajjud/MemberAvatar';
import { GlassCard, shellStyles, TahajjudShell } from '../../components/tahajjud/TahajjudShell';
import { night, nightType } from '../../components/tahajjud/theme';
import { getFriendsOverview, type Member } from '../../features/tahajjud/tahajjudFriends';
import {
  addGroupMembers,
  cancelGroupReminder,
  getGroupDetail,
  groupsErrorMessage,
  reminderLabel,
  removeGroupMember,
  renameGroup,
  setGroupMuted,
  type GroupDetail,
} from '../../features/tahajjud/tahajjudGroups';
import { tx } from '../../features/tahajjud/tahajjudI18n';

/** Group info: name, notifications, reminders, members, add friends, leave. */
export default function GroupInfoScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const groupId = String(id ?? '');
  const [detail, setDetail] = useState<GroupDetail | null>(null);
  const [name, setName] = useState('');
  const [friends, setFriends] = useState<Member[]>([]);
  const [adding, setAdding] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    try {
      const [data, overview] = await Promise.all([getGroupDetail(groupId), getFriendsOverview().catch(() => null)]);
      setDetail(data);
      setName(data.name);
      setFriends(overview?.friends ?? []);
    } catch (error) {
      Alert.alert(tx('Groupe'), groupsErrorMessage(error));
      router.back();
    }
  }, [groupId]);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  const act = async (action: () => Promise<unknown>) => {
    try {
      await action();
      await load();
    } catch (error) {
      Alert.alert(tx('Groupe'), groupsErrorMessage(error));
    }
  };

  if (!detail) {
    return <TahajjudShell title={tx("Groupe")} eyebrow={tx("Infos")}><ActivityIndicator color={night.gold} /></TahajjudShell>;
  }

  const memberIds = new Set(detail.members.map((member) => member.id));
  const addable = friends.filter((friend) => !memberIds.has(friend.id));
  const me = detail.members.find((member) => member.me);

  const leave = () => Alert.alert(tx('Quitter le groupe ?'), tx('Vous ne recevrez plus ses messages ni ses rappels.'), [
    { text: tx('Annuler'), style: 'cancel' },
    {
      text: tx('Quitter'), style: 'destructive', onPress: () => void removeGroupMember(groupId, me?.id ?? '')
        .then(() => router.dismissTo('/tahajjud/friends'))
        .catch((error) => Alert.alert(tx('Groupe'), groupsErrorMessage(error))),
    },
  ]);

  return (
    <TahajjudShell title={detail.name} eyebrow={tx("Groupe")}>
      {detail.isOwner ? (
        <>
          <Text style={shellStyles.sectionLabel}>{tx("Nom du groupe")}</Text>
          <View style={styles.renameRow}>
            <TextInput value={name} onChangeText={setName} maxLength={40} style={styles.input} placeholderTextColor={night.placeholder} />
            <Pressable
              disabled={!name.trim() || name.trim() === detail.name}
              onPress={() => void act(() => renameGroup(groupId, name))}
              style={[styles.smallGold, (!name.trim() || name.trim() === detail.name) && styles.disabled]}
            >
              <Text style={styles.smallGoldText}>{tx("Renommer")}</Text>
            </Pressable>
          </View>
        </>
      ) : null}

      <GlassCard style={styles.section}>
        <View style={styles.row}>
          <Ionicons name="notifications-outline" size={21} color={night.goldSoft} />
          <View style={styles.flex}>
            <Text style={styles.rowTitle}>{tx("Notifications du groupe")}</Text>
            <Text style={styles.rowText}>{tx("Messages et rappels, avec le son OUMMAH.")}</Text>
          </View>
          <Switch
            value={!detail.muted}
            onValueChange={(on) => void act(() => setGroupMuted(groupId, !on))}
            trackColor={{ false: 'rgba(255,255,255,0.15)', true: night.gold }}
            thumbColor={night.text}
          />
        </View>
      </GlassCard>

      <Text style={[shellStyles.sectionLabel, styles.sectionLabel]}>{tx("Rappels programmés")}</Text>
      <GlassCard>
        {detail.reminders.length === 0 ? (
          <Text style={styles.empty}>{tx("Aucun rappel. Utilisez le réveil dans la discussion pour en programmer un.")}</Text>
        ) : detail.reminders.map((reminder, index) => (
          <View key={reminder.id} style={[styles.row, index > 0 && styles.rowBorder]}>
            <Ionicons name="alarm" size={20} color={night.goldSoft} />
            <View style={styles.flex}>
              <Text style={styles.rowTitle}>{reminder.body}</Text>
              <Text style={styles.rowText}>{reminderLabel(reminder.remindAt, reminder.repeatDaily)} {tx("· par ")}{reminder.mine ? 'vous' : reminder.by}</Text>
            </View>
            {reminder.mine || detail.isOwner ? (
              <Pressable onPress={() => void act(() => cancelGroupReminder(reminder.id))} hitSlop={8}>
                <Ionicons name="close-circle" size={22} color={night.muted} />
              </Pressable>
            ) : null}
          </View>
        ))}
      </GlassCard>

      <Text style={[shellStyles.sectionLabel, styles.sectionLabel]}>{tx("Membres · ")}{detail.members.length}</Text>
      <GlassCard>
        {detail.members.map((member, index) => (
          <View key={member.id} style={[styles.row, index > 0 && styles.rowBorder]}>
            <MemberAvatar avatar={member.avatar} size={40} />
            <Text style={[styles.rowTitle, styles.flex]} numberOfLines={1}>{member.me ? tx("{0} (vous)", [member.pseudo]) : member.pseudo}</Text>
            {member.owner ? <Text style={styles.tag}>{tx("Créateur")}</Text> : null}
            {detail.isOwner && !member.me ? (
              <Pressable
                hitSlop={8}
                onPress={() => Alert.alert(tx("Retirer {0} ?", [member.pseudo]), undefined, [
                  { text: tx('Annuler'), style: 'cancel' },
                  { text: tx('Retirer'), style: 'destructive', onPress: () => void act(() => removeGroupMember(groupId, member.id)) },
                ])}
              >
                <Ionicons name="remove-circle-outline" size={22} color={night.muted} />
              </Pressable>
            ) : null}
          </View>
        ))}
      </GlassCard>

      {adding ? (
        <>
          <Text style={[shellStyles.sectionLabel, styles.sectionLabel]}>{tx("Ajouter mes amis")}</Text>
          <FriendPicker
            friends={addable}
            selected={selected}
            onToggle={(friendId) => setSelected((current) => {
              const next = new Set(current);
              if (next.has(friendId)) next.delete(friendId); else next.add(friendId);
              return next;
            })}
            emptyText={tx("Tous vos amis sont déjà dans ce groupe.")}
          />
          <Pressable
            disabled={!selected.size}
            onPress={() => void act(async () => {
              await addGroupMembers(groupId, [...selected]);
              setSelected(new Set());
              setAdding(false);
            })}
            style={[styles.primary, !selected.size && styles.disabled]}
          >
            <Text style={styles.primaryText}>{tx("Ajouter ")}{selected.size || ''}</Text>
          </Pressable>
        </>
      ) : (
        <Pressable onPress={() => setAdding(true)} style={styles.addButton}>
          <Ionicons name="person-add-outline" size={19} color={night.goldSoft} />
          <Text style={styles.addText}>{tx("Ajouter des amis")}</Text>
        </Pressable>
      )}

      <Pressable onPress={leave} style={styles.leave}>
        <Ionicons name="exit-outline" size={19} color="#F28B82" />
        <Text style={styles.leaveText}>{tx("Quitter le groupe")}</Text>
      </Pressable>
    </TahajjudShell>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  renameRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  input: {
    flex: 1, height: 52, borderRadius: 16, paddingHorizontal: 16, borderWidth: 1, borderColor: night.goldLine,
    backgroundColor: '#080518', color: night.text, fontSize: 18, ...nightType.medium,
  },
  section: { marginTop: 18 },
  sectionLabel: { marginTop: 26 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 },
  rowBorder: { borderTopWidth: 1, borderTopColor: night.line },
  rowTitle: { color: night.text, fontSize: 17, ...nightType.semibold },
  rowText: { marginTop: 2, color: night.muted, fontSize: 14, lineHeight: 19, ...nightType.body },
  tag: { color: night.goldSoft, fontSize: 13, ...nightType.semibold },
  empty: { color: night.textSoft, fontSize: 15, lineHeight: 21, ...nightType.body },
  smallGold: { paddingHorizontal: 16, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: night.gold },
  smallGoldText: { color: night.sky0, fontSize: 15, ...nightType.bold },
  disabled: { opacity: 0.45 },
  primary: { marginTop: 16, minHeight: 54, borderRadius: 27, alignItems: 'center', justifyContent: 'center', backgroundColor: night.gold },
  primaryText: { color: night.sky0, fontSize: 17, ...nightType.bold },
  addButton: { marginTop: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 52, borderRadius: 26, borderWidth: 1, borderColor: night.goldLine },
  addText: { color: night.goldSoft, fontSize: 16, ...nightType.bold },
  leave: { marginTop: 28, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12 },
  leaveText: { color: '#F28B82', fontSize: 16, ...nightType.bold },
});
