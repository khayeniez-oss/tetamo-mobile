import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
  Bookmark,
  CheckCircle2,
  ChevronRight,
  Heart,
  Languages,
  Mail,
  MapPin,
  Phone,
  Search,
  Send,
  ShieldCheck,
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

const BLACK = "#111111";
const WHITE = "#FFFFFF";
const CREAM = "#FBFAF7";

const GOLD = "#D8B46A";
const GOLD_DARK = "#B8892E";
const GOLD_ACTIVE = "#F0D889";
const GOLD_SOFT = "#F4E8C5";

const BORDER = "#E8E1D7";
const MUTED = "#777169";
const SOFT = "#F5F1EA";

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

  const [language, setLanguage] =
    useState<Language>("en");

  const [form, setForm] =
    useState<BuyerForm>(INITIAL_FORM);

  const [submitting, setSubmitting] =
    useState(false);

  const [submitted, setSubmitted] =
    useState(false);

  const [errorMessage, setErrorMessage] =
    useState("");

  const isId = language === "id";

  /*
   * =================================================
   * COPY
   * =================================================
   */

  const ui = useMemo(() => {
    if (isId) {
      return {
        pageTitle: "Buyer",
        pageSub: "Temukan properti yang sesuai",

        badge: "PEMBELI / PENYEWA",

        heroTitle:
          "Beri tahu kami properti yang Anda cari",

        heroSubtitle:
          "Isi kebutuhan Anda dan Tetamo akan membantu mencocokkan properti yang sesuai.",

        saved: "Tersimpan",
        liked: "Favorit",
        marketplace: "Marketplace",

        savedDesc:
          "Lihat properti tersimpan.",
        likedDesc:
          "Lihat properti favorit Anda.",
        marketplaceDesc:
          "Jelajahi listing Tetamo.",

        step1: "1",
        step1Title: "Kontak Anda",
        buyerInfo:
          "Informasi Pembeli / Penyewa",
        buyerInfoDesc:
          "Berikan detail yang dapat kami gunakan untuk menghubungi Anda.",

        step2: "2",
        step2Title: "Properti",
        propertyPref:
          "Properti yang Dicari",
        propertyPrefDesc:
          "Beritahu kami kebutuhan properti Anda.",

        step3: "3",
        step3Title: "Bantuan",
        tetamoHelp:
          "Bantuan dari Tetamo",
        tetamoHelpDesc:
          "Pilih apakah Anda ingin direkomendasikan agen.",

        fullName: "Nama Lengkap",
        phone: "Nomor Telepon",
        email: "Email",
        countryCode: "Kode Negara",

        lookingFor: "Saya Mencari",
        location: "Lokasi",
        budget: "Budget / Harga",
        propertyType: "Tipe Properti",

        bedroom: "Kamar Tidur",
        bathroom: "Kamar Mandi",
        furnished: "Furnishing",
        certificate: "Status Sertifikat",
        timeline: "Kapan Dibutuhkan",

        needAgent:
          "Ingin Tetamo merekomendasikan agen?",

        notes: "Catatan Tambahan",

        submit: "Kirim Permintaan",
        submitting: "Mengirim...",

        submitAnother:
          "Kirim Permintaan Lain",

        successTitle:
          "Permintaan berhasil dikirim",

        successDesc:
          "Tetamo telah menerima kebutuhan properti Anda. Tim kami dapat meninjau permintaan dan membantu mencocokkan properti yang sesuai.",

        safeData:
          "Detail Anda digunakan untuk membantu menangani permintaan ini.",

        freeBuyer:
          "Gratis untuk mengirim permintaan sebagai pembeli atau penyewa.",

        agentChoice:
          "Anda bebas memilih apakah ingin rekomendasi agen.",

        required:
          "Mohon lengkapi semua field wajib.",

        failed:
          "Gagal mengirim permintaan.",

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

        bedroomsShort: "KT",
        bathroomsShort: "KM",

        optional: "Opsional",

        locationPlaceholder:
          "Contoh: Canggu, Bali atau Batam",

        budgetSalePlaceholder:
          "Contoh: Rp 2 Miliar",

        budgetRentPlaceholder:
          "Contoh: Rp 100 Juta per tahun",

        notesPlaceholder:
          "Contoh: dekat sekolah, untuk investasi, area tertentu...",

        propertySection:
          "Detail tambahan",

        propertySectionSub:
          "Tambahkan preferensi jika ada. Field ini opsional.",
      };
    }

    return {
      pageTitle: "Buyer",
      pageSub: "Find the right property",

      badge: "BUYERS / RENTERS",

      heroTitle:
        "Tell us what property you're looking for",

      heroSubtitle:
        "Share what you need and Tetamo can help match you with suitable properties.",

      saved: "Saved",
      liked: "Favourites",
      marketplace: "Marketplace",

      savedDesc:
        "View your saved properties.",
      likedDesc:
        "View your favourite properties.",
      marketplaceDesc:
        "Browse Tetamo listings.",

      step1: "1",
      step1Title: "Contact",
      buyerInfo:
        "Your Information",
      buyerInfoDesc:
        "Give us the details we can use to contact you.",

      step2: "2",
      step2Title: "Property",
      propertyPref:
        "What Are You Looking For?",
      propertyPrefDesc:
        "Tell us the property requirements that matter most.",

      step3: "3",
      step3Title: "Assistance",
      tetamoHelp:
        "Help from Tetamo",
      tetamoHelpDesc:
        "Choose whether you would like an agent recommendation.",

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
      furnished: "Furnishing",
      certificate: "Certificate Status",
      timeline: "Timeline",

      needAgent:
        "Would you like Tetamo to recommend an agent?",

      notes: "Additional Notes",

      submit: "Submit Request",
      submitting: "Submitting...",

      submitAnother:
        "Submit Another Request",

      successTitle:
        "Your request has been submitted",

      successDesc:
        "Tetamo has received your property requirements. Our team can review your request and help match suitable properties.",

      safeData:
        "Your details are used to help handle this request.",

      freeBuyer:
        "There is no fee to submit a buyer or renter request.",

      agentChoice:
        "You choose whether you want an agent recommendation.",

      required:
        "Please complete all required fields.",

      failed:
        "Failed to submit request.",

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

      bedroomsShort: "Beds",
      bathroomsShort: "Baths",

      optional: "Optional",

      locationPlaceholder:
        "Example: Canggu, Bali or Batam",

      budgetSalePlaceholder:
        "Example: Rp 2 Billion",

      budgetRentPlaceholder:
        "Example: Rp 100 Million per year",

      notesPlaceholder:
        "Example: near school, investment property, preferred area...",

      propertySection:
        "Additional preferences",

      propertySectionSub:
        "Add more preferences if you have them. These fields are optional.",
    };
  }, [isId]);

  /*
   * =================================================
   * OPTIONS
   * =================================================
   */

  const searchTypeOptions: Option[] = [
    {
      value: "sale",
      label: ui.sale,
    },
    {
      value: "rent",
      label: ui.rent,
    },
    {
      value: "auction",
      label: ui.auction,
    },
  ];

  const propertyTypeOptions: Option[] = [
    {
      value: "Rumah",
      label: ui.house,
    },
    {
      value: "Apartemen",
      label: ui.apartment,
    },
    {
      value: "Villa",
      label: ui.villa,
    },
    {
      value: "Tanah",
      label: ui.land,
    },
    {
      value: "Ruko",
      label: ui.shopHouse,
    },
    {
      value: "Komersial",
      label: ui.commercial,
    },
  ];

  const bedroomOptions: Option[] = [
    {
      value: "1 Kamar",
      label: "1",
    },
    {
      value: "2 Kamar",
      label: "2",
    },
    {
      value: "3 Kamar",
      label: "3",
    },
    {
      value: "4 Kamar",
      label: "4",
    },
    {
      value: "5+ Kamar",
      label: "5+",
    },
  ];

  const bathroomOptions: Option[] = [
    {
      value: "1 Kamar Mandi",
      label: "1",
    },
    {
      value: "2 Kamar Mandi",
      label: "2",
    },
    {
      value: "3 Kamar Mandi",
      label: "3",
    },
    {
      value: "4+ Kamar Mandi",
      label: "4+",
    },
  ];

  const furnishedOptions: Option[] = [
    {
      value: "Full Furnish",
      label: isId
        ? "Full Furnish"
        : "Fully Furnished",
    },
    {
      value: "Semi Furnish",
      label: isId
        ? "Semi Furnish"
        : "Semi Furnished",
    },
    {
      value: "Unfurnished",
      label: "Unfurnished",
    },
  ];

  const certificateOptions: Option[] = [
    {
      value: "SHM",
      label: isId
        ? "SHM"
        : "Freehold (SHM)",
    },
    {
      value: "HGB",
      label: isId
        ? "HGB"
        : "Right to Build (HGB)",
    },
    {
      value: "PPJB",
      label: "PPJB",
    },
    {
      value: "Other",
      label: isId
        ? "Lainnya"
        : "Other",
    },
  ];

  const timelineOptions: Option[] = [
    {
      value: "Secepatnya",
      label: isId
        ? "Secepatnya"
        : "ASAP",
    },
    {
      value: "Dalam 1 Bulan",
      label: isId
        ? "1 Bulan"
        : "Within 1 Month",
    },
    {
      value: "Dalam 3 Bulan",
      label: isId
        ? "3 Bulan"
        : "Within 3 Months",
    },
    {
      value: "Masih Survey",
      label: isId
        ? "Masih Survey"
        : "Just Browsing",
    },
  ];

  /*
   * =================================================
   * FORM HELPERS
   * =================================================
   */

  function updateField<
    K extends keyof BuyerForm,
  >(
    key: K,
    value: BuyerForm[K]
  ) {
    setForm((previous) => ({
      ...previous,
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

  const budgetPlaceholder =
    form.searchType === "rent"
      ? ui.budgetRentPlaceholder
      : ui.budgetSalePlaceholder;

  /*
   * =================================================
   * SUBMIT
   * PRESERVE REAL buyer_requests INSERT
   * =================================================
   */

  async function handleSubmit() {
    if (!validateForm()) {
      Alert.alert(ui.required);
      return;
    }

    setSubmitting(true);
    setErrorMessage("");

    try {
      const fullPhone =
        `${form.countryCode} ${form.phone.trim()}`.trim();

      const payload = {
        name: form.name.trim(),
        phone: fullPhone,
        email:
          form.email.trim() || null,

        search_type:
          form.searchType,

        location:
          form.location.trim(),

        budget:
          form.budget.trim(),

        property_type:
          form.propertyType.trim(),

        bedroom:
          form.bedroom.trim() ||
          null,

        bathroom:
          form.bathroom.trim() ||
          null,

        furnished:
          form.furnished.trim() ||
          null,

        certificate:
          form.certificate.trim() ||
          null,

        timeline:
          form.timeline.trim() ||
          null,

        need_agent:
          form.needAgent,

        notes:
          form.notes.trim() ||
          null,

        status: "NEW",
      };

      const { error } =
        await supabase
          .from("buyer_requests")
          .insert(payload);

      if (error) {
        setErrorMessage(
          error.message ||
            ui.failed
        );

        return;
      }

      setSubmitted(true);
      setForm(INITIAL_FORM);
    } catch (error: any) {
      setErrorMessage(
        error?.message ||
          ui.failed
      );
    } finally {
      setSubmitting(false);
    }
  }

  /*
   * =================================================
   * SCREEN
   * =================================================
   */

  return (
    <SafeAreaView
      style={styles.safeArea}
    >
      <StatusBar style="dark" />

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={
          Platform.OS === "ios"
            ? "padding"
            : undefined
        }
      >
        {/* =================================
            HEADER
        ================================= */}

        <View style={styles.topBar}>
          <View
            style={styles.topTitleBox}
          >
            <Text style={styles.topTitle}>
              {ui.pageTitle}
            </Text>

            <Text style={styles.topSub}>
              {ui.pageSub}
            </Text>
          </View>

          <View
            style={styles.languageControl}
          >
            <Languages
              color={GOLD_DARK}
              size={14}
            />

            {(
              ["en", "id"] as Language[]
            ).map((item) => {
              const active =
                language === item;

              return (
                <Pressable
                  key={item}
                  style={[
                    styles.languageButton,
                    active &&
                      styles.languageButtonActive,
                  ]}
                  onPress={() =>
                    setLanguage(item)
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
            })}
          </View>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={
            styles.content
          }
          showsVerticalScrollIndicator={
            false
          }
          keyboardShouldPersistTaps="handled"
        >
          {/* =================================
              HERO
          ================================= */}

          <View style={styles.heroCard}>
            <View style={styles.heroBadge}>
              <UserRound
                color={GOLD_DARK}
                size={13}
              />

              <Text
                style={
                  styles.heroBadgeText
                }
              >
                {ui.badge}
              </Text>
            </View>

            <Text
              style={styles.heroTitle}
            >
              {ui.heroTitle}
            </Text>

            <Text
              style={
                styles.heroSubtitle
              }
            >
              {ui.heroSubtitle}
            </Text>

            <View style={styles.stepsRow}>
              <StepPill
                number={ui.step1}
                title={ui.step1Title}
              />

              <View
                style={styles.stepLine}
              />

              <StepPill
                number={ui.step2}
                title={ui.step2Title}
              />

              <View
                style={styles.stepLine}
              />

              <StepPill
                number={ui.step3}
                title={ui.step3Title}
              />
            </View>
          </View>

          {/* =================================
              SHORTCUTS
          ================================= */}

          <View
            style={
              styles.shortcutRow
            }
          >
            <ShortcutCard
              icon={
                <Bookmark
                  color={GOLD_DARK}
                  size={18}
                />
              }
              title={ui.saved}
              subtitle={
                ui.savedDesc
              }
              onPress={() =>
                router.push(
                  "/dashboard/saved" as any
                )
              }
            />

            <ShortcutCard
              icon={
                <Heart
                  color={GOLD_DARK}
                  size={18}
                />
              }
              title={ui.liked}
              subtitle={
                ui.likedDesc
              }
              onPress={() =>
                router.push(
                  "/dashboard/liked" as any
                )
              }
            />
          </View>

          <Pressable
            style={
              styles.marketplaceShortcut
            }
            onPress={() =>
              router.push(
                "/property" as any
              )
            }
          >
            <View
              style={
                styles.marketplaceIcon
              }
            >
              <Search
                color={GOLD_DARK}
                size={18}
              />
            </View>

            <View
              style={
                styles.marketplaceCopy
              }
            >
              <Text
                style={
                  styles.marketplaceTitle
                }
              >
                {ui.marketplace}
              </Text>

              <Text
                style={
                  styles.marketplaceSub
                }
              >
                {
                  ui.marketplaceDesc
                }
              </Text>
            </View>

            <ChevronRight
              color="#958E85"
              size={17}
            />
          </Pressable>

          {/* =================================
              SUCCESS
          ================================= */}

          {submitted ? (
            <View
              style={
                styles.successCard
              }
            >
              <View
                style={
                  styles.successIcon
                }
              >
                <CheckCircle2
                  color="#25834C"
                  size={28}
                />
              </View>

              <Text
                style={
                  styles.successTitle
                }
              >
                {ui.successTitle}
              </Text>

              <Text
                style={
                  styles.successDesc
                }
              >
                {ui.successDesc}
              </Text>

              <Pressable
                style={
                  styles.submitButton
                }
                onPress={() =>
                  setSubmitted(false)
                }
              >
                <Send
                  color={BLACK}
                  size={16}
                />

                <Text
                  style={
                    styles.submitButtonText
                  }
                >
                  {ui.submitAnother}
                </Text>
              </Pressable>
            </View>
          ) : (
            <>
              {/* =============================
                  STEP 1 — CONTACT
              ============================= */}

              <FormSection
                number="1"
                title={
                  ui.buyerInfo
                }
                subtitle={
                  ui.buyerInfoDesc
                }
              >
                <FormInput
                  label={`${ui.fullName} *`}
                  value={form.name}
                  onChangeText={(
                    value
                  ) =>
                    updateField(
                      "name",
                      value
                    )
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

                <Text
                  style={
                    styles.inputLabel
                  }
                >
                  {ui.countryCode}
                </Text>

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={
                    false
                  }
                  contentContainerStyle={
                    styles.pillRow
                  }
                >
                  {COUNTRY_CODE_OPTIONS.map(
                    (item) => (
                      <ChoicePill
                        key={
                          item.value
                        }
                        label={
                          item.label
                        }
                        active={
                          form.countryCode ===
                          item.value
                        }
                        onPress={() =>
                          updateField(
                            "countryCode",
                            item.value
                          )
                        }
                      />
                    )
                  )}
                </ScrollView>

                <View
                  style={
                    styles.contactGrid
                  }
                >
                  <View
                    style={
                      styles.contactGridItem
                    }
                  >
                    <FormInput
                      label={`${ui.phone} *`}
                      value={
                        form.phone
                      }
                      onChangeText={(
                        value
                      ) =>
                        updateField(
                          "phone",
                          value
                        )
                      }
                      placeholder="8123456789"
                      keyboardType="phone-pad"
                      icon={
                        <Phone
                          color="#9A938A"
                          size={15}
                        />
                      }
                    />
                  </View>

                  <View
                    style={
                      styles.contactGridItem
                    }
                  >
                    <FormInput
                      label={`${ui.email} *`}
                      value={
                        form.email
                      }
                      onChangeText={(
                        value
                      ) =>
                        updateField(
                          "email",
                          value
                        )
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
                  </View>
                </View>
              </FormSection>

              {/* =============================
                  STEP 2 — PROPERTY
              ============================= */}

              <FormSection
                number="2"
                title={
                  ui.propertyPref
                }
                subtitle={
                  ui.propertyPrefDesc
                }
              >
                <SelectSection
                  title={`${ui.lookingFor} *`}
                >
                  {searchTypeOptions.map(
                    (item) => (
                      <ChoicePill
                        key={
                          item.value
                        }
                        label={
                          item.label
                        }
                        active={
                          form.searchType ===
                          item.value
                        }
                        onPress={() =>
                          updateField(
                            "searchType",
                            item.value as SearchType
                          )
                        }
                      />
                    )
                  )}
                </SelectSection>

                <FormInput
                  label={`${ui.location} *`}
                  value={
                    form.location
                  }
                  onChangeText={(
                    value
                  ) =>
                    updateField(
                      "location",
                      value
                    )
                  }
                  placeholder={
                    ui.locationPlaceholder
                  }
                  icon={
                    <MapPin
                      color="#9A938A"
                      size={15}
                    />
                  }
                />

                <FormInput
                  label={`${ui.budget} *`}
                  value={
                    form.budget
                  }
                  onChangeText={(
                    value
                  ) =>
                    updateField(
                      "budget",
                      value
                    )
                  }
                  placeholder={
                    budgetPlaceholder
                  }
                />

                <SelectSection
                  title={`${ui.propertyType} *`}
                >
                  {propertyTypeOptions.map(
                    (item) => (
                      <ChoicePill
                        key={
                          item.value
                        }
                        label={
                          item.label
                        }
                        active={
                          form.propertyType ===
                          item.value
                        }
                        onPress={() =>
                          updateField(
                            "propertyType",
                            item.value
                          )
                        }
                      />
                    )
                  )}
                </SelectSection>

                {/* ===========================
                    OPTIONAL PREFERENCES
                =========================== */}

                <View
                  style={
                    styles.optionalHeader
                  }
                >
                  <View>
                    <Text
                      style={
                        styles.optionalTitle
                      }
                    >
                      {
                        ui.propertySection
                      }
                    </Text>

                    <Text
                      style={
                        styles.optionalSub
                      }
                    >
                      {
                        ui.propertySectionSub
                      }
                    </Text>
                  </View>

                  <View
                    style={
                      styles.optionalBadge
                    }
                  >
                    <Text
                      style={
                        styles.optionalBadgeText
                      }
                    >
                      {ui.optional}
                    </Text>
                  </View>
                </View>

                <SelectSection
                  title={ui.bedroom}
                >
                  {bedroomOptions.map(
                    (item) => (
                      <ChoicePill
                        key={
                          item.value
                        }
                        label={
                          item.label
                        }
                        active={
                          form.bedroom ===
                          item.value
                        }
                        onPress={() =>
                          updateField(
                            "bedroom",
                            item.value
                          )
                        }
                      />
                    )
                  )}
                </SelectSection>

                <SelectSection
                  title={ui.bathroom}
                >
                  {bathroomOptions.map(
                    (item) => (
                      <ChoicePill
                        key={
                          item.value
                        }
                        label={
                          item.label
                        }
                        active={
                          form.bathroom ===
                          item.value
                        }
                        onPress={() =>
                          updateField(
                            "bathroom",
                            item.value
                          )
                        }
                      />
                    )
                  )}
                </SelectSection>

                <SelectSection
                  title={ui.furnished}
                >
                  {furnishedOptions.map(
                    (item) => (
                      <ChoicePill
                        key={
                          item.value
                        }
                        label={
                          item.label
                        }
                        active={
                          form.furnished ===
                          item.value
                        }
                        onPress={() =>
                          updateField(
                            "furnished",
                            item.value
                          )
                        }
                      />
                    )
                  )}
                </SelectSection>

                <SelectSection
                  title={
                    ui.certificate
                  }
                >
                  {certificateOptions.map(
                    (item) => (
                      <ChoicePill
                        key={
                          item.value
                        }
                        label={
                          item.label
                        }
                        active={
                          form.certificate ===
                          item.value
                        }
                        onPress={() =>
                          updateField(
                            "certificate",
                            item.value
                          )
                        }
                      />
                    )
                  )}
                </SelectSection>

                <SelectSection
                  title={ui.timeline}
                  last
                >
                  {timelineOptions.map(
                    (item) => (
                      <ChoicePill
                        key={
                          item.value
                        }
                        label={
                          item.label
                        }
                        active={
                          form.timeline ===
                          item.value
                        }
                        onPress={() =>
                          updateField(
                            "timeline",
                            item.value
                          )
                        }
                      />
                    )
                  )}
                </SelectSection>
              </FormSection>

              {/* =============================
                  STEP 3 — TETAMO HELP
              ============================= */}

              <FormSection
                number="3"
                title={
                  ui.tetamoHelp
                }
                subtitle={
                  ui.tetamoHelpDesc
                }
              >
                <Text
                  style={
                    styles.inputLabel
                  }
                >
                  {ui.needAgent}
                </Text>

                <View
                  style={
                    styles.radioRow
                  }
                >
                  <Pressable
                    style={[
                      styles.radioButton,
                      form.needAgent ===
                        "yes" &&
                        styles.radioButtonActive,
                    ]}
                    onPress={() =>
                      updateField(
                        "needAgent",
                        "yes"
                      )
                    }
                  >
                    <CheckCircle2
                      color={
                        form.needAgent ===
                        "yes"
                          ? BLACK
                          : "#A29B91"
                      }
                      size={15}
                    />

                    <Text
                      style={[
                        styles.radioText,
                        form.needAgent ===
                          "yes" &&
                          styles.radioTextActive,
                      ]}
                    >
                      {ui.yes}
                    </Text>
                  </Pressable>

                  <Pressable
                    style={[
                      styles.radioButton,
                      form.needAgent ===
                        "no" &&
                        styles.radioButtonActive,
                    ]}
                    onPress={() =>
                      updateField(
                        "needAgent",
                        "no"
                      )
                    }
                  >
                    <Text
                      style={[
                        styles.radioText,
                        form.needAgent ===
                          "no" &&
                          styles.radioTextActive,
                      ]}
                    >
                      {ui.no}
                    </Text>
                  </Pressable>
                </View>

                <FormInput
                  label={ui.notes}
                  value={form.notes}
                  onChangeText={(
                    value
                  ) =>
                    updateField(
                      "notes",
                      value
                    )
                  }
                  placeholder={
                    ui.notesPlaceholder
                  }
                  multiline
                  inputStyle={
                    styles.notesInput
                  }
                />
              </FormSection>

              {/* =============================
                  ERROR
              ============================= */}

              {errorMessage ? (
                <View
                  style={
                    styles.errorBox
                  }
                >
                  <Text
                    style={
                      styles.errorText
                    }
                  >
                    {errorMessage}
                  </Text>
                </View>
              ) : null}

              {/* =============================
                  SUBMIT
              ============================= */}

              <Pressable
                style={[
                  styles.submitButton,
                  submitting &&
                    styles.submitButtonDisabled,
                ]}
                disabled={
                  submitting
                }
                onPress={() =>
                  void handleSubmit()
                }
              >
                {submitting ? (
                  <ActivityIndicator
                    color={BLACK}
                  />
                ) : (
                  <Send
                    color={BLACK}
                    size={16}
                  />
                )}

                <Text
                  style={
                    styles.submitButtonText
                  }
                >
                  {submitting
                    ? ui.submitting
                    : ui.submit}
                </Text>
              </Pressable>

              {/* =============================
                  TRUST / INFORMATION
              ============================= */}

              <View
                style={
                  styles.trustBox
                }
              >
                <View
                  style={
                    styles.trustHeader
                  }
                >
                  <View
                    style={
                      styles.trustHeaderIcon
                    }
                  >
                    <ShieldCheck
                      color={GOLD_DARK}
                      size={18}
                    />
                  </View>

                  <Text
                    style={
                      styles.trustHeaderText
                    }
                  >
                    TETAMO
                  </Text>
                </View>

                <TrustLine
                  text={
                    ui.safeData
                  }
                />

                <TrustLine
                  text={
                    ui.freeBuyer
                  }
                />

                <TrustLine
                  text={
                    ui.agentChoice
                  }
                />
              </View>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/*
 * =================================================
 * HERO STEP
 * =================================================
 */

function StepPill({
  number,
  title,
}: {
  number: string;
  title: string;
}) {
  return (
    <View style={styles.stepPill}>
      <View
        style={styles.stepNumber}
      >
        <Text
          style={
            styles.stepNumberText
          }
        >
          {number}
        </Text>
      </View>

      <Text
        style={styles.stepTitle}
        numberOfLines={1}
      >
        {title}
      </Text>
    </View>
  );
}

/*
 * =================================================
 * SHORTCUT
 * =================================================
 */

function ShortcutCard({
  icon,
  title,
  subtitle,
  onPress,
}: {
  icon: ReactNode;
  title: string;
  subtitle: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={
        styles.shortcutCard
      }
      onPress={onPress}
    >
      <View
        style={
          styles.shortcutIcon
        }
      >
        {icon}
      </View>

      <View
        style={
          styles.shortcutTextBox
        }
      >
        <Text
          style={
            styles.shortcutTitle
          }
          numberOfLines={1}
        >
          {title}
        </Text>

        <Text
          style={
            styles.shortcutSubtitle
          }
          numberOfLines={2}
        >
          {subtitle}
        </Text>
      </View>

      <ChevronRight
        color="#A49D94"
        size={15}
      />
    </Pressable>
  );
}

/*
 * =================================================
 * FORM SECTION
 * =================================================
 */

function FormSection({
  number,
  title,
  subtitle,
  children,
}: {
  number: string;
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <View
      style={
        styles.sectionCard
      }
    >
      <View
        style={
          styles.sectionHeader
        }
      >
        <View
          style={
            styles.sectionNumber
          }
        >
          <Text
            style={
              styles.sectionNumberText
            }
          >
            {number}
          </Text>
        </View>

        <View
          style={
            styles.sectionTitleBox
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
      </View>

      <View
        style={
          styles.sectionContent
        }
      >
        {children}
      </View>
    </View>
  );
}

/*
 * =================================================
 * FORM INPUT
 * =================================================
 */

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
  onChangeText: (
    text: string
  ) => void;
  placeholder?: string;
  keyboardType?: TextInputProps["keyboardType"];
  autoCapitalize?: TextInputProps["autoCapitalize"];
  icon?: ReactNode;
  multiline?: boolean;
  inputStyle?: TextInputProps["style"];
}) {
  return (
    <View
      style={
        styles.inputGroup
      }
    >
      <Text
        style={
          styles.inputLabel
        }
      >
        {label}
      </Text>

      <View
        style={[
          styles.inputBox,
          multiline &&
            styles.inputBoxMultiline,
        ]}
      >
        {icon}

        <TextInput
          value={value}
          onChangeText={
            onChangeText
          }
          placeholder={
            placeholder
          }
          placeholderTextColor="#A29B92"
          keyboardType={
            keyboardType
          }
          autoCapitalize={
            autoCapitalize
          }
          multiline={multiline}
          style={[
            styles.input,
            multiline &&
              styles.inputMultiline,
            inputStyle,
          ]}
        />
      </View>
    </View>
  );
}

/*
 * =================================================
 * SELECT SECTION
 * =================================================
 */

function SelectSection({
  title,
  children,
  last = false,
}: {
  title: string;
  children: ReactNode;
  last?: boolean;
}) {
  return (
    <View
      style={[
        styles.selectSection,
        last &&
          styles.selectSectionLast,
      ]}
    >
      <Text
        style={
          styles.inputLabel
        }
      >
        {title}
      </Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={
          false
        }
        contentContainerStyle={
          styles.pillRow
        }
      >
        {children}
      </ScrollView>
    </View>
  );
}

/*
 * =================================================
 * CHOICE PILL
 * =================================================
 */

function ChoicePill({
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
      style={[
        styles.pill,
        active &&
          styles.pillActive,
      ]}
      onPress={onPress}
    >
      <Text
        style={[
          styles.pillText,
          active &&
            styles.pillTextActive,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

/*
 * =================================================
 * TRUST LINE
 * =================================================
 */

function TrustLine({
  text,
}: {
  text: string;
}) {
  return (
    <View
      style={
        styles.trustLine
      }
    >
      <CheckCircle2
        color="#25834C"
        size={14}
      />

      <Text
        style={
          styles.trustText
        }
      >
        {text}
      </Text>
    </View>
  );
}

/*
 * =================================================
 * STYLES
 * =================================================
 */

const styles =
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: CREAM,
    },

    keyboardView: {
      flex: 1,
    },

    /*
     * HEADER
     */

    topBar: {
      minHeight: 59,

      paddingHorizontal: 16,
      paddingVertical: 8,

      backgroundColor: CREAM,

      flexDirection: "row",
      alignItems: "center",
      justifyContent:
        "space-between",

      gap: 10,

      borderBottomWidth: 1,
      borderBottomColor: BORDER,
    },

    topTitleBox: {
      flex: 1,
    },

    topTitle: {
      color: BLACK,

      fontSize: 18,
      fontWeight: "900",
    },

    topSub: {
      marginTop: 2,

      color: MUTED,

      fontSize: 9.5,
      fontWeight: "600",
    },

    languageControl: {
      minHeight: 37,

      paddingHorizontal: 4,

      borderRadius: 13,

      flexDirection: "row",
      alignItems: "center",

      gap: 2,

      backgroundColor: WHITE,

      borderWidth: 1,
      borderColor: BORDER,
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
      color: "#908A82",

      fontSize: 8.5,
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
      backgroundColor: CREAM,
    },

    content: {
      paddingHorizontal: 16,
      paddingTop: 14,

      /*
       * Leave enough room above
       * the custom bottom navigation.
       */
      paddingBottom: 125,
    },

    /*
     * HERO
     */

    heroCard: {
      padding: 16,

      borderRadius: 23,

      backgroundColor: WHITE,

      borderWidth: 1,
      borderColor: BORDER,
    },

    heroBadge: {
      alignSelf: "flex-start",

      minHeight: 27,

      paddingHorizontal: 9,

      borderRadius: 999,

      flexDirection: "row",
      alignItems: "center",

      gap: 5,

      backgroundColor:
        GOLD_SOFT,
    },

    heroBadgeText: {
      color: "#705A27",

      fontSize: 7.8,
      fontWeight: "900",

      letterSpacing: 0.4,
    },

    heroTitle: {
      marginTop: 12,

      color: BLACK,

      fontSize: 21,
      lineHeight: 27,

      fontWeight: "900",

      letterSpacing: -0.45,
    },

    heroSubtitle: {
      marginTop: 6,

      color: MUTED,

      fontSize: 10.5,
      lineHeight: 16,

      fontWeight: "500",
    },

    /*
     * STEPS
     */

    stepsRow: {
      marginTop: 14,

      flexDirection: "row",
      alignItems: "center",
    },

    stepPill: {
      flexDirection: "row",
      alignItems: "center",

      gap: 5,
    },

    stepNumber: {
      width: 24,
      height: 24,

      borderRadius: 999,

      backgroundColor:
        GOLD_ACTIVE,

      alignItems: "center",
      justifyContent: "center",
    },

    stepNumberText: {
      color: BLACK,

      fontSize: 8.5,
      fontWeight: "900",
    },

    stepTitle: {
      color: "#625D55",

      fontSize: 8,
      fontWeight: "800",
    },

    stepLine: {
      flex: 1,

      height: 1,

      marginHorizontal: 6,

      backgroundColor:
        "#E7DED0",
    },

    /*
     * SHORTCUTS
     */

    shortcutRow: {
      marginTop: 12,

      flexDirection: "row",

      gap: 8,
    },

    shortcutCard: {
      flex: 1,

      minHeight: 87,

      padding: 11,

      borderRadius: 18,

      flexDirection: "row",
      alignItems: "center",

      gap: 8,

      backgroundColor: WHITE,

      borderWidth: 1,
      borderColor: BORDER,
    },

    shortcutIcon: {
      width: 36,
      height: 36,

      borderRadius: 12,

      backgroundColor:
        GOLD_SOFT,

      alignItems: "center",
      justifyContent: "center",
    },

    shortcutTextBox: {
      flex: 1,
      minWidth: 0,
    },

    shortcutTitle: {
      color: BLACK,

      fontSize: 10.5,
      fontWeight: "900",
    },

    shortcutSubtitle: {
      marginTop: 3,

      color: MUTED,

      fontSize: 8,
      lineHeight: 11,

      fontWeight: "500",
    },

    marketplaceShortcut: {
      minHeight: 65,

      marginTop: 8,
      marginBottom: 12,

      paddingHorizontal: 11,

      borderRadius: 18,

      flexDirection: "row",
      alignItems: "center",

      gap: 9,

      backgroundColor: BLACK,
    },

    marketplaceIcon: {
      width: 38,
      height: 38,

      borderRadius: 12,

      backgroundColor:
        "#28251F",

      alignItems: "center",
      justifyContent: "center",
    },

    marketplaceCopy: {
      flex: 1,
    },

    marketplaceTitle: {
      color: WHITE,

      fontSize: 11.5,
      fontWeight: "900",
    },

    marketplaceSub: {
      marginTop: 2,

      color: "#BBB5AB",

      fontSize: 8.5,
      fontWeight: "500",
    },

    /*
     * FORM SECTIONS
     */

    sectionCard: {
      marginBottom: 12,

      padding: 14,

      borderRadius: 22,

      backgroundColor: WHITE,

      borderWidth: 1,
      borderColor: BORDER,
    },

    sectionHeader: {
      flexDirection: "row",
      alignItems: "center",

      gap: 9,
    },

    sectionNumber: {
      width: 35,
      height: 35,

      borderRadius: 12,

      backgroundColor:
        GOLD_ACTIVE,

      alignItems: "center",
      justifyContent: "center",
    },

    sectionNumberText: {
      color: BLACK,

      fontSize: 11,
      fontWeight: "900",
    },

    sectionTitleBox: {
      flex: 1,
    },

    sectionTitle: {
      color: BLACK,

      fontSize: 14,
      fontWeight: "900",
    },

    sectionSubtitle: {
      marginTop: 2,

      color: MUTED,

      fontSize: 8.8,
      lineHeight: 13,

      fontWeight: "500",
    },

    sectionContent: {
      marginTop: 14,
    },

    /*
     * INPUTS
     */

    inputGroup: {
      marginBottom: 12,
    },

    inputLabel: {
      marginBottom: 6,

      color: "#4E4943",

      fontSize: 9.3,
      fontWeight: "900",
    },

    inputBox: {
      minHeight: 46,

      paddingHorizontal: 11,

      borderRadius: 14,

      flexDirection: "row",
      alignItems: "center",

      gap: 7,

      backgroundColor: CREAM,

      borderWidth: 1,
      borderColor: "#DED7CD",
    },

    inputBoxMultiline: {
      minHeight: 98,

      alignItems: "flex-start",

      paddingTop: 12,
    },

    input: {
      flex: 1,

      paddingVertical: 0,

      color: BLACK,

      fontSize: 10.5,
      fontWeight: "600",
    },

    inputMultiline: {
      minHeight: 76,

      paddingTop: 0,

      textAlignVertical: "top",
    },

    notesInput: {
      minHeight: 76,
    },

    /*
     * CONTACT
     *
     * Keep fields full-width on narrow
     * phone layouts by using a column.
     */

    contactGrid: {
      gap: 0,
    },

    contactGridItem: {
      width: "100%",
    },

    /*
     * CHOICES
     */

    selectSection: {
      marginBottom: 12,
    },

    selectSectionLast: {
      marginBottom: 0,
    },

    pillRow: {
      gap: 6,

      paddingRight: 6,
      paddingBottom: 2,
    },

    pill: {
      minHeight: 34,

      paddingHorizontal: 11,

      borderRadius: 999,

      alignItems: "center",
      justifyContent: "center",

      backgroundColor: CREAM,

      borderWidth: 1,
      borderColor: "#DED7CD",
    },

    pillActive: {
      backgroundColor:
        GOLD_ACTIVE,

      borderColor: "#DFC765",
    },

    pillText: {
      color: "#716A61",

      fontSize: 8.8,
      fontWeight: "800",
    },

    pillTextActive: {
      color: BLACK,
      fontWeight: "900",
    },

    /*
     * OPTIONAL BLOCK
     */

    optionalHeader: {
      marginTop: 3,
      marginBottom: 13,

      paddingTop: 13,

      borderTopWidth: 1,
      borderTopColor:
        "#EEE7DD",

      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent:
        "space-between",

      gap: 10,
    },

    optionalTitle: {
      color: BLACK,

      fontSize: 11,
      fontWeight: "900",
    },

    optionalSub: {
      maxWidth: 235,

      marginTop: 2,

      color: MUTED,

      fontSize: 8.3,
      lineHeight: 12,

      fontWeight: "500",
    },

    optionalBadge: {
      minHeight: 25,

      paddingHorizontal: 8,

      borderRadius: 999,

      alignItems: "center",
      justifyContent: "center",

      backgroundColor: SOFT,
    },

    optionalBadgeText: {
      color: "#7B746B",

      fontSize: 7.5,
      fontWeight: "800",
    },

    /*
     * AGENT YES / NO
     */

    radioRow: {
      marginBottom: 12,

      flexDirection: "row",

      gap: 8,
    },

    radioButton: {
      flex: 1,

      minHeight: 42,

      borderRadius: 13,

      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",

      gap: 5,

      backgroundColor: CREAM,

      borderWidth: 1,
      borderColor: "#DED7CD",
    },

    radioButtonActive: {
      backgroundColor:
        GOLD_ACTIVE,

      borderColor: "#DFC765",
    },

    radioText: {
      color: "#6B655D",

      fontSize: 9.5,
      fontWeight: "900",
    },

    radioTextActive: {
      color: BLACK,
    },

    /*
     * ERROR
     */

    errorBox: {
      marginBottom: 12,

      padding: 11,

      borderRadius: 14,

      backgroundColor:
        "#FFF1F1",

      borderWidth: 1,
      borderColor:
        "#F2CBCB",
    },

    errorText: {
      color: "#9D3030",

      fontSize: 9.5,
      lineHeight: 14,

      fontWeight: "700",
    },

    /*
     * SUBMIT
     */

    submitButton: {
      minHeight: 48,

      marginBottom: 12,

      paddingHorizontal: 14,

      borderRadius: 15,

      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",

      gap: 7,

      backgroundColor:
        GOLD_ACTIVE,
    },

    submitButtonDisabled: {
      opacity: 0.6,
    },

    submitButtonText: {
      color: BLACK,

      fontSize: 11,
      fontWeight: "900",
    },

    /*
     * TRUST
     */

    trustBox: {
      padding: 13,

      borderRadius: 19,

      backgroundColor:
        "#F7F2E8",

      borderWidth: 1,
      borderColor:
        "#E2D4B0",

      gap: 8,
    },

    trustHeader: {
      marginBottom: 3,

      flexDirection: "row",
      alignItems: "center",

      gap: 7,
    },

    trustHeaderIcon: {
      width: 32,
      height: 32,

      borderRadius: 11,

      backgroundColor:
        GOLD_SOFT,

      alignItems: "center",
      justifyContent: "center",
    },

    trustHeaderText: {
      color: BLACK,

      fontSize: 9,
      fontWeight: "900",

      letterSpacing: 1,
    },

    trustLine: {
      flexDirection: "row",
      alignItems: "flex-start",

      gap: 7,
    },

    trustText: {
      flex: 1,

      color: "#655F56",

      fontSize: 8.8,
      lineHeight: 13,

      fontWeight: "600",
    },

    /*
     * SUCCESS
     */

    successCard: {
      padding: 18,

      borderRadius: 23,

      backgroundColor:
        "#EFF8F1",

      borderWidth: 1,
      borderColor:
        "#C8E2CF",
    },

    successIcon: {
      width: 52,
      height: 52,

      borderRadius: 17,

      backgroundColor:
        "#DAEFE0",

      alignItems: "center",
      justifyContent: "center",
    },

    successTitle: {
      marginTop: 13,

      color: BLACK,

      fontSize: 18,
      lineHeight: 23,

      fontWeight: "900",
    },

    successDesc: {
      marginTop: 7,
      marginBottom: 15,

      color: "#526458",

      fontSize: 10,
      lineHeight: 16,

      fontWeight: "500",
    },
  });