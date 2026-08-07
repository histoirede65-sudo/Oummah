import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { useI18n } from '../../i18n';

type QuranSearchBarProps = {
  value: string;
  onChangeText: (value: string) => void;
};

export default function QuranSearchBar({
  value,
  onChangeText,
}: QuranSearchBarProps) {
  const { t } = useI18n();
  return (
    <View style={styles.container}>
      <LinearGradient
        pointerEvents="none"
        colors={['rgba(255,255,255,0.10)', 'transparent']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.75, y: 1 }}
        style={[StyleSheet.absoluteFill, styles.glass]}
      />
      <View style={styles.searchIcon}>
        <Ionicons name="search-outline" size={20} color={colors.goldLight} />
      </View>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={t('quran.search')}
        placeholderTextColor={colors.textMuted}
        autoCorrect={false}
        returnKeyType="search"
        style={styles.input}
      />
      {value.length > 0 ? (
        <Pressable
          accessibilityLabel={t('quran.clearSearch')}
          hitSlop={10}
          onPress={() => onChangeText('')}
        >
          <Ionicons name="close-circle" size={18} color={colors.textMuted} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 54,
    overflow: 'hidden',
    paddingHorizontal: 9,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(126,78,151,0.42)',
    backgroundColor: 'rgba(24,16,38,0.88)',
  },
  glass: { borderRadius: 20 },
  searchIcon: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 19,
    backgroundColor: 'rgba(43,21,63,0.76)',
  },
  input: {
    flex: 1,
    marginHorizontal: 10,
    paddingVertical: 0,
    color: colors.text,
    fontFamily: typography.sans,
    fontSize: 13.5,
    fontWeight: '500',
  },
});
