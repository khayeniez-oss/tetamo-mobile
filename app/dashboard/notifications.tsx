import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";

import {
  ArrowLeft,
  Bell,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock3,
  CreditCard,
  FileText,
  Languages,
  MessageCircle,
  RefreshCcw,
  Settings,
  ShieldCheck,
} from "lucide-react-native";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { supabase } from "../../lib/supabase";

/*
 * =====================================================
 * TYPES
 * =====================================================
 */

type Language = "en" | "id";

type NotificationRow = {
  id: string;
  user_id: string;

  related_user_id: string | null;
  property_id: string | null;
  lead_id: string | null;

  type: string;
  title: string;
  body: string | null;

  audience: string | null;
  is_read: boolean | null;
  priority: string | null;

  read_at: string | null;
  created_at: string;
};

/*
 * =====================================================
 * DESIGN
 * =====================================================
 */

const BLACK = "#111111";
const WHITE = "#FFFFFF";
const CREAM = "#FBFAF7";

const GOLD_DARK = "#B8892E";
const GOLD_ACTIVE = "#F0D889";
const GOLD_SOFT = "#F4E8C5";

const BORDER = "#E8E1D7";
const MUTED = "#777169";
const SOFT = "#F5F1EA";
const RED = "#B84A4A";

/*
 * =====================================================
 * HELPERS
 * =====================================================
 */

function normalizeType(value?: string | null) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function getNotificationRoute(
  item: NotificationRow,
  allowBusinessRoutes: boolean
) {
  const type =
    normalizeType(item.type);

  /*
   * Tetamo Marketplace is consumer-facing.
   * Owner/Agent business destinations belong
   * in Tetamo Partner.
   *
   * Preserve the existing Admin behaviour.
   */
  if (!allowBusinessRoutes) {
    return null;
  }

  /*
   * Leads / WhatsApp enquiries
   */
  if (
    type.includes("lead") ||
    type.includes("whatsapp") ||
    type.includes("inquiry")
  ) {
    return {
      pathname:
        "/dashboard/leads",
      params: {
        lead_id:
          item.lead_id || "",
        property_id:
          item.property_id || "",
        type:
          item.type || "",
      },
    };
  }

  /*
   * Viewing requests / schedules
   */
  if (
    type.includes("viewing") ||
    type.includes("schedule")
  ) {
    return {
      pathname:
        "/dashboard/viewing-schedule",
      params: {
        lead_id:
          item.lead_id || "",
        property_id:
          item.property_id || "",
        type:
          item.type || "",
      },
    };
  }

  /*
   * Payments / membership
   */
  if (
    type.includes("payment") ||
    type.includes("invoice") ||
    type.includes("receipt") ||
    type.includes("membership") ||
    type.includes("package") ||
    type.includes("checkout") ||
    type.includes("transaction")
  ) {
    return {
      pathname:
        "/dashboard/payments",
      params: {
        property_id:
          item.property_id || "",
        type:
          item.type || "",
      },
    };
  }

  /*
   * Listings / property status
   */
  if (
    type.includes("listing") ||
    type.includes("property") ||
    type.includes("approval") ||
    type.includes("approved") ||
    type.includes("rejected") ||
    type.includes("verification")
  ) {
    return {
      pathname:
        "/dashboard/listings",
      params: {
        property_id:
          item.property_id || "",
        type:
          item.type || "",
      },
    };
  }

  /*
   * Unknown/general notification:
   * keep user inside Notification Center.
   */
  return null;
}

function getNotificationKind(
  typeValue: string | null,
  isId: boolean
) {
  const type =
    normalizeType(typeValue);

  if (
    type.includes("whatsapp") ||
    type.includes("lead") ||
    type.includes("inquiry")
  ) {
    return isId
      ? "Inquiry"
      : "Inquiry";
  }

  if (
    type.includes("viewing") ||
    type.includes("schedule")
  ) {
    return isId
      ? "Viewing"
      : "Viewing";
  }

  if (
    type.includes("payment") ||
    type.includes("invoice") ||
    type.includes("receipt") ||
    type.includes("membership") ||
    type.includes("package")
  ) {
    return isId
      ? "Pembayaran"
      : "Payment";
  }

  if (
    type.includes("listing") ||
    type.includes("property") ||
    type.includes("approval") ||
    type.includes("approved") ||
    type.includes("rejected") ||
    type.includes("verification")
  ) {
    return isId
      ? "Listing"
      : "Listing";
  }

  if (
    type.includes("admin") ||
    type.includes("account") ||
    type.includes("security")
  ) {
    return isId
      ? "Akun"
      : "Account";
  }

  return isId
    ? "Update"
    : "Update";
}

