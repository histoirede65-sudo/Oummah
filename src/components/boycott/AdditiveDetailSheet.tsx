import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState, type ReactNode } from 'react';
import { Linking, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { AdditiveInfo } from '../../features/boycott/additiveInfoRepository';
import { getAdditiveScientificConcern, getAdditiveScientificConcernMethodology, type AdditiveScientificConcernRecord } from '../../features/boycott/additiveScientificConcernRepository';
import { fetchSupabaseAdditiveScience, getLocalAdditiveScientificProfile, resolveAdditiveScientificProfile, type AdditiveScientificProfile } from '../../features/boycott/foodAdditiveScienceRepository';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';

const PROOF_LABELS = { insufficient: 'Insuffisante', limited: 'Limitée', moderate: 'Modérée', strong: 'Forte' } as const;
const CONCERN_LABELS = { no_identified_concern: 'Aucune préoccupation identifiée', limited: 'Préoccupation limitée', moderate: 'Préoccupation modérée', high: 'Préoccupation élevée', insufficient_data: 'Données insuffisantes' } as const;
const EXPOSURE_LABELS: Record<string, string> = { below_reference: 'Exposition évaluée sous la valeur de référence', exceedance_signal: 'Signal de dépassement dans l’évaluation disponible', not_quantified: 'Exposition non quantifiée', insufficient_data: 'Données d’exposition insuffisantes' };

function Card({ title, children }: { title: string; children: ReactNode }) { return <View style={styles.card}><Text style={styles.cardTitle}>{title}</Text>{children}</View>; }
function Value({ children }: { children: ReactNode }) { return <Text style={styles.body}>{children}</Text>; }
function readableSignal(signal: any) { return `${signal.hazardClass ?? 'Signal réglementaire'} — ${signal.exposureRoute ?? 'voie non précisée'}`; }
function validUrl(value: unknown): value is string { return typeof value === 'string' && /^https?:\/\//i.test(value); }
function sourceKey(source: any) { return source.url ? String(source.url) : `${source.authority ?? source.organisation ?? ''}|${source.title ?? ''}`; }
function userText(value: string) {
  const labels: Record<string, string | null> = {
    usable_food_hazard_signal: null,
    no_explicit_source_conclusion: 'Aucune conclusion explicite de l’autorité n’est structurée dans les données disponibles.',
    family_assessment_scope_preserved: 'La portée de l’évaluation reste limitée au périmètre documenté.',
    no_harmonised_food_relevant_signal: 'Aucun signal CLP harmonisé directement pertinent pour l’alimentation n’est disponible.',
    scientific_effect_data_not_severity_classifiable: 'Les effets documentés ne permettent pas d’attribuer un niveau de gravité fiable.',
    contextual_clp_only: 'Les classifications disponibles restent contextuelles et ne suffisent pas à établir un niveau alimentaire.',
    handling_hazard_only: 'Les classifications disponibles concernent principalement la manipulation de la substance.',
    route_mismatch: 'La voie d’exposition documentée ne correspond pas directement à l’ingestion alimentaire.',
  };
  return Object.prototype.hasOwnProperty.call(labels, value) ? labels[value] : value;
}

function MethodologyModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const methodology = getAdditiveScientificConcernMethodology() as any;
  return <Modal transparent animationType="slide" visible={visible} onRequestClose={onClose}><View style={styles.backdrop}><View style={styles.methodologySheet}>
    <View style={styles.methodologyHeader}><Text style={styles.methodologyTitle}>Méthodologie</Text><Pressable accessibilityLabel="Fermer la méthodologie" onPress={onClose} style={styles.close}><Ionicons name="close" size={22} color={colors.text} /></Pressable></View>
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
      <Text style={styles.body}>{methodology.definition?.scientificConcern}</Text>
      <Card title="Danger et risque"><Value>{methodology.definition?.exposureRisk}</Value><Text style={styles.meta}>L’exposition reste un axe séparé et ne fusionne pas automatiquement avec la préoccupation scientifique.</Text></Card>
      <Card title="Sources utilisées">{(methodology.acceptedSources ?? []).map((source: string) => <Text key={source} style={styles.body}>• {source}</Text>)}</Card>
      <Card title="Limites">{(methodology.limitations ?? []).map((item: string) => <Text key={item} style={styles.body}>• {item}</Text>)}</Card>
      <Text style={styles.meta}>Version : {methodology.methodologyVersion}</Text>
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
    scientificConcern: { level: 'insufficient_data', confidence: 'low', reasons: ['Les données disponibles ne permettent pas encore d’attribuer un niveau fiable à cet additif.'], limitations: [] },
    exposureRisk: { status: 'insufficient_data', confidence: 'low', reasons: ['Données d’exposition insuffisantes.'] }, usableHazardSignals: [], contextualSignals: [], excludedSignals: [], authorityAssessments: [], sources: [], methodologyVersion: 'oummah-additive-scientific-concern-v1', provenance: { fallback: true },
  };
  const level = CONCERN_LABELS[concern.scientificConcern.level];
  const displayReasons = concern.scientificConcern.reasons.map(userText).filter((reason): reason is string => Boolean(reason));
  const displayLimitations = concern.scientificConcern.limitations.map(userText).filter((reason): reason is string => Boolean(reason));
  const summary = concern.scientificConcern.level === 'insufficient_data' ? 'Les données disponibles ne permettent pas encore d’attribuer un niveau de préoccupation fiable avec la méthodologie OUMMAH.' : (displayReasons[0] ?? 'Un niveau scientifique structuré est disponible pour cet additif.');
  const sources = [...concern.sources.map((source: any) => ({ authority: source.authority ?? source.sourceOrganisation, title: source.title ?? source.sourceLocation, url: source.url ?? source.sourceUrl, year: source.year, sourceType: source.sourceType ?? 'official_information' })), ...profile.sources.map((source) => ({ authority: source.organisation, title: source.title, url: source.url, year: source.publishedAt, sourceType: source.sourceType }))].filter((source) => validUrl((source as any).url)).filter((source, index, all) => all.findIndex((item) => sourceKey(item) === sourceKey(source)) === index);
  const hasContext = displayReasons.length > 0 || displayLimitations.length > 0 || concern.contextualSignals.length > 0 || concern.excludedSignals.length > 0 || concern.authorityAssessments.length > 0;
  return <Modal transparent animationType="slide" visible onRequestClose={onClose}><View style={styles.backdrop}><View style={styles.sheet}>
    <View style={styles.header}><View style={styles.headerCopy}><Text style={styles.kicker}>ADDITIF</Text><Text style={styles.name}>{concern.canonicalName ?? profile.canonicalName ?? additive.name ?? 'Nom non disponible'}</Text><Text style={styles.code}>{additive.code}</Text></View><Pressable accessibilityLabel="Fermer le détail de l’additif" onPress={onClose} style={styles.close}><Ionicons name="close" size={22} color={colors.text} /></Pressable></View>
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
      <View style={[styles.level, concern.scientificConcern.level === 'insufficient_data' && styles.levelNeutral]}><Text style={styles.levelText}>{level}</Text></View>
      <Text style={styles.title}>Niveau de préoccupation scientifique</Text><Text style={styles.summary}>{summary}</Text><Text style={styles.meta}>Confiance : {concern.scientificConcern.confidence === 'low' ? 'faible' : concern.scientificConcern.confidence === 'medium' ? 'moyenne' : 'élevée'}</Text>
      <Pressable onPress={() => setMethodologyOpen(true)} style={styles.methodologyButton}><Ionicons name="book-outline" size={18} color={colors.goldLight} /><Text style={styles.methodologyButtonText}>Méthodologie</Text></Pressable>
      <Card title="Exposition"><Value>{EXPOSURE_LABELS[concern.exposureRisk.status] ?? 'Données d’exposition insuffisantes'}</Value>{concern.exposureRisk.reasons.map((reason) => <Text key={reason} style={styles.meta}>{reason}</Text>)}</Card>
      {hasContext ? <Card title="Comprendre en détail">{displayReasons.map((reason) => <Text key={`reason-${reason}`} style={styles.body}>• {reason}</Text>)}{displayLimitations.map((limitation) => <Text key={`limit-${limitation}`} style={styles.meta}>Limite : {limitation}</Text>)}{concern.usableHazardSignals.length ? <Text style={styles.body}>Signaux alimentaires documentés : {concern.usableHazardSignals.map(readableSignal).join(' ; ')}</Text> : null}{concern.contextualSignals.length ? <Text style={styles.meta}>Certains signaux sont conservés comme contexte, sans être utilisés seuls pour le niveau alimentaire.</Text> : null}{concern.excludedSignals.length ? <Text style={styles.meta}>Certaines classifications concernent la manipulation, l’inhalation ou le contact avec la substance et ne sont pas utilisées directement pour évaluer son usage alimentaire.</Text> : null}{concern.authorityAssessments.map((assessment: any, index) => <Text key={`${assessment.authority}-${assessment.identifier ?? index}`} style={styles.meta}>{assessment.authority ?? 'Autorité'}{assessment.year ? ` · ${assessment.year}` : ''}{assessment.conclusion ? ` — ${assessment.conclusion}` : ''}</Text>)}</Card> : <Card title="Comprendre en détail"><Value>Les données disponibles ne permettent pas encore d’attribuer un niveau fiable à cet additif.</Value></Card>}
      <Card title="Statut réglementaire"><Value>{profile.regulatoryStatus ?? 'Information réglementaire non disponible.'}</Value>{profile.euAuthorized === true ? <Text style={styles.meta}>Autorisé dans l’Union européenne selon les données intégrées.</Text> : null}</Card>
      {profile.exposureAssessment.adiDisplay || additive.acceptableDailyIntake ? <Card title="DJA"><Text style={styles.adi}>{profile.exposureAssessment.adiDisplay ?? additive.acceptableDailyIntake}</Text>{profile.adiAuthority ? <Text style={styles.meta}>Autorité : {profile.adiAuthority}</Text> : null}</Card> : null}
      {profile.healthEffects.length ? <Card title="Effets étudiés">{profile.healthEffects.map((effect) => <View key={`${effect.category}-${effect.effect}`} style={styles.item}><Text style={styles.itemTitle}>{effect.effect}</Text><Text style={styles.meta}>Catégorie : {effect.category} · Preuve {PROOF_LABELS[effect.evidenceStrength]}</Text>{effect.population ? <Text style={styles.meta}>Population : {effect.population}</Text> : null}</View>)}</Card> : null}
      {profile.sensitivePopulations.length ? <Card title="Populations particulières">{profile.sensitivePopulations.map((population) => <Text key={population} style={styles.body}>• {population}</Text>)}</Card> : null}
      {profile.assessmentHistory.length ? <Card title="Historique des évaluations">{profile.assessmentHistory.map((item) => <View key={`${item.organisation}-${item.date}`} style={styles.item}><Text style={styles.itemTitle}>{item.organisation} · {item.date}</Text><Text style={styles.meta}>{item.conclusion}</Text></View>)}</Card> : null}
      <Card title="Fonction et usage">{additive.function ? <Value>{additive.function}</Value> : null}{additive.useSummary ? <Text style={styles.meta}>{additive.useSummary}</Text> : null}</Card>
      <Card title="Sources scientifiques">{sources.length ? sources.map((source: any) => <Pressable key={sourceKey(source)} onPress={() => void Linking.openURL(source.url)} style={styles.source}><Text style={styles.sourceTitle}>{source.authority ?? source.organisation} — {source.title ?? 'Source scientifique'}</Text>{source.year ? <Text style={styles.meta}>{source.year}</Text> : null}<Text style={styles.link}>Ouvrir la source</Text></Pressable>) : <Value>Aucune source scientifique détaillée n’est intégrée pour le moment.</Value>}</Card>
      <Text style={styles.disclaimer}>Ces informations documentent des évaluations scientifiques. Elles ne constituent pas un diagnostic médical et ne permettent pas d’estimer la quantité réellement consommée dans ce produit.</Text>
    </ScrollView>
  </View></View><MethodologyModal visible={methodologyOpen} onClose={() => setMethodologyOpen(false)} /></Modal>;
}

