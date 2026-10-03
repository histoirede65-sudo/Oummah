import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { adminListMosquePosts, adminReviewMosquePost, type MosquePostProposal } from '../../features/mosques/data/mosquePosts';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';

function formatDateTime(value?: string) {
  if (!value) return null;
  return new Date(value).toLocaleString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export default function MosquePostsAdminScreen() {
  const [rows, setRows] = useState<MosquePostProposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [acting, setActing] = useState<string | null>(null);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      setRows(await adminListMosquePosts());
    } catch (error) {
      Alert.alert('Administration', error instanceof Error ? error.message : 'Chargement impossible');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  const review = async (id: string, approve: boolean) => {
    setActing(id);
    try {
      await adminReviewMosquePost(id, approve);
      setRows((current) => current.filter((row) => row.id !== id));
    } catch (error) {
      Alert.alert('Administration', error instanceof Error ? error.message : 'Action impossible');
    } finally {
      setActing(null);
    }
  };

  return (
    <SafeAreaView edges={['top']} style={s.safe}>
      <View style={s.header}>
        <Pressable onPress={() => router.back()} style={s.back}><Ionicons name="arrow-back" size={23} color={colors.goldLight} /></Pressable>
        <Text style={s.title}>Annonces des mosquées</Text>
        <View style={s.back} />
      </View>
      {loading ? (
        <View style={s.center}><ActivityIndicator color={colors.goldLight} /></View>
      ) : (
        <ScrollView
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(true); }} />}
          contentContainerStyle={s.content}
        >
          {rows.length === 0 ? <Text style={s.empty}>Aucune proposition en attente.</Text> : rows.map((row) => {
            const start = formatDateTime(row.startsAt);
            const end = formatDateTime(row.endsAt);
            return (
              <View key={row.id} style={s.card}>
                <Text style={s.kind}>{row.kind === 'event' ? 'Événement' : 'Annonce'} · {row.mosqueName}</Text>
                <Text style={s.postTitle}>{row.title}</Text>
                {start ? <Text style={s.date}>{start}{end ? ` → ${end}` : ''}</Text> : end ? <Text style={s.date}>Jusqu’au {end}</Text> : null}
                {row.body ? <Text style={s.body}>{row.body}</Text> : null}
                <Text style={s.meta}>Proposé le {new Date(row.createdAt).toLocaleDateString('fr-FR')}</Text>
                <View style={s.actions}>
                  <Pressable disabled={acting === row.id} onPress={() => void review(row.id, false)} style={s.reject}><Text style={s.rejectText}>Refuser</Text></Pressable>
                  <Pressable disabled={acting === row.id} onPress={() => void review(row.id, true)} style={s.approve}><Text style={s.approveText}>{acting === row.id ? '…' : 'Valider'}</Text></Pressable>
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { height: 58, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14 },
  back: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center' },
  title: { color: colors.goldLight, fontFamily: typography.serifMedium, fontSize: 21 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: 16, paddingBottom: 40 },
  empty: { color: colors.textMuted, textAlign: 'center', marginTop: 60 },
  card: { backgroundColor: '#18131F', borderRadius: 20, borderWidth: 1, borderColor: 'rgba(242,181,61,0.2)', padding: 17, marginBottom: 14 },
  kind: { color: colors.goldLight, fontFamily: typography.sansBold, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.8 },
  postTitle: { marginTop: 6, color: colors.text, fontFamily: typography.sansBold, fontSize: 17 },
  date: { marginTop: 4, color: colors.goldLight, fontFamily: typography.sansMedium, fontSize: 13 },
  body: { marginTop: 8, color: colors.textSecondary, fontFamily: typography.sans, fontSize: 13, lineHeight: 19 },
  meta: { marginTop: 8, color: colors.textMuted, fontFamily: typography.sans, fontSize: 11 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 16 },
  reject: { flex: 1, minHeight: 44, borderRadius: 12, borderWidth: 1, borderColor: '#F28B82', alignItems: 'center', justifyContent: 'center' },
  rejectText: { color: '#F28B82', fontFamily: typography.sansBold },
  approve: { flex: 1, minHeight: 44, borderRadius: 12, backgroundColor: colors.goldLight, alignItems: 'center', justifyContent: 'center' },
  approveText: { color: colors.background, fontFamily: typography.sansBold },
});