function formatNotificationDate(
  value: string,
  isId: boolean
) {
  try {
    const date =
      new Date(value);

    return date.toLocaleString(
      isId
        ? "id-ID"
        : "en-US",
      {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      }
    );
  } catch {
    return "";
  }
}

/*
 * =====================================================
 * SCREEN
 * =====================================================
 */

export default function NotificationsScreen() {
  const router =
    useRouter();

  const [
    language,
    setLanguage,
  ] =
    useState<Language>("en");

  const [
    userId,
    setUserId,
  ] =
    useState<string | null>(
      null
    );

  const [
    profileRole,
    setProfileRole,
  ] =
    useState("");

  const [
    notifications,
    setNotifications,
  ] =
    useState<
      NotificationRow[]
    >([]);

  const [
    unreadCount,
    setUnreadCount,
  ] =
    useState(0);

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    refreshing,
    setRefreshing,
  ] =
    useState(false);

  const [
    realtimeConnected,
    setRealtimeConnected,
  ] =
    useState(false);

  const [
    errorMessage,
    setErrorMessage,
  ] =
    useState("");

  const isId =
    language === "id";

  /*
   * ===================================================
   * COPY
   * ===================================================
   */

  const ui =
    useMemo(() => {
      if (isId) {
        return {
          back:
            "Kembali",

          title:
            "Pusat Notifikasi",

          subtitle:
            "Update penting untuk akun dan aktivitas properti Anda.",

          unread:
            "belum dibaca",

          live:
            "Update langsung",

          markAll:
            "Tandai Semua Dibaca",

          refresh:
            "Refresh",

          settings:
            "Pengaturan Notifikasi",

          settingsDesc:
            "Atur push, email, suara, dan jenis notifikasi.",

          recent:
            "Terbaru",

          loading:
            "Memuat notifikasi...",

          failed:
            "Gagal memuat notifikasi.",

          retry:
            "Coba Lagi",

          emptyTitle:
            "Belum ada notifikasi",

          emptyText:
            "Update listing, inquiry, viewing, pembayaran, paket, dan akun akan muncul di sini.",

          newLabel:
            "Baru",

          high:
            "Penting",
        };
      }

      return {
        back:
          "Back",

        title:
          "Notification Center",

        subtitle:
          "Important updates for your account and property activity.",

        unread:
          "unread",

        live:
          "Live updates",

        markAll:
          "Mark All as Read",

        refresh:
          "Refresh",

        settings:
          "Notification Settings",

        settingsDesc:
          "Manage push, email, sound, and notification types.",

        recent:
          "Recent",

        loading:
          "Loading notifications...",

        failed:
          "Failed to load notifications.",

        retry:
          "Try Again",

        emptyTitle:
          "No notifications yet",

        emptyText:
          "Listing, inquiry, viewing, payment, package, and account updates will appear here.",

        newLabel:
          "New",

        high:
          "Important",
      };
    }, [isId]);

  /*
   * ===================================================
   * LOAD NOTIFICATIONS
   * ===================================================
   */

  const loadNotifications =
    useCallback(
      async (
        options?: {
          silent?: boolean;
        }
      ) => {
        if (
          !options?.silent
        ) {
          setLoading(true);
        }

        setErrorMessage("");

        try {
          const {
            data: {
              user,
            },
            error:
              authError,
          } =
            await supabase.auth.getUser();

          if (
            authError ||
            !user?.id
          ) {
            setUserId(null);
            setProfileRole("");
            setNotifications(
              []
            );
            setUnreadCount(
              0
            );

            return;
          }

          setUserId(
            user.id
          );

          const {
            data:
              roleProfile,
            error:
              roleError,
          } =
            await supabase
              .from(
                "profiles"
              )
              .select(
                "role"
              )
              .eq(
                "id",
                user.id
              )
              .maybeSingle();

          if (
            roleError
          ) {
            setProfileRole(
              ""
            );
          } else {
            setProfileRole(
              normalizeType(
                roleProfile?.role
              )
            );
          }

          const [
            listResult,
            countResult,
          ] =
            await Promise.all([
              supabase
                .from(
                  "notifications"
                )
                .select(
                  `
                  id,
                  user_id,
                  related_user_id,
                  property_id,
                  lead_id,
                  type,
                  title,
                  body,
                  audience,
                  is_read,
                  priority,
                  read_at,
                  created_at
                  `
                )
                .eq(
                  "user_id",
                  user.id
                )
                .order(
                  "created_at",
                  {
                    ascending:
                      false,
                  }
                )
                .limit(
                  100
                ),

              supabase
                .from(
                  "notifications"
                )
                .select(
                  "id",
                  {
                    count:
                      "exact",
                    head:
                      true,
                  }
                )
                .eq(
                  "user_id",
                  user.id
                )
                .or(
                  "is_read.eq.false,is_read.is.null"
                ),
            ]);

          if (
            listResult.error
          ) {
            throw listResult.error;
          }

          if (
            countResult.error
          ) {
            throw countResult.error;
          }

          setNotifications(
            (listResult.data ||
              []) as NotificationRow[]
          );

          setUnreadCount(
            countResult.count ||
              0
          );
        } catch (
          error: any
        ) {
          console.error(
            "Notification Center load error:",
            error
          );

          setErrorMessage(
            error?.message ||
              ui.failed
          );
        } finally {
          setLoading(false);
          setRefreshing(
            false
          );
        }
      },
      [ui.failed]
    );

  /*
   * ===================================================
   * INITIAL LOAD
   * ===================================================
   */

  useEffect(() => {
    void loadNotifications();
  }, [loadNotifications]);

  /*
   * ===================================================
   * SUPABASE REALTIME
   *
   * Same concept as the working website bell.
   * Any INSERT / UPDATE / DELETE for this user
   * refreshes the Notification Center.
   * ===================================================
   */

  useEffect(() => {
    if (!userId) {
      setRealtimeConnected(
        false
      );

      return;
    }

    const channel =
      supabase
        .channel(
          `mobile-notifications-${userId}`
        )
        .on(
          "postgres_changes",
          {
            event:
              "*",
            schema:
              "public",
            table:
              "notifications",
            filter:
              `user_id=eq.${userId}`,
          },
          () => {
            void loadNotifications(
              {
                silent:
                  true,
              }
            );
          }
        )
        .subscribe(
          (status) => {
            setRealtimeConnected(
              status ===
                "SUBSCRIBED"
            );
          }
        );

    return () => {
      setRealtimeConnected(
        false
      );

      void supabase.removeChannel(
        channel
      );
    };
  }, [
    userId,
    loadNotifications,
  ]);

  /*
   * ===================================================
   * REFRESH
   * ===================================================
   */

  async function handleRefresh() {
    setRefreshing(true);

    await loadNotifications(
      {
        silent: true,
      }
    );
  }

  /*
   * ===================================================
   * MARK ONE AS READ
   *
   * is_read is the canonical website/mobile state.
   * read_at is also populated as useful audit data.
   * ===================================================
   */

  async function markAsRead(
    item: NotificationRow
  ) {
    if (
      item.is_read ===
      true
    ) {
      return;
    }

    if (!userId) {
      return;
    }

    const now =
      new Date().toISOString();

    const previousNotifications =
      notifications;

    const previousUnreadCount =
      unreadCount;

    setNotifications(
      (previous) =>
        previous.map(
          (
            current
          ) =>
            current.id ===
            item.id
              ? {
                  ...current,
                  is_read:
                    true,
                  read_at:
                    current.read_at ||
                    now,
                }
              : current
        )
    );

    setUnreadCount(
      (previous) =>
        Math.max(
          0,
          previous - 1
        )
    );

    const {
      error,
    } =
      await supabase
        .from(
          "notifications"
        )
        .update({
          is_read:
            true,
          read_at:
            item.read_at ||
            now,
        })
        .eq(
          "id",
          item.id
        )
        .eq(
          "user_id",
          userId
        );

    if (error) {
      console.error(
        "Mark notification read error:",
        error
      );

      setNotifications(
        previousNotifications
      );

      setUnreadCount(
        previousUnreadCount
      );

      setErrorMessage(
        error.message ||
          ui.failed
      );
    }
  }

  /*
   * ===================================================
   * MARK ALL AS READ
   * ===================================================
   */

  async function markAllAsRead() {
    if (
      !userId ||
      unreadCount <= 0
    ) {
      return;
    }

    const now =
      new Date().toISOString();

    const previousNotifications =
      notifications;

    const previousUnreadCount =
      unreadCount;

    setNotifications(
      (previous) =>
        previous.map(
          (item) => ({
            ...item,
            is_read:
              true,
            read_at:
              item.read_at ||
              now,
          })
        )
    );

    setUnreadCount(0);

    const {
      error,
    } =
      await supabase
        .from(
          "notifications"
        )
        .update({
          is_read:
            true,
          read_at:
            now,
        })
        .eq(
          "user_id",
          userId
        )
        .or(
          "is_read.eq.false,is_read.is.null"
        );

    if (error) {
      console.error(
        "Mark all notifications read error:",
        error
      );

      setNotifications(
        previousNotifications
      );

      setUnreadCount(
        previousUnreadCount
      );

      setErrorMessage(
        error.message ||
          ui.failed
      );
    }
  }

  /*
   * ===================================================
   * OPEN NOTIFICATION
   *
   * We no longer depend on notification.link.
   * Route comes from type + property_id + lead_id,
   * matching the website's notification behaviour.
   * ===================================================
   */

  async function openNotification(
    item: NotificationRow
  ) {
    if (
      item.is_read !==
      true
    ) {
      await markAsRead(
        item
      );
    }

    const destination =
      getNotificationRoute(
        item,
        profileRole ===
          "admin"
      );

    if (!destination) {
      return;
    }

    router.push(
      destination as any
    );
  }

  /*
   * ===================================================
   * NOTIFICATION ICON
   * ===================================================
   */

  function renderIcon(
    item: NotificationRow
  ) {
    const type =
      normalizeType(
        item.type
      );

    if (
      type.includes(
        "whatsapp"
      ) ||
      type.includes(
        "lead"
      ) ||
      type.includes(
        "inquiry"
      )
    ) {
      return (
        <MessageCircle
          size={19}
          color={
            GOLD_DARK
          }
        />
      );
    }

    if (
      type.includes(
        "viewing"
      ) ||
      type.includes(
        "schedule"
      )
    ) {
      return (
        <CalendarDays
          size={19}
          color={
            GOLD_DARK
          }
        />
      );
    }

    if (
      type.includes(
        "payment"
      ) ||
      type.includes(
        "invoice"
      ) ||
      type.includes(
        "receipt"
      ) ||
      type.includes(
        "membership"
      ) ||
      type.includes(
        "package"
      )
    ) {
      return (
        <CreditCard
          size={19}
          color={
            GOLD_DARK
          }
        />
      );
    }

    if (
      type.includes(
        "listing"
      ) ||
      type.includes(
        "property"
      ) ||
      type.includes(
        "approval"
      ) ||
      type.includes(
        "rejected"
      )
    ) {
      return (
        <FileText
          size={19}
          color={
            GOLD_DARK
          }
        />
      );
    }

    if (
      type.includes(
        "security"
      ) ||
      type.includes(
        "account"
      )
    ) {
      return (
        <ShieldCheck
          size={19}
          color={
            GOLD_DARK
          }
        />
      );
    }

    return (
      <Bell
        size={19}
        color={
          GOLD_DARK
        }
      />
    );
  }

  /*
   * ===================================================
   * SCREEN
   * ===================================================
   */

  return (
    <SafeAreaView
      style={
        styles.safeArea
      }
    >
      <StatusBar
        style="dark"
      />

      {/* =================================
          HEADER
      ================================= */}

      <View
        style={
          styles.topBar
        }
      >
        <Pressable
          style={
            styles.backButton
          }
          onPress={() =>
            router.back()
          }
        >
          <ArrowLeft
            color={BLACK}
            size={17}
          />

          <Text
            style={
              styles.backText
            }
          >
            {ui.back}
          </Text>
        </Pressable>

        <View
          style={
            styles.headerTitleBox
          }
        >
          <Text
            style={
              styles.headerTitle
            }
            numberOfLines={
              1
            }
          >
            {ui.title}
          </Text>
        </View>

        <View
          style={
            styles.languageControl
          }
        >
          <Languages
            color={
              GOLD_DARK
            }
            size={14}
          />

          {(
            [
              "en",
              "id",
            ] as Language[]
          ).map(
            (item) => {
              const active =
                language ===
                item;

              return (
                <Pressable
                  key={
                    item
                  }
                  style={[
                    styles.languageButton,
                    active &&
                      styles.languageButtonActive,
                  ]}
                  onPress={() =>
                    setLanguage(
                      item
                    )
                  }
                >
                  <Text
                    style={[
                      styles.languageText,
                      active &&
                        styles.languageTextActive,
                    ]}
                  >
                    {item.toUpperCase()}
                  </Text>
                </Pressable>
              );
            }
          )}
        </View>
      </View>

      <ScrollView
        style={
          styles.scroll
        }
        contentContainerStyle={
          styles.content
        }
        showsVerticalScrollIndicator={
          false
        }
        refreshControl={
          <RefreshControl
            tintColor={
              GOLD_DARK
            }
            refreshing={
              refreshing
            }
            onRefresh={
              handleRefresh
            }
          />
        }
      >
        {/* =================================
            SUMMARY
        ================================= */}

        <View
          style={
            styles.summaryCard
          }
        >
          <View
            style={
              styles.summaryIcon
            }
          >
            <Bell
              color={
                GOLD_DARK
              }
              size={22}
            />
          </View>

          <View
            style={
              styles.summaryCopy
            }
          >
            <Text
              style={
                styles.summaryTitle
              }
            >
              {ui.title}
            </Text>

            <Text
              style={
                styles.summarySubtitle
              }
            >
              {ui.subtitle}
            </Text>

            <View
              style={
                styles.liveRow
              }
            >
              <View
                style={[
                  styles.liveDot,
                  realtimeConnected
                    ? styles.liveDotActive
                    : styles.liveDotIdle,
                ]}
              />

              <Text
                style={
                  styles.liveText
                }
              >
                {ui.live}
              </Text>
            </View>
          </View>

          <View
            style={
              styles.unreadCountBox
            }
          >
            <Text
              style={
                styles.unreadCount
              }
            >
              {unreadCount >
              99
                ? "99+"
                : unreadCount}
            </Text>

            <Text
              style={
                styles.unreadCountLabel
              }
            >
              {ui.unread}
            </Text>
          </View>
        </View>

        {/* =================================
            ACTIONS
        ================================= */}

        <View
          style={
            styles.actionRow
          }
        >
          <Pressable
            style={[
              styles.primaryAction,
              unreadCount ===
                0 &&
                styles.disabledAction,
            ]}
            disabled={
              unreadCount ===
              0
            }
            onPress={() =>
              void markAllAsRead()
            }
          >
            <CheckCircle2
              color={BLACK}
              size={15}
            />

            <Text
              style={
                styles.primaryActionText
              }
            >
              {ui.markAll}
            </Text>
          </Pressable>

          <Pressable
            style={
              styles.refreshAction
            }
            onPress={() =>
              void handleRefresh()
            }
          >
            <RefreshCcw
              color={
                GOLD_DARK
              }
              size={14}
            />

            <Text
              style={
                styles.refreshActionText
              }
            >
              {ui.refresh}
            </Text>
          </Pressable>
        </View>

        {/* =================================
            SETTINGS
        ================================= */}

        <Pressable
          style={
            styles.settingsCard
          }
          onPress={() =>
            router.push(
              "/settings/notifications" as any
            )
          }
        >
          <View
            style={
              styles.settingsIcon
            }
          >
            <Settings
              color={
                GOLD_DARK
              }
              size={19}
            />
          </View>

          <View
            style={
              styles.settingsCopy
            }
          >
            <Text
              style={
                styles.settingsTitle
              }
            >
              {ui.settings}
            </Text>

            <Text
              style={
                styles.settingsDescription
              }
            >
              {ui.settingsDesc}
            </Text>
          </View>

          <ChevronRight
            color={MUTED}
            size={18}
          />
        </Pressable>

        {/* =================================
            SECTION TITLE
        ================================= */}

        <View
          style={
            styles.sectionHeader
          }
        >
          <Text
            style={
              styles.sectionTitle
            }
          >
            {ui.recent}
          </Text>

          {!loading &&
          notifications.length >
            0 ? (
            <Text
              style={
                styles.sectionCount
              }
            >
              {
                notifications.length
              }
            </Text>
          ) : null}
        </View>

        {/* =================================
            ERROR
        ================================= */}

        {errorMessage ? (
          <View
            style={
              styles.errorCard
            }
          >
            <Text
              style={
                styles.errorText
              }
            >
              {errorMessage}
            </Text>

            <Pressable
              style={
                styles.retryButton
              }
              onPress={() =>
                void loadNotifications()
              }
            >
              <Text
                style={
                  styles.retryText
                }
              >
                {ui.retry}
              </Text>
            </Pressable>
          </View>
        ) : null}

        {/* =================================
            LOADING
        ================================= */}

        {loading ? (
          <View
            style={
              styles.stateCard
            }
          >
            <ActivityIndicator
              size="small"
              color={
                GOLD_DARK
              }
            />

            <Text
              style={
                styles.stateText
              }
            >
              {ui.loading}
            </Text>
          </View>
        ) : null}

        {/* =================================
            EMPTY
        ================================= */}

        {!loading &&
        !errorMessage &&
        notifications.length ===
          0 ? (
          <View
            style={
              styles.emptyCard
            }
          >
            <View
              style={
                styles.emptyIcon
              }
            >
              <Bell
                color={
                  GOLD_DARK
                }
                size={24}
              />
            </View>

            <Text
              style={
                styles.emptyTitle
              }
            >
              {ui.emptyTitle}
            </Text>

            <Text
              style={
                styles.emptyText
              }
            >
              {ui.emptyText}
            </Text>
          </View>
        ) : null}

        {/* =================================
            NOTIFICATIONS
        ================================= */}

        {!loading &&
          notifications.map(
            (item) => {
              const unread =
                item.is_read !==
                true;

              const destination =
                getNotificationRoute(
                  item,
                  profileRole ===
                    "admin"
                );

              const highPriority =
                normalizeType(
                  item.priority
                ) === "high";

              return (
                <Pressable
                  key={
                    item.id
                  }
                  style={[
                    styles.notificationCard,
                    unread &&
                      styles.notificationCardUnread,
                  ]}
                  onPress={() =>
                    void openNotification(
                      item
                    )
                  }
                >
                  <View
                    style={[
                      styles.notificationIcon,
                      unread &&
                        styles.notificationIconUnread,
                    ]}
                  >
                    {renderIcon(
                      item
                    )}
                  </View>

                  <View
                    style={
                      styles.notificationCopy
                    }
                  >
                    <View
                      style={
                        styles.notificationMetaRow
                      }
                    >
                      <View
                        style={
                          styles.kindPill
                        }
                      >
                        <Text
                          style={
                            styles.kindText
                          }
                        >
                          {getNotificationKind(
                            item.type,
                            isId
                          )}
                        </Text>
                      </View>

                      {unread ? (
                        <View
                          style={
                            styles.newPill
                          }
                        >
                          <Text
                            style={
                              styles.newText
                            }
                          >
                            {
                              ui.newLabel
                            }
                          </Text>
                        </View>
                      ) : null}

                      {highPriority ? (
                        <View
                          style={
                            styles.priorityPill
                          }
                        >
                          <Text
                            style={
                              styles.priorityText
                            }
                          >
                            {ui.high}
                          </Text>
                        </View>
                      ) : null}
                    </View>

                    <Text
                      style={[
                        styles.notificationTitle,
                        unread &&
                          styles.notificationTitleUnread,
                      ]}
                    >
                      {item.title ||
                        "Tetamo"}
                    </Text>

                    {item.body ? (
                      <Text
                        style={
                          styles.notificationBody
                        }
                      >
                        {item.body}
                      </Text>
                    ) : null}

                    <View
                      style={
                        styles.timeRow
                      }
                    >
                      <Clock3
                        size={12}
                        color={
                          MUTED
                        }
                      />

                      <Text
                        style={
                          styles.timeText
                        }
                      >
                        {formatNotificationDate(
                          item.created_at,
                          isId
                        )}
                      </Text>
                    </View>
                  </View>

                  {destination ? (
                    <ChevronRight
                      size={18}
                      color={
                        unread
                          ? GOLD_DARK
                          : MUTED
                      }
                    />
                  ) : null}
                </Pressable>
              );
            }
          )}
      </ScrollView>
    </SafeAreaView>
  );
}

