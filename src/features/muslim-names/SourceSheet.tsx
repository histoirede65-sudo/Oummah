import { Ionicons } from '@expo/vector-icons';
import { Alert, Linking, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { NAME_SOURCES, type NameSourceId, type NameTextSource } from './scholar-sources';
import { prenomTheme } from './ui';

/** Full text of one source: Arabic excerpt when it is a fatwa, French text, link to the page. */
export function SourceSheet({ id, onClose }: { id: NameSourceId | null; onClose: () => void }) {
  const item: NameTextSource | null = id ? NAME_SOURCES[id] : null;
  const arabic = item?.arabic;
  const openUrl = () => {
    if (!item) return;
    Linking.openURL(item.url).catch(() => Alert.alert('Source indisponible', 'Impossible d’ouvrir cette source pour le moment.'));
  };
  return <Modal visible={Boolean(item)} transparent animationType="slide" onRequestClose={onClose}>
    <Pressable style={s.backdrop} onPress={onClose} accessibilityLabel="Fermer"/>
    {item ? <View style={s.sheet}>
      <View style={s.handle}/>
      <ScrollView contentContainerStyle={s.content}>
        <Text style={s.author}>{item.author}</Text>
        <Text style={s.ref}>{item.reference}</Text>
        {arabic ? <Text style={s.arabic}>{arabic}</Text> : null}
        <Text style={s.french}>{item.french}</Text>
        {arabic ? <Text style={s.note}>Traduction littérale de l’extrait arabe ci-dessus.</Text> : null}
        <Pressable onPress={openUrl} style={({ pressed }) => [s.button, pressed && s.pressed]}><Text style={s.buttonText}>Ouvrir la source</Text><Ionicons name="open-outline" size={15} color={colors.background}/></Pressable>
      </ScrollView>
    </View> : null}
  </Modal>;
}

export function SourceChips({ ids, onOpen }: { ids: NameSourceId[]; onOpen: (id: NameSourceId) => void }) {
  return <View style={s.chips}>{ids.map((id) => <Pressable key={id} onPress={() => onOpen(id)} style={({ pressed }) => [s.chip, pressed && s.pressed]}><Text style={s.chipText}>{NAME_SOURCES[id].short}</Text></Pressable>)}</View>;
}

const s = StyleSheet.create({
  pressed: { opacity: .72 },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,.55)' },
  sheet: { maxHeight: '78%', borderTopLeftRadius: 26, borderTopRightRadius: 26, borderWidth: 1, borderColor: colors.borderSoft, backgroundColor: colors.backgroundSecondary },
  handle: { alignSelf: 'center', marginTop: 10, width: 40, height: 4, borderRadius: 2, backgroundColor: colors.borderSoft },
  content: { padding: 20, paddingBottom: 38 },
  author: { color: colors.goldLight, fontFamily: typography.sans, fontSize: 10, fontWeight: '900', letterSpacing: 1.2, textTransform: 'uppercase' },
  ref: { marginTop: 4, color: colors.text, fontFamily: typography.sans, fontSize: 14, fontWeight: '800', lineHeight: 20 },
  arabic: { marginTop: 16, color: colors.text, fontFamily: typography.arabic, fontSize: 19, lineHeight: 34, textAlign: 'right', writingDirection: 'rtl' },
  french: { marginTop: 14, color: colors.textSecondary, fontFamily: typography.sans, fontSize: 13, lineHeight: 20 },
  note: { marginTop: 8, color: colors.textMuted, fontFamily: typography.sans, fontSize: 10, lineHeight: 15 },
  button: { marginTop: 18, minHeight: 46, borderRadius: 15, backgroundColor: colors.goldLight, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  buttonText: { color: colors.background, fontFamily: typography.sans, fontSize: 12.5, fontWeight: '900' },
  chips: { marginTop: 9, flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { paddingHorizontal: 9, paddingVertical: 5, borderRadius: 999, borderWidth: 1, borderColor: prenomTheme.borderGold, backgroundColor: prenomTheme.goldWash },
  chipText: { color: colors.goldLight, fontFamily: typography.sans, fontSize: 9.5, fontWeight: '800' },
});
