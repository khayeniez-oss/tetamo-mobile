import * as AppleAuthentication from "expo-apple-authentication";
import * as Crypto from "expo-crypto";
import * as Linking from "expo-linking";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as WebBrowser from "expo-web-browser";
import {
  AlertCircle,
  ArrowLeft,
  Eye,
  EyeOff,
  KeyRound,
  LockKeyhole,
  Mail,
} from "lucide-react-native";
import { useEffect, useMemo, useRef, useState } from "react";
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

WebBrowser.maybeCompleteAuthSession();

type Language = "en" | "id";
type AllowedRole = "owner" | "agent" | "developer" | "admin";
type SignupRole = "owner" | "agent" | "developer";

function normalizeRole(value: unknown): AllowedRole | null {
  const v = String(value || "").toLowerCase();

  if (v === "owner") return "owner";
  if (v === "agent") return "agent";
  if (v === "developer") return "developer";
  if (v === "admin") return "admin";

  return null;
}

function isSafeInternalPath(value: string) {
  return value.startsWith("/") && !value.startsWith("//");
}

function readParam(value: unknown) {
  if (Array.isArray(value)) return String(value[0] || "");
  return String(value || "");
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function normalizePhoneNumber(value: string) {
  const raw = String(value || "").trim();
  if (!raw) return "";

  const cleaned = raw.replace(/[^\d+]/g, "");
  if (!cleaned) return "";

  if (cleaned.startsWith("+")) return cleaned;
  if (cleaned.startsWith("00")) return `+${cleaned.slice(2)}`;
  if (cleaned.startsWith("0")) return `+62${cleaned.slice(1)}`;
  if (cleaned.startsWith("62")) return `+${cleaned}`;
  if (cleaned.startsWith("8")) return `+62${cleaned}`;

  return `+${cleaned}`;
}

function isValidInternationalPhone(value: string) {
  if (!value) return false;
  return /^\+[1-9]\d{7,14}$/.test(value);
}

function createNonce(length = 32) {
  const charset =
    "0123456789ABCDEFGHIJKLMNOPQRSTUVXYZabcdefghijklmnopqrstuvwxyz-._";
  let result = "";

  for (let i = 0; i < length; i += 1) {
    result += charset[Math.floor(Math.random() * charset.length)];
  }

  return result;
}

export default function LoginScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const redirectingRef = useRef(false);

  const [language, setLanguage] = useState<Language>("en");
  const [email, setEmail] = useState(readParam(params.email).toLowerCase());
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [appleLoading, setAppleLoading] = useState(false);
  const [appleAvailable, setAppleAvailable] = useState(Platform.OS === "ios");

  const isId = language === "id";

  const requestedRoleFromUrl = normalizeRole(readParam(params.role));

  const roleFromUrl: SignupRole | null =
    requestedRoleFromUrl === "owner" ||
    requestedRoleFromUrl === "agent" ||
    requestedRoleFromUrl === "developer"
      ? requestedRoleFromUrl
      : null;
  const rawNext = readParam(params.next);
  const safeNext = isSafeInternalPath(rawNext) ? rawNext : "";

  const ui = useMemo(() => {
    if (isId) {
      return {
        badge: "TETAMO LOGIN",
        title: "Masuk ke Tetamo",
        subtitle:
          "Lanjutkan ke akun Anda untuk mengelola listing, leads, dan aktivitas Tetamo.",
        welcome: "Selamat Datang",
        welcomeSub: "Masuk ke akun Anda",
        email: "Email atau Nomor WhatsApp",
        emailPlaceholder: "Email atau +62 812 3456 7890",
        password: "Kata Sandi",
        passwordPlaceholder: "Kata sandi",
        login: "Masuk",
        loggingIn: "Sedang masuk...",
        continueGoogle: "Masuk dengan Google",
        continueApple: "Masuk dengan Apple",
        connecting: "Menghubungkan...",
        or: "atau",
        forgot: "Lupa kata sandi?",
        noAccount: "Belum punya akun?",
        signup: "Daftar",
        emptyFields: "Masukkan email/nomor WhatsApp dan kata sandi.",
        invalidLogin:
          "Masukkan email atau nomor WhatsApp yang valid.",
        wrongLogin:
          "Email/nomor WhatsApp atau kata sandi salah. Jika lupa kata sandi, gunakan reset password di bawah.",
        userNotFound: "User tidak ditemukan.",
        profileNotFound: "Profil pengguna tidak ditemukan.",
        googleUrlError: "URL login Google gagal dibuat.",
        googleCodeError: "Login Google tidak mengembalikan kode autentikasi.",
        googleSessionError: "Sesi login Google gagal dibuat.",
        googleLoginFailed: "Login dengan Google gagal.",
        appleUnavailable: "Login Apple hanya tersedia di perangkat iOS.",
        appleTokenError: "Login Apple tidak mengembalikan token autentikasi.",
        appleSessionError: "Sesi login Apple gagal dibuat.",
        appleLoginFailed: "Login dengan Apple gagal.",
      };
    }

    return {
      badge: "TETAMO LOGIN",
      title: "Log in to Tetamo",
      subtitle:
        "Continue to your account to manage listings, leads, and Tetamo activity.",
      welcome: "Welcome Back",
      welcomeSub: "Log in to your account",
      email: "Email or WhatsApp Number",
      emailPlaceholder: "Email or +62 812 3456 7890",
      password: "Password",
      passwordPlaceholder: "Password",
      login: "Log In",
      loggingIn: "Logging in...",
      continueGoogle: "Log in with Google",
      continueApple: "Log in with Apple",
      connecting: "Connecting...",
      or: "or",
      forgot: "Forgot password?",
      noAccount: "Don’t have an account?",
      signup: "Sign Up",
      emptyFields: "Enter your email/WhatsApp number and password.",
      invalidLogin:
        "Please enter a valid email address or WhatsApp number.",
      wrongLogin:
        "Wrong email/WhatsApp number or password. If you forgot your password, use reset password below.",
      userNotFound: "User not found.",
      profileNotFound: "User profile not found.",
      googleUrlError: "Google login URL was not created.",
      googleCodeError: "Google login did not return an auth code.",
      googleSessionError: "Google login session was not created.",
      googleLoginFailed: "Google login failed.",
      appleUnavailable: "Apple login is only available on iOS devices.",
      appleTokenError: "Apple login did not return an identity token.",
      appleSessionError: "Apple login session was not created.",
      appleLoginFailed: "Apple login failed.",
    };
  }, [isId]);

  function getDefaultRedirect(role: AllowedRole | null) {
    if (Platform.OS === "ios") {
      if (role === "developer") return "/developer-license";
      if (role === "admin") return "/admin";

      return "/(tabs)/property";
    }

    if (role === "owner") return "/owner/packages";
    if (role === "agent") return "/agent/packages";
    if (role === "developer") return "/developer-license";
    if (role === "admin") return "/admin";

    return "/(tabs)/property";
  }

  function getFinalRedirect(role: AllowedRole | null) {
    if (Platform.OS === "ios") {
      return getDefaultRedirect(role);
    }

    return safeNext || getDefaultRedirect(role);
  }

  function getSignupPath() {
    const query = new URLSearchParams();

    if (roleFromUrl) query.set("role", roleFromUrl);

    if (Platform.OS !== "ios" && safeNext) {
      query.set("next", safeNext);
    }

    const queryString = query.toString();

    return queryString ? `/signup?${queryString}` : "/signup";
  }

  function getForgotPasswordPath() {
    const trimmedEmail = email.trim().toLowerCase();

    if (!isValidEmail(trimmedEmail)) return "/forgot-password";

    return `/forgot-password?email=${encodeURIComponent(trimmedEmail)}`;
  }

  async function resolveLoginEmail(value: string) {
    const loginValue = value.trim().toLowerCase();

    if (isValidEmail(loginValue)) {
      return loginValue;
    }

    const normalizedPhone = normalizePhoneNumber(loginValue);

    if (!isValidInternationalPhone(normalizedPhone)) {
      throw new Error(ui.invalidLogin);
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("email")
      .eq("phone", normalizedPhone)
      .limit(1)
      .maybeSingle();

    if (error) {
      throw new Error(ui.wrongLogin);
    }

    const profileEmail = String((data as any)?.email || "").trim().toLowerCase();

    if (!profileEmail || !isValidEmail(profileEmail)) {
      throw new Error(ui.wrongLogin);
    }

    return profileEmail;
  }

  async function finishLogin({
    userId,
    allowCreateProfile,
    requestedRole,
    fallbackEmail,
    fallbackFullName,
  }: {
    userId: string;
    allowCreateProfile: boolean;
    requestedRole?: SignupRole | null;
    fallbackEmail?: string;
    fallbackFullName?: string;
  }) {
    if (redirectingRef.current) return;

    redirectingRef.current = true;

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role, email, full_name, phone")
      .eq("id", userId)
      .maybeSingle();

    if (profileError) {
      redirectingRef.current = false;
      setLoading(false);
      setGoogleLoading(false);
      setAppleLoading(false);
      setLoginError(profileError.message || ui.profileNotFound);
      return;
    }

    let finalRole = normalizeRole((profile as any)?.role);

    if (!profile && allowCreateProfile) {
      finalRole = requestedRole || "owner";

      const { error: insertError } = await supabase.from("profiles").upsert(
        {
          id: userId,
          email: fallbackEmail || "",
          full_name: fallbackFullName || "",
          role: finalRole,
          phone: null,
        },
        {
          onConflict: "id",
        },
      );

      if (insertError) {
        redirectingRef.current = false;
        setLoading(false);
        setGoogleLoading(false);
        setAppleLoading(false);
        setLoginError(insertError.message || ui.profileNotFound);
        return;
      }
    }

    if (!finalRole) {
      redirectingRef.current = false;
      setLoading(false);
      setGoogleLoading(false);
      setAppleLoading(false);
      setLoginError(ui.profileNotFound);
      return;
    }

    setLoading(false);
    setGoogleLoading(false);
    setAppleLoading(false);

    router.replace(getFinalRedirect(finalRole) as any);
  }

  useEffect(() => {
    let mounted = true;

    async function checkExistingSession() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!mounted || !session?.user) return;

      setLoading(true);

      await finishLogin({
        userId: session.user.id,
        allowCreateProfile: false,
      });
    }

    async function checkAppleAvailability() {
      if (Platform.OS !== "ios") {
        setAppleAvailable(false);
        return;
      }

      const available = await AppleAuthentication.isAvailableAsync();

      if (mounted) setAppleAvailable(available);
    }

    void checkExistingSession();
    void checkAppleAvailability();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted || !session?.user) return;

      setLoading(true);

      await finishLogin({
        userId: session.user.id,
        allowCreateProfile: false,
      });
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleLogin() {
    const loginValue = email.trim();

    setLoginError("");

    if (!loginValue || !password) {
      setLoginError(ui.emptyFields);
      return;
    }

    try {
      setLoading(true);
      setGoogleLoading(false);
      setAppleLoading(false);

      const loginEmail = await resolveLoginEmail(loginValue);

      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password,
      });

      if (error) {
        setLoading(false);
        setLoginError(ui.wrongLogin);
        return;
      }

      if (!data.user) {
        setLoading(false);
        setLoginError(ui.userNotFound);
        return;
      }

      await finishLogin({
        userId: data.user.id,
        allowCreateProfile: false,
      });
    } catch (error: any) {
      setLoading(false);
      setLoginError(error?.message || ui.wrongLogin);
    }
  }

  async function handleGoogleLogin() {
    try {
      setLoginError("");
      setLoading(false);
      setAppleLoading(false);
      setGoogleLoading(true);

      const redirectTo = Linking.createURL("auth/callback");

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
          skipBrowserRedirect: true,
          queryParams: {
            prompt: "select_account",
          },
        },
      });

      if (error) {
        setGoogleLoading(false);
        setLoginError(error.message);
        return;
      }

      if (!data?.url) {
        setGoogleLoading(false);
        setLoginError(ui.googleUrlError);
        return;
      }

      const result = await WebBrowser.openAuthSessionAsync(
        data.url,
        redirectTo,
      );

      if (result.type !== "success" || !result.url) {
        setGoogleLoading(false);
        return;
      }

      const returnedUrl = new URL(result.url);
      const code = returnedUrl.searchParams.get("code");

      if (!code) {
        setGoogleLoading(false);
        setLoginError(ui.googleCodeError);
        return;
      }

      const { error: exchangeError } =
        await supabase.auth.exchangeCodeForSession(code);

      if (exchangeError) {
        setGoogleLoading(false);
        setLoginError(exchangeError.message);
        return;
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        setGoogleLoading(false);
        setLoginError(ui.googleSessionError);
        return;
      }

      await finishLogin({
        userId: session.user.id,
        allowCreateProfile: true,
        requestedRole: roleFromUrl || "owner",
        fallbackEmail: session.user.email || "",
        fallbackFullName:
          String(session.user.user_metadata?.full_name || "") ||
          String(session.user.user_metadata?.name || ""),
      });
    } catch (error: any) {
      setGoogleLoading(false);
      setLoginError(error?.message || ui.googleLoginFailed);
    }
  }

  async function handleAppleLogin() {
    try {
      setLoginError("");
      setLoading(false);
      setGoogleLoading(false);
      setAppleLoading(true);

      if (!appleAvailable) {
        setAppleLoading(false);
        setLoginError(ui.appleUnavailable);
        return;
      }

      const rawNonce = createNonce();
      const hashedNonce = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        rawNonce,
      );

      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
        nonce: hashedNonce,
      });

      if (!credential.identityToken) {
        setAppleLoading(false);
        setLoginError(ui.appleTokenError);
        return;
      }

      const { error: signInError } = await supabase.auth.signInWithIdToken({
        provider: "apple",
        token: credential.identityToken,
        nonce: rawNonce,
      });

      if (signInError) {
        setAppleLoading(false);
        setLoginError(signInError.message || ui.appleLoginFailed);
        return;
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        setAppleLoading(false);
        setLoginError(ui.appleSessionError);
        return;
      }

      const appleFullName = [
        credential.fullName?.givenName,
        credential.fullName?.middleName,
        credential.fullName?.familyName,
      ]
        .filter(Boolean)
        .join(" ");

      await finishLogin({
        userId: session.user.id,
        allowCreateProfile: true,
        requestedRole: roleFromUrl || "owner",
        fallbackEmail: session.user.email || credential.email || "",
        fallbackFullName:
          appleFullName ||
          String(session.user.user_metadata?.full_name || "") ||
          String(session.user.user_metadata?.name || ""),
      });
    } catch (error: any) {
      setAppleLoading(false);

      if (error?.code === "ERR_REQUEST_CANCELED") return;

      setLoginError(error?.message || ui.appleLoginFailed);
    }
  }

  const isBusy = loading || googleLoading || appleLoading;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />

      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.topBar}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeft color="#ffffff" size={15} />
            <Text style={styles.backText}>{isId ? "Kembali" : "Back"}</Text>
          </Pressable>

          <View style={styles.langToggle}>
            {(["en", "id"] as Language[]).map((item) => (
              <Pressable
                key={item}
                style={[
                  styles.langButton,
                  language === item && styles.langButtonActive,
                ]}
                onPress={() => {
                  setLoginError("");
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

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.heroCard}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{ui.badge}</Text>
            </View>

            <Text style={styles.title}>{ui.title}</Text>
            <Text style={styles.subtitle}>{ui.subtitle}</Text>
          </View>

          <View style={styles.card}>
            <View style={styles.headerIcon}>
              <KeyRound color="#111111" size={23} />
            </View>

            <Text style={styles.cardTitle}>{ui.welcome}</Text>
            <Text style={styles.cardSub}>{ui.welcomeSub}</Text>

            {loginError ? (
              <View style={styles.errorBox}>
                <AlertCircle color="#fecaca" size={17} />
                <View style={styles.errorTextBox}>
                  <Text style={styles.errorText}>{loginError}</Text>

                  <Pressable
                    onPress={() => router.push(getForgotPasswordPath() as any)}
                  >
                    <Text style={styles.errorLink}>{ui.forgot}</Text>
                  </Pressable>
                </View>
              </View>
            ) : null}

            <FormInput
              label={ui.email}
              value={email}
              onChangeText={(value) => {
                setEmail(value);
                setLoginError("");
              }}
              placeholder={ui.emailPlaceholder}
              keyboardType="email-address"
              autoCapitalize="none"
              icon={<Mail color="#e6c15c" size={17} />}
            />

            <FormInput
              label={ui.password}
              value={password}
              onChangeText={(value) => {
                setPassword(value);
                setLoginError("");
              }}
              placeholder={ui.passwordPlaceholder}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              icon={<LockKeyhole color="#e6c15c" size={17} />}
              rightSlot={
                <Pressable
                  style={styles.eyeButton}
                  onPress={() => setShowPassword((prev) => !prev)}
                >
                  {showPassword ? (
                    <EyeOff color="#a9a9a9" size={17} />
                  ) : (
                    <Eye color="#a9a9a9" size={17} />
                  )}
                </Pressable>
              }
            />

            <Pressable
              style={styles.forgotButton}
              onPress={() => router.push(getForgotPasswordPath() as any)}
            >
              <Text style={styles.forgotText}>{ui.forgot}</Text>
            </Pressable>

            <Pressable
              style={[styles.primaryButton, isBusy && styles.disabled]}
              disabled={isBusy}
              onPress={handleLogin}
            >
              {loading ? <ActivityIndicator color="#ffffff" /> : null}
              <Text style={styles.primaryButtonText}>
                {loading ? ui.loggingIn : ui.login}
              </Text>
            </Pressable>

            <View style={styles.dividerRow}>
              <View style={styles.divider} />
              <Text style={styles.dividerText}>{ui.or}</Text>
              <View style={styles.divider} />
            </View>

            <View style={styles.socialRow}>
              <Pressable
                style={[
                  styles.socialButton,
                  styles.googleButton,
                  isBusy && styles.disabled,
                ]}
                disabled={isBusy}
                onPress={handleGoogleLogin}
              >
                {googleLoading ? (
                  <ActivityIndicator color="#e6c15c" />
                ) : (
                  <Text style={styles.googleIcon}>G</Text>
                )}
                <Text style={styles.socialButtonText} numberOfLines={1}>
                  {googleLoading ? ui.connecting : ui.continueGoogle}
                </Text>
              </Pressable>

              <Pressable
                style={[
                  styles.socialButton,
                  styles.appleButton,
                  isBusy && styles.disabled,
                ]}
                disabled={isBusy}
                onPress={handleAppleLogin}
              >
                {appleLoading ? (
                  <ActivityIndicator color="#e6c15c" />
                ) : (
                  <Text style={styles.appleIcon}></Text>
                )}
                <Text style={styles.socialButtonText} numberOfLines={1}>
                  {appleLoading ? ui.connecting : ui.continueApple}
                </Text>
              </Pressable>
            </View>

            <View style={styles.authFooter}>
              <Text style={styles.authFooterText}>{ui.noAccount} </Text>

              <Pressable onPress={() => router.push(getSignupPath() as any)}>
                <Text style={styles.authFooterLink}>{ui.signup}</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function FormInput({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  autoCapitalize,
  secureTextEntry,
  icon,
  rightSlot,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  keyboardType?: "default" | "email-address" | "phone-pad";
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  secureTextEntry?: boolean;
  icon?: React.ReactNode;
  rightSlot?: React.ReactNode;
}) {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>{label}</Text>

      <View style={styles.inputWrap}>
        {icon ? <View style={styles.inputIcon}>{icon}</View> : null}

        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#777777"
          style={styles.input}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          secureTextEntry={secureTextEntry}
        />

        {rightSlot}
      </View>
    </View>
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
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1,
  },
  title: {
    color: "#ffffff",
    fontSize: 25,
    lineHeight: 30,
    fontWeight: "900",
    letterSpacing: -0.5,
    marginTop: 13,
  },
  subtitle: {
    color: "#b8b8b8",
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "700",
    marginTop: 7,
  },
  card: {
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "#303030",
    backgroundColor: "#101010",
    padding: 15,
  },
  headerIcon: {
    alignSelf: "center",
    width: 54,
    height: 54,
    borderRadius: 20,
    backgroundColor: "#e6c15c",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  cardTitle: {
    color: "#ffffff",
    fontSize: 20,
    lineHeight: 25,
    fontWeight: "900",
    textAlign: "center",
  },
  cardSub: {
    color: "#a9a9a9",
    fontSize: 11.7,
    lineHeight: 17,
    fontWeight: "700",
    textAlign: "center",
    marginTop: 4,
    marginBottom: 14,
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
    marginBottom: 13,
  },
  errorTextBox: {
    flex: 1,
  },
  errorText: {
    color: "#fecaca",
    fontSize: 11.3,
    lineHeight: 16,
    fontWeight: "700",
  },
  errorLink: {
    color: "#ffffff",
    fontSize: 11.4,
    fontWeight: "900",
    textDecorationLine: "underline",
    marginTop: 5,
  },
  inputGroup: {
    marginBottom: 12,
  },
  inputLabel: {
    color: "#ffffff",
    fontSize: 11.7,
    fontWeight: "900",
    marginBottom: 7,
  },
  inputWrap: {
    minHeight: 49,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#303030",
    backgroundColor: "#050505",
    flexDirection: "row",
    alignItems: "center",
  },
  inputIcon: {
    width: 43,
    alignItems: "center",
    justifyContent: "center",
  },
  input: {
    flex: 1,
    color: "#ffffff",
    fontSize: 12.5,
    fontWeight: "700",
    paddingVertical: 0,
    paddingRight: 12,
  },
  eyeButton: {
    width: 42,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  forgotButton: {
    alignSelf: "flex-end",
    marginTop: -4,
    marginBottom: 13,
  },
  forgotText: {
    color: "#e6c15c",
    fontSize: 11.5,
    fontWeight: "900",
    textDecorationLine: "underline",
  },
  primaryButton: {
    minHeight: 49,
    borderRadius: 17,
    backgroundColor: "#111827",
    borderWidth: 1,
    borderColor: "#303030",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  primaryButtonText: {
    color: "#ffffff",
    fontSize: 12.5,
    fontWeight: "900",
  },
  disabled: {
    opacity: 0.55,
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginVertical: 15,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: "#252525",
  },
  dividerText: {
    color: "#777777",
    fontSize: 10,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  socialRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  socialButton: {
    flex: 1,
    minHeight: 49,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: "#5b4a24",
    backgroundColor: "#211a0b",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingHorizontal: 7,
  },
  googleButton: {
    borderColor: "#5b4a24",
    backgroundColor: "#211a0b",
  },
  appleButton: {
    borderColor: "#5b4a24",
    backgroundColor: "#211a0b",
  },
  googleIcon: {
    color: "#e6c15c",
    fontSize: 15,
    fontWeight: "900",
  },
  appleIcon: {
    color: "#e6c15c",
    fontSize: 17,
    fontWeight: "900",
    marginTop: -1,
  },
  socialButtonText: {
    color: "#ffffff",
    fontSize: 10.7,
    fontWeight: "900",
    flexShrink: 1,
  },
  authFooter: {
    flexDirection: "row",
    justifyContent: "center",
    flexWrap: "wrap",
    marginTop: 15,
  },
  authFooterText: {
    color: "#a9a9a9",
    fontSize: 12,
    fontWeight: "700",
  },
  authFooterLink: {
    color: "#e6c15c",
    fontSize: 12,
    fontWeight: "900",
    textDecorationLine: "underline",
  },
});