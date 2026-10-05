import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

import { RESTRICTION_SECTIONS, type RestrictionTone } from '../../features/muslim-names/restricted-names';
import { NAME_SOURCES, type NameSourceId, type NameTextSource } from '../../features/muslim-names/scholar-sources';
import { usePrenomsText } from '../../features/muslim-names/i18n';
import { SourceChips, SourceSheet } from '../../features/muslim-names/SourceSheet';
import { ScreenHeader, prenomTheme } from '../../features/muslim-names/ui';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';

// Each principle quotes its source word for word (French text of NAME_SOURCES).
const PRINCIPLES: { title: string; quote: string; titleEn: string; quoteEn: string; sources: NameSourceId[] }[] = [
  { title: 'La règle de base', quote: 'La règle de base en matière de noms est la permission, sauf ce dont une preuve montre qu’il est réprouvé, en lui-même ou par un nom semblable.', titleEn: 'The basic rule', quoteEn: 'The basic rule in naming is permissibility, except what evidence shows to be disliked, in itself or through a similar name.', sources: ['uthQuranNames'] },
  { title: 'Les noms les plus aimés d’Allah', quote: '« Les noms les plus aimés d’Allah sont ‘Abdullah et ‘Abd al-Rahman. »', titleEn: 'The names dearest to Allah', quoteEn: '“The names dearest to Allah are \'Abdullah and \'Abd al-Rahman.”', sources: ['muslim2132'] },
  { title: 'Les noms rattachés à Allah', quote: 'Tout [nom] rattaché à Allah est meilleur que les autres.', titleEn: 'Names attached to Allah', quoteEn: 'Every [name] attached to Allah is better than the others.', sources: ['uthNaming'] },
  { title: 'Les noms des prophètes', quote: '« Appelez-vous par les noms des Prophètes. »', titleEn: 'Names of the prophets', quoteEn: '“Call yourselves by the names of the Prophets.”', sources: ['abuDawud4950'] },
  { title: 'Les noms des messagers', quote: 'Les noms des messagers sont meilleurs que les autres, sauf ce qui est plus aimé d’Allah, qui est meilleur.', titleEn: 'Names of the messengers', quoteEn: 'The names of the messengers are better than the names of others, except what is dearer to Allah, which is better.', sources: ['uthNaming'] },
  { title: 'Pour une fille', quote: 'Pour les femmes, ce qui était en usage parmi les femmes des Compagnons et les croyantes après elles : des noms connus, sans laideur.', titleEn: 'For a girl', quoteEn: 'For women, what was customary among the women of the Companions and the believing women after them: well-known names with nothing ugly in them.', sources: ['bazWhenWho', 'uthMalak'] },
  { title: 'Qui choisit ?', quote: 'Celui qui a le plus droit de nommer est le père […] Il est recommandé de s’entraider et de se concerter entre le père et la mère afin que tous choisissent un beau nom.', titleEn: 'Who chooses?', quoteEn: 'The one with the most right to name is the father […] It is recommended to help one another in this and for the father and the mother to consult each other, so that all choose a good name.', sources: ['bazWhenWho', 'uthNaming'] },
  { title: 'Quand nommer ?', quote: 'Le mieux est de nommer le septième jour ; si l’on nomme le jour de la naissance, il n’y a pas de mal.', titleEn: 'When to name?', quoteEn: 'It is best to name on the seventh day; if one names on the day of birth, there is no harm.', sources: ['bazWhenWho'] },
];

const TONES: Record<RestrictionTone, { label: 'toneForbidden' | 'toneAvoid' | 'toneDisputed' | 'toneAllowed'; accent: string; wash: string; border: string; icon: keyof typeof Ionicons.glyphMap }> = {
  forbidden: { label: 'toneForbidden', accent: '#FF7E86', wash: 'rgba(255,86,96,.09)', border: 'rgba(255,104,112,.34)', icon: 'close-circle-outline' },
  avoid: { label: 'toneAvoid', accent: '#FFAD68', wash: 'rgba(255,157,79,.08)', border: 'rgba(255,173,104,.30)', icon: 'warning-outline' },
  disputed: { label: 'toneDisputed', accent: '#D5B4FF', wash: 'rgba(190,144,255,.08)', border: 'rgba(213,180,255,.28)', icon: 'git-compare-outline' },
  allowed: { label: 'toneAllowed', accent: '#62C58B', wash: 'rgba(98,197,139,.08)', border: 'rgba(98,197,139,.30)', icon: 'checkmark-circle-outline' },
};

