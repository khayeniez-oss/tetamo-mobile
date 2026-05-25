import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  CreditCard,
  ExternalLink,
  FileText,
  QrCode,
  Receipt,
  RefreshCcw,
  Wallet,
  XCircle,
} from "lucide-react-native";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Platform,
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

type NormalizedStatus =
  | "paid"
  | "pending"
  | "unpaid"
  | "failed"
  | "expired"
  | "cancelled"
  | "refunded";

type PaymentRow = {
  id: string;
  user_id: string | null;
  property_id: string | null;
  source_role: string | null;
  payment_type: string | null;
  product_id: string | null;
  product_name_snapshot: string | null;
  product_type: string | null;
  status: string | null;
  currency: string | null;
  amount_subtotal: number | null;
  amount_total: number | null;
  description: string | null;
  plan_name: string | null;
  duration_days: number | null;
  property_title_snapshot: string | null;
  property_code_snapshot: string | null;
  customer_name: string | null;
  customer_email: string | null;
  checkout_url: string | null;
  checkout_expires_at: string | null;
  stripe_checkout_session_id: string | null;
  stripe_payment_intent_id: string | null;
  stripe_charge_id: string | null;
  stripe_invoice_id: string | null;
  receipt_url: string | null;
  hosted_invoice_url: string | null;
  invoice_pdf_url: string | null;
  paid_at: string | null;
  expired_at: string | null;
  failed_at: string | null;
  metadata: Record<string, any> | null;
  created_at: string | null;
  updated_at: string | null;
};

function asObject(value: unknown): Record<string, any> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, any>)
    : {};
}

function cleanText(value: unknown, fallback = "-") {
  const text = String(value || "").trim();
  return text || fallback;
}

function normalizeStatus(value: unknown): NormalizedStatus {
  const status = String(value || "").toLowerCase();

  if (
    status === "paid" ||
    status === "completed" ||
    status === "succeeded" ||
    status === "settled" ||
    status === "active"
  ) {
    return "paid";
  }

  if (
    status === "checkout_created" ||
    status === "pending" ||
    status === "initiated"
  ) {
    return "pending";
  }

  if (status === "unpaid") return "unpaid";
  if (status === "failed") return "failed";
  if (status === "expired") return "expired";
  if (status === "canceled" || status === "cancelled") return "cancelled";
  if (status === "refunded" || status === "partially_refunded") return "refunded";

  return "pending";
}

function formatAmount(amount: number | null, currency: string | null) {
  const code = String(currency || "IDR").toUpperCase();
  const value = Number(amount || 0);

  if (code === "IDR") {
    return `Rp ${new Intl.NumberFormat("id-ID").format(value)}`;
  }

  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: code,
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return `${code} ${new Intl.NumberFormat("en-US").format(value)}`;
  }
}

