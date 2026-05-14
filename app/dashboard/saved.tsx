import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
    ArrowLeft,
    Bath,
    BedDouble,
    Bookmark,
    Building2,
    Clock3,
    ExternalLink,
    MapPin,
    Ruler,
    Trash2,
} from "lucide-react-native";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
    Pressable,
    RefreshControl,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { supabase } from "../../lib/supabase";

type Language = "en" | "id";
type SupportedCurrency = "IDR" | "USD" | "AUD";
type RentalType = "monthly" | "yearly" | "";

type SavedRow = {
  property_id: string;
};

type PropertyImageRow = {
  image_url: string;
  sort_order: number | null;
  is_cover: boolean | null;
};

type PropertyRow = {
  id: string;
  kode: string | null;
  posted_date: string | null;
  created_at: string | null;
  title: string | null;
  title_id: string | null;
  price: number | null;
  province: string | null;
  city: string | null;
  area: string | null;
  building_size: number | null;
  land_size: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  furnishing: string | null;
  listing_type: string | null;
  rental_type: string | null;
  property_type: string | null;
  source: string | null;
  status: string | null;
  verification_status: string | null;
  verified_ok: boolean | null;
  is_paused: boolean | null;
  listing_expires_at: string | null;
  transaction_status: string | null;
  property_images: PropertyImageRow[] | null;
};

type SavedProperty = {
  id: string;
  kode: string;
  title: string;
  priceValue: number;
  province: string;
  area: string;
  location: string;
  size: string;
  beds: string;
  baths: string;
  furnished: string;
  propertyType: string;
  listingType: "dijual" | "disewa";
  rentalType: RentalType;
  postedDate: string;
  image: string;
  isAvailable: boolean;
};

const IDR_PER_USD = 16500;
const IDR_PER_AUD = 12072;

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1000&auto=format&fit=crop";

function formatIdr(value: number | null | undefined) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function formatUsd(value: number | null | undefined) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Number(value || 0) / IDR_PER_USD);
}

function formatAud(value: number | null | undefined) {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    maximumFractionDigits: 0,
  }).format(Number(value || 0) / IDR_PER_AUD);
}

function formatPriceByCurrency(
  value: number | null | undefined,
  currency: SupportedCurrency
) {
  if (currency === "USD") return formatUsd(value);
  if (currency === "AUD") return formatAud(value);
  return formatIdr(value);
}

function formatSecondaryPrice(
  value: number | null | undefined,
  currency: SupportedCurrency
) {
  if (currency === "USD" || currency === "AUD") return formatIdr(value);
  return `${formatUsd(value)} · ${formatAud(value)}`;
}

