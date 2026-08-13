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
      <StatusBar style="dark" />

      <View style={styles.topBar}>
        <Pressable
          style={styles.backButton}
          onPress={() => router.back()}
          hitSlop={10}
        >
          <ArrowLeft color="#171717" size={18} />
          <Text style={styles.backText}>{content.back}</Text>
        </Pressable>

        <View style={styles.langToggle}>
          <Languages color="#A67C28" size={14} />

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
        <View style={styles.hero}>
          <View style={styles.heroIcon}>
            <Scale color="#171717" size={22} />
          </View>

          <Text style={styles.badge}>{content.badge}</Text>
          <Text style={styles.title}>{content.title}</Text>
          <Text style={styles.subtitle}>{content.subtitle}</Text>
          <Text style={styles.updated}>{content.lastUpdated}</Text>
        </View>

        <View style={styles.noticeCard}>
          <View style={styles.noticeAccent} />

          <View style={styles.noticeContent}>
            <Text style={styles.noticeTitle}>{content.noticeTitle}</Text>
            <Text style={styles.noticeText}>{content.noticeText}</Text>
          </View>
        </View>

        <View style={styles.sectionsCard}>
          {content.sections.map((section, index) => (
            <LegalSection
              key={section.title}
              index={index + 1}
              icon={section.icon}
              title={section.title}
              body={section.body}
              isLast={index === content.sections.length - 1}
            />
          ))}
        </View>

        <View style={styles.actionCard}>
          <Pressable style={styles.primaryButton} onPress={openFullTerms}>
            <View style={styles.buttonIconGold}>
              <ExternalLink color="#171717" size={16} />
            </View>

            <Text style={styles.primaryButtonText}>
              {content.officialButton}
            </Text>

            <ChevronRight color="#171717" size={17} />
          </Pressable>

          <Pressable style={styles.secondaryButton} onPress={contactSupport}>
            <View style={styles.buttonIconLight}>
              <Mail color="#171717" size={16} />
            </View>

            <View style={styles.supportTextBox}>
              <Text style={styles.secondaryButtonText}>
                {content.contactButton}
              </Text>
              <Text style={styles.supportEmail}>{SUPPORT_EMAIL}</Text>
            </View>

            <ChevronRight color="#888273" size={17} />
          </Pressable>

          <Text style={styles.urlText}>{FULL_TERMS_URL}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function LegalSection({
  index,
  icon,
  title,
  body,
  isLast,
}: {
  index: number;
  icon: ReactNode;
  title: string;
  body: string;
  isLast: boolean;
}) {
  return (
    <View style={[styles.sectionRow, !isLast && styles.sectionDivider]}>
      <View style={styles.sectionTop}>
        <Text style={styles.sectionNumber}>
          {String(index).padStart(2, "0")}
        </Text>

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
    backgroundColor: "#F7F5EF",
  },

  topBar: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 10,
    backgroundColor: "#F7F5EF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  backButton: {
    minHeight: 38,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },

  backText: {
    color: "#171717",
    fontSize: 13,
    fontWeight: "700",
  },

  langToggle: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#DDD7C9",
    backgroundColor: "#FFFFFF",
    paddingLeft: 10,
    paddingRight: 3,
    paddingVertical: 3,
    gap: 2,
  },

  langButton: {
    minWidth: 36,
    paddingHorizontal: 9,
    paddingVertical: 7,
    borderRadius: 999,
    alignItems: "center",
  },

  langButtonActive: {
    backgroundColor: "#E6C15C",
  },

  langText: {
    color: "#8A806C",
    fontSize: 10,
    fontWeight: "800",
  },

  langTextActive: {
    color: "#171717",
  },

  scroll: {
    flex: 1,
    backgroundColor: "#F7F5EF",
  },

  content: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 44,
  },

  hero: {
    marginBottom: 24,
  },

  heroIcon: {
    width: 46,
    height: 46,
    borderRadius: 15,
    backgroundColor: "#E6C15C",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },

  badge: {
    color: "#9B7726",
    fontSize: 10.5,
    fontWeight: "800",
    letterSpacing: 1.4,
  },

  title: {
    color: "#171717",
    fontSize: 31,
    lineHeight: 37,
    fontWeight: "800",
    letterSpacing: -0.8,
    marginTop: 7,
  },

  subtitle: {
    color: "#615E57",
    fontSize: 13.5,
    lineHeight: 21,
    fontWeight: "500",
    marginTop: 9,
    maxWidth: 345,
  },

  updated: {
    color: "#999287",
    fontSize: 10.8,
    lineHeight: 16,
    fontWeight: "600",
    marginTop: 12,
  },

  noticeCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E7DFC9",
    backgroundColor: "#FFFDF8",
    padding: 15,
    flexDirection: "row",
    marginBottom: 18,
  },

  noticeAccent: {
    width: 3,
    borderRadius: 999,
    backgroundColor: "#E6C15C",
    marginRight: 12,
  },

  noticeContent: {
    flex: 1,
  },

  noticeTitle: {
    color: "#171717",
    fontSize: 13.5,
    fontWeight: "800",
  },

  noticeText: {
    color: "#6F695D",
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "500",
    marginTop: 4,
  },

  sectionsCard: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#E8E3D9",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    marginBottom: 18,
    overflow: "hidden",
  },

  sectionRow: {
    paddingVertical: 18,
  },

  sectionDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E9E5DC",
  },

  sectionTop: {
    flexDirection: "row",
    alignItems: "center",
  },

  sectionNumber: {
    width: 28,
    color: "#B3AA99",
    fontSize: 10.5,
    fontWeight: "800",
    letterSpacing: 0.4,
  },

  sectionIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#EADFBF",
    backgroundColor: "#FBF6E8",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 11,
  },

  sectionTitle: {
    flex: 1,
    color: "#1C1B18",
    fontSize: 14.5,
    lineHeight: 20,
    fontWeight: "800",
  },

  sectionBody: {
    color: "#68645C",
    fontSize: 12.4,
    lineHeight: 19,
    fontWeight: "500",
    marginTop: 10,
    marginLeft: 28,
  },

  actionCard: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#E8E3D9",
    backgroundColor: "#FFFFFF",
    padding: 14,
    gap: 10,
  },

  primaryButton: {
    minHeight: 56,
    borderRadius: 16,
    backgroundColor: "#E6C15C",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    gap: 10,
  },

  buttonIconGold: {
    width: 34,
    height: 34,
    borderRadius: 11,
    backgroundColor: "rgba(255,255,255,0.32)",
    alignItems: "center",
    justifyContent: "center",
  },

  primaryButtonText: {
    flex: 1,
    color: "#171717",
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "800",
  },

  secondaryButton: {
    minHeight: 60,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E4DFD5",
    backgroundColor: "#FAF9F6",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    gap: 10,
  },

  buttonIconLight: {
    width: 34,
    height: 34,
    borderRadius: 11,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E6E1D7",
    alignItems: "center",
    justifyContent: "center",
  },

  supportTextBox: {
    flex: 1,
  },

  secondaryButtonText: {
    color: "#171717",
    fontSize: 13,
    fontWeight: "800",
  },

  supportEmail: {
    color: "#8B8579",
    fontSize: 10.8,
    fontWeight: "500",
    marginTop: 2,
  },

  urlText: {
    color: "#AAA398",
    fontSize: 10.2,
    lineHeight: 15,
    fontWeight: "500",
    textAlign: "center",
    marginTop: 2,
  },
});
