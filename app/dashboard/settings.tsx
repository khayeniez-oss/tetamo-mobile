import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";

import {
  ArrowLeft,
  Bell,
  BellRing,
  Camera,
  CheckCircle2,
  ChevronRight,
  FileText,
  Languages,
  Link2,
  Lock,
  Mail,
  MapPin,
  Phone,
  Save,
  Settings,
  ShieldCheck,
  Trash2,
  UserRound,
  XCircle,
} from "lucide-react-native";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from "react-native";

import { supabase } from "../../lib/supabase";

/*
 * =====================================================
 * TYPES
 * =====================================================
 */

type Language = "en" | "id";

type Role =
  | "owner"
  | "agent"
  | "developer"
  | "admin"
  | "guest";

type ProfileRow = {
  id: string;

  full_name: string | null;
  email: string | null;
  phone: string | null;

  role: string | null;

  agency: string | null;
  address: string | null;

  photo_url: string | null;

  instagram_url: string | null;
  facebook_url: string | null;
  tiktok_url: string | null;
  youtube_url: string | null;
  linkedin_url: string | null;
};

type PickedAsset =
  ImagePicker.ImagePickerAsset | null;

/*
 * =====================================================
 * DESIGN
 * =====================================================
 */

const BLACK = "#111111";
const WHITE = "#FFFFFF";
const CREAM = "#FBFAF7";

const GOLD_DARK = "#B8892E";
const GOLD_ACTIVE = "#F0D889";
const GOLD_SOFT = "#F4E8C5";

const BORDER = "#E8E1D7";
const MUTED = "#777169";
const SOFT = "#F5F1EA";

/*
 * =====================================================
 * HELPERS
 * =====================================================
 */

function normalizeRole(
  value: unknown
): Role {
  const role = String(
    value || ""
  ).toLowerCase();

  if (role === "owner") {
    return "owner";
  }

  if (role === "agent") {
    return "agent";
  }

  if (role === "developer") {
    return "developer";
  }

  if (role === "admin") {
    return "admin";
  }

  return "guest";
}

function normalizePhotoUrl(
  value: unknown
) {
  const url = String(
    value || ""
  ).trim();

  if (!url) {
    return "";
  }

  if (
    !/^https?:\/\//i.test(url)
  ) {
    return "";
  }

  return encodeURI(url);
}

function normalizeEmail(
  value: string
) {
  return value
    .trim()
    .toLowerCase();
}

function normalizeUrl(
  value: string
) {
  return value.trim();
}

function getFileExtension(
  asset:
    ImagePicker.ImagePickerAsset
) {
  const fileName =
    asset.fileName || "";

  const fromFile =
    fileName
      .split(".")
      .pop()
      ?.toLowerCase();

  if (
    fromFile &&
    fromFile.length <= 5
  ) {
    return fromFile;
  }

  const mimeType =
    asset.mimeType || "";

  if (
    mimeType.includes("png")
  ) {
    return "png";
  }

  if (
    mimeType.includes("webp")
  ) {
    return "webp";
  }

  if (
    mimeType.includes("jpeg") ||
    mimeType.includes("jpg")
  ) {
    return "jpg";
  }

  return "jpg";
}

/*
 * =====================================================
 * PROFILE PHOTO UPLOAD
 * =====================================================
 */

async function uploadProfilePhoto(
  userId: string,
  asset:
    ImagePicker.ImagePickerAsset
) {
  const fileExt =
    getFileExtension(asset);

  const filePath =
    `${userId}/avatar.${fileExt}`;

  const contentType =
    asset.mimeType ||
    "image/jpeg";

  const response =
    await fetch(asset.uri);

  const arrayBuffer =
    await response.arrayBuffer();

  const { error: uploadError } =
    await supabase.storage
      .from("profile-photos")
      .upload(
        filePath,
        arrayBuffer,
        {
          upsert: true,
          contentType,
        }
      );

  if (uploadError) {
    throw new Error(
      uploadError.message
    );
  }

  const { data } =
    supabase.storage
      .from("profile-photos")
      .getPublicUrl(filePath);

  const publicUrl =
    data?.publicUrl || "";

  if (!publicUrl) {
    throw new Error(
      "Upload succeeded but photo URL is empty."
    );
  }

  return publicUrl;
}

/*
 * =====================================================
 * SETTINGS SCREEN
 * =====================================================
 */

