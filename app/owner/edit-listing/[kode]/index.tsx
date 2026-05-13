import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { AlertCircle, ArrowLeft, Languages } from "lucide-react-native";
import { useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Pressable,
    SafeAreaView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import {
    getEmptyListingDraft,
    type ListingDraft,
    type OwnerPlanType,
    useListingDraft,
} from "../../../../components/listing/ListingDraftContext";
import ListingIklan from "../../../../components/listing/ListingIklan";
import { supabase } from "../../../../lib/supabase";

type Language = "en" | "id";

type PropertyImageRow = {
  image_url: string;
  sort_order: number | null;
  is_cover: boolean | null;
};

type DraftRecord = Record<string, unknown>;

function toRecord(value: unknown): DraftRecord {
  if (typeof value === "object" && value !== null) {
    return value as DraftRecord;
  }

  return {};
}

function stringFrom(...values: unknown[]) {
  for (const value of values) {
    if (value !== null && value !== undefined) {
      return String(value);
    }
  }

  return "";
}

function optionalStringFrom(...values: unknown[]) {
  const value = stringFrom(...values);
  return value || undefined;
}

function normalizeOwnerPlanId(planId?: string | null): OwnerPlanType | undefined {
  const value = String(planId || "").trim().toLowerCase();

  if (value === "featured") return "featured";
  if (value === "priority") return "priority";
  if (value === "basic") return "basic";

  return undefined;
}

export default function OwnerEditListingScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { draft, setDraft } = useListingDraft();

  const [language, setLanguage] = useState<Language>("en");
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const kode = useMemo(() => {
    const value = params.kode;
    if (Array.isArray(value)) return String(value[0] || "");
    return String(value || "");
  }, [params.kode]);

  const isId = language === "id";

  useEffect(() => {
    let ignore = false;

    async function loadListing() {
      if (!kode) {
        if (!ignore) {
          setErrorMessage(
            isId ? "Kode listing tidak ditemukan." : "Listing code was not found."
          );
          setLoading(false);
        }

        return;
      }

      const draftRecord = toRecord(draft);

      const hasBilingualDraftFields =
        draftRecord.title_id !== undefined &&
        draftRecord.description_id !== undefined;

      if (
        draft?.mode === "edit" &&
        draft?.kode === kode &&
        hasBilingualDraftFields &&
        (draft?.title !== undefined ||
          draft?.address !== undefined ||
          draft?.photos !== undefined)
      ) {
        if (!ignore) setLoading(false);
        return;
      }

      setLoading(true);
      setErrorMessage("");

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        if (!ignore) {
          setErrorMessage(
            isId ? "Silakan login terlebih dahulu." : "Please log in first."
          );
          setLoading(false);
        }

        return;
      }

      const { data: property, error: propertyError } = await supabase
        .from("properties")
        .select("*")
        .eq("kode", kode)
        .eq("user_id", user.id)
        .maybeSingle();

      if (propertyError) {
        if (!ignore) {
          setErrorMessage(
            propertyError.message ||
              (isId ? "Gagal memuat listing." : "Failed to load listing.")
          );
          setLoading(false);
        }

        return;
      }

      if (!property) {
        if (!ignore) {
          setErrorMessage(
            isId ? "Listing tidak ditemukan." : "Listing was not found."
          );
          setLoading(false);
        }

        return;
      }

      const propertyRecord = toRecord(property);
      const propertyId = stringFrom(propertyRecord.id);

      if (!propertyId) {
        if (!ignore) {
          setErrorMessage(
            isId ? "ID listing tidak ditemukan." : "Listing ID was not found."
          );
          setLoading(false);
        }

        return;
      }

      const { data: imageRows, error: imageError } = await supabase
        .from("property_images")
        .select("image_url, sort_order, is_cover")
        .eq("property_id", propertyId)
        .order("sort_order", { ascending: true });

      if (imageError) {
        if (!ignore) {
          setErrorMessage(
            imageError.message ||
              (isId ? "Gagal memuat foto listing." : "Failed to load listing photos.")
          );
          setLoading(false);
        }

        return;
      }

      const images = ((imageRows || []) as PropertyImageRow[]).sort((a, b) => {
        const coverA = a.is_cover ? 1 : 0;
        const coverB = b.is_cover ? 1 : 0;

        if (coverA !== coverB) return coverB - coverA;

        return (a.sort_order ?? 0) - (b.sort_order ?? 0);
      });

      const photoUrls = images.map((img) => img.image_url).filter(Boolean);

      const foundCoverIndex = images.findIndex((img) => Boolean(img.is_cover));
      const coverIndex = foundCoverIndex >= 0 ? foundCoverIndex : 0;

      const verificationStatus = stringFrom(propertyRecord.verification_status);
      const fasilitas = toRecord(
        propertyRecord.fasilitas ?? propertyRecord.facilities
      );
      const nearby = toRecord(propertyRecord.nearby);

      const rawNextDraft: ListingDraft = {
        ...getEmptyListingDraft(),

        listingType: stringFrom(propertyRecord.listing_type) as ListingDraft["listingType"],
        rentalType: stringFrom(propertyRecord.rental_type) as ListingDraft["rentalType"],

        plan: normalizeOwnerPlanId(stringFrom(propertyRecord.plan_id)),

        mode: "edit",
        source: "owner",
        kode: stringFrom(propertyRecord.kode, kode),
        postedDate: optionalStringFrom(
          propertyRecord.posted_date,
          propertyRecord.created_at
        ),

        address: stringFrom(propertyRecord.address),
        province: stringFrom(propertyRecord.province),
        city: stringFrom(propertyRecord.city),
        housingName: stringFrom(propertyRecord.housing_name),
        customHousing: stringFrom(propertyRecord.custom_housing),
        note: stringFrom(propertyRecord.note, propertyRecord.location_note),

        propertyType: stringFrom(propertyRecord.property_type),
        marketType: stringFrom(propertyRecord.market_type),
        saleType: stringFrom(propertyRecord.sale_type),

        price: stringFrom(propertyRecord.price),

        lt: stringFrom(propertyRecord.lt, propertyRecord.land_size),
        lb: stringFrom(propertyRecord.lb, propertyRecord.building_size),

        bed: stringFrom(propertyRecord.bed, propertyRecord.bedrooms),
        bath: stringFrom(propertyRecord.bath, propertyRecord.bathrooms),
        maid: stringFrom(
          propertyRecord.maid,
          propertyRecord.maid_room,
          propertyRecord.maid_bedrooms
        ),

        furnishing: stringFrom(propertyRecord.furnishing),
        garage: stringFrom(propertyRecord.garage, propertyRecord.garages),
        floor: stringFrom(propertyRecord.floor, propertyRecord.floors),

        listrik: stringFrom(propertyRecord.listrik, propertyRecord.electricity),
        jenisAir: stringFrom(propertyRecord.jenis_air, propertyRecord.water_type),

        sertifikat: stringFrom(
          propertyRecord.sertifikat,
          propertyRecord.certificate
        ),
        jenisTanah: stringFrom(
          propertyRecord.jenis_tanah,
          propertyRecord.land_type
        ),
        jenisZoning: stringFrom(
          propertyRecord.jenis_zoning,
          propertyRecord.zoning_type
        ),
        jenisKepemilikan: stringFrom(
          propertyRecord.jenis_kepemilikan,
          propertyRecord.ownership_type
        ),

        landUnit: stringFrom(propertyRecord.land_unit),
        leaseYears: stringFrom(propertyRecord.lease_years),
        leaseUntilYear: stringFrom(propertyRecord.lease_until_year),
        leaseExtendable: stringFrom(propertyRecord.lease_extendable),
        frontage: stringFrom(propertyRecord.frontage),
        depth: stringFrom(propertyRecord.depth),
        dimensionText: stringFrom(propertyRecord.dimension_text),
        unitFloor: stringFrom(propertyRecord.unit_floor),
        towerBlock: stringFrom(propertyRecord.tower_block),
        ceilingHeight: stringFrom(propertyRecord.ceiling_height),
        roadAccess: stringFrom(propertyRecord.road_access),

        title: stringFrom(propertyRecord.title),
        title_id: stringFrom(propertyRecord.title_id),
        titleId: stringFrom(propertyRecord.title_id),

        description: stringFrom(propertyRecord.description),
        description_id: stringFrom(propertyRecord.description_id),
        descriptionId: stringFrom(propertyRecord.description_id),

        verification: verificationStatus
          ? {
              status: verificationStatus as ListingDraft["verification"] extends infer V
                ? V extends { status?: infer S }
                  ? S
                  : never
                : never,
            }
          : undefined,

        payment: undefined,

        fasilitas: fasilitas as Record<string, boolean>,
        nearby: nearby as Record<string, boolean>,

        photos: photoUrls,
        coverIndex,
        video: stringFrom(propertyRecord.video, propertyRecord.video_url),
        mediaFolder: optionalStringFrom(propertyRecord.media_folder),

        aiGeneratedOnce: Boolean(propertyRecord.ai_generated_once),
        ai_seo_title: stringFrom(propertyRecord.ai_seo_title),
        ai_seo_meta_description: stringFrom(propertyRecord.ai_seo_meta_description),
        ai_social_caption: stringFrom(propertyRecord.ai_social_caption),
        ai_whatsapp_inquiry_message: stringFrom(
          propertyRecord.ai_whatsapp_inquiry_message
        ),
      };

      if (!ignore) {
        setDraft(rawNextDraft);
        setLoading(false);
      }
    }

    void loadListing();

    return () => {
      ignore = true;
    };
  }, [kode, draft, setDraft, isId]);

  function handleNext() {
    router.push(`/owner/edit-listing-details/${kode}` as any);
  }

  function handleBack() {
    router.back();
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="light" />

        <View style={styles.loadingBox}>
          <ActivityIndicator color="#e6c15c" />
          <Text style={styles.loadingText}>
            {isId ? "Memuat listing..." : "Loading listing..."}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (errorMessage) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="light" />

        <View style={styles.errorWrap}>
          <View style={styles.errorIcon}>
            <AlertCircle color="#fecaca" size={30} />
          </View>

          <Text style={styles.errorTitle}>
            {isId ? "Tidak bisa membuka listing" : "Cannot open listing"}
          </Text>

          <Text style={styles.errorText}>{errorMessage}</Text>

          <Pressable style={styles.errorButton} onPress={handleBack}>
            <ArrowLeft color="#111111" size={16} />
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

      <ListingIklan
        draft={{
          ...draft,
          mode: "edit",
          source: "owner",
          kode,
        }}
        setDraft={setDraft}
        onNext={handleNext}
        language={language}
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
  errorWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  errorIcon: {
    width: 62,
    height: 62,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#7f1d1d",
    backgroundColor: "#2a0d0d",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },
  errorButtonText: {
    color: "#111111",
    fontSize: 12.5,
    fontWeight: "900",
  },
});