import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
    AlertCircle,
    ArrowLeft,
    CheckCircle2,
    Clock3,
    FileText,
    Pencil,
    Plus,
    Save,
    Search,
    Trash2,
    TrendingUp,
    Wallet,
    X,
} from "lucide-react-native";
import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Modal,
    Pressable,
    RefreshControl,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    type TextInputProps,
    View,
} from "react-native";
import { supabase } from "../../lib/supabase";

type Language = "en" | "id";

type CommissionStatus =
  | "pending"
  | "waiting_confirmation"
  | "approved"
  | "paid"
  | "cancelled"
  | "disputed";

type CommissionDealType = "sale" | "rent" | "renewal" | "other";

type StatusFilter = "all" | CommissionStatus;
type DealTypeFilter = "all" | CommissionDealType;

type CommissionRow = {
  id: string;
  agent_user_id: string;
  property_id: string | null;
  listing_code: string | null;
  property_title: string;
  client_name: string;
  client_phone: string | null;
  client_email: string | null;
  deal_type: CommissionDealType;
  deal_value: number | null;
  commission_rate: number | null;
  commission_amount: number | null;
  status: CommissionStatus;
  deal_date: string | null;
  paid_date: string | null;
  payment_method: string | null;
  payment_reference: string | null;
  notes: string | null;
  created_at: string | null;
  updated_at: string | null;
};

type FormState = {
  listingCode: string;
  propertyTitle: string;
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  dealType: CommissionDealType;
  dealValue: string;
  commissionRate: string;
  status: CommissionStatus;
  dealDate: string;
  paidDate: string;
  paymentMethod: string;
  paymentReference: string;
  notes: string;
};

const EMPTY_FORM: FormState = {
  listingCode: "",
  propertyTitle: "",
  clientName: "",
  clientPhone: "",
  clientEmail: "",
  dealType: "sale",
  dealValue: "",
  commissionRate: "",
  status: "pending",
  dealDate: "",
  paidDate: "",
  paymentMethod: "",
  paymentReference: "",
  notes: "",
};

function toNumber(value: number | string | null | undefined) {
  if (typeof value === "number" && Number.isFinite(value)) return value;

  if (typeof value === "string") {
    const cleaned = value.replace(/[^\d.]/g, "");
    const parsed = Number(cleaned);

    if (Number.isFinite(parsed)) return parsed;
  }

  return 0;
}

