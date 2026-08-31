import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
  BadgeDollarSign,
  Bath,
  BedDouble,
  Bell,
  Building2,
  CalendarDays,
  ChevronRight,
  Heart,
  Home,
  KeyRound,
  Languages,
  MapPin,
  MessageCircle,
  Ruler,
  Search,
  SlidersHorizontal,
  Sparkles,
} from "lucide-react-native";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import type {
  ImageStyle,
  StyleProp,
  ViewStyle,
} from "react-native";
import {
  ActivityIndicator,
  Image,
  Linking,
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
  fetchHomepageProperties,
  type TetamoProperty,
} from "../../services/properties";

type Language = "en" | "id";
type Currency = "IDR" | "USD" | "AUD";
type Listing = TetamoProperty;

const tetamoLogo = require("../../assets/images/tetamo-logo.png");
const tetamoPartnerIcon = require("../../assets/images/tetamo-partner-icon.png");

const BLACK = "#111111";
const CREAM = "#FBFAF7";
const WHITE = "#FFFFFF";

const GOLD = "#D8B46A";
const GOLD_DARK = "#B8892E";
const GOLD_SOFT = "#F3E7C5";

const BORDER = "#E9E2D8";
const MUTED = "#777169";
const SOFT = "#F5F1EA";

const TETAMO_FALLBACK_WHATSAPP =
  process.env.EXPO_PUBLIC_TETAMO_FALLBACK_WHATSAPP || "";

/*
 * Display conversion only for now.
 * We can connect this to live FX later.
 */
const currencyRates: Record<Currency, number> = {
  IDR: 1,
  USD: 0.000061,
  AUD: 0.000094,
};

const copy = {
  en: {
    subtitle: "Property Marketplace",

    search: "Search city, area or property...",
    sale: "For Sale",
    rent: "For Rent",

    featured: "Featured Property",
    discoverIndonesia: "Explore Indonesia",
    discover: "Discover Properties",

    browseByGoal: "Browse by Goal",

    saleTitle: "Properties for Sale",
    saleSub: "Homes, land and investment opportunities",

    rentTitle: "Properties for Rent",
    rentSub: "Monthly and yearly rental properties",

    trustTitle: "Property search made simpler",
    directWhatsapp: "Direct WhatsApp",
    scheduleViewing: "Schedule Viewing",
    bilingualListings: "Bilingual Listings",

    newOnTetamo: "New on TETAMO",

    seeAll: "See all",
    properties: "properties",

    whatsapp: "WhatsApp",
    viewing: "Viewing",

    exploreAll: "Explore all properties",

    loading: "Loading properties...",
    empty: "No properties available right now.",

    priceOnRequest: "Price on request",
  },

  id: {
    subtitle: "Properti Marketplace",

    search: "Cari kota, area atau properti...",
    sale: "Dijual",
    rent: "Disewakan",

    featured: "Properti Unggulan",
    discoverIndonesia: "Jelajahi Indonesia",
    discover: "Temukan Properti",

    browseByGoal: "Cari Sesuai Kebutuhan",

    saleTitle: "Properti Dijual",
    saleSub: "Rumah, tanah dan properti investasi",

    rentTitle: "Properti Disewakan",
    rentSub: "Properti sewa bulanan dan tahunan",

    trustTitle: "Cari properti jadi lebih mudah",
    directWhatsapp: "WhatsApp Langsung",
    scheduleViewing: "Jadwal Viewing",
    bilingualListings: "Listing Bilingual",

    newOnTetamo: "Terbaru di TETAMO",

    seeAll: "Lihat semua",
    properties: "properti",

    whatsapp: "WhatsApp",
    viewing: "Viewing",

    exploreAll: "Lihat semua properti",

    loading: "Memuat properti...",
    empty: "Belum ada properti tersedia saat ini.",

    priceOnRequest: "Hubungi untuk harga",
  },
};

