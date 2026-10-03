import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  getMosquePosts,
  proposeMosquePost,
  type MosquePost,
  type MosquePostKind,
} from '../../features/mosques/data/mosquePosts';
import { formatDateInput, formatTimeInput, localDateTime, parseDate, parseTime } from '../../features/mosques/timeInput';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';

function formatEventDate(post: MosquePost) {
  if (!post.startsAt) return '';
  const start = new Date(post.startsAt);
  const day = start.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
  const time = (date: Date) => date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  const end = post.endsAt ? new Date(post.endsAt) : null;
  const sameDay = end && end.toDateString() === start.toDateString();
  return `${day.charAt(0).toUpperCase()}${day.slice(1)} · ${time(start)}${end && sameDay ? ` – ${time(end)}` : ''}`;
}

function PostCard({ post }: { post: MosquePost }) {
  const [expanded, setExpanded] = useState(false);
  const isEvent = post.kind === 'event';
  return (
    <Pressable onPress={() => setExpanded((value) => !value)} style={styles.post}>
      <View style={[styles.postIcon, isEvent && styles.postIconEvent]}>
        <Ionicons name={isEvent ? 'calendar-outline' : 'megaphone-outline'} size={18} color={isEvent ? colors.background : colors.goldLight} />
      </View>
      <View style={styles.postCopy}>
        <Text style={styles.postKind}>{isEvent ? 'Événement' : 'Annonce'}</Text>
        <Text style={styles.postTitle}>{post.title}</Text>
        {isEvent ? <Text style={styles.postDate}>{formatEventDate(post)}</Text> : null}
        {post.body ? (
          <Text style={styles.postBody} numberOfLines={expanded ? undefined : 3}>{post.body}</Text>
        ) : null}
      </View>
    </Pressable>
  );
}

type Props = { mosque: { id: string; name: string } };

export default function MosquePostsSection({ mosque }: Props) {
  const [posts, setPosts] = useState<MosquePost[]>([]);
  const [sheetVisible, setSheetVisible] = useState(false);

  const load = useCallback(async () => {
    setPosts(await getMosquePosts(mosque.id));
  }, [mosque.id]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Annonces et événements</Text>
      <View style={styles.card}>
        {posts.length === 0 ? (
          <Text style={styles.empty}>Aucune annonce ni événement pour le moment.</Text>
        ) : posts.map((post) => <PostCard key={post.id} post={post} />)}
        <Pressable onPress={() => setSheetVisible(true)} style={({ pressed }) => [styles.proposeButton, pressed && styles.pressed]}>
          <Ionicons name="add-circle-outline" size={18} color={colors.goldLight} />
          <Text style={styles.proposeText}>Proposer une annonce ou un événement</Text>
        </Pressable>
      </View>
      <MosquePostProposalSheet visible={sheetVisible} onClose={() => setSheetVisible(false)} mosque={mosque} />
    </View>
  );
}

