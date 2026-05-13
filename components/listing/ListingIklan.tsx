import {
    ArrowLeft,
    CalendarDays,
    Check,
    ChevronDown,
    Home,
    MapPin,
    RotateCcw,
    Search,
    ShieldCheck,
} from "lucide-react-native";
import {
    useEffect,
    useMemo,
    useRef,
    useState,
    type Dispatch,
    type ReactNode,
    type SetStateAction,
} from "react";
import {
    ActivityIndicator,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import type { ListingDraft } from "./ListingDraftContext";

type ListingType = "dijual" | "disewa" | "lelang" | "";

type Props = {
  draft: ListingDraft;
  setDraft: Dispatch<SetStateAction<ListingDraft>>;
  onNext: () => void;
  onReset?: () => void;
  language?: "en" | "id";
  provinces?: string[];
  citiesByProvince?: Record<string, string[]>;
  housingSuggestions?: string[];
};

type GooglePlacePrediction = {
  description: string;
  place_id: string;
  structured_formatting?: {
    main_text?: string;
    secondary_text?: string;
  };
};

type GoogleAddressComponent = {
  long_name: string;
  short_name: string;
  types: string[];
};

const DEFAULT_PROVINCES = [
  "Aceh",
  "Bali",
  "Banten",
  "Bengkulu",
  "DI Yogyakarta",
  "DKI Jakarta",
  "Gorontalo",
  "Jambi",
  "Jawa Barat",
  "Jawa Tengah",
  "Jawa Timur",
  "Kalimantan Barat",
  "Kalimantan Selatan",
  "Kalimantan Tengah",
  "Kalimantan Timur",
  "Kalimantan Utara",
  "Kepulauan Bangka Belitung",
  "Kepulauan Riau",
  "Lampung",
  "Maluku",
  "Maluku Utara",
  "Nusa Tenggara Barat",
  "Nusa Tenggara Timur",
  "Papua",
  "Papua Barat",
  "Riau",
  "Sulawesi Barat",
  "Sulawesi Selatan",
  "Sulawesi Tengah",
  "Sulawesi Tenggara",
  "Sulawesi Utara",
  "Sumatera Barat",
  "Sumatera Selatan",
  "Sumatera Utara",
];

const DEFAULT_CITIES_BY_PROVINCE: Record<string, string[]> = {
  Bali: [
    "Badung",
    "Bangli",
    "Buleleng",
    "Denpasar",
    "Gianyar",
    "Jembrana",
    "Karangasem",
    "Klungkung",
    "Tabanan",
  ],
  "DKI Jakarta": [
    "Jakarta Barat",
    "Jakarta Pusat",
    "Jakarta Selatan",
    "Jakarta Timur",
    "Jakarta Utara",
    "Kepulauan Seribu",
  ],
  "Jawa Barat": [
    "Bandung",
    "Bandung Barat",
    "Bekasi",
    "Bogor",
    "Cimahi",
    "Cirebon",
    "Depok",
    "Garut",
    "Karawang",
    "Sukabumi",
    "Tasikmalaya",
  ],
  "Jawa Timur": [
    "Batu",
    "Blitar",
    "Gresik",
    "Jember",
    "Kediri",
    "Lamongan",
    "Madiun",
    "Malang",
    "Mojokerto",
    "Pasuruan",
    "Sidoarjo",
    "Surabaya",
  ],
  Banten: [
    "Cilegon",
    "Lebak",
    "Pandeglang",
    "Serang",
    "Tangerang",
    "Tangerang Selatan",
  ],
  "DI Yogyakarta": [
    "Bantul",
    "Gunungkidul",
    "Kulon Progo",
    "Sleman",
    "Yogyakarta",
  ],
};

const DEFAULT_HOUSING_SUGGESTIONS = [
  "Alam Sutera",
  "BSD City",
  "Canggu",
  "CitraGarden",
  "Gading Serpong",
  "Pantai Indah Kapuk",
  "Setiabudi",
];

export default function ListingIklan({
  draft,
  setDraft,
  onNext,
  onReset,
  language = "en",
  provinces = DEFAULT_PROVINCES,
  citiesByProvince = DEFAULT_CITIES_BY_PROVINCE,
  housingSuggestions = DEFAULT_HOUSING_SUGGESTIONS,
}: Props) {
  const isId = language === "id";
  const mode = draft.mode === "edit" ? "edit" : "create";

  const googleMapsKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || "";
  const placesSessionToken = useRef(createLocalId()).current;
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [listingType, setListingType] = useState<ListingType>(
    draft.listingType || ""
  );
  const [kode, setKode] = useState(draft.kode || "");
  const [postedDate, setPostedDate] = useState(
    draft.postedDate || getTodayDate()
  );
  const [address, setAddress] = useState(draft.address || "");
  const [province, setProvince] = useState(draft.province || "");
  const [city, setCity] = useState(draft.city || "");
  const [housingName, setHousingName] = useState(draft.housingName || "");
  const [customHousing, setCustomHousing] = useState(
    draft.customHousing || ""
  );
  const [note, setNote] = useState(draft.note || "");

  const [provinceOpen, setProvinceOpen] = useState(false);
  const [housingOpen, setHousingOpen] = useState(false);

  const [addressFocused, setAddressFocused] = useState(false);
  const [addressLoading, setAddressLoading] = useState(false);
  const [addressSuggestions, setAddressSuggestions] = useState<
    GooglePlacePrediction[]
  >([]);
  const [addressError, setAddressError] = useState("");

  useEffect(() => {
    setListingType(draft.listingType || "");
    setKode(draft.kode || "");
    setPostedDate(draft.postedDate || getTodayDate());
    setAddress(draft.address || "");
    setProvince(draft.province || "");
    setCity(draft.city || "");
    setHousingName(draft.housingName || "");
    setCustomHousing(draft.customHousing || "");
    setNote(draft.note || "");
  }, [
    draft.listingType,
    draft.kode,
    draft.postedDate,
    draft.address,
    draft.province,
    draft.city,
    draft.housingName,
    draft.customHousing,
    draft.note,
  ]);

  useEffect(() => {
    if (!googleMapsKey) {
      setAddressSuggestions([]);
      setAddressError("");
      return;
    }

    const query = address.trim();

    if (!addressFocused || query.length < 3) {
      setAddressSuggestions([]);
      setAddressError("");
      return;
    }

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      void fetchAddressSuggestions(query);
    }, 350);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [address, addressFocused, googleMapsKey]);

  const sortedProvinces = useMemo(() => {
    return uniqueStrings(provinces);
  }, [provinces]);

  const citySuggestions = useMemo(() => {
    if (!province) return [];
    return uniqueStrings(citiesByProvince[province] || []);
  }, [province, citiesByProvince]);

  const finalHousingSuggestions = useMemo(() => {
    return uniqueStrings(housingSuggestions);
  }, [housingSuggestions]);

  const selectedPlanLabel = getPlanBadgeLabel(draft.plan, language);

  const canNext =
    listingType.trim().length > 0 &&
    kode.trim().length > 0 &&
    postedDate.trim().length > 0 &&
    address.trim().length > 0 &&
    province.trim().length > 0 &&
    city.trim().length > 0 &&
    (housingName === "__OTHER__" ? customHousing.trim().length > 0 : true);

  async function fetchAddressSuggestions(query: string) {
    try {
      setAddressLoading(true);
      setAddressError("");

      const url =
        "https://maps.googleapis.com/maps/api/place/autocomplete/json" +
        `?input=${encodeURIComponent(query)}` +
        `&key=${encodeURIComponent(googleMapsKey)}` +
        "&components=country:id" +
        "&language=id" +
        `&sessiontoken=${encodeURIComponent(placesSessionToken)}`;

      const response = await fetch(url);
      const data = await response.json();

      if (data?.status === "OK") {
        setAddressSuggestions(data.predictions || []);
        return;
      }

      if (data?.status === "ZERO_RESULTS") {
        setAddressSuggestions([]);
        return;
      }

      setAddressSuggestions([]);
      setAddressError(data?.error_message || data?.status || "");
    } catch (error) {
      console.log("Tetamo address suggestion error:", error);
      setAddressSuggestions([]);
      setAddressError(
        isId
          ? "Gagal memuat saran alamat."
          : "Failed to load address suggestions."
      );
    } finally {
      setAddressLoading(false);
    }
  }

  async function selectAddressSuggestion(item: GooglePlacePrediction) {
    try {
      setAddressLoading(true);
      setAddressSuggestions([]);
      setAddressError("");

      const url =
        "https://maps.googleapis.com/maps/api/place/details/json" +
        `?place_id=${encodeURIComponent(item.place_id)}` +
        `&key=${encodeURIComponent(googleMapsKey)}` +
        "&fields=formatted_address,address_component,geometry" +
        "&language=id" +
        `&sessiontoken=${encodeURIComponent(placesSessionToken)}`;

      const response = await fetch(url);
      const data = await response.json();

      const result = data?.result;
      const formattedAddress =
        String(result?.formatted_address || "").trim() || item.description;

      const components: GoogleAddressComponent[] =
        result?.address_components || [];

      const nextProvince = extractAddressComponent(components, [
        "administrative_area_level_1",
      ]);

      const nextCity =
        extractAddressComponent(components, ["locality"]) ||
        extractAddressComponent(components, [
          "administrative_area_level_2",
        ]) ||
        extractAddressComponent(components, [
          "administrative_area_level_3",
        ]);

      setAddress(formattedAddress);

      if (nextProvince) {
        setProvince(nextProvince);
      }

      if (nextCity) {
        setCity(nextCity);
      }

      setDraft((prev) => ({
        ...prev,
        address: formattedAddress,
        province: nextProvince || prev.province,
        city: nextCity || prev.city,
      }));
    } catch (error) {
      console.log("Tetamo address details error:", error);
      setAddress(item.description);
    } finally {
      setAddressFocused(false);
      setAddressLoading(false);
    }
  }

  function handleNext() {
    if (!canNext) return;

    setDraft((prev) => ({
      ...prev,
      mode,
      source: draft.source,
      plan: draft.plan,
      agentPackageId: draft.agentPackageId,
      payment: {
        ...(prev.payment || {}),
        ...(draft.payment || {}),
        planId: draft.plan || prev.payment?.planId,
        packageId: draft.agentPackageId || prev.payment?.packageId,
      },
      listingType,
      kode: kode.trim(),
      postedDate,
      address: address.trim(),
      province: province.trim(),
      city: city.trim(),
      housingName,
      customHousing: customHousing.trim(),
      note: note.trim(),
    }));

    onNext();
  }

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.headerRow}>
        <View style={styles.headerTextBox}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>
              {isId ? "Lokasi Properti" : "Property Location"}
            </Text>

            {draft.source === "owner" && draft.mode !== "edit" ? (
              <View
                style={[
                  styles.planBadge,
                  draft.plan === "featured" && styles.planBadgeFeatured,
                  draft.plan === "priority" && styles.planBadgePriority,
                ]}
              >
                <Text
                  style={[
                    styles.planBadgeText,
                    draft.plan === "featured" && styles.planBadgeTextFeatured,
                  ]}
                >
                  {selectedPlanLabel}
                </Text>
              </View>
            ) : null}

            {draft.mode === "edit" ? (
              <View style={styles.editBadge}>
                <Text style={styles.editBadgeText}>EDIT</Text>
              </View>
            ) : null}
          </View>

          <Text style={styles.subtitle}>
            {isId
              ? "(Step 1) Isi lokasi dulu, lalu lanjut ke detail dan foto."
              : "(Step 1) Fill in the location first, then continue to details and photos."}
          </Text>
        </View>

        {onReset ? (
          <Pressable style={styles.backButton} onPress={onReset}>
            <ArrowLeft color="#ffffff" size={15} />
            <Text style={styles.backButtonText}>
              {isId ? "Kembali" : "Back"}
            </Text>
          </Pressable>
        ) : null}
      </View>

      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionIcon}>
            <Home color="#e6c15c" size={21} />
          </View>

          <View style={styles.sectionHeaderText}>
            <Text style={styles.sectionTitle}>
              {isId ? "Jenis Iklan" : "Listing Type"}
              <Text style={styles.required}> *</Text>
            </Text>
            <Text style={styles.sectionSub}>
              {isId
                ? "Pilih salah satu: Dijual, Disewa, atau Lelang."
                : "Choose one: For Sale, For Rent, or Auction."}
            </Text>
          </View>
        </View>

        <View style={styles.typeRow}>
          {[
            {
              key: "dijual" as ListingType,
              label: isId ? "Dijual" : "For Sale",
            },
            {
              key: "disewa" as ListingType,
              label: isId ? "Disewa" : "For Rent",
            },
            {
              key: "lelang" as ListingType,
              label: isId ? "Lelang" : "Auction",
            },
          ].map((item) => {
            const active = listingType === item.key;

            return (
              <Pressable
                key={item.key}
                style={[styles.typeButton, active && styles.typeButtonActive]}
                onPress={() => setListingType(item.key)}
              >
                <Text
                  style={[
                    styles.typeButtonText,
                    active && styles.typeButtonTextActive,
                  ]}
                >
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.twoFieldGrid}>
        <FormInput
          label={isId ? "Kode" : "Code"}
          required
          value={kode}
          onChangeText={setKode}
          placeholder={isId ? "Contoh: TMO-0001" : "Example: TMO-0001"}
        />

        <FormInput
          label={isId ? "Tanggal Tayang" : "Posted Date"}
          required
          value={postedDate}
          onChangeText={setPostedDate}
          placeholder="YYYY-MM-DD"
          icon={<CalendarDays color="#e6c15c" size={17} />}
        />
      </View>

      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionIcon}>
            <MapPin color="#e6c15c" size={21} />
          </View>

          <View style={styles.sectionHeaderText}>
            <Text style={styles.sectionTitle}>
              {isId ? "Alamat Properti" : "Property Address"}
              <Text style={styles.required}> *</Text>
            </Text>
            <Text style={styles.sectionSub}>
              {isId
                ? "Mulai ketik alamat. Saran Google Maps akan muncul otomatis."
                : "Start typing the address. Google Maps suggestions will appear automatically."}
            </Text>
          </View>
        </View>

        <AddressInput
          label={isId ? "Alamat" : "Address"}
          required
          value={address}
          onChangeText={(value) => {
            setAddress(value);
            setAddressFocused(true);
          }}
          onFocus={() => setAddressFocused(true)}
          placeholder={
            isId
              ? "Contoh: 27A, Jalan Pantai Batu Bolong, Canggu"
              : "Example: 27A, Jalan Pantai Batu Bolong, Canggu"
          }
          loading={addressLoading}
          suggestions={addressSuggestions}
          error={addressError}
          googleEnabled={Boolean(googleMapsKey)}
          emptyApiText={
            isId
              ? "Google Maps key belum terbaca di mobile .env."
              : "Google Maps key is not detected in mobile .env."
          }
          onSelect={(item) => void selectAddressSuggestion(item)}
        />

        <View style={styles.fieldGap} />

        <DropdownField
          label={isId ? "Provinsi" : "Province"}
          required
          value={province}
          placeholder={isId ? "Pilih provinsi" : "Select province"}
          open={provinceOpen}
          options={sortedProvinces}
          onToggle={() => {
            setProvinceOpen((prev) => !prev);
            setHousingOpen(false);
          }}
          onSelect={(value) => {
            setProvince(value);
            setCity("");
            setProvinceOpen(false);
          }}
        />

        <View style={styles.fieldGap} />

        <FormInput
          label={isId ? "Kota / Area" : "City / Area"}
          required
          value={city}
          onChangeText={setCity}
          placeholder={
            province
              ? isId
                ? "Masukkan kota / area"
                : "Enter city / area"
              : isId
                ? "Pilih provinsi dulu"
                : "Select province first"
          }
        />

        {citySuggestions.length > 0 ? (
          <View style={styles.suggestionWrap}>
            {citySuggestions.slice(0, 8).map((item) => (
              <Pressable
                key={item}
                style={[
                  styles.suggestionChip,
                  city === item && styles.suggestionChipActive,
                ]}
                onPress={() => setCity(item)}
              >
                <Text
                  style={[
                    styles.suggestionChipText,
                    city === item && styles.suggestionChipTextActive,
                  ]}
                >
                  {item}
                </Text>
              </Pressable>
            ))}
          </View>
        ) : null}

        <View style={styles.fieldGap} />

        <DropdownField
          label={
            isId
              ? "Nama Apartemen / Perumahan / Cluster"
              : "Apartment / Housing / Cluster Name"
          }
          value={housingName}
          optional
          placeholder={isId ? "Pilih atau kosongkan" : "Select or leave empty"}
          open={housingOpen}
          options={[...finalHousingSuggestions, "__OTHER__"]}
          getLabel={(value) =>
            value === "__OTHER__"
              ? isId
                ? "Lainnya (ketik manual)"
                : "Other (type manually)"
              : value
          }
          onToggle={() => {
            setHousingOpen((prev) => !prev);
            setProvinceOpen(false);
          }}
          onSelect={(value) => {
            setHousingName(value);
            if (value !== "__OTHER__") setCustomHousing("");
            setHousingOpen(false);
          }}
        />

        {housingName === "__OTHER__" ? (
          <>
            <View style={styles.fieldGap} />

            <FormInput
              label={isId ? "Ketik nama" : "Type name"}
              required
              value={customHousing}
              onChangeText={setCustomHousing}
              placeholder={
                isId
                  ? "Contoh: Cluster Melati / The Mansion / dll"
                  : "Example: Cluster Melati / The Mansion / etc"
              }
            />
          </>
        ) : null}

        <View style={styles.fieldGap} />

        <FormInput
          label={isId ? "Catatan Lokasi" : "Location Notes"}
          optional
          value={note}
          onChangeText={setNote}
          placeholder={
            isId
              ? "Contoh: dekat MRT, akses tol, landmark..."
              : "Example: near MRT, toll access, landmark..."
          }
          multiline
        />
      </View>

      <View style={styles.footerCard}>
        <View style={styles.footerInfo}>
          <View style={styles.footerIcon}>
            <ShieldCheck color="#e6c15c" size={21} />
          </View>

          <View style={styles.footerTextBox}>
            <Text style={styles.footerTitle}>
              {isId ? "Data listing tersimpan otomatis" : "Draft saved locally"}
            </Text>
            <Text style={styles.footerText}>
              {isId
                ? "Data akan disimpan di draft mobile saat Anda lanjut ke step berikutnya."
                : "Your data will be stored in the mobile draft when you continue to the next step."}
            </Text>
          </View>
        </View>

        <Pressable
          style={[styles.nextButton, !canNext && styles.nextButtonDisabled]}
          disabled={!canNext}
          onPress={handleNext}
        >
          <Text style={styles.nextButtonText}>
            {isId ? "Simpan & Lanjutkan" : "Save & Continue"}
          </Text>
          <Check color="#111111" size={16} />
        </Pressable>

        {onReset ? (
          <Pressable style={styles.resetButton} onPress={onReset}>
            <RotateCcw color="#a9a9a9" size={14} />
            <Text style={styles.resetText}>Reset</Text>
          </Pressable>
        ) : null}
      </View>
    </ScrollView>
  );
}

