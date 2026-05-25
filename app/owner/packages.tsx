import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  CalendarCheck,
  Check,
  Crown,
  Home,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  Store,
  Tag,
} from "lucide-react-native";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { supabase } from "../../lib/supabase";
import { OWNER_PACKAGES, type OwnerPackage } from "../../services/pricelist";

type Language = "en" | "id";

type UserRole = "owner" | "agent" | "developer" | "buyer" | "admin" | "unknown";

export default function OwnerPackagesScreen() {
  const router = useRouter();
  const isIOS = Platform.OS === "ios";

  const featuredOwnerPlanId =
    OWNER_PACKAGES.find((pkg) => pkg.id === "featured")?.id ||
    OWNER_PACKAGES[0]?.id ||
    "basic";

  const [language, setLanguage] = useState<Language>("en");
  const [selectedPlan, setSelectedPlan] = useState(featuredOwnerPlanId);
  const [checkingSession, setCheckingSession] = useState(true);
  const [userId, setUserId] = useState("");
  const [profileRole, setProfileRole] = useState<UserRole>("unknown");

  const isId = language === "id";

  const selectedPackage = useMemo(() => {
    return (
      OWNER_PACKAGES.find((pkg) => pkg.id === selectedPlan) ||
      OWNER_PACKAGES[0]
    );
  }, [selectedPlan]);

  const t = useMemo(
    () => ({
      back: isId ? "Kembali" : "Back",
      badge: "Owner Listing",
      title: isId
        ? "Iklankan, Sewakan, atau Jual Properti Anda di Tetamo"
        : "Advertise, Rent, or Sell Your Property on Tetamo",
      subtitle: isId
        ? "Marketplace properti yang fokus pada transparansi, listing serius, dan proses viewing yang lebih rapi."
        : "A property marketplace focused on transparency, serious listings, and a better viewing process.",
      chooseTitle: isId ? "Pilih Paket Anda" : "Choose Your Package",
      chooseSub: isId
        ? "Semua paket aktif selama 1 tahun dan sudah termasuk fitur utama Tetamo. Perbedaannya ada pada level visibilitas listing."
        : "All packages stay active for 1 year and include Tetamo’s core listing features. The difference is the listing visibility level.",
      selectedPackage: isId ? "Paket Terpilih" : "Selected Package",
      packageSummary: isId ? "Ringkasan Paket" : "Package Summary",
      package: isId ? "Paket" : "Package",
      price: isId ? "Harga" : "Price",
      duration: isId ? "Durasi" : "Duration",
      chooseThis: isId ? "Pilih Paket Ini" : "Choose This Package",
      listNow: isId ? "Lanjut Iklan" : "List Now",
      highest: isId ? "Tertinggi" : "Highest",
      readyTitle: isId
        ? "Siap Iklankan Properti Anda?"
        : "Ready to List Your Property?",
      readySub: isId
        ? "Buat listing yang rapi, transparan, dan lebih mudah ditemukan pembeli atau penyewa serius."
        : "Create a clean, transparent listing that serious buyers and renters can discover more easily.",
      startListing: isId ? "Mulai Listing" : "Start Listing",
      viewMarketplace: isId ? "Lihat Marketplace" : "View Marketplace",
      checking: isId ? "Memeriksa akun..." : "Checking account...",
      signUpFirst: isId ? "Sign up dulu" : "Sign up first",
      openingSearch: isId ? "Membuka Pencarian" : "Opening Search",
      redirectSearch: isId
        ? "Anda akan diarahkan ke pencarian properti."
        : "Redirecting you to property search.",
      searchProperties: isId ? "Cari Properti" : "Search Properties",
    }),
    [isId]
  );

  const benefits = useMemo(
    () => [
      {
        icon: <Store color="#e6c15c" size={22} />,
        title: isId ? "Tampil di Marketplace" : "Appear in the Marketplace",
        desc: isId
          ? "Properti Anda tampil di marketplace Tetamo dan lebih mudah ditemukan pembeli atau penyewa serius."
          : "Your property appears on Tetamo’s marketplace and is easier for serious buyers or renters to discover.",
      },
      {
        icon: <MessageCircle color="#22c55e" size={22} />,
        title: isId ? "Kontak Langsung WhatsApp" : "Direct WhatsApp Contact",
        desc: isId
          ? "Calon pembeli atau penyewa bisa langsung menghubungi Anda tanpa proses yang rumit."
          : "Buyers and renters can contact you directly without a complicated process.",
      },
      {
        icon: <CalendarCheck color="#60a5fa" size={22} />,
        title: isId
          ? "Jadwal Viewing Lebih Rapi"
          : "Better Viewing Scheduling",
        desc: isId
          ? "Proses viewing lebih rapi dan memudahkan calon buyer melihat properti Anda."
          : "Viewing is more organized and makes it easier for potential buyers to visit your property.",
      },
    ],
    [isId]
  );

  useEffect(() => {
    if (!isIOS) return;

    router.replace("/search" as any);
  }, [isIOS, router]);

  useEffect(() => {
    if (isIOS) {
      setCheckingSession(false);
      return;
    }

    let mounted = true;

    async function loadSession() {
      try {
        setCheckingSession(true);

        const { data } = await supabase.auth.getSession();
        const sessionUserId = data.session?.user?.id || "";

        if (!mounted) return;

        setUserId(sessionUserId);

        if (sessionUserId) {
          const { data: profile, error } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", sessionUserId)
            .maybeSingle();

          if (error) {
            console.log("Tetamo owner package profile error:", error.message);
          }

          if (mounted) {
            setProfileRole(normalizeRole(profile?.role));
          }
        } else {
          setProfileRole("unknown");
        }
      } catch (error) {
        console.log("Tetamo owner package session error:", error);
      } finally {
        if (mounted) setCheckingSession(false);
      }
    }

    loadSession();

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        const nextUserId = session?.user?.id || "";
        setUserId(nextUserId);

        if (!nextUserId) {
          setProfileRole("unknown");
          return;
        }

        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", nextUserId)
          .maybeSingle();

        setProfileRole(normalizeRole(profile?.role));
      }
    );

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, [isIOS]);

  const getPackageName = (pkg: OwnerPackage) => {
    return isId ? pkg.name : pkg.nameEn;
  };

  const getPackageFeatures = (pkg: OwnerPackage) => {
    return isId ? pkg.features : pkg.featuresEn;
  };

  const formatDurationLabel = (durationDays?: number) => {
    if (durationDays === 365) {
      return isId ? "1 tahun" : "1 year";
    }

    return `${durationDays || 0} ${isId ? "hari" : "days"}`;
  };

  const ownerPackageIntro = (packageId: string) => {
    if (packageId === "featured") {
      return isId
        ? "Pilihan terbaik untuk pemilik yang ingin listing tampil paling menonjol dengan visibilitas tertinggi."
        : "Best for owners who want the most prominent listing position with the highest visibility.";
    }

    if (packageId === "priority") {
      return isId
        ? "Pilihan untuk pemilik yang ingin visibilitas lebih tinggi dibanding Basic di marketplace Tetamo."
        : "For owners who want higher visibility than Basic inside the Tetamo marketplace.";
    }

    return isId
      ? "Pilihan sederhana untuk mulai memasang properti Anda di Tetamo dengan visibilitas basic."
      : "A simple option to start listing your property on Tetamo with basic visibility.";
  };

  const continueWithPlan = (planId: string) => {
    if (isIOS) {
      router.replace("/search" as any);
      return;
    }

    const nextPath = `/owner/create-listing?plan=${planId}`;

    if (!userId) {
      router.push(
        `/signup?role=owner&package=${planId}&next=${encodeURIComponent(
          nextPath
        )}` as any
      );
      return;
    }

    if (
      profileRole === "agent" ||
      profileRole === "developer" ||
      profileRole === "buyer"
    ) {
      router.push(`/add-listing?role=${profileRole}` as any);
      return;
    }

    router.push(nextPath as any);
  };

  if (isIOS) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="light" />

        <View style={styles.iosRedirectBox}>
          <ActivityIndicator color="#e6c15c" />

          <Text style={styles.iosRedirectTitle}>{t.openingSearch}</Text>

          <Text style={styles.iosRedirectText}>{t.redirectSearch}</Text>

          <Pressable
            style={styles.iosSearchButton}
            onPress={() => router.replace("/search" as any)}
          >
            <Text style={styles.iosSearchButtonText}>
              {t.searchProperties}
            </Text>
            <ArrowRight color="#111111" size={15} />
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topRow}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeft color="#ffffff" size={16} />
            <Text style={styles.backText}>{t.back}</Text>
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

        <View style={styles.heroPanel}>
          <View style={styles.eyebrowPill}>
            <Sparkles color="#e6c15c" size={13} />
            <Text style={styles.eyebrowText}>{t.badge}</Text>
          </View>

          <Text style={styles.title}>{t.title}</Text>
          <Text style={styles.subtitle}>{t.subtitle}</Text>

          {checkingSession ? (
            <View style={styles.checkingPill}>
              <ActivityIndicator color="#e6c15c" size="small" />
              <Text style={styles.checkingText}>{t.checking}</Text>
            </View>
          ) : !userId ? (
            <View style={styles.checkingPill}>
              <ShieldCheck color="#e6c15c" size={15} />
              <Text style={styles.checkingText}>{t.signUpFirst}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.benefitGrid}>
          {benefits.map((item) => (
            <BenefitCard
              key={item.title}
              icon={item.icon}
              title={item.title}
              desc={item.desc}
            />
          ))}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t.chooseTitle}</Text>
          <Text style={styles.sectionSub}>{t.chooseSub}</Text>
        </View>

        <View style={styles.packageList}>
          {OWNER_PACKAGES.map((pkg) => {
            const checked = selectedPlan === pkg.id;

            return (
              <OwnerPackageCard
                key={pkg.id}
                item={pkg}
                checked={checked}
                language={language}
                intro={ownerPackageIntro(pkg.id)}
                durationLabel={formatDurationLabel(pkg.durationDays)}
                highestLabel={t.highest}
                listNowLabel={t.listNow}
                onSelect={() => setSelectedPlan(pkg.id)}
                onContinue={() => continueWithPlan(pkg.id)}
              />
            );
          })}
        </View>

        {selectedPackage ? (
          <View style={styles.summaryPanel}>
            <View style={styles.summaryLeft}>
              <View style={styles.summaryBadge}>
                <Sparkles color="#e6c15c" size={13} />
                <Text style={styles.summaryBadgeText}>{t.selectedPackage}</Text>
              </View>

              <Text style={styles.summaryTitle}>
                {getPackageName(selectedPackage)}
              </Text>

              <Text style={styles.summaryDesc}>
                {ownerPackageIntro(selectedPackage.id)}
              </Text>

              <View style={styles.summaryChips}>
                {getPackageFeatures(selectedPackage)
                  .slice(0, 3)
                  .map((feature) => (
                    <View key={feature} style={styles.summaryChip}>
                      <Text style={styles.summaryChipText}>{feature}</Text>
                    </View>
                  ))}
              </View>
            </View>

            <View style={styles.summaryBox}>
              <Text style={styles.summaryBoxKicker}>{t.packageSummary}</Text>

              <SummaryRow
                label={t.package}
                value={getPackageName(selectedPackage)}
              />

              <SummaryRow
                label={t.price}
                value={formatIdr(selectedPackage.priceIdr)}
              />

              <SummaryRow
                label={t.duration}
                value={formatDurationLabel(selectedPackage.durationDays)}
                last
              />

              <Pressable
                style={styles.summaryButton}
                onPress={() => continueWithPlan(selectedPlan)}
              >
                <Text style={styles.summaryButtonText}>{t.chooseThis}</Text>
                <ArrowRight color="#111111" size={15} />
              </Pressable>
            </View>
          </View>
        ) : null}

        <View style={styles.readyPanel}>
          <Text style={styles.readyTitle}>{t.readyTitle}</Text>
          <Text style={styles.readySub}>{t.readySub}</Text>

          <View style={styles.readyButtonRow}>
            <Pressable
              style={styles.primaryButton}
              onPress={() => continueWithPlan(selectedPlan)}
            >
              <Text style={styles.primaryButtonText}>{t.startListing}</Text>
              <ArrowRight color="#111111" size={15} />
            </Pressable>

            <Pressable
              style={styles.secondaryButton}
              onPress={() => router.push("/property" as any)}
            >
              <Store color="#ffffff" size={16} />
              <Text style={styles.secondaryButtonText}>{t.viewMarketplace}</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function BenefitCard({
  icon,
  title,
  desc,
}: {
  icon: ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <View style={styles.benefitCard}>
      <View style={styles.benefitIcon}>{icon}</View>

      <View style={styles.benefitTextBox}>
        <Text style={styles.benefitTitle}>{title}</Text>
        <Text style={styles.benefitDesc}>{desc}</Text>
      </View>
    </View>
  );
}

