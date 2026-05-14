import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
    AlertTriangle,
    ArrowLeft,
    ChevronRight,
    ImagePlus,
    Languages,
    PackageCheck,
    ShieldCheck,
} from "lucide-react-native";
import { useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Alert,
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
import ListingFoto from "../../components/listing/ListingFoto";
import { supabase } from "../../lib/supabase";

type Language = "en" | "id";

type AgentMembershipRow = {
  id: string;
  user_id: string | null;
  package_id: string | null;
  package_name: string | null;
  billing_cycle: string | null;
  listing_limit: number | null;
  status: string | null;
  expires_at: string | null;
  metadata: Record<string, any> | null;
  created_at: string | null;
};

type PropertySlotRow = {
  id: string;
  status: string | null;
  source: string | null;
  listing_expires_at: string | null;
  transaction_status: string | null;
};

type AgentAccessResult = {
  user: any | null;
  activeMembership: AgentMembershipRow | null;
  usedSlots: number;
  listingLimit: number;
  remainingSlots: number;
  canCreateListing: boolean;
  authFailed: boolean;
};

function cleanText(value: any) {
  const text = String(value ?? "").trim();
  return text.length ? text : null;
}

function cleanNumber(value: any) {
  if (value === null || value === undefined) return null;

  const raw = String(value).replace(/[^\d]/g, "");
  if (!raw) return null;

  const parsed = Number(raw);
  return Number.isNaN(parsed) ? null : parsed;
}

function cleanDecimal(value: any) {
  if (value === null || value === undefined) return null;

  const raw = String(value).replace(/[^\d.]/g, "");
  if (!raw) return null;

  const parsed = Number(raw);
  return Number.isNaN(parsed) ? null : parsed;
}

function generateListingKode() {
  const year = new Date().getFullYear();
  const random = Math.floor(100000 + Math.random() * 900000);
  return `TTM-${year}-${random}`;
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

  const fromMetadata =
    Number(membership.metadata?.listing_limit || 0) ||
    Number(membership.metadata?.listingLimit || 0) ||
    Number(membership.metadata?.active_listing_limit || 0) ||
    Number(membership.metadata?.activeListingLimit || 0);

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

async function getAgentAccess(): Promise<AgentAccessResult> {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      user: null,
      activeMembership: null,
      usedSlots: 0,
      listingLimit: 0,
      remainingSlots: 0,
      canCreateListing: false,
      authFailed: true,
    };
  }

  const [membershipsRes, propertiesRes] = await Promise.all([
    supabase
      .from("agent_memberships")
      .select(
        "id, user_id, package_id, package_name, billing_cycle, listing_limit, status, expires_at, metadata, created_at"
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

  if (membershipsRes.error) throw membershipsRes.error;
  if (propertiesRes.error) throw propertiesRes.error;

  const membershipRows = (membershipsRes.data || []) as AgentMembershipRow[];
  const propertyRows = (propertiesRes.data || []) as PropertySlotRow[];

  const activeMembership =
    membershipRows.find((membership) => isMembershipActive(membership)) || null;

  const usedSlots = propertyRows.filter(isListingSlotUsed).length;
  const listingLimit = getMembershipListingLimit(activeMembership);
  const remainingSlots = Math.max(listingLimit - usedSlots, 0);

  return {
    user,
    activeMembership,
    usedSlots,
    listingLimit,
    remainingSlots,
    canCreateListing:
      Boolean(activeMembership) && listingLimit > 0 && remainingSlots > 0,
    authFailed: false,
  };
}

export default function AgentListingMediaScreen() {
  const router = useRouter();
  const { draft, setDraft, clearDraft } = useListingDraft();

  const [language, setLanguage] = useState<Language>("en");
  const [saving, setSaving] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [accessError, setAccessError] = useState("");
  const [activeMembership, setActiveMembership] =
    useState<AgentMembershipRow | null>(null);
  const [usedSlots, setUsedSlots] = useState(0);
  const [listingLimit, setListingLimit] = useState(0);
  const [remainingSlots, setRemainingSlots] = useState(0);

  const isId = language === "id";

  useEffect(() => {
    setDraft((prev) => ({
      ...(prev || {}),
      mode: "create",
      source: "agent",
      plan: undefined,
      payment: undefined,
    }));
  }, [setDraft]);

  useEffect(() => {
    let ignore = false;

    async function checkAccess() {
      setCheckingAccess(true);
      setAccessError("");

      try {
        const access = await getAgentAccess();

        if (ignore) return;

        if (access.authFailed) {
          router.push(
            "/login?role=agent&next=/agent/listing-media" as any
          );
          return;
        }

        setActiveMembership(access.activeMembership);
        setUsedSlots(access.usedSlots);
        setListingLimit(access.listingLimit);
        setRemainingSlots(access.remainingSlots);
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

    void checkAccess();

    return () => {
      ignore = true;
    };
  }, [router, isId]);

  const canCreateListing =
    Boolean(activeMembership) && listingLimit > 0 && remainingSlots > 0;

  const listingDraft = useMemo(() => {
    return {
      ...(draft || {}),
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

  function handleBack() {
    router.push("/agent/listing-details" as any);
  }

  async function handleSubmit() {
    if (saving) return;

    try {
      setSaving(true);

      const access = await getAgentAccess();

      if (access.authFailed || !access.user) {
        Alert.alert(isId ? "Silakan login terlebih dahulu." : "Please log in first.");
        router.push(
          "/login?role=agent&next=/agent/listing-media" as any
        );
        return;
      }

      if (!access.activeMembership) {
        Alert.alert(
          isId
            ? "Paket agen belum aktif. Silakan pilih paket terlebih dahulu."
            : "Agent package is not active. Please choose a package first."
        );
        router.push("/agent/packages" as any);
        return;
      }

      if (access.listingLimit <= 0) {
        Alert.alert(
          isId
            ? "Paket Anda belum memiliki limit listing aktif."
            : "Your package does not have an active listing limit."
        );
        router.push("/agent/packages" as any);
        return;
      }

      if (access.remainingSlots <= 0) {
        Alert.alert(
          isId
            ? "Limit listing aktif Anda sudah penuh. Tandai listing sebagai sold/rented atau upgrade paket untuk menambah listing."
            : "Your active listing limit is full. Mark listings as sold/rented or upgrade your package."
        );
        router.push("/agent/packages" as any);
        return;
      }

      const user = access.user;
      const draftAny = draft as any;

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("full_name, phone, agency, role")
        .eq("id", user.id)
        .maybeSingle();

      if (profileError) throw profileError;

      const kode = draftAny?.kode || generateListingKode();

      const photos = Array.isArray(draftAny?.photos)
        ? draftAny.photos.filter(Boolean)
        : [];

      const coverIndex =
        typeof draftAny?.coverIndex === "number" ? draftAny.coverIndex : 0;

      const coverImageUrl = photos[coverIndex] || photos[0] || null;

      const insertPayload: Record<string, any> = {
        user_id: user.id,
        created_by_user_id: user.id,

        source: "agent",

        status: "pending_approval",
        verification_status: "pending_verification",
        verified_ok: false,

        kode,
        posted_date: new Date().toISOString(),

        listing_type: cleanText(draftAny?.listingType),
        rental_type: cleanText(draftAny?.rentalType),
        property_type: cleanText(draftAny?.propertyType),
        market_type: cleanText(draftAny?.marketType),

        sale_type: cleanText(draftAny?.saleType),
        lease_years: cleanNumber(draftAny?.leaseYears),
        lease_until_year: cleanNumber(draftAny?.leaseUntilYear),
        lease_extendable: cleanText(draftAny?.leaseExtendable),

        title: cleanText(draftAny?.title),
        title_id: cleanText(draftAny?.title_id || draftAny?.titleId),

        description: cleanText(draftAny?.description),
        description_id: cleanText(
          draftAny?.description_id || draftAny?.descriptionId
        ),

        price: cleanNumber(draftAny?.price),

        country: "Indonesia",
        address: cleanText(draftAny?.address),
        province: cleanText(draftAny?.province),
        city: cleanText(draftAny?.city),
        area:
          cleanText(draftAny?.customHousing) ||
          cleanText(draftAny?.housingName) ||
          cleanText(draftAny?.city),

        housing_name: cleanText(draftAny?.housingName),
        custom_housing: cleanText(draftAny?.customHousing),
        location_note: cleanText(draftAny?.note),

        land_size: cleanDecimal(draftAny?.lt),
        building_size: cleanDecimal(draftAny?.lb),
        bedrooms: cleanNumber(draftAny?.bed),
        bathrooms: cleanNumber(draftAny?.bath),
        maid_room: cleanNumber(draftAny?.maid),
        garage: cleanNumber(draftAny?.garage),
        floor: cleanDecimal(draftAny?.floor),

        land_unit: cleanText(draftAny?.landUnit) || (draftAny?.lt ? "m2" : null),
        unit_floor: cleanText(draftAny?.unitFloor),
        tower_block: cleanText(draftAny?.towerBlock),
        ceiling_height: cleanDecimal(draftAny?.ceilingHeight),
        road_access: cleanText(draftAny?.roadAccess),
        frontage: cleanDecimal(draftAny?.frontage),
        depth: cleanDecimal(draftAny?.depth),
        dimension_text: cleanText(draftAny?.dimensionText),

        furnishing: cleanText(draftAny?.furnishing),
        electricity: cleanNumber(draftAny?.listrik),
        water_type: cleanText(draftAny?.jenisAir),

        certificate: cleanText(draftAny?.sertifikat),
        land_type: cleanText(draftAny?.jenisTanah),
        zoning_type: cleanText(draftAny?.jenisZoning),
        ownership_type: cleanText(draftAny?.jenisKepemilikan),

        facilities: draftAny?.fasilitas ?? {},
        nearby: draftAny?.nearby ?? {},

        video_url: cleanText(draftAny?.video),
        cover_image_url: coverImageUrl,

        transaction_status: "available",
        is_paused: false,
        boost_active: false,
        spotlight_active: false,
        listing_expires_at: access.activeMembership?.expires_at || null,

        contact_user_id: user.id,
        contact_name:
          cleanText(profile?.full_name) ||
          cleanText(user.user_metadata?.full_name) ||
          cleanText(
            typeof user.email === "string" ? user.email.split("@")[0] : null
          ),
        contact_phone: cleanText(profile?.phone),
        contact_role: "agent",
        contact_agency: cleanText(profile?.agency),

        ai_generated_once: Boolean(draftAny?.aiGeneratedOnce),
        ai_seo_title: cleanText(draftAny?.ai_seo_title),
        ai_seo_meta_description: cleanText(
          draftAny?.ai_seo_meta_description
        ),
        ai_social_caption: cleanText(draftAny?.ai_social_caption),
        ai_whatsapp_inquiry_message: cleanText(
          draftAny?.ai_whatsapp_inquiry_message
        ),
      };

      const { data: insertedProperty, error: insertError } = await supabase
        .from("properties")
        .insert(insertPayload)
        .select("id, kode")
        .single();

      if (insertError) throw insertError;

      if (!insertedProperty?.id) {
        throw new Error(
          isId
            ? "Listing berhasil dibuat tetapi ID tidak ditemukan."
            : "Listing was created but ID was not returned."
        );
      }

      if (photos.length > 0) {
        const imageRows = photos.map((url: string, index: number) => ({
          property_id: insertedProperty.id,
          image_url: url,
          sort_order: index,
          is_cover: index === coverIndex,
        }));

        const { error: imageInsertError } = await supabase
          .from("property_images")
          .insert(imageRows);

        if (imageInsertError) throw imageInsertError;
      }

      await clearDraft();

      router.replace(
        `/agent/listing-success?type=submitted-for-approval&kode=${encodeURIComponent(
          insertedProperty.kode || kode
        )}` as any
      );
    } catch (error: any) {
      console.log("Tetamo mobile agent create listing error:", error);
      Alert.alert(
        error?.message ||
          (isId ? "Gagal membuat listing." : "Failed to create listing.")
      );
    } finally {
      setSaving(false);
    }
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
          <Pressable
            style={styles.backButton}
            onPress={() => router.push("/agent/packages" as any)}
          >
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

      <View style={styles.stepBar}>
        <View style={styles.stepIcon}>
          <ImagePlus color="#e6c15c" size={19} />
        </View>

        <View style={styles.stepTextBox}>
          <Text style={styles.stepKicker}>
            {isId ? "AGENT STEP 3" : "AGENT STEP 3"}
          </Text>
          <Text style={styles.stepTitle}>
            {isId ? "Foto, Video & Deskripsi" : "Photos, Video & Description"}
          </Text>
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

      {saving ? (
        <View style={styles.savingBar}>
          <ActivityIndicator color="#e6c15c" />
          <Text style={styles.savingText}>
            {isId
              ? "Membuat listing agent dan mengirim untuk review admin..."
              : "Creating agent listing and submitting for admin review..."}
          </Text>
        </View>
      ) : null}

      <ListingFoto
        draft={listingDraft}
        setDraft={setDraft as any}
        onBack={handleBack}
        onNext={handleSubmit}
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
  stepBar: {
    marginHorizontal: 18,
    marginBottom: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#303030",
    backgroundColor: "#101010",
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  stepIcon: {
    width: 38,
    height: 38,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#705d2c",
    backgroundColor: "#211a0b",
    alignItems: "center",
    justifyContent: "center",
  },
  stepTextBox: {
    flex: 1,
  },
  stepKicker: {
    color: "#e6c15c",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.8,
  },
  stepTitle: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "900",
    marginTop: 2,
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
  savingBar: {
    marginHorizontal: 18,
    marginBottom: 8,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#705d2c",
    backgroundColor: "#211a0b",
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },
  savingText: {
    color: "#d6d6d6",
    fontSize: 11.5,
    lineHeight: 16,
    fontWeight: "800",
    flex: 1,
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