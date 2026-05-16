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
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.heroCard}>
          <View style={styles.heroIcon}>
            <HelpCircle color="#111111" size={26} />
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
        ) : null}

        <View style={styles.contactCard}>
          <SectionHeader
            icon={<MessageCircle color="#e6c15c" size={20} />}
            title={ui.contactCardTitle}
          />

          <ContactButton
            icon={<Mail color="#111111" size={17} />}
            title={ui.emailSupport}
            subtitle={SUPPORT_EMAIL}
            primary
            onPress={openEmailManually}
          />

          <ContactButton
            icon={<ExternalLink color="#ffffff" size={17} />}
            title={ui.openWebsite}
            subtitle={WEBSITE_URL}
            onPress={openWebsite}
          />
        </View>

        <View style={styles.warningCard}>
          <AlertTriangle color="#e6c15c" size={20} />
          <View style={styles.warningTextBox}>
            <Text style={styles.warningTitle}>{ui.importantTitle}</Text>
            <Text style={styles.warningText}>{ui.importantText}</Text>
          </View>
        </View>

        <View style={styles.formCard}>
          <SectionHeader
            icon={<FileText color="#e6c15c" size={20} />}
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

          <Text style={styles.inputLabel}>{ui.message}</Text>
          <TextInput
            value={messageText}
            onChangeText={setMessageText}
            placeholder={ui.messagePlaceholder}
            placeholderTextColor="#777777"
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

        <View style={styles.actionCard}>
          <Pressable
            style={[styles.primaryButton, submitting && styles.disabledButton]}
            disabled={submitting}
            onPress={() => void submitSupportRequest()}
          >
            {submitting ? (
              <ActivityIndicator color="#111111" />
            ) : (
              <Send color="#111111" size={17} />
            )}

            <Text style={styles.primaryButtonText}>
              {submitting ? ui.submitting : ui.submit}
            </Text>
          </Pressable>

          <Pressable style={styles.secondaryButton} onPress={openEmailManually}>
            <Mail color="#ffffff" size={16} />
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
      style={[styles.contactButton, primary && styles.contactButtonPrimary]}
      onPress={onPress}
    >
      <View
        style={[styles.contactIcon, primary && styles.contactIconPrimary]}
      >
        {icon}
      </View>

      <View style={styles.contactTextBox}>
        <Text
          style={[styles.contactTitle, primary && styles.contactTitlePrimary]}
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
        placeholderTextColor="#777777"
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
    marginBottom: 13,
  },
  loadingText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "800",
  },
  contactCard: {
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
  contactButton: {
    minHeight: 64,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#252525",
    backgroundColor: "#050505",
    padding: 11,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  },
  contactButtonPrimary: {
    backgroundColor: "#e6c15c",
    borderColor: "#e6c15c",
  },
  contactIcon: {
    width: 39,
    height: 39,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#303030",
    backgroundColor: "#101010",
    alignItems: "center",
    justifyContent: "center",
  },
  contactIconPrimary: {
    borderColor: "#111111",
    backgroundColor: "rgba(255,255,255,0.35)",
  },
  contactTextBox: {
    flex: 1,
  },
  contactTitle: {
    color: "#ffffff",
    fontSize: 12.5,
    fontWeight: "900",
  },
  contactTitlePrimary: {
    color: "#111111",
  },
  contactSubtitle: {
    color: "#a9a9a9",
    fontSize: 10.8,
    lineHeight: 15,
    fontWeight: "700",
    marginTop: 3,
  },
  contactSubtitlePrimary: {
    color: "#111111",
  },
  warningCard: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#705d2c",
    backgroundColor: "#211a0b",
    padding: 13,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginBottom: 13,
  },
  warningTextBox: {
    flex: 1,
  },
  warningTitle: {
    color: "#ffffff",
    fontSize: 12.8,
    fontWeight: "900",
  },
  warningText: {
    color: "#f5e6b7",
    fontSize: 11.4,
    lineHeight: 17,
    fontWeight: "700",
    marginTop: 4,
  },
  formCard: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#303030",
    backgroundColor: "#101010",
    padding: 15,
    marginBottom: 13,
  },
  inputGroup: {
    marginTop: 12,
  },
  inputLabel: {
    color: "#ffffff",
    fontSize: 11.5,
    fontWeight: "900",
    marginBottom: 8,
  },
  input: {
    minHeight: 49,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: "#303030",
    backgroundColor: "#050505",
    color: "#ffffff",
    fontSize: 12.5,
    fontWeight: "800",
    paddingHorizontal: 12,
  },
  messageInput: {
    minHeight: 126,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#303030",
    backgroundColor: "#050505",
    color: "#ffffff",
    fontSize: 12.5,
    lineHeight: 18,
    fontWeight: "700",
    padding: 12,
  },
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 4,
  },
  categoryPill: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#303030",
    backgroundColor: "#050505",
    paddingHorizontal: 10,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  categoryPillActive: {
    borderColor: "#705d2c",
    backgroundColor: "#211a0b",
  },
  categoryText: {
    color: "#d6d6d6",
    fontSize: 10.5,
    fontWeight: "900",
  },
  categoryTextActive: {
    color: "#e6c15c",
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
  actionCard: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#303030",
    backgroundColor: "#101010",
    padding: 15,
    gap: 10,
  },
  primaryButton: {
    minHeight: 50,
    borderRadius: 17,
    backgroundColor: "#e6c15c",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 14,
  },
  primaryButtonText: {
    color: "#111111",
    fontSize: 13,
    fontWeight: "900",
  },
  secondaryButton: {
    minHeight: 48,
    borderRadius: 17,
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
    fontSize: 13,
    fontWeight: "900",
  },
  disabledButton: {
    opacity: 0.55,
  },
});