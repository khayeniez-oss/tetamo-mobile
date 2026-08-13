import {
  useLocalSearchParams,
  useRouter,
} from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
  ArrowLeft,
  Ban,
  Bot,
  Check,
  CheckCircle2,
  PauseCircle,
  PlayCircle,
  Send,
  ShieldCheck,
  UserRoundCheck,
  X,
} from "lucide-react-native";
import {
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import {
  adminWhatsappFetch,
  Conversation,
  formatWhatsAppDate,
  getAdWindowLabel,
  getChannelMeta,
  getConversationName,
  getConversationPhone,
  getMessageSourceLabel,
  getReplyWindowLabel,
  isDateOpen,
  MESSAGE_BATCH_SIZE,
  Message,
  SALES_STAGE_FILTERS,
  SALES_STAGE_LABELS,
  SalesStage,
} from "../../../lib/adminWhatsapp";

export default function AdminWhatsappThreadScreen() {
  const router =
    useRouter();

  const params =
    useLocalSearchParams();

  const conversationId =
    Array.isArray(
      params.conversationId
    )
      ? String(
          params
            .conversationId[0] ||
            ""
        )
      : String(
          params.conversationId ||
            ""
        );

  const [
    conversation,
    setConversation,
  ] =
    useState<Conversation | null>(
      null
    );

  const [
    messages,
    setMessages,
  ] =
    useState<Message[]>([]);

  const [
    visibleMessageCount,
    setVisibleMessageCount,
  ] = useState(
    MESSAGE_BATCH_SIZE
  );

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    actionLoading,
    setActionLoading,
  ] = useState("");

  const [
    sendingReply,
    setSendingReply,
  ] = useState(false);

  const [
    replyMessage,
    setReplyMessage,
  ] = useState("");

  const [
    stagePickerOpen,
    setStagePickerOpen,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const [
    successMessage,
    setSuccessMessage,
  ] = useState("");

  const selectedReplyWindowOpen =
    isDateOpen(
      conversation
        ?.window_expires_at
    );

  const selectedAdWindowOpen =
    isDateOpen(
      conversation
        ?.free_entry_point_expires_at
    );

  const selectedNumberBlocked =
    String(
      conversation?.status ||
        ""
    ).toLowerCase() ===
    "blocked";

  const visibleMessages =
    useMemo(() => {
      if (
        messages.length <=
        visibleMessageCount
      ) {
        return messages;
      }

      return messages.slice(
        messages.length -
          visibleMessageCount
      );
    }, [
      messages,
      visibleMessageCount,
    ]);

  const hiddenMessagesCount =
    Math.max(
      messages.length -
        visibleMessageCount,
      0
    );

  async function loadMessages() {
    if (!conversationId) {
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response =
        await adminWhatsappFetch(
          `/api/admin/whatsapp/conversations?conversationId=${encodeURIComponent(
            conversationId
          )}`
        );

      const result =
        await response
          .json()
          .catch(
            () => null
          );

      if (
        !response.ok ||
        !result?.success
      ) {
        throw new Error(
          result?.error ||
            "Failed to load WhatsApp messages."
        );
      }

      setConversation(
        result.conversation ||
          null
      );

      setMessages(
        result.messages || []
      );

      setVisibleMessageCount(
        MESSAGE_BATCH_SIZE
      );
    } catch (
      err: any
    ) {
      console.error(
        "Load WhatsApp messages error:",
        err
      );

      setError(
        err?.message ||
          "Failed to load WhatsApp messages."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadMessages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]);

  async function updateConversation(
    action: string
  ) {
    if (!conversationId) {
      return;
    }

    try {
      setActionLoading(
        action
      );

      setError("");
      setSuccessMessage("");

      const response =
        await adminWhatsappFetch(
          "/api/admin/whatsapp/conversations",
          {
            method: "PATCH",
            body: JSON.stringify({
              conversationId,
              action,
            }),
          }
        );

      const result =
        await response
          .json()
          .catch(
            () => null
          );

      if (
        !response.ok ||
        !result?.success
      ) {
        throw new Error(
          result?.error ||
            "Failed to update conversation."
        );
      }

      if (
        action ===
        "approve_stage_suggestion"
      ) {
        setSuccessMessage(
          "Mona's stage suggestion was approved."
        );
      } else if (
        action ===
        "ignore_stage_suggestion"
      ) {
        setSuccessMessage(
          "Mona's stage suggestion was ignored."
        );
      }

      await loadMessages();
    } catch (
      err: any
    ) {
      console.error(
        "Update WhatsApp conversation error:",
        err
      );

      setError(
        err?.message ||
          "Failed to update conversation."
      );
    } finally {
      setActionLoading("");
    }
  }

  async function updateSalesStage(
    salesStage: SalesStage
  ) {
    if (!conversationId) {
      return;
    }

    try {
      setActionLoading(
        `sales_stage:${salesStage}`
      );

      setError("");
      setSuccessMessage("");

      const response =
        await adminWhatsappFetch(
          "/api/admin/whatsapp/conversations",
          {
            method: "PATCH",
            body: JSON.stringify({
              conversationId,
              action:
                "update_sales_stage",
              salesStage,
            }),
          }
        );

      const result =
        await response
          .json()
          .catch(
            () => null
          );

      if (
        !response.ok ||
        !result?.success
      ) {
        throw new Error(
          result?.error ||
            "Failed to update sales stage."
        );
      }

      setSuccessMessage(
        `Moved to ${SALES_STAGE_LABELS[salesStage]}.`
      );

      await loadMessages();
    } catch (
      err: any
    ) {
      console.error(
        "Update WhatsApp sales stage error:",
        err
      );

      setError(
        err?.message ||
          "Failed to update sales stage."
      );
    } finally {
      setActionLoading("");
    }
  }

  async function sendAdminReply() {
    if (!conversationId) {
      return;
    }

    const cleanMessage =
      replyMessage.trim();

    if (
      selectedNumberBlocked
    ) {
      setError(
        "This WhatsApp number is blocked. Unblock the number before sending a reply."
      );

      return;
    }

    if (!cleanMessage) {
      setError(
        "Please write a reply before sending."
      );

      return;
    }

    if (
      !selectedReplyWindowOpen
    ) {
      setError(
        "The 24-hour reply window is closed. Use an approved template message for this customer."
      );

      return;
    }

    try {
      setSendingReply(
        true
      );

      setError("");
      setSuccessMessage("");

      const response =
        await adminWhatsappFetch(
          "/api/admin/whatsapp/send",
          {
            method: "POST",
            body: JSON.stringify({
              conversationId,
              message:
                cleanMessage,
            }),
          }
        );

      const result =
        await response
          .json()
          .catch(
            () => null
          );

      if (
        !response.ok ||
        !result?.success
      ) {
        setError(
          result?.error ||
            "Failed to send WhatsApp reply."
        );

        return;
      }

      setReplyMessage("");

      setSuccessMessage(
        `Reply sent through ${
          result.provider ===
          "meta"
            ? "Meta Direct"
            : "Twilio"
        }. AI remains paused until you resume it.`
      );

      await loadMessages();
    } catch (
      err: any
    ) {
      setError(
        err?.message ||
          "Failed to send WhatsApp reply."
      );
    } finally {
      setSendingReply(
        false
      );
    }
  }

  function confirmBlock() {
    Alert.alert(
      "Block this number?",
      "Mona and admin replies will be disabled.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Block",
          style:
            "destructive",
          onPress: () =>
            void updateConversation(
              "block_number"
            ),
        },
      ]
    );
  }

  function confirmUnblock() {
    Alert.alert(
      "Unblock this number?",
      "AI will remain paused until you manually resume it.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Unblock",
          onPress: () =>
            void updateConversation(
              "unblock_number"
            ),
        },
      ]
    );
  }

  const name =
    getConversationName(
      conversation
    );

  const phone =
    getConversationPhone(
      conversation
    );

  const channel =
    getChannelMeta(
      conversation?.channel
    );

  const currentStage =
    conversation
      ?.sales_stage ||
    "new_inquiry";

  return (
    <SafeAreaView
      style={
        styles.safeArea
      }
    >
      <StatusBar style="dark" />

      <KeyboardAvoidingView
        style={
          styles.keyboard
        }
        behavior={
          Platform.OS ===
          "ios"
            ? "padding"
            : undefined
        }
      >
        <View
          style={
            styles.header
          }
        >
          <Pressable
            style={
              styles.backButton
            }
            onPress={() =>
              router.back()
            }
          >
            <ArrowLeft
              size={19}
              color="#171717"
            />
          </Pressable>

          <View
            style={
              styles.headerPerson
            }
          >
            <View
              style={
                styles.avatar
              }
            >
              <Text
                style={
                  styles.avatarText
                }
              >
                {name
                  .charAt(0)
                  .toUpperCase() ||
                  "W"}
              </Text>
            </View>

            <View
              style={
                styles.headerCopy
              }
            >
              <Text
                numberOfLines={1}
                style={
                  styles.name
                }
              >
                {name}
              </Text>

              <Text
                numberOfLines={1}
                style={
                  styles.phone
                }
              >
                {phone}
              </Text>
            </View>
          </View>

          <View
            style={
              styles.aiHeaderBadge
            }
          >
            <Bot
              size={14}
              color="#8A6818"
            />
          </View>
        </View>

        <ScrollView
          style={
            styles.scroll
          }
          contentContainerStyle={
            styles.content
          }
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={
            false
          }
        >
          {loading ? (
            <View
              style={
                styles.loadingBox
              }
            >
              <ActivityIndicator
                color="#B8892E"
              />

              <Text
                style={
                  styles.loadingText
                }
              >
                Loading conversation...
              </Text>
            </View>
          ) : null}

          {!loading &&
          conversation ? (
            <>
              <View
                style={
                  styles.summaryCard
                }
              >
                <View
                  style={
                    styles.badgeRow
                  }
                >
                  <Badge
                    label={
                      SALES_STAGE_LABELS[
                        currentStage
                      ]
                    }
                    tone="purple"
                  />

                  <Badge
                    label={
                      channel.label
                    }
                    tone={
                      channel.key ===
                      "meta"
                        ? "blue"
                        : channel.key ===
                            "twilio"
                          ? "green"
                          : "gray"
                    }
                  />

                  <Badge
                    label={
                      getReplyWindowLabel(
                        conversation.window_expires_at
                      )
                    }
                    tone={
                      selectedReplyWindowOpen
                        ? "green"
                        : "gray"
                    }
                  />

                  <Badge
                    label={
                      getAdWindowLabel(
                        conversation.free_entry_point_expires_at
                      )
                    }
                    tone={
                      selectedAdWindowOpen
                        ? "blue"
                        : "gray"
                    }
                  />

                  <Badge
                    label={
                      conversation.handover_to_admin
                        ? "Needs Admin"
                        : conversation.ai_enabled
                          ? "AI Active"
                          : "AI Paused"
                    }
                    tone={
                      conversation.handover_to_admin
                        ? "red"
                        : conversation.ai_enabled
                          ? "green"
                          : "amber"
                    }
                  />

                  {selectedNumberBlocked ? (
                    <Badge
                      label="Blocked"
                      tone="red"
                    />
                  ) : null}
                </View>

                <Text
                  style={
                    styles.windowInfo
                  }
                >
                  24h expires:{" "}
                  {formatWhatsAppDate(
                    conversation.window_expires_at
                  )}
                </Text>

                <Text
                  style={
                    styles.windowInfo
                  }
                >
                  72h ad expires:{" "}
                  {formatWhatsAppDate(
                    conversation.free_entry_point_expires_at
                  )}
                </Text>
              </View>

              <View
                style={
                  styles.actionCard
                }
              >
                <Text
                  style={
                    styles.sectionTitle
                  }
                >
                  Conversation Control
                </Text>

                <View
                  style={
                    styles.actions
                  }
                >
                  <ActionButton
                    label="Mark Handled"
                    loading={
                      actionLoading ===
                      "mark_handled"
                    }
                    disabled={
                      Boolean(
                        actionLoading
                      )
                    }
                    icon={
                      <UserRoundCheck
                        size={15}
                        color="#625D57"
                      />
                    }
                    onPress={() =>
                      void updateConversation(
                        "mark_handled"
                      )
                    }
                  />

                  <ActionButton
                    label="Resume AI"
                    loading={
                      actionLoading ===
                      "resume_ai"
                    }
                    disabled={
                      Boolean(
                        actionLoading
                      )
                    }
                    icon={
                      <PlayCircle
                        size={15}
                        color="#24714D"
                      />
                    }
                    onPress={() =>
                      void updateConversation(
                        "resume_ai"
                      )
                    }
                  />

                  <ActionButton
                    label="Pause AI"
                    loading={
                      actionLoading ===
                      "pause_ai"
                    }
                    disabled={
                      Boolean(
                        actionLoading
                      )
                    }
                    icon={
                      <PauseCircle
                        size={15}
                        color="#8A6818"
                      />
                    }
                    onPress={() =>
                      void updateConversation(
                        "pause_ai"
                      )
                    }
                  />

                  <ActionButton
                    label={
                      selectedNumberBlocked
                        ? "Unblock"
                        : "Block"
                    }
                    loading={
                      actionLoading ===
                        "block_number" ||
                      actionLoading ===
                        "unblock_number"
                    }
                    disabled={
                      Boolean(
                        actionLoading
                      )
                    }
                    icon={
                      selectedNumberBlocked ? (
                        <ShieldCheck
                          size={15}
                          color="#24714D"
                        />
                      ) : (
                        <Ban
                          size={15}
                          color="#A23C3C"
                        />
                      )
                    }
                    onPress={
                      selectedNumberBlocked
                        ? confirmUnblock
                        : confirmBlock
                    }
                  />
                </View>
              </View>

              {conversation.suggested_sales_stage ? (
                <View
                  style={
                    styles.suggestionCard
                  }
                >
                  <Text
                    style={
                      styles.suggestionTitle
                    }
                  >
                    Mona Stage Suggestion
                  </Text>

                  <Badge
                    label={
                      SALES_STAGE_LABELS[
                        conversation
                          .suggested_sales_stage
                      ]
                    }
                    tone="amber"
                  />

                  {conversation.suggested_sales_stage_confidence !==
                  null ? (
                    <Text
                      style={
                        styles.confidence
                      }
                    >
                      {
                        conversation.suggested_sales_stage_confidence
                      }
                      % confidence
                    </Text>
                  ) : null}

                  <Text
                    style={
                      styles.suggestionReason
                    }
                  >
                    {conversation.suggested_sales_stage_reason ||
                      "Mona detected that this conversation may belong in another stage."}
                  </Text>

                  <View
                    style={
                      styles.suggestionActions
                    }
                  >
                    <Pressable
                      disabled={
                        Boolean(
                          actionLoading
                        )
                      }
                      style={
                        styles.approveSuggestion
                      }
                      onPress={() =>
                        void updateConversation(
                          "approve_stage_suggestion"
                        )
                      }
                    >
                      <Check
                        size={15}
                        color="#FFFFFF"
                      />

                      <Text
                        style={
                          styles.approveSuggestionText
                        }
                      >
                        Approve
                      </Text>
                    </Pressable>

                    <Pressable
                      disabled={
                        Boolean(
                          actionLoading
                        )
                      }
                      style={
                        styles.ignoreSuggestion
                      }
                      onPress={() =>
                        void updateConversation(
                          "ignore_stage_suggestion"
                        )
                      }
                    >
                      <X
                        size={15}
                        color="#8A6818"
                      />

                      <Text
                        style={
                          styles.ignoreSuggestionText
                        }
                      >
                        Ignore
                      </Text>
                    </Pressable>
                  </View>
                </View>
              ) : null}

              <View
                style={
                  styles.stageCard
                }
              >
                <View
                  style={
                    styles.stageHeader
                  }
                >
                  <View
                    style={
                      styles.stageHeaderCopy
                    }
                  >
                    <Text
                      style={
                        styles.sectionTitle
                      }
                    >
                      Sales Stage
                    </Text>

                    <Text
                      style={
                        styles.stageHelper
                      }
                    >
                      Move this customer as the conversation progresses.
                    </Text>
                  </View>

                  <Pressable
                    disabled={
                      Boolean(
                        actionLoading
                      )
                    }
                    style={[
                      styles.changeStageButton,
                      Boolean(
                        actionLoading
                      ) &&
                        styles.disabled,
                    ]}
                    onPress={() =>
                      setStagePickerOpen(
                        true
                      )
                    }
                  >
                    <Text
                      style={
                        styles.changeStageButtonText
                      }
                    >
                      Change
                    </Text>
                  </Pressable>
                </View>

                <View
                  style={
                    styles.currentStageBox
                  }
                >
                  <View>
                    <Text
                      style={
                        styles.currentStageLabel
                      }
                    >
                      Current Stage
                    </Text>

                    <Text
                      style={
                        styles.currentStageValue
                      }
                    >
                      {
                        SALES_STAGE_LABELS[
                          currentStage
                        ]
                      }
                    </Text>
                  </View>

                  <CheckCircle2
                    size={20}
                    color="#A17B2A"
                  />
                </View>
              </View>

              <Modal
                visible={
                  stagePickerOpen
                }
                transparent
                animationType="slide"
                onRequestClose={() =>
                  setStagePickerOpen(
                    false
                  )
                }
              >
                <View
                  style={
                    styles.modalBackdrop
                  }
                >
                  <Pressable
                    style={
                      styles.modalDismissArea
                    }
                    onPress={() =>
                      setStagePickerOpen(
                        false
                      )
                    }
                  />

                  <View
                    style={
                      styles.stageSheet
                    }
                  >
                    <View
                      style={
                        styles.sheetHandle
                      }
                    />

                    <View
                      style={
                        styles.sheetHeader
                      }
                    >
                      <View>
                        <Text
                          style={
                            styles.sheetEyebrow
                          }
                        >
                          SALES PIPELINE
                        </Text>

                        <Text
                          style={
                            styles.sheetTitle
                          }
                        >
                          Change Sales Stage
                        </Text>
                      </View>

                      <Pressable
                        style={
                          styles.sheetClose
                        }
                        onPress={() =>
                          setStagePickerOpen(
                            false
                          )
                        }
                      >
                        <X
                          size={17}
                          color="#171717"
                        />
                      </Pressable>
                    </View>

                    <ScrollView
                      style={
                        styles.stageOptionsScroll
                      }
                      contentContainerStyle={
                        styles.stageOptions
                      }
                      showsVerticalScrollIndicator={
                        false
                      }
                    >
                      {SALES_STAGE_FILTERS.filter(
                        (
                          item
                        ): item is {
                          value: SalesStage;
                          label: string;
                        } =>
                          item.value !==
                          "all_stages"
                      ).map(
                        (item) => {
                          const active =
                            currentStage ===
                            item.value;

                          const loading =
                            actionLoading ===
                            `sales_stage:${item.value}`;

                          return (
                            <Pressable
                              key={
                                item.value
                              }
                              disabled={
                                Boolean(
                                  actionLoading
                                ) ||
                                active
                              }
                              style={[
                                styles.stageOption,
                                active &&
                                  styles.stageOptionActive,
                              ]}
                              onPress={() => {
                                setStagePickerOpen(
                                  false
                                );

                                void updateSalesStage(
                                  item.value
                                );
                              }}
                            >
                              <View
                                style={
                                  styles.stageOptionCopy
                                }
                              >
                                <Text
                                  style={[
                                    styles.stageOptionText,
                                    active &&
                                      styles.stageOptionTextActive,
                                  ]}
                                >
                                  {
                                    item.label
                                  }
                                </Text>

                                {active ? (
                                  <Text
                                    style={
                                      styles.stageOptionCurrent
                                    }
                                  >
                                    Current stage
                                  </Text>
                                ) : null}
                              </View>

                              {loading ? (
                                <ActivityIndicator
                                  size="small"
                                  color="#171717"
                                />
                              ) : active ? (
                                <View
                                  style={
                                    styles.stageCheck
                                  }
                                >
                                  <Check
                                    size={14}
                                    color="#FFFFFF"
                                  />
                                </View>
                              ) : null}
                            </Pressable>
                          );
                        }
                      )}
                    </ScrollView>

                    <Pressable
                      style={
                        styles.stageCancelButton
                      }
                      onPress={() =>
                        setStagePickerOpen(
                          false
                        )
                      }
                    >
                      <Text
                        style={
                          styles.stageCancelText
                        }
                      >
                        Cancel
                      </Text>
                    </Pressable>
                  </View>
                </View>
              </Modal>

              {error ? (
                <View
                  style={
                    styles.errorBox
                  }
                >
                  <Text
                    style={
                      styles.errorText
                    }
                  >
                    {error}
                  </Text>
                </View>
              ) : null}

              {successMessage ? (
                <View
                  style={
                    styles.successBox
                  }
                >
                  <Text
                    style={
                      styles.successText
                    }
                  >
                    {successMessage}
                  </Text>
                </View>
              ) : null}

              <View
                style={
                  styles.chatSection
                }
              >
                {hiddenMessagesCount >
                0 ? (
                  <Pressable
                    style={
                      styles.loadMoreButton
                    }
                    onPress={() =>
                      setVisibleMessageCount(
                        (
                          current
                        ) =>
                          current +
                          MESSAGE_BATCH_SIZE
                      )
                    }
                  >
                    <Text
                      style={
                        styles.loadMoreText
                      }
                    >
                      Load More (
                      {
                        hiddenMessagesCount
                      }{" "}
                      older)
                    </Text>
                  </Pressable>
                ) : null}

                {visibleMessages.map(
                  (message) => {
                    const isInbound =
                      message.direction ===
                      "inbound";

                    const isSystem =
                      message.direction ===
                      "system";

                    if (
                      isSystem
                    ) {
                      return (
                        <View
                          key={
                            message.id
                          }
                          style={
                            styles.systemMessageWrap
                          }
                        >
                          <View
                            style={
                              styles.systemMessage
                            }
                          >
                            <Text
                              style={
                                styles.systemText
                              }
                            >
                              {message.message ||
                                "-"}
                            </Text>
                          </View>
                        </View>
                      );
                    }

                    return (
                      <View
                        key={
                          message.id
                        }
                        style={[
                          styles.messageRow,
                          isInbound
                            ? styles.messageRowInbound
                            : styles.messageRowOutbound,
                        ]}
                      >
                        <View
                          style={[
                            styles.messageBubble,
                            isInbound
                              ? styles.inboundBubble
                              : styles.outboundBubble,
                          ]}
                        >
                          <Text
                            style={[
                              styles.messageText,
                              !isInbound &&
                                styles.outboundText,
                            ]}
                          >
                            {message.message ||
                              "-"}
                          </Text>

                          <View
                            style={
                              styles.messageMeta
                            }
                          >
                            <Text
                              style={[
                                styles.messageMetaText,
                                !isInbound &&
                                  styles.outboundMeta,
                              ]}
                            >
                              {formatWhatsAppDate(
                                message.created_at
                              )}
                            </Text>

                            <Text
                              style={[
                                styles.messageMetaText,
                                !isInbound &&
                                  styles.outboundMeta,
                              ]}
                            >
                              {isInbound
                                ? "Customer"
                                : message.ai_generated
                                  ? "Mona"
                                  : message.admin_generated
                                    ? "Admin"
                                    : "Tetamo"}
                            </Text>

                            <Text
                              style={[
                                styles.messageMetaText,
                                !isInbound &&
                                  styles.outboundMeta,
                              ]}
                            >
                              {getMessageSourceLabel(
                                message,
                                conversation
                              )}
                            </Text>
                          </View>
                        </View>
                      </View>
                    );
                  }
                )}
              </View>
            </>
          ) : null}
        </ScrollView>

        {!loading &&
        conversation ? (
          <View
            style={
              styles.composerArea
            }
          >
            {selectedNumberBlocked ? (
              <Text
                style={
                  styles.composerWarning
                }
              >
                This WhatsApp number is blocked.
              </Text>
            ) : !selectedReplyWindowOpen ? (
              <Text
                style={
                  styles.composerWarning
                }
              >
                24-hour reply window closed. Approved template needed.
              </Text>
            ) : (
              <Text
                style={
                  styles.composerHint
                }
              >
                Manual admin reply · AI stays paused after sending.
              </Text>
            )}

            <View
              style={
                styles.composer
              }
            >
              <TextInput
                value={
                  replyMessage
                }
                onChangeText={(
                  value
                ) => {
                  setReplyMessage(
                    value
                  );

                  setError("");
                }}
                editable={
                  !selectedNumberBlocked &&
                  selectedReplyWindowOpen &&
                  !sendingReply
                }
                multiline
                maxLength={1700}
                placeholder={
                  selectedNumberBlocked
                    ? "Number blocked"
                    : selectedReplyWindowOpen
                      ? "Write admin reply..."
                      : "Template needed"
                }
                placeholderTextColor="#9A948B"
                style={
                  styles.replyInput
                }
              />

              <Pressable
                disabled={
                  sendingReply ||
                  selectedNumberBlocked ||
                  !selectedReplyWindowOpen ||
                  !replyMessage.trim()
                }
                style={[
                  styles.sendButton,
                  (
                    sendingReply ||
                    selectedNumberBlocked ||
                    !selectedReplyWindowOpen ||
                    !replyMessage.trim()
                  ) &&
                    styles.disabled,
                ]}
                onPress={() =>
                  void sendAdminReply()
                }
              >
                {sendingReply ? (
                  <ActivityIndicator
                    size="small"
                    color="#FFFFFF"
                  />
                ) : (
                  <Send
                    size={18}
                    color="#FFFFFF"
                  />
                )}
              </Pressable>
            </View>

            <Text
              style={
                styles.characterCount
              }
            >
              {
                replyMessage.trim()
                  .length
              }
              /1700
            </Text>
          </View>
        ) : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

type Tone =
  | "gray"
  | "green"
  | "red"
  | "amber"
  | "blue"
  | "purple";

function Badge({
  label,
  tone,
}: {
  label: string;
  tone: Tone;
}) {
  const toneStyle =
    tone === "green"
      ? styles.badgeGreen
      : tone === "red"
        ? styles.badgeRed
        : tone === "amber"
          ? styles.badgeAmber
          : tone === "blue"
            ? styles.badgeBlue
            : tone ===
                "purple"
              ? styles.badgePurple
              : styles.badgeGray;

  return (
    <View
      style={[
        styles.badge,
        toneStyle,
      ]}
    >
      <Text
        style={[
          styles.badgeText,
          toneStyle,
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

function ActionButton({
  label,
  icon,
  loading,
  disabled,
  onPress,
}: {
  label: string;
  icon: React.ReactNode;
  loading: boolean;
  disabled: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      disabled={
        disabled
      }
      style={[
        styles.actionButton,
        disabled &&
          styles.disabled,
      ]}
      onPress={
        onPress
      }
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color="#171717"
        />
      ) : (
        icon
      )}

      <Text
        style={
          styles.actionButtonText
        }
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles =
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor:
        "#F7F5EF",
    },

    keyboard: {
      flex: 1,
    },

    header: {
      minHeight: 66,
      paddingHorizontal: 13,
      borderBottomWidth: 1,
      borderBottomColor:
        "#E6DFD5",
      backgroundColor:
        "#F7F5EF",
      flexDirection: "row",
      alignItems: "center",
      gap: 9,
    },

    backButton: {
      width: 38,
      height: 38,
      borderRadius: 14,
      borderWidth: 1,
      borderColor:
        "#DED7CD",
      backgroundColor:
        "#FFFFFF",
      alignItems: "center",
      justifyContent:
        "center",
    },

    headerPerson: {
      flex: 1,
      minWidth: 0,
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },

    avatar: {
      width: 39,
      height: 39,
      borderRadius: 20,
      backgroundColor:
        "#F0D889",
      alignItems: "center",
      justifyContent:
        "center",
    },

    avatarText: {
      color: "#171717",
      fontSize: 13,
      fontWeight: "900",
    },

    headerCopy: {
      flex: 1,
      minWidth: 0,
    },

    name: {
      color: "#171717",
      fontSize: 13,
      fontWeight: "900",
    },

    phone: {
      marginTop: 2,
      color: "#8D877F",
      fontSize: 8.5,
      fontWeight: "600",
    },

    aiHeaderBadge: {
      width: 36,
      height: 36,
      borderRadius: 13,
      backgroundColor:
        "#F4E8C5",
      alignItems: "center",
      justifyContent:
        "center",
    },

    scroll: {
      flex: 1,
      backgroundColor:
        "#F2F0EA",
    },

    content: {
      padding: 12,
      paddingBottom: 24,
    },

    loadingBox: {
      minHeight: 160,
      alignItems: "center",
      justifyContent:
        "center",
      gap: 8,
    },

    loadingText: {
      color: "#777169",
      fontSize: 10,
      fontWeight: "700",
    },

    summaryCard: {
      borderRadius: 20,
      borderWidth: 1,
      borderColor:
        "#E4DDD3",
      backgroundColor:
        "#FFFFFF",
      padding: 12,
    },

    badgeRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 5,
    },

    badge: {
      paddingHorizontal: 7,
      paddingVertical: 4,
      borderRadius: 999,
      borderWidth: 1,
    },

    badgeText: {
      fontSize: 7.5,
      fontWeight: "900",
    },

    badgeGreen: {
      color: "#24714D",
      backgroundColor:
        "#EEF9F2",
      borderColor:
        "#B9DEC8",
    },

    badgeRed: {
      color: "#A23C3C",
      backgroundColor:
        "#FFF0F0",
      borderColor:
        "#EDC0C0",
    },

    badgeAmber: {
      color: "#8A6818",
      backgroundColor:
        "#FFF8E1",
      borderColor:
        "#E7CF79",
    },

    badgeBlue: {
      color: "#356C9C",
      backgroundColor:
        "#EDF6FF",
      borderColor:
        "#BBD5EC",
    },

    badgePurple: {
      color: "#7146A0",
      backgroundColor:
        "#F5EEFF",
      borderColor:
        "#D7C2F2",
    },

    badgeGray: {
      color: "#66615B",
      backgroundColor:
        "#F4F3F1",
      borderColor:
        "#D9D5D0",
    },

    windowInfo: {
      marginTop: 7,
      color: "#8C857C",
      fontSize: 8.5,
      lineHeight: 13,
      fontWeight: "600",
    },

    actionCard: {
      marginTop: 10,
      borderRadius: 20,
      borderWidth: 1,
      borderColor:
        "#E4DDD3",
      backgroundColor:
        "#FFFFFF",
      padding: 12,
    },

    sectionTitle: {
      color: "#171717",
      fontSize: 11.5,
      fontWeight: "900",
    },

    actions: {
      marginTop: 10,
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 7,
    },

    actionButton: {
      minHeight: 39,
      width: "48%",
      paddingHorizontal: 8,
      borderRadius: 13,
      borderWidth: 1,
      borderColor:
        "#E0D9CF",
      backgroundColor:
        "#FAF8F4",
      flexDirection: "row",
      alignItems: "center",
      justifyContent:
        "center",
      gap: 5,
    },

    actionButtonText: {
      color: "#39342F",
      fontSize: 8.8,
      fontWeight: "900",
    },

    suggestionCard: {
      marginTop: 10,
      borderRadius: 20,
      borderWidth: 1,
      borderColor:
        "#E7CF79",
      backgroundColor:
        "#FFF8E1",
      padding: 13,
    },

    suggestionTitle: {
      color: "#6D5315",
      fontSize: 11,
      fontWeight: "900",
      marginBottom: 8,
    },

    confidence: {
      marginTop: 7,
      color: "#8A6818",
      fontSize: 8.5,
      fontWeight: "900",
    },

    suggestionReason: {
      marginTop: 8,
      color: "#6D5315",
      fontSize: 10,
      lineHeight: 15,
      fontWeight: "600",
    },

    suggestionActions: {
      flexDirection: "row",
      gap: 7,
      marginTop: 11,
    },

    approveSuggestion: {
      minHeight: 39,
      flex: 1,
      borderRadius: 13,
      backgroundColor:
        "#171717",
      flexDirection: "row",
      alignItems: "center",
      justifyContent:
        "center",
      gap: 5,
    },

    approveSuggestionText: {
      color: "#FFFFFF",
      fontSize: 9,
      fontWeight: "900",
    },

    ignoreSuggestion: {
      minHeight: 39,
      flex: 1,
      borderRadius: 13,
      borderWidth: 1,
      borderColor:
        "#DFBF5D",
      backgroundColor:
        "#FFFFFF",
      flexDirection: "row",
      alignItems: "center",
      justifyContent:
        "center",
      gap: 5,
    },

    ignoreSuggestionText: {
      color: "#8A6818",
      fontSize: 9,
      fontWeight: "900",
    },

    stageCard: {
      marginTop: 10,
      borderRadius: 20,
      borderWidth: 1,
      borderColor:
        "#E4DDD3",
      backgroundColor:
        "#FFFFFF",
      padding: 13,
    },

    stageHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent:
        "space-between",
      gap: 12,
    },

    stageHeaderCopy: {
      flex: 1,
      minWidth: 0,
    },

    stageHelper: {
      marginTop: 3,
      color: "#8C857C",
      fontSize: 8.5,
      lineHeight: 13,
      fontWeight: "600",
    },

    changeStageButton: {
      minHeight: 34,
      paddingHorizontal: 13,
      borderRadius: 999,
      backgroundColor:
        "#171717",
      alignItems: "center",
      justifyContent:
        "center",
    },

    changeStageButtonText: {
      color: "#FFFFFF",
      fontSize: 8.5,
      fontWeight: "900",
    },

    currentStageBox: {
      marginTop: 11,
      minHeight: 59,
      paddingHorizontal: 13,
      paddingVertical: 10,
      borderRadius: 15,
      borderWidth: 1,
      borderColor:
        "#E4DDD3",
      backgroundColor:
        "#F9F7F2",
      flexDirection: "row",
      alignItems: "center",
      justifyContent:
        "space-between",
    },

    currentStageLabel: {
      color: "#9A948B",
      fontSize: 7.5,
      fontWeight: "900",
      textTransform:
        "uppercase",
      letterSpacing: 0.6,
    },

    currentStageValue: {
      marginTop: 4,
      color: "#171717",
      fontSize: 12,
      fontWeight: "900",
    },

    modalBackdrop: {
      flex: 1,
      backgroundColor:
        "rgba(0,0,0,0.42)",
      justifyContent:
        "flex-end",
    },

    modalDismissArea: {
      flex: 1,
    },

    stageSheet: {
      maxHeight: "78%",
      paddingTop: 8,
      paddingHorizontal: 16,
      paddingBottom: 22,
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      backgroundColor:
        "#F7F5EF",
    },

    sheetHandle: {
      alignSelf: "center",
      width: 39,
      height: 4,
      borderRadius: 999,
      backgroundColor:
        "#CCC5BA",
      marginBottom: 13,
    },

    sheetHeader: {
      flexDirection: "row",
      alignItems:
        "flex-start",
      justifyContent:
        "space-between",
      gap: 12,
      marginBottom: 13,
    },

    sheetEyebrow: {
      color: "#A17B2A",
      fontSize: 7.5,
      fontWeight: "900",
      letterSpacing: 0.8,
    },

    sheetTitle: {
      marginTop: 3,
      color: "#171717",
      fontSize: 18,
      fontWeight: "900",
    },

    sheetClose: {
      width: 36,
      height: 36,
      borderRadius: 13,
      borderWidth: 1,
      borderColor:
        "#DDD6CD",
      backgroundColor:
        "#FFFFFF",
      alignItems: "center",
      justifyContent:
        "center",
    },

    stageOptionsScroll: {
      flexGrow: 0,
    },

    stageOptions: {
      gap: 7,
      paddingBottom: 4,
    },

    stageOption: {
      minHeight: 53,
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: 16,
      borderWidth: 1,
      borderColor:
        "#DDD6CD",
      backgroundColor:
        "#FFFFFF",
      flexDirection: "row",
      alignItems: "center",
      justifyContent:
        "space-between",
      gap: 10,
    },

    stageOptionActive: {
      borderColor:
        "#171717",
      backgroundColor:
        "#171717",
    },

    stageOptionCopy: {
      flex: 1,
    },

    stageOptionText: {
      color: "#39342F",
      fontSize: 10.5,
      fontWeight: "900",
    },

    stageOptionTextActive: {
      color: "#FFFFFF",
    },

    stageOptionCurrent: {
      marginTop: 2,
      color:
        "rgba(255,255,255,0.58)",
      fontSize: 7.5,
      fontWeight: "700",
    },

    stageCheck: {
      width: 25,
      height: 25,
      borderRadius: 13,
      backgroundColor:
        "#A17B2A",
      alignItems: "center",
      justifyContent:
        "center",
    },

    stageCancelButton: {
      minHeight: 45,
      marginTop: 12,
      borderRadius: 15,
      borderWidth: 1,
      borderColor:
        "#D8D1C7",
      backgroundColor:
        "#FFFFFF",
      alignItems: "center",
      justifyContent:
        "center",
    },

    stageCancelText: {
      color: "#625D57",
      fontSize: 9.5,
      fontWeight: "900",
    },

    errorBox: {
      marginTop: 10,
      padding: 11,
      borderRadius: 15,
      borderWidth: 1,
      borderColor:
        "#EDC0C0",
      backgroundColor:
        "#FFF0F0",
    },

    errorText: {
      color: "#A23C3C",
      fontSize: 9.5,
      lineHeight: 14,
      fontWeight: "700",
    },

    successBox: {
      marginTop: 10,
      padding: 11,
      borderRadius: 15,
      borderWidth: 1,
      borderColor:
        "#B9DEC8",
      backgroundColor:
        "#EEF9F2",
    },

    successText: {
      color: "#24714D",
      fontSize: 9.5,
      lineHeight: 14,
      fontWeight: "700",
    },

    chatSection: {
      marginTop: 12,
      gap: 8,
    },

    loadMoreButton: {
      alignSelf: "center",
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 999,
      borderWidth: 1,
      borderColor:
        "#DDD6CD",
      backgroundColor:
        "#FFFFFF",
    },

    loadMoreText: {
      color: "#625D57",
      fontSize: 8.5,
      fontWeight: "900",
    },

    systemMessageWrap: {
      alignItems: "center",
      marginVertical: 3,
    },

    systemMessage: {
      maxWidth: "88%",
      paddingHorizontal: 11,
      paddingVertical: 6,
      borderRadius: 999,
      borderWidth: 1,
      borderColor:
        "#DDD7CF",
      backgroundColor:
        "#FFFFFF",
    },

    systemText: {
      color: "#777169",
      fontSize: 8,
      lineHeight: 12,
      textAlign: "center",
      fontWeight: "600",
    },

    messageRow: {
      width: "100%",
    },

    messageRowInbound: {
      alignItems:
        "flex-start",
    },

    messageRowOutbound: {
      alignItems:
        "flex-end",
    },

    messageBubble: {
      maxWidth: "84%",
      paddingHorizontal: 12,
      paddingVertical: 9,
      borderRadius: 18,
    },

    inboundBubble: {
      borderBottomLeftRadius: 5,
      borderWidth: 1,
      borderColor:
        "#E1DBD2",
      backgroundColor:
        "#FFFFFF",
    },

    outboundBubble: {
      borderBottomRightRadius: 5,
      backgroundColor:
        "#171717",
    },

    messageText: {
      color: "#39342F",
      fontSize: 10.8,
      lineHeight: 16,
      fontWeight: "600",
    },

    outboundText: {
      color: "#FFFFFF",
    },

    messageMeta: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 5,
      marginTop: 6,
    },

    messageMetaText: {
      color: "#9A948B",
      fontSize: 6.9,
      fontWeight: "700",
    },

    outboundMeta: {
      color:
        "rgba(255,255,255,0.58)",
    },

    composerArea: {
      borderTopWidth: 1,
      borderTopColor:
        "#E1DBD2",
      backgroundColor:
        "#FFFFFF",
      paddingHorizontal: 11,
      paddingTop: 8,
      paddingBottom: 10,
    },

    composerHint: {
      color: "#777169",
      fontSize: 7.8,
      fontWeight: "600",
      marginBottom: 5,
    },

    composerWarning: {
      color: "#A06F17",
      fontSize: 7.8,
      lineHeight: 12,
      fontWeight: "800",
      marginBottom: 5,
    },

    composer: {
      flexDirection: "row",
      alignItems:
        "flex-end",
      gap: 7,
    },

    replyInput: {
      flex: 1,
      maxHeight: 110,
      minHeight: 46,
      borderRadius: 19,
      borderWidth: 1,
      borderColor:
        "#DDD6CD",
      backgroundColor:
        "#F8F6F1",
      paddingHorizontal: 13,
      paddingTop: 11,
      paddingBottom: 10,
      color: "#171717",
      fontSize: 10.5,
      lineHeight: 15,
      fontWeight: "600",
    },

    sendButton: {
      width: 46,
      height: 46,
      borderRadius: 23,
      backgroundColor:
        "#171717",
      alignItems: "center",
      justifyContent:
        "center",
    },

    characterCount: {
      textAlign: "right",
      marginTop: 3,
      color: "#A29C94",
      fontSize: 7,
      fontWeight: "600",
    },

    disabled: {
      opacity: 0.35,
    },
  });
