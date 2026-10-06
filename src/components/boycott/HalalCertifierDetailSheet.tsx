import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Linking, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { getHalalReligiousGuide, HALAL_CRITERIA, HALAL_CRITERION_KIND_LABELS, HALAL_DOCUMENTATION_LABELS, HALAL_FACT_LABELS, type HalalCertificationBody, type HalalCriterion, type HalalCriterionDefinition, type HalalDocumentationLevel, type HalalFact, type HalalFactKey, type HalalNotice, type HalalReligiousGuide, type HalalReligiousGuideId, type HalalSource } from '../../features/boycott/halalCertifierRepository';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';

// Facts every sheet answers; anything not documented is shown as "Information non vérifiée".
const CORE_FACTS: HalalFactKey[] = ['slaughterMethod', 'stunningPolicy', 'controlMethod', 'traceability', 'audits', 'accreditation'];

const LEVEL_TONES: Record<HalalDocumentationLevel, string> = { documented: colors.success, to_verify: colors.warning, vigilance: colors.warning, insufficient: colors.textMuted };
const LEVEL_ICONS: Record<HalalDocumentationLevel, React.ComponentProps<typeof Ionicons>['name']> = { documented: 'shield-checkmark-outline', to_verify: 'help-circle-outline', vigilance: 'alert-circle-outline', insufficient: 'document-text-outline' };

