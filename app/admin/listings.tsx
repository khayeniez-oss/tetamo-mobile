import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  FileText,
  Gem,
  Home,
  MapPin,
  PauseCircle,
  Ruler,
  Search,
  Star,
  Trash2,
  XCircle,
  Zap,
} from "lucide-react-native";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
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
  TextInput,
  View,
} from "react-native";
import { supabase } from "../../lib/supabase";

type ListingStatus =
  | "PENDING"
  | "ACTIVE"
  | "FEATURED"
  | "PAUSED"
  | "REJECTED";

type OwnerPlanId =
  | "basic"
  | "priority"
  | "featured";

type RentalType =
  | ""
  | "daily"
  | "monthly"
  | "yearly";

type SaleType =
  | ""
  | "freehold"
  | "leasehold"
  | "hgb"
  | "hak_pakai"
  | "lainnya";

type AdminAction =
  | "ACTIVE"
  | "REJECTED"
  | "FEATURED"
  | "SPOTLIGHT"
  | "BOOST"
  | "PAUSED";

type ToastState =
  | {
      type: "success" | "error";
      message: string;
    }
  | null;

type Listing = {
  id: string;
  kode: string;
  title: string;
  price: string;
  city: string;
  owner: string;
  agent: string;
  postedDate: string;
  listingExpiresAt: string | null;
  status: ListingStatus;
  planId: OwnerPlanId;
  planLabel: string;
  featuredActive: boolean;
  spotlightActive: boolean;
  boostActive: boolean;
  photos: string[];

  listingType: "dijual" | "disewa";
  rentalType: RentalType;
  saleType: SaleType;
  propertyType: string;
  landSize: number | null;
  buildingSize: number | null;
  landUnit: string;
  roadAccess: string;
  ownershipType: string;
  landType: string;
  zoningType: string;
};

type PropertyImageRow = {
  image_url: string;
  sort_order: number | null;
  is_cover: boolean | null;
};

type ProfileRow = {
  id: string;
  full_name: string | null;
  role: string | null;
};

type PropertyRow = {
  id: string;
  kode: string | null;
  title: string | null;
  price: number | null;
  city: string | null;
  area: string | null;
  posted_date: string | null;
  status: string | null;
  source: string | null;
  plan_id: string | null;
  created_at: string | null;
  is_paused: boolean | null;
  listing_expires_at: string | null;
  featured_expires_at: string | null;
  boost_active: boolean | null;
  boost_expires_at: string | null;
  spotlight_active: boolean | null;
  spotlight_expires_at: string | null;
  verified_ok: boolean | null;
  verification_status: string | null;

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

  property_images:
    | PropertyImageRow[]
    | null;

  profiles:
    | ProfileRow
    | ProfileRow[]
    | null;
};

const ITEMS_PER_PAGE = 12;

function formatIdr(
  value: number | null | undefined
) {
  return new Intl.NumberFormat(
    "id-ID",
    {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }
  ).format(
    typeof value === "number"
      ? value
      : 0
  );
}

function formatPostedDate(
  value?: string | null
) {
  if (!value) return "-";

  const date = new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return value;
  }

  return new Intl.DateTimeFormat(
    "en-GB",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  ).format(date);
}

function isFutureDate(
  value?: string | null
) {
  if (!value) return false;

  const date = new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return false;
  }

  return (
    date.getTime() >
    Date.now()
  );
}

function addDaysIso(
  days: number
) {
  const date = new Date();

  date.setDate(
    date.getDate() + days
  );

  return date.toISOString();
}

function visiblePageNumbers(
  current: number,
  total: number
) {
  const pages: number[] = [];

  const start = Math.max(
    1,
    current - 2
  );

  const end = Math.min(
    total,
    current + 2
  );

  for (
    let page = start;
    page <= end;
    page += 1
  ) {
    pages.push(page);
  }

  return pages;
}

function normalizeOwnerPlanId(
  planId?: string | null
): OwnerPlanId {
  const value = String(
    planId || ""
  )
    .trim()
    .toLowerCase();

  if (value === "featured") {
    return "featured";
  }

  if (value === "priority") {
    return "priority";
  }

  return "basic";
}

function getOwnerPlanLabel(
  planId: OwnerPlanId
) {
  if (
    planId === "featured"
  ) {
    return "Featured Package";
  }

  if (
    planId === "priority"
  ) {
    return "Priority Package";
  }

  return "Basic Package";
}

function normalizeRentalType(
  value?: string | null
): RentalType {
  const normalized = String(
    value || ""
  )
    .trim()
    .toLowerCase();

  if (
    normalized === "daily" ||
    normalized === "harian"
  ) {
    return "daily";
  }

  if (
    normalized === "monthly" ||
    normalized === "bulanan"
  ) {
    return "monthly";
  }

  if (
    normalized === "yearly" ||
    normalized === "tahunan"
  ) {
    return "yearly";
  }

  return "";
}

function getRentalTypeLabel(
  value: RentalType
) {
  if (value === "daily") {
    return "Harian";
  }

  if (value === "monthly") {
    return "Bulanan";
  }

  if (value === "yearly") {
    return "Tahunan";
  }

  return "";
}

function normalizeSaleType(
  value?: string | null
): SaleType {
  const normalized = String(
    value || ""
  )
    .trim()
    .toLowerCase();

  if (
    normalized === "freehold"
  ) {
    return "freehold";
  }

  if (
    normalized === "leasehold"
  ) {
    return "leasehold";
  }

  if (normalized === "hgb") {
    return "hgb";
  }

  if (
    normalized === "hak_pakai"
  ) {
    return "hak_pakai";
  }

  if (
    normalized === "lainnya"
  ) {
    return "lainnya";
  }

  return "";
}

function getSaleTypeLabel(
  value: SaleType
) {
  if (
    value === "freehold"
  ) {
    return "Freehold";
  }

  if (
    value === "leasehold"
  ) {
    return "Leasehold";
  }

  if (value === "hgb") {
    return "HGB";
  }

  if (
    value === "hak_pakai"
  ) {
    return "Hak Pakai";
  }

  if (
    value === "lainnya"
  ) {
    return "Lainnya";
  }

  return "";
}

