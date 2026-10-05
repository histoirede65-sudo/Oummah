import { loadCalendarSettings } from "../calendar/CalendarStore";
import { getHijriDate } from "../calendar/IslamicCalendar";

/** Where we are relative to the next Hajj, with the user's Hijri calendar settings. */
export type HajjSeason =
  | { kind: "countdown"; days: number; arafa: Date; hijriYear: number; ramadan: boolean }
  | { kind: "days"; dhulHijja: number; hijriYear: number };

export async function getHajjSeason(now = new Date()): Promise<HajjSeason | null> {
  const settings = await loadCalendarSettings().catch(() => null);
  const hijri = (date: Date) => getHijriDate(date, settings?.method, settings?.adjustment ?? 0, settings?.country);
  const today = hijri(now);

  if (today.month === 12 && today.day <= 13) {
    return { kind: "days", dhulHijja: today.day, hijriYear: today.year };
  }

  const date = new Date(now);
  date.setHours(12, 0, 0, 0);
  for (let days = 0; days <= 400; days += 1) {
    const value = hijri(date);
    if (value.month === 12 && value.day === 9) {
      return { kind: "countdown", days, arafa: new Date(date), hijriYear: value.year, ramadan: today.month === 9 };
    }
    // Jump ahead while far from Dhul-Hijja: fewer date conversions.
    const step = value.month < 11 ? 20 : 1;
    if (step > 1 && days + step <= 400) {
      date.setDate(date.getDate() + step);
      days += step - 1;
      continue;
    }
    date.setDate(date.getDate() + 1);
  }
  return null;
}
