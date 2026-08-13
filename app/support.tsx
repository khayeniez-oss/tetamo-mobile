import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
    AlertTriangle,
    ArrowLeft,
    Bug,
    CheckCircle2,
    CreditCard,
    ExternalLink,
    FileText,
    Flag,
    HelpCircle,
    Home,
    Languages,
    Mail,
    MessageCircle,
    Send,
    ShieldAlert,
    Trash2,
    UserRound,
    XCircle,
} from "lucide-react-native";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
    ActivityIndicator,
    Alert,
    Linking,
    Pressable,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import { supabase } from "../lib/supabase";

type Language = "en" | "id";

type ProfileRow = {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  role: string | null;
};

type CategoryKey =
  | "account"
  | "payment"
  | "listing"
  | "safety"
  | "delete_account"
  | "app_issue"
  | "other";

const SUPPORT_EMAIL = "support@tetamo.com";
const WEBSITE_URL = "https://www.tetamo.com";

export default function SupportScreen() {
  const router = useRouter();

  const [language, setLanguage] = useState<Language>("en");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [category, setCategory] = useState<CategoryKey>("account");
  const [contactEmail, setContactEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [messageText, setMessageText] = useState("");

  const [notice, setNotice] = useState("");
  const [noticeType, setNoticeType] = useState<"success" | "error" | "">("");

  const isId = language === "id";

  const ui = useMemo(() => {
    if (isId) {
      return {
        back: "Kembali",
        badge: "BANTUAN",
        title: "Pusat Bantuan Tetamo",
        subtitle:
          "Hubungi Tetamo untuk bantuan akun, pembayaran, listing, keamanan, atau masalah aplikasi.",
        loading: "Memuat support...",
        contactCardTitle: "Kontak Tetamo",
        emailSupport: "Email Support",
        openWebsite: "Buka Website",
        safetyReportsTitle: "Keamanan & Laporan",
        safetyReportsSub:
          "Laporkan listing, pengguna, agen, atau aktivitas yang mencurigakan agar Tetamo dapat meninjau dengan cepat.",
        reportListingTitle: "Laporkan Listing",
        reportListingSub: "Listing palsu, detail salah, atau konten mencurigakan",
        reportUserTitle: "Laporkan Pengguna / Agen",
        reportUserSub: "Akun mencurigakan, scam, atau perilaku tidak pantas",
        formTitle: "Kirim Permintaan Bantuan",
        category: "Kategori",
        email: "Email Kontak",
        subject: "Subjek",
        message: "Pesan",
        emailPlaceholder: "emailanda@email.com",
        subjectPlaceholder: "Contoh: Masalah pembayaran QRIS",
        messagePlaceholder:
          "Tulis detail masalah Anda. Sertakan kode listing, payment ID, atau screenshot jika diperlukan.",
        submit: "Kirim ke Support",
        submitting: "Mengirim...",
        sendEmail: "Kirim Email Manual",
        required: "Mohon isi email, subjek, dan pesan.",
        success:
          "Permintaan bantuan berhasil dikirim. Tim Tetamo akan meninjau pesan Anda.",
        fallback:
          "Permintaan tidak bisa disimpan di sistem. Kami akan membuka email agar Anda tetap bisa menghubungi support.",
        failed:
          "Gagal mengirim permintaan bantuan. Silakan coba lagi atau kirim email manual.",
        importantTitle: "Sebelum menghubungi support",
        importantText:
          "Untuk mempercepat bantuan, sertakan email akun, kode listing, payment ID, dan screenshot jika ada.",
        categories: {
          account: "Akun / Login",
          payment: "Pembayaran / Receipt",
          listing: "Listing Properti",
          safety: "Report / Keamanan",
          delete_account: "Hapus Akun",
          app_issue: "Masalah Aplikasi",
          other: "Lainnya",
        },
      };
    }

    return {
      back: "Back",
      badge: "SUPPORT",
      title: "Tetamo Support Center",
      subtitle:
        "Contact Tetamo for account, payment, listing, safety, or app issues.",
      loading: "Loading support...",
      contactCardTitle: "Contact Tetamo",
      emailSupport: "Email Support",
      openWebsite: "Open Website",
      safetyReportsTitle: "Safety & Reports",
      safetyReportsSub:
        "Report a listing, user, agent, or suspicious activity so Tetamo can review it quickly.",
      reportListingTitle: "Report a Listing",
      reportListingSub: "Fake listing, wrong details, or suspicious content",
      reportUserTitle: "Report a User / Agent",
      reportUserSub: "Suspicious account, scam concern, or inappropriate behavior",
      formTitle: "Send Support Request",
      category: "Category",
      email: "Contact Email",
      subject: "Subject",
      message: "Message",
      emailPlaceholder: "your@email.com",
      subjectPlaceholder: "Example: QRIS payment issue",
      messagePlaceholder:
        "Write the issue details. Include listing code, payment ID, or screenshot if needed.",
      submit: "Send to Support",
      submitting: "Sending...",
      sendEmail: "Send Manual Email",
      required: "Please fill in email, subject, and message.",
      success:
        "Your support request has been submitted. The Tetamo team will review your message.",
      fallback:
        "The request could not be saved in the system. We will open email so you can still contact support.",
      failed:
        "Failed to send support request. Please try again or send a manual email.",
      importantTitle: "Before contacting support",
      importantText:
        "To help us assist faster, include your account email, listing code, payment ID, and screenshot if available.",
      categories: {
        account: "Account / Login",
        payment: "Payment / Receipt",
        listing: "Property Listing",
        safety: "Report / Safety",
        delete_account: "Delete Account",
        app_issue: "App Issue",
        other: "Other",
      },
    };
  }, [isId]);

  const categories = useMemo(
    () => [
      {
        key: "account" as CategoryKey,
        icon: <UserRound color="#e6c15c" size={17} />,
        label: ui.categories.account,
      },
      {
        key: "payment" as CategoryKey,
        icon: <CreditCard color="#e6c15c" size={17} />,
        label: ui.categories.payment,
      },
      {
        key: "listing" as CategoryKey,
        icon: <Home color="#e6c15c" size={17} />,
        label: ui.categories.listing,
      },
      {
        key: "safety" as CategoryKey,
        icon: <ShieldAlert color="#e6c15c" size={17} />,
        label: ui.categories.safety,
      },
      {
        key: "delete_account" as CategoryKey,
        icon: <Trash2 color="#e6c15c" size={17} />,
        label: ui.categories.delete_account,
      },
      {
        key: "app_issue" as CategoryKey,
        icon: <Bug color="#e6c15c" size={17} />,
        label: ui.categories.app_issue,
      },
      {
        key: "other" as CategoryKey,
        icon: <HelpCircle color="#e6c15c" size={17} />,
        label: ui.categories.other,
      },
    ],
    [ui.categories]
  );

  useEffect(() => {
    let ignore = false;

    async function loadProfile() {
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (ignore) return;

      if (!user) {
        setProfile(null);
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from("profiles")
        .select("id, full_name, email, phone, role")
        .eq("id", user.id)
        .maybeSingle();

      if (ignore) return;

      const nextProfile = {
        id: user.id,
        full_name:
          data?.full_name ||
          String(user.user_metadata?.full_name || "") ||
          String(user.user_metadata?.name || ""),
        email: data?.email || user.email || "",
        phone: data?.phone || "",
        role: data?.role || String(user.user_metadata?.role || ""),
      };

      setProfile(nextProfile);
      setContactEmail(nextProfile.email || "");
      setLoading(false);
    }

    void loadProfile();

    return () => {
      ignore = true;
    };
  }, []);

  function openReportListing() {
    router.push("/report/listing" as any);
  }

  function openReportUser() {
    router.push("/report/user" as any);
  }

  async function openWebsite() {
    try {
      await Linking.openURL(WEBSITE_URL);
    } catch {
      Alert.alert(isId ? "Tidak bisa membuka website." : "Cannot open website.");
    }
  }

  async function openEmailManually() {
    const selectedLabel =
      categories.find((item) => item.key === category)?.label || category;

    const emailSubject = encodeURIComponent(
      subject.trim() || `Tetamo Support - ${selectedLabel}`
    );

    const body = encodeURIComponent(
      [
        isId ? "Halo Tetamo Support," : "Hello Tetamo Support,",
        "",
        messageText.trim() ||
          (isId
            ? "Saya membutuhkan bantuan terkait akun Tetamo saya."
            : "I need help with my Tetamo account."),
        "",
        `Category: ${selectedLabel}`,
        `Account email: ${contactEmail.trim() || profile?.email || ""}`,
        `Name: ${profile?.full_name || ""}`,
        `Role: ${profile?.role || ""}`,
      ].join("\n")
    );

    try {
      await Linking.openURL(
        `mailto:${SUPPORT_EMAIL}?subject=${emailSubject}&body=${body}`
      );
    } catch {
      Alert.alert(
        isId ? "Tidak bisa membuka email." : "Cannot open email.",
        SUPPORT_EMAIL
      );
    }
  }

  async function submitSupportRequest() {
    const safeEmail = contactEmail.trim();
    const safeSubject = subject.trim();
    const safeMessage = messageText.trim();

    if (!safeEmail || !safeSubject || !safeMessage) {
      Alert.alert(ui.required);
      return;
    }

    try {
      setSubmitting(true);
      setNotice("");
      setNoticeType("");

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user?.id) {
        setSubmitting(false);
        await openEmailManually();
        return;
      }

      const { error } = await supabase.from("support_requests").insert({
        user_id: user.id,
        email: safeEmail,
        full_name: profile?.full_name || "",
        phone: profile?.phone || "",
        role: profile?.role || "",
        category,
        subject: safeSubject,
        message: safeMessage,
        status: "pending",
        priority: category === "safety" ? "high" : "normal",
        source: "tetamo-mobile",
        metadata: {
          app: "tetamo-mobile",
          language,
        },
      });

      if (error) {
        setNoticeType("error");
        setNotice(ui.fallback);
        setSubmitting(false);
        await openEmailManually();
        return;
      }

      setNoticeType("success");
      setNotice(ui.success);
      setSubject("");
      setMessageText("");
      setSubmitting(false);
    } catch (error: any) {
      setNoticeType("error");
      setNotice(error?.message || ui.failed);
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />

      <View style={styles.topBar}>
        <Pressable
          style={styles.backButton}
          onPress={() => router.back()}
          hitSlop={10}
        >
          <ArrowLeft color="#171717" size={18} />
          <Text style={styles.backText}>{ui.back}</Text>
        </Pressable>

        <View style={styles.langToggle}>
          <Languages color="#A67C28" size={14} />

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
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.hero}>
          <View style={styles.heroIcon}>
            <HelpCircle color="#171717" size={23} />
          </View>

          <Text style={styles.badge}>{ui.badge}</Text>
          <Text style={styles.title}>{ui.title}</Text>
          <Text style={styles.subtitle}>{ui.subtitle}</Text>
        </View>

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator color="#A67C28" />
            <Text style={styles.loadingText}>{ui.loading}</Text>
          </View>
        ) : null}

        <View style={styles.contactCard}>
          <SectionHeader
            icon={<MessageCircle color="#A67C28" size={18} />}
            title={ui.contactCardTitle}
          />

          <ContactButton
            icon={<Mail color="#171717" size={17} />}
            title={ui.emailSupport}
            subtitle={SUPPORT_EMAIL}
            primary
            onPress={openEmailManually}
          />

          <ContactButton
            icon={<ExternalLink color="#171717" size={17} />}
            title={ui.openWebsite}
            subtitle={WEBSITE_URL}
            onPress={openWebsite}
          />
        </View>

        <View style={styles.safetyCard}>
          <SectionHeader
            icon={<ShieldAlert color="#A67C28" size={18} />}
            title={ui.safetyReportsTitle}
          />

          <Text style={styles.safetyIntro}>{ui.safetyReportsSub}</Text>

          <ReportButton
            icon={<Flag color="#A67C28" size={17} />}
            title={ui.reportListingTitle}
            subtitle={ui.reportListingSub}
            onPress={openReportListing}
          />

          <ReportButton
            icon={<UserRound color="#A67C28" size={17} />}
            title={ui.reportUserTitle}
            subtitle={ui.reportUserSub}
            onPress={openReportUser}
          />
        </View>

        <View style={styles.warningCard}>
          <View style={styles.warningIcon}>
            <AlertTriangle color="#9B7726" size={18} />
          </View>

          <View style={styles.warningTextBox}>
            <Text style={styles.warningTitle}>{ui.importantTitle}</Text>
            <Text style={styles.warningText}>{ui.importantText}</Text>
          </View>
        </View>

        <View style={styles.formCard}>
          <SectionHeader
            icon={<FileText color="#A67C28" size={18} />}
            title={ui.formTitle}
          />

          <Text style={styles.inputLabel}>{ui.category}</Text>

          <View style={styles.categoryGrid}>
            {categories.map((item) => (
              <Pressable
                key={item.key}
                style={[
                  styles.categoryPill,
                  category === item.key && styles.categoryPillActive,
                ]}
                onPress={() => setCategory(item.key)}
              >
                {item.icon}

                <Text
                  style={[
                    styles.categoryText,
                    category === item.key && styles.categoryTextActive,
                  ]}
                >
                  {item.label}
                </Text>
              </Pressable>
            ))}
          </View>

          <FormInput
            label={ui.email}
            value={contactEmail}
            onChangeText={setContactEmail}
            placeholder={ui.emailPlaceholder}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <FormInput
            label={ui.subject}
            value={subject}
            onChangeText={setSubject}
            placeholder={ui.subjectPlaceholder}
          />

          <Text style={[styles.inputLabel, styles.messageLabel]}>
            {ui.message}
          </Text>

          <TextInput
            value={messageText}
            onChangeText={setMessageText}
            placeholder={ui.messagePlaceholder}
            placeholderTextColor="#AAA398"
            multiline
            textAlignVertical="top"
            style={styles.messageInput}
          />
        </View>

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
              <CheckCircle2 color="#2E7D4F" size={18} />
            ) : (
              <XCircle color="#B64B4B" size={18} />
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

        <View style={styles.actionCard}>
          <Pressable
            style={[styles.primaryButton, submitting && styles.disabledButton]}
            disabled={submitting}
            onPress={() => void submitSupportRequest()}
          >
            {submitting ? (
              <ActivityIndicator color="#171717" />
            ) : (
              <Send color="#171717" size={17} />
            )}

            <Text style={styles.primaryButtonText}>
              {submitting ? ui.submitting : ui.submit}
            </Text>
          </Pressable>

          <Pressable
            style={styles.secondaryButton}
            onPress={openEmailManually}
          >
            <Mail color="#171717" size={16} />
            <Text style={styles.secondaryButtonText}>{ui.sendEmail}</Text>
          </Pressable>
        </View>
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

function ContactButton({
  icon,
  title,
  subtitle,
  primary,
  onPress,
}: {
  icon: ReactNode;
  title: string;
  subtitle: string;
  primary?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={[
        styles.contactButton,
        primary && styles.contactButtonPrimary,
      ]}
      onPress={onPress}
    >
      <View
        style={[
          styles.contactIcon,
          primary && styles.contactIconPrimary,
        ]}
      >
        {icon}
      </View>

      <View style={styles.contactTextBox}>
        <Text
          style={[
            styles.contactTitle,
            primary && styles.contactTitlePrimary,
          ]}
        >
          {title}
        </Text>

        <Text
          style={[
            styles.contactSubtitle,
            primary && styles.contactSubtitlePrimary,
          ]}
          numberOfLines={1}
        >
          {subtitle}
        </Text>
      </View>

      <ExternalLink
        color={primary ? "#171717" : "#9A9388"}
        size={15}
      />
    </Pressable>
  );
}

function ReportButton({
  icon,
  title,
  subtitle,
  onPress,
}: {
  icon: ReactNode;
  title: string;
  subtitle: string;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.reportButton} onPress={onPress}>
      <View style={styles.reportIcon}>{icon}</View>

      <View style={styles.reportTextBox}>
        <Text style={styles.reportTitle}>{title}</Text>
        <Text style={styles.reportSubtitle} numberOfLines={2}>
          {subtitle}
        </Text>
      </View>

      <ExternalLink color="#A69F93" size={14} />
    </Pressable>
  );
}

