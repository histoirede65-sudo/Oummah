import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import type { Href } from 'expo-router';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, { FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated';
import { GlassCard, shellStyles, TahajjudShell } from '../../components/tahajjud/TahajjudShell';
import { night, nightType } from '../../components/tahajjud/theme';
import { NIGHT_DUAS } from '../../features/tahajjud/tahajjudContent';
import {
  duasForNight,
  loadJournal,
  loadPrivateDuas,
  savePrivateDuas,
  saveJournalEntry,
  type PrivateDua,
  type TahajjudJournal,
} from '../../features/tahajjud/TahajjudStore';
import { useTahajjudNight } from '../../features/tahajjud/useTahajjudNight';

type Tab = 'duas' | 'journal';

function formatNight(key: string) {
  return new Date(`${key}T12:00:00`).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
}

export default function TahajjudDuasScreen() {
  const { state } = useTahajjudNight();
  const nightKey = state?.validatableKey ?? state?.night.key ?? null;
  const [tab, setTab] = useState<Tab>('duas');
  const [duas, setDuas] = useState<PrivateDua[]>([]);
  const [journal, setJournal] = useState<TahajjudJournal>({});
  const [draft, setDraft] = useState('');
  const [intention, setIntention] = useState('');
  const [note, setNote] = useState('');

  const [journalLoaded, setJournalLoaded] = useState(false);
  useFocusEffect(useCallback(() => {
    void loadPrivateDuas().then(setDuas);
    void loadJournal().then((value) => {
      setJournal(value);
      setJournalLoaded(true);
    });
  }, []));

  // Journal fields follow the current night, once the journal is loaded.
  useEffect(() => {
    if (!nightKey || !journalLoaded) return;
    setIntention(journal[nightKey]?.intention ?? '');
    setNote(journal[nightKey]?.note ?? '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nightKey, journalLoaded]);

  const persist = async (next: PrivateDua[]) => {
    setDuas(next);
    await savePrivateDuas(next);
  };

  const add = () => {
    const text = draft.trim();
    if (!text || !nightKey) return;
    setDraft('');
    void persist([{ id: `${Date.now()}`, text, createdNight: nightKey, keep: false, doneNights: [] }, ...duas]);
  };

  const toggleDone = (dua: PrivateDua) => {
    if (!nightKey) return;
    const done = dua.doneNights.includes(nightKey);
    if (!done) void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
    void persist(duas.map((item) => item.id === dua.id
      ? { ...item, doneNights: done ? item.doneNights.filter((key) => key !== nightKey) : [...item.doneNights, nightKey] }
      : item));
  };

  const toggleKeep = (dua: PrivateDua) => void persist(duas.map((item) => item.id === dua.id ? { ...item, keep: !item.keep } : item));
  const remove = (dua: PrivateDua) => void persist(duas.filter((item) => item.id !== dua.id));

  const saveEntry = async (next: { intention: string; note: string }) => {
    if (!nightKey) return;
    setJournal(await saveJournalEntry(nightKey, next));
  };

  const tonight = nightKey ? duasForNight(duas, nightKey) : [];
  const doneCount = nightKey ? tonight.filter((dua) => dua.doneNights.includes(nightKey)).length : 0;
  const history = Object.entries(journal).filter(([key]) => key !== nightKey).sort(([a], [b]) => b.localeCompare(a));

  return (
    <TahajjudShell title="Mes duas" eyebrow="Privé · sur ce téléphone">
      <View style={styles.tabs}>
        {([['duas', 'Pour cette nuit'], ['journal', 'Journal']] as const).map(([id, label]) => (
          <Pressable key={id} onPress={() => setTab(id)} style={[styles.tab, tab === id && styles.tabOn]}>
            <Text style={[styles.tabText, tab === id && styles.tabTextOn]}>{label}</Text>
          </Pressable>
        ))}
      </View>

      {tab === 'duas' ? (
        <>
          <GlassCard gold>
            <Text style={styles.prompt}>Cette nuit, je demande à Allah…</Text>
            <View style={styles.addRow}>
              <TextInput
                value={draft}
                onChangeText={setDraft}
                onSubmitEditing={add}
                placeholder="La guérison de ma mère, un travail, le pardon…"
                placeholderTextColor={night.muted}
                returnKeyType="done"
                maxLength={300}
                multiline
                blurOnSubmit
                style={styles.input}
              />
              <Pressable onPress={add} disabled={!draft.trim()} style={[styles.addButton, !draft.trim() && styles.addDisabled]}>
                <Ionicons name="add" size={24} color={night.sky0} />
              </Pressable>
            </View>
          </GlassCard>

          {tonight.length > 0 ? (
            <Text style={[shellStyles.sectionLabel, styles.section]}>
              {doneCount}/{tonight.length} invoquée{doneCount > 1 ? 's' : ''} cette nuit
            </Text>
          ) : null}

          {tonight.map((dua) => {
            const done = nightKey ? dua.doneNights.includes(nightKey) : false;
            return (
              <Animated.View key={dua.id} entering={FadeIn} exiting={FadeOut} layout={LinearTransition}>
                <View style={[styles.dua, done && styles.duaDone]}>
                  <Pressable onPress={() => toggleDone(dua)} hitSlop={8} style={[styles.check, done && styles.checkOn]}>
                    {done ? <Ionicons name="checkmark" size={16} color={night.sky0} /> : null}
                  </Pressable>
                  <View style={styles.duaCopy}>
                    <Text style={[styles.duaText, done && styles.duaTextDone]}>{dua.text}</Text>
                    <View style={styles.duaActions}>
                      <Pressable onPress={() => toggleKeep(dua)} hitSlop={6} style={styles.duaAction}>
                        <Ionicons name={dua.keep ? 'repeat' : 'repeat-outline'} size={14} color={dua.keep ? night.goldSoft : night.muted} />
                        <Text style={[styles.duaActionText, dua.keep && styles.duaActionOn]}>
                          {dua.keep ? 'Gardée pour les prochaines nuits' : 'Garder pour les prochaines nuits'}
                        </Text>
                      </Pressable>
                      <Pressable onPress={() => remove(dua)} hitSlop={6}>
                        <Ionicons name="trash-outline" size={15} color={night.muted} />
                      </Pressable>
                    </View>
                  </View>
                </View>
              </Animated.View>
            );
          })}

          <Text style={[shellStyles.sectionLabel, styles.section]}>Invocations de la nuit</Text>
          {NIGHT_DUAS.map((dua) => (
            <GlassCard key={dua.source} style={styles.sourceCard}>
              {dua.arabic ? <Text style={styles.arabic}>{dua.arabic}</Text> : null}
              <Text style={styles.sourceText}>{dua.text}</Text>
              <Text style={styles.sourceRef}>{dua.source}</Text>
            </GlassCard>
          ))}
          <Pressable onPress={() => router.push('/dua' as Href)} style={styles.link}>
            <Ionicons name="library-outline" size={16} color={night.goldSoft} />
            <Text style={styles.linkText}>Toutes les douas d’OUMMAH</Text>
          </Pressable>
        </>
      ) : (
        <>
          <GlassCard gold>
            <Text style={styles.prompt}>Cette nuit, je souhaite invoquer Allah pour…</Text>
            <TextInput
              value={intention}
              onChangeText={setIntention}
              onBlur={() => void saveEntry({ intention, note })}
              placeholder="Mon intention pour cette nuit"
              placeholderTextColor={night.muted}
              multiline
              maxLength={1000}
              style={[styles.input, styles.journalInput]}
            />
            <Text style={[styles.prompt, styles.promptSpaced]}>Mes notes</Text>
            <TextInput
              value={note}
              onChangeText={setNote}
              onBlur={() => void saveEntry({ intention, note })}
              placeholder="Ce que j’ai ressenti, ce que je retiens…"
              placeholderTextColor={night.muted}
              multiline
              maxLength={2000}
              style={[styles.input, styles.journalInput]}
            />
            <Text style={styles.privacy}>
              <Ionicons name="lock-closed" size={11} color={night.muted} /> Jamais publié. Enregistré automatiquement sur ce téléphone.
            </Text>
          </GlassCard>

          {history.length ? <Text style={[shellStyles.sectionLabel, styles.section]}>Mes nuits précédentes</Text> : null}
          {history.map(([key, item]) => (
            <GlassCard key={key} style={styles.sourceCard}>
              <Text style={styles.historyDate}>{formatNight(key)}</Text>
              {item.intention ? <Text style={styles.sourceText}>{item.intention}</Text> : null}
              {item.note ? <Text style={styles.historyNote}>{item.note}</Text> : null}
            </GlassCard>
          ))}
        </>
      )}
    </TahajjudShell>
  );
}

const styles = StyleSheet.create({
  tabs: { flexDirection: 'row', padding: 4, borderRadius: 18, backgroundColor: night.glass, borderWidth: 1, borderColor: night.line, marginBottom: 16 },
  tab: { flex: 1, height: 38, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  tabOn: { backgroundColor: night.gold },
  tabText: { color: night.textSoft, fontSize: 14, ...nightType.semibold },
  tabTextOn: { color: night.sky0, ...nightType.bold },
  section: { marginTop: 24 },
  prompt: { color: night.text, fontSize: 21, ...nightType.display },
  promptSpaced: { marginTop: 18 },
  addRow: { marginTop: 12, flexDirection: 'row', alignItems: 'flex-end', gap: 10 },
  input: { flex: 1, minHeight: 48, maxHeight: 140, borderRadius: 16, paddingHorizontal: 14, paddingTop: 13, paddingBottom: 13, backgroundColor: 'rgba(0,0,0,0.25)', borderWidth: 1, borderColor: night.line, color: night.text, fontSize: 15, ...nightType.body },
  journalInput: { marginTop: 10, minHeight: 90, textAlignVertical: 'top' },
  addButton: { width: 48, height: 48, borderRadius: 24, backgroundColor: night.gold, alignItems: 'center', justifyContent: 'center' },
  addDisabled: { opacity: 0.4 },
  dua: { flexDirection: 'row', gap: 12, padding: 16, marginBottom: 10, borderRadius: 20, backgroundColor: night.glass, borderWidth: 1, borderColor: night.line },
  duaDone: { borderColor: night.goldLine, backgroundColor: 'rgba(227,181,90,0.07)' },
  check: { marginTop: 1, width: 26, height: 26, borderRadius: 13, borderWidth: 1.5, borderColor: night.gold, alignItems: 'center', justifyContent: 'center' },
  checkOn: { backgroundColor: night.gold },
  duaCopy: { flex: 1 },
  duaText: { color: night.text, fontSize: 15, lineHeight: 22, ...nightType.medium },
  duaTextDone: { color: night.goldSoft },
  duaActions: { marginTop: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  duaAction: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  duaActionText: { color: night.muted, fontSize: 12, ...nightType.medium },
  duaActionOn: { color: night.goldSoft },
  sourceCard: { marginBottom: 10 },
  arabic: { color: night.moon, fontSize: 21, lineHeight: 38, textAlign: 'right', writingDirection: 'rtl', ...nightType.arabic },
  sourceText: { marginTop: 8, color: night.textSoft, fontSize: 14, lineHeight: 21, ...nightType.body },
  sourceRef: { marginTop: 8, color: night.gold, fontSize: 12, ...nightType.semibold },
  link: { marginTop: 6, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, padding: 12 },
  linkText: { color: night.goldSoft, fontSize: 14, ...nightType.semibold },
  privacy: { marginTop: 12, color: night.muted, fontSize: 11.5, ...nightType.body },
  historyDate: { color: night.gold, fontSize: 12, letterSpacing: 1, textTransform: 'uppercase', ...nightType.bold },
  historyNote: { marginTop: 6, color: night.muted, fontSize: 13, lineHeight: 19, fontStyle: 'italic', ...nightType.body },
});
