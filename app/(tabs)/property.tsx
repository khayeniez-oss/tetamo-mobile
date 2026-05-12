import { FontAwesome5 } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
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

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?q=80&w=1400&auto=format&fit=crop";

const TETAMO_FALLBACK_WHATSAPP = "628133947717";

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

    void safeOpenUrl(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`);
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
            <Pressable
              style={styles.locationPill}
              onPress={() => goSearch({ query: "Indonesia" })}
            >
              <MapPin color="#e6c15c" size={12} />
              <Text style={styles.pillText}>Indonesia</Text>
              <ChevronDown color="#e6c15c" size={12} />
            </Pressable>

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

        <View style={styles.searchBar}>
          <Search color="#ffffff" size={22} />

          <TextInput
            value={searchInput}
            onChangeText={setSearchInput}
            placeholder={t.search}
            placeholderTextColor="#9b9b9b"
            style={styles.searchInput}
            returnKeyType="search"
            onSubmitEditing={submitSearch}
          />

          <Pressable onPress={() => goSearch()}>
            <SlidersHorizontal color="#ffffff" size={21} />
          </Pressable>
        </View>

        {(viewMode === "all" || viewMode === "sale") && (
          <>
            <SectionTitle
              icon={<Tag color="#e6c15c" size={20} />}
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

            <FeaturedBanner
              property={featuredSale}
              label={t.featuredProperty}
              buttonText={t.viewDetails}
              whatsappLabel={t.whatsapp}
              scheduleLabel={t.schedule}
              language={language}
              formatPrice={formatPrice}
              approxUsd={approxUsd}
              accent="#e6c15c"
              onWhatsapp={() => openWhatsapp(featuredSale)}
              onSchedule={() => goDetails(featuredSale, true)}
              onViewDetails={() => goDetails(featuredSale)}
            />
          </>
        )}

        {(viewMode === "all" || viewMode === "rent") && (
          <>
            <SectionTitle
              icon={<Home color="#e6c15c" size={20} />}
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

            <FeaturedBanner
              property={featuredRent}
              label={t.featuredRental}
              buttonText={t.viewDetails}
              whatsappLabel={t.whatsapp}
              scheduleLabel={t.schedule}
              language={language}
              formatPrice={formatPrice}
              approxUsd={approxUsd}
              accent="#7c3aed"
              onWhatsapp={() => openWhatsapp(featuredRent)}
              onSchedule={() => goDetails(featuredRent, true)}
              onViewDetails={() => goDetails(featuredRent)}
            />
          </>
        )}

        <SectionTitle
          icon={<MapPin color="#ffffff" size={20} />}
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
              <View>
                <Text style={styles.areaName}>{area.name}</Text>
                <Text style={styles.areaListings}>{area.listings}</Text>
              </View>
            </Pressable>
          ))}
        </ScrollView>

        <SectionTitle
          icon={<Building2 color="#ffffff" size={20} />}
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

        <SectionTitle
          icon={<UserRound color="#ffffff" size={20} />}
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

        <View style={styles.ctaBanner}>
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
      </ScrollView>
    </SafeAreaView>
  );
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
          <ChevronRight color="#e6c15c" size={15} />
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
        icon={<Star color="#e6c15c" size={9} />}
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
      <ImageBackground
        source={{ uri: property.image || FALLBACK_IMAGE }}
        resizeMode="cover"
        style={styles.marketImage}
        imageStyle={styles.marketImageRadius}
      >
        <View style={styles.marketImageShade} />

        <View style={styles.marketTopRow}>
          <View style={styles.badgeRow}>
            {getBadgesForProperty(property).map((badge) => (
              <StatusBadge
                key={badge.key}
                label={badge.label}
                bg={badge.bg}
                color={badge.color}
              />
            ))}
          </View>
        </View>

        <View style={styles.marketOverlay}>
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
            <MapPin color="#ffffff" size={10} />
            <Text style={styles.inlineLocationText} numberOfLines={1}>
              {property.location}
            </Text>
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
              <CalendarDays color="#e6c15c" size={12} />
              <Text style={styles.marketActionText}>{scheduleLabel}</Text>
            </Pressable>
          </View>
        </View>
      </ImageBackground>
    </Pressable>
  );
}

function FeaturedBanner({
  property,
  label,
  buttonText,
  whatsappLabel,
  scheduleLabel,
  language,
  formatPrice,
  approxUsd,
  accent,
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
  accent: string;
  onWhatsapp: () => void;
  onSchedule: () => void;
  onViewDetails: () => void;
}) {
  const title = language === "en" ? property.titleEn : property.titleId;
  const usdText = approxUsd(property.priceIdr);

  return (
    <View style={styles.featuredBanner}>
      <Pressable style={styles.featuredImageWrap} onPress={onViewDetails}>
        <ImageBackground
          source={{ uri: property.image || FALLBACK_IMAGE }}
          resizeMode="cover"
          style={styles.featuredImage}
          imageStyle={styles.featuredImageRadius}
        >
          <View style={styles.featuredShade} />

          <View style={[styles.featuredRibbon, { backgroundColor: accent }]}>
            <Star color={accent === "#e6c15c" ? "#111111" : "#ffffff"} size={11} />
            <Text
              style={[
                styles.featuredRibbonText,
                { color: accent === "#e6c15c" ? "#111111" : "#ffffff" },
              ]}
            >
              Featured
            </Text>
          </View>
        </ImageBackground>
      </Pressable>

      <View style={styles.featuredTextBox}>
        <Text style={[styles.featuredLabel, { color: accent }]} numberOfLines={1}>
          {label}
        </Text>

        <Text style={styles.featuredTitle} numberOfLines={2}>
          {title}
        </Text>

        <Text style={styles.featuredPrice} numberOfLines={1}>
          {formatPrice(property.priceIdr, property.rentalType)}
        </Text>

        {!!usdText && (
          <Text style={styles.featuredUsd} numberOfLines={1}>
            {usdText}
          </Text>
        )}

        <View style={styles.inlineLocation}>
          <MapPin color="#ffffff" size={10} />
          <Text style={styles.inlineLocationText} numberOfLines={1}>
            {property.location}
          </Text>
        </View>

        <EngagementMetrics property={property} />

        <View style={styles.featuredButtonRow}>
          <Pressable style={styles.featuredGhostButton} onPress={onWhatsapp}>
            <MessageCircle color="#25D366" size={11} />
            <Text style={styles.featuredGhostButtonText}>{whatsappLabel}</Text>
          </Pressable>

          <Pressable style={styles.featuredGhostButton} onPress={onSchedule}>
            <CalendarDays color="#e6c15c" size={11} />
            <Text style={styles.featuredGhostButtonText}>{scheduleLabel}</Text>
          </Pressable>
        </View>

        <Pressable
          style={[styles.viewButton, { backgroundColor: accent }]}
          onPress={onViewDetails}
        >
          <Text
            style={[
              styles.viewButtonText,
              { color: accent === "#e6c15c" ? "#111111" : "#ffffff" },
            ]}
          >
            {buttonText}
          </Text>
          <ChevronRight
            color={accent === "#e6c15c" ? "#111111" : "#ffffff"}
            size={14}
          />
        </Pressable>
      </View>
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
          <ShieldCheck color="#e6c15c" size={11} />
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
              <ShieldCheck color="#e6c15c" size={13} />
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
    badges.push({ key: "sale", label: "Dijual", bg: "#2f7d32", color: "#ffffff" });
  }

  if (isRentProperty(property)) {
    badges.push({ key: "rent", label: "Disewa", bg: "#7c3aed", color: "#ffffff" });
  }

  if (rentalType.includes("monthly") || rentalType.includes("bulanan")) {
    badges.push({ key: "monthly", label: "Bulanan", bg: "#e6c15c", color: "#111111" });
  }

  if (rentalType.includes("yearly") || rentalType.includes("tahunan")) {
    badges.push({ key: "yearly", label: "Tahunan", bg: "#e6c15c", color: "#111111" });
  }

  if (rentalType.includes("daily") || rentalType.includes("harian")) {
    badges.push({ key: "daily", label: "Harian", bg: "#e6c15c", color: "#111111" });
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
    badges.push({ key: "verified", label: "Verified", bg: "#111111", color: "#ffffff" });
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
    width: 42,
    height: 42,
  },
  brandText: {
    color: "#ffffff",
    fontSize: 22,
    letterSpacing: 4,
    fontWeight: "800",
  },
  brandSub: {
    color: "#b9b9b9",
    fontSize: 11,
    marginTop: 1,
  },
  headerControls: {
    alignItems: "flex-end",
    gap: 7,
  },
  locationPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderWidth: 1,
    borderColor: "#5b4a24",
    borderRadius: 999,
    paddingHorizontal: 11,
    paddingVertical: 7,
  },
  pillText: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "800",
  },
  toggleLine: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  toggleGroup: {
    flexDirection: "row",
    borderWidth: 1,
    borderColor: "#5b4a24",
    borderRadius: 999,
    overflow: "hidden",
  },
  toggleItem: {
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  currencyItem: {
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  toggleItemActive: {
    backgroundColor: "#e6c15c",
  },
  toggleText: {
    color: "#e6c15c",
    fontSize: 10,
    fontWeight: "900",
  },
  currencyText: {
    color: "#e6c15c",
    fontSize: 9.5,
    fontWeight: "900",
  },
  toggleTextActive: {
    color: "#111111",
  },
  searchBar: {
    height: 56,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: "#2c2c2c",
    backgroundColor: "#111111",
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    paddingHorizontal: 15,
    marginBottom: 18,
  },
  searchInput: {
    flex: 1,
    color: "#ffffff",
    fontSize: 13,
    paddingVertical: 0,
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
    fontSize: 21,
    fontWeight: "900",
    letterSpacing: -0.3,
  },
  seeAllButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  seeAllText: {
    color: "#e6c15c",
    fontSize: 11.5,
    fontWeight: "900",
  },
  cardCarousel: {
    gap: 12,
    paddingBottom: 16,
  },
  marketCard: {
    width: 270,
    height: 285,
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#303030",
    backgroundColor: "#101010",
  },
  marketImage: {
    flex: 1,
    padding: 10,
    justifyContent: "space-between",
  },
  marketImageRadius: {
    borderRadius: 18,
  },
  marketImageShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.02)",
  },
  marketTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 5,
    flex: 1,
    paddingRight: 6,
  },
  statusBadge: {
    alignSelf: "flex-start",
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  statusBadgeText: {
    fontSize: 9.3,
    fontWeight: "900",
  },
  marketOverlay: {
    borderRadius: 14,
    backgroundColor: "rgba(0,0,0,0.66)",
    paddingHorizontal: 9,
    paddingVertical: 8,
  },
  marketPrice: {
    color: "#ffffff",
    fontSize: 12.8,
    fontWeight: "900",
  },
  marketUsd: {
    color: "#d0d0d0",
    fontSize: 8.8,
    fontWeight: "700",
    marginTop: 1,
  },
  marketTitle: {
    color: "#ffffff",
    fontSize: 10.7,
    fontWeight: "800",
    marginTop: 3,
  },
  inlineLocation: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 3,
  },
  inlineLocationText: {
    color: "#ffffff",
    fontSize: 9.2,
    flex: 1,
    fontWeight: "700",
  },
  engagementRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 6,
  },
  realMetricPill: {
    minWidth: 31,
    height: 23,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    backgroundColor: "rgba(255,255,255,0.08)",
    paddingHorizontal: 5,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
  },
  realMetricPillWide: {
    minWidth: 46,
  },
  realMetricText: {
    color: "#ffffff",
    fontSize: 7.4,
    fontWeight: "900",
  },
  marketActionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 6,
  },
  marketActionPill: {
    flex: 1,
    minHeight: 26,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(255,255,255,0.08)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingHorizontal: 5,
  },
  marketActionText: {
    color: "#ffffff",
    fontSize: 8.8,
    fontWeight: "800",
  },
  featuredBanner: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#3a3a3a",
    backgroundColor: "#101010",
    overflow: "hidden",
    flexDirection: "row",
    height: 215,
    marginBottom: 24,
  },
  featuredImageWrap: {
    width: "70%",
  },
  featuredImage: {
    flex: 1,
    padding: 9,
  },
  featuredImageRadius: {
    borderTopLeftRadius: 18,
    borderBottomLeftRadius: 18,
  },
  featuredShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.03)",
  },
  featuredRibbon: {
    alignSelf: "flex-start",
    borderRadius: 999,
    paddingHorizontal: 7,
    paddingVertical: 4,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  featuredRibbonText: {
    fontSize: 8.4,
    fontWeight: "900",
  },
  featuredTextBox: {
    flex: 1,
    paddingHorizontal: 8,
    paddingVertical: 9,
  },
  featuredLabel: {
    textTransform: "uppercase",
    fontSize: 7.2,
    letterSpacing: 0.8,
    fontWeight: "900",
  },
  featuredTitle: {
    color: "#ffffff",
    fontSize: 11,
    lineHeight: 14,
    fontWeight: "900",
    marginTop: 4,
  },
  featuredPrice: {
    color: "#ffffff",
    fontSize: 9.5,
    fontWeight: "900",
    marginTop: 4,
  },
  featuredUsd: {
    color: "#bdbdbd",
    fontSize: 7.3,
    fontWeight: "700",
    marginTop: 1,
  },
  featuredButtonRow: {
    flexDirection: "row",
    gap: 4,
    marginTop: 7,
  },
  featuredGhostButton: {
    flex: 1,
    minHeight: 24,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#2b2b2b",
    backgroundColor: "#151515",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  featuredGhostButtonText: {
    color: "#ffffff",
    fontSize: 7,
    fontWeight: "800",
  },
  viewButton: {
    alignSelf: "flex-start",
    borderRadius: 9,
    paddingHorizontal: 8,
    paddingVertical: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    marginTop: 7,
  },
  viewButtonText: {
    fontSize: 7.8,
    fontWeight: "900",
  },
  areaCarousel: {
    gap: 10,
    paddingBottom: 18,
  },
  areaCard: {
    minWidth: 132,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: "#333333",
    backgroundColor: "#101010",
    padding: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  areaImage: {
    width: 42,
    height: 42,
    borderRadius: 999,
  },
  areaName: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "900",
  },
  areaListings: {
    color: "#a9a9a9",
    fontSize: 9.5,
    marginTop: 2,
    fontWeight: "700",
  },
  projectCarousel: {
    gap: 12,
    paddingBottom: 18,
  },
  projectCard: {
    width: 188,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#333333",
    backgroundColor: "#101010",
  },
  projectImage: {
    height: 104,
  },
  projectImageRadius: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
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
    color: "#ffffff",
    fontSize: 10.5,
    fontWeight: "900",
    marginTop: 7,
  },
  agentCarousel: {
    gap: 10,
    paddingBottom: 18,
  },
  agentCard: {
    width: 230,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#333333",
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
    color: "#e6c15c",
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
  ctaBanner: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#705d2c",
    backgroundColor: "#211a0b",
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    marginBottom: 6,
  },
  ctaContent: {
    flex: 1,
    minWidth: 0,
  },
  ctaTitle: {
    color: "#ffffff",
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
    backgroundColor: "#e6c15c",
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
});