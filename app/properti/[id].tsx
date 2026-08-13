import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
  useVideoPlayer,
  VideoView,
} from "expo-video";
import {
  AlertTriangle,
  ArrowLeft,
  BadgeDollarSign,
  Bath,
  BedDouble,
  Building2,
  CalendarDays,
  CarFront,
  CheckCircle2,
  Clock,
  Droplets,
  FileText,
  Flag,
  Heart,
  Home,
  Image as ImageIcon,
  Languages,
  Layers3,
  MapPin,
  MessageCircle,
  Ruler,
  ShieldAlert,
  Square,
  UserRound,
  Video,
  X,
  Zap,
} from "lucide-react-native";
import type { ReactNode } from "react";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";

import { supabase } from "../../lib/supabase";
import {
  fetchPropertyByPathKey,
  type TetamoProperty,
} from "../../services/properties";

type Language = "en" | "id";
type Currency = "IDR" | "USD" | "AUD";

type DetailChip = {
  key: string;
  label: string;
  value: string;
  icon: ReactNode;
};

type ViewingDateOption = {
  label: string;
  sublabel: string;
  value: string;
};

const tetamoLogo = require(
  "../../assets/images/tetamo-logo.png"
);

const BLACK = "#111111";
const WHITE = "#FFFFFF";
const CREAM = "#FBFAF7";

const GOLD = "#D8B46A";
const GOLD_DARK = "#B8892E";
const GOLD_SOFT = "#F3E7C5";

const BORDER = "#E8E1D7";
const MUTED = "#777169";
const SOFT = "#F5F1EA";

const TETAMO_FALLBACK_WHATSAPP =
  process.env.EXPO_PUBLIC_TETAMO_FALLBACK_WHATSAPP || "";

const VIEWING_TIME_OPTIONS = [
  "10:00",
  "11:00",
  "13:00",
  "15:00",
  "17:00",
];

const currencyRates: Record<Currency, number> = {
  IDR: 1,
  USD: 0.000061,
  AUD: 0.000094,
};

const copy = {
  en: {
    priceRequest: "Price on request",

    propertyDetails: "Property Details",
    description: "Description",
    propertyVideo: "Property Video",
    propertyVideoSub: "Watch the property video.",

    whatsapp: "WhatsApp",
    schedule: "Schedule Viewing",

    postedBy: "Posted by",

    safetyTitle: "Safety & Reports",
    safetySub: "Help us keep the Tetamo marketplace safe.",

    reportListing: "Report listing",
    reportListingSub:
      "Fake listing, incorrect information or suspicious property.",

    reportUser: "Report user",
    reportUserSub:
      "Suspicious owner, agent or account.",

    safetyNote:
      "Tetamo reviews reports to help keep the marketplace safe.",

    mortgage: "Mortgage Calculator",
    mortgageSub: "Estimate your monthly property financing.",

    propertyPrice: "Property Price",
    downPayment: "Down Payment",
    interest: "Interest %",
    years: "Years",
    estimatedMonthly: "Estimated Monthly",
    loanAmount: "Loan Amount",

    scheduleTitle: "Schedule Viewing",
    scheduleSub:
      "Choose your preferred date and time. The owner or agent will receive your request.",

    chooseDate: "Choose Date",
    chooseTime: "Choose Time",

    sendRequest: "Send Viewing Request",
    sending: "Sending...",

    completeSchedule: "Complete schedule",
    completeScheduleMessage:
      "Please choose a viewing date and time first.",

    loginRequired: "Login required",
    loginMessage:
      "Please log in first to create a viewing schedule.",

    successTitle: "Viewing request sent",
    successMessage:
      "Your viewing request has been sent. The owner or agent will receive it in their dashboard.",

    errorTitle: "Failed to send schedule",
    errorMessage:
      "Viewing request could not be sent. Please try again.",

    loading: "Loading property...",
    notFound: "Property not found.",
    back: "Back",

    listingCode: "Listing Code",

    type: "Type",
    bedrooms: "Bedrooms",
    bathrooms: "Bathrooms",
    land: "Land",
    building: "Building",
    furnishing: "Furnishing",
    floors: "Floors",
    parking: "Parking",
    certificate: "Certificate",
    electricity: "Electricity",
    water: "Water",
    rental: "Rental",
  },

  id: {
    priceRequest: "Hubungi untuk harga",

    propertyDetails: "Detail Properti",
    description: "Deskripsi",
    propertyVideo: "Video Properti",
    propertyVideoSub: "Lihat video properti ini.",

    whatsapp: "WhatsApp",
    schedule: "Jadwalkan Viewing",

    postedBy: "Diposting oleh",

    safetyTitle: "Keamanan & Laporan",
    safetySub:
      "Bantu kami menjaga marketplace Tetamo tetap aman.",

    reportListing: "Laporkan listing",
    reportListingSub:
      "Listing palsu, informasi salah atau properti mencurigakan.",

    reportUser: "Laporkan pengguna",
    reportUserSub:
      "Pemilik, agen atau akun yang mencurigakan.",

    safetyNote:
      "Tetamo meninjau laporan untuk membantu menjaga marketplace tetap aman.",

    mortgage: "Kalkulator KPR",
    mortgageSub: "Estimasi pembiayaan properti bulanan.",

    propertyPrice: "Harga Properti",
    downPayment: "Uang Muka",
    interest: "Bunga %",
    years: "Tahun",
    estimatedMonthly: "Estimasi Cicilan",
    loanAmount: "Jumlah Pinjaman",

    scheduleTitle: "Jadwalkan Viewing",
    scheduleSub:
      "Pilih tanggal dan waktu yang Anda inginkan. Pemilik atau agen akan menerima permintaan Anda.",

    chooseDate: "Pilih Tanggal",
    chooseTime: "Pilih Waktu",

    sendRequest: "Kirim Permintaan Viewing",
    sending: "Mengirim...",

    completeSchedule: "Lengkapi jadwal",
    completeScheduleMessage:
      "Silakan pilih tanggal dan waktu viewing terlebih dahulu.",

    loginRequired: "Login diperlukan",
    loginMessage:
      "Silakan login terlebih dahulu untuk membuat jadwal viewing.",

    successTitle: "Jadwal viewing terkirim",
    successMessage:
      "Permintaan viewing berhasil dikirim. Pemilik atau agen akan menerima jadwal ini di dashboard.",

    errorTitle: "Gagal mengirim jadwal",
    errorMessage:
      "Jadwal viewing belum bisa dikirim. Silakan coba lagi.",

    loading: "Memuat properti...",
    notFound: "Properti tidak ditemukan.",
    back: "Kembali",

    listingCode: "Kode Listing",

    type: "Tipe",
    bedrooms: "Kamar Tidur",
    bathrooms: "Kamar Mandi",
    land: "Tanah",
    building: "Bangunan",
    furnishing: "Furnishing",
    floors: "Lantai",
    parking: "Parkir",
    certificate: "Sertifikat",
    electricity: "Listrik",
    water: "Air",
    rental: "Sewa",
  },
};

