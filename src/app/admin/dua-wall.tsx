import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { adminListWall, adminReviewWall, type WallAdminItem } from '../../features/tahajjud/duaWall';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';

/** Mur des duas : duas à valider, puis duas et réponses signalées. */
export default function DuaWallAdminScreen() {
  const [items, setItems] = useState<WallAdminItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [acting, setActing] = useState<string | null>(null);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      setItems(await adminListWall());
    } catch (error) {
      Alert.alert('Administration', error instanceof Error ? error.message : 'Chargement impossible');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  const review = async (item: WallAdminItem, approve: boolean) => {
    setActing(item.id);
    try {
      await adminReviewWall(item.kind, item.id, approve);
      setItems((current) => current.filter((row) => row.id !== item.id));
    } catch (error) {
      Alert.alert('Administration', error instanceof Error ? error.message : 'Action impossible');
    } finally {
      setActing(null);
    }
  };

  const label = (item: WallAdminItem) => {
    if (item.kind === 'reply') return `Réponse signalée · ${item.reportCount} signalement${item.reportCount > 1 ? 's' : ''}`;
    if (item.status === 'pending') return 'Doua à valider';
    return `Doua signalée · ${item.reportCount} signalement${item.reportCount > 1 ? 's' : ''}`;
  };

  return (
    <SafeAreaView edges={['top']} style={s.safe}>
      <View style={s.header}>
        <Pressable onPress={() => router.back()} style={s.back}><Ionicons name="arrow-back" size={23} color={colors.goldLight} /></Pressable>
        <Text style={s.title}>Mur des duas</Text>
        <View style={s.back} />
      </View>
      {loading ? (
        <View style={s.center}><ActivityIndicator color={colors.goldLight} /></View>
      ) : (
        <ScrollView
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(true); }} />}
          contentContainerStyle={s.content}
        >
          {items.length === 0 ? <Text style={s.empty}>Rien à modérer.</Text> : items.map((item) => {
            const pending = item.kind === 'post' && item.status === 'pending';
            return (
              <View key={`${item.kind}-${item.id}`} style={s.card}>
                <Text style={s.kind}>{label(item)}</Text>
                <Text style={s.body}>{item.body}</Text>
                <Text style={s.meta}>
                  {item.author ?? 'Membre'}{item.anonymous ? ' (publiée anonymement)' : ''} · {new Date(item.createdAt).toLocaleString('fr-FR')}
                </Text>
                <View style={s.actions}>
                  <Pressable disabled={acting === item.id} onPress={() => void review(item, false)} style={s.reject}>
                    <Text style={s.rejectText}>{pending ? 'Refuser' : 'Retirer'}</Text>
                  </Pressable>
                  <Pressable disabled={acting === item.id} onPress={() => void review(item, true)} style={s.approve}>
                    <Text style={s.approveText}>{acting === item.id ? '…' : pending ? 'Publier' : 'Garder'}</Text>
                  </Pressable>
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
  kind: { color: colors.goldLight, fontFamily: typography.sans, fontWeight: '700', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.8 },
  body: { marginTop: 8, color: colors.text, fontFamily: typography.sans, fontSize: 16, lineHeight: 23 },
  meta: { marginTop: 8, color: colors.textMuted, fontFamily: typography.sans, fontSize: 12 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 16 },
  reject: { flex: 1, minHeight: 44, borderRadius: 12, borderWidth: 1, borderColor: '#F28B82', alignItems: 'center', justifyContent: 'center' },
  rejectText: { color: '#F28B82', fontFamily: typography.sans, fontWeight: '700' },
  approve: { flex: 1, minHeight: 44, borderRadius: 12, backgroundColor: colors.goldLight, alignItems: 'center', justifyContent: 'center' },
  approveText: { color: colors.background, fontFamily: typography.sans, fontWeight: '700' },
});
