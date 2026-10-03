import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Member } from '../../features/tahajjud/tahajjudFriends';
import { MemberAvatar } from './MemberAvatar';
import { GlassCard } from './TahajjudShell';
import { night, nightType } from './theme';

/** Multi-select list of friends (group creation / adding members). */
export function FriendPicker({ friends, selected, onToggle, emptyText }: {
  friends: Member[];
  selected: Set<string>;
  onToggle: (id: string) => void;
  emptyText: string;
}) {
  if (!friends.length) {
    return <GlassCard><Text style={styles.empty}>{emptyText}</Text></GlassCard>;
  }
  return (
    <GlassCard style={styles.card}>
      {friends.map((friend, index) => {
        const on = selected.has(friend.id);
        return (
          <Pressable key={friend.id} onPress={() => onToggle(friend.id)} style={[styles.row, index > 0 && styles.rowBorder]}>
            <MemberAvatar avatar={friend.avatar} size={40} dim={!on} />
            <Text style={styles.name} numberOfLines={1}>{friend.pseudo}</Text>
            <View style={[styles.check, on && styles.checkOn]}>
              {on ? <Ionicons name="checkmark" size={17} color={night.sky0} /> : null}
            </View>
          </Pressable>
        );
      })}
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: { paddingVertical: 6 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 9 },
  rowBorder: { borderTopWidth: 1, borderTopColor: night.line },
  name: { flex: 1, color: night.text, fontSize: 17, ...nightType.semibold },
  check: { width: 28, height: 28, borderRadius: 14, borderWidth: 2, borderColor: night.goldLine, alignItems: 'center', justifyContent: 'center' },
  checkOn: { backgroundColor: night.gold, borderColor: night.gold },
  empty: { color: night.textSoft, fontSize: 15, lineHeight: 21, textAlign: 'center', ...nightType.body },
});
