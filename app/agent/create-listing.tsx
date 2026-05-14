import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
    AlertTriangle,
    ArrowLeft,
    ChevronRight,
    Languages,
    PackageCheck,
    ShieldCheck,
} from "lucide-react-native";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Pressable,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import {
    type ListingDraft,
    useListingDraft,
} from "../../components/listing/ListingDraftContext";
import ListingIklan from "../../components/listing/ListingIklan";
import { supabase } from "../../lib/supabase";

type Language = "en" | "id";

type DraftRecord = Record<string, unknown>;

type AgentMembershipRow = {
  id: string;
  user_id: string | null;
  package_id: string | null;
  package_name: string | null;
  billing_cycle: string | null;
  listing_limit: number | null;
  status: string | null;
  expires_at: string | null;
  metadata: Record<string, unknown> | null;
};

type PropertySlotRow = {
  id: string;
  status: string | null;
  source: string | null;
  listing_expires_at: string | null;
  transaction_status: string | null;
};

function toRecord(value: unknown): DraftRecord {
  if (typeof value === "object" && value !== null) {
    return value as DraftRecord;
  }

  return {};
}

function getNumberFromMetadata(
  metadata: Record<string, unknown> | null,
  key: string
) {
  const value = metadata?.[key];

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
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

  const metadata = membership.metadata;

  const fromMetadata =
    getNumberFromMetadata(metadata, "listing_limit") ||
    getNumberFromMetadata(metadata, "listingLimit") ||
    getNumberFromMetadata(metadata, "active_listing_limit") ||
    getNumberFromMetadata(metadata, "activeListingLimit");

  if (Number.isFinite(fromMetadata) && fromMetadata > 0) return fromMetadata;

  return 0;
}

function isListingSlotUsed(row: PropertySlotRow) {
  if (row.transaction_status === "sold") return false;
  if (row.transaction_status === "rented") return false;
  if (row.status === "rejected") return false;

  if (!row.listing_expires_at) return true;

  const expiresAt = new Date(row.listing_expires_at);
  if (Number.isNaN(expiresAt.getTime())) return true;

  return expiresAt.getTime() >= Date.now();
}

