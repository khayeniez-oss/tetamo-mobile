import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
  Bookmark,
  Building2,
  CheckCircle2,
  ChevronRight,
  Heart,
  Mail,
  MapPin,
  Phone,
  Send,
  UserRound
} from "lucide-react-native";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  type TextInputProps,
  View,
} from "react-native";
import { supabase } from "../../lib/supabase";

type Language = "en" | "id";
type SearchType = "" | "sale" | "rent" | "auction";
type NeedAgent = "yes" | "no";

type BuyerForm = {
  name: string;
  countryCode: string;
  phone: string;
  email: string;
  searchType: SearchType;
  location: string;
  budget: string;
  propertyType: string;
  bedroom: string;
  bathroom: string;
  furnished: string;
  certificate: string;
  timeline: string;
  needAgent: NeedAgent;
  notes: string;
};

type Option = {
  value: string;
  label: string;
};

const INITIAL_FORM: BuyerForm = {
  name: "",
  countryCode: "+62",
  phone: "",
  email: "",
  searchType: "",
  location: "",
  budget: "",
  propertyType: "",
  bedroom: "",
  bathroom: "",
  furnished: "",
  certificate: "",
  timeline: "",
  needAgent: "yes",
  notes: "",
};

const COUNTRY_CODE_OPTIONS: Option[] = [
  { value: "+62", label: "Indonesia +62" },
  { value: "+61", label: "Australia +61" },
  { value: "+60", label: "Malaysia +60" },
  { value: "+65", label: "Singapore +65" },
  { value: "+63", label: "Philippines +63" },
  { value: "+1", label: "US / Canada +1" },
  { value: "+44", label: "United Kingdom +44" },
  { value: "+81", label: "Japan +81" },
  { value: "+82", label: "South Korea +82" },
  { value: "+86", label: "China +86" },
  { value: "+971", label: "UAE +971" },
  { value: "+66", label: "Thailand +66" },
];

