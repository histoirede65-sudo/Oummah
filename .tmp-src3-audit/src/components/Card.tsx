import { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { colors } from '../theme/colors';

type CardProps = {
  children: ReactNode;
};

export default function Card({ children }: CardProps) {
  return <View style={styles.card}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#3C2B67',
    marginBottom: 18,
    overflow: 'hidden',
  },
});