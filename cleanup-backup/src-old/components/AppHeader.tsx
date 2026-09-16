import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import type { Href } from "expo-router";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Circle, Path, Rect } from "react-native-svg";

import { useI18n } from "../i18n";
import { getValidSession } from "../features/auth/SupabaseAuthService";
import { loadHifzState } from "../features/hifz/HifzStore";
import { getMosquePrayerSchedule } from "../features/mosques/data/mosquePrayerTimes";
import { getMainMosque } from "../features/mosques/data/mosquePreferences";
import {
  buildNotificationCenterItems,
  loadNotificationCenterPreferences,
  loadReadNotificationIds,
} from "../features/notifications/NotificationCenter";
import { colors } from "../theme/colors";
import { typography } from "../theme/typography";

type AppHeaderProps = {
  onMenuPress?: () => void;
  onNotificationPress?: () => void;
  leftAction?: 'menu' | 'back';
};

type MenuItem = {
  label: string;
  description: string;
  href: string;
  icon:
    | "home-outline"
    | "book-outline"
    | "headset-outline"
    | "business-outline"
    | "calendar-outline"
    | "compass-outline"
    | "hand-left-outline"
    | "sparkles-outline"
    | "school-outline"
    | "library-outline"
    | "person-outline"
    | "shield-checkmark-outline";
};

const MENU_GROUPS: ReadonlyArray<{
  title: string;
  items: ReadonlyArray<MenuItem>;
}> = [
  {
    title: "ESSENTIEL",
    items: [
      { label: "Accueil", description: "Votre journée", href: "/", icon: "home-outline" },
      { label: "Lire le Coran", description: "Sourates et lecture", href: "/quran", icon: "book-outline" },
      { label: "Hadiths", description: "Lire et méditer", href: "/hadith", icon: "library-outline" },
      { label: "Écouter", description: "Récitateurs et audio", href: "/listen/reciters", icon: "headset-outline" },
      { label: "Mosquées", description: "Horaires et proximité", href: "/mosques", icon: "business-outline" },
    ],
  },
  {
    title: "AU QUOTIDIEN",
    items: [
      { label: "Calendrier", description: "Dates et événements", href: "/calendar", icon: "calendar-outline" },
      { label: "Qibla", description: "Direction de La Mecque", href: "/qibla", icon: "compass-outline" },
      { label: "Invocations", description: "Dou‘as authentiques", href: "/dua", icon: "hand-left-outline" },
      { label: "Dhikr", description: "Rappels et compteur", href: "/dhikr", icon: "sparkles-outline" },
      { label: "Mémorisation", description: "Suivi du Hifz", href: "/hifz", icon: "school-outline" },
    ],
  },
  {
    title: "OUMMAH",
    items: [
      { label: "Mon profil", description: "Compte et préférences", href: "/profile", icon: "person-outline" },
    ],
  },
];

const ADMIN_EMAIL = "bahri13015@hotmail.fr";

function MosqueLogo({ size = 36 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 34 34">
      <Path
        d="M13 12C13 7.7 17 5 17 5s4 2.7 4 7v2h-8v-2Z"
        fill={colors.goldLight}
      />
      <Rect x="11" y="14" width="12" height="15" rx="1" fill={colors.gold} />
      <Path d="M15 29v-6a2 2 0 0 1 4 0v6h-4Z" fill={colors.purpleDeep} />
      <Path
        d="M4 16c0-3 3-5 3-5s3 2 3 5v2H4v-2Zm20 0c0-3 3-5 3-5s3 2 3 5v2h-6v-2Z"
        fill={colors.goldLight}
      />
      <Rect x="3" y="18" width="8" height="11" rx="1" fill={colors.gold} />
      <Rect x="23" y="18" width="8" height="11" rx="1" fill={colors.gold} />
      <Rect x="5" y="7" width="2" height="9" rx="1" fill={colors.gold} />
      <Rect x="27" y="7" width="2" height="9" rx="1" fill={colors.gold} />
      <Path
        d="M6 4.5 7 7H5l1-2.5Zm22 0L29 7h-2l1-2.5ZM17 1l.8 2H16.2L17 1Z"
        fill={colors.goldLight}
      />
    </Svg>
  );
}

function MenuIcon() {
  return (
    <Svg width={25} height={25} viewBox="0 0 25 25">
      <Path
        d="M4 6.5h17M4 12.5h17M4 18.5h17"
        stroke={colors.goldLight}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
    </Svg>
  );
}

