import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
    ArrowLeft,
    CalendarDays,
    CheckCircle2,
    Clock3,
    MessageCircle,
    Phone,
    RefreshCcw,
    RotateCcw,
    Search,
    UserCheck,
    XCircle,
} from "lucide-react-native";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Linking,
    Modal,
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
type ViewingStatus = "scheduled" | "rescheduled" | "done" | "no_show";
type LeadDbStatus = "new" | "contacted" | "viewing" | "interested" | "closed";
type FilterStatus = "all" | ViewingStatus;

type LeadRow = {
  id: string;
  property_id: string | null;
  sender_name: string | null;
  sender_phone: string | null;
  sender_email: string | null;
  message: string | null;
  created_at: string | null;
  status: string | null;
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
  city: string | null;
  area: string | null;
  province: string | null;
};

type Viewing = {
  id: string;
  propertyId: string;
  listingKode: string;
  propertyTitle: string;
  buyerName: string;
  buyerPhone: string;
  buyerEmail: string;
  viewingDate: string;
  viewingTime: string;
  viewingDateRaw: string | null;
  viewingTimeRaw: string | null;
  location: string;
  status: ViewingStatus;
  dbStatus: LeadDbStatus;
};

function normalizeLeadDbStatus(value?: string | null): LeadDbStatus {
  const v = String(value || "").trim().toLowerCase();

  if (v === "contacted") return "contacted";
  if (v === "viewing") return "viewing";
  if (v === "interested") return "interested";
  if (v === "closed" || v === "completed") return "closed";

  return "new";
}

