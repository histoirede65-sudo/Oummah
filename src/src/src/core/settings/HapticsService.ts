import * as Haptics from 'expo-haptics';

import { settingsService, type SettingsService } from './SettingsService';

export type HapticLevel = 'light' | 'medium' | 'success';

/** The only application gateway to Expo Haptics. */
export class HapticsService {
  constructor(private readonly settings: SettingsService = settingsService) {}

  async trigger(level: HapticLevel): Promise<void> {
    try {
      if (!await this.settings.areHapticsEnabled()) return;
      if (level === 'success') {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        return;
      }
      await Haptics.impactAsync(
        level === 'medium'
          ? Haptics.ImpactFeedbackStyle.Medium
          : Haptics.ImpactFeedbackStyle.Light,
      );
    } catch {
      // Haptics are an optional enhancement and must never block an action.
    }
  }

  play() { return this.trigger('light'); }
  pause() { return this.trigger('light'); }
  favorite() { return this.trigger('success'); }
  download() { return this.trigger('success'); }
  changeReciter() { return this.trigger('medium'); }
  changeSpeed() { return this.trigger('light'); }
  addToPlaylist() { return this.trigger('success'); }
  changeRepeat() { return this.trigger('medium'); }
  bookmark() { return this.trigger('success'); }
}

export const hapticsService = new HapticsService();
