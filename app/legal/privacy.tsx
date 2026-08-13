import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
    ArrowLeft,
    Bell,
    ChevronRight,
    Database,
    ExternalLink,
    FileText,
    Languages,
    Lock,
    Mail,
    Server,
    ShieldCheck,
    Trash2,
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

const FULL_PRIVACY_URL = "https://www.tetamo.com/kebijakan-privasi";
const SUPPORT_EMAIL = "support@tetamo.com";

export default function PrivacyPolicyScreen() {
  const router = useRouter();
  const [language, setLanguage] = useState<Language>("en");

  const isId = language === "id";

  const content = useMemo(() => {
    if (isId) {
      return {
        back: "Kembali",
        badge: "PRIVASI",
        title: "Kebijakan Privasi",
        subtitle:
          "Ringkasan ini membantu Anda memahami bagaimana Tetamo mengumpulkan, menggunakan, menyimpan, dan melindungi data Anda di aplikasi mobile.",
        lastUpdated: "Ringkasan mobile • Terhubung ke kebijakan resmi website",
        officialButton: "Lihat Kebijakan Privasi Lengkap",
        contactButton: "Hubungi Support",
        noticeTitle: "Ringkasan Mobile",
        noticeText:
          "Halaman ini adalah ringkasan untuk pengguna aplikasi. Kebijakan resmi lengkap tetap tersedia di website Tetamo.",
        sections: [
          {
            icon: <UserCheck color="#e6c15c" size={19} />,
            title: "Data yang Kami Kumpulkan",
            body:
              "Tetamo dapat mengumpulkan data akun seperti nama, email, nomor WhatsApp, role pengguna, foto profil, agency, alamat, serta informasi yang Anda masukkan saat membuat atau mengelola listing.",
          },
          {
            icon: <FileText color="#e6c15c" size={19} />,
            title: "Data Listing dan Konten Pengguna",
            body:
              "Saat Anda membuat listing, Tetamo dapat menyimpan judul, deskripsi, lokasi, harga, tipe properti, foto, video, fasilitas, dan informasi pendukung lain yang Anda masukkan.",
          },
          {
            icon: <Database color="#e6c15c" size={19} />,
            title: "Cara Kami Menggunakan Data",
            body:
              "Data digunakan untuk menjalankan akun Anda, menampilkan listing, memproses pembayaran, mengirim update penting, membantu verifikasi, menjaga keamanan platform, dan meningkatkan pengalaman pengguna.",
          },
          {
            icon: <Server color="#e6c15c" size={19} />,
            title: "Penyimpanan dan Pemrosesan",
            body:
              "Data dapat disimpan dan diproses melalui layanan teknologi yang membantu Tetamo menjalankan platform, termasuk layanan database, penyimpanan file, pembayaran, keamanan, analitik, dan komunikasi.",
          },
          {
            icon: <Bell color="#e6c15c" size={19} />,
            title: "Komunikasi dan Notifikasi",
            body:
              "Tetamo dapat mengirim notifikasi terkait akun, pembayaran, receipt, listing, paket agen, inquiry, perubahan layanan, atau informasi penting lain. Beberapa notifikasi layanan mungkin diperlukan untuk operasional akun.",
          },
          {
            icon: <ShieldCheck color="#e6c15c" size={19} />,
            title: "Pembagian Data",
            body:
              "Tetamo tidak membagikan data pribadi secara sembarangan. Data hanya dapat dibagikan jika diperlukan untuk operasional layanan, keamanan, pembayaran, dukungan pelanggan, kewajiban hukum, atau dengan persetujuan Anda.",
          },
          {
            icon: <Lock color="#e6c15c" size={19} />,
            title: "Keamanan",
            body:
              "Tetamo berupaya menggunakan langkah keamanan yang wajar untuk melindungi data. Anda juga bertanggung jawab menjaga keamanan akun, password, dan perangkat yang digunakan.",
          },
          {
            icon: <Trash2 color="#e6c15c" size={19} />,
            title: "Hak dan Penghapusan Akun",
            body:
              "Anda dapat memperbarui data profil dari aplikasi dan dapat meminta penghapusan akun. Beberapa catatan seperti transaksi, invoice, receipt, atau data yang diwajibkan hukum dapat tetap disimpan sesuai kebutuhan legal dan akuntansi.",
          },
          {
            icon: <Mail color="#e6c15c" size={19} />,
            title: "Pertanyaan Privasi",
            body:
              "Untuk pertanyaan terkait privasi atau data pribadi, hubungi Tetamo melalui Support Center atau email resmi support@tetamo.com.",
          },
        ],
      };
    }

    return {
      back: "Back",
      badge: "PRIVACY",
      title: "Privacy Policy",
      subtitle:
        "This summary helps you understand how Tetamo collects, uses, stores, and protects your data in the mobile app.",
      lastUpdated: "Mobile summary • Connected to the official website policy",
      officialButton: "View Full Privacy Policy",
      contactButton: "Contact Support",
      noticeTitle: "Mobile Summary",
      noticeText:
        "This page is a summary for app users. The full official policy remains available on the Tetamo website.",
      sections: [
        {
          icon: <UserCheck color="#e6c15c" size={19} />,
          title: "Information We Collect",
          body:
            "Tetamo may collect account data such as your name, email, WhatsApp number, user role, profile photo, agency, address, and information you provide when creating or managing listings.",
        },
        {
          icon: <FileText color="#e6c15c" size={19} />,
          title: "Listings and User Content",
          body:
            "When you create a listing, Tetamo may store the title, description, location, price, property type, photos, videos, facilities, and other supporting information you provide.",
        },
        {
          icon: <Database color="#e6c15c" size={19} />,
          title: "How We Use Data",
          body:
            "Data is used to run your account, display listings, process payments, send important updates, support verification, protect platform safety, and improve user experience.",
        },
        {
          icon: <Server color="#e6c15c" size={19} />,
          title: "Storage and Processing",
          body:
            "Data may be stored and processed through technology services that help Tetamo operate the platform, including database, file storage, payment, security, analytics, and communication services.",
        },
        {
          icon: <Bell color="#e6c15c" size={19} />,
          title: "Communications and Notifications",
          body:
            "Tetamo may send notifications about your account, payments, receipts, listings, agent packages, inquiries, service changes, or other important information. Some service notifications may be required for account operations.",
        },
        {
          icon: <ShieldCheck color="#e6c15c" size={19} />,
          title: "Data Sharing",
          body:
            "Tetamo does not share personal data casually. Data may only be shared where needed for service operations, safety, payments, customer support, legal obligations, or with your consent.",
        },
        {
          icon: <Lock color="#e6c15c" size={19} />,
          title: "Security",
          body:
            "Tetamo works to use reasonable security measures to protect data. You are also responsible for keeping your account, password, and device secure.",
        },
        {
          icon: <Trash2 color="#e6c15c" size={19} />,
          title: "Rights and Account Deletion",
          body:
            "You can update profile data from the app and request account deletion. Some records such as transactions, invoices, receipts, or legally required data may be retained for legal and accounting needs.",
        },
        {
          icon: <Mail color="#e6c15c" size={19} />,
          title: "Privacy Questions",
          body:
            "For questions about privacy or personal data, contact Tetamo through the Support Center or official email at support@tetamo.com.",
        },
      ],
    };
  }, [isId]);

  async function openFullPolicy() {
    try {
      await Linking.openURL(FULL_PRIVACY_URL);
    } catch {
      Alert.alert(
        isId ? "Tidak bisa membuka link." : "Cannot open link.",
        FULL_PRIVACY_URL
      );
    }
  }

  async function contactSupport() {
    const subject = encodeURIComponent("Tetamo Privacy Question");
    const body = encodeURIComponent(
      isId
        ? "Halo Tetamo, saya ingin bertanya tentang kebijakan privasi dan data pribadi saya."
        : "Hello Tetamo, I would like to ask about the privacy policy and my personal data."
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
            <Lock color="#171717" size={22} />
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
          <Pressable style={styles.primaryButton} onPress={openFullPolicy}>
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

          <Text style={styles.urlText}>{FULL_PRIVACY_URL}</Text>
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
