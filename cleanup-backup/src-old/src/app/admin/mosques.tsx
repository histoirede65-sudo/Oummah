import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { isOummahAdminSession } from "../../features/auth/AdminAccess";
import { getValidSession } from "../../features/auth/SupabaseAuthService";
import { colors } from "../../theme/colors";
import { typography } from "../../theme/typography";

type Status = "pending" | "approved" | "rejected";
type FeatureState = "yes" | "no" | "limited" | "unknown";

type MosqueRow = {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  validation_status: Status;
  created_at: string;
  updated_at: string;
  reviewed_at: string | null;
  rejection_reason: string | null;
  is_hidden: boolean;
  hidden_at: string | null;
  submitter_email: string | null;
  alternative_name: string | null;
  arabic_name: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  opening_hours: string | null;
  operator: string | null;
  denomination: string | null;
  wheelchair: FeatureState;
  women_space: FeatureState;
  ablutions: FeatureState;
  parking: FeatureState;
  toilets: FeatureState;
  languages: string[];
  service_times: string[];
};

type EditableMosque = {
  name: string;
  address: string;
  alternativeName: string;
  arabicName: string;
  phone: string;
  email: string;
  website: string;
  openingHours: string;
  operator: string;
  denomination: string;
  languages: string;
  serviceTimes: string;
  rejectionReason: string;
};

type ReviewHistoryRow = {
  id: string;
  previous_status: Status;
  new_status: Status;
  rejection_reason: string | null;
  created_at: string;
  admin_email: string | null;
  action_label: string;
};

const STATUS_LABELS: Record<Status, string> = {
  pending: "En attente",
  approved: "Validées",
  rejected: "Refusées",
};

function config() {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim().replace(/\/$/, "");
  const key = (
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  )?.trim();

  if (!url || !key) throw new Error("Supabase n’est pas configuré.");
  return { url, key };
}

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function distanceMeters(a: MosqueRow, b: MosqueRow) {
  const earthRadius = 6371000;
  const toRadians = (value: number) => (value * Math.PI) / 180;
  const latitudeDelta = toRadians(b.latitude - a.latitude);
  const longitudeDelta = toRadians(b.longitude - a.longitude);
  const latitudeA = toRadians(a.latitude);
  const latitudeB = toRadians(b.latitude);

  const haversine =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(latitudeA) *
      Math.cos(latitudeB) *
      Math.sin(longitudeDelta / 2) ** 2;

  return 2 * earthRadius * Math.asin(Math.sqrt(haversine));
}

