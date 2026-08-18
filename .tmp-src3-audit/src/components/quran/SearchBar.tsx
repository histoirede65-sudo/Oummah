import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, TextInput, View } from 'react-native';

import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { useI18n } from '../../i18n';

type SearchBarProps = {
  value: string;
  onChangeText: (value: string) => void;
};

export default function SearchBar({ value, onChangeText }: SearchBarProps) {
  const { t } = useI18n();
  return (
    <View style={styles.container}>
      <Ionicons name="search-outline" size={19} color={colors.gold} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={t('quran.search')}
        placeholderTextColor={colors.textMuted}
        autoCorrect={false}
        returnKeyType="search"
        style={styles.input}
      />
      {value ? <Ionicons name="close-circle" size={17} color={colors.textMuted} onPress={() => onChangeText('')} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 48,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: colors.surface,
  },
  input: { flex: 1, marginHorizontal: 9, paddingVertical: 0, color: colors.text, fontFamily: typography.sans, fontSize: 13 },
});
