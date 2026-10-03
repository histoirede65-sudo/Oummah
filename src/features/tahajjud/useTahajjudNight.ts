import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import type { MosquePrayerSchedule } from '../mosques/data/mosquePrayerTimes';
import {
  currentStreak,
  loadNightDetails,
  loadPauses,
  loadTahajjudNights,
  type NightDetails,
  type TahajjudNights,
  type TahajjudPause,
} from './TahajjudStore';
import { getNightState, type NightState } from './tahajjudNight';
import { loadTahajjudSchedule } from './tahajjudSchedule';
import { cancelTahajjudNight, refreshTahajjudNotifications, validateTahajjudNight } from './tahajjudService';

export type TahajjudView = {
  loading: boolean;
  error: 'location' | 'network' | null;
  now: number;
  state: NightState | null;
  nights: TahajjudNights;
  details: NightDetails;
  pauses: TahajjudPause[];
  /** Night that can be validated now and is not yet. */
  canValidate: boolean;
  /** The current (or last) night is validated. */
  validated: boolean;
  streak: number;
  validate: (witr: boolean) => Promise<void>;
  undo: () => Promise<void>;
  reload: () => void;
};

/**
 * Everything the Tahajjud screens need, refreshed on focus and every 30 s. When `schedule` is given
 * (home screen), it is used instead of loading one.
 */
export function useTahajjudNight(schedule?: MosquePrayerSchedule | null): TahajjudView {
  const [loaded, setLoaded] = useState<MosquePrayerSchedule | null>(null);
  const [loading, setLoading] = useState(schedule === undefined);
  const [error, setError] = useState<TahajjudView['error']>(null);
  const [now, setNow] = useState(Date.now());
  const [nights, setNights] = useState<TahajjudNights>({});
  const [details, setDetails] = useState<NightDetails>({});
  const [pauses, setPauses] = useState<TahajjudPause[]>([]);
  const [version, setVersion] = useState(0);

  useFocusEffect(useCallback(() => {
    let active = true;
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), 30_000);
    void Promise.all([loadTahajjudNights(), loadNightDetails(), loadPauses()]).then(([n, d, p]) => {
      if (!active) return;
      setNights(n);
      setDetails(d);
      setPauses(p);
    });
    if (schedule === undefined) {
      setLoading(true);
      setError(null);
      loadTahajjudSchedule()
        .then((value) => { if (active) setLoaded(value); })
        .catch((reason: unknown) => {
          if (active) setError(reason instanceof Error && reason.message === 'LOCATION_REQUIRED' ? 'location' : 'network');
        })
        .finally(() => { if (active) setLoading(false); });
    }
    void refreshTahajjudNotifications();
    return () => { active = false; clearInterval(timer); };
  }, [schedule, version]));

  const source = schedule === undefined ? loaded : schedule;
  const state = source ? getNightState(source, now) : null;
  const key = state?.validatableKey ?? null;
  const validated = Boolean(state && nights[key ?? state.night.key]);
  const streak = state ? currentStreak(nights, pauses, key ?? state.night.key) : 0;

  const validate = useCallback(async (witr: boolean) => {
    if (!key) return;
    setNights(await validateTahajjudNight(key, witr));
    setDetails(await loadNightDetails());
  }, [key]);

  const undo = useCallback(async () => {
    if (!key) return;
    setNights(await cancelTahajjudNight(key));
  }, [key]);

  return {
    loading, error, now, state, nights, details, pauses,
    canValidate: Boolean(key && !nights[key]),
    validated, streak, validate, undo,
    reload: () => setVersion((value) => value + 1),
  };
}
