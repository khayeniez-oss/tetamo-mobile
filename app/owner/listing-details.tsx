import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ArrowLeft, FileText, PackageCheck } from "lucide-react-native";
import { useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Pressable,
    SafeAreaView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import {
    type OwnerPlanType,
    useListingDraft,
} from "../../components/listing/ListingDraftContext";
import ListingForm from "../../components/listing/ListingForm";
import { getOwnerPackageById } from "../../services/pricelist";

type Language = "en" | "id";

export default function OwnerListingDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { loading, draft, setDraft } = useListingDraft();

  const [language, setLanguage] = useState<Language>("en");

  const currentPlan = useMemo<OwnerPlanType>(() => {
    const plan = readParam(params.plan);

    if (plan === "priority") return "priority";
    if (plan === "featured") return "featured";

    return "basic";
  }, [params.plan]);

  const selectedPackage = useMemo(() => {
    return getOwnerPackageById(currentPlan);
  }, [currentPlan]);

  const isId = language === "id";

  useEffect(() => {
    if (loading) return;

    setDraft((prev) => ({
      ...prev,
      mode: prev.mode || "create",
      source: "owner",
      plan: currentPlan,
      payment: {
        ...(prev.payment || {}),
        planId: currentPlan,
        amount: selectedPackage?.priceIdr || prev.payment?.amount || 0,
        currency: "IDR",
        status: prev.payment?.status || "unpaid",
      },
    }));
  }, [currentPlan, loading, selectedPackage?.priceIdr, setDraft]);

  const handleBack = () => {
    router.push(`/owner/create-listing?plan=${currentPlan}` as any);
  };

  const handleNext = () => {
    router.push(`/owner/listing-media?plan=${currentPlan}` as any);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="light" />

        <View style={styles.loadingBox}>
          <ActivityIndicator color="#e6c15c" />
          <Text style={styles.loadingText}>
            {isId ? "Memuat detail listing..." : "Loading listing details..."}
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
          <FileText color="#e6c15c" size={19} />
        </View>

        <View style={styles.stepTextBox}>
          <Text style={styles.stepKicker}>
            {isId ? "STEP 2" : "STEP 2"}
          </Text>
          <Text style={styles.stepTitle}>
            {isId ? "Detail Properti" : "Property Details"}
          </Text>
        </View>

        <View style={styles.packagePill}>
          <PackageCheck color="#e6c15c" size={14} />
          <Text style={styles.packagePillText}>
            {selectedPackage
              ? isId
                ? selectedPackage.name
                : selectedPackage.nameEn
              : currentPlan.toUpperCase()}
          </Text>
        </View>
      </View>

      <ListingForm
        draft={draft}
        setDraft={setDraft}
        onBack={handleBack}
        onNext={handleNext}
        language={language}
        showPackageBadge
      />
    </SafeAreaView>
  );
}

function readParam(value: unknown) {
  if (Array.isArray(value)) return String(value[0] || "");
  return String(value || "");
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
  packagePill: {
    maxWidth: 128,
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
  packagePillText: {
    color: "#e6c15c",
    fontSize: 9.5,
    fontWeight: "900",
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