function formatPostedDate(value?: string | null) {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function normalizeRentalType(value?: string | null): RentalType {
  const v = String(value || "").trim().toLowerCase();

  if (v === "monthly" || v === "bulanan") return "monthly";
  if (v === "yearly" || v === "tahunan") return "yearly";

  return "";
}

function getRentalTypeLabel(rentalType: RentalType, language: Language) {
  if (rentalType === "monthly") {
    return language === "id" ? "Bulanan" : "Monthly";
  }

  if (rentalType === "yearly") {
    return language === "id" ? "Tahunan" : "Yearly";
  }

  return "";
}

function formatFurnishing(value?: string | null, language?: Language) {
  const v = String(value || "").trim().toLowerCase();

  if (!v) return "-";
  if (v === "full") return language === "id" ? "Full Furnish" : "Full Furnished";
  if (v === "semi") return language === "id" ? "Semi Furnish" : "Semi Furnished";
  if (v === "unfurnished") return "Unfurnished";

  return value || "-";
}

function formatPropertyType(value?: string | null, language?: Language) {
  const raw = String(value || "").trim().toLowerCase();

  if (!raw) return language === "id" ? "Properti" : "Property";

  if (raw === "tanah") return language === "id" ? "Tanah" : "Land";
  if (raw === "rumah") return language === "id" ? "Rumah" : "House";
  if (raw === "villa") return "Villa";
  if (raw === "apartemen" || raw === "apartment") {
    return language === "id" ? "Apartemen" : "Apartment";
  }
  if (raw === "ruko") return language === "id" ? "Ruko" : "Shophouse";
  if (raw === "rukan") return language === "id" ? "Rukan" : "Office Unit";
  if (raw === "gudang") return language === "id" ? "Gudang" : "Warehouse";
  if (raw === "kantor") return language === "id" ? "Kantor" : "Office";
  if (raw === "hotel") return "Hotel";
  if (raw === "kost" || raw === "kos") {
    return language === "id" ? "Kos" : "Boarding House";
  }

  return raw
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function normalizeTransactionStatus(value?: string | null) {
  const v = String(value || "").trim().toLowerCase();

  if (v === "sold") return "sold";
  if (v === "rented") return "rented";

  return "available";
}

function isFutureDate(value?: string | null) {
  if (!value) return false;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;

  return date.getTime() > Date.now();
}

function isPropertyAvailable(row: PropertyRow) {
  if (row.status === "rejected") return false;
  if (row.is_paused) return false;

  if (normalizeTransactionStatus(row.transaction_status) !== "available") {
    return false;
  }

  if (row.listing_expires_at && !isFutureDate(row.listing_expires_at)) {
    return false;
  }

  return true;
}

function getCoverImage(row: PropertyRow) {
  const sortedImages = [...(row.property_images || [])].sort((a, b) => {
    const coverA = a.is_cover ? 1 : 0;
    const coverB = b.is_cover ? 1 : 0;

    if (coverA !== coverB) return coverB - coverA;

    return (a.sort_order || 0) - (b.sort_order || 0);
  });

  return sortedImages[0]?.image_url || FALLBACK_IMAGE;
}

function buildLocation(row: PropertyRow) {
  const parts = [row.area || row.city, row.province].filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : "-";
}

function mapSavedProperty(row: PropertyRow, language: Language): SavedProperty {
  const title =
    language === "id"
      ? row.title_id || row.title || "-"
      : row.title || row.title_id || "-";

  return {
    id: row.id,
    kode: row.kode || "-",
    title,
    priceValue: Number(row.price || 0),
    province: row.province || "-",
    area: row.city || row.area || "-",
    location: buildLocation(row),
    size: `${row.building_size || row.land_size || 0} m²`,
    beds: `${row.bedrooms || 0}`,
    baths: `${row.bathrooms || 0}`,
    furnished: formatFurnishing(row.furnishing, language),
    propertyType: formatPropertyType(row.property_type, language),
    listingType: row.listing_type === "disewa" ? "disewa" : "dijual",
    rentalType: normalizeRentalType(row.rental_type),
    postedDate: formatPostedDate(row.posted_date || row.created_at),
    image: getCoverImage(row),
    isAvailable: isPropertyAvailable(row),
  };
}

export default function DashboardSavedScreen() {
  const router = useRouter();

  const [language, setLanguage] = useState<Language>("en");
  const [currency, setCurrency] = useState<SupportedCurrency>("IDR");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [items, setItems] = useState<SavedProperty[]>([]);
  const [errorMessage, setErrorMessage] = useState("");

  const isId = language === "id";

  const ui = useMemo(() => {
    if (isId) {
      return {
        back: "Kembali",
        pageTitle: "Properti Tersimpan",
        pageSubtitle: "Semua properti yang Anda simpan akan muncul di sini.",
        loading: "Memuat properti tersimpan...",
        emptyTitle: "Belum ada properti tersimpan",
        emptyDesc:
          "Simpan properti dari marketplace agar mudah Anda lihat lagi nanti.",
        goMarketplace: "Ke Marketplace",
        remove: "Hapus",
        viewDetail: "Lihat Detail",
        posted: "Listing",
        available: "Masih tersedia",
        unavailable: "Tidak tersedia",
        forSale: "Dijual",
        forRent: "Disewa",
        loginRequired: "Silakan login terlebih dahulu.",
        removeFailed: "Gagal menghapus properti tersimpan.",
        totalSaved: "Total tersimpan",
      };
    }

    return {
      back: "Back",
      pageTitle: "Saved Properties",
      pageSubtitle: "All properties you saved will appear here.",
      loading: "Loading saved properties...",
      emptyTitle: "No saved properties yet",
      emptyDesc:
        "Save properties from the marketplace so you can return to them later.",
      goMarketplace: "Go to Marketplace",
      remove: "Remove",
      viewDetail: "View Detail",
      posted: "Listing",
      available: "Still available",
      unavailable: "Unavailable",
      forSale: "For Sale",
      forRent: "For Rent",
      loginRequired: "Please log in first.",
      removeFailed: "Failed to remove saved property.",
      totalSaved: "Total saved",
    };
  }, [isId]);

  const loadSaved = useCallback(async () => {
    setErrorMessage("");

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setCurrentUserId(null);
      setItems([]);
      setLoading(false);
      setRefreshing(false);
      router.replace("/login" as any);
      return;
    }

    setCurrentUserId(user.id);

    const { data: savedRows, error: savedError } = await supabase
      .from("saved_properties")
      .select("property_id")
      .eq("user_id", user.id);

    if (savedError) {
      setItems([]);
      setErrorMessage(savedError.message);
      setLoading(false);
      setRefreshing(false);
      return;
    }

    const propertyIds = Array.from(
      new Set(((savedRows || []) as SavedRow[]).map((row) => row.property_id))
    ).filter(Boolean);

    if (propertyIds.length === 0) {
      setItems([]);
      setLoading(false);
      setRefreshing(false);
      return;
    }

    const { data: propertyRows, error: propertyError } = await supabase
      .from("properties")
      .select(
        `
          id,
          kode,
          posted_date,
          created_at,
          title,
          title_id,
          price,
          province,
          city,
          area,
          building_size,
          land_size,
          bedrooms,
          bathrooms,
          furnishing,
          listing_type,
          rental_type,
          property_type,
          source,
          status,
          verification_status,
          verified_ok,
          is_paused,
          listing_expires_at,
          transaction_status,
          property_images (
            image_url,
            sort_order,
            is_cover
          )
        `
      )
      .in("id", propertyIds);

    if (propertyError) {
      setItems([]);
      setErrorMessage(propertyError.message);
      setLoading(false);
      setRefreshing(false);
      return;
    }

    const propertyMap = new Map<string, SavedProperty>();

    ((propertyRows || []) as PropertyRow[]).forEach((row) => {
      propertyMap.set(row.id, mapSavedProperty(row, language));
    });

    const orderedItems = propertyIds
      .map((id) => propertyMap.get(id))
      .filter(Boolean) as SavedProperty[];

    setItems(orderedItems);
    setLoading(false);
    setRefreshing(false);
  }, [language, router]);

  useEffect(() => {
    void loadSaved();
  }, [loadSaved]);

  async function handleRefresh() {
    setRefreshing(true);
    await loadSaved();
  }

  async function handleRemove(propertyId: string) {
    if (!currentUserId) {
      Alert.alert(ui.loginRequired);
      return;
    }

    const previous = items;

    setRemovingId(propertyId);
    setItems((prev) => prev.filter((item) => item.id !== propertyId));

    const { error } = await supabase
      .from("saved_properties")
      .delete()
      .eq("user_id", currentUserId)
      .eq("property_id", propertyId);

    if (error) {
      setItems(previous);
      Alert.alert(ui.removeFailed, error.message);
    }

    setRemovingId(null);
  }

  function openDetail(propertyId: string) {
    router.push(`/properti/${propertyId}` as any);
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />

      <View style={styles.topBar}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft color="#ffffff" size={15} />
          <Text style={styles.backText}>{ui.back}</Text>
        </Pressable>

        <View style={styles.topControls}>
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

          <View style={styles.currencyToggle}>
            {(["IDR", "USD", "AUD"] as SupportedCurrency[]).map((item) => (
              <Pressable
                key={item}
                style={[
                  styles.currencyButton,
                  currency === item && styles.currencyButtonActive,
                ]}
                onPress={() => setCurrency(item)}
              >
                <Text
                  style={[
                    styles.currencyText,
                    currency === item && styles.currencyTextActive,
                  ]}
                >
                  {item}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            tintColor="#e6c15c"
            refreshing={refreshing}
            onRefresh={handleRefresh}
          />
        }
      >
        <View style={styles.heroCard}>
          <View style={styles.heroIcon}>
            <Bookmark color="#111111" size={24} />
          </View>

          <Text style={styles.heroTitle}>{ui.pageTitle}</Text>
          <Text style={styles.heroSubtitle}>{ui.pageSubtitle}</Text>

          <View style={styles.totalPill}>
            <Bookmark color="#e6c15c" size={14} />
            <Text style={styles.totalPillText}>
              {ui.totalSaved}: {items.length}
            </Text>
          </View>
        </View>

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator color="#e6c15c" />
            <Text style={styles.loadingText}>{ui.loading}</Text>
          </View>
        ) : null}

        {!loading && errorMessage ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        ) : null}

        {!loading && !errorMessage && items.length === 0 ? (
          <View style={styles.emptyBox}>
            <Bookmark color="#a9a9a9" size={30} />
            <Text style={styles.emptyTitle}>{ui.emptyTitle}</Text>
            <Text style={styles.emptyDesc}>{ui.emptyDesc}</Text>

            <Pressable
              style={styles.marketplaceButton}
              onPress={() => router.push("/property" as any)}
            >
              <Building2 color="#111111" size={15} />
              <Text style={styles.marketplaceButtonText}>
                {ui.goMarketplace}
              </Text>
            </Pressable>
          </View>
        ) : null}

        <View style={styles.list}>
          {items.map((item) => {
            const displayPrice = formatPriceByCurrency(
              item.priceValue,
              currency
            );
            const secondaryPrice = formatSecondaryPrice(
              item.priceValue,
              currency
            );
            const rentalTypeLabel = getRentalTypeLabel(
              item.rentalType,
              language
            );

            return (
              <View key={item.id} style={styles.card}>
                <View style={styles.imageWrap}>
                  <Image
                    source={{ uri: item.image || FALLBACK_IMAGE }}
                    style={styles.image}
                  />

                  <View style={styles.badgeLayer}>
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>
                        {item.listingType === "dijual"
                          ? ui.forSale
                          : ui.forRent}
                      </Text>
                    </View>

                    {item.listingType === "disewa" && rentalTypeLabel ? (
                      <View style={[styles.badge, styles.rentBadge]}>
                        <Text style={styles.badgeText}>
                          {rentalTypeLabel}
                        </Text>
                      </View>
                    ) : null}

                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{item.propertyType}</Text>
                    </View>
                  </View>

                  <View style={styles.tetamoBadge}>
                    <Text style={styles.tetamoBadgeText}>TETAMO</Text>
                  </View>
                </View>

                <View style={styles.cardBody}>
                  <Text style={styles.price}>{displayPrice}</Text>
                  <Text style={styles.secondaryPrice}>≈ {secondaryPrice}</Text>

                  <Pressable onPress={() => openDetail(item.id)}>
                    <Text style={styles.title} numberOfLines={2}>
                      {item.title}
                    </Text>
                  </Pressable>

                  <View style={styles.locationRow}>
                    <MapPin color="#a9a9a9" size={13} />
                    <Text style={styles.locationText} numberOfLines={1}>
                      {item.location}
                    </Text>
                  </View>

                  <View style={styles.metaRow}>
                    <View style={styles.metaItem}>
                      <Ruler color="#ffffff" size={13} />
                      <Text style={styles.metaText}>{item.size}</Text>
                    </View>

                    <View style={styles.metaItem}>
                      <BedDouble color="#ffffff" size={13} />
                      <Text style={styles.metaText}>{item.beds}</Text>
                    </View>

                    <View style={styles.metaItem}>
                      <Bath color="#ffffff" size={13} />
                      <Text style={styles.metaText}>{item.baths}</Text>
                    </View>
                  </View>

                  <Text style={styles.furnished}>{item.furnished}</Text>

                  <View style={styles.statusBox}>
                    <View style={styles.statusLeft}>
                      <Clock3 color="#a9a9a9" size={13} />
                      <Text style={styles.statusText}>
                        {ui.posted}: {item.postedDate}
                      </Text>
                    </View>

                    <View
                      style={[
                        styles.availabilityBadge,
                        item.isAvailable
                          ? styles.availableBadge
                          : styles.unavailableBadge,
                      ]}
                    >
                      <Text
                        style={[
                          styles.availabilityText,
                          item.isAvailable
                            ? styles.availableText
                            : styles.unavailableText,
                        ]}
                      >
                        {item.isAvailable ? ui.available : ui.unavailable}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.actions}>
                    <Pressable
                      style={styles.removeButton}
                      disabled={removingId === item.id}
                      onPress={() => void handleRemove(item.id)}
                    >
                      <Trash2 color="#ffffff" size={15} />
                      <Text style={styles.removeButtonText}>
                        {removingId === item.id ? "..." : ui.remove}
                      </Text>
                    </Pressable>

                    <Pressable
                      style={styles.detailButton}
                      onPress={() => openDetail(item.id)}
                    >
                      <ExternalLink color="#111111" size={15} />
                      <Text style={styles.detailButtonText}>
                        {ui.viewDetail}
                      </Text>
                    </Pressable>
                  </View>

                  <Text style={styles.kode}>{item.kode}</Text>
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#050505",
  },
  topBar: {
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 10,
    backgroundColor: "#050505",
    flexDirection: "row",
    alignItems: "flex-start",
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
  topControls: {
    alignItems: "flex-end",
    gap: 6,
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
  currencyToggle: {
    flexDirection: "row",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#5b4a24",
    overflow: "hidden",
  },
  currencyButton: {
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  currencyButtonActive: {
    backgroundColor: "#e6c15c",
  },
  currencyText: {
    color: "#e6c15c",
    fontSize: 9,
    fontWeight: "900",
  },
  currencyTextActive: {
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
  heroIcon: {
    width: 52,
    height: 52,
    borderRadius: 19,
    backgroundColor: "#e6c15c",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  heroTitle: {
    color: "#ffffff",
    fontSize: 25,
    lineHeight: 30,
    fontWeight: "900",
    letterSpacing: -0.5,
  },
  heroSubtitle: {
    color: "#b8b8b8",
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "700",
    marginTop: 7,
  },
  totalPill: {
    alignSelf: "flex-start",
    marginTop: 13,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#5b4a24",
    backgroundColor: "#211a0b",
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  totalPillText: {
    color: "#ffffff",
    fontSize: 11.5,
    fontWeight: "900",
  },
  loadingBox: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#303030",
    backgroundColor: "#101010",
    padding: 18,
    alignItems: "center",
    gap: 10,
  },
  loadingText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "800",
  },
  errorBox: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#7f1d1d",
    backgroundColor: "#2a0d0d",
    padding: 13,
    marginBottom: 12,
  },
  errorText: {
    color: "#fecaca",
    fontSize: 11.8,
    lineHeight: 17,
    fontWeight: "700",
  },
  emptyBox: {
    borderRadius: 26,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "#303030",
    backgroundColor: "#101010",
    padding: 24,
    alignItems: "center",
  },
  emptyTitle: {
    color: "#ffffff",
    fontSize: 17,
    fontWeight: "900",
    marginTop: 12,
    textAlign: "center",
  },
  emptyDesc: {
    color: "#a9a9a9",
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "700",
    marginTop: 7,
    textAlign: "center",
  },
  marketplaceButton: {
    marginTop: 15,
    borderRadius: 15,
    backgroundColor: "#e6c15c",
    minHeight: 44,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  marketplaceButtonText: {
    color: "#111111",
    fontSize: 12,
    fontWeight: "900",
  },
  list: {
    gap: 14,
  },
  card: {
    borderRadius: 26,
    borderWidth: 1,
    borderColor: "#303030",
    backgroundColor: "#101010",
    overflow: "hidden",
  },
  imageWrap: {
    height: 230,
    backgroundColor: "#151515",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  badgeLayer: {
    position: "absolute",
    left: 10,
    top: 10,
    right: 10,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  badge: {
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.95)",
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  rentBadge: {
    backgroundColor: "#e6c15c",
  },
  badgeText: {
    color: "#111111",
    fontSize: 9.5,
    fontWeight: "900",
  },
  tetamoBadge: {
    position: "absolute",
    right: 10,
    bottom: 10,
    borderRadius: 999,
    backgroundColor: "rgba(0,0,0,0.72)",
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  tetamoBadgeText: {
    color: "#ffffff",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.8,
  },
  cardBody: {
    padding: 14,
  },
  price: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "900",
  },
  secondaryPrice: {
    color: "#a9a9a9",
    fontSize: 11,
    fontWeight: "700",
    marginTop: 3,
  },
  title: {
    color: "#ffffff",
    fontSize: 14.5,
    lineHeight: 20,
    fontWeight: "900",
    marginTop: 9,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 5,
    marginTop: 8,
  },
  locationText: {
    color: "#a9a9a9",
    fontSize: 11.5,
    lineHeight: 16,
    fontWeight: "700",
    flex: 1,
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 11,
  },
  metaItem: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#303030",
    backgroundColor: "#050505",
    paddingHorizontal: 9,
    paddingVertical: 7,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  metaText: {
    color: "#ffffff",
    fontSize: 10.5,
    fontWeight: "900",
  },
  furnished: {
    color: "#a9a9a9",
    fontSize: 11.5,
    fontWeight: "700",
    marginTop: 9,
  },
  statusBox: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#252525",
    backgroundColor: "#050505",
    padding: 11,
    marginTop: 12,
    gap: 9,
  },
  statusLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  statusText: {
    color: "#a9a9a9",
    fontSize: 10.5,
    fontWeight: "800",
  },
  availabilityBadge: {
    alignSelf: "flex-start",
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  availableBadge: {
    backgroundColor: "#052e16",
  },
  unavailableBadge: {
    backgroundColor: "#2a0d0d",
  },
  availabilityText: {
    fontSize: 10,
    fontWeight: "900",
  },
  availableText: {
    color: "#22c55e",
  },
  unavailableText: {
    color: "#f87171",
  },
  actions: {
    flexDirection: "row",
    gap: 9,
    marginTop: 13,
  },
  removeButton: {
    flex: 1,
    minHeight: 44,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#343434",
    backgroundColor: "#050505",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },
  removeButtonText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "900",
  },
  detailButton: {
    flex: 1,
    minHeight: 44,
    borderRadius: 15,
    backgroundColor: "#e6c15c",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },
  detailButtonText: {
    color: "#111111",
    fontSize: 12,
    fontWeight: "900",
  },
  kode: {
    color: "#777777",
    fontSize: 10.5,
    fontWeight: "800",
    marginTop: 10,
  },
});