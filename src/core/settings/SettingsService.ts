import { storageService, type StorageServiceContract } from '../storage';
import { DEFAULT_APP_SETTINGS, type AppSettings } from './AppSettings';

const SETTINGS_KEY = 'oummah:settings:v1';

/** Single application gateway for persisted user preferences. */
export class SettingsService {
  private cachedSettings: AppSettings | null = null;

  constructor(private readonly storage: StorageServiceContract = storageService) {}

  async get(): Promise<AppSettings> {
    if (this.cachedSettings) return this.cachedSettings;
    try {
      const stored = await this.storage.get<Partial<AppSettings>>(SETTINGS_KEY);
      this.cachedSettings = { ...DEFAULT_APP_SETTINGS, ...stored };
    } catch {
      this.cachedSettings = { ...DEFAULT_APP_SETTINGS };
    }
    return this.cachedSettings;
  }

  async update(patch: Partial<AppSettings>): Promise<AppSettings> {
    const settings = { ...await this.get(), ...patch };
    this.cachedSettings = settings;
    await this.storage.set(SETTINGS_KEY, settings);
    return settings;
  }

  async setHapticsEnabled(enabled: boolean) {
    await this.update({ hapticsEnabled: enabled });
  }

  async areHapticsEnabled() {
    return (await this.get()).hapticsEnabled;
  }
}

export const settingsService = new SettingsService();
