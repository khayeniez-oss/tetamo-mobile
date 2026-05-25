import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
  BarChart3,
  Bookmark,
  Bot,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock3,
  FileText,
  Heart,
  Home,
  Languages,
  LogIn,
  LogOut,
  MapPin,
  MessageCircle,
  PackageCheck,
  Pencil,
  Plus,
  ReceiptText,
  Settings,
  ShieldCheck,
  UserRound,
  Wallet,
} from "lucide-react-native";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
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

type Language = "en" | "id";
type Role = "owner" | "agent" | "developer" | "admin" | "guest";

type ProfileRow = {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  role: string | null;
  agency: string | null;
  address: string | null;
  photo_url: string | null;
  instagram_url?: string | null;
  facebook_url?: string | null;
  tiktok_url?: string | null;
  youtube_url?: string | null;
  linkedin_url?: string | null;
};

type PropertyRow = {
  id: string;
  user_id: string | null;
  kode: string | null;
  title: string | null;
  title_id: string | null;
  price: number | null;
  province: string | null;
  city: string | null;
  area: string | null;
  source: string | null;
  status: string | null;
  verification_status: string | null;
  transaction_status: string | null;
  listing_expires_at: string | null;
  created_at: string | null;
  posted_date: string | null;
  plan_id: string | null;
};

