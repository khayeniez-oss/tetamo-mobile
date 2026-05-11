import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
  BadgeCheck,
  Bath,
  BedDouble,
  Bookmark,
  BrainCircuit,
  BriefcaseBusiness,
  Building2,
  Calculator,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  Eye,
  Heart,
  Hotel,
  House,
  Languages,
  MapPin,
  MessageCircle,
  Palmtree,
  Ruler,
  Search,
  Share2,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Star,
  Store,
  Trees,
  UserRound,
} from "lucide-react-native";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import type { ImageStyle, StyleProp, ViewStyle } from "react-native";
import {
  Image,
  ImageBackground,
  Linking,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  fetchHomepageProperties,
  type TetamoProperty,
} from "../../services/properties";

type Language = "en" | "id";
type Currency = "IDR" | "USD" | "AUD";
type Listing = TetamoProperty;

const tetamoLogo = require("../../assets/images/tetamo-logo.png");

const HERO_FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?q=80&w=1400&auto=format&fit=crop";

const PROJECT_FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1600607687644-c7171b42498b?q=80&w=1000&auto=format&fit=crop";

const ARTICLE_IMAGE_ONE =
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1000&auto=format&fit=crop";

const ARTICLE_IMAGE_TWO =
  "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?q=80&w=1000&auto=format&fit=crop";

const currencyRates: Record<Currency, number> = {
  IDR: 1,
  USD: 0.000061,
  AUD: 0.000094,
};

const fallbackListings: Listing[] = [
  {
    id: "fallback-1",
    titleEn: "Luxury 4BR Villa in Canggu",
    titleId: "Villa Mewah 4KT di Canggu",
    descriptionEn:
      "Modern tropical villa with private pool, open living area, and premium lifestyle access near cafes and beaches.",
    descriptionId:
      "Villa tropis modern dengan kolam pribadi, ruang terbuka, dan akses premium dekat kafe serta pantai.",
    location: "Canggu, Badung, Bali",
    area: "Canggu",
    image: HERO_FALLBACK_IMAGE,
    priceIdr: 18500000000,
    beds: 4,
    baths: 4,
    size: 450,
    badge: "Featured",
    viewCount: 2100,
  },
  {
    id: "fallback-2",
    titleEn: "3BR Villa in Uluwatu",
    titleId: "Villa 3KT di Uluwatu",
    descriptionEn: "Verified villa listing with direct inquiry.",
    descriptionId: "Listing villa terverifikasi dengan inquiry langsung.",
    location: "Uluwatu, Bali",
    area: "Uluwatu",
    image:
      "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?q=80&w=900&auto=format&fit=crop",
    priceIdr: 7950000000,
    beds: 3,
    baths: 3,
    size: 250,
    badge: "Featured",
    viewCount: 845,
  },
  {
    id: "fallback-3",
    titleEn: "2BR Apartment in SCBD",
    titleId: "Apartemen 2KT di SCBD",
    descriptionEn: "Modern apartment listing in Jakarta.",
    descriptionId: "Listing apartemen modern di Jakarta.",
    location: "Jakarta Selatan",
    area: "Jakarta",
    image:
      "https://images.unsplash.com/photo-1600607688969-a5bfcd646154?q=80&w=900&auto=format&fit=crop",
    priceIdr: 3200000000,
    beds: 2,
    baths: 2,
    size: 128,
    badge: "Boosted",
    viewCount: 640,
  },
  {
    id: "fallback-4",
    titleEn: "Modern Townhouse",
    titleId: "Townhouse Modern",
    descriptionEn: "Modern townhouse with clean design.",
    descriptionId: "Townhouse modern dengan desain bersih.",
    location: "Surabaya, Jawa Timur",
    area: "Surabaya",
    image:
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=900&auto=format&fit=crop",
    priceIdr: 2750000000,
    beds: 3,
    baths: 3,
    size: 160,
    badge: "Spotlight",
    viewCount: 520,
  },
];

const fallbackProjects: Listing[] = [
  {
    id: "project-1",
    titleEn: "The Banyan Residences",
    titleId: "The Banyan Residences",
    descriptionEn: "New project in Berawa, Canggu.",
    descriptionId: "Proyek baru di Berawa, Canggu.",
    location: "Berawa, Canggu",
    area: "Canggu",
    priceIdr: 2900000000,
    image: PROJECT_FALLBACK_IMAGE,
    badge: "New Project",
  },
  {
    id: "project-2",
    titleEn: "Luma Ubud",
    titleId: "Luma Ubud",
    descriptionEn: "New project in Ubud, Bali.",
    descriptionId: "Proyek baru di Ubud, Bali.",
    location: "Ubud, Bali",
    area: "Ubud",
    priceIdr: 1750000000,
    image:
      "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?q=80&w=1000&auto=format&fit=crop",
    badge: "New Project",
  },
];

