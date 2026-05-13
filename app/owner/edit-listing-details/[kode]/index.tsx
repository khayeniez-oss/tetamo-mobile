import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ArrowLeft, FileText, Languages } from "lucide-react-native";
import { useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Pressable,
    SafeAreaView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { useListingDraft } from "../../../../components/listing/ListingDraftContext";
import ListingForm from "../../../../components/listing/ListingForm";

type Language = "en" | "id";

export default function OwnerEditListingDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { loading, draft, setDraft } = useListingDraft();

  const [language, setLanguage] = useState<Language>("en");

  const kode = useMemo(() => {
    const value = params.kode;
    if (Array.isArray(value)) return String(value[0] || "");
    return String(value || "");
  }, [params.kode]);

  const isId = language === "id";

  useEffect(() => {
    if (!kode || loading) return;

    setDraft((prev) => ({
      ...prev,
      mode: "edit",
      source: "owner",
      kode,
    }));
  }, [kode, loading, setDraft]);

  function handleBack() {
    router.push(`/owner/edit-listing/${kode}` as any);
  }

  function handleNext() {
    router.push(`/owner/edit-listing-media/${kode}` as any);
  }

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
          <Languages color="#e6c15c" size={14} />

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
            {isId ? "EDIT STEP 2" : "EDIT STEP 2"}
          </Text>
          <Text style={styles.stepTitle}>
            {isId ? "Detail Properti" : "Property Details"}
          </Text>
        </View>

        <View style={styles.editPill}>
          <Text style={styles.editPillText}>EDIT</Text>
        </View>
      </View>

      <ListingForm
        draft={{
          ...draft,
          mode: "edit",
          source: "owner",
          kode,
        }}
        setDraft={setDraft}
        onBack={handleBack}
        onNext={handleNext}
        language={language}
        showPackageBadge={false}
      />
    </SafeAreaView>
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
  editPill: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#60a5fa",
    backgroundColor: "#0b1624",
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  editPillText: {
    color: "#60a5fa",
    fontSize: 9.5,
    fontWeight: "900",
    letterSpacing: 0.7,
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