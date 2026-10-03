import { StyleSheet, Text, View } from 'react-native';
import { isPaused, type TahajjudNights, type TahajjudPause } from '../../features/tahajjud/TahajjudStore';
import { shiftDateKey } from '../../features/tahajjud/tahajjudNight';
import { night, nightType } from './theme';

const DAYS = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];

/** Last 7 nights: full gold moon = prayed, outline = not, faded = paused. Never red, never judging. */
export function WeekMoons({ nights, pauses, currentNight, size = 26 }: {
  nights: TahajjudNights;
  pauses: readonly TahajjudPause[];
  currentNight: string;
  size?: number;
}) {
  const keys = Array.from({ length: 7 }, (_, index) => shiftDateKey(currentNight, index - 6));
  return (
    <View style={styles.row}>
      {keys.map((key) => {
        const done = Boolean(nights[key]);
        const paused = !done && isPaused(pauses, key);
        const today = key === currentNight;
        return (
          <View key={key} style={styles.item}>
            <View
              style={[
                styles.moon,
                { width: size, height: size, borderRadius: size / 2 },
                done && styles.done,
                paused && styles.paused,
                today && !done && styles.today,
              ]}
            />
            <Text style={[styles.day, today && styles.dayToday]}>{DAYS[new Date(`${key}T12:00:00`).getDay()]}</Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  item: { alignItems: 'center', gap: 6 },
  moon: { borderWidth: 1.5, borderColor: 'rgba(183,171,242,0.35)' },
  done: {
    backgroundColor: night.goldSoft, borderColor: night.goldSoft,
    shadowColor: night.goldSoft, shadowOpacity: 0.8, shadowRadius: 8, shadowOffset: { width: 0, height: 0 }, elevation: 4,
  },
  paused: { borderStyle: 'dashed', borderColor: 'rgba(183,171,242,0.2)' },
  today: { borderColor: night.gold },
  day: { color: night.muted, fontSize: 11, ...nightType.semibold },
  dayToday: { color: night.goldSoft },
});
