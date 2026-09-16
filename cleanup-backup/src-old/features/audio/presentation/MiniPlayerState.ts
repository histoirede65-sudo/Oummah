export type MiniPlayerMode = 'full' | 'mini' | 'hidden';

export interface MiniPlayerState {
  mode: MiniPlayerMode;
  hasTrack: boolean;
  isPlaying: boolean;
  isFullPlayer: boolean;
  dismissedByUser: boolean;
  canRestore: boolean;
}

export const INITIAL_MINI_PLAYER_STATE: Readonly<MiniPlayerState> = {
  mode: 'hidden',
  hasTrack: false,
  isPlaying: false,
  isFullPlayer: false,
  dismissedByUser: false,
  canRestore: false,
};