function calculateCommissionAmount(
  dealValue: number | string | null | undefined,
  commissionRate: number | string | null | undefined
) {
  const value = toNumber(dealValue);
  const rate = toNumber(commissionRate);

  if (value <= 0 || rate <= 0) return 0;

  return Math.round((value * rate) / 100);
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

  const date = parseLocalDate(value) || new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat(language === "id" ? "id-ID" : "en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function statusUI(status: CommissionStatus, language: Language) {
  const isId = language === "id";

  if (status === "paid") {
    return {
      label: isId ? "Dibayar" : "Paid",
      color: "#22c55e",
      bg: "#052e16",
      border: "#166534",
      icon: <CheckCircle2 color="#22c55e" size={13} />,
    };
  }

  if (status === "approved") {
    return {
      label: isId ? "Disetujui" : "Approved",
      color: "#38bdf8",
      bg: "#082f49",
      border: "#0369a1",
      icon: <CheckCircle2 color="#38bdf8" size={13} />,
    };
  }

  if (status === "waiting_confirmation") {
    return {
      label: isId ? "Menunggu Konfirmasi" : "Waiting Confirmation",
      color: "#e6c15c",
      bg: "#211a0b",
      border: "#705d2c",
      icon: <Clock3 color="#e6c15c" size={13} />,
    };
  }

  if (status === "cancelled") {
    return {
      label: isId ? "Dibatalkan" : "Cancelled",
      color: "#f87171",
      bg: "#2a0d0d",
      border: "#7f1d1d",
      icon: <X color="#f87171" size={13} />,
    };
  }

  if (status === "disputed") {
    return {
      label: isId ? "Sengketa" : "Disputed",
      color: "#fb923c",
      bg: "#2b1708",
      border: "#9a3412",
      icon: <AlertCircle color="#fb923c" size={13} />,
    };
  }

  return {
    label: "Pending",
    color: "#d6d6d6",
    bg: "#171717",
    border: "#333333",
    icon: <Clock3 color="#d6d6d6" size={13} />,
  };
}

function dealTypeLabel(type: CommissionDealType, language: Language) {
  const isId = language === "id";

  if (type === "sale") return isId ? "Jual" : "Sale";
  if (type === "rent") return isId ? "Sewa" : "Rent";
  if (type === "renewal") return isId ? "Perpanjangan" : "Renewal";

  return isId ? "Lainnya" : "Other";
}

function normalizeCommissionRow(row: CommissionRow): CommissionRow {
  const dealValue = Number(row.deal_value || 0);
  const commissionRate = Number(row.commission_rate || 0);
  const calculatedCommission = calculateCommissionAmount(
    dealValue,
    commissionRate
  );

  return {
    ...row,
    deal_value: dealValue,
    commission_rate: commissionRate,
    commission_amount:
      Number(row.commission_amount || 0) > 0
        ? Number(row.commission_amount || 0)
        : calculatedCommission,
  };
}

export default function DashboardCommissionScreen() {
  const router = useRouter();

  const [language, setLanguage] = useState<Language>("en");
  const [agentUserId, setAgentUserId] = useState<string | null>(null);
  const [records, setRecords] = useState<CommissionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [dealTypeFilter, setDealTypeFilter] = useState<DealTypeFilter>("all");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  const isId = language === "id";

  const ui = useMemo(() => {
    if (isId) {
      return {
        back: "Kembali",
        pageTitle: "Komisi",
        pageDesc:
          "Catatan komisi manual untuk deal properti yang berhasil atau sedang berjalan.",
        addCommission: "Tambah Komisi",
        manualTitle: "Catatan Komisi Manual",
        manualDesc:
          "Halaman ini hanya untuk mencatat komisi agent secara manual. Pembayaran komisi saat ini masih dilakukan di luar sistem TETAMO.",
        totalCommission: "Total Komisi",
        paidCommission: "Sudah Dibayar",
        pendingCommission: "Belum Dibayar",
        totalRecords: "Total Record",
        historyTitle: "Riwayat Komisi",
        historyDesc: "Semua record komisi yang Anda input manual.",
        searchPlaceholder:
          "Cari properti, kode listing, client, metode pembayaran, atau catatan...",
        statusFilter: "Filter Status",
        dealTypeFilter: "Filter Deal",
        all: "Semua",
        loading: "Memuat komisi...",
        empty:
          "Belum ada record komisi. Klik Tambah Komisi untuk mulai mencatat.",
        summary: "Ringkasan",
        biggestCommission: "Komisi Terbesar",
        paidRecords: "Record Dibayar",
        pendingRecords: "Record Pending",
        howToUse: "Cara Pakai",
        importantNote: "Catatan Penting",
        howTo1: "Klik Tambah Komisi.",
        howTo2: "Isi detail properti, client, nilai deal, dan rate komisi.",
        howTo3:
          "Sistem akan menghitung estimasi komisi dari deal value × rate.",
        howTo4: "Update status saat komisi disetujui atau dibayar.",
        note1: "Halaman ini belum terhubung ke payout otomatis TETAMO.",
        note2: "Semua komisi di sini adalah record manual agent.",
        note3: "Pembayaran komisi masih dilakukan di luar platform.",
        propertyTitle: "Judul Properti",
        listingCode: "Kode Listing",
        client: "Client",
        clientName: "Nama Client",
        clientPhone: "Telepon Client",
        clientEmail: "Email Client",
        dealType: "Tipe Deal",
        dealValue: "Nilai Deal",
        rate: "Rate Komisi",
        commission: "Komisi",
        dealDate: "Tanggal Deal",
        paidDate: "Tanggal Dibayar",
        paymentMethod: "Metode Pembayaran",
        paymentReference: "Referensi Pembayaran",
        notes: "Catatan",
        edit: "Edit",
        delete: "Hapus",
        modalAdd: "Tambah Komisi",
        modalEdit: "Edit Komisi",
        cancel: "Batal",
        save: "Simpan Komisi",
        update: "Update Komisi",
        saving: "Menyimpan...",
        preview: "Estimasi Komisi",
        requiredProperty: "Property title wajib diisi.",
        requiredClient: "Client name wajib diisi.",
        invalidDealValue: "Deal value harus lebih besar dari 0.",
        invalidRate: "Commission rate tidak valid.",
        userNotFound: "User agent tidak ditemukan.",
        loadError: "Gagal memuat komisi.",
        updateError: "Gagal update komisi.",
        insertError: "Gagal tambah komisi.",
        deleteConfirm: "Hapus record komisi ini?",
        deleteError: "Gagal hapus komisi.",
        loginError: "Silakan login sebagai agent terlebih dahulu.",
        sale: "Jual",
        rent: "Sewa",
        renewal: "Perpanjangan",
        other: "Lainnya",
        datePlaceholder: "YYYY-MM-DD",
      };
    }

    return {
      back: "Back",
      pageTitle: "Commission",
      pageDesc:
        "Manual commission records for successful or ongoing property deals.",
      addCommission: "Add Commission",
      manualTitle: "Manual Commission Record",
      manualDesc:
        "This page is only for manually tracking agent commissions. Commission payment is currently handled outside the TETAMO system.",
      totalCommission: "Total Commission",
      paidCommission: "Paid",
      pendingCommission: "Unpaid / Pending",
      totalRecords: "Total Records",
      historyTitle: "Commission History",
      historyDesc: "All commission records you manually entered.",
      searchPlaceholder:
        "Search property, listing code, client, payment method, or notes...",
      statusFilter: "Status Filter",
      dealTypeFilter: "Deal Filter",
      all: "All",
      loading: "Loading commissions...",
      empty:
        "No commission records yet. Click Add Commission to start tracking.",
      summary: "Summary",
      biggestCommission: "Biggest Commission",
      paidRecords: "Paid Records",
      pendingRecords: "Pending Records",
      howToUse: "How to Use",
      importantNote: "Important Note",
      howTo1: "Click Add Commission.",
      howTo2: "Fill property, client, deal value, and commission rate.",
      howTo3:
        "The system calculates estimated commission from deal value × rate.",
      howTo4: "Update the status when commission is approved or paid.",
      note1: "This page is not connected to automatic TETAMO payout yet.",
      note2: "All commissions here are manual agent records.",
      note3: "Commission payment is still handled outside the platform.",
      propertyTitle: "Property Title",
      listingCode: "Listing Code",
      client: "Client",
      clientName: "Client Name",
      clientPhone: "Client Phone",
      clientEmail: "Client Email",
      dealType: "Deal Type",
      dealValue: "Deal Value",
      rate: "Commission Rate",
      commission: "Commission",
      dealDate: "Deal Date",
      paidDate: "Paid Date",
      paymentMethod: "Payment Method",
      paymentReference: "Payment Reference",
      notes: "Notes",
      edit: "Edit",
      delete: "Delete",
      modalAdd: "Add Commission",
      modalEdit: "Edit Commission",
      cancel: "Cancel",
      save: "Save Commission",
      update: "Update Commission",
      saving: "Saving...",
      preview: "Estimated Commission",
      requiredProperty: "Property title is required.",
      requiredClient: "Client name is required.",
      invalidDealValue: "Deal value must be greater than 0.",
      invalidRate: "Commission rate is invalid.",
      userNotFound: "Agent user was not found.",
      loadError: "Failed to load commission.",
      updateError: "Failed to update commission.",
      insertError: "Failed to add commission.",
      deleteConfirm: "Delete this commission record?",
      deleteError: "Failed to delete commission.",
      loginError: "Please log in as an agent first.",
      sale: "Sale",
      rent: "Rent",
      renewal: "Renewal",
      other: "Other",
      datePlaceholder: "YYYY-MM-DD",
    };
  }, [isId]);

  const loadCommissions = useCallback(async () => {
    setErrorMessage("");

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      setAgentUserId(null);
      setRecords([]);
      setLoading(false);
      setRefreshing(false);
      router.replace("/login" as any);
      return;
    }

    setAgentUserId(user.id);

    const { data, error } = await supabase
      .from("agent_commissions")
      .select(
        `
          id,
          agent_user_id,
          property_id,
          listing_code,
          property_title,
          client_name,
          client_phone,
          client_email,
          deal_type,
          deal_value,
          commission_rate,
          commission_amount,
          status,
          deal_date,
          paid_date,
          payment_method,
          payment_reference,
          notes,
          created_at,
          updated_at
        `
      )
      .eq("agent_user_id", user.id)
      .order("deal_date", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) {
      setRecords([]);
      setLoading(false);
      setRefreshing(false);
      setErrorMessage(error.message || ui.loadError);
      return;
    }

    const mapped = ((data || []) as CommissionRow[]).map(normalizeCommissionRow);

    setRecords(mapped);
    setLoading(false);
    setRefreshing(false);
  }, [router, ui.loadError]);

  useEffect(() => {
    void loadCommissions();
  }, [loadCommissions]);

  const filteredRecords = useMemo(() => {
    const q = search.trim().toLowerCase();

    return records.filter((item) => {
      const statusOk =
        statusFilter === "all" || item.status === statusFilter;

      const dealTypeOk =
        dealTypeFilter === "all" || item.deal_type === dealTypeFilter;

      const searchable = `
        ${item.property_title}
        ${item.listing_code || ""}
        ${item.client_name}
        ${item.client_phone || ""}
        ${item.client_email || ""}
        ${item.deal_type}
        ${item.status}
        ${item.payment_method || ""}
        ${item.payment_reference || ""}
        ${item.notes || ""}
      `.toLowerCase();

      const searchOk = !q || searchable.includes(q);

      return statusOk && dealTypeOk && searchOk;
    });
  }, [records, search, statusFilter, dealTypeFilter]);

  const summary = useMemo(() => {
    const totalCommission = records.reduce(
      (sum, item) => sum + Number(item.commission_amount || 0),
      0
    );

    const paidCommission = records
      .filter((item) => item.status === "paid")
      .reduce((sum, item) => sum + Number(item.commission_amount || 0), 0);

    const pendingCommission = records
      .filter((item) =>
        ["pending", "waiting_confirmation", "approved"].includes(item.status)
      )
      .reduce((sum, item) => sum + Number(item.commission_amount || 0), 0);

    const biggestCommission = Math.max(
      0,
      ...records.map((item) => Number(item.commission_amount || 0))
    );

    return {
      totalRecords: records.length,
      totalCommission,
      paidCommission,
      pendingCommission,
      biggestCommission,
      paidRecords: records.filter((item) => item.status === "paid").length,
      pendingRecords: records.filter((item) =>
        ["pending", "waiting_confirmation", "approved"].includes(item.status)
      ).length,
    };
  }, [records]);

  const formCommissionPreview = useMemo(() => {
    return calculateCommissionAmount(form.dealValue, form.commissionRate);
  }, [form.dealValue, form.commissionRate]);

  const statusOptions: Array<{ key: StatusFilter; label: string }> = [
    { key: "all", label: ui.all },
    { key: "pending", label: statusUI("pending", language).label },
    {
      key: "waiting_confirmation",
      label: statusUI("waiting_confirmation", language).label,
    },
    { key: "approved", label: statusUI("approved", language).label },
    { key: "paid", label: statusUI("paid", language).label },
    { key: "cancelled", label: statusUI("cancelled", language).label },
    { key: "disputed", label: statusUI("disputed", language).label },
  ];

  const dealTypeOptions: Array<{ key: DealTypeFilter; label: string }> = [
    { key: "all", label: ui.all },
    { key: "sale", label: dealTypeLabel("sale", language) },
    { key: "rent", label: dealTypeLabel("rent", language) },
    { key: "renewal", label: dealTypeLabel("renewal", language) },
    { key: "other", label: dealTypeLabel("other", language) },
  ];

  function updateForm<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  }

  function openAddModal() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  }

  function openEditModal(item: CommissionRow) {
    setEditingId(item.id);
    setForm({
      listingCode: item.listing_code || "",
      propertyTitle: item.property_title || "",
      clientName: item.client_name || "",
      clientPhone: item.client_phone || "",
      clientEmail: item.client_email || "",
      dealType: item.deal_type,
      dealValue: String(Number(item.deal_value || 0)),
      commissionRate: String(Number(item.commission_rate || 0)),
      status: item.status,
      dealDate: item.deal_date || "",
      paidDate: item.paid_date || "",
      paymentMethod: item.payment_method || "",
      paymentReference: item.payment_reference || "",
      notes: item.notes || "",
    });
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
  }

  async function handleRefresh() {
    setRefreshing(true);
    await loadCommissions();
  }

  async function handleSave() {
    if (!agentUserId) {
      Alert.alert(ui.userNotFound);
      return;
    }

    if (!form.propertyTitle.trim()) {
      Alert.alert(ui.requiredProperty);
      return;
    }

    if (!form.clientName.trim()) {
      Alert.alert(ui.requiredClient);
      return;
    }

    if (!form.dealValue.trim() || toNumber(form.dealValue) <= 0) {
      Alert.alert(ui.invalidDealValue);
      return;
    }

    if (!form.commissionRate.trim() || toNumber(form.commissionRate) < 0) {
      Alert.alert(ui.invalidRate);
      return;
    }

    setSaving(true);

    const commissionAmount = calculateCommissionAmount(
      form.dealValue,
      form.commissionRate
    );

    const payload = {
      agent_user_id: agentUserId,
      property_id: null,
      listing_code: form.listingCode.trim() || null,
      property_title: form.propertyTitle.trim(),
      client_name: form.clientName.trim(),
      client_phone: form.clientPhone.trim() || null,
      client_email: form.clientEmail.trim() || null,
      deal_type: form.dealType,
      deal_value: toNumber(form.dealValue),
      commission_rate: toNumber(form.commissionRate),
      commission_amount: commissionAmount,
      status: form.status,
      deal_date: form.dealDate.trim() || null,
      paid_date: form.paidDate.trim() || null,
      payment_method: form.paymentMethod.trim() || null,
      payment_reference: form.paymentReference.trim() || null,
      notes: form.notes.trim() || null,
    };

    if (editingId) {
      const { error } = await supabase
        .from("agent_commissions")
        .update(payload)
        .eq("id", editingId)
        .eq("agent_user_id", agentUserId);

      if (error) {
        setSaving(false);
        Alert.alert(ui.updateError, error.message);
        return;
      }
    } else {
      const { error } = await supabase.from("agent_commissions").insert(payload);

      if (error) {
        setSaving(false);
        Alert.alert(ui.insertError, error.message);
        return;
      }
    }

    setSaving(false);
    closeModal();
    await loadCommissions();
  }

  async function handleDelete(id: string) {
    if (!agentUserId) return;

    setDeletingId(id);

    const { error } = await supabase
      .from("agent_commissions")
      .delete()
      .eq("id", id)
      .eq("agent_user_id", agentUserId);

    if (error) {
      setDeletingId(null);
      Alert.alert(ui.deleteError, error.message);
      return;
    }

    setRecords((prev) => prev.filter((item) => item.id !== id));
    setDeletingId(null);
  }

  function confirmDelete(id: string) {
    Alert.alert(ui.deleteConfirm, "", [
      {
        text: ui.cancel,
        style: "cancel",
      },
      {
        text: ui.delete,
        style: "destructive",
        onPress: () => void handleDelete(id),
      },
    ]);
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
        keyboardShouldPersistTaps="handled"
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
            <Wallet color="#111111" size={24} />
          </View>

          <Text style={styles.heroTitle}>{ui.pageTitle}</Text>
          <Text style={styles.heroSubtitle}>{ui.pageDesc}</Text>

          <Pressable style={styles.addButton} onPress={openAddModal}>
            <Plus color="#111111" size={15} />
            <Text style={styles.addButtonText}>{ui.addCommission}</Text>
          </Pressable>
        </View>

        <View style={styles.warningCard}>
          <AlertCircle color="#e6c15c" size={18} />
          <View style={styles.warningTextBox}>
            <Text style={styles.warningTitle}>{ui.manualTitle}</Text>
            <Text style={styles.warningText}>{ui.manualDesc}</Text>
          </View>
        </View>

        {errorMessage ? (
          <View style={styles.errorBox}>
            <AlertCircle color="#fecaca" size={18} />
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        ) : null}

        <View style={styles.statsGrid}>
          <StatBox
            label={ui.totalCommission}
            value={formatCurrency(summary.totalCommission)}
            icon={<TrendingUp color="#e6c15c" size={18} />}
          />
          <StatBox
            label={ui.paidCommission}
            value={formatCurrency(summary.paidCommission)}
            icon={<CheckCircle2 color="#22c55e" size={18} />}
          />
          <StatBox
            label={ui.pendingCommission}
            value={formatCurrency(summary.pendingCommission)}
            icon={<Clock3 color="#f59e0b" size={18} />}
          />
          <StatBox
            label={ui.totalRecords}
            value={String(summary.totalRecords)}
            icon={<Wallet color="#ffffff" size={18} />}
          />
        </View>

        <View style={styles.searchCard}>
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

          <FilterSection title={ui.statusFilter}>
            {statusOptions.map((item) => (
              <FilterPill
                key={item.key}
                label={item.label}
                active={statusFilter === item.key}
                onPress={() => setStatusFilter(item.key)}
              />
            ))}
          </FilterSection>

          <FilterSection title={ui.dealTypeFilter}>
            {dealTypeOptions.map((item) => (
              <FilterPill
                key={item.key}
                label={item.label}
                active={dealTypeFilter === item.key}
                onPress={() => setDealTypeFilter(item.key)}
              />
            ))}
          </FilterSection>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{ui.historyTitle}</Text>
          <Text style={styles.sectionDesc}>{ui.historyDesc}</Text>
        </View>

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator color="#e6c15c" />
            <Text style={styles.loadingText}>{ui.loading}</Text>
          </View>
        ) : null}

        {!loading && filteredRecords.length === 0 ? (
          <View style={styles.emptyBox}>
            <Wallet color="#a9a9a9" size={28} />
            <Text style={styles.emptyText}>{ui.empty}</Text>
          </View>
        ) : null}

        <View style={styles.recordList}>
          {filteredRecords.map((item) => {
            const status = statusUI(item.status, language);
            const isDeleting = deletingId === item.id;

            return (
              <View key={item.id} style={styles.recordCard}>
                <View style={styles.recordTop}>
                  <View style={styles.recordTitleBox}>
                    <Text style={styles.recordTitle} numberOfLines={2}>
                      {item.property_title}
                    </Text>
                    <Text style={styles.recordCode}>
                      {ui.listingCode}: {item.listing_code || "-"}
                    </Text>
                  </View>

                  <Badge ui={status} />
                </View>

                <View style={styles.commissionBox}>
                  <Text style={styles.commissionLabel}>{ui.commission}</Text>
                  <Text style={styles.commissionValue}>
                    {formatCurrency(item.commission_amount)}
                  </Text>
                </View>

                <View style={styles.detailGrid}>
                  <DetailBox label={ui.client} value={item.client_name} />
                  <DetailBox
                    label={ui.dealType}
                    value={dealTypeLabel(item.deal_type, language)}
                  />
                  <DetailBox
                    label={ui.dealValue}
                    value={formatCurrency(item.deal_value)}
                  />
                  <DetailBox
                    label={ui.rate}
                    value={`${Number(item.commission_rate || 0)}%`}
                  />
                  <DetailBox
                    label={ui.dealDate}
                    value={formatDate(item.deal_date, language)}
                  />
                  <DetailBox
                    label={ui.paidDate}
                    value={formatDate(item.paid_date, language)}
                  />
                </View>

                {item.client_phone || item.client_email ? (
                  <View style={styles.clientBox}>
                    {item.client_phone ? (
                      <Text style={styles.clientText}>{item.client_phone}</Text>
                    ) : null}
                    {item.client_email ? (
                      <Text style={styles.clientText}>{item.client_email}</Text>
                    ) : null}
                  </View>
                ) : null}

                {item.payment_method || item.payment_reference ? (
                  <View style={styles.clientBox}>
                    <Text style={styles.clientText}>
                      {ui.paymentMethod}: {item.payment_method || "-"}
                    </Text>
                    <Text style={styles.clientText}>
                      {ui.paymentReference}: {item.payment_reference || "-"}
                    </Text>
                  </View>
                ) : null}

                {item.notes ? (
                  <View style={styles.notesBox}>
                    <Text style={styles.notesLabel}>{ui.notes}</Text>
                    <Text style={styles.notesText}>{item.notes}</Text>
                  </View>
                ) : null}

                <View style={styles.actionRow}>
                  <Pressable
                    style={styles.editButton}
                    onPress={() => openEditModal(item)}
                  >
                    <Pencil color="#111111" size={14} />
                    <Text style={styles.editButtonText}>{ui.edit}</Text>
                  </Pressable>

                  <Pressable
                    style={styles.deleteButton}
                    disabled={isDeleting}
                    onPress={() => confirmDelete(item.id)}
                  >
                    <Trash2 color="#fecaca" size={14} />
                    <Text style={styles.deleteButtonText}>
                      {isDeleting ? "..." : ui.delete}
                    </Text>
                  </Pressable>
                </View>
              </View>
            );
          })}
        </View>

        <View style={styles.sideCards}>
          <InfoCard
            icon={<TrendingUp color="#e6c15c" size={19} />}
            title={ui.summary}
            lines={[
              `${ui.biggestCommission}: ${formatCurrency(
                summary.biggestCommission
              )}`,
              `${ui.paidRecords}: ${summary.paidRecords}`,
              `${ui.pendingRecords}: ${summary.pendingRecords}`,
            ]}
          />

          <InfoCard
            icon={<FileText color="#e6c15c" size={19} />}
            title={ui.howToUse}
            lines={[ui.howTo1, ui.howTo2, ui.howTo3, ui.howTo4]}
          />

          <InfoCard
            icon={<AlertCircle color="#e6c15c" size={19} />}
            title={ui.importantNote}
            lines={[ui.note1, ui.note2, ui.note3]}
          />
        </View>
      </ScrollView>

      <Modal
        visible={modalOpen}
        transparent
        animationType="fade"
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingId ? ui.modalEdit : ui.modalAdd}
              </Text>

              <Pressable style={styles.modalCloseButton} onPress={closeModal}>
                <X color="#ffffff" size={18} />
              </Pressable>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.modalScrollContent}
            >
              <View style={styles.previewBox}>
                <Text style={styles.previewLabel}>{ui.preview}</Text>
                <Text style={styles.previewValue}>
                  {formatCurrency(formCommissionPreview)}
                </Text>
                <Text style={styles.previewFormula}>
                  {formatCurrency(toNumber(form.dealValue))} ×{" "}
                  {toNumber(form.commissionRate)}%
                </Text>
              </View>

              <FormInput
                label={ui.listingCode}
                value={form.listingCode}
                onChangeText={(value) => updateForm("listingCode", value)}
                placeholder="TTMO..."
              />

              <FormInput
                label={`${ui.propertyTitle} *`}
                value={form.propertyTitle}
                onChangeText={(value) => updateForm("propertyTitle", value)}
                placeholder={ui.propertyTitle}
              />

              <FormInput
                label={`${ui.clientName} *`}
                value={form.clientName}
                onChangeText={(value) => updateForm("clientName", value)}
                placeholder={ui.clientName}
              />

              <FormInput
                label={ui.clientPhone}
                value={form.clientPhone}
                onChangeText={(value) => updateForm("clientPhone", value)}
                placeholder="+62..."
                keyboardType="phone-pad"
              />

              <FormInput
                label={ui.clientEmail}
                value={form.clientEmail}
                onChangeText={(value) => updateForm("clientEmail", value)}
                placeholder="client@email.com"
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <SelectSection title={ui.dealType}>
                {(["sale", "rent", "renewal", "other"] as CommissionDealType[]).map(
                  (item) => (
                    <FilterPill
                      key={item}
                      label={dealTypeLabel(item, language)}
                      active={form.dealType === item}
                      onPress={() => updateForm("dealType", item)}
                    />
                  )
                )}
              </SelectSection>

              <FormInput
                label={`${ui.dealValue} *`}
                value={form.dealValue}
                onChangeText={(value) => updateForm("dealValue", value)}
                placeholder="0"
                keyboardType="numeric"
              />

              <FormInput
                label={`${ui.rate} (%) *`}
                value={form.commissionRate}
                onChangeText={(value) => updateForm("commissionRate", value)}
                placeholder="2.5"
                keyboardType="numeric"
              />

              <SelectSection title="Status">
                {(
                  [
                    "pending",
                    "waiting_confirmation",
                    "approved",
                    "paid",
                    "cancelled",
                    "disputed",
                  ] as CommissionStatus[]
                ).map((item) => (
                  <FilterPill
                    key={item}
                    label={statusUI(item, language).label}
                    active={form.status === item}
                    onPress={() => updateForm("status", item)}
                  />
                ))}
              </SelectSection>

              <FormInput
                label={ui.dealDate}
                value={form.dealDate}
                onChangeText={(value) => updateForm("dealDate", value)}
                placeholder={ui.datePlaceholder}
                autoCapitalize="none"
              />

              <FormInput
                label={ui.paidDate}
                value={form.paidDate}
                onChangeText={(value) => updateForm("paidDate", value)}
                placeholder={ui.datePlaceholder}
                autoCapitalize="none"
              />

              <FormInput
                label={ui.paymentMethod}
                value={form.paymentMethod}
                onChangeText={(value) => updateForm("paymentMethod", value)}
                placeholder={ui.paymentMethod}
              />

              <FormInput
                label={ui.paymentReference}
                value={form.paymentReference}
                onChangeText={(value) =>
                  updateForm("paymentReference", value)
                }
                placeholder={ui.paymentReference}
              />

              <FormInput
                label={ui.notes}
                value={form.notes}
                onChangeText={(value) => updateForm("notes", value)}
                placeholder={ui.notes}
                multiline
                inputStyle={styles.notesInput}
              />

              <View style={styles.modalActions}>
                <Pressable style={styles.cancelButton} onPress={closeModal}>
                  <Text style={styles.cancelButtonText}>{ui.cancel}</Text>
                </Pressable>

                <Pressable
                  style={[
                    styles.saveButton,
                    saving && styles.saveButtonDisabled,
                  ]}
                  disabled={saving}
                  onPress={() => void handleSave()}
                >
                  {saving ? (
                    <ActivityIndicator color="#111111" />
                  ) : (
                    <Save color="#111111" size={15} />
                  )}
                  <Text style={styles.saveButtonText}>
                    {saving ? ui.saving : editingId ? ui.update : ui.save}
                  </Text>
                </Pressable>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function StatBox({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: ReactNode;
}) {
  return (
    <View style={styles.statBox}>
      <View style={styles.statIcon}>{icon}</View>
      <Text style={styles.statValue} numberOfLines={2}>
        {value}
      </Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function FilterSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
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

function SelectSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <View style={styles.selectSection}>
      <Text style={styles.inputLabel}>{title}</Text>

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
    color: string;
    bg: string;
    border: string;
    icon?: ReactNode;
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

function DetailBox({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailBox}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue} numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}

function InfoCard({
  icon,
  title,
  lines,
}: {
  icon: ReactNode;
  title: string;
  lines: string[];
}) {
  return (
    <View style={styles.infoCard}>
      <View style={styles.infoHeader}>
        <View style={styles.infoIcon}>{icon}</View>
        <Text style={styles.infoTitle}>{title}</Text>
      </View>

      <View style={styles.infoLines}>
        {lines.map((line, index) => (
          <Text key={`${line}-${index}`} style={styles.infoLine}>
            {index + 1}. {line}
          </Text>
        ))}
      </View>
    </View>
  );
}

function FormInput({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  autoCapitalize = "sentences",
  multiline,
  inputStyle,
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  keyboardType?: TextInputProps["keyboardType"];
  autoCapitalize?: TextInputProps["autoCapitalize"];
  multiline?: boolean;
  inputStyle?: TextInputProps["style"];
}) {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>{label}</Text>

      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#777777"
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        multiline={multiline}
        style={[styles.input, inputStyle]}
      />
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
  addButton: {
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
  addButtonText: {
    color: "#111111",
    fontSize: 11.5,
    fontWeight: "900",
  },
  warningCard: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#705d2c",
    backgroundColor: "#211a0b",
    padding: 13,
    marginBottom: 12,
    flexDirection: "row",
    gap: 10,
    alignItems: "flex-start",
  },
  warningTextBox: {
    flex: 1,
  },
  warningTitle: {
    color: "#ffffff",
    fontSize: 12.5,
    fontWeight: "900",
  },
  warningText: {
    color: "#d6d6d6",
    fontSize: 11.3,
    lineHeight: 17,
    fontWeight: "700",
    marginTop: 4,
  },
  errorBox: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#7f1d1d",
    backgroundColor: "#2a0d0d",
    padding: 13,
    marginBottom: 12,
    flexDirection: "row",
    gap: 9,
  },
  errorText: {
    color: "#fecaca",
    fontSize: 11.8,
    lineHeight: 17,
    fontWeight: "700",
    flex: 1,
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
  statIcon: {
    width: 34,
    height: 34,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#252525",
    backgroundColor: "#050505",
    alignItems: "center",
    justifyContent: "center",
  },
  statValue: {
    color: "#ffffff",
    fontSize: 13.5,
    lineHeight: 18,
    fontWeight: "900",
    marginTop: 9,
  },
  statLabel: {
    color: "#a9a9a9",
    fontSize: 10.2,
    lineHeight: 14,
    fontWeight: "800",
    marginTop: 3,
  },
  searchCard: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#303030",
    backgroundColor: "#101010",
    padding: 13,
    marginBottom: 14,
  },
  searchBox: {
    minHeight: 49,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: "#303030",
    backgroundColor: "#050505",
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },
  searchInput: {
    flex: 1,
    color: "#ffffff",
    fontSize: 12.5,
    fontWeight: "700",
    paddingVertical: 0,
  },
  filterSection: {
    marginTop: 13,
  },
  filterTitle: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "900",
    marginBottom: 8,
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
  sectionHeader: {
    marginTop: 4,
    marginBottom: 11,
  },
  sectionTitle: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "900",
  },
  sectionDesc: {
    color: "#a9a9a9",
    fontSize: 11.5,
    lineHeight: 17,
    fontWeight: "700",
    marginTop: 4,
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
    lineHeight: 18,
    fontWeight: "800",
    textAlign: "center",
  },
  recordList: {
    gap: 13,
  },
  recordCard: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#303030",
    backgroundColor: "#101010",
    padding: 15,
  },
  recordTop: {
    gap: 9,
  },
  recordTitleBox: {
    flex: 1,
  },
  recordTitle: {
    color: "#ffffff",
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "900",
  },
  recordCode: {
    color: "#a9a9a9",
    fontSize: 11,
    fontWeight: "800",
    marginTop: 4,
  },
  badge: {
    alignSelf: "flex-start",
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 9,
    paddingVertical: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 8,
  },
  badgeText: {
    fontSize: 9.8,
    fontWeight: "900",
  },
  commissionBox: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#5b4a24",
    backgroundColor: "#211a0b",
    padding: 12,
    marginTop: 12,
  },
  commissionLabel: {
    color: "#c9b56b",
    fontSize: 10.5,
    fontWeight: "900",
  },
  commissionValue: {
    color: "#ffffff",
    fontSize: 19,
    lineHeight: 24,
    fontWeight: "900",
    marginTop: 4,
  },
  detailGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
  },
  detailBox: {
    width: "48.5%",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#252525",
    backgroundColor: "#050505",
    padding: 10,
  },
  detailLabel: {
    color: "#777777",
    fontSize: 9.5,
    fontWeight: "900",
  },
  detailValue: {
    color: "#ffffff",
    fontSize: 11.5,
    lineHeight: 16,
    fontWeight: "800",
    marginTop: 4,
  },
  clientBox: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#252525",
    backgroundColor: "#050505",
    padding: 10,
    marginTop: 10,
  },
  clientText: {
    color: "#a9a9a9",
    fontSize: 11,
    lineHeight: 16,
    fontWeight: "700",
  },
  notesBox: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#252525",
    backgroundColor: "#050505",
    padding: 10,
    marginTop: 10,
  },
  notesLabel: {
    color: "#777777",
    fontSize: 9.5,
    fontWeight: "900",
  },
  notesText: {
    color: "#ffffff",
    fontSize: 11.5,
    lineHeight: 17,
    fontWeight: "700",
    marginTop: 5,
  },
  actionRow: {
    flexDirection: "row",
    gap: 9,
    marginTop: 13,
  },
  editButton: {
    flex: 1,
    minHeight: 43,
    borderRadius: 15,
    backgroundColor: "#e6c15c",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },
  editButtonText: {
    color: "#111111",
    fontSize: 12,
    fontWeight: "900",
  },
  deleteButton: {
    flex: 1,
    minHeight: 43,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#7f1d1d",
    backgroundColor: "#2a0d0d",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },
  deleteButtonText: {
    color: "#fecaca",
    fontSize: 12,
    fontWeight: "900",
  },
  sideCards: {
    gap: 13,
    marginTop: 14,
  },
  infoCard: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#303030",
    backgroundColor: "#101010",
    padding: 15,
  },
  infoHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#5b4a24",
    backgroundColor: "#211a0b",
    alignItems: "center",
    justifyContent: "center",
  },
  infoTitle: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "900",
  },
  infoLines: {
    gap: 8,
    marginTop: 12,
  },
  infoLine: {
    color: "#a9a9a9",
    fontSize: 11.5,
    lineHeight: 17,
    fontWeight: "700",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.76)",
    padding: 16,
    justifyContent: "center",
  },
  modalCard: {
    maxHeight: "92%",
    borderRadius: 26,
    borderWidth: 1,
    borderColor: "#303030",
    backgroundColor: "#101010",
    overflow: "hidden",
  },
  modalHeader: {
    minHeight: 58,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#202020",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  modalTitle: {
    color: "#ffffff",
    fontSize: 17,
    fontWeight: "900",
  },
  modalCloseButton: {
    width: 36,
    height: 36,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#303030",
    backgroundColor: "#050505",
    alignItems: "center",
    justifyContent: "center",
  },
  modalScrollContent: {
    padding: 15,
    paddingBottom: 18,
  },
  previewBox: {
    borderRadius: 19,
    borderWidth: 1,
    borderColor: "#5b4a24",
    backgroundColor: "#211a0b",
    padding: 13,
    marginBottom: 13,
  },
  previewLabel: {
    color: "#c9b56b",
    fontSize: 10.5,
    fontWeight: "900",
  },
  previewValue: {
    color: "#ffffff",
    fontSize: 20,
    fontWeight: "900",
    marginTop: 4,
  },
  previewFormula: {
    color: "#a9a9a9",
    fontSize: 11,
    fontWeight: "700",
    marginTop: 4,
  },
  inputGroup: {
    marginBottom: 12,
  },
  inputLabel: {
    color: "#ffffff",
    fontSize: 11.5,
    fontWeight: "900",
    marginBottom: 7,
  },
  input: {
    minHeight: 49,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: "#303030",
    backgroundColor: "#050505",
    color: "#ffffff",
    paddingHorizontal: 12,
    fontSize: 12.5,
    fontWeight: "800",
  },
  notesInput: {
    minHeight: 96,
    paddingTop: 12,
    textAlignVertical: "top",
  },
  selectSection: {
    marginBottom: 12,
  },
  modalActions: {
    flexDirection: "row",
    gap: 9,
    marginTop: 4,
  },
  cancelButton: {
    flex: 1,
    minHeight: 47,
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
    minHeight: 47,
    borderRadius: 15,
    backgroundColor: "#e6c15c",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },
  saveButtonDisabled: {
    opacity: 0.65,
  },
  saveButtonText: {
    color: "#111111",
    fontSize: 12,
    fontWeight: "900",
  },
});