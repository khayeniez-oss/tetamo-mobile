import { FontAwesome5 } from "@expo/vector-icons";
import { makeRedirectUri } from "expo-auth-session";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as WebBrowser from "expo-web-browser";
import {
    ArrowLeft,
    Building2,
    Check,
    ChevronRight,
    Eye,
    EyeOff,
    Home,
    Search,
    ShieldCheck,
    UserRound,
} from "lucide-react-native";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Alert,
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

type SignupRole = "owner" | "agent" | "developer" | "buyer" | "admin" | "unknown";
type OAuthProvider = "google" | "apple";

type RoleCardData = {
  key: SignupRole;
  title: string;
  subtitle: string;
  icon: ReactNode;
  tone: "gold" | "blue" | "purple" | "green";
  badge?: string;
};

const ROUTES = {
  login: "/login",
  ownerPackages: "/owner/packages",
  agentPackages: "/agent/packages",
  developerPackages: "/developer/packages",
  adminDashboard: "/admin",
  search: "/search",
};

const ROLE_CARDS: RoleCardData[] = [
  {
    key: "owner",
    title: "Property Owner",
    subtitle: "For owners who want to list and manage their property on TETAMO.",
    icon: <Home color="#e6c15c" size={23} />,
    tone: "gold",
  },
  {
    key: "agent",
    title: "Property Agent",
    subtitle: "For agents who want packages, listing tools, leads, and dashboard access.",
    icon: <UserRound color="#60a5fa" size={23} />,
    tone: "blue",
  },
  {
    key: "developer",
    title: "Developer",
    subtitle: "For developers or project owners who want a package or license option.",
    icon: <Building2 color="#a78bfa" size={23} />,
    tone: "purple",
    badge: "Package / License",
  },
  {
    key: "buyer",
    title: "Buyer / Renter",
    subtitle: "For users who want to search, save, and contact owners or agents.",
    icon: <Search color="#22c55e" size={23} />,
    tone: "green",
  },
];

