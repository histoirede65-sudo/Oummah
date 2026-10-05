import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

import { RESTRICTION_SECTIONS, type RestrictionTone } from '../../features/muslim-names/restricted-names';
import { NAME_SOURCES, type NameSourceId } from '../../features/muslim-names/scholar-sources';
import { SourceChips, SourceSheet } from '../../features/muslim-names/SourceSheet';
import { ScreenHeader, prenomTheme } from '../../features/muslim-names/ui';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';

// Each principle quotes its source word for word (French text of NAME_SOURCES).
const PRINCIPLES: { title: string; quote: string; sources: NameSourceId[] }[] = [
  { title: 'La règle de base', quote: 'La règle de base en matière de noms est la permission, sauf ce dont une preuve montre qu’il est réprouvé, en lui-même ou par un nom semblable.', sources: ['uthQuranNames'] },
  { title: 'Les noms les plus aimés d’Allah', quote: '« Les noms les plus aimés d’Allah sont ‘Abdullah et ‘Abd al-Rahman. »', sources: ['muslim2132'] },
  { title: 'Les noms rattachés à Allah', quote: 'Tout [nom] rattaché à Allah est meilleur que les autres.', sources: ['uthNaming'] },
  { title: 'Les noms des prophètes', quote: '« Appelez-vous par les noms des Prophètes. »', sources: ['abuDawud4950'] },
  { title: 'Les noms des messagers', quote: 'Les noms des messagers sont meilleurs que les autres, sauf ce qui est plus aimé d’Allah, qui est meilleur.', sources: ['uthNaming'] },
  { title: 'Pour une fille', quote: 'Pour les femmes, ce qui était en usage parmi les femmes des Compagnons et les croyantes après elles : des noms connus, sans laideur.', sources: ['bazWhenWho', 'uthMalak'] },
  { title: 'Qui choisit ?', quote: 'Celui qui a le plus droit de nommer est le père […] Il est recommandé de s’entraider et de se concerter entre le père et la mère afin que tous choisissent un beau nom.', sources: ['bazWhenWho', 'uthNaming'] },
  { title: 'Quand nommer ?', quote: 'Le mieux est de nommer le septième jour ; si l’on nomme le jour de la naissance, il n’y a pas de mal.', sources: ['bazWhenWho'] },
];

const TONES: Record<RestrictionTone, { label: string; accent: string; wash: string; border: string; icon: keyof typeof Ionicons.glyphMap }> = {
  forbidden: { label: 'Interdit', accent: '#FF7E86', wash: 'rgba(255,86,96,.09)', border: 'rgba(255,104,112,.34)', icon: 'close-circle-outline' },
  avoid: { label: 'À éviter', accent: '#FFAD68', wash: 'rgba(255,157,79,.08)', border: 'rgba(255,173,104,.30)', icon: 'warning-outline' },
  disputed: { label: 'Avis divergents', accent: '#D5B4FF', wash: 'rgba(190,144,255,.08)', border: 'rgba(213,180,255,.28)', icon: 'git-compare-outline' },
  allowed: { label: 'Permis', accent: '#62C58B', wash: 'rgba(98,197,139,.08)', border: 'rgba(98,197,139,.30)', icon: 'checkmark-circle-outline' },
};

