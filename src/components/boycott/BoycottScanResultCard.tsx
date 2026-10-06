import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, LayoutAnimation, Linking, Modal, PanResponder, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { BarcodeLookupResult } from '../../features/boycott/data/BoycottRepository';
import type { BoycottEntity } from '../../features/boycott/domain/BoycottEntity';
import { analyzeHealthIngredients, type HealthFinding } from '../../features/boycott/healthIngredientAnalyzer';
import { analyzeHealthScore as analyzeHealthScoreBase, getHealthGradeForScore, getHealthGradePresentation, HEALTH_SCORE_METHODOLOGY_TEXT, HEALTH_SCORE_VERSION, type HealthScoreResult } from '../../features/boycott/healthScoreAnalyzer';
import { analyzeHalalCertification } from '../../features/boycott/halalCertificationAnalyzer';
import { getConfirmedCertifier } from '../../features/boycott/halalCertifierReports';
import { HalalCertifierReportSheet } from './HalalCertifierReportSheet';
import { findProductAlternatives, type ProductAlternative as AlternativeProduct } from '../../features/boycott/productAlternatives';
import { getBoycottCatalog } from '../../features/boycott/data/BoycottRepository';
import { findActiveRecalls, type ProductRecall } from '../../features/boycott/productRecalls';
import { PRODUCT_ALTERNATIVES_ENABLED } from '../../features/boycott/productAlternativesConfig';
import { getAdditiveInfo } from '../../features/boycott/additiveInfoRepository';
import { getAdditiveScientificConcern, type AdditiveScientificConcernLevel } from '../../features/boycott/additiveScientificConcernRepository';
import { getBrandControversyDossier, CONTROVERSY_CATEGORY_LABELS, STATUS_LABELS, type BrandControversy } from '../../features/boycott/brandControversyRepository';
import { getActiveHalalCertifierNotices, getHalalCertifier, HALAL_DOCUMENTATION_LABELS } from '../../features/boycott/halalCertifierRepository';
import { useHalalCertificationBodies } from '../../features/boycott/halalCertificationBodiesLoader';
import { AdditiveDetailSheet } from './AdditiveDetailSheet';
import { BrandControversyDetailSheet } from './BrandControversyDetailSheet';
import { HalalCertifierDetailSheet } from './HalalCertifierDetailSheet';
import { BoycottProductImage } from './BoycottProductImage';
import { prefetchBoycottImages } from '../../features/boycott/boycottImageCache';
import { invalidateProductImage, resolveProductImage } from '../../features/boycott/productImageResolver';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';

type Props = { result: BarcodeLookupResult; onClose: () => void; onOpenEntity: () => void; onOpenAlternative: (barcode: string) => void; onPropose: () => void; primaryLabel?: string; /** Opened from a link (alternative, history): full sheet at once. */ startExpanded?: boolean };
type IconName = React.ComponentProps<typeof Ionicons>['name'];

function LegacyHealthMethodologySheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const sources = ['E150D', 'E331', 'E338', 'E950', 'E951'].flatMap((code) => getAdditiveInfo(code).sources).filter((source, index, all) => all.findIndex((item) => item.url === source.url) === index);
  return <Modal transparent animationType="slide" visible={visible} onRequestClose={onClose}><View style={styles.backdrop}><View style={styles.cardShell}><View style={styles.heading}><Text style={styles.sectionTitle}>Indice Santé OUMMAH v{HEALTH_SCORE_VERSION}</Text><Pressable accessibilityLabel="Fermer la méthodologie" onPress={onClose} style={styles.close}><Ionicons name="close" size={22} color={colors.text} /></Pressable></View><ScrollView showsVerticalScrollIndicator={false}>
    <Text style={styles.muted}>{HEALTH_SCORE_METHODOLOGY_TEXT}</Text><Text style={styles.groupTitle}>Formule publique</Text><Text style={styles.muted}>Score final = 0,50 × nutrition + 0,30 × additifs + 0,20 × transformation. Si un pilier secondaire manque, les poids disponibles sont renormalisés ; la nutrition reste obligatoire. Additifs : −15 par signal limité, −30 par signal modéré et plafond à 20/100 lorsqu’un signal élevé est présent. Les données insuffisantes et les signaux sans particularité n’ajoutent aucune pénalité. NOVA 4 est évalué à 20/100. Cette calibration est propre à OUMMAH et ne reproduit pas une note externe.</Text><Text style={styles.groupTitle}>Piliers</Text><Text style={styles.muted}>• Nutrition : 50 % — Nutri-Score officiel OpenFoodFacts, sans recalcul.</Text><Text style={styles.muted}>• Additifs : 30 % — classification scientifique OUMMAH par additif.</Text><Text style={styles.muted}>• Transformation : 20 % — groupe NOVA.</Text><Text style={styles.groupTitle}>Interprétation</Text><Text style={styles.muted}>A : 80–100{`\n`}B : 65–79,9{`\n`}C : 50–64,9{`\n`}D : 30–49,9{`\n`}E : 0–29,9</Text><Text style={styles.groupTitle}>Ce qui n’entre pas dans la note</Text><Text style={styles.muted}>Halal, boycott, controverses, certifications halal et allergènes comme pénalité générale.</Text><Text style={styles.disclaimer}>Cette méthodologie est propre à OUMMAH. Elle ne constitue pas une note officielle d’une autorité sanitaire.</Text><Text style={styles.groupTitle}>Sources scientifiques</Text>{sources.map((source) => <Pressable key={source.url} onPress={() => void Linking.openURL(source.url)}><Text style={styles.toggleText}>{source.organisation} — {source.title}</Text></Pressable>)}
  </ScrollView></View></View></Modal>;
}

const SCIENTIFIC_CONCERN_LABELS: Record<AdditiveScientificConcernLevel, string> = {
  no_identified_concern: 'sans préoccupation identifiée',
  limited: 'avec préoccupation limitée',
  moderate: 'avec préoccupation modérée',
  high: 'avec préoccupation élevée',
  insufficient_data: 'avec données scientifiques insuffisantes',
};

// Product photos must be upright (portrait or near-square); landscape / lying photos fall back to the placeholder.
const isUsableProductPhoto = (source: { width: number; height: number }) => source.width > 0 && source.height > 0 && source.width <= source.height * 1.15;

function getScientificAdditiveSummary(items: HealthFinding[]): string | null {
  const codes = [...new Set(items.map((item) => item.additiveCode?.trim().toUpperCase()).filter((code): code is string => Boolean(code)))];
  if (!codes.length) return null;
  const counts: Record<AdditiveScientificConcernLevel, number> = { no_identified_concern: 0, limited: 0, moderate: 0, high: 0, insufficient_data: 0 };
  for (const code of codes) counts[getAdditiveScientificConcern(code)?.scientificConcern.level ?? 'insufficient_data'] += 1;
  const details = (Object.keys(SCIENTIFIC_CONCERN_LABELS) as AdditiveScientificConcernLevel[]).filter((level) => counts[level] > 0).map((level) => `${counts[level]} ${SCIENTIFIC_CONCERN_LABELS[level]}`);
  return `${codes.length} additif${codes.length > 1 ? 's' : ''} détecté${codes.length > 1 ? 's' : ''} · ${details.join(', ')}`;
}

function analyzeHealthScore(data: BarcodeLookupResult['healthData']): HealthScoreResult {
  const healthScore = analyzeHealthScoreBase(data);
  if (!healthScore.available) return healthScore;
  const analysis = analyzeHealthIngredients(data);
  const scientificAdditiveSummary = getScientificAdditiveSummary(analysis.additives);
  return { ...healthScore, pillars: healthScore.pillars.map((pillar) => pillar.pillar === 'additives' ? { ...pillar, label: 'Additifs - score actuel', detail: scientificAdditiveSummary ?? 'Additifs non renseignés' } : pillar) };
}

function HealthMethodologySheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const sources = ['E150D', 'E331', 'E338', 'E950', 'E951'].flatMap((code) => getAdditiveInfo(code).sources).filter((source, index, all) => all.findIndex((item) => item.url === source.url) === index);
  return <Modal transparent animationType="slide" visible={visible} onRequestClose={onClose}><View style={styles.backdrop}><View style={styles.cardShell}><View style={styles.heading}><Text style={styles.sectionTitle}>Indice Santé OUMMAH v2</Text><Pressable accessibilityLabel="Fermer la méthodologie" onPress={onClose} style={styles.close}><Ionicons name="close" size={22} color={colors.text} /></Pressable></View><ScrollView showsVerticalScrollIndicator={false}><Text style={styles.muted}>{HEALTH_SCORE_METHODOLOGY_TEXT}</Text><Text style={styles.groupTitle}>Formule publique</Text><Text style={styles.muted}>Score final = nutrition de base - pénalité additifs - pénalité NOVA, borné entre 0 et 100. Les données manquantes n’ajoutent jamais de bonus et ne sont pas assimilées à un danger.</Text><Text style={styles.groupTitle}>Piliers</Text><Text style={styles.muted}>• Nutrition : base Nutri-Score A=100, B=75, C=50, D=25, E=0.</Text><Text style={styles.muted}>• Additifs : pénalités uniquement selon ScientificConcern V1 ; aucune note Additifs /100.</Text><Text style={styles.muted}>• Transformation : NOVA peut uniquement réduire la note.</Text><Text style={styles.groupTitle}>Interprétation</Text><Text style={styles.muted}>A : 80–100{`\n`}B : 60–79,9{`\n`}C : 40–59,9{`\n`}D : 20–39,9{`\n`}E : 0–19,9</Text><Text style={styles.groupTitle}>Ce qui n’entre pas dans la note</Text><Text style={styles.muted}>Halal, boycott, controverses, certifications halal et allergènes ne modifient pas le Score Santé.</Text><Text style={styles.disclaimer}>Méthodologie OUMMAH v2. Les données scientifiques insuffisantes restent séparées de l’exposition et n’entraînent aucune pénalité.</Text><Text style={styles.groupTitle}>Sources scientifiques</Text>{sources.map((source) => <Pressable key={source.url} onPress={() => void Linking.openURL(source.url)}><Text style={styles.toggleText}>{source.organisation} — {source.title}</Text></Pressable>)}</ScrollView></View></View></Modal>;
}

type SectionKey = 'boycott' | 'health' | 'halal';

function Section({ icon, title, value, tone, open, onToggle, children }: { icon: IconName; title: string; value: string; tone: string; open: boolean; onToggle: () => void; children: React.ReactNode }) {
  return <View style={[styles.section, open && styles.sectionOpen]}>
    <Pressable accessibilityRole="button" accessibilityState={{ expanded: open }} onPress={onToggle} style={({ pressed }) => [styles.sectionHeader, pressed && styles.pressed]}>
      <View style={[styles.sectionIcon, { backgroundColor: `${tone}22` }]}><Ionicons name={icon} size={22} color={tone} /></View>
      <View style={styles.rowCopy}><Text style={styles.sectionLabel}>{title}</Text><Text numberOfLines={1} style={[styles.sectionValue, { color: tone }]}>{value}</Text></View>
      <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={20} color={colors.textMuted} />
    </Pressable>
    {open ? <View style={styles.sectionBody}>{children}</View> : null}
  </View>;
}

function LinkRow({ label, onPress, tone = colors.goldLight }: { label: string; onPress: () => void; tone?: string }) {
  return <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.linkRow, pressed && styles.pressed]}><Text style={[styles.linkText, { color: tone }]}>{label}</Text><Ionicons name="chevron-forward" size={18} color={tone} /></Pressable>;
}

// Israel-related signals are shown as information only: on their own they do not meet OUMMAH's
// documented-link rule for the "À boycotter" status.
function getIsraelSignals(result: BarcodeLookupResult) {
  const signals: string[] = [];
  const comparison = result.comparisonData;
  if (comparison?.originsTags?.includes('en:israel') || /isra[eë]l/i.test(`${comparison?.origins ?? ''} ${comparison?.manufacturingPlaces ?? ''}`)) signals.push('Origine déclarée : Israël (Open Food Facts).');
  if (/^729\d{10}$/.test(result.barcode)) signals.push('Code-barres enregistré auprès de GS1 Israël (préfixe 729) : l’entreprise qui l’a enregistré est rattachée à Israël, ce qui ne dit pas forcément où le produit est fabriqué.');
  return signals;
}

// One plain-language sentence per kind of documented link, shown before the detailed summary.
const EVIDENCE_REASONS: Record<BoycottEntity['evidenceKind'], string> = {
  parent_group: 'Marque d’un groupe visé par le boycott.',
  occupation_economy: 'Entreprise citée pour sa participation à l’économie de l’occupation (colonies, territoires occupés).',
  military_supply: 'Entreprise citée pour la fourniture d’armes ou de technologies militaires à Israël.',
  material_support: 'Entreprise citée pour un soutien matériel à l’armée israélienne.',
  government_contract: 'Entreprise citée pour des contrats avec l’État israélien.',
  subsidiary_or_franchise: 'Filiale ou franchise d’une entreprise visée par le boycott.',
  financial_link: 'Entreprise citée pour ses investissements dans des sociétés impliquées dans l’occupation.',
  other_documented_link: 'Lien documenté retenu par OUMMAH.',
};

function BoycottBody({ result, dossier, israelSignals, onOpenEntity, onOpenDossier }: { result: BarcodeLookupResult; dossier: BrandControversy | null; israelSignals: string[]; onOpenEntity: () => void; onOpenDossier: () => void }) {
  const entity = result.assessment === 'boycott' ? result.boycottEntity : undefined;
  const isMedicine = result.productKind === 'medicine';
  return <>
    {entity ? <>
      {entity.parentGroup ? <View style={styles.chain}><Text numberOfLines={1} style={styles.chainItem}>{entity.name}</Text><Ionicons name="arrow-forward" size={16} color={colors.textMuted} /><Text numberOfLines={1} style={[styles.chainItem, styles.chainGroup]}>{entity.parentGroup}</Text></View> : null}
      <Text style={styles.bodyLead}>{EVIDENCE_REASONS[entity.evidenceKind] ?? EVIDENCE_REASONS.other_documented_link}</Text>
      {result.barcodePrefixMatch ? <Text style={[styles.bodyText, styles.bodySpaced]}>Reconnu par son code-barres : le préfixe {result.barcodePrefixMatch} est enregistré auprès de GS1 par {entity.parentGroup ?? entity.name}, propriétaire du produit.</Text> : null}
      {entity.summary ? <Text style={[styles.bodyText, styles.bodySpaced]}>{entity.summary}</Text> : null}
      <Pressable accessibilityRole="button" onPress={onOpenEntity} style={({ pressed }) => [styles.dangerButton, pressed && styles.pressed]}><Text style={styles.actionText}>Voir les sources</Text></Pressable>
    </> : <Text style={styles.bodyLead}>{result.assessment === 'ok'
      ? 'Aucun lien identifié avec une marque à boycotter dans la base OUMMAH.'
      : result.source === 'none'
        ? 'Ce code-barres n’est connu d’aucune base ouverte consultée (Open Food Facts, Open Beauty Facts, base publique des médicaments). Vous pouvez proposer ce produit.'
        : `${result.brandLabel ?? 'Cette marque'} ne figure pas dans la liste OUMMAH des marques à boycotter. Cela ne garantit pas l’absence de tout lien : si vous avez une source, proposez-la.`}</Text>}
    {isMedicine ? <View style={styles.notice}><Text style={styles.noticeTitle}>Médicament : votre santé d’abord</Text><Text style={styles.bodyText}>Ne changez jamais de traitement sans avis médical. Un générique équivalent d’un autre laboratoire existe souvent : demandez à votre pharmacien.</Text></View> : null}
    {israelSignals.length ? <View style={styles.notice}><Text style={styles.noticeTitle}>Lien avec Israël signalé</Text>{israelSignals.map((signal) => <Text key={signal} style={styles.bodyText}>{signal}</Text>)}<Text style={[styles.bodyNote, styles.noticeNote]}>Information à vérifier : ce signal seul ne suffit pas au classement « À boycotter » dans OUMMAH.</Text></View> : null}
    {dossier ? <LinkRow label={`Controverses · ${CONTROVERSY_CATEGORY_LABELS[dossier.category]} · ${dossier.sources.length} source${dossier.sources.length > 1 ? 's' : ''}`} onPress={onOpenDossier} /> : null}
  </>;
}

