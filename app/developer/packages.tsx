import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
    ArrowLeft,
    Building2,
    CheckCircle2,
    ChevronRight,
    ClipboardList,
    FileText,
    Mail,
    MessageSquareMore,
    Send,
    ShieldCheck,
} from "lucide-react-native";
import { useMemo, useState } from "react";
import {
    Alert,
    KeyboardAvoidingView,
    Linking,
    Platform,
    Pressable,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";

type Language = "en" | "id";

type FormState = {
  fullName: string;
  companyName: string;
  email: string;
  whatsapp: string;
  projectName: string;
  projectLocation: string;
  propertyType: string;
  unitCount: string;
  timeline: string;
  requirements: string;
};

const initialForm: FormState = {
  fullName: "",
  companyName: "",
  email: "",
  whatsapp: "",
  projectName: "",
  projectLocation: "",
  propertyType: "",
  unitCount: "",
  timeline: "",
  requirements: "",
};

const CONTACT_EMAIL =
  process.env.EXPO_PUBLIC_TETAMO_CONTACT_EMAIL || "inquiry@tetamo.com";

const CONTACT_WHATSAPP =
  process.env.EXPO_PUBLIC_TETAMO_CONTACT_WHATSAPP || "+6282264778799";

export default function DeveloperPackagesScreen() {
  const router = useRouter();

  const [language, setLanguage] = useState<Language>("en");
  const [form, setForm] = useState<FormState>(initialForm);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const t = useMemo(() => {
    if (language === "id") {
      return {
        back: "Kembali",
        eyebrow: "TETAMO Developer License",
        title: "Request a Quote untuk Menggunakan Lisensi TETAMO",
        subtitle:
          "Untuk developer, project owner, dan perusahaan properti yang ingin menggunakan sistem TETAMO untuk marketing proyek, listing, inquiry buyer/renter, dan workflow digital properti.",
        point:
          "Ini bukan paket agent dan bukan paket owner. Ini adalah request quotation untuk project-based license.",
        suitableTitle: "Untuk Siapa",
        suitableDesc:
          "Developer perumahan, cluster, villa, apartemen, mixed-use, project owner, atau perusahaan properti yang membutuhkan sistem listing dan inquiry.",
        licenseTitle: "Lisensi Dapat Mencakup",
        licenseDesc:
          "Project listing, branded project presence, inquiry buyer/renter, lead management, dan workflow digital untuk project marketing.",
        processTitle: "Alur Request",
        process1: "1. Kirim detail proyek",
        process2: "2. TETAMO meninjau scope lisensi",
        process3: "3. TETAMO mengirim quotation",
        formTitle: "Developer License Quotation Form",
        formDesc:
          "Isi informasi utama proyek agar TETAMO bisa menyiapkan quotation yang sesuai.",
        fullName: "Nama Lengkap",
        fullNamePh: "Masukkan nama lengkap Anda",
        companyName: "Nama Perusahaan",
        companyNamePh: "Masukkan nama perusahaan",
        email: "Email",
        emailPh: "Masukkan email aktif",
        whatsapp: "WhatsApp / Telepon",
        whatsappPh: "Masukkan nomor WhatsApp / telepon",
        projectName: "Nama Proyek",
        projectNamePh: "Masukkan nama proyek",
        projectLocation: "Lokasi Proyek",
        projectLocationPh: "Contoh: Bali, Jakarta, Surabaya",
        propertyType: "Jenis Proyek",
        propertyTypePh: "Contoh: Villa, Apartemen, Perumahan, Komersial",
        unitCount: "Jumlah Unit / Scope Proyek",
        unitCountPh: "Contoh: 120 unit / 3 proyek / multi-location",
        timeline: "Target Timeline",
        timelinePh: "Contoh: Launch Q3 2026",
        requirements: "Kebutuhan Lisensi",
        requirementsPh:
          "Jelaskan bagaimana proyek Anda ingin menggunakan TETAMO, fitur yang dibutuhkan, jumlah listing, target market, dan kebutuhan workflow.",
        noteTitle: "Catatan Penting",
        noteDesc:
          "Mengirim form ini tidak otomatis mengaktifkan paket. Developer access akan ditinjau oleh TETAMO dan diproses melalui quotation resmi.",
        sendEmail: "Kirim via Email",
        sendWhatsApp: "Kirim via WhatsApp",
        success:
          "Request sudah siap dikirim. Silakan lanjutkan melalui email atau WhatsApp yang terbuka.",
        requiredAlert: "Mohon lengkapi semua field wajib terlebih dahulu.",
        subject: "Developer License Quotation Request - TETAMO",
      };
    }

    return {
      back: "Back",
      eyebrow: "TETAMO Developer License",
      title: "Request a Quote to Use the TETAMO License",
      subtitle:
        "For developers, project owners, and property companies that want to use TETAMO’s platform system for project marketing, listings, buyer/renter inquiries, and digital property workflow.",
      point:
        "This is not an agent package and not an owner listing package. This is a project-based license quotation request.",
      suitableTitle: "Who This Is For",
      suitableDesc:
        "Housing, cluster, villa, apartment, mixed-use developers, project owners, or property companies that need listing and inquiry systems.",
      licenseTitle: "The License Can Cover",
      licenseDesc:
        "Project listings, branded project presence, buyer/renter inquiries, lead management, and digital property workflow for project marketing.",
      processTitle: "Request Flow",
      process1: "1. Submit project details",
      process2: "2. TETAMO reviews the license scope",
      process3: "3. TETAMO sends a quotation",
      formTitle: "Developer License Quotation Form",
      formDesc:
        "Complete the key project information so TETAMO can prepare the right quotation.",
      fullName: "Full Name",
      fullNamePh: "Enter your full name",
      companyName: "Company Name",
      companyNamePh: "Enter your company name",
      email: "Email",
      emailPh: "Enter your active email",
      whatsapp: "WhatsApp / Phone",
      whatsappPh: "Enter your WhatsApp / phone number",
      projectName: "Project Name",
      projectNamePh: "Enter your project name",
      projectLocation: "Project Location",
      projectLocationPh: "Example: Bali, Jakarta, Surabaya",
      propertyType: "Project Type",
      propertyTypePh: "Example: Villa, Apartment, Housing, Commercial",
      unitCount: "Unit Count / Project Scope",
      unitCountPh: "Example: 120 units / 3 projects / multi-location",
      timeline: "Target Timeline",
      timelinePh: "Example: Launch Q3 2026",
      requirements: "License Requirements",
      requirementsPh:
        "Explain how your project wants to use TETAMO, features needed, number of listings, target market, and workflow requirements.",
      noteTitle: "Important Note",
      noteDesc:
        "Submitting this form does not activate any package. Developer access is reviewed by TETAMO and handled through a formal quotation.",
      sendEmail: "Send by Email",
      sendWhatsApp: "Send by WhatsApp",
      success:
        "Your request is ready to send. Please continue through the email or WhatsApp window that opened.",
      requiredAlert: "Please complete all required fields first.",
      subject: "Developer License Quotation Request - TETAMO",
    };
  }, [language]);

  const whatsappDigits = useMemo(() => {
    return CONTACT_WHATSAPP.replace(/[^\d]/g, "");
  }, []);

  const requiredFieldsFilled =
    form.fullName.trim() &&
    form.companyName.trim() &&
    form.email.trim() &&
    form.whatsapp.trim() &&
    form.projectName.trim() &&
    form.projectLocation.trim() &&
    form.propertyType.trim() &&
    form.requirements.trim();

  const messageBody = useMemo(() => {
    const greeting =
      language === "id"
        ? "Halo TETAMO, saya ingin meminta quotation untuk Developer License."
        : "Hello TETAMO, I would like to request a quotation for a Developer License.";

    return `${greeting}

${t.fullName}: ${form.fullName}
${t.companyName}: ${form.companyName}
${t.email}: ${form.email}
${t.whatsapp}: ${form.whatsapp}
${t.projectName}: ${form.projectName}
${t.projectLocation}: ${form.projectLocation}
${t.propertyType}: ${form.propertyType}
${t.unitCount}: ${form.unitCount || "-"}
${t.timeline}: ${form.timeline || "-"}

${t.requirements}:
${form.requirements}`.trim();
  }, [form, language, t]);

  const updateField = (key: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSendEmail = async () => {
    if (!requiredFieldsFilled) {
      Alert.alert("TETAMO", t.requiredAlert);
      return;
    }

    setSubmitting(true);

    const mailto = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(
      t.subject
    )}&body=${encodeURIComponent(messageBody)}`;

    try {
      await Linking.openURL(mailto);
      setSubmitted(true);
    } catch (error) {
      Alert.alert("TETAMO", "Unable to open email app.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendWhatsApp = async () => {
    if (!requiredFieldsFilled) {
      Alert.alert("TETAMO", t.requiredAlert);
      return;
    }

    if (!whatsappDigits) {
      Alert.alert("TETAMO", "WhatsApp number is not configured.");
      return;
    }

    setSubmitting(true);

    const waUrl = `https://wa.me/${whatsappDigits}?text=${encodeURIComponent(
      messageBody
    )}`;

    try {
      await Linking.openURL(waUrl);
      setSubmitted(true);
    } catch (error) {
      Alert.alert("TETAMO", "Unable to open WhatsApp.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />

      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
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

            <View style={styles.pointBox}>
              <Text style={styles.pointText}>{t.point}</Text>
            </View>
          </View>

          <View style={styles.infoGrid}>
            <InfoCard
              icon={<Building2 color="#e6c15c" size={23} />}
              title={t.suitableTitle}
              desc={t.suitableDesc}
            />

            <InfoCard
              icon={<ShieldCheck color="#22c55e" size={23} />}
              title={t.licenseTitle}
              desc={t.licenseDesc}
            />
          </View>

          <View style={styles.processPanel}>
            <View style={styles.panelHeader}>
              <View style={styles.panelIcon}>
                <FileText color="#e6c15c" size={22} />
              </View>

              <View style={styles.panelTextBox}>
                <Text style={styles.panelTitle}>{t.processTitle}</Text>
                <Text style={styles.panelSub}>
                  TETAMO reviews every developer request manually.
                </Text>
              </View>
            </View>

            {[t.process1, t.process2, t.process3].map((step) => (
              <View key={step} style={styles.processStep}>
                <CheckCircle2 color="#e6c15c" size={16} />
                <Text style={styles.processText}>{step}</Text>
              </View>
            ))}
          </View>

          <View style={styles.formPanel}>
            <View style={styles.panelHeader}>
              <View style={styles.panelIcon}>
                <ClipboardList color="#e6c15c" size={22} />
              </View>

              <View style={styles.panelTextBox}>
                <Text style={styles.panelTitle}>{t.formTitle}</Text>
                <Text style={styles.panelSub}>{t.formDesc}</Text>
              </View>
            </View>

            <FormInput
              label={t.fullName}
              placeholder={t.fullNamePh}
              value={form.fullName}
              onChangeText={(value) => updateField("fullName", value)}
              required
            />

            <FormInput
              label={t.companyName}
              placeholder={t.companyNamePh}
              value={form.companyName}
              onChangeText={(value) => updateField("companyName", value)}
              required
            />

            <FormInput
              label={t.email}
              placeholder={t.emailPh}
              value={form.email}
              onChangeText={(value) => updateField("email", value)}
              keyboardType="email-address"
              autoCapitalize="none"
              required
            />

            <FormInput
              label={t.whatsapp}
              placeholder={t.whatsappPh}
              value={form.whatsapp}
              onChangeText={(value) => updateField("whatsapp", value)}
              keyboardType="phone-pad"
              required
            />

            <FormInput
              label={t.projectName}
              placeholder={t.projectNamePh}
              value={form.projectName}
              onChangeText={(value) => updateField("projectName", value)}
              required
            />

            <FormInput
              label={t.projectLocation}
              placeholder={t.projectLocationPh}
              value={form.projectLocation}
              onChangeText={(value) => updateField("projectLocation", value)}
              required
            />

            <FormInput
              label={t.propertyType}
              placeholder={t.propertyTypePh}
              value={form.propertyType}
              onChangeText={(value) => updateField("propertyType", value)}
              required
            />

            <FormInput
              label={t.unitCount}
              placeholder={t.unitCountPh}
              value={form.unitCount}
              onChangeText={(value) => updateField("unitCount", value)}
            />

            <FormInput
              label={t.timeline}
              placeholder={t.timelinePh}
              value={form.timeline}
              onChangeText={(value) => updateField("timeline", value)}
            />

            <TextareaInput
              label={t.requirements}
              placeholder={t.requirementsPh}
              value={form.requirements}
              onChangeText={(value) => updateField("requirements", value)}
              required
            />

            <View style={styles.noteBox}>
              <Text style={styles.noteTitle}>{t.noteTitle}</Text>
              <Text style={styles.noteText}>{t.noteDesc}</Text>
            </View>

            <View style={styles.buttonRow}>
              <Pressable
                style={[styles.primaryButton, submitting && styles.disabledButton]}
                disabled={submitting}
                onPress={handleSendEmail}
              >
                <Mail color="#111111" size={17} />
                <Text style={styles.primaryButtonText}>{t.sendEmail}</Text>
              </Pressable>

              <Pressable
                style={[styles.secondaryButton, submitting && styles.disabledButton]}
                disabled={submitting}
                onPress={handleSendWhatsApp}
              >
                <MessageSquareMore color="#ffffff" size={17} />
                <Text style={styles.secondaryButtonText}>{t.sendWhatsApp}</Text>
              </Pressable>
            </View>

            {submitted ? (
              <View style={styles.successBox}>
                <CheckCircle2 color="#22c55e" size={18} />
                <Text style={styles.successText}>{t.success}</Text>
              </View>
            ) : null}
          </View>

          <View style={styles.requestPanel}>
            <View style={styles.panelHeader}>
              <View style={styles.panelIcon}>
                <Send color="#e6c15c" size={22} />
              </View>

              <View style={styles.panelTextBox}>
                <Text style={styles.panelTitle}>Request a Quote</Text>
                <Text style={styles.panelSub}>
                  Send your project details and TETAMO will review the scope
                  before preparing an official quotation.
                </Text>
              </View>
            </View>

            <Pressable
              style={styles.smallLinkButton}
              onPress={() => router.push("/signup" as any)}
            >
              <Text style={styles.smallLinkText}>Back to Sign Up</Text>
              <ChevronRight color="#e6c15c" size={15} />
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function InfoCard({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <View style={styles.infoCard}>
      <View style={styles.infoIcon}>{icon}</View>
      <Text style={styles.infoTitle}>{title}</Text>
      <Text style={styles.infoDesc}>{desc}</Text>
    </View>
  );
}

function FormInput({
  label,
  placeholder,
  value,
  onChangeText,
  keyboardType,
  autoCapitalize,
  required,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (value: string) => void;
  keyboardType?: "default" | "email-address" | "phone-pad";
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  required?: boolean;
}) {
  return (
    <View>
      <Text style={styles.inputLabel}>
        {label}
        {required ? <Text style={styles.required}> *</Text> : null}
      </Text>

      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#777777"
        keyboardType={keyboardType || "default"}
        autoCapitalize={autoCapitalize || "sentences"}
        style={styles.input}
      />
    </View>
  );
}

function TextareaInput({
  label,
  placeholder,
  value,
  onChangeText,
  required,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (value: string) => void;
  required?: boolean;
}) {
  return (
    <View>
      <Text style={styles.inputLabel}>
        {label}
        {required ? <Text style={styles.required}> *</Text> : null}
      </Text>

      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#777777"
        style={[styles.input, styles.textarea]}
        multiline
        textAlignVertical="top"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#050505",
  },
  keyboard: {
    flex: 1,
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
    marginBottom: 14,
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
    textTransform: "uppercase",
  },
  title: {
    color: "#ffffff",
    fontSize: 27,
    lineHeight: 33,
    fontWeight: "900",
    letterSpacing: -0.5,
    marginTop: 13,
  },
  subtitle: {
    color: "#b8b8b8",
    fontSize: 12.5,
    lineHeight: 19,
    fontWeight: "700",
    marginTop: 8,
  },
  pointBox: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#3a3a3a",
    backgroundColor: "#050505",
    padding: 12,
    marginTop: 14,
  },
  pointText: {
    color: "#ffffff",
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "800",
  },
  infoGrid: {
    gap: 10,
    marginBottom: 14,
  },
  infoCard: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#303030",
    backgroundColor: "#101010",
    padding: 14,
  },
  infoIcon: {
    width: 42,
    height: 42,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#303030",
    backgroundColor: "#171717",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  infoTitle: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "900",
  },
  infoDesc: {
    color: "#a9a9a9",
    fontSize: 11.5,
    lineHeight: 17,
    fontWeight: "700",
    marginTop: 5,
  },
  processPanel: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#303030",
    backgroundColor: "#101010",
    padding: 15,
    gap: 10,
    marginBottom: 14,
  },
  formPanel: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#303030",
    backgroundColor: "#101010",
    padding: 15,
    gap: 13,
    marginBottom: 14,
  },
  requestPanel: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#705d2c",
    backgroundColor: "#211a0b",
    padding: 15,
  },
  panelHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 11,
    marginBottom: 4,
  },
  panelIcon: {
    width: 42,
    height: 42,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#705d2c",
    backgroundColor: "#151106",
    alignItems: "center",
    justifyContent: "center",
  },
  panelTextBox: {
    flex: 1,
  },
  panelTitle: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "900",
  },
  panelSub: {
    color: "#a9a9a9",
    fontSize: 11,
    lineHeight: 16,
    fontWeight: "700",
    marginTop: 3,
  },
  processStep: {
    borderRadius: 17,
    borderWidth: 1,
    borderColor: "#303030",
    backgroundColor: "#050505",
    padding: 11,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  processText: {
    color: "#ffffff",
    fontSize: 11.5,
    fontWeight: "800",
    flex: 1,
  },
  inputLabel: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "900",
    marginBottom: 7,
  },
  required: {
    color: "#fb7185",
  },
  input: {
    minHeight: 50,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#303030",
    backgroundColor: "#050505",
    color: "#ffffff",
    paddingHorizontal: 13,
    fontSize: 13,
    fontWeight: "700",
  },
  textarea: {
    minHeight: 128,
    paddingTop: 13,
    paddingBottom: 13,
  },
  noteBox: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#705d2c",
    backgroundColor: "#211a0b",
    padding: 12,
  },
  noteTitle: {
    color: "#ffffff",
    fontSize: 12.5,
    fontWeight: "900",
  },
  noteText: {
    color: "#d5d5d5",
    fontSize: 11,
    lineHeight: 16,
    fontWeight: "700",
    marginTop: 4,
  },
  buttonRow: {
    gap: 9,
  },
  primaryButton: {
    minHeight: 49,
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
    fontSize: 12.5,
    fontWeight: "900",
  },
  secondaryButton: {
    minHeight: 49,
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
    fontSize: 12.5,
    fontWeight: "900",
  },
  disabledButton: {
    opacity: 0.55,
  },
  successBox: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#14532d",
    backgroundColor: "#052e16",
    padding: 12,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 9,
  },
  successText: {
    color: "#bbf7d0",
    fontSize: 11.5,
    lineHeight: 16,
    fontWeight: "800",
    flex: 1,
  },
  smallLinkButton: {
    alignSelf: "flex-start",
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  smallLinkText: {
    color: "#e6c15c",
    fontSize: 11.5,
    fontWeight: "900",
  },
});