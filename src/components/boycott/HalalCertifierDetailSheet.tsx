import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Linking, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { getHalalReligiousGuide, HALAL_CRITERIA, HALAL_CRITERION_KIND_LABELS, HALAL_DOCUMENTATION_LABELS, HALAL_FACT_LABELS, type HalalCertificationBody, type HalalCriterion, type HalalCriterionDefinition, type HalalDocumentationLevel, type HalalFact, type HalalFactKey, type HalalNotice, type HalalReligiousGuide, type HalalReligiousGuideId, type HalalSource } from '../../features/boycott/halalCertifierRepository';
import { getActiveLanguage, translate } from '../../i18n';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';

// Facts every sheet answers; anything not documented is shown as translate("certSheet.notVerified").
const CORE_FACTS: HalalFactKey[] = ['slaughterMethod', 'stunningPolicy', 'controlMethod', 'traceability', 'audits', 'accreditation'];

const LEVEL_TONES: Record<HalalDocumentationLevel, string> = { documented: colors.success, to_verify: colors.warning, vigilance: colors.warning, insufficient: colors.textMuted };
const LEVEL_ICONS: Record<HalalDocumentationLevel, React.ComponentProps<typeof Ionicons>['name']> = { documented: 'shield-checkmark-outline', to_verify: 'help-circle-outline', vigilance: 'alert-circle-outline', insufficient: 'document-text-outline' };

function formatDate(value?: string) {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString(getActiveLanguage() === 'en' ? 'en-GB' : 'fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
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
    <Text style={[styles.noticeKind, { color: tone }]}>{notice.level === 'historical' ? translate('infoStatus.historical') : notice.level === 'vigilance' ? translate('certSheet.vigilance') : translate('certSheet.information')}</Text>
    <Text style={styles.noticeTitle}>{notice.title}</Text>
    <Text style={styles.body}>{notice.summary}</Text>
    {notice.scope ? <Text style={styles.meta}>{translate('certSheet.scope', { scope: notice.scope })}</Text> : null}
    <Text style={styles.meta}>{notice.publishedAt ? `${formatDate(notice.publishedAt)} · ` : ''}{notice.issuedBy}</Text>
    <SourceLinks sources={notice.sources} />
  </View>;
}

type IconName = React.ComponentProps<typeof Ionicons>['name'];
const CRITERION_STATUS: Record<HalalCriterion['status'] | 'unknown', { icon: IconName; color: string; readonly label: string }> = {
  yes: { icon: 'checkmark-circle', color: colors.success, get label() { return translate('certSheet.declared'); } },
  partial: { icon: 'contrast', color: colors.goldLight, get label() { return translate('certSheet.partial'); } },
  no: { icon: 'close-circle', color: colors.danger, get label() { return translate('certSheet.no'); } },
  unknown: { icon: 'help-circle-outline', color: colors.textSecondary, get label() { return translate('certSheet.notGuaranteed'); } },
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
      {criterion ? <><Text style={styles.factValue}>{criterion.value}</Text><Text style={styles.meta}>{criterion.sourceStatus === 'verified' ? translate("certSheet.officialDoc") : criterion.sourceStatus === 'reported' ? translate("certSheet.reported") : translate("certSheet.declaredByBody")}</Text><SourceLinks sources={criterion.sources} /></> : <Text style={styles.body}>{translate("certSheet.notGuaranteedText")}</Text>}
      <Text style={styles.rule}>{definition.rule}</Text>
      {guide ? <Pressable accessibilityRole="button" onPress={() => onOpenGuide(guide.id)}><Text style={styles.sourceLink}>{translate('certSheet.guideLink', { title: guide.title })} ›</Text></Pressable> : null}
    </View> : null}
  </View>;
}

