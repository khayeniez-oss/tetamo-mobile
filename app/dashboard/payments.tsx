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
    Search,
    ShieldCheck,
    UserRound,
} from "lucide-react-native";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Linking,
    Pressable,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import { supabase } from "../../lib/supabase";

type Language = "en" | "id";
type Role = "owner" | "agent" | "guest" | "unsupported";

type PaymentStatus =
  | "initiated"
  | "pending"
  | "checkout_created"
  | "paid"
  | "failed"
  | "expired"
  | "canceled"
  | "cancelled"
  | "refunded"
  | "partially_refunded"
  | "completed"
  | "succeeded"
  | "settled"
  | "active"
  | null;

type ProfileRow = {
  id: string;
  full_name: string | null;
  email: string | null;
  role: string | null;
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

type PaymentTransactionRow = {
  id: string;
  user_id: string | null;
  property_id: string | null;
  source_role: string | null;
  payment_type: string | null;
  product_id: string | null;
  product_name_snapshot: string | null;
  product_type: string | null;
  status: PaymentStatus;
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
  paid_at: string | null;
  expired_at: string | null;
  failed_at: string | null;
  metadata: Record<string, any> | null;
  created_at: string | null;
  updated_at: string | null;
};

type PaymentCategory = "membership" | "listing" | "addon" | "education" | "other";

type PaymentItem = {
  id: string;
  role: "owner" | "agent";
  category: PaymentCategory;
  title: string;
  paymentType: string;
  packageName: string;
  productId: string;
  listingCode: string;
  amount: number;
  amountLabel: string;
  method: string;
  reference: string;
  isPaid: boolean;
  createdLabel: string;
  paidLabel: string;
  expiryLabel: string;
  checkoutUrl: string;
};

function normalizeRole(value: unknown): Role {
  const role = String(value || "").toLowerCase();

  if (role === "owner" || role === "pemilik") return "owner";
  if (role === "agent" || role === "agen") return "agent";
  if (!role) return "guest";

  return "unsupported";
}

function asObject(value: unknown): Record<string, any> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, any>)
    : {};
}

function cleanText(value: unknown) {
  const text = String(value || "").trim();
  return text || "-";
}

