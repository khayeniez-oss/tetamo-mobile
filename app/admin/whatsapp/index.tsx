import {
  useFocusEffect,
  useRouter,
} from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
  ArrowLeft,
  Bot,
  ChevronLeft,
  ChevronRight,
  MessageCircle,
  RefreshCw,
  UserRound,
} from "lucide-react-native";
import {
  useCallback,
  useState,
} from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  adminWhatsappFetch,
  CHANNEL_FILTERS,
  ChannelFilterValue,
  Conversation,
  ConversationStats,
  EMPTY_PAGINATION,
  EMPTY_STATS,
  FILTERS,
  FilterValue,
  formatInboxTime,
  getChannelMeta,
  getConversationName,
  getConversationPhone,
  getReplyWindowLabel,
  PaginationState,
  SALES_STAGE_FILTERS,
  SalesStageFilterValue,
  SALES_STAGE_LABELS,
  shortText,
} from "../../../lib/adminWhatsapp";

const PAGE_SIZE = 25;

export default function AdminWhatsappInboxScreen() {
  const router =
    useRouter();

  const [
    conversations,
    setConversations,
  ] = useState<
    Conversation[]
  >([]);

  const [
    stats,
    setStats,
  ] =
    useState<ConversationStats>(
      EMPTY_STATS
    );

  const [
    pagination,
    setPagination,
  ] =
    useState<PaginationState>(
      EMPTY_PAGINATION
    );

  const [
    filter,
    setFilter,
  ] =
    useState<FilterValue>(
      "all"
    );

  const [
    channelFilter,
    setChannelFilter,
  ] =
    useState<ChannelFilterValue>(
      "all_channels"
    );

  const [
    salesStageFilter,
    setSalesStageFilter,
  ] =
    useState<SalesStageFilterValue>(
      "all_stages"
    );

  const [page, setPage] =
    useState(1);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    refreshing,
    setRefreshing,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const [
    showFilters,
    setShowFilters,
  ] = useState(false);

  const [
    showInsights,
    setShowInsights,
  ] = useState(false);

  const loadConversations =
    useCallback(
      async (
        nextPage = page,
        showLoader = true
      ) => {
        try {
          if (showLoader) {
            setLoading(true);
          }

          setError("");

          const params =
            new URLSearchParams(
              {
                filter,
                channelFilter,
                page: String(
                  nextPage
                ),
                pageSize:
                  String(
                    PAGE_SIZE
                  ),
                salesStageFilter,
              }
            );

          const response =
            await adminWhatsappFetch(
              `/api/admin/whatsapp/conversations?${params.toString()}`
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
                "Failed to load WhatsApp conversations."
            );
          }

          setConversations(
            result.conversations ||
              []
          );

          setStats(
            result.stats ||
              EMPTY_STATS
          );

          setPagination(
            result.pagination ||
              EMPTY_PAGINATION
          );
        } catch (
          err: any
        ) {
          console.error(
            "Load WhatsApp conversations error:",
            err
          );

          setError(
            err?.message ||
              "Failed to load WhatsApp conversations."
          );

          setConversations(
            []
          );
        } finally {
          setLoading(
            false
          );

          setRefreshing(
            false
          );
        }
      },
      [
        page,
        filter,
        channelFilter,
        salesStageFilter,
      ]
    );

  useFocusEffect(
    useCallback(() => {
      void loadConversations(
        page,
        true
      );
    }, [
      loadConversations,
      page,
    ])
  );

  function changeFilter(
    value: FilterValue
  ) {
    setPage(1);
    setFilter(value);
  }

  function changeChannel(
    value: ChannelFilterValue
  ) {
    setPage(1);
    setChannelFilter(
      value
    );
  }

  function changeStage(
    value: SalesStageFilterValue
  ) {
    setPage(1);
    setSalesStageFilter(
      value
    );
  }

  async function refresh() {
    setRefreshing(true);

    await loadConversations(
      page,
      false
    );
  }

  return (
    <SafeAreaView
      style={
        styles.safeArea
      }
    >
      <StatusBar style="dark" />

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
            router.replace(
              "/admin" as any
            )
          }
        >
          <ArrowLeft
            size={17}
            color="#171717"
          />

          <Text
            style={
              styles.backText
            }
          >
            Admin
          </Text>
        </Pressable>

        <View>
          <Text
            style={
              styles.headerEyebrow
            }
          >
            TETAMO AI
          </Text>

          <Text
            style={
              styles.headerTitle
            }
          >
            WhatsApp
          </Text>
        </View>

        <Pressable
          style={
            styles.refreshButton
          }
          onPress={() =>
            void refresh()
          }
        >
          <RefreshCw
            size={17}
            color="#171717"
          />
        </Pressable>
      </View>

      <ScrollView
        style={
          styles.screen
        }
        contentContainerStyle={
          styles.content
        }
        showsVerticalScrollIndicator={
          false
        }
        refreshControl={
          <RefreshControl
            refreshing={
              refreshing
            }
            onRefresh={
              refresh
            }
            tintColor="#B8892E"
          />
        }
      >
        <View
          style={
            styles.compactControls
          }
        >
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={
              false
            }
            contentContainerStyle={
              styles.quickRow
            }
          >
            <FilterChip
              label="All"
              active={
                filter === "all"
              }
              onPress={() =>
                changeFilter(
                  "all"
                )
              }
            />

            <FilterChip
              label={`Needs Admin ${stats.needsAdmin}`}
              active={
                filter ===
                "needs_admin"
              }
              onPress={() =>
                changeFilter(
                  "needs_admin"
                )
              }
            />

            <FilterChip
              label={`AI Paused ${stats.pausedAi}`}
              active={
                filter ===
                "paused_ai"
              }
              onPress={() =>
                changeFilter(
                  "paused_ai"
                )
              }
            />

            <Pressable
              style={[
                styles.filterChip,
                showFilters &&
                  styles.filterChipActive,
              ]}
              onPress={() =>
                setShowFilters(
                  (current) =>
                    !current
                )
              }
            >
              <Text
                style={[
                  styles.filterChipText,
                  showFilters &&
                    styles.filterChipTextActive,
                ]}
              >
                Filters
              </Text>
            </Pressable>

            <Pressable
              style={[
                styles.filterChip,
                showInsights &&
                  styles.filterChipActive,
              ]}
              onPress={() =>
                setShowInsights(
                  (current) =>
                    !current
                )
              }
            >
              <Text
                style={[
                  styles.filterChipText,
                  showInsights &&
                    styles.filterChipTextActive,
                ]}
              >
                Insights
              </Text>
            </Pressable>
          </ScrollView>
        </View>

        {showInsights ? (
          <View
            style={
              styles.insightsWrap
            }
          >
            <View
              style={
                styles.insightsHeader
              }
            >
              <Text
                style={
                  styles.insightsTitle
                }
              >
                Inbox Overview
              </Text>

              <Text
                style={
                  styles.insightsHint
                }
              >
                Live totals
              </Text>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={
                false
              }
              contentContainerStyle={
                styles.statsRowCompact
              }
            >
              <Stat
                label="Total"
                value={
                  stats.total
                }
              />

              <Stat
                label="Needs Admin"
                value={
                  stats.needsAdmin
                }
              />

              <Stat
                label="AI Active"
                value={
                  stats.activeAi
                }
              />

              <Stat
                label="AI Paused"
                value={
                  stats.pausedAi
                }
              />

              <Stat
                label="Stage Review"
                value={
                  stats.needsStageReview
                }
              />

              <Stat
                label="Meta"
                value={
                  stats.metaDirect
                }
              />

              <Stat
                label="Twilio"
                value={
                  stats.twilio
                }
              />

              <Stat
                label="72h Ads"
                value={
                  stats.adWindowOpen
                }
              />
            </ScrollView>
          </View>
        ) : null}

        {showFilters ? (
          <View
            style={
              styles.filterPanel
            }
          >
            <View
              style={
                styles.filterPanelHeader
              }
            >
              <View>
                <Text
                  style={
                    styles.filterPanelTitle
                  }
                >
                  Inbox Filters
                </Text>

                <Text
                  style={
                    styles.filterPanelSubtitle
                  }
                >
                  Filter without changing conversation logic.
                </Text>
              </View>

              <Pressable
                style={
                  styles.filterClose
                }
                onPress={() =>
                  setShowFilters(
                    false
                  )
                }
              >
                <Text
                  style={
                    styles.filterCloseText
                  }
                >
                  Done
                </Text>
              </Pressable>
            </View>

            <FilterSection
              title="Status"
            >
              {FILTERS.map(
                (item) => (
                  <FilterChip
                    key={
                      item.value
                    }
                    label={
                      item.label
                    }
                    active={
                      filter ===
                      item.value
                    }
                    onPress={() =>
                      changeFilter(
                        item.value
                      )
                    }
                  />
                )
              )}
            </FilterSection>

            <FilterSection
              title="Source"
            >
              {CHANNEL_FILTERS.map(
                (item) => (
                  <FilterChip
                    key={
                      item.value
                    }
                    label={
                      item.label
                    }
                    active={
                      channelFilter ===
                      item.value
                    }
                    onPress={() =>
                      changeChannel(
                        item.value
                      )
                    }
                  />
                )
              )}
            </FilterSection>

            <FilterSection
              title="Sales Stage"
            >
              {SALES_STAGE_FILTERS.map(
                (item) => (
                  <FilterChip
                    key={
                      item.value
                    }
                    label={
                      item.label
                    }
                    active={
                      salesStageFilter ===
                      item.value
                    }
                    onPress={() =>
                      changeStage(
                        item.value
                      )
                    }
                  />
                )
              )}
            </FilterSection>
          </View>
        ) : null}

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

        <View
          style={
            styles.inboxHeader
          }
        >
          <View>
            <Text
              style={
                styles.inboxTitle
              }
            >
              Conversations
            </Text>

            <Text
              style={
                styles.inboxCount
              }
            >
              {pagination.from}–
              {pagination.to} of{" "}
              {
                pagination.totalCount
              }
            </Text>
          </View>

          <Text
            style={
              styles.pageText
            }
          >
            Page{" "}
            {
              pagination.page
            }/
            {
              pagination.totalPages
            }
          </Text>
        </View>

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
              Loading conversations...
            </Text>
          </View>
        ) : null}

        {!loading &&
        conversations.length ===
          0 ? (
          <View
            style={
              styles.emptyBox
            }
          >
            <MessageCircle
              size={30}
              color="#B8892E"
            />

            <Text
              style={
                styles.emptyTitle
              }
            >
              No conversations
            </Text>

            <Text
              style={
                styles.emptyText
              }
            >
              No WhatsApp conversations
              match the current filters.
            </Text>
          </View>
        ) : null}

        {!loading ? (
          <View
            style={
              styles.conversationList
            }
          >
            {conversations.map(
              (
                conversation
              ) => (
                <ConversationRow
                  key={
                    conversation.id
                  }
                  conversation={
                    conversation
                  }
                  onPress={() =>
                    router.push(
                      `/admin/whatsapp/${conversation.id}` as any
                    )
                  }
                />
              )
            )}
          </View>
        ) : null}

        {!loading &&
        pagination.totalCount >
          0 ? (
          <View
            style={
              styles.pagination
            }
          >
            <Pressable
              disabled={
                !pagination.hasPreviousPage
              }
              style={[
                styles.pageButton,
                !pagination.hasPreviousPage &&
                  styles.disabled,
              ]}
              onPress={() =>
                setPage(
                  (current) =>
                    Math.max(
                      1,
                      current - 1
                    )
                )
              }
            >
              <ChevronLeft
                size={18}
                color="#171717"
              />

              <Text
                style={
                  styles.pageButtonText
                }
              >
                Previous
              </Text>
            </Pressable>

            <Pressable
              disabled={
                !pagination.hasNextPage
              }
              style={[
                styles.pageButton,
                !pagination.hasNextPage &&
                  styles.disabled,
              ]}
              onPress={() =>
                setPage(
                  (current) =>
                    current + 1
                )
              }
            >
              <Text
                style={
                  styles.pageButtonText
                }
              >
                Next
              </Text>

              <ChevronRight
                size={18}
                color="#171717"
              />
            </Pressable>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function ConversationRow({
  conversation,
  onPress,
}: {
  conversation: Conversation;
  onPress: () => void;
}) {
  const channel =
    getChannelMeta(
      conversation.channel
    );

  const name =
    getConversationName(
      conversation
    );

  const phone =
    getConversationPhone(
      conversation
    );

  const stage =
    conversation.sales_stage
      ? SALES_STAGE_LABELS[
          conversation
            .sales_stage
        ]
      : "New Inquiry";

  const aiLabel =
    conversation.handover_to_admin
      ? "Needs Admin"
      : conversation.ai_enabled
        ? "AI Active"
        : "AI Paused";

  const initial =
    name
      .trim()
      .charAt(0)
      .toUpperCase() ||
    "W";

  return (
    <Pressable
      style={
        styles.conversation
      }
      onPress={
        onPress
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
          {initial}
        </Text>
      </View>

      <View
        style={
          styles.conversationBody
        }
      >
        <View
          style={
            styles.conversationTop
          }
        >
          <Text
            numberOfLines={1}
            style={
              styles.customerName
            }
          >
            {name}
          </Text>

          <Text
            style={
              styles.messageTime
            }
          >
            {formatInboxTime(
              conversation.last_message_at
            )}
          </Text>
        </View>

        <Text
          numberOfLines={1}
          style={
            styles.phone
          }
        >
          {phone}
        </Text>

        <Text
          numberOfLines={2}
          style={
            styles.preview
          }
        >
          {shortText(
            conversation.last_message
          )}
        </Text>

        <View
          style={
            styles.rowBadges
          }
        >
          <MiniBadge
            label={
              stage
            }
            tone="purple"
          />

          <MiniBadge
            label={
              aiLabel
            }
            tone={
              conversation.handover_to_admin
                ? "red"
                : conversation.ai_enabled
                  ? "green"
                  : "amber"
            }
          />

          <MiniBadge
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

          {conversation.suggested_sales_stage ? (
            <MiniBadge
              label={`Mona: ${
                SALES_STAGE_LABELS[
                  conversation
                    .suggested_sales_stage
                ]
              }`}
              tone="amber"
            />
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

function Stat({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <View
      style={
        styles.stat
      }
    >
      <Text
        style={
          styles.statLabel
        }
      >
        {label}
      </Text>

      <Text
        style={
          styles.statValue
        }
      >
        {value}
      </Text>
    </View>
  );
}

function FilterSection({
  title,
  children,
}: {
  title: string;
  children:
    React.ReactNode;
}) {
  return (
    <View
      style={
        styles.filterSection
      }
    >
      <Text
        style={
          styles.filterTitle
        }
      >
        {title}
      </Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={
          false
        }
        contentContainerStyle={
          styles.filterRow
        }
      >
        {children}
      </ScrollView>
    </View>
  );
}

function FilterChip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={[
        styles.filterChip,
        active &&
          styles.filterChipActive,
      ]}
      onPress={
        onPress
      }
    >
      <Text
        style={[
          styles.filterChipText,
          active &&
            styles.filterChipTextActive,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

type Tone =
  | "gray"
  | "green"
  | "red"
  | "amber"
  | "blue"
  | "purple";

function MiniBadge({
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
        styles.miniBadge,
        toneStyle,
      ]}
    >
      <Text
        style={[
          styles.miniBadgeText,
          toneStyle,
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

const styles =
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor:
        "#F7F5EF",
    },

    screen: {
      flex: 1,
      backgroundColor:
        "#F7F5EF",
    },

    header: {
      minHeight: 64,
      paddingHorizontal: 16,
      borderBottomWidth: 1,
      borderBottomColor:
        "#E7E0D6",
      flexDirection: "row",
      alignItems: "center",
      justifyContent:
        "space-between",
      backgroundColor:
        "#F7F5EF",
    },

    backButton: {
      minHeight: 38,
      paddingHorizontal: 10,
      borderRadius: 13,
      borderWidth: 1,
      borderColor:
        "#DED7CD",
      backgroundColor:
        "#FFFFFF",
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
    },

    backText: {
      color: "#171717",
      fontSize: 9.5,
      fontWeight: "900",
    },

    refreshButton: {
      width: 38,
      height: 38,
      borderRadius: 13,
      borderWidth: 1,
      borderColor:
        "#DED7CD",
      backgroundColor:
        "#FFFFFF",
      alignItems: "center",
      justifyContent:
        "center",
    },

    headerEyebrow: {
      textAlign: "center",
      color: "#A17B2A",
      fontSize: 7.5,
      fontWeight: "900",
      letterSpacing: 1,
    },

    headerTitle: {
      marginTop: 2,
      textAlign: "center",
      color: "#171717",
      fontSize: 17,
      fontWeight: "900",
    },

    content: {
      paddingBottom: 45,
    },

    compactControls: {
      paddingTop: 13,
      paddingBottom: 2,
    },

    quickRow: {
      paddingHorizontal: 16,
      gap: 6,
    },

    insightsWrap: {
      marginHorizontal: 16,
      marginTop: 12,
      borderRadius: 20,
      borderWidth: 1,
      borderColor:
        "#E5DED4",
      backgroundColor:
        "#FFFFFF",
      overflow: "hidden",
    },

    insightsHeader: {
      paddingHorizontal: 13,
      paddingTop: 12,
      paddingBottom: 3,
      flexDirection: "row",
      alignItems: "center",
      justifyContent:
        "space-between",
    },

    insightsTitle: {
      color: "#171717",
      fontSize: 11,
      fontWeight: "900",
    },

    insightsHint: {
      color: "#9A7624",
      fontSize: 8,
      fontWeight: "900",
      textTransform:
        "uppercase",
      letterSpacing: 0.5,
    },

    statsRowCompact: {
      paddingHorizontal: 12,
      paddingTop: 8,
      paddingBottom: 12,
      gap: 8,
    },

    filterPanel: {
      marginHorizontal: 16,
      marginTop: 12,
      paddingTop: 13,
      paddingBottom: 15,
      borderRadius: 20,
      borderWidth: 1,
      borderColor:
        "#E5DED4",
      backgroundColor:
        "#FFFFFF",
      overflow: "hidden",
    },

    filterPanelHeader: {
      paddingHorizontal: 14,
      flexDirection: "row",
      alignItems: "center",
      justifyContent:
        "space-between",
      gap: 12,
    },

    filterPanelTitle: {
      color: "#171717",
      fontSize: 12,
      fontWeight: "900",
    },

    filterPanelSubtitle: {
      marginTop: 2,
      color: "#8C857C",
      fontSize: 8,
      fontWeight: "600",
    },

    filterClose: {
      minHeight: 30,
      paddingHorizontal: 11,
      borderRadius: 999,
      backgroundColor:
        "#171717",
      alignItems: "center",
      justifyContent:
        "center",
    },

    filterCloseText: {
      color: "#FFFFFF",
      fontSize: 8.5,
      fontWeight: "900",
    },

    statsRow: {
      paddingHorizontal: 16,
      paddingTop: 14,
      paddingBottom: 2,
      gap: 8,
    },

    stat: {
      minWidth: 92,
      minHeight: 61,
      padding: 11,
      borderRadius: 17,
      borderWidth: 1,
      borderColor:
        "#E5DED4",
      backgroundColor:
        "#FFFFFF",
    },

    statLabel: {
      color: "#8C857C",
      fontSize: 7.8,
      fontWeight: "900",
      textTransform:
        "uppercase",
    },

    statValue: {
      marginTop: 4,
      color: "#171717",
      fontSize: 17,
      fontWeight: "900",
    },

    filterSection: {
      marginTop: 15,
    },

    filterTitle: {
      paddingHorizontal: 16,
      color: "#8C857C",
      fontSize: 8.5,
      fontWeight: "900",
      textTransform:
        "uppercase",
      letterSpacing: 0.7,
      marginBottom: 7,
    },

    filterRow: {
      paddingHorizontal: 16,
      gap: 6,
    },

    filterChip: {
      minHeight: 34,
      paddingHorizontal: 11,
      borderRadius: 999,
      borderWidth: 1,
      borderColor:
        "#DDD6CD",
      backgroundColor:
        "#FFFFFF",
      alignItems: "center",
      justifyContent:
        "center",
    },

    filterChipActive: {
      backgroundColor:
        "#171717",
      borderColor:
        "#171717",
    },

    filterChipText: {
      color: "#625D57",
      fontSize: 9,
      fontWeight: "800",
    },

    filterChipTextActive: {
      color: "#FFFFFF",
    },

    errorBox: {
      marginHorizontal: 16,
      marginTop: 16,
      padding: 12,
      borderRadius: 15,
      borderWidth: 1,
      borderColor:
        "#ECC8C8",
      backgroundColor:
        "#FFF2F2",
    },

    errorText: {
      color: "#A23C3C",
      fontSize: 10.5,
      lineHeight: 15,
      fontWeight: "700",
    },

    inboxHeader: {
      paddingHorizontal: 16,
      marginTop: 15,
      marginBottom: 9,
      flexDirection: "row",
      alignItems:
        "flex-end",
      justifyContent:
        "space-between",
    },

    inboxTitle: {
      color: "#171717",
      fontSize: 16,
      fontWeight: "900",
    },

    inboxCount: {
      marginTop: 2,
      color: "#8C857C",
      fontSize: 9.5,
      fontWeight: "600",
    },

    pageText: {
      color: "#9A7624",
      fontSize: 9,
      fontWeight: "900",
    },

    loadingBox: {
      marginHorizontal: 16,
      minHeight: 110,
      borderRadius: 20,
      borderWidth: 1,
      borderColor:
        "#E5DED4",
      backgroundColor:
        "#FFFFFF",
      alignItems: "center",
      justifyContent:
        "center",
      gap: 8,
    },

    loadingText: {
      color: "#777169",
      fontSize: 10.5,
      fontWeight: "700",
    },

    emptyBox: {
      marginHorizontal: 16,
      minHeight: 160,
      borderRadius: 22,
      borderWidth: 1,
      borderColor:
        "#E5DED4",
      backgroundColor:
        "#FFFFFF",
      alignItems: "center",
      justifyContent:
        "center",
      padding: 20,
    },

    emptyTitle: {
      marginTop: 7,
      color: "#171717",
      fontSize: 13,
      fontWeight: "900",
    },

    emptyText: {
      marginTop: 4,
      color: "#8C857C",
      fontSize: 10,
      lineHeight: 15,
      textAlign: "center",
    },

    conversationList: {
      backgroundColor:
        "#FFFFFF",
      borderTopWidth: 1,
      borderBottomWidth: 1,
      borderColor:
        "#E8E2D9",
    },

    conversation: {
      minHeight: 116,
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor:
        "#EEE9E1",
      flexDirection: "row",
      alignItems:
        "flex-start",
      gap: 11,
    },

    avatar: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor:
        "#F0D889",
      alignItems: "center",
      justifyContent:
        "center",
    },

    avatarText: {
      color: "#171717",
      fontSize: 16,
      fontWeight: "900",
    },

    conversationBody: {
      flex: 1,
      minWidth: 0,
    },

    conversationTop: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent:
        "space-between",
      gap: 10,
    },

    customerName: {
      flex: 1,
      color: "#171717",
      fontSize: 13,
      fontWeight: "900",
    },

    messageTime: {
      color: "#9A948B",
      fontSize: 8.5,
      fontWeight: "700",
    },

    phone: {
      marginTop: 2,
      color: "#9A948B",
      fontSize: 8.5,
      fontWeight: "600",
    },

    preview: {
      marginTop: 5,
      color: "#625D57",
      fontSize: 10.5,
      lineHeight: 15,
      fontWeight: "600",
    },

    rowBadges: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 4,
      marginTop: 7,
    },

    miniBadge: {
      borderWidth: 1,
      borderRadius: 999,
      paddingHorizontal: 6,
      paddingVertical: 3,
    },

    miniBadgeText: {
      fontSize: 7.2,
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

    pagination: {
      marginTop: 17,
      paddingHorizontal: 16,
      flexDirection: "row",
      justifyContent:
        "space-between",
      gap: 10,
    },

    pageButton: {
      minHeight: 42,
      paddingHorizontal: 14,
      borderRadius: 14,
      borderWidth: 1,
      borderColor:
        "#DCD5CC",
      backgroundColor:
        "#FFFFFF",
      flexDirection: "row",
      alignItems: "center",
      justifyContent:
        "center",
      gap: 5,
    },

    pageButtonText: {
      color: "#171717",
      fontSize: 9.5,
      fontWeight: "900",
    },

    disabled: {
      opacity: 0.35,
    },
  });
