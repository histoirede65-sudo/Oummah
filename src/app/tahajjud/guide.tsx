import { Ionicons } from '@expo/vector-icons';
import type { Href } from 'expo-router';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { TahajjudShell } from '../../components/tahajjud/TahajjudShell';
import { night, nightType } from '../../components/tahajjud/theme';
import { GUIDE, type GuideStep, type GuideTab } from '../../features/tahajjud/tahajjudContent';

function Step({ step, index, last }: { step: GuideStep; index: number; last: boolean }) {
  const [open, setOpen] = useState(index === 0);
  return (
    <Animated.View entering={FadeInDown.delay(index * 70).duration(400)} style={styles.stepRow}>
      {/* Timeline */}
      <View style={styles.rail}>
        <View style={[styles.node, open && styles.nodeOn]}>
          <Ionicons name={step.icon as keyof typeof Ionicons.glyphMap} size={17} color={open ? night.sky0 : night.goldSoft} />
        </View>
        {!last ? <View style={styles.line} /> : null}
      </View>

      <Pressable onPress={() => setOpen((value) => !value)} style={[styles.card, open && styles.cardOpen]}>
        <View style={styles.cardHeader}>
          <Text style={styles.stepTitle}>{step.title}</Text>
          <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={16} color={night.muted} />
        </View>
        {open ? (
          <>
            <Text style={styles.body}>{step.body}</Text>
            {step.proof ? (
              <View style={styles.proof}>
                {step.proof.arabic ? <Text style={styles.arabic}>{step.proof.arabic}</Text> : null}
                {step.proof.phonetic ? <Text style={styles.phonetic}>{step.proof.phonetic}</Text> : null}
                <Text style={styles.proofText}>« {step.proof.text} »</Text>
                <Text style={styles.proofSource}>{step.proof.source}</Text>
              </View>
            ) : null}
            {step.tip ? (
              <View style={styles.tip}>
                <Ionicons name="bulb-outline" size={14} color={night.goldSoft} />
                <Text style={styles.tipText}>{step.tip}</Text>
              </View>
            ) : null}
            {step.action ? (
              <Pressable onPress={() => router.push(step.action!.route as Href)} style={styles.action}>
                <Text style={styles.actionText}>{step.action.label}</Text>
                <Ionicons name="arrow-forward" size={14} color={night.sky0} />
              </Pressable>
            ) : null}
          </>
        ) : null}
      </Pressable>
    </Animated.View>
  );
}

export default function TahajjudGuideScreen() {
  const [tabId, setTabId] = useState<GuideTab['id']>('understand');
  const tab = GUIDE.find((item) => item.id === tabId) ?? GUIDE[0];

  return (
    <TahajjudShell title="Apprendre Tahajjud" eyebrow="Guide">
      <View style={styles.tabs}>
        {GUIDE.map((item) => (
          <Pressable key={item.id} onPress={() => setTabId(item.id)} style={[styles.tab, { flex: item.label.length + 4 }, tabId === item.id && styles.tabOn]}>
            <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8} style={[styles.tabText, tabId === item.id && styles.tabTextOn]}>{item.label}</Text>
          </Pressable>
        ))}
      </View>
      <Text style={styles.intro}>{tab.intro}</Text>
      <View key={tab.id}>
        {tab.steps.map((step, index) => (
          <Step key={step.id} step={step} index={index} last={index === tab.steps.length - 1} />
        ))}
      </View>
    </TahajjudShell>
  );
}

const styles = StyleSheet.create({
  tabs: { flexDirection: 'row', padding: 5, borderRadius: 22, backgroundColor: night.glass, borderWidth: 1, borderColor: night.line },
  tab: { height: 52, borderRadius: 17, paddingHorizontal: 6, alignItems: 'center', justifyContent: 'center' },
  tabOn: { backgroundColor: night.gold },
  tabText: { color: night.textSoft, fontSize: 18, ...nightType.semibold },
  tabTextOn: { color: night.sky0, ...nightType.bold },
  intro: { marginTop: 18, marginBottom: 18, color: night.textSoft, fontSize: 18, lineHeight: 26, ...nightType.body },
  stepRow: { flexDirection: 'row', gap: 12 },
  rail: { width: 38, alignItems: 'center' },
  node: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: night.goldLine, backgroundColor: 'rgba(227,181,90,0.08)' },
  nodeOn: { backgroundColor: night.gold, borderColor: night.gold },
  line: { flex: 1, width: 1.5, marginVertical: 4, backgroundColor: night.goldLine },
  card: { flex: 1, marginBottom: 12, borderRadius: 20, padding: 16, backgroundColor: night.glass, borderWidth: 1, borderColor: night.line },
  cardOpen: { borderColor: night.goldLine },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  stepTitle: { flex: 1, color: night.text, fontSize: 20, ...nightType.semibold },
  body: { marginTop: 10, color: night.textSoft, fontSize: 17, lineHeight: 25, ...nightType.body },
  proof: { marginTop: 12, padding: 14, borderRadius: 16, backgroundColor: 'rgba(0,0,0,0.22)', borderLeftWidth: 2, borderLeftColor: night.gold },
  phonetic: { marginBottom: 10, color: night.goldSoft, fontSize: 16, lineHeight: 23, fontStyle: 'italic', ...nightType.medium },
  arabic: { color: night.moon, fontSize: 22, lineHeight: 38, textAlign: 'right', writingDirection: 'rtl', marginBottom: 8, ...nightType.arabic },
  proofText: { color: night.textSoft, fontSize: 17, lineHeight: 24, fontStyle: 'italic', ...nightType.body },
  proofSource: { marginTop: 8, color: night.gold, fontSize: 15, ...nightType.semibold },
  tip: { marginTop: 12, flexDirection: 'row', gap: 8 },
  tipText: { flex: 1, color: night.muted, fontSize: 16, lineHeight: 21, ...nightType.body },
  action: { marginTop: 14, alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 18, backgroundColor: night.gold },
  actionText: { color: night.sky0, fontSize: 16, ...nightType.bold },
});