export default function BeforeChoosingScreen() {
  const { lang, tx } = usePrenomsText();
  const en = lang === 'en';
  const [open, setOpen] = useState<string[]>(['taabid']);
  const [source, setSource] = useState<NameSourceId | null>(null);
  const toggle = (id: string) => setOpen((current) => current.includes(id) ? current.filter((value) => value !== id) : [...current, id]);
  const usedSources = Object.keys(NAME_SOURCES) as NameSourceId[];
  const sourceReference = (id: NameSourceId) => {
    const item: NameTextSource = NAME_SOURCES[id];
    return en ? item.referenceEn ?? item.reference : item.reference;
  };

  return <LinearGradient colors={[colors.background, colors.backgroundSecondary, colors.background]} style={styles.screen}>
    <SafeAreaView style={styles.safe}>
      <ScreenHeader title={tx.beforeTitle} onBack={() => router.back()}/>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>{tx.beforeTitle}</Text>
        <Text style={styles.lead}>{tx.beforeLead}</Text>

        <Text style={styles.label}>{tx.principles}</Text>
        <View style={styles.list}>
          {PRINCIPLES.map((item) => <View key={item.title} style={styles.principle}>
            <Text style={styles.principleTitle}>{en ? item.titleEn : item.title}</Text>
            <Text style={styles.quote}>{en ? item.quoteEn : item.quote}</Text>
            <SourceChips ids={item.sources} onOpen={setSource}/>
          </View>)}
        </View>

        <Text style={styles.label}>{tx.restricted}</Text>
        <View style={styles.legend}>{(Object.keys(TONES) as RestrictionTone[]).map((tone) => <View key={tone} style={styles.legendItem}><View style={[styles.dot, { backgroundColor: TONES[tone].accent }]}/><Text style={styles.legendText}>{tx[TONES[tone].label]}</Text></View>)}</View>
        <View style={styles.list}>
          {RESTRICTION_SECTIONS.map((section) => {
            const tone = TONES[section.tone];
            const opened = open.includes(section.id);
            return <View key={section.id} style={[styles.section, { borderColor: tone.border }]}>
              <Pressable onPress={() => toggle(section.id)} style={({ pressed }) => [styles.sectionHeader, pressed && styles.pressed]} accessibilityRole="button" accessibilityState={{ expanded: opened }}>
                <Ionicons name={tone.icon} size={19} color={tone.accent}/>
                <Text style={styles.sectionTitle}>{en ? section.titleEn : section.title}</Text>
                <Text style={styles.count}>{section.examples.length}</Text>
                <Ionicons name={opened ? 'chevron-up' : 'chevron-down'} size={17} color={colors.textMuted}/>
              </Pressable>
              {opened ? <View style={styles.sectionBody}>
                {section.examples.map((example) => {
                  const exampleTone = TONES[example.tone];
                  return <View key={example.name} style={styles.example}>
                    <View style={styles.exampleTop}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.exampleName}>{en ? example.nameEn ?? example.name : example.name}</Text>
                        {example.meaning ? <Text style={styles.meaning}>{en ? example.meaningEn ?? example.meaning : example.meaning}</Text> : null}
                      </View>
                      {example.arabic ? <Text style={styles.arabic}>{example.arabic}</Text> : null}
                    </View>
                    <View style={[styles.verdictPill, { borderColor: exampleTone.border, backgroundColor: exampleTone.wash }]}><Text style={[styles.verdictPillText, { color: exampleTone.accent }]}>{tx[exampleTone.label]}</Text></View>
                    {example.verdicts.map((verdict) => <Pressable key={verdict.source} onPress={() => setSource(verdict.source)} style={({ pressed }) => [styles.verdict, pressed && styles.pressed]}>
                      <Text style={styles.verdictSource}>{NAME_SOURCES[verdict.source].short}</Text>
                      <Text style={styles.verdictText}>{en ? verdict.saysEn : verdict.says}</Text>
                      <Ionicons name="chevron-forward" size={14} color={colors.textMuted}/>
                    </Pressable>)}
                  </View>;
                })}
              </View> : null}
            </View>;
          })}
        </View>

        <Text style={styles.label}>{tx.sourcesLabel}</Text>
        <View style={styles.sources}>
          {usedSources.map((id) => <Pressable key={id} onPress={() => setSource(id)} style={({ pressed }) => [styles.sourceRow, pressed && styles.pressed]}>
            <View style={{ flex: 1 }}>
              <Text style={styles.sourceAuthor}>{NAME_SOURCES[id].author}</Text>
              <Text style={styles.sourceRef}>{sourceReference(id)}</Text>
            </View>
            <Ionicons name="chevron-forward" size={15} color={colors.textMuted}/>
          </Pressable>)}
        </View>
      </ScrollView>

      <SourceSheet id={source} onClose={() => setSource(null)}/>
    </SafeAreaView>
  </LinearGradient>;
}

