import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
    CheckCircle2,
    ChevronRight,
    Home,
    Languages,
    PlusCircle,
    ShieldCheck,
} from "lucide-react-native";
import { useMemo, useState } from "react";
import {
    Pressable,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";

type Language = "en" | "id";

function readParam(value: unknown) {
  if (Array.isArray(value)) return String(value[0] || "");
  return String(value || "");
}

export default function AgentListingSuccessScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const [language, setLanguage] = useState<Language>("en");

  const type = readParam(params.type);
  const kode = readParam(params.kode);

  const isId = language === "id";

  const isSubmittedForApproval = type === "submitted-for-approval";
  const isEditListing = type === "edit-listing";

  const content = useMemo(() => {
    if (isSubmittedForApproval) {
      return {
        badge: isId ? "LISTING DIKIRIM" : "LISTING SUBMITTED",
        title: isId
          ? "Listing Berhasil Dikirim"
          : "Listing Submitted Successfully",
        description: isId
          ? "Listing Anda telah dikirim dan dapat tampil di marketplace dengan badge Menunggu Verifikasi."
          : "Your listing has been submitted and can appear in the marketplace with a Pending Verification badge.",
        helper: isId
          ? "Setelah admin menyetujui listing ini, status verifikasi akan diperbarui. Sampai saat itu, listing tetap ditandai sebagai Menunggu Verifikasi agar viewer tahu statusnya masih dalam proses review."
          : "After admin approval, the verification status will be updated. Until then, the listing remains marked as Pending Verification so viewers know it is still under review.",
      };
    }

    if (isEditListing) {
      return {
        badge: isId ? "UPDATE DIKIRIM" : "UPDATE SUBMITTED",
        title: isId
          ? "Perubahan Listing Berhasil Dikirim"
          : "Listing Update Submitted Successfully",
        description: isId
          ? "Perubahan listing Anda telah dikirim dan dapat tampil dengan status menunggu review admin."
          : "Your listing update has been submitted and can appear with a pending admin review status.",
        helper: isId
          ? "Setelah admin menyetujui perubahan ini, status verifikasi akan diperbarui."
          : "After admin approval, the verification status will be updated.",
      };
    }

    return {
      badge: isId ? "BERHASIL" : "SUCCESS",
      title: isId ? "Berhasil" : "Success",
      description: isId
        ? "Aksi Anda telah berhasil diselesaikan."
        : "Your action has been completed successfully.",
      helper: "",
    };
  }, [isId, isSubmittedForApproval, isEditListing]);

  function handleViewListings() {
    router.push("/(tabs)/profile" as any);
  }

  function handleCreateAnother() {
    router.push("/agent/create-listing" as any);
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />

      <View style={styles.topBar}>
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

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          <View style={styles.successIcon}>
            <CheckCircle2 color="#22c55e" size={42} />
          </View>

          <View style={styles.badge}>
            <ShieldCheck color="#e6c15c" size={14} />
            <Text style={styles.badgeText}>{content.badge}</Text>
          </View>

          <Text style={styles.title}>{content.title}</Text>

          <Text style={styles.description}>{content.description}</Text>

          {content.helper ? (
            <Text style={styles.helper}>{content.helper}</Text>
          ) : null}

          {kode ? (
            <View style={styles.kodeBox}>
              <Text style={styles.kodeLabel}>
                {isId ? "Kode Listing" : "Listing Code"}
              </Text>
              <Text style={styles.kodeText}>{kode}</Text>
            </View>
          ) : null}

          <View style={styles.buttonGroup}>
            <Pressable style={styles.primaryButton} onPress={handleViewListings}>
              <Home color="#111111" size={17} />
              <Text style={styles.primaryButtonText}>
                {isId ? "Lihat Listing Saya" : "View My Listings"}
              </Text>
              <ChevronRight color="#111111" size={15} />
            </Pressable>

            <Pressable
              style={styles.secondaryButton}
              onPress={handleCreateAnother}
            >
              <PlusCircle color="#ffffff" size={17} />
              <Text style={styles.secondaryButtonText}>
                {isId ? "Buat Listing Lagi" : "Create Another Listing"}
              </Text>
            </Pressable>
          </View>

          <Text style={styles.footerNote}>
            {isId
              ? "Jika limit listing Anda sudah penuh, tombol Buat Listing Lagi akan diarahkan ke pengecekan paket agen."
              : "If your listing limit is full, Create Another Listing will go through the agent package check."}
          </Text>
        </View>
      </ScrollView>
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
    alignItems: "flex-end",
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
  scroll: {
    flex: 1,
    backgroundColor: "#050505",
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 38,
    justifyContent: "center",
  },
  card: {
    borderRadius: 30,
    borderWidth: 1,
    borderColor: "#303030",
    backgroundColor: "#101010",
    padding: 20,
    alignItems: "center",
  },
  successIcon: {
    width: 78,
    height: 78,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#14532d",
    backgroundColor: "#052e16",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  badge: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#705d2c",
    backgroundColor: "#211a0b",
    paddingHorizontal: 11,
    paddingVertical: 7,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  badgeText: {
    color: "#e6c15c",
    fontSize: 9.5,
    fontWeight: "900",
    letterSpacing: 1,
  },
  title: {
    color: "#ffffff",
    fontSize: 25,
    lineHeight: 31,
    fontWeight: "900",
    textAlign: "center",
    letterSpacing: -0.5,
    marginTop: 15,
  },
  description: {
    color: "#d6d6d6",
    fontSize: 12.5,
    lineHeight: 19,
    fontWeight: "700",
    textAlign: "center",
    marginTop: 9,
  },
  helper: {
    color: "#a9a9a9",
    fontSize: 11.3,
    lineHeight: 17,
    fontWeight: "700",
    textAlign: "center",
    marginTop: 9,
  },
  kodeBox: {
    width: "100%",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#303030",
    backgroundColor: "#050505",
    padding: 14,
    marginTop: 18,
    alignItems: "center",
  },
  kodeLabel: {
    color: "#a9a9a9",
    fontSize: 11,
    fontWeight: "800",
  },
  kodeText: {
    color: "#e6c15c",
    fontSize: 17,
    fontWeight: "900",
    marginTop: 5,
    textAlign: "center",
  },
  buttonGroup: {
    width: "100%",
    gap: 10,
    marginTop: 20,
  },
  primaryButton: {
    minHeight: 50,
    borderRadius: 17,
    backgroundColor: "#e6c15c",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    paddingHorizontal: 14,
  },
  primaryButtonText: {
    color: "#111111",
    fontSize: 13,
    fontWeight: "900",
  },
  secondaryButton: {
    minHeight: 50,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: "#303030",
    backgroundColor: "#050505",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    paddingHorizontal: 14,
  },
  secondaryButtonText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "900",
  },
  footerNote: {
    color: "#777777",
    fontSize: 10.7,
    lineHeight: 15,
    fontWeight: "700",
    textAlign: "center",
    marginTop: 15,
  },
});