function FormInput({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  autoCapitalize = "sentences",
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  keyboardType?: "default" | "email-address";
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
}) {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>{label}</Text>

      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#AAA398"
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        style={styles.input}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F7F5EF",
  },

  topBar: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 10,
    backgroundColor: "#F7F5EF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  backButton: {
    minHeight: 38,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },

  backText: {
    color: "#171717",
    fontSize: 13,
    fontWeight: "700",
  },

  langToggle: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#DDD7C9",
    backgroundColor: "#FFFFFF",
    paddingLeft: 10,
    paddingRight: 3,
    paddingVertical: 3,
    gap: 2,
  },

  langButton: {
    minWidth: 36,
    paddingHorizontal: 9,
    paddingVertical: 7,
    borderRadius: 999,
    alignItems: "center",
  },

  langButtonActive: {
    backgroundColor: "#E6C15C",
  },

  langText: {
    color: "#8A806C",
    fontSize: 10,
    fontWeight: "800",
  },

  langTextActive: {
    color: "#171717",
  },

  scroll: {
    flex: 1,
    backgroundColor: "#F7F5EF",
  },

  content: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 44,
  },

  hero: {
    marginBottom: 24,
  },

  heroIcon: {
    width: 46,
    height: 46,
    borderRadius: 15,
    backgroundColor: "#E6C15C",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },

  badge: {
    color: "#9B7726",
    fontSize: 10.5,
    fontWeight: "800",
    letterSpacing: 1.4,
  },

  title: {
    color: "#171717",
    fontSize: 31,
    lineHeight: 37,
    fontWeight: "800",
    letterSpacing: -0.8,
    marginTop: 7,
  },

  subtitle: {
    color: "#615E57",
    fontSize: 13.5,
    lineHeight: 21,
    fontWeight: "500",
    marginTop: 9,
    maxWidth: 345,
  },

  loadingBox: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E8E3D9",
    backgroundColor: "#FFFFFF",
    padding: 15,
    alignItems: "center",
    gap: 9,
    marginBottom: 18,
  },

  loadingText: {
    color: "#6C675D",
    fontSize: 12,
    fontWeight: "600",
  },

  contactCard: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#E8E3D9",
    backgroundColor: "#FFFFFF",
    padding: 15,
    marginBottom: 18,
  },

  safetyCard: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#E7DFC9",
    backgroundColor: "#FFFDF8",
    padding: 15,
    marginBottom: 18,
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    marginBottom: 14,
  },

  sectionIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#EADFBF",
    backgroundColor: "#FBF6E8",
    alignItems: "center",
    justifyContent: "center",
  },

  sectionTitle: {
    color: "#1C1B18",
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "800",
    flex: 1,
  },

  contactButton: {
    minHeight: 64,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E5E0D6",
    backgroundColor: "#FAF9F6",
    padding: 11,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  },

  contactButtonPrimary: {
    backgroundColor: "#E6C15C",
    borderColor: "#E6C15C",
  },

  contactIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E0D6",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },

  contactIconPrimary: {
    borderColor: "rgba(23,23,23,0.12)",
    backgroundColor: "rgba(255,255,255,0.35)",
  },

  contactTextBox: {
    flex: 1,
  },

  contactTitle: {
    color: "#171717",
    fontSize: 13,
    fontWeight: "800",
  },

  contactTitlePrimary: {
    color: "#171717",
  },

  contactSubtitle: {
    color: "#8B8579",
    fontSize: 10.8,
    lineHeight: 15,
    fontWeight: "500",
    marginTop: 3,
  },

  contactSubtitlePrimary: {
    color: "#4F421F",
  },

  safetyIntro: {
    color: "#6F695D",
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "500",
    marginTop: -2,
    marginBottom: 12,
  },

  reportButton: {
    minHeight: 66,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E7E1D6",
    backgroundColor: "#FFFFFF",
    padding: 11,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  },

  reportIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#EADFBF",
    backgroundColor: "#FBF6E8",
    alignItems: "center",
    justifyContent: "center",
  },

  reportTextBox: {
    flex: 1,
  },

  reportTitle: {
    color: "#1C1B18",
    fontSize: 12.8,
    fontWeight: "800",
  },

  reportSubtitle: {
    color: "#827C70",
    fontSize: 10.8,
    lineHeight: 15,
    fontWeight: "500",
    marginTop: 3,
  },

  warningCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E7DFC9",
    backgroundColor: "#FBF6E8",
    padding: 14,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 11,
    marginBottom: 18,
  },

  warningIcon: {
    width: 34,
    height: 34,
    borderRadius: 11,
    backgroundColor: "#FFFDF8",
    alignItems: "center",
    justifyContent: "center",
  },

  warningTextBox: {
    flex: 1,
  },

  warningTitle: {
    color: "#332C1D",
    fontSize: 12.8,
    fontWeight: "800",
  },

  warningText: {
    color: "#756949",
    fontSize: 11.5,
    lineHeight: 17,
    fontWeight: "500",
    marginTop: 4,
  },

  formCard: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#E8E3D9",
    backgroundColor: "#FFFFFF",
    padding: 15,
    marginBottom: 18,
  },

  inputGroup: {
    marginTop: 14,
  },

  inputLabel: {
    color: "#37342E",
    fontSize: 11.8,
    fontWeight: "700",
    marginBottom: 8,
  },

  messageLabel: {
    marginTop: 14,
  },

  input: {
    minHeight: 50,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#E1DDD4",
    backgroundColor: "#FAF9F6",
    color: "#171717",
    fontSize: 12.5,
    fontWeight: "500",
    paddingHorizontal: 13,
  },

  messageInput: {
    minHeight: 132,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E1DDD4",
    backgroundColor: "#FAF9F6",
    color: "#171717",
    fontSize: 12.5,
    lineHeight: 19,
    fontWeight: "500",
    padding: 13,
  },

  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 3,
  },

  categoryPill: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#E3DED4",
    backgroundColor: "#FAF9F6",
    paddingHorizontal: 10,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  categoryPillActive: {
    borderColor: "#DFC16B",
    backgroundColor: "#FBF4DD",
  },

  categoryText: {
    color: "#746E63",
    fontSize: 10.5,
    fontWeight: "700",
  },

  categoryTextActive: {
    color: "#8A681F",
  },

  noticeBox: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 13,
    marginBottom: 18,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 9,
  },

  noticeBoxSuccess: {
    borderColor: "#CFE5D6",
    backgroundColor: "#F1FAF4",
  },

  noticeBoxError: {
    borderColor: "#E9CCCC",
    backgroundColor: "#FFF5F5",
  },

  noticeText: {
    flex: 1,
    fontSize: 11.8,
    lineHeight: 17,
    fontWeight: "600",
  },

  noticeTextSuccess: {
    color: "#2E6B46",
  },

  noticeTextError: {
    color: "#9A4141",
  },

  actionCard: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#E8E3D9",
    backgroundColor: "#FFFFFF",
    padding: 14,
    gap: 10,
  },

  primaryButton: {
    minHeight: 54,
    borderRadius: 16,
    backgroundColor: "#E6C15C",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 14,
  },

  primaryButtonText: {
    color: "#171717",
    fontSize: 13,
    fontWeight: "800",
  },

  secondaryButton: {
    minHeight: 52,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E1DDD4",
    backgroundColor: "#FAF9F6",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    paddingHorizontal: 14,
  },

  secondaryButtonText: {
    color: "#171717",
    fontSize: 13,
    fontWeight: "800",
  },

  disabledButton: {
    opacity: 0.55,
  },
});
