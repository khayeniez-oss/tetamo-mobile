import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
  CheckCircle2,
  Clock,
  ExternalLink,
  FileText,
  Home,
  PackageCheck,
  ReceiptText,
  RotateCcw,
  ShieldCheck,
  XCircle,
} from "lucide-react-native";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  ActivityIndicator,
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

type PaymentStatus =
  | "pending"
  | "checkout_created"
  | "paid"
  | "failed"
  | "expired"
  | "canceled"
  | "cancelled"
  | "refunded"
  | "partially_refunded";

type PaymentRow = {
  id: string;
  source_role: string | null;
  payment_type: string | null;
  product_id: string | null;
  product_name_snapshot: string | null;
  product_type: string | null;
  amount_total: number | null;
  currency: string | null;
  status: PaymentStatus | null;
  checkout_url: string | null;
  stripe_checkout_session_id: string | null;
  paid_at: string | null;
  checkout_expires_at: string | null;
  created_at: string | null;
  receipt_url: string | null;
  hosted_invoice_url: string | null;
  invoice_pdf_url: string | null;
  metadata: Record<string, any> | null;
};

type AgentMembershipRow = {
  id?: string;
  user_id: string | null;
  payment_id: string | null;
  package_id: string | null;
  package_name: string | null;
  billing_cycle: string | null;
  status: string | null;
  starts_at: string | null;
  expires_at: string | null;
  metadata: Record<string, any> | null;
};

