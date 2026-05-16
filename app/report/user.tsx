import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
    AlertTriangle,
    CheckCircle2,
    ChevronLeft,
    Mail,
    MessageSquare,
    Send,
    ShieldAlert,
    UserRound,
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

const SCORPIO_GOLD = "#e6c15c";
const SUPPORT_EMAIL = "inquiry@tetamo.com";

const reportReasons = [
  "Suspicious user or agent",
  "Scam concern",
  "Fake identity",
  "Harassment or abusive behavior",
  "Inappropriate behavior",
  "Safety concern",
  "Other problem",
];

export default function ReportUserScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const reportedUserId = safeParam(
    params.reported_user_id || params.reportedUserId || params.user_id
  );
  const reportedName = safeParam(params.name || params.user_name);
  const reportedRole = safeParam(params.role || params.user_role);
  const relatedListingCode = safeParam(params.listing_code || params.code);

  const [selectedReason, setSelectedReason] = useState(reportReasons[0]);
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckingUser, setIsCheckingUser] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorText, setErrorText] = useState("");

  const userLabel = useMemo(() => {
    if (reportedName) return reportedName;
    if (reportedRole) return reportedRole;
    return "Selected user";
  }, [reportedName, reportedRole]);

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
    const subject = encodeURIComponent("Tetamo User Report");
    const body = encodeURIComponent(
      `Hello Tetamo,\n\nI would like to report a user.\n\nUser: ${userLabel}\nRole: ${
        reportedRole || "-"
      }\nRelated listing: ${relatedListingCode || "-"}\nReason: ${
        selectedReason || "-"
      }\n\nDetails:\n${message || ""}`
    );

    void Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`);
  };

  const submitReport = async () => {
    setErrorText("");

    if (!selectedReason) {
      setErrorText("Please choose a reason for the report.");
      return;
    }

    setIsSubmitting(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.id) {
      setIsSubmitting(false);
      setIsLoggedIn(false);
      setErrorText("Please sign in first so Tetamo can review your report safely.");
      return;
    }

    const { error } = await supabase.from("user_reports").insert({
      reporter_user_id: user.id,
      reported_user_id: isUuid(reportedUserId) ? reportedUserId : null,
      listing_code: relatedListingCode || null,
      report_type: "user",
      reason: selectedReason,
      message: message.trim() || null,
      source: "tetamo-mobile",
      metadata: {
        reported_name: reportedName || null,
        reported_role: reportedRole || null,
        related_listing_code: relatedListingCode || null,
        submitted_from: "mobile_app",
      },
    });

    setIsSubmitting(false);

    if (error) {
      setErrorText("We could not submit your report. Please try again or contact Tetamo support.");
      return;
    }

    setSubmitted(true);
  };

  if (submitted) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="light" />

        <View style={styles.successWrap}>
          <View style={styles.successIcon}>
            <CheckCircle2 color="#111111" size={38} />
          </View>

          <Text style={styles.successTitle}>Report submitted</Text>

          <Text style={styles.successText}>
            Thank you for helping keep Tetamo safe. Our team will review this report.
          </Text>

          <Pressable style={styles.primaryButton} onPress={() => router.back()}>
            <Text style={styles.primaryButtonText}>Done</Text>
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
              <Text style={styles.headerTitle}>Report User</Text>
              <Text style={styles.headerSub}>Help us keep Tetamo safe and trusted.</Text>
            </View>
          </View>

          <View style={styles.heroCard}>
            <View style={styles.heroIcon}>
              <ShieldAlert color={SCORPIO_GOLD} size={28} />
            </View>

            <View style={styles.heroTextBox}>
              <Text style={styles.heroTitle}>Tell us what happened</Text>
              <Text style={styles.heroText}>
                Reports help Tetamo protect the community from unsafe or suspicious activity.
              </Text>
            </View>
          </View>

          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <UserRound color={SCORPIO_GOLD} size={17} />
              <Text style={styles.infoTitle} numberOfLines={2}>
                {userLabel}
              </Text>
            </View>

            {!!reportedRole && <Text style={styles.infoSub}>Role: {reportedRole}</Text>}

            {!!relatedListingCode && (
              <Text style={styles.infoSub}>Related listing: {relatedListingCode}</Text>
            )}
          </View>

          {isCheckingUser ? (
            <View style={styles.noticeCard}>
              <Text style={styles.noticeText}>Checking your account...</Text>
            </View>
          ) : !isLoggedIn ? (
            <View style={styles.noticeCard}>
              <View style={styles.noticeIcon}>
                <ShieldAlert color={SCORPIO_GOLD} size={18} />
              </View>

              <Text style={styles.noticeTitle}>Sign in required</Text>
              <Text style={styles.noticeText}>
                Please sign in to submit a report. This helps Tetamo review reports safely.
              </Text>

              <View style={styles.noticeButtons}>
                <Pressable
                  style={styles.noticeButtonGold}
                  onPress={() => router.push("/login" as any)}
                >
                  <Text style={styles.noticeButtonGoldText}>Sign In</Text>
                </Pressable>

                <Pressable style={styles.noticeButtonDark} onPress={openSupportEmail}>
                  <Mail color={SCORPIO_GOLD} size={14} />
                  <Text style={styles.noticeButtonDarkText}>Email Tetamo</Text>
                </Pressable>
              </View>
            </View>
          ) : null}

          <Text style={styles.sectionLabel}>Reason</Text>

          <View style={styles.reasonWrap}>
            {reportReasons.map((reason) => {
              const active = selectedReason === reason;

              return (
                <Pressable
                  key={reason}
                  style={[styles.reasonChip, active && styles.reasonChipActive]}
                  onPress={() => setSelectedReason(reason)}
                >
                  <Text
                    style={[
                      styles.reasonChipText,
                      active && styles.reasonChipTextActive,
                    ]}
                  >
                    {reason}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={styles.sectionLabel}>Additional details</Text>

          <View style={styles.messageBox}>
            <MessageSquare color={SCORPIO_GOLD} size={18} />

            <TextInput
              value={message}
              onChangeText={setMessage}
              placeholder="Tell us more about the issue..."
              placeholderTextColor="#7d7d7d"
              style={styles.messageInput}
              multiline
              textAlignVertical="top"
              maxLength={1000}
            />
          </View>

          <View style={styles.safeNote}>
            <AlertTriangle color={SCORPIO_GOLD} size={16} />
            <Text style={styles.safeNoteText}>
              Please do not include sensitive personal information unless it is needed for the report.
            </Text>
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
              {isSubmitting ? "Submitting..." : "Submit Report"}
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
    value
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