type PropertyImageRow = {
  id: string;
  property_id: string;
  image_url: string;
  sort_order: number | null;
  is_cover: boolean | null;
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

type ListingCardRow = PropertyRow & {
  photo?: string;
};

type SocialLink = {
  label: string;
  url: string;
};

const FALLBACK_PHOTO =
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80";

function normalizeRole(value: unknown): Role {
  const role = String(value || "").toLowerCase();

  if (role === "owner") return "owner";
  if (role === "agent") return "agent";
  if (role === "developer") return "developer";
  if (role === "admin") return "admin";

  return "guest";
}

function normalizePhotoUrl(value: unknown) {
  const url = String(value || "").trim();

  if (!url) return "";
  if (!/^https?:\/\//i.test(url)) return "";

  return encodeURI(url);
}

function normalizeExternalUrl(value: unknown) {
  const url = String(value || "").trim();

  if (!url) return "";
  if (/^https?:\/\//i.test(url)) return url;

  return `https://${url}`;
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
  key: string,
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

function isListingSlotUsed(row: PropertyRow) {
  if (row.transaction_status === "sold") return false;
  if (row.transaction_status === "rented") return false;
  if (row.status === "rejected") return false;

  if (!row.listing_expires_at) return true;

  const expiresAt = new Date(row.listing_expires_at);
  if (Number.isNaN(expiresAt.getTime())) return true;

  return expiresAt.getTime() >= Date.now();
}

function getStatusLabel(row: PropertyRow, language: Language) {
  const status = String(row.status || "").toLowerCase();
  const verification = String(row.verification_status || "").toLowerCase();
  const transaction = String(row.transaction_status || "").toLowerCase();

  if (transaction === "sold") return language === "id" ? "Terjual" : "Sold";
  if (transaction === "rented") return language === "id" ? "Tersewa" : "Rented";

  if (
    status.includes("pending") ||
    verification.includes("pending") ||
    verification.includes("approval")
  ) {
    return language === "id" ? "Menunggu Review" : "Pending Review";
  }

  if (status === "rejected") return language === "id" ? "Ditolak" : "Rejected";
  if (status === "active") return language === "id" ? "Aktif" : "Active";

  return row.status || (language === "id" ? "Aktif" : "Active");
}

function getBillingCycleLabel(
  value: string | null | undefined,
  language: Language,
) {
  const cycle = String(value || "").toLowerCase();

  if (cycle === "monthly") return language === "id" ? "Bulanan" : "Monthly";
  if (cycle === "yearly") return language === "id" ? "Tahunan" : "Yearly";

  return "-";
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

export default function ProfileScreen() {
  const router = useRouter();
  const isIOS = Platform.OS === "ios";

  const [language, setLanguage] = useState<Language>("en");
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [properties, setProperties] = useState<ListingCardRow[]>([]);
  const [memberships, setMemberships] = useState<AgentMembershipRow[]>([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [avatarLoadFailed, setAvatarLoadFailed] = useState(false);

  const isId = language === "id";
  const role = normalizeRole(profile?.role);

  const avatarUrl = normalizePhotoUrl(profile?.photo_url);

  useEffect(() => {
    setAvatarLoadFailed(false);
  }, [avatarUrl]);

  const socialLinks = useMemo<SocialLink[]>(() => {
    if (!profile) return [];

    return [
      { label: "Instagram", url: normalizeExternalUrl(profile.instagram_url) },
      { label: "Facebook", url: normalizeExternalUrl(profile.facebook_url) },
      { label: "TikTok", url: normalizeExternalUrl(profile.tiktok_url) },
      { label: "YouTube", url: normalizeExternalUrl(profile.youtube_url) },
      { label: "LinkedIn", url: normalizeExternalUrl(profile.linkedin_url) },
    ].filter((item) => item.url);
  }, [profile]);

  const ownerListings = useMemo(() => {
    return properties.filter((item) => String(item.source || "") !== "agent");
  }, [properties]);

  const agentListings = useMemo(() => {
    return properties.filter((item) => String(item.source || "") === "agent");
  }, [properties]);

  const activeMembership = useMemo(() => {
    return (
      memberships.find((membership) => isMembershipActive(membership)) || null
    );
  }, [memberships]);

  const latestMembership = useMemo(() => {
    return activeMembership || memberships[0] || null;
  }, [activeMembership, memberships]);

  const agentListingLimit = useMemo(() => {
    return getMembershipListingLimit(activeMembership);
  }, [activeMembership]);

  const usedAgentSlots = useMemo(() => {
    return agentListings.filter(isListingSlotUsed).length;
  }, [agentListings]);

  const remainingAgentSlots = Math.max(agentListingLimit - usedAgentSlots, 0);

  const ownerStats = useMemo(() => {
    const pending = ownerListings.filter((item) => {
      const status = String(item.status || "").toLowerCase();
      const verification = String(item.verification_status || "").toLowerCase();

      return status.includes("pending") || verification.includes("pending");
    }).length;

    const active = ownerListings.filter((item) => {
      const status = String(item.status || "").toLowerCase();
      return status === "active" || !status;
    }).length;

    return {
      total: ownerListings.length,
      active,
      pending,
    };
  }, [ownerListings]);

  const agentStats = useMemo(() => {
    const pending = agentListings.filter((item) => {
      const status = String(item.status || "").toLowerCase();
      const verification = String(item.verification_status || "").toLowerCase();

      return status.includes("pending") || verification.includes("pending");
    }).length;

    return {
      total: agentListings.length,
      pending,
    };
  }, [agentListings]);

  useEffect(() => {
    let ignore = false;

    async function loadProfileDashboard() {
      setLoading(true);
      setErrorMessage("");

      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (ignore) return;

        if (userError || !user) {
          setProfile(null);
          setProperties([]);
          setMemberships([]);
          setLoading(false);
          return;
        }

        const { data: profileRow, error: profileError } = await supabase
          .from("profiles")
          .select(
            "id, full_name, email, phone, role, agency, address, photo_url, instagram_url, facebook_url, tiktok_url, youtube_url, linkedin_url",
          )
          .eq("id", user.id)
          .maybeSingle();

        if (ignore) return;

        if (profileError) throw profileError;

        const safeProfile: ProfileRow = {
          id: user.id,
          full_name:
            profileRow?.full_name ||
            String(user.user_metadata?.full_name || "") ||
            String(user.user_metadata?.name || ""),
          email: profileRow?.email || user.email || "",
          phone: profileRow?.phone || "",
          role: profileRow?.role || "",
          agency: profileRow?.agency || "",
          address: profileRow?.address || "",
          photo_url: String(profileRow?.photo_url || "").trim(),
          instagram_url: profileRow?.instagram_url || "",
          facebook_url: profileRow?.facebook_url || "",
          tiktok_url: profileRow?.tiktok_url || "",
          youtube_url: profileRow?.youtube_url || "",
          linkedin_url: profileRow?.linkedin_url || "",
        };

        const [
          { data: propertyRows, error: propertyError },
          { data: membershipRows, error: membershipError },
        ] = await Promise.all([
          supabase
            .from("properties")
            .select(
              "id, user_id, kode, title, title_id, price, province, city, area, source, status, verification_status, transaction_status, listing_expires_at, created_at, posted_date, plan_id",
            )
            .eq("user_id", user.id)
            .order("created_at", { ascending: false }),

          supabase
            .from("agent_memberships")
            .select(
              "id, user_id, payment_id, package_id, package_name, billing_cycle, listing_limit, status, auto_renew, starts_at, expires_at, metadata, created_at, updated_at",
            )
            .eq("user_id", user.id)
            .order("created_at", { ascending: false }),
        ]);

        if (ignore) return;

        if (propertyError) throw propertyError;
        if (membershipError) throw membershipError;

        const propertyList = (propertyRows || []) as PropertyRow[];
        const propertyIds = propertyList.map((item) => item.id);

        let imageRows: PropertyImageRow[] = [];

        if (propertyIds.length > 0) {
          const { data: images, error: imageError } = await supabase
            .from("property_images")
            .select("id, property_id, image_url, sort_order, is_cover")
            .in("property_id", propertyIds);

          if (imageError) throw imageError;

          imageRows = (images || []) as PropertyImageRow[];
        }

        setProfile(safeProfile);
        setProperties(attachImages(propertyList, imageRows));
        setMemberships((membershipRows || []) as AgentMembershipRow[]);
        setLoading(false);
      } catch (error: any) {
        if (!ignore) {
          console.log("Tetamo mobile profile dashboard error:", error);
          setErrorMessage(
            error?.message ||
              (isId ? "Gagal memuat profile." : "Failed to load profile."),
          );
          setLoading(false);
        }
      }
    }

    void loadProfileDashboard();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      void loadProfileDashboard();
    });

    return () => {
      ignore = true;
      subscription.unsubscribe();
    };
  }, [isId]);

  async function handleLogout() {
    await supabase.auth.signOut();
    setProfile(null);
    setProperties([]);
    setMemberships([]);
    router.replace("/login" as any);
  }

  function routeOwnerAddListing() {
    if (isIOS) {
      router.push("/search" as any);
      return;
    }

    router.push("/add-listing?audience=owner" as any);
  }

  function routeAgentCreateListing() {
    if (isIOS) {
      router.push("/search" as any);
      return;
    }

    if (!activeMembership) {
      router.push("/agent/packages" as any);
      return;
    }

    router.push("/agent/create-listing" as any);
  }

  function routeEditListing(item: ListingCardRow) {
    const kode = String(item.kode || "");

    if (!kode || kode === "-") {
      Alert.alert(isId ? "Kode tidak ditemukan." : "Listing code not found.");
      return;
    }

    if (String(item.source || "") === "agent") {
      router.push(`/agent/edit-listing/${encodeURIComponent(kode)}` as any);
      return;
    }

    router.push(`/owner/edit-listing/${encodeURIComponent(kode)}` as any);
  }

  async function openSocial(url: string) {
    const finalUrl = normalizeExternalUrl(url);

    if (!finalUrl) return;

    const canOpen = await Linking.canOpenURL(finalUrl);

    if (!canOpen) {
      Alert.alert(isId ? "Link tidak valid." : "Invalid link.", finalUrl);
      return;
    }

    await Linking.openURL(finalUrl);
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="light" />

        <View style={styles.loadingBox}>
          <ActivityIndicator color="#e6c15c" />
          <Text style={styles.loadingText}>
            {isId ? "Memuat profile..." : "Loading profile..."}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!profile) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="light" />

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.guestContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.guestCard}>
            <View style={styles.logoCircle}>
              <UserRound color="#e6c15c" size={34} />
            </View>

            <Text style={styles.guestTitle}>
              {isId ? "Masuk ke Tetamo" : "Log in to Tetamo"}
            </Text>

            <Text style={styles.guestText}>
              {isIOS
                ? isId
                  ? "Login untuk mengelola akun, melihat listing, leads, jadwal viewing, properti tersimpan, dan aktivitas Tetamo Anda."
                  : "Log in to manage your account, view listings, leads, viewing schedules, saved properties, and Tetamo activity."
                : isId
                  ? "Login untuk mengelola akun, listing, paket, pembayaran, dan dashboard Tetamo Anda."
                  : "Log in to manage your account, listings, packages, payments, and Tetamo dashboard."}
            </Text>

            <View style={styles.guestButtons}>
              <Pressable
                style={styles.primaryButton}
                onPress={() => router.push("/login" as any)}
              >
                <LogIn color="#111111" size={17} />
                <Text style={styles.primaryButtonText}>
                  {isId ? "Login" : "Log In"}
                </Text>
              </Pressable>

              <Pressable
                style={styles.secondaryButton}
                onPress={() => router.push("/signup" as any)}
              >
                <Text style={styles.secondaryButtonText}>
                  {isId ? "Daftar" : "Sign Up"}
                </Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  const displayName =
    profile.full_name || (isId ? "Pengguna Tetamo" : "Tetamo User");
  const displayLocation = profile.address || "-";
  const displayEmail = profile.email || "-";
  const displayPhone = profile.phone || "-";
  const displayAgency = profile.agency || "-";
  const showAvatarImage = Boolean(avatarUrl) && !avatarLoadFailed;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />

      <View style={styles.topBar}>
        <View>
          <Text style={styles.topTitle}>Profile</Text>
          <Text style={styles.topSub}>
            {isId ? "Dashboard mobile Tetamo" : "Tetamo mobile dashboard"}
          </Text>
        </View>

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

        <View style={styles.profileCard}>
          <View style={styles.profileTop}>
            <View style={styles.avatar}>
              {showAvatarImage ? (
                <Image
                  key={avatarUrl}
                  source={{ uri: avatarUrl }}
                  style={styles.avatarImage}
                  resizeMode="cover"
                  onError={(error) => {
                    console.log("PROFILE IMAGE LOAD ERROR:", error.nativeEvent);
                    setAvatarLoadFailed(true);
                  }}
                />
              ) : (
                <UserRound color="#e6c15c" size={34} />
              )}
            </View>

            <View style={styles.profileTextBox}>
              <View style={styles.rolePill}>
                <Text style={styles.rolePillText}>
                  {role === "owner"
                    ? isId
                      ? "PEMILIK"
                      : "OWNER"
                    : role === "agent"
                      ? "AGENT"
                      : String(role || "USER").toUpperCase()}
                </Text>
              </View>

              <Text style={styles.nameText} numberOfLines={1}>
                {displayName}
              </Text>

              <Text style={styles.agencyText} numberOfLines={1}>
                {role === "agent"
                  ? displayAgency
                  : isId
                    ? "Platform Tetamo"
                    : "Tetamo Platform"}
              </Text>

              <View style={styles.locationRow}>
                <MapPin color="#a9a9a9" size={13} />
                <Text style={styles.locationText} numberOfLines={1}>
                  {displayLocation}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.profileInfoGrid}>
            <MiniInfo label="Email" value={displayEmail} />
            <MiniInfo
              label={isId ? "WhatsApp" : "WhatsApp"}
              value={displayPhone}
            />

            {role === "agent" ? (
              <MiniInfo label="Agency" value={displayAgency} />
            ) : null}
          </View>

          {socialLinks.length > 0 ? (
            <View style={styles.socialSection}>
              <Text style={styles.socialTitle}>Social Media</Text>

              <View style={styles.socialRow}>
                {socialLinks.map((item) => (
                  <Pressable
                    key={item.label}
                    style={styles.socialPill}
                    onPress={() => void openSocial(item.url)}
                  >
                    <Text style={styles.socialPillText}>{item.label}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          ) : null}
        </View>

        {role === "owner" ? (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                {isId ? "Dashboard Pemilik" : "Owner Dashboard"}
              </Text>
            </View>

            <View style={styles.statsGrid}>
              <StatCard
                icon={<Home color="#e6c15c" size={18} />}
                label={isId ? "Total Iklan" : "Total Listings"}
                value={String(ownerStats.total)}
              />
              <StatCard
                icon={<CheckCircle2 color="#22c55e" size={18} />}
                label={isId ? "Aktif" : "Active"}
                value={String(ownerStats.active)}
              />
              <StatCard
                icon={<Clock3 color="#f59e0b" size={18} />}
                label={isId ? "Pending" : "Pending"}
                value={String(ownerStats.pending)}
              />
            </View>

            <View style={styles.toolGrid}>
              {!isIOS ? (
                <ToolCard
                  icon={<Plus color="#111111" size={20} />}
                  title={isId ? "Pasang Iklan" : "Add Listing"}
                  subtitle={isId ? "Buat listing baru" : "Create new listing"}
                  featured
                  onPress={routeOwnerAddListing}
                />
              ) : null}

              <ToolCard
                icon={<Home color="#ffffff" size={20} />}
                title={isId ? "Iklan Saya" : "My Listings"}
                subtitle={
                  isId ? "Edit & kelola iklan" : "Edit & manage listings"
                }
                onPress={() =>
                  router.push("/dashboard/listings?role=owner" as any)
                }
              />

              <ToolCard
                icon={<MessageCircle color="#ffffff" size={20} />}
                title="Leads"
                subtitle={
                  isId ? "Inquiry buyer/renter" : "Buyer/renter inquiries"
                }
                onPress={() =>
                  router.push("/dashboard/leads?role=owner" as any)
                }
              />

              {!isIOS ? (
                <ToolCard
                  icon={<ReceiptText color="#ffffff" size={20} />}
                  title="Payment / Receipt"
                  subtitle={
                    isId ? "Tagihan & bukti bayar" : "Billing and receipts"
                  }
                  onPress={() => router.push("/dashboard/payments" as any)}
                />
              ) : null}

              <ToolCard
                icon={<Bookmark color="#ffffff" size={20} />}
                title={isId ? "Tersimpan" : "Saved"}
                subtitle={isId ? "Properti tersimpan" : "Saved properties"}
                onPress={() => router.push("/dashboard/saved" as any)}
              />

              <ToolCard
                icon={<Heart color="#ffffff" size={20} />}
                title={isId ? "Disukai" : "Liked"}
                subtitle={isId ? "Properti disukai" : "Liked properties"}
                onPress={() => router.push("/dashboard/liked" as any)}
              />
            </View>

            <ListingPreview
              title={isId ? "Iklan Terbaru" : "Latest Listings"}
              emptyText={
                isId
                  ? "Belum ada iklan untuk akun ini."
                  : "No listings found for this account."
              }
              listings={ownerListings.slice(0, 4)}
              language={language}
              onEdit={routeEditListing}
            />
          </>
        ) : null}

        {role === "agent" ? (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                {isId ? "Dashboard Agent" : "Agent Dashboard"}
              </Text>
            </View>

            {!isIOS ? (
              <View style={styles.membershipCard}>
                <View style={styles.membershipTop}>
                  <View style={styles.membershipIcon}>
                    <ShieldCheck color="#60a5fa" size={21} />
                  </View>

                  <View style={styles.membershipTextBox}>
                    <Text style={styles.membershipTitle}>
                      {activeMembership
                        ? isId
                          ? "Membership Aktif"
                          : "Active Membership"
                        : isId
                          ? "Membership Belum Aktif"
                          : "Membership Not Active"}
                    </Text>
                    <Text style={styles.membershipSub}>
                      {latestMembership?.package_name ||
                        latestMembership?.package_id ||
                        (isId ? "Pilih paket agen" : "Choose agent package")}
                    </Text>
                  </View>
                </View>

                <View style={styles.membershipStats}>
                  <MiniStat
                    label="Billing"
                    value={getBillingCycleLabel(
                      latestMembership?.billing_cycle,
                      language,
                    )}
                  />
                  <MiniStat
                    label={isId ? "Expired" : "Expires"}
                    value={formatDate(latestMembership?.expires_at, language)}
                  />
                  <MiniStat
                    label="Limit"
                    value={String(agentListingLimit || 0)}
                  />
                  <MiniStat
                    label={isId ? "Sisa" : "Remaining"}
                    value={String(remainingAgentSlots || 0)}
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
                        ? "Pilih Paket Agent"
                        : "Choose Agent Package"}
                  </Text>
                  <ChevronRight color="#111111" size={15} />
                </Pressable>
              </View>
            ) : null}

            <View style={styles.statsGrid}>
              <StatCard
                icon={<Home color="#e6c15c" size={18} />}
                label={isId ? "Total Listing" : "Total Listings"}
                value={String(agentStats.total)}
              />
              {!isIOS ? (
                <StatCard
                  icon={<Wallet color="#22c55e" size={18} />}
                  label={isId ? "Terpakai" : "Used Slots"}
                  value={String(usedAgentSlots)}
                />
              ) : null}
              <StatCard
                icon={<Clock3 color="#f59e0b" size={18} />}
                label="Pending"
                value={String(agentStats.pending)}
              />
            </View>

            <View style={styles.toolGrid}>
              {!isIOS ? (
                <ToolCard
                  icon={<Plus color="#111111" size={20} />}
                  title={isId ? "Pasang Iklan" : "Add Listing"}
                  subtitle={isId ? "Buat listing agent" : "Create agent listing"}
                  featured
                  onPress={routeAgentCreateListing}
                />
              ) : null}

              <ToolCard
                icon={<Bot color="#ffffff" size={20} />}
                title="AI Social Media"
                subtitle={
                  isId ? "Caption & konten agent" : "Captions and content tools"
                }
                onPress={() => router.push("/agent/ai-social" as any)}
              />

              <ToolCard
                icon={<Home color="#ffffff" size={20} />}
                title={isId ? "Listing Saya" : "My Listings"}
                subtitle={
                  isId ? "Kelola listing agent" : "Manage agent listings"
                }
                onPress={() =>
                  router.push("/dashboard/listings?role=agent" as any)
                }
              />

              <ToolCard
                icon={<MessageCircle color="#ffffff" size={20} />}
                title="Leads"
                subtitle={isId ? "Kelola inquiry" : "Manage inquiries"}
                onPress={() =>
                  router.push("/dashboard/leads?role=agent" as any)
                }
              />

              <ToolCard
                icon={<CalendarDays color="#ffffff" size={20} />}
                title={isId ? "Jadwal Viewing" : "Viewing Schedule"}
                subtitle={isId ? "Atur jadwal viewing" : "Manage viewings"}
                onPress={() =>
                  router.push("/dashboard/viewing-schedule" as any)
                }
              />

              {!isIOS ? (
                <ToolCard
                  icon={<ReceiptText color="#ffffff" size={20} />}
                  title={isId ? "Tagihan" : "Billing"}
                  subtitle={isId ? "Payment & receipt" : "Payment and receipts"}
                  onPress={() => router.push("/dashboard/payments" as any)}
                />
              ) : null}

              <ToolCard
                icon={<Bookmark color="#ffffff" size={20} />}
                title={isId ? "Tersimpan" : "Saved"}
                subtitle={isId ? "Properti tersimpan" : "Saved properties"}
                onPress={() => router.push("/dashboard/saved" as any)}
              />

              <ToolCard
                icon={<Heart color="#ffffff" size={20} />}
                title={isId ? "Disukai" : "Liked"}
                subtitle={isId ? "Properti disukai" : "Liked properties"}
                onPress={() => router.push("/dashboard/liked" as any)}
              />

              {!isIOS ? (
                <ToolCard
                  icon={<BarChart3 color="#ffffff" size={20} />}
                  title={isId ? "Komisi" : "Commission"}
                  subtitle={isId ? "Tracking komisi" : "Commission tracking"}
                  onPress={() => router.push("/dashboard/commission" as any)}
                />
              ) : null}
            </View>

            <ListingPreview
              title={isId ? "Listing Agent Terbaru" : "Latest Agent Listings"}
              emptyText={
                isId
                  ? "Belum ada listing agent untuk akun ini."
                  : "No agent listings found for this account."
              }
              listings={agentListings.slice(0, 4)}
              language={language}
              onEdit={routeEditListing}
            />
          </>
        ) : null}

        {role !== "owner" && role !== "agent" ? (
          <View style={styles.unsupportedCard}>
            <Text style={styles.unsupportedTitle}>
              {isId ? "Role belum tersedia" : "Role not supported yet"}
            </Text>
            <Text style={styles.unsupportedText}>
              {isId
                ? "Dashboard mobile saat ini disiapkan untuk Owner dan Agent."
                : "The mobile dashboard is currently prepared for Owners and Agents."}
            </Text>
          </View>
        ) : null}

        <View style={styles.accountCard}>
          <Text style={styles.accountTitle}>{isId ? "Akun" : "Account"}</Text>

          <ToolRow
            icon={<Settings color="#ffffff" size={18} />}
            title={isId ? "Pengaturan" : "Settings"}
            subtitle={isId ? "Update profile" : "Update profile"}
            onPress={() => router.push("/dashboard/settings" as any)}
          />

          <ToolRow
            icon={<LogOut color="#fecaca" size={18} />}
            title={isId ? "Logout" : "Log Out"}
            subtitle={isId ? "Keluar dari akun Tetamo" : "Sign out of Tetamo"}
            danger
            onPress={handleLogout}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function MiniInfo({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.miniInfo}>
      <Text style={styles.miniInfoLabel}>{label}</Text>
      <Text style={styles.miniInfoValue} numberOfLines={1}>
        {value}
      </Text>
    </View>
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
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function ToolCard({
  icon,
  title,
  subtitle,
  featured,
  onPress,
}: {
  icon: ReactNode;
  title: string;
  subtitle: string;
  featured?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={[styles.toolCard, featured && styles.toolCardFeatured]}
      onPress={onPress}
    >
      <View style={[styles.toolIcon, featured && styles.toolIconFeatured]}>
        {icon}
      </View>

      <Text
        style={[styles.toolTitle, featured && styles.toolTitleFeatured]}
        numberOfLines={1}
      >
        {title}
      </Text>
      <Text
        style={[styles.toolSubtitle, featured && styles.toolSubtitleFeatured]}
        numberOfLines={2}
      >
        {subtitle}
      </Text>
    </Pressable>
  );
}

function ToolRow({
  icon,
  title,
  subtitle,
  danger,
  onPress,
}: {
  icon: ReactNode;
  title: string;
  subtitle: string;
  danger?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.toolRow} onPress={onPress}>
      <View style={[styles.toolRowIcon, danger && styles.toolRowIconDanger]}>
        {icon}
      </View>

      <View style={styles.toolRowTextBox}>
        <Text
          style={[styles.toolRowTitle, danger && styles.toolRowTitleDanger]}
        >
          {title}
        </Text>
        <Text style={styles.toolRowSubtitle}>{subtitle}</Text>
      </View>

      <ChevronRight color={danger ? "#fecaca" : "#ffffff"} size={16} />
    </Pressable>
  );
}

function ListingPreview({
  title,
  emptyText,
  listings,
  language,
  onEdit,
}: {
  title: string;
  emptyText: string;
  listings: ListingCardRow[];
  language: Language;
  onEdit: (item: ListingCardRow) => void;
}) {
  return (
    <View style={styles.listingSection}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>

      {listings.length === 0 ? (
        <View style={styles.emptyBox}>
          <FileText color="#777777" size={22} />
          <Text style={styles.emptyText}>{emptyText}</Text>
        </View>
      ) : (
        <View style={styles.listingList}>
          {listings.map((item) => (
            <View key={item.id} style={styles.listingCard}>
              <Image
                source={{ uri: item.photo || FALLBACK_PHOTO }}
                style={styles.listingImage}
              />

              <View style={styles.listingTextBox}>
                <Text style={styles.listingTitle} numberOfLines={1}>
                  {language === "id"
                    ? item.title_id || item.title || "-"
                    : item.title || item.title_id || "-"}
                </Text>

                <Text style={styles.listingMeta} numberOfLines={1}>
                  {item.city || item.area || item.province || "-"} •{" "}
                  {item.kode || "-"}
                </Text>

                <Text style={styles.listingPrice}>{formatIdr(item.price)}</Text>

                <View style={styles.listingBottomRow}>
                  <View style={styles.statusPill}>
                    <Text style={styles.statusPillText}>
                      {getStatusLabel(item, language)}
                    </Text>
                  </View>

                  <Pressable
                    style={styles.editButton}
                    onPress={() => onEdit(item)}
                  >
                    <Pencil color="#111111" size={13} />
                    <Text style={styles.editButtonText}>Edit</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          ))}
        </View>
      )}
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
  topBar: {
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 10,
    backgroundColor: "#050505",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  topTitle: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: -0.2,
  },
  topSub: {
    color: "#9b9b9b",
    fontSize: 10.5,
    fontWeight: "700",
    marginTop: 2,
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
    paddingBottom: 36,
  },
  guestContent: {
    flexGrow: 1,
    paddingHorizontal: 18,
    paddingBottom: 36,
    justifyContent: "center",
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
  guestCard: {
    borderRadius: 30,
    borderWidth: 1,
    borderColor: "#303030",
    backgroundColor: "#101010",
    padding: 22,
    alignItems: "center",
  },
  logoCircle: {
    width: 76,
    height: 76,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#705d2c",
    backgroundColor: "#211a0b",
    alignItems: "center",
    justifyContent: "center",
  },
  guestTitle: {
    color: "#ffffff",
    fontSize: 25,
    lineHeight: 31,
    fontWeight: "900",
    textAlign: "center",
    marginTop: 16,
  },
  guestText: {
    color: "#b8b8b8",
    fontSize: 12.5,
    lineHeight: 19,
    fontWeight: "700",
    textAlign: "center",
    marginTop: 8,
  },
  guestButtons: {
    width: "100%",
    gap: 10,
    marginTop: 20,
  },
  primaryButton: {
    minHeight: 50,
    borderRadius: 17,
    backgroundColor: "#e6c15c",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    paddingHorizontal: 14,
  },
  primaryButtonText: {
    color: "#111111",
    fontSize: 13,
    fontWeight: "900",
  },
  secondaryButton: {
    minHeight: 50,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: "#303030",
    backgroundColor: "#050505",
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryButtonText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "900",
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
  profileCard: {
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "#303030",
    backgroundColor: "#101010",
    padding: 15,
    marginBottom: 14,
  },
  profileTop: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#705d2c",
    backgroundColor: "#211a0b",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
  },
  profileTextBox: {
    flex: 1,
  },
  rolePill: {
    alignSelf: "flex-start",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#705d2c",
    backgroundColor: "#211a0b",
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  rolePillText: {
    color: "#e6c15c",
    fontSize: 8.8,
    fontWeight: "900",
    letterSpacing: 0.8,
  },
  nameText: {
    color: "#ffffff",
    fontSize: 19,
    fontWeight: "900",
    marginTop: 7,
  },
  agencyText: {
    color: "#d6d6d6",
    fontSize: 11.5,
    fontWeight: "800",
    marginTop: 3,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  locationText: {
    color: "#a9a9a9",
    fontSize: 11.5,
    fontWeight: "700",
    flex: 1,
  },
  profileInfoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 14,
  },
  miniInfo: {
    width: "48.5%",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#252525",
    backgroundColor: "#050505",
    padding: 10,
  },
  miniInfoLabel: {
    color: "#777777",
    fontSize: 9.5,
    fontWeight: "800",
  },
  miniInfoValue: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "900",
    marginTop: 4,
  },
  socialSection: {
    marginTop: 14,
    borderTopWidth: 1,
    borderTopColor: "#202020",
    paddingTop: 13,
  },
  socialTitle: {
    color: "#ffffff",
    fontSize: 11.5,
    fontWeight: "900",
    marginBottom: 9,
  },
  socialRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  socialPill: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#5b4a24",
    backgroundColor: "#211a0b",
    paddingHorizontal: 11,
    paddingVertical: 7,
  },
  socialPillText: {
    color: "#e6c15c",
    fontSize: 10.5,
    fontWeight: "900",
  },
  sectionHeader: {
    marginTop: 5,
    marginBottom: 10,
  },
  sectionTitle: {
    color: "#ffffff",
    fontSize: 15.5,
    fontWeight: "900",
    letterSpacing: -0.2,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 9,
    marginBottom: 14,
  },
  statCard: {
    flex: 1,
    minWidth: "30%",
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
  toolGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 16,
  },
  toolCard: {
    width: "48.5%",
    minHeight: 118,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#303030",
    backgroundColor: "#101010",
    padding: 13,
  },
  toolCardFeatured: {
    borderColor: "#705d2c",
    backgroundColor: "#211a0b",
  },
  toolIcon: {
    width: 39,
    height: 39,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#303030",
    backgroundColor: "#050505",
    alignItems: "center",
    justifyContent: "center",
  },
  toolIconFeatured: {
    backgroundColor: "#e6c15c",
    borderColor: "#e6c15c",
  },
  toolTitle: {
    color: "#ffffff",
    fontSize: 12.5,
    fontWeight: "900",
    marginTop: 11,
  },
  toolTitleFeatured: {
    color: "#ffffff",
  },
  toolSubtitle: {
    color: "#9b9b9b",
    fontSize: 10.3,
    lineHeight: 14,
    fontWeight: "700",
    marginTop: 4,
  },
  toolSubtitleFeatured: {
    color: "#d8d8d8",
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
  listingSection: {
    marginBottom: 16,
  },
  emptyBox: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#303030",
    backgroundColor: "#101010",
    padding: 18,
    alignItems: "center",
    gap: 8,
  },
  emptyText: {
    color: "#9b9b9b",
    fontSize: 11.5,
    lineHeight: 16,
    fontWeight: "700",
    textAlign: "center",
  },
  listingList: {
    gap: 10,
  },
  listingCard: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#303030",
    backgroundColor: "#101010",
    padding: 10,
    flexDirection: "row",
    gap: 11,
  },
  listingImage: {
    width: 130,
    height: 92,
    borderRadius: 17,
    backgroundColor: "#050505",
  },
  listingTextBox: {
    flex: 1,
  },
  listingTitle: {
    color: "#ffffff",
    fontSize: 12.8,
    fontWeight: "900",
  },
  listingMeta: {
    color: "#9b9b9b",
    fontSize: 10.5,
    fontWeight: "700",
    marginTop: 4,
  },
  listingPrice: {
    color: "#e6c15c",
    fontSize: 12.5,
    fontWeight: "900",
    marginTop: 5,
  },
  listingBottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    marginTop: 8,
  },
  statusPill: {
    flex: 1,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#303030",
    backgroundColor: "#050505",
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  statusPillText: {
    color: "#d6d6d6",
    fontSize: 9.5,
    fontWeight: "800",
    textAlign: "center",
  },
  editButton: {
    borderRadius: 999,
    backgroundColor: "#e6c15c",
    paddingHorizontal: 10,
    paddingVertical: 7,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  editButtonText: {
    color: "#111111",
    fontSize: 10,
    fontWeight: "900",
  },
  accountCard: {
    borderRadius: 26,
    borderWidth: 1,
    borderColor: "#303030",
    backgroundColor: "#101010",
    padding: 14,
  },
  accountTitle: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "900",
    marginBottom: 8,
  },
  toolRow: {
    minHeight: 62,
    borderTopWidth: 1,
    borderTopColor: "#202020",
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    paddingVertical: 10,
  },
  toolRowIcon: {
    width: 40,
    height: 40,
    borderRadius: 15,
    backgroundColor: "#050505",
    borderWidth: 1,
    borderColor: "#303030",
    alignItems: "center",
    justifyContent: "center",
  },
  toolRowIconDanger: {
    borderColor: "#7f1d1d",
    backgroundColor: "#2a0d0d",
  },
  toolRowTextBox: {
    flex: 1,
  },
  toolRowTitle: {
    color: "#ffffff",
    fontSize: 12.5,
    fontWeight: "900",
  },
  toolRowTitleDanger: {
    color: "#fecaca",
  },
  toolRowSubtitle: {
    color: "#8f8f8f",
    fontSize: 10.5,
    fontWeight: "700",
    marginTop: 3,
  },
  unsupportedCard: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#303030",
    backgroundColor: "#101010",
    padding: 16,
    marginBottom: 16,
  },
  unsupportedTitle: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "900",
  },
  unsupportedText: {
    color: "#a9a9a9",
    fontSize: 11.5,
    lineHeight: 16,
    fontWeight: "700",
    marginTop: 5,
  },
});
