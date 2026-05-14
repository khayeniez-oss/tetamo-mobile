import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
    ArrowLeft,
    CalendarDays,
    CheckCircle2,
    Clock3,
    CreditCard,
    FileText,
    Languages,
    ReceiptText,
    ShieldCheck,
} from "lucide-react-native";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Pressable,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { supabase } from "../../../lib/supabase";

type Language = "en" | "id";

type PaymentStatus =
  | "initiated"
  | "pending"
  | "checkout_created"
  | "succeeded"
  | "failed"
  | "expired"
  | "refunded"
  | "partially_refunded"
  | "completed"
  | "paid"
  | "settled"
  | "active"
  | "canceled"
  | "cancelled"
  | null;

type PaymentTransactionRow = {
  id: string;
  user_id: string | null;
  property_id: string | null;
  source_role: string | null;
  payment_type: string | null;
  product_id: string | null;
  product_name_snapshot: string | null;
  product_type: string | null;
  audience_snapshot: string | null;
  status: PaymentStatus;
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

function cleanText(value: unknown) {
  const text = String(value || "").trim();
  return text || "-";
}

function sanitizePublicPaymentText(value: unknown) {
  return String(value || "")
    .replace(/stripe/gi, "secure payment")
    .replace(/hitpay/gi, "secure payment")
    .replace(/xendit/gi, "payment provider")
    .trim();
}

function getMetaString(
  metadata: Record<string, any> | null | undefined,
  key: string
) {
  const value = metadata?.[key];
  return typeof value === "string" && value.trim() ? value.trim() : "";
}

function getMetaNumber(
  metadata: Record<string, any> | null | undefined,
  key: string
) {
  const value = metadata?.[key];

  if (typeof value === "number" && Number.isFinite(value)) return value;

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function getNestedMetaString(
  metadata: Record<string, any> | null | undefined,
  objectKey: string,
  key: string
) {
  const obj = metadata?.[objectKey];

  if (!obj || typeof obj !== "object" || Array.isArray(obj)) return "";

  const value = (obj as Record<string, any>)[key];
  return typeof value === "string" && value.trim() ? value.trim() : "";
}

function getNestedMetaNumber(
  metadata: Record<string, any> | null | undefined,
  objectKey: string,
  key: string
) {
  const obj = metadata?.[objectKey];

  if (!obj || typeof obj !== "object" || Array.isArray(obj)) return 0;

  const value = (obj as Record<string, any>)[key];

  if (typeof value === "number" && Number.isFinite(value)) return value;

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function getPaymentMetaInfo(metadata: Record<string, any> | null | undefined) {
  const meta = asObject(metadata);
  const hitpay = asObject(meta.hitpay);

  const gateway = String(
    meta.gateway || meta.payment_gateway || hitpay.gateway || ""
  ).toLowerCase();

  const method = String(
    meta.paymentMethod ||
      meta.payment_method ||
      hitpay.paymentMethod ||
      hitpay.payment_method ||
      ""
  ).toLowerCase();

  const qrisReference =
    String(
      meta.hitpay_reference_number ||
        meta.hitpay_payment_request_id ||
        hitpay.reference_number ||
        hitpay.payment_request_id ||
        hitpay.payment_id ||
        ""
    ).trim() || "";

  const isQris = Boolean(
    method === "qris" ||
      gateway === "hitpay" ||
      meta.hitpay_payment_request_id ||
      meta.hitpay_reference_number ||
      hitpay.payment_request_id ||
      hitpay.reference_number ||
      hitpay.payment_id
  );

  return {
    isQris,
    qrisReference,
  };
}

function formatAmount(
  amount: number | null | undefined,
  currency: string | null | undefined
) {
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

function formatDateTime(value: string | null | undefined, language: Language) {
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

function isPaidStatus(status: PaymentStatus) {
  const value = String(status || "").toLowerCase();

  return (
    value === "paid" ||
    value === "succeeded" ||
    value === "completed" ||
    value === "settled" ||
    value === "active"
  );
}

function getStatusLabel(status: PaymentStatus, language: Language) {
  const value = String(status || "").toLowerCase();

  if (isPaidStatus(status)) return language === "id" ? "LUNAS" : "PAID";

  if (value === "checkout_created") {
    return language === "id" ? "CHECKOUT DIBUAT" : "CHECKOUT CREATED";
  }

  if (value === "failed") return language === "id" ? "GAGAL" : "FAILED";
  if (value === "expired") return language === "id" ? "KEDALUWARSA" : "EXPIRED";

  if (value === "refunded" || value === "partially_refunded") {
    return language === "id" ? "REFUND" : "REFUNDED";
  }

  if (value === "canceled" || value === "cancelled") {
    return language === "id" ? "DIBATALKAN" : "CANCELLED";
  }

  return language === "id" ? "MENUNGGU" : "PENDING";
}

function getReceiptNumber(paymentId: string | null | undefined) {
  if (!paymentId) return "-";
  return `RCT-${paymentId.slice(0, 8).toUpperCase()}`;
}

function getReferenceNumber(payment: PaymentTransactionRow | null) {
  const info = getPaymentMetaInfo(payment?.metadata);

  if (info.qrisReference) return info.qrisReference;
  if (payment?.stripe_checkout_session_id) return payment.stripe_checkout_session_id;
  if (payment?.stripe_payment_intent_id) return payment.stripe_payment_intent_id;
  if (payment?.stripe_charge_id) return payment.stripe_charge_id;

  return payment?.id ? `PAY-${payment.id.slice(0, 8).toUpperCase()}` : "-";
}

function getPaymentMethod(
  payment: PaymentTransactionRow | null,
  language: Language
) {
  const info = getPaymentMetaInfo(payment?.metadata);

  if (info.isQris) {
    return language === "id" ? "Dibayar dengan QRIS" : "Paid by QRIS";
  }

  return "Debit / Credit Card";
}

function getPaymentType(
  payment: PaymentTransactionRow | null,
  language: Language
) {
  const paymentType = String(payment?.payment_type || "").toLowerCase();
  const sourceRole = String(payment?.source_role || "").toLowerCase();

  if (paymentType === "package") {
    if (sourceRole === "agent") {
      return language === "id" ? "Membership Agent" : "Agent Membership";
    }

    return language === "id" ? "Paket Listing" : "Listing Package";
  }

  if (paymentType === "listing_fee") {
    return language === "id" ? "Biaya Listing" : "Listing Fee";
  }

  if (paymentType === "boost") return "Boost Listing";
  if (paymentType === "spotlight") return "Homepage Spotlight";
  if (paymentType === "education") return "Education Pass";
  if (paymentType === "featured") return "Featured Listing";

  return cleanText(payment?.payment_type || payment?.product_type || "Payment");
}

function getPackageName(
  payment: PaymentTransactionRow | null,
  membership: AgentMembershipRow | null
) {
  return cleanText(
    sanitizePublicPaymentText(
      membership?.package_name ||
        getMetaString(payment?.metadata, "packageName") ||
        getMetaString(payment?.metadata, "package_name") ||
        payment?.product_name_snapshot ||
        payment?.plan_name ||
        payment?.product_id ||
        payment?.description
    )
  );
}

function getProductTitle(
  payment: PaymentTransactionRow | null,
  membership: AgentMembershipRow | null,
  language: Language
) {
  const paymentType = String(payment?.payment_type || "").toLowerCase();
  const sourceRole = String(payment?.source_role || "").toLowerCase();

  const direct =
    payment?.description ||
    getMetaString(payment?.metadata, "paymentTitle") ||
    getMetaString(payment?.metadata, "payment_title") ||
    payment?.property_title_snapshot ||
    payment?.product_name_snapshot ||
    membership?.package_name ||
    payment?.plan_name ||
    payment?.product_id;

  if (direct) return cleanText(sanitizePublicPaymentText(direct));

  if (paymentType === "education") return "Education Pass";
  if (paymentType === "boost") return "Boost Listing";
  if (paymentType === "spotlight") return "Homepage Spotlight";

  if (paymentType === "package") {
    if (sourceRole === "agent") {
      return language === "id" ? "Membership Agent" : "Agent Membership";
    }

    return language === "id" ? "Paket Listing Pemilik" : "Owner Listing Package";
  }

  return language === "id" ? "Pembayaran Tetamo" : "Tetamo Payment";
}

function getBillingCycle(
  payment: PaymentTransactionRow | null,
  membership: AgentMembershipRow | null,
  language: Language
) {
  const direct =
    membership?.billing_cycle ||
    getMetaString(payment?.metadata, "selectedBillingCycle") ||
    getMetaString(payment?.metadata, "selected_billing_cycle") ||
    getMetaString(payment?.metadata, "billingCycle") ||
    getMetaString(payment?.metadata, "billing_cycle");

  const value = String(direct || "").toLowerCase();

  if (value === "monthly") return language === "id" ? "Bulanan" : "Monthly";
  if (value === "yearly") return language === "id" ? "Tahunan" : "Yearly";

  const paymentType = String(payment?.payment_type || "").toLowerCase();

  if (paymentType === "boost" || paymentType === "spotlight") return "Add-On";
  if (paymentType === "education") return "Education";
  if (paymentType === "listing_fee") return language === "id" ? "Listing" : "Listing";

  return "-";
}

function getListingLimit(
  payment: PaymentTransactionRow | null,
  membership: AgentMembershipRow | null
) {
  const direct =
    Number(membership?.listing_limit || 0) ||
    getMetaNumber(payment?.metadata, "listingLimit") ||
    getMetaNumber(payment?.metadata, "activeListingLimit") ||
    getMetaNumber(payment?.metadata, "listing_limit") ||
    getMetaNumber(payment?.metadata, "active_listing_limit") ||
    getNestedMetaNumber(payment?.metadata, "activation", "listingLimit");

  return direct > 0 ? String(direct) : "-";
}

function getStartsAt(
  payment: PaymentTransactionRow | null,
  membership: AgentMembershipRow | null
) {
  return (
    membership?.starts_at ||
    getNestedMetaString(payment?.metadata, "activation", "startsAt") ||
    getMetaString(payment?.metadata, "starts_at") ||
    payment?.paid_at ||
    payment?.created_at ||
    null
  );
}

function getExpiryDate(
  payment: PaymentTransactionRow | null,
  membership: AgentMembershipRow | null
) {
  return (
    membership?.expires_at ||
    getNestedMetaString(payment?.metadata, "activation", "expiresAt") ||
    getNestedMetaString(payment?.metadata, "activation", "endsAt") ||
    getMetaString(payment?.metadata, "expires_at") ||
    payment?.checkout_expires_at ||
    payment?.expired_at ||
    null
  );
}

function getRoleLabel(payment: PaymentTransactionRow | null, language: Language) {
  const role = String(payment?.source_role || "").toLowerCase();

  if (role === "owner") return language === "id" ? "PEMILIK" : "OWNER";
  if (role === "agent") return "AGENT";

  return "USER";
}

export default function MobileReceiptDetailPage() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const rawId = params?.id;
  const paymentId = Array.isArray(rawId)
    ? rawId[0]
    : typeof rawId === "string"
      ? rawId
      : "";

  const [language, setLanguage] = useState<Language>("en");
  const [loading, setLoading] = useState(true);
  const [payment, setPayment] = useState<PaymentTransactionRow | null>(null);
  const [membership, setMembership] = useState<AgentMembershipRow | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  const isId = language === "id";

  useEffect(() => {
    let ignore = false;

    async function loadReceipt() {
      if (!paymentId) {
        setErrorMessage(isId ? "ID receipt tidak ditemukan." : "Receipt ID not found.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setErrorMessage("");

      try {
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (ignore) return;

        if (authError || !user) {
          setPayment(null);
          setMembership(null);
          setErrorMessage(isId ? "Silakan login ulang." : "Please log in again.");
          setLoading(false);
          return;
        }

        const { data: paymentData, error: paymentError } = await supabase
          .from("payment_transactions")
          .select(
            "id, user_id, property_id, source_role, payment_type, product_id, product_name_snapshot, product_type, audience_snapshot, status, currency, amount_subtotal, amount_discount, amount_tax, amount_total, description, plan_name, duration_days, property_title_snapshot, property_code_snapshot, customer_name, customer_email, customer_phone, checkout_url, checkout_expires_at, stripe_checkout_session_id, stripe_payment_intent_id, stripe_charge_id, paid_at, expired_at, failed_at, metadata, created_at, updated_at"
          )
          .eq("id", paymentId)
          .eq("user_id", user.id)
          .maybeSingle();

        if (ignore) return;

        if (paymentError || !paymentData) {
          setPayment(null);
          setMembership(null);
          setErrorMessage(isId ? "Receipt tidak ditemukan." : "Receipt not found.");
          setLoading(false);
          return;
        }

        const paymentRow = paymentData as PaymentTransactionRow;
        const sourceRole = String(paymentRow.source_role || "").toLowerCase();

        if (sourceRole !== "owner" && sourceRole !== "agent") {
          setPayment(null);
          setMembership(null);
          setErrorMessage(
            isId
              ? "Receipt ini hanya tersedia untuk Owner dan Agent."
              : "This receipt is only available for Owners and Agents."
          );
          setLoading(false);
          return;
        }

        setPayment(paymentRow);

        if (sourceRole === "agent") {
          const { data: membershipData, error: membershipError } = await supabase
            .from("agent_memberships")
            .select(
              "id, user_id, payment_id, package_id, package_name, billing_cycle, listing_limit, status, auto_renew, starts_at, expires_at, metadata, created_at, updated_at"
            )
            .eq("payment_id", paymentRow.id)
            .eq("user_id", user.id)
            .maybeSingle();

          if (membershipError) {
            console.log("Mobile receipt membership error:", membershipError);
          }

          if (!ignore) {
            setMembership((membershipData as AgentMembershipRow) || null);
          }
        } else {
          setMembership(null);
        }

        setLoading(false);
      } catch (error: any) {
        if (!ignore) {
          console.log("Tetamo mobile receipt error:", error);
          setPayment(null);
          setMembership(null);
          setErrorMessage(
            error?.message ||
              (isId ? "Gagal memuat receipt." : "Failed to load receipt.")
          );
          setLoading(false);
        }
      }
    }

    void loadReceipt();

    return () => {
      ignore = true;
    };
  }, [paymentId, isId]);

  const paid = isPaidStatus(payment?.status ?? null);

  const computed = useMemo(() => {
    return {
      receiptNo: getReceiptNumber(payment?.id),
      status: getStatusLabel(payment?.status ?? null, language),
      role: getRoleLabel(payment, language),
      title: getProductTitle(payment, membership, language),
      packageName: getPackageName(payment, membership),
      paymentType: getPaymentType(payment, language),
      billingCycle: getBillingCycle(payment, membership, language),
      listingLimit: getListingLimit(payment, membership),
      startsAt: formatDate(getStartsAt(payment, membership), language),
      expiryDate: formatDate(getExpiryDate(payment, membership), language),
      method: getPaymentMethod(payment, language),
      reference: getReferenceNumber(payment),
      subtotal: formatAmount(
        payment?.amount_subtotal ?? payment?.amount_total ?? 0,
        payment?.currency
      ),
      discount: formatAmount(payment?.amount_discount ?? 0, payment?.currency),
      tax: formatAmount(payment?.amount_tax ?? 0, payment?.currency),
      total: formatAmount(
        payment?.amount_total ?? payment?.amount_subtotal ?? 0,
        payment?.currency
      ),
      createdAt: formatDateTime(payment?.created_at, language),
      paidAt: formatDateTime(payment?.paid_at, language),
      customerName: cleanText(payment?.customer_name || payment?.customer_email),
      customerEmail: cleanText(payment?.customer_email),
      customerPhone: cleanText(payment?.customer_phone),
      listingCode: cleanText(payment?.property_code_snapshot),
    };
  }, [payment, membership, language]);

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="light" />
        <View style={styles.loadingBox}>
          <ActivityIndicator color="#e6c15c" />
          <Text style={styles.loadingText}>
            {isId ? "Memuat receipt..." : "Loading receipt..."}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (errorMessage || !payment) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="light" />

        <View style={styles.topBar}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeft color="#ffffff" size={18} />
          </Pressable>

          <View style={styles.topTitleBox}>
            <Text style={styles.topTitle}>Receipt</Text>
            <Text style={styles.topSub}>Tetamo</Text>
          </View>
        </View>

        <View style={styles.errorCard}>
          <ReceiptText color="#fecaca" size={30} />
          <Text style={styles.errorTitle}>
            {isId ? "Receipt tidak tersedia" : "Receipt unavailable"}
          </Text>
          <Text style={styles.errorText}>
            {errorMessage || (isId ? "Receipt tidak ditemukan." : "Receipt not found.")}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />

      <View style={styles.topBar}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft color="#ffffff" size={18} />
        </Pressable>

        <View style={styles.topTitleBox}>
          <Text style={styles.topTitle}>Receipt</Text>
          <Text style={styles.topSub}>
            {isId ? "Bukti pembayaran Tetamo" : "Tetamo payment receipt"}
          </Text>
        </View>

        <View style={styles.langToggle}>
          <Languages color="#e6c15c" size={14} />

          {(["en", "id"] as Language[]).map((item) => (
            <Pressable
              key={item}
              style={[styles.langButton, language === item && styles.langButtonActive]}
              onPress={() => setLanguage(item)}
            >
              <Text style={[styles.langText, language === item && styles.langTextActive]}>
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
        {!paid ? (
          <View style={styles.warningBanner}>
            <Clock3 color="#facc15" size={18} />
            <View style={styles.bannerTextBox}>
              <Text style={styles.warningTitle}>
                {isId ? "Pembayaran belum lunas." : "Payment is not paid yet."}
              </Text>
              <Text style={styles.warningText}>
                {isId
                  ? "Receipt ini akan menjadi valid setelah status pembayaran menjadi lunas."
                  : "This receipt becomes valid once the payment status is paid."}
              </Text>
            </View>
          </View>
        ) : null}

        <View style={styles.receiptCard}>
          <View style={styles.companyHeader}>
            <View style={styles.logoBox}>
              <ReceiptText color="#e6c15c" size={28} />
            </View>

            <View style={styles.companyTextBox}>
              <Text style={styles.companyName}>Tetamo Pty Ltd</Text>
              <Text style={styles.companyLine}>ABN 18 689 780 970</Text>
              <Text style={styles.companyLine}>
                Suite 809 168 Kent Street Sydney NSW 2000
              </Text>
              <Text style={styles.companyLine}>www.tetamo.com</Text>
            </View>
          </View>

          <View style={styles.receiptTop}>
            <View>
              <Text style={styles.receiptTitle}>Receipt</Text>
              <Text style={styles.receiptNo}>{computed.receiptNo}</Text>
            </View>

            <View style={[styles.statusPill, paid ? styles.statusPaid : styles.statusPending]}>
              <Text style={[styles.statusText, paid ? styles.statusPaidText : styles.statusPendingText]}>
                {computed.status}
              </Text>
            </View>
          </View>

          <View style={styles.roleRow}>
            <View style={styles.rolePill}>
              <Text style={styles.rolePillText}>{computed.role}</Text>
            </View>

            <Text style={styles.roleText}>
              {payment.source_role === "owner"
                ? isId
                  ? "Receipt pembayaran owner"
                  : "Owner payment receipt"
                : isId
                  ? "Receipt pembayaran agent"
                  : "Agent payment receipt"}
            </Text>
          </View>

          <View style={styles.divider} />

          <SectionTitle title={isId ? "Diterima Dari" : "Received From"} />

          <View style={styles.infoCard}>
            <Text style={styles.customerName}>{computed.customerName}</Text>
            <Text style={styles.customerText}>{computed.customerEmail}</Text>
            <Text style={styles.customerText}>{computed.customerPhone}</Text>
          </View>

          <SectionTitle title={isId ? "Detail Pembayaran" : "Payment Details"} />

          <View style={styles.detailGrid}>
            <DetailItem
              icon={<FileText color="#e6c15c" size={16} />}
              label={isId ? "Produk" : "Product"}
              value={computed.title}
            />
            <DetailItem
              icon={<ShieldCheck color="#60a5fa" size={16} />}
              label={isId ? "Jenis" : "Type"}
              value={computed.paymentType}
            />
            <DetailItem
              icon={<CreditCard color="#e6c15c" size={16} />}
              label={isId ? "Metode" : "Method"}
              value={computed.method}
            />
            <DetailItem
              icon={<ReceiptText color="#e6c15c" size={16} />}
              label="Reference"
              value={computed.reference}
            />
            <DetailItem
              icon={<CalendarDays color="#e6c15c" size={16} />}
              label={isId ? "Dibuat" : "Created"}
              value={computed.createdAt}
            />
            <DetailItem
              icon={<CheckCircle2 color="#22c55e" size={16} />}
              label={isId ? "Dibayar" : "Paid"}
              value={computed.paidAt}
            />
          </View>

          <SectionTitle title={isId ? "Detail Produk" : "Product Summary"} />

          <View style={styles.summaryBox}>
            <SummaryRow label={isId ? "Nama Paket" : "Package Name"} value={computed.packageName} />
            <SummaryRow label="Billing" value={computed.billingCycle} />
            <SummaryRow label={isId ? "Kode Listing" : "Listing Code"} value={computed.listingCode} />
            <SummaryRow label={isId ? "Limit Listing" : "Listing Limit"} value={computed.listingLimit} />
            <SummaryRow label={isId ? "Mulai" : "Starts"} value={computed.startsAt} />
            <SummaryRow label={isId ? "Expired" : "Expires"} value={computed.expiryDate} />
          </View>

          <SectionTitle title={isId ? "Ringkasan Pembayaran" : "Payment Summary"} />

          <View style={styles.amountBox}>
            <AmountRow label="Subtotal" value={computed.subtotal} />
            <AmountRow label="Discount" value={computed.discount} />
            <AmountRow label="Tax" value={computed.tax} />
            <View style={styles.amountDivider} />
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>{computed.total}</Text>
            </View>
          </View>

          <View style={styles.footerBox}>
            <Text style={styles.footerTitle}>
              {isId ? "Terima kasih telah menggunakan Tetamo." : "Thank you for using Tetamo."}
            </Text>
            <Text style={styles.footerText}>
              {isId
                ? "Receipt ini dibuat otomatis berdasarkan data pembayaran yang tercatat di sistem Tetamo."
                : "This receipt is automatically generated from the payment data recorded in the Tetamo system."}
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function SectionTitle({ title }: { title: string }) {
  return <Text style={styles.sectionTitle}>{title}</Text>;
}

function DetailItem({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.detailItem}>
      <View style={styles.detailIcon}>{icon}</View>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue} numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.summaryRow}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue} numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}

function AmountRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.amountRow}>
      <Text style={styles.amountLabel}>{label}</Text>
      <Text style={styles.amountValue}>{value}</Text>
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
    gap: 10,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#303030",
    backgroundColor: "#101010",
    alignItems: "center",
    justifyContent: "center",
  },
  topTitleBox: {
    flex: 1,
  },
  topTitle: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "900",
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
  loadingBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  loadingText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "800",
  },
  errorCard: {
    margin: 18,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: "#7f1d1d",
    backgroundColor: "#2a0d0d",
    padding: 18,
    alignItems: "center",
    gap: 8,
  },
  errorTitle: {
    color: "#fecaca",
    fontSize: 16,
    fontWeight: "900",
  },
  errorText: {
    color: "#fecaca",
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "700",
    textAlign: "center",
  },
  warningBanner: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#854d0e",
    backgroundColor: "#2b1d07",
    padding: 13,
    marginBottom: 12,
    flexDirection: "row",
    gap: 10,
  },
  bannerTextBox: {
    flex: 1,
  },
  warningTitle: {
    color: "#fef08a",
    fontSize: 12.5,
    fontWeight: "900",
  },
  warningText: {
    color: "#fde68a",
    fontSize: 11.2,
    lineHeight: 16,
    fontWeight: "700",
    marginTop: 3,
  },
  receiptCard: {
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "#303030",
    backgroundColor: "#101010",
    padding: 15,
  },
  companyHeader: {
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-start",
  },
  logoBox: {
    width: 58,
    height: 58,
    borderRadius: 21,
    borderWidth: 1,
    borderColor: "#705d2c",
    backgroundColor: "#211a0b",
    alignItems: "center",
    justifyContent: "center",
  },
  companyTextBox: {
    flex: 1,
  },
  companyName: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "900",
  },
  companyLine: {
    color: "#a9a9a9",
    fontSize: 10.8,
    lineHeight: 16,
    fontWeight: "700",
    marginTop: 2,
  },
  receiptTop: {
    marginTop: 18,
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 10,
  },
  receiptTitle: {
    color: "#ffffff",
    fontSize: 28,
    fontWeight: "900",
  },
  receiptNo: {
    color: "#a9a9a9",
    fontSize: 12,
    fontWeight: "800",
    marginTop: 2,
  },
  statusPill: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  statusPaid: {
    borderColor: "#166534",
    backgroundColor: "#052e16",
  },
  statusPending: {
    borderColor: "#854d0e",
    backgroundColor: "#2b1d07",
  },
  statusText: {
    fontSize: 9.5,
    fontWeight: "900",
  },
  statusPaidText: {
    color: "#86efac",
  },
  statusPendingText: {
    color: "#fde68a",
  },
  roleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 13,
  },
  rolePill: {
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
  roleText: {
    color: "#a9a9a9",
    fontSize: 11,
    fontWeight: "700",
    flex: 1,
  },
  divider: {
    height: 1,
    backgroundColor: "#252525",
    marginVertical: 16,
  },
  sectionTitle: {
    color: "#ffffff",
    fontSize: 14.5,
    fontWeight: "900",
    marginBottom: 9,
    marginTop: 3,
  },
  infoCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#252525",
    backgroundColor: "#050505",
    padding: 12,
    marginBottom: 14,
  },
  customerName: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "900",
  },
  customerText: {
    color: "#a9a9a9",
    fontSize: 11.2,
    fontWeight: "700",
    marginTop: 3,
  },
  detailGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 14,
  },
  detailItem: {
    width: "48.5%",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#252525",
    backgroundColor: "#050505",
    padding: 10,
  },
  detailIcon: {
    width: 30,
    height: 30,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#252525",
    backgroundColor: "#101010",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  detailLabel: {
    color: "#777777",
    fontSize: 9.5,
    fontWeight: "800",
  },
  detailValue: {
    color: "#ffffff",
    fontSize: 10.8,
    lineHeight: 15,
    fontWeight: "900",
    marginTop: 4,
  },
  summaryBox: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#252525",
    backgroundColor: "#050505",
    padding: 12,
    marginBottom: 14,
  },
  summaryRow: {
    borderBottomWidth: 1,
    borderBottomColor: "#171717",
    paddingVertical: 8,
  },
  summaryLabel: {
    color: "#777777",
    fontSize: 10,
    fontWeight: "800",
  },
  summaryValue: {
    color: "#ffffff",
    fontSize: 11.5,
    lineHeight: 16,
    fontWeight: "900",
    marginTop: 3,
  },
  amountBox: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#705d2c",
    backgroundColor: "#211a0b",
    padding: 12,
  },
  amountRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    paddingVertical: 6,
  },
  amountLabel: {
    color: "#d8d8d8",
    fontSize: 11.5,
    fontWeight: "800",
  },
  amountValue: {
    color: "#ffffff",
    fontSize: 11.5,
    fontWeight: "900",
  },
  amountDivider: {
    height: 1,
    backgroundColor: "#705d2c",
    marginVertical: 8,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    alignItems: "center",
  },
  totalLabel: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "900",
  },
  totalValue: {
    color: "#e6c15c",
    fontSize: 18,
    fontWeight: "900",
  },
  footerBox: {
    marginTop: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#252525",
    backgroundColor: "#050505",
    padding: 12,
  },
  footerTitle: {
    color: "#ffffff",
    fontSize: 12.5,
    fontWeight: "900",
  },
  footerText: {
    color: "#a9a9a9",
    fontSize: 11.2,
    lineHeight: 17,
    fontWeight: "700",
    marginTop: 4,
  },
});