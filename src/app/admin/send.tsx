import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { Alert, Pressable, StyleSheet, Switch, Text, TextInput, View } from "react-native";

import { ActionButton, AdminScreen, adminStyles, Card, SectionTitle, useAdminToast } from "../../components/admin/AdminUI";
import { adminFunction } from "../../features/admin/adminClient";
import { archiveAdminAnnouncement, getAdminAnnouncements, saveAdminAnnouncement, type AdminAnnouncementAudience, type AdminAnnouncementRow } from "../../features/admin/AdminService";
import { deleteOummahMessage, listOummahMessages, sendOummahMessage, type SentOummahMessage } from "../../features/admin/oummahMessages";
import { colors } from "../../theme/colors";
import { typography } from "../../theme/typography";

const AUDIENCES: { value: AdminAnnouncementAudience; label: string }[] = [
  { value: "all", label: "Tout le monde" },
  { value: "free", label: "Gratuits" },
  { value: "premium", label: "Premium" },
];

/** Where a tap on the message leads. Plain names, no route to type by hand. */
const DESTINATIONS = [
  { route: "/", label: "Accueil" },
  { route: "/quran", label: "Coran" },
  { route: "/hadith", label: "Hadiths" },
  { route: "/mosques", label: "Mosquées" },
  { route: "/halal", label: "Halal" },
  { route: "/tahajjud", label: "Qiyam al-Layl" },
  { route: "/dua", label: "Invocations" },
  { route: "/premium", label: "Premium" },
];

const DURATIONS = [1, 3, 7, 30];

const audienceLabel = (value: AdminAnnouncementAudience) => AUDIENCES.find((item) => item.value === value)?.label ?? value;

export default function AdminSend() {
  return (
    <AdminScreen title="Envoyer">
      <SendForm />
    </AdminScreen>
  );
}