function formatDisplayDate(value: string | null | undefined, language: Language) {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat(language === "id" ? "id-ID" : "en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export default function AgentCreateListingScreen() {
  const router = useRouter();
  const { draft, setDraft, clearDraft } = useListingDraft();

  const [language, setLanguage] = useState<Language>("en");
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [accessError, setAccessError] = useState("");
  const [activeMembership, setActiveMembership] =
    useState<AgentMembershipRow | null>(null);
  const [usedSlots, setUsedSlots] = useState(0);

  const isId = language === "id";

  useEffect(() => {
    let ignore = false;

    async function checkAgentAccess() {
      setCheckingAccess(true);
      setAccessError("");

      try {
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (ignore) return;

        if (authError || !user) {
          router.push(
            "/login?role=agent&next=/agent/create-listing" as any
          );
          return;
        }

        const [membershipsRes, propertiesRes] = await Promise.all([
          supabase
            .from("agent_memberships")
            .select(
              "id, user_id, package_id, package_name, billing_cycle, listing_limit, status, expires_at, metadata"
            )
            .eq("user_id", user.id)
            .order("created_at", { ascending: false }),

          supabase
            .from("properties")
            .select("id, status, source, listing_expires_at, transaction_status")
            .eq("user_id", user.id)
            .eq("source", "agent")
            .or("status.is.null,status.neq.rejected"),
        ]);

        if (ignore) return;

        if (membershipsRes.error) {
          setAccessError(membershipsRes.error.message);
          setCheckingAccess(false);
          return;
        }

        if (propertiesRes.error) {
          setAccessError(propertiesRes.error.message);
          setCheckingAccess(false);
          return;
        }

        const membershipRows = (membershipsRes.data ||
          []) as AgentMembershipRow[];
        const propertyRows = (propertiesRes.data || []) as PropertySlotRow[];

        const currentMembership =
          membershipRows.find((membership) => isMembershipActive(membership)) ||
          null;

        const currentUsedSlots = propertyRows.filter(isListingSlotUsed).length;

        setActiveMembership(currentMembership);
        setUsedSlots(currentUsedSlots);
        setCheckingAccess(false);
      } catch (error: any) {
        if (!ignore) {
          setAccessError(
            error?.message ||
              (isId
                ? "Gagal memeriksa paket agen."
                : "Failed to check agent package.")
          );
          setCheckingAccess(false);
        }
      }
    }

    void checkAgentAccess();

    return () => {
      ignore = true;
    };
  }, [router, isId]);

  const listingLimit = useMemo(() => {
    return getMembershipListingLimit(activeMembership);
  }, [activeMembership]);

  const remainingSlots = Math.max(listingLimit - usedSlots, 0);

  const canCreateListing =
    Boolean(activeMembership) && listingLimit > 0 && remainingSlots > 0;

  const listingDraft = useMemo<ListingDraft>(() => {
    return {
      ...toRecord(draft),
      mode: "create",
      source: "agent",
      plan: undefined,
      payment: undefined,
      agentMembership: activeMembership
        ? {
            id: activeMembership.id,
            packageId: activeMembership.package_id,
            packageName: activeMembership.package_name,
            billingCycle: activeMembership.billing_cycle,
            listingLimit,
            usedSlots,
            remainingSlots,
          }
        : undefined,
    } as unknown as ListingDraft;
  }, [draft, activeMembership, listingLimit, usedSlots, remainingSlots]);

  const handleSetDraft = useCallback(
    (updater: (prev: ListingDraft) => ListingDraft) => {
      setDraft((prev) => {
        const previousDraft = {
          ...toRecord(prev),
          mode: "create",
          source: "agent",
          plan: undefined,
          payment: undefined,
        } as unknown as ListingDraft;

        const updatedDraft = updater(previousDraft);

        return {
          ...toRecord(updatedDraft),
          mode: "create",
          source: "agent",
          plan: undefined,
          payment: undefined,
        } as unknown as ListingDraft;
      });
    },
    [setDraft]
  );

  function handleNext() {
    if (!activeMembership) {
      router.push("/agent/packages" as any);
      return;
    }

    if (listingLimit <= 0) {
      router.push("/agent/packages" as any);
      return;
    }

    if (remainingSlots <= 0) {
      router.push("/agent/packages" as any);
      return;
    }

    setDraft((prev) => {
      return {
        ...toRecord(prev),
        mode: "create",
        source: "agent",
        plan: undefined,
        payment: undefined,
        agentMembership: {
          id: activeMembership.id,
          packageId: activeMembership.package_id,
          packageName: activeMembership.package_name,
          billingCycle: activeMembership.billing_cycle,
          listingLimit,
          usedSlots,
          remainingSlots,
        },
      } as unknown as ListingDraft;
    });

    router.push("/agent/listing-details" as any);
  }

  async function handleReset() {
    await clearDraft();
    router.push("/agent/packages" as any);
  }

  function handleBack() {
    router.push("/agent/packages" as any);
  }

  if (checkingAccess) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="light" />

        <View style={styles.loadingBox}>
          <ActivityIndicator color="#e6c15c" />
          <Text style={styles.loadingText}>
            {isId ? "Memeriksa paket agen..." : "Checking agent package..."}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (accessError) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="light" />

        <View style={styles.errorWrap}>
          <View style={styles.errorIcon}>
            <AlertTriangle color="#fecaca" size={28} />
          </View>

          <Text style={styles.errorTitle}>
            {isId ? "Gagal memeriksa akses" : "Failed to check access"}
          </Text>

          <Text style={styles.errorText}>{accessError}</Text>

          <Pressable
            style={styles.errorButton}
            onPress={() => router.push("/agent/packages" as any)}
          >
            <Text style={styles.errorButtonText}>
              {isId ? "Kembali ke Paket Agen" : "Back to Agent Packages"}
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  if (!canCreateListing) {
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
          <View style={styles.blockedCard}>
            <View style={styles.blockedIcon}>
              <PackageCheck color="#e6c15c" size={28} />
            </View>

            <Text style={styles.blockedTitle}>
              {!activeMembership
                ? isId
                  ? "Paket agen belum aktif"
                  : "Agent package is not active"
                : remainingSlots <= 0
                  ? isId
                    ? "Limit listing aktif sudah penuh"
                    : "Active listing limit is full"
                  : isId
                    ? "Paket belum memiliki limit listing"
                    : "Package has no listing limit"}
            </Text>

            <Text style={styles.blockedText}>
              {!activeMembership
                ? isId
                  ? "Silakan pilih dan aktifkan paket agen terlebih dahulu sebelum membuat listing."
                  : "Please choose and activate an agent package before creating a listing."
                : remainingSlots <= 0
                  ? isId
                    ? "Tandai listing lama sebagai sold/rented atau upgrade paket untuk menambah kapasitas listing."
                    : "Mark old listings as sold/rented or upgrade your package to add more listing capacity."
                  : isId
                    ? "Silakan pilih paket agen yang memiliki limit listing aktif."
                    : "Please choose an agent package with active listing capacity."}
            </Text>

            <View style={styles.slotCard}>
              <MiniStat
                label={isId ? "Paket Aktif" : "Active Package"}
                value={activeMembership?.package_name || "-"}
              />
              <MiniStat
                label={isId ? "Limit" : "Limit"}
                value={String(listingLimit || 0)}
              />
              <MiniStat
                label={isId ? "Terpakai" : "Used"}
                value={String(usedSlots || 0)}
              />
              <MiniStat
                label={isId ? "Sisa" : "Remaining"}
                value={String(remainingSlots || 0)}
              />
            </View>

            <Pressable
              style={styles.primaryButton}
              onPress={() => router.push("/agent/packages" as any)}
            >
              <Text style={styles.primaryButtonText}>
                {isId ? "Lihat Paket Agen" : "View Agent Packages"}
              </Text>
              <ChevronRight color="#111111" size={16} />
            </Pressable>
          </View>
        </ScrollView>
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

      <View style={styles.accessCard}>
        <View style={styles.accessIcon}>
          <ShieldCheck color="#60a5fa" size={18} />
        </View>

        <View style={styles.accessTextBox}>
          <Text style={styles.accessTitle}>
            {isId ? "Agent Membership Aktif" : "Active Agent Membership"}
          </Text>
          <Text style={styles.accessSub}>
            {activeMembership?.package_name || activeMembership?.package_id} •{" "}
            {usedSlots}/{listingLimit} {isId ? "listing terpakai" : "used"} •{" "}
            {remainingSlots} {isId ? "sisa" : "remaining"}
          </Text>
          <Text style={styles.accessExpiry}>
            {isId ? "Berlaku sampai" : "Expires"}:{" "}
            {formatDisplayDate(activeMembership?.expires_at, language)}
          </Text>
        </View>
      </View>

      <ListingIklan
        draft={listingDraft}
        setDraft={handleSetDraft as any}
        onNext={handleNext}
        onReset={handleReset}
        language={language}
      />
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
  accessCard: {
    marginHorizontal: 18,
    marginBottom: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#1d4ed8",
    backgroundColor: "#0b1624",
    padding: 12,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  accessIcon: {
    width: 38,
    height: 38,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#1d4ed8",
    backgroundColor: "#06101d",
    alignItems: "center",
    justifyContent: "center",
  },
  accessTextBox: {
    flex: 1,
  },
  accessTitle: {
    color: "#ffffff",
    fontSize: 12.8,
    fontWeight: "900",
  },
  accessSub: {
    color: "#bfdbfe",
    fontSize: 11,
    lineHeight: 15,
    fontWeight: "800",
    marginTop: 3,
  },
  accessExpiry: {
    color: "#93c5fd",
    fontSize: 10.5,
    lineHeight: 14,
    fontWeight: "700",
    marginTop: 2,
  },
  blockedCard: {
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "#303030",
    backgroundColor: "#101010",
    padding: 18,
    marginTop: 10,
  },
  blockedIcon: {
    width: 58,
    height: 58,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#705d2c",
    backgroundColor: "#211a0b",
    alignItems: "center",
    justifyContent: "center",
  },
  blockedTitle: {
    color: "#ffffff",
    fontSize: 24,
    lineHeight: 30,
    fontWeight: "900",
    letterSpacing: -0.6,
    marginTop: 15,
  },
  blockedText: {
    color: "#b8b8b8",
    fontSize: 12.5,
    lineHeight: 19,
    fontWeight: "700",
    marginTop: 8,
  },
  slotCard: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#303030",
    backgroundColor: "#050505",
    padding: 11,
    marginTop: 16,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  miniStat: {
    width: "48%",
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#222222",
    backgroundColor: "#101010",
    padding: 10,
  },
  miniStatLabel: {
    color: "#a9a9a9",
    fontSize: 10.5,
    fontWeight: "800",
  },
  miniStatValue: {
    color: "#ffffff",
    fontSize: 12.5,
    fontWeight: "900",
    marginTop: 4,
  },
  primaryButton: {
    minHeight: 49,
    borderRadius: 17,
    backgroundColor: "#e6c15c",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    paddingHorizontal: 14,
    marginTop: 16,
  },
  primaryButtonText: {
    color: "#111111",
    fontSize: 13,
    fontWeight: "900",
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
  errorWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  errorIcon: {
    width: 62,
    height: 62,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#7f1d1d",
    backgroundColor: "#2a0d0d",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
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