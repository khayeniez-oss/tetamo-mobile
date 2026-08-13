import {
  useFocusEffect,
  useLocalSearchParams,
  useRouter,
} from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Clock3,
  Megaphone,
  Pause,
  Play,
  RefreshCw,
  RotateCcw,
  Send,
  Trash2,
  XCircle,
} from "lucide-react-native";
import {
  useCallback,
  useState,
} from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import {
  adminCampaignFetch,
  Campaign,
  EMPTY_COUNTS,
  formatCampaignDate,
  getRecipientErrorText,
  Recipient,
  RecipientCounts,
  RECIPIENT_FILTERS,
  RecipientStatusFilter,
} from "../../../lib/adminCampaigns";

function readParam(
  value: string | string[] | undefined
) {
  if (Array.isArray(value)) {
    return String(value[0] || "");
  }

  return String(value || "");
}

export default function CampaignDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const campaignId = readParam(
    params.campaignId
  );

  const [
    campaign,
    setCampaign,
  ] = useState<Campaign | null>(
    null
  );

  const [
    recipients,
    setRecipients,
  ] = useState<Recipient[]>([]);

  const [
    counts,
    setCounts,
  ] =
    useState<RecipientCounts>(
      EMPTY_COUNTS
    );

  const [
    recipientFilter,
    setRecipientFilter,
  ] =
    useState<RecipientStatusFilter>(
      "all"
    );

  const [
    batchSize,
    setBatchSize,
  ] = useState("100");

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    refreshing,
    setRefreshing,
  ] = useState(false);

  const [
    actionLoading,
    setActionLoading,
  ] = useState("");

  const [
    error,
    setError,
  ] = useState("");

  const [
    success,
    setSuccess,
  ] = useState("");

  const loadCampaign =
    useCallback(
      async (
        filter:
          RecipientStatusFilter =
          recipientFilter,
        showLoader = true
      ) => {
        if (!campaignId) {
          setError(
            "Campaign ID is missing."
          );
          setLoading(false);
          return;
        }

        try {
          if (showLoader) {
            setLoading(true);
          }

          setError("");

          const query =
            `?campaignId=${encodeURIComponent(
              campaignId
            )}` +
            `&includeRecipients=true` +
            `&recipientStatus=${encodeURIComponent(
              filter
            )}`;

          const response =
            await adminCampaignFetch(
              query
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
                "Failed to load campaign."
            );
          }

          const nextCampaign =
            (result.campaign ||
              null) as Campaign | null;

          setCampaign(
            nextCampaign
          );

          setRecipients(
            (result.recipients ||
              []) as Recipient[]
          );

          setCounts(
            (result.recipientCounts ||
              EMPTY_COUNTS) as RecipientCounts
          );

          if (
            nextCampaign?.batch_size
          ) {
            setBatchSize(
              String(
                nextCampaign.batch_size
              )
            );
          }
        } catch (err: any) {
          console.error(
            "Load campaign detail error:",
            err
          );

          setError(
            err?.message ||
              "Failed to load campaign."
          );
        } finally {
          setLoading(false);
          setRefreshing(
            false
          );
        }
      },
      [
        campaignId,
        recipientFilter,
      ]
    );

  useFocusEffect(
    useCallback(() => {
      void loadCampaign(
        recipientFilter,
        true
      );
    }, [
      loadCampaign,
      recipientFilter,
    ])
  );

  async function refresh() {
    setRefreshing(true);

    await loadCampaign(
      recipientFilter,
      false
    );
  }

  async function changeFilter(
    nextFilter:
      RecipientStatusFilter
  ) {
    if (
      nextFilter ===
      recipientFilter
    ) {
      return;
    }

    setRecipientFilter(
      nextFilter
    );

    await loadCampaign(
      nextFilter,
      true
    );
  }

  function cleanBatchSize() {
    const parsed =
      Number(batchSize);

    if (
      !Number.isFinite(
        parsed
      ) ||
      parsed <= 0
    ) {
      return 100;
    }

    return Math.min(
      Math.floor(parsed),
      500
    );
  }

  async function processBatch(
    action:
      | "continue_pending"
      | "retry_failed"
  ) {
    if (
      !campaign?.id ||
      actionLoading
    ) {
      return;
    }

    if (
      campaign.status ===
      "paused"
    ) {
      Alert.alert(
        "Campaign Paused",
        "Resume this campaign before processing recipients."
      );
      return;
    }

    const isRetry =
      action ===
      "retry_failed";

    if (
      isRetry &&
      counts.failed <= 0
    ) {
      return;
    }

    if (
      !isRetry &&
      counts.pending <= 0
    ) {
      return;
    }

    if (isRetry) {
      Alert.alert(
        "Retry Failed Recipients",
        `Retry ${counts.failed} failed recipient(s)?\n\nOnly failed recipients will be retried. Sent recipients will not receive the template again.`,
        [
          {
            text: "Cancel",
            style: "cancel",
          },
          {
            text: "Retry Failed",
            style: "destructive",
            onPress: () =>
              void executeBatch(
                action
              ),
          },
        ]
      );

      return;
    }

    await executeBatch(
      action
    );
  }

  async function executeBatch(
    action:
      | "continue_pending"
      | "retry_failed"
  ) {
    if (!campaign?.id) {
      return;
    }

    try {
      setActionLoading(
        action
      );
      setError("");
      setSuccess("");

      const response =
        await adminCampaignFetch(
          "",
          {
            method: "PATCH",
            headers: {
              "Content-Type":
                "application/json",
            },
            body:
              JSON.stringify({
                action,
                campaignId:
                  campaign.id,
                batchSize:
                  cleanBatchSize(),
              }),
          }
        );

      const result =
        await response
          .json()
          .catch(() => null);

      if (
        !response.ok ||
        !result?.success
      ) {
        throw new Error(
          result?.error ||
            "Failed to process campaign batch."
        );
      }

      const label =
        action ===
        "retry_failed"
          ? "Failed-recipient retry"
          : "Pending batch";

      setSuccess(
        `${label}: ${
          result.sentThisBatch ||
          0
        } sent, ${
          result.failedThisBatch ||
          0
        } failed, ${
          result.skippedThisBatch ||
          0
        } skipped. Pending left: ${
          result.pendingLeft ||
          0
        }.`
      );

      await loadCampaign(
        recipientFilter,
        false
      );
    } catch (err: any) {
      console.error(
        "Campaign batch error:",
        err
      );

      setError(
        err?.message ||
          "Failed to process campaign batch."
      );
    } finally {
      setActionLoading("");
    }
  }

  async function updateStatus(
    action:
      | "pause"
      | "resume"
  ) {
    if (
      !campaign?.id ||
      actionLoading
    ) {
      return;
    }

    try {
      setActionLoading(
        action
      );
      setError("");
      setSuccess("");

      const response =
        await adminCampaignFetch(
          "",
          {
            method: "PATCH",
            headers: {
              "Content-Type":
                "application/json",
            },
            body:
              JSON.stringify({
                action,
                campaignId:
                  campaign.id,
              }),
          }
        );

      const result =
        await response
          .json()
          .catch(() => null);

      if (
        !response.ok ||
        !result?.success
      ) {
        throw new Error(
          result?.error ||
            `Failed to ${action} campaign.`
        );
      }

      setSuccess(
        action === "pause"
          ? "Campaign paused."
          : "Campaign resumed."
      );

      await loadCampaign(
        recipientFilter,
        false
      );
    } catch (err: any) {
      console.error(
        "Campaign status error:",
        err
      );

      setError(
        err?.message ||
          `Failed to ${action} campaign.`
      );
    } finally {
      setActionLoading("");
    }
  }

  function confirmDelete() {
    if (!campaign?.id) {
      return;
    }

    Alert.alert(
      "Delete Campaign",
      `Delete "${campaign.name}"?\n\nThis deletes the campaign recipients and send logs and cannot be undone.`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: () =>
            void deleteCampaign(),
        },
      ]
    );
  }

  async function deleteCampaign() {
    if (!campaign?.id) {
      return;
    }

    try {
      setActionLoading(
        "delete"
      );
      setError("");
      setSuccess("");

      const response =
        await adminCampaignFetch(
          "",
          {
            method: "PATCH",
            headers: {
              "Content-Type":
                "application/json",
            },
            body:
              JSON.stringify({
                action:
                  "delete_campaign",
                campaignId:
                  campaign.id,
              }),
          }
        );

      const result =
        await response
          .json()
          .catch(() => null);

      if (
        !response.ok ||
        !result?.success
      ) {
        throw new Error(
          result?.error ||
            "Failed to delete campaign."
        );
      }

      router.replace(
        "/admin/campaigns" as any
      );
    } catch (err: any) {
      console.error(
        "Delete campaign error:",
        err
      );

      setError(
        err?.message ||
          "Failed to delete campaign."
      );
    } finally {
      setActionLoading("");
    }
  }

  if (
    loading &&
    !campaign
  ) {
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
              router.back()
            }
          >
            <ArrowLeft
              size={18}
              color="#171717"
            />
          </Pressable>

          <View
            style={
              styles.headerCopy
            }
          >
            <Text
              style={
                styles.eyebrow
              }
            >
              META WHATSAPP
            </Text>

            <Text
              style={
                styles.title
              }
            >
              Campaign
            </Text>
          </View>

          <View
            style={
              styles.headerSpacer
            }
          />
        </View>

        <View
          style={
            styles.fullLoading
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
            Loading campaign...
          </Text>
        </View>
      </SafeAreaView>
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
            router.back()
          }
        >
          <ArrowLeft
            size={18}
            color="#171717"
          />
        </Pressable>

        <View
          style={
            styles.headerCopy
          }
        >
          <Text
            style={
              styles.eyebrow
            }
          >
            META WHATSAPP
          </Text>

          <Text
            numberOfLines={1}
            style={
              styles.title
            }
          >
            Campaign
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

      <FlatList
        data={recipients}
        keyExtractor={(
          item
        ) => item.id}
        style={
          styles.list
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
        ListHeaderComponent={
          campaign ? (
            <CampaignHeader
              campaign={
                campaign
              }
              counts={
                counts
              }
              batchSize={
                batchSize
              }
              setBatchSize={
                setBatchSize
              }
              filter={
                recipientFilter
              }
              onFilter={
                changeFilter
              }
              error={error}
              success={
                success
              }
              actionLoading={
                actionLoading
              }
              onContinue={() =>
                void processBatch(
                  "continue_pending"
                )
              }
              onRetry={() =>
                void processBatch(
                  "retry_failed"
                )
              }
              onPause={() =>
                void updateStatus(
                  "pause"
                )
              }
              onResume={() =>
                void updateStatus(
                  "resume"
                )
              }
              onDelete={
                confirmDelete
              }
            />
          ) : null
        }
        ListEmptyComponent={
          !loading ? (
            <View
              style={
                styles.emptyBox
              }
            >
              <Text
                style={
                  styles.emptyTitle
                }
              >
                No recipients
              </Text>

              <Text
                style={
                  styles.emptyText
                }
              >
                No recipients match this status filter.
              </Text>
            </View>
          ) : null
        }
        renderItem={({
          item,
        }) => (
          <RecipientCard
            recipient={
              item
            }
          />
        )}
        ListFooterComponent={
          <View
            style={
              styles.footerSpace
            }
          />
        }
      />
    </SafeAreaView>
  );
}

