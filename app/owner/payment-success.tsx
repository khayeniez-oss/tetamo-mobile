import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
    CheckCircle2,
    Clock,
    ExternalLink,
    FileText,
    Home,
    ReceiptText,
    RotateCcw,
    ShieldCheck,
    XCircle,
} from "lucide-react-native";
import { useEffect, useMemo, useState, type ReactNode } from "react";
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
import { useListingDraft } from "../../components/listing/ListingDraftContext";
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
  property_code_snapshot: string | null;
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

type LinkedPropertyRow = {
  id: string;
  kode: string | null;
  title: string | null;
  status: string | null;
  verification_status: string | null;
};

export default function OwnerPaymentSuccessScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { clearDraft } = useListingDraft();

  const [language, setLanguage] = useState<Language>("en");
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [payment, setPayment] = useState<PaymentRow | null>(null);
  const [linkedProperty, setLinkedProperty] =
    useState<LinkedPropertyRow | null>(null);
  const [pollCount, setPollCount] = useState(0);

  const isId = language === "id";
  const locale = isId ? "id-ID" : "en-US";

  const siteUrl =
    process.env.EXPO_PUBLIC_TETAMO_SITE_URL ||
    process.env.EXPO_PUBLIC_SITE_URL ||
    "https://www.tetamo.com";

  const sessionId = readParam(params.session_id);
  const paymentId = readParam(params.payment_id);
  const urlKode = readParam(params.kode);
  const urlPayment = readParam(params.payment).toLowerCase();
  const urlMode = readParam(params.mode).toLowerCase();
  const urlStatus = readParam(params.status).toLowerCase();

  const isEditApprovalFlow =
    urlMode === "edit" && urlStatus === "pending-approval";

  const t = useMemo(() => {
    if (isId) {
      return {
        loadingSubmission: "Memuat status pengiriman...",
        loadingPayment: "Memuat status pembayaran...",
        statusLabel: "Status",
        amountLabel: "Jumlah",
        typeLabel: "Tipe",
        methodLabel: "Metode",
        codeLabel: "Kode Listing",
        createdLabel: "Dibuat",
        paidAtLabel: "Dibayar Pada",
        detailsTitle: "Detail Status",
        continuePayment: "Lanjutkan Pembayaran",
        seeListing: "Lihat Listing",
        toOwnerBilling: "Ke Tagihan Pemilik",
        toOwnerDashboard: "Ke Dashboard Pemilik",
        receiptButton: "Lihat Receipt",
        invoiceButton: "Lihat Invoice",
        addAnother: "Tambah Listing Lain",
        loginFirst: "Silakan login terlebih dahulu.",
        loadPaymentError: "Gagal memuat status pembayaran.",
        paymentNotFound: "Data pembayaran tidak ditemukan.",
        successStatusText: "berhasil",
        editApprovalDescription: (kode: string) =>
          kode && kode !== "-"
            ? `Perubahan listing ${kode} berhasil dikirim dan sekarang menunggu review admin.`
            : "Perubahan listing berhasil dikirim dan sekarang menunggu review admin.",
        editApprovalPoints: [
          "Perubahan listing sudah berhasil dikirim",
          "Status listing sekarang pending approval",
          "Anda bisa cek status terbaru dari dashboard pemilik",
        ],
        successDescriptionPending: (product: string, kode: string) =>
          kode && kode !== "-"
            ? `${product} berhasil dibayar. Listing ${kode} sudah dikirim dan sekarang menunggu review admin.`
            : `${product} berhasil dibayar dan sekarang menunggu review admin.`,
        successDescriptionLive: (product: string, kode: string) =>
          kode && kode !== "-"
            ? `${product} berhasil dibayar. Listing ${kode} sudah tampil di marketplace.`
            : `${product} berhasil dibayar dan listing sudah tampil di marketplace.`,
        successDescriptionGeneric: (product: string) =>
          `${product} berhasil dibayar.`,
        successPointsPending: [
          "Pembayaran sudah tercatat",
          "Listing sudah dikirim ke marketplace",
          "Status listing sekarang pending review",
        ],
        successPointsLive: [
          "Pembayaran sudah tercatat",
          "Listing sudah tampil di marketplace",
          "Anda bisa cek status terbaru dari dashboard pemilik",
        ],
        pendingDescription:
          "Pembayaran Anda masih sedang dikonfirmasi. Silakan tunggu sebentar atau cek tagihan pemilik.",
        pendingPoints: [
          "Status pembayaran akan diperbarui otomatis",
          "Anda bisa cek detail pembayaran di tagihan pemilik",
        ],
        expiredDescription:
          "Checkout pembayaran sudah kadaluarsa. Silakan buat pembayaran baru dari tagihan pemilik.",
        expiredPoints: [
          "Checkout lama tidak bisa digunakan lagi",
          "Silakan lanjutkan dari tagihan pemilik",
        ],
        cancelledDescription:
          "Pembayaran dibatalkan. Silakan kembali ke tagihan pemilik jika ingin mencoba lagi.",
        cancelledPoints: [
          "Tidak ada aktivasi yang dijalankan",
          "Silakan cek tagihan pemilik untuk mencoba lagi",
        ],
        refundedDescription:
          "Pembayaran sudah direfund. Silakan cek invoice atau receipt untuk detail refund.",
        refundedPoints: [
          "Detail refund tersedia di invoice atau receipt",
          "Hubungi admin jika Anda butuh klarifikasi lebih lanjut",
        ],
        failedDescription:
          "Pembayaran belum berhasil diselesaikan. Silakan cek tagihan pemilik untuk mencoba lagi.",
        failedPoints: [
          "Tidak ada aktivasi final yang dijalankan",
          "Silakan lanjutkan dari tagihan pemilik",
        ],
      };
    }

    return {
      loadingSubmission: "Loading submission status...",
      loadingPayment: "Loading payment status...",
      statusLabel: "Status",
      amountLabel: "Amount",
      typeLabel: "Type",
      methodLabel: "Method",
      codeLabel: "Listing Code",
      createdLabel: "Created",
      paidAtLabel: "Paid At",
      detailsTitle: "Status Details",
      continuePayment: "Continue Payment",
      seeListing: "See Listing",
      toOwnerBilling: "Go to Owner Billing",
      toOwnerDashboard: "Go to Owner Dashboard",
      receiptButton: "View Receipt",
      invoiceButton: "View Invoice",
      addAnother: "Add Another Listing",
      loginFirst: "Please log in first.",
      loadPaymentError: "Failed to load payment status.",
      paymentNotFound: "Payment data was not found.",
      successStatusText: "success",
      editApprovalDescription: (kode: string) =>
        kode && kode !== "-"
          ? `Your changes for listing ${kode} have been submitted and are now waiting for admin review.`
          : "Your listing changes have been submitted and are now waiting for admin review.",
      editApprovalPoints: [
        "Your listing changes were submitted successfully",
        "The listing status is now pending approval",
        "You can check the latest status from the owner dashboard",
      ],
      successDescriptionPending: (product: string, kode: string) =>
        kode && kode !== "-"
          ? `${product} was paid successfully. Listing ${kode} has been submitted and is now pending admin review.`
          : `${product} was paid successfully and is now pending admin review.`,
      successDescriptionLive: (product: string, kode: string) =>
        kode && kode !== "-"
          ? `${product} was paid successfully. Listing ${kode} is now visible in the marketplace.`
          : `${product} was paid successfully and the listing is now visible in the marketplace.`,
      successDescriptionGeneric: (product: string) =>
        `${product} was paid successfully.`,
      successPointsPending: [
        "Your payment has been recorded",
        "Your listing has been submitted to the marketplace",
        "The listing status is now pending review",
      ],
      successPointsLive: [
        "Your payment has been recorded",
        "Your listing is now visible in the marketplace",
        "You can check the latest status from the owner dashboard",
      ],
      pendingDescription:
        "Your payment is still being confirmed. Please wait a moment or check owner billing.",
      pendingPoints: [
        "The payment status will update automatically",
        "You can review the payment details in owner billing",
      ],
      expiredDescription:
        "The payment checkout has expired. Please create a new payment from owner billing.",
      expiredPoints: [
        "The old checkout can no longer be used",
        "Please continue from owner billing",
      ],
      cancelledDescription:
        "The payment was cancelled. Please return to owner billing if you want to try again.",
      cancelledPoints: [
        "No activation was completed",
        "Please check owner billing to try again",
      ],
      refundedDescription:
        "The payment has been refunded. Please check the invoice or receipt for refund details.",
      refundedPoints: [
        "Refund details are available in the invoice or receipt",
        "Contact admin if you need further clarification",
      ],
      failedDescription:
        "The payment was not completed successfully. Please check owner billing to try again.",
      failedPoints: [
        "No final activation was completed",
        "Please continue from owner billing",
      ],
    };
  }, [isId]);

  useEffect(() => {
    let ignore = false;

    async function loadPayment() {
      if (isEditApprovalFlow) {
        setPayment(null);
        setErrorMessage("");
        setLoading(false);
        return;
      }

      setLoading(true);
      setErrorMessage("");

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (ignore) return;

      if (authError || !user) {
        setPayment(null);
        setLoading(false);
        setErrorMessage(t.loginFirst);
        return;
      }

      let foundPayment: PaymentRow | null = null;

      if (paymentId) {
        const { data, error } = await supabase
          .from("payment_transactions")
          .select(
            "id, source_role, payment_type, product_id, product_name_snapshot, product_type, property_code_snapshot, amount_total, currency, status, checkout_url, stripe_checkout_session_id, paid_at, checkout_expires_at, created_at, receipt_url, hosted_invoice_url, invoice_pdf_url, metadata"
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
            "id, source_role, payment_type, product_id, product_name_snapshot, product_type, property_code_snapshot, amount_total, currency, status, checkout_url, stripe_checkout_session_id, paid_at, checkout_expires_at, created_at, receipt_url, hosted_invoice_url, invoice_pdf_url, metadata"
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
            "id, source_role, payment_type, product_id, product_name_snapshot, product_type, property_code_snapshot, amount_total, currency, status, checkout_url, stripe_checkout_session_id, paid_at, checkout_expires_at, created_at, receipt_url, hosted_invoice_url, invoice_pdf_url, metadata"
          )
          .eq("user_id", user.id)
          .eq("source_role", "owner")
          .order("created_at", { ascending: false })
          .limit(10);

        if (urlKode) {
          query = query.eq("property_code_snapshot", urlKode);
        }

        const { data, error } = await query;

        if (ignore) return;

        if (error) {
          setPayment(null);
          setLoading(false);
          setErrorMessage(error.message || t.loadPaymentError);
          return;
        }

        const rows = (data || []) as PaymentRow[];
        foundPayment = rows[0] || null;
      }

      if (!foundPayment) {
        setPayment(null);
        setLoading(false);
        setErrorMessage(t.paymentNotFound);
        return;
      }

      setPayment(foundPayment);
      setLoading(false);
    }

    void loadPayment();

    return () => {
      ignore = true;
    };
  }, [
    isEditApprovalFlow,
    paymentId,
    sessionId,
    urlKode,
    pollCount,
    t.loginFirst,
    t.loadPaymentError,
    t.paymentNotFound,
  ]);

  const resolvedStatus = useMemo(() => {
    if (isEditApprovalFlow) return "pending" as PaymentStatus;
    if (urlPayment === "cancelled") return "canceled" as PaymentStatus;
    return normalizeStatus(payment?.status);
  }, [isEditApprovalFlow, payment?.status, urlPayment]);

  const returnedFromSuccess = urlPayment === "success";
  const successfulScreen =
    isEditApprovalFlow || returnedFromSuccess || resolvedStatus === "paid";

  const resolvedKode = isEditApprovalFlow
    ? urlKode || "-"
    : payment?.property_code_snapshot || urlKode || "-";

  useEffect(() => {
    let ignore = false;

    async function loadLinkedProperty() {
      if (isEditApprovalFlow || !resolvedKode || resolvedKode === "-") {
        setLinkedProperty(null);
        return;
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (ignore || !user) return;

      const { data, error } = await supabase
        .from("properties")
        .select("id, kode, title, status, verification_status")
        .eq("user_id", user.id)
        .eq("kode", resolvedKode)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (ignore) return;

      if (error || !data) {
        setLinkedProperty(null);
        return;
      }

      setLinkedProperty(data as LinkedPropertyRow);
    }

    void loadLinkedProperty();

    return () => {
      ignore = true;
    };
  }, [isEditApprovalFlow, resolvedKode, pollCount]);

  const shouldPoll =
    !isEditApprovalFlow &&
    pollCount < 6 &&
    (Boolean(sessionId) || Boolean(paymentId) || returnedFromSuccess) &&
    resolvedStatus !== "paid";

  useEffect(() => {
    if (!shouldPoll) return;

    const timer = setTimeout(() => {
      setPollCount((prev) => prev + 1);
    }, 3000);

    return () => clearTimeout(timer);
  }, [shouldPoll]);

  const statusUI = getStateUI({
    isEditApprovalFlow,
    returnedFromSuccess,
    status: resolvedStatus,
    isId,
  });

  const detailStatusText = successfulScreen
    ? t.successStatusText
    : resolvedStatus === "checkout_created"
      ? "pending"
      : resolvedStatus;

  const productName =
    payment?.product_name_snapshot ||
    humanizePaymentType(payment?.payment_type, isId);

  const propertyPendingReview = isPropertyPendingReview(linkedProperty);

  const content = useMemo(() => {
    if (isEditApprovalFlow) {
      return {
        description: t.editApprovalDescription(resolvedKode),
        points: t.editApprovalPoints,
      };
    }

    if (successfulScreen) {
      if (payment?.payment_type === "education") {
        return {
          description: isId
            ? `${productName} berhasil dibayar. Akses premium Anda sudah diproses.`
            : `${productName} was paid successfully. Your premium access has been processed.`,
          points: isId
            ? [
                "Pembayaran sudah tercatat",
                "Akses premium akan tersedia sesuai status terbaru",
                "Anda bisa cek detail pembayaran di tagihan pemilik",
              ]
            : [
                "Your payment has been recorded",
                "Premium access will be available based on the latest status",
                "You can check payment details in owner billing",
              ],
        };
      }

      if (
        payment?.payment_type === "boost" ||
        payment?.payment_type === "spotlight"
      ) {
        return {
          description: isId
            ? `${productName} berhasil dibayar untuk listing ${resolvedKode}.`
            : `${productName} was paid successfully for listing ${resolvedKode}.`,
          points: isId
            ? [
                "Pembayaran sudah tercatat",
                "Add-on sedang atau sudah diterapkan ke listing terkait",
                "Anda bisa cek status terbaru dari dashboard pemilik",
              ]
            : [
                "Your payment has been recorded",
                "The add-on is being applied or has already been applied to the related listing",
                "You can check the latest status from the owner dashboard",
              ],
        };
      }

      if (propertyPendingReview) {
        return {
          description: t.successDescriptionPending(productName, resolvedKode),
          points: t.successPointsPending,
        };
      }

      if (linkedProperty?.id) {
        return {
          description: t.successDescriptionLive(productName, resolvedKode),
          points: t.successPointsLive,
        };
      }

      return {
        description: t.successDescriptionGeneric(productName),
        points: isId
          ? [
              "Pembayaran sudah tercatat",
              "Anda bisa cek status terbaru dari dashboard pemilik",
              "Riwayat pembayaran tersimpan di tagihan pemilik",
            ]
          : [
              "Your payment has been recorded",
              "You can check the latest status from the owner dashboard",
              "Payment history is saved in owner billing",
            ],
      };
    }

    if (resolvedStatus === "pending" || resolvedStatus === "checkout_created") {
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

    if (resolvedStatus === "canceled" || resolvedStatus === "cancelled") {
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
  }, [
    isEditApprovalFlow,
    successfulScreen,
    resolvedStatus,
    resolvedKode,
    payment?.payment_type,
    productName,
    propertyPendingReview,
    linkedProperty?.id,
    isId,
    t,
  ]);

  const shouldShowContinuePayment =
    !successfulScreen &&
    (resolvedStatus === "pending" || resolvedStatus === "checkout_created") &&
    Boolean(payment?.checkout_url);

  async function openOwnerBilling() {
    await Linking.openURL(`${siteUrl}/pemilikdashboard/tagihan`);
  }

  async function openOwnerDashboard() {
    await Linking.openURL(`${siteUrl}/pemilikdashboard`);
  }

  async function openListing() {
    if (linkedProperty?.id) {
      router.push(`/properti/${linkedProperty.id}` as any);
      return;
    }

    router.push("/(tabs)/property" as any);
  }

  async function addAnotherListing() {
    await clearDraft();
    router.replace("/owner/packages" as any);
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
            {successfulScreen
              ? isId
                ? "STATUS BERHASIL"
                : "SUCCESS STATUS"
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
            <Text style={styles.centerText}>
              {isEditApprovalFlow ? t.loadingSubmission : t.loadingPayment}
            </Text>
          </View>
        ) : null}

        {!loading && errorMessage ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        ) : null}

        {!loading && !errorMessage && !isEditApprovalFlow && payment ? (
          <View style={styles.sectionCard}>
            <SectionHeader
              icon={<ReceiptText color="#e6c15c" size={21} />}
              title={isId ? "Detail Pembayaran" : "Payment Details"}
            />

            <InfoRow label={t.statusLabel} value={detailStatusText} />
            <InfoRow
              label={t.amountLabel}
              value={formatCurrency(payment.amount_total, payment.currency, locale)}
            />
            <InfoRow label={t.typeLabel} value={productName} />
            <InfoRow
              label={t.methodLabel}
              value={humanizePaymentMethod(payment, isId)}
            />
            <InfoRow label={t.codeLabel} value={resolvedKode} />
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

        {!loading && !errorMessage && payment && successfulScreen ? (
          <View style={styles.receiptRow}>
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

        {successfulScreen ? (
          <View style={styles.actionsCard}>
            <Pressable style={styles.primaryButton} onPress={openListing}>
              <Home color="#111111" size={17} />
              <Text style={styles.primaryButtonText}>{t.seeListing}</Text>
            </Pressable>

            <Pressable style={styles.secondaryButton} onPress={openOwnerBilling}>
              <FileText color="#ffffff" size={16} />
              <Text style={styles.secondaryButtonText}>{t.toOwnerBilling}</Text>
            </Pressable>

            <Pressable style={styles.secondaryButton} onPress={openOwnerDashboard}>
              <ShieldCheck color="#ffffff" size={16} />
              <Text style={styles.secondaryButtonText}>
                {t.toOwnerDashboard}
              </Text>
            </Pressable>

            <Pressable style={styles.secondaryButton} onPress={addAnotherListing}>
              <RotateCcw color="#ffffff" size={16} />
              <Text style={styles.secondaryButtonText}>{t.addAnother}</Text>
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
              <Pressable style={styles.primaryButton} onPress={openOwnerBilling}>
                <FileText color="#111111" size={17} />
                <Text style={styles.primaryButtonText}>{t.toOwnerBilling}</Text>
              </Pressable>
            )}

            <Pressable style={styles.secondaryButton} onPress={openOwnerDashboard}>
              <ShieldCheck color="#ffffff" size={16} />
              <Text style={styles.secondaryButtonText}>
                {t.toOwnerDashboard}
              </Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
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

function humanizePaymentType(value?: string | null, isId = true) {
  const v = String(value || "").toLowerCase();

  if (v === "listing_fee") return isId ? "Iklan Listing" : "Listing Payment";
  if (v === "featured") return "Featured Listing";
  if (v === "boost") return "Boost Listing";
  if (v === "spotlight") return "Homepage Spotlight";
  if (v === "education") return "Education Pass";
  if (v === "package") return isId ? "Paket Membership" : "Membership Package";

  return isId ? "Pembayaran" : "Payment";
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

function isPropertyPendingReview(property: LinkedPropertyRow | null) {
  if (!property) return false;

  const status = String(property.status || "").toLowerCase();
  const verification = String(property.verification_status || "").toLowerCase();

  return (
    status === "pending" ||
    status === "pending_approval" ||
    verification === "pending_verification" ||
    verification === "pending_approval"
  );
}

function getStateUI({
  isEditApprovalFlow,
  returnedFromSuccess,
  status,
  isId,
}: {
  isEditApprovalFlow: boolean;
  returnedFromSuccess: boolean;
  status: PaymentStatus;
  isId: boolean;
}) {
  if (isEditApprovalFlow) {
    return {
      title: isId ? "Dikirim untuk Approval" : "Submitted for Approval",
      iconType: "success" as const,
      heroStyle: styles.heroWarning,
      iconStyle: styles.statusIconWarning,
    };
  }

  if (returnedFromSuccess || status === "paid") {
    return {
      title: isId ? "Pembayaran Berhasil" : "Payment Successful",
      iconType: "success" as const,
      heroStyle: styles.heroSuccess,
      iconStyle: styles.statusIconSuccess,
    };
  }

  if (status === "pending" || status === "checkout_created") {
    return {
      title: isId ? "Pembayaran Menunggu Konfirmasi" : "Payment Pending",
      iconType: "pending" as const,
      heroStyle: styles.heroWarning,
      iconStyle: styles.statusIconWarning,
    };
  }

  if (status === "expired") {
    return {
      title: isId ? "Pembayaran Kadaluarsa" : "Payment Expired",
      iconType: "error" as const,
      heroStyle: styles.heroWarning,
      iconStyle: styles.statusIconWarning,
    };
  }

  if (status === "canceled" || status === "cancelled") {
    return {
      title: isId ? "Pembayaran Dibatalkan" : "Payment Cancelled",
      iconType: "error" as const,
      heroStyle: styles.heroNeutral,
      iconStyle: styles.statusIconNeutral,
    };
  }

  if (status === "refunded" || status === "partially_refunded") {
    return {
      title: isId ? "Pembayaran Direfund" : "Payment Refunded",
      iconType: "pending" as const,
      heroStyle: styles.heroInfo,
      iconStyle: styles.statusIconInfo,
    };
  }

  return {
    title: isId ? "Pembayaran Gagal" : "Payment Failed",
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