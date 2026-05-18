import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
  ArrowLeft,
  Headphones,
  LogIn,
  Send,
  Sparkles,
  UserPlus,
  XCircle,
} from "lucide-react-native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { supabase } from "../lib/supabase";

type Language = "en" | "id";

type SupportConversation = {
  id: string;
  user_id?: string | null;
  guest_session_id?: string | null;
  source?: string | null;
  status?: string | null;
  handoff_requested?: boolean | null;
  handoff_status?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  last_message_at?: string | null;
};

type SupportMessage = {
  id: string;
  conversation_id: string;
  sender_type: "user" | "ai" | "admin";
  message_text: string;
  ai_status: string | null;
  suggested_action: string | null;
  suggested_action_label: string | null;
  created_at: string;
};

type AuthPromptMode = "handoff" | null;
type AiFeedbackChoice = "yes" | "no";

const GUEST_SESSION_KEY = "scorpio_assist_guest_session_id";
const GUEST_MESSAGES_KEY = "scorpio_assist_guest_messages";

const CONVERSATION_SELECT =
  "id, user_id, guest_session_id, source, status, handoff_requested, handoff_status, created_at, updated_at, last_message_at";

const MESSAGE_SELECT =
  "id, conversation_id, sender_type, message_text, ai_status, suggested_action, suggested_action_label, created_at";

function getDisplayMessageText(value: string, language: Language) {
  const raw = String(value || "").trim();

  if (!raw) return "";

  try {
    const parsed = JSON.parse(raw);

    if (
      parsed &&
      typeof parsed === "object" &&
      typeof parsed[language] === "string" &&
      parsed[language].trim()
    ) {
      return parsed[language].trim();
    }

    const fallbackLanguage: Language = language === "id" ? "en" : "id";

    if (
      parsed &&
      typeof parsed === "object" &&
      typeof parsed[fallbackLanguage] === "string" &&
      parsed[fallbackLanguage].trim()
    ) {
      return parsed[fallbackLanguage].trim();
    }
  } catch {
    return raw;
  }

  return raw;
}

