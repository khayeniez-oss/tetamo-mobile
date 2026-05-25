import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
  ArrowLeft,
  Banknote,
  Check,
  ChevronRight,
  CreditCard,
  Languages,
  PackageCheck,
  QrCode,
  ShieldCheck,
  Sparkles,
} from "lucide-react-native";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
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
import {
  getAgentPackageById,
  type AgentPackage,
} from "../../services/pricelist";

type Language = "en" | "id";
type BillingCycle = "monthly" | "yearly";
type GatewayType = "stripe" | "hitpay";

const TETAMO_SITE_URL =
  process.env.EXPO_PUBLIC_TETAMO_SITE_URL || "https://www.tetamo.com";

function readParam(value: unknown) {
  if (Array.isArray(value)) return String(value[0] || "");
  return String(value || "");
}

function formatIdr(value: number) {
  return `Rp ${Number(value || 0).toLocaleString("id-ID")}`;
}

function createPaymentId() {
  const fallback = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
    /[xy]/g,
    (character) => {
      const random = Math.floor(Math.random() * 16);
      const value = character === "x" ? random : (random & 0x3) | 0x8;
      return value.toString(16);
    }
  );

  try {
    const maybeCrypto = globalThis.crypto as
      | { randomUUID?: () => string }
      | undefined;

    if (maybeCrypto?.randomUUID) {
      return maybeCrypto.randomUUID();
    }

    return fallback;
  } catch {
    return fallback;
  }
}

function getAvailableBillingCycles(product: AgentPackage): BillingCycle[] {
  const cycles = new Set<BillingCycle>();

  product.availableBillingCycles?.forEach((cycle) => cycles.add(cycle));

  if (product.billingCycle === "monthly") cycles.add("monthly");
  if (product.billingCycle === "yearly") cycles.add("yearly");

  if (product.monthlyPriceIdr && product.monthlyPriceIdr > 0) {
    cycles.add("monthly");
  }

  if (product.priceIdr && product.priceIdr > 0) {
    cycles.add(product.billingCycle === "monthly" ? "monthly" : "yearly");
  }

  if (cycles.size === 0) cycles.add("yearly");

  return Array.from(cycles);
}

function normalizeBillingCycle(
  value: string,
  product: AgentPackage
): BillingCycle {
  const available = getAvailableBillingCycles(product);

  if (value === "monthly" && available.includes("monthly")) return "monthly";
  if (value === "yearly" && available.includes("yearly")) return "yearly";

  if (product.billingCycle === "monthly" && available.includes("monthly")) {
    return "monthly";
  }

  if (available.includes("yearly")) return "yearly";

  return available[0] || "yearly";
}

function getMembershipTotal(product: AgentPackage, cycle: BillingCycle) {
  if (cycle === "monthly") {
    if (typeof product.monthlyPriceIdr === "number") {
      return product.monthlyPriceIdr;
    }

    if (product.billingCycle === "monthly") {
      return product.priceIdr;
    }

    return Math.ceil(product.priceIdr / 12);
  }

  return product.priceIdr;
}

function getBillingCycleLabel(cycle: BillingCycle, language: Language) {
  if (language === "id") return cycle === "monthly" ? "Bulanan" : "Tahunan";
  return cycle === "monthly" ? "Monthly" : "Yearly";
}

function getProductName(
  product: AgentPackage,
  cycle: BillingCycle,
  language: Language
) {
  const name = language === "id" ? product.name : product.nameEn || product.name;

  if (cycle === "monthly") {
    return language === "id"
      ? `${name} - Tagihan Bulanan`
      : `${name} - Monthly Billing`;
  }

  return name;
}

function getPaymentDescription(
  product: AgentPackage,
  cycle: BillingCycle,
  language: Language
) {
  if (language === "id") {
    return cycle === "monthly"
      ? product.monthlyBillingNote ||
          `Tinjau paket ${product.name} dengan pembayaran bulanan.`
      : product.paymentDescription;
  }

  return cycle === "monthly"
    ? product.monthlyBillingNoteEn ||
        product.monthlyBillingNote ||
        `Review the ${
          product.nameEn || product.name
        } package with monthly billing.`
    : product.paymentDescriptionEn || product.paymentDescription;
}