function CampaignHeader({
  campaign,
  counts,
  batchSize,
  setBatchSize,
  filter,
  onFilter,
  error,
  success,
  actionLoading,
  onContinue,
  onRetry,
  onPause,
  onResume,
  onDelete,
}: {
  campaign: Campaign;
  counts: RecipientCounts;
  batchSize: string;
  setBatchSize: (
    value: string
  ) => void;
  filter:
    RecipientStatusFilter;
  onFilter: (
    value:
      RecipientStatusFilter
  ) => void;
  error: string;
  success: string;
  actionLoading: string;
  onContinue: () => void;
  onRetry: () => void;
  onPause: () => void;
  onResume: () => void;
  onDelete: () => void;
}) {
  const busy =
    Boolean(
      actionLoading
    );

  const paused =
    campaign.status ===
    "paused";

  return (
    <View>
      <View
        style={
          styles.hero
        }
      >
        <View
          style={
            styles.heroIcon
          }
        >
          <Megaphone
            size={21}
            color="#8A6818"
          />
        </View>

        <View
          style={
            styles.heroCopy
          }
        >
          <Text
            style={
              styles.campaignName
            }
          >
            {campaign.name}
          </Text>

          <Text
            numberOfLines={1}
            style={
              styles.templateName
            }
          >
            {
              campaign.template_name
            }
          </Text>
        </View>

        <StatusBadge
          status={
            campaign.status
          }
        />
      </View>

      <View
        style={
          styles.metaCard
        }
      >
        <View
          style={
            styles.metaRow
          }
        >
          <Text
            style={
              styles.metaLabel
            }
          >
            Provider
          </Text>

          <Text
            style={
              styles.metaValue
            }
          >
            Meta Cloud API
          </Text>
        </View>

        <View
          style={
            styles.metaRow
          }
        >
          <Text
            style={
              styles.metaLabel
            }
          >
            Category
          </Text>

          <Text
            style={
              styles.metaValue
            }
          >
            {campaign.category ||
              "-"}
          </Text>
        </View>

        <View
          style={
            styles.metaRow
          }
        >
          <Text
            style={
              styles.metaLabel
            }
          >
            Language
          </Text>

          <Text
            style={
              styles.metaValue
            }
          >
            {
              campaign.template_language
            }
          </Text>
        </View>

        <View
          style={
            styles.metaRow
          }
        >
          <Text
            style={
              styles.metaLabel
            }
          >
            Type
          </Text>

          <Text
            style={
              styles.metaValue
            }
          >
            {
              campaign.campaign_type
            }
          </Text>
        </View>

        <View
          style={
            styles.metaRow
          }
        >
          <Text
            style={
              styles.metaLabel
            }
          >
            Created
          </Text>

          <Text
            style={
              styles.metaValue
            }
          >
            {formatCampaignDate(
              campaign.created_at
            )}
          </Text>
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={
          false
        }
        contentContainerStyle={
          styles.statsRow
        }
      >
        <Stat
          label="Total"
          value={
            counts.total
          }
        />

        <Stat
          label="Pending"
          value={
            counts.pending
          }
        />

        <Stat
          label="Sent"
          value={
            counts.sent
          }
          tone="green"
        />

        <Stat
          label="Failed"
          value={
            counts.failed
          }
          tone="red"
        />

        <Stat
          label="Skipped"
          value={
            counts.skipped
          }
          tone="amber"
        />
      </ScrollView>

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

      {success ? (
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
            {success}
          </Text>
        </View>
      ) : null}

      <View
        style={
          styles.actionCard
        }
      >
        <View
          style={
            styles.actionHeading
          }
        >
          <View>
            <Text
              style={
                styles.actionTitle
              }
            >
              Campaign Actions
            </Text>

            <Text
              style={
                styles.actionSubtitle
              }
            >
              Sending is processed by the Tetamo backend.
            </Text>
          </View>

          <View
            style={
              styles.batchBox
            }
          >
            <Text
              style={
                styles.batchLabel
              }
            >
              BATCH
            </Text>

            <TextInput
              value={
                batchSize
              }
              onChangeText={(
                value
              ) =>
                setBatchSize(
                  value.replace(
                    /[^0-9]/g,
                    ""
                  )
                )
              }
              keyboardType="number-pad"
              style={
                styles.batchInput
              }
            />
          </View>
        </View>

        <View
          style={
            styles.primaryActions
          }
        >
          <Pressable
            disabled={
              busy ||
              paused ||
              counts.pending <=
                0
            }
            onPress={
              onContinue
            }
            style={[
              styles.sendButton,
              (
                busy ||
                paused ||
                counts.pending <=
                  0
              ) &&
                styles.disabledButton,
            ]}
          >
            {actionLoading ===
            "continue_pending" ? (
              <ActivityIndicator
                size="small"
                color="#FFFFFF"
              />
            ) : (
              <Send
                size={15}
                color="#FFFFFF"
              />
            )}

            <Text
              style={
                styles.sendButtonText
              }
            >
              Continue Pending
            </Text>
          </Pressable>

          <Pressable
            disabled={
              busy ||
              paused ||
              counts.failed <=
                0
            }
            onPress={
              onRetry
            }
            style={[
              styles.retryButton,
              (
                busy ||
                paused ||
                counts.failed <=
                  0
              ) &&
                styles.disabledButton,
            ]}
          >
            <RotateCcw
              size={15}
              color="#A23C3C"
            />

            <Text
              style={
                styles.retryButtonText
              }
            >
              Retry Failed
            </Text>
          </Pressable>
        </View>

        <View
          style={
            styles.secondaryActions
          }
        >
          {paused ? (
            <Pressable
              disabled={busy}
              onPress={
                onResume
              }
              style={[
                styles.resumeButton,
                busy &&
                  styles.disabledButton,
              ]}
            >
              <Play
                size={14}
                color="#24714D"
              />

              <Text
                style={
                  styles.resumeText
                }
              >
                Resume
              </Text>
            </Pressable>
          ) : (
            <Pressable
              disabled={busy}
              onPress={
                onPause
              }
              style={[
                styles.pauseButton,
                busy &&
                  styles.disabledButton,
              ]}
            >
              <Pause
                size={14}
                color="#8A6818"
              />

              <Text
                style={
                  styles.pauseText
                }
              >
                Pause
              </Text>
            </Pressable>
          )}

          <Pressable
            disabled={busy}
            onPress={
              onDelete
            }
            style={[
              styles.deleteButton,
              busy &&
                styles.disabledButton,
            ]}
          >
            <Trash2
              size={14}
              color="#A23C3C"
            />

            <Text
              style={
                styles.deleteText
              }
            >
              Delete
            </Text>
          </Pressable>
        </View>

        <Text
          style={
            styles.batchHelp
          }
        >
          Maximum batch size is 500.
        </Text>
      </View>

      <View
        style={
          styles.recipientsHeading
        }
      >
        <View>
          <Text
            style={
              styles.recipientsTitle
            }
          >
            Recipients
          </Text>

          <Text
            style={
              styles.recipientsSubtitle
            }
          >
            Sending status, errors and Meta message IDs
          </Text>
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={
          false
        }
        contentContainerStyle={
          styles.filterRow
        }
      >
        {RECIPIENT_FILTERS.map(
          (item) => {
            const active =
              filter ===
              item.value;

            return (
              <Pressable
                key={
                  item.value
                }
                onPress={() =>
                  onFilter(
                    item.value
                  )
                }
                style={[
                  styles.filterPill,
                  active &&
                    styles.filterPillActive,
                ]}
              >
                <Text
                  style={[
                    styles.filterText,
                    active &&
                      styles.filterTextActive,
                  ]}
                >
                  {
                    item.label
                  }
                </Text>
              </Pressable>
            );
          }
        )}
      </ScrollView>
    </View>
  );
}