function duplicateScore(candidate: MosqueRow, existing: MosqueRow) {
  if (candidate.id === existing.id) return 0;

  const candidateName = normalize(candidate.name);
  const existingName = normalize(existing.name);
  const candidateAddress = normalize(candidate.address);
  const existingAddress = normalize(existing.address);
  const distance = distanceMeters(candidate, existing);

  const sameName =
    candidateName === existingName ||
    candidateName.includes(existingName) ||
    existingName.includes(candidateName);

  const sameAddress =
    candidateAddress === existingAddress ||
    candidateAddress.includes(existingAddress) ||
    existingAddress.includes(candidateAddress);

  if (sameName && distance <= 300) return 3;
  if (sameAddress && distance <= 500) return 3;
  if (sameName && distance <= 1000) return 2;
  if (distance <= 100) return 2;
  return 0;
}

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleString("fr-FR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

function toEditable(row: MosqueRow): EditableMosque {
  return {
    name: row.name,
    address: row.address,
    alternativeName: row.alternative_name ?? "",
    arabicName: row.arabic_name ?? "",
    phone: row.phone ?? "",
    email: row.email ?? "",
    website: row.website ?? "",
    openingHours: row.opening_hours ?? "",
    operator: row.operator ?? "",
    denomination: row.denomination ?? "",
    languages: row.languages.join(", "),
    serviceTimes: row.service_times.join(", "),
    rejectionReason: row.rejection_reason ?? "",
  };
}

function splitList(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export default function AdminMosquesScreen() {
  const [status, setStatus] = useState<Status>("pending");
  const [rows, setRows] = useState<MosqueRow[]>([]);
  const [allRows, setAllRows] = useState<MosqueRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [acting, setActing] = useState(false);
  const [selected, setSelected] = useState<MosqueRow | null>(null);
  const [form, setForm] = useState<EditableMosque | null>(null);
  const [history, setHistory] = useState<ReviewHistoryRow[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const rpc = useCallback(
    async <T,>(name: string, body: Record<string, unknown>): Promise<T> => {
      const session = await getValidSession(true);
      if (!isOummahAdminSession(session)) {
        throw new Error("Accès administrateur refusé.");
      }

      const { url, key } = config();
      const response = await fetch(`${url}/rest/v1/rpc/${name}`, {
        method: "POST",
        headers: {
          apikey: key,
          Authorization: `Bearer ${session!.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const detail = await response.text().catch(() => "");
        throw new Error(detail || "Action impossible.");
      }

      return (await response.json()) as T;
    },
    [],
  );

  const load = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);

      try {
        const [currentRows, everyRow] = await Promise.all([
          rpc<MosqueRow[]>("admin_list_mosque_submissions", {
            p_status: status,
          }),
          rpc<MosqueRow[]>("admin_list_mosque_submissions", {
            p_status: null,
          }),
        ]);

        setRows(currentRows);
        setAllRows(everyRow);
      } catch (error) {
        Alert.alert(
          "Administration",
          error instanceof Error ? error.message : "Chargement impossible.",
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [rpc, status],
  );

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const openDetails = useCallback(
    async (row: MosqueRow) => {
      setSelected(row);
      setForm(toEditable(row));
      setHistory([]);
      setHistoryLoading(true);

      try {
        const entries = await rpc<ReviewHistoryRow[]>(
          "admin_list_mosque_review_history",
          { p_submission_id: row.id },
        );
        setHistory(entries);
      } catch {
        setHistory([]);
      } finally {
        setHistoryLoading(false);
      }
    },
    [rpc],
  );

  const closeDetails = useCallback(() => {
    if (acting) return;
    setSelected(null);
    setForm(null);
    setHistory([]);
  }, [acting]);

  const duplicates = useMemo(() => {
    if (!selected) return [];

    return allRows
      .map((row) => ({ row, score: duplicateScore(selected, row) }))
      .filter(({ score }) => score >= 2)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
  }, [allRows, selected]);

  const openInMaps = useCallback(async (row: MosqueRow) => {
    const url = `https://www.google.com/maps/search/?api=1&query=${row.latitude},${row.longitude}`;
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert("Carte indisponible", "Impossible d’ouvrir la carte.");
    }
  }, []);

  const toggleVisibility = useCallback(async () => {
    if (!selected || acting || selected.validation_status !== "approved") return;

    const nextHidden = !selected.is_hidden;
    Alert.alert(
      nextHidden ? "Masquer la mosquée" : "Réafficher la mosquée",
      nextHidden
        ? "Elle disparaîtra immédiatement de la liste publique, sans être supprimée."
        : "Elle redeviendra visible pour tous les utilisateurs.",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: nextHidden ? "Masquer" : "Réafficher",
          style: nextHidden ? "destructive" : "default",
          onPress: async () => {
            setActing(true);
            try {
              await rpc("admin_set_mosque_visibility", {
                p_submission_id: selected.id,
                p_hidden: nextHidden,
              });
              setSelected((current) =>
                current
                  ? {
                      ...current,
                      is_hidden: nextHidden,
                      hidden_at: nextHidden ? new Date().toISOString() : null,
                    }
                  : current,
              );
              await load(true);
            } catch (error) {
              Alert.alert(
                "Action impossible",
                error instanceof Error ? error.message : "Réessayez.",
              );
            } finally {
              setActing(false);
            }
          },
        },
      ],
    );
  }, [acting, load, rpc, selected]);

  const review = useCallback(
    async (nextStatus: Status) => {
      if (!selected || !form || acting) return;

      const name = form.name.trim();
      const address = form.address.trim();
      const rejectionReason = form.rejectionReason.trim();

      if (!name) {
        Alert.alert("Information manquante", "Le nom est obligatoire.");
        return;
      }

      if (!address) {
        Alert.alert("Information manquante", "L’adresse est obligatoire.");
        return;
      }

      if (nextStatus === "rejected" && !rejectionReason) {
        Alert.alert(
          "Motif nécessaire",
          "Indique un motif avant de refuser la proposition.",
        );
        return;
      }

      const execute = async () => {
        setActing(true);
        try {
          await rpc("admin_review_mosque_submission", {
            p_submission_id: selected.id,
            p_status: nextStatus,
            p_rejection_reason:
              nextStatus === "rejected" ? rejectionReason : null,
            p_name: name,
            p_address: address,
            p_alternative_name: form.alternativeName.trim() || null,
            p_arabic_name: form.arabicName.trim() || null,
            p_phone: form.phone.trim() || null,
            p_email: form.email.trim() || null,
            p_website: form.website.trim() || null,
            p_opening_hours: form.openingHours.trim() || null,
            p_operator: form.operator.trim() || null,
            p_denomination: form.denomination.trim() || null,
            p_languages: splitList(form.languages),
            p_service_times: splitList(form.serviceTimes),
          });

          closeDetails();
          await load(true);
        } catch (error) {
          Alert.alert(
            "Action impossible",
            error instanceof Error ? error.message : "Réessayez.",
          );
        } finally {
          setActing(false);
        }
      };

      if (nextStatus === "approved" && duplicates.length > 0) {
        Alert.alert(
          "Doublon possible",
          `${duplicates.length} mosquée${
            duplicates.length > 1 ? "s semblent" : " semble"
          } similaire. Valider malgré tout ?`,
          [
            { text: "Annuler", style: "cancel" },
            {
              text: "Valider quand même",
              onPress: () => void execute(),
            },
          ],
        );
        return;
      }

      Alert.alert(
        nextStatus === "approved" ? "Valider la mosquée" : "Refuser la mosquée",
        nextStatus === "approved"
          ? "Elle deviendra immédiatement visible pour tous."
          : "La proposition restera dans l’historique des refus.",
        [
          { text: "Annuler", style: "cancel" },
          {
            text: nextStatus === "approved" ? "Valider" : "Refuser",
            style: nextStatus === "rejected" ? "destructive" : "default",
            onPress: () => void execute(),
          },
        ],
      );
    },
    [acting, closeDetails, duplicates.length, form, load, rpc, selected],
  );

  const saveCorrections = useCallback(async () => {
    if (!selected || !form || acting) return;

    setActing(true);
    try {
      await rpc("admin_review_mosque_submission", {
        p_submission_id: selected.id,
        p_status: selected.validation_status,
        p_rejection_reason: form.rejectionReason.trim() || null,
        p_name: form.name.trim(),
        p_address: form.address.trim(),
        p_alternative_name: form.alternativeName.trim() || null,
        p_arabic_name: form.arabicName.trim() || null,
        p_phone: form.phone.trim() || null,
        p_email: form.email.trim() || null,
        p_website: form.website.trim() || null,
        p_opening_hours: form.openingHours.trim() || null,
        p_operator: form.operator.trim() || null,
        p_denomination: form.denomination.trim() || null,
        p_languages: splitList(form.languages),
        p_service_times: splitList(form.serviceTimes),
      });

      closeDetails();
      await load(true);
    } catch (error) {
      Alert.alert(
        "Enregistrement impossible",
        error instanceof Error ? error.message : "Réessayez.",
      );
    } finally {
      setActing(false);
    }
  }, [acting, closeDetails, form, load, rpc, selected]);

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.headerButton}>
          <Ionicons name="arrow-back" size={22} color={colors.goldLight} />
        </Pressable>

        <View style={styles.headerCopy}>
          <Text style={styles.eyebrow}>ADMINISTRATION</Text>
          <Text style={styles.title}>Mosquées</Text>
        </View>

        <Pressable onPress={() => void load()} style={styles.headerButton}>
          <Ionicons name="refresh" size={20} color={colors.goldLight} />
        </Pressable>
      </View>

      <View style={styles.tabs}>
        {(["pending", "approved", "rejected"] as Status[]).map((item) => (
          <Pressable
            key={item}
            onPress={() => setStatus(item)}
            style={[styles.tab, status === item && styles.tabActive]}
          >
            <Text
              style={[
                styles.tabText,
                status === item && styles.tabTextActive,
              ]}
            >
              {STATUS_LABELS[item]}
            </Text>
          </Pressable>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator style={styles.loader} color={colors.goldLight} />
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                void load(true);
              }}
              tintColor={colors.goldLight}
            />
          }
        >
          {rows.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons
                name="checkmark-circle-outline"
                size={31}
                color={colors.goldMuted}
              />
              <Text style={styles.emptyTitle}>
                Aucune mosquée dans cette catégorie
              </Text>
            </View>
          ) : (
            rows.map((row) => {
              const possibleDuplicates = allRows.filter(
                (candidate) => duplicateScore(row, candidate) >= 2,
              ).length;

              return (
                <Pressable
                  key={row.id}
                  onPress={() => openDetails(row)}
                  style={({ pressed }) => [
                    styles.card,
                    pressed && styles.pressed,
                  ]}
                >
                  <View style={styles.cardTop}>
                    <View style={styles.mosqueIcon}>
                      <Ionicons
                        name="business-outline"
                        size={20}
                        color={colors.goldLight}
                      />
                    </View>

                    <View style={styles.cardCopy}>
                      <Text style={styles.name}>{row.name}</Text>
                      <Text style={styles.address} numberOfLines={2}>
                        {row.address}
                      </Text>
                    </View>

                    <Ionicons
                      name="chevron-forward"
                      size={18}
                      color={colors.textMuted}
                    />
                  </View>

                  <View style={styles.metaRow}>
                    <Text style={styles.date}>{formatDate(row.created_at)}</Text>

                    {possibleDuplicates > 0 ? (
                      <View style={styles.warningBadge}>
                        <Ionicons
                          name="warning-outline"
                          size={11}
                          color="#F6C76E"
                        />
                        <Text style={styles.warningText}>
                          {possibleDuplicates} doublon
                          {possibleDuplicates > 1 ? "s" : ""} possible
                          {possibleDuplicates > 1 ? "s" : ""}
                        </Text>
                      </View>
                    ) : null}
                  </View>

                  {row.submitter_email ? (
                    <Text style={styles.submitter}>
                      Proposée par {row.submitter_email}
                    </Text>
                  ) : null}

                  {row.validation_status === "approved" && row.is_hidden ? (
                    <View style={styles.hiddenBadge}>
                      <Ionicons name="eye-off-outline" size={11} color="#F28B82" />
                      <Text style={styles.hiddenBadgeText}>Masquée du public</Text>
                    </View>
                  ) : null}

                  {row.rejection_reason ? (
                    <Text style={styles.rejectionPreview}>
                      Motif : {row.rejection_reason}
                    </Text>
                  ) : null}
                </Pressable>
              );
            })
          )}
        </ScrollView>
      )}

      <Modal
        visible={Boolean(selected && form)}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeDetails}
      >
        {selected && form ? (
          <SafeAreaView style={styles.modalSafe} edges={["top", "bottom"]}>
            <View style={styles.modalHeader}>
              <Pressable onPress={closeDetails} style={styles.modalHeaderButton}>
                <Ionicons name="close" size={22} color={colors.text} />
              </Pressable>

              <View style={styles.modalHeaderCopy}>
                <Text style={styles.modalEyebrow}>
                  {STATUS_LABELS[selected.validation_status].toUpperCase()}
                </Text>
                <Text style={styles.modalTitle}>Examiner la proposition</Text>
              </View>

              <View style={styles.modalHeaderButton} />
            </View>

            <ScrollView
              contentContainerStyle={styles.modalContent}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.auditCard}>
                <Text style={styles.auditLabel}>Proposée par</Text>
                <Text style={styles.auditValue}>
                  {selected.submitter_email ?? "Utilisateur non identifié"}
                </Text>
                <Text style={styles.auditMeta}>
                  Envoyée le {formatDate(selected.created_at)}
                </Text>
                {selected.reviewed_at ? (
                  <Text style={styles.auditMeta}>
                    Traitée le {formatDate(selected.reviewed_at)}
                  </Text>
                ) : null}
              </View>

              {duplicates.length > 0 ? (
                <View style={styles.duplicateBlock}>
                  <View style={styles.duplicateHeader}>
                    <Ionicons
                      name="warning-outline"
                      size={19}
                      color="#F6C76E"
                    />
                    <Text style={styles.duplicateTitle}>
                      Doublon possible détecté
                    </Text>
                  </View>

                  {duplicates.map(({ row }) => (
                    <View key={row.id} style={styles.duplicateItem}>
                      <Text style={styles.duplicateName}>{row.name}</Text>
                      <Text style={styles.duplicateAddress}>{row.address}</Text>
                      <Text style={styles.duplicateDistance}>
                        À environ {Math.round(distanceMeters(selected, row))} m ·{" "}
                        {STATUS_LABELS[row.validation_status]}
                      </Text>
                    </View>
                  ))}
                </View>
              ) : null}

              <Text style={styles.sectionTitle}>Informations principales</Text>
              <Field
                label="Nom de la mosquée"
                value={form.name}
                required
                onChangeText={(value) =>
                  setForm((current) =>
                    current ? { ...current, name: value } : current,
                  )
                }
              />
              <Field
                label="Adresse"
                value={form.address}
                required
                multiline
                onChangeText={(value) =>
                  setForm((current) =>
                    current ? { ...current, address: value } : current,
                  )
                }
              />

              <View style={styles.coordinatesCard}>
                <Ionicons
                  name="location-outline"
                  size={18}
                  color={colors.goldLight}
                />
                <Text style={styles.coordinatesText}>
                  {selected.latitude.toFixed(6)},{" "}
                  {selected.longitude.toFixed(6)}
                </Text>
              </View>

              <Pressable
                onPress={() => void openInMaps(selected)}
                style={({ pressed }) => [
                  styles.mapButton,
                  pressed && styles.pressed,
                ]}
              >
                <Ionicons name="map-outline" size={18} color={colors.goldLight} />
                <Text style={styles.mapButtonText}>Vérifier sur la carte</Text>
                <Ionicons name="open-outline" size={15} color={colors.textMuted} />
              </Pressable>

              <Text style={styles.sectionTitle}>Informations complémentaires</Text>
              <Field
                label="Nom alternatif"
                value={form.alternativeName}
                onChangeText={(value) =>
                  setForm((current) =>
                    current ? { ...current, alternativeName: value } : current,
                  )
                }
              />
              <Field
                label="Nom arabe"
                value={form.arabicName}
                onChangeText={(value) =>
                  setForm((current) =>
                    current ? { ...current, arabicName: value } : current,
                  )
                }
              />
              <Field
                label="Téléphone"
                value={form.phone}
                onChangeText={(value) =>
                  setForm((current) =>
                    current ? { ...current, phone: value } : current,
                  )
                }
              />
              <Field
                label="E-mail"
                value={form.email}
                onChangeText={(value) =>
                  setForm((current) =>
                    current ? { ...current, email: value } : current,
                  )
                }
              />
              <Field
                label="Site internet"
                value={form.website}
                onChangeText={(value) =>
                  setForm((current) =>
                    current ? { ...current, website: value } : current,
                  )
                }
              />
              <Field
                label="Horaires d’ouverture"
                value={form.openingHours}
                multiline
                onChangeText={(value) =>
                  setForm((current) =>
                    current ? { ...current, openingHours: value } : current,
                  )
                }
              />
              <Field
                label="Responsable ou opérateur"
                value={form.operator}
                onChangeText={(value) =>
                  setForm((current) =>
                    current ? { ...current, operator: value } : current,
                  )
                }
              />
              <Field
                label="Courant ou dénomination"
                value={form.denomination}
                onChangeText={(value) =>
                  setForm((current) =>
                    current ? { ...current, denomination: value } : current,
                  )
                }
              />
              <Field
                label="Langues"
                value={form.languages}
                placeholder="Français, arabe…"
                onChangeText={(value) =>
                  setForm((current) =>
                    current ? { ...current, languages: value } : current,
                  )
                }
              />
              <Field
                label="Horaires ou services"
                value={form.serviceTimes}
                multiline
                onChangeText={(value) =>
                  setForm((current) =>
                    current ? { ...current, serviceTimes: value } : current,
                  )
                }
              />

              <Text style={styles.sectionTitle}>Équipements déclarés</Text>
              <View style={styles.featureGrid}>
                <Feature label="Espace femmes" value={selected.women_space} />
                <Feature label="Ablutions" value={selected.ablutions} />
                <Feature label="Parking" value={selected.parking} />
                <Feature label="Toilettes" value={selected.toilets} />
                <Feature label="Fauteuil roulant" value={selected.wheelchair} />
              </View>

              {selected.validation_status !== "approved" ? (
                <>
                  <Text style={styles.sectionTitle}>Refus</Text>
                  <Field
                    label="Motif du refus"
                    value={form.rejectionReason}
                    multiline
                    placeholder="Ex. doublon, adresse incorrecte…"
                    onChangeText={(value) =>
                      setForm((current) =>
                        current
                          ? { ...current, rejectionReason: value }
                          : current,
                      )
                    }
                  />
                </>
              ) : null}

              <Text style={styles.sectionTitle}>Historique administratif</Text>
              <View style={styles.historyCard}>
                {historyLoading ? (
                  <ActivityIndicator color={colors.goldLight} />
                ) : history.length === 0 ? (
                  <Text style={styles.historyEmpty}>
                    Aucune action administrative enregistrée.
                  </Text>
                ) : (
                  history.map((entry) => (
                    <View key={entry.id} style={styles.historyItem}>
                      <View style={styles.historyDot} />
                      <View style={styles.historyCopy}>
                        <Text style={styles.historyAction}>
                          {entry.action_label}
                        </Text>
                        <Text style={styles.historyMeta}>
                          {entry.admin_email ?? "Administrateur"} · {formatDate(entry.created_at)}
                        </Text>
                        {entry.rejection_reason ? (
                          <Text style={styles.historyReason}>
                            Motif : {entry.rejection_reason}
                          </Text>
                        ) : null}
                      </View>
                    </View>
                  ))
                )}
              </View>

              {selected.validation_status === "approved" ? (
                <Pressable
                  disabled={acting}
                  onPress={() => void toggleVisibility()}
                  style={[
                    styles.visibilityButton,
                    selected.is_hidden
                      ? styles.showButton
                      : styles.hideButton,
                  ]}
                >
                  <Ionicons
                    name={selected.is_hidden ? "eye-outline" : "eye-off-outline"}
                    size={18}
                    color={selected.is_hidden ? colors.background : "#F28B82"}
                  />
                  <Text
                    style={[
                      styles.visibilityButtonText,
                      selected.is_hidden
                        ? styles.showButtonText
                        : styles.hideButtonText,
                    ]}
                  >
                    {selected.is_hidden
                      ? "Réafficher pour tous"
                      : "Masquer du public"}
                  </Text>
                </Pressable>
              ) : null}

              {selected.validation_status === "pending" ? (
                <View style={styles.reviewActions}>
                  <Pressable
                    disabled={acting}
                    onPress={() => void review("rejected")}
                    style={[styles.reviewButton, styles.rejectButton]}
                  >
                    <Ionicons name="close" size={18} color="#F28B82" />
                    <Text style={styles.rejectButtonText}>Refuser</Text>
                  </Pressable>

                  <Pressable
                    disabled={acting}
                    onPress={() => void review("approved")}
                    style={[styles.reviewButton, styles.approveButton]}
                  >
                    {acting ? (
                      <ActivityIndicator color={colors.background} />
                    ) : (
                      <Ionicons
                        name="checkmark"
                        size={18}
                        color={colors.background}
                      />
                    )}
                    <Text style={styles.approveButtonText}>Valider</Text>
                  </Pressable>
                </View>
              ) : (
                <Pressable
                  disabled={acting}
                  onPress={() => void saveCorrections()}
                  style={styles.saveButton}
                >
                  {acting ? (
                    <ActivityIndicator color={colors.background} />
                  ) : (
                    <Ionicons
                      name="save-outline"
                      size={18}
                      color={colors.background}
                    />
                  )}
                  <Text style={styles.saveButtonText}>
                    Enregistrer les corrections
                  </Text>
                </Pressable>
              )}
            </ScrollView>
          </SafeAreaView>
        ) : null}
      </Modal>
    </SafeAreaView>
  );
}

