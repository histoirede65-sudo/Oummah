import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import type { Href } from 'expo-router';
import { router, useFocusEffect } from 'expo-router';
import { useKeepAwake } from 'expo-keep-awake';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInRight } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { night, nightType } from '../../components/tahajjud/theme';
import { WakeOthers } from '../../components/tahajjud/WakeBuddy';
import { GUIDE, NIGHT_DUAS, NIGHT_HADITHS, WAKING_DUA, type Source } from '../../features/tahajjud/tahajjudContent';
import { clock, formatDuration } from '../../features/tahajjud/tahajjudNight';
import { duasForNight, loadPrivateDuas, type PrivateDua } from '../../features/tahajjud/TahajjudStore';
import { useTahajjudNight } from '../../features/tahajjud/useTahajjudNight';
import { getWakeRequestsForMe, type WakeRequestForMe } from '../../features/tahajjud/tahajjudWakeBuddy';

/**
 * « Je suis debout » : dark guided session from waking up to « J'ai prié ».
 * Screen kept on, dim colours, one step at a time. Content comes from the sourced guide.
 */

const proofOf = (id: string) => GUIDE.find((tab) => tab.id === 'pray')?.steps.find((step) => step.id === id);
const QUNUT = NIGHT_DUAS[2];
const AFTER_WITR = NIGHT_DUAS[3];

type StepId = 'wake' | 'wudu' | 'intention' | 'pray' | 'duas' | 'witr' | 'done';
const STEPS: { id: StepId; label: string }[] = [
  { id: 'wake', label: 'Réveil' },
  { id: 'wudu', label: 'Ablutions' },
  { id: 'intention', label: 'Intention' },
  { id: 'pray', label: 'Prière' },
  { id: 'duas', label: 'Invocations' },
  { id: 'witr', label: 'Witr' },
  { id: 'done', label: 'Fin' },
];

function SourceBlock({ source }: { source: Source }) {
  return (
    <View style={styles.source}>
      {source.arabic ? <Text style={styles.sourceArabic}>{source.arabic}</Text> : null}
      {source.phonetic ? <Text style={styles.sourcePhonetic}>{source.phonetic}</Text> : null}
      <Text style={styles.sourceText}>{source.text}</Text>
      <Text style={styles.sourceRef}>{source.source}</Text>
    </View>
  );
}

