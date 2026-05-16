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
            <Lock color="#111111" size={25} />
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
          <Pressable style={styles.primaryButton} onPress={openFullPolicy}>
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

          <Text style={styles.urlText}>{FULL_PRIVACY_URL}</Text>
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