function HealthBody({ result, onAdditive }: { result: BarcodeLookupResult; onAdditive: (code: string) => void }) {
  const [ingredientsOpen, setIngredientsOpen] = useState(false); const [methodologyOpen, setMethodologyOpen] = useState(false);
  const analysis = analyzeHealthIngredients(result.healthData); const healthScore = analyzeHealthScore(result.healthData);
  const findings = [...analysis.watchItems, ...analysis.additives];
  const ingredientCount = findings.length + analysis.allergens.length + analysis.positives.length;
  return <>
    {!healthScore.available ? <Text style={styles.bodyLead}>Indice Santé indisponible — données nutritionnelles insuffisantes.</Text> : <>
      <View style={styles.healthHero}>
        <View style={[styles.gradeBubble, { backgroundColor: getHealthGradePresentation(healthScore.finalGrade).backgroundColor }]}><Text style={[styles.healthGrade, { color: getHealthGradePresentation(healthScore.finalGrade).color }]}>{healthScore.finalGrade}</Text></View>
        <View style={styles.rowCopy}><Text style={styles.healthHeroScore}>{healthScore.score}<Text style={styles.healthHeroUnit}>/100</Text></Text><Text style={[styles.healthLabel, { color: getHealthGradePresentation(healthScore.finalGrade).color }]}>{getHealthGradePresentation(healthScore.finalGrade).label}</Text></View>
      </View>
      <HealthScale score={healthScore.score} />
      {healthScore.scoreCompleteness !== 'complete' ? <Text style={styles.bodyNote}>{healthScore.scoreCompleteness === 'nutrition_only' ? 'Indice partiel — seules les données nutritionnelles sont disponibles.' : 'Indice calculé avec des données partielles.'}</Text> : null}
      <Text style={styles.blockTitle}>Ce qui compose la note</Text>
      {healthScore.pillars.filter((pillar) => pillar.available).map((pillar) => {
        const color = getHealthGradePresentation(getHealthGradeForScore(pillar.score)).color;
        return <View key={pillar.pillar} style={styles.pillar}>
          <View style={styles.pillarTop}><Text style={styles.pillarLabel}>{pillar.label}</Text><Text style={[styles.pillarScore, { color }]}>{pillar.score}/100</Text></View>
          <View style={styles.pillarTrack}><View style={[styles.pillarFill, { width: `${Math.max(4, Math.min(100, pillar.score))}%`, backgroundColor: color }]} /></View>
          <Text numberOfLines={2} style={styles.pillarDetail}>{pillar.detail}</Text>
        </View>;
      })}
      <NutritionDetails data={result.healthData} />
    </>}
    {analysis.hasReliableData && ingredientCount ? <>
      <Pressable accessibilityRole="button" onPress={() => setIngredientsOpen((value) => !value)} style={({ pressed }) => [styles.linkRow, pressed && styles.pressed]}><Text style={styles.linkText}>{ingredientsOpen ? 'Masquer les ingrédients' : `Additifs et ingrédients (${ingredientCount})`}</Text><Ionicons name={ingredientsOpen ? 'chevron-up' : 'chevron-down'} size={18} color={colors.goldLight} /></Pressable>
      {ingredientsOpen ? <>
        {findings.map((item, index) => <HealthRow key={`${item.label}-${index}`} item={item} onAdditive={onAdditive} />)}
        {analysis.allergens.length ? <><Text style={styles.blockTitle}>Allergènes</Text>{analysis.allergens.map((item) => <HealthRow key={item.label} item={item} onAdditive={onAdditive} />)}</> : null}
        {analysis.positives.length ? <><Text style={styles.blockTitle}>Points positifs</Text>{analysis.positives.map((item) => <HealthRow key={item.label} item={item} onAdditive={onAdditive} />)}</> : null}
      </> : null}
    </> : null}
    <LinkRow label="Comment la note est calculée ?" onPress={() => setMethodologyOpen(true)} />
    <Text style={styles.bodyNote}>L’absence d’alerte ne garantit pas que le produit est sain.</Text>
    <HealthMethodologySheet visible={methodologyOpen} onClose={() => setMethodologyOpen(false)} />
  </>;
}

// The product status and the certifier's sheet stay separate: a vigilance notice only asks to check
// the certification ("Certification à vérifier"), it never turns the product into "non halal".
function HalalBody({ result, confirmed, onOpen, onReport }: { result: BarcodeLookupResult; confirmed: string | null; onOpen: (id: string) => void; onReport: () => void }) {
  const analysis = analyzeHalalCertification(result.halalData, result.healthData?.ingredientsText, confirmed);
  const body = getHalalCertifier(analysis.certifierId);
  const vigilance = getActiveHalalCertifierNotices(body);
  return <>
    {body ? <>
      <Text style={styles.blockTitleFirst}>Certification détectée</Text>
      <Pressable accessibilityRole="button" accessibilityLabel={`Voir la fiche de l’organisme ${body.name}`} onPress={() => onOpen(body.id)} style={({ pressed }) => [styles.certifierRow, pressed && styles.pressed]}>
        <View style={styles.rowCopy}><Text style={styles.certifierName}>{body.name}</Text><Text style={styles.certifierMeta}>{HALAL_DOCUMENTATION_LABELS[body.documentationLevel]} · Voir la fiche de l’organisme</Text></View>
        <Ionicons name="chevron-forward" size={20} color={colors.goldLight} />
      </Pressable>
      {vigilance.length ? <View style={styles.notice}><Text style={styles.noticeTitle}>Certification à vérifier</Text>{vigilance.map((notice) => <Text key={notice.id} style={styles.bodyText}>{notice.title}</Text>)}</View> : null}
      <Text style={[styles.bodyNote, styles.noticeNote]}>{analysis.explanation}</Text>
    </> : <Text style={styles.bodyLead}>{analysis.explanation}</Text>}
    {!body && analysis.halalMention ? <Pressable accessibilityRole="button" onPress={onReport} style={({ pressed }) => [styles.reportButton, pressed && styles.pressed]}><Ionicons name="camera-outline" size={18} color={colors.background} /><Text style={styles.reportButtonText}>Indiquer le certificateur</Text></Pressable> : null}
    {analysis.ingredientChecks.length ? <><Text style={styles.blockTitle}>Points à vérifier</Text>{analysis.ingredientChecks.map((item) => <View key={item} style={styles.checkRow}><View style={[styles.dot, { backgroundColor: colors.warning }]} /><Text style={[styles.bodyText, styles.rowCopy]}>{item}</Text></View>)}</> : null}
    <LinkRow label={body ? 'Comparer avec les autres organismes' : 'Voir les organismes halal'} onPress={() => router.push('/boycott/halal')} />
  </>;
}

function HealthRow({ item, onAdditive }: { item: HealthFinding; onAdditive: (code: string) => void }) { const color = item.kind === 'positive' ? colors.success : item.kind === 'allergen' ? '#E9A36B' : item.attentionLevel === 'risk_high' ? colors.danger : item.attentionLevel === 'risk_limited' ? colors.warning : item.attentionLevel === 'neutral_or_no_particular_signal' ? colors.success : colors.textMuted; const body = <><View style={[styles.dot, { backgroundColor: color }]} /><View style={styles.rowCopy}><Text style={styles.rowLabel}>{item.label}</Text><Text style={styles.rowDetail}>{item.detail}</Text></View>{item.additiveCode ? <Ionicons name="chevron-forward" size={16} color={colors.textMuted} /> : null}</>; return item.additiveCode ? <Pressable accessibilityRole="button" onPress={() => onAdditive(item.additiveCode!)} style={styles.healthRow}>{body}</Pressable> : <View style={styles.healthRow}>{body}</View>; }

function HealthScale({ score }: { score: number }) { const current = getHealthGradeForScore(score); return <View style={styles.healthScale}>{(['A', 'B', 'C', 'D', 'E'] as const).map((grade) => { const item = getHealthGradePresentation(grade); return <View key={grade} style={[styles.scaleSegment, { backgroundColor: item.color, opacity: current === grade ? 1 : 0.25 }]}><Text style={styles.scaleLabel}>{grade}</Text></View>; })}</View>; }

