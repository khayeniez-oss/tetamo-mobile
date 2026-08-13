import * as AppleAuthentication from "expo-apple-authentication";
import * as Crypto from "expo-crypto";
import * as Linking from "expo-linking";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as WebBrowser from "expo-web-browser";

import {
  ArrowLeft,
  BriefcaseBusiness,
  Building2,
  Check,
  CheckCircle2,
  ChevronRight,
  Eye,
  EyeOff,
  Languages,
  LockKeyhole,
  Mail,
  Phone,
  ShieldCheck,
  UserRound,
} from "lucide-react-native";

import { useEffect, useMemo, useState } from "react";

import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Linking as NativeLinking,
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

type AllowedRole =
  | "owner"
  | "agent"
  | "developer";

type Language = "en" | "id";

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

const TETAMO_SITE_URL =
  process.env.EXPO_PUBLIC_TETAMO_SITE_URL ||
  "https://www.tetamo.com";

const TERMS_URL =
  `${TETAMO_SITE_URL}/terms`;

const PRIVACY_URL =
  `${TETAMO_SITE_URL}/kebijakan-privasi`;

const SUBSCRIPTION_URL =
  `${TETAMO_SITE_URL}/kebijakan-berlangganan`;

/*
 * =====================================================
 * HELPERS
 * =====================================================
 */

function normalizePhoneNumber(
  value: string
) {
  const raw =
    String(value || "").trim();

  if (!raw) {
    return "";
  }

  const cleaned =
    raw.replace(/[^\d+]/g, "");

  if (!cleaned) {
    return "";
  }

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
  if (!value) {
    return false;
  }

  return /^\+[1-9]\d{7,14}$/.test(
    value
  );
}

function isValidEmail(
  value: string
) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    value
  );
}

function createNonce(
  length = 32
) {
  const charset =
    "0123456789ABCDEFGHIJKLMNOPQRSTUVXYZabcdefghijklmnopqrstuvwxyz-._";

  let result = "";

  for (
    let i = 0;
    i < length;
    i += 1
  ) {
    result +=
      charset[
        Math.floor(
          Math.random() *
            charset.length
        )
      ];
  }

  return result;
}

async function openPolicyUrl(
  url: string
) {
  try {
    await NativeLinking.openURL(
      url
    );
  } catch {
    Alert.alert(
      "Unable to open this link. Please try again later."
    );
  }
}

/*
 * =====================================================
 * SIGNUP SCREEN
 * =====================================================
 */

