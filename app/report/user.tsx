import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
    AlertTriangle,
    ArrowLeft,
    Ban,
    CheckCircle2,
    Flag,
    Languages,
    Send,
    ShieldAlert,
    UserRound,
    XCircle,
} from "lucide-react-native";
import { useMemo, useState, type ReactNode } from "react";
import {
    ActivityIndicator,
    Alert,
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

type ReasonKey =
  | "fake_profile"
  | "suspicious_behavior"
  | "wrong_information"
  | "scam_fraud"
  | "harassment"
  | "spam"
  | "offensive_content"
  | "other";

function readParam(value: unknown) {
  if (Array.isArray(value)) return String(value[0] || "");
  return String(value || "");
}

export default function ReportUserScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const [language, setLanguage] = useState<Language>("en");
  const [reason, setReason] = useState<ReasonKey>("suspicious_behavior");
  const [message, setMessage] = useState("");
  const [submittingReport, setSubmittingReport] = useState(false);
  const [blocking, setBlocking] = useState(false);
  const [notice, setNotice] = useState("");
  const [noticeType, setNoticeType] = useState<"success" | "error" | "">("");

  const isId = language === "id";

  const reportedUserId = readParam(params.reported_user_id || params.user_id);
  const reportedName = readParam(params.name || params.reported_name);
  const reportedRole = readParam(params.role || params.reported_role);
  const propertyId = readParam(params.property_id || params.id);
  const listingCode = readParam(params.kode || params.code);
  const listingTitle = readParam(params.title);

  const ui = useMemo(() => {
    if (isId) {
      return {
        back: "Kembali",
        badge: "KEAMANAN",
        title: "Laporkan / Blokir User",
        subtitle:
          "Gunakan halaman ini untuk melaporkan atau memblokir owner, agent, atau pengguna yang mencurigakan.",
        importantTitle: "Keamanan Marketplace",
        importantText:
          "Laporan Anda membantu Tetamo menjaga marketplace tetap aman, transparan, dan terpercaya.",
        userInfo: "Informasi User",
        userName: "Nama",
        userRole: "Role",
        userId: "User ID",
        listingInfo: "Informasi Terkait",
        listingCode: "Kode Listing",
        listingTitle: "Judul Listing",
        reasonTitle: "Pilih Alasan",
        messageTitle: "Detail Tambahan",
        messagePlaceholder:
          "Jelaskan masalahnya. Contoh: user mencurigakan, informasi palsu, meminta pembayaran di luar prosedur, spam, atau komunikasi tidak pantas.",
        submitReport: "Kirim Laporan",
        submittingReport: "Mengirim Laporan...",
        blockUser: "Blokir / Sembunyikan User",
        blocking: "Memblokir...",
        blockWarning:
          "Blokir user akan membantu menyembunyikan atau mengurangi interaksi dengan user ini di Tetamo.",
        reportSuccess:
          "Laporan berhasil dikirim. Tim Tetamo akan meninjau user ini.",
        blockSuccess:
          "User berhasil diblokir. Tetamo akan menyimpan preferensi ini untuk akun Anda.",
        failed:
          "Gagal memproses permintaan. Silakan coba lagi atau hubungi support.",
        loginRequired: "Silakan login terlebih dahulu.",
        missingUser:
          "User ID tidak tersedia, jadi fitur blokir belum bisa digunakan. Anda tetap bisa mengirim laporan.",
        confirmBlockTitle: "Blokir user ini?",
        confirmBlockText:
          "Tetamo akan menyimpan user ini sebagai blocked/hidden untuk akun Anda.",
        cancel: "Batal",
        confirm: "Blokir",
        reasons: {
          fake_profile: "Profil palsu",
          suspicious_behavior: "Perilaku mencurigakan",
          wrong_information: "Informasi salah",
          scam_fraud: "Potensi scam / penipuan",
          harassment: "Pelecehan / komunikasi tidak pantas",
          spam: "Spam",
          offensive_content: "Konten tidak pantas",
          other: "Lainnya",
        },
      };
    }

    return {
      back: "Back",
      badge: "SAFETY",
      title: "Report / Block User",
      subtitle:
        "Use this page to report or block suspicious owners, agents, or users.",
      importantTitle: "Marketplace Safety",
      importantText:
        "Your report helps Tetamo keep the marketplace safe, transparent, and trusted.",
      userInfo: "User Information",
      userName: "Name",
      userRole: "Role",
      userId: "User ID",
      listingInfo: "Related Information",
      listingCode: "Listing Code",
      listingTitle: "Listing Title",
      reasonTitle: "Choose Reason",
      messageTitle: "Additional Details",
      messagePlaceholder:
        "Explain the issue. Example: suspicious user, fake information, asks for payment outside the proper process, spam, or inappropriate communication.",
      submitReport: "Submit Report",
      submittingReport: "Submitting Report...",
      blockUser: "Block / Hide User",
      blocking: "Blocking...",
      blockWarning:
        "Blocking a user helps hide or reduce interaction with this user in Tetamo.",
      reportSuccess:
        "Report submitted. The Tetamo team will review this user.",
      blockSuccess:
        "User blocked successfully. Tetamo will save this preference for your account.",
      failed: "Failed to process request. Please try again or contact support.",
      loginRequired: "Please log in first.",
      missingUser:
        "User ID is not available, so block cannot be used yet. You can still submit a report.",
      confirmBlockTitle: "Block this user?",
      confirmBlockText:
        "Tetamo will save this user as blocked/hidden for your account.",
      cancel: "Cancel",
      confirm: "Block",
      reasons: {
        fake_profile: "Fake profile",
        suspicious_behavior: "Suspicious behavior",
        wrong_information: "Wrong information",
        scam_fraud: "Scam / fraud concern",
        harassment: "Harassment / inappropriate communication",
        spam: "Spam",
        offensive_content: "Offensive content",
        other: "Other",
      },
    };
  }, [isId]);

  const reasons = useMemo(
    () =>
      [
        "fake_profile",
        "suspicious_behavior",
        "wrong_information",
        "scam_fraud",
        "harassment",
        "spam",
        "offensive_content",
        "other",
      ] as ReasonKey[],
    []
  );

  async function submitReport() {
    try {
      setSubmittingReport(true);
      setNotice("");
      setNoticeType("");

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user?.id) {
        setSubmittingReport(false);
        Alert.alert(ui.loginRequired);
        return;
      }

      const selectedReason = ui.reasons[reason];

      const { error } = await supabase.from("user_reports").insert({
        reporter_user_id: user.id,
        reported_user_id: reportedUserId || null,
        property_id: propertyId || null,
        listing_code: listingCode || null,
        report_type: "user",
        reason: selectedReason,
        message: message.trim() || null,
        status: "pending",
        priority:
          reason === "scam_fraud" ||
          reason === "fake_profile" ||
          reason === "harassment"
            ? "high"
            : "normal",
        source: "tetamo-mobile",
        metadata: {
          app: "tetamo-mobile",
          language,
          reason_key: reason,
          reported_name: reportedName || null,
          reported_role: reportedRole || null,
          listing_title: listingTitle || null,
          params,
        },
      });

      if (error) {
        setNoticeType("error");
        setNotice(error.message || ui.failed);
        setSubmittingReport(false);
        return;
      }

      setNoticeType("success");
      setNotice(ui.reportSuccess);
      setMessage("");
      setSubmittingReport(false);
    } catch (error: any) {
      setNoticeType("error");
      setNotice(error?.message || ui.failed);
      setSubmittingReport(false);
    }
  }

  function confirmBlockUser() {
    if (!reportedUserId) {
      Alert.alert(ui.missingUser);
      return;
    }

    Alert.alert(ui.confirmBlockTitle, ui.confirmBlockText, [
      {
        text: ui.cancel,
        style: "cancel",
      },
      {
        text: ui.confirm,
        style: "destructive",
        onPress: () => void blockUser(),
      },
    ]);
  }

  async function blockUser() {
    try {
      setBlocking(true);
      setNotice("");
      setNoticeType("");

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user?.id) {
        setBlocking(false);
        Alert.alert(ui.loginRequired);
        return;
      }

      if (!reportedUserId) {
        setBlocking(false);
        Alert.alert(ui.missingUser);
        return;
      }

      const { error } = await supabase.from("user_blocks").upsert(
        {
          blocker_user_id: user.id,
          blocked_user_id: reportedUserId,
          blocked_name: reportedName || null,
          blocked_role: reportedRole || null,
          status: "active",
          source: "tetamo-mobile",
          metadata: {
            app: "tetamo-mobile",
            language,
            property_id: propertyId || null,
            listing_code: listingCode || null,
            listing_title: listingTitle || null,
          },
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "blocker_user_id,blocked_user_id",
        }
      );

      if (error) {
        setNoticeType("error");
        setNotice(error.message || ui.failed);
        setBlocking(false);
        return;
      }

      setNoticeType("success");
      setNotice(ui.blockSuccess);
      setBlocking(false);
    } catch (error: any) {
      setNoticeType("error");
      setNotice(error?.message || ui.failed);
      setBlocking(false);
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
            <ShieldAlert color="#111111" size={25} />
          </View>

          <Text style={styles.badge}>{ui.badge}</Text>
          <Text style={styles.title}>{ui.title}</Text>
          <Text style={styles.subtitle}>{ui.subtitle}</Text>
        </View>

        <View style={styles.warningCard}>
          <AlertTriangle color="#e6c15c" size={20} />
          <View style={styles.warningTextBox}>
            <Text style={styles.warningTitle}>{ui.importantTitle}</Text>
            <Text style={styles.warningText}>{ui.importantText}</Text>
          </View>
        </View>

        <View style={styles.sectionCard}>
          <SectionHeader
            icon={<UserRound color="#e6c15c" size={20} />}
            title={ui.userInfo}
          />

          <InfoRow label={ui.userName} value={reportedName || "-"} />
          <InfoRow
            label={ui.userRole}
            value={(reportedRole || "-").toUpperCase()}
          />
          <InfoRow label={ui.userId} value={reportedUserId || "-"} />
        </View>

        {(listingCode || listingTitle || propertyId) ? (
          <View style={styles.sectionCard}>
            <SectionHeader
              icon={<Flag color="#e6c15c" size={20} />}
              title={ui.listingInfo}
            />

            <InfoRow label={ui.listingCode} value={listingCode || "-"} />
            <InfoRow label={ui.listingTitle} value={listingTitle || "-"} />
          </View>
        ) : null}

        <View style={styles.sectionCard}>
          <SectionHeader
            icon={<ShieldAlert color="#e6c15c" size={20} />}
            title={ui.reasonTitle}
          />

          <View style={styles.reasonGrid}>
            {reasons.map((item) => (
              <Pressable
                key={item}
                style={[
                  styles.reasonPill,
                  reason === item && styles.reasonPillActive,
                ]}
                onPress={() => setReason(item)}
              >
                <Text
                  style={[
                    styles.reasonText,
                    reason === item && styles.reasonTextActive,
                  ]}
                >
                  {ui.reasons[item]}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.sectionCard}>
          <SectionHeader
            icon={<Flag color="#e6c15c" size={20} />}
            title={ui.messageTitle}
          />

          <TextInput
            value={message}
            onChangeText={setMessage}
            placeholder={ui.messagePlaceholder}
            placeholderTextColor="#777777"
            multiline
            textAlignVertical="top"
            style={styles.messageInput}
          />
        </View>

        <View style={styles.blockCard}>
          <View style={styles.blockHeader}>
            <Ban color="#fecaca" size={20} />
            <Text style={styles.blockTitle}>{ui.blockUser}</Text>
          </View>

          <Text style={styles.blockText}>{ui.blockWarning}</Text>

          {!reportedUserId ? (
            <Text style={styles.blockMissing}>{ui.missingUser}</Text>
          ) : null}
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
            style={[
              styles.submitButton,
              submittingReport && styles.disabledButton,
            ]}
            disabled={submittingReport}
            onPress={() => void submitReport()}
          >
            {submittingReport ? (
              <ActivityIndicator color="#111111" />
            ) : (
              <Send color="#111111" size={17} />
            )}

            <Text style={styles.submitButtonText}>
              {submittingReport ? ui.submittingReport : ui.submitReport}
            </Text>
          </Pressable>

          <Pressable
            style={[
              styles.blockButton,
              (blocking || !reportedUserId) && styles.disabledButton,
            ]}
            disabled={blocking || !reportedUserId}
            onPress={confirmBlockUser}
          >
            {blocking ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Ban color="#ffffff" size={17} />
            )}

            <Text style={styles.blockButtonText}>
              {blocking ? ui.blocking : ui.blockUser}
            </Text>
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
    borderColor: "#705d2c",
    backgroundColor: "#211a0b",
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
    color: "#f5e6b7",
    fontSize: 12.3,
    lineHeight: 19,
    fontWeight: "700",
    marginTop: 8,
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
  reasonGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  reasonPill: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#303030",
    backgroundColor: "#050505",
    paddingHorizontal: 11,
    paddingVertical: 9,
  },
  reasonPillActive: {
    borderColor: "#705d2c",
    backgroundColor: "#211a0b",
  },
  reasonText: {
    color: "#d6d6d6",
    fontSize: 10.8,
    fontWeight: "900",
  },
  reasonTextActive: {
    color: "#e6c15c",
  },
  messageInput: {
    minHeight: 124,
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
  blockCard: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#7f1d1d",
    backgroundColor: "#2a0d0d",
    padding: 15,
    marginBottom: 13,
  },
  blockHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },
  blockTitle: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "900",
  },
  blockText: {
    color: "#fecaca",
    fontSize: 11.6,
    lineHeight: 17,
    fontWeight: "700",
    marginTop: 8,
  },
  blockMissing: {
    color: "#fca5a5",
    fontSize: 11.5,
    lineHeight: 17,
    fontWeight: "900",
    marginTop: 10,
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
  submitButton: {
    minHeight: 50,
    borderRadius: 17,
    backgroundColor: "#e6c15c",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 14,
  },
  submitButtonText: {
    color: "#111111",
    fontSize: 13,
    fontWeight: "900",
  },
  blockButton: {
    minHeight: 50,
    borderRadius: 17,
    backgroundColor: "#991b1b",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 14,
  },
  blockButtonText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "900",
  },
  disabledButton: {
    opacity: 0.55,
  },
});