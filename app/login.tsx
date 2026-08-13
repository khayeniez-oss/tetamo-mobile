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
  Languages,
  LockKeyhole,
  Mail,
  ShieldCheck,
} from "lucide-react-native";

import { useEffect, useMemo, useRef, useState } from "react";

import {
  ActivityIndicator,
  Image,
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

type AllowedRole =
  | "owner"
  | "agent"
  | "developer"
  | "admin";

type SignupRole =
  | "owner"
  | "agent"
  | "developer";

const BLACK = "#111111";
const WHITE = "#FFFFFF";
const CREAM = "#FBFAF7";

const GOLD_DARK = "#B8892E";
const GOLD_ACTIVE = "#F0D889";
const GOLD_SOFT = "#F4E8C5";

const BORDER = "#E8E1D7";
const MUTED = "#777169";
const SOFT = "#F5F1EA";

const tetamoLogo = require("../assets/images/tetamo-logo.png");

/*
 * =====================================================
 * HELPERS
 * =====================================================
 */

function normalizeRole(
  value: unknown
): AllowedRole | null {
  const role = String(value || "").toLowerCase();

  if (role === "owner") return "owner";
  if (role === "agent") return "agent";
  if (role === "developer") return "developer";
  if (role === "admin") return "admin";

  return null;
}

function isSafeInternalPath(value: string) {
  return (
    value.startsWith("/") &&
    !value.startsWith("//")
  );
}

function readParam(value: unknown) {
  if (Array.isArray(value)) {
    return String(value[0] || "");
  }

  return String(value || "");
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    value
  );
}

function normalizePhoneNumber(value: string) {
  const raw = String(value || "").trim();

  if (!raw) return "";

  const cleaned = raw.replace(/[^\d+]/g, "");

  if (!cleaned) return "";

  if (cleaned.startsWith("+")) {
    return cleaned;
  }

  if (cleaned.startsWith("00")) {
    return `+${cleaned.slice(2)}`;
  }

  if (cleaned.startsWith("0")) {
    return `+62${cleaned.slice(1)}`;
  }

  if (cleaned.startsWith("62")) {
    return `+${cleaned}`;
  }

  if (cleaned.startsWith("8")) {
    return `+62${cleaned}`;
  }

  return `+${cleaned}`;
}

function isValidInternationalPhone(
  value: string
) {
  if (!value) return false;

  return /^\+[1-9]\d{7,14}$/.test(value);
}

function createNonce(length = 32) {
  const charset =
    "0123456789ABCDEFGHIJKLMNOPQRSTUVXYZabcdefghijklmnopqrstuvwxyz-._";

  let result = "";

  for (let i = 0; i < length; i += 1) {
    result +=
      charset[
        Math.floor(
          Math.random() * charset.length
        )
      ];
  }

  return result;
}

/*
 * =====================================================
 * LOGIN SCREEN
 * =====================================================
 */