export default function SignupScreen() {
  const router = useRouter();

  const [language, setLanguage] =
    useState<Language>("en");

  const [
    selectedRole,
    setSelectedRole,
  ] =
    useState<AllowedRole | null>(
      null
    );

  const [
    phoneNumber,
    setPhoneNumber,
  ] = useState("");

  const [
    fullName,
    setFullName,
  ] = useState("");

  const [email, setEmail] =
    useState("");

  const [
    password,
    setPassword,
  ] = useState("");

  const [
    agreedToPolicies,
    setAgreedToPolicies,
  ] = useState(false);

  const [
    showPassword,
    setShowPassword,
  ] = useState(false);

  const [
    loadingEmail,
    setLoadingEmail,
  ] = useState(false);

  const [
    loadingGoogle,
    setLoadingGoogle,
  ] = useState(false);

  const [
    loadingApple,
    setLoadingApple,
  ] = useState(false);

  const [
    appleAvailable,
    setAppleAvailable,
  ] = useState(
    Platform.OS === "ios"
  );

  const isId =
    language === "id";

  const isIOS =
    Platform.OS === "ios";

  /*
   * ===================================================
   * COPY
   * ===================================================
   */

  const ui = useMemo(() => {
    if (isId) {
      return {
        back: "Kembali",

        badge:
          "DAFTAR TETAMO",

        title:
          "Buat akun Tetamo",

        subtitle:
          "Pilih cara Anda ingin menggunakan Tetamo.",

        chooseRole:
          "Bagaimana Anda menggunakan Tetamo?",

        chooseRoleDesc:
          "Pilih jenis akun yang paling sesuai.",

        ownerTitle:
          "Pemilik Properti",

        ownerDesc:
          "Untuk pemilik yang ingin mengiklankan properti sendiri.",

        agentTitle:
          "Agen Properti",

        agentDesc:
          "Untuk agen yang mengelola listing dan inquiry pelanggan.",

        developerTitle:
          "Developer",

        developerDesc:
          "Untuk developer dan project properti.",

        requestQuote:
          "Minta Penawaran",

        selectedRole:
          "Jenis akun",

        change:
          "Ganti",

        accountDetails:
          "Buat akun Anda",

        accountDetailsSub:
          "Lengkapi informasi dasar untuk melanjutkan.",

        phone:
          "Nomor WhatsApp / Telepon",

        phonePlaceholder:
          "+62 812 3456 7890",

        fullName:
          "Nama Lengkap",

        fullNamePlaceholder:
          "Nama lengkap",

        email:
          "Email",

        emailPlaceholder:
          "nama@email.com",

        password:
          "Kata Sandi",

        passwordPlaceholder:
          "Minimal 6 karakter",

        createAccount:
          "Buat Akun",

        creating:
          "Membuat akun...",

        continueGoogle:
          "Lanjutkan dengan Google",

        continueApple:
          "Lanjutkan dengan Apple",

        connecting:
          "Menghubungkan...",

        socialNote:
          "Untuk Google atau Apple, isi nomor WhatsApp dan setujui kebijakan Tetamo terlebih dahulu.",

        or: "atau",

        already:
          "Sudah punya akun?",

        login:
          "Masuk",

        policyStart:
          "Saya menyetujui ",

        terms:
          "Syarat & Ketentuan",

        privacy:
          "Kebijakan Privasi",

        subscription:
          "Kebijakan Berlangganan",

        and: "dan",

        safeSignup:
          "Pendaftaran aman dengan Tetamo",

        emptyRole:
          "Silakan pilih peran terlebih dahulu.",

        emptyName:
          "Mohon masukkan nama lengkap Anda.",

        emptyPhone:
          "Mohon masukkan nomor WhatsApp / telepon Anda.",

        invalidPhone:
          "Mohon masukkan nomor WhatsApp / telepon yang valid.",

        emptyEmailPassword:
          "Mohon lengkapi email dan kata sandi.",

        invalidEmail:
          "Format email tidak valid.",

        shortPassword:
          "Kata sandi minimal 6 karakter.",

        policyRequired:
          "Silakan setujui Syarat & Ketentuan, Kebijakan Privasi, dan Kebijakan Berlangganan terlebih dahulu.",

        signupSuccess:
          "Akun berhasil dibuat. Silakan cek email Anda jika diminta konfirmasi.",

        signupFailed:
          "Pendaftaran gagal.",

        googleUrlError:
          "URL pendaftaran Google gagal dibuat.",

        googleCodeError:
          "Pendaftaran Google tidak mengembalikan kode autentikasi.",

        googleSessionError:
          "Sesi pendaftaran Google gagal dibuat.",

        googleSignupFailed:
          "Pendaftaran dengan Google gagal.",

        appleUnavailable:
          "Daftar dengan Apple hanya tersedia di perangkat iOS.",

        appleTokenError:
          "Apple tidak mengembalikan token autentikasi.",

        appleSessionError:
          "Sesi pendaftaran Apple gagal dibuat.",

        appleSignupFailed:
          "Pendaftaran dengan Apple gagal.",
      };
    }

    return {
      back: "Back",

      badge:
        "TETAMO SIGN UP",

      title:
        "Create your Tetamo account",

      subtitle:
        "Choose how you want to use Tetamo.",

      chooseRole:
        "How will you use Tetamo?",

      chooseRoleDesc:
        "Choose the account type that best fits you.",

      ownerTitle:
        "Property Owner",

      ownerDesc:
        "For owners who want to advertise their own properties.",

      agentTitle:
        "Property Agent",

      agentDesc:
        "For agents managing listings and customer enquiries.",

      developerTitle:
        "Developer",

      developerDesc:
        "For property developers and development projects.",

      requestQuote:
        "Request Quote",

      selectedRole:
        "Account type",

      change:
        "Change",

      accountDetails:
        "Create your account",

      accountDetailsSub:
        "Complete your basic information to continue.",

      phone:
        "WhatsApp / Phone Number",

      phonePlaceholder:
        "+62 812 3456 7890",

      fullName:
        "Full Name",

      fullNamePlaceholder:
        "Full name",

      email:
        "Email",

      emailPlaceholder:
        "name@email.com",

      password:
        "Password",

      passwordPlaceholder:
        "Minimum 6 characters",

      createAccount:
        "Create Account",

      creating:
        "Creating account...",

      continueGoogle:
        "Continue with Google",

      continueApple:
        "Continue with Apple",

      connecting:
        "Connecting...",

      socialNote:
        "For Google or Apple, enter your WhatsApp number and accept Tetamo's policies first.",

      or: "or",

      already:
        "Already have an account?",

      login:
        "Log In",

      policyStart:
        "I agree to Tetamo's ",

      terms:
        "Terms & Conditions",

      privacy:
        "Privacy Policy",

      subscription:
        "Subscription Policy",

      and: "and",

      safeSignup:
        "Secure sign up with Tetamo",

      emptyRole:
        "Please choose a role first.",

      emptyName:
        "Please enter your full name.",

      emptyPhone:
        "Please enter your WhatsApp / phone number.",

      invalidPhone:
        "Please enter a valid WhatsApp / phone number.",

      emptyEmailPassword:
        "Please complete email and password.",

      invalidEmail:
        "Please enter a valid email address.",

      shortPassword:
        "Password must be at least 6 characters.",

      policyRequired:
        "Please agree to the Terms, Privacy Policy, and Subscription Policy first.",

      signupSuccess:
        "Account created successfully. Please check your email if confirmation is required.",

      signupFailed:
        "Signup failed.",

      googleUrlError:
        "Google signup URL was not created.",

      googleCodeError:
        "Google signup did not return an auth code.",

      googleSessionError:
        "Google signup session was not created.",

      googleSignupFailed:
        "Google signup failed.",

      appleUnavailable:
        "Sign up with Apple is only available on iOS devices.",

      appleTokenError:
        "Apple did not return an identity token.",

      appleSessionError:
        "Apple signup session was not created.",

      appleSignupFailed:
        "Apple signup failed.",
    };
  }, [isId]);

  /*
   * ===================================================
   * ROLE LABEL
   * ===================================================
   */

  const roleLabel =
    useMemo(() => {
      if (
        selectedRole === "owner"
      ) {
        return isId
          ? "Pemilik Properti"
          : "Property Owner";
      }

      if (
        selectedRole === "agent"
      ) {
        return isId
          ? "Agen Properti"
          : "Property Agent";
      }

      if (
        selectedRole ===
        "developer"
      ) {
        return "Developer";
      }

      return "";
    }, [
      selectedRole,
      isId,
    ]);

  const isBusy =
    loadingEmail ||
    loadingGoogle ||
    loadingApple;

  /*
   * ===================================================
   * APPLE AVAILABILITY
   * ===================================================
   */

  useEffect(() => {
    let mounted = true;

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

    void checkAppleAvailability();

    return () => {
      mounted = false;
    };
  }, []);

  /*
   * ===================================================
   * ROLE REDIRECTS
   * ===================================================
   */

  function getRoleRedirect(
    role: AllowedRole
  ) {
    if (
      Platform.OS === "ios"
    ) {
      if (
        role === "developer"
      ) {
        return "/developer-license";
      }

      return "/(tabs)/property";
    }

    if (role === "owner") {
      return "/owner/packages";
    }

    if (role === "agent") {
      return "/agent/packages";
    }

    return "/developer-license";
  }

  /*
   * ===================================================
   * VALIDATION
   * ===================================================
   */

  function validateSharedFields() {
    if (!selectedRole) {
      Alert.alert(
        ui.emptyRole
      );

      return null;
    }

    if (
      selectedRole ===
      "developer"
    ) {
      router.push(
        "/developer-license" as any
      );

      return null;
    }

    const normalizedPhone =
      normalizePhoneNumber(
        phoneNumber
      );

    if (!normalizedPhone) {
      Alert.alert(
        ui.emptyPhone
      );

      return null;
    }

    if (
      !isValidInternationalPhone(
        normalizedPhone
      )
    ) {
      Alert.alert(
        ui.invalidPhone
      );

      return null;
    }

    if (!agreedToPolicies) {
      Alert.alert(
        ui.policyRequired
      );

      return null;
    }

    return {
      role:
        selectedRole,

      phone:
        normalizedPhone,

      fullName:
        fullName.trim(),
    };
  }

  function validateEmailSignupFields() {
    const base =
      validateSharedFields();

    if (!base) {
      return null;
    }

    const trimmedFullName =
      fullName.trim();

    if (
      !trimmedFullName
    ) {
      Alert.alert(
        ui.emptyName
      );

      return null;
    }

    const trimmedEmail =
      email
        .trim()
        .toLowerCase();

    const trimmedPassword =
      password.trim();

    if (
      !trimmedEmail ||
      !trimmedPassword
    ) {
      Alert.alert(
        ui.emptyEmailPassword
      );

      return null;
    }

    if (
      !isValidEmail(
        trimmedEmail
      )
    ) {
      Alert.alert(
        ui.invalidEmail
      );

      return null;
    }

    if (
      trimmedPassword.length <
      6
    ) {
      Alert.alert(
        ui.shortPassword
      );

      return null;
    }

    return {
      ...base,

      fullName:
        trimmedFullName,

      email:
        trimmedEmail,

      password:
        trimmedPassword,
    };
  }

  /*
   * ===================================================
   * SAVE PROFILE
   * ===================================================
   */

  async function saveProfile({
    userId,
    userEmail,
    role,
    name,
    phone,
  }: {
    userId: string;
    userEmail: string;
    role:
      | "owner"
      | "agent";
    name: string;
    phone: string;
  }) {
    const { error } =
      await supabase
        .from("profiles")
        .upsert(
          {
            id: userId,

            email:
              userEmail,

            full_name:
              name,

            phone,

            role,
          },
          {
            onConflict:
              "id",
          }
        );

    if (error) {
      throw error;
    }
  }

  /*
   * ===================================================
   * EMAIL SIGNUP
   * ===================================================
   */

  async function handleEmailSignup() {
    const base =
      validateEmailSignupFields();

    if (!base) {
      return;
    }

    try {
      setLoadingEmail(true);
      setLoadingGoogle(false);
      setLoadingApple(false);

      const {
        data,
        error,
      } =
        await supabase.auth.signUp(
          {
            email:
              base.email,

            password:
              base.password,

            options: {
              data: {
                full_name:
                  base.fullName,

                role:
                  base.role,

                phone:
                  base.phone,

                agreed_to_terms:
                  true,

                agreed_to_policies_at:
                  new Date().toISOString(),
              },
            },
          }
        );

      if (error) {
        Alert.alert(
          error.message
        );

        return;
      }

      if (data.user) {
        await saveProfile({
          userId:
            data.user.id,

          userEmail:
            base.email,

          role:
            base.role,

          name:
            base.fullName,

          phone:
            base.phone,
        });
      }

      const redirectPath =
        getRoleRedirect(
          base.role
        );

      if (data.session) {
        router.replace(
          redirectPath as any
        );

        return;
      }

      Alert.alert(
        ui.signupSuccess
      );

      router.replace(
        `/login?role=${base.role}&next=${encodeURIComponent(
          redirectPath
        )}` as any
      );
    } catch (error: any) {
      Alert.alert(
        error?.message ||
          ui.signupFailed
      );
    } finally {
      setLoadingEmail(false);
    }
  }

  /*
   * ===================================================
   * GOOGLE SIGNUP
   * ===================================================
   */

  async function handleGoogleSignup() {
    const base =
      validateSharedFields();

    if (!base) {
      return;
    }

    try {
      setLoadingGoogle(true);
      setLoadingEmail(false);
      setLoadingApple(false);

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
        Alert.alert(
          error.message
        );

        return;
      }

      if (!data?.url) {
        Alert.alert(
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
        return;
      }

      const returnedUrl =
        new URL(
          result.url
        );

      const code =
        returnedUrl.searchParams.get(
          "code"
        );

      if (!code) {
        Alert.alert(
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
        Alert.alert(
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
        Alert.alert(
          ui.googleSessionError
        );

        return;
      }

      await saveProfile({
        userId:
          session.user.id,

        userEmail:
          session.user.email ||
          "",

        role:
          base.role,

        name:
          base.fullName ||
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
          ) ||
          "Tetamo User",

        phone:
          base.phone,
      });

      router.replace(
        getRoleRedirect(
          base.role
        ) as any
      );
    } catch (error: any) {
      Alert.alert(
        error?.message ||
          ui.googleSignupFailed
      );
    } finally {
      setLoadingGoogle(false);
    }
  }

  /*
   * ===================================================
   * APPLE SIGNUP
   * ===================================================
   */

  async function handleAppleSignup() {
    const base =
      validateSharedFields();

    if (!base) {
      return;
    }

    try {
      setLoadingApple(true);
      setLoadingEmail(false);
      setLoadingGoogle(false);

      if (!appleAvailable) {
        Alert.alert(
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
        Alert.alert(
          ui.appleTokenError
        );

        return;
      }

      const {
        error:
          signInError,
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
        Alert.alert(
          signInError.message ||
            ui.appleSignupFailed
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
        Alert.alert(
          ui.appleSessionError
        );

        return;
      }

      const appleFullName = [
        credential
          .fullName
          ?.givenName,

        credential
          .fullName
          ?.middleName,

        credential
          .fullName
          ?.familyName,
      ]
        .filter(Boolean)
        .join(" ");

      await saveProfile({
        userId:
          session.user.id,

        userEmail:
          session.user.email ||
          credential.email ||
          "",

        role:
          base.role,

        name:
          base.fullName ||
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
          ) ||
          "Tetamo User",

        phone:
          base.phone,
      });

      router.replace(
        getRoleRedirect(
          base.role
        ) as any
      );
    } catch (error: any) {
      if (
        error?.code ===
        "ERR_REQUEST_CANCELED"
      ) {
        return;
      }

      Alert.alert(
        error?.message ||
          ui.appleSignupFailed
      );
    } finally {
      setLoadingApple(false);
    }
  }

  /*
   * ===================================================
   * ROLE SELECTION
   * ===================================================
   */

  function handleSelectRole(
    role: AllowedRole
  ) {
    if (
      role === "developer"
    ) {
      router.push(
        "/developer-license" as any
      );

      return;
    }

    setSelectedRole(role);
  }

  /*
   * ===================================================
   * SCREEN
   * ===================================================
   */

  return (
    <SafeAreaView
      style={styles.safeArea}
    >
      <StatusBar style="dark" />

      <KeyboardAvoidingView
        style={styles.keyboard}
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
          style={styles.topBar}
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
                  onPress={() =>
                    setLanguage(item)
                  }
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

        <ScrollView
          style={styles.scroll}
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
            style={styles.brandArea}
          >
            <View
              style={styles.logoWrap}
            >
              <Image
                source={tetamoLogo}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>

            <Text
              style={styles.brandName}
            >
              TETAMO
            </Text>
          </View>

          {/* =================================
              INTRO
          ================================= */}

          <View
            style={styles.introCard}
          >
            <View
              style={styles.badge}
            >
              <ShieldCheck
                color={GOLD_DARK}
                size={13}
              />

              <Text
                style={
                  styles.badgeText
                }
              >
                {ui.badge}
              </Text>
            </View>

            <Text
              style={styles.title}
            >
              {ui.title}
            </Text>

            <Text
              style={styles.subtitle}
            >
              {ui.subtitle}
            </Text>
          </View>

          {/* =================================
              ROLE SELECTION
          ================================= */}

          {!selectedRole ? (
            <View
              style={styles.card}
            >
              <Text
                style={
                  styles.cardTitle
                }
              >
                {ui.chooseRole}
              </Text>

              <Text
                style={
                  styles.cardSub
                }
              >
                {
                  ui.chooseRoleDesc
                }
              </Text>

              <View
                style={
                  styles.roleList
                }
              >
                <RoleCard
                  icon={
                    <UserRound
                      color={GOLD_DARK}
                      size={19}
                    />
                  }
                  title={
                    ui.ownerTitle
                  }
                  description={
                    ui.ownerDesc
                  }
                  onPress={() =>
                    handleSelectRole(
                      "owner"
                    )
                  }
                />

                <RoleCard
                  icon={
                    <BriefcaseBusiness
                      color={GOLD_DARK}
                      size={19}
                    />
                  }
                  title={
                    ui.agentTitle
                  }
                  description={
                    ui.agentDesc
                  }
                  onPress={() =>
                    handleSelectRole(
                      "agent"
                    )
                  }
                />

                <RoleCard
                  icon={
                    <Building2
                      color={GOLD_DARK}
                      size={19}
                    />
                  }
                  title={
                    ui.developerTitle
                  }
                  description={
                    ui.developerDesc
                  }
                  badge={
                    ui.requestQuote
                  }
                  onPress={() =>
                    handleSelectRole(
                      "developer"
                    )
                  }
                />
              </View>

              <AuthFooter
                already={ui.already}
                login={ui.login}
                onLogin={() =>
                  router.push(
                    "/login" as any
                  )
                }
              />
            </View>
          ) : (
            <>
              {/* =============================
                  SELECTED ROLE
              ============================= */}

              <View
                style={
                  styles.selectedRoleCard
                }
              >
                <View
                  style={
                    styles.selectedRoleIcon
                  }
                >
                  {selectedRole ===
                  "agent" ? (
                    <BriefcaseBusiness
                      color={GOLD_DARK}
                      size={18}
                    />
                  ) : (
                    <UserRound
                      color={GOLD_DARK}
                      size={18}
                    />
                  )}
                </View>

                <View
                  style={
                    styles.selectedRoleCopy
                  }
                >
                  <Text
                    style={
                      styles.smallLabel
                    }
                  >
                    {
                      ui.selectedRole
                    }
                  </Text>

                  <Text
                    style={
                      styles.selectedRoleText
                    }
                  >
                    {roleLabel}
                  </Text>
                </View>

                <Pressable
                  style={
                    styles.changeButton
                  }
                  onPress={() => {
                    setSelectedRole(
                      null
                    );

                    setAgreedToPolicies(
                      false
                    );
                  }}
                >
                  <Text
                    style={
                      styles.changeButtonText
                    }
                  >
                    {ui.change}
                  </Text>
                </Pressable>
              </View>

              {/* =============================
                  ACCOUNT FORM
              ============================= */}

              <View
                style={styles.card}
              >
                <Text
                  style={
                    styles.cardTitle
                  }
                >
                  {
                    ui.accountDetails
                  }
                </Text>

                <Text
                  style={
                    styles.cardSub
                  }
                >
                  {
                    ui.accountDetailsSub
                  }
                </Text>

                <FormInput
                  label={ui.phone}
                  value={
                    phoneNumber
                  }
                  onChangeText={
                    setPhoneNumber
                  }
                  placeholder={
                    ui.phonePlaceholder
                  }
                  keyboardType="phone-pad"
                  icon={
                    <Phone
                      color={GOLD_DARK}
                      size={16}
                    />
                  }
                />

                <FormInput
                  label={
                    ui.fullName
                  }
                  value={
                    fullName
                  }
                  onChangeText={
                    setFullName
                  }
                  placeholder={
                    ui.fullNamePlaceholder
                  }
                  autoCapitalize="words"
                  icon={
                    <UserRound
                      color={GOLD_DARK}
                      size={16}
                    />
                  }
                />

                <FormInput
                  label={ui.email}
                  value={email}
                  onChangeText={
                    setEmail
                  }
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

                {/* =========================
                    PASSWORD
                ========================= */}

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
                    {ui.password}
                  </Text>

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
                      value={password}
                      onChangeText={
                        setPassword
                      }
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
                    />

                    <Pressable
                      style={
                        styles.eyeButton
                      }
                      onPress={() =>
                        setShowPassword(
                          (
                            current
                          ) =>
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
                </View>

                {/* =========================
                    POLICIES
                ========================= */}

                <View
                  style={
                    styles.policyBox
                  }
                >
                  <Pressable
                    style={[
                      styles.checkbox,

                      agreedToPolicies &&
                        styles.checkboxActive,
                    ]}
                    onPress={() =>
                      setAgreedToPolicies(
                        (
                          current
                        ) =>
                          !current
                      )
                    }
                  >
                    {agreedToPolicies ? (
                      <Check
                        color={BLACK}
                        size={13}
                      />
                    ) : null}
                  </Pressable>

                  <Text
                    style={
                      styles.policyText
                    }
                  >
                    {
                      ui.policyStart
                    }

                    <Text
                      style={
                        styles.policyLink
                      }
                      onPress={() =>
                        void openPolicyUrl(
                          TERMS_URL
                        )
                      }
                    >
                      {ui.terms}
                    </Text>

                    {", "}

                    <Text
                      style={
                        styles.policyLink
                      }
                      onPress={() =>
                        void openPolicyUrl(
                          PRIVACY_URL
                        )
                      }
                    >
                      {ui.privacy}
                    </Text>

                    {` ${ui.and} `}

                    <Text
                      style={
                        styles.policyLink
                      }
                      onPress={() =>
                        void openPolicyUrl(
                          SUBSCRIPTION_URL
                        )
                      }
                    >
                      {
                        ui.subscription
                      }
                    </Text>
                    .
                  </Text>
                </View>

                {/* =========================
                    EMAIL SIGNUP
                ========================= */}

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
                    void handleEmailSignup()
                  }
                >
                  {loadingEmail ? (
                    <ActivityIndicator
                      color={BLACK}
                    />
                  ) : (
                    <CheckCircle2
                      color={BLACK}
                      size={16}
                    />
                  )}

                  <Text
                    style={
                      styles.primaryButtonText
                    }
                  >
                    {loadingEmail
                      ? ui.creating
                      : ui.createAccount}
                  </Text>
                </Pressable>

                {/* =========================
                    DIVIDER
                ========================= */}

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

                {/* =========================
                    SOCIAL NOTE
                ========================= */}

                <Text
                  style={
                    styles.socialNote
                  }
                >
                  {ui.socialNote}
                </Text>

                {/* =========================
                    GOOGLE
                ========================= */}

                <Pressable
                  style={[
                    styles.googleButton,

                    isBusy &&
                      styles.disabled,
                  ]}
                  disabled={
                    isBusy
                  }
                  onPress={() =>
                    void handleGoogleSignup()
                  }
                >
                  {loadingGoogle ? (
                    <ActivityIndicator
                      color={BLACK}
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
                      styles.googleButtonText
                    }
                  >
                    {loadingGoogle
                      ? ui.connecting
                      : ui.continueGoogle}
                  </Text>
                </Pressable>

                {/* =========================
                    APPLE
                ========================= */}

                {isIOS &&
                appleAvailable ? (
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
                      void handleAppleSignup()
                    }
                  >
                    {loadingApple ? (
                      <ActivityIndicator
                        color={WHITE}
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
                      {loadingApple
                        ? ui.connecting
                        : ui.continueApple}
                    </Text>
                  </Pressable>
                ) : null}

                {/* =========================
                    LOGIN FOOTER
                ========================= */}

                <AuthFooter
                  already={
                    ui.already
                  }
                  login={ui.login}
                  onLogin={() =>
                    router.push(
                      `/login?role=${selectedRole}&next=${encodeURIComponent(
                        getRoleRedirect(
                          selectedRole
                        )
                      )}` as any
                    )
                  }
                />
              </View>
            </>
          )}

          {/* =================================
              SECURITY NOTE
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
              {ui.safeSignup}
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/*
 * =====================================================
 * ROLE CARD
 * =====================================================
 */

function RoleCard({
  icon,
  title,
  description,
  badge,
  onPress,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  badge?: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={styles.roleCard}
      onPress={onPress}
    >
      <View
        style={styles.roleIcon}
      >
        {icon}
      </View>

      <View
        style={
          styles.roleTextBox
        }
      >
        <View
          style={
            styles.roleTitleRow
          }
        >
          <Text
            style={
              styles.roleTitle
            }
          >
            {title}
          </Text>

          {badge ? (
            <View
              style={
                styles.roleBadge
              }
            >
              <Text
                style={
                  styles.roleBadgeText
                }
              >
                {badge}
              </Text>
            </View>
          ) : null}
        </View>

        <Text
          style={
            styles.roleDesc
          }
        >
          {description}
        </Text>
      </View>

      <ChevronRight
        color="#9A938A"
        size={17}
      />
    </Pressable>
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
      style={styles.inputGroup}
    >
      <Text
        style={styles.inputLabel}
      >
        {label}
      </Text>

      <View
        style={styles.inputWrap}
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
          value={value}
          onChangeText={
            onChangeText
          }
          placeholder={
            placeholder
          }
          placeholderTextColor="#A59F96"
          style={styles.input}
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
 * AUTH FOOTER
 * =====================================================
 */

function AuthFooter({
  already,
  login,
  onLogin,
}: {
  already: string;
  login: string;
  onLogin: () => void;
}) {
  return (
    <View
      style={styles.authFooter}
    >
      <Text
        style={
          styles.authFooterText
        }
      >
        {already}{" "}
      </Text>

      <Pressable
        onPress={onLogin}
      >
        <Text
          style={
            styles.authFooterLink
          }
        >
          {login}
        </Text>
      </Pressable>
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
      paddingHorizontal: 18,
      paddingTop: 20,

      /*
       * Temporary room while auth
       * pages still inherit footer.
       * We'll remove that footer
       * from the layout next.
       */
      paddingBottom: 120,
    },

    /*
     * BRAND
     */

    brandArea: {
      alignItems: "center",

      marginBottom: 17,
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
     * INTRO
     */

    introCard: {
      padding: 17,

      borderRadius: 23,

      backgroundColor:
        WHITE,

      borderWidth: 1,
      borderColor:
        BORDER,

      marginBottom: 11,
    },

    badge: {
      alignSelf:
        "flex-start",

      minHeight: 27,

      paddingHorizontal: 9,

      borderRadius: 999,

      flexDirection: "row",
      alignItems: "center",

      gap: 5,

      backgroundColor:
        GOLD_SOFT,
    },

    badgeText: {
      color: "#705A27",

      fontSize: 7.8,
      fontWeight: "900",

      letterSpacing: 0.7,
    },

    title: {
      marginTop: 13,

      color: BLACK,

      fontSize: 23,
      lineHeight: 29,

      fontWeight: "900",

      letterSpacing: -0.5,
    },

    subtitle: {
      marginTop: 5,

      color: MUTED,

      fontSize: 10.5,
      lineHeight: 16,

      fontWeight: "500",
    },

    /*
     * MAIN CARD
     */

    card: {
      padding: 15,

      borderRadius: 23,

      backgroundColor:
        WHITE,

      borderWidth: 1,
      borderColor:
        BORDER,
    },

    cardTitle: {
      color: BLACK,

      fontSize: 15,
      fontWeight: "900",
    },

    cardSub: {
      marginTop: 4,
      marginBottom: 13,

      color: MUTED,

      fontSize: 9.5,
      lineHeight: 14,

      fontWeight: "500",
    },

    /*
     * ROLES
     */

    roleList: {
      gap: 8,
    },

    roleCard: {
      minHeight: 82,

      padding: 11,

      borderRadius: 18,

      flexDirection: "row",
      alignItems: "center",

      gap: 9,

      backgroundColor:
        CREAM,

      borderWidth: 1,
      borderColor:
        "#DED7CD",
    },

    roleIcon: {
      width: 40,
      height: 40,

      borderRadius: 13,

      alignItems: "center",
      justifyContent: "center",

      backgroundColor:
        GOLD_SOFT,
    },

    roleTextBox: {
      flex: 1,
      minWidth: 0,
    },

    roleTitleRow: {
      flexDirection: "row",
      alignItems: "center",

      gap: 6,
    },

    roleTitle: {
      flexShrink: 1,

      color: BLACK,

      fontSize: 11.5,
      fontWeight: "900",
    },

    roleDesc: {
      marginTop: 3,

      color: MUTED,

      fontSize: 8.7,
      lineHeight: 13,

      fontWeight: "500",
    },

    roleBadge: {
      minHeight: 22,

      paddingHorizontal: 7,

      borderRadius: 999,

      alignItems: "center",
      justifyContent: "center",

      backgroundColor:
        BLACK,
    },

    roleBadgeText: {
      color: WHITE,

      fontSize: 6.8,
      fontWeight: "900",
    },

    /*
     * SELECTED ROLE
     */

    selectedRoleCard: {
      minHeight: 67,

      marginBottom: 10,

      paddingHorizontal: 12,

      borderRadius: 18,

      flexDirection: "row",
      alignItems: "center",

      gap: 9,

      backgroundColor:
        "#F7F0DE",

      borderWidth: 1,
      borderColor:
        "#E1D09C",
    },

    selectedRoleIcon: {
      width: 38,
      height: 38,

      borderRadius: 12,

      alignItems: "center",
      justifyContent: "center",

      backgroundColor:
        GOLD_SOFT,
    },

    selectedRoleCopy: {
      flex: 1,
    },

    smallLabel: {
      color: "#847B6D",

      fontSize: 7.8,
      fontWeight: "700",
    },

    selectedRoleText: {
      marginTop: 2,

      color: BLACK,

      fontSize: 11.5,
      fontWeight: "900",
    },

    changeButton: {
      minHeight: 31,

      paddingHorizontal: 9,

      borderRadius: 10,

      alignItems: "center",
      justifyContent: "center",

      backgroundColor:
        WHITE,

      borderWidth: 1,
      borderColor:
        "#DECFA7",
    },

    changeButtonText: {
      color: GOLD_DARK,

      fontSize: 8.3,
      fontWeight: "900",
    },

    /*
     * INPUT
     */

    inputGroup: {
      marginBottom: 12,
    },

    inputLabel: {
      marginBottom: 6,

      color: "#4E4943",

      fontSize: 9.4,
      fontWeight: "900",
    },

    inputWrap: {
      minHeight: 47,

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
      height: 46,

      alignItems: "center",
      justifyContent: "center",
    },

    /*
     * POLICIES
     */

    policyBox: {
      marginTop: 2,
      marginBottom: 13,

      padding: 11,

      borderRadius: 15,

      flexDirection: "row",
      alignItems: "flex-start",

      gap: 9,

      backgroundColor:
        "#F7F2E8",

      borderWidth: 1,
      borderColor:
        "#E4D7B6",
    },

    checkbox: {
      width: 21,
      height: 21,

      marginTop: 1,

      borderRadius: 7,

      alignItems: "center",
      justifyContent: "center",

      backgroundColor:
        WHITE,

      borderWidth: 1,
      borderColor:
        "#BDB5AA",
    },

    checkboxActive: {
      backgroundColor:
        GOLD_ACTIVE,

      borderColor:
        "#DDC457",
    },

    policyText: {
      flex: 1,

      color: "#625C54",

      fontSize: 8.5,
      lineHeight: 13,

      fontWeight: "500",
    },

    policyLink: {
      color: GOLD_DARK,

      fontWeight: "900",

      textDecorationLine:
        "underline",
    },

    /*
     * PRIMARY
     */

    primaryButton: {
      minHeight: 49,

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
      marginVertical: 15,

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

      fontSize: 8.3,
      fontWeight: "800",

      textTransform:
        "uppercase",
    },

    /*
     * SOCIAL AUTH
     */

    socialNote: {
      marginBottom: 10,

      color: MUTED,

      fontSize: 8.4,
      lineHeight: 13,

      fontWeight: "500",

      textAlign: "center",
    },

    googleButton: {
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

    googleButtonText: {
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
     * LOGIN FOOTER
     */

    authFooter: {
      marginTop: 17,

      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",

      flexWrap: "wrap",
    },

    authFooterText: {
      color: MUTED,

      fontSize: 9.3,
      fontWeight: "600",
    },

    authFooterLink: {
      color: GOLD_DARK,

      fontSize: 9.3,
      fontWeight: "900",
    },

    /*
     * SECURITY
     */

    securityNote: {
      alignSelf: "center",

      marginTop: 13,

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

      fontSize: 8.2,
      fontWeight: "700",
    },
  });