export default function HomeScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();

  const [language, setLanguage] = useState<Language>("en");
  const [currency, setCurrency] = useState<Currency>("IDR");

  const [searchInput, setSearchInput] = useState("");
  const [properties, setProperties] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  const [heroIndex, setHeroIndex] = useState(0);
  const [unreadNotificationCount, setUnreadNotificationCount] =
    useState(0);

  const t = copy[language];

  const heroCardWidth = Math.min(
    Math.max(width - 48, 300),
    430
  );

  /*
   * ============================================
   * REAL PROPERTY DATA
   * ============================================
   */

  useEffect(() => {
    let mounted = true;

    async function loadHomepage() {
      try {
        setLoading(true);

        const rows = await fetchHomepageProperties(40);

        if (!mounted) return;

        const realProperties = Array.isArray(rows)
          ? rows
          : [];

        setProperties(realProperties);

        /*
         * Prefetch only the first property images.
         * We don't preload the entire marketplace.
         */
        realProperties
          .slice(0, 12)
          .map((property) => property.image)
          .filter(Boolean)
          .forEach((uri) => {
            if (!uri) return;

            void Image.prefetch(uri).catch(() => {});
          });
      } catch (error) {
        console.log("Tetamo Home load error:", error);

        if (!mounted) return;

        /*
         * No fake fallback properties.
         */
        setProperties([]);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    void loadHomepage();

    return () => {
      mounted = false;
    };
  }, []);

  /*
 * ============================================
 * NOTIFICATIONS
 * ============================================
 */

useEffect(() => {
  let mounted = true;
  let channel: ReturnType<
    typeof supabase.channel
  > | null = null;

  async function setupNotifications() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!mounted) return;

    const currentUserId = user?.id;

    if (!currentUserId) {
      setUnreadNotificationCount(0);
      return;
    }

    async function loadUnreadNotifications() {
      const { count, error } = await supabase
        .from("notifications")
        .select("id", {
          count: "exact",
          head: true,
        })
        .eq("user_id", currentUserId)
        .or(
          "is_read.eq.false,is_read.is.null"
        );

      if (!mounted) return;

      if (error) {
        console.error(
          "Home notification count error:",
          error
        );

        return;
      }

      setUnreadNotificationCount(
        count || 0
      );
    }

    /*
     * Initial unread count
     */
    await loadUnreadNotifications();

    if (!mounted) return;

    /*
     * Live notification updates
     */
    const notificationChannelName =
      `home-notifications-${currentUserId}`;

    /*
     * Supabase reuses an existing channel when
     * the same topic already exists. During a
     * remount / Fast Refresh, the previous Home
     * channel may still be finishing cleanup.
     *
     * Remove that stale channel before attaching
     * postgres_changes callbacks to a fresh one.
     */
    const existingChannel =
      supabase
        .getChannels()
        .find(
          (candidate) =>
            candidate.topic ===
            `realtime:${notificationChannelName}`
        );

    if (existingChannel) {
      await supabase.removeChannel(
        existingChannel
      );
    }

    if (!mounted) return;

    channel = supabase
      .channel(notificationChannelName)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${currentUserId}`,
        },
        () => {
          void loadUnreadNotifications();
        }
      )
      .subscribe();
  }

  void setupNotifications().catch((error) => {
  console.error(
    "Home notification setup error:",
    error
  );

  if (mounted) {
    setUnreadNotificationCount(0);
  }
});

  return () => {
    mounted = false;

    if (channel) {
      void supabase.removeChannel(
        channel
      );
    }
  };
}, []);


  /*
   * ============================================
   * DISCOVERY GROUPS
   * ============================================
   */

  const promotedProperties = useMemo(() => {
    return properties
      .filter(
        (property) =>
          getPromotionPriority(property) > 0
      )
      .sort(
        (a, b) =>
          getPromotionPriority(b) -
          getPromotionPriority(a)
      )
      .slice(0, 5);
  }, [properties]);

  const heroProperties = useMemo(() => {
    if (promotedProperties.length > 0) {
      return promotedProperties;
    }

    return properties.slice(0, 5);
  }, [promotedProperties, properties]);

  const saleProperties = useMemo(() => {
    return properties.filter(isSaleListing);
  }, [properties]);

  const rentProperties = useMemo(() => {
    return properties.filter(isRentListing);
  }, [properties]);

  const discoverProperties = useMemo(() => {
    const heroIds = new Set(
      heroProperties.map(getPropertyKey)
    );

    return properties
      .filter(
        (property) =>
          !heroIds.has(getPropertyKey(property))
      )
      .slice(0, 6);
  }, [properties, heroProperties]);

  const newProperties = useMemo(() => {
    const used = new Set([
      ...heroProperties.map(getPropertyKey),
      ...discoverProperties.map(getPropertyKey),
    ]);

    const unused = properties.filter(
      (property) =>
        !used.has(getPropertyKey(property))
    );

    if (unused.length > 0) {
      return unused.slice(0, 6);
    }

    return properties.slice(0, 6);
  }, [
    properties,
    heroProperties,
    discoverProperties,
  ]);

  /*
   * Real location names + listing counts.
   */
  const locationStats = useMemo(() => {
    const counts = new Map<string, number>();

    properties.forEach((property) => {
      const location =
        deriveBrowseLocation(property);

      if (!location) return;

      counts.set(
        location,
        (counts.get(location) || 0) + 1
      );
    });

    return Array.from(counts.entries())
      .map(([name, count]) => ({
        name,
        count,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  }, [properties]);

  /*
   * ============================================
   * PRICE
   * ============================================
   */

  const formatPrice = (
    priceIdr: number,
    rentalType?: string | null
  ) => {
    const price = Number(priceIdr || 0);

    if (!price || price <= 0) {
      return t.priceOnRequest;
    }

    let result: string;

    if (currency === "IDR") {
      result = `IDR ${Math.round(
        price
      ).toLocaleString("en-US")}`;
    } else {
      const converted =
        price * currencyRates[currency];

      result = `≈ ${currency} ${Math.round(
        converted
      ).toLocaleString("en-US")}`;
    }

    const rental = String(
      rentalType || ""
    ).toLowerCase();

    if (
      rental.includes("month") ||
      rental.includes("bulan")
    ) {
      result +=
        language === "id" ? " /bln" : " /mo";
    }

    if (
      rental.includes("year") ||
      rental.includes("annual") ||
      rental.includes("tahun")
    ) {
      result +=
        language === "id" ? " /thn" : " /yr";
    }

    if (
      rental.includes("daily") ||
      rental.includes("hari")
    ) {
      result +=
        language === "id" ? " /hari" : " /day";
    }

    return result;
  };

  /*
   * ============================================
   * NAVIGATION
   * ============================================
   */

  const goSearch = (
    params?: Record<string, string>
  ) => {
    const query = new URLSearchParams();

    Object.entries(params || {}).forEach(
      ([key, value]) => {
        if (value.trim()) {
          query.set(key, value.trim());
        }
      }
    );

    const queryString = query.toString();

    router.push(
      queryString
        ? (`/search?${queryString}` as any)
        : ("/search" as any)
    );
  };

  const submitSearch = () => {
    const query = searchInput.trim();

    if (!query) {
      goSearch();
      return;
    }

    goSearch({
      query,
    });
  };

  const goDetails = (
    property: Listing,
    schedule = false
  ) => {
    const key = encodeURIComponent(
      property.slug || property.id
    );

    router.push(
      `/properti/${key}${
        schedule ? "?schedule=1" : ""
      }` as any
    );
  };

  const goNotifications = () => {
    router.push(
      "/dashboard/notifications" as any
    );
  };

  const openScorpioAssist = () => {
    router.push("/scorpio-assist" as any);
  };

  /*
   * ============================================
   * WHATSAPP
   * ============================================
   */

  const openWhatsapp = (property: Listing) => {
    const phone =
      normalizeWhatsappPhone(
        property.contactPhone
      ) || TETAMO_FALLBACK_WHATSAPP;

    if (!phone) return;

    const title = getPropertyTitle(
      property,
      language
    );

    const receiver =
      property.contactName || "Tetamo";

    const message =
      language === "id"
        ? `Halo ${receiver}, saya tertarik dengan properti ini di TETAMO.

Properti: ${title}
Kode: ${property.kode || "-"}
Lokasi: ${property.location || "-"}
Harga: ${formatPrice(
            property.priceIdr,
            property.rentalType
          )}

Apakah properti ini masih tersedia?`
        : `Hello ${receiver}, I'm interested in this property on TETAMO.

Property: ${title}
Code: ${property.kode || "-"}
Location: ${property.location || "-"}
Price: ${formatPrice(
            property.priceIdr,
            property.rentalType
          )}

Is this property still available?`;

    void Linking.openURL(
      `https://wa.me/${phone}?text=${encodeURIComponent(
        message
      )}`
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ===================================
            HEADER
        =================================== */}

        <View style={styles.header}>
          <View style={styles.brandRow}>
            <View style={styles.logoBox}>
              <Image
                source={tetamoLogo}
                style={styles.logoImage}
                resizeMode="cover"
              />
            </View>

            <View style={styles.brandCopy}>
              <Text style={styles.brandText}>
                TETAMO
              </Text>

              <Text style={styles.brandSub}>
                {t.subtitle}
              </Text>
            </View>
          </View>

          <View style={styles.headerRight}>
            <Pressable
              style={styles.indonesiaButton}
              onPress={() =>
                goSearch({
                  query: "Indonesia",
                })
              }
            >
              <MapPin
                color={GOLD_DARK}
                size={12}
              />

              <Text
                style={styles.indonesiaText}
              >
                Indonesia
              </Text>
            </Pressable>

            <Pressable
              style={styles.notificationButton}
              onPress={goNotifications}
            >
              <Bell
                color={BLACK}
                size={18}
              />

              {unreadNotificationCount > 0 ? (
                <View
                  style={styles.notificationBadge}
                >
                  <Text
                    style={
                      styles.notificationBadgeText
                    }
                  >
                    {formatUnreadCount(
                      unreadNotificationCount
                    )}
                  </Text>
                </View>
              ) : null}
            </Pressable>
          </View>
        </View>

        {/* ===================================
            LANGUAGE + CURRENCY
        =================================== */}

        <View style={styles.utilityBar}>
          <View style={styles.languageControl}>
            <Languages
              color={GOLD_DARK}
              size={16}
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
                    styles.languageButton,
                    active &&
                      styles.utilityActive,
                  ]}
                  onPress={() =>
                    setLanguage(item)
                  }
                >
                  <Text
                    style={[
                      styles.utilityText,
                      active &&
                        styles.utilityTextActive,
                    ]}
                  >
                    {item.toUpperCase()}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.utilityDivider} />

          <View style={styles.currencyControl}>
            <BadgeDollarSign
              color={GOLD_DARK}
              size={16}
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
                    styles.currencyButton,
                    active &&
                      styles.utilityActive,
                  ]}
                  onPress={() =>
                    setCurrency(item)
                  }
                >
                  <Text
                    style={[
                      styles.currencyText,
                      active &&
                        styles.utilityTextActive,
                    ]}
                  >
                    {item}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* ===================================
            SEARCH
        =================================== */}

        <View style={styles.searchRow}>
          <View style={styles.searchBox}>
            <Search
              color={GOLD_DARK}
              size={19}
            />

            <TextInput
              value={searchInput}
              onChangeText={setSearchInput}
              placeholder={t.search}
              placeholderTextColor="#99938A"
              style={styles.searchInput}
              returnKeyType="search"
              onSubmitEditing={submitSearch}
            />
          </View>

          <Pressable
            style={styles.filterButton}
            onPress={() => goSearch()}
          >
            <SlidersHorizontal
              color={BLACK}
              size={19}
            />
          </Pressable>
        </View>

        {/* ===================================
            SALE / RENT
        =================================== */}

        <View style={styles.quickRow}>
          <Pressable
            style={styles.saleButton}
            onPress={() =>
              goSearch({
                listingType: "sale",
              })
            }
          >
            <Home
              color={WHITE}
              size={16}
            />

            <Text style={styles.saleButtonText}>
              {t.sale}
            </Text>
          </Pressable>

          <Pressable
            style={styles.rentButton}
            onPress={() =>
              goSearch({
                listingType: "rent",
              })
            }
          >
            <KeyRound
              color={BLACK}
              size={16}
            />

            <Text style={styles.rentButtonText}>
              {t.rent}
            </Text>
          </Pressable>
        </View>

        {/* ===================================
            LOADING / EMPTY
        =================================== */}

        {loading ? (
          <View style={styles.loadingState}>
            <ActivityIndicator
              color={GOLD_DARK}
            />

            <Text style={styles.loadingText}>
              {t.loading}
            </Text>
          </View>
        ) : null}

        {!loading &&
        properties.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Building2
                color={GOLD_DARK}
                size={25}
              />
            </View>

            <Text style={styles.emptyText}>
              {t.empty}
            </Text>
          </View>
        ) : null}

        {/* ===================================
            FEATURED DISCOVERY
        =================================== */}

        {!loading &&
        heroProperties.length > 0 ? (
          <>
            <SectionHeader
              title={t.featured}
              action={t.seeAll}
              onPress={() => goSearch()}
            />

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              snapToInterval={
                heroCardWidth + 12
              }
              decelerationRate="fast"
              contentContainerStyle={
                styles.heroScroll
              }
              onMomentumScrollEnd={(event) => {
                const next = Math.round(
                  event.nativeEvent.contentOffset.x /
                    (heroCardWidth + 12)
                );

                setHeroIndex(
                  Math.max(
                    0,
                    Math.min(
                      next,
                      heroProperties.length - 1
                    )
                  )
                );
              }}
            >
              {heroProperties.map(
                (property) => (
                  <FeaturedCard
                    key={getPropertyKey(property)}
                    property={property}
                    width={heroCardWidth}
                    language={language}
                    formatPrice={formatPrice}
                    whatsappLabel={t.whatsapp}
                    viewingLabel={t.viewing}
                    onPress={() =>
                      goDetails(property)
                    }
                    onWhatsapp={() =>
                      openWhatsapp(property)
                    }
                    onViewing={() =>
                      goDetails(property, true)
                    }
                  />
                )
              )}
            </ScrollView>

            {heroProperties.length > 1 ? (
              <View style={styles.dots}>
                {heroProperties.map(
                  (_, index) => (
                    <View
                      key={index}
                      style={[
                        styles.dot,
                        index === heroIndex &&
                          styles.activeDot,
                      ]}
                    />
                  )
                )}
              </View>
            ) : (
              <View
                style={styles.heroBottomSpacing}
              />
            )}
          </>
        ) : null}

        {/* ===================================
            EXPLORE INDONESIA
        =================================== */}

        {!loading &&
        locationStats.length > 0 ? (
          <>
            <SectionHeader
              title={t.discoverIndonesia}
            />

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={
                styles.locationScroll
              }
            >
              {locationStats.map(
                (location) => (
                  <Pressable
                    key={location.name}
                    style={styles.locationCard}
                    onPress={() =>
                      goSearch({
                        area: location.name,
                      })
                    }
                  >
                    <View
                      style={styles.locationIcon}
                    >
                      <MapPin
                        color={GOLD_DARK}
                        size={17}
                      />
                    </View>

                    <Text
                      style={styles.locationTitle}
                      numberOfLines={1}
                    >
                      {location.name}
                    </Text>

                    <Text
                      style={styles.locationCount}
                    >
                      {location.count}{" "}
                      {t.properties}
                    </Text>
                  </Pressable>
                )
              )}
            </ScrollView>
          </>
        ) : null}

        {/* ===================================
            DISCOVER PROPERTIES
        =================================== */}

        {!loading &&
        discoverProperties.length > 0 ? (
          <>
            <SectionHeader
              title={t.discover}
              action={t.seeAll}
              onPress={() => goSearch()}
            />

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={
                styles.propertyScroll
              }
            >
              {discoverProperties.map(
                (property) => (
                  <DiscoveryCard
                    key={getPropertyKey(property)}
                    property={property}
                    language={language}
                    formatPrice={formatPrice}
                    onPress={() =>
                      goDetails(property)
                    }
                  />
                )
              )}
            </ScrollView>
          </>
        ) : null}

        {/* ===================================
            BROWSE BY GOAL
        =================================== */}

        {!loading &&
        properties.length > 0 ? (
          <>
            <SectionHeader
              title={t.browseByGoal}
            />

            <View style={styles.goalStack}>
              <Pressable
                style={styles.goalCard}
                onPress={() =>
                  goSearch({
                    listingType: "sale",
                  })
                }
              >
                <View style={styles.goalGoldIcon}>
                  <Home
                    color={BLACK}
                    size={21}
                  />
                </View>

                <View style={styles.goalCopy}>
                  <Text style={styles.goalTitle}>
                    {t.saleTitle}
                  </Text>

                  <Text
                    style={styles.goalDescription}
                    numberOfLines={2}
                  >
                    {t.saleSub}
                  </Text>

                </View>

                <ChevronRight
                  color={GOLD_DARK}
                  size={18}
                />
              </Pressable>

              <Pressable
                style={styles.goalCard}
                onPress={() =>
                  goSearch({
                    listingType: "rent",
                  })
                }
              >
                <View style={styles.goalSoftIcon}>
                  <KeyRound
                    color={BLACK}
                    size={21}
                  />
                </View>

                <View style={styles.goalCopy}>
                  <Text style={styles.goalTitle}>
                    {t.rentTitle}
                  </Text>

                  <Text
                    style={styles.goalDescription}
                    numberOfLines={2}
                  >
                    {t.rentSub}
                  </Text>

                </View>

                <ChevronRight
                  color={GOLD_DARK}
                  size={18}
                />
              </Pressable>
            </View>
          </>
        ) : null}

        {/* ===================================
            TETAMO BRAND SECTION
        =================================== */}

        {!loading &&
        properties.length > 0 ? (
          <View style={styles.trustPanel}>
            <Text style={styles.trustEyebrow}>
              TETAMO
            </Text>

            <Text style={styles.trustTitle}>
              {t.trustTitle}
            </Text>

            <View style={styles.trustItems}>
              <TrustItem
                icon={
                  <MessageCircle
                    color={GOLD}
                    size={17}
                  />
                }
                label={t.directWhatsapp}
              />

              <TrustItem
                icon={
                  <CalendarDays
                    color={GOLD}
                    size={17}
                  />
                }
                label={t.scheduleViewing}
              />

              <TrustItem
                icon={
                  <Languages
                    color={GOLD}
                    size={17}
                  />
                }
                label={t.bilingualListings}
              />
            </View>
          </View>
        ) : null}

        {/* ===================================
            NEW ON TETAMO
        =================================== */}

        {!loading &&
        newProperties.length > 0 ? (
          <>
            <SectionHeader
              title={t.newOnTetamo}
              action={t.seeAll}
              onPress={() => goSearch()}
            />

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={
                styles.propertyScroll
              }
            >
              {newProperties.map(
                (property) => (
                  <DiscoveryCard
                    key={`new-${getPropertyKey(
                      property
                    )}`}
                    property={property}
                    language={language}
                    formatPrice={formatPrice}
                    onPress={() =>
                      goDetails(property)
                    }
                  />
                )
              )}
            </ScrollView>
          </>
        ) : null}

        {/* ===================================
            PROPERTY TYPE EXPLORER
        =================================== */}

        {!loading &&
        properties.length > 0 ? (
          <>
            <SectionHeader
              title={
                language === "id"
                  ? "Jelajahi Berdasarkan Tipe Properti"
                  : "Explore by Property Type"
              }
            />

            <View style={styles.propertyTypeGrid}>
              <Pressable
                style={styles.propertyTypeCard}
                onPress={() =>
                  goSearch({
                    query: "House",
                  })
                }
              >
                <View style={styles.propertyTypeIcon}>
                  <Home
                    color={GOLD_DARK}
                    size={21}
                  />
                </View>

                <View style={styles.propertyTypeCopy}>
                  <Text style={styles.propertyTypeTitle}>
                    {language === "id"
                      ? "Rumah"
                      : "House"}
                  </Text>

                  <Text style={styles.propertyTypeSub}>
                    {language === "id"
                      ? "Cari rumah"
                      : "Explore houses"}
                  </Text>
                </View>

                <ChevronRight
                  color={GOLD_DARK}
                  size={15}
                />
              </Pressable>

              <Pressable
                style={styles.propertyTypeCard}
                onPress={() =>
                  goSearch({
                    query: "Villa",
                  })
                }
              >
                <View style={styles.propertyTypeIcon}>
                  <Home
                    color={GOLD_DARK}
                    size={21}
                  />
                </View>

                <View style={styles.propertyTypeCopy}>
                  <Text style={styles.propertyTypeTitle}>
                    Villa
                  </Text>

                  <Text style={styles.propertyTypeSub}>
                    {language === "id"
                      ? "Cari villa"
                      : "Explore villas"}
                  </Text>
                </View>

                <ChevronRight
                  color={GOLD_DARK}
                  size={15}
                />
              </Pressable>

              <Pressable
                style={styles.propertyTypeCard}
                onPress={() =>
                  goSearch({
                    query: "Apartment",
                  })
                }
              >
                <View style={styles.propertyTypeIcon}>
                  <Building2
                    color={GOLD_DARK}
                    size={21}
                  />
                </View>

                <View style={styles.propertyTypeCopy}>
                  <Text style={styles.propertyTypeTitle}>
                    {language === "id"
                      ? "Apartemen"
                      : "Apartment"}
                  </Text>

                  <Text style={styles.propertyTypeSub}>
                    {language === "id"
                      ? "Cari apartemen"
                      : "Explore apartments"}
                  </Text>
                </View>

                <ChevronRight
                  color={GOLD_DARK}
                  size={15}
                />
              </Pressable>

              <Pressable
                style={styles.propertyTypeCard}
                onPress={() =>
                  goSearch({
                    query: "Land",
                  })
                }
              >
                <View style={styles.propertyTypeIcon}>
                  <MapPin
                    color={GOLD_DARK}
                    size={21}
                  />
                </View>

                <View style={styles.propertyTypeCopy}>
                  <Text style={styles.propertyTypeTitle}>
                    {language === "id"
                      ? "Tanah"
                      : "Land"}
                  </Text>

                  <Text style={styles.propertyTypeSub}>
                    {language === "id"
                      ? "Cari tanah"
                      : "Explore land"}
                  </Text>
                </View>

                <ChevronRight
                  color={GOLD_DARK}
                  size={15}
                />
              </Pressable>
            </View>
          </>
        ) : null}

        {/* ===================================
            ENTER FULL PROPERTY MARKETPLACE
        =================================== */}

        {!loading &&
        properties.length > 0 ? (
          <Pressable
            style={styles.exploreButton}
            onPress={() =>
              router.push("/property" as any)
            }
          >
            <Text
              style={styles.exploreButtonText}
            >
              {t.exploreAll}
            </Text>

            <ChevronRight
              color={WHITE}
              size={17}
            />
          </Pressable>
        ) : null}

        <View style={styles.partnerPromoCard}>
          <Image
            source={tetamoPartnerIcon}
            style={styles.partnerPromoIcon}
            resizeMode="cover"
          />

          <View style={styles.partnerPromoCopy}>
            <Text style={styles.partnerPromoEyebrow}>
              TETAMO PARTNER
            </Text>

            <Text style={styles.partnerPromoTitle}>
              {language === "id"
                ? "Ingin pasang iklan properti?"
                : "Want to list your property?"}
            </Text>

            <Text style={styles.partnerPromoDescription}>
              {language === "id"
                ? "Download Tetamo Partner di iOS dan Android untuk memasang dan mengelola listing properti Anda."
                : "Download Tetamo Partner on iOS and Android to post and manage your property listings."}
            </Text>

            <View style={styles.partnerPlatformRow}>
              <View style={styles.partnerPlatformPill}>
                <Text style={styles.partnerPlatformText}>
                  iOS
                </Text>
              </View>

              <View style={styles.partnerPlatformPill}>
                <Text style={styles.partnerPlatformText}>
                  Android
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* ===================================
          SCORPIO ASSIST
      =================================== */}

      <Pressable
        style={styles.scorpioButton}
        onPress={openScorpioAssist}
        accessibilityLabel="Scorpio Assist"
      >
        <Sparkles
          color={BLACK}
          size={18}
        />
      </Pressable>
    </SafeAreaView>
  );
}

/*
 * ==================================================
 * FEATURED PROPERTY CARD
 * ==================================================
 */

function FeaturedCard({
  property,
  width,
  language,
  formatPrice,
  whatsappLabel,
  viewingLabel,
  onPress,
  onWhatsapp,
  onViewing,
}: {
  property: Listing;
  width: number;
  language: Language;
  formatPrice: (
    price: number,
    rentalType?: string | null
  ) => string;
  whatsappLabel: string;
  viewingLabel: string;
  onPress: () => void;
  onWhatsapp: () => void;
  onViewing: () => void;
}) {
  const promotion =
    getPromotionBadge(property);

  return (
    <Pressable
      style={[
        styles.featuredCard,
        {
          width,
        },
      ]}
      onPress={onPress}
    >
      <View style={styles.featuredImageWrap}>
        <PropertyImage
          uri={property.image}
          style={styles.featuredImage}
        />

        {/* LEFT BADGES */}
        <View style={styles.featuredBadges}>
          <ListingTypeBadge
            property={property}
            language={language}
          />

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

        {/* HEART — NO COUNT */}
        <View style={styles.featuredHeart}>
          <Heart
            color={BLACK}
            size={17}
            strokeWidth={2}
          />
        </View>

        {/* TETAMO BRANDING */}
        <ImageBrand large />
      </View>

      <View style={styles.featuredBody}>
        <Text
          style={styles.featuredPrice}
          numberOfLines={1}
        >
          {formatPrice(
            property.priceIdr,
            property.rentalType
          )}
        </Text>

        <Text
          style={styles.featuredTitle}
          numberOfLines={2}
        >
          {getPropertyTitle(
            property,
            language
          )}
        </Text>

        <View style={styles.propertyLocationRow}>
          <MapPin
            color={GOLD_DARK}
            size={13}
          />

          <Text
            style={styles.featuredLocation}
            numberOfLines={1}
          >
            {property.location ||
              property.area ||
              "-"}
          </Text>
        </View>

        <PropertyMeta
          property={property}
        />

        <View style={styles.featuredActions}>
          <Pressable
            style={styles.whatsappButton}
            onPress={(event) => {
              event.stopPropagation();
              onWhatsapp();
            }}
          >
            <MessageCircle
              color="#14834B"
              size={15}
            />

            <Text
              style={styles.whatsappText}
            >
              {whatsappLabel}
            </Text>
          </Pressable>

          <Pressable
            style={styles.viewingButton}
            onPress={(event) => {
              event.stopPropagation();
              onViewing();
            }}
          >
            <CalendarDays
              color={BLACK}
              size={15}
            />

            <Text
              style={styles.viewingText}
            >
              {viewingLabel}
            </Text>
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
}

/*
 * ==================================================
 * DISCOVERY CARD
 * ==================================================
 */

function DiscoveryCard({
  property,
  language,
  formatPrice,
  onPress,
}: {
  property: Listing;
  language: Language;
  formatPrice: (
    price: number,
    rentalType?: string | null
  ) => string;
  onPress: () => void;
}) {
  const promotion =
    getPromotionBadge(property);

  return (
    <Pressable
      style={styles.discoveryCard}
      onPress={onPress}
    >
      <View style={styles.discoveryImageWrap}>
        <PropertyImage
          uri={property.image}
          style={styles.discoveryImage}
        />

        {promotion ? (
          <View
            style={[
              styles.discoveryPromotionBadge,
              {
                backgroundColor:
                  promotion.background,
              },
            ]}
          >
            <Text
              style={[
                styles.discoveryPromotionText,
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

        {/* HEART */}
        <View style={styles.discoveryHeart}>
          <Heart
            color={BLACK}
            size={15}
            strokeWidth={2}
          />
        </View>

        {/* TETAMO BRAND */}
        <ImageBrand />
      </View>

      <View style={styles.discoveryBody}>
        <Text
          style={styles.discoveryPrice}
          numberOfLines={1}
        >
          {formatPrice(
            property.priceIdr,
            property.rentalType
          )}
        </Text>

        <Text
          style={styles.discoveryTitle}
          numberOfLines={2}
        >
          {getPropertyTitle(
            property,
            language
          )}
        </Text>

        <View style={styles.discoveryLocationRow}>
          <MapPin
            color={GOLD_DARK}
            size={11}
          />

          <Text
            style={styles.discoveryLocation}
            numberOfLines={1}
          >
            {property.location ||
              property.area ||
              "-"}
          </Text>
        </View>

        <PropertyMeta
          property={property}
          compact
        />
      </View>
    </Pressable>
  );
}

/*
 * ==================================================
 * IMAGE BRANDING
 * ==================================================
 */

function ImageBrand({
  large = false,
}: {
  large?: boolean;
}) {
  return (
    <View
      style={[
        styles.imageBrand,
        large && styles.imageBrandLarge,
      ]}
    >
      <Image
        source={tetamoLogo}
        resizeMode="cover"
        style={[
          styles.imageBrandLogo,
          large &&
            styles.imageBrandLogoLarge,
        ]}
      />

      <Text
        style={[
          styles.imageBrandText,
          large &&
            styles.imageBrandTextLarge,
        ]}
      >
        TETAMO
      </Text>
    </View>
  );
}

/*
 * ==================================================
 * LISTING TYPE
 * ==================================================
 */

function ListingTypeBadge({
  property,
  language,
}: {
  property: Listing;
  language: Language;
}) {
  const rent = isRentListing(property);

  return (
    <View style={styles.typeBadge}>
      <Text style={styles.typeBadgeText}>
        {rent
          ? language === "id"
            ? "Disewakan"
            : "For Rent"
          : language === "id"
            ? "Dijual"
            : "For Sale"}
      </Text>
    </View>
  );
}

/*
 * ==================================================
 * PROPERTY META
 * ==================================================
 */

function PropertyMeta({
  property,
  compact = false,
}: {
  property: Listing;
  compact?: boolean;
}) {
  const beds = Number(property.beds || 0);
  const baths = Number(property.baths || 0);
  const size = Number(property.size || 0);

  if (!beds && !baths && !size) {
    return null;
  }

  return (
    <View
      style={[
        styles.metaRow,
        compact && styles.metaRowCompact,
      ]}
    >
      {beds > 0 ? (
        <View style={styles.metaItem}>
          <BedDouble
            color={GOLD_DARK}
            size={compact ? 12 : 14}
          />

          <Text
            style={[
              styles.metaText,
              compact &&
                styles.metaTextCompact,
            ]}
          >
            {beds}
          </Text>
        </View>
      ) : null}

      {baths > 0 ? (
        <View style={styles.metaItem}>
          <Bath
            color={GOLD_DARK}
            size={compact ? 12 : 14}
          />

          <Text
            style={[
              styles.metaText,
              compact &&
                styles.metaTextCompact,
            ]}
          >
            {baths}
          </Text>
        </View>
      ) : null}

      {size > 0 ? (
        <View style={styles.metaItem}>
          <Ruler
            color={GOLD_DARK}
            size={compact ? 12 : 14}
          />

          <Text
            style={[
              styles.metaText,
              compact &&
                styles.metaTextCompact,
            ]}
          >
            {size} m²
          </Text>
        </View>
      ) : null}
    </View>
  );
}

/*
 * ==================================================
 * TRUST ITEM
 * ==================================================
 */

function TrustItem({
  icon,
  label,
}: {
  icon: ReactNode;
  label: string;
}) {
  return (
    <View style={styles.trustItem}>
      <View style={styles.trustIcon}>
        {icon}
      </View>

      <Text style={styles.trustItemText}>
        {label}
      </Text>
    </View>
  );
}

/*
 * ==================================================
 * SECTION HEADER
 * ==================================================
 */

function SectionHeader({
  title,
  action,
  onPress,
}: {
  title: string;
  action?: string;
  onPress?: () => void;
}) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>
        {title}
      </Text>

      {action ? (
        <Pressable
          style={styles.seeAll}
          onPress={onPress}
        >
          <Text style={styles.seeAllText}>
            {action}
          </Text>

          <ChevronRight
            color={GOLD_DARK}
            size={14}
          />
        </Pressable>
      ) : null}
    </View>
  );
}

/*
 * ==================================================
 * REMOTE IMAGE
 * ==================================================
 */

function PropertyImage({
  uri,
  style,
}: {
  uri?: string;
  style: StyleProp<ImageStyle>;
}) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [uri]);

  if (!uri || failed) {
    return (
      <View
        style={[
          style as StyleProp<ViewStyle>,
          styles.imageFallback,
        ]}
      >
        <Building2
          color="#C4BDB3"
          size={30}
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
      style={style}
      resizeMode="cover"
      fadeDuration={100}
      onError={() => setFailed(true)}
    />
  );
}

/*
 * ==================================================
 * HELPERS
 * ==================================================
 */

function getPropertyKey(property: Listing) {
  return String(
    property.id ||
      property.slug ||
      property.kode
  );
}

function getPropertyTitle(
  property: Listing,
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

function isRentListing(property: Listing) {
  const listingType = String(
    property.listingType || ""
  ).toLowerCase();

  const rentalType = String(
    property.rentalType || ""
  ).toLowerCase();

  return (
    listingType.includes("rent") ||
    listingType.includes("sewa") ||
    rentalType.length > 0
  );
}

function isSaleListing(property: Listing) {
  const listingType = String(
    property.listingType || ""
  ).toLowerCase();

  if (
    listingType.includes("sale") ||
    listingType.includes("sell") ||
    listingType.includes("jual")
  ) {
    return true;
  }

  return !isRentListing(property);
}

function getPromotionPriority(
  property: Listing
) {
  const badge = String(
    property.badge || ""
  ).toLowerCase();

  if (badge.includes("spotlight")) {
    return 3;
  }

  if (badge.includes("featured")) {
    return 2;
  }

  if (badge.includes("boost")) {
    return 1;
  }

  return 0;
}

function getPromotionBadge(
  property: Listing
):
  | {
      label: string;
      background: string;
      textColor: string;
    }
  | null {
  const badge = String(
    property.badge || ""
  ).toLowerCase();

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

function deriveBrowseLocation(
  property: Listing
) {
  const area = String(
    property.area || ""
  ).trim();

  const location = String(
    property.location || ""
  ).trim();

  const looksLikePropertyTitle = (
    value: string
  ) =>
    /villa|house|rumah|land|tanah|kavling|residence|residences|cluster|apartment|apartemen|hotel|building|gedung|ruko|project|proyek|perumahan/i.test(
      value
    );

  if (
    area &&
    area.length <= 24 &&
    !looksLikePropertyTitle(area)
  ) {
    return area;
  }

  const segments = location
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  for (const segment of segments) {
    if (
      segment.length <= 24 &&
      !looksLikePropertyTitle(segment)
    ) {
      return segment;
    }
  }

  return "";
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

function formatUnreadCount(value: number) {
  if (value > 99) {
    return "99+";
  }

  return String(value);
}

/*
 * ==================================================
 * STYLES
 * ==================================================
 */

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: CREAM,
  },

  scroll: {
    flex: 1,
    backgroundColor: CREAM,
  },

  content: {
    paddingHorizontal: 18,
    paddingTop: 9,
    paddingBottom: 40,
  },

  /*
   * HEADER
   */

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 11,
  },

  brandRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },

  logoBox: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: WHITE,
    borderWidth: 1,
    borderColor: BORDER,
  },

  logoImage: {
    width: 32,
    height: 32,
  },

  brandCopy: {
    flexShrink: 1,
  },

  brandText: {
    color: BLACK,
    fontSize: 19,
    fontWeight: "900",
    letterSpacing: 3.5,
  },

  brandSub: {
    marginTop: 1,
    color: MUTED,
    fontSize: 9.5,
    fontWeight: "500",
    letterSpacing: 0.35,
  },

  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  indonesiaButton: {
    height: 37,
    paddingHorizontal: 9,
    borderRadius: 999,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: WHITE,
    borderWidth: 1,
    borderColor: BORDER,
  },

  indonesiaText: {
    color: BLACK,
    fontSize: 9.5,
    fontWeight: "800",
  },

  notificationButton: {
    width: 37,
    height: 37,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: WHITE,
    borderWidth: 1,
    borderColor: BORDER,
  },

  notificationBadge: {
    position: "absolute",
    top: -3,
    right: -3,
    minWidth: 16,
    height: 16,
    borderRadius: 999,
    paddingHorizontal: 3,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: GOLD,
    borderWidth: 1.5,
    borderColor: CREAM,
  },

  notificationBadgeText: {
    color: BLACK,
    fontSize: 7.5,
    fontWeight: "900",
  },

  /*
   * LANGUAGE / CURRENCY
   */

  utilityBar: {
    minHeight: 42,
    marginBottom: 12,
    paddingHorizontal: 7,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: WHITE,
    borderWidth: 1,
    borderColor: BORDER,
  },

  languageControl: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  currencyControl: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },

  utilityDivider: {
    width: 1,
    height: 22,
    marginHorizontal: 7,
    backgroundColor: "#E6DFD5",
  },

  languageButton: {
    width: 36,
    height: 28,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },

  currencyButton: {
    flex: 1,
    height: 28,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },

  utilityActive: {
    backgroundColor: "#F0D889",
  },

  utilityText: {
    color: "#938D84",
    fontSize: 9.5,
    fontWeight: "800",
  },

  currencyText: {
    color: "#938D84",
    fontSize: 8.7,
    fontWeight: "800",
  },

  utilityTextActive: {
    color: BLACK,
    fontWeight: "900",
  },

  /*
   * SEARCH
   */

  searchRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 10,
  },

  searchBox: {
    flex: 1,
    height: 51,
    paddingHorizontal: 14,
    borderRadius: 17,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    backgroundColor: WHITE,
    borderWidth: 1,
    borderColor: "#DDD6CB",
  },

  searchInput: {
    flex: 1,
    paddingVertical: 0,
    color: BLACK,
    fontSize: 12.5,
    fontWeight: "500",
  },

  filterButton: {
    width: 51,
    height: 51,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F0D889",
    borderWidth: 1,
    borderColor: "#DFC566",
  },

  /*
   * QUICK SEARCH
   */

  quickRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 23,
  },

  saleButton: {
    flex: 1,
    height: 40,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: BLACK,
  },

  saleButtonText: {
    color: WHITE,
    fontSize: 11,
    fontWeight: "800",
  },

  rentButton: {
    flex: 1,
    height: 40,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: WHITE,
    borderWidth: 1,
    borderColor: BORDER,
  },

  rentButtonText: {
    color: BLACK,
    fontSize: 11,
    fontWeight: "800",
  },

  /*
   * STATES
   */

  loadingState: {
    minHeight: 150,
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
  },

  loadingText: {
    color: MUTED,
    fontSize: 11,
    fontWeight: "600",
  },

  emptyState: {
    minHeight: 170,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    gap: 11,
    padding: 20,
    backgroundColor: WHITE,
    borderWidth: 1,
    borderColor: BORDER,
  },

  emptyIcon: {
    width: 48,
    height: 48,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: GOLD_SOFT,
  },

  emptyText: {
    color: MUTED,
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
  },

  /*
   * SECTION HEADER
   */

  sectionHeader: {
    marginTop: 3,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  sectionTitle: {
    flex: 1,
    color: BLACK,
    fontSize: 17,
    lineHeight: 21,
    fontWeight: "900",
    letterSpacing: -0.3,
  },

  seeAll: {
    marginLeft: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },

  seeAllText: {
    color: GOLD_DARK,
    fontSize: 10,
    fontWeight: "800",
  },

  /*
   * HERO
   */

  heroScroll: {
    paddingRight: 18,
    gap: 12,
  },

  featuredCard: {
    overflow: "hidden",
    borderRadius: 22,
    backgroundColor: WHITE,
    borderWidth: 1,
    borderColor: BORDER,
  },

  featuredImageWrap: {
    height: 184,
    position: "relative",
    backgroundColor: "#EEEAE3",
  },

  featuredImage: {
    width: "100%",
    height: "100%",
  },

  featuredBadges: {
    position: "absolute",
    top: 10,
    left: 10,
    flexDirection: "row",
    gap: 5,
  },

  typeBadge: {
    minHeight: 24,
    paddingHorizontal: 9,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: BLACK,
  },

  typeBadgeText: {
    color: WHITE,
    fontSize: 8,
    fontWeight: "900",
  },

  promotionBadge: {
    minHeight: 24,
    paddingHorizontal: 9,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },

  promotionBadgeText: {
    fontSize: 8,
    fontWeight: "900",
  },

  featuredHeart: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 33,
    height: 33,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.95)",
  },

  /*
   * IMAGE BRAND
   */

  imageBrand: {
    position: "absolute",
    left: 8,
    bottom: 8,
    height: 23,
    paddingLeft: 4,
    paddingRight: 7,
    borderRadius: 999,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(17,17,17,0.80)",
  },

  imageBrandLarge: {
    left: 10,
    bottom: 10,
    height: 27,
    paddingLeft: 5,
    paddingRight: 9,
    gap: 5,
  },

  imageBrandLogo: {
    width: 15,
    height: 15,
  },

  imageBrandLogoLarge: {
    width: 18,
    height: 18,
  },

  imageBrandText: {
    color: WHITE,
    fontSize: 6.8,
    fontWeight: "900",
    letterSpacing: 0.8,
  },

  imageBrandTextLarge: {
    fontSize: 8,
    letterSpacing: 1,
  },

  featuredBody: {
    padding: 13,
  },

  featuredPrice: {
    color: BLACK,
    fontSize: 16,
    lineHeight: 20,
    fontWeight: "900",
    letterSpacing: -0.15,
  },

  featuredTitle: {
    marginTop: 4,
    color: "#292622",
    fontSize: 13.5,
    lineHeight: 18,
    fontWeight: "800",
  },

  propertyLocationRow: {
    marginTop: 7,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  featuredLocation: {
    flex: 1,
    color: MUTED,
    fontSize: 10.5,
    fontWeight: "600",
  },

  featuredActions: {
    marginTop: 11,
    flexDirection: "row",
    gap: 7,
  },

  whatsappButton: {
    flex: 1,
    height: 38,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    backgroundColor: "#F2FAF4",
    borderWidth: 1,
    borderColor: "#D4E9DB",
  },

  whatsappText: {
    color: "#175B32",
    fontSize: 10,
    fontWeight: "800",
  },

  viewingButton: {
    flex: 1,
    height: 38,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    backgroundColor: "#F0D889",
  },

  viewingText: {
    color: BLACK,
    fontSize: 10,
    fontWeight: "800",
  },

  dots: {
    height: 31,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
  },

  dot: {
    width: 5,
    height: 5,
    borderRadius: 999,
    backgroundColor: "#D7D1C7",
  },

  activeDot: {
    width: 19,
    backgroundColor: GOLD,
  },

  heroBottomSpacing: {
    height: 18,
  },

  /*
   * LOCATION
   */

  locationScroll: {
    paddingRight: 18,
    gap: 9,
    marginBottom: 23,
  },

  locationCard: {
    width: 125,
    minHeight: 92,
    padding: 11,
    borderRadius: 18,
    backgroundColor: WHITE,
    borderWidth: 1,
    borderColor: BORDER,
  },

  locationIcon: {
    width: 31,
    height: 31,
    marginBottom: 9,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: GOLD_SOFT,
  },

  locationTitle: {
    color: BLACK,
    fontSize: 11.5,
    fontWeight: "900",
  },

  locationCount: {
    marginTop: 3,
    color: MUTED,
    fontSize: 8.7,
    fontWeight: "600",
  },

  /*
   * DISCOVERY CARDS
   */

  propertyScroll: {
    paddingRight: 18,
    gap: 10,
    marginBottom: 23,
  },

  discoveryCard: {
    width: 218,
    overflow: "hidden",
    borderRadius: 18,
    backgroundColor: WHITE,
    borderWidth: 1,
    borderColor: BORDER,
  },

  discoveryImageWrap: {
    height: 126,
    position: "relative",
    backgroundColor: "#EEEAE3",
  },

  discoveryImage: {
    width: "100%",
    height: "100%",
  },

  discoveryPromotionBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    minHeight: 21,
    paddingHorizontal: 7,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },

  discoveryPromotionText: {
    fontSize: 7,
    fontWeight: "900",
  },

  discoveryHeart: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 29,
    height: 29,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.95)",
  },

  discoveryBody: {
    padding: 10,
  },

  discoveryPrice: {
    color: BLACK,
    fontSize: 12.5,
    fontWeight: "900",
  },

  discoveryTitle: {
    marginTop: 4,
    minHeight: 31,
    color: "#302D29",
    fontSize: 11,
    lineHeight: 15.5,
    fontWeight: "800",
  },

  discoveryLocationRow: {
    marginTop: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },

  discoveryLocation: {
    flex: 1,
    color: MUTED,
    fontSize: 9,
    fontWeight: "600",
  },

  /*
   * META
   */

  metaRow: {
    marginTop: 9,
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 12,
  },

  metaRowCompact: {
    marginTop: 8,
    gap: 9,
  },

  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },

  metaText: {
    color: "#59544D",
    fontSize: 10,
    fontWeight: "700",
  },

  metaTextCompact: {
    fontSize: 8.7,
  },

  /*
   * BROWSE BY GOAL
   */

  goalStack: {
    gap: 8,
    marginBottom: 23,
  },

  goalCard: {
    minHeight: 91,
    padding: 12,
    borderRadius: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    backgroundColor: WHITE,
    borderWidth: 1,
    borderColor: BORDER,
  },

  goalGoldIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F0D889",
  },

  goalSoftIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: SOFT,
  },

  goalCopy: {
    flex: 1,
  },

  goalTitle: {
    color: BLACK,
    fontSize: 12.5,
    fontWeight: "900",
  },

  goalDescription: {
    marginTop: 3,
    color: MUTED,
    fontSize: 9.5,
    lineHeight: 13.5,
    fontWeight: "600",
  },

  goalCount: {
    marginTop: 5,
    color: GOLD_DARK,
    fontSize: 9,
    fontWeight: "800",
  },

  /*
   * TETAMO TRUST / BRAND PANEL
   */

  trustPanel: {
    marginBottom: 24,
    padding: 16,
    borderRadius: 22,
    backgroundColor: BLACK,
  },

  trustEyebrow: {
    color: GOLD,
    fontSize: 8.5,
    fontWeight: "900",
    letterSpacing: 1.8,
  },

  trustTitle: {
    marginTop: 5,
    color: WHITE,
    fontSize: 16,
    lineHeight: 21,
    fontWeight: "900",
  },

  trustItems: {
    marginTop: 14,
    gap: 8,
  },

  trustItem: {
    minHeight: 41,
    paddingHorizontal: 10,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#1A1A1A",
    borderWidth: 1,
    borderColor: "#292929",
  },

  trustIcon: {
    width: 27,
    alignItems: "center",
  },

  trustItemText: {
    color: "#F5F5F5",
    fontSize: 10.5,
    fontWeight: "700",
  },

  /*
   * PROPERTY TYPE EXPLORER
   */

  propertyTypeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 9,
    marginBottom: 24,
  },

  propertyTypeCard: {
    width: "48.6%",
    minHeight: 88,
    paddingHorizontal: 11,
    paddingVertical: 12,
    borderRadius: 17,
    backgroundColor: WHITE,
    borderWidth: 1,
    borderColor: BORDER,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  propertyTypeIcon: {
    width: 37,
    height: 37,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: GOLD_SOFT,
  },

  propertyTypeCopy: {
    flex: 1,
    minWidth: 0,
  },

  propertyTypeTitle: {
    color: BLACK,
    fontSize: 11.5,
    fontWeight: "900",
  },

  propertyTypeSub: {
    marginTop: 3,
    color: MUTED,
    fontSize: 8.5,
    lineHeight: 11.5,
    fontWeight: "600",
  },

  /*
   * EXPLORE MARKETPLACE
   */

  exploreButton: {
    height: 49,
    marginBottom: 10,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    backgroundColor: BLACK,
  },

  exploreButtonText: {
    color: WHITE,
    fontSize: 11.5,
    fontWeight: "800",
  },

  /*
   * TETAMO PARTNER
   */

  partnerPromoCard: {
    marginTop: 8,
    marginBottom: 22,
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: WHITE,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },

  partnerPromoIcon: {
    width: 72,
    height: 72,
    borderRadius: 18,
  },

  partnerPromoCopy: {
    flex: 1,
  },

  partnerPromoEyebrow: {
    color: GOLD_DARK,
    fontSize: 8.5,
    fontWeight: "900",
    letterSpacing: 1.1,
  },

  partnerPromoTitle: {
    marginTop: 5,
    color: BLACK,
    fontSize: 14,
    lineHeight: 18,
    fontWeight: "900",
  },

  partnerPromoDescription: {
    marginTop: 5,
    color: MUTED,
    fontSize: 9.5,
    lineHeight: 14,
    fontWeight: "600",
  },

  partnerPlatformRow: {
    marginTop: 10,
    flexDirection: "row",
    gap: 7,
  },

  partnerPlatformPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: SOFT,
    borderWidth: 1,
    borderColor: BORDER,
  },

  partnerPlatformText: {
    color: BLACK,
    fontSize: 8.5,
    fontWeight: "800",
  },

  /*
   * IMAGE FALLBACK
   */

  imageFallback: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EEEAE3",
  },

  /*
   * SCORPIO
   */

  scorpioButton: {
    position: "absolute",

    right: 16,

    /*
     * TetamoFooter sits below it.
     * This avoids covering Viewing/buttons.
     */
    bottom: 96,

    zIndex: 50,

    width: 43,
    height: 43,
    borderRadius: 999,

    alignItems: "center",
    justifyContent: "center",

    backgroundColor: "#F0D889",

    borderWidth: 2,
    borderColor: "#FFF8E8",

    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.12,
    shadowRadius: 8,

    elevation: 5,
  },
});