export default function SignupScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const roleFromUrl = useMemo(() => normalizeRole(readParam(params.role)), [params.role]);
  const nextFromUrl = normalizeNextPath(readParam(params.next));
  const packageFromUrl = readParam(params.package);
  const planFromUrl = readParam(params.plan);
  const from = readParam(params.from);

  const [selectedRole, setSelectedRole] = useState<SignupRole>(
    roleFromUrl !== "unknown" ? roleFromUrl : "unknown"
  );

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [agreed, setAgreed] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<OAuthProvider | null>(null);

  const currentRole = selectedRole;
  const roleSelected = currentRole !== "unknown";
  const isDeveloper = currentRole === "developer";
  const isBuyer = currentRole === "buyer";
  const selectedRoleLabel = formatRole(currentRole);

  const loginRoute =
    currentRole !== "unknown"
      ? `${ROUTES.login}?role=${currentRole}&next=${encodeURIComponent(
          getNextPath(currentRole, nextFromUrl)
        )}`
      : ROUTES.login;

  const isBusy = loading || socialLoading !== null;

  useEffect(() => {
    if (roleFromUrl !== "unknown") {
      setSelectedRole(roleFromUrl);
    }
  }, [roleFromUrl]);

  const goBackToRoleSelect = () => {
    setSelectedRole("unknown");
    setAgreed(false);
    setSocialLoading(null);
  };

  const continueDeveloper = () => {
    router.push(ROUTES.developerPackages as any);
  };

  const continueBuyer = () => {
    router.push(ROUTES.search as any);
  };

  const handleRolePress = (role: SignupRole) => {
    if (role === "developer") {
      router.push(ROUTES.developerPackages as any);
      return;
    }

    if (role === "buyer") {
      router.push(ROUTES.search as any);
      return;
    }

    setSelectedRole(role);
  };

  const handleEmailSignup = async () => {
    if (!roleSelected) {
      Alert.alert("Choose your role", "Please choose your account type first.");
      return;
    }

    if (isDeveloper) {
      continueDeveloper();
      return;
    }

    if (isBuyer) {
      continueBuyer();
      return;
    }

    if (!agreed) {
      Alert.alert(
        "Policy Agreement Required",
        "Please agree to TETAMO’s Terms, Privacy Policy, and Subscription Policy first."
      );
      return;
    }

    const trimmedName = fullName.trim();
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPassword = password.trim();

    if (!trimmedName || !trimmedEmail || !trimmedPassword) {
      Alert.alert("Missing details", "Please complete your name, email, and password.");
      return;
    }

    if (!isValidEmail(trimmedEmail)) {
      Alert.alert("Invalid email", "Please enter a valid email address.");
      return;
    }

    if (trimmedPassword.length < 6) {
      Alert.alert("Password too short", "Password must be at least 6 characters.");
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email: trimmedEmail,
        password: trimmedPassword,
        options: {
          data: {
            full_name: trimmedName,
            role: currentRole,
            package: packageFromUrl,
            plan: planFromUrl,
            from,
            next: nextFromUrl,
            agreed_to_terms: true,
            agreed_to_policies_at: new Date().toISOString(),
          },
        },
      });

      if (error) {
        Alert.alert("Signup failed", error.message);
        return;
      }

      if (data.user) {
        const profileError = await upsertProfile({
          userId: data.user.id,
          email: trimmedEmail,
          fullName: trimmedName,
          role: currentRole,
        });

        if (profileError) {
          Alert.alert("Profile error", profileError);
          return;
        }
      }

      const nextPath = getNextPath(currentRole, nextFromUrl);

      if (data.session) {
        router.replace(nextPath as any);
        return;
      }

      Alert.alert(
        "Account created",
        "Please log in to continue. If email confirmation is required, check your email first.",
        [
          {
            text: "Continue",
            onPress: () => router.replace(loginRoute as any),
          },
        ]
      );
    } catch (error: any) {
      Alert.alert("Signup failed", error?.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthSignup = async (provider: OAuthProvider) => {
    if (!roleSelected) {
      Alert.alert("Choose your role", "Please choose your account type first.");
      return;
    }

    if (isDeveloper) {
      continueDeveloper();
      return;
    }

    if (isBuyer) {
      continueBuyer();
      return;
    }

    if (!agreed) {
      Alert.alert(
        "Policy Agreement Required",
        "Please agree to TETAMO’s Terms, Privacy Policy, and Subscription Policy first."
      );
      return;
    }

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
        Alert.alert("Signup failed", error.message);
        return;
      }

      if (!data?.url) {
        Alert.alert("Signup failed", "No OAuth URL was returned.");
        return;
      }

      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);

      if (result.type !== "success") {
        return;
      }

      const session = await createSessionFromUrl(result.url);

      if (!session?.user) {
        Alert.alert("Signup failed", "Unable to complete social signup.");
        return;
      }

      const metadata = session.user.user_metadata || {};
      const profileName =
        fullName.trim() ||
        safeString(metadata.full_name) ||
        safeString(metadata.name) ||
        safeString(metadata.display_name) ||
        "Tetamo User";

      const profileEmail =
        safeString(session.user.email) ||
        safeString(metadata.email) ||
        email.trim().toLowerCase();

      const profileError = await upsertProfile({
        userId: session.user.id,
        email: profileEmail,
        fullName: profileName,
        role: currentRole,
      });

      if (profileError) {
        Alert.alert("Profile error", profileError);
        return;
      }

      router.replace(getNextPath(currentRole, nextFromUrl) as any);
    } catch (error: any) {
      Alert.alert("Signup failed", error?.message || "Unable to complete social signup.");
    } finally {
      setLoading(false);
      setSocialLoading(null);
    }
  };

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
            <Text style={styles.kicker}>TETAMO SIGNUP</Text>
            <Text style={styles.title}>Create Your TETAMO Account</Text>
            <Text style={styles.subtitle}>
              Choose your role and continue to the right TETAMO flow for owners,
              agents, developers, or buyers.
            </Text>
          </View>

          {!roleSelected ? (
            <>
              <View style={styles.roleHeader}>
                <Text style={styles.sectionTitle}>Choose your role</Text>
                <Text style={styles.sectionSub}>
                  This helps TETAMO guide you to the correct package and next step.
                </Text>
              </View>

              <View style={styles.roleGrid}>
                {ROLE_CARDS.map((role) => (
                  <RoleCard
                    key={role.key}
                    role={role}
                    active={selectedRole === role.key}
                    onPress={() => handleRolePress(role.key)}
                  />
                ))}
              </View>

              <Pressable
                style={styles.loginButton}
                onPress={() => router.push(ROUTES.login as any)}
              >
                <Text style={styles.loginButtonText}>I already have an account</Text>
              </Pressable>
            </>
          ) : (
            <>
              <View style={styles.selectedPanel}>
                <View>
                  <Text style={styles.panelKicker}>SELECTED ROLE</Text>
                  <Text style={styles.selectedRoleText}>{selectedRoleLabel}</Text>
                </View>

                <Pressable style={styles.changeButton} onPress={goBackToRoleSelect}>
                  <ArrowLeft color="#ffffff" size={14} />
                  <Text style={styles.changeButtonText}>Change</Text>
                </Pressable>
              </View>

              {isDeveloper ? (
                <DeveloperRedirectPanel onContinue={continueDeveloper} />
              ) : isBuyer ? (
                <BuyerRedirectPanel onContinue={continueBuyer} />
              ) : (
                <>
                  <View style={styles.formPanel}>
                    <PolicyAgreement checked={agreed} onPress={() => setAgreed(!agreed)} />

                    <OAuthButton
                      provider="google"
                      label="Sign up with Google"
                      loadingLabel="Connecting to Google..."
                      loading={socialLoading === "google"}
                      disabled={isBusy || !agreed}
                      onPress={() => void handleOAuthSignup("google")}
                    />

                    <OAuthButton
                      provider="apple"
                      label="Sign up with Apple"
                      loadingLabel="Connecting to Apple..."
                      loading={socialLoading === "apple"}
                      disabled={isBusy || !agreed}
                      onPress={() => void handleOAuthSignup("apple")}
                    />

                    <View style={styles.dividerRow}>
                      <View style={styles.dividerLine} />
                      <Text style={styles.dividerText}>OR</Text>
                      <View style={styles.dividerLine} />
                    </View>

                    <FormInput
                      label="Full Name"
                      placeholder="Enter your full name"
                      value={fullName}
                      onChangeText={setFullName}
                      autoCapitalize="words"
                    />

                    <FormInput
                      label="Email"
                      placeholder="Enter your email"
                      value={email}
                      onChangeText={setEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />

                    <View>
                      <Text style={styles.inputLabel}>Password</Text>

                      <View style={styles.passwordWrap}>
                        <TextInput
                          value={password}
                          onChangeText={setPassword}
                          placeholder="Create a password"
                          placeholderTextColor="#777777"
                          secureTextEntry={!showPassword}
                          style={styles.passwordInput}
                          autoCapitalize="none"
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

                    <Pressable
                      style={[
                        styles.primaryButton,
                        (!agreed || loading) && styles.primaryButtonDisabled,
                      ]}
                      disabled={!agreed || loading}
                      onPress={handleEmailSignup}
                    >
                      {loading && !socialLoading ? (
                        <ActivityIndicator color="#111111" />
                      ) : (
                        <>
                          <Text style={styles.primaryButtonText}>Sign Up</Text>
                          <ChevronRight color="#111111" size={17} />
                        </>
                      )}
                    </Pressable>

                    <Pressable
                      style={styles.loginButton}
                      onPress={() => router.push(loginRoute as any)}
                    >
                      <Text style={styles.loginButtonText}>I already have an account</Text>
                    </Pressable>
                  </View>

                  <View style={styles.nextPanel}>
                    <View style={styles.nextIcon}>
                      <ShieldCheck color="#e6c15c" size={21} />
                    </View>

                    <View style={styles.nextTextBox}>
                      <Text style={styles.nextTitle}>After signup</Text>
                      <Text style={styles.nextText}>
                        {currentRole === "owner"
                          ? "Owner accounts continue to owner packages before creating a listing."
                          : "Agent accounts continue to agent packages and dashboard access."}
                      </Text>
                    </View>
                  </View>
                </>
              )}
            </>
          )}
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
      style={[styles.oauthButton, disabled && styles.oauthButtonDisabled]}
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

      <Text style={styles.oauthButtonText}>{loading ? loadingLabel : label}</Text>
    </Pressable>
  );
}

