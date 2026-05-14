import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
    ArrowLeft,
    BellRing,
    Camera,
    CheckCircle2,
    Link2,
    Mail,
    MapPin,
    Phone,
    Save,
    UserRound,
    XCircle,
} from "lucide-react-native";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
    Pressable,
    RefreshControl,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    type TextInputProps,
    View,
} from "react-native";
import { supabase } from "../../lib/supabase";

type Language = "en" | "id";
type Role = "owner" | "agent" | "developer" | "admin" | "guest";

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

type PickedAsset = ImagePicker.ImagePickerAsset | null;

function normalizeRole(value: unknown): Role {
  const role = String(value || "").toLowerCase();

  if (role === "owner") return "owner";
  if (role === "agent") return "agent";
  if (role === "developer") return "developer";
  if (role === "admin") return "admin";

  return "guest";
}

function normalizePhotoUrl(value: unknown) {
  const url = String(value || "").trim();

  if (!url) return "";
  if (!/^https?:\/\//i.test(url)) return "";

  return encodeURI(url);
}

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function normalizeUrl(value: string) {
  return value.trim();
}

function getFileExtension(asset: ImagePicker.ImagePickerAsset) {
  const fileName = asset.fileName || "";
  const fromFile = fileName.split(".").pop()?.toLowerCase();

  if (fromFile && fromFile.length <= 5) return fromFile;

  const mimeType = asset.mimeType || "";

  if (mimeType.includes("png")) return "png";
  if (mimeType.includes("webp")) return "webp";
  if (mimeType.includes("jpeg") || mimeType.includes("jpg")) return "jpg";

  return "jpg";
}

async function uploadProfilePhoto(userId: string, asset: ImagePicker.ImagePickerAsset) {
  const fileExt = getFileExtension(asset);
  const filePath = `${userId}/avatar.${fileExt}`;
  const contentType = asset.mimeType || "image/jpeg";

  const response = await fetch(asset.uri);
  const arrayBuffer = await response.arrayBuffer();

  const { error: uploadError } = await supabase.storage
    .from("profile-photos")
    .upload(filePath, arrayBuffer, {
      upsert: true,
      contentType,
    });

  if (uploadError) {
    throw new Error(uploadError.message);
  }

  const { data } = supabase.storage.from("profile-photos").getPublicUrl(filePath);
  const publicUrl = data?.publicUrl || "";

  if (!publicUrl) {
    throw new Error("Upload succeeded but photo URL is empty.");
  }

  return publicUrl;
}

export default function DashboardSettingsScreen() {
  const router = useRouter();

  const [language, setLanguage] = useState<Language>("en");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const [userId, setUserId] = useState("");
  const [originalEmail, setOriginalEmail] = useState("");
  const [role, setRole] = useState<Role>("guest");

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [agency, setAgency] = useState("");
  const [address, setAddress] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");

  const [instagramUrl, setInstagramUrl] = useState("");
  const [facebookUrl, setFacebookUrl] = useState("");
  const [tiktokUrl, setTiktokUrl] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");

  const [selectedPhoto, setSelectedPhoto] = useState<PickedAsset>(null);

  const [leadNotifications, setLeadNotifications] = useState(true);
  const [renewalReminder, setRenewalReminder] = useState(true);
  const [paymentUpdates, setPaymentUpdates] = useState(true);

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "">("");

  const isId = language === "id";

  const ui = useMemo(() => {
    if (isId) {
      return {
        back: "Kembali",
        pageTitle: "Pengaturan",
        pageSubtitle: "Kelola profil dan preferensi akun Tetamo Anda.",
        profilePhoto: "Foto Profil",
        changePhoto: "Ubah Foto",
        photoHint: "JPG, PNG, WEBP. Maksimal 5MB.",
        profileInfo: role === "agent" ? "Profil Agent" : "Profil Pemilik",
        fullName: "Nama Lengkap",
        whatsapp: "Nomor WhatsApp",
        email: "Email",
        agency: "Nama Agency",
        address: "Alamat",
        socialMedia: "Social Media",
        socialDesc:
          "Tambahkan link social media Anda agar tampil di profil dan dashboard.",
        notifications: "Notifikasi",
        notificationsDesc: "Atur pemberitahuan yang ingin Anda terima.",
        newLead: "Notifikasi Leads Baru",
        newLeadDesc: "Dapatkan pemberitahuan saat ada calon buyer/renter baru.",
        renewal: role === "agent" ? "Pengingat Jadwal Viewing" : "Pengingat Perpanjangan Iklan",
        renewalDesc:
          role === "agent"
            ? "Dapatkan pengingat untuk jadwal kunjungan properti."
            : "Dapatkan pengingat saat iklan mendekati masa kadaluarsa.",
        payment: role === "agent" ? "Update Sistem" : "Update Pembayaran",
        paymentDesc:
          role === "agent"
            ? "Dapatkan pemberitahuan pembaruan fitur dan status platform."
            : "Dapatkan pemberitahuan status pembayaran dan tagihan.",
        save: "Simpan Perubahan",
        saving: "Menyimpan...",
        loading: "Memuat pengaturan...",
        fullNameRequired: "Nama lengkap wajib diisi.",
        emailRequired: "Email wajib diisi.",
        imagePermission:
          "Izin akses foto dibutuhkan untuk mengganti foto profil.",
        imageTooLarge: "Ukuran foto maksimal 5MB.",
        saved: "Profil berhasil disimpan.",
        savedEmailChanged:
          "Profil berhasil disimpan. Cek email Anda untuk konfirmasi perubahan email.",
        failed: "Gagal menyimpan profil.",
        noUser: "User tidak ditemukan. Silakan login ulang.",
      };
    }

    return {
      back: "Back",
      pageTitle: "Settings",
      pageSubtitle: "Manage your Tetamo profile and account preferences.",
      profilePhoto: "Profile Photo",
      changePhoto: "Change Photo",
      photoHint: "JPG, PNG, WEBP. Maximum 5MB.",
      profileInfo: role === "agent" ? "Agent Profile" : "Owner Profile",
      fullName: "Full Name",
      whatsapp: "WhatsApp Number",
      email: "Email",
      agency: "Agency Name",
      address: "Address",
      socialMedia: "Social Media",
      socialDesc:
        "Add your social media links so they can appear in your profile and dashboard.",
      notifications: "Notifications",
      notificationsDesc: "Choose the notifications you want to receive.",
      newLead: "New Lead Notifications",
      newLeadDesc: "Get notified when there is a new buyer/renter inquiry.",
      renewal: role === "agent" ? "Viewing Schedule Reminder" : "Ad Renewal Reminder",
      renewalDesc:
        role === "agent"
          ? "Get reminders for property viewing appointments."
          : "Get reminders when your ad is close to expiring.",
      payment: role === "agent" ? "System Updates" : "Payment Updates",
      paymentDesc:
        role === "agent"
          ? "Get updates about feature and platform status."
          : "Get notified about payment and invoice status.",
      save: "Save Changes",
      saving: "Saving...",
      loading: "Loading settings...",
      fullNameRequired: "Full name is required.",
      emailRequired: "Email is required.",
      imagePermission:
        "Photo permission is required to change your profile photo.",
      imageTooLarge: "Maximum photo size is 5MB.",
      saved: "Profile saved successfully.",
      savedEmailChanged:
        "Profile saved successfully. Please check your email to confirm the email change.",
      failed: "Failed to save profile.",
      noUser: "User not found. Please log in again.",
    };
  }, [isId, role]);

  const currentPhoto = selectedPhoto?.uri || normalizePhotoUrl(photoUrl);

  const loadSettings = useCallback(async () => {
    setMessage("");
    setMessageType("");

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setUserId("");
      setLoading(false);
      setRefreshing(false);
      router.replace("/login" as any);
      return;
    }

    setUserId(user.id);

    const { data, error } = await supabase
      .from("profiles")
      .select(
        "id, full_name, email, phone, role, agency, address, photo_url, instagram_url, facebook_url, tiktok_url, youtube_url, linkedin_url"
      )
      .eq("id", user.id)
      .maybeSingle();

    if (error) {
      setMessageType("error");
      setMessage(error.message);
      setLoading(false);
      setRefreshing(false);
      return;
    }

    const profile = (data || null) as ProfileRow | null;

    const nextEmail = profile?.email || user.email || "";

    setRole(normalizeRole(profile?.role || user.user_metadata?.role));
    setFullName(
      profile?.full_name ||
        String(user.user_metadata?.full_name || "") ||
        String(user.user_metadata?.name || "")
    );
    setPhone(profile?.phone || "");
    setEmail(nextEmail);
    setOriginalEmail(normalizeEmail(nextEmail));
    setAgency(profile?.agency || "");
    setAddress(profile?.address || "");
    setPhotoUrl(profile?.photo_url || "");

    setInstagramUrl(profile?.instagram_url || "");
    setFacebookUrl(profile?.facebook_url || "");
    setTiktokUrl(profile?.tiktok_url || "");
    setYoutubeUrl(profile?.youtube_url || "");
    setLinkedinUrl(profile?.linkedin_url || "");

    setSelectedPhoto(null);
    setLoading(false);
    setRefreshing(false);
  }, [router]);

  useEffect(() => {
    void loadSettings();
  }, [loadSettings]);

  async function handleRefresh() {
    setRefreshing(true);
    await loadSettings();
  }

  async function pickPhoto() {
    setMessage("");
    setMessageType("");

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permission.status !== "granted") {
      Alert.alert(ui.imagePermission);
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });

    if (result.canceled) return;

    const asset = result.assets?.[0];

    if (!asset) return;

    if (asset.fileSize && asset.fileSize > 5 * 1024 * 1024) {
      Alert.alert(ui.imageTooLarge);
      return;
    }

    setSelectedPhoto(asset);
  }

  async function handleSave() {
    if (!userId) {
      Alert.alert(ui.noUser);
      return;
    }

    const trimmedName = fullName.trim();
    const trimmedPhone = phone.trim();
    const normalizedEmail = normalizeEmail(email);
    const trimmedAgency = agency.trim();
    const trimmedAddress = address.trim();

    const trimmedInstagram = normalizeUrl(instagramUrl);
    const trimmedFacebook = normalizeUrl(facebookUrl);
    const trimmedTiktok = normalizeUrl(tiktokUrl);
    const trimmedYoutube = normalizeUrl(youtubeUrl);
    const trimmedLinkedin = normalizeUrl(linkedinUrl);

    if (!trimmedName) {
      Alert.alert(ui.fullNameRequired);
      return;
    }

    if (!normalizedEmail) {
      Alert.alert(ui.emailRequired);
      return;
    }

    setSaving(true);
    setMessage("");
    setMessageType("");

    try {
      let finalPhotoUrl = photoUrl;

      if (selectedPhoto) {
        setUploadingPhoto(true);
        finalPhotoUrl = await uploadProfilePhoto(userId, selectedPhoto);
        setUploadingPhoto(false);
      }

      const emailChanged =
        normalizedEmail.length > 0 && normalizedEmail !== originalEmail;

      if (emailChanged) {
        const { error: authEmailError } = await supabase.auth.updateUser({
          email: normalizedEmail,
        });

        if (authEmailError) {
          setSaving(false);
          setUploadingPhoto(false);
          setMessageType("error");
          setMessage(authEmailError.message);
          return;
        }
      }

      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          full_name: trimmedName,
          phone: trimmedPhone,
          email: normalizedEmail,
          agency: trimmedAgency,
          address: trimmedAddress,
          photo_url: finalPhotoUrl,
          instagram_url: trimmedInstagram,
          facebook_url: trimmedFacebook,
          tiktok_url: trimmedTiktok,
          youtube_url: trimmedYoutube,
          linkedin_url: trimmedLinkedin,
        })
        .eq("id", userId);

      if (profileError) {
        setSaving(false);
        setUploadingPhoto(false);
        setMessageType("error");
        setMessage(profileError.message);
        return;
      }

      setFullName(trimmedName);
      setPhone(trimmedPhone);
      setEmail(normalizedEmail);
      setOriginalEmail(normalizedEmail);
      setAgency(trimmedAgency);
      setAddress(trimmedAddress);
      setPhotoUrl(finalPhotoUrl);
      setInstagramUrl(trimmedInstagram);
      setFacebookUrl(trimmedFacebook);
      setTiktokUrl(trimmedTiktok);
      setYoutubeUrl(trimmedYoutube);
      setLinkedinUrl(trimmedLinkedin);
      setSelectedPhoto(null);

      setSaving(false);
      setUploadingPhoto(false);
      setMessageType("success");
      setMessage(emailChanged ? ui.savedEmailChanged : ui.saved);
    } catch (error: any) {
      setSaving(false);
      setUploadingPhoto(false);
      setMessageType("error");
      setMessage(error?.message || ui.failed);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />

      <View style={styles.topBar}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft color="#ffffff" size={15} />
          <Text style={styles.backText}>{ui.back}</Text>
        </Pressable>

        <View style={styles.langToggle}>
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

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            tintColor="#e6c15c"
            refreshing={refreshing}
            onRefresh={handleRefresh}
          />
        }
      >
        <View style={styles.heroCard}>
          <View style={styles.heroIcon}>
            <UserRound color="#111111" size={24} />
          </View>

          <Text style={styles.heroTitle}>{ui.pageTitle}</Text>
          <Text style={styles.heroSubtitle}>{ui.pageSubtitle}</Text>
        </View>

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator color="#e6c15c" />
            <Text style={styles.loadingText}>{ui.loading}</Text>
          </View>
        ) : (
          <>
            <View style={styles.photoCard}>
              <Text style={styles.cardTitle}>{ui.profilePhoto}</Text>

              <View style={styles.photoRow}>
                <Pressable style={styles.avatarBox} onPress={pickPhoto}>
                  {currentPhoto ? (
                    <Image
                      source={{ uri: currentPhoto }}
                      style={styles.avatarImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <UserRound color="#e6c15c" size={34} />
                  )}

                  <View style={styles.cameraBadge}>
                    <Camera color="#111111" size={14} />
                  </View>
                </Pressable>

                <View style={styles.photoTextBox}>
                  <Pressable
                    style={styles.changePhotoButton}
                    onPress={pickPhoto}
                    disabled={saving || uploadingPhoto}
                  >
                    <Camera color="#111111" size={14} />
                    <Text style={styles.changePhotoText}>{ui.changePhoto}</Text>
                  </Pressable>

                  <Text style={styles.photoHint}>{ui.photoHint}</Text>
                </View>
              </View>
            </View>

            <View style={styles.formCard}>
              <Text style={styles.cardTitle}>{ui.profileInfo}</Text>

              <FormInput
                label={ui.fullName}
                value={fullName}
                onChangeText={setFullName}
                placeholder={ui.fullName}
              />

              <FormInput
                label={ui.whatsapp}
                value={phone}
                onChangeText={setPhone}
                placeholder="+62..."
                keyboardType="phone-pad"
                icon={<Phone color="#a9a9a9" size={15} />}
              />

              <FormInput
                label={ui.email}
                value={email}
                onChangeText={setEmail}
                placeholder="name@email.com"
                keyboardType="email-address"
                autoCapitalize="none"
                icon={<Mail color="#a9a9a9" size={15} />}
              />

              <FormInput
                label={ui.agency}
                value={agency}
                onChangeText={setAgency}
                placeholder={ui.agency}
              />

              <FormInput
                label={ui.address}
                value={address}
                onChangeText={setAddress}
                placeholder={ui.address}
                icon={<MapPin color="#a9a9a9" size={15} />}
              />
            </View>

            <View style={styles.formCard}>
              <Text style={styles.cardTitle}>{ui.socialMedia}</Text>
              <Text style={styles.cardDesc}>{ui.socialDesc}</Text>

              <FormInput
                label="Instagram"
                value={instagramUrl}
                onChangeText={setInstagramUrl}
                placeholder="https://instagram.com/username"
                autoCapitalize="none"
                icon={<Link2 color="#a9a9a9" size={15} />}
              />

              <FormInput
                label="Facebook"
                value={facebookUrl}
                onChangeText={setFacebookUrl}
                placeholder="https://facebook.com/username"
                autoCapitalize="none"
                icon={<Link2 color="#a9a9a9" size={15} />}
              />

              <FormInput
                label="TikTok"
                value={tiktokUrl}
                onChangeText={setTiktokUrl}
                placeholder="https://tiktok.com/@username"
                autoCapitalize="none"
                icon={<Link2 color="#a9a9a9" size={15} />}
              />

              <FormInput
                label="YouTube"
                value={youtubeUrl}
                onChangeText={setYoutubeUrl}
                placeholder="https://youtube.com/@channel"
                autoCapitalize="none"
                icon={<Link2 color="#a9a9a9" size={15} />}
              />

              <FormInput
                label="LinkedIn"
                value={linkedinUrl}
                onChangeText={setLinkedinUrl}
                placeholder="https://linkedin.com/in/username"
                autoCapitalize="none"
                icon={<Link2 color="#a9a9a9" size={15} />}
              />
            </View>

            <View style={styles.formCard}>
              <Text style={styles.cardTitle}>{ui.notifications}</Text>
              <Text style={styles.cardDesc}>{ui.notificationsDesc}</Text>

              <ToggleRow
                title={ui.newLead}
                subtitle={ui.newLeadDesc}
                value={leadNotifications}
                onValueChange={setLeadNotifications}
              />

              <ToggleRow
                title={ui.renewal}
                subtitle={ui.renewalDesc}
                value={renewalReminder}
                onValueChange={setRenewalReminder}
              />

              <ToggleRow
                title={ui.payment}
                subtitle={ui.paymentDesc}
                value={paymentUpdates}
                onValueChange={setPaymentUpdates}
              />
            </View>

            {message ? (
              <View
                style={[
                  styles.messageBox,
                  messageType === "error"
                    ? styles.messageBoxError
                    : styles.messageBoxSuccess,
                ]}
              >
                {messageType === "error" ? (
                  <XCircle color="#fecaca" size={17} />
                ) : (
                  <CheckCircle2 color="#22c55e" size={17} />
                )}

                <Text
                  style={[
                    styles.messageText,
                    messageType === "error"
                      ? styles.messageTextError
                      : styles.messageTextSuccess,
                  ]}
                >
                  {message}
                </Text>
              </View>
            ) : null}

            <Pressable
              style={[
                styles.saveButton,
                (saving || uploadingPhoto) && styles.saveButtonDisabled,
              ]}
              disabled={saving || uploadingPhoto}
              onPress={() => void handleSave()}
            >
              {saving || uploadingPhoto ? (
                <ActivityIndicator color="#111111" />
              ) : (
                <Save color="#111111" size={16} />
              )}

              <Text style={styles.saveButtonText}>
                {saving || uploadingPhoto ? ui.saving : ui.save}
              </Text>
            </Pressable>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function FormInput({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  autoCapitalize = "sentences",
  icon,
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  keyboardType?: TextInputProps["keyboardType"];
  autoCapitalize?: TextInputProps["autoCapitalize"];
  icon?: React.ReactNode;
}) {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>{label}</Text>

      <View style={styles.inputBox}>
        {icon}

        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#777777"
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          style={styles.input}
        />
      </View>
    </View>
  );
}

function ToggleRow({
  title,
  subtitle,
  value,
  onValueChange,
}: {
  title: string;
  subtitle: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}) {
  return (
    <View style={styles.toggleRow}>
      <View style={styles.toggleIcon}>
        <BellRing color="#e6c15c" size={16} />
      </View>

      <View style={styles.toggleTextBox}>
        <Text style={styles.toggleTitle}>{title}</Text>
        <Text style={styles.toggleSubtitle}>{subtitle}</Text>
      </View>

      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: "#333333", true: "#705d2c" }}
        thumbColor={value ? "#e6c15c" : "#a9a9a9"}
      />
    </View>
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
    paddingHorizontal: 11,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  backText: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "900",
  },
  langToggle: {
    flexDirection: "row",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#5b4a24",
    overflow: "hidden",
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
    fontSize: 9.5,
    fontWeight: "900",
  },
  langTextActive: {
    color: "#111111",
  },
  scroll: {
    flex: 1,
    backgroundColor: "#050505",
  },
  content: {
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 38,
  },
  heroCard: {
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "#303030",
    backgroundColor: "#101010",
    padding: 18,
    marginBottom: 13,
  },
  heroIcon: {
    width: 52,
    height: 52,
    borderRadius: 19,
    backgroundColor: "#e6c15c",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  heroTitle: {
    color: "#ffffff",
    fontSize: 25,
    lineHeight: 30,
    fontWeight: "900",
    letterSpacing: -0.5,
  },
  heroSubtitle: {
    color: "#b8b8b8",
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "700",
    marginTop: 7,
  },
  loadingBox: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#303030",
    backgroundColor: "#101010",
    padding: 18,
    alignItems: "center",
    gap: 10,
  },
  loadingText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "800",
  },
  photoCard: {
    borderRadius: 26,
    borderWidth: 1,
    borderColor: "#303030",
    backgroundColor: "#101010",
    padding: 15,
    marginBottom: 13,
  },
  cardTitle: {
    color: "#ffffff",
    fontSize: 15.5,
    fontWeight: "900",
    marginBottom: 10,
  },
  cardDesc: {
    color: "#a9a9a9",
    fontSize: 11.5,
    lineHeight: 17,
    fontWeight: "700",
    marginTop: -4,
    marginBottom: 12,
  },
  photoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
  },
  avatarBox: {
    width: 82,
    height: 82,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: "#705d2c",
    backgroundColor: "#211a0b",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
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
    backgroundColor: "#e6c15c",
    alignItems: "center",
    justifyContent: "center",
  },
  photoTextBox: {
    flex: 1,
  },
  changePhotoButton: {
    alignSelf: "flex-start",
    minHeight: 38,
    borderRadius: 14,
    backgroundColor: "#e6c15c",
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  changePhotoText: {
    color: "#111111",
    fontSize: 11.5,
    fontWeight: "900",
  },
  photoHint: {
    color: "#a9a9a9",
    fontSize: 10.8,
    lineHeight: 16,
    fontWeight: "700",
    marginTop: 8,
  },
  formCard: {
    borderRadius: 26,
    borderWidth: 1,
    borderColor: "#303030",
    backgroundColor: "#101010",
    padding: 15,
    marginBottom: 13,
  },
  inputGroup: {
    marginBottom: 12,
  },
  inputLabel: {
    color: "#ffffff",
    fontSize: 11.5,
    fontWeight: "900",
    marginBottom: 7,
  },
  inputBox: {
    minHeight: 49,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: "#303030",
    backgroundColor: "#050505",
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  input: {
    flex: 1,
    color: "#ffffff",
    fontSize: 12.5,
    fontWeight: "800",
    paddingVertical: 0,
  },
  toggleRow: {
    minHeight: 74,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#252525",
    backgroundColor: "#050505",
    padding: 11,
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  toggleIcon: {
    width: 38,
    height: 38,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#5b4a24",
    backgroundColor: "#211a0b",
    alignItems: "center",
    justifyContent: "center",
  },
  toggleTextBox: {
    flex: 1,
  },
  toggleTitle: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "900",
  },
  toggleSubtitle: {
    color: "#a9a9a9",
    fontSize: 10.5,
    lineHeight: 15,
    fontWeight: "700",
    marginTop: 3,
  },
  messageBox: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 12,
    marginBottom: 13,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  messageBoxSuccess: {
    borderColor: "#166534",
    backgroundColor: "#052e16",
  },
  messageBoxError: {
    borderColor: "#7f1d1d",
    backgroundColor: "#2a0d0d",
  },
  messageText: {
    flex: 1,
    fontSize: 11.8,
    lineHeight: 17,
    fontWeight: "800",
  },
  messageTextSuccess: {
    color: "#bbf7d0",
  },
  messageTextError: {
    color: "#fecaca",
  },
  saveButton: {
    minHeight: 50,
    borderRadius: 17,
    backgroundColor: "#e6c15c",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 14,
  },
  saveButtonDisabled: {
    opacity: 0.65,
  },
  saveButtonText: {
    color: "#111111",
    fontSize: 13,
    fontWeight: "900",
  },
});