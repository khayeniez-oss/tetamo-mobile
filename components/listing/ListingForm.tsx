import {
    ArrowLeft,
    Calculator,
    Check,
    ChevronDown,
    FileText,
    Home,
    MapPinned,
    Ruler,
    ShieldCheck,
} from "lucide-react-native";
import { useMemo, useState, type ReactNode } from "react";
import {
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import type { ListingDraft } from "./ListingDraftContext";

type Language = "en" | "id";

type OptionItem = {
  value: string;
  label: string;
};

type ChecklistItem = {
  key: string;
  label: string;
};

type Props = {
  draft: ListingDraft;
  setDraft: React.Dispatch<React.SetStateAction<ListingDraft>>;
  onBack: () => void;
  onNext: () => void;
  language?: Language;
  showPackageBadge?: boolean;
};

const saleTypeOwnershipMap: Record<string, string> = {
  freehold: "Hak Milik / Freehold",
  leasehold: "Hak Sewa / Leasehold",
  hgb: "Hak Guna Bangunan / HGB",
  hak_pakai: "Hak Pakai",
  lainnya: "Lainnya",
};

export default function ListingForm({
  draft,
  setDraft,
  onBack,
  onNext,
  language = "en",
  showPackageBadge = true,
}: Props) {
  const isId = language === "id";
  const [openKey, setOpenKey] = useState("");

  const draftRecord = toRecord(draft);

  const listingType = getString(draftRecord, "listingType");
  const propertyType = getString(draftRecord, "propertyType");
  const ownershipType = getString(draftRecord, "jenisKepemilikan");
  const savedSaleType = getString(draftRecord, "saleType");

  const isDisewa = listingType === "disewa";
  const isSaleLike = !isDisewa;
  const hasPlan = Boolean(getString(draftRecord, "plan"));

  const saleType =
    savedSaleType ||
    (ownershipType.toLowerCase().includes("lease") ||
    ownershipType.toLowerCase().includes("hak sewa")
      ? "leasehold"
      : "");

  const isLeaseholdSale = isSaleLike && saleType === "leasehold";

  const isStudio = propertyType === "studio";
  const isApartment = ["apartemen", "studio"].includes(propertyType);
  const isTanah = propertyType === "tanah";
  const isIndustrial = ["gudang", "pabrik"].includes(propertyType);
  const isRuko = propertyType === "ruko";
  const isRukos = propertyType === "rukos";
  const isCommercial = ["kantor", "ruko", "kios", "komersial"].includes(
    propertyType
  );
  const isHospitality = ["guesthouse", "hotel", "kos", "resort"].includes(
    propertyType
  );
  const isHouseLike = ["rumah", "vila"].includes(propertyType);

  const usesLandSize = !isApartment;
  const usesBuildingSize = !isTanah;

  const showBedroomField =
    !isStudio && (isHouseLike || isApartment || isHospitality || isRukos);
  const showBedroomInput = isHospitality;
  const showBedroomSelect = showBedroomField && !showBedroomInput;

  const showBathroomField = !isTanah;
  const showBathroomInput = isHospitality;
  const showBathroomSelect = showBathroomField && !showBathroomInput;

  const showMaidRoom =
    isHouseLike || ["guesthouse", "hotel", "resort"].includes(propertyType);
  const showFurnishing = !isTanah && !isIndustrial;
  const showParking = !isTanah;
  const showFloor = !isTanah;
  const showUnitFloor = isApartment;
  const showTowerBlock = isApartment;
  const showCeilingHeight = isIndustrial || isCommercial;
  const showRoadAccess = isTanah || isIndustrial;
  const showDimensionFields = isTanah || isIndustrial;
  const showFacilities = !isTanah;
  const showNearby = true;

  const showLegalFields = isSaleLike;
  const showMarketType = isSaleLike;
  const showSaleType = isSaleLike;
  const showLandTypeField = showLegalFields && !isApartment;
  const showZoningField = showLegalFields && !isApartment;

  const price = parseNumber(draftRecord.price);
  const landSize = parseNumber(draftRecord.lt);
  const buildingSize = parseNumber(draftRecord.lb);
  const landUnit = getString(draftRecord, "landUnit") || "m2";
  const leaseYears = parseNumber(draftRecord.leaseYears);
  const landSqm = usesLandSize ? convertLandToSqm(landSize, landUnit) : 0;

  const autoCalculation = useMemo(() => {
    const hasPrice = price > 0;
    const hasLand = landSqm > 0;
    const hasBuilding = usesBuildingSize && buildingSize > 0;

    if (!hasPrice || (!hasLand && !hasBuilding)) {
      return {
        hasCalculation: false,
        landPricePerSqm: 0,
        landPricePerAre: 0,
        landPricePerHectare: 0,
        buildingPricePerSqm: 0,
        leaseLandPricePerSqmPerYear: 0,
        leaseLandPricePerArePerYear: 0,
        leaseBuildingPricePerSqmPerYear: 0,
      };
    }

    const landPricePerSqm = hasLand ? price / landSqm : 0;
    const landPricePerAre = hasLand ? price / (landSqm / 100) : 0;
    const landPricePerHectare = hasLand ? price / (landSqm / 10000) : 0;
    const buildingPricePerSqm = hasBuilding ? price / buildingSize : 0;

    const hasLeaseYears = isLeaseholdSale && leaseYears > 0;

    return {
      hasCalculation: true,
      landPricePerSqm,
      landPricePerAre,
      landPricePerHectare,
      buildingPricePerSqm,
      leaseLandPricePerSqmPerYear:
        hasLeaseYears && hasLand ? landPricePerSqm / leaseYears : 0,
      leaseLandPricePerArePerYear:
        hasLeaseYears && hasLand ? landPricePerAre / leaseYears : 0,
      leaseBuildingPricePerSqmPerYear:
        hasLeaseYears && hasBuilding ? buildingPricePerSqm / leaseYears : 0,
    };
  }, [
    price,
    landSqm,
    buildingSize,
    usesBuildingSize,
    isLeaseholdSale,
    leaseYears,
  ]);

  const facilityItems = useMemo(() => {
    const commonFacilities: ChecklistItem[] = [
      { key: "fac_ac", label: "AC" },
      { key: "fac_wifi", label: "WiFi" },
      { key: "fac_cctv", label: "CCTV" },
      {
        key: "fac_security",
        label: isId ? "Security 24 Jam" : "24-Hour Security",
      },
      { key: "fac_parking", label: isId ? "Parkir" : "Parking" },
      { key: "fac_garden", label: isId ? "Taman" : "Garden" },
      { key: "fac_water_heater", label: "Water Heater" },
      { key: "fac_kitchen_set", label: "Kitchen Set" },
      { key: "fac_dining_area", label: isId ? "Ruang Makan" : "Dining Area" },
      { key: "fac_living_room", label: isId ? "Ruang Tamu" : "Living Room" },
      { key: "fac_storage", label: isId ? "Gudang / Storage" : "Storage Room" },
      { key: "fac_balcony", label: isId ? "Balkon" : "Balcony" },
      { key: "fac_terrace", label: isId ? "Teras" : "Terrace" },
      { key: "fac_laundry_area", label: isId ? "Area Laundry" : "Laundry Area" },
    ];

    const houseFacilities: ChecklistItem[] = [
      { key: "fac_private_pool", label: isId ? "Kolam Renang Pribadi" : "Private Pool" },
      { key: "fac_shared_pool", label: isId ? "Kolam Renang" : "Swimming Pool" },
      { key: "fac_carport", label: "Carport" },
      { key: "fac_garage", label: isId ? "Garasi" : "Garage" },
      { key: "fac_maid_room", label: isId ? "Kamar ART" : "Maid Room" },
      { key: "fac_smart_lock", label: "Smart Lock" },
      { key: "fac_smart_home", label: "Smart Home" },
      { key: "fac_rooftop", label: "Rooftop" },
      { key: "fac_gazebo", label: "Gazebo" },
    ];

    const apartmentFacilities: ChecklistItem[] = [
      { key: "fac_lift", label: "Lift" },
      { key: "fac_gym", label: "Gym" },
      { key: "fac_shared_pool", label: isId ? "Kolam Renang Bersama" : "Shared Pool" },
      { key: "fac_lobby", label: "Lobby" },
      { key: "fac_reception", label: isId ? "Resepsionis" : "Reception" },
      { key: "fac_access_card", label: isId ? "Kartu Akses" : "Access Card" },
      { key: "fac_basement_parking", label: isId ? "Parkir Basement" : "Basement Parking" },
      { key: "fac_function_room", label: "Function Room" },
      { key: "fac_playground", label: isId ? "Taman Bermain Anak" : "Kids Playground" },
    ];

    const industrialFacilities: ChecklistItem[] = [
      { key: "fac_loading_dock", label: "Loading Dock" },
      { key: "fac_truck_access", label: isId ? "Akses Truk" : "Truck Access" },
      { key: "fac_office_room", label: isId ? "Ruang Kantor" : "Office Room" },
      { key: "fac_staff_room", label: isId ? "Ruang Staff" : "Staff Room" },
      { key: "fac_generator", label: "Generator" },
      { key: "fac_three_phase", label: isId ? "Listrik 3 Phase" : "3-Phase Electricity" },
      { key: "fac_high_ceiling", label: isId ? "Plafon Tinggi" : "High Ceiling" },
      { key: "fac_meeting_room", label: isId ? "Ruang Meeting" : "Meeting Room" },
    ];

    const hospitalityFacilities: ChecklistItem[] = [
      { key: "fac_reception", label: isId ? "Resepsionis" : "Reception" },
      { key: "fac_restaurant", label: isId ? "Restoran" : "Restaurant" },
      { key: "fac_spa", label: "Spa" },
      { key: "fac_housekeeping", label: isId ? "Ruang Housekeeping" : "Housekeeping Room" },
      { key: "fac_meeting_room", label: isId ? "Ruang Meeting" : "Meeting Room" },
    ];

    const commercialFacilities: ChecklistItem[] = [
      { key: "fac_lobby", label: "Lobby" },
      { key: "fac_reception", label: isId ? "Resepsionis" : "Reception" },
      { key: "fac_meeting_room", label: isId ? "Ruang Meeting" : "Meeting Room" },
      { key: "fac_generator", label: "Generator" },
      { key: "fac_lift", label: "Lift" },
    ];

    if (isApartment) return mergeChecklist(commonFacilities, apartmentFacilities);
    if (isIndustrial) return mergeChecklist(commonFacilities, industrialFacilities);
    if (isHospitality) {
      return mergeChecklist(commonFacilities, houseFacilities, hospitalityFacilities);
    }
    if (isCommercial || isRuko) {
      return mergeChecklist(commonFacilities, commercialFacilities);
    }

    return mergeChecklist(commonFacilities, houseFacilities);
  }, [isId, isApartment, isIndustrial, isHospitality, isCommercial, isRuko]);

  const nearbyItems = useMemo<ChecklistItem[]>(
    () => [
      { key: "near_cafe", label: "Cafe" },
      { key: "near_restaurant", label: isId ? "Restoran" : "Restaurant" },
      { key: "near_gym", label: "Gym" },
      { key: "near_coworking", label: "Co-working Space" },
      { key: "near_beach_club", label: "Beach Club" },
      { key: "near_beach", label: isId ? "Pantai" : "Beach" },
      { key: "near_supermarket", label: "Supermarket" },
      { key: "near_traditional_market", label: isId ? "Pasar Tradisional" : "Traditional Market" },
      { key: "near_mall", label: "Mall" },
      { key: "near_school", label: isId ? "Sekolah" : "School" },
      { key: "near_international_school", label: isId ? "Sekolah Internasional" : "International School" },
      { key: "near_university", label: isId ? "Universitas" : "University" },
      { key: "near_hospital", label: isId ? "Rumah Sakit" : "Hospital" },
      { key: "near_clinic", label: isId ? "Klinik" : "Clinic" },
      { key: "near_pharmacy", label: isId ? "Apotek" : "Pharmacy" },
      { key: "near_airport", label: isId ? "Bandara" : "Airport" },
      { key: "near_port", label: isId ? "Pelabuhan" : "Port" },
      { key: "near_toll", label: isId ? "Akses Tol" : "Toll Access" },
      { key: "near_main_road", label: isId ? "Jalan Utama" : "Main Road" },
      { key: "near_office", label: isId ? "Area Perkantoran" : "Office Area" },
      { key: "near_tourist_attraction", label: isId ? "Tempat Wisata" : "Tourist Attraction" },
    ],
    [isId]
  );

  const isValid = useMemo(() => {
    const hasPropertyType = propertyType.trim().length > 0;
    const hasPrice = getString(draftRecord, "price").trim().length > 0;
    const hasLand = usesLandSize
      ? getString(draftRecord, "lt").trim().length > 0
      : true;
    const hasBuilding = usesBuildingSize
      ? getString(draftRecord, "lb").trim().length > 0
      : true;

    if (!hasPropertyType || !hasPrice || !hasLand || !hasBuilding) {
      return false;
    }

    if (isDisewa && !getString(draftRecord, "rentalType").trim()) {
      return false;
    }

    if (isTanah && isSaleLike) {
      return (
        getString(draftRecord, "sertifikat").trim().length > 0 &&
        getString(draftRecord, "jenisKepemilikan").trim().length > 0 &&
        getString(draftRecord, "jenisTanah").trim().length > 0 &&
        getString(draftRecord, "jenisZoning").trim().length > 0
      );
    }

    return true;
  }, [
    draftRecord,
    propertyType,
    usesLandSize,
    usesBuildingSize,
    isDisewa,
    isTanah,
    isSaleLike,
  ]);

  function updateDraft(patch: Record<string, unknown>) {
    setDraft((prev) => {
      const previousDraft = toRecord(prev);

      return {
        ...previousDraft,
        ...patch,
      } as ListingDraft;
    });
  }

  function updateNestedBoolean(
    parentKey: "fasilitas" | "nearby",
    itemKey: string,
    checked: boolean
  ) {
    setDraft((prev) => {
      const previousDraft = toRecord(prev);
      const previousNested = toRecord(previousDraft[parentKey]);

      return {
        ...previousDraft,
        [parentKey]: {
          ...previousNested,
          [itemKey]: checked,
        },
      } as ListingDraft;
    });
  }

  function toggleDropdown(key: string) {
    setOpenKey((prev) => (prev === key ? "" : key));
  }

  function handlePropertyTypeChange(value: string) {
    const nextPatch: Record<string, unknown> = {
      propertyType: value,
    };

    const nextIsStudio = value === "studio";
    const nextIsApartment = ["apartemen", "studio"].includes(value);
    const nextIsTanah = value === "tanah";
    const nextIsIndustrial = ["gudang", "pabrik"].includes(value);
    const nextShowFacilities = !nextIsTanah;
    const nextUsesBuildingSize = !nextIsTanah;
    const nextShowLandDetails = !nextIsApartment;
    const nextShowRoadAndDimension = nextIsTanah || nextIsIndustrial;

    if (nextIsStudio) {
      nextPatch.bed = "studio";
    } else if (getString(draftRecord, "bed") === "studio") {
      nextPatch.bed = "";
    }

    if (!nextShowLandDetails) {
      nextPatch.lt = "";
      nextPatch.landUnit = "";
      nextPatch.frontage = "";
      nextPatch.depth = "";
      nextPatch.dimensionText = "";
      nextPatch.roadAccess = "";
      nextPatch.jenisTanah = "";
      nextPatch.jenisZoning = "";
    }

    if (!nextUsesBuildingSize) {
      nextPatch.lb = "";
      nextPatch.bed = "";
      nextPatch.bath = "";
      nextPatch.maid = "";
      nextPatch.furnishing = "";
      nextPatch.garage = "";
      nextPatch.floor = "";
      nextPatch.unitFloor = "";
      nextPatch.towerBlock = "";
      nextPatch.ceilingHeight = "";
      nextPatch.listrik = "";
      nextPatch.jenisAir = "";
    }

    if (!nextShowRoadAndDimension) {
      nextPatch.frontage = "";
      nextPatch.depth = "";
      nextPatch.dimensionText = "";
      nextPatch.roadAccess = "";
    }

    if (!nextShowFacilities) {
      nextPatch.fasilitas = {};
    }

    updateDraft(nextPatch);
  }

  function handleSaleTypeChange(value: string) {
    const patch: Record<string, unknown> = {
      saleType: value,
      jenisKepemilikan: saleTypeOwnershipMap[value] ?? "",
    };

    if (value !== "leasehold") {
      patch.leaseYears = "";
      patch.leaseUntilYear = "";
      patch.leaseExtendable = "";
    }

    updateDraft(patch);
  }

  function sanitizeHiddenFieldsBeforeNext() {
    const patch: Record<string, unknown> = {};

    if (isDisewa) {
      patch.marketType = "";
      patch.saleType = "";
      patch.leaseYears = "";
      patch.leaseUntilYear = "";
      patch.leaseExtendable = "";
      patch.sertifikat = "";
      patch.jenisKepemilikan = "";
      patch.jenisTanah = "";
      patch.jenisZoning = "";
    }

    if (!isDisewa) {
      patch.rentalType = "";
    }

    if (!isLeaseholdSale) {
      patch.leaseYears = "";
      patch.leaseUntilYear = "";
      patch.leaseExtendable = "";
    }

    if (isApartment) {
      patch.lt = "";
      patch.landUnit = "";
      patch.frontage = "";
      patch.depth = "";
      patch.dimensionText = "";
      patch.roadAccess = "";
      patch.jenisTanah = "";
      patch.jenisZoning = "";
    }

    if (isStudio) {
      patch.bed = "studio";
    }

    if (isTanah) {
      patch.lb = "";
      patch.bed = "";
      patch.bath = "";
      patch.maid = "";
      patch.furnishing = "";
      patch.garage = "";
      patch.floor = "";
      patch.unitFloor = "";
      patch.towerBlock = "";
      patch.ceilingHeight = "";
      patch.listrik = "";
      patch.jenisAir = "";
      patch.fasilitas = {};
    }

    if (!showFacilities) {
      patch.fasilitas = {};
    }

    updateDraft(patch);
  }

  function handleNext() {
    if (!isValid) return;

    sanitizeHiddenFieldsBeforeNext();
    onNext();
  }

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <Pressable style={styles.backButton} onPress={onBack}>
        <ArrowLeft color="#ffffff" size={15} />
        <Text style={styles.backButtonText}>{isId ? "Kembali" : "Back"}</Text>
      </Pressable>

      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>
            {isId ? "Detail Properti" : "Property Details"}
          </Text>

          {showPackageBadge && hasPlan ? (
            <View style={styles.packageBadge}>
              <Text style={styles.packageBadgeText}>
                {isId ? "Paket:" : "Package:"}{" "}
                {getOwnerPackageLabel(getString(draftRecord, "plan"))}
              </Text>
            </View>
          ) : null}
        </View>

        <Text style={styles.subtitle}>
          {isId
            ? "Lengkapi detail agar listing terlihat rapi, premium, dan dipercaya."
            : "Complete the details so your listing looks neat, premium, and trustworthy."}
        </Text>
      </View>

      <View style={styles.sectionCard}>
        <SectionHeader
          icon={<Home color="#e6c15c" size={21} />}
          title={isId ? "Informasi Utama" : "Main Information"}
          subtitle={
            isId
              ? "Isi tipe properti, harga, dan detail ukuran."
              : "Enter property type, price, and size details."
          }
        />

        <DropdownField
          label={isId ? "Tipe Properti" : "Property Type"}
          value={propertyType}
          placeholder={isId ? "Pilih" : "Select"}
          options={propertyTypeOptions(isId)}
          open={openKey === "propertyType"}
          required
          onToggle={() => toggleDropdown("propertyType")}
          onSelect={(value) => {
            handlePropertyTypeChange(value);
            setOpenKey("");
          }}
        />

        <FieldGap />

        {isDisewa ? (
          <DropdownField
            label={isId ? "Jenis Sewa" : "Rental Type"}
            value={getString(draftRecord, "rentalType")}
            placeholder={isId ? "Pilih" : "Select"}
            options={[
              { value: "harian", label: isId ? "Harian" : "Daily" },
              { value: "bulanan", label: isId ? "Bulanan" : "Monthly" },
              { value: "tahunan", label: isId ? "Tahunan" : "Yearly" },
            ]}
            open={openKey === "rentalType"}
            required
            onToggle={() => toggleDropdown("rentalType")}
            onSelect={(value) => {
              updateDraft({ rentalType: value });
              setOpenKey("");
            }}
          />
        ) : (
          <DropdownField
            label={isId ? "Jenis Penjualan" : "Sale Type"}
            value={saleType}
            placeholder={isId ? "Pilih" : "Select"}
            options={[
              { value: "freehold", label: "Freehold / Hak Milik" },
              { value: "leasehold", label: "Leasehold / Hak Sewa" },
              { value: "hgb", label: isId ? "HGB / Hak Guna Bangunan" : "HGB / Right to Build" },
              { value: "hak_pakai", label: isId ? "Hak Pakai" : "Right to Use" },
              { value: "lainnya", label: isId ? "Lainnya" : "Other" },
            ]}
            open={openKey === "saleType"}
            onToggle={() => toggleDropdown("saleType")}
            onSelect={(value) => {
              handleSaleTypeChange(value);
              setOpenKey("");
            }}
          />
        )}

        <FieldGap />

        <FormInput
          label={isId ? "Harga (Rp)" : "Price (Rp)"}
          required
          value={getString(draftRecord, "price")}
          onChangeText={(value) => updateDraft({ price: cleanNumber(value) })}
          placeholder={isId ? "Contoh: 1500000000" : "Example: 1500000000"}
          keyboardType="number-pad"
        />

        <FieldGap />

        {showMarketType ? (
          <>
            <DropdownField
              label={isId ? "Primary / Secondary" : "Primary / Secondary"}
              value={getString(draftRecord, "marketType")}
              placeholder={isId ? "Pilih" : "Select"}
              options={[
                { value: "primary", label: "Primary" },
                { value: "secondary", label: "Secondary" },
              ]}
              open={openKey === "marketType"}
              onToggle={() => toggleDropdown("marketType")}
              onSelect={(value) => {
                updateDraft({ marketType: value });
                setOpenKey("");
              }}
            />
            <FieldGap />
          </>
        ) : null}

        {isLeaseholdSale ? (
          <>
            <FormInput
              label={isId ? "Masa Leasehold (Tahun)" : "Leasehold Period (Years)"}
              value={getString(draftRecord, "leaseYears")}
              onChangeText={(value) => updateDraft({ leaseYears: cleanNumber(value) })}
              placeholder={isId ? "Contoh: 25" : "Example: 25"}
              keyboardType="number-pad"
            />

            <FieldGap />

            <FormInput
              label={isId ? "Leasehold Sampai Tahun" : "Leasehold Until Year"}
              value={getString(draftRecord, "leaseUntilYear")}
              onChangeText={(value) =>
                updateDraft({ leaseUntilYear: cleanNumber(value).slice(0, 4) })
              }
              placeholder={isId ? "Contoh: 2050" : "Example: 2050"}
              keyboardType="number-pad"
            />

            <FieldGap />

            <DropdownField
              label={isId ? "Bisa Diperpanjang?" : "Can Be Extended?"}
              value={getString(draftRecord, "leaseExtendable")}
              placeholder={isId ? "Pilih" : "Select"}
              options={[
                { value: "ya", label: isId ? "Ya" : "Yes" },
                { value: "tidak", label: isId ? "Tidak" : "No" },
                { value: "tidak_tahu", label: isId ? "Tidak Tahu" : "Not Sure" },
              ]}
              open={openKey === "leaseExtendable"}
              onToggle={() => toggleDropdown("leaseExtendable")}
              onSelect={(value) => {
                updateDraft({ leaseExtendable: value });
                setOpenKey("");
              }}
            />

            <FieldGap />
          </>
        ) : null}

        {usesLandSize ? (
          <>
            <FormInput
              label={isId ? "Luas Tanah" : "Land Size"}
              required
              value={getString(draftRecord, "lt")}
              onChangeText={(value) => updateDraft({ lt: cleanDecimal(value) })}
              placeholder={isId ? "Contoh: 120" : "Example: 120"}
              keyboardType="decimal-pad"
            />

            <FieldGap />

            <DropdownField
              label={isId ? "Satuan Luas Tanah" : "Land Size Unit"}
              value={landUnit}
              placeholder={isId ? "Pilih" : "Select"}
              options={[
                { value: "m2", label: "m²" },
                { value: "are", label: "Are" },
                { value: "hectare", label: isId ? "Hektare" : "Hectare" },
                { value: "acre", label: "Acre" },
              ]}
              open={openKey === "landUnit"}
              onToggle={() => toggleDropdown("landUnit")}
              onSelect={(value) => {
                updateDraft({ landUnit: value });
                setOpenKey("");
              }}
            />

            <FieldGap />
          </>
        ) : null}

        {showDimensionFields ? (
          <>
            <FormInput
              label={isId ? "Lebar / Frontage (m)" : "Frontage (m)"}
              value={getString(draftRecord, "frontage")}
              onChangeText={(value) => updateDraft({ frontage: cleanDecimal(value) })}
              placeholder={isId ? "Contoh: 10" : "Example: 10"}
              keyboardType="decimal-pad"
            />

            <FieldGap />

            <FormInput
              label={isId ? "Panjang / Depth (m)" : "Depth (m)"}
              value={getString(draftRecord, "depth")}
              onChangeText={(value) => updateDraft({ depth: cleanDecimal(value) })}
              placeholder={isId ? "Contoh: 20" : "Example: 20"}
              keyboardType="decimal-pad"
            />

            <FieldGap />

            <FormInput
              label={isId ? "Dimensi" : "Dimension"}
              value={getString(draftRecord, "dimensionText")}
              onChangeText={(value) => updateDraft({ dimensionText: value })}
              placeholder={isId ? "Contoh: 10 x 20" : "Example: 10 x 20"}
            />

            <FieldGap />
          </>
        ) : null}

        {usesBuildingSize ? (
          <>
            <FormInput
              label={
                isApartment
                  ? isId
                    ? "Luas Unit (m²)"
                    : "Unit Size (m²)"
                  : isId
                    ? "Luas Bangunan (LB) m²"
                    : "Building Size (LB) m²"
              }
              required
              value={getString(draftRecord, "lb")}
              onChangeText={(value) => updateDraft({ lb: cleanDecimal(value) })}
              placeholder={isId ? "Contoh: 90" : "Example: 90"}
              keyboardType="decimal-pad"
            />
          </>
        ) : null}
      </View>

      {autoCalculation.hasCalculation ? (
        <View style={styles.sectionCard}>
          <SectionHeader
            icon={<Calculator color="#e6c15c" size={21} />}
            title={isId ? "Estimasi Harga Otomatis" : "Automatic Price Estimate"}
            subtitle={
              isId
                ? "Perhitungan otomatis berdasarkan harga dan luas."
                : "Automatic calculation based on price and size."
            }
          />

          <View style={styles.calcGrid}>
            {landSqm > 0 ? (
              <>
                <CalcBox
                  label={isId ? "Harga per m² tanah" : "Land price per m²"}
                  value={formatRupiah(autoCalculation.landPricePerSqm)}
                />
                <CalcBox
                  label={isId ? "Harga per are" : "Price per are"}
                  value={formatRupiah(autoCalculation.landPricePerAre)}
                />
                {landSqm >= 10000 ? (
                  <CalcBox
                    label={isId ? "Harga per hektare" : "Price per hectare"}
                    value={formatRupiah(autoCalculation.landPricePerHectare)}
                  />
                ) : null}
              </>
            ) : null}

            {buildingSize > 0 && usesBuildingSize ? (
              <CalcBox
                label={
                  isApartment
                    ? isId
                      ? "Harga per m² unit"
                      : "Unit price per m²"
                    : isId
                      ? "Harga per m² bangunan"
                      : "Building price per m²"
                }
                value={formatRupiah(autoCalculation.buildingPricePerSqm)}
              />
            ) : null}

            {isLeaseholdSale && leaseYears > 0 && landSqm > 0 ? (
              <>
                <CalcBox
                  label={isId ? "Harga tanah per m² / tahun" : "Land price per m² / year"}
                  value={formatRupiah(autoCalculation.leaseLandPricePerSqmPerYear)}
                />
                <CalcBox
                  label={isId ? "Harga per are / tahun" : "Price per are / year"}
                  value={formatRupiah(autoCalculation.leaseLandPricePerArePerYear)}
                />
              </>
            ) : null}

            {isLeaseholdSale && leaseYears > 0 && buildingSize > 0 && usesBuildingSize ? (
              <CalcBox
                label={
                  isId
                    ? "Harga bangunan/unit per m² / tahun"
                    : "Building/unit price per m² / year"
                }
                value={formatRupiah(autoCalculation.leaseBuildingPricePerSqmPerYear)}
              />
            ) : null}
          </View>
        </View>
      ) : null}

      <View style={styles.sectionCard}>
        <SectionHeader
          icon={<Ruler color="#e6c15c" size={21} />}
          title={isId ? "Detail Bangunan" : "Building Details"}
          subtitle={
            isId
              ? "Field akan berubah mengikuti tipe properti."
              : "Fields change based on the selected property type."
          }
        />

        {isStudio ? (
          <>
            <StaticField label={isId ? "Kamar Tidur" : "Bedrooms"} value="Studio" />
            <FieldGap />
          </>
        ) : null}

        {showBedroomSelect ? (
          <>
            <DropdownField
              label={isId ? "Kamar Tidur" : "Bedrooms"}
              value={getString(draftRecord, "bed")}
              placeholder={isId ? "Pilih" : "Select"}
              options={numberOptions("bed")}
              open={openKey === "bed"}
              onToggle={() => toggleDropdown("bed")}
              onSelect={(value) => {
                updateDraft({ bed: value });
                setOpenKey("");
              }}
            />
            <FieldGap />
          </>
        ) : null}

        {showBedroomInput ? (
          <>
            <FormInput
              label={isId ? "Jumlah Kamar / Bedroom" : "Total Rooms / Bedrooms"}
              value={getString(draftRecord, "bed")}
              onChangeText={(value) => updateDraft({ bed: cleanNumber(value) })}
              placeholder={isId ? "Contoh: 24" : "Example: 24"}
              keyboardType="number-pad"
            />
            <FieldGap />
          </>
        ) : null}

        {showBathroomSelect ? (
          <>
            <DropdownField
              label={isId ? "Kamar Mandi" : "Bathrooms"}
              value={getString(draftRecord, "bath")}
              placeholder={isId ? "Pilih" : "Select"}
              options={numberOptions("bath")}
              open={openKey === "bath"}
              onToggle={() => toggleDropdown("bath")}
              onSelect={(value) => {
                updateDraft({ bath: value });
                setOpenKey("");
              }}
            />
            <FieldGap />
          </>
        ) : null}

        {showBathroomInput ? (
          <>
            <FormInput
              label={isId ? "Jumlah Kamar Mandi" : "Total Bathrooms"}
              value={getString(draftRecord, "bath")}
              onChangeText={(value) => updateDraft({ bath: cleanNumber(value) })}
              placeholder={isId ? "Contoh: 24" : "Example: 24"}
              keyboardType="number-pad"
            />
            <FieldGap />
          </>
        ) : null}

        {showMaidRoom ? (
          <>
            <DropdownField
              label={isId ? "Kamar ART" : "Maid Room"}
              value={getString(draftRecord, "maid")}
              placeholder={isId ? "Pilih" : "Select"}
              options={[
                { value: "0", label: "0" },
                { value: "1", label: "1" },
                { value: "2", label: "2" },
                { value: "3", label: "3" },
                { value: "4+", label: "4+" },
              ]}
              open={openKey === "maid"}
              onToggle={() => toggleDropdown("maid")}
              onSelect={(value) => {
                updateDraft({ maid: value });
                setOpenKey("");
              }}
            />
            <FieldGap />
          </>
        ) : null}

        {showFurnishing ? (
          <>
            <DropdownField
              label="Furnishing"
              value={getString(draftRecord, "furnishing")}
              placeholder={isId ? "Pilih" : "Select"}
              options={[
                { value: "unfurnished", label: isId ? "Tanpa Furnitur" : "Unfurnished" },
                { value: "semi", label: "Semi Furnished" },
                { value: "full", label: "Full Furnished" },
              ]}
              open={openKey === "furnishing"}
              onToggle={() => toggleDropdown("furnishing")}
              onSelect={(value) => {
                updateDraft({ furnishing: value });
                setOpenKey("");
              }}
            />
            <FieldGap />
          </>
        ) : null}

        {showParking ? (
          <>
            <DropdownField
              label="Parking"
              value={getString(draftRecord, "garage")}
              placeholder={isId ? "Pilih" : "Select"}
              options={[
                { value: "ada", label: isId ? "Ada" : "Available" },
                { value: "tidak_ada", label: isId ? "Tidak Ada" : "Not Available" },
              ]}
              open={openKey === "garage"}
              onToggle={() => toggleDropdown("garage")}
              onSelect={(value) => {
                updateDraft({ garage: value });
                setOpenKey("");
              }}
            />
            <FieldGap />
          </>
        ) : null}

        {showFloor ? (
          <>
            <DropdownField
              label={isId ? "Jumlah Lantai" : "Total Floors"}
              value={getString(draftRecord, "floor")}
              placeholder={isId ? "Pilih" : "Select"}
              options={[
                "1",
                "1.5",
                "2",
                "2.5",
                "3",
                "3.5",
                "4",
                "4.5",
                "5",
                "6",
                "7",
                "8",
                "9",
                "10+",
              ].map((value) => ({ value, label: value }))}
              open={openKey === "floor"}
              onToggle={() => toggleDropdown("floor")}
              onSelect={(value) => {
                updateDraft({ floor: value });
                setOpenKey("");
              }}
            />
            <FieldGap />
          </>
        ) : null}

        {showUnitFloor ? (
          <>
            <FormInput
              label={isId ? "Lantai Unit" : "Unit Floor"}
              value={getString(draftRecord, "unitFloor")}
              onChangeText={(value) => updateDraft({ unitFloor: cleanNumber(value) })}
              placeholder={isId ? "Contoh: 12" : "Example: 12"}
              keyboardType="number-pad"
            />
            <FieldGap />
          </>
        ) : null}

        {showTowerBlock ? (
          <>
            <FormInput
              label={isId ? "Tower / Blok" : "Tower / Block"}
              value={getString(draftRecord, "towerBlock")}
              onChangeText={(value) => updateDraft({ towerBlock: value })}
              placeholder={isId ? "Contoh: Tower A" : "Example: Tower A"}
            />
            <FieldGap />
          </>
        ) : null}

        {showCeilingHeight ? (
          <>
            <FormInput
              label={isId ? "Tinggi Plafon (m)" : "Ceiling Height (m)"}
              value={getString(draftRecord, "ceilingHeight")}
              onChangeText={(value) => updateDraft({ ceilingHeight: cleanDecimal(value) })}
              placeholder={isId ? "Contoh: 6" : "Example: 6"}
              keyboardType="decimal-pad"
            />
            <FieldGap />
          </>
        ) : null}

        {showRoadAccess ? (
          <>
            <FormInput
              label={isId ? "Akses Jalan" : "Road Access"}
              value={getString(draftRecord, "roadAccess")}
              onChangeText={(value) => updateDraft({ roadAccess: value })}
              placeholder={isId ? "Contoh: Jalan 6 meter" : "Example: 6-meter road"}
            />
            <FieldGap />
          </>
        ) : null}

        {!isTanah ? (
          <>
            <FormInput
              label={isId ? "Listrik" : "Electricity"}
              value={getString(draftRecord, "listrik")}
              onChangeText={(value) => updateDraft({ listrik: value })}
              placeholder={isId ? "Contoh: 2200 VA" : "Example: 2200 VA"}
            />

            <FieldGap />

            <DropdownField
              label={isId ? "Jenis Air" : "Water Type"}
              value={getString(draftRecord, "jenisAir")}
              placeholder={isId ? "Pilih" : "Select"}
              options={[
                { value: "pdam", label: "PDAM" },
                { value: "sumur", label: isId ? "Sumur" : "Well Water" },
                { value: "campuran", label: isId ? "Campuran" : "Mixed" },
                { value: "lainnya", label: isId ? "Lainnya" : "Other" },
              ]}
              open={openKey === "jenisAir"}
              onToggle={() => toggleDropdown("jenisAir")}
              onSelect={(value) => {
                updateDraft({ jenisAir: value });
                setOpenKey("");
              }}
            />
          </>
        ) : null}
      </View>

      {showLegalFields ? (
        <View style={styles.sectionCard}>
          <SectionHeader
            icon={<FileText color="#e6c15c" size={21} />}
            title={isId ? "Legal & Peruntukan Lahan" : "Legal & Land Use"}
            subtitle={
              isId
                ? "Lengkapi informasi legal dan zoning sesuai data yang tersedia."
                : "Complete legal and zoning information based on available data."
            }
          />

          <DropdownField
            label={isId ? "Sertifikat" : "Certificate"}
            value={getString(draftRecord, "sertifikat")}
            placeholder={isId ? "Pilih" : "Select"}
            options={[
              "SHM",
              "SHGB",
              "SHMSRS",
              "Hak Pakai",
              "AJB",
              "PPJB",
              "Girik",
              "Letter C",
              "Petok D",
              "Akta Notarial",
              "Lainnya",
            ].map((value) => ({ value, label: value }))}
            open={openKey === "sertifikat"}
            required={isTanah}
            onToggle={() => toggleDropdown("sertifikat")}
            onSelect={(value) => {
              updateDraft({ sertifikat: value });
              setOpenKey("");
            }}
          />

          <FieldGap />

          <DropdownField
            label={isId ? "Jenis Kepemilikan" : "Ownership Type"}
            value={getString(draftRecord, "jenisKepemilikan")}
            placeholder={isId ? "Pilih" : "Select"}
            options={[
              { value: "Hak Milik / Freehold", label: "Hak Milik / Freehold" },
              { value: "Hak Sewa / Leasehold", label: "Hak Sewa / Leasehold" },
              { value: "Hak Guna Bangunan / HGB", label: "Hak Guna Bangunan / HGB" },
              { value: "Hak Pakai", label: "Hak Pakai" },
              { value: "Strata Title", label: "Strata Title" },
              { value: "Corporate Ownership", label: isId ? "Kepemilikan Perusahaan" : "Corporate Ownership" },
              { value: "Shared Ownership", label: isId ? "Kepemilikan Bersama" : "Shared Ownership" },
              { value: "Lainnya", label: isId ? "Lainnya" : "Other" },
            ]}
            open={openKey === "jenisKepemilikan"}
            required={isTanah}
            onToggle={() => toggleDropdown("jenisKepemilikan")}
            onSelect={(value) => {
              updateDraft({ jenisKepemilikan: value });
              setOpenKey("");
            }}
          />

          {showLandTypeField ? (
            <>
              <FieldGap />

              <DropdownField
                label={isId ? "Jenis Tanah" : "Land Type"}
                value={getString(draftRecord, "jenisTanah")}
                placeholder={isId ? "Pilih" : "Select"}
                options={[
                  { value: "tanah_hunian", label: isId ? "Tanah Hunian" : "Residential Land" },
                  { value: "tanah_komersial", label: isId ? "Tanah Komersial" : "Commercial Land" },
                  { value: "tanah_pariwisata", label: isId ? "Tanah Pariwisata" : "Tourism Land" },
                  { value: "tanah_pertanian", label: isId ? "Tanah Pertanian" : "Agricultural Land" },
                  { value: "tanah_industri", label: isId ? "Tanah Industri" : "Industrial Land" },
                  { value: "tanah_campuran", label: isId ? "Tanah Campuran / Mixed-use" : "Mixed-use Land" },
                  { value: "sawah", label: isId ? "Sawah" : "Rice Field" },
                  { value: "perkebunan", label: isId ? "Perkebunan" : "Plantation" },
                  { value: "beachfront", label: "Beachfront" },
                  { value: "riverfront", label: "Riverfront" },
                  { value: "hilltop", label: "Hilltop" },
                  { value: "lainnya", label: isId ? "Lainnya" : "Other" },
                ]}
                open={openKey === "jenisTanah"}
                required={isTanah}
                onToggle={() => toggleDropdown("jenisTanah")}
                onSelect={(value) => {
                  updateDraft({ jenisTanah: value });
                  setOpenKey("");
                }}
              />
            </>
          ) : null}

          {showZoningField ? (
            <>
              <FieldGap />

              <DropdownField
                label={isId ? "Zoning / Peruntukan Lahan" : "Zoning / Land Use"}
                value={getString(draftRecord, "jenisZoning")}
                placeholder={isId ? "Pilih" : "Select"}
                options={zoningOptions(isId)}
                open={openKey === "jenisZoning"}
                required={isTanah}
                onToggle={() => toggleDropdown("jenisZoning")}
                onSelect={(value) => {
                  updateDraft({ jenisZoning: value });
                  setOpenKey("");
                }}
              />

              <Text style={styles.legalNote}>
                {isId
                  ? "Informasi zoning/peruntukan lahan perlu dikonfirmasi kembali melalui RDTR, RTRW, atau pihak berwenang setempat."
                  : "Zoning/land-use information should be reconfirmed through RDTR, RTRW, or the relevant local authority."}
              </Text>
            </>
          ) : null}
        </View>
      ) : null}

      {showFacilities ? (
        <ChecklistSection
          icon={<ShieldCheck color="#e6c15c" size={21} />}
          title={isId ? "Fasilitas" : "Facilities"}
          subtitle={isId ? "Pilih fasilitas yang tersedia." : "Select the available facilities."}
          items={facilityItems}
          selected={toRecord(draftRecord.fasilitas)}
          onToggle={(key, value) => updateNestedBoolean("fasilitas", key, value)}
        />
      ) : null}

      {showNearby ? (
        <ChecklistSection
          icon={<MapPinned color="#e6c15c" size={21} />}
          title={isId ? "Terdekat" : "Nearby"}
          subtitle={isId ? "Pilih tempat atau fasilitas terdekat." : "Select nearby places or facilities."}
          items={nearbyItems}
          selected={toRecord(draftRecord.nearby)}
          onToggle={(key, value) => updateNestedBoolean("nearby", key, value)}
        />
      ) : null}

      <View style={styles.footerCard}>
        <Pressable
          style={[styles.nextButton, !isValid && styles.nextButtonDisabled]}
          disabled={!isValid}
          onPress={handleNext}
        >
          <Text style={styles.nextButtonText}>
            {isId ? "Simpan & Lanjutkan" : "Save & Continue"}
          </Text>
          <Check color="#111111" size={16} />
        </Pressable>

        {!isValid ? (
          <Text style={styles.validationText}>
            {isId
              ? "Lengkapi field wajib terlebih dahulu."
              : "Complete the required fields first."}
          </Text>
        ) : null}
      </View>
    </ScrollView>
  );
}

