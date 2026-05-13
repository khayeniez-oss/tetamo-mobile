import * as DocumentPicker from "expo-document-picker";
import {
    ArrowLeft,
    Check,
    FileText,
    Handshake,
    HelpCircle,
    ShieldCheck,
    Upload,
} from "lucide-react-native";
import {
    useEffect,
    useMemo,
    useRef,
    useState,
    type Dispatch,
    type ReactNode,
    type SetStateAction,
} from "react";
import {
    Alert,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import type { ListingDraft } from "./ListingDraftContext";

type Language = "en" | "id";

type VerificationDraft = {
  relationship?: "pemilik" | "keluarga" | "kuasa" | "lainnya" | "";
  otherRelationship?: string;

  sellMode?: "jual_sendiri" | "pakai_agen" | "";
  needAgentRecommendation?: "ya" | "tidak" | "";
  needTransactionSupport?: "ya" | "tidak" | "";

  note?: string;

  ownershipPdfName?: string;
  authorizationPdfName?: string;

  status?: "pending_verification" | "verified" | "rejected";
};

type Props = {
  draft: ListingDraft;
  setDraft: Dispatch<SetStateAction<ListingDraft>>;
  onBack: () => void;
  onNextCreate: () => void;
  onNextEdit: () => void;
  language?: Language;
};

export default function ListingVerifikasi({
  draft,
  setDraft,
  onBack,
  onNextCreate,
  onNextEdit,
  language = "en",
}: Props) {
  const isId = language === "id";
  const hydratedRef = useRef(false);

  const mode = draft.mode === "edit" ? "edit" : "create";
  const initial = ((draft.verification || {}) as VerificationDraft) ?? {};

  const [relationship, setRelationship] =
    useState<VerificationDraft["relationship"]>(initial.relationship ?? "");
  const [otherRelationship, setOtherRelationship] = useState(
    initial.otherRelationship ?? ""
  );
  const [sellMode, setSellMode] = useState<VerificationDraft["sellMode"]>(
    initial.sellMode ?? "jual_sendiri"
  );
  const [needAgentRecommendation, setNeedAgentRecommendation] =
    useState<VerificationDraft["needAgentRecommendation"]>(
      initial.needAgentRecommendation ?? ""
    );
  const [needTransactionSupport, setNeedTransactionSupport] =
    useState<VerificationDraft["needTransactionSupport"]>(
      initial.needTransactionSupport ?? ""
    );
  const [note, setNote] = useState(initial.note ?? "");
  const [ownershipPdfName, setOwnershipPdfName] = useState(
    initial.ownershipPdfName ?? ""
  );
  const [authorizationPdfName, setAuthorizationPdfName] = useState(
    initial.authorizationPdfName ?? ""
  );

  const t = useMemo(() => {
    if (isId) {
      return {
        back: "Kembali",
        pageTitle: "Step 4 • Konfirmasi Kepemilikan",
        subtitle:
          "Untuk menjaga platform tetap premium & terpercaya, kami minta konfirmasi hubungan Anda dengan properti dan pilihan bantuan profesional.",

        relationshipTitle: "Hubungan dengan Properti",
        relationshipOwner: "Saya pemilik",
        relationshipFamily: "Saya keluarga pemilik",
        relationshipProxy: "Saya pegang surat kuasa",
        relationshipOther: "Lainnya",
        relationshipOtherPlaceholder: "Jelaskan hubungan Anda...",

        sellModeTitle: "Cara Anda ingin menjual/menyewakan",
        sellMyself: "Saya ingin jual sendiri",
        sellMyselfDesc:
          "Anda handle komunikasi & negosiasi sendiri. Tetamo bantu exposure + trust layer.",
        useAgent: "Saya ingin pakai agen",
        useAgentDesc:
          "Untuk bantu nego, dokumen, jadwal viewing, & proses closing.",

        needAgentTitle:
          "Apakah Anda butuh TETAMO merekomendasikan agen di area Anda?",
        needAgentYes: "Ya, rekomendasikan agen",
        needAgentNo: "Tidak, saya sudah punya",

        needSupportTitle:
          "Apakah Anda butuh bantuan transaksi?",
        needSupportYes: "Ya, saya butuh bantuan transaksi",
        needSupportNo: "Tidak, saya urus sendiri",
        supportNote:
          "Tetamo bisa bekerja dengan agen dari berbagai agency — itu normal & aman, selama verifikasi jelas.",

        ownershipPdfTitle: "Bukti Kepemilikan PDF",
        ownershipPdfDesc:
          "Contoh: sertifikat/SHM/HGB, atau dokumen pendukung.",
        authorizationPdfTitle: "Surat Kuasa PDF — jika ada",
        authorizationPdfDesc:
          "Jika Anda bukan pemilik langsung / diwakilkan.",
        choosePdf: "Pilih PDF",
        noFileYet: "Belum ada file",
        pdfOnly: "Pilih file PDF saja.",

        noteTitle: "Catatan",
        notePlaceholder:
          "Contoh: properti milik orang tua, butuh bantuan agen, jam viewing tertentu, dsb.",

        submitEdit: "Submit untuk Persetujuan",
        continueToPayment: "Lanjut ke Pembayaran",
        incompleteNote:
          "Lengkapi pilihan wajib: hubungan, mode jual/sewa, rekomendasi agen, dan bantuan transaksi.",
      };
    }

    return {
      back: "Back",
      pageTitle: "Step 4 • Ownership Confirmation",
      subtitle:
        "To keep the platform premium and trusted, confirm your relationship to the property and your professional support preferences.",

      relationshipTitle: "Relationship to the Property",
      relationshipOwner: "I am the owner",
      relationshipFamily: "I am a family member of the owner",
      relationshipProxy: "I hold a power of attorney",
      relationshipOther: "Other",
      relationshipOtherPlaceholder: "Explain your relationship...",

      sellModeTitle: "How you want to sell/rent the property",
      sellMyself: "I want to sell by myself",
      sellMyselfDesc:
        "You handle communication and negotiation yourself. Tetamo helps with exposure and trust layer.",
      useAgent: "I want to use an agent",
      useAgentDesc:
        "For negotiation, documents, viewing schedule, and closing process support.",

      needAgentTitle:
        "Do you need TETAMO to recommend an agent in your area?",
      needAgentYes: "Yes, recommend an agent",
      needAgentNo: "No, I already have one",

      needSupportTitle:
        "Do you need transaction support?",
      needSupportYes: "Yes, I need transaction support",
      needSupportNo: "No, I will handle it myself",
      supportNote:
        "Tetamo can work with agents from different agencies — that is normal and safe, as long as verification is clear.",

      ownershipPdfTitle: "Proof of Ownership PDF",
      ownershipPdfDesc:
        "Example: certificate/SHM/HGB or supporting documents.",
      authorizationPdfTitle: "Power of Attorney PDF — if any",
      authorizationPdfDesc:
        "If you are not the direct owner / acting on behalf of the owner.",
      choosePdf: "Choose PDF",
      noFileYet: "No file yet",
      pdfOnly: "Please choose a PDF file only.",

      noteTitle: "Note",
      notePlaceholder:
        "Example: property belongs to parents, needs agent help, preferred viewing hours, etc.",

      submitEdit: "Submit for Approval",
      continueToPayment: "Continue to Payment",
      incompleteNote:
        "Complete all required choices: relationship, sell/rent mode, agent recommendation, and transaction support.",
    };
  }, [isId]);

  useEffect(() => {
    if (hydratedRef.current) return;

    const verification = ((draft.verification || {}) as VerificationDraft) ?? {};

    setRelationship(verification.relationship ?? "");
    setOtherRelationship(verification.otherRelationship ?? "");
    setSellMode(verification.sellMode ?? "jual_sendiri");
    setNeedAgentRecommendation(verification.needAgentRecommendation ?? "");
    setNeedTransactionSupport(verification.needTransactionSupport ?? "");
    setNote(verification.note ?? "");
    setOwnershipPdfName(verification.ownershipPdfName ?? "");
    setAuthorizationPdfName(verification.authorizationPdfName ?? "");

    hydratedRef.current = true;
  }, [draft.verification]);

  useEffect(() => {
    if (!hydratedRef.current) return;

    setDraft((prev) =>
      ({
        ...prev,
        verification: {
          relationship,
          otherRelationship,
          sellMode,
          needAgentRecommendation,
          needTransactionSupport,
          note,
          ownershipPdfName,
          authorizationPdfName,
          status: "pending_verification",
        } as VerificationDraft,
      }) as ListingDraft
    );
  }, [
    relationship,
    otherRelationship,
    sellMode,
    needAgentRecommendation,
    needTransactionSupport,
    note,
    ownershipPdfName,
    authorizationPdfName,
    setDraft,
  ]);

  const canSubmit = useMemo(() => {
    if (!relationship) return false;
    if (relationship === "lainnya" && otherRelationship.trim().length < 2) {
      return false;
    }
    if (!sellMode) return false;
    if (!needAgentRecommendation) return false;
    if (!needTransactionSupport) return false;

    return true;
  }, [
    relationship,
    otherRelationship,
    sellMode,
    needAgentRecommendation,
    needTransactionSupport,
  ]);

  async function choosePdf(type: "ownership" | "authorization") {
    const result = await DocumentPicker.getDocumentAsync({
      type: "application/pdf",
      copyToCacheDirectory: true,
      multiple: false,
    });

    if (result.canceled) return;

    const file = result.assets[0];

    if (!file) return;

    const mime = String(file.mimeType || "").toLowerCase();
    const name = String(file.name || "");

    if (mime && mime !== "application/pdf" && !name.toLowerCase().endsWith(".pdf")) {
      Alert.alert(t.pdfOnly);
      return;
    }

    if (type === "ownership") {
      setOwnershipPdfName(name);
      return;
    }

    setAuthorizationPdfName(name);
  }

  function handleNext() {
    if (!canSubmit) return;

    setDraft((prev) =>
      ({
        ...prev,
        verifiedOk: true,
        verification: {
          relationship,
          otherRelationship,
          sellMode,
          needAgentRecommendation,
          needTransactionSupport,
          note,
          ownershipPdfName,
          authorizationPdfName,
          status: "pending_verification",
        } as VerificationDraft,
      }) as ListingDraft
    );

    if (mode === "edit") {
      onNextEdit();
      return;
    }

    onNextCreate();
  }

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <Pressable style={styles.backButton} onPress={onBack}>
        <ArrowLeft color="#ffffff" size={15} />
        <Text style={styles.backButtonText}>{t.back}</Text>
      </Pressable>

      <View style={styles.header}>
        <Text style={styles.title}>{t.pageTitle}</Text>
        <Text style={styles.subtitle}>{t.subtitle}</Text>
      </View>

      <View style={styles.sectionCard}>
        <SectionHeader
          icon={<ShieldCheck color="#e6c15c" size={21} />}
          title={t.relationshipTitle}
          required
        />

        <OptionGrid
          value={relationship || ""}
          options={[
            { key: "pemilik", label: t.relationshipOwner },
            { key: "keluarga", label: t.relationshipFamily },
            { key: "kuasa", label: t.relationshipProxy },
            { key: "lainnya", label: t.relationshipOther },
          ]}
          onChange={(value) =>
            setRelationship(value as VerificationDraft["relationship"])
          }
        />

        {relationship === "lainnya" ? (
          <View style={styles.extraInputWrap}>
            <TextInput
              value={otherRelationship}
              onChangeText={setOtherRelationship}
              placeholder={t.relationshipOtherPlaceholder}
              placeholderTextColor="#777777"
              style={styles.input}
            />
          </View>
        ) : null}
      </View>

      <View style={styles.sectionCard}>
        <SectionHeader
          icon={<Handshake color="#e6c15c" size={21} />}
          title={t.sellModeTitle}
          required
        />

        <View style={styles.twoCards}>
          <LargeOptionCard
            active={sellMode === "jual_sendiri"}
            title={t.sellMyself}
            description={t.sellMyselfDesc}
            onPress={() => setSellMode("jual_sendiri")}
          />

          <LargeOptionCard
            active={sellMode === "pakai_agen"}
            title={t.useAgent}
            description={t.useAgentDesc}
            onPress={() => setSellMode("pakai_agen")}
          />
        </View>
      </View>

      <View style={styles.sectionCard}>
        <SectionHeader
          icon={<HelpCircle color="#e6c15c" size={21} />}
          title={t.needAgentTitle}
          required
        />

        <OptionGrid
          value={needAgentRecommendation || ""}
          options={[
            { key: "ya", label: t.needAgentYes },
            { key: "tidak", label: t.needAgentNo },
          ]}
          onChange={(value) =>
            setNeedAgentRecommendation(
              value as VerificationDraft["needAgentRecommendation"]
            )
          }
        />
      </View>

      <View style={styles.sectionCard}>
        <SectionHeader
          icon={<FileText color="#e6c15c" size={21} />}
          title={t.needSupportTitle}
          required
        />

        <OptionGrid
          value={needTransactionSupport || ""}
          options={[
            { key: "ya", label: t.needSupportYes },
            { key: "tidak", label: t.needSupportNo },
          ]}
          onChange={(value) =>
            setNeedTransactionSupport(
              value as VerificationDraft["needTransactionSupport"]
            )
          }
        />

        <Text style={styles.supportNote}>{t.supportNote}</Text>
      </View>

      <View style={styles.sectionCard}>
        <PdfBox
          title={t.ownershipPdfTitle}
          description={t.ownershipPdfDesc}
          fileName={ownershipPdfName}
          chooseText={t.choosePdf}
          emptyText={t.noFileYet}
          onChoose={() => void choosePdf("ownership")}
        />

        <View style={styles.pdfDivider} />

        <PdfBox
          title={t.authorizationPdfTitle}
          description={t.authorizationPdfDesc}
          fileName={authorizationPdfName}
          chooseText={t.choosePdf}
          emptyText={t.noFileYet}
          onChoose={() => void choosePdf("authorization")}
        />
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.inputLabel}>{t.noteTitle}</Text>

        <TextInput
          value={note}
          onChangeText={setNote}
          placeholder={t.notePlaceholder}
          placeholderTextColor="#777777"
          style={[styles.input, styles.textArea]}
          multiline
          textAlignVertical="top"
        />
      </View>

      <View style={styles.footerCard}>
        <Pressable
          style={[styles.nextButton, !canSubmit && styles.nextButtonDisabled]}
          disabled={!canSubmit}
          onPress={handleNext}
        >
          <Text style={styles.nextButtonText}>
            {mode === "edit" ? t.submitEdit : t.continueToPayment}
          </Text>
          <Check color="#111111" size={16} />
        </Pressable>

        {!canSubmit ? (
          <Text style={styles.validationText}>{t.incompleteNote}</Text>
        ) : null}
      </View>
    </ScrollView>
  );
}

