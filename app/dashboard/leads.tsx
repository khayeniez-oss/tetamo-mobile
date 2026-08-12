import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
    ArrowLeft,
    CalendarDays,
    CheckCircle2,
    Clock3,
    Home,
    MapPin,
    MessageCircle,
    Phone,
    Search,
    UserCheck,
    XCircle,
} from "lucide-react-native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
    Linking,
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

type Language = "en" | "id";
type DashboardRole = "owner" | "agent";
type LeadStatus = "new" | "contacted" | "viewing" | "interested" | "closed";
type ViewingStatus = "scheduled" | "rescheduled" | "done" | "no_show" | null;
type StatusFilter = "all" | LeadStatus;
type SourceFilter = "all" | "whatsapp" | "viewing" | "general";

const PAGE_SIZE = 20;

type LeadRow = {
  id: string;
  property_id: string | null;
  property_code: string | null;
  property_title: string | null;
  source: string | null;
  sender_name: string | null;
  sender_phone: string | null;
  sender_email: string | null;
  message: string | null;
  created_at: string | null;
  status: string | null;
  priority: string | null;
  notes: string | null;
  lead_type: string | null;
  viewing_date: string | null;
  viewing_time: string | null;
  viewing_status: string | null;
  receiver_user_id: string | null;
  receiver_role: string | null;
};

type PropertyRow = {
  id: string;
  kode: string | null;
  title: string | null;
  title_id: string | null;
  price: number | null;
  city: string | null;
  area: string | null;
  province: string | null;
};

type PropertyImageRow = {
  property_id: string;
  image_url: string | null;
  sort_order: number | null;
  is_cover: boolean | null;
  created_at: string | null;
};

type ProfileRow = {
  full_name: string | null;
  role: string | null;
};

type Lead = {
  id: string;
  propertyId: string | null;
  listingKode: string;
  propertyTitle: string;
  propertyPrice: string;
  propertyLocation: string;
  propertyImage: string | null;
  buyerName: string;
  buyerPhone: string;
  buyerEmail: string;
  message: string;
  createdAt: string;
  status: LeadStatus;
  leadType: string;
  source: string;
  sourceType: SourceFilter;
  viewingDate: string | null;
  viewingTime: string | null;
  viewingStatus: ViewingStatus;
  priority: string;
  notes: string;
};

function readParam(value: unknown) {
  if (Array.isArray(value)) return String(value[0] || "");
  return String(value || "");
}

function normalizeDashboardRole(value: unknown): DashboardRole | null {
  const role = String(value || "").toLowerCase();

  if (role === "owner") return "owner";
  if (role === "agent") return "agent";

  return null;
}

function normalizeLeadStatus(value?: string | null): LeadStatus {
  const status = String(value || "").trim().toLowerCase();

  if (status === "contacted") return "contacted";
  if (status === "viewing" || status === "scheduled") return "viewing";
  if (status === "interested") return "interested";
  if (status === "closed" || status === "completed") return "closed";

  return "new";
}

function normalizeSourceType(
  leadType?: string | null,
  source?: string | null
): SourceFilter {
  const combined = `${leadType || ""} ${source || ""}`.trim().toLowerCase();

  if (
    combined.includes("whatsapp") ||
    combined.includes("wa") ||
    combined.includes("chat")
  ) {
    return "whatsapp";
  }

  if (
    combined.includes("viewing") ||
    combined.includes("schedule") ||
    combined.includes("appointment")
  ) {
    return "viewing";
  }

  return "general";
}

function normalizeViewingStatus(
  value: string | null | undefined,
  sourceType: SourceFilter
): ViewingStatus {
  const status = String(value || "").trim().toLowerCase();

  if (status === "scheduled") return "scheduled";
  if (status === "rescheduled") return "rescheduled";
  if (status === "done") return "done";
  if (status === "no_show") return "no_show";

  if (sourceType === "viewing") return "scheduled";

  return null;
}

function formatCurrency(value: number | null | undefined) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function parseLocalDate(value?: string | null) {
  if (!value) return null;

  const parts = value.split("-").map(Number);
  if (parts.length !== 3) return null;

  const [year, month, day] = parts;
  if (!year || !month || !day) return null;

  return new Date(year, month - 1, day);
}

