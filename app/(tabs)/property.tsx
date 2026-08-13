import {
  useLocalSearchParams,
  useRouter,
} from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
  BadgeDollarSign,
  Bath,
  BedDouble,
  Bell,
  Building2,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  Heart,
  Languages,
  MapPin,
  MessageCircle,
  RotateCcw,
  Ruler,
  Search,
  SlidersHorizontal,
} from "lucide-react-native";
import {
  useEffect,
  useMemo,
  useState,
} from "react";
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
  View,
} from "react-native";

import { supabase } from "../../lib/supabase";
import {
  fetchHomepageProperties,
  type TetamoProperty,
} from "../../services/properties";

type Language = "en" | "id";
type Currency = "IDR" | "USD" | "AUD";

type ViewMode =
  | "all"
  | "sale"
  | "rent";

type SortMode =
  | "recommended"
  | "newest"
  | "price-low"
  | "price-high";

type PriceFilter =
  | "any"
  | "under1b"
  | "1to3b"
  | "3to10b"
  | "10bplus";

const tetamoLogo = require(
  "../../assets/images/tetamo-logo.png"
);

const BLACK = "#111111";
const WHITE = "#FFFFFF";
const CREAM = "#FBFAF7";

const GOLD = "#D8B46A";
const GOLD_DARK = "#B8892E";
const GOLD_SOFT = "#F3E7C5";

const BORDER = "#E9E2D8";
const MUTED = "#777169";
const SOFT = "#F5F1EA";

const INITIAL_VISIBLE = 12;
const LOAD_MORE_COUNT = 10;

const TETAMO_FALLBACK_WHATSAPP =
  process.env
    .EXPO_PUBLIC_TETAMO_FALLBACK_WHATSAPP ||
  "";

/*
 * Display conversion only for now.
 * We can connect this to real FX later.
 */
const currencyRates: Record<
  Currency,
  number
> = {
  IDR: 1,
  USD: 0.000061,
  AUD: 0.000094,
};

const copy = {
  en: {
    subtitle: "Property Marketplace",

    marketplace: "Properties",
    marketplaceSub:
      "Explore properties across Indonesia",

    search:
      "Search location, property or keyword...",

    all: "All",
    sale: "For Sale",
    rent: "For Rent",

    filter: "Filters",
    propertyType: "Property Type",
    location: "Location",
    bedrooms: "Bedrooms",
    price: "Price",

    any: "Any",
    clear: "Clear",

    recommended: "Recommended",
    newest: "Newest",
    priceLow: "Price ↑",
    priceHigh: "Price ↓",

    result: "property",
    results: "properties",

    whatsapp: "WhatsApp",
    viewing: "Viewing",

    loadMore: "Load more properties",

    emptyTitle: "No properties found",
    emptySub:
      "Try changing your search or filters.",

    loading: "Loading marketplace...",

    priceRequest: "Price on request",

    bed1: "1+ Bed",
    bed2: "2+ Beds",
    bed3: "3+ Beds",
    bed4: "4+ Beds",

    under1b: "Under 1B",
    oneToThree: "1B – 3B",
    threeToTen: "3B – 10B",
    tenPlus: "10B+",
  },

  id: {
    subtitle: "Properti Marketplace",

    marketplace: "Properti",
    marketplaceSub:
      "Jelajahi properti di seluruh Indonesia",

    search:
      "Cari lokasi, properti atau kata kunci...",

    all: "Semua",
    sale: "Dijual",
    rent: "Disewakan",

    filter: "Filter",
    propertyType: "Tipe Properti",
    location: "Lokasi",
    bedrooms: "Kamar Tidur",
    price: "Harga",

    any: "Semua",
    clear: "Reset",

    recommended: "Rekomendasi",
    newest: "Terbaru",
    priceLow: "Harga ↑",
    priceHigh: "Harga ↓",

    result: "properti",
    results: "properti",

    whatsapp: "WhatsApp",
    viewing: "Viewing",

    loadMore: "Tampilkan lebih banyak",

    emptyTitle: "Properti tidak ditemukan",
    emptySub:
      "Coba ubah pencarian atau filter Anda.",

    loading: "Memuat marketplace...",

    priceRequest: "Hubungi untuk harga",

    bed1: "1+ KT",
    bed2: "2+ KT",
    bed3: "3+ KT",
    bed4: "4+ KT",

    under1b: "Di bawah 1M",
    oneToThree: "1M – 3M",
    threeToTen: "3M – 10M",
    tenPlus: "10M+",
  },
};

export default function PropertyScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const [language, setLanguage] =
    useState<Language>("en");

  const [currency, setCurrency] =
    useState<Currency>("IDR");

  const [properties, setProperties] =
    useState<TetamoProperty[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [searchInput, setSearchInput] =
    useState("");

  const [viewMode, setViewMode] =
    useState<ViewMode>("all");

  const [sortMode, setSortMode] =
    useState<SortMode>("recommended");

  const [
    selectedPropertyType,
    setSelectedPropertyType,
  ] = useState("");

  const [
    selectedLocation,
    setSelectedLocation,
  ] = useState("");

  const [minimumBeds, setMinimumBeds] =
    useState(0);

  const [priceFilter, setPriceFilter] =
    useState<PriceFilter>("any");

  const [
    showAdvancedFilters,
    setShowAdvancedFilters,
  ] = useState(false);

  const [visibleLimit, setVisibleLimit] =
    useState(INITIAL_VISIBLE);

  const [
    unreadNotificationCount,
    setUnreadNotificationCount,
  ] = useState(0);

  const t = copy[language];

  /*
   * ========================================
   * ROUTE PARAMS
   * ========================================
   */

  useEffect(() => {
    const value =
      typeof params.listingType ===
      "string"
        ? params.listingType
        : "";

    if (value === "sale") {
      setViewMode("sale");
      return;
    }

    if (value === "rent") {
      setViewMode("rent");
      return;
    }

    setViewMode("all");
  }, [params.listingType]);

  /*
   * ========================================
   * REAL MARKETPLACE DATA
   * ========================================
   */

  useEffect(() => {
    let mounted = true;

    async function loadMarketplace() {
      try {
        setLoading(true);

        const rows =
          await fetchHomepageProperties(
            100
          );

        if (!mounted) return;

        const realProperties =
          Array.isArray(rows)
            ? rows
            : [];

        setProperties(realProperties);

        /*
         * Only preload the first photos.
         * Avoid loading the entire marketplace
         * into memory immediately.
         */
        realProperties
          .slice(0, 16)
          .map(
            (property) =>
              property.image
          )
          .filter(Boolean)
          .forEach((uri) => {
            if (!uri) return;

            void Image.prefetch(
              uri
            ).catch(() => {});
          });
      } catch (error) {
        console.log(
          "Tetamo property marketplace error:",
          error
        );

        if (!mounted) return;

        /*
         * No fabricated fallback property.
         */
        setProperties([]);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    void loadMarketplace();

    return () => {
      mounted = false;
    };
  }, []);

  /*
   * ========================================
   * NOTIFICATIONS
   * ========================================
   */

  useEffect(() => {
    let mounted = true;

    async function loadNotifications() {
      const {
        data: { user },
      } =
        await supabase.auth.getUser();

      if (!mounted) return;

      if (!user?.id) {
        setUnreadNotificationCount(
          0
        );

        return;
      }

      const { count, error } =
        await supabase
          .from("notifications")
          .select("id", {
            count: "exact",
            head: true,
          })
          .eq("user_id", user.id)
          .is("read_at", null);

      if (!mounted) return;

      if (error) {
        setUnreadNotificationCount(
          0
        );

        return;
      }

      setUnreadNotificationCount(
        count || 0
      );
    }

    void loadNotifications();

    const interval = setInterval(
      () => {
        void loadNotifications();
      },
      60000
    );

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  /*
   * ========================================
   * DYNAMIC FILTER OPTIONS
   * ========================================
   */

  const propertyTypes = useMemo(() => {
    const values = properties
      .map((property) =>
        String(
          property.propertyType || ""
        ).trim()
      )
      .filter(Boolean);

    return Array.from(
      new Set(values)
    ).slice(0, 12);
  }, [properties]);

  const locations = useMemo(() => {
    const values = properties
      .map(deriveBrowseLocation)
      .filter(Boolean);

    return Array.from(
      new Set(values)
    ).slice(0, 14);
  }, [properties]);

  /*
   * ========================================
   * COUNTS
   * ========================================
   */

  const saleCount = useMemo(
    () =>
      properties.filter(
        isSaleProperty
      ).length,
    [properties]
  );

  const rentCount = useMemo(
    () =>
      properties.filter(
        isRentProperty
      ).length,
    [properties]
  );

  /*
   * ========================================
   * FILTER + RANK
   * ========================================
   */

  const filteredProperties =
    useMemo(() => {
      const search =
        normalizeValue(searchInput);

      const originalIndex =
        new Map<string, number>();

      properties.forEach(
        (property, index) => {
          originalIndex.set(
            getPropertyKey(property),
            index
          );
        }
      );

      let rows = properties.filter(
        (property) => {
          /*
           * SALE / RENT
           */
          if (
            viewMode === "sale" &&
            !isSaleProperty(property)
          ) {
            return false;
          }

          if (
            viewMode === "rent" &&
            !isRentProperty(property)
          ) {
            return false;
          }

          /*
           * TEXT SEARCH
           */
          if (search) {
            const searchable =
              normalizeValue(
                [
                  property.titleEn,
                  property.titleId,
                  property.location,
                  property.area,
                  property.city,
                  property.province,
                  property.propertyType,
                  property.kode,
                ]
                  .filter(Boolean)
                  .join(" ")
              );

            if (
              !searchable.includes(search)
            ) {
              return false;
            }
          }

          /*
           * PROPERTY TYPE
           */
          if (
            selectedPropertyType &&
            normalizeValue(
              property.propertyType
            ) !==
              normalizeValue(
                selectedPropertyType
              )
          ) {
            return false;
          }

          /*
           * LOCATION
           */
          if (selectedLocation) {
            const propertyLocation =
              normalizeValue(
                [
                  property.location,
                  property.area,
                  property.city,
                  property.province,
                ]
                  .filter(Boolean)
                  .join(" ")
              );

            if (
              !propertyLocation.includes(
                normalizeValue(
                  selectedLocation
                )
              )
            ) {
              return false;
            }
          }

          /*
           * BEDROOMS
           */
          if (
            minimumBeds > 0 &&
            Number(
              property.beds || 0
            ) < minimumBeds
          ) {
            return false;
          }

          /*
           * PRICE
           * Always filters raw IDR.
           */
          const price = Number(
            property.priceIdr || 0
          );

          if (
            priceFilter ===
              "under1b" &&
            price >= 1_000_000_000
          ) {
            return false;
          }

          if (
            priceFilter ===
              "1to3b" &&
            (price <
              1_000_000_000 ||
              price >
                3_000_000_000)
          ) {
            return false;
          }

          if (
            priceFilter ===
              "3to10b" &&
            (price <
              3_000_000_000 ||
              price >
                10_000_000_000)
          ) {
            return false;
          }

          if (
            priceFilter ===
              "10bplus" &&
            price <
              10_000_000_000
          ) {
            return false;
          }

          return true;
        }
      );

      /*
       * SORTING
       */

      if (
        sortMode ===
        "recommended"
      ) {
        rows = [...rows].sort(
          (a, b) => {
            const promotionDifference =
              getPromotionPriority(b) -
              getPromotionPriority(a);

            if (
              promotionDifference !== 0
            ) {
              return promotionDifference;
            }

            return (
              (originalIndex.get(
                getPropertyKey(a)
              ) ?? 999999) -
              (originalIndex.get(
                getPropertyKey(b)
              ) ?? 999999)
            );
          }
        );
      }

      if (sortMode === "newest") {
        rows = [...rows].sort(
          (a, b) =>
            (originalIndex.get(
              getPropertyKey(a)
            ) ?? 999999) -
            (originalIndex.get(
              getPropertyKey(b)
            ) ?? 999999)
        );
      }

      if (
        sortMode === "price-low"
      ) {
        rows = [...rows].sort(
          (a, b) =>
            Number(
              a.priceIdr || 0
            ) -
            Number(
              b.priceIdr || 0
            )
        );
      }

      if (
        sortMode === "price-high"
      ) {
        rows = [...rows].sort(
          (a, b) =>
            Number(
              b.priceIdr || 0
            ) -
            Number(
              a.priceIdr || 0
            )
        );
      }

      return rows;
    }, [
      properties,
      searchInput,
      viewMode,
      selectedPropertyType,
      selectedLocation,
      minimumBeds,
      priceFilter,
      sortMode,
    ]);

  const visibleProperties =
    filteredProperties.slice(
      0,
      visibleLimit
    );

  /*
   * Reset pagination whenever
   * search/filter changes.
   */
  useEffect(() => {
    setVisibleLimit(
      INITIAL_VISIBLE
    );
  }, [
    searchInput,
    viewMode,
    selectedPropertyType,
    selectedLocation,
    minimumBeds,
    priceFilter,
    sortMode,
  ]);

  /*
   * ========================================
   * ACTIVE FILTER COUNT
   * ========================================
   */

  const activeFilterCount =
    [
      selectedPropertyType,
      selectedLocation,
      minimumBeds > 0
        ? String(minimumBeds)
        : "",
      priceFilter !== "any"
        ? priceFilter
        : "",
    ].filter(Boolean).length;

  /*
   * ========================================
   * PRICE
   * ========================================
   */

  const formatPrice = (
    priceIdr: number,
    rentalType?: string | null
  ) => {
    const price =
      Number(priceIdr || 0);

    if (!price || price <= 0) {
      return t.priceRequest;
    }

    let output: string;

    if (currency === "IDR") {
      output = `IDR ${Math.round(
        price
      ).toLocaleString(
        "en-US"
      )}`;
    } else {
      const converted =
        price *
        currencyRates[currency];

      output = `≈ ${currency} ${Math.round(
        converted
      ).toLocaleString(
        "en-US"
      )}`;
    }

    const rentalTypeValue =
      normalizeValue(
        rentalType
      );

    if (
      rentalTypeValue.includes(
        "monthly"
      ) ||
      rentalTypeValue.includes(
        "bulanan"
      )
    ) {
      output +=
        language === "id"
          ? " /bln"
          : " /mo";
    }

    if (
      rentalTypeValue.includes(
        "yearly"
      ) ||
      rentalTypeValue.includes(
        "annual"
      ) ||
      rentalTypeValue.includes(
        "tahunan"
      )
    ) {
      output +=
        language === "id"
          ? " /thn"
          : " /yr";
    }

    if (
      rentalTypeValue.includes(
        "daily"
      ) ||
      rentalTypeValue.includes(
        "harian"
      )
    ) {
      output +=
        language === "id"
          ? " /hari"
          : " /day";
    }

    return output;
  };

  /*
   * ========================================
   * ACTIONS
   * ========================================
   */

  const goDetails = (
    property: TetamoProperty,
    schedule = false
  ) => {
    const key =
      encodeURIComponent(
        property.slug ||
          property.id
      );

    router.push(
      `/properti/${key}${
        schedule
          ? "?schedule=1"
          : ""
      }` as any
    );
  };

  const goNotifications = () => {
    router.push(
      "/dashboard/notifications" as any
    );
  };

  const openWhatsapp = (
    property: TetamoProperty
  ) => {
    const phone =
      normalizeWhatsappPhone(
        property.contactPhone
      ) ||
      TETAMO_FALLBACK_WHATSAPP;

    if (!phone) return;

    const title =
      getPropertyTitle(
        property,
        language
      );

    const receiverName =
      property.contactName ||
      "Tetamo";

    const message =
      language === "id"
        ? `Halo ${receiverName}, saya tertarik dengan properti ini di TETAMO.

Properti: ${title}
Kode: ${property.kode || "-"}
Lokasi: ${property.location || "-"}
Harga: ${formatPrice(
            property.priceIdr,
            property.rentalType
          )}

Apakah properti ini masih tersedia?`
        : `Hello ${receiverName}, I'm interested in this property on TETAMO.

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

  const clearFilters = () => {
    setSelectedPropertyType(
      ""
    );
    setSelectedLocation("");
    setMinimumBeds(0);
    setPriceFilter("any");
  };

  /*
   * ========================================
   * SCREEN
   * ========================================
   */

  return (
    <SafeAreaView
      style={styles.safeArea}
    >
      <StatusBar style="dark" />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={
          styles.content
        }
        showsVerticalScrollIndicator={
          false
        }
        keyboardShouldPersistTaps="handled"
      >
        {/* ==================================
            HEADER
        ================================== */}

        <View style={styles.header}>
          <View style={styles.brandRow}>
            <View
              style={styles.logoBox}
            >
              <Image
                source={tetamoLogo}
                style={
                  styles.logoImage
                }
                resizeMode="contain"
              />
            </View>

            <View
              style={styles.brandCopy}
            >
              <Text
                style={
                  styles.brandText
                }
              >
                TETAMO
              </Text>

              <Text
                style={
                  styles.brandSub
                }
              >
                {t.subtitle}
              </Text>
            </View>
          </View>

          <View
            style={
              styles.headerRight
            }
          >
            <Pressable
              style={
                styles.indonesiaButton
              }
              onPress={() =>
                setSelectedLocation(
                  ""
                )
              }
            >
              <MapPin
                color={GOLD_DARK}
                size={12}
              />

              <Text
                style={
                  styles.indonesiaText
                }
              >
                Indonesia
              </Text>

              <ChevronDown
                color={GOLD_DARK}
                size={12}
              />
            </Pressable>

            <Pressable
              style={
                styles.notificationButton
              }
              onPress={
                goNotifications
              }
            >
              <Bell
                color={BLACK}
                size={18}
              />

              {unreadNotificationCount >
              0 ? (
                <View
                  style={
                    styles.notificationBadge
                  }
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

        {/* ==================================
            LANGUAGE / CURRENCY
        ================================== */}

        <View
          style={styles.utilityBar}
        >
          <View
            style={
              styles.languageControl
            }
          >
            <Languages
              color={GOLD_DARK}
              size={16}
            />

            {(
              [
                "en",
                "id",
              ] as Language[]
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
                    setLanguage(
                      item
                    )
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

          <View
            style={
              styles.utilityDivider
            }
          />

          <View
            style={
              styles.currencyControl
            }
          >
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
                    setCurrency(
                      item
                    )
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

        {/* ==================================
            MARKETPLACE TITLE
        ================================== */}

        <View
          style={
            styles.marketplaceHeading
          }
        >
          <Text
            style={
              styles.marketplaceTitle
            }
          >
            {t.marketplace}
          </Text>

          <Text
            style={
              styles.marketplaceSub
            }
          >
            {t.marketplaceSub}
          </Text>
        </View>

        {/* ==================================
            SEARCH
        ================================== */}

        <View
          style={styles.searchRow}
        >
          <View
            style={styles.searchBox}
          >
            <Search
              color={GOLD_DARK}
              size={19}
            />

            <TextInput
              value={searchInput}
              onChangeText={
                setSearchInput
              }
              placeholder={t.search}
              placeholderTextColor="#99938A"
              style={
                styles.searchInput
              }
            />
          </View>

          <Pressable
            style={[
              styles.filterButton,
              showAdvancedFilters &&
                styles.filterButtonOpen,
            ]}
            onPress={() =>
              setShowAdvancedFilters(
                (value) => !value
              )
            }
          >
            <SlidersHorizontal
              color={BLACK}
              size={19}
            />

            {activeFilterCount >
            0 ? (
              <View
                style={
                  styles.filterCountBadge
                }
              >
                <Text
                  style={
                    styles.filterCountText
                  }
                >
                  {activeFilterCount}
                </Text>
              </View>
            ) : null}
          </Pressable>
        </View>

        {/* ==================================
            ALL / SALE / RENT
        ================================== */}

        <View
          style={styles.modeTabs}
        >
          <ModeTab
            label={t.all}
            count={properties.length}
            active={
              viewMode === "all"
            }
            onPress={() =>
              setViewMode("all")
            }
          />

          <ModeTab
            label={t.sale}
            count={saleCount}
            active={
              viewMode === "sale"
            }
            onPress={() =>
              setViewMode("sale")
            }
          />

          <ModeTab
            label={t.rent}
            count={rentCount}
            active={
              viewMode === "rent"
            }
            onPress={() =>
              setViewMode("rent")
            }
          />
        </View>

        {/* ==================================
            FILTER PANEL
        ================================== */}

        {showAdvancedFilters ? (
          <View
            style={
              styles.filterPanel
            }
          >
            <View
              style={
                styles.filterPanelHeader
              }
            >
              <Text
                style={
                  styles.filterPanelTitle
                }
              >
                {t.filter}
              </Text>

              {activeFilterCount >
              0 ? (
                <Pressable
                  style={
                    styles.clearFilterButton
                  }
                  onPress={
                    clearFilters
                  }
                >
                  <RotateCcw
                    color={
                      GOLD_DARK
                    }
                    size={13}
                  />

                  <Text
                    style={
                      styles.clearFilterText
                    }
                  >
                    {t.clear}
                  </Text>
                </Pressable>
              ) : null}
            </View>

            {/* PROPERTY TYPE */}

            {propertyTypes.length >
            0 ? (
              <FilterSection
                title={
                  t.propertyType
                }
              >
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={
                    false
                  }
                  contentContainerStyle={
                    styles.filterChipRow
                  }
                >
                  <FilterChip
                    label={t.any}
                    active={
                      !selectedPropertyType
                    }
                    onPress={() =>
                      setSelectedPropertyType(
                        ""
                      )
                    }
                  />

                  {propertyTypes.map(
                    (type) => (
                      <FilterChip
                        key={type}
                        label={type}
                        active={
                          selectedPropertyType ===
                          type
                        }
                        onPress={() =>
                          setSelectedPropertyType(
                            type
                          )
                        }
                      />
                    )
                  )}
                </ScrollView>
              </FilterSection>
            ) : null}

            {/* LOCATION */}

            {locations.length > 0 ? (
              <FilterSection
                title={t.location}
              >
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={
                    false
                  }
                  contentContainerStyle={
                    styles.filterChipRow
                  }
                >
                  <FilterChip
                    label={t.any}
                    active={
                      !selectedLocation
                    }
                    onPress={() =>
                      setSelectedLocation(
                        ""
                      )
                    }
                  />

                  {locations.map(
                    (location) => (
                      <FilterChip
                        key={
                          location
                        }
                        label={
                          location
                        }
                        active={
                          selectedLocation ===
                          location
                        }
                        onPress={() =>
                          setSelectedLocation(
                            location
                          )
                        }
                      />
                    )
                  )}
                </ScrollView>
              </FilterSection>
            ) : null}

            {/* BEDROOMS */}

            <FilterSection
              title={t.bedrooms}
            >
              <View
                style={
                  styles.filterChipWrap
                }
              >
                <FilterChip
                  label={t.any}
                  active={
                    minimumBeds === 0
                  }
                  onPress={() =>
                    setMinimumBeds(0)
                  }
                />

                <FilterChip
                  label={t.bed1}
                  active={
                    minimumBeds === 1
                  }
                  onPress={() =>
                    setMinimumBeds(1)
                  }
                />

                <FilterChip
                  label={t.bed2}
                  active={
                    minimumBeds === 2
                  }
                  onPress={() =>
                    setMinimumBeds(2)
                  }
                />

                <FilterChip
                  label={t.bed3}
                  active={
                    minimumBeds === 3
                  }
                  onPress={() =>
                    setMinimumBeds(3)
                  }
                />

                <FilterChip
                  label={t.bed4}
                  active={
                    minimumBeds === 4
                  }
                  onPress={() =>
                    setMinimumBeds(4)
                  }
                />
              </View>
            </FilterSection>

            {/* PRICE */}

            <FilterSection
              title={t.price}
              last
            >
              <View
                style={
                  styles.filterChipWrap
                }
              >
                <FilterChip
                  label={t.any}
                  active={
                    priceFilter ===
                    "any"
                  }
                  onPress={() =>
                    setPriceFilter(
                      "any"
                    )
                  }
                />

                <FilterChip
                  label={
                    t.under1b
                  }
                  active={
                    priceFilter ===
                    "under1b"
                  }
                  onPress={() =>
                    setPriceFilter(
                      "under1b"
                    )
                  }
                />

                <FilterChip
                  label={
                    t.oneToThree
                  }
                  active={
                    priceFilter ===
                    "1to3b"
                  }
                  onPress={() =>
                    setPriceFilter(
                      "1to3b"
                    )
                  }
                />

                <FilterChip
                  label={
                    t.threeToTen
                  }
                  active={
                    priceFilter ===
                    "3to10b"
                  }
                  onPress={() =>
                    setPriceFilter(
                      "3to10b"
                    )
                  }
                />

                <FilterChip
                  label={t.tenPlus}
                  active={
                    priceFilter ===
                    "10bplus"
                  }
                  onPress={() =>
                    setPriceFilter(
                      "10bplus"
                    )
                  }
                />
              </View>
            </FilterSection>
          </View>
        ) : null}

        {/* ==================================
            RESULT + SORT
        ================================== */}

        {!loading ? (
          <>
            <View
              style={
                styles.resultsHeader
              }
            >
              <View>
                <Text
                  style={
                    styles.resultCount
                  }
                >
                  {
                    filteredProperties.length
                  }{" "}
                  {filteredProperties.length ===
                  1
                    ? t.result
                    : t.results}
                </Text>

                {activeFilterCount >
                0 ? (
                  <Text
                    style={
                      styles.filteredLabel
                    }
                  >
                    {activeFilterCount}{" "}
                    {t.filter.toLowerCase()}
                  </Text>
                ) : null}
              </View>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={
                false
              }
              contentContainerStyle={
                styles.sortRow
              }
            >
              <SortChip
                label={
                  t.recommended
                }
                active={
                  sortMode ===
                  "recommended"
                }
                onPress={() =>
                  setSortMode(
                    "recommended"
                  )
                }
              />

              <SortChip
                label={t.newest}
                active={
                  sortMode ===
                  "newest"
                }
                onPress={() =>
                  setSortMode(
                    "newest"
                  )
                }
              />

              <SortChip
                label={
                  t.priceLow
                }
                active={
                  sortMode ===
                  "price-low"
                }
                onPress={() =>
                  setSortMode(
                    "price-low"
                  )
                }
              />

              <SortChip
                label={
                  t.priceHigh
                }
                active={
                  sortMode ===
                  "price-high"
                }
                onPress={() =>
                  setSortMode(
                    "price-high"
                  )
                }
              />
            </ScrollView>
          </>
        ) : null}

        {/* ==================================
            LOADING
        ================================== */}

        {loading ? (
          <View
            style={
              styles.loadingState
            }
          >
            <ActivityIndicator
              color={GOLD_DARK}
            />

            <Text
              style={
                styles.loadingText
              }
            >
              {t.loading}
            </Text>
          </View>
        ) : null}

        {/* ==================================
            PROPERTY FEED
        ================================== */}

        {!loading &&
        visibleProperties.length >
          0 ? (
          <View
            style={
              styles.propertyFeed
            }
          >
            {visibleProperties.map(
              (property) => (
                <MarketplaceCard
                  key={
                    getPropertyKey(
                      property
                    )
                  }
                  property={
                    property
                  }
                  language={
                    language
                  }
                  formatPrice={
                    formatPrice
                  }
                  whatsappLabel={
                    t.whatsapp
                  }
                  viewingLabel={
                    t.viewing
                  }
                  onPress={() =>
                    goDetails(
                      property
                    )
                  }
                  onWhatsapp={() =>
                    openWhatsapp(
                      property
                    )
                  }
                  onViewing={() =>
                    goDetails(
                      property,
                      true
                    )
                  }
                />
              )
            )}
          </View>
        ) : null}

        {/* ==================================
            EMPTY
        ================================== */}

        {!loading &&
        filteredProperties.length ===
          0 ? (
          <View
            style={styles.emptyState}
          >
            <View
              style={
                styles.emptyIcon
              }
            >
              <Building2
                color={GOLD_DARK}
                size={26}
              />
            </View>

            <Text
              style={
                styles.emptyTitle
              }
            >
              {t.emptyTitle}
            </Text>

            <Text
              style={styles.emptySub}
            >
              {t.emptySub}
            </Text>

            <Pressable
              style={
                styles.emptyReset
              }
              onPress={() => {
                setSearchInput("");
                setViewMode("all");
                clearFilters();
              }}
            >
              <RotateCcw
                color={BLACK}
                size={14}
              />

              <Text
                style={
                  styles.emptyResetText
                }
              >
                {t.clear}
              </Text>
            </Pressable>
          </View>
        ) : null}

        {/* ==================================
            LOAD MORE
        ================================== */}

        {!loading &&
        visibleLimit <
          filteredProperties.length ? (
          <Pressable
            style={
              styles.loadMoreButton
            }
            onPress={() =>
              setVisibleLimit(
                (value) =>
                  value +
                  LOAD_MORE_COUNT
              )
            }
          >
            <Text
              style={
                styles.loadMoreText
              }
            >
              {t.loadMore}
            </Text>

            <ChevronRight
              color={WHITE}
              size={16}
            />
          </Pressable>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

/*
 * ========================================
 * MODE TAB
 * ========================================
 */

function ModeTab({
  label,
  count,
  active,
  onPress,
}: {
  label: string;
  count: number;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={[
        styles.modeTab,
        active &&
          styles.modeTabActive,
      ]}
      onPress={onPress}
    >
      <Text
        style={[
          styles.modeTabText,
          active &&
            styles.modeTabTextActive,
        ]}
      >
        {label}
      </Text>

      <View
        style={[
          styles.modeCount,
          active &&
            styles.modeCountActive,
        ]}
      >
        <Text
          style={[
            styles.modeCountText,
            active &&
              styles.modeCountTextActive,
          ]}
        >
          {count}
        </Text>
      </View>
    </Pressable>
  );
}

/*
 * ========================================
 * FILTER SECTION
 * ========================================
 */

function FilterSection({
  title,
  children,
  last = false,
}: {
  title: string;
  children: React.ReactNode;
  last?: boolean;
}) {
  return (
    <View
      style={[
        styles.filterSection,
        last &&
          styles.filterSectionLast,
      ]}
    >
      <Text
        style={
          styles.filterSectionTitle
        }
      >
        {title}
      </Text>

      {children}
    </View>
  );
}

/*
 * ========================================
 * FILTER CHIP
 * ========================================
 */

function FilterChip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={[
        styles.filterChip,
        active &&
          styles.filterChipActive,
      ]}
      onPress={onPress}
    >
      <Text
        style={[
          styles.filterChipText,
          active &&
            styles.filterChipTextActive,
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </Pressable>
  );
}

/*
 * ========================================
 * SORT CHIP
 * ========================================
 */

function SortChip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={[
        styles.sortChip,
        active &&
          styles.sortChipActive,
      ]}
      onPress={onPress}
    >
      <Text
        style={[
          styles.sortChipText,
          active &&
            styles.sortChipTextActive,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

/*
 * ========================================
 * MARKETPLACE PROPERTY CARD
 * ========================================
 */

function MarketplaceCard({
  property,
  language,
  formatPrice,
  whatsappLabel,
  viewingLabel,
  onPress,
  onWhatsapp,
  onViewing,
}: {
  property: TetamoProperty;
  language: Language;
  formatPrice: (
    priceIdr: number,
    rentalType?: string | null
  ) => string;
  whatsappLabel: string;
  viewingLabel: string;
  onPress: () => void;
  onWhatsapp: () => void;
  onViewing: () => void;
}) {
  const promotion =
    getPromotionBadge(
      property
    );

  const borderColor =
    getPromotionBorder(
      property
    );

  const rentalBadge =
    getRentalTypeLabel(
      property,
      language
    );

  return (
    <Pressable
      style={[
        styles.marketCard,
        {
          borderColor,
        },
      ]}
      onPress={onPress}
    >
      <View
        style={
          styles.marketImageWrap
        }
      >
        <PropertyImage
          uri={property.image}
          style={
            styles.marketImage
          }
        />

        {/* LEFT BADGES */}
        <View
          style={
            styles.marketBadgeRow
          }
        >
          <ListingTypeBadge
            property={property}
            language={language}
          />

          {rentalBadge ? (
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
                {rentalBadge}
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

        {/* HEART — NO COUNT */}
        <View
          style={
            styles.marketHeart
          }
        >
          <Heart
            color={BLACK}
            size={17}
            strokeWidth={2}
          />
        </View>

        {/* TETAMO COVER BRAND */}
        <ImageBrand />
      </View>

      <View style={styles.marketBody}>
        <Text
          style={
            styles.marketPrice
          }
          numberOfLines={1}
        >
          {formatPrice(
            property.priceIdr,
            property.rentalType
          )}
        </Text>

        <Text
          style={
            styles.marketTitle
          }
          numberOfLines={2}
        >
          {getPropertyTitle(
            property,
            language
          )}
        </Text>

        <View
          style={
            styles.marketLocationRow
          }
        >
          <MapPin
            color={GOLD_DARK}
            size={13}
          />

          <Text
            style={
              styles.marketLocation
            }
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

        <View
          style={
            styles.marketActions
          }
        >
          <Pressable
            style={
              styles.whatsappButton
            }
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
              style={
                styles.whatsappText
              }
            >
              {whatsappLabel}
            </Text>
          </Pressable>

          <Pressable
            style={
              styles.viewingButton
            }
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
              style={
                styles.viewingText
              }
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
 * ========================================
 * LISTING TYPE
 * ========================================
 */

function ListingTypeBadge({
  property,
  language,
}: {
  property: TetamoProperty;
  language: Language;
}) {
  const rent =
    isRentProperty(property);

  return (
    <View
      style={
        styles.listingTypeBadge
      }
    >
      <Text
        style={
          styles.listingTypeBadgeText
        }
      >
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
 * ========================================
 * TETAMO IMAGE BRAND
 * ========================================
 */

function ImageBrand() {
  return (
    <View
      style={styles.imageBrand}
    >
      <Image
        source={tetamoLogo}
        style={
          styles.imageBrandLogo
        }
        resizeMode="contain"
      />

      <Text
        style={
          styles.imageBrandText
        }
      >
        TETAMO
      </Text>
    </View>
  );
}

/*
 * ========================================
 * PROPERTY META
 * ========================================
 */

function PropertyMeta({
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
    property.size || 0
  );

  if (
    !beds &&
    !baths &&
    !size
  ) {
    return null;
  }

  return (
    <View style={styles.metaRow}>
      {beds > 0 ? (
        <View
          style={styles.metaItem}
        >
          <BedDouble
            color={GOLD_DARK}
            size={14}
          />

          <Text
            style={styles.metaText}
          >
            {beds}
          </Text>
        </View>
      ) : null}

      {baths > 0 ? (
        <View
          style={styles.metaItem}
        >
          <Bath
            color={GOLD_DARK}
            size={14}
          />

          <Text
            style={styles.metaText}
          >
            {baths}
          </Text>
        </View>
      ) : null}

      {size > 0 ? (
        <View
          style={styles.metaItem}
        >
          <Ruler
            color={GOLD_DARK}
            size={14}
          />

          <Text
            style={styles.metaText}
          >
            {size} m²
          </Text>
        </View>
      ) : null}
    </View>
  );
}

/*
 * ========================================
 * REMOTE IMAGE
 * ========================================
 */

function PropertyImage({
  uri,
  style,
}: {
  uri?: string;
  style: StyleProp<ImageStyle>;
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
          style as StyleProp<ViewStyle>,
          styles.imageFallback,
        ]}
      >
        <Building2
          color="#C4BDB3"
          size={32}
        />
      </View>
    );
  }

  return (
    <Image
      source={{ uri }}
      style={style}
      resizeMode="cover"
      fadeDuration={100}
      onError={() =>
        setFailed(true)
      }
    />
  );
}

/*
 * ========================================
 * HELPERS
 * ========================================
 */

function normalizeValue(
  value?: string | null
) {
  return String(value || "")
    .toLowerCase()
    .replace(/[_-]/g, " ")
    .trim();
}

function getPropertyKey(
  property: TetamoProperty
) {
  return String(
    property.id ||
      property.slug ||
      property.kode
  );
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

function isSaleProperty(
  property: TetamoProperty
) {
  const value =
    normalizeValue(
      property.listingType
    );

  return (
    value.includes("sale") ||
    value.includes("sell") ||
    value.includes("jual") ||
    value.includes("dijual")
  );
}

function isRentProperty(
  property: TetamoProperty
) {
  const value =
    normalizeValue(
      property.listingType
    );

  const rentalType =
    normalizeValue(
      property.rentalType
    );

  return (
    value.includes("rent") ||
    value.includes("rental") ||
    value.includes("sewa") ||
    value.includes("disewa") ||
    Boolean(rentalType)
  );
}

function getPromotionPriority(
  property: TetamoProperty
) {
  const badge =
    normalizeValue(
      property.badge
    );

  if (
    badge.includes(
      "spotlight"
    )
  ) {
    return 3;
  }

  if (
    badge.includes("featured")
  ) {
    return 2;
  }

  if (
    badge.includes("boost")
  ) {
    return 1;
  }

  return 0;
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
  const badge =
    normalizeValue(
      property.badge
    );

  if (
    badge.includes(
      "spotlight"
    )
  ) {
    return {
      label: "SPOTLIGHT",
      background: "#D8F1F5",
      textColor: "#17616C",
    };
  }

  if (
    badge.includes("featured")
  ) {
    return {
      label: "FEATURED",
      background: "#E5C568",
      textColor: BLACK,
    };
  }

  if (
    badge.includes("boost")
  ) {
    return {
      label: "BOOST",
      background: "#F0C397",
      textColor: "#704014",
    };
  }

  return null;
}

function getPromotionBorder(
  property: TetamoProperty
) {
  const priority =
    getPromotionPriority(
      property
    );

  if (priority === 3) {
    return "#B9E4EA";
  }

  if (priority === 2) {
    return "#DCC477";
  }

  if (priority === 1) {
    return "#EAC5A2";
  }

  return BORDER;
}

function getRentalTypeLabel(
  property: TetamoProperty,
  language: Language
) {
  if (
    !isRentProperty(property)
  ) {
    return "";
  }

  const rental =
    normalizeValue(
      property.rentalType
    );

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

function deriveBrowseLocation(
  property: TetamoProperty
) {
  const candidates = [
    property.area,
    property.city,
    property.province,
  ]
    .map((value) =>
      String(value || "").trim()
    )
    .filter(Boolean);

  for (const candidate of candidates) {
    if (
      candidate.length <= 30 &&
      !looksLikePropertyName(
        candidate
      )
    ) {
      return candidate;
    }
  }

  const locationParts =
    String(
      property.location || ""
    )
      .split(",")
      .map((part) =>
        part.trim()
      )
      .filter(Boolean);

  for (const part of locationParts) {
    if (
      part.length <= 30 &&
      !looksLikePropertyName(
        part
      )
    ) {
      return part;
    }
  }

  return "";
}

function looksLikePropertyName(
  value: string
) {
  return /villa|house|rumah|land|tanah|kavling|residence|residences|cluster|apartment|apartemen|hotel|building|gedung|ruko|project|proyek|perumahan/i.test(
    value
  );
}

function normalizeWhatsappPhone(
  value?: string | null
) {
  const digits = String(
    value || ""
  ).replace(/[^\d]/g, "");

  if (!digits) return "";

  if (
    digits.startsWith("62")
  ) {
    return digits;
  }

  if (
    digits.startsWith("0")
  ) {
    return `62${digits.slice(
      1
    )}`;
  }

  if (
    digits.startsWith("8")
  ) {
    return `62${digits}`;
  }

  return digits;
}

function formatUnreadCount(
  value: number
) {
  if (value > 99) {
    return "99+";
  }

  return String(value);
}

/*
 * ========================================
 * STYLES
 * ========================================
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

    /*
     * Space for TetamoFooter
     */
    paddingBottom: 125,
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
   * UTILITY
   */

  utilityBar: {
    minHeight: 42,

    marginBottom: 18,

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
   * MARKETPLACE TITLE
   */

  marketplaceHeading: {
    marginBottom: 14,
  },

  marketplaceTitle: {
    color: BLACK,

    fontSize: 25,
    lineHeight: 30,

    fontWeight: "900",

    letterSpacing: -0.7,
  },

  marketplaceSub: {
    marginTop: 3,

    color: MUTED,

    fontSize: 11,

    lineHeight: 16,

    fontWeight: "500",
  },

  /*
   * SEARCH
   */

  searchRow: {
    flexDirection: "row",

    gap: 8,

    marginBottom: 11,
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

    fontSize: 12,

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

  filterButtonOpen: {
    backgroundColor: GOLD,
  },

  filterCountBadge: {
    position: "absolute",

    top: -5,
    right: -5,

    minWidth: 18,
    height: 18,

    borderRadius: 999,

    alignItems: "center",
    justifyContent: "center",

    paddingHorizontal: 4,

    backgroundColor: BLACK,

    borderWidth: 1.5,
    borderColor: CREAM,
  },

  filterCountText: {
    color: WHITE,

    fontSize: 8,

    fontWeight: "900",
  },

  /*
   * SALE / RENT TABS
   */

  modeTabs: {
    flexDirection: "row",

    gap: 7,

    marginBottom: 12,
  },

  modeTab: {
    flex: 1,

    minHeight: 43,

    paddingHorizontal: 7,

    borderRadius: 14,

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",

    gap: 5,

    backgroundColor: WHITE,

    borderWidth: 1,
    borderColor: BORDER,
  },

  modeTabActive: {
    backgroundColor: BLACK,

    borderColor: BLACK,
  },

  modeTabText: {
    color: "#5F5A53",

    fontSize: 10,

    fontWeight: "800",
  },

  modeTabTextActive: {
    color: WHITE,
  },

  modeCount: {
    minWidth: 21,
    height: 21,

    paddingHorizontal: 4,

    borderRadius: 999,

    alignItems: "center",
    justifyContent: "center",

    backgroundColor: SOFT,
  },

  modeCountActive: {
    backgroundColor:
      "rgba(255,255,255,0.15)",
  },

  modeCountText: {
    color: MUTED,

    fontSize: 8,

    fontWeight: "900",
  },

  modeCountTextActive: {
    color: GOLD,
  },

  /*
   * FILTER PANEL
   */

  filterPanel: {
    marginBottom: 15,

    padding: 14,

    borderRadius: 20,

    backgroundColor: WHITE,

    borderWidth: 1,
    borderColor: BORDER,
  },

  filterPanelHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",

    marginBottom: 12,
  },

  filterPanelTitle: {
    color: BLACK,

    fontSize: 15,

    fontWeight: "900",
  },

  clearFilterButton: {
    minHeight: 30,

    paddingHorizontal: 9,

    borderRadius: 10,

    flexDirection: "row",
    alignItems: "center",

    gap: 4,

    backgroundColor: GOLD_SOFT,
  },

  clearFilterText: {
    color: GOLD_DARK,

    fontSize: 9,

    fontWeight: "800",
  },

  filterSection: {
    paddingBottom: 13,

    marginBottom: 13,

    borderBottomWidth: 1,

    borderBottomColor: "#EEE8DE",
  },

  filterSectionLast: {
    paddingBottom: 0,

    marginBottom: 0,

    borderBottomWidth: 0,
  },

  filterSectionTitle: {
    marginBottom: 8,

    color: "#4C4842",

    fontSize: 10,

    fontWeight: "900",
  },

  filterChipRow: {
    gap: 6,

    paddingRight: 6,
  },

  filterChipWrap: {
    flexDirection: "row",

    flexWrap: "wrap",

    gap: 6,
  },

  filterChip: {
    minHeight: 32,

    paddingHorizontal: 10,

    borderRadius: 11,

    alignItems: "center",
    justifyContent: "center",

    backgroundColor: SOFT,

    borderWidth: 1,
    borderColor: "#E8E0D5",
  },

  filterChipActive: {
    backgroundColor: "#F0D889",

    borderColor: "#DEC46C",
  },

  filterChipText: {
    color: "#676159",

    fontSize: 9,

    fontWeight: "700",
  },

  filterChipTextActive: {
    color: BLACK,

    fontWeight: "900",
  },

  /*
   * RESULT HEADER
   */

  resultsHeader: {
    marginTop: 3,

    marginBottom: 8,

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  resultCount: {
    color: BLACK,

    fontSize: 15,

    fontWeight: "900",
  },

  filteredLabel: {
    marginTop: 2,

    color: GOLD_DARK,

    fontSize: 8.5,

    fontWeight: "700",
  },

  sortRow: {
    gap: 6,

    paddingRight: 8,

    marginBottom: 15,
  },

  sortChip: {
    minHeight: 32,

    paddingHorizontal: 11,

    borderRadius: 11,

    alignItems: "center",
    justifyContent: "center",

    backgroundColor: WHITE,

    borderWidth: 1,
    borderColor: BORDER,
  },

  sortChipActive: {
    backgroundColor: BLACK,

    borderColor: BLACK,
  },

  sortChipText: {
    color: "#6D675F",

    fontSize: 9,

    fontWeight: "700",
  },

  sortChipTextActive: {
    color: WHITE,

    fontWeight: "900",
  },

  /*
   * LOADING
   */

  loadingState: {
    minHeight: 220,

    alignItems: "center",
    justifyContent: "center",

    gap: 9,
  },

  loadingText: {
    color: MUTED,

    fontSize: 11,

    fontWeight: "600",
  },

  /*
   * FEED
   */

  propertyFeed: {
    gap: 13,
  },

  marketCard: {
    overflow: "hidden",

    borderRadius: 22,

    backgroundColor: WHITE,

    borderWidth: 1,
  },

  marketImageWrap: {
    height: 205,

    position: "relative",

    backgroundColor: "#EEEAE3",
  },

  marketImage: {
    width: "100%",
    height: "100%",
  },

  marketBadgeRow: {
    position: "absolute",

    top: 10,
    left: 10,
    right: 50,

    flexDirection: "row",

    flexWrap: "wrap",

    gap: 5,
  },

  listingTypeBadge: {
    minHeight: 24,

    paddingHorizontal: 9,

    borderRadius: 999,

    alignItems: "center",
    justifyContent: "center",

    backgroundColor: BLACK,
  },

  listingTypeBadgeText: {
    color: WHITE,

    fontSize: 8,

    fontWeight: "900",
  },

  rentalBadge: {
    minHeight: 24,

    paddingHorizontal: 9,

    borderRadius: 999,

    alignItems: "center",
    justifyContent: "center",

    backgroundColor:
      "rgba(255,255,255,0.94)",
  },

  rentalBadgeText: {
    color: BLACK,

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

  marketHeart: {
    position: "absolute",

    top: 10,
    right: 10,

    width: 34,
    height: 34,

    borderRadius: 999,

    alignItems: "center",
    justifyContent: "center",

    backgroundColor:
      "rgba(255,255,255,0.95)",

    shadowColor: "#000000",

    shadowOffset: {
      width: 0,
      height: 2,
    },

    shadowOpacity: 0.07,

    shadowRadius: 4,

    elevation: 2,
  },

  /*
   * IMAGE BRAND
   */

  imageBrand: {
    position: "absolute",

    left: 10,
    bottom: 10,

    height: 27,

    paddingLeft: 5,
    paddingRight: 9,

    borderRadius: 999,

    flexDirection: "row",
    alignItems: "center",

    gap: 5,

    backgroundColor:
      "rgba(17,17,17,0.82)",
  },

  imageBrandLogo: {
    width: 18,
    height: 18,
  },

  imageBrandText: {
    color: WHITE,

    fontSize: 8,

    fontWeight: "900",

    letterSpacing: 1,
  },

  /*
   * BODY
   */

  marketBody: {
    padding: 13,
  },

  marketPrice: {
    color: BLACK,

    fontSize: 16,

    lineHeight: 20,

    fontWeight: "900",

    letterSpacing: -0.15,
  },

  marketTitle: {
    marginTop: 4,

    color: "#292622",

    fontSize: 13.5,

    lineHeight: 18,

    fontWeight: "800",
  },

  marketLocationRow: {
    marginTop: 7,

    flexDirection: "row",
    alignItems: "center",

    gap: 4,
  },

  marketLocation: {
    flex: 1,

    color: MUTED,

    fontSize: 10.5,

    fontWeight: "600",
  },

  /*
   * META
   */

  metaRow: {
    marginTop: 10,

    flexDirection: "row",
    alignItems: "center",

    flexWrap: "wrap",

    gap: 13,
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

  /*
   * ACTIONS
   */

  marketActions: {
    marginTop: 12,

    flexDirection: "row",

    gap: 7,
  },

  whatsappButton: {
    flex: 1,

    height: 39,

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

    height: 39,

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

  /*
   * EMPTY
   */

  emptyState: {
    minHeight: 220,

    marginTop: 8,

    padding: 24,

    borderRadius: 22,

    alignItems: "center",
    justifyContent: "center",

    backgroundColor: WHITE,

    borderWidth: 1,
    borderColor: BORDER,
  },

  emptyIcon: {
    width: 50,
    height: 50,

    borderRadius: 16,

    alignItems: "center",
    justifyContent: "center",

    backgroundColor: GOLD_SOFT,

    marginBottom: 12,
  },

  emptyTitle: {
    color: BLACK,

    fontSize: 15,

    fontWeight: "900",

    textAlign: "center",
  },

  emptySub: {
    marginTop: 5,

    color: MUTED,

    fontSize: 10.5,

    lineHeight: 15,

    fontWeight: "500",

    textAlign: "center",
  },

  emptyReset: {
    minHeight: 38,

    marginTop: 15,

    paddingHorizontal: 14,

    borderRadius: 12,

    flexDirection: "row",
    alignItems: "center",

    gap: 5,

    backgroundColor: "#F0D889",
  },

  emptyResetText: {
    color: BLACK,

    fontSize: 10,

    fontWeight: "800",
  },

  /*
   * LOAD MORE
   */

  loadMoreButton: {
    height: 49,

    marginTop: 16,

    borderRadius: 16,

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",

    gap: 5,

    backgroundColor: BLACK,
  },

  loadMoreText: {
    color: WHITE,

    fontSize: 11,

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
});