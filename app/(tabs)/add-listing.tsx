import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
  Building2,
  ChevronRight,
  Home,
  Search,
  ShieldCheck,
  UserRound,
} from "lucide-react-native";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { supabase } from "../../lib/supabase";

type ListingRole = "owner" | "agent" | "developer" | "buyer" | "unknown";

type RoleCardData = {
  key: ListingRole;
  title: string;
  subtitle: string;
  flow: string[];
  icon: ReactNode;
  disabled?: boolean;
};

const ROUTES = {
  login: "/login",
  signup: "/signup",
  completeProfile: "/complete-profile",
  ownerPackages: "/owner/packages",
  agentPackages: "/agent/packages",
  developerPackages: "/developer/packages",
  search: "/search",
};

const ROLE_CARDS: RoleCardData[] = [
  {
    key: "owner",
    title: "Property Owner",
    subtitle: "List your own property directly with TETAMO.",
    icon: <Home color="#e6c15c" size={23} />,
    flow: ["Sign up as owner", "Choose owner package", "Create property listing"],
  },
  {
    key: "agent",
    title: "Property Agent",
    subtitle: "Use agent packages and manage listings from your dashboard.",
    icon: <UserRound color="#60a5fa" size={23} />,
    flow: ["Sign up as agent", "Choose agent packet", "Open agent dashboard"],
  },
  {
    key: "developer",
    title: "Developer",
    subtitle: "Showcase projects, new developments, and license options.",
    icon: <Building2 color="#a78bfa" size={23} />,
    flow: ["Developer account", "Package / license", "Project showcase"],
  },
  {
    key: "buyer",
    title: "Buyer / Renter",
    subtitle: "Search, save, and contact property owners or agents.",
    icon: <Search color="#22c55e" size={23} />,
    flow: ["Search properties", "Save favorites", "Contact owner / agent"],
    disabled: true,
  },
];

