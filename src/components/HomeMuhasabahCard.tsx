import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { getValidSession } from '../features/auth/SupabaseAuthService';
import { getEntry, isLocalEntryComplete, listCommitments, localDateKey, loadDraft } from '../features/muhasabah/MuhasabahService';
import { muhasabahText } from '../features/muhasabah/muhasabahStrings';
import { useI18n } from '../i18n';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';

type State = { kind: 'default' | 'saved' | 'draft' } | { kind: 'effort'; effort: string };

export default function HomeMuhasabahCard() {
  const { language } = useI18n();
  const t = useMemo(() => muhasabahText(language), [language]);
  const [state, setState] = useState<State>({ kind: 'default' });

  useFocusEffect(useCallback(() => {
    let active = true;
    void (async () => {
      const session = await getValidSession().catch(() => null);
      const userId = session?.user.id ?? null;
      const date = localDateKey();
      const [done, draft, commitments] = await Promise.all([
        isLocalEntryComplete(userId, date).then((local) => local || (session ? getEntry(date).then(Boolean).catch(() => false) : false)),
        loadDraft(userId, date),
        session ? listCommitments().catch(() => []) : Promise.resolve([]),
      ]);
      if (!active) return;
      if (done) { setState({ kind: 'saved' }); return; }
      if (draft && (draft.goodDeeds.trim() || draft.couldImprove.trim() || draft.effort.trim())) { setState({ kind: 'draft' }); return; }
      const effort = commitments.find((item) => item.status === 'active' || item.status === 'progressing');
      setState(effort ? { kind: 'effort', effort: effort.text } : { kind: 'default' });
    })();
    return () => { active = false; };
  }, []));

  const subtitle = state.kind === 'saved' ? t('homeSaved') : state.kind === 'draft' ? t('homeDraft') : state.kind === 'effort' ? t('homeEffort', { effort: state.effort }) : t('homeDefault');
  const saved = state.kind === 'saved';

  return (
    <Pressable accessibilityRole="button" accessibilityLabel={t('homeOpen')} onPress={() => router.push('/muhasabah')} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <View style={[styles.icon, saved && styles.iconSaved]}><Ionicons name={saved ? 'checkmark' : 'create-outline'} size={saved ? 22 : 25} color={saved ? '#211329' : colors.goldLight} /></View>
      <View style={styles.copy}><Text style={styles.title}>{t('title')}</Text><Text numberOfLines={2} style={styles.subtitle}>{subtitle}</Text></View>
      <Image source={require('../../assets/images/muhasabah-lantern.png')} resizeMode="contain" style={styles.lantern} />
      <Ionicons name="chevron-forward" size={24} color={colors.goldLight} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { minHeight: 64, marginTop: 10, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 18, borderWidth: 1, borderColor: 'rgba(242,181,61,0.82)', backgroundColor: 'rgba(23,17,34,0.94)', flexDirection: 'row', alignItems: 'center', gap: 10, overflow: 'hidden' },
  icon: { width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(49,35,62,0.92)', borderWidth: 1, borderColor: 'rgba(221,187,142,0.42)' },
  iconSaved: { backgroundColor: colors.goldLight, borderColor: colors.goldLight },
  copy: { flex: 1, zIndex: 1 },
  title: { color: colors.text, fontFamily: typography.sans, fontWeight: '700', fontSize: 17 },
  subtitle: { color: colors.textSecondary, fontFamily: typography.sans, fontSize: 12, lineHeight: 16, marginTop: 1, maxWidth: 230 },
  lantern: { position: 'absolute', right: 23, bottom: 7, width: 56, height: 56, opacity: 0.62 },
  pressed: { opacity: 0.82 },
});