const styles = StyleSheet.create({
  screen: { flex: 1 }, safe: { flex: 1 }, pressed: { opacity: .72 }, content: { paddingHorizontal: 18, paddingBottom: 54 },
  title: { marginTop: 4, color: colors.text, fontFamily: typography.serifSemibold, fontSize: 36, lineHeight: 40 },
  lead: { marginTop: 8, color: colors.textSecondary, fontFamily: typography.sans, fontSize: 15, lineHeight: 22 },
  label: { marginTop: 28, marginBottom: 10, color: colors.goldLight, fontFamily: typography.sans, fontSize: 11, fontWeight: '800', letterSpacing: 1.4 },
  list: { gap: 10 },
  principle: { paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.borderSoft },
  principleTitle: { color: colors.text, fontFamily: typography.sans, fontSize: 16.5, fontWeight: '800' },
  quote: { marginTop: 6, color: colors.textSecondary, fontFamily: typography.sans, fontSize: 15.5, lineHeight: 23 },
  legend: { marginBottom: 12, flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 }, dot: { width: 7, height: 7, borderRadius: 4 },
  legendText: { color: colors.textMuted, fontFamily: typography.sans, fontSize: 12 },
  section: { borderRadius: 20, borderWidth: 1, backgroundColor: prenomTheme.card, overflow: 'hidden' },
  sectionHeader: { minHeight: 56, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 10 },
  sectionTitle: { flex: 1, color: colors.text, fontFamily: typography.sans, fontSize: 16.5, fontWeight: '800' },
  count: { color: colors.textMuted, fontFamily: typography.sans, fontSize: 13, fontWeight: '700' },
  sectionBody: { paddingHorizontal: 14, paddingBottom: 6, borderTopWidth: 1, borderTopColor: colors.borderSoft },
  example: { paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: 'rgba(126,78,151,.18)' },
  exampleTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  exampleName: { color: colors.text, fontFamily: typography.serifSemibold, fontSize: 22, lineHeight: 27 },
  meaning: { marginTop: 2, color: colors.textMuted, fontFamily: typography.sans, fontSize: 13 },
  arabic: { maxWidth: '48%', color: colors.goldLight, fontFamily: typography.arabic, fontSize: 21, textAlign: 'right' },
  verdictPill: { alignSelf: 'flex-start', marginTop: 9, paddingHorizontal: 9, paddingVertical: 4, borderRadius: 999, borderWidth: 1 },
  verdictPillText: { fontFamily: typography.sans, fontSize: 11.5, fontWeight: '900' },
  verdict: { marginTop: 8, flexDirection: 'row', alignItems: 'flex-start', gap: 9 },
  verdictSource: { width: 104, color: colors.goldLight, fontFamily: typography.sans, fontSize: 12.5, fontWeight: '800', lineHeight: 20 },
  verdictText: { flex: 1, color: colors.textSecondary, fontFamily: typography.sans, fontSize: 14, lineHeight: 20 },
  sources: { borderTopWidth: 1, borderTopColor: colors.borderSoft },
  sourceRow: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.borderSoft, flexDirection: 'row', alignItems: 'center', gap: 10 },
  sourceAuthor: { color: colors.text, fontFamily: typography.sans, fontSize: 14, fontWeight: '800' },
  sourceRef: { marginTop: 2, color: colors.textMuted, fontFamily: typography.sans, fontSize: 12.5, lineHeight: 18 },
});
