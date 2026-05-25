import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
  ArrowLeft,
  Check,
  CreditCard,
  FileText,
  PackageCheck,
  QrCode,
  ShieldCheck,
} from "lucide-react-native";
import { useEffect, useMemo, useState, type ReactNode } from "react";
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
import {
  useListingDraft,
  type OwnerPlanType,
} from "../../components/listing/ListingDraftContext";
import { supabase } from "../../lib/supabase";
import { getOwnerPackageById } from "../../services/pricelist";

type GatewayType = "stripe" | "hitpay";
type Language = "en" | "id";

export default function OwnerPaymentScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { loading, draft, setDraft } = useListingDraft();

  const isIOS = Platform.OS === "ios";

  const [language, setLanguage] = useState<Language>("en");
  const [selectedGateway, setSelectedGateway] =
    useState<GatewayType>("stripe");
  const [submitting, setSubmitting] = useState(false);

  const currentPlan = useMemo<OwnerPlanType>(() => {
    const plan = readParam(params.plan);

    if (plan === "priority") return "priority";
    if (plan === "featured") return "featured";

    return "basic";
  }, [params.plan]);

  const selectedPackage = useMemo(() => {
    return getOwnerPackageById(currentPlan) as any;
  }, [currentPlan]);

  const isId = language === "id";

  const siteUrl =
    process.env.EXPO_PUBLIC_TETAMO_SITE_URL ||
    process.env.EXPO_PUBLIC_SITE_URL ||
    "https://www.tetamo.com";

  const photos = Array.isArray(draft.photos) ? draft.photos : [];
  const total = Number(selectedPackage?.priceIdr || 0);

  const listingTypeLabel = useMemo(() => {
    const value = String(draft.listingType || "").toLowerCase();

    if (value === "dijual") return isId ? "Dijual" : "For Sale";
    if (value === "disewa") return isId ? "Disewa" : "For Rent";
    if (value === "lelang") return isId ? "Lelang" : "Auction";

    return "-";
  }, [draft.listingType, isId]);

  const locationLabel = useMemo(() => {
    const province = String(draft.province || "").trim();
    const city = String(draft.city || "").trim();

    if (province && city) return `${province} • ${city}`;
    return province || city || "-";
  }, [draft.province, draft.city]);

  const isReadyToPay = useMemo(() => {
    const listingTypeOk = String(draft.listingType || "").trim().length > 0;
    const provinceOk = String(draft.province || "").trim().length > 0;
    const titleOk = String(draft.title || "").trim().length > 0;
    const descriptionOk = String(draft.description || "").trim().length > 0;
    const photosOk = photos.length >= 3;
    const verificationOk = Boolean(
      draft.verification?.relationship &&
        draft.verification?.sellMode &&
        draft.verification?.needAgentRecommendation &&
        draft.verification?.needTransactionSupport
    );

    return Boolean(
      selectedPackage &&
        listingTypeOk &&
        provinceOk &&
        titleOk &&
        descriptionOk &&
        photosOk &&
        verificationOk
    );
  }, [
    draft.listingType,
    draft.province,
    draft.title,
    draft.description,
    draft.verification,
    photos.length,
    selectedPackage,
  ]);

  useEffect(() => {
    if (!isIOS) return;

    router.replace("/search" as any);
  }, [isIOS, router]);

  function handleBack() {
    if (isIOS) {
      router.replace("/search" as any);
      return;
    }

    router.push(`/owner/listing-verification?plan=${currentPlan}` as any);
  }

  async function handlePay() {
    if (isIOS) {
      router.replace("/search" as any);
      return;
    }

    if (!isReadyToPay || submitting) return;

    try {
      setSubmitting(true);

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user?.id) {
        Alert.alert(
          isId ? "Silakan login kembali." : "Please log in again."
        );
        router.push("/login" as any);
        return;
      }

      const selectedPaymentMethod =
        selectedGateway === "hitpay" ? "qris" : "card";

      const paymentId = createPaymentId();

      const mobileSuccessDeepLink = buildOwnerMobileSuccessDeepLink({
        paymentId,
        currentPlan,
        kode: String(draft.kode || ""),
      });

      const mobileCancelDeepLink = buildOwnerMobileCancelDeepLink({
        paymentId,
        currentPlan,
        kode: String(draft.kode || ""),
      });

      const successUrl = buildOwnerMobileWebsiteSuccessUrl({
        siteUrl,
        paymentId,
        currentPlan,
        kode: String(draft.kode || ""),
      });

      const cancelUrl = buildOwnerMobileWebsiteCancelUrl({
        siteUrl,
        paymentId,
        currentPlan,
        kode: String(draft.kode || ""),
      });

      const paymentRecord = {
        id: paymentId,
        userId: session.user.id,
        userType: "owner",
        flow: "new-listing",
        productId: currentPlan,
        productType: "listing",
        listingCode: String(draft.kode || ""),
        amount: total,
        currency: "IDR",
        autoRenew: Boolean(selectedPackage?.autoRenewDefault ?? true),
        status: "pending",
        paymentMethod: selectedPaymentMethod,
        gateway: selectedGateway,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),

        successUrl,
        cancelUrl,

        metadata: {
          action: "create",
          selectedPlan: currentPlan,
          existingPropertyId: null,
          existingPropertyCode: null,
          existingPropertyTitle: null,
          listingType: String(draft.listingType || "") || null,
          draftSnapshot: buildDraftSnapshot(draft),
          productDurationDays: Number(selectedPackage?.durationDays || 365),
          featuredDurationDays: Number(
            selectedPackage?.featuredDurationDays || 0
          ),
          paymentTitle:
            selectedPackage?.paymentTitleEn ||
            selectedPackage?.paymentTitle ||
            selectedPackage?.nameEn ||
            selectedPackage?.name ||
            currentPlan,
          paymentDescription:
            selectedPackage?.paymentDescriptionEn ||
            selectedPackage?.paymentDescription ||
            null,
          billingNote:
            selectedPackage?.billingNoteEn ||
            selectedPackage?.billingNote ||
            null,
          gateway: selectedGateway,
          paymentMethod: selectedPaymentMethod,
          clientSource: "tetamo-mobile-owner-payment",
          mobile_success_deep_link: mobileSuccessDeepLink,
          mobile_cancel_deep_link: mobileCancelDeepLink,
          mobile_success_return_url: successUrl,
          mobile_cancel_return_url: cancelUrl,
        },
      };

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      if (session.access_token) {
        headers.Authorization = `Bearer ${session.access_token}`;
      }

      const response = await fetch(`${siteUrl}/api/payments/create`, {
        method: "POST",
        headers,
        body: JSON.stringify(paymentRecord),
      });

      const data = await response.json();

      if (!response.ok || !data?.success) {
        Alert.alert(
          data?.message ||
            (isId
              ? "Gagal membuat pembayaran."
              : "Failed to create payment.")
        );
        return;
      }

      const checkoutUrl =
        data?.checkoutUrl ||
        data?.checkout_url ||
        data?.url ||
        data?.sessionUrl ||
        data?.session_url ||
        data?.data?.checkoutUrl ||
        data?.data?.checkout_url ||
        data?.data?.url;

      if (!checkoutUrl) {
        Alert.alert(
          isId
            ? "Checkout URL tidak ditemukan."
            : "Checkout URL was not found."
        );
        return;
      }

      setDraft((prev) => ({
        ...prev,
        payment: {
          ...(prev.payment || {}),
          id: data?.paymentId || paymentId,
          planId: currentPlan,
          amount: total,
          currency: "IDR",
          status: "pending",
          method: selectedGateway,
          checkoutUrl,
        },
      }));

      await Linking.openURL(checkoutUrl);
    } catch (error: any) {
      Alert.alert(
        error?.message ||
          (isId
            ? "Terjadi kendala saat membuat pembayaran."
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
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="light" />

        <View style={styles.loadingBox}>
          <ActivityIndicator color="#e6c15c" />
          <Text style={styles.loadingText}>
            {isId ? "Memuat pembayaran..." : "Loading payment..."}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />

      <View style={styles.topBar}>
        <Pressable style={styles.backButton} onPress={handleBack}>
          <ArrowLeft color="#ffffff" size={16} />
          <Text style={styles.backText}>{isId ? "Kembali" : "Back"}</Text>
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
        <View style={styles.header}>
          <Text style={styles.kicker}>STEP 5</Text>
          <Text style={styles.title}>{isId ? "Pembayaran" : "Payment"}</Text>
          <Text style={styles.subtitle}>
            {isId
              ? "Tinjau ringkasan listing dan pilih metode pembayaran."
              : "Review your listing summary and choose a payment method."}
          </Text>
        </View>

        <View style={styles.sectionCard}>
          <SectionHeader
            icon={<FileText color="#e6c15c" size={21} />}
            title={isId ? "Ringkasan Iklan" : "Listing Summary"}
          />

          <SummaryGrid
            items={[
              {
                label: isId ? "Tipe Listing" : "Listing Type",
                value: listingTypeLabel,
              },
              {
                label: isId ? "Lokasi" : "Location",
                value: locationLabel,
              },
              {
                label: isId ? "Judul" : "Title",
                value: String(draft.title || "-"),
              },
              {
                label: isId ? "Foto" : "Photos",
                value: isId
                  ? `${photos.length} foto`
                  : `${photos.length} photos`,
              },
            ]}
          />

          {!isReadyToPay ? (
            <View style={styles.warningBox}>
              <Text style={styles.warningTitle}>
                {isId ? "Belum bisa bayar" : "Cannot pay yet"}
              </Text>
              <Text style={styles.warningText}>
                {isId
                  ? "Pastikan tipe listing, lokasi, minimal 3 foto, judul, deskripsi, dan verifikasi sudah terisi."
                  : "Make sure listing type, location, at least 3 photos, title, description, and verification are completed."}
              </Text>
            </View>
          ) : null}

          <View style={styles.infoBox}>
            <ShieldCheck color="#60a5fa" size={18} />
            <View style={styles.infoTextBox}>
              <Text style={styles.infoTitle}>
                {isId
                  ? "Aktivasi setelah pembayaran dikonfirmasi"
                  : "Activation after payment confirmation"}
              </Text>
              <Text style={styles.infoText}>
                {isId
                  ? "Setelah pembayaran dikonfirmasi, listing Anda akan dikirim untuk verifikasi admin."
                  : "After payment is confirmed, your listing will be submitted for admin verification."}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.sectionCard}>
          <SectionHeader
            icon={<PackageCheck color="#e6c15c" size={21} />}
            title={
              selectedPackage
                ? isId
                  ? selectedPackage.name
                  : selectedPackage.nameEn || selectedPackage.name
                : currentPlan.toUpperCase()
            }
          />

          <View style={styles.packageBox}>
            <View style={styles.packageTop}>
              <View style={styles.packageNameBox}>
                <Text style={styles.packageName}>
                  {selectedPackage
                    ? isId
                      ? selectedPackage.name
                      : selectedPackage.nameEn || selectedPackage.name
                    : currentPlan.toUpperCase()}
                </Text>

                <Text style={styles.packageDuration}>
                  {isId ? "Durasi:" : "Duration:"}{" "}
                  {formatDuration(selectedPackage?.durationDays, isId)}
                </Text>
              </View>

              <Text style={styles.packagePrice}>{formatIdr(total)}</Text>
            </View>

            {Array.isArray(selectedPackage?.features) ||
            Array.isArray(selectedPackage?.featuresEn) ? (
              <View style={styles.featuresBox}>
                {(isId
                  ? selectedPackage?.features || selectedPackage?.featuresEn
                  : selectedPackage?.featuresEn || selectedPackage?.features
                )
                  ?.slice(0, 6)
                  .map((feature: string, index: number) => (
                    <View key={`${feature}-${index}`} style={styles.featureRow}>
                      <Check color="#22c55e" size={14} />
                      <Text style={styles.featureText}>{feature}</Text>
                    </View>
                  ))}
              </View>
            ) : null}
          </View>
        </View>

        <View style={styles.sectionCard}>
          <SectionHeader
            icon={<CreditCard color="#e6c15c" size={21} />}
            title={isId ? "Metode Pembayaran" : "Payment Method"}
          />

          <GatewayCard
            active={selectedGateway === "stripe"}
            icon={
              <CreditCard
                color={selectedGateway === "stripe" ? "#111111" : "#e6c15c"}
                size={20}
              />
            }
            title="Debit / Credit Card"
            description={
              isId
                ? "Visa, Mastercard, American Express, dan kartu lain yang didukung."
                : "Visa, Mastercard, American Express, and other supported cards."
            }
            onPress={() => setSelectedGateway("stripe")}
          />

          <GatewayCard
            active={selectedGateway === "hitpay"}
            icon={
              <QrCode
                color={selectedGateway === "hitpay" ? "#111111" : "#e6c15c"}
                size={20}
              />
            }
            title="QRIS"
            description={
              isId
                ? "Bayar aman menggunakan aplikasi bank atau e-wallet yang mendukung QRIS, termasuk BCA Mobile, BNI Mobile Banking, BRImo, Livin’ by Mandiri, GoPay, OVO, DANA, ShopeePay, dan LinkAja."
                : "Pay securely using any QRIS-supported banking app or e-wallet, including BCA Mobile, BNI Mobile Banking, BRImo, Livin’ by Mandiri, GoPay, OVO, DANA, ShopeePay, and LinkAja."
            }
            onPress={() => setSelectedGateway("hitpay")}
          />

          <View style={styles.totalBox}>
            <Text style={styles.totalLabel}>{isId ? "Total" : "Total"}</Text>
            <Text style={styles.totalValue}>{formatIdr(total)}</Text>
          </View>

          <Pressable
            style={[
              styles.payButton,
              (!isReadyToPay || submitting) && styles.payButtonDisabled,
            ]}
            disabled={!isReadyToPay || submitting}
            onPress={handlePay}
          >
            {submitting ? <ActivityIndicator color="#111111" /> : null}

            <Text style={styles.payButtonText}>
              {submitting
                ? isId
                  ? "Membuat Checkout..."
                  : "Creating Checkout..."
                : isId
                  ? "Bayar Sekarang"
                  : "Pay Now"}
            </Text>
          </Pressable>

          <Text style={styles.checkoutNote}>
            {isId
              ? "Checkout aman akan terbuka setelah Anda menekan Bayar Sekarang."
              : "Secure checkout will open after you tap Pay Now."}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function SectionHeader({
  icon,
  title,
}: {
  icon: ReactNode;
  title: string;
}) {
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionIcon}>{icon}</View>
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );
}

