import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
    ArrowLeft,
    FileText,
    Languages
} from "lucide-react-native";
import { useEffect, useMemo, useRef, useState } from "react";
import {
    ActivityIndicator,
    Pressable,
    SafeAreaView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import {
    type ListingDraft,
    useListingDraft,
} from "../../../../components/listing/ListingDraftContext";
import ListingForm from "../../../../components/listing/ListingForm";
import { supabase } from "../../../../lib/supabase";

type Language = "en" | "id";
type DraftRecord = Record<string, unknown>;

function readParam(value: unknown) {
  if (Array.isArray(value)) return String(value[0] || "");
  return String(value || "");
}

function toRecord(value: unknown): DraftRecord {
  if (typeof value === "object" && value !== null) {
    return value as DraftRecord;
  }

  return {};
}

function getString(source: DraftRecord, key: string) {
  const value = source[key];

  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);

  return "";
}

function cleanString(value: unknown) {
  if (value === null || value === undefined) return undefined;
  const text = String(value).trim();
  return text.length ? text : undefined;
}

function cleanNumberString(value: unknown) {
  if (value === null || value === undefined) return undefined;
  const text = String(value).trim();
  return text.length ? text : undefined;
}

export default function AgentEditListingDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { draft, setDraft } = useListingDraft();

  const initialDraftRef = useRef<any>(draft);
  const hasLoadedRef = useRef(false);

  const [language, setLanguage] = useState<Language>("en");
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const kode = useMemo(() => readParam(params.kode), [params.kode]);
  const isId = language === "id";

  const draftRecord = useMemo(() => toRecord(draft), [draft]);

  useEffect(() => {
    let ignore = false;

    async function ensureDraftLoaded() {
      if (hasLoadedRef.current) {
        setLoading(false);
        return;
      }

      if (!kode) {
        setErrorMessage(
          isId ? "Kode listing tidak ditemukan." : "Listing code not found."
        );
        setLoading(false);
        return;
      }

      const initialDraft = initialDraftRef.current || {};
      const existingKode = String(initialDraft?.kode || "");
      const existingSource = String(initialDraft?.source || "");

      if (existingKode === kode && existingSource === "agent") {
        hasLoadedRef.current = true;
        setLoading(false);
        return;
      }

      setLoading(true);
      setErrorMessage("");

      try {
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (ignore) return;

        if (authError || !user) {
          router.replace(
            `/login?role=agent&next=${encodeURIComponent(
              `/agent/edit-listing-details/${kode}`
            )}` as any
          );
          return;
        }

        const { data: property, error: propertyError } = await supabase
          .from("properties")
          .select(
            `
            id,
            user_id,
            source,
            kode,
            posted_date,
            listing_type,
            rental_type,
            property_type,
            market_type,
            sale_type,
            lease_years,
            lease_until_year,
            lease_extendable,
            title,
            title_id,
            description,
            description_id,
            price,
            address,
            province,
            city,
            area,
            housing_name,
            custom_housing,
            location_note,
            land_size,
            building_size,
            bedrooms,
            bathrooms,
            maid_room,
            garage,
            floor,
            land_unit,
            unit_floor,
            tower_block,
            ceiling_height,
            road_access,
            frontage,
            depth,
            dimension_text,
            furnishing,
            electricity,
            water_type,
            certificate,
            land_type,
            zoning_type,
            ownership_type,
            facilities,
            nearby,
            video_url,
            cover_image_url,
            ai_generated_once,
            ai_seo_title,
            ai_seo_meta_description,
            ai_social_caption,
            ai_whatsapp_inquiry_message
          `
          )
          .eq("kode", kode)
          .eq("user_id", user.id)
          .eq("source", "agent")
          .maybeSingle();

        if (ignore) return;

        if (propertyError) throw propertyError;

        if (!property) {
          setErrorMessage(
            isId
              ? "Listing agent tidak ditemukan atau bukan milik akun ini."
              : "Agent listing was not found or does not belong to this account."
          );
          setLoading(false);
          return;
        }

        const { data: imageRows, error: imageError } = await supabase
          .from("property_images")
          .select("image_url, sort_order, is_cover")
          .eq("property_id", property.id)
          .order("sort_order", { ascending: true });

        if (ignore) return;

        if (imageError) throw imageError;

        const photos = (imageRows || [])
          .map((row: any) => String(row.image_url || ""))
          .filter(Boolean);

        const coverIndexFromDb = (imageRows || []).findIndex(
          (row: any) => row.is_cover
        );

        const loadedDraft: ListingDraft = {
          mode: "edit",
          source: "agent",
          kode: cleanString(property.kode) || kode,
          postedDate: cleanString(property.posted_date),

          listingType: cleanString(property.listing_type) as any,
          rentalType: cleanString(property.rental_type) as any,

          propertyType: cleanString(property.property_type),
          marketType: cleanString(property.market_type),

          saleType: cleanString(property.sale_type),
          leaseYears: cleanNumberString(property.lease_years),
          leaseUntilYear: cleanNumberString(property.lease_until_year),
          leaseExtendable: cleanString(property.lease_extendable),

          title: cleanString(property.title),
          title_id: cleanString(property.title_id),
          titleId: cleanString(property.title_id),

          description: cleanString(property.description),
          description_id: cleanString(property.description_id),
          descriptionId: cleanString(property.description_id),

          price: cleanNumberString(property.price),

          address: cleanString(property.address),
          province: cleanString(property.province),
          city: cleanString(property.city),
          housingName: cleanString(property.housing_name),
          customHousing: cleanString(property.custom_housing),
          note: cleanString(property.location_note),

          lt: cleanNumberString(property.land_size),
          lb: cleanNumberString(property.building_size),
          bed: cleanNumberString(property.bedrooms),
          bath: cleanNumberString(property.bathrooms),
          maid: cleanNumberString(property.maid_room),
          garage: cleanNumberString(property.garage),
          floor: cleanNumberString(property.floor),

          landUnit: cleanString(property.land_unit),
          unitFloor: cleanString(property.unit_floor),
          towerBlock: cleanString(property.tower_block),
          ceilingHeight: cleanNumberString(property.ceiling_height),
          roadAccess: cleanString(property.road_access),
          frontage: cleanNumberString(property.frontage),
          depth: cleanNumberString(property.depth),
          dimensionText: cleanString(property.dimension_text),

          furnishing: cleanString(property.furnishing),
          listrik: cleanNumberString(property.electricity),
          jenisAir: cleanString(property.water_type),

          sertifikat: cleanString(property.certificate),
          jenisTanah: cleanString(property.land_type),
          jenisZoning: cleanString(property.zoning_type),
          jenisKepemilikan: cleanString(property.ownership_type),

          fasilitas: property.facilities || {},
          nearby: property.nearby || {},

          photos,
          coverIndex: coverIndexFromDb >= 0 ? coverIndexFromDb : 0,
          video: cleanString(property.video_url),

          aiGeneratedOnce: Boolean(property.ai_generated_once),
          ai_seo_title: cleanString(property.ai_seo_title),
          ai_seo_meta_description: cleanString(property.ai_seo_meta_description),
          ai_social_caption: cleanString(property.ai_social_caption),
          ai_whatsapp_inquiry_message: cleanString(
            property.ai_whatsapp_inquiry_message
          ),
        } as ListingDraft;

        hasLoadedRef.current = true;
        setDraft(loadedDraft);
        setLoading(false);
      } catch (error: any) {
        if (!ignore) {
          console.log("Tetamo mobile agent edit detail load error:", error);
          setErrorMessage(
            error?.message ||
              (isId ? "Gagal memuat listing." : "Failed to load listing.")
          );
          setLoading(false);
        }
      }
    }

    void ensureDraftLoaded();

    return () => {
      ignore = true;
    };
  }, [kode, router, setDraft, isId]);

  const listingDraft = useMemo(() => {
    return {
      ...draftRecord,
      mode: "edit",
      source: "agent",
      kode,
      payment: undefined,
    } as unknown as ListingDraft;
  }, [draftRecord, kode]);

  const isValid = useMemo(() => {
    const propertyType = getString(draftRecord, "propertyType").trim();
    const price = getString(draftRecord, "price").trim();
    const lt = getString(draftRecord, "lt").trim();
    const listingType = getString(draftRecord, "listingType").trim();
    const rentalType = getString(draftRecord, "rentalType").trim();

    const sertifikat = getString(draftRecord, "sertifikat").trim();
    const jenisKepemilikan = getString(
      draftRecord,
      "jenisKepemilikan"
    ).trim();
    const jenisTanah = getString(draftRecord, "jenisTanah").trim();
    const jenisZoning = getString(draftRecord, "jenisZoning").trim();

    const normalizedPropertyType = propertyType.toLowerCase();
    const normalizedListingType = listingType.toLowerCase();

    const isApartment = ["apartemen", "apartment", "studio"].includes(
      normalizedPropertyType
    );

    const usesLandSize = !isApartment;
    const requiresRentalType = normalizedListingType === "disewa";
    const requiresSaleLegal = normalizedListingType !== "disewa";
    const requiresLandLegal =
      normalizedPropertyType === "tanah" && requiresSaleLegal;

    const baseValid =
      propertyType.length > 0 &&
      price.length > 0 &&
      (!usesLandSize || lt.length > 0);

    if (!baseValid) return false;

    if (requiresRentalType && rentalType.length === 0) {
      return false;
    }

    if (requiresLandLegal) {
      return (
        sertifikat.length > 0 &&
        jenisKepemilikan.length > 0 &&
        jenisTanah.length > 0 &&
        jenisZoning.length > 0
      );
    }

    return true;
  }, [draftRecord]);

  function handleBack() {
    router.push(`/agent/edit-listing/${encodeURIComponent(kode)}` as any);
  }

  function handleNext() {
    if (!isValid) return;

    setDraft((prev) => ({
      ...(prev || {}),
      mode: "edit",
      source: "agent",
      kode,
      payment: undefined,
    }) as ListingDraft);

    router.push(`/agent/edit-listing-media/${encodeURIComponent(kode)}` as any);
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="light" />

        <View style={styles.loadingBox}>
          <ActivityIndicator color="#e6c15c" />
          <Text style={styles.loadingText}>
            {isId ? "Memuat detail listing..." : "Loading listing details..."}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (errorMessage) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="light" />

        <View style={styles.errorBox}>
          <Text style={styles.errorTitle}>
            {isId ? "Listing tidak ditemukan" : "Listing not found"}
          </Text>

          <Text style={styles.errorText}>{errorMessage}</Text>

          <Pressable style={styles.errorButton} onPress={handleBack}>
            <Text style={styles.errorButtonText}>
              {isId ? "Kembali" : "Back"}
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />

      <View style={styles.topBar}>
        <Pressable style={styles.backButton} onPress={handleBack}>
          <ArrowLeft color="#ffffff" size={16} />
          <Text style={styles.backText}>{isId ? "Kembali" : "Back"}</Text>
        </Pressable>

        <View style={styles.langToggle}>
          <Languages color="#e6c15c" size={14} />

          {(["en", "id"] as Language[]).map((item) => (
            <Pressable
              key={item}
              style={[
                styles.langButton,
                language === item && styles.langButtonActive,
              ]}
              onPress={() => setLanguage(item)}
            >
              <Text
                style={[
                  styles.langText,
                  language === item && styles.langTextActive,
                ]}
              >
                {item.toUpperCase()}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.stepBar}>
        <View style={styles.stepIcon}>
          <FileText color="#e6c15c" size={19} />
        </View>

        <View style={styles.stepTextBox}>
          <Text style={styles.stepKicker}>
            {isId ? "AGENT EDIT STEP 2" : "AGENT EDIT STEP 2"}
          </Text>
          <Text style={styles.stepTitle}>
            {isId ? "Detail Properti" : "Property Details"}
          </Text>
        </View>

        <View style={styles.editPill}>
          <Text style={styles.editPillText}>EDIT</Text>
        </View>
      </View>

      <ListingForm
        draft={listingDraft}
        setDraft={setDraft as any}
        onBack={handleBack}
        onNext={handleNext}
        language={language}
        showPackageBadge={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#050505",
  },
  topBar: {
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 10,
    backgroundColor: "#050505",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  backButton: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#333333",
    backgroundColor: "#101010",
    paddingHorizontal: 12,
    paddingVertical: 9,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  backText: {
    color: "#ffffff",
    fontSize: 11.5,
    fontWeight: "900",
  },
  langToggle: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#5b4a24",
    overflow: "hidden",
    paddingLeft: 8,
  },
  langButton: {
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  langButtonActive: {
    backgroundColor: "#e6c15c",
  },
  langText: {
    color: "#e6c15c",
    fontSize: 10,
    fontWeight: "900",
  },
  langTextActive: {
    color: "#111111",
  },
  stepBar: {
    marginHorizontal: 18,
    marginBottom: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#303030",
    backgroundColor: "#101010",
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  stepIcon: {
    width: 38,
    height: 38,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#705d2c",
    backgroundColor: "#211a0b",
    alignItems: "center",
    justifyContent: "center",
  },
  stepTextBox: {
    flex: 1,
  },
  stepKicker: {
    color: "#e6c15c",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.8,
  },
  stepTitle: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "900",
    marginTop: 2,
  },
  editPill: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#60a5fa",
    backgroundColor: "#0b1624",
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  editPillText: {
    color: "#60a5fa",
    fontSize: 9.5,
    fontWeight: "900",
    letterSpacing: 0.7,
  },
  loadingBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    padding: 24,
  },
  loadingText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "800",
  },
  errorBox: {
    flex: 1,
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  errorTitle: {
    color: "#ffffff",
    fontSize: 22,
    lineHeight: 28,
    fontWeight: "900",
    textAlign: "center",
  },
  errorText: {
    color: "#fecaca",
    fontSize: 12.5,
    lineHeight: 19,
    fontWeight: "700",
    textAlign: "center",
    marginTop: 8,
  },
  errorButton: {
    minHeight: 46,
    borderRadius: 16,
    backgroundColor: "#e6c15c",
    paddingHorizontal: 16,
    marginTop: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  errorButtonText: {
    color: "#111111",
    fontSize: 12.5,
    fontWeight: "900",
  },
});