function formatPropertyType(
  value?: string | null
) {
  const raw = String(
    value || ""
  )
    .trim()
    .toLowerCase();

  if (!raw) return "";

  if (raw === "tanah") return "Tanah";
  if (raw === "rumah") return "Rumah";

  if (
    raw === "villa" ||
    raw === "vila"
  ) {
    return "Villa";
  }

  if (raw === "studio") {
    return "Studio";
  }

  if (
    raw === "apartemen" ||
    raw === "apartment"
  ) {
    return "Apartemen";
  }

  if (raw === "ruko") return "Ruko";
  if (raw === "rukan") return "Rukan";
  if (raw === "gudang") return "Gudang";
  if (raw === "kantor") return "Kantor";

  if (
    raw === "kost" ||
    raw === "kos"
  ) {
    return "Kost";
  }

  if (raw === "guesthouse") {
    return "Guesthouse";
  }

  if (raw === "hotel") return "Hotel";
  if (raw === "resort") return "Resort";
  if (raw === "pabrik") return "Pabrik";
  if (raw === "toko") return "Toko";
  if (raw === "rukos") return "Rukos";

  return raw
    .split(" ")
    .map(
      (word) =>
        word
          .charAt(0)
          .toUpperCase() +
        word.slice(1)
    )
    .join(" ");
}

function formatLandUnit(
  value?: string | null
) {
  const normalized = String(
    value || ""
  )
    .trim()
    .toLowerCase();

  if (
    normalized === "are"
  ) {
    return "are";
  }

  if (
    normalized === "hectare" ||
    normalized === "hektare"
  ) {
    return "ha";
  }

  if (
    normalized === "acre" ||
    normalized === "acres"
  ) {
    return "acre";
  }

  return "m²";
}

function formatNumber(
  value:
    | number
    | null
    | undefined
) {
  if (
    typeof value !==
      "number" ||
    Number.isNaN(value)
  ) {
    return "";
  }

  return new Intl.NumberFormat(
    "id-ID"
  ).format(value);
}

function mapListingStatus(
  row: PropertyRow
): ListingStatus {
  const status = String(
    row.status || ""
  ).toLowerCase();

  const verificationStatus =
    String(
      row.verification_status ||
        ""
    ).toLowerCase();

  if (
    status === "rejected" ||
    verificationStatus ===
      "rejected"
  ) {
    return "REJECTED";
  }

  if (row.is_paused) {
    return "PAUSED";
  }

  if (
    row.plan_id ===
      "featured" &&
    (
      !row.featured_expires_at ||
      isFutureDate(
        row.featured_expires_at
      )
    )
  ) {
    return "FEATURED";
  }

  if (
    status === "pending" ||
    status ===
      "pending_approval" ||
    verificationStatus ===
      "pending_verification" ||
    verificationStatus ===
      "pending_approval"
  ) {
    return "PENDING";
  }

  return "ACTIVE";
}

function getStatusUI(
  status: ListingStatus
) {
  if (
    status === "PENDING"
  ) {
    return {
      label: "Pending Review",
      bg: "#FFF8E1",
      border: "#E7CF79",
      color: "#8A6818",
    };
  }

  if (
    status === "ACTIVE"
  ) {
    return {
      label: "Active",
      bg: "#EEF9F2",
      border: "#B9DEC8",
      color: "#24714D",
    };
  }

  if (
    status === "FEATURED"
  ) {
    return {
      label: "Featured",
      bg: "#F5EEFF",
      border: "#D7C2F2",
      color: "#7146A0",
    };
  }

  if (
    status === "PAUSED"
  ) {
    return {
      label: "Paused",
      bg: "#F4F3F1",
      border: "#D9D5D0",
      color: "#66615B",
    };
  }

  return {
    label: "Rejected",
    bg: "#FFF0F0",
    border: "#EDC0C0",
    color: "#A23C3C",
  };
}

