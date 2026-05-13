import * as Clipboard from "expo-clipboard";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import {
    ArrowLeft,
    Bot,
    Check,
    Copy,
    ImagePlus,
    Play,
    Sparkles,
    Trash2,
    Upload,
    Video,
} from "lucide-react-native";
import {
    useEffect,
    useMemo,
    useRef,
    useState,
    type Dispatch,
    type SetStateAction,
} from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
    Linking,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import { supabase } from "../../lib/supabase";
import type { ListingDraft } from "./ListingDraftContext";

type Language = "en" | "id";
type SourceType = "owner" | "agent";

type Props = {
  draft: ListingDraft;
  setDraft: Dispatch<SetStateAction<ListingDraft>>;
  onNext: () => void;
  onBack: () => void;
  language?: Language;
};

type AiPropertyContent = {
  englishTitle?: string;
  indonesianTitle?: string;
  englishDescription?: string;
  indonesianDescription?: string;
  seoTitle?: string;
  seoMetaDescription?: string;
  socialCaption?: string;
  whatsappInquiryMessage?: string;
};

type AiPropertyResponse = {
  success?: boolean;
  data?: AiPropertyContent;
  error?: string;
  detail?: string;
};

const MAX_PHOTOS = 30;
const MIN_PHOTOS = 3;
const MAX_TITLE = 150;
const MAX_DESC = 2000;
const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const MAX_VIDEO_SIZE = 100 * 1024 * 1024;

const ALLOWED_IMAGE_EXTENSIONS = ["jpg", "jpeg", "png", "webp", "heic", "heif"];
const ALLOWED_VIDEO_EXTENSIONS = ["mp4", "mov", "webm"];

const PROPERTY_TYPE_LABELS: Record<string, string> = {
  studio: "Studio",
  rumah: "House",
  apartemen: "Apartment",
  gudang: "Warehouse",
  guesthouse: "Guesthouse",
  hotel: "Hotel",
  kantor: "Office",
  kos: "Boarding House",
  resort: "Resort",
  ruko: "Shophouse",
  rukos: "Shop-Boarding House",
  tanah: "Land",
  pabrik: "Factory",
  vila: "Villa",
};

const LISTING_TYPE_LABELS: Record<string, string> = {
  dijual: "For Sale",
  disewa: "For Rent",
  lelang: "Auction",
};

const RENTAL_TYPE_LABELS: Record<string, string> = {
  harian: "Daily Rental",
  bulanan: "Monthly Rental",
  tahunan: "Yearly Rental",
  monthly: "Monthly Rental",
  yearly: "Yearly Rental",
};

const FURNISHING_LABELS: Record<string, string> = {
  unfurnished: "Unfurnished",
  semi: "Semi Furnished",
  full: "Fully Furnished",
};

const FACILITY_LABELS: Record<string, string> = {
  fac_ac: "AC",
  fac_wifi: "WiFi",
  fac_cctv: "CCTV",
  fac_security: "24-Hour Security",
  fac_parking: "Parking",
  fac_garden: "Garden",
  fac_water_heater: "Water Heater",
  fac_kitchen_set: "Kitchen Set",
  fac_dining_area: "Dining Area",
  fac_living_room: "Living Room",
  fac_storage: "Storage Room",
  fac_balcony: "Balcony",
  fac_terrace: "Terrace",
  fac_laundry_area: "Laundry Area",
  fac_private_pool: "Private Pool",
  fac_shared_pool: "Swimming Pool",
  fac_carport: "Carport",
  fac_garage: "Garage",
  fac_maid_room: "Maid Room",
  fac_smart_lock: "Smart Lock",
  fac_smart_home: "Smart Home",
  fac_rooftop: "Rooftop",
  fac_gazebo: "Gazebo",
  fac_lift: "Lift",
  fac_gym: "Gym",
  fac_lobby: "Lobby",
  fac_reception: "Reception",
  fac_access_card: "Access Card",
  fac_basement_parking: "Basement Parking",
  fac_function_room: "Function Room",
  fac_playground: "Kids Playground",
  fac_loading_dock: "Loading Dock",
  fac_truck_access: "Truck Access",
  fac_office_room: "Office Room",
  fac_staff_room: "Staff Room",
  fac_generator: "Generator",
  fac_three_phase: "3-Phase Electricity",
  fac_high_ceiling: "High Ceiling",
  fac_meeting_room: "Meeting Room",
  fac_restaurant: "Restaurant",
  fac_spa: "Spa",
  fac_housekeeping: "Housekeeping Room",
};

const NEARBY_LABELS: Record<string, string> = {
  near_cafe: "Cafe",
  near_restaurant: "Restaurant",
  near_gym: "Gym",
  near_coworking: "Co-working Space",
  near_beach_club: "Beach Club",
  near_beach: "Beach",
  near_supermarket: "Supermarket",
  near_traditional_market: "Traditional Market",
  near_mall: "Mall",
  near_school: "School",
  near_international_school: "International School",
  near_university: "University",
  near_hospital: "Hospital",
  near_clinic: "Clinic",
  near_pharmacy: "Pharmacy",
  near_airport: "Airport",
  near_port: "Port",
  near_toll: "Toll Access",
  near_main_road: "Main Road",
  near_office: "Office Area",
  near_tourist_attraction: "Tourist Attraction",
};

