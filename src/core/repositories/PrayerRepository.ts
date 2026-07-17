export interface PrayerTime {
  id: 'fajr' | 'sunrise' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';
  at: string;
}

export interface PrayerDay {
  date: string;
  location: string;
  timezone: string;
  prayers: readonly PrayerTime[];
}

export interface PrayerRepository {
  getDay(date: string, location: string): Promise<PrayerDay>;
}
