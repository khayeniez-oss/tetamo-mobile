import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
    ArrowLeft,
    BadgeCheck,
    BookOpen,
    Building2,
    Check,
    ChevronRight,
    Crown,
    Home,
    Megaphone,
    ShieldCheck,
    Sparkles,
    Star,
    UserRound,
    Zap,
} from "lucide-react-native";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import {
    Pressable,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import {
    ADD_ON_PRODUCTS,
    AGENT_PACKAGES,
    EDUCATION_PRODUCTS,
    OWNER_PACKAGES,
    type AddOnProduct,
    type AgentPackage,
    type EducationProduct,
    type OwnerPackage,
} from "../services/pricelist";

type Language = "en" | "id";

export default function PricelistScreen() {
  const router = useRouter();
  const [language, setLanguage] = useState<Language>("en");

  const isId = language === "id";

  const t = useMemo(
    () => ({
      back: isId ? "Kembali" : "Back",
      eyebrow: isId ? "TETAMO PRICELIST" : "TETAMO PRICELIST",
      title: isId ? "Paket Harga TETAMO" : "TETAMO Price List",
      subtitle: isId
        ? "Lihat paket untuk owner, agent, add-on listing, dan edukasi TETAMO."
        : "View TETAMO packages for owners, agents, listing add-ons, and education.",
      ownerTitle: isId ? "Paket Owner" : "Owner Packages",
      ownerSub: isId
        ? "Untuk pemilik properti yang ingin listing langsung di TETAMO."
        : "For property owners who want to list directly on TETAMO.",
      agentTitle: isId ? "Paket Agent" : "Agent Packages",
      agentSub: isId
        ? "Untuk agent yang ingin mengelola listing, leads, viewing, dan dashboard."
        : "For agents who want listings, leads, viewing, and dashboard access.",
      addOnTitle: isId ? "Add-on Listing" : "Listing Add-ons",
      addOnSub: isId
        ? "Boost dan spotlight untuk meningkatkan exposure listing."
        : "Boost and spotlight products to increase listing exposure.",
      educationTitle: isId ? "Edukasi" : "Education",
      educationSub: isId
        ? "Akses video edukasi TETAMO untuk owner dan non-member agent."
        : "Access TETAMO education videos for owners and non-member agents.",
      chooseOwner: isId ? "Pilih Paket Owner" : "Choose Owner Package",
      chooseAgent: isId ? "Pilih Paket Agent" : "Choose Agent Package",
      viewOnly: isId ? "Lihat Detail" : "View Details",
      duration: isId ? "Durasi" : "Duration",
      days: isId ? "hari" : "days",
      year: isId ? "1 tahun" : "1 year",
      listings: isId ? "listing aktif" : "active listings",
      featured: isId ? "Unggulan" : "Featured",
      yearly: isId ? "Tahunan" : "Yearly",
      monthlyAvailable: isId ? "Bulanan tersedia" : "Monthly available",
      from: isId ? "Mulai dari" : "From",
      ownerCta: isId ? "Mulai Listing" : "Start Listing",
      agentCta: isId ? "Mulai sebagai Agent" : "Start as Agent",
    }),
    [isId]
  );

  const goOwner = (packageId: string) => {
    router.push(`/signup?role=owner&package=${packageId}` as any);
  };

  const goAgent = (packageId: string) => {
    router.push(`/signup?role=agent&package=${packageId}` as any);
  };

  const goDeveloper = () => {
    router.push("/developer/packages" as any);
  };

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
            <Text style={styles.eyebrowText}>{t.eyebrow}</Text>
          </View>

          <Text style={styles.title}>{t.title}</Text>
          <Text style={styles.subtitle}>{t.subtitle}</Text>

          <View style={styles.heroChips}>
            <MiniChip icon={<Home color="#ffffff" size={11} />} label="Owner" />
            <MiniChip icon={<UserRound color="#ffffff" size={11} />} label="Agent" />
            <MiniChip icon={<Zap color="#ffffff" size={11} />} label="Add-ons" />
            <MiniChip icon={<BookOpen color="#ffffff" size={11} />} label="Education" />
          </View>
        </View>

        <PackageSection
          icon={<Home color="#e6c15c" size={21} />}
          title={t.ownerTitle}
          subtitle={t.ownerSub}
        >
          {OWNER_PACKAGES.map((item) => (
            <OwnerPackageCard
              key={item.id}
              item={item}
              language={language}
              chooseText={t.chooseOwner}
              onChoose={() => goOwner(item.id)}
            />
          ))}
        </PackageSection>

        <PackageSection
          icon={<UserRound color="#60a5fa" size={21} />}
          title={t.agentTitle}
          subtitle={t.agentSub}
        >
          {AGENT_PACKAGES.map((item) => (
            <AgentPackageCard
              key={item.id}
              item={item}
              language={language}
              chooseText={t.chooseAgent}
              onChoose={() => goAgent(item.id)}
            />
          ))}
        </PackageSection>

        <PackageSection
          icon={<Megaphone color="#e6c15c" size={21} />}
          title={t.addOnTitle}
          subtitle={t.addOnSub}
        >
          {ADD_ON_PRODUCTS.map((item) => (
            <AddOnCard key={item.id} item={item} language={language} />
          ))}
        </PackageSection>

        <PackageSection
          icon={<BookOpen color="#22c55e" size={21} />}
          title={t.educationTitle}
          subtitle={t.educationSub}
        >
          {EDUCATION_PRODUCTS.map((item) => (
            <EducationCard key={item.id} item={item} language={language} />
          ))}
        </PackageSection>

        <View style={styles.developerPanel}>
          <View style={styles.developerIcon}>
            <Building2 color="#a78bfa" size={24} />
          </View>

          <View style={styles.developerTextBox}>
            <Text style={styles.developerTitle}>
              {isId ? "Developer License" : "Developer License"}
            </Text>
            <Text style={styles.developerSub}>
              {isId
                ? "Untuk developer, project owner, dan perusahaan properti yang membutuhkan quotation project-based license."
                : "For developers, project owners, and property companies that need a project-based license quotation."}
            </Text>
          </View>

          <Pressable style={styles.developerButton} onPress={goDeveloper}>
            <Text style={styles.developerButtonText}>
              {isId ? "Request Quote" : "Request Quote"}
            </Text>
            <ChevronRight color="#111111" size={15} />
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function PackageSection({
  icon,
  title,
  subtitle,
  children,
}: {
  icon: ReactNode;
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionIcon}>{icon}</View>

        <View style={styles.sectionTextBox}>
          <Text style={styles.sectionTitle}>{title}</Text>
          <Text style={styles.sectionSub}>{subtitle}</Text>
        </View>
      </View>

      <View style={styles.packageList}>{children}</View>
    </View>
  );
}

function OwnerPackageCard({
  item,
  language,
  chooseText,
  onChoose,
}: {
  item: OwnerPackage;
  language: Language;
  chooseText: string;
  onChoose: () => void;
}) {
  const isId = language === "id";
  const name = isId ? item.name : item.nameEn;
  const features = isId ? item.features : item.featuresEn;
  const description = isId ? item.paymentDescription : item.paymentDescriptionEn;

  return (
    <View style={[styles.packageCard, item.isFeatured && styles.packageCardFeatured]}>
      <PackageBadge
        label={(isId ? item.badge : item.badgeEn) || item.id.toUpperCase()}
        featured={item.isFeatured}
      />

      <View style={styles.packageTop}>
        <View>
          <Text style={styles.packageName}>{name}</Text>
          <Text style={styles.packageDesc}>{description}</Text>
        </View>
      </View>

      <Text style={styles.priceText}>{formatIdr(item.priceIdr)}</Text>

      <View style={styles.metaGrid}>
        <MetaPill icon={<ShieldCheck color="#e6c15c" size={13} />} text="1 year" />
        <MetaPill
          icon={<BadgeCheck color="#e6c15c" size={13} />}
          text={`${item.maxListings} listing`}
        />
        {item.hasDirectWhatsapp ? (
          <MetaPill icon={<Check color="#22c55e" size={13} />} text="WhatsApp" />
        ) : null}
        {item.hasScheduling ? (
          <MetaPill icon={<Check color="#22c55e" size={13} />} text="Viewing" />
        ) : null}
      </View>

      <FeatureList features={features.slice(0, 6)} />

      <Pressable style={styles.primaryButton} onPress={onChoose}>
        <Text style={styles.primaryButtonText}>{chooseText}</Text>
        <ChevronRight color="#111111" size={15} />
      </Pressable>
    </View>
  );
}

function AgentPackageCard({
  item,
  language,
  chooseText,
  onChoose,
}: {
  item: AgentPackage;
  language: Language;
  chooseText: string;
  onChoose: () => void;
}) {
  const isId = language === "id";
  const name = isId ? item.name : item.nameEn;
  const features = isId ? item.features : item.featuresEn;
  const description = isId ? item.paymentDescription : item.paymentDescriptionEn;

  return (
    <View
      style={[
        styles.packageCard,
        item.hasFeaturedAgentPlacement && styles.packageCardFeatured,
      ]}
    >
      <PackageBadge
        label={item.hasFeaturedAgentPlacement ? "PRO" : item.id.toUpperCase()}
        featured={item.hasFeaturedAgentPlacement}
      />

      <Text style={styles.packageName}>{name}</Text>
      <Text style={styles.packageDesc}>{description}</Text>

      <Text style={styles.priceText}>{formatIdr(item.priceIdr)}</Text>

      {item.monthlyPriceIdr ? (
        <Text style={styles.monthlyText}>
          {isId ? "Opsi bulanan: " : "Monthly option: "}
          {formatIdr(item.monthlyPriceIdr)}
        </Text>
      ) : null}

      <View style={styles.metaGrid}>
        <MetaPill
          icon={<BadgeCheck color="#60a5fa" size={13} />}
          text={`${item.maxListings} listings`}
        />
        <MetaPill icon={<ShieldCheck color="#60a5fa" size={13} />} text="1 year" />
        <MetaPill icon={<Check color="#22c55e" size={13} />} text="Leads" />
        <MetaPill icon={<Check color="#22c55e" size={13} />} text="Viewing" />
      </View>

      <FeatureList features={features.slice(0, 7)} />

      <Pressable style={styles.primaryButton} onPress={onChoose}>
        <Text style={styles.primaryButtonText}>{chooseText}</Text>
        <ChevronRight color="#111111" size={15} />
      </Pressable>
    </View>
  );
}

function AddOnCard({
  item,
  language,
}: {
  item: AddOnProduct;
  language: Language;
}) {
  const isId = language === "id";
  const name = isId ? item.name : item.nameEn;
  const description = isId ? item.paymentDescription : item.paymentDescriptionEn;
  const features = isId ? item.features : item.featuresEn;

  return (
    <View style={styles.smallCard}>
      <PackageBadge
        label={(isId ? item.badge : item.badgeEn) || "ADD-ON"}
        featured={item.id === "homepage-spotlight"}
      />

      <Text style={styles.packageName}>{name}</Text>
      <Text style={styles.packageDesc}>{description}</Text>
      <Text style={styles.priceText}>{formatIdr(item.priceIdr)}</Text>

      <View style={styles.metaGrid}>
        <MetaPill icon={<Zap color="#e6c15c" size={13} />} text={`${item.durationDays} days`} />
        <MetaPill icon={<Star color="#e6c15c" size={13} />} text={item.placement} />
      </View>

      <FeatureList features={features.slice(0, 4)} />
    </View>
  );
}

function EducationCard({
  item,
  language,
}: {
  item: EducationProduct;
  language: Language;
}) {
  const isId = language === "id";
  const name = isId ? item.name : item.nameEn;
  const description = isId ? item.paymentDescription : item.paymentDescriptionEn;
  const features = isId ? item.features : item.featuresEn;

  return (
    <View style={styles.smallCard}>
      <PackageBadge label={(isId ? item.badge : item.badgeEn) || "EDU"} />

      <Text style={styles.packageName}>{name}</Text>
      <Text style={styles.packageDesc}>{description}</Text>
      <Text style={styles.priceText}>{formatIdr(item.priceIdr)}</Text>

      <View style={styles.metaGrid}>
        <MetaPill icon={<BookOpen color="#22c55e" size={13} />} text={`${item.durationDays} days`} />
        <MetaPill icon={<Check color="#22c55e" size={13} />} text="No auto renew" />
      </View>

      <FeatureList features={features.slice(0, 4)} />
    </View>
  );
}

function PackageBadge({
  label,
  featured = false,
}: {
  label: string;
  featured?: boolean;
}) {
  return (
    <View style={[styles.packageBadge, featured && styles.packageBadgeFeatured]}>
      {featured ? <Crown color="#111111" size={11} /> : <Sparkles color="#e6c15c" size={11} />}
      <Text
        style={[
          styles.packageBadgeText,
          featured && styles.packageBadgeTextFeatured,
        ]}
      >
        {label}
      </Text>
    </View>
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

function FeatureList({ features }: { features: string[] }) {
  return (
    <View style={styles.featureList}>
      {features.map((feature) => (
        <View key={feature} style={styles.featureRow}>
          <Check color="#22c55e" size={13} />
          <Text style={styles.featureText}>{feature}</Text>
        </View>
      ))}
    </View>
  );
}

function MiniChip({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <View style={styles.miniChip}>
      {icon}
      <Text style={styles.miniChipText}>{label}</Text>
    </View>
  );
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
    borderRadius: 26,
    borderWidth: 1,
    borderColor: "#303030",
    backgroundColor: "#101010",
    padding: 17,
    marginBottom: 16,
  },
  eyebrowPill: {
    alignSelf: "flex-start",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#705d2c",
    backgroundColor: "#211a0b",
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  eyebrowText: {
    color: "#e6c15c",
    fontSize: 9.5,
    fontWeight: "900",
    letterSpacing: 0.8,
  },
  title: {
    color: "#ffffff",
    fontSize: 30,
    lineHeight: 36,
    fontWeight: "900",
    letterSpacing: -0.6,
    marginTop: 13,
  },
  subtitle: {
    color: "#b8b8b8",
    fontSize: 13,
    lineHeight: 19,
    fontWeight: "700",
    marginTop: 8,
  },
  heroChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
    marginTop: 15,
  },
  miniChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#333333",
    backgroundColor: "#050505",
    paddingHorizontal: 9,
    paddingVertical: 7,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  miniChipText: {
    color: "#ffffff",
    fontSize: 10.5,
    fontWeight: "900",
  },
  section: {
    marginBottom: 18,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 11,
    marginBottom: 11,
  },
  sectionIcon: {
    width: 42,
    height: 42,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#303030",
    backgroundColor: "#171717",
    alignItems: "center",
    justifyContent: "center",
  },
  sectionTextBox: {
    flex: 1,
  },
  sectionTitle: {
    color: "#ffffff",
    fontSize: 20,
    fontWeight: "900",
  },
  sectionSub: {
    color: "#a9a9a9",
    fontSize: 11.5,
    lineHeight: 16,
    fontWeight: "700",
    marginTop: 3,
  },
  packageList: {
    gap: 12,
  },
  packageCard: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#303030",
    backgroundColor: "#101010",
    padding: 15,
  },
  packageCardFeatured: {
    borderColor: "#705d2c",
    backgroundColor: "#151208",
  },
  smallCard: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#303030",
    backgroundColor: "#101010",
    padding: 14,
  },
  packageTop: {
    marginTop: 8,
  },
  packageBadge: {
    alignSelf: "flex-start",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#705d2c",
    backgroundColor: "#050505",
    paddingHorizontal: 9,
    paddingVertical: 5,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  packageBadgeFeatured: {
    backgroundColor: "#e6c15c",
    borderColor: "#e6c15c",
  },
  packageBadgeText: {
    color: "#e6c15c",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.7,
  },
  packageBadgeTextFeatured: {
    color: "#111111",
  },
  packageName: {
    color: "#ffffff",
    fontSize: 20,
    fontWeight: "900",
    marginTop: 10,
  },
  packageDesc: {
    color: "#a9a9a9",
    fontSize: 11.5,
    lineHeight: 17,
    fontWeight: "700",
    marginTop: 5,
  },
  priceText: {
    color: "#ffffff",
    fontSize: 24,
    fontWeight: "900",
    letterSpacing: -0.4,
    marginTop: 13,
  },
  monthlyText: {
    color: "#e6c15c",
    fontSize: 11.5,
    fontWeight: "900",
    marginTop: 4,
  },
  metaGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 12,
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
    textTransform: "capitalize",
  },
  featureList: {
    gap: 7,
    marginTop: 13,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 7,
  },
  featureText: {
    color: "#d6d6d6",
    fontSize: 11.3,
    lineHeight: 16,
    fontWeight: "700",
    flex: 1,
  },
  primaryButton: {
    minHeight: 46,
    borderRadius: 16,
    backgroundColor: "#e6c15c",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingHorizontal: 13,
    marginTop: 15,
  },
  primaryButtonText: {
    color: "#111111",
    fontSize: 12.5,
    fontWeight: "900",
  },
  developerPanel: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#34234a",
    backgroundColor: "#130f1a",
    padding: 15,
    marginTop: 2,
  },
  developerIcon: {
    width: 46,
    height: 46,
    borderRadius: 16,
    backgroundColor: "#1c1428",
    borderWidth: 1,
    borderColor: "#34234a",
    alignItems: "center",
    justifyContent: "center",
  },
  developerTextBox: {
    marginTop: 11,
  },
  developerTitle: {
    color: "#ffffff",
    fontSize: 19,
    fontWeight: "900",
  },
  developerSub: {
    color: "#b8b8b8",
    fontSize: 11.7,
    lineHeight: 17,
    fontWeight: "700",
    marginTop: 5,
  },
  developerButton: {
    alignSelf: "flex-start",
    minHeight: 42,
    borderRadius: 14,
    backgroundColor: "#e6c15c",
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 12,
    marginTop: 13,
  },
  developerButtonText: {
    color: "#111111",
    fontSize: 12,
    fontWeight: "900",
  },
});