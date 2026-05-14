import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
    AlertTriangle,
    ArrowLeft,
    ImagePlus,
    Languages,
} from "lucide-react-native";
import { useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Alert,
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
import ListingFoto from "../../../../components/listing/ListingFoto";
import { supabase } from "../../../../lib/supabase";

type Language = "en" | "id";

function readParam(value: unknown) {
  if (Array.isArray(value)) return String(value[0] || "");
  return String(value || "");
}

function cleanText(value: any) {
  const text = String(value ?? "").trim();
  return text.length ? text : null;
}

function cleanNumber(value: any) {
  if (value === null || value === undefined) return null;

  const raw = String(value).replace(/[^\d]/g, "");
  if (!raw) return null;

  const parsed = Number(raw);
  return Number.isNaN(parsed) ? null : parsed;
}

function cleanDecimal(value: any) {
  if (value === null || value === undefined) return null;

  const raw = String(value).replace(/[^\d.]/g, "");
  if (!raw) return null;

  const parsed = Number(raw);
  return Number.isNaN(parsed) ? null : parsed;
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

export default function AgentEditListingMediaScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { draft, setDraft, clearDraft } = useListingDraft();

  const [language, setLanguage] = useState<Language>("en");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const kode = useMemo(() => readParam(params.kode), [params.kode]);
  const isId = language === "id";

  useEffect(() => {
    let ignore = false;

    async function ensureDraftLoaded() {
      if (!kode) {
        setErrorMessage(
          isId ? "Kode listing tidak ditemukan." : "Listing code not found."
        );
        setLoading(false);
        return;
      }

      const existingKode = String((draft as any)?.kode || "");
      const existingSource = String((draft as any)?.source || "");
      const hasDraftAlready =
        existingKode === kode && existingSource === "agent";

      if (hasDraftAlready) {
        setDraft((prev) => ({
          ...(prev || {}),
          mode: "edit",
          source: "agent",
          kode,
          payment: undefined,
        }) as ListingDraft);

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
              `/agent/edit-listing-media/${kode}`
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

        setDraft(loadedDraft);
        setLoading(false);
      } catch (error: any) {
        if (!ignore) {
          console.log("Tetamo mobile agent edit media load error:", error);
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
  }, [kode, draft, router, setDraft, isId]);

  const listingDraft = useMemo(() => {
    return {
      ...(draft || {}),
      mode: "edit",
      source: "agent",
      kode,
      payment: undefined,
    } as unknown as ListingDraft;
  }, [draft, kode]);

  function handleBack() {
    router.push(`/agent/edit-listing-details/${encodeURIComponent(kode)}` as any);
  }

  async function handleSubmit() {
    if (saving) return;

    try {
      setSaving(true);

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        Alert.alert(
          isId ? "Silakan login terlebih dahulu." : "Please log in first."
        );
        router.push(
          `/login?role=agent&next=${encodeURIComponent(
            `/agent/edit-listing-media/${kode}`
          )}` as any
        );
        return;
      }

      const { data: existingProperty, error: findError } = await supabase
        .from("properties")
        .select("id, kode")
        .eq("kode", kode)
        .eq("user_id", user.id)
        .eq("source", "agent")
        .maybeSingle();

      if (findError) throw findError;

      if (!existingProperty?.id) {
        throw new Error(
          isId
            ? "Listing agent tidak ditemukan atau bukan milik akun ini."
            : "Agent listing was not found or does not belong to this account."
        );
      }

      const draftAny = draft as any;

      const photos = Array.isArray(draftAny?.photos)
        ? draftAny.photos.filter(Boolean)
        : [];

      const coverIndex =
        typeof draftAny?.coverIndex === "number" ? draftAny.coverIndex : 0;

      const coverImageUrl = photos[coverIndex] || photos[0] || null;

      const updatePayload: Record<string, any> = {
        updated_at: new Date().toISOString(),

        source: "agent",

        status: "pending_approval",
        verification_status: "pending_verification",
        verified_ok: false,

        listing_type: cleanText(draftAny?.listingType),
        rental_type: cleanText(draftAny?.rentalType),
        property_type: cleanText(draftAny?.propertyType),
        market_type: cleanText(draftAny?.marketType),

        sale_type: cleanText(draftAny?.saleType),
        lease_years: cleanNumber(draftAny?.leaseYears),
        lease_until_year: cleanNumber(draftAny?.leaseUntilYear),
        lease_extendable: cleanText(draftAny?.leaseExtendable),

        title: cleanText(draftAny?.title),
        title_id: cleanText(draftAny?.title_id || draftAny?.titleId),

        description: cleanText(draftAny?.description),
        description_id: cleanText(
          draftAny?.description_id || draftAny?.descriptionId
        ),

        price: cleanNumber(draftAny?.price),

        country: "Indonesia",
        address: cleanText(draftAny?.address),
        province: cleanText(draftAny?.province),
        city: cleanText(draftAny?.city),
        area:
          cleanText(draftAny?.customHousing) ||
          cleanText(draftAny?.housingName) ||
          cleanText(draftAny?.city),

        housing_name: cleanText(draftAny?.housingName),
        custom_housing: cleanText(draftAny?.customHousing),
        location_note: cleanText(draftAny?.note),

        land_size: cleanDecimal(draftAny?.lt),
        building_size: cleanDecimal(draftAny?.lb),
        bedrooms: cleanNumber(draftAny?.bed),
        bathrooms: cleanNumber(draftAny?.bath),
        maid_room: cleanNumber(draftAny?.maid),
        garage: cleanNumber(draftAny?.garage),
        floor: cleanDecimal(draftAny?.floor),

        land_unit: cleanText(draftAny?.landUnit) || (draftAny?.lt ? "m2" : null),
        unit_floor: cleanText(draftAny?.unitFloor),
        tower_block: cleanText(draftAny?.towerBlock),
        ceiling_height: cleanDecimal(draftAny?.ceilingHeight),
        road_access: cleanText(draftAny?.roadAccess),
        frontage: cleanDecimal(draftAny?.frontage),
        depth: cleanDecimal(draftAny?.depth),
        dimension_text: cleanText(draftAny?.dimensionText),

        furnishing: cleanText(draftAny?.furnishing),
        electricity: cleanNumber(draftAny?.listrik),
        water_type: cleanText(draftAny?.jenisAir),

        certificate: cleanText(draftAny?.sertifikat),
        land_type: cleanText(draftAny?.jenisTanah),
        zoning_type: cleanText(draftAny?.jenisZoning),
        ownership_type: cleanText(draftAny?.jenisKepemilikan),

        facilities: draftAny?.fasilitas ?? {},
        nearby: draftAny?.nearby ?? {},

        video_url: cleanText(draftAny?.video),
        cover_image_url: coverImageUrl,

        transaction_status: "available",
        is_paused: false,

        ai_generated_once: Boolean(draftAny?.aiGeneratedOnce),
        ai_seo_title: cleanText(draftAny?.ai_seo_title),
        ai_seo_meta_description: cleanText(
          draftAny?.ai_seo_meta_description
        ),
        ai_social_caption: cleanText(draftAny?.ai_social_caption),
        ai_whatsapp_inquiry_message: cleanText(
          draftAny?.ai_whatsapp_inquiry_message
        ),
      };

      const { error: updateError } = await supabase
        .from("properties")
        .update(updatePayload)
        .eq("id", existingProperty.id)
        .eq("user_id", user.id)
        .eq("source", "agent");

      if (updateError) throw updateError;

      const { error: deleteImagesError } = await supabase
        .from("property_images")
        .delete()
        .eq("property_id", existingProperty.id);

      if (deleteImagesError) throw deleteImagesError;

      if (photos.length > 0) {
        const imageRows = photos.map((url: string, index: number) => ({
          property_id: existingProperty.id,
          image_url: url,
          sort_order: index,
          is_cover: index === coverIndex,
        }));

        const { error: imageInsertError } = await supabase
          .from("property_images")
          .insert(imageRows);

        if (imageInsertError) throw imageInsertError;
      }

      await clearDraft();

      router.replace(
        `/agent/listing-success?type=edit-listing&kode=${encodeURIComponent(
          existingProperty.kode || kode
        )}` as any
      );
    } catch (error: any) {
      console.log("Tetamo mobile agent edit listing error:", error);
      Alert.alert(
        error?.message ||
          (isId ? "Gagal update listing." : "Failed to update listing.")
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="light" />

        <View style={styles.loadingBox}>
          <ActivityIndicator color="#e6c15c" />
          <Text style={styles.loadingText}>
            {isId ? "Memuat media listing..." : "Loading listing media..."}
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
          <View style={styles.errorIcon}>
            <AlertTriangle color="#fecaca" size={28} />
          </View>

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
          <ImagePlus color="#e6c15c" size={19} />
        </View>

        <View style={styles.stepTextBox}>
          <Text style={styles.stepKicker}>
            {isId ? "AGENT EDIT STEP 3" : "AGENT EDIT STEP 3"}
          </Text>
          <Text style={styles.stepTitle}>
            {isId ? "Foto, Video & Deskripsi" : "Photos, Video & Description"}
          </Text>
        </View>

        <View style={styles.editPill}>
          <Text style={styles.editPillText}>EDIT</Text>
        </View>
      </View>

      {saving ? (
        <View style={styles.savingBar}>
          <ActivityIndicator color="#e6c15c" />
          <Text style={styles.savingText}>
            {isId
              ? "Mengirim perubahan listing untuk review admin..."
              : "Submitting listing changes for admin review..."}
          </Text>
        </View>
      ) : null}

      <ListingFoto
        draft={listingDraft}
        setDraft={setDraft as any}
        onBack={handleBack}
        onNext={handleSubmit}
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
  savingBar: {
    marginHorizontal: 18,
    marginBottom: 8,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#705d2c",
    backgroundColor: "#211a0b",
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },
  savingText: {
    color: "#d6d6d6",
    fontSize: 11.5,
    lineHeight: 16,
    fontWeight: "800",
    flex: 1,
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
    alignItems: "center",
    justifyContent: "center",
  },
  errorButtonText: {
    color: "#111111",
    fontSize: 12.5,
    fontWeight: "900",
  },
});