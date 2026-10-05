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
import { useI18n, type LanguageCode } from '../../i18n';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';

function formatEventDate(post: MosquePost, language: LanguageCode) {
  if (!post.startsAt) return '';
  const locale = language === 'fr' ? 'fr-FR' : 'en-GB';
  const start = new Date(post.startsAt);
  const day = start.toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long' });
  const time = (date: Date) => date.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
  const end = post.endsAt ? new Date(post.endsAt) : null;
  const sameDay = end && end.toDateString() === start.toDateString();
  return `${day.charAt(0).toUpperCase()}${day.slice(1)} · ${time(start)}${end && sameDay ? ` – ${time(end)}` : ''}`;
}

function PostCard({ post }: { post: MosquePost }) {
  const { language, t } = useI18n();
  const [expanded, setExpanded] = useState(false);
  const isEvent = post.kind === 'event';
  return (
    <Pressable onPress={() => setExpanded((value) => !value)} style={styles.post}>
      <View style={[styles.postIcon, isEvent && styles.postIconEvent]}>
        <Ionicons name={isEvent ? 'calendar-outline' : 'megaphone-outline'} size={18} color={isEvent ? colors.background : colors.goldLight} />
      </View>
      <View style={styles.postCopy}>
        <Text style={styles.postKind}>{isEvent ? t('mosque.event') : t('mosque.announcement')}</Text>
        <Text style={styles.postTitle}>{post.title}</Text>
        {isEvent ? <Text style={styles.postDate}>{formatEventDate(post, language)}</Text> : null}
        {post.body ? (
          <Text style={styles.postBody} numberOfLines={expanded ? undefined : 3}>{post.body}</Text>
        ) : null}
      </View>
    </Pressable>
  );
}

type Props = { mosque: { id: string; name: string } };

export default function MosquePostsSection({ mosque }: Props) {
  const { t } = useI18n();
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
      <Text style={styles.sectionTitle}>{t('mosque.postsTitle')}</Text>
      <View style={styles.card}>
        {posts.length === 0 ? (
          <Text style={styles.empty}>{t('mosque.postsEmpty')}</Text>
        ) : posts.map((post) => <PostCard key={post.id} post={post} />)}
        <Pressable onPress={() => setSheetVisible(true)} style={({ pressed }) => [styles.proposeButton, pressed && styles.pressed]}>
          <Ionicons name="add-circle-outline" size={18} color={colors.goldLight} />
          <Text style={styles.proposeText}>{t('mosque.postsPropose')}</Text>
        </Pressable>
      </View>
      <MosquePostProposalSheet visible={sheetVisible} onClose={() => setSheetVisible(false)} mosque={mosque} />
    </View>
  );
}

function MosquePostProposalSheet({ visible, onClose, mosque }: { visible: boolean; onClose: () => void; mosque: Props['mosque'] }) {
  const { t } = useI18n();
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

  const fail = (message: string) => Alert.alert(t('mosque.checkInputTitle'), message);

  const submit = async () => {
    if (saving) return;
    if (title.trim().length < 3) return fail(t('mosque.postErrorTitle'));
    let startsAt: Date | undefined;
    let endsAt: Date | undefined;
    const day = date.trim() ? parseDate(date) : '';
    if (day === null) return fail(t('mosque.postErrorDate'));
    if (kind === 'event') {
      const start = parseTime(startTime);
      if (!day) return fail(t('mosque.postErrorEventDate'));
      if (!start) return fail(t('mosque.postErrorStart'));
      startsAt = localDateTime(day, start);
      if (startsAt.getTime() < Date.now()) return fail(t('mosque.postErrorPast'));
      const end = parseTime(endTime);
      if (end === null) return fail(t('mosque.postErrorEnd'));
      if (end) {
        endsAt = localDateTime(day, end);
        if (endsAt <= startsAt) return fail(t('mosque.postErrorEndOrder'));
      }
    } else if (day) {
      // Announcement shown until the end of this day.
      endsAt = localDateTime(day, '23:59');
      if (endsAt.getTime() < Date.now()) return fail(t('mosque.postErrorEndPast'));
    }
    setSaving(true);
    try {
      await proposeMosquePost({ mosqueId: mosque.id, mosqueName: mosque.name, kind, title, body, startsAt, endsAt });
      onClose();
      Alert.alert(t('mosque.proposalSentTitle'), t('mosque.postSentText'));
    } catch (error) {
      const code = error instanceof Error ? error.message : '';
      Alert.alert(t('mosque.sendFailedTitle'), code === 'AUTH_REQUIRED'
        ? t('mosque.postAuthRequired')
        : code === 'MOSQUE_POST_LIMIT'
          ? t('mosque.postLimit')
          : t('mosque.sendFailedText'));
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
            <Text style={styles.sheetTitle}>{t('mosque.propose')}</Text>
            <Text style={styles.sheetSubtitle}>{t('mosque.postSheetSubtitle', { mosque: mosque.name })}</Text>

            <View style={styles.kinds}>
              {([['event', t('mosque.event')], ['announcement', t('mosque.announcement')]] as const).map(([value, label]) => (
                <Pressable key={value} onPress={() => setKind(value)} style={[styles.kindChip, kind === value && styles.kindChipActive]}>
                  <Text style={[styles.kindText, kind === value && styles.kindTextActive]}>{label}</Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.label}>{t('mosque.postTitleLabel')}</Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder={kind === 'event' ? t('mosque.postTitleEventPlaceholder') : t('mosque.postTitleAnnouncementPlaceholder')}
              placeholderTextColor="#837789"
              maxLength={120}
              style={styles.input}
            />

            <Text style={styles.label}>{t('mosque.postDetails')}</Text>
            <TextInput
              value={body}
              onChangeText={setBody}
              placeholder={t('mosque.postDetailsPlaceholder')}
              placeholderTextColor="#837789"
              maxLength={1000}
              multiline
              style={[styles.input, styles.bodyInput]}
            />

            {kind === 'event' ? (
              <View style={styles.row}>
                <View style={styles.dateBlock}>
                  <Text style={styles.label}>{t('mosque.date')}</Text>
                  <TextInput {...numericProps} placeholder={t('mosque.datePlaceholder')} maxLength={10} value={date} onChangeText={(value) => setDate(formatDateInput(value))} style={styles.input} />
                </View>
                <View style={styles.timeBlock}>
                  <Text style={styles.label}>{t('mosque.start')}</Text>
                  <TextInput {...numericProps} placeholder="00H00" maxLength={5} value={startTime} onChangeText={(value) => setStartTime(formatTimeInput(value))} style={styles.input} />
                </View>
                <View style={styles.timeBlock}>
                  <Text style={styles.label}>{t('mosque.end')}</Text>
                  <TextInput {...numericProps} placeholder="—" maxLength={5} value={endTime} onChangeText={(value) => setEndTime(formatTimeInput(value))} style={styles.input} />
                </View>
              </View>
            ) : (
              <>
                <Text style={styles.label}>{t('mosque.showUntil')}</Text>
                <TextInput {...numericProps} placeholder={t('mosque.datePlaceholder')} maxLength={10} value={date} onChangeText={(value) => setDate(formatDateInput(value))} style={styles.input} />
              </>
            )}

            <View style={styles.actions}>
              <Pressable onPress={onClose} style={styles.cancel}><Text style={styles.cancelText}>{t('mosques.cancel')}</Text></Pressable>
              <Pressable disabled={saving} onPress={() => void submit()} style={styles.submit}>
                <Text style={styles.submitText}>{saving ? t('mosque.sending') : t('mosque.send')}</Text>
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
