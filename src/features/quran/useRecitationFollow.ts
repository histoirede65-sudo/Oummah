import { requireOptionalNativeModule } from 'expo';
import type { ExpoSpeechRecognitionModuleType, ExpoSpeechRecognitionOptions, ExpoSpeechRecognitionResultEvent, ExpoSpeechRecognitionErrorEvent } from 'expo-speech-recognition/build/ExpoSpeechRecognitionModule.types';
import { useCallback, useEffect, useRef, useState } from 'react';
import { RecitationAligner, type ReciteWord } from './RecitationAligner';

export type RecitePosition = { verseKey: string; position: number };
export type ReciteError = 'permission' | 'unavailable' | 'failed';

type Subscription = { remove: () => void };
type SpeechModule = ExpoSpeechRecognitionModuleType & {
  addListener: (event: string, listener: (payload: never) => void) => Subscription;
};

// Chargé seulement s'il est présent : une app compilée sans ce module natif ne doit pas planter
// à l'ouverture d'une sourate (le micro indique simplement que ce n'est pas disponible).
const speech = requireOptionalNativeModule<SpeechModule>('ExpoSpeechRecognition');

/**
 * Écoute la récitation de l'utilisateur (reconnaissance vocale du téléphone, arabe) et renvoie le dernier
 * mot du texte reconnu. Démarré et arrêté par l'utilisateur (icône micro) ; rien n'est enregistré.
 */
export function useRecitationFollow() {
  const [listening, setListening] = useState(false);
  const [current, setCurrent] = useState<RecitePosition | null>(null);
  const [error, setError] = useState<ReciteError | null>(null);
  const aligner = useRef<RecitationAligner | null>(null);
  const wanted = useRef(false);
  // Mots du résultat en cours déjà traités : les résultats provisoires répètent toute la phrase.
  const consumed = useRef(0);
  const options = useRef<ExpoSpeechRecognitionOptions | null>(null);

  const begin = useCallback(() => {
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

  const stop = useCallback(() => {
    wanted.current = false;
    setListening(false);
    try { speech?.stop(); } catch { /* déjà arrêté */ }
  }, []);

  const start = useCallback(async (words: readonly ReciteWord[], startIndex: number) => {
    setError(null);
    if (!speech || !speech.isRecognitionAvailable()) { setError('unavailable'); return false; }
    const permission = await speech.requestPermissionsAsync().catch(() => null);
    if (!permission?.granted) { setError('permission'); return false; }
    aligner.current = new RecitationAligner(words, startIndex);
    setCurrent(null);
    // Les mots du passage aident la reconnaissance (iOS) ; limités pour rester légers.
    const contextual = [...new Set(words.slice(startIndex, startIndex + 120).map((word) => word.norm).filter(Boolean))].slice(0, 100);
    options.current = { lang: 'ar-SA', interimResults: true, continuous: true, addsPunctuation: false, maxAlternatives: 1, contextualStrings: contextual };
    wanted.current = true;
    setListening(true);
    begin();
    return true;
  }, [begin]);

  useEffect(() => {
    if (!speech) return undefined;
    const subscriptions: Subscription[] = [
      speech.addListener('result', ((event: ExpoSpeechRecognitionResultEvent) => {
        const transcript = event.results[0]?.transcript ?? '';
        const heard = transcript.split(/\s+/).filter(Boolean);
        const fresh = heard.slice(consumed.current);
        consumed.current = event.isFinal ? 0 : heard.length;
        if (!fresh.length || !aligner.current) return;
        const word = aligner.current.feed(fresh);
        if (word) setCurrent((previous) => (previous?.verseKey === word.verseKey && previous.position === word.position ? previous : { verseKey: word.verseKey, position: word.position }));
        if (aligner.current.finished) stop();
      }) as (payload: never) => void),
      // Android (et iOS ancien) s'arrête après un silence : on relance tant que l'utilisateur n'a pas arrêté.
      speech.addListener('end', (() => {
        if (wanted.current) setTimeout(() => { if (wanted.current) begin(); }, 150);
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
      wanted.current = false;
      try { speech.abort(); } catch { /* rien à arrêter */ }
    };
  }, [begin, stop]);

  return { listening, current, error, start, stop };
}