function OwnerPackageCard({
  item,
  checked,
  language,
  intro,
  durationLabel,
  highestLabel,
  listNowLabel,
  onSelect,
  onContinue,
}: {
  item: OwnerPackage;
  checked: boolean;
  language: Language;
  intro: string;
  durationLabel: string;
  highestLabel: string;
  listNowLabel: string;
  onSelect: () => void;
  onContinue: () => void;
}) {
  const isId = language === "id";
  const isFeatured = item.id === "featured";
  const isPriority = item.id === "priority";
  const name = isId ? item.name : item.nameEn;
  const features = isId ? item.features : item.featuresEn;

  return (
    <Pressable
      style={[
        styles.packageCard,
        isFeatured && styles.packageCardFeatured,
        isPriority && styles.packageCardPriority,
        checked && styles.packageCardChecked,
        checked && isFeatured && styles.packageCardCheckedFeatured,
      ]}
      onPress={onSelect}
    >
      <View style={styles.packageTopRow}>
        <View style={styles.packageNameBox}>
          <View style={styles.packageTitleRow}>
            {isFeatured ? (
              <Crown color="#e6c15c" size={17} />
            ) : isPriority ? (
              <Sparkles color="#ffffff" size={17} />
            ) : (
              <Tag color="#b8b8b8" size={17} />
            )}

            <Text style={styles.packageName}>{name}</Text>
          </View>

          <Text style={styles.packageIntro}>{intro}</Text>
        </View>

        <View style={styles.packageRight}>
          <View
            style={[
              styles.selectCircle,
              checked && styles.selectCircleActive,
              checked && isFeatured && styles.selectCircleFeatured,
            ]}
          >
            {checked ? <View style={styles.selectDot} /> : null}
          </View>

          {isFeatured ? (
            <View style={styles.highestBadge}>
              <Text style={styles.highestBadgeText}>{highestLabel}</Text>
            </View>
          ) : null}
        </View>
      </View>

      <View style={styles.priceBlock}>
        <Text
          style={[styles.priceText, isFeatured && styles.priceTextFeatured]}
        >
          {formatIdr(item.priceIdr)}
        </Text>
        <Text style={styles.durationText}>/ {durationLabel}</Text>
      </View>

      <View style={styles.metaGrid}>
        <MetaPill
          icon={<Home color="#e6c15c" size={13} />}
          text={`${item.maxListings} Listing`}
        />

        <MetaPill
          icon={<ShieldCheck color="#e6c15c" size={13} />}
          text={durationLabel}
        />

        {item.hasDirectWhatsapp ? (
          <MetaPill
            icon={<MessageCircle color="#22c55e" size={13} />}
            text="WhatsApp"
          />
        ) : null}

        {item.hasScheduling ? (
          <MetaPill
            icon={<CalendarCheck color="#60a5fa" size={13} />}
            text="Viewing"
          />
        ) : null}

        {item.isFeatured ? (
          <MetaPill
            icon={<BadgeCheck color="#e6c15c" size={13} />}
            text="Featured"
          />
        ) : null}
      </View>

      <View style={styles.featureList}>
        {features.map((feature) => (
          <View key={feature} style={styles.featureRow}>
            <View
              style={[
                styles.featureCheck,
                isFeatured && styles.featureCheckFeatured,
              ]}
            >
              <Check
                color={isFeatured ? "#111111" : "#22c55e"}
                size={12}
              />
            </View>
            <Text style={styles.featureText}>{feature}</Text>
          </View>
        ))}
      </View>

      <Pressable
        style={[styles.cardButton, isFeatured && styles.cardButtonFeatured]}
        onPress={onContinue}
      >
        <Text style={styles.cardButtonText}>{listNowLabel}</Text>
        <ArrowRight color="#111111" size={15} />
      </Pressable>
    </Pressable>
  );
}

