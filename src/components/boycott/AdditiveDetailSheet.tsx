import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState, type ReactNode } from 'react';
import { Linking, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { AdditiveInfo } from '../../features/boycott/additiveInfoRepository';
import { getAdditiveScientificConcern, getAdditiveScientificConcernMethodology, type AdditiveScientificConcernRecord } from '../../features/boycott/additiveScientificConcernRepository';
import { fetchSupabaseAdditiveScience, getLocalAdditiveScientificProfile, resolveAdditiveScientificProfile, type AdditiveScientificProfile } from '../../features/boycott/foodAdditiveScienceRepository';
import { localizedRecord, translate } from '../../i18n';
import { localizeScanText as L } from '../../features/boycott/scanDataTranslations';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';

const PROOF_LABELS = localizedRecord({ insufficient: 'additiveSheet.proofInsufficient', limited: 'additiveSheet.proofLimited', moderate: 'additiveSheet.proofModerate', strong: 'additiveSheet.proofStrong' });
const CONCERN_LABELS = localizedRecord({ no_identified_concern: 'additiveSheet.concernNone', limited: 'additiveSheet.concernLimited', moderate: 'additiveSheet.concernModerate', high: 'additiveSheet.concernHigh', insufficient_data: 'additiveLevel.insufficient' });
const EXPOSURE_LABELS: Record<string, string> = localizedRecord({ below_reference: 'additiveSheet.exposureBelow', exceedance_signal: 'additiveSheet.exposureExceeded', not_quantified: 'additiveSheet.exposureNotQuantified', insufficient_data: 'additiveSheet.exposureInsufficient' });

function Card({ title, children }: { title: string; children: ReactNode }) { return <View style={styles.card}><Text style={styles.cardTitle}>{title}</Text>{children}</View>; }
function Value({ children }: { children: ReactNode }) { return <Text style={styles.body}>{children}</Text>; }
function readableSignal(signal: any) { return `${signal.hazardClass ?? translate('additiveSheet.regSignal')} — ${signal.exposureRoute ?? translate('additiveSheet.routeUnknown')}`; }
function validUrl(value: unknown): value is string { return typeof value === 'string' && /^https?:\/\//i.test(value); }
function sourceKey(source: any) { return source.url ? String(source.url) : `${source.authority ?? source.organisation ?? ''}|${source.title ?? ''}`; }
function userText(value: string) {
  const labels: Record<string, string | null> = {
    usable_food_hazard_signal: null,
    no_explicit_source_conclusion: translate("additiveSheet.noConclusion"),
    family_assessment_scope_preserved: translate("additiveSheet.scopePreserved"),
    no_harmonised_food_relevant_signal: translate("additiveSheet.noClp"),
    scientific_effect_data_not_severity_classifiable: translate("additiveSheet.notClassifiable"),
    contextual_clp_only: translate("additiveSheet.contextualOnly"),
    handling_hazard_only: translate("additiveSheet.handlingOnly"),
    route_mismatch: translate("additiveSheet.routeMismatch"),
  };
  return Object.prototype.hasOwnProperty.call(labels, value) ? labels[value] : L(value);
}

function MethodologyModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const methodology = getAdditiveScientificConcernMethodology() as any;
  return <Modal transparent animationType="slide" visible={visible} onRequestClose={onClose}><View style={styles.backdrop}><View style={styles.methodologySheet}>
    <View style={styles.methodologyHeader}><Text style={styles.methodologyTitle}>{translate("additiveSheet.methodology")}</Text><Pressable accessibilityLabel={translate("scan.closeMethod")} onPress={onClose} style={styles.close}><Ionicons name="close" size={22} color={colors.text} /></Pressable></View>
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
      <Text style={styles.body}>{L(methodology.definition?.scientificConcern)}</Text>
      <Card title={translate("additiveSheet.hazardRisk")}><Value>{L(methodology.definition?.exposureRisk)}</Value><Text style={styles.meta}>{translate("additiveSheet.exposureSeparate")}</Text></Card>
      <Card title={translate("additiveSheet.sourcesUsed")}>{(methodology.acceptedSources ?? []).map((source: string) => <Text key={source} style={styles.body}>• {L(source)}</Text>)}</Card>
      <Card title={translate("additiveSheet.limits")}>{(methodology.limitations ?? []).map((item: string) => <Text key={item} style={styles.body}>• {L(item)}</Text>)}</Card>
      <Text style={styles.meta}>{translate('additiveSheet.version', { version: methodology.methodologyVersion })}</Text>
    </ScrollView>
  </View></View></Modal>;
}

export function AdditiveDetailSheet({ additive, onClose }: { additive: AdditiveInfo | null; onClose: () => void }) {
  const [profile, setProfile] = useState<AdditiveScientificProfile | null>(null);
  const [methodologyOpen, setMethodologyOpen] = useState(false);
  useEffect(() => {
    if (!additive) return;
    let active = true;
    const local = getLocalAdditiveScientificProfile(additive.code);
    setProfile(local);
    void fetchSupabaseAdditiveScience(additive.code).then((remote) => { if (active) setProfile(resolveAdditiveScientificProfile(local, remote)); });
    return () => { active = false; };
  }, [additive]);
  useEffect(() => { if (!additive) setMethodologyOpen(false); }, [additive]);
  if (!additive || !profile) return null;

  const concern: AdditiveScientificConcernRecord = getAdditiveScientificConcern(additive.code) ?? {
    code: additive.code, canonicalName: additive.name ?? additive.code,
    scientificConcern: { level: 'insufficient_data', confidence: 'low', reasons: [translate("additiveSheet.fallbackReason")], limitations: [] },
    exposureRisk: { status: 'insufficient_data', confidence: 'low', reasons: [translate('additiveSheet.exposureInsufficientDot')] }, usableHazardSignals: [], contextualSignals: [], excludedSignals: [], authorityAssessments: [], sources: [], methodologyVersion: 'oummah-additive-scientific-concern-v1', provenance: { fallback: true },
  };
  const level = CONCERN_LABELS[concern.scientificConcern.level];
  const displayReasons = concern.scientificConcern.reasons.map(userText).filter((reason): reason is string => Boolean(reason));
  const displayLimitations = concern.scientificConcern.limitations.map(userText).filter((reason): reason is string => Boolean(reason));
  const summary = concern.scientificConcern.level === 'insufficient_data' ? translate("additiveSheet.summaryInsufficient") : (displayReasons[0] ?? translate("additiveSheet.summaryAvailable"));
  const sources = [...concern.sources.map((source: any) => ({ authority: source.authority ?? source.sourceOrganisation, title: source.title ?? source.sourceLocation, url: source.url ?? source.sourceUrl, year: source.year, sourceType: source.sourceType ?? 'official_information' })), ...profile.sources.map((source) => ({ authority: source.organisation, title: source.title, url: source.url, year: source.publishedAt, sourceType: source.sourceType }))].filter((source) => validUrl((source as any).url)).filter((source, index, all) => all.findIndex((item) => sourceKey(item) === sourceKey(source)) === index);
  const hasContext = displayReasons.length > 0 || displayLimitations.length > 0 || concern.contextualSignals.length > 0 || concern.excludedSignals.length > 0 || concern.authorityAssessments.length > 0;
  return <Modal transparent animationType="slide" visible onRequestClose={onClose}><View style={styles.backdrop}><View style={styles.sheet}>
    <View style={styles.header}><View style={styles.headerCopy}><Text style={styles.kicker}>{translate("additiveSheet.kicker")}</Text><Text style={styles.name}>{L(concern.canonicalName ?? profile.canonicalName ?? additive.name) ?? translate("additiveSheet.noName")}</Text><Text style={styles.code}>{additive.code}</Text></View><Pressable accessibilityLabel={translate("additiveSheet.close")} onPress={onClose} style={styles.close}><Ionicons name="close" size={22} color={colors.text} /></Pressable></View>
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
      <View style={[styles.level, concern.scientificConcern.level === 'insufficient_data' && styles.levelNeutral]}><Text style={styles.levelText}>{level}</Text></View>
      <Text style={styles.title}>{translate("additiveSheet.levelTitle")}</Text><Text style={styles.summary}>{summary}</Text><Text style={styles.meta}>{translate('additiveSheet.confidence', { level: concern.scientificConcern.confidence === 'low' ? translate('additiveSheet.confLow') : concern.scientificConcern.confidence === 'medium' ? translate('additiveSheet.confMedium') : translate('additiveSheet.confHigh') })}</Text>
      <Pressable onPress={() => setMethodologyOpen(true)} style={styles.methodologyButton}><Ionicons name="book-outline" size={18} color={colors.goldLight} /><Text style={styles.methodologyButtonText}>{translate("additiveSheet.methodology")}</Text></Pressable>
      <Card title={translate("additiveSheet.exposure")}><Value>{EXPOSURE_LABELS[concern.exposureRisk.status] ?? translate('additiveSheet.exposureInsufficient')}</Value>{concern.exposureRisk.reasons.map((reason) => <Text key={reason} style={styles.meta}>{L(reason)}</Text>)}</Card>
      {hasContext ? <Card title={translate("additiveSheet.detail")}>{displayReasons.map((reason) => <Text key={`reason-${reason}`} style={styles.body}>• {reason}</Text>)}{displayLimitations.map((limitation) => <Text key={`limit-${limitation}`} style={styles.meta}>{translate('additiveSheet.limit', { limitation })}</Text>)}{concern.usableHazardSignals.length ? <Text style={styles.body}>{translate('additiveSheet.foodSignals', { signals: concern.usableHazardSignals.map(readableSignal).join(' ; ') })}</Text> : null}{concern.contextualSignals.length ? <Text style={styles.meta}>{translate("additiveSheet.contextSignals")}</Text> : null}{concern.excludedSignals.length ? <Text style={styles.meta}>{translate("additiveSheet.excludedSignals")}</Text> : null}{concern.authorityAssessments.map((assessment: any, index) => <Text key={`${assessment.authority}-${assessment.identifier ?? index}`} style={styles.meta}>{assessment.authority ?? translate('additiveSheet.authority')}{assessment.year ? ` · ${assessment.year}` : ''}{assessment.conclusion ? ` — ${L(assessment.conclusion)}` : ''}</Text>)}</Card> : <Card title={translate("additiveSheet.detail")}><Value>{translate("additiveSheet.fallbackReason")}</Value></Card>}
      <Card title={translate("additiveSheet.regulatory")}><Value>{L(profile.regulatoryStatus) ?? translate("additiveSheet.regulatoryNone")}</Value>{profile.euAuthorized === true ? <Text style={styles.meta}>{translate("additiveSheet.euAuthorised")}</Text> : null}</Card>
      {profile.exposureAssessment.adiDisplay || additive.acceptableDailyIntake ? <Card title={translate('additiveSheet.adi')}><Text style={styles.adi}>{L(profile.exposureAssessment.adiDisplay ?? additive.acceptableDailyIntake)}</Text>{profile.adiAuthority ? <Text style={styles.meta}>{translate('additiveSheet.authorityLine', { authority: profile.adiAuthority })}</Text> : null}</Card> : null}
      {profile.healthEffects.length ? <Card title={translate("additiveSheet.effects")}>{profile.healthEffects.map((effect) => <View key={`${effect.category}-${effect.effect}`} style={styles.item}><Text style={styles.itemTitle}>{L(effect.effect)}</Text><Text style={styles.meta}>{translate('additiveSheet.effectMeta', { category: L(effect.category), proof: PROOF_LABELS[effect.evidenceStrength] })}</Text>{effect.population ? <Text style={styles.meta}>{translate('additiveSheet.population', { population: L(effect.population) })}</Text> : null}</View>)}</Card> : null}
      {profile.sensitivePopulations.length ? <Card title={translate("additiveSheet.populations")}>{profile.sensitivePopulations.map((population) => <Text key={population} style={styles.body}>• {L(population)}</Text>)}</Card> : null}
      {profile.assessmentHistory.length ? <Card title={translate("additiveSheet.history")}>{profile.assessmentHistory.map((item) => <View key={`${item.organisation}-${item.date}`} style={styles.item}><Text style={styles.itemTitle}>{item.organisation} · {item.date}</Text><Text style={styles.meta}>{L(item.conclusion)}</Text></View>)}</Card> : null}
      <Card title={translate("additiveSheet.function")}>{additive.function ? <Value>{L(additive.function)}</Value> : null}{additive.useSummary ? <Text style={styles.meta}>{L(additive.useSummary)}</Text> : null}</Card>
      <Card title={translate("scan.sciSources")}>{sources.length ? sources.map((source: any) => <Pressable key={sourceKey(source)} onPress={() => void Linking.openURL(source.url)} style={styles.source}><Text style={styles.sourceTitle}>{source.authority ?? source.organisation} — {L(source.title) ?? translate("additiveSheet.sciSource")}</Text>{source.year ? <Text style={styles.meta}>{source.year}</Text> : null}<Text style={styles.link}>{translate("additiveSheet.openSource")}</Text></Pressable>) : <Value>{translate("additiveSheet.noSources")}</Value>}</Card>
      <Text style={styles.disclaimer}>{translate("additiveSheet.disclaimer")}</Text>
    </ScrollView>
  </View></View><MethodologyModal visible={methodologyOpen} onClose={() => setMethodologyOpen(false)} /></Modal>;
}

const styles = StyleSheet.create({ backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(4,3,9,0.78)' }, sheet: { maxHeight: '90%', padding: 22, borderTopLeftRadius: 28, borderTopRightRadius: 28, backgroundColor: colors.backgroundSecondary, borderTopWidth: 1, borderColor: colors.borderSoft }, methodologySheet: { maxHeight: '80%', padding: 22, borderTopLeftRadius: 28, borderTopRightRadius: 28, backgroundColor: colors.backgroundSecondary, borderTopWidth: 1, borderColor: colors.borderSoft }, content: { paddingBottom: 22 }, header: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 }, headerCopy: { flex: 1, minWidth: 0 }, kicker: { color: colors.goldLight, fontFamily: typography.sans, fontSize: 10, fontWeight: '800', letterSpacing: 1.1 }, name: { marginTop: 5, color: colors.text, fontFamily: typography.sans, fontSize: 28, lineHeight: 34, fontWeight: '700', flexShrink: 1 }, code: { marginTop: 2, color: colors.textMuted, fontFamily: typography.sans, fontSize: 17, lineHeight: 24, fontWeight: '700' }, close: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface }, level: { alignSelf: 'flex-start', marginTop: 18, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 12, backgroundColor: colors.surface }, levelNeutral: { borderWidth: 1, borderColor: colors.borderSoft }, levelText: { color: colors.goldLight, fontFamily: typography.sans, fontSize: 16, lineHeight: 24, fontWeight: '600' }, title: { marginTop: 20, color: colors.goldLight, fontFamily: typography.sans, fontSize: 22, lineHeight: 28, fontWeight: '700' }, summary: { marginTop: 7, color: colors.text, fontFamily: typography.sans, fontSize: 17, lineHeight: 25 }, methodologyButton: { marginTop: 12, alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 7, paddingVertical: 6 }, methodologyButtonText: { color: colors.goldLight, fontFamily: typography.sans, fontSize: 16, lineHeight: 24, fontWeight: '600' }, methodologyHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }, methodologyTitle: { color: colors.text, fontFamily: typography.sans, fontSize: 22, lineHeight: 28, fontWeight: '700' }, card: { marginTop: 14, padding: 14, borderRadius: 16, backgroundColor: colors.surface }, cardTitle: { color: colors.text, fontFamily: typography.sans, fontSize: 22, lineHeight: 28, fontWeight: '700' }, body: { marginTop: 8, color: colors.textSecondary, fontFamily: typography.sans, fontSize: 17, lineHeight: 25 }, meta: { marginTop: 6, color: colors.textMuted, fontFamily: typography.sans, fontSize: 16, lineHeight: 24 }, adi: { marginTop: 8, color: colors.goldLight, fontFamily: typography.sans, fontSize: 17, lineHeight: 25, fontWeight: '700' }, item: { marginTop: 10 }, itemTitle: { color: colors.text, fontFamily: typography.sans, fontSize: 17, lineHeight: 25, fontWeight: '600' }, source: { marginTop: 10, padding: 12, borderRadius: 14, backgroundColor: colors.backgroundSecondary }, sourceTitle: { color: colors.text, fontFamily: typography.sans, fontSize: 17, lineHeight: 25, fontWeight: '600', flexShrink: 1 }, link: { marginTop: 8, color: colors.goldLight, fontFamily: typography.sans, fontSize: 16, lineHeight: 24, fontWeight: '600' }, disclaimer: { marginTop: 16, color: colors.textMuted, fontFamily: typography.sans, fontSize: 16, lineHeight: 24 } });
