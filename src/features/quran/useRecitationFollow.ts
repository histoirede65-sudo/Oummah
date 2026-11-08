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
// Au-delà de ce retard (mots en attente), on rattrape directement.
const MAX_BACKLOG = 6;
// Surlignage gardé après l'arrêt (ms).
const LINGER_MS = 4000;

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
  // Surlignage affiché : pendant l'écoute, puis le temps d'allumer les derniers mots et quelques secondes après.
  const [following, setFollowing] = useState(false);
  const lingerTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
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
    // Trop de retard accumulé : on rattrape directement pour rester collé à la voix.
    if (revealQueue.current.length > MAX_BACKLOG) revealQueue.current = revealQueue.current.slice(-MAX_BACKLOG);
    const word = revealQueue.current.shift();
    if (!word) { revealTimer.current = null; return; }
    setCurrent(word);
    // Rythme adapté : les mots en attente s'allument en un morceau de temps, plus vite si l'on récite vite.
    const delay = Math.min(650, Math.max(120, (SEGMENT_MS * 0.9) / Math.max(1, revealQueue.current.length + 1)));
    revealTimer.current = setTimeout(revealNext, delay);
  }, []);

  /** Fin de session : les derniers mots s'allument, le surlignage reste visible un moment puis disparaît. */
  const finishFollowing = useCallback(() => {
    const waitQueue = () => {
      if (revealTimer.current || revealQueue.current.length) { setTimeout(waitQueue, 150); return; }
      if (lingerTimer.current) clearTimeout(lingerTimer.current);
      lingerTimer.current = setTimeout(() => { if (!wanted.current) setFollowing(false); }, LINGER_MS);
    };
    waitQueue();
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
  }, [revealNext]);

  const stop = useCallback(() => {
    if (!wanted.current) return;
    wanted.current = false;
    setListening(false);
    // Mode téléphone : le dernier résultat arrive après l'arrêt. Mode serveur : la boucle envoie le morceau en cours.
    try { speech?.stop(); } catch { /* déjà arrêté */ }
    if (speech && options.current) finishFollowing();
  }, [finishFollowing]);

  /** Arrêt immédiat (erreur) : rien n'est envoyé, le surlignage disparaît. */
  const abortAll = useCallback(() => {
    wanted.current = false;
    revealQueue.current = [];
    if (revealTimer.current) { clearTimeout(revealTimer.current); revealTimer.current = null; }
    setListening(false);
    setFollowing(false);
    try { speech?.abort(); } catch { /* déjà arrêté */ }
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
      abortAll();
      setError('failed');
    }
  }, [abortAll]);

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
        // Arrêt demandé : on coupe le morceau en cours et on l'envoie quand même (fin du verset).
        while (Date.now() - started < SEGMENT_MS && wanted.current) {
          await new Promise((resolve) => setTimeout(resolve, 100));
          const level = recorder.getStatus().metering;
          if (typeof level === 'number' && level > loudest) loudest = level;
        }
        await recorder.stop();
      } catch (reason) {
        if (__DEV__) console.info('[RECITE] enregistrement impossible', reason);
        abortAll();
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
          if ((missing || serverFailures.current >= 3) && wanted.current) { abortAll(); setError(missing ? 'server' : 'failed'); }
        }
      });
    }
    setListening(false);
    void setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true }).catch(() => undefined);
    // Les derniers morceaux envoyés s'allument avant de terminer.
    await serverChain.current.catch(() => undefined);
    finishFollowing();
  }, [abortAll, applyWords, finishFollowing, recorder]);

  const start = useCallback(async (words: readonly ReciteWord[], startIndex: number) => {
    setError(null);
    setCurrent(null);
    revealQueue.current = [];
    if (lingerTimer.current) clearTimeout(lingerTimer.current);
    setFollowing(true);
    aligner.current = new RecitationAligner(words, startIndex);
    const contextual = [...new Set(words.slice(startIndex, startIndex + 120).map((word) => word.text ?? word.norm).filter(Boolean))].slice(0, 100);

    if (speech && speech.isRecognitionAvailable()) {
      const permission = await speech.requestPermissionsAsync().catch(() => null);
      if (!permission?.granted) { setError('permission'); setFollowing(false); return false; }
      options.current = { lang: 'ar-SA', interimResults: true, continuous: true, addsPunctuation: false, maxAlternatives: 1, contextualStrings: contextual };
      wanted.current = true;
      setListening(true);
      beginNative();
      return true;
    }

    options.current = null;
    if (!(await getValidSession().catch(() => null))) { setError('login'); setFollowing(false); return false; }
    const permission = await requestRecordingPermissionsAsync().catch(() => null);
    if (!permission?.granted) { setError('permission'); setFollowing(false); return false; }
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
      }) as (payload: never) => void),
      // Android (et iOS ancien) s'arrête après un silence : on relance tant que l'utilisateur n'a pas arrêté.
      speech.addListener('end', (() => {
        if (wanted.current) setTimeout(() => { if (wanted.current) beginNative(); }, 150);
      }) as (payload: never) => void),
      speech.addListener('error', ((event: ExpoSpeechRecognitionErrorEvent) => {
        if (event.error === 'no-speech' || event.error === 'speech-timeout' || event.error === 'aborted') return;
        setError(event.error === 'not-allowed' ? 'permission' : 'failed');
        abortAll();
      }) as (payload: never) => void),
    ];
    return () => {
      subscriptions.forEach((subscription) => subscription.remove());
      try { speech.abort(); } catch { /* rien à arrêter */ }
    };
  }, [abortAll, applyWords, beginNative, stop]);

  useEffect(() => () => {
    wanted.current = false;
    void setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true }).catch(() => undefined);
  }, []);

  return { listening, following, current, error, start, stop };
}
