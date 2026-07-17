import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { AudioTrack } from '../../../core/audio';

import { ExpoAudioPlayerAdapter } from './ExpoAudioPlayerAdapter';

const PLAYER_OPTIONS = { updateInterval: 150, keepAudioSessionActive: false };

export function useExpoAudioPlayerAdapter() {
  const [nativePlayer, setNativePlayer] = useState(() => createAudioPlayer(null, PLAYER_OPTIONS));
  const [recoveryTrack, setRecoveryTrack] = useState<AudioTrack | null>(null);

  const recreateNativePlayer = useCallback((track?: AudioTrack) => {
    if (track) setRecoveryTrack(track);
    setNativePlayer((player) => {
      try {
        player.remove();
      } catch {
        // The native shared object is already gone.
      }
      return createAudioPlayer(null, PLAYER_OPTIONS);
    });
  }, []);

  const adapter = useMemo(
    () => new ExpoAudioPlayerAdapter(nativePlayer, recreateNativePlayer),
    [nativePlayer, recreateNativePlayer],
  );

  useEffect(() => {
    void setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: true,
      interruptionMode: 'doNotMix',
    }).catch(() => undefined);
  }, []);

  useEffect(() => {
    adapter.sync(nativePlayer.currentStatus);
    const subscription = nativePlayer.addListener('playbackStatusUpdate', (status) => {
      adapter.sync(status);
    });
    return () => subscription.remove();
  }, [adapter, nativePlayer]);
  useEffect(() => {
    if (!recoveryTrack) return;
    adapter.load(recoveryTrack);
    setRecoveryTrack(null);
  }, [adapter, recoveryTrack]);
  useEffect(() => () => adapter.dispose(), [adapter]);
  return adapter;
}
