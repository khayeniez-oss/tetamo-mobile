import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";

import {
  ArrowLeft,
  Bell,
  BellRing,
  CheckCircle2,
  CreditCard,
  Home,
  Languages,
  Mail,
  Megaphone,
  MessageCircle,
  Save,
  Send,
  ShieldCheck,
  Volume2,
  VolumeX,
  XCircle,
} from "lucide-react-native";

import type { ReactNode } from "react";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";

import { supabase } from "../../lib/supabase";

import {
  registerTetamoPushNotifications,
  sendTetamoLocalTestNotification,
} from "../../services/pushNotifications";

type Language =
  | "en"
  | "id";

type Preferences = {
  payment_updates: boolean;
  listing_updates: boolean;
  inquiry_updates: boolean;
  admin_messages: boolean;
  marketing_updates: boolean;

  push_notifications: boolean;
  notification_sound: boolean;
  email_notifications: boolean;
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

const DEFAULT_PREFS: Preferences = {
  payment_updates: true,
  listing_updates: true,
  inquiry_updates: true,
  admin_messages: true,
  marketing_updates: false,

  push_notifications: true,
  notification_sound: true,
  email_notifications: true,
};

/*
 * =====================================================
 * SCREEN
 * =====================================================
 */

export default function NotificationSettingsScreen() {
  const router =
    useRouter();

  const [
    language,
    setLanguage,
  ] =
    useState<Language>("en");

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    saving,
    setSaving,
  ] =
    useState(false);

  const [
    registeringPush,
    setRegisteringPush,
  ] =
    useState(false);

  const [
    testingSound,
    setTestingSound,
  ] =
    useState(false);

  const [
    prefs,
    setPrefs,
  ] =
    useState<Preferences>(
      DEFAULT_PREFS
    );

  const [
    pushStatus,
    setPushStatus,
  ] =
    useState("");

  const [
    notice,
    setNotice,
  ] =
    useState("");

  const [
    noticeType,
    setNoticeType,
  ] =
    useState<
      | "success"
      | "error"
      | ""
    >("");

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
            "Pengaturan Notifikasi",

          subtitle:
            "Pilih bagaimana dan jenis notifikasi Tetamo yang ingin Anda terima.",

          loading:
            "Memuat pengaturan...",

          save:
            "Simpan Pengaturan",

          saving:
            "Menyimpan...",

          saved:
            "Pengaturan notifikasi berhasil disimpan.",

          failed:
            "Gagal menyimpan pengaturan notifikasi.",

          loginRequired:
            "Silakan login terlebih dahulu.",

          deliveryTitle:
            "Cara Menerima Notifikasi",

          deliverySub:
            "Pilih channel yang ingin digunakan.",

          categoryTitle:
            "Jenis Notifikasi",

          categorySub:
            "Kontrol update apa yang ingin Anda terima.",

          pushTitle:
            "Push Notifications",

          pushDesc:
            "Terima notifikasi langsung di perangkat ini.",

          soundTitle:
            "Suara Notifikasi",

          soundDesc:
            "Putar suara saat push notification masuk.",

          emailTitle:
            "Email Notifications",

          emailDesc:
            "Terima update penting melalui email akun Tetamo.",

          paymentTitle:
            "Update Pembayaran",

          paymentDesc:
            "Status pembayaran, receipt, invoice, gagal bayar, dan pembayaran berhasil.",

          listingTitle:
            "Update Listing",

          listingDesc:
            "Listing dikirim, review, approved, rejected, atau perlu revisi.",

          inquiryTitle:
            "Inquiry / Leads",

          inquiryDesc:
            "Inquiry WhatsApp, jadwal viewing, buyer/renter, dan leads properti.",

          adminTitle:
            "Pesan Admin",

          adminDesc:
            "Pesan penting dari Tetamo tentang akun, verifikasi, atau keamanan.",

          marketingTitle:
            "Promo & Tips",

          marketingDesc:
            "Tips properti, edukasi, promosi, dan update marketing Tetamo.",

          testNotification:
            "Tes Notifikasi",

          testing:
            "Mengirim Tes...",

          pushRegistered:
            "Push notification berhasil diaktifkan.",

          pushDenied:
            "Izin push notification belum diberikan atau perangkat belum mendukung.",

          testSent:
            "Tes notifikasi berhasil dikirim.",
        };
      }

      return {
        back:
          "Back",

        title:
          "Notification Settings",

        subtitle:
          "Choose how and which Tetamo notifications you want to receive.",

        loading:
          "Loading settings...",

        save:
          "Save Settings",

        saving:
          "Saving...",

        saved:
          "Notification settings saved successfully.",

        failed:
          "Failed to save notification settings.",

        loginRequired:
          "Please log in first.",

        deliveryTitle:
          "How You Receive Notifications",

        deliverySub:
          "Choose the channels you want to use.",

        categoryTitle:
          "Notification Types",

        categorySub:
          "Control which Tetamo updates you receive.",

        pushTitle:
          "Push Notifications",

        pushDesc:
          "Receive alerts directly on this device.",

        soundTitle:
          "Notification Sound",

        soundDesc:
          "Play a sound when push notifications arrive.",

        emailTitle:
          "Email Notifications",

        emailDesc:
          "Receive important updates through your Tetamo account email.",

        paymentTitle:
          "Payment Updates",

        paymentDesc:
          "Payment status, receipts, invoices, failed payments, and successful payments.",

        listingTitle:
          "Listing Updates",

        listingDesc:
          "Listing submitted, review, approved, rejected, or needs revision.",

        inquiryTitle:
          "Inquiries / Leads",

        inquiryDesc:
          "WhatsApp inquiries, viewing requests, buyers/renters, and property leads.",

        adminTitle:
          "Admin Messages",

        adminDesc:
          "Important Tetamo messages about your account, verification, or safety.",

        marketingTitle:
          "Promos & Tips",

        marketingDesc:
          "Property tips, education, promotions, and Tetamo marketing updates.",

        testNotification:
          "Test Notification",

        testing:
          "Sending Test...",

        pushRegistered:
          "Push notifications have been enabled.",

        pushDenied:
          "Push permission was not granted or this device is not supported.",

        testSent:
          "Test notification sent successfully.",
      };
    }, [isId]);

  /*
   * ===================================================
   * LOAD
   * ===================================================
   */

  useEffect(() => {
    let ignore =
      false;

    async function loadPrefs() {
      setLoading(true);

      setNotice("");
      setNoticeType("");

      const {
        data: { user },
      } =
        await supabase.auth.getUser();

      if (ignore) {
        return;
      }

      if (!user?.id) {
        setLoading(false);

        setNoticeType(
          "error"
        );

        setNotice(
          ui.loginRequired
        );

        return;
      }

      const {
        data,
        error,
      } =
        await supabase
          .from(
            "notification_preferences"
          )
          .select(
            "payment_updates, listing_updates, inquiry_updates, admin_messages, marketing_updates, push_notifications, notification_sound, email_notifications"
          )
          .eq(
            "user_id",
            user.id
          )
          .maybeSingle();

      if (ignore) {
        return;
      }

      if (
        !error &&
        data
      ) {
        setPrefs({
          payment_updates:
            Boolean(
              data.payment_updates
            ),

          listing_updates:
            Boolean(
              data.listing_updates
            ),

          inquiry_updates:
            Boolean(
              data.inquiry_updates
            ),

          admin_messages:
            Boolean(
              data.admin_messages
            ),

          marketing_updates:
            Boolean(
              data.marketing_updates
            ),

          push_notifications:
            Boolean(
              data.push_notifications
            ),

          notification_sound:
            Boolean(
              data.notification_sound
            ),

          email_notifications:
            Boolean(
              data.email_notifications
            ),
        });
      } else {
        setPrefs(
          DEFAULT_PREFS
        );
      }

      setLoading(false);
    }

    void loadPrefs();

    return () => {
      ignore = true;
    };
  }, [ui.loginRequired]);

  /*
   * ===================================================
   * UPDATE LOCAL PREF
   * ===================================================
   */

  function updatePref(
    key:
      keyof Preferences,
    value: boolean
  ) {
    setPrefs(
      (previous) => ({
        ...previous,

        [key]:
          value,
      })
    );

    setNotice("");
    setNoticeType("");
  }

  /*
   * ===================================================
   * SAVE
   * ===================================================
   */

  async function savePrefs(
    nextPrefs = prefs
  ) {
    try {
      setSaving(true);

      setNotice("");
      setNoticeType("");

      const {
        data: { user },
      } =
        await supabase.auth.getUser();

      if (!user?.id) {
        setSaving(false);

        setNoticeType(
          "error"
        );

        setNotice(
          ui.loginRequired
        );

        return false;
      }

      const {
        error,
      } =
        await supabase
          .from(
            "notification_preferences"
          )
          .upsert(
            {
              user_id:
                user.id,

              ...nextPrefs,

              source:
                "tetamo-mobile",

              metadata: {
                app:
                  "tetamo-mobile",

                language,
              },

              updated_at:
                new Date().toISOString(),
            },
            {
              onConflict:
                "user_id",
            }
          );

      if (error) {
        setNoticeType(
          "error"
        );

        setNotice(
          error.message ||
            ui.failed
        );

        setSaving(false);

        return false;
      }

      setNoticeType(
        "success"
      );

      setNotice(
        ui.saved
      );

      setSaving(false);

      return true;
    } catch (
      error: any
    ) {
      setNoticeType(
        "error"
      );

      setNotice(
        error?.message ||
          ui.failed
      );

      setSaving(false);

      return false;
    }
  }

  /*
   * ===================================================
   * ENABLE PUSH
   * ===================================================
   */

  async function enablePushNotifications() {
    try {
      setRegisteringPush(
        true
      );

      setPushStatus("");

      setNotice("");
      setNoticeType("");

      const result =
        await registerTetamoPushNotifications();

      if (!result.ok) {
        setPrefs(
          (previous) => ({
            ...previous,

            push_notifications:
              false,
          })
        );

        setNoticeType(
          "error"
        );

        setNotice(
          ui.pushDenied
        );

        setPushStatus(
          result.status ||
            "not_enabled"
        );

        setRegisteringPush(
          false
        );

        return;
      }

      const nextPrefs = {
        ...prefs,

        push_notifications:
          true,
      };

      setPrefs(
        nextPrefs
      );

      await savePrefs(
        nextPrefs
      );

      setNoticeType(
        "success"
      );

      setNotice(
        ui.pushRegistered
      );

      setPushStatus(
        "registered"
      );

      setRegisteringPush(
        false
      );
    } catch (
      error: any
    ) {
      setPrefs(
        (previous) => ({
          ...previous,

          push_notifications:
            false,
        })
      );

      setNoticeType(
        "error"
      );

      setNotice(
        error?.message ||
          ui.failed
      );

      setRegisteringPush(
        false
      );
    }
  }

  /*
   * ===================================================
   * PUSH TOGGLE
   * ===================================================
   */

  async function handlePushToggle(
    value: boolean
  ) {
    if (value) {
      await enablePushNotifications();

      return;
    }

    const nextPrefs = {
      ...prefs,

      push_notifications:
        false,
    };

    setPrefs(
      nextPrefs
    );

    setPushStatus("");
    setNotice("");
    setNoticeType("");
  }

  /*
   * ===================================================
   * TEST
   * ===================================================
   */

  async function testNotification() {
    try {
      setTestingSound(
        true
      );

      setNotice("");
      setNoticeType("");

      await sendTetamoLocalTestNotification(
        prefs.notification_sound
      );

      setNoticeType(
        "success"
      );

      setNotice(
        ui.testSent
      );

      setTestingSound(
        false
      );
    } catch (
      error: any
    ) {
      setNoticeType(
        "error"
      );

      setNotice(
        error?.message ||
          ui.failed
      );

      setTestingSound(
        false
      );
    }
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
      <StatusBar style="dark" />

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
            numberOfLines={1}
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
                  key={item}
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
      >
        {/* =================================
            INTRO
        ================================= */}

        <View
          style={
            styles.introCard
          }
        >
          <View
            style={
              styles.introIcon
            }
          >
            <BellRing
              color={
                GOLD_DARK
              }
              size={22}
            />
          </View>

          <View
            style={
              styles.introCopy
            }
          >
            <Text
              style={
                styles.introTitle
              }
            >
              {ui.title}
            </Text>

            <Text
              style={
                styles.introSubtitle
              }
            >
              {ui.subtitle}
            </Text>
          </View>
        </View>

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
        ) : (
          <>
            {/* =============================
                DELIVERY
            ============================= */}

            <View
              style={
                styles.sectionCard
              }
            >
              <SectionHeader
                icon={
                  <Bell
                    color={
                      GOLD_DARK
                    }
                    size={18}
                  />
                }
                title={
                  ui.deliveryTitle
                }
                subtitle={
                  ui.deliverySub
                }
              />

              <ToggleRow
                icon={
                  <BellRing
                    color={
                      GOLD_DARK
                    }
                    size={17}
                  />
                }
                title={
                  ui.pushTitle
                }
                subtitle={
                  ui.pushDesc
                }
                value={
                  prefs.push_notifications
                }
                disabled={
                  registeringPush
                }
                onValueChange={
                  handlePushToggle
                }
              />

              <RowDivider />

              <ToggleRow
                icon={
                  prefs.notification_sound ? (
                    <Volume2
                      color={
                        GOLD_DARK
                      }
                      size={17}
                    />
                  ) : (
                    <VolumeX
                      color="#9A938A"
                      size={17}
                    />
                  )
                }
                title={
                  ui.soundTitle
                }
                subtitle={
                  ui.soundDesc
                }
                value={
                  prefs.notification_sound
                }
                onValueChange={(
                  value
                ) =>
                  updatePref(
                    "notification_sound",
                    value
                  )
                }
              />

              <RowDivider />

              <ToggleRow
                icon={
                  <Mail
                    color={
                      GOLD_DARK
                    }
                    size={17}
                  />
                }
                title={
                  ui.emailTitle
                }
                subtitle={
                  ui.emailDesc
                }
                value={
                  prefs.email_notifications
                }
                onValueChange={(
                  value
                ) =>
                  updatePref(
                    "email_notifications",
                    value
                  )
                }
              />

              {pushStatus ? (
                <Text
                  style={
                    styles.pushStatus
                  }
                >
                  Push:{" "}
                  {pushStatus}
                </Text>
              ) : null}
            </View>

            {/* =============================
                TYPES
            ============================= */}

            <View
              style={
                styles.sectionCard
              }
            >
              <SectionHeader
                icon={
                  <ShieldCheck
                    color={
                      GOLD_DARK
                    }
                    size={18}
                  />
                }
                title={
                  ui.categoryTitle
                }
                subtitle={
                  ui.categorySub
                }
              />

              <ToggleRow
                icon={
                  <CreditCard
                    color={
                      GOLD_DARK
                    }
                    size={17}
                  />
                }
                title={
                  ui.paymentTitle
                }
                subtitle={
                  ui.paymentDesc
                }
                value={
                  prefs.payment_updates
                }
                onValueChange={(
                  value
                ) =>
                  updatePref(
                    "payment_updates",
                    value
                  )
                }
              />

              <RowDivider />

              <ToggleRow
                icon={
                  <Home
                    color={
                      GOLD_DARK
                    }
                    size={17}
                  />
                }
                title={
                  ui.listingTitle
                }
                subtitle={
                  ui.listingDesc
                }
                value={
                  prefs.listing_updates
                }
                onValueChange={(
                  value
                ) =>
                  updatePref(
                    "listing_updates",
                    value
                  )
                }
              />

              <RowDivider />

              <ToggleRow
                icon={
                  <MessageCircle
                    color={
                      GOLD_DARK
                    }
                    size={17}
                  />
                }
                title={
                  ui.inquiryTitle
                }
                subtitle={
                  ui.inquiryDesc
                }
                value={
                  prefs.inquiry_updates
                }
                onValueChange={(
                  value
                ) =>
                  updatePref(
                    "inquiry_updates",
                    value
                  )
                }
              />

              <RowDivider />

              <ToggleRow
                icon={
                  <Mail
                    color={
                      GOLD_DARK
                    }
                    size={17}
                  />
                }
                title={
                  ui.adminTitle
                }
                subtitle={
                  ui.adminDesc
                }
                value={
                  prefs.admin_messages
                }
                onValueChange={(
                  value
                ) =>
                  updatePref(
                    "admin_messages",
                    value
                  )
                }
              />

              <RowDivider />

              <ToggleRow
                icon={
                  <Megaphone
                    color={
                      GOLD_DARK
                    }
                    size={17}
                  />
                }
                title={
                  ui.marketingTitle
                }
                subtitle={
                  ui.marketingDesc
                }
                value={
                  prefs.marketing_updates
                }
                onValueChange={(
                  value
                ) =>
                  updatePref(
                    "marketing_updates",
                    value
                  )
                }
              />
            </View>

            {/* =============================
                TEST
            ============================= */}

            <Pressable
              style={[
                styles.testButton,

                testingSound &&
                  styles.disabled,
              ]}
              disabled={
                testingSound
              }
              onPress={() =>
                void testNotification()
              }
            >
              {testingSound ? (
                <ActivityIndicator
                  color={
                    GOLD_DARK
                  }
                />
              ) : (
                <Send
                  color={
                    GOLD_DARK
                  }
                  size={15}
                />
              )}

              <Text
                style={
                  styles.testButtonText
                }
              >
                {testingSound
                  ? ui.testing
                  : ui.testNotification}
              </Text>
            </Pressable>
          </>
        )}

        {/* =================================
            NOTICE
        ================================= */}

        {notice ? (
          <View
            style={[
              styles.noticeCard,

              noticeType ===
              "success"
                ? styles.noticeSuccess
                : styles.noticeError,
            ]}
          >
            {noticeType ===
            "success" ? (
              <CheckCircle2
                color="#278150"
                size={17}
              />
            ) : (
              <XCircle
                color="#A74444"
                size={17}
              />
            )}

            <Text
              style={[
                styles.noticeText,

                noticeType ===
                "success"
                  ? styles.noticeTextSuccess
                  : styles.noticeTextError,
              ]}
            >
              {notice}
            </Text>
          </View>
        ) : null}

        {/* =================================
            SAVE
        ================================= */}

        {!loading ? (
          <Pressable
            style={[
              styles.saveButton,

              saving &&
                styles.disabled,
            ]}
            disabled={
              saving
            }
            onPress={() =>
              void savePrefs()
            }
          >
            {saving ? (
              <ActivityIndicator
                color={
                  BLACK
                }
              />
            ) : (
              <Save
                color={
                  BLACK
                }
                size={16}
              />
            )}

            <Text
              style={
                styles.saveButtonText
              }
            >
              {saving
                ? ui.saving
                : ui.save}
            </Text>
          </Pressable>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

/*
 * =====================================================
 * SECTION HEADER
 * =====================================================
 */

function SectionHeader({
  icon,
  title,
  subtitle,
}: {
  icon: ReactNode;

  title: string;

  subtitle: string;
}) {
  return (
    <View
      style={
        styles.sectionHeader
      }
    >
      <View
        style={
          styles.sectionIcon
        }
      >
        {icon}
      </View>

      <View
        style={
          styles.sectionHeaderCopy
        }
      >
        <Text
          style={
            styles.sectionTitle
          }
        >
          {title}
        </Text>

        <Text
          style={
            styles.sectionSubtitle
          }
        >
          {subtitle}
        </Text>
      </View>
    </View>
  );
}

/*
 * =====================================================
 * TOGGLE ROW
 * =====================================================
 */

function ToggleRow({
  icon,
  title,
  subtitle,
  value,
  disabled,
  onValueChange,
}: {
  icon: ReactNode;

  title: string;

  subtitle: string;

  value: boolean;

  disabled?: boolean;

  onValueChange: (
    value: boolean
  ) =>
    | void
    | Promise<void>;
}) {
  return (
    <View
      style={
        styles.toggleRow
      }
    >
      <View
        style={
          styles.toggleIcon
        }
      >
        {icon}
      </View>

      <View
        style={
          styles.toggleCopy
        }
      >
        <Text
          style={
            styles.toggleTitle
          }
        >
          {title}
        </Text>

        <Text
          style={
            styles.toggleSubtitle
          }
        >
          {subtitle}
        </Text>
      </View>

      {disabled ? (
        <ActivityIndicator
          color={
            GOLD_DARK
          }
          size="small"
        />
      ) : (
        <Switch
          value={
            value
          }
          disabled={
            disabled
          }
          onValueChange={(
            nextValue
          ) =>
            void onValueChange(
              nextValue
            )
          }
          trackColor={{
            false:
              "#D8D2C9",

            true:
              "#D5B25F",
          }}
          thumbColor={
            WHITE
          }
          ios_backgroundColor="#D8D2C9"
        />
      )}
    </View>
  );
}

function RowDivider() {
  return (
    <View
      style={
        styles.rowDivider
      }
    />
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
      minHeight: 59,

      paddingHorizontal: 14,
      paddingVertical: 8,

      flexDirection: "row",
      alignItems: "center",

      gap: 8,

      backgroundColor:
        CREAM,

      borderBottomWidth: 1,
      borderBottomColor:
        BORDER,
    },

    backButton: {
      minHeight: 38,

      paddingHorizontal: 10,

      borderRadius: 13,

      flexDirection: "row",
      alignItems: "center",

      gap: 5,

      backgroundColor:
        WHITE,

      borderWidth: 1,
      borderColor:
        BORDER,
    },

    backText: {
      color: BLACK,

      fontSize: 9,
      fontWeight: "900",
    },

    headerTitleBox: {
      flex: 1,
    },

    headerTitle: {
      color: BLACK,

      fontSize: 14.5,
      fontWeight: "900",
    },

    languageControl: {
      minHeight: 37,

      paddingHorizontal: 4,

      borderRadius: 13,

      flexDirection: "row",
      alignItems: "center",

      gap: 2,

      backgroundColor:
        WHITE,

      borderWidth: 1,
      borderColor:
        BORDER,
    },

    languageButton: {
      width: 31,
      height: 28,

      borderRadius: 9,

      alignItems: "center",
      justifyContent: "center",
    },

    languageButtonActive: {
      backgroundColor:
        GOLD_ACTIVE,
    },

    languageText: {
      color: "#918A81",

      fontSize: 8.2,
      fontWeight: "800",
    },

    languageTextActive: {
      color: BLACK,

      fontWeight: "900",
    },

    scroll: {
      flex: 1,

      backgroundColor:
        CREAM,
    },

    content: {
      paddingHorizontal: 16,
      paddingTop: 14,

      paddingBottom: 125,
    },

    introCard: {
      padding: 14,

      borderRadius: 21,

      flexDirection: "row",
      alignItems: "center",

      gap: 10,

      backgroundColor:
        WHITE,

      borderWidth: 1,
      borderColor:
        BORDER,

      marginBottom: 11,
    },

    introIcon: {
      width: 47,
      height: 47,

      borderRadius: 15,

      alignItems: "center",
      justifyContent: "center",

      backgroundColor:
        GOLD_SOFT,
    },

    introCopy: {
      flex: 1,
    },

    introTitle: {
      color: BLACK,

      fontSize: 15,
      fontWeight: "900",
    },

    introSubtitle: {
      marginTop: 3,

      color: MUTED,

      fontSize: 8.5,
      lineHeight: 12,

      fontWeight: "500",
    },

    stateCard: {
      minHeight: 150,

      padding: 20,

      borderRadius: 20,

      alignItems: "center",
      justifyContent: "center",

      gap: 8,

      backgroundColor:
        WHITE,

      borderWidth: 1,
      borderColor:
        BORDER,
    },

    stateText: {
      color: MUTED,

      fontSize: 9,
      fontWeight: "600",
    },

    sectionCard: {
      marginBottom: 11,

      paddingHorizontal: 13,
      paddingTop: 13,

      borderRadius: 20,

      backgroundColor:
        WHITE,

      borderWidth: 1,
      borderColor:
        BORDER,
    },

    sectionHeader: {
      paddingBottom: 12,

      flexDirection: "row",
      alignItems: "center",

      gap: 9,
    },

    sectionIcon: {
      width: 38,
      height: 38,

      borderRadius: 12,

      alignItems: "center",
      justifyContent: "center",

      backgroundColor:
        GOLD_SOFT,
    },

    sectionHeaderCopy: {
      flex: 1,
    },

    sectionTitle: {
      color: BLACK,

      fontSize: 11.5,
      fontWeight: "900",
    },

    sectionSubtitle: {
      marginTop: 2,

      color: MUTED,

      fontSize: 7.8,
      lineHeight: 11,

      fontWeight: "500",
    },

    toggleRow: {
      minHeight: 69,

      paddingVertical: 9,

      flexDirection: "row",
      alignItems: "center",

      gap: 9,
    },

    toggleIcon: {
      width: 37,
      height: 37,

      borderRadius: 12,

      alignItems: "center",
      justifyContent: "center",

      backgroundColor:
        SOFT,
    },

    toggleCopy: {
      flex: 1,
      minWidth: 0,
    },

    toggleTitle: {
      color: BLACK,

      fontSize: 9.8,
      fontWeight: "900",
    },

    toggleSubtitle: {
      marginTop: 2,

      color: MUTED,

      fontSize: 7.7,
      lineHeight: 11,

      fontWeight: "500",
    },

    rowDivider: {
      height: 1,

      marginLeft: 46,

      backgroundColor:
        "#EEE7DD",
    },

    pushStatus: {
      marginTop: 3,
      marginBottom: 11,
      marginLeft: 46,

      color: GOLD_DARK,

      fontSize: 7.5,
      fontWeight: "700",
    },

    testButton: {
      minHeight: 45,

      marginBottom: 11,

      borderRadius: 14,

      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",

      gap: 6,

      backgroundColor:
        WHITE,

      borderWidth: 1,
      borderColor:
        "#D9D2C8",
    },

    testButtonText: {
      color: GOLD_DARK,

      fontSize: 9.5,
      fontWeight: "900",
    },

    noticeCard: {
      marginBottom: 10,

      padding: 11,

      borderRadius: 14,

      flexDirection: "row",
      alignItems: "flex-start",

      gap: 7,

      borderWidth: 1,
    },

    noticeSuccess: {
      backgroundColor:
        "#EFF8F1",

      borderColor:
        "#C7E2CF",
    },

    noticeError: {
      backgroundColor:
        "#FFF1F1",

      borderColor:
        "#EFC9C9",
    },

    noticeText: {
      flex: 1,

      fontSize: 8.8,
      lineHeight: 13,

      fontWeight: "600",
    },

    noticeTextSuccess: {
      color: "#35734B",
    },

    noticeTextError: {
      color: "#993B3B",
    },

    saveButton: {
      minHeight: 48,

      borderRadius: 14,

      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",

      gap: 7,

      backgroundColor:
        GOLD_ACTIVE,
    },

    saveButtonText: {
      color: BLACK,

      fontSize: 10.5,
      fontWeight: "900",
    },

    disabled: {
      opacity: 0.55,
    },
  });