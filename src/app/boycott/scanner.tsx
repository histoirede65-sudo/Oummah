import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { BackHandler, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BoycottScanResultCard } from '../../components/boycott/BoycottScanResultCard';
import { getBoycottCatalog, lookupBoycottBarcode, type BarcodeLookupResult } from '../../features/boycott/data/BoycottRepository';
import type { BoycottEntity } from '../../features/boycott/domain/BoycottEntity';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';

export default function BoycottScannerScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [catalog, setCatalog] = useState<BoycottEntity[]>([]);
  const [torch, setTorch] = useState(false);
  const [locked, setLocked] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [result, setResult] = useState<BarcodeLookupResult | null>(null);
  const lockRef = useRef(false);
  const candidateRef = useRef<{ code: string; count: number; at: number } | null>(null);

  useEffect(() => {
    void getBoycottCatalog().then(setCatalog);
  }, []);

  function resetScanner() {
    lockRef.current = false;
    candidateRef.current = null;
    setLocked(false);
    setResult(null);
  }

  useEffect(() => {
    if (!result) return undefined;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      resetScanner();
      return true;
    });
    return () => subscription.remove();
  }, [result]);

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

  async function onBarcode(raw: string) {
    if (lockRef.current) return;
    const data = raw.replace(/\D/g, '');
    if (![8, 12, 13].includes(data.length) || !hasValidCheckDigit(data)) return;

    // Deux lectures identiques très rapprochées : quasi instantané pour l'utilisateur,
    // mais évite qu'un reflet ou une lecture partielle transforme un produit en autre marque.
    const now = Date.now();
    const previous = candidateRef.current;
    if (!previous || previous.code !== data || now - previous.at > 900) {
      candidateRef.current = { code: data, count: 1, at: now };
      return;
    }
    candidateRef.current = { code: data, count: previous.count + 1, at: now };
    if (candidateRef.current.count < 2) return;

    lockRef.current = true;
    setLocked(true);
    const lookup = await lookupBoycottBarcode(catalog, data);
    setResult(lookup);
  }


  if (!permission) {
    return <View style={styles.permission}><Text style={styles.permissionText}>Initialisation de la caméra…</Text></View>;
  }

  if (!permission.granted) {
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
    <View style={styles.screen}>
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        mode="picture"
        enableTorch={torch}
        onCameraReady={() => setCameraReady(true)}
        onMountError={() => setCameraReady(false)}
        barcodeScannerSettings={{ barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e'] }}
        onBarcodeScanned={locked ? undefined : ({ data }) => void onBarcode(data)}
      />

      <View pointerEvents="box-none" style={styles.overlay}>
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
            <Text style={styles.hint}>{locked ? 'Vérification instantanée…' : 'Cadrez le code-barres, OUMMAH le détecte automatiquement'}</Text>
          </View>

          <View style={styles.bottom}>
            <Text style={styles.bottomText}>EAN · UPC · double validation instantanée</Text>
          </View>
        </SafeAreaView>
      </View>

      {result ? <BoycottScanResultCard result={result} onClose={resetScanner} onOpenEntity={() => router.push(`/boycott/${result.boycottEntity!.id}`)} onPropose={() => router.replace({ pathname: '/boycott/add', params: { barcode: result.barcode, name: result.productName || '', brand: result.brandLabel || '' } } as never)} /> : null}
      {result && false ? (
        <View style={styles.resultBackdrop}>
          <View style={styles.resultCard}>
            <View style={[styles.statusIcon, result.assessment === 'boycott' ? styles.boycottIcon : result.assessment === 'ok' ? styles.okIcon : styles.unknownIcon]}>
              <Ionicons name={result.assessment === 'boycott' ? 'close' : result.assessment === 'ok' ? 'checkmark' : 'help'} size={30} color="#FFF" />
            </View>
            <Text style={[styles.resultStatus, result.assessment === 'boycott' ? styles.boycottText : result.assessment === 'ok' ? styles.okText : styles.unknownText]}>
              {result.assessment === 'boycott' ? 'À BOYCOTTER' : result.assessment === 'ok' ? 'OK' : 'NON RÉFÉRENCÉ'}
            </Text>
            <Text numberOfLines={2} style={styles.resultName}>{result.productName || result.brandLabel || `Code ${result.barcode}`}</Text>
            {result.brandLabel ? <Text style={styles.resultBrand}>{result.brandLabel}</Text> : null}
            <Text style={styles.resultExplanation}>
              {result.assessment === 'boycott'
                ? `Marque reconnue : ${result.boycottEntity?.name ?? result.brandLabel ?? 'marque référencée'}. Le produit est classé selon la règle OUMMAH. Consultez la fiche pour voir le lien documenté et les sources.`
                : result.assessment === 'ok'
                  ? 'Aucun lien documenté correspondant à la base OUMMAH actuelle n’a été identifié pour ce produit. Il est mémorisé pour accélérer les prochains scans.'
                  : 'Ce code-barres n’a pas pu être identifié. Vous pouvez proposer le produit pour vérification.'}
            </Text>
            {result.assessment === 'boycott' && result.boycottEntity ? (
              <Pressable onPress={() => router.push(`/boycott/${result.boycottEntity!.id}`)} style={styles.boycottAction}>
                <Text style={styles.boycottActionText}>Voir pourquoi {result.boycottEntity.name} est à boycotter</Text>
              </Pressable>
            ) : null}
            <Pressable onPress={resetScanner} style={styles.primaryAction}><Text style={styles.primaryActionText}>Scanner un autre produit</Text></Pressable>
            {result.assessment === 'unknown' ? (
              <Pressable
                onPress={() => router.replace({ pathname: '/boycott/add', params: { barcode: result.barcode, name: result.productName || '', brand: result.brandLabel || '' } } as never)}
                style={styles.secondaryAction}
              >
                <Text style={styles.secondaryActionText}>Proposer ce produit</Text>
              </Pressable>
            ) : null}
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#000' },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.18)' },
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
  resultBackdrop: { ...StyleSheet.absoluteFillObject, padding: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(4,3,9,0.72)' },
  resultCard: { width: '100%', maxWidth: 390, paddingHorizontal: 24, paddingVertical: 28, alignItems: 'center', borderRadius: 30, backgroundColor: '#11101A', borderWidth: 1, borderColor: 'rgba(255,255,255,0.09)' },
  statusIcon: { width: 58, height: 58, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  boycottIcon: { backgroundColor: '#B93642' },
  okIcon: { backgroundColor: '#23885C' },
  unknownIcon: { backgroundColor: '#70687C' },
  resultStatus: { marginTop: 13, fontFamily: typography.sans, fontSize: 14, fontWeight: '900', letterSpacing: 0.8 },
  boycottText: { color: '#FF6875' },
  okText: { color: '#61D49B' },
  unknownText: { color: '#C7BECD' },
  resultName: { marginTop: 7, color: '#FFF', fontFamily: typography.serifSemibold, fontSize: 23, lineHeight: 28, textAlign: 'center' },
  resultBrand: { marginTop: 4, color: '#C8C1CF', fontFamily: typography.sans, fontSize: 12.5, fontWeight: '700', textAlign: 'center' },
  resultExplanation: { marginTop: 15, color: '#AAA2B1', fontFamily: typography.sans, fontSize: 12.5, lineHeight: 19, textAlign: 'center' },
  boycottAction: { marginTop: 20, width: '100%', minHeight: 52, borderRadius: 18, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 14, backgroundColor: '#B93642' },
  boycottActionText: { color: '#FFF', fontFamily: typography.sans, fontSize: 12.5, fontWeight: '900', textAlign: 'center' },
  primaryAction: { marginTop: 12, width: '100%', minHeight: 52, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F0CA70' },
  primaryActionText: { color: '#17111C', fontFamily: typography.sans, fontSize: 13, fontWeight: '900' },
  secondaryAction: { marginTop: 10, width: '100%', minHeight: 48, borderRadius: 17, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.14)' },
  secondaryActionText: { color: '#FFF', fontFamily: typography.sans, fontSize: 12.5, fontWeight: '800' },
});
