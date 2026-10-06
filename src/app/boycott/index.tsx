import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import BoycottEntityCard from '../../components/boycott/BoycottEntityCard';
import { BoycottProductImage } from '../../components/boycott/BoycottProductImage';
import { getBoycottCatalog, getBoycottScanHistory, searchBoycottCatalog, type BoycottScanHistoryItem } from '../../features/boycott/data/BoycottRepository';
import { BOYCOTT_CATEGORY_LABELS, type BoycottCategory, type BoycottEntity } from '../../features/boycott/domain/BoycottEntity';
import { useI18n, type TranslationKey } from '../../i18n';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';

const CATEGORIES: Array<{ key: BoycottCategory | 'all'; icon: keyof typeof Ionicons.glyphMap; label: TranslationKey }> = [
  { key: 'all', icon: 'apps-outline', label: 'boycottHome.all' },
  { key: 'restaurant', icon: 'restaurant-outline', label: 'boycottHome.resto' },
  { key: 'beverage', icon: 'cafe-outline', label: 'boycottCat.beverage' },
  { key: 'food', icon: 'basket-outline', label: 'boycottCat.food' },
  { key: 'technology', icon: 'laptop-outline', label: 'boycottHome.tech' },
  { key: 'retail', icon: 'storefront-outline', label: 'boycottCat.retail' },
  { key: 'travel', icon: 'airplane-outline', label: 'boycottCat.travel' },
  { key: 'finance', icon: 'card-outline', label: 'boycottHome.finance' },
];

