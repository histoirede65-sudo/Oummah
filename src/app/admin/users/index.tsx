import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useRef, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { getAdminUsers, type AdminUserRow } from "../../../features/admin/AdminService";
import { isOummahAdminSession } from "../../../features/auth/AdminAccess";
import { getValidSession } from "../../../features/auth/SupabaseAuthService";
import { colors } from "../../../theme/colors";
import { typography } from "../../../theme/typography";

export default function AdminUsersScreen() {
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const requestId = useRef(0);
  const lastQuery = useRef("");

  const load = useCallback(async (value: string, refresh = false) => {
    const id = ++requestId.current;
    const nextQuery = value.trim();
    lastQuery.current = nextQuery;
    if (refresh) setRefreshing(true); else setLoading(true);
    setError("");
    try {
      const session = await getValidSession(true);
      if (id !== requestId.current) return;
      if (!isOummahAdminSession(session)) { router.replace("/profile"); return; }
      const nextUsers = await getAdminUsers(nextQuery);
      if (id !== requestId.current) return;
      setUsers(nextUsers);
      setQuery(nextQuery);
    } catch {
      if (id === requestId.current) setError("Impossible de charger les utilisateurs. Réessayez.");
    } finally {
      if (id === requestId.current) { setLoading(false); setRefreshing(false); }
    }
  }, []);

  useFocusEffect(useCallback(() => {
    void load(lastQuery.current);
    return () => { requestId.current += 1; };
  }, [load]));

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.headerButton} accessibilityRole="button" accessibilityLabel="Retour">
          <Ionicons name="arrow-back" size={22} color={colors.goldLight} />
        </Pressable>
        <View style={styles.headerCopy}><Text style={styles.eyebrow}>ADMINISTRATION</Text><Text style={styles.title}>Utilisateurs</Text></View>
        <Pressable onPress={() => void load(lastQuery.current, true)} disabled={loading || refreshing} style={styles.headerButton} accessibilityRole="button" accessibilityLabel="Actualiser">
          <Ionicons name="refresh" size={20} color={colors.goldLight} />
        </Pressable>
      </View>
      <View style={styles.searchSection}>
        <Text style={styles.intro}>Ouvrez une fiche pour gérer les crédits et consulter l’historique du compte.</Text>
        <View style={styles.searchWrap}>
          <Ionicons name="search-outline" size={19} color={colors.textMuted} />
          <TextInput value={search} onChangeText={setSearch} onSubmitEditing={() => void load(search)}
            placeholder="Adresse e-mail" placeholderTextColor={colors.textMuted} accessibilityLabel="Rechercher par adresse e-mail"
            autoCapitalize="none" autoCorrect={false} keyboardType="email-address" returnKeyType="search" style={styles.input} />
          {search ? <Pressable onPress={() => { setSearch(""); void load(""); }} style={styles.clear} accessibilityRole="button" accessibilityLabel="Effacer la recherche">
            <Ionicons name="close-circle" size={20} color={colors.textMuted} />
          </Pressable> : null}
        </View>
        <Pressable onPress={() => void load(search)} disabled={loading || refreshing} accessibilityRole="button"
          style={({ pressed }) => [styles.searchButton, (pressed || loading || refreshing) && styles.dimmed]}>
          <Text style={styles.searchButtonText}>Rechercher</Text>
        </Pressable>
      </View>
      {loading ? <ActivityIndicator style={styles.loader} color={colors.goldLight} /> : (
        <FlatList data={error ? [] : users} keyExtractor={(user) => user.userId} contentContainerStyle={styles.list}
          keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load(lastQuery.current, true)} tintColor={colors.goldLight} />}
          ListHeaderComponent={<View style={styles.listHeader}>
            <Text style={styles.listTitle}>{query ? "Résultats de recherche" : "Utilisateurs récents"}</Text>
            {!error ? <Text style={styles.resultCount}>{users.length}{users.length === 50 ? " premiers résultats" : " résultat" + (users.length === 1 ? "" : "s")}</Text> : null}
            {query && !error ? <Text style={styles.query}>{query}</Text> : null}
            {users.length === 50 && !error ? <Text style={styles.query}>Précisez l’adresse e-mail pour retrouver un autre compte.</Text> : null}
          </View>}
          ListEmptyComponent={<View style={styles.empty}>
            <Ionicons name={error ? "cloud-offline-outline" : "search-outline"} size={30} color={colors.textMuted} />
            <Text style={styles.emptyText}>{error || "Aucun utilisateur trouvé."}</Text>
            {error ? <Pressable onPress={() => void load(lastQuery.current)} style={styles.retry} accessibilityRole="button"><Text style={styles.retryText}>Réessayer</Text></Pressable> : null}
          </View>}
          renderItem={({ item: user }) => (
            <Pressable accessibilityRole="button" accessibilityLabel={`Ouvrir la fiche de ${user.email}`}
              onPress={() => router.push({ pathname: "/admin/users/[id]", params: { id: user.userId } })}
              style={({ pressed }) => [styles.userCard, pressed && styles.dimmed]}>
              <View style={styles.userTop}><View style={styles.userCopy}>
                <Text style={styles.email}>{user.email}</Text>
                <Text style={styles.date}>Inscrit le {new Date(user.createdAt).toLocaleDateString("fr-FR")}</Text>
              </View><Ionicons name="chevron-forward" size={18} color={colors.goldLight} /></View>
              <View style={styles.userBottom}><Text style={styles.balance}>{user.balance.toLocaleString("fr-FR")} crédits Wasil</Text><Text style={styles.open}>Voir la fiche</Text></View>
            </Pressable>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { minHeight: 76, paddingHorizontal: 16, flexDirection: "row", alignItems: "center", gap: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.borderSoft },
  headerCopy: { flex: 1, alignItems: "center" },
  headerButton: { width: 44, height: 44, borderRadius: 16, backgroundColor: colors.card, alignItems: "center", justifyContent: "center" },
  eyebrow: { color: colors.goldMuted, fontSize: 9, fontWeight: "700", letterSpacing: 1.5 },
  title: { color: colors.text, fontFamily: typography.serifSemibold, fontSize: 26 },
  searchSection: { padding: 16, gap: 12 },
  intro: { color: colors.textSecondary, fontSize: 13, lineHeight: 19 },
  searchWrap: { minHeight: 50, flexDirection: "row", alignItems: "center", paddingLeft: 14, gap: 10, borderRadius: 14, borderWidth: 1, borderColor: colors.borderSoft, backgroundColor: colors.card },
  input: { flex: 1, color: colors.text, fontSize: 15, paddingVertical: 12 },
  clear: { width: 44, minHeight: 48, alignItems: "center", justifyContent: "center" },
  searchButton: { minHeight: 46, alignItems: "center", justifyContent: "center", borderRadius: 13, backgroundColor: colors.goldLight },
  searchButtonText: { color: colors.background, fontSize: 14, fontWeight: "700" },
  loader: { marginTop: 45 },
  list: { paddingHorizontal: 16, paddingBottom: 32 },
  listHeader: { paddingTop: 8, paddingBottom: 14, gap: 4 },
  listTitle: { color: colors.text, fontSize: 16, fontWeight: "700" },
  resultCount: { color: colors.textSecondary, fontSize: 12 },
  query: { color: colors.textMuted, fontSize: 12, lineHeight: 18 },
  userCard: { padding: 16, marginBottom: 10, borderRadius: 17, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.borderSoft },
  userTop: { flexDirection: "row", alignItems: "center", gap: 12 },
  userCopy: { flex: 1, minWidth: 0 },
  email: { color: colors.text, fontSize: 14, fontWeight: "600" },
  date: { marginTop: 5, color: colors.textSecondary, fontSize: 12 },
  userBottom: { marginTop: 16, flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", gap: 8 },
  balance: { color: colors.goldLight, fontSize: 12, fontWeight: "600" },
  open: { color: colors.textSecondary, fontSize: 12 },
  empty: { alignItems: "center", padding: 28, gap: 14 },
  emptyText: { color: colors.textSecondary, textAlign: "center", fontSize: 14, lineHeight: 20 },
  retry: { minHeight: 44, justifyContent: "center", paddingHorizontal: 18 },
  retryText: { color: colors.goldLight, fontWeight: "700" },
  dimmed: { opacity: 0.65 },
});