function formatDate(value: string | null | undefined, language: Language) {
  if (!value) return "-";

  const parsed = parseLocalDate(value) || new Date(value);
  if (Number.isNaN(parsed.getTime())) return "-";

  return new Intl.DateTimeFormat(language === "id" ? "id-ID" : "en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(parsed);
}

function formatTime(value?: string | null) {
  if (!value) return "-";
  return value.length >= 5 ? value.slice(0, 5) : value;
}

function normalizePhoneForWhatsapp(phone?: string | null) {
  if (!phone) return "";

  const digits = phone.replace(/[^\d]/g, "");

  if (digits.startsWith("62")) return digits;
  if (digits.startsWith("0")) return `62${digits.slice(1)}`;
  if (digits.startsWith("8")) return `62${digits}`;

  return digits;
}

function normalizePhoneForCall(phone?: string | null) {
  if (!phone) return "";
  return phone.replace(/[^\d+]/g, "");
}

function buildPropertyLocation(row?: PropertyRow | null) {
  if (!row) return "-";

  const parts = [row.area, row.city, row.province].filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : "-";
}

function buildPropertyUrl(lead: Lead) {
  if (lead.propertyId) {
    return `https://www.tetamo.com/properti/${lead.propertyId}`;
  }

  return "https://www.tetamo.com";
}

function getSourceUI(source: SourceFilter, language: Language) {
  const isId = language === "id";

  if (source === "whatsapp") {
    return {
      label: isId ? "Lead WhatsApp" : "WhatsApp Lead",
      bg: "#052e16",
      border: "#166534",
      color: "#22c55e",
      icon: <MessageCircle color="#22c55e" size={13} />,
    };
  }

  if (source === "viewing") {
    return {
      label: isId ? "Request Viewing" : "Viewing Request",
      bg: "#211a0b",
      border: "#705d2c",
      color: "#e6c15c",
      icon: <CalendarDays color="#e6c15c" size={13} />,
    };
  }

  return {
    label: isId ? "Inquiry Umum" : "General Inquiry",
    bg: "#171717",
    border: "#333333",
    color: "#d6d6d6",
    icon: <UserCheck color="#d6d6d6" size={13} />,
  };
}

function getLeadStatusUI(status: LeadStatus, language: Language) {
  const isId = language === "id";

  if (status === "new") {
    return {
      label: isId ? "Baru" : "New",
      bg: "#082f49",
      border: "#0369a1",
      color: "#38bdf8",
      icon: <Clock3 color="#38bdf8" size={13} />,
    };
  }

  if (status === "contacted") {
    return {
      label: isId ? "Dihubungi" : "Contacted",
      bg: "#1e1b4b",
      border: "#4338ca",
      color: "#a5b4fc",
      icon: <Phone color="#a5b4fc" size={13} />,
    };
  }

  if (status === "viewing") {
    return {
      label: isId ? "Tahap Viewing" : "Viewing Stage",
      bg: "#211a0b",
      border: "#705d2c",
      color: "#e6c15c",
      icon: <CalendarDays color="#e6c15c" size={13} />,
    };
  }

  if (status === "interested") {
    return {
      label: isId ? "Tertarik" : "Interested",
      bg: "#052e16",
      border: "#166534",
      color: "#22c55e",
      icon: <CheckCircle2 color="#22c55e" size={13} />,
    };
  }

  return {
    label: "Closed",
    bg: "#050505",
    border: "#4b5563",
    color: "#ffffff",
    icon: <CheckCircle2 color="#ffffff" size={13} />,
  };
}

function getViewingStatusUI(status: ViewingStatus, language: Language) {
  const isId = language === "id";

  if (status === "scheduled") {
    return {
      label: isId ? "Terjadwal" : "Scheduled",
      bg: "#211a0b",
      border: "#705d2c",
      color: "#e6c15c",
    };
  }

  if (status === "rescheduled") {
    return {
      label: isId ? "Dijadwalkan Ulang" : "Rescheduled",
      bg: "#082f49",
      border: "#0369a1",
      color: "#38bdf8",
    };
  }

  if (status === "done") {
    return {
      label: isId ? "Selesai" : "Done",
      bg: "#052e16",
      border: "#166534",
      color: "#22c55e",
    };
  }

  if (status === "no_show") {
    return {
      label: isId ? "Tidak Hadir" : "No Show",
      bg: "#2a0d0d",
      border: "#7f1d1d",
      color: "#f87171",
    };
  }

  return null;
}

export default function DashboardLeadsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const [language, setLanguage] = useState<Language>("en");
  const [role, setRole] = useState<DashboardRole>("owner");
  const [agentName, setAgentName] = useState("TETAMO");
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const [stats, setStats] = useState({
    total: 0,
    new: 0,
    viewing: 0,
  });

  const nextOffsetRef = useRef(0);
  const loadingMoreRef = useRef(false);

  const isId = language === "id";

  const roleFromUrl = useMemo(() => {
    return normalizeDashboardRole(readParam(params.role));
  }, [params.role]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 350);

    return () => clearTimeout(timer);
  }, [search]);

  const ui = useMemo(() => {
    const isAgent = role === "agent";

    if (isId) {
      return {
        back: "Kembali",
        title: isAgent ? "Leads Agent" : "Leads Pemilik",
        subtitle: isAgent
          ? "Kelola buyer leads berdasarkan sumber, follow-up, dan progres viewing."
          : "Kelola orang yang tertarik dengan properti Anda.",
        searchPlaceholder:
          "Cari nama, nomor, email, kode listing, lokasi, harga, atau pesan...",
        loading: "Memuat leads...",
        empty: isAgent
          ? "Belum ada leads untuk agent ini."
          : "Belum ada leads untuk pemilik ini.",
        loginError: "Silakan login terlebih dahulu.",
        updateError: "Gagal update lead.",
        all: "Semua",
        sourceAll: "Semua Sumber",
        sourceWhatsapp: "WhatsApp",
        sourceViewing: "Request Viewing",
        sourceGeneral: "Inquiry Umum",
        statusAll: "Semua Status",
        new: "Baru",
        contacted: "Dihubungi",
        viewing: "Viewing",
        interested: "Tertarik",
        closed: "Closed",
        statsTotal: "Total",
        statsNew: "Baru",
        statsViewing: "Viewing",
        contact: "Call",
        whatsapp: "WhatsApp",
        noPhone: "Nomor tidak tersedia.",
        property: "Properti",
        code: "Kode",
        location: "Lokasi",
        price: "Harga",
        message: "Pesan",
        requestedSchedule: "Jadwal diminta",
        notes: "Catatan",
        priority: "Prioritas",
        markViewing: "Viewing",
        markInterested: "Interested",
        markClosed: "Closed",
      };
    }

    return {
      back: "Back",
      title: isAgent ? "Agent Leads" : "Owner Leads",
      subtitle: isAgent
        ? "Manage buyer leads by source, follow-up status, and viewing progress."
        : "Manage people who are interested in your property.",
      searchPlaceholder:
        "Search name, phone, email, listing code, location, price, or message...",
      loading: "Loading leads...",
      empty: isAgent
        ? "No leads found for this agent yet."
        : "No leads found for this owner yet.",
      loginError: "Please log in first.",
      updateError: "Failed to update lead.",
      all: "All",
      sourceAll: "All Sources",
      sourceWhatsapp: "WhatsApp",
      sourceViewing: "Viewing Request",
      sourceGeneral: "General Inquiry",
      statusAll: "All Status",
      new: "New",
      contacted: "Contacted",
      viewing: "Viewing",
      interested: "Interested",
      closed: "Closed",
      statsTotal: "Total",
      statsNew: "New",
      statsViewing: "Viewing",
      contact: "Call",
      whatsapp: "WhatsApp",
      noPhone: "Phone number unavailable.",
      property: "Property",
      code: "Code",
      location: "Location",
      price: "Price",
      message: "Message",
      requestedSchedule: "Requested schedule",
      notes: "Notes",
      priority: "Priority",
      markViewing: "Viewing",
      markInterested: "Interested",
      markClosed: "Closed",
    };
  }, [isId, role]);

  const buildWhatsAppMessage = useCallback(
    (lead: Lead) => {
      if (isId) {
        return role === "agent"
          ? `Halo ${lead.buyerName},

Saya ${agentName}, agent dari TETAMO.

Anda sebelumnya menghubungi kami terkait properti berikut:

🏠 ${lead.propertyTitle}
📍 ${lead.propertyLocation}
💰 ${lead.propertyPrice}

${buildPropertyUrl(lead)}

Jika Anda berminat, kita bisa:
1️⃣ Diskusi lebih lanjut
2️⃣ Kirim detail lengkap
3️⃣ Jadwalkan viewing

Silakan beri tahu waktu yang paling nyaman untuk Anda.`
          : `Halo ${lead.buyerName},

Saya pemilik properti dari TETAMO.

Anda sebelumnya tertarik pada properti kami:

🏠 ${lead.propertyTitle}
📍 ${lead.propertyLocation}
💰 ${lead.propertyPrice}

${buildPropertyUrl(lead)}

Apakah Anda masih berminat?`;
      }

      return role === "agent"
        ? `Hi ${lead.buyerName},

This is ${agentName}, an agent from TETAMO.

You previously contacted us regarding this property:

🏠 ${lead.propertyTitle}
📍 ${lead.propertyLocation}
💰 ${lead.propertyPrice}

${buildPropertyUrl(lead)}

If you are interested, we can:
1️⃣ Discuss further
2️⃣ Send full details
3️⃣ Schedule a viewing

Please let me know the most convenient time for you.`
        : `Hi ${lead.buyerName},

I am the property owner from TETAMO.

You were previously interested in our property:

🏠 ${lead.propertyTitle}
📍 ${lead.propertyLocation}
💰 ${lead.propertyPrice}

${buildPropertyUrl(lead)}

Are you still interested?`;
    },
    [agentName, isId, role]
  );

  const fetchLeadStats = useCallback(
    async (
      userId: string,
      finalRole: DashboardRole
    ) => {
      const makeCountQuery = () =>
        supabase
          .from("leads")
          .select("id", {
            count: "exact",
            head: true,
          })
          .eq("receiver_user_id", userId)
          .eq("receiver_role", finalRole);

      const [
        totalResult,
        newResult,
        viewingResult,
      ] = await Promise.all([
        makeCountQuery(),

        makeCountQuery().eq(
          "status",
          "new"
        ),

        makeCountQuery().in(
          "status",
          ["viewing", "scheduled"]
        ),
      ]);

      const countError =
        totalResult.error ||
        newResult.error ||
        viewingResult.error;

      if (countError) {
        throw countError;
      }

      return {
        total: totalResult.count || 0,
        new: newResult.count || 0,
        viewing:
          viewingResult.count || 0,
      };
    },
    []
  );

  const fetchLeadPage = useCallback(
    async (
      userId: string,
      finalRole: DashboardRole,
      offset: number
    ) => {
      /*
       * Request one extra row.
       * 20 rows are displayed; row 21 tells us
       * whether another page exists.
       */
      /*
       * Search property fields separately so searching
       * location/title/code can still find the matching
       * lead even though property data lives in another table.
       */
      const rawSearch =
        debouncedSearch.trim();

      /*
       * PostgREST .or() uses commas and parentheses as
       * syntax, so remove those characters from user input
       * before building the filter expression.
       */
      const safeSearch =
        rawSearch
          .replace(/[,%()*]/g, " ")
          .replace(/\\/g, " ")
          .replace(/\s+/g, " ")
          .trim();

      let matchingPropertyIds: string[] = [];

      if (safeSearch) {
        const {
          data: matchingProperties,
          error: propertySearchError,
        } = await supabase
          .from("properties")
          .select("id")
          .or(
            [
              `kode.ilike.%${safeSearch}%`,
              `title.ilike.%${safeSearch}%`,
              `title_id.ilike.%${safeSearch}%`,
              `city.ilike.%${safeSearch}%`,
              `area.ilike.%${safeSearch}%`,
              `province.ilike.%${safeSearch}%`,
            ].join(",")
          )
          .limit(500);

        if (propertySearchError) {
          console.error(
            "Tetamo lead property search error:",
            propertySearchError.message
          );
        } else {
          matchingPropertyIds =
            (matchingProperties || []).map(
              (item: { id: string }) => item.id
            );
        }
      }

      let leadsQuery = supabase
        .from("leads")
        .select(
          "id, property_id, property_code, property_title, source, sender_name, sender_phone, sender_email, message, created_at, status, priority, notes, lead_type, viewing_date, viewing_time, viewing_status, receiver_user_id, receiver_role"
        )
        .eq(
          "receiver_user_id",
          userId
        )
        .eq(
          "receiver_role",
          finalRole
        );

      /*
       * STATUS FILTER
       *
       * Keep the same normalization rules already used
       * by the UI:
       *
       * scheduled -> viewing
       * completed -> closed
       */
      if (statusFilter === "new") {
        leadsQuery =
          leadsQuery.eq(
            "status",
            "new"
          );
      }

      if (statusFilter === "contacted") {
        leadsQuery =
          leadsQuery.eq(
            "status",
            "contacted"
          );
      }

      if (statusFilter === "viewing") {
        leadsQuery =
          leadsQuery.in(
            "status",
            [
              "viewing",
              "scheduled",
            ]
          );
      }

      if (statusFilter === "interested") {
        leadsQuery =
          leadsQuery.eq(
            "status",
            "interested"
          );
      }

      if (statusFilter === "closed") {
        leadsQuery =
          leadsQuery.in(
            "status",
            [
              "closed",
              "completed",
            ]
          );
      }

      /*
       * SOURCE FILTER
       *
       * Mirrors normalizeSourceType().
       */
      if (sourceFilter === "whatsapp") {
        leadsQuery =
          leadsQuery.or(
            [
              "lead_type.ilike.%whatsapp%",
              "source.ilike.%whatsapp%",
              "lead_type.eq.wa",
              "source.eq.wa",
              "lead_type.ilike.%chat%",
              "source.ilike.%chat%",
            ].join(",")
          );
      }

      if (sourceFilter === "viewing") {
        leadsQuery =
          leadsQuery.or(
            [
              "lead_type.ilike.%viewing%",
              "source.ilike.%viewing%",
              "lead_type.ilike.%schedule%",
              "source.ilike.%schedule%",
              "lead_type.ilike.%appointment%",
              "source.ilike.%appointment%",
            ].join(",")
          );
      }

      if (sourceFilter === "general") {
        /*
         * General = not WhatsApp/chat and not
         * viewing/schedule/appointment.
         *
         * Include NULL values because older leads may
         * not have source or lead_type populated.
         */
        leadsQuery =
          leadsQuery
            .or(
              [
                "lead_type.is.null",
                [
                  "and(",
                  "lead_type.not.ilike.%whatsapp%,",
                  "lead_type.neq.wa,",
                  "lead_type.not.ilike.%chat%,",
                  "lead_type.not.ilike.%viewing%,",
                  "lead_type.not.ilike.%schedule%,",
                  "lead_type.not.ilike.%appointment%",
                  ")",
                ].join(""),
              ].join(",")
            )
            .or(
              [
                "source.is.null",
                [
                  "and(",
                  "source.not.ilike.%whatsapp%,",
                  "source.neq.wa,",
                  "source.not.ilike.%chat%,",
                  "source.not.ilike.%viewing%,",
                  "source.not.ilike.%schedule%,",
                  "source.not.ilike.%appointment%",
                  ")",
                ].join(""),
              ].join(",")
            );
      }

      /*
       * SEARCH FILTER
       *
       * Search lead/contact fields directly, plus any
       * property IDs found from the property search above.
       */
      if (safeSearch) {
        const searchFilters = [
          `sender_name.ilike.%${safeSearch}%`,
          `sender_phone.ilike.%${safeSearch}%`,
          `sender_email.ilike.%${safeSearch}%`,
          `message.ilike.%${safeSearch}%`,
          `property_title.ilike.%${safeSearch}%`,
          `property_code.ilike.%${safeSearch}%`,
          `source.ilike.%${safeSearch}%`,
          `lead_type.ilike.%${safeSearch}%`,
          `status.ilike.%${safeSearch}%`,
          `priority.ilike.%${safeSearch}%`,
          `notes.ilike.%${safeSearch}%`,
        ];

        if (matchingPropertyIds.length > 0) {
          searchFilters.push(
            `property_id.in.(${matchingPropertyIds.join(",")})`
          );
        }

        leadsQuery =
          leadsQuery.or(
            searchFilters.join(",")
          );
      }

      const {
        data: leadsData,
        error: leadsError,
      } = await leadsQuery
        .order("created_at", {
          ascending: false,
        })
        .order("id", {
          ascending: false,
        })
        .range(
          offset,
          offset + PAGE_SIZE
        );

      if (leadsError) {
        throw leadsError;
      }

      const fetchedRows =
        (leadsData || []) as LeadRow[];

      const pageHasMore =
        fetchedRows.length > PAGE_SIZE;

      const leadRows =
        fetchedRows.slice(
          0,
          PAGE_SIZE
        );

      const propertyIds =
        Array.from(
          new Set(
            leadRows
              .map(
                (item) =>
                  item.property_id
              )
              .filter(Boolean)
          )
        ) as string[];

      let propertyMap =
        new Map<
          string,
          PropertyRow
        >();

      let propertyImageMap =
        new Map<
          string,
          string
        >();

      if (propertyIds.length > 0) {
        const [
          propertyResult,
          imageResult,
        ] = await Promise.all([
          supabase
            .from("properties")
            .select(
              "id, kode, title, title_id, price, city, area, province"
            )
            .in(
              "id",
              propertyIds
            ),

          supabase
            .from(
              "property_images"
            )
            .select(
              "property_id, image_url, sort_order, is_cover, created_at"
            )
            .in(
              "property_id",
              propertyIds
            ),
        ]);

        if (
          propertyResult.error
        ) {
          throw propertyResult.error;
        }

        propertyMap =
          new Map(
            (
              (
                propertyResult.data ||
                []
              ) as PropertyRow[]
            ).map(
              (item) => [
                item.id,
                item,
              ]
            )
          );

        if (imageResult.error) {
          console.error(
            "Tetamo leads property image error:",
            imageResult.error
              .message
          );
        } else {
          const imageRows =
            (
              imageResult.data ||
              []
            ) as PropertyImageRow[];

          const sortedImages =
            [...imageRows].sort(
              (a, b) => {
                if (
                  Boolean(
                    a.is_cover
                  ) !==
                  Boolean(
                    b.is_cover
                  )
                ) {
                  return a.is_cover
                    ? -1
                    : 1;
                }

                const aSort =
                  typeof a.sort_order ===
                  "number"
                    ? a.sort_order
                    : 999999;

                const bSort =
                  typeof b.sort_order ===
                  "number"
                    ? b.sort_order
                    : 999999;

                if (
                  aSort !== bSort
                ) {
                  return (
                    aSort - bSort
                  );
                }

                return String(
                  a.created_at || ""
                ).localeCompare(
                  String(
                    b.created_at ||
                      ""
                  )
                );
              }
            );

          sortedImages.forEach(
            (image) => {
              const propertyId =
                String(
                  image.property_id ||
                    ""
                );

              const url =
                String(
                  image.image_url ||
                    ""
                ).trim();

              if (
                propertyId &&
                url &&
                !propertyImageMap.has(
                  propertyId
                )
              ) {
                propertyImageMap.set(
                  propertyId,
                  url
                );
              }
            }
          );
        }
      }

      const mapped: Lead[] =
        leadRows.map(
          (lead) => {
            const property =
              lead.property_id
                ? propertyMap.get(
                    lead.property_id
                  )
                : null;

            const sourceType =
              normalizeSourceType(
                lead.lead_type,
                lead.source
              );

            const viewingStatus =
              normalizeViewingStatus(
                lead.viewing_status,
                sourceType
              );

            return {
              id: lead.id,

              propertyId:
                lead.property_id,

              listingKode:
                property?.kode ||
                lead.property_code ||
                "-",

              propertyTitle:
                (language === "id"
                  ? property?.title_id ||
                    property?.title
                  : property?.title ||
                    property?.title_id) ||
                lead.property_title ||
                (isId
                  ? "Properti"
                  : "Property"),

              propertyPrice:
                formatCurrency(
                  property?.price ||
                    0
                ),

              propertyLocation:
                buildPropertyLocation(
                  property
                ),

              propertyImage:
                lead.property_id
                  ? propertyImageMap.get(
                      lead.property_id
                    ) || null
                  : null,

              buyerName:
                lead.sender_name ||
                (isId
                  ? "Tanpa Nama"
                  : "No Name"),

              buyerPhone:
                lead.sender_phone ||
                "-",

              buyerEmail:
                lead.sender_email ||
                "-",

              message:
                lead.message || "-",

              createdAt:
                formatDate(
                  lead.created_at,
                  language
                ),

              status:
                normalizeLeadStatus(
                  lead.status
                ),

              leadType:
                lead.lead_type ||
                "lead",

              source:
                lead.source || "-",

              sourceType,

              viewingDate:
                lead.viewing_date,

              viewingTime:
                lead.viewing_time,

              viewingStatus,

              priority:
                lead.priority ||
                "-",

              notes:
                lead.notes || "-",
            };
          }
        );

      return {
        items: mapped,
        fetchedCount:
          leadRows.length,
        hasMore: pageHasMore,
      };
    },
    [
      debouncedSearch,
      isId,
      language,
      sourceFilter,
      statusFilter,
    ]
  );

  const loadLeads = useCallback(
    async (
      showInitialLoader = true
    ) => {
      setErrorMessage("");

      if (showInitialLoader) {
        setLoading(true);
      }

      nextOffsetRef.current = 0;
      loadingMoreRef.current =
        false;

      setLoadingMore(false);
      setHasMore(true);

      const {
        data: { user },
        error: authError,
      } =
        await supabase.auth.getUser();

      if (
        authError ||
        !user
      ) {
        setCurrentUserId(null);
        setLeads([]);
        setStats({
          total: 0,
          new: 0,
          viewing: 0,
        });

        setLoading(false);
        setRefreshing(false);

        router.replace(
          "/login" as any
        );

        return;
      }

      const {
        data: profileData,
      } = await supabase
        .from("profiles")
        .select(
          "full_name, role"
        )
        .eq("id", user.id)
        .maybeSingle();

      const profile =
        (profileData ||
          null) as ProfileRow | null;

      const finalRole =
        roleFromUrl ||
        normalizeDashboardRole(
          profile?.role
        ) ||
        "owner";

      setRole(finalRole);
      setCurrentUserId(
        user.id
      );

      if (
        profile?.full_name
      ) {
        setAgentName(
          profile.full_name
        );
      }

      try {
        const [
          firstPage,
          nextStats,
        ] = await Promise.all([
          fetchLeadPage(
            user.id,
            finalRole,
            0
          ),

          fetchLeadStats(
            user.id,
            finalRole
          ),
        ]);

        setLeads(
          firstPage.items
        );

        setStats(nextStats);

        nextOffsetRef.current =
          firstPage.fetchedCount;

        setHasMore(
          firstPage.hasMore
        );
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : ui.updateError;

        setLeads([]);
        setErrorMessage(
          message ||
            ui.updateError
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [
      fetchLeadPage,
      fetchLeadStats,
      roleFromUrl,
      router,
      ui.updateError,
    ]
  );

  useEffect(() => {
    void loadLeads(true);
  }, [loadLeads]);

  const loadMoreLeads =
    useCallback(async () => {
      if (
        !currentUserId ||
        loading ||
        refreshing ||
        !hasMore ||
        loadingMoreRef.current
      ) {
        return;
      }

      loadingMoreRef.current =
        true;

      setLoadingMore(true);

      try {
        const offset =
          nextOffsetRef.current;

        const nextPage =
          await fetchLeadPage(
            currentUserId,
            role,
            offset
          );

        setLeads((previous) => {
          const existingIds =
            new Set(
              previous.map(
                (lead) =>
                  lead.id
              )
            );

          const newItems =
            nextPage.items.filter(
              (lead) =>
                !existingIds.has(
                  lead.id
                )
            );

          return [
            ...previous,
            ...newItems,
          ];
        });

        nextOffsetRef.current =
          offset +
          nextPage.fetchedCount;

        setHasMore(
          nextPage.hasMore
        );
      } catch (error) {
        console.error(
          "Tetamo load more leads error:",
          error
        );
      } finally {
        loadingMoreRef.current =
          false;

        setLoadingMore(false);
      }
    }, [
      currentUserId,
      fetchLeadPage,
      hasMore,
      loading,
      refreshing,
      role,
    ]);

  /*
   * Search and filters are now applied by Supabase
   * before pagination, so the cards on the phone are
   * already the correct filtered result.
   */
  const filteredLeads = leads;

  const sourceOptions: Array<{ key: SourceFilter; label: string }> = [
    { key: "all", label: ui.sourceAll },
    { key: "whatsapp", label: ui.sourceWhatsapp },
    { key: "viewing", label: ui.sourceViewing },
    { key: "general", label: ui.sourceGeneral },
  ];

  const statusOptions: Array<{ key: StatusFilter; label: string }> = [
    { key: "all", label: ui.statusAll },
    { key: "new", label: ui.new },
    { key: "contacted", label: ui.contacted },
    { key: "viewing", label: ui.viewing },
    { key: "interested", label: ui.interested },
    { key: "closed", label: ui.closed },
  ];

  async function updateLead(
    id: string,
    payload: Partial<{
      status: LeadStatus;
      viewing_status: "scheduled" | "rescheduled" | "done" | "no_show" | null;
    }>
  ) {
    setUpdatingId(id);

    const previousLead =
      leads.find(
        (lead) =>
          lead.id === id
      );

    const { error } = await supabase.from("leads").update(payload).eq("id", id);

    if (error) {
      setUpdatingId(null);
      Alert.alert(ui.updateError, error.message);
      return false;
    }

    setLeads((prev) =>
      prev.map((lead) => {
        if (lead.id !== id) return lead;

        return {
          ...lead,
          status: (payload.status ?? lead.status) as LeadStatus,
          viewingStatus:
            payload.viewing_status === undefined
              ? lead.viewingStatus
              : normalizeViewingStatus(payload.viewing_status, lead.sourceType),
        };
      })
    );

    if (
      previousLead &&
      payload.status !== undefined
    ) {
      const previousStatus =
        previousLead.status;

      const nextStatus =
        payload.status;

      setStats((previous) => {
        let newCount =
          previous.new;

        let viewingCount =
          previous.viewing;

        if (
          previousStatus ===
          "new"
        ) {
          newCount =
            Math.max(
              0,
              newCount - 1
            );
        }

        if (
          previousStatus ===
          "viewing"
        ) {
          viewingCount =
            Math.max(
              0,
              viewingCount - 1
            );
        }

        if (
          nextStatus ===
          "new"
        ) {
          newCount += 1;
        }

        if (
          nextStatus ===
          "viewing"
        ) {
          viewingCount += 1;
        }

        return {
          ...previous,
          new: newCount,
          viewing:
            viewingCount,
        };
      });
    }

    setUpdatingId(null);

    /*
     * If this screen is currently filtered by status,
     * changing the lead may mean it no longer belongs
     * in the visible result set.
     */
    if (
      statusFilter !== "all" &&
      payload.status !== undefined
    ) {
      void loadLeads(false);
    }

    return true;
  }

  async function updateLeadStatus(id: string, nextStatus: LeadStatus) {
    const target = leads.find((lead) => lead.id === id);
    if (!target) return;

    const payload: Partial<{
      status: LeadStatus;
      viewing_status: "scheduled" | "rescheduled" | "done" | "no_show" | null;
    }> = {
      status: nextStatus,
    };

    if (
      target.sourceType === "viewing" &&
      nextStatus === "viewing" &&
      !target.viewingStatus
    ) {
      payload.viewing_status = "scheduled";
    }

    await updateLead(id, payload);
  }

  async function markAsContacted(lead: Lead) {
    if (lead.status !== "new") return true;
    return updateLead(lead.id, { status: "contacted" });
  }

  async function handleCall(lead: Lead) {
    const phone = normalizePhoneForCall(lead.buyerPhone);

    if (!phone || phone === "-") {
      Alert.alert(ui.noPhone);
      return;
    }

    const ok = await markAsContacted(lead);
    if (!ok) return;

    await Linking.openURL(`tel:${phone}`);
  }

  async function handleWhatsApp(lead: Lead) {
    const phone = normalizePhoneForWhatsapp(lead.buyerPhone);

    if (!phone || phone === "-") {
      Alert.alert(ui.noPhone);
      return;
    }

    const message = encodeURIComponent(buildWhatsAppMessage(lead));

    const ok = await markAsContacted(lead);
    if (!ok) return;

    await Linking.openURL(`https://wa.me/${phone}?text=${message}`);
  }

  async function handleRefresh() {
    setRefreshing(true);
    await loadLeads(false);
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />

      <View style={styles.topBar}>
        <Pressable
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft color="#171717" size={16} />
          <Text style={styles.backText}>
            {ui.back}
          </Text>
        </Pressable>

        <View style={styles.langToggle}>
          {(["en", "id"] as Language[]).map(
            (item) => (
              <Pressable
                key={item}
                style={[
                  styles.langButton,
                  language === item &&
                    styles.langButtonActive,
                ]}
                onPress={() =>
                  setLanguage(item)
                }
              >
                <Text
                  style={[
                    styles.langText,
                    language === item &&
                      styles.langTextActive,
                  ]}
                >
                  {item.toUpperCase()}
                </Text>
              </Pressable>
            )
          )}
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        onScroll={({ nativeEvent }) => {
          const {
            layoutMeasurement,
            contentOffset,
            contentSize,
          } = nativeEvent;

          const distanceFromBottom =
            contentSize.height -
            (
              layoutMeasurement.height +
              contentOffset.y
            );

          if (
            distanceFromBottom < 220
          ) {
            void loadMoreLeads();
          }
        }}
        scrollEventThrottle={200}
        refreshControl={
          <RefreshControl
            tintColor="#B8892E"
            refreshing={refreshing}
            onRefresh={handleRefresh}
          />
        }
      >
        <View style={styles.headerBlock}>
          <View style={styles.headerIcon}>
            <UserCheck
              color="#171717"
              size={23}
            />
          </View>

          <View style={styles.headerCopy}>
            <Text style={styles.heroTitle}>
              {ui.title}
            </Text>

            <Text style={styles.heroSubtitle}>
              {ui.subtitle}
            </Text>
          </View>
        </View>

        <View style={styles.statsGrid}>
          <StatBox
            label={ui.statsTotal}
            value={String(stats.total)}
          />

          <StatBox
            label={ui.statsNew}
            value={String(stats.new)}
          />

          <StatBox
            label={ui.statsViewing}
            value={String(stats.viewing)}
          />
        </View>

        <View style={styles.searchBox}>
          <Search
            color="#8B857C"
            size={18}
          />

          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder={
              ui.searchPlaceholder
            }
            placeholderTextColor="#9A948B"
            style={styles.searchInput}
            returnKeyType="search"
          />
        </View>

        <FilterSection
          title={
            isId
              ? "Sumber Lead"
              : "Lead Source"
          }
        >
          {sourceOptions.map((item) => (
            <FilterPill
              key={item.key}
              label={item.label}
              active={
                sourceFilter === item.key
              }
              onPress={() =>
                setSourceFilter(item.key)
              }
            />
          ))}
        </FilterSection>

        <FilterSection
          title={
            isId
              ? "Status Lead"
              : "Lead Status"
          }
        >
          {statusOptions.map((item) => (
            <FilterPill
              key={item.key}
              label={item.label}
              active={
                statusFilter === item.key
              }
              onPress={() =>
                setStatusFilter(item.key)
              }
            />
          ))}
        </FilterSection>

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator
              color="#B8892E"
            />

            <Text style={styles.loadingText}>
              {ui.loading}
            </Text>
          </View>
        ) : null}

        {!loading && errorMessage ? (
          <View style={styles.errorBox}>
            <XCircle
              color="#B84A4A"
              size={18}
            />

            <Text style={styles.errorText}>
              {errorMessage}
            </Text>
          </View>
        ) : null}

        {!loading &&
        !errorMessage &&
        filteredLeads.length === 0 ? (
          <View style={styles.emptyBox}>
            <UserCheck
              color="#B8892E"
              size={28}
            />

            <Text style={styles.emptyText}>
              {ui.empty}
            </Text>
          </View>
        ) : null}

        <View style={styles.leadList}>
          {filteredLeads.map((lead) => {
            const sourceUI =
              getSourceUI(
                lead.sourceType,
                language
              );

            const statusUI =
              getLeadStatusUI(
                lead.status,
                language
              );

            const viewingUI =
              getViewingStatusUI(
                lead.viewingStatus,
                language
              );

            const isUpdating =
              updatingId === lead.id;

            return (
              <View
                key={lead.id}
                style={styles.leadCard}
              >
                <View
                  style={
                    styles.leadCardTop
                  }
                >
                  <View
                    style={styles.badgeRow}
                  >
                    <Badge ui={sourceUI} />
                    <Badge ui={statusUI} />

                    {viewingUI ? (
                      <Badge
                        ui={viewingUI}
                      />
                    ) : null}
                  </View>

                  <Text
                    style={styles.dateText}
                  >
                    {lead.createdAt}
                  </Text>
                </View>

                <Text
                  style={styles.buyerName}
                >
                  {lead.buyerName}
                </Text>

                {lead.buyerPhone !== "-" ? (
                  <Text
                    style={
                      styles.buyerContact
                    }
                  >
                    {lead.buyerPhone}
                  </Text>
                ) : null}

                {lead.buyerEmail !== "-" ? (
                  <Text
                    style={
                      styles.buyerContact
                    }
                  >
                    {lead.buyerEmail}
                  </Text>
                ) : null}

                <Pressable
                  style={styles.propertyBox}
                  disabled={!lead.propertyId}
                  onPress={() => {
                    if (!lead.propertyId) {
                      return;
                    }

                    router.push(
                      `/properti/${lead.propertyId}` as any
                    );
                  }}
                >
                  {lead.propertyImage ? (
                    <Image
                      source={{
                        uri: lead.propertyImage,
                      }}
                      style={
                        styles.propertyImage
                      }
                      resizeMode="cover"
                    />
                  ) : (
                    <View
                      style={
                        styles.propertyImageFallback
                      }
                    >
                      <Home
                        color="#B8892E"
                        size={24}
                      />
                    </View>
                  )}

                  <View
                    style={
                      styles.propertyTextBox
                    }
                  >
                    <Text
                      style={
                        styles.propertyTitle
                      }
                      numberOfLines={2}
                    >
                      {lead.propertyTitle}
                    </Text>

                    <View
                      style={
                        styles.propertyMetaRow
                      }
                    >
                      <MapPin
                        color="#8B857C"
                        size={12}
                      />

                      <Text
                        style={
                          styles.propertyMeta
                        }
                        numberOfLines={1}
                      >
                        {
                          lead.propertyLocation
                        }
                      </Text>
                    </View>

                    <Text
                      style={
                        styles.propertyPrice
                      }
                    >
                      {lead.propertyPrice}
                    </Text>

                    <Text
                      style={
                        styles.propertyCode
                      }
                      numberOfLines={1}
                    >
                      {ui.code}:{" "}
                      {lead.listingKode}
                    </Text>
                  </View>
                </Pressable>

                {lead.message !== "-" ? (
                  <View
                    style={styles.messageBox}
                  >
                    <Text
                      style={
                        styles.messageLabel
                      }
                    >
                      {ui.message}
                    </Text>

                    <Text
                      style={
                        styles.messageText
                      }
                    >
                      {lead.message}
                    </Text>
                  </View>
                ) : null}

                {lead.sourceType ===
                "viewing" ? (
                  <View
                    style={styles.scheduleBox}
                  >
                    <CalendarDays
                      color="#B8892E"
                      size={16}
                    />

                    <Text
                      style={
                        styles.scheduleText
                      }
                    >
                      {ui.requestedSchedule}:{" "}
                      {formatDate(
                        lead.viewingDate,
                        language
                      )}{" "}
                      •{" "}
                      {formatTime(
                        lead.viewingTime
                      )}
                    </Text>
                  </View>
                ) : null}

                {lead.notes !== "-" ? (
                  <Text
                    style={styles.extraText}
                  >
                    {ui.notes}: {lead.notes}
                  </Text>
                ) : null}

                {lead.priority !== "-" ? (
                  <Text
                    style={styles.extraText}
                  >
                    {ui.priority}:{" "}
                    {lead.priority}
                  </Text>
                ) : null}

                <Text
                  style={
                    styles.statusActionLabel
                  }
                >
                  {isId
                    ? "Update status"
                    : "Update status"}
                </Text>

                <View
                  style={
                    styles.statusActionRow
                  }
                >
                  {lead.status !==
                  "viewing" ? (
                    <Pressable
                      style={
                        styles.smallActionButton
                      }
                      disabled={isUpdating}
                      onPress={() =>
                        updateLeadStatus(
                          lead.id,
                          "viewing"
                        )
                      }
                    >
                      <CalendarDays
                        color="#B8892E"
                        size={14}
                      />

                      <Text
                        style={
                          styles.smallActionText
                        }
                      >
                        {ui.markViewing}
                      </Text>
                    </Pressable>
                  ) : null}

                  {lead.status !==
                  "interested" ? (
                    <Pressable
                      style={
                        styles.smallActionButton
                      }
                      disabled={isUpdating}
                      onPress={() =>
                        updateLeadStatus(
                          lead.id,
                          "interested"
                        )
                      }
                    >
                      <CheckCircle2
                        color="#27835C"
                        size={14}
                      />

                      <Text
                        style={
                          styles.smallActionText
                        }
                      >
                        {ui.markInterested}
                      </Text>
                    </Pressable>
                  ) : null}

                  {lead.status !==
                  "closed" ? (
                    <Pressable
                      style={
                        styles.smallActionButton
                      }
                      disabled={isUpdating}
                      onPress={() =>
                        updateLeadStatus(
                          lead.id,
                          "closed"
                        )
                      }
                    >
                      <XCircle
                        color="#777169"
                        size={14}
                      />

                      <Text
                        style={
                          styles.smallActionText
                        }
                      >
                        {ui.markClosed}
                      </Text>
                    </Pressable>
                  ) : null}
                </View>

                <View
                  style={styles.contactRow}
                >
                  <Pressable
                    style={styles.callButton}
                    disabled={isUpdating}
                    onPress={() =>
                      void handleCall(lead)
                    }
                  >
                    <Phone
                      color="#FFFFFF"
                      size={16}
                    />

                    <Text
                      style={
                        styles.callButtonText
                      }
                    >
                      {ui.contact}
                    </Text>
                  </Pressable>

                  <Pressable
                    style={
                      styles.whatsappButton
                    }
                    disabled={isUpdating}
                    onPress={() =>
                      void handleWhatsApp(
                        lead
                      )
                    }
                  >
                    <MessageCircle
                      color="#FFFFFF"
                      size={16}
                    />

                    <Text
                      style={
                        styles.whatsappButtonText
                      }
                    >
                      {ui.whatsapp}
                    </Text>
                  </Pressable>
                </View>
              </View>
            );
          })}
        </View>

        {loadingMore ? (
          <View
            style={
              styles.paginationLoading
            }
          >
            <ActivityIndicator
              color="#B8892E"
              size="small"
            />

            <Text
              style={
                styles.paginationLoadingText
              }
            >
              {isId
                ? "Memuat lead berikutnya..."
                : "Loading more leads..."}
            </Text>
          </View>
        ) : null}

        {!loading &&
        !loadingMore &&
        !hasMore &&
        leads.length > 0 ? (
          <Text
            style={
              styles.paginationEnd
            }
          >
            {isId
              ? "Semua lead sudah dimuat."
              : "All leads loaded."}
          </Text>
        ) : null}

      </ScrollView>
    </SafeAreaView>
  );
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statBox}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function FilterSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.filterSection}>
      <Text style={styles.filterTitle}>{title}</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
      >
        {children}
      </ScrollView>
    </View>
  );
}