function NutritionDetails({ data }: { data?: BarcodeLookupResult['healthData'] }) { const values = data?.nutritionValues; const basis = data?.nutritionBasis; if (!values || !basis || Object.values(values).every((value) => value === undefined)) return null; const rows: Array<[string, number | undefined, string]> = [['Énergie', values.energyKcal, 'kcal'], ['Sucres', values.sugarsG, 'g'], ['Sel', values.saltG, 'g'], ['Graisses saturées', values.saturatedFatG, 'g'], ['Protéines', values.proteinsG, 'g'], ['Fibres', values.fiberG, 'g']]; return <View style={styles.nutritionDetails}><Text style={styles.blockTitle}>Valeurs nutritionnelles · pour {basis}</Text>{rows.filter(([, value]) => value !== undefined).map(([label, value, unit]) => <View key={label} style={styles.nutritionRow}><Text style={styles.nutritionLabel}>{label}</Text><Text style={styles.nutritionValue}>{String(value).replace('.', ',')} {unit}</Text></View>)}</View>; }

function formatRecallDate(value?: string) {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

/** Official recall (RappelConso): it targets specific lots, so the sheet asks to check the package. */
function RecallSheet({ recalls, onClose }: { recalls: ProductRecall[]; onClose: () => void }) {
  return <Modal transparent animationType="slide" visible={recalls.length > 0} onRequestClose={onClose}><View style={styles.backdrop}><View style={styles.cardShell}>
    <View style={styles.heading}><Ionicons name="warning" size={20} color={colors.danger} /><Text style={styles.sectionTitle}>Rappel officiel en cours</Text><Pressable accessibilityLabel="Fermer le rappel" onPress={onClose} style={styles.close}><Ionicons name="close" size={22} color={colors.text} /></Pressable></View>
    <ScrollView showsVerticalScrollIndicator={false}>
      <Text style={styles.bodyLead}>Ce code-barres figure dans un rappel publié par les autorités. Seuls certains lots sont concernés : vérifiez le lot et la date sur votre emballage.</Text>
      {recalls.map((recall) => <View key={recall.id} style={styles.recallCard}>
        <Text style={styles.recallTitle}>{recall.title}{recall.brand ? ` · ${recall.brand}` : ''}</Text>
        <Text style={styles.bodyNote}>Publié le {formatRecallDate(recall.publishedAt)}{recall.endsAt ? ` · jusqu’au ${formatRecallDate(recall.endsAt)}` : ''}</Text>
        {recall.reason ? <><Text style={styles.blockTitle}>Motif</Text><Text style={styles.bodyText}>{recall.reason}</Text></> : null}
        {recall.risks ? <><Text style={styles.blockTitle}>Risques</Text><Text style={styles.bodyText}>{recall.risks}</Text></> : null}
        {recall.lots.length ? <><Text style={styles.blockTitle}>Lots concernés</Text>{recall.lots.map((lot) => <Text key={lot} style={styles.bodyText}>• {lot}</Text>)}</> : null}
        {recall.actions.length ? <><Text style={styles.blockTitle}>Que faire ?</Text>{recall.actions.map((action) => <Text key={action} style={styles.bodyText}>• {action}</Text>)}</> : null}
        {recall.url ? <LinkRow label="Voir la fiche officielle" onPress={() => void Linking.openURL(recall.url!)} tone={colors.danger} /> : null}
      </View>)}
      <Text style={styles.bodyNote}>Source : RappelConso (DGCCRF), Licence Ouverte Etalab.</Text>
    </ScrollView>
  </View></View></Modal>;
}

/** Full-screen product photo: tap anywhere (or the close button) to dismiss. */
function ProductImageViewer({ uri, name, onClose }: { uri?: string; name: string; onClose: () => void }) {
  return <Modal transparent animationType="fade" visible={Boolean(uri)} onRequestClose={onClose} statusBarTranslucent>
    <Pressable accessibilityRole="button" accessibilityLabel="Fermer la photo" onPress={onClose} style={styles.viewerBackdrop}>
      <View style={styles.viewerFrame}><BoycottProductImage contentFit="contain" style={styles.viewerImage} uri={uri} /></View>
      <Text numberOfLines={2} style={styles.viewerCaption}>{name}</Text>
      <Text style={styles.viewerCredit}>Photo : Open Food Facts (CC BY-SA)</Text>
    </Pressable>
    <Pressable accessibilityRole="button" accessibilityLabel="Fermer la photo" onPress={onClose} style={styles.viewerClose}><Ionicons name="close" size={24} color="#FFF" /></Pressable>
  </Modal>;
}

// Compact rows, all visible at once: photo, name, score compared with the scanned product, halal pill.
function AlternativeCard({ alternative, originalScore, onOpen }: { alternative: AlternativeProduct; originalScore?: number; onOpen: (barcode: string) => void }) {
  const healthPresentation = getHealthGradePresentation(alternative.healthGrade);
  const halal = analyzeHalalCertification(alternative.halalData);
  const halalLabel = halal.certification ? `Halal · ${halal.certification}` : halal.halalMention ? 'Halal' : null;
  const subtitle = [alternative.brand, alternative.quantity].filter(Boolean).join(' · ');
  return <Pressable accessibilityRole="button" accessibilityLabel={`Consulter la fiche de ${alternative.productName}, Score Santé ${alternative.healthScore} sur 100${halalLabel ? `, ${halalLabel}` : ''}`} onPress={() => onOpen(alternative.barcode)} style={({ pressed }) => [styles.altRow, pressed && styles.alternativePressed]}>
    <BoycottProductImage contentFit="cover" style={styles.altRowImage} uri={alternative.imageUrl} />
    <View style={styles.rowCopy}>
      <Text numberOfLines={2} style={styles.altRowName}>{readableName(alternative.productName)}</Text>
      {subtitle ? <Text numberOfLines={1} style={styles.altRowBrand}>{subtitle}</Text> : null}
      <View style={styles.altRowBadges}>
        <View style={[styles.altGradeBubble, { backgroundColor: healthPresentation.backgroundColor }]}><Text style={[styles.altGrade, { color: healthPresentation.color }]}>{alternative.healthGrade}</Text></View>
        <Text style={[styles.altRowScore, { color: healthPresentation.color }]}>{alternative.healthScore}/100</Text>
        {halalLabel ? <View style={styles.halalPill}><Text style={styles.halalPillText}>{halalLabel}</Text></View> : null}
      </View>
      {originalScore !== undefined ? <Text style={styles.altRowCompare}>au lieu de {originalScore}/100</Text> : null}
    </View>
    <Ionicons name="chevron-forward" size={18} color={colors.goldLight} />
  </Pressable>;
}

function AlternativeSection({ alternatives, loading, originalScore, onOpen }: { alternatives: AlternativeProduct[]; loading: boolean; originalScore?: number; onOpen: (barcode: string) => void }) {
  const allHalal = alternatives.length > 0 && alternatives.every((item) => analyzeHalalCertification(item.halalData).halalMention || Boolean(analyzeHalalCertification(item.halalData).certification));
  const count = `${alternatives.length} produit${alternatives.length > 1 ? 's' : ''}${allHalal ? ' halal' : ''}`;
  return <View style={styles.card}>
    <View style={styles.heading}><Ionicons name="swap-horizontal-outline" size={20} color={colors.goldLight} /><Text style={styles.sectionTitle}>Mieux pour vous</Text></View>
    {loading ? <Text style={styles.muted}>Recherche d’alternatives…</Text> : alternatives.length ? <>
      <Text style={styles.altCount}>{count}</Text>
      <View style={styles.altList}>{alternatives.map((item) => <AlternativeCard key={item.barcode} alternative={item} originalScore={originalScore} onOpen={onOpen} />)}</View>
      <Text style={styles.reason}>Même type de produit, mieux noté, sans lien avec le boycott. Données Open Food Facts (ODbL).</Text>
    </> : originalScore !== undefined && originalScore >= 80 ? <Text style={styles.muted}>C’est déjà un des meilleurs choix de sa catégorie.</Text> : <Text style={styles.muted}>Aucune alternative de même type, hors boycott et mieux notée, n’a été trouvée.</Text>}
  </View>;
}

export function BoycottScanResultCard({ result, onClose, onOpenEntity, onOpenAlternative, onPropose, primaryLabel = 'Scanner un autre produit', startExpanded = false }: Props) {
  useHalalCertificationBodies();
  const [displayImageUrl, setDisplayImageUrl] = useState<string | undefined>();
  const [imageViewerOpen, setImageViewerOpen] = useState(false);
  const [recalls, setRecalls] = useState<ProductRecall[]>([]);
  const [recallOpen, setRecallOpen] = useState(false);
  useEffect(() => { let active = true; setRecalls([]); void findActiveRecalls(result.barcode).then((items) => { if (active) setRecalls(items); }); return () => { active = false; }; }, [result.barcode]);
  const diagnosticBrand = result.brandLabel ?? result.commercialIdentity?.brands;
  const [alternatives, setAlternatives] = useState<AlternativeProduct[]>([]); const [alternativeLoading, setAlternativeLoading] = useState(true); const [additiveCode, setAdditiveCode] = useState<string | null>(null); const [certifierName, setCertifierName] = useState<string | null>(null); const [controversyOpen, setControversyOpen] = useState(false); const dossier = getBrandControversyDossier(result.boycottEntity);
  const screenHeight = Dimensions.get('window').height;
  const expandedHeight = screenHeight * 0.88;
  const compactHeight = screenHeight * 0.34;
  const compactOffset = expandedHeight - compactHeight;
  const translateY = useRef(new Animated.Value(startExpanded ? 0 : compactOffset)).current;
  const dragStart = useRef(startExpanded ? 0 : compactOffset);
  const expandedScrollRef = useRef<ScrollView>(null);
  const [expanded, setExpanded] = useState(startExpanded);
  const snapTo = (nextExpanded: boolean, velocity = 0) => {
    const destination = nextExpanded ? 0 : compactOffset;
    setExpanded(nextExpanded);
    Animated.spring(translateY, { toValue: destination, velocity, useNativeDriver: true, damping: 22, stiffness: 210, mass: 0.8 }).start();
  };
  const sheetPanResponder = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => false,
    onMoveShouldSetPanResponder: (_, gesture) => {
      const vertical = Math.abs(gesture.dy);
      const horizontal = Math.abs(gesture.dx);
      return vertical > 6 && vertical > horizontal;
    },
    onMoveShouldSetPanResponderCapture: (_, gesture) => {
      const vertical = Math.abs(gesture.dy);
      const horizontal = Math.abs(gesture.dx);
      return vertical > 6 && vertical > horizontal;
    },
    onPanResponderGrant: () => { translateY.stopAnimation((value) => { dragStart.current = value; }); },
    onPanResponderMove: (_, gesture) => { translateY.setValue(Math.max(0, Math.min(compactOffset, dragStart.current + gesture.dy))); },
    onPanResponderRelease: (_, gesture) => {
      const projected = dragStart.current + gesture.dy + gesture.vy * 80;
      const shouldExpand = projected < compactOffset / 2 || gesture.dy < -40 || gesture.vy < -0.45;
      snapTo(shouldExpand, Math.max(-2, Math.min(2, -gesture.vy)));
    },
    onPanResponderTerminate: () => snapTo(dragStart.current < compactOffset / 2),
  })).current;
  useEffect(() => {
    if (expanded) requestAnimationFrame(() => expandedScrollRef.current?.scrollTo({ y: 0, animated: false }));
  }, [expanded, result.barcode]);
  useEffect(() => {
    let active = true;
    setDisplayImageUrl(undefined);
    if (__DEV__) console.log('[ProductImageComponentDiagnostic]', { mounted: true, barcode: result.barcode, brand: diagnosticBrand, initialImageUrl: result.imageUrl });
    void resolveProductImage(result.barcode, result.imageUrl ? [result.imageUrl] : [], diagnosticBrand).then((resolution) => {
      // Shown once, after the best source is known (cleaned photo, else the product's own front photo):
      // never swapped afterwards. A similar product's photo is worse than the placeholder.
      if (active && resolution.imageUrl && (resolution.source === 'oummah_clean' || resolution.source === 'openfoodfacts_front')) setDisplayImageUrl((current) => current ?? resolution.imageUrl);
    });
    return () => { active = false; };
  }, [result.barcode, result.imageUrl, diagnosticBrand]);
  useEffect(() => { prefetchBoycottImages([displayImageUrl]); }, [displayImageUrl]);
  useEffect(() => { if (!PRODUCT_ALTERNATIVES_ENABLED) { setAlternatives([]); setAlternativeLoading(false); return; } let active = true; setAlternatives([]); setAlternativeLoading(true); void getBoycottCatalog().then((catalog) => findProductAlternatives(result, catalog)).then((value) => { if (active) setAlternatives(value); }).finally(() => { if (active) setAlternativeLoading(false); }); return () => { active = false; }; }, [result]);
  useEffect(() => { if (PRODUCT_ALTERNATIVES_ENABLED) prefetchBoycottImages(alternatives.map(({ imageUrl }) => imageUrl)); }, [alternatives]);
  const name = readableName(result.productName || result.brandLabel || `Code ${result.barcode}`); const certifier = getHalalCertifier(certifierName ?? undefined);
  const [confirmedCertifier, setConfirmedCertifier] = useState<string | null>(null); const [reportOpen, setReportOpen] = useState(false);
  useEffect(() => { let active = true; setConfirmedCertifier(null); void getConfirmedCertifier(result.barcode).then((id) => { if (active) setConfirmedCertifier(id); }); return () => { active = false; }; }, [result.barcode]);
  const halal = analyzeHalalCertification(result.halalData, result.healthData?.ingredientsText, confirmedCertifier);
  const health = analyzeHealthScoreBase(result.healthData);
  const halalBody = getHalalCertifier(halal.certifierId);
  const halalVigilance = getActiveHalalCertifierNotices(halalBody).length > 0;
  const halalLabel = halalBody ? `${halalBody.name}${halalVigilance ? ' · à vérifier' : ''}` : halal.level === 'likely' ? 'Halal · certificateur ?' : halal.level === 'uncertain' ? 'Informations à vérifier' : 'Non vérifié';
  const israelSignals = getIsraelSignals(result);
  // Medicines (ANSM registry): health score and halal analysis do not apply.
  const isMedicine = result.productKind === 'medicine';
  const israelWarning = result.assessment !== 'boycott' && israelSignals.length > 0;
  const statusLabel = result.assessment === 'boycott' ? 'À boycotter' : israelWarning ? 'Lien Israël à vérifier' : result.assessment === 'ok' ? 'Aucun lien identifié' : result.source === 'none' ? 'Produit inconnu' : 'Aucun lien connu';
  const healthTone = !health.available ? colors.textMuted : health.score >= 70 ? colors.success : health.score >= 50 ? colors.goldLight : colors.danger;
  const boycottTone = result.assessment === 'boycott' ? colors.danger : israelWarning ? colors.warning : result.assessment === 'ok' ? colors.success : colors.textMuted;
  const halalTone = halalBody ? (halalVigilance ? colors.warning : colors.success) : halal.level === 'likely' || halal.level === 'uncertain' ? colors.warning : colors.textMuted;
  // One drop-down open at a time keeps the sheet airy.
  const [openSection, setOpenSection] = useState<SectionKey | null>(null);
  const toggleSection = (key: SectionKey) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpenSection((current) => current === key ? null : key);
  };
  // A failed URL is dropped from the cache for the next scan, but never replaced live: the placeholder stays.
  const failedImageUrl = displayImageUrl;
  const imageErrorHandler = useCallback(() => { void invalidateProductImage(result.barcode, failedImageUrl); }, [result.barcode, failedImageUrl]);
  return <View pointerEvents="box-none" style={styles.sheetBackdrop}><Animated.View style={[styles.sheet, { height: expandedHeight, transform: [{ translateY }] }, result.assessment === 'boycott' ? styles.sheetBoycott : null]}><View {...sheetPanResponder.panHandlers}><View style={styles.sheetHandleArea}><View style={styles.grabber} /></View><View style={styles.productHeader}><Pressable accessibilityRole="imagebutton" accessibilityLabel="Agrandir la photo du produit" disabled={!displayImageUrl} onPress={() => setImageViewerOpen(true)}><BoycottProductImage barcode={result.barcode} brand={diagnosticBrand} contentFit="contain" qualityCheck={isUsableProductPhoto} onImageError={imageErrorHandler} style={styles.productImage} uri={displayImageUrl} /></Pressable><View style={styles.rowCopy}><Text numberOfLines={2} style={styles.compactName}>{name}</Text>{result.brandLabel ? <Text numberOfLines={1} style={styles.compactBrand}>{result.brandLabel}</Text> : null}{recalls.length ? <Pressable accessibilityRole="button" accessibilityLabel="Rappel officiel en cours, voir le détail" onPress={() => setRecallOpen(true)} style={({ pressed }) => [styles.recallPill, pressed && styles.pressed]}><Ionicons name="warning" size={14} color="#FFF" /><Text style={styles.recallPillText}>Rappel officiel en cours</Text><Ionicons name="chevron-forward" size={14} color="#FFF" /></Pressable> : null}</View><Pressable accessibilityLabel="Fermer le résultat" onPress={onClose} style={styles.close}><Ionicons name="close" size={22} color={colors.text} /></Pressable></View>{!expanded ? <View style={styles.compactContent}><View style={styles.compactBadges}><View style={[styles.compactBadge, result.assessment === 'boycott' ? styles.compactBadgeDanger : null]}><Text style={styles.compactBadgeTitle}>Boycott</Text><Text numberOfLines={2} style={[styles.compactBadgeValue, { color: result.assessment === 'boycott' || israelWarning ? boycottTone : colors.text }]}>{statusLabel}</Text></View>{isMedicine ? <View style={[styles.compactBadge, styles.compactBadgeWide]}><Text style={styles.compactBadgeTitle}>Médicament</Text><Text numberOfLines={2} style={styles.compactBadgeValue}>{result.brandLabel ?? 'Laboratoire non renseigné'}</Text></View> : <><View style={styles.compactBadge}><Text style={styles.compactBadgeTitle}>Score Santé</Text><Text style={[styles.compactBadgeValue, { color: healthTone }]}>{health.available ? `${health.score}/100` : 'Indisponible'}</Text>{health.available && health.finalGrade ? <Text style={styles.compactBadgeNote}>{health.finalGrade}</Text> : null}</View><View style={styles.compactBadge}><Text style={styles.compactBadgeTitle}>Halal</Text><Text numberOfLines={2} style={styles.compactBadgeValue}>{halalLabel}</Text></View></>}</View><Pressable accessibilityRole="button" onPress={() => snapTo(true)} style={styles.expandHint}><Text style={styles.expandHintText}>Tirer vers le haut pour voir le détail</Text><Ionicons name="chevron-up" size={18} color={colors.goldLight} /></Pressable></View> : null}</View>{expanded ? <ScrollView ref={expandedScrollRef} style={styles.expandedScroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}><Section icon={result.assessment === 'boycott' ? 'alert-circle' : 'business-outline'} title="Boycott" value={statusLabel} tone={boycottTone} open={openSection === 'boycott'} onToggle={() => toggleSection('boycott')}><BoycottBody result={result} dossier={dossier} israelSignals={israelSignals} onOpenEntity={onOpenEntity} onOpenDossier={() => setControversyOpen(true)} /></Section>{isMedicine ? null : <><Section icon="heart-outline" title="Score Santé" value={health.available ? `${health.score}/100 · ${getHealthGradePresentation(health.finalGrade).label}` : 'Indisponible'} tone={health.available ? getHealthGradePresentation(health.finalGrade).color : colors.textMuted} open={openSection === 'health'} onToggle={() => toggleSection('health')}><HealthBody result={result} onAdditive={setAdditiveCode} /></Section><Section icon="ribbon-outline" title="Halal" value={halalLabel} tone={halalTone} open={openSection === 'halal'} onToggle={() => toggleSection('halal')}><HalalBody result={result} confirmed={confirmedCertifier} onOpen={setCertifierName} onReport={() => setReportOpen(true)} /></Section></>}{PRODUCT_ALTERNATIVES_ENABLED ? <AlternativeSection alternatives={alternatives} loading={alternativeLoading} originalScore={health.available ? health.score : undefined} onOpen={onOpenAlternative} /> : null}<Pressable onPress={onClose} style={styles.primary}><Text style={styles.primaryText}>{primaryLabel}</Text></Pressable>{result.assessment === 'unknown' ? <Pressable accessibilityRole="button" onPress={onPropose} style={styles.reportLink}><Text style={styles.reportLinkText}>Signaler un lien avec le boycott</Text></Pressable> : null}<Text style={styles.barcode}>Code-barres {result.barcode}{displayImageUrl ? '\nPhoto : Open Food Facts (CC BY-SA)' : ''}</Text></ScrollView> : null}</Animated.View><ProductImageViewer uri={imageViewerOpen ? displayImageUrl : undefined} name={name} onClose={() => setImageViewerOpen(false)} /><RecallSheet recalls={recallOpen ? recalls : []} onClose={() => setRecallOpen(false)} /><AdditiveDetailSheet additive={additiveCode ? getAdditiveInfo(additiveCode) : null} onClose={() => setAdditiveCode(null)} /><HalalCertifierDetailSheet certifier={certifier} onClose={() => setCertifierName(null)} /><BrandControversyDetailSheet dossier={controversyOpen ? dossier : null} onClose={() => setControversyOpen(false)} /><HalalCertifierReportSheet visible={reportOpen} barcode={result.barcode} productName={result.productName ?? undefined} onClose={() => setReportOpen(false)} /></View>;
}