const styles = StyleSheet.create({ backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(4,3,9,0.78)' }, sheet: { maxHeight: '90%', padding: 22, borderTopLeftRadius: 28, borderTopRightRadius: 28, backgroundColor: colors.backgroundSecondary, borderTopWidth: 1, borderColor: colors.borderSoft }, methodologySheet: { maxHeight: '80%', padding: 22, borderTopLeftRadius: 28, borderTopRightRadius: 28, backgroundColor: colors.backgroundSecondary, borderTopWidth: 1, borderColor: colors.borderSoft }, content: { paddingBottom: 22 }, header: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 }, headerCopy: { flex: 1, minWidth: 0 }, kicker: { color: colors.goldLight, fontFamily: typography.sans, fontSize: 10, fontWeight: '800', letterSpacing: 1.1 }, name: { marginTop: 5, color: colors.text, fontFamily: typography.sans, fontSize: 28, lineHeight: 34, fontWeight: '700', flexShrink: 1 }, code: { marginTop: 2, color: colors.textMuted, fontFamily: typography.sans, fontSize: 17, lineHeight: 24, fontWeight: '700' }, close: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface }, level: { alignSelf: 'flex-start', marginTop: 18, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 12, backgroundColor: colors.surface }, levelNeutral: { borderWidth: 1, borderColor: colors.borderSoft }, levelText: { color: colors.goldLight, fontFamily: typography.sans, fontSize: 16, lineHeight: 24, fontWeight: '600' }, title: { marginTop: 20, color: colors.goldLight, fontFamily: typography.sans, fontSize: 22, lineHeight: 28, fontWeight: '700' }, summary: { marginTop: 7, color: colors.text, fontFamily: typography.sans, fontSize: 17, lineHeight: 25 }, methodologyButton: { marginTop: 12, alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 7, paddingVertical: 6 }, methodologyButtonText: { color: colors.goldLight, fontFamily: typography.sans, fontSize: 16, lineHeight: 24, fontWeight: '600' }, methodologyHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }, methodologyTitle: { color: colors.text, fontFamily: typography.sans, fontSize: 22, lineHeight: 28, fontWeight: '700' }, card: { marginTop: 14, padding: 14, borderRadius: 16, backgroundColor: colors.surface }, cardTitle: { color: colors.text, fontFamily: typography.sans, fontSize: 22, lineHeight: 28, fontWeight: '700' }, body: { marginTop: 8, color: colors.textSecondary, fontFamily: typography.sans, fontSize: 17, lineHeight: 25 }, meta: { marginTop: 6, color: colors.textMuted, fontFamily: typography.sans, fontSize: 16, lineHeight: 24 }, adi: { marginTop: 8, color: colors.goldLight, fontFamily: typography.sans, fontSize: 17, lineHeight: 25, fontWeight: '700' }, item: { marginTop: 10 }, itemTitle: { color: colors.text, fontFamily: typography.sans, fontSize: 17, lineHeight: 25, fontWeight: '600' }, source: { marginTop: 10, padding: 12, borderRadius: 14, backgroundColor: colors.backgroundSecondary }, sourceTitle: { color: colors.text, fontFamily: typography.sans, fontSize: 17, lineHeight: 25, fontWeight: '600', flexShrink: 1 }, link: { marginTop: 8, color: colors.goldLight, fontFamily: typography.sans, fontSize: 16, lineHeight: 24, fontWeight: '600' }, disclaimer: { marginTop: 16, color: colors.textMuted, fontFamily: typography.sans, fontSize: 16, lineHeight: 24 } });
