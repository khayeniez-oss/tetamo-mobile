import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
    ArrowLeft,
    BadgeCheck,
    CalendarClock,
    CheckCircle2,
    CirclePause,
    Clock3,
    CreditCard,
    Home,
    Languages,
    MapPin,
    PackageCheck,
    Pencil,
    PlusCircle,
    RotateCcw,
    Search,
    ShieldAlert,
    ShieldCheck,
    Sparkles,
    Star,
    XCircle,
} from "lucide-react-native";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
    Pressable,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import { supabase } from "../../lib/supabase";

type Language = "en" | "id";
type DashboardRole = "owner" | "agent";
type TransactionStatus = "available" | "sold" | "rented";
type EffectiveStatus =
  | "active"
  | "expiring"
  | "expired"
  | "paused"
  | "sold"
  | "rented"
  | "pending_payment"
  | "pending_approval"
  | "pending_verification"
  | "rejected";

type ProfileRow = {
  id: string;
  role: string | null;
  full_name: string | null;
  email: string | null;
};

type PropertyRow = {
  id: string;
  user_id: string | null;
  status: string | null;
  verified_ok: boolean | null;
  verification_status: string | null;
  kode: string | null;
  posted_date: string | null;
  created_at: string | null;
  title: string | null;
  title_id: string | null;
  price: number | null;

  source: string | null;
  city: string | null;
  area: string | null;
  province: string | null;

  listing_type: string | null;
  rental_type: string | null;
  sale_type: string | null;
  property_type: string | null;

  land_size: number | null;
  building_size: number | null;
  land_unit: string | null;
  road_access: string | null;
  ownership_type: string | null;
  land_type: string | null;
  zoning_type: string | null;

  listing_expires_at: string | null;
  featured_expires_at: string | null;
  is_paused: boolean | null;
  plan_id: string | null;

  boost_active: boolean | null;
  boost_expires_at: string | null;
  spotlight_active: boolean | null;
  spotlight_expires_at: string | null;

  transaction_status: string | null;
  transaction_closed_at: string | null;
  transaction_closed_by: string | null;
};

type PropertyImageRow = {
  id: string;
  property_id: string;
  image_url: string;
  sort_order: number | null;
  is_cover: boolean | null;
};

