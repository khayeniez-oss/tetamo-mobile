import {
  useFocusEffect,
  useRouter,
} from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
  ArrowLeft,
  ChevronRight,
  Megaphone,
  Plus,
  RefreshCw,
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
  adminCampaignFetch,
  Campaign,
  campaignPending,
  formatCampaignDate,
  MetaTemplate,
} from "../../../lib/adminCampaigns";

export default function AdminCampaignsScreen() {
  const router =
    useRouter();

  const [
    campaigns,
    setCampaigns,
  ] =
    useState<Campaign[]>([]);

  const [
    templates,
    setTemplates,
  ] =
    useState<MetaTemplate[]>([]);

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

  const loadCampaigns =
    useCallback(
      async (
        showLoader = true
      ) => {
        try {
          if (showLoader) {
            setLoading(true);
          }

          setError("");

          const response =
            await adminCampaignFetch();

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
                "Failed to load campaigns."
            );
          }

          setCampaigns(
            (result.campaigns ||
              []) as Campaign[]
          );

          setTemplates(
            (result.templates ||
              []) as MetaTemplate[]
          );
        } catch (
          err: any
        ) {
          console.error(
            "Load admin campaigns error:",
            err
          );

          setError(
            err?.message ||
              "Failed to load campaigns."
          );

          setCampaigns(
            []
          );

          setTemplates(
            []
          );
        } finally {
          setLoading(false);
          setRefreshing(
            false
          );
        }
      },
      []
    );

  useFocusEffect(
    useCallback(() => {
      void loadCampaigns(
        true
      );
    }, [loadCampaigns])
  );

  async function refresh() {
    setRefreshing(true);

    await loadCampaigns(
      false
    );
  }

  const totalRecipients =
    campaigns.reduce(
      (
        total,
        campaign
      ) =>
        total +
        Number(
          campaign.total_recipients ||
            0
        ),
      0
    );

  const totalSent =
    campaigns.reduce(
      (
        total,
        campaign
      ) =>
        total +
        Number(
          campaign.total_sent ||
            0
        ),
      0
    );

  const totalFailed =
    campaigns.reduce(
      (
        total,
        campaign
      ) =>
        total +
        Number(
          campaign.total_failed ||
            0
        ),
      0
    );

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
            size={18}
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
            Campaigns
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
                styles.heroTitle
              }
            >
              WhatsApp Campaign
            </Text>

            <Text
              style={
                styles.heroText
              }
            >
              Create and manage campaigns using approved Meta WhatsApp templates.
            </Text>
          </View>

          <Pressable
            style={
              styles.createButton
            }
            onPress={() =>
              router.push(
                "/admin/campaigns/create" as any
              )
            }
          >
            <Plus
              size={16}
              color="#FFFFFF"
            />

            <Text
              style={
                styles.createButtonText
              }
            >
              Create
            </Text>
          </Pressable>
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
          <StatCard
            label="Campaigns"
            value={
              campaigns.length
            }
          />

          <StatCard
            label="Templates"
            value={
              templates.length
            }
          />

          <StatCard
            label="Recipients"
            value={
              totalRecipients
            }
          />

          <StatCard
            label="Sent"
            value={
              totalSent
            }
          />

          <StatCard
            label="Failed"
            value={
              totalFailed
            }
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

        <View
          style={
            styles.sectionHeader
          }
        >
          <View>
            <Text
              style={
                styles.sectionTitle
              }
            >
              Campaigns
            </Text>

            <Text
              style={
                styles.sectionSubtitle
              }
            >
              Latest Meta campaigns
            </Text>
          </View>

          <View
            style={
              styles.metaBadge
            }
          >
            <Text
              style={
                styles.metaBadgeText
              }
            >
              META CLOUD API
            </Text>
          </View>
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
              Loading campaigns...
            </Text>
          </View>
        ) : null}

        {!loading &&
        campaigns.length ===
          0 ? (
          <View
            style={
              styles.emptyBox
            }
          >
            <Megaphone
              size={31}
              color="#B8892E"
            />

            <Text
              style={
                styles.emptyTitle
              }
            >
              No campaigns yet
            </Text>

            <Text
              style={
                styles.emptyText
              }
            >
              Create your first Meta WhatsApp campaign using an approved template.
            </Text>
          </View>
        ) : null}

        {!loading ? (
          <View
            style={
              styles.campaignList
            }
          >
            {campaigns.map(
              (
                campaign
              ) => (
                <CampaignCard
                  key={
                    campaign.id
                  }
                  campaign={
                    campaign
                  }
                  onPress={() =>
                    router.push(
                      `/admin/campaigns/${campaign.id}` as any
                    )
                  }
                />
              )
            )}
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function CampaignCard({
  campaign,
  onPress,
}: {
  campaign: Campaign;
  onPress: () => void;
}) {
  const pending =
    campaignPending(
      campaign
    );

  return (
    <Pressable
      style={
        styles.campaignCard
      }
      onPress={
        onPress
      }
    >
      <View
        style={
          styles.cardTop
        }
      >
        <View
          style={
            styles.cardCopy
          }
        >
          <Text
            numberOfLines={1}
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
            {campaign.template_name}
          </Text>
        </View>

        <View
          style={
            styles.cardTopRight
          }
        >
          <StatusBadge
            status={
              campaign.status
            }
          />

          <ChevronRight
            size={17}
            color="#A39C93"
          />
        </View>
      </View>

      <View
        style={
          styles.badgeRow
        }
      >
        <View
          style={
            styles.providerBadge
          }
        >
          <Text
            style={
              styles.providerBadgeText
            }
          >
            Meta Cloud API
          </Text>
        </View>

        <View
          style={
            styles.categoryBadge
          }
        >
          <Text
            style={
              styles.categoryBadgeText
            }
          >
            {campaign.category ||
              "marketing"}
          </Text>
        </View>
      </View>

      <View
        style={
          styles.numberGrid
        }
      >
        <Count
          label="Pending"
          value={pending}
        />

        <Count
          label="Sent"
          value={
            Number(
              campaign.total_sent ||
                0
            )
          }
        />

        <Count
          label="Failed"
          value={
            Number(
              campaign.total_failed ||
                0
            )
          }
        />

        <Count
          label="Skipped"
          value={
            Number(
              campaign.total_skipped ||
                0
            )
          }
        />
      </View>

      <Text
        style={
          styles.createdText
        }
      >
        Created{" "}
        {formatCampaignDate(
          campaign.created_at
        )}
      </Text>
    </Pressable>
  );
}

function StatCard({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <View
      style={
        styles.statCard
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

function Count({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <View
      style={
        styles.count
      }
    >
      <Text
        style={
          styles.countLabel
        }
      >
        {label}
      </Text>

      <Text
        style={
          styles.countValue
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
      status || "draft"
    ).toLowerCase();

  const tone =
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
        tone,
      ]}
    >
      <Text
        style={[
          styles.statusBadgeText,
          tone,
        ]}
      >
        {status || "draft"}
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

    headerCopy: {
      alignItems: "center",
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

    content: {
      padding: 16,
      paddingBottom: 45,
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
      width: 42,
      height: 42,
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

    heroTitle: {
      color: "#171717",
      fontSize: 13,
      fontWeight: "900",
    },

    heroText: {
      marginTop: 3,
      color: "#777169",
      fontSize: 8.5,
      lineHeight: 12,
      fontWeight: "600",
    },

    createButton: {
      minHeight: 37,
      paddingHorizontal: 11,
      borderRadius: 13,
      backgroundColor:
        "#171717",
      flexDirection: "row",
      alignItems: "center",
      justifyContent:
        "center",
      gap: 5,
    },

    createButtonText: {
      color: "#FFFFFF",
      fontSize: 8.5,
      fontWeight: "900",
    },

    statsRow: {
      paddingTop: 13,
      paddingBottom: 2,
      gap: 7,
    },

    statCard: {
      minWidth: 91,
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
      fontSize: 7.5,
      fontWeight: "900",
      textTransform:
        "uppercase",
    },

    statValue: {
      marginTop: 5,
      color: "#171717",
      fontSize: 17,
      fontWeight: "900",
    },

    errorBox: {
      marginTop: 13,
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
      fontSize: 9.5,
      lineHeight: 14,
      fontWeight: "700",
    },

    sectionHeader: {
      marginTop: 20,
      marginBottom: 9,
      flexDirection: "row",
      alignItems:
        "flex-end",
      justifyContent:
        "space-between",
      gap: 10,
    },

    sectionTitle: {
      color: "#171717",
      fontSize: 16,
      fontWeight: "900",
    },

    sectionSubtitle: {
      marginTop: 2,
      color: "#8C857C",
      fontSize: 9,
      fontWeight: "600",
    },

    metaBadge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 999,
      borderWidth: 1,
      borderColor:
        "#BBD5EC",
      backgroundColor:
        "#EDF6FF",
    },

    metaBadgeText: {
      color: "#356C9C",
      fontSize: 6.8,
      fontWeight: "900",
    },

    loadingBox: {
      minHeight: 130,
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
      fontSize: 9.5,
      fontWeight: "700",
    },

    emptyBox: {
      minHeight: 180,
      borderRadius: 22,
      borderWidth: 1,
      borderColor:
        "#E5DED4",
      backgroundColor:
        "#FFFFFF",
      alignItems: "center",
      justifyContent:
        "center",
      padding: 24,
    },

    emptyTitle: {
      marginTop: 8,
      color: "#171717",
      fontSize: 13,
      fontWeight: "900",
    },

    emptyText: {
      marginTop: 5,
      maxWidth: 270,
      color: "#8C857C",
      fontSize: 9.5,
      lineHeight: 14,
      textAlign: "center",
    },

    campaignList: {
      gap: 9,
    },

    campaignCard: {
      padding: 14,
      borderRadius: 20,
      borderWidth: 1,
      borderColor:
        "#E5DED4",
      backgroundColor:
        "#FFFFFF",
    },

    cardTop: {
      flexDirection: "row",
      alignItems:
        "flex-start",
      justifyContent:
        "space-between",
      gap: 10,
    },

    cardCopy: {
      flex: 1,
      minWidth: 0,
    },

    campaignName: {
      color: "#171717",
      fontSize: 12.5,
      fontWeight: "900",
    },

    templateName: {
      marginTop: 3,
      color: "#8C857C",
      fontSize: 8,
      fontWeight: "600",
    },

    cardTopRight: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },

    statusBadge: {
      paddingHorizontal: 7,
      paddingVertical: 4,
      borderRadius: 999,
      borderWidth: 1,
    },

    statusBadgeText: {
      fontSize: 7.2,
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

    badgeRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 5,
      marginTop: 10,
    },

    providerBadge: {
      paddingHorizontal: 7,
      paddingVertical: 4,
      borderRadius: 999,
      backgroundColor:
        "#EDF6FF",
      borderWidth: 1,
      borderColor:
        "#BBD5EC",
    },

    providerBadgeText: {
      color: "#356C9C",
      fontSize: 7,
      fontWeight: "900",
    },

    categoryBadge: {
      paddingHorizontal: 7,
      paddingVertical: 4,
      borderRadius: 999,
      backgroundColor:
        "#F5EEFF",
      borderWidth: 1,
      borderColor:
        "#D7C2F2",
    },

    categoryBadgeText: {
      color: "#7146A0",
      fontSize: 7,
      fontWeight: "900",
      textTransform:
        "capitalize",
    },

    numberGrid: {
      marginTop: 12,
      flexDirection: "row",
      gap: 6,
    },

    count: {
      flex: 1,
      minWidth: 0,
      padding: 8,
      borderRadius: 12,
      backgroundColor:
        "#F8F6F1",
    },

    countLabel: {
      color: "#969087",
      fontSize: 6.7,
      fontWeight: "900",
      textTransform:
        "uppercase",
    },

    countValue: {
      marginTop: 3,
      color: "#171717",
      fontSize: 11,
      fontWeight: "900",
    },

    createdText: {
      marginTop: 10,
      color: "#A09A92",
      fontSize: 7.5,
      fontWeight: "600",
    },
  });
