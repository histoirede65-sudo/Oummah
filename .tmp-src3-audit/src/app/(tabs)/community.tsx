import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';

export default function CommunityScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.content}>
        <View style={styles.icon}>
          <Ionicons name="people-outline" size={38} color={colors.goldLight} />
        </View>
        <Text style={styles.title}>Communauté</Text>
        <Text style={styles.subtitle}>
          Votre espace communautaire arrive bientôt.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  icon: {
    width: 74,
    height: 74,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 37,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: colors.surface,
  },
  title: {
    marginTop: 16,
    color: colors.goldLight,
    fontFamily: typography.serifMedium,
    fontSize: 30,
  },
  subtitle: {
    marginTop: 6,
    color: colors.textSecondary,
    fontFamily: typography.sans,
    fontSize: 13,
  },
});
