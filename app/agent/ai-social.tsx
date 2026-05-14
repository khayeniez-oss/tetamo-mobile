import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
    ArrowLeft,
    Bot,
    ChevronRight,
    Globe2,
    Home,
    Languages,
    Megaphone,
    PackageCheck,
    RefreshCcw,
    Share2,
    Sparkles
} from "lucide-react-native";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Pressable,
    SafeAreaView,
    ScrollView,
    Share,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import { supabase } from "../../lib/supabase";

type UiLanguage = "en" | "id";

type Mode = "listing" | "manual" | "campaign";
type AiLanguage = "English" | "Indonesian" | "Bilingual";
type Platform =
  | "All platforms"
  | "Instagram / Facebook"
  | "TikTok / Reels"
  | "LinkedIn"
  | "Ads"
  | "WhatsApp Broadcast";

type Tone =
  | "Professional and friendly"
  | "Luxury"
  | "Direct sales"
  | "Investment-focused"
  | "Agent-focused"
  | "Owner-focused"
  | "Educational"
  | "Warm and conversational";

type ProfileRow = {
  id: string;
  full_name: string | null;
  role: string | null;
  phone: string | null;
  agency: string | null;
  email?: string | null;
};

type AgentMembershipRow = {
  id: string;
  status: string | null;
  expires_at: string | null;
  created_at: string | null;
};

type PropertyOption = {
  id: string;
  kode: string | null;
  title: string | null;
  price: number | null;
  city: string | null;
  area: string | null;
  province: string | null;
  listing_type: string | null;
  property_type: string | null;
  created_at: string | null;
};

type ManualProperty = {
  title: string;
  propertyType: string;
  listingType: string;
  rentalType: string;
  saleType: string;
  price: string;
  location: string;
  landSize: string;
  buildingSize: string;
  bedrooms: string;
  bathrooms: string;
  features: string;
  nearby: string;
  targetAudience: string;
  notes: string;
};

type CampaignInput = {
  campaignType: string;
  campaignGoal: string;
  targetAudience: string;
  keyMessage: string;
};

type AiSocialResult = {
  instagramFacebookCaption?: string;
  tiktokReelsCaption?: string;
  linkedinCaption?: string;
  shortReelScript?: string;
  adCopy?: {
    primaryText?: string;
    headline?: string;
    description?: string;
  };
  whatsappBroadcast?: string;
  ctaOptions?: string[];
  hashtags?: string[];
  contentNotes?: string;
};

const API_BASE_URL =
  process.env.EXPO_PUBLIC_TETAMO_API_BASE_URL || "https://www.tetamo.com";

const MODES: Array<{
  value: Mode;
  titleEn: string;
  titleId: string;
  textEn: string;
  textId: string;
}> = [
  {
    value: "listing",
    titleEn: "My Tetamo Listing",
    titleId: "Listing Tetamo Saya",
    textEn: "Use one of your own agent listings.",
    textId: "Gunakan salah satu listing agent Anda.",
  },
  {
    value: "manual",
    titleEn: "Manual Property",
    titleId: "Properti Manual",
    textEn: "Enter property details manually.",
    textId: "Masukkan detail properti secara manual.",
  },
  {
    value: "campaign",
    titleEn: "Agent Campaign",
    titleId: "Campaign Agent",
    textEn: "Create agent brand or inquiry content.",
    textId: "Buat konten branding dan inquiry agent.",
  },
];

const AI_LANGUAGES: AiLanguage[] = ["English", "Indonesian", "Bilingual"];

const PLATFORMS: Platform[] = [
  "All platforms",
  "Instagram / Facebook",
  "TikTok / Reels",
  "LinkedIn",
  "Ads",
  "WhatsApp Broadcast",
];

const TONES: Tone[] = [
  "Professional and friendly",
  "Luxury",
  "Direct sales",
  "Investment-focused",
  "Agent-focused",
  "Owner-focused",
  "Educational",
  "Warm and conversational",
];

const CAMPAIGN_TYPES = [
  "Promote my listings",
  "Introduce myself as an agent",
  "Invite buyers/renters to view properties",
  "Promote direct WhatsApp inquiries",
  "Promote schedule viewing",
  "Promote Tetamo listing exposure",
  "Promote investment property",
  "Promote rental property",
  "General agent brand awareness",
];

const DEFAULT_MANUAL_PROPERTY: ManualProperty = {
  title: "",
  propertyType: "",
  listingType: "For Rent",
  rentalType: "",
  saleType: "",
  price: "",
  location: "",
  landSize: "",
  buildingSize: "",
  bedrooms: "",
  bathrooms: "",
  features: "",
  nearby: "",
  targetAudience: "",
  notes: "",
};

const DEFAULT_CAMPAIGN: CampaignInput = {
  campaignType: "Promote my listings",
  campaignGoal: "",
  targetAudience: "",
  keyMessage: "",
};