export default function DashboardSettingsScreen() {
  const router =
    useRouter();

  const [
    language,
    setLanguage,
  ] =
    useState<Language>("en");

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    refreshing,
    setRefreshing,
  ] =
    useState(false);

  const [
    saving,
    setSaving,
  ] =
    useState(false);

  const [
    uploadingPhoto,
    setUploadingPhoto,
  ] =
    useState(false);

  const [
    userId,
    setUserId,
  ] =
    useState("");

  const [
    originalEmail,
    setOriginalEmail,
  ] =
    useState("");

  const [
    role,
    setRole,
  ] =
    useState<Role>("guest");

  const [
    fullName,
    setFullName,
  ] =
    useState("");

  const [
    phone,
    setPhone,
  ] =
    useState("");

  const [
    email,
    setEmail,
  ] =
    useState("");

  const [
    agency,
    setAgency,
  ] =
    useState("");

  const [
    address,
    setAddress,
  ] =
    useState("");

  const [
    photoUrl,
    setPhotoUrl,
  ] =
    useState("");

  const [
    instagramUrl,
    setInstagramUrl,
  ] =
    useState("");

  const [
    facebookUrl,
    setFacebookUrl,
  ] =
    useState("");

  const [
    tiktokUrl,
    setTiktokUrl,
  ] =
    useState("");

  const [
    youtubeUrl,
    setYoutubeUrl,
  ] =
    useState("");

  const [
    linkedinUrl,
    setLinkedinUrl,
  ] =
    useState("");

  const [
    selectedPhoto,
    setSelectedPhoto,
  ] =
    useState<PickedAsset>(
      null
    );

  const [
    message,
    setMessage,
  ] =
    useState("");

  const [
    messageType,
    setMessageType,
  ] =
    useState<
      "success" |
      "error" |
      ""
    >("");

  const isId =
    language === "id";

  /*
   * ===================================================
   * COPY
   * ===================================================
   */

  const ui =
    useMemo(() => {
      if (isId) {
        return {
          back:
            "Kembali",

          pageTitle:
            "Pengaturan",

          pageSubtitle:
            "Kelola profil dan akun Tetamo Anda.",

          profile:
            "Profil",

          profileDesc:
            role === "agent"
              ? "Informasi yang tampil di profil agent Anda."
              : "Kelola informasi akun dan profil Anda.",

          profilePhoto:
            "Foto Profil",

          changePhoto:
            "Ubah Foto",

          photoHint:
            "JPG, PNG atau WEBP. Maksimal 5MB.",

          fullName:
            "Nama Lengkap",

          whatsapp:
            "Nomor WhatsApp",

          email:
            "Email",

          agency:
            "Nama Agency",

          address:
            "Alamat",

          socialMedia:
            "Social Media",

          socialDesc:
            "Tambahkan akun social media yang ingin ditampilkan di profil Tetamo Anda.",

          notifications:
            "Notifikasi",

          notificationsDesc:
            "Kelola update dan preferensi notifikasi Tetamo.",

          notificationCenter:
            "Pusat Notifikasi",

          notificationCenterDesc:
            "Lihat update listing, leads, pembayaran, paket, dan akun.",

          notificationSettings:
            "Pengaturan Notifikasi",

          notificationSettingsDesc:
            "Atur jenis notifikasi yang ingin Anda terima.",

          accountSafety:
            "Akun & Keamanan",

          accountSafetyDesc:
            "Legal, bantuan, privasi, dan pengelolaan akun.",

          privacyPolicy:
            "Kebijakan Privasi",

          privacyPolicyDesc:
            "Pelajari bagaimana Tetamo melindungi data Anda.",

          terms:
            "Syarat & Ketentuan",

          termsDesc:
            "Ketentuan penggunaan aplikasi dan layanan Tetamo.",

          support:
            "Pusat Bantuan",

          supportDesc:
            "Hubungi Tetamo atau laporkan kendala aplikasi.",

          deleteAccount:
            "Hapus Akun",

          deleteAccountDesc:
            "Ajukan penghapusan akun dan data pribadi Anda.",

          save:
            "Simpan Perubahan",

          saving:
            "Menyimpan...",

          loading:
            "Memuat pengaturan...",

          fullNameRequired:
            "Nama lengkap wajib diisi.",

          emailRequired:
            "Email wajib diisi.",

          imagePermission:
            "Izin akses foto diperlukan untuk mengganti foto profil.",

          imageTooLarge:
            "Ukuran foto maksimal 5MB.",

          saved:
            "Profil berhasil disimpan.",

          savedEmailChanged:
            "Profil berhasil disimpan. Silakan cek email untuk mengonfirmasi perubahan alamat email.",

          failed:
            "Gagal menyimpan profil.",

          noUser:
            "User tidak ditemukan. Silakan login kembali.",

          roleOwner:
            "Pemilik Properti",

          roleAgent:
            "Agen Properti",
        };
      }

      return {
        back:
          "Back",

        pageTitle:
          "Settings",

        pageSubtitle:
          "Manage your Tetamo profile and account.",

        profile:
          "Profile",

        profileDesc:
          role === "agent"
            ? "Information shown on your agent profile."
            : "Manage your account and profile information.",

        profilePhoto:
          "Profile Photo",

        changePhoto:
          "Change Photo",

        photoHint:
          "JPG, PNG or WEBP. Maximum 5MB.",

        fullName:
          "Full Name",

        whatsapp:
          "WhatsApp Number",

        email:
          "Email",

        agency:
          "Agency Name",

        address:
          "Address",

        socialMedia:
          "Social Media",

        socialDesc:
          "Add the social accounts you want displayed on your Tetamo profile.",

        notifications:
          "Notifications",

        notificationsDesc:
          "Manage Tetamo updates and notification preferences.",

        notificationCenter:
          "Notification Center",

        notificationCenterDesc:
          "View listing, lead, payment, package and account updates.",

        notificationSettings:
          "Notification Settings",

        notificationSettingsDesc:
          "Choose the types of notifications you want to receive.",

        accountSafety:
          "Account & Safety",

        accountSafetyDesc:
          "Legal, support, privacy and account management.",

        privacyPolicy:
          "Privacy Policy",

        privacyPolicyDesc:
          "Learn how Tetamo protects your data.",

        terms:
          "Terms & Conditions",

        termsDesc:
          "Terms for using the Tetamo app and services.",

        support:
          "Support Center",

        supportDesc:
          "Contact Tetamo or report an app issue.",

        deleteAccount:
          "Delete Account",

        deleteAccountDesc:
          "Request deletion of your account and personal data.",

        save:
          "Save Changes",

        saving:
          "Saving...",

        loading:
          "Loading settings...",

        fullNameRequired:
          "Full name is required.",

        emailRequired:
          "Email is required.",

        imagePermission:
          "Photo access is required to change your profile photo.",

        imageTooLarge:
          "Maximum photo size is 5MB.",

        saved:
          "Profile saved successfully.",

        savedEmailChanged:
          "Profile saved successfully. Please check your email to confirm the email change.",

        failed:
          "Failed to save profile.",

        noUser:
          "User not found. Please log in again.",

        roleOwner:
          "Property Owner",

        roleAgent:
          "Property Agent",
      };
    }, [
      isId,
      role,
    ]);

  const currentPhoto =
    selectedPhoto?.uri ||
    normalizePhotoUrl(
      photoUrl
    );

  const roleLabel =
    role === "agent"
      ? ui.roleAgent
      : role === "owner"
        ? ui.roleOwner
        : String(
            role || "Tetamo"
          );

  /*
   * ===================================================
   * LOAD
   * ===================================================
   */

  const loadSettings =
    useCallback(
      async () => {
        setMessage("");
        setMessageType("");

        const {
          data: { user },
          error: userError,
        } =
          await supabase.auth.getUser();

        if (
          userError ||
          !user
        ) {
          setUserId("");
          setLoading(false);
          setRefreshing(false);

          router.replace(
            "/login" as any
          );

          return;
        }

        setUserId(
          user.id
        );

        const {
          data,
          error,
        } =
          await supabase
            .from("profiles")
            .select(
              "id, full_name, email, phone, role, agency, address, photo_url, instagram_url, facebook_url, tiktok_url, youtube_url, linkedin_url"
            )
            .eq(
              "id",
              user.id
            )
            .maybeSingle();

        if (error) {
          setMessageType(
            "error"
          );

          setMessage(
            error.message
          );

          setLoading(false);
          setRefreshing(false);

          return;
        }

        const profile =
          (data ||
            null) as ProfileRow | null;

        const nextEmail =
          profile?.email ||
          user.email ||
          "";

        setRole(
          normalizeRole(
            profile?.role ||
              user.user_metadata
                ?.role
          )
        );

        setFullName(
          profile?.full_name ||
            String(
              user.user_metadata
                ?.full_name ||
                ""
            ) ||
            String(
              user.user_metadata
                ?.name ||
                ""
            )
        );

        setPhone(
          profile?.phone ||
            ""
        );

        setEmail(
          nextEmail
        );

        setOriginalEmail(
          normalizeEmail(
            nextEmail
          )
        );

        setAgency(
          profile?.agency ||
            ""
        );

        setAddress(
          profile?.address ||
            ""
        );

        setPhotoUrl(
          profile?.photo_url ||
            ""
        );

        setInstagramUrl(
          profile?.instagram_url ||
            ""
        );

        setFacebookUrl(
          profile?.facebook_url ||
            ""
        );

        setTiktokUrl(
          profile?.tiktok_url ||
            ""
        );

        setYoutubeUrl(
          profile?.youtube_url ||
            ""
        );

        setLinkedinUrl(
          profile?.linkedin_url ||
            ""
        );

        setSelectedPhoto(
          null
        );

        setLoading(false);
        setRefreshing(false);
      },
      [router]
    );

  useEffect(() => {
    void loadSettings();
  }, [loadSettings]);

  /*
   * ===================================================
   * REFRESH
   * ===================================================
   */

  async function handleRefresh() {
    setRefreshing(true);

    await loadSettings();
  }

  /*
   * ===================================================
   * PHOTO
   * ===================================================
   */

  async function pickPhoto() {
    setMessage("");
    setMessageType("");

    const permission =
      await ImagePicker
        .requestMediaLibraryPermissionsAsync();

    if (
      !permission.granted
    ) {
      Alert.alert(
        ui.imagePermission
      );

      return;
    }

    const result =
      await ImagePicker
        .launchImageLibraryAsync(
          {
            mediaTypes:
              ImagePicker
                .MediaTypeOptions
                .Images,

            allowsEditing:
              true,

            aspect:
              [1, 1],

            quality:
              0.85,
          }
        );

    if (
      result.canceled
    ) {
      return;
    }

    const asset =
      result.assets?.[0];

    if (!asset) {
      return;
    }

    if (
      asset.fileSize &&
      asset.fileSize >
        5 *
          1024 *
          1024
    ) {
      Alert.alert(
        ui.imageTooLarge
      );

      return;
    }

    setSelectedPhoto(
      asset
    );
  }

  /*
   * ===================================================
   * SAVE
   * ===================================================
   */

  async function handleSave() {
    if (!userId) {
      Alert.alert(
        ui.noUser
      );

      return;
    }

    const trimmedName =
      fullName.trim();

    const trimmedPhone =
      phone.trim();

    const normalizedEmail =
      normalizeEmail(
        email
      );

    const trimmedAgency =
      agency.trim();

    const trimmedAddress =
      address.trim();

    const trimmedInstagram =
      normalizeUrl(
        instagramUrl
      );

    const trimmedFacebook =
      normalizeUrl(
        facebookUrl
      );

    const trimmedTiktok =
      normalizeUrl(
        tiktokUrl
      );

    const trimmedYoutube =
      normalizeUrl(
        youtubeUrl
      );

    const trimmedLinkedin =
      normalizeUrl(
        linkedinUrl
      );

    if (
      !trimmedName
    ) {
      Alert.alert(
        ui.fullNameRequired
      );

      return;
    }

    if (
      !normalizedEmail
    ) {
      Alert.alert(
        ui.emailRequired
      );

      return;
    }

    setSaving(true);
    setMessage("");
    setMessageType("");

    try {
      let finalPhotoUrl =
        photoUrl;

      if (
        selectedPhoto
      ) {
        setUploadingPhoto(
          true
        );

        finalPhotoUrl =
          await uploadProfilePhoto(
            userId,
            selectedPhoto
          );

        setUploadingPhoto(
          false
        );
      }

      const emailChanged =
        normalizedEmail.length >
          0 &&
        normalizedEmail !==
          originalEmail;

      if (
        emailChanged
      ) {
        const {
          error:
            authEmailError,
        } =
          await supabase.auth.updateUser(
            {
              email:
                normalizedEmail,
            }
          );

        if (
          authEmailError
        ) {
          setSaving(
            false
          );

          setUploadingPhoto(
            false
          );

          setMessageType(
            "error"
          );

          setMessage(
            authEmailError.message
          );

          return;
        }
      }

      const {
        error:
          profileError,
      } =
        await supabase
          .from("profiles")
          .update({
            full_name:
              trimmedName,

            phone:
              trimmedPhone,

            email:
              normalizedEmail,

            agency:
              trimmedAgency,

            address:
              trimmedAddress,

            photo_url:
              finalPhotoUrl,

            instagram_url:
              trimmedInstagram,

            facebook_url:
              trimmedFacebook,

            tiktok_url:
              trimmedTiktok,

            youtube_url:
              trimmedYoutube,

            linkedin_url:
              trimmedLinkedin,
          })
          .eq(
            "id",
            userId
          );

      if (
        profileError
      ) {
        setSaving(
          false
        );

        setUploadingPhoto(
          false
        );

        setMessageType(
          "error"
        );

        setMessage(
          profileError.message
        );

        return;
      }

      setFullName(
        trimmedName
      );

      setPhone(
        trimmedPhone
      );

      setEmail(
        normalizedEmail
      );

      setOriginalEmail(
        normalizedEmail
      );

      setAgency(
        trimmedAgency
      );

      setAddress(
        trimmedAddress
      );

      setPhotoUrl(
        finalPhotoUrl
      );

      setInstagramUrl(
        trimmedInstagram
      );

      setFacebookUrl(
        trimmedFacebook
      );

      setTiktokUrl(
        trimmedTiktok
      );

      setYoutubeUrl(
        trimmedYoutube
      );

      setLinkedinUrl(
        trimmedLinkedin
      );

      setSelectedPhoto(
        null
      );

      setSaving(false);

      setUploadingPhoto(
        false
      );

      setMessageType(
        "success"
      );

      setMessage(
        emailChanged
          ? ui.savedEmailChanged
          : ui.saved
      );
    } catch (
      error: any
    ) {
      setSaving(false);

      setUploadingPhoto(
        false
      );

      setMessageType(
        "error"
      );

      setMessage(
        error?.message ||
          ui.failed
      );
    }
  }

  /*
   * ===================================================
   * SCREEN
   * ===================================================
   */

  return (
    <SafeAreaView
      style={
        styles.safeArea
      }
    >
      <StatusBar style="dark" />

      {/* =================================
          HEADER
      ================================= */}

      <View
        style={
          styles.topBar
        }
      >
        <Pressable
          style={
            styles.backButton
          }
          onPress={() =>
            router.back()
          }
        >
          <ArrowLeft
            color={BLACK}
            size={17}
          />

          <Text
            style={
              styles.backText
            }
          >
            {ui.back}
          </Text>
        </Pressable>

        <View
          style={
            styles.headerTitleBox
          }
        >
          <Text
            style={
              styles.headerTitle
            }
          >
            {ui.pageTitle}
          </Text>
        </View>

        <View
          style={
            styles.languageControl
          }
        >
          <Languages
            color={
              GOLD_DARK
            }
            size={14}
          />

          {(
            [
              "en",
              "id",
            ] as Language[]
          ).map(
            (item) => {
              const active =
                language ===
                item;

              return (
                <Pressable
                  key={item}
                  style={[
                    styles.languageButton,

                    active &&
                      styles.languageButtonActive,
                  ]}
                  onPress={() =>
                    setLanguage(
                      item
                    )
                  }
                >
                  <Text
                    style={[
                      styles.languageText,

                      active &&
                        styles.languageTextActive,
                    ]}
                  >
                    {item.toUpperCase()}
                  </Text>
                </Pressable>
              );
            }
          )}
        </View>
      </View>

      <ScrollView
        style={
          styles.scroll
        }
        contentContainerStyle={
          styles.content
        }
        showsVerticalScrollIndicator={
          false
        }
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            tintColor={
              GOLD_DARK
            }
            refreshing={
              refreshing
            }
            onRefresh={
              handleRefresh
            }
          />
        }
      >
        {/* =================================
            INTRO
        ================================= */}

        <View
          style={
            styles.introRow
          }
        >
          <View
            style={
              styles.introIcon
            }
          >
            <Settings
              color={GOLD_DARK}
              size={20}
            />
          </View>

          <View
            style={
              styles.introTextBox
            }
          >
            <Text
              style={
                styles.introTitle
              }
            >
              {ui.pageTitle}
            </Text>

            <Text
              style={
                styles.introSubtitle
              }
            >
              {ui.pageSubtitle}
            </Text>
          </View>
        </View>

        {/* =================================
            LOADING
        ================================= */}

        {loading ? (
          <View
            style={
              styles.loadingBox
            }
          >
            <ActivityIndicator
              color={
                GOLD_DARK
              }
            />

            <Text
              style={
                styles.loadingText
              }
            >
              {ui.loading}
            </Text>
          </View>
        ) : (
          <>
            {/* =============================
                PROFILE
            ============================= */}

            <View
              style={
                styles.sectionCard
              }
            >
              <SectionHeader
                title={
                  ui.profile
                }
                subtitle={
                  ui.profileDesc
                }
              />

              {/* PROFILE PHOTO */}

              <View
                style={
                  styles.photoBlock
                }
              >
                <Pressable
                  style={
                    styles.avatarBox
                  }
                  onPress={() =>
                    void pickPhoto()
                  }
                >
                  {currentPhoto ? (
                    <Image
                      source={{
                        uri:
                          currentPhoto,
                      }}
                      style={
                        styles.avatarImage
                      }
                      resizeMode="cover"
                    />
                  ) : (
                    <UserRound
                      color={
                        GOLD_DARK
                      }
                      size={31}
                    />
                  )}

                  <View
                    style={
                      styles.cameraBadge
                    }
                  >
                    <Camera
                      color={
                        BLACK
                      }
                      size={13}
                    />
                  </View>
                </Pressable>

                <View
                  style={
                    styles.photoTextBox
                  }
                >
                  <View
                    style={
                      styles.roleBadge
                    }
                  >
                    <Text
                      style={
                        styles.roleBadgeText
                      }
                    >
                      {roleLabel}
                    </Text>
                  </View>

                  <Text
                    style={
                      styles.photoTitle
                    }
                  >
                    {
                      ui.profilePhoto
                    }
                  </Text>

                  <Text
                    style={
                      styles.photoHint
                    }
                  >
                    {ui.photoHint}
                  </Text>

                  <Pressable
                    style={
                      styles.changePhotoButton
                    }
                    onPress={() =>
                      void pickPhoto()
                    }
                    disabled={
                      saving ||
                      uploadingPhoto
                    }
                  >
                    <Camera
                      color={
                        GOLD_DARK
                      }
                      size={13}
                    />

                    <Text
                      style={
                        styles.changePhotoText
                      }
                    >
                      {
                        ui.changePhoto
                      }
                    </Text>
                  </Pressable>
                </View>
              </View>

              <View
                style={
                  styles.innerDivider
                }
              />

              {/* PROFILE FIELDS */}

              <FormInput
                label={
                  ui.fullName
                }
                value={
                  fullName
                }
                onChangeText={
                  setFullName
                }
                placeholder={
                  ui.fullName
                }
                icon={
                  <UserRound
                    color="#9A938A"
                    size={15}
                  />
                }
              />

              <FormInput
                label={
                  ui.whatsapp
                }
                value={phone}
                onChangeText={
                  setPhone
                }
                placeholder="+62..."
                keyboardType="phone-pad"
                icon={
                  <Phone
                    color="#9A938A"
                    size={15}
                  />
                }
              />

              <FormInput
                label={
                  ui.email
                }
                value={email}
                onChangeText={
                  setEmail
                }
                placeholder="name@email.com"
                keyboardType="email-address"
                autoCapitalize="none"
                icon={
                  <Mail
                    color="#9A938A"
                    size={15}
                  />
                }
              />

              {role ===
              "agent" ? (
                <FormInput
                  label={
                    ui.agency
                  }
                  value={
                    agency
                  }
                  onChangeText={
                    setAgency
                  }
                  placeholder={
                    ui.agency
                  }
                  icon={
                    <UserRound
                      color="#9A938A"
                      size={15}
                    />
                  }
                />
              ) : null}

              <FormInput
                label={
                  ui.address
                }
                value={
                  address
                }
                onChangeText={
                  setAddress
                }
                placeholder={
                  ui.address
                }
                icon={
                  <MapPin
                    color="#9A938A"
                    size={15}
                  />
                }
                last
              />
            </View>

            {/* =============================
                SOCIAL MEDIA
            ============================= */}

            <View
              style={
                styles.sectionCard
              }
            >
              <SectionHeader
                title={
                  ui.socialMedia
                }
                subtitle={
                  ui.socialDesc
                }
              />

              <FormInput
                label="Instagram"
                value={
                  instagramUrl
                }
                onChangeText={
                  setInstagramUrl
                }
                placeholder="instagram.com/username"
                autoCapitalize="none"
                icon={
                  <Link2
                    color="#9A938A"
                    size={15}
                  />
                }
              />

              <FormInput
                label="Facebook"
                value={
                  facebookUrl
                }
                onChangeText={
                  setFacebookUrl
                }
                placeholder="facebook.com/username"
                autoCapitalize="none"
                icon={
                  <Link2
                    color="#9A938A"
                    size={15}
                  />
                }
              />

              <FormInput
                label="TikTok"
                value={
                  tiktokUrl
                }
                onChangeText={
                  setTiktokUrl
                }
                placeholder="tiktok.com/@username"
                autoCapitalize="none"
                icon={
                  <Link2
                    color="#9A938A"
                    size={15}
                  />
                }
              />

              <FormInput
                label="YouTube"
                value={
                  youtubeUrl
                }
                onChangeText={
                  setYoutubeUrl
                }
                placeholder="youtube.com/@channel"
                autoCapitalize="none"
                icon={
                  <Link2
                    color="#9A938A"
                    size={15}
                  />
                }
              />

              <FormInput
                label="LinkedIn"
                value={
                  linkedinUrl
                }
                onChangeText={
                  setLinkedinUrl
                }
                placeholder="linkedin.com/in/username"
                autoCapitalize="none"
                icon={
                  <Link2
                    color="#9A938A"
                    size={15}
                  />
                }
                last
              />
            </View>

            {/* =============================
                MESSAGE
            ============================= */}

            {message ? (
              <View
                style={[
                  styles.messageBox,

                  messageType ===
                  "error"
                    ? styles.messageBoxError
                    : styles.messageBoxSuccess,
                ]}
              >
                {messageType ===
                "error" ? (
                  <XCircle
                    color="#A84444"
                    size={17}
                  />
                ) : (
                  <CheckCircle2
                    color="#278150"
                    size={17}
                  />
                )}

                <Text
                  style={[
                    styles.messageText,

                    messageType ===
                    "error"
                      ? styles.messageTextError
                      : styles.messageTextSuccess,
                  ]}
                >
                  {message}
                </Text>
              </View>
            ) : null}

            {/* =============================
                SAVE
            ============================= */}

            <Pressable
              style={[
                styles.saveButton,

                (saving ||
                  uploadingPhoto) &&
                  styles.saveButtonDisabled,
              ]}
              disabled={
                saving ||
                uploadingPhoto
              }
              onPress={() =>
                void handleSave()
              }
            >
              {saving ||
              uploadingPhoto ? (
                <ActivityIndicator
                  color={
                    BLACK
                  }
                />
              ) : (
                <Save
                  color={BLACK}
                  size={16}
                />
              )}

              <Text
                style={
                  styles.saveButtonText
                }
              >
                {saving ||
                uploadingPhoto
                  ? ui.saving
                  : ui.save}
              </Text>
            </Pressable>

            {/* =============================
                NOTIFICATIONS
            ============================= */}

            <View
              style={
                styles.sectionCard
              }
            >
              <SectionHeader
                title={
                  ui.notifications
                }
                subtitle={
                  ui.notificationsDesc
                }
              />

              <SettingsLinkRow
                icon={
                  <Bell
                    color={
                      GOLD_DARK
                    }
                    size={17}
                  />
                }
                title={
                  ui.notificationCenter
                }
                subtitle={
                  ui.notificationCenterDesc
                }
                onPress={() =>
                  router.push(
                    "/dashboard/notifications" as any
                  )
                }
              />

              <View
                style={
                  styles.rowDivider
                }
              />

              <SettingsLinkRow
                icon={
                  <BellRing
                    color={
                      GOLD_DARK
                    }
                    size={17}
                  />
                }
                title={
                  ui.notificationSettings
                }
                subtitle={
                  ui.notificationSettingsDesc
                }
                onPress={() =>
                  router.push(
                    "/settings/notifications" as any
                  )
                }
              />
            </View>

            {/* =============================
                ACCOUNT & SAFETY
            ============================= */}

            <View
              style={
                styles.sectionCard
              }
            >
              <SectionHeader
                title={
                  ui.accountSafety
                }
                subtitle={
                  ui.accountSafetyDesc
                }
              />

              <SettingsLinkRow
                icon={
                  <Lock
                    color={
                      GOLD_DARK
                    }
                    size={17}
                  />
                }
                title={
                  ui.privacyPolicy
                }
                subtitle={
                  ui.privacyPolicyDesc
                }
                onPress={() =>
                  router.push(
                    "/legal/privacy" as any
                  )
                }
              />

              <View
                style={
                  styles.rowDivider
                }
              />

              <SettingsLinkRow
                icon={
                  <FileText
                    color={
                      GOLD_DARK
                    }
                    size={17}
                  />
                }
                title={
                  ui.terms
                }
                subtitle={
                  ui.termsDesc
                }
                onPress={() =>
                  router.push(
                    "/legal/terms" as any
                  )
                }
              />

              <View
                style={
                  styles.rowDivider
                }
              />

              <SettingsLinkRow
                icon={
                  <ShieldCheck
                    color={
                      GOLD_DARK
                    }
                    size={17}
                  />
                }
                title={
                  ui.support
                }
                subtitle={
                  ui.supportDesc
                }
                onPress={() =>
                  router.push(
                    "/support" as any
                  )
                }
              />

              <View
                style={
                  styles.rowDivider
                }
              />

              <SettingsLinkRow
                icon={
                  <Trash2
                    color="#B64343"
                    size={17}
                  />
                }
                title={
                  ui.deleteAccount
                }
                subtitle={
                  ui.deleteAccountDesc
                }
                danger
                onPress={() =>
                  router.push(
                    "/settings/delete-account" as any
                  )
                }
              />
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

/*
 * =====================================================
 * SECTION HEADER
 * =====================================================
 */

function SectionHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <View
      style={
        styles.sectionHeader
      }
    >
      <Text
        style={
          styles.sectionTitle
        }
      >
        {title}
      </Text>

      <Text
        style={
          styles.sectionSubtitle
        }
      >
        {subtitle}
      </Text>
    </View>
  );
}