function GuideView({ guide }: { guide: HalalReligiousGuide }) {
  return <>
    <Text style={styles.guideQuestion}>{guide.question}</Text>
    {guide.quran.length ? <Section title={translate('certSheet.quran')}>{guide.quran.map((item) => <View key={item.reference} style={styles.fact}><Text style={styles.factLabel}>{item.reference}</Text><Text style={styles.factValue}>{item.text}</Text></View>)}</Section> : null}
    {guide.sunnah.length ? <Section title={translate("certSheet.sunnah")}>{guide.sunnah.map((item) => <View key={item.reference} style={styles.fact}><Text style={styles.factLabel}>{item.reference}</Text><Text style={styles.factValue}>{item.text}</Text><SourceLinks sources={item.sources} /></View>)}</Section> : null}
    <Section title={translate('certSheet.companions')}>{guide.companions.length ? guide.companions.map((item) => <View key={`${item.name}-${item.text}`} style={styles.fact}><Text style={styles.factLabel}>{item.name}</Text><Text style={styles.factValue}>{item.text}</Text><Text style={styles.meta}>{item.reference}</Text><SourceLinks sources={item.sources} /></View>) : <Text style={styles.body}>{translate("certSheet.noCompanion")}</Text>}</Section>
    <Section title={translate("certSheet.scholars")}>{guide.scholars.map((item) => <View key={`${item.scholar}-${item.reference}`} style={styles.fact}><Text style={styles.factLabel}>{item.scholar}</Text><Text style={styles.factValue}>{item.position}</Text><Text style={styles.meta}>{item.reference}</Text><SourceLinks sources={item.sources} /></View>)}</Section>
    {guide.agreement ? <Section title={translate("certSheet.agreement")}><Text style={styles.conclusion}>{guide.agreement}</Text></Section> : null}
    {guide.divergence ? <Section title={translate('certSheet.divergence')}><Text style={styles.conclusion}>{guide.divergence}</Text></Section> : null}
    {guide.reading ? <Section title={translate("certSheet.linkCert")}><Text style={styles.conclusion}>{guide.reading}</Text><Text style={styles.meta}>{translate("certSheet.guideNote")}</Text></Section> : null}
    <Text style={styles.meta}>{translate('certSheet.verifiedOn', { date: formatDate(guide.lastVerifiedAt) ?? '' })}</Text>
    {getActiveLanguage() === 'en' ? <Text style={styles.meta}>{translate('certSheet.guideAiNote')}</Text> : null}
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
      <View style={styles.headerCopy}><Text style={styles.kicker}>{translate("certSheet.guideKicker")}</Text><Text style={styles.name}>{guide.title}</Text></View>
      <Pressable accessibilityLabel={translate("certSheet.closeGuide")} onPress={onClose} style={styles.close}><Ionicons name="close" size={22} color={colors.text} /></Pressable>
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
      {guide ? <Pressable accessibilityLabel={translate("certSheet.backToBody")} onPress={() => setGuideId(null)} style={styles.close}><Ionicons name="chevron-back" size={22} color={colors.text} /></Pressable> : null}
      <View style={styles.headerCopy}><Text style={styles.kicker}>{guide ? translate('certSheet.guideKicker') : translate('certSheet.kicker')}</Text><Text style={styles.name}>{guide ? guide.title : certifier.name}</Text>{!guide && certifier.fullName && certifier.fullName !== certifier.name ? <Text style={styles.fullName}>{certifier.fullName}</Text> : null}</View>
      <Pressable accessibilityLabel={translate("certSheet.closeBody")} onPress={close} style={styles.close}><Ionicons name="close" size={22} color={colors.text} /></Pressable>
    </View>
    {guide ? <ScrollView key={guide.id} showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}><GuideView guide={guide} /></ScrollView> :
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
      <View style={[styles.summary, { borderColor: `${tone}55` }]}>
        <View style={styles.levelRow}><Ionicons name={LEVEL_ICONS[level]} size={22} color={tone} /><Text style={[styles.level, { color: tone }]}>{HALAL_DOCUMENTATION_LABELS[level]}</Text></View>
        {vigilance.length ? <Text style={styles.vigilanceLine}>{translate("certSheet.vigilanceLine")}</Text> : null}
        <Text style={styles.meta}>{translate('certSheet.verifiedOn', { date: formatDate(certifier.lastVerifiedAt) ?? '' })}</Text>
        <View style={styles.identity}>
          {certifier.country ? <Text style={styles.identityItem}>{certifier.country}</Text> : null}
          {certifier.bodyType ? <Text style={styles.identityItem}>{certifier.bodyType}</Text> : null}
        </View>
        {certifier.officialWebsite ? <Pressable accessibilityRole="link" onPress={() => void Linking.openURL(certifier.officialWebsite!)}><Text style={styles.sourceLink}>{translate('certSheet.website')} ›</Text></Pressable> : <Text style={styles.meta}>{translate("certSheet.websiteUnknown")}</Text>}
      </View>

      {vigilance.length ? <Section title={translate('certSheet.vigilance')}>{vigilance.map((notice) => <NoticeCard key={notice.id} notice={notice} />)}</Section> : null}

      <Section title={translate("certSheet.grid")}>
        <Text style={styles.body}>{translate("certSheet.gridText")}</Text>
        {HALAL_CRITERIA.map((definition) => <CriterionRow key={definition.key} definition={definition} criterion={criteria[definition.key]} open={openCriterion === definition.key} onToggle={() => setOpenCriterion((current) => current === definition.key ? null : definition.key)} onOpenGuide={setGuideId} />)}
      </Section>

      {scannedProducts?.length ? <Section title={translate("certSheet.yourProducts")}><Text style={styles.body}>{translate("certSheet.yourProductsText")}</Text>{scannedProducts.map((product) => <Pressable key={product.barcode} accessibilityRole="button" disabled={!onOpenProduct} onPress={() => { close(); onOpenProduct?.(product.barcode); }} style={styles.guideRow}><Ionicons name="cube-outline" size={18} color={colors.goldLight} /><Text style={styles.guideTitle} numberOfLines={1}>{product.name}</Text>{onOpenProduct ? <Ionicons name="chevron-forward" size={16} color={colors.textMuted} /> : null}</Pressable>)}</Section> : null}

      <Section title={translate("certSheet.verifiedFacts")}>{verified.length ? verified.map(([key, fact]) => <FactRow key={key} label={HALAL_FACT_LABELS[key]} fact={fact} />) : <Text style={styles.body}>{translate("certSheet.noVerified")}</Text>}</Section>

      <Section title={translate("certSheet.bodyDeclares")}>{declared.length ? declared.map(([key, fact]) => <FactRow key={key} label={HALAL_FACT_LABELS[key]} fact={fact} />) : <Text style={styles.body}>{translate("certSheet.notVerifiedDot")}</Text>}</Section>

      {missing.length ? <Section title={translate("certSheet.undocumented")}>{missing.map((key) => <View key={key} style={styles.missingRow}><Text style={styles.missingLabel}>{HALAL_FACT_LABELS[key]}</Text><Text style={styles.missingValue}>{translate("certSheet.notVerified")}</Text></View>)}</Section> : null}

      {otherNotices.length ? <Section title={translate("certSheet.toKnow")}>{otherNotices.map((notice) => <NoticeCard key={notice.id} notice={notice} />)}</Section> : null}

      <Section title={translate("certSheet.criticisms")}>{certifier.criticisms.length ? certifier.criticisms.map((notice) => <NoticeCard key={notice.id} notice={notice} />) : <Text style={styles.body}>{translate("certSheet.noCriticism")}</Text>}</Section>

      {guides.length ? <Section title={translate("certSheet.guides")}><Text style={styles.body}>{translate("certSheet.guidesText")}</Text>{guides.map((item) => <Pressable key={item.id} accessibilityRole="button" onPress={() => setGuideId(item.id)} style={styles.guideRow}><Ionicons name="book-outline" size={18} color={colors.goldLight} /><Text style={styles.guideTitle}>{item.title}</Text><Ionicons name="chevron-forward" size={16} color={colors.textMuted} /></Pressable>)}</Section> : null}

      <Section title={translate("certSheet.conclusion")}><Text style={styles.conclusion}>{certifier.summary}</Text>{getActiveLanguage() === 'en' ? <Text style={styles.meta}>{translate('certSheet.sheetAiNote')}</Text> : null}<Text style={styles.meta}>{translate("certSheet.conclusionNote")}</Text></Section>

      <Section title={translate('dossier.sources')}>{certifier.sources.length ? <SourceLinks sources={certifier.sources} /> : <Text style={styles.body}>{translate("certSheet.noPrimary")}</Text>}</Section>
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
