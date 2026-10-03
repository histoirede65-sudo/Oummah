import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { HalalCertifierDetailSheet, HalalReligiousGuideSheet, type HalalScannedProduct } from '../../components/boycott/HalalCertifierDetailSheet';
import { getBoycottScanHistory } from '../../features/boycott/data/BoycottRepository';
import { analyzeHalalCertification } from '../../features/boycott/halalCertificationAnalyzer';
import { useHalalCertificationBodies } from '../../features/boycott/halalCertificationBodiesLoader';
import { getHalalCertificationBodies, getHalalReligiousGuides, HALAL_CRITERIA, HALAL_DOCUMENTATION_LABELS, type HalalCertificationBody, type HalalCriterionKey, type HalalCriterionStatus, type HalalDocumentationLevel, type HalalReligiousGuide } from '../../features/boycott/halalCertifierRepository';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';

type FilterKey = 'all' | 'france' | 'international' | HalalCriterionKey;

const KEY_CRITERIA: Array<{ key: HalalCriterionKey; label: string }> = [
  { key: 'noStunning', label: 'Sans étourdissement' },
  { key: 'permanentControl', label: 'Contrôleur permanent' },
  { key: 'slaughterer', label: 'Sacrificateur musulman' },
];
const FILTERS: Array<{ key: FilterKey; label: string }> = [
  { key: 'all', label: 'Tous' },
  { key: 'france', label: 'France' },
  { key: 'international', label: 'International' },
  ...KEY_CRITERIA,
];
const STATUS_DISPLAY: Record<HalalCriterionStatus | 'unknown', { icon: keyof typeof Ionicons.glyphMap; color: string; label: string }> = {
  yes: { icon: 'checkmark-circle', color: colors.success, label: 'Oui' },
  partial: { icon: 'remove-circle', color: colors.warning, label: 'Partiel' },
  no: { icon: 'close-circle', color: colors.danger, label: 'Non' },
  unknown: { icon: 'alert-circle-outline', color: colors.danger, label: 'Non garanti' },
};
const STATUS_RANK: Record<HalalCriterionStatus | 'unknown', number> = { yes: 0, partial: 1, unknown: 2, no: 3 };
const LEVEL_ORDER: HalalDocumentationLevel[] = ['documented', 'vigilance', 'to_verify', 'insufficient'];
const LEVEL_TONES: Record<HalalDocumentationLevel, string> = { documented: colors.success, to_verify: colors.warning, vigilance: colors.warning, insufficient: colors.textMuted };
const GUIDE_ICONS: Record<HalalReligiousGuide['id'], keyof typeof Ionicons.glyphMap> = { stunning: 'flash-outline', tasmiya: 'mic-outline', slaughterer: 'person-outline', mechanical: 'cog-outline', contamination: 'git-merge-outline' };

function normalize(value: string) { return value.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase(); }
function isFrench(body: HalalCertificationBody) { return Boolean(body.country && normalize(body.country).startsWith('france')); }
function statusOf(body: HalalCertificationBody, key: HalalCriterionKey) { return body.criteria?.[key]?.status ?? 'unknown'; }

/** Garanties clés d'abord (étourdissement, contrôle, sacrificateur), puis niveau de documentation, puis nom. */
function compareBodies(a: HalalCertificationBody, b: HalalCertificationBody) {
  for (const { key } of KEY_CRITERIA) {
    const diff = STATUS_RANK[statusOf(a, key)] - STATUS_RANK[statusOf(b, key)];
    if (diff) return diff;
  }
  const level = LEVEL_ORDER.indexOf(a.documentationLevel) - LEVEL_ORDER.indexOf(b.documentationLevel);
  return level || a.name.localeCompare(b.name, 'fr', { sensitivity: 'base' });
}

