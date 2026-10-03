import type { Href } from 'expo-router';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, TextInput } from 'react-native';
import { FriendPicker } from '../../components/tahajjud/FriendPicker';
import { shellStyles, TahajjudShell } from '../../components/tahajjud/TahajjudShell';
import { night, nightType } from '../../components/tahajjud/theme';
import { getFriendsOverview, type Member } from '../../features/tahajjud/tahajjudFriends';
import { createGroup, groupsErrorMessage } from '../../features/tahajjud/tahajjudGroups';

const NAME_IDEAS = ['Les lève-tôt', 'Famille', 'Frères de la mosquée', 'Sœurs du dernier tiers'];

/** New group: free name + friends. */
export default function NewGroupScreen() {
  const [friends, setFriends] = useState<Member[] | null>(null);
  const [name, setName] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  useFocusEffect(useCallback(() => {
    void getFriendsOverview().then((data) => setFriends(data.friends)).catch(() => setFriends([]));
  }, []));

  const toggle = (id: string) => setSelected((current) => {
    const next = new Set(current);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

  const create = async () => {
    if (!name.trim() || saving) return;
    setSaving(true);
    try {
      const id = await createGroup(name, [...selected]);
      router.replace({ pathname: '/tahajjud/group', params: { id, name: name.trim() } } as unknown as Href);
    } catch (error) {
      Alert.alert('Nouveau groupe', groupsErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  return (
    <TahajjudShell title="Nouveau groupe" eyebrow="Communauté">
      <Text style={shellStyles.sectionLabel}>Nom du groupe</Text>
      <TextInput
        value={name}
        onChangeText={setName}
        placeholder="Donnez un nom à votre groupe"
        placeholderTextColor={night.muted}
        maxLength={40}
        style={styles.input}
      />
      <Text style={styles.ideas}>
        Idées :{' '}
        {NAME_IDEAS.map((idea, index) => (
          <Text key={idea} onPress={() => setName(idea)} style={styles.idea}>{idea}{index < NAME_IDEAS.length - 1 ? ' · ' : ''}</Text>
        ))}
      </Text>

      <Text style={[shellStyles.sectionLabel, styles.section]}>Ajouter des amis{selected.size ? ` · ${selected.size}` : ''}</Text>
      {friends === null ? <ActivityIndicator color={night.gold} /> : (
        <FriendPicker
          friends={friends}
          selected={selected}
          onToggle={toggle}
          emptyText="Ajoutez d’abord des amis OUMMAH. Vous pouvez aussi créer le groupe maintenant et les inviter plus tard."
        />
      )}

      <Pressable disabled={!name.trim() || saving} onPress={() => void create()} style={[styles.primary, (!name.trim() || saving) && styles.disabled]}>
        <Text style={styles.primaryText}>{saving ? 'Création…' : 'Créer le groupe'}</Text>
      </Pressable>
      <Text style={styles.note}>Seuls vos amis peuvent être ajoutés. Chacun peut quitter le groupe ou couper ses notifications.</Text>
    </TahajjudShell>
  );
}

const styles = StyleSheet.create({
  input: {
    height: 56, borderRadius: 18, paddingHorizontal: 16, borderWidth: 1, borderColor: night.goldLine,
    backgroundColor: '#080518', color: night.text, fontSize: 19, ...nightType.medium,
  },
  ideas: { marginTop: 8, color: night.muted, fontSize: 14, lineHeight: 21, ...nightType.body },
  idea: { color: night.goldSoft, ...nightType.semibold },
  section: { marginTop: 26 },
  primary: { marginTop: 26, minHeight: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', backgroundColor: night.gold },
  primaryText: { color: night.sky0, fontSize: 17, ...nightType.bold },
  disabled: { opacity: 0.45 },
  note: { marginTop: 12, color: night.muted, fontSize: 13, lineHeight: 18, textAlign: 'center', ...nightType.body },
});