function formatDateTime(value: string | null, language: Language) {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat(language === "id" ? "id-ID" : "en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function getPaymentMetaInfo(payment: PaymentRow) {
  const metadata = asObject(payment.metadata);
  const hitpay = asObject(metadata.hitpay);

  const gateway = String(
    metadata.gateway || metadata.payment_gateway || hitpay.gateway || "",
  ).toLowerCase();

  const method = String(
    metadata.paymentMethod ||
      metadata.payment_method ||
      hitpay.paymentMethod ||
      hitpay.payment_method ||
      "",
  ).toLowerCase();

  const qrisReference = String(
    metadata.hitpay_reference_number ||
      metadata.hitpay_payment_request_id ||
      hitpay.reference_number ||
      hitpay.payment_request_id ||
      hitpay.payment_id ||
      "",
  ).trim();

  const isQris = Boolean(
    method === "qris" ||
      gateway === "hitpay" ||
      metadata.hitpay_payment_request_id ||
      metadata.hitpay_reference_number ||
      hitpay.payment_request_id ||
      hitpay.reference_number ||
      hitpay.payment_id,
  );

  return {
    isQris,
    qrisReference,
  };
}

function getPaymentMethod(payment: PaymentRow, language: Language) {
  const info = getPaymentMetaInfo(payment);

  if (info.isQris) {
    return language === "id" ? "Dibayar dengan QRIS" : "Paid by QRIS";
  }

  return "Debit / Credit Card";
}

function getPaymentIcon(payment: PaymentRow) {
  return getPaymentMetaInfo(payment).isQris ? (
    <QrCode color="#e6c15c" size={16} />
  ) : (
    <CreditCard color="#e6c15c" size={16} />
  );
}

function getReference(payment: PaymentRow) {
  const info = getPaymentMetaInfo(payment);

  if (info.qrisReference) return info.qrisReference;
  if (payment.stripe_checkout_session_id) return payment.stripe_checkout_session_id;
  if (payment.stripe_payment_intent_id) return payment.stripe_payment_intent_id;
  if (payment.stripe_charge_id) return payment.stripe_charge_id;

  return payment.id;
}

function getInvoiceUrl(payment: PaymentRow) {
  return payment.hosted_invoice_url || payment.invoice_pdf_url || "";
}

function getExternalReceiptUrl(payment: PaymentRow) {
  return payment.receipt_url || getInvoiceUrl(payment);
}

function getTitle(payment: PaymentRow, language: Language) {
  const paymentType = String(payment.payment_type || "").toLowerCase();

  if (payment.property_title_snapshot) return payment.property_title_snapshot;
  if (payment.product_name_snapshot) return payment.product_name_snapshot;
  if (payment.description) return payment.description;
  if (payment.plan_name) return payment.plan_name;

  if (paymentType === "package") {
    return language === "id" ? "Membership Agen" : "Agent Membership";
  }

  if (paymentType === "listing_fee") {
    return language === "id" ? "Biaya Listing" : "Listing Fee";
  }

  if (paymentType === "boost") return "Boost Listing";
  if (paymentType === "spotlight") return "Homepage Spotlight";
  if (paymentType === "education") return "Education Pass";

  return language === "id" ? "Pembayaran Tetamo" : "Tetamo Payment";
}

function getTypeLabel(payment: PaymentRow, language: Language) {
  const paymentType = String(payment.payment_type || "").toLowerCase();
  const productType = String(payment.product_type || "").toLowerCase();

  if (paymentType === "package" || productType === "membership") {
    return language === "id" ? "Membership" : "Membership";
  }

  if (paymentType === "listing_fee") {
    return language === "id" ? "Listing" : "Listing";
  }

  if (paymentType === "boost") return "Boost";
  if (paymentType === "spotlight") return "Spotlight";
  if (paymentType === "education") return "Education";

  return cleanText(payment.payment_type || payment.product_type || "Payment");
}

function getStatusUI(status: NormalizedStatus, language: Language) {
  if (status === "paid") {
    return {
      label: "PAID",
      description:
        language === "id"
          ? "Pembayaran sudah berhasil dikonfirmasi."
          : "Payment has been confirmed successfully.",
      icon: <CheckCircle2 color="#22c55e" size={16} />,
      color: "#22c55e",
      bg: "#052e16",
      border: "#166534",
    };
  }

  if (status === "pending") {
    return {
      label: "PENDING",
      description:
        language === "id"
          ? "Menunggu pembayaran atau konfirmasi dari gateway."
          : "Waiting for payment or gateway confirmation.",
      icon: <Clock3 color="#e6c15c" size={16} />,
      color: "#e6c15c",
      bg: "#211a0b",
      border: "#705d2c",
    };
  }

  if (status === "unpaid") {
    return {
      label: "UNPAID",
      description:
        language === "id"
          ? "Tagihan belum dibayar."
          : "This billing record has not been paid.",
      icon: <Clock3 color="#e6c15c" size={16} />,
      color: "#e6c15c",
      bg: "#211a0b",
      border: "#705d2c",
    };
  }

  if (status === "expired") {
    return {
      label: "EXPIRED",
      description:
        language === "id"
          ? "Checkout sudah kedaluwarsa."
          : "The checkout link has expired.",
      icon: <Clock3 color="#fb923c" size={16} />,
      color: "#fb923c",
      bg: "#2a1608",
      border: "#9a3412",
    };
  }

  if (status === "cancelled") {
    return {
      label: "CANCELLED",
      description:
        language === "id"
          ? "Pembayaran dibatalkan atau tidak diselesaikan."
          : "Payment was cancelled or not completed.",
      icon: <XCircle color="#a9a9a9" size={16} />,
      color: "#a9a9a9",
      bg: "#171717",
      border: "#333333",
    };
  }

  if (status === "refunded") {
    return {
      label: "REFUNDED",
      description:
        language === "id"
          ? "Pembayaran sudah dikembalikan."
          : "Payment has been refunded.",
      icon: <RefreshCcw color="#38bdf8" size={16} />,
      color: "#38bdf8",
      bg: "#082f49",
      border: "#0369a1",
    };
  }

  return {
    label: "FAILED",
    description:
      language === "id"
        ? "Pembayaran gagal atau tidak berhasil diproses."
        : "Payment failed or was not processed successfully.",
    icon: <XCircle color="#f87171" size={16} />,
    color: "#f87171",
    bg: "#2a0d0d",
    border: "#7f1d1d",
  };
}

function shouldShowReceipt(status: NormalizedStatus) {
  return status === "paid" || status === "refunded";
}

function shouldShowPayNow(status: NormalizedStatus, payment: PaymentRow) {
  if (status === "paid") return false;
  if (status === "refunded") return false;

  if (
    status === "pending" ||
    status === "unpaid" ||
    status === "failed" ||
    status === "expired" ||
    status === "cancelled"
  ) {
    return Boolean(payment.checkout_url);
  }

  return false;
}

export default function DashboardPaymentsScreen() {
  const router = useRouter();
  const isIOS = Platform.OS === "ios";

  const [language, setLanguage] = useState<Language>("en");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [errorMessage, setErrorMessage] = useState("");

  const isId = language === "id";

  const ui = useMemo(() => {
    if (isId) {
      return {
        title: "Payment & Receipt",
        subtitle:
          "Lihat status pembayaran, metode pembayaran, receipt, dan invoice Tetamo.",
        loading: "Memuat pembayaran...",
        empty: "Belum ada riwayat pembayaran.",
        failedLoad: "Gagal memuat pembayaran.",
        back: "Kembali",
        refresh: "Refresh",
        total: "Total",
        paid: "Paid",
        pending: "Pending",
        amount: "Jumlah",
        method: "Metode",
        source: "Role",
        type: "Jenis",
        listingCode: "Kode Listing",
        reference: "Reference",
        created: "Dibuat",
        paidAt: "Dibayar",
        receipt: "Receipt",
        invoice: "Invoice",
        payNow: "Pay Now",
        noCheckout: "Link checkout tidak tersedia",
        openingProfile: "Membuka Profile",
        redirectProfile: "Anda akan diarahkan kembali ke profile.",
        profile: "Profile",
      };
    }

    return {
      title: "Payment & Receipt",
      subtitle:
        "View Tetamo payment status, payment method, receipts, and invoices.",
      loading: "Loading payments...",
      empty: "No payment history yet.",
      failedLoad: "Failed to load payments.",
      back: "Back",
      refresh: "Refresh",
      total: "Total",
      paid: "Paid",
      pending: "Pending",
      amount: "Amount",
      method: "Method",
      source: "Role",
      type: "Type",
      listingCode: "Listing Code",
      reference: "Reference",
      created: "Created",
      paidAt: "Paid At",
      receipt: "Receipt",
      invoice: "Invoice",
      payNow: "Pay Now",
      noCheckout: "Checkout link unavailable",
      openingProfile: "Opening Profile",
      redirectProfile: "Redirecting you back to profile.",
      profile: "Profile",
    };
  }, [isId]);

  const stats = useMemo(() => {
    const paid = payments.filter((item) => normalizeStatus(item.status) === "paid");
    const pending = payments.filter((item) => {
      const status = normalizeStatus(item.status);
      return status === "pending" || status === "unpaid";
    });

    return {
      total: payments.length,
      paid: paid.length,
      pending: pending.length,
    };
  }, [payments]);

  const loadPayments = useCallback(async () => {
    if (isIOS) {
      setPayments([]);
      setLoading(false);
      setRefreshing(false);
      return;
    }

    setErrorMessage("");

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setPayments([]);
      setLoading(false);
      setRefreshing(false);
      router.replace("/login" as any);
      return;
    }

    const { data, error } = await supabase
      .from("payment_transactions")
      .select(
        `
          id,
          user_id,
          property_id,
          source_role,
          payment_type,
          product_id,
          product_name_snapshot,
          product_type,
          status,
          currency,
          amount_subtotal,
          amount_total,
          description,
          plan_name,
          duration_days,
          property_title_snapshot,
          property_code_snapshot,
          customer_name,
          customer_email,
          checkout_url,
          checkout_expires_at,
          stripe_checkout_session_id,
          stripe_payment_intent_id,
          stripe_charge_id,
          stripe_invoice_id,
          receipt_url,
          hosted_invoice_url,
          invoice_pdf_url,
          paid_at,
          expired_at,
          failed_at,
          metadata,
          created_at,
          updated_at
        `,
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      setPayments([]);
      setErrorMessage(error.message || ui.failedLoad);
      setLoading(false);
      setRefreshing(false);
      return;
    }

    setPayments((data || []) as PaymentRow[]);
    setLoading(false);
    setRefreshing(false);
  }, [isIOS, router, ui.failedLoad]);

  useEffect(() => {
    if (!isIOS) return;

    router.replace("/profile" as any);
  }, [isIOS, router]);

  useEffect(() => {
    void loadPayments();
  }, [loadPayments]);

  async function handleRefresh() {
    if (isIOS) {
      router.replace("/profile" as any);
      return;
    }

    setRefreshing(true);
    await loadPayments();
  }

  async function openUrl(url?: string | null) {
    if (isIOS) return;
    if (!url) return;

    await Linking.openURL(url);
  }

  function openReceipt(payment: PaymentRow) {
    if (isIOS) {
      router.replace("/profile" as any);
      return;
    }

    router.push(`/dashboard/receipt/${payment.id}` as any);
  }

  if (isIOS) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="light" />

        <View style={styles.iosRedirectBox}>
          <ActivityIndicator color="#e6c15c" />

          <Text style={styles.iosRedirectTitle}>{ui.openingProfile}</Text>

          <Text style={styles.iosRedirectText}>{ui.redirectProfile}</Text>

          <Pressable
            style={styles.iosProfileButton}
            onPress={() => router.replace("/profile" as any)}
          >
            <Text style={styles.iosProfileButtonText}>{ui.profile}</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
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
            <Wallet color="#111111" size={25} />
          </View>

          <Text style={styles.heroTitle}>{ui.title}</Text>
          <Text style={styles.heroSubtitle}>{ui.subtitle}</Text>

          <Pressable
            style={styles.refreshButton}
            onPress={() => void handleRefresh()}
          >
            <RefreshCcw color="#111111" size={14} />
            <Text style={styles.refreshText}>{ui.refresh}</Text>
          </Pressable>
        </View>

        <View style={styles.statsGrid}>
          <StatBox label={ui.total} value={String(stats.total)} />
          <StatBox label={ui.paid} value={String(stats.paid)} />
          <StatBox label={ui.pending} value={String(stats.pending)} />
        </View>

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

        {!loading && !errorMessage && payments.length === 0 ? (
          <View style={styles.emptyBox}>
            <Receipt color="#a9a9a9" size={28} />
            <Text style={styles.emptyText}>{ui.empty}</Text>
          </View>
        ) : null}

        <View style={styles.paymentList}>
          {payments.map((payment) => {
            const status = normalizeStatus(payment.status);
            const statusUI = getStatusUI(status, language);
            const invoiceUrl = getInvoiceUrl(payment);
            const externalReceiptUrl = getExternalReceiptUrl(payment);

            const showReceipt = shouldShowReceipt(status);
            const showPayNow = shouldShowPayNow(status, payment);

            return (
              <View key={payment.id} style={styles.paymentCard}>
                <View style={styles.cardTop}>
                  <View style={styles.cardTitleBox}>
                    <Text style={styles.cardTitle} numberOfLines={2}>
                      {getTitle(payment, language)}
                    </Text>

                    <Text style={styles.cardSubtitle} numberOfLines={1}>
                      {getTypeLabel(payment, language)} •{" "}
                      {cleanText(payment.source_role, "-").toUpperCase()}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.statusPill,
                      {
                        backgroundColor: statusUI.bg,
                        borderColor: statusUI.border,
                      },
                    ]}
                  >
                    {statusUI.icon}
                    <Text style={[styles.statusText, { color: statusUI.color }]}>
                      {statusUI.label}
                    </Text>
                  </View>
                </View>

                <Text style={styles.statusDescription}>
                  {statusUI.description}
                </Text>

                <View style={styles.methodBox}>
                  {getPaymentIcon(payment)}
                  <View style={styles.methodTextBox}>
                    <Text style={styles.methodLabel}>{ui.method}</Text>
                    <Text style={styles.methodValue}>
                      {getPaymentMethod(payment, language)}
                    </Text>
                  </View>
                </View>

                <View style={styles.detailGrid}>
                  <DetailItem
                    label={ui.amount}
                    value={formatAmount(
                      payment.amount_total ?? payment.amount_subtotal ?? 0,
                      payment.currency,
                    )}
                  />

                  <DetailItem
                    label={ui.listingCode}
                    value={cleanText(payment.property_code_snapshot)}
                  />

                  <DetailItem
                    label={ui.reference}
                    value={getReference(payment)}
                  />

                  <DetailItem
                    label={ui.created}
                    value={formatDateTime(payment.created_at, language)}
                  />

                  <DetailItem
                    label={ui.paidAt}
                    value={formatDateTime(payment.paid_at, language)}
                  />
                </View>

                <View style={styles.actionRow}>
                  {showReceipt ? (
                    <Pressable
                      style={styles.goldButton}
                      onPress={() => openReceipt(payment)}
                    >
                      <Receipt color="#111111" size={15} />
                      <Text style={styles.goldButtonText}>{ui.receipt}</Text>
                    </Pressable>
                  ) : null}

                  {showReceipt && invoiceUrl ? (
                    <Pressable
                      style={styles.darkButton}
                      onPress={() => void openUrl(invoiceUrl)}
                    >
                      <FileText color="#ffffff" size={15} />
                      <Text style={styles.darkButtonText}>{ui.invoice}</Text>
                      <ExternalLink color="#ffffff" size={13} />
                    </Pressable>
                  ) : null}

                  {showReceipt && !invoiceUrl && externalReceiptUrl ? (
                    <Pressable
                      style={styles.darkButton}
                      onPress={() => void openUrl(externalReceiptUrl)}
                    >
                      <ExternalLink color="#ffffff" size={15} />
                      <Text style={styles.darkButtonText}>
                        {isId ? "Gateway" : "Gateway"}
                      </Text>
                    </Pressable>
                  ) : null}

                  {showPayNow ? (
                    <Pressable
                      style={styles.goldButton}
                      onPress={() => void openUrl(payment.checkout_url)}
                    >
                      {getPaymentMetaInfo(payment).isQris ? (
                        <QrCode color="#111111" size={15} />
                      ) : (
                        <CreditCard color="#111111" size={15} />
                      )}
                      <Text style={styles.goldButtonText}>{ui.payNow}</Text>
                      <ExternalLink color="#111111" size={13} />
                    </Pressable>
                  ) : null}
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

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailItem}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue} numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#050505",
  },
  iosRedirectBox: {
    flex: 1,
    backgroundColor: "#050505",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
    gap: 12,
  },
  iosRedirectTitle: {
    color: "#ffffff",
    fontSize: 22,
    fontWeight: "900",
    marginTop: 6,
  },
  iosRedirectText: {
    color: "#b8b8b8",
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 6,
  },
  iosProfileButton: {
    minHeight: 48,
    borderRadius: 17,
    backgroundColor: "#e6c15c",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
    marginTop: 4,
  },
  iosProfileButtonText: {
    color: "#111111",
    fontSize: 13,
    fontWeight: "900",
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
    gap: 9,
    marginBottom: 13,
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
  paymentList: {
    gap: 13,
  },
  paymentCard: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#303030",
    backgroundColor: "#101010",
    padding: 15,
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  cardTitleBox: {
    flex: 1,
  },
  cardTitle: {
    color: "#ffffff",
    fontSize: 14.5,
    lineHeight: 19,
    fontWeight: "900",
  },
  cardSubtitle: {
    color: "#a9a9a9",
    fontSize: 11,
    fontWeight: "800",
    marginTop: 3,
  },
  statusPill: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 9,
    paddingVertical: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  statusText: {
    fontSize: 9.8,
    fontWeight: "900",
  },
  statusDescription: {
    color: "#b8b8b8",
    fontSize: 11.3,
    lineHeight: 16,
    fontWeight: "700",
    marginTop: 10,
  },
  methodBox: {
    marginTop: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#5b4a24",
    backgroundColor: "#211a0b",
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  methodTextBox: {
    flex: 1,
  },
  methodLabel: {
    color: "#c9b56b",
    fontSize: 10,
    fontWeight: "800",
  },
  methodValue: {
    color: "#ffffff",
    fontSize: 12.5,
    fontWeight: "900",
    marginTop: 2,
  },
  detailGrid: {
    marginTop: 12,
    gap: 8,
  },
  detailItem: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#252525",
    backgroundColor: "#050505",
    padding: 10,
  },
  detailLabel: {
    color: "#777777",
    fontSize: 10,
    fontWeight: "800",
  },
  detailValue: {
    color: "#ffffff",
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "900",
    marginTop: 3,
  },
  actionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 9,
    marginTop: 14,
  },
  goldButton: {
    minHeight: 43,
    borderRadius: 15,
    backgroundColor: "#e6c15c",
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },
  goldButtonText: {
    color: "#111111",
    fontSize: 12,
    fontWeight: "900",
  },
  darkButton: {
    minHeight: 43,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#343434",
    backgroundColor: "#050505",
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },
  darkButtonText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "900",
  },
});