function getBillingNote(
  product: AgentPackage,
  cycle: BillingCycle,
  language: Language
) {
  if (language === "id") {
    return cycle === "monthly"
      ? product.monthlyBillingNote || product.billingNote
      : product.billingNote;
  }

  return cycle === "monthly"
    ? product.monthlyBillingNoteEn ||
        product.monthlyBillingNote ||
        product.billingNoteEn ||
        product.billingNote
    : product.billingNoteEn || product.billingNote;
}

function buildAgentMobileSuccessDeepLink({
  paymentId,
  packageId,
  billingCycle,
}: {
  paymentId: string;
  packageId: string;
  billingCycle: BillingCycle;
}) {
  const url = new URL("tetamomobile://agent/payment-success");
  url.searchParams.set("payment", "success");
  url.searchParams.set("payment_id", paymentId);
  url.searchParams.set("flow", "agent-membership");
  url.searchParams.set("role", "agent");
  url.searchParams.set("product", packageId);
  url.searchParams.set("package", packageId);
  url.searchParams.set("billing", billingCycle);
  url.searchParams.set("source", "mobile");

  return url.toString();
}

function buildAgentMobileCancelDeepLink({
  paymentId,
  packageId,
  billingCycle,
}: {
  paymentId: string;
  packageId: string;
  billingCycle: BillingCycle;
}) {
  const url = new URL("tetamomobile://agent/payment");
  url.searchParams.set("payment", "cancelled");
  url.searchParams.set("payment_id", paymentId);
  url.searchParams.set("flow", "agent-membership");
  url.searchParams.set("role", "agent");
  url.searchParams.set("product", packageId);
  url.searchParams.set("package", packageId);
  url.searchParams.set("billing", billingCycle);
  url.searchParams.set("source", "mobile");

  return url.toString();
}

function buildAgentMobileWebsiteSuccessUrl({
  paymentId,
  packageId,
  billingCycle,
}: {
  paymentId: string;
  packageId: string;
  billingCycle: BillingCycle;
}) {
  const url = new URL("/payment/mobile/success", TETAMO_SITE_URL);
  url.searchParams.set("payment", "success");
  url.searchParams.set("payment_id", paymentId);
  url.searchParams.set("flow", "agent-membership");
  url.searchParams.set("role", "agent");
  url.searchParams.set("product", packageId);
  url.searchParams.set("package", packageId);
  url.searchParams.set("billing", billingCycle);
  url.searchParams.set("source", "mobile");

  return url.toString();
}

function buildAgentMobileWebsiteCancelUrl({
  paymentId,
  packageId,
  billingCycle,
}: {
  paymentId: string;
  packageId: string;
  billingCycle: BillingCycle;
}) {
  const url = new URL("/payment/mobile/cancel", TETAMO_SITE_URL);
  url.searchParams.set("payment", "cancelled");
  url.searchParams.set("payment_id", paymentId);
  url.searchParams.set("flow", "agent-membership");
  url.searchParams.set("role", "agent");
  url.searchParams.set("product", packageId);
  url.searchParams.set("package", packageId);
  url.searchParams.set("billing", billingCycle);
  url.searchParams.set("source", "mobile");

  return url.toString();
}