export default function BuyerScreen() {
  const router = useRouter();

  const [language, setLanguage] = useState<Language>("en");
  const [form, setForm] = useState<BuyerForm>(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const isId = language === "id";

  const ui = useMemo(() => {
    if (isId) {
      return {
        badge: "Pembeli / Penyewa",
        title: "Bantu Saya Menemukan Properti",
        subtitle:
          "Beritahu TETAMO properti seperti apa yang Anda cari untuk dibeli atau disewa. Kami akan membantu mencocokkan Anda dengan properti yang sesuai.",
        saved: "Properti Tersimpan",
        liked: "Properti Disukai",
        marketplace: "Cari di Marketplace",
        savedDesc: "Lihat properti yang sudah Anda simpan.",
        likedDesc: "Lihat properti yang Anda sukai.",
        marketplaceDesc: "Jelajahi listing aktif di Tetamo.",
        buyerInfo: "Informasi Pembeli / Penyewa",
        buyerInfoDesc: "Isi data kontak agar TETAMO dapat menghubungi Anda.",
        propertyPref: "Properti yang Dicari",
        propertyPrefDesc: "Beri tahu preferensi properti Anda.",
        tetamoHelp: "Bantuan dari TETAMO",
        tetamoHelpDesc:
          "Pilih apakah Anda ingin dibantu oleh agent yang direkomendasikan.",
        fullName: "Nama Lengkap",
        phone: "Nomor Telepon",
        email: "Email",
        countryCode: "Kode Negara",
        lookingFor: "Mencari Untuk",
        location: "Lokasi",
        budget: "Budget / Harga",
        propertyType: "Tipe Properti",
        bedroom: "Kamar Tidur",
        bathroom: "Kamar Mandi",
        furnished: "Furnished",
        certificate: "Status Sertifikat",
        timeline: "Timeline",
        needAgent: "Apakah Anda ingin TETAMO merekomendasikan agent?",
        notes: "Catatan Tambahan",
        submit: "Submit Permintaan",
        submitting: "Mengirim...",
        submitAnother: "Kirim Permintaan Lain",
        successTitle: "Permintaan Anda berhasil dikirim",
        successDesc:
          "Tim TETAMO telah menerima permintaan Anda. Admin akan meninjau kebutuhan Anda sebagai pembeli atau penyewa dan membantu mencocokkan properti yang sesuai.",
        safeData: "Data Anda aman dan tidak dibagikan tanpa izin.",
        freeBuyer: "Gratis tanpa biaya untuk pembeli atau penyewa.",
        verifiedAgent: "Agent yang direkomendasikan telah diverifikasi TETAMO.",
        required: "Mohon lengkapi semua field wajib.",
        failed: "Gagal mengirim permintaan.",
        yes: "Ya",
        no: "Tidak",
        sale: "Dijual",
        rent: "Disewa",
        auction: "Lelang",
        house: "Rumah",
        apartment: "Apartemen",
        villa: "Villa",
        land: "Tanah",
        shopHouse: "Ruko",
        commercial: "Komersial",
        select: "Pilih",
        goMarketplace: "Ke Marketplace",
      };
    }

    return {
      badge: "Buyers / Renters",
      title: "Help Me Find the Right Property",
      subtitle:
        "Tell TETAMO what kind of property you are looking for to buy or rent. We will help match you with suitable properties.",
      saved: "Saved Properties",
      liked: "Liked Properties",
      marketplace: "Search Marketplace",
      savedDesc: "View properties you have saved.",
      likedDesc: "View properties you have liked.",
      marketplaceDesc: "Browse active listings on Tetamo.",
      buyerInfo: "Buyer / Renter Information",
      buyerInfoDesc: "Fill in your contact details so TETAMO can reach you.",
      propertyPref: "Property Preferences",
      propertyPrefDesc: "Tell us your property preferences.",
      tetamoHelp: "Help from TETAMO",
      tetamoHelpDesc: "Choose whether you want TETAMO to recommend an agent.",
      fullName: "Full Name",
      phone: "Phone Number",
      email: "Email",
      countryCode: "Country Code",
      lookingFor: "Looking For",
      location: "Location",
      budget: "Budget / Price",
      propertyType: "Property Type",
      bedroom: "Bedrooms",
      bathroom: "Bathrooms",
      furnished: "Furnished",
      certificate: "Certificate Status",
      timeline: "Timeline",
      needAgent: "Would you like TETAMO to recommend an agent?",
      notes: "Additional Notes",
      submit: "Submit Request",
      submitting: "Submitting...",
      submitAnother: "Submit Another Request",
      successTitle: "Your request has been submitted",
      successDesc:
        "The TETAMO team has received your request. Admin will review your needs as a buyer or renter and help match suitable properties.",
      safeData: "Your data is secure and never shared without consent.",
      freeBuyer: "Completely free for buyers or renters.",
      verifiedAgent: "Recommended agents are verified by TETAMO.",
      required: "Please complete all required fields.",
      failed: "Failed to submit request.",
      yes: "Yes",
      no: "No",
      sale: "For Sale",
      rent: "For Rent",
      auction: "Auction",
      house: "House",
      apartment: "Apartment",
      villa: "Villa",
      land: "Land",
      shopHouse: "Shop House",
      commercial: "Commercial",
      select: "Select",
      goMarketplace: "Go to Marketplace",
    };
  }, [isId]);

  const searchTypeOptions: Option[] = [
    { value: "sale", label: ui.sale },
    { value: "rent", label: ui.rent },
    { value: "auction", label: ui.auction },
  ];

  const propertyTypeOptions: Option[] = [
    { value: "Rumah", label: ui.house },
    { value: "Apartemen", label: ui.apartment },
    { value: "Villa", label: ui.villa },
    { value: "Tanah", label: ui.land },
    { value: "Ruko", label: ui.shopHouse },
    { value: "Komersial", label: ui.commercial },
  ];

  const bedroomOptions: Option[] = [
    { value: "1 Kamar", label: "1" },
    { value: "2 Kamar", label: "2" },
    { value: "3 Kamar", label: "3" },
    { value: "4 Kamar", label: "4" },
    { value: "5+ Kamar", label: "5+" },
  ];

  const bathroomOptions: Option[] = [
    { value: "1 Kamar Mandi", label: "1" },
    { value: "2 Kamar Mandi", label: "2" },
    { value: "3 Kamar Mandi", label: "3" },
    { value: "4+ Kamar Mandi", label: "4+" },
  ];

  const furnishedOptions: Option[] = [
    {
      value: "Full Furnish",
      label: isId ? "Full Furnish" : "Fully Furnished",
    },
    {
      value: "Semi Furnish",
      label: isId ? "Semi Furnish" : "Semi Furnished",
    },
    { value: "Unfurnished", label: "Unfurnished" },
  ];

  const certificateOptions: Option[] = [
    {
      value: "SHM",
      label: isId ? "SHM (Sertifikat Hak Milik)" : "Freehold (SHM)",
    },
    {
      value: "HGB",
      label: isId ? "HGB (Hak Guna Bangunan)" : "Right to Build (HGB)",
    },
    { value: "PPJB", label: "PPJB" },
    { value: "Other", label: isId ? "Lainnya" : "Other" },
  ];

  const timelineOptions: Option[] = [
    {
      value: "Secepatnya",
      label: isId ? "Secepatnya" : "As Soon As Possible",
    },
    {
      value: "Dalam 1 Bulan",
      label: isId ? "Dalam 1 Bulan" : "Within 1 Month",
    },
    {
      value: "Dalam 3 Bulan",
      label: isId ? "Dalam 3 Bulan" : "Within 3 Months",
    },
    {
      value: "Masih Survey",
      label: isId ? "Masih Survey" : "Just Browsing",
    },
  ];

  function updateField<K extends keyof BuyerForm>(key: K, value: BuyerForm[K]) {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  }

  function validateForm() {
    return Boolean(
      form.name.trim() &&
        form.phone.trim() &&
        form.email.trim() &&
        form.searchType &&
        form.location.trim() &&
        form.budget.trim() &&
        form.propertyType.trim()
    );
  }

  async function handleSubmit() {
    if (!validateForm()) {
      Alert.alert(ui.required);
      return;
    }

    setSubmitting(true);
    setErrorMessage("");

    try {
      const fullPhone = `${form.countryCode} ${form.phone.trim()}`.trim();

      const payload = {
        name: form.name.trim(),
        phone: fullPhone,
        email: form.email.trim() || null,
        search_type: form.searchType,
        location: form.location.trim(),
        budget: form.budget.trim(),
        property_type: form.propertyType.trim(),
        bedroom: form.bedroom.trim() || null,
        bathroom: form.bathroom.trim() || null,
        furnished: form.furnished.trim() || null,
        certificate: form.certificate.trim() || null,
        timeline: form.timeline.trim() || null,
        need_agent: form.needAgent,
        notes: form.notes.trim() || null,
        status: "NEW",
      };

      const { error } = await supabase.from("buyer_requests").insert(payload);

      if (error) {
        setErrorMessage(error.message || ui.failed);
        setSubmitting(false);
        return;
      }

      setSubmitted(true);
      setForm(INITIAL_FORM);
    } catch (error: any) {
      setErrorMessage(error?.message || ui.failed);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.topBar}>
          <View>
            <Text style={styles.topTitle}>Buyer</Text>
            <Text style={styles.topSub}>
              {isId ? "Cari properti impian Anda" : "Find your ideal property"}
            </Text>
          </View>

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
        >
          <View style={styles.heroCard}>
            <View style={styles.badge}>
              <UserRound color="#e6c15c" size={13} />
              <Text style={styles.badgeText}>{ui.badge}</Text>
            </View>

            <Text style={styles.heroTitle}>{ui.title}</Text>
            <Text style={styles.heroSubtitle}>{ui.subtitle}</Text>
          </View>

          <View style={styles.shortcutGrid}>
            <ShortcutCard
              icon={<Bookmark color="#e6c15c" size={20} />}
              title={ui.saved}
              subtitle={ui.savedDesc}
              onPress={() => router.push("/dashboard/saved" as any)}
            />

            <ShortcutCard
              icon={<Heart color="#e6c15c" size={20} />}
              title={ui.liked}
              subtitle={ui.likedDesc}
              onPress={() => router.push("/dashboard/liked" as any)}
            />

            <ShortcutCard
              icon={<Building2 color="#e6c15c" size={20} />}
              title={ui.marketplace}
              subtitle={ui.marketplaceDesc}
              onPress={() => router.push("/property" as any)}
              full
            />
          </View>

          {submitted ? (
            <View style={styles.successCard}>
              <View style={styles.successIcon}>
                <CheckCircle2 color="#22c55e" size={30} />
              </View>

              <Text style={styles.successTitle}>{ui.successTitle}</Text>
              <Text style={styles.successDesc}>{ui.successDesc}</Text>

              <Pressable
                style={styles.submitButton}
                onPress={() => setSubmitted(false)}
              >
                <Send color="#111111" size={16} />
                <Text style={styles.submitButtonText}>
                  {ui.submitAnother}
                </Text>
              </Pressable>
            </View>
          ) : (
            <>
              <SectionCard title={ui.buyerInfo} subtitle={ui.buyerInfoDesc}>
                <FormInput
                  label={`${ui.fullName} *`}
                  value={form.name}
                  onChangeText={(value) => updateField("name", value)}
                  placeholder={ui.fullName}
                  icon={<UserRound color="#a9a9a9" size={15} />}
                />

                <Text style={styles.inputLabel}>{ui.countryCode}</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.pillRow}
                >
                  {COUNTRY_CODE_OPTIONS.map((item) => (
                    <Pill
                      key={item.value}
                      label={item.label}
                      active={form.countryCode === item.value}
                      onPress={() => updateField("countryCode", item.value)}
                    />
                  ))}
                </ScrollView>

                <FormInput
                  label={`${ui.phone} *`}
                  value={form.phone}
                  onChangeText={(value) => updateField("phone", value)}
                  placeholder="8123456789"
                  keyboardType="phone-pad"
                  icon={<Phone color="#a9a9a9" size={15} />}
                />

                <FormInput
                  label={`${ui.email} *`}
                  value={form.email}
                  onChangeText={(value) => updateField("email", value)}
                  placeholder="name@email.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  icon={<Mail color="#a9a9a9" size={15} />}
                />
              </SectionCard>

              <SectionCard title={ui.propertyPref} subtitle={ui.propertyPrefDesc}>
                <SelectSection title={`${ui.lookingFor} *`}>
                  {searchTypeOptions.map((item) => (
                    <Pill
                      key={item.value}
                      label={item.label}
                      active={form.searchType === item.value}
                      onPress={() =>
                        updateField("searchType", item.value as SearchType)
                      }
                    />
                  ))}
                </SelectSection>

                <FormInput
                  label={`${ui.location} *`}
                  value={form.location}
                  onChangeText={(value) => updateField("location", value)}
                  placeholder={
                    isId
                      ? "Contoh: Jakarta Barat, Bali, Bandung"
                      : "Example: West Jakarta, Bali, Bandung"
                  }
                  icon={<MapPin color="#a9a9a9" size={15} />}
                />

                <FormInput
                  label={`${ui.budget} *`}
                  value={form.budget}
                  onChangeText={(value) => updateField("budget", value)}
                  placeholder={
                    isId
                      ? "Contoh: Rp 2 Miliar / Rp 100 Juta per tahun"
                      : "Example: Rp 2 Billion / Rp 100 Million per year"
                  }
                />

                <SelectSection title={`${ui.propertyType} *`}>
                  {propertyTypeOptions.map((item) => (
                    <Pill
                      key={item.value}
                      label={item.label}
                      active={form.propertyType === item.value}
                      onPress={() => updateField("propertyType", item.value)}
                    />
                  ))}
                </SelectSection>

                <SelectSection title={ui.bedroom}>
                  {bedroomOptions.map((item) => (
                    <Pill
                      key={item.value}
                      label={item.label}
                      active={form.bedroom === item.value}
                      onPress={() => updateField("bedroom", item.value)}
                    />
                  ))}
                </SelectSection>

                <SelectSection title={ui.bathroom}>
                  {bathroomOptions.map((item) => (
                    <Pill
                      key={item.value}
                      label={item.label}
                      active={form.bathroom === item.value}
                      onPress={() => updateField("bathroom", item.value)}
                    />
                  ))}
                </SelectSection>

                <SelectSection title={ui.furnished}>
                  {furnishedOptions.map((item) => (
                    <Pill
                      key={item.value}
                      label={item.label}
                      active={form.furnished === item.value}
                      onPress={() => updateField("furnished", item.value)}
                    />
                  ))}
                </SelectSection>

                <SelectSection title={ui.certificate}>
                  {certificateOptions.map((item) => (
                    <Pill
                      key={item.value}
                      label={item.label}
                      active={form.certificate === item.value}
                      onPress={() => updateField("certificate", item.value)}
                    />
                  ))}
                </SelectSection>

                <SelectSection title={ui.timeline}>
                  {timelineOptions.map((item) => (
                    <Pill
                      key={item.value}
                      label={item.label}
                      active={form.timeline === item.value}
                      onPress={() => updateField("timeline", item.value)}
                    />
                  ))}
                </SelectSection>
              </SectionCard>

              <SectionCard title={ui.tetamoHelp} subtitle={ui.tetamoHelpDesc}>
                <Text style={styles.inputLabel}>{ui.needAgent}</Text>

                <View style={styles.radioRow}>
                  <Pressable
                    style={[
                      styles.radioButton,
                      form.needAgent === "yes" && styles.radioButtonActive,
                    ]}
                    onPress={() => updateField("needAgent", "yes")}
                  >
                    <Text
                      style={[
                        styles.radioText,
                        form.needAgent === "yes" && styles.radioTextActive,
                      ]}
                    >
                      {ui.yes}
                    </Text>
                  </Pressable>

                  <Pressable
                    style={[
                      styles.radioButton,
                      form.needAgent === "no" && styles.radioButtonActive,
                    ]}
                    onPress={() => updateField("needAgent", "no")}
                  >
                    <Text
                      style={[
                        styles.radioText,
                        form.needAgent === "no" && styles.radioTextActive,
                      ]}
                    >
                      {ui.no}
                    </Text>
                  </Pressable>
                </View>

                <FormInput
                  label={ui.notes}
                  value={form.notes}
                  onChangeText={(value) => updateField("notes", value)}
                  placeholder={
                    isId
                      ? "Contoh: dekat sekolah, cocok untuk investasi, owner direct preferred..."
                      : "Example: near school, suitable for investment, owner direct preferred..."
                  }
                  multiline
                  inputStyle={styles.notesInput}
                />
              </SectionCard>

              {errorMessage ? (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>{errorMessage}</Text>
                </View>
              ) : null}

              <Pressable
                style={[
                  styles.submitButton,
                  submitting && styles.submitButtonDisabled,
                ]}
                disabled={submitting}
                onPress={() => void handleSubmit()}
              >
                {submitting ? (
                  <ActivityIndicator color="#111111" />
                ) : (
                  <Send color="#111111" size={16} />
                )}

                <Text style={styles.submitButtonText}>
                  {submitting ? ui.submitting : ui.submit}
                </Text>
              </Pressable>

              <View style={styles.trustBox}>
                <TrustLine text={ui.safeData} />
                <TrustLine text={ui.freeBuyer} />
                <TrustLine text={ui.verifiedAgent} />
              </View>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function ShortcutCard({
  icon,
  title,
  subtitle,
  onPress,
  full,
}: {
  icon: ReactNode;
  title: string;
  subtitle: string;
  onPress: () => void;
  full?: boolean;
}) {
  return (
    <Pressable
      style={[styles.shortcutCard, full && styles.shortcutCardFull]}
      onPress={onPress}
    >
      <View style={styles.shortcutIcon}>{icon}</View>

      <View style={styles.shortcutTextBox}>
        <Text style={styles.shortcutTitle}>{title}</Text>
        <Text style={styles.shortcutSubtitle}>{subtitle}</Text>
      </View>

      <ChevronRight color="#ffffff" size={16} />
    </Pressable>
  );
}

function SectionCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <View style={styles.sectionCard}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.sectionSubtitle}>{subtitle}</Text>

      <View style={styles.sectionContent}>{children}</View>
    </View>
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
  multiline,
  inputStyle,
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  keyboardType?: TextInputProps["keyboardType"];
  autoCapitalize?: TextInputProps["autoCapitalize"];
  icon?: ReactNode;
  multiline?: boolean;
  inputStyle?: TextInputProps["style"];
}) {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>{label}</Text>

      <View style={[styles.inputBox, multiline && styles.inputBoxMultiline]}>
        {icon}

        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#777777"
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          multiline={multiline}
          style={[styles.input, multiline && styles.inputMultiline, inputStyle]}
        />
      </View>
    </View>
  );
}

function SelectSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <View style={styles.selectSection}>
      <Text style={styles.inputLabel}>{title}</Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.pillRow}
      >
        {children}
      </ScrollView>
    </View>
  );
}

function Pill({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={[styles.pill, active && styles.pillActive]}
      onPress={onPress}
    >
      <Text style={[styles.pillText, active && styles.pillTextActive]}>
        {label}
      </Text>
    </Pressable>
  );
}

function TrustLine({ text }: { text: string }) {
  return (
    <View style={styles.trustLine}>
      <CheckCircle2 color="#22c55e" size={15} />
      <Text style={styles.trustText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#050505",
  },
  keyboardView: {
    flex: 1,
  },
  topBar: {
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 10,
    backgroundColor: "#050505",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  topTitle: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "900",
  },
  topSub: {
    color: "#9b9b9b",
    fontSize: 10.5,
    fontWeight: "700",
    marginTop: 2,
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
  badge: {
    alignSelf: "flex-start",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#5b4a24",
    backgroundColor: "#211a0b",
    paddingHorizontal: 10,
    paddingVertical: 7,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  badgeText: {
    color: "#e6c15c",
    fontSize: 10.5,
    fontWeight: "900",
  },
  heroTitle: {
    color: "#ffffff",
    fontSize: 25,
    lineHeight: 31,
    fontWeight: "900",
    letterSpacing: -0.6,
    marginTop: 14,
  },
  heroSubtitle: {
    color: "#b8b8b8",
    fontSize: 12,
    lineHeight: 19,
    fontWeight: "700",
    marginTop: 8,
  },
  shortcutGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 13,
  },
  shortcutCard: {
    width: "48.5%",
    minHeight: 126,
    borderRadius: 23,
    borderWidth: 1,
    borderColor: "#303030",
    backgroundColor: "#101010",
    padding: 13,
  },
  shortcutCardFull: {
    width: "100%",
    minHeight: 92,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
  },
  shortcutIcon: {
    width: 40,
    height: 40,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#5b4a24",
    backgroundColor: "#211a0b",
    alignItems: "center",
    justifyContent: "center",
  },
  shortcutTextBox: {
    flex: 1,
    marginTop: 10,
  },
  shortcutTitle: {
    color: "#ffffff",
    fontSize: 12.5,
    fontWeight: "900",
  },
  shortcutSubtitle: {
    color: "#a9a9a9",
    fontSize: 10.5,
    lineHeight: 15,
    fontWeight: "700",
    marginTop: 4,
  },
  sectionCard: {
    borderRadius: 26,
    borderWidth: 1,
    borderColor: "#303030",
    backgroundColor: "#101010",
    padding: 15,
    marginBottom: 13,
  },
  sectionTitle: {
    color: "#ffffff",
    fontSize: 15.5,
    fontWeight: "900",
  },
  sectionSubtitle: {
    color: "#a9a9a9",
    fontSize: 11.5,
    lineHeight: 17,
    fontWeight: "700",
    marginTop: 5,
  },
  sectionContent: {
    marginTop: 14,
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
  inputBoxMultiline: {
    alignItems: "flex-start",
    paddingTop: 12,
  },
  input: {
    flex: 1,
    color: "#ffffff",
    fontSize: 12.5,
    fontWeight: "800",
    paddingVertical: 0,
  },
  inputMultiline: {
    minHeight: 92,
    textAlignVertical: "top",
    paddingTop: 0,
  },
  notesInput: {
    minHeight: 96,
  },
  selectSection: {
    marginBottom: 12,
  },
  pillRow: {
    gap: 8,
    paddingRight: 8,
    paddingBottom: 2,
  },
  pill: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#343434",
    backgroundColor: "#050505",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  pillActive: {
    borderColor: "#e6c15c",
    backgroundColor: "#e6c15c",
  },
  pillText: {
    color: "#a9a9a9",
    fontSize: 10.5,
    fontWeight: "900",
  },
  pillTextActive: {
    color: "#111111",
  },
  radioRow: {
    flexDirection: "row",
    gap: 9,
    marginBottom: 12,
  },
  radioButton: {
    flex: 1,
    minHeight: 44,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#303030",
    backgroundColor: "#050505",
    alignItems: "center",
    justifyContent: "center",
  },
  radioButtonActive: {
    borderColor: "#e6c15c",
    backgroundColor: "#e6c15c",
  },
  radioText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "900",
  },
  radioTextActive: {
    color: "#111111",
  },
  errorBox: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#7f1d1d",
    backgroundColor: "#2a0d0d",
    padding: 12,
    marginBottom: 13,
  },
  errorText: {
    color: "#fecaca",
    fontSize: 11.8,
    lineHeight: 17,
    fontWeight: "800",
  },
  submitButton: {
    minHeight: 50,
    borderRadius: 17,
    backgroundColor: "#e6c15c",
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginBottom: 13,
  },
  submitButtonDisabled: {
    opacity: 0.65,
  },
  submitButtonText: {
    color: "#111111",
    fontSize: 13,
    fontWeight: "900",
  },
  trustBox: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#303030",
    backgroundColor: "#101010",
    padding: 13,
    gap: 9,
  },
  trustLine: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  trustText: {
    color: "#d6d6d6",
    fontSize: 11.5,
    lineHeight: 17,
    fontWeight: "700",
    flex: 1,
  },
  successCard: {
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "#166534",
    backgroundColor: "#052e16",
    padding: 20,
    alignItems: "flex-start",
  },
  successIcon: {
    width: 56,
    height: 56,
    borderRadius: 20,
    backgroundColor: "#063c1d",
    borderWidth: 1,
    borderColor: "#166534",
    alignItems: "center",
    justifyContent: "center",
  },
  successTitle: {
    color: "#ffffff",
    fontSize: 21,
    lineHeight: 27,
    fontWeight: "900",
    marginTop: 14,
  },
  successDesc: {
    color: "#bbf7d0",
    fontSize: 12.5,
    lineHeight: 19,
    fontWeight: "700",
    marginTop: 8,
    marginBottom: 16,
  },
});