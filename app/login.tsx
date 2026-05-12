import { FontAwesome5 } from "@expo/vector-icons";
import { makeRedirectUri } from "expo-auth-session";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as WebBrowser from "expo-web-browser";
import {
    AlertCircle,
    ChevronRight,
    Eye,
    EyeOff,
    LockKeyhole,
    ShieldCheck,
    UserPlus
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

type UserRole =
  | "owner"
  | "agent"
  | "developer"
  | "admin"
  | "buyer"
  | "unknown";

type OAuthProvider = "google" | "apple";

const ROUTES = {
  signup: "/signup",
  forgotPassword: "/forgot-password",
  ownerDefault: "/owner/packages",
  agentDefault: "/agent/packages",
  developerDefault: "/developer/packages",
  adminDefault: "/admin",
  buyerDefault: "/search",
  fallback: "/search",
};

export default function LoginScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const redirectingRef = useRef(false);

  const roleFromUrl = useMemo(() => {
    return normalizeRole(readParam(params.role));
  }, [params.role]);

  const safeNext = useMemo(() => {
    return normalizeNextPath(readParam(params.next));
  }, [params.next]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [socialLoading, setSocialLoading] = useState<OAuthProvider | null>(
    null
  );

  const signupRoute = useMemo(() => {
    const query = new URLSearchParams();

    if (roleFromUrl !== "unknown") query.set("role", roleFromUrl);
    if (safeNext) query.set("next", safeNext);

    const qs = query.toString();
    return qs ? `${ROUTES.signup}?${qs}` : ROUTES.signup;
  }, [roleFromUrl, safeNext]);

  const forgotPasswordRoute = useMemo(() => {
    const trimmedEmail = email.trim().toLowerCase();
    const query = new URLSearchParams();

    if (trimmedEmail) query.set("email", trimmedEmail);

    const qs = query.toString();
    return qs ? `${ROUTES.forgotPassword}?${qs}` : ROUTES.forgotPassword;
  }, [email]);

  useEffect(() => {
    let mounted = true;

    async function checkExistingSession() {
      try {
        const { data } = await supabase.auth.getSession();
        const userId = data.session?.user?.id || "";

        if (!mounted) return;

        if (userId) {
          setLoading(true);
          await finishLogin(userId);
          return;
        }
      } catch (error) {
        console.log("Tetamo login session check error:", error);
      } finally {
        if (mounted) setCheckingSession(false);
      }
    }

    checkExistingSession();

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        const userId = session?.user?.id || "";

        if (!mounted || !userId) return;

        setLoading(true);
        await finishLogin(userId);
      }
    );

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function finishLogin(userId: string) {
    if (redirectingRef.current) return;

    redirectingRef.current = true;

    try {
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", userId)
        .maybeSingle();

      if (error || !profile) {
        redirectingRef.current = false;
        setLoginError(
          "User profile not found. Please sign up first or contact Tetamo support."
        );
        setLoading(false);
        setCheckingSession(false);
        setSocialLoading(null);
        return;
      }

      const profileRole = normalizeRole(profile.role);
      const nextPath = getDestinationPath(profileRole, safeNext);

      router.replace(nextPath as any);
    } catch (error) {
      redirectingRef.current = false;
      setLoginError("Something went wrong while opening your account.");
      console.log("Tetamo finish login error:", error);
    } finally {
      setLoading(false);
      setCheckingSession(false);
      setSocialLoading(null);
    }
  }

  async function handleLogin() {
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPassword = password;

    setLoginError("");

    if (!trimmedEmail || !trimmedPassword) {
      setLoginError("Enter your email and password.");
      return;
    }

    if (!isValidEmail(trimmedEmail)) {
      setLoginError("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    setSocialLoading(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password: trimmedPassword,
      });

      if (error) {
        setLoginError(
          "Wrong email or password. If you forgot your password, use reset password below."
        );
        return;
      }

      if (!data.user) {
        setLoginError("User not found.");
        return;
      }

      await finishLogin(data.user.id);
    } catch (error: any) {
      setLoginError(error?.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleOAuthLogin(provider: OAuthProvider) {
    setLoginError("");
    setLoading(true);
    setSocialLoading(provider);

    try {
      const redirectTo = makeRedirectUri({
        scheme: "tetamomobile",
        path: "auth/callback",
      });

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo,
          skipBrowserRedirect: true,
          ...(provider === "google"
            ? {
                queryParams: {
                  prompt: "select_account",
                },
              }
            : {}),
        },
      });

      if (error) {
        setLoginError(error.message);
        return;
      }

      if (!data?.url) {
        setLoginError("No OAuth URL was returned.");
        return;
      }

      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);

      if (result.type !== "success") {
        return;
      }

      const session = await createSessionFromUrl(result.url);

      if (!session?.user?.id) {
        setLoginError("Unable to complete social login.");
        return;
      }

      await finishLogin(session.user.id);
    } catch (error: any) {
      setLoginError(error?.message || "Unable to complete social login.");
    } finally {
      setLoading(false);
      setSocialLoading(null);
    }
  }

  const isBusy = loading || checkingSession || socialLoading !== null;

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
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Text style={styles.kicker}>TETAMO LOGIN</Text>
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>
              Log in to continue to your Tetamo dashboard, packages, saved
              properties, or listing flow.
            </Text>
          </View>

          <View style={styles.infoPanel}>
            <View style={styles.infoIcon}>
              <ShieldCheck color="#e6c15c" size={23} />
            </View>

            <View style={styles.infoTextBox}>
              <Text style={styles.infoTitle}>Continue with your account</Text>
              <Text style={styles.infoText}>
                After login, Tetamo checks your account type and sends you to
                the correct page.
              </Text>
            </View>
          </View>

          <View style={styles.formPanel}>
            <View style={styles.formHeader}>
              <View style={styles.formIcon}>
                <LockKeyhole color="#e6c15c" size={22} />
              </View>

              <View style={styles.formHeaderText}>
                <Text style={styles.formTitle}>Log in to TETAMO</Text>
                <Text style={styles.formSub}>
                  Use your email, Google, or Apple account.
                </Text>
              </View>
            </View>

            {loginError ? (
              <View style={styles.errorBox}>
                <AlertCircle color="#fb7185" size={18} />
                <View style={styles.errorTextBox}>
                  <Text style={styles.errorText}>{loginError}</Text>

                  <Pressable
                    onPress={() => router.push(forgotPasswordRoute as any)}
                  >
                    <Text style={styles.errorLink}>Reset password</Text>
                  </Pressable>
                </View>
              </View>
            ) : null}

            <OAuthButton
              provider="google"
              label="Continue with Google"
              loadingLabel="Connecting to Google..."
              loading={socialLoading === "google"}
              disabled={isBusy}
              onPress={() => void handleOAuthLogin("google")}
            />

            <OAuthButton
              provider="apple"
              label="Continue with Apple"
              loadingLabel="Connecting to Apple..."
              loading={socialLoading === "apple"}
              disabled={isBusy}
              onPress={() => void handleOAuthLogin("apple")}
            />

            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.dividerLine} />
            </View>

            <View>
              <Text style={styles.inputLabel}>Email</Text>

              <TextInput
                value={email}
                onChangeText={(value) => {
                  setEmail(value);
                  setLoginError("");
                }}
                placeholder="Enter your email"
                placeholderTextColor="#777777"
                keyboardType="email-address"
                autoCapitalize="none"
                style={styles.input}
              />
            </View>

            <View>
              <Text style={styles.inputLabel}>Password</Text>

              <View style={styles.passwordWrap}>
                <TextInput
                  value={password}
                  onChangeText={(value) => {
                    setPassword(value);
                    setLoginError("");
                  }}
                  placeholder="Enter your password"
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

              <Pressable
                style={styles.forgotButton}
                onPress={() => router.push(forgotPasswordRoute as any)}
              >
                <Text style={styles.forgotText}>Forgot password?</Text>
              </Pressable>
            </View>

            <Pressable
              style={[styles.primaryButton, isBusy && styles.primaryDisabled]}
              disabled={isBusy}
              onPress={handleLogin}
            >
              {isBusy && !socialLoading ? (
                <ActivityIndicator color="#111111" />
              ) : (
                <>
                  <Text style={styles.primaryButtonText}>Log in</Text>
                  <ChevronRight color="#111111" size={17} />
                </>
              )}
            </Pressable>

            <View style={styles.signupPanel}>
              <View style={styles.signupIcon}>
                <UserPlus color="#ffffff" size={18} />
              </View>

              <View style={styles.signupTextBox}>
                <Text style={styles.signupTitle}>Do not have an account?</Text>
                <Text style={styles.signupSub}>
                  Sign up first to start using Tetamo.
                </Text>
              </View>
            </View>

            <Pressable
              style={styles.secondaryButton}
              onPress={() => router.push(signupRoute as any)}
            >
              <Text style={styles.secondaryButtonText}>Create an account</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function OAuthButton({
  provider,
  label,
  loadingLabel,
  loading,
  disabled,
  onPress,
}: {
  provider: OAuthProvider;
  label: string;
  loadingLabel: string;
  loading: boolean;
  disabled: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={[styles.oauthButton, disabled && styles.oauthDisabled]}
      disabled={disabled}
      onPress={onPress}
    >
      {loading ? (
        <ActivityIndicator color="#ffffff" />
      ) : (
        <FontAwesome5
          name={provider === "google" ? "google" : "apple"}
          color="#ffffff"
          size={16}
        />
      )}

      <Text style={styles.oauthText}>{loading ? loadingLabel : label}</Text>
    </Pressable>
  );
}

