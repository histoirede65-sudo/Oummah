import { INITIAL_MINI_PLAYER_STATE, type MiniPlayerState } from './MiniPlayerState';

export type MiniPlayerStateListener = (state: MiniPlayerState) => void;

/** Pure visibility state machine. It has no player, React or Router dependency. */
export class MiniPlayerController {
  private state: MiniPlayerState = { ...INITIAL_MINI_PLAYER_STATE };
  private readonly listeners = new Set<MiniPlayerStateListener>();

  getState() { return this.state; }

  syncPlayback(hasTrack: boolean, isPlaying: boolean) {
    this.publish(this.derive({ ...this.state, hasTrack, isPlaying, dismissedByUser: hasTrack ? this.state.dismissedByUser : false }));
  }

  setFullPlayer(isFullPlayer: boolean) {
    this.publish(this.derive({ ...this.state, isFullPlayer }));
  }

  hide() {
    this.publish(this.derive({ ...this.state, dismissedByUser: true }));
  }

  show() {
    this.publish(this.derive({ ...this.state, dismissedByUser: false }));
  }

  subscribe(listener: MiniPlayerStateListener) {
    this.listeners.add(listener);
    return () => { this.listeners.delete(listener); };
  }

  private derive(state: MiniPlayerState): MiniPlayerState {
    const mode = state.isFullPlayer && state.hasTrack
      ? 'full'
      : state.hasTrack && !state.dismissedByUser
        ? 'mini'
        : 'hidden';
    return {
      ...state,
      mode,
      canRestore: mode === 'hidden' && state.hasTrack && state.isPlaying && state.dismissedByUser && !state.isFullPlayer,
    };
  }

  private publish(next: MiniPlayerState) {
    if (
      next.mode === this.state.mode
      && next.hasTrack === this.state.hasTrack
      && next.isPlaying === this.state.isPlaying
      && next.isFullPlayer === this.state.isFullPlayer
      && next.dismissedByUser === this.state.dismissedByUser
      && next.canRestore === this.state.canRestore
    ) return;
    this.state = next;
    this.listeners.forEach((listener) => listener(next));
  }
}