/*
 * =====================================================
 * FORM INPUT
 * =====================================================
 */

function FormInput({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  autoCapitalize = "sentences",
  icon,
  last = false,
}: {
  label: string;

  value: string;

  onChangeText: (
    text: string
  ) => void;

  placeholder?: string;

  keyboardType?:
    TextInputProps["keyboardType"];

  autoCapitalize?:
    TextInputProps["autoCapitalize"];

  icon?: ReactNode;

  last?: boolean;
}) {
  return (
    <View
      style={[
        styles.inputGroup,

        last &&
          styles.inputGroupLast,
      ]}
    >
      <Text
        style={
          styles.inputLabel
        }
      >
        {label}
      </Text>

      <View
        style={
          styles.inputBox
        }
      >
        {icon ? (
          <View
            style={
              styles.inputIcon
            }
          >
            {icon}
          </View>
        ) : null}

        <TextInput
          value={value}
          onChangeText={
            onChangeText
          }
          placeholder={
            placeholder
          }
          placeholderTextColor="#A39C93"
          keyboardType={
            keyboardType
          }
          autoCapitalize={
            autoCapitalize
          }
          style={
            styles.input
          }
        />
      </View>
    </View>
  );
}

/*
 * =====================================================
 * SETTINGS ROW
 * =====================================================
 */