function readParam(value: unknown) {
  if (Array.isArray(value)) return String(value[0] || "");
  return String(value || "");
}

function normalizeRole(value: unknown): UserRole {
  const role = String(value || "").toLowerCase().trim();

  if (
    role === "owner" ||
    role === "pemilik" ||
    role === "landlord" ||
    role === "property_owner"
  ) {
    return "owner";
  }

  if (role === "agent" || role === "agen" || role === "broker") {
    return "agent";
  }

  if (role === "developer" || role === "pengembang") {
    return "developer";
  }

  if (
    role === "buyer" ||
    role === "renter" ||
    role === "tenant" ||
    role === "pembeli" ||
    role === "penyewa"
  ) {
    return "buyer";
  }

  if (role === "admin") {
    return "admin";
  }

  return "unknown";
}

function normalizeNextPath(value: string) {
  const raw = String(value || "").trim();

  if (!raw) return "";
  if (raw.startsWith("http://") || raw.startsWith("https://")) return "";
  if (raw.startsWith("//")) return "";
  if (raw.startsWith("/")) return raw;

  return `/${raw}`;
}

function getDestinationPath(role: UserRole, safeNext: string) {
  if (safeNext) return safeNext;

  if (role === "owner") return ROUTES.ownerDefault;
  if (role === "agent") return ROUTES.agentDefault;
  if (role === "developer") return ROUTES.developerDefault;
  if (role === "admin") return ROUTES.adminDefault;
  if (role === "buyer") return ROUTES.buyerDefault;

  return ROUTES.fallback;
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function extractAuthParamsFromUrl(url: string) {
  const queryString = url.includes("?") ? url.split("?")[1]?.split("#")[0] : "";
  const hashString = url.includes("#") ? url.split("#")[1] : "";

  const queryParams = new URLSearchParams(queryString || "");
  const hashParams = new URLSearchParams(hashString || "");

  return {
    code: queryParams.get("code") || hashParams.get("code") || "",
    accessToken:
      queryParams.get("access_token") || hashParams.get("access_token") || "",
    refreshToken:
      queryParams.get("refresh_token") || hashParams.get("refresh_token") || "",
    error:
      queryParams.get("error_description") ||
      hashParams.get("error_description") ||
      queryParams.get("error") ||
      hashParams.get("error") ||
      "",
  };
}

async function createSessionFromUrl(url: string) {
  const { code, accessToken, refreshToken, error } = extractAuthParamsFromUrl(url);

  if (error) {
    throw new Error(error);
  }

  if (code) {
    const { data, error: exchangeError } =
      await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError) {
      throw exchangeError;
    }

    return data.session;
  }

  if (!accessToken || !refreshToken) {
    throw new Error("Missing OAuth session tokens.");
  }

  const { data, error: sessionError } = await supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
  });

  if (sessionError) {
    throw sessionError;
  }

  return data.session;
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
  header: {
    marginBottom: 18,
  },
  kicker: {
    color: "#e6c15c",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1,
  },
  title: {
    color: "#ffffff",
    fontSize: 31,
    lineHeight: 37,
    fontWeight: "900",
    letterSpacing: -0.6,
    marginTop: 5,
  },
  subtitle: {
    color: "#b8b8b8",
    fontSize: 13,
    lineHeight: 19,
    fontWeight: "700",
    marginTop: 7,
  },
  infoPanel: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#705d2c",
    backgroundColor: "#211a0b",
    padding: 14,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 14,
  },
  infoIcon: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: "#151106",
    borderWidth: 1,
    borderColor: "#705d2c",
    alignItems: "center",
    justifyContent: "center",
  },
  infoTextBox: {
    flex: 1,
  },
  infoTitle: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "900",
  },
  infoText: {
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
    padding: 15,
    gap: 13,
  },
  formHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    marginBottom: 2,
  },
  formIcon: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: "#171717",
    borderWidth: 1,
    borderColor: "#303030",
    alignItems: "center",
    justifyContent: "center",
  },
  formHeaderText: {
    flex: 1,
  },
  formTitle: {
    color: "#ffffff",
    fontSize: 17,
    fontWeight: "900",
  },
  formSub: {
    color: "#a8a8a8",
    fontSize: 11,
    lineHeight: 15,
    fontWeight: "700",
    marginTop: 3,
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
    fontSize: 11.2,
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
  oauthButton: {
    minHeight: 49,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: "#343434",
    backgroundColor: "#050505",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    paddingHorizontal: 14,
  },
  oauthDisabled: {
    opacity: 0.55,
  },
  oauthText: {
    color: "#ffffff",
    fontSize: 12.5,
    fontWeight: "900",
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    marginVertical: 2,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#303030",
  },
  dividerText: {
    color: "#777777",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1,
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
  forgotButton: {
    alignSelf: "flex-end",
    paddingTop: 8,
  },
  forgotText: {
    color: "#e6c15c",
    fontSize: 11.5,
    fontWeight: "900",
  },
  primaryButton: {
    minHeight: 49,
    borderRadius: 17,
    backgroundColor: "#e6c15c",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
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
  signupPanel: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#303030",
    backgroundColor: "#050505",
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  signupIcon: {
    width: 38,
    height: 38,
    borderRadius: 14,
    backgroundColor: "#171717",
    alignItems: "center",
    justifyContent: "center",
  },
  signupTextBox: {
    flex: 1,
  },
  signupTitle: {
    color: "#ffffff",
    fontSize: 12.5,
    fontWeight: "900",
  },
  signupSub: {
    color: "#a7a7a7",
    fontSize: 10.5,
    lineHeight: 15,
    fontWeight: "700",
    marginTop: 2,
  },
  secondaryButton: {
    minHeight: 45,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: "#343434",
    backgroundColor: "#050505",
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryButtonText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "900",
  },
});