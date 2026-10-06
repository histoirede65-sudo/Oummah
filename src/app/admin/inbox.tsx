import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect, type Href } from "expo-router";
import { useCallback, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { ActionButton, AdminScreen, adminStyles, Card, EmptyState, ErrorState, Loading, SectionTitle } from "../../components/admin/AdminUI";
import { Image } from "expo-image";
import { adminRpc } from "../../features/admin/adminClient";
import { reviewCertifierReport, type CertifierReport } from "../../features/admin/halalCertifierAdmin";
import { getHalalCertificationBodies, getHalalCertifier } from "../../features/boycott/halalCertifierRepository";
import { useHalalCertificationBodies } from "../../features/boycott/halalCertificationBodiesLoader";
import { inboxTotal, loadInbox, type Inbox } from "../../features/admin/adminInbox";
import { adminReviewMosquePost } from "../../features/mosques/data/mosquePosts";
import { adminReviewMosquePrayerTimeUpdate, type MosquePrayerTimeProposal } from "../../features/mosques/data/mosquePrayerUpdates";
import { adminReviewWall } from "../../features/tahajjud/duaWall";
import { colors } from "../../theme/colors";
import { typography } from "../../theme/typography";

const REPORT_LABELS: Record<string, string> = {
  wrong_address: "Mauvaise adresse", wrong_hours: "Horaires incorrects", closed: "Mosquée fermée",
  duplicate: "Doublon", wrong_information: "Informations erronées", other: "Autre problème",
};
const TIME_KINDS: Record<MosquePrayerTimeProposal["kind"], string> = { regular: "Horaires habituels", ramadan: "Ramadan", eid_fitr: "Aïd al-Fitr", eid_adha: "Aïd al-Adha" };
const PRAYERS = [["fajr", "Fajr"], ["dhuhr", "Dhuhr"], ["asr", "Asr"], ["maghrib", "Maghrib"], ["isha", "Isha"]] as const;

const day = (iso: string) => new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

export default function AdminInbox() {
  const [inbox, setInbox] = useState<Inbox | null>(null);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const request = useRef(0);

  const load = useCallback(async (pull = false) => {
    const id = ++request.current;
    if (pull) setRefreshing(true);
    try {
      const next = await loadInbox();
      if (id === request.current) {
        setInbox(next);
        setError("");
      }
    } catch (cause) {
      if (id === request.current) setError(cause instanceof Error ? cause.message : "Chargement impossible.");
    } finally {
      if (id === request.current) setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => {
    void load();
  }, [load]));

  // A handled item leaves the list at once, without reloading everything.
  const remove = <K extends keyof Omit<Inbox, "failed">>(key: K, id: string) =>
    setInbox((current) => (current ? { ...current, [key]: (current[key] as { id: string }[]).filter((item) => item.id !== id) } : current));

  const total = inboxTotal(inbox);

  return (
    <AdminScreen title="À traiter" onRefresh={() => void load(true)} refreshing={refreshing}>
      {!inbox && !error ? <Loading /> : error && !inbox ? <ErrorState text={error} onRetry={() => void load()} /> : inbox ? (
        <>
          {inbox.failed.length ? (
            <Card>
              <Text style={adminStyles.rowText}>Non chargé : {inbox.failed.join(", ")}. Tirez vers le bas pour réessayer.</Text>
            </Card>
          ) : null}
          {total === 0 && !inbox.failed.length ? <EmptyState text="Tout est traité. Rien n’attend votre décision." /> : null}

          {inbox.support.length ? <SectionTitle count={inbox.support.length}>Support</SectionTitle> : null}
          {inbox.support.map((ticket) => (
            <OpenRow
              key={ticket.id}
              tag={ticket.priority === "urgent" ? "Urgent" : ticket.unreadByAdmin ? "Nouveau message" : "Ouvert"}
              title={ticket.subject}
              text={ticket.userEmail}
              meta={day(ticket.lastMessageAt || ticket.createdAt)}
              href={{ pathname: "/admin/support/[id]", params: { id: ticket.id } }}
            />
          ))}

          {inbox.mosques.length ? <SectionTitle count={inbox.mosques.length}>Nouvelles mosquées</SectionTitle> : null}
          {inbox.mosques.map((mosque) => (
            <OpenRow key={mosque.id} tag="À valider" title={mosque.name} text={mosque.address} meta={`${day(mosque.created_at)}${mosque.submitter_email ? ` · ${mosque.submitter_email}` : ""}`} href="/admin/mosques" action="Vérifier et valider" />
          ))}

          {inbox.times.length ? <SectionTitle count={inbox.times.length}>Horaires proposés</SectionTitle> : null}
          {inbox.times.map((row) => (
            <Card key={row.id}>
              <Text style={adminStyles.tag}>{TIME_KINDS[row.kind]}</Text>
              <Text style={adminStyles.rowTitle}>{row.mosqueName}</Text>
              <Text style={adminStyles.rowText}>{timesSummary(row)}</Text>
              {row.note ? <Text style={adminStyles.meta}>Note : {row.note}</Text> : null}
              <View style={adminStyles.actions}>
                <ActionButton label="Refuser" tone="outline" done="Horaires refusés" onPress={async () => { await adminReviewMosquePrayerTimeUpdate(row.id, false); remove("times", row.id); }} />
                <ActionButton label="Valider" icon="checkmark" done="Horaires validés" onPress={async () => { await adminReviewMosquePrayerTimeUpdate(row.id, true); remove("times", row.id); }} />
              </View>
            </Card>
          ))}

          {inbox.posts.length ? <SectionTitle count={inbox.posts.length}>Annonces des mosquées</SectionTitle> : null}
          {inbox.posts.map((post) => (
            <Card key={post.id}>
              <Text style={adminStyles.tag}>{post.kind === "event" ? "Événement" : "Annonce"} · {post.mosqueName}</Text>
              <Text style={adminStyles.rowTitle}>{post.title}</Text>
              {post.body ? <Text style={adminStyles.rowText} numberOfLines={5}>{post.body}</Text> : null}
              {post.startsAt ? <Text style={adminStyles.meta}>Le {day(post.startsAt)}</Text> : null}
              <View style={adminStyles.actions}>
                <ActionButton label="Refuser" tone="outline" done="Annonce refusée" onPress={async () => { await adminReviewMosquePost(post.id, false); remove("posts", post.id); }} />
                <ActionButton label="Publier" icon="checkmark" done="Annonce publiée" onPress={async () => { await adminReviewMosquePost(post.id, true); remove("posts", post.id); }} />
              </View>
            </Card>
          ))}

          {inbox.reports.length ? <SectionTitle count={inbox.reports.length}>Signalements</SectionTitle> : null}
          {inbox.reports.map((report) => (
            <Card key={report.id}>
              <Text style={[adminStyles.tag, { color: colors.danger }]}>{REPORT_LABELS[report.reason] ?? report.reason}</Text>
              <Text style={adminStyles.rowTitle}>{report.mosque_name}</Text>
              <Text style={adminStyles.rowText}>{report.mosque_address}</Text>
              {report.details ? <Text style={[adminStyles.rowText, styles.quote]}>{report.details}</Text> : null}
              <Text style={adminStyles.meta}>{report.reporter_email ?? "Un utilisateur"} · {day(report.created_at)}</Text>
              <View style={adminStyles.actions}>
                <ActionButton label="Ignorer" tone="outline" done="Signalement ignoré" onPress={async () => { await adminRpc("admin_review_mosque_report", { p_report_id: report.id, p_status: "ignored", p_hide_mosque: false }); remove("reports", report.id); }} />
                <ActionButton label="Corrigé" icon="checkmark" done="Signalement résolu" onPress={async () => { await adminRpc("admin_review_mosque_report", { p_report_id: report.id, p_status: "resolved", p_hide_mosque: false }); remove("reports", report.id); }} />
              </View>
              {report.reason === "closed" || report.reason === "duplicate" ? (
                <View style={adminStyles.actions}>
                  <ActionButton label="Masquer la mosquée du public" tone="danger" icon="eye-off-outline" done="Mosquée masquée" onPress={async () => { await adminRpc("admin_review_mosque_report", { p_report_id: report.id, p_status: "resolved", p_hide_mosque: true }); remove("reports", report.id); }} />
                </View>
              ) : null}
            </Card>
          ))}

          {inbox.wall.length ? <SectionTitle count={inbox.wall.length}>Mur des duas</SectionTitle> : null}
          {inbox.wall.map((item) => (
            <Card key={`${item.kind}-${item.id}`}>
              <Text style={[adminStyles.tag, { color: colors.danger }]}>{item.reportCount > 0 ? `${item.kind === "reply" ? "Réponse" : "Dua"} signalée ${item.reportCount} fois` : "Dua en attente de validation"}</Text>
              <Text style={adminStyles.rowText}>{item.body}</Text>
              <Text style={adminStyles.meta}>{item.anonymous ? "Anonyme" : item.author ?? "Membre"} · {day(item.createdAt)}</Text>
              <View style={adminStyles.actions}>
                <ActionButton label="Retirer" tone="danger" done="Retiré du mur" onPress={async () => { await adminReviewWall(item.kind, item.id, false); remove("wall", item.id); }} />
                <ActionButton label={item.reportCount > 0 ? "Garder" : "Publier"} icon="checkmark" done={item.reportCount > 0 ? "Conservé sur le mur" : "Publié sur le mur"} onPress={async () => { await adminReviewWall(item.kind, item.id, true); remove("wall", item.id); }} />
              </View>
            </Card>
          ))}

          {inbox.certifiers.length ? <SectionTitle count={inbox.certifiers.length}>Certificateurs halal indiqués</SectionTitle> : null}
          {inbox.certifiers.map((report) => (
            <CertifierCard key={report.id} report={report} onDone={() => remove("certifiers", report.id)} />
          ))}
        </>
      ) : null}
    </AdminScreen>
  );
}

/** The team reads the logo on the photo and validates the body actually printed, whatever the user chose. */
function CertifierCard({ report, onDone }: { report: CertifierReport; onDone: () => void }) {
  useHalalCertificationBodies();
  const [chosen, setChosen] = useState<string | null>(report.certifierId);
  const bodies = getHalalCertificationBodies();
  const name = (id: string | null) => (id ? getHalalCertifier(id)?.name ?? id : null);
  return (
    <Card>
      <Text style={adminStyles.tag}>Indiqué : {report.certifierId ? name(report.certifierId) : `Autre · ${report.other ?? "?"}`}</Text>
      <Text style={adminStyles.rowTitle}>{report.productName || "Produit sans nom"}</Text>
      <Text style={adminStyles.meta}>Code-barres {report.barcode} · {day(report.createdAt)}{report.current ? ` · déjà confirmé : ${name(report.current)}` : ""}</Text>
      {report.photoUrl ? <Image source={{ uri: report.photoUrl }} style={styles.photo} contentFit="contain" /> : <Text style={adminStyles.rowText}>Photo indisponible.</Text>}
      <Text style={[adminStyles.meta, styles.pickLabel]}>Logo visible sur la photo :</Text>
      <View style={styles.chips}>
        {bodies.map((body) => (
          <Pressable key={body.id} onPress={() => setChosen(body.id)} style={[styles.chip, chosen === body.id && styles.chipOn]} accessibilityRole="button" accessibilityState={{ selected: chosen === body.id }}>
            <Text style={[styles.chipText, chosen === body.id && styles.chipTextOn]}>{body.name}</Text>
          </Pressable>
        ))}
      </View>
      <View style={adminStyles.actions}>
        <ActionButton label="Refuser" tone="outline" done="Signalement refusé" onPress={async () => { await reviewCertifierReport(report.id, false); onDone(); }} />
        <ActionButton label={chosen ? `Valider ${name(chosen)}` : "Choisir un logo"} icon="checkmark" disabled={!chosen} done="Certificateur validé pour ce produit" onPress={async () => { if (!chosen) return; await reviewCertifierReport(report.id, true, chosen); onDone(); }} />
      </View>
    </Card>
  );
}

function timesSummary(row: MosquePrayerTimeProposal) {
  if (row.kind === "regular") {
    const parts: string[] = PRAYERS.filter(([key]) => row[key]).map(([key, label]) => `${label} ${row[key]}`);
    (row.jumuahTimes ?? []).forEach((slot) => parts.push(`Joumou’a ${slot.time}`));
    return parts.join(" · ") || "Iqama seulement";
  }
  if (row.kind === "ramadan") return `Tarawih ${row.tarawih ?? "—"} · du ${row.validFrom ?? "—"} au ${row.validTo ?? "—"}`;
  return `${row.validFrom ?? ""} · ${row.eidTimes?.join(" · ") ?? "—"}`;
}

function OpenRow({ tag, title, text, meta, href, action = "Ouvrir" }: { tag: string; title: string; text?: string; meta?: string; href: Href; action?: string }) {
  return (
    <Pressable onPress={() => router.push(href)} style={({ pressed }) => [pressed && { opacity: 0.7 }]} accessibilityRole="button">
      <Card>
        <Text style={adminStyles.tag}>{tag}</Text>
        <Text style={adminStyles.rowTitle}>{title}</Text>
        {text ? <Text style={adminStyles.rowText}>{text}</Text> : null}
        {meta ? <Text style={adminStyles.meta}>{meta}</Text> : null}
        <View style={styles.openRow}>
          <Text style={styles.openText}>{action}</Text>
          <Ionicons name="chevron-forward" size={16} color={colors.goldLight} />
        </View>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  quote: { marginTop: 8, padding: 10, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.04)" },
  openRow: { marginTop: 10, flexDirection: "row", alignItems: "center", gap: 4 },
  photo: { marginTop: 10, width: "100%", aspectRatio: 4 / 3, borderRadius: 14, backgroundColor: "rgba(255,255,255,0.04)" },
  pickLabel: { marginTop: 10, marginBottom: 6 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  chip: { paddingHorizontal: 11, paddingVertical: 7, borderRadius: 16, borderWidth: 1, borderColor: colors.borderSoft },
  chipOn: { backgroundColor: colors.goldLight, borderColor: colors.goldLight },
  chipText: { color: colors.textSecondary, fontFamily: typography.sans, fontSize: 13, fontWeight: "700" },
  chipTextOn: { color: colors.background },
  openText: { color: colors.goldLight, fontFamily: typography.sans, fontSize: 14, fontWeight: "800" },
});
