import { StyleSheet, View } from 'react-native';

import HadithCard from './HadithCard';
import VerseOfDayCard from './VerseOfDayCard';

/** Hadith and verse of the day, side by side. */
export default function HomeDailyRow() {
  return (
    <View style={styles.dailyRow}>
      <HadithCard />
      <VerseOfDayCard />
    </View>
  );
}

const styles = StyleSheet.create({
  dailyRow: {
    height: 134,
    marginBottom: 14,
    flexDirection: 'row',
    gap: 7,
  },
});