function AddressInput({
  label,
  value,
  onChangeText,
  onFocus,
  placeholder,
  required,
  loading,
  suggestions,
  error,
  googleEnabled,
  emptyApiText,
  onSelect,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  onFocus: () => void;
  placeholder: string;
  required?: boolean;
  loading: boolean;
  suggestions: GooglePlacePrediction[];
  error: string;
  googleEnabled: boolean;
  emptyApiText: string;
  onSelect: (item: GooglePlacePrediction) => void;
}) {
  return (
    <View>
      <Text style={styles.inputLabel}>
        {label}
        {required ? <Text style={styles.required}> *</Text> : null}
      </Text>

      <View style={[styles.inputWrap, styles.textareaWrap]}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          onFocus={onFocus}
          placeholder={placeholder}
          placeholderTextColor="#777777"
          style={[styles.input, styles.textarea]}
          multiline
          textAlignVertical="top"
        />

        <View style={styles.inputIcon}>
          {loading ? (
            <ActivityIndicator color="#e6c15c" />
          ) : (
            <Search color="#e6c15c" size={17} />
          )}
        </View>
      </View>

      {!googleEnabled ? (
        <Text style={styles.addressHelperText}>{emptyApiText}</Text>
      ) : null}

      {error ? <Text style={styles.addressErrorText}>{error}</Text> : null}

      {suggestions.length > 0 ? (
        <View style={styles.addressSuggestionBox}>
          {suggestions.slice(0, 6).map((item) => (
            <Pressable
              key={item.place_id}
              style={styles.addressSuggestionItem}
              onPress={() => onSelect(item)}
            >
              <MapPin color="#e6c15c" size={15} />
              <View style={styles.addressSuggestionTextBox}>
                <Text style={styles.addressSuggestionMain}>
                  {item.structured_formatting?.main_text || item.description}
                </Text>
                {item.structured_formatting?.secondary_text ? (
                  <Text style={styles.addressSuggestionSecondary}>
                    {item.structured_formatting.secondary_text}
                  </Text>
                ) : null}
              </View>
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}

function FormInput({
  label,
  value,
  onChangeText,
  placeholder,
  required,
  optional,
  multiline,
  icon,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  required?: boolean;
  optional?: boolean;
  multiline?: boolean;
  icon?: ReactNode;
}) {
  return (
    <View>
      <Text style={styles.inputLabel}>
        {label}
        {required ? <Text style={styles.required}> *</Text> : null}
        {optional ? <Text style={styles.optional}> (Optional)</Text> : null}
      </Text>

      <View style={[styles.inputWrap, multiline && styles.textareaWrap]}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#777777"
          style={[styles.input, multiline && styles.textarea]}
          multiline={multiline}
          textAlignVertical={multiline ? "top" : "center"}
        />

        {icon ? <View style={styles.inputIcon}>{icon}</View> : null}
      </View>
    </View>
  );
}

function DropdownField({
  label,
  value,
  placeholder,
  open,
  options,
  onToggle,
  onSelect,
  required,
  optional,
  getLabel,
}: {
  label: string;
  value: string;
  placeholder: string;
  open: boolean;
  options: string[];
  onToggle: () => void;
  onSelect: (value: string) => void;
  required?: boolean;
  optional?: boolean;
  getLabel?: (value: string) => string;
}) {
  const displayValue = value
    ? getLabel
      ? getLabel(value)
      : value
    : placeholder;

  return (
    <View>
      <Text style={styles.inputLabel}>
        {label}
        {required ? <Text style={styles.required}> *</Text> : null}
        {optional ? <Text style={styles.optional}> (Optional)</Text> : null}
      </Text>

      <Pressable style={styles.dropdownButton} onPress={onToggle}>
        <Text
          style={[
            styles.dropdownButtonText,
            !value && styles.dropdownPlaceholder,
          ]}
        >
          {displayValue}
        </Text>

        <ChevronDown color="#ffffff" size={17} />
      </Pressable>

      {open ? (
        <View style={styles.dropdownList}>
          {options.map((item) => {
            const labelText = getLabel ? getLabel(item) : item;
            const active = value === item;

            return (
              <Pressable
                key={item}
                style={[
                  styles.dropdownItem,
                  active && styles.dropdownItemActive,
                ]}
                onPress={() => onSelect(item)}
              >
                <Text
                  style={[
                    styles.dropdownItemText,
                    active && styles.dropdownItemTextActive,
                  ]}
                >
                  {labelText}
                </Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}

function extractAddressComponent(
  components: GoogleAddressComponent[],
  types: string[]
) {
  const found = components.find((component) =>
    types.some((type) => component.types.includes(type))
  );

  return found?.long_name || "";
}

function getTodayDate() {
  return new Date().toISOString().slice(0, 10);
}

function uniqueStrings(values: string[]) {
  return Array.from(
    new Set(values.map((item) => String(item || "").trim()).filter(Boolean))
  ).sort((a, b) => a.localeCompare(b));
}

function getPlanBadgeLabel(plan: string | undefined, language: "en" | "id") {
  if (plan === "featured") return "FEATURED";
  if (plan === "priority") return "PRIORITY";
  if (plan === "basic") return "BASIC";

  return language === "id" ? "MEMUAT..." : "LOADING...";
}

function createLocalId() {
  return `listing-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: "#050505",
  },
  content: {
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 38,
  },
  headerRow: {
    gap: 12,
    marginBottom: 16,
  },
  headerTextBox: {
    flex: 1,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
  },
  title: {
    color: "#ffffff",
    fontSize: 27,
    lineHeight: 32,
    fontWeight: "900",
    letterSpacing: -0.5,
  },
  subtitle: {
    color: "#b8b8b8",
    fontSize: 12.5,
    lineHeight: 18,
    fontWeight: "700",
    marginTop: 6,
  },
  planBadge: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#343434",
    backgroundColor: "#101010",
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  planBadgePriority: {
    borderColor: "#705d2c",
    backgroundColor: "#211a0b",
  },
  planBadgeFeatured: {
    borderColor: "#e6c15c",
    backgroundColor: "#e6c15c",
  },
  planBadgeText: {
    color: "#ffffff",
    fontSize: 9.5,
    fontWeight: "900",
    letterSpacing: 0.7,
  },
  planBadgeTextFeatured: {
    color: "#111111",
  },
  editBadge: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#60a5fa",
    backgroundColor: "#0b1624",
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  editBadgeText: {
    color: "#60a5fa",
    fontSize: 9.5,
    fontWeight: "900",
    letterSpacing: 0.7,
  },
  backButton: {
    alignSelf: "flex-start",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#343434",
    backgroundColor: "#101010",
    paddingHorizontal: 11,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  backButtonText: {
    color: "#ffffff",
    fontSize: 11.5,
    fontWeight: "900",
  },
  sectionCard: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#303030",
    backgroundColor: "#101010",
    padding: 15,
    marginBottom: 13,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 11,
    marginBottom: 14,
  },
  sectionIcon: {
    width: 42,
    height: 42,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#705d2c",
    backgroundColor: "#211a0b",
    alignItems: "center",
    justifyContent: "center",
  },
  sectionHeaderText: {
    flex: 1,
  },
  sectionTitle: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "900",
  },
  sectionSub: {
    color: "#a9a9a9",
    fontSize: 11.5,
    lineHeight: 16,
    fontWeight: "700",
    marginTop: 3,
  },
  required: {
    color: "#fb7185",
  },
  optional: {
    color: "#777777",
    fontWeight: "700",
  },
  typeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  typeButton: {
    minHeight: 42,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#303030",
    backgroundColor: "#050505",
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  typeButtonActive: {
    borderColor: "#e6c15c",
    backgroundColor: "#e6c15c",
  },
  typeButtonText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "900",
  },
  typeButtonTextActive: {
    color: "#111111",
  },
  twoFieldGrid: {
    gap: 13,
    marginBottom: 13,
  },
  inputLabel: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "900",
    marginBottom: 7,
  },
  inputWrap: {
    minHeight: 50,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#303030",
    backgroundColor: "#050505",
    flexDirection: "row",
    alignItems: "center",
  },
  textareaWrap: {
    minHeight: 92,
    alignItems: "flex-start",
  },
  input: {
    flex: 1,
    color: "#ffffff",
    paddingHorizontal: 13,
    paddingVertical: 0,
    fontSize: 13,
    fontWeight: "700",
  },
  textarea: {
    minHeight: 92,
    paddingTop: 13,
    paddingBottom: 13,
  },
  inputIcon: {
    width: 44,
    height: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  addressHelperText: {
    color: "#a9a9a9",
    fontSize: 10.8,
    lineHeight: 15,
    fontWeight: "700",
    marginTop: 7,
  },
  addressErrorText: {
    color: "#fecaca",
    fontSize: 10.8,
    lineHeight: 15,
    fontWeight: "700",
    marginTop: 7,
  },
  addressSuggestionBox: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#303030",
    backgroundColor: "#050505",
    marginTop: 8,
    overflow: "hidden",
  },
  addressSuggestionItem: {
    minHeight: 52,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#151515",
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 9,
  },
  addressSuggestionTextBox: {
    flex: 1,
  },
  addressSuggestionMain: {
    color: "#ffffff",
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "900",
  },
  addressSuggestionSecondary: {
    color: "#a9a9a9",
    fontSize: 10.8,
    lineHeight: 15,
    fontWeight: "700",
    marginTop: 2,
  },
  fieldGap: {
    height: 13,
  },
  dropdownButton: {
    minHeight: 50,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#303030",
    backgroundColor: "#050505",
    paddingHorizontal: 13,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  dropdownButtonText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "800",
    flex: 1,
  },
  dropdownPlaceholder: {
    color: "#777777",
  },
  dropdownList: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#303030",
    backgroundColor: "#050505",
    marginTop: 8,
    overflow: "hidden",
    maxHeight: 260,
  },
  dropdownItem: {
    minHeight: 43,
    paddingHorizontal: 13,
    justifyContent: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#151515",
  },
  dropdownItemActive: {
    backgroundColor: "#e6c15c",
  },
  dropdownItemText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "800",
  },
  dropdownItemTextActive: {
    color: "#111111",
  },
  suggestionWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
    marginTop: 9,
  },
  suggestionChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#303030",
    backgroundColor: "#050505",
    paddingHorizontal: 9,
    paddingVertical: 6,
  },
  suggestionChipActive: {
    borderColor: "#e6c15c",
    backgroundColor: "#e6c15c",
  },
  suggestionChipText: {
    color: "#ffffff",
    fontSize: 10.5,
    fontWeight: "800",
  },
  suggestionChipTextActive: {
    color: "#111111",
  },
  footerCard: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#303030",
    backgroundColor: "#101010",
    padding: 15,
    gap: 13,
  },
  footerInfo: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 11,
  },
  footerIcon: {
    width: 42,
    height: 42,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#705d2c",
    backgroundColor: "#211a0b",
    alignItems: "center",
    justifyContent: "center",
  },
  footerTextBox: {
    flex: 1,
  },
  footerTitle: {
    color: "#ffffff",
    fontSize: 13.5,
    fontWeight: "900",
  },
  footerText: {
    color: "#a9a9a9",
    fontSize: 11.3,
    lineHeight: 16,
    fontWeight: "700",
    marginTop: 3,
  },
  nextButton: {
    minHeight: 49,
    borderRadius: 17,
    backgroundColor: "#e6c15c",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    paddingHorizontal: 14,
  },
  nextButtonDisabled: {
    opacity: 0.45,
  },
  nextButtonText: {
    color: "#111111",
    fontSize: 13,
    fontWeight: "900",
  },
  resetButton: {
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingVertical: 3,
  },
  resetText: {
    color: "#a9a9a9",
    fontSize: 11.5,
    fontWeight: "800",
  },
});