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
  saveCommunityProfile,
  type CommunityAvatar,
} from '../../features/tahajjud/tahajjudCommunity';
import { tx } from '../../features/tahajjud/tahajjudI18n';

/** Profil OUMMAH : pseudo + avatar + confidentialité. Needed for the community features. */
export default function TahajjudProfileScreen() {
  const [loading, setLoading] = useState(true);
  const [signedIn, setSignedIn] = useState(false);
  const [exists, setExists] = useState(false);
  const [pseudo, setPseudo] = useState('');
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
      setExists(Boolean(profile));
      if (profile) {
        setPseudo(profile.pseudo);
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
    } catch (error) {
      const code = error instanceof Error ? error.message : '';
      Alert.alert(tx('Profil'), code === 'PSEUDO_TAKEN'
        ? tx('Ce pseudo est déjà pris. Choisissez-en un autre.')
        : code === 'PSEUDO_LOCKED'
          ? tx('Le pseudo est définitif et ne peut pas être modifié.')
          : code === 'PSEUDO_INVALID'
          ? tx('Le pseudo doit faire de 3 à 24 caractères (lettres, chiffres, espace, point, tiret).')
          : tx('Impossible d’enregistrer le profil pour le moment.'));
    } finally {
      setSaving(false);
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
    <TahajjudShell title={exists ? tx('Mon profil OUMMAH') : tx('Créer mon profil')} eyebrow={tx("Communauté")}>
      <View style={styles.preview}>
        <View style={styles.avatarBig}>
          <Ionicons name={AVATAR_ICONS[avatar]} size={38} color={night.sky0} />
        </View>
        <Text style={styles.previewName}>{pseudo.trim() || tx('Votre pseudo')}</Text>
      </View>

      <Text style={shellStyles.sectionLabel}>{tx("Pseudo")}</Text>
      {exists ? (
        <View style={[styles.input, styles.locked]}>
          <Text style={styles.lockedText}>{pseudo}</Text>
          <Ionicons name="lock-closed" size={17} color={night.muted} />
        </View>
      ) : (
        <TextInput
          value={pseudo}
          onChangeText={setPseudo}
          placeholder={tx("Ex. : Abdallah, Oum Yasmine…")}
          placeholderTextColor={night.placeholder}
          maxLength={24}
          autoCapitalize="words"
          style={styles.input}
        />
      )}
      <Text style={styles.hint}>
        {exists
          ? tx('Votre pseudo est unique et lié à votre compte : il ne peut plus être modifié.')
          : tx('Unique et définitif : il ne pourra plus être modifié. Visible des autres membres, évitez votre nom complet.')}
      </Text>

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
        <Text style={styles.buttonText}>{saving ? tx('Enregistrement…') : exists ? tx('Enregistrer') : tx('Créer mon profil')}</Text>
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
