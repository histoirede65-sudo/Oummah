import type { AudioState } from './AudioState';
import type { AudioTrack, Playlist } from './types';

export interface AudioEventMap {
  stateChanged: AudioState;
  trackChanged: AudioTrack | null;
  queueChanged: Playlist | null;
  playbackEnded: AudioTrack;
  sessionRestored: AudioState;
  error: Error;
}

export type AudioEventName = keyof AudioEventMap;
export type AudioEventListener<K extends AudioEventName> = (payload: AudioEventMap[K]) => void;

export class AudioEvents {
  private listeners = new Map<AudioEventName, Set<(payload: never) => void>>();

  on<K extends AudioEventName>(event: K, listener: AudioEventListener<K>) {
    const listeners = this.listeners.get(event) ?? new Set();
    listeners.add(listener as (payload: never) => void);
    this.listeners.set(event, listeners);
    return () => { listeners.delete(listener as (payload: never) => void); };
  }

  emit<K extends AudioEventName>(event: K, payload: AudioEventMap[K]) {
    this.listeners.get(event)?.forEach((listener) => listener(payload as never));
  }

  clear() {
    this.listeners.clear();
  }
}
