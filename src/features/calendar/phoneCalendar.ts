import { Platform } from 'react-native';
import { requestCalendarPermissions } from 'expo-calendar';
import { createEventInCalendarAsync } from 'expo-calendar/legacy';

/**
 * Opens the phone's own "new event" sheet, pre-filled with an all-day event (the user confirms).
 * iOS 17+ needs write-only access for that sheet; Android needs no permission.
 * Returns false when the sheet could not be opened.
 */
export async function addAllDayEventToPhoneCalendar({ title, notes, start, days }: {
  title: string;
  notes?: string;
  start: Date;
  days: number;
}): Promise<boolean> {
  try {
    if (Platform.OS === 'ios') {
      const permission = await requestCalendarPermissions(true);
      if (!permission.granted) return false;
    }
    const startDate = new Date(start);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + days - 1);
    endDate.setHours(23, 59, 0, 0);
    await createEventInCalendarAsync({ title, notes, startDate, endDate, allDay: true });
    return true;
  } catch {
    return false;
  }
}