function BodyCard({ body, scannedCount, onPress }: { body: HalalCertificationBody; scannedCount: number; onPress: () => void }) {
  const tone = LEVEL_TONES[body.documentationLevel];
  return <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && styles.pressed]} accessibilityRole="button" accessibilityLabel={`${body.name}, ${KEY_CRITERIA.map(({ key, label }) => `${label} : ${STATUS_DISPLAY[statusOf(body, key)].label}`).join(', ')}`}>
    <View style={styles.cardTop}>
      <View style={styles.cardBody}>
        <Text style={styles.cardTitle}>{body.name}</Text>
        {body.fullName && body.fullName !== body.name ? <Text style={styles.cardSubtitle} numberOfLines={1}>{body.fullName}</Text> : null}
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
    </View>
    <View style={styles.keyList}>{KEY_CRITERIA.map(({ key, label }) => {
      const display = STATUS_DISPLAY[statusOf(body, key)];
      return <View key={key} style={styles.keyRow}>
        <Ionicons name={display.icon} size={15} color={display.color} />
        <Text style={styles.keyLabel}>{label}</Text>
        <Text style={[styles.keyValue, { color: display.color }]}>{display.label}</Text>
      </View>;
    })}</View>
    <View style={styles.cardMeta}>
      <View style={[styles.levelBadge, { borderColor: tone }]}><Text style={[styles.levelText, { color: tone }]}>{HALAL_DOCUMENTATION_LABELS[body.documentationLevel]}</Text></View>
      {body.country ? <Text style={styles.cardCountry}>{body.country}</Text> : null}
      {scannedCount ? <Text style={styles.cardScanned}>· {scannedCount} produit{scannedCount > 1 ? 's' : ''} scanné{scannedCount > 1 ? 's' : ''}</Text> : null}
    </View>
  </Pressable>;
}