type ListingRow = PropertyRow & {
  photo: string;
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

const FALLBACK_PHOTO =
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=900&q=80";

function readParam(value: unknown) {
  if (Array.isArray(value)) return String(value[0] || "");
  return String(value || "");
}

function formatIdr(value: number | null | undefined) {
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

function toDateOnly(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function diffDays(a: Date, b: Date) {
  const ms = toDateOnly(a).getTime() - toDateOnly(b).getTime();
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

function isFutureDate(value: string | null | undefined) {
  if (!value) return false;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;

  return date.getTime() > Date.now();
}

function computeLifecycleStatus(listingExpiresAt: string | null | undefined) {
  if (!listingExpiresAt) return "active";

  const today = toDateOnly(new Date());
  const expiry = toDateOnly(new Date(listingExpiresAt));

  if (Number.isNaN(expiry.getTime())) return "active";

  const daysLeft = diffDays(expiry, today);

  if (daysLeft < 0) return "expired";
  if (daysLeft <= 7) return "expiring";
  return "active";
}

function normalizeTransactionStatus(value: string | null | undefined): TransactionStatus {
  if (value === "sold") return "sold";
  if (value === "rented") return "rented";
  return "available";
}

function deriveEffectiveStatus(item: ListingRow): EffectiveStatus {
  const rawStatus = String(item.status || "").toLowerCase();
  const verificationStatus = String(item.verification_status || "").toLowerCase();
  const transactionStatus = normalizeTransactionStatus(item.transaction_status);

  if (transactionStatus === "sold") return "sold";
  if (transactionStatus === "rented") return "rented";

  if (
    rawStatus === "pending_payment" ||
    rawStatus === "awaiting_payment" ||
    rawStatus === "unpaid" ||
    rawStatus === "draft_payment_pending"
  ) {
    return "pending_payment";
  }

  if (
    rawStatus === "pending_approval" ||
    verificationStatus === "pending_approval"
  ) {
    return "pending_approval";
  }

  if (
    verificationStatus === "pending_verification" ||
    rawStatus === "pending_verification"
  ) {
    return "pending_verification";
  }

  if (rawStatus === "rejected") return "rejected";
  if (item.is_paused) return "paused";

  return computeLifecycleStatus(item.listing_expires_at) as EffectiveStatus;
}

function getStatusText(status: EffectiveStatus, language: Language) {
  if (language === "id") {
    if (status === "active") return "Aktif";
    if (status === "expiring") return "Akan Kadaluwarsa";
    if (status === "expired") return "Kadaluwarsa";
    if (status === "paused") return "Dijeda";
    if (status === "sold") return "Terjual";
    if (status === "rented") return "Tersewa";
    if (status === "pending_payment") return "Menunggu Pembayaran";
    if (status === "pending_approval") return "Menunggu Persetujuan";
    if (status === "pending_verification") return "Menunggu Verifikasi";
    if (status === "rejected") return "Ditolak";
  }

  if (status === "active") return "Active";
  if (status === "expiring") return "Expiring Soon";
  if (status === "expired") return "Expired";
  if (status === "paused") return "Paused";
  if (status === "sold") return "Sold";
  if (status === "rented") return "Rented";
  if (status === "pending_payment") return "Pending Payment";
  if (status === "pending_approval") return "Pending Approval";
  if (status === "pending_verification") return "Pending Verification";
  if (status === "rejected") return "Rejected";

  return "Active";
}

function getStatusIcon(status: EffectiveStatus) {
  if (status === "active") return <BadgeCheck color="#22c55e" size={13} />;
  if (status === "expiring") return <Clock3 color="#f59e0b" size={13} />;
  if (status === "expired") return <XCircle color="#ef4444" size={13} />;
  if (status === "paused") return <CirclePause color="#a9a9a9" size={13} />;
  if (status === "sold") return <CheckCircle2 color="#22c55e" size={13} />;
  if (status === "rented") return <Home color="#38bdf8" size={13} />;
  if (status === "pending_payment") return <CreditCard color="#f97316" size={13} />;
  if (status === "pending_approval") return <ShieldAlert color="#818cf8" size={13} />;
  if (status === "pending_verification") return <ShieldCheck color="#f59e0b" size={13} />;
  return <XCircle color="#ef4444" size={13} />;
}

function formatPropertyType(value: string | null | undefined, language: Language) {
  const raw = String(value || "").trim().toLowerCase();

  if (!raw) return "-";
  if (raw === "tanah") return language === "id" ? "Tanah" : "Land";
  if (raw === "rumah") return language === "id" ? "Rumah" : "House";
  if (raw === "apartemen" || raw === "apartment") {
    return language === "id" ? "Apartemen" : "Apartment";
  }
  if (raw === "ruko") return language === "id" ? "Ruko" : "Shophouse";
  if (raw === "gudang") return language === "id" ? "Gudang" : "Warehouse";
  if (raw === "kantor") return language === "id" ? "Kantor" : "Office";

  return raw
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function formatRentalType(value: string | null | undefined, language: Language) {
  const raw = String(value || "").toLowerCase();

  if (raw === "daily" || raw === "harian") return language === "id" ? "Harian" : "Daily";
  if (raw === "monthly" || raw === "bulanan") return language === "id" ? "Bulanan" : "Monthly";
  if (raw === "yearly" || raw === "tahunan") return language === "id" ? "Tahunan" : "Yearly";

  return "";
}

function formatSaleType(value: string | null | undefined, language: Language) {
  const raw = String(value || "").toLowerCase();

  if (raw === "freehold") return "Freehold";
  if (raw === "leasehold") return "Leasehold";
  if (raw === "hgb") return "HGB";
  if (raw === "hak_pakai") return language === "id" ? "Hak Pakai" : "Right to Use";
  if (raw === "lainnya") return language === "id" ? "Lainnya" : "Other";

  return "";
}

function formatLandUnit(value: string | null | undefined) {
  const raw = String(value || "").toLowerCase();

  if (raw === "are") return "are";
  if (raw === "hectare" || raw === "hektare") return "ha";
  if (raw === "acre" || raw === "acres") return "acre";

  return "m²";
}

function formatNumber(value: number | null | undefined) {
  if (typeof value !== "number" || Number.isNaN(value)) return "";
  return new Intl.NumberFormat("id-ID").format(value);
}

function attachImages(properties: PropertyRow[], images: PropertyImageRow[]) {
  return properties.map((property) => {
    const propertyImages = images
      .filter((image) => image.property_id === property.id)
      .sort((a, b) => {
        const coverA = a.is_cover ? 1 : 0;
        const coverB = b.is_cover ? 1 : 0;

        if (coverA !== coverB) return coverB - coverA;

        return Number(a.sort_order || 0) - Number(b.sort_order || 0);
      });

    return {
      ...property,
      photo: propertyImages[0]?.image_url || FALLBACK_PHOTO,
    };
  });
}

function isMembershipActive(membership: AgentMembershipRow | null) {
  if (!membership) return false;
  if (membership.status !== "active") return false;

  if (!membership.expires_at) return true;

  const expiresAt = new Date(membership.expires_at);
  if (Number.isNaN(expiresAt.getTime())) return true;

  return expiresAt.getTime() >= Date.now();
}

function getMembershipNumber(
  membership: AgentMembershipRow | null,
  key: string
) {
  const direct = Number((membership as any)?.[key] || 0);
  if (Number.isFinite(direct) && direct > 0) return direct;

  const fromMetadata = Number(membership?.metadata?.[key] || 0);
  if (Number.isFinite(fromMetadata) && fromMetadata > 0) return fromMetadata;

  return 0;
}

function getMembershipListingLimit(membership: AgentMembershipRow | null) {
  return (
    getMembershipNumber(membership, "listing_limit") ||
    getMembershipNumber(membership, "listingLimit") ||
    getMembershipNumber(membership, "active_listing_limit") ||
    getMembershipNumber(membership, "activeListingLimit")
  );
}

function getBillingCycleLabel(value: string | null | undefined, language: Language) {
  const raw = String(value || "").toLowerCase();

  if (raw === "monthly") return language === "id" ? "Bulanan" : "Monthly";
  if (raw === "yearly") return language === "id" ? "Tahunan" : "Yearly";

  return "-";
}

function isListingSlotUsed(item: ListingRow) {
  const transaction = normalizeTransactionStatus(item.transaction_status);

  if (transaction === "sold" || transaction === "rented") return false;
  if (String(item.status || "").toLowerCase() === "rejected") return false;

  return computeLifecycleStatus(item.listing_expires_at) !== "expired";
}

function isActionBlocked(item: ListingRow) {
  const status = deriveEffectiveStatus(item);
  return (
    status === "pending_payment" ||
    status === "pending_approval" ||
    status === "pending_verification" ||
    status === "rejected" ||
    status === "sold" ||
    status === "rented"
  );
}

function isAddonActive(item: ListingRow, addon: "boost" | "spotlight") {
  if (addon === "boost") {
    return Boolean(item.boost_active) && isFutureDate(item.boost_expires_at);
  }

  return Boolean(item.spotlight_active) && isFutureDate(item.spotlight_expires_at);
}

export default function DashboardListingsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const [language, setLanguage] = useState<Language>("en");
  const [role, setRole] = useState<DashboardRole>(
    readParam(params.role) === "agent" ? "agent" : "owner"
  );
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [allListings, setAllListings] = useState<ListingRow[]>([]);
  const [memberships, setMemberships] = useState<AgentMembershipRow[]>([]);
  const [totalLeads, setTotalLeads] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [search, setSearch] = useState("");

  const isId = language === "id";

  const activeMembership = useMemo(() => {
    return memberships.find((membership) => isMembershipActive(membership)) || null;
  }, [memberships]);

  const latestMembership = useMemo(() => {
    return activeMembership || memberships[0] || null;
  }, [activeMembership, memberships]);

  const membershipListingLimit = useMemo(() => {
    return getMembershipListingLimit(activeMembership);
  }, [activeMembership]);

  const listings = useMemo(() => {
    if (role === "agent") {
      return allListings.filter((item) => String(item.source || "") === "agent");
    }

    return allListings.filter((item) => String(item.source || "") !== "agent");
  }, [allListings, role]);

  const usedListingSlots = useMemo(() => {
    return listings.filter(isListingSlotUsed).length;
  }, [listings]);

  const remainingListingSlots = Math.max(
    membershipListingLimit - usedListingSlots,
    0
  );

  const filteredListings = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return listings;

    return listings.filter((item) => {
      const text = `
        ${item.title || ""}
        ${item.title_id || ""}
        ${item.kode || ""}
        ${item.city || ""}
        ${item.area || ""}
        ${item.province || ""}
        ${item.price || ""}
        ${item.property_type || ""}
        ${item.listing_type || ""}
        ${item.rental_type || ""}
        ${item.sale_type || ""}
      `.toLowerCase();

      return q
        .split(/\s+/)
        .filter(Boolean)
        .every((word) => text.includes(word));
    });
  }, [listings, search]);

  const stats = useMemo(() => {
    let active = 0;
    let expiring = 0;
    let pending = 0;

    for (const item of listings) {
      const status = deriveEffectiveStatus(item);

      if (status === "active") active += 1;
      if (status === "expiring") expiring += 1;
      if (status === "pending_approval" || status === "pending_verification") {
        pending += 1;
      }
    }

    return {
      total: listings.length,
      active,
      expiring,
      pending,
      leads: totalLeads,
    };
  }, [listings, totalLeads]);

  useEffect(() => {
    const roleParam = readParam(params.role);
    if (roleParam === "agent" || roleParam === "owner") {
      setRole(roleParam);
    }
  }, [params.role]);

  useEffect(() => {
    let ignore = false;

    async function loadListingsPage() {
      setLoading(true);
      setErrorMessage("");

      try {
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (ignore) return;

        if (authError || !user) {
          router.replace(
            `/login?next=${encodeURIComponent(
              `/dashboard/listings?role=${role}`
            )}` as any
          );
          return;
        }

        const profileRes = await supabase
          .from("profiles")
          .select("id, role, full_name, email")
          .eq("id", user.id)
          .maybeSingle();

        if (ignore) return;

        if (profileRes.error) throw profileRes.error;

        const profileRow = (profileRes.data || null) as ProfileRow | null;
        setProfile(profileRow);

        const [
          { data: propertyRows, error: propertyError },
          { data: membershipRows, error: membershipError },
          { count: leadsCount, error: leadsError },
        ] = await Promise.all([
          supabase
            .from("properties")
            .select(
              "id, user_id, status, verified_ok, verification_status, kode, posted_date, created_at, title, title_id, price, source, city, area, province, listing_type, rental_type, sale_type, property_type, land_size, building_size, land_unit, road_access, ownership_type, land_type, zoning_type, listing_expires_at, featured_expires_at, is_paused, plan_id, boost_active, boost_expires_at, spotlight_active, spotlight_expires_at, transaction_status, transaction_closed_at, transaction_closed_by"
            )
            .eq("user_id", user.id)
            .order("created_at", { ascending: false }),

          supabase
            .from("agent_memberships")
            .select(
              "id, user_id, payment_id, package_id, package_name, billing_cycle, listing_limit, status, auto_renew, starts_at, expires_at, metadata, created_at, updated_at"
            )
            .eq("user_id", user.id)
            .order("created_at", { ascending: false }),

          supabase
            .from("leads")
            .select("*", { count: "exact", head: true })
            .eq("receiver_user_id", user.id)
            .eq("receiver_role", role),
        ]);

        if (ignore) return;

        if (propertyError) throw propertyError;
        if (membershipError) throw membershipError;
        if (leadsError) throw leadsError;

        const properties = (propertyRows || []) as PropertyRow[];
        const propertyIds = properties.map((item) => item.id);

        let imageRows: PropertyImageRow[] = [];

        if (propertyIds.length > 0) {
          const { data: images, error: imageError } = await supabase
            .from("property_images")
            .select("id, property_id, image_url, sort_order, is_cover")
            .in("property_id", propertyIds)
            .order("sort_order", { ascending: true });

          if (imageError) throw imageError;

          imageRows = (images || []) as PropertyImageRow[];
        }

        setAllListings(attachImages(properties, imageRows));
        setMemberships((membershipRows || []) as AgentMembershipRow[]);
        setTotalLeads(leadsCount || 0);
        setLoading(false);
      } catch (error: any) {
        if (!ignore) {
          console.log("Tetamo mobile dashboard listings error:", error);
          setErrorMessage(
            error?.message ||
              (isId ? "Gagal memuat listing." : "Failed to load listings.")
          );
          setLoading(false);
        }
      }
    }

    void loadListingsPage();

    return () => {
      ignore = true;
    };
  }, [router, role, isId]);

  function goBack() {
    router.push("/(tabs)/profile" as any);
  }

  function goCreateListing() {
    if (role === "agent") {
      if (!activeMembership) {
        router.push("/agent/packages" as any);
        return;
      }

      if (membershipListingLimit <= 0 || remainingListingSlots <= 0) {
        Alert.alert(
          isId ? "Limit penuh" : "Limit full",
          isId
            ? "Limit listing aktif Anda sudah penuh. Tandai listing sebagai sold/rented atau upgrade paket."
            : "Your active listing limit is full. Mark a listing as sold/rented or upgrade your package."
        );
        return;
      }

      router.push("/agent/create-listing" as any);
      return;
    }

    router.push("/add-listing?audience=owner" as any);
  }

  function goEdit(item: ListingRow) {
    const kode = String(item.kode || "");
    if (!kode || kode === "-") {
      Alert.alert(isId ? "Kode tidak ditemukan." : "Listing code not found.");
      return;
    }

    if (role === "agent") {
      router.push(`/agent/edit-listing/${encodeURIComponent(kode)}` as any);
      return;
    }

    router.push(`/owner/edit-listing/${encodeURIComponent(kode)}` as any);
  }

  function goPaymentAction(item: ListingRow, action: "boost" | "spotlight" | "renew") {
    const title =
      action === "boost"
        ? "Boost"
        : action === "spotlight"
        ? "Spotlight"
        : isId
        ? "Perpanjang"
        : "Renew";

    Alert.alert(
      title,
      isId
        ? "Halaman pembayaran add-on mobile akan kita sambungkan setelah halaman listing ini selesai."
        : "The mobile add-on payment page will be connected after this listing page is complete."
    );
  }

  async function togglePause(item: ListingRow) {
    if (isActionBlocked(item)) {
      Alert.alert(
        isId ? "Aksi tidak tersedia" : "Action unavailable",
        isId
          ? "Listing ini belum bisa dijeda karena statusnya masih proses / sudah selesai."
          : "This listing cannot be paused because it is still in process or already closed."
      );
      return;
    }

    try {
      setBusyId(`${item.id}-pause`);

      const nextPaused = !Boolean(item.is_paused);

      const { error } = await supabase
        .from("properties")
        .update({ is_paused: nextPaused })
        .eq("id", item.id);

      if (error) throw error;

      setAllListings((prev) =>
        prev.map((listing) =>
          listing.id === item.id ? { ...listing, is_paused: nextPaused } : listing
        )
      );
    } catch (error: any) {
      Alert.alert(
        error?.message ||
          (isId
            ? "Gagal mengubah status listing."
            : "Failed to change listing status.")
      );
    } finally {
      setBusyId("");
    }
  }

  async function markTransaction(
    item: ListingRow,
    nextStatus: Extract<TransactionStatus, "sold" | "rented">
  ) {
    if (deriveEffectiveStatus(item) === "pending_payment") return;

    const label =
      nextStatus === "sold"
        ? isId
          ? "terjual"
          : "sold"
        : isId
        ? "tersewa"
        : "rented";

    Alert.alert(
      isId ? "Konfirmasi status" : "Confirm status",
      isId
        ? `Tandai listing "${item.title || item.kode}" sebagai ${label}? Listing akan hilang dari marketplace publik tetapi tetap ada di dashboard.`
        : `Mark listing "${item.title || item.kode}" as ${label}? The listing will be hidden from the public marketplace but remain in your dashboard.`,
      [
        {
          text: isId ? "Batal" : "Cancel",
          style: "cancel",
        },
        {
          text: isId ? "Ya, lanjutkan" : "Yes, continue",
          style: "destructive",
          onPress: async () => {
            try {
              setBusyId(`${item.id}-${nextStatus}`);

              const now = new Date().toISOString();

              const {
                data: { user },
              } = await supabase.auth.getUser();

              const { error } = await supabase
                .from("properties")
                .update({
                  transaction_status: nextStatus,
                  transaction_closed_at: now,
                  transaction_closed_by: user?.id || null,
                })
                .eq("id", item.id);

              if (error) throw error;

              setAllListings((prev) =>
                prev.map((listing) =>
                  listing.id === item.id
                    ? {
                        ...listing,
                        transaction_status: nextStatus,
                        transaction_closed_at: now,
                        transaction_closed_by: user?.id || null,
                      }
                    : listing
                )
              );
            } catch (error: any) {
              Alert.alert(
                error?.message ||
                  (isId
                    ? "Gagal memperbarui status transaksi."
                    : "Failed to update transaction status.")
              );
            } finally {
              setBusyId("");
            }
          },
        },
      ]
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="light" />

        <View style={styles.loadingBox}>
          <ActivityIndicator color="#e6c15c" />
          <Text style={styles.loadingText}>
            {isId ? "Memuat listing..." : "Loading listings..."}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />

      <View style={styles.topBar}>
        <Pressable style={styles.backButton} onPress={goBack}>
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
        {errorMessage ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorBannerText}>{errorMessage}</Text>
          </View>
        ) : null}

        <View style={styles.heroCard}>
          <View style={styles.heroBadge}>
            <Home color="#e6c15c" size={14} />
            <Text style={styles.heroBadgeText}>
              {role === "agent"
                ? isId
                  ? "LISTING AGENT"
                  : "AGENT LISTINGS"
                : isId
                ? "IKLAN PEMILIK"
                : "OWNER LISTINGS"}
            </Text>
          </View>

          <Text style={styles.title}>
            {role === "agent"
              ? isId
                ? "Listing Saya"
                : "My Agent Listings"
              : isId
              ? "Iklan Saya"
              : "My Listings"}
          </Text>

          <Text style={styles.subtitle}>
            {role === "agent"
              ? isId
                ? "Kelola listing agent, status verifikasi, slot aktif, leads, dan aksi cepat."
                : "Manage agent listings, verification status, active slots, leads, and quick actions."
              : isId
              ? "Kelola iklan pemilik, status transaksi, promosi, perpanjangan, dan aksi cepat."
              : "Manage owner listings, transaction status, promotions, renewals, and quick actions."}
          </Text>

          <View style={styles.roleSwitch}>
            <Pressable
              style={[
                styles.roleSwitchButton,
                role === "owner" && styles.roleSwitchActive,
              ]}
              onPress={() => setRole("owner")}
            >
              <Text
                style={[
                  styles.roleSwitchText,
                  role === "owner" && styles.roleSwitchTextActive,
                ]}
              >
                Owner
              </Text>
            </Pressable>

            <Pressable
              style={[
                styles.roleSwitchButton,
                role === "agent" && styles.roleSwitchActive,
              ]}
              onPress={() => setRole("agent")}
            >
              <Text
                style={[
                  styles.roleSwitchText,
                  role === "agent" && styles.roleSwitchTextActive,
                ]}
              >
                Agent
              </Text>
            </Pressable>
          </View>
        </View>

        {role === "agent" ? (
          <View style={styles.membershipCard}>
            <View style={styles.membershipTop}>
              <View style={styles.membershipIcon}>
                <ShieldCheck color="#60a5fa" size={21} />
              </View>

              <View style={styles.membershipTextBox}>
                <Text style={styles.membershipTitle}>
                  {activeMembership
                    ? isId
                      ? "Paket Agent Aktif"
                      : "Active Agent Package"
                    : isId
                    ? "Paket Agent Belum Aktif"
                    : "Agent Package Not Active"}
                </Text>
                <Text style={styles.membershipSub}>
                  {latestMembership?.package_name ||
                    latestMembership?.package_id ||
                    (isId ? "Pilih paket agent" : "Choose agent package")}
                </Text>
              </View>
            </View>

            <View style={styles.membershipStats}>
              <MiniStat
                label={isId ? "Billing" : "Billing"}
                value={getBillingCycleLabel(
                  latestMembership?.billing_cycle,
                  language
                )}
              />
              <MiniStat
                label={isId ? "Expired" : "Expires"}
                value={formatDate(latestMembership?.expires_at, language)}
              />
              <MiniStat
                label={isId ? "Limit" : "Limit"}
                value={
                  membershipListingLimit > 0
                    ? `${usedListingSlots}/${membershipListingLimit}`
                    : "-"
                }
              />
              <MiniStat
                label={isId ? "Sisa" : "Remaining"}
                value={String(remainingListingSlots || 0)}
              />
            </View>

            <Pressable
              style={styles.membershipButton}
              onPress={() => router.push("/agent/packages" as any)}
            >
              <PackageCheck color="#111111" size={16} />
              <Text style={styles.membershipButtonText}>
                {activeMembership
                  ? isId
                    ? "Lihat / Upgrade Paket"
                    : "View / Upgrade Package"
                  : isId
                  ? "Pilih Paket"
                  : "Choose Package"}
              </Text>
            </Pressable>
          </View>
        ) : null}

        <View style={styles.statsGrid}>
          <StatCard
            icon={<Home color="#e6c15c" size={18} />}
            label={isId ? "Total" : "Total"}
            value={String(stats.total)}
          />
          <StatCard
            icon={<CheckCircle2 color="#22c55e" size={18} />}
            label={isId ? "Aktif" : "Active"}
            value={String(stats.active)}
          />
          <StatCard
            icon={<Clock3 color="#f59e0b" size={18} />}
            label={isId ? "Pending" : "Pending"}
            value={String(stats.pending)}
          />
          <StatCard
            icon={<CalendarClock color="#60a5fa" size={18} />}
            label="Leads"
            value={String(stats.leads)}
          />
        </View>

        <View style={styles.actionRow}>
          <Pressable style={styles.createButton} onPress={goCreateListing}>
            <PlusCircle color="#111111" size={17} />
            <Text style={styles.createButtonText}>
              {role === "agent"
                ? activeMembership
                  ? isId
                    ? "Tambah Listing"
                    : "Add Listing"
                  : isId
                  ? "Pilih Paket"
                  : "Choose Package"
                : isId
                ? "Pasang Iklan"
                : "Add Listing"}
            </Text>
          </Pressable>
        </View>

        <View style={styles.searchBox}>
          <Search color="#8f8f8f" size={17} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder={
              isId
                ? "Cari kode, judul, lokasi..."
                : "Search code, title, location..."
            }
            placeholderTextColor="#777777"
            style={styles.searchInput}
          />
        </View>

        {filteredListings.length === 0 ? (
          <View style={styles.emptyBox}>
            <Home color="#777777" size={26} />
            <Text style={styles.emptyTitle}>
              {isId ? "Belum ada listing" : "No listings yet"}
            </Text>
            <Text style={styles.emptyText}>
              {role === "agent"
                ? isId
                  ? "Listing agent Anda akan tampil di sini setelah dibuat."
                  : "Your agent listings will appear here after you create them."
                : isId
                ? "Iklan pemilik Anda akan tampil di sini setelah dibuat."
                : "Your owner listings will appear here after you create them."}
            </Text>
          </View>
        ) : (
          <View style={styles.list}>
            {filteredListings.map((item) => (
              <ListingCard
                key={item.id}
                item={item}
                role={role}
                language={language}
                busyId={busyId}
                onEdit={() => goEdit(item)}
                onTogglePause={() => togglePause(item)}
                onSold={() => markTransaction(item, "sold")}
                onRented={() => markTransaction(item, "rented")}
                onBoost={() => goPaymentAction(item, "boost")}
                onSpotlight={() => goPaymentAction(item, "spotlight")}
                onRenew={() => goPaymentAction(item, "renew")}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.miniStat}>
      <Text style={styles.miniStatLabel}>{label}</Text>
      <Text style={styles.miniStatValue} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.statCard}>
      <View style={styles.statIcon}>{icon}</View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

function ListingCard({
  item,
  role,
  language,
  busyId,
  onEdit,
  onTogglePause,
  onSold,
  onRented,
  onBoost,
  onSpotlight,
  onRenew,
}: {
  item: ListingRow;
  role: DashboardRole;
  language: Language;
  busyId: string;
  onEdit: () => void;
  onTogglePause: () => void;
  onSold: () => void;
  onRented: () => void;
  onBoost: () => void;
  onSpotlight: () => void;
  onRenew: () => void;
}) {
  const isId = language === "id";
  const status = deriveEffectiveStatus(item);
  const actionBlocked = isActionBlocked(item);
  const location = item.city || item.area || item.province || "-";

  const listingType =
    item.listing_type === "disewa"
      ? isId
        ? "Disewa"
        : "For Rent"
      : isId
      ? "Dijual"
      : "For Sale";

  const rentalType = formatRentalType(item.rental_type, language);
  const saleType = formatSaleType(item.sale_type, language);
  const propertyType = formatPropertyType(item.property_type, language);

  const landText =
    typeof item.land_size === "number"
      ? `${formatNumber(item.land_size)} ${formatLandUnit(item.land_unit)}`
      : "";

  const buildingText =
    typeof item.building_size === "number"
      ? `${formatNumber(item.building_size)} m²`
      : "";

  return (
    <View style={styles.listingCard}>
      <Image source={{ uri: item.photo || FALLBACK_PHOTO }} style={styles.photo} />

      <View style={styles.cardBody}>
        <View style={styles.cardTop}>
          <View style={styles.statusPill}>
            {getStatusIcon(status)}
            <Text style={styles.statusText}>{getStatusText(status, language)}</Text>
          </View>

          {item.kode ? (
            <Text style={styles.kodeText} numberOfLines={1}>
              {item.kode}
            </Text>
          ) : null}
        </View>

        <Text style={styles.cardTitle} numberOfLines={2}>
          {language === "id" ? item.title_id || item.title || "-" : item.title || item.title_id || "-"}
        </Text>

        <View style={styles.locationRow}>
          <MapPin color="#8f8f8f" size={13} />
          <Text style={styles.locationText} numberOfLines={1}>
            {location}
          </Text>
        </View>

        <Text style={styles.priceText}>{formatIdr(item.price)}</Text>

        <View style={styles.badgeRow}>
          <SmallBadge text={listingType} />
          {rentalType ? <SmallBadge text={rentalType} /> : null}
          {saleType ? <SmallBadge text={saleType} /> : null}
          {propertyType ? <SmallBadge text={propertyType} /> : null}
        </View>

        <View style={styles.detailGrid}>
          {landText ? <DetailPill label={isId ? "Tanah" : "Land"} value={landText} /> : null}
          {buildingText ? <DetailPill label={isId ? "Bangunan" : "Building"} value={buildingText} /> : null}
          {item.road_access ? <DetailPill label={isId ? "Akses" : "Road"} value={item.road_access} /> : null}
          {item.zoning_type ? <DetailPill label="Zoning" value={item.zoning_type} /> : null}
        </View>

        <View style={styles.promoRow}>
          {role === "owner" && item.plan_id ? (
            <PromoPill
              icon={<Sparkles color="#e6c15c" size={12} />}
              text={item.plan_id}
              active
            />
          ) : null}

          {isAddonActive(item, "boost") ? (
            <PromoPill
              icon={<Star color="#e6c15c" size={12} />}
              text={isId ? "Boost Aktif" : "Boost Active"}
              active
            />
          ) : null}

          {isAddonActive(item, "spotlight") ? (
            <PromoPill
              icon={<Sparkles color="#e6c15c" size={12} />}
              text="Spotlight"
              active
            />
          ) : null}
        </View>

        <View style={styles.dateBox}>
          <Text style={styles.dateText}>
            {isId ? "Diposting" : "Posted"}:{" "}
            {formatDate(item.posted_date || item.created_at, language)}
          </Text>
          <Text style={styles.dateText}>
            {isId ? "Listing sampai" : "Listing until"}:{" "}
            {formatDate(item.listing_expires_at, language)}
          </Text>
        </View>

        <View style={styles.actions}>
          <ActionButton
            label="Edit"
            icon={<Pencil color="#111111" size={13} />}
            primary
            onPress={onEdit}
          />

          <ActionButton
            label={item.is_paused ? (isId ? "Aktifkan" : "Activate") : isId ? "Jeda" : "Pause"}
            icon={<CirclePause color="#ffffff" size={13} />}
            disabled={actionBlocked || busyId === `${item.id}-pause`}
            onPress={onTogglePause}
          />

          <ActionButton
            label="Sold"
            icon={<CheckCircle2 color="#ffffff" size={13} />}
            disabled={actionBlocked || busyId === `${item.id}-sold`}
            onPress={onSold}
          />

          <ActionButton
            label={isId ? "Rented" : "Rented"}
            icon={<Home color="#ffffff" size={13} />}
            disabled={actionBlocked || busyId === `${item.id}-rented`}
            onPress={onRented}
          />

          <ActionButton
            label="Boost"
            icon={<Star color="#ffffff" size={13} />}
            disabled={actionBlocked || isAddonActive(item, "boost")}
            onPress={onBoost}
          />

          <ActionButton
            label="Spotlight"
            icon={<Sparkles color="#ffffff" size={13} />}
            disabled={actionBlocked || isAddonActive(item, "spotlight")}
            onPress={onSpotlight}
          />

          {role === "owner" ? (
            <ActionButton
              label={isId ? "Perpanjang" : "Renew"}
              icon={<RotateCcw color="#ffffff" size={13} />}
              disabled={status !== "expired" && status !== "expiring"}
              onPress={onRenew}
            />
          ) : null}
        </View>
      </View>
    </View>
  );
}

function SmallBadge({ text }: { text: string }) {
  return (
    <View style={styles.smallBadge}>
      <Text style={styles.smallBadgeText}>{text}</Text>
    </View>
  );
}

function DetailPill({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailPill}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

function PromoPill({
  icon,
  text,
  active,
}: {
  icon: ReactNode;
  text: string;
  active?: boolean;
}) {
  return (
    <View style={[styles.promoPill, active && styles.promoPillActive]}>
      {icon}
      <Text style={styles.promoText} numberOfLines={1}>
        {text}
      </Text>
    </View>
  );
}

function ActionButton({
  label,
  icon,
  primary,
  disabled,
  onPress,
}: {
  label: string;
  icon: ReactNode;
  primary?: boolean;
  disabled?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={[
        styles.actionButton,
        primary && styles.actionButtonPrimary,
        disabled && styles.actionButtonDisabled,
      ]}
      disabled={disabled}
      onPress={onPress}
    >
      {icon}
      <Text
        style={[
          styles.actionText,
          primary && styles.actionTextPrimary,
          disabled && styles.actionTextDisabled,
        ]}
      >
        {label}
      </Text>
    </Pressable>
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
    paddingHorizontal: 9,
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
  content: {
    paddingHorizontal: 18,
    paddingBottom: 38,
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
  errorBanner: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#7f1d1d",
    backgroundColor: "#2a0d0d",
    padding: 12,
    marginBottom: 12,
  },
  errorBannerText: {
    color: "#fecaca",
    fontSize: 11.5,
    lineHeight: 16,
    fontWeight: "700",
  },
  heroCard: {
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "#303030",
    backgroundColor: "#101010",
    padding: 17,
    marginBottom: 14,
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
    fontSize: 9.2,
    fontWeight: "900",
    letterSpacing: 0.9,
  },
  title: {
    color: "#ffffff",
    fontSize: 25,
    lineHeight: 31,
    fontWeight: "900",
    letterSpacing: -0.6,
    marginTop: 13,
  },
  subtitle: {
    color: "#b8b8b8",
    fontSize: 12.1,
    lineHeight: 18,
    fontWeight: "700",
    marginTop: 7,
  },
  roleSwitch: {
    borderRadius: 17,
    borderWidth: 1,
    borderColor: "#303030",
    backgroundColor: "#050505",
    padding: 4,
    flexDirection: "row",
    marginTop: 14,
  },
  roleSwitchButton: {
    flex: 1,
    minHeight: 38,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  roleSwitchActive: {
    backgroundColor: "#e6c15c",
  },
  roleSwitchText: {
    color: "#a9a9a9",
    fontSize: 11.5,
    fontWeight: "900",
  },
  roleSwitchTextActive: {
    color: "#111111",
  },
  membershipCard: {
    borderRadius: 26,
    borderWidth: 1,
    borderColor: "#1d4ed8",
    backgroundColor: "#0b1624",
    padding: 14,
    marginBottom: 14,
  },
  membershipTop: {
    flexDirection: "row",
    gap: 10,
    alignItems: "flex-start",
  },
  membershipIcon: {
    width: 43,
    height: 43,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#1d4ed8",
    backgroundColor: "#06101d",
    alignItems: "center",
    justifyContent: "center",
  },
  membershipTextBox: {
    flex: 1,
  },
  membershipTitle: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "900",
  },
  membershipSub: {
    color: "#bfdbfe",
    fontSize: 11.5,
    lineHeight: 16,
    fontWeight: "800",
    marginTop: 3,
  },
  membershipStats: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 13,
  },
  miniStat: {
    width: "48.5%",
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#1d4ed8",
    backgroundColor: "#06101d",
    padding: 10,
  },
  miniStatLabel: {
    color: "#93c5fd",
    fontSize: 10.3,
    fontWeight: "800",
  },
  miniStatValue: {
    color: "#ffffff",
    fontSize: 11.7,
    fontWeight: "900",
    marginTop: 4,
  },
  membershipButton: {
    minHeight: 46,
    borderRadius: 16,
    backgroundColor: "#e6c15c",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    marginTop: 13,
  },
  membershipButtonText: {
    color: "#111111",
    fontSize: 12.3,
    fontWeight: "900",
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 9,
    marginBottom: 14,
  },
  statCard: {
    width: "48.5%",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#303030",
    backgroundColor: "#101010",
    padding: 11,
  },
  statIcon: {
    width: 34,
    height: 34,
    borderRadius: 14,
    backgroundColor: "#050505",
    borderWidth: 1,
    borderColor: "#252525",
    alignItems: "center",
    justifyContent: "center",
  },
  statValue: {
    color: "#ffffff",
    fontSize: 20,
    fontWeight: "900",
    marginTop: 9,
  },
  statLabel: {
    color: "#a9a9a9",
    fontSize: 9.8,
    fontWeight: "800",
    marginTop: 2,
  },
  actionRow: {
    marginBottom: 12,
  },
  createButton: {
    minHeight: 48,
    borderRadius: 17,
    backgroundColor: "#e6c15c",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },
  createButtonText: {
    color: "#111111",
    fontSize: 12.8,
    fontWeight: "900",
  },
  searchBox: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#303030",
    backgroundColor: "#101010",
    minHeight: 46,
    paddingHorizontal: 13,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 14,
  },
  searchInput: {
    flex: 1,
    color: "#ffffff",
    fontSize: 12.2,
    fontWeight: "800",
  },
  emptyBox: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#303030",
    backgroundColor: "#101010",
    padding: 22,
    alignItems: "center",
  },
  emptyTitle: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "900",
    marginTop: 10,
  },
  emptyText: {
    color: "#9b9b9b",
    fontSize: 11.5,
    lineHeight: 16,
    fontWeight: "700",
    textAlign: "center",
    marginTop: 5,
  },
  list: {
    gap: 14,
  },
  listingCard: {
    borderRadius: 26,
    borderWidth: 1,
    borderColor: "#303030",
    backgroundColor: "#101010",
    overflow: "hidden",
  },
  photo: {
    width: "100%",
    height: 185,
    backgroundColor: "#050505",
  },
  cardBody: {
    padding: 14,
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 9,
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#303030",
    backgroundColor: "#050505",
    paddingHorizontal: 9,
    paddingVertical: 6,
    flex: 1,
  },
  statusText: {
    color: "#d6d6d6",
    fontSize: 9.7,
    fontWeight: "900",
  },
  kodeText: {
    color: "#8f8f8f",
    fontSize: 9.8,
    fontWeight: "900",
    maxWidth: 110,
  },
  cardTitle: {
    color: "#ffffff",
    fontSize: 15.5,
    lineHeight: 20,
    fontWeight: "900",
    marginTop: 11,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 6,
  },
  locationText: {
    color: "#a9a9a9",
    fontSize: 11,
    fontWeight: "700",
    flex: 1,
  },
  priceText: {
    color: "#e6c15c",
    fontSize: 15,
    fontWeight: "900",
    marginTop: 8,
  },
  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 10,
  },
  smallBadge: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#303030",
    backgroundColor: "#050505",
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  smallBadgeText: {
    color: "#d6d6d6",
    fontSize: 9.5,
    fontWeight: "800",
  },
  detailGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 11,
  },
  detailPill: {
    width: "48.3%",
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#252525",
    backgroundColor: "#050505",
    padding: 9,
  },
  detailLabel: {
    color: "#777777",
    fontSize: 9.5,
    fontWeight: "800",
  },
  detailValue: {
    color: "#ffffff",
    fontSize: 10.7,
    fontWeight: "900",
    marginTop: 3,
  },
  promoRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 10,
  },
  promoPill: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#303030",
    backgroundColor: "#050505",
    paddingHorizontal: 8,
    paddingVertical: 5,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  promoPillActive: {
    borderColor: "#705d2c",
    backgroundColor: "#211a0b",
  },
  promoText: {
    color: "#e6c15c",
    fontSize: 9.3,
    fontWeight: "900",
    maxWidth: 120,
  },
  dateBox: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#252525",
    backgroundColor: "#050505",
    padding: 10,
    marginTop: 11,
    gap: 4,
  },
  dateText: {
    color: "#a9a9a9",
    fontSize: 10.5,
    fontWeight: "700",
  },
  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
  },
  actionButton: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#303030",
    backgroundColor: "#050505",
    paddingHorizontal: 10,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  actionButtonPrimary: {
    backgroundColor: "#e6c15c",
    borderColor: "#e6c15c",
  },
  actionButtonDisabled: {
    opacity: 0.35,
  },
  actionText: {
    color: "#ffffff",
    fontSize: 10.2,
    fontWeight: "900",
  },
  actionTextPrimary: {
    color: "#111111",
  },
  actionTextDisabled: {
    color: "#9b9b9b",
  },
});