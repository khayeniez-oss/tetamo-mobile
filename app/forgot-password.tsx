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

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const [language, setLanguage] = useState<Language>("en");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const ui = useMemo(() => {
    if (language === "id") {
      return {
        badge: "Reset Password",
        title: "Lupa kata sandi?",
        subtitle:
          "Masukkan email akun Tetamo Anda. Kami akan mengirimkan link untuk membuat kata sandi baru.",
        emailLabel: "Email",
        emailPlaceholder: "Masukkan email Anda",
        sendButton: "Kirim Link Reset",
        sending: "Mengirim link...",
        backToLogin: "Kembali ke Login",
        successTitle: "Cek email Anda",
        successMessage:
          "Jika email tersebut terdaftar, link reset password sudah dikirim. Silakan cek inbox atau folder spam.",
        emptyEmail: "Masukkan email Anda.",
        invalidEmail: "Format email tidak valid.",
        helperTitle: "Aman dan mudah",
        helperText:
          "Link reset hanya dikirim ke email akun Anda. Setelah itu, Anda bisa membuat kata sandi baru.",
        remember: "Ingat kata sandi Anda?",
        login: "Masuk",
      };
    }

    return {
      badge: "Password Reset",
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
      helperTitle: "Secure and simple",
      helperText:
        "The reset link is sent only to your account email. After that, you can create a new password.",
      remember: "Remember your password?",
      login: "Log in",
    };
  }, [language]);

  useEffect(() => {
    const emailFromUrl = readParam(params.email);

    if (emailFromUrl) {
      setEmail(emailFromUrl.trim().toLowerCase());
    }
  }, [params.email]);

  async function handleResetPassword() {
    const trimmedEmail = email.trim().toLowerCase();

    setMessage("");
    setErrorMessage("");

    if (!trimmedEmail) {
      setErrorMessage(ui.emptyEmail);
      return;
    }

    if (!isValidEmail(trimmedEmail)) {
      setErrorMessage(ui.invalidEmail);
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
        }
      );

      if (error) {
        setErrorMessage(error.message);
        return;
      }

      setMessage(ui.successMessage);
    } catch (error: any) {
      setErrorMessage(error?.message || "Unable to send reset link.");
    } finally {
      setLoading(false);
    }
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
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.topRow}>
            <Pressable style={styles.backButton} onPress={() => router.push("/login" as any)}>
              <ArrowLeft color="#ffffff" size={16} />
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

          <View style={styles.heroPanel}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{ui.badge}</Text>
            </View>

            <Text style={styles.title}>{ui.title}</Text>
            <Text style={styles.subtitle}>{ui.subtitle}</Text>

            <View style={styles.helperBox}>
              <View style={styles.helperIcon}>
                <ShieldCheck color="#e6c15c" size={22} />
              </View>

              <View style={styles.helperTextBox}>
                <Text style={styles.helperTitle}>{ui.helperTitle}</Text>
                <Text style={styles.helperText}>{ui.helperText}</Text>
              </View>
            </View>
          </View>

          <View style={styles.formPanel}>
            <View style={styles.mailIcon}>
              <Mail color="#e6c15c" size={26} />
            </View>

            <Text style={styles.formTitle}>{ui.title}</Text>
            <Text style={styles.formSub}>{ui.subtitle}</Text>

            {message ? (
              <View style={styles.successBox}>
                <CheckCircle2 color="#22c55e" size={19} />
                <View style={styles.messageTextBox}>
                  <Text style={styles.successTitle}>{ui.successTitle}</Text>
                  <Text style={styles.successText}>{message}</Text>
                </View>
              </View>
            ) : null}

            {errorMessage ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            ) : null}

            <View>
              <Text style={styles.inputLabel}>{ui.emailLabel}</Text>

              <TextInput
                value={email}
                onChangeText={(value) => {
                  setEmail(value);
                  setMessage("");
                  setErrorMessage("");
                }}
                placeholder={ui.emailPlaceholder}
                placeholderTextColor="#777777"
                keyboardType="email-address"
                autoCapitalize="none"
                style={styles.input}
              />
            </View>

            <Pressable
              style={[styles.primaryButton, loading && styles.primaryDisabled]}
              disabled={loading}
              onPress={handleResetPassword}
            >
              {loading ? (
                <ActivityIndicator color="#111111" />
              ) : (
                <>
                  <Send color="#111111" size={16} />
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
    backgroundColor: "#050505",
  },
  keyboard: {
    flex: 1,
  },
  scroll: {
    flex: 1,
    backgroundColor: "#050505",
  },
  content: {
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 34,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    gap: 10,
  },
  backButton: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#333333",
    backgroundColor: "#101010",
    paddingHorizontal: 12,
    paddingVertical: 9,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  backText: {
    color: "#ffffff",
    fontSize: 11.5,
    fontWeight: "900",
  },
  langToggle: {
    flexDirection: "row",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#5b4a24",
    overflow: "hidden",
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
    fontSize: 10,
    fontWeight: "900",
  },
  langTextActive: {
    color: "#111111",
  },
  heroPanel: {
    borderRadius: 26,
    borderWidth: 1,
    borderColor: "#303030",
    backgroundColor: "#101010",
    padding: 17,
    marginBottom: 14,
  },
  badge: {
    alignSelf: "flex-start",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#705d2c",
    backgroundColor: "#211a0b",
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  badgeText: {
    color: "#e6c15c",
    fontSize: 9.5,
    fontWeight: "900",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  title: {
    color: "#ffffff",
    fontSize: 30,
    lineHeight: 36,
    fontWeight: "900",
    letterSpacing: -0.6,
    marginTop: 13,
  },
  subtitle: {
    color: "#b8b8b8",
    fontSize: 13,
    lineHeight: 19,
    fontWeight: "700",
    marginTop: 8,
  },
  helperBox: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#705d2c",
    backgroundColor: "#211a0b",
    padding: 13,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 11,
    marginTop: 15,
  },
  helperIcon: {
    width: 42,
    height: 42,
    borderRadius: 15,
    backgroundColor: "#151106",
    borderWidth: 1,
    borderColor: "#705d2c",
    alignItems: "center",
    justifyContent: "center",
  },
  helperTextBox: {
    flex: 1,
  },
  helperTitle: {
    color: "#ffffff",
    fontSize: 13.5,
    fontWeight: "900",
  },
  helperText: {
    color: "#d6d6d6",
    fontSize: 11.2,
    lineHeight: 16,
    fontWeight: "700",
    marginTop: 4,
  },
  formPanel: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#303030",
    backgroundColor: "#101010",
    padding: 16,
    gap: 13,
  },
  mailIcon: {
    width: 58,
    height: 58,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#303030",
    backgroundColor: "#171717",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
  },
  formTitle: {
    color: "#ffffff",
    fontSize: 22,
    fontWeight: "900",
    textAlign: "center",
    marginTop: 2,
  },
  formSub: {
    color: "#a9a9a9",
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "700",
    textAlign: "center",
  },
  successBox: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#14532d",
    backgroundColor: "#052e16",
    padding: 12,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 9,
  },
  messageTextBox: {
    flex: 1,
  },
  successTitle: {
    color: "#bbf7d0",
    fontSize: 12.5,
    fontWeight: "900",
  },
  successText: {
    color: "#bbf7d0",
    fontSize: 11.5,
    lineHeight: 16,
    fontWeight: "700",
    marginTop: 2,
  },
  errorBox: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#7f1d1d",
    backgroundColor: "#2a0d0d",
    padding: 12,
  },
  errorText: {
    color: "#fecaca",
    fontSize: 11.5,
    lineHeight: 16,
    fontWeight: "700",
  },
  inputLabel: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "900",
    marginBottom: 7,
  },
  input: {
    minHeight: 50,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#303030",
    backgroundColor: "#050505",
    color: "#ffffff",
    paddingHorizontal: 13,
    fontSize: 13,
    fontWeight: "700",
  },
  primaryButton: {
    minHeight: 49,
    borderRadius: 17,
    backgroundColor: "#e6c15c",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    paddingHorizontal: 14,
  },
  primaryDisabled: {
    opacity: 0.55,
  },
  primaryButtonText: {
    color: "#111111",
    fontSize: 13,
    fontWeight: "900",
  },
  loginRow: {
    flexDirection: "row",
    justifyContent: "center",
    flexWrap: "wrap",
  },
  loginQuestion: {
    color: "#a9a9a9",
    fontSize: 12,
    fontWeight: "700",
  },
  loginLink: {
    color: "#e6c15c",
    fontSize: 12,
    fontWeight: "900",
    textDecorationLine: "underline",
  },
});