function SectionHeader({
  icon,
  title,
  subtitle,
}: {
  icon: ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionIcon}>{icon}</View>
      <View style={styles.sectionHeaderText}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <Text style={styles.sectionSub}>{subtitle}</Text>
      </View>
    </View>
  );
}

function FormInput({
  label,
  value,
  onChangeText,
  placeholder,
  required,
  keyboardType = "default",
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  required?: boolean;
  keyboardType?: "default" | "number-pad" | "decimal-pad";
}) {
  return (
    <View>
      <Text style={styles.inputLabel}>
        {label}
        {required ? <Text style={styles.required}> *</Text> : null}
      </Text>

      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#777777"
        keyboardType={keyboardType}
        style={styles.input}
      />
    </View>
  );
}

function StaticField({ label, value }: { label: string; value: string }) {
  return (
    <View>
      <Text style={styles.inputLabel}>{label}</Text>
      <View style={styles.staticField}>
        <Text style={styles.staticFieldText}>{value}</Text>
      </View>
    </View>
  );
}

function DropdownField({
  label,
  value,
  placeholder,
  options,
  open,
  onToggle,
  onSelect,
  required,
}: {
  label: string;
  value: string;
  placeholder: string;
  options: OptionItem[];
  open: boolean;
  onToggle: () => void;
  onSelect: (value: string) => void;
  required?: boolean;
}) {
  const selectedLabel =
    options.find((item) => item.value === value)?.label || value || placeholder;

  return (
    <View>
      <Text style={styles.inputLabel}>
        {label}
        {required ? <Text style={styles.required}> *</Text> : null}
      </Text>

      <Pressable style={styles.dropdownButton} onPress={onToggle}>
        <Text
          style={[
            styles.dropdownButtonText,
            !value && styles.dropdownPlaceholder,
          ]}
        >
          {selectedLabel}
        </Text>
        <ChevronDown color="#ffffff" size={17} />
      </Pressable>

      {open ? (
        <View style={styles.dropdownList}>
          {options.map((item) => {
            const active = value === item.value;

            return (
              <Pressable
                key={item.value}
                style={[
                  styles.dropdownItem,
                  active && styles.dropdownItemActive,
                ]}
                onPress={() => onSelect(item.value)}
              >
                <Text
                  style={[
                    styles.dropdownItemText,
                    active && styles.dropdownItemTextActive,
                  ]}
                >
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}

function ChecklistSection({
  icon,
  title,
  subtitle,
  items,
  selected,
  onToggle,
}: {
  icon: ReactNode;
  title: string;
  subtitle: string;
  items: ChecklistItem[];
  selected: Record<string, unknown>;
  onToggle: (key: string, value: boolean) => void;
}) {
  return (
    <View style={styles.sectionCard}>
      <SectionHeader icon={icon} title={title} subtitle={subtitle} />

      <View style={styles.checkGrid}>
        {items.map((item) => {
          const checked = Boolean(selected[item.key]);

          return (
            <Pressable
              key={item.key}
              style={[styles.checkItem, checked && styles.checkItemActive]}
              onPress={() => onToggle(item.key, !checked)}
            >
              <View style={[styles.checkBox, checked && styles.checkBoxActive]}>
                {checked ? <Check color="#111111" size={12} /> : null}
              </View>
              <Text style={styles.checkText}>{item.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function CalcBox({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.calcBox}>
      <Text style={styles.calcLabel}>{label}</Text>
      <Text style={styles.calcValue}>{value}</Text>
    </View>
  );
}

function FieldGap() {
  return <View style={styles.fieldGap} />;
}

function toRecord(value: unknown) {
  if (typeof value === "object" && value !== null) {
    return value as Record<string, unknown>;
  }

  return {};
}

function getString(source: Record<string, unknown>, key: string) {
  const value = source[key];

  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);

  return "";
}

function mergeChecklist(...groups: ChecklistItem[][]) {
  return Array.from(
    new Map(groups.flat().map((item) => [item.key, item])).values()
  );
}

function cleanNumber(value: string) {
  return value.replace(/[^\d]/g, "");
}

function cleanDecimal(value: string) {
  return value.replace(/[^\d.]/g, "");
}

function parseNumber(value: unknown) {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value !== "string") return 0;

  const parsed = Number(value.replace(/[^\d.]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatRupiah(value: number) {
  if (!Number.isFinite(value) || value <= 0) return "-";

  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Math.round(value));
}

function getOwnerPackageLabel(plan?: string) {
  if (plan === "featured") return "Featured";
  if (plan === "priority") return "Priority";
  return "Basic";
}

function convertLandToSqm(size: number, unit: string) {
  if (!size || size <= 0) return 0;
  if (unit === "are") return size * 100;
  if (unit === "hectare") return size * 10000;
  if (unit === "acre") return size * 4046.8564224;

  return size;
}

function numberOptions(type: "bed" | "bath"): OptionItem[] {
  const numbers =
    type === "bed"
      ? ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "10+"]
      : ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "10+"];

  return numbers.map((value) => ({ value, label: value }));
}

function propertyTypeOptions(isId: boolean): OptionItem[] {
  return [
    { value: "studio", label: "Studio" },
    { value: "rumah", label: isId ? "Rumah" : "House" },
    { value: "apartemen", label: isId ? "Apartemen" : "Apartment" },
    { value: "vila", label: isId ? "Vila" : "Villa" },
    { value: "tanah", label: isId ? "Tanah" : "Land" },
    { value: "ruko", label: isId ? "Ruko" : "Shophouse" },
    { value: "rukos", label: isId ? "Rukos" : "Shop-Boarding House" },
    { value: "kios", label: isId ? "Kios / Retail" : "Kiosk / Retail" },
    { value: "kantor", label: isId ? "Kantor" : "Office" },
    { value: "komersial", label: isId ? "Komersial" : "Commercial" },
    { value: "gudang", label: isId ? "Gudang" : "Warehouse" },
    { value: "pabrik", label: isId ? "Pabrik" : "Factory" },
    { value: "kos", label: isId ? "Kos" : "Boarding House" },
    { value: "guesthouse", label: "Guesthouse" },
    { value: "hotel", label: "Hotel" },
    { value: "resort", label: "Resort" },
  ];
}

function zoningOptions(isId: boolean): OptionItem[] {
  return [
    {
      value: "permukiman",
      label: isId ? "Permukiman / Residential" : "Residential / Permukiman",
    },
    {
      value: "perdagangan_jasa",
      label: isId
        ? "Perdagangan & Jasa / Commercial"
        : "Commercial / Trade & Services",
    },
    {
      value: "pariwisata",
      label: isId ? "Pariwisata / Tourism" : "Tourism / Pariwisata",
    },
    {
      value: "campuran",
      label: isId ? "Campuran / Mixed-use" : "Mixed-use / Campuran",
    },
    { value: "industri", label: isId ? "Industri" : "Industrial" },
    { value: "pergudangan", label: isId ? "Pergudangan" : "Warehousing" },
    { value: "pertanian", label: isId ? "Pertanian" : "Agricultural" },
    { value: "perkebunan", label: isId ? "Perkebunan" : "Plantation" },
    {
      value: "sawah_lahan_pangan",
      label: isId ? "Sawah / Lahan Pangan" : "Rice Field / Food Land",
    },
    {
      value: "konservasi_lindung",
      label: isId ? "Konservasi / Lindung" : "Conservation / Protected",
    },
    {
      value: "fasilitas_umum_sosial",
      label: isId ? "Fasilitas Umum / Sosial" : "Public / Social Facilities",
    },
    {
      value: "tidak_tahu",
      label: isId ? "Tidak Tahu / Perlu Cek RDTR" : "Not Sure / Need RDTR Check",
    },
  ];
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
    marginBottom: 15,
  },
  backButtonText: {
    color: "#ffffff",
    fontSize: 11.5,
    fontWeight: "900",
  },
  header: {
    marginBottom: 16,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
  },
  title: {
    color: "#ffffff",
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "900",
    letterSpacing: -0.6,
  },
  subtitle: {
    color: "#b8b8b8",
    fontSize: 12.7,
    lineHeight: 19,
    fontWeight: "700",
    marginTop: 7,
  },
  packageBadge: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#705d2c",
    backgroundColor: "#211a0b",
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  packageBadgeText: {
    color: "#e6c15c",
    fontSize: 9.5,
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
  inputLabel: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "900",
    marginBottom: 7,
  },
  required: {
    color: "#fb7185",
  },
  input: {
    minHeight: 50,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#303030",
    backgroundColor: "#050505",
    color: "#ffffff",
    paddingHorizontal: 13,
    fontSize: 13,
    fontWeight: "700",
  },
  staticField: {
    minHeight: 50,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#303030",
    backgroundColor: "#171717",
    justifyContent: "center",
    paddingHorizontal: 13,
  },
  staticFieldText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "900",
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
    maxHeight: 280,
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
  calcGrid: {
    gap: 9,
  },
  calcBox: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#303030",
    backgroundColor: "#050505",
    padding: 12,
  },
  calcLabel: {
    color: "#a9a9a9",
    fontSize: 11,
    fontWeight: "700",
  },
  calcValue: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "900",
    marginTop: 4,
  },
  legalNote: {
    color: "#a9a9a9",
    fontSize: 11,
    lineHeight: 16,
    fontWeight: "700",
    marginTop: 10,
  },
  checkGrid: {
    gap: 9,
  },
  checkItem: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#303030",
    backgroundColor: "#050505",
    padding: 11,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 9,
  },
  checkItemActive: {
    borderColor: "#e6c15c",
    backgroundColor: "#211a0b",
  },
  checkBox: {
    width: 20,
    height: 20,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: "#5a5a5a",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  checkBoxActive: {
    borderColor: "#e6c15c",
    backgroundColor: "#e6c15c",
  },
  checkText: {
    color: "#ffffff",
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "800",
    flex: 1,
  },
  footerCard: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#303030",
    backgroundColor: "#101010",
    padding: 15,
    gap: 10,
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
  validationText: {
    color: "#a9a9a9",
    fontSize: 11.5,
    fontWeight: "700",
    textAlign: "center",
  },
});