export default function LoginScreen() {
  const router = useRouter();

  const params = useLocalSearchParams();

  const redirectingRef = useRef(false);

  const [language, setLanguage] =
    useState<Language>("en");

  const [email, setEmail] = useState(
    readParam(params.email).toLowerCase()
  );

  const [password, setPassword] =
    useState("");

  const [showPassword, setShowPassword] =
    useState(false);

  const [loginError, setLoginError] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [googleLoading, setGoogleLoading] =
    useState(false);

  const [appleLoading, setAppleLoading] =
    useState(false);

  const [appleAvailable, setAppleAvailable] =
    useState(
      Platform.OS === "ios"
    );

  const isId = language === "id";

  const requestedRoleFromUrl = normalizeRole(
    readParam(params.role)
  );

  /*
   * ADMIN IS NEVER A PUBLIC SIGNUP ROLE.
   *
   * Admin access must already exist in the authenticated
   * user's profiles.role value. A URL such as
   * /login?role=admin must never create or promote an admin.
   */
  const roleFromUrl: SignupRole | null =
    requestedRoleFromUrl === "owner" ||
    requestedRoleFromUrl === "agent" ||
    requestedRoleFromUrl === "developer"
      ? requestedRoleFromUrl
      : null;

  const rawNext = readParam(params.next);

  const safeNext = isSafeInternalPath(rawNext)
    ? rawNext
    : "";

  /*
   * ===================================================
   * COPY
   * ===================================================
   */

  const ui = useMemo(() => {
    if (isId) {
      return {
        back: "Kembali",

        eyebrow: "TETAMO",

        title: "Selamat datang kembali",

        subtitle:
          "Masuk untuk melanjutkan ke akun Tetamo Anda.",

        email:
          "Email atau Nomor WhatsApp",

        emailPlaceholder:
          "Email atau +62 812 3456 7890",

        password: "Kata Sandi",

        passwordPlaceholder:
          "Masukkan kata sandi",

        login: "Masuk",

        loggingIn:
          "Sedang masuk...",

        continueGoogle:
          "Lanjutkan dengan Google",

        continueApple:
          "Lanjutkan dengan Apple",

        connecting:
          "Menghubungkan...",

        or: "atau",

        forgot:
          "Lupa kata sandi?",

        noAccount:
          "Belum punya akun?",

        signup: "Daftar",

        private:
          "Login aman dengan Tetamo",

        emptyFields:
          "Masukkan email/nomor WhatsApp dan kata sandi.",

        invalidLogin:
          "Masukkan email atau nomor WhatsApp yang valid.",

        wrongLogin:
          "Email/nomor WhatsApp atau kata sandi salah.",

        userNotFound:
          "User tidak ditemukan.",

        profileNotFound:
          "Profil pengguna tidak ditemukan.",

        googleUrlError:
          "URL login Google gagal dibuat.",

        googleCodeError:
          "Login Google tidak mengembalikan kode autentikasi.",

        googleSessionError:
          "Sesi login Google gagal dibuat.",

        googleLoginFailed:
          "Login dengan Google gagal.",

        appleUnavailable:
          "Login Apple hanya tersedia di perangkat iOS.",

        appleTokenError:
          "Login Apple tidak mengembalikan token autentikasi.",

        appleSessionError:
          "Sesi login Apple gagal dibuat.",

        appleLoginFailed:
          "Login dengan Apple gagal.",
      };
    }

    return {
      back: "Back",

      eyebrow: "TETAMO",

      title: "Welcome back",

      subtitle:
        "Log in to continue to your Tetamo account.",

      email:
        "Email or WhatsApp Number",

      emailPlaceholder:
        "Email or +62 812 3456 7890",

      password: "Password",

      passwordPlaceholder:
        "Enter your password",

      login: "Log In",

      loggingIn:
        "Logging in...",

      continueGoogle:
        "Continue with Google",

      continueApple:
        "Continue with Apple",

      connecting:
        "Connecting...",

      or: "or",

      forgot:
        "Forgot password?",

      noAccount:
        "Don't have an account?",

      signup: "Sign Up",

      private:
        "Secure login with Tetamo",

      emptyFields:
        "Enter your email/WhatsApp number and password.",

      invalidLogin:
        "Please enter a valid email address or WhatsApp number.",

      wrongLogin:
        "Wrong email/WhatsApp number or password.",

      userNotFound:
        "User not found.",

      profileNotFound:
        "User profile not found.",

      googleUrlError:
        "Google login URL was not created.",

      googleCodeError:
        "Google login did not return an authentication code.",

      googleSessionError:
        "Google login session was not created.",

      googleLoginFailed:
        "Google login failed.",

      appleUnavailable:
        "Apple login is only available on iOS devices.",

      appleTokenError:
        "Apple login did not return an identity token.",

      appleSessionError:
        "Apple login session was not created.",

      appleLoginFailed:
        "Apple login failed.",
    };
  }, [isId]);

  /*
   * ===================================================
   * REDIRECTS
   * ===================================================
   */

  function getDefaultRedirect(
    role: AllowedRole | null
  ) {
    if (Platform.OS === "ios") {
      if (role === "developer") {
        return "/developer-license";
      }

      if (role === "admin") {
        return "/admin";
      }

      return "/(tabs)/property";
    }

    if (role === "owner") {
      return "/owner/packages";
    }

    if (role === "agent") {
      return "/agent/packages";
    }

    if (role === "developer") {
      return "/developer-license";
    }

    if (role === "admin") {
      return "/admin";
    }

    return "/(tabs)/property";
  }

  function getFinalRedirect(
    role: AllowedRole | null
  ) {
    if (Platform.OS === "ios") {
      return getDefaultRedirect(role);
    }

    return (
      safeNext ||
      getDefaultRedirect(role)
    );
  }

  function getSignupPath() {
    const query = new URLSearchParams();

    if (roleFromUrl) {
      query.set(
        "role",
        roleFromUrl
      );
    }

    if (
      Platform.OS !== "ios" &&
      safeNext
    ) {
      query.set(
        "next",
        safeNext
      );
    }

    const queryString =
      query.toString();

    return queryString
      ? `/signup?${queryString}`
      : "/signup";
  }

  function getForgotPasswordPath() {
    const trimmedEmail =
      email.trim().toLowerCase();

    if (
      !isValidEmail(
        trimmedEmail
      )
    ) {
      return "/forgot-password";
    }

    return `/forgot-password?email=${encodeURIComponent(
      trimmedEmail
    )}`;
  }

  /*
   * ===================================================
   * EMAIL / WHATSAPP RESOLUTION
   * ===================================================
   */

  async function resolveLoginEmail(
    value: string
  ) {
    const loginValue = value
      .trim()
      .toLowerCase();

    if (
      isValidEmail(loginValue)
    ) {
      return loginValue;
    }

    const normalizedPhone =
      normalizePhoneNumber(
        loginValue
      );

    if (
      !isValidInternationalPhone(
        normalizedPhone
      )
    ) {
      throw new Error(
        ui.invalidLogin
      );
    }

    const { data, error } =
      await supabase
        .from("profiles")
        .select("email")
        .eq(
          "phone",
          normalizedPhone
        )
        .limit(1)
        .maybeSingle();

    if (error) {
      throw new Error(
        ui.wrongLogin
      );
    }

    const profileEmail = String(
      (data as any)?.email || ""
    )
      .trim()
      .toLowerCase();

    if (
      !profileEmail ||
      !isValidEmail(
        profileEmail
      )
    ) {
      throw new Error(
        ui.wrongLogin
      );
    }

    return profileEmail;
  }

  /*
   * ===================================================
   * FINISH LOGIN
   * ===================================================
   */

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
    if (
      redirectingRef.current
    ) {
      return;
    }

    redirectingRef.current = true;

    const {
      data: profile,
      error: profileError,
    } = await supabase
      .from("profiles")
      .select(
        "role, email, full_name, phone"
      )
      .eq(
        "id",
        userId
      )
      .maybeSingle();

    if (profileError) {
      redirectingRef.current = false;

      setLoading(false);
      setGoogleLoading(false);
      setAppleLoading(false);

      setLoginError(
        profileError.message ||
          ui.profileNotFound
      );

      return;
    }

    let finalRole =
      normalizeRole(
        (profile as any)?.role
      );

    /*
     * OAuth users can create their
     * Tetamo profile on first login.
     */

    if (
      !profile &&
      allowCreateProfile
    ) {
      finalRole =
        requestedRole ||
        "owner";

      const {
        error: insertError,
      } = await supabase
        .from("profiles")
        .upsert(
          {
            id: userId,

            email:
              fallbackEmail ||
              "",

            full_name:
              fallbackFullName ||
              "",

            role: finalRole,

            phone: null,
          },
          {
            onConflict: "id",
          }
        );

      if (insertError) {
        redirectingRef.current =
          false;

        setLoading(false);
        setGoogleLoading(false);
        setAppleLoading(false);

        setLoginError(
          insertError.message ||
            ui.profileNotFound
        );

        return;
      }
    }

    if (!finalRole) {
      redirectingRef.current =
        false;

      setLoading(false);
      setGoogleLoading(false);
      setAppleLoading(false);

      setLoginError(
        ui.profileNotFound
      );

      return;
    }

    setLoading(false);
    setGoogleLoading(false);
    setAppleLoading(false);

    router.replace(
      getFinalRedirect(
        finalRole
      ) as any
    );
  }

  /*
   * ===================================================
   * EXISTING SESSION + APPLE AVAILABILITY
   * ===================================================
   */

  useEffect(() => {
    let mounted = true;

    async function checkExistingSession() {
      const {
        data: { session },
      } =
        await supabase.auth.getSession();

      if (
        !mounted ||
        !session?.user
      ) {
        return;
      }

      setLoading(true);

      await finishLogin({
        userId:
          session.user.id,

        allowCreateProfile:
          false,
      });
    }

    async function checkAppleAvailability() {
      if (
        Platform.OS !== "ios"
      ) {
        setAppleAvailable(
          false
        );

        return;
      }

      const available =
        await AppleAuthentication.isAvailableAsync();

      if (mounted) {
        setAppleAvailable(
          available
        );
      }
    }

    void checkExistingSession();

    void checkAppleAvailability();

    const {
      data: { subscription },
    } =
      supabase.auth.onAuthStateChange(
        async (
          _event,
          session
        ) => {
          if (
            !mounted ||
            !session?.user
          ) {
            return;
          }

          setLoading(true);

          await finishLogin({
            userId:
              session.user.id,

            allowCreateProfile:
              false,
          });
        }
      );

    return () => {
      mounted = false;

      subscription.unsubscribe();
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /*
   * ===================================================
   * PASSWORD LOGIN
   * ===================================================
   */

  async function handleLogin() {
    const loginValue =
      email.trim();

    setLoginError("");

    if (
      !loginValue ||
      !password
    ) {
      setLoginError(
        ui.emptyFields
      );

      return;
    }

    try {
      setLoading(true);

      setGoogleLoading(false);
      setAppleLoading(false);

      const loginEmail =
        await resolveLoginEmail(
          loginValue
        );

      const {
        data,
        error,
      } =
        await supabase.auth.signInWithPassword(
          {
            email:
              loginEmail,

            password,
          }
        );

      if (error) {
        setLoading(false);

        setLoginError(
          ui.wrongLogin
        );

        return;
      }

      if (!data.user) {
        setLoading(false);

        setLoginError(
          ui.userNotFound
        );

        return;
      }

      await finishLogin({
        userId:
          data.user.id,

        allowCreateProfile:
          false,
      });
    } catch (error: any) {
      setLoading(false);

      setLoginError(
        error?.message ||
          ui.wrongLogin
      );
    }
  }

  /*
   * ===================================================
   * GOOGLE LOGIN
   * ===================================================
   */

  async function handleGoogleLogin() {
    try {
      setLoginError("");

      setLoading(false);
      setAppleLoading(false);
      setGoogleLoading(true);

      const redirectTo =
        Linking.createURL(
          "auth/callback"
        );

      const {
        data,
        error,
      } =
        await supabase.auth.signInWithOAuth(
          {
            provider:
              "google",

            options: {
              redirectTo,

              skipBrowserRedirect:
                true,

              queryParams: {
                prompt:
                  "select_account",
              },
            },
          }
        );

      if (error) {
        setGoogleLoading(false);

        setLoginError(
          error.message
        );

        return;
      }

      if (!data?.url) {
        setGoogleLoading(false);

        setLoginError(
          ui.googleUrlError
        );

        return;
      }

      const result =
        await WebBrowser.openAuthSessionAsync(
          data.url,
          redirectTo
        );

      if (
        result.type !==
          "success" ||
        !result.url
      ) {
        setGoogleLoading(false);

        return;
      }

      const returnedUrl =
        new URL(result.url);

      const code =
        returnedUrl.searchParams.get(
          "code"
        );

      if (!code) {
        setGoogleLoading(false);

        setLoginError(
          ui.googleCodeError
        );

        return;
      }

      const {
        error:
          exchangeError,
      } =
        await supabase.auth.exchangeCodeForSession(
          code
        );

      if (exchangeError) {
        setGoogleLoading(false);

        setLoginError(
          exchangeError.message
        );

        return;
      }

      const {
        data: {
          session,
        },
      } =
        await supabase.auth.getSession();

      if (!session?.user) {
        setGoogleLoading(false);

        setLoginError(
          ui.googleSessionError
        );

        return;
      }

      await finishLogin({
        userId:
          session.user.id,

        allowCreateProfile:
          true,

        requestedRole:
          roleFromUrl ||
          "owner",

        fallbackEmail:
          session.user.email ||
          "",

        fallbackFullName:
          String(
            session.user
              .user_metadata
              ?.full_name ||
              ""
          ) ||
          String(
            session.user
              .user_metadata
              ?.name ||
              ""
          ),
      });
    } catch (error: any) {
      setGoogleLoading(false);

      setLoginError(
        error?.message ||
          ui.googleLoginFailed
      );
    }
  }

  /*
   * ===================================================
   * APPLE LOGIN
   * ===================================================
   */

  async function handleAppleLogin() {
    try {
      setLoginError("");

      setLoading(false);
      setGoogleLoading(false);
      setAppleLoading(true);

      if (!appleAvailable) {
        setAppleLoading(false);

        setLoginError(
          ui.appleUnavailable
        );

        return;
      }

      const rawNonce =
        createNonce();

      const hashedNonce =
        await Crypto.digestStringAsync(
          Crypto
            .CryptoDigestAlgorithm
            .SHA256,

          rawNonce
        );

      const credential =
        await AppleAuthentication.signInAsync(
          {
            requestedScopes: [
              AppleAuthentication
                .AppleAuthenticationScope
                .FULL_NAME,

              AppleAuthentication
                .AppleAuthenticationScope
                .EMAIL,
            ],

            nonce:
              hashedNonce,
          }
        );

      if (
        !credential.identityToken
      ) {
        setAppleLoading(false);

        setLoginError(
          ui.appleTokenError
        );

        return;
      }

      const {
        error: signInError,
      } =
        await supabase.auth.signInWithIdToken(
          {
            provider:
              "apple",

            token:
              credential.identityToken,

            nonce:
              rawNonce,
          }
        );

      if (signInError) {
        setAppleLoading(false);

        setLoginError(
          signInError.message ||
            ui.appleLoginFailed
        );

        return;
      }

      const {
        data: {
          session,
        },
      } =
        await supabase.auth.getSession();

      if (!session?.user) {
        setAppleLoading(false);

        setLoginError(
          ui.appleSessionError
        );

        return;
      }

      const appleFullName = [
        credential.fullName
          ?.givenName,

        credential.fullName
          ?.middleName,

        credential.fullName
          ?.familyName,
      ]
        .filter(Boolean)
        .join(" ");

      await finishLogin({
        userId:
          session.user.id,

        allowCreateProfile:
          true,

        requestedRole:
          roleFromUrl ||
          "owner",

        fallbackEmail:
          session.user.email ||
          credential.email ||
          "",

        fallbackFullName:
          appleFullName ||
          String(
            session.user
              .user_metadata
              ?.full_name ||
              ""
          ) ||
          String(
            session.user
              .user_metadata
              ?.name ||
              ""
          ),
      });
    } catch (error: any) {
      setAppleLoading(false);

      if (
        error?.code ===
        "ERR_REQUEST_CANCELED"
      ) {
        return;
      }

      setLoginError(
        error?.message ||
          ui.appleLoginFailed
      );
    }
  }

  const isBusy =
    loading ||
    googleLoading ||
    appleLoading;

  /*
   * ===================================================
   * SCREEN
   * ===================================================
   */

  return (
    <SafeAreaView
      style={
        styles.safeArea
      }
    >
      <StatusBar style="dark" />

      <KeyboardAvoidingView
        style={
          styles.keyboard
        }
        behavior={
          Platform.OS === "ios"
            ? "padding"
            : undefined
        }
      >
        {/* =================================
            HEADER
        ================================= */}

        <View
          style={
            styles.topBar
          }
        >
          <Pressable
            style={
              styles.backButton
            }
            onPress={() =>
              router.back()
            }
          >
            <ArrowLeft
              color={BLACK}
              size={17}
            />

            <Text
              style={
                styles.backText
              }
            >
              {ui.back}
            </Text>
          </Pressable>

          <View
            style={
              styles.languageControl
            }
          >
            <Languages
              color={GOLD_DARK}
              size={14}
            />

            {(
              ["en", "id"] as Language[]
            ).map((item) => {
              const active =
                language === item;

              return (
                <Pressable
                  key={item}
                  style={[
                    styles.languageButton,

                    active &&
                      styles.languageButtonActive,
                  ]}
                  onPress={() => {
                    setLoginError("");

                    setLanguage(
                      item
                    );
                  }}
                >
                  <Text
                    style={[
                      styles.languageText,

                      active &&
                        styles.languageTextActive,
                    ]}
                  >
                    {item.toUpperCase()}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* =================================
            CONTENT
        ================================= */}

        <ScrollView
          style={
            styles.scroll
          }
          contentContainerStyle={
            styles.content
          }
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={
            false
          }
        >
          {/* =================================
              BRAND
          ================================= */}

          <View
            style={
              styles.brandArea
            }
          >
            <View
              style={
                styles.logoWrap
              }
            >
              <Image
                source={
                  tetamoLogo
                }
                style={
                  styles.logo
                }
                resizeMode="contain"
              />
            </View>

            <Text
              style={
                styles.brandName
              }
            >
              TETAMO
            </Text>
          </View>

          {/* =================================
              AUTH CARD
          ================================= */}

          <View
            style={
              styles.authCard
            }
          >
            <View
              style={
                styles.eyebrow
              }
            >
              <ShieldCheck
                color={GOLD_DARK}
                size={13}
              />

              <Text
                style={
                  styles.eyebrowText
                }
              >
                {ui.eyebrow}
              </Text>
            </View>

            <Text
              style={
                styles.title
              }
            >
              {ui.title}
            </Text>

            <Text
              style={
                styles.subtitle
              }
            >
              {ui.subtitle}
            </Text>

            {/* =============================
                ERROR
            ============================= */}

            {loginError ? (
              <View
                style={
                  styles.errorBox
                }
              >
                <AlertCircle
                  color="#A23F3F"
                  size={17}
                />

                <View
                  style={
                    styles.errorTextBox
                  }
                >
                  <Text
                    style={
                      styles.errorText
                    }
                  >
                    {loginError}
                  </Text>

                  <Pressable
                    onPress={() =>
                      router.push(
                        getForgotPasswordPath() as any
                      )
                    }
                  >
                    <Text
                      style={
                        styles.errorLink
                      }
                    >
                      {ui.forgot}
                    </Text>
                  </Pressable>
                </View>
              </View>
            ) : null}

            {/* =============================
                EMAIL / WHATSAPP
            ============================= */}

            <FormInput
              label={
                ui.email
              }
              value={
                email
              }
              onChangeText={(
                value
              ) => {
                setEmail(value);

                setLoginError("");
              }}
              placeholder={
                ui.emailPlaceholder
              }
              keyboardType="email-address"
              autoCapitalize="none"
              icon={
                <Mail
                  color={GOLD_DARK}
                  size={16}
                />
              }
            />

            {/* =============================
                PASSWORD LABEL + FORGOT
            ============================= */}

            <View
              style={
                styles.passwordLabelRow
              }
            >
              <Text
                style={
                  styles.inputLabel
                }
              >
                {ui.password}
              </Text>

              <Pressable
                onPress={() =>
                  router.push(
                    getForgotPasswordPath() as any
                  )
                }
              >
                <Text
                  style={
                    styles.forgotText
                  }
                >
                  {ui.forgot}
                </Text>
              </Pressable>
            </View>

            <View
              style={
                styles.inputWrap
              }
            >
              <View
                style={
                  styles.inputIcon
                }
              >
                <LockKeyhole
                  color={GOLD_DARK}
                  size={16}
                />
              </View>

              <TextInput
                value={
                  password
                }
                onChangeText={(
                  value
                ) => {
                  setPassword(
                    value
                  );

                  setLoginError("");
                }}
                placeholder={
                  ui.passwordPlaceholder
                }
                placeholderTextColor="#A59F96"
                style={
                  styles.input
                }
                autoCapitalize="none"
                secureTextEntry={
                  !showPassword
                }
                returnKeyType="done"
                onSubmitEditing={() => {
                  if (!isBusy) {
                    void handleLogin();
                  }
                }}
              />

              <Pressable
                style={
                  styles.eyeButton
                }
                onPress={() =>
                  setShowPassword(
                    (current) =>
                      !current
                  )
                }
              >
                {showPassword ? (
                  <EyeOff
                    color="#8E877F"
                    size={17}
                  />
                ) : (
                  <Eye
                    color="#8E877F"
                    size={17}
                  />
                )}
              </Pressable>
            </View>

            {/* =============================
                LOGIN BUTTON
            ============================= */}

            <Pressable
              style={[
                styles.primaryButton,

                isBusy &&
                  styles.disabled,
              ]}
              disabled={
                isBusy
              }
              onPress={() =>
                void handleLogin()
              }
            >
              {loading ? (
                <ActivityIndicator
                  color={BLACK}
                />
              ) : null}

              <Text
                style={
                  styles.primaryButtonText
                }
              >
                {loading
                  ? ui.loggingIn
                  : ui.login}
              </Text>
            </Pressable>

            {/* =============================
                DIVIDER
            ============================= */}

            <View
              style={
                styles.dividerRow
              }
            >
              <View
                style={
                  styles.divider
                }
              />

              <Text
                style={
                  styles.dividerText
                }
              >
                {ui.or}
              </Text>

              <View
                style={
                  styles.divider
                }
              />
            </View>

            {/* =============================
                GOOGLE
            ============================= */}

            <Pressable
              style={[
                styles.socialButton,

                isBusy &&
                  styles.disabled,
              ]}
              disabled={
                isBusy
              }
              onPress={() =>
                void handleGoogleLogin()
              }
            >
              {googleLoading ? (
                <ActivityIndicator
                  color={BLACK}
                  size="small"
                />
              ) : (
                <View
                  style={
                    styles.googleIconWrap
                  }
                >
                  <Text
                    style={
                      styles.googleIcon
                    }
                  >
                    G
                  </Text>
                </View>
              )}

              <Text
                style={
                  styles.socialButtonText
                }
              >
                {googleLoading
                  ? ui.connecting
                  : ui.continueGoogle}
              </Text>
            </Pressable>

            {/* =============================
                APPLE
            ============================= */}

            {Platform.OS ===
            "ios" ? (
              <Pressable
                style={[
                  styles.appleButton,

                  isBusy &&
                    styles.disabled,
                ]}
                disabled={
                  isBusy
                }
                onPress={() =>
                  void handleAppleLogin()
                }
              >
                {appleLoading ? (
                  <ActivityIndicator
                    color={WHITE}
                    size="small"
                  />
                ) : (
                  <Text
                    style={
                      styles.appleIcon
                    }
                  >
                    
                  </Text>
                )}

                <Text
                  style={
                    styles.appleButtonText
                  }
                >
                  {appleLoading
                    ? ui.connecting
                    : ui.continueApple}
                </Text>
              </Pressable>
            ) : null}

            {/* =============================
                SIGN UP
            ============================= */}

            <View
              style={
                styles.authFooter
              }
            >
              <Text
                style={
                  styles.authFooterText
                }
              >
                {ui.noAccount}{" "}
              </Text>

              <Pressable
                onPress={() =>
                  router.push(
                    getSignupPath() as any
                  )
                }
              >
                <Text
                  style={
                    styles.authFooterLink
                  }
                >
                  {ui.signup}
                </Text>
              </Pressable>
            </View>
          </View>

          {/* =================================
              SMALL SECURITY NOTE
          ================================= */}

          <View
            style={
              styles.securityNote
            }
          >
            <ShieldCheck
              color={GOLD_DARK}
              size={14}
            />

            <Text
              style={
                styles.securityNoteText
              }
            >
              {ui.private}
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/*
 * =====================================================
 * FORM INPUT
 * =====================================================
 */

function FormInput({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  autoCapitalize,
  secureTextEntry,
  icon,
}: {
  label: string;

  value: string;

  onChangeText: (
    value: string
  ) => void;

  placeholder: string;

  keyboardType?:
    | "default"
    | "email-address"
    | "phone-pad";

  autoCapitalize?:
    | "none"
    | "sentences"
    | "words"
    | "characters";

  secureTextEntry?: boolean;

  icon?: React.ReactNode;
}) {
  return (
    <View
      style={
        styles.inputGroup
      }
    >
      <Text
        style={
          styles.inputLabel
        }
      >
        {label}
      </Text>

      <View
        style={
          styles.inputWrap
        }
      >
        {icon ? (
          <View
            style={
              styles.inputIcon
            }
          >
            {icon}
          </View>
        ) : null}

        <TextInput
          value={
            value
          }
          onChangeText={
            onChangeText
          }
          placeholder={
            placeholder
          }
          placeholderTextColor="#A59F96"
          style={
            styles.input
          }
          keyboardType={
            keyboardType
          }
          autoCapitalize={
            autoCapitalize
          }
          secureTextEntry={
            secureTextEntry
          }
        />
      </View>
    </View>
  );
}

/*
 * =====================================================
 * STYLES
 * =====================================================
 */

const styles =
  StyleSheet.create({
    safeArea: {
      flex: 1,

      backgroundColor:
        CREAM,
    },

    keyboard: {
      flex: 1,
    },

    /*
     * HEADER
     */

    topBar: {
      minHeight: 58,

      paddingHorizontal: 16,
      paddingVertical: 8,

      flexDirection: "row",
      alignItems: "center",
      justifyContent:
        "space-between",

      gap: 10,

      backgroundColor:
        CREAM,

      borderBottomWidth: 1,
      borderBottomColor:
        BORDER,
    },

    backButton: {
      minHeight: 38,

      paddingHorizontal: 11,

      borderRadius: 13,

      flexDirection: "row",
      alignItems: "center",

      gap: 5,

      backgroundColor:
        WHITE,

      borderWidth: 1,
      borderColor:
        BORDER,
    },

    backText: {
      color: BLACK,

      fontSize: 9.5,
      fontWeight: "900",
    },

    languageControl: {
      minHeight: 37,

      paddingHorizontal: 4,

      borderRadius: 13,

      flexDirection: "row",
      alignItems: "center",

      gap: 2,

      backgroundColor:
        WHITE,

      borderWidth: 1,
      borderColor:
        BORDER,
    },

    languageButton: {
      width: 31,
      height: 28,

      borderRadius: 9,

      alignItems: "center",
      justifyContent: "center",
    },

    languageButtonActive: {
      backgroundColor:
        GOLD_ACTIVE,
    },

    languageText: {
      color: "#918A81",

      fontSize: 8.5,
      fontWeight: "800",
    },

    languageTextActive: {
      color: BLACK,

      fontWeight: "900",
    },

    /*
     * SCROLL
     */

    scroll: {
      flex: 1,

      backgroundColor:
        CREAM,
    },

    content: {
      flexGrow: 1,

      paddingHorizontal: 18,
      paddingTop: 22,
      paddingBottom: 42,
    },

    /*
     * BRAND
     */

    brandArea: {
      alignItems: "center",

      marginBottom: 18,
    },

    logoWrap: {
      width: 54,
      height: 54,

      borderRadius: 18,

      alignItems: "center",
      justifyContent: "center",

      backgroundColor:
        BLACK,
    },

    logo: {
      width: 38,
      height: 38,
    },

    brandName: {
      marginTop: 8,

      color: BLACK,

      fontSize: 11,
      fontWeight: "900",

      letterSpacing: 2.4,
    },

    /*
     * AUTH CARD
     */

    authCard: {
      width: "100%",

      padding: 18,

      borderRadius: 24,

      backgroundColor:
        WHITE,

      borderWidth: 1,
      borderColor:
        BORDER,
    },

    eyebrow: {
      alignSelf: "flex-start",

      minHeight: 27,

      paddingHorizontal: 9,

      borderRadius: 999,

      flexDirection: "row",
      alignItems: "center",

      gap: 5,

      backgroundColor:
        GOLD_SOFT,
    },

    eyebrowText: {
      color: "#705A27",

      fontSize: 7.8,
      fontWeight: "900",

      letterSpacing: 0.8,
    },

    title: {
      marginTop: 13,

      color: BLACK,

      fontSize: 23,
      lineHeight: 28,

      fontWeight: "900",

      letterSpacing: -0.5,
    },

    subtitle: {
      marginTop: 5,
      marginBottom: 18,

      color: MUTED,

      fontSize: 10.5,
      lineHeight: 16,

      fontWeight: "500",
    },

    /*
     * ERROR
     */

    errorBox: {
      marginBottom: 14,

      padding: 11,

      borderRadius: 14,

      flexDirection: "row",
      alignItems: "flex-start",

      gap: 8,

      backgroundColor:
        "#FFF2F2",

      borderWidth: 1,
      borderColor:
        "#F0CBCB",
    },

    errorTextBox: {
      flex: 1,
    },

    errorText: {
      color: "#913535",

      fontSize: 9.5,
      lineHeight: 14,

      fontWeight: "600",
    },

    errorLink: {
      marginTop: 5,

      color: GOLD_DARK,

      fontSize: 9,
      fontWeight: "900",

      textDecorationLine:
        "underline",
    },

    /*
     * INPUTS
     */

    inputGroup: {
      marginBottom: 13,
    },

    inputLabel: {
      color: "#4E4943",

      fontSize: 9.5,
      fontWeight: "900",
    },

    passwordLabelRow: {
      marginBottom: 6,

      flexDirection: "row",
      alignItems: "center",
      justifyContent:
        "space-between",

      gap: 10,
    },

    inputWrap: {
      minHeight: 48,

      borderRadius: 14,

      flexDirection: "row",
      alignItems: "center",

      backgroundColor:
        CREAM,

      borderWidth: 1,
      borderColor:
        "#DED7CD",
    },

    inputIcon: {
      width: 42,

      alignItems: "center",
      justifyContent: "center",
    },

    input: {
      flex: 1,

      paddingVertical: 0,
      paddingRight: 11,

      color: BLACK,

      fontSize: 10.5,
      fontWeight: "600",
    },

    eyeButton: {
      width: 42,
      height: 47,

      alignItems: "center",
      justifyContent: "center",
    },

    forgotText: {
      color: GOLD_DARK,

      fontSize: 8.8,
      fontWeight: "900",
    },

    /*
     * LOGIN BUTTON
     */

    primaryButton: {
      minHeight: 49,

      marginTop: 15,

      borderRadius: 15,

      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",

      gap: 7,

      backgroundColor:
        GOLD_ACTIVE,
    },

    primaryButtonText: {
      color: BLACK,

      fontSize: 11,
      fontWeight: "900",
    },

    disabled: {
      opacity: 0.55,
    },

    /*
     * DIVIDER
     */

    dividerRow: {
      marginVertical: 16,

      flexDirection: "row",
      alignItems: "center",

      gap: 10,
    },

    divider: {
      flex: 1,

      height: 1,

      backgroundColor:
        "#E8E1D7",
    },

    dividerText: {
      color: "#9A938A",

      fontSize: 8.5,
      fontWeight: "800",

      textTransform:
        "uppercase",
    },

    /*
     * SOCIAL AUTH
     */

    socialButton: {
      minHeight: 48,

      paddingHorizontal: 12,

      borderRadius: 14,

      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",

      gap: 8,

      backgroundColor:
        WHITE,

      borderWidth: 1,
      borderColor:
        "#D9D2C8",
    },

    googleIconWrap: {
      width: 23,
      height: 23,

      borderRadius: 999,

      alignItems: "center",
      justifyContent: "center",

      backgroundColor:
        SOFT,
    },

    googleIcon: {
      color: BLACK,

      fontSize: 12,
      fontWeight: "900",
    },

    socialButtonText: {
      color: BLACK,

      fontSize: 10,
      fontWeight: "900",
    },

    appleButton: {
      minHeight: 48,

      marginTop: 9,

      paddingHorizontal: 12,

      borderRadius: 14,

      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",

      gap: 8,

      backgroundColor:
        BLACK,
    },

    appleIcon: {
      color: WHITE,

      fontSize: 17,
      fontWeight: "900",

      marginTop: -1,
    },

    appleButtonText: {
      color: WHITE,

      fontSize: 10,
      fontWeight: "900",
    },

    /*
     * SIGN UP
     */

    authFooter: {
      marginTop: 18,

      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",

      flexWrap: "wrap",
    },

    authFooterText: {
      color: MUTED,

      fontSize: 9.5,
      fontWeight: "600",
    },

    authFooterLink: {
      color: GOLD_DARK,

      fontSize: 9.5,
      fontWeight: "900",
    },

    /*
     * SECURITY NOTE
     */

    securityNote: {
      alignSelf: "center",

      marginTop: 14,

      paddingHorizontal: 11,
      paddingVertical: 8,

      borderRadius: 999,

      flexDirection: "row",
      alignItems: "center",

      gap: 5,

      backgroundColor:
        "#F6EFE0",
    },

    securityNoteText: {
      color: "#6C6252",

      fontSize: 8.3,
      fontWeight: "700",
    },
  });