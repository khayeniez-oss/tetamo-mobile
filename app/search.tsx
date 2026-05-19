import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
  ArrowLeft,
  Bath,
  BedDouble,
  Building2,
  CalendarDays,
  Camera,
  ChevronRight,
  Eye,
  Hash,
  Home,
  MapPin,
  MessageCircle,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react-native";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
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
type SaleType = "" | "freehold" | "leasehold" | "hgb" | "hak_pakai" | "lainnya";
type SortOption = "relevan" | "terbaru" | "harga-rendah" | "harga-tinggi";
type PriceRange = "" | "<100jt" | "100jt-500jt" | "500jt-1m" | "1m-3m" | ">3m";

type SuggestionItem = {
  id: string;
  type: "kode" | "location" | "property";
  label: string;
  sublabel?: string;
  query: string;
  property?: TetamoProperty;
};

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?q=80&w=1400&auto=format&fit=crop";

const TETAMO_FALLBACK_WHATSAPP =
  process.env.EXPO_PUBLIC_TETAMO_FALLBACK_WHATSAPP || "";

const ITEMS_PER_PAGE = 12;

const currencyRates: Record<Currency, number> = {
  IDR: 1,
  USD: 0.000061,
  AUD: 0.000094,
};

const copy = {
  en: {
    title: "Search Results",
    allProperties: "Showing all available properties.",
    foundFor: "properties found for",
    loading: "Loading properties...",
    failed: "Failed to load properties.",
    empty: "No properties found.",
    emptySub: "Try another keyword, area, price, or property filter.",
    search: "Search",
    searchPlaceholder:
      "Search location, listing code, project, price, agent, certificate...",
    noSuggestion: "No search suggestions.",
    listingCode: "Listing Code",
    location: "Location",
    property: "Property",
    filters: "Filters",
    listingType: "Listing Type",
    rentalType: "Rental Type",
    saleType: "Sale Type",
    province: "Province",
    area: "Area",
    bedroom: "Bedrooms",
    price: "Price",
    sort: "Sort By",
    allListing: "All Listings",
    forSale: "For Sale",
    forRent: "For Rent",
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
    allBedroom: "Any Bedroom",
    bedroomPlus: "Bedrooms",
    allPrice: "All Prices",
    mostRelevant: "Most Relevant",
    newest: "Newest",
    lowestPrice: "Lowest Price",
    highestPrice: "Highest Price",
    showing: "Showing",
    from: "of",
    properties: "properties",
    clearFilters: "Clear Filters",
    moreFilters: "More Filters",
    hideFilters: "Hide Filters",
    verified: "Verified",
    boost: "Boost",
    spotlight: "Spotlight",
    featured: "Featured",
    previous: "Previous",
    next: "Next",
    page: "Page",
    whatsapp: "WhatsApp",
    schedule: "Schedule",
    photos: "Photos",
    priceRequest: "Price on Request",
  },
  id: {
    title: "Hasil Pencarian",
    allProperties: "Menampilkan semua properti yang tersedia.",
    foundFor: "properti ditemukan untuk",
    loading: "Memuat properti...",
    failed: "Gagal memuat properti.",
    empty: "Tidak ada properti ditemukan.",
    emptySub: "Coba kata kunci, area, harga, atau filter properti lain.",
    search: "Cari",
    searchPlaceholder:
      "Cari lokasi, kode listing, project, harga, agen, sertifikat...",
    noSuggestion: "Tidak ada saran pencarian.",
    listingCode: "Kode Listing",
    location: "Lokasi",
    property: "Properti",
    filters: "Filter",
    listingType: "Tipe Listing",
    rentalType: "Jenis Sewa",
    saleType: "Status Jual",
    province: "Provinsi",
    area: "Area",
    bedroom: "Kamar",
    price: "Harga",
    sort: "Urutkan",
    allListing: "Semua Listing",
    forSale: "Dijual",
    forRent: "Disewa",
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
    allBedroom: "Semua Kamar",
    bedroomPlus: "Kamar",
    allPrice: "Semua Harga",
    mostRelevant: "Paling Relevan",
    newest: "Terbaru",
    lowestPrice: "Harga Terendah",
    highestPrice: "Harga Tertinggi",
    showing: "Menampilkan",
    from: "dari",
    properties: "properti",
    clearFilters: "Reset Filter",
    moreFilters: "Filter Lainnya",
    hideFilters: "Sembunyikan Filter",
    verified: "Verified",
    boost: "Boost",
    spotlight: "Spotlight",
    featured: "Featured",
    previous: "Sebelumnya",
    next: "Berikutnya",
    page: "Halaman",
    whatsapp: "WhatsApp",
    schedule: "Jadwal",
    photos: "Foto",
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
  const [currentPage, setCurrentPage] = useState(1);

  const t = copy[language];

  useEffect(() => {
    const initialQuery = readParam(params.q) || readParam(params.query);
    const listingTypeParam =
      readParam(params.jenisListing) || readParam(params.listingType);
    const rentalTypeParam = normalizeRentalType(readParam(params.rentalType));
    const saleTypeParam = normalizeSaleType(readParam(params.saleType));
    const provinceParam = readParam(params.province);
    const areaParam = readParam(params.area);
    const bedroomParam = readParam(params.bedroom);
    const categoryParam = readParam(params.category);
    const priceParam = normalizePriceRange(readParam(params.priceRange));
    const sortParam = normalizeSort(readParam(params.sortBy));

    setSearchInput(initialQuery);
    setAppliedQuery(initialQuery);
    setListingType(normalizeListingType(listingTypeParam));
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

  useEffect(() => {
    let isMounted = true;

    async function loadProperties() {
      try {
        setLoadingData(true);
        setErrorMessage("");

        const rows = await fetchHomepageProperties(240);

        if (!isMounted) return;

        setAllProperties(rows);
      } catch (error: any) {
        console.log("Tetamo mobile search fetch error:", error);

        if (!isMounted) return;

        setAllProperties([]);
        setErrorMessage(error?.message || t.failed);
      } finally {
        if (isMounted) {
          setLoadingData(false);
        }
      }
    }

    loadProperties();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    setCurrentPage(1);
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

  const provinces = useMemo(() => {
    return Array.from(
      new Set(
        allProperties.map((item) => cleanString(item.province)).filter(Boolean),
      ),
    ).sort();
  }, [allProperties]);

  const areas = useMemo(() => {
    const base = province
      ? allProperties.filter((item) => item.province === province)
      : allProperties;

    return Array.from(
      new Set(
        base.map((item) => cleanString(item.area || item.city)).filter(Boolean),
      ),
    ).sort();
  }, [allProperties, province]);

  const propertyTypes = useMemo(() => {
    return Array.from(
      new Set(
        allProperties
          .map((item) => formatPropertyType(item.propertyType, language))
          .filter(Boolean),
      ),
    ).sort();
  }, [allProperties, language]);

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
      .filter(({ item }) => normalizeText(item.kode || "").includes(q))
      .slice(0, 3)
      .map(({ item }) => ({
        id: `kode-${item.id}`,
        type: "kode" as const,
        label: item.kode || "-",
        sublabel: `${getTitle(item, language)} • ${item.location}`,
        query: item.kode || "",
        property: item,
      }));

    const lokasiValues = Array.from(
      new Set(
        allProperties.flatMap((item) => [
          cleanString(
            `${item.area || item.city || ""}, ${item.province || ""}`,
          ),
          cleanString(item.area),
          cleanString(item.city),
          cleanString(item.province),
        ]),
      ),
    ).filter(Boolean);

    const lokasi = lokasiValues
      .filter((value) => normalizeText(value).includes(q))
      .slice(0, 5)
      .map((value, index) => ({
        id: `lokasi-${index}-${value}`,
        type: "location" as const,
        label: value,
        query: value,
      }));

    const properti = scored.slice(0, 6).map(({ item }) => ({
      id: `property-${item.id}`,
      type: "property" as const,
      label: getTitle(item, language),
      sublabel: `${item.location} • ${formatPricePlain(item.priceIdr)}`,
      query: getTitle(item, language),
      property: item,
    }));

    return { kode, lokasi, properti };
  }, [allProperties, language, searchInput]);

  const hasAutocompleteResults =
    autocompleteGroups.kode.length > 0 ||
    autocompleteGroups.lokasi.length > 0 ||
    autocompleteGroups.properti.length > 0;

  const filteredResults = useMemo(() => {
    const normalizedQuery = normalizeText(appliedQuery);

    let result = allProperties
      .map((item, index) => ({
        item,
        index,
        relevanceScore: calculateRelevanceScore(item, normalizedQuery),
      }))
      .filter(({ item, relevanceScore }) => {
        const searchable = buildSearchableText(item);
        const matchesQuery =
          !normalizedQuery ||
          relevanceScore > 0 ||
          searchable.includes(normalizedQuery);

        const matchesListing =
          !listingType ||
          (listingType === "dijual" && isSaleProperty(item)) ||
          (listingType === "disewa" && isRentProperty(item));

        const matchesRental =
          !rentalType ||
          (isRentProperty(item) &&
            normalizeRentalType(item.rentalType) === rentalType);

        const matchesSale =
          !saleType ||
          (isSaleProperty(item) &&
            normalizeSaleType(item.saleType) === saleType);

        const matchesProvince = !province || item.province === province;

        const matchesArea =
          !area ||
          item.area === area ||
          item.city === area ||
          normalizeText(item.location).includes(normalizeText(area));

        const matchesBedroom =
          !bedroom || Number(item.beds || 0) >= Number(bedroom);

        const matchesPrice =
          !priceRange || getPriceRange(item.priceIdr || 0) === priceRange;

        const matchesCategory =
          !category ||
          normalizeText(item.propertyType || "") === normalizeText(category) ||
          normalizeText(formatPropertyType(item.propertyType, language)) ===
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
      result = [...result].sort(
        (a, b) => (a.item.priceIdr || 0) - (b.item.priceIdr || 0),
      );
    } else if (sortBy === "harga-tinggi") {
      result = [...result].sort(
        (a, b) => (b.item.priceIdr || 0) - (a.item.priceIdr || 0),
      );
    } else if (sortBy === "terbaru") {
      result = [...result].sort((a, b) => a.index - b.index);
    } else {
      result = [...result].sort((a, b) => b.relevanceScore - a.relevanceScore);
    }

    return result.map(({ item }) => item);
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
    language,
  ]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredResults.length / ITEMS_PER_PAGE),
  );
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedResults = filteredResults.slice(
    (safeCurrentPage - 1) * ITEMS_PER_PAGE,
    safeCurrentPage * ITEMS_PER_PAGE,
  );

  const startItem =
    filteredResults.length === 0
      ? 0
      : (safeCurrentPage - 1) * ITEMS_PER_PAGE + 1;

  const endItem = Math.min(
    safeCurrentPage * ITEMS_PER_PAGE,
    filteredResults.length,
  );

  const visiblePages = useMemo(() => {
    const pages: number[] = [];
    const start = Math.max(1, safeCurrentPage - 1);
    const end = Math.min(totalPages, safeCurrentPage + 1);

    for (let i = start; i <= end; i += 1) {
      pages.push(i);
    }

    return pages;
  }, [safeCurrentPage, totalPages]);

  const hasActiveFilters =
    listingType ||
    rentalType ||
    saleType ||
    province ||
    area ||
    bedroom ||
    priceRange ||
    category ||
    sortBy !== "relevan";

  const formatPrice = useMemo(() => {
    return (priceIdr: number, rental?: string | null) => {
      if (!priceIdr || priceIdr <= 0) {
        return t.priceRequest;
      }

      const converted = priceIdr * currencyRates[currency];

      let base =
        currency === "IDR"
          ? `IDR ${Math.round(converted).toLocaleString("id-ID")}`
          : `${currency} ${Math.round(converted).toLocaleString("en-US")}`;

      const normalizedRental = normalizeText(rental || "");

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

  const handleSearch = (customQuery?: string) => {
    const nextQuery = (customQuery ?? searchInput).trim();
    setAppliedQuery(nextQuery);
    setSearchInput(nextQuery);
    setShowSuggestions(false);
  };

  const handleSuggestionPress = (item: SuggestionItem) => {
    setShowSuggestions(false);

    if ((item.type === "property" || item.type === "kode") && item.property) {
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

  const goDetails = (property: TetamoProperty, schedule = false) => {
    const pathKey = encodeURIComponent(property.slug || property.id);
    router.push(`/properti/${pathKey}${schedule ? "?schedule=1" : ""}` as any);
  };

  const openWhatsapp = (property: TetamoProperty) => {
    const phone =
      normalizeWhatsappPhone(property.contactPhone) || TETAMO_FALLBACK_WHATSAPP;

    const title = getTitle(property, language);
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

    Linking.openURL(
      `https://wa.me/${phone}?text=${encodeURIComponent(message)}`,
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
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeft color="#ffffff" size={20} />
          </Pressable>

          <View style={styles.headerTitleBox}>
            <Text style={styles.title}>{t.title}</Text>

            <Text style={styles.subtitle}>
              {appliedQuery ? (
                <>
                  {filteredResults.length} {t.foundFor} "{appliedQuery}"
                </>
              ) : (
                t.allProperties
              )}
            </Text>
          </View>
        </View>

        <View style={styles.topToggles}>
          <View style={styles.toggleGroup}>
            {(["en", "id"] as Language[]).map((item) => (
              <Pressable
                key={item}
                onPress={() => setLanguage(item)}
                style={[
                  styles.toggleItem,
                  language === item && styles.toggleActive,
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

          <View style={styles.currencyGroup}>
            {(["IDR", "USD", "AUD"] as Currency[]).map((item) => (
              <Pressable
                key={item}
                onPress={() => setCurrency(item)}
                style={[
                  styles.currencyItem,
                  currency === item && styles.toggleActive,
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

        <View style={styles.searchPanel}>
          <View style={styles.searchRow}>
            <View style={styles.searchInputBox}>
              <Search color="#ffffff" size={20} />

              <TextInput
                value={searchInput}
                onChangeText={(value) => {
                  setSearchInput(value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                placeholder={t.searchPlaceholder}
                placeholderTextColor="#858585"
                style={styles.searchInput}
                autoCapitalize="none"
                returnKeyType="search"
                onSubmitEditing={() => handleSearch()}
              />

              {searchInput ? (
                <Pressable
                  onPress={() => {
                    setSearchInput("");
                    setAppliedQuery("");
                    setShowSuggestions(false);
                  }}
                >
                  <X color="#ffffff" size={18} />
                </Pressable>
              ) : (
                <SlidersHorizontal color="#ffffff" size={19} />
              )}
            </View>

            <Pressable
              style={styles.searchButton}
              onPress={() => handleSearch()}
            >
              <Text style={styles.searchButtonText}>{t.search}</Text>
            </Pressable>
          </View>

          {showSuggestions && searchInput.trim() ? (
            <View style={styles.suggestionsPanel}>
              {hasAutocompleteResults ? (
                <>
                  <SuggestionGroup
                    title={t.listingCode}
                    icon={<Hash color="#111111" size={15} />}
                    items={autocompleteGroups.kode}
                    onPress={handleSuggestionPress}
                  />

                  <SuggestionGroup
                    title={t.location}
                    icon={<MapPin color="#111111" size={15} />}
                    items={autocompleteGroups.lokasi}
                    onPress={handleSuggestionPress}
                  />

                  <SuggestionGroup
                    title={t.property}
                    icon={<Building2 color="#111111" size={15} />}
                    items={autocompleteGroups.properti}
                    onPress={handleSuggestionPress}
                  />
                </>
              ) : (
                <Text style={styles.noSuggestionText}>{t.noSuggestion}</Text>
              )}
            </View>
          ) : null}

          <View style={styles.mobileTopFilters}>
            <OptionRow
              label={t.listingType}
              value={listingType}
              options={[
                { label: t.allListing, value: "" },
                { label: t.forSale, value: "dijual" },
                { label: t.forRent, value: "disewa" },
              ]}
              onChange={(value) => {
                const next = value as ListingType;
                setListingType(next);

                if (next === "dijual") setRentalType("");
                if (next === "disewa") setSaleType("");
              }}
            />

            <OptionRow
              label={t.sort}
              value={sortBy}
              options={[
                { label: t.mostRelevant, value: "relevan" },
                { label: t.newest, value: "terbaru" },
                { label: t.lowestPrice, value: "harga-rendah" },
                { label: t.highestPrice, value: "harga-tinggi" },
              ]}
              onChange={(value) => setSortBy(value as SortOption)}
            />
          </View>

          <Pressable
            style={styles.moreFilterButton}
            onPress={() => setMoreFiltersOpen((prev) => !prev)}
          >
            <SlidersHorizontal color="#111111" size={15} />
            <Text style={styles.moreFilterText}>
              {moreFiltersOpen ? t.hideFilters : t.moreFilters}
            </Text>
          </Pressable>

          {moreFiltersOpen && (
            <View style={styles.moreFilters}>
              <OptionRow
                label={t.rentalType}
                value={rentalType}
                options={[
                  { label: t.allRentalType, value: "" },
                  { label: t.daily, value: "daily" },
                  { label: t.monthly, value: "monthly" },
                  { label: t.yearly, value: "yearly" },
                ]}
                onChange={(value) => {
                  setRentalType(value as RentalType);
                  if (value) {
                    setListingType("disewa");
                    setSaleType("");
                  }
                }}
              />

              <OptionRow
                label={t.saleType}
                value={saleType}
                options={[
                  { label: t.allSaleType, value: "" },
                  { label: t.freehold, value: "freehold" },
                  { label: t.leasehold, value: "leasehold" },
                  { label: t.hgb, value: "hgb" },
                  { label: t.hakPakai, value: "hak_pakai" },
                  { label: t.lainnya, value: "lainnya" },
                ]}
                onChange={(value) => {
                  setSaleType(value as SaleType);
                  if (value) {
                    setListingType("dijual");
                    setRentalType("");
                  }
                }}
              />

              <OptionRow
                label={t.province}
                value={province}
                options={[
                  { label: t.allProvince, value: "" },
                  ...provinces.map((item) => ({ label: item, value: item })),
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
                  { label: t.allArea, value: "" },
                  ...areas.map((item) => ({ label: item, value: item })),
                ]}
                onChange={setArea}
              />

              <OptionRow
                label={t.property}
                value={category}
                options={[
                  { label: t.property, value: "" },
                  ...propertyTypes.map((item) => ({
                    label: item,
                    value: item,
                  })),
                ]}
                onChange={setCategory}
              />

              <OptionRow
                label={t.bedroom}
                value={bedroom}
                options={[
                  { label: t.allBedroom, value: "" },
                  { label: `1+ ${t.bedroomPlus}`, value: "1" },
                  { label: `2+ ${t.bedroomPlus}`, value: "2" },
                  { label: `3+ ${t.bedroomPlus}`, value: "3" },
                  { label: `4+ ${t.bedroomPlus}`, value: "4" },
                  { label: `5+ ${t.bedroomPlus}`, value: "5" },
                ]}
                onChange={setBedroom}
              />

              <OptionRow
                label={t.price}
                value={priceRange}
                options={[
                  { label: t.allPrice, value: "" },
                  { label: "< 100 Juta", value: "<100jt" },
                  { label: "100 - 500 Juta", value: "100jt-500jt" },
                  { label: "500 Juta - 1 Miliar", value: "500jt-1m" },
                  { label: "1 - 3 Miliar", value: "1m-3m" },
                  { label: "> 3 Miliar", value: ">3m" },
                ]}
                onChange={(value) => setPriceRange(value as PriceRange)}
              />
            </View>
          )}

          <View style={styles.summaryRow}>
            <Text style={styles.summaryText}>
              {t.showing} {startItem}–{endItem} {t.from}{" "}
              {filteredResults.length} {t.properties}
            </Text>

            {hasActiveFilters ? (
              <Pressable
                style={styles.clearFilterButton}
                onPress={clearFilters}
              >
                <Text style={styles.clearFilterText}>{t.clearFilters}</Text>
              </Pressable>
            ) : null}
          </View>
        </View>

        {loadingData ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator color="#e6c15c" />
            <Text style={styles.loadingText}>{t.loading}</Text>
          </View>
        ) : errorMessage ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyTitle}>{t.failed}</Text>
            <Text style={styles.emptySub}>{errorMessage}</Text>
          </View>
        ) : paginatedResults.length > 0 ? (
          <>
            <View style={styles.resultList}>
              {paginatedResults.map((property) => (
                <SearchResultCard
                  key={property.id}
                  property={property}
                  language={language}
                  photosLabel={t.photos}
                  whatsappLabel={t.whatsapp}
                  scheduleLabel={t.schedule}
                  verifiedText={t.verified}
                  boostText={t.boost}
                  spotlightText={t.spotlight}
                  featuredText={t.featured}
                  forSaleText={t.forSale}
                  forRentText={t.forRent}
                  formatPrice={formatPrice}
                  onPress={() => goDetails(property)}
                  onWhatsapp={() => openWhatsapp(property)}
                  onSchedule={() => goDetails(property, true)}
                />
              ))}
            </View>

            <View style={styles.paginationBox}>
              <Text style={styles.pageText}>
                {t.page} {safeCurrentPage} / {totalPages}
              </Text>

              <View style={styles.paginationRow}>
                <Pressable
                  disabled={safeCurrentPage === 1}
                  style={[
                    styles.pageButton,
                    safeCurrentPage === 1 && styles.pageButtonDisabled,
                  ]}
                  onPress={() =>
                    setCurrentPage(Math.max(1, safeCurrentPage - 1))
                  }
                >
                  <Text style={styles.pageButtonText}>{t.previous}</Text>
                </Pressable>

                {visiblePages.map((page) => (
                  <Pressable
                    key={page}
                    style={[
                      styles.pageNumberButton,
                      safeCurrentPage === page && styles.pageNumberActive,
                    ]}
                    onPress={() => setCurrentPage(page)}
                  >
                    <Text
                      style={[
                        styles.pageNumberText,
                        safeCurrentPage === page && styles.pageNumberTextActive,
                      ]}
                    >
                      {page}
                    </Text>
                  </Pressable>
                ))}

                <Pressable
                  disabled={safeCurrentPage === totalPages}
                  style={[
                    styles.pageButton,
                    safeCurrentPage === totalPages && styles.pageButtonDisabled,
                  ]}
                  onPress={() =>
                    setCurrentPage(Math.min(totalPages, safeCurrentPage + 1))
                  }
                >
                  <Text style={styles.pageButtonText}>{t.next}</Text>
                </Pressable>
              </View>
            </View>
          </>
        ) : (
          <View style={styles.emptyBox}>
            <Search color="#e6c15c" size={32} />
            <Text style={styles.emptyTitle}>{t.empty}</Text>
            <Text style={styles.emptySub}>{t.emptySub}</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function readParam(value: unknown) {
  if (Array.isArray(value)) return String(value[0] || "");
  return String(value || "");
}

function cleanString(value?: string | null) {
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

function normalizeWhatsappPhone(value?: string | null) {
  const digits = String(value || "").replace(/[^\d]/g, "");

  if (!digits) return "";
  if (digits.startsWith("62")) return digits;
  if (digits.startsWith("0")) return `62${digits.slice(1)}`;
  if (digits.startsWith("8")) return `62${digits}`;

  return digits;
}

function normalizeListingType(value?: string | null): ListingType {
  const v = normalizeText(String(value || ""));

  if (v === "sale" || v === "sell" || v === "dijual" || v === "jual") {
    return "dijual";
  }

  if (v === "rent" || v === "rental" || v === "disewa" || v === "sewa") {
    return "disewa";
  }

  return "";
}

function normalizeRentalType(value?: string | null): RentalType {
  const v = normalizeText(String(value || ""));

  if (v === "daily" || v === "harian") return "daily";
  if (v === "monthly" || v === "bulanan") return "monthly";
  if (v === "yearly" || v === "tahunan" || v === "annual") return "yearly";

  return "";
}

function normalizeSaleType(value?: string | null): SaleType {
  const v = String(value || "")
    .trim()
    .toLowerCase();

  if (v === "freehold") return "freehold";
  if (v === "leasehold") return "leasehold";
  if (v === "hgb") return "hgb";
  if (v === "hak_pakai") return "hak_pakai";
  if (v === "lainnya") return "lainnya";

  return "";
}

function normalizePriceRange(value?: string | null): PriceRange {
  const v = String(value || "") as PriceRange;

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

function normalizeSort(value?: string | null): SortOption {
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

function getTitle(property: TetamoProperty, language: Language) {
  return language === "id"
    ? property.titleId || property.titleEn
    : property.titleEn;
}

function formatPricePlain(value?: number) {
  if (!value || value <= 0) return "Price on Request";

  return `Rp ${Math.round(value).toLocaleString("id-ID")}`;
}

function isSaleProperty(property: TetamoProperty) {
  const value = normalizeListingType(property.listingType);

  return value === "dijual";
}

function isRentProperty(property: TetamoProperty) {
  const value = normalizeListingType(property.listingType);

  return value === "disewa";
}

function getPriceRange(value: number): PriceRange {
  if (value < 100_000_000) return "<100jt";
  if (value < 500_000_000) return "100jt-500jt";
  if (value < 1_000_000_000) return "500jt-1m";
  if (value <= 3_000_000_000) return "1m-3m";

  return ">3m";
}

function formatPropertyType(value?: string | null, language?: Language) {
  const raw = normalizeText(String(value || ""));

  if (!raw) return "";

  if (raw === "tanah") return language === "id" ? "Tanah" : "Land";
  if (raw === "rumah") return language === "id" ? "Rumah" : "House";
  if (raw === "villa" || raw === "vila") return "Villa";
  if (raw === "studio") return "Studio";
  if (raw === "apartemen" || raw === "apartment") {
    return language === "id" ? "Apartemen" : "Apartment";
  }
  if (raw === "ruko") return language === "id" ? "Ruko" : "Shophouse";
  if (raw === "rukan") return language === "id" ? "Rukan" : "Office Unit";
  if (raw === "gudang") return language === "id" ? "Gudang" : "Warehouse";
  if (raw === "kantor") return language === "id" ? "Kantor" : "Office";
  if (raw === "kost" || raw === "kos") {
    return language === "id" ? "Kost" : "Boarding House";
  }
  if (raw === "guesthouse") return "Guesthouse";
  if (raw === "hotel") return "Hotel";
  if (raw === "resort") return "Resort";
  if (raw === "pabrik") return language === "id" ? "Pabrik" : "Factory";
  if (raw === "toko") return language === "id" ? "Toko" : "Shop";
  if (raw === "rukos")
    return language === "id" ? "Rukos" : "Shop-Boarding House";

  return raw
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function getRentalTypeLabel(value?: string | null, language?: Language) {
  const rental = normalizeRentalType(value);

  if (rental === "daily") return language === "id" ? "Harian" : "Daily";
  if (rental === "monthly") return language === "id" ? "Bulanan" : "Monthly";
  if (rental === "yearly") return language === "id" ? "Tahunan" : "Yearly";

  return "";
}

function getSaleTypeLabel(value?: string | null, language?: Language) {
  const sale = normalizeSaleType(value);

  if (sale === "freehold") return "Freehold";
  if (sale === "leasehold") return "Leasehold";
  if (sale === "hgb") return "HGB";
  if (sale === "hak_pakai")
    return language === "id" ? "Hak Pakai" : "Right to Use";
  if (sale === "lainnya") return language === "id" ? "Lainnya" : "Other";

  return "";
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

function buildSearchableText(property: TetamoProperty) {
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

function getTierBoost(property: TetamoProperty) {
  const badge = normalizeText(property.badge || "");

  if (badge.includes("spotlight")) return 220;
  if (badge.includes("featured")) return 140;
  if (badge.includes("boost")) return 120;
  if (badge.includes("verified")) return 20;

  return 0;
}

function calculateRelevanceScore(property: TetamoProperty, query: string) {
  const normalizedQuery = normalizeText(query);

  if (!normalizedQuery) {
    return getTierBoost(property) + Number(property.viewCount || 0) / 100;
  }

  const words = normalizedQuery.split(" ").filter(Boolean);
  const searchable = buildSearchableText(property);
  const normalizedCode = normalizeText(property.kode || "");
  const normalizedTitle = normalizeText(
    `${property.titleEn} ${property.titleId}`,
  );
  const normalizedArea = normalizeText(property.area || "");
  const normalizedProvince = normalizeText(property.province || "");
  const normalizedAgency = normalizeText(property.contactAgency || "");
  const normalizedAgent = normalizeText(property.contactName || "");
  const normalizedRental = normalizeText(
    `${property.rentalType} ${getRentalTypeLabel(
      property.rentalType,
      "id",
    )} ${getRentalTypeLabel(property.rentalType, "en")}`,
  );
  const normalizedSale = normalizeText(
    `${property.saleType} ${getSaleTypeLabel(
      property.saleType,
      "id",
    )} ${getSaleTypeLabel(property.saleType, "en")}`,
  );

  let score = 0;

  if (normalizedCode === normalizedQuery) score += 5000;
  if (normalizedCode.startsWith(normalizedQuery)) score += 2200;
  if (normalizedTitle === normalizedQuery) score += 1800;
  if (normalizedTitle.includes(normalizedQuery)) score += 1000;
  if (normalizedArea === normalizedQuery) score += 900;
  if (normalizedProvince === normalizedQuery) score += 800;
  if (`${normalizedArea} ${normalizedProvince}`.includes(normalizedQuery)) {
    score += 700;
  }

  if (normalizedRental.includes(normalizedQuery)) score += 300;
  if (normalizedSale.includes(normalizedQuery)) score += 300;

  for (const word of words) {
    if (normalizedCode.includes(word)) score += 250;
    if (normalizedTitle.includes(word)) score += 160;
    if (normalizedArea.includes(word)) score += 120;
    if (normalizedProvince.includes(word)) score += 100;
    if (normalizedRental.includes(word)) score += 90;
    if (normalizedSale.includes(word)) score += 90;
    if (normalizedAgency.includes(word)) score += 70;
    if (normalizedAgent.includes(word)) score += 60;
    if (searchable.includes(word)) score += 25;
  }

  if (words.length > 0 && words.every((word) => searchable.includes(word))) {
    score += 220;
  }

  if (normalizedQuery.includes("dijual") && isSaleProperty(property))
    score += 120;
  if (normalizedQuery.includes("disewa") && isRentProperty(property))
    score += 120;

  if (
    (normalizedQuery.includes("harian") || normalizedQuery.includes("daily")) &&
    normalizeRentalType(property.rentalType) === "daily"
  ) {
    score += 160;
  }

  if (
    (normalizedQuery.includes("bulanan") ||
      normalizedQuery.includes("monthly")) &&
    normalizeRentalType(property.rentalType) === "monthly"
  ) {
    score += 160;
  }

  if (
    (normalizedQuery.includes("tahunan") ||
      normalizedQuery.includes("yearly")) &&
    normalizeRentalType(property.rentalType) === "yearly"
  ) {
    score += 160;
  }

  if (
    normalizedQuery.includes("freehold") &&
    normalizeSaleType(property.saleType) === "freehold"
  ) {
    score += 160;
  }

  if (
    normalizedQuery.includes("leasehold") &&
    normalizeSaleType(property.saleType) === "leasehold"
  ) {
    score += 160;
  }

  score += getTierBoost(property);

  return score;
}

function OptionRow({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { label: string; value: string }[];
  onChange: (value: string) => void;
}) {
  return (
    <View style={styles.optionBlock}>
      <Text style={styles.optionLabel}>{label}</Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.optionRow}
      >
        {options.map((option) => (
          <Pressable
            key={`${label}-${option.value || "all"}`}
            style={[
              styles.optionChip,
              value === option.value && styles.optionChipActive,
            ]}
            onPress={() => onChange(option.value)}
          >
            <Text
              style={[
                styles.optionChipText,
                value === option.value && styles.optionChipTextActive,
              ]}
            >
              {option.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

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
  if (items.length === 0) return null;

  return (
    <View style={styles.suggestionGroup}>
      <Text style={styles.suggestionGroupTitle}>{title}</Text>

      {items.map((item) => (
        <Pressable
          key={item.id}
          style={styles.suggestionItem}
          onPress={() => onPress(item)}
        >
          <View style={styles.suggestionIcon}>{icon}</View>

          <View style={styles.suggestionTextBox}>
            <Text style={styles.suggestionLabel} numberOfLines={1}>
              {item.label}
            </Text>

            {item.sublabel ? (
              <Text style={styles.suggestionSub} numberOfLines={1}>
                {item.sublabel}
              </Text>
            ) : null}
          </View>

          <ChevronRight color="#777777" size={15} />
        </Pressable>
      ))}
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

function RealMetric({ icon, value }: { icon: ReactNode; value: string }) {
  return (
    <View style={styles.metricPill}>
      {icon}
      <Text style={styles.metricText}>{value}</Text>
    </View>
  );
}

function Spec({ icon, value }: { icon: ReactNode; value: string | number }) {
  return (
    <View style={styles.specPill}>
      {icon}
      <Text style={styles.specText}>{value}</Text>
    </View>
  );
}

function getBadgesForProperty({
  property,
  language,
  verifiedText,
  boostText,
  spotlightText,
  featuredText,
  forSaleText,
  forRentText,
}: {
  property: TetamoProperty;
  language: Language;
  verifiedText: string;
  boostText: string;
  spotlightText: string;
  featuredText: string;
  forSaleText: string;
  forRentText: string;
}) {
  const badges: { key: string; label: string; bg: string; color: string }[] =
    [];
  const rentalType = normalizeRentalType(property.rentalType);
  const saleType = normalizeSaleType(property.saleType);
  const badge = normalizeText(property.badge || "");

  if (badge.includes("verified") || property.badge) {
    badges.push({
      key: "verified",
      label: verifiedText,
      bg: "#dcfce7",
      color: "#166534",
    });
  }

  if (isSaleProperty(property)) {
    badges.push({
      key: "sale",
      label: forSaleText,
      bg: "#dbeafe",
      color: "#1d4ed8",
    });
  }

  if (isRentProperty(property)) {
    badges.push({
      key: "rent",
      label: forRentText,
      bg: "#fef3c7",
      color: "#92400e",
    });
  }

  const rentalLabel = getRentalTypeLabel(rentalType, language);
  if (rentalLabel) {
    badges.push({
      key: rentalType,
      label: rentalLabel,
      bg: "#ede9fe",
      color: "#6d28d9",
    });
  }

  const saleLabel = getSaleTypeLabel(saleType, language);
  if (saleLabel) {
    badges.push({
      key: saleType,
      label: saleLabel,
      bg: "#e0f2fe",
      color: "#0369a1",
    });
  }

  if (badge.includes("spotlight")) {
    badges.push({
      key: "spotlight",
      label: spotlightText,
      bg: "#fef3c7",
      color: "#92400e",
    });
  } else if (badge.includes("featured")) {
    badges.push({
      key: "featured",
      label: featuredText,
      bg: "#f3e8ff",
      color: "#7e22ce",
    });
  } else if (badge.includes("boost")) {
    badges.push({
      key: "boost",
      label: boostText,
      bg: "#e0f2fe",
      color: "#0369a1",
    });
  }

  if (badges.length === 0) {
    badges.push({
      key: "verified-fallback",
      label: verifiedText,
      bg: "#111111",
      color: "#ffffff",
    });
  }

  return badges.slice(0, 4);
}

function SearchResultCard({
  property,
  language,
  photosLabel,
  whatsappLabel,
  scheduleLabel,
  verifiedText,
  boostText,
  spotlightText,
  featuredText,
  forSaleText,
  forRentText,
  formatPrice,
  onPress,
  onWhatsapp,
  onSchedule,
}: {
  property: TetamoProperty;
  language: Language;
  photosLabel: string;
  whatsappLabel: string;
  scheduleLabel: string;
  verifiedText: string;
  boostText: string;
  spotlightText: string;
  featuredText: string;
  forSaleText: string;
  forRentText: string;
  formatPrice: (priceIdr: number, rentalType?: string | null) => string;
  onPress: () => void;
  onWhatsapp: () => void;
  onSchedule: () => void;
}) {
  const title = getTitle(property, language);
  const photoCount = getPhotoCount(property);
  const propertyTypeLabel = formatPropertyType(property.propertyType, language);
  const image = property.image || property.images?.[0] || FALLBACK_IMAGE;

  const badges = getBadgesForProperty({
    property,
    language,
    verifiedText,
    boostText,
    spotlightText,
    featuredText,
    forSaleText,
    forRentText,
  });

  return (
    <Pressable style={styles.resultCard} onPress={onPress}>
      <ImageBackground
        source={{ uri: image }}
        resizeMode="cover"
        style={styles.resultImage}
        imageStyle={styles.resultImageRadius}
      >
        <View style={styles.imageShade} />

        <View style={styles.badgeRow}>
          {badges.map((badge) => (
            <StatusBadge
              key={`${property.id}-${badge.key}`}
              label={badge.label}
              bg={badge.bg}
              color={badge.color}
            />
          ))}
        </View>

        <View style={styles.tetamoBadge}>
          <Text style={styles.tetamoBadgeText}>TETAMO</Text>
        </View>
      </ImageBackground>

      <View style={styles.resultBody}>
        <View style={styles.typeRow}>
          {propertyTypeLabel ? (
            <View style={styles.typePill}>
              <Building2 color="#cfcfcf" size={11} />
              <Text style={styles.typePillText}>{propertyTypeLabel}</Text>
            </View>
          ) : null}

          {property.kode ? (
            <View style={styles.typePill}>
              <Hash color="#cfcfcf" size={11} />
              <Text style={styles.typePillText}>{property.kode}</Text>
            </View>
          ) : null}
        </View>

        <Text style={styles.resultLocationText} numberOfLines={1}>
          {property.area ||
            property.city ||
            property.province ||
            property.location}
        </Text>

        <Text style={styles.resultName} numberOfLines={2}>
          {title}
        </Text>

        <Text style={styles.resultPrice} numberOfLines={1}>
          {formatPrice(property.priceIdr, property.rentalType)}
        </Text>

        <View style={styles.specRow}>
          <Spec
            icon={<Home color="#ffffff" size={11} />}
            value={`${property.size || 0} m²`}
          />
          <Spec
            icon={<BedDouble color="#ffffff" size={11} />}
            value={property.beds || 0}
          />
          <Spec
            icon={<Bath color="#ffffff" size={11} />}
            value={property.baths || 0}
          />
        </View>

        <View style={styles.metricRow}>
          <RealMetric
            icon={<Eye color="#ffffff" size={11} />}
            value={formatCompactNumber(property.viewCount)}
          />
          <RealMetric
            icon={<Camera color="#ffffff" size={11} />}
            value={`${photoCount} ${photosLabel}`}
          />
        </View>

        <View style={styles.actionRow}>
          <Pressable
            style={styles.whatsappButton}
            onPress={(event: any) => {
              event.stopPropagation?.();
              onWhatsapp();
            }}
          >
            <MessageCircle color="#7ee0a6" size={13} />
            <Text style={styles.actionText}>{whatsappLabel}</Text>
          </Pressable>

          <Pressable
            style={styles.scheduleButton}
            onPress={(event: any) => {
              event.stopPropagation?.();
              onSchedule();
            }}
          >
            <CalendarDays color="#e6c15c" size={13} />
            <Text style={styles.scheduleText}>{scheduleLabel}</Text>
          </Pressable>
        </View>
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
    paddingBottom: 36,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 12,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 16,
    backgroundColor: "#101010",
    borderWidth: 1,
    borderColor: "#303030",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitleBox: {
    flex: 1,
  },
  title: {
    color: "#ffffff",
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: -0.3,
  },
  subtitle: {
    color: "#bdbdbd",
    fontSize: 11.5,
    fontWeight: "700",
    marginTop: 3,
    lineHeight: 16,
  },
  topToggles: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 7,
    marginBottom: 14,
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
    paddingVertical: 6,
  },
  toggleActive: {
    backgroundColor: "#e6c15c",
  },
  toggleText: {
    color: "#e6c15c",
    fontSize: 10,
    fontWeight: "900",
  },
  toggleTextActive: {
    color: "#111111",
  },
  currencyGroup: {
    flexDirection: "row",
    borderWidth: 1,
    borderColor: "#5b4a24",
    borderRadius: 999,
    overflow: "hidden",
  },
  currencyItem: {
    paddingHorizontal: 7,
    paddingVertical: 6,
  },
  currencyText: {
    color: "#e6c15c",
    fontSize: 9,
    fontWeight: "900",
  },
  searchPanel: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#303030",
    backgroundColor: "#101010",
    padding: 13,
    marginBottom: 18,
  },
  searchRow: {
    flexDirection: "row",
    gap: 9,
  },
  searchInputBox: {
    flex: 1,
    minHeight: 48,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: "#303030",
    backgroundColor: "#050505",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 13,
  },
  searchInput: {
    flex: 1,
    color: "#ffffff",
    fontSize: 12.5,
    paddingVertical: 0,
  },
  searchButton: {
    minWidth: 82,
    minHeight: 48,
    borderRadius: 17,
    backgroundColor: "#e6c15c",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  searchButtonText: {
    color: "#111111",
    fontSize: 12,
    fontWeight: "900",
  },
  suggestionsPanel: {
    borderRadius: 18,
    backgroundColor: "#ffffff",
    marginTop: 10,
    overflow: "hidden",
    paddingVertical: 7,
  },
  suggestionGroup: {
    paddingVertical: 4,
  },
  suggestionGroupTitle: {
    color: "#777777",
    fontSize: 10,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 0.7,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  suggestionItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  suggestionIcon: {
    width: 34,
    height: 34,
    borderRadius: 13,
    backgroundColor: "#f2f2f2",
    alignItems: "center",
    justifyContent: "center",
  },
  suggestionTextBox: {
    flex: 1,
  },
  suggestionLabel: {
    color: "#111111",
    fontSize: 12,
    fontWeight: "900",
  },
  suggestionSub: {
    color: "#606060",
    fontSize: 10.5,
    fontWeight: "700",
    marginTop: 2,
  },
  noSuggestionText: {
    color: "#606060",
    fontSize: 12,
    fontWeight: "700",
    padding: 14,
  },
  mobileTopFilters: {
    marginTop: 13,
  },
  optionBlock: {
    marginTop: 10,
  },
  optionLabel: {
    color: "#a9a9a9",
    fontSize: 10.5,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 7,
  },
  optionRow: {
    gap: 8,
  },
  optionChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#303030",
    backgroundColor: "#050505",
    paddingHorizontal: 11,
    paddingVertical: 8,
  },
  optionChipActive: {
    backgroundColor: "#e6c15c",
    borderColor: "#e6c15c",
  },
  optionChipText: {
    color: "#ffffff",
    fontSize: 10.5,
    fontWeight: "900",
  },
  optionChipTextActive: {
    color: "#111111",
  },
  moreFilterButton: {
    alignSelf: "flex-start",
    marginTop: 12,
    borderRadius: 999,
    backgroundColor: "#e6c15c",
    paddingHorizontal: 13,
    paddingVertical: 9,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  moreFilterText: {
    color: "#111111",
    fontSize: 11,
    fontWeight: "900",
  },
  moreFilters: {
    marginTop: 4,
  },
  summaryRow: {
    borderTopWidth: 1,
    borderTopColor: "#242424",
    marginTop: 13,
    paddingTop: 13,
    gap: 10,
  },
  summaryText: {
    color: "#bdbdbd",
    fontSize: 11.5,
    fontWeight: "700",
    lineHeight: 16,
  },
  clearFilterButton: {
    alignSelf: "flex-start",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#303030",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  clearFilterText: {
    color: "#e6c15c",
    fontSize: 10.5,
    fontWeight: "900",
  },
  loadingBox: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#303030",
    backgroundColor: "#101010",
    padding: 24,
    alignItems: "center",
    gap: 10,
  },
  loadingText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "800",
  },
  emptyBox: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#303030",
    backgroundColor: "#101010",
    padding: 28,
    alignItems: "center",
  },
  emptyTitle: {
    color: "#ffffff",
    fontSize: 17,
    fontWeight: "900",
    marginTop: 12,
  },
  emptySub: {
    color: "#bdbdbd",
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
    marginTop: 6,
  },
  resultList: {
    gap: 16,
  },
  resultCard: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#303030",
    backgroundColor: "#101010",
    overflow: "hidden",
  },
  resultImage: {
    height: 330,
    padding: 12,
    justifyContent: "space-between",
  },
  resultImageRadius: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  imageShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.03)",
  },
  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  statusBadge: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  statusBadgeText: {
    fontSize: 9.5,
    fontWeight: "900",
  },
  tetamoBadge: {
    alignSelf: "flex-end",
    borderRadius: 999,
    backgroundColor: "rgba(0,0,0,0.72)",
    paddingHorizontal: 11,
    paddingVertical: 7,
  },
  tetamoBadgeText: {
    color: "#ffffff",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.8,
  },
  resultBody: {
    padding: 14,
  },
  typeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
    marginBottom: 9,
  },
  typePill: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#303030",
    backgroundColor: "#050505",
    paddingHorizontal: 8,
    paddingVertical: 5,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  typePillText: {
    color: "#d8d8d8",
    fontSize: 9.7,
    fontWeight: "800",
  },
  resultLocationText: {
    color: "#bdbdbd",
    fontSize: 11.5,
    fontWeight: "800",
  },
  resultName: {
    color: "#ffffff",
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "900",
    marginTop: 5,
  },
  resultPrice: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "900",
    marginTop: 8,
  },
  specRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
    marginTop: 11,
  },
  specPill: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#303030",
    backgroundColor: "#050505",
    paddingHorizontal: 8,
    paddingVertical: 5,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  specText: {
    color: "#ffffff",
    fontSize: 10,
    fontWeight: "900",
  },
  metricRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginTop: 10,
  },
  metricPill: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    backgroundColor: "rgba(255,255,255,0.08)",
    paddingHorizontal: 8,
    paddingVertical: 5,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metricText: {
    color: "#ffffff",
    fontSize: 9.5,
    fontWeight: "900",
  },
  actionRow: {
    flexDirection: "row",
    gap: 9,
    marginTop: 13,
  },
  whatsappButton: {
    flex: 1,
    minHeight: 42,
    borderRadius: 15,
    backgroundColor: "#101010",
    borderWidth: 1,
    borderColor: "rgba(37,211,102,0.55)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  scheduleButton: {
    flex: 1,
    minHeight: 42,
    borderRadius: 15,
    backgroundColor: "#101010",
    borderWidth: 1,
    borderColor: "rgba(230,193,92,0.65)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  actionText: {
    color: "#ffffff",
    fontSize: 11.5,
    fontWeight: "900",
  },
  scheduleText: {
    color: "#e6c15c",
    fontSize: 11.5,
    fontWeight: "900",
  },
  paginationBox: {
    marginTop: 22,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#303030",
    backgroundColor: "#101010",
    padding: 14,
    gap: 12,
  },
  pageText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "900",
  },
  paginationRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    alignItems: "center",
  },
  pageButton: {
    borderRadius: 13,
    backgroundColor: "#e6c15c",
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  pageButtonDisabled: {
    opacity: 0.4,
  },
  pageButtonText: {
    color: "#111111",
    fontSize: 11,
    fontWeight: "900",
  },
  pageNumberButton: {
    borderRadius: 13,
    borderWidth: 1,
    borderColor: "#303030",
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  pageNumberActive: {
    backgroundColor: "#ffffff",
    borderColor: "#ffffff",
  },
  pageNumberText: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "900",
  },
  pageNumberTextActive: {
    color: "#111111",
  },
});