function formatIdr(value?: number | null) {
  if (typeof value !== "number") return "-";

  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

function isMembershipActive(membership: AgentMembershipRow | null) {
  if (!membership) return false;
  if (membership.status !== "active") return false;

  if (!membership.expires_at) return true;

  const expiresAt = new Date(membership.expires_at);

  if (Number.isNaN(expiresAt.getTime())) return true;

  return expiresAt.getTime() >= Date.now();
}

function shortText(value?: string | null, length = 90) {
  const clean = String(value || "").trim();

  if (!clean) return "-";
  if (clean.length <= length) return clean;

  return `${clean.slice(0, length).trim()}...`;
}

function cleanText(value: unknown) {
  return String(value || "").trim();
}

function safeJoin(values?: string[]) {
  if (!values || values.length === 0) return "";
  return values.filter(Boolean).join("\n");
}

function normalizeHashtags(values?: string[]) {
  if (!values || values.length === 0) return "";

  return values
    .map((tag) => {
      const clean = String(tag || "").trim();
      if (!clean) return "";
      return clean.startsWith("#") ? clean : `#${clean}`;
    })
    .filter(Boolean)
    .join(" ");
}

export default function AgentAiSocialScreen() {
  const router = useRouter();

  const [uiLanguage, setUiLanguage] = useState<UiLanguage>("en");

  const [loading, setLoading] = useState(true);
  const [loadingProperties, setLoadingProperties] = useState(false);
  const [generating, setGenerating] = useState(false);

  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [memberships, setMemberships] = useState<AgentMembershipRow[]>([]);
  const [properties, setProperties] = useState<PropertyOption[]>([]);

  const [mode, setMode] = useState<Mode>("listing");
  const [aiLanguage, setAiLanguage] = useState<AiLanguage>("Bilingual");
  const [platform, setPlatform] = useState<Platform>("All platforms");
  const [tone, setTone] = useState<Tone>("Agent-focused");
  const [extraInstruction, setExtraInstruction] = useState("");

  const [selectedPropertyId, setSelectedPropertyId] = useState("");
  const [propertySearch, setPropertySearch] = useState("");

  const [manualProperty, setManualProperty] = useState<ManualProperty>(
    DEFAULT_MANUAL_PROPERTY
  );
  const [campaign, setCampaign] = useState<CampaignInput>(DEFAULT_CAMPAIGN);

  const [errorMessage, setErrorMessage] = useState("");
  const [result, setResult] = useState<AiSocialResult | null>(null);

  const isId = uiLanguage === "id";

  const role = String(profile?.role || "").toLowerCase();
  const isAgent = role === "agent";

  const activeMembership = useMemo(() => {
    return (
      memberships.find((membership) => isMembershipActive(membership)) || null
    );
  }, [memberships]);

  const hasActiveMembership = Boolean(activeMembership);

  const filteredProperties = useMemo(() => {
    const query = propertySearch.trim().toLowerCase();

    if (!query) return properties;

    return properties.filter((item) => {
      const searchable = `
        ${item.kode || ""}
        ${item.title || ""}
        ${item.city || ""}
        ${item.area || ""}
        ${item.province || ""}
        ${item.listing_type || ""}
        ${item.property_type || ""}
        ${formatIdr(item.price)}
      `.toLowerCase();

      return query
        .split(/\s+/)
        .filter(Boolean)
        .every((word) => searchable.includes(word));
    });
  }, [properties, propertySearch]);

  const selectedProperty = useMemo(() => {
    return properties.find((item) => item.id === selectedPropertyId) || null;
  }, [properties, selectedPropertyId]);

  const adCopyText = result?.adCopy
    ? [
        result.adCopy.primaryText
          ? `Primary Text:\n${result.adCopy.primaryText}`
          : "",
        result.adCopy.headline ? `Headline:\n${result.adCopy.headline}` : "",
        result.adCopy.description
          ? `Description:\n${result.adCopy.description}`
          : "",
      ]
        .filter(Boolean)
        .join("\n\n")
    : "";

  const ctaText = safeJoin(result?.ctaOptions);
  const hashtagText = normalizeHashtags(result?.hashtags);

  const allOutputText = useMemo(() => {
    if (!result) return "";

    return [
      result.instagramFacebookCaption
        ? `Instagram / Facebook:\n${result.instagramFacebookCaption}`
        : "",
      result.tiktokReelsCaption
        ? `TikTok / Reels:\n${result.tiktokReelsCaption}`
        : "",
      result.linkedinCaption ? `LinkedIn:\n${result.linkedinCaption}` : "",
      result.shortReelScript
        ? `Short Reel Script:\n${result.shortReelScript}`
        : "",
      adCopyText ? `Ad Copy:\n${adCopyText}` : "",
      result.whatsappBroadcast
        ? `WhatsApp Broadcast:\n${result.whatsappBroadcast}`
        : "",
      ctaText ? `CTA Options:\n${ctaText}` : "",
      hashtagText ? `Hashtags:\n${hashtagText}` : "",
      result.contentNotes ? `Content Notes:\n${result.contentNotes}` : "",
    ]
      .filter(Boolean)
      .join("\n\n---\n\n");
  }, [result, adCopyText, ctaText, hashtagText]);

  useEffect(() => {
    let ignore = false;

    async function loadAgentAccess() {
      setLoading(true);
      setErrorMessage("");

      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (ignore) return;

        if (userError || !user) {
          router.replace(
            `/login?role=agent&next=${encodeURIComponent(
              "/agent/ai-social"
            )}` as any
          );
          return;
        }

        const [
          { data: profileRow, error: profileError },
          { data: membershipRows, error: membershipError },
        ] = await Promise.all([
          supabase
            .from("profiles")
            .select("id, full_name, role, phone, agency, email")
            .eq("id", user.id)
            .maybeSingle(),

          supabase
            .from("agent_memberships")
            .select("id, status, expires_at, created_at")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false }),
        ]);

        if (ignore) return;

        if (profileError) throw profileError;
        if (membershipError) throw membershipError;

        setProfile((profileRow || null) as ProfileRow | null);
        setMemberships((membershipRows || []) as AgentMembershipRow[]);
        setLoading(false);
      } catch (error: any) {
        if (!ignore) {
          console.log("Tetamo mobile AI social access error:", error);
          setErrorMessage(
            error?.message ||
              (isId ? "Gagal memuat akses AI." : "Failed to load AI access.")
          );
          setLoading(false);
        }
      }
    }

    void loadAgentAccess();

    return () => {
      ignore = true;
    };
  }, [router, isId]);

  useEffect(() => {
    if (!profile || !isAgent || !hasActiveMembership) return;

    void loadProperties();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id, isAgent, hasActiveMembership]);

  async function getAccessToken() {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    return session?.access_token || "";
  }

  async function loadProperties() {
    if (!profile?.id) return;

    try {
      setLoadingProperties(true);
      setErrorMessage("");

      const { data, error } = await supabase
        .from("properties")
        .select(
          "id, kode, title, price, city, area, province, listing_type, property_type, created_at"
        )
        .eq("user_id", profile.id)
        .eq("source", "agent")
        .neq("status", "rejected")
        .order("created_at", { ascending: false })
        .limit(250);

      if (error) throw error;

      const rows = (data || []) as PropertyOption[];
      setProperties(rows);

      if (!selectedPropertyId && rows.length > 0) {
        setSelectedPropertyId(rows[0].id);
      }
    } catch (error: any) {
      console.log("Tetamo mobile AI social listing load error:", error);
      setErrorMessage(
        error?.message ||
          (isId
            ? "Gagal memuat listing agent."
            : "Failed to load agent listings.")
      );
      setProperties([]);
    } finally {
      setLoadingProperties(false);
    }
  }

  async function shareText(value: string) {
    const clean = cleanText(value);

    if (!clean) {
      Alert.alert(isId ? "Tidak ada konten." : "No content to share.");
      return;
    }

    try {
      await Share.share({ message: clean });
    } catch {
      Alert.alert(
        isId ? "Gagal membagikan konten." : "Failed to share content."
      );
    }
  }

  function updateManual<K extends keyof ManualProperty>(
    key: K,
    value: ManualProperty[K]
  ) {
    setManualProperty((prev) => ({
      ...prev,
      [key]: value,
    }));
  }

  function updateCampaign<K extends keyof CampaignInput>(
    key: K,
    value: CampaignInput[K]
  ) {
    setCampaign((prev) => ({
      ...prev,
      [key]: value,
    }));
  }

  async function generateContent() {
    try {
      setGenerating(true);
      setErrorMessage("");
      setResult(null);

      const token = await getAccessToken();

      if (!token) {
        router.replace(
          `/login?role=agent&next=${encodeURIComponent(
            "/agent/ai-social"
          )}` as any
        );
        return;
      }

      if (!isAgent) {
        setErrorMessage(
          isId
            ? "AI Social Media hanya tersedia untuk agent."
            : "AI Social Media is only available for agents."
        );
        return;
      }

      if (!hasActiveMembership) {
        setErrorMessage(
          isId
            ? "Membership agent aktif diperlukan untuk menggunakan AI Social Media."
            : "Active agent membership is required to use AI Social Media."
        );
        return;
      }

      if (mode === "listing" && !selectedPropertyId) {
        setErrorMessage(
          isId
            ? "Pilih salah satu listing Tetamo Anda terlebih dahulu."
            : "Please select one of your Tetamo listings first."
        );
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/agent/ai-social`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          mode,
          propertyId: mode === "listing" ? selectedPropertyId : undefined,
          manualProperty: mode === "manual" ? manualProperty : undefined,
          campaign: mode === "campaign" ? campaign : undefined,
          platform,
          language: aiLanguage,
          tone,
          extraInstruction,
        }),
      });

      const payload = await response.json();

      if (!response.ok || !payload.success) {
        throw new Error(
          payload?.error ||
            (isId
              ? "Gagal membuat konten AI."
              : "Failed to generate AI content.")
        );
      }

      setResult(payload.result as AiSocialResult);
    } catch (error: any) {
      console.log("Tetamo mobile AI social generate error:", error);
      setErrorMessage(
        error?.message ||
          (isId
            ? "Gagal membuat konten sosial media."
            : "Failed to generate social media content.")
      );
    } finally {
      setGenerating(false);
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="light" />

        <View style={styles.loadingBox}>
          <ActivityIndicator color="#e6c15c" />
          <Text style={styles.loadingText}>
            {isId ? "Memuat AI Social Media..." : "Loading AI Social Media..."}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!isAgent) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="light" />

        <LockedScreen
          title={isId ? "Khusus Agent" : "Agent Only"}
          text={
            isId
              ? "AI Social Media hanya tersedia untuk akun dengan role Agent."
              : "AI Social Media is only available for accounts with the Agent role."
          }
          buttonText={isId ? "Kembali ke Profile" : "Back to Profile"}
          onPress={() => router.push("/(tabs)/profile" as any)}
        />
      </SafeAreaView>
    );
  }

  if (!hasActiveMembership) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="light" />

        <LockedScreen
          title={
            isId ? "Membership Agent Diperlukan" : "Agent Membership Required"
          }
          text={
            isId
              ? "Aktifkan paket agent terlebih dahulu untuk menggunakan AI Social Media."
              : "Activate an agent package first to use AI Social Media."
          }
          buttonText={isId ? "Pilih Paket Agent" : "Choose Agent Package"}
          onPress={() => router.push("/agent/packages" as any)}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />

      <View style={styles.topBar}>
        <Pressable
          style={styles.backButton}
          onPress={() => router.push("/(tabs)/profile" as any)}
        >
          <ArrowLeft color="#ffffff" size={16} />
          <Text style={styles.backText}>{isId ? "Kembali" : "Back"}</Text>
        </Pressable>

        <View style={styles.langToggle}>
          <Languages color="#e6c15c" size={14} />

          {(["en", "id"] as UiLanguage[]).map((item) => (
            <Pressable
              key={item}
              style={[
                styles.langButton,
                uiLanguage === item && styles.langButtonActive,
              ]}
              onPress={() => setUiLanguage(item)}
            >
              <Text
                style={[
                  styles.langText,
                  uiLanguage === item && styles.langTextActive,
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
      >
        <View style={styles.heroCard}>
          <View style={styles.heroBadge}>
            <Bot color="#e6c15c" size={15} />
            <Text style={styles.heroBadgeText}>TETAMO AGENT AI</Text>
          </View>

          <Text style={styles.title}>AI Social Media Generator</Text>

          <Text style={styles.subtitle}>
            {isId
              ? "Buat caption, reel script, ad copy, WhatsApp broadcast, CTA, dan hashtag untuk listing agent dan campaign properti Anda."
              : "Generate captions, reel scripts, ad copy, WhatsApp broadcast, CTAs, and hashtags for your agent listings and property campaigns."}
          </Text>

          <View style={styles.heroStats}>
            <HeroStat
              icon={<Home color="#e6c15c" size={18} />}
              title={isId ? "Listing Agent" : "Agent Listings"}
              text={
                isId
                  ? "Gunakan listing Anda sendiri."
                  : "Use your own Tetamo listings."
              }
            />
            <HeroStat
              icon={<Megaphone color="#e6c15c" size={18} />}
              title="Campaign"
              text={
                isId
                  ? "Buat konten branding agent."
                  : "Create agent brand content."
              }
            />
            <HeroStat
              icon={<Globe2 color="#e6c15c" size={18} />}
              title="EN / ID"
              text={
                isId
                  ? "English, Indonesia, bilingual."
                  : "English, Indonesian, bilingual."
              }
            />
          </View>
        </View>

        {errorMessage ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorBannerText}>{errorMessage}</Text>
          </View>
        ) : null}

        <SectionCard
          title={isId ? "Sumber Konten" : "Content Source"}
          subtitle={
            isId
              ? "Pilih sumber konten yang ingin dibuat oleh AI."
              : "Choose what source AI should use for the content."
          }
        >
          <View style={styles.modeGrid}>
            {MODES.map((item) => {
              const active = mode === item.value;

              return (
                <Pressable
                  key={item.value}
                  style={[styles.modeButton, active && styles.modeButtonActive]}
                  onPress={() => {
                    setMode(item.value);
                    setResult(null);
                    setErrorMessage("");
                  }}
                >
                  <Text
                    style={[
                      styles.modeTitle,
                      active && styles.modeTitleActive,
                    ]}
                  >
                    {isId ? item.titleId : item.titleEn}
                  </Text>
                  <Text
                    style={[styles.modeText, active && styles.modeTextActive]}
                  >
                    {isId ? item.textId : item.textEn}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </SectionCard>

        <SectionCard
          title={isId ? "Pengaturan AI" : "Generation Settings"}
          subtitle={
            isId
              ? "Atur platform, bahasa, tone, dan arahan tambahan."
              : "Set platform, language, tone, and extra direction."
          }
        >
          <OptionGroup
            label="Platform"
            value={platform}
            options={PLATFORMS}
            onChange={(value) => setPlatform(value as Platform)}
          />

          <OptionGroup
            label={isId ? "Bahasa Output" : "Output Language"}
            value={aiLanguage}
            options={AI_LANGUAGES}
            onChange={(value) => setAiLanguage(value as AiLanguage)}
          />

          <OptionGroup
            label="Tone"
            value={tone}
            options={TONES}
            onChange={(value) => setTone(value as Tone)}
          />

          <Field
            label={isId ? "Arahan Tambahan" : "Extra Instruction"}
            value={extraInstruction}
            onChangeText={setExtraInstruction}
            placeholder={
              isId
                ? "Contoh: buat lebih premium, fokus lokasi, CTA viewing..."
                : "Example: make it more premium, focus on location, viewing CTA..."
            }
            multiline
            minHeight={86}
          />
        </SectionCard>

        {mode === "listing" ? (
          <SectionCard
            title={isId ? "Pilih Listing Anda" : "Select Your Listing"}
            subtitle={
              isId
                ? "AI akan menggunakan salah satu listing agent Anda."
                : "AI will use one of your own agent listings."
            }
            rightAction={
              <Pressable style={styles.refreshButton} onPress={loadProperties}>
                {loadingProperties ? (
                  <ActivityIndicator color="#e6c15c" size="small" />
                ) : (
                  <RefreshCcw color="#e6c15c" size={16} />
                )}
              </Pressable>
            }
          >
            <Field
              label={isId ? "Cari Listing" : "Search Listing"}
              value={propertySearch}
              onChangeText={setPropertySearch}
              placeholder={
                isId
                  ? "Cari kode, judul, kota, tipe..."
                  : "Search code, title, city, type..."
              }
            />

            {loadingProperties ? (
              <View style={styles.smallLoadingBox}>
                <ActivityIndicator color="#e6c15c" />
                <Text style={styles.smallLoadingText}>
                  {isId ? "Memuat listing..." : "Loading listings..."}
                </Text>
              </View>
            ) : filteredProperties.length === 0 ? (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyTitle}>
                  {isId ? "Listing tidak ditemukan" : "No listings found"}
                </Text>
                <Text style={styles.emptyText}>
                  {isId
                    ? "Buat listing agent terlebih dahulu atau gunakan mode Manual Property."
                    : "Create an agent listing first or use Manual Property mode."}
                </Text>
              </View>
            ) : (
              <View style={styles.propertyList}>
                {filteredProperties.map((item) => {
                  const active = selectedPropertyId === item.id;

                  return (
                    <Pressable
                      key={item.id}
                      style={[
                        styles.propertyCard,
                        active && styles.propertyCardActive,
                      ]}
                      onPress={() => setSelectedPropertyId(item.id)}
                    >
                      <View style={styles.propertyTop}>
                        <Text
                          style={[
                            styles.propertyTitle,
                            active && styles.propertyTitleActive,
                          ]}
                          numberOfLines={2}
                        >
                          {item.title || "Untitled Listing"}
                        </Text>

                        {active ? (
                          <View style={styles.selectedPill}>
                            <Text style={styles.selectedPillText}>
                              {isId ? "Dipilih" : "Selected"}
                            </Text>
                          </View>
                        ) : null}
                      </View>

                      <Text
                        style={[
                          styles.propertyMeta,
                          active && styles.propertyMetaActive,
                        ]}
                        numberOfLines={1}
                      >
                        {item.kode || "-"} •{" "}
                        {item.city || item.area || item.province || "-"} •{" "}
                        {item.property_type || "-"}
                      </Text>

                      <Text
                        style={[
                          styles.propertyPrice,
                          active && styles.propertyPriceActive,
                        ]}
                      >
                        {formatIdr(item.price)}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            )}

            {selectedProperty ? (
              <View style={styles.selectedBox}>
                <Text style={styles.selectedBoxText}>
                  {isId ? "Terpilih:" : "Selected:"}{" "}
                  {shortText(selectedProperty.title, 120)}
                </Text>
              </View>
            ) : null}
          </SectionCard>
        ) : null}

        {mode === "manual" ? (
          <SectionCard
            title={isId ? "Detail Properti Manual" : "Manual Property Details"}
            subtitle={
              isId
                ? "Gunakan ini jika properti belum ada di listing Tetamo."
                : "Use this when the property is not listed in Tetamo yet."
            }
          >
            <Field
              label={isId ? "Judul Properti" : "Property Title"}
              value={manualProperty.title}
              onChangeText={(value) => updateManual("title", value)}
              placeholder="Modern Villa for Yearly Rent in Canggu"
            />

            <View style={styles.twoCol}>
              <Field
                label={isId ? "Tipe Properti" : "Property Type"}
                value={manualProperty.propertyType}
                onChangeText={(value) => updateManual("propertyType", value)}
                placeholder="Villa, house, land..."
              />
              <Field
                label={isId ? "Harga" : "Price"}
                value={manualProperty.price}
                onChangeText={(value) => updateManual("price", value)}
                placeholder="Rp 350.000.000 / year"
              />
            </View>

            <View style={styles.twoCol}>
              <Field
                label={isId ? "Tipe Iklan" : "Listing Type"}
                value={manualProperty.listingType}
                onChangeText={(value) => updateManual("listingType", value)}
                placeholder="For Rent / For Sale"
              />
              <Field
                label={isId ? "Lokasi" : "Location"}
                value={manualProperty.location}
                onChangeText={(value) => updateManual("location", value)}
                placeholder="Canggu, Bali"
              />
            </View>

            <View style={styles.twoCol}>
              <Field
                label={isId ? "Jenis Sewa" : "Rental Type"}
                value={manualProperty.rentalType}
                onChangeText={(value) => updateManual("rentalType", value)}
                placeholder="Daily / Monthly / Yearly"
              />
              <Field
                label={isId ? "Status Jual" : "Sale Type"}
                value={manualProperty.saleType}
                onChangeText={(value) => updateManual("saleType", value)}
                placeholder="Freehold / Leasehold / HGB"
              />
            </View>

            <View style={styles.twoCol}>
              <Field
                label={isId ? "Luas Tanah" : "Land Size"}
                value={manualProperty.landSize}
                onChangeText={(value) => updateManual("landSize", value)}
                placeholder="3 are / 300 m²"
              />
              <Field
                label={isId ? "Luas Bangunan" : "Building Size"}
                value={manualProperty.buildingSize}
                onChangeText={(value) => updateManual("buildingSize", value)}
                placeholder="180 m²"
              />
            </View>

            <View style={styles.twoCol}>
              <Field
                label={isId ? "Kamar Tidur" : "Bedrooms"}
                value={manualProperty.bedrooms}
                onChangeText={(value) => updateManual("bedrooms", value)}
                placeholder="3"
              />
              <Field
                label={isId ? "Kamar Mandi" : "Bathrooms"}
                value={manualProperty.bathrooms}
                onChangeText={(value) => updateManual("bathrooms", value)}
                placeholder="3"
              />
            </View>

            <Field
              label={isId ? "Target Audience" : "Target Audience"}
              value={manualProperty.targetAudience}
              onChangeText={(value) => updateManual("targetAudience", value)}
              placeholder={
                isId
                  ? "Expat, keluarga, investor, renter..."
                  : "Expats, families, investors, renters..."
              }
            />

            <Field
              label={isId ? "Fitur Utama" : "Key Features"}
              value={manualProperty.features}
              onChangeText={(value) => updateManual("features", value)}
              placeholder="Pool, enclosed living, parking, garden..."
              multiline
              minHeight={86}
            />

            <Field
              label={isId ? "Nearby / Lifestyle" : "Nearby / Lifestyle"}
              value={manualProperty.nearby}
              onChangeText={(value) => updateManual("nearby", value)}
              placeholder={
                isId
                  ? "Dekat pantai, cafe, sekolah internasional..."
                  : "Near beach, cafes, international school..."
              }
              multiline
              minHeight={86}
            />

            <Field
              label={isId ? "Catatan Tambahan" : "Additional Notes"}
              value={manualProperty.notes}
              onChangeText={(value) => updateManual("notes", value)}
              placeholder={
                isId
                  ? "Selling point khusus atau arahan CTA..."
                  : "Special selling point or CTA direction..."
              }
              multiline
              minHeight={86}
            />
          </SectionCard>
        ) : null}

        {mode === "campaign" ? (
          <SectionCard
            title={isId ? "Detail Campaign Agent" : "Agent Campaign Details"}
            subtitle={
              isId
                ? "Buat konten untuk branding agent, promosi listing, viewing, dan inquiry."
                : "Create content for agent branding, listing promotion, viewings, and inquiries."
            }
          >
            <OptionGroup
              label={isId ? "Tipe Campaign" : "Campaign Type"}
              value={campaign.campaignType}
              options={CAMPAIGN_TYPES}
              onChange={(value) => updateCampaign("campaignType", value)}
            />

            <Field
              label={isId ? "Target Audience" : "Target Audience"}
              value={campaign.targetAudience}
              onChangeText={(value) => updateCampaign("targetAudience", value)}
              placeholder="Buyers, renters, investors, owners..."
            />

            <Field
              label={isId ? "Tujuan Campaign" : "Campaign Goal"}
              value={campaign.campaignGoal}
              onChangeText={(value) => updateCampaign("campaignGoal", value)}
              placeholder={
                isId
                  ? "Contoh: mengajak renter jadwal viewing villa di Bali."
                  : "Example: invite renters to schedule viewing for villas in Bali."
              }
              multiline
              minHeight={90}
            />

            <Field
              label={isId ? "Pesan Utama" : "Key Message"}
              value={campaign.keyMessage}
              onChangeText={(value) => updateCampaign("keyMessage", value)}
              placeholder={
                isId
                  ? "Contoh: Saya membantu buyer/renter menemukan properti lebih jelas melalui Tetamo."
                  : "Example: I help buyers/renters find clearer property options through Tetamo."
              }
              multiline
              minHeight={90}
            />
          </SectionCard>
        ) : null}

        <Pressable
          style={[
            styles.generateButton,
            (generating || loading) && styles.generateButtonDisabled,
          ]}
          disabled={generating || loading}
          onPress={generateContent}
        >
          {generating ? (
            <ActivityIndicator color="#111111" size="small" />
          ) : (
            <Sparkles color="#111111" size={18} />
          )}
          <Text style={styles.generateButtonText}>
            {generating
              ? isId
                ? "Membuat konten..."
                : "Generating..."
              : isId
              ? "Generate Konten Social Media"
              : "Generate Social Media Content"}
          </Text>
        </Pressable>

        <SectionCard
          title={isId ? "Hasil Konten" : "Generated Output"}
          subtitle={
            isId
              ? "Bagikan konten ke notes, WhatsApp, atau social media untuk copy/paste."
              : "Share content to notes, WhatsApp, or social media for copy/paste."
          }
          rightAction={
            result ? (
              <Pressable
                style={styles.copyAllButton}
                onPress={() => shareText(allOutputText)}
              >
                <Share2 color="#111111" size={15} />
                <Text style={styles.copyAllText}>
                  {isId ? "Share Semua" : "Share All"}
                </Text>
              </Pressable>
            ) : null
          }
        >
          {!result ? (
            <View style={styles.outputEmpty}>
              <Sparkles color="#777777" size={30} />
              <Text style={styles.outputEmptyTitle}>
                {isId ? "Belum ada konten" : "No content generated yet"}
              </Text>
              <Text style={styles.outputEmptyText}>
                {isId
                  ? "Pilih sumber konten dan tekan tombol generate."
                  : "Choose a source and press generate."}
              </Text>
            </View>
          ) : (
            <View style={styles.outputList}>
              <OutputCard
                title="Instagram / Facebook Caption"
                value={result.instagramFacebookCaption}
                onShare={shareText}
              />
              <OutputCard
                title="TikTok / Reels Caption"
                value={result.tiktokReelsCaption}
                onShare={shareText}
              />
              <OutputCard
                title="LinkedIn Caption"
                value={result.linkedinCaption}
                onShare={shareText}
              />
              <OutputCard
                title="Short Reel Script"
                value={result.shortReelScript}
                onShare={shareText}
              />
              <OutputCard
                title="Ad Copy"
                value={adCopyText}
                onShare={shareText}
              />
              <OutputCard
                title="WhatsApp Broadcast"
                value={result.whatsappBroadcast}
                onShare={shareText}
              />
              <OutputCard
                title="CTA Options"
                value={ctaText}
                onShare={shareText}
              />
              <OutputCard
                title="Hashtags"
                value={hashtagText}
                onShare={shareText}
              />
              <OutputCard
                title="Content Notes"
                value={result.contentNotes}
                onShare={shareText}
              />
            </View>
          )}
        </SectionCard>
      </ScrollView>
    </SafeAreaView>
  );
}

function LockedScreen({
  title,
  text,
  buttonText,
  onPress,
}: {
  title: string;
  text: string;
  buttonText: string;
  onPress: () => void;
}) {
  return (
    <View style={styles.lockedWrapper}>
      <View style={styles.lockedCard}>
        <View style={styles.lockedIcon}>
          <PackageCheck color="#e6c15c" size={32} />
        </View>

        <Text style={styles.lockedTitle}>{title}</Text>
        <Text style={styles.lockedText}>{text}</Text>

        <Pressable style={styles.lockedButton} onPress={onPress}>
          <Text style={styles.lockedButtonText}>{buttonText}</Text>
          <ChevronRight color="#111111" size={16} />
        </Pressable>
      </View>
    </View>
  );
}

function HeroStat({
  icon,
  title,
  text,
}: {
  icon: ReactNode;
  title: string;
  text: string;
}) {
  return (
    <View style={styles.heroStat}>
      <View style={styles.heroStatIcon}>{icon}</View>
      <Text style={styles.heroStatTitle}>{title}</Text>
      <Text style={styles.heroStatText}>{text}</Text>
    </View>
  );
}

function SectionCard({
  title,
  subtitle,
  children,
  rightAction,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  rightAction?: ReactNode;
}) {
  return (
    <View style={styles.sectionCard}>
      <View style={styles.sectionTop}>
        <View style={styles.sectionTextBox}>
          <Text style={styles.sectionTitle}>{title}</Text>
          {subtitle ? <Text style={styles.sectionSubtitle}>{subtitle}</Text> : null}
        </View>

        {rightAction ? <View>{rightAction}</View> : null}
      </View>

      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
}

function OptionGroup({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <View style={styles.optionGroup}>
      <Text style={styles.fieldLabel}>{label}</Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.optionScroll}
      >
        {options.map((item) => {
          const active = item === value;

          return (
            <Pressable
              key={item}
              style={[styles.optionPill, active && styles.optionPillActive]}
              onPress={() => onChange(item)}
            >
              <Text
                style={[
                  styles.optionPillText,
                  active && styles.optionPillTextActive,
                ]}
              >
                {item}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  multiline,
  minHeight,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  multiline?: boolean;
  minHeight?: number;
}) {
  return (
    <View style={styles.fieldBox}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#777777"
        multiline={multiline}
        textAlignVertical={multiline ? "top" : "center"}
        style={[
          styles.input,
          multiline && styles.inputMultiline,
          minHeight ? { minHeight } : null,
        ]}
      />
    </View>
  );
}

function OutputCard({
  title,
  value,
  onShare,
}: {
  title: string;
  value?: string;
  onShare: (value: string) => void;
}) {
  const clean = cleanText(value);

  if (!clean) return null;

  return (
    <View style={styles.outputCard}>
      <View style={styles.outputTop}>
        <Text style={styles.outputTitle}>{title}</Text>

        <Pressable style={styles.shareButton} onPress={() => onShare(clean)}>
          <Share2 color="#111111" size={14} />
          <Text style={styles.shareButtonText}>Share</Text>
        </Pressable>
      </View>

      <Text style={styles.outputText}>{clean}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#050505",
  },
  scroll: {
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
    paddingHorizontal: 9,
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
  content: {
    paddingHorizontal: 18,
    paddingBottom: 38,
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
  heroCard: {
    borderRadius: 30,
    borderWidth: 1,
    borderColor: "#303030",
    backgroundColor: "#101010",
    padding: 17,
    marginBottom: 14,
  },
  heroBadge: {
    alignSelf: "flex-start",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#705d2c",
    backgroundColor: "#211a0b",
    paddingHorizontal: 10,
    paddingVertical: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  heroBadgeText: {
    color: "#e6c15c",
    fontSize: 9.2,
    fontWeight: "900",
    letterSpacing: 0.9,
  },
  title: {
    color: "#ffffff",
    fontSize: 25,
    lineHeight: 31,
    fontWeight: "900",
    letterSpacing: -0.6,
    marginTop: 13,
  },
  subtitle: {
    color: "#b8b8b8",
    fontSize: 12.1,
    lineHeight: 18,
    fontWeight: "700",
    marginTop: 7,
  },
  heroStats: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 15,
  },
  heroStat: {
    width: "31.8%",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#252525",
    backgroundColor: "#050505",
    padding: 10,
  },
  heroStatIcon: {
    width: 34,
    height: 34,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#303030",
    alignItems: "center",
    justifyContent: "center",
  },
  heroStatTitle: {
    color: "#ffffff",
    fontSize: 10.5,
    fontWeight: "900",
    marginTop: 8,
  },
  heroStatText: {
    color: "#8f8f8f",
    fontSize: 9.2,
    lineHeight: 13,
    fontWeight: "700",
    marginTop: 3,
  },
  errorBanner: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#7f1d1d",
    backgroundColor: "#2a0d0d",
    padding: 12,
    marginBottom: 12,
  },
  errorBannerText: {
    color: "#fecaca",
    fontSize: 11.5,
    lineHeight: 16,
    fontWeight: "700",
  },
  sectionCard: {
    borderRadius: 26,
    borderWidth: 1,
    borderColor: "#303030",
    backgroundColor: "#101010",
    padding: 14,
    marginBottom: 14,
  },
  sectionTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },
  sectionTextBox: {
    flex: 1,
  },
  sectionTitle: {
    color: "#ffffff",
    fontSize: 15.5,
    fontWeight: "900",
  },
  sectionSubtitle: {
    color: "#9b9b9b",
    fontSize: 11.3,
    lineHeight: 16,
    fontWeight: "700",
    marginTop: 4,
  },
  sectionBody: {
    marginTop: 14,
    gap: 12,
  },
  modeGrid: {
    gap: 9,
  },
  modeButton: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#303030",
    backgroundColor: "#050505",
    padding: 13,
  },
  modeButtonActive: {
    borderColor: "#705d2c",
    backgroundColor: "#211a0b",
  },
  modeTitle: {
    color: "#ffffff",
    fontSize: 12.5,
    fontWeight: "900",
  },
  modeTitleActive: {
    color: "#e6c15c",
  },
  modeText: {
    color: "#8f8f8f",
    fontSize: 10.5,
    lineHeight: 15,
    fontWeight: "700",
    marginTop: 4,
  },
  modeTextActive: {
    color: "#d6d6d6",
  },
  optionGroup: {
    gap: 7,
  },
  optionScroll: {
    gap: 8,
    paddingRight: 8,
  },
  optionPill: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#303030",
    backgroundColor: "#050505",
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  optionPillActive: {
    borderColor: "#e6c15c",
    backgroundColor: "#e6c15c",
  },
  optionPillText: {
    color: "#d6d6d6",
    fontSize: 10.5,
    fontWeight: "900",
  },
  optionPillTextActive: {
    color: "#111111",
  },
  fieldBox: {
    gap: 7,
  },
  fieldLabel: {
    color: "#777777",
    fontSize: 9.8,
    fontWeight: "900",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  input: {
    minHeight: 46,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: "#303030",
    backgroundColor: "#050505",
    paddingHorizontal: 13,
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "800",
  },
  inputMultiline: {
    paddingTop: 12,
    paddingBottom: 12,
    lineHeight: 18,
  },
  refreshButton: {
    width: 42,
    height: 42,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#303030",
    backgroundColor: "#050505",
    alignItems: "center",
    justifyContent: "center",
  },
  smallLoadingBox: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#303030",
    backgroundColor: "#050505",
    padding: 18,
    alignItems: "center",
    gap: 8,
  },
  smallLoadingText: {
    color: "#d6d6d6",
    fontSize: 11.5,
    fontWeight: "800",
  },
  emptyBox: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#303030",
    backgroundColor: "#050505",
    padding: 18,
    alignItems: "center",
  },
  emptyTitle: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "900",
  },
  emptyText: {
    color: "#9b9b9b",
    fontSize: 11,
    lineHeight: 16,
    fontWeight: "700",
    textAlign: "center",
    marginTop: 5,
  },
  propertyList: {
    gap: 9,
  },
  propertyCard: {
    borderRadius: 19,
    borderWidth: 1,
    borderColor: "#303030",
    backgroundColor: "#050505",
    padding: 13,
  },
  propertyCardActive: {
    borderColor: "#705d2c",
    backgroundColor: "#211a0b",
  },
  propertyTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 8,
  },
  propertyTitle: {
    flex: 1,
    color: "#ffffff",
    fontSize: 12.5,
    lineHeight: 17,
    fontWeight: "900",
  },
  propertyTitleActive: {
    color: "#ffffff",
  },
  selectedPill: {
    borderRadius: 999,
    backgroundColor: "#e6c15c",
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  selectedPillText: {
    color: "#111111",
    fontSize: 8.8,
    fontWeight: "900",
  },
  propertyMeta: {
    color: "#8f8f8f",
    fontSize: 10.2,
    fontWeight: "700",
    marginTop: 5,
  },
  propertyMetaActive: {
    color: "#d6d6d6",
  },
  propertyPrice: {
    color: "#e6c15c",
    fontSize: 12,
    fontWeight: "900",
    marginTop: 7,
  },
  propertyPriceActive: {
    color: "#e6c15c",
  },
  selectedBox: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#14532d",
    backgroundColor: "#052e16",
    padding: 11,
  },
  selectedBoxText: {
    color: "#bbf7d0",
    fontSize: 11,
    lineHeight: 16,
    fontWeight: "800",
  },
  twoCol: {
    gap: 12,
  },
  generateButton: {
    minHeight: 52,
    borderRadius: 18,
    backgroundColor: "#e6c15c",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginBottom: 14,
  },
  generateButtonDisabled: {
    opacity: 0.65,
  },
  generateButtonText: {
    color: "#111111",
    fontSize: 13,
    fontWeight: "900",
  },
  copyAllButton: {
    borderRadius: 999,
    backgroundColor: "#e6c15c",
    paddingHorizontal: 11,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  copyAllText: {
    color: "#111111",
    fontSize: 10.5,
    fontWeight: "900",
  },
  outputEmpty: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#303030",
    backgroundColor: "#050505",
    padding: 24,
    alignItems: "center",
  },
  outputEmptyTitle: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "900",
    marginTop: 10,
  },
  outputEmptyText: {
    color: "#9b9b9b",
    fontSize: 11.5,
    fontWeight: "700",
    marginTop: 4,
    textAlign: "center",
  },
  outputList: {
    gap: 12,
  },
  outputCard: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#303030",
    backgroundColor: "#050505",
    padding: 13,
  },
  outputTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  outputTitle: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "900",
    flex: 1,
  },
  shareButton: {
    borderRadius: 999,
    backgroundColor: "#e6c15c",
    paddingHorizontal: 10,
    paddingVertical: 7,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  shareButtonText: {
    color: "#111111",
    fontSize: 10,
    fontWeight: "900",
  },
  outputText: {
    color: "#d6d6d6",
    fontSize: 11.5,
    lineHeight: 18,
    fontWeight: "700",
    marginTop: 10,
  },
  lockedWrapper: {
    flex: 1,
    padding: 18,
    justifyContent: "center",
  },
  lockedCard: {
    borderRadius: 30,
    borderWidth: 1,
    borderColor: "#303030",
    backgroundColor: "#101010",
    padding: 22,
    alignItems: "center",
  },
  lockedIcon: {
    width: 76,
    height: 76,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#705d2c",
    backgroundColor: "#211a0b",
    alignItems: "center",
    justifyContent: "center",
  },
  lockedTitle: {
    color: "#ffffff",
    fontSize: 23,
    lineHeight: 29,
    fontWeight: "900",
    textAlign: "center",
    marginTop: 16,
  },
  lockedText: {
    color: "#b8b8b8",
    fontSize: 12.5,
    lineHeight: 19,
    fontWeight: "700",
    textAlign: "center",
    marginTop: 8,
  },
  lockedButton: {
    minHeight: 50,
    borderRadius: 17,
    backgroundColor: "#e6c15c",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    paddingHorizontal: 16,
    marginTop: 20,
  },
  lockedButtonText: {
    color: "#111111",
    fontSize: 13,
    fontWeight: "900",
  },
});