export default function AgentPaymentSuccessScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const isIOS = Platform.OS === "ios";

  const [language, setLanguage] = useState<Language>("en");
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [payment, setPayment] = useState<PaymentRow | null>(null);
  const [membership, setMembership] = useState<AgentMembershipRow | null>(null);
  const [pollCount, setPollCount] = useState(0);

  const isId = language === "id";
  const locale = isId ? "id-ID" : "en-US";

  const paymentId = readParam(params.payment_id);
  const sessionId = readParam(params.session_id);
  const urlPayment = readParam(params.payment).toLowerCase();
  const urlPackage = readParam(params.package) || readParam(params.product);
  const urlBilling = readParam(params.billing);

  const t = useMemo(() => {
    if (isId) {
      return {
        loadingPayment: "Memuat status pembayaran agen...",
        loginFirst: "Silakan login terlebih dahulu.",
        loadPaymentError: "Gagal memuat status pembayaran.",
        paymentNotFound: "Data pembayaran tidak ditemukan.",
        statusLabel: "Status",
        amountLabel: "Jumlah",
        packageLabel: "Paket",
        billingLabel: "Tagihan",
        methodLabel: "Metode",
        createdLabel: "Dibuat",
        paidAtLabel: "Dibayar Pada",
        activeFromLabel: "Aktif Dari",
        expiresAtLabel: "Aktif Sampai",
        detailsTitle: "Detail Status",
        continuePayment: "Lanjutkan Pembayaran",
        toAgentDashboard: "Ke Dashboard Agen",
        toPayments: "Lihat Pembayaran",
        receiptButton: "Lihat Receipt",
        invoiceButton: "Lihat Invoice",
        choosePackage: "Pilih Paket Lain",
        createListing: "Buat Listing",
        paymentReceived: "Pembayaran Diterima",
        membershipActive: "Membership Agen Aktif",
        pendingTitle: "Pembayaran Sedang Dikonfirmasi",
        cancelledTitle: "Pembayaran Dibatalkan",
        failedTitle: "Pembayaran Belum Berhasil",
        expiredTitle: "Pembayaran Kadaluarsa",
        refundedTitle: "Pembayaran Direfund",
        openingProfile: "Membuka Profile",
        redirectProfile: "Anda akan diarahkan kembali ke profile.",
        profile: "Profile",
        successDescription:
          "Pembayaran paket agen Anda berhasil. Membership Anda sudah diproses dan siap digunakan sesuai status terbaru.",
        successPoints: [
          "Pembayaran sudah tercatat",
          "Paket agen sudah diproses",
          "Anda bisa mulai mengelola listing dari dashboard agen",
        ],
        pendingDescription:
          "Pembayaran Anda sedang dikonfirmasi. Silakan tunggu sebentar, lalu refresh status pembayaran.",
        pendingPoints: [
          "Status pembayaran akan diperbarui otomatis",
          "Jangan membuat pembayaran baru jika Anda sudah membayar",
          "Cek kembali status dari halaman ini atau halaman pembayaran",
        ],
        cancelledDescription:
          "Pembayaran dibatalkan. Anda bisa kembali ke paket agen untuk mencoba lagi.",
        cancelledPoints: [
          "Tidak ada aktivasi paket yang dijalankan",
          "Anda bisa memilih paket dan mencoba pembayaran lagi",
        ],
        failedDescription:
          "Pembayaran belum berhasil diselesaikan. Silakan coba lagi dari halaman paket agen.",
        failedPoints: [
          "Paket belum aktif",
          "Silakan coba ulang pembayaran jika ingin melanjutkan",
        ],
        expiredDescription:
          "Checkout pembayaran sudah kadaluarsa. Silakan buat pembayaran baru dari halaman paket agen.",
        expiredPoints: [
          "Checkout lama tidak bisa digunakan lagi",
          "Silakan pilih paket dan buat checkout baru",
        ],
        refundedDescription:
          "Pembayaran ini sudah direfund. Silakan cek receipt atau hubungi admin jika butuh bantuan.",
        refundedPoints: [
          "Status pembayaran sudah berubah menjadi refund",
          "Detail pembayaran tersimpan di riwayat pembayaran",
        ],
      };
    }

    return {
      loadingPayment: "Loading agent payment status...",
      loginFirst: "Please log in first.",
      loadPaymentError: "Failed to load payment status.",
      paymentNotFound: "Payment data was not found.",
      statusLabel: "Status",
      amountLabel: "Amount",
      packageLabel: "Package",
      billingLabel: "Billing",
      methodLabel: "Method",
      createdLabel: "Created",
      paidAtLabel: "Paid At",
      activeFromLabel: "Active From",
      expiresAtLabel: "Active Until",
      detailsTitle: "Status Details",
      continuePayment: "Continue Payment",
      toAgentDashboard: "Go to Agent Dashboard",
      toPayments: "View Payments",
      receiptButton: "View Receipt",
      invoiceButton: "View Invoice",
      choosePackage: "Choose Another Package",
      createListing: "Create Listing",
      paymentReceived: "Payment Received",
      membershipActive: "Agent Membership Active",
      pendingTitle: "Payment Being Confirmed",
      cancelledTitle: "Payment Cancelled",
      failedTitle: "Payment Not Completed",
      expiredTitle: "Payment Expired",
      refundedTitle: "Payment Refunded",
      openingProfile: "Opening Profile",
      redirectProfile: "Redirecting you back to profile.",
      profile: "Profile",
      successDescription:
        "Your agent package payment was successful. Your membership has been processed and is ready based on the latest status.",
      successPoints: [
        "Your payment has been recorded",
        "Your agent package has been processed",
        "You can start managing listings from the agent dashboard",
      ],
      pendingDescription:
        "Your payment is being confirmed. Please wait a moment, then refresh the payment status.",
      pendingPoints: [
        "The payment status will update automatically",
        "Do not create a new payment if you already paid",
        "Check this page or your payment page again shortly",
      ],
      cancelledDescription:
        "The payment was cancelled. You can return to agent packages and try again.",
      cancelledPoints: [
        "No package activation was completed",
        "You can choose a package and try payment again",
      ],
      failedDescription:
        "The payment was not completed successfully. Please try again from the agent package page.",
      failedPoints: [
        "Your package is not active yet",
        "Please try payment again if you want to continue",
      ],
      expiredDescription:
        "The payment checkout has expired. Please create a new checkout from the agent package page.",
      expiredPoints: [
        "The old checkout can no longer be used",
        "Please choose a package and create a new checkout",
      ],
      refundedDescription:
        "This payment has been refunded. Please check the receipt or contact admin if you need help.",
      refundedPoints: [
        "The payment status has changed to refunded",
        "Payment details are saved in your payment history",
      ],
    };
  }, [isId]);

  useEffect(() => {
    if (!isIOS) return;

    router.replace("/profile" as any);
  }, [isIOS, router]);

  useEffect(() => {
    if (isIOS) {
      setLoading(false);
      return;
    }

    let ignore = false;

    async function loadPayment() {
      setLoading(true);
      setErrorMessage("");

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (ignore) return;

      if (authError || !user) {
        setPayment(null);
        setMembership(null);
        setLoading(false);
        setErrorMessage(t.loginFirst);
        return;
      }

      let foundPayment: PaymentRow | null = null;

      if (paymentId) {
        const { data, error } = await supabase
          .from("payment_transactions")
          .select(
            "id, source_role, payment_type, product_id, product_name_snapshot, product_type, amount_total, currency, status, checkout_url, stripe_checkout_session_id, paid_at, checkout_expires_at, created_at, receipt_url, hosted_invoice_url, invoice_pdf_url, metadata"
          )
          .eq("id", paymentId)
          .eq("user_id", user.id)
          .maybeSingle();

        if (!error && data) {
          foundPayment = data as PaymentRow;
        }
      }

      if (!foundPayment && sessionId) {
        const { data, error } = await supabase
          .from("payment_transactions")
          .select(
            "id, source_role, payment_type, product_id, product_name_snapshot, product_type, amount_total, currency, status, checkout_url, stripe_checkout_session_id, paid_at, checkout_expires_at, created_at, receipt_url, hosted_invoice_url, invoice_pdf_url, metadata"
          )
          .eq("user_id", user.id)
          .eq("stripe_checkout_session_id", sessionId)
          .maybeSingle();

        if (!error && data) {
          foundPayment = data as PaymentRow;
        }
      }

      if (!foundPayment) {
        let query = supabase
          .from("payment_transactions")
          .select(
            "id, source_role, payment_type, product_id, product_name_snapshot, product_type, amount_total, currency, status, checkout_url, stripe_checkout_session_id, paid_at, checkout_expires_at, created_at, receipt_url, hosted_invoice_url, invoice_pdf_url, metadata"
          )
          .eq("user_id", user.id)
          .eq("source_role", "agent")
          .eq("payment_type", "package")
          .order("created_at", { ascending: false })
          .limit(10);

        if (urlPackage) {
          query = query.eq("product_id", urlPackage);
        }

        const { data, error } = await query;

        if (ignore) return;

        if (error) {
          setPayment(null);
          setMembership(null);
          setLoading(false);
          setErrorMessage(error.message || t.loadPaymentError);
          return;
        }

        const rows = (data || []) as PaymentRow[];
        foundPayment = rows[0] || null;
      }

      if (!foundPayment) {
        setPayment(null);
        setMembership(null);
        setLoading(false);
        setErrorMessage(t.paymentNotFound);
        return;
      }

      setPayment(foundPayment);

      const linkedMembership = await loadMembershipForPayment({
        userId: user.id,
        paymentId: foundPayment.id,
      });

      if (!ignore) {
        setMembership(linkedMembership);
        setLoading(false);
      }
    }

    void loadPayment();

    return () => {
      ignore = true;
    };
  }, [
    isIOS,
    paymentId,
    sessionId,
    urlPackage,
    pollCount,
    t.loginFirst,
    t.loadPaymentError,
    t.paymentNotFound,
  ]);

  const resolvedStatus = useMemo(() => {
    if (urlPayment === "cancelled") return "cancelled" as PaymentStatus;
    return normalizeStatus(payment?.status);
  }, [payment?.status, urlPayment]);

  const isPaid = resolvedStatus === "paid" || membership?.status === "active";
  const isPending =
    resolvedStatus === "pending" || resolvedStatus === "checkout_created";

  const shouldPoll =
    !isIOS &&
    pollCount < 8 &&
    (Boolean(paymentId) || Boolean(sessionId) || urlPayment === "success") &&
    !isPaid &&
    isPending;

  useEffect(() => {
    if (!shouldPoll) return;

    const timer = setTimeout(() => {
      setPollCount((prev) => prev + 1);
    }, 3000);

    return () => clearTimeout(timer);
  }, [shouldPoll]);

  const statusUI = getStateUI({
    status: resolvedStatus,
    isPaid,
    isId,
    t,
  });

  const metadata = asObject(payment?.metadata);
  const packageName =
    membership?.package_name ||
    payment?.product_name_snapshot ||
    String(metadata.package_name || metadata.packageName || urlPackage || "-");

  const billingCycle =
    membership?.billing_cycle ||
    String(
      metadata.billing_cycle ||
        metadata.billingCycle ||
        metadata.selected_billing_cycle ||
        urlBilling ||
        "-"
    );

  const listingLimit =
    Number(
      metadata.listing_limit ||
        metadata.active_listing_limit ||
        metadata.max_listings ||
        asObject(membership?.metadata).listing_limit ||
        0
    ) || 0;

  const methodText = humanizePaymentMethod(payment, isId);

  const content = useMemo(() => {
    if (isPaid) {
      return {
        description: t.successDescription,
        points: t.successPoints,
      };
    }

    if (isPending) {
      return {
        description: t.pendingDescription,
        points: t.pendingPoints,
      };
    }

    if (resolvedStatus === "expired") {
      return {
        description: t.expiredDescription,
        points: t.expiredPoints,
      };
    }

    if (resolvedStatus === "cancelled" || resolvedStatus === "canceled") {
      return {
        description: t.cancelledDescription,
        points: t.cancelledPoints,
      };
    }

    if (
      resolvedStatus === "refunded" ||
      resolvedStatus === "partially_refunded"
    ) {
      return {
        description: t.refundedDescription,
        points: t.refundedPoints,
      };
    }

    return {
      description: t.failedDescription,
      points: t.failedPoints,
    };
  }, [isPaid, isPending, resolvedStatus, t]);

  const shouldShowContinuePayment =
    !isIOS && !isPaid && isPending && Boolean(payment?.checkout_url);

  async function openAgentDashboard() {
    router.push("/(tabs)/profile" as any);
  }

  async function openPayments() {
    if (isIOS) {
      router.replace("/profile" as any);
      return;
    }

    router.push("/dashboard/payments" as any);
  }

  async function openReceipt() {
    if (isIOS) {
      router.replace("/profile" as any);
      return;
    }

    if (payment?.id) {
      router.push(`/dashboard/receipt/${payment.id}` as any);
      return;
    }

    router.push("/dashboard/payments" as any);
  }

  async function openPackages() {
    if (isIOS) {
      router.replace("/profile" as any);
      return;
    }

    router.push("/agent/packages" as any);
  }

  async function createListing() {
    if (isIOS) {
      router.replace("/profile" as any);
      return;
    }

    router.push("/agent/create-listing" as any);
  }

  if (isIOS) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="light" />

        <View style={styles.iosRedirectBox}>
          <ActivityIndicator color="#e6c15c" />

          <Text style={styles.iosRedirectTitle}>{t.openingProfile}</Text>

          <Text style={styles.iosRedirectText}>{t.redirectProfile}</Text>

          <Pressable
            style={styles.iosProfileButton}
            onPress={() => router.replace("/profile" as any)}
          >
            <Text style={styles.iosProfileButtonText}>{t.profile}</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />

      <View style={styles.topBar}>
        <View />

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
      >
        <View style={[styles.heroCard, statusUI.heroStyle]}>
          <View style={[styles.statusIcon, statusUI.iconStyle]}>
            {statusUI.iconType === "success" ? (
              <CheckCircle2 color="#111111" size={36} />
            ) : statusUI.iconType === "pending" ? (
              <Clock color="#111111" size={34} />
            ) : (
              <XCircle color="#111111" size={34} />
            )}
          </View>

          <Text style={styles.kicker}>
            {isPaid
              ? isId
                ? "PEMBAYARAN DITERIMA"
                : "PAYMENT RECEIVED"
              : isId
                ? "STATUS PEMBAYARAN"
                : "PAYMENT STATUS"}
          </Text>

          <Text style={styles.title}>{statusUI.title}</Text>
          <Text style={styles.subtitle}>{content.description}</Text>
        </View>

        {loading ? (
          <View style={styles.sectionCard}>
            <ActivityIndicator color="#e6c15c" />
            <Text style={styles.centerText}>{t.loadingPayment}</Text>
          </View>
        ) : null}

        {!loading && errorMessage ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        ) : null}

        {!loading && !errorMessage && payment ? (
          <View style={styles.sectionCard}>
            <SectionHeader
              icon={<ReceiptText color="#e6c15c" size={21} />}
              title={isId ? "Detail Pembayaran" : "Payment Details"}
            />

            <InfoRow
              label={t.statusLabel}
              value={isPaid ? (isId ? "berhasil" : "success") : resolvedStatus}
            />
            <InfoRow label={t.packageLabel} value={packageName || "-"} />
            <InfoRow
              label={t.billingLabel}
              value={humanizeBillingCycle(billingCycle, isId)}
            />

            {listingLimit > 0 ? (
              <InfoRow
                label={isId ? "Limit Listing Aktif" : "Active Listing Limit"}
                value={`${listingLimit} ${
                  isId ? "listing aktif" : "active listings"
                }`}
              />
            ) : null}

            <InfoRow
              label={t.amountLabel}
              value={formatCurrency(payment.amount_total, payment.currency, locale)}
            />
            <InfoRow label={t.methodLabel} value={methodText} />
            <InfoRow
              label={t.createdLabel}
              value={formatDate(payment.created_at, locale)}
            />

            {payment.paid_at ? (
              <InfoRow
                label={t.paidAtLabel}
                value={formatDate(payment.paid_at, locale)}
              />
            ) : null}

            {membership?.starts_at ? (
              <InfoRow
                label={t.activeFromLabel}
                value={formatDate(membership.starts_at, locale)}
              />
            ) : null}

            {membership?.expires_at ? (
              <InfoRow
                label={t.expiresAtLabel}
                value={formatDate(membership.expires_at, locale)}
              />
            ) : null}
          </View>
        ) : null}

        {content.points?.length ? (
          <View style={styles.sectionCard}>
            <SectionHeader
              icon={<ShieldCheck color="#e6c15c" size={21} />}
              title={t.detailsTitle}
            />

            {content.points.map((point, index) => (
              <StepText key={`${point}-${index}`} text={point} />
            ))}
          </View>
        ) : null}

        {!loading && !errorMessage && payment && isPaid ? (
          <View style={styles.receiptRow}>
            <Pressable style={styles.linkButton} onPress={openReceipt}>
              <FileText color="#ffffff" size={15} />
              <Text style={styles.linkButtonText}>{t.receiptButton}</Text>
            </Pressable>

            {payment.receipt_url ? (
              <Pressable
                style={styles.linkButton}
                onPress={() => void Linking.openURL(payment.receipt_url || "")}
              >
                <ExternalLink color="#ffffff" size={15} />
                <Text style={styles.linkButtonText}>{t.receiptButton}</Text>
              </Pressable>
            ) : null}

            {payment.hosted_invoice_url ? (
              <Pressable
                style={styles.linkButton}
                onPress={() =>
                  void Linking.openURL(payment.hosted_invoice_url || "")
                }
              >
                <ExternalLink color="#ffffff" size={15} />
                <Text style={styles.linkButtonText}>{t.invoiceButton}</Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}

        {isPaid ? (
          <View style={styles.actionsCard}>
            <Pressable style={styles.primaryButton} onPress={openAgentDashboard}>
              <Home color="#111111" size={17} />
              <Text style={styles.primaryButtonText}>
                {t.toAgentDashboard}
              </Text>
            </Pressable>

            <Pressable style={styles.secondaryButton} onPress={createListing}>
              <PackageCheck color="#ffffff" size={16} />
              <Text style={styles.secondaryButtonText}>{t.createListing}</Text>
            </Pressable>

            <Pressable style={styles.secondaryButton} onPress={openPayments}>
              <FileText color="#ffffff" size={16} />
              <Text style={styles.secondaryButtonText}>{t.toPayments}</Text>
            </Pressable>

            <Pressable style={styles.secondaryButton} onPress={openPackages}>
              <RotateCcw color="#ffffff" size={16} />
              <Text style={styles.secondaryButtonText}>{t.choosePackage}</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.actionsCard}>
            {shouldShowContinuePayment ? (
              <Pressable
                style={styles.primaryButton}
                onPress={() => void Linking.openURL(payment?.checkout_url || "")}
              >
                <ExternalLink color="#111111" size={17} />
                <Text style={styles.primaryButtonText}>
                  {t.continuePayment}
                </Text>
              </Pressable>
            ) : (
              <Pressable style={styles.primaryButton} onPress={openPackages}>
                <PackageCheck color="#111111" size={17} />
                <Text style={styles.primaryButtonText}>{t.choosePackage}</Text>
              </Pressable>
            )}

            <Pressable style={styles.secondaryButton} onPress={openAgentDashboard}>
              <ShieldCheck color="#ffffff" size={16} />
              <Text style={styles.secondaryButtonText}>
                {t.toAgentDashboard}
              </Text>
            </Pressable>

            <Pressable style={styles.secondaryButton} onPress={openPayments}>
              <FileText color="#ffffff" size={16} />
              <Text style={styles.secondaryButtonText}>{t.toPayments}</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

async function loadMembershipForPayment({
  userId,
  paymentId,
}: {
  userId: string;
  paymentId: string;
}) {
  const { data: exactMembership } = await supabase
    .from("agent_memberships")
    .select(
      "id, user_id, payment_id, package_id, package_name, billing_cycle, status, starts_at, expires_at, metadata"
    )
    .eq("user_id", userId)
    .eq("payment_id", paymentId)
    .maybeSingle();

  if (exactMembership) {
    return exactMembership as AgentMembershipRow;
  }

  const { data: activeMembership } = await supabase
    .from("agent_memberships")
    .select(
      "id, user_id, payment_id, package_id, package_name, billing_cycle, status, starts_at, expires_at, metadata"
    )
    .eq("user_id", userId)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return (activeMembership as AgentMembershipRow | null) ?? null;
}

function SectionHeader({ icon, title }: { icon: ReactNode; title: string }) {
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionIcon}>{icon}</View>
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

function StepText({ text }: { text: string }) {
  return (
    <View style={styles.stepRow}>
      <View style={styles.stepCheck}>
        <Text style={styles.stepCheckText}>✓</Text>
      </View>
      <Text style={styles.stepText}>{text}</Text>
    </View>
  );
}

function asObject(value: unknown): Record<string, any> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, any>)
    : {};
}

function readParam(value: unknown) {
  if (Array.isArray(value)) return String(value[0] || "");
  return String(value || "");
}

function normalizeStatus(value?: string | null): PaymentStatus {
  const v = String(value || "").toLowerCase();

  if (
    v === "checkout_created" ||
    v === "paid" ||
    v === "failed" ||
    v === "expired" ||
    v === "canceled" ||
    v === "cancelled" ||
    v === "refunded" ||
    v === "partially_refunded"
  ) {
    return v as PaymentStatus;
  }

  return "pending";
}

function formatCurrency(
  amount: number | null | undefined,
  currency: string | null | undefined,
  locale: string
) {
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: (currency || "IDR").toUpperCase(),
      maximumFractionDigits: 0,
    }).format(amount || 0);
  } catch {
    return `Rp ${(amount || 0).toLocaleString("id-ID")}`;
  }
}

