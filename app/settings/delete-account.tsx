import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
    AlertTriangle,
    ArrowLeft,
    CheckCircle2,
    FileText,
    Languages,
    Lock,
    Mail,
    ShieldCheck,
    Trash2,
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
import { supabase } from "../../lib/supabase";

type Language = "en" | "id";

type ProfileRow = {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  role: string | null;
};

const SUPPORT_EMAIL = "support@tetamo.com";

export default function DeleteAccountScreen() {
  const router = useRouter();

  const [language, setLanguage] = useState<Language>("en");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [reason, setReason] = useState("");
  const [confirmText, setConfirmText] = useState("");
  const [understood, setUnderstood] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "">("");

  const isId = language === "id";

  const ui = useMemo(() => {
    if (isId) {
      return {
        back: "Kembali",
        badge: "AKUN",
        title: "Hapus Akun",
        subtitle:
          "Ajukan penghapusan akun Tetamo Anda. Permintaan ini akan ditinjau agar data penting seperti pembayaran, receipt, dan catatan legal tetap diproses dengan benar.",
        loading: "Memuat akun...",
        accountInfo: "Informasi Akun",
        fullName: "Nama",
        email: "Email",
        role: "Role",
        whatWillHappen: "Apa yang akan terjadi?",
        important: "Penting untuk diketahui",
        reasonTitle: "Alasan Penghapusan",
        reasonPlaceholder:
          "Ceritakan alasan Anda ingin menghapus akun. Ini opsional, tetapi membantu kami memperbaiki Tetamo.",
        confirmTitle: "Konfirmasi",
        confirmHelp:
          'Ketik "DELETE" untuk mengonfirmasi permintaan penghapusan akun.',
        confirmPlaceholder: "Ketik DELETE",
        understood:
          "Saya memahami bahwa akun saya akan ditinjau untuk penghapusan dan beberapa catatan transaksi/legal dapat tetap disimpan sesuai kebutuhan hukum dan akuntansi.",
        submit: "Ajukan Penghapusan Akun",
        submitting: "Mengirim Permintaan...",
        contactSupport: "Hubungi Support",
        loginRequired: "Silakan login terlebih dahulu.",
        missingConfirm:
          'Mohon centang persetujuan dan ketik "DELETE" untuk melanjutkan.',
        success:
          "Permintaan penghapusan akun berhasil dikirim. Tim Tetamo akan meninjau dan memproses permintaan Anda.",
        failed:
          "Gagal mengirim permintaan penghapusan akun. Silakan coba lagi atau hubungi support.",
        points: [
          "Profil dan data akun dapat dihapus atau dianonimkan setelah proses review.",
          "Listing aktif dapat dinonaktifkan atau dihapus sesuai status akun.",
          "Riwayat pembayaran, invoice, receipt, dan catatan legal dapat disimpan jika diwajibkan hukum.",
          "Setelah diproses, Anda mungkin tidak bisa mengakses akun ini lagi.",
        ],
        warning:
          "Jangan ajukan penghapusan jika Anda masih memiliki listing aktif, pembayaran yang sedang berjalan, atau proses verifikasi yang belum selesai.",
      };
    }

    return {
      back: "Back",
      badge: "ACCOUNT",
      title: "Delete Account",
      subtitle:
        "Request deletion of your Tetamo account. This request will be reviewed so important records like payments, receipts, and legal records are handled correctly.",
      loading: "Loading account...",
      accountInfo: "Account Information",
      fullName: "Name",
      email: "Email",
      role: "Role",
      whatWillHappen: "What will happen?",
      important: "Important to know",
      reasonTitle: "Reason for Deletion",
      reasonPlaceholder:
        "Tell us why you want to delete your account. This is optional, but it helps us improve Tetamo.",
      confirmTitle: "Confirmation",
      confirmHelp: 'Type "DELETE" to confirm your account deletion request.',
      confirmPlaceholder: "Type DELETE",
      understood:
        "I understand that my account will be reviewed for deletion and that some transaction/legal records may be retained where required for legal and accounting purposes.",
      submit: "Request Account Deletion",
      submitting: "Sending Request...",
      contactSupport: "Contact Support",
      loginRequired: "Please log in first.",
      missingConfirm:
        'Please tick the confirmation and type "DELETE" to continue.',
      success:
        "Your account deletion request has been submitted. The Tetamo team will review and process your request.",
      failed:
        "Failed to submit account deletion request. Please try again or contact support.",
      points: [
        "Your profile and account data may be deleted or anonymized after review.",
        "Active listings may be deactivated or removed based on account status.",
        "Payment history, invoices, receipts, and legal records may be retained where required by law.",
        "After processing, you may no longer be able to access this account.",
      ],
      warning:
        "Do not request deletion if you still have active listings, pending payments, or unfinished verification processes.",
    };
  }, [isId]);

  useEffect(() => {
    let ignore = false;

    async function loadAccount() {
      setLoading(true);
      setMessage("");
      setMessageType("");

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (ignore) return;

      if (userError || !user) {
        setProfile(null);
        setLoading(false);
        setMessageType("error");
        setMessage(ui.loginRequired);
        return;
      }

      const { data } = await supabase
        .from("profiles")
        .select("id, full_name, email, phone, role")
        .eq("id", user.id)
        .maybeSingle();

      if (ignore) return;

      setProfile({
        id: user.id,
        full_name:
          data?.full_name ||
          String(user.user_metadata?.full_name || "") ||
          String(user.user_metadata?.name || ""),
        email: data?.email || user.email || "",
        phone: data?.phone || "",
        role: data?.role || String(user.user_metadata?.role || ""),
      });

      setLoading(false);
    }

    void loadAccount();

    return () => {
      ignore = true;
    };
  }, [ui.loginRequired]);

  async function contactSupport() {
    const subject = encodeURIComponent("Tetamo Account Deletion Support");
    const body = encodeURIComponent(
      isId
        ? `Halo Tetamo,\n\nSaya ingin meminta bantuan terkait penghapusan akun saya.\n\nEmail akun: ${
            profile?.email || ""
          }`
        : `Hello Tetamo,\n\nI need help with my account deletion request.\n\nAccount email: ${
            profile?.email || ""
          }`
    );

    try {
      await Linking.openURL(
        `mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`
      );
    } catch {
      Alert.alert(
        isId ? "Tidak bisa membuka email." : "Cannot open email.",
        SUPPORT_EMAIL
      );
    }
  }

  async function submitDeletionRequest() {
    if (!profile?.id) {
      Alert.alert(ui.loginRequired);
      return;
    }

    if (!understood || confirmText.trim().toUpperCase() !== "DELETE") {
      Alert.alert(ui.missingConfirm);
      return;
    }

    Alert.alert(
      isId ? "Ajukan penghapusan akun?" : "Request account deletion?",
      isId
        ? "Permintaan akan dikirim ke tim Tetamo untuk ditinjau."
        : "Your request will be sent to the Tetamo team for review.",
      [
        {
          text: isId ? "Batal" : "Cancel",
          style: "cancel",
        },
        {
          text: isId ? "Kirim" : "Submit",
          style: "destructive",
          onPress: async () => {
            await createDeletionRequest();
          },
        },
      ]
    );
  }

  async function createDeletionRequest() {
    try {
      setSubmitting(true);
      setMessage("");
      setMessageType("");

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user?.id) {
        setMessageType("error");
        setMessage(ui.loginRequired);
        setSubmitting(false);
        return;
      }

      const { error } = await supabase.from("account_deletion_requests").insert({
        user_id: user.id,
        email: profile?.email || user.email || "",
        full_name: profile?.full_name || "",
        phone: profile?.phone || "",
        role: profile?.role || "",
        reason: reason.trim() || null,
        status: "pending",
        source: "tetamo-mobile",
        metadata: {
          app: "tetamo-mobile",
          confirmed_text: confirmText.trim().toUpperCase(),
          understood,
        },
      });

      if (error) {
        setMessageType("error");
        setMessage(error.message || ui.failed);
        setSubmitting(false);
        return;
      }

      setMessageType("success");
      setMessage(ui.success);
      setReason("");
      setConfirmText("");
      setUnderstood(false);
      setSubmitting(false);
    } catch (error: any) {
      setMessageType("error");
      setMessage(error?.message || ui.failed);
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
            <Trash2 color="#111111" size={25} />
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

        {!loading && profile ? (
          <>
            <View style={styles.sectionCard}>
              <SectionHeader
                icon={<Lock color="#e6c15c" size={20} />}
                title={ui.accountInfo}
              />

              <InfoRow label={ui.fullName} value={profile.full_name || "-"} />
              <InfoRow label={ui.email} value={profile.email || "-"} />
              <InfoRow
                label={ui.role}
                value={(profile.role || "user").toUpperCase()}
              />
            </View>

            <View style={styles.warningCard}>
              <AlertTriangle color="#e6c15c" size={20} />
              <Text style={styles.warningText}>{ui.warning}</Text>
            </View>

            <View style={styles.sectionCard}>
              <SectionHeader
                icon={<ShieldCheck color="#e6c15c" size={20} />}
                title={ui.whatWillHappen}
              />

              {ui.points.map((point) => (
                <BulletText key={point} text={point} />
              ))}
            </View>

            <View style={styles.sectionCard}>
              <SectionHeader
                icon={<FileText color="#e6c15c" size={20} />}
                title={ui.reasonTitle}
              />

              <TextInput
                value={reason}
                onChangeText={setReason}
                placeholder={ui.reasonPlaceholder}
                placeholderTextColor="#777777"
                multiline
                textAlignVertical="top"
                style={styles.reasonInput}
              />
            </View>

            <View style={styles.sectionCard}>
              <SectionHeader
                icon={<Trash2 color="#fecaca" size={20} />}
                title={ui.confirmTitle}
              />

              <Text style={styles.confirmHelp}>{ui.confirmHelp}</Text>

              <TextInput
                value={confirmText}
                onChangeText={setConfirmText}
                placeholder={ui.confirmPlaceholder}
                placeholderTextColor="#777777"
                autoCapitalize="characters"
                style={styles.confirmInput}
              />

              <Pressable
                style={styles.checkboxRow}
                onPress={() => setUnderstood((prev) => !prev)}
              >
                <View
                  style={[
                    styles.checkbox,
                    understood && styles.checkboxChecked,
                  ]}
                >
                  {understood ? (
                    <CheckCircle2 color="#111111" size={16} />
                  ) : null}
                </View>

                <Text style={styles.checkboxText}>{ui.understood}</Text>
              </Pressable>
            </View>
          </>
        ) : null}

        {message ? (
          <View
            style={[
              styles.messageBox,
              messageType === "success"
                ? styles.messageBoxSuccess
                : styles.messageBoxError,
            ]}
          >
            {messageType === "success" ? (
              <CheckCircle2 color="#22c55e" size={18} />
            ) : (
              <XCircle color="#fecaca" size={18} />
            )}

            <Text
              style={[
                styles.messageText,
                messageType === "success"
                  ? styles.messageTextSuccess
                  : styles.messageTextError,
              ]}
            >
              {message}
            </Text>
          </View>
        ) : null}

        <View style={styles.actionCard}>
          <Pressable
            style={[
              styles.deleteButton,
              (submitting || !profile) && styles.disabledButton,
            ]}
            disabled={submitting || !profile}
            onPress={() => void submitDeletionRequest()}
          >
            {submitting ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Trash2 color="#ffffff" size={17} />
            )}

            <Text style={styles.deleteButtonText}>
              {submitting ? ui.submitting : ui.submit}
            </Text>
          </Pressable>

          <Pressable style={styles.supportButton} onPress={contactSupport}>
            <Mail color="#ffffff" size={16} />
            <Text style={styles.supportButtonText}>{ui.contactSupport}</Text>
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

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

function BulletText({ text }: { text: string }) {
  return (
    <View style={styles.bulletRow}>
      <View style={styles.bulletDot} />
      <Text style={styles.bulletText}>{text}</Text>
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
    borderColor: "#7f1d1d",
    backgroundColor: "#2a0d0d",
    padding: 18,
    marginBottom: 13,
  },
  heroIcon: {
    width: 54,
    height: 54,
    borderRadius: 19,
    backgroundColor: "#fecaca",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 13,
  },
  badge: {
    color: "#fecaca",
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
    color: "#fecaca",
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
  infoRow: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#252525",
    backgroundColor: "#050505",
    padding: 12,
    marginBottom: 9,
  },
  infoLabel: {
    color: "#a9a9a9",
    fontSize: 10.8,
    fontWeight: "800",
  },
  infoValue: {
    color: "#ffffff",
    fontSize: 12.5,
    lineHeight: 17,
    fontWeight: "900",
    marginTop: 4,
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
  warningText: {
    color: "#f5e6b7",
    fontSize: 11.5,
    lineHeight: 17,
    fontWeight: "700",
    flex: 1,
  },
  bulletRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 9,
    marginBottom: 10,
  },
  bulletDot: {
    width: 7,
    height: 7,
    borderRadius: 999,
    backgroundColor: "#e6c15c",
    marginTop: 6,
  },
  bulletText: {
    color: "#d6d6d6",
    fontSize: 11.7,
    lineHeight: 18,
    fontWeight: "700",
    flex: 1,
  },
  reasonInput: {
    minHeight: 112,
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
  confirmHelp: {
    color: "#d6d6d6",
    fontSize: 11.7,
    lineHeight: 18,
    fontWeight: "700",
    marginBottom: 10,
  },
  confirmInput: {
    minHeight: 49,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: "#303030",
    backgroundColor: "#050505",
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "900",
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  checkbox: {
    width: 25,
    height: 25,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: "#705d2c",
    backgroundColor: "#050505",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: "#e6c15c",
    borderColor: "#e6c15c",
  },
  checkboxText: {
    color: "#d6d6d6",
    fontSize: 11.3,
    lineHeight: 17,
    fontWeight: "700",
    flex: 1,
  },
  messageBox: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 12,
    marginBottom: 13,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  messageBoxSuccess: {
    borderColor: "#166534",
    backgroundColor: "#052e16",
  },
  messageBoxError: {
    borderColor: "#7f1d1d",
    backgroundColor: "#2a0d0d",
  },
  messageText: {
    flex: 1,
    fontSize: 11.8,
    lineHeight: 17,
    fontWeight: "800",
  },
  messageTextSuccess: {
    color: "#bbf7d0",
  },
  messageTextError: {
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
  deleteButton: {
    minHeight: 50,
    borderRadius: 17,
    backgroundColor: "#991b1b",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 14,
  },
  deleteButtonText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "900",
  },
  supportButton: {
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
  supportButtonText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "900",
  },
  disabledButton: {
    opacity: 0.55,
  },
});