function SendForm() {
  const toast = useAdminToast();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [audience, setAudience] = useState<AdminAnnouncementAudience>("all");
  const [route, setRoute] = useState("/");
  const [push, setPush] = useState(true);
  const [announce, setAnnounce] = useState(false);
  const [message, setMessage] = useState(false);
  const [days, setDays] = useState(7);
  const [announcements, setAnnouncements] = useState<AdminAnnouncementRow[]>([]);
  const [messages, setMessages] = useState<SentOummahMessage[]>([]);

  const loadAnnouncements = useCallback(async () => {
    try {
      setAnnouncements((await getAdminAnnouncements()).filter((row) => row.status !== "archived"));
    } catch (error) {
      toast(error instanceof Error ? error.message : "Annonces non chargées.", "error");
    }
  }, [toast]);

  const loadMessages = useCallback(async () => {
    try {
      setMessages(await listOummahMessages());
    } catch (error) {
      toast(error instanceof Error ? error.message : "Messages non chargés.", "error");
    }
  }, [toast]);

  useFocusEffect(useCallback(() => {
    void loadAnnouncements();
    void loadMessages();
  }, [loadAnnouncements, loadMessages]));

  const ready = title.trim().length >= 3 && body.trim().length >= 5 && (push || announce || message);

  const send = async () => {
    const cleanTitle = title.trim();
    const cleanBody = body.trim();
    const confirmed = await new Promise<boolean>((resolve) => {
      Alert.alert(
        "Confirmer l’envoi",
        `${[push ? "Notification" : null, announce ? `Annonce (${days} j)` : null, message ? "Messagerie (tous les membres)" : null].filter(Boolean).join(" + ")} · ${audienceLabel(audience)}\n\n${cleanTitle}`,
        [
          { text: "Annuler", style: "cancel", onPress: () => resolve(false) },
          { text: "Envoyer", onPress: () => resolve(true) },
        ],
        { cancelable: true, onDismiss: () => resolve(false) },
      );
    });
    if (!confirmed) return;

    const results: string[] = [];
    if (announce) {
      const start = new Date();
      const end = new Date(start.getTime() + days * 86_400_000);
      await saveAdminAnnouncement({
        title: cleanTitle,
        body: cleanBody,
        audience,
        status: "published",
        actionLabel: route !== "/" ? "Ouvrir" : null,
        actionRoute: route !== "/" ? route : null,
        startsAt: start.toISOString(),
        endsAt: end.toISOString(),
        showOnHome: true,
        showInNotifications: true,
      });
      results.push("annonce publiée");
    }
    if (message) {
      // With the notification on, it is sent once and opens the OUMMAH conversation.
      const sent = await sendOummahMessage(`${cleanTitle}\n\n${cleanBody}`, null, push);
      results.push(push ? `message envoyé, notification sur ${sent.devices} appareil${sent.devices > 1 ? "s" : ""}` : "message envoyé dans la messagerie");
    } else if (push) {
      const result = await adminFunction<{ sent?: number } | null>("send-admin-push", { title: cleanTitle, body: cleanBody, audience, route });
      results.push(`notification envoyée à ${result?.sent ?? 0} appareil${(result?.sent ?? 0) > 1 ? "s" : ""}`);
    }
    setTitle("");
    setBody("");
    toast(results.join(" · ").replace(/^./, (letter) => letter.toUpperCase()));
    if (announce) void loadAnnouncements();
    if (message) void loadMessages();
  };

  return (
    <>
      <Card>
        <Text style={adminStyles.label}>Titre</Text>
        <TextInput value={title} onChangeText={setTitle} maxLength={80} placeholder="Ex. Ramadan Moubarak" placeholderTextColor={colors.textMuted} style={adminStyles.input} />
        <Text style={adminStyles.label}>Message</Text>
        <TextInput value={body} onChangeText={setBody} maxLength={500} multiline placeholder="Votre message…" placeholderTextColor={colors.textMuted} style={[adminStyles.input, styles.area]} />

        <Text style={adminStyles.label}>Pour qui</Text>
        <Chips items={AUDIENCES.map((item) => ({ key: item.value, label: item.label }))} value={audience} onChange={(value) => setAudience(value as AdminAnnouncementAudience)} />

        <Text style={adminStyles.label}>En touchant le message, ouvrir</Text>
        <Chips items={DESTINATIONS.map((item) => ({ key: item.route, label: item.label }))} value={route} onChange={setRoute} />

        <View style={styles.switchRow}>
          <View style={styles.switchCopy}>
            <Text style={adminStyles.rowTitle}>Notification sur le téléphone</Text>
            <Text style={adminStyles.meta}>Arrive tout de suite, même app fermée.</Text>
          </View>
          <Switch value={push} onValueChange={setPush} trackColor={{ true: colors.goldDark, false: "rgba(255,255,255,0.16)" }} thumbColor={push ? colors.goldLight : "#CFC6D6"} />
        </View>
        <View style={styles.switchRow}>
          <View style={styles.switchCopy}>
            <Text style={adminStyles.rowTitle}>Annonce dans l’app</Text>
            <Text style={adminStyles.meta}>Visible sur l’accueil et dans la cloche.</Text>
          </View>
          <Switch value={announce} onValueChange={setAnnounce} trackColor={{ true: colors.goldDark, false: "rgba(255,255,255,0.16)" }} thumbColor={announce ? colors.goldLight : "#CFC6D6"} />
        </View>
        <View style={styles.switchRow}>
          <View style={styles.switchCopy}>
            <Text style={adminStyles.rowTitle}>Message dans la messagerie</Text>
            <Text style={adminStyles.meta}>Signé « OUMMAH », reçu par tous les membres dans Qiyam al-Layl › Amis. Ils ne peuvent pas répondre.</Text>
          </View>
          <Switch value={message} onValueChange={setMessage} trackColor={{ true: colors.goldDark, false: "rgba(255,255,255,0.16)" }} thumbColor={message ? colors.goldLight : "#CFC6D6"} />
        </View>
        {announce ? (
          <>
            <Text style={adminStyles.label}>Visible pendant</Text>
            <Chips items={DURATIONS.map((value) => ({ key: String(value), label: `${value} jour${value > 1 ? "s" : ""}` }))} value={String(days)} onChange={(value) => setDays(Number(value))} />
          </>
        ) : null}

        <View style={adminStyles.actions}>
          <ActionButton label="Envoyer" icon="paper-plane" disabled={!ready} onPress={send} />
        </View>
      </Card>

      <SectionTitle>Annonces en cours</SectionTitle>
      {announcements.length === 0 ? <Text style={adminStyles.meta}>Aucune annonce publiée.</Text> : null}
      {announcements.map((row) => (
        <Card key={row.id}>
          <Text style={adminStyles.tag}>{row.status === "published" ? "Publiée" : "Brouillon"} · {audienceLabel(row.audience)}</Text>
          <Text style={adminStyles.rowTitle}>{row.title}</Text>
          <Text style={adminStyles.rowText} numberOfLines={3}>{row.body}</Text>
          {row.endsAt ? <Text style={adminStyles.meta}>Jusqu’au {new Date(row.endsAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}</Text> : null}
          <View style={adminStyles.actions}>
            <ActionButton label="Retirer l’annonce" tone="danger" icon="archive-outline" done="Annonce retirée" onPress={async () => {
              await archiveAdminAnnouncement(row.id);
              setAnnouncements((current) => current.filter((item) => item.id !== row.id));
            }} />
          </View>
        </Card>
      ))}

      <SectionTitle>Messages OUMMAH envoyés</SectionTitle>
      {messages.length === 0 ? <Text style={adminStyles.meta}>Aucun message envoyé.</Text> : null}
      {messages.map((row) => (
        <Card key={row.id}>
          <Text style={adminStyles.tag}>{row.recipient ? `À ${row.recipientName ?? "un membre"}` : "À tous les membres"} · {new Date(row.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}</Text>
          <Text style={adminStyles.rowText} numberOfLines={4}>{row.body}</Text>
          <View style={adminStyles.actions}>
            <ActionButton label="Supprimer le message" tone="danger" icon="trash-outline" done="Message supprimé" onPress={async () => {
              await deleteOummahMessage(row.id);
              setMessages((current) => current.filter((item) => item.id !== row.id));
            }} />
          </View>
        </Card>
      ))}
    </>
  );
}

function Chips({ items, value, onChange }: { items: { key: string; label: string }[]; value: string; onChange: (value: string) => void }) {
  return (
    <View style={styles.chips}>
      {items.map((item) => (
        <Pressable key={item.key} onPress={() => onChange(item.key)} style={[styles.chip, value === item.key && styles.chipOn]} accessibilityRole="button" accessibilityState={{ selected: value === item.key }}>
          <Text style={[styles.chipText, value === item.key && styles.chipTextOn]}>{item.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  area: { minHeight: 110, paddingTop: 12, textAlignVertical: "top" },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { minHeight: 38, paddingHorizontal: 13, borderRadius: 19, borderWidth: 1, borderColor: colors.borderSoft, justifyContent: "center" },
  chipOn: { backgroundColor: colors.goldLight, borderColor: colors.goldLight },
  chipText: { color: colors.textSecondary, fontFamily: typography.sans, fontSize: 14, fontWeight: "700" },
  chipTextOn: { color: colors.background },
  switchRow: { marginTop: 14, flexDirection: "row", alignItems: "center", gap: 12 },
  switchCopy: { flex: 1 },
});