export default function HalalBodiesScreen() {
  useHalalCertificationBodies();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<FilterKey>('all');
  const [showHelp, setShowHelp] = useState(false);
  const [selected, setSelected] = useState<HalalCertificationBody | null>(null);
  const [guide, setGuide] = useState<HalalReligiousGuide | null>(null);
  const [scanned, setScanned] = useState<Record<string, HalalScannedProduct[]>>({});
  const bodies = getHalalCertificationBodies();
  const guides = getHalalReligiousGuides();

  // Produits de l'historique regroupés par organisme certificateur (lecture seule, sur cet appareil).
  useFocusEffect(useCallback(() => {
    let active = true;
    void getBoycottScanHistory().then((items) => {
      const byBody: Record<string, HalalScannedProduct[]> = {};
      for (const item of items) {
        const certifierId = analyzeHalalCertification(item.halalData).certifierId;
        if (certifierId) (byBody[certifierId] ??= []).push({ barcode: item.barcode, name: item.productName || item.brandLabel || `Produit ${item.barcode}` });
      }
      if (active) setScanned(byBody);
    });
    return () => { active = false; };
  }, [bodies.length]));

  const groups = useMemo(() => {
    const needle = normalize(query.trim());
    const filtered = bodies
      .filter((body) => !needle || [body.name, body.fullName, ...body.aliases].some((value) => value && normalize(value).includes(needle)))
      .filter((body) => filter === 'all' || (filter === 'france' ? isFrench(body) : filter === 'international' ? !isFrench(body) : statusOf(body, filter) === 'yes'))
      .sort(compareBodies);
    return [
      { key: 'france', title: 'France', items: filtered.filter(isFrench) },
      { key: 'international', title: 'Autres pays', items: filtered.filter((body) => !isFrench(body)) },
    ].filter((group) => group.items.length);
  }, [bodies, query, filter]);

  return (
    <LinearGradient colors={['#090713', '#110A1B', '#090713']} style={styles.screen}>
      <SafeAreaView edges={['top']} style={styles.safe}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.headerButton} accessibilityLabel="Retour"><Ionicons name="arrow-back" size={21} color={colors.goldLight} /></Pressable>
          <Text style={styles.headerTitle}>Organismes halal</Text>
          <Pressable onPress={() => setShowHelp((value) => !value)} style={[styles.headerButton, showHelp && styles.headerButtonActive]} accessibilityLabel="Comment lire les fiches"><Ionicons name="help" size={21} color={colors.goldLight} /></Pressable>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.intro}>Ce que chaque organisme garantit publiquement. Touchez une fiche pour voir ses {HALAL_CRITERIA.length} critères et leurs sources.</Text>

          {showHelp ? <View style={styles.help}>
            <Text style={styles.helpTitle}>Comment lire les fiches</Text>
            {(['yes', 'partial', 'no', 'unknown'] as const).map((status) => <View key={status} style={styles.keyRow}>
              <Ionicons name={STATUS_DISPLAY[status].icon} size={15} color={STATUS_DISPLAY[status].color} />
              <Text style={[styles.keyValue, styles.helpStatus, { color: STATUS_DISPLAY[status].color }]}>{STATUS_DISPLAY[status].label}</Text>
              <Text style={styles.helpText}>{status === 'yes' ? 'L’organisme s’y engage, ou une source identifiée le documente.' : status === 'partial' ? 'Engagement limité à certains produits ou certaines espèces.' : status === 'no' ? 'L’organisme, ou une source datée, indique qu’il accepte la pratique.' : 'L’organisme ne s’y engage pas publiquement et aucune source ne le documente.'}</Text>
            </View>)}
            <Text style={styles.helpNote}>Une grille, pas une note. Le badge (documenté, à vérifier…) indique la qualité des sources, pas une recommandation. La liste est rangée selon les trois garanties affichées.</Text>
          </View> : null}

          <View style={styles.searchWrap}>
            <Ionicons name="search" size={20} color={colors.goldLight} />
            <TextInput value={query} onChangeText={setQuery} placeholder="AVS, Achahada, Mosquée de Paris…" placeholderTextColor="#776D81" style={styles.searchInput} autoCorrect={false} />
            {query ? <Pressable onPress={() => setQuery('')} accessibilityLabel="Effacer"><Ionicons name="close-circle" size={19} color={colors.textMuted} /></Pressable> : null}
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
            {FILTERS.map((item) => {
              const active = filter === item.key;
              return <Pressable key={item.key} onPress={() => setFilter(item.key)} style={[styles.filterChip, active && styles.filterChipActive]} accessibilityRole="button" accessibilityState={{ selected: active }}><Text style={[styles.filterText, active && styles.filterTextActive]}>{item.label}</Text></Pressable>;
            })}
          </ScrollView>

          {groups.map((group) => <View key={group.key}>
            <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>{group.title}</Text><Text style={styles.sectionCount}>{group.items.length}</Text></View>
            <View style={styles.list}>{group.items.map((body) => <BodyCard key={body.id} body={body} scannedCount={scanned[body.id]?.length ?? 0} onPress={() => setSelected(body)} />)}</View>
          </View>)}
          {!groups.length ? <Text style={styles.emptyText}>{bodies.length ? 'Aucun organisme ne correspond à cette recherche.' : 'Chargement des organismes… Une connexion est nécessaire la première fois.'}</Text> : null}

          <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>Comprendre les règles</Text><Text style={styles.sectionCount}>{guides.length}</Text></View>
          <Text style={styles.sectionIntro}>Coran, Sunna, Compagnons et savants de la Sunna, avec leurs sources.</Text>
          {guides.length ? <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.guideRow}>{guides.map((item) => <Pressable key={item.id} onPress={() => setGuide(item)} style={({ pressed }) => [styles.guideCard, pressed && styles.pressed]} accessibilityRole="button" accessibilityLabel={item.title}>
            <View style={styles.guideIcon}><Ionicons name={GUIDE_ICONS[item.id] ?? 'book-outline'} size={18} color={colors.goldLight} /></View>
            <Text style={styles.guideTitle} numberOfLines={2}>{item.title}</Text>
            <Text style={styles.guideQuestion} numberOfLines={3}>{item.question}</Text>
          </Pressable>)}</ScrollView> : <Text style={styles.emptyText}>Chargement des repères… Une connexion est nécessaire la première fois.</Text>}

          <View style={styles.warning}>
            <Ionicons name="information-circle-outline" size={21} color="#E2BF72" />
            <Text style={styles.warningText}>Une fiche décrit l’organisme ; elle ne rend jamais, à elle seule, un produit « non halal ». Les repères religieux expliquent les règles et ne notent aucun organisme.</Text>
          </View>
        </ScrollView>
      </SafeAreaView>
      <HalalCertifierDetailSheet certifier={selected} onClose={() => setSelected(null)} scannedProducts={selected ? scanned[selected.id] : undefined} onOpenProduct={(barcode) => router.push({ pathname: '/boycott/scanner', params: { barcode, from: 'history' } } as never)} />
      <HalalReligiousGuideSheet guide={guide} onClose={() => setGuide(null)} />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  safe: { flex: 1 },
  header: { height: 58, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerButton: { width: 42, height: 42, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.045)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)' },
  headerButtonActive: { backgroundColor: 'rgba(221,183,101,0.14)', borderColor: 'rgba(221,183,101,0.30)' },
  headerTitle: { color: colors.text, fontFamily: typography.serifSemibold, fontSize: 22 },
  content: { paddingHorizontal: 16, paddingBottom: 44 },
  intro: { marginTop: 4, color: colors.textSecondary, fontFamily: typography.sans, fontSize: 13, lineHeight: 19 },
  help: { marginTop: 12, padding: 15, gap: 8, borderRadius: 20, backgroundColor: 'rgba(27,18,39,0.84)', borderWidth: 1, borderColor: 'rgba(221,183,101,0.18)' },
  helpTitle: { color: colors.text, fontFamily: typography.sans, fontSize: 14, fontWeight: '800' },
  helpStatus: { width: 82, flex: 0 },
  helpText: { flex: 1, color: colors.textMuted, fontFamily: typography.sans, fontSize: 11.5, lineHeight: 16 },
  helpNote: { marginTop: 4, color: colors.textMuted, fontFamily: typography.sans, fontSize: 11.5, lineHeight: 17 },
  searchWrap: { marginTop: 14, height: 54, borderRadius: 20, paddingHorizontal: 15, flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: 'rgba(24,17,34,0.94)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)' },
  searchInput: { flex: 1, color: colors.text, fontFamily: typography.sans, fontSize: 15 },
  filterRow: { paddingVertical: 12, gap: 7, paddingRight: 12 },
  filterChip: { height: 34, paddingHorizontal: 12, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)' },
  filterChipActive: { backgroundColor: colors.goldLight, borderColor: colors.goldLight },
  filterText: { color: colors.textSecondary, fontFamily: typography.sans, fontSize: 11.5, fontWeight: '700' },
  filterTextActive: { color: '#17111C' },
  sectionHeader: { marginTop: 14, marginBottom: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { color: colors.text, fontFamily: typography.serifMedium, fontSize: 20 },
  sectionCount: { color: colors.textMuted, fontFamily: typography.sans, fontSize: 12 },
  sectionIntro: { marginBottom: 10, color: colors.textMuted, fontFamily: typography.sans, fontSize: 12.2, lineHeight: 18 },
  list: { gap: 9 },
  card: { padding: 14, borderRadius: 21, backgroundColor: 'rgba(255,255,255,0.035)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)' },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  cardBody: { flex: 1, minWidth: 0 },
  cardTitle: { color: colors.text, fontFamily: typography.sans, fontSize: 15, fontWeight: '800' },
  cardSubtitle: { marginTop: 2, color: colors.textMuted, fontFamily: typography.sans, fontSize: 12, lineHeight: 17 },
  keyList: { marginTop: 10, gap: 5 },
  keyRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  keyLabel: { flex: 1, color: colors.textSecondary, fontFamily: typography.sans, fontSize: 12.5 },
  keyValue: { fontFamily: typography.sans, fontSize: 12, fontWeight: '800' },
  cardMeta: { marginTop: 10, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 },
  levelBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 9, borderWidth: 1, opacity: 0.85 },
  levelText: { fontFamily: typography.sans, fontSize: 10, fontWeight: '700' },
  cardCountry: { color: colors.textMuted, fontFamily: typography.sans, fontSize: 11 },
  cardScanned: { color: colors.goldLight, fontFamily: typography.sans, fontSize: 11, fontWeight: '700' },
  guideRow: { gap: 9, paddingRight: 12 },
  guideCard: { width: 168, padding: 13, borderRadius: 20, backgroundColor: 'rgba(221,183,101,0.05)', borderWidth: 1, borderColor: 'rgba(221,183,101,0.16)' },
  guideIcon: { width: 34, height: 34, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(221,183,101,0.10)' },
  guideTitle: { marginTop: 9, color: colors.text, fontFamily: typography.sans, fontSize: 13.5, fontWeight: '800' },
  guideQuestion: { marginTop: 3, color: colors.textMuted, fontFamily: typography.sans, fontSize: 11.5, lineHeight: 16 },
  emptyText: { marginTop: 10, color: colors.textMuted, fontFamily: typography.sans, fontSize: 12.5, lineHeight: 18 },
  warning: { marginTop: 22, padding: 15, borderRadius: 20, flexDirection: 'row', gap: 10, backgroundColor: 'rgba(226,191,114,0.07)', borderWidth: 1, borderColor: 'rgba(226,191,114,0.18)' },
  warningText: { flex: 1, color: '#CFC5D4', fontFamily: typography.sans, fontSize: 11.8, lineHeight: 18 },
  pressed: { opacity: 0.82 },
});
