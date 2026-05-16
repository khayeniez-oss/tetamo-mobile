import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
    AlertTriangle,
    ArrowLeft,
    ChevronRight,
    CreditCard,
    ExternalLink,
    FileText,
    Flag,
    Languages,
    Mail,
    RefreshCcw,
    Scale,
    ShieldCheck,
    UserCheck,
} from "lucide-react-native";
import { useMemo, useState, type ReactNode } from "react";
import {
    Alert,
    Linking,
    Pressable,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";

type Language = "en" | "id";

const FULL_TERMS_URL = "https://www.tetamo.com/terms";
const SUPPORT_EMAIL = "support@tetamo.com";

export default function TermsScreen() {
  const router = useRouter();
  const [language, setLanguage] = useState<Language>("en");

  const isId = language === "id";

  const content = useMemo(() => {
    if (isId) {
      return {
        back: "Kembali",
        badge: "LEGAL",
        title: "Syarat & Ketentuan",
        subtitle:
          "Ringkasan ini membantu Anda memahami aturan utama penggunaan Tetamo sebagai marketplace properti.",
        lastUpdated: "Ringkasan mobile • Terhubung ke syarat resmi website",
        officialButton: "Lihat Syarat & Ketentuan Lengkap",
        contactButton: "Hubungi Support",
        noticeTitle: "Ringkasan Mobile",
        noticeText:
          "Halaman ini adalah ringkasan untuk pengguna aplikasi. Syarat resmi lengkap tetap tersedia di website Tetamo.",
        sections: [
          {
            icon: <UserCheck color="#e6c15c" size={19} />,
            title: "Akun dan Tanggung Jawab Pengguna",
            body:
              "Anda bertanggung jawab menjaga keamanan akun, memastikan informasi profil benar, dan menggunakan Tetamo hanya untuk tujuan yang sah dan sesuai aturan platform.",
          },
          {
            icon: <FileText color="#e6c15c" size={19} />,
            title: "Listing dan Konten Properti",
            body:
              "Owner, agent, broker, developer, atau pihak lain yang membuat listing wajib memastikan informasi properti akurat, tidak menyesatkan, tidak melanggar hak pihak lain, dan mewakili properti yang jelas.",
          },
          {
            icon: <CreditCard color="#e6c15c" size={19} />,
            title: "Pembayaran dan Masa Aktif",
            body:
              "Produk atau layanan seperti listing, paket agen, dan layanan tambahan aktif sesuai masa berlaku yang ditentukan. Aktivasi dilakukan setelah pembayaran berhasil dikonfirmasi.",
          },
          {
            icon: <ShieldCheck color="#e6c15c" size={19} />,
            title: "Verifikasi dan Kualitas Marketplace",
            body:
              "Tetamo dapat meninjau listing, profil, pembayaran, dan aktivitas akun untuk menjaga keamanan dan kualitas marketplace. Listing dapat diminta revisi, ditolak, atau dibatasi jika melanggar aturan.",
          },
          {
            icon: <Flag color="#e6c15c" size={19} />,
            title: "Konten yang Tidak Diperbolehkan",
            body:
              "Pengguna tidak boleh memasang listing palsu, informasi menyesatkan, spam, konten ilegal, konten ofensif, konten yang melanggar hak cipta/merek/privasi, atau menggunakan platform untuk penipuan.",
          },
          {
            icon: <AlertTriangle color="#e6c15c" size={19} />,
            title: "Penangguhan atau Penghentian",
            body:
              "Tetamo dapat membatasi, menangguhkan, atau menghentikan akses jika terjadi pelanggaran, aktivitas ilegal, kegagalan pembayaran, penyalahgunaan akun, atau risiko keamanan.",
          },
          {
            icon: <Scale color="#e6c15c" size={19} />,
            title: "Batasan Tanggung Jawab",
            body:
              "Tetamo menyediakan platform marketplace dan tidak menjamin jumlah leads, klik, transaksi, hasil komersial tertentu, atau ketersediaan layanan tanpa gangguan.",
          },
          {
            icon: <RefreshCcw color="#e6c15c" size={19} />,
            title: "Perubahan Layanan",
            body:
              "Tetamo dapat memperbarui fitur, paket, harga, kebijakan, atau syarat penggunaan dari waktu ke waktu. Penggunaan layanan yang berlanjut dapat dianggap sebagai persetujuan atas perubahan tersebut.",
          },
          {
            icon: <Mail color="#e6c15c" size={19} />,
            title: "Pertanyaan tentang Syarat Penggunaan",
            body:
              "Jika Anda membutuhkan bantuan terkait syarat penggunaan Tetamo, hubungi Support Center atau email resmi support@tetamo.com.",
          },
        ],
      };
    }

    return {
      back: "Back",
      badge: "LEGAL",
      title: "Terms & Conditions",
      subtitle:
        "This summary helps you understand the main rules for using Tetamo as a property marketplace.",
      lastUpdated: "Mobile summary • Connected to the official website terms",
      officialButton: "View Full Terms & Conditions",
      contactButton: "Contact Support",
      noticeTitle: "Mobile Summary",
      noticeText:
        "This page is a summary for app users. The full official terms remain available on the Tetamo website.",
      sections: [
        {
          icon: <UserCheck color="#e6c15c" size={19} />,
          title: "Account and User Responsibility",
          body:
            "You are responsible for keeping your account secure, making sure your profile information is accurate, and using Tetamo only for lawful purposes and according to platform rules.",
        },
        {
          icon: <FileText color="#e6c15c" size={19} />,
          title: "Listings and Property Content",
          body:
            "Owners, agents, brokers, developers, or other parties creating listings must make sure property information is accurate, not misleading, does not infringe third-party rights, and represents a clear property.",
        },
        {
          icon: <CreditCard color="#e6c15c" size={19} />,
          title: "Payment and Active Period",
          body:
            "Products or services such as listings, agent packages, and add-on services are active according to the stated validity period. Activation happens after payment is successfully confirmed.",
        },
        {
          icon: <ShieldCheck color="#e6c15c" size={19} />,
          title: "Verification and Marketplace Quality",
          body:
            "Tetamo may review listings, profiles, payments, and account activity to protect marketplace safety and quality. Listings may be requested for revision, rejected, or limited if rules are breached.",
        },
        {
          icon: <Flag color="#e6c15c" size={19} />,
          title: "Prohibited Content",
          body:
            "Users must not post fake listings, misleading information, spam, illegal content, offensive content, content that infringes copyright/trademark/privacy, or use the platform for fraud.",
        },
        {
          icon: <AlertTriangle color="#e6c15c" size={19} />,
          title: "Suspension or Termination",
          body:
            "Tetamo may restrict, suspend, or terminate access if there is a breach, illegal activity, payment failure, account misuse, or security risk.",
        },
        {
          icon: <Scale color="#e6c15c" size={19} />,
          title: "Limitation of Liability",
          body:
            "Tetamo provides a marketplace platform and does not guarantee any specific number of leads, clicks, transactions, commercial results, or uninterrupted service availability.",
        },
        {
          icon: <RefreshCcw color="#e6c15c" size={19} />,
          title: "Service Changes",
          body:
            "Tetamo may update features, packages, prices, policies, or terms from time to time. Continued use of the service may be treated as acceptance of those changes.",
        },
        {
          icon: <Mail color="#e6c15c" size={19} />,
          title: "Questions About Terms",
          body:
            "If you need help regarding Tetamo’s terms of use, contact the Support Center or official email at support@tetamo.com.",
        },
      ],
    };
  }, [isId]);

  async function openFullTerms() {
    try {
      await Linking.openURL(FULL_TERMS_URL);
    } catch {
      Alert.alert(
        isId ? "Tidak bisa membuka link." : "Cannot open link.",
        FULL_TERMS_URL
      );
    }
  }

  async function contactSupport() {
    const subject = encodeURIComponent("Tetamo Terms Question");
    const body = encodeURIComponent(
      isId
        ? "Halo Tetamo, saya ingin bertanya tentang syarat dan ketentuan Tetamo."
        : "Hello Tetamo, I would like to ask about Tetamo’s Terms & Conditions."
    );

    try {
      await Linking.openURL(
        `mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`
      );
    } catch {
      Alert.alert(
        isId ? "Tidak bisa membuka email." : "Cannot open email.",
        SUPPORT_EMAIL
      );
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />

      <View style={styles.topBar}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft color="#ffffff" size={15} />
          <Text style={styles.backText}>{content.back}</Text>
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

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroCard}>
          <View style={styles.heroIcon}>
            <Scale color="#111111" size={25} />
          </View>

          <Text style={styles.badge}>{content.badge}</Text>
          <Text style={styles.title}>{content.title}</Text>
          <Text style={styles.subtitle}>{content.subtitle}</Text>
          <Text style={styles.updated}>{content.lastUpdated}</Text>
        </View>

        <View style={styles.noticeCard}>
          <Text style={styles.noticeTitle}>{content.noticeTitle}</Text>
          <Text style={styles.noticeText}>{content.noticeText}</Text>
        </View>

        {content.sections.map((section) => (
          <LegalSection
            key={section.title}
            icon={section.icon}
            title={section.title}
            body={section.body}
          />
        ))}

        <View style={styles.actionCard}>
          <Pressable style={styles.primaryButton} onPress={openFullTerms}>
            <ExternalLink color="#111111" size={17} />
            <Text style={styles.primaryButtonText}>
              {content.officialButton}
            </Text>
            <ChevronRight color="#111111" size={16} />
          </Pressable>

          <Pressable style={styles.secondaryButton} onPress={contactSupport}>
            <Mail color="#ffffff" size={16} />
            <Text style={styles.secondaryButtonText}>
              {content.contactButton}
            </Text>
          </Pressable>

          <Text style={styles.urlText}>{FULL_TERMS_URL}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function LegalSection({
  icon,
  title,
  body,
}: {
  icon: ReactNode;
  title: string;
  body: string;
}) {
  return (
    <View style={styles.sectionCard}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionIcon}>{icon}</View>
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>

      <Text style={styles.sectionBody}>{body}</Text>
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
    width: 54,
    height: 54,
    borderRadius: 19,
    backgroundColor: "#e6c15c",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 13,
  },
  badge: {
    color: "#e6c15c",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.2,
  },
  title: {
    color: "#ffffff",
    fontSize: 27,
    lineHeight: 33,
    fontWeight: "900",
    letterSpacing: -0.6,
    marginTop: 6,
  },
  subtitle: {
    color: "#d6d6d6",
    fontSize: 12.3,
    lineHeight: 19,
    fontWeight: "700",
    marginTop: 8,
  },
  updated: {
    color: "#9b9b9b",
    fontSize: 10.8,
    fontWeight: "800",
    marginTop: 11,
  },
  noticeCard: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#705d2c",
    backgroundColor: "#211a0b",
    padding: 13,
    marginBottom: 13,
  },
  noticeTitle: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "900",
  },
  noticeText: {
    color: "#f5e6b7",
    fontSize: 11.4,
    lineHeight: 17,
    fontWeight: "700",
    marginTop: 5,
  },
  sectionCard: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#303030",
    backgroundColor: "#101010",
    padding: 15,
    marginBottom: 13,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    marginBottom: 10,
  },
  sectionIcon: {
    width: 42,
    height: 42,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#705d2c",
    backgroundColor: "#211a0b",
    alignItems: "center",
    justifyContent: "center",
  },
  sectionTitle: {
    color: "#ffffff",
    fontSize: 14.5,
    lineHeight: 20,
    fontWeight: "900",
    flex: 1,
  },
  sectionBody: {
    color: "#d6d6d6",
    fontSize: 11.8,
    lineHeight: 18,
    fontWeight: "700",
  },
  actionCard: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#303030",
    backgroundColor: "#101010",
    padding: 15,
    gap: 10,
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
    minHeight: 48,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: "#343434",
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
  urlText: {
    color: "#9b9b9b",
    fontSize: 10.8,
    lineHeight: 16,
    fontWeight: "700",
    textAlign: "center",
  },
});