function RecipientCard({
  recipient,
}: {
  recipient: Recipient;
}) {
  const status =
    String(
      recipient.status ||
        ""
    ).toLowerCase();

  const errorText =
    getRecipientErrorText(
      recipient
    );

  return (
    <View
      style={
        styles.recipientCard
      }
    >
      <View
        style={
          styles.recipientTop
        }
      >
        <View
          style={
            styles.recipientCopy
          }
        >
          <Text
            style={
              styles.phone
            }
          >
            +
            {
              recipient.phone_e164
            }
          </Text>

          <Text
            style={
              styles.recipientName
            }
          >
            {recipient.customer_name ||
              "No name"}
          </Text>
        </View>

        <StatusBadge
          status={
            recipient.status
          }
        />
      </View>

      <View
        style={
          styles.recipientMetaRow
        }
      >
        <Text
          style={
            styles.recipientMeta
          }
        >
          Lead:{" "}
          {recipient.lead_type ||
            "-"}
        </Text>

        <Text
          style={
            styles.recipientMeta
          }
        >
          Source:{" "}
          {recipient.source ||
            "-"}
        </Text>
      </View>

      {status ===
        "failed" ||
      status ===
        "skipped" ||
      status ===
        "pending" ? (
        <View
          style={[
            styles.reasonBox,
            status ===
              "failed"
              ? styles.reasonRed
              : status ===
                  "skipped"
                ? styles.reasonAmber
                : styles.reasonGray,
          ]}
        >
          {recipient.error_type ? (
            <Text
              style={
                styles.reasonType
              }
            >
              Type:{" "}
              {
                recipient.error_type
              }
            </Text>
          ) : null}

          <Text
            style={
              styles.reasonText
            }
          >
            {errorText}
          </Text>
        </View>
      ) : null}

      {recipient.meta_message_id ? (
        <View
          style={
            styles.messageIdBox
          }
        >
          <Text
            style={
              styles.messageIdLabel
            }
          >
            META MESSAGE ID
          </Text>

          <Text
            selectable
            style={
              styles.messageId
            }
          >
            {
              recipient.meta_message_id
            }
          </Text>
        </View>
      ) : null}

      <View
        style={
          styles.dateGrid
        }
      >
        {recipient.sent_at ? (
          <DateItem
            label="Sent"
            value={
              recipient.sent_at
            }
          />
        ) : null}

        {recipient.failed_at ? (
          <DateItem
            label="Failed"
            value={
              recipient.failed_at
            }
          />
        ) : null}

        {recipient.skipped_at ? (
          <DateItem
            label="Skipped"
            value={
              recipient.skipped_at
            }
          />
        ) : null}
      </View>
    </View>
  );
}

function DateItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <View
      style={
        styles.dateItem
      }
    >
      <Text
        style={
          styles.dateLabel
        }
      >
        {label}
      </Text>

      <Text
        style={
          styles.dateValue
        }
      >
        {formatCampaignDate(
          value
        )}
      </Text>
    </View>
  );
}

function Stat({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: number;
  tone?:
    | "default"
    | "green"
    | "red"
    | "amber";
}) {
  const toneStyle =
    tone === "green"
      ? styles.statGreen
      : tone === "red"
        ? styles.statRed
        : tone ===
            "amber"
          ? styles.statAmber
          : styles.statDefault;

  return (
    <View
      style={[
        styles.stat,
        toneStyle,
      ]}
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

function StatusBadge({
  status,
}: {
  status?: string | null;
}) {
  const clean =
    String(
      status ||
        "draft"
    ).toLowerCase();

  let icon:
    React.ReactNode;

  if (
    clean === "sent" ||
    clean === "completed"
  ) {
    icon = (
      <CheckCircle2
        size={11}
        color="#24714D"
      />
    );
  } else if (
    clean === "failed"
  ) {
    icon = (
      <XCircle
        size={11}
        color="#A23C3C"
      />
    );
  } else if (
    clean === "paused"
  ) {
    icon = (
      <Pause
        size={11}
        color="#8A6818"
      />
    );
  } else if (
    clean === "sending"
  ) {
    icon = (
      <Send
        size={11}
        color="#356C9C"
      />
    );
  } else if (
    clean === "pending"
  ) {
    icon = (
      <Clock3
        size={11}
        color="#66615B"
      />
    );
  } else {
    icon = (
      <AlertTriangle
        size={11}
        color="#66615B"
      />
    );
  }

  const style =
    clean === "sent" ||
    clean === "completed"
      ? styles.statusGreen
      : clean ===
          "failed"
        ? styles.statusRed
        : clean ===
            "paused"
          ? styles.statusAmber
          : clean ===
              "sending"
            ? styles.statusBlue
            : styles.statusGray;

  return (
    <View
      style={[
        styles.statusBadge,
        style,
      ]}
    >
      {icon}

      <Text
        style={[
          styles.statusText,
          style,
        ]}
      >
        {status ||
          "draft"}
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

    list: {
      flex: 1,
      backgroundColor:
        "#F7F5EF",
    },

    content: {
      padding: 16,
    },

    header: {
      minHeight: 64,
      paddingHorizontal: 16,
      flexDirection: "row",
      alignItems: "center",
      justifyContent:
        "space-between",
      borderBottomWidth: 1,
      borderBottomColor:
        "#E5DED4",
      backgroundColor:
        "#F7F5EF",
    },

    backButton: {
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

    headerCopy: {
      flex: 1,
      paddingHorizontal: 12,
      alignItems: "center",
    },

    headerSpacer: {
      width: 38,
    },

    eyebrow: {
      color: "#A17B2A",
      fontSize: 7.5,
      fontWeight: "900",
      letterSpacing: 1,
    },

    title: {
      marginTop: 2,
      color: "#171717",
      fontSize: 17,
      fontWeight: "900",
    },

    fullLoading: {
      flex: 1,
      alignItems: "center",
      justifyContent:
        "center",
      gap: 8,
    },

    loadingText: {
      color: "#777169",
      fontSize: 9.5,
      fontWeight: "700",
    },

    hero: {
      padding: 14,
      borderRadius: 22,
      borderWidth: 1,
      borderColor:
        "#E2D8C6",
      backgroundColor:
        "#FFFDF8",
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },

    heroIcon: {
      width: 43,
      height: 43,
      borderRadius: 15,
      backgroundColor:
        "#F6E9C8",
      alignItems: "center",
      justifyContent:
        "center",
    },

    heroCopy: {
      flex: 1,
      minWidth: 0,
    },

    campaignName: {
      color: "#171717",
      fontSize: 13,
      fontWeight: "900",
    },

    templateName: {
      marginTop: 3,
      color: "#8C857C",
      fontSize: 8,
      fontWeight: "600",
    },

    metaCard: {
      marginTop: 9,
      padding: 13,
      borderRadius: 18,
      borderWidth: 1,
      borderColor:
        "#E5DED4",
      backgroundColor:
        "#FFFFFF",
      gap: 7,
    },

    metaRow: {
      flexDirection: "row",
      alignItems:
        "flex-start",
      justifyContent:
        "space-between",
      gap: 15,
    },

    metaLabel: {
      color: "#918A82",
      fontSize: 8,
      fontWeight: "800",
    },

    metaValue: {
      flex: 1,
      color: "#36332F",
      fontSize: 8,
      fontWeight: "800",
      textAlign: "right",
    },

    statsRow: {
      gap: 7,
      paddingTop: 10,
      paddingBottom: 2,
    },

    stat: {
      minWidth: 88,
      padding: 11,
      borderRadius: 16,
      borderWidth: 1,
    },

    statDefault: {
      backgroundColor:
        "#FFFFFF",
      borderColor:
        "#E5DED4",
    },

    statGreen: {
      backgroundColor:
        "#EEF9F2",
      borderColor:
        "#B9DEC8",
    },

    statRed: {
      backgroundColor:
        "#FFF0F0",
      borderColor:
        "#EDC0C0",
    },

    statAmber: {
      backgroundColor:
        "#FFF8E1",
      borderColor:
        "#E7CF79",
    },

    statLabel: {
      color: "#8C857C",
      fontSize: 7,
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

    errorBox: {
      marginTop: 10,
      padding: 12,
      borderRadius: 15,
      borderWidth: 1,
      borderColor:
        "#EDC0C0",
      backgroundColor:
        "#FFF0F0",
    },

    errorText: {
      color: "#A23C3C",
      fontSize: 9,
      lineHeight: 14,
      fontWeight: "700",
    },

    successBox: {
      marginTop: 10,
      padding: 12,
      borderRadius: 15,
      borderWidth: 1,
      borderColor:
        "#B9DEC8",
      backgroundColor:
        "#EEF9F2",
    },

    successText: {
      color: "#24714D",
      fontSize: 9,
      lineHeight: 14,
      fontWeight: "700",
    },

    actionCard: {
      marginTop: 10,
      padding: 14,
      borderRadius: 21,
      borderWidth: 1,
      borderColor:
        "#E5DED4",
      backgroundColor:
        "#FFFFFF",
    },

    actionHeading: {
      flexDirection: "row",
      alignItems:
        "flex-start",
      justifyContent:
        "space-between",
      gap: 10,
    },

    actionTitle: {
      color: "#171717",
      fontSize: 12,
      fontWeight: "900",
    },

    actionSubtitle: {
      marginTop: 2,
      color: "#918A82",
      fontSize: 8,
      lineHeight: 12,
      fontWeight: "600",
    },

    batchBox: {
      width: 68,
      alignItems: "center",
    },

    batchLabel: {
      color: "#8C857C",
      fontSize: 6.5,
      fontWeight: "900",
    },

    batchInput: {
      marginTop: 4,
      width: 68,
      minHeight: 34,
      paddingHorizontal: 8,
      borderRadius: 11,
      borderWidth: 1,
      borderColor:
        "#DED7CD",
      backgroundColor:
        "#FFFDF9",
      color: "#171717",
      fontSize: 10,
      fontWeight: "900",
      textAlign: "center",
    },

    primaryActions: {
      marginTop: 13,
      flexDirection: "row",
      gap: 7,
    },

    sendButton: {
      flex: 1,
      minHeight: 43,
      paddingHorizontal: 10,
      borderRadius: 14,
      backgroundColor:
        "#171717",
      flexDirection: "row",
      alignItems: "center",
      justifyContent:
        "center",
      gap: 6,
    },

    sendButtonText: {
      color: "#FFFFFF",
      fontSize: 8.5,
      fontWeight: "900",
    },

    retryButton: {
      flex: 1,
      minHeight: 43,
      paddingHorizontal: 10,
      borderRadius: 14,
      borderWidth: 1,
      borderColor:
        "#EDC0C0",
      backgroundColor:
        "#FFF0F0",
      flexDirection: "row",
      alignItems: "center",
      justifyContent:
        "center",
      gap: 6,
    },

    retryButtonText: {
      color: "#A23C3C",
      fontSize: 8.5,
      fontWeight: "900",
    },

    secondaryActions: {
      marginTop: 7,
      flexDirection: "row",
      gap: 7,
    },

    pauseButton: {
      flex: 1,
      minHeight: 39,
      borderRadius: 13,
      borderWidth: 1,
      borderColor:
        "#E7CF79",
      backgroundColor:
        "#FFF8E1",
      flexDirection: "row",
      alignItems: "center",
      justifyContent:
        "center",
      gap: 5,
    },

    pauseText: {
      color: "#8A6818",
      fontSize: 8,
      fontWeight: "900",
    },

    resumeButton: {
      flex: 1,
      minHeight: 39,
      borderRadius: 13,
      borderWidth: 1,
      borderColor:
        "#B9DEC8",
      backgroundColor:
        "#EEF9F2",
      flexDirection: "row",
      alignItems: "center",
      justifyContent:
        "center",
      gap: 5,
    },

    resumeText: {
      color: "#24714D",
      fontSize: 8,
      fontWeight: "900",
    },

    deleteButton: {
      flex: 1,
      minHeight: 39,
      borderRadius: 13,
      borderWidth: 1,
      borderColor:
        "#EDC0C0",
      backgroundColor:
        "#FFF7F7",
      flexDirection: "row",
      alignItems: "center",
      justifyContent:
        "center",
      gap: 5,
    },

    deleteText: {
      color: "#A23C3C",
      fontSize: 8,
      fontWeight: "900",
    },

    disabledButton: {
      opacity: 0.35,
    },

    batchHelp: {
      marginTop: 8,
      color: "#9A938A",
      fontSize: 7.5,
      fontWeight: "600",
    },

    recipientsHeading: {
      marginTop: 20,
    },

    recipientsTitle: {
      color: "#171717",
      fontSize: 15,
      fontWeight: "900",
    },

    recipientsSubtitle: {
      marginTop: 2,
      color: "#8C857C",
      fontSize: 8.5,
      fontWeight: "600",
    },

    filterRow: {
      gap: 6,
      paddingTop: 9,
      paddingBottom: 9,
    },

    filterPill: {
      minHeight: 33,
      paddingHorizontal: 12,
      borderRadius: 999,
      borderWidth: 1,
      borderColor:
        "#DED7CD",
      backgroundColor:
        "#FFFFFF",
      alignItems: "center",
      justifyContent:
        "center",
    },

    filterPillActive: {
      backgroundColor:
        "#171717",
      borderColor:
        "#171717",
    },

    filterText: {
      color: "#6F6962",
      fontSize: 8,
      fontWeight: "900",
    },

    filterTextActive: {
      color: "#FFFFFF",
    },

    recipientCard: {
      marginBottom: 8,
      padding: 13,
      borderRadius: 18,
      borderWidth: 1,
      borderColor:
        "#E5DED4",
      backgroundColor:
        "#FFFFFF",
    },

    recipientTop: {
      flexDirection: "row",
      alignItems:
        "flex-start",
      justifyContent:
        "space-between",
      gap: 10,
    },

    recipientCopy: {
      flex: 1,
      minWidth: 0,
    },

    phone: {
      color: "#171717",
      fontSize: 10.5,
      fontWeight: "900",
    },

    recipientName: {
      marginTop: 2,
      color: "#817A72",
      fontSize: 8.5,
      fontWeight: "600",
    },

    recipientMetaRow: {
      marginTop: 9,
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 10,
    },

    recipientMeta: {
      color: "#8C857C",
      fontSize: 7.5,
      fontWeight: "700",
    },

    reasonBox: {
      marginTop: 9,
      padding: 10,
      borderRadius: 13,
      borderWidth: 1,
    },

    reasonRed: {
      backgroundColor:
        "#FFF0F0",
      borderColor:
        "#EDC0C0",
    },

    reasonAmber: {
      backgroundColor:
        "#FFF8E1",
      borderColor:
        "#E7CF79",
    },

    reasonGray: {
      backgroundColor:
        "#F7F6F4",
      borderColor:
        "#DEDAD5",
    },

    reasonType: {
      marginBottom: 3,
      color: "#554F49",
      fontSize: 7,
      fontWeight: "900",
    },

    reasonText: {
      color: "#6A645E",
      fontSize: 8,
      lineHeight: 12,
      fontWeight: "600",
    },

    messageIdBox: {
      marginTop: 9,
      padding: 9,
      borderRadius: 12,
      backgroundColor:
        "#F4F8FB",
      borderWidth: 1,
      borderColor:
        "#D5E2EC",
    },

    messageIdLabel: {
      color: "#7790A4",
      fontSize: 6.5,
      fontWeight: "900",
    },

    messageId: {
      marginTop: 3,
      color: "#42576A",
      fontSize: 7.5,
      lineHeight: 11,
      fontWeight: "600",
    },

    dateGrid: {
      marginTop: 8,
      gap: 4,
    },

    dateItem: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent:
        "space-between",
      gap: 10,
    },

    dateLabel: {
      color: "#A09A92",
      fontSize: 7,
      fontWeight: "800",
    },

    dateValue: {
      color: "#817A72",
      fontSize: 7,
      fontWeight: "600",
    },

    statusBadge: {
      paddingHorizontal: 7,
      paddingVertical: 4,
      borderRadius: 999,
      borderWidth: 1,
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },

    statusText: {
      fontSize: 7,
      fontWeight: "900",
      textTransform:
        "capitalize",
    },

    statusGreen: {
      color: "#24714D",
      backgroundColor:
        "#EEF9F2",
      borderColor:
        "#B9DEC8",
    },

    statusRed: {
      color: "#A23C3C",
      backgroundColor:
        "#FFF0F0",
      borderColor:
        "#EDC0C0",
    },

    statusAmber: {
      color: "#8A6818",
      backgroundColor:
        "#FFF8E1",
      borderColor:
        "#E7CF79",
    },

    statusBlue: {
      color: "#356C9C",
      backgroundColor:
        "#EDF6FF",
      borderColor:
        "#BBD5EC",
    },

    statusGray: {
      color: "#66615B",
      backgroundColor:
        "#F4F3F1",
      borderColor:
        "#D9D5D0",
    },

    emptyBox: {
      marginTop: 8,
      minHeight: 130,
      borderRadius: 18,
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
      color: "#171717",
      fontSize: 12,
      fontWeight: "900",
    },

    emptyText: {
      marginTop: 4,
      color: "#8C857C",
      fontSize: 8.5,
      fontWeight: "600",
    },

    footerSpace: {
      height: 35,
    },
  });