function SettingsLinkRow({
  icon,
  title,
  subtitle,
  danger,
  onPress,
}: {
  icon: ReactNode;

  title: string;

  subtitle: string;

  danger?: boolean;

  onPress: () => void;
}) {
  return (
    <Pressable
      style={
        styles.settingsLinkRow
      }
      onPress={
        onPress
      }
    >
      <View
        style={[
          styles.settingsLinkIcon,

          danger &&
            styles.settingsLinkIconDanger,
        ]}
      >
        {icon}
      </View>

      <View
        style={
          styles.settingsLinkTextBox
        }
      >
        <Text
          style={[
            styles.settingsLinkTitle,

            danger &&
              styles.settingsLinkTitleDanger,
          ]}
        >
          {title}
        </Text>

        <Text
          style={
            styles.settingsLinkSubtitle
          }
        >
          {subtitle}
        </Text>
      </View>

      <ChevronRight
        color={
          danger
            ? "#B64343"
            : "#9A938A"
        }
        size={16}
      />
    </Pressable>
  );
}

/*
 * =====================================================
 * STYLES
 * =====================================================
 */

const styles =
  StyleSheet.create({
    safeArea: {
      flex: 1,

      backgroundColor:
        CREAM,
    },

    /*
     * HEADER
     */

    topBar: {
      minHeight: 59,

      paddingHorizontal: 14,
      paddingVertical: 8,

      flexDirection: "row",
      alignItems: "center",

      gap: 8,

      backgroundColor:
        CREAM,

      borderBottomWidth: 1,
      borderBottomColor:
        BORDER,
    },

    backButton: {
      minHeight: 38,

      paddingHorizontal: 10,

      borderRadius: 13,

      flexDirection: "row",
      alignItems: "center",

      gap: 5,

      backgroundColor:
        WHITE,

      borderWidth: 1,
      borderColor:
        BORDER,
    },

    backText: {
      color: BLACK,

      fontSize: 9,
      fontWeight: "900",
    },

    headerTitleBox: {
      flex: 1,
    },

    headerTitle: {
      color: BLACK,

      fontSize: 16,
      fontWeight: "900",
    },

    languageControl: {
      minHeight: 37,

      paddingHorizontal: 4,

      borderRadius: 13,

      flexDirection: "row",
      alignItems: "center",

      gap: 2,

      backgroundColor:
        WHITE,

      borderWidth: 1,
      borderColor:
        BORDER,
    },

    languageButton: {
      width: 31,
      height: 28,

      borderRadius: 9,

      alignItems: "center",
      justifyContent: "center",
    },

    languageButtonActive: {
      backgroundColor:
        GOLD_ACTIVE,
    },

    languageText: {
      color: "#918A81",

      fontSize: 8.3,
      fontWeight: "800",
    },

    languageTextActive: {
      color: BLACK,

      fontWeight: "900",
    },

    /*
     * SCROLL
     */

    scroll: {
      flex: 1,

      backgroundColor:
        CREAM,
    },

    content: {
      paddingHorizontal: 16,
      paddingTop: 14,

      /*
       * Footer currently remains
       * available on profile routes.
       */
      paddingBottom: 125,
    },

    /*
     * INTRO
     */

    introRow: {
      marginBottom: 13,

      paddingHorizontal: 2,

      flexDirection: "row",
      alignItems: "center",

      gap: 10,
    },

    introIcon: {
      width: 44,
      height: 44,

      borderRadius: 14,

      alignItems: "center",
      justifyContent: "center",

      backgroundColor:
        GOLD_SOFT,
    },

    introTextBox: {
      flex: 1,
    },

    introTitle: {
      color: BLACK,

      fontSize: 19,
      fontWeight: "900",

      letterSpacing: -0.3,
    },

    introSubtitle: {
      marginTop: 2,

      color: MUTED,

      fontSize: 9,
      fontWeight: "500",
    },

    /*
     * LOADING
     */

    loadingBox: {
      minHeight: 160,

      padding: 20,

      borderRadius: 21,

      alignItems: "center",
      justifyContent: "center",

      gap: 9,

      backgroundColor:
        WHITE,

      borderWidth: 1,
      borderColor:
        BORDER,
    },

    loadingText: {
      color: MUTED,

      fontSize: 9.5,
      fontWeight: "700",
    },

    /*
     * SECTIONS
     */

    sectionCard: {
      marginBottom: 12,

      padding: 14,

      borderRadius: 21,

      backgroundColor:
        WHITE,

      borderWidth: 1,
      borderColor:
        BORDER,
    },

    sectionHeader: {
      marginBottom: 13,
    },

    sectionTitle: {
      color: BLACK,

      fontSize: 14,
      fontWeight: "900",
    },

    sectionSubtitle: {
      marginTop: 3,

      color: MUTED,

      fontSize: 8.7,
      lineHeight: 13,

      fontWeight: "500",
    },

    /*
     * PHOTO
     */

    photoBlock: {
      flexDirection: "row",
      alignItems: "center",

      gap: 12,
    },

    avatarBox: {
      width: 78,
      height: 78,

      borderRadius: 22,

      overflow: "hidden",

      position: "relative",

      alignItems: "center",
      justifyContent: "center",

      backgroundColor:
        GOLD_SOFT,

      borderWidth: 1,
      borderColor:
        "#E0D1A5",
    },

    avatarImage: {
      width: "100%",
      height: "100%",
    },

    cameraBadge: {
      position: "absolute",

      right: 5,
      bottom: 5,

      width: 27,
      height: 27,

      borderRadius: 999,

      alignItems: "center",
      justifyContent: "center",

      backgroundColor:
        GOLD_ACTIVE,

      borderWidth: 2,
      borderColor:
        WHITE,
    },

    photoTextBox: {
      flex: 1,
      minWidth: 0,
    },

    roleBadge: {
      alignSelf:
        "flex-start",

      minHeight: 23,

      paddingHorizontal: 8,

      borderRadius: 999,

      alignItems: "center",
      justifyContent: "center",

      backgroundColor:
        GOLD_SOFT,
    },

    roleBadgeText: {
      color: "#705A27",

      fontSize: 7.2,
      fontWeight: "900",
    },

    photoTitle: {
      marginTop: 6,

      color: BLACK,

      fontSize: 11.5,
      fontWeight: "900",
    },

    photoHint: {
      marginTop: 2,

      color: MUTED,

      fontSize: 7.8,
      lineHeight: 11,

      fontWeight: "500",
    },

    changePhotoButton: {
      alignSelf:
        "flex-start",

      minHeight: 31,

      marginTop: 7,

      paddingHorizontal: 9,

      borderRadius: 10,

      flexDirection: "row",
      alignItems: "center",

      gap: 5,

      backgroundColor:
        "#F7F0DE",

      borderWidth: 1,
      borderColor:
        "#E3D5AE",
    },

    changePhotoText: {
      color: GOLD_DARK,

      fontSize: 8.3,
      fontWeight: "900",
    },

    innerDivider: {
      height: 1,

      marginVertical: 14,

      backgroundColor:
        "#EEE7DD",
    },

    /*
     * FORM
     */

    inputGroup: {
      marginBottom: 11,
    },

    inputGroupLast: {
      marginBottom: 0,
    },

    inputLabel: {
      marginBottom: 6,

      color: "#4E4943",

      fontSize: 9.2,
      fontWeight: "900",
    },

    inputBox: {
      minHeight: 46,

      paddingHorizontal: 10,

      borderRadius: 13,

      flexDirection: "row",
      alignItems: "center",

      gap: 4,

      backgroundColor:
        CREAM,

      borderWidth: 1,
      borderColor:
        "#DED7CD",
    },

    inputIcon: {
      width: 29,

      alignItems: "center",
      justifyContent: "center",
    },

    input: {
      flex: 1,

      paddingVertical: 0,

      color: BLACK,

      fontSize: 10.2,
      fontWeight: "600",
    },

    /*
     * SAVE MESSAGE
     */

    messageBox: {
      marginBottom: 10,

      padding: 11,

      borderRadius: 14,

      flexDirection: "row",
      alignItems: "flex-start",

      gap: 7,

      borderWidth: 1,
    },

    messageBoxSuccess: {
      backgroundColor:
        "#EFF8F1",

      borderColor:
        "#C7E2CF",
    },

    messageBoxError: {
      backgroundColor:
        "#FFF1F1",

      borderColor:
        "#EFC9C9",
    },

    messageText: {
      flex: 1,

      fontSize: 9,
      lineHeight: 13,

      fontWeight: "600",
    },

    messageTextSuccess: {
      color: "#35734B",
    },

    messageTextError: {
      color: "#993B3B",
    },

    /*
     * SAVE
     */

    saveButton: {
      minHeight: 47,

      marginBottom: 12,

      borderRadius: 14,

      paddingHorizontal: 14,

      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",

      gap: 7,

      backgroundColor:
        GOLD_ACTIVE,
    },

    saveButtonDisabled: {
      opacity: 0.6,
    },

    saveButtonText: {
      color: BLACK,

      fontSize: 10.5,
      fontWeight: "900",
    },

    /*
     * SETTINGS LINKS
     */

    settingsLinkRow: {
      minHeight: 65,

      flexDirection: "row",
      alignItems: "center",

      gap: 10,
    },

    settingsLinkIcon: {
      width: 38,
      height: 38,

      borderRadius: 12,

      alignItems: "center",
      justifyContent: "center",

      backgroundColor:
        GOLD_SOFT,
    },

    settingsLinkIconDanger: {
      backgroundColor:
        "#FBE8E8",
    },

    settingsLinkTextBox: {
      flex: 1,
    },

    settingsLinkTitle: {
      color: BLACK,

      fontSize: 10.2,
      fontWeight: "900",
    },

    settingsLinkTitleDanger: {
      color: "#A43D3D",
    },

    settingsLinkSubtitle: {
      marginTop: 2,

      color: MUTED,

      fontSize: 7.9,
      lineHeight: 11,

      fontWeight: "500",
    },

    rowDivider: {
      height: 1,

      backgroundColor:
        "#EEE7DD",
    },
  });