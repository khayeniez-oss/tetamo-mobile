import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  CreditCard,
  ExternalLink,
  FileText,
  PackageCheck,
  QrCode,
  Receipt,
  ShieldCheck,
  XCircle,
} from "lucide-react-native";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { supabase } from "../../../lib/supabase";

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
  audience_snapshot: string | null;
  status: string | null;
  currency: string | null;
  amount_subtotal: number | null;
  amount_discount: number | null;
  amount_tax: number | null;
  amount_total: number | null;
  description: string | null;
  plan_name: string | null;
  duration_days: number | null;
  property_title_snapshot: string | null;
  property_code_snapshot: string | null;
  customer_name: string | null;
  customer_email: string | null;
  customer_phone: string | null;
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

  if (status === "checkout_created" || status === "pending" || status === "initiated") {
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

function getPaymentMetaInfo(payment: PaymentRow | null) {
  const metadata = asObject(payment?.metadata);
  const hitpay = asObject(metadata.hitpay);

  const gateway = String(
    metadata.gateway ||
      metadata.payment_gateway ||
      hitpay.gateway ||
      ""
  ).toLowerCase();

  const method = String(
    metadata.paymentMethod ||
      metadata.payment_method ||
      hitpay.paymentMethod ||
      hitpay.payment_method ||
      ""
  ).toLowerCase();

  const qrisReference = String(
    metadata.hitpay_reference_number ||
      metadata.hitpay_payment_request_id ||
      hitpay.reference_number ||
      hitpay.payment_request_id ||
      hitpay.payment_id ||
      ""
  ).trim();

  const isQris = Boolean(
    method === "qris" ||
      gateway === "hitpay" ||
      metadata.hitpay_payment_request_id ||
      metadata.hitpay_reference_number ||
      hitpay.payment_request_id ||
      hitpay.reference_number ||
      hitpay.payment_id
  );

  return {
    isQris,
    qrisReference,
  };
}

function getPaymentMethod(payment: PaymentRow | null, language: Language) {
  const info = getPaymentMetaInfo(payment);

  if (info.isQris) {
    return language === "id" ? "Dibayar dengan QRIS" : "Paid by QRIS";
  }

  return "Debit / Credit Card";
}

function getReference(payment: PaymentRow | null) {
  const info = getPaymentMetaInfo(payment);

  if (info.qrisReference) return info.qrisReference;
  if (payment?.stripe_checkout_session_id) return payment.stripe_checkout_session_id;
  if (payment?.stripe_payment_intent_id) return payment.stripe_payment_intent_id;
  if (payment?.stripe_charge_id) return payment.stripe_charge_id;

  if (!payment?.id) return "-";
  return `PAY-${payment.id.slice(0, 8).toUpperCase()}`;
}

function getReceiptNumber(payment: PaymentRow | null) {
  if (!payment?.id) return "-";
  return `RCT-${payment.id.slice(0, 8).toUpperCase()}`;
}

function getInvoiceNumber(payment: PaymentRow | null) {
  if (
    payment?.stripe_invoice_id ||
    payment?.hosted_invoice_url ||
    payment?.invoice_pdf_url
  ) {
    return `INV-${payment.id.slice(0, 8).toUpperCase()}`;
  }

  return "-";
}

function getInvoiceUrl(payment: PaymentRow | null) {
  return payment?.hosted_invoice_url || payment?.invoice_pdf_url || "";
}

function getGatewayReceiptUrl(payment: PaymentRow | null) {
  return payment?.receipt_url || getInvoiceUrl(payment);
}

function getTitle(payment: PaymentRow | null, membership: AgentMembershipRow | null, language: Language) {
  const paymentType = String(payment?.payment_type || "").toLowerCase();

  if (payment?.description) return payment.description;
  if (payment?.property_title_snapshot) return payment.property_title_snapshot;
  if (membership?.package_name) return membership.package_name;
  if (payment?.product_name_snapshot) return payment.product_name_snapshot;
  if (payment?.plan_name) return payment.plan_name;

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

function getPaymentType(payment: PaymentRow | null, language: Language) {
  const paymentType = String(payment?.payment_type || "").toLowerCase();
  const productType = String(payment?.product_type || "").toLowerCase();

  if (paymentType === "package" || productType === "membership") {
    return language === "id" ? "Membership" : "Membership";
  }

  if (paymentType === "listing_fee") {
    return language === "id" ? "Listing" : "Listing";
  }

  if (paymentType === "boost") return "Boost";
  if (paymentType === "spotlight") return "Spotlight";
  if (paymentType === "education") return "Education";

  return cleanText(payment?.payment_type || payment?.product_type || "Payment");
}

function getBillingCycle(payment: PaymentRow | null, membership: AgentMembershipRow | null, language: Language) {
  const metadata = asObject(payment?.metadata);

  const raw = String(
    membership?.billing_cycle ||
      metadata.selectedBillingCycle ||
      metadata.selected_billing_cycle ||
      metadata.billingCycle ||
      metadata.billing_cycle ||
      ""
  ).toLowerCase();

  if (raw === "monthly") return language === "id" ? "Bulanan" : "Monthly";
  if (raw === "yearly") return language === "id" ? "Tahunan" : "Yearly";

  const paymentType = String(payment?.payment_type || "").toLowerCase();

  if (paymentType === "boost" || paymentType === "spotlight") return "Add-On";
  if (paymentType === "education") return "Education";

  return "-";
}

function getListingLimit(payment: PaymentRow | null, membership: AgentMembershipRow | null) {
  const metadata = asObject(payment?.metadata);
  const activation = asObject(metadata.activation);

  const value =
    Number(membership?.listing_limit || 0) ||
    Number(metadata.listingLimit || 0) ||
    Number(metadata.activeListingLimit || 0) ||
    Number(metadata.listing_limit || 0) ||
    Number(metadata.active_listing_limit || 0) ||
    Number(activation.listingLimit || 0);

  return Number.isFinite(value) && value > 0 ? String(value) : "-";
}

function getExpiryDate(payment: PaymentRow | null, membership: AgentMembershipRow | null, language: Language) {
  const metadata = asObject(payment?.metadata);
  const activation = asObject(metadata.activation);

  return formatDateTime(
    membership?.expires_at ||
      activation.expiresAt ||
      activation.endsAt ||
      metadata.expires_at ||
      payment?.checkout_expires_at ||
      null,
    language
  );
}

function getStatusUI(status: NormalizedStatus, language: Language) {
  if (status === "paid") {
    return {
      label: "PAID",
      icon: <CheckCircle2 color="#22c55e" size={17} />,
      color: "#22c55e",
      bg: "#052e16",
      border: "#166534",
    };
  }

  if (status === "pending") {
    return {
      label: "PENDING",
      icon: <Clock3 color="#e6c15c" size={17} />,
      color: "#e6c15c",
      bg: "#211a0b",
      border: "#705d2c",
    };
  }

  if (status === "unpaid") {
    return {
      label: "UNPAID",
      icon: <Clock3 color="#e6c15c" size={17} />,
      color: "#e6c15c",
      bg: "#211a0b",
      border: "#705d2c",
    };
  }

  if (status === "refunded") {
    return {
      label: "REFUNDED",
      icon: <ShieldCheck color="#38bdf8" size={17} />,
      color: "#38bdf8",
      bg: "#082f49",
      border: "#0369a1",
    };
  }

  if (status === "expired") {
    return {
      label: "EXPIRED",
      icon: <Clock3 color="#fb923c" size={17} />,
      color: "#fb923c",
      bg: "#2a1608",
      border: "#9a3412",
    };
  }

  if (status === "cancelled") {
    return {
      label: "CANCELLED",
      icon: <XCircle color="#a9a9a9" size={17} />,
      color: "#a9a9a9",
      bg: "#171717",
      border: "#333333",
    };
  }

  return {
    label: "FAILED",
    icon: <XCircle color="#f87171" size={17} />,
    color: "#f87171",
    bg: "#2a0d0d",
    border: "#7f1d1d",
  };
}

function shouldShowPayNow(status: NormalizedStatus, payment: PaymentRow | null) {
  if (!payment?.checkout_url) return false;
  if (status === "paid") return false;
  if (status === "refunded") return false;

  return (
    status === "pending" ||
    status === "unpaid" ||
    status === "failed" ||
    status === "expired" ||
    status === "cancelled"
  );
}

export default function DashboardReceiptScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const [language, setLanguage] = useState<Language>("en");
  const [payment, setPayment] = useState<PaymentRow | null>(null);
  const [membership, setMembership] = useState<AgentMembershipRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const paymentId = useMemo(() => {
    const raw = params.id;
    if (Array.isArray(raw)) return String(raw[0] || "");
    return String(raw || "");
  }, [params.id]);

  const isId = language === "id";

  const ui = useMemo(() => {
    if (isId) {
      return {
        back: "Kembali",
        loading: "Memuat receipt...",
        notFound: "Receipt tidak ditemukan.",
        title: "Receipt",
        company: "Tetamo Pty Ltd",
        receivedFrom: "Diterima Dari",
        paymentInfo: "Informasi Pembayaran",
        productInfo: "Detail Produk",
        amountSummary: "Ringkasan Amount",
        receiptNo: "Receipt No.",
        invoiceNo: "Invoice No.",
        reference: "Reference",
        status: "Status",
        method: "Metode Pembayaran",
        type: "Jenis",
        role: "Role",
        listingCode: "Kode Listing",
        packageName: "Paket",
        billingCycle: "Billing",
        listingLimit: "Limit Listing",
        createdAt: "Dibuat",
        paidAt: "Dibayar",
        expiresAt: "Expired",
        subtotal: "Subtotal",
        discount: "Diskon",
        tax: "Pajak",
        total: "Total",
        openGatewayReceipt: "Buka Receipt Gateway",
        openInvoice: "Buka Invoice",
        payNow: "Pay Now",
      };
    }

    return {
      back: "Back",
      loading: "Loading receipt...",
      notFound: "Receipt not found.",
      title: "Receipt",
      company: "Tetamo Pty Ltd",
      receivedFrom: "Received From",
      paymentInfo: "Payment Information",
      productInfo: "Product Details",
      amountSummary: "Amount Summary",
      receiptNo: "Receipt No.",
      invoiceNo: "Invoice No.",
      reference: "Reference",
      status: "Status",
      method: "Payment Method",
      type: "Type",
      role: "Role",
      listingCode: "Listing Code",
      packageName: "Package",
      billingCycle: "Billing",
      listingLimit: "Listing Limit",
      createdAt: "Created",
      paidAt: "Paid At",
      expiresAt: "Expires",
      subtotal: "Subtotal",
      discount: "Discount",
      tax: "Tax",
      total: "Total",
      openGatewayReceipt: "Open Gateway Receipt",
      openInvoice: "Open Invoice",
      payNow: "Pay Now",
    };
  }, [isId]);

  useEffect(() => {
    let ignore = false;

    async function loadReceipt() {
      if (!paymentId) {
        setErrorMessage(ui.notFound);
        setLoading(false);
        return;
      }

      setLoading(true);
      setErrorMessage("");

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (ignore) return;

      if (userError || !user) {
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
            audience_snapshot,
            status,
            currency,
            amount_subtotal,
            amount_discount,
            amount_tax,
            amount_total,
            description,
            plan_name,
            duration_days,
            property_title_snapshot,
            property_code_snapshot,
            customer_name,
            customer_email,
            customer_phone,
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
          `
        )
        .eq("id", paymentId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (ignore) return;

      if (error || !data) {
        setPayment(null);
        setMembership(null);
        setErrorMessage(error?.message || ui.notFound);
        setLoading(false);
        return;
      }

      const paymentRow = data as PaymentRow;
      setPayment(paymentRow);

      if (String(paymentRow.source_role || "").toLowerCase() === "agent") {
        const { data: membershipData } = await supabase
          .from("agent_memberships")
          .select(
            `
              id,
              user_id,
              payment_id,
              package_id,
              package_name,
              billing_cycle,
              listing_limit,
              status,
              auto_renew,
              starts_at,
              expires_at,
              metadata,
              created_at,
              updated_at
            `
          )
          .eq("payment_id", paymentRow.id)
          .eq("user_id", user.id)
          .maybeSingle();

        if (!ignore) {
          setMembership((membershipData as AgentMembershipRow) || null);
        }
      } else {
        setMembership(null);
      }

      setLoading(false);
    }

    void loadReceipt();

    return () => {
      ignore = true;
    };
  }, [paymentId, router, ui.notFound]);

  const status = normalizeStatus(payment?.status);
  const statusUI = getStatusUI(status, language);
  const gatewayReceiptUrl = getGatewayReceiptUrl(payment);
  const invoiceUrl = getInvoiceUrl(payment);
  const showPayNow = shouldShowPayNow(status, payment);

  async function openUrl(url?: string | null) {
    if (!url) return;
    await Linking.openURL(url);
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="light" />

        <View style={styles.loadingBox}>
          <ActivityIndicator color="#e6c15c" />
          <Text style={styles.loadingText}>{ui.loading}</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (errorMessage || !payment) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="light" />

        <View style={styles.errorWrap}>
          <XCircle color="#fecaca" size={28} />
          <Text style={styles.errorTitle}>{ui.notFound}</Text>
          <Text style={styles.errorText}>{errorMessage || ui.notFound}</Text>

          <Pressable style={styles.goldButton} onPress={() => router.back()}>
            <ArrowLeft color="#111111" size={15} />
            <Text style={styles.goldButtonText}>{ui.back}</Text>
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
      >
        <View style={styles.receiptCard}>
          <View style={styles.receiptHeader}>
            <View style={styles.brandBox}>
              <View style={styles.logoCircle}>
                <Text style={styles.logoText}>T</Text>
              </View>

              <View style={styles.brandTextBox}>
                <Text style={styles.companyName}>{ui.company}</Text>
                <Text style={styles.companySub}>ABN 18 689 780 970</Text>
                <Text style={styles.companySub}>
                  Suite 809 168 Kent Street Sydney NSW 2000
                </Text>
                <Text style={styles.companySub}>www.tetamo.com</Text>
              </View>
            </View>

            <View style={styles.receiptTitleBox}>
              <Text style={styles.receiptTitle}>{ui.title}</Text>
              <Text style={styles.receiptNumber}>
                {getReceiptNumber(payment)}
              </Text>

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
          </View>

          <View style={styles.divider} />

          <Text style={styles.sectionTitle}>{ui.receivedFrom}</Text>

          <View style={styles.infoGrid}>
            <InfoItem
              label={isId ? "Nama" : "Name"}
              value={cleanText(payment.customer_name || payment.customer_email)}
            />
            <InfoItem label="Email" value={cleanText(payment.customer_email)} />
            <InfoItem
              label={isId ? "Telepon" : "Phone"}
              value={cleanText(payment.customer_phone)}
            />
          </View>

          <Text style={styles.sectionTitle}>{ui.paymentInfo}</Text>

          <View style={styles.infoGrid}>
            <InfoItem label={ui.receiptNo} value={getReceiptNumber(payment)} />
            <InfoItem label={ui.invoiceNo} value={getInvoiceNumber(payment)} />
            <InfoItem label={ui.reference} value={getReference(payment)} />
            <InfoItem label={ui.status} value={statusUI.label} />
            <InfoItem
              label={ui.method}
              value={getPaymentMethod(payment, language)}
              icon={
                getPaymentMetaInfo(payment).isQris ? (
                  <QrCode color="#e6c15c" size={14} />
                ) : (
                  <CreditCard color="#e6c15c" size={14} />
                )
              }
            />
            <InfoItem
              label={ui.role}
              value={cleanText(payment.source_role).toUpperCase()}
            />
            <InfoItem
              label={ui.createdAt}
              value={formatDateTime(payment.created_at, language)}
            />
            <InfoItem
              label={ui.paidAt}
              value={formatDateTime(payment.paid_at, language)}
            />
          </View>

          <Text style={styles.sectionTitle}>{ui.productInfo}</Text>

          <View style={styles.productBox}>
            <View style={styles.productIcon}>
              <PackageCheck color="#e6c15c" size={20} />
            </View>

            <View style={styles.productTextBox}>
              <Text style={styles.productTitle}>
                {getTitle(payment, membership, language)}
              </Text>
              <Text style={styles.productSub}>
                {getPaymentType(payment, language)}
              </Text>
            </View>
          </View>

          <View style={styles.infoGrid}>
            <InfoItem
              label={ui.listingCode}
              value={cleanText(payment.property_code_snapshot)}
            />
            <InfoItem
              label={ui.packageName}
              value={cleanText(
                membership?.package_name ||
                  payment.product_name_snapshot ||
                  payment.plan_name ||
                  payment.product_id
              )}
            />
            <InfoItem
              label={ui.billingCycle}
              value={getBillingCycle(payment, membership, language)}
            />
            <InfoItem
              label={ui.listingLimit}
              value={getListingLimit(payment, membership)}
            />
            <InfoItem
              label={ui.expiresAt}
              value={getExpiryDate(payment, membership, language)}
            />
          </View>

          <Text style={styles.sectionTitle}>{ui.amountSummary}</Text>

          <View style={styles.amountBox}>
            <AmountRow
              label={ui.subtotal}
              value={formatAmount(
                payment.amount_subtotal ?? payment.amount_total ?? 0,
                payment.currency
              )}
            />
            <AmountRow
              label={ui.discount}
              value={formatAmount(payment.amount_discount ?? 0, payment.currency)}
            />
            <AmountRow
              label={ui.tax}
              value={formatAmount(payment.amount_tax ?? 0, payment.currency)}
            />

            <View style={styles.amountDivider} />

            <AmountRow
              label={ui.total}
              value={formatAmount(
                payment.amount_total ?? payment.amount_subtotal ?? 0,
                payment.currency
              )}
              total
            />
          </View>

          <View style={styles.actionRow}>
            {gatewayReceiptUrl ? (
              <Pressable
                style={styles.darkButton}
                onPress={() => void openUrl(gatewayReceiptUrl)}
              >
                <Receipt color="#ffffff" size={15} />
                <Text style={styles.darkButtonText}>
                  {ui.openGatewayReceipt}
                </Text>
                <ExternalLink color="#ffffff" size={13} />
              </Pressable>
            ) : null}

            {invoiceUrl ? (
              <Pressable
                style={styles.darkButton}
                onPress={() => void openUrl(invoiceUrl)}
              >
                <FileText color="#ffffff" size={15} />
                <Text style={styles.darkButtonText}>{ui.openInvoice}</Text>
                <ExternalLink color="#ffffff" size={13} />
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
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoItem({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
}) {
  return (
    <View style={styles.infoItem}>
      <Text style={styles.infoLabel}>{label}</Text>

      <View style={styles.infoValueRow}>
        {icon}
        <Text style={styles.infoValue} numberOfLines={3}>
          {value}
        </Text>
      </View>
    </View>
  );
}

function AmountRow({
  label,
  value,
  total,
}: {
  label: string;
  value: string;
  total?: boolean;
}) {
  return (
    <View style={styles.amountRow}>
      <Text style={[styles.amountLabel, total && styles.amountLabelTotal]}>
        {label}
      </Text>
      <Text style={[styles.amountValue, total && styles.amountValueTotal]}>
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
  errorWrap: {
    flex: 1,
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  errorTitle: {
    color: "#ffffff",
    fontSize: 20,
    fontWeight: "900",
    textAlign: "center",
  },
  errorText: {
    color: "#fecaca",
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "700",
    textAlign: "center",
  },
  receiptCard: {
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "#303030",
    backgroundColor: "#101010",
    padding: 16,
  },
  receiptHeader: {
    gap: 18,
  },
  brandBox: {
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-start",
  },
  logoCircle: {
    width: 54,
    height: 54,
    borderRadius: 20,
    backgroundColor: "#e6c15c",
    alignItems: "center",
    justifyContent: "center",
  },
  logoText: {
    color: "#111111",
    fontSize: 23,
    fontWeight: "900",
  },
  brandTextBox: {
    flex: 1,
  },
  companyName: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "900",
  },
  companySub: {
    color: "#a9a9a9",
    fontSize: 10.5,
    lineHeight: 15,
    fontWeight: "700",
    marginTop: 2,
  },
  receiptTitleBox: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#252525",
    backgroundColor: "#050505",
    padding: 14,
  },
  receiptTitle: {
    color: "#ffffff",
    fontSize: 25,
    fontWeight: "900",
  },
  receiptNumber: {
    color: "#a9a9a9",
    fontSize: 12,
    fontWeight: "800",
    marginTop: 4,
  },
  statusPill: {
    alignSelf: "flex-start",
    marginTop: 10,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 7,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  statusText: {
    fontSize: 10.5,
    fontWeight: "900",
  },
  divider: {
    height: 1,
    backgroundColor: "#252525",
    marginVertical: 16,
  },
  sectionTitle: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "900",
    marginBottom: 10,
    marginTop: 4,
  },
  infoGrid: {
    gap: 9,
    marginBottom: 14,
  },
  infoItem: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#252525",
    backgroundColor: "#050505",
    padding: 10,
  },
  infoLabel: {
    color: "#777777",
    fontSize: 10,
    fontWeight: "800",
  },
  infoValueRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
  },
  infoValue: {
    color: "#ffffff",
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "900",
    flex: 1,
  },
  productBox: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#5b4a24",
    backgroundColor: "#211a0b",
    padding: 12,
    flexDirection: "row",
    gap: 11,
    alignItems: "center",
    marginBottom: 11,
  },
  productIcon: {
    width: 42,
    height: 42,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#705d2c",
    backgroundColor: "#151106",
    alignItems: "center",
    justifyContent: "center",
  },
  productTextBox: {
    flex: 1,
  },
  productTitle: {
    color: "#ffffff",
    fontSize: 13.5,
    lineHeight: 18,
    fontWeight: "900",
  },
  productSub: {
    color: "#c9b56b",
    fontSize: 11,
    fontWeight: "800",
    marginTop: 3,
  },
  amountBox: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#303030",
    backgroundColor: "#050505",
    padding: 12,
    marginBottom: 15,
  },
  amountRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    paddingVertical: 6,
  },
  amountLabel: {
    color: "#a9a9a9",
    fontSize: 11.5,
    fontWeight: "800",
  },
  amountValue: {
    color: "#ffffff",
    fontSize: 11.5,
    fontWeight: "900",
    textAlign: "right",
  },
  amountDivider: {
    height: 1,
    backgroundColor: "#252525",
    marginVertical: 6,
  },
  amountLabelTotal: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "900",
  },
  amountValueTotal: {
    color: "#e6c15c",
    fontSize: 15,
    fontWeight: "900",
  },
  actionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 9,
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