export default function AwakeScreen() {
  useKeepAwake();
  const view = useTahajjudNight();
  const [index, setIndex] = useState(0);
  const [rakat, setRakat] = useState(0);
  const [witr, setWitr] = useState<1 | 3 | null>(null);
  const [duas, setDuas] = useState<PrivateDua[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [toWake, setToWake] = useState<WakeRequestForMe[]>([]);
  const loadToWake = useCallback(() => {
    void getWakeRequestsForMe().then(setToWake).catch(() => undefined);
  }, []);

  const night_ = view.state?.night ?? null;
  const nightKey = view.state?.validatableKey ?? night_?.key ?? null;

  useFocusEffect(useCallback(() => {
    void loadPrivateDuas().then((list) => setDuas(nightKey ? duasForNight(list, nightKey) : []));
    loadToWake();
  }, [nightKey, loadToWake]));

  const step = STEPS[index];
  const goTo = (next: number) => {
    void Haptics.selectionAsync().catch(() => undefined);
    setIndex(Math.max(0, Math.min(STEPS.length - 1, next)));
  };

  const addRakat = (delta: number) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
    setRakat((value) => Math.max(0, value + delta));
  };

  const finish = async () => {
    if (saving) return;
    if (view.validated) {
      setSaved(true);
      return;
    }
    if (!view.canValidate) {
      router.back();
      return;
    }
    setSaving(true);
    try {
      await view.validate(witr !== null);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
      setSaved(true);
    } finally {
      setSaving(false);
    }
  };

  const now = view.now;
  const toFajr = night_ ? night_.fajr - now : null;

  const body = () => {
    switch (step.id) {
      case 'wake':
        return (
          <>
            <Text style={styles.big}>Bismillah, vous êtes debout.</Text>
            <Text style={styles.lead}>Passez la main sur le visage pour chasser le sommeil, puis dites :</Text>
            <SourceBlock source={WAKING_DUA} />
            {proofOf('wake')?.tip ? <Text style={styles.tip}>{proofOf('wake')?.tip}</Text> : null}
            <WakeOthers requests={toWake} onChanged={loadToWake} compact />
          </>
        );
      case 'wudu':
        return (
          <>
            <Text style={styles.big}>Les ablutions</Text>
            <Text style={styles.lead}>Le sommeil annule les ablutions : faites un wudu complet, calmement, à l’eau fraîche pour vous réveiller.</Text>
            {proofOf('wudu')?.proof ? <SourceBlock source={proofOf('wudu')!.proof!} /> : null}
          </>
        );
      case 'intention':
        return (
          <>
            <Text style={styles.big}>L’intention</Text>
            <Text style={styles.lead}>
              Dans votre cœur : prier la prière de la nuit, pour Allah seul. Nul besoin de la prononcer. Mettez votre téléphone de côté, cet écran restera allumé.
            </Text>
            <SourceBlock source={NIGHT_HADITHS[0]} />
          </>
        );
      case 'pray':
        return (
          <>
            <Text style={styles.big}>Priez deux par deux</Text>
            <Text style={styles.lead}>Commencez par deux rak‘at légères, puis à votre rythme. Touchez le bouton après chaque salam.</Text>
            <View style={styles.counter}>
              <Pressable onPress={() => addRakat(-2)} disabled={rakat === 0} style={[styles.counterSmall, rakat === 0 && styles.disabled]} accessibilityLabel="Retirer deux rak‘at">
                <Ionicons name="remove" size={22} color={night.goldSoft} />
              </Pressable>
              <Pressable onPress={() => addRakat(2)} style={styles.counterMain} accessibilityLabel="Ajouter deux rak‘at">
                <Text style={styles.counterValue}>{rakat}</Text>
                <Text style={styles.counterLabel}>rak‘at · touchez + 2</Text>
              </Pressable>
            </View>
            <Pressable onPress={() => router.push('/tahajjud/recite' as Href)} style={styles.link}>
              <Ionicons name="book-outline" size={18} color={night.goldSoft} />
              <Text style={styles.linkText}>Que réciter dans ma prière ?</Text>
              <Ionicons name="chevron-forward" size={16} color={night.goldSoft} />
            </Pressable>
            {proofOf('start')?.proof ? <SourceBlock source={proofOf('start')!.proof!} /> : null}
          </>
        );
      case 'duas':
        return (
          <>
            <Text style={styles.big}>Le moment des invocations</Text>
            <Text style={styles.lead}>Dans la prosternation ou après la prière, demandez à Allah ce dont vous avez besoin, dans votre langue.</Text>
            {duas.length ? (
              <View style={styles.duaList}>
                <Text style={styles.duaTitle}>Ce que vous avez préparé pour cette nuit</Text>
                {duas.map((dua) => (
                  <View key={dua.id} style={styles.duaRow}>
                    <Ionicons name="heart" size={14} color={night.goldSoft} />
                    <Text style={styles.duaText}>{dua.text}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <Pressable onPress={() => router.push('/tahajjud/duas' as Href)} style={styles.link}>
                <Ionicons name="add-circle-outline" size={18} color={night.goldSoft} />
                <Text style={styles.linkText}>Préparer mes duas de la nuit</Text>
                <Ionicons name="chevron-forward" size={16} color={night.goldSoft} />
              </Pressable>
            )}
            <SourceBlock source={NIGHT_DUAS[1]} />
          </>
        );
      case 'witr':
        return (
          <>
            <Text style={styles.big}>Terminer par le Witr</Text>
            <Text style={styles.lead}>Une ou trois rak‘at pour clore la prière de la nuit. Vous pouvez aussi le garder pour avant Fajr.</Text>
            <View style={styles.witrRow}>
              {([1, 3] as const).map((value) => (
                <Pressable key={value} onPress={() => setWitr(witr === value ? null : value)} style={[styles.witr, witr === value && styles.witrOn]}>
                  <Text style={[styles.witrValue, witr === value && styles.witrTextOn]}>{value}</Text>
                  <Text style={[styles.witrLabel, witr === value && styles.witrTextOn]}>rak‘a{value > 1 ? 't' : ''}</Text>
                </Pressable>
              ))}
            </View>
            <SourceBlock source={QUNUT} />
            <SourceBlock source={AFTER_WITR} />
          </>
        );
      case 'done':
        return saved ? (
          <Animated.View entering={FadeIn.duration(600)} style={styles.doneWrap}>
            <Ionicons name="moon" size={58} color={night.goldSoft} />
            <Text style={styles.big}>Qu’Allah l’accepte.</Text>
            <Text style={styles.lead}>Votre nuit est enregistrée. Reposez-vous jusqu’à Fajr{night_ ? ` (${clock(night_.fajr)})` : ''}.</Text>
            <Pressable onPress={() => router.back()} style={styles.primary}>
              <Text style={styles.primaryText}>Terminer</Text>
            </Pressable>
          </Animated.View>
        ) : (
          <>
            <Text style={styles.big}>Al-hamdu lillah.</Text>
            <Text style={styles.lead}>
              {rakat ? `${rakat} rak‘at` : 'Votre prière'}{witr ? ` et ${witr} de Witr` : ''}. Enregistrez votre nuit pour votre régularité.
            </Text>
            <Pressable onPress={() => void finish()} disabled={saving} style={[styles.primary, saving && styles.disabled]}>
              <Ionicons name="checkmark-circle" size={20} color={night.sky0} />
              <Text style={styles.primaryText}>{view.validated ? 'Nuit déjà enregistrée' : view.canValidate ? 'J’ai prié cette nuit' : 'Fermer'}</Text>
            </Pressable>
          </>
        );
    }
  };

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top', 'bottom']} style={styles.flex}>
        <View style={styles.header}>
          <Pressable accessibilityRole="button" accessibilityLabel="Fermer" onPress={() => router.back()} hitSlop={10} style={styles.close}>
            <Ionicons name="close" size={22} color={night.muted} />
          </Pressable>
          <View style={styles.headerCopy}>
            <Text style={styles.clock}>{clock(now)}</Text>
            {toFajr !== null && toFajr > 0 ? <Text style={styles.fajr}>Fajr dans {formatDuration(toFajr)}</Text> : null}
          </View>
          <View style={styles.close} />
        </View>

        <View style={styles.dots}>
          {STEPS.map((item, i) => (
            <Pressable key={item.id} onPress={() => goTo(i)} hitSlop={6} style={[styles.dot, i === index && styles.dotOn, i < index && styles.dotDone]} />
          ))}
        </View>
        <Text style={styles.stepLabel}>{index + 1}/{STEPS.length} · {step.label}</Text>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Animated.View key={step.id} entering={FadeInRight.duration(350)}>
            {body()}
          </Animated.View>
        </ScrollView>

        {step.id !== 'done' ? (
          <View style={styles.footer}>
            <Pressable onPress={() => goTo(index - 1)} disabled={index === 0} style={[styles.back, index === 0 && styles.hidden]}>
              <Ionicons name="arrow-back" size={20} color={night.goldSoft} />
            </Pressable>
            <Pressable onPress={() => goTo(index + 1)} style={styles.next}>
              <Text style={styles.nextText}>{STEPS[index + 1]?.id === 'done' ? 'Terminer' : 'Suivant'}</Text>
              <Ionicons name="arrow-forward" size={20} color={night.sky0} />
            </Pressable>
          </View>
        ) : null}
      </SafeAreaView>
    </View>
  );
}

const amber = '#E8C98A';

const styles = StyleSheet.create({
  // Darker than the rest of the space: easy on eyes just woken up.
  root: { flex: 1, backgroundColor: '#020107' },
  flex: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 6 },
  close: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  headerCopy: { flex: 1, alignItems: 'center' },
  clock: { color: amber, fontSize: 30, ...nightType.display },
  fajr: { color: night.muted, fontSize: 13, ...nightType.medium },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginTop: 14 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#1F1A33' },
  dotOn: { width: 24, backgroundColor: amber },
  dotDone: { backgroundColor: '#7A6740' },
  stepLabel: { marginTop: 8, textAlign: 'center', color: night.muted, fontSize: 13, letterSpacing: 1.2, textTransform: 'uppercase', ...nightType.bold },
  content: { paddingHorizontal: 22, paddingTop: 22, paddingBottom: 30 },
  big: { color: amber, fontSize: 30, lineHeight: 36, ...nightType.display },
  lead: { marginTop: 12, color: '#FFFFFF', fontSize: 18, lineHeight: 27, ...nightType.body },
  tip: { marginTop: 14, color: night.muted, fontSize: 15, lineHeight: 22, fontStyle: 'italic', ...nightType.body },
  source: { marginTop: 18, padding: 16, borderRadius: 18, backgroundColor: '#0D0A1C', borderLeftWidth: 2, borderLeftColor: '#7A6740' },
  sourceArabic: { color: amber, fontSize: 24, lineHeight: 42, textAlign: 'right', writingDirection: 'rtl', ...nightType.arabic },
  sourcePhonetic: { marginTop: 8, color: '#CDB98C', fontSize: 16, lineHeight: 23, fontStyle: 'italic', ...nightType.medium },
  sourceText: { marginTop: 8, color: '#FFFFFF', fontSize: 16, lineHeight: 23, ...nightType.body },
  sourceRef: { marginTop: 6, color: night.muted, fontSize: 13, ...nightType.semibold },
  counter: { marginTop: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 18 },
  counterSmall: { width: 54, height: 54, borderRadius: 27, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#3A3150' },
  counterMain: { width: 170, height: 170, borderRadius: 85, alignItems: 'center', justifyContent: 'center', backgroundColor: '#120E24', borderWidth: 2, borderColor: '#7A6740' },
  counterValue: { color: amber, fontSize: 64, lineHeight: 70, ...nightType.display },
  counterLabel: { color: night.muted, fontSize: 13, ...nightType.semibold },
  link: { marginTop: 22, flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'center', paddingHorizontal: 18, paddingVertical: 12, borderRadius: 22, borderWidth: 1, borderColor: '#3A3150' },
  linkText: { color: night.goldSoft, fontSize: 16, ...nightType.semibold },
  duaList: { marginTop: 18, padding: 16, borderRadius: 18, backgroundColor: '#0D0A1C', gap: 10 },
  duaTitle: { color: night.muted, fontSize: 13, letterSpacing: 1, textTransform: 'uppercase', ...nightType.bold },
  duaRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  duaText: { flex: 1, color: '#FFFFFF', fontSize: 17, lineHeight: 24, ...nightType.medium },
  witrRow: { marginTop: 20, flexDirection: 'row', justifyContent: 'center', gap: 14 },
  witr: { width: 110, height: 96, borderRadius: 24, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#3A3150', backgroundColor: '#0D0A1C' },
  witrOn: { backgroundColor: amber, borderColor: amber },
  witrValue: { color: amber, fontSize: 36, ...nightType.display },
  witrLabel: { color: night.muted, fontSize: 13, ...nightType.semibold },
  witrTextOn: { color: night.sky0 },
  doneWrap: { alignItems: 'center', paddingTop: 30 },
  primary: { marginTop: 28, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 58, borderRadius: 29, paddingHorizontal: 28, backgroundColor: amber },
  primaryText: { color: night.sky0, fontSize: 18, ...nightType.bold },
  footer: { flexDirection: 'row', gap: 12, paddingHorizontal: 20, paddingVertical: 12 },
  back: { width: 58, height: 58, borderRadius: 29, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#3A3150' },
  hidden: { opacity: 0 },
  next: { flex: 1, height: 58, borderRadius: 29, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: amber },
  nextText: { color: night.sky0, fontSize: 18, ...nightType.bold },
  disabled: { opacity: 0.4 },
});