export default function AgentPaymentScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const isIOS = Platform.OS === "ios";

  const [language, setLanguage] = useState<Language>("en");
  const [selectedGateway, setSelectedGateway] =
    useState<GatewayType>("hitpay");
  const [loadingUser, setLoadingUser] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [profile, setProfile] = useState<{
    id: string;
    email: string | null;
    full_name: string | null;
    phone: string | null;
    role: string | null;
  } | null>(null);

  const isId = language === "id";

  const packageId = readParam(params.package).toLowerCase();
  const billingFromUrl = readParam(params.billing).toLowerCase();
  const flow = readParam(params.flow) || "agent-membership";

  const selectedPackage = useMemo(() => {
    return getAgentPackageById(packageId);
  }, [packageId]);

  const selectedBillingCycle = useMemo<BillingCycle>(() => {
    if (!selectedPackage) return "yearly";
    return normalizeBillingCycle(billingFromUrl, selectedPackage);
  }, [billingFromUrl, selectedPackage]);

  const totalAmount = selectedPackage
    ? getMembershipTotal(selectedPackage, selectedBillingCycle)
    : 0;

  const listingLimit = selectedPackage?.maxListings || 0;

  const features = selectedPackage
    ? isId
      ? selectedPackage.features
      : selectedPackage.featuresEn || selectedPackage.features
    : [];

  useEffect(() => {
    if (!isIOS) return;

    router.replace("/search" as any);
  }, [isIOS, router]);

  useEffect(() => {
    if (isIOS) {
      setLoadingUser(false);
      return;
    }

    let ignore = false;

    async function loadUser() {
      setLoadingUser(true);
      setErrorMessage("");

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (ignore) return;

      if (authError || !user) {
        setErrorMessage(
          isId ? "Silakan login terlebih dahulu." : "Please log in first."
        );
        setLoadingUser(false);
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("id, email, full_name, phone, role")
        .eq("id", user.id)
        .maybeSingle();

      if (ignore) return;

      if (error) {
        setErrorMessage(
          error.message ||
            (isId ? "Gagal memuat profil." : "Failed to load profile.")
        );
        setLoadingUser(false);
        return;
      }

      setProfile(
        data || {
          id: user.id,
          email: user.email || null,
          full_name: null,
          phone: null,
          role: "agent",
        }
      );

      setLoadingUser(false);
    }

    void loadUser();

    return () => {
      ignore = true;
    };
  }, [isIOS, isId]);

  async function createPayment() {
    if (isIOS) {
      router.replace("/search" as any);
      return;
    }

    if (!selectedPackage || submitting) return;

    try {
      setSubmitting(true);
      setErrorMessage("");

      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session?.user) {
        setErrorMessage(
          isId ? "Silakan login terlebih dahulu." : "Please log in first."
        );
        setSubmitting(false);
        return;
      }

      const productName = getProductName(
        selectedPackage,
        selectedBillingCycle,
        language
      );

      const paymentId = createPaymentId();

      const successUrl = buildAgentMobileWebsiteSuccessUrl({
        paymentId,
        packageId: selectedPackage.id,
        billingCycle: selectedBillingCycle,
      });

      const cancelUrl = buildAgentMobileWebsiteCancelUrl({
        paymentId,
        packageId: selectedPackage.id,
        billingCycle: selectedBillingCycle,
      });

      const mobileSuccessDeepLink = buildAgentMobileSuccessDeepLink({
        paymentId,
        packageId: selectedPackage.id,
        billingCycle: selectedBillingCycle,
      });

      const mobileCancelDeepLink = buildAgentMobileCancelDeepLink({
        paymentId,
        packageId: selectedPackage.id,
        billingCycle: selectedBillingCycle,
      });

      const paymentPayload = {
        id: paymentId,
        userId: session.user.id,
        userType: "agent",
        flow: flow || "agent-membership",
        productId: selectedPackage.id,
        productType: "membership",
        amount: totalAmount,
        currency: "IDR",
        autoRenew: selectedPackage.autoRenewDefault,
        gateway: selectedGateway,
        paymentMethod: selectedGateway === "hitpay" ? "qris" : "card",
        billingCycle: selectedBillingCycle,
        productName,
        packageName: selectedPackage.name,
        listingLimit,
        successUrl,
        cancelUrl,
        metadata: {
          source: "tetamo-mobile",
          user_type: "agent",
          flow: "agent-membership",
          product_id: selectedPackage.id,
          product_type: "membership",
          package_id: selectedPackage.id,
          package_name: selectedPackage.name,
          billing_cycle: selectedBillingCycle,
          listing_limit: listingLimit,
          active_listing_limit: listingLimit,
          max_listings: listingLimit,
          package_term_days: selectedPackage.packageTermDays,
          billing_interval_days:
            selectedBillingCycle === "monthly"
              ? 30
              : selectedPackage.billingIntervalDays,
          monthly_commitment_months:
            selectedPackage.monthlyCommitmentMonths || null,
          customer_email: profile?.email || session.user.email || "",
          customer_name:
            profile?.full_name ||
            String(session.user.user_metadata?.full_name || "") ||
            "",
          customer_phone: profile?.phone || "",
          mobile_success_deep_link: mobileSuccessDeepLink,
          mobile_cancel_deep_link: mobileCancelDeepLink,
          mobile_success_return_url: successUrl,
          mobile_cancel_return_url: cancelUrl,
        },
      };

      const response = await fetch(`${TETAMO_SITE_URL}/api/payments/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(paymentPayload),
      });

      const result = await response.json().catch(() => null);

      if (!response.ok || !result?.success) {
        throw new Error(
          result?.error ||
            result?.message ||
            (isId
              ? "Gagal membuat pembayaran."
              : "Failed to create payment.")
        );
      }

      const checkoutUrl =
        result?.checkoutUrl ||
        result?.gatewayCheckoutUrl ||
        result?.payment?.checkoutUrl ||
        result?.payment?.gatewayCheckoutUrl;

      if (!checkoutUrl) {
        throw new Error(
          isId
            ? "Checkout pembayaran tidak ditemukan."
            : "Payment checkout was not found."
        );
      }

      await Linking.openURL(checkoutUrl);
    } catch (error: any) {
      console.log("Tetamo mobile agent payment error:", error);
      Alert.alert(
        error?.message ||
          (isId
            ? "Terjadi kesalahan saat membuat pembayaran."
            : "Something went wrong while creating payment.")
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (isIOS) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="light" />

        <View style={styles.iosRedirectBox}>
          <ActivityIndicator color="#e6c15c" />

          <Text style={styles.iosRedirectTitle}>
            {isId ? "Membuka Pencarian" : "Opening Search"}
          </Text>

          <Text style={styles.iosRedirectText}>
            {isId
              ? "Anda akan diarahkan ke pencarian properti."
              : "Redirecting you to property search."}
          </Text>

          <Pressable
            style={styles.iosSearchButton}
            onPress={() => router.replace("/search" as any)}
          >
            <Text style={styles.iosSearchButtonText}>
              {isId ? "Cari Properti" : "Search Properties"}
            </Text>
            <ChevronRight color="#111111" size={16} />
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  if (loadingUser) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="light" />

        <View style={styles.loadingBox}>
          <ActivityIndicator color="#e6c15c" />
          <Text style={styles.loadingText}>
            {isId ? "Memuat pembayaran agen..." : "Loading agent payment..."}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (errorMessage || !selectedPackage) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="light" />

        <View style={styles.errorBox}>
          <Text style={styles.errorTitle}>
            {isId ? "Tidak bisa membuka pembayaran" : "Cannot open payment"}
          </Text>

          <Text style={styles.errorText}>
            {errorMessage ||
              (isId
                ? "Paket agen tidak ditemukan."
                : "Agent package was not found.")}
          </Text>

          <Pressable
            style={styles.errorButton}
            onPress={() => router.push("/agent/packages" as any)}
          >
            <Text style={styles.errorButtonText}>
              {isId ? "Kembali ke Paket Agen" : "Back to Agent Packages"}
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />

      <View style={styles.topBar}>
        <Pressable
          style={styles.backButton}
          onPress={() => router.push("/agent/packages" as any)}
        >
          <ArrowLeft color="#ffffff" size={16} />
          <Text style={styles.backText}>{isId ? "Kembali" : "Back"}</Text>
        </Pressable>

        <View style={styles.langToggle}>
          <Languages color="#e6c15c" size={14} />

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
        <View style={styles.heroCard}>
          <View style={styles.heroBadge}>
            <Sparkles color="#e6c15c" size={14} />
            <Text style={styles.heroBadgeText}>
              {isId ? "PEMBAYARAN AGEN" : "AGENT PAYMENT"}
            </Text>
          </View>

          <Text style={styles.title}>
            {isId
              ? `Pembayaran ${getProductName(
                  selectedPackage,
                  selectedBillingCycle,
                  language
                )}`
              : `${getProductName(
                  selectedPackage,
                  selectedBillingCycle,
                  language
                )} Payment`}
          </Text>

          <Text style={styles.subtitle}>
            {getPaymentDescription(
              selectedPackage,
              selectedBillingCycle,
              language
            )}
          </Text>
        </View>

        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <View style={styles.summaryIcon}>
              <PackageCheck color="#e6c15c" size={22} />
            </View>

            <View style={styles.summaryHeaderText}>
              <Text style={styles.summaryTitle}>
                {isId ? "Ringkasan Membership" : "Membership Summary"}
              </Text>
              <Text style={styles.summarySub}>
                {isId
                  ? "Paket agen aktif setelah pembayaran berhasil dikonfirmasi."
                  : "Your agent package becomes active after payment is successfully confirmed."}
              </Text>
            </View>
          </View>

          <InfoRow
            label={isId ? "Paket" : "Package"}
            value={
              isId
                ? selectedPackage.name
                : selectedPackage.nameEn || selectedPackage.name
            }
          />

          <InfoRow
            label={isId ? "Tipe Tagihan" : "Billing Type"}
            value={getBillingCycleLabel(selectedBillingCycle, language)}
          />

          <InfoRow
            label={isId ? "Limit Listing Aktif" : "Active Listing Limit"}
            value={`${listingLimit} ${
              isId ? "listing aktif" : "active listings"
            }`}
          />

          <InfoRow
            label={isId ? "Masa Aktif" : "Active Period"}
            value={`${selectedPackage.durationDays} ${
              isId ? "hari" : "days"
            }`}
          />

          <View style={styles.noteBox}>
            <ShieldCheck color="#60a5fa" size={17} />
            <Text style={styles.noteText}>
              {getBillingNote(selectedPackage, selectedBillingCycle, language)}
            </Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>
          {isId ? "Pilih Metode Pembayaran" : "Choose Payment Method"}
        </Text>

        <Pressable
          style={[
            styles.paymentMethodCard,
            selectedGateway === "hitpay" && styles.paymentMethodActive,
          ]}
          onPress={() => setSelectedGateway("hitpay")}
        >
          <View style={styles.paymentMethodIcon}>
            <QrCode color="#111111" size={22} />
          </View>

          <View style={styles.paymentMethodTextBox}>
            <Text style={styles.paymentMethodTitle}>QRIS</Text>
            <Text style={styles.paymentMethodSubtitle}>
              {isId
                ? "Bayar aman menggunakan aplikasi bank atau e-wallet yang mendukung QRIS, termasuk BCA Mobile, BNI Mobile Banking, BRImo, Livin’ by Mandiri, GoPay, OVO, DANA, ShopeePay, dan LinkAja."
                : "Pay securely using any QRIS-supported banking app or e-wallet, including BCA Mobile, BNI Mobile Banking, BRImo, Livin’ by Mandiri, GoPay, OVO, DANA, ShopeePay, and LinkAja."}
            </Text>
          </View>

          {selectedGateway === "hitpay" ? (
            <View style={styles.selectedCheck}>
              <Check color="#111111" size={15} />
            </View>
          ) : null}
        </Pressable>

        <Pressable
          style={[
            styles.paymentMethodCard,
            selectedGateway === "stripe" && styles.paymentMethodActive,
          ]}
          onPress={() => setSelectedGateway("stripe")}
        >
          <View style={styles.paymentMethodIcon}>
            <CreditCard color="#111111" size={22} />
          </View>

          <View style={styles.paymentMethodTextBox}>
            <Text style={styles.paymentMethodTitle}>Debit / Credit Card</Text>
            <Text style={styles.paymentMethodSubtitle}>
              {isId
                ? "Visa, Mastercard, American Express, dan kartu lain yang didukung."
                : "Visa, Mastercard, American Express, and other supported cards."}
            </Text>
          </View>

          {selectedGateway === "stripe" ? (
            <View style={styles.selectedCheck}>
              <Check color="#111111" size={15} />
            </View>
          ) : null}
        </Pressable>

        <View style={styles.featuresCard}>
          <Text style={styles.featuresTitle}>
            {isId ? "Yang Anda Dapatkan" : "What You Get"}
          </Text>

          {features.slice(0, 12).map((feature, index) => (
            <View key={`${feature}-${index}`} style={styles.featureRow}>
              <Check color="#22c55e" size={14} />
              <Text style={styles.featureText}>{feature}</Text>
            </View>
          ))}
        </View>

        <View style={styles.totalCard}>
          <View style={styles.totalRow}>
            <View>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalSub}>
                {getBillingCycleLabel(selectedBillingCycle, language)}
              </Text>
            </View>

            <Text style={styles.totalValue}>{formatIdr(totalAmount)}</Text>
          </View>

          <Pressable
            style={[styles.payButton, submitting && styles.disabled]}
            disabled={submitting}
            onPress={createPayment}
          >
            {submitting ? <ActivityIndicator color="#111111" /> : null}
            <Text style={styles.payButtonText}>
              {submitting
                ? isId
                  ? "Menyiapkan Pembayaran..."
                  : "Preparing Payment..."
                : isId
                  ? "Bayar Sekarang"
                  : "Pay Now"}
            </Text>
            <ChevronRight color="#111111" size={16} />
          </Pressable>

          <View style={styles.checkoutNote}>
            <Banknote color="#e6c15c" size={15} />
            <Text style={styles.checkoutNoteText}>
              {isId
                ? "Checkout aman akan terbuka setelah Anda menekan tombol pembayaran."
                : "Secure checkout will open after you tap the payment button."}
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
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

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#050505",
  },
  scroll: {
    flex: 1,
    backgroundColor: "#050505",
  },
  content: {
    paddingHorizontal: 18,
    paddingBottom: 38,
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
  iosSearchButton: {
    minHeight: 48,
    borderRadius: 17,
    backgroundColor: "#e6c15c",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingHorizontal: 16,
    marginTop: 4,
  },
  iosSearchButtonText: {
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
    paddingHorizontal: 12,
    paddingVertical: 9,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  backText: {
    color: "#ffffff",
    fontSize: 11.5,
    fontWeight: "900",
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
  heroCard: {
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "#303030",
    backgroundColor: "#101010",
    padding: 18,
    marginTop: 10,
    marginBottom: 13,
  },
  heroBadge: {
    alignSelf: "flex-start",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#705d2c",
    backgroundColor: "#211a0b",
    paddingHorizontal: 10,
    paddingVertical: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  heroBadgeText: {
    color: "#e6c15c",
    fontSize: 9.5,
    fontWeight: "900",
    letterSpacing: 1,
  },
  title: {
    color: "#ffffff",
    fontSize: 25,
    lineHeight: 31,
    fontWeight: "900",
    letterSpacing: -0.6,
    marginTop: 13,
  },
  subtitle: {
    color: "#b8b8b8",
    fontSize: 12.2,
    lineHeight: 18,
    fontWeight: "700",
    marginTop: 7,
  },
  summaryCard: {
    borderRadius: 26,
    borderWidth: 1,
    borderColor: "#303030",
    backgroundColor: "#101010",
    padding: 15,
    marginBottom: 14,
  },
  summaryHeader: {
    flexDirection: "row",
    gap: 11,
    alignItems: "flex-start",
    marginBottom: 12,
  },
  summaryIcon: {
    width: 44,
    height: 44,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#705d2c",
    backgroundColor: "#211a0b",
    alignItems: "center",
    justifyContent: "center",
  },
  summaryHeaderText: {
    flex: 1,
  },
  summaryTitle: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "900",
  },
  summarySub: {
    color: "#a9a9a9",
    fontSize: 11.5,
    lineHeight: 16,
    fontWeight: "700",
    marginTop: 4,
  },
  infoRow: {
    borderTopWidth: 1,
    borderTopColor: "#222222",
    paddingVertical: 11,
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  infoLabel: {
    color: "#a9a9a9",
    fontSize: 11.5,
    fontWeight: "800",
  },
  infoValue: {
    color: "#ffffff",
    fontSize: 11.5,
    fontWeight: "900",
    flex: 1,
    textAlign: "right",
  },
  noteBox: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#1d4ed8",
    backgroundColor: "#0b1624",
    padding: 12,
    flexDirection: "row",
    gap: 9,
    marginTop: 4,
  },
  noteText: {
    color: "#bfdbfe",
    fontSize: 10.8,
    lineHeight: 15,
    fontWeight: "700",
    flex: 1,
  },
  sectionTitle: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "900",
    marginBottom: 11,
  },
  paymentMethodCard: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#303030",
    backgroundColor: "#101010",
    padding: 14,
    marginBottom: 11,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 11,
  },
  paymentMethodActive: {
    borderColor: "#e6c15c",
  },
  paymentMethodIcon: {
    width: 42,
    height: 42,
    borderRadius: 15,
    backgroundColor: "#e6c15c",
    alignItems: "center",
    justifyContent: "center",
  },
  paymentMethodTextBox: {
    flex: 1,
  },
  paymentMethodTitle: {
    color: "#ffffff",
    fontSize: 13.5,
    fontWeight: "900",
  },
  paymentMethodSubtitle: {
    color: "#b8b8b8",
    fontSize: 11,
    lineHeight: 16,
    fontWeight: "700",
    marginTop: 4,
  },
  selectedCheck: {
    width: 25,
    height: 25,
    borderRadius: 999,
    backgroundColor: "#e6c15c",
    alignItems: "center",
    justifyContent: "center",
  },
  featuresCard: {
    borderRadius: 26,
    borderWidth: 1,
    borderColor: "#303030",
    backgroundColor: "#101010",
    padding: 15,
    marginTop: 3,
    marginBottom: 14,
  },
  featuresTitle: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "900",
    marginBottom: 12,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 7,
    marginBottom: 8,
  },
  featureText: {
    color: "#d6d6d6",
    fontSize: 11.5,
    lineHeight: 16,
    fontWeight: "700",
    flex: 1,
  },
  totalCard: {
    borderRadius: 26,
    borderWidth: 1,
    borderColor: "#705d2c",
    backgroundColor: "#211a0b",
    padding: 15,
  },
  totalRow: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#705d2c",
    backgroundColor: "#151106",
    padding: 13,
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  totalLabel: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "900",
  },
  totalSub: {
    color: "#c9c9c9",
    fontSize: 11,
    fontWeight: "800",
    marginTop: 3,
  },
  totalValue: {
    color: "#e6c15c",
    fontSize: 15,
    fontWeight: "900",
    textAlign: "right",
  },
  payButton: {
    minHeight: 50,
    borderRadius: 17,
    backgroundColor: "#e6c15c",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    paddingHorizontal: 14,
    marginTop: 13,
  },
  payButtonText: {
    color: "#111111",
    fontSize: 13,
    fontWeight: "900",
  },
  checkoutNote: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginTop: 12,
  },
  checkoutNoteText: {
    color: "#d6d6d6",
    fontSize: 10.8,
    lineHeight: 15,
    fontWeight: "700",
    flex: 1,
  },
  disabled: {
    opacity: 0.55,
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
  errorBox: {
    flex: 1,
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  errorTitle: {
    color: "#ffffff",
    fontSize: 22,
    lineHeight: 28,
    fontWeight: "900",
    textAlign: "center",
  },
  errorText: {
    color: "#fecaca",
    fontSize: 12.5,
    lineHeight: 19,
    fontWeight: "700",
    textAlign: "center",
    marginTop: 8,
  },
  errorButton: {
    minHeight: 46,
    borderRadius: 16,
    backgroundColor: "#e6c15c",
    paddingHorizontal: 16,
    marginTop: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  errorButtonText: {
    color: "#111111",
    fontSize: 12.5,
    fontWeight: "900",
  },
});