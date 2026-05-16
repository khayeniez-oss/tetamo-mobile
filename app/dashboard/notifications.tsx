import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
    ArrowLeft,
    Bell,
    CheckCircle2,
    ChevronRight,
    Clock,
    CreditCard,
    FileText,
    Home,
    Languages,
    Mail,
    PackageCheck,
    RefreshCcw,
    ShieldCheck,
} from "lucide-react-native";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import {
    ActivityIndicator,
    Linking,
    Pressable,
    RefreshControl,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { supabase } from "../../lib/supabase";

type Language = "en" | "id";

type NotificationRow = {
  id: string;
  user_id: string;
  role: string | null;
  type: string | null;
  title: string;
  message: string;
  link: string | null;
  read_at: string | null;
  metadata: Record<string, any> | null;
  created_at: string;
};

export default function NotificationsScreen() {
  const router = useRouter();

  const [language, setLanguage] = useState<Language>("en");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);
  const [errorMessage, setErrorMessage] = useState("");

  const isId = language === "id";

  const ui = useMemo(() => {
    if (isId) {
      return {
        back: "Kembali",
        badge: "NOTIFIKASI",
        title: "Pusat Notifikasi",
        subtitle:
          "Lihat update penting tentang pembayaran, listing, paket, inquiry, dan pesan dari Tetamo.",
        loading: "Memuat notifikasi...",
        emptyTitle: "Belum ada notifikasi",
        emptyText:
          "Update pembayaran, listing, paket agen, inquiry, dan pesan penting akan muncul di sini.",
        markAllRead: "Tandai Semua Dibaca",
        refresh: "Refresh",
        unread: "Belum dibaca",
        read: "Dibaca",
        settings: "Pengaturan Notifikasi",
        failed: "Gagal memuat notifikasi.",
      };
    }

    return {
      back: "Back",
      badge: "NOTIFICATIONS",
      title: "Notification Center",
      subtitle:
        "View important updates about payments, listings, packages, inquiries, and Tetamo messages.",
      loading: "Loading notifications...",
      emptyTitle: "No notifications yet",
      emptyText:
        "Payment, listing, agent package, inquiry, and important account updates will appear here.",
      markAllRead: "Mark All as Read",
      refresh: "Refresh",
      unread: "Unread",
      read: "Read",
      settings: "Notification Settings",
      failed: "Failed to load notifications.",
    };
  }, [isId]);

  const unreadCount = notifications.filter((item) => !item.read_at).length;

  const loadNotifications = useCallback(async () => {
    setErrorMessage("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.id) {
      setNotifications([]);
      setLoading(false);
      setRefreshing(false);
      return;
    }

    const { data, error } = await supabase
      .from("notifications")
      .select(
        "id, user_id, role, type, title, message, link, read_at, metadata, created_at"
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      setErrorMessage(error.message || ui.failed);
      setNotifications([]);
      setLoading(false);
      setRefreshing(false);
      return;
    }

    setNotifications((data || []) as NotificationRow[]);
    setLoading(false);
    setRefreshing(false);
  }, [ui.failed]);

  useEffect(() => {
    void loadNotifications();
  }, [loadNotifications]);

  async function handleRefresh() {
    setRefreshing(true);
    await loadNotifications();
  }

  async function markAsRead(id: string) {
    const now = new Date().toISOString();

    setNotifications((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              read_at: item.read_at || now,
            }
          : item
      )
    );

    await supabase
      .from("notifications")
      .update({
        read_at: now,
      })
      .eq("id", id)
      .is("read_at", null);
  }

  async function markAllAsRead() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.id) return;

    const now = new Date().toISOString();

    setNotifications((prev) =>
      prev.map((item) => ({
        ...item,
        read_at: item.read_at || now,
      }))
    );

    await supabase
      .from("notifications")
      .update({
        read_at: now,
      })
      .eq("user_id", user.id)
      .is("read_at", null);
  }

  async function openNotification(item: NotificationRow) {
    if (!item.read_at) {
      await markAsRead(item.id);
    }

    if (!item.link) return;

    if (item.link.startsWith("http://") || item.link.startsWith("https://")) {
      await Linking.openURL(item.link);
      return;
    }

    router.push(item.link as any);
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />

      <View style={styles.topBar}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft color="#ffffff" size={15} />
          <Text style={styles.backText}>{ui.back}</Text>
        </Pressable>

        <View style={styles.langToggle}>
          <Languages color="#e6c15c" size={14} />

          {(["en", "id"] as Language[]).map((item) => (
            <Pressable
              key={item}
              style={[
                styles.langButton,
                language === item && styles.langButtonActive,
              ]}
              onPress={() => setLanguage(item)}
            >
              <Text
                style={[
                  styles.langText,
                  language === item && styles.langTextActive,
                ]}
              >
                {item.toUpperCase()}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            tintColor="#e6c15c"
            refreshing={refreshing}
            onRefresh={handleRefresh}
          />
        }
      >
        <View style={styles.heroCard}>
          <View style={styles.heroIcon}>
            <Bell color="#111111" size={26} />
          </View>

          <Text style={styles.badge}>{ui.badge}</Text>
          <Text style={styles.title}>{ui.title}</Text>
          <Text style={styles.subtitle}>{ui.subtitle}</Text>

          <View style={styles.countPill}>
            <Text style={styles.countText}>
              {unreadCount} {ui.unread}
            </Text>
          </View>
        </View>

        <View style={styles.actionRow}>
          <Pressable
            style={[
              styles.actionButton,
              unreadCount === 0 && styles.actionButtonDisabled,
            ]}
            disabled={unreadCount === 0}
            onPress={markAllAsRead}
          >
            <CheckCircle2 color="#111111" size={16} />
            <Text style={styles.actionButtonText}>{ui.markAllRead}</Text>
          </Pressable>

          <Pressable style={styles.secondaryActionButton} onPress={handleRefresh}>
            <RefreshCcw color="#ffffff" size={15} />
            <Text style={styles.secondaryActionText}>{ui.refresh}</Text>
          </Pressable>
        </View>

        <Pressable
          style={styles.settingsButton}
          onPress={() => router.push("/settings/notifications" as any)}
        >
          <ShieldCheck color="#e6c15c" size={18} />
          <Text style={styles.settingsText}>{ui.settings}</Text>
          <ChevronRight color="#ffffff" size={16} />
        </Pressable>

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator color="#e6c15c" />
            <Text style={styles.loadingText}>{ui.loading}</Text>
          </View>
        ) : null}

        {!loading && errorMessage ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        ) : null}

        {!loading && !errorMessage && notifications.length === 0 ? (
          <View style={styles.emptyCard}>
            <Bell color="#e6c15c" size={34} />
            <Text style={styles.emptyTitle}>{ui.emptyTitle}</Text>
            <Text style={styles.emptyText}>{ui.emptyText}</Text>
          </View>
        ) : null}

        {!loading && !errorMessage && notifications.length > 0 ? (
          <View style={styles.list}>
            {notifications.map((item) => (
              <NotificationCard
                key={item.id}
                item={item}
                isId={isId}
                readLabel={ui.read}
                unreadLabel={ui.unread}
                onPress={() => void openNotification(item)}
              />
            ))}
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function NotificationCard({
  item,
  isId,
  readLabel,
  unreadLabel,
  onPress,
}: {
  item: NotificationRow;
  isId: boolean;
  readLabel: string;
  unreadLabel: string;
  onPress: () => void;
}) {
  const unread = !item.read_at;

  return (
    <Pressable
      style={[styles.notificationCard, unread && styles.notificationCardUnread]}
      onPress={onPress}
    >
      <View style={styles.notificationTop}>
        <View style={[styles.notificationIcon, unread && styles.unreadIcon]}>
          {getNotificationIcon(item.type)}
        </View>

        <View style={styles.notificationTextBox}>
          <View style={styles.notificationTitleRow}>
            <Text style={styles.notificationTitle} numberOfLines={2}>
              {item.title}
            </Text>

            {unread ? <View style={styles.unreadDot} /> : null}
          </View>

          <Text style={styles.notificationMessage}>{item.message}</Text>

          <View style={styles.notificationMetaRow}>
            <Clock color="#8f8f8f" size={12} />
            <Text style={styles.notificationDate}>
              {formatDate(item.created_at, isId)}
            </Text>

            <Text style={styles.notificationType}>
              {String(item.type || "general").replaceAll("_", " ").toUpperCase()}
            </Text>

            <Text style={unread ? styles.unreadLabel : styles.readLabel}>
              {unread ? unreadLabel : readLabel}
            </Text>
          </View>
        </View>

        {item.link ? <ChevronRight color="#ffffff" size={16} /> : null}
      </View>
    </Pressable>
  );
}

function getNotificationIcon(type?: string | null): ReactNode {
  const value = String(type || "").toLowerCase();

  if (value.includes("payment")) {
    return <CreditCard color="#e6c15c" size={18} />;
  }

  if (value.includes("listing")) {
    return <Home color="#e6c15c" size={18} />;
  }

  if (value.includes("package") || value.includes("membership")) {
    return <PackageCheck color="#e6c15c" size={18} />;
  }

  if (value.includes("receipt") || value.includes("invoice")) {
    return <FileText color="#e6c15c" size={18} />;
  }

  if (value.includes("message") || value.includes("admin")) {
    return <Mail color="#e6c15c" size={18} />;
  }

  return <Bell color="#e6c15c" size={18} />;
}

function formatDate(value: string, isId: boolean) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat(isId ? "id-ID" : "en-US", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#050505",
  },
  topBar: {
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 10,
    backgroundColor: "#050505",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  backButton: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#333333",
    backgroundColor: "#101010",
    paddingHorizontal: 11,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  backText: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "900",
  },
  langToggle: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#5b4a24",
    overflow: "hidden",
    paddingLeft: 8,
  },
  langButton: {
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  langButtonActive: {
    backgroundColor: "#e6c15c",
  },
  langText: {
    color: "#e6c15c",
    fontSize: 9.5,
    fontWeight: "900",
  },
  langTextActive: {
    color: "#111111",
  },
  scroll: {
    flex: 1,
    backgroundColor: "#050505",
  },
  content: {
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 38,
  },
  heroCard: {
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "#303030",
    backgroundColor: "#101010",
    padding: 18,
    marginBottom: 13,
  },
  heroIcon: {
    width: 54,
    height: 54,
    borderRadius: 19,
    backgroundColor: "#e6c15c",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 13,
  },
  badge: {
    color: "#e6c15c",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.2,
  },
  title: {
    color: "#ffffff",
    fontSize: 27,
    lineHeight: 33,
    fontWeight: "900",
    letterSpacing: -0.6,
    marginTop: 6,
  },
  subtitle: {
    color: "#d6d6d6",
    fontSize: 12.3,
    lineHeight: 19,
    fontWeight: "700",
    marginTop: 8,
  },
  countPill: {
    alignSelf: "flex-start",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#705d2c",
    backgroundColor: "#211a0b",
    paddingHorizontal: 11,
    paddingVertical: 7,
    marginTop: 13,
  },
  countText: {
    color: "#e6c15c",
    fontSize: 11,
    fontWeight: "900",
  },
  actionRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 10,
  },
  actionButton: {
    flex: 1,
    minHeight: 46,
    borderRadius: 16,
    backgroundColor: "#e6c15c",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },
  actionButtonDisabled: {
    opacity: 0.5,
  },
  actionButtonText: {
    color: "#111111",
    fontSize: 12,
    fontWeight: "900",
  },
  secondaryActionButton: {
    minHeight: 46,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#343434",
    backgroundColor: "#101010",
    paddingHorizontal: 13,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },
  secondaryActionText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "900",
  },
  settingsButton: {
    minHeight: 54,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#303030",
    backgroundColor: "#101010",
    paddingHorizontal: 13,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 13,
  },
  settingsText: {
    color: "#ffffff",
    fontSize: 12.5,
    fontWeight: "900",
    flex: 1,
  },
  loadingBox: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#303030",
    backgroundColor: "#101010",
    padding: 18,
    alignItems: "center",
    gap: 10,
  },
  loadingText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "800",
  },
  errorBox: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#7f1d1d",
    backgroundColor: "#2a0d0d",
    padding: 14,
  },
  errorText: {
    color: "#fecaca",
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "800",
    textAlign: "center",
  },
  emptyCard: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#303030",
    backgroundColor: "#101010",
    padding: 24,
    alignItems: "center",
  },
  emptyTitle: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "900",
    marginTop: 10,
  },
  emptyText: {
    color: "#a9a9a9",
    fontSize: 11.5,
    lineHeight: 17,
    fontWeight: "700",
    textAlign: "center",
    marginTop: 6,
  },
  list: {
    gap: 11,
  },
  notificationCard: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#303030",
    backgroundColor: "#101010",
    padding: 13,
  },
  notificationCardUnread: {
    borderColor: "#705d2c",
    backgroundColor: "#211a0b",
  },
  notificationTop: {
    flexDirection: "row",
    gap: 11,
    alignItems: "flex-start",
  },
  notificationIcon: {
    width: 42,
    height: 42,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#303030",
    backgroundColor: "#050505",
    alignItems: "center",
    justifyContent: "center",
  },
  unreadIcon: {
    borderColor: "#705d2c",
    backgroundColor: "#101010",
  },
  notificationTextBox: {
    flex: 1,
  },
  notificationTitleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  notificationTitle: {
    color: "#ffffff",
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "900",
    flex: 1,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    backgroundColor: "#e6c15c",
    marginTop: 5,
  },
  notificationMessage: {
    color: "#d6d6d6",
    fontSize: 11.5,
    lineHeight: 17,
    fontWeight: "700",
    marginTop: 5,
  },
  notificationMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 9,
    flexWrap: "wrap",
  },
  notificationDate: {
    color: "#8f8f8f",
    fontSize: 10.5,
    fontWeight: "800",
  },
  notificationType: {
    color: "#e6c15c",
    fontSize: 9.5,
    fontWeight: "900",
    marginLeft: 6,
  },
  unreadLabel: {
    color: "#e6c15c",
    fontSize: 9.5,
    fontWeight: "900",
    marginLeft: 6,
  },
  readLabel: {
    color: "#8f8f8f",
    fontSize: 9.5,
    fontWeight: "900",
    marginLeft: 6,
  },
});