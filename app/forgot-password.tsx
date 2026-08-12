import { makeRedirectUri } from "expo-auth-session";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
  ArrowLeft,
  CheckCircle2,
  Mail,
  Send,
  ShieldCheck,
} from "lucide-react-native";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
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
type MessageType = "" | "success";
type ErrorType = "" | "emptyEmail" | "invalidEmail" | "unableSend" | "custom";

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const [language, setLanguage] = useState<Language>("en");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [messageType, setMessageType] = useState<MessageType>("");
  const [errorType, setErrorType] = useState<ErrorType>("");
  const [customError, setCustomError] = useState("");

  const ui = useMemo(() => {
    if (language === "id") {
      return {
        badge: "RESET KATA SANDI",
        title: "Lupa kata sandi?",
        subtitle:
          "Masukkan email akun Tetamo Anda. Kami akan mengirimkan tautan untuk membuat kata sandi baru.",
        emailLabel: "Email",
        emailPlaceholder: "Masukkan email Anda",
        sendButton: "Kirim Tautan Reset",
        sending: "Mengirim tautan...",
        backToLogin: "Kembali ke Login",
        successTitle: "Cek email Anda",
        successMessage:
          "Jika email tersebut terdaftar, tautan reset kata sandi sudah dikirim. Silakan cek inbox atau folder spam.",
        emptyEmail: "Masukkan email Anda.",
        invalidEmail: "Format email tidak valid.",
        unableSend: "Tautan reset belum bisa dikirim. Silakan coba lagi.",
        helperTitle: "Aman dan mudah",
        helperText:
          "Tautan reset hanya dikirim ke email akun Anda. Setelah itu, Anda bisa membuat kata sandi baru.",
        remember: "Ingat kata sandi Anda?",
        login: "Masuk",
      };
    }

    return {
      badge: "PASSWORD RESET",
      title: "Forgot your password?",
      subtitle:
        "Enter your Tetamo account email. We will send you a link to create a new password.",
      emailLabel: "Email",
      emailPlaceholder: "Enter your email",
      sendButton: "Send Reset Link",
      sending: "Sending link...",
      backToLogin: "Back to Login",
      successTitle: "Check your email",
      successMessage:
        "If that email is registered, a password reset link has been sent. Please check your inbox or spam folder.",
      emptyEmail: "Enter your email.",
      invalidEmail: "Please enter a valid email address.",
      unableSend: "Unable to send the reset link. Please try again.",
      helperTitle: "Secure and simple",
      helperText:
        "The reset link is sent only to your account email. After that, you can create a new password.",
      remember: "Remember your password?",
      login: "Log in",
    };
  }, [language]);

  const successMessage = messageType === "success" ? ui.successMessage : "";

  const errorMessage =
    errorType === "emptyEmail"
      ? ui.emptyEmail
      : errorType === "invalidEmail"
        ? ui.invalidEmail
        : errorType === "unableSend"
          ? ui.unableSend
          : errorType === "custom"
            ? customError
            : "";

  useEffect(() => {
    const emailFromUrl = readParam(params.email);

    if (emailFromUrl) {
      setEmail(emailFromUrl.trim().toLowerCase());
    }
  }, [params.email]);

  function resetMessages() {
    setMessageType("");
    setErrorType("");
    setCustomError("");
  }

  async function handleResetPassword() {
    const trimmedEmail = email.trim().toLowerCase();

    resetMessages();

    if (!trimmedEmail) {
      setErrorType("emptyEmail");
      return;
    }

    if (!isValidEmail(trimmedEmail)) {
      setErrorType("invalidEmail");
      return;
    }

    setLoading(true);

    try {
      const redirectTo = makeRedirectUri({
        scheme: "tetamomobile",
        path: "update-password",
      });

      const { error } = await supabase.auth.resetPasswordForEmail(
        trimmedEmail,
        {
          redirectTo,
        },
      );

      if (error) {
        setErrorType("custom");
        setCustomError(error.message || ui.unableSend);
        return;
      }

      setMessageType("success");
    } catch (error: any) {
      setErrorType("custom");
      setCustomError(error?.message || ui.unableSend);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />

      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.topRow}>
            <Pressable
              style={styles.backButton}
              onPress={() => router.push("/login" as any)}
            >
              <ArrowLeft color="#171717" size={16} />
              <Text style={styles.backText}>{ui.backToLogin}</Text>
            </Pressable>

            <View style={styles.langToggle}>
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

          <View style={styles.formPanel}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{ui.badge}</Text>
            </View>

            <View style={styles.mailIcon}>
              <Mail color="#A47B21" size={27} />
            </View>

            <Text style={styles.formTitle}>{ui.title}</Text>
            <Text style={styles.formSub}>{ui.subtitle}</Text>

            <View style={styles.helperBox}>
              <View style={styles.helperIcon}>
                <ShieldCheck color="#A47B21" size={20} />
              </View>

              <View style={styles.helperTextBox}>
                <Text style={styles.helperTitle}>{ui.helperTitle}</Text>
                <Text style={styles.helperText}>{ui.helperText}</Text>
              </View>
            </View>

            {successMessage ? (
              <View style={styles.successBox}>
                <CheckCircle2 color="#27835C" size={19} />

                <View style={styles.messageTextBox}>
                  <Text style={styles.successTitle}>{ui.successTitle}</Text>
                  <Text style={styles.successText}>{successMessage}</Text>
                </View>
              </View>
            ) : null}

            {errorMessage ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            ) : null}

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{ui.emailLabel}</Text>

              <TextInput
                value={email}
                onChangeText={(value) => {
                  setEmail(value);
                  resetMessages();
                }}
                placeholder={ui.emailPlaceholder}
                placeholderTextColor="#9A948B"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                style={styles.input}
              />
            </View>

            <Pressable
              style={[
                styles.primaryButton,
                loading && styles.primaryDisabled,
              ]}
              disabled={loading}
              onPress={handleResetPassword}
            >
              {loading ? (
                <>
                  <ActivityIndicator color="#171717" />
                  <Text style={styles.primaryButtonText}>{ui.sending}</Text>
                </>
              ) : (
                <>
                  <Send color="#171717" size={16} />
                  <Text style={styles.primaryButtonText}>{ui.sendButton}</Text>
                </>
              )}
            </Pressable>

            <View style={styles.loginRow}>
              <Text style={styles.loginQuestion}>{ui.remember} </Text>

              <Pressable onPress={() => router.push("/login" as any)}>
                <Text style={styles.loginLink}>{ui.login}</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function readParam(value: unknown) {
  if (Array.isArray(value)) return String(value[0] || "");
  return String(value || "");
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F7F5EF",
  },

  keyboard: {
    flex: 1,
  },

  scroll: {
    flex: 1,
    backgroundColor: "#F7F5EF",
  },

  content: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },

  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 28,
    gap: 10,
  },

  backButton: {
    minHeight: 40,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#E3DDD4",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 13,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  backText: {
    color: "#171717",
    fontSize: 11.5,
    fontWeight: "900",
  },

  langToggle: {
    flexDirection: "row",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#DCCB9A",
    backgroundColor: "#FFFFFF",
    overflow: "hidden",
  },

  langButton: {
    paddingHorizontal: 11,
    paddingVertical: 8,
  },

  langButtonActive: {
    backgroundColor: "#F0D889",
  },

  langText: {
    color: "#9A7624",
    fontSize: 10,
    fontWeight: "900",
  },

  langTextActive: {
    color: "#171717",
  },

  formPanel: {
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "#E8E1D7",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 20,
    paddingVertical: 24,
  },

  badge: {
    alignSelf: "center",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#DFC76E",
    backgroundColor: "#FFF8DF",
    paddingHorizontal: 11,
    paddingVertical: 6,
  },

  badgeText: {
    color: "#9A7624",
    fontSize: 9.5,
    fontWeight: "900",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },

  mailIcon: {
    width: 62,
    height: 62,
    borderRadius: 21,
    borderWidth: 1,
    borderColor: "#E5D9B6",
    backgroundColor: "#FFF9EA",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginTop: 20,
  },

  formTitle: {
    color: "#171717",
    fontSize: 26,
    lineHeight: 31,
    fontWeight: "900",
    letterSpacing: -0.5,
    textAlign: "center",
    marginTop: 18,
  },

  formSub: {
    color: "#777169",
    fontSize: 12.5,
    lineHeight: 19,
    fontWeight: "600",
    textAlign: "center",
    marginTop: 8,
  },

  helperBox: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E7DBB9",
    backgroundColor: "#FFFAED",
    padding: 13,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    marginTop: 20,
  },

  helperIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: "#FFF3CB",
    alignItems: "center",
    justifyContent: "center",
  },

  helperTextBox: {
    flex: 1,
  },

  helperTitle: {
    color: "#38332E",
    fontSize: 12.5,
    fontWeight: "900",
  },

  helperText: {
    color: "#777169",
    fontSize: 10.8,
    lineHeight: 15,
    fontWeight: "600",
    marginTop: 3,
  },

  successBox: {
    borderRadius: 17,
    borderWidth: 1,
    borderColor: "#B9DEC8",
    backgroundColor: "#EFFAF3",
    padding: 12,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 9,
    marginTop: 16,
  },

  messageTextBox: {
    flex: 1,
  },

  successTitle: {
    color: "#206B49",
    fontSize: 12.5,
    fontWeight: "900",
  },

  successText: {
    color: "#397A5B",
    fontSize: 11,
    lineHeight: 16,
    fontWeight: "600",
    marginTop: 2,
  },

  errorBox: {
    borderRadius: 17,
    borderWidth: 1,
    borderColor: "#EAC5C5",
    backgroundColor: "#FFF2F2",
    padding: 12,
    marginTop: 16,
  },

  errorText: {
    color: "#A23C3C",
    fontSize: 11.5,
    lineHeight: 16,
    fontWeight: "700",
  },

  inputGroup: {
    marginTop: 20,
  },

  inputLabel: {
    color: "#38332E",
    fontSize: 11.5,
    fontWeight: "900",
    marginBottom: 7,
  },

  input: {
    minHeight: 52,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#DDD6CC",
    backgroundColor: "#FAF9F6",
    color: "#171717",
    paddingHorizontal: 14,
    fontSize: 13,
    fontWeight: "600",
  },

  primaryButton: {
    minHeight: 52,
    borderRadius: 17,
    backgroundColor: "#F0C957",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    paddingHorizontal: 14,
    marginTop: 14,
  },

  primaryDisabled: {
    opacity: 0.55,
  },

  primaryButtonText: {
    color: "#171717",
    fontSize: 12.5,
    fontWeight: "900",
  },

  loginRow: {
    flexDirection: "row",
    justifyContent: "center",
    flexWrap: "wrap",
    marginTop: 18,
  },

  loginQuestion: {
    color: "#8A847C",
    fontSize: 11.5,
    fontWeight: "600",
  },

  loginLink: {
    color: "#9A7624",
    fontSize: 11.5,
    fontWeight: "900",
    textDecorationLine: "underline",
  },
});
