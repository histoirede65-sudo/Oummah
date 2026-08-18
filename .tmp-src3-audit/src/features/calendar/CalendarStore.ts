import { storageService } from "../../core/storage";
import {
  getEventDefinition,
  type CalendarCountry,
  type HijriMethod,
} from "./IslamicCalendar";

export type ReminderTiming = "three-days" | "eve" | "morning";

export type PersonalCalendarReminder = {
  id: string;
  dateKey: string;
  title: string;
};

export type CalendarSettings = {
  version: 2;
  method: HijriMethod;
  country: CalendarCountry;
  adjustment: -1 | 0 | 1;
  eventReminders: Record<string, ReminderTiming>;
  whiteDaysReminder: boolean;
  fridayReminder: boolean;
  mondayThursdayReminder: boolean;
  personalReminders: PersonalCalendarReminder[];
};

const KEY = "oummah.calendar.settings.v1";
type StoredCalendarSettings = Partial<Omit<CalendarSettings, "version">> & {
  version?: 1 | 2;
};

export const DEFAULT_CALENDAR_SETTINGS: CalendarSettings = {
  version: 2,
  method: "country",
  country: "france",
  adjustment: 0,
  eventReminders: {},
  whiteDaysReminder: false,
  fridayReminder: false,
  mondayThursdayReminder: false,
  personalReminders: [],
};

export async function loadCalendarSettings() {
  const saved = await storageService
    .get<StoredCalendarSettings>(KEY)
    .catch(() => null);
  if (!saved || (saved.version !== 1 && saved.version !== 2))
    return DEFAULT_CALENDAR_SETTINGS;
  const eventReminders = Object.fromEntries(
    Object.entries(saved.eventReminders ?? {}).filter(([id]) =>
      Boolean(getEventDefinition(id)),
    ),
  ) as Record<string, ReminderTiming>;
  return {
    version: 2,
    method: saved.method ?? "country",
    country: saved.country ?? "france",
    adjustment: saved.adjustment ?? 0,
    eventReminders,
    whiteDaysReminder: saved.whiteDaysReminder ?? false,
    fridayReminder: saved.fridayReminder ?? false,
    mondayThursdayReminder: saved.mondayThursdayReminder ?? false,
    personalReminders: saved.personalReminders ?? [],
  };
}

export function saveCalendarSettings(settings: CalendarSettings) {
  return storageService.set(KEY, settings);
}