function blankText(value: unknown) {
  const text = String(value || "").trim();
  return text && text !== "-" ? text : "";
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

function getNestedMetaString(
  metadata: Record<string, any> | null | undefined,
  objectKey: string,
  key: string
) {
  const objectValue = metadata?.[objectKey];

  if (!objectValue || typeof objectValue !== "object" || Array.isArray(objectValue)) {
    return "";
  }

  const value = (objectValue as Record<string, any>)[key];
  return typeof value === "string" && value.trim() ? value.trim() : "";
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

function isPaidStatus(status: PaymentStatus, paidAt?: string | null) {
  const value = String(status || "").toLowerCase();

  if (
    value === "paid" ||
    value === "completed" ||
    value === "succeeded" ||
    value === "settled" ||
    value === "active"
  ) {
    return true;
  }

  return Boolean(paidAt);
}

function inferCategory(row: PaymentTransactionRow, role: "owner" | "agent"): PaymentCategory {
  const paymentType = String(row.payment_type || "").toLowerCase();
  const productType = String(row.product_type || "").toLowerCase();

  if (paymentType === "education" || productType === "education") return "education";

  if (
    paymentType === "boost" ||
    paymentType === "spotlight" ||
    productType === "addon"
  ) {
    return "addon";
  }

  if (role === "agent" && (paymentType === "package" || productType === "membership")) {
    return "membership";
  }

  if (
    role === "owner" &&
    (paymentType === "package" ||
      paymentType === "listing_fee" ||
      productType === "listing")
  ) {
    return "listing";
  }

  return "other";
}

function getPaymentTypeLabel(
  row: PaymentTransactionRow,
  role: "owner" | "agent",
  language: Language
) {
  const isId = language === "id";
  const paymentType = String(row.payment_type || "").toLowerCase();

  if (paymentType === "package") {
    if (role === "agent") return isId ? "Membership Agent" : "Agent Membership";
    return isId ? "Paket Listing" : "Listing Package";
  }

  if (paymentType === "listing_fee") return isId ? "Biaya Listing" : "Listing Fee";
  if (paymentType === "boost") return "Boost Listing";
  if (paymentType === "spotlight") return "Homepage Spotlight";
  if (paymentType === "education") return "Education Pass";
  if (paymentType === "featured") return "Featured Listing";

  return cleanText(row.payment_type || row.product_type || "Payment");
}

function getExpiryDate(row: PaymentTransactionRow, membership: AgentMembershipRow | null) {
  return (
    membership?.expires_at ||
    getNestedMetaString(row.metadata, "activation", "expiresAt") ||
    getNestedMetaString(row.metadata, "activation", "endsAt") ||
    getMetaString(row.metadata, "expires_at") ||
    row.checkout_expires_at ||
    row.expired_at ||
    null
  );
}

function getPaymentMethod(row: PaymentTransactionRow) {
  const info = getPaymentMetaInfo(row.metadata);

  if (info.isQris) return "QRIS";

  return "Debit / Credit Card";
}

function getReference(row: PaymentTransactionRow) {
  const info = getPaymentMetaInfo(row.metadata);

  if (info.qrisReference) return info.qrisReference;
  if (row.stripe_checkout_session_id) return row.stripe_checkout_session_id;
  if (row.stripe_payment_intent_id) return row.stripe_payment_intent_id;
  if (row.stripe_charge_id) return row.stripe_charge_id;

  return `PAY-${row.id.slice(0, 8).toUpperCase()}`;
}

function getTitle(
  row: PaymentTransactionRow,
  membership: AgentMembershipRow | null,
  role: "owner" | "agent",
  language: Language
) {
  const isId = language === "id";
  const paymentType = String(row.payment_type || "").toLowerCase();

  const direct =
    row.description ||
    getMetaString(row.metadata, "paymentTitle") ||
    getMetaString(row.metadata, "payment_title") ||
    row.property_title_snapshot ||
    row.product_name_snapshot ||
    membership?.package_name ||
    row.plan_name ||
    row.product_id;

  if (direct) return cleanText(sanitizePublicPaymentText(direct));

  if (paymentType === "education") return "Education Pass";
  if (paymentType === "boost") return "Boost Listing";
  if (paymentType === "spotlight") return "Homepage Spotlight";

  if (paymentType === "package") {
    if (role === "agent") return isId ? "Membership Agent" : "Agent Membership";
    return isId ? "Paket Listing Pemilik" : "Owner Listing Package";
  }

  return isId ? "Pembayaran Tetamo" : "Tetamo Payment";
}

function isMembershipActive(membership: AgentMembershipRow | null) {
  if (!membership) return false;
  if (membership.status !== "active") return false;

  if (!membership.expires_at) return true;

  const expiry = new Date(membership.expires_at);
  if (Number.isNaN(expiry.getTime())) return true;

  return expiry.getTime() >= Date.now();
}

function membershipStatusLabel(membership: AgentMembershipRow | null, language: Language) {
  const isId = language === "id";

  if (!membership) return isId ? "Belum Aktif" : "Not Active";
  if (isMembershipActive(membership)) return isId ? "Aktif" : "Active";
  if (membership.status === "pending") return "Pending";
  if (membership.status === "cancelled") return isId ? "Dibatalkan" : "Cancelled";

  return isId ? "Kedaluwarsa" : "Expired";
}

function mapPaymentRow(
  row: PaymentTransactionRow,
  role: "owner" | "agent",
  memberships: AgentMembershipRow[],
  language: Language
): PaymentItem {
  const membership = memberships.find((item) => item.payment_id === row.id) || null;
  const category = inferCategory(row, role);
  const amount = Number(row.amount_total ?? row.amount_subtotal ?? 0);
  const currency = row.currency || "IDR";
  const expiryAt = getExpiryDate(row, membership);

  return {
    id: row.id,
    role,
    category,
    title: getTitle(row, membership, role, language),
    paymentType: getPaymentTypeLabel(row, role, language),
    packageName: cleanText(
      sanitizePublicPaymentText(
        membership?.package_name ||
          getMetaString(row.metadata, "packageName") ||
          getMetaString(row.metadata, "package_name") ||
          row.product_name_snapshot ||
          row.plan_name ||
          row.product_id
      )
    ),
    productId: cleanText(row.product_id),
    listingCode: cleanText(
      row.property_code_snapshot ||
        getMetaString(row.metadata, "existingPropertyCode") ||
        getMetaString(row.metadata, "listing_code")
    ),
    amount,
    amountLabel: formatAmount(amount, currency),
    method: getPaymentMethod(row),
    reference: getReference(row),
    isPaid: isPaidStatus(row.status, row.paid_at),
    createdLabel: formatDateTime(row.created_at, language),
    paidLabel: formatDateTime(row.paid_at, language),
    expiryLabel: formatDateTime(expiryAt, language),
    checkoutUrl: blankText(row.checkout_url),
  };
}

export default function PaymentsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const [language, setLanguage] = useState<Language>("en");
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [role, setRole] = useState<Role>("guest");
  const [memberships, setMemberships] = useState<AgentMembershipRow[]>([]);
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const isId = language === "id";
  const paymentResult = String(params.payment || "");

  useEffect(() => {
    let ignore = false;

    async function loadPayments() {
      setLoading(true);
      setErrorMessage("");

      try {
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (ignore) return;

        if (authError || !user) {
          setProfile(null);
          setRole("guest");
          setPayments([]);
          setMemberships([]);
          setLoading(false);
          return;
        }

        const { data: profileRow, error: profileError } = await supabase
          .from("profiles")
          .select("id, full_name, email, role")
          .eq("id", user.id)
          .maybeSingle();

        if (ignore) return;
        if (profileError) throw profileError;

        const safeProfile: ProfileRow = {
          id: user.id,
          full_name:
            profileRow?.full_name ||
            String(user.user_metadata?.full_name || "") ||
            String(user.user_metadata?.name || ""),
          email: profileRow?.email || user.email || "",
          role: profileRow?.role || String(user.user_metadata?.role || ""),
        };

        const detectedRole = normalizeRole(safeProfile.role);

        setProfile(safeProfile);
        setRole(detectedRole);

        if (detectedRole !== "owner" && detectedRole !== "agent") {
          setPayments([]);
          setMemberships([]);
          setLoading(false);
          return;
        }

        if (detectedRole === "agent") {
          const [membershipRes, transactionRes] = await Promise.all([
            supabase
              .from("agent_memberships")
              .select(
                "id, user_id, payment_id, package_id, package_name, billing_cycle, listing_limit, status, auto_renew, starts_at, expires_at, metadata, created_at, updated_at"
              )
              .eq("user_id", user.id)
              .order("created_at", { ascending: false }),

            supabase
              .from("payment_transactions")
              .select(
                "id, user_id, property_id, source_role, payment_type, product_id, product_name_snapshot, product_type, status, currency, amount_subtotal, amount_total, description, plan_name, duration_days, property_title_snapshot, property_code_snapshot, customer_name, customer_email, checkout_url, checkout_expires_at, stripe_checkout_session_id, stripe_payment_intent_id, stripe_charge_id, paid_at, expired_at, failed_at, metadata, created_at, updated_at"
              )
              .eq("user_id", user.id)
              .eq("source_role", "agent")
              .order("created_at", { ascending: false }),
          ]);

          if (ignore) return;

          if (transactionRes.error) throw transactionRes.error;

          if (membershipRes.error) {
            console.log("Mobile payments membership error:", membershipRes.error);
          }

          const membershipRows = (membershipRes.data || []) as AgentMembershipRow[];
          const transactionRows = (transactionRes.data || []) as PaymentTransactionRow[];

          setMemberships(membershipRows);
          setPayments(
            transactionRows.map((row) =>
              mapPaymentRow(row, "agent", membershipRows, language)
            )
          );
          setLoading(false);
          return;
        }

        const { data: transactionRows, error: transactionError } = await supabase
          .from("payment_transactions")
          .select(
            "id, user_id, property_id, source_role, payment_type, product_id, product_name_snapshot, product_type, status, currency, amount_subtotal, amount_total, description, plan_name, duration_days, property_title_snapshot, property_code_snapshot, customer_name, customer_email, checkout_url, checkout_expires_at, stripe_checkout_session_id, stripe_payment_intent_id, stripe_charge_id, paid_at, expired_at, failed_at, metadata, created_at, updated_at"
          )
          .eq("user_id", user.id)
          .eq("source_role", "owner")
          .order("created_at", { ascending: false });

        if (ignore) return;
        if (transactionError) throw transactionError;

        setMemberships([]);
        setPayments(
          ((transactionRows || []) as PaymentTransactionRow[]).map((row) =>
            mapPaymentRow(row, "owner", [], language)
          )
        );
        setLoading(false);
      } catch (error: any) {
        if (!ignore) {
          console.log("Tetamo mobile payments error:", error);
          setErrorMessage(
            error?.message ||
              (isId ? "Gagal memuat pembayaran." : "Failed to load payments.")
          );
          setLoading(false);
        }
      }
    }

    void loadPayments();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      void loadPayments();
    });

    return () => {
      ignore = true;
      subscription.unsubscribe();
    };
  }, [language, isId]);

  const activeMembership = useMemo(() => {
    return memberships.find((item) => isMembershipActive(item)) || memberships[0] || null;
  }, [memberships]);

  const filteredPayments = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) return payments;

    const words = query.split(" ").filter(Boolean);

    return payments.filter((item) => {
      const searchable = `
        ${item.title}
        ${item.paymentType}
        ${item.packageName}
        ${item.productId}
        ${item.listingCode}
        ${item.method}
        ${item.reference}
        ${item.isPaid ? "paid receipt" : "pay now"}
        ${item.amountLabel}
      `.toLowerCase();

      return words.every((word) => searchable.includes(word));
    });
  }, [payments, searchQuery]);

  const paidPayments = useMemo(() => {
    return payments.filter((item) => item.isPaid);
  }, [payments]);

  const payNowPayments = useMemo(() => {
    return payments.filter((item) => !item.isPaid);
  }, [payments]);

  const totalPaid = useMemo(() => {
    return paidPayments.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  }, [paidPayments]);

  const totalPayNow = useMemo(() => {
    return payNowPayments.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  }, [payNowPayments]);

  async function openCheckout(url: string) {
    if (!url) {
      Alert.alert(
        isId ? "Link pembayaran belum tersedia" : "Payment link not available",
        isId
          ? "Belum ada link pembayaran untuk catatan ini."
          : "There is no payment link available for this record."
      );
      return;
    }

    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert(
        isId ? "Tidak bisa membuka link" : "Cannot open link",
        isId ? "Silakan coba lagi nanti." : "Please try again later."
      );
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="light" />

        <View style={styles.loadingBox}>
          <ActivityIndicator color="#e6c15c" />
          <Text style={styles.loadingText}>
            {isId ? "Memuat pembayaran..." : "Loading payments..."}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!profile || role === "guest") {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="light" />

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.guestContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.guestCard}>
            <View style={styles.logoCircle}>
              <UserRound color="#e6c15c" size={34} />
            </View>

            <Text style={styles.guestTitle}>
              {isId ? "Masuk untuk melihat pembayaran" : "Log in to view payments"}
            </Text>

            <Text style={styles.guestText}>
              {isId
                ? "Anda perlu login untuk melihat tagihan, pembayaran, dan receipt Tetamo."
                : "You need to log in to view your Tetamo billing, payments, and receipts."}
            </Text>

            <Pressable style={styles.primaryButton} onPress={() => router.push("/login" as any)}>
              <Text style={styles.primaryButtonText}>{isId ? "Login" : "Log In"}</Text>
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (role === "unsupported") {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="light" />

        <View style={styles.topBar}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeft color="#ffffff" size={18} />
          </Pressable>

          <View style={styles.topTitleBox}>
            <Text style={styles.topTitle}>{isId ? "Pembayaran" : "Payments"}</Text>
            <Text style={styles.topSub}>Tetamo</Text>
          </View>
        </View>

        <View style={styles.unsupportedCard}>
          <Text style={styles.unsupportedTitle}>
            {isId ? "Role belum tersedia" : "Role not supported"}
          </Text>
          <Text style={styles.unsupportedText}>
            {isId
              ? "Halaman pembayaran mobile ini hanya untuk Owner dan Agent."
              : "This mobile payments page is only for Owners and Agents."}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const roleLabel =
    role === "owner" ? (isId ? "PEMILIK" : "OWNER") : isId ? "AGENT" : "AGENT";

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />

      <View style={styles.topBar}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft color="#ffffff" size={18} />
        </Pressable>

        <View style={styles.topTitleBox}>
          <Text style={styles.topTitle}>{isId ? "Pembayaran" : "Payments"}</Text>
          <Text style={styles.topSub}>
            {role === "owner"
              ? isId
                ? "Tagihan & receipt pemilik"
                : "Owner billing and receipts"
              : isId
                ? "Tagihan & receipt agent"
                : "Agent billing and receipts"}
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
        {errorMessage ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorBannerText}>{errorMessage}</Text>
          </View>
        ) : null}

        {paymentResult === "success" ? (
          <View style={styles.successBanner}>
            <CheckCircle2 color="#86efac" size={18} />
            <View style={styles.bannerTextBox}>
              <Text style={styles.successTitle}>
                {isId ? "Pembayaran berhasil." : "Payment successful."}
              </Text>
              <Text style={styles.successText}>
                {isId
                  ? "Status pembayaran akan tampil sebagai Paid setelah sistem selesai memproses."
                  : "Payment status will show as Paid once the system finishes processing."}
              </Text>
            </View>
          </View>
        ) : null}

        {paymentResult === "cancelled" ? (
          <View style={styles.warningBanner}>
            <Clock3 color="#facc15" size={18} />
            <View style={styles.bannerTextBox}>
              <Text style={styles.warningTitle}>
                {isId ? "Pembayaran belum selesai." : "Payment not completed."}
              </Text>
              <Text style={styles.warningText}>
                {isId
                  ? "Gunakan tombol Pay Now jika Anda ingin menyelesaikan pembayaran."
                  : "Use the Pay Now button if you want to complete the payment."}
              </Text>
            </View>
          </View>
        ) : null}

        <View style={styles.heroCard}>
          <View style={styles.heroTop}>
            <View style={styles.heroIcon}>
              <ReceiptText color="#e6c15c" size={24} />
            </View>

            <View style={styles.heroTextBox}>
              <View style={styles.rolePill}>
                <Text style={styles.rolePillText}>{roleLabel}</Text>
              </View>

              <Text style={styles.heroTitle}>
                {role === "owner"
                  ? isId
                    ? "Riwayat Pembayaran Pemilik"
                    : "Owner Payment History"
                  : isId
                    ? "Riwayat Pembayaran Agent"
                    : "Agent Payment History"}
              </Text>

              <Text style={styles.heroSub}>
                {profile.full_name || profile.email || "Tetamo User"}
              </Text>
            </View>
          </View>

          <View style={styles.summaryGrid}>
            <SummaryCard
              icon={<FileText color="#e6c15c" size={17} />}
              label={isId ? "Total" : "Records"}
              value={String(payments.length)}
            />
            <SummaryCard
              icon={<CheckCircle2 color="#22c55e" size={17} />}
              label="Paid"
              value={formatAmount(totalPaid, "IDR")}
            />
            <SummaryCard
              icon={<CreditCard color="#f59e0b" size={17} />}
              label="Pay Now"
              value={formatAmount(totalPayNow, "IDR")}
            />
          </View>
        </View>

        {role === "agent" ? (
          <View style={styles.membershipCard}>
            <View style={styles.membershipTop}>
              <View style={styles.membershipIcon}>
                <ShieldCheck color="#60a5fa" size={21} />
              </View>

              <View style={styles.membershipTextBox}>
                <Text style={styles.membershipTitle}>
                  {isId ? "Membership Agent" : "Agent Membership"}
                </Text>
                <Text style={styles.membershipSub}>
                  {sanitizePublicPaymentText(
                    activeMembership?.package_name ||
                      activeMembership?.package_id ||
                      (isId ? "Belum ada paket aktif" : "No active package")
                  )}
                </Text>
              </View>

              <View style={styles.membershipBadge}>
                <Text style={styles.membershipBadgeText}>
                  {membershipStatusLabel(activeMembership, language)}
                </Text>
              </View>
            </View>

            <View style={styles.membershipStats}>
              <MiniStat
                label="Billing"
                value={
                  activeMembership?.billing_cycle === "monthly"
                    ? isId
                      ? "Bulanan"
                      : "Monthly"
                    : activeMembership?.billing_cycle === "yearly"
                      ? isId
                        ? "Tahunan"
                        : "Yearly"
                      : "-"
                }
              />
              <MiniStat
                label="Limit"
                value={String(activeMembership?.listing_limit || 0)}
              />
              <MiniStat
                label={isId ? "Expired" : "Expires"}
                value={formatDateTime(activeMembership?.expires_at, language)}
              />
              <MiniStat
                label="Auto Renew"
                value={
                  activeMembership?.auto_renew
                    ? isId
                      ? "Aktif"
                      : "Active"
                    : isId
                      ? "Nonaktif"
                      : "Inactive"
                }
              />
            </View>
          </View>
        ) : null}

        <View style={styles.searchBox}>
          <Search color="#777777" size={17} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder={
              isId
                ? "Cari pembayaran, kode listing, metode..."
                : "Search payments, listing code, method..."
            }
            placeholderTextColor="#777777"
            style={styles.searchInput}
          />
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            {isId ? "Riwayat Pembayaran" : "Payment History"}
          </Text>
        </View>

        {filteredPayments.length === 0 ? (
          <View style={styles.emptyBox}>
            <ReceiptText color="#777777" size={24} />
            <Text style={styles.emptyTitle}>
              {isId ? "Belum ada pembayaran" : "No payments yet"}
            </Text>
            <Text style={styles.emptyText}>
              {isId
                ? "Tidak ada riwayat pembayaran untuk akun ini."
                : "There are no payment records for this account yet."}
            </Text>
          </View>
        ) : (
          <View style={styles.paymentList}>
            {filteredPayments.map((item) => (
              <PaymentCard
                key={item.id}
                item={item}
                language={language}
                onPayNow={() => openCheckout(item.checkoutUrl)}
                onReceipt={() => router.push(`/dashboard/receipt/${item.id}` as any)}
              />
            ))}
          </View>
        )}

        <View style={styles.noteCard}>
          <Text style={styles.noteTitle}>{isId ? "Catatan" : "Note"}</Text>
          <Text style={styles.noteText}>
            {isId
              ? "Pembayaran yang sudah berhasil akan tampil sebagai Paid dan memiliki Receipt. Pembayaran yang belum berhasil akan tampil sebagai Pay Now."
              : "Successful payments show as Paid and have a Receipt. Payments not completed yet show as Pay Now."}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function SummaryCard({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.summaryCard}>
      <View style={styles.summaryIcon}>{icon}</View>
      <Text style={styles.summaryValue} numberOfLines={1}>
        {value}
      </Text>
      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.miniStat}>
      <Text style={styles.miniStatLabel}>{label}</Text>
      <Text style={styles.miniStatValue} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