function Field({
  label,
  value,
  onChangeText,
  required = false,
  multiline = false,
  placeholder,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  required?: boolean;
  multiline?: boolean;
  placeholder?: string;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>
        {label}
        {required ? " *" : ""}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        multiline={multiline}
        textAlignVertical={multiline ? "top" : "center"}
        style={[styles.input, multiline && styles.multilineInput]}
      />
    </View>
  );
}

function Feature({
  label,
  value,
}: {
  label: string;
  value: FeatureState;
}) {
  const labels: Record<FeatureState, string> = {
    yes: "Oui",
    no: "Non",
    limited: "Limité",
    unknown: "Inconnu",
  };

  return (
    <View style={styles.featureCard}>
      <Text style={styles.featureLabel}>{label}</Text>
      <Text style={styles.featureValue}>{labels[value]}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  header: {
    minHeight: 70,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.card,
  },
  headerCopy: { alignItems: "center" },
  eyebrow: {
    color: colors.goldMuted,
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 1.2,
  },
  title: {
    color: colors.text,
    fontFamily: typography.serifSemibold,
    fontSize: 25,
  },
  tabs: {
    flexDirection: "row",
    gap: 7,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  tab: {
    flex: 1,
    minHeight: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: colors.card,
  },
  tabActive: { backgroundColor: colors.goldLight },
  tabText: { color: colors.textMuted, fontSize: 11, fontWeight: "700" },
  tabTextActive: { color: colors.background },
  loader: { marginTop: 50 },
  content: { padding: 18, paddingBottom: 60, gap: 12 },
  emptyCard: {
    marginTop: 30,
    padding: 30,
    alignItems: "center",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  emptyTitle: { marginTop: 11, color: colors.textMuted, fontSize: 13 },
  card: {
    padding: 15,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  cardTop: { flexDirection: "row", alignItems: "center" },
  mosqueIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(241,188,79,0.10)",
  },
  cardCopy: { flex: 1, marginHorizontal: 11 },
  name: {
    color: colors.text,
    fontFamily: typography.serifMedium,
    fontSize: 17,
  },
  address: {
    marginTop: 4,
    color: colors.textSecondary,
    fontSize: 11,
    lineHeight: 16,
  },
  metaRow: {
    marginTop: 11,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  date: { color: colors.textMuted, fontSize: 9.5 },
  warningBadge: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: 9,
    backgroundColor: "rgba(246,199,110,0.10)",
  },
  warningText: { color: "#F6C76E", fontSize: 8.5, fontWeight: "700" },
  submitter: { marginTop: 8, color: colors.goldMuted, fontSize: 9.5 },
  rejectionPreview: {
    marginTop: 8,
    color: "#F28B82",
    fontSize: 10,
    lineHeight: 15,
  },
  hiddenBadge: {
    alignSelf: "flex-start",
    marginTop: 8,
    paddingHorizontal: 8,
    paddingVertical: 5,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderRadius: 9,
    backgroundColor: "rgba(242,139,130,0.10)",
  },
  hiddenBadgeText: { color: "#F28B82", fontSize: 8.5, fontWeight: "700" },
  mapButton: {
    minHeight: 46,
    marginTop: 9,
    paddingHorizontal: 13,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(241,188,79,0.28)",
    backgroundColor: "rgba(241,188,79,0.06)",
  },
  mapButtonText: {
    flex: 1,
    color: colors.goldLight,
    fontSize: 11.5,
    fontWeight: "700",
  },
  historyCard: {
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  historyEmpty: {
    paddingVertical: 8,
    textAlign: "center",
    color: colors.textMuted,
    fontSize: 10.5,
  },
  historyItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    paddingVertical: 8,
  },
  historyDot: {
    width: 8,
    height: 8,
    marginTop: 4,
    borderRadius: 4,
    backgroundColor: colors.goldLight,
  },
  historyCopy: { flex: 1 },
  historyAction: { color: colors.text, fontSize: 11.5, fontWeight: "700" },
  historyMeta: { marginTop: 3, color: colors.textMuted, fontSize: 9 },
  historyReason: {
    marginTop: 4,
    color: "#F28B82",
    fontSize: 9.5,
    lineHeight: 14,
  },
  visibilityButton: {
    minHeight: 49,
    marginTop: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 14,
  },
  hideButton: {
    borderWidth: 1,
    borderColor: "#F28B82",
    backgroundColor: "rgba(242,139,130,0.05)",
  },
  showButton: { backgroundColor: colors.goldLight },
  visibilityButtonText: { fontWeight: "800" },
  hideButtonText: { color: "#F28B82" },
  showButtonText: { color: colors.background },
  pressed: { opacity: 0.75 },

  modalSafe: { flex: 1, backgroundColor: colors.background },
  modalHeader: {
    minHeight: 68,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalHeaderButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.card,
  },
  modalHeaderCopy: { alignItems: "center" },
  modalEyebrow: {
    color: colors.goldMuted,
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 1,
  },
  modalTitle: {
    color: colors.text,
    fontFamily: typography.serifSemibold,
    fontSize: 20,
  },
  modalContent: { padding: 18, paddingBottom: 50 },
  auditCard: {
    padding: 15,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  auditLabel: { color: colors.textMuted, fontSize: 9 },
  auditValue: {
    marginTop: 4,
    color: colors.text,
    fontSize: 12,
    fontWeight: "700",
  },
  auditMeta: { marginTop: 5, color: colors.textMuted, fontSize: 9.5 },
  duplicateBlock: {
    marginTop: 14,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(246,199,110,0.35)",
    backgroundColor: "rgba(246,199,110,0.07)",
  },
  duplicateHeader: { flexDirection: "row", alignItems: "center", gap: 7 },
  duplicateTitle: { color: "#F6C76E", fontSize: 12, fontWeight: "800" },
  duplicateItem: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "rgba(246,199,110,0.16)",
  },
  duplicateName: { color: colors.text, fontSize: 11.5, fontWeight: "700" },
  duplicateAddress: {
    marginTop: 3,
    color: colors.textSecondary,
    fontSize: 9.5,
  },
  duplicateDistance: { marginTop: 4, color: "#F6C76E", fontSize: 8.5 },
  sectionTitle: {
    marginTop: 21,
    marginBottom: 11,
    color: colors.goldLight,
    fontFamily: typography.serifMedium,
    fontSize: 17,
  },
  field: { marginBottom: 13 },
  fieldLabel: {
    marginBottom: 6,
    color: colors.text,
    fontSize: 12,
    fontWeight: "600",
  },
  input: {
    minHeight: 47,
    paddingHorizontal: 13,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    color: colors.text,
    fontSize: 13,
  },
  multilineInput: { minHeight: 82, paddingTop: 12 },
  coordinatesCard: {
    minHeight: 44,
    paddingHorizontal: 13,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 12,
    backgroundColor: "rgba(241,188,79,0.08)",
  },
  coordinatesText: { color: colors.textSecondary, fontSize: 11 },
  featureGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  featureCard: {
    width: "48%",
    padding: 12,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  featureLabel: { color: colors.textMuted, fontSize: 9.5 },
  featureValue: {
    marginTop: 5,
    color: colors.goldLight,
    fontSize: 12,
    fontWeight: "800",
  },
  reviewActions: { marginTop: 25, flexDirection: "row", gap: 10 },
  reviewButton: {
    flex: 1,
    minHeight: 50,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    borderRadius: 14,
  },
  rejectButton: { borderWidth: 1, borderColor: "#F28B82" },
  approveButton: { backgroundColor: colors.goldLight },
  rejectButtonText: { color: "#F28B82", fontWeight: "800" },
  approveButtonText: { color: colors.background, fontWeight: "800" },
  saveButton: {
    marginTop: 25,
    minHeight: 50,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 14,
    backgroundColor: colors.goldLight,
  },
  saveButtonText: { color: colors.background, fontWeight: "800" },
});
