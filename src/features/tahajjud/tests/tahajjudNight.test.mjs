import assert from 'node:assert/strict';
import { test } from 'node:test';
import { alarmTime, bedtimeSuggestions, getNightState, upcomingNights } from '../tahajjudNight.ts';

// Marseille, 3 → 4 octobre (heure locale de la machine de test).
const at = (day, hh, mm) => new Date(2026, 9, day, hh, mm).getTime();
const dayPrayers = (day, offset = 0) => [
  { key: 'Fajr', timestamp: at(day, 6, 20 + offset) },
  { key: 'Dhuhr', timestamp: at(day, 13, 28) },
  { key: 'Asr', timestamp: at(day, 16, 42) },
  { key: 'Maghrib', timestamp: at(day, 19, 16 - offset) },
  { key: 'Isha', timestamp: at(day, 20, 34 - offset) },
];
const schedule = { prayers: dayPrayers(3), tomorrowPrayers: dayPrayers(4, 1), futurePrayers: [...dayPrayers(5, 2), ...dayPrayers(6, 3)] };

test('soirée après Isha : nuit de ce soir, dernier tiers = Maghrib + 2/3 de la nuit', () => {
  const state = getNightState(schedule, at(3, 22, 0));
  assert.equal(state.phase, 'evening');
  assert.equal(state.night.key, '2026-10-03');
  // 19:16 → 06:21 = 11 h 05 ; 2/3 = 7 h 23 min 20 s → 02:39:20
  assert.equal(new Date(state.night.lastThirdStart).getHours(), 2);
  assert.equal(new Date(state.night.lastThirdStart).getMinutes(), 39);
  assert.equal(state.validatableKey, '2026-10-03');
});

test('après minuit : la nuit a commencé hier soir (Maghrib d’hier, pas celui du jour)', () => {
  const state = getNightState(schedule, at(3, 3, 0));
  assert.equal(state.phase, 'lastThird');
  assert.equal(state.night.key, '2026-10-02');
  // Maghrib d'hier extrapolé : 19:17 (la veille du 19:16), Fajr du jour 06:20.
  assert.equal(new Date(state.night.maghrib).getHours(), 19);
  assert.equal(new Date(state.night.maghrib).getMinutes(), 17);
  assert.equal(new Date(state.night.maghrib).getDate(), 2);
  assert.equal(new Date(state.night.fajr).getDate(), 3);
});

test('journée : nuit de la veille validable jusqu’à Dhuhr, puis plus rien', () => {
  assert.equal(getNightState(schedule, at(3, 9, 0)).validatableKey, '2026-10-02');
  assert.equal(getNightState(schedule, at(3, 9, 0)).phase, 'day');
  assert.equal(getNightState(schedule, at(3, 15, 0)).validatableKey, null);
});

test('nuits à venir à partir de jours consécutifs', () => {
  const nights = upcomingNights(schedule);
  assert.deepEqual(nights.map((night) => night.key), ['2026-10-03', '2026-10-04', '2026-10-05']);
});

test('réveil : modes et heure personnalisée placée dans la nuit', () => {
  const night = getNightState(schedule, at(3, 22, 0)).night;
  assert.equal(alarmTime(night, 'start'), night.lastThirdStart);
  assert.equal(alarmTime(night, 'beforeFajr30'), night.fajr - 30 * 60_000);
  const custom = new Date(alarmTime(night, 'custom', '04:15'));
  assert.equal(custom.getDate(), 4);
  assert.equal(custom.getHours(), 4);
  assert.ok(bedtimeSuggestions(night, night.lastThirdStart).every((s) => s.at >= night.isha));
});
