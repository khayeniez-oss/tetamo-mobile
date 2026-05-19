import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  FileWarning,
  Home,
  Mail,
  MapPin,
  MessageSquare,
  Send,
  ShieldAlert,
} from "lucide-react-native";
import { useEffect, useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Linking,
  Platform,
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

const SCORPIO_GOLD = "#e6c15c";
const SUPPORT_EMAIL = "inquiry@tetamo.com";

const reportReasons = [
  {
    key: "fake_listing",
    en: "Fake listing",
    id: "Listing palsu",
  },
  {
    key: "wrong_details",
    en: "Wrong price or details",
    id: "Harga atau detail salah",
  },
  {
    key: "sold_or_rented",
    en: "Property already sold or rented",
    id: "Properti sudah terjual atau tersewa",
  },
  {
    key: "suspicious_listing",
    en: "Suspicious listing",
    id: "Listing mencurigakan",
  },
  {
    key: "inappropriate_content",
    en: "Inappropriate content",
    id: "Konten tidak pantas",
  },
  {
    key: "safety_concern",
    en: "Safety concern",
    id: "Masalah keamanan",
  },
  {
    key: "other_problem",
    en: "Other problem",
    id: "Masalah lainnya",
  },
];

const copy = {
  en: {
    reportSubmitted: "Report submitted",
    reportSuccess:
      "Thank you for helping keep Tetamo safe. Our team will review this listing.",
    done: "Done",
    headerTitle: "Report Listing",
    headerSub: "Help us keep Tetamo safe and trusted.",
    heroTitle: "Tell us what is wrong",
    heroText:
      "Reports are reviewed by Tetamo to protect buyers, renters, owners, and agents.",
    selectedListing: "Selected property listing",
    listingPrefix: "Listing",
    listingCode: "Listing code",
    checkingAccount: "Checking your account...",
    signInRequired: "Sign in required",
    signInRequiredText:
      "Please sign in to submit a report. This helps Tetamo review reports safely.",
    signIn: "Sign In",
    emailTetamo: "Email Tetamo",
    reason: "Reason",
    additionalDetails: "Additional details",
    messagePlaceholder: "Tell us more about the issue...",
    safeNote:
      "Please do not include sensitive personal information unless it is needed for the report.",
    chooseReason: "Please choose a reason for the report.",
    signInFirst:
      "Please sign in first so Tetamo can review your report safely.",
    submitFailed:
      "We could not submit your report. Please try again or contact Tetamo support.",
    submitting: "Submitting...",
    submitReport: "Submit Report",
    emailSubject: "Tetamo Listing Report",
    emailBodyIntro: "Hello Tetamo,\n\nI would like to report a listing.",
    emailListing: "Listing",
    emailCode: "Code",
    emailLocation: "Location",
    emailReason: "Reason",
    emailDetails: "Details",
  },
  id: {
    reportSubmitted: "Laporan terkirim",
    reportSuccess:
      "Terima kasih sudah membantu menjaga Tetamo tetap aman. Tim kami akan meninjau listing ini.",
    done: "Selesai",
    headerTitle: "Laporkan Listing",
    headerSub: "Bantu kami menjaga Tetamo tetap aman dan terpercaya.",
    heroTitle: "Beri tahu kami masalahnya",
    heroText:
      "Laporan akan ditinjau oleh Tetamo untuk melindungi pembeli, penyewa, pemilik, dan agen.",
    selectedListing: "Listing properti yang dipilih",
    listingPrefix: "Listing",
    listingCode: "Kode listing",
    checkingAccount: "Memeriksa akun Anda...",
    signInRequired: "Login diperlukan",
    signInRequiredText:
      "Silakan login untuk mengirim laporan. Ini membantu Tetamo meninjau laporan dengan aman.",
    signIn: "Masuk",
    emailTetamo: "Email Tetamo",
    reason: "Alasan",
    additionalDetails: "Detail tambahan",
    messagePlaceholder: "Ceritakan lebih lanjut tentang masalah ini...",
    safeNote:
      "Mohon jangan memasukkan informasi pribadi sensitif kecuali diperlukan untuk laporan.",
    chooseReason: "Silakan pilih alasan laporan.",
    signInFirst:
      "Silakan login terlebih dahulu agar Tetamo dapat meninjau laporan Anda dengan aman.",
    submitFailed:
      "Laporan belum bisa dikirim. Silakan coba lagi atau hubungi support Tetamo.",
    submitting: "Mengirim...",
    submitReport: "Kirim Laporan",
    emailSubject: "Laporan Listing Tetamo",
    emailBodyIntro: "Halo Tetamo,\n\nSaya ingin melaporkan sebuah listing.",
    emailListing: "Listing",
    emailCode: "Kode",
    emailLocation: "Lokasi",
    emailReason: "Alasan",
    emailDetails: "Detail",
  },
};

export default function ReportListingScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const propertyId = safeParam(params.property_id || params.propertyId);
  const listingCode = safeParam(params.listing_code || params.code);
  const propertyTitle = safeParam(params.title || params.property_title);
  const propertyLocation = safeParam(params.location);

  const [language, setLanguage] = useState<Language>("en");
  const [selectedReasonKey, setSelectedReasonKey] = useState(
    reportReasons[0].key,
  );
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckingUser, setIsCheckingUser] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorText, setErrorText] = useState("");

  const t = copy[language];

  const selectedReason =
    reportReasons.find((reason) => reason.key === selectedReasonKey) ||
    reportReasons[0];

  const selectedReasonLabel =
    language === "id" ? selectedReason.id : selectedReason.en;

  const listingLabel = useMemo(() => {
    if (propertyTitle) return propertyTitle;
    if (listingCode) return `${copy[language].listingPrefix} ${listingCode}`;
    return copy[language].selectedListing;
  }, [language, listingCode, propertyTitle]);

  useEffect(() => {
    let isMounted = true;

    async function checkUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!isMounted) return;

      setIsLoggedIn(!!user?.id);
      setIsCheckingUser(false);
    }

    void checkUser();

    return () => {
      isMounted = false;
    };
  }, []);

  const openSupportEmail = () => {
    const subject = encodeURIComponent(t.emailSubject);
    const body = encodeURIComponent(
      `${t.emailBodyIntro}\n\n${t.emailListing}: ${listingLabel}\n${t.emailCode}: ${
        listingCode || "-"
      }\n${t.emailLocation}: ${propertyLocation || "-"}\n${t.emailReason}: ${
        selectedReasonLabel || "-"
      }\n\n${t.emailDetails}:\n${message || ""}`,
    );

    void Linking.openURL(
      `mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`,
    );
  };

  const submitReport = async () => {
    setErrorText("");

    if (!selectedReasonKey) {
      setErrorText(t.chooseReason);
      return;
    }

    setIsSubmitting(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user?.id) {
        setIsLoggedIn(false);
        setErrorText(t.signInFirst);
        return;
      }

      const { error } = await supabase.from("user_reports").insert({
        reporter_user_id: user.id,
        property_id: isUuid(propertyId) ? propertyId : null,
        listing_code: listingCode || null,
        report_type: "listing",
        reason: selectedReason.en,
        message: message.trim() || null,
        source: "tetamo-mobile",
        metadata: {
          reason_key: selectedReason.key,
          reason_label_en: selectedReason.en,
          reason_label_id: selectedReason.id,
          property_title: propertyTitle || null,
          property_location: propertyLocation || null,
          submitted_from: "mobile_app",
          language,
        },
      });

      if (error) {
        setErrorText(t.submitFailed);
        return;
      }

      setSubmitted(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="light" />

        <View style={styles.successWrap}>
          <View style={styles.successIcon}>
            <CheckCircle2 color="#111111" size={38} />
          </View>

          <Text style={styles.successTitle}>{t.reportSubmitted}</Text>

          <Text style={styles.successText}>{t.reportSuccess}</Text>

          <Pressable style={styles.primaryButton} onPress={() => router.back()}>
            <Text style={styles.primaryButtonText}>{t.done}</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />

      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Pressable style={styles.backButton} onPress={() => router.back()}>
              <ChevronLeft color="#ffffff" size={22} />
            </Pressable>

            <View style={styles.headerTextBox}>
              <Text style={styles.headerTitle}>{t.headerTitle}</Text>
              <Text style={styles.headerSub}>{t.headerSub}</Text>
            </View>

            <View style={styles.langToggle}>
              {(["en", "id"] as Language[]).map((item) => (
                <Pressable
                  key={item}
                  style={[
                    styles.langButton,
                    language === item && styles.langButtonActive,
                  ]}
                  onPress={() => {
                    setErrorText("");
                    setLanguage(item);
                  }}
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

          <View style={styles.heroCard}>
            <View style={styles.heroIcon}>
              <FileWarning color={SCORPIO_GOLD} size={28} />
            </View>

            <View style={styles.heroTextBox}>
              <Text style={styles.heroTitle}>{t.heroTitle}</Text>
              <Text style={styles.heroText}>{t.heroText}</Text>
            </View>
          </View>

          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Home color={SCORPIO_GOLD} size={16} />
              <Text style={styles.infoTitle} numberOfLines={2}>
                {listingLabel}
              </Text>
            </View>

            {!!listingCode && (
              <Text style={styles.infoSub}>
                {t.listingCode}: {listingCode}
              </Text>
            )}

            {!!propertyLocation && (
              <View style={styles.locationRow}>
                <MapPin color="#bdbdbd" size={13} />
                <Text style={styles.locationText} numberOfLines={2}>
                  {propertyLocation}
                </Text>
              </View>
            )}
          </View>

          {isCheckingUser ? (
            <View style={styles.noticeCard}>
              <Text style={styles.noticeText}>{t.checkingAccount}</Text>
            </View>
          ) : !isLoggedIn ? (
            <View style={styles.noticeCard}>
              <View style={styles.noticeIcon}>
                <ShieldAlert color={SCORPIO_GOLD} size={18} />
              </View>

              <Text style={styles.noticeTitle}>{t.signInRequired}</Text>
              <Text style={styles.noticeText}>{t.signInRequiredText}</Text>

              <View style={styles.noticeButtons}>
                <Pressable
                  style={styles.noticeButtonGold}
                  onPress={() => router.push("/login" as any)}
                >
                  <Text style={styles.noticeButtonGoldText}>{t.signIn}</Text>
                </Pressable>

                <Pressable
                  style={styles.noticeButtonDark}
                  onPress={openSupportEmail}
                >
                  <Mail color={SCORPIO_GOLD} size={14} />
                  <Text style={styles.noticeButtonDarkText}>
                    {t.emailTetamo}
                  </Text>
                </Pressable>
              </View>
            </View>
          ) : null}

          <Text style={styles.sectionLabel}>{t.reason}</Text>

          <View style={styles.reasonWrap}>
            {reportReasons.map((reason) => {
              const active = selectedReasonKey === reason.key;
              const label = language === "id" ? reason.id : reason.en;

              return (
                <Pressable
                  key={reason.key}
                  style={[styles.reasonChip, active && styles.reasonChipActive]}
                  onPress={() => {
                    setErrorText("");
                    setSelectedReasonKey(reason.key);
                  }}
                >
                  <Text
                    style={[
                      styles.reasonChipText,
                      active && styles.reasonChipTextActive,
                    ]}
                  >
                    {label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={styles.sectionLabel}>{t.additionalDetails}</Text>

          <View style={styles.messageBox}>
            <MessageSquare color={SCORPIO_GOLD} size={18} />

            <TextInput
              value={message}
              onChangeText={(value) => {
                setErrorText("");
                setMessage(value);
              }}
              placeholder={t.messagePlaceholder}
              placeholderTextColor="#7d7d7d"
              style={styles.messageInput}
              multiline
              textAlignVertical="top"
              maxLength={1000}
            />
          </View>

          <View style={styles.safeNote}>
            <AlertTriangle color={SCORPIO_GOLD} size={16} />
            <Text style={styles.safeNoteText}>{t.safeNote}</Text>
          </View>

          {!!errorText && <Text style={styles.errorText}>{errorText}</Text>}

          <Pressable
            style={[
              styles.submitButton,
              (!isLoggedIn || isSubmitting) && styles.submitButtonDisabled,
            ]}
            onPress={submitReport}
            disabled={!isLoggedIn || isSubmitting}
          >
            <Send color="#111111" size={17} />
            <Text style={styles.submitButtonText}>
              {isSubmitting ? t.submitting : t.submitReport}
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function safeParam(value: unknown) {
  if (Array.isArray(value)) return String(value[0] || "").trim();
  return String(value || "").trim();
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#050505",
  },
  keyboard: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 36,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 18,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#303030",
    backgroundColor: "#101010",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTextBox: {
    flex: 1,
  },
  headerTitle: {
    color: "#ffffff",
    fontSize: 22,
    fontWeight: "900",
  },
  headerSub: {
    color: "#bdbdbd",
    fontSize: 12,
    marginTop: 2,
    fontWeight: "700",
  },
  langToggle: {
    flexDirection: "row",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#5b4a24",
    overflow: "hidden",
  },
  langButton: {
    paddingHorizontal: 9,
    paddingVertical: 6,
  },
  langButtonActive: {
    backgroundColor: SCORPIO_GOLD,
  },
  langText: {
    color: SCORPIO_GOLD,
    fontSize: 9.5,
    fontWeight: "900",
  },
  langTextActive: {
    color: "#111111",
  },
  heroCard: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#705d2c",
    backgroundColor: "#12100a",
    padding: 16,
    flexDirection: "row",
    gap: 13,
    marginBottom: 14,
  },
  heroIcon: {
    width: 52,
    height: 52,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#705d2c",
    backgroundColor: "#090909",
    alignItems: "center",
    justifyContent: "center",
  },
  heroTextBox: {
    flex: 1,
  },
  heroTitle: {
    color: SCORPIO_GOLD,
    fontSize: 16,
    fontWeight: "900",
  },
  heroText: {
    color: "#e7e7e7",
    fontSize: 11.5,
    lineHeight: 16,
    marginTop: 5,
    fontWeight: "700",
  },
  infoCard: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#303030",
    backgroundColor: "#101010",
    padding: 14,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  infoTitle: {
    color: "#ffffff",
    fontSize: 14,
    lineHeight: 18,
    fontWeight: "900",
    flex: 1,
  },
  infoSub: {
    color: SCORPIO_GOLD,
    fontSize: 11,
    fontWeight: "800",
    marginTop: 8,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 5,
    marginTop: 8,
  },
  locationText: {
    color: "#bdbdbd",
    fontSize: 11,
    lineHeight: 15,
    fontWeight: "700",
    flex: 1,
  },
  noticeCard: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#705d2c",
    backgroundColor: "#12100a",
    padding: 14,
    marginBottom: 16,
  },
  noticeIcon: {
    width: 34,
    height: 34,
    borderRadius: 999,
    backgroundColor: "#090909",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  noticeTitle: {
    color: SCORPIO_GOLD,
    fontSize: 14,
    fontWeight: "900",
  },
  noticeText: {
    color: "#d8d8d8",
    fontSize: 11.5,
    lineHeight: 16,
    marginTop: 5,
    fontWeight: "700",
  },
  noticeButtons: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
  },
  noticeButtonGold: {
    flex: 1,
    minHeight: 38,
    borderRadius: 999,
    backgroundColor: SCORPIO_GOLD,
    alignItems: "center",
    justifyContent: "center",
  },
  noticeButtonGoldText: {
    color: "#111111",
    fontSize: 12,
    fontWeight: "900",
  },
  noticeButtonDark: {
    flex: 1,
    minHeight: 38,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(230,193,92,0.35)",
    backgroundColor: "#101010",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  noticeButtonDarkText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "900",
  },
  sectionLabel: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "900",
    marginBottom: 10,
  },
  reasonWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 18,
  },
  reasonChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#303030",
    backgroundColor: "#101010",
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  reasonChipActive: {
    borderColor: SCORPIO_GOLD,
    backgroundColor: SCORPIO_GOLD,
  },
  reasonChipText: {
    color: "#ffffff",
    fontSize: 11.5,
    fontWeight: "800",
  },
  reasonChipTextActive: {
    color: "#111111",
    fontWeight: "900",
  },
  messageBox: {
    minHeight: 140,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#303030",
    backgroundColor: "#101010",
    padding: 13,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginBottom: 12,
  },
  messageInput: {
    flex: 1,
    minHeight: 112,
    color: "#ffffff",
    fontSize: 13,
    lineHeight: 18,
    padding: 0,
  },
  safeNote: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(230,193,92,0.22)",
    backgroundColor: "rgba(230,193,92,0.08)",
    padding: 11,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginBottom: 12,
  },
  safeNoteText: {
    color: "#d8d8d8",
    fontSize: 11,
    lineHeight: 15,
    fontWeight: "700",
    flex: 1,
  },
  errorText: {
    color: "#ff7b7b",
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "800",
    marginBottom: 12,
  },
  submitButton: {
    minHeight: 52,
    borderRadius: 18,
    backgroundColor: SCORPIO_GOLD,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  submitButtonDisabled: {
    opacity: 0.45,
  },
  submitButtonText: {
    color: "#111111",
    fontSize: 14,
    fontWeight: "900",
  },
  successWrap: {
    flex: 1,
    paddingHorizontal: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  successIcon: {
    width: 82,
    height: 82,
    borderRadius: 28,
    backgroundColor: SCORPIO_GOLD,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },
  successTitle: {
    color: "#ffffff",
    fontSize: 24,
    fontWeight: "900",
    textAlign: "center",
  },
  successText: {
    color: "#cfcfcf",
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
    marginTop: 8,
    marginBottom: 24,
    fontWeight: "700",
  },
  primaryButton: {
    minHeight: 50,
    borderRadius: 18,
    backgroundColor: SCORPIO_GOLD,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 36,
  },
  primaryButtonText: {
    color: "#111111",
    fontSize: 14,
    fontWeight: "900",
  },
});