function MetaPill({ icon, text }: { icon: ReactNode; text: string }) {
  return (
    <View style={styles.metaPill}>
      {icon}
      <Text style={styles.metaText}>{text}</Text>
    </View>
  );
}

function SummaryRow({
  label,
  value,
  last = false,
}: {
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <View style={[styles.summaryRow, last && styles.summaryRowLast]}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue}>{value}</Text>
    </View>
  );
}

function normalizeRole(value: unknown): UserRole {
  const role = String(value || "").toLowerCase().trim();

  if (
    role === "owner" ||
    role === "pemilik" ||
    role === "landlord" ||
    role === "property_owner"
  ) {
    return "owner";
  }

  if (role === "agent" || role === "agen" || role === "broker") {
    return "agent";
  }

  if (role === "developer" || role === "pengembang") {
    return "developer";
  }

  if (
    role === "buyer" ||
    role === "renter" ||
    role === "tenant" ||
    role === "pembeli" ||
    role === "penyewa"
  ) {
    return "buyer";
  }

  if (role === "admin") return "admin";

  return "unknown";
}

function formatIdr(value: number) {
  return `Rp ${Math.round(value).toLocaleString("id-ID")}`;
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
  content: {
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 38,
  },
  iosRedirectBox: {
    flex: 1,
    backgroundColor: "#050505",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
    gap: 12,
  },
  iosRedirectTitle: {
    color: "#ffffff",
    fontSize: 22,
    fontWeight: "900",
    marginTop: 6,
  },
  iosRedirectText: {
    color: "#b8b8b8",
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 6,
  },
  iosSearchButton: {
    minHeight: 48,
    borderRadius: 17,
    backgroundColor: "#e6c15c",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingHorizontal: 16,
    marginTop: 4,
  },
  iosSearchButtonText: {
    color: "#111111",
    fontSize: 13,
    fontWeight: "900",
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
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
    fontSize: 10,
    fontWeight: "900",
  },
  langTextActive: {
    color: "#111111",
  },
  heroPanel: {
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "#303030",
    backgroundColor: "#101010",
    padding: 17,
    marginBottom: 15,
  },
  eyebrowPill: {
    alignSelf: "flex-start",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#705d2c",
    backgroundColor: "#211a0b",
    paddingHorizontal: 10,
    paddingVertical: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  eyebrowText: {
    color: "#e6c15c",
    fontSize: 9.5,
    fontWeight: "900",
    letterSpacing: 0.9,
    textTransform: "uppercase",
  },
  title: {
    color: "#ffffff",
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "900",
    letterSpacing: -0.6,
    marginTop: 13,
  },
  subtitle: {
    color: "#b8b8b8",
    fontSize: 12.6,
    lineHeight: 19,
    fontWeight: "700",
    marginTop: 8,
  },
  checkingPill: {
    alignSelf: "flex-start",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#705d2c",
    backgroundColor: "#050505",
    paddingHorizontal: 10,
    paddingVertical: 7,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginTop: 13,
  },
  checkingText: {
    color: "#ffffff",
    fontSize: 10.5,
    fontWeight: "800",
  },
  benefitGrid: {
    gap: 10,
    marginBottom: 21,
  },
  benefitCard: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#303030",
    backgroundColor: "#101010",
    padding: 13,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 11,
  },
  benefitIcon: {
    width: 44,
    height: 44,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#303030",
    backgroundColor: "#171717",
    alignItems: "center",
    justifyContent: "center",
  },
  benefitTextBox: {
    flex: 1,
  },
  benefitTitle: {
    color: "#ffffff",
    fontSize: 13.5,
    fontWeight: "900",
  },
  benefitDesc: {
    color: "#a9a9a9",
    fontSize: 11.2,
    lineHeight: 16,
    fontWeight: "700",
    marginTop: 3,
  },
  sectionHeader: {
    alignItems: "center",
    marginBottom: 13,
  },
  sectionTitle: {
    color: "#ffffff",
    fontSize: 22,
    fontWeight: "900",
    textAlign: "center",
  },
  sectionSub: {
    color: "#a9a9a9",
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "700",
    textAlign: "center",
    marginTop: 5,
  },
  packageList: {
    gap: 13,
    marginBottom: 17,
  },
  packageCard: {
    borderRadius: 26,
    borderWidth: 1,
    borderColor: "#303030",
    backgroundColor: "#101010",
    padding: 15,
  },
  packageCardPriority: {
    borderColor: "#3a3a3a",
  },
  packageCardFeatured: {
    borderColor: "#705d2c",
    backgroundColor: "#151208",
  },
  packageCardChecked: {
    borderColor: "#ffffff",
  },
  packageCardCheckedFeatured: {
    borderColor: "#e6c15c",
  },
  packageTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  packageNameBox: {
    flex: 1,
  },
  packageTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  packageName: {
    color: "#ffffff",
    fontSize: 20,
    fontWeight: "900",
    flex: 1,
  },
  packageIntro: {
    color: "#a9a9a9",
    fontSize: 11.5,
    lineHeight: 17,
    fontWeight: "700",
    marginTop: 7,
  },
  packageRight: {
    alignItems: "flex-end",
    gap: 8,
  },
  selectCircle: {
    width: 24,
    height: 24,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: "#5a5a5a",
    backgroundColor: "#050505",
    alignItems: "center",
    justifyContent: "center",
  },
  selectCircleActive: {
    borderColor: "#ffffff",
    backgroundColor: "#ffffff",
  },
  selectCircleFeatured: {
    borderColor: "#e6c15c",
    backgroundColor: "#e6c15c",
  },
  selectDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    backgroundColor: "#111111",
  },
  highestBadge: {
    borderRadius: 999,
    backgroundColor: "#e6c15c",
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  highestBadgeText: {
    color: "#111111",
    fontSize: 9.5,
    fontWeight: "900",
  },
  priceBlock: {
    marginTop: 15,
  },
  priceText: {
    color: "#ffffff",
    fontSize: 31,
    fontWeight: "900",
    letterSpacing: -0.7,
  },
  priceTextFeatured: {
    color: "#e6c15c",
  },
  durationText: {
    color: "#b8b8b8",
    fontSize: 12,
    fontWeight: "800",
    marginTop: 3,
  },
  metaGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 13,
  },
  metaPill: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#333333",
    backgroundColor: "#050505",
    paddingHorizontal: 8,
    paddingVertical: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  metaText: {
    color: "#ffffff",
    fontSize: 10,
    fontWeight: "800",
  },
  featureList: {
    gap: 8,
    marginTop: 14,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  featureCheck: {
    width: 19,
    height: 19,
    borderRadius: 999,
    backgroundColor: "#052e16",
    borderWidth: 1,
    borderColor: "#14532d",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  featureCheckFeatured: {
    backgroundColor: "#e6c15c",
    borderColor: "#e6c15c",
  },
  featureText: {
    color: "#d6d6d6",
    fontSize: 11.4,
    lineHeight: 17,
    fontWeight: "700",
    flex: 1,
  },
  cardButton: {
    alignSelf: "flex-start",
    minHeight: 43,
    borderRadius: 15,
    backgroundColor: "#ffffff",
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 13,
    marginTop: 16,
  },
  cardButtonFeatured: {
    backgroundColor: "#e6c15c",
  },
  cardButtonText: {
    color: "#111111",
    fontSize: 12.2,
    fontWeight: "900",
  },
  summaryPanel: {
    borderRadius: 26,
    borderWidth: 1,
    borderColor: "#303030",
    backgroundColor: "#101010",
    padding: 15,
    gap: 14,
    marginBottom: 17,
  },
  summaryLeft: {},
  summaryBadge: {
    alignSelf: "flex-start",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#705d2c",
    backgroundColor: "#211a0b",
    paddingHorizontal: 9,
    paddingVertical: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  summaryBadgeText: {
    color: "#e6c15c",
    fontSize: 9.5,
    fontWeight: "900",
    letterSpacing: 0.7,
    textTransform: "uppercase",
  },
  summaryTitle: {
    color: "#ffffff",
    fontSize: 20,
    fontWeight: "900",
    marginTop: 11,
  },
  summaryDesc: {
    color: "#a9a9a9",
    fontSize: 11.8,
    lineHeight: 17,
    fontWeight: "700",
    marginTop: 5,
  },
  summaryChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 11,
  },
  summaryChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#333333",
    backgroundColor: "#050505",
    paddingHorizontal: 9,
    paddingVertical: 6,
  },
  summaryChipText: {
    color: "#ffffff",
    fontSize: 10,
    fontWeight: "800",
  },
  summaryBox: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#303030",
    backgroundColor: "#050505",
    padding: 13,
  },
  summaryBoxKicker: {
    color: "#e6c15c",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginBottom: 5,
  },
  summaryRow: {
    borderBottomWidth: 1,
    borderBottomColor: "#202020",
    paddingVertical: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  summaryRowLast: {
    borderBottomWidth: 0,
  },
  summaryLabel: {
    color: "#a9a9a9",
    fontSize: 11.5,
    fontWeight: "700",
  },
  summaryValue: {
    color: "#ffffff",
    fontSize: 11.5,
    fontWeight: "900",
    textAlign: "right",
    flex: 1,
  },
  summaryButton: {
    minHeight: 44,
    borderRadius: 15,
    backgroundColor: "#e6c15c",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    marginTop: 10,
  },
  summaryButtonText: {
    color: "#111111",
    fontSize: 12.5,
    fontWeight: "900",
  },
  readyPanel: {
    borderRadius: 26,
    borderWidth: 1,
    borderColor: "#303030",
    backgroundColor: "#101010",
    padding: 16,
    alignItems: "center",
  },
  readyTitle: {
    color: "#ffffff",
    fontSize: 21,
    fontWeight: "900",
    textAlign: "center",
  },
  readySub: {
    color: "#a9a9a9",
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "700",
    textAlign: "center",
    marginTop: 6,
  },
  readyButtonRow: {
    gap: 9,
    width: "100%",
    marginTop: 15,
  },
  primaryButton: {
    minHeight: 47,
    borderRadius: 16,
    backgroundColor: "#e6c15c",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingHorizontal: 13,
  },
  primaryButtonText: {
    color: "#111111",
    fontSize: 12.5,
    fontWeight: "900",
  },
  secondaryButton: {
    minHeight: 47,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#343434",
    backgroundColor: "#050505",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    paddingHorizontal: 13,
  },
  secondaryButtonText: {
    color: "#ffffff",
    fontSize: 12.5,
    fontWeight: "900",
  },
});