function NotificationIcon({ unread }: { unread: boolean }) {
  return (
    <Svg width={23} height={23} viewBox="0 0 23 23">
      <Path
        d="M5 16h13l-2-3v-4a4.5 4.5 0 0 0-9 0v4l-2 3Zm4.5 3h4"
        fill="none"
        stroke={colors.goldLight}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle
        cx={18.5}
        cy={4.5}
        r={2.3}
        fill={unread ? colors.danger : "#66D99A"}
      />
    </Svg>
  );
}

export default function AppHeader({
  onMenuPress,
  onNotificationPress,
  leftAction = 'menu',
}: AppHeaderProps) {
  const { t } = useI18n();
  const [menuVisible, setMenuVisible] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      const refreshUnreadStatus = async () => {
        const [preferences, readIds, hifzState, mosque, session] = await Promise.all([
          loadNotificationCenterPreferences(),
          loadReadNotificationIds(),
          loadHifzState(),
          getMainMosque(),
          getValidSession().catch(() => null),
        ]);
        const schedule = mosque
          ? await getMosquePrayerSchedule(
              mosque.latitude,
              mosque.longitude,
            ).catch(() => null)
          : null;
        const items = buildNotificationCenterItems({
          preferences,
          schedule,
          hifzState,
          mosqueName: mosque?.name,
        });

        if (active) {
          setHasUnreadNotifications(
            items.some((item) => !readIds.includes(item.id)),
          );
          setIsAdmin(
            session?.user.email?.trim().toLowerCase() === ADMIN_EMAIL,
          );
        }
      };

      void refreshUnreadStatus();
      const intervalId = setInterval(() => {
        void refreshUnreadStatus();
      }, 60_000);

      return () => {
        active = false;
        clearInterval(intervalId);
      };
    }, []),
  );

  const openMenu = () => {
    if (onMenuPress) {
      onMenuPress();
      return;
    }
    setMenuVisible(true);
  };

  const navigate = (href: string) => {
    setMenuVisible(false);
    router.push(href as Href);
  };

  return (
    <>
      <View style={styles.container}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={leftAction === 'back' ? 'Retour' : t("common.menu")}
          onPress={leftAction === 'back' ? () => router.back() : openMenu}
          style={({ pressed }) => [styles.circle, pressed && styles.pressed]}
        >
          {leftAction === 'back' ? (
            <Ionicons name="arrow-back" size={21} color={colors.goldLight} />
          ) : (
            <MenuIcon />
          )}
        </Pressable>
        <View style={styles.brand}>
          <MosqueLogo />
          <Text style={styles.brandText}>{t("common.brand")}</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("common.notifications")}
          onPress={
            onNotificationPress ??
            (() => router.push("/notifications" as Href))
          }
          style={({ pressed }) => [styles.circle, pressed && styles.pressed]}
        >
          <NotificationIcon unread={hasUnreadNotifications} />
        </Pressable>
      </View>

      <Modal
        visible={menuVisible}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setMenuVisible(false)}
      >
        <View style={styles.menuBackdrop}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Fermer le menu"
            onPress={() => setMenuVisible(false)}
            style={StyleSheet.absoluteFill}
          />
          <SafeAreaView edges={["top", "bottom"]} style={styles.menuPanel}>
            <LinearGradient
              pointerEvents="none"
              colors={["rgba(114,51,132,0.24)", "transparent", "rgba(220,160,55,0.07)"]}
              locations={[0, 0.42, 1]}
              style={StyleSheet.absoluteFill}
            />

            <View style={styles.menuHeader}>
              <View style={styles.menuBrand}>
                <View style={styles.menuLogo}>
                  <MosqueLogo size={31} />
                </View>
                <View>
                  <Text style={styles.menuEyebrow}>VOTRE ESPACE</Text>
                  <Text style={styles.menuTitle}>OUMMAH</Text>
                </View>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Fermer"
                onPress={() => setMenuVisible(false)}
                style={styles.menuClose}
              >
                <Ionicons name="close" size={22} color="#FFF8EF" />
              </Pressable>
            </View>

            <Text style={styles.menuWelcome}>Salam, où souhaitez-vous aller ?</Text>

            <ScrollView
              style={styles.menuScroll}
              contentContainerStyle={styles.menuScrollContent}
              showsVerticalScrollIndicator={false}
            >
              {MENU_GROUPS.map((group) => {
                const items =
                  group.title === "OUMMAH" && isAdmin
                    ? [
                        {
                          label: "Espace administrateur",
                          description: "Pilotage, crédits et modération",
                          href: "/admin",
                          icon: "shield-checkmark-outline" as const,
                        },
                        ...group.items,
                      ]
                    : group.items;

                return (
                <View key={group.title} style={styles.menuGroup}>
                  <Text style={styles.menuGroupTitle}>{group.title}</Text>
                  {items.map((item) => (
                    <Pressable
                      key={item.href}
                      accessibilityRole="button"
                      onPress={() => navigate(item.href)}
                      style={({ pressed }) => [
                        styles.menuItem,
                        pressed && styles.menuItemPressed,
                      ]}
                    >
                      <View style={styles.menuItemIcon}>
                        <Ionicons name={item.icon} size={19} color="#F2BE55" />
                      </View>
                      <View style={styles.menuItemCopy}>
                        <Text style={styles.menuItemLabel}>{item.label}</Text>
                        <Text style={styles.menuItemDescription}>{item.description}</Text>
                      </View>
                      <Ionicons
                        name="chevron-forward"
                        size={15}
                        color="rgba(255,244,231,0.35)"
                      />
                    </Pressable>
                  ))}
                </View>
                );
              })}
            </ScrollView>

            <Text style={styles.menuFooter}>Un seul espace pour votre quotidien</Text>
          </SafeAreaView>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    zIndex: 5,
    height: 70,
    paddingHorizontal: 17,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  circle: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: "rgba(12,14,27,0.64)",
  },
  brand: { flexDirection: "row", alignItems: "center" },
  brandText: {
    marginLeft: 12,
    color: colors.goldLight,
    fontFamily: typography.serifMedium,
    fontSize: 24,
    fontWeight: "400",
    letterSpacing: 1.8,
  },
  pressed: { opacity: 0.6 },
  menuBackdrop: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "rgba(3,4,9,0.74)",
  },
  menuPanel: {
    width: "86%",
    maxWidth: 365,
    overflow: "hidden",
    borderTopRightRadius: 30,
    borderBottomRightRadius: 30,
    borderRightWidth: 1,
    borderColor: "rgba(255,227,172,0.18)",
    backgroundColor: "#15111B",
    shadowColor: "#000",
    shadowOpacity: 0.55,
    shadowRadius: 24,
    shadowOffset: { width: 10, height: 0 },
  },
  menuHeader: {
    paddingTop: 9,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  menuBrand: {
    flexDirection: "row",
    alignItems: "center",
  },
  menuLogo: {
    width: 45,
    height: 45,
    marginRight: 10,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "rgba(244,199,103,0.22)",
    backgroundColor: "rgba(255,255,255,0.045)",
  },
  menuEyebrow: {
    color: "rgba(242,190,85,0.70)",
    fontFamily: typography.sans,
    fontSize: 8,
    fontWeight: "700",
    letterSpacing: 1.3,
  },
  menuTitle: {
    color: "#FFE8B3",
    fontFamily: typography.serifSemibold,
    fontSize: 21,
    letterSpacing: 1.2,
  },
  menuClose: {
    width: 37,
    height: 37,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  menuWelcome: {
    marginTop: 20,
    marginHorizontal: 19,
    color: "#FFF8EF",
    fontFamily: typography.serifMedium,
    fontSize: 17,
  },
  menuScroll: {
    flex: 1,
  },
  menuScrollContent: {
    paddingHorizontal: 14,
    paddingBottom: 14,
  },
  menuGroup: {
    marginTop: 17,
  },
  menuGroupTitle: {
    marginBottom: 6,
    marginLeft: 7,
    color: "rgba(242,190,85,0.62)",
    fontFamily: typography.sans,
    fontSize: 8.5,
    fontWeight: "700",
    letterSpacing: 1.15,
  },
  menuItem: {
    minHeight: 54,
    marginBottom: 3,
    paddingHorizontal: 9,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
  },
  menuItemPressed: {
    backgroundColor: "rgba(226,169,58,0.10)",
  },
  menuItemIcon: {
    width: 38,
    height: 38,
    marginRight: 10,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 13,
    borderWidth: 1,
    borderColor: "rgba(244,199,103,0.14)",
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  menuItemCopy: {
    flex: 1,
  },
  menuItemLabel: {
    color: "#FFF7ED",
    fontFamily: typography.serifMedium,
    fontSize: 14.5,
  },
  menuItemDescription: {
    marginTop: 1,
    color: "rgba(231,220,229,0.48)",
    fontFamily: typography.sans,
    fontSize: 9.5,
  },
  menuFooter: {
    paddingVertical: 12,
    textAlign: "center",
    color: "rgba(242,224,202,0.36)",
    fontFamily: typography.serifMedium,
    fontSize: 10,
  },
});