export default function ListingFoto({
  draft,
  setDraft,
  onNext,
  onBack,
  language = "en",
}: Props) {
  const isId = language === "id";
  const hydratedRef = useRef(false);

  const mode = draft.mode === "edit" ? "edit" : "create";
  const source: SourceType = draft.source === "agent" ? "agent" : "owner";
  const isAgent = source === "agent";
  const canUseSocialCaption = isAgent;
  const shouldSubmitForApproval = mode === "edit" || isAgent;

  const [photos, setPhotos] = useState<string[]>(draft.photos || []);
  const [coverIndex, setCoverIndex] = useState(draft.coverIndex || 0);
  const [video, setVideo] = useState(draft.video || "");
  const [title, setTitle] = useState(draft.title || "");
  const [titleId, setTitleId] = useState(
    draft.title_id || draft.titleId || ""
  );
  const [description, setDescription] = useState(draft.description || "");
  const [descriptionId, setDescriptionId] = useState(
    draft.description_id || draft.descriptionId || ""
  );

  const [aiSeoTitle, setAiSeoTitle] = useState(
    String((draft as any).ai_seo_title || "")
  );
  const [aiSeoMetaDescription, setAiSeoMetaDescription] = useState(
    String((draft as any).ai_seo_meta_description || "")
  );
  const [socialCaption, setSocialCaption] = useState(
    String((draft as any).ai_social_caption || "")
  );
  const [aiWhatsappInquiryMessage, setAiWhatsappInquiryMessage] = useState(
    String((draft as any).ai_whatsapp_inquiry_message || "")
  );
  const [aiGeneratedOnce, setAiGeneratedOnce] = useState(
    Boolean((draft as any).aiGeneratedOnce)
  );

  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [generatingAi, setGeneratingAi] = useState(false);
  const [aiError, setAiError] = useState("");
  const [captionCopied, setCaptionCopied] = useState(false);

  const t = useMemo(() => {
    if (isId) {
      return {
        back: "Kembali",
        pageTitle: "Upload Foto & Video",
        pageSubtitle:
          "Lengkapi foto, video, judul, dan deskripsi agar listing tampil lebih jelas dan menarik.",
        addPhotos: "Tambah Foto",
        uploading: "Mengupload...",
        removeAll: "Hapus semua",
        noPhotosYet: "Belum ada foto.",
        englishTitle: "Judul Properti Bahasa Inggris",
        indonesianTitle: "Judul Properti Bahasa Indonesia",
        englishDescription: "Deskripsi Bahasa Inggris",
        indonesianDescription: "Deskripsi Bahasa Indonesia",
        submitForApproval: "Submit untuk Persetujuan",
        saveAndContinue: "Simpan & Lanjutkan",
        videoOptional: "Video Reels / Portrait 9:16 (Opsional)",
        noVideoYet: "Belum ada video.",
        uploadVideo: "Upload Video",
        removeVideo: "Hapus Video",
        loginFirst: "Silakan login terlebih dahulu.",
        maxPhotos: "Maksimum 30 foto.",
        minPhotos: "Minimal 3 foto diperlukan.",
        photoRequirement: "Minimal 3 foto diperlukan. Maksimum 30 foto.",
        imageTypesOnly:
          "Hanya file gambar yang diperbolehkan. Gunakan JPG, PNG, WEBP, HEIC, atau HEIF.",
        imageSizeLimit: "Ukuran foto harus di bawah 10MB.",
        photoUploadFailed: "Upload foto gagal.",
        videoMustBeVideo: "File harus berupa video.",
        videoSizeLimit: "Ukuran video harus di bawah 100MB.",
        videoUploadFailed: "Upload video gagal.",
        englishTitleRequired: "Judul Bahasa Inggris wajib diisi.",
        indonesianTitleRequired: "Judul Bahasa Indonesia wajib diisi.",
        titleLimit: "Judul maksimal 150 karakter.",
        englishDescRequired: "Deskripsi Bahasa Inggris wajib diisi.",
        indonesianDescRequired: "Deskripsi Bahasa Indonesia wajib diisi.",
        descLimit: "Deskripsi maksimal 2000 karakter.",
        coverNote: "Tekan foto kecil untuk memilih cover.",
        titleGuide:
          "Maksimal 150 karakter. Buat singkat, jelas, dan menjual.",
        descGuide:
          "Maksimal 2000 karakter. Jelaskan poin penting properti dengan jelas.",
        uploadPhotoHint:
          "Boleh upload screenshot, foto HP, JPG, PNG, WEBP, HEIC, atau HEIF.",
        aiBoxTitle: "Buat judul & deskripsi dengan AI",
        aiBoxSubtitle:
          "AI akan menggunakan detail properti, lokasi, fasilitas, dan area sekitar yang sudah Anda isi.",
        aiSocialNote:
          "Untuk agent, AI juga akan membuat caption media sosial siap pakai.",
        aiButton: "Generate dengan AI",
        aiGenerating: "Membuat...",
        aiUsedShort: "AI Sudah Digunakan",
        aiNote:
          "AI hanya dapat digunakan satu kali per listing untuk penggunaan yang adil.",
        aiNeedDetails:
          "Lengkapi detail properti terlebih dahulu sebelum menggunakan AI.",
        aiFailed: "AI gagal membuat deskripsi. Silakan coba lagi.",
        aiOverwriteConfirm:
          "Konten judul/deskripsi yang sudah ada akan diganti oleh hasil AI. Lanjutkan?",
        aiAlreadyGenerated: "AI sudah digunakan 1x untuk listing ini.",
        socialCaptionTitle: "AI Social Media Caption",
        socialCaptionSubtitle:
          "Gunakan caption ini untuk promosi listing di Instagram, Facebook, TikTok, atau WhatsApp broadcast.",
        copyCaption: "Salin Caption",
        copiedCaption: "Caption tersalin",
        openVideo: "Buka Video",
        reelsHint:
          "Area video dibuat portrait 9:16 agar sesuai dengan format Reels, TikTok, dan Shorts.",
      };
    }

    return {
      back: "Back",
      pageTitle: "Upload Photos & Video",
      pageSubtitle:
        "Complete the photos, video, title, and description so the listing looks clearer and more attractive.",
      addPhotos: "Add Photos",
      uploading: "Uploading...",
      removeAll: "Remove all",
      noPhotosYet: "No photos yet.",
      englishTitle: "English Property Title",
      indonesianTitle: "Indonesian Property Title",
      englishDescription: "English Description",
      indonesianDescription: "Indonesian Description",
      submitForApproval: "Submit for Approval",
      saveAndContinue: "Save & Continue",
      videoOptional: "Reels / Portrait 9:16 Video (Optional)",
      noVideoYet: "No video yet.",
      uploadVideo: "Upload Video",
      removeVideo: "Remove Video",
      loginFirst: "Please log in first.",
      maxPhotos: "Maximum 30 photos allowed.",
      minPhotos: "At least 3 photos are required.",
      photoRequirement: "At least 3 photos are required. Maximum 30 photos.",
      imageTypesOnly:
        "Only image files are allowed. Use JPG, PNG, WEBP, HEIC, or HEIF.",
      imageSizeLimit: "Image size must be under 10MB.",
      photoUploadFailed: "Photo upload failed.",
      videoMustBeVideo: "File must be a video.",
      videoSizeLimit: "Video size must be under 100MB.",
      videoUploadFailed: "Video upload failed.",
      englishTitleRequired: "English property title is required.",
      indonesianTitleRequired: "Indonesian property title is required.",
      titleLimit: "Title must be 150 characters or less.",
      englishDescRequired: "English description is required.",
      indonesianDescRequired: "Indonesian description is required.",
      descLimit: "Description must be 2000 characters or less.",
      coverNote: "Tap a thumbnail to choose the cover image.",
      titleGuide: "Maximum 150 characters. Keep it short, clear, and selling.",
      descGuide:
        "Maximum 2000 characters. Explain the key property points clearly.",
      uploadPhotoHint:
        "You can upload screenshots, phone photos, JPG, PNG, WEBP, HEIC, or HEIF.",
      aiBoxTitle: "Create title & description with AI",
      aiBoxSubtitle:
        "AI will use the property details, location, facilities, and nearby area you filled earlier.",
      aiSocialNote:
        "For agents, AI will also create a ready-to-use social media caption.",
      aiButton: "Generate with AI",
      aiGenerating: "Generating...",
      aiUsedShort: "AI Used",
      aiNote: "AI can only be used once per listing to control fair usage.",
      aiNeedDetails:
        "Please complete the property details first before using AI.",
      aiFailed: "AI failed to generate the description. Please try again.",
      aiOverwriteConfirm:
        "Existing title/description content will be replaced by the AI result. Continue?",
      aiAlreadyGenerated: "AI has already been used 1x for this listing.",
      socialCaptionTitle: "AI Social Media Caption",
      socialCaptionSubtitle:
        "Use this caption to promote the listing on Instagram, Facebook, TikTok, or WhatsApp broadcast.",
      copyCaption: "Copy Caption",
      copiedCaption: "Caption copied",
      openVideo: "Open Video",
      reelsHint:
        "The video area is portrait 9:16 to match Reels, TikTok, and Shorts format.",
    };
  }, [isId]);

  useEffect(() => {
    if (hydratedRef.current) return;

    setPhotos(draft.photos || []);
    setCoverIndex(draft.coverIndex || 0);
    setVideo(draft.video || "");
    setTitle(draft.title || "");
    setTitleId(draft.title_id || draft.titleId || "");
    setDescription(draft.description || "");
    setDescriptionId(draft.description_id || draft.descriptionId || "");
    setAiSeoTitle(String((draft as any).ai_seo_title || ""));
    setAiSeoMetaDescription(
      String((draft as any).ai_seo_meta_description || "")
    );
    setSocialCaption(String((draft as any).ai_social_caption || ""));
    setAiWhatsappInquiryMessage(
      String((draft as any).ai_whatsapp_inquiry_message || "")
    );
    setAiGeneratedOnce(Boolean((draft as any).aiGeneratedOnce));

    hydratedRef.current = true;
  }, [draft]);

  useEffect(() => {
    if (!hydratedRef.current) return;

    setDraft(
      (prev) =>
        ({
          ...prev,
          source,
          photos,
          coverIndex,
          video,
          title,
          title_id: titleId,
          titleId,
          description,
          description_id: descriptionId,
          descriptionId,
          aiGeneratedOnce,
          ai_seo_title: aiSeoTitle,
          ai_seo_meta_description: aiSeoMetaDescription,
          ai_social_caption: socialCaption,
          ai_whatsapp_inquiry_message: aiWhatsappInquiryMessage,
        }) as ListingDraft
    );
  }, [
    source,
    photos,
    coverIndex,
    video,
    title,
    titleId,
    description,
    descriptionId,
    aiGeneratedOnce,
    aiSeoTitle,
    aiSeoMetaDescription,
    socialCaption,
    aiWhatsappInquiryMessage,
    setDraft,
  ]);

  useEffect(() => {
    if (photos.length === 0) {
      setCoverIndex(0);
      return;
    }

    if (coverIndex > photos.length - 1) {
      setCoverIndex(0);
    }
  }, [photos.length, coverIndex]);

  const canContinue = useMemo(() => {
    return (
      photos.length >= MIN_PHOTOS &&
      title.trim().length > 0 &&
      title.length <= MAX_TITLE &&
      titleId.trim().length > 0 &&
      titleId.length <= MAX_TITLE &&
      description.trim().length > 0 &&
      description.length <= MAX_DESC &&
      descriptionId.trim().length > 0 &&
      descriptionId.length <= MAX_DESC
    );
  }, [photos.length, title, titleId, description, descriptionId]);

  const helperMessage = useMemo(() => {
    if (photos.length < MIN_PHOTOS) return t.minPhotos;
    if (title.trim().length === 0) return t.englishTitleRequired;
    if (title.length > MAX_TITLE) return t.titleLimit;
    if (titleId.trim().length === 0) return t.indonesianTitleRequired;
    if (titleId.length > MAX_TITLE) return t.titleLimit;
    if (description.trim().length === 0) return t.englishDescRequired;
    if (description.length > MAX_DESC) return t.descLimit;
    if (descriptionId.trim().length === 0) return t.indonesianDescRequired;
    if (descriptionId.length > MAX_DESC) return t.descLimit;

    return "";
  }, [photos.length, title, titleId, description, descriptionId, t]);

  const primaryButtonLabel = shouldSubmitForApproval
    ? t.submitForApproval
    : t.saveAndContinue;

  async function ensureUserAndFolder() {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      throw new Error(t.loginFirst);
    }

    const folder = draft.mediaFolder || draft.kode || createLocalId();

    if (!draft.mediaFolder) {
      setDraft((prev) => ({
        ...prev,
        mediaFolder: folder,
      }));
    }

    return { user, folder };
  }

  async function addPhotos() {
    const remaining = MAX_PHOTOS - photos.length;

    if (remaining <= 0) {
      Alert.alert(t.maxPhotos);
      return;
    }

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert(
        isId ? "Akses foto diperlukan." : "Photo access is required."
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      selectionLimit: remaining,
      quality: 0.85,
    });

    if (result.canceled) return;

    const chosen = result.assets.slice(0, remaining);

    const validAssets = chosen.filter((asset) => {
      const fileName = asset.fileName || asset.uri;
      const ext = getFileExtension(fileName);
      const mime = String(asset.mimeType || "").toLowerCase();

      const accepted =
        mime.startsWith("image/") || ALLOWED_IMAGE_EXTENSIONS.includes(ext);

      if (!accepted) {
        Alert.alert(t.imageTypesOnly);
        return false;
      }

      if (asset.fileSize && asset.fileSize > MAX_IMAGE_SIZE) {
        Alert.alert(t.imageSizeLimit);
        return false;
      }

      return true;
    });

    if (validAssets.length === 0) return;

    try {
      setUploadingPhotos(true);

      const { user, folder } = await ensureUserAndFolder();
      const uploadedUrls: string[] = [];

      for (let i = 0; i < validAssets.length; i++) {
        const asset = validAssets[i];
        const extension = getSafeImageExtension(asset.fileName || asset.uri);
        const safeName = sanitizeFileName(
          asset.fileName || `photo-${Date.now()}-${i}.${extension}`
        );
        const path = `public/${user.id}/${folder}/images/${Date.now()}-${i}-${safeName}`;

        const arrayBuffer = await uriToArrayBuffer(asset.uri);

        const { error: uploadError } = await supabase.storage
          .from("property-images")
          .upload(path, arrayBuffer, {
            cacheControl: "3600",
            upsert: false,
            contentType: asset.mimeType || getImageContentType(extension),
          });

        if (uploadError) throw uploadError;

        const { data: publicData } = supabase.storage
          .from("property-images")
          .getPublicUrl(path);

        uploadedUrls.push(publicData.publicUrl);
      }

      setPhotos((prev) => [...prev, ...uploadedUrls]);
    } catch (error: any) {
      console.log("Tetamo photo upload error:", error);
      Alert.alert(error?.message || t.photoUploadFailed);
    } finally {
      setUploadingPhotos(false);
    }
  }

  async function addVideo() {
    const result = await DocumentPicker.getDocumentAsync({
      type: ["video/mp4", "video/quicktime", "video/webm", "video/*"],
      copyToCacheDirectory: true,
      multiple: false,
    });

    if (result.canceled) return;

    const asset = result.assets[0];
    if (!asset) return;

    const ext = getFileExtension(asset.name || asset.uri);
    const mime = String(asset.mimeType || "").toLowerCase();

    const accepted =
      mime.startsWith("video/") || ALLOWED_VIDEO_EXTENSIONS.includes(ext);

    if (!accepted) {
      Alert.alert(t.videoMustBeVideo);
      return;
    }

    if (asset.size && asset.size > MAX_VIDEO_SIZE) {
      Alert.alert(t.videoSizeLimit);
      return;
    }

    try {
      setUploadingVideo(true);

      const { user, folder } = await ensureUserAndFolder();

      if (video) {
        const oldPath = getPublicFilePathFromUrl(video, "property-videos");
        if (oldPath) {
          await supabase.storage.from("property-videos").remove([oldPath]);
        }
      }

      const extension = getSafeVideoExtension(asset.name || asset.uri);
      const safeName = sanitizeFileName(
        asset.name || `video-${Date.now()}.${extension}`
      );
      const path = `public/${user.id}/${folder}/video/${Date.now()}-${safeName}`;

      const arrayBuffer = await uriToArrayBuffer(asset.uri);

      const { error: uploadError } = await supabase.storage
        .from("property-videos")
        .upload(path, arrayBuffer, {
          cacheControl: "3600",
          upsert: true,
          contentType: asset.mimeType || getVideoContentType(extension),
        });

      if (uploadError) throw uploadError;

      const { data: publicData } = supabase.storage
        .from("property-videos")
        .getPublicUrl(path);

      setVideo(publicData.publicUrl);
    } catch (error: any) {
      console.log("Tetamo video upload error:", error);
      Alert.alert(error?.message || t.videoUploadFailed);
    } finally {
      setUploadingVideo(false);
    }
  }

  async function removePhoto(index: number) {
    const targetUrl = photos[index];
    const path = getPublicFilePathFromUrl(targetUrl, "property-images");

    setPhotos((prev) => prev.filter((_, itemIndex) => itemIndex !== index));

    if (!path) return;

    try {
      await supabase.storage.from("property-images").remove([path]);
    } catch (error) {
      console.log("Tetamo remove photo error:", error);
    }
  }

  async function clearAllPhotos() {
    const paths = photos
      .map((url) => getPublicFilePathFromUrl(url, "property-images"))
      .filter(Boolean) as string[];

    setPhotos([]);
    setCoverIndex(0);

    if (paths.length === 0) return;

    try {
      await supabase.storage.from("property-images").remove(paths);
    } catch (error) {
      console.log("Tetamo clear photos error:", error);
    }
  }

  async function clearVideo() {
    const path = getPublicFilePathFromUrl(video, "property-videos");
    setVideo("");

    if (!path) return;

    try {
      await supabase.storage.from("property-videos").remove([path]);
    } catch (error) {
      console.log("Tetamo clear video error:", error);
    }
  }

  function buildAiPayload() {
    return {
      source,
      propertyType: getMappedDraftText(
        draft,
        ["propertyType", "property_type", "jenisProperti", "type", "category"],
        PROPERTY_TYPE_LABELS
      ),
      location: getDraftLocation(draft),
      price: getDraftText(draft, [
        "price",
        "harga",
        "priceIdr",
        "salePrice",
        "rentPrice",
      ]),
      bedrooms: getDraftText(draft, ["bedrooms", "bedroom", "bed", "kt"]),
      bathrooms: getDraftText(draft, ["bathrooms", "bathroom", "bath", "km"]),
      landSize: joinUniqueText([
        getDraftText(draft, ["landSize", "land_size", "lt", "LT"]),
        getDraftText(draft, ["landUnit", "land_unit"]),
      ]),
      buildingSize: getDraftText(draft, [
        "buildingSize",
        "building_size",
        "lb",
        "LB",
      ]),
      furnishing: getMappedDraftText(
        draft,
        ["furnishing", "furnished", "furnish"],
        FURNISHING_LABELS
      ),
      features: getDraftFeatures(draft),
      purpose: getMappedDraftText(
        draft,
        ["purpose", "listingType", "listing_type", "transactionType"],
        LISTING_TYPE_LABELS
      ),
      rentalType: getMappedDraftText(
        draft,
        ["rentalType", "rental_type", "rentType"],
        RENTAL_TYPE_LABELS
      ),
      ownershipTitle: joinUniqueText([
        getDraftText(draft, ["sertifikat", "certificate", "titleType"]),
        getDraftText(draft, ["jenisKepemilikan", "ownership_type"]),
        getDraftText(draft, ["jenisTanah", "land_type"]),
        getDraftText(draft, ["jenisZoning", "zoning_type"]),
      ]),
      nearbyPlaces: getDraftNearbyPlaces(draft),
    };
  }

  async function runAiGeneration() {
    if (generatingAi) return;

    if (aiGeneratedOnce) {
      Alert.alert(t.aiAlreadyGenerated);
      return;
    }

    const aiPayload = buildAiPayload();

    const hasBasicDetails =
      aiPayload.propertyType ||
      aiPayload.location ||
      aiPayload.price ||
      aiPayload.features ||
      aiPayload.bedrooms ||
      aiPayload.bathrooms ||
      aiPayload.landSize ||
      aiPayload.buildingSize ||
      aiPayload.nearbyPlaces;

    if (!hasBasicDetails) {
      Alert.alert(t.aiNeedDetails);
      return;
    }

    const hasExistingContent =
      title.trim() ||
      titleId.trim() ||
      description.trim() ||
      descriptionId.trim();

    if (hasExistingContent) {
      Alert.alert(
        isId ? "Ganti konten?" : "Replace content?",
        t.aiOverwriteConfirm,
        [
          { text: isId ? "Batal" : "Cancel", style: "cancel" },
          {
            text: isId ? "Lanjutkan" : "Continue",
            style: "destructive",
            onPress: () => void generateWithAi(aiPayload),
          },
        ]
      );
      return;
    }

    await generateWithAi(aiPayload);
  }

  async function generateWithAi(aiPayload: ReturnType<typeof buildAiPayload>) {
    try {
      setGeneratingAi(true);
      setAiError("");
      setCaptionCopied(false);

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        Alert.alert(isId ? "Silakan login kembali." : "Please log in again.");
        return;
      }

      const siteUrl =
        process.env.EXPO_PUBLIC_TETAMO_SITE_URL ||
        process.env.EXPO_PUBLIC_SITE_URL ||
        "https://www.tetamo.com";

      const response = await fetch(`${siteUrl}/api/ai/property-description`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(aiPayload),
      });

      const result = (await response.json()) as AiPropertyResponse;

      if (!response.ok || !result.success || !result.data) {
        throw new Error(result.detail || result.error || t.aiFailed);
      }

      const generated = result.data;

      const nextTitle = generated.englishTitle
        ? capitalizeFirstLetter(limitText(generated.englishTitle, MAX_TITLE))
        : title;

      const nextTitleId = generated.indonesianTitle
        ? capitalizeFirstLetter(limitText(generated.indonesianTitle, MAX_TITLE))
        : titleId;

      const nextDescription = generated.englishDescription
        ? capitalizeFirstLetter(
            limitText(generated.englishDescription, MAX_DESC)
          )
        : description;

      const nextDescriptionId = generated.indonesianDescription
        ? capitalizeFirstLetter(
            limitText(generated.indonesianDescription, MAX_DESC)
          )
        : descriptionId;

      const nextSeoTitle = generated.seoTitle || aiSeoTitle || "";
      const nextSeoMetaDescription =
        generated.seoMetaDescription || aiSeoMetaDescription || "";
      const nextSocialCaption =
        canUseSocialCaption && generated.socialCaption
          ? generated.socialCaption
          : socialCaption || "";
      const nextWhatsappInquiryMessage =
        generated.whatsappInquiryMessage || aiWhatsappInquiryMessage || "";

      setTitle(nextTitle);
      setTitleId(nextTitleId);
      setDescription(nextDescription);
      setDescriptionId(nextDescriptionId);
      setAiSeoTitle(nextSeoTitle);
      setAiSeoMetaDescription(nextSeoMetaDescription);
      setSocialCaption(nextSocialCaption);
      setAiWhatsappInquiryMessage(nextWhatsappInquiryMessage);
      setAiGeneratedOnce(true);

      setDraft(
        (prev) =>
          ({
            ...prev,
            source,
            title: nextTitle,
            title_id: nextTitleId,
            titleId: nextTitleId,
            description: nextDescription,
            description_id: nextDescriptionId,
            descriptionId: nextDescriptionId,
            aiGeneratedOnce: true,
            ai_seo_title: nextSeoTitle,
            ai_seo_meta_description: nextSeoMetaDescription,
            ai_social_caption: nextSocialCaption,
            ai_whatsapp_inquiry_message: nextWhatsappInquiryMessage,
          }) as ListingDraft
      );
    } catch (error: any) {
      console.log("Tetamo AI listing content error:", error);
      const message = error?.message || t.aiFailed;
      setAiError(message);
      Alert.alert(message);
    } finally {
      setGeneratingAi(false);
    }
  }

  async function copySocialCaption() {
    if (!socialCaption.trim()) return;

    await Clipboard.setStringAsync(socialCaption);
    setCaptionCopied(true);

    setTimeout(() => {
      setCaptionCopied(false);
    }, 1800);
  }

  function handleNext() {
    if (!canContinue || uploadingPhotos || uploadingVideo || generatingAi) {
      return;
    }

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
        <Text style={styles.backButtonText}>{t.back}</Text>
      </Pressable>

      <View style={styles.header}>
        <Text style={styles.title}>{t.pageTitle}</Text>
        <Text style={styles.subtitle}>{t.pageSubtitle}</Text>
      </View>

      <View style={styles.sectionCard}>
        <View style={styles.actionRow}>
          <Pressable
            style={[styles.primaryAction, uploadingPhotos && styles.disabled]}
            disabled={uploadingPhotos}
            onPress={addPhotos}
          >
            {uploadingPhotos ? (
              <ActivityIndicator color="#111111" />
            ) : (
              <ImagePlus color="#111111" size={16} />
            )}
            <Text style={styles.primaryActionText}>
              {uploadingPhotos ? t.uploading : t.addPhotos}
            </Text>
          </Pressable>

          <Pressable
            style={[
              styles.secondaryAction,
              photos.length === 0 && styles.disabled,
            ]}
            disabled={photos.length === 0 || uploadingPhotos}
            onPress={clearAllPhotos}
          >
            <Trash2 color="#ffffff" size={15} />
            <Text style={styles.secondaryActionText}>{t.removeAll}</Text>
          </Pressable>
        </View>

        <Text style={styles.hintText}>{t.uploadPhotoHint}</Text>
        <Text style={styles.requirementText}>{t.photoRequirement}</Text>

        <View style={styles.coverBox}>
          {photos.length === 0 ? (
            <Text style={styles.emptyText}>{t.noPhotosYet}</Text>
          ) : (
            <>
              <Image
                source={{ uri: photos[coverIndex] }}
                style={styles.coverImage}
              />
              <View style={styles.tetamoBadge}>
                <Text style={styles.tetamoBadgeText}>TETAMO</Text>
              </View>
            </>
          )}
        </View>

        {photos.length > 0 ? (
          <Text style={styles.coverNote}>{t.coverNote}</Text>
        ) : null}

        <View style={styles.thumbGrid}>
          {photos.map((src, index) => (
            <View key={`${src}-${index}`} style={styles.thumbWrap}>
              <Pressable
                style={[
                  styles.thumbButton,
                  coverIndex === index && styles.thumbButtonActive,
                ]}
                onPress={() => setCoverIndex(index)}
              >
                <Image source={{ uri: src }} style={styles.thumbImage} />
              </Pressable>

              <Pressable
                style={styles.removeThumb}
                onPress={() => void removePhoto(index)}
              >
                <Text style={styles.removeThumbText}>×</Text>
              </Pressable>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.sectionCard}>
        <View style={styles.sectionTitleRow}>
          <Video color="#e6c15c" size={20} />
          <Text style={styles.sectionTitle}>{t.videoOptional}</Text>
        </View>

        <Text style={styles.hintText}>{t.reelsHint}</Text>

        <View style={styles.videoOuter}>
          <View style={styles.videoReelFrame}>
            {video ? (
              <>
                <View style={styles.videoPlayIcon}>
                  <Play color="#111111" size={26} />
                </View>

                <Text style={styles.videoUploadedText}>
                  {isId ? "Video sudah diupload." : "Video uploaded."}
                </Text>

                <Pressable
                  style={styles.videoOpenButton}
                  onPress={() => void Linking.openURL(video)}
                >
                  <Text style={styles.videoOpenText}>{t.openVideo}</Text>
                </Pressable>
              </>
            ) : (
              <>
                <Video color="#777777" size={38} />
                <Text style={styles.emptyText}>{t.noVideoYet}</Text>
              </>
            )}
          </View>
        </View>

        <View style={styles.actionRow}>
          <Pressable
            style={[styles.primaryAction, uploadingVideo && styles.disabled]}
            disabled={uploadingVideo}
            onPress={addVideo}
          >
            {uploadingVideo ? (
              <ActivityIndicator color="#111111" />
            ) : (
              <Upload color="#111111" size={16} />
            )}
            <Text style={styles.primaryActionText}>
              {uploadingVideo ? t.uploading : t.uploadVideo}
            </Text>
          </Pressable>

          {video ? (
            <Pressable style={styles.secondaryAction} onPress={clearVideo}>
              <Trash2 color="#ffffff" size={15} />
              <Text style={styles.secondaryActionText}>{t.removeVideo}</Text>
            </Pressable>
          ) : null}
        </View>
      </View>

      <View style={styles.sectionCard}>
        <View style={styles.aiBox}>
          <View style={styles.aiHeader}>
            <View style={styles.aiIcon}>
              <Bot color="#e6c15c" size={21} />
            </View>

            <View style={styles.aiTextBox}>
              <Text style={styles.aiTitle}>{t.aiBoxTitle}</Text>
              <Text style={styles.aiSubtitle}>{t.aiBoxSubtitle}</Text>
              {canUseSocialCaption ? (
                <Text style={styles.aiSubtitle}>{t.aiSocialNote}</Text>
              ) : null}
              <Text style={styles.aiNote}>{t.aiNote}</Text>
            </View>
          </View>

          <Pressable
            style={[
              styles.aiButton,
              (generatingAi || aiGeneratedOnce) && styles.disabled,
            ]}
            disabled={generatingAi || aiGeneratedOnce}
            onPress={runAiGeneration}
          >
            {generatingAi ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Sparkles color="#ffffff" size={16} />
            )}
            <Text style={styles.aiButtonText}>
              {aiGeneratedOnce
                ? t.aiUsedShort
                : generatingAi
                  ? t.aiGenerating
                  : t.aiButton}
            </Text>
          </Pressable>

          {aiError ? <Text style={styles.errorText}>{aiError}</Text> : null}
        </View>

        {canUseSocialCaption && socialCaption.trim() ? (
          <View style={styles.captionBox}>
            <View style={styles.captionHeader}>
              <View>
                <Text style={styles.captionTitle}>{t.socialCaptionTitle}</Text>
                <Text style={styles.captionSub}>{t.socialCaptionSubtitle}</Text>
              </View>

              <Pressable style={styles.copyButton} onPress={copySocialCaption}>
                <Copy color="#ffffff" size={14} />
                <Text style={styles.copyButtonText}>
                  {captionCopied ? t.copiedCaption : t.copyCaption}
                </Text>
              </Pressable>
            </View>

            <Text style={styles.captionText}>{socialCaption}</Text>
          </View>
        ) : null}

        <CountedInput
          label={t.englishTitle}
          value={title}
          onChangeText={(value) =>
            setTitle(capitalizeFirstLetter(limitText(value, MAX_TITLE)))
          }
          max={MAX_TITLE}
          required
          singleLine
        />

        <Text style={styles.guideText}>{t.titleGuide}</Text>

        <CountedInput
          label={t.indonesianTitle}
          value={titleId}
          onChangeText={(value) =>
            setTitleId(capitalizeFirstLetter(limitText(value, MAX_TITLE)))
          }
          max={MAX_TITLE}
          required
          singleLine
        />

        <Text style={styles.guideText}>{t.titleGuide}</Text>

        <CountedInput
          label={t.englishDescription}
          value={description}
          onChangeText={(value) =>
            setDescription(capitalizeFirstLetter(limitText(value, MAX_DESC)))
          }
          max={MAX_DESC}
          required
          multiline
        />

        <Text style={styles.guideText}>{t.descGuide}</Text>

        <CountedInput
          label={t.indonesianDescription}
          value={descriptionId}
          onChangeText={(value) =>
            setDescriptionId(capitalizeFirstLetter(limitText(value, MAX_DESC)))
          }
          max={MAX_DESC}
          required
          multiline
        />

        <Text style={styles.guideText}>{t.descGuide}</Text>

        {!canContinue ? (
          <Text style={styles.helperMessage}>{helperMessage}</Text>
        ) : null}

        <Pressable
          style={[
            styles.nextButton,
            (!canContinue || uploadingPhotos || uploadingVideo || generatingAi) &&
              styles.disabled,
          ]}
          disabled={
            !canContinue || uploadingPhotos || uploadingVideo || generatingAi
          }
          onPress={handleNext}
        >
          <Text style={styles.nextButtonText}>{primaryButtonLabel}</Text>
          <Check color="#111111" size={16} />
        </Pressable>
      </View>
    </ScrollView>
  );
}

