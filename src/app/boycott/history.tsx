import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getBoycottScanHistory, type BoycottScanHistoryItem } from '../../features/boycott/data/BoycottRepository';
import { BoycottProductImage } from '../../components/boycott/BoycottProductImage';
import { getActiveLanguage, useI18n } from '../../i18n';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';

function formatScanDate(timestamp: number) {
  return new Intl.DateTimeFormat(getActiveLanguage() === 'en' ? 'en-GB' : 'fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(timestamp));
}

export default function BoycottHistoryScreen() {
  const { t } = useI18n();
  const [history, setHistory] = useState<BoycottScanHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(useCallback(() => {
    let active = true;
    setLoading(true);
    void getBoycottScanHistory().then((items) => {
      if (active) setHistory(items);
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, []));

  return (
    <LinearGradient colors={['#090713', '#110A1B', '#090713']} style={styles.screen}>
      <SafeAreaView edges={['top', 'bottom']} style={styles.safe}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.headerButton}><Ionicons name="arrow-back" size={21} color={colors.goldLight} /></Pressable>
          <View style={styles.headerCopy}><Text style={styles.title}>{t("boycottHome.history")}</Text><Text style={styles.subtitle}>{t("history.subtitle")}</Text></View>
          <Pressable onPress={() => router.push('/boycott/scanner')} style={styles.headerButton}><Ionicons name="scan" size={21} color={colors.goldLight} /></Pressable>
        </View>

        {loading ? <ActivityIndicator color={colors.goldLight} style={styles.loader} /> : (
          <FlatList
            data={history}
            keyExtractor={(item) => item.barcode}
            contentContainerStyle={[styles.content, !history.length && styles.emptyContent]}
            showsVerticalScrollIndicator={false}
            ListHeaderComponent={history.length ? <Text style={styles.count}>{t(history.length > 1 ? 'scan.altCountMany' : 'scan.altCountOne', { count: history.length })}</Text> : null}
            ListEmptyComponent={
              <View style={styles.empty}>
                <View style={styles.emptyIcon}><Ionicons name="time-outline" size={30} color={colors.goldLight} /></View>
                <Text style={styles.emptyTitle}>{t("history.empty")}</Text>
                <Text style={styles.emptyText}>{t("history.emptyText")}</Text>
                <Pressable onPress={() => router.push('/boycott/scanner')} style={styles.scanButton}><Ionicons name="scan" size={19} color="#17111C" /><Text style={styles.scanButtonText}>{t("boycottHome.scanProduct")}</Text></Pressable>
              </View>
            }
            renderItem={({ item }) => (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('boycottHome.openProduct', { name: item.productName || item.brandLabel || t('boycottHome.productBarcode', { barcode: item.barcode }) })}
                onPress={() => router.push({ pathname: '/boycott/scanner', params: { barcode: item.barcode, from: 'history' } } as never)}
                style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
              >
                <View style={styles.imageWrap}>
                  <BoycottProductImage contentFit="contain" style={styles.image} uri={item.imageUrl} />
                </View>
                <View style={styles.cardCopy}>
                  <Text numberOfLines={2} style={styles.productName}>{item.productName || item.brandLabel || t('boycottHome.productBarcode', { barcode: item.barcode })}</Text>
                  {item.brandLabel && item.brandLabel !== item.productName ? <Text numberOfLines={1} style={styles.brand}>{item.brandLabel}</Text> : null}
                  <View style={styles.metaRow}><Ionicons name="barcode-outline" size={13} color={colors.textMuted} /><Text style={styles.meta}>{item.barcode}</Text></View>
                </View>
                <Text style={styles.date}>{formatScanDate(item.cachedAt)}</Text>
                <Ionicons name="chevron-forward" size={17} color={colors.goldLight} />
              </Pressable>
            )}
          />
        )}
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  safe: { flex: 1 },
  header: { minHeight: 68, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 13 },
  headerButton: { width: 42, height: 42, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.045)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)' },
  headerCopy: { flex: 1 },
  title: { color: colors.text, fontFamily: typography.serifSemibold, fontSize: 23 },
  subtitle: { marginTop: 1, color: colors.textMuted, fontFamily: typography.sans, fontSize: 10.5 },
  loader: { marginTop: 50 },
  content: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 32, gap: 10 },
  emptyContent: { flexGrow: 1, justifyContent: 'center' },
  count: { marginBottom: 4, color: colors.textMuted, fontFamily: typography.sans, fontSize: 11.5, fontWeight: '700' },
  card: { minHeight: 92, padding: 12, borderRadius: 23, flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: 'rgba(23,16,33,0.92)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  cardPressed: { opacity: 0.72, transform: [{ scale: 0.985 }] },
  imageWrap: { width: 58, height: 66, borderRadius: 17, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.05)' },
  image: { width: '100%', height: '100%', backgroundColor: '#FFF' },
  cardCopy: { flex: 1, minWidth: 0 },
  productName: { color: colors.text, fontFamily: typography.serifSemibold, fontSize: 16.5, lineHeight: 20 },
  brand: { marginTop: 2, color: colors.textSecondary, fontFamily: typography.sans, fontSize: 11.5, fontWeight: '700' },
  metaRow: { marginTop: 7, flexDirection: 'row', alignItems: 'center', gap: 5 },
  meta: { color: colors.textMuted, fontFamily: typography.sans, fontSize: 9.5 },
  date: { alignSelf: 'flex-start', marginTop: 4, color: colors.goldLight, fontFamily: typography.sans, fontSize: 9.5, fontWeight: '700' },
  empty: { alignItems: 'center', paddingHorizontal: 32 },
  emptyIcon: { width: 64, height: 64, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(221,183,101,0.09)', borderWidth: 1, borderColor: 'rgba(221,183,101,0.22)' },
  emptyTitle: { marginTop: 16, color: colors.text, fontFamily: typography.serifSemibold, fontSize: 22 },
  emptyText: { marginTop: 7, color: colors.textMuted, fontFamily: typography.sans, fontSize: 12.5, lineHeight: 19, textAlign: 'center' },
  scanButton: { marginTop: 20, minHeight: 50, paddingHorizontal: 18, borderRadius: 18, flexDirection: 'row', alignItems: 'center', gap: 9, backgroundColor: colors.goldLight },
  scanButtonText: { color: '#17111C', fontFamily: typography.sans, fontSize: 12.5, fontWeight: '800' },
});