function RoleCard({
  role,
  active,
  onPress,
}: {
  role: RoleCardData;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={[
        styles.roleCard,
        active && styles.roleCardActive,
        role.tone === "green" && styles.roleCardGreen,
        role.tone === "purple" && styles.roleCardPurple,
        role.tone === "blue" && styles.roleCardBlue,
      ]}
      onPress={onPress}
    >
      {role.badge ? (
        <View style={styles.roleBadge}>
          <Text style={styles.roleBadgeText}>{role.badge}</Text>
        </View>
      ) : null}

      <View style={[styles.roleIcon, active && styles.roleIconActive]}>
        {role.icon}
      </View>

      <View style={styles.roleTextBox}>
        <Text style={styles.roleTitle}>{role.title}</Text>
        <Text style={styles.roleSubtitle}>{role.subtitle}</Text>
      </View>

      <View style={[styles.roleDot, active && styles.roleDotActive]}>
        {active ? <Check color="#111111" size={11} /> : null}
      </View>
    </Pressable>
  );
}

function FormInput({
  label,
  placeholder,
  value,
  onChangeText,
  keyboardType,
  autoCapitalize,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (value: string) => void;
  keyboardType?: "default" | "email-address";
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
}) {
  return (
    <View>
      <Text style={styles.inputLabel}>{label}</Text>

      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#777777"
        keyboardType={keyboardType || "default"}
        autoCapitalize={autoCapitalize || "sentences"}
        style={styles.input}
      />
    </View>
  );
}

