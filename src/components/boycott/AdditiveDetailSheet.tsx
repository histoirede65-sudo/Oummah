import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState, type ReactNode } from 'react';
import { Linking, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { AdditiveInfo } from '../../features/boycott/additiveInfoRepository';
import { fetchSupabaseAdditiveScience, getLocalAdditiveScientificProfile, resolveAdditiveScientificProfile, type AdditiveScientificProfile } from '../../features/boycott/foodAdditiveScienceRepository';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';

const CLASSIFICATION_LABELS = { no_particular_signal: 'Pas de signal particulier', limited_concern: 'Risque limité', moderate_concern: 'Risque modéré', high_concern: 'À risque', insufficient_data: 'Données insuffisantes' } as const;
const PROOF_LABELS = { insufficient: 'Insuffisante', limited: 'Limitée', moderate: 'Modérée', strong: 'Forte' } as const;

function Card({ title, children }: { title: string; children: ReactNode }) { return <View style={styles.card}><Text style={styles.cardTitle}>{title}</Text>{children}</View>; }
function Value({ children }: { children: ReactNode }) { return <Text style={styles.body}>{children}</Text>; }

export function AdditiveDetailSheet({ additive, onClose }: { additive: AdditiveInfo | null; onClose: () => void }) {
  const [profile, setProfile] = useState<AdditiveScientificProfile | null>(null);
  useEffect(() => {
    if (!additive) return;
    let active = true;
    const local = getLocalAdditiveScientificProfile(additive.code);
    setProfile(local);
    void fetchSupabaseAdditiveScience(additive.code).then((remote) => { if (active) setProfile(resolveAdditiveScientificProfile(local, remote)); });
    return () => { active = false; };
  }, [additive]);
  if (!additive || !profile) return null;
  const assessment = profile.assessment;
  const adi = profile.exposureAssessment.adiDisplay ?? additive.acceptableDailyIntake;
  return <Modal transparent animationType="slide" visible onRequestClose={onClose}><View style={styles.backdrop}><View style={styles.sheet}>
    <View style={styles.header}><View style={styles.headerCopy}><Text style={styles.kicker}>ADDITIF</Text><Text style={styles.name}>{profile.canonicalName ?? additive.name ?? 'Nom non disponible'}</Text><Text style={styles.code}>{additive.code}</Text></View><Pressable accessibilityLabel="Fermer le détail de l’additif" onPress={onClose} style={styles.close}><Ionicons name="close" size={22} color={colors.text} /></Pressable></View>
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
      <View style={styles.level}><Text style={styles.levelText}>{CLASSIFICATION_LABELS[assessment.classification]}</Text></View><Text style={styles.title}>Niveau OUMMAH</Text><Text style={styles.summary}>{profile.scientificSummary}</Text>
      <Card title="Statut réglementaire"><Value>{profile.regulatoryStatus ?? 'Information réglementaire non disponible.'}</Value>{profile.euAuthorized === true ? <Text style={styles.meta}>Autorisé dans l’Union européenne selon les données intégrées.</Text> : null}</Card>
      <Card title="Évaluation scientifique"><Value>Gravité : {assessment.severity}</Value><Value>Niveau de preuve : {assessment.evidenceStrength === 'insufficient' ? 'Données insuffisantes' : assessment.evidenceStrength === 'limited' ? 'Preuve limitée' : assessment.evidenceStrength === 'moderate' ? 'Preuve modérée' : 'Preuve forte'}</Value><Value>Exposition : {assessment.exposureConcern}</Value><Text style={styles.meta}>Le niveau de preuve correspond à l’évaluation OUMMAH à partir des sources indiquées.</Text></Card>
      <Card title="DJA">{adi ? <><Text style={styles.adi}>{adi}</Text>{profile.adiAuthority ? <Text style={styles.meta}>Autorité : {profile.adiAuthority}</Text> : null}<Text style={styles.meta}>La DJA correspond à une quantité pouvant être consommée quotidiennement toute la vie sans risque appréciable selon l’autorité qui l’a établie.</Text></> : <Value>DJA non disponible dans les sources intégrées.</Value>}</Card>
      {profile.healthEffects.length ? <Card title="Effets étudiés">{profile.healthEffects.map((effect) => <View key={`${effect.category}-${effect.effect}`} style={styles.item}><Text style={styles.itemTitle}>{effect.effect}</Text><Text style={styles.meta}>Catégorie : {effect.category} · Preuve {PROOF_LABELS[effect.evidenceStrength]}</Text>{effect.population ? <Text style={styles.meta}>Population : {effect.population}</Text> : null}</View>)}</Card> : null}
      {profile.sensitivePopulations.length ? <Card title="Populations particulières">{profile.sensitivePopulations.map((population) => <Text key={population} style={styles.body}>• {population}</Text>)}</Card> : null}
      {profile.assessmentHistory.length ? <Card title="Historique des évaluations">{profile.assessmentHistory.map((item) => <View key={`${item.organisation}-${item.date}`} style={styles.item}><Text style={styles.itemTitle}>{item.organisation} · {item.date}</Text><Text style={styles.meta}>{item.conclusion}</Text></View>)}</Card> : null}
      <Card title="Fonction et usage">{additive.function ? <Value>{additive.function}</Value> : null}{additive.useSummary ? <Text style={styles.meta}>{additive.useSummary}</Text> : null}</Card>
      <Card title="Sources scientifiques">{profile.sources.length ? profile.sources.map((source) => <Pressable key={source.sourceId} onPress={() => void Linking.openURL(source.url)} style={styles.source}><Text style={styles.sourceTitle}>{source.organisation} — {source.title}</Text>{source.publishedAt ? <Text style={styles.meta}>{source.publishedAt}</Text> : null}<Text style={styles.link}>Ouvrir la source</Text></Pressable>) : <Value>Aucune source scientifique détaillée n’est intégrée pour le moment.</Value>}</Card>
      <Text style={styles.disclaimer}>Ces informations documentent des évaluations scientifiques. Elles ne constituent pas un diagnostic médical et ne permettent pas d’estimer la quantité réellement consommée dans ce produit.</Text>
    </ScrollView>
  </View></View></Modal>;
}

const styles = StyleSheet.create({ backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(4,3,9,0.78)' }, sheet: { maxHeight: '90%', padding: 22, borderTopLeftRadius: 28, borderTopRightRadius: 28, backgroundColor: colors.backgroundSecondary, borderTopWidth: 1, borderColor: colors.borderSoft }, content: { paddingBottom: 18 }, header: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 }, headerCopy: { flex: 1, minWidth: 0 }, kicker: { color: colors.goldLight, fontFamily: typography.sans, fontSize: 10, fontWeight: '800', letterSpacing: 1.1 }, name: { marginTop: 5, color: colors.text, fontFamily: typography.serifSemibold, fontSize: 23, flexShrink: 1 }, code: { marginTop: 2, color: colors.textMuted, fontFamily: typography.sans, fontSize: 12, fontWeight: '800' }, close: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface }, level: { alignSelf: 'flex-start', marginTop: 18, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 12, backgroundColor: colors.surface }, levelText: { color: colors.goldLight, fontFamily: typography.sans, fontSize: 12, fontWeight: '800' }, title: { marginTop: 20, color: colors.goldLight, fontFamily: typography.sans, fontSize: 12, fontWeight: '800' }, summary: { marginTop: 7, color: colors.text, fontFamily: typography.sans, fontSize: 15, lineHeight: 21 }, card: { marginTop: 14, padding: 14, borderRadius: 16, backgroundColor: colors.surface }, cardTitle: { color: colors.text, fontFamily: typography.sans, fontSize: 13, fontWeight: '900' }, body: { marginTop: 8, color: colors.textSecondary, fontFamily: typography.sans, fontSize: 13, lineHeight: 19 }, meta: { marginTop: 6, color: colors.textMuted, fontFamily: typography.sans, fontSize: 12, lineHeight: 17 }, adi: { marginTop: 8, color: colors.goldLight, fontFamily: typography.sans, fontSize: 16, fontWeight: '900' }, item: { marginTop: 10 }, itemTitle: { color: colors.text, fontFamily: typography.sans, fontSize: 13, fontWeight: '800', lineHeight: 18 }, source: { marginTop: 10, padding: 12, borderRadius: 14, backgroundColor: colors.backgroundSecondary }, sourceTitle: { color: colors.text, fontFamily: typography.sans, fontSize: 13, lineHeight: 18, flexShrink: 1 }, link: { marginTop: 8, color: colors.goldLight, fontFamily: typography.sans, fontSize: 12, fontWeight: '800' }, disclaimer: { marginTop: 16, color: colors.textMuted, fontFamily: typography.sans, fontSize: 11, lineHeight: 16 } });
