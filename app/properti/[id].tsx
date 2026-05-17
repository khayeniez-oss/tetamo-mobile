import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
  AlertTriangle,
  ArrowLeft,
  Bath,
  BedDouble,
  CalendarDays,
  CarFront,
  Clock,
  Droplets,
  Eye,
  FileText,
  Flag,
  Heart,
  Home,
  Image as ImageIcon,
  Layers3,
  MapPin,
  MessageCircle,
  PlayCircle,
  Ruler,
  ShieldAlert,
  ShieldCheck,
  Square,
  Star,
  UserRound,
  Video,
  X,
  Zap,
} from "lucide-react-native";
import type { ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ImageBackground,
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
import {
  fetchPropertyByPathKey,
  type TetamoProperty,
} from "../../services/properties";

type Language = "en" | "id";

type DetailChip = {
  key: string;
  value: string;
  icon: ReactNode;
};

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?q=80&w=1400&auto=format&fit=crop";

const TETAMO_FALLBACK_WHATSAPP = process.env.EXPO_PUBLIC_TETAMO_FALLBACK_WHATSAPP || "";

export default function MobilePropertyDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { width } = useWindowDimensions();
  const galleryRef = useRef<ScrollView | null>(null);

  const [language, setLanguage] = useState<Language>("en");
  const [property, setProperty] = useState<TetamoProperty | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");

  const pathKey = useMemo(() => {
    const value = params.id;
    if (Array.isArray(value)) return value[0] || "";
    return String(value || "");
  }, [params.id]);

  const showSchedule = useMemo(() => {
    const value = params.schedule;
    if (Array.isArray(value)) return value[0] === "1";
    return value === "1";
  }, [params.schedule]);

  useEffect(() => {
    let isMounted = true;

    async function loadProperty() {
      try {
        setIsLoading(true);

        const row = await fetchPropertyByPathKey(decodeURIComponent(pathKey));

        if (!isMounted) return;

        setProperty(row);
        setGalleryIndex(0);
      } catch (error) {
        console.log("Tetamo mobile detail error:", error);

        if (!isMounted) return;

        setProperty(null);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadProperty();

    return () => {
      isMounted = false;
    };
  }, [pathKey]);

  useEffect(() => {
    if (showSchedule) {
      setIsScheduleOpen(true);
    }
  }, [showSchedule]);

  const title = property
    ? language === "en"
      ? property.titleEn
      : property.titleId
    : "";

  const description = property
    ? language === "en"
      ? property.descriptionEn
      : property.descriptionId
    : "";

  const price = property?.priceIdr
    ? `IDR ${property.priceIdr.toLocaleString("id-ID")}`
    : language === "id"
      ? "Hubungi Kami"
      : "Price on Request";

  const galleryImages = property?.images?.length
    ? property.images
    : property?.image
      ? [property.image]
      : [FALLBACK_IMAGE];

  const detailChips = useMemo(() => {
    if (!property) return [];

    const chips: DetailChip[] = [];

    addChip(chips, {
      key: "type",
      value: formatPropertyType(property.propertyType, language),
      icon: <Home color="#ffffff" size={20} />,
    });

    addChip(chips, {
      key: "bed",
      value: property.beds ? String(property.beds) : "",
      icon: <BedDouble color="#ffffff" size={20} />,
    });

    addChip(chips, {
      key: "bath",
      value: property.baths ? String(property.baths) : "",
      icon: <Bath color="#ffffff" size={20} />,
    });

    addChip(chips, {
      key: "land",
      value: property.landSize
        ? `${formatNumber(property.landSize)} ${formatLandUnit(property.landUnit)}`
        : "",
      icon: <Square color="#ffffff" size={20} />,
    });

    addChip(chips, {
      key: "building",
      value: property.buildingSize
        ? `${formatNumber(property.buildingSize)} m²`
        : "",
      icon: <Ruler color="#ffffff" size={20} />,
    });

    addChip(chips, {
      key: "furnishing",
      value: formatSimpleText(property.furnishing),
      icon: <Home color="#ffffff" size={20} />,
    });

    addChip(chips, {
      key: "floors",
      value: property.floors ? `${property.floors}` : "",
      icon: <Layers3 color="#ffffff" size={20} />,
    });

    addChip(chips, {
      key: "parking",
      value:
        property.parkingOption ||
        (property.parking ? `${property.parking}` : ""),
      icon: <CarFront color="#ffffff" size={20} />,
    });

    addChip(chips, {
      key: "certificate",
      value: property.certificate || "",
      icon: <FileText color="#ffffff" size={20} />,
    });

    addChip(chips, {
      key: "electricity",
      value: property.electricity || "",
      icon: <Zap color="#ffffff" size={20} />,
    });

    addChip(chips, {
      key: "water",
      value: property.waterSource || "",
      icon: <Droplets color="#ffffff" size={20} />,
    });

    addChip(chips, {
      key: "rental",
      value: formatRentalType(property.rentalType, language),
      icon: <Clock color="#ffffff" size={20} />,
    });

    return chips;
  }, [property, language]);

  const openWhatsapp = () => {
    if (!property) return;

    const phone =
      normalizeWhatsappPhone(property.contactPhone) || TETAMO_FALLBACK_WHATSAPP;

    const receiverName = property.contactName || "Tetamo";

    const message =
      language === "id"
        ? `Halo ${receiverName}, saya tertarik dengan properti ini di TETAMO.

Properti: ${title}
Kode: ${property.kode || "-"}
Lokasi: ${property.location}
Harga: ${price}

Apakah properti ini masih tersedia?`
        : `Hello ${receiverName}, I'm interested in this property on TETAMO.

Property: ${title}
Code: ${property.kode || "-"}
Location: ${property.location}
Price: ${price}

Is this property still available?`;

    Linking.openURL(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`);
  };

  const openVideo = () => {
    if (!property?.videoUrl) return;
    Linking.openURL(property.videoUrl);
  };

  const openReportListing = () => {
    if (!property) return;

    router.push(
      `/report/listing?property_id=${encodeURIComponent(
        property.id || ""
      )}&listing_code=${encodeURIComponent(
        property.kode || ""
      )}&title=${encodeURIComponent(title || "")}&location=${encodeURIComponent(
        property.location || ""
      )}` as any
    );
  };

  const openReportUser = () => {
    if (!property) return;

    const contactUserId =
      String(
        (property as any).contactUserId ||
          (property as any).contact_user_id ||
          (property as any).ownerId ||
          (property as any).owner_id ||
          (property as any).agentId ||
          (property as any).agent_id ||
          ""
      ) || "";

    router.push(
      `/report/user?reported_user_id=${encodeURIComponent(
        contactUserId
      )}&name=${encodeURIComponent(
        property.contactName || "Tetamo"
      )}&role=${encodeURIComponent(
        property.contactRole || property.contactAgency || "User"
      )}&listing_code=${encodeURIComponent(property.kode || "")}` as any
    );
  };

  const submitSchedule = () => {
    if (!property) return;

    Alert.alert(
      language === "id" ? "Viewing Request" : "Viewing Request",
      language === "id"
        ? `Permintaan jadwal viewing siap dikirim.\n\n${title}\n${selectedDate || "-"} ${selectedTime || ""}`
        : `Viewing request is ready to submit.\n\n${title}\n${selectedDate || "-"} ${selectedTime || ""}`
    );

    setIsScheduleOpen(false);
  };

  const handleGalleryScrollEnd = (event: any) => {
    const nextIndex = Math.round(event.nativeEvent.contentOffset.x / width);
    setGalleryIndex(Math.max(0, Math.min(nextIndex, galleryImages.length - 1)));
  };

  const goToGalleryImage = (index: number) => {
    setGalleryIndex(index);

    galleryRef.current?.scrollTo({
      x: index * width,
      animated: true,
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />

      {isLoading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator color="#ffffff" />
          <Text style={styles.loadingText}>Loading property...</Text>
        </View>
      ) : !property ? (
        <View style={styles.loadingBox}>
          <Text style={styles.loadingText}>Property not found.</Text>

          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeft color="#111111" size={16} />
            <Text style={styles.backButtonText}>Back</Text>
          </Pressable>
        </View>
      ) : (
        <>
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.galleryWrap}>
              <ScrollView
                ref={galleryRef}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={handleGalleryScrollEnd}
                scrollEventThrottle={16}
              >
                {galleryImages.map((imageUrl, index) => (
                  <ImageBackground
                    key={`${imageUrl}-${index}`}
                    source={{ uri: imageUrl || FALLBACK_IMAGE }}
                    resizeMode="cover"
                    style={[styles.heroImage, { width }]}
                    imageStyle={styles.heroImageRadius}
                  >
                    <View style={styles.heroShade} />

                    <View style={styles.topBar}>
                      <Pressable
                        style={styles.iconButton}
                        onPress={() => router.back()}
                      >
                        <ArrowLeft color="#ffffff" size={19} />
                      </Pressable>

                      <View style={styles.languageToggle}>
                        {(["en", "id"] as Language[]).map((item) => (
                          <Pressable
                            key={item}
                            style={[
                              styles.languageItem,
                              language === item && styles.languageItemActive,
                            ]}
                            onPress={() => setLanguage(item)}
                          >
                            <Text
                              style={[
                                styles.languageText,
                                language === item && styles.languageTextActive,
                              ]}
                            >
                              {item.toUpperCase()}
                            </Text>
                          </Pressable>
                        ))}
                      </View>

                      <Pressable style={styles.iconButton}>
                        <Heart color="#ffffff" size={19} />
                      </Pressable>
                    </View>

                    <View style={styles.heroBottom}>
                      <View style={styles.heroBadgeRow}>
                        <View style={styles.badge}>
                          <ShieldCheck color="#ffffff" size={11} />
                          <Text style={styles.badgeText}>{property.badge}</Text>
                        </View>

                        <View style={styles.galleryCounter}>
                          <ImageIcon color="#ffffff" size={11} />
                          <Text style={styles.galleryCounterText}>
                            {index + 1}/{galleryImages.length}
                          </Text>
                        </View>
                      </View>

                      <Text style={styles.price} numberOfLines={1}>
                        {price}
                      </Text>

                      <Text style={styles.title} numberOfLines={2}>
                        {title}
                      </Text>

                      <View style={styles.locationRow}>
                        <MapPin color="#ffffff" size={12} />
                        <Text style={styles.locationText} numberOfLines={1}>
                          {property.location}
                        </Text>
                      </View>

                      <View style={styles.quickStatsRow}>
                        <QuickStat
                          icon={<Eye color="#ffffff" size={12} />}
                          label={formatCompactNumber(property.viewCount || 0)}
                        />

                        <QuickStat
                          icon={<Star color="#e6c15c" size={12} />}
                          label="4.9"
                        />

                        <QuickStat
                          icon={<ImageIcon color="#ffffff" size={12} />}
                          label={`${galleryImages.length} Photos`}
                        />
                      </View>
                    </View>
                  </ImageBackground>
                ))}
              </ScrollView>
            </View>

            {galleryImages.length > 1 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.thumbnailRow}
              >
                {galleryImages.map((imageUrl, index) => (
                  <Pressable
                    key={`${imageUrl}-thumb-${index}`}
                    style={[
                      styles.thumbnailButton,
                      index === galleryIndex && styles.thumbnailButtonActive,
                    ]}
                    onPress={() => goToGalleryImage(index)}
                  >
                    <Image
                      source={{ uri: imageUrl || FALLBACK_IMAGE }}
                      style={styles.thumbnailImage}
                    />
                  </Pressable>
                ))}
              </ScrollView>
            )}

            <View style={styles.metaRow}>
              <Meta
                icon={<BedDouble color="#ffffff" size={14} />}
                value={property.beds || 0}
              />

              <Meta
                icon={<Bath color="#ffffff" size={14} />}
                value={property.baths || 0}
              />

              <Meta
                icon={<Ruler color="#ffffff" size={14} />}
                value={`${property.size || 0} m²`}
              />
            </View>

            <View style={styles.actionRow}>
              <Pressable style={styles.whatsappButton} onPress={openWhatsapp}>
                <MessageCircle color="#ffffff" size={16} />
                <Text style={styles.primaryButtonText}>WhatsApp</Text>
              </Pressable>

              <Pressable
                style={styles.scheduleButton}
                onPress={() => setIsScheduleOpen(true)}
              >
                <CalendarDays color="#111111" size={16} />
                <Text style={styles.scheduleButtonText}>
                  {language === "id" ? "Jadwal" : "Schedule"}
                </Text>
              </Pressable>
            </View>

            {property.videoUrl && (
              <View style={styles.panel}>
                <View style={styles.panelHeaderRow}>
                  <View>
                    <Text style={styles.panelTitle}>
                      {language === "id" ? "Video Properti" : "Property Video"}
                    </Text>

                    <Text style={styles.panelSubSmall}>
                      {language === "id"
                        ? "Lihat video properti ini."
                        : "Watch the property video."}
                    </Text>
                  </View>

                  <Video color="#e6c15c" size={21} />
                </View>

                <Pressable style={styles.videoBox} onPress={openVideo}>
                  <View style={styles.videoIcon}>
                    <PlayCircle color="#111111" size={28} />
                  </View>

                  <Text style={styles.videoTitle}>
                    {language === "id" ? "Buka Video" : "Open Video"}
                  </Text>

                  <Text style={styles.videoSub} numberOfLines={1}>
                    {property.videoUrl}
                  </Text>
                </Pressable>
              </View>
            )}

            <View style={styles.flatSection}>
              <Text style={styles.flatSectionTitle}>
                {language === "id" ? "Detail Properti" : "Property Details"}
              </Text>

              <View style={styles.detailsGrid}>
                {detailChips.map((chip) => (
                  <DetailChipCard key={chip.key} chip={chip} />
                ))}
              </View>
            </View>

            <View style={styles.panel}>
              <Text style={styles.panelTitle}>
                {language === "id" ? "Deskripsi" : "Description"}
              </Text>

              <Text style={styles.descriptionText}>
                {description ||
                  (language === "id"
                    ? "Deskripsi properti akan tersedia di sini."
                    : "Property description will appear here.")}
              </Text>
            </View>

            <MortgageCalculatorPanel
              language={language}
              priceIdr={property.priceIdr}
            />

            <View style={styles.contactPanel}>
              <View style={styles.contactRow}>
                {property.contactPhotoUrl ? (
                  <Image
                    source={{ uri: property.contactPhotoUrl }}
                    style={styles.contactPhoto}
                  />
                ) : (
                  <View style={styles.contactInitials}>
                    <Text style={styles.contactInitialsText}>
                      {getInitials(property.contactName || "Tetamo")}
                    </Text>
                  </View>
                )}

                <View style={styles.contactTextBox}>
                  <Text style={styles.contactLabel}>
                    {language === "id" ? "Diposting oleh" : "Posted by"}
                  </Text>

                  <Text style={styles.contactName} numberOfLines={1}>
                    {property.contactName || "Tetamo"}
                  </Text>

                  <Text style={styles.contactAgency} numberOfLines={1}>
                    {property.contactAgency || property.contactRole || "Tetamo"}
                  </Text>
                </View>
              </View>

              <Pressable style={styles.contactWhatsapp} onPress={openWhatsapp}>
                <MessageCircle color="#ffffff" size={15} />
                <Text style={styles.contactWhatsappText}>WhatsApp</Text>
              </Pressable>
            </View>

            <SafetyReportsPanel
              language={language}
              onReportListing={openReportListing}
              onReportUser={openReportUser}
            />
          </ScrollView>

          <Modal
            visible={isScheduleOpen}
            transparent
            animationType="fade"
            onRequestClose={() => setIsScheduleOpen(false)}
          >
            <View style={styles.modalBackdrop}>
              <View style={styles.scheduleModal}>
                <View style={styles.scheduleModalHeader}>
                  <View style={styles.scheduleModalTitleBox}>
                    <Text style={styles.scheduleModalTitle}>
                      {language === "id" ? "Jadwalkan Viewing" : "Schedule Viewing"}
                    </Text>

                    <Text style={styles.scheduleModalSub} numberOfLines={2}>
                      {title}
                    </Text>
                  </View>

                  <Pressable
                    style={styles.closeButton}
                    onPress={() => setIsScheduleOpen(false)}
                  >
                    <X color="#ffffff" size={18} />
                  </Pressable>
                </View>

                <Text style={styles.panelSub}>
                  {language === "id"
                    ? "Pilih tanggal dan waktu viewing."
                    : "Choose your preferred viewing date and time."}
                </Text>

                <TextInput
                  value={selectedDate}
                  onChangeText={setSelectedDate}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#888888"
                  style={styles.input}
                />

                <TextInput
                  value={selectedTime}
                  onChangeText={setSelectedTime}
                  placeholder="10:00 AM"
                  placeholderTextColor="#888888"
                  style={styles.input}
                />

                <Pressable style={styles.submitButton} onPress={submitSchedule}>
                  <Text style={styles.submitButtonText}>
                    {language === "id"
                      ? "Kirim Permintaan Viewing"
                      : "Send Viewing Request"}
                  </Text>
                </Pressable>
              </View>
            </View>
          </Modal>
        </>
      )}
    </SafeAreaView>
  );
}

function addChip(chips: DetailChip[], chip: DetailChip) {
  if (!chip.value || chip.value === "-") return;
  chips.push(chip);
}

function normalizeWhatsappPhone(value?: string | null) {
  const digits = String(value || "").replace(/[^\d]/g, "");

  if (!digits) return "";
  if (digits.startsWith("62")) return digits;
  if (digits.startsWith("0")) return `62${digits.slice(1)}`;
  if (digits.startsWith("8")) return `62${digits}`;

  return digits;
}

function formatNumber(value?: number | null) {
  if (typeof value !== "number" || Number.isNaN(value)) return "";
  return value.toLocaleString("id-ID");
}

function formatCompactNumber(value: number) {
  if (!value || value <= 0) return "0";
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
  return String(value);
}

function formatLandUnit(value?: string | null) {
  const raw = String(value || "").toLowerCase();

  if (raw === "are") return "are";
  if (raw === "hectare" || raw === "hektare") return "ha";

  return "m²";
}

function formatPropertyType(value?: string | null, language?: Language) {
  const raw = String(value || "").toLowerCase().trim();

  if (!raw) return "";
  if (raw === "tanah") return language === "id" ? "Tanah" : "Land";
  if (raw === "rumah") return language === "id" ? "Rumah" : "House";

  if (raw === "apartemen" || raw === "apartment") {
    return language === "id" ? "Apartemen" : "Apartment";
  }

  if (raw === "ruko") return language === "id" ? "Ruko" : "Shophouse";
  if (raw === "gudang") return language === "id" ? "Gudang" : "Warehouse";
  if (raw === "kantor") return language === "id" ? "Kantor" : "Office";
  if (raw === "villa" || raw === "vila") return "Villa";

  return formatSimpleText(raw);
}

function formatRentalType(value?: string | null, language?: Language) {
  const raw = String(value || "").toLowerCase().trim();

  if (!raw) return "";

  if (raw === "daily" || raw === "harian") {
    return language === "id" ? "Harian" : "Daily";
  }

  if (raw === "monthly" || raw === "bulanan") {
    return language === "id" ? "Bulanan" : "Monthly";
  }

  if (raw === "yearly" || raw === "tahunan") {
    return language === "id" ? "Tahunan" : "Yearly";
  }

  return formatSimpleText(raw);
}

function formatSimpleText(value?: string | null) {
  const raw = String(value || "").trim();

  if (!raw) return "";

  return raw
    .split("_")
    .join(" ")
    .split("-")
    .join(" ")
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function getInitials(name: string) {
  const parts = name
    .replace(/\([^)]*\)/g, "")
    .split(" ")
    .map((part) => part.trim())
    .filter(Boolean);

  const first = parts[0]?.[0] || "T";
  const second = parts[1]?.[0] || "A";

  return `${first}${second}`.toUpperCase();
}

function Meta({ icon, value }: { icon: ReactNode; value: string | number }) {
  return (
    <View style={styles.metaItem}>
      {icon}
      <Text style={styles.metaText}>{value}</Text>
    </View>
  );
}

function QuickStat({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <View style={styles.quickStat}>
      {icon}
      <Text style={styles.quickStatText}>{label}</Text>
    </View>
  );
}

function DetailChipCard({ chip }: { chip: DetailChip }) {
  return (
    <View style={styles.detailChip}>
      <View style={styles.detailIcon}>
        <View style={styles.detailIconInner}>{chip.icon}</View>
      </View>

      <Text style={styles.detailValue} numberOfLines={1}>
        {chip.value}
      </Text>
    </View>
  );
}

function SafetyReportsPanel({
  language,
  onReportListing,
  onReportUser,
}: {
  language: Language;
  onReportListing: () => void;
  onReportUser: () => void;
}) {
  return (
    <View style={styles.safetyPanel}>
      <View style={styles.safetyHeaderRow}>
        <View style={styles.safetyIcon}>
          <ShieldAlert color="#e6c15c" size={22} />
        </View>

        <View style={styles.safetyTextBox}>
          <Text style={styles.safetyTitle}>
            {language === "id" ? "Keamanan & Laporan" : "Safety & Reports"}
          </Text>

          <Text style={styles.safetySub}>
            {language === "id"
              ? "Laporkan listing atau pengguna yang mencurigakan."
              : "Report suspicious listings or user activity."}
          </Text>
        </View>
      </View>

      <View style={styles.safetyActionRow}>
        <Pressable style={styles.safetyButton} onPress={onReportListing}>
          <Flag color="#e6c15c" size={16} />

          <View style={styles.safetyButtonTextBox}>
            <Text style={styles.safetyButtonTitle}>
              {language === "id" ? "Laporkan listing" : "Report listing"}
            </Text>

            <Text style={styles.safetyButtonSub}>
              {language === "id" ? "Listing palsu/detail salah" : "Fake or wrong details"}
            </Text>
          </View>
        </Pressable>

        <Pressable style={styles.safetyButton} onPress={onReportUser}>
          <UserRound color="#e6c15c" size={16} />

          <View style={styles.safetyButtonTextBox}>
            <Text style={styles.safetyButtonTitle}>
              {language === "id" ? "Laporkan pengguna" : "Report user"}
            </Text>

            <Text style={styles.safetyButtonSub}>
              {language === "id" ? "Agen/user mencurigakan" : "Suspicious user or agent"}
            </Text>
          </View>
        </Pressable>
      </View>

      <View style={styles.safetyNote}>
        <AlertTriangle color="#e6c15c" size={14} />

        <Text style={styles.safetyNoteText}>
          {language === "id"
            ? "Tetamo akan meninjau laporan untuk menjaga marketplace tetap aman."
            : "Tetamo reviews reports to help keep the marketplace safe."}
        </Text>
      </View>
    </View>
  );
}

function MortgageCalculatorPanel({
  language,
  priceIdr,
}: {
  language: Language;
  priceIdr: number;
}) {
  const [propertyPrice, setPropertyPrice] = useState(
    priceIdr ? String(priceIdr) : ""
  );
  const [downPayment, setDownPayment] = useState(
    priceIdr ? String(Math.round(priceIdr * 0.2)) : ""
  );
  const [interestRate, setInterestRate] = useState("8");
  const [years, setYears] = useState("15");

  useEffect(() => {
    setPropertyPrice(priceIdr ? String(priceIdr) : "");
    setDownPayment(priceIdr ? String(Math.round(priceIdr * 0.2)) : "");
  }, [priceIdr]);

  const calculation = useMemo(() => {
    const price = Number(propertyPrice || 0);
    const dp = Number(downPayment || 0);
    const annualRate = Number(interestRate || 0);
    const loanYears = Number(years || 0);

    const loanAmount = Math.max(price - dp, 0);
    const months = Math.max(loanYears * 12, 1);
    const monthlyRate = annualRate / 100 / 12;

    let monthlyPayment = 0;

    if (loanAmount > 0) {
      if (monthlyRate === 0) {
        monthlyPayment = loanAmount / months;
      } else {
        monthlyPayment =
          (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, months)) /
          (Math.pow(1 + monthlyRate, months) - 1);
      }
    }

    return {
      loanAmount,
      monthlyPayment,
    };
  }, [propertyPrice, downPayment, interestRate, years]);

  return (
    <View style={styles.calculatorPanel}>
      <View style={styles.panelHeaderRow}>
        <View>
          <Text style={styles.panelTitle}>
            {language === "id" ? "Kalkulator KPR" : "Mortgage Calculator"}
          </Text>

          <Text style={styles.panelSubSmall}>
            {language === "id"
              ? "Estimasi cicilan bulanan."
              : "Estimate monthly payment."}
          </Text>
        </View>

        <View style={styles.calculatorIcon}>
          <Text style={styles.calculatorIconText}>%</Text>
        </View>
      </View>

      <View style={styles.calculatorGrid}>
        <CalculatorInput
          label={language === "id" ? "Harga Properti" : "Property Price"}
          value={propertyPrice}
          onChangeText={setPropertyPrice}
        />

        <CalculatorInput
          label={language === "id" ? "DP" : "Down Payment"}
          value={downPayment}
          onChangeText={setDownPayment}
        />

        <CalculatorInput
          label={language === "id" ? "Bunga %" : "Interest %"}
          value={interestRate}
          onChangeText={setInterestRate}
        />

        <CalculatorInput
          label={language === "id" ? "Tahun" : "Years"}
          value={years}
          onChangeText={setYears}
        />
      </View>

      <View style={styles.calculatorResult}>
        <View>
          <Text style={styles.resultLabel}>
            {language === "id" ? "Estimasi Cicilan" : "Estimated Monthly"}
          </Text>

          <Text style={styles.resultValue}>
            IDR {Math.round(calculation.monthlyPayment).toLocaleString("id-ID")}
          </Text>
        </View>

        <View style={styles.resultDivider} />

        <View>
          <Text style={styles.resultLabel}>
            {language === "id" ? "Jumlah Pinjaman" : "Loan Amount"}
          </Text>

          <Text style={styles.resultValueSmall}>
            IDR {Math.round(calculation.loanAmount).toLocaleString("id-ID")}
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
  onChangeText: (value: string) => void;
}) {
  return (
    <View style={styles.calculatorInputBox}>
      <Text style={styles.calculatorInputLabel}>{label}</Text>

      <TextInput
        value={value}
        onChangeText={(next) => onChangeText(next.replace(/[^\d.]/g, ""))}
        keyboardType="numeric"
        placeholder="0"
        placeholderTextColor="#777777"
        style={styles.calculatorInput}
      />
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
    paddingBottom: 34,
  },
  loadingBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    gap: 16,
  },
  loadingText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "800",
  },
  backButton: {
    backgroundColor: "#e6c15c",
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  backButtonText: {
    color: "#111111",
    fontSize: 13,
    fontWeight: "900",
  },
  galleryWrap: {
    backgroundColor: "#050505",
  },
  heroImage: {
    height: 405,
    padding: 16,
    justifyContent: "space-between",
  },
  heroImageRadius: {
    borderBottomLeftRadius: 26,
    borderBottomRightRadius: 26,
  },
  heroShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.18)",
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 15,
    backgroundColor: "rgba(0,0,0,0.48)",
    alignItems: "center",
    justifyContent: "center",
  },
  languageToggle: {
    flexDirection: "row",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.22)",
    borderRadius: 999,
    overflow: "hidden",
    backgroundColor: "rgba(0,0,0,0.34)",
  },
  languageItem: {
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  languageItemActive: {
    backgroundColor: "#e6c15c",
  },
  languageText: {
    color: "#e6c15c",
    fontSize: 10.5,
    fontWeight: "900",
  },
  languageTextActive: {
    color: "#111111",
  },
  heroBottom: {
    gap: 6,
  },
  heroBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  badge: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(0,0,0,0.62)",
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 5,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  badgeText: {
    color: "#ffffff",
    fontSize: 10,
    fontWeight: "900",
  },
  galleryCounter: {
    backgroundColor: "rgba(0,0,0,0.62)",
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 5,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  galleryCounterText: {
    color: "#ffffff",
    fontSize: 10,
    fontWeight: "900",
  },
  price: {
    color: "#ffffff",
    fontSize: 20,
    fontWeight: "900",
    letterSpacing: -0.3,
  },
  title: {
    color: "#ffffff",
    fontSize: 18,
    lineHeight: 23,
    fontWeight: "900",
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  locationText: {
    color: "#ffffff",
    fontSize: 11.2,
    fontWeight: "800",
    flex: 1,
  },
  quickStatsRow: {
    flexDirection: "row",
    gap: 7,
    marginTop: 4,
  },
  quickStat: {
    borderRadius: 999,
    backgroundColor: "rgba(0,0,0,0.58)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    paddingHorizontal: 8,
    paddingVertical: 5,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  quickStatText: {
    color: "#ffffff",
    fontSize: 9.3,
    fontWeight: "900",
  },
  thumbnailRow: {
    paddingHorizontal: 18,
    paddingTop: 14,
    gap: 9,
  },
  thumbnailButton: {
    width: 70,
    height: 54,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#303030",
    overflow: "hidden",
  },
  thumbnailButtonActive: {
    borderColor: "#e6c15c",
    borderWidth: 2,
  },
  thumbnailImage: {
    width: "100%",
    height: "100%",
  },
  metaRow: {
    marginHorizontal: 18,
    marginTop: 18,
    flexDirection: "row",
    gap: 9,
    flexWrap: "wrap",
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#111111",
    borderWidth: 1,
    borderColor: "#2e2e2e",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  metaText: {
    color: "#ffffff",
    fontSize: 11.5,
    fontWeight: "900",
  },
  actionRow: {
    marginHorizontal: 18,
    marginTop: 14,
    flexDirection: "row",
    gap: 10,
  },
  whatsappButton: {
    flex: 1,
    minHeight: 43,
    borderRadius: 15,
    backgroundColor: "#25D366",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },
  primaryButtonText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "900",
  },
  scheduleButton: {
    flex: 1,
    minHeight: 43,
    borderRadius: 15,
    backgroundColor: "#e6c15c",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },
  scheduleButtonText: {
    color: "#111111",
    fontSize: 12,
    fontWeight: "900",
  },
  panel: {
    marginHorizontal: 18,
    marginTop: 18,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#303030",
    backgroundColor: "#101010",
    padding: 15,
  },
  panelHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    alignItems: "center",
  },
  panelTitle: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "900",
  },
  panelSub: {
    color: "#bdbdbd",
    fontSize: 12,
    lineHeight: 18,
    marginTop: 8,
    marginBottom: 12,
  },
  panelSubSmall: {
    color: "#bdbdbd",
    fontSize: 10.5,
    marginTop: 4,
  },
  descriptionText: {
    color: "#cfcfcf",
    fontSize: 12.5,
    lineHeight: 20,
    marginTop: 9,
  },
  videoBox: {
    marginTop: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#705d2c",
    backgroundColor: "#211a0b",
    padding: 14,
    alignItems: "center",
  },
  videoIcon: {
    width: 52,
    height: 52,
    borderRadius: 19,
    backgroundColor: "#e6c15c",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 9,
  },
  videoTitle: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "900",
  },
  videoSub: {
    color: "#bdbdbd",
    fontSize: 9.5,
    marginTop: 5,
    maxWidth: "90%",
  },
  flatSection: {
    marginHorizontal: 18,
    marginTop: 22,
  },
  flatSectionTitle: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "900",
    marginBottom: 15,
  },
  detailsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
    columnGap: 10,
    rowGap: 18,
  },
  detailChip: {
    width: 63,
    minHeight: 72,
    alignItems: "center",
    justifyContent: "flex-start",
    backgroundColor: "transparent",
  },
  detailIcon: {
    width: 44,
    height: 44,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#705d2c",
    backgroundColor: "#211a0b",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 7,
  },
  detailIconInner: {
    transform: [{ scale: 1.05 }],
  },
  detailValue: {
    color: "#ffffff",
    fontSize: 11.4,
    lineHeight: 14,
    fontWeight: "900",
    textAlign: "center",
  },
  calculatorPanel: {
    marginHorizontal: 18,
    marginTop: 18,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#705d2c",
    backgroundColor: "#211a0b",
    padding: 15,
  },
  calculatorIcon: {
    width: 40,
    height: 40,
    borderRadius: 15,
    backgroundColor: "#151106",
    borderWidth: 1,
    borderColor: "#705d2c",
    alignItems: "center",
    justifyContent: "center",
  },
  calculatorIconText: {
    color: "#e6c15c",
    fontSize: 16,
    fontWeight: "900",
  },
  calculatorGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 14,
  },
  calculatorInputBox: {
    width: "48%",
  },
  calculatorInputLabel: {
    color: "#d8d8d8",
    fontSize: 9.5,
    fontWeight: "800",
    marginBottom: 6,
  },
  calculatorInput: {
    height: 42,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#705d2c",
    backgroundColor: "#050505",
    color: "#ffffff",
    paddingHorizontal: 12,
    fontSize: 11.5,
    fontWeight: "800",
  },
  calculatorResult: {
    marginTop: 14,
    borderRadius: 18,
    backgroundColor: "#050505",
    borderWidth: 1,
    borderColor: "#705d2c",
    padding: 14,
    gap: 12,
  },
  resultLabel: {
    color: "#bdbdbd",
    fontSize: 9.5,
    fontWeight: "800",
  },
  resultValue: {
    color: "#e6c15c",
    fontSize: 17,
    fontWeight: "900",
    marginTop: 4,
  },
  resultValueSmall: {
    color: "#ffffff",
    fontSize: 12.5,
    fontWeight: "900",
    marginTop: 4,
  },
  resultDivider: {
    height: 1,
    backgroundColor: "#302711",
  },
  input: {
    borderWidth: 1,
    borderColor: "#303030",
    backgroundColor: "#050505",
    borderRadius: 15,
    paddingHorizontal: 13,
    height: 46,
    color: "#ffffff",
    marginTop: 10,
  },
  submitButton: {
    minHeight: 46,
    borderRadius: 16,
    backgroundColor: "#e6c15c",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 14,
  },
  submitButtonText: {
    color: "#111111",
    fontSize: 12.5,
    fontWeight: "900",
  },
  contactPanel: {
    marginHorizontal: 18,
    marginTop: 18,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#303030",
    backgroundColor: "#101010",
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  contactRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
  },
  contactPhoto: {
    width: 50,
    height: 50,
    borderRadius: 999,
    backgroundColor: "#211a0b",
  },
  contactInitials: {
    width: 50,
    height: 50,
    borderRadius: 999,
    backgroundColor: "#211a0b",
    borderWidth: 1,
    borderColor: "#705d2c",
    alignItems: "center",
    justifyContent: "center",
  },
  contactInitialsText: {
    color: "#e6c15c",
    fontSize: 14,
    fontWeight: "900",
  },
  contactTextBox: {
    flex: 1,
  },
  contactLabel: {
    color: "#a9a9a9",
    fontSize: 9.5,
    fontWeight: "800",
  },
  contactName: {
    color: "#ffffff",
    fontSize: 12.5,
    fontWeight: "900",
    marginTop: 3,
  },
  contactAgency: {
    color: "#bdbdbd",
    fontSize: 10,
    fontWeight: "700",
    marginTop: 2,
  },
  contactWhatsapp: {
    borderRadius: 999,
    backgroundColor: "#25D366",
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  contactWhatsappText: {
    color: "#ffffff",
    fontSize: 10,
    fontWeight: "900",
  },
  safetyPanel: {
    marginHorizontal: 18,
    marginTop: 18,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#705d2c",
    backgroundColor: "#12100a",
    padding: 15,
  },
  safetyHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  safetyIcon: {
    width: 44,
    height: 44,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#705d2c",
    backgroundColor: "#050505",
    alignItems: "center",
    justifyContent: "center",
  },
  safetyTextBox: {
    flex: 1,
  },
  safetyTitle: {
    color: "#e6c15c",
    fontSize: 15,
    fontWeight: "900",
  },
  safetySub: {
    color: "#d8d8d8",
    fontSize: 11,
    lineHeight: 15,
    fontWeight: "700",
    marginTop: 4,
  },
  safetyActionRow: {
    gap: 10,
    marginTop: 14,
  },
  safetyButton: {
    borderRadius: 17,
    borderWidth: 1,
    borderColor: "rgba(230,193,92,0.28)",
    backgroundColor: "#101010",
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  safetyButtonTextBox: {
    flex: 1,
  },
  safetyButtonTitle: {
    color: "#ffffff",
    fontSize: 12.5,
    fontWeight: "900",
  },
  safetyButtonSub: {
    color: "#a9a9a9",
    fontSize: 10,
    fontWeight: "700",
    marginTop: 2,
  },
  safetyNote: {
    borderRadius: 15,
    backgroundColor: "rgba(230,193,92,0.08)",
    borderWidth: 1,
    borderColor: "rgba(230,193,92,0.18)",
    padding: 10,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginTop: 12,
  },
  safetyNoteText: {
    color: "#cfcfcf",
    fontSize: 10.5,
    lineHeight: 15,
    fontWeight: "700",
    flex: 1,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.72)",
    justifyContent: "flex-start",
    paddingHorizontal: 18,
    paddingTop: 74,
  },
  scheduleModal: {
    backgroundColor: "#101010",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#303030",
    padding: 18,
  },
  scheduleModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    alignItems: "flex-start",
  },
  scheduleModalTitleBox: {
    flex: 1,
  },
  scheduleModalTitle: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "900",
  },
  scheduleModalSub: {
    color: "#bdbdbd",
    fontSize: 11.5,
    lineHeight: 17,
    marginTop: 4,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 14,
    backgroundColor: "#1b1b1b",
    alignItems: "center",
    justifyContent: "center",
  },
});