export default function BoycottScreen() {
  const { t, language } = useI18n();
  const insets = useSafeAreaInsets();
  const [catalog, setCatalog] = useState<BoycottEntity[]>([]);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<BoycottCategory | 'all'>('all');
  const [loading, setLoading] = useState(true);
  const [browsing, setBrowsing] = useState(false);
  const [recent, setRecent] = useState<BoycottScanHistoryItem[]>([]);
  const scrollRef = useRef<ScrollView>(null);
  const searchInputRef = useRef<TextInput>(null);
  const searchYRef = useRef(0);

  useEffect(() => { void getBoycottCatalog().then(setCatalog).finally(() => setLoading(false)); }, []);
  useFocusEffect(useCallback(() => {
    let active = true;
    void getBoycottScanHistory(8).then((items) => { if (active) setRecent(items); });
    return () => { active = false; };
  }, []));
  // Le catalogue complet s'affiche à la demande : l'accueil reste centré sur le scan.
  const showCatalog = browsing || Boolean(query) || category !== 'all';
  const results = useMemo(() => searchBoycottCatalog(catalog, query, category), [catalog, query, category]);
  const renderableResults = useMemo(() => {
    const seen = new Set<string>();
    return results
      .filter((item): item is BoycottEntity => {
        if (!item || !item.id || !item.name || seen.has(item.id)) return false;
        seen.add(item.id);
        return true;
      })
      .sort((a, b) => a.name.localeCompare(b.name, language, { sensitivity: 'base' }));
  }, [results, language]);

  function openSearch() {
    scrollRef.current?.scrollTo({ y: Math.max(0, searchYRef.current - 18), animated: true });
    requestAnimationFrame(() => searchInputRef.current?.focus());
  }

  return (
    <LinearGradient colors={['#090713', '#110A1B', '#090713']} style={styles.screen}>
      <SafeAreaView edges={['top']} style={styles.safe}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.headerButton}><Ionicons name="arrow-back" size={21} color={colors.goldLight} /></Pressable>
          <Text style={styles.headerTitle}>Boycott</Text>
          <Pressable onPress={() => router.push('/boycott/add')} style={styles.headerButton}><Ionicons name="add" size={23} color={colors.goldLight} /></Pressable>
        </View>

        <ScrollView ref={scrollRef} showsVerticalScrollIndicator={false} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.hero}>
            <Text style={styles.kicker}>{t("boycottHome.kicker")}</Text>
            <Text style={styles.title}>{t("boycottHome.title")}</Text>
            <Text style={styles.subtitle}>{t("boycottHome.subtitle")}</Text>
            <View style={styles.analysisRow}>
              <View style={styles.analysisChip}><Ionicons name="alert-circle-outline" size={14} color={colors.goldLight} /><Text style={styles.analysisText}>Boycott</Text></View>
              <View style={styles.analysisChip}><Ionicons name="nutrition-outline" size={14} color={colors.goldLight} /><Text style={styles.analysisText}>{t('boycottHome.health')}</Text></View>
              <View style={styles.analysisChip}><Ionicons name="shield-checkmark-outline" size={14} color={colors.goldLight} /><Text style={styles.analysisText}>Halal</Text></View>
            </View>
            <Pressable onPress={() => router.push('/boycott/scanner')} style={({ pressed }) => [styles.scanButton, pressed && styles.pressed]}>
              <LinearGradient colors={['#D9B15F', '#B98A38']} style={StyleSheet.absoluteFill} />
              <Ionicons name="scan" size={27} color="#17111C" />
              <View style={{ flex: 1 }}><Text style={styles.scanTitle}>{t("boycottHome.scanProduct")}</Text><Text style={styles.scanSubtitle}>{t("boycottHome.instant")}</Text></View>
              <Ionicons name="chevron-forward" size={21} color="#17111C" />
            </Pressable>
          </View>

          {recent.length ? <>
            <View style={styles.recentHeader}><Text style={styles.sectionTitle}>{t("boycottHome.recent")}</Text><Pressable onPress={() => router.push('/boycott/history')} accessibilityRole="button"><Text style={styles.recentAll}>{t("boycottHome.seeAll")}</Text></Pressable></View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.recentRow}>
              {recent.map((item) => {
                const label = item.productName || item.brandLabel || t('boycottHome.productBarcode', { barcode: item.barcode });
                return <Pressable key={item.barcode} onPress={() => router.push({ pathname: '/boycott/scanner', params: { barcode: item.barcode, from: 'history' } } as never)} style={({ pressed }) => [styles.recentCard, pressed && styles.pressed]} accessibilityRole="button" accessibilityLabel={t('boycottHome.openProduct', { name: label })}>
                  <View style={styles.recentImageWrap}><BoycottProductImage contentFit="contain" style={styles.recentImage} uri={item.imageUrl} /></View>
                  <Text style={styles.recentName} numberOfLines={2}>{label}</Text>
                </Pressable>;
              })}
            </ScrollView>
          </> : null}

          <Pressable onPress={() => router.push('/boycott/halal')} style={({ pressed }) => [styles.halalEntry, pressed && styles.pressed]} accessibilityRole="button" accessibilityLabel={t("boycottHome.halalBodiesA11y")}>
            <View style={styles.halalIcon}><Ionicons name="shield-checkmark-outline" size={22} color={colors.goldLight} /></View>
            <View style={{ flex: 1 }}><Text style={styles.contributeTitle}>{t("boycottHome.halalBodies")}</Text><Text style={styles.contributeText}>{t("boycottHome.halalBodiesText")}</Text></View>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </Pressable>

          <View style={styles.searchWrap} onLayout={(event) => { searchYRef.current = event.nativeEvent.layout.y; }}>
            <Ionicons name="search" size={20} color={colors.goldLight} />
            <TextInput ref={searchInputRef} value={query} onChangeText={setQuery} placeholder={t("boycottHome.searchPlaceholder")} placeholderTextColor="#776D81" style={styles.searchInput} autoCorrect={false} />
            {query ? <Pressable onPress={() => setQuery('')}><Ionicons name="close-circle" size={19} color={colors.textMuted} /></Pressable> : null}
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryRow}>
            {CATEGORIES.map((item) => {
              const selected = category === item.key;
              return <Pressable key={item.key} onPress={() => { setCategory(item.key); setBrowsing(true); }} style={[styles.categoryChip, selected && styles.categoryChipActive]}><Ionicons name={item.icon} size={16} color={selected ? '#17111C' : colors.goldLight} /><Text style={[styles.categoryText, selected && styles.categoryTextActive]}>{t(item.label)}</Text></Pressable>;
            })}
          </ScrollView>

          {!showCatalog ? <Pressable onPress={() => setBrowsing(true)} style={({ pressed }) => [styles.browse, pressed && styles.pressed]} accessibilityRole="button">
            <Ionicons name="list-outline" size={20} color={colors.goldLight} />
            <Text style={styles.browseText}>{loading ? t('boycottHome.browse') : t('boycottHome.browseCount', { count: renderableResults.length })}</Text>
            <Ionicons name="chevron-down" size={18} color={colors.textMuted} />
          </Pressable> : <>
          <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>{query || category !== 'all' ? t('boycottHome.results') : t('boycottHome.verified')}</Text><View style={styles.sectionActions}><Text style={styles.sectionCount}>{renderableResults.length}</Text><Pressable onPress={() => { setBrowsing(false); setCategory('all'); setQuery(''); searchInputRef.current?.blur(); }} style={({ pressed }) => [styles.collapse, pressed && styles.pressed]} accessibilityRole="button" accessibilityLabel={t("boycottHome.collapseA11y")}><Text style={styles.collapseText}>{t("boycottHome.collapse")}</Text><Ionicons name="chevron-up" size={15} color={colors.goldLight} /></Pressable></View></View>
          {loading ? <ActivityIndicator color={colors.goldLight} style={{ marginTop: 28 }} /> : renderableResults.length ? <View style={styles.list}>{renderableResults.map((item, index) => <BoycottEntityCard key={`${item.id}-${index}`} item={item} onPress={() => router.push(`/boycott/${item.id}`)} />)}</View> : <View style={styles.empty}><Ionicons name="search-outline" size={30} color={colors.textMuted} /><Text style={styles.emptyTitle}>{t("boycottHome.notFound")}</Text><Text style={styles.emptyText}>{t("boycottHome.notFoundText")}</Text><Pressable onPress={() => router.push('/boycott/add')} style={styles.emptyButton}><Text style={styles.emptyButtonText}>{t("boycottHome.propose")}</Text></Pressable></View>}
          </>}

          <Pressable onPress={() => router.push('/boycott/add')} style={styles.contribute}>
            <Ionicons name="people-outline" size={22} color={colors.goldLight} />
            <View style={{ flex: 1 }}><Text style={styles.contributeTitle}>{t("boycottHome.missing")}</Text><Text style={styles.contributeText}>{t("boycottHome.missingText")}</Text></View>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </Pressable>
        </ScrollView>

        <View pointerEvents="box-none" style={[styles.dockPosition, { bottom: Math.max(insets.bottom, 12) }]}>
          <View style={styles.dockShadow}>
            <LinearGradient colors={['rgba(59,45,76,0.88)', 'rgba(22,15,32,0.94)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.dock}>
              <View pointerEvents="none" style={styles.dockHighlight} />
              <Pressable onPress={() => router.push('/boycott/history')} style={({ pressed }) => [styles.dockSideButton, pressed && styles.dockPressed]} accessibilityLabel={t("boycottHome.historyA11y")}>
                <Ionicons name="time-outline" size={22} color={colors.text} />
                <Text style={styles.dockLabel}>{t("boycottHome.history")}</Text>
              </Pressable>

              <Pressable onPress={() => router.push('/boycott/scanner')} style={({ pressed }) => [styles.dockSideButton, styles.dockScanButton, pressed && styles.dockPressed]} accessibilityLabel={t("boycottHome.scanProduct")}>
                <Ionicons name="qr-code-outline" size={22} color="#17111C" />
                <Text style={styles.dockScanLabel}>{t('boycottHome.scan')}</Text>
              </Pressable>

              <Pressable onPress={openSearch} style={({ pressed }) => [styles.dockSideButton, pressed && styles.dockPressed]} accessibilityLabel={t("boycottHome.searchA11y")}>
                <Ionicons name="search-outline" size={22} color={colors.text} />
                <Text style={styles.dockLabel}>{t("boycottHome.search")}</Text>
              </Pressable>
            </LinearGradient>
          </View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 }, safe: { flex: 1 },
  header: { height: 58, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerButton: { width: 42, height: 42, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.045)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)' },
  headerTitle: { color: colors.text, fontFamily: typography.serifSemibold, fontSize: 23 },
  content: { paddingHorizontal: 16, paddingBottom: 132 },
  hero: { marginTop: 8, padding: 17, borderRadius: 28, backgroundColor: 'rgba(27,18,39,0.84)', borderWidth: 1, borderColor: 'rgba(221,183,101,0.18)' },
  kicker: { color: colors.goldLight, fontFamily: typography.sans, fontSize: 10.5, fontWeight: '800', letterSpacing: 1.45 },
  title: { marginTop: 7, color: colors.text, fontFamily: typography.serifSemibold, fontSize: 28, lineHeight: 32 },
  subtitle: { marginTop: 7, color: colors.textSecondary, fontFamily: typography.sans, fontSize: 13, lineHeight: 19 },
  analysisRow: { marginTop: 11, flexDirection: 'row', gap: 7 },
  analysisChip: { minHeight: 30, paddingHorizontal: 10, borderRadius: 15, flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(221,183,101,0.08)', borderWidth: 1, borderColor: 'rgba(221,183,101,0.18)' },
  analysisText: { color: colors.textSecondary, fontFamily: typography.sans, fontSize: 10, fontWeight: '700' },
  scanButton: { marginTop: 15, minHeight: 70, overflow: 'hidden', borderRadius: 21, flexDirection: 'row', alignItems: 'center', gap: 11, paddingHorizontal: 15 },
  scanTitle: { color: '#17111C', fontFamily: typography.sans, fontSize: 16.5, fontWeight: '800' },
  scanSubtitle: { marginTop: 2, color: 'rgba(23,17,28,0.70)', fontFamily: typography.sans, fontSize: 10.5, fontWeight: '600' },
  pressed: { opacity: 0.82 },
  recentHeader: { marginTop: 18, marginBottom: 9, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  recentAll: { color: colors.goldLight, fontFamily: typography.sans, fontSize: 12, fontWeight: '700' },
  recentRow: { gap: 9, paddingRight: 12 },
  recentCard: { width: 104, padding: 8, borderRadius: 18, backgroundColor: 'rgba(23,16,33,0.92)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  recentImageWrap: { height: 84, borderRadius: 13, overflow: 'hidden', backgroundColor: '#FFF' },
  recentImage: { width: '100%', height: '100%' },
  recentName: { marginTop: 7, color: colors.text, fontFamily: typography.sans, fontSize: 11.5, lineHeight: 15, fontWeight: '700' },
  sectionActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  collapse: { height: 30, paddingHorizontal: 10, borderRadius: 15, flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(221,183,101,0.08)', borderWidth: 1, borderColor: 'rgba(221,183,101,0.20)' },
  collapseText: { color: colors.goldLight, fontFamily: typography.sans, fontSize: 11.5, fontWeight: '700' },
  browse: { minHeight: 54, paddingHorizontal: 15, borderRadius: 20, flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: 'rgba(255,255,255,0.035)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)' },
  browseText: { flex: 1, color: colors.textSecondary, fontFamily: typography.sans, fontSize: 13.5, fontWeight: '700' },
  halalEntry: { marginTop: 12, minHeight: 76, padding: 14, borderRadius: 23, flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: 'rgba(221,183,101,0.06)', borderWidth: 1, borderColor: 'rgba(221,183,101,0.18)' },
  halalIcon: { width: 42, height: 42, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(221,183,101,0.10)' },
  searchWrap: { marginTop: 16, height: 58, borderRadius: 21, paddingHorizontal: 15, flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: 'rgba(24,17,34,0.94)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)' },
  searchInput: { flex: 1, color: colors.text, fontFamily: typography.sans, fontSize: 15.5 },
  categoryRow: { paddingVertical: 13, gap: 7, paddingRight: 12 },
  categoryChip: { height: 36, paddingHorizontal: 11, borderRadius: 18, flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)' },
  categoryChipActive: { backgroundColor: colors.goldLight, borderColor: colors.goldLight }, categoryText: { color: colors.textSecondary, fontFamily: typography.sans, fontSize: 11, fontWeight: '700' }, categoryTextActive: { color: '#17111C' },
  sectionHeader: { marginTop: 4, marginBottom: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, sectionTitle: { color: colors.text, fontFamily: typography.serifMedium, fontSize: 20 }, sectionCount: { color: colors.textMuted, fontFamily: typography.sans, fontSize: 12 },
  list: { gap: 9 },
  empty: { alignItems: 'center', paddingVertical: 34, paddingHorizontal: 18 }, emptyTitle: { marginTop: 10, color: colors.text, fontFamily: typography.serifSemibold, fontSize: 19 }, emptyText: { marginTop: 5, textAlign: 'center', color: colors.textMuted, fontFamily: typography.sans, fontSize: 12.5, lineHeight: 18 }, emptyButton: { marginTop: 15, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(221,183,101,0.25)' }, emptyButtonText: { color: colors.goldLight, fontFamily: typography.sans, fontSize: 11.5, fontWeight: '700' },
  contribute: { marginTop: 20, minHeight: 88, padding: 15, borderRadius: 23, flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: 'rgba(255,255,255,0.035)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)' }, contributeTitle: { color: colors.text, fontFamily: typography.sans, fontSize: 14.5, fontWeight: '700' }, contributeText: { marginTop: 3, color: colors.textMuted, fontFamily: typography.sans, fontSize: 11.5, lineHeight: 17 },
  dockPosition: { position: 'absolute', left: 18, right: 18, alignItems: 'center' },
  dockShadow: { width: '100%', maxWidth: 410, borderRadius: 31, shadowColor: '#000', shadowOpacity: 0.45, shadowRadius: 20, shadowOffset: { width: 0, height: 10 }, elevation: 18 },
  dock: { height: 72, borderRadius: 31, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: 'rgba(255,255,255,0.20)', overflow: 'visible' },
  dockHighlight: { position: 'absolute', left: 20, right: 20, top: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.34)' },
  dockSideButton: { width: 92, height: 58, borderRadius: 24, alignItems: 'center', justifyContent: 'center', gap: 3 },
  dockLabel: { color: colors.textSecondary, fontFamily: typography.sans, fontSize: 10, fontWeight: '700' },
  dockPressed: { backgroundColor: 'rgba(255,255,255,0.08)', transform: [{ scale: 0.97 }] },
  dockScanButton: { backgroundColor: colors.goldLight, borderWidth: 1, borderColor: 'rgba(255,239,191,0.72)', shadowColor: '#E6B95D', shadowOpacity: 0.28, shadowRadius: 9, shadowOffset: { width: 0, height: 3 }, elevation: 8 },
  dockScanLabel: { color: '#17111C', fontFamily: typography.sans, fontSize: 10, fontWeight: '800' },
});
