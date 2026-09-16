import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, TextInput, View } from "react-native";
import { colors } from "../../../theme/colors";
import { typography } from "../../../theme/typography";
import { useI18n } from "../../../i18n";

export default function HadithSearchBar({ value, onChangeText, onSubmit, placeholder }: { value: string; onChangeText: (value: string) => void; onSubmit?: () => void; placeholder?: string }) {
  const { t } = useI18n();
  return (
    <View style={styles.container}>
      <Ionicons name="search-outline" size={19} color={colors.goldLight} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        onSubmitEditing={onSubmit}
        returnKeyType="search"
        autoCorrect
        placeholder={placeholder ?? t("hadith.searchPlaceholder")}
        placeholderTextColor="#81788B"
        style={styles.input}
      />
      {value ? (
        <Pressable accessibilityLabel={t("hadith.clearSearch")} onPress={() => onChangeText("")} hitSlop={8}>
          <Ionicons name="close-circle" size={18} color="#8F849A" />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { height: 52, borderRadius: 18, borderWidth: 1, borderColor: "rgba(227,181,90,0.25)", backgroundColor: "rgba(29,20,43,0.94)", paddingHorizontal: 15, flexDirection: "row", alignItems: "center", gap: 10 },
  input: { flex: 1, color: colors.text, fontFamily: typography.sans, fontSize: 14, paddingVertical: 0 },
});