function SectionHeader({
  icon,
  title,
  required,
}: {
  icon: ReactNode;
  title: string;
  required?: boolean;
}) {
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionIcon}>{icon}</View>
      <View style={styles.sectionHeaderText}>
        <Text style={styles.sectionTitle}>
          {title}
          {required ? <Text style={styles.required}> *</Text> : null}
        </Text>
      </View>
    </View>
  );
}

function OptionGrid({
  value,
  options,
  onChange,
}: {
  value: string;
  options: { key: string; label: string }[];
  onChange: (value: string) => void;
}) {
  return (
    <View style={styles.optionGrid}>
      {options.map((option) => {
        const active = value === option.key;

        return (
          <Pressable
            key={option.key}
            style={[styles.optionButton, active && styles.optionButtonActive]}
            onPress={() => onChange(option.key)}
          >
            <Text
              style={[
                styles.optionButtonText,
                active && styles.optionButtonTextActive,
              ]}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function LargeOptionCard({
  active,
  title,
  description,
  onPress,
}: {
  active: boolean;
  title: string;
  description: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={[styles.largeOptionCard, active && styles.largeOptionCardActive]}
      onPress={onPress}
    >
      <Text
        style={[
          styles.largeOptionTitle,
          active && styles.largeOptionTitleActive,
        ]}
      >
        {title}
      </Text>
      <Text
        style={[
          styles.largeOptionDesc,
          active && styles.largeOptionDescActive,
        ]}
      >
        {description}
      </Text>
    </Pressable>
  );
}

function PdfBox({
  title,
  description,
  fileName,
  chooseText,
  emptyText,
  onChoose,
}: {
  title: string;
  description: string;
  fileName: string;
  chooseText: string;
  emptyText: string;
  onChoose: () => void;
}) {
  return (
    <View style={styles.pdfBox}>
      <View style={styles.pdfIcon}>
        <Upload color="#e6c15c" size={19} />
      </View>

      <View style={styles.pdfTextBox}>
        <Text style={styles.pdfTitle}>{title}</Text>
        <Text style={styles.pdfDesc}>{description}</Text>

        <Pressable style={styles.pdfButton} onPress={onChoose}>
          <Text style={styles.pdfButtonText}>{chooseText}</Text>
        </Pressable>

        <Text style={styles.fileNameText}>{fileName || emptyText}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: "#050505",
  },
  content: {
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 38,
  },
  backButton: {
    alignSelf: "flex-start",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#343434",
    backgroundColor: "#101010",
    paddingHorizontal: 11,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 15,
  },
  backButtonText: {
    color: "#ffffff",
    fontSize: 11.5,
    fontWeight: "900",
  },
  header: {
    marginBottom: 16,
  },
  title: {
    color: "#ffffff",
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "900",
    letterSpacing: -0.6,
  },
  subtitle: {
    color: "#b8b8b8",
    fontSize: 12.7,
    lineHeight: 19,
    fontWeight: "700",
    marginTop: 7,
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
    marginBottom: 14,
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
  sectionHeaderText: {
    flex: 1,
  },
  sectionTitle: {
    color: "#ffffff",
    fontSize: 14,
    lineHeight: 19,
    fontWeight: "900",
  },
  required: {
    color: "#fb7185",
  },
  optionGrid: {
    gap: 9,
  },
  optionButton: {
    minHeight: 46,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#303030",
    backgroundColor: "#050505",
    justifyContent: "center",
    paddingHorizontal: 13,
    paddingVertical: 11,
  },
  optionButtonActive: {
    borderColor: "#e6c15c",
    backgroundColor: "#e6c15c",
  },
  optionButtonText: {
    color: "#ffffff",
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "900",
  },
  optionButtonTextActive: {
    color: "#111111",
  },
  extraInputWrap: {
    marginTop: 11,
  },
  inputLabel: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "900",
    marginBottom: 7,
  },
  input: {
    minHeight: 50,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#303030",
    backgroundColor: "#050505",
    color: "#ffffff",
    paddingHorizontal: 13,
    paddingVertical: 12,
    fontSize: 13,
    fontWeight: "700",
  },
  textArea: {
    minHeight: 120,
  },
  twoCards: {
    gap: 10,
  },
  largeOptionCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#303030",
    backgroundColor: "#050505",
    padding: 13,
  },
  largeOptionCardActive: {
    borderColor: "#e6c15c",
    backgroundColor: "#211a0b",
  },
  largeOptionTitle: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "900",
  },
  largeOptionTitleActive: {
    color: "#e6c15c",
  },
  largeOptionDesc: {
    color: "#a9a9a9",
    fontSize: 11.3,
    lineHeight: 16,
    fontWeight: "700",
    marginTop: 5,
  },
  largeOptionDescActive: {
    color: "#d6d6d6",
  },
  supportNote: {
    color: "#a9a9a9",
    fontSize: 11.3,
    lineHeight: 16,
    fontWeight: "700",
    marginTop: 10,
  },
  pdfBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 11,
  },
  pdfIcon: {
    width: 42,
    height: 42,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#705d2c",
    backgroundColor: "#211a0b",
    alignItems: "center",
    justifyContent: "center",
  },
  pdfTextBox: {
    flex: 1,
  },
  pdfTitle: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "900",
  },
  pdfDesc: {
    color: "#a9a9a9",
    fontSize: 11.3,
    lineHeight: 16,
    fontWeight: "700",
    marginTop: 4,
  },
  pdfButton: {
    alignSelf: "flex-start",
    minHeight: 37,
    borderRadius: 13,
    backgroundColor: "#e6c15c",
    justifyContent: "center",
    paddingHorizontal: 12,
    marginTop: 10,
  },
  pdfButtonText: {
    color: "#111111",
    fontSize: 11.5,
    fontWeight: "900",
  },
  fileNameText: {
    color: "#d6d6d6",
    fontSize: 11.3,
    lineHeight: 16,
    fontWeight: "700",
    marginTop: 8,
  },
  pdfDivider: {
    height: 1,
    backgroundColor: "#202020",
    marginVertical: 15,
  },
  footerCard: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#303030",
    backgroundColor: "#101010",
    padding: 15,
    gap: 10,
  },
  nextButton: {
    minHeight: 49,
    borderRadius: 17,
    backgroundColor: "#e6c15c",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    paddingHorizontal: 14,
  },
  nextButtonDisabled: {
    opacity: 0.45,
  },
  nextButtonText: {
    color: "#111111",
    fontSize: 13,
    fontWeight: "900",
  },
  validationText: {
    color: "#a9a9a9",
    fontSize: 11.5,
    lineHeight: 16,
    fontWeight: "700",
    textAlign: "center",
  },
});