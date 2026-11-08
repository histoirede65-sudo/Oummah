import { ExpoSpeechRecognitionModule, useSpeechRecognitionEvent } from 'expo-speech-recognition';
import { useCallback, useEffect, useRef, useState } from 'react';
import { RecitationAligner, type ReciteWord } from './RecitationAligner';

export type RecitePosition = { verseKey: string; position: number };
export type ReciteError = 'permission' | 'unavailable' | 'failed';

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
  const options = useRef<Parameters<typeof ExpoSpeechRecognitionModule.start>[0] | null>(null);

  const begin = useCallback(() => {
    if (!options.current) return;
    consumed.current = 0;
    try {
      ExpoSpeechRecognitionModule.start(options.current);
    } catch {
      wanted.current = false;
      setListening(false);
      setError('failed');
    }
  }, []);

  const stop = useCallback(() => {
    wanted.current = false;
    setListening(false);
    try { ExpoSpeechRecognitionModule.stop(); } catch { /* déjà arrêté */ }
  }, []);

  const start = useCallback(async (words: readonly ReciteWord[], startIndex: number) => {
    setError(null);
    if (!ExpoSpeechRecognitionModule.isRecognitionAvailable()) { setError('unavailable'); return false; }
    const permission = await ExpoSpeechRecognitionModule.requestPermissionsAsync().catch(() => null);
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

  useSpeechRecognitionEvent('result', (event) => {
    const transcript = event.results[0]?.transcript ?? '';
    const heard = transcript.split(/\s+/).filter(Boolean);
    const fresh = heard.slice(consumed.current);
    consumed.current = event.isFinal ? 0 : heard.length;
    if (!fresh.length || !aligner.current) return;
    const word = aligner.current.feed(fresh);
    if (word) setCurrent((previous) => (previous?.verseKey === word.verseKey && previous.position === word.position ? previous : { verseKey: word.verseKey, position: word.position }));
    if (aligner.current.finished) stop();
  });

  // Android (et iOS ancien) s'arrête après un silence : on relance tant que l'utilisateur n'a pas arrêté.
  useSpeechRecognitionEvent('end', () => {
    if (wanted.current) setTimeout(() => { if (wanted.current) begin(); }, 150);
  });

  useSpeechRecognitionEvent('error', (event) => {
    if (event.error === 'no-speech' || event.error === 'speech-timeout' || event.error === 'aborted') return;
    if (event.error === 'not-allowed') setError('permission');
    else setError('failed');
    wanted.current = false;
    setListening(false);
  });

  useEffect(() => () => {
    wanted.current = false;
    try { ExpoSpeechRecognitionModule.abort(); } catch { /* rien à arrêter */ }
  }, []);

  return { listening, current, error, start, stop };
}