function formatDate(value: string | null | undefined, locale: string) {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function humanizeBillingCycle(value: string | null | undefined, isId: boolean) {
  const v = String(value || "").toLowerCase();

  if (v === "monthly") return isId ? "Bulanan" : "Monthly";
  if (v === "yearly") return isId ? "Tahunan" : "Yearly";

  return value || "-";
}

function humanizePaymentMethod(payment: PaymentRow | null, isId: boolean) {
  const metadata = asObject(payment?.metadata);
  const qrisMeta = asObject(metadata.hitpay);

  const gateway = String(
    metadata.gateway || metadata.payment_gateway || qrisMeta.gateway || ""
  ).toLowerCase();

  const method = String(
    metadata.paymentMethod ||
      metadata.payment_method ||
      qrisMeta.payment_method ||
      qrisMeta.paymentMethod ||
      ""
  ).toLowerCase();

  const hasQrisReference = Boolean(
    metadata.hitpay_payment_request_id ||
      metadata.hitpay_reference_number ||
      qrisMeta.payment_request_id ||
      qrisMeta.reference_number ||
      qrisMeta.payment_id
  );

  if (method === "qris" || gateway === "hitpay" || hasQrisReference) {
    return isId ? "Dibayar dengan QRIS" : "Paid by QRIS";
  }

  return "Debit / Credit Card";
}

function getStateUI({
  status,
  isPaid,
  isId,
  t,
}: {
  status: PaymentStatus;
  isPaid: boolean;
  isId: boolean;
  t: any;
}) {
  if (isPaid) {
    return {
      title: isId ? t.membershipActive : t.membershipActive,
      iconType: "success" as const,
      heroStyle: styles.heroSuccess,
      iconStyle: styles.statusIconSuccess,
    };
  }

  if (status === "pending" || status === "checkout_created") {
    return {
      title: t.pendingTitle,
      iconType: "pending" as const,
      heroStyle: styles.heroWarning,
      iconStyle: styles.statusIconWarning,
    };
  }

  if (status === "expired") {
    return {
      title: t.expiredTitle,
      iconType: "error" as const,
      heroStyle: styles.heroWarning,
      iconStyle: styles.statusIconWarning,
    };
  }

  if (status === "cancelled" || status === "canceled") {
    return {
      title: t.cancelledTitle,
      iconType: "error" as const,
      heroStyle: styles.heroNeutral,
      iconStyle: styles.statusIconNeutral,
    };
  }

  if (status === "refunded" || status === "partially_refunded") {
    return {
      title: t.refundedTitle,
      iconType: "pending" as const,
      heroStyle: styles.heroInfo,
      iconStyle: styles.statusIconInfo,
    };
  }

  return {
    title: t.failedTitle,
    iconType: "error" as const,
    heroStyle: styles.heroError,
    iconStyle: styles.statusIconError,
  };
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
    fontSize: 10,
    fontWeight: "900",
  },
  langTextActive: {
    color: "#111111",
  },
  content: {
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 38,
  },
  heroCard: {
    borderRadius: 30,
    borderWidth: 1,
    padding: 20,
    alignItems: "center",
    marginBottom: 13,
  },
  heroSuccess: {
    borderColor: "#166534",
    backgroundColor: "#052e16",
  },
  heroWarning: {
    borderColor: "#705d2c",
    backgroundColor: "#211a0b",
  },
  heroNeutral: {
    borderColor: "#343434",
    backgroundColor: "#101010",
  },
  heroInfo: {
    borderColor: "#1d4ed8",
    backgroundColor: "#0b1624",
  },
  heroError: {
    borderColor: "#7f1d1d",
    backgroundColor: "#2a0d0d",
  },
  statusIcon: {
    width: 74,
    height: 74,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  statusIconSuccess: {
    backgroundColor: "#22c55e",
  },
  statusIconWarning: {
    backgroundColor: "#e6c15c",
  },
  statusIconNeutral: {
    backgroundColor: "#d4d4d4",
  },
  statusIconInfo: {
    backgroundColor: "#60a5fa",
  },
  statusIconError: {
    backgroundColor: "#f87171",
  },
  kicker: {
    color: "#e6c15c",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.2,
  },
  title: {
    color: "#ffffff",
    fontSize: 25,
    lineHeight: 31,
    fontWeight: "900",
    textAlign: "center",
    marginTop: 7,
  },
  subtitle: {
    color: "#d6d6d6",
    fontSize: 12.5,
    lineHeight: 19,
    fontWeight: "700",
    textAlign: "center",
    marginTop: 9,
  },
  sectionCard: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#303030",
    backgroundColor: "#101010",
    padding: 15,
    marginBottom: 13,
  },
  centerText: {
    color: "#d6d6d6",
    fontSize: 12,
    fontWeight: "800",
    textAlign: "center",
    marginTop: 10,
  },
  errorBox: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#7f1d1d",
    backgroundColor: "#2a0d0d",
    padding: 14,
    marginBottom: 13,
  },
  errorText: {
    color: "#fecaca",
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "800",
    textAlign: "center",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    marginBottom: 14,
  },
  sectionIcon: {
    width: 42,
    height: 42,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#705d2c",
    backgroundColor: "#211a0b",
    alignItems: "center",
    justifyContent: "center",
  },
  sectionTitle: {
    color: "#ffffff",
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "900",
    flex: 1,
  },
  infoRow: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#303030",
    backgroundColor: "#050505",
    padding: 12,
    marginBottom: 9,
  },
  infoLabel: {
    color: "#a9a9a9",
    fontSize: 11,
    fontWeight: "800",
  },
  infoValue: {
    color: "#ffffff",
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "900",
    marginTop: 4,
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginBottom: 10,
  },
  stepCheck: {
    width: 24,
    height: 24,
    borderRadius: 999,
    backgroundColor: "#22c55e",
    alignItems: "center",
    justifyContent: "center",
  },
  stepCheckText: {
    color: "#111111",
    fontSize: 12,
    fontWeight: "900",
  },
  stepText: {
    color: "#d6d6d6",
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "700",
    flex: 1,
  },
  receiptRow: {
    gap: 10,
    marginBottom: 13,
  },
  linkButton: {
    minHeight: 47,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#343434",
    backgroundColor: "#101010",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    paddingHorizontal: 14,
  },
  linkButtonText: {
    color: "#ffffff",
    fontSize: 12.5,
    fontWeight: "900",
  },
  actionsCard: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#303030",
    backgroundColor: "#101010",
    padding: 15,
    gap: 10,
  },
  primaryButton: {
    minHeight: 50,
    borderRadius: 17,
    backgroundColor: "#e6c15c",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 14,
  },
  primaryButtonText: {
    color: "#111111",
    fontSize: 13,
    fontWeight: "900",
  },
  secondaryButton: {
    minHeight: 48,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: "#343434",
    backgroundColor: "#050505",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    paddingHorizontal: 14,
  },
  secondaryButtonText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "900",
  },
});