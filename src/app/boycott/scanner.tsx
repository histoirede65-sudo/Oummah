import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { BackHandler, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BoycottScanResultCard } from '../../components/boycott/BoycottScanResultCard';
import { getBoycottCatalog, lookupBoycottBarcode, type BarcodeLookupResult } from '../../features/boycott/data/BoycottRepository';
import type { BoycottEntity } from '../../features/boycott/domain/BoycottEntity';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';

export default function BoycottScannerScreen() {
  const params = useLocalSearchParams<{ barcode?: string | string[]; from?: string | string[] }>();
  const historyBarcode = (Array.isArray(params.barcode) ? params.barcode[0] : params.barcode)?.replace(/\D/g, '') ?? '';
  const openedFromHistory = (Array.isArray(params.from) ? params.from[0] : params.from) === 'history';
  const openedFromProductLink = Boolean(historyBarcode);
  const [permission, requestPermission] = useCameraPermissions();
  const [catalog, setCatalog] = useState<BoycottEntity[]>([]);
  const [torch, setTorch] = useState(false);
  const [locked, setLocked] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [result, setResult] = useState<BarcodeLookupResult | null>(null);
  const lockRef = useRef(false);

  useEffect(() => {
    let active = true;
    void getBoycottCatalog().then(async (items) => {
      if (!active) return;
      setCatalog(items);
      if (!historyBarcode) return;
      if (__DEV__) console.log('[ScanProductFlowDiagnostic]', { step: 'route barcode received', source: 'route params', barcode: historyBarcode, repository: 'pending' });
      lockRef.current = true;
      setLocked(true);
      const lookup = await lookupBoycottBarcode(items, historyBarcode);
      if (__DEV__) console.log('[ScanProductFlowDiagnostic]', { step: 'repository result', source: 'BoycottRepository.lookupBoycottBarcode', barcode: lookup.barcode, resultSource: lookup.source, hasIngredientsText: Boolean(lookup.healthData?.ingredientsText), hasAdditivesTags: Boolean(lookup.healthData?.additivesTags?.length), nutritionBasis: lookup.healthData?.nutritionBasis, healthDataProvenance: lookup.healthData?.healthDataProvenance });
      if (active) setResult(lookup);
    });
    return () => { active = false; };
  }, [historyBarcode]);

  function resetScanner() {
    lockRef.current = false;
    setLocked(false);
    setResult(null);
  }

  useEffect(() => {
    if (!result) return undefined;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (openedFromProductLink) router.back();
      else resetScanner();
      return true;
    });
    return () => subscription.remove();
  }, [openedFromProductLink, result]);

  function hasValidCheckDigit(code: string) {
    if (![8, 12, 13].includes(code.length)) return true;
    const digits = code.split('').map(Number);
    const check = digits.pop();
    if (check === undefined || digits.some((digit) => Number.isNaN(digit))) return false;
    let sum = 0;
    const parity = code.length === 13 || code.length === 8 ? 0 : 1;
    for (let index = 0; index < digits.length; index += 1) {
      const fromRight = digits.length - 1 - index;
      const weight = (fromRight + parity) % 2 === 0 ? 3 : 1;
      sum += digits[index] * weight;
    }
    return (10 - (sum % 10)) % 10 === check;
  }

  function extractProductBarcode(raw: string, type?: string) {
    if (type === 'qr') {
      return raw.match(/(?:^|\D)(\d{8}|\d{12}|\d{13})(?:\D|$)/)?.[1] ?? '';
    }
    if (type && /data_?matrix/i.test(type)) {
      // GS1 DataMatrix (French medicine boxes): "]d2" / FNC1 prefix, then AI "01" + GTIN-14.
      // A GTIN-14 starting with 0 is the EAN-13 / CIP13 printed on the box.
      const gtin = raw.replace(/^\]d2/, '').replace(/^\u001d/, '').match(/^01(\d{14})/)?.[1];
      return gtin?.startsWith('0') ? gtin.slice(1) : '';
    }
    return raw.replace(/\D/g, '');
  }

  async function onBarcode(raw: string, type?: string) {
    if (lockRef.current) return;
    const data = extractProductBarcode(raw, type);
    if (![8, 12, 13].includes(data.length) || !hasValidCheckDigit(data)) return;

    lockRef.current = true;
    setLocked(true);
    if (__DEV__) console.log('[ScanProductFlowDiagnostic]', { step: 'scanner detected barcode', source: 'CameraView.onBarcodeScanned', barcode: data, rawType: type, repository: 'pending' });
    const lookup = await lookupBoycottBarcode(catalog, data);
    if (__DEV__) console.log('[ScanProductFlowDiagnostic]', { step: 'repository result', source: 'BoycottRepository.lookupBoycottBarcode', barcode: lookup.barcode, resultSource: lookup.source, hasIngredientsText: Boolean(lookup.healthData?.ingredientsText), hasAdditivesTags: Boolean(lookup.healthData?.additivesTags?.length), nutritionBasis: lookup.healthData?.nutritionBasis, healthDataProvenance: lookup.healthData?.healthDataProvenance });
    setResult(lookup);
  }

  useEffect(() => {
    if (!result || !__DEV__) return;
    console.log('[ScanProductFlowDiagnostic]', { step: 'BoycottScanResultCard receives product', source: 'component state', barcode: result.barcode, hasIngredientsText: Boolean(result.healthData?.ingredientsText), hasAdditivesTags: Boolean(result.healthData?.additivesTags?.length), nutritionBasis: result.healthData?.nutritionBasis, healthDataProvenance: result.healthData?.healthDataProvenance });
  }, [result]);


  if (!historyBarcode && !permission) {
    return <View style={styles.permission}><Text style={styles.permissionText}>Initialisation de la caméra…</Text></View>;
  }

  if (!historyBarcode && !permission?.granted) {
    return (
      <View style={styles.permission}>
        <Ionicons name="camera-outline" size={40} color={colors.goldLight} />
        <Text style={styles.permissionTitle}>Caméra nécessaire</Text>
        <Text style={styles.permissionText}>La caméra sert uniquement à lire le code-barres du produit.</Text>
        <Pressable onPress={() => void requestPermission()} style={styles.permissionButton}>
          <Text style={styles.permissionButtonText}>Autoriser la caméra</Text>
        </Pressable>
        <Pressable onPress={() => router.back()}><Text style={styles.cancel}>Annuler</Text></Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.screen, openedFromProductLink && styles.screenLink]}>
      {!openedFromProductLink ? <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        mode="picture"
        enableTorch={torch}
        onCameraReady={() => setCameraReady(true)}
        onMountError={() => setCameraReady(false)}
        barcodeScannerSettings={{ barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'qr', 'code128', 'datamatrix'] }}
        onBarcodeScanned={locked ? undefined : ({ data, type }) => void onBarcode(data, type)}
      /> : null}

      {!openedFromProductLink ? <View pointerEvents="box-none" style={styles.overlay}>
        <SafeAreaView edges={['top', 'bottom']} style={styles.safe}>
          <View style={styles.top}>
            <Pressable onPress={() => router.back()} style={styles.circle}><Ionicons name="close" size={24} color="#FFF" /></Pressable>
            <View style={styles.titleWrap}>
              <Text style={styles.title}>Scanner</Text>
              <Text style={styles.readyText}>{cameraReady ? 'Prêt' : 'Caméra…'}</Text>
            </View>
            <Pressable onPress={() => setTorch((value) => !value)} style={styles.circle}>
              <Ionicons name={torch ? 'flash' : 'flash-outline'} size={22} color={torch ? '#F4CF77' : '#FFF'} />
            </Pressable>
          </View>

          <View style={styles.center} pointerEvents="none">
            <View style={styles.frame}>
              <View style={[styles.corner, styles.tl]} />
              <View style={[styles.corner, styles.tr]} />
              <View style={[styles.corner, styles.bl]} />
              <View style={[styles.corner, styles.br]} />
              <View style={styles.scanLine} />
            </View>
            <Text style={styles.hint}>{locked ? 'Vérification instantanée…' : 'Cadrez le code ou le QR, dans n’importe quel sens'}</Text>
          </View>

          <View style={styles.bottom}>
            <Text style={styles.bottomText}>EAN · UPC · QR · détection instantanée</Text>
          </View>
        </SafeAreaView>
      </View> : null}

      {openedFromProductLink && !result ? <View style={styles.historyLoading}><Text style={styles.permissionText}>Chargement de la fiche…</Text></View> : null}

      {result ? <BoycottScanResultCard result={result} startExpanded={openedFromProductLink} primaryLabel={openedFromProductLink ? (openedFromHistory ? "Retour à l'historique" : 'Retour au produit précédent') : undefined} onClose={openedFromProductLink ? () => router.back() : resetScanner} onOpenEntity={() => router.push(`/boycott/${result.boycottEntity!.id}`)} onOpenAlternative={(barcode) => router.push({ pathname: '/boycott/scanner', params: { barcode, from: 'alternative' } } as never)} onPropose={() => router.replace({ pathname: '/boycott/add', params: { barcode: result.barcode, name: result.productName || '', brand: result.brandLabel || '' } } as never)} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#000' },
  screenLink: { backgroundColor: '#090713' },
  historyLoading: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, alignItems: 'center', justifyContent: 'center', backgroundColor: '#090713' },
  overlay: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: 'rgba(0,0,0,0.18)' },
  safe: { flex: 1, justifyContent: 'space-between' },
  top: { height: 70, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  circle: { width: 45, height: 45, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.42)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)' },
  titleWrap: { alignItems: 'center' },
  title: { color: '#FFF', fontFamily: typography.serifSemibold, fontSize: 22 },
  readyText: { marginTop: 1, color: 'rgba(255,255,255,0.68)', fontFamily: typography.sans, fontSize: 10.5, fontWeight: '700' },
  center: { alignItems: 'center', paddingHorizontal: 24 },
  frame: { width: '100%', maxWidth: 350, aspectRatio: 1.68, borderRadius: 28, backgroundColor: 'rgba(0,0,0,0.04)', overflow: 'hidden' },
  corner: { position: 'absolute', width: 46, height: 46, borderColor: '#F1C96D' },
  tl: { top: 0, left: 0, borderTopWidth: 4, borderLeftWidth: 4, borderTopLeftRadius: 20 },
  tr: { top: 0, right: 0, borderTopWidth: 4, borderRightWidth: 4, borderTopRightRadius: 20 },
  bl: { bottom: 0, left: 0, borderBottomWidth: 4, borderLeftWidth: 4, borderBottomLeftRadius: 20 },
  br: { bottom: 0, right: 0, borderBottomWidth: 4, borderRightWidth: 4, borderBottomRightRadius: 20 },
  scanLine: { position: 'absolute', left: 28, right: 28, top: '50%', height: 2, borderRadius: 2, backgroundColor: 'rgba(241,201,109,0.82)', shadowColor: '#F1C96D', shadowOpacity: 0.6, shadowRadius: 9 },
  hint: { marginTop: 18, maxWidth: 340, color: '#FFF', fontFamily: typography.sans, fontSize: 14, lineHeight: 19, fontWeight: '700', textAlign: 'center', textShadowColor: '#000', textShadowRadius: 5 },
  bottom: { paddingHorizontal: 20, paddingBottom: 10, alignItems: 'center' },
  bottomText: { color: 'rgba(255,255,255,0.82)', fontFamily: typography.sans, fontSize: 11.5 },
  permission: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 30, backgroundColor: '#090713' },
  permissionTitle: { marginTop: 15, color: colors.text, fontFamily: typography.serifSemibold, fontSize: 24 },
  permissionText: { marginTop: 7, color: colors.textMuted, fontFamily: typography.sans, fontSize: 13, lineHeight: 19, textAlign: 'center' },
  permissionButton: { marginTop: 20, minHeight: 52, paddingHorizontal: 20, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.goldLight },
  permissionButtonText: { color: '#17111C', fontFamily: typography.sans, fontSize: 13, fontWeight: '800' },
  cancel: { marginTop: 18, color: colors.textMuted, fontFamily: typography.sans, fontSize: 12 },
});
