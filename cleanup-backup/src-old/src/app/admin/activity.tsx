import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  getAdminActivity,
  type AdminActivityKind,
  type AdminActivityRow,
} from "../../features/admin/AdminService";
import { colors } from "../../theme/colors";
import { typography } from "../../theme/typography";

type Filter = "all" | AdminActivityKind;

const FILTERS: Array<{ value: Filter; label: string }> = [
  { value: "all", label: "Tout" },
  { value: "mosque_review", label: "Mosquées" },
  { value: "mosque_report", label: "Signalements" },
  { value: "credit_adjustment", label: "Crédits" },
];

function iconFor(kind: AdminActivityKind): keyof typeof Ionicons.glyphMap {
  if (kind === "credit_adjustment") return "flash-outline";
  if (kind === "mosque_report") return "flag-outline";
  return "business-outline";
}

function dateLabel(value: string) {
  const date = new Date(value);
  const now = new Date();

  const today =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();

  const yesterdayDate = new Date(now);
  yesterdayDate.setDate(now.getDate() - 1);

  const yesterday =
    date.getFullYear() === yesterdayDate.getFullYear() &&
    date.getMonth() === yesterdayDate.getMonth() &&
    date.getDate() === yesterdayDate.getDate();

  const time = date.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  if (today) return `Aujourd’hui à ${time}`;
  if (yesterday) return `Hier à ${time}`;

  return date.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AdminActivityScreen() {
  const [rows, setRows] = useState<AdminActivityRow[]>([]);
  const [filter, setFilter] = useState<Filter>("all");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);

    try {
      setRows(await getAdminActivity(150));
    } catch (error) {
      Alert.alert(
        "Journal d’activité",
        error instanceof Error ? error.message : "Chargement impossible.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const filtered = useMemo(
    () =>
      filter === "all"
        ? rows
        : rows.filter((row) => row.kind === filter),
    [filter, rows],
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.headerButton}>
          <Ionicons name="arrow-back" size={22} color={colors.goldLight} />
        </Pressable>

        <View style={styles.headerCopy}>
          <Text style={styles.eyebrow}>ADMINISTRATION</Text>
          <Text style={styles.title}>Journal d’activité</Text>
        </View>

        <Pressable onPress={() => void load()} style={styles.headerButton}>
          <Ionicons name="refresh" size={20} color={colors.goldLight} />
        </Pressable>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filters}
      >
        {FILTERS.map((item) => (
          <Pressable
            key={item.value}
            onPress={() => setFilter(item.value)}
            style={[
              styles.filter,
              filter === item.value && styles.filterActive,
            ]}
          >
            <Text
              style={[
                styles.filterText,
                filter === item.value && styles.filterTextActive,
              ]}
            >
              {item.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

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
          {filtered.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons
                name="checkmark-done-outline"
                size={28}
                color={colors.goldLight}
              />
              <Text style={styles.emptyTitle}>Aucune activité</Text>
              <Text style={styles.emptyText}>
                Les prochaines actions administratives apparaîtront ici.
              </Text>
            </View>
          ) : (
            filtered.map((row, index) => (
              <View key={`${row.kind}-${row.id}-${index}`} style={styles.row}>
                <View style={styles.timeline}>
                  <View style={styles.iconWrap}>
                    <Ionicons
                      name={iconFor(row.kind)}
                      size={17}
                      color={colors.goldLight}
                    />
                  </View>
                  {index < filtered.length - 1 ? (
                    <View style={styles.line} />
                  ) : null}
                </View>

                <View style={styles.card}>
                  <View style={styles.cardTop}>
                    <Text style={styles.cardTitle}>{row.title}</Text>

                    {row.amount !== null ? (
                      <View
                        style={[
                          styles.amountBadge,
                          row.amount < 0 && styles.amountBadgeNegative,
                        ]}
                      >
                        <Text
                          style={[
                            styles.amountText,
                            row.amount < 0 && styles.amountTextNegative,
                          ]}
                        >
                          {row.amount > 0 ? "+" : ""}
                          {row.amount}
                        </Text>
                      </View>
                    ) : null}
                  </View>

                  <Text style={styles.description}>{row.description}</Text>

                  <View style={styles.metaRow}>
                    <Text style={styles.meta}>
                      {row.adminEmail ?? "Administrateur"}
                    </Text>
                    <Text style={styles.meta}>·</Text>
                    <Text style={styles.meta}>{dateLabel(row.createdAt)}</Text>
                  </View>
                </View>
              </View>
            ))
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
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
  headerCopy: {
    alignItems: "center",
  },
  eyebrow: {
    color: colors.goldMuted,
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 1.2,
  },
  title: {
    color: colors.text,
    fontFamily: typography.serifSemibold,
    fontSize: 22,
  },
  filters: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  filter: {
    height: 38,
    paddingHorizontal: 15,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 19,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  filterActive: {
    borderColor: colors.goldLight,
    backgroundColor: colors.goldLight,
  },
  filterText: {
    color: colors.textMuted,
    fontSize: 10.5,
    fontWeight: "800",
  },
  filterTextActive: {
    color: colors.background,
  },
  loader: {
    marginTop: 70,
  },
  content: {
    paddingHorizontal: 17,
    paddingBottom: 50,
  },
  row: {
    flexDirection: "row",
    alignItems: "stretch",
  },
  timeline: {
    width: 40,
    alignItems: "center",
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(241,188,79,0.22)",
    backgroundColor: "rgba(241,188,79,0.08)",
  },
  line: {
    flex: 1,
    width: 1,
    minHeight: 25,
    backgroundColor: colors.border,
  },
  card: {
    flex: 1,
    marginLeft: 6,
    marginBottom: 12,
    padding: 13,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  cardTitle: {
    flex: 1,
    color: colors.text,
    fontSize: 12.5,
    fontWeight: "800",
  },
  description: {
    marginTop: 6,
    color: colors.textSecondary,
    fontSize: 10.5,
    lineHeight: 15,
  },
  metaRow: {
    marginTop: 8,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
  },
  meta: {
    color: colors.textMuted,
    fontSize: 8.5,
  },
  amountBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 9,
    backgroundColor: "rgba(241,188,79,0.12)",
  },
  amountBadgeNegative: {
    backgroundColor: "rgba(242,139,130,0.10)",
  },
  amountText: {
    color: colors.goldLight,
    fontSize: 10,
    fontWeight: "900",
  },
  amountTextNegative: {
    color: "#F28B82",
  },
  emptyCard: {
    marginTop: 45,
    padding: 28,
    alignItems: "center",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  emptyTitle: {
    marginTop: 10,
    color: colors.text,
    fontFamily: typography.serifMedium,
    fontSize: 17,
  },
  emptyText: {
    marginTop: 6,
    color: colors.textMuted,
    textAlign: "center",
    fontSize: 10.5,
    lineHeight: 16,
  },
});