export default function BeforeChoosingScreen() {
  const [open, setOpen] = useState<string[]>(['taabid']);
  const [source, setSource] = useState<NameSourceId | null>(null);
  const toggle = (id: string) => setOpen((current) => current.includes(id) ? current.filter((value) => value !== id) : [...current, id]);
  const usedSources = Object.keys(NAME_SOURCES) as NameSourceId[];

  return <LinearGradient colors={[colors.background, colors.backgroundSecondary, colors.background]} style={styles.screen}>
    <SafeAreaView style={styles.safe}>
      <ScreenHeader title="Avant de choisir" onBack={() => router.back()}/>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Avant de choisir</Text>
        <Text style={styles.lead}>Chaque repère et chaque avis de cette page est cité mot pour mot : hadiths, fatwas d’Ibn Bâz et d’Ibn ‘Uthaymîn. Touchez une source pour lire le texte complet.</Text>

        <Text style={styles.label}>REPÈRES</Text>
        <View style={styles.list}>
          {PRINCIPLES.map((item) => <View key={item.title} style={styles.principle}>
            <Text style={styles.principleTitle}>{item.title}</Text>
            <Text style={styles.quote}>{item.quote}</Text>
            <SourceChips ids={item.sources} onOpen={setSource}/>
          </View>)}
        </View>

        <Text style={styles.label}>PRÉNOMS INTERDITS, À ÉVITER OU DISCUTÉS</Text>
        <View style={styles.legend}>{(Object.keys(TONES) as RestrictionTone[]).map((tone) => <View key={tone} style={styles.legendItem}><View style={[styles.dot, { backgroundColor: TONES[tone].accent }]}/><Text style={styles.legendText}>{TONES[tone].label}</Text></View>)}</View>
        <View style={styles.list}>
          {RESTRICTION_SECTIONS.map((section) => {
            const tone = TONES[section.tone];
            const opened = open.includes(section.id);
            return <View key={section.id} style={[styles.section, { borderColor: tone.border }]}>
              <Pressable onPress={() => toggle(section.id)} style={({ pressed }) => [styles.sectionHeader, pressed && styles.pressed]} accessibilityRole="button" accessibilityState={{ expanded: opened }}>
                <Ionicons name={tone.icon} size={19} color={tone.accent}/>
                <Text style={styles.sectionTitle}>{section.title}</Text>
                <Text style={styles.count}>{section.examples.length}</Text>
                <Ionicons name={opened ? 'chevron-up' : 'chevron-down'} size={17} color={colors.textMuted}/>
              </Pressable>
              {opened ? <View style={styles.sectionBody}>
                {section.examples.map((example) => {
                  const exampleTone = TONES[example.tone];
                  return <View key={example.name} style={styles.example}>
                    <View style={styles.exampleTop}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.exampleName}>{example.name}</Text>
                        {example.meaning ? <Text style={styles.meaning}>{example.meaning}</Text> : null}
                      </View>
                      {example.arabic ? <Text style={styles.arabic}>{example.arabic}</Text> : null}
                    </View>
                    <View style={[styles.verdictPill, { borderColor: exampleTone.border, backgroundColor: exampleTone.wash }]}><Text style={[styles.verdictPillText, { color: exampleTone.accent }]}>{exampleTone.label}</Text></View>
                    {example.verdicts.map((verdict) => <Pressable key={verdict.source} onPress={() => setSource(verdict.source)} style={({ pressed }) => [styles.verdict, pressed && styles.pressed]}>
                      <Text style={styles.verdictSource}>{NAME_SOURCES[verdict.source].short}</Text>
                      <Text style={styles.verdictText}>{verdict.says}</Text>
                      <Ionicons name="chevron-forward" size={14} color={colors.textMuted}/>
                    </Pressable>)}
                  </View>;
                })}
              </View> : null}
            </View>;
          })}
        </View>

        <Text style={styles.label}>SOURCES</Text>
        <View style={styles.sources}>
          {usedSources.map((id) => <Pressable key={id} onPress={() => setSource(id)} style={({ pressed }) => [styles.sourceRow, pressed && styles.pressed]}>
            <View style={{ flex: 1 }}>
              <Text style={styles.sourceAuthor}>{NAME_SOURCES[id].author}</Text>
              <Text style={styles.sourceRef}>{NAME_SOURCES[id].reference}</Text>
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
  lead: { marginTop: 8, color: colors.textSecondary, fontFamily: typography.sans, fontSize: 12.5, lineHeight: 19 },
  label: { marginTop: 28, marginBottom: 10, color: colors.goldLight, fontFamily: typography.sans, fontSize: 9.5, fontWeight: '800', letterSpacing: 1.4 },
  list: { gap: 10 },
  principle: { paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.borderSoft },
  principleTitle: { color: colors.text, fontFamily: typography.sans, fontSize: 14, fontWeight: '800' },
  quote: { marginTop: 6, color: colors.textSecondary, fontFamily: typography.sans, fontSize: 14, lineHeight: 21 },
  legend: { marginBottom: 12, flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 }, dot: { width: 7, height: 7, borderRadius: 4 },
  legendText: { color: colors.textMuted, fontFamily: typography.sans, fontSize: 10 },
  section: { borderRadius: 20, borderWidth: 1, backgroundColor: prenomTheme.card, overflow: 'hidden' },
  sectionHeader: { minHeight: 56, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 10 },
  sectionTitle: { flex: 1, color: colors.text, fontFamily: typography.sans, fontSize: 14.5, fontWeight: '800' },
  count: { color: colors.textMuted, fontFamily: typography.sans, fontSize: 11, fontWeight: '700' },
  sectionBody: { paddingHorizontal: 14, paddingBottom: 6, borderTopWidth: 1, borderTopColor: colors.borderSoft },
  example: { paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: 'rgba(126,78,151,.18)' },
  exampleTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  exampleName: { color: colors.text, fontFamily: typography.serifSemibold, fontSize: 20, lineHeight: 24 },
  meaning: { marginTop: 2, color: colors.textMuted, fontFamily: typography.sans, fontSize: 11 },
  arabic: { maxWidth: '48%', color: colors.goldLight, fontFamily: typography.arabic, fontSize: 19, textAlign: 'right' },
  verdictPill: { alignSelf: 'flex-start', marginTop: 9, paddingHorizontal: 9, paddingVertical: 4, borderRadius: 999, borderWidth: 1 },
  verdictPillText: { fontFamily: typography.sans, fontSize: 9.5, fontWeight: '900' },
  verdict: { marginTop: 8, flexDirection: 'row', alignItems: 'flex-start', gap: 9 },
  verdictSource: { width: 92, color: colors.goldLight, fontFamily: typography.sans, fontSize: 10.5, fontWeight: '800', lineHeight: 16 },
  verdictText: { flex: 1, color: colors.textSecondary, fontFamily: typography.sans, fontSize: 11.5, lineHeight: 16 },
  sources: { borderTopWidth: 1, borderTopColor: colors.borderSoft },
  sourceRow: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.borderSoft, flexDirection: 'row', alignItems: 'center', gap: 10 },
  sourceAuthor: { color: colors.text, fontFamily: typography.sans, fontSize: 12, fontWeight: '800' },
  sourceRef: { marginTop: 2, color: colors.textMuted, fontFamily: typography.sans, fontSize: 10.5, lineHeight: 15 },
});
