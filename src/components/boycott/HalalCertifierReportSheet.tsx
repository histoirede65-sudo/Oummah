import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { getHalalCertifier } from '../../features/boycott/halalCertifierRepository';
import { certifierReportErrorMessage, submitCertifierReport } from '../../features/boycott/halalCertifierReports';
import { translate } from '../../i18n';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';

/** Bodies whose logo is most often seen in France, in the order shoppers meet them. */
const COMMON = ['avs', 'argml', 'achahada', 'sfcvh', 'grande-mosquee-de-paris', 'mosquee-evry', 'halal-services', 'hqc-france'];
const OTHER = 'other';

type Photo = { uri: string; mimeType?: string | null };

export function HalalCertifierReportSheet({ visible, barcode, productName, onClose }: { visible: boolean; barcode: string; productName?: string; onClose: () => void }) {
  const [choice, setChoice] = useState<string | null>(null);
  const [other, setOther] = useState('');
  const [photo, setPhoto] = useState<Photo | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const close = () => {
    onClose();
    setChoice(null); setOther(''); setPhoto(null); setError(''); setSent(false);
  };

  const pick = async (camera: boolean) => {
    setError('');
    const permission = camera ? await ImagePicker.requestCameraPermissionsAsync() : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError(camera ? translate("certReport.cameraDenied") : translate("certReport.photosDenied"));
      return;
    }
    const options: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], quality: 0.6, allowsEditing: false };
    const result = camera ? await ImagePicker.launchCameraAsync(options) : await ImagePicker.launchImageLibraryAsync(options);
    const asset = result.canceled ? null : result.assets[0];
    if (asset) setPhoto({ uri: asset.uri, mimeType: asset.mimeType });
  };

  const ready = Boolean(photo) && (choice === OTHER ? other.trim().length >= 2 : Boolean(choice));

  const send = async () => {
    if (!ready || !photo || sending) return;
    setSending(true);
    setError('');
    try {
      await submitCertifierReport({ barcode, productName, certifierId: choice === OTHER ? null : choice, other: choice === OTHER ? other.trim() : undefined, photo });
      setSent(true);
    } catch (reason) {
      setError(certifierReportErrorMessage(reason));
    } finally {
      setSending(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={close}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={close} accessibilityLabel={translate("common.close")} />
        <View style={styles.sheet}>
          {sent ? (
            <View style={styles.done}>
              <Ionicons name="checkmark-circle" size={52} color={colors.success} />
              <Text style={styles.title}>{translate("certReport.thanks")}</Text>
              <Text style={styles.text}>{translate("certReport.thanksText")}</Text>
              <Pressable onPress={close} style={styles.primary}><Text style={styles.primaryText}>{translate("common.close")}</Text></Pressable>
            </View>
          ) : (
            <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
              <Text style={styles.title}>{translate("scan.reportCertifier")}</Text>
              <Text style={styles.text}>{translate("certReport.whichLogo")}</Text>

              <View style={styles.chips}>
                {COMMON.map((id) => {
                  const body = getHalalCertifier(id);
                  if (!body) return null;
                  const on = choice === id;
                  return (
                    <Pressable key={id} onPress={() => setChoice(id)} style={[styles.chip, on && styles.chipOn]} accessibilityRole="button" accessibilityState={{ selected: on }}>
                      <Text style={[styles.chipText, on && styles.chipTextOn]}>{body.name}</Text>
                    </Pressable>
                  );
                })}
                <Pressable onPress={() => setChoice(OTHER)} style={[styles.chip, choice === OTHER && styles.chipOn]} accessibilityRole="button" accessibilityState={{ selected: choice === OTHER }}>
                  <Text style={[styles.chipText, choice === OTHER && styles.chipTextOn]}>{translate("common.other")}</Text>
                </Pressable>
              </View>
              {choice === OTHER ? (
                <TextInput value={other} onChangeText={setOther} maxLength={80} placeholder={translate("certReport.otherPlaceholder")} placeholderTextColor={colors.textMuted} style={styles.input} />
              ) : null}

              <Text style={[styles.text, styles.spaced]}>{translate("certReport.photoTitle")}</Text>
              <Text style={styles.note}>{translate("certReport.photoNote")}</Text>
              {photo ? (
                <View style={styles.preview}>
                  <Image source={{ uri: photo.uri }} style={styles.previewImage} contentFit="cover" />
                  <Pressable onPress={() => setPhoto(null)} style={styles.retake}><Text style={styles.retakeText}>{translate("certReport.changePhoto")}</Text></Pressable>
                </View>
              ) : (
                <View style={styles.photoRow}>
                  <Pressable onPress={() => void pick(true)} style={styles.photoButton}>
                    <Ionicons name="camera-outline" size={22} color={colors.goldLight} />
                    <Text style={styles.photoText}>{translate("certReport.takePhoto")}</Text>
                  </Pressable>
                  <Pressable onPress={() => void pick(false)} style={styles.photoButton}>
                    <Ionicons name="images-outline" size={22} color={colors.goldLight} />
                    <Text style={styles.photoText}>{translate("certReport.choosePhoto")}</Text>
                  </Pressable>
                </View>
              )}

              {error ? <Text style={styles.error}>{error}</Text> : null}
              <Pressable disabled={!ready || sending} onPress={() => void send()} style={[styles.primary, (!ready || sending) && styles.disabled]}>
                {sending ? <ActivityIndicator color={colors.background} /> : <Text style={styles.primaryText}>{translate("common.send")}</Text>}
              </Pressable>
              <Pressable onPress={close} style={styles.cancel}><Text style={styles.cancelText}>{translate("common.cancel")}</Text></Pressable>
            </ScrollView>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(4,3,9,0.7)' },
  sheet: { maxHeight: '90%', borderTopLeftRadius: 28, borderTopRightRadius: 28, backgroundColor: colors.backgroundSecondary, borderWidth: 1, borderBottomWidth: 0, borderColor: colors.borderSoft },
  content: { padding: 22, paddingBottom: 36 },
  done: { padding: 26, paddingBottom: 40, alignItems: 'center', gap: 12 },
  title: { color: colors.text, fontFamily: typography.sans, fontSize: 22, fontWeight: '800' },
  text: { marginTop: 6, color: colors.textSecondary, fontFamily: typography.sans, fontSize: 15.5, lineHeight: 22 },
  spaced: { marginTop: 22, color: colors.text, fontWeight: '700' },
  note: { marginTop: 2, color: colors.textMuted, fontFamily: typography.sans, fontSize: 13, lineHeight: 18 },
  chips: { marginTop: 14, flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { minHeight: 40, paddingHorizontal: 14, borderRadius: 20, borderWidth: 1, borderColor: colors.borderSoft, justifyContent: 'center' },
  chipOn: { backgroundColor: colors.goldLight, borderColor: colors.goldLight },
  chipText: { color: colors.textSecondary, fontFamily: typography.sans, fontSize: 14.5, fontWeight: '700' },
  chipTextOn: { color: colors.background },
  input: { marginTop: 10, minHeight: 48, borderRadius: 14, paddingHorizontal: 14, borderWidth: 1, borderColor: colors.borderSoft, color: colors.text, fontFamily: typography.sans, fontSize: 16 },
  photoRow: { marginTop: 12, flexDirection: 'row', gap: 10 },
  photoButton: { flex: 1, minHeight: 84, borderRadius: 18, borderWidth: 1, borderColor: 'rgba(227,181,90,0.4)', borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', gap: 6 },
  photoText: { color: colors.text, fontFamily: typography.sans, fontSize: 14, fontWeight: '700' },
  preview: { marginTop: 12, alignItems: 'center', gap: 8 },
  previewImage: { width: '100%', aspectRatio: 4 / 3, borderRadius: 16 },
  retake: { paddingVertical: 6 },
  retakeText: { color: colors.goldLight, fontFamily: typography.sans, fontSize: 14, fontWeight: '800' },
  error: { marginTop: 14, color: colors.danger, fontFamily: typography.sans, fontSize: 14, lineHeight: 19 },
  primary: { marginTop: 20, alignSelf: 'stretch', minHeight: 54, borderRadius: 27, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.goldLight },
  primaryText: { color: colors.background, fontFamily: typography.sans, fontSize: 17, fontWeight: '800' },
  disabled: { opacity: 0.45 },
  cancel: { alignSelf: 'center', paddingVertical: 12 },
  cancelText: { color: colors.textMuted, fontFamily: typography.sans, fontSize: 15, fontWeight: '700' },
});