function normalizeViewingStatus(value?: string | null): ViewingStatus {
  const v = String(value || "").trim().toLowerCase();

  if (v === "rescheduled") return "rescheduled";
  if (v === "done") return "done";
  if (v === "no_show") return "no_show";

  return "scheduled";
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

  const date = parseLocalDate(value) || new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat(language === "id" ? "id-ID" : "en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
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

function buildLocation(property?: PropertyRow | null) {
  if (!property) return "-";

  const parts = [property.area, property.city, property.province].filter(Boolean);

  return parts.length > 0 ? parts.join(", ") : "-";
}

function getSortTime(item: Viewing) {
  if (!item.viewingDateRaw) return 0;

  const date = new Date(
    `${item.viewingDateRaw}T${item.viewingTimeRaw || "00:00"}`
  );

  const time = date.getTime();

  return Number.isNaN(time) ? 0 : time;
}

function sortViewingItems(items: Viewing[]) {
  return [...items].sort((a, b) => {
    const aDate = getSortTime(a);
    const bDate = getSortTime(b);

    if (aDate === bDate) return b.id.localeCompare(a.id);
    if (aDate === 0) return 1;
    if (bDate === 0) return -1;

    return aDate - bDate;
  });
}

function buildPropertyUrl(viewing: Viewing) {
  if (viewing.propertyId) {
    return `https://www.tetamo.com/properti/${viewing.propertyId}`;
  }

  return "https://www.tetamo.com";
}

function getViewingStatusUI(status: ViewingStatus, language: Language) {
  const isId = language === "id";

  if (status === "scheduled") {
    return {
      label: isId ? "Terjadwal" : "Scheduled",
      color: "#e6c15c",
      bg: "#211a0b",
      border: "#705d2c",
      icon: <Clock3 color="#e6c15c" size={13} />,
    };
  }

  if (status === "rescheduled") {
    return {
      label: isId ? "Dijadwalkan Ulang" : "Rescheduled",
      color: "#38bdf8",
      bg: "#082f49",
      border: "#0369a1",
      icon: <RotateCcw color="#38bdf8" size={13} />,
    };
  }

  if (status === "done") {
    return {
      label: isId ? "Selesai" : "Done",
      color: "#22c55e",
      bg: "#052e16",
      border: "#166534",
      icon: <CheckCircle2 color="#22c55e" size={13} />,
    };
  }

  return {
    label: isId ? "Tidak Hadir" : "No Show",
    color: "#f87171",
    bg: "#2a0d0d",
    border: "#7f1d1d",
    icon: <XCircle color="#f87171" size={13} />,
  };
}

function getLeadStatusUI(status: LeadDbStatus, language: Language) {
  const isId = language === "id";

  if (status === "new") {
    return {
      label: isId ? "Lead Baru" : "New Lead",
      color: "#d6d6d6",
      bg: "#171717",
      border: "#333333",
      icon: <UserCheck color="#d6d6d6" size={13} />,
    };
  }

  if (status === "contacted") {
    return {
      label: isId ? "Dihubungi" : "Contacted",
      color: "#a5b4fc",
      bg: "#1e1b4b",
      border: "#4338ca",
      icon: <Phone color="#a5b4fc" size={13} />,
    };
  }

  if (status === "viewing") {
    return {
      label: "Viewing",
      color: "#38bdf8",
      bg: "#082f49",
      border: "#0369a1",
      icon: <CalendarDays color="#38bdf8" size={13} />,
    };
  }

  if (status === "interested") {
    return {
      label: isId ? "Tertarik" : "Interested",
      color: "#22c55e",
      bg: "#052e16",
      border: "#166534",
      icon: <CheckCircle2 color="#22c55e" size={13} />,
    };
  }

  return {
    label: "Closed",
    color: "#ffffff",
    bg: "#050505",
    border: "#4b5563",
    icon: <CheckCircle2 color="#ffffff" size={13} />,
  };
}

export default function DashboardViewingScheduleScreen() {
  const router = useRouter();

  const [language, setLanguage] = useState<Language>("en");
  const [viewings, setViewings] = useState<Viewing[]>([]);
  const [agentName, setAgentName] = useState("TETAMO Agent");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<FilterStatus>("all");

  const [rescheduleTarget, setRescheduleTarget] = useState<Viewing | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleTime, setRescheduleTime] = useState("");

  const isId = language === "id";

  const ui = useMemo(() => {
    if (isId) {
      return {
        back: "Kembali",
        pageTitle: "Jadwal Viewing",
        pageDesc:
          "Kelola jadwal kunjungan properti, hubungi calon buyer, dan update status viewing.",
        errorLogin: "Silakan login sebagai agent terlebih dahulu.",
        loading: "Memuat jadwal viewing...",
        empty: "Belum ada jadwal viewing untuk agent ini.",
        statsScheduled: "Terjadwal",
        statsRescheduled: "Reschedule",
        statsDone: "Selesai",
        statsNoShow: "No Show",
        searchPlaceholder:
          "Cari buyer, telepon, properti, kode listing, atau lokasi...",
        filterAll: "Semua",
        call: "Call",
        whatsapp: "WhatsApp",
        reschedule: "Reschedule",
        done: "Selesai",
        noShow: "No Show",
        code: "Kode",
        buyer: "Buyer",
        location: "Lokasi",
        noPhone: "Nomor tidak tersedia.",
        modalTitle: "Reschedule Viewing",
        newDate: "Tanggal Baru",
        newTime: "Jam Baru",
        saveNewSchedule: "Simpan Jadwal Baru",
        close: "Tutup",
        updateFailed: "Gagal memperbarui viewing.",
        message: (viewing: Viewing, name: string) =>
          `Halo ${viewing.buyerName},

Saya ${name}, agent dari TETAMO.

Saya ingin mengonfirmasi jadwal viewing untuk properti berikut:

🏠 ${viewing.propertyTitle}
📍 ${viewing.location}
📅 ${viewing.viewingDate}
⏰ ${viewing.viewingTime}

${buildPropertyUrl(viewing)}

Apakah jadwal ini masih sesuai untuk Anda?`,
      };
    }

    return {
      back: "Back",
      pageTitle: "Viewing Schedule",
      pageDesc:
        "Manage property viewing appointments, contact buyers, and update viewing status.",
      errorLogin: "Please log in as an agent first.",
      loading: "Loading viewing schedule...",
      empty: "No viewing schedule found for this agent yet.",
      statsScheduled: "Scheduled",
      statsRescheduled: "Rescheduled",
      statsDone: "Done",
      statsNoShow: "No Show",
      searchPlaceholder:
        "Search buyer, phone, property title, listing code, or location...",
      filterAll: "All",
      call: "Call",
      whatsapp: "WhatsApp",
      reschedule: "Reschedule",
      done: "Done",
      noShow: "No Show",
      code: "Code",
      buyer: "Buyer",
      location: "Location",
      noPhone: "Phone number unavailable.",
      modalTitle: "Reschedule Viewing",
      newDate: "New Date",
      newTime: "New Time",
      saveNewSchedule: "Save New Schedule",
      close: "Close",
      updateFailed: "Failed to update viewing.",
      message: (viewing: Viewing, name: string) =>
        `Hi ${viewing.buyerName},

This is ${name}, an agent from TETAMO.

I would like to confirm the viewing schedule for this property:

🏠 ${viewing.propertyTitle}
📍 ${viewing.location}
📅 ${viewing.viewingDate}
⏰ ${viewing.viewingTime}

${buildPropertyUrl(viewing)}

Is this schedule still suitable for you?`,
    };
  }, [isId]);

  const loadViewings = useCallback(async () => {
    setErrorMessage("");

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      setViewings([]);
      setLoading(false);
      setRefreshing(false);
      router.replace("/login" as any);
      return;
    }

    const { data: profileData } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .maybeSingle();

    if (profileData?.full_name) {
      setAgentName(profileData.full_name);
    }

    const { data: leadsData, error: leadsError } = await supabase
      .from("leads")
      .select(
        "id, property_id, sender_name, sender_phone, sender_email, message, created_at, status, lead_type, viewing_date, viewing_time, viewing_status, receiver_user_id, receiver_role"
      )
      .eq("receiver_user_id", user.id)
      .eq("receiver_role", "agent")
      .eq("lead_type", "viewing")
      .order("created_at", { ascending: false });

    if (leadsError) {
      setViewings([]);
      setErrorMessage(leadsError.message || ui.updateFailed);
      setLoading(false);
      setRefreshing(false);
      return;
    }

    const leadRows = (leadsData || []) as LeadRow[];

    const propertyIds = Array.from(
      new Set(leadRows.map((lead) => lead.property_id).filter(Boolean))
    ) as string[];

    let propertyMap = new Map<string, PropertyRow>();

    if (propertyIds.length > 0) {
      const { data: propertiesData, error: propertiesError } = await supabase
        .from("properties")
        .select("id, kode, title, title_id, city, area, province")
        .in("id", propertyIds);

      if (propertiesError) {
        setViewings([]);
        setErrorMessage(propertiesError.message || ui.updateFailed);
        setLoading(false);
        setRefreshing(false);
        return;
      }

      propertyMap = new Map(
        ((propertiesData || []) as PropertyRow[]).map((item) => [
          item.id,
          item,
        ])
      );
    }

    const mapped = sortViewingItems(
      leadRows.map((lead) => {
        const property = lead.property_id
          ? propertyMap.get(lead.property_id)
          : null;

        return {
          id: lead.id,
          propertyId: lead.property_id || "",
          listingKode: property?.kode || "-",
          propertyTitle:
            (language === "id"
              ? property?.title_id || property?.title
              : property?.title || property?.title_id) ||
            (isId ? "Properti Tanpa Judul" : "Untitled Property"),
          buyerName: lead.sender_name || (isId ? "Tanpa Nama" : "No Name"),
          buyerPhone: lead.sender_phone || "-",
          buyerEmail: lead.sender_email || "-",
          viewingDate: formatDate(lead.viewing_date, language),
          viewingTime: formatTime(lead.viewing_time),
          viewingDateRaw: lead.viewing_date,
          viewingTimeRaw: lead.viewing_time,
          location: buildLocation(property),
          status: normalizeViewingStatus(lead.viewing_status),
          dbStatus: normalizeLeadDbStatus(lead.status),
        } satisfies Viewing;
      })
    );

    setViewings(mapped);
    setLoading(false);
    setRefreshing(false);
  }, [isId, language, router, ui.updateFailed]);

  useEffect(() => {
    void loadViewings();
  }, [loadViewings]);

  const summary = useMemo(() => {
    return {
      scheduled: viewings.filter((v) => v.status === "scheduled").length,
      rescheduled: viewings.filter((v) => v.status === "rescheduled").length,
      done: viewings.filter((v) => v.status === "done").length,
      noShow: viewings.filter((v) => v.status === "no_show").length,
    };
  }, [viewings]);

  const filteredViewings = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return viewings.filter((viewing) => {
      const statusOk =
        selectedStatus === "all" || viewing.status === selectedStatus;

      if (!statusOk) return false;
      if (!query) return true;

      const searchable = `
        ${viewing.propertyTitle}
        ${viewing.listingKode}
        ${viewing.buyerName}
        ${viewing.buyerPhone}
        ${viewing.buyerEmail}
        ${viewing.location}
        ${viewing.viewingDate}
        ${viewing.viewingTime}
        ${viewing.status}
        ${viewing.dbStatus}
      `.toLowerCase();

      return searchable.includes(query);
    });
  }, [viewings, searchQuery, selectedStatus]);

  const filterOptions: Array<{
    value: FilterStatus;
    label: string;
    count: number;
  }> = [
    { value: "all", label: ui.filterAll, count: viewings.length },
    { value: "scheduled", label: ui.statsScheduled, count: summary.scheduled },
    {
      value: "rescheduled",
      label: ui.statsRescheduled,
      count: summary.rescheduled,
    },
    { value: "done", label: ui.statsDone, count: summary.done },
    { value: "no_show", label: ui.statsNoShow, count: summary.noShow },
  ];

  async function updateViewingInDb(
    viewingId: string,
    payload: {
      status?: string;
      viewing_status?: string;
      viewing_date?: string | null;
      viewing_time?: string | null;
    }
  ) {
    setUpdatingId(viewingId);

    const { error } = await supabase
      .from("leads")
      .update(payload)
      .eq("id", viewingId);

    if (error) {
      setUpdatingId(null);
      Alert.alert(ui.updateFailed, error.message);
      return false;
    }

    setUpdatingId(null);
    return true;
  }

  async function markAsContacted(viewing: Viewing) {
    if (viewing.dbStatus !== "new") return;

    const ok = await updateViewingInDb(viewing.id, {
      status: "contacted",
    });

    if (!ok) return;

    setViewings((prev) =>
      prev.map((item) =>
        item.id === viewing.id ? { ...item, dbStatus: "contacted" } : item
      )
    );
  }

  function openReschedule(viewing: Viewing) {
    setRescheduleTarget(viewing);
    setRescheduleDate(viewing.viewingDateRaw || "");
    setRescheduleTime(viewing.viewingTimeRaw || "");
  }

  function closeReschedule() {
    setRescheduleTarget(null);
    setRescheduleDate("");
    setRescheduleTime("");
  }

  async function handleRescheduleSubmit() {
    if (!rescheduleTarget || !rescheduleDate || !rescheduleTime) return;

    const nextDbStatus =
      rescheduleTarget.dbStatus === "interested" ||
      rescheduleTarget.dbStatus === "closed"
        ? rescheduleTarget.dbStatus
        : "viewing";

    const ok = await updateViewingInDb(rescheduleTarget.id, {
      status: nextDbStatus,
      viewing_status: "rescheduled",
      viewing_date: rescheduleDate,
      viewing_time: rescheduleTime,
    });

    if (!ok) return;

    setViewings((prev) =>
      sortViewingItems(
        prev.map((item) =>
          item.id === rescheduleTarget.id
            ? {
                ...item,
                dbStatus: nextDbStatus,
                status: "rescheduled",
                viewingDateRaw: rescheduleDate,
                viewingTimeRaw: rescheduleTime,
                viewingDate: formatDate(rescheduleDate, language),
                viewingTime: formatTime(rescheduleTime),
              }
            : item
        )
      )
    );

    closeReschedule();
  }

  async function handleDone(viewing: Viewing) {
    const nextDbStatus =
      viewing.dbStatus === "interested" || viewing.dbStatus === "closed"
        ? viewing.dbStatus
        : "viewing";

    const ok = await updateViewingInDb(viewing.id, {
      status: nextDbStatus,
      viewing_status: "done",
    });

    if (!ok) return;

    setViewings((prev) =>
      prev.map((item) =>
        item.id === viewing.id
          ? {
              ...item,
              dbStatus: nextDbStatus,
              status: "done",
            }
          : item
      )
    );
  }

  async function handleNoShow(viewing: Viewing) {
    const nextDbStatus =
      viewing.dbStatus === "interested" || viewing.dbStatus === "closed"
        ? viewing.dbStatus
        : "viewing";

    const ok = await updateViewingInDb(viewing.id, {
      status: nextDbStatus,
      viewing_status: "no_show",
    });

    if (!ok) return;

    setViewings((prev) =>
      prev.map((item) =>
        item.id === viewing.id
          ? {
              ...item,
              dbStatus: nextDbStatus,
              status: "no_show",
            }
          : item
      )
    );
  }

  async function handleCall(viewing: Viewing) {
    const phone = normalizePhoneForCall(viewing.buyerPhone);

    if (!phone || phone === "-") {
      Alert.alert(ui.noPhone);
      return;
    }

    await markAsContacted(viewing);
    await Linking.openURL(`tel:${phone}`);
  }

  async function handleWhatsApp(viewing: Viewing) {
    const phone = normalizePhoneForWhatsapp(viewing.buyerPhone);

    if (!phone || phone === "-") {
      Alert.alert(ui.noPhone);
      return;
    }

    const message = encodeURIComponent(ui.message(viewing, agentName));

    await markAsContacted(viewing);
    await Linking.openURL(`https://wa.me/${phone}?text=${message}`);
  }

  async function handleRefresh() {
    setRefreshing(true);
    await loadViewings();
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
            <CalendarDays color="#111111" size={24} />
          </View>

          <Text style={styles.heroTitle}>{ui.pageTitle}</Text>
          <Text style={styles.heroSubtitle}>{ui.pageDesc}</Text>

          <Pressable
            style={styles.refreshButton}
            onPress={() => void handleRefresh()}
          >
            <RefreshCcw color="#111111" size={14} />
            <Text style={styles.refreshText}>Refresh</Text>
          </Pressable>
        </View>

        <View style={styles.statsGrid}>
          <StatBox label={ui.statsScheduled} value={summary.scheduled} />
          <StatBox label={ui.statsRescheduled} value={summary.rescheduled} />
          <StatBox label={ui.statsDone} value={summary.done} />
          <StatBox label={ui.statsNoShow} value={summary.noShow} />
        </View>

        <View style={styles.searchBox}>
          <Search color="#a9a9a9" size={17} />

          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder={ui.searchPlaceholder}
            placeholderTextColor="#777777"
            style={styles.searchInput}
            returnKeyType="search"
          />
        </View>

        <View style={styles.filterSection}>
          <Text style={styles.filterTitle}>
            {isId ? "Status Viewing" : "Viewing Status"}
          </Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterRow}
          >
            {filterOptions.map((item) => (
              <Pressable
                key={item.value}
                style={[
                  styles.filterPill,
                  selectedStatus === item.value && styles.filterPillActive,
                ]}
                onPress={() => setSelectedStatus(item.value)}
              >
                <Text
                  style={[
                    styles.filterPillText,
                    selectedStatus === item.value &&
                      styles.filterPillTextActive,
                  ]}
                >
                  {item.label} ({item.count})
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {errorMessage ? (
          <View style={styles.errorBox}>
            <XCircle color="#fecaca" size={18} />
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        ) : null}

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator color="#e6c15c" />
            <Text style={styles.loadingText}>{ui.loading}</Text>
          </View>
        ) : null}

        {!loading && filteredViewings.length === 0 ? (
          <View style={styles.emptyBox}>
            <CalendarDays color="#a9a9a9" size={28} />
            <Text style={styles.emptyText}>{ui.empty}</Text>
          </View>
        ) : null}

        <View style={styles.viewingList}>
          {filteredViewings.map((viewing) => {
            const viewingBadge = getViewingStatusUI(viewing.status, language);
            const leadBadge = getLeadStatusUI(viewing.dbStatus, language);
            const isUpdating = updatingId === viewing.id;
            const isClosed =
              viewing.status === "done" || viewing.status === "no_show";

            return (
              <View key={viewing.id} style={styles.viewingCard}>
                <View style={styles.badgeRow}>
                  <Badge ui={viewingBadge} />
                  <Badge ui={leadBadge} />
                </View>

                <View style={styles.scheduleBox}>
                  <CalendarDays color="#e6c15c" size={18} />
                  <Text style={styles.scheduleText}>
                    {viewing.viewingDate} • {viewing.viewingTime}
                  </Text>
                </View>

                <Text style={styles.propertyTitle}>{viewing.propertyTitle}</Text>
                <Text style={styles.propertyCode}>
                  {ui.code}: {viewing.listingKode}
                </Text>

                <View style={styles.infoGrid}>
                  <View style={styles.infoBox}>
                    <Text style={styles.infoLabel}>{ui.buyer}</Text>
                    <Text style={styles.infoValue}>{viewing.buyerName}</Text>
                    <Text style={styles.infoSub}>{viewing.buyerPhone}</Text>
                    {viewing.buyerEmail !== "-" ? (
                      <Text style={styles.infoSub}>{viewing.buyerEmail}</Text>
                    ) : null}
                  </View>

                  <View style={styles.infoBox}>
                    <Text style={styles.infoLabel}>{ui.location}</Text>
                    <Text style={styles.infoValue}>{viewing.location}</Text>
                  </View>
                </View>

                <View style={styles.contactRow}>
                  <Pressable
                    style={styles.callButton}
                    disabled={isUpdating}
                    onPress={() => void handleCall(viewing)}
                  >
                    <Phone color="#ffffff" size={15} />
                    <Text style={styles.callButtonText}>{ui.call}</Text>
                  </Pressable>

                  <Pressable
                    style={styles.whatsappButton}
                    disabled={isUpdating}
                    onPress={() => void handleWhatsApp(viewing)}
                  >
                    <MessageCircle color="#ffffff" size={15} />
                    <Text style={styles.whatsappButtonText}>
                      {ui.whatsapp}
                    </Text>
                  </Pressable>
                </View>

                {!isClosed ? (
                  <View style={styles.actionRow}>
                    <Pressable
                      style={styles.smallActionButton}
                      disabled={isUpdating}
                      onPress={() => openReschedule(viewing)}
                    >
                      <RotateCcw color="#38bdf8" size={14} />
                      <Text style={styles.smallActionText}>
                        {ui.reschedule}
                      </Text>
                    </Pressable>

                    <Pressable
                      style={styles.smallActionButton}
                      disabled={isUpdating}
                      onPress={() => void handleDone(viewing)}
                    >
                      <CheckCircle2 color="#22c55e" size={14} />
                      <Text style={styles.smallActionText}>{ui.done}</Text>
                    </Pressable>

                    <Pressable
                      style={styles.smallActionButton}
                      disabled={isUpdating}
                      onPress={() => void handleNoShow(viewing)}
                    >
                      <XCircle color="#f87171" size={14} />
                      <Text style={styles.smallActionText}>{ui.noShow}</Text>
                    </Pressable>
                  </View>
                ) : null}
              </View>
            );
          })}
        </View>
      </ScrollView>

      <Modal
        visible={Boolean(rescheduleTarget)}
        transparent
        animationType="fade"
        onRequestClose={closeReschedule}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{ui.modalTitle}</Text>

            {rescheduleTarget ? (
              <View style={styles.modalSummary}>
                <Text style={styles.modalSummaryTitle}>
                  {rescheduleTarget.propertyTitle}
                </Text>
                <Text style={styles.modalSummaryText}>
                  {rescheduleTarget.viewingDate} •{" "}
                  {rescheduleTarget.viewingTime}
                </Text>
              </View>
            ) : null}

            <Text style={styles.modalLabel}>{ui.newDate}</Text>
            <TextInput
              value={rescheduleDate}
              onChangeText={setRescheduleDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#777777"
              style={styles.modalInput}
              autoCapitalize="none"
            />

            <Text style={styles.modalLabel}>{ui.newTime}</Text>
            <TextInput
              value={rescheduleTime}
              onChangeText={setRescheduleTime}
              placeholder="HH:MM"
              placeholderTextColor="#777777"
              style={styles.modalInput}
              autoCapitalize="none"
            />

            <View style={styles.modalActions}>
              <Pressable style={styles.cancelButton} onPress={closeReschedule}>
                <Text style={styles.cancelButtonText}>{ui.close}</Text>
              </Pressable>

              <Pressable
                style={[
                  styles.saveButton,
                  (!rescheduleDate || !rescheduleTime) &&
                    styles.saveButtonDisabled,
                ]}
                disabled={!rescheduleDate || !rescheduleTime}
                onPress={() => void handleRescheduleSubmit()}
              >
                <Text style={styles.saveButtonText}>{ui.saveNewSchedule}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function StatBox({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.statBox}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
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
  refreshButton: {
    alignSelf: "flex-start",
    marginTop: 13,
    borderRadius: 999,
    backgroundColor: "#e6c15c",
    paddingHorizontal: 12,
    paddingVertical: 9,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  refreshText: {
    color: "#111111",
    fontSize: 11.5,
    fontWeight: "900",
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 9,
    marginBottom: 12,
  },
  statBox: {
    width: "48.5%",
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
  errorBox: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#7f1d1d",
    backgroundColor: "#2a0d0d",
    padding: 13,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 9,
    marginBottom: 12,
  },
  errorText: {
    color: "#fecaca",
    fontSize: 11.8,
    lineHeight: 17,
    fontWeight: "700",
    flex: 1,
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
  viewingList: {
    gap: 13,
  },
  viewingCard: {
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
  scheduleBox: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#5b4a24",
    backgroundColor: "#211a0b",
    padding: 12,
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  scheduleText: {
    color: "#ffffff",
    fontSize: 12.5,
    fontWeight: "900",
    flex: 1,
  },
  propertyTitle: {
    color: "#ffffff",
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "900",
    marginTop: 12,
  },
  propertyCode: {
    color: "#c9b56b",
    fontSize: 11,
    fontWeight: "800",
    marginTop: 4,
  },
  infoGrid: {
    gap: 9,
    marginTop: 12,
  },
  infoBox: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#252525",
    backgroundColor: "#050505",
    padding: 11,
  },
  infoLabel: {
    color: "#777777",
    fontSize: 10,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  infoValue: {
    color: "#ffffff",
    fontSize: 12.5,
    lineHeight: 17,
    fontWeight: "900",
    marginTop: 5,
  },
  infoSub: {
    color: "#a9a9a9",
    fontSize: 11,
    lineHeight: 16,
    fontWeight: "700",
    marginTop: 3,
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
  actionRow: {
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
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.72)",
    padding: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  modalCard: {
    width: "100%",
    borderRadius: 26,
    borderWidth: 1,
    borderColor: "#303030",
    backgroundColor: "#101010",
    padding: 16,
  },
  modalTitle: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "900",
  },
  modalSummary: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#252525",
    backgroundColor: "#050505",
    padding: 12,
    marginTop: 13,
  },
  modalSummaryTitle: {
    color: "#ffffff",
    fontSize: 12.5,
    lineHeight: 17,
    fontWeight: "900",
  },
  modalSummaryText: {
    color: "#a9a9a9",
    fontSize: 11,
    fontWeight: "800",
    marginTop: 4,
  },
  modalLabel: {
    color: "#ffffff",
    fontSize: 11.5,
    fontWeight: "900",
    marginTop: 13,
  },
  modalInput: {
    minHeight: 48,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#303030",
    backgroundColor: "#050505",
    color: "#ffffff",
    paddingHorizontal: 12,
    fontSize: 12.5,
    fontWeight: "800",
    marginTop: 7,
  },
  modalActions: {
    flexDirection: "row",
    gap: 9,
    marginTop: 15,
  },
  cancelButton: {
    flex: 1,
    minHeight: 45,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#343434",
    backgroundColor: "#050505",
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButtonText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "900",
  },
  saveButton: {
    flex: 1,
    minHeight: 45,
    borderRadius: 15,
    backgroundColor: "#e6c15c",
    alignItems: "center",
    justifyContent: "center",
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    color: "#111111",
    fontSize: 12,
    fontWeight: "900",
  },
});