function CountedInput({
  label,
  value,
  onChangeText,
  max,
  required,
  singleLine,
  multiline,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  max: number;
  required?: boolean;
  singleLine?: boolean;
  multiline?: boolean;
}) {
  return (
    <View style={styles.countedWrap}>
      <View style={styles.inputTopRow}>
        <Text style={styles.inputLabel}>
          {label}
          {required ? <Text style={styles.required}> *</Text> : null}
        </Text>
        <Text style={styles.counterText}>
          {value.length}/{max}
        </Text>
      </View>

      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholderTextColor="#777777"
        style={[
          styles.textInput,
          multiline && styles.textArea,
          singleLine && styles.singleLine,
        ]}
        multiline={multiline}
        textAlignVertical={multiline ? "top" : "center"}
      />
    </View>
  );
}

async function uriToArrayBuffer(uri: string) {
  const response = await fetch(uri);
  return response.arrayBuffer();
}

function getPublicFilePathFromUrl(url: string, bucket: string) {
  const marker = `/storage/v1/object/public/${bucket}/`;
  const index = url.indexOf(marker);

  if (index === -1) return null;

  return url.slice(index + marker.length);
}

function getFileExtension(fileName: string) {
  const cleanName = String(fileName || "").split("?")[0].toLowerCase();
  const parts = cleanName.split(".");

  return parts.length > 1 ? parts.pop() || "" : "";
}

