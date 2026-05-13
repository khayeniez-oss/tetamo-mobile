import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ArrowLeft, ImagePlus, Languages, ShieldCheck } from "lucide-react-native";
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

export default function OwnerEditListingMediaScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { loading, draft, setDraft, clearDraft } = useListingDraft();

  const [language, setLanguage] = useState<Language>("en");
  const [saving, setSaving] = useState(false);

  const kode = useMemo(() => {
    const value = params.kode;
    if (Array.isArray(value)) return String(value[0] || "");
    return String(value || "");
  }, [params.kode]);

  const isId = language === "id";

  useEffect(() => {
    if (!kode || loading) return;

    setDraft((prev) => ({
      ...prev,
      mode: "edit",
      source: "owner",
      kode,
    }));
  }, [kode, loading, setDraft]);

  function handleBack() {
    router.push(`/owner/edit-listing-details/${kode}` as any);
  }

  function cleanText(value: unknown) {
    const text = String(value ?? "").trim();
    return text.length ? text : null;
  }

  function cleanNumber(value: unknown) {
    if (value === null || value === undefined) return null;

    const raw = String(value).replace(/[^\d]/g, "");
    if (!raw) return null;

    const parsed = Number(raw);
    return Number.isNaN(parsed) ? null : parsed;
  }

  async function handleSubmitEdit() {
    if (!kode || saving) return;

    try {
      setSaving(true);

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        Alert.alert(isId ? "Silakan login terlebih dahulu." : "Please log in first.");
        return;
      }

      const { data: property, error: propertyError } = await supabase
        .from("properties")
        .select("id, user_id, kode")
        .eq("kode", String(kode))
        .eq("user_id", user.id)
        .maybeSingle();

      if (propertyError) throw propertyError;

      if (!property) {
        throw new Error(isId ? "Listing tidak ditemukan." : "Listing not found.");
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, phone, agency")
        .eq("id", user.id)
        .maybeSingle();

      const photos = Array.isArray(draft.photos)
        ? draft.photos.filter(Boolean)
        : [];

      const coverIndex =
        typeof draft.coverIndex === "number" ? draft.coverIndex : 0;

      const coverImageUrl = photos[coverIndex] || photos[0] || null;

      const updatePayload: Record<string, unknown> = {
        source: "owner",

        listing_type: cleanText(draft.listingType),
        rental_type: cleanText(draft.rentalType),
        property_type: cleanText(draft.propertyType),
        market_type: cleanText(draft.marketType),

        title: cleanText(draft.title),
        title_id: cleanText(draft.title_id || draft.titleId),

        description: cleanText(draft.description),
        description_id: cleanText(draft.description_id || draft.descriptionId),

        price: cleanNumber(draft.price),

        address: cleanText(draft.address),
        province: cleanText(draft.province),
        city: cleanText(draft.city),
        area:
          cleanText(draft.customHousing) ||
          cleanText(draft.housingName) ||
          cleanText(draft.city),

        housing_name: cleanText(draft.housingName),
        custom_housing: cleanText(draft.customHousing),
        location_note: cleanText(draft.note),

        land_size: cleanNumber(draft.lt),
        building_size: cleanNumber(draft.lb),
        bedrooms: cleanNumber(draft.bed),
        bathrooms: cleanNumber(draft.bath),
        maid_room: cleanNumber(draft.maid),
        garage: cleanNumber(draft.garage),
        floor: cleanNumber(draft.floor),

        furnishing: cleanText(draft.furnishing),
        electricity: cleanNumber(draft.listrik),
        water_type: cleanText(draft.jenisAir),

        certificate: cleanText(draft.sertifikat),
        land_type: cleanText(draft.jenisTanah),
        zoning_type: cleanText(draft.jenisZoning),
        ownership_type: cleanText(draft.jenisKepemilikan),

        facilities: draft.fasilitas ?? {},
        nearby: draft.nearby ?? {},

        video_url: cleanText(draft.video),
        cover_image_url: coverImageUrl,

        contact_user_id: user.id,
        contact_name:
          cleanText((profile as any)?.full_name) ||
          cleanText((user.user_metadata as any)?.full_name) ||
          cleanText(typeof user.email === "string" ? user.email.split("@")[0] : null),
        contact_phone: cleanText((profile as any)?.phone),
        contact_role: "owner",
        contact_agency: cleanText((profile as any)?.agency),

        verification_status: "pending_verification",
        updated_at: new Date().toISOString(),
      };

      const { error: updateError } = await supabase
        .from("properties")
        .update(updatePayload)
        .eq("id", property.id)
        .eq("user_id", user.id);

      if (updateError) throw updateError;

      const { error: deleteImagesError } = await supabase
        .from("property_images")
        .delete()
        .eq("property_id", property.id);

      if (deleteImagesError) throw deleteImagesError;

      if (photos.length > 0) {
        const imageRows = photos.map((url: string, index: number) => ({
          property_id: property.id,
          image_url: url,
          sort_order: index,
          is_cover: index === coverIndex,
        }));

        const { error: insertImagesError } = await supabase
          .from("property_images")
          .insert(imageRows);

        if (insertImagesError) throw insertImagesError;
      }

      await clearDraft();

      router.replace(
        `/owner/payment-success?mode=edit&status=pending-approval&kode=${encodeURIComponent(
          String(kode)
        )}` as any
      );
    } catch (error: any) {
      console.log("Tetamo mobile edit listing update error:", error);
      Alert.alert(
        error?.message ||
          (isId ? "Gagal memperbarui listing." : "Failed to update listing.")
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
            {isId ? "EDIT STEP 3" : "EDIT STEP 3"}
          </Text>
          <Text style={styles.stepTitle}>
            {isId ? "Foto, Video & Deskripsi" : "Photos, Video & Description"}
          </Text>
        </View>

        <View style={styles.reviewPill}>
          <ShieldCheck color="#60a5fa" size={13} />
          <Text style={styles.reviewPillText}>
            {isId ? "REVIEW" : "REVIEW"}
          </Text>
        </View>
      </View>

      {saving ? (
        <View style={styles.savingBar}>
          <ActivityIndicator color="#e6c15c" />
          <Text style={styles.savingText}>
            {isId
              ? "Menyimpan perubahan dan mengirim untuk review..."
              : "Saving changes and submitting for review..."}
          </Text>
        </View>
      ) : null}

      <ListingFoto
        draft={
          {
            ...draft,
            mode: "edit",
            source: "owner",
            kode,
          } as ListingDraft
        }
        setDraft={setDraft}
        onBack={handleBack}
        onNext={handleSubmitEdit}
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
  reviewPill: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#1d4ed8",
    backgroundColor: "#0b1624",
    paddingHorizontal: 9,
    paddingVertical: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  reviewPillText: {
    color: "#60a5fa",
    fontSize: 9,
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
});