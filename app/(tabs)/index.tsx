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
import { useMemo, useState } from "react";
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

type Language = "en" | "id";
type Currency = "IDR" | "USD" | "AUD";

type Listing = {
  id: string;
  titleEn: string;
  titleId: string;
  location: string;
  area: string;
  image: string;
  priceIdr: number;
  beds: number;
  baths: number;
  size: number;
  badge: string;
};

const tetamoLogo = require("../../assets/images/tetamo-logo.png");

const currencyRates: Record<Currency, number> = {
  IDR: 1,
  USD: 0.000061,
  AUD: 0.000094,
};

const heroListings: Listing[] = [
  {
    id: "hero-1",
    titleEn: "Luxury 4BR Villa in Canggu",
    titleId: "Villa Mewah 4KT di Canggu",
    location: "Canggu, Badung, Bali",
    area: "Canggu",
    image:
      "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?q=80&w=1400&auto=format&fit=crop",
    priceIdr: 18500000000,
    beds: 4,
    baths: 4,
    size: 450,
    badge: "Featured",
  },
];

const featuredListings: Listing[] = [
  {
    id: "1",
    titleEn: "3BR Villa in Uluwatu",
    titleId: "Villa 3KT di Uluwatu",
    location: "Uluwatu, Bali",
    area: "Uluwatu",
    image:
      "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?q=80&w=900&auto=format&fit=crop",
    priceIdr: 7950000000,
    beds: 3,
    baths: 3,
    size: 250,
    badge: "Featured",
  },
  {
    id: "2",
    titleEn: "2BR Apartment in SCBD",
    titleId: "Apartemen 2KT di SCBD",
    location: "Jakarta Selatan",
    area: "Jakarta",
    image:
      "https://images.unsplash.com/photo-1600607688969-a5bfcd646154?q=80&w=900&auto=format&fit=crop",
    priceIdr: 3200000000,
    beds: 2,
    baths: 2,
    size: 128,
    badge: "Boosted",
  },
  {
    id: "3",
    titleEn: "Modern Townhouse",
    titleId: "Townhouse Modern",
    location: "Surabaya, Jawa Timur",
    area: "Surabaya",
    image:
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=900&auto=format&fit=crop",
    priceIdr: 2750000000,
    beds: 3,
    baths: 3,
    size: 160,
    badge: "Spotlight",
  },
  {
    id: "4",
    titleEn: "Setiabudi Residences",
    titleId: "Setiabudi Residences",
    location: "Bali",
    area: "Bali",
    image:
      "https://images.unsplash.com/photo-1613977257363-707ba9348227?q=80&w=900&auto=format&fit=crop",
    priceIdr: 3900000000,
    beds: 4,
    baths: 4,
    size: 220,
    badge: "New Project",
  },
];

const projects = [
  {
    id: "project-1",
    title: "The Banyan Residences",
    location: "Berawa, Canggu",
    priceIdr: 2900000000,
    image:
      "https://images.unsplash.com/photo-1600607687644-c7171b42498b?q=80&w=800&auto=format&fit=crop",
  },
  {
    id: "project-2",
    title: "Luma Ubud",
    location: "Ubud, Bali",
    priceIdr: 1750000000,
    image:
      "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?q=80&w=800&auto=format&fit=crop",
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
  },
};

export default function HomeScreen() {
  const router = useRouter();
  const [language, setLanguage] = useState<Language>("en");
  const [currency, setCurrency] = useState<Currency>("IDR");

  const t = copy[language];
  const hero = heroListings[0];

  const formatPrice = useMemo(() => {
    return (priceIdr: number) => {
      const converted = priceIdr * currencyRates[currency];

      if (currency === "IDR") {
        return `IDR ${Math.round(converted).toLocaleString("en-US")}`;
      }

      return `${currency} ${Math.round(converted).toLocaleString("en-US")}`;
    };
  }, [currency]);

  const goProperty = (query?: string) => {
    router.push(query ? `/property?${query}` : "/property");
  };

  const goAddListing = (audience?: string) => {
    router.push(audience ? `/add-listing?audience=${audience}` : "/add-listing");
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
            <Pressable style={styles.locationPill} onPress={() => goProperty("country=Indonesia")}>
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

        <Pressable onPress={() => goProperty(`id=${hero.id}`)}>
          <ImageBackground
            source={{ uri: hero.image }}
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

              {currency === "IDR" && (
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

              <Text style={styles.heroTitle}>
                {language === "en" ? hero.titleEn : hero.titleId}
              </Text>

              <View style={styles.locationRow}>
                <MapPin color="#ffffff" size={13} />
                <Text style={styles.heroLocation}>{hero.location}</Text>
              </View>

              <Text style={styles.heroDescription}>
                {language === "en"
                  ? "Modern tropical villa with rice field view and private pool. Minutes to the beach and cafes."
                  : "Villa tropis modern dengan pemandangan sawah dan kolam pribadi. Dekat pantai dan kafe."}
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
                  value="2.1K"
                />
              </View>
            </View>
          </ImageBackground>
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
            {[
              "Bali",
              "Jakarta",
              "Surabaya",
              "Bandung",
              "Seminyak",
              "Canggu",
              "Uluwatu",
              "BSD City",
            ].map((area) => (
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
          {projects.map((project) => (
            <Pressable
              key={project.id}
              style={styles.projectRow}
              onPress={() => goProperty(`project=${project.id}`)}
            >
              <Image source={{ uri: project.image }} style={styles.projectImage} />
              <View style={styles.projectTextBox}>
                <Text style={styles.projectTitle}>{project.title}</Text>
                <Text style={styles.projectLocation}>{project.location}</Text>
                <Text style={styles.projectPrice}>
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
            image="https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?q=80&w=900&auto=format&fit=crop"
            tag={language === "en" ? "Buying Guide" : "Panduan Beli"}
            title={t.articleOne}
            readTime="5 min read"
            onPress={() => openWebsite("/blog")}
          />

          <ArticleCard
            image="https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=900&auto=format&fit=crop"
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
      <ImageBackground
        source={{ uri: listing.image }}
        style={styles.propertyImage}
        imageStyle={styles.propertyImageRadius}
      >
        <View style={styles.propertyBadge}>
          <Text style={styles.propertyBadgeText}>{listing.badge}</Text>
        </View>

        <View style={styles.favoriteBubble}>
          <Heart color="#ffffff" size={16} />
        </View>
      </ImageBackground>

      <View style={styles.propertyBody}>
        <Text style={styles.propertyPrice}>{formatPrice(listing.priceIdr)}</Text>

        {currency !== "IDR" && (
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
            <Text style={styles.metaText}>{listing.beds}</Text>
          </View>

          <View style={styles.metaItem}>
            <Bath color="#111111" size={12} />
            <Text style={styles.metaText}>{listing.baths}</Text>
          </View>

          <View style={styles.metaItem}>
            <Ruler color="#111111" size={12} />
            <Text style={styles.metaText}>{listing.size} m²</Text>
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
  tag,
  title,
  readTime,
  onPress,
}: {
  image: string;
  tag: string;
  title: string;
  readTime: string;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.articleCard} onPress={onPress}>
      <Image source={{ uri: image }} style={styles.articleImage} />
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
  heroCard: {
    height: 330,
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
    backgroundColor: "rgba(0,0,0,0.38)",
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
    fontSize: 22,
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
    fontSize: 18,
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
  },
  heroDescription: {
    color: "#f0f0f0",
    fontSize: 12,
    lineHeight: 18,
    marginTop: 6,
    maxWidth: "88%",
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