function PolicyAgreement({
  checked,
  onPress,
}: {
  checked: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.policyBox} onPress={onPress}>
      <View style={[styles.checkbox, checked && styles.checkboxActive]}>
        {checked ? <Check color="#111111" size={13} /> : null}
      </View>

      <Text style={styles.policyText}>
        I agree to TETAMO’s Terms & Conditions, Privacy Policy, and Subscription
        Policy.
      </Text>
    </Pressable>
  );
}

function DeveloperRedirectPanel({ onContinue }: { onContinue: () => void }) {
  return (
    <View style={styles.redirectPanel}>
      <View style={styles.redirectIcon}>
        <Building2 color="#a78bfa" size={28} />
      </View>

      <Text style={styles.redirectTitle}>Developer Package / License</Text>
      <Text style={styles.redirectText}>
        Developer accounts use a separate package or license flow. Continue to
        developer onboarding to request the right option for your project.
      </Text>

      <Pressable style={styles.primaryButton} onPress={onContinue}>
        <Text style={styles.primaryButtonText}>Continue to Developer Package</Text>
        <ChevronRight color="#111111" size={17} />
      </Pressable>
    </View>
  );
}

function BuyerRedirectPanel({ onContinue }: { onContinue: () => void }) {
  return (
    <View style={styles.redirectPanel}>
      <View style={styles.redirectIcon}>
        <Search color="#22c55e" size={28} />
      </View>

      <Text style={styles.redirectTitle}>Search Properties</Text>
      <Text style={styles.redirectText}>
        Buyer and renter accounts can search, save, and contact owners or agents.
        Listing is available for owners, agents, and developers.
      </Text>

      <Pressable style={styles.primaryButton} onPress={onContinue}>
        <Text style={styles.primaryButtonText}>Search Properties</Text>
        <ChevronRight color="#111111" size={17} />
      </Pressable>
    </View>
  );
}

