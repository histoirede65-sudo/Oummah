import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BoycottEntityCard from '../../components/boycott/BoycottEntityCard';
import { getBoycottCatalog, searchBoycottCatalog } from '../../features/boycott/data/BoycottRepository';
import { BOYCOTT_CATEGORY_LABELS, type BoycottCategory, type BoycottEntity } from '../../features/boycott/domain/BoycottEntity';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';

const CATEGORIES: Array<{ key: BoycottCategory | 'all'; icon: keyof typeof Ionicons.glyphMap; label: string }> = [
  { key: 'all', icon: 'apps-outline', label: 'Tout' },
  { key: 'restaurant', icon: 'restaurant-outline', label: 'Resto' },
  { key: 'beverage', icon: 'cafe-outline', label: 'Boissons' },
  { key: 'food', icon: 'basket-outline', label: 'Alimentaire' },
  { key: 'technology', icon: 'laptop-outline', label: 'Tech' },
  { key: 'retail', icon: 'storefront-outline', label: 'Commerce' },
  { key: 'travel', icon: 'airplane-outline', label: 'Voyage' },
  { key: 'finance', icon: 'card-outline', label: 'Finance' },
];

export default function BoycottScreen() {
  const [catalog, setCatalog] = useState<BoycottEntity[]>([]);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<BoycottCategory | 'all'>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => { void getBoycottCatalog().then(setCatalog).finally(() => setLoading(false)); }, []);
  const results = useMemo(() => searchBoycottCatalog(catalog, query, category), [catalog, query, category]);
  const renderableResults = useMemo(() => {
    const seen = new Set<string>();
    return results.filter((item): item is BoycottEntity => {
      if (!item || !item.id || !item.name || seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });
  }, [results]);

  return (
    <LinearGradient colors={['#090713', '#110A1B', '#090713']} style={styles.screen}>
      <SafeAreaView edges={['top']} style={styles.safe}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.headerButton}><Ionicons name="arrow-back" size={21} color={colors.goldLight} /></Pressable>
          <Text style={styles.headerTitle}>Boycott</Text>
          <Pressable onPress={() => router.push('/boycott/add')} style={styles.headerButton}><Ionicons name="add" size={23} color={colors.goldLight} /></Pressable>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.hero}>
            <Text style={styles.kicker}>ACHETER EN CONSCIENCE</Text>
            <Text style={styles.title}>Scannez. Vérifiez. Remplacez.</Text>
            <Text style={styles.subtitle}>Un lien documenté retenu par OUMMAH suffit pour classer une marque à boycotter. Chaque fiche explique précisément pourquoi.</Text>
            <Pressable onPress={() => router.push('/boycott/scanner')} style={({ pressed }) => [styles.scanButton, pressed && styles.pressed]}>
              <LinearGradient colors={['#D9B15F', '#B98A38']} style={StyleSheet.absoluteFill} />
              <Ionicons name="scan" size={27} color="#17111C" />
              <View style={{ flex: 1 }}><Text style={styles.scanTitle}>Scanner un produit</Text><Text style={styles.scanSubtitle}>Détection instantanée du code-barres</Text></View>
              <Ionicons name="chevron-forward" size={21} color="#17111C" />
            </Pressable>
          </View>

          <View style={styles.searchWrap}>
            <Ionicons name="search" size={20} color={colors.goldLight} />
            <TextInput value={query} onChangeText={setQuery} placeholder="Marque, restaurant, entreprise…" placeholderTextColor="#776D81" style={styles.searchInput} autoCorrect={false} />
            {query ? <Pressable onPress={() => setQuery('')}><Ionicons name="close-circle" size={19} color={colors.textMuted} /></Pressable> : null}
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryRow}>
            {CATEGORIES.map((item) => {
              const selected = category === item.key;
              return <Pressable key={item.key} onPress={() => setCategory(item.key)} style={[styles.categoryChip, selected && styles.categoryChipActive]}><Ionicons name={item.icon} size={16} color={selected ? '#17111C' : colors.goldLight} /><Text style={[styles.categoryText, selected && styles.categoryTextActive]}>{item.label}</Text></Pressable>;
            })}
          </ScrollView>

          <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>{query || category !== 'all' ? 'Résultats' : 'Marques vérifiées'}</Text><Text style={styles.sectionCount}>{renderableResults.length}</Text></View>
          {loading ? <ActivityIndicator color={colors.goldLight} style={{ marginTop: 28 }} /> : renderableResults.length ? <View style={styles.list}>{renderableResults.map((item) => <BoycottEntityCard key={item.id} item={item} onPress={() => router.push(`/boycott/${item.id}`)} />)}</View> : <View style={styles.empty}><Ionicons name="search-outline" size={30} color={colors.textMuted} /><Text style={styles.emptyTitle}>Introuvable pour le moment</Text><Text style={styles.emptyText}>La base grandit avec les vérifications et les propositions de la communauté.</Text><Pressable onPress={() => router.push('/boycott/add')} style={styles.emptyButton}><Text style={styles.emptyButtonText}>Proposer ce produit ou cette entreprise</Text></Pressable></View>}

          <Pressable onPress={() => router.push('/boycott/add')} style={styles.contribute}>
            <Ionicons name="people-outline" size={22} color={colors.goldLight} />
            <View style={{ flex: 1 }}><Text style={styles.contributeTitle}>Il manque quelque chose ?</Text><Text style={styles.contributeText}>Ajoutez un produit ou une entreprise. Rien n’est publié avant validation admin.</Text></View>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 }, safe: { flex: 1 },
  header: { height: 58, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerButton: { width: 42, height: 42, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.045)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)' },
  headerTitle: { color: colors.text, fontFamily: typography.serifSemibold, fontSize: 23 },
  content: { paddingHorizontal: 16, paddingBottom: 44 },
  hero: { marginTop: 8, padding: 20, borderRadius: 30, backgroundColor: 'rgba(27,18,39,0.84)', borderWidth: 1, borderColor: 'rgba(221,183,101,0.18)' },
  kicker: { color: colors.goldLight, fontFamily: typography.sans, fontSize: 10.5, fontWeight: '800', letterSpacing: 1.45 },
  title: { marginTop: 8, color: colors.text, fontFamily: typography.serifSemibold, fontSize: 30, lineHeight: 34 },
  subtitle: { marginTop: 8, color: colors.textSecondary, fontFamily: typography.sans, fontSize: 13.5, lineHeight: 20 },
  scanButton: { marginTop: 18, minHeight: 76, overflow: 'hidden', borderRadius: 23, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16 },
  scanTitle: { color: '#17111C', fontFamily: typography.sans, fontSize: 16.5, fontWeight: '800' },
  scanSubtitle: { marginTop: 2, color: 'rgba(23,17,28,0.70)', fontFamily: typography.sans, fontSize: 10.5, fontWeight: '600' },
  pressed: { opacity: 0.82 },
  searchWrap: { marginTop: 16, height: 58, borderRadius: 21, paddingHorizontal: 15, flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: 'rgba(24,17,34,0.94)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)' },
  searchInput: { flex: 1, color: colors.text, fontFamily: typography.sans, fontSize: 15.5 },
  categoryRow: { paddingVertical: 14, gap: 8, paddingRight: 12 },
  categoryChip: { height: 38, paddingHorizontal: 13, borderRadius: 18, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)' },
  categoryChipActive: { backgroundColor: colors.goldLight, borderColor: colors.goldLight }, categoryText: { color: colors.textSecondary, fontFamily: typography.sans, fontSize: 11.5, fontWeight: '700' }, categoryTextActive: { color: '#17111C' },
  sectionHeader: { marginTop: 4, marginBottom: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, sectionTitle: { color: colors.text, fontFamily: typography.serifMedium, fontSize: 20 }, sectionCount: { color: colors.textMuted, fontFamily: typography.sans, fontSize: 12 },
  list: { gap: 9 },
  empty: { alignItems: 'center', paddingVertical: 34, paddingHorizontal: 18 }, emptyTitle: { marginTop: 10, color: colors.text, fontFamily: typography.serifSemibold, fontSize: 19 }, emptyText: { marginTop: 5, textAlign: 'center', color: colors.textMuted, fontFamily: typography.sans, fontSize: 12.5, lineHeight: 18 }, emptyButton: { marginTop: 15, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(221,183,101,0.25)' }, emptyButtonText: { color: colors.goldLight, fontFamily: typography.sans, fontSize: 11.5, fontWeight: '700' },
  contribute: { marginTop: 20, minHeight: 88, padding: 15, borderRadius: 23, flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: 'rgba(255,255,255,0.035)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)' }, contributeTitle: { color: colors.text, fontFamily: typography.sans, fontSize: 14.5, fontWeight: '700' }, contributeText: { marginTop: 3, color: colors.textMuted, fontFamily: typography.sans, fontSize: 11.5, lineHeight: 17 },
});