const copy = {
  en: {
    subtitle: "Properti Marketplace",
    search: "Search by city, area, or property",
    sale: "For Sale",
    rent: "For Rent",
    monthly: "Monthly",
    yearly: "Yearly",
    find: "Find your property with TETAMO",
    why: "Why Choose TETAMO",
    verifiedListings: "Verified Listings",
    verifiedListingsSub: "Trusted & screened",
    verifiedAgents: "Verified Agents",
    verifiedAgentsSub: "Professional & reliable",
    verifiedOwners: "Verified Owners",
    verifiedOwnersSub: "Real & verified owners",
    trustedPlatform: "Trusted Platform",
    trustedPlatformSub: "Secure & transparent",
    smart: "Smart System for\nSmarter Buyers & Renters",
    learnMore: "Learn More",
    featured: "Featured Listings",
    popular: "Popular Areas",
    newProjects: "New Projects",
    whyList: "Why list with Tetamo?",
    directWhatsApp: "Direct WhatsApp",
    directWhatsAppSub: "Chat instantly",
    scheduling: "Scheduling",
    schedulingSub: "Book viewing easily",
    aiTitle: "AI Title & Description",
    aiTitleSub: "Better visibility",
    aiCaption: "AI Auto Caption",
    aiCaptionSub: "Social Media",
    calculator: "Commission Calculator",
    calculatorSub: "Calculate earnings",
    owner: "Owner",
    ownerSub: "Manage your property",
    agent: "Agent",
    agentSub: "Grow your business",
    developer: "Developer",
    developerSub: "Showcase projects",
    buyRent: "Buy / Rent",
    buyRentSub: "Find your place",
    learn: "Learn with TETAMO",
    articleOne: "How to Buy Property in Bali as a Foreigner",
    articleTwo: "Top Areas in Bali for High ROI",
    listCta: "List your property with TETAMO",
    listCtaSub: "Reach serious buyers & renters across Indonesia",
    getStarted: "Get Started",
    seeAll: "See all",
    loading: "Loading latest Tetamo listings...",
    fallback: "Showing preview listings until live listings are available.",
  },
  id: {
    subtitle: "Properti Marketplace",
    search: "Cari kota, area, atau properti",
    sale: "Dijual",
    rent: "Disewa",
    monthly: "Bulanan",
    yearly: "Tahunan",
    find: "Temukan properti Anda dengan TETAMO",
    why: "Mengapa Pilih TETAMO",
    verifiedListings: "Listing Terverifikasi",
    verifiedListingsSub: "Terpercaya & disaring",
    verifiedAgents: "Agen Terverifikasi",
    verifiedAgentsSub: "Profesional & terpercaya",
    verifiedOwners: "Pemilik Terverifikasi",
    verifiedOwnersSub: "Pemilik asli & jelas",
    trustedPlatform: "Platform Terpercaya",
    trustedPlatformSub: "Aman & transparan",
    smart: "Sistem Pintar untuk\nPembeli & Penyewa",
    learnMore: "Pelajari",
    featured: "Listing Unggulan",
    popular: "Area Populer",
    newProjects: "Proyek Baru",
    whyList: "Kenapa listing di Tetamo?",
    directWhatsApp: "WhatsApp Langsung",
    directWhatsAppSub: "Chat instan",
    scheduling: "Jadwal Viewing",
    schedulingSub: "Booking lebih mudah",
    aiTitle: "AI Judul & Deskripsi",
    aiTitleSub: "Visibilitas lebih baik",
    aiCaption: "AI Auto Caption",
    aiCaptionSub: "Media sosial",
    calculator: "Kalkulator Komisi",
    calculatorSub: "Hitung penghasilan",
    owner: "Pemilik",
    ownerSub: "Kelola properti",
    agent: "Agen",
    agentSub: "Kembangkan bisnis",
    developer: "Developer",
    developerSub: "Tampilkan proyek",
    buyRent: "Beli / Sewa",
    buyRentSub: "Cari properti",
    learn: "Belajar dengan TETAMO",
    articleOne: "Cara Membeli Properti di Bali untuk WNA",
    articleTwo: "Area Bali dengan ROI Tinggi",
    listCta: "Listing properti Anda di TETAMO",
    listCtaSub: "Jangkau pembeli & penyewa serius di Indonesia",
    getStarted: "Mulai",
    seeAll: "Lihat semua",
    loading: "Memuat listing terbaru Tetamo...",
    fallback: "Menampilkan preview listing sampai listing live tersedia.",
  },
};

function getShortText(value: string | undefined, fallback: string, max = 115) {
  const text = (value || fallback).replace(/\s+/g, " ").trim();

  if (text.length <= max) {
    return text;
  }

  return `${text.slice(0, max).trim()}...`;
}

