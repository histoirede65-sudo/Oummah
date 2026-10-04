import { loadCalendarSettings } from '../calendar/CalendarStore';
import { getHijriDate } from '../calendar/IslamicCalendar';
import { shiftDateKey } from './tahajjudNight';

/**
 * Ramadan and its last ten nights, from OUMMAH's Islamic calendar (the user's country / adjustment).
 * A night belongs to the Hijri day that starts at its Maghrib: night key D → Hijri date of D + 1.
 */

export type RamadanNight = {
  /** 1…30: the « n-ième nuit de Ramadan ». */
  night: number;
  lastTen: boolean;
  /** Odd night of the last ten: Laylat al-Qadr is sought in them. */
  odd: boolean;
  /** Night keys of nights 21…30 of this Ramadan (for the tracker). */
  lastTenKeys: { night: number; key: string }[];
};

function noonOf(dateKey: string) {
  const [year, month, day] = dateKey.split('-').map(Number);
  return new Date(year, month - 1, day, 12);
}

export async function getRamadanNight(nightKey: string): Promise<RamadanNight | null> {
  const settings = await loadCalendarSettings().catch(() => null);
  const hijri = getHijriDate(
    noonOf(shiftDateKey(nightKey, 1)),
    settings?.method,
    settings?.adjustment ?? 0,
    settings?.country,
  );
  if (hijri.month !== 9) return null;
  const night = hijri.day;
  return {
    night,
    lastTen: night >= 21,
    odd: night >= 21 && night % 2 === 1,
    lastTenKeys: Array.from({ length: 10 }, (_, index) => ({
      night: 21 + index,
      key: shiftDateKey(nightKey, 21 + index - night),
    })),
  };
}