export default function AddListingScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const isIOS = Platform.OS === "ios";

  const roleFromUrl = useMemo(() => {
    return normalizeRole(readParam(params.audience) || readParam(params.role));
  }, [params.audience, params.role]);

  const [selectedRole, setSelectedRole] = useState<ListingRole>(
    roleFromUrl && roleFromUrl !== "unknown" ? roleFromUrl : "owner"
  );

  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState("");
  const [profileRole, setProfileRole] = useState<ListingRole>("unknown");
  const [profileName, setProfileName] = useState("");

  const isLoggedIn = Boolean(userId);
  const realRoleKnown =
    profileRole === "owner" ||
    profileRole === "agent" ||
    profileRole === "developer" ||
    profileRole === "buyer";

  useEffect(() => {
    if (Platform.OS === "ios") {
      router.replace(ROUTES.search as any);
    }
  }, [router]);

  useEffect(() => {
    if (roleFromUrl && roleFromUrl !== "unknown" && roleFromUrl !== "buyer") {
      setSelectedRole(roleFromUrl);
    }
  }, [roleFromUrl]);

  useEffect(() => {
    if (isIOS) return;

    let mounted = true;

    async function loadSession() {
      try {
        setLoading(true);

        const { data } = await supabase.auth.getSession();
        const sessionUserId = data.session?.user?.id || "";

        if (!mounted) return;

        setUserId(sessionUserId);

        if (sessionUserId) {
          await loadProfile(sessionUserId, mounted);
        } else {
          setProfileRole("unknown");
          setProfileName("");
        }
      } catch (error) {
        console.log("Tetamo add listing session error:", error);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadSession();

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        const nextUserId = session?.user?.id || "";

        setUserId(nextUserId);

        if (nextUserId) {
          await loadProfile(nextUserId, true);
        } else {
          setProfileRole("unknown");
          setProfileName("");
        }
      }
    );

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, [isIOS]);

  async function loadProfile(profileUserId: string, mounted: boolean) {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("full_name, role")
        .eq("id", profileUserId)
        .maybeSingle();

      if (error) {
        console.log("Tetamo add listing profile error:", error.message);
      }

      if (!mounted) return;

      const nextRole = normalizeRole(data?.role);
      setProfileRole(nextRole);
      setProfileName(cleanString(data?.full_name));

      if (nextRole !== "unknown" && nextRole !== "buyer") {
        setSelectedRole(nextRole);
      }
    } catch (error) {
      console.log("Tetamo add listing profile load error:", error);
    }
  }

  const selectedCard =
    ROLE_CARDS.find((card) => card.key === selectedRole) || ROLE_CARDS[0];

  const continueLoggedIn = () => {
    if (profileRole === "owner") {
      router.push(ROUTES.ownerPackages as any);
      return;
    }

    if (profileRole === "agent") {
      router.push(ROUTES.agentPackages as any);
      return;
    }

    if (profileRole === "developer") {
      router.push(ROUTES.developerPackages as any);
      return;
    }

    if (profileRole === "buyer") {
      router.push(ROUTES.search as any);
      return;
    }

    router.push(`${ROUTES.completeProfile}?role=${selectedRole}` as any);
  };

  const continueToSignup = () => {
    if (selectedRole === "buyer") {
      router.push(ROUTES.search as any);
      return;
    }

    router.push(`${ROUTES.signup}?role=${selectedRole}` as any);
  };

  const continueToLogin = () => {
    router.push(`${ROUTES.login}?next=add-listing&role=${selectedRole}` as any);
  };

  if (isIOS) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="light" />

        <View style={styles.iosRedirectBox}>
          <ActivityIndicator color="#e6c15c" />

          <Text style={styles.iosRedirectTitle}>Opening Search</Text>
          <Text style={styles.iosRedirectText}>
            Redirecting you to property search.
          </Text>

          <Pressable
            style={styles.primaryButton}
            onPress={() => router.replace(ROUTES.search as any)}
          >
            <Text style={styles.primaryButtonText}>Search Properties</Text>
            <ChevronRight color="#111111" size={17} />
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.kicker}>TETAMO LISTING</Text>
          <Text style={styles.title}>Add a Listing</Text>
          <Text style={styles.subtitle}>
            Are you listing as an owner, agent, or developer? Choose your role
            and we’ll guide you to the right package and next step.
          </Text>
        </View>

        <View style={styles.flowPanel}>
          <View style={styles.flowIcon}>
            <ShieldCheck color="#e6c15c" size={23} />
          </View>

          <View style={styles.flowTextBox}>
            <Text style={styles.flowTitle}>Choose Your Listing Type</Text>
            <Text style={styles.flowText}>
              Owner, agent, and developer accounts have different packages and
              listing steps. Select your role to continue.
            </Text>
          </View>
        </View>

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator color="#e6c15c" />
            <Text style={styles.loadingText}>Checking your account...</Text>
          </View>
        ) : isLoggedIn ? (
          <View style={styles.accountPanel}>
            <Text style={styles.panelKicker}>SIGNED IN</Text>

            <Text style={styles.accountTitle}>
              {profileName ? `Hi, ${profileName}` : "You are signed in"}
            </Text>

            <Text style={styles.accountSub}>
              {realRoleKnown
                ? `Your account type: ${formatRole(profileRole)}`
                : "Choose your account type to continue."}
            </Text>

            {realRoleKnown ? (
              <View style={styles.detectedRoleCard}>
                <View style={styles.detectedIcon}>{getRoleIcon(profileRole)}</View>

                <View style={styles.detectedTextBox}>
                  <Text style={styles.detectedTitle}>
                    {formatRole(profileRole)}
                  </Text>
                  <Text style={styles.detectedSub}>
                    {getLoggedInDestinationText(profileRole)}
                  </Text>
                </View>
              </View>
            ) : (
              <RoleGrid selectedRole={selectedRole} onSelect={setSelectedRole} />
            )}

            <Pressable style={styles.primaryButton} onPress={continueLoggedIn}>
              <Text style={styles.primaryButtonText}>
                {profileRole === "buyer"
                  ? "Browse Properties"
                  : realRoleKnown
                    ? "Continue"
                    : "Complete Profile"}
              </Text>
              <ChevronRight color="#111111" size={17} />
            </Pressable>
          </View>
        ) : (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Choose your role</Text>
              <Text style={styles.sectionSub}>
                Select how you want to use TETAMO.
              </Text>
            </View>

            <RoleGrid selectedRole={selectedRole} onSelect={setSelectedRole} />

            <View style={styles.nextPanel}>
              <Text style={styles.panelKicker}>NEXT STEP</Text>

              <Text style={styles.nextTitle}>{selectedCard.title}</Text>
              <Text style={styles.nextSub}>{selectedCard.subtitle}</Text>

              <View style={styles.stepList}>
                {selectedCard.flow.map((step, index) => (
                  <View key={step} style={styles.stepRow}>
                    <View style={styles.stepNumber}>
                      <Text style={styles.stepNumberText}>{index + 1}</Text>
                    </View>
                    <Text style={styles.stepText}>{step}</Text>
                  </View>
                ))}
              </View>

              <Pressable
                style={[
                  styles.primaryButton,
                  selectedRole === "buyer" && styles.searchButton,
                ]}
                onPress={continueToSignup}
              >
                <Text style={styles.primaryButtonText}>
                  {selectedRole === "buyer"
                    ? "Search Properties"
                    : "Continue to Sign Up"}
                </Text>
                <ChevronRight color="#111111" size={17} />
              </Pressable>

              <Pressable style={styles.secondaryButton} onPress={continueToLogin}>
                <Text style={styles.secondaryButtonText}>
                  I already have an account
                </Text>
              </Pressable>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function RoleGrid({
  selectedRole,
  onSelect,
}: {
  selectedRole: ListingRole;
  onSelect: (role: ListingRole) => void;
}) {
  return (
    <View style={styles.roleGrid}>
      {ROLE_CARDS.map((card) => {
        const active = selectedRole === card.key;

        return (
          <Pressable
            key={card.key}
            style={[
              styles.roleCard,
              active && styles.roleCardActive,
              card.disabled && styles.roleCardMuted,
            ]}
            onPress={() => onSelect(card.key)}
          >
            <View style={[styles.roleIcon, active && styles.roleIconActive]}>
              {card.icon}
            </View>

            <View style={styles.roleTextBox}>
              <Text style={styles.roleTitle}>{card.title}</Text>
              <Text style={styles.roleSubtitle}>{card.subtitle}</Text>
            </View>

            <View
              style={[styles.roleSelectDot, active && styles.roleSelectDotActive]}
            />
          </Pressable>
        );
      })}
    </View>
  );
}

function readParam(value: unknown) {
  if (Array.isArray(value)) return String(value[0] || "");
  return String(value || "");
}

function cleanString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeRole(value: unknown): ListingRole {
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

  return "unknown";
}

function formatRole(role: ListingRole) {
  if (role === "owner") return "Property Owner";
  if (role === "agent") return "Property Agent";
  if (role === "developer") return "Developer";
  if (role === "buyer") return "Buyer / Renter";
  return "Unknown";
}

function getLoggedInDestinationText(role: ListingRole) {
  if (role === "owner") return "Continue to owner package before creating a listing.";
  if (role === "agent") return "Continue to agent packet and dashboard.";
  if (role === "developer") return "Continue to developer package / license.";
  if (role === "buyer") return "Buyer / renter accounts can search and save properties.";
  return "Complete your profile first.";
}

function getRoleIcon(role: ListingRole) {
  if (role === "owner") return <Home color="#e6c15c" size={23} />;
  if (role === "agent") return <UserRound color="#60a5fa" size={23} />;
  if (role === "developer") return <Building2 color="#a78bfa" size={23} />;
  if (role === "buyer") return <Search color="#22c55e" size={23} />;

  return <ShieldCheck color="#e6c15c" size={23} />;
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#050505",
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
  iosRedirectBox: {
    flex: 1,
    backgroundColor: "#050505",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
    gap: 12,
  },
  iosRedirectTitle: {
    color: "#ffffff",
    fontSize: 22,
    fontWeight: "900",
    marginTop: 6,
  },
  iosRedirectText: {
    color: "#b8b8b8",
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 6,
  },
  header: {
    marginBottom: 18,
  },
  kicker: {
    color: "#e6c15c",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  title: {
    color: "#ffffff",
    fontSize: 30,
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
  flowPanel: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#705d2c",
    backgroundColor: "#211a0b",
    padding: 14,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 18,
  },
  flowIcon: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: "#151106",
    borderWidth: 1,
    borderColor: "#705d2c",
    alignItems: "center",
    justifyContent: "center",
  },
  flowTextBox: {
    flex: 1,
  },
  flowTitle: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "900",
  },
  flowText: {
    color: "#d6d6d6",
    fontSize: 11.2,
    lineHeight: 16,
    fontWeight: "700",
    marginTop: 4,
  },
  loadingBox: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#303030",
    backgroundColor: "#101010",
    padding: 24,
    alignItems: "center",
    gap: 10,
  },
  loadingText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "800",
  },
  sectionHeader: {
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
    marginBottom: 18,
  },
  roleCard: {
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
  roleCardMuted: {
    opacity: 0.88,
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
  roleSelectDot: {
    width: 16,
    height: 16,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#4a4a4a",
  },
  roleSelectDotActive: {
    borderColor: "#e6c15c",
    backgroundColor: "#e6c15c",
  },
  nextPanel: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#303030",
    backgroundColor: "#101010",
    padding: 15,
  },
  panelKicker: {
    color: "#e6c15c",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  nextTitle: {
    color: "#ffffff",
    fontSize: 20,
    fontWeight: "900",
    marginTop: 5,
  },
  nextSub: {
    color: "#b5b5b5",
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "700",
    marginTop: 5,
  },
  stepList: {
    gap: 9,
    marginTop: 14,
    marginBottom: 15,
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 999,
    backgroundColor: "#e6c15c",
    alignItems: "center",
    justifyContent: "center",
  },
  stepNumberText: {
    color: "#111111",
    fontSize: 10,
    fontWeight: "900",
  },
  stepText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "800",
    flex: 1,
  },
  accountPanel: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#303030",
    backgroundColor: "#101010",
    padding: 15,
  },
  accountTitle: {
    color: "#ffffff",
    fontSize: 22,
    fontWeight: "900",
    marginTop: 5,
  },
  accountSub: {
    color: "#b5b5b5",
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "700",
    marginTop: 5,
  },
  detectedRoleCard: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#3a3a3a",
    backgroundColor: "#050505",
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    marginTop: 14,
    marginBottom: 14,
  },
  detectedIcon: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: "#171717",
    alignItems: "center",
    justifyContent: "center",
  },
  detectedTextBox: {
    flex: 1,
  },
  detectedTitle: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "900",
  },
  detectedSub: {
    color: "#a7a7a7",
    fontSize: 11,
    lineHeight: 15,
    fontWeight: "700",
    marginTop: 3,
  },
  primaryButton: {
    minHeight: 48,
    borderRadius: 17,
    backgroundColor: "#e6c15c",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingHorizontal: 14,
  },
  searchButton: {
    backgroundColor: "#ffffff",
  },
  primaryButtonText: {
    color: "#111111",
    fontSize: 13,
    fontWeight: "900",
  },
  secondaryButton: {
    minHeight: 45,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: "#343434",
    backgroundColor: "#050505",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
  },
  secondaryButtonText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "900",
  },
});