function sanitizeFileName(name: string) {
  return String(name || "file").replace(/[^a-zA-Z0-9._-]/g, "-");
}

function getSafeImageExtension(fileName: string) {
  const ext = getFileExtension(fileName);

  if (ALLOWED_IMAGE_EXTENSIONS.includes(ext)) return ext;

  return "jpg";
}

function getSafeVideoExtension(fileName: string) {
  const ext = getFileExtension(fileName);

  if (ALLOWED_VIDEO_EXTENSIONS.includes(ext)) return ext;

  return "mp4";
}

function getImageContentType(extension: string) {
  if (extension === "png") return "image/png";
  if (extension === "webp") return "image/webp";
  if (extension === "heic") return "image/heic";
  if (extension === "heif") return "image/heif";

  return "image/jpeg";
}

function getVideoContentType(extension: string) {
  if (extension === "webm") return "video/webm";
  if (extension === "mov") return "video/quicktime";

  return "video/mp4";
}

function createLocalId() {
  return `listing-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function capitalizeFirstLetter(value: string) {
  if (!value) return value;
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function limitText(value: string, limit: number) {
  return value.trimStart().slice(0, limit);
}

function normalizeDraftValue(value: unknown): string {
  if (value === null || value === undefined) return "";

  if (Array.isArray(value)) {
    return value
      .map((item) => normalizeDraftValue(item))
      .filter(Boolean)
      .join(", ");
  }

  if (typeof value === "object") {
    const objectValue = value as {
      name?: unknown;
      label?: unknown;
      title?: unknown;
      value?: unknown;
    };

    if (typeof objectValue.name === "string") return objectValue.name;
    if (typeof objectValue.label === "string") return objectValue.label;
    if (typeof objectValue.title === "string") return objectValue.title;
    if (typeof objectValue.value === "string") return objectValue.value;

    return "";
  }

  return String(value).trim();
}

function getDraftText(draft: Record<string, any>, keys: string[]) {
  for (const key of keys) {
    const value = normalizeDraftValue(draft?.[key]);
    if (value) return value;
  }

  return "";
}

function getMappedDraftText(
  draft: Record<string, any>,
  keys: string[],
  labelMap: Record<string, string>
) {
  const value = getDraftText(draft, keys);
  if (!value) return "";

  const normalized = value.trim().toLowerCase();

  return labelMap[normalized] || labelMap[value] || value;
}

function humanizeKey(key: string) {
  return key
    .replace(/^fac_/, "")
    .replace(/^near_/, "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function getBooleanRecordText(
  value: unknown,
  labelMap: Record<string, string> = {}
) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return "";

  const entries = Object.entries(value as Record<string, unknown>);

  const selected = entries
    .map(([key, rawValue]) => {
      if (rawValue === false || rawValue === null || rawValue === undefined) {
        return "";
      }

      if (rawValue === true) return labelMap[key] || humanizeKey(key);

      const normalizedValue = normalizeDraftValue(rawValue);
      if (!normalizedValue) return "";

      const label = labelMap[key] || humanizeKey(key);
      return `${label}: ${normalizedValue}`;
    })
    .filter(Boolean);

  return Array.from(new Set(selected)).join(", ");
}

function joinUniqueText(values: string[]) {
  return Array.from(
    new Set(
      values
        .map((value) => String(value || "").trim())
        .filter((value) => value.length > 0)
    )
  ).join(", ");
}

function getDraftLocation(draft: Record<string, any>) {
  const address = getDraftText(draft, ["address", "alamat", "location"]);
  const housingName = getDraftText(draft, [
    "customHousing",
    "housingName",
    "cluster",
    "buildingName",
  ]);
  const city = getDraftText(draft, ["city", "kota", "regency", "kabupaten"]);
  const province = getDraftText(draft, ["province", "provinsi"]);

  return joinUniqueText([address, housingName, city, province]);
}

function getDraftLocationNotes(draft: Record<string, any>) {
  return joinUniqueText([
    getDraftText(draft, ["note", "locationNote", "location_note"]),
    getDraftText(draft, ["roadAccess", "road_access", "aksesJalan"]),
    getDraftText(draft, ["dimensionText", "dimension_text"]),
  ]);
}

function getDraftFeatures(draft: Record<string, any>) {
  const checklistFacilities = getBooleanRecordText(
    draft?.fasilitas ?? draft?.facilities,
    FACILITY_LABELS
  );

  const rawFacilities = joinUniqueText([
    getDraftText(draft, ["features", "amenities"]),
    getDraftText(draft, ["otherFacilities", "additionalFacilities"]),
    getDraftText(draft, ["parking", "parkir"]),
    getDraftText(draft, ["pool", "swimmingPool"]),
    getDraftText(draft, ["wifi", "internet"]),
    getDraftText(draft, ["kitchen", "dapur"]),
  ]);

  return joinUniqueText([checklistFacilities, rawFacilities]);
}

function getDraftNearbyPlaces(draft: Record<string, any>) {
  const checklistNearby = getBooleanRecordText(draft?.nearby, NEARBY_LABELS);

  const rawNearby = joinUniqueText([
    getDraftText(draft, [
      "nearbyPlaces",
      "nearbyLocation",
      "surroundings",
      "hotspots",
      "areaHighlights",
    ]),
    getDraftLocationNotes(draft),
  ]);

  return joinUniqueText([checklistNearby, rawNearby]);
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: "#050505" },
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
  header: { marginBottom: 16 },
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
  sectionCard: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#303030",
    backgroundColor: "#101010",
    padding: 15,
    marginBottom: 13,
  },
  actionRow: {
    flexDirection: "row",
    gap: 9,
    marginBottom: 10,
  },
  primaryAction: {
    flex: 1,
    minHeight: 46,
    borderRadius: 16,
    backgroundColor: "#e6c15c",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    paddingHorizontal: 12,
  },
  primaryActionText: {
    color: "#111111",
    fontSize: 12,
    fontWeight: "900",
  },
  secondaryAction: {
    flex: 1,
    minHeight: 46,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#343434",
    backgroundColor: "#050505",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    paddingHorizontal: 12,
  },
  secondaryActionText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "900",
  },
  disabled: { opacity: 0.5 },
  hintText: {
    color: "#a9a9a9",
    fontSize: 11.4,
    lineHeight: 16,
    fontWeight: "700",
    marginTop: 3,
  },
  requirementText: {
    color: "#ffffff",
    fontSize: 11.5,
    fontWeight: "900",
    marginTop: 6,
  },
  coverBox: {
    marginTop: 13,
    aspectRatio: 16 / 9,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#303030",
    backgroundColor: "#050505",
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  coverImage: {
    width: "100%",
    height: "100%",
  },
  emptyText: {
    color: "#777777",
    fontSize: 12,
    fontWeight: "800",
    textAlign: "center",
    paddingHorizontal: 18,
    marginTop: 8,
  },
  tetamoBadge: {
    position: "absolute",
    right: 12,
    top: 12,
    borderRadius: 999,
    backgroundColor: "rgba(0,0,0,0.7)",
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  tetamoBadgeText: {
    color: "#ffffff",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.8,
  },
  coverNote: {
    color: "#a9a9a9",
    fontSize: 11,
    fontWeight: "700",
    marginTop: 9,
  },
  thumbGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 9,
    marginTop: 12,
  },
  thumbWrap: {
    width: "30.8%",
    aspectRatio: 1,
    position: "relative",
  },
  thumbButton: {
    width: "100%",
    height: "100%",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#303030",
    overflow: "hidden",
  },
  thumbButtonActive: {
    borderColor: "#e6c15c",
    borderWidth: 2,
  },
  thumbImage: {
    width: "100%",
    height: "100%",
  },
  removeThumb: {
    position: "absolute",
    top: -7,
    left: -7,
    width: 24,
    height: 24,
    borderRadius: 999,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
  },
  removeThumbText: {
    color: "#111111",
    fontSize: 15,
    fontWeight: "900",
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  sectionTitle: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "900",
  },
  videoOuter: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 13,
    marginBottom: 12,
  },
  videoReelFrame: {
    width: "72%",
    maxWidth: 260,
    aspectRatio: 9 / 16,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "#303030",
    backgroundColor: "#050505",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    overflow: "hidden",
  },
  videoPlayIcon: {
    width: 62,
    height: 62,
    borderRadius: 999,
    backgroundColor: "#e6c15c",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 13,
  },
  videoUploadedText: {
    color: "#ffffff",
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "900",
    marginBottom: 10,
    textAlign: "center",
  },
  videoOpenButton: {
    borderRadius: 999,
    backgroundColor: "#e6c15c",
    paddingHorizontal: 13,
    paddingVertical: 8,
  },
  videoOpenText: {
    color: "#111111",
    fontSize: 11.5,
    fontWeight: "900",
  },
  aiBox: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#705d2c",
    backgroundColor: "#211a0b",
    padding: 13,
    marginBottom: 15,
  },
  aiHeader: {
    flexDirection: "row",
    gap: 11,
  },
  aiIcon: {
    width: 42,
    height: 42,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#705d2c",
    backgroundColor: "#151106",
    alignItems: "center",
    justifyContent: "center",
  },
  aiTextBox: { flex: 1 },
  aiTitle: {
    color: "#ffffff",
    fontSize: 13.5,
    fontWeight: "900",
  },
  aiSubtitle: {
    color: "#d6d6d6",
    fontSize: 11.2,
    lineHeight: 16,
    fontWeight: "700",
    marginTop: 3,
  },
  aiNote: {
    color: "#a9a9a9",
    fontSize: 10.8,
    lineHeight: 15,
    fontWeight: "700",
    marginTop: 5,
  },
  aiButton: {
    minHeight: 44,
    borderRadius: 15,
    backgroundColor: "#111111",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    paddingHorizontal: 12,
    marginTop: 12,
  },
  aiButtonText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "900",
  },
  errorText: {
    color: "#fecaca",
    fontSize: 11.5,
    fontWeight: "700",
    marginTop: 8,
  },
  captionBox: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#303030",
    backgroundColor: "#050505",
    padding: 13,
    marginBottom: 15,
  },
  captionHeader: {
    gap: 10,
  },
  captionTitle: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "900",
  },
  captionSub: {
    color: "#a9a9a9",
    fontSize: 11,
    lineHeight: 16,
    fontWeight: "700",
    marginTop: 3,
  },
  captionText: {
    color: "#d6d6d6",
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "700",
    marginTop: 12,
  },
  copyButton: {
    alignSelf: "flex-start",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#343434",
    backgroundColor: "#101010",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  copyButtonText: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "900",
  },
  countedWrap: {
    marginTop: 14,
  },
  inputTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    marginBottom: 7,
  },
  inputLabel: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "900",
    flex: 1,
  },
  required: { color: "#fb7185" },
  counterText: {
    color: "#a9a9a9",
    fontSize: 10.5,
    fontWeight: "800",
  },
  textInput: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#303030",
    backgroundColor: "#050505",
    color: "#ffffff",
    paddingHorizontal: 13,
    paddingVertical: 13,
    fontSize: 13,
    fontWeight: "700",
  },
  singleLine: {
    minHeight: 50,
  },
  textArea: {
    minHeight: 170,
    textAlignVertical: "top",
  },
  guideText: {
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#705d2c",
    backgroundColor: "#211a0b",
    color: "#d6d6d6",
    fontSize: 11,
    lineHeight: 16,
    fontWeight: "700",
    padding: 10,
    marginTop: 8,
  },
  helperMessage: {
    color: "#a9a9a9",
    fontSize: 11.5,
    fontWeight: "700",
    marginTop: 12,
    textAlign: "center",
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
    marginTop: 15,
  },
  nextButtonText: {
    color: "#111111",
    fontSize: 13,
    fontWeight: "900",
  },
});