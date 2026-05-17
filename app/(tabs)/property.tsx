import { FontAwesome5 } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
  Bath,
  BedDouble,
  Bell,
  Bookmark,
  Building2,
  CalendarDays,
  Camera,
  ChevronDown,
  ChevronRight,
  Eye,
  Heart,
  Home,
  MapPin,
  MessageCircle,
  Ruler,
  Search,
  Share2,
  ShieldCheck,
  SlidersHorizontal,
  Star,
  Store,
  Tag,
  UserRound,
} from "lucide-react-native";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import {
  Image,
  ImageBackground,
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
import { fetchFeaturedAgents, type TetamoAgent } from "../../services/agents";
import {
  fetchHomepageProperties,
  fetchPropertiesByCodes,
  type TetamoProperty,
} from "../../services/properties";

type Language = "en" | "id";
type Currency = "IDR" | "USD" | "AUD";
type ViewMode = "all" | "sale" | "rent";

type AreaItem = {
  name: string;
  listings: string;
  image: string;
};

type AgentSocialItem = {
  key: string;
  url: string;
  iconName: string;
};

const tetamoLogo = require("../../assets/images/tetamo-logo.png");

const SCORPIO_GOLD = "#e6c15c";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?q=80&w=1400&auto=format&fit=crop";

const TETAMO_FALLBACK_WHATSAPP = process.env.EXPO_PUBLIC_TETAMO_FALLBACK_WHATSAPP || "";

const currencyRates: Record<Currency, number> = {
  IDR: 1,
  USD: 0.000061,
  AUD: 0.000094,
};

const AREA_IMAGES: Record<string, string> = {
  Bali: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?q=80&w=500&auto=format&fit=crop",
  Jakarta:
    "https://images.unsplash.com/photo-1525625293386-3f8f99389edd?q=80&w=500&auto=format&fit=crop",
  Canggu:
    "https://images.unsplash.com/photo-1577717903315-1691ae25ab3f?q=80&w=500&auto=format&fit=crop",
  Seminyak:
    "https://images.unsplash.com/photo-1540541338287-41700207dee6?q=80&w=500&auto=format&fit=crop",
  Uluwatu:
    "https://images.unsplash.com/photo-1510414842594-a61c69b5ae57?q=80&w=500&auto=format&fit=crop",
  Bandung:
    "https://images.unsplash.com/photo-1523059623039-a9ed027e7fad?q=80&w=500&auto=format&fit=crop",
  Surabaya:
    "https://images.unsplash.com/photo-1564507592333-c60657eea523?q=80&w=500&auto=format&fit=crop",
  Badung:
    "https://images.unsplash.com/photo-1537996194471-e657df975ab4?q=80&w=500&auto=format&fit=crop",
  Gianyar:
    "https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?q=80&w=500&auto=format&fit=crop",
  Denpasar:
    "https://images.unsplash.com/photo-1555400038-63f5ba517a47?q=80&w=500&auto=format&fit=crop",
};

const fallbackFeaturedSale: TetamoProperty = {
  id: "featured-sale-fallback",
  kode: "TTM0 - E2",
  titleEn: "Featured Verified Sale Property",
  titleId: "Properti Dijual Terverifikasi",
  descriptionEn: "Curated featured sale property selected by Tetamo.",
  descriptionId: "Properti dijual unggulan yang dipilih oleh Tetamo.",
  location: "Indonesia",
  area: "Indonesia",
  image:
    "https://images.unsplash.com/photo-1613490493576-7fde63acd811?q=80&w=1400&auto=format&fit=crop",
  images: [
    "https://images.unsplash.com/photo-1613490493576-7fde63acd811?q=80&w=1400&auto=format&fit=crop",
  ],
  priceIdr: 0,
  beds: 0,
  baths: 0,
  size: 0,
  badge: "Verified",
  viewCount: 0,
  likeCount: 0,
  saveCount: 0,
  ratingCount: 0,
  ratingAverage: 0,
  shareCount: 0,
  listingType: "sale",
};

const fallbackFeaturedRent: TetamoProperty = {
  id: "featured-rent-fallback",
  kode: "TTM TNH 83",
  titleEn: "Featured Verified Rental Property",
  titleId: "Properti Sewa Terverifikasi",
  descriptionEn: "Curated featured rental property selected by Tetamo.",
  descriptionId: "Properti sewa unggulan yang dipilih oleh Tetamo.",
  location: "Indonesia",
  area: "Indonesia",
  image:
    "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?q=80&w=1400&auto=format&fit=crop",
  images: [
    "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?q=80&w=1400&auto=format&fit=crop",
  ],
  priceIdr: 0,
  beds: 0,
  baths: 0,
  size: 0,
  badge: "Verified",
  viewCount: 0,
  likeCount: 0,
  saveCount: 0,
  ratingCount: 0,
  ratingAverage: 0,
  shareCount: 0,
  listingType: "rent",
  rentalType: "yearly",
};

const fallbackSaleProperties: TetamoProperty[] = [
  {
    id: "fallback-sale-1",
    kode: "SALE-1",
    titleEn: "Modern Villa with Ocean View",
    titleId: "Villa Modern dengan Pemandangan Laut",
    descriptionEn: "Premium sale property in Uluwatu.",
    descriptionId: "Properti dijual premium di Uluwatu.",
    location: "Uluwatu, Bali",
    area: "Uluwatu",
    image:
      "https://images.unsplash.com/photo-1613490493576-7fde63acd811?q=80&w=1400&auto=format&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1613490493576-7fde63acd811?q=80&w=1400&auto=format&fit=crop",
    ],
    priceIdr: 2550000000,
    beds: 3,
    baths: 3,
    size: 250,
    badge: "Verified",
    viewCount: 1200,
    likeCount: 0,
    saveCount: 0,
    ratingCount: 0,
    ratingAverage: 0,
    shareCount: 0,
    listingType: "sale",
    propertyType: "villa",
  },
];

const fallbackRentProperties: TetamoProperty[] = [
  {
    id: "fallback-rent-1",
    kode: "RENT-1",
    titleEn: "2BR Villa in Seminyak",
    titleId: "Villa 2KT di Seminyak",
    descriptionEn: "Monthly rental villa in Seminyak.",
    descriptionId: "Villa sewa bulanan di Seminyak.",
    location: "Seminyak, Bali",
    area: "Seminyak",
    image:
      "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?q=80&w=1400&auto=format&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?q=80&w=1400&auto=format&fit=crop",
    ],
    priceIdr: 28000000,
    beds: 2,
    baths: 2,
    size: 120,
    badge: "Verified",
    viewCount: 540,
    likeCount: 0,
    saveCount: 0,
    ratingCount: 0,
    ratingAverage: 0,
    shareCount: 0,
    listingType: "rent",
    rentalType: "monthly",
    propertyType: "villa",
  },
];

