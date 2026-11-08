import { requireOptionalNativeModule } from 'expo';
import { RecordingPresets, requestRecordingPermissionsAsync, setAudioModeAsync, useAudioRecorder } from 'expo-audio';
import type { ExpoSpeechRecognitionErrorEvent, ExpoSpeechRecognitionModuleType, ExpoSpeechRecognitionOptions, ExpoSpeechRecognitionResultEvent } from 'expo-speech-recognition/build/ExpoSpeechRecognitionModule.types';
import { useCallback, useEffect, useRef, useState } from 'react';
import * as FileSystem from 'expo-file-system/legacy';
import { getValidSession } from '../auth/SupabaseAuthService';
import { RecitationAligner, type ReciteWord } from './RecitationAligner';

export type RecitePosition = { verseKey: string; position: number };
export type ReciteError = 'permission' | 'unavailable' | 'failed' | 'login' | 'server';

type Subscription = { remove: () => void };
type SpeechModule = ExpoSpeechRecognitionModuleType & {
  addListener: (event: string, listener: (payload: never) => void) => Subscription;
};

// Reconnaissance du téléphone, chargée seulement si l'app a été compilée avec : sinon on passe par le
// serveur (enregistrement par morceaux), sans plantage.
const speech = requireOptionalNativeModule<SpeechModule>('ExpoSpeechRecognition');

const SEGMENT_MS = 2500;
// En dessous (dB), le morceau est considéré comme silencieux.
const SILENCE_DB = -42;

