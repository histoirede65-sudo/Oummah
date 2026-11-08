import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { muhasabahText } from '../features/muhasabah/muhasabahStrings';
import { useI18n } from '../i18n';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';

export default function HomeMuhasabahCard() {
  const { language } = useI18n();
  const t = useMemo(() => muhasabahText(language), [language]);
  // Toujours la phrase d'invitation : tout le monde ne connaît pas la muhâsabah ni les objectifs.
  const subtitle = t('homeDefault');

  return (
    <Pressable accessibilityRole="button" accessibilityLabel={t('homeOpen')} onPress={() => router.push('/muhasabah')} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <View style={styles.icon}><Ionicons name="create-outline" size={25} color={colors.goldLight} /></View>
      <View style={styles.copy}><Text style={styles.title}>{t('title')}</Text><Text numberOfLines={2} style={styles.subtitle}>{subtitle}</Text></View>
      <Image source={require('../../assets/images/muhasabah-lantern.png')} resizeMode="contain" style={styles.lantern} />
      <Ionicons name="chevron-forward" size={24} color={colors.goldLight} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { minHeight: 64, marginTop: 10, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 18, borderWidth: 1, borderColor: 'rgba(242,181,61,0.82)', backgroundColor: 'rgba(23,17,34,0.94)', flexDirection: 'row', alignItems: 'center', gap: 10, overflow: 'hidden' },
  icon: { width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(49,35,62,0.92)', borderWidth: 1, borderColor: 'rgba(221,187,142,0.42)' },
  copy: { flex: 1, zIndex: 1 },
  title: { color: colors.text, fontFamily: typography.sans, fontWeight: '700', fontSize: 17 },
  subtitle: { color: colors.textSecondary, fontFamily: typography.sans, fontSize: 12, lineHeight: 16, marginTop: 1, maxWidth: 230 },
  lantern: { position: 'absolute', right: 23, bottom: 7, width: 56, height: 56, opacity: 0.62 },
  pressed: { opacity: 0.82 },
});
