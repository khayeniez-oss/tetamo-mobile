import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ArrowLeft, ChevronRight, PackageCheck } from "lucide-react-native";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  getEmptyListingDraft,
  type OwnerPlanType,
  useListingDraft,
} from "../../components/listing/ListingDraftContext";
import ListingIklan from "../../components/listing/ListingIklan";
import { getOwnerPackageById } from "../../services/pricelist";

type Language = "en" | "id";

export default function OwnerCreateListingScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { loading, draft, setDraft, clearDraft } = useListingDraft();

  const isIOS = Platform.OS === "ios";

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
    if (!isIOS) return;

    router.replace("/search" as any);
  }, [isIOS, router]);

  useEffect(() => {
    if (isIOS) return;
    if (loading) return;

    setDraft((prev) => {
      const shouldStartFresh = prev.source === "agent" || prev.mode === "edit";

      const baseDraft = shouldStartFresh ? getEmptyListingDraft() : prev;

      return {
        ...baseDraft,
        mode: "create",
        source: "owner",
        plan: currentPlan,
        payment: {
          ...(baseDraft.payment || {}),
          planId: currentPlan,
          amount: selectedPackage?.priceIdr || 0,
          currency: "IDR",
          status: "unpaid",
        },
      };
    });
  }, [currentPlan, loading, selectedPackage?.priceIdr, setDraft, isIOS]);

  const handleNext = () => {
    if (isIOS) {
      router.replace("/search" as any);
      return;
    }

    router.push(`/owner/listing-details?plan=${currentPlan}` as any);
  };

  const handleReset = async () => {
    if (isIOS) {
      router.replace("/search" as any);
      return;
    }

    await clearDraft();
    router.replace("/owner/packages" as any);
  };

  if (isIOS) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="light" />

        <View style={styles.iosRedirectBox}>
          <ActivityIndicator color="#e6c15c" />

          <Text style={styles.iosRedirectTitle}>
            {isId ? "Membuka Pencarian" : "Opening Search"}
          </Text>

          <Text style={styles.iosRedirectText}>
            {isId
              ? "Anda akan diarahkan ke pencarian properti."
              : "Redirecting you to property search."}
          </Text>

          <Pressable
            style={styles.iosSearchButton}
            onPress={() => router.replace("/search" as any)}
          >
            <Text style={styles.iosSearchButtonText}>
              {isId ? "Cari Properti" : "Search Properties"}
            </Text>
            <ChevronRight color="#111111" size={16} />
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="light" />

        <View style={styles.loadingBox}>
          <ActivityIndicator color="#e6c15c" />
          <Text style={styles.loadingText}>
            {isId ? "Memuat draft listing..." : "Loading listing draft..."}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />

      <View style={styles.topBar}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
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

      <View style={styles.planBar}>
        <View style={styles.planIcon}>
          <PackageCheck color="#e6c15c" size={19} />
        </View>

        <View style={styles.planTextBox}>
          <Text style={styles.planKicker}>
            {isId ? "PAKET OWNER" : "OWNER PACKAGE"}
          </Text>
          <Text style={styles.planTitle}>
            {selectedPackage
              ? isId
                ? selectedPackage.name
                : selectedPackage.nameEn
              : currentPlan.toUpperCase()}
          </Text>
        </View>

        <Text style={styles.planPrice}>
          {selectedPackage ? formatIdr(selectedPackage.priceIdr) : "-"}
        </Text>
      </View>

      <ListingIklan
        draft={draft}
        setDraft={setDraft}
        onNext={handleNext}
        onReset={handleReset}
        language={language}
      />
    </SafeAreaView>
  );
}

function readParam(value: unknown) {
  if (Array.isArray(value)) return String(value[0] || "");
  return String(value || "");
}

function formatIdr(value: number) {
  return `Rp ${Math.round(value).toLocaleString("id-ID")}`;
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#050505",
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
  planBar: {
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
  planIcon: {
    width: 38,
    height: 38,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#705d2c",
    backgroundColor: "#211a0b",
    alignItems: "center",
    justifyContent: "center",
  },
  planTextBox: {
    flex: 1,
  },
  planKicker: {
    color: "#e6c15c",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.8,
  },
  planTitle: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "900",
    marginTop: 2,
  },
  planPrice: {
    color: "#ffffff",
    fontSize: 12,
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