function formatDate(value?: string) {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

function SourceLinks({ sources }: { sources: HalalSource[] }) {
  return <>{sources.map((source) => <Pressable key={`${source.url}-${source.title}`} accessibilityRole="link" onPress={() => void Linking.openURL(source.url)}><Text style={styles.sourceLink}>{source.organisation} — {source.title}{source.publishedAt ? ` (${formatDate(source.publishedAt)})` : ''} ›</Text></Pressable>)}</>;
}

function FactRow({ label, fact }: { label: string; fact: HalalFact }) {
  return <View style={styles.fact}><Text style={styles.factLabel}>{label}</Text><Text style={styles.factValue}>{fact.value}</Text><SourceLinks sources={fact.sources} /></View>;
}

function NoticeCard({ notice }: { notice: HalalNotice }) {
  const tone = notice.level === 'vigilance' ? colors.warning : colors.textSecondary;
  return <View style={[styles.notice, notice.level === 'vigilance' && styles.noticeVigilance]}>
    <Text style={[styles.noticeKind, { color: tone }]}>{notice.level === 'historical' ? 'Information historique' : notice.level === 'vigilance' ? 'Vigilance' : 'Information'}</Text>
    <Text style={styles.noticeTitle}>{notice.title}</Text>
    <Text style={styles.body}>{notice.summary}</Text>
    {notice.scope ? <Text style={styles.meta}>Portée : {notice.scope}</Text> : null}
    <Text style={styles.meta}>{notice.publishedAt ? `${formatDate(notice.publishedAt)} · ` : ''}{notice.issuedBy}</Text>
    <SourceLinks sources={notice.sources} />
  </View>;
}

type IconName = React.ComponentProps<typeof Ionicons>['name'];
const CRITERION_STATUS: Record<HalalCriterion['status'] | 'unknown', { icon: IconName; color: string; label: string }> = {
  yes: { icon: 'checkmark-circle', color: colors.success, label: 'Déclaré' },
  partial: { icon: 'contrast', color: colors.goldLight, label: 'Partiel' },
  no: { icon: 'close-circle', color: colors.danger, label: 'Non' },
  unknown: { icon: 'help-circle-outline', color: colors.textSecondary, label: 'Non garanti' },
};
const GUIDE_IDS: HalalReligiousGuideId[] = ['stunning', 'tasmiya', 'slaughterer', 'mechanical', 'contamination'];

function CriterionRow({ definition, criterion, open, onToggle, onOpenGuide }: { definition: HalalCriterionDefinition; criterion?: HalalCriterion; open: boolean; onToggle: () => void; onOpenGuide: (id: HalalReligiousGuideId) => void }) {
  const status = CRITERION_STATUS[criterion?.status ?? 'unknown'];
  const guide = getHalalReligiousGuide(definition.guideId);
  return <View style={styles.criterion}>
    <Pressable accessibilityRole="button" accessibilityLabel={`${definition.label} : ${status.label}`} onPress={onToggle} style={styles.criterionHead}>
      <Ionicons name={status.icon} size={20} color={status.color} />
      <View style={styles.criterionCopy}><Text style={styles.criterionLabel}>{definition.label}</Text><Text style={styles.criterionKind}>{HALAL_CRITERION_KIND_LABELS[definition.kind]}</Text></View>
      <Text style={[styles.criterionStatus, { color: status.color }]}>{status.label}</Text>
      <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={16} color={colors.textMuted} />
    </Pressable>
    {open ? <View style={styles.criterionBody}>
      {criterion ? <><Text style={styles.factValue}>{criterion.value}</Text><Text style={styles.meta}>{criterion.sourceStatus === 'verified' ? 'Document officiel indépendant' : criterion.sourceStatus === 'reported' ? 'Rapporté par une source tierce (voir la date)' : 'Déclaré par l’organisme'}</Text><SourceLinks sources={criterion.sources} /></> : <Text style={styles.body}>Non garanti : l’organisme ne s’y engage pas publiquement et aucune source identifiable ne le documente.</Text>}
      <Text style={styles.rule}>{definition.rule}</Text>
      {guide ? <Pressable accessibilityRole="button" onPress={() => onOpenGuide(guide.id)}><Text style={styles.sourceLink}>Repère religieux : {guide.title} ›</Text></Pressable> : null}
    </View> : null}
  </View>;
}

function GuideView({ guide }: { guide: HalalReligiousGuide }) {
  return <>
    <Text style={styles.guideQuestion}>{guide.question}</Text>
    {guide.quran.length ? <Section title="Coran">{guide.quran.map((item) => <View key={item.reference} style={styles.fact}><Text style={styles.factLabel}>{item.reference}</Text><Text style={styles.factValue}>{item.text}</Text></View>)}</Section> : null}
    {guide.sunnah.length ? <Section title="Sunna du Prophète ﷺ">{guide.sunnah.map((item) => <View key={item.reference} style={styles.fact}><Text style={styles.factLabel}>{item.reference}</Text><Text style={styles.factValue}>{item.text}</Text><SourceLinks sources={item.sources} /></View>)}</Section> : null}
    <Section title="Compagnons">{guide.companions.length ? guide.companions.map((item) => <View key={`${item.name}-${item.text}`} style={styles.fact}><Text style={styles.factLabel}>{item.name}</Text><Text style={styles.factValue}>{item.text}</Text><Text style={styles.meta}>{item.reference}</Text><SourceLinks sources={item.sources} /></View>) : <Text style={styles.body}>Aucune parole de Compagnon spécifique à ce sujet n’est retenue à ce jour.</Text>}</Section>
    <Section title="Savants de la Sunna">{guide.scholars.map((item) => <View key={`${item.scholar}-${item.reference}`} style={styles.fact}><Text style={styles.factLabel}>{item.scholar}</Text><Text style={styles.factValue}>{item.position}</Text><Text style={styles.meta}>{item.reference}</Text><SourceLinks sources={item.sources} /></View>)}</Section>
    {guide.agreement ? <Section title="Point d’accord"><Text style={styles.conclusion}>{guide.agreement}</Text></Section> : null}
    {guide.divergence ? <Section title="Divergences"><Text style={styles.conclusion}>{guide.divergence}</Text></Section> : null}
    {guide.reading ? <Section title="Lien avec la certification"><Text style={styles.conclusion}>{guide.reading}</Text><Text style={styles.meta}>Ces repères expliquent les règles ; ils ne notent aucun organisme.</Text></Section> : null}
    <Text style={styles.meta}>Vérifié par OUMMAH le {formatDate(guide.lastVerifiedAt)}</Text>
  </>;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <View style={styles.section}><Text style={styles.sectionTitle}>{title}</Text>{children}</View>;
}

/** A religious guide opened on its own (from the halal bodies page). */
export function HalalReligiousGuideSheet({ guide, onClose }: { guide: HalalReligiousGuide | null; onClose: () => void }) {
  if (!guide) return null;
  return <Modal transparent animationType="slide" visible onRequestClose={onClose}><View style={styles.backdrop}><View style={styles.sheet}>
    <View style={styles.header}>
      <View style={styles.headerCopy}><Text style={styles.kicker}>REPÈRE RELIGIEUX</Text><Text style={styles.name}>{guide.title}</Text></View>
      <Pressable accessibilityLabel="Fermer le repère religieux" onPress={onClose} style={styles.close}><Ionicons name="close" size={22} color={colors.text} /></Pressable>
    </View>
    <ScrollView key={guide.id} showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}><GuideView guide={guide} /></ScrollView>
  </View></View></Modal>;
}