function createLocalMessage(
  messageText: string,
  senderType: "user" | "ai" | "admin",
  conversationId = "guest-local",
): SupportMessage {
  return {
    id: `${senderType}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    conversation_id: conversationId,
    sender_type: senderType,
    message_text: messageText,
    ai_status: senderType === "ai" ? "completed" : null,
    suggested_action: null,
    suggested_action_label: null,
    created_at: new Date().toISOString(),
  };
}

export default function ScorpioAssistScreen() {
  const router = useRouter();
  const scrollRef = useRef<ScrollView | null>(null);

  const [language, setLanguage] = useState<Language>("en");
  const [userId, setUserId] = useState<string | null>(null);
  const [conversation, setConversation] = useState<SupportConversation | null>(
    null,
  );
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [input, setInput] = useState("");
  const [guestSessionId, setGuestSessionId] = useState<string | null>(null);

  const [loadingAuth, setLoadingAuth] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [loadingConversation, setLoadingConversation] = useState(false);
  const [sending, setSending] = useState(false);
  const [handoffLoading, setHandoffLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [authPrompt, setAuthPrompt] = useState<AuthPromptMode>(null);
  const [aiFeedbackMap, setAiFeedbackMap] = useState<
    Record<string, AiFeedbackChoice>
  >({});

  const isId = language === "id";
  const waitingForAgent = conversation?.handoff_status === "waiting_agent";

  const conversationSource = useMemo(
    () => `mobile_chat_${language}`,
    [language],
  );

  const guestConversationSource = useMemo(
    () => `mobile_chat_guest_${language}`,
    [language],
  );

  const ui = useMemo(() => {
    if (isId) {
      return {
        back: "Kembali",
        title: "Scorpio Assist",
        subtitle: "AI support & sales assistant Tetamo",
        description:
          "Tanya tentang buyer/renter, owner, agent, developer, paket, QRIS/debit/kredit, listing, signup, dan cara kerja Tetamo.",
        supportHoursTitle: "Jam support Tetamo Agent",
        supportHours: "Senin - Jumat, 9:00 pagi - 6:00 sore.",
        waitingAgent: "Menunggu Tetamo Agent bergabung...",
        loadingChat: "Memuat chat...",
        emptyIntro:
          "Halo, saya Scorpio Assist. Saya bisa bantu buyer/renter, owner, agent, developer, dan guest tentang listing, paket, QRIS/debit/kredit, signup, pembayaran, dan marketplace Tetamo.",
        tryAsk: "Coba tanya",
        inputPlaceholder: "Tulis pertanyaan Anda...",
        handoff: "Chat dengan Tetamo Agent",
        handoffLoginTitle: "Login untuk chat dengan Tetamo Agent",
        handoffLoginDesc:
          "Untuk diteruskan ke Tetamo Agent, silakan login atau daftar terlebih dahulu.",
        login: "Login",
        signup: "Daftar",
        helpQuestion: "Apakah jawaban ini membantu?",
        yesHelped: "Ya, membantu",
        noNeedMore: "Belum, butuh bantuan",
        helpedText:
          "Senang bisa membantu. Anda bisa tanya lagi kapan saja tentang listing, paket, signup, pembayaran QRIS/debit/kredit, atau marketplace Tetamo.",
        notClearText:
          "Maaf kalau jawabannya belum jelas. Silakan tulis bagian yang masih membingungkan, atau lanjut chat dengan Tetamo Agent.",
        footerNote:
          "Scorpio Assist terbuka untuk semua pengguna. Login hanya diperlukan untuk bantuan Tetamo Agent, riwayat chat tersimpan, dan bantuan khusus akun.",
        authLoading: "Mengecek akun...",
        failedGuest: "Pesan guest gagal dikirim.",
        failedMessage: "Pesan gagal dikirim.",
        failedStart: "Tidak dapat memulai chat saat ini.",
        failedHandoff: "Gagal meminta bantuan Tetamo Agent.",
        loginRequired: "Login diperlukan untuk bantuan Tetamo Agent.",
      };
    }

    return {
      back: "Back",
      title: "Scorpio Assist",
      subtitle: "Tetamo AI support & sales assistant",
      description:
        "Ask about buyers/renters, owners, agents, developers, packages, QRIS/debit/credit payment, listings, signup, and how Tetamo works.",
      supportHoursTitle: "Tetamo Agent support hours",
      supportHours: "Monday - Friday, 9:00 AM - 6:00 PM.",
      waitingAgent: "Waiting for Tetamo Agent to join...",
      loadingChat: "Loading chat...",
      emptyIntro:
        "Hi, I’m Scorpio Assist. I can help buyers/renters, owners, agents, developers, and guests with listings, packages, QRIS/debit/credit payment, signup, payment, and the Tetamo marketplace.",
      tryAsk: "Try asking",
      inputPlaceholder: "Write your question...",
      handoff: "Chat with Tetamo Agent",
      handoffLoginTitle: "Log in to chat with Tetamo Agent",
      handoffLoginDesc:
        "To continue with Tetamo Agent, please log in or sign up first.",
      login: "Log in",
      signup: "Sign up",
      helpQuestion: "Did this solve your problem?",
      yesHelped: "Yes, it helped",
      noNeedMore: "No, I need more help",
      helpedText:
        "Glad I could help. You can ask me anytime about Tetamo listings, packages, signup, QRIS/debit/credit payment, or marketplace.",
      notClearText:
        "Sorry if the answer was not clear yet. Please tell me what part is still confusing, or continue with a Tetamo Agent.",
      footerNote:
        "Scorpio Assist is open to all users. Login is only required for Tetamo Agent support, saved chat history, and account-specific help.",
      authLoading: "Checking account...",
      failedGuest: "Guest message failed to send.",
      failedMessage: "Message failed to send.",
      failedStart: "Unable to start chat right now.",
      failedHandoff: "Failed to request a Tetamo Agent.",
      loginRequired: "Login is required for Tetamo Agent support.",
    };
  }, [isId]);

  const starterQuestions = useMemo(() => {
    if (isId) {
      return [
        "Saya buyer/renter, cara cari dan hubungi listing?",
        "Bagaimana cara pasang listing sebagai owner?",
        "Berapa harga paket agent Tetamo?",
        "Bisa bayar pakai QRIS, debit, atau kredit?",
        "Saya developer, bagaimana kerja sama dengan Tetamo?",
      ];
    }

    return [
      "I’m a buyer/renter. How do I find and contact listings?",
      "How do I list my property as an owner?",
      "What are Tetamo agent package prices?",
      "Can I pay with QRIS, debit, or credit card?",
      "I’m a developer. How can I work with Tetamo?",
    ];
  }, [isId]);

  const latestAiMessageId = useMemo(() => {
    for (let index = messages.length - 1; index >= 0; index -= 1) {
      if (messages[index]?.sender_type === "ai") {
        return messages[index].id;
      }
    }

    return "";
  }, [messages]);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 120);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, waitingForAgent, authPrompt, aiFeedbackMap, scrollToBottom]);

  useEffect(() => {
    let ignore = false;

    async function loadAuthAndGuestState() {
      setLoadingAuth(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (ignore) return;

      setUserId(user?.id ?? null);

      const [savedGuestSessionId, savedGuestMessages] = await Promise.all([
        AsyncStorage.getItem(GUEST_SESSION_KEY),
        AsyncStorage.getItem(GUEST_MESSAGES_KEY),
      ]);

      if (ignore) return;

      if (savedGuestSessionId) {
        setGuestSessionId(savedGuestSessionId);
      }

      if (!user?.id && savedGuestMessages) {
        try {
          const parsed = JSON.parse(savedGuestMessages) as SupportMessage[];
          setMessages(Array.isArray(parsed) ? parsed : []);
        } catch {
          setMessages([]);
        }
      }

      setLoadingAuth(false);
    }

    void loadAuthAndGuestState();

    return () => {
      ignore = true;
    };
  }, []);

  const refreshConversation = useCallback(async (conversationId: string) => {
    const { data, error } = await supabase
      .from("support_conversations")
      .select(CONVERSATION_SELECT)
      .eq("id", conversationId)
      .maybeSingle();

    if (error) {
      console.log("Failed to refresh conversation:", error);
      return;
    }

    if (data) {
      setConversation(data as SupportConversation);
    }
  }, []);

  const refreshMessages = useCallback(async (conversationId: string) => {
    setLoadingMessages(true);

    const { data, error } = await supabase
      .from("support_messages")
      .select(MESSAGE_SELECT)
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    if (error) {
      console.log("Failed to refresh messages:", error);
      setLoadingMessages(false);
      return;
    }

    setMessages((data ?? []) as SupportMessage[]);
    setLoadingMessages(false);
  }, []);

  const syncConversationSource = useCallback(
    async (conversationId: string, nextSource: string) => {
      const { data, error } = await supabase
        .from("support_conversations")
        .update({
          source: nextSource,
        })
        .eq("id", conversationId)
        .select(CONVERSATION_SELECT)
        .maybeSingle();

      if (error) {
        console.log("Failed to sync conversation source:", error);
        return null;
      }

      if (data) {
        const updated = data as SupportConversation;
        setConversation(updated);
        return updated;
      }

      return null;
    },
    [],
  );

  const loadExistingConversation = useCallback(async () => {
    if (!userId) return;

    const { data, error } = await supabase
      .from("support_conversations")
      .select(CONVERSATION_SELECT)
      .eq("user_id", userId)
      .eq("status", "open")
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.log("Failed to load existing conversation:", error);
      return;
    }

    if (data) {
      let existing = data as SupportConversation;

      if (existing.source !== conversationSource) {
        const synced = await syncConversationSource(
          existing.id,
          conversationSource,
        );

        if (synced) {
          existing = synced;
        }
      }

      setConversation(existing);
      await refreshMessages(existing.id);
    }
  }, [conversationSource, refreshMessages, syncConversationSource, userId]);

  useEffect(() => {
    if (!userId) return;

    void loadExistingConversation();
  }, [loadExistingConversation, userId]);

  useEffect(() => {
    if (!userId || !conversation?.id) return;

    const timer = setInterval(() => {
      void refreshConversation(conversation.id);
      void refreshMessages(conversation.id);
    }, 3000);

    return () => {
      clearInterval(timer);
    };
  }, [conversation?.id, refreshConversation, refreshMessages, userId]);

  async function persistGuestState(
    nextGuestSessionId: string,
    nextMessages: SupportMessage[],
  ) {
    await AsyncStorage.setItem(GUEST_SESSION_KEY, nextGuestSessionId);
    await AsyncStorage.setItem(
      GUEST_MESSAGES_KEY,
      JSON.stringify(nextMessages),
    );
  }

  async function initConversation() {
    if (!userId) return null;

    setLoadingConversation(true);
    setErrorMessage("");

    try {
      const { data: existing, error: existingError } = await supabase
        .from("support_conversations")
        .select(CONVERSATION_SELECT)
        .eq("user_id", userId)
        .eq("status", "open")
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (existingError) throw existingError;

      let activeConversation = existing as SupportConversation | null;

      if (
        activeConversation?.id &&
        activeConversation.source !== conversationSource
      ) {
        const synced = await syncConversationSource(
          activeConversation.id,
          conversationSource,
        );

        if (synced) {
          activeConversation = synced;
        }
      }

      if (!activeConversation) {
        const { data: created, error: createError } = await supabase
          .from("support_conversations")
          .insert({
            user_id: userId,
            source: conversationSource,
            status: "open",
            handoff_requested: false,
            handoff_status: "ai_active",
          })
          .select(CONVERSATION_SELECT)
          .maybeSingle();

        if (createError) throw createError;

        activeConversation = created as SupportConversation | null;
      }

      if (!activeConversation) {
        throw new Error("Failed to create or load support conversation.");
      }

      setConversation(activeConversation);
      await refreshMessages(activeConversation.id);

      return activeConversation;
    } catch (error: any) {
      console.log("Failed to initialize conversation:", error);
      setErrorMessage(error?.message || ui.failedStart);
      return null;
    } finally {
      setLoadingConversation(false);
    }
  }

  async function sendGuestMessage(messageText: string) {
    setSending(true);
    setErrorMessage("");
    setAuthPrompt(null);

    const optimisticUserMessage = createLocalMessage(messageText, "user");
    const previousMessages = messages;

    setMessages((prev) => [...prev, optimisticUserMessage]);

    try {
      const body: Record<string, string> = {
        message_text: messageText,
        language,
        source: guestConversationSource,
      };

      if (guestSessionId) {
        body.guest_session_id = guestSessionId;
      }

      const { data, error } = await supabase.functions.invoke(
        "scorpio-assist-guest",
        {
          body,
        },
      );

      if (error) throw error;

      if (!data?.ok) {
        throw new Error(data?.error || "Guest chat failed.");
      }

      const nextGuestSessionId = String(data.guest_session_id || "");
      const nextMessages = (data.messages ?? []) as SupportMessage[];
      const nextConversation = (data.conversation ??
        null) as SupportConversation | null;

      if (nextGuestSessionId) {
        setGuestSessionId(nextGuestSessionId);
        await persistGuestState(nextGuestSessionId, nextMessages);
      }

      setConversation(nextConversation);
      setMessages(nextMessages);
      setInput("");
    } catch (error: any) {
      console.log("Failed to send guest message:", error);
      setMessages(previousMessages);
      setErrorMessage(error?.message || ui.failedGuest);
    } finally {
      setSending(false);
    }
  }

  async function handleSendMessage() {
    const trimmed = input.trim();
    if (!trimmed || sending) return;

    setErrorMessage("");

    if (!userId) {
      await sendGuestMessage(trimmed);
      return;
    }

    let activeConversation = conversation;

    if (!activeConversation) {
      activeConversation = await initConversation();
    }

    if (!activeConversation) return;

    if (activeConversation.source !== conversationSource) {
      const synced = await syncConversationSource(
        activeConversation.id,
        conversationSource,
      );

      if (synced) {
        activeConversation = synced;
      }
    }

    setSending(true);

    const optimisticUserMessage = createLocalMessage(
      trimmed,
      "user",
      activeConversation.id,
    );

    setMessages((prev) => [...prev, optimisticUserMessage]);

    try {
      const { error } = await supabase.from("support_messages").insert({
        conversation_id: activeConversation.id,
        sender_type: "user",
        message_text: trimmed,
        ai_status: "pending",
      });

      if (error) throw error;

      setInput("");
      await refreshConversation(activeConversation.id);
      await refreshMessages(activeConversation.id);
    } catch (error: any) {
      console.log("Failed to send message:", error);
      setErrorMessage(error?.message || ui.failedMessage);
      await refreshMessages(activeConversation.id);
    } finally {
      setSending(false);
    }
  }

  async function handleHandoff() {
    setErrorMessage("");

    if (!userId) {
      setAuthPrompt("handoff");
      return;
    }

    setAuthPrompt(null);

    let activeConversation = conversation;

    if (!activeConversation) {
      activeConversation = await initConversation();
    }

    if (!activeConversation) return;

    if (activeConversation.source !== conversationSource) {
      const synced = await syncConversationSource(
        activeConversation.id,
        conversationSource,
      );

      if (synced) {
        activeConversation = synced;
      }
    }

    setHandoffLoading(true);

    try {
      const { error } = await supabase
        .from("support_conversations")
        .update({
          handoff_requested: true,
          handoff_status: "waiting_agent",
          handoff_requested_at: new Date().toISOString(),
          handoff_requested_by: "user",
        })
        .eq("id", activeConversation.id);

      if (error) throw error;

      await refreshConversation(activeConversation.id);
      await refreshMessages(activeConversation.id);
    } catch (error: any) {
      console.log("Failed to request handoff:", error);
      setErrorMessage(error?.message || ui.failedHandoff);
    } finally {
      setHandoffLoading(false);
    }
  }

  function handleAiFeedback(messageId: string, choice: AiFeedbackChoice) {
    setAiFeedbackMap((prev) => ({
      ...prev,
      [messageId]: choice,
    }));
  }

  function formatMessageTime(value: string) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";

    return new Intl.DateTimeFormat(isId ? "id-ID" : "en-GB", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  }

  function useStarterQuestion(question: string) {
    setInput(question);
  }

  function openLogin() {
    router.push("/login" as any);
  }

  function openSignup() {
    router.push("/signup" as any);
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.topBar}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeft color="#ffffff" size={15} />
            <Text style={styles.backText}>{ui.back}</Text>
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

        <View style={styles.headerCard}>
          <View style={styles.headerTop}>
            <View style={styles.scorpioAvatar}>
              <Sparkles color="#111111" size={24} />
            </View>

            <View style={styles.headerTextBox}>
              <Text style={styles.headerTitle}>{ui.title}</Text>
              <Text style={styles.headerSubtitle}>{ui.subtitle}</Text>
            </View>
          </View>

          <Text style={styles.headerDescription}>{ui.description}</Text>

          <View style={styles.supportHoursBox}>
            <Text style={styles.supportHoursTitle}>{ui.supportHoursTitle}</Text>
            <Text style={styles.supportHoursText}>{ui.supportHours}</Text>
          </View>
        </View>

        {waitingForAgent ? (
          <View style={styles.waitingBanner}>
            <Headphones color="#111111" size={15} />
            <Text style={styles.waitingText}>{ui.waitingAgent}</Text>
          </View>
        ) : null}

        <ScrollView
          ref={scrollRef}
          style={styles.messagesScroll}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {loadingAuth ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator color="#e6c15c" />
              <Text style={styles.loadingText}>{ui.authLoading}</Text>
            </View>
          ) : loadingMessages && messages.length === 0 ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator color="#e6c15c" />
              <Text style={styles.loadingText}>{ui.loadingChat}</Text>
            </View>
          ) : messages.length > 0 ? (
            messages.map((message) => {
              const isUser = message.sender_type === "user";
              const isAi = message.sender_type === "ai";
              const isLatestAiMessage =
                isAi && message.id === latestAiMessageId;
              const feedbackChoice = aiFeedbackMap[message.id];

              return (
                <View
                  key={message.id}
                  style={[
                    styles.messageOuter,
                    isUser ? styles.messageOuterUser : styles.messageOuterBot,
                  ]}
                >
                  <View
                    style={[
                      styles.messageBubble,
                      isUser ? styles.userBubble : styles.botBubble,
                    ]}
                  >
                    {!isUser ? (
                      <View style={styles.messageBotHeader}>
                        <View style={styles.messageBotIcon}>
                          <Sparkles color="#e6c15c" size={13} />
                        </View>
                        <Text style={styles.messageBotName}>
                          Scorpio Assist
                        </Text>
                      </View>
                    ) : null}

                    <Text
                      style={[
                        styles.messageText,
                        isUser ? styles.userMessageText : styles.botMessageText,
                      ]}
                    >
                      {getDisplayMessageText(message.message_text, language)}
                    </Text>
                  </View>

                  <Text
                    style={[
                      styles.messageTime,
                      isUser ? styles.messageTimeUser : styles.messageTimeBot,
                    ]}
                  >
                    {formatMessageTime(message.created_at)}
                  </Text>

                  {isAi &&
                  message.suggested_action === "handoff_to_human" &&
                  !waitingForAgent ? (
                    <Pressable
                      style={styles.inlineHandoffButton}
                      disabled={handoffLoading}
                      onPress={() => void handleHandoff()}
                    >
                      {handoffLoading ? (
                        <ActivityIndicator color="#111111" />
                      ) : (
                        <Headphones color="#111111" size={15} />
                      )}
                      <Text style={styles.inlineHandoffText}>
                        {message.suggested_action_label || ui.handoff}
                      </Text>
                    </Pressable>
                  ) : null}

                  {isLatestAiMessage && !waitingForAgent ? (
                    <View style={styles.feedbackCard}>
                      <Text style={styles.feedbackTitle}>
                        {ui.helpQuestion}
                      </Text>

                      <View style={styles.feedbackRow}>
                        <Pressable
                          style={[
                            styles.feedbackButton,
                            feedbackChoice === "yes" &&
                              styles.feedbackButtonActiveDark,
                          ]}
                          onPress={() => handleAiFeedback(message.id, "yes")}
                        >
                          <Text
                            style={[
                              styles.feedbackButtonText,
                              feedbackChoice === "yes" &&
                                styles.feedbackButtonTextActive,
                            ]}
                          >
                            {ui.yesHelped}
                          </Text>
                        </Pressable>

                        <Pressable
                          style={[
                            styles.feedbackButton,
                            feedbackChoice === "no" &&
                              styles.feedbackButtonActiveGold,
                          ]}
                          onPress={() => handleAiFeedback(message.id, "no")}
                        >
                          <Text
                            style={[
                              styles.feedbackButtonText,
                              feedbackChoice === "no" &&
                                styles.feedbackButtonTextDark,
                            ]}
                          >
                            {ui.noNeedMore}
                          </Text>
                        </Pressable>
                      </View>

                      {feedbackChoice === "yes" ? (
                        <Text style={styles.feedbackDescription}>
                          {ui.helpedText}
                        </Text>
                      ) : null}

                      {feedbackChoice === "no" ? (
                        <View style={styles.feedbackHandoffBox}>
                          <Text style={styles.feedbackDescription}>
                            {ui.notClearText}
                          </Text>

                          <Pressable
                            style={styles.feedbackHandoffButton}
                            disabled={handoffLoading}
                            onPress={() => void handleHandoff()}
                          >
                            {handoffLoading ? (
                              <ActivityIndicator color="#111111" />
                            ) : (
                              <Headphones color="#111111" size={15} />
                            )}
                            <Text style={styles.feedbackHandoffText}>
                              {ui.handoff}
                            </Text>
                          </Pressable>
                        </View>
                      ) : null}
                    </View>
                  ) : null}
                </View>
              );
            })
          ) : (
            <View>
              <View style={styles.messageOuter}>
                <View style={styles.botBubble}>
                  <View style={styles.messageBotHeader}>
                    <View style={styles.messageBotIcon}>
                      <Sparkles color="#e6c15c" size={13} />
                    </View>
                    <Text style={styles.messageBotName}>Scorpio Assist</Text>
                  </View>

                  <Text style={styles.botMessageText}>{ui.emptyIntro}</Text>
                </View>
              </View>

              <View style={styles.starterBox}>
                <Text style={styles.starterTitle}>{ui.tryAsk}</Text>

                <View style={styles.starterWrap}>
                  {starterQuestions.map((question) => (
                    <Pressable
                      key={question}
                      style={styles.starterPill}
                      onPress={() => useStarterQuestion(question)}
                    >
                      <Text style={styles.starterPillText}>{question}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            </View>
          )}

          {authPrompt ? (
            <View style={styles.authPromptCard}>
              <Text style={styles.authPromptTitle}>{ui.handoffLoginTitle}</Text>
              <Text style={styles.authPromptDesc}>{ui.handoffLoginDesc}</Text>

              <View style={styles.authPromptButtons}>
                <Pressable style={styles.loginButton} onPress={openLogin}>
                  <LogIn color="#ffffff" size={15} />
                  <Text style={styles.loginButtonText}>{ui.login}</Text>
                </Pressable>

                <Pressable style={styles.signupButton} onPress={openSignup}>
                  <UserPlus color="#111111" size={15} />
                  <Text style={styles.signupButtonText}>{ui.signup}</Text>
                </Pressable>
              </View>
            </View>
          ) : null}

          {errorMessage ? (
            <View style={styles.errorBox}>
              <XCircle color="#fecaca" size={17} />
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          ) : null}
        </ScrollView>

        <View style={styles.inputPanel}>
          <View style={styles.inputRow}>
            <TextInput
              value={input}
              onChangeText={setInput}
              placeholder={ui.inputPlaceholder}
              placeholderTextColor="#8e8e93"
              multiline
              style={styles.input}
            />

            <Pressable
              style={[
                styles.sendButton,
                (!input.trim() || sending) && styles.sendButtonDisabled,
              ]}
              disabled={!input.trim() || sending}
              onPress={() => void handleSendMessage()}
            >
              {sending ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Send color="#ffffff" size={17} />
              )}
            </Pressable>
          </View>

          <Pressable
            style={[
              styles.handoffButton,
              (handoffLoading || waitingForAgent || loadingConversation) &&
                styles.handoffButtonDisabled,
            ]}
            disabled={handoffLoading || waitingForAgent || loadingConversation}
            onPress={() => void handleHandoff()}
          >
            {handoffLoading || loadingConversation ? (
              <ActivityIndicator color="#111111" />
            ) : (
              <Headphones color="#111111" size={16} />
            )}
            <Text style={styles.handoffButtonText}>{ui.handoff}</Text>
          </Pressable>

          <Text style={styles.footerNote}>{ui.footerNote}</Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#050505",
  },
  keyboardView: {
    flex: 1,
  },
  topBar: {
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 10,
    backgroundColor: "#050505",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
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
    fontSize: 9.5,
    fontWeight: "900",
  },
  langTextActive: {
    color: "#111111",
  },
  headerCard: {
    marginHorizontal: 18,
    marginTop: 4,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "#5b4a24",
    backgroundColor: "#111827",
    padding: 16,
    overflow: "hidden",
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  scorpioAvatar: {
    width: 54,
    height: 54,
    borderRadius: 20,
    backgroundColor: "#e6c15c",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTextBox: {
    flex: 1,
  },
  headerTitle: {
    color: "#ffffff",
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: -0.4,
  },
  headerSubtitle: {
    color: "#e6c15c",
    fontSize: 12,
    fontWeight: "900",
    marginTop: 2,
  },
  headerDescription: {
    color: "#d6d6d6",
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "700",
    marginTop: 13,
  },
  supportHoursBox: {
    marginTop: 13,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(255,255,255,0.08)",
    padding: 11,
  },
  supportHoursTitle: {
    color: "#b8b8b8",
    fontSize: 9.5,
    fontWeight: "900",
    letterSpacing: 0.9,
    textTransform: "uppercase",
  },
  supportHoursText: {
    color: "#ffffff",
    fontSize: 11.5,
    lineHeight: 16,
    fontWeight: "800",
    marginTop: 4,
  },
  waitingBanner: {
    marginHorizontal: 18,
    marginTop: 10,
    borderRadius: 18,
    backgroundColor: "#e6c15c",
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  waitingText: {
    color: "#111111",
    fontSize: 11.5,
    fontWeight: "900",
    flex: 1,
  },
  messagesScroll: {
    flex: 1,
    backgroundColor: "#050505",
  },
  messagesContent: {
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 18,
  },
  loadingBox: {
    minHeight: 180,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  loadingText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "800",
  },
  messageOuter: {
    marginBottom: 13,
  },
  messageOuterUser: {
    alignItems: "flex-end",
  },
  messageOuterBot: {
    alignItems: "flex-start",
  },
  messageBubble: {
    maxWidth: "88%",
    borderRadius: 22,
    paddingHorizontal: 13,
    paddingVertical: 11,
  },
  userBubble: {
    backgroundColor: "#111827",
    borderWidth: 1,
    borderColor: "#303030",
  },
  botBubble: {
    maxWidth: "88%",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#303030",
    backgroundColor: "#101010",
    paddingHorizontal: 13,
    paddingVertical: 11,
  },
  messageBotHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginBottom: 7,
  },
  messageBotIcon: {
    width: 24,
    height: 24,
    borderRadius: 999,
    backgroundColor: "#211a0b",
    alignItems: "center",
    justifyContent: "center",
  },
  messageBotName: {
    color: "#a9a9a9",
    fontSize: 9.5,
    fontWeight: "900",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  messageText: {
    fontSize: 12.5,
    lineHeight: 19,
    fontWeight: "700",
  },
  userMessageText: {
    color: "#ffffff",
  },
  botMessageText: {
    color: "#ffffff",
    fontSize: 12.5,
    lineHeight: 19,
    fontWeight: "700",
  },
  messageTime: {
    fontSize: 10,
    fontWeight: "700",
    marginTop: 4,
    paddingHorizontal: 4,
  },
  messageTimeUser: {
    color: "#8e8e93",
    textAlign: "right",
  },
  messageTimeBot: {
    color: "#8e8e93",
    textAlign: "left",
  },
  inlineHandoffButton: {
    alignSelf: "flex-start",
    marginTop: 8,
    borderRadius: 16,
    backgroundColor: "#e6c15c",
    paddingHorizontal: 12,
    paddingVertical: 9,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  inlineHandoffText: {
    color: "#111111",
    fontSize: 11.5,
    fontWeight: "900",
  },
  feedbackCard: {
    maxWidth: "88%",
    marginTop: 8,
    borderRadius: 21,
    borderWidth: 1,
    borderColor: "#303030",
    backgroundColor: "#101010",
    padding: 12,
  },
  feedbackTitle: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "900",
  },
  feedbackRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 9,
  },
  feedbackButton: {
    flex: 1,
    minHeight: 38,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#333333",
    backgroundColor: "#050505",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  feedbackButtonActiveDark: {
    backgroundColor: "#111827",
    borderColor: "#111827",
  },
  feedbackButtonActiveGold: {
    backgroundColor: "#e6c15c",
    borderColor: "#e6c15c",
  },
  feedbackButtonText: {
    color: "#ffffff",
    fontSize: 10.5,
    fontWeight: "900",
    textAlign: "center",
  },
  feedbackButtonTextActive: {
    color: "#ffffff",
  },
  feedbackButtonTextDark: {
    color: "#111111",
  },
  feedbackDescription: {
    color: "#a9a9a9",
    fontSize: 11,
    lineHeight: 16,
    fontWeight: "700",
    marginTop: 8,
  },
  feedbackHandoffBox: {
    marginTop: 2,
  },
  feedbackHandoffButton: {
    minHeight: 40,
    borderRadius: 15,
    backgroundColor: "#e6c15c",
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },
  feedbackHandoffText: {
    color: "#111111",
    fontSize: 11.5,
    fontWeight: "900",
  },
  starterBox: {
    marginTop: 8,
  },
  starterTitle: {
    color: "#8e8e93",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.9,
    textTransform: "uppercase",
    marginBottom: 9,
  },
  starterWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  starterPill: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#303030",
    backgroundColor: "#101010",
    paddingHorizontal: 11,
    paddingVertical: 8,
  },
  starterPillText: {
    color: "#ffffff",
    fontSize: 10.8,
    fontWeight: "800",
  },
  authPromptCard: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#303030",
    backgroundColor: "#101010",
    padding: 14,
    marginTop: 4,
    marginBottom: 13,
  },
  authPromptTitle: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "900",
  },
  authPromptDesc: {
    color: "#a9a9a9",
    fontSize: 11.5,
    lineHeight: 17,
    fontWeight: "700",
    marginTop: 7,
  },
  authPromptButtons: {
    flexDirection: "row",
    gap: 9,
    marginTop: 13,
  },
  loginButton: {
    flex: 1,
    minHeight: 43,
    borderRadius: 15,
    backgroundColor: "#111827",
    borderWidth: 1,
    borderColor: "#303030",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },
  loginButtonText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "900",
  },
  signupButton: {
    flex: 1,
    minHeight: 43,
    borderRadius: 15,
    backgroundColor: "#e6c15c",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },
  signupButtonText: {
    color: "#111111",
    fontSize: 12,
    fontWeight: "900",
  },
  errorBox: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#7f1d1d",
    backgroundColor: "#2a0d0d",
    padding: 12,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  errorText: {
    color: "#fecaca",
    fontSize: 11.8,
    lineHeight: 17,
    fontWeight: "800",
    flex: 1,
  },
  inputPanel: {
    borderTopWidth: 1,
    borderTopColor: "#202020",
    backgroundColor: "#050505",
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 16,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 9,
  },
  input: {
    flex: 1,
    minHeight: 50,
    maxHeight: 110,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#303030",
    backgroundColor: "#101010",
    color: "#ffffff",
    paddingHorizontal: 14,
    paddingTop: 13,
    paddingBottom: 10,
    fontSize: 12.5,
    lineHeight: 18,
    fontWeight: "700",
  },
  sendButton: {
    width: 50,
    height: 50,
    borderRadius: 19,
    backgroundColor: "#111827",
    borderWidth: 1,
    borderColor: "#303030",
    alignItems: "center",
    justifyContent: "center",
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  handoffButton: {
    minHeight: 46,
    borderRadius: 17,
    backgroundColor: "#e6c15c",
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  handoffButtonDisabled: {
    opacity: 0.65,
  },
  handoffButtonText: {
    color: "#111111",
    fontSize: 12.5,
    fontWeight: "900",
  },
  footerNote: {
    color: "#8e8e93",
    fontSize: 10.5,
    lineHeight: 15,
    fontWeight: "700",
    marginTop: 9,
    textAlign: "center",
  },
});
