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
type ErrorType =
  | ""
  | "invalidLink"
  | "emptyPassword"
  | "shortPassword"
  | "mismatchPassword"
  | "unableUpdate"
  | "custom";

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
  const [errorType, setErrorType] = useState<ErrorType>("");
  const [customError, setCustomError] = useState("");

  const ui = useMemo(() => {
    if (language === "id") {
      return {
        badge: "BUAT KATA SANDI BARU",
        title: "Atur ulang kata sandi Anda",
        subtitle: "Masukkan kata sandi baru untuk akun Tetamo Anda.",
        helperTitle: "Aman dan cepat",
        helperText:
          "Gunakan kata sandi yang kuat dan mudah Anda ingat. Setelah berhasil, silakan login kembali.",
        newPassword: "Kata Sandi Baru",
        confirmPassword: "Konfirmasi Kata Sandi",
        newPasswordPlaceholder: "Masukkan kata sandi baru",
        confirmPasswordPlaceholder: "Ulangi kata sandi baru",
        updateButton: "Perbarui Kata Sandi",
        updating: "Memperbarui kata sandi...",
        backToLogin: "Kembali ke Login",
        successTitle: "Kata sandi berhasil diperbarui",
        successMessage:
          "Kata sandi Anda sudah berhasil diperbarui. Silakan login kembali dengan kata sandi baru.",
        loadingSession: "Memeriksa tautan reset kata sandi...",
        invalidLink:
          "Tautan reset kata sandi tidak valid atau sudah kedaluwarsa. Silakan minta tautan baru.",
        emptyPassword: "Masukkan kata sandi baru.",
        shortPassword: "Kata sandi minimal 8 karakter.",
        mismatchPassword: "Konfirmasi kata sandi tidak sama.",
        unableUpdate: "Kata sandi belum bisa diperbarui. Silakan coba lagi.",
        requestNewLink: "Minta tautan baru",
      };
    }

    return {
      badge: "CREATE NEW PASSWORD",
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
      unableUpdate: "Unable to update password. Please try again.",
      requestNewLink: "Request new link",
    };
  }, [language]);

  const errorMessage =
    errorType === "invalidLink"
      ? ui.invalidLink
      : errorType === "emptyPassword"
        ? ui.emptyPassword
        : errorType === "shortPassword"
          ? ui.shortPassword
          : errorType === "mismatchPassword"
            ? ui.mismatchPassword
            : errorType === "unableUpdate"
              ? ui.unableUpdate
              : errorType === "custom"
                ? customError
                : "";

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
      setSuccess(false);
      setErrorType("");
      setCustomError("");

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
            authParams.code,
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
        if (!session?.user) throw new Error("TETAMO_INVALID_RESET_LINK");

        if (!mounted) return;

        setReady(true);
        setInitializing(false);
      } catch (error: any) {
        if (!mounted) return;

        setReady(false);
        setInitializing(false);

        if (error?.message === "TETAMO_INVALID_RESET_LINK") {
          setErrorType("invalidLink");
          return;
        }

        setErrorType("custom");
        setCustomError(error?.message || "");
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
  }, [paramCode, paramAccessToken, paramRefreshToken, paramError]);

  async function handleUpdatePassword() {
    setErrorType("");
    setCustomError("");

    const newPassword = password.trim();
    const confirmNewPassword = confirmPassword.trim();

    if (!newPassword) {
      setErrorType("emptyPassword");
      return;
    }

    if (newPassword.length < 8) {
      setErrorType("shortPassword");
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setErrorType("mismatchPassword");
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        setErrorType("custom");
        setCustomError(error.message || ui.unableUpdate);
        return;
      }

      await supabase.auth.signOut();

      setSuccess(true);
      setReady(false);
      setPassword("");
      setConfirmPassword("");
      setErrorType("");
      setCustomError("");
    } catch (error: any) {
      setErrorType("custom");
      setCustomError(error?.message || ui.unableUpdate);
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
              onPress={() => router.replace("/login" as any)}
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

            <View style={styles.lockIcon}>
              {success ? (
                <CheckCircle2 color="#27835C" size={27} />
              ) : (
                <LockKeyhole color="#A47B21" size={27} />
              )}
            </View>

            <Text style={styles.formTitle}>
              {success ? ui.successTitle : ui.title}
            </Text>

            <Text style={styles.formSub}>
              {success ? ui.successMessage : ui.subtitle}
            </Text>

            {!success ? (
              <View style={styles.helperBox}>
                <View style={styles.helperIcon}>
                  <ShieldCheck color="#A47B21" size={20} />
                </View>

                <View style={styles.helperTextBox}>
                  <Text style={styles.helperTitle}>{ui.helperTitle}</Text>
                  <Text style={styles.helperText}>{ui.helperText}</Text>
                </View>
              </View>
            ) : null}

            {initializing ? (
              <View style={styles.loadingBox}>
                <ActivityIndicator color="#A47B21" />
                <Text style={styles.loadingText}>{ui.loadingSession}</Text>
              </View>
            ) : null}

            {errorMessage ? (
              <View style={styles.errorBox}>
                <AlertCircle color="#B84A4A" size={18} />

                <View style={styles.errorTextBox}>
                  <Text style={styles.errorText}>{errorMessage}</Text>

                  {!ready ? (
                    <Pressable
                      onPress={() =>
                        router.replace("/forgot-password" as any)
                      }
                    >
                      <Text style={styles.errorLink}>{ui.requestNewLink}</Text>
                    </Pressable>
                  ) : null}
                </View>
              </View>
            ) : null}

            {success ? (
              <View style={styles.successBox}>
                <CheckCircle2 color="#27835C" size={19} />

                <View style={styles.successTextBox}>
                  <Text style={styles.successTitle}>{ui.successTitle}</Text>
                  <Text style={styles.successText}>{ui.successMessage}</Text>
                </View>
              </View>
            ) : null}

            {!initializing && ready && !success ? (
              <>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>{ui.newPassword}</Text>

                  <View style={styles.passwordWrap}>
                    <TextInput
                      value={password}
                      onChangeText={(value) => {
                        setPassword(value);
                        setErrorType("");
                        setCustomError("");
                      }}
                      placeholder={ui.newPasswordPlaceholder}
                      placeholderTextColor="#9A948B"
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                      autoCorrect={false}
                      style={styles.passwordInput}
                    />

                    <Pressable
                      style={styles.eyeButton}
                      onPress={() => setShowPassword((prev) => !prev)}
                    >
                      {showPassword ? (
                        <EyeOff color="#777169" size={18} />
                      ) : (
                        <Eye color="#777169" size={18} />
                      )}
                    </Pressable>
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>{ui.confirmPassword}</Text>

                  <View style={styles.passwordWrap}>
                    <TextInput
                      value={confirmPassword}
                      onChangeText={(value) => {
                        setConfirmPassword(value);
                        setErrorType("");
                        setCustomError("");
                      }}
                      placeholder={ui.confirmPasswordPlaceholder}
                      placeholderTextColor="#9A948B"
                      secureTextEntry={!showConfirmPassword}
                      autoCapitalize="none"
                      autoCorrect={false}
                      style={styles.passwordInput}
                    />

                    <Pressable
                      style={styles.eyeButton}
                      onPress={() =>
                        setShowConfirmPassword((prev) => !prev)
                      }
                    >
                      {showConfirmPassword ? (
                        <EyeOff color="#777169" size={18} />
                      ) : (
                        <Eye color="#777169" size={18} />
                      )}
                    </Pressable>
                  </View>
                </View>

                <Pressable
                  style={[
                    styles.primaryButton,
                    loading && styles.primaryDisabled,
                  ]}
                  disabled={loading}
                  onPress={handleUpdatePassword}
                >
                  {loading ? (
                    <>
                      <ActivityIndicator color="#171717" />
                      <Text style={styles.primaryButtonText}>{ui.updating}</Text>
                    </>
                  ) : (
                    <Text style={styles.primaryButtonText}>{ui.updateButton}</Text>
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
  },
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

  lockIcon: {
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

  loadingBox: {
    borderRadius: 17,
    borderWidth: 1,
    borderColor: "#E4DDD3",
    backgroundColor: "#FAF9F6",
    padding: 13,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    marginTop: 18,
  },

  loadingText: {
    color: "#5F5A53",
    fontSize: 11.5,
    fontWeight: "700",
  },

  errorBox: {
    borderRadius: 17,
    borderWidth: 1,
    borderColor: "#EAC5C5",
    backgroundColor: "#FFF2F2",
    padding: 12,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 9,
    marginTop: 18,
  },

  errorTextBox: {
    flex: 1,
  },

  errorText: {
    color: "#A23C3C",
    fontSize: 11.5,
    lineHeight: 16,
    fontWeight: "700",
  },

  errorLink: {
    color: "#9A4A3B",
    fontSize: 11,
    fontWeight: "900",
    marginTop: 6,
    textDecorationLine: "underline",
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
    marginTop: 18,
  },

  successTextBox: {
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

  inputGroup: {
    marginTop: 20,
  },

  inputLabel: {
    color: "#38332E",
    fontSize: 11.5,
    fontWeight: "900",
    marginBottom: 7,
  },

  passwordWrap: {
    minHeight: 52,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#DDD6CC",
    backgroundColor: "#FAF9F6",
    flexDirection: "row",
    alignItems: "center",
  },

  passwordInput: {
    flex: 1,
    color: "#171717",
    paddingHorizontal: 14,
    fontSize: 13,
    fontWeight: "600",
  },

  eyeButton: {
    width: 48,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
  },

  primaryButton: {
    minHeight: 52,
    borderRadius: 17,
    backgroundColor: "#F0C957",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 14,
    flexDirection: "row",
    gap: 7,
    marginTop: 20,
  },

  primaryDisabled: {
    opacity: 0.55,
  },

  primaryButtonText: {
    color: "#171717",
    fontSize: 12.5,
    fontWeight: "900",
  },
});
