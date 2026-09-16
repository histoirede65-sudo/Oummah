export type AppLanguage = 'fr' | 'en' | 'ar' | 'tr' | 'es';
export type AppTheme = 'system' | 'light' | 'dark';

export interface AppSettings {
  language: AppLanguage;
  theme: AppTheme;
  notificationsEnabled: boolean;
  hapticsEnabled: boolean;
  autoDownloadWifiOnly: boolean;
}

export const DEFAULT_APP_SETTINGS: Readonly<AppSettings> = {
  language: 'fr',
  theme: 'system',
  notificationsEnabled: false,
  hapticsEnabled: true,
  autoDownloadWifiOnly: true,
};