// Open Food Facts names typed in capitals ("PREMIUM VOLAILLE BLANC DE DINDE") read as shouting: sentence case.
function readableName(value: string) {
  const letters = value.replace(/[^\p{L}]/gu, '');
  if (letters.length < 4 || letters !== letters.toUpperCase()) return value;
  const lower = value.toLocaleLowerCase('fr-FR');
  return lower.charAt(0).toLocaleUpperCase('fr-FR') + lower.slice(1);
}

const styles = StyleSheet.create({
  reportLink: { alignSelf: 'center', marginTop: 14, paddingVertical: 8, paddingHorizontal: 12 },
  reportLinkText: { color: colors.textMuted, fontFamily: typography.sans, fontSize: 14, fontWeight: '700', textDecorationLine: 'underline' },
  altCount: { marginTop: 2, marginBottom: 10, color: colors.textMuted, fontFamily: typography.sans, fontSize: 14 },
  altList: { gap: 10, marginBottom: 12 },
  altRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 18, borderWidth: 1, borderColor: colors.borderSoft, backgroundColor: 'rgba(255,255,255,0.03)' },
  altRowImage: { width: 64, height: 64, borderRadius: 14 },
  altRowName: { color: colors.text, fontFamily: typography.sans, fontSize: 16, lineHeight: 21, fontWeight: '700' },
  altRowBrand: { marginTop: 1, color: colors.textMuted, fontFamily: typography.sans, fontSize: 13.5 },
  altRowBadges: { marginTop: 6, flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 },
  altRowScore: { fontFamily: typography.sans, fontSize: 15, fontWeight: '800' },
  altRowCompare: { marginTop: 3, color: colors.textMuted, fontFamily: typography.sans, fontSize: 12.5 },
  halalPill: { paddingHorizontal: 9, paddingVertical: 3, borderRadius: 10, backgroundColor: 'rgba(76,175,125,0.16)', borderWidth: 1, borderColor: 'rgba(76,175,125,0.45)' },
  halalPillText: { color: colors.success, fontFamily: typography.sans, fontSize: 12.5, fontWeight: '800' },
  reportButton: { marginTop: 14, minHeight: 48, borderRadius: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: colors.goldLight },
  reportButtonText: { color: colors.background, fontFamily: typography.sans, fontSize: 15.5, fontWeight: '800' },
  backdrop: { ...StyleSheet.absoluteFill, padding: 16, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(4,3,9,0.78)' },
  sheetBackdrop: { ...StyleSheet.absoluteFill, justifyContent: 'flex-end' },
  cardShell: { width: '100%', maxWidth: 410, maxHeight: '92%', borderRadius: 30, overflow: 'hidden', backgroundColor: colors.backgroundSecondary, borderWidth: 1, borderColor: colors.borderSoft },
  sheet: { width: '100%', overflow: 'hidden', borderTopLeftRadius: 32, borderTopRightRadius: 32, backgroundColor: colors.backgroundSecondary, borderWidth: 1, borderBottomWidth: 0, borderColor: colors.borderSoft, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 18, shadowOffset: { width: 0, height: -8 }, elevation: 14 },
  sheetBoycott: { backgroundColor: '#21151D', borderColor: 'rgba(233,107,114,0.38)' },
  sheetHandleArea: { height: 24, alignItems: 'center', justifyContent: 'center' },
  grabber: { width: 44, height: 5, borderRadius: 3, backgroundColor: colors.textMuted, opacity: 0.72 },
  productHeader: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 20, paddingBottom: 14 },
  productImage: { width: 96, height: 96, borderRadius: 20 },
  compactContent: { paddingHorizontal: 20, paddingBottom: 10 },
  compactName: { color: colors.text, fontFamily: typography.sans, fontSize: 22, lineHeight: 27, fontWeight: '800' },
  compactBrand: { marginTop: 4, color: colors.textMuted, fontFamily: typography.sans, fontSize: 16, lineHeight: 22 },
  compactBadges: { flexDirection: 'row', gap: 8 },
  compactBadge: { flex: 1, minHeight: 78, padding: 10, borderRadius: 16, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderSoft },
  compactBadgeWide: { flex: 2 },
  compactBadgeDanger: { backgroundColor: 'rgba(233,107,114,0.14)', borderColor: 'rgba(233,107,114,0.42)' },
  compactBadgeTitle: { color: colors.textMuted, fontFamily: typography.sans, fontSize: 12, lineHeight: 17, fontWeight: '800' },
  compactBadgeValue: { marginTop: 4, color: colors.text, fontFamily: typography.sans, fontSize: 15, lineHeight: 19, fontWeight: '800' },
  compactBadgeNote: { marginTop: 1, color: colors.textMuted, fontFamily: typography.sans, fontSize: 13, lineHeight: 17, fontWeight: '700' },
  compactStatus: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginTop: 18, padding: 14, borderRadius: 18, backgroundColor: colors.surface },
  compactStatusCopy: { flex: 1, minWidth: 0 },
  compactStatusLabel: { color: colors.success, fontFamily: typography.sans, fontSize: 18, lineHeight: 24, fontWeight: '800' },
  compactHint: { marginTop: 3, color: colors.textMuted, fontFamily: typography.sans, fontSize: 14, lineHeight: 19 },
  compactMetrics: { flexDirection: 'row', gap: 10, marginTop: 10 },
  compactMetric: { flex: 1, padding: 13, borderRadius: 16, backgroundColor: colors.surface },
  compactMetricLabel: { color: colors.textMuted, fontFamily: typography.sans, fontSize: 14, lineHeight: 19, fontWeight: '600' },
  compactMetricValue: { marginTop: 3, color: colors.text, fontFamily: typography.sans, fontSize: 17, lineHeight: 23, fontWeight: '800' },
  expandHint: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 15, paddingVertical: 8 },
  expandHintText: { color: colors.goldLight, fontFamily: typography.sans, fontSize: 14, lineHeight: 20, fontWeight: '700' },
  close: { alignSelf: 'flex-start', width: 40, height: 40, borderRadius: 14, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.surface },
  expandedScroll: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 4, paddingBottom: 40 },
  barcode: { marginTop: 18, color: colors.textMuted, fontFamily: typography.sans, fontSize: 13, lineHeight: 18, textAlign: 'center' },
  subBlock: { marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.borderSoft },
  rowCopy: { flex: 1, minWidth: 0 },
  eyebrow: { color: colors.goldLight, fontFamily: typography.sans, fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  productName: { marginTop: 5, color: colors.text, fontFamily: typography.sans, fontSize: 28, lineHeight: 34, fontWeight: '700', flexShrink: 1 },
  muted: { marginTop: 9, color: colors.textMuted, fontFamily: typography.sans, fontSize: 16, lineHeight: 24, flexShrink: 1 },
  summary: { padding: 19, borderRadius: 22, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderSoft },
  summaryTitle: { color: colors.goldLight, fontFamily: typography.sans, fontSize: 15, fontWeight: '900' },
  summaryRow: { flexDirection: 'row', alignItems: 'center', gap: 11, marginTop: 15 }, summaryCopy: { flex: 1, minWidth: 0 },
  summaryLabel: { color: colors.textMuted, fontFamily: typography.sans, fontSize: 16 }, summaryValue: { marginTop: 2, color: colors.text, fontFamily: typography.sans, fontSize: 17, lineHeight: 24, fontWeight: '600', flexShrink: 1 }, summaryHint: { marginTop: 12, color: colors.textMuted, fontFamily: typography.sans, fontSize: 16, lineHeight: 24 }, danger: { color: colors.danger },
  card: { marginTop: 18, paddingTop: 18, borderTopWidth: 1, borderTopColor: colors.borderSoft }, heading: { flexDirection: 'row', alignItems: 'center', gap: 8 }, sectionTitle: { flex: 1, minWidth: 0, color: colors.text, fontFamily: typography.sans, fontSize: 22, lineHeight: 28, fontWeight: '700' }, healthSectionTitle: { flexGrow: 0, flexShrink: 0, width: 82, color: colors.text, fontFamily: typography.sans, fontSize: 22, lineHeight: 28, fontWeight: '700' },
  healthHero: { flexDirection: 'row', alignItems: 'center', gap: 16 }, healthGrade: { color: colors.goldLight, fontFamily: typography.sans, fontSize: 32, lineHeight: 38, fontWeight: '800' }, healthLabel: { marginTop: 3, fontFamily: typography.sans, fontSize: 16, lineHeight: 24, fontWeight: '600' }, healthScale: { flexDirection: 'row', gap: 5, marginTop: 16 }, scaleSegment: { flex: 1, height: 22, borderRadius: 8, justifyContent: 'center', alignItems: 'center' }, scaleLabel: { color: '#17111C', fontFamily: typography.sans, fontSize: 12, fontWeight: '800' },
  nutritionDetails: { marginTop: 4 }, nutritionRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, paddingVertical: 9, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.borderSoft }, nutritionLabel: { color: colors.textSecondary, fontFamily: typography.sans, fontSize: 16, lineHeight: 24 }, nutritionValue: { color: colors.text, fontFamily: typography.sans, fontSize: 16, lineHeight: 24, fontWeight: '600', flexShrink: 1, textAlign: 'right' }, healthHeroTitle: { color: colors.text, fontFamily: typography.sans, fontSize: 17, lineHeight: 24, fontWeight: '600' }, healthHeroScore: { color: colors.text, fontFamily: typography.sans, fontSize: 30, lineHeight: 36, fontWeight: '800' }, healthHeroUnit: { color: colors.textMuted, fontSize: 16, fontWeight: '600' }, scoreGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 }, scoreCard: { flexGrow: 1, flexBasis: '30%', minWidth: 98, padding: 11, borderRadius: 14, borderWidth: 1, borderColor: colors.borderSoft }, scoreTitle: { color: colors.textMuted, fontFamily: typography.sans, fontSize: 16, lineHeight: 24, fontWeight: '600' }, scoreValue: { marginTop: 5, color: colors.text, fontFamily: typography.sans, fontSize: 17, lineHeight: 24, fontWeight: '600' }, scoreDetail: { marginTop: 3, color: colors.textSecondary, fontFamily: typography.sans, fontSize: 16, lineHeight: 24 }, healthSummary: { marginTop: 13, color: colors.textSecondary, fontFamily: typography.sans, fontSize: 16, lineHeight: 24 },
  groupTitle: { marginTop: 16, paddingTop: 12, color: colors.goldLight, borderTopWidth: 1, borderTopColor: colors.borderSoft, fontFamily: typography.sans, fontSize: 17, lineHeight: 24, fontWeight: '700' }, toggle: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 14, flexShrink: 1, minWidth: 0 }, toggleText: { color: colors.goldLight, flexShrink: 1, textAlign: 'right', fontFamily: typography.sans, fontSize: 16, lineHeight: 24, fontWeight: '600' }, healthRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 9, marginTop: 14 }, dot: { width: 9, height: 9, marginTop: 7, borderRadius: 5 }, rowLabel: { color: colors.text, fontFamily: typography.sans, fontSize: 17, lineHeight: 24, fontWeight: '600', flexShrink: 1 }, rowDetail: { marginTop: 2, color: colors.textMuted, fontFamily: typography.sans, fontSize: 16, lineHeight: 24, flexShrink: 1 }, disclaimer: { marginTop: 15, color: colors.textMuted, fontFamily: typography.sans, fontSize: 16, lineHeight: 24 },
  verification: { marginTop: 14, color: colors.text, fontFamily: typography.sans, fontSize: 13, fontWeight: '800' }, certification: { color: colors.goldLight, fontFamily: typography.sans, fontSize: 12, fontWeight: '800', flexShrink: 1 }, certifierLink: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginTop: 10 }, check: { marginTop: 8, color: colors.textSecondary, fontFamily: typography.sans, fontSize: 11.5 }, source: { marginTop: 10, padding: 12, borderRadius: 14, backgroundColor: colors.backgroundSecondary }, boycottCard: { marginTop: 12, padding: 18, borderRadius: 22, backgroundColor: 'rgba(233,107,114,0.13)', borderWidth: 1, borderColor: 'rgba(233,107,114,0.42)' }, boycottTitle: { flexDirection: 'row', alignItems: 'center', gap: 8 }, boycottHeading: { color: colors.danger, fontFamily: typography.sans, fontSize: 18, fontWeight: '900' }, boycottReason: { marginTop: 14, color: colors.textMuted, fontFamily: typography.sans, fontSize: 11, fontWeight: '800' }, boycottSummary: { marginTop: 5, color: colors.text, fontFamily: typography.sans, fontSize: 12.5, lineHeight: 19 }, boycottAction: { marginTop: 16, minHeight: 50, borderRadius: 17, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 14, backgroundColor: colors.danger }, actionText: { color: '#FFF', fontFamily: typography.sans, fontSize: 15, fontWeight: '800', textAlign: 'center' },
  alternativeCard: { width: 292, marginRight: 10 }, alternativePager: { marginTop: 8, color: colors.textMuted, fontFamily: typography.sans, fontSize: 14, lineHeight: 20, textAlign: 'right' }, alternativesList: { paddingBottom: 3 }, alternative: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 8, padding: 10, borderRadius: 16, backgroundColor: colors.backgroundSecondary }, alternativePressed: { opacity: 0.72 }, alternativeMetaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 7 }, alternativeStatus: { color: colors.success, fontFamily: typography.sans, fontSize: 16, lineHeight: 24, fontWeight: '600' }, alternativeHealth: { marginTop: 5, color: colors.text, fontFamily: typography.sans, fontSize: 16, lineHeight: 24, fontWeight: '700' }, alternativeMeta: { marginTop: 5, color: colors.textMuted, fontFamily: typography.sans, fontSize: 16, lineHeight: 24, fontWeight: '600' }, recallPill: { marginTop: 6, alignSelf: 'flex-start', minHeight: 28, paddingHorizontal: 10, borderRadius: 14, flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: colors.danger }, recallPillText: { color: '#FFF', fontFamily: typography.sans, fontSize: 12.5, fontWeight: '800' }, recallCard: { marginTop: 14, padding: 14, borderRadius: 16, backgroundColor: 'rgba(233,107,114,0.10)', borderWidth: 1, borderColor: 'rgba(233,107,114,0.30)' }, recallTitle: { color: colors.text, fontFamily: typography.sans, fontSize: 16, lineHeight: 22, fontWeight: '800' }, viewerBackdrop: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20, backgroundColor: 'rgba(4,3,9,0.94)' }, viewerFrame: { width: '100%', aspectRatio: 1, maxWidth: 520, borderRadius: 24, overflow: 'hidden', backgroundColor: '#FFF' }, viewerImage: { width: '100%', height: '100%' }, viewerCaption: { marginTop: 16, color: colors.text, fontFamily: typography.sans, fontSize: 16, lineHeight: 22, fontWeight: '700', textAlign: 'center' }, viewerCredit: { marginTop: 6, color: colors.textMuted, fontFamily: typography.sans, fontSize: 12 }, viewerClose: { position: 'absolute', top: 48, right: 20, width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.14)' }, altScoreRow: { marginTop: 8, flexDirection: 'row', alignItems: 'center', gap: 8 }, altGradeBubble: { width: 30, height: 30, borderRadius: 10, alignItems: 'center', justifyContent: 'center' }, altGrade: { fontFamily: typography.sans, fontSize: 16, fontWeight: '800' }, altScore: { fontFamily: typography.sans, fontSize: 15, fontWeight: '800' }, altImage: { width: 64, height: 64, borderRadius: 16 }, altName: { color: colors.text, fontFamily: typography.sans, fontSize: 22, lineHeight: 28, fontWeight: '700', flexShrink: 1 }, altLink: { marginTop: 6, color: colors.goldLight, fontFamily: typography.sans, fontSize: 16, lineHeight: 24, fontWeight: '600' }, reason: { marginTop: 9, color: colors.textSecondary, fontFamily: typography.sans, fontSize: 16, lineHeight: 24, flexShrink: 1 },
  section: { marginTop: 12, borderRadius: 24, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderSoft, overflow: 'hidden' },
  sectionOpen: { borderColor: 'rgba(227,181,90,0.35)' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 16, paddingVertical: 16 },
  sectionIcon: { width: 46, height: 46, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  sectionLabel: { color: colors.textMuted, fontFamily: typography.sans, fontSize: 13, lineHeight: 18, fontWeight: '700', letterSpacing: 0.4 },
  sectionValue: { marginTop: 2, fontFamily: typography.sans, fontSize: 18, lineHeight: 24, fontWeight: '800' },
  sectionBody: { paddingHorizontal: 18, paddingBottom: 20, paddingTop: 4 },
  pressed: { opacity: 0.7 },
  bodyLead: { color: colors.text, fontFamily: typography.sans, fontSize: 16, lineHeight: 25 },
  bodyText: { color: colors.textSecondary, fontFamily: typography.sans, fontSize: 15, lineHeight: 22, flexShrink: 1 },
  bodyNote: { marginTop: 14, color: colors.textMuted, fontFamily: typography.sans, fontSize: 13, lineHeight: 19 },
  blockTitle: { marginTop: 22, marginBottom: 4, color: colors.goldLight, fontFamily: typography.sans, fontSize: 13, lineHeight: 18, fontWeight: '800', letterSpacing: 0.4, textTransform: 'uppercase' },
  linkRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginTop: 16, paddingVertical: 12, paddingHorizontal: 14, borderRadius: 14, backgroundColor: 'rgba(227,181,90,0.08)' },
  linkText: { flex: 1, minWidth: 0, color: colors.goldLight, fontFamily: typography.sans, fontSize: 15, lineHeight: 21, fontWeight: '700' },
  dangerButton: { marginTop: 16, minHeight: 50, borderRadius: 16, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 14, backgroundColor: colors.danger },
  gradeBubble: { width: 64, height: 64, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  pillar: { marginTop: 14 },
  pillarTop: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  pillarLabel: { flex: 1, minWidth: 0, color: colors.text, fontFamily: typography.sans, fontSize: 15, lineHeight: 21, fontWeight: '600' },
  pillarScore: { fontFamily: typography.sans, fontSize: 15, lineHeight: 21, fontWeight: '800' },
  pillarTrack: { marginTop: 7, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.07)', overflow: 'hidden' },
  pillarFill: { height: 6, borderRadius: 3 },
  pillarDetail: { marginTop: 6, color: colors.textMuted, fontFamily: typography.sans, fontSize: 13, lineHeight: 18 },
  notice: { marginTop: 14, padding: 14, borderRadius: 14, backgroundColor: 'rgba(200,148,58,0.10)' },
  noticeNote: { marginTop: 8 },
  blockTitleFirst: { marginBottom: 8, color: colors.goldLight, fontFamily: typography.sans, fontSize: 13, lineHeight: 18, fontWeight: '800', letterSpacing: 0.4, textTransform: 'uppercase' },
  certifierRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 16, backgroundColor: 'rgba(98,197,139,0.10)', borderWidth: 1, borderColor: 'rgba(98,197,139,0.30)' },
  certifierName: { color: colors.text, fontFamily: typography.sans, fontSize: 18, lineHeight: 24, fontWeight: '800' },
  certifierMeta: { marginTop: 2, color: colors.textSecondary, fontFamily: typography.sans, fontSize: 13, lineHeight: 18 },
  bodySpaced: { marginTop: 10 },
  chain: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  chainItem: { maxWidth: '45%', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.06)', color: colors.text, fontFamily: typography.sans, fontSize: 14, lineHeight: 19, fontWeight: '700' },
  chainGroup: { backgroundColor: 'rgba(233,107,114,0.16)', color: colors.danger },
  noticeTitle: { marginBottom: 4, color: colors.warning, fontFamily: typography.sans, fontSize: 14, lineHeight: 20, fontWeight: '800' },
  checkRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginTop: 10 },
  primary: { marginTop: 24, minHeight: 54, borderRadius: 18, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.goldLight }, primaryText: { color: '#17111C', fontFamily: typography.sans, fontSize: 15, fontWeight: '800' }, secondary: { marginTop: 10, minHeight: 48, borderRadius: 17, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: colors.borderSoft },
});