function PaymentCard({
  item,
  language,
  onPayNow,
  onReceipt,
}: {
  item: PaymentItem;
  language: Language;
  onPayNow: () => void;
  onReceipt: () => void;
}) {
  const isId = language === "id";

  return (
    <View style={styles.paymentCard}>
      <View style={styles.paymentTop}>
        <View style={styles.paymentIcon}>
          {item.isPaid ? (
            <CheckCircle2 color="#22c55e" size={20} />
          ) : (
            <CreditCard color="#e6c15c" size={20} />
          )}
        </View>

        <View style={styles.paymentTitleBox}>
          <Text style={styles.paymentTitle} numberOfLines={2}>
            {item.title}
          </Text>
          <Text style={styles.paymentSub} numberOfLines={1}>
            {item.paymentType}
          </Text>
        </View>

        <View style={[styles.statusPill, item.isPaid ? styles.statusPaid : styles.statusPayNow]}>
          <Text style={[styles.statusText, item.isPaid ? styles.statusPaidText : styles.statusPayNowText]}>
            {item.isPaid ? "Paid" : "Pay Now"}
          </Text>
        </View>
      </View>

      <Text style={styles.paymentAmount}>{item.amountLabel}</Text>

      <View style={styles.infoGrid}>
        <InfoPill label={isId ? "Kode" : "Code"} value={item.listingCode} />
        <InfoPill label="Product" value={item.productId} />
        <InfoPill label={isId ? "Metode" : "Method"} value={item.method} />
        <InfoPill label="Reference" value={item.reference} />
      </View>

      <View style={styles.dateGrid}>
        <View style={styles.dateRow}>
          <CalendarDays color="#777777" size={14} />
          <Text style={styles.dateText}>
            {isId ? "Dibuat:" : "Created:"} {item.createdLabel}
          </Text>
        </View>

        <View style={styles.dateRow}>
          <CheckCircle2 color="#777777" size={14} />
          <Text style={styles.dateText}>
            {isId ? "Dibayar:" : "Paid:"} {item.paidLabel}
          </Text>
        </View>

        <View style={styles.dateRow}>
          <Clock3 color="#777777" size={14} />
          <Text style={styles.dateText}>
            {isId ? "Expired:" : "Expiry:"} {item.expiryLabel}
          </Text>
        </View>
      </View>

      <View style={styles.actionRow}>
        {item.isPaid ? (
          <Pressable style={styles.goldActionButton} onPress={onReceipt}>
            <ReceiptText color="#111111" size={15} />
            <Text style={styles.goldActionText}>Receipt</Text>
          </Pressable>
        ) : (
          <Pressable style={styles.goldActionButton} onPress={onPayNow}>
            <CreditCard color="#111111" size={15} />
            <Text style={styles.goldActionText}>Pay Now</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

function InfoPill({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoPill}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue} numberOfLines={1}>
        {value || "-"}
      </Text>
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
    letterSpacing: -0.2,
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
    padding: 24,
  },
  loadingText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "800",
  },
  guestContent: {
    flexGrow: 1,
    paddingHorizontal: 18,
    paddingBottom: 36,
    justifyContent: "center",
  },
  guestCard: {
    borderRadius: 30,
    borderWidth: 1,
    borderColor: "#303030",
    backgroundColor: "#101010",
    padding: 22,
    alignItems: "center",
  },
  logoCircle: {
    width: 76,
    height: 76,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#705d2c",
    backgroundColor: "#211a0b",
    alignItems: "center",
    justifyContent: "center",
  },
  guestTitle: {
    color: "#ffffff",
    fontSize: 24,
    lineHeight: 30,
    fontWeight: "900",
    textAlign: "center",
    marginTop: 16,
  },
  guestText: {
    color: "#b8b8b8",
    fontSize: 12.5,
    lineHeight: 19,
    fontWeight: "700",
    textAlign: "center",
    marginTop: 8,
  },
  primaryButton: {
    width: "100%",
    minHeight: 50,
    borderRadius: 17,
    backgroundColor: "#e6c15c",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
  },
  primaryButtonText: {
    color: "#111111",
    fontSize: 13,
    fontWeight: "900",
  },
  errorBanner: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#7f1d1d",
    backgroundColor: "#2a0d0d",
    padding: 12,
    marginBottom: 12,
  },
  errorBannerText: {
    color: "#fecaca",
    fontSize: 11.5,
    lineHeight: 16,
    fontWeight: "700",
  },
  successBanner: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#166534",
    backgroundColor: "#052e16",
    padding: 13,
    marginBottom: 12,
    flexDirection: "row",
    gap: 10,
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
  successTitle: {
    color: "#bbf7d0",
    fontSize: 12.5,
    fontWeight: "900",
  },
  successText: {
    color: "#86efac",
    fontSize: 11.2,
    lineHeight: 16,
    fontWeight: "700",
    marginTop: 3,
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
  heroCard: {
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "#303030",
    backgroundColor: "#101010",
    padding: 15,
    marginBottom: 14,
  },
  heroTop: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
  },
  heroIcon: {
    width: 58,
    height: 58,
    borderRadius: 21,
    borderWidth: 1,
    borderColor: "#705d2c",
    backgroundColor: "#211a0b",
    alignItems: "center",
    justifyContent: "center",
  },
  heroTextBox: {
    flex: 1,
  },
  rolePill: {
    alignSelf: "flex-start",
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
  heroTitle: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "900",
    marginTop: 7,
  },
  heroSub: {
    color: "#a9a9a9",
    fontSize: 11.5,
    fontWeight: "700",
    marginTop: 3,
  },
  summaryGrid: {
    flexDirection: "row",
    gap: 9,
    marginTop: 14,
  },
  summaryCard: {
    flex: 1,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#252525",
    backgroundColor: "#050505",
    padding: 10,
  },
  summaryIcon: {
    width: 32,
    height: 32,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: "#252525",
    backgroundColor: "#101010",
    alignItems: "center",
    justifyContent: "center",
  },
  summaryValue: {
    color: "#ffffff",
    fontSize: 13.5,
    fontWeight: "900",
    marginTop: 8,
  },
  summaryLabel: {
    color: "#9b9b9b",
    fontSize: 9.5,
    fontWeight: "800",
    marginTop: 2,
  },
  membershipCard: {
    borderRadius: 26,
    borderWidth: 1,
    borderColor: "#1d4ed8",
    backgroundColor: "#0b1624",
    padding: 14,
    marginBottom: 14,
  },
  membershipTop: {
    flexDirection: "row",
    gap: 10,
    alignItems: "flex-start",
  },
  membershipIcon: {
    width: 43,
    height: 43,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#1d4ed8",
    backgroundColor: "#06101d",
    alignItems: "center",
    justifyContent: "center",
  },
  membershipTextBox: {
    flex: 1,
  },
  membershipTitle: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "900",
  },
  membershipSub: {
    color: "#bfdbfe",
    fontSize: 11.5,
    lineHeight: 16,
    fontWeight: "800",
    marginTop: 3,
  },
  membershipBadge: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#1d4ed8",
    backgroundColor: "#06101d",
    paddingHorizontal: 9,
    paddingVertical: 6,
  },
  membershipBadgeText: {
    color: "#bfdbfe",
    fontSize: 9.5,
    fontWeight: "900",
  },
  membershipStats: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 13,
  },
  miniStat: {
    width: "48.5%",
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#1d4ed8",
    backgroundColor: "#06101d",
    padding: 10,
  },
  miniStatLabel: {
    color: "#93c5fd",
    fontSize: 10.3,
    fontWeight: "800",
  },
  miniStatValue: {
    color: "#ffffff",
    fontSize: 11.7,
    fontWeight: "900",
    marginTop: 4,
  },
  searchBox: {
    minHeight: 48,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: "#303030",
    backgroundColor: "#101010",
    paddingHorizontal: 13,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    marginBottom: 14,
  },
  searchInput: {
    flex: 1,
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "800",
    paddingVertical: 10,
  },
  sectionHeader: {
    marginTop: 4,
    marginBottom: 10,
  },
  sectionTitle: {
    color: "#ffffff",
    fontSize: 15.5,
    fontWeight: "900",
    letterSpacing: -0.2,
  },
  emptyBox: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#303030",
    backgroundColor: "#101010",
    padding: 18,
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  emptyTitle: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "900",
  },
  emptyText: {
    color: "#9b9b9b",
    fontSize: 11.5,
    lineHeight: 16,
    fontWeight: "700",
    textAlign: "center",
  },
  paymentList: {
    gap: 11,
    marginBottom: 16,
  },
  paymentCard: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#303030",
    backgroundColor: "#101010",
    padding: 13,
  },
  paymentTop: {
    flexDirection: "row",
    gap: 10,
    alignItems: "flex-start",
  },
  paymentIcon: {
    width: 42,
    height: 42,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#303030",
    backgroundColor: "#050505",
    alignItems: "center",
    justifyContent: "center",
  },
  paymentTitleBox: {
    flex: 1,
  },
  paymentTitle: {
    color: "#ffffff",
    fontSize: 13.2,
    lineHeight: 18,
    fontWeight: "900",
  },
  paymentSub: {
    color: "#9b9b9b",
    fontSize: 10.5,
    fontWeight: "800",
    marginTop: 3,
  },
  paymentAmount: {
    color: "#e6c15c",
    fontSize: 20,
    fontWeight: "900",
    marginTop: 11,
  },
  statusPill: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  statusText: {
    fontSize: 8.8,
    fontWeight: "900",
  },
  statusPaid: {
    borderColor: "#166534",
    backgroundColor: "#052e16",
  },
  statusPaidText: {
    color: "#86efac",
  },
  statusPayNow: {
    borderColor: "#854d0e",
    backgroundColor: "#2b1d07",
  },
  statusPayNowText: {
    color: "#fde68a",
  },
  infoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
  },
  infoPill: {
    width: "48.5%",
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#252525",
    backgroundColor: "#050505",
    padding: 10,
  },
  infoLabel: {
    color: "#777777",
    fontSize: 9.3,
    fontWeight: "800",
  },
  infoValue: {
    color: "#ffffff",
    fontSize: 10.5,
    fontWeight: "900",
    marginTop: 4,
  },
  dateGrid: {
    gap: 6,
    marginTop: 12,
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  dateText: {
    color: "#a9a9a9",
    fontSize: 10.7,
    fontWeight: "700",
    flex: 1,
  },
  actionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 13,
  },
  goldActionButton: {
    minHeight: 40,
    borderRadius: 14,
    backgroundColor: "#e6c15c",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingHorizontal: 12,
  },
  goldActionText: {
    color: "#111111",
    fontSize: 11.2,
    fontWeight: "900",
  },
  noteCard: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#303030",
    backgroundColor: "#101010",
    padding: 14,
  },
  noteTitle: {
    color: "#ffffff",
    fontSize: 13.5,
    fontWeight: "900",
  },
  noteText: {
    color: "#a9a9a9",
    fontSize: 11.3,
    lineHeight: 17,
    fontWeight: "700",
    marginTop: 5,
  },
  unsupportedCard: {
    margin: 18,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#303030",
    backgroundColor: "#101010",
    padding: 16,
  },
  unsupportedTitle: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "900",
  },
  unsupportedText: {
    color: "#a9a9a9",
    fontSize: 11.5,
    lineHeight: 16,
    fontWeight: "700",
    marginTop: 5,
  },
});