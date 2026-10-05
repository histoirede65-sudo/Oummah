import type { LanguageCode } from "../../i18n";
import type { Source } from "./pilgrimageTypes";

/**
 * The five mîqât and the geometry used by the in-flight alert. Coordinates are approximate (a few
 * kilometres): the alert therefore keeps a safety margin and arrives early.
 */

export type Miqat = {
  id: string;
  name: string;
  arabic: string;
  place: Record<LanguageCode, string>;
  /** Who usually passes it. */
  people: Record<LanguageCode, string>;
  latitude: number;
  longitude: number;
  sources: Source[];
};

const H = (reference: string): Source => ({ kind: "AUTHENTIC_HADITH", reference });

export const KAABA = { latitude: 21.4225, longitude: 39.8262 };

export const MIQATS: Miqat[] = [
  { id: "dhul-hulayfa", name: "Dhul-Hulayfa", arabic: "ذو الحليفة", place: { fr: "Abyâr ‘Alî, près de Médine", en: "Abyar ‘Ali, near Medina" }, people: { fr: "Médine et ceux qui viennent du nord", en: "Medina and those coming from the north" }, latitude: 24.4136, longitude: 39.5431, sources: [H("Sahîh al-Bukhârî 1526")] },
  { id: "juhfa", name: "Al-Juhfa", arabic: "الجحفة", place: { fr: "près de Râbigh", en: "near Rabigh" }, people: { fr: "Europe, Maghreb, Égypte, Shâm", en: "Europe, North Africa, Egypt, Sham" }, latitude: 22.7065, longitude: 39.1445, sources: [H("Sahîh al-Bukhârî 1526")] },
  { id: "qarn", name: "Qarn al-Manâzil", arabic: "قرن المنازل", place: { fr: "As-Sayl al-Kabîr", en: "As-Sayl al-Kabir" }, people: { fr: "Najd, Golfe, Asie par l’est", en: "Najd, the Gulf, Asia from the east" }, latitude: 21.6333, longitude: 40.4167, sources: [H("Sahîh al-Bukhârî 1526")] },
  { id: "dhat-irq", name: "Dhât ‘Irq", arabic: "ذات عرق", place: { fr: "au nord-est de La Mecque", en: "north-east of Makkah" }, people: { fr: "Irak", en: "Iraq" }, latitude: 21.9333, longitude: 40.4333, sources: [H("Sahîh al-Bukhârî 1531")] },
  { id: "yalamlam", name: "Yalamlam", arabic: "يلملم", place: { fr: "As-Sa‘diyya", en: "As-Sa‘diyyah" }, people: { fr: "Yémen et ceux qui viennent du sud", en: "Yemen and those coming from the south" }, latitude: 20.5167, longitude: 39.8667, sources: [H("Sahîh al-Bukhârî 1526")] },
];

const RAD = Math.PI / 180;

/** Great-circle distance in km. */
export function distanceKm(a: { latitude: number; longitude: number }, b: { latitude: number; longitude: number }) {
  const dLat = (b.latitude - a.latitude) * RAD;
  const dLng = (b.longitude - a.longitude) * RAD;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.latitude * RAD) * Math.cos(b.latitude * RAD) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(h));
}

/** Bearing (degrees from north) of `to` as seen from `from`. */
export function bearing(from: { latitude: number; longitude: number }, to: { latitude: number; longitude: number }) {
  const y = Math.sin((to.longitude - from.longitude) * RAD) * Math.cos(to.latitude * RAD);
  const x = Math.cos(from.latitude * RAD) * Math.sin(to.latitude * RAD)
    - Math.sin(from.latitude * RAD) * Math.cos(to.latitude * RAD) * Math.cos((to.longitude - from.longitude) * RAD);
  return (Math.atan2(y, x) / RAD + 360) % 360;
}

/**
 * Direction sectors seen from the Kaaba (degrees from north), following who each mîqât was set for:
 * north → Dhul-Hulayfa, north-east (Irak) → Dhât ‘Irq, east → Qarn al-Manâzil, south → Yalamlam,
 * west and north-west (Europe, Maghreb, Égypte, Shâm) → al-Juhfa.
 */
const SECTORS: ReadonlyArray<{ from: number; to: number; id: string }> = [
  { from: 348, to: 360, id: "dhul-hulayfa" },
  { from: 0, to: 12, id: "dhul-hulayfa" },
  { from: 12, to: 50, id: "dhat-irq" },
  { from: 50, to: 140, id: "qarn" },
  { from: 140, to: 235, id: "yalamlam" },
  { from: 235, to: 348, id: "juhfa" },
];

/** The mîqât for the direction the traveller comes from (muhâdhât). */
export function alignedMiqat(position: { latitude: number; longitude: number }): Miqat {
  const direction = bearing(KAABA, position);
  const sector = SECTORS.find((item) => direction >= item.from && direction < item.to) ?? SECTORS[SECTORS.length - 1];
  return MIQATS.find((miqat) => miqat.id === sector.id) ?? MIQATS[1];
}

/** Kilometres left before the mîqât line (its distance to the Kaaba), never negative. */
export function kmToMiqat(position: { latitude: number; longitude: number }, miqat: Miqat) {
  return Math.max(0, distanceKm(position, KAABA) - distanceKm(miqat, KAABA));
}