const newProjects = [
  {
    id: "project-1",
    titleEn: "TETAMO Uluwatu Resort",
    titleId: "TETAMO Uluwatu Resort",
    location: "Uluwatu, Bali",
    image:
      "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?q=80&w=1400&auto=format&fit=crop",
    priceIdr: 1650000000,
  },
  {
    id: "project-2",
    titleEn: "TETAMO Jakarta Residences",
    titleId: "TETAMO Jakarta Residences",
    location: "Kuningan, Jakarta",
    image:
      "https://images.unsplash.com/photo-1600607688969-a5bfcd646154?q=80&w=1400&auto=format&fit=crop",
    priceIdr: 2800000000,
  },
  {
    id: "project-3",
    titleEn: "TETAMO Canggu Townhouse",
    titleId: "TETAMO Canggu Townhouse",
    location: "Canggu, Bali",
    image:
      "https://images.unsplash.com/photo-1600566752355-35792bedcfea?q=80&w=1400&auto=format&fit=crop",
    priceIdr: 1250000000,
  },
  {
    id: "project-4",
    titleEn: "TETAMO Ubud Villas",
    titleId: "TETAMO Ubud Villas",
    location: "Ubud, Bali",
    image:
      "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?q=80&w=1400&auto=format&fit=crop",
    priceIdr: 2150000000,
  },
];

const copy = {
  en: {
    subtitle: "Properti Marketplace",
    search: "Search by location, property type, or keyword...",
    sale: "For Sale",
    rent: "For Rent",
    seeAll: "See all",
    featuredProperty: "Featured Sale",
    featuredRental: "Featured Rent",
    viewDetails: "Details",
    whatsapp: "WhatsApp",
    schedule: "Schedule",
    popularAreas: "Popular Areas",
    newProjects: "New Projects",
    featuredAgents: "Featured Agents",
    listTitle: "List your property with TETAMO",
    listSub: "Reach serious buyers & renters across Indonesia.",
    getStarted: "Start",
    owner: "Owner",
    agent: "Agent",
    developer: "Developer",
    buy: "Buy",
    rentSmall: "Rent",
    from: "From",
    priceRequest: "Price on Request",
    listing: "Listing",
    listings: "Listings",
    verifiedAgent: "Verified Agent",
  },
  id: {
    subtitle: "Properti Marketplace",
    search: "Cari lokasi, tipe properti, atau kata kunci...",
    sale: "Dijual",
    rent: "Disewa",
    seeAll: "Lihat semua",
    featuredProperty: "Dijual Unggulan",
    featuredRental: "Sewa Unggulan",
    viewDetails: "Detail",
    whatsapp: "WhatsApp",
    schedule: "Jadwal",
    popularAreas: "Area Populer",
    newProjects: "Proyek Baru",
    featuredAgents: "Agen Unggulan",
    listTitle: "Listing properti Anda dengan TETAMO",
    listSub: "Jangkau pembeli & penyewa serius di Indonesia.",
    getStarted: "Mulai",
    owner: "Pemilik",
    agent: "Agen",
    developer: "Developer",
    buy: "Beli",
    rentSmall: "Sewa",
    from: "Mulai",
    priceRequest: "Hubungi Kami",
    listing: "Listing",
    listings: "Listing",
    verifiedAgent: "Agen Terverifikasi",
  },
};