export default function AdminListingsScreen() {
  const router = useRouter();

  const [
    listings,
    setListings,
  ] = useState<Listing[]>([]);

  const [
    searchQuery,
    setSearchQuery,
  ] = useState("");

  const [page, setPage] =
    useState(1);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    refreshing,
    setRefreshing,
  ] = useState(false);

  const [
    loadError,
    setLoadError,
  ] = useState("");

  const [
    updatingId,
    setUpdatingId,
  ] = useState<
    string | null
  >(null);

  const [
    deletingId,
    setDeletingId,
  ] = useState<
    string | null
  >(null);

  const [toast, setToast] =
    useState<ToastState>(null);

  useEffect(() => {
    if (!toast) return;

    const timer = setTimeout(
      () => {
        setToast(null);
      },
      2600
    );

    return () =>
      clearTimeout(timer);
  }, [toast]);

  const verifyAdmin =
    useCallback(async () => {
      const {
        data: { user },
      } =
        await supabase.auth.getUser();

      if (!user) {
        router.replace(
          "/login" as any
        );

        return false;
      }

      const {
        data: profile,
        error,
      } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

      const role = String(
        (
          profile as {
            role?: string | null;
          } | null
        )?.role || ""
      ).toLowerCase();

      if (
        error ||
        role !== "admin"
      ) {
        Alert.alert(
          "Admin access required",
          "This area is available only to Tetamo administrators."
        );

        router.replace(
          "/(tabs)/profile" as any
        );

        return false;
      }

      return true;
    }, [router]);

  const loadListings =
    useCallback(
      async (
        showLoader = true
      ) => {
        if (showLoader) {
          setLoading(true);
        }

        setLoadError("");

        const allowed =
          await verifyAdmin();

        if (!allowed) {
          setLoading(false);
          setRefreshing(false);
          return;
        }

        try {
          const {
            data,
            error,
          } = await supabase
            .from("properties")
            .select(`
              id,
              kode,
              title,
              price,
              city,
              area,
              posted_date,
              status,
              source,
              plan_id,
              created_at,
              is_paused,
              listing_expires_at,
              featured_expires_at,
              boost_active,
              boost_expires_at,
              spotlight_active,
              spotlight_expires_at,
              verified_ok,
              verification_status,
              listing_type,
              rental_type,
              sale_type,
              property_type,
              land_size,
              building_size,
              land_unit,
              road_access,
              ownership_type,
              land_type,
              zoning_type,
              property_images (
                image_url,
                sort_order,
                is_cover
              ),
              profiles:user_id (
                id,
                full_name,
                role
              )
            `)
            .order(
              "created_at",
              {
                ascending: false,
              }
            );

          if (error) {
            throw error;
          }

          const mapped: Listing[] =
            (
              (data ??
                []) as PropertyRow[]
            ).map((item) => {
              const profile =
                Array.isArray(
                  item.profiles
                )
                  ? item
                      .profiles[0]
                  : item.profiles;

              const source =
                String(
                  item.source || ""
                ).toLowerCase();

              const ownerPlanId =
                normalizeOwnerPlanId(
                  item.plan_id
                );

              const sortedImages =
                [
                  ...(
                    item.property_images ??
                    []
                  ),
                ].sort(
                  (a, b) => {
                    const coverA =
                      a.is_cover
                        ? 1
                        : 0;

                    const coverB =
                      b.is_cover
                        ? 1
                        : 0;

                    if (
                      coverA !==
                      coverB
                    ) {
                      return (
                        coverB -
                        coverA
                      );
                    }

                    return (
                      (
                        a.sort_order ??
                        0
                      ) -
                      (
                        b.sort_order ??
                        0
                      )
                    );
                  }
                );

              return {
                id: item.id,

                kode:
                  item.kode ||
                  "-",

                title:
                  item.title ||
                  "-",

                price:
                  formatIdr(
                    item.price
                  ),

                city:
                  item.city ||
                  item.area ||
                  "-",

                owner:
                  source ===
                  "owner"
                    ? profile
                        ?.full_name ||
                      "Unknown Owner"
                    : "-",

                agent:
                  source ===
                  "agent"
                    ? profile
                        ?.full_name ||
                      "Unknown Agent"
                    : "-",

                postedDate:
                  formatPostedDate(
                    item.posted_date ||
                      item.created_at
                  ),

                listingExpiresAt:
                  item.listing_expires_at ||
                  null,

                status:
                  mapListingStatus(
                    item
                  ),

                planId:
                  ownerPlanId,

                planLabel:
                  getOwnerPlanLabel(
                    ownerPlanId
                  ),

                featuredActive:
                  item.plan_id ===
                    "featured" &&
                  (
                    !item.featured_expires_at ||
                    isFutureDate(
                      item.featured_expires_at
                    )
                  ),

                spotlightActive:
                  Boolean(
                    item.spotlight_active
                  ) &&
                  (
                    !item.spotlight_expires_at ||
                    isFutureDate(
                      item.spotlight_expires_at
                    )
                  ),

                boostActive:
                  Boolean(
                    item.boost_active
                  ) &&
                  (
                    !item.boost_expires_at ||
                    isFutureDate(
                      item.boost_expires_at
                    )
                  ),

                photos:
                  sortedImages.map(
                    (image) =>
                      image.image_url
                  ),

                listingType:
                  item.listing_type ===
                  "disewa"
                    ? "disewa"
                    : "dijual",

                rentalType:
                  normalizeRentalType(
                    item.rental_type
                  ),

                saleType:
                  normalizeSaleType(
                    item.sale_type
                  ),

                propertyType:
                  item.property_type ||
                  "",

                landSize:
                  typeof item.land_size ===
                  "number"
                    ? item.land_size
                    : null,

                buildingSize:
                  typeof item.building_size ===
                  "number"
                    ? item.building_size
                    : null,

                landUnit:
                  item.land_unit ||
                  "m2",

                roadAccess:
                  item.road_access ||
                  "",

                ownershipType:
                  item.ownership_type ||
                  "",

                landType:
                  item.land_type ||
                  "",

                zoningType:
                  item.zoning_type ||
                  "",
              };
            });

          setListings(mapped);
        } catch (error: any) {
          console.error(
            "Failed to load admin listings:",
            error
          );

          setLoadError(
            error?.message ||
              "Failed to load listings."
          );

          setListings([]);
        } finally {
          setLoading(false);
          setRefreshing(false);
        }
      },
      [verifyAdmin]
    );

  useEffect(() => {
    void loadListings(true);
  }, [loadListings]);

  const filteredListings =
    useMemo(() => {
      if (
        !searchQuery.trim()
      ) {
        return listings;
      }

      const words =
        searchQuery
          .toLowerCase()
          .split(" ")
          .filter(Boolean);

      return listings.filter(
        (listing) => {
          const searchable = `
            ${listing.title}
            ${listing.city}
            ${listing.kode}
            ${listing.owner}
            ${listing.agent}
            ${listing.price}
            ${listing.status}
            ${listing.planId}
            ${listing.planLabel}
            ${listing.listingType}
            ${getRentalTypeLabel(
              listing.rentalType
            )}
            ${getSaleTypeLabel(
              listing.saleType
            )}
            ${formatPropertyType(
              listing.propertyType
            )}
            ${listing.roadAccess}
            ${listing.ownershipType}
            ${listing.landType}
            ${listing.zoningType}
            ${
              listing.listingExpiresAt
                ? formatPostedDate(
                    listing.listingExpiresAt
                  )
                : ""
            }
          `.toLowerCase();

          return words.every(
            (word) =>
              searchable.includes(
                word
              )
          );
        }
      );
    }, [
      searchQuery,
      listings,
    ]);

  const stats = useMemo(
    () => ({
      total:
        listings.length,

      pending:
        listings.filter(
          (item) =>
            item.status ===
            "PENDING"
        ).length,

      active:
        listings.filter(
          (item) =>
            item.status ===
            "ACTIVE"
        ).length,

      featured:
        listings.filter(
          (item) =>
            item.status ===
            "FEATURED"
        ).length,

      paused:
        listings.filter(
          (item) =>
            item.status ===
            "PAUSED"
        ).length,

      rejected:
        listings.filter(
          (item) =>
            item.status ===
            "REJECTED"
        ).length,
    }),
    [listings]
  );

  useEffect(() => {
    setPage(1);
  }, [
    searchQuery,
    listings.length,
  ]);

  const totalPages =
    Math.max(
      1,
      Math.ceil(
        filteredListings.length /
          ITEMS_PER_PAGE
      )
    );

  useEffect(() => {
    if (
      page > totalPages
    ) {
      setPage(
        totalPages
      );
    }
  }, [
    page,
    totalPages,
  ]);

  const paginated =
    filteredListings.slice(
      (page - 1) *
        ITEMS_PER_PAGE,
      page *
        ITEMS_PER_PAGE
    );

  const startItem =
    filteredListings.length === 0
      ? 0
      : (page - 1) *
          ITEMS_PER_PAGE +
        1;

  const endItem = Math.min(
    page * ITEMS_PER_PAGE,
    filteredListings.length
  );

  const visiblePages =
    useMemo(
      () =>
        visiblePageNumbers(
          page,
          totalPages
        ),
      [page, totalPages]
    );

  async function updateStatus(
    id: string,
    action: AdminAction
  ) {
    const allowed =
      await verifyAdmin();

    if (!allowed) return;

    setUpdatingId(id);

    const current =
      listings.find(
        (item) =>
          item.id === id
      );

    try {
      if (
        action === "ACTIVE"
      ) {
        const { error } =
          await supabase
            .from("properties")
            .update({
              status: "active",
              is_paused: false,
              verified_ok: true,
              verification_status:
                "verified",
              updated_at:
                new Date().toISOString(),
            })
            .eq("id", id);

        if (error) {
          throw error;
        }

        setListings((previous) =>
          previous.map(
            (listing) =>
              listing.id === id
                ? {
                    ...listing,
                    status:
                      listing.featuredActive
                        ? "FEATURED"
                        : "ACTIVE",
                  }
                : listing
          )
        );

        setToast({
          type: "success",
          message:
            "Property has been approved and activated.",
        });

        setUpdatingId(null);
        return;
      }

      if (
        action === "REJECTED"
      ) {
        const { error } =
          await supabase
            .from("properties")
            .update({
              status:
                "rejected",
              verification_status:
                "rejected",
              updated_at:
                new Date().toISOString(),
            })
            .eq("id", id);

        if (error) {
          throw error;
        }

        setListings((previous) =>
          previous.map(
            (listing) =>
              listing.id === id
                ? {
                    ...listing,
                    status:
                      "REJECTED",
                  }
                : listing
          )
        );

        setToast({
          type: "success",
          message:
            "Property has been rejected.",
        });

        setUpdatingId(null);
        return;
      }

      if (
        action === "FEATURED"
      ) {
        const { error } =
          await supabase
            .from("properties")
            .update({
              status: "active",
              is_paused: false,
              verified_ok: true,
              verification_status:
                "verified",
              plan_id:
                "featured",
              featured_expires_at:
                addDaysIso(30),
              updated_at:
                new Date().toISOString(),
            })
            .eq("id", id);

        if (error) {
          throw error;
        }

        setListings((previous) =>
          previous.map(
            (listing) =>
              listing.id === id
                ? {
                    ...listing,
                    status:
                      "FEATURED",
                    planId:
                      "featured",
                    planLabel:
                      "Featured Package",
                    featuredActive:
                      true,
                  }
                : listing
          )
        );

        setToast({
          type: "success",
          message:
            "This property has been featured for 30 days.",
        });

        setUpdatingId(null);
        return;
      }

      if (
        action === "SPOTLIGHT"
      ) {
        const { error } =
          await supabase
            .from("properties")
            .update({
              status: "active",
              is_paused: false,
              verified_ok: true,
              verification_status:
                "verified",
              spotlight_active:
                true,
              spotlight_expires_at:
                addDaysIso(7),
              updated_at:
                new Date().toISOString(),
            })
            .eq("id", id);

        if (error) {
          throw error;
        }

        setListings((previous) =>
          previous.map(
            (listing) =>
              listing.id === id
                ? {
                    ...listing,
                    status:
                      listing.featuredActive
                        ? "FEATURED"
                        : "ACTIVE",
                    spotlightActive:
                      true,
                  }
                : listing
          )
        );

        setToast({
          type: "success",
          message:
            "This property is now in spotlight for 7 days.",
        });

        setUpdatingId(null);
        return;
      }

      if (
        action === "BOOST"
      ) {
        const { error } =
          await supabase
            .from("properties")
            .update({
              status: "active",
              is_paused: false,
              verified_ok: true,
              verification_status:
                "verified",
              boost_active: true,
              boost_expires_at:
                addDaysIso(14),
              updated_at:
                new Date().toISOString(),
            })
            .eq("id", id);

        if (error) {
          throw error;
        }

        setListings((previous) =>
          previous.map(
            (listing) =>
              listing.id === id
                ? {
                    ...listing,
                    status:
                      listing.featuredActive
                        ? "FEATURED"
                        : "ACTIVE",
                    boostActive:
                      true,
                  }
                : listing
          )
        );

        setToast({
          type: "success",
          message:
            "This property has been boosted for 14 days.",
        });

        setUpdatingId(null);
        return;
      }

      if (
        action === "PAUSED"
      ) {
        const nextPaused =
          current?.status !==
          "PAUSED";

        const { error } =
          await supabase
            .from("properties")
            .update({
              is_paused:
                nextPaused,
              updated_at:
                new Date().toISOString(),
            })
            .eq("id", id);

        if (error) {
          throw error;
        }

        setListings((previous) =>
          previous.map(
            (listing) =>
              listing.id === id
                ? {
                    ...listing,
                    status:
                      nextPaused
                        ? "PAUSED"
                        : listing.featuredActive
                          ? "FEATURED"
                          : "ACTIVE",
                  }
                : listing
          )
        );

        setToast({
          type: "success",
          message: nextPaused
            ? "Property has been paused."
            : "Property has been reactivated.",
        });

        setUpdatingId(null);
      }
    } catch (error: any) {
      console.error(
        "Failed to update listing:",
        error
      );

      setToast({
        type: "error",
        message:
          error?.message ||
          "Failed to update listing.",
      });

      setUpdatingId(null);
    }
  }

  async function deleteListing(
    id: string
  ) {
    const current =
      listings.find(
        (item) =>
          item.id === id
      );

    Alert.alert(
      "Delete listing?",
      `${
        current?.title ||
        "Untitled Listing"
      }\n${
        current?.kode || ""
      }\n\nThis cannot be undone.`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style:
            "destructive",
          onPress: () => {
            void confirmDelete(
              id
            );
          },
        },
      ]
    );
  }

  async function confirmDelete(
    id: string
  ) {
    const allowed =
      await verifyAdmin();

    if (!allowed) return;

    setDeletingId(id);

    try {
      const {
        error:
          imageDeleteError,
      } = await supabase
        .from(
          "property_images"
        )
        .delete()
        .eq(
          "property_id",
          id
        );

      if (
        imageDeleteError
      ) {
        throw imageDeleteError;
      }

      const {
        error:
          propertyDeleteError,
      } = await supabase
        .from("properties")
        .delete()
        .eq("id", id);

      if (
        propertyDeleteError
      ) {
        throw propertyDeleteError;
      }

      setListings(
        (previous) =>
          previous.filter(
            (item) =>
              item.id !== id
          )
      );

      setToast({
        type: "success",
        message:
          "Listing has been deleted.",
      });
    } catch (error: any) {
      console.error(
        "Failed to delete listing:",
        error
      );

      setToast({
        type: "error",
        message:
          error?.message ||
          "Failed to delete listing.",
      });
    } finally {
      setDeletingId(null);
    }
  }

  async function handleRefresh() {
    setRefreshing(true);

    await loadListings(
      false
    );
  }

  return (
    <SafeAreaView
      style={styles.safeArea}
    >
      <StatusBar style="dark" />

      <View
        style={styles.topBar}
      >
        <Pressable
          style={
            styles.backButton
          }
          onPress={() =>
            router.replace(
              "/admin" as any
            )
          }
        >
          <ArrowLeft
            color="#171717"
            size={16}
          />

          <Text
            style={
              styles.backText
            }
          >
            Admin
          </Text>
        </Pressable>

        <View
          style={
            styles.adminBadge
          }
        >
          <Text
            style={
              styles.adminBadgeText
            }
          >
            TETAMO ADMIN
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={
          styles.content
        }
        showsVerticalScrollIndicator={
          false
        }
        refreshControl={
          <RefreshControl
            refreshing={
              refreshing
            }
            onRefresh={
              handleRefresh
            }
            tintColor="#B8892E"
          />
        }
      >
        <Text
          style={styles.title}
        >
          Listings Control
        </Text>

        <Text
          style={
            styles.subtitle
          }
        >
          Approve, reject,
          feature, and manage
          all marketplace
          listings.
        </Text>

        {toast ? (
          <View
            style={[
              styles.toast,
              toast.type ===
              "success"
                ? styles.toastSuccess
                : styles.toastError,
            ]}
          >
            <Text
              style={[
                styles.toastTitle,
                toast.type ===
                "success"
                  ? styles.toastSuccessText
                  : styles.toastErrorText,
              ]}
            >
              {toast.type ===
              "success"
                ? "Success"
                : "Something went wrong"}
            </Text>

            <Text
              style={[
                styles.toastText,
                toast.type ===
                "success"
                  ? styles.toastSuccessText
                  : styles.toastErrorText,
              ]}
            >
              {toast.message}
            </Text>
          </View>
        ) : null}

        {loadError ? (
          <View
            style={
              styles.errorBox
            }
          >
            <Text
              style={
                styles.errorText
              }
            >
              {loadError}
            </Text>
          </View>
        ) : null}

        <View
          style={
            styles.statsGrid
          }
        >
          <SummaryCard
            label="Total Listings"
            value={stats.total}
          />

          <SummaryCard
            label="Pending"
            value={stats.pending}
          />

          <SummaryCard
            label="Active"
            value={stats.active}
          />

          <SummaryCard
            label="Featured"
            value={stats.featured}
          />

          <SummaryCard
            label="Paused"
            value={stats.paused}
          />

          <SummaryCard
            label="Rejected"
            value={stats.rejected}
          />
        </View>

        <View
          style={
            styles.searchBox
          }
        >
          <Search
            color="#8B857C"
            size={17}
          />

          <TextInput
            value={
              searchQuery
            }
            onChangeText={(
              value
            ) => {
              setSearchQuery(
                value
              );

              setPage(1);
            }}
            placeholder="Search listing, owner, agent, city, status, code, type..."
            placeholderTextColor="#9A948B"
            style={
              styles.searchInput
            }
          />
        </View>

        <View
          style={
            styles.resultHeader
          }
        >
          <View>
            <Text
              style={
                styles.resultTitle
              }
            >
              All Listings
            </Text>

            <Text
              style={
                styles.resultSub
              }
            >
              Showing {startItem}–
              {endItem} of{" "}
              {
                filteredListings.length
              }
            </Text>
          </View>

          <Text
            style={
              styles.pageLabel
            }
          >
            Page {page}/
            {totalPages}
          </Text>
        </View>

        {loading ? (
          <View
            style={
              styles.loadingBox
            }
          >
            <ActivityIndicator
              color="#B8892E"
            />

            <Text
              style={
                styles.loadingText
              }
            >
              Loading listings...
            </Text>
          </View>
        ) : null}

        {!loading &&
        paginated.length ===
          0 ? (
          <View
            style={
              styles.emptyBox
            }
          >
            <Building2
              color="#B8892E"
              size={28}
            />

            <Text
              style={
                styles.emptyText
              }
            >
              No listings found.
            </Text>
          </View>
        ) : null}

        <View
          style={
            styles.list
          }
        >
          {paginated.map(
            (item) => {
              const statusUI =
                getStatusUI(
                  item.status
                );

              const isUpdating =
                updatingId ===
                item.id;

              const isDeleting =
                deletingId ===
                item.id;

              const isBusy =
                isUpdating ||
                isDeleting;

              const cover =
                item.photos[0] ||
                null;

              const listingTypeLabel =
                item.listingType ===
                "disewa"
                  ? "Disewa"
                  : "Dijual";

              const rentalLabel =
                getRentalTypeLabel(
                  item.rentalType
                );

              const saleLabel =
                getSaleTypeLabel(
                  item.saleType
                );

              const propertyTypeLabel =
                formatPropertyType(
                  item.propertyType
                );

              const landSizeText =
                item.landSize
                  ? `${formatNumber(
                      item.landSize
                    )} ${formatLandUnit(
                      item.landUnit
                    )}`
                  : "";

              const buildingSizeText =
                item.buildingSize
                  ? `${formatNumber(
                      item.buildingSize
                    )} m²`
                  : "";

              return (
                <View
                  key={item.id}
                  style={
                    styles.card
                  }
                >
                  <View
                    style={
                      styles.cardTop
                    }
                  >
                    {cover ? (
                      <Image
                        source={{
                          uri: cover,
                        }}
                        style={
                          styles.image
                        }
                        resizeMode="cover"
                      />
                    ) : (
                      <View
                        style={
                          styles.imageFallback
                        }
                      >
                        <Home
                          color="#B8892E"
                          size={26}
                        />
                      </View>
                    )}

                    <View
                      style={
                        styles.cardMain
                      }
                    >
                      <View
                        style={
                          styles.badges
                        }
                      >
                        <Badge
                          label={
                            statusUI.label
                          }
                          backgroundColor={
                            statusUI.bg
                          }
                          borderColor={
                            statusUI.border
                          }
                          color={
                            statusUI.color
                          }
                        />

                        <Badge
                          label={
                            item.planLabel
                          }
                          backgroundColor="#FFF8E3"
                          borderColor="#E3CF8A"
                          color="#8A6818"
                        />

                        <Badge
                          label={
                            listingTypeLabel
                          }
                          backgroundColor="#F2F6FF"
                          borderColor="#C9D7F5"
                          color="#45638F"
                        />

                        {rentalLabel ? (
                          <Badge
                            label={
                              rentalLabel
                            }
                            backgroundColor="#EFF9F4"
                            borderColor="#B9DEC8"
                            color="#24714D"
                          />
                        ) : null}

                        {saleLabel ? (
                          <Badge
                            label={
                              saleLabel
                            }
                            backgroundColor="#F3F2FF"
                            borderColor="#D4D0F2"
                            color="#5F5798"
                          />
                        ) : null}

                        {propertyTypeLabel ? (
                          <Badge
                            label={
                              propertyTypeLabel
                            }
                            backgroundColor="#F6F5F3"
                            borderColor="#DEDBD6"
                            color="#625D57"
                          />
                        ) : null}

                        {item.spotlightActive ? (
                          <Badge
                            label="Spotlight"
                            backgroundColor="#ECFBFF"
                            borderColor="#B7E6EF"
                            color="#24798A"
                          />
                        ) : null}

                        {item.boostActive ? (
                          <Badge
                            label="Boost"
                            backgroundColor="#FFF8E3"
                            borderColor="#E3CF8A"
                            color="#8A6818"
                          />
                        ) : null}
                      </View>
                    </View>
                  </View>

                  <Text
                    style={
                      styles.propertyTitle
                    }
                  >
                    {item.title}
                  </Text>

                  <Text
                    style={
                      styles.price
                    }
                  >
                    {item.price}
                  </Text>

                  <Text
                    style={
                      styles.ownerLine
                    }
                  >
                    Owner:{" "}
                    {item.owner} •
                    Agent:{" "}
                    {item.agent} •{" "}
                    {item.city}
                  </Text>

                  <Text
                    style={
                      styles.metaLine
                    }
                  >
                    Code:{" "}
                    {item.kode} •{" "}
                    {item.postedDate}
                  </Text>

                  <Text
                    style={
                      styles.metaLine
                    }
                  >
                    Listing until:{" "}
                    {formatPostedDate(
                      item.listingExpiresAt
                    )}
                  </Text>

                  <View
                    style={
                      styles.detailsGrid
                    }
                  >
                    <Detail
                      icon={
                        <Building2
                          color="#6D665E"
                          size={14}
                        />
                      }
                      label="Property Type"
                      value={
                        propertyTypeLabel
                      }
                    />

                    <Detail
                      icon={
                        <Ruler
                          color="#6D665E"
                          size={14}
                        />
                      }
                      label="Land Size"
                      value={
                        landSizeText
                      }
                    />

                    <Detail
                      icon={
                        <Home
                          color="#6D665E"
                          size={14}
                        />
                      }
                      label="Building Size"
                      value={
                        buildingSizeText
                      }
                    />

                    <Detail
                      icon={
                        <MapPin
                          color="#6D665E"
                          size={14}
                        />
                      }
                      label="Road Access"
                      value={
                        item.roadAccess
                      }
                    />

                    <Detail
                      icon={
                        <FileText
                          color="#6D665E"
                          size={14}
                        />
                      }
                      label="Ownership"
                      value={
                        item.ownershipType
                      }
                    />

                    <Detail
                      icon={
                        <Ruler
                          color="#6D665E"
                          size={14}
                        />
                      }
                      label="Land Type"
                      value={
                        item.landType
                      }
                    />

                    <Detail
                      icon={
                        <FileText
                          color="#6D665E"
                          size={14}
                        />
                      }
                      label="Zoning"
                      value={
                        item.zoningType
                      }
                    />
                  </View>

                  <View
                    style={
                      styles.actionGrid
                    }
                  >
                    <ActionButton
                      disabled={
                        isBusy
                      }
                      label="Approve"
                      icon={
                        <CheckCircle2
                          color="#24714D"
                          size={15}
                        />
                      }
                      style={
                        styles.actionApprove
                      }
                      onPress={() =>
                        void updateStatus(
                          item.id,
                          "ACTIVE"
                        )
                      }
                    />

                    <ActionButton
                      disabled={
                        isBusy
                      }
                      label="Reject"
                      icon={
                        <XCircle
                          color="#A23C3C"
                          size={15}
                        />
                      }
                      style={
                        styles.actionReject
                      }
                      onPress={() =>
                        void updateStatus(
                          item.id,
                          "REJECTED"
                        )
                      }
                    />

                    <ActionButton
                      disabled={
                        isBusy
                      }
                      label="Feature"
                      icon={
                        <Star
                          color="#7146A0"
                          size={15}
                        />
                      }
                      style={
                        styles.actionFeature
                      }
                      onPress={() =>
                        void updateStatus(
                          item.id,
                          "FEATURED"
                        )
                      }
                    />

                    <ActionButton
                      disabled={
                        isBusy
                      }
                      label="Spotlight"
                      icon={
                        <Gem
                          color="#24798A"
                          size={15}
                        />
                      }
                      style={
                        styles.actionSpotlight
                      }
                      onPress={() =>
                        void updateStatus(
                          item.id,
                          "SPOTLIGHT"
                        )
                      }
                    />

                    <ActionButton
                      disabled={
                        isBusy
                      }
                      label="Boost"
                      icon={
                        <Zap
                          color="#9A7624"
                          size={15}
                        />
                      }
                      style={
                        styles.actionBoost
                      }
                      onPress={() =>
                        void updateStatus(
                          item.id,
                          "BOOST"
                        )
                      }
                    />

                    <ActionButton
                      disabled={
                        isBusy
                      }
                      label={
                        item.status ===
                        "PAUSED"
                          ? "Unpause"
                          : "Pause"
                      }
                      icon={
                        <PauseCircle
                          color="#625D57"
                          size={15}
                        />
                      }
                      style={
                        styles.actionPause
                      }
                      onPress={() =>
                        void updateStatus(
                          item.id,
                          "PAUSED"
                        )
                      }
                    />
                  </View>

                  <Pressable
                    disabled={
                      isBusy
                    }
                    style={[
                      styles.deleteButton,
                      isBusy &&
                        styles.disabled,
                    ]}
                    onPress={() =>
                      deleteListing(
                        item.id
                      )
                    }
                  >
                    {isDeleting ? (
                      <ActivityIndicator
                        color="#FFFFFF"
                        size="small"
                      />
                    ) : (
                      <Trash2
                        color="#FFFFFF"
                        size={15}
                      />
                    )}

                    <Text
                      style={
                        styles.deleteText
                      }
                    >
                      {isDeleting
                        ? "Deleting..."
                        : "Delete Listing"}
                    </Text>
                  </Pressable>
                </View>
              );
            }
          )}
        </View>

        {!loading &&
        filteredListings.length >
          0 ? (
          <View
            style={
              styles.pagination
            }
          >
            <Pressable
              disabled={
                page === 1
              }
              style={[
                styles.pageArrow,
                page === 1 &&
                  styles.disabled,
              ]}
              onPress={() =>
                setPage(
                  (current) =>
                    Math.max(
                      1,
                      current - 1
                    )
                )
              }
            >
              <ChevronLeft
                color="#171717"
                size={18}
              />
            </Pressable>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={
                false
              }
              contentContainerStyle={
                styles.pageNumbers
              }
            >
              {visiblePages.map(
                (
                  pageNumber
                ) => (
                  <Pressable
                    key={
                      pageNumber
                    }
                    style={[
                      styles.pageNumber,
                      page ===
                        pageNumber &&
                        styles.pageNumberActive,
                    ]}
                    onPress={() =>
                      setPage(
                        pageNumber
                      )
                    }
                  >
                    <Text
                      style={[
                        styles.pageNumberText,
                        page ===
                          pageNumber &&
                          styles.pageNumberTextActive,
                      ]}
                    >
                      {
                        pageNumber
                      }
                    </Text>
                  </Pressable>
                )
              )}
            </ScrollView>

            <Pressable
              disabled={
                page ===
                totalPages
              }
              style={[
                styles.pageArrow,
                page ===
                  totalPages &&
                  styles.disabled,
              ]}
              onPress={() =>
                setPage(
                  (current) =>
                    Math.min(
                      totalPages,
                      current + 1
                    )
                )
              }
            >
              <ChevronRight
                color="#171717"
                size={18}
              />
            </Pressable>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function SummaryCard({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <View
      style={
        styles.summaryCard
      }
    >
      <Text
        style={
          styles.summaryLabel
        }
      >
        {label}
      </Text>

      <Text
        style={
          styles.summaryValue
        }
      >
        {value}
      </Text>
    </View>
  );
}

function Badge({
  label,
  backgroundColor,
  borderColor,
  color,
}: {
  label: string;
  backgroundColor: string;
  borderColor: string;
  color: string;
}) {
  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor,
          borderColor,
        },
      ]}
    >
      <Text
        style={[
          styles.badgeText,
          {
            color,
          },
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

function Detail({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  if (
    !value ||
    value === "-"
  ) {
    return null;
  }

  return (
    <View
      style={
        styles.detail
      }
    >
      <View
        style={
          styles.detailIcon
        }
      >
        {icon}
      </View>

      <View
        style={
          styles.detailCopy
        }
      >
        <Text
          style={
            styles.detailLabel
          }
        >
          {label}
        </Text>

        <Text
          style={
            styles.detailValue
          }
        >
          {value}
        </Text>
      </View>
    </View>
  );
}

function ActionButton({
  disabled,
  label,
  icon,
  style,
  onPress,
}: {
  disabled: boolean;
  label: string;
  icon: React.ReactNode;
  style: object;
  onPress: () => void;
}) {
  return (
    <Pressable
      disabled={disabled}
      style={[
        styles.actionButton,
        style,
        disabled &&
          styles.disabled,
      ]}
      onPress={onPress}
    >
      {icon}

      <Text
        style={
          styles.actionText
        }
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles =
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor:
        "#F7F5EF",
    },

    topBar: {
      minHeight: 58,
      paddingHorizontal: 18,
      flexDirection: "row",
      alignItems: "center",
      justifyContent:
        "space-between",
      backgroundColor:
        "#F7F5EF",
    },

    backButton: {
      minHeight: 38,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: "#E3DDD4",
      backgroundColor:
        "#FFFFFF",
      paddingHorizontal: 12,
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },

    backText: {
      color: "#171717",
      fontSize: 10.5,
      fontWeight: "900",
    },

    adminBadge: {
      borderRadius: 999,
      backgroundColor:
        "#F4E8C5",
      paddingHorizontal: 10,
      paddingVertical: 7,
    },

    adminBadgeText: {
      color: "#705A27",
      fontSize: 8.5,
      fontWeight: "900",
      letterSpacing: 0.6,
    },

    scroll: {
      flex: 1,
      backgroundColor:
        "#F7F5EF",
    },

    content: {
      paddingHorizontal: 18,
      paddingTop: 12,
      paddingBottom: 48,
    },

    title: {
      color: "#171717",
      fontSize: 28,
      lineHeight: 33,
      fontWeight: "900",
      letterSpacing: -0.7,
    },

    subtitle: {
      color: "#777169",
      fontSize: 12,
      lineHeight: 18,
      fontWeight: "600",
      marginTop: 5,
    },

    toast: {
      borderRadius: 17,
      borderWidth: 1,
      padding: 12,
      marginTop: 16,
    },

    toastSuccess: {
      backgroundColor:
        "#EFFAF3",
      borderColor:
        "#B9DEC8",
    },

    toastError: {
      backgroundColor:
        "#FFF2F2",
      borderColor:
        "#EAC5C5",
    },

    toastTitle: {
      fontSize: 11.5,
      fontWeight: "900",
    },

    toastText: {
      fontSize: 10.5,
      lineHeight: 15,
      fontWeight: "600",
      marginTop: 2,
    },

    toastSuccessText: {
      color: "#24714D",
    },

    toastErrorText: {
      color: "#A23C3C",
    },

    errorBox: {
      borderRadius: 17,
      borderWidth: 1,
      borderColor:
        "#EAC5C5",
      backgroundColor:
        "#FFF2F2",
      padding: 12,
      marginTop: 16,
    },

    errorText: {
      color: "#A23C3C",
      fontSize: 11,
      lineHeight: 16,
      fontWeight: "700",
    },

    statsGrid: {
      marginTop: 18,
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 9,
    },

    summaryCard: {
      width: "48%",
      minHeight: 72,
      borderRadius: 18,
      borderWidth: 1,
      borderColor:
        "#E7E0D6",
      backgroundColor:
        "#FFFFFF",
      padding: 12,
      justifyContent:
        "center",
    },

    summaryLabel: {
      color: "#8C857C",
      fontSize: 8.5,
      lineHeight: 12,
      fontWeight: "800",
      textTransform:
        "uppercase",
      letterSpacing: 0.4,
    },

    summaryValue: {
      color: "#171717",
      fontSize: 20,
      fontWeight: "900",
      marginTop: 3,
    },

    searchBox: {
      minHeight: 52,
      borderRadius: 17,
      borderWidth: 1,
      borderColor:
        "#DED7CD",
      backgroundColor:
        "#FFFFFF",
      paddingHorizontal: 13,
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginTop: 16,
    },

    searchInput: {
      flex: 1,
      color: "#171717",
      fontSize: 11.5,
      fontWeight: "600",
      paddingVertical: 0,
    },

    resultHeader: {
      marginTop: 20,
      marginBottom: 10,
      flexDirection: "row",
      justifyContent:
        "space-between",
      alignItems:
        "flex-end",
      gap: 10,
    },

    resultTitle: {
      color: "#171717",
      fontSize: 15,
      fontWeight: "900",
    },

    resultSub: {
      color: "#8C857C",
      fontSize: 9.5,
      fontWeight: "600",
      marginTop: 3,
    },

    pageLabel: {
      color: "#9A7624",
      fontSize: 9.5,
      fontWeight: "900",
    },

    loadingBox: {
      minHeight: 90,
      borderRadius: 20,
      borderWidth: 1,
      borderColor:
        "#E7E0D6",
      backgroundColor:
        "#FFFFFF",
      alignItems: "center",
      justifyContent:
        "center",
      gap: 8,
    },

    loadingText: {
      color: "#777169",
      fontSize: 11,
      fontWeight: "700",
    },

    emptyBox: {
      minHeight: 130,
      borderRadius: 20,
      borderWidth: 1,
      borderColor:
        "#E7E0D6",
      backgroundColor:
        "#FFFFFF",
      alignItems: "center",
      justifyContent:
        "center",
      gap: 8,
    },

    emptyText: {
      color: "#777169",
      fontSize: 11,
      fontWeight: "700",
    },

    list: {
      gap: 13,
    },

    card: {
      borderRadius: 23,
      borderWidth: 1,
      borderColor:
        "#E5DED4",
      backgroundColor:
        "#FFFFFF",
      padding: 14,
    },

    cardTop: {
      flexDirection: "row",
      alignItems:
        "flex-start",
      gap: 11,
    },

    image: {
      width: 100,
      height: 92,
      borderRadius: 16,
      backgroundColor:
        "#EEEAE3",
    },

    imageFallback: {
      width: 100,
      height: 92,
      borderRadius: 16,
      backgroundColor:
        "#F5F0E7",
      alignItems: "center",
      justifyContent:
        "center",
    },

    cardMain: {
      flex: 1,
    },

    badges: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 5,
    },

    badge: {
      borderRadius: 999,
      borderWidth: 1,
      paddingHorizontal: 7,
      paddingVertical: 4,
    },

    badgeText: {
      fontSize: 7.8,
      fontWeight: "900",
    },

    propertyTitle: {
      color: "#171717",
      fontSize: 14,
      lineHeight: 19,
      fontWeight: "900",
      marginTop: 12,
    },

    price: {
      color: "#A47B21",
      fontSize: 12.5,
      fontWeight: "900",
      marginTop: 5,
    },

    ownerLine: {
      color: "#68625C",
      fontSize: 10.5,
      lineHeight: 16,
      fontWeight: "600",
      marginTop: 7,
    },

    metaLine: {
      color: "#999188",
      fontSize: 9.5,
      lineHeight: 14,
      fontWeight: "600",
      marginTop: 3,
    },

    detailsGrid: {
      marginTop: 12,
      gap: 7,
    },

    detail: {
      borderRadius: 14,
      borderWidth: 1,
      borderColor:
        "#ECE6DD",
      backgroundColor:
        "#FAF9F6",
      padding: 9,
      flexDirection: "row",
      alignItems:
        "flex-start",
      gap: 8,
    },

    detailIcon: {
      width: 29,
      height: 29,
      borderRadius: 10,
      backgroundColor:
        "#FFFFFF",
      alignItems: "center",
      justifyContent:
        "center",
    },

    detailCopy: {
      flex: 1,
    },

    detailLabel: {
      color: "#999188",
      fontSize: 7.8,
      fontWeight: "900",
      textTransform:
        "uppercase",
      letterSpacing: 0.4,
    },

    detailValue: {
      color: "#39342F",
      fontSize: 10.5,
      lineHeight: 15,
      fontWeight: "700",
      marginTop: 2,
    },

    actionGrid: {
      marginTop: 14,
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 7,
    },

    actionButton: {
      width: "48%",
      minHeight: 41,
      borderRadius: 13,
      borderWidth: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent:
        "center",
      gap: 6,
    },

    actionText: {
      color: "#39342F",
      fontSize: 9.5,
      fontWeight: "900",
    },

    actionApprove: {
      backgroundColor:
        "#EFFAF3",
      borderColor:
        "#B9DEC8",
    },

    actionReject: {
      backgroundColor:
        "#FFF2F2",
      borderColor:
        "#EAC5C5",
    },

    actionFeature: {
      backgroundColor:
        "#F7F0FF",
      borderColor:
        "#DAC7EF",
    },

    actionSpotlight: {
      backgroundColor:
        "#EEFBFE",
      borderColor:
        "#B9E4EC",
    },

    actionBoost: {
      backgroundColor:
        "#FFF8E3",
      borderColor:
        "#E5D08D",
    },

    actionPause: {
      backgroundColor:
        "#F6F5F3",
      borderColor:
        "#DDD9D4",
    },

    deleteButton: {
      minHeight: 44,
      borderRadius: 14,
      backgroundColor:
        "#B94747",
      marginTop: 8,
      flexDirection: "row",
      alignItems: "center",
      justifyContent:
        "center",
      gap: 7,
    },

    deleteText: {
      color: "#FFFFFF",
      fontSize: 10.5,
      fontWeight: "900",
    },

    disabled: {
      opacity: 0.45,
    },

    pagination: {
      marginTop: 18,
      flexDirection: "row",
      alignItems: "center",
      justifyContent:
        "center",
      gap: 8,
    },

    pageArrow: {
      width: 40,
      height: 40,
      borderRadius: 13,
      borderWidth: 1,
      borderColor:
        "#DCD5CC",
      backgroundColor:
        "#FFFFFF",
      alignItems: "center",
      justifyContent:
        "center",
    },

    pageNumbers: {
      gap: 6,
      alignItems: "center",
    },

    pageNumber: {
      minWidth: 38,
      height: 38,
      borderRadius: 12,
      borderWidth: 1,
      borderColor:
        "#DCD5CC",
      backgroundColor:
        "#FFFFFF",
      alignItems: "center",
      justifyContent:
        "center",
      paddingHorizontal: 8,
    },

    pageNumberActive: {
      backgroundColor:
        "#171717",
      borderColor:
        "#171717",
    },

    pageNumberText: {
      color: "#5D5751",
      fontSize: 10,
      fontWeight: "900",
    },

    pageNumberTextActive: {
      color: "#FFFFFF",
    },
  });
