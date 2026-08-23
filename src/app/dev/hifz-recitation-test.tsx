import { createAudioPlayer, RecordingPresets, requestRecordingPermissionsAsync, setAudioModeAsync, useAudioRecorder } from "expo-audio";
import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AL_FATIHA_VERSES } from "../../features/hifz-recitation/HifzRecitationTestData";
import { getValidSession } from "../../features/auth/SupabaseAuthService";
import { colors } from "../../theme/colors";
import { typography } from "../../theme/typography";

const SEGMENT_SECONDS = 1.5;
type Recognition = { transcript: string; processingLatencyMs: number; words: unknown[] };
type AudioSegment = { id: number; uri: string; durationMs: number; producedInMs: number; transitionGapMs: number | null; recognition?: Recognition };

export default function HifzRecitationTestScreen() {
  const recorder = useAudioRecorder(RecordingPresets.LOW_QUALITY);
  const [recording, setRecording] = useState(false);
  const [permissionMessage, setPermissionMessage] = useState<string>();
  const [segments, setSegments] = useState<AudioSegment[]>([]);
  const mounted = useRef(true);
  const sessionActive = useRef(false);
  const captureInProgress = useRef(false);
  const nextSegmentId = useRef(1);
  const previousSegmentEndedAt = useRef<number | null>(null);
  const playersRef = useRef(new Map<number, ReturnType<typeof createAudioPlayer>>());

  const stopSession = async () => {
    console.log("[HIFZ-REC-DIAG] arrêt de la session demandé");
    sessionActive.current = false;
    try { if (captureInProgress.current) await recorder.stop(); } catch (error) { console.log("[HIFZ-REC-DIAG] arrêt du segment courant", error); }
    captureInProgress.current = false;
    if (mounted.current) setRecording(false);
  };

  const captureSegment = async () => {
    if (!sessionActive.current || !mounted.current) return;
    captureInProgress.current = true;
    const startedAt = Date.now();
    const transitionGapMs = previousSegmentEndedAt.current === null ? null : startedAt - previousSegmentEndedAt.current;
    try {
      await recorder.prepareToRecordAsync(RecordingPresets.LOW_QUALITY);
      console.log("[HIFZ-REC-DIAG] nouveau recorder natif préparé", { segment: nextSegmentId.current });
      recorder.record();
      await new Promise((resolve) => setTimeout(resolve, SEGMENT_SECONDS * 1000));
      if (!sessionActive.current || !mounted.current) return;
      const durationMs = recorder.currentTime;
      console.log("[HIFZ-REC-DIAG] durée capturée avant stop", { durationMs });
      await recorder.stop();
      const endedAt = Date.now();
      const uri = recorder.uri ?? recorder.getStatus().url;
      console.log("[HIFZ-REC-DIAG] segment arrêté et URI finale", { uri, durationMs });
      if (!uri) throw new Error("Aucune URI n’a été retournée pour le segment audio.");
      const segment: AudioSegment = { id: nextSegmentId.current++, uri, durationMs, producedInMs: endedAt - startedAt, transitionGapMs };
      previousSegmentEndedAt.current = endedAt;
      if (mounted.current) setSegments((current) => [...current, segment]);
      console.log("[HIFZ-REC-DIAG] segment ajouté", segment);
    } finally { captureInProgress.current = false; }
  };

  const startSession = async () => {
    if (recording) return;
    setPermissionMessage(undefined);
    const permission = await requestRecordingPermissionsAsync();
    if (!permission.granted) { setPermissionMessage("L’autorisation du microphone est nécessaire pour ce test."); return; }
    try {
      console.log("[HIFZ-REC-DIAG] permission obtenue");
      await setAudioModeAsync({ playsInSilentMode: true, allowsRecording: true, shouldPlayInBackground: false });
      sessionActive.current = true;
      previousSegmentEndedAt.current = null;
      nextSegmentId.current = 1;
      setSegments([]);
      setRecording(true);
      while (sessionActive.current && mounted.current) await captureSegment();
    } catch (error) {
      console.log("[HIFZ-REC-DIAG] session erreur", error);
      if (mounted.current) setPermissionMessage(error instanceof Error ? error.message : "Impossible d’enregistrer.");
    } finally { sessionActive.current = false; if (mounted.current) setRecording(false); }
  };

  const playSegment = async (segment: AudioSegment) => {
    try {
      await setAudioModeAsync({ playsInSilentMode: true, allowsRecording: false });
      let player = playersRef.current.get(segment.id);
      if (!player) { player = createAudioPlayer(segment.uri, { updateInterval: 100 }); playersRef.current.set(segment.id, player); console.log("[HIFZ-REC-DIAG] player créé", { segment: segment.id, uri: segment.uri }); }
      const startedAt = Date.now();
      while (!player.isLoaded && Date.now() - startedAt < 5000) await new Promise((resolve) => setTimeout(resolve, 100));
      await player.seekTo(0);
      player.play();
      console.log("[HIFZ-REC-DIAG] segment lu", { segment: segment.id, currentTime: player.currentTime });
    } catch (error) {
      console.log("[HIFZ-REC-DIAG] erreur de lecture", error);
      if (mounted.current) setPermissionMessage(error instanceof Error ? error.message : "Impossible de lire le segment.");
    }
  };

  const analyzeSegment = async (segment: AudioSegment) => {
    try {
      setPermissionMessage(undefined);
      const session = await getValidSession();
      if (!session?.accessToken) throw new Error("Connectez-vous pour analyser un segment.");
      const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim().replace(/\/$/, "");
      const anonKey = (process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY)?.trim();
      if (!supabaseUrl || !anonKey) throw new Error("Configuration Supabase publique manquante.");
      const file = await (await fetch(segment.uri)).blob();
      const form = new FormData();
      form.append("audio", file, `hifz-segment-${segment.id}.m4a`);
      const response = await fetch(`${supabaseUrl}/functions/v1/hifz-recitation-analyze`, { method: "POST", headers: { apikey: anonKey, Authorization: `Bearer ${session.accessToken}` }, body: form });
      const body = await response.json();
      if (!response.ok) throw new Error(body.details ?? body.error ?? "Analyse impossible.");
      const recognition: Recognition = { transcript: body.transcript ?? "", processingLatencyMs: body.processingLatencyMs ?? 0, words: body.words ?? [] };
      if (mounted.current) setSegments((current) => current.map((item) => item.id === segment.id ? { ...item, recognition } : item));
    } catch (error) {
      console.log("[HIFZ-REC-DIAG] analyse erreur", error);
      if (mounted.current) setPermissionMessage(error instanceof Error ? error.message : "Analyse impossible.");
    }
  };

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; sessionActive.current = false; void recorder.stop().catch(() => undefined); playersRef.current.forEach((player) => player.remove()); playersRef.current.clear(); void setAudioModeAsync({ allowsRecording: false }).catch(() => undefined); };
  }, [recorder]);

  return <SafeAreaView style={styles.screen} edges={["top"]}><ScrollView contentContainerStyle={styles.content}>
    <Pressable onPress={() => router.back()} style={styles.back}><Text style={styles.backText}>‹ Retour</Text></Pressable>
    <Text style={styles.eyebrow}>DÉVELOPPEMENT</Text><Text style={styles.title}>Test de récitation</Text><Text style={styles.subtitle}>POC indépendant · capture audio uniquement</Text>
    <View style={styles.card}><Text style={styles.cardLabel}>AL-FATIHA · MOTS ATTENDUS</Text><View style={styles.words}>{AL_FATIHA_VERSES.map((verse, verseIndex) => <Text key={`verse-${verseIndex}`} style={styles.verseLine}>{verse.map((word, wordIndex) => <Text key={`${verseIndex}-${wordIndex}-${word}`} style={styles.word}>{word}{wordIndex < verse.length - 1 ? " " : ""}</Text>)}</Text>)}</View></View>
    <Pressable onPress={() => void (recording ? stopSession() : startSession())} style={[styles.recordButton, recording && styles.recordButtonActive]}>{recording ? <ActivityIndicator color={colors.background} /> : null}<Text style={styles.recordButtonText}>{recording ? "Arrêter la session" : "Démarrer la récitation"}</Text></Pressable>
    {permissionMessage ? <Text style={styles.error}>{permissionMessage}</Text> : null}
    <View style={styles.card}><Text style={styles.cardLabel}>SEGMENTS AUDIO · 1,5 S</Text>{segments.length === 0 ? <Text style={styles.empty}>Aucun segment produit pour le moment.</Text> : segments.map((segment) => <View key={segment.id} style={styles.segment}><Text style={styles.segmentTitle}>Segment {segment.id}</Text><Text style={styles.segmentMeta}>Durée réelle : {(segment.durationMs / 1000).toFixed(2)} s</Text><Text style={styles.segmentMeta}>Production : {segment.producedInMs} ms</Text><Text style={styles.segmentMeta}>Transition : {segment.transitionGapMs === null ? "—" : `${segment.transitionGapMs} ms`}</Text><Text selectable style={styles.uri}>{segment.uri}</Text><Pressable onPress={() => void playSegment(segment)} style={styles.listenButton}><Text style={styles.listenButtonText}>Écouter</Text></Pressable><Pressable onPress={() => void analyzeSegment(segment)} style={styles.analyzeButton}><Text style={styles.listenButtonText}>Analyser avec Chirp 3</Text></Pressable>{segment.recognition ? <View style={styles.recognition}><Text style={styles.segmentTitle}>Texte reconnu</Text><Text style={styles.arabicResult}>{segment.recognition.transcript || "(aucun texte reconnu)"}</Text><Text style={styles.segmentMeta}>Latence : {segment.recognition.processingLatencyMs} ms</Text>{segment.recognition.words.length > 0 ? <Text style={styles.segmentMeta}>Timestamps : {segment.recognition.words.length} mots retournés</Text> : null}</View> : null}</View>)}</View>
  </ScrollView></SafeAreaView>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background }, content: { padding: 20, paddingBottom: 48 }, back: { alignSelf: "flex-start", paddingVertical: 8, marginBottom: 22 }, backText: { color: colors.goldLight, fontFamily: typography.sans, fontSize: 14, fontWeight: "700" }, eyebrow: { color: colors.goldLight, fontFamily: typography.sans, fontSize: 10, fontWeight: "800", letterSpacing: 1.6 }, title: { color: colors.text, fontFamily: typography.serifSemibold, fontSize: 38, marginTop: 4 }, subtitle: { color: colors.textSecondary, fontFamily: typography.sans, fontSize: 13, marginTop: 3 }, card: { marginTop: 22, padding: 17, borderRadius: 22, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderSoft }, cardLabel: { color: colors.goldLight, fontFamily: typography.sans, fontSize: 10, fontWeight: "800", letterSpacing: 1.2 }, words: { marginTop: 14 }, verseLine: { color: colors.text, fontFamily: typography.arabic, fontSize: 24, lineHeight: 42, textAlign: "right", writingDirection: "rtl" }, word: { color: colors.text, fontFamily: typography.arabic, fontSize: 24 }, recordButton: { minHeight: 54, marginTop: 18, paddingHorizontal: 18, borderRadius: 17, backgroundColor: colors.goldLight, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 9 }, recordButtonActive: { backgroundColor: colors.textSecondary }, recordButtonText: { color: colors.purpleDeep, fontFamily: typography.sans, fontSize: 13, fontWeight: "800", textAlign: "center" }, error: { color: colors.danger, fontFamily: typography.sans, fontSize: 12, lineHeight: 18, marginTop: 10 }, empty: { color: colors.textMuted, fontFamily: typography.sans, fontSize: 13, marginTop: 14 }, segment: { marginTop: 13, paddingTop: 13, borderTopWidth: 1, borderTopColor: colors.borderSoft }, segmentTitle: { color: colors.text, fontFamily: typography.sans, fontSize: 14, fontWeight: "800" }, segmentMeta: { color: colors.textSecondary, fontFamily: typography.sans, fontSize: 12, marginTop: 3 }, uri: { color: colors.goldLight, fontFamily: typography.sans, fontSize: 10, lineHeight: 15, marginTop: 5 }, listenButton: { minHeight: 42, marginTop: 12, borderRadius: 13, backgroundColor: colors.goldLight, alignItems: "center", justifyContent: "center" }, analyzeButton: { minHeight: 42, marginTop: 8, borderRadius: 13, backgroundColor: colors.purpleDeep, borderWidth: 1, borderColor: colors.goldLight, alignItems: "center", justifyContent: "center" }, recognition: { marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.borderSoft }, arabicResult: { color: colors.text, fontFamily: typography.arabic, fontSize: 22, lineHeight: 34, textAlign: "right", writingDirection: "rtl", marginTop: 8 }, listenButtonText: { color: colors.purpleDeep, fontFamily: typography.sans, fontSize: 12, fontWeight: "800" },
});
