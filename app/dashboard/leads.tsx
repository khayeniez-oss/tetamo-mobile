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
import { useCallback, useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Alert,
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
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const isId = language === "id";

  const roleFromUrl = useMemo(() => {
    return normalizeDashboardRole(readParam(params.role));
  }, [params.role]);

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

  const loadLeads = useCallback(async () => {
    setErrorMessage("");

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      setLeads([]);
      setLoading(false);
      setRefreshing(false);
      router.replace("/login" as any);
      return;
    }

    const { data: profileData } = await supabase
      .from("profiles")
      .select("full_name, role")
      .eq("id", user.id)
      .maybeSingle();

    const profile = (profileData || null) as ProfileRow | null;

    const finalRole =
      roleFromUrl || normalizeDashboardRole(profile?.role) || "owner";

    setRole(finalRole);

    if (profile?.full_name) {
      setAgentName(profile.full_name);
    }

    const { data: leadsData, error: leadsError } = await supabase
      .from("leads")
      .select(
        "id, property_id, property_code, property_title, source, sender_name, sender_phone, sender_email, message, created_at, status, priority, notes, lead_type, viewing_date, viewing_time, viewing_status, receiver_user_id, receiver_role"
      )
      .eq("receiver_user_id", user.id)
      .eq("receiver_role", finalRole)
      .order("created_at", { ascending: false });

    if (leadsError) {
      setLeads([]);
      setErrorMessage(leadsError.message || ui.updateError);
      setLoading(false);
      setRefreshing(false);
      return;
    }

    const leadRows = (leadsData || []) as LeadRow[];
    const propertyIds = Array.from(
      new Set(leadRows.map((item) => item.property_id).filter(Boolean))
    ) as string[];

    let propertyMap = new Map<string, PropertyRow>();

    if (propertyIds.length > 0) {
      const { data: propertyData, error: propertyError } = await supabase
        .from("properties")
        .select("id, kode, title, title_id, price, city, area, province")
        .in("id", propertyIds);

      if (propertyError) {
        setLeads([]);
        setErrorMessage(propertyError.message || ui.updateError);
        setLoading(false);
        setRefreshing(false);
        return;
      }

      propertyMap = new Map(
        ((propertyData || []) as PropertyRow[]).map((item) => [item.id, item])
      );
    }

    const mapped: Lead[] = leadRows.map((lead) => {
      const property = lead.property_id
        ? propertyMap.get(lead.property_id)
        : null;

      const sourceType = normalizeSourceType(lead.lead_type, lead.source);
      const viewingStatus = normalizeViewingStatus(
        lead.viewing_status,
        sourceType
      );

      return {
        id: lead.id,
        propertyId: lead.property_id,
        listingKode: property?.kode || lead.property_code || "-",
        propertyTitle:
          (language === "id"
            ? property?.title_id || property?.title
            : property?.title || property?.title_id) ||
          lead.property_title ||
          (isId ? "Properti" : "Property"),
        propertyPrice: formatCurrency(property?.price || 0),
        propertyLocation: buildPropertyLocation(property),
        buyerName: lead.sender_name || (isId ? "Tanpa Nama" : "No Name"),
        buyerPhone: lead.sender_phone || "-",
        buyerEmail: lead.sender_email || "-",
        message: lead.message || "-",
        createdAt: formatDate(lead.created_at, language),
        status: normalizeLeadStatus(lead.status),
        leadType: lead.lead_type || "lead",
        source: lead.source || "-",
        sourceType,
        viewingDate: lead.viewing_date,
        viewingTime: lead.viewing_time,
        viewingStatus,
        priority: lead.priority || "-",
        notes: lead.notes || "-",
      };
    });

    setLeads(mapped);
    setLoading(false);
    setRefreshing(false);
  }, [isId, language, roleFromUrl, router, ui.updateError]);

  useEffect(() => {
    void loadLeads();
  }, [loadLeads]);

  const filteredLeads = useMemo(() => {
    const q = search.trim().toLowerCase();

    return leads.filter((lead) => {
      const matchesSource =
        sourceFilter === "all" || lead.sourceType === sourceFilter;

      const matchesStatus =
        statusFilter === "all" || lead.status === statusFilter;

      const searchable = `
        ${lead.buyerName}
        ${lead.buyerPhone}
        ${lead.buyerEmail}
        ${lead.message}
        ${lead.propertyTitle}
        ${lead.propertyLocation}
        ${lead.listingKode}
        ${lead.propertyPrice}
        ${lead.leadType}
        ${lead.source}
        ${lead.sourceType}
        ${lead.status}
        ${lead.viewingStatus || ""}
        ${lead.priority}
        ${lead.notes}
      `.toLowerCase();

      const matchesSearch = !q || searchable.includes(q);

      return matchesSource && matchesStatus && matchesSearch;
    });
  }, [leads, search, sourceFilter, statusFilter]);

  const stats = useMemo(() => {
    return {
      total: filteredLeads.length,
      new: filteredLeads.filter((item) => item.status === "new").length,
      viewing: filteredLeads.filter((item) => item.status === "viewing").length,
    };
  }, [filteredLeads]);

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

    setUpdatingId(null);
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
    await loadLeads();
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />

      <View style={styles.topBar}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft color="#ffffff" size={15} />
          <Text style={styles.backText}>{ui.back}</Text>
        </Pressable>

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
            <UserCheck color="#111111" size={24} />
          </View>

          <Text style={styles.heroTitle}>{ui.title}</Text>
          <Text style={styles.heroSubtitle}>{ui.subtitle}</Text>
        </View>

        <View style={styles.statsGrid}>
          <StatBox label={ui.statsTotal} value={String(stats.total)} />
          <StatBox label={ui.statsNew} value={String(stats.new)} />
          <StatBox label={ui.statsViewing} value={String(stats.viewing)} />
        </View>

        <View style={styles.searchBox}>
          <Search color="#a9a9a9" size={17} />

          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder={ui.searchPlaceholder}
            placeholderTextColor="#777777"
            style={styles.searchInput}
            returnKeyType="search"
          />
        </View>

        <FilterSection title={isId ? "Sumber Lead" : "Lead Source"}>
          {sourceOptions.map((item) => (
            <FilterPill
              key={item.key}
              label={item.label}
              active={sourceFilter === item.key}
              onPress={() => setSourceFilter(item.key)}
            />
          ))}
        </FilterSection>

        <FilterSection title={isId ? "Status Lead" : "Lead Status"}>
          {statusOptions.map((item) => (
            <FilterPill
              key={item.key}
              label={item.label}
              active={statusFilter === item.key}
              onPress={() => setStatusFilter(item.key)}
            />
          ))}
        </FilterSection>

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator color="#e6c15c" />
            <Text style={styles.loadingText}>{ui.loading}</Text>
          </View>
        ) : null}

        {!loading && errorMessage ? (
          <View style={styles.errorBox}>
            <XCircle color="#fecaca" size={18} />
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        ) : null}

        {!loading && !errorMessage && filteredLeads.length === 0 ? (
          <View style={styles.emptyBox}>
            <UserCheck color="#a9a9a9" size={28} />
            <Text style={styles.emptyText}>{ui.empty}</Text>
          </View>
        ) : null}

        <View style={styles.leadList}>
          {filteredLeads.map((lead) => {
            const sourceUI = getSourceUI(lead.sourceType, language);
            const statusUI = getLeadStatusUI(lead.status, language);
            const viewingUI = getViewingStatusUI(
              lead.viewingStatus,
              language
            );
            const isUpdating = updatingId === lead.id;

            return (
              <View key={lead.id} style={styles.leadCard}>
                <View style={styles.badgeRow}>
                  <Badge ui={sourceUI} />
                  <Badge ui={statusUI} />
                  {viewingUI ? <Badge ui={viewingUI} /> : null}
                </View>

                <Text style={styles.dateText}>{lead.createdAt}</Text>

                <Text style={styles.buyerName}>{lead.buyerName}</Text>
                <Text style={styles.buyerContact}>{lead.buyerPhone}</Text>

                {lead.buyerEmail !== "-" ? (
                  <Text style={styles.buyerContact}>{lead.buyerEmail}</Text>
                ) : null}

                <View style={styles.messageBox}>
                  <Text style={styles.messageLabel}>{ui.message}</Text>
                  <Text style={styles.messageText}>{lead.message}</Text>
                </View>

                <View style={styles.propertyBox}>
                  <View style={styles.propertyIcon}>
                    <Home color="#e6c15c" size={19} />
                  </View>

                  <View style={styles.propertyTextBox}>
                    <Text style={styles.propertyTitle} numberOfLines={2}>
                      {lead.propertyTitle}
                    </Text>

                    <View style={styles.propertyMetaRow}>
                      <MapPin color="#a9a9a9" size={12} />
                      <Text style={styles.propertyMeta} numberOfLines={1}>
                        {lead.propertyLocation}
                      </Text>
                    </View>

                    <Text style={styles.propertyPrice}>
                      {lead.propertyPrice}
                    </Text>

                    <Text style={styles.propertyCode}>
                      {ui.code}: {lead.listingKode}
                    </Text>
                  </View>
                </View>

                {lead.sourceType === "viewing" ? (
                  <View style={styles.scheduleBox}>
                    <CalendarDays color="#e6c15c" size={16} />
                    <Text style={styles.scheduleText}>
                      {ui.requestedSchedule}:{" "}
                      {formatDate(lead.viewingDate, language)} •{" "}
                      {formatTime(lead.viewingTime)}
                    </Text>
                  </View>
                ) : null}

                {lead.notes !== "-" ? (
                  <Text style={styles.extraText}>
                    {ui.notes}: {lead.notes}
                  </Text>
                ) : null}

                {lead.priority !== "-" ? (
                  <Text style={styles.extraText}>
                    {ui.priority}: {lead.priority}
                  </Text>
                ) : null}

                <View style={styles.statusActionRow}>
                  {lead.status !== "viewing" ? (
                    <Pressable
                      style={styles.smallActionButton}
                      disabled={isUpdating}
                      onPress={() => updateLeadStatus(lead.id, "viewing")}
                    >
                      <CalendarDays color="#e6c15c" size={14} />
                      <Text style={styles.smallActionText}>
                        {ui.markViewing}
                      </Text>
                    </Pressable>
                  ) : null}

                  {lead.status !== "interested" ? (
                    <Pressable
                      style={styles.smallActionButton}
                      disabled={isUpdating}
                      onPress={() => updateLeadStatus(lead.id, "interested")}
                    >
                      <CheckCircle2 color="#22c55e" size={14} />
                      <Text style={styles.smallActionText}>
                        {ui.markInterested}
                      </Text>
                    </Pressable>
                  ) : null}

                  {lead.status !== "closed" ? (
                    <Pressable
                      style={styles.smallActionButton}
                      disabled={isUpdating}
                      onPress={() => updateLeadStatus(lead.id, "closed")}
                    >
                      <XCircle color="#a9a9a9" size={14} />
                      <Text style={styles.smallActionText}>
                        {ui.markClosed}
                      </Text>
                    </Pressable>
                  ) : null}
                </View>

                <View style={styles.contactRow}>
                  <Pressable
                    style={styles.callButton}
                    disabled={isUpdating}
                    onPress={() => void handleCall(lead)}
                  >
                    <Phone color="#ffffff" size={15} />
                    <Text style={styles.callButtonText}>{ui.contact}</Text>
                  </Pressable>

                  <Pressable
                    style={styles.whatsappButton}
                    disabled={isUpdating}
                    onPress={() => void handleWhatsApp(lead)}
                  >
                    <MessageCircle color="#ffffff" size={15} />
                    <Text style={styles.whatsappButtonText}>
                      {ui.whatsapp}
                    </Text>
                  </Pressable>
                </View>
              </View>
            );
          })}
        </View>
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
    marginBottom: 12,
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
  statsGrid: {
    flexDirection: "row",
    gap: 9,
    marginBottom: 12,
  },
  statBox: {
    flex: 1,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#303030",
    backgroundColor: "#101010",
    padding: 12,
  },
  statValue: {
    color: "#ffffff",
    fontSize: 20,
    fontWeight: "900",
  },
  statLabel: {
    color: "#a9a9a9",
    fontSize: 10.5,
    fontWeight: "800",
    marginTop: 3,
  },
  searchBox: {
    minHeight: 50,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#303030",
    backgroundColor: "#101010",
    paddingHorizontal: 13,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    color: "#ffffff",
    fontSize: 12.5,
    fontWeight: "700",
    paddingVertical: 0,
  },
  filterSection: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#303030",
    backgroundColor: "#101010",
    padding: 12,
    marginBottom: 12,
  },
  filterTitle: {
    color: "#ffffff",
    fontSize: 11.5,
    fontWeight: "900",
    marginBottom: 9,
  },
  filterRow: {
    gap: 8,
    paddingRight: 8,
  },
  filterPill: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#343434",
    backgroundColor: "#050505",
    paddingHorizontal: 11,
    paddingVertical: 8,
  },
  filterPillActive: {
    borderColor: "#e6c15c",
    backgroundColor: "#e6c15c",
  },
  filterPillText: {
    color: "#a9a9a9",
    fontSize: 10.5,
    fontWeight: "900",
  },
  filterPillTextActive: {
    color: "#111111",
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
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 9,
  },
  errorText: {
    color: "#fecaca",
    fontSize: 11.8,
    lineHeight: 17,
    fontWeight: "700",
    flex: 1,
  },
  emptyBox: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#303030",
    backgroundColor: "#101010",
    padding: 22,
    alignItems: "center",
    gap: 10,
  },
  emptyText: {
    color: "#a9a9a9",
    fontSize: 12,
    fontWeight: "800",
    textAlign: "center",
  },
  leadList: {
    gap: 13,
  },
  leadCard: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#303030",
    backgroundColor: "#101010",
    padding: 15,
  },
  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
  },
  badge: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 9,
    paddingVertical: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  badgeText: {
    fontSize: 9.8,
    fontWeight: "900",
  },
  dateText: {
    color: "#777777",
    fontSize: 10.5,
    fontWeight: "800",
    marginTop: 10,
  },
  buyerName: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "900",
    marginTop: 9,
  },
  buyerContact: {
    color: "#a9a9a9",
    fontSize: 11.5,
    lineHeight: 16,
    fontWeight: "700",
    marginTop: 3,
  },
  messageBox: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#252525",
    backgroundColor: "#050505",
    padding: 12,
    marginTop: 12,
  },
  messageLabel: {
    color: "#777777",
    fontSize: 10,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  messageText: {
    color: "#ffffff",
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "700",
    marginTop: 6,
  },
  propertyBox: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#5b4a24",
    backgroundColor: "#211a0b",
    padding: 12,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 11,
    marginTop: 12,
  },
  propertyIcon: {
    width: 40,
    height: 40,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#705d2c",
    backgroundColor: "#151106",
    alignItems: "center",
    justifyContent: "center",
  },
  propertyTextBox: {
    flex: 1,
  },
  propertyTitle: {
    color: "#ffffff",
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "900",
  },
  propertyMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 5,
  },
  propertyMeta: {
    color: "#d6d6d6",
    fontSize: 11,
    fontWeight: "700",
    flex: 1,
  },
  propertyPrice: {
    color: "#e6c15c",
    fontSize: 12,
    fontWeight: "900",
    marginTop: 5,
  },
  propertyCode: {
    color: "#c9b56b",
    fontSize: 10.5,
    fontWeight: "800",
    marginTop: 4,
  },
  scheduleBox: {
    borderRadius: 17,
    borderWidth: 1,
    borderColor: "#705d2c",
    backgroundColor: "#211a0b",
    padding: 11,
    marginTop: 12,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  scheduleText: {
    color: "#ffffff",
    fontSize: 11.5,
    lineHeight: 16,
    fontWeight: "800",
    flex: 1,
  },
  extraText: {
    color: "#a9a9a9",
    fontSize: 11,
    lineHeight: 16,
    fontWeight: "700",
    marginTop: 8,
  },
  statusActionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 13,
  },
  smallActionButton: {
    minHeight: 36,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#303030",
    backgroundColor: "#050505",
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  smallActionText: {
    color: "#ffffff",
    fontSize: 10.5,
    fontWeight: "900",
  },
  contactRow: {
    flexDirection: "row",
    gap: 9,
    marginTop: 13,
  },
  callButton: {
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
  callButtonText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "900",
  },
  whatsappButton: {
    flex: 1,
    minHeight: 44,
    borderRadius: 15,
    backgroundColor: "#16a34a",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },
  whatsappButtonText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "900",
  },
});