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
import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
    ActivityIndicator,
    Pressable,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    View
} from "react-native";
import { supabase } from "../../lib/supabase";
import {
    registerTetamoPushNotifications,
    sendTetamoLocalTestNotification,
} from "../../services/pushNotifications";

type Language = "en" | "id";

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

export default function NotificationSettingsScreen() {
  const router = useRouter();

  const [language, setLanguage] = useState<Language>("en");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [registeringPush, setRegisteringPush] = useState(false);
  const [testingSound, setTestingSound] = useState(false);

  const [prefs, setPrefs] = useState<Preferences>(DEFAULT_PREFS);
  const [pushStatus, setPushStatus] = useState("");
  const [notice, setNotice] = useState("");
  const [noticeType, setNoticeType] = useState<"success" | "error" | "">("");

  const isId = language === "id";

  const ui = useMemo(() => {
    if (isId) {
      return {
        back: "Kembali",
        badge: "PREFERENSI",
        title: "Pengaturan Notifikasi",
        subtitle:
          "Pilih notifikasi apa saja yang ingin Anda terima dari Tetamo, termasuk suara notifikasi.",
        loading: "Memuat pengaturan...",
        save: "Simpan Pengaturan",
        saving: "Menyimpan...",
        saved: "Pengaturan notifikasi berhasil disimpan.",
        failed: "Gagal menyimpan pengaturan notifikasi.",
        loginRequired: "Silakan login terlebih dahulu.",
        deliveryTitle: "Cara Menerima Notifikasi",
        soundTitle: "Suara Notifikasi",
        categoryTitle: "Jenis Notifikasi",
        pushTitle: "Push Notification",
        pushDesc:
          "Terima notifikasi langsung di perangkat. Jika diaktifkan, Tetamo akan meminta izin notifikasi.",
        soundOnTitle: "Suara Notification",
        soundOnDesc:
          "Aktifkan suara Tetamo saat push notification masuk. Jika dimatikan, notifikasi tetap muncul tanpa suara.",
        emailTitle: "Email Notification",
        emailDesc:
          "Terima update penting melalui email akun Tetamo Anda.",
        paymentTitle: "Update Pembayaran",
        paymentDesc:
          "Status pembayaran, receipt, invoice, gagal bayar, dan pembayaran berhasil.",
        listingTitle: "Update Listing",
        listingDesc:
          "Listing terkirim, pending verification, approved, rejected, atau perlu revisi.",
        inquiryTitle: "Inquiry / Leads",
        inquiryDesc:
          "Update calon buyer/renter, jadwal viewing, dan pesan terkait listing.",
        adminTitle: "Pesan Admin",
        adminDesc:
          "Pesan penting dari Tetamo terkait akun, verifikasi, atau keamanan.",
        marketingTitle: "Promo & Tips",
        marketingDesc:
          "Tips properti, edukasi, promosi, dan update marketing Tetamo.",
        testNotification: "Tes Notifikasi",
        testing: "Mengirim Tes...",
        registerPush: "Aktifkan Push Notification",
        registering: "Mengaktifkan...",
        pushRegistered: "Push notification berhasil diaktifkan.",
        pushDenied:
          "Izin push notification belum diberikan atau perangkat belum mendukung.",
        testSent:
          "Tes notifikasi dikirim. Jika menggunakan Expo Go, suara custom mungkin belum terdengar sampai memakai development/production build.",
        noteTitle: "Catatan Penting",
        noteText:
          "Suara custom Tetamo akan bekerja paling akurat di development build atau production build karena file suara harus masuk ke app binary. Expo Go bisa berbeda.",
      };
    }

    return {
      back: "Back",
      badge: "PREFERENCES",
      title: "Notification Settings",
      subtitle:
        "Choose which Tetamo notifications you want to receive, including notification sound.",
      loading: "Loading settings...",
      save: "Save Settings",
      saving: "Saving...",
      saved: "Notification settings saved successfully.",
      failed: "Failed to save notification settings.",
      loginRequired: "Please log in first.",
      deliveryTitle: "How You Receive Notifications",
      soundTitle: "Notification Sound",
      categoryTitle: "Notification Types",
      pushTitle: "Push Notifications",
      pushDesc:
        "Receive notifications directly on your device. If enabled, Tetamo will request notification permission.",
      soundOnTitle: "Notification Sound",
      soundOnDesc:
        "Play the Tetamo sound when push notifications arrive. If turned off, notifications can still appear silently.",
      emailTitle: "Email Notifications",
      emailDesc: "Receive important updates through your Tetamo account email.",
      paymentTitle: "Payment Updates",
      paymentDesc:
        "Payment status, receipts, invoices, failed payments, and successful payments.",
      listingTitle: "Listing Updates",
      listingDesc:
        "Listing submitted, pending verification, approved, rejected, or needs revision.",
      inquiryTitle: "Inquiries / Leads",
      inquiryDesc:
        "Buyer/renter inquiries, viewing schedules, and listing-related messages.",
      adminTitle: "Admin Messages",
      adminDesc:
        "Important messages from Tetamo about your account, verification, or safety.",
      marketingTitle: "Promos & Tips",
      marketingDesc:
        "Property tips, education, promotions, and Tetamo marketing updates.",
      testNotification: "Test Notification",
      testing: "Sending Test...",
      registerPush: "Enable Push Notifications",
      registering: "Enabling...",
      pushRegistered: "Push notification has been enabled.",
      pushDenied:
        "Push notification permission was not granted or this device is not supported.",
      testSent:
        "Test notification sent. In Expo Go, custom sound may not work until a development/production build.",
      noteTitle: "Important Note",
      noteText:
        "Tetamo custom sound works most accurately in a development build or production build because the sound file must be bundled into the app binary. Expo Go may behave differently.",
    };
  }, [isId]);

  useEffect(() => {
    let ignore = false;

    async function loadPrefs() {
      setLoading(true);
      setNotice("");
      setNoticeType("");

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (ignore) return;

      if (!user?.id) {
        setLoading(false);
        setNoticeType("error");
        setNotice(ui.loginRequired);
        return;
      }

      const { data, error } = await supabase
        .from("notification_preferences")
        .select(
          "payment_updates, listing_updates, inquiry_updates, admin_messages, marketing_updates, push_notifications, notification_sound, email_notifications"
        )
        .eq("user_id", user.id)
        .maybeSingle();

      if (ignore) return;

      if (!error && data) {
        setPrefs({
          payment_updates: Boolean(data.payment_updates),
          listing_updates: Boolean(data.listing_updates),
          inquiry_updates: Boolean(data.inquiry_updates),
          admin_messages: Boolean(data.admin_messages),
          marketing_updates: Boolean(data.marketing_updates),
          push_notifications: Boolean(data.push_notifications),
          notification_sound: Boolean(data.notification_sound),
          email_notifications: Boolean(data.email_notifications),
        });
      } else {
        setPrefs(DEFAULT_PREFS);
      }

      setLoading(false);
    }

    void loadPrefs();

    return () => {
      ignore = true;
    };
  }, [ui.loginRequired]);

  function updatePref(key: keyof Preferences, value: boolean) {
    setPrefs((prev) => ({
      ...prev,
      [key]: value,
    }));
  }

  async function savePrefs(nextPrefs = prefs) {
    try {
      setSaving(true);
      setNotice("");
      setNoticeType("");

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user?.id) {
        setSaving(false);
        setNoticeType("error");
        setNotice(ui.loginRequired);
        return false;
      }

      const { error } = await supabase.from("notification_preferences").upsert(
        {
          user_id: user.id,
          ...nextPrefs,
          source: "tetamo-mobile",
          metadata: {
            app: "tetamo-mobile",
            language,
          },
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "user_id",
        }
      );

      if (error) {
        setNoticeType("error");
        setNotice(error.message || ui.failed);
        setSaving(false);
        return false;
      }

      setNoticeType("success");
      setNotice(ui.saved);
      setSaving(false);
      return true;
    } catch (error: any) {
      setNoticeType("error");
      setNotice(error?.message || ui.failed);
      setSaving(false);
      return false;
    }
  }

  async function enablePushNotifications() {
    try {
      setRegisteringPush(true);
      setPushStatus("");
      setNotice("");
      setNoticeType("");

      const result = await registerTetamoPushNotifications();

      if (!result.ok) {
        setNoticeType("error");
        setNotice(ui.pushDenied);
        setPushStatus(result.status || "not_enabled");
        setRegisteringPush(false);
        return;
      }

      const nextPrefs = {
        ...prefs,
        push_notifications: true,
      };

      setPrefs(nextPrefs);
      await savePrefs(nextPrefs);

      setNoticeType("success");
      setNotice(ui.pushRegistered);
      setPushStatus("registered");
      setRegisteringPush(false);
    } catch (error: any) {
      setNoticeType("error");
      setNotice(error?.message || ui.failed);
      setRegisteringPush(false);
    }
  }

  async function testNotification() {
    try {
      setTestingSound(true);
      await sendTetamoLocalTestNotification(prefs.notification_sound);
      setNoticeType("success");
      setNotice(ui.testSent);
      setTestingSound(false);
    } catch (error: any) {
      setNoticeType("error");
      setNotice(error?.message || ui.failed);
      setTestingSound(false);
    }
  }

  async function handlePushToggle(value: boolean) {
    if (value) {
      await enablePushNotifications();
      return;
    }

    const nextPrefs = {
      ...prefs,
      push_notifications: false,
    };

    setPrefs(nextPrefs);
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
      >
        <View style={styles.heroCard}>
          <View style={styles.heroIcon}>
            <BellRing color="#111111" size={26} />
          </View>

          <Text style={styles.badge}>{ui.badge}</Text>
          <Text style={styles.title}>{ui.title}</Text>
          <Text style={styles.subtitle}>{ui.subtitle}</Text>
        </View>

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator color="#e6c15c" />
            <Text style={styles.loadingText}>{ui.loading}</Text>
          </View>
        ) : (
          <>
            <View style={styles.sectionCard}>
              <SectionHeader
                icon={<Bell color="#e6c15c" size={20} />}
                title={ui.deliveryTitle}
              />

              <ToggleRow
                icon={<BellRing color="#e6c15c" size={18} />}
                title={ui.pushTitle}
                subtitle={ui.pushDesc}
                value={prefs.push_notifications}
                disabled={registeringPush}
                onValueChange={handlePushToggle}
              />

              <ToggleRow
                icon={
                  prefs.notification_sound ? (
                    <Volume2 color="#e6c15c" size={18} />
                  ) : (
                    <VolumeX color="#e6c15c" size={18} />
                  )
                }
                title={ui.soundOnTitle}
                subtitle={ui.soundOnDesc}
                value={prefs.notification_sound}
                onValueChange={(value) =>
                  updatePref("notification_sound", value)
                }
              />

              <ToggleRow
                icon={<Mail color="#e6c15c" size={18} />}
                title={ui.emailTitle}
                subtitle={ui.emailDesc}
                value={prefs.email_notifications}
                onValueChange={(value) =>
                  updatePref("email_notifications", value)
                }
              />

              {pushStatus ? (
                <Text style={styles.pushStatus}>Status: {pushStatus}</Text>
              ) : null}

              <View style={styles.buttonGrid}>
                <Pressable
                  style={[
                    styles.secondaryButton,
                    registeringPush && styles.disabledButton,
                  ]}
                  disabled={registeringPush}
                  onPress={enablePushNotifications}
                >
                  {registeringPush ? (
                    <ActivityIndicator color="#ffffff" />
                  ) : (
                    <BellRing color="#ffffff" size={16} />
                  )}
                  <Text style={styles.secondaryButtonText}>
                    {registeringPush ? ui.registering : ui.registerPush}
                  </Text>
                </Pressable>

                <Pressable
                  style={[
                    styles.secondaryButton,
                    testingSound && styles.disabledButton,
                  ]}
                  disabled={testingSound}
                  onPress={testNotification}
                >
                  {testingSound ? (
                    <ActivityIndicator color="#ffffff" />
                  ) : (
                    <Send color="#ffffff" size={16} />
                  )}
                  <Text style={styles.secondaryButtonText}>
                    {testingSound ? ui.testing : ui.testNotification}
                  </Text>
                </Pressable>
              </View>
            </View>

            <View style={styles.sectionCard}>
              <SectionHeader
                icon={<ShieldCheck color="#e6c15c" size={20} />}
                title={ui.categoryTitle}
              />

              <ToggleRow
                icon={<CreditCard color="#e6c15c" size={18} />}
                title={ui.paymentTitle}
                subtitle={ui.paymentDesc}
                value={prefs.payment_updates}
                onValueChange={(value) => updatePref("payment_updates", value)}
              />

              <ToggleRow
                icon={<Home color="#e6c15c" size={18} />}
                title={ui.listingTitle}
                subtitle={ui.listingDesc}
                value={prefs.listing_updates}
                onValueChange={(value) => updatePref("listing_updates", value)}
              />

              <ToggleRow
                icon={<MessageCircle color="#e6c15c" size={18} />}
                title={ui.inquiryTitle}
                subtitle={ui.inquiryDesc}
                value={prefs.inquiry_updates}
                onValueChange={(value) => updatePref("inquiry_updates", value)}
              />

              <ToggleRow
                icon={<Mail color="#e6c15c" size={18} />}
                title={ui.adminTitle}
                subtitle={ui.adminDesc}
                value={prefs.admin_messages}
                onValueChange={(value) => updatePref("admin_messages", value)}
              />

              <ToggleRow
                icon={<Megaphone color="#e6c15c" size={18} />}
                title={ui.marketingTitle}
                subtitle={ui.marketingDesc}
                value={prefs.marketing_updates}
                onValueChange={(value) =>
                  updatePref("marketing_updates", value)
                }
              />
            </View>

            <View style={styles.noteCard}>
              <Text style={styles.noteTitle}>{ui.noteTitle}</Text>
              <Text style={styles.noteText}>{ui.noteText}</Text>
            </View>
          </>
        )}

        {notice ? (
          <View
            style={[
              styles.noticeBox,
              noticeType === "success"
                ? styles.noticeBoxSuccess
                : styles.noticeBoxError,
            ]}
          >
            {noticeType === "success" ? (
              <CheckCircle2 color="#22c55e" size={18} />
            ) : (
              <XCircle color="#fecaca" size={18} />
            )}

            <Text
              style={[
                styles.noticeText,
                noticeType === "success"
                  ? styles.noticeTextSuccess
                  : styles.noticeTextError,
              ]}
            >
              {notice}
            </Text>
          </View>
        ) : null}

        <Pressable
          style={[styles.saveButton, saving && styles.disabledButton]}
          disabled={saving}
          onPress={() => void savePrefs()}
        >
          {saving ? (
            <ActivityIndicator color="#111111" />
          ) : (
            <Save color="#111111" size={17} />
          )}

          <Text style={styles.saveButtonText}>
            {saving ? ui.saving : ui.save}
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function SectionHeader({ icon, title }: { icon: ReactNode; title: string }) {
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionIcon}>{icon}</View>
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );
}

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
  onValueChange: (value: boolean) => void | Promise<void>;
}) {
  return (
    <View style={styles.toggleRow}>
      <View style={styles.toggleIcon}>{icon}</View>

      <View style={styles.toggleTextBox}>
        <Text style={styles.toggleTitle}>{title}</Text>
        <Text style={styles.toggleSubtitle}>{subtitle}</Text>
      </View>

      <Switch
        value={value}
        disabled={disabled}
        onValueChange={(nextValue) => void onValueChange(nextValue)}
        trackColor={{ false: "#333333", true: "#705d2c" }}
        thumbColor={value ? "#e6c15c" : "#a9a9a9"}
      />
    </View>
  );
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
  sectionCard: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#303030",
    backgroundColor: "#101010",
    padding: 15,
    marginBottom: 13,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    marginBottom: 13,
  },
  sectionIcon: {
    width: 42,
    height: 42,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#705d2c",
    backgroundColor: "#211a0b",
    alignItems: "center",
    justifyContent: "center",
  },
  sectionTitle: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "900",
    flex: 1,
  },
  toggleRow: {
    minHeight: 76,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#252525",
    backgroundColor: "#050505",
    padding: 11,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  toggleIcon: {
    width: 39,
    height: 39,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#5b4a24",
    backgroundColor: "#211a0b",
    alignItems: "center",
    justifyContent: "center",
  },
  toggleTextBox: {
    flex: 1,
  },
  toggleTitle: {
    color: "#ffffff",
    fontSize: 12.2,
    fontWeight: "900",
  },
  toggleSubtitle: {
    color: "#a9a9a9",
    fontSize: 10.5,
    lineHeight: 15,
    fontWeight: "700",
    marginTop: 3,
  },
  pushStatus: {
    color: "#e6c15c",
    fontSize: 10.8,
    fontWeight: "900",
    marginTop: 2,
    marginBottom: 10,
  },
  buttonGrid: {
    gap: 9,
    marginTop: 4,
  },
  secondaryButton: {
    minHeight: 46,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#343434",
    backgroundColor: "#050505",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    paddingHorizontal: 14,
  },
  secondaryButtonText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "900",
  },
  noteCard: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#705d2c",
    backgroundColor: "#211a0b",
    padding: 13,
    marginBottom: 13,
  },
  noteTitle: {
    color: "#ffffff",
    fontSize: 12.8,
    fontWeight: "900",
  },
  noteText: {
    color: "#f5e6b7",
    fontSize: 11.4,
    lineHeight: 17,
    fontWeight: "700",
    marginTop: 4,
  },
  noticeBox: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 12,
    marginBottom: 13,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  noticeBoxSuccess: {
    borderColor: "#166534",
    backgroundColor: "#052e16",
  },
  noticeBoxError: {
    borderColor: "#7f1d1d",
    backgroundColor: "#2a0d0d",
  },
  noticeText: {
    flex: 1,
    fontSize: 11.8,
    lineHeight: 17,
    fontWeight: "800",
  },
  noticeTextSuccess: {
    color: "#bbf7d0",
  },
  noticeTextError: {
    color: "#fecaca",
  },
  saveButton: {
    minHeight: 50,
    borderRadius: 17,
    backgroundColor: "#e6c15c",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 14,
  },
  saveButtonText: {
    color: "#111111",
    fontSize: 13,
    fontWeight: "900",
  },
  disabledButton: {
    opacity: 0.55,
  },
});