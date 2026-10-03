/** Typing helpers for times ("13H30") and dates ("08/03/2027") in the mosque forms. */

/** "1330" → "13H30" while typing. */
export function formatTimeInput(value: string): string {
  if (/[Hh:]/.test(value)) {
    const [rawHours, rawMinutes = ''] = value.split(/[Hh:]/, 2);
    const hours = rawHours.replace(/\D/g, '').slice(0, 2);
    const minutes = rawMinutes.replace(/\D/g, '').slice(0, 2);
    return `${hours}H${minutes}`;
  }
  const digits = value.replace(/\D/g, '').slice(0, 4);
  if (digits.length <= 3) return digits;
  return `${digits.slice(0, 2)}H${digits.slice(2)}`;
}

/** "13H30" / "1330" / "930" → "13:30", "" → "", invalid → null. */
export function parseTime(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return '';
  let normalized = trimmed;
  if (/^\d{3,4}$/.test(normalized)) normalized = normalized.padStart(4, '0').replace(/^(\d{2})(\d{2})$/, '$1H$2');
  const match = /^(\d{1,2})[Hh:](\d{2})$/.exec(normalized);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return null;
  return `${String(hours).padStart(2, '0')}:${match[2]}`;
}

/** "08032027" → "08/03/2027" while typing. */
export function formatDateInput(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

/** "08/03/2027" → "2027-03-08", invalid → null. */
export function parseDate(value: string): string | null {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value.trim());
  if (!match) return null;
  const [, day, month, year] = match;
  const date = new Date(Number(year), Number(month) - 1, Number(day));
  if (date.getFullYear() !== Number(year) || date.getMonth() !== Number(month) - 1 || date.getDate() !== Number(day)) return null;
  return `${year}-${month}-${day}`;
}

/** "2027-03-08" → "08/03/2027". */
export function isoToDateInput(value?: string) {
  const match = value ? /^(\d{4})-(\d{2})-(\d{2})$/.exec(value) : null;
  return match ? `${match[3]}/${match[2]}/${match[1]}` : '';
}

/** Local date ("2027-03-08") + time ("19:30") → Date in the phone's time zone. */
export function localDateTime(date: string, time: string) {
  const [year, month, day] = date.split('-').map(Number);
  const [hours, minutes] = time.split(':').map(Number);
  return new Date(year, month - 1, day, hours, minutes);
}