export default function HomeScreen() {
  const router = useRouter();
  const [language, setLanguage] = useState<Language>("en");
  const [currency, setCurrency] = useState<Currency>("IDR");
  const [properties, setProperties] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [usedFallback, setUsedFallback] = useState(false);

  const t = copy[language];

  useEffect(() => {
    let isMounted = true;

    async function loadHomepageProperties() {
      try {
        setIsLoading(true);
        const rows = await fetchHomepageProperties(16);

        if (!isMounted) return;

        const liveRows = rows.filter((property) => property.priceIdr > 0);

        if (liveRows.length > 0) {
          setProperties(liveRows);
          setUsedFallback(false);
        } else {
          setProperties(fallbackListings);
          setUsedFallback(true);
        }
      } catch (error) {
        console.log("Tetamo mobile homepage fallback:", error);

        if (!isMounted) return;

        setProperties(fallbackListings);
        setUsedFallback(true);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadHomepageProperties();

    return () => {
      isMounted = false;
    };
  }, []);

  const hero = properties[0] || fallbackListings[0];

  const featuredListings = useMemo(() => {
    const rows =
      properties.length > 1 ? properties.slice(1, 9) : fallbackListings.slice(1);

    return rows.length > 0 ? rows : fallbackListings.slice(1);
  }, [properties]);

  const projectListings = useMemo(() => {
    const rows = properties.filter((property) =>
      property.badge?.toLowerCase().includes("project")
    );

    if (rows.length > 0) {
      return rows.slice(0, 3);
    }

    return fallbackProjects;
  }, [properties]);

  const popularAreas = useMemo(() => {
    const areas = properties
      .map((property) => property.area || property.location)
      .filter(Boolean)
      .map((area) => String(area).split(",")[0].trim())
      .filter(Boolean);

    const uniqueAreas = Array.from(new Set(areas));

    if (uniqueAreas.length > 0) {
      return uniqueAreas.slice(0, 8);
    }

    return [
      "Bali",
      "Jakarta",
      "Surabaya",
      "Bandung",
      "Seminyak",
      "Canggu",
      "Uluwatu",
      "BSD City",
    ];
  }, [properties]);

  const formatPrice = useMemo(() => {
    return (priceIdr: number) => {
      const converted = priceIdr * currencyRates[currency];

      if (!priceIdr || priceIdr <= 0) {
        return currency === "IDR" ? "Price on Request" : "Contact Us";
      }

      if (currency === "IDR") {
        return `IDR ${Math.round(converted).toLocaleString("en-US")}`;
      }

      return `${currency} ${Math.round(converted).toLocaleString("en-US")}`;
    };
  }, [currency]);

  const goProperty = (query?: string) => {
    router.push(query ? (`/property?${query}` as any) : ("/property" as any));
  };

  const goAddListing = (audience?: string) => {
    router.push(
      audience ? (`/add-listing?audience=${audience}` as any) : ("/add-listing" as any)
    );
  };

  const openWebsite = (path: string) => {
    Linking.openURL(`https://www.tetamo.com${path}`);
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
            <Image source={tetamoLogo} style={styles.logoImage} resizeMode="contain" />

            <View>
              <Text style={styles.brandText}>TETAMO</Text>
              <Text style={styles.brandSub}>{t.subtitle}</Text>
            </View>
          </View>

          <View style={styles.headerControls}>
            <Pressable
              style={styles.locationPill}
              onPress={() => goProperty("country=Indonesia")}
            >
              <MapPin color="#ffffff" size={12} />
              <Text style={styles.pillText}>Indonesia</Text>
              <ChevronDown color="#ffffff" size={12} />
            </Pressable>

            <View style={styles.toggleLine}>
              <View style={styles.toggleRow}>
                {(["en", "id"] as Language[]).map((item) => (
                  <Pressable
                    key={item}
                    onPress={() => setLanguage(item)}
                    style={[
                      styles.smallToggle,
                      language === item && styles.activeToggle,
                    ]}
                  >
                    <Text
                      style={[
                        styles.smallToggleText,
                        language === item && styles.activeToggleText,
                      ]}
                    >
                      {item.toUpperCase()}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <View style={styles.currencyRow}>
                {(["IDR", "USD", "AUD"] as Currency[]).map((item) => (
                  <Pressable
                    key={item}
                    onPress={() => setCurrency(item)}
                    style={[
                      styles.currencyToggle,
                      currency === item && styles.activeToggle,
                    ]}
                  >
                    <Text
                      style={[
                        styles.currencyText,
                        currency === item && styles.activeToggleText,
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

        <Pressable onPress={() => goProperty()} style={styles.searchBar}>
          <Search color="#ffffff" size={20} />
          <Text style={styles.searchText}>{t.search}</Text>
          <SlidersHorizontal color="#ffffff" size={19} />
        </Pressable>

        {isLoading && (
          <View style={styles.statusBox}>
            <Text style={styles.statusText}>{t.loading}</Text>
          </View>
        )}

        {!isLoading && usedFallback && (
          <View style={styles.statusBox}>
            <Text style={styles.statusText}>{t.fallback}</Text>
          </View>
        )}

        <Pressable onPress={() => goProperty(`id=${hero.id}`)}>
          <SafeImageBackground
            uri={hero.image}
            fallback={HERO_FALLBACK_IMAGE}
            style={styles.heroCard}
            imageStyle={styles.heroImage}
          >
            <View style={styles.heroShade} />

            <View style={styles.heroTop}>
              <View style={styles.badgeRow}>
                <Badge label={t.sale} color="#ffffff" textColor="#111111" />
                <Badge label={t.rent} color="#2563eb" textColor="#ffffff" />
                <Badge label={t.monthly} color="#16a34a" textColor="#ffffff" />
                <Badge label={t.yearly} color="#f59e0b" textColor="#111111" />
              </View>

              <View style={styles.counterBadge}>
                <Text style={styles.counterText}>1 / 5</Text>
              </View>
            </View>

            <View style={styles.heroBottom}>
              <Text style={styles.heroPrice}>{formatPrice(hero.priceIdr)}</Text>

              {currency === "IDR" && hero.priceIdr > 0 && (
                <Text style={styles.heroConverted}>
                  ≈ USD{" "}
                  {Math.round(hero.priceIdr * currencyRates.USD).toLocaleString(
                    "en-US"
                  )}{" "}
                  · AUD{" "}
                  {Math.round(hero.priceIdr * currencyRates.AUD).toLocaleString(
                    "en-US"
                  )}
                </Text>
              )}

              <Text style={styles.heroTitle} numberOfLines={2}>
                {language === "en" ? hero.titleEn : hero.titleId}
              </Text>

              <View style={styles.locationRow}>
                <MapPin color="#ffffff" size={13} />
                <Text style={styles.heroLocation} numberOfLines={1}>
                  {hero.location}
                </Text>
              </View>

              <Text style={styles.heroDescription} numberOfLines={2}>
                {getShortText(
                  language === "en" ? hero.descriptionEn : hero.descriptionId,
                  language === "en"
                    ? "Verified property listing with direct inquiry and schedule viewing."
                    : "Listing properti terverifikasi dengan inquiry langsung dan jadwal viewing.",
                  115
                )}
              </Text>

              <View style={styles.metricRow}>
                <Metric
                  bg="#e11d48"
                  icon={<Heart color="#ffffff" size={17} />}
                  value="256"
                />
                <Metric
                  bg="#7c3aed"
                  icon={<Bookmark color="#ffffff" size={17} />}
                  value="314"
                />
                <Metric
                  bg="#f59e0b"
                  icon={<Star color="#111111" size={17} />}
                  value="4.9"
                  textColor="#111111"
                />
                <Metric
                  bg="#0284c7"
                  icon={<Share2 color="#ffffff" size={17} />}
                  value="128"
                />
                <Metric
                  bg="#16a34a"
                  icon={<Eye color="#ffffff" size={17} />}
                  value={
                    hero.viewCount && hero.viewCount > 999
                      ? `${(hero.viewCount / 1000).toFixed(1)}K`
                      : String(hero.viewCount || "0")
                  }
                />
              </View>
            </View>
          </SafeImageBackground>
        </Pressable>

        <View style={styles.dots}>
          {[0, 1, 2, 3, 4].map((dot) => (
            <View key={dot} style={[styles.dot, dot === 0 && styles.activeDot]} />
          ))}
        </View>

        <SectionHeader
          title={t.find}
          action={t.seeAll}
          onPress={() => goProperty("section=categories")}
        />

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryRow}
        >
          <Category
            icon={<Palmtree color="#22c55e" size={24} />}
            label="Villa"
            onPress={() => goProperty("category=Villa")}
          />
          <Category
            icon={<House color="#60a5fa" size={24} />}
            label="House"
            onPress={() => goProperty("category=House")}
          />
          <Category
            icon={<Hotel color="#f59e0b" size={24} />}
            label="Hotel"
            onPress={() => goProperty("category=Hotel")}
          />
          <Category
            icon={<Store color="#fb7185" size={24} />}
            label="Ruko"
            onPress={() => goProperty("category=Ruko")}
          />
          <Category
            icon={<Building2 color="#a78bfa" size={24} />}
            label="Apartment"
            onPress={() => goProperty("category=Apartment")}
          />
          <Category
            icon={<Trees color="#34d399" size={24} />}
            label="Land"
            onPress={() => goProperty("category=Land")}
          />
        </ScrollView>

        <Text style={styles.sectionTitle}>{t.why}</Text>

        <View style={styles.trustGrid}>
          <TrustCard
            icon={<BadgeCheck color="#22c55e" size={23} />}
            title={t.verifiedListings}
            subtitle={t.verifiedListingsSub}
          />
          <TrustCard
            icon={<UserRound color="#60a5fa" size={23} />}
            title={t.verifiedAgents}
            subtitle={t.verifiedAgentsSub}
          />
          <TrustCard
            icon={<UserRound color="#f59e0b" size={23} />}
            title={t.verifiedOwners}
            subtitle={t.verifiedOwnersSub}
          />
          <TrustCard
            icon={<ShieldCheck color="#a78bfa" size={23} />}
            title={t.trustedPlatform}
            subtitle={t.trustedPlatformSub}
          />
        </View>

        <View style={styles.smartBanner}>
          <View style={styles.smartIconBox}>
            <BrainCircuit color="#ffffff" size={30} />
          </View>

          <Text style={styles.smartText}>{t.smart}</Text>

          <Pressable onPress={() => openWebsite("/about-us")} style={styles.learnButton}>
            <Text style={styles.learnButtonText}>{t.learnMore}</Text>
            <ChevronRight color="#111111" size={15} />
          </Pressable>
        </View>

        <SectionHeader
          title={t.featured}
          action={t.seeAll}
          onPress={() => goProperty("section=featured")}
        />

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.listingRow}
        >
          {featuredListings.map((listing) => (
            <PropertyCard
              key={listing.id}
              listing={listing}
              currency={currency}
              language={language}
              formatPrice={formatPrice}
              onPress={() => goProperty(`id=${listing.id}`)}
            />
          ))}
        </ScrollView>

        <View style={styles.panel}>
          <SectionHeader
            title={t.popular}
            action={t.seeAll}
            compact
            onPress={() => goProperty("section=popular-areas")}
          />

          <View style={styles.areaWrap}>
            {popularAreas.map((area) => (
              <Pressable
                key={area}
                style={styles.areaPill}
                onPress={() => goProperty(`area=${encodeURIComponent(area)}`)}
              >
                <MapPin color="#ffffff" size={12} />
                <Text style={styles.areaText}>{area}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.panel}>
          <SectionHeader
            title={t.newProjects}
            action={t.seeAll}
            compact
            onPress={() => goProperty("section=new-projects")}
          />

          {projectListings.map((project) => (
            <Pressable
              key={project.id}
              style={styles.projectRow}
              onPress={() => goProperty(`project=${project.id}`)}
            >
              <SafeImage
                uri={project.image}
                fallback={PROJECT_FALLBACK_IMAGE}
                style={styles.projectImage}
              />

              <View style={styles.projectTextBox}>
                <Text style={styles.projectTitle} numberOfLines={1}>
                  {language === "en" ? project.titleEn : project.titleId}
                </Text>
                <Text style={styles.projectLocation} numberOfLines={1}>
                  {project.location}
                </Text>
                <Text style={styles.projectPrice} numberOfLines={1}>
                  From {formatPrice(project.priceIdr)}
                </Text>
              </View>
            </Pressable>
          ))}
        </View>

        <Text style={styles.sectionTitle}>{t.whyList}</Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.benefitRow}
        >
          <Benefit
            icon={<MessageCircle color="#22c55e" size={22} />}
            title={t.directWhatsApp}
            subtitle={t.directWhatsAppSub}
          />
          <Benefit
            icon={<CalendarDays color="#60a5fa" size={22} />}
            title={t.scheduling}
            subtitle={t.schedulingSub}
          />
          <Benefit
            icon={<Sparkles color="#f59e0b" size={22} />}
            title={t.aiTitle}
            subtitle={t.aiTitleSub}
          />
          <Benefit
            icon={<Languages color="#a78bfa" size={22} />}
            title={t.aiCaption}
            subtitle={t.aiCaptionSub}
          />
          <Benefit
            icon={<Calculator color="#fb7185" size={22} />}
            title={t.calculator}
            subtitle={t.calculatorSub}
          />
        </ScrollView>

        <View style={styles.entryGrid}>
          <EntryCard
            icon={<UserRound color="#ffffff" size={25} />}
            title={t.owner}
            subtitle={t.ownerSub}
            onPress={() => goAddListing("owner")}
          />
          <EntryCard
            icon={<BriefcaseBusiness color="#ffffff" size={25} />}
            title={t.agent}
            subtitle={t.agentSub}
            onPress={() => goAddListing("agent")}
          />
          <EntryCard
            icon={<Building2 color="#ffffff" size={25} />}
            title={t.developer}
            subtitle={t.developerSub}
            onPress={() => goAddListing("developer")}
          />
          <EntryCard
            icon={<House color="#ffffff" size={25} />}
            title={t.buyRent}
            subtitle={t.buyRentSub}
            onPress={() => goProperty("purpose=buy-rent")}
          />
        </View>

        <SectionHeader
          title={t.learn}
          action={t.seeAll}
          onPress={() => openWebsite("/education")}
        />

        <View style={styles.articleRow}>
          <ArticleCard
            image={ARTICLE_IMAGE_ONE}
            fallback={ARTICLE_IMAGE_ONE}
            tag={language === "en" ? "Buying Guide" : "Panduan Beli"}
            title={t.articleOne}
            readTime="5 min read"
            onPress={() => openWebsite("/blog")}
          />

          <ArticleCard
            image={ARTICLE_IMAGE_TWO}
            fallback={ARTICLE_IMAGE_TWO}
            tag={language === "en" ? "Investment Tips" : "Tips Investasi"}
            title={t.articleTwo}
            readTime="6 min read"
            onPress={() => openWebsite("/blog")}
          />
        </View>

        <View style={styles.ctaBanner}>
          <View style={styles.ctaTextBox}>
            <Text style={styles.ctaTitle}>{t.listCta}</Text>
            <Text style={styles.ctaSub}>{t.listCtaSub}</Text>
          </View>

          <Pressable onPress={() => goAddListing()} style={styles.ctaButton}>
            <Text style={styles.ctaButtonText}>{t.getStarted}</Text>
            <ChevronRight color="#111111" size={16} />
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function SafeImage({
  uri,
  fallback,
  style,
}: {
  uri?: string;
  fallback: string;
  style: StyleProp<ImageStyle>;
}) {
  const [imageUri, setImageUri] = useState(uri || fallback);

  useEffect(() => {
    setImageUri(uri || fallback);
  }, [uri, fallback]);

  return (
    <Image
      source={{ uri: imageUri }}
      style={style}
      onError={() => setImageUri(fallback)}
    />
  );
}

function SafeImageBackground({
  uri,
  fallback,
  style,
  imageStyle,
  children,
}: {
  uri?: string;
  fallback: string;
  style: StyleProp<ViewStyle>;
  imageStyle: StyleProp<ImageStyle>;
  children: ReactNode;
}) {
  const [imageUri, setImageUri] = useState(uri || fallback);

  useEffect(() => {
    setImageUri(uri || fallback);
  }, [uri, fallback]);

  return (
    <ImageBackground
      source={{ uri: imageUri }}
      style={style}
      imageStyle={imageStyle}
      onError={() => setImageUri(fallback)}
    >
      {children}
    </ImageBackground>
  );
}

function Badge({
  label,
  color,
  textColor,
}: {
  label: string;
  color: string;
  textColor: string;
}) {
  return (
    <View style={[styles.badge, { backgroundColor: color }]}>
      <Text style={[styles.badgeText, { color: textColor }]}>{label}</Text>
    </View>
  );
}

function Metric({
  icon,
  value,
  bg,
  textColor = "#ffffff",
}: {
  icon: ReactNode;
  value: string;
  bg: string;
  textColor?: string;
}) {
  return (
    <View style={[styles.metric, { backgroundColor: bg }]}>
      {icon}
      <Text style={[styles.metricText, { color: textColor }]}>{value}</Text>
    </View>
  );
}

function SectionHeader({
  title,
  action,
  compact = false,
  onPress,
}: {
  title: string;
  action: string;
  compact?: boolean;
  onPress?: () => void;
}) {
  return (
    <View style={[styles.sectionHeader, compact && styles.sectionHeaderCompact]}>
      <Text style={[styles.sectionTitle, compact && styles.compactTitle]}>
        {title}
      </Text>

      <Pressable style={styles.seeAllRow} onPress={onPress}>
        <Text style={styles.seeAllText}>{action}</Text>
        <ChevronRight color="#ffffff" size={13} />
      </Pressable>
    </View>
  );
}

function Category({
  icon,
  label,
  onPress,
}: {
  icon: ReactNode;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.categoryCard} onPress={onPress}>
      {icon}
      <Text style={styles.categoryLabel}>{label}</Text>
    </Pressable>
  );
}

function TrustCard({
  icon,
  title,
  subtitle,
}: {
  icon: ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <View style={styles.trustCard}>
      <View style={styles.trustIcon}>{icon}</View>
      <View style={styles.trustTextBox}>
        <Text style={styles.trustTitle}>{title}</Text>
        <Text style={styles.trustSubtitle}>{subtitle}</Text>
      </View>
    </View>
  );
}

function PropertyCard({
  listing,
  currency,
  language,
  formatPrice,
  onPress,
}: {
  listing: Listing;
  currency: Currency;
  language: Language;
  formatPrice: (priceIdr: number) => string;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.propertyCard} onPress={onPress}>
      <SafeImageBackground
        uri={listing.image}
        fallback={HERO_FALLBACK_IMAGE}
        style={styles.propertyImage}
        imageStyle={styles.propertyImageRadius}
      >
        <View style={styles.propertyBadge}>
          <Text style={styles.propertyBadgeText}>{listing.badge}</Text>
        </View>

        <View style={styles.favoriteBubble}>
          <Heart color="#ffffff" size={16} />
        </View>
      </SafeImageBackground>

      <View style={styles.propertyBody}>
        <Text style={styles.propertyPrice}>{formatPrice(listing.priceIdr)}</Text>

        {currency !== "IDR" && listing.priceIdr > 0 && (
          <Text style={styles.propertySubPrice}>
            IDR {listing.priceIdr.toLocaleString("en-US")}
          </Text>
        )}

        <Text style={styles.propertyTitle} numberOfLines={1}>
          {language === "en" ? listing.titleEn : listing.titleId}
        </Text>

        <View style={styles.propertyLocationRow}>
          <MapPin color="#5f5f5f" size={11} />
          <Text style={styles.propertyLocation} numberOfLines={1}>
            {listing.location}
          </Text>
        </View>

        <View style={styles.propertyMeta}>
          <View style={styles.metaItem}>
            <BedDouble color="#111111" size={12} />
            <Text style={styles.metaText}>{listing.beds || 0}</Text>
          </View>

          <View style={styles.metaItem}>
            <Bath color="#111111" size={12} />
            <Text style={styles.metaText}>{listing.baths || 0}</Text>
          </View>

          <View style={styles.metaItem}>
            <Ruler color="#111111" size={12} />
            <Text style={styles.metaText}>{listing.size || 0} m²</Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

function Benefit({
  icon,
  title,
  subtitle,
}: {
  icon: ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <View style={styles.benefitCard}>
      {icon}
      <Text style={styles.benefitTitle}>{title}</Text>
      <Text style={styles.benefitSubtitle}>{subtitle}</Text>
    </View>
  );
}

function EntryCard({
  icon,
  title,
  subtitle,
  onPress,
}: {
  icon: ReactNode;
  title: string;
  subtitle: string;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.entryCard} onPress={onPress}>
      <View style={styles.entryIcon}>{icon}</View>
      <View style={styles.entryTextBox}>
        <Text style={styles.entryTitle}>{title}</Text>
        <Text style={styles.entrySubtitle}>{subtitle}</Text>
      </View>
      <ChevronRight color="#ffffff" size={17} />
    </Pressable>
  );
}

function ArticleCard({
  image,
  fallback,
  tag,
  title,
  readTime,
  onPress,
}: {
  image: string;
  fallback: string;
  tag: string;
  title: string;
  readTime: string;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.articleCard} onPress={onPress}>
      <SafeImage uri={image} fallback={fallback} style={styles.articleImage} />

      <View style={styles.articleTextBox}>
        <Text style={styles.articleTag}>{tag}</Text>
        <Text style={styles.articleTitle} numberOfLines={2}>
          {title}
        </Text>
        <Text style={styles.articleTime}>{readTime}</Text>
      </View>
    </Pressable>
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
    paddingTop: 14,
    paddingBottom: 34,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 10,
    marginBottom: 16,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  logoImage: {
    width: 38,
    height: 38,
  },
  brandText: {
    color: "#ffffff",
    fontSize: 20,
    letterSpacing: 4,
    fontWeight: "700",
  },
  brandSub: {
    color: "#c9c9c9",
    marginTop: 1,
    fontSize: 10.5,
    letterSpacing: 0.7,
  },
  headerControls: {
    alignItems: "flex-end",
    gap: 6,
  },
  locationPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderWidth: 1,
    borderColor: "#343434",
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 6,
  },
  pillText: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "700",
  },
  toggleLine: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  toggleRow: {
    flexDirection: "row",
    borderWidth: 1,
    borderColor: "#343434",
    borderRadius: 999,
    overflow: "hidden",
  },
  smallToggle: {
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  smallToggleText: {
    color: "#9c9c9c",
    fontSize: 10,
    fontWeight: "800",
  },
  activeToggle: {
    backgroundColor: "#ffffff",
  },
  activeToggleText: {
    color: "#111111",
  },
  currencyRow: {
    flexDirection: "row",
    borderWidth: 1,
    borderColor: "#343434",
    borderRadius: 999,
    overflow: "hidden",
  },
  currencyToggle: {
    paddingHorizontal: 6,
    paddingVertical: 5,
  },
  currencyText: {
    color: "#9c9c9c",
    fontSize: 9,
    fontWeight: "800",
  },
  searchBar: {
    height: 54,
    borderRadius: 21,
    borderWidth: 1,
    borderColor: "#373737",
    backgroundColor: "#101010",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    gap: 11,
    marginBottom: 12,
  },
  searchText: {
    flex: 1,
    color: "#9f9f9f",
    fontSize: 14,
  },
  statusBox: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#2f2f2f",
    backgroundColor: "#101010",
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
  },
  statusText: {
    color: "#cfcfcf",
    fontSize: 11.5,
    fontWeight: "700",
  },
  heroCard: {
    height: 350,
    borderRadius: 25,
    overflow: "hidden",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#383838",
  },
  heroImage: {
    borderRadius: 25,
  },
  heroShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.32)",
  },
  heroTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 8,
    padding: 12,
  },
  badgeRow: {
    flexDirection: "row",
    gap: 5,
    flex: 1,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 999,
  },
  badgeText: {
    fontSize: 9.5,
    fontWeight: "900",
  },
  counterBadge: {
    backgroundColor: "rgba(0,0,0,0.72)",
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 999,
  },
  counterText: {
    color: "#ffffff",
    fontSize: 10.5,
    fontWeight: "900",
  },
  heroBottom: {
    padding: 15,
  },
  heroPrice: {
    color: "#ffffff",
    fontSize: 21,
    fontWeight: "900",
    letterSpacing: -0.4,
  },
  heroConverted: {
    color: "#e4e4e4",
    fontSize: 11.5,
    marginTop: 2,
    fontWeight: "700",
  },
  heroTitle: {
    color: "#ffffff",
    fontSize: 17,
    lineHeight: 21,
    fontWeight: "900",
    marginTop: 6,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 6,
  },
  heroLocation: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "700",
    flex: 1,
  },
  heroDescription: {
    color: "#f0f0f0",
    fontSize: 12,
    lineHeight: 17,
    marginTop: 6,
    maxWidth: "92%",
  },
  metricRow: {
    flexDirection: "row",
    gap: 7,
    marginTop: 13,
  },
  metric: {
    width: 50,
    height: 50,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.22)",
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  metricText: {
    fontSize: 9.5,
    fontWeight: "900",
  },
  dots: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 7,
    marginTop: 10,
    marginBottom: 22,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 99,
    backgroundColor: "#3a3a3a",
  },
  activeDot: {
    width: 18,
    backgroundColor: "#ffffff",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 11,
  },
  sectionHeaderCompact: {
    marginBottom: 10,
  },
  sectionTitle: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "900",
    letterSpacing: -0.2,
  },
  compactTitle: {
    fontSize: 15,
  },
  seeAllRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  seeAllText: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "800",
  },
  categoryRow: {
    gap: 10,
    paddingBottom: 22,
  },
  categoryCard: {
    width: 98,
    height: 78,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#383838",
    backgroundColor: "#101010",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  categoryLabel: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "800",
  },
  trustGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 12,
    marginBottom: 12,
  },
  trustCard: {
    width: "48.5%",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#303030",
    backgroundColor: "#101010",
    flexDirection: "row",
    alignItems: "center",
    padding: 11,
    gap: 9,
  },
  trustIcon: {
    width: 36,
    height: 36,
    borderRadius: 14,
    backgroundColor: "#1b1b1b",
    alignItems: "center",
    justifyContent: "center",
  },
  trustTextBox: {
    flex: 1,
  },
  trustTitle: {
    color: "#ffffff",
    fontSize: 10.5,
    fontWeight: "900",
  },
  trustSubtitle: {
    color: "#9e9e9e",
    fontSize: 9.5,
    marginTop: 2,
    lineHeight: 13,
  },
  smartBanner: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#303030",
    backgroundColor: "#0f0f0f",
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 24,
  },
  smartIconBox: {
    width: 52,
    height: 52,
    borderRadius: 19,
    backgroundColor: "#191919",
    borderWidth: 1,
    borderColor: "#343434",
    alignItems: "center",
    justifyContent: "center",
  },
  smartText: {
    flex: 1,
    color: "#ffffff",
    fontSize: 18,
    lineHeight: 24,
    fontWeight: "900",
    letterSpacing: -0.25,
  },
  learnButton: {
    backgroundColor: "#ffffff",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 9,
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  learnButtonText: {
    color: "#111111",
    fontSize: 10.5,
    fontWeight: "900",
  },
  listingRow: {
    gap: 12,
    paddingBottom: 20,
  },
  propertyCard: {
    width: 196,
    backgroundColor: "#ffffff",
    borderRadius: 20,
    overflow: "hidden",
  },
  propertyImage: {
    height: 116,
    justifyContent: "space-between",
    padding: 9,
  },
  propertyImageRadius: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  propertyBadge: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(0,0,0,0.75)",
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  propertyBadgeText: {
    color: "#ffffff",
    fontSize: 10,
    fontWeight: "900",
  },
  favoriteBubble: {
    position: "absolute",
    right: 9,
    top: 9,
    width: 31,
    height: 31,
    borderRadius: 13,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
  },
  propertyBody: {
    padding: 12,
  },
  propertyPrice: {
    color: "#111111",
    fontSize: 13.5,
    fontWeight: "900",
  },
  propertySubPrice: {
    color: "#777777",
    fontSize: 10,
    marginTop: 2,
    fontWeight: "700",
  },
  propertyTitle: {
    color: "#111111",
    fontSize: 12.5,
    fontWeight: "800",
    marginTop: 4,
  },
  propertyLocationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    marginTop: 4,
  },
  propertyLocation: {
    color: "#5d5d5d",
    fontSize: 10.5,
    flex: 1,
  },
  propertyMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 9,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  metaText: {
    color: "#111111",
    fontSize: 9.5,
    fontWeight: "800",
  },
  panel: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#303030",
    backgroundColor: "#0f0f0f",
    padding: 12,
    marginBottom: 14,
  },
  areaWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
  },
  areaPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderWidth: 1,
    borderColor: "#363636",
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 7,
  },
  areaText: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "800",
  },
  projectRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    marginBottom: 12,
  },
  projectImage: {
    width: 112,
    height: 70,
    borderRadius: 15,
  },
  projectTextBox: {
    flex: 1,
    justifyContent: "center",
  },
  projectTitle: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "900",
  },
  projectLocation: {
    color: "#b0b0b0",
    fontSize: 10.5,
    marginTop: 2,
  },
  projectPrice: {
    color: "#ffffff",
    fontSize: 10.5,
    fontWeight: "800",
    marginTop: 3,
  },
  benefitRow: {
    gap: 10,
    paddingTop: 12,
    paddingBottom: 16,
  },
  benefitCard: {
    width: 136,
    minHeight: 86,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: "#303030",
    backgroundColor: "#101010",
    padding: 12,
    justifyContent: "center",
  },
  benefitTitle: {
    color: "#ffffff",
    fontSize: 11.5,
    fontWeight: "900",
    marginTop: 8,
  },
  benefitSubtitle: {
    color: "#9b9b9b",
    fontSize: 9.5,
    marginTop: 2,
  },
  entryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 24,
  },
  entryCard: {
    width: "48.5%",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#303030",
    backgroundColor: "#101010",
    padding: 13,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },
  entryIcon: {
    width: 36,
    height: 36,
    borderRadius: 14,
    backgroundColor: "#1a1a1a",
    alignItems: "center",
    justifyContent: "center",
  },
  entryTextBox: {
    flex: 1,
  },
  entryTitle: {
    color: "#ffffff",
    fontSize: 12.5,
    fontWeight: "900",
  },
  entrySubtitle: {
    color: "#9d9d9d",
    fontSize: 9.5,
    marginTop: 2,
  },
  articleRow: {
    gap: 12,
    marginBottom: 20,
  },
  articleCard: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#303030",
    backgroundColor: "#101010",
    padding: 10,
    flexDirection: "row",
    gap: 12,
  },
  articleImage: {
    width: 146,
    height: 86,
    borderRadius: 16,
  },
  articleTextBox: {
    flex: 1,
    justifyContent: "center",
  },
  articleTag: {
    alignSelf: "flex-start",
    color: "#111111",
    backgroundColor: "#ffffff",
    borderRadius: 999,
    overflow: "hidden",
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontSize: 9.5,
    fontWeight: "900",
    marginBottom: 7,
  },
  articleTitle: {
    color: "#ffffff",
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "900",
  },
  articleTime: {
    color: "#9b9b9b",
    fontSize: 10.5,
    marginTop: 7,
    fontWeight: "700",
  },
  ctaBanner: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#303030",
    backgroundColor: "#101010",
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  ctaTextBox: {
    flex: 1,
  },
  ctaTitle: {
    color: "#ffffff",
    fontSize: 17,
    lineHeight: 22,
    fontWeight: "900",
    letterSpacing: -0.25,
  },
  ctaSub: {
    color: "#b2b2b2",
    fontSize: 11.5,
    lineHeight: 16,
    marginTop: 5,
  },
  ctaButton: {
    backgroundColor: "#ffffff",
    borderRadius: 17,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  ctaButtonText: {
    color: "#111111",
    fontSize: 12,
    fontWeight: "900",
  },
});