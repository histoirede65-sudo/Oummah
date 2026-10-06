import { Ionicons } from '@expo/vector-icons';
import type { Href } from 'expo-router';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { AVATAR_ICONS } from '../../components/tahajjud/MemberAvatar';
import { GlassCard, shellStyles, TahajjudShell } from '../../components/tahajjud/TahajjudShell';
import { night, nightType } from '../../components/tahajjud/theme';
import {
  COMMUNITY_AVATARS,
  getCommunityProfile,
  isSignedIn,
  nextPseudoChange,
  renameCommunityPseudo,
  saveCommunityProfile,
  type CommunityAvatar,
} from '../../features/tahajjud/tahajjudCommunity';
import { tahajjudLocale, tx } from '../../features/tahajjud/tahajjudI18n';

/** Profil OUMMAH : name + avatar + privacy. Created automatically with the account; the name changes once a week. */
export default function TahajjudProfileScreen() {
  const [loading, setLoading] = useState(true);
  const [signedIn, setSignedIn] = useState(false);
  const [pseudo, setPseudo] = useState('');
  const [changedAt, setChangedAt] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const [renaming, setRenaming] = useState(false);
  const [avatar, setAvatar] = useState<CommunityAvatar>('moon');
  const [shareTahajjud, setShareTahajjud] = useState(true);
  const [shareZone, setShareZone] = useState(true);
  const [shareWithFriends, setShareWithFriends] = useState(true);
  const [acceptFriendRequests, setAcceptFriendRequests] = useState(true);
  const [acceptMessages, setAcceptMessages] = useState(true);
  const [saving, setSaving] = useState(false);

  useFocusEffect(useCallback(() => {
    let active = true;
    void (async () => {
      const connected = await isSignedIn();
      const profile = connected ? await getCommunityProfile() : null;
      if (!active) return;
      setSignedIn(connected);
      if (profile) {
        setPseudo(profile.pseudo);
        setChangedAt(profile.pseudoChangedAt ?? null);
        setAvatar(profile.avatar);
        setShareTahajjud(profile.shareTahajjud);
        setShareZone(profile.shareZone);
        setShareWithFriends(profile.shareWithFriends);
        setAcceptFriendRequests(profile.acceptFriendRequests);
        setAcceptMessages(profile.acceptMessages);
      }
      setLoading(false);
    })();
    return () => { active = false; };
  }, []));

  const save = async () => {
    if (saving) return;
    setSaving(true);
    try {
      await saveCommunityProfile({ pseudo, avatar, shareTahajjud, shareZone, shareWithFriends, acceptFriendRequests, acceptMessages });
      router.back();
    } catch {
      Alert.alert(tx('Profil'), tx('Impossible d’enregistrer le profil pour le moment.'));
    } finally {
      setSaving(false);
    }
  };

  const next = nextPseudoChange({ pseudoChangedAt: changedAt });
  const formatDay = (date: Date) => date.toLocaleDateString(tahajjudLocale(), { weekday: 'long', day: 'numeric', month: 'long' });

  const rename = async () => {
    const wanted = draft.trim().replace(/\s+/g, ' ');
    if (renaming || !wanted) return;
    setRenaming(true);
    try {
      const result = await renameCommunityPseudo(wanted);
      setPseudo(result.pseudo);
      setChangedAt(result.changedAt);
      setEditing(false);
      if (result.pseudo.toLowerCase() !== wanted.toLowerCase()) {
        Alert.alert(tx('Nom enregistré'), tx('« {0} » était déjà utilisé : vous apparaissez sous le nom « {1} ».', [wanted, result.pseudo]));
      }
    } catch (error) {
      const code = error instanceof Error ? error.message : '';
      Alert.alert(tx('Nom'), code.startsWith('PSEUDO_WAIT:')
        ? tx('Vous pourrez changer de nom à nouveau le {0}.', [formatDay(new Date(code.slice('PSEUDO_WAIT:'.length)))])
        : code === 'PSEUDO_INVALID'
          ? tx('Le nom doit faire de 2 à 20 caractères (lettres, chiffres, espace, point, tiret).')
          : code === 'PSEUDO_REFUSED'
            ? tx('Ce nom contient des mots qui ne sont pas acceptés.')
            : tx('Impossible de changer le nom pour le moment.'));
    } finally {
      setRenaming(false);
    }
  };

  if (loading) {
    return <TahajjudShell title={tx("Mon profil OUMMAH")} eyebrow={tx("Communauté")}><ActivityIndicator color={night.gold} /></TahajjudShell>;
  }

  if (!signedIn) {
    return (
      <TahajjudShell title={tx("Mon profil OUMMAH")} eyebrow={tx("Communauté")}>
        <GlassCard gold style={styles.center}>
          <Ionicons name="person-circle-outline" size={48} color={night.goldSoft} />
          <Text style={styles.lead}>{tx("Connectez-vous pour rejoindre la communauté Qiyam al-Layl.")}</Text>
          <Pressable onPress={() => router.push('/profile' as Href)} style={styles.button}>
            <Text style={styles.buttonText}>{tx("Se connecter")}</Text>
          </Pressable>
        </GlassCard>
      </TahajjudShell>
    );
  }

  return (
    <TahajjudShell title={tx('Mon profil OUMMAH')} eyebrow={tx("Communauté")}>
      <View style={styles.preview}>
        <View style={styles.avatarBig}>
          <Ionicons name={AVATAR_ICONS[avatar]} size={38} color={night.sky0} />
        </View>
        <Text style={styles.previewName}>{pseudo}</Text>
      </View>

      <Text style={shellStyles.sectionLabel}>{tx("Nom affiché")}</Text>
      {editing ? (
        <>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder={tx("Ex. : Abdallah, Oum Yasmine…")}
            placeholderTextColor={night.placeholder}
            maxLength={20}
            autoCapitalize="words"
            autoFocus
            style={styles.input}
          />
          <View style={styles.renameActions}>
            <Pressable onPress={() => setEditing(false)} style={styles.ghost}><Text style={styles.ghostText}>{tx("Annuler")}</Text></Pressable>
            <Pressable disabled={renaming || draft.trim().length < 2} onPress={() => void rename()} style={[styles.small, (renaming || draft.trim().length < 2) && styles.disabled]}>
              <Text style={styles.smallText}>{renaming ? tx('Enregistrement…') : tx('Valider ce nom')}</Text>
            </Pressable>
          </View>
          <Text style={styles.hint}>{tx("Vous ne pourrez plus le changer pendant 7 jours. Si le nom est déjà pris, un chiffre est ajouté automatiquement.")}</Text>
        </>
      ) : (
        <>
          <View style={[styles.input, styles.locked]}>
            <Text style={styles.lockedText}>{pseudo}</Text>
            {next ? <Ionicons name="lock-closed" size={17} color={night.muted} /> : (
              <Pressable onPress={() => { setDraft(pseudo.replace(/ \d+$/, '')); setEditing(true); }} hitSlop={8}>
                <Text style={styles.change}>{tx("Modifier")}</Text>
              </Pressable>
            )}
          </View>
          <Text style={styles.hint}>
            {next
              ? tx('Vous pourrez le changer à nouveau le {0}.', [formatDay(next)])
              : tx('C’est le nom que voient vos amis. Vous pouvez le changer une fois par semaine.')}
          </Text>
        </>
      )}

      <Text style={[shellStyles.sectionLabel, styles.section]}>{tx("Avatar")}</Text>
      <View style={styles.avatars}>
        {COMMUNITY_AVATARS.map((item) => (
          <Pressable key={item} onPress={() => setAvatar(item)} style={[styles.avatar, avatar === item && styles.avatarOn]}>
            <Ionicons name={AVATAR_ICONS[item]} size={24} color={avatar === item ? night.sky0 : night.goldSoft} />
          </Pressable>
        ))}
      </View>

      <Text style={[shellStyles.sectionLabel, styles.section]}>{tx("Confidentialité")}</Text>
      <GlassCard>
        <View style={styles.row}>
          <View style={styles.rowCopy}>
            <Text style={styles.rowTitle}>{tx("Apparaître dans « La Oummah cette nuit »")}</Text>
            <Text style={styles.rowText}>{tx("Compté quand vous déclarez être réveillé ou validez votre nuit. Toujours anonyme.")}</Text>
          </View>
          <Switch value={shareTahajjud} onValueChange={setShareTahajjud} trackColor={{ false: 'rgba(255,255,255,0.15)', true: night.gold }} thumbColor={night.text} />
        </View>
        <View style={[styles.row, styles.rowBorder]}>
          <View style={styles.rowCopy}>
            <Text style={styles.rowTitle}>{tx("Ma zone sur la carte")}</Text>
            <Text style={styles.rowText}>{tx("Une zone d’environ 30 km : vos nuits (visibles à partir de 3 membres) et l’icône de vos duas. Jamais votre adresse.")}</Text>
          </View>
          <Switch value={shareZone} disabled={!shareTahajjud} onValueChange={setShareZone} trackColor={{ false: 'rgba(255,255,255,0.15)', true: night.gold }} thumbColor={night.text} />
        </View>
        <View style={[styles.row, styles.rowBorder]}>
          <View style={styles.rowCopy}>
            <Text style={styles.rowTitle}>{tx("Mes amis voient mes nuits")}</Text>
            <Text style={styles.rowText}>{tx("Réveillé ou a prié cette nuit, et le nombre de nuits sur 7 jours. Rien d’autre.")}</Text>
          </View>
          <Switch value={shareWithFriends} onValueChange={setShareWithFriends} trackColor={{ false: 'rgba(255,255,255,0.15)', true: night.gold }} thumbColor={night.text} />
        </View>
        <View style={[styles.row, styles.rowBorder]}>
          <View style={styles.rowCopy}>
            <Text style={styles.rowTitle}>{tx("Recevoir des demandes d’ami")}</Text>
            <Text style={styles.rowText}>{tx("Désactivez pour ne plus recevoir de nouvelles demandes.")}</Text>
          </View>
          <Switch value={acceptFriendRequests} onValueChange={setAcceptFriendRequests} trackColor={{ false: 'rgba(255,255,255,0.15)', true: night.gold }} thumbColor={night.text} />
        </View>
        <View style={[styles.row, styles.rowBorder]}>
          <View style={styles.rowCopy}>
            <Text style={styles.rowTitle}>{tx("Recevoir des messages")}</Text>
            <Text style={styles.rowText}>{tx("Uniquement de vos amis. Désactivez pour ne plus en recevoir.")}</Text>
          </View>
          <Switch value={acceptMessages} onValueChange={setAcceptMessages} trackColor={{ false: 'rgba(255,255,255,0.15)', true: night.gold }} thumbColor={night.text} />
        </View>
      </GlassCard>

      <Pressable disabled={saving} onPress={() => void save()} style={[styles.button, styles.saveButton, saving && styles.disabled]}>
        <Text style={styles.buttonText}>{saving ? tx('Enregistrement…') : tx('Enregistrer')}</Text>
      </Pressable>
    </TahajjudShell>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', gap: 14, paddingVertical: 28 },
  lead: { color: night.text, fontSize: 18, textAlign: 'center', lineHeight: 25, ...nightType.medium },
  preview: { alignItems: 'center', marginBottom: 22 },
  avatarBig: {
    width: 84, height: 84, borderRadius: 42, backgroundColor: night.goldSoft, alignItems: 'center', justifyContent: 'center',
    shadowColor: night.goldSoft, shadowOpacity: 0.7, shadowRadius: 20, shadowOffset: { width: 0, height: 0 }, elevation: 8,
  },
  previewName: { marginTop: 12, color: night.text, fontSize: 26, ...nightType.display },
  input: { height: 54, borderRadius: 18, paddingHorizontal: 16, borderWidth: 1, borderColor: night.goldLine, backgroundColor: '#080518', color: night.text, fontSize: 18, ...nightType.medium },
  locked: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', opacity: 0.85 },
  lockedText: { color: night.text, fontSize: 18, ...nightType.medium },
  change: { color: night.goldSoft, fontSize: 16, ...nightType.bold },
  renameActions: { marginTop: 10, flexDirection: 'row', justifyContent: 'flex-end', gap: 10 },
  ghost: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, borderWidth: 1, borderColor: night.line },
  ghostText: { color: night.textSoft, fontSize: 15, ...nightType.semibold },
  small: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 20, backgroundColor: night.gold },
  smallText: { color: night.sky0, fontSize: 15, ...nightType.bold },
  hint: { marginTop: 6, color: night.muted, fontSize: 14, ...nightType.body },
  section: { marginTop: 24 },
  avatars: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  avatar: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: night.goldLine, backgroundColor: night.glass },
  avatarOn: { backgroundColor: night.gold, borderColor: night.gold },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 6 },
  rowBorder: { marginTop: 8, paddingTop: 14, borderTopWidth: 1, borderTopColor: night.line },
  rowCopy: { flex: 1 },
  rowTitle: { color: night.text, fontSize: 17, ...nightType.semibold },
  rowText: { marginTop: 3, color: night.muted, fontSize: 14, lineHeight: 19, ...nightType.body },
  button: { minHeight: 56, borderRadius: 28, paddingHorizontal: 28, alignItems: 'center', justifyContent: 'center', backgroundColor: night.gold },
  saveButton: { marginTop: 26 },
  buttonText: { color: night.sky0, fontSize: 17, ...nightType.bold },
  disabled: { opacity: 0.5 },
});