function SummaryGrid({
  items,
}: {
  items: Array<{ label: string; value: string }>;
}) {
  return (
    <View style={styles.summaryGrid}>
      {items.map((item) => (
        <View key={item.label} style={styles.summaryBox}>
          <Text style={styles.summaryLabel}>{item.label}</Text>
          <Text style={styles.summaryValue} numberOfLines={3}>
            {item.value}
          </Text>
        </View>
      ))}
    </View>
  );
}

function GatewayCard({
  active,
  icon,
  title,
  description,
  onPress,
}: {
  active: boolean;
  icon: ReactNode;
  title: string;
  description: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={[styles.gatewayCard, active && styles.gatewayCardActive]}
      onPress={onPress}
    >
      <View style={[styles.gatewayIcon, active && styles.gatewayIconActive]}>
        {icon}
      </View>

      <View style={styles.gatewayTextBox}>
        <Text
          style={[styles.gatewayTitle, active && styles.gatewayTitleActive]}
        >
          {title}
        </Text>
        <Text style={[styles.gatewayDesc, active && styles.gatewayDescActive]}>
          {description}
        </Text>
      </View>
    </Pressable>
  );
}

function readParam(value: unknown) {
  if (Array.isArray(value)) return String(value[0] || "");
  return String(value || "");
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

function buildOwnerMobileSuccessDeepLink({
  paymentId,
  currentPlan,
  kode,
}: {
  paymentId: string;
  currentPlan: string;
  kode: string;
}) {
  const url = new URL("tetamomobile://owner/payment-success");
  url.searchParams.set("payment", "success");
  url.searchParams.set("payment_id", paymentId);
  url.searchParams.set("flow", "new-listing");
  url.searchParams.set("product", currentPlan);
  url.searchParams.set("plan", currentPlan);
  url.searchParams.set("source", "mobile");

  if (kode.trim()) {
    url.searchParams.set("kode", kode.trim());
  }

  return url.toString();
}

function buildOwnerMobileCancelDeepLink({
  paymentId,
  currentPlan,
  kode,
}: {
  paymentId: string;
  currentPlan: string;
  kode: string;
}) {
  const url = new URL("tetamomobile://owner/payment");
  url.searchParams.set("payment", "cancelled");
  url.searchParams.set("payment_id", paymentId);
  url.searchParams.set("flow", "new-listing");
  url.searchParams.set("product", currentPlan);
  url.searchParams.set("plan", currentPlan);
  url.searchParams.set("source", "mobile");

  if (kode.trim()) {
    url.searchParams.set("kode", kode.trim());
  }

  return url.toString();
}

function buildOwnerMobileWebsiteSuccessUrl({
  siteUrl,
  paymentId,
  currentPlan,
  kode,
}: {
  siteUrl: string;
  paymentId: string;
  currentPlan: string;
  kode: string;
}) {
  const url = new URL("/payment/mobile/success", siteUrl);
  url.searchParams.set("payment", "success");
  url.searchParams.set("payment_id", paymentId);
  url.searchParams.set("flow", "new-listing");
  url.searchParams.set("product", currentPlan);
  url.searchParams.set("plan", currentPlan);
  url.searchParams.set("role", "owner");
  url.searchParams.set("source", "mobile");

  if (kode.trim()) {
    url.searchParams.set("kode", kode.trim());
  }

  return url.toString();
}

function buildOwnerMobileWebsiteCancelUrl({
  siteUrl,
  paymentId,
  currentPlan,
  kode,
}: {
  siteUrl: string;
  paymentId: string;
  currentPlan: string;
  kode: string;
}) {
  const url = new URL("/payment/mobile/cancel", siteUrl);
  url.searchParams.set("payment", "cancelled");
  url.searchParams.set("payment_id", paymentId);
  url.searchParams.set("flow", "new-listing");
  url.searchParams.set("product", currentPlan);
  url.searchParams.set("plan", currentPlan);
  url.searchParams.set("role", "owner");
  url.searchParams.set("source", "mobile");

  if (kode.trim()) {
    url.searchParams.set("kode", kode.trim());
  }

  return url.toString();
}

function buildDraftSnapshot(draft: any) {
  try {
    return JSON.stringify({
      ...draft,
      payment: undefined,
    });
  } catch {
    return null;
  }
}

function formatIdr(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function formatDuration(days: number | undefined, isId: boolean) {
  const value = Number(days || 0);

  if (!value) return "-";
  if (value === 365) return isId ? "1 tahun" : "1 year";
  if (value % 365 === 0) {
    const years = value / 365;
    return isId ? `${years} tahun` : `${years} years`;
  }

  return isId ? `${value} hari` : `${value} days`;
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
    alignItems: "center",
    justifyContent: "center",
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
  header: {
    paddingTop: 12,
    marginBottom: 16,
  },
  kicker: {
    color: "#e6c15c",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1,
  },
  title: {
    color: "#ffffff",
    fontSize: 30,
    lineHeight: 36,
    fontWeight: "900",
    letterSpacing: -0.7,
    marginTop: 4,
  },
  subtitle: {
    color: "#b8b8b8",
    fontSize: 12.7,
    lineHeight: 19,
    fontWeight: "700",
    marginTop: 7,
  },
  sectionCard: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#303030",
    backgroundColor: "#101010",
    padding: 15,
    marginBottom: 13,
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
  summaryGrid: {
    gap: 10,
  },
  summaryBox: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#303030",
    backgroundColor: "#050505",
    padding: 12,
  },
  summaryLabel: {
    color: "#a9a9a9",
    fontSize: 11,
    fontWeight: "800",
  },
  summaryValue: {
    color: "#ffffff",
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "900",
    marginTop: 4,
  },
  warningBox: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#705d2c",
    backgroundColor: "#211a0b",
    padding: 12,
    marginTop: 12,
  },
  warningTitle: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "900",
  },
  warningText: {
    color: "#d6d6d6",
    fontSize: 11.5,
    lineHeight: 17,
    fontWeight: "700",
    marginTop: 4,
  },
  infoBox: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#1d4ed8",
    backgroundColor: "#0b1624",
    padding: 12,
    flexDirection: "row",
    gap: 9,
    marginTop: 12,
  },
  infoTextBox: {
    flex: 1,
  },
  infoTitle: {
    color: "#ffffff",
    fontSize: 12.5,
    fontWeight: "900",
  },
  infoText: {
    color: "#bfdbfe",
    fontSize: 11.3,
    lineHeight: 16,
    fontWeight: "700",
    marginTop: 4,
  },
  packageBox: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#303030",
    backgroundColor: "#050505",
    padding: 13,
  },
  packageTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  packageNameBox: {
    flex: 1,
  },
  packageName: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "900",
  },
  packageDuration: {
    color: "#a9a9a9",
    fontSize: 11.5,
    fontWeight: "700",
    marginTop: 4,
  },
  packagePrice: {
    color: "#e6c15c",
    fontSize: 13,
    fontWeight: "900",
  },
  featuresBox: {
    borderTopWidth: 1,
    borderTopColor: "#202020",
    marginTop: 13,
    paddingTop: 12,
    gap: 8,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 7,
  },
  featureText: {
    color: "#d6d6d6",
    fontSize: 11.5,
    lineHeight: 16,
    fontWeight: "700",
    flex: 1,
  },
  gatewayCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#303030",
    backgroundColor: "#050505",
    padding: 13,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 11,
    marginBottom: 10,
  },
  gatewayCardActive: {
    borderColor: "#e6c15c",
    backgroundColor: "#e6c15c",
  },
  gatewayIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#705d2c",
    backgroundColor: "#211a0b",
    alignItems: "center",
    justifyContent: "center",
  },
  gatewayIconActive: {
    borderColor: "#111111",
    backgroundColor: "rgba(255,255,255,0.35)",
  },
  gatewayTextBox: {
    flex: 1,
  },
  gatewayTitle: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "900",
  },
  gatewayTitleActive: {
    color: "#111111",
  },
  gatewayDesc: {
    color: "#a9a9a9",
    fontSize: 11.3,
    lineHeight: 16,
    fontWeight: "700",
    marginTop: 4,
  },
  gatewayDescActive: {
    color: "#111111",
  },
  totalBox: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#303030",
    backgroundColor: "#050505",
    padding: 13,
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    marginTop: 4,
  },
  totalLabel: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "900",
  },
  totalValue: {
    color: "#e6c15c",
    fontSize: 13,
    fontWeight: "900",
  },
  payButton: {
    minHeight: 50,
    borderRadius: 17,
    backgroundColor: "#e6c15c",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 14,
    marginTop: 14,
  },
  payButtonDisabled: {
    opacity: 0.45,
  },
  payButtonText: {
    color: "#111111",
    fontSize: 13,
    fontWeight: "900",
  },
  checkoutNote: {
    color: "#a9a9a9",
    fontSize: 11.3,
    lineHeight: 16,
    fontWeight: "700",
    textAlign: "center",
    marginTop: 10,
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
});