export type HalalScannedProduct = { barcode: string; name: string };

export function HalalCertifierDetailSheet({ certifier, onClose, scannedProducts, onOpenProduct }: { certifier: HalalCertificationBody | null; onClose: () => void; scannedProducts?: HalalScannedProduct[]; onOpenProduct?: (barcode: string) => void }) {
  const [openCriterion, setOpenCriterion] = useState<string | null>(null);
  const [guideId, setGuideId] = useState<HalalReligiousGuideId | null>(null);
  if (!certifier) return null;
  const guide = getHalalReligiousGuide(guideId ?? undefined);
  const criteria = certifier.criteria ?? {};
  const guides = GUIDE_IDS.map((id) => getHalalReligiousGuide(id)).filter((item): item is HalalReligiousGuide => Boolean(item));
  const close = () => { setGuideId(null); setOpenCriterion(null); onClose(); };
  const level = certifier.documentationLevel;
  const tone = LEVEL_TONES[level];
  const entries = Object.entries(certifier.facts) as Array<[HalalFactKey, HalalFact]>;
  const verified = entries.filter(([, fact]) => fact.status === 'verified');
  const declared = entries.filter(([, fact]) => fact.status === 'declared_by_body');
  const missing = CORE_FACTS.filter((key) => !certifier.facts[key]);
  const vigilance = certifier.warnings.filter((notice) => notice.level === 'vigilance');
  const otherNotices = certifier.warnings.filter((notice) => notice.level !== 'vigilance');

  return <Modal transparent animationType="slide" visible onRequestClose={guide ? () => setGuideId(null) : close}><View style={styles.backdrop}><View style={styles.sheet}>
    <View style={styles.header}>
      {guide ? <Pressable accessibilityLabel="Retour à la fiche de l’organisme" onPress={() => setGuideId(null)} style={styles.close}><Ionicons name="chevron-back" size={22} color={colors.text} /></Pressable> : null}
      <View style={styles.headerCopy}><Text style={styles.kicker}>{guide ? 'REPÈRE RELIGIEUX' : 'ORGANISME DE CERTIFICATION HALAL'}</Text><Text style={styles.name}>{guide ? guide.title : certifier.name}</Text>{!guide && certifier.fullName && certifier.fullName !== certifier.name ? <Text style={styles.fullName}>{certifier.fullName}</Text> : null}</View>
      <Pressable accessibilityLabel="Fermer la fiche de l’organisme" onPress={close} style={styles.close}><Ionicons name="close" size={22} color={colors.text} /></Pressable>
    </View>
    {guide ? <ScrollView key={guide.id} showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}><GuideView guide={guide} /></ScrollView> :
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
      <View style={[styles.summary, { borderColor: `${tone}55` }]}>
        <View style={styles.levelRow}><Ionicons name={LEVEL_ICONS[level]} size={22} color={tone} /><Text style={[styles.level, { color: tone }]}>{HALAL_DOCUMENTATION_LABELS[level]}</Text></View>
        {vigilance.length ? <Text style={styles.vigilanceLine}>Des éléments concernant cet organisme nécessitent une vérification complémentaire.</Text> : null}
        <Text style={styles.meta}>Vérifié par OUMMAH le {formatDate(certifier.lastVerifiedAt)}</Text>
        <View style={styles.identity}>
          {certifier.country ? <Text style={styles.identityItem}>{certifier.country}</Text> : null}
          {certifier.bodyType ? <Text style={styles.identityItem}>{certifier.bodyType}</Text> : null}
        </View>
        {certifier.officialWebsite ? <Pressable accessibilityRole="link" onPress={() => void Linking.openURL(certifier.officialWebsite!)}><Text style={styles.sourceLink}>Site officiel ›</Text></Pressable> : <Text style={styles.meta}>Site officiel : information non vérifiée</Text>}
      </View>

      {vigilance.length ? <Section title="Vigilance">{vigilance.map((notice) => <NoticeCard key={notice.id} notice={notice} />)}</Section> : null}

      <Section title="Grille OUMMAH">
        <Text style={styles.body}>Ce que l’organisme publie, ou ce qu’une source identifiée rapporte, sur chaque critère. Ce que rien ne documente est « Non garanti ».</Text>
        {HALAL_CRITERIA.map((definition) => <CriterionRow key={definition.key} definition={definition} criterion={criteria[definition.key]} open={openCriterion === definition.key} onToggle={() => setOpenCriterion((current) => current === definition.key ? null : definition.key)} onOpenGuide={setGuideId} />)}
      </Section>

      {scannedProducts?.length ? <Section title="Vos produits scannés"><Text style={styles.body}>Produits de votre historique portant cette certification.</Text>{scannedProducts.map((product) => <Pressable key={product.barcode} accessibilityRole="button" disabled={!onOpenProduct} onPress={() => { close(); onOpenProduct?.(product.barcode); }} style={styles.guideRow}><Ionicons name="cube-outline" size={18} color={colors.goldLight} /><Text style={styles.guideTitle} numberOfLines={1}>{product.name}</Text>{onOpenProduct ? <Ionicons name="chevron-forward" size={16} color={colors.textMuted} /> : null}</Pressable>)}</Section> : null}

      <Section title="Faits vérifiés">{verified.length ? verified.map(([key, fact]) => <FactRow key={key} label={HALAL_FACT_LABELS[key]} fact={fact} />) : <Text style={styles.body}>Aucun fait confirmé par une source indépendante (institution, document officiel) n’est intégré pour le moment.</Text>}</Section>

      <Section title="Ce que déclare l’organisme">{declared.length ? declared.map(([key, fact]) => <FactRow key={key} label={HALAL_FACT_LABELS[key]} fact={fact} />) : <Text style={styles.body}>Information non vérifiée.</Text>}</Section>

      {missing.length ? <Section title="Non documenté à ce jour">{missing.map((key) => <View key={key} style={styles.missingRow}><Text style={styles.missingLabel}>{HALAL_FACT_LABELS[key]}</Text><Text style={styles.missingValue}>Information non vérifiée</Text></View>)}</Section> : null}

      {otherNotices.length ? <Section title="Informations à connaître">{otherNotices.map((notice) => <NoticeCard key={notice.id} notice={notice} />)}</Section> : null}

      <Section title="Critiques documentées">{certifier.criticisms.length ? certifier.criticisms.map((notice) => <NoticeCard key={notice.id} notice={notice} />) : <Text style={styles.body}>Aucune critique appuyée sur une source primaire n’est intégrée.</Text>}</Section>

      {guides.length ? <Section title="Repères religieux"><Text style={styles.body}>Coran, Sunna, Compagnons et savants de la Sunna, par sujet.</Text>{guides.map((item) => <Pressable key={item.id} accessibilityRole="button" onPress={() => setGuideId(item.id)} style={styles.guideRow}><Ionicons name="book-outline" size={18} color={colors.goldLight} /><Text style={styles.guideTitle}>{item.title}</Text><Ionicons name="chevron-forward" size={16} color={colors.textMuted} /></Pressable>)}</Section> : null}

      <Section title="Conclusion OUMMAH"><Text style={styles.conclusion}>{certifier.summary}</Text><Text style={styles.meta}>Cette fiche décrit l’organisme ; elle ne rend jamais, à elle seule, un produit « non halal ».</Text></Section>

      <Section title="Sources">{certifier.sources.length ? <SourceLinks sources={certifier.sources} /> : <Text style={styles.body}>Aucune source primaire accessible n’est intégrée pour le moment.</Text>}</Section>
    </ScrollView>}
  </View></View></Modal>;
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(4,3,9,0.78)' },
  sheet: { maxHeight: '90%', paddingTop: 22, paddingHorizontal: 20, borderTopLeftRadius: 28, borderTopRightRadius: 28, backgroundColor: colors.backgroundSecondary, borderTopWidth: 1, borderColor: colors.borderSoft },
  header: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, paddingBottom: 12 },
  headerCopy: { flex: 1, minWidth: 0 },
  kicker: { color: colors.goldLight, fontFamily: typography.sans, fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  name: { marginTop: 6, color: colors.text, fontFamily: typography.sans, fontSize: 26, lineHeight: 32, fontWeight: '800' },
  fullName: { marginTop: 2, color: colors.textSecondary, fontFamily: typography.sans, fontSize: 15, lineHeight: 21 },
  close: { width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface },
  content: { paddingBottom: 36 },
  summary: { padding: 16, borderRadius: 20, borderWidth: 1, backgroundColor: colors.surface },
  levelRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  level: { fontFamily: typography.sans, fontSize: 18, lineHeight: 24, fontWeight: '800' },
  vigilanceLine: { marginTop: 10, color: colors.warning, fontFamily: typography.sans, fontSize: 15, lineHeight: 22, fontWeight: '600' },
  identity: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  identityItem: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.06)', color: colors.textSecondary, fontFamily: typography.sans, fontSize: 13, lineHeight: 18 },
  section: { marginTop: 22 },
  sectionTitle: { marginBottom: 6, color: colors.goldLight, fontFamily: typography.sans, fontSize: 13, lineHeight: 18, fontWeight: '800', letterSpacing: 0.4, textTransform: 'uppercase' },
  fact: { marginTop: 10, paddingBottom: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.borderSoft },
  factLabel: { color: colors.textMuted, fontFamily: typography.sans, fontSize: 13, lineHeight: 18, fontWeight: '700' },
  factValue: { marginTop: 4, color: colors.text, fontFamily: typography.sans, fontSize: 15, lineHeight: 22 },
  missingRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, paddingVertical: 9, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.borderSoft },
  missingLabel: { flex: 1, color: colors.textSecondary, fontFamily: typography.sans, fontSize: 14, lineHeight: 20 },
  missingValue: { color: colors.textMuted, fontFamily: typography.sans, fontSize: 13, lineHeight: 20, fontStyle: 'italic' },
  notice: { marginTop: 10, padding: 14, borderRadius: 16, backgroundColor: colors.surface },
  noticeVigilance: { backgroundColor: 'rgba(200,148,58,0.10)' },
  noticeKind: { fontFamily: typography.sans, fontSize: 12, lineHeight: 16, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.4 },
  noticeTitle: { marginTop: 6, color: colors.text, fontFamily: typography.sans, fontSize: 15, lineHeight: 21, fontWeight: '800' },
  body: { marginTop: 6, color: colors.textSecondary, fontFamily: typography.sans, fontSize: 15, lineHeight: 22 },
  conclusion: { color: colors.text, fontFamily: typography.sans, fontSize: 15, lineHeight: 23 },
  criterion: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.borderSoft },
  criterionHead: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12 },
  criterionCopy: { flex: 1, minWidth: 0 },
  criterionLabel: { color: colors.text, fontFamily: typography.sans, fontSize: 15, lineHeight: 20, fontWeight: '700' },
  criterionKind: { marginTop: 2, color: colors.textMuted, fontFamily: typography.sans, fontSize: 12, lineHeight: 16 },
  criterionStatus: { fontFamily: typography.sans, fontSize: 12, lineHeight: 16, fontWeight: '800' },
  criterionBody: { paddingLeft: 30, paddingBottom: 14 },
  rule: { marginTop: 10, padding: 10, borderRadius: 12, overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.04)', color: colors.textSecondary, fontFamily: typography.sans, fontSize: 13, lineHeight: 19 },
  guideRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 13, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.borderSoft },
  guideTitle: { flex: 1, color: colors.text, fontFamily: typography.sans, fontSize: 15, lineHeight: 20, fontWeight: '700' },
  guideQuestion: { marginTop: 4, color: colors.textSecondary, fontFamily: typography.sans, fontSize: 16, lineHeight: 23, fontStyle: 'italic' },
  meta: { marginTop: 8, color: colors.textMuted, fontFamily: typography.sans, fontSize: 13, lineHeight: 18 },
  sourceLink: { marginTop: 8, color: colors.goldLight, fontFamily: typography.sans, fontSize: 13, lineHeight: 19, fontWeight: '700' },
});
