import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
  ArrowLeft,
  CalendarDays,
  Check,
  ChevronRight,
  Crown,
  Languages,
  PackageCheck,
  ShieldCheck,
  Sparkles,
} from "lucide-react-native";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { supabase } from "../../lib/supabase";
import { AGENT_PACKAGES, type AgentPackage } from "../../services/pricelist";

type Language = "en" | "id";
type BillingCycle = "monthly" | "yearly";

type ProfileRow = {
  id: string;
  role: string | null;
  full_name: string | null;
  email: string | null;
};

type AgentMembershipRow = {
  id: string;
  user_id: string | null;
  payment_id: string | null;
  package_id: string | null;
  package_name: string | null;
  billing_cycle: string | null;
  listing_limit: number | null;
  status: string | null;
  auto_renew: boolean | null;
  starts_at: string | null;
  expires_at: string | null;
  metadata: Record<string, any> | null;
  created_at: string | null;
  updated_at: string | null;
};

function formatIdr(value: number) {
  return `Rp ${Number(value || 0).toLocaleString("id-ID")}`;
}

function formatDate(value: string | null | undefined, language: Language) {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat(language === "id" ? "id-ID" : "en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function isMembershipActive(membership: AgentMembershipRow | null) {
  if (!membership) return false;
  if (membership.status !== "active") return false;

  if (!membership.expires_at) return true;

  const expiresAt = new Date(membership.expires_at);
  if (Number.isNaN(expiresAt.getTime())) return true;

  return expiresAt.getTime() >= Date.now();
}

function getMembershipListingLimit(membership: AgentMembershipRow | null) {
  if (!membership) return 0;

  const direct = Number(membership.listing_limit || 0);
  if (Number.isFinite(direct) && direct > 0) return direct;

  const metadata = membership.metadata || {};

  const fromMetadata =
    Number(metadata.listing_limit || 0) ||
    Number(metadata.listingLimit || 0) ||
    Number(metadata.active_listing_limit || 0) ||
    Number(metadata.activeListingLimit || 0);

  if (Number.isFinite(fromMetadata) && fromMetadata > 0) return fromMetadata;

  return 0;
}

function isContactPackage(pkg: AgentPackage) {
  const name = String(pkg.name || "").toLowerCase();
  const billingCycle = String(pkg.billingCycle || "").toLowerCase();

  return (
    Number(pkg.priceIdr || 0) <= 0 ||
    name.includes("platinum") ||
    name.includes("custom") ||
    name.includes("contact") ||
    billingCycle.includes("contact")
  );
}

function getAvailableBillingCycles(pkg: AgentPackage): BillingCycle[] {
  if (isContactPackage(pkg)) return [];

  const cycles = new Set<BillingCycle>();

  pkg.availableBillingCycles?.forEach((cycle) => cycles.add(cycle));

  if (pkg.billingCycle === "monthly") cycles.add("monthly");
  if (pkg.billingCycle === "yearly") cycles.add("yearly");

  if (pkg.monthlyPriceIdr && pkg.monthlyPriceIdr > 0) cycles.add("monthly");
  if (pkg.priceIdr && pkg.priceIdr > 0) {
    cycles.add(pkg.billingCycle === "monthly" ? "monthly" : "yearly");
  }

  if (cycles.size === 0) cycles.add("yearly");

  return Array.from(cycles);
}

function getDefaultBillingCycle(pkg: AgentPackage | null): BillingCycle {
  if (!pkg) return "yearly";

  const cycles = getAvailableBillingCycles(pkg);

  if (pkg.billingCycle === "monthly" && cycles.includes("monthly")) {
    return "monthly";
  }

  if (cycles.includes("yearly")) return "yearly";
  return cycles[0] || "yearly";
}

function getCyclePrice(pkg: AgentPackage, cycle: BillingCycle) {
  if (cycle === "monthly") {
    if (pkg.monthlyPriceIdr && pkg.monthlyPriceIdr > 0) {
      return pkg.monthlyPriceIdr;
    }

    if (pkg.billingCycle === "monthly") {
      return pkg.priceIdr;
    }

    return Math.ceil(Number(pkg.priceIdr || 0) / 12);
  }

  return Number(pkg.priceIdr || 0);
}

function getBillingCycleLabel(cycle: string | null | undefined, language: Language) {
  const value = String(cycle || "").toLowerCase();

  if (language === "id") {
    if (value === "monthly") return "Bulanan";
    if (value === "yearly") return "Tahunan";
    return "-";
  }

  if (value === "monthly") return "Monthly";
  if (value === "yearly") return "Yearly";
  return "-";
}

function getRecommendedPackageId(packages: AgentPackage[]) {
  const proPackage = packages.find((pkg) =>
    String(pkg.id || "").toLowerCase().includes("agent-pro")
  );

  if (proPackage) return proPackage.id;

  const goldPackage = packages.find((pkg) =>
    String(pkg.name || "").toLowerCase().includes("gold")
  );

  return goldPackage?.id || packages[0]?.id || "";
}

function getPackageIntro(pkg: AgentPackage, language: Language) {
  const name = String(pkg.name || "").toLowerCase();

  if (language === "id") {
    if (name.includes("silver")) {
      return "Untuk agen yang ingin mulai tampil profesional dengan paket tahunan ringan.";
    }

    if (name.includes("gold")) {
      return "Untuk agen aktif yang ingin kapasitas listing lebih besar dan branding lebih kuat.";
    }

    if (name.includes("pro")) {
      return "Untuk agen serius dan agensi yang ingin skala lebih besar dengan opsi bayar bulanan.";
    }

    return "Pilih paket agen yang sesuai dengan kebutuhan bisnis Anda.";
  }

  if (name.includes("silver")) {
    return "For agents who want to start professionally with a simple yearly package.";
  }

  if (name.includes("gold")) {
    return "For active agents who want larger listing capacity and stronger branding.";
  }

  if (name.includes("pro")) {
    return "For serious agents and agencies that want to scale with a monthly option.";
  }

  return "Choose the package that best fits your business needs.";
}

export default function AgentPackagesScreen() {
  const router = useRouter();
  const isIOS = Platform.OS === "ios";

  const [language, setLanguage] = useState<Language>("en");
  const [loadingPage, setLoadingPage] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [memberships, setMemberships] = useState<AgentMembershipRow[]>([]);

  const sortedPackages = useMemo(() => {
    return [...AGENT_PACKAGES].sort((a, b) => {
      const aContact = isContactPackage(a);
      const bContact = isContactPackage(b);

      if (aContact && !bContact) return 1;
      if (!aContact && bContact) return -1;

      return Number(a.maxListings || 0) - Number(b.maxListings || 0);
    });
  }, []);

  const recommendedPackageId = useMemo(() => {
    return getRecommendedPackageId(sortedPackages);
  }, [sortedPackages]);

  const [selectedPackageId, setSelectedPackageId] = useState(
    recommendedPackageId || sortedPackages[0]?.id || ""
  );

  const selectedPackage =
    sortedPackages.find((pkg) => pkg.id === selectedPackageId) || null;

  const [selectedBillingCycle, setSelectedBillingCycle] =
    useState<BillingCycle>(() => getDefaultBillingCycle(selectedPackage));

  const activeMembership = useMemo(() => {
    return memberships.find((membership) => isMembershipActive(membership)) || null;
  }, [memberships]);

  const activeListingLimit = useMemo(() => {
    return getMembershipListingLimit(activeMembership);
  }, [activeMembership]);

  const selectedPackageIsContact = selectedPackage
    ? isContactPackage(selectedPackage)
    : false;

  const selectedAvailableBillingCycles = selectedPackage
    ? getAvailableBillingCycles(selectedPackage)
    : [];

  const selectedPrice =
    selectedPackage && !selectedPackageIsContact
      ? getCyclePrice(selectedPackage, selectedBillingCycle)
      : 0;

  const selectedPackageIsCurrent =
    Boolean(activeMembership?.package_id) &&
    Boolean(selectedPackage?.id) &&
    activeMembership?.package_id === selectedPackage?.id;

  const isId = language === "id";

  useEffect(() => {
    if (!isIOS) return;

    router.replace("/search" as any);
  }, [isIOS, router]);

  useEffect(() => {
    if (!selectedPackage) return;

    const available = getAvailableBillingCycles(selectedPackage);

    if (available.length > 0 && !available.includes(selectedBillingCycle)) {
      setSelectedBillingCycle(getDefaultBillingCycle(selectedPackage));
    }
  }, [selectedPackage, selectedBillingCycle]);

  useEffect(() => {
    if (isIOS) {
      setLoadingPage(false);
      return;
    }

    let ignore = false;

    async function loadUserAndMembership() {
      setLoadingPage(true);
      setErrorMessage("");

      try {
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (ignore) return;

        if (authError || !user) {
          setErrorMessage(
            isId ? "Silakan login terlebih dahulu." : "Please log in first."
          );
          setLoadingPage(false);
          return;
        }

        const [profileRes, membershipRes] = await Promise.all([
          supabase
            .from("profiles")
            .select("id, role, full_name, email")
            .eq("id", user.id)
            .maybeSingle(),

          supabase
            .from("agent_memberships")
            .select(
              "id, user_id, payment_id, package_id, package_name, billing_cycle, listing_limit, status, auto_renew, starts_at, expires_at, metadata, created_at, updated_at"
            )
            .eq("user_id", user.id)
            .order("created_at", { ascending: false }),
        ]);

        if (ignore) return;

        if (profileRes.error) {
          setErrorMessage(
            profileRes.error.message ||
              (isId ? "Gagal memuat profil." : "Failed to load profile.")
          );
          setLoadingPage(false);
          return;
        }

        if (membershipRes.error) {
          setErrorMessage(
            membershipRes.error.message ||
              (isId ? "Gagal memuat membership." : "Failed to load membership.")
          );
          setLoadingPage(false);
          return;
        }

        const profileRow = (profileRes.data as ProfileRow) || null;
        const membershipRows = (membershipRes.data || []) as AgentMembershipRow[];

        setProfile(profileRow);
        setMemberships(membershipRows);

        const currentActive =
          membershipRows.find((membership) => isMembershipActive(membership)) ||
          null;

        if (currentActive?.package_id) {
          const matchingPackage = sortedPackages.find(
            (pkg) => pkg.id === currentActive.package_id
          );

          if (matchingPackage) {
            setSelectedPackageId(matchingPackage.id);
            setSelectedBillingCycle(getDefaultBillingCycle(matchingPackage));
          }
        } else {
          setSelectedPackageId(recommendedPackageId || sortedPackages[0]?.id || "");
        }

        setLoadingPage(false);
      } catch (error: any) {
        if (!ignore) {
          setErrorMessage(
            error?.message ||
              (isId ? "Gagal memuat halaman." : "Failed to load page.")
          );
          setLoadingPage(false);
        }
      }
    }

    void loadUserAndMembership();

    return () => {
      ignore = true;
    };
  }, [isId, recommendedPackageId, sortedPackages, isIOS]);

  function handleBack() {
    router.back();
  }

  async function handleContinue() {
    if (!selectedPackage || submitting) return;

    if (selectedPackageIsContact) {
      const subject = encodeURIComponent(
        `Tetamo Agent ${selectedPackage.name} Inquiry`
      );
      const body = encodeURIComponent(
        `Hello Tetamo,\n\nI am interested in the ${
          selectedPackage.name
        } agent package.\n\nName: ${profile?.full_name || ""}\nEmail: ${
          profile?.email || ""
        }\n\nPlease send me more details.`
      );

      await Linking.openURL(
        `mailto:inquiry@tetamo.com?subject=${subject}&body=${body}`
      );
      return;
    }

    try {
      setSubmitting(true);

      if (selectedPackageIsCurrent && activeMembership) {
        router.push("/agent/create-listing" as any);
        return;
      }

      router.push(
        `/agent/payment?package=${encodeURIComponent(
          selectedPackage.id
        )}&billing=${encodeURIComponent(
          selectedBillingCycle
        )}&flow=agent-membership` as any
      );
    } catch (error: any) {
      Alert.alert(
        error?.message ||
          (isId
            ? "Gagal melanjutkan. Silakan coba lagi."
            : "Failed to continue. Please try again.")
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (isIOS) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="light" />

        <View style={styles.iosRedirectBox}>
          <ActivityIndicator color="#e6c15c" />

          <Text style={styles.iosRedirectTitle}>
            {isId ? "Membuka Pencarian" : "Opening Search"}
          </Text>

          <Text style={styles.iosRedirectText}>
            {isId
              ? "Anda akan diarahkan ke pencarian properti."
              : "Redirecting you to property search."}
          </Text>

          <Pressable
            style={styles.iosSearchButton}
            onPress={() => router.replace("/search" as any)}
          >
            <Text style={styles.iosSearchButtonText}>
              {isId ? "Cari Properti" : "Search Properties"}
            </Text>
            <ChevronRight color="#111111" size={17} />
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  if (loadingPage) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="light" />
        <View style={styles.loadingBox}>
          <ActivityIndicator color="#e6c15c" />
          <Text style={styles.loadingText}>
            {isId ? "Memuat paket agen..." : "Loading agent packages..."}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (errorMessage) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="light" />
        <View style={styles.errorBox}>
          <Text style={styles.errorTitle}>
            {isId ? "Tidak bisa membuka paket" : "Cannot open packages"}
          </Text>
          <Text style={styles.errorText}>{errorMessage}</Text>

          <Pressable
            style={styles.errorButton}
            onPress={() => router.push("/login?role=agent" as any)}
          >
            <Text style={styles.errorButtonText}>
              {isId ? "Login sebagai Agent" : "Log in as Agent"}
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />

      <View style={styles.topBar}>
        <Pressable style={styles.backButton} onPress={handleBack}>
          <ArrowLeft color="#ffffff" size={16} />
          <Text style={styles.backText}>{isId ? "Kembali" : "Back"}</Text>
        </Pressable>

        <View style={styles.langToggle}>
          <Languages color="#e6c15c" size={14} />

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
      >
        <View style={styles.heroCard}>
          <View style={styles.heroBadge}>
            <Sparkles color="#e6c15c" size={14} />
            <Text style={styles.heroBadgeText}>
              {isId ? "PAKET AGEN TETAMO" : "TETAMO AGENT PACKAGES"}
            </Text>
          </View>

          <Text style={styles.title}>
            {isId ? "Pilih paket agen Anda" : "Choose your agent package"}
          </Text>

          <Text style={styles.subtitle}>
            {isId
              ? "Paket agen digunakan untuk mengelola listing aktif, leads, jadwal viewing, billing, insights, dan fitur marketing Tetamo."
              : "Agent packages let you manage active listings, leads, viewing schedules, billing, insights, and Tetamo marketing features."}
          </Text>
        </View>

        {activeMembership ? (
          <View style={styles.activeCard}>
            <View style={styles.activeTop}>
              <View style={styles.activeIcon}>
                <ShieldCheck color="#60a5fa" size={20} />
              </View>

              <View style={styles.activeTextBox}>
                <Text style={styles.activeTitle}>
                  {isId ? "Membership Aktif" : "Active Membership"}
                </Text>
                <Text style={styles.activeSub}>
                  {activeMembership.package_name || activeMembership.package_id}{" "}
                  •{" "}
                  {getBillingCycleLabel(
                    activeMembership.billing_cycle,
                    language
                  )}
                </Text>
              </View>
            </View>

            <View style={styles.activeGrid}>
              <MiniStat
                label={isId ? "Limit Listing" : "Listing Limit"}
                value={String(activeListingLimit || "-")}
              />
              <MiniStat
                label={isId ? "Berlaku sampai" : "Expires"}
                value={formatDate(activeMembership.expires_at, language)}
              />
            </View>

            <Pressable
              style={styles.createButton}
              onPress={() => router.push("/agent/create-listing" as any)}
            >
              <Text style={styles.createButtonText}>
                {isId ? "Buat Listing Agent" : "Create Agent Listing"}
              </Text>
              <ChevronRight color="#111111" size={16} />
            </Pressable>
          </View>
        ) : null}

        <View style={styles.packageList}>
          {sortedPackages.map((pkg) => {
            const selected = selectedPackageId === pkg.id;
            const recommended = recommendedPackageId === pkg.id;
            const current = activeMembership?.package_id === pkg.id;
            const cycles = getAvailableBillingCycles(pkg);
            const price = getCyclePrice(
              pkg,
              selected ? selectedBillingCycle : getDefaultBillingCycle(pkg)
            );
            const packageName = isId ? pkg.name : pkg.nameEn || pkg.name;
            const features = isId ? pkg.features : pkg.featuresEn || pkg.features;

            return (
              <Pressable
                key={pkg.id}
                style={[
                  styles.packageCard,
                  selected && styles.packageCardSelected,
                ]}
                onPress={() => {
                  setSelectedPackageId(pkg.id);
                  setSelectedBillingCycle(getDefaultBillingCycle(pkg));
                }}
              >
                <View style={styles.packageHeader}>
                  <View style={styles.packageIcon}>
                    {recommended ? (
                      <Crown color="#e6c15c" size={22} />
                    ) : (
                      <PackageCheck color="#e6c15c" size={22} />
                    )}
                  </View>

                  <View style={styles.packageHeaderText}>
                    <View style={styles.packageTitleRow}>
                      <Text style={styles.packageName}>{packageName}</Text>

                      {recommended ? (
                        <View style={styles.recommendedPill}>
                          <Text style={styles.recommendedText}>
                            {isId ? "REKOMENDASI" : "RECOMMENDED"}
                          </Text>
                        </View>
                      ) : null}

                      {current ? (
                        <View style={styles.currentPill}>
                          <Text style={styles.currentText}>
                            {isId ? "AKTIF" : "ACTIVE"}
                          </Text>
                        </View>
                      ) : null}
                    </View>

                    <Text style={styles.packageIntro}>
                      {getPackageIntro(pkg, language)}
                    </Text>
                  </View>
                </View>

                <View style={styles.priceRow}>
                  <View>
                    <Text style={styles.priceText}>{formatIdr(price)}</Text>
                    <Text style={styles.priceSub}>
                      {selected && selectedBillingCycle === "monthly"
                        ? isId
                          ? "/ bulan"
                          : "/ month"
                        : isId
                          ? "/ tahun"
                          : "/ year"}
                    </Text>
                  </View>

                  <View style={styles.listingLimitBox}>
                    <Text style={styles.listingLimitNumber}>
                      {pkg.maxListings}
                    </Text>
                    <Text style={styles.listingLimitText}>
                      {isId ? "Listing Aktif" : "Active Listings"}
                    </Text>
                  </View>
                </View>

                {selected && cycles.length > 1 ? (
                  <View style={styles.billingRow}>
                    {cycles.map((cycle) => (
                      <Pressable
                        key={cycle}
                        style={[
                          styles.billingButton,
                          selectedBillingCycle === cycle &&
                            styles.billingButtonActive,
                        ]}
                        onPress={() => setSelectedBillingCycle(cycle)}
                      >
                        <Text
                          style={[
                            styles.billingButtonText,
                            selectedBillingCycle === cycle &&
                              styles.billingButtonTextActive,
                          ]}
                        >
                          {getBillingCycleLabel(cycle, language)}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                ) : null}

                {selected &&
                selectedBillingCycle === "monthly" &&
                pkg.monthlyBillingNote ? (
                  <View style={styles.noteBox}>
                    <CalendarDays color="#e6c15c" size={15} />
                    <Text style={styles.noteText}>
                      {isId
                        ? pkg.monthlyBillingNote
                        : pkg.monthlyBillingNoteEn || pkg.monthlyBillingNote}
                    </Text>
                  </View>
                ) : null}

                <View style={styles.featuresBox}>
                  {features.slice(0, selected ? 12 : 5).map((feature, index) => (
                    <View key={`${pkg.id}-${feature}-${index}`} style={styles.featureRow}>
                      <Check color="#22c55e" size={14} />
                      <Text style={styles.featureText}>{feature}</Text>
                    </View>
                  ))}
                </View>
              </Pressable>
            );
          })}
        </View>

        {selectedPackage ? (
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>
              {isId ? "Ringkasan Paket" : "Package Summary"}
            </Text>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>
                {isId ? "Paket" : "Package"}
              </Text>
              <Text style={styles.summaryValue}>
                {isId
                  ? selectedPackage.name
                  : selectedPackage.nameEn || selectedPackage.name}
              </Text>
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>
                {isId ? "Tagihan" : "Billing"}
              </Text>
              <Text style={styles.summaryValue}>
                {getBillingCycleLabel(selectedBillingCycle, language)}
              </Text>
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>
                {isId ? "Limit Listing" : "Listing Limit"}
              </Text>
              <Text style={styles.summaryValue}>
                {selectedPackage.maxListings}{" "}
                {isId ? "listing aktif" : "active listings"}
              </Text>
            </View>

            <View style={styles.totalBox}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>{formatIdr(selectedPrice)}</Text>
            </View>

            <Pressable
              style={[styles.continueButton, submitting && styles.disabled]}
              disabled={submitting}
              onPress={handleContinue}
            >
              {submitting ? <ActivityIndicator color="#111111" /> : null}

              <Text style={styles.continueText}>
                {selectedPackageIsCurrent && activeMembership
                  ? isId
                    ? "Buat Listing Sekarang"
                    : "Create Listing Now"
                  : isId
                    ? "Lanjut ke Pembayaran"
                    : "Continue to Payment"}
              </Text>

              <ChevronRight color="#111111" size={16} />
            </Pressable>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.miniStat}>
      <Text style={styles.miniStatLabel}>{label}</Text>
      <Text style={styles.miniStatValue}>{value}</Text>
    </View>
  );
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
    paddingBottom: 38,
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
  iosSearchButton: {
    minHeight: 48,
    borderRadius: 17,
    backgroundColor: "#e6c15c",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingHorizontal: 16,
    marginTop: 4,
  },
  iosSearchButtonText: {
    color: "#111111",
    fontSize: 13,
    fontWeight: "900",
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
    alignItems: "center",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#5b4a24",
    overflow: "hidden",
    paddingLeft: 8,
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
  heroCard: {
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "#303030",
    backgroundColor: "#101010",
    padding: 18,
    marginTop: 10,
    marginBottom: 13,
  },
  heroBadge: {
    alignSelf: "flex-start",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#705d2c",
    backgroundColor: "#211a0b",
    paddingHorizontal: 10,
    paddingVertical: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  heroBadgeText: {
    color: "#e6c15c",
    fontSize: 9.5,
    fontWeight: "900",
    letterSpacing: 1,
  },
  title: {
    color: "#ffffff",
    fontSize: 27,
    lineHeight: 33,
    fontWeight: "900",
    letterSpacing: -0.6,
    marginTop: 13,
  },
  subtitle: {
    color: "#b8b8b8",
    fontSize: 12.3,
    lineHeight: 18,
    fontWeight: "700",
    marginTop: 7,
  },
  activeCard: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#1d4ed8",
    backgroundColor: "#0b1624",
    padding: 14,
    marginBottom: 13,
  },
  activeTop: {
    flexDirection: "row",
    gap: 10,
    alignItems: "flex-start",
  },
  activeIcon: {
    width: 42,
    height: 42,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#1d4ed8",
    backgroundColor: "#07111f",
    alignItems: "center",
    justifyContent: "center",
  },
  activeTextBox: {
    flex: 1,
  },
  activeTitle: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "900",
  },
  activeSub: {
    color: "#bfdbfe",
    fontSize: 11.5,
    lineHeight: 16,
    fontWeight: "700",
    marginTop: 3,
  },
  activeGrid: {
    flexDirection: "row",
    gap: 9,
    marginTop: 13,
  },
  miniStat: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#1d4ed8",
    backgroundColor: "#06101d",
    padding: 10,
  },
  miniStatLabel: {
    color: "#93c5fd",
    fontSize: 10.5,
    fontWeight: "800",
  },
  miniStatValue: {
    color: "#ffffff",
    fontSize: 12.5,
    fontWeight: "900",
    marginTop: 4,
  },
  createButton: {
    minHeight: 46,
    borderRadius: 16,
    backgroundColor: "#e6c15c",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    marginTop: 13,
  },
  createButtonText: {
    color: "#111111",
    fontSize: 12.5,
    fontWeight: "900",
  },
  packageList: {
    gap: 13,
  },
  packageCard: {
    borderRadius: 26,
    borderWidth: 1,
    borderColor: "#303030",
    backgroundColor: "#101010",
    padding: 15,
  },
  packageCardSelected: {
    borderColor: "#e6c15c",
  },
  packageHeader: {
    flexDirection: "row",
    gap: 11,
    alignItems: "flex-start",
  },
  packageIcon: {
    width: 44,
    height: 44,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#705d2c",
    backgroundColor: "#211a0b",
    alignItems: "center",
    justifyContent: "center",
  },
  packageHeaderText: {
    flex: 1,
  },
  packageTitleRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 7,
  },
  packageName: {
    color: "#ffffff",
    fontSize: 17,
    fontWeight: "900",
  },
  recommendedPill: {
    borderRadius: 999,
    backgroundColor: "#e6c15c",
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  recommendedText: {
    color: "#111111",
    fontSize: 8.5,
    fontWeight: "900",
    letterSpacing: 0.6,
  },
  currentPill: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#22c55e",
    backgroundColor: "#052e16",
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  currentText: {
    color: "#bbf7d0",
    fontSize: 8.5,
    fontWeight: "900",
    letterSpacing: 0.6,
  },
  packageIntro: {
    color: "#a9a9a9",
    fontSize: 11.5,
    lineHeight: 16,
    fontWeight: "700",
    marginTop: 6,
  },
  priceRow: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#303030",
    backgroundColor: "#050505",
    padding: 13,
    marginTop: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  priceText: {
    color: "#e6c15c",
    fontSize: 18,
    fontWeight: "900",
  },
  priceSub: {
    color: "#a9a9a9",
    fontSize: 11,
    fontWeight: "800",
    marginTop: 2,
  },
  listingLimitBox: {
    alignItems: "flex-end",
  },
  listingLimitNumber: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "900",
  },
  listingLimitText: {
    color: "#a9a9a9",
    fontSize: 10.5,
    fontWeight: "800",
    marginTop: 2,
  },
  billingRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
  },
  billingButton: {
    flex: 1,
    minHeight: 40,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#303030",
    backgroundColor: "#050505",
    alignItems: "center",
    justifyContent: "center",
  },
  billingButtonActive: {
    borderColor: "#e6c15c",
    backgroundColor: "#e6c15c",
  },
  billingButtonText: {
    color: "#ffffff",
    fontSize: 11.5,
    fontWeight: "900",
  },
  billingButtonTextActive: {
    color: "#111111",
  },
  noteBox: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#705d2c",
    backgroundColor: "#211a0b",
    padding: 11,
    marginTop: 12,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  noteText: {
    color: "#d6d6d6",
    fontSize: 10.8,
    lineHeight: 15,
    fontWeight: "700",
    flex: 1,
  },
  featuresBox: {
    gap: 8,
    marginTop: 13,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 7,
  },
  featureText: {
    color: "#d6d6d6",
    fontSize: 11.5,
    lineHeight: 16,
    fontWeight: "700",
    flex: 1,
  },
  summaryCard: {
    borderRadius: 26,
    borderWidth: 1,
    borderColor: "#303030",
    backgroundColor: "#101010",
    padding: 15,
    marginTop: 14,
  },
  summaryTitle: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "900",
    marginBottom: 12,
  },
  summaryRow: {
    borderBottomWidth: 1,
    borderBottomColor: "#202020",
    paddingVertical: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  summaryLabel: {
    color: "#a9a9a9",
    fontSize: 11.5,
    fontWeight: "800",
  },
  summaryValue: {
    color: "#ffffff",
    fontSize: 11.5,
    fontWeight: "900",
    flex: 1,
    textAlign: "right",
  },
  totalBox: {
    borderRadius: 18,
    backgroundColor: "#050505",
    borderWidth: 1,
    borderColor: "#303030",
    padding: 13,
    marginTop: 13,
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  totalLabel: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "900",
  },
  totalValue: {
    color: "#e6c15c",
    fontSize: 13,
    fontWeight: "900",
  },
  continueButton: {
    minHeight: 49,
    borderRadius: 17,
    backgroundColor: "#e6c15c",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    paddingHorizontal: 14,
    marginTop: 14,
  },
  continueText: {
    color: "#111111",
    fontSize: 13,
    fontWeight: "900",
  },
  disabled: {
    opacity: 0.55,
  },
  loadingBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    padding: 24,
  },
  loadingText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "800",
  },
  errorBox: {
    flex: 1,
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  errorTitle: {
    color: "#ffffff",
    fontSize: 22,
    lineHeight: 28,
    fontWeight: "900",
    textAlign: "center",
  },
  errorText: {
    color: "#fecaca",
    fontSize: 12.5,
    lineHeight: 19,
    fontWeight: "700",
    textAlign: "center",
    marginTop: 8,
  },
  errorButton: {
    minHeight: 46,
    borderRadius: 16,
    backgroundColor: "#e6c15c",
    paddingHorizontal: 16,
    marginTop: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  errorButtonText: {
    color: "#111111",
    fontSize: 12.5,
    fontWeight: "900",
  },
});