async function transcribeOnServer(uri: string, hint: string): Promise<string> {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim().replace(/\/$/, '');
  const key = (process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY)?.trim();
  const session = await getValidSession().catch(() => null);
  if (!url || !key || !session) return '';
  // Envoi en JSON (audio en base64) : l'envoi de fichier « multipart » échoue sur iPhone dans cette app.
  const audio = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
  void FileSystem.deleteAsync(uri, { idempotent: true }).catch(() => undefined);
  const response = await fetch(`${url}/functions/v1/quran-recite-transcribe`, {
    method: 'POST',
    headers: { apikey: key, Authorization: `Bearer ${session.accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ audio, hint, name: 'recitation.m4a' }),
  });
  if (!response.ok) {
    if (__DEV__) console.info('[RECITE] serveur', response.status, await response.text().catch(() => ''));
    throw new Error(`TRANSCRIBE_${response.status}`);
  }
  const body = (await response.json().catch(() => null)) as { text?: string } | null;
  return body?.text ?? '';
}

/**
 * Écoute la récitation de l'utilisateur et renvoie le dernier mot du texte reconnu.
 * Démarré et arrêté par l'utilisateur (icône micro) ; l'audio n'est pas conservé.
 */
export function useRecitationFollow() {
  const [listening, setListening] = useState(false);
  const [current, setCurrent] = useState<RecitePosition | null>(null);
  const [error, setError] = useState<ReciteError | null>(null);
  const aligner = useRef<RecitationAligner | null>(null);
  const wanted = useRef(false);
  const consumed = useRef(0);
  const options = useRef<ExpoSpeechRecognitionOptions | null>(null);
  const recorder = useAudioRecorder({ ...RecordingPresets.HIGH_QUALITY, isMeteringEnabled: true });
  const serverChain = useRef<Promise<void>>(Promise.resolve());
  const serverFailures = useRef(0);

  // Mots reconnus en attente d'être allumés : un paquet du serveur s'allume mot par mot, pas d'un bloc.
  const revealQueue = useRef<RecitePosition[]>([]);
  const revealTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const revealNext = useCallback(() => {
    const word = revealQueue.current.shift();
    if (!word) { revealTimer.current = null; return; }
    setCurrent(word);
    // Rythme proche d'une récitation : réparti sur la durée d'un morceau, entre 450 et 900 ms par mot.
    const delay = Math.min(900, Math.max(450, SEGMENT_MS / Math.max(1, revealQueue.current.length + 1)));
    revealTimer.current = setTimeout(revealNext, delay);
  }, []);

  const applyWords = useCallback((heard: readonly string[], paced = false) => {
    if (!heard.length || !aligner.current) return;
    const words = aligner.current.feedAll(heard, paced).map((word) => ({ verseKey: word.verseKey, position: word.position }));
    if (!words.length) return;
    if (!paced) {
      const last = words[words.length - 1];
      setCurrent((previous) => (previous?.verseKey === last.verseKey && previous.position === last.position ? previous : last));
    } else {
      revealQueue.current.push(...words);
      if (!revealTimer.current) revealNext();
    }
    if (aligner.current.finished) wanted.current = false;
  }, [revealNext]);

  const stop = useCallback(() => {
    wanted.current = false;
    revealQueue.current = [];
    if (revealTimer.current) { clearTimeout(revealTimer.current); revealTimer.current = null; }
    setListening(false);
    try { speech?.stop(); } catch { /* déjà arrêté */ }
    void recorder.stop().catch(() => undefined);
    void setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true }).catch(() => undefined);
  }, [recorder]);

  // ----- Mode téléphone -----
  const beginNative = useCallback(() => {
    if (!speech || !options.current) return;
    consumed.current = 0;
    try {
      speech.start(options.current);
    } catch {
      wanted.current = false;
      setListening(false);
      setError('failed');
    }
  }, []);

  // ----- Mode serveur : morceaux de 2,5 s, envoyés pendant que le suivant s'enregistre, traités dans l'ordre. -----
  const serverLoop = useCallback(async () => {
    let loudest = -160;
    while (wanted.current) {
      try {
        await recorder.prepareToRecordAsync();
        recorder.record();
        // Volume mesuré pendant le morceau : un morceau silencieux n'est pas envoyé.
        loudest = -160;
        const started = Date.now();
        while (Date.now() - started < SEGMENT_MS) {
          await new Promise((resolve) => setTimeout(resolve, 100));
          const level = recorder.getStatus().metering;
          if (typeof level === 'number' && level > loudest) loudest = level;
        }
        await recorder.stop();
      } catch (reason) {
        if (__DEV__) console.info('[RECITE] enregistrement impossible', reason);
        stop();
        setError('failed');
        return;
      }
      const uri = recorder.uri;
      if (__DEV__) console.info('[RECITE] morceau enregistré, volume max', Math.round(loudest), 'dB');
      if (!uri) continue;
      if (loudest < SILENCE_DB) {
        void FileSystem.deleteAsync(uri, { idempotent: true }).catch(() => undefined);
        continue;
      }
      // Aucun indice envoyé : le modèle recopiait le texte attendu quand il n'entendait pas d'arabe.
      const pending = transcribeOnServer(uri, '');
      serverChain.current = serverChain.current.then(async () => {
        try {
          const text = await pending;
          if (__DEV__) console.info('[RECITE] entendu :', text || '(rien)');
          serverFailures.current = 0;
          if (wanted.current || text) applyWords(text.split(/\s+/).filter(Boolean), true);
        } catch (reason) {
          if (__DEV__) console.info('[RECITE] envoi impossible', reason instanceof Error ? reason.message : reason);
          serverFailures.current += 1;
          // Service absent (non déployé) : inutile d'insister, on le dit tout de suite.
          const missing = reason instanceof Error && reason.message === 'TRANSCRIBE_404';
          if ((missing || serverFailures.current >= 3) && wanted.current) { stop(); setError(missing ? 'server' : 'failed'); }
        }
      });
    }
    if (!wanted.current) setListening(false);
  }, [applyWords, recorder, stop]);

  const start = useCallback(async (words: readonly ReciteWord[], startIndex: number) => {
    setError(null);
    setCurrent(null);
    revealQueue.current = [];
    aligner.current = new RecitationAligner(words, startIndex);
    const contextual = [...new Set(words.slice(startIndex, startIndex + 120).map((word) => word.text ?? word.norm).filter(Boolean))].slice(0, 100);

    if (speech && speech.isRecognitionAvailable()) {
      const permission = await speech.requestPermissionsAsync().catch(() => null);
      if (!permission?.granted) { setError('permission'); return false; }
      options.current = { lang: 'ar-SA', interimResults: true, continuous: true, addsPunctuation: false, maxAlternatives: 1, contextualStrings: contextual };
      wanted.current = true;
      setListening(true);
      beginNative();
      return true;
    }

    if (!(await getValidSession().catch(() => null))) { setError('login'); return false; }
    const permission = await requestRecordingPermissionsAsync().catch(() => null);
    if (!permission?.granted) { setError('permission'); return false; }
    await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true }).catch(() => undefined);
    serverFailures.current = 0;
    wanted.current = true;
    setListening(true);
    void serverLoop();
    return true;
  }, [beginNative, serverLoop]);

  useEffect(() => {
    if (!speech) return undefined;
    const subscriptions: Subscription[] = [
      speech.addListener('result', ((event: ExpoSpeechRecognitionResultEvent) => {
        const heard = (event.results[0]?.transcript ?? '').split(/\s+/).filter(Boolean);
        const fresh = heard.slice(consumed.current);
        consumed.current = event.isFinal ? 0 : heard.length;
        applyWords(fresh);
        if (aligner.current?.finished) stop();
      }) as (payload: never) => void),
      // Android (et iOS ancien) s'arrête après un silence : on relance tant que l'utilisateur n'a pas arrêté.
      speech.addListener('end', (() => {
        if (wanted.current) setTimeout(() => { if (wanted.current) beginNative(); }, 150);
      }) as (payload: never) => void),
      speech.addListener('error', ((event: ExpoSpeechRecognitionErrorEvent) => {
        if (event.error === 'no-speech' || event.error === 'speech-timeout' || event.error === 'aborted') return;
        setError(event.error === 'not-allowed' ? 'permission' : 'failed');
        wanted.current = false;
        setListening(false);
      }) as (payload: never) => void),
    ];
    return () => {
      subscriptions.forEach((subscription) => subscription.remove());
      try { speech.abort(); } catch { /* rien à arrêter */ }
    };
  }, [applyWords, beginNative, stop]);

  useEffect(() => () => {
    wanted.current = false;
    void setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true }).catch(() => undefined);
  }, []);

  return { listening, current, error, start, stop };
}