/*
 * =====================================================
 * STYLES
 * =====================================================
 */

const styles =
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor:
        CREAM,
    },

    topBar: {
      minHeight: 58,
      paddingHorizontal:
        16,
      flexDirection:
        "row",
      alignItems:
        "center",
      borderBottomWidth:
        StyleSheet.hairlineWidth,
      borderBottomColor:
        BORDER,
      backgroundColor:
        CREAM,
    },

    backButton: {
      minWidth: 78,
      height: 38,
      flexDirection:
        "row",
      alignItems:
        "center",
      gap: 6,
    },

    backText: {
      fontSize: 13,
      fontWeight:
        "600",
      color: BLACK,
    },

    headerTitleBox: {
      flex: 1,
      alignItems:
        "center",
      paddingHorizontal:
        6,
    },

    headerTitle: {
      fontSize: 16,
      fontWeight:
        "800",
      color: BLACK,
      letterSpacing:
        -0.2,
    },

    languageControl: {
      minWidth: 78,
      height: 34,
      paddingHorizontal:
        5,
      flexDirection:
        "row",
      alignItems:
        "center",
      justifyContent:
        "flex-end",
      gap: 3,
      borderRadius: 12,
      borderWidth: 1,
      borderColor:
        BORDER,
      backgroundColor:
        WHITE,
    },

    languageButton: {
      minWidth: 23,
      height: 23,
      borderRadius:
        7,
      alignItems:
        "center",
      justifyContent:
        "center",
    },

    languageButtonActive: {
      backgroundColor:
        GOLD_SOFT,
    },

    languageText: {
      fontSize: 9,
      fontWeight:
        "800",
      color: MUTED,
    },

    languageTextActive: {
      color:
        GOLD_DARK,
    },

    scroll: {
      flex: 1,
    },

    content: {
      paddingHorizontal:
        16,
      paddingTop:
        16,

      /*
       * Current app root still renders TetamoFooter globally.
       * Keep enough clearance until root navigation is fixed.
       */
      paddingBottom:
        135,
    },

    /*
     * SUMMARY
     */

    summaryCard: {
      flexDirection:
        "row",
      alignItems:
        "center",
      gap: 12,
      padding: 16,
      borderRadius:
        20,
      borderWidth: 1,
      borderColor:
        BORDER,
      backgroundColor:
        WHITE,
    },

    summaryIcon: {
      width: 46,
      height: 46,
      borderRadius:
        15,
      alignItems:
        "center",
      justifyContent:
        "center",
      backgroundColor:
        GOLD_SOFT,
    },

    summaryCopy: {
      flex: 1,
    },

    summaryTitle: {
      fontSize: 17,
      fontWeight:
        "800",
      color: BLACK,
      letterSpacing:
        -0.3,
    },

    summarySubtitle: {
      marginTop: 4,
      fontSize: 12,
      lineHeight: 17,
      color: MUTED,
    },

    liveRow: {
      marginTop: 8,
      flexDirection:
        "row",
      alignItems:
        "center",
      gap: 5,
    },

    liveDot: {
      width: 6,
      height: 6,
      borderRadius:
        3,
    },

    liveDotActive: {
      backgroundColor:
        "#52A56A",
    },

    liveDotIdle: {
      backgroundColor:
        "#C9C4BC",
    },

    liveText: {
      fontSize: 10,
      fontWeight:
        "700",
      color: MUTED,
    },

    unreadCountBox: {
      minWidth: 54,
      paddingVertical:
        9,
      paddingHorizontal:
        8,
      borderRadius:
        14,
      alignItems:
        "center",
      justifyContent:
        "center",
      backgroundColor:
        BLACK,
    },

    unreadCount: {
      fontSize: 18,
      fontWeight:
        "900",
      color:
        GOLD_ACTIVE,
    },

    unreadCountLabel: {
      marginTop: 1,
      fontSize: 8,
      fontWeight:
        "700",
      color: WHITE,
    },

    /*
     * ACTIONS
     */

    actionRow: {
      marginTop: 12,
      flexDirection:
        "row",
      gap: 9,
    },

    primaryAction: {
      flex: 1,
      minHeight: 43,
      paddingHorizontal:
        14,
      flexDirection:
        "row",
      alignItems:
        "center",
      justifyContent:
        "center",
      gap: 7,
      borderRadius:
        13,
      backgroundColor:
        GOLD_ACTIVE,
    },

    primaryActionText: {
      fontSize: 12,
      fontWeight:
        "800",
      color: BLACK,
    },

    disabledAction: {
      opacity: 0.45,
    },

    refreshAction: {
      minWidth: 96,
      minHeight: 43,
      paddingHorizontal:
        13,
      flexDirection:
        "row",
      alignItems:
        "center",
      justifyContent:
        "center",
      gap: 6,
      borderRadius:
        13,
      borderWidth: 1,
      borderColor:
        BORDER,
      backgroundColor:
        WHITE,
    },

    refreshActionText: {
      fontSize: 12,
      fontWeight:
        "700",
      color:
        GOLD_DARK,
    },

    /*
     * SETTINGS
     */

    settingsCard: {
      marginTop: 12,
      padding: 14,
      borderRadius:
        17,
      borderWidth: 1,
      borderColor:
        BORDER,
      backgroundColor:
        WHITE,
      flexDirection:
        "row",
      alignItems:
        "center",
      gap: 11,
    },

    settingsIcon: {
      width: 38,
      height: 38,
      borderRadius:
        12,
      alignItems:
        "center",
      justifyContent:
        "center",
      backgroundColor:
        SOFT,
    },

    settingsCopy: {
      flex: 1,
    },

    settingsTitle: {
      fontSize: 13,
      fontWeight:
        "800",
      color: BLACK,
    },

    settingsDescription: {
      marginTop: 3,
      fontSize: 11,
      lineHeight: 15,
      color: MUTED,
    },

    /*
     * SECTION
     */

    sectionHeader: {
      marginTop: 22,
      marginBottom: 9,
      flexDirection:
        "row",
      alignItems:
        "center",
      justifyContent:
        "space-between",
    },

    sectionTitle: {
      fontSize: 16,
      fontWeight:
        "800",
      color: BLACK,
    },

    sectionCount: {
      minWidth: 28,
      paddingHorizontal:
        8,
      paddingVertical:
        4,
      borderRadius:
        999,
      overflow:
        "hidden",
      textAlign:
        "center",
      fontSize: 10,
      fontWeight:
        "800",
      color:
        GOLD_DARK,
      backgroundColor:
        GOLD_SOFT,
    },

    /*
     * NOTIFICATION CARD
     */

    notificationCard: {
      marginBottom: 9,
      padding: 13,
      borderRadius:
        17,
      borderWidth: 1,
      borderColor:
        BORDER,
      backgroundColor:
        WHITE,
      flexDirection:
        "row",
      alignItems:
        "center",
      gap: 11,
    },

    notificationCardUnread: {
      borderColor:
        "#DEC781",
      backgroundColor:
        "#FFFDF7",
    },

    notificationIcon: {
      width: 42,
      height: 42,
      borderRadius:
        13,
      alignItems:
        "center",
      justifyContent:
        "center",
      backgroundColor:
        SOFT,
    },

    notificationIconUnread: {
      backgroundColor:
        GOLD_SOFT,
    },

    notificationCopy: {
      flex: 1,
      minWidth: 0,
    },

    notificationMetaRow: {
      marginBottom: 6,
      flexDirection:
        "row",
      alignItems:
        "center",
      flexWrap:
        "wrap",
      gap: 5,
    },

    kindPill: {
      paddingHorizontal:
        7,
      paddingVertical:
        3,
      borderRadius:
        999,
      backgroundColor:
        SOFT,
    },

    kindText: {
      fontSize: 8,
      fontWeight:
        "800",
      color: MUTED,
      textTransform:
        "uppercase",
      letterSpacing:
        0.4,
    },

    newPill: {
      paddingHorizontal:
        7,
      paddingVertical:
        3,
      borderRadius:
        999,
      backgroundColor:
        GOLD_ACTIVE,
    },

    newText: {
      fontSize: 8,
      fontWeight:
        "900",
      color: BLACK,
      textTransform:
        "uppercase",
    },

    priorityPill: {
      paddingHorizontal:
        7,
      paddingVertical:
        3,
      borderRadius:
        999,
      backgroundColor:
        "#F8ECEA",
    },

    priorityText: {
      fontSize: 8,
      fontWeight:
        "800",
      color: RED,
      textTransform:
        "uppercase",
    },

    notificationTitle: {
      fontSize: 13,
      lineHeight: 18,
      fontWeight:
        "700",
      color: BLACK,
    },

    notificationTitleUnread: {
      fontWeight:
        "900",
    },

    notificationBody: {
      marginTop: 4,
      fontSize: 11.5,
      lineHeight: 17,
      color: MUTED,
    },

    timeRow: {
      marginTop: 8,
      flexDirection:
        "row",
      alignItems:
        "center",
      gap: 4,
    },

    timeText: {
      fontSize: 9.5,
      fontWeight:
        "600",
      color: MUTED,
    },

    /*
     * STATES
     */

    stateCard: {
      minHeight: 120,
      borderRadius:
        18,
      borderWidth: 1,
      borderColor:
        BORDER,
      backgroundColor:
        WHITE,
      alignItems:
        "center",
      justifyContent:
        "center",
      gap: 10,
    },

    stateText: {
      fontSize: 12,
      color: MUTED,
    },

    emptyCard: {
      paddingVertical:
        34,
      paddingHorizontal:
        24,
      borderRadius:
        18,
      borderWidth: 1,
      borderColor:
        BORDER,
      backgroundColor:
        WHITE,
      alignItems:
        "center",
    },

    emptyIcon: {
      width: 52,
      height: 52,
      borderRadius:
        17,
      alignItems:
        "center",
      justifyContent:
        "center",
      backgroundColor:
        GOLD_SOFT,
    },

    emptyTitle: {
      marginTop: 13,
      fontSize: 15,
      fontWeight:
        "800",
      color: BLACK,
    },

    emptyText: {
      marginTop: 6,
      maxWidth: 290,
      textAlign:
        "center",
      fontSize: 11.5,
      lineHeight: 17,
      color: MUTED,
    },

    errorCard: {
      marginBottom: 10,
      padding: 14,
      borderRadius:
        16,
      borderWidth: 1,
      borderColor:
        "#E8C2BE",
      backgroundColor:
        "#FFF8F7",
    },

    errorText: {
      fontSize: 11.5,
      lineHeight: 17,
      color: RED,
    },

    retryButton: {
      alignSelf:
        "flex-start",
      marginTop: 9,
      paddingHorizontal:
        12,
      paddingVertical:
        7,
      borderRadius:
        10,
      backgroundColor:
        BLACK,
    },

    retryText: {
      fontSize: 10,
      fontWeight:
        "800",
      color: WHITE,
    },
  });