function readParam(value: unknown) {
  if (Array.isArray(value)) return String(value[0] || "");
  return String(value || "");
}

function safeString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeRole(value: unknown): SignupRole {
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

function formatRole(role: SignupRole) {
  if (role === "owner") return "Property Owner";
  if (role === "agent") return "Property Agent";
  if (role === "developer") return "Developer";
  if (role === "buyer") return "Buyer / Renter";
  if (role === "admin") return "Admin";
  return "Choose Role";
}

function normalizeNextPath(value: string) {
  const raw = String(value || "").trim();

  if (!raw) return "";
  if (raw.startsWith("http://") || raw.startsWith("https://")) return "";
  if (raw.startsWith("//")) return "";
  if (raw.startsWith("/")) return raw;

  return `/${raw}`;
}

function getNextPath(role: SignupRole, nextFromUrl: string) {
  if (nextFromUrl) return nextFromUrl;

  if (role === "owner") return ROUTES.ownerPackages;
  if (role === "agent") return ROUTES.agentPackages;
  if (role === "developer") return ROUTES.developerPackages;
  if (role === "buyer") return ROUTES.search;
  if (role === "admin") return ROUTES.adminDashboard;

  return ROUTES.search;
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function extractAuthTokensFromUrl(url: string) {
  const queryString = url.includes("?") ? url.split("?")[1]?.split("#")[0] : "";
  const hashString = url.includes("#") ? url.split("#")[1] : "";

  const queryParams = new URLSearchParams(queryString || "");
  const hashParams = new URLSearchParams(hashString || "");

  const accessToken =
    queryParams.get("access_token") || hashParams.get("access_token") || "";
  const refreshToken =
    queryParams.get("refresh_token") || hashParams.get("refresh_token") || "";
  const error =
    queryParams.get("error_description") ||
    hashParams.get("error_description") ||
    queryParams.get("error") ||
    hashParams.get("error") ||
    "";

  return {
    accessToken,
    refreshToken,
    error,
  };
}

async function createSessionFromUrl(url: string) {
  const { accessToken, refreshToken, error } = extractAuthTokensFromUrl(url);

  if (error) {
    throw new Error(error);
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

async function upsertProfile({
  userId,
  email,
  fullName,
  role,
}: {
  userId: string;
  email: string;
  fullName: string;
  role: SignupRole;
}) {
  const { error } = await supabase.from("profiles").upsert(
    {
      id: userId,
      email,
      full_name: fullName,
      role,
    },
    {
      onConflict: "id",
    }
  );

  return error?.message || "";
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
    fontSize: 30,
    lineHeight: 36,
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
  roleHeader: {
    marginBottom: 11,
  },
  sectionTitle: {
    color: "#ffffff",
    fontSize: 19,
    fontWeight: "900",
  },
  sectionSub: {
    color: "#a7a7a7",
    fontSize: 11.5,
    fontWeight: "700",
    marginTop: 3,
  },
  roleGrid: {
    gap: 10,
    marginBottom: 16,
  },
  roleCard: {
    position: "relative",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#2d2d2d",
    backgroundColor: "#101010",
    padding: 13,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
  },
  roleCardActive: {
    borderColor: "#e6c15c",
    backgroundColor: "#161309",
  },
  roleCardGreen: {
    borderColor: "#1d3b2b",
  },
  roleCardPurple: {
    borderColor: "#34234a",
  },
  roleCardBlue: {
    borderColor: "#20334f",
  },
  roleBadge: {
    position: "absolute",
    right: 11,
    top: 9,
    borderRadius: 999,
    backgroundColor: "#e6c15c",
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  roleBadgeText: {
    color: "#111111",
    fontSize: 8.5,
    fontWeight: "900",
  },
  roleIcon: {
    width: 45,
    height: 45,
    borderRadius: 17,
    backgroundColor: "#1a1a1a",
    borderWidth: 1,
    borderColor: "#303030",
    alignItems: "center",
    justifyContent: "center",
  },
  roleIconActive: {
    borderColor: "#705d2c",
    backgroundColor: "#211a0b",
  },
  roleTextBox: {
    flex: 1,
    paddingRight: 12,
  },
  roleTitle: {
    color: "#ffffff",
    fontSize: 13.5,
    fontWeight: "900",
  },
  roleSubtitle: {
    color: "#a9a9a9",
    fontSize: 11,
    lineHeight: 15,
    fontWeight: "700",
    marginTop: 3,
  },
  roleDot: {
    width: 18,
    height: 18,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#4a4a4a",
    alignItems: "center",
    justifyContent: "center",
  },
  roleDotActive: {
    borderColor: "#e6c15c",
    backgroundColor: "#e6c15c",
  },
  selectedPanel: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#303030",
    backgroundColor: "#101010",
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 14,
  },
  panelKicker: {
    color: "#e6c15c",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.8,
  },
  selectedRoleText: {
    color: "#ffffff",
    fontSize: 17,
    fontWeight: "900",
    marginTop: 3,
  },
  changeButton: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#3a3a3a",
    backgroundColor: "#050505",
    paddingHorizontal: 10,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  changeButtonText: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "900",
  },
  formPanel: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#303030",
    backgroundColor: "#101010",
    padding: 15,
    gap: 13,
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
  policyBox: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#303030",
    backgroundColor: "#050505",
    padding: 12,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: "#5a5a5a",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  checkboxActive: {
    borderColor: "#e6c15c",
    backgroundColor: "#e6c15c",
  },
  policyText: {
    color: "#b8b8b8",
    fontSize: 11,
    lineHeight: 17,
    fontWeight: "700",
    flex: 1,
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
  oauthButtonDisabled: {
    opacity: 0.5,
  },
  oauthButtonText: {
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
  primaryButtonDisabled: {
    opacity: 0.5,
  },
  primaryButtonText: {
    color: "#111111",
    fontSize: 13,
    fontWeight: "900",
  },
  loginButton: {
    minHeight: 45,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: "#343434",
    backgroundColor: "#050505",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
  },
  loginButtonText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "900",
  },
  nextPanel: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#705d2c",
    backgroundColor: "#211a0b",
    padding: 14,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 11,
    marginTop: 14,
  },
  nextIcon: {
    width: 42,
    height: 42,
    borderRadius: 15,
    backgroundColor: "#151106",
    borderWidth: 1,
    borderColor: "#705d2c",
    alignItems: "center",
    justifyContent: "center",
  },
  nextTextBox: {
    flex: 1,
  },
  nextTitle: {
    color: "#ffffff",
    fontSize: 13.5,
    fontWeight: "900",
  },
  nextText: {
    color: "#d6d6d6",
    fontSize: 11,
    lineHeight: 16,
    fontWeight: "700",
    marginTop: 4,
  },
  redirectPanel: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#303030",
    backgroundColor: "#101010",
    padding: 17,
    alignItems: "center",
  },
  redirectIcon: {
    width: 58,
    height: 58,
    borderRadius: 22,
    backgroundColor: "#171717",
    borderWidth: 1,
    borderColor: "#303030",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  redirectTitle: {
    color: "#ffffff",
    fontSize: 21,
    fontWeight: "900",
    textAlign: "center",
  },
  redirectText: {
    color: "#b8b8b8",
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "700",
    textAlign: "center",
    marginTop: 7,
    marginBottom: 15,
  },
});