function MosquePostProposalSheet({ visible, onClose, mosque }: { visible: boolean; onClose: () => void; mosque: Props['mosque'] }) {
  const [kind, setKind] = useState<MosquePostKind>('event');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setKind('event');
    setTitle('');
    setBody('');
    setDate('');
    setStartTime('');
    setEndTime('');
  }, [visible]);

  const fail = (message: string) => Alert.alert('Vérifiez la saisie', message);

  const submit = async () => {
    if (saving) return;
    if (title.trim().length < 3) return fail('Donnez un titre (3 caractères au moins).');
    let startsAt: Date | undefined;
    let endsAt: Date | undefined;
    const day = date.trim() ? parseDate(date) : '';
    if (day === null) return fail('La date n’est pas valide (exemple : 18/10/2026).');
    if (kind === 'event') {
      const start = parseTime(startTime);
      if (!day) return fail('Indiquez la date de l’événement.');
      if (!start) return fail('Indiquez l’heure de début (exemple : 19H30).');
      startsAt = localDateTime(day, start);
      if (startsAt.getTime() < Date.now()) return fail('L’événement doit être à venir.');
      const end = parseTime(endTime);
      if (end === null) return fail('L’heure de fin n’est pas valide (exemple : 21H00).');
      if (end) {
        endsAt = localDateTime(day, end);
        if (endsAt <= startsAt) return fail('L’heure de fin doit suivre l’heure de début.');
      }
    } else if (day) {
      // Announcement shown until the end of this day.
      endsAt = localDateTime(day, '23:59');
      if (endsAt.getTime() < Date.now()) return fail('La date de fin doit être à venir.');
    }
    setSaving(true);
    try {
      await proposeMosquePost({ mosqueId: mosque.id, mosqueName: mosque.name, kind, title, body, startsAt, endsAt });
      onClose();
      Alert.alert('Proposition envoyée', 'Elle sera affichée après validation par un administrateur.');
    } catch (error) {
      const code = error instanceof Error ? error.message : '';
      Alert.alert('Envoi impossible', code === 'AUTH_REQUIRED'
        ? 'Connectez-vous pour proposer une annonce.'
        : code === 'MOSQUE_POST_LIMIT'
          ? 'Vous avez déjà envoyé 5 propositions aujourd’hui. Réessayez demain.'
          : 'Impossible d’envoyer la proposition.');
    } finally {
      setSaving(false);
    }
  };

  const numericProps = { placeholderTextColor: '#837789', keyboardType: 'number-pad' as const, inputMode: 'numeric' as const, returnKeyType: 'done' as const };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.backdrop}>
        <ScrollView bounces={false} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.scrollContent}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>Proposer</Text>
            <Text style={styles.sheetSubtitle}>{mosque.name} · affiché après validation par un administrateur.</Text>

            <View style={styles.kinds}>
              {([['event', 'Événement'], ['announcement', 'Annonce']] as const).map(([value, label]) => (
                <Pressable key={value} onPress={() => setKind(value)} style={[styles.kindChip, kind === value && styles.kindChipActive]}>
                  <Text style={[styles.kindText, kind === value && styles.kindTextActive]}>{label}</Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.label}>Titre</Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder={kind === 'event' ? 'Conférence, cours, iftar collectif…' : 'Collecte, travaux, fermeture…'}
              placeholderTextColor="#837789"
              maxLength={120}
              style={styles.input}
            />

            <Text style={styles.label}>Détails (facultatif)</Text>
            <TextInput
              value={body}
              onChangeText={setBody}
              placeholder="Intervenant, public, lieu dans la mosquée…"
              placeholderTextColor="#837789"
              maxLength={1000}
              multiline
              style={[styles.input, styles.bodyInput]}
            />

            {kind === 'event' ? (
              <View style={styles.row}>
                <View style={styles.dateBlock}>
                  <Text style={styles.label}>Date</Text>
                  <TextInput {...numericProps} placeholder="JJ/MM/AAAA" maxLength={10} value={date} onChangeText={(value) => setDate(formatDateInput(value))} style={styles.input} />
                </View>
                <View style={styles.timeBlock}>
                  <Text style={styles.label}>Début</Text>
                  <TextInput {...numericProps} placeholder="00H00" maxLength={5} value={startTime} onChangeText={(value) => setStartTime(formatTimeInput(value))} style={styles.input} />
                </View>
                <View style={styles.timeBlock}>
                  <Text style={styles.label}>Fin</Text>
                  <TextInput {...numericProps} placeholder="—" maxLength={5} value={endTime} onChangeText={(value) => setEndTime(formatTimeInput(value))} style={styles.input} />
                </View>
              </View>
            ) : (
              <>
                <Text style={styles.label}>Afficher jusqu’au (facultatif, sinon 30 jours)</Text>
                <TextInput {...numericProps} placeholder="JJ/MM/AAAA" maxLength={10} value={date} onChangeText={(value) => setDate(formatDateInput(value))} style={styles.input} />
              </>
            )}

            <View style={styles.actions}>
              <Pressable onPress={onClose} style={styles.cancel}><Text style={styles.cancelText}>Annuler</Text></Pressable>
              <Pressable disabled={saving} onPress={() => void submit()} style={styles.submit}>
                <Text style={styles.submitText}>{saving ? 'Envoi…' : 'Envoyer'}</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  section: { marginTop: 24 },
  sectionTitle: { marginBottom: 11, color: colors.goldLight, fontFamily: typography.serifMedium, fontSize: 24 },
  card: { backgroundColor: '#18131F', borderRadius: 22, borderWidth: 1, borderColor: 'rgba(242,181,61,0.18)', padding: 16, gap: 12 },
  empty: { color: colors.textMuted, fontFamily: typography.sans, fontSize: 14 },
  post: { flexDirection: 'row', gap: 12, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.07)' },
  postIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(242,181,61,0.14)', alignItems: 'center', justifyContent: 'center' },
  postIconEvent: { backgroundColor: colors.goldLight },
  postCopy: { flex: 1 },
  postKind: { color: colors.textMuted, fontFamily: typography.sansBold, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.6 },
  postTitle: { marginTop: 2, color: colors.text, fontFamily: typography.sansBold, fontSize: 16 },
  postDate: { marginTop: 3, color: colors.goldLight, fontFamily: typography.sansMedium, fontSize: 13 },
  postBody: { marginTop: 5, color: colors.textSecondary, fontFamily: typography.sans, fontSize: 13, lineHeight: 19 },
  proposeButton: { minHeight: 44, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(242,181,61,0.35)', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 12 },
  proposeText: { color: colors.goldLight, fontFamily: typography.sansBold, fontSize: 13 },
  pressed: { opacity: 0.72 },
  backdrop: { flex: 1, backgroundColor: 'rgba(7,5,11,0.72)' },
  scrollContent: { flexGrow: 1, justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#18131F', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 22, paddingBottom: 32 },
  sheetTitle: { color: colors.goldLight, fontFamily: typography.serifMedium, fontSize: 24 },
  sheetSubtitle: { marginTop: 6, color: colors.textMuted, fontFamily: typography.sans, fontSize: 13, lineHeight: 18 },
  kinds: { flexDirection: 'row', gap: 8, marginTop: 14 },
  kindChip: { minHeight: 36, paddingHorizontal: 14, borderRadius: 18, borderWidth: 1, borderColor: 'rgba(242,181,61,0.24)', justifyContent: 'center' },
  kindChipActive: { backgroundColor: colors.goldLight, borderColor: colors.goldLight },
  kindText: { color: colors.text, fontFamily: typography.sansMedium, fontSize: 13 },
  kindTextActive: { color: colors.background, fontFamily: typography.sansBold },
  label: { marginTop: 12, marginBottom: 5, color: colors.text, fontFamily: typography.sansMedium, fontSize: 13 },
  input: { minHeight: 45, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(242,181,61,0.24)', backgroundColor: '#100C16', paddingHorizontal: 12, color: colors.text, fontFamily: typography.sans, fontSize: 15 },
  bodyInput: { minHeight: 90, paddingTop: 10, textAlignVertical: 'top' },
  row: { flexDirection: 'row', gap: 8 },
  dateBlock: { flex: 1.4 },
  timeBlock: { flex: 1 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 18 },
  cancel: { flex: 1, minHeight: 48, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  cancelText: { color: colors.text, fontFamily: typography.sansBold },
  submit: { flex: 1, minHeight: 48, borderRadius: 14, backgroundColor: colors.goldLight, alignItems: 'center', justifyContent: 'center' },
  submitText: { color: colors.background, fontFamily: typography.sansBold },
});