export default function MobilePropertyDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { width } = useWindowDimensions();

  const galleryRef = useRef<ScrollView | null>(null);

  const [language, setLanguage] =
    useState<Language>("en");

  const [currency, setCurrency] =
    useState<Currency>("IDR");

  const [property, setProperty] =
    useState<TetamoProperty | null>(null);

  const [isLoading, setIsLoading] =
    useState(true);

  const [galleryIndex, setGalleryIndex] =
    useState(0);

  const [isScheduleOpen, setIsScheduleOpen] =
    useState(false);

  const [selectedDate, setSelectedDate] =
    useState("");

  const [selectedTime, setSelectedTime] =
    useState("");

  const [submittingSchedule, setSubmittingSchedule] =
    useState(false);

  const t = copy[language];

  /*
   * ==========================================
   * ROUTE
   * ==========================================
   */

  const pathKey = useMemo(() => {
    const value = params.id;

    if (Array.isArray(value)) {
      return value[0] || "";
    }

    return String(value || "");
  }, [params.id]);

  const showSchedule = useMemo(() => {
    const value = params.schedule;

    if (Array.isArray(value)) {
      return value[0] === "1";
    }

    return value === "1";
  }, [params.schedule]);

  /*
   * ==========================================
   * LOAD PROPERTY
   * ==========================================
   */

  useEffect(() => {
    let mounted = true;

    async function loadProperty() {
      try {
        setIsLoading(true);

        const row = await fetchPropertyByPathKey(
          decodeURIComponent(pathKey)
        );

        if (!mounted) return;

        setProperty(row);
        setGalleryIndex(0);

        const firstImage =
          row?.images?.[0] || row?.image;

        if (firstImage) {
          void Image.prefetch(firstImage).catch(() => {});
        }
      } catch (error) {
        console.log(
          "Tetamo mobile detail error:",
          error
        );

        if (!mounted) return;

        setProperty(null);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    void loadProperty();

    return () => {
      mounted = false;
    };
  }, [pathKey]);

  useEffect(() => {
    if (showSchedule) {
      setIsScheduleOpen(true);
    }
  }, [showSchedule]);

  /*
   * ==========================================
   * PROPERTY TEXT
   * ==========================================
   */

  const title = property
    ? getPropertyTitle(property, language)
    : "";

  const description = property
    ? language === "id"
      ? property.descriptionId ||
        property.descriptionEn ||
        ""
      : property.descriptionEn ||
        property.descriptionId ||
        ""
    : "";

  const displayPrice = useMemo(() => {
    if (!property) return "";

    return formatPropertyPrice(
      property.priceIdr,
      property.rentalType,
      currency,
      language,
      t.priceRequest
    );
  }, [
    property,
    currency,
    language,
    t.priceRequest,
  ]);

  /*
   * ==========================================
   * REAL GALLERY
   * ==========================================
   */

  const galleryImages = useMemo(() => {
    if (!property) return [];

    const images =
      property.images?.length
        ? property.images
        : property.image
          ? [property.image]
          : [];

    return images
      .map((item) => String(item || "").trim())
      .filter(Boolean);
  }, [property]);

  /*
   * ==========================================
   * DETAIL DATA
   * ==========================================
   */

  const detailChips = useMemo(() => {
    if (!property) return [];

    const chips: DetailChip[] = [];

    addChip(chips, {
      key: "type",
      label: t.type,
      value: formatPropertyType(
        property.propertyType,
        language
      ),
      icon: <Home color={BLACK} size={18} />,
    });

    addChip(chips, {
      key: "bedrooms",
      label: t.bedrooms,
      value: property.beds
        ? String(property.beds)
        : "",
      icon: (
        <BedDouble
          color={BLACK}
          size={18}
        />
      ),
    });

    addChip(chips, {
      key: "bathrooms",
      label: t.bathrooms,
      value: property.baths
        ? String(property.baths)
        : "",
      icon: (
        <Bath
          color={BLACK}
          size={18}
        />
      ),
    });

    addChip(chips, {
      key: "land",
      label: t.land,
      value: property.landSize
        ? `${formatNumber(
            property.landSize
          )} ${formatLandUnit(
            property.landUnit
          )}`
        : "",
      icon: (
        <Square
          color={BLACK}
          size={18}
        />
      ),
    });

    addChip(chips, {
      key: "building",
      label: t.building,
      value: property.buildingSize
        ? `${formatNumber(
            property.buildingSize
          )} m²`
        : property.size
          ? `${formatNumber(property.size)} m²`
          : "",
      icon: (
        <Ruler
          color={BLACK}
          size={18}
        />
      ),
    });

    addChip(chips, {
      key: "furnishing",
      label: t.furnishing,
      value: formatSimpleText(
        property.furnishing
      ),
      icon: <Home color={BLACK} size={18} />,
    });

    addChip(chips, {
      key: "floors",
      label: t.floors,
      value: property.floors
        ? String(property.floors)
        : "",
      icon: (
        <Layers3
          color={BLACK}
          size={18}
        />
      ),
    });

    addChip(chips, {
      key: "parking",
      label: t.parking,
      value:
        property.parkingOption ||
        (property.parking
          ? String(property.parking)
          : ""),
      icon: (
        <CarFront
          color={BLACK}
          size={18}
        />
      ),
    });

    addChip(chips, {
      key: "certificate",
      label: t.certificate,
      value: property.certificate || "",
      icon: (
        <FileText
          color={BLACK}
          size={18}
        />
      ),
    });

    addChip(chips, {
      key: "electricity",
      label: t.electricity,
      value: property.electricity || "",
      icon: <Zap color={BLACK} size={18} />,
    });

    addChip(chips, {
      key: "water",
      label: t.water,
      value: property.waterSource || "",
      icon: (
        <Droplets
          color={BLACK}
          size={18}
        />
      ),
    });

    addChip(chips, {
      key: "rental",
      label: t.rental,
      value: formatRentalType(
        property.rentalType,
        language
      ),
      icon: (
        <Clock
          color={BLACK}
          size={18}
        />
      ),
    });

    return chips;
  }, [property, language, t]);

  const viewingDateOptions = useMemo(
    () => getViewingDateOptions(language),
    [language]
  );

  /*
   * ==========================================
   * WHATSAPP
   * ==========================================
   */

  const openWhatsapp = () => {
    if (!property) return;

    const phone =
      normalizeWhatsappPhone(
        property.contactPhone
      ) || TETAMO_FALLBACK_WHATSAPP;

    if (!phone) return;

    const receiver =
      property.contactName || "Tetamo";

    const message =
      language === "id"
        ? `Halo ${receiver}, saya tertarik dengan properti ini di TETAMO.

Properti: ${title}
Kode: ${property.kode || "-"}
Lokasi: ${property.location || "-"}
Harga: ${displayPrice}

Apakah properti ini masih tersedia?`
        : `Hello ${receiver}, I'm interested in this property on TETAMO.

Property: ${title}
Code: ${property.kode || "-"}
Location: ${property.location || "-"}
Price: ${displayPrice}

Is this property still available?`;

    void Linking.openURL(
      `https://wa.me/${phone}?text=${encodeURIComponent(
        message
      )}`
    );
  };

  /*
   * ==========================================
   * REPORTS
   * ==========================================
   */

  const openReportListing = () => {
    if (!property) return;

    router.push(
      `/report/listing?property_id=${encodeURIComponent(
        property.id || ""
      )}&listing_code=${encodeURIComponent(
        property.kode || ""
      )}&title=${encodeURIComponent(
        title || ""
      )}&location=${encodeURIComponent(
        property.location || ""
      )}` as any
    );
  };

  const openReportUser = () => {
    if (!property) return;

    const contactUserId =
      String(
        property.contactUserId ||
          (property as any).contact_user_id ||
          (property as any).ownerId ||
          (property as any).owner_id ||
          (property as any).agentId ||
          (property as any).agent_id ||
          property.userId ||
          ""
      ) || "";

    router.push(
      `/report/user?reported_user_id=${encodeURIComponent(
        contactUserId
      )}&name=${encodeURIComponent(
        property.contactName || "Tetamo"
      )}&role=${encodeURIComponent(
        property.contactRole ||
          property.contactAgency ||
          "User"
      )}&listing_code=${encodeURIComponent(
        property.kode || ""
      )}` as any
    );
  };

  /*
   * ==========================================
   * VIEWING REQUEST
   * ==========================================
   */

  async function submitSchedule() {
    if (!property) return;

    if (!selectedDate || !selectedTime) {
      Alert.alert(
        t.completeSchedule,
        t.completeScheduleMessage
      );

      return;
    }

    try {
      setSubmittingSchedule(true);

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user?.id) {
        Alert.alert(
          t.loginRequired,
          t.loginMessage
        );

        router.push(
          `/login?next=${encodeURIComponent(
            `/properti/${encodeURIComponent(
              pathKey
            )}?schedule=1`
          )}` as any
        );

        return;
      }

      const { data: senderProfile } =
        await supabase
          .from("profiles")
          .select(
            "full_name, phone, email"
          )
          .eq("id", user.id)
          .maybeSingle();

      const receiverUserId =
        getReceiverUserId(property);

      const receiverRole =
        getReceiverRole(property);

      const message =
        language === "id"
          ? `Request viewing untuk ${title} pada ${selectedDate} jam ${selectedTime}`
          : `Viewing request for ${title} on ${selectedDate} at ${selectedTime}`;

      const leadPayload = {
        property_id: property.id,
        property_code:
          property.kode || null,
        property_title:
          title || null,

        sender_user_id: user.id,

        sender_name:
          (senderProfile as any)
            ?.full_name ||
          (typeof user.user_metadata
            ?.full_name === "string"
            ? user.user_metadata
                .full_name
            : "Tetamo User"),

        sender_email:
          (senderProfile as any)
            ?.email ||
          user.email ||
          null,

        sender_phone:
          (senderProfile as any)
            ?.phone || null,

        receiver_user_id:
          receiverUserId || null,

        receiver_name:
          property.contactName || null,

        receiver_role: receiverRole,

        assigned_admin_user_id:
          null,

        admin_visible: true,

        lead_type: "viewing",
        source: "viewing_form",

        message,

        viewing_date: selectedDate,
        viewing_time: selectedTime,

        viewing_status: "scheduled",

        status: "new",
        priority: "normal",

        notes: null,
      };

      const { error } = await supabase
        .from("leads")
        .insert(leadPayload);

      if (error) {
        console.error(
          "Tetamo mobile viewing lead insert error:",
          error
        );

        Alert.alert(
          t.errorTitle,
          error.message || t.errorMessage
        );

        return;
      }

      Alert.alert(
        t.successTitle,
        t.successMessage
      );

      setIsScheduleOpen(false);
      setSelectedDate("");
      setSelectedTime("");
    } catch (error: any) {
      console.error(
        "Tetamo mobile submit schedule error:",
        error
      );

      Alert.alert(
        t.errorTitle,
        error?.message || t.errorMessage
      );
    } finally {
      setSubmittingSchedule(false);
    }
  }

  /*
   * ==========================================
   * GALLERY
   * ==========================================
   */

  const handleGalleryScrollEnd = (
    event: any
  ) => {
    const nextIndex = Math.round(
      event.nativeEvent.contentOffset.x /
        width
    );

    setGalleryIndex(
      Math.max(
        0,
        Math.min(
          nextIndex,
          galleryImages.length - 1
        )
      )
    );
  };

  const goToGalleryImage = (
    index: number
  ) => {
    setGalleryIndex(index);

    galleryRef.current?.scrollTo({
      x: index * width,
      animated: true,
    });
  };

  /*
   * ==========================================
   * LOADING
   * ==========================================
   */

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="dark" />

        <View style={styles.loadingBox}>
          <ActivityIndicator
            color={GOLD_DARK}
          />

          <Text style={styles.loadingText}>
            {t.loading}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  /*
   * ==========================================
   * NOT FOUND
   * ==========================================
   */

  if (!property) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="dark" />

        <View style={styles.loadingBox}>
          <View style={styles.notFoundIcon}>
            <Building2
              color={GOLD_DARK}
              size={28}
            />
          </View>

          <Text style={styles.notFoundText}>
            {t.notFound}
          </Text>

          <Pressable
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ArrowLeft
              color={BLACK}
              size={16}
            />

            <Text
              style={styles.backButtonText}
            >
              {t.back}
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const promotion =
    getPromotionBadge(property);

  const rentalLabel =
    getRentalTypeLabel(
      property,
      language
    );

  const listingLabel =
    getListingTypeLabel(
      property,
      language
    );

  const showMortgage =
    shouldShowMortgage(property);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />

      {/* ====================================
          REAL HEADER — ABOVE PHOTO
      ==================================== */}

      <View style={styles.detailHeader}>
        <Pressable
          style={styles.headerBackButton}
          onPress={() => router.back()}
        >
          <ArrowLeft
            color={BLACK}
            size={18}
          />
        </Pressable>

        <View style={styles.headerControls}>
          {/* LANGUAGE */}

          <View style={styles.headerOptionGroup}>
            <Languages
              color={GOLD_DARK}
              size={14}
            />

            {(
              ["en", "id"] as Language[]
            ).map((item) => {
              const active =
                language === item;

              return (
                <Pressable
                  key={item}
                  style={[
                    styles.headerLanguageSegment,
                    active &&
                      styles.headerSegmentActive,
                  ]}
                  onPress={() =>
                    setLanguage(item)
                  }
                >
                  <Text
                    style={[
                      styles.headerSegmentText,
                      active &&
                        styles.headerSegmentTextActive,
                    ]}
                  >
                    {item.toUpperCase()}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* CURRENCY */}

          <View style={styles.headerOptionGroup}>
            <BadgeDollarSign
              color={GOLD_DARK}
              size={14}
            />

            {(
              [
                "IDR",
                "USD",
                "AUD",
              ] as Currency[]
            ).map((item) => {
              const active =
                currency === item;

              return (
                <Pressable
                  key={item}
                  style={[
                    styles.headerCurrencySegment,
                    active &&
                      styles.headerSegmentActive,
                  ]}
                  onPress={() =>
                    setCurrency(item)
                  }
                >
                  <Text
                    style={[
                      styles.headerCurrencyText,
                      active &&
                        styles.headerSegmentTextActive,
                    ]}
                  >
                    {item}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* HEART */}

          <Pressable
            style={styles.headerHeartButton}
            onPress={() => {}}
          >
            <Heart
              color={BLACK}
              size={18}
              strokeWidth={2}
            />
          </Pressable>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={
          styles.content
        }
        showsVerticalScrollIndicator={false}
      >
        {/* ====================================
            GALLERY — PHOTO ONLY
        ==================================== */}

        <View style={styles.galleryWrap}>
          {galleryImages.length > 0 ? (
            <ScrollView
              ref={galleryRef}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={
                false
              }
              onMomentumScrollEnd={
                handleGalleryScrollEnd
              }
              scrollEventThrottle={16}
            >
              {galleryImages.map(
                (imageUrl, index) => (
                  <PropertyGalleryImage
                    key={`${imageUrl}-${index}`}
                    uri={imageUrl}
                    width={width}
                  />
                )
              )}
            </ScrollView>
          ) : (
            <View
              style={[
                styles.galleryPlaceholder,
                { width },
              ]}
            >
              <Building2
                color="#BFB7AD"
                size={42}
              />

              <Text
                style={
                  styles.galleryPlaceholderText
                }
              >
                TETAMO
              </Text>
            </View>
          )}

          {/* TETAMO BRAND */}

          <View style={styles.galleryBrand}>
            <Image
              source={tetamoLogo}
              style={
                styles.galleryBrandLogo
              }
              resizeMode="contain"
            />

            <Text
              style={
                styles.galleryBrandText
              }
            >
              TETAMO
            </Text>
          </View>

          {/* PHOTO COUNTER */}

          {galleryImages.length > 0 ? (
            <View
              style={
                styles.galleryCounter
              }
            >
              <ImageIcon
                color={WHITE}
                size={12}
              />

              <Text
                style={
                  styles.galleryCounterText
                }
              >
                {galleryIndex + 1} /{" "}
                {galleryImages.length}
              </Text>
            </View>
          ) : null}
        </View>

        {/* ====================================
            THUMBNAILS
        ==================================== */}

        {galleryImages.length > 1 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={
              false
            }
            contentContainerStyle={
              styles.thumbnailRow
            }
          >
            {galleryImages.map(
              (imageUrl, index) => (
                <Pressable
                  key={`${imageUrl}-thumb-${index}`}
                  style={[
                    styles.thumbnailButton,
                    galleryIndex === index &&
                      styles.thumbnailButtonActive,
                  ]}
                  onPress={() =>
                    goToGalleryImage(index)
                  }
                >
                  <Image
                    source={{
                      uri: imageUrl,
                      cache: "force-cache",
                    }}
                    style={
                      styles.thumbnailImage
                    }
                  />
                </Pressable>
              )
            )}
          </ScrollView>
        ) : null}

        <View style={styles.pageContent}>
          {/* ====================================
              PROPERTY SUMMARY
          ==================================== */}

          <View style={styles.summaryCard}>
            <View style={styles.badgeRow}>
              <View
                style={
                  styles.listingBadge
                }
              >
                <Text
                  style={
                    styles.listingBadgeText
                  }
                >
                  {listingLabel}
                </Text>
              </View>

              {rentalLabel ? (
                <View
                  style={
                    styles.rentalBadge
                  }
                >
                  <Text
                    style={
                      styles.rentalBadgeText
                    }
                  >
                    {rentalLabel}
                  </Text>
                </View>
              ) : null}

              {promotion ? (
                <View
                  style={[
                    styles.promotionBadge,
                    {
                      backgroundColor:
                        promotion.background,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.promotionBadgeText,
                      {
                        color:
                          promotion.textColor,
                      },
                    ]}
                  >
                    {promotion.label}
                  </Text>
                </View>
              ) : null}
            </View>

            <Text
              style={styles.summaryPrice}
              numberOfLines={1}
            >
              {displayPrice}
            </Text>

            <Text
              style={styles.summaryTitle}
            >
              {title}
            </Text>

            <View
              style={
                styles.summaryLocation
              }
            >
              <MapPin
                color={GOLD_DARK}
                size={14}
              />

              <Text
                style={
                  styles.summaryLocationText
                }
              >
                {property.location ||
                  property.area ||
                  "-"}
              </Text>
            </View>

            {property.kode ? (
              <View
                style={
                  styles.listingCodeRow
                }
              >
                <Text
                  style={
                    styles.listingCodeLabel
                  }
                >
                  {t.listingCode}
                </Text>

                <Text
                  style={
                    styles.listingCodeValue
                  }
                >
                  {property.kode}
                </Text>
              </View>
            ) : null}

            <PrimaryMeta
              property={property}
            />

            <View style={styles.actionRow}>
              <Pressable
                style={
                  styles.whatsappButton
                }
                onPress={openWhatsapp}
              >
                <MessageCircle
                  color="#14834B"
                  size={16}
                />

                <Text
                  style={
                    styles.whatsappButtonText
                  }
                >
                  {t.whatsapp}
                </Text>
              </Pressable>

              <Pressable
                style={
                  styles.scheduleButton
                }
                onPress={() =>
                  setIsScheduleOpen(true)
                }
              >
                <CalendarDays
                  color={BLACK}
                  size={16}
                />

                <Text
                  style={
                    styles.scheduleButtonText
                  }
                >
                  {t.schedule}
                </Text>
              </Pressable>
            </View>
          </View>

          {/* ====================================
              REAL VIDEO
          ==================================== */}

          {property.videoUrl ? (
            <View style={styles.sectionCard}>
              <View
                style={styles.sectionHeader}
              >
                <View
                  style={
                    styles.sectionHeaderCopy
                  }
                >
                  <Text
                    style={
                      styles.sectionTitle
                    }
                  >
                    {t.propertyVideo}
                  </Text>

                  <Text
                    style={
                      styles.sectionSubtitle
                    }
                  >
                    {t.propertyVideoSub}
                  </Text>
                </View>

                <View
                  style={
                    styles.sectionIcon
                  }
                >
                  <Video
                    color={GOLD_DARK}
                    size={19}
                  />
                </View>
              </View>

              <PropertyVideoPlayer
                uri={property.videoUrl}
              />
            </View>
          ) : null}

          {/* ====================================
              DETAILS
          ==================================== */}

          {detailChips.length > 0 ? (
            <View style={styles.sectionCard}>
              <Text
                style={
                  styles.sectionTitle
                }
              >
                {t.propertyDetails}
              </Text>

              <View
                style={
                  styles.detailsGrid
                }
              >
                {detailChips.map(
                  (chip) => (
                    <DetailCard
                      key={chip.key}
                      chip={chip}
                    />
                  )
                )}
              </View>
            </View>
          ) : null}

          {/* ====================================
              DESCRIPTION
          ==================================== */}

          <View style={styles.sectionCard}>
            <Text
              style={
                styles.sectionTitle
              }
            >
              {t.description}
            </Text>

            <Text
              style={
                styles.descriptionText
              }
            >
              {description ||
                (language === "id"
                  ? "Deskripsi properti belum tersedia."
                  : "Property description is not available yet.")}
            </Text>
          </View>

          {/* ====================================
              MORTGAGE
              SALE / AUCTION ONLY
          ==================================== */}

          {showMortgage &&
          property.priceIdr > 0 ? (
            <MortgageCalculatorPanel
              language={language}
              priceIdr={
                property.priceIdr
              }
            />
          ) : null}

          {/* ====================================
              SELLER / AGENT
          ==================================== */}

          <View
            style={
              styles.contactPanel
            }
          >
            <View
              style={styles.contactRow}
            >
              <ContactAvatar
                photoUrl={
                  property.contactPhotoUrl
                }
                name={
                  property.contactName ||
                  "Tetamo"
                }
              />

              <View
                style={
                  styles.contactCopy
                }
              >
                <Text
                  style={
                    styles.contactLabel
                  }
                >
                  {t.postedBy}
                </Text>

                <Text
                  style={
                    styles.contactName
                  }
                  numberOfLines={1}
                >
                  {property.contactName ||
                    "Tetamo"}
                </Text>

                <Text
                  style={
                    styles.contactAgency
                  }
                  numberOfLines={1}
                >
                  {property.contactAgency ||
                    property.contactRole ||
                    "Tetamo"}
                </Text>
              </View>
            </View>

            <Pressable
              style={
                styles.contactWhatsapp
              }
              onPress={openWhatsapp}
            >
              <MessageCircle
                color="#14834B"
                size={15}
              />

              <Text
                style={
                  styles.contactWhatsappText
                }
              >
                WhatsApp
              </Text>
            </Pressable>
          </View>

          {/* ====================================
              SAFETY & REPORTS
              KEEP FOR APP REVIEW + USERS
          ==================================== */}

          <SafetyReportsPanel
            language={language}
            onReportListing={
              openReportListing
            }
            onReportUser={
              openReportUser
            }
          />
        </View>
      </ScrollView>

      {/* ====================================
          VIEWING MODAL
      ==================================== */}

      <Modal
        visible={isScheduleOpen}
        transparent
        animationType="fade"
        onRequestClose={() =>
          setIsScheduleOpen(false)
        }
      >
        <View style={styles.modalBackdrop}>
          <View
            style={
              styles.scheduleModal
            }
          >
            <View
              style={
                styles.scheduleModalHeader
              }
            >
              <View
                style={
                  styles.scheduleModalTitleBox
                }
              >
                <Text
                  style={
                    styles.scheduleModalEyebrow
                  }
                >
                  TETAMO
                </Text>

                <Text
                  style={
                    styles.scheduleModalTitle
                  }
                >
                  {t.scheduleTitle}
                </Text>

                <Text
                  style={
                    styles.scheduleModalSub
                  }
                  numberOfLines={2}
                >
                  {title}
                </Text>
              </View>

              <Pressable
                style={
                  styles.closeButton
                }
                onPress={() =>
                  setIsScheduleOpen(false)
                }
              >
                <X
                  color={BLACK}
                  size={18}
                />
              </Pressable>
            </View>

            <Text
              style={
                styles.scheduleIntroduction
              }
            >
              {t.scheduleSub}
            </Text>

            <View
              style={styles.scheduleBlock}
            >
              <Text
                style={
                  styles.scheduleLabel
                }
              >
                {t.chooseDate}
              </Text>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={
                  false
                }
                contentContainerStyle={
                  styles.dateChipRow
                }
              >
                {viewingDateOptions.map(
                  (option) => {
                    const active =
                      selectedDate ===
                      option.value;

                    return (
                      <Pressable
                        key={option.value}
                        style={[
                          styles.dateChip,
                          active &&
                            styles.dateChipActive,
                        ]}
                        onPress={() =>
                          setSelectedDate(
                            option.value
                          )
                        }
                      >
                        <Text
                          style={[
                            styles.dateChipLabel,
                            active &&
                              styles.dateChipLabelActive,
                          ]}
                        >
                          {option.label}
                        </Text>

                        <Text
                          style={[
                            styles.dateChipSub,
                            active &&
                              styles.dateChipSubActive,
                          ]}
                        >
                          {option.sublabel}
                        </Text>
                      </Pressable>
                    );
                  }
                )}
              </ScrollView>
            </View>

            <View
              style={styles.scheduleBlock}
            >
              <Text
                style={
                  styles.scheduleLabel
                }
              >
                {t.chooseTime}
              </Text>

              <View
                style={
                  styles.timeChipGrid
                }
              >
                {VIEWING_TIME_OPTIONS.map(
                  (time) => {
                    const active =
                      selectedTime ===
                      time;

                    return (
                      <Pressable
                        key={time}
                        style={[
                          styles.timeChip,
                          active &&
                            styles.timeChipActive,
                        ]}
                        onPress={() =>
                          setSelectedTime(time)
                        }
                      >
                        <Clock
                          color={
                            active
                              ? BLACK
                              : GOLD_DARK
                          }
                          size={13}
                        />

                        <Text
                          style={[
                            styles.timeChipText,
                            active &&
                              styles.timeChipTextActive,
                          ]}
                        >
                          {time}
                        </Text>
                      </Pressable>
                    );
                  }
                )}
              </View>
            </View>

            {selectedDate &&
            selectedTime ? (
              <View
                style={
                  styles.selectedScheduleBox
                }
              >
                <CheckCircle2
                  color="#25834C"
                  size={16}
                />

                <Text
                  style={
                    styles.selectedScheduleText
                  }
                >
                  {formatDisplayDate(
                    selectedDate,
                    language
                  )}{" "}
                  • {selectedTime}
                </Text>
              </View>
            ) : null}

            <Pressable
              style={[
                styles.submitButton,
                submittingSchedule &&
                  styles.submitButtonDisabled,
              ]}
              disabled={submittingSchedule}
              onPress={submitSchedule}
            >
              {submittingSchedule ? (
                <ActivityIndicator
                  color={BLACK}
                />
              ) : null}

              <Text
                style={
                  styles.submitButtonText
                }
              >
                {submittingSchedule
                  ? t.sending
                  : t.sendRequest}
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

/*
 * =================================================
 * REAL VIDEO PLAYER
 * =================================================
 */

function PropertyVideoPlayer({
  uri,
}: {
  uri: string;
}) {
  const player = useVideoPlayer(
    uri,
    (videoPlayer) => {
      videoPlayer.loop = false;
    }
  );

  return (
    <View style={styles.videoFrame}>
      <VideoView
        player={player}
        style={styles.videoView}
        contentFit="contain"
        nativeControls
        allowsFullscreen
      />
    </View>
  );
}

/*
 * =================================================
 * GALLERY IMAGE
 * =================================================
 */

function PropertyGalleryImage({
  uri,
  width,
}: {
  uri: string;
  width: number;
}) {
  const [failed, setFailed] =
    useState(false);

  useEffect(() => {
    setFailed(false);
  }, [uri]);

  if (!uri || failed) {
    return (
      <View
        style={[
          styles.galleryPlaceholder,
          { width },
        ]}
      >
        <Building2
          color="#BFB7AD"
          size={42}
        />
      </View>
    );
  }

  return (
    <Image
      source={{
        uri,
        cache: "force-cache",
      }}
      style={[
        styles.galleryImage,
        { width },
      ]}
      resizeMode="cover"
      onError={() => setFailed(true)}
    />
  );
}

/*
 * =================================================
 * PRIMARY META
 * =================================================
 */

function PrimaryMeta({
  property,
}: {
  property: TetamoProperty;
}) {
  const beds = Number(
    property.beds || 0
  );

  const baths = Number(
    property.baths || 0
  );

  const size = Number(
    property.buildingSize ||
      property.size ||
      0
  );

  if (!beds && !baths && !size) {
    return null;
  }

  return (
    <View
      style={styles.primaryMetaRow}
    >
      {beds > 0 ? (
        <View
          style={
            styles.primaryMetaItem
          }
        >
          <BedDouble
            color={GOLD_DARK}
            size={15}
          />

          <Text
            style={
              styles.primaryMetaText
            }
          >
            {beds}
          </Text>
        </View>
      ) : null}

      {baths > 0 ? (
        <View
          style={
            styles.primaryMetaItem
          }
        >
          <Bath
            color={GOLD_DARK}
            size={15}
          />

          <Text
            style={
              styles.primaryMetaText
            }
          >
            {baths}
          </Text>
        </View>
      ) : null}

      {size > 0 ? (
        <View
          style={
            styles.primaryMetaItem
          }
        >
          <Ruler
            color={GOLD_DARK}
            size={15}
          />

          <Text
            style={
              styles.primaryMetaText
            }
          >
            {formatNumber(size)} m²
          </Text>
        </View>
      ) : null}
    </View>
  );
}

/*
 * =================================================
 * DETAIL CARD
 * =================================================
 */

function DetailCard({
  chip,
}: {
  chip: DetailChip;
}) {
  return (
    <View style={styles.detailCard}>
      <View style={styles.detailIcon}>
        {chip.icon}
      </View>

      <View style={styles.detailCopy}>
        <Text
          style={styles.detailLabel}
        >
          {chip.label}
        </Text>

        <Text
          style={styles.detailValue}
          numberOfLines={2}
        >
          {chip.value}
        </Text>
      </View>
    </View>
  );
}

/*
 * =================================================
 * CONTACT AVATAR
 * =================================================
 */

function ContactAvatar({
  photoUrl,
  name,
}: {
  photoUrl?: string | null;
  name: string;
}) {
  const [failed, setFailed] =
    useState(false);

  useEffect(() => {
    setFailed(false);
  }, [photoUrl]);

  if (photoUrl && !failed) {
    return (
      <Image
        source={{ uri: photoUrl }}
        style={styles.contactPhoto}
        onError={() =>
          setFailed(true)
        }
      />
    );
  }

  return (
    <View
      style={
        styles.contactInitials
      }
    >
      <Text
        style={
          styles.contactInitialsText
        }
      >
        {getInitials(name)}
      </Text>
    </View>
  );
}

/*
 * =================================================
 * SAFETY & REPORTS
 * DO NOT REMOVE
 * =================================================
 */

function SafetyReportsPanel({
  language,
  onReportListing,
  onReportUser,
}: {
  language: Language;
  onReportListing: () => void;
  onReportUser: () => void;
}) {
  const t = copy[language];

  return (
    <View style={styles.safetyPanel}>
      <View style={styles.safetyHeader}>
        <View style={styles.safetyIcon}>
          <ShieldAlert
            color={GOLD_DARK}
            size={21}
          />
        </View>

        <View
          style={
            styles.safetyHeaderCopy
          }
        >
          <Text
            style={styles.safetyTitle}
          >
            {t.safetyTitle}
          </Text>

          <Text
            style={styles.safetySub}
          >
            {t.safetySub}
          </Text>
        </View>
      </View>

      <View
        style={styles.safetyActions}
      >
        <Pressable
          style={styles.safetyButton}
          onPress={onReportListing}
        >
          <View
            style={
              styles.safetyButtonIcon
            }
          >
            <Flag
              color={GOLD_DARK}
              size={16}
            />
          </View>

          <View
            style={
              styles.safetyButtonCopy
            }
          >
            <Text
              style={
                styles.safetyButtonTitle
              }
            >
              {t.reportListing}
            </Text>

            <Text
              style={
                styles.safetyButtonSub
              }
            >
              {t.reportListingSub}
            </Text>
          </View>
        </Pressable>

        <Pressable
          style={styles.safetyButton}
          onPress={onReportUser}
        >
          <View
            style={
              styles.safetyButtonIcon
            }
          >
            <UserRound
              color={GOLD_DARK}
              size={16}
            />
          </View>

          <View
            style={
              styles.safetyButtonCopy
            }
          >
            <Text
              style={
                styles.safetyButtonTitle
              }
            >
              {t.reportUser}
            </Text>

            <Text
              style={
                styles.safetyButtonSub
              }
            >
              {t.reportUserSub}
            </Text>
          </View>
        </Pressable>
      </View>

      <View style={styles.safetyNote}>
        <AlertTriangle
          color={GOLD_DARK}
          size={14}
        />

        <Text
          style={styles.safetyNoteText}
        >
          {t.safetyNote}
        </Text>
      </View>
    </View>
  );
}

/*
 * =================================================
 * MORTGAGE
 * =================================================
 */

function MortgageCalculatorPanel({
  language,
  priceIdr,
}: {
  language: Language;
  priceIdr: number;
}) {
  const t = copy[language];

  const [
    propertyPrice,
    setPropertyPrice,
  ] = useState(
    priceIdr ? String(priceIdr) : ""
  );

  const [
    downPayment,
    setDownPayment,
  ] = useState(
    priceIdr
      ? String(
          Math.round(
            priceIdr * 0.2
          )
        )
      : ""
  );

  const [
    interestRate,
    setInterestRate,
  ] = useState("8");

  const [years, setYears] =
    useState("15");

  useEffect(() => {
    setPropertyPrice(
      priceIdr ? String(priceIdr) : ""
    );

    setDownPayment(
      priceIdr
        ? String(
            Math.round(
              priceIdr * 0.2
            )
          )
        : ""
    );
  }, [priceIdr]);

  const calculation = useMemo(() => {
    const price = Number(
      propertyPrice || 0
    );

    const dp = Number(
      downPayment || 0
    );

    const annualRate = Number(
      interestRate || 0
    );

    const loanYears = Number(
      years || 0
    );

    const loanAmount = Math.max(
      price - dp,
      0
    );

    const months = Math.max(
      loanYears * 12,
      1
    );

    const monthlyRate =
      annualRate / 100 / 12;

    let monthlyPayment = 0;

    if (loanAmount > 0) {
      if (monthlyRate === 0) {
        monthlyPayment =
          loanAmount / months;
      } else {
        monthlyPayment =
          (loanAmount *
            monthlyRate *
            Math.pow(
              1 + monthlyRate,
              months
            )) /
          (Math.pow(
            1 + monthlyRate,
            months
          ) -
            1);
      }
    }

    return {
      loanAmount,
      monthlyPayment,
    };
  }, [
    propertyPrice,
    downPayment,
    interestRate,
    years,
  ]);

  return (
    <View
      style={
        styles.calculatorPanel
      }
    >
      <View style={styles.sectionHeader}>
        <View
          style={
            styles.sectionHeaderCopy
          }
        >
          <Text
            style={
              styles.sectionTitle
            }
          >
            {t.mortgage}
          </Text>

          <Text
            style={
              styles.sectionSubtitle
            }
          >
            {t.mortgageSub}
          </Text>
        </View>

        <View
          style={
            styles.calculatorIcon
          }
        >
          <Text
            style={
              styles.calculatorIconText
            }
          >
            %
          </Text>
        </View>
      </View>

      <View
        style={
          styles.calculatorGrid
        }
      >
        <CalculatorInput
          label={t.propertyPrice}
          value={propertyPrice}
          onChangeText={
            setPropertyPrice
          }
        />

        <CalculatorInput
          label={t.downPayment}
          value={downPayment}
          onChangeText={
            setDownPayment
          }
        />

        <CalculatorInput
          label={t.interest}
          value={interestRate}
          onChangeText={
            setInterestRate
          }
        />

        <CalculatorInput
          label={t.years}
          value={years}
          onChangeText={setYears}
        />
      </View>

      <View
        style={
          styles.calculatorResult
        }
      >
        <View>
          <Text
            style={styles.resultLabel}
          >
            {t.estimatedMonthly}
          </Text>

          <Text
            style={styles.resultValue}
          >
            IDR{" "}
            {Math.round(
              calculation.monthlyPayment
            ).toLocaleString("id-ID")}
          </Text>
        </View>

        <View
          style={styles.resultDivider}
        />

        <View>
          <Text
            style={styles.resultLabel}
          >
            {t.loanAmount}
          </Text>

          <Text
            style={
              styles.resultValueSmall
            }
          >
            IDR{" "}
            {Math.round(
              calculation.loanAmount
            ).toLocaleString("id-ID")}
          </Text>
        </View>
      </View>
    </View>
  );
}

function CalculatorInput({
  label,
  value,
  onChangeText,
}: {
  label: string;
  value: string;
  onChangeText: (
    value: string
  ) => void;
}) {
  return (
    <View
      style={
        styles.calculatorInputBox
      }
    >
      <Text
        style={
          styles.calculatorInputLabel
        }
      >
        {label}
      </Text>

      <TextInput
        value={value}
        onChangeText={(next) =>
          onChangeText(
            next.replace(
              /[^\d.]/g,
              ""
            )
          )
        }
        keyboardType="numeric"
        placeholder="0"
        placeholderTextColor="#A6A096"
        style={
          styles.calculatorInput
        }
      />
    </View>
  );
}

/*
 * =================================================
 * HELPERS
 * =================================================
 */

function addChip(
  chips: DetailChip[],
  chip: DetailChip
) {
  if (!chip.value || chip.value === "-") {
    return;
  }

  chips.push(chip);
}

function getReceiverUserId(
  property: TetamoProperty
) {
  return (
    property.contactUserId ||
    property.userId ||
    (property as any).contact_user_id ||
    (property as any).user_id ||
    (property as any).ownerId ||
    (property as any).owner_id ||
    (property as any).agentId ||
    (property as any).agent_id ||
    ""
  );
}

function getReceiverRole(
  property: TetamoProperty
) {
  const raw = String(
    property.contactRole ||
      property.source ||
      (property as any).role ||
      ""
  )
    .trim()
    .toLowerCase();

  if (
    raw === "agent" ||
    raw.includes("agent")
  ) {
    return "agent";
  }

  if (
    raw === "developer" ||
    raw.includes("developer")
  ) {
    return "developer";
  }

  return "owner";
}

function getPropertyTitle(
  property: TetamoProperty,
  language: Language
) {
  if (language === "id") {
    return (
      property.titleId ||
      property.titleEn ||
      "Properti"
    );
  }

  return (
    property.titleEn ||
    property.titleId ||
    "Property"
  );
}

function normalizeValue(
  value?: string | null
) {
  return String(value || "")
    .toLowerCase()
    .replace(/[_-]/g, " ")
    .trim();
}

function isRentProperty(
  property: TetamoProperty
) {
  const listing = normalizeValue(
    property.listingType
  );

  const rental = normalizeValue(
    property.rentalType
  );

  return (
    listing.includes("rent") ||
    listing.includes("rental") ||
    listing.includes("sewa") ||
    listing.includes("disewa") ||
    Boolean(rental)
  );
}

function isAuctionProperty(
  property: TetamoProperty
) {
  const listing = normalizeValue(
    property.listingType
  );

  return (
    listing.includes("auction") ||
    listing.includes("lelang")
  );
}

function shouldShowMortgage(
  property: TetamoProperty
) {
  if (isRentProperty(property)) {
    return false;
  }

  const listing = normalizeValue(
    property.listingType
  );

  return (
    listing.includes("sale") ||
    listing.includes("sell") ||
    listing.includes("jual") ||
    listing.includes("dijual") ||
    isAuctionProperty(property)
  );
}

function getListingTypeLabel(
  property: TetamoProperty,
  language: Language
) {
  if (isAuctionProperty(property)) {
    return language === "id"
      ? "Lelang"
      : "Auction";
  }

  if (isRentProperty(property)) {
    return language === "id"
      ? "Disewakan"
      : "For Rent";
  }

  return language === "id"
    ? "Dijual"
    : "For Sale";
}

function getRentalTypeLabel(
  property: TetamoProperty,
  language: Language
) {
  const rental = normalizeValue(
    property.rentalType
  );

  if (!rental) return "";

  if (
    rental.includes("monthly") ||
    rental.includes("bulanan")
  ) {
    return language === "id"
      ? "Bulanan"
      : "Monthly";
  }

  if (
    rental.includes("yearly") ||
    rental.includes("annual") ||
    rental.includes("tahunan")
  ) {
    return language === "id"
      ? "Tahunan"
      : "Yearly";
  }

  if (
    rental.includes("daily") ||
    rental.includes("harian")
  ) {
    return language === "id"
      ? "Harian"
      : "Daily";
  }

  return "";
}

function getPromotionBadge(
  property: TetamoProperty
):
  | {
      label: string;
      background: string;
      textColor: string;
    }
  | null {
  const badge = normalizeValue(
    property.badge
  );

  if (badge.includes("spotlight")) {
    return {
      label: "SPOTLIGHT",
      background: "#D8F1F5",
      textColor: "#17616C",
    };
  }

  if (badge.includes("featured")) {
    return {
      label: "FEATURED",
      background: "#E5C568",
      textColor: BLACK,
    };
  }

  if (badge.includes("boost")) {
    return {
      label: "BOOST",
      background: "#F0C397",
      textColor: "#704014",
    };
  }

  return null;
}

function formatPropertyPrice(
  priceIdr: number,
  rentalType: string | null | undefined,
  currency: Currency,
  language: Language,
  fallback: string
) {
  const price = Number(priceIdr || 0);

  if (!price || price <= 0) {
    return fallback;
  }

  let value: string;

  if (currency === "IDR") {
    value = `IDR ${Math.round(
      price
    ).toLocaleString("en-US")}`;
  } else {
    value = `≈ ${currency} ${Math.round(
      price *
        currencyRates[currency]
    ).toLocaleString("en-US")}`;
  }

  const rental =
    normalizeValue(rentalType);

  if (
    rental.includes("monthly") ||
    rental.includes("bulanan")
  ) {
    value +=
      language === "id"
        ? " /bln"
        : " /mo";
  }

  if (
    rental.includes("yearly") ||
    rental.includes("annual") ||
    rental.includes("tahunan")
  ) {
    value +=
      language === "id"
        ? " /thn"
        : " /yr";
  }

  if (
    rental.includes("daily") ||
    rental.includes("harian")
  ) {
    value +=
      language === "id"
        ? " /hari"
        : " /day";
  }

  return value;
}

function normalizeWhatsappPhone(
  value?: string | null
) {
  const digits = String(
    value || ""
  ).replace(/[^\d]/g, "");

  if (!digits) return "";

  if (digits.startsWith("62")) {
    return digits;
  }

  if (digits.startsWith("0")) {
    return `62${digits.slice(1)}`;
  }

  if (digits.startsWith("8")) {
    return `62${digits}`;
  }

  return digits;
}

function formatNumber(
  value?: number | null
) {
  if (
    typeof value !== "number" ||
    Number.isNaN(value)
  ) {
    return "";
  }

  return value.toLocaleString("id-ID");
}

function formatLandUnit(
  value?: string | null
) {
  const raw = String(
    value || ""
  )
    .toLowerCase()
    .trim();

  if (raw === "are") return "are";

  if (
    raw === "hectare" ||
    raw === "hektare"
  ) {
    return "ha";
  }

  return "m²";
}

function formatPropertyType(
  value?: string | null,
  language?: Language
) {
  const raw = String(value || "")
    .toLowerCase()
    .trim();

  if (!raw) return "";

  if (raw === "tanah") {
    return language === "id"
      ? "Tanah"
      : "Land";
  }

  if (raw === "rumah") {
    return language === "id"
      ? "Rumah"
      : "House";
  }

  if (
    raw === "apartemen" ||
    raw === "apartment"
  ) {
    return language === "id"
      ? "Apartemen"
      : "Apartment";
  }

  if (raw === "ruko") {
    return language === "id"
      ? "Ruko"
      : "Shophouse";
  }

  if (raw === "gudang") {
    return language === "id"
      ? "Gudang"
      : "Warehouse";
  }

  if (raw === "kantor") {
    return language === "id"
      ? "Kantor"
      : "Office";
  }

  if (
    raw === "villa" ||
    raw === "vila"
  ) {
    return "Villa";
  }

  return formatSimpleText(raw);
}

function formatRentalType(
  value?: string | null,
  language?: Language
) {
  const raw = String(value || "")
    .toLowerCase()
    .trim();

  if (!raw) return "";

  if (
    raw === "daily" ||
    raw === "harian"
  ) {
    return language === "id"
      ? "Harian"
      : "Daily";
  }

  if (
    raw === "monthly" ||
    raw === "bulanan"
  ) {
    return language === "id"
      ? "Bulanan"
      : "Monthly";
  }

  if (
    raw === "yearly" ||
    raw === "annual" ||
    raw === "tahunan"
  ) {
    return language === "id"
      ? "Tahunan"
      : "Yearly";
  }

  return formatSimpleText(raw);
}

function formatSimpleText(
  value?: string | null
) {
  const raw = String(
    value || ""
  ).trim();

  if (!raw) return "";

  return raw
    .split("_")
    .join(" ")
    .split("-")
    .join(" ")
    .split(" ")
    .filter(Boolean)
    .map(
      (word) =>
        word.charAt(0).toUpperCase() +
        word.slice(1)
    )
    .join(" ");
}

function getInitials(name: string) {
  const parts = name
    .replace(/\([^)]*\)/g, "")
    .split(" ")
    .map((part) => part.trim())
    .filter(Boolean);

  const first =
    parts[0]?.[0] || "T";

  const second =
    parts[1]?.[0] || "";

  return `${first}${second}`.toUpperCase();
}

function pad2(value: number) {
  return String(value).padStart(
    2,
    "0"
  );
}

function toDateValue(date: Date) {
  return `${date.getFullYear()}-${pad2(
    date.getMonth() + 1
  )}-${pad2(date.getDate())}`;
}

function addDays(
  base: Date,
  days: number
) {
  const next = new Date(base);

  next.setDate(
    next.getDate() + days
  );

  return next;
}

function getViewingDateOptions(
  language: Language
): ViewingDateOption[] {
  const today = new Date();

  return Array.from({
    length: 7,
  }).map((_, index) => {
    const date = addDays(
      today,
      index
    );

    const value = toDateValue(date);

    let label =
      new Intl.DateTimeFormat(
        language === "id"
          ? "id-ID"
          : "en-US",
        {
          weekday: "short",
        }
      ).format(date);

    if (index === 0) {
      label =
        language === "id"
          ? "Hari ini"
          : "Today";
    }

    if (index === 1) {
      label =
        language === "id"
          ? "Besok"
          : "Tomorrow";
    }

    const sublabel =
      new Intl.DateTimeFormat(
        language === "id"
          ? "id-ID"
          : "en-US",
        {
          day: "2-digit",
          month: "short",
        }
      ).format(date);

    return {
      label,
      sublabel,
      value,
    };
  });
}

function formatDisplayDate(
  value: string,
  language: Language
) {
  const date = new Date(
    `${value}T00:00:00`
  );

  if (
    Number.isNaN(date.getTime())
  ) {
    return value;
  }

  return new Intl.DateTimeFormat(
    language === "id"
      ? "id-ID"
      : "en-US",
    {
      weekday: "short",
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  ).format(date);
}

/*
 * =================================================
 * STYLES
 * =================================================
 */

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: CREAM,
  },

  /*
   * HEADER ABOVE GALLERY
   */

  detailHeader: {
    minHeight: 56,

    paddingHorizontal: 12,
    paddingVertical: 7,

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",

    gap: 7,

    backgroundColor: CREAM,

    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },

  headerBackButton: {
    width: 38,
    height: 38,

    borderRadius: 13,

    alignItems: "center",
    justifyContent: "center",

    backgroundColor: WHITE,

    borderWidth: 1,
    borderColor: BORDER,
  },

  headerControls: {
    flex: 1,

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",

    gap: 5,
  },

  headerOptionGroup: {
    minHeight: 38,

    paddingHorizontal: 4,

    borderRadius: 13,

    flexDirection: "row",
    alignItems: "center",

    gap: 2,

    backgroundColor: WHITE,

    borderWidth: 1,
    borderColor: BORDER,
  },

  headerLanguageSegment: {
    width: 30,
    height: 28,

    borderRadius: 9,

    alignItems: "center",
    justifyContent: "center",
  },

  headerCurrencySegment: {
    minWidth: 32,
    height: 28,

    paddingHorizontal: 4,

    borderRadius: 9,

    alignItems: "center",
    justifyContent: "center",
  },

  headerSegmentActive: {
    backgroundColor: "#F0D889",
  },

  headerSegmentText: {
    color: "#908A82",

    fontSize: 8.5,
    fontWeight: "800",
  },

  headerCurrencyText: {
    color: "#908A82",

    fontSize: 7.5,
    fontWeight: "800",
  },

  headerSegmentTextActive: {
    color: BLACK,
    fontWeight: "900",
  },

  headerHeartButton: {
    width: 38,
    height: 38,

    borderRadius: 13,

    alignItems: "center",
    justifyContent: "center",

    backgroundColor: WHITE,

    borderWidth: 1,
    borderColor: BORDER,
  },

  /*
   * MAIN
   */

  scroll: {
    flex: 1,
    backgroundColor: CREAM,
  },

  content: {
    paddingBottom: 125,
  },

  pageContent: {
    paddingHorizontal: 18,
  },

  /*
   * STATES
   */

  loadingBox: {
    flex: 1,

    alignItems: "center",
    justifyContent: "center",

    padding: 24,

    gap: 14,
  },

  loadingText: {
    color: MUTED,

    fontSize: 13,
    fontWeight: "700",
  },

  notFoundIcon: {
    width: 54,
    height: 54,

    borderRadius: 18,

    backgroundColor: GOLD_SOFT,

    alignItems: "center",
    justifyContent: "center",
  },

  notFoundText: {
    color: BLACK,

    fontSize: 16,
    fontWeight: "900",
  },

  backButton: {
    minHeight: 41,

    paddingHorizontal: 15,

    borderRadius: 13,

    backgroundColor: "#F0D889",

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",

    gap: 6,
  },

  backButtonText: {
    color: BLACK,

    fontSize: 11,
    fontWeight: "900",
  },

  /*
   * GALLERY
   */

  galleryWrap: {
    height: 310,

    position: "relative",

    backgroundColor: "#EEEAE3",
  },

  galleryImage: {
    height: 310,
  },

  galleryPlaceholder: {
    height: 310,

    alignItems: "center",
    justifyContent: "center",

    gap: 8,

    backgroundColor: "#EEEAE3",
  },

  galleryPlaceholderText: {
    color: "#AAA197",

    fontSize: 11,
    fontWeight: "900",

    letterSpacing: 2,
  },

  galleryBrand: {
    position: "absolute",

    left: 15,
    bottom: 14,

    minHeight: 28,

    paddingLeft: 5,
    paddingRight: 9,

    borderRadius: 999,

    flexDirection: "row",
    alignItems: "center",

    gap: 5,

    backgroundColor:
      "rgba(17,17,17,0.82)",
  },

  galleryBrandLogo: {
    width: 18,
    height: 18,
  },

  galleryBrandText: {
    color: WHITE,

    fontSize: 8,
    fontWeight: "900",

    letterSpacing: 1,
  },

  galleryCounter: {
    position: "absolute",

    right: 15,
    bottom: 14,

    minHeight: 28,

    paddingHorizontal: 10,

    borderRadius: 999,

    flexDirection: "row",
    alignItems: "center",

    gap: 5,

    backgroundColor:
      "rgba(17,17,17,0.78)",
  },

  galleryCounterText: {
    color: WHITE,

    fontSize: 9,
    fontWeight: "900",
  },

  /*
   * THUMBNAILS
   */

  thumbnailRow: {
    paddingHorizontal: 18,
    paddingTop: 11,
    paddingBottom: 12,

    gap: 8,
  },

  thumbnailButton: {
    width: 65,
    height: 49,

    borderRadius: 12,

    overflow: "hidden",

    borderWidth: 1,
    borderColor: BORDER,

    backgroundColor: "#EEEAE3",
  },

  thumbnailButtonActive: {
    borderColor: GOLD,
    borderWidth: 2,
  },

  thumbnailImage: {
    width: "100%",
    height: "100%",
  },

  /*
   * SUMMARY
   */

  summaryCard: {
    padding: 15,

    borderRadius: 22,

    backgroundColor: WHITE,

    borderWidth: 1,
    borderColor: BORDER,
  },

  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",

    gap: 5,

    marginBottom: 10,
  },

  listingBadge: {
    minHeight: 25,

    paddingHorizontal: 9,

    borderRadius: 999,

    backgroundColor: BLACK,

    alignItems: "center",
    justifyContent: "center",
  },

  listingBadgeText: {
    color: WHITE,

    fontSize: 8,
    fontWeight: "900",
  },

  rentalBadge: {
    minHeight: 25,

    paddingHorizontal: 9,

    borderRadius: 999,

    backgroundColor: GOLD_SOFT,

    alignItems: "center",
    justifyContent: "center",
  },

  rentalBadgeText: {
    color: BLACK,

    fontSize: 8,
    fontWeight: "900",
  },

  promotionBadge: {
    minHeight: 25,

    paddingHorizontal: 9,

    borderRadius: 999,

    alignItems: "center",
    justifyContent: "center",
  },

  promotionBadgeText: {
    fontSize: 8,
    fontWeight: "900",
  },

  summaryPrice: {
    color: BLACK,

    fontSize: 18,
    lineHeight: 23,

    fontWeight: "900",

    letterSpacing: -0.25,
  },

  summaryTitle: {
    marginTop: 5,

    color: "#292622",

    fontSize: 15,
    lineHeight: 20,

    fontWeight: "900",
  },

  summaryLocation: {
    marginTop: 8,

    flexDirection: "row",
    alignItems: "flex-start",

    gap: 5,
  },

  summaryLocationText: {
    flex: 1,

    color: MUTED,

    fontSize: 10.5,
    lineHeight: 15,

    fontWeight: "600",
  },

  listingCodeRow: {
    marginTop: 10,

    paddingTop: 10,

    borderTopWidth: 1,
    borderTopColor: "#EFE9DF",

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  listingCodeLabel: {
    color: "#989188",

    fontSize: 8.5,
    fontWeight: "700",
  },

  listingCodeValue: {
    color: BLACK,

    fontSize: 9,
    fontWeight: "900",
  },

  primaryMetaRow: {
    marginTop: 11,

    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",

    gap: 9,
  },

  primaryMetaItem: {
    minHeight: 32,

    paddingHorizontal: 9,

    borderRadius: 11,

    flexDirection: "row",
    alignItems: "center",

    gap: 4,

    backgroundColor: SOFT,
  },

  primaryMetaText: {
    color: "#4F4A43",

    fontSize: 10,
    fontWeight: "800",
  },

  /*
   * ACTIONS
   */

  actionRow: {
    marginTop: 13,

    flexDirection: "row",

    gap: 8,
  },

  whatsappButton: {
    flex: 1,

    minHeight: 42,

    borderRadius: 13,

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",

    gap: 6,

    backgroundColor: "#F2FAF4",

    borderWidth: 1,
    borderColor: "#D4E9DB",
  },

  whatsappButtonText: {
    color: "#175B32",

    fontSize: 10.5,
    fontWeight: "900",
  },

  scheduleButton: {
    flex: 1,

    minHeight: 42,

    borderRadius: 13,

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",

    gap: 6,

    backgroundColor: "#F0D889",
  },

  scheduleButtonText: {
    color: BLACK,

    fontSize: 10.5,
    fontWeight: "900",
  },

  /*
   * SECTIONS
   */

  sectionCard: {
    marginTop: 14,

    padding: 15,

    borderRadius: 22,

    backgroundColor: WHITE,

    borderWidth: 1,
    borderColor: BORDER,
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",

    gap: 12,
  },

  sectionHeaderCopy: {
    flex: 1,
  },

  sectionTitle: {
    color: BLACK,

    fontSize: 15.5,
    fontWeight: "900",
  },

  sectionSubtitle: {
    marginTop: 3,

    color: MUTED,

    fontSize: 9.5,
    lineHeight: 14,

    fontWeight: "500",
  },

  sectionIcon: {
    width: 38,
    height: 38,

    borderRadius: 13,

    backgroundColor: GOLD_SOFT,

    alignItems: "center",
    justifyContent: "center",
  },

  /*
   * VIDEO — 9:16
   */

  videoFrame: {
    width: "100%",

    aspectRatio: 9 / 16,

    marginTop: 13,

    overflow: "hidden",

    borderRadius: 18,

    backgroundColor: BLACK,

    borderWidth: 1,
    borderColor: "#DDD3C2",
  },

  videoView: {
    width: "100%",
    height: "100%",

    backgroundColor: BLACK,
  },

  /*
   * DETAILS
   */

  detailsGrid: {
    marginTop: 13,

    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",

    rowGap: 8,
  },

  detailCard: {
    width: "48.7%",

    minHeight: 65,

    padding: 9,

    borderRadius: 15,

    backgroundColor: SOFT,

    borderWidth: 1,
    borderColor: "#EAE3D9",

    flexDirection: "row",
    alignItems: "center",

    gap: 8,
  },

  detailIcon: {
    width: 35,
    height: 35,

    borderRadius: 11,

    alignItems: "center",
    justifyContent: "center",

    backgroundColor: "#F0D889",
  },

  detailCopy: {
    flex: 1,
    minWidth: 0,
  },

  detailLabel: {
    color: "#918B83",

    fontSize: 7.7,
    fontWeight: "700",

    textTransform: "uppercase",

    letterSpacing: 0.3,
  },

  detailValue: {
    marginTop: 3,

    color: BLACK,

    fontSize: 9.5,
    lineHeight: 13,

    fontWeight: "900",
  },

  descriptionText: {
    marginTop: 10,

    color: "#5E5952",

    fontSize: 11.5,
    lineHeight: 18,

    fontWeight: "500",
  },

  /*
   * MORTGAGE
   */

  calculatorPanel: {
    marginTop: 14,

    padding: 15,

    borderRadius: 22,

    backgroundColor: "#F5F0E5",

    borderWidth: 1,
    borderColor: "#E2D3A7",
  },

  calculatorIcon: {
    width: 38,
    height: 38,

    borderRadius: 13,

    alignItems: "center",
    justifyContent: "center",

    backgroundColor: "#F0D889",
  },

  calculatorIconText: {
    color: BLACK,

    fontSize: 15,
    fontWeight: "900",
  },

  calculatorGrid: {
    marginTop: 14,

    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",

    rowGap: 10,
  },

  calculatorInputBox: {
    width: "48.5%",
  },

  calculatorInputLabel: {
    marginBottom: 5,

    color: "#736C63",

    fontSize: 8.5,
    fontWeight: "800",
  },

  calculatorInput: {
    height: 41,

    borderRadius: 12,

    paddingHorizontal: 10,

    backgroundColor: WHITE,

    borderWidth: 1,
    borderColor: "#DFD4BF",

    color: BLACK,

    fontSize: 10.5,
    fontWeight: "800",
  },

  calculatorResult: {
    marginTop: 13,

    padding: 13,

    borderRadius: 16,

    backgroundColor: BLACK,
  },

  resultLabel: {
    color: "#AAA49C",

    fontSize: 8.5,
    fontWeight: "700",
  },

  resultValue: {
    marginTop: 4,

    color: GOLD,

    fontSize: 16,
    lineHeight: 20,

    fontWeight: "900",
  },

  resultDivider: {
    height: 1,

    marginVertical: 11,

    backgroundColor: "#2D2D2D",
  },

  resultValueSmall: {
    marginTop: 4,

    color: WHITE,

    fontSize: 11.5,
    fontWeight: "900",
  },

  /*
   * CONTACT
   */

  contactPanel: {
    marginTop: 14,

    padding: 13,

    borderRadius: 20,

    backgroundColor: WHITE,

    borderWidth: 1,
    borderColor: BORDER,

    flexDirection: "row",
    alignItems: "center",

    gap: 10,
  },

  contactRow: {
    flex: 1,

    flexDirection: "row",
    alignItems: "center",

    gap: 9,
  },

  contactPhoto: {
    width: 47,
    height: 47,

    borderRadius: 999,

    backgroundColor: SOFT,
  },

  contactInitials: {
    width: 47,
    height: 47,

    borderRadius: 999,

    backgroundColor: GOLD_SOFT,

    borderWidth: 1,
    borderColor: "#E1CB8D",

    alignItems: "center",
    justifyContent: "center",
  },

  contactInitialsText: {
    color: GOLD_DARK,

    fontSize: 12,
    fontWeight: "900",
  },

  contactCopy: {
    flex: 1,
    minWidth: 0,
  },

  contactLabel: {
    color: "#979087",

    fontSize: 8.5,
    fontWeight: "700",
  },

  contactName: {
    marginTop: 2,

    color: BLACK,

    fontSize: 11.5,
    fontWeight: "900",
  },

  contactAgency: {
    marginTop: 2,

    color: MUTED,

    fontSize: 9,
    fontWeight: "600",
  },

  contactWhatsapp: {
    minHeight: 36,

    paddingHorizontal: 10,

    borderRadius: 12,

    backgroundColor: "#F2FAF4",

    borderWidth: 1,
    borderColor: "#D4E9DB",

    flexDirection: "row",
    alignItems: "center",

    gap: 4,
  },

  contactWhatsappText: {
    color: "#175B32",

    fontSize: 8.5,
    fontWeight: "900",
  },

  /*
   * SAFETY
   */

  safetyPanel: {
    marginTop: 14,

    padding: 15,

    borderRadius: 22,

    backgroundColor: "#F8F3E7",

    borderWidth: 1,
    borderColor: "#DFCE9E",
  },

  safetyHeader: {
    flexDirection: "row",
    alignItems: "center",

    gap: 10,
  },

  safetyIcon: {
    width: 42,
    height: 42,

    borderRadius: 14,

    alignItems: "center",
    justifyContent: "center",

    backgroundColor: GOLD_SOFT,

    borderWidth: 1,
    borderColor: "#DFCA89",
  },

  safetyHeaderCopy: {
    flex: 1,
  },

  safetyTitle: {
    color: BLACK,

    fontSize: 14,
    fontWeight: "900",
  },

  safetySub: {
    marginTop: 3,

    color: "#70695E",

    fontSize: 9.5,
    lineHeight: 14,

    fontWeight: "600",
  },

  safetyActions: {
    marginTop: 13,

    gap: 8,
  },

  safetyButton: {
    minHeight: 61,

    padding: 10,

    borderRadius: 15,

    flexDirection: "row",
    alignItems: "center",

    gap: 9,

    backgroundColor: WHITE,

    borderWidth: 1,
    borderColor: "#E2D7BF",
  },

  safetyButtonIcon: {
    width: 34,
    height: 34,

    borderRadius: 11,

    alignItems: "center",
    justifyContent: "center",

    backgroundColor: "#F6EBCB",
  },

  safetyButtonCopy: {
    flex: 1,
  },

  safetyButtonTitle: {
    color: BLACK,

    fontSize: 10.5,
    fontWeight: "900",
  },

  safetyButtonSub: {
    marginTop: 2,

    color: "#81796E",

    fontSize: 8.5,
    lineHeight: 12,

    fontWeight: "500",
  },

  safetyNote: {
    marginTop: 10,

    padding: 10,

    borderRadius: 13,

    flexDirection: "row",
    alignItems: "flex-start",

    gap: 7,

    backgroundColor:
      "rgba(216,180,106,0.12)",
  },

  safetyNoteText: {
    flex: 1,

    color: "#746A58",

    fontSize: 8.8,
    lineHeight: 13,

    fontWeight: "600",
  },

  /*
   * VIEWING MODAL
   */

  modalBackdrop: {
    flex: 1,

    justifyContent: "center",

    paddingHorizontal: 18,

    backgroundColor:
      "rgba(0,0,0,0.68)",
  },

  scheduleModal: {
    maxHeight: "88%",

    padding: 17,

    borderRadius: 24,

    backgroundColor: CREAM,

    borderWidth: 1,
    borderColor: "#E4DBCD",
  },

  scheduleModalHeader: {
    flexDirection: "row",
    alignItems: "flex-start",

    gap: 12,
  },

  scheduleModalTitleBox: {
    flex: 1,
  },

  scheduleModalEyebrow: {
    color: GOLD_DARK,

    fontSize: 8,
    fontWeight: "900",

    letterSpacing: 1.3,
  },

  scheduleModalTitle: {
    marginTop: 4,

    color: BLACK,

    fontSize: 18,
    fontWeight: "900",
  },

  scheduleModalSub: {
    marginTop: 4,

    color: MUTED,

    fontSize: 10,
    lineHeight: 14,

    fontWeight: "600",
  },

  closeButton: {
    width: 36,
    height: 36,

    borderRadius: 12,

    alignItems: "center",
    justifyContent: "center",

    backgroundColor: WHITE,

    borderWidth: 1,
    borderColor: BORDER,
  },

  scheduleIntroduction: {
    marginTop: 12,

    color: "#665F57",

    fontSize: 10,
    lineHeight: 15,

    fontWeight: "500",
  },

  scheduleBlock: {
    marginTop: 15,
  },

  scheduleLabel: {
    marginBottom: 8,

    color: BLACK,

    fontSize: 10.5,
    fontWeight: "900",
  },

  dateChipRow: {
    gap: 7,
    paddingRight: 3,
  },

  dateChip: {
    minWidth: 88,

    paddingHorizontal: 10,
    paddingVertical: 9,

    borderRadius: 14,

    backgroundColor: WHITE,

    borderWidth: 1,
    borderColor: BORDER,
  },

  dateChipActive: {
    backgroundColor: "#F0D889",
    borderColor: "#DFC566",
  },

  dateChipLabel: {
    color: "#4F4A43",

    fontSize: 9.5,
    fontWeight: "900",
  },

  dateChipLabelActive: {
    color: BLACK,
  },

  dateChipSub: {
    marginTop: 3,

    color: "#969087",

    fontSize: 8.5,
    fontWeight: "700",
  },

  dateChipSubActive: {
    color: "#554B2F",
  },

  timeChipGrid: {
    flexDirection: "row",
    flexWrap: "wrap",

    gap: 7,
  },

  timeChip: {
    minHeight: 34,

    paddingHorizontal: 11,

    borderRadius: 999,

    flexDirection: "row",
    alignItems: "center",

    gap: 5,

    backgroundColor: WHITE,

    borderWidth: 1,
    borderColor: BORDER,
  },

  timeChipActive: {
    backgroundColor: "#F0D889",
    borderColor: "#DFC566",
  },

  timeChipText: {
    color: "#5F5952",

    fontSize: 9.5,
    fontWeight: "800",
  },

  timeChipTextActive: {
    color: BLACK,
    fontWeight: "900",
  },

  selectedScheduleBox: {
    marginTop: 14,

    padding: 10,

    borderRadius: 13,

    flexDirection: "row",
    alignItems: "center",

    gap: 7,

    backgroundColor: "#EFF8F1",

    borderWidth: 1,
    borderColor: "#CBE4D2",
  },

  selectedScheduleText: {
    flex: 1,

    color: "#245E38",

    fontSize: 9.5,
    lineHeight: 14,

    fontWeight: "800",
  },

  submitButton: {
    minHeight: 46,

    marginTop: 15,

    borderRadius: 14,

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",

    gap: 7,

    backgroundColor: "#F0D889",
  },

  submitButtonDisabled: {
    opacity: 0.55,
  },

  submitButtonText: {
    color: BLACK,

    fontSize: 11,
    fontWeight: "900",
  },
});