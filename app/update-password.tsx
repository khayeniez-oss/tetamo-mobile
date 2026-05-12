import * as Linking from "expo-linking";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
    AlertCircle,
    ArrowLeft,
    CheckCircle2,
    Eye,
    EyeOff,
    LockKeyhole,
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

export default function UpdatePasswordScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const [language, setLanguage] = useState<Language>("en");
  const [initializing, setInitializing] = useState(true);
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const ui = useMemo(() => {
    if (language === "id") {
      return {
        badge: "Buat Password Baru",
        title: "Atur ulang kata sandi Anda",
        subtitle: "Masukkan kata sandi baru untuk akun Tetamo Anda.",
        helperTitle: "Aman dan cepat",
        helperText:
          "Gunakan kata sandi yang kuat dan mudah Anda ingat. Setelah berhasil, silakan login kembali.",
        newPassword: "Kata Sandi Baru",
        confirmPassword: "Konfirmasi Kata Sandi",
        newPasswordPlaceholder: "Masukkan kata sandi baru",
        confirmPasswordPlaceholder: "Ulangi kata sandi baru",
        updateButton: "Update Password",
        updating: "Mengupdate password...",
        backToLogin: "Kembali ke Login",
        successTitle: "Password berhasil diupdate",
        successMessage:
          "Kata sandi Anda sudah berhasil diperbarui. Silakan login kembali dengan password baru.",
        loadingSession: "Memeriksa link reset password...",
        invalidLink:
          "Link reset password tidak valid atau sudah expired. Silakan request link baru.",
        emptyPassword: "Masukkan kata sandi baru.",
        shortPassword: "Kata sandi minimal 8 karakter.",
        mismatchPassword: "Konfirmasi kata sandi tidak sama.",
        requestNewLink: "Request link baru",
      };
    }

    return {
      badge: "Create New Password",
      title: "Reset your password",
      subtitle: "Enter a new password for your Tetamo account.",
      helperTitle: "Secure and quick",
      helperText:
        "Use a strong password that you can remember. After success, please log in again.",
      newPassword: "New Password",
      confirmPassword: "Confirm Password",
      newPasswordPlaceholder: "Enter new password",
      confirmPasswordPlaceholder: "Repeat new password",
      updateButton: "Update Password",
      updating: "Updating password...",
      backToLogin: "Back to Login",
      successTitle: "Password updated",
      successMessage:
        "Your password has been updated successfully. Please log in again with your new password.",
      loadingSession: "Checking password reset link...",
      invalidLink:
        "The password reset link is invalid or expired. Please request a new link.",
      emptyPassword: "Enter your new password.",
      shortPassword: "Password must be at least 8 characters.",
      mismatchPassword: "Password confirmation does not match.",
      requestNewLink: "Request new link",
    };
  }, [language]);

  const paramCode = readParam(params.code);
  const paramAccessToken = readParam(params.access_token);
  const paramRefreshToken = readParam(params.refresh_token);
  const paramError =
    readParam(params.error_description) || readParam(params.error);

  useEffect(() => {
    let mounted = true;

    async function prepareRecoverySession(incomingUrl = "") {
      setInitializing(true);
      setReady(false);
      setErrorMessage("");

      try {
        const authParams = extractAuthParamsFromUrl(incomingUrl, {
          code: paramCode,
          accessToken: paramAccessToken,
          refreshToken: paramRefreshToken,
          error: paramError,
        });

        if (authParams.error) {
          throw new Error(authParams.error);
        }

        if (authParams.code) {
          const { error } = await supabase.auth.exchangeCodeForSession(
            authParams.code
          );

          if (error) throw error;
        } else if (authParams.accessToken && authParams.refreshToken) {
          const { error } = await supabase.auth.setSession({
            access_token: authParams.accessToken,
            refresh_token: authParams.refreshToken,
          });

          if (error) throw error;
        }

        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) throw error;
        if (!session?.user) throw new Error(ui.invalidLink);

        if (!mounted) return;

        setReady(true);
        setInitializing(false);
      } catch (error: any) {
        if (!mounted) return;

        setReady(false);
        setInitializing(false);
        setErrorMessage(error?.message || ui.invalidLink);
      }
    }

    async function start() {
      const initialUrl = await Linking.getInitialURL();
      await prepareRecoverySession(initialUrl || "");
    }

    void start();

    const subscription = Linking.addEventListener("url", ({ url }) => {
      void prepareRecoverySession(url);
    });

    return () => {
      mounted = false;
      subscription.remove();
    };
  }, [
    paramCode,
    paramAccessToken,
    paramRefreshToken,
    paramError,
    ui.invalidLink,
  ]);

  async function handleUpdatePassword() {
    setErrorMessage("");

    const newPassword = password.trim();
    const confirmNewPassword = confirmPassword.trim();

    if (!newPassword) {
      setErrorMessage(ui.emptyPassword);
      return;
    }

    if (newPassword.length < 8) {
      setErrorMessage(ui.shortPassword);
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setErrorMessage(ui.mismatchPassword);
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        setErrorMessage(error.message);
        return;
      }

      await supabase.auth.signOut();

      setSuccess(true);
      setReady(false);
      setPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      setErrorMessage(error?.message || "Unable to update password.");
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
            <Pressable
              style={styles.backButton}
              onPress={() => router.replace("/login" as any)}
            >
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
            <View style={styles.lockIcon}>
              <LockKeyhole color="#e6c15c" size={26} />
            </View>

            <Text style={styles.formTitle}>
              {success ? ui.successTitle : ui.title}
            </Text>

            <Text style={styles.formSub}>
              {success ? ui.successMessage : ui.subtitle}
            </Text>

            {initializing ? (
              <View style={styles.loadingBox}>
                <ActivityIndicator color="#e6c15c" />
                <Text style={styles.loadingText}>{ui.loadingSession}</Text>
              </View>
            ) : null}

            {errorMessage ? (
              <View style={styles.errorBox}>
                <AlertCircle color="#fb7185" size={18} />
                <View style={styles.errorTextBox}>
                  <Text style={styles.errorText}>{errorMessage}</Text>

                  {!ready ? (
                    <Pressable
                      onPress={() => router.replace("/forgot-password" as any)}
                    >
                      <Text style={styles.errorLink}>{ui.requestNewLink}</Text>
                    </Pressable>
                  ) : null}
                </View>
              </View>
            ) : null}

            {success ? (
              <View style={styles.successBox}>
                <CheckCircle2 color="#22c55e" size={19} />
                <View style={styles.successTextBox}>
                  <Text style={styles.successTitle}>{ui.successTitle}</Text>
                  <Text style={styles.successText}>{ui.successMessage}</Text>
                </View>
              </View>
            ) : null}

            {!initializing && ready && !success ? (
              <>
                <View>
                  <Text style={styles.inputLabel}>{ui.newPassword}</Text>

                  <View style={styles.passwordWrap}>
                    <TextInput
                      value={password}
                      onChangeText={(value) => {
                        setPassword(value);
                        setErrorMessage("");
                      }}
                      placeholder={ui.newPasswordPlaceholder}
                      placeholderTextColor="#777777"
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                      style={styles.passwordInput}
                    />

                    <Pressable
                      style={styles.eyeButton}
                      onPress={() => setShowPassword((prev) => !prev)}
                    >
                      {showPassword ? (
                        <EyeOff color="#ffffff" size={18} />
                      ) : (
                        <Eye color="#ffffff" size={18} />
                      )}
                    </Pressable>
                  </View>
                </View>

                <View>
                  <Text style={styles.inputLabel}>{ui.confirmPassword}</Text>

                  <View style={styles.passwordWrap}>
                    <TextInput
                      value={confirmPassword}
                      onChangeText={(value) => {
                        setConfirmPassword(value);
                        setErrorMessage("");
                      }}
                      placeholder={ui.confirmPasswordPlaceholder}
                      placeholderTextColor="#777777"
                      secureTextEntry={!showConfirmPassword}
                      autoCapitalize="none"
                      style={styles.passwordInput}
                    />

                    <Pressable
                      style={styles.eyeButton}
                      onPress={() =>
                        setShowConfirmPassword((prev) => !prev)
                      }
                    >
                      {showConfirmPassword ? (
                        <EyeOff color="#ffffff" size={18} />
                      ) : (
                        <Eye color="#ffffff" size={18} />
                      )}
                    </Pressable>
                  </View>
                </View>

                <Pressable
                  style={[styles.primaryButton, loading && styles.primaryDisabled]}
                  disabled={loading}
                  onPress={handleUpdatePassword}
                >
                  {loading ? (
                    <ActivityIndicator color="#111111" />
                  ) : (
                    <Text style={styles.primaryButtonText}>
                      {ui.updateButton}
                    </Text>
                  )}
                </Pressable>
              </>
            ) : null}

            {!initializing && !ready && !success ? (
              <Pressable
                style={styles.primaryButton}
                onPress={() => router.replace("/forgot-password" as any)}
              >
                <Text style={styles.primaryButtonText}>{ui.requestNewLink}</Text>
              </Pressable>
            ) : null}

            {success ? (
              <Pressable
                style={styles.primaryButton}
                onPress={() => router.replace("/login" as any)}
              >
                <Text style={styles.primaryButtonText}>{ui.backToLogin}</Text>
              </Pressable>
            ) : null}
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

function extractAuthParamsFromUrl(
  url: string,
  fallback: {
    code: string;
    accessToken: string;
    refreshToken: string;
    error: string;
  }
) {
  const cleanUrl = String(url || "");

  const queryString = cleanUrl.includes("?")
    ? cleanUrl.split("?")[1]?.split("#")[0] || ""
    : "";

  const hashString = cleanUrl.includes("#") ? cleanUrl.split("#")[1] || "" : "";

  const queryParams = new URLSearchParams(queryString);
  const hashParams = new URLSearchParams(hashString);

  return {
    code: queryParams.get("code") || hashParams.get("code") || fallback.code,
    accessToken:
      queryParams.get("access_token") ||
      hashParams.get("access_token") ||
      fallback.accessToken,
    refreshToken:
      queryParams.get("refresh_token") ||
      hashParams.get("refresh_token") ||
      fallback.refreshToken,
    error:
      queryParams.get("error_description") ||
      hashParams.get("error_description") ||
      queryParams.get("error") ||
      hashParams.get("error") ||
      fallback.error,
  };
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
  lockIcon: {
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
  loadingBox: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#303030",
    backgroundColor: "#050505",
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
  },
  loadingText: {
    color: "#ffffff",
    fontSize: 11.5,
    fontWeight: "800",
  },
  errorBox: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#7f1d1d",
    backgroundColor: "#2a0d0d",
    padding: 12,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 9,
  },
  errorTextBox: {
    flex: 1,
  },
  errorText: {
    color: "#fecaca",
    fontSize: 11.5,
    lineHeight: 16,
    fontWeight: "700",
  },
  errorLink: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "900",
    marginTop: 5,
    textDecorationLine: "underline",
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
  successTextBox: {
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
  inputLabel: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "900",
    marginBottom: 7,
  },
  passwordWrap: {
    minHeight: 50,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#303030",
    backgroundColor: "#050505",
    flexDirection: "row",
    alignItems: "center",
  },
  passwordInput: {
    flex: 1,
    color: "#ffffff",
    paddingHorizontal: 13,
    fontSize: 13,
    fontWeight: "700",
  },
  eyeButton: {
    width: 46,
    height: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButton: {
    minHeight: 49,
    borderRadius: 17,
    backgroundColor: "#e6c15c",
    alignItems: "center",
    justifyContent: "center",
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
});