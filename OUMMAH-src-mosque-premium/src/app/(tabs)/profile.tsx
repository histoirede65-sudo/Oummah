import { StyleSheet, Text, View } from "react-native";
import { colors } from "../../theme/colors";
import { useI18n } from '../../i18n';

export default function ProfileScreen() {
  const { t } = useI18n();
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('screen.profile')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: "center",
    alignItems: "center",
  },

  title: {
    color: colors.primary,
    fontSize: 30,
    fontWeight: "700",
  },
});
