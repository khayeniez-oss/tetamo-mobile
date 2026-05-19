import * as Linking from "expo-linking";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as WebBrowser from "expo-web-browser";
import {
  ArrowLeft,
  BriefcaseBusiness,
  Building2,
  Check,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  Phone,
  ShieldCheck,
  UserRound,
} from "lucide-react-native";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
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

type AllowedRole = "owner" | "agent" | "developer";
type Language = "en" | "id";

const TETAMO_SITE_URL =
  process.env.EXPO_PUBLIC_TETAMO_SITE_URL || "https://www.tetamo.com";

const TERMS_URL = `${TETAMO_SITE_URL}/terms`;
const PRIVACY_URL = `${TETAMO_SITE_URL}/kebijakan-privasi`;
const SUBSCRIPTION_URL = `${TETAMO_SITE_URL}/kebijakan-berlangganan`;

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

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

async function openPolicyUrl(url: string) {
  try {
    await NativeLinking.openURL(url);
  } catch {
    Alert.alert("Unable to open this link. Please try again later.");
  }
}

export default function SignupScreen() {
  const router = useRouter();

  const [language, setLanguage] = useState<Language>("en");
  const [selectedRole, setSelectedRole] = useState<AllowedRole | null>(null);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [agreedToPolicies, setAgreedToPolicies] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loadingEmail, setLoadingEmail] = useState(false);
  const [loadingGoogle, setLoadingGoogle] = useState(false);

  const isId = language === "id";

  const ui = useMemo(() => {
    if (isId) {
      return {
        badge: "DAFTAR TETAMO",
        title: "Buat akun Tetamo",
        subtitle: "Pilih peran Anda dan lanjutkan ke alur yang sesuai.",
        chooseRole: "Pilih Peran",
        chooseRoleDesc: "Pilih bagaimana Anda ingin menggunakan Tetamo.",
        ownerTitle: "Pemilik Properti",
        ownerDesc: "Untuk pemilik yang ingin memasang listing.",
        agentTitle: "Agen Properti",
        agentDesc: "Untuk agen yang ingin mengelola listing dan leads.",
        developerTitle: "Developer",
        developerDesc: "Untuk developer yang ingin meminta penawaran.",
        requestQuote: "Minta Penawaran",
        selectedRole: "Peran terpilih",
        change: "Ganti",
        phone: "Nomor WhatsApp / Telepon",
        phonePlaceholder: "+62 812 3456 7890",
        fullName: "Nama Lengkap",
        fullNamePlaceholder: "Nama lengkap",
        email: "Email",
        password: "Kata Sandi",
        createAccount: "Buat Akun",
        creating: "Membuat akun...",
        continueGoogle: "Lanjutkan dengan Google",
        connecting: "Menghubungkan...",
        or: "atau",
        already: "Sudah punya akun?",
        login: "Masuk",
        policyStart: "Saya menyetujui ",
        terms: "Syarat & Ketentuan",
        privacy: "Kebijakan Privasi",
        subscription: "Kebijakan Berlangganan",
        and: "dan",
        emptyRole: "Silakan pilih peran terlebih dahulu.",
        emptyName: "Mohon masukkan nama lengkap Anda.",
        emptyPhone: "Mohon masukkan nomor WhatsApp / telepon Anda.",
        invalidPhone: "Mohon masukkan nomor WhatsApp / telepon yang valid.",
        emptyEmailPassword: "Mohon lengkapi email dan kata sandi.",
        invalidEmail: "Format email tidak valid.",
        shortPassword: "Kata sandi minimal 6 karakter.",
        policyRequired:
          "Silakan setujui Syarat & Ketentuan, Kebijakan Privasi, dan Kebijakan Berlangganan terlebih dahulu.",
        signupSuccess:
          "Akun berhasil dibuat. Silakan cek email Anda jika diminta konfirmasi.",
        signupFailed: "Pendaftaran gagal.",
        googleUrlError: "URL pendaftaran Google gagal dibuat.",
        googleCodeError:
          "Pendaftaran Google tidak mengembalikan kode autentikasi.",
        googleSessionError: "Sesi pendaftaran Google gagal dibuat.",
        googleSignupFailed: "Pendaftaran dengan Google gagal.",
        secureTitle: "Akun Anda lebih aman",
        secureText:
          "Email digunakan untuk login, reset password, tanda terima, invoice, dan pemulihan akun.",
      };
    }

    return {
      badge: "TETAMO SIGNUP",
      title: "Create your Tetamo account",
      subtitle: "Choose your role and continue to the right flow.",
      chooseRole: "Choose Role",
      chooseRoleDesc: "Choose how you want to use Tetamo.",
      ownerTitle: "Property Owner",
      ownerDesc: "For owners who want to list properties.",
      agentTitle: "Property Agent",
      agentDesc: "For agents who want to manage listings and leads.",
      developerTitle: "Developer",
      developerDesc: "For developers who want to request a quotation.",
      requestQuote: "Request Quote",
      selectedRole: "Selected role",
      change: "Change",
      phone: "WhatsApp / Phone Number",
      phonePlaceholder: "+62 812 3456 7890",
      fullName: "Full Name",
      fullNamePlaceholder: "Full name",
      email: "Email",
      password: "Password",
      createAccount: "Create Account",
      creating: "Creating account...",
      continueGoogle: "Continue with Google",
      connecting: "Connecting...",
      or: "or",
      already: "Already have an account?",
      login: "Log in",
      policyStart: "I agree to Tetamo’s ",
      terms: "Terms & Conditions",
      privacy: "Privacy Policy",
      subscription: "Subscription Policy",
      and: "and",
      emptyRole: "Please choose a role first.",
      emptyName: "Please enter your full name.",
      emptyPhone: "Please enter your WhatsApp / phone number.",
      invalidPhone: "Please enter a valid WhatsApp / phone number.",
      emptyEmailPassword: "Please complete email and password.",
      invalidEmail: "Please enter a valid email address.",
      shortPassword: "Password must be at least 6 characters.",
      policyRequired:
        "Please agree to the Terms, Privacy Policy, and Subscription Policy first.",
      signupSuccess:
        "Account created successfully. Please check your email if confirmation is required.",
      signupFailed: "Signup failed.",
      googleUrlError: "Google signup URL was not created.",
      googleCodeError: "Google signup did not return an auth code.",
      googleSessionError: "Google signup session was not created.",
      googleSignupFailed: "Google signup failed.",
      secureTitle: "Your account is safer",
      secureText:
        "Email is used for login, password reset, receipts, invoices, and account recovery.",
    };
  }, [isId]);

  const roleLabel = useMemo(() => {
    if (selectedRole === "owner") return isId ? "Pemilik" : "Owner";
    if (selectedRole === "agent") return isId ? "Agen" : "Agent";
    if (selectedRole === "developer") return "Developer";
    return "";
  }, [selectedRole, isId]);

  const isBusy = loadingEmail || loadingGoogle;

  function getRoleRedirect(role: AllowedRole) {
    if (role === "owner") return "/owner/packages";
    if (role === "agent") return "/agent/packages";
    return "/developer-license";
  }

  function validateBaseFields() {
    if (!selectedRole) {
      Alert.alert(ui.emptyRole);
      return null;
    }

    if (selectedRole === "developer") {
      router.push("/developer-license" as any);
      return null;
    }

    const trimmedFullName = fullName.trim();
    if (!trimmedFullName) {
      Alert.alert(ui.emptyName);
      return null;
    }

    const normalizedPhone = normalizePhoneNumber(phoneNumber);
    if (!normalizedPhone) {
      Alert.alert(ui.emptyPhone);
      return null;
    }

    if (!isValidInternationalPhone(normalizedPhone)) {
      Alert.alert(ui.invalidPhone);
      return null;
    }

    if (!agreedToPolicies) {
      Alert.alert(ui.policyRequired);
      return null;
    }

    return {
      role: selectedRole,
      fullName: trimmedFullName,
      phone: normalizedPhone,
    };
  }

  async function saveProfile({
    userId,
    userEmail,
    role,
    name,
    phone,
  }: {
    userId: string;
    userEmail: string;
    role: "owner" | "agent";
    name: string;
    phone: string;
  }) {
    const { error } = await supabase.from("profiles").upsert(
      {
        id: userId,
        email: userEmail,
        full_name: name,
        phone,
        role,
      },
      {
        onConflict: "id",
      },
    );

    if (error) throw error;
  }

  async function handleEmailSignup() {
    const base = validateBaseFields();
    if (!base) return;

    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPassword = password.trim();

    if (!trimmedEmail || !trimmedPassword) {
      Alert.alert(ui.emptyEmailPassword);
      return;
    }

    if (!isValidEmail(trimmedEmail)) {
      Alert.alert(ui.invalidEmail);
      return;
    }

    if (trimmedPassword.length < 6) {
      Alert.alert(ui.shortPassword);
      return;
    }

    try {
      setLoadingEmail(true);

      const { data, error } = await supabase.auth.signUp({
        email: trimmedEmail,
        password: trimmedPassword,
        options: {
          data: {
            full_name: base.fullName,
            role: base.role,
            phone: base.phone,
            agreed_to_terms: true,
            agreed_to_policies_at: new Date().toISOString(),
          },
        },
      });

      if (error) {
        Alert.alert(error.message);
        return;
      }

      if (data.user) {
        await saveProfile({
          userId: data.user.id,
          userEmail: trimmedEmail,
          role: base.role,
          name: base.fullName,
          phone: base.phone,
        });
      }

      if (data.session) {
        router.replace(getRoleRedirect(base.role) as any);
        return;
      }

      Alert.alert(ui.signupSuccess);
      router.replace(
        `/login?role=${base.role}&next=${encodeURIComponent(
          getRoleRedirect(base.role),
        )}` as any,
      );
    } catch (error: any) {
      Alert.alert(error?.message || ui.signupFailed);
    } finally {
      setLoadingEmail(false);
    }
  }

  async function handleGoogleSignup() {
    const base = validateBaseFields();
    if (!base) return;

    try {
      setLoadingGoogle(true);

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
        Alert.alert(error.message);
        return;
      }

      if (!data?.url) {
        Alert.alert(ui.googleUrlError);
        return;
      }

      const result = await WebBrowser.openAuthSessionAsync(
        data.url,
        redirectTo,
      );

      if (result.type !== "success" || !result.url) {
        return;
      }

      const returnedUrl = new URL(result.url);
      const code = returnedUrl.searchParams.get("code");

      if (!code) {
        Alert.alert(ui.googleCodeError);
        return;
      }

      const { error: exchangeError } =
        await supabase.auth.exchangeCodeForSession(code);

      if (exchangeError) {
        Alert.alert(exchangeError.message);
        return;
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        Alert.alert(ui.googleSessionError);
        return;
      }

      await saveProfile({
        userId: session.user.id,
        userEmail: session.user.email || "",
        role: base.role,
        name:
          base.fullName ||
          String(session.user.user_metadata?.full_name || "") ||
          String(session.user.user_metadata?.name || ""),
        phone: base.phone,
      });

      router.replace(getRoleRedirect(base.role) as any);
    } catch (error: any) {
      Alert.alert(error?.message || ui.googleSignupFailed);
    } finally {
      setLoadingGoogle(false);
    }
  }

  function handleSelectRole(role: AllowedRole) {
    if (role === "developer") {
      router.push("/developer-license" as any);
      return;
    }

    setSelectedRole(role);
  }

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

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.heroCard}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{ui.badge}</Text>
            </View>

            <Text style={styles.title}>{ui.title}</Text>
            <Text style={styles.subtitle}>{ui.subtitle}</Text>
          </View>

          {!selectedRole ? (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>{ui.chooseRole}</Text>
              <Text style={styles.cardSub}>{ui.chooseRoleDesc}</Text>

              <View style={styles.roleList}>
                <RoleCard
                  active={selectedRole === "owner"}
                  tone="amber"
                  icon={<UserRound color="#111111" size={19} />}
                  title={ui.ownerTitle}
                  description={ui.ownerDesc}
                  onPress={() => handleSelectRole("owner")}
                />

                <RoleCard
                  active={selectedRole === "agent"}
                  tone="emerald"
                  icon={<BriefcaseBusiness color="#111111" size={19} />}
                  title={ui.agentTitle}
                  description={ui.agentDesc}
                  onPress={() => handleSelectRole("agent")}
                />

                <RoleCard
                  active={false}
                  tone="slate"
                  icon={<Building2 color="#111111" size={19} />}
                  title={ui.developerTitle}
                  description={ui.developerDesc}
                  badge={ui.requestQuote}
                  onPress={() => handleSelectRole("developer")}
                />
              </View>

              <AuthFooter
                isId={isId}
                already={ui.already}
                login={ui.login}
                onLogin={() => router.push("/login" as any)}
              />
            </View>
          ) : (
            <View style={styles.card}>
              <View style={styles.selectedRoleBox}>
                <View>
                  <Text style={styles.smallLabel}>{ui.selectedRole}</Text>
                  <Text style={styles.selectedRoleText}>{roleLabel}</Text>
                </View>

                <Pressable
                  style={styles.changeButton}
                  onPress={() => {
                    setSelectedRole(null);
                    setAgreedToPolicies(false);
                  }}
                >
                  <ArrowLeft color="#111111" size={13} />
                  <Text style={styles.changeButtonText}>{ui.change}</Text>
                </Pressable>
              </View>

              <FormInput
                label={ui.phone}
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                placeholder={ui.phonePlaceholder}
                keyboardType="phone-pad"
                icon={<Phone color="#e6c15c" size={17} />}
              />

              <FormInput
                label={ui.fullName}
                value={fullName}
                onChangeText={setFullName}
                placeholder={ui.fullNamePlaceholder}
                autoCapitalize="words"
                icon={<UserRound color="#e6c15c" size={17} />}
              />

              <FormInput
                label={ui.email}
                value={email}
                onChangeText={setEmail}
                placeholder="Email"
                keyboardType="email-address"
                autoCapitalize="none"
                icon={<Mail color="#e6c15c" size={17} />}
              />

              <FormInput
                label={ui.password}
                value={password}
                onChangeText={setPassword}
                placeholder={ui.password}
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

              <View style={styles.policyBox}>
                <Pressable
                  style={[
                    styles.checkbox,
                    agreedToPolicies && styles.checkboxActive,
                  ]}
                  onPress={() => setAgreedToPolicies((prev) => !prev)}
                >
                  {agreedToPolicies ? (
                    <Check color="#111111" size={13} />
                  ) : null}
                </Pressable>

                <Text style={styles.policyText}>
                  {ui.policyStart}
                  <Text
                    style={styles.policyLink}
                    onPress={() => void openPolicyUrl(TERMS_URL)}
                  >
                    {ui.terms}
                  </Text>
                  {", "}
                  <Text
                    style={styles.policyLink}
                    onPress={() => void openPolicyUrl(PRIVACY_URL)}
                  >
                    {ui.privacy}
                  </Text>
                  {` ${ui.and} `}
                  <Text
                    style={styles.policyLink}
                    onPress={() => void openPolicyUrl(SUBSCRIPTION_URL)}
                  >
                    {ui.subscription}
                  </Text>
                  .
                </Text>
              </View>

              <Pressable
                style={[styles.primaryButton, isBusy && styles.disabled]}
                disabled={isBusy}
                onPress={handleEmailSignup}
              >
                {loadingEmail ? <ActivityIndicator color="#ffffff" /> : null}
                <Text style={styles.primaryButtonText}>
                  {loadingEmail ? ui.creating : ui.createAccount}
                </Text>
              </Pressable>

              <View style={styles.dividerRow}>
                <View style={styles.divider} />
                <Text style={styles.dividerText}>{ui.or}</Text>
                <View style={styles.divider} />
              </View>

              <Pressable
                style={[styles.googleButton, isBusy && styles.disabled]}
                disabled={isBusy}
                onPress={handleGoogleSignup}
              >
                {loadingGoogle ? (
                  <ActivityIndicator color="#111111" />
                ) : (
                  <Text style={styles.googleIcon}>G</Text>
                )}
                <Text style={styles.googleButtonText}>
                  {loadingGoogle ? ui.connecting : ui.continueGoogle}
                </Text>
              </Pressable>

              <View style={styles.secureBox}>
                <ShieldCheck color="#60a5fa" size={17} />
                <View style={styles.secureTextBox}>
                  <Text style={styles.secureTitle}>{ui.secureTitle}</Text>
                  <Text style={styles.secureText}>{ui.secureText}</Text>
                </View>
              </View>

              <AuthFooter
                isId={isId}
                already={ui.already}
                login={ui.login}
                onLogin={() =>
                  router.push(
                    `/login?role=${selectedRole}&next=${encodeURIComponent(
                      getRoleRedirect(selectedRole),
                    )}` as any,
                  )
                }
              />
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function RoleCard({
  active,
  tone,
  icon,
  title,
  description,
  badge,
  onPress,
}: {
  active: boolean;
  tone: "amber" | "emerald" | "slate";
  icon: React.ReactNode;
  title: string;
  description: string;
  badge?: string;
  onPress: () => void;
}) {
  const toneStyle =
    tone === "amber"
      ? styles.roleAmber
      : tone === "emerald"
        ? styles.roleEmerald
        : styles.roleSlate;

  return (
    <Pressable
      style={[styles.roleCard, toneStyle, active && styles.roleCardActive]}
      onPress={onPress}
    >
      {badge ? (
        <View style={styles.roleBadge}>
          <Text style={styles.roleBadgeText}>{badge}</Text>
        </View>
      ) : null}

      <View style={styles.roleIcon}>{icon}</View>

      <View style={styles.roleTextBox}>
        <Text style={styles.roleTitle}>{title}</Text>
        <Text style={styles.roleDesc}>{description}</Text>
      </View>
    </Pressable>
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

function AuthFooter({
  already,
  login,
  onLogin,
}: {
  isId: boolean;
  already: string;
  login: string;
  onLogin: () => void;
}) {
  return (
    <View style={styles.authFooter}>
      <Text style={styles.authFooterText}>{already} </Text>
      <Pressable onPress={onLogin}>
        <Text style={styles.authFooterLink}>{login}</Text>
      </Pressable>
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
  cardTitle: {
    color: "#ffffff",
    fontSize: 17,
    fontWeight: "900",
  },
  cardSub: {
    color: "#a9a9a9",
    fontSize: 11.5,
    lineHeight: 16,
    fontWeight: "700",
    marginTop: 5,
    marginBottom: 13,
  },
  roleList: {
    gap: 10,
  },
  roleCard: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 13,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 11,
    position: "relative",
  },
  roleAmber: {
    borderColor: "#705d2c",
    backgroundColor: "#211a0b",
  },
  roleEmerald: {
    borderColor: "#166534",
    backgroundColor: "#052e16",
  },
  roleSlate: {
    borderColor: "#343434",
    backgroundColor: "#151515",
  },
  roleCardActive: {
    borderColor: "#e6c15c",
  },
  roleBadge: {
    position: "absolute",
    right: 11,
    top: 11,
    borderRadius: 999,
    backgroundColor: "#ffffff",
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  roleBadgeText: {
    color: "#111111",
    fontSize: 8.5,
    fontWeight: "900",
  },
  roleIcon: {
    width: 38,
    height: 38,
    borderRadius: 14,
    backgroundColor: "#e6c15c",
    alignItems: "center",
    justifyContent: "center",
  },
  roleTextBox: {
    flex: 1,
    paddingRight: 82,
  },
  roleTitle: {
    color: "#ffffff",
    fontSize: 13.5,
    fontWeight: "900",
  },
  roleDesc: {
    color: "#d6d6d6",
    fontSize: 11.2,
    lineHeight: 16,
    fontWeight: "700",
    marginTop: 4,
  },
  selectedRoleBox: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#303030",
    backgroundColor: "#050505",
    padding: 12,
    marginBottom: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  smallLabel: {
    color: "#a9a9a9",
    fontSize: 10.5,
    fontWeight: "800",
  },
  selectedRoleText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "900",
    marginTop: 3,
  },
  changeButton: {
    borderRadius: 14,
    backgroundColor: "#e6c15c",
    paddingHorizontal: 10,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  changeButtonText: {
    color: "#111111",
    fontSize: 10.5,
    fontWeight: "900",
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
  policyBox: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#303030",
    backgroundColor: "#050505",
    padding: 12,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginBottom: 13,
  },
  checkbox: {
    width: 19,
    height: 19,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: "#777777",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  checkboxActive: {
    borderColor: "#e6c15c",
    backgroundColor: "#e6c15c",
  },
  policyText: {
    flex: 1,
    color: "#d6d6d6",
    fontSize: 10.8,
    lineHeight: 16,
    fontWeight: "700",
  },
  policyLink: {
    color: "#e6c15c",
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
  googleButton: {
    minHeight: 49,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: "#303030",
    backgroundColor: "#ffffff",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
  },
  googleIcon: {
    color: "#111111",
    fontSize: 16,
    fontWeight: "900",
  },
  googleButtonText: {
    color: "#111111",
    fontSize: 12.5,
    fontWeight: "900",
  },
  secureBox: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#1d4ed8",
    backgroundColor: "#0b1624",
    padding: 12,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 9,
    marginTop: 13,
  },
  secureTextBox: {
    flex: 1,
  },
  secureTitle: {
    color: "#ffffff",
    fontSize: 11.8,
    fontWeight: "900",
  },
  secureText: {
    color: "#bfdbfe",
    fontSize: 10.8,
    lineHeight: 15,
    fontWeight: "700",
    marginTop: 3,
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