function FilterPill({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={[styles.filterPill, active && styles.filterPillActive]}
      onPress={onPress}
    >
      <Text
        style={[
          styles.filterPillText,
          active && styles.filterPillTextActive,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function Badge({
  ui,
}: {
  ui: {
    label: string;
    bg: string;
    border: string;
    color: string;
    icon?: React.ReactNode;
  };
}) {
  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: ui.bg,
          borderColor: ui.border,
        },
      ]}
    >
      {ui.icon}
      <Text style={[styles.badgeText, { color: ui.color }]}>{ui.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F7F5EF",
  },

  topBar: {
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 10,
    backgroundColor: "#F7F5EF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },

  backButton: {
    minHeight: 38,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#E5DED3",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  backText: {
    color: "#171717",
    fontSize: 11,
    fontWeight: "900",
  },

  langToggle: {
    flexDirection: "row",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#DCCB9A",
    backgroundColor: "#FFFFFF",
    overflow: "hidden",
  },

  langButton: {
    paddingHorizontal: 11,
    paddingVertical: 8,
  },

  langButtonActive: {
    backgroundColor: "#F0D889",
  },

  langText: {
    color: "#9A7624",
    fontSize: 9.5,
    fontWeight: "900",
  },

  langTextActive: {
    color: "#171717",
  },

  scroll: {
    flex: 1,
    backgroundColor: "#F7F5EF",
  },

  content: {
    paddingHorizontal: 18,
    paddingTop: 6,
    paddingBottom: 130,
  },

  headerBlock: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#E9E3DA",
    padding: 17,
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
    marginBottom: 12,
  },

  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 17,
    backgroundColor: "#F0D889",
    alignItems: "center",
    justifyContent: "center",
  },

  headerCopy: {
    flex: 1,
  },

  heroTitle: {
    color: "#171717",
    fontSize: 23,
    lineHeight: 28,
    fontWeight: "900",
    letterSpacing: -0.4,
  },

  heroSubtitle: {
    color: "#777169",
    fontSize: 11.5,
    lineHeight: 17,
    fontWeight: "600",
    marginTop: 4,
  },

  statsGrid: {
    flexDirection: "row",
    gap: 9,
    marginBottom: 12,
  },

  statBox: {
    flex: 1,
    minHeight: 72,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E9E3DA",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 13,
    paddingVertical: 12,
    justifyContent: "center",
  },

  statValue: {
    color: "#171717",
    fontSize: 21,
    fontWeight: "900",
  },

  statLabel: {
    color: "#89837A",
    fontSize: 10,
    fontWeight: "800",
    marginTop: 3,
  },

  searchBox: {
    minHeight: 52,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: "#E4DED5",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    marginBottom: 12,
  },

  searchInput: {
    flex: 1,
    color: "#171717",
    fontSize: 12.5,
    fontWeight: "600",
    paddingVertical: 0,
  },

  filterSection: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E9E3DA",
    padding: 12,
    marginBottom: 10,
  },

  filterTitle: {
    color: "#38332E",
    fontSize: 10.5,
    fontWeight: "900",
    marginBottom: 9,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  filterRow: {
    gap: 7,
    paddingRight: 8,
  },

  filterPill: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#DED7CD",
    backgroundColor: "#FAF8F4",
    paddingHorizontal: 11,
    paddingVertical: 8,
  },

  filterPillActive: {
    borderColor: "#D8B84B",
    backgroundColor: "#F0D889",
  },

  filterPillText: {
    color: "#777169",
    fontSize: 10.2,
    fontWeight: "900",
  },

  filterPillTextActive: {
    color: "#171717",
  },

  loadingBox: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E9E3DA",
    backgroundColor: "#FFFFFF",
    padding: 20,
    alignItems: "center",
    gap: 10,
  },

  loadingText: {
    color: "#5F5A53",
    fontSize: 12,
    fontWeight: "700",
  },

  errorBox: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E8C1C1",
    backgroundColor: "#FFF1F1",
    padding: 13,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 9,
  },

  errorText: {
    color: "#9E3838",
    fontSize: 11.8,
    lineHeight: 17,
    fontWeight: "700",
    flex: 1,
  },

  emptyBox: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#E9E3DA",
    backgroundColor: "#FFFFFF",
    padding: 24,
    alignItems: "center",
    gap: 10,
  },

  emptyText: {
    color: "#777169",
    fontSize: 12,
    fontWeight: "700",
    textAlign: "center",
  },

  leadList: {
    gap: 13,
    marginTop: 3,
  },

  leadCard: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#E6DFD5",
    backgroundColor: "#FFFFFF",
    padding: 15,
  },

  leadCardTop: {
    gap: 8,
  },

  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },

  badge: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 9,
    paddingVertical: 5,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  badgeText: {
    fontSize: 9.5,
    fontWeight: "900",
  },

  dateText: {
    color: "#9A948B",
    fontSize: 10,
    fontWeight: "700",
  },

  buyerName: {
    color: "#171717",
    fontSize: 17,
    lineHeight: 22,
    fontWeight: "900",
    marginTop: 13,
  },

  buyerContact: {
    color: "#777169",
    fontSize: 11.5,
    lineHeight: 16,
    fontWeight: "600",
    marginTop: 2,
  },

  propertyBox: {
    marginTop: 14,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: "#E6DED0",
    backgroundColor: "#FAF7F0",
    padding: 9,
    flexDirection: "row",
    alignItems: "stretch",
    gap: 11,
  },

  propertyImage: {
    width: 96,
    height: 96,
    borderRadius: 15,
    backgroundColor: "#EEEAE3",
  },

  propertyImageFallback: {
    width: 96,
    height: 96,
    borderRadius: 15,
    backgroundColor: "#F3EEE3",
    alignItems: "center",
    justifyContent: "center",
  },

  propertyTextBox: {
    flex: 1,
    minHeight: 96,
    justifyContent: "center",
    paddingVertical: 2,
  },

  propertyTitle: {
    color: "#171717",
    fontSize: 12.5,
    lineHeight: 17,
    fontWeight: "900",
  },

  propertyMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 5,
  },

  propertyMeta: {
    color: "#777169",
    fontSize: 10.5,
    fontWeight: "600",
    flex: 1,
  },

  propertyPrice: {
    color: "#A47B21",
    fontSize: 12,
    fontWeight: "900",
    marginTop: 6,
  },

  propertyCode: {
    color: "#9A948B",
    fontSize: 9.8,
    fontWeight: "700",
    marginTop: 3,
  },

  messageBox: {
    borderRadius: 17,
    backgroundColor: "#F7F5EF",
    padding: 12,
    marginTop: 12,
  },

  messageLabel: {
    color: "#9A948B",
    fontSize: 9.5,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },

  messageText: {
    color: "#38332E",
    fontSize: 11.8,
    lineHeight: 17,
    fontWeight: "600",
    marginTop: 6,
  },

  scheduleBox: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2D3A3",
    backgroundColor: "#FFF9E8",
    padding: 11,
    marginTop: 11,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },

  scheduleText: {
    color: "#4F4632",
    fontSize: 11,
    lineHeight: 16,
    fontWeight: "700",
    flex: 1,
  },

  extraText: {
    color: "#777169",
    fontSize: 10.8,
    lineHeight: 16,
    fontWeight: "600",
    marginTop: 7,
  },

  statusActionLabel: {
    color: "#9A948B",
    fontSize: 9.5,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginTop: 14,
  },

  statusActionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
    marginTop: 8,
  },

  smallActionButton: {
    minHeight: 36,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: "#DDD6CC",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  smallActionText: {
    color: "#39342F",
    fontSize: 10,
    fontWeight: "900",
  },

  contactRow: {
    flexDirection: "row",
    gap: 9,
    marginTop: 14,
  },

  callButton: {
    flex: 1,
    minHeight: 46,
    borderRadius: 15,
    backgroundColor: "#171717",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },

  callButtonText: {
    color: "#FFFFFF",
    fontSize: 11.5,
    fontWeight: "900",
  },

  whatsappButton: {
    flex: 1,
    minHeight: 46,
    borderRadius: 15,
    backgroundColor: "#198754",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },

  whatsappButtonText: {
    color: "#FFFFFF",
    fontSize: 11.5,
    fontWeight: "900",
  },

  paginationLoading: {
    minHeight: 58,
    marginTop: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
  },

  paginationLoadingText: {
    color: "#777169",
    fontSize: 11,
    fontWeight: "700",
  },

  paginationEnd: {
    color: "#9A948B",
    fontSize: 10.5,
    lineHeight: 16,
    fontWeight: "700",
    textAlign: "center",
    marginTop: 18,
    marginBottom: 4,
  },

});
