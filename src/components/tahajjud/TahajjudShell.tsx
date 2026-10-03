import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NightSky } from './NightSky';
import { night, nightType } from './theme';

/** Frame of every Tahajjud screen: night sky, back button, optional title. */
export function TahajjudShell({ title, eyebrow, children, scroll = true }: {
  title?: string;
  eyebrow?: string;
  children: ReactNode;
  scroll?: boolean;
}) {
  const header = (
    <View style={styles.header}>
      <Pressable accessibilityRole="button" accessibilityLabel="Retour" onPress={() => router.back()} hitSlop={10} style={styles.back}>
        <Ionicons name="chevron-back" size={22} color={night.text} />
      </Pressable>
      {title ? (
        <View style={styles.headerCopy}>
          {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
          <Text style={styles.title}>{title}</Text>
        </View>
      ) : null}
    </View>
  );
  return (
    <View style={styles.root}>
      <NightSky />
      <SafeAreaView edges={['top']} style={styles.safe}>
        {scroll ? (
          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            {header}
            {children}
          </ScrollView>
        ) : (
          <View style={[styles.content, styles.fill]}>
            {header}
            {children}
          </View>
        )}
      </SafeAreaView>
    </View>
  );
}

/** Frosted card of the Tahajjud space. */
export function GlassCard({ children, style, gold = false }: { children: ReactNode; style?: object; gold?: boolean }) {
  return <View style={[styles.card, gold && styles.cardGold, style]}>{children}</View>;
}

export const shellStyles = StyleSheet.create({
  sectionLabel: { color: night.muted, fontSize: 11, letterSpacing: 2.2, textTransform: 'uppercase', marginBottom: 12, ...nightType.bold },
});

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: night.sky0 },
  safe: { flex: 1 },
  content: { paddingHorizontal: 18, paddingBottom: 48 },
  fill: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingTop: 6, paddingBottom: 14 },
  back: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: night.glassStrong, borderWidth: 1, borderColor: night.line },
  headerCopy: { flex: 1 },
  eyebrow: { color: night.gold, fontSize: 10, letterSpacing: 2.4, textTransform: 'uppercase', ...nightType.bold },
  title: { color: night.text, fontSize: 30, lineHeight: 34, ...nightType.display },
  card: { borderRadius: 24, padding: 18, backgroundColor: night.glass, borderWidth: 1, borderColor: night.line },
  cardGold: { borderColor: night.goldLine, backgroundColor: 'rgba(227,181,90,0.06)' },
});