export default function PropertyScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const [language, setLanguage] = useState<Language>("en");
  const [currency, setCurrency] = useState<Currency>("IDR");
  const [searchInput, setSearchInput] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("all");
  const [latestProperties, setLatestProperties] = useState<TetamoProperty[]>([]);
  const [featuredSale, setFeaturedSale] =
    useState<TetamoProperty>(fallbackFeaturedSale);
  const [featuredRent, setFeaturedRent] =
    useState<TetamoProperty>(fallbackFeaturedRent);
  const [featuredAgents, setFeaturedAgents] = useState<TetamoAgent[]>([]);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);

  const t = copy[language];

  useEffect(() => {
    const listingTypeParam =
      typeof params.listingType === "string" ? params.listingType : "";

    if (listingTypeParam === "sale") setViewMode("sale");
    else if (listingTypeParam === "rent") setViewMode("rent");
    else setViewMode("all");
  }, [params.listingType]);

  useEffect(() => {
    let isMounted = true;

    async function loadProperties() {
      try {
        const [latest, featured, agents] = await Promise.all([
          fetchHomepageProperties(80),
          fetchPropertiesByCodes(["TTM0 - E2", "TTM TNH 83"]),
          fetchFeaturedAgents(),
        ]);

        if (!isMounted) return;

        setLatestProperties(latest);
        setFeaturedAgents(agents);

        const saleFeature = featured.find(
          (property) =>
            normalizeKode(property.kode) === normalizeKode("TTM0 - E2")
        );

        const rentFeature = featured.find(
          (property) =>
            normalizeKode(property.kode) === normalizeKode("TTM TNH 83")
        );

        if (saleFeature) setFeaturedSale(saleFeature);
        if (rentFeature) setFeaturedRent(rentFeature);
      } catch (error) {
        console.log("Tetamo property page error:", error);
      }
    }

    loadProperties();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadUnreadNotificationCount() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!isMounted) return;

      if (!user?.id) {
        setUnreadNotificationCount(0);
        return;
      }

      const { count, error } = await supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .is("read_at", null);

      if (!isMounted) return;

      if (error) {
        setUnreadNotificationCount(0);
        return;
      }

      setUnreadNotificationCount(count || 0);
    }

    void loadUnreadNotificationCount();

    const interval = setInterval(() => {
      void loadUnreadNotificationCount();
    }, 60000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const saleProperties = useMemo(() => {
    const rows = latestProperties
      .filter(isSaleProperty)
      .filter((property) => property.id !== featuredSale.id)
      .slice(0, 8);

    return rows.length > 0 ? rows : fallbackSaleProperties;
  }, [featuredSale.id, latestProperties]);

  const rentProperties = useMemo(() => {
    const rows = latestProperties
      .filter(isRentProperty)
      .filter((property) => property.id !== featuredRent.id)
      .slice(0, 8);

    return rows.length > 0 ? rows : fallbackRentProperties;
  }, [featuredRent.id, latestProperties]);

  const dynamicPopularAreas = useMemo(() => {
    return buildPopularAreas(latestProperties, language);
  }, [latestProperties, language]);

  const formatPrice = useMemo(() => {
    return (priceIdr: number, rentalType?: string | null) => {
      if (!priceIdr || priceIdr <= 0) {
        return t.priceRequest;
      }

      const converted = priceIdr * currencyRates[currency];

      let base =
        currency === "IDR"
          ? `IDR ${Math.round(converted).toLocaleString("id-ID")}`
          : `${currency} ${Math.round(converted).toLocaleString("en-US")}`;

      const normalizedRental = normalizeValue(rentalType);

      if (
        normalizedRental.includes("monthly") ||
        normalizedRental.includes("bulanan")
      ) {
        base += language === "id" ? " /bln" : " /mo";
      }

      if (
        normalizedRental.includes("yearly") ||
        normalizedRental.includes("tahunan")
      ) {
        base += language === "id" ? " /thn" : " /yr";
      }

      if (
        normalizedRental.includes("daily") ||
        normalizedRental.includes("harian")
      ) {
        base += language === "id" ? " /hari" : " /day";
      }

      return base;
    };
  }, [currency, language, t.priceRequest]);

  const approxUsd = (priceIdr: number) => {
    if (!priceIdr || priceIdr <= 0) return "";

    return `≈ USD ${Math.round(priceIdr * currencyRates.USD).toLocaleString(
      "en-US"
    )}`;
  };

  const goSearch = (searchParams?: Record<string, string>) => {
    const query = new URLSearchParams();

    Object.entries(searchParams || {}).forEach(([key, value]) => {
      if (value.trim()) query.set(key, value.trim());
    });

    const qs = query.toString();
    router.push(qs ? (`/search?${qs}` as any) : ("/search" as any));
  };

  const submitSearch = () => {
    const keyword = searchInput.trim();

    if (keyword) {
      goSearch({ query: keyword });
      return;
    }

    goSearch();
  };

  const goSeeAll = (type: ViewMode) => {
    if (type === "sale") {
      goSearch({ listingType: "sale" });
      return;
    }

    if (type === "rent") {
      goSearch({ listingType: "rent" });
      return;
    }

    goSearch();
  };

  const goDetails = (property: TetamoProperty, schedule = false) => {
    const pathKey = encodeURIComponent(property.slug || property.id);
    router.push(`/properti/${pathKey}${schedule ? "?schedule=1" : ""}` as any);
  };

  const goNotifications = () => {
    router.push("/dashboard/notifications" as any);
  };

  const openWhatsapp = (property: TetamoProperty) => {
    const phone =
      normalizeWhatsappPhone(property.contactPhone) || TETAMO_FALLBACK_WHATSAPP;
    const title = language === "en" ? property.titleEn : property.titleId;
    const receiverName = property.contactName || "Tetamo";

    const message =
      language === "id"
        ? `Halo ${receiverName}, saya tertarik dengan properti ini di TETAMO.

Properti: ${title}
Kode: ${property.kode || "-"}
Lokasi: ${property.location}
Harga: ${formatPrice(property.priceIdr, property.rentalType)}

Apakah properti ini masih tersedia?`
        : `Hello ${receiverName}, I'm interested in this property on TETAMO.

Property: ${title}
Code: ${property.kode || "-"}
Location: ${property.location}
Price: ${formatPrice(property.priceIdr, property.rentalType)}

Is this property still available?`;

    void Linking.openURL(
      `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.brandRow}>
            <Image
              source={tetamoLogo}
              style={styles.logoImage}
              resizeMode="contain"
            />

            <View style={styles.brandTextWrap}>
              <Text style={styles.brandText}>TETAMO</Text>
              <Text style={styles.brandSub}>{t.subtitle}</Text>
            </View>
          </View>

          <View style={styles.headerControls}>
            <View style={styles.locationBellRow}>
              <Pressable
                style={styles.locationPill}
                onPress={() => goSearch({ query: "Indonesia" })}
              >
                <MapPin color={SCORPIO_GOLD} size={12} />
                <Text style={styles.pillText}>Indonesia</Text>
                <ChevronDown color={SCORPIO_GOLD} size={12} />
              </Pressable>

              <Pressable
                style={styles.notificationBellButton}
                onPress={goNotifications}
              >
                <Bell color={SCORPIO_GOLD} size={17} />

                {unreadNotificationCount > 0 ? (
                  <View style={styles.notificationBadge}>
                    <Text style={styles.notificationBadgeText}>
                      {formatUnreadCount(unreadNotificationCount)}
                    </Text>
                  </View>
                ) : null}
              </Pressable>
            </View>

            <View style={styles.toggleLine}>
              <View style={styles.toggleGroup}>
                {(["en", "id"] as Language[]).map((item) => (
                  <Pressable
                    key={item}
                    onPress={() => setLanguage(item)}
                    style={[
                      styles.toggleItem,
                      language === item && styles.toggleItemActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.toggleText,
                        language === item && styles.toggleTextActive,
                      ]}
                    >
                      {item.toUpperCase()}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <View style={styles.toggleGroup}>
                {(["IDR", "USD", "AUD"] as Currency[]).map((item) => (
                  <Pressable
                    key={item}
                    onPress={() => setCurrency(item)}
                    style={[
                      styles.currencyItem,
                      currency === item && styles.toggleItemActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.currencyText,
                        currency === item && styles.toggleTextActive,
                      ]}
                    >
                      {item}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </View>
        </View>

        <View style={styles.searchGlowWrap}>
          <View style={styles.searchBar}>
            <Search color={SCORPIO_GOLD} size={20} />

            <TextInput
              value={searchInput}
              onChangeText={setSearchInput}
              placeholder={t.search}
              placeholderTextColor="#8f8f8f"
              style={styles.searchInput}
              returnKeyType="search"
              onSubmitEditing={submitSearch}
            />

            <Pressable style={styles.filterButton} onPress={() => goSearch()}>
              <SlidersHorizontal color="#111111" size={19} />
            </Pressable>
          </View>
        </View>

        {(viewMode === "all" || viewMode === "sale") && (
          <>
            <SectionTitle
              icon={<Tag color={SCORPIO_GOLD} size={19} />}
              title={t.sale}
              action={t.seeAll}
              onPress={() => goSeeAll("sale")}
            />

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.cardCarousel}
            >
              {saleProperties.map((property) => (
                <MarketPropertyCard
                  key={property.id}
                  property={property}
                  language={language}
                  formatPrice={formatPrice}
                  approxUsd={approxUsd}
                  whatsappLabel={t.whatsapp}
                  scheduleLabel={t.schedule}
                  onWhatsapp={() => openWhatsapp(property)}
                  onSchedule={() => goDetails(property, true)}
                  onDetails={() => goDetails(property)}
                />
              ))}
            </ScrollView>

            <FeaturedPropertyShowcase
              property={featuredSale}
              label={t.featuredProperty}
              buttonText={t.viewDetails}
              whatsappLabel={t.whatsapp}
              scheduleLabel={t.schedule}
              language={language}
              formatPrice={formatPrice}
              approxUsd={approxUsd}
              onWhatsapp={() => openWhatsapp(featuredSale)}
              onSchedule={() => goDetails(featuredSale, true)}
              onViewDetails={() => goDetails(featuredSale)}
            />
          </>
        )}

        {(viewMode === "all" || viewMode === "rent") && (
          <>
            <SectionTitle
              icon={<Home color={SCORPIO_GOLD} size={19} />}
              title={t.rent}
              action={t.seeAll}
              onPress={() => goSeeAll("rent")}
            />

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.cardCarousel}
            >
              {rentProperties.map((property) => (
                <MarketPropertyCard
                  key={property.id}
                  property={property}
                  language={language}
                  formatPrice={formatPrice}
                  approxUsd={approxUsd}
                  whatsappLabel={t.whatsapp}
                  scheduleLabel={t.schedule}
                  onWhatsapp={() => openWhatsapp(property)}
                  onSchedule={() => goDetails(property, true)}
                  onDetails={() => goDetails(property)}
                />
              ))}
            </ScrollView>

            <FeaturedPropertyShowcase
              property={featuredRent}
              label={t.featuredRental}
              buttonText={t.viewDetails}
              whatsappLabel={t.whatsapp}
              scheduleLabel={t.schedule}
              language={language}
              formatPrice={formatPrice}
              approxUsd={approxUsd}
              onWhatsapp={() => openWhatsapp(featuredRent)}
              onSchedule={() => goDetails(featuredRent, true)}
              onViewDetails={() => goDetails(featuredRent)}
            />
          </>
        )}

        <View style={styles.ctaBanner}>
          <View style={styles.ctaIconCircle}>
            <Home color="#111111" size={22} />
          </View>

          <View style={styles.ctaContent}>
            <Text style={styles.ctaTitle} numberOfLines={1}>
              {t.listTitle}
            </Text>

            <Text style={styles.ctaSub}>{t.listSub}</Text>

            <View style={styles.ctaChips}>
              <MiniChip icon={<Home color="#ffffff" size={10} />} label={t.owner} />
              <MiniChip icon={<UserRound color="#ffffff" size={10} />} label={t.agent} />
              <MiniChip
                icon={<Building2 color="#ffffff" size={10} />}
                label={t.developer}
              />
              <MiniChip icon={<Store color="#ffffff" size={10} />} label={t.buy} />
              <MiniChip icon={<Tag color="#ffffff" size={10} />} label={t.rentSmall} />
            </View>
          </View>

          <Pressable
            style={styles.ctaButton}
            onPress={() => router.push("/add-listing" as any)}
          >
            <Text style={styles.ctaButtonText}>{t.getStarted}</Text>
            <ChevronRight color="#111111" size={14} />
          </Pressable>
        </View>

        <View style={styles.popularPanel}>
          <SectionTitle
            icon={<MapPin color={SCORPIO_GOLD} size={19} />}
            title={t.popularAreas}
            action=""
          />

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.areaCarousel}
          >
            {dynamicPopularAreas.map((area) => (
              <Pressable
                key={area.name}
                style={styles.areaCard}
                onPress={() => goSearch({ area: area.name })}
              >
                <Image source={{ uri: area.image }} style={styles.areaImage} />
                <View style={styles.areaTextBox}>
                  <Text style={styles.areaName} numberOfLines={1}>
                    {area.name}
                  </Text>
                  <Text style={styles.areaListings} numberOfLines={1}>
                    {area.listings}
                  </Text>
                </View>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        <SectionTitle
          icon={<UserRound color={SCORPIO_GOLD} size={19} />}
          title={t.featuredAgents}
          action=""
        />

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.agentCarousel}
        >
          {featuredAgents.map((agent) => (
            <AgentCard
              key={agent.id}
              agent={agent}
              verifiedText={t.verifiedAgent}
            />
          ))}
        </ScrollView>

        <SectionTitle
          icon={<Building2 color={SCORPIO_GOLD} size={19} />}
          title={t.newProjects}
          action=""
        />

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.projectCarousel}
        >
          {newProjects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              language={language}
              formatPrice={formatPrice}
              fromText={t.from}
              onPress={() => goSearch({ query: project.location })}
            />
          ))}
        </ScrollView>
      </ScrollView>
    </SafeAreaView>
  );
}

function formatUnreadCount(value: number) {
  if (value > 99) return "99+";
  return String(value);
}

function normalizeValue(value?: string | null) {
  return String(value || "").toLowerCase().replace(/[_-]/g, " ").trim();
}

function normalizeKode(value?: string | null) {
  return String(value || "")
    .toUpperCase()
    .replace(/\s+/g, "")
    .replace(/-/g, "");
}

function normalizeWhatsappPhone(value?: string | null) {
  const digits = String(value || "").replace(/[^\d]/g, "");

  if (!digits) return "";
  if (digits.startsWith("62")) return digits;
  if (digits.startsWith("0")) return `62${digits.slice(1)}`;
  if (digits.startsWith("8")) return `62${digits}`;

  return digits;
}

function cleanExternalUrl(value?: string | null) {
  let url = String(value || "").trim();

  if (!url) return "";

  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    return "";
  }

  if (url.includes("tiktok.com")) {
    url = url.split("?")[0];
  }

  return url;
}

function isSafeUrl(value?: string | null) {
  return cleanExternalUrl(value).length > 0;
}

async function safeOpenUrl(value?: string | null) {
  const url = cleanExternalUrl(value);

  if (!url) return;

  try {
    await Linking.openURL(url);
  } catch (error) {
    console.log("Tetamo social link could not open:", url, error);
  }
}

function isSaleProperty(property: TetamoProperty) {
  const value = normalizeValue(property.listingType);

  return (
    value.includes("sale") ||
    value.includes("sell") ||
    value.includes("jual") ||
    value.includes("dijual")
  );
}

function isRentProperty(property: TetamoProperty) {
  const value = normalizeValue(property.listingType);

  return (
    value.includes("rent") ||
    value.includes("rental") ||
    value.includes("sewa") ||
    value.includes("disewa")
  );
}

function getPhotoCount(property: TetamoProperty) {
  if (property.images?.length) return property.images.length;
  if (property.image) return 1;
  return 0;
}

function formatCompactNumber(value?: number) {
  const count = Number(value || 0);

  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
  if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;

  return String(count);
}

function formatRating(property: TetamoProperty) {
  const average = Number(property.ratingAverage || 0);
  const count = Number(property.ratingCount || 0);

  if (average > 0) {
    return `${average.toFixed(1)} (${formatCompactNumber(count)})`;
  }

  return "0";
}

function buildPopularAreas(properties: TetamoProperty[], language: Language): AreaItem[] {
  const label = language === "id" ? "Listing" : "Listings";
  const counts = new Map<string, number>();

  properties.forEach((property) => {
    const area = String(property.area || property.city || property.province || "")
      .split(",")[0]
      .trim();

    if (!area) return;

    counts.set(area, (counts.get(area) || 0) + 1);
  });

  const rows = Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([name, count]) => ({
      name,
      listings: `${count.toLocaleString("en-US")} ${label}`,
      image: AREA_IMAGES[name] || AREA_IMAGES.Bali,
    }));

  if (rows.length > 0) return rows;

  return [
    {
      name: "Bali",
      listings: `0 ${label}`,
      image: AREA_IMAGES.Bali,
    },
    {
      name: "Jakarta",
      listings: `0 ${label}`,
      image: AREA_IMAGES.Jakarta,
    },
    {
      name: "Canggu",
      listings: `0 ${label}`,
      image: AREA_IMAGES.Canggu,
    },
    {
      name: "Seminyak",
      listings: `0 ${label}`,
      image: AREA_IMAGES.Seminyak,
    },
  ];
}

function getAgentSocialItems(agent: TetamoAgent): AgentSocialItem[] {
  const socials: AgentSocialItem[] = [];

  if (isSafeUrl(agent.instagramUrl)) {
    socials.push({
      key: "instagram",
      url: agent.instagramUrl || "",
      iconName: "instagram",
    });
  }

  if (isSafeUrl(agent.facebookUrl)) {
    socials.push({
      key: "facebook",
      url: agent.facebookUrl || "",
      iconName: "facebook-f",
    });
  }

  if (isSafeUrl(agent.tiktokUrl)) {
    socials.push({
      key: "tiktok",
      url: agent.tiktokUrl || "",
      iconName: "tiktok",
    });
  }

  if (isSafeUrl(agent.linkedinUrl)) {
    socials.push({
      key: "linkedin",
      url: agent.linkedinUrl || "",
      iconName: "linkedin-in",
    });
  }

  return socials;
}

function SectionTitle({
  icon,
  title,
  action,
  onPress,
}: {
  icon: ReactNode;
  title: string;
  action: string;
  onPress?: () => void;
}) {
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionTitleRow}>
        {icon}
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>

      {!!action && (
        <Pressable style={styles.seeAllButton} onPress={onPress}>
          <Text style={styles.seeAllText}>{action}</Text>
          <ChevronRight color={SCORPIO_GOLD} size={14} />
        </Pressable>
      )}
    </View>
  );
}

function EngagementMetrics({ property }: { property: TetamoProperty }) {
  return (
    <View style={styles.engagementRow}>
      <RealMetric
        icon={<Heart color="#ffffff" size={9} />}
        value={formatCompactNumber(property.likeCount)}
      />

      <RealMetric
        icon={<Bookmark color="#ffffff" size={9} />}
        value={formatCompactNumber(property.saveCount)}
      />

      <RealMetric
        icon={<Star color={SCORPIO_GOLD} size={9} />}
        value={formatRating(property)}
        wide
      />

      <RealMetric
        icon={<Share2 color="#ffffff" size={9} />}
        value={formatCompactNumber(property.shareCount)}
      />

      <RealMetric
        icon={<Eye color="#ffffff" size={9} />}
        value={formatCompactNumber(property.viewCount)}
      />

      <RealMetric
        icon={<Camera color="#ffffff" size={9} />}
        value={formatCompactNumber(getPhotoCount(property))}
      />
    </View>
  );
}

function FeaturedEngagementMetrics({ property }: { property: TetamoProperty }) {
  return (
    <View style={styles.featuredMetricColumn}>
      <FeaturedMetric
        icon={<Heart color={SCORPIO_GOLD} size={10} />}
        value={formatCompactNumber(property.likeCount)}
      />

      <FeaturedMetric
        icon={<Bookmark color={SCORPIO_GOLD} size={10} />}
        value={formatCompactNumber(property.saveCount)}
      />

      <FeaturedMetric
        icon={<Star color={SCORPIO_GOLD} size={10} />}
        value={formatRating(property)}
        wide
      />

      <FeaturedMetric
        icon={<Share2 color={SCORPIO_GOLD} size={10} />}
        value={formatCompactNumber(property.shareCount)}
      />

      <FeaturedMetric
        icon={<Eye color={SCORPIO_GOLD} size={10} />}
        value={formatCompactNumber(property.viewCount)}
      />

      <FeaturedMetric
        icon={<Camera color={SCORPIO_GOLD} size={10} />}
        value={formatCompactNumber(getPhotoCount(property))}
      />
    </View>
  );
}

function FeaturedMetric({
  icon,
  value,
  wide = false,
}: {
  icon: ReactNode;
  value: string;
  wide?: boolean;
}) {
  return (
    <View style={[styles.featuredMetricPill, wide && styles.featuredMetricPillWide]}>
      {icon}
      <Text style={styles.featuredMetricText} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

function MarketPropertyCard({
  property,
  language,
  formatPrice,
  approxUsd,
  whatsappLabel,
  scheduleLabel,
  onWhatsapp,
  onSchedule,
  onDetails,
}: {
  property: TetamoProperty;
  language: Language;
  formatPrice: (priceIdr: number, rentalType?: string | null) => string;
  approxUsd: (priceIdr: number) => string;
  whatsappLabel: string;
  scheduleLabel: string;
  onWhatsapp: () => void;
  onSchedule: () => void;
  onDetails: () => void;
}) {
  const title = language === "en" ? property.titleEn : property.titleId;
  const usdText = approxUsd(property.priceIdr);

  return (
    <Pressable style={styles.marketCard} onPress={onDetails}>
      <View style={styles.marketImageWrap}>
        <Image
          source={{ uri: property.image || FALLBACK_IMAGE }}
          style={styles.marketImage}
        />

        <View style={styles.marketBadgeRow}>
          {getBadgesForProperty(property).map((badge) => (
            <StatusBadge
              key={badge.key}
              label={badge.label}
              bg={badge.bg}
              color={badge.color}
            />
          ))}
        </View>

        <Pressable
          style={styles.marketHeartButton}
          onPress={(event: any) => event.stopPropagation?.()}
        >
          <Heart color="#ffffff" size={16} />
        </Pressable>
      </View>

      <View style={styles.marketBody}>
        <Text style={styles.marketPrice} numberOfLines={1}>
          {formatPrice(property.priceIdr, property.rentalType)}
        </Text>

        {!!usdText && (
          <Text style={styles.marketUsd} numberOfLines={1}>
            {usdText}
          </Text>
        )}

        <Text style={styles.marketTitle} numberOfLines={1}>
          {title}
        </Text>

        <View style={styles.inlineLocation}>
          <MapPin color={SCORPIO_GOLD} size={10} />
          <Text style={styles.inlineLocationText} numberOfLines={1}>
            {property.location}
          </Text>
        </View>

        <View style={styles.marketMetaRow}>
          <MarketMeta
            icon={<BedDouble color={SCORPIO_GOLD} size={10} />}
            value={property.beds || 0}
          />
          <MarketMeta
            icon={<Bath color={SCORPIO_GOLD} size={10} />}
            value={property.baths || 0}
          />
          <MarketMeta
            icon={<Ruler color={SCORPIO_GOLD} size={10} />}
            value={`${property.size || 0} m²`}
          />
        </View>

        <EngagementMetrics property={property} />

        <View style={styles.marketActionRow}>
          <Pressable
            style={styles.marketActionPill}
            onPress={(event: any) => {
              event.stopPropagation?.();
              onWhatsapp();
            }}
          >
            <MessageCircle color="#25D366" size={12} />
            <Text style={styles.marketActionText}>{whatsappLabel}</Text>
          </Pressable>

          <Pressable
            style={styles.marketActionPill}
            onPress={(event: any) => {
              event.stopPropagation?.();
              onSchedule();
            }}
          >
            <CalendarDays color={SCORPIO_GOLD} size={12} />
            <Text style={styles.marketActionText}>{scheduleLabel}</Text>
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
}

function MarketMeta({ icon, value }: { icon: ReactNode; value: string | number }) {
  return (
    <View style={styles.marketMetaItem}>
      {icon}
      <Text style={styles.marketMetaText}>{value}</Text>
    </View>
  );
}

function FeaturedPropertyShowcase({
  property,
  label,
  buttonText,
  whatsappLabel,
  scheduleLabel,
  language,
  formatPrice,
  approxUsd,
  onWhatsapp,
  onSchedule,
  onViewDetails,
}: {
  property: TetamoProperty;
  label: string;
  buttonText: string;
  whatsappLabel: string;
  scheduleLabel: string;
  language: Language;
  formatPrice: (priceIdr: number, rentalType?: string | null) => string;
  approxUsd: (priceIdr: number) => string;
  onWhatsapp: () => void;
  onSchedule: () => void;
  onViewDetails: () => void;
}) {
  const title = language === "en" ? property.titleEn : property.titleId;
  const usdText = approxUsd(property.priceIdr);

  return (
    <Pressable style={styles.featuredShowcase} onPress={onViewDetails}>
      <View style={styles.featuredImageWrap}>
        <ImageBackground
          source={{ uri: property.image || FALLBACK_IMAGE }}
          resizeMode="cover"
          style={styles.featuredImage}
          imageStyle={styles.featuredImageRadius}
        >
          <View style={styles.featuredImageShade} />

          <View style={styles.featuredTopBadge}>
            <Star color="#111111" size={11} />
            <Text style={styles.featuredTopBadgeText}>Featured</Text>
          </View>
        </ImageBackground>
      </View>

      <View style={styles.featuredInfoPanel}>
        <View style={styles.featuredMainContent}>
          <View style={styles.featuredLeftContent}>
            <View style={styles.featuredHeaderRow}>
              <View style={styles.featuredHeaderLeft}>
                <Text style={styles.featuredSectionLabel} numberOfLines={1}>
                  {label}
                </Text>

                <Text style={styles.featuredPrice} numberOfLines={1}>
                  {formatPrice(property.priceIdr, property.rentalType)}
                </Text>

                {!!usdText && (
                  <Text style={styles.featuredUsd} numberOfLines={1}>
                    {usdText}
                  </Text>
                )}
              </View>

              <View style={styles.featuredLocationBox}>
                <MapPin color={SCORPIO_GOLD} size={11} />
                <Text style={styles.featuredLocationText} numberOfLines={2}>
                  {property.location}
                </Text>
              </View>
            </View>

            <Text style={styles.featuredTitle} numberOfLines={2}>
              {title}
            </Text>

            <View style={styles.featuredMetaRow}>
              <FeaturedMeta
                icon={<BedDouble color={SCORPIO_GOLD} size={12} />}
                value={property.beds || 0}
              />
              <FeaturedMeta
                icon={<Bath color={SCORPIO_GOLD} size={12} />}
                value={property.baths || 0}
              />
              <FeaturedMeta
                icon={<Ruler color={SCORPIO_GOLD} size={12} />}
                value={`${property.size || 0} m²`}
              />
            </View>

            <View style={styles.featuredActionRow}>
              <Pressable
                style={styles.featuredActionButton}
                onPress={(event: any) => {
                  event.stopPropagation?.();
                  onWhatsapp();
                }}
              >
                <MessageCircle color="#25D366" size={12} />
                <Text style={styles.featuredActionText}>{whatsappLabel}</Text>
              </Pressable>

              <Pressable
                style={styles.featuredActionButton}
                onPress={(event: any) => {
                  event.stopPropagation?.();
                  onSchedule();
                }}
              >
                <CalendarDays color={SCORPIO_GOLD} size={12} />
                <Text style={styles.featuredActionText}>{scheduleLabel}</Text>
              </Pressable>

              <Pressable
                style={styles.featuredActionButtonGold}
                onPress={(event: any) => {
                  event.stopPropagation?.();
                  onViewDetails();
                }}
              >
                <Text style={styles.featuredActionTextDark}>{buttonText}</Text>
                <ChevronRight color="#111111" size={13} />
              </Pressable>
            </View>
          </View>

          <FeaturedEngagementMetrics property={property} />
        </View>
      </View>
    </Pressable>
  );
}

function FeaturedMeta({ icon, value }: { icon: ReactNode; value: string | number }) {
  return (
    <View style={styles.featuredMetaItem}>
      {icon}
      <Text style={styles.featuredMetaText}>{value}</Text>
    </View>
  );
}

function RealMetric({
  icon,
  value,
  wide = false,
}: {
  icon: ReactNode;
  value: string;
  wide?: boolean;
}) {
  return (
    <View style={[styles.realMetricPill, wide && styles.realMetricPillWide]}>
      {icon}
      <Text style={styles.realMetricText} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

function ProjectCard({
  project,
  language,
  formatPrice,
  fromText,
  onPress,
}: {
  project: {
    id: string;
    titleEn: string;
    titleId: string;
    location: string;
    image: string;
    priceIdr: number;
  };
  language: Language;
  formatPrice: (priceIdr: number, rentalType?: string | null) => string;
  fromText: string;
  onPress: () => void;
}) {
  const title = language === "en" ? project.titleEn : project.titleId;

  return (
    <Pressable style={styles.projectCard} onPress={onPress}>
      <ImageBackground
        source={{ uri: project.image }}
        resizeMode="cover"
        style={styles.projectImage}
        imageStyle={styles.projectImageRadius}
      >
        <View style={styles.projectShade} />
      </ImageBackground>

      <View style={styles.projectBody}>
        <Text style={styles.projectTitle} numberOfLines={1}>
          {title}
        </Text>

        <View style={styles.inlineLocation}>
          <MapPin color="#ffffff" size={11} />
          <Text style={styles.projectLocation} numberOfLines={1}>
            {project.location}
          </Text>
        </View>

        <Text style={styles.projectPrice} numberOfLines={1}>
          {fromText} {formatPrice(project.priceIdr)}
        </Text>
      </View>
    </Pressable>
  );
}

function AgentCard({
  agent,
  verifiedText,
}: {
  agent: TetamoAgent;
  verifiedText: string;
}) {
  const [imageFailed, setImageFailed] = useState(false);
  const socialItems = getAgentSocialItems(agent);

  return (
    <Pressable style={styles.agentCard}>
      {agent.photoUrl && !imageFailed ? (
        <Image
          source={{ uri: agent.photoUrl }}
          style={styles.agentAvatar}
          onError={() => setImageFailed(true)}
        />
      ) : (
        <View style={styles.agentInitialsAvatar}>
          <Text style={styles.agentInitialsText}>{agent.initials}</Text>
        </View>
      )}

      <View style={styles.agentTextBox}>
        <Text style={styles.agentName} numberOfLines={1}>
          {agent.name}
        </Text>

        <View style={styles.agentRoleRow}>
          <ShieldCheck color={SCORPIO_GOLD} size={11} />
          <Text style={styles.agentRole} numberOfLines={1}>
            {agent.agency || verifiedText}
          </Text>
        </View>

        {socialItems.length > 0 ? (
          <View style={styles.agentSocialRow}>
            {socialItems.map((item) => (
              <Pressable
                key={`${agent.id}-${item.key}`}
                style={styles.agentSocialPill}
                onPress={() => void safeOpenUrl(item.url)}
              >
                <FontAwesome5
                  name={item.iconName as any}
                  size={13}
                  color="#ffffff"
                />
              </Pressable>
            ))}
          </View>
        ) : (
          <View style={styles.agentSocialRow}>
            <View style={styles.agentSocialPill}>
              <ShieldCheck color={SCORPIO_GOLD} size={13} />
            </View>
            <Text style={styles.agentSocialFallback}>{verifiedText}</Text>
          </View>
        )}
      </View>
    </Pressable>
  );
}

function MiniChip({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <View style={styles.miniChip}>
      {icon}
      <Text style={styles.miniChipText}>{label}</Text>
    </View>
  );
}

function StatusBadge({
  label,
  bg,
  color,
}: {
  label: string;
  bg: string;
  color: string;
}) {
  return (
    <View style={[styles.statusBadge, { backgroundColor: bg }]}>
      <Text style={[styles.statusBadgeText, { color }]}>{label}</Text>
    </View>
  );
}

function getBadgesForProperty(property: TetamoProperty) {
  const badges: { key: string; label: string; bg: string; color: string }[] = [];
  const rentalType = normalizeValue(property.rentalType);

  if (isSaleProperty(property)) {
    badges.push({
      key: "sale",
      label: "Dijual",
      bg: "#2f7d32",
      color: "#ffffff",
    });
  }

  if (isRentProperty(property)) {
    badges.push({
      key: "rent",
      label: "Disewa",
      bg: "#7c3aed",
      color: "#ffffff",
    });
  }

  if (rentalType.includes("monthly") || rentalType.includes("bulanan")) {
    badges.push({
      key: "monthly",
      label: "Bulanan",
      bg: SCORPIO_GOLD,
      color: "#111111",
    });
  }

  if (rentalType.includes("yearly") || rentalType.includes("tahunan")) {
    badges.push({
      key: "yearly",
      label: "Tahunan",
      bg: SCORPIO_GOLD,
      color: "#111111",
    });
  }

  if (rentalType.includes("daily") || rentalType.includes("harian")) {
    badges.push({
      key: "daily",
      label: "Harian",
      bg: SCORPIO_GOLD,
      color: "#111111",
    });
  }

  if (property.badge && property.badge !== "Verified" && badges.length < 2) {
    badges.push({
      key: property.badge,
      label: property.badge,
      bg: "#2563eb",
      color: "#ffffff",
    });
  }

  if (badges.length === 0) {
    badges.push({
      key: "verified",
      label: "Verified",
      bg: "#111111",
      color: "#ffffff",
    });
  }

  return badges.slice(0, 3);
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
    paddingTop: 14,
    paddingBottom: 34,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 16,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  brandTextWrap: {
    minWidth: 0,
  },
  logoImage: {
    width: 38,
    height: 38,
  },
  brandText: {
    color: "#ffffff",
    fontSize: 20,
    letterSpacing: 4,
    fontWeight: "800",
  },
  brandSub: {
    color: "#b9b9b9",
    fontSize: 10.5,
    marginTop: 1,
  },
  headerControls: {
    alignItems: "flex-end",
    gap: 7,
  },
  locationBellRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  locationPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderWidth: 1,
    borderColor: "#5f4b17",
    backgroundColor: "#101010",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  pillText: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "800",
  },
  notificationBellButton: {
    width: 38,
    height: 38,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: SCORPIO_GOLD,
    backgroundColor: "#101010",
    alignItems: "center",
    justifyContent: "center",
  },
  notificationBadge: {
    position: "absolute",
    top: -6,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#050505",
    backgroundColor: SCORPIO_GOLD,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  notificationBadgeText: {
    color: "#111111",
    fontSize: 9,
    fontWeight: "900",
  },
  toggleLine: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  toggleGroup: {
    flexDirection: "row",
    borderWidth: 1,
    borderColor: "#343434",
    borderRadius: 999,
    overflow: "hidden",
    backgroundColor: "#090909",
  },
  toggleItem: {
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  currencyItem: {
    paddingHorizontal: 6,
    paddingVertical: 5,
  },
  toggleItemActive: {
    backgroundColor: SCORPIO_GOLD,
  },
  toggleText: {
    color: "#9c9c9c",
    fontSize: 10,
    fontWeight: "900",
  },
  currencyText: {
    color: "#9c9c9c",
    fontSize: 9,
    fontWeight: "900",
  },
  toggleTextActive: {
    color: "#111111",
  },
  searchGlowWrap: {
    borderRadius: 23,
    marginBottom: 18,
    shadowColor: SCORPIO_GOLD,
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.24,
    shadowRadius: 22,
    elevation: 12,
  },
  searchBar: {
    height: 56,
    borderRadius: 23,
    borderWidth: 1,
    borderColor: SCORPIO_GOLD,
    backgroundColor: "#0c0c0c",
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 16,
    paddingRight: 7,
    gap: 11,
  },
  searchInput: {
    flex: 1,
    color: "#ffffff",
    fontSize: 13,
    paddingVertical: 0,
  },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: 18,
    backgroundColor: SCORPIO_GOLD,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
    marginBottom: 12,
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sectionTitle: {
    color: "#ffffff",
    fontSize: 17,
    fontWeight: "900",
    letterSpacing: -0.3,
  },
  seeAllButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  seeAllText: {
    color: SCORPIO_GOLD,
    fontSize: 11.5,
    fontWeight: "900",
  },
  cardCarousel: {
    gap: 12,
    paddingBottom: 16,
  },
  marketCard: {
    width: 178,
    borderRadius: 17,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#303030",
    backgroundColor: "#101010",
  },
  marketImageWrap: {
    height: 118,
    position: "relative",
    backgroundColor: "#111111",
  },
  marketImage: {
    width: "100%",
    height: "100%",
  },
  marketBadgeRow: {
    position: "absolute",
    top: 8,
    left: 8,
    right: 40,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
  },
  marketHeartButton: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 30,
    height: 30,
    borderRadius: 999,
    backgroundColor: "rgba(0,0,0,0.62)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  marketBody: {
    padding: 9,
  },
  statusBadge: {
    alignSelf: "flex-start",
    borderRadius: 999,
    paddingHorizontal: 7,
    paddingVertical: 4,
  },
  statusBadgeText: {
    fontSize: 8.4,
    fontWeight: "900",
  },
  marketPrice: {
    color: SCORPIO_GOLD,
    fontSize: 12.8,
    fontWeight: "900",
  },
  marketUsd: {
    color: "#d0d0d0",
    fontSize: 8.5,
    fontWeight: "700",
    marginTop: 1,
  },
  marketTitle: {
    color: "#ffffff",
    fontSize: 10.2,
    fontWeight: "900",
    marginTop: 4,
  },
  inlineLocation: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  inlineLocationText: {
    color: "#ffffff",
    fontSize: 8.8,
    flex: 1,
    fontWeight: "700",
  },
  marketMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 6,
  },
  marketMetaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  marketMetaText: {
    color: "#ffffff",
    fontSize: 8.4,
    fontWeight: "900",
  },
  engagementRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    marginTop: 7,
  },
  realMetricPill: {
    minWidth: 24,
    height: 22,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(230,193,92,0.24)",
    backgroundColor: "rgba(255,255,255,0.08)",
    paddingHorizontal: 4,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  realMetricPillWide: {
    minWidth: 36,
  },
  realMetricText: {
    color: "#ffffff",
    fontSize: 6.8,
    fontWeight: "900",
  },
  marketActionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 7,
  },
  marketActionPill: {
    flex: 1,
    minHeight: 25,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(230,193,92,0.24)",
    backgroundColor: "rgba(255,255,255,0.08)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
    paddingHorizontal: 5,
  },
  marketActionText: {
    color: "#ffffff",
    fontSize: 7.8,
    fontWeight: "800",
  },
  featuredShowcase: {
    borderRadius: 24,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#705d2c",
    backgroundColor: "#0b0b0b",
    marginBottom: 24,
    shadowColor: SCORPIO_GOLD,
    shadowOffset: {
      width: 0,
      height: 14,
    },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 12,
  },
  featuredImageWrap: {
    height: 250,
    backgroundColor: "#111111",
  },
  featuredImage: {
    flex: 1,
    padding: 13,
  },
  featuredImageRadius: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  featuredImageShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.08)",
  },
  featuredTopBadge: {
    alignSelf: "flex-start",
    backgroundColor: SCORPIO_GOLD,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  featuredTopBadgeText: {
    color: "#111111",
    fontSize: 9,
    fontWeight: "900",
  },
  featuredInfoPanel: {
    backgroundColor: "#0b0b0b",
    borderTopWidth: 1,
    borderTopColor: "rgba(230,193,92,0.36)",
    padding: 12,
  },
  featuredMainContent: {
    flexDirection: "row",
    alignItems: "stretch",
    gap: 10,
  },
  featuredLeftContent: {
    flex: 1,
    minWidth: 0,
  },
  featuredHeaderRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  featuredHeaderLeft: {
    flex: 1,
    minWidth: 0,
  },
  featuredSectionLabel: {
    color: SCORPIO_GOLD,
    fontSize: 8.8,
    textTransform: "uppercase",
    letterSpacing: 0.9,
    fontWeight: "900",
    marginBottom: 3,
  },
  featuredPrice: {
    color: SCORPIO_GOLD,
    fontSize: 15.2,
    fontWeight: "900",
  },
  featuredUsd: {
    color: "#cfcfcf",
    fontSize: 8.5,
    fontWeight: "800",
    marginTop: 1,
  },
  featuredLocationBox: {
    width: 104,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: "rgba(230,193,92,0.24)",
    backgroundColor: "rgba(255,255,255,0.05)",
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 6,
  },
  featuredLocationText: {
    color: "#ffffff",
    fontSize: 9,
    lineHeight: 12,
    fontWeight: "800",
    flex: 1,
  },
  featuredTitle: {
    color: "#ffffff",
    fontSize: 12.8,
    lineHeight: 16,
    fontWeight: "900",
    marginTop: 7,
  },
  featuredMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 7,
  },
  featuredMetaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  featuredMetaText: {
    color: "#ffffff",
    fontSize: 9,
    fontWeight: "900",
  },
  featuredMetricColumn: {
    width: 52,
    minHeight: 142,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(230,193,92,0.32)",
    backgroundColor: "rgba(255,255,255,0.045)",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 6,
    paddingHorizontal: 5,
  },
  featuredMetricPill: {
    width: 40,
    minHeight: 22,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(230,193,92,0.28)",
    backgroundColor: "#101010",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
    paddingHorizontal: 3,
  },
  featuredMetricPillWide: {
    width: 46,
  },
  featuredMetricText: {
    color: "#ffffff",
    fontSize: 6.8,
    fontWeight: "900",
  },
  featuredActionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 10,
    flexWrap: "wrap",
  },
  featuredActionButton: {
    minHeight: 28,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(230,193,92,0.24)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingHorizontal: 8,
  },
  featuredActionButtonGold: {
    minHeight: 28,
    borderRadius: 999,
    backgroundColor: SCORPIO_GOLD,
    borderWidth: 1,
    borderColor: "rgba(230,193,92,0.55)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
    paddingHorizontal: 9,
  },
  featuredActionText: {
    color: "#ffffff",
    fontSize: 8.2,
    fontWeight: "900",
  },
  featuredActionTextDark: {
    color: "#111111",
    fontSize: 8.2,
    fontWeight: "900",
  },
  ctaBanner: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: SCORPIO_GOLD,
    backgroundColor: "#12100a",
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 18,
  },
  ctaIconCircle: {
    width: 46,
    height: 46,
    borderRadius: 18,
    backgroundColor: SCORPIO_GOLD,
    alignItems: "center",
    justifyContent: "center",
  },
  ctaContent: {
    flex: 1,
    minWidth: 0,
  },
  ctaTitle: {
    color: SCORPIO_GOLD,
    fontSize: 14.1,
    fontWeight: "900",
  },
  ctaSub: {
    color: "#d8d8d8",
    fontSize: 10.2,
    marginTop: 4,
  },
  ctaChips: {
    flexDirection: "row",
    flexWrap: "nowrap",
    gap: 4,
    marginTop: 9,
  },
  miniChip: {
    borderWidth: 1,
    borderColor: "#705d2c",
    borderRadius: 999,
    paddingHorizontal: 5,
    paddingVertical: 4,
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  miniChipText: {
    color: "#ffffff",
    fontSize: 7.8,
    fontWeight: "800",
  },
  ctaButton: {
    backgroundColor: SCORPIO_GOLD,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  ctaButtonText: {
    color: "#111111",
    fontSize: 10,
    fontWeight: "900",
  },
  popularPanel: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#303030",
    backgroundColor: "#0f0f0f",
    padding: 11,
    marginBottom: 18,
  },
  areaCarousel: {
    gap: 10,
    paddingBottom: 4,
  },
  areaCard: {
    minWidth: 132,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: "#705d2c",
    backgroundColor: "#171200",
    padding: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  areaImage: {
    width: 38,
    height: 38,
    borderRadius: 999,
  },
  areaTextBox: {
    flex: 1,
  },
  areaName: {
    color: "#ffffff",
    fontSize: 11.5,
    fontWeight: "900",
  },
  areaListings: {
    color: "#cfcfcf",
    fontSize: 9,
    marginTop: 2,
    fontWeight: "700",
  },
  agentCarousel: {
    gap: 10,
    paddingBottom: 18,
  },
  agentCard: {
    width: 230,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: "#705d2c",
    backgroundColor: "#101010",
    padding: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },
  agentAvatar: {
    width: 54,
    height: 54,
    borderRadius: 999,
    backgroundColor: "#211a0b",
  },
  agentInitialsAvatar: {
    width: 54,
    height: 54,
    borderRadius: 999,
    backgroundColor: "#211a0b",
    borderWidth: 1,
    borderColor: "#705d2c",
    alignItems: "center",
    justifyContent: "center",
  },
  agentInitialsText: {
    color: SCORPIO_GOLD,
    fontSize: 15,
    fontWeight: "900",
  },
  agentTextBox: {
    flex: 1,
  },
  agentName: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "900",
  },
  agentRoleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    marginTop: 3,
  },
  agentRole: {
    color: "#bfbfbf",
    fontSize: 9.5,
    fontWeight: "700",
    flex: 1,
  },
  agentSocialRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 7,
  },
  agentSocialPill: {
    width: 26,
    height: 26,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#3a3a3a",
    backgroundColor: "#161616",
    alignItems: "center",
    justifyContent: "center",
  },
  agentSocialFallback: {
    color: "#bfbfbf",
    fontSize: 9,
    fontWeight: "800",
  },
  projectCarousel: {
    gap: 12,
    paddingBottom: 18,
  },
  projectCard: {
    width: 188,
    borderRadius: 17,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#705d2c",
    backgroundColor: "#101010",
  },
  projectImage: {
    height: 104,
  },
  projectImageRadius: {
    borderTopLeftRadius: 17,
    borderTopRightRadius: 17,
  },
  projectShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.12)",
  },
  projectBody: {
    padding: 11,
  },
  projectTitle: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "900",
  },
  projectLocation: {
    color: "#d8d8d8",
    fontSize: 10,
    flex: 1,
  },
  projectPrice: {
    color: SCORPIO_GOLD,
    fontSize: 10.5,
    fontWeight: "900",
    marginTop: 7,
  },
});