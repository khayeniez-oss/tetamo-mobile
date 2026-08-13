import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
  ArrowLeft,
  BadgeDollarSign,
  Bath,
  BedDouble,
  Building2,
  CalendarDays,
  ChevronRight,
  Hash,
  Heart,
  Languages,
  MapPin,
  MessageCircle,
  Ruler,
  Search,
  SlidersHorizontal,
  X
} from "lucide-react-native";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
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

import {
  fetchHomepageProperties,
  type TetamoProperty,
} from "../services/properties";

type Language = "en" | "id";
type Currency = "IDR" | "USD" | "AUD";

type ListingType = "" | "dijual" | "disewa";
type RentalType = "" | "daily" | "monthly" | "yearly";
type SaleType =
  | ""
  | "freehold"
  | "leasehold"
  | "hgb"
  | "hak_pakai"
  | "lainnya";

type SortOption =
  | "relevan"
  | "terbaru"
  | "harga-rendah"
  | "harga-tinggi";

type PriceRange =
  | ""
  | "<100jt"
  | "100jt-500jt"
  | "500jt-1m"
  | "1m-3m"
  | ">3m";

type SuggestionItem = {
  id: string;
  type: "kode" | "location" | "property";
  label: string;
  sublabel?: string;
  query: string;
  property?: TetamoProperty;
};

type PropertyTypeOption = {
  value: string;
  label: string;
};

const BLACK = "#111111";
const WHITE = "#FFFFFF";
const CREAM = "#FBFAF7";

const GOLD = "#D8B46A";
const GOLD_DARK = "#B8892E";
const GOLD_ACTIVE = "#F0D889";
const GOLD_SOFT = "#F4E8C5";

const BORDER = "#E8E1D7";
const SOFT = "#F5F1EA";
const MUTED = "#777169";

const tetamoLogo = require("../assets/images/tetamo-logo.png");

const TETAMO_FALLBACK_WHATSAPP =
  process.env.EXPO_PUBLIC_TETAMO_FALLBACK_WHATSAPP || "";

const INITIAL_RESULT_LIMIT = 12;
const LOAD_MORE_AMOUNT = 12;

const currencyRates: Record<Currency, number> = {
  IDR: 1,
  USD: 0.000061,
  AUD: 0.000094,
};

const copy = {
  en: {
    title: "Search",
    heroTitle: "Find the property you want",
    heroSub:
      "Search by location, listing code, property type or keyword.",

    search: "Search",
    searchPlaceholder: "Search location, listing code, property...",

    noSuggestion: "No search suggestions.",
    listingCode: "Listing Code",
    location: "Location",
    property: "Property",

    allListing: "All",
    forSale: "For Sale",
    forRent: "For Rent",

    propertyType: "Property Type",
    price: "Price",
    bedroom: "Bedrooms",
    filters: "Filters",

    moreFilters: "More Filters",
    hideFilters: "Hide Filters",

    rentalType: "Rental Type",
    saleType: "Sale Type",
    province: "Province",
    area: "Area",

    allRentalType: "All Rental Types",
    daily: "Daily",
    monthly: "Monthly",
    yearly: "Yearly",

    allSaleType: "All Sale Types",
    freehold: "Freehold",
    leasehold: "Leasehold",
    hgb: "HGB",
    hakPakai: "Right to Use",
    lainnya: "Other",

    allProvince: "All Provinces",
    allArea: "All Areas",
    allPropertyTypes: "All Property Types",

    allBedroom: "Any Bedrooms",
    bedroomPlus: "Beds",

    allPrice: "All Prices",

    results: "Search Results",
    found: "properties found",
    showing: "Showing",
    of: "of",

    sort: "Sort",
    mostRelevant: "Relevant",
    newest: "Newest",
    lowestPrice: "Price ↑",
    highestPrice: "Price ↓",

    clearFilters: "Clear Filters",

    loading: "Loading properties...",
    failed: "Failed to load properties.",

    empty: "No properties found",
    emptySub:
      "Try another location, keyword, price range or property filter.",

    loadMore: "Load More Properties",

    whatsapp: "WhatsApp",
    schedule: "Viewing",

    verified: "Verified",
    spotlight: "Spotlight",
    featured: "Featured",
    boost: "Boost",

    priceRequest: "Price on Request",
  },

  id: {
    title: "Cari",
    heroTitle: "Cari properti yang Anda inginkan",
    heroSub:
      "Cari berdasarkan lokasi, kode listing, tipe properti atau kata kunci.",

    search: "Cari",
    searchPlaceholder: "Cari lokasi, kode listing, properti...",

    noSuggestion: "Tidak ada saran pencarian.",
    listingCode: "Kode Listing",
    location: "Lokasi",
    property: "Properti",

    allListing: "Semua",
    forSale: "Dijual",
    forRent: "Disewa",

    propertyType: "Tipe Properti",
    price: "Harga",
    bedroom: "Kamar",
    filters: "Filter",

    moreFilters: "Filter Lainnya",
    hideFilters: "Tutup Filter",

    rentalType: "Jenis Sewa",
    saleType: "Status Jual",
    province: "Provinsi",
    area: "Area",

    allRentalType: "Semua Jenis Sewa",
    daily: "Harian",
    monthly: "Bulanan",
    yearly: "Tahunan",

    allSaleType: "Semua Status Jual",
    freehold: "Freehold",
    leasehold: "Leasehold",
    hgb: "HGB",
    hakPakai: "Hak Pakai",
    lainnya: "Lainnya",

    allProvince: "Semua Provinsi",
    allArea: "Semua Area",
    allPropertyTypes: "Semua Tipe Properti",

    allBedroom: "Semua Kamar",
    bedroomPlus: "Kamar",

    allPrice: "Semua Harga",

    results: "Hasil Pencarian",
    found: "properti ditemukan",
    showing: "Menampilkan",
    of: "dari",

    sort: "Urutkan",
    mostRelevant: "Relevan",
    newest: "Terbaru",
    lowestPrice: "Harga ↑",
    highestPrice: "Harga ↓",

    clearFilters: "Reset Filter",

    loading: "Memuat properti...",
    failed: "Gagal memuat properti.",

    empty: "Properti tidak ditemukan",
    emptySub:
      "Coba lokasi, kata kunci, rentang harga atau filter properti lainnya.",

    loadMore: "Tampilkan Lebih Banyak",

    whatsapp: "WhatsApp",
    schedule: "Viewing",

    verified: "Verified",
    spotlight: "Spotlight",
    featured: "Featured",
    boost: "Boost",

    priceRequest: "Hubungi Kami",
  },
};

export default function SearchScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const [language, setLanguage] = useState<Language>("en");
  const [currency, setCurrency] = useState<Currency>("IDR");

  const [allProperties, setAllProperties] = useState<TetamoProperty[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const [searchInput, setSearchInput] = useState("");
  const [appliedQuery, setAppliedQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);

  const [listingType, setListingType] = useState<ListingType>("");
  const [rentalType, setRentalType] = useState<RentalType>("");
  const [saleType, setSaleType] = useState<SaleType>("");

  const [province, setProvince] = useState("");
  const [area, setArea] = useState("");

  const [bedroom, setBedroom] = useState("");
  const [priceRange, setPriceRange] = useState<PriceRange>("");
  const [category, setCategory] = useState("");

  const [sortBy, setSortBy] = useState<SortOption>("relevan");

  const [moreFiltersOpen, setMoreFiltersOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(INITIAL_RESULT_LIMIT);

  const t = copy[language];

  /*
   * ==========================================
   * INITIAL URL PARAMS
   * ==========================================
   */

  useEffect(() => {
    const initialQuery =
      readParam(params.q) || readParam(params.query);

    const listingTypeParam =
      readParam(params.jenisListing) ||
      readParam(params.listingType);

    const rentalTypeParam = normalizeRentalType(
      readParam(params.rentalType)
    );

    const saleTypeParam = normalizeSaleType(
      readParam(params.saleType)
    );

    const provinceParam = readParam(params.province);
    const areaParam = readParam(params.area);
    const bedroomParam = readParam(params.bedroom);
    const categoryParam = readParam(params.category);

    const priceParam = normalizePriceRange(
      readParam(params.priceRange)
    );

    const sortParam = normalizeSort(
      readParam(params.sortBy)
    );

    setSearchInput(initialQuery);
    setAppliedQuery(initialQuery);

    setListingType(
      normalizeListingType(listingTypeParam)
    );

    setRentalType(rentalTypeParam);
    setSaleType(saleTypeParam);

    setProvince(provinceParam);
    setArea(areaParam);

    setBedroom(bedroomParam);
    setCategory(categoryParam);

    setPriceRange(priceParam);
    setSortBy(sortParam);
  }, [
    params.area,
    params.bedroom,
    params.category,
    params.jenisListing,
    params.listingType,
    params.priceRange,
    params.province,
    params.q,
    params.query,
    params.rentalType,
    params.saleType,
    params.sortBy,
  ]);

  /*
   * ==========================================
   * LOAD REAL PROPERTY DATA
   * ==========================================
   */

  useEffect(() => {
    let mounted = true;

    async function loadProperties() {
      try {
        setLoadingData(true);
        setErrorMessage("");

        const rows = await fetchHomepageProperties(240);

        if (!mounted) return;

        setAllProperties(rows);

        const firstImages = rows
          .slice(0, 16)
          .map((item) => item.image || item.images?.[0])
          .filter(Boolean) as string[];

        firstImages.forEach((url) => {
          void Image.prefetch(url).catch(() => {});
        });
      } catch (error: any) {
        console.log(
          "Tetamo mobile search fetch error:",
          error
        );

        if (!mounted) return;

        setAllProperties([]);
        setErrorMessage(error?.message || t.failed);
      } finally {
        if (mounted) {
          setLoadingData(false);
        }
      }
    }

    void loadProperties();

    return () => {
      mounted = false;
    };
  }, []);

  /*
   * ==========================================
   * RESET RESULT LIMIT WHEN SEARCH CHANGES
   * ==========================================
   */

  useEffect(() => {
    setVisibleCount(INITIAL_RESULT_LIMIT);
  }, [
    appliedQuery,
    listingType,
    rentalType,
    saleType,
    province,
    area,
    bedroom,
    priceRange,
    category,
    sortBy,
  ]);

  /*
   * ==========================================
   * REAL FILTER OPTIONS
   * ==========================================
   */

  const provinces = useMemo(() => {
    return Array.from(
      new Set(
        allProperties
          .map((item) => cleanString(item.province))
          .filter(Boolean)
      )
    ).sort();
  }, [allProperties]);

  const areas = useMemo(() => {
    const base = province
      ? allProperties.filter(
          (item) =>
            cleanString(item.province) === province
        )
      : allProperties;

    return Array.from(
      new Set(
        base
          .map((item) =>
            cleanString(item.area || item.city)
          )
          .filter(Boolean)
      )
    ).sort();
  }, [allProperties, province]);

  const propertyTypes = useMemo<PropertyTypeOption[]>(() => {
    const values = Array.from(
      new Set(
        allProperties
          .map((item) => cleanString(item.propertyType))
          .filter(Boolean)
      )
    );

    return values
      .map((value) => ({
        value,
        label: formatPropertyType(value, language),
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [allProperties, language]);

  /*
   * ==========================================
   * AUTOCOMPLETE
   * ==========================================
   */

  const autocompleteGroups = useMemo(() => {
    const q = normalizeText(searchInput);

    if (!q) {
      return {
        kode: [] as SuggestionItem[],
        lokasi: [] as SuggestionItem[],
        properti: [] as SuggestionItem[],
      };
    }

    const scored = allProperties
      .map((item) => ({
        item,
        score: calculateRelevanceScore(item, q),
      }))
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score);

    const kode = scored
      .filter(({ item }) =>
        normalizeText(item.kode || "").includes(q)
      )
      .slice(0, 3)
      .map(({ item }) => ({
        id: `kode-${item.id}`,
        type: "kode" as const,
        label: item.kode || "-",
        sublabel: `${getTitle(item, language)} • ${
          item.location || ""
        }`,
        query: item.kode || "",
        property: item,
      }));

    const locationValues = Array.from(
      new Set(
        allProperties.flatMap((item) => [
          cleanString(
            `${item.area || item.city || ""}, ${
              item.province || ""
            }`
          ),
          cleanString(item.area),
          cleanString(item.city),
          cleanString(item.province),
        ])
      )
    ).filter(Boolean);

    const lokasi = locationValues
      .filter((value) =>
        normalizeText(value).includes(q)
      )
      .slice(0, 5)
      .map((value, index) => ({
        id: `location-${index}-${value}`,
        type: "location" as const,
        label: value,
        query: value,
      }));

    const properti = scored
      .slice(0, 6)
      .map(({ item }) => ({
        id: `property-${item.id}`,
        type: "property" as const,
        label: getTitle(item, language),
        sublabel: `${item.location || ""} • ${formatPricePlain(
          item.priceIdr
        )}`,
        query: getTitle(item, language),
        property: item,
      }));

    return {
      kode,
      lokasi,
      properti,
    };
  }, [allProperties, language, searchInput]);

  const hasAutocompleteResults =
    autocompleteGroups.kode.length > 0 ||
    autocompleteGroups.lokasi.length > 0 ||
    autocompleteGroups.properti.length > 0;

  /*
   * ==========================================
   * SEARCH + FILTER + SORT
   * ==========================================
   */

  const filteredResults = useMemo(() => {
    const normalizedQuery = normalizeText(appliedQuery);

    let results = allProperties
      .map((item, index) => ({
        item,
        index,
        relevanceScore: calculateRelevanceScore(
          item,
          normalizedQuery
        ),
      }))
      .filter(({ item, relevanceScore }) => {
        const searchable = buildSearchableText(item);

        const matchesQuery =
          !normalizedQuery ||
          relevanceScore > 0 ||
          searchable.includes(normalizedQuery);

        const matchesListing =
          !listingType ||
          (listingType === "dijual" &&
            isSaleProperty(item)) ||
          (listingType === "disewa" &&
            isRentProperty(item));

        const matchesRental =
          !rentalType ||
          (isRentProperty(item) &&
            normalizeRentalType(item.rentalType) ===
              rentalType);

        const matchesSale =
          !saleType ||
          (isSaleProperty(item) &&
            normalizeSaleType(item.saleType) ===
              saleType);

        const matchesProvince =
          !province ||
          cleanString(item.province) === province;

        const matchesArea =
          !area ||
          cleanString(item.area) === area ||
          cleanString(item.city) === area ||
          normalizeText(item.location || "").includes(
            normalizeText(area)
          );

        const matchesBedroom =
          !bedroom ||
          Number(item.beds || 0) >= Number(bedroom);

        const matchesPrice =
          !priceRange ||
          getPriceRange(item.priceIdr || 0) === priceRange;

        const matchesCategory =
          !category ||
          normalizeText(item.propertyType || "") ===
            normalizeText(category);

        return (
          matchesQuery &&
          matchesListing &&
          matchesRental &&
          matchesSale &&
          matchesProvince &&
          matchesArea &&
          matchesBedroom &&
          matchesPrice &&
          matchesCategory
        );
      });

    if (sortBy === "harga-rendah") {
      results = [...results].sort(
        (a, b) =>
          (a.item.priceIdr || 0) -
          (b.item.priceIdr || 0)
      );
    } else if (sortBy === "harga-tinggi") {
      results = [...results].sort(
        (a, b) =>
          (b.item.priceIdr || 0) -
          (a.item.priceIdr || 0)
      );
    } else if (sortBy === "terbaru") {
      /*
       * fetchHomepageProperties already returns
       * the marketplace feed in server order.
       */
      results = [...results].sort(
        (a, b) => a.index - b.index
      );
    } else {
      /*
       * Relevant:
       * exact search relevance +
       * Spotlight > Featured > Boost.
       */
      results = [...results].sort((a, b) => {
        if (b.relevanceScore !== a.relevanceScore) {
          return b.relevanceScore - a.relevanceScore;
        }

        return a.index - b.index;
      });
    }

    return results.map(({ item }) => item);
  }, [
    allProperties,
    appliedQuery,
    listingType,
    rentalType,
    saleType,
    province,
    area,
    bedroom,
    priceRange,
    category,
    sortBy,
  ]);

  const visibleResults = filteredResults.slice(
    0,
    visibleCount
  );

  const hasMore =
    visibleResults.length < filteredResults.length;

  /*
   * ==========================================
   * ACTIVE FILTER VALUES
   * ==========================================
   */

  const selectedPropertyTypeLabel = useMemo(() => {
    if (!category) {
      return t.propertyType;
    }

    return (
      propertyTypes.find(
        (item) => item.value === category
      )?.label || formatPropertyType(category, language)
    );
  }, [category, propertyTypes, language, t.propertyType]);

  const locationFilterLabel =
    area || province || t.location;

  const priceFilterLabel = priceRange
    ? formatPriceRangeLabel(priceRange, language)
    : t.price;

  const bedroomFilterLabel = bedroom
    ? `${bedroom}+ ${t.bedroomPlus}`
    : t.bedroom;

  const activeFilterCount = [
    rentalType,
    saleType,
    province,
    area,
    bedroom,
    priceRange,
    category,
  ].filter(Boolean).length;

  const hasActiveFilters =
    Boolean(listingType) ||
    activeFilterCount > 0 ||
    sortBy !== "relevan";

  /*
   * ==========================================
   * PRICE DISPLAY
   * ==========================================
   */

  const formatPrice = useMemo(() => {
    return (
      priceIdr: number,
      rental?: string | null
    ) => {
      if (!priceIdr || priceIdr <= 0) {
        return t.priceRequest;
      }

      const converted =
        priceIdr * currencyRates[currency];

      let base =
        currency === "IDR"
          ? `IDR ${Math.round(converted).toLocaleString(
              "id-ID"
            )}`
          : `≈ ${currency} ${Math.round(
              converted
            ).toLocaleString("en-US")}`;

      const normalizedRental = normalizeText(
        rental || ""
      );

      if (
        normalizedRental.includes("monthly") ||
        normalizedRental.includes("bulanan")
      ) {
        base += language === "id" ? " /bln" : " /mo";
      }

      if (
        normalizedRental.includes("yearly") ||
        normalizedRental.includes("annual") ||
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

  /*
   * ==========================================
   * ACTIONS
   * ==========================================
   */

  const handleSearch = (customQuery?: string) => {
    const nextQuery = (
      customQuery ?? searchInput
    ).trim();

    setAppliedQuery(nextQuery);
    setSearchInput(nextQuery);
    setShowSuggestions(false);
  };

  const handleSuggestionPress = (
    item: SuggestionItem
  ) => {
    setShowSuggestions(false);

    if (
      (item.type === "property" ||
        item.type === "kode") &&
      item.property
    ) {
      goDetails(item.property);
      return;
    }

    setSearchInput(item.query);
    setAppliedQuery(item.query);
  };

  const clearFilters = () => {
    setListingType("");
    setRentalType("");
    setSaleType("");

    setProvince("");
    setArea("");

    setBedroom("");
    setPriceRange("");
    setCategory("");

    setSortBy("relevan");
    setMoreFiltersOpen(false);
  };

  const goDetails = (
    property: TetamoProperty,
    schedule = false
  ) => {
    const pathKey = encodeURIComponent(
      property.slug || property.id
    );

    router.push(
      `/properti/${pathKey}${
        schedule ? "?schedule=1" : ""
      }` as any
    );
  };

  const openWhatsapp = (
    property: TetamoProperty
  ) => {
    const phone =
      normalizeWhatsappPhone(property.contactPhone) ||
      TETAMO_FALLBACK_WHATSAPP;

    if (!phone) return;

    const title = getTitle(property, language);
    const receiverName =
      property.contactName || "Tetamo";

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

  /*
   * ==========================================
   * SCREEN
   * ==========================================
   */

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />

      {/* =====================================
          HEADER
      ===================================== */}

      <View style={styles.header}>
        <Pressable
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft
            color={BLACK}
            size={18}
          />
        </Pressable>

        <Text style={styles.headerTitle}>
          {t.title}
        </Text>

        <View style={styles.headerUtilities}>
          <View style={styles.utilityGroup}>
            <Languages
              color={GOLD_DARK}
              size={13}
            />

            {(["en", "id"] as Language[]).map(
              (item) => {
                const active =
                  language === item;

                return (
                  <Pressable
                    key={item}
                    style={[
                      styles.languageSegment,
                      active &&
                        styles.utilitySegmentActive,
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
              }
            )}
          </View>

          <View style={styles.utilityGroup}>
            <BadgeDollarSign
              color={GOLD_DARK}
              size={13}
            />

            {(
              ["IDR", "USD", "AUD"] as Currency[]
            ).map((item) => {
              const active =
                currency === item;

              return (
                <Pressable
                  key={item}
                  style={[
                    styles.currencySegment,
                    active &&
                      styles.utilitySegmentActive,
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
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* =====================================
            SEARCH HERO
        ===================================== */}

        <View style={styles.searchHero}>
          <Text style={styles.heroTitle}>
            {t.heroTitle}
          </Text>

          <Text style={styles.heroSub}>
            {t.heroSub}
          </Text>

          <View style={styles.searchRow}>
            <View style={styles.searchInputBox}>
              <Search
                color={GOLD_DARK}
                size={18}
              />

              <TextInput
                value={searchInput}
                onChangeText={(value) => {
                  setSearchInput(value);
                  setShowSuggestions(true);
                }}
                onFocus={() =>
                  setShowSuggestions(true)
                }
                placeholder={
                  t.searchPlaceholder
                }
                placeholderTextColor="#9B958C"
                style={styles.searchInput}
                autoCapitalize="none"
                returnKeyType="search"
                onSubmitEditing={() =>
                  handleSearch()
                }
              />

              {searchInput ? (
                <Pressable
                  style={styles.clearSearchButton}
                  onPress={() => {
                    setSearchInput("");
                    setAppliedQuery("");
                    setShowSuggestions(false);
                  }}
                >
                  <X
                    color={MUTED}
                    size={16}
                  />
                </Pressable>
              ) : null}
            </View>

            <Pressable
              style={styles.searchButton}
              onPress={() => handleSearch()}
            >
              <Search
                color={BLACK}
                size={16}
              />

              <Text
                style={
                  styles.searchButtonText
                }
              >
                {t.search}
              </Text>
            </Pressable>
          </View>

          {/* =================================
              AUTOCOMPLETE
          ================================= */}

          {showSuggestions &&
          searchInput.trim() ? (
            <View
              style={styles.suggestionsPanel}
            >
              {hasAutocompleteResults ? (
                <>
                  <SuggestionGroup
                    title={t.listingCode}
                    icon={
                      <Hash
                        color={BLACK}
                        size={14}
                      />
                    }
                    items={
                      autocompleteGroups.kode
                    }
                    onPress={
                      handleSuggestionPress
                    }
                  />

                  <SuggestionGroup
                    title={t.location}
                    icon={
                      <MapPin
                        color={BLACK}
                        size={14}
                      />
                    }
                    items={
                      autocompleteGroups.lokasi
                    }
                    onPress={
                      handleSuggestionPress
                    }
                  />

                  <SuggestionGroup
                    title={t.property}
                    icon={
                      <Building2
                        color={BLACK}
                        size={14}
                      />
                    }
                    items={
                      autocompleteGroups.properti
                    }
                    onPress={
                      handleSuggestionPress
                    }
                  />
                </>
              ) : (
                <Text
                  style={
                    styles.noSuggestionText
                  }
                >
                  {t.noSuggestion}
                </Text>
              )}
            </View>
          ) : null}

          {/* =================================
              SALE / RENT
          ================================= */}

          <View style={styles.listingTabs}>
            {[
              {
                label: t.allListing,
                value: "" as ListingType,
              },
              {
                label: t.forSale,
                value: "dijual" as ListingType,
              },
              {
                label: t.forRent,
                value: "disewa" as ListingType,
              },
            ].map((item) => {
              const active =
                listingType === item.value;

              return (
                <Pressable
                  key={item.value || "all"}
                  style={[
                    styles.listingTab,
                    active &&
                      styles.listingTabActive,
                  ]}
                  onPress={() => {
                    setListingType(item.value);

                    if (
                      item.value === "dijual"
                    ) {
                      setRentalType("");
                    }

                    if (
                      item.value === "disewa"
                    ) {
                      setSaleType("");
                    }
                  }}
                >
                  <Text
                    style={[
                      styles.listingTabText,
                      active &&
                        styles.listingTabTextActive,
                    ]}
                  >
                    {item.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* =================================
              QUICK FILTERS
          ================================= */}

          <View style={styles.quickFilterGrid}>
            <QuickFilter
              label={locationFilterLabel}
              active={Boolean(
                province || area
              )}
              icon={
                <MapPin
                  color={
                    province || area
                      ? BLACK
                      : GOLD_DARK
                  }
                  size={14}
                />
              }
              onPress={() =>
                setMoreFiltersOpen(true)
              }
            />

            <QuickFilter
              label={
                selectedPropertyTypeLabel
              }
              active={Boolean(category)}
              icon={
                <Building2
                  color={
                    category
                      ? BLACK
                      : GOLD_DARK
                  }
                  size={14}
                />
              }
              onPress={() =>
                setMoreFiltersOpen(true)
              }
            />

            <QuickFilter
              label={priceFilterLabel}
              active={Boolean(priceRange)}
              icon={
                <BadgeDollarSign
                  color={
                    priceRange
                      ? BLACK
                      : GOLD_DARK
                  }
                  size={14}
                />
              }
              onPress={() =>
                setMoreFiltersOpen(true)
              }
            />

            <QuickFilter
              label={bedroomFilterLabel}
              active={Boolean(bedroom)}
              icon={
                <BedDouble
                  color={
                    bedroom
                      ? BLACK
                      : GOLD_DARK
                  }
                  size={14}
                />
              }
              onPress={() =>
                setMoreFiltersOpen(true)
              }
            />
          </View>

          {/* =================================
              MORE FILTERS
          ================================= */}

          <View style={styles.filterActionRow}>
            <Pressable
              style={styles.moreFilterButton}
              onPress={() =>
                setMoreFiltersOpen(
                  (current) => !current
                )
              }
            >
              <SlidersHorizontal
                color={BLACK}
                size={14}
              />

              <Text
                style={
                  styles.moreFilterText
                }
              >
                {moreFiltersOpen
                  ? t.hideFilters
                  : t.moreFilters}

                {activeFilterCount > 0
                  ? ` (${activeFilterCount})`
                  : ""}
              </Text>
            </Pressable>

            {hasActiveFilters ? (
              <Pressable
                style={styles.clearFilterButton}
                onPress={clearFilters}
              >
                <Text
                  style={
                    styles.clearFilterText
                  }
                >
                  {t.clearFilters}
                </Text>
              </Pressable>
            ) : null}
          </View>

          {moreFiltersOpen ? (
            <View
              style={
                styles.advancedFilters
              }
            >
              {listingType !== "dijual" ? (
                <OptionRow
                  label={t.rentalType}
                  value={rentalType}
                  options={[
                    {
                      label:
                        t.allRentalType,
                      value: "",
                    },
                    {
                      label: t.daily,
                      value: "daily",
                    },
                    {
                      label: t.monthly,
                      value: "monthly",
                    },
                    {
                      label: t.yearly,
                      value: "yearly",
                    },
                  ]}
                  onChange={(value) => {
                    setRentalType(
                      value as RentalType
                    );

                    if (value) {
                      setListingType(
                        "disewa"
                      );
                      setSaleType("");
                    }
                  }}
                />
              ) : null}

              {listingType !== "disewa" ? (
                <OptionRow
                  label={t.saleType}
                  value={saleType}
                  options={[
                    {
                      label: t.allSaleType,
                      value: "",
                    },
                    {
                      label: t.freehold,
                      value: "freehold",
                    },
                    {
                      label: t.leasehold,
                      value: "leasehold",
                    },
                    {
                      label: t.hgb,
                      value: "hgb",
                    },
                    {
                      label: t.hakPakai,
                      value: "hak_pakai",
                    },
                    {
                      label: t.lainnya,
                      value: "lainnya",
                    },
                  ]}
                  onChange={(value) => {
                    setSaleType(
                      value as SaleType
                    );

                    if (value) {
                      setListingType(
                        "dijual"
                      );
                      setRentalType("");
                    }
                  }}
                />
              ) : null}

              <OptionRow
                label={t.province}
                value={province}
                options={[
                  {
                    label: t.allProvince,
                    value: "",
                  },
                  ...provinces.map(
                    (item) => ({
                      label: item,
                      value: item,
                    })
                  ),
                ]}
                onChange={(value) => {
                  setProvince(value);
                  setArea("");
                }}
              />

              <OptionRow
                label={t.area}
                value={area}
                options={[
                  {
                    label: t.allArea,
                    value: "",
                  },
                  ...areas.map((item) => ({
                    label: item,
                    value: item,
                  })),
                ]}
                onChange={setArea}
              />

              <OptionRow
                label={t.propertyType}
                value={category}
                options={[
                  {
                    label:
                      t.allPropertyTypes,
                    value: "",
                  },
                  ...propertyTypes,
                ]}
                onChange={setCategory}
              />

              <OptionRow
                label={t.bedroom}
                value={bedroom}
                options={[
                  {
                    label: t.allBedroom,
                    value: "",
                  },
                  {
                    label: `1+ ${t.bedroomPlus}`,
                    value: "1",
                  },
                  {
                    label: `2+ ${t.bedroomPlus}`,
                    value: "2",
                  },
                  {
                    label: `3+ ${t.bedroomPlus}`,
                    value: "3",
                  },
                  {
                    label: `4+ ${t.bedroomPlus}`,
                    value: "4",
                  },
                  {
                    label: `5+ ${t.bedroomPlus}`,
                    value: "5",
                  },
                ]}
                onChange={setBedroom}
              />

              <OptionRow
                label={t.price}
                value={priceRange}
                options={[
                  {
                    label: t.allPrice,
                    value: "",
                  },
                  {
                    label: "< 100 Juta",
                    value: "<100jt",
                  },
                  {
                    label:
                      "100 - 500 Juta",
                    value:
                      "100jt-500jt",
                  },
                  {
                    label:
                      "500 Juta - 1 Miliar",
                    value:
                      "500jt-1m",
                  },
                  {
                    label: "1 - 3 Miliar",
                    value: "1m-3m",
                  },
                  {
                    label: "> 3 Miliar",
                    value: ">3m",
                  },
                ]}
                onChange={(value) =>
                  setPriceRange(
                    value as PriceRange
                  )
                }
              />
            </View>
          ) : null}
        </View>

        {/* =====================================
            RESULT HEADER
        ===================================== */}

        <View style={styles.resultsHeader}>
          <View style={styles.resultsTitleBox}>
            <Text style={styles.resultsTitle}>
              {t.results}
            </Text>

            <Text
              style={styles.resultsCount}
            >
              {filteredResults.length}{" "}
              {t.found}
            </Text>

            {appliedQuery ? (
              <View style={styles.queryPill}>
                <Search
                  color={GOLD_DARK}
                  size={11}
                />

                <Text
                  style={styles.queryPillText}
                  numberOfLines={1}
                >
                  {appliedQuery}
                </Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* =====================================
            SORT
        ===================================== */}

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.sortRow}
        >
          {[
            {
              label: t.mostRelevant,
              value: "relevan",
            },
            {
              label: t.newest,
              value: "terbaru",
            },
            {
              label: t.lowestPrice,
              value: "harga-rendah",
            },
            {
              label: t.highestPrice,
              value: "harga-tinggi",
            },
          ].map((item) => {
            const active =
              sortBy === item.value;

            return (
              <Pressable
                key={item.value}
                style={[
                  styles.sortChip,
                  active &&
                    styles.sortChipActive,
                ]}
                onPress={() =>
                  setSortBy(
                    item.value as SortOption
                  )
                }
              >
                <Text
                  style={[
                    styles.sortChipText,
                    active &&
                      styles.sortChipTextActive,
                  ]}
                >
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* =====================================
            RESULTS
        ===================================== */}

        {loadingData ? (
          <View style={styles.stateCard}>
            <ActivityIndicator
              color={GOLD_DARK}
            />

            <Text
              style={styles.stateText}
            >
              {t.loading}
            </Text>
          </View>
        ) : errorMessage ? (
          <View style={styles.stateCard}>
            <Building2
              color={GOLD_DARK}
              size={30}
            />

            <Text
              style={styles.emptyTitle}
            >
              {t.failed}
            </Text>

            <Text
              style={styles.emptySub}
            >
              {errorMessage}
            </Text>
          </View>
        ) : visibleResults.length > 0 ? (
          <>
            <View style={styles.resultList}>
              {visibleResults.map(
                (property) => (
                  <SearchResultCard
                    key={property.id}
                    property={property}
                    language={language}
                    currency={currency}
                    formatPrice={formatPrice}
                    labels={t}
                    onPress={() =>
                      goDetails(property)
                    }
                    onWhatsapp={() =>
                      openWhatsapp(property)
                    }
                    onSchedule={() =>
                      goDetails(
                        property,
                        true
                      )
                    }
                  />
                )
              )}
            </View>

            <Text
              style={styles.showingText}
            >
              {t.showing}{" "}
              {visibleResults.length}{" "}
              {t.of}{" "}
              {filteredResults.length}
            </Text>

            {hasMore ? (
              <Pressable
                style={styles.loadMoreButton}
                onPress={() =>
                  setVisibleCount(
                    (current) =>
                      current +
                      LOAD_MORE_AMOUNT
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
                  color={BLACK}
                  size={16}
                />
              </Pressable>
            ) : null}
          </>
        ) : (
          <View style={styles.stateCard}>
            <View style={styles.emptyIcon}>
              <Search
                color={GOLD_DARK}
                size={27}
              />
            </View>

            <Text
              style={styles.emptyTitle}
            >
              {t.empty}
            </Text>

            <Text style={styles.emptySub}>
              {t.emptySub}
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

/*
 * =================================================
 * QUICK FILTER
 * =================================================
 */

function QuickFilter({
  label,
  active,
  icon,
  onPress,
}: {
  label: string;
  active: boolean;
  icon: ReactNode;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={[
        styles.quickFilter,
        active &&
          styles.quickFilterActive,
      ]}
      onPress={onPress}
    >
      <View
        style={[
          styles.quickFilterIcon,
          active &&
            styles.quickFilterIconActive,
        ]}
      >
        {icon}
      </View>

      <Text
        style={[
          styles.quickFilterText,
          active &&
            styles.quickFilterTextActive,
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>

      <ChevronRight
        color={
          active ? BLACK : "#A39C92"
        }
        size={13}
      />
    </Pressable>
  );
}

/*
 * =================================================
 * FILTER OPTION ROW
 * =================================================
 */

function OptionRow({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: {
    label: string;
    value: string;
  }[];
  onChange: (value: string) => void;
}) {
  return (
    <View style={styles.optionBlock}>
      <Text style={styles.optionLabel}>
        {label}
      </Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.optionRow}
      >
        {options.map((option) => {
          const active =
            value === option.value;

          return (
            <Pressable
              key={`${label}-${
                option.value || "all"
              }`}
              style={[
                styles.optionChip,
                active &&
                  styles.optionChipActive,
              ]}
              onPress={() =>
                onChange(option.value)
              }
            >
              <Text
                style={[
                  styles.optionChipText,
                  active &&
                    styles.optionChipTextActive,
                ]}
              >
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

/*
 * =================================================
 * AUTOCOMPLETE
 * =================================================
 */

function SuggestionGroup({
  title,
  icon,
  items,
  onPress,
}: {
  title: string;
  icon: ReactNode;
  items: SuggestionItem[];
  onPress: (item: SuggestionItem) => void;
}) {
  if (items.length === 0) {
    return null;
  }

  return (
    <View style={styles.suggestionGroup}>
      <Text
        style={
          styles.suggestionGroupTitle
        }
      >
        {title}
      </Text>

      {items.map((item) => (
        <Pressable
          key={item.id}
          style={styles.suggestionItem}
          onPress={() => onPress(item)}
        >
          <View
            style={styles.suggestionIcon}
          >
            {icon}
          </View>

          <View
            style={
              styles.suggestionTextBox
            }
          >
            <Text
              style={styles.suggestionLabel}
              numberOfLines={1}
            >
              {item.label}
            </Text>

            {item.sublabel ? (
              <Text
                style={
                  styles.suggestionSub
                }
                numberOfLines={1}
              >
                {item.sublabel}
              </Text>
            ) : null}
          </View>

          <ChevronRight
            color="#9A938A"
            size={15}
          />
        </Pressable>
      ))}
    </View>
  );
}

/*
 * =================================================
 * RESULT CARD
 * =================================================
 */

function SearchResultCard({
  property,
  language,
  formatPrice,
  labels,
  onPress,
  onWhatsapp,
  onSchedule,
}: {
  property: TetamoProperty;
  language: Language;
  currency: Currency;
  formatPrice: (
    priceIdr: number,
    rentalType?: string | null
  ) => string;
  labels: (typeof copy)["en"];
  onPress: () => void;
  onWhatsapp: () => void;
  onSchedule: () => void;
}) {
  const title = getTitle(
    property,
    language
  );

  const image =
    property.image ||
    property.images?.[0] ||
    "";

  const propertyTypeLabel =
    formatPropertyType(
      property.propertyType,
      language
    );

  const location =
    property.location ||
    [
      property.area ||
        property.city,
      property.province,
    ]
      .filter(Boolean)
      .join(", ");

  const badges =
    getBadgesForProperty({
      property,
      language,
      labels,
    });

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

  return (
    <Pressable
      style={styles.resultCard}
      onPress={onPress}
    >
      {/* =================================
          PHOTO
      ================================= */}

      <View style={styles.resultImageWrap}>
        {image ? (
          <ImageBackground
            source={{
              uri: image,
              cache: "force-cache",
            }}
            resizeMode="cover"
            style={styles.resultImage}
            imageStyle={
              styles.resultImageRadius
            }
          >
            <View
              style={styles.cardTopRow}
            >
              <View
                style={styles.badgeRow}
              >
                {badges.map(
                  (badge) => (
                    <StatusBadge
                      key={`${property.id}-${badge.key}`}
                      label={badge.label}
                      background={
                        badge.background
                      }
                      color={badge.color}
                    />
                  )
                )}
              </View>

              <Pressable
                style={
                  styles.cardHeartButton
                }
                onPress={(event: any) => {
                  event.stopPropagation?.();

                  /*
                   * Visual favourite control only
                   * until connected to Tetamo
                   * favourites data.
                   */
                }}
              >
                <Heart
                  color={BLACK}
                  size={18}
                />
              </Pressable>
            </View>

            <View
              style={styles.cardBrand}
            >
              <Image
                source={tetamoLogo}
                style={
                  styles.cardBrandLogo
                }
                resizeMode="contain"
              />

              <Text
                style={
                  styles.cardBrandText
                }
              >
                TETAMO
              </Text>
            </View>
          </ImageBackground>
        ) : (
          <View
            style={
              styles.propertyPlaceholder
            }
          >
            <Building2
              color="#B5ADA2"
              size={36}
            />

            <Text
              style={
                styles.propertyPlaceholderText
              }
            >
              TETAMO
            </Text>

            <Pressable
              style={[
                styles.cardHeartButton,
                styles.placeholderHeart,
              ]}
              onPress={(event: any) => {
                event.stopPropagation?.();
              }}
            >
              <Heart
                color={BLACK}
                size={18}
              />
            </Pressable>
          </View>
        )}
      </View>

      {/* =================================
          PROPERTY INFO
      ================================= */}

      <View style={styles.resultBody}>
        <View
          style={styles.typeCodeRow}
        >
          {propertyTypeLabel ? (
            <View
              style={styles.typePill}
            >
              <Building2
                color={GOLD_DARK}
                size={11}
              />

              <Text
                style={
                  styles.typePillText
                }
                numberOfLines={1}
              >
                {propertyTypeLabel}
              </Text>
            </View>
          ) : null}

          {property.kode ? (
            <View
              style={styles.typePill}
            >
              <Hash
                color={GOLD_DARK}
                size={11}
              />

              <Text
                style={
                  styles.typePillText
                }
                numberOfLines={1}
              >
                {property.kode}
              </Text>
            </View>
          ) : null}
        </View>

        <Text
          style={styles.resultPrice}
          numberOfLines={1}
        >
          {formatPrice(
            property.priceIdr,
            property.rentalType
          )}
        </Text>

        <Text
          style={styles.resultName}
          numberOfLines={2}
        >
          {title}
        </Text>

        {location ? (
          <View
            style={
              styles.resultLocationRow
            }
          >
            <MapPin
              color={GOLD_DARK}
              size={13}
            />

            <Text
              style={
                styles.resultLocationText
              }
              numberOfLines={1}
            >
              {location}
            </Text>
          </View>
        ) : null}

        {(beds > 0 ||
          baths > 0 ||
          size > 0) && (
          <View style={styles.specRow}>
            {beds > 0 ? (
              <Spec
                icon={
                  <BedDouble
                    color={GOLD_DARK}
                    size={13}
                  />
                }
                value={beds}
              />
            ) : null}

            {baths > 0 ? (
              <Spec
                icon={
                  <Bath
                    color={GOLD_DARK}
                    size={13}
                  />
                }
                value={baths}
              />
            ) : null}

            {size > 0 ? (
              <Spec
                icon={
                  <Ruler
                    color={GOLD_DARK}
                    size={13}
                  />
                }
                value={`${formatNumber(
                  size
                )} m²`}
              />
            ) : null}
          </View>
        )}

        <View style={styles.actionRow}>
          <Pressable
            style={styles.whatsappButton}
            onPress={(event: any) => {
              event.stopPropagation?.();
              onWhatsapp();
            }}
          >
            <MessageCircle
              color="#14834B"
              size={15}
            />

            <Text
              style={
                styles.whatsappButtonText
              }
            >
              {labels.whatsapp}
            </Text>
          </Pressable>

          <Pressable
            style={styles.scheduleButton}
            onPress={(event: any) => {
              event.stopPropagation?.();
              onSchedule();
            }}
          >
            <CalendarDays
              color={BLACK}
              size={15}
            />

            <Text
              style={
                styles.scheduleButtonText
              }
            >
              {labels.schedule}
            </Text>
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
}

/*
 * =================================================
 * BADGES
 * =================================================
 */

function StatusBadge({
  label,
  background,
  color,
}: {
  label: string;
  background: string;
  color: string;
}) {
  return (
    <View
      style={[
        styles.statusBadge,
        {
          backgroundColor: background,
        },
      ]}
    >
      <Text
        style={[
          styles.statusBadgeText,
          { color },
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

function getBadgesForProperty({
  property,
  language,
  labels,
}: {
  property: TetamoProperty;
  language: Language;
  labels: (typeof copy)["en"];
}) {
  const badges: {
    key: string;
    label: string;
    background: string;
    color: string;
  }[] = [];

  const badge = normalizeText(
    property.badge || ""
  );

  /*
   * LISTING TYPE
   */

  if (isSaleProperty(property)) {
    badges.push({
      key: "sale",
      label: labels.forSale,
      background: BLACK,
      color: WHITE,
    });
  } else if (isRentProperty(property)) {
    badges.push({
      key: "rent",
      label: labels.forRent,
      background: BLACK,
      color: WHITE,
    });
  }

  /*
   * RENTAL TYPE
   */

  const rentalLabel =
    getRentalTypeLabel(
      property.rentalType,
      language
    );

  if (rentalLabel) {
    badges.push({
      key: "rental-type",
      label: rentalLabel,
      background: "#EFE8FB",
      color: "#6845A4",
    });
  }

  /*
   * PROMOTION
   * Spotlight > Featured > Boost
   */

  if (badge.includes("spotlight")) {
    badges.push({
      key: "spotlight",
      label: labels.spotlight,
      background: "#D8F1F5",
      color: "#17616C",
    });
  } else if (
    badge.includes("featured")
  ) {
    badges.push({
      key: "featured",
      label: labels.featured,
      background: "#E5C568",
      color: BLACK,
    });
  } else if (
    badge.includes("boost")
  ) {
    badges.push({
      key: "boost",
      label: labels.boost,
      background: "#F0C397",
      color: "#704014",
    });
  }

  /*
   * VERIFIED
   * Do NOT mark every promoted listing
   * as verified.
   */

  const propertyAny =
    property as any;

  const verified =
    badge.includes("verified") ||
    propertyAny.verified === true ||
    propertyAny.isVerified === true ||
    propertyAny.verifiedOk === true ||
    propertyAny.verified_ok === true;

  if (verified) {
    badges.push({
      key: "verified",
      label: labels.verified,
      background: "#E5F6EA",
      color: "#287A48",
    });
  }

  return badges.slice(0, 4);
}

/*
 * =================================================
 * SPECS
 * =================================================
 */

function Spec({
  icon,
  value,
}: {
  icon: ReactNode;
  value: string | number;
}) {
  return (
    <View style={styles.specPill}>
      {icon}

      <Text style={styles.specText}>
        {value}
      </Text>
    </View>
  );
}

/*
 * =================================================
 * HELPERS
 * =================================================
 */

function readParam(value: unknown) {
  if (Array.isArray(value)) {
    return String(value[0] || "");
  }

  return String(value || "");
}

function cleanString(
  value?: string | null
) {
  return String(value || "").trim();
}

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .replace(/\./g, "")
    .replace(/,/g, "")
    .replace(/\//g, " ")
    .replace(/-/g, " ")
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .trim();
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

function normalizeListingType(
  value?: string | null
): ListingType {
  const v = normalizeText(
    String(value || "")
  );

  if (
    v === "sale" ||
    v === "sell" ||
    v === "dijual" ||
    v === "jual"
  ) {
    return "dijual";
  }

  if (
    v === "rent" ||
    v === "rental" ||
    v === "disewa" ||
    v === "sewa"
  ) {
    return "disewa";
  }

  return "";
}

function normalizeRentalType(
  value?: string | null
): RentalType {
  const v = normalizeText(
    String(value || "")
  );

  if (
    v === "daily" ||
    v === "harian"
  ) {
    return "daily";
  }

  if (
    v === "monthly" ||
    v === "bulanan"
  ) {
    return "monthly";
  }

  if (
    v === "yearly" ||
    v === "tahunan" ||
    v === "annual"
  ) {
    return "yearly";
  }

  return "";
}

function normalizeSaleType(
  value?: string | null
): SaleType {
  const v = String(value || "")
    .trim()
    .toLowerCase();

  if (v === "freehold") {
    return "freehold";
  }

  if (v === "leasehold") {
    return "leasehold";
  }

  if (v === "hgb") {
    return "hgb";
  }

  if (
    v === "hak_pakai" ||
    v === "hak pakai"
  ) {
    return "hak_pakai";
  }

  if (v === "lainnya") {
    return "lainnya";
  }

  return "";
}

function normalizePriceRange(
  value?: string | null
): PriceRange {
  const v = String(
    value || ""
  ) as PriceRange;

  if (
    v === "<100jt" ||
    v === "100jt-500jt" ||
    v === "500jt-1m" ||
    v === "1m-3m" ||
    v === ">3m"
  ) {
    return v;
  }

  return "";
}

function normalizeSort(
  value?: string | null
): SortOption {
  if (
    value === "relevan" ||
    value === "terbaru" ||
    value === "harga-rendah" ||
    value === "harga-tinggi"
  ) {
    return value;
  }

  return "relevan";
}

function getTitle(
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

function formatPricePlain(
  value?: number
) {
  if (!value || value <= 0) {
    return "Price on Request";
  }

  return `Rp ${Math.round(
    value
  ).toLocaleString("id-ID")}`;
}

function isSaleProperty(
  property: TetamoProperty
) {
  return (
    normalizeListingType(
      property.listingType
    ) === "dijual"
  );
}

function isRentProperty(
  property: TetamoProperty
) {
  return (
    normalizeListingType(
      property.listingType
    ) === "disewa"
  );
}

function getPriceRange(
  value: number
): PriceRange {
  if (value < 100_000_000) {
    return "<100jt";
  }

  if (value < 500_000_000) {
    return "100jt-500jt";
  }

  if (value < 1_000_000_000) {
    return "500jt-1m";
  }

  if (value <= 3_000_000_000) {
    return "1m-3m";
  }

  return ">3m";
}

function formatPriceRangeLabel(
  value: PriceRange,
  language: Language
) {
  if (value === "<100jt") {
    return language === "id"
      ? "< 100 Juta"
      : "< IDR 100M";
  }

  if (value === "100jt-500jt") {
    return language === "id"
      ? "100–500 Juta"
      : "IDR 100–500M";
  }

  if (value === "500jt-1m") {
    return language === "id"
      ? "500 Juta–1 M"
      : "IDR 500M–1B";
  }

  if (value === "1m-3m") {
    return language === "id"
      ? "1–3 Miliar"
      : "IDR 1–3B";
  }

  if (value === ">3m") {
    return language === "id"
      ? "> 3 Miliar"
      : "> IDR 3B";
  }

  return "";
}

function formatPropertyType(
  value?: string | null,
  language?: Language
) {
  const raw = normalizeText(
    String(value || "")
  );

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
    raw === "villa" ||
    raw === "vila"
  ) {
    return "Villa";
  }

  if (raw === "studio") {
    return "Studio";
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

  if (raw === "rukan") {
    return language === "id"
      ? "Rukan"
      : "Office Unit";
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
    raw === "kost" ||
    raw === "kos"
  ) {
    return language === "id"
      ? "Kost"
      : "Boarding House";
  }

  if (raw === "guesthouse") {
    return "Guesthouse";
  }

  if (raw === "hotel") {
    return "Hotel";
  }

  if (raw === "resort") {
    return "Resort";
  }

  if (raw === "pabrik") {
    return language === "id"
      ? "Pabrik"
      : "Factory";
  }

  if (raw === "toko") {
    return language === "id"
      ? "Toko"
      : "Shop";
  }

  if (raw === "rukos") {
    return language === "id"
      ? "Rukos"
      : "Shop-Boarding House";
  }

  return raw
    .split(" ")
    .map(
      (word) =>
        word.charAt(0).toUpperCase() +
        word.slice(1)
    )
    .join(" ");
}

function getRentalTypeLabel(
  value?: string | null,
  language?: Language
) {
  const rental =
    normalizeRentalType(value);

  if (rental === "daily") {
    return language === "id"
      ? "Harian"
      : "Daily";
  }

  if (rental === "monthly") {
    return language === "id"
      ? "Bulanan"
      : "Monthly";
  }

  if (rental === "yearly") {
    return language === "id"
      ? "Tahunan"
      : "Yearly";
  }

  return "";
}

function getSaleTypeLabel(
  value?: string | null,
  language?: Language
) {
  const sale =
    normalizeSaleType(value);

  if (sale === "freehold") {
    return "Freehold";
  }

  if (sale === "leasehold") {
    return "Leasehold";
  }

  if (sale === "hgb") {
    return "HGB";
  }

  if (sale === "hak_pakai") {
    return language === "id"
      ? "Hak Pakai"
      : "Right to Use";
  }

  if (sale === "lainnya") {
    return language === "id"
      ? "Lainnya"
      : "Other";
  }

  return "";
}

function formatNumber(
  value?: number
) {
  if (
    typeof value !== "number" ||
    Number.isNaN(value)
  ) {
    return "";
  }

  return value.toLocaleString("id-ID");
}

/*
 * =================================================
 * SEARCH INDEX
 * =================================================
 */

function buildSearchableText(
  property: TetamoProperty
) {
  return normalizeText(`
    ${property.titleEn}
    ${property.titleId}
    ${property.descriptionEn}
    ${property.descriptionId}
    ${property.kode}
    ${property.location}
    ${property.area}
    ${property.city}
    ${property.province}
    ${property.country}
    ${property.address}
    ${property.listingType}
    ${property.rentalType}
    ${getRentalTypeLabel(property.rentalType, "id")}
    ${getRentalTypeLabel(property.rentalType, "en")}
    ${property.saleType}
    ${getSaleTypeLabel(property.saleType, "id")}
    ${getSaleTypeLabel(property.saleType, "en")}
    ${property.propertyType}
    ${formatPropertyType(property.propertyType, "id")}
    ${formatPropertyType(property.propertyType, "en")}
    ${property.priceIdr}
    ${property.beds}
    ${property.baths}
    ${property.size}
    ${property.buildingSize}
    ${property.furnishing}
    ${property.certificate}
    ${property.contactName}
    ${property.contactAgency}
    ${property.badge}
    ${property.roadAccess}
    ${property.zoningType}
    ${property.landType}
    ${property.ownershipType}
  `);
}

function getTierBoost(
  property: TetamoProperty
) {
  const badge = normalizeText(
    property.badge || ""
  );

  if (badge.includes("spotlight")) {
    return 300;
  }

  if (badge.includes("featured")) {
    return 200;
  }

  if (badge.includes("boost")) {
    return 100;
  }

  return 0;
}

function calculateRelevanceScore(
  property: TetamoProperty,
  query: string
) {
  const normalizedQuery =
    normalizeText(query);

  /*
   * When no query is entered,
   * recommendation order uses promotion tier,
   * not public view counts.
   */

  if (!normalizedQuery) {
    return getTierBoost(property);
  }

  const words =
    normalizedQuery
      .split(" ")
      .filter(Boolean);

  const searchable =
    buildSearchableText(property);

  const normalizedCode =
    normalizeText(
      property.kode || ""
    );

  const normalizedTitle =
    normalizeText(
      `${property.titleEn || ""} ${
        property.titleId || ""
      }`
    );

  const normalizedArea =
    normalizeText(
      property.area || ""
    );

  const normalizedProvince =
    normalizeText(
      property.province || ""
    );

  const normalizedAgency =
    normalizeText(
      property.contactAgency || ""
    );

  const normalizedAgent =
    normalizeText(
      property.contactName || ""
    );

  const normalizedRental =
    normalizeText(
      `${
        property.rentalType || ""
      } ${getRentalTypeLabel(
        property.rentalType,
        "id"
      )} ${getRentalTypeLabel(
        property.rentalType,
        "en"
      )}`
    );

  const normalizedSale =
    normalizeText(
      `${
        property.saleType || ""
      } ${getSaleTypeLabel(
        property.saleType,
        "id"
      )} ${getSaleTypeLabel(
        property.saleType,
        "en"
      )}`
    );

  let score = 0;

  if (
    normalizedCode ===
    normalizedQuery
  ) {
    score += 5000;
  }

  if (
    normalizedCode.startsWith(
      normalizedQuery
    )
  ) {
    score += 2200;
  }

  if (
    normalizedTitle ===
    normalizedQuery
  ) {
    score += 1800;
  }

  if (
    normalizedTitle.includes(
      normalizedQuery
    )
  ) {
    score += 1000;
  }

  if (
    normalizedArea ===
    normalizedQuery
  ) {
    score += 900;
  }

  if (
    normalizedProvince ===
    normalizedQuery
  ) {
    score += 800;
  }

  if (
    `${normalizedArea} ${normalizedProvince}`.includes(
      normalizedQuery
    )
  ) {
    score += 700;
  }

  if (
    normalizedRental.includes(
      normalizedQuery
    )
  ) {
    score += 300;
  }

  if (
    normalizedSale.includes(
      normalizedQuery
    )
  ) {
    score += 300;
  }

  for (const word of words) {
    if (
      normalizedCode.includes(word)
    ) {
      score += 250;
    }

    if (
      normalizedTitle.includes(word)
    ) {
      score += 160;
    }

    if (
      normalizedArea.includes(word)
    ) {
      score += 120;
    }

    if (
      normalizedProvince.includes(
        word
      )
    ) {
      score += 100;
    }

    if (
      normalizedRental.includes(word)
    ) {
      score += 90;
    }

    if (
      normalizedSale.includes(word)
    ) {
      score += 90;
    }

    if (
      normalizedAgency.includes(word)
    ) {
      score += 70;
    }

    if (
      normalizedAgent.includes(word)
    ) {
      score += 60;
    }

    if (searchable.includes(word)) {
      score += 25;
    }
  }

  if (
    words.length > 0 &&
    words.every((word) =>
      searchable.includes(word)
    )
  ) {
    score += 220;
  }

  if (
    normalizedQuery.includes("dijual") &&
    isSaleProperty(property)
  ) {
    score += 120;
  }

  if (
    normalizedQuery.includes("disewa") &&
    isRentProperty(property)
  ) {
    score += 120;
  }

  if (
    (normalizedQuery.includes("harian") ||
      normalizedQuery.includes("daily")) &&
    normalizeRentalType(
      property.rentalType
    ) === "daily"
  ) {
    score += 160;
  }

  if (
    (normalizedQuery.includes("bulanan") ||
      normalizedQuery.includes("monthly")) &&
    normalizeRentalType(
      property.rentalType
    ) === "monthly"
  ) {
    score += 160;
  }

  if (
    (normalizedQuery.includes("tahunan") ||
      normalizedQuery.includes("yearly")) &&
    normalizeRentalType(
      property.rentalType
    ) === "yearly"
  ) {
    score += 160;
  }

  if (
    normalizedQuery.includes("freehold") &&
    normalizeSaleType(
      property.saleType
    ) === "freehold"
  ) {
    score += 160;
  }

  if (
    normalizedQuery.includes("leasehold") &&
    normalizeSaleType(
      property.saleType
    ) === "leasehold"
  ) {
    score += 160;
  }

  /*
   * Paid marketplace promotion remains
   * a secondary relevance boost.
   */

  score += getTierBoost(property);

  return score;
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
   * HEADER
   */

  header: {
    minHeight: 58,

    paddingHorizontal: 12,
    paddingVertical: 8,

    flexDirection: "row",
    alignItems: "center",

    gap: 8,

    backgroundColor: CREAM,

    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },

  backButton: {
    width: 38,
    height: 38,

    borderRadius: 13,

    alignItems: "center",
    justifyContent: "center",

    backgroundColor: WHITE,

    borderWidth: 1,
    borderColor: BORDER,
  },

  headerTitle: {
    color: BLACK,

    fontSize: 17,
    fontWeight: "900",
  },

  headerUtilities: {
    flex: 1,

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",

    gap: 5,
  },

  utilityGroup: {
    minHeight: 36,

    paddingHorizontal: 3,

    borderRadius: 12,

    flexDirection: "row",
    alignItems: "center",

    gap: 1,

    backgroundColor: WHITE,

    borderWidth: 1,
    borderColor: BORDER,
  },

  languageSegment: {
    width: 27,
    height: 27,

    borderRadius: 8,

    alignItems: "center",
    justifyContent: "center",
  },

  currencySegment: {
    minWidth: 29,
    height: 27,

    paddingHorizontal: 3,

    borderRadius: 8,

    alignItems: "center",
    justifyContent: "center",
  },

  utilitySegmentActive: {
    backgroundColor: GOLD_ACTIVE,
  },

  utilityText: {
    color: "#928B82",

    fontSize: 7.7,
    fontWeight: "800",
  },

  currencyText: {
    color: "#928B82",

    fontSize: 6.8,
    fontWeight: "800",
  },

  utilityTextActive: {
    color: BLACK,
    fontWeight: "900",
  },

  /*
   * MAIN
   */

  scroll: {
    flex: 1,
    backgroundColor: CREAM,
  },

  content: {
    paddingHorizontal: 16,
    paddingTop: 14,

    /*
     * Leave room for custom Tetamo footer.
     */
    paddingBottom: 125,
  },

  /*
   * SEARCH HERO
   */

  searchHero: {
    padding: 15,

    borderRadius: 22,

    backgroundColor: WHITE,

    borderWidth: 1,
    borderColor: BORDER,
  },

  heroTitle: {
    color: BLACK,

    fontSize: 20,
    lineHeight: 25,

    fontWeight: "900",

    letterSpacing: -0.3,
  },

  heroSub: {
    marginTop: 4,

    color: MUTED,

    fontSize: 10.5,
    lineHeight: 15,

    fontWeight: "500",
  },

  /*
   * SEARCH INPUT
   */

  searchRow: {
    marginTop: 14,

    flexDirection: "row",
    alignItems: "center",

    gap: 8,
  },

  searchInputBox: {
    flex: 1,

    minHeight: 47,

    paddingHorizontal: 12,

    borderRadius: 15,

    flexDirection: "row",
    alignItems: "center",

    gap: 8,

    backgroundColor: CREAM,

    borderWidth: 1,
    borderColor: "#DDD6CC",
  },

  searchInput: {
    flex: 1,

    paddingVertical: 0,

    color: BLACK,

    fontSize: 11,
    fontWeight: "600",
  },

  clearSearchButton: {
    width: 27,
    height: 27,

    borderRadius: 9,

    alignItems: "center",
    justifyContent: "center",

    backgroundColor: WHITE,
  },

  searchButton: {
    minWidth: 77,
    minHeight: 47,

    paddingHorizontal: 11,

    borderRadius: 15,

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",

    gap: 5,

    backgroundColor: GOLD_ACTIVE,
  },

  searchButtonText: {
    color: BLACK,

    fontSize: 10,
    fontWeight: "900",
  },

  /*
   * SUGGESTIONS
   */

  suggestionsPanel: {
    marginTop: 9,

    paddingVertical: 5,

    borderRadius: 17,

    overflow: "hidden",

    backgroundColor: CREAM,

    borderWidth: 1,
    borderColor: BORDER,
  },

  suggestionGroup: {
    paddingVertical: 3,
  },

  suggestionGroupTitle: {
    paddingHorizontal: 11,
    paddingVertical: 5,

    color: "#8D867D",

    fontSize: 7.8,
    fontWeight: "900",

    letterSpacing: 0.6,

    textTransform: "uppercase",
  },

  suggestionItem: {
    minHeight: 49,

    paddingHorizontal: 10,
    paddingVertical: 7,

    flexDirection: "row",
    alignItems: "center",

    gap: 9,
  },

  suggestionIcon: {
    width: 32,
    height: 32,

    borderRadius: 10,

    alignItems: "center",
    justifyContent: "center",

    backgroundColor: GOLD_SOFT,
  },

  suggestionTextBox: {
    flex: 1,
  },

  suggestionLabel: {
    color: BLACK,

    fontSize: 10.5,
    fontWeight: "900",
  },

  suggestionSub: {
    marginTop: 2,

    color: MUTED,

    fontSize: 8.5,
    fontWeight: "600",
  },

  noSuggestionText: {
    padding: 12,

    color: MUTED,

    fontSize: 10,
    fontWeight: "600",
  },

  /*
   * LISTING TYPE TABS
   */

  listingTabs: {
    marginTop: 13,

    flexDirection: "row",
    alignItems: "center",

    gap: 7,
  },

  listingTab: {
    minHeight: 35,

    paddingHorizontal: 13,

    borderRadius: 999,

    alignItems: "center",
    justifyContent: "center",

    backgroundColor: SOFT,

    borderWidth: 1,
    borderColor: "#E7E0D5",
  },

  listingTabActive: {
    backgroundColor: BLACK,
    borderColor: BLACK,
  },

  listingTabText: {
    color: "#6F6961",

    fontSize: 9.5,
    fontWeight: "900",
  },

  listingTabTextActive: {
    color: WHITE,
  },

  /*
   * QUICK FILTER GRID
   */

  quickFilterGrid: {
    marginTop: 11,

    flexDirection: "row",
    flexWrap: "wrap",

    justifyContent: "space-between",

    rowGap: 7,
  },

  quickFilter: {
    width: "49%",

    minHeight: 42,

    paddingHorizontal: 8,

    borderRadius: 13,

    flexDirection: "row",
    alignItems: "center",

    gap: 6,

    backgroundColor: CREAM,

    borderWidth: 1,
    borderColor: BORDER,
  },

  quickFilterActive: {
    backgroundColor: "#F7EBC6",
    borderColor: "#E4CE8F",
  },

  quickFilterIcon: {
    width: 27,
    height: 27,

    borderRadius: 9,

    alignItems: "center",
    justifyContent: "center",

    backgroundColor: WHITE,
  },

  quickFilterIconActive: {
    backgroundColor: GOLD_ACTIVE,
  },

  quickFilterText: {
    flex: 1,

    color: "#69635C",

    fontSize: 8.8,
    fontWeight: "800",
  },

  quickFilterTextActive: {
    color: BLACK,
    fontWeight: "900",
  },

  /*
   * FILTER ACTIONS
   */

  filterActionRow: {
    marginTop: 11,

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",

    gap: 8,
  },

  moreFilterButton: {
    minHeight: 35,

    paddingHorizontal: 11,

    borderRadius: 999,

    flexDirection: "row",
    alignItems: "center",

    gap: 5,

    backgroundColor: GOLD_ACTIVE,
  },

  moreFilterText: {
    color: BLACK,

    fontSize: 9,
    fontWeight: "900",
  },

  clearFilterButton: {
    minHeight: 35,

    paddingHorizontal: 11,

    borderRadius: 999,

    alignItems: "center",
    justifyContent: "center",

    backgroundColor: CREAM,

    borderWidth: 1,
    borderColor: BORDER,
  },

  clearFilterText: {
    color: GOLD_DARK,

    fontSize: 8.8,
    fontWeight: "900",
  },

  /*
   * ADVANCED FILTERS
   */

  advancedFilters: {
    marginTop: 11,

    paddingTop: 3,

    borderTopWidth: 1,
    borderTopColor: "#EEE8DF",
  },

  optionBlock: {
    marginTop: 11,
  },

  optionLabel: {
    marginBottom: 7,

    color: "#8D867D",

    fontSize: 8,
    fontWeight: "900",

    letterSpacing: 0.4,

    textTransform: "uppercase",
  },

  optionRow: {
    gap: 6,
    paddingRight: 3,
  },

  optionChip: {
    minHeight: 33,

    paddingHorizontal: 10,

    borderRadius: 999,

    alignItems: "center",
    justifyContent: "center",

    backgroundColor: CREAM,

    borderWidth: 1,
    borderColor: BORDER,
  },

  optionChipActive: {
    backgroundColor: GOLD_ACTIVE,
    borderColor: "#E2C765",
  },

  optionChipText: {
    color: "#69635C",

    fontSize: 8.7,
    fontWeight: "800",
  },

  optionChipTextActive: {
    color: BLACK,
    fontWeight: "900",
  },

  /*
   * RESULTS HEADER
   */

  resultsHeader: {
    marginTop: 20,

    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },

  resultsTitleBox: {
    flex: 1,
  },

  resultsTitle: {
    color: BLACK,

    fontSize: 18,
    fontWeight: "900",

    letterSpacing: -0.2,
  },

  resultsCount: {
    marginTop: 3,

    color: MUTED,

    fontSize: 9.5,
    fontWeight: "600",
  },

  queryPill: {
    alignSelf: "flex-start",

    maxWidth: "85%",

    minHeight: 27,

    marginTop: 7,

    paddingHorizontal: 8,

    borderRadius: 999,

    flexDirection: "row",
    alignItems: "center",

    gap: 5,

    backgroundColor: GOLD_SOFT,
  },

  queryPillText: {
    flexShrink: 1,

    color: "#68552D",

    fontSize: 8.5,
    fontWeight: "800",
  },

  /*
   * SORT
   */

  sortRow: {
    marginTop: 11,
    marginBottom: 12,

    gap: 6,
    paddingRight: 5,
  },

  sortChip: {
    minHeight: 33,

    paddingHorizontal: 11,

    borderRadius: 999,

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
    color: "#69635C",

    fontSize: 8.8,
    fontWeight: "800",
  },

  sortChipTextActive: {
    color: WHITE,
    fontWeight: "900",
  },

  /*
   * RESULT LIST
   */

  resultList: {
    gap: 13,
  },

  resultCard: {
    overflow: "hidden",

    borderRadius: 22,

    backgroundColor: WHITE,

    borderWidth: 1,
    borderColor: BORDER,
  },

  /*
   * RESULT IMAGE
   */

  resultImageWrap: {
    height: 226,

    backgroundColor: "#EEEAE3",
  },

  resultImage: {
    flex: 1,

    padding: 11,

    justifyContent: "space-between",
  },

  resultImageRadius: {
    borderTopLeftRadius: 21,
    borderTopRightRadius: 21,
  },

  propertyPlaceholder: {
    flex: 1,

    position: "relative",

    alignItems: "center",
    justifyContent: "center",

    gap: 6,

    backgroundColor: "#EEEAE3",
  },

  propertyPlaceholderText: {
    color: "#A8A097",

    fontSize: 9,
    fontWeight: "900",

    letterSpacing: 1.5,
  },

  placeholderHeart: {
    position: "absolute",

    top: 11,
    right: 11,
  },

  /*
   * BADGES + HEART
   */

  cardTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",

    gap: 8,
  },

  badgeRow: {
    flex: 1,

    flexDirection: "row",
    flexWrap: "wrap",

    gap: 5,
  },

  statusBadge: {
    minHeight: 24,

    paddingHorizontal: 8,

    borderRadius: 999,

    alignItems: "center",
    justifyContent: "center",
  },

  statusBadgeText: {
    fontSize: 7.5,
    fontWeight: "900",
  },

  cardHeartButton: {
    width: 36,
    height: 36,

    borderRadius: 13,

    alignItems: "center",
    justifyContent: "center",

    backgroundColor: "rgba(255,255,255,0.94)",
  },

  /*
   * TETAMO BRAND ON PHOTO
   */

  cardBrand: {
    alignSelf: "flex-start",

    minHeight: 27,

    paddingLeft: 5,
    paddingRight: 9,

    borderRadius: 999,

    flexDirection: "row",
    alignItems: "center",

    gap: 5,

    backgroundColor: "rgba(17,17,17,0.82)",
  },

  cardBrandLogo: {
    width: 17,
    height: 17,
  },

  cardBrandText: {
    color: WHITE,

    fontSize: 7.3,
    fontWeight: "900",

    letterSpacing: 0.8,
  },

  /*
   * RESULT BODY
   */

  resultBody: {
    padding: 13,
  },

  typeCodeRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",

    gap: 5,
  },

  typePill: {
    minHeight: 27,

    paddingHorizontal: 8,

    borderRadius: 999,

    flexDirection: "row",
    alignItems: "center",

    gap: 4,

    backgroundColor: SOFT,
  },

  typePillText: {
    maxWidth: 145,

    color: "#625D56",

    fontSize: 8.2,
    fontWeight: "800",
  },

  resultPrice: {
    marginTop: 10,

    color: BLACK,

    fontSize: 16,
    lineHeight: 20,

    fontWeight: "900",

    letterSpacing: -0.15,
  },

  resultName: {
    marginTop: 4,

    color: "#292622",

    fontSize: 13,
    lineHeight: 18,

    fontWeight: "900",
  },

  resultLocationRow: {
    marginTop: 7,

    flexDirection: "row",
    alignItems: "center",

    gap: 4,
  },

  resultLocationText: {
    flex: 1,

    color: MUTED,

    fontSize: 9.3,
    fontWeight: "600",
  },

  /*
   * PROPERTY SPECS
   */

  specRow: {
    marginTop: 10,

    flexDirection: "row",
    flexWrap: "wrap",

    gap: 6,
  },

  specPill: {
    minHeight: 30,

    paddingHorizontal: 8,

    borderRadius: 10,

    flexDirection: "row",
    alignItems: "center",

    gap: 4,

    backgroundColor: SOFT,
  },

  specText: {
    color: "#554F48",

    fontSize: 8.8,
    fontWeight: "900",
  },

  /*
   * PROPERTY ACTIONS
   */

  actionRow: {
    marginTop: 12,

    flexDirection: "row",

    gap: 7,
  },

  whatsappButton: {
    flex: 1,

    minHeight: 40,

    borderRadius: 13,

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",

    gap: 5,

    backgroundColor: "#F2FAF4",

    borderWidth: 1,
    borderColor: "#D4E9DB",
  },

  whatsappButtonText: {
    color: "#175B32",

    fontSize: 9.5,
    fontWeight: "900",
  },

  scheduleButton: {
    flex: 1,

    minHeight: 40,

    borderRadius: 13,

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",

    gap: 5,

    backgroundColor: GOLD_ACTIVE,
  },

  scheduleButtonText: {
    color: BLACK,

    fontSize: 9.5,
    fontWeight: "900",
  },

  /*
   * STATES
   */

  stateCard: {
    minHeight: 170,

    padding: 24,

    borderRadius: 22,

    alignItems: "center",
    justifyContent: "center",

    backgroundColor: WHITE,

    borderWidth: 1,
    borderColor: BORDER,
  },

  stateText: {
    marginTop: 10,

    color: MUTED,

    fontSize: 10.5,
    fontWeight: "700",
  },

  emptyIcon: {
    width: 52,
    height: 52,

    borderRadius: 17,

    alignItems: "center",
    justifyContent: "center",

    backgroundColor: GOLD_SOFT,
  },

  emptyTitle: {
    marginTop: 11,

    color: BLACK,

    fontSize: 15,
    fontWeight: "900",
  },

  emptySub: {
    maxWidth: 260,

    marginTop: 5,

    color: MUTED,

    fontSize: 9.5,
    lineHeight: 14,

    fontWeight: "500",

    textAlign: "center",
  },

  /*
   * LOAD MORE
   */

  showingText: {
    marginTop: 13,

    color: MUTED,

    fontSize: 9,
    fontWeight: "600",

    textAlign: "center",
  },

  loadMoreButton: {
    minHeight: 45,

    marginTop: 10,

    borderRadius: 14,

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",

    gap: 5,

    backgroundColor: GOLD_ACTIVE,
  },

  loadMoreText: {
    color: BLACK,

    fontSize: 10,
    fontWeight: "900",
  },
});