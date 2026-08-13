import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
  AlertTriangle,
  ArrowLeft,
  BadgeDollarSign,
  Building2,
  CircleCheckBig,
  CreditCard,
  Package,
  QrCode,
  RefreshCw,
  TrendingUp,
  Users,
  WalletCards,
} from "lucide-react-native";
import {
  useCallback,
  useEffect,
  useMemo,
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
  AdminRevenueResponse,
  CurrencyTotals,
  fetchAdminRevenue,
} from "../../lib/adminRevenue";

function formatCurrencyAmount(
  amount: number,
  currency = "IDR"
) {
  const code =
    String(currency || "IDR").toUpperCase();

  if (code === "IDR") {
    return `Rp ${new Intl.NumberFormat(
      "id-ID",
      {
        maximumFractionDigits: 0,
      }
    ).format(amount || 0)}`;
  }

  try {
    return new Intl.NumberFormat(
      "en-US",
      {
        style: "currency",
        currency: code,
        maximumFractionDigits: 0,
      }
    ).format(amount || 0);
  } catch {
    return `${code} ${new Intl.NumberFormat(
      "en-US"
    ).format(amount || 0)}`;
  }
}

function formatTotals(
  totals?: CurrencyTotals
) {
  const entries =
    Object.entries(
      totals || {}
    ).filter(
      ([, value]) =>
        Number(value || 0) !== 0
    );

  if (!entries.length) {
    return "Rp 0";
  }

  return entries
    .map(([currency, value]) =>
      formatCurrencyAmount(
        Number(value || 0),
        currency
      )
    )
    .join(" · ");
}

function getIdr(
  totals?: CurrencyTotals
) {
  return Number(
    totals?.IDR ??
      totals?.idr ??
      0
  );
}

function formatDateTime(
  value?: string | null
) {
  if (!value) return "-";

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "-";
  }

  return new Intl.DateTimeFormat(
    "en-GB",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone:
        "Asia/Jakarta",
    }
  ).format(date);
}

export default function AdminRevenueScreen() {
  const router =
    useRouter();

  const [data, setData] =
    useState<AdminRevenueResponse | null>(
      null
    );

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState("");

  const loadRevenue =
    useCallback(
      async (
        manualRefresh = false
      ) => {
        if (manualRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError("");

        try {
          const result =
            await fetchAdminRevenue();

          setData(result);
        } catch (err) {
          console.error(
            "Failed to load admin revenue:",
            err
          );

          setError(
            err instanceof Error
              ? err.message
              : "Failed to load revenue analytics."
          );
        } finally {
          setLoading(false);
          setRefreshing(false);
        }
      },
      []
    );

  useEffect(() => {
    void loadRevenue();
  }, [loadRevenue]);

  const maxTrendRevenue =
    useMemo(() => {
      if (
        !data?.trend?.length
      ) {
        return 0;
      }

      return Math.max(
        ...data.trend.map(
          (item) =>
            getIdr(
              item.revenue
            )
        ),
        0
      );
    }, [data]);

  return (
    <SafeAreaView
      style={styles.safeArea}
    >
      <StatusBar style="dark" />

      <ScrollView
        style={styles.scroll}
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
            onRefresh={() =>
              void loadRevenue(
                true
              )
            }
            tintColor="#B8892E"
          />
        }
      >
        <View
          style={styles.header}
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
              color="#171717"
              size={18}
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
              TETAMO ADMIN
            </Text>

            <Text
              style={styles.title}
            >
              Revenue Analytics
            </Text>

            <Text
              style={
                styles.subtitle
              }
            >
              Verified Stripe and
              HitPay revenue from
              Tetamo payments.
            </Text>
          </View>

          <Pressable
            style={
              styles.refreshButton
            }
            disabled={
              refreshing
            }
            onPress={() =>
              void loadRevenue(
                true
              )
            }
          >
            {refreshing ? (
              <ActivityIndicator
                color="#8F6B1E"
                size="small"
              />
            ) : (
              <RefreshCw
                color="#8F6B1E"
                size={17}
              />
            )}
          </Pressable>
        </View>

        {loading ? (
          <View
            style={
              styles.loadingWrap
            }
          >
            <ActivityIndicator
              color="#B8892E"
              size="large"
            />

            <Text
              style={
                styles.loadingText
              }
            >
              Loading verified
              revenue...
            </Text>
          </View>
        ) : error || !data ? (
          <View
            style={
              styles.errorCard
            }
          >
            <AlertTriangle
              color="#A05A23"
              size={22}
            />

            <Text
              style={
                styles.errorTitle
              }
            >
              Unable to load
              revenue
            </Text>

            <Text
              style={
                styles.errorText
              }
            >
              {error ||
                "Revenue data is unavailable."}
            </Text>

            <Pressable
              style={
                styles.retryButton
              }
              onPress={() =>
                void loadRevenue(
                  true
                )
              }
            >
              <RefreshCw
                color="#171717"
                size={14}
              />

              <Text
                style={
                  styles.retryText
                }
              >
                Try again
              </Text>
            </Pressable>
          </View>
        ) : (
          <>
            <View
              style={
                styles.statGrid
              }
            >
              <StatCard
                label="REVENUE TODAY"
                value={formatTotals(
                  data.summary.today
                    .revenue
                )}
                detail={`${data.summary.today.sales} successful ${
                  data.summary.today
                    .sales === 1
                    ? "sale"
                    : "sales"
                }`}
                icon={
                  <BadgeDollarSign
                    color="#171717"
                    size={19}
                  />
                }
              />

              <StatCard
                label="THIS MONTH"
                value={formatTotals(
                  data.summary.month
                    .revenue
                )}
                detail={`${data.summary.month.sales} successful ${
                  data.summary.month
                    .sales === 1
                    ? "sale"
                    : "sales"
                }`}
                icon={
                  <TrendingUp
                    color="#171717"
                    size={19}
                  />
                }
              />

              <StatCard
                label="TOTAL VERIFIED"
                value={formatTotals(
                  data.summary.total
                    .revenue
                )}
                detail="Stripe + HitPay"
                icon={
                  <WalletCards
                    color="#171717"
                    size={19}
                  />
                }
              />

              <StatCard
                label="SUCCESSFUL SALES"
                value={String(
                  data.summary.total
                    .sales
                )}
                detail="Provider confirmed"
                icon={
                  <CircleCheckBig
                    color="#171717"
                    size={19}
                  />
                }
              />
            </View>

            <SectionCard
              title="Revenue Trend"
              subtitle="Verified revenue for the last 6 months."
            >
              <View
                style={
                  styles.chart
                }
              >
                {data.trend.map(
                  (item) => {
                    const amount =
                      getIdr(
                        item.revenue
                      );

                    const ratio =
                      maxTrendRevenue >
                      0
                        ? amount /
                          maxTrendRevenue
                        : 0;

                    const barHeight =
                      amount > 0
                        ? Math.max(
                            8,
                            ratio * 112
                          )
                        : 2;

                    return (
                      <View
                        key={
                          item.key
                        }
                        style={
                          styles.chartColumn
                        }
                      >
                        <Text
                          numberOfLines={
                            1
                          }
                          style={
                            styles.chartAmount
                          }
                        >
                          {amount >
                          0
                            ? formatCurrencyAmount(
                                amount,
                                "IDR"
                              )
                            : "Rp 0"}
                        </Text>

                        <View
                          style={
                            styles.chartTrack
                          }
                        >
                          <View
                            style={[
                              styles.chartBar,
                              {
                                height:
                                  barHeight,
                              },
                            ]}
                          />
                        </View>

                        <Text
                          style={
                            styles.chartLabel
                          }
                        >
                          {item.label}
                        </Text>

                        <Text
                          style={
                            styles.chartSales
                          }
                        >
                          {item.sales}
                        </Text>
                      </View>
                    );
                  }
                )}
              </View>
            </SectionCard>

            <SectionCard
              title="By Payment Provider"
              subtitle="Revenue confirmed by each payment gateway."
            >
              <View
                style={
                  styles.breakdownGrid
                }
              >
                <BreakdownCard
                  title="HitPay"
                  subtitle="QRIS & HitPay"
                  value={formatTotals(
                    data.providers
                      .hitpay.revenue
                  )}
                  sales={
                    data.providers
                      .hitpay.sales
                  }
                  icon={
                    <QrCode
                      color="#171717"
                      size={18}
                    />
                  }
                />

                <BreakdownCard
                  title="Stripe"
                  subtitle="Card payments"
                  value={formatTotals(
                    data.providers
                      .stripe.revenue
                  )}
                  sales={
                    data.providers
                      .stripe.sales
                  }
                  icon={
                    <CreditCard
                      color="#171717"
                      size={18}
                    />
                  }
                />
              </View>
            </SectionCard>

            <SectionCard
              title="By Customer Type"
              subtitle="Verified owner and agent revenue."
            >
              <View
                style={
                  styles.breakdownGrid
                }
              >
                <BreakdownCard
                  title="Owners"
                  subtitle="Property listings"
                  value={formatTotals(
                    data.customerTypes
                      .owner.revenue
                  )}
                  sales={
                    data.customerTypes
                      .owner.sales
                  }
                  icon={
                    <Building2
                      color="#171717"
                      size={18}
                    />
                  }
                />

                <BreakdownCard
                  title="Agents"
                  subtitle="Memberships"
                  value={formatTotals(
                    data.customerTypes
                      .agent.revenue
                  )}
                  sales={
                    data.customerTypes
                      .agent.sales
                  }
                  icon={
                    <Users
                      color="#171717"
                      size={18}
                    />
                  }
                />
              </View>
            </SectionCard>

            <SectionCard
              title="Revenue by Product"
              subtitle="Verified Tetamo products and packages."
            >
              {data.products.length ===
              0 ? (
                <View
                  style={
                    styles.emptyProduct
                  }
                >
                  <Package
                    color="#A09A91"
                    size={20}
                  />

                  <Text
                    style={
                      styles.emptyText
                    }
                  >
                    No verified product
                    revenue yet.
                  </Text>
                </View>
              ) : (
                <View
                  style={
                    styles.productList
                  }
                >
                  {data.products.map(
                    (
                      product,
                      index
                    ) => (
                      <View
                        key={
                          product.key
                        }
                        style={[
                          styles.productRow,
                          index !==
                            data.products
                              .length -
                              1 &&
                            styles.productRowBorder,
                        ]}
                      >
                        <View
                          style={
                            styles.productCopy
                          }
                        >
                          <Text
                            numberOfLines={
                              1
                            }
                            style={
                              styles.productName
                            }
                          >
                            {
                              product.label
                            }
                          </Text>

                          <Text
                            style={
                              styles.productSales
                            }
                          >
                            {
                              product.sales
                            }{" "}
                            successful{" "}
                            {product.sales ===
                            1
                              ? "sale"
                              : "sales"}
                          </Text>
                        </View>

                        <Text
                          style={
                            styles.productRevenue
                          }
                        >
                          {formatTotals(
                            product.revenue
                          )}
                        </Text>
                      </View>
                    )
                  )}
                </View>
              )}
            </SectionCard>

            {data.unverifiedPaid
              .sales > 0 ? (
              <View
                style={
                  styles.warningCard
                }
              >
                <View
                  style={
                    styles.warningIcon
                  }
                >
                  <AlertTriangle
                    color="#9A681D"
                    size={18}
                  />
                </View>

                <View
                  style={
                    styles.warningCopy
                  }
                >
                  <Text
                    style={
                      styles.warningTitle
                    }
                  >
                    Unverified /
                    Manual Paid
                  </Text>

                  <Text
                    style={
                      styles.warningDescription
                    }
                  >
                    Marked paid but no
                    verified Stripe or
                    HitPay webhook
                    evidence. Excluded
                    from all totals
                    above.
                  </Text>

                  <View
                    style={
                      styles.warningSummary
                    }
                  >
                    <Text
                      style={
                        styles.warningCount
                      }
                    >
                      {
                        data
                          .unverifiedPaid
                          .sales
                      }{" "}
                      {data
                        .unverifiedPaid
                        .sales === 1
                        ? "transaction"
                        : "transactions"}
                    </Text>

                    <Text
                      style={
                        styles.warningAmount
                      }
                    >
                      {formatTotals(
                        data
                          .unverifiedPaid
                          .revenue
                      )}
                    </Text>
                  </View>

                  {data.unverifiedPaid.transactions.map(
                    (
                      transaction
                    ) => (
                      <View
                        key={
                          transaction.id
                        }
                        style={
                          styles.warningTransaction
                        }
                      >
                        <View
                          style={
                            styles.warningTransactionCopy
                          }
                        >
                          <Text
                            numberOfLines={
                              1
                            }
                            style={
                              styles.warningTransactionName
                            }
                          >
                            {
                              transaction.product
                            }
                          </Text>

                          <Text
                            style={
                              styles.warningTransactionDate
                            }
                          >
                            {formatDateTime(
                              transaction.paidAt
                            )}
                          </Text>
                        </View>

                        <Text
                          style={
                            styles.warningTransactionAmount
                          }
                        >
                          {formatCurrencyAmount(
                            transaction.amount,
                            transaction.currency
                          )}
                        </Text>
                      </View>
                    )
                  )}
                </View>
              </View>
            ) : null}

            <View
              style={
                styles.footerMeta
              }
            >
              <Text
                style={
                  styles.footerMetaText
                }
              >
                {
                  data.reportingTimezone
                }
              </Text>

              <Text
                style={
                  styles.footerMetaText
                }
              >
                Updated{" "}
                {formatDateTime(
                  data.generatedAt
                )}
              </Text>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function StatCard({
  label,
  value,
  detail,
  icon,
}: {
  label: string;
  value: string;
  detail: string;
  icon: React.ReactNode;
}) {
  return (
    <View
      style={styles.statCard}
    >
      <View
        style={styles.statIcon}
      >
        {icon}
      </View>

      <Text
        style={styles.statLabel}
      >
        {label}
      </Text>

      <Text
        style={styles.statValue}
      >
        {value}
      </Text>

      <Text
        style={styles.statDetail}
      >
        {detail}
      </Text>
    </View>
  );
}

function SectionCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <View
      style={
        styles.sectionCard
      }
    >
      <Text
        style={
          styles.sectionTitle
        }
      >
        {title}
      </Text>

      <Text
        style={
          styles.sectionSubtitle
        }
      >
        {subtitle}
      </Text>

      <View
        style={
          styles.sectionBody
        }
      >
        {children}
      </View>
    </View>
  );
}

function BreakdownCard({
  title,
  subtitle,
  value,
  sales,
  icon,
}: {
  title: string;
  subtitle: string;
  value: string;
  sales: number;
  icon: React.ReactNode;
}) {
  return (
    <View
      style={
        styles.breakdownCard
      }
    >
      <View
        style={
          styles.breakdownTop
        }
      >
        <View
          style={
            styles.breakdownIcon
          }
        >
          {icon}
        </View>

        <View
          style={
            styles.breakdownCopy
          }
        >
          <Text
            style={
              styles.breakdownTitle
            }
          >
            {title}
          </Text>

          <Text
            style={
              styles.breakdownSubtitle
            }
          >
            {subtitle}
          </Text>
        </View>
      </View>

      <Text
        style={
          styles.breakdownValue
        }
      >
        {value}
      </Text>

      <Text
        style={
          styles.breakdownSales
        }
      >
        {sales} successful{" "}
        {sales === 1
          ? "sale"
          : "sales"}
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

    scroll: {
      flex: 1,
      backgroundColor:
        "#F7F5EF",
    },

    content: {
      paddingHorizontal: 18,
      paddingTop: 14,
      paddingBottom: 50,
    },

    header: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 10,
    },

    backButton: {
      width: 40,
      height: 40,
      borderRadius: 14,
      backgroundColor:
        "#FFFFFF",
      borderWidth: 1,
      borderColor: "#E5DED4",
      alignItems: "center",
      justifyContent:
        "center",
    },

    headerCopy: {
      flex: 1,
      paddingTop: 1,
    },

    eyebrow: {
      color: "#9A7624",
      fontSize: 8.5,
      fontWeight: "900",
      letterSpacing: 0.9,
    },

    title: {
      marginTop: 4,
      color: "#171717",
      fontSize: 25,
      lineHeight: 30,
      fontWeight: "900",
      letterSpacing: -0.5,
    },

    subtitle: {
      marginTop: 4,
      color: "#777169",
      fontSize: 11,
      lineHeight: 16,
      fontWeight: "600",
    },

    refreshButton: {
      width: 40,
      height: 40,
      borderRadius: 14,
      backgroundColor:
        "#F4E8C5",
      alignItems: "center",
      justifyContent:
        "center",
    },

    loadingWrap: {
      minHeight: 420,
      alignItems: "center",
      justifyContent:
        "center",
      gap: 12,
    },

    loadingText: {
      color: "#777169",
      fontSize: 11,
      fontWeight: "700",
    },

    errorCard: {
      marginTop: 26,
      borderRadius: 22,
      borderWidth: 1,
      borderColor: "#E7C8AF",
      backgroundColor:
        "#FFF7F0",
      padding: 18,
      alignItems: "flex-start",
    },

    errorTitle: {
      marginTop: 10,
      color: "#7F421B",
      fontSize: 15,
      fontWeight: "900",
    },

    errorText: {
      marginTop: 5,
      color: "#9D6541",
      fontSize: 11,
      lineHeight: 17,
      fontWeight: "600",
    },

    retryButton: {
      marginTop: 14,
      minHeight: 38,
      borderRadius: 13,
      borderWidth: 1,
      borderColor: "#E5DED4",
      backgroundColor:
        "#FFFFFF",
      paddingHorizontal: 12,
      flexDirection: "row",
      alignItems: "center",
      gap: 7,
    },

    retryText: {
      color: "#171717",
      fontSize: 10,
      fontWeight: "900",
    },

    statGrid: {
      marginTop: 24,
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 10,
    },

    statCard: {
      width: "48.4%",
      minHeight: 145,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: "#E6DFD5",
      backgroundColor:
        "#FFFFFF",
      padding: 13,
    },

    statIcon: {
      width: 35,
      height: 35,
      borderRadius: 12,
      backgroundColor:
        "#F0D889",
      alignItems: "center",
      justifyContent:
        "center",
    },

    statLabel: {
      marginTop: 12,
      color: "#9A948B",
      fontSize: 7.8,
      fontWeight: "900",
      letterSpacing: 0.55,
    },

    statValue: {
      marginTop: 5,
      color: "#171717",
      fontSize: 16,
      lineHeight: 20,
      fontWeight: "900",
      letterSpacing: -0.25,
    },

    statDetail: {
      marginTop: 4,
      color: "#8B857D",
      fontSize: 9,
      lineHeight: 13,
      fontWeight: "600",
    },

    sectionCard: {
      marginTop: 14,
      borderRadius: 22,
      borderWidth: 1,
      borderColor: "#E6DFD5",
      backgroundColor:
        "#FFFFFF",
      padding: 16,
    },

    sectionTitle: {
      color: "#171717",
      fontSize: 14,
      fontWeight: "900",
    },

    sectionSubtitle: {
      marginTop: 4,
      color: "#888178",
      fontSize: 10,
      lineHeight: 15,
      fontWeight: "600",
    },

    sectionBody: {
      marginTop: 16,
    },

    chart: {
      height: 172,
      flexDirection: "row",
      alignItems: "flex-end",
      gap: 5,
    },

    chartColumn: {
      flex: 1,
      minWidth: 0,
      alignItems: "center",
    },

    chartAmount: {
      width: "100%",
      color: "#777169",
      fontSize: 6.8,
      fontWeight: "700",
      textAlign: "center",
    },

    chartTrack: {
      marginTop: 5,
      width: "72%",
      height: 112,
      borderRadius: 8,
      backgroundColor:
        "#F5F2EC",
      justifyContent:
        "flex-end",
      overflow: "hidden",
    },

    chartBar: {
      width: "100%",
      borderTopLeftRadius: 7,
      borderTopRightRadius: 7,
      backgroundColor:
        "#171717",
    },

    chartLabel: {
      marginTop: 6,
      color: "#777169",
      fontSize: 7.2,
      fontWeight: "800",
      textAlign: "center",
    },

    chartSales: {
      marginTop: 2,
      color: "#A09A91",
      fontSize: 7,
      fontWeight: "700",
    },

    breakdownGrid: {
      flexDirection: "row",
      gap: 9,
    },

    breakdownCard: {
      flex: 1,
      borderRadius: 17,
      borderWidth: 1,
      borderColor: "#EEE8DF",
      backgroundColor:
        "#FAF9F6",
      padding: 12,
    },

    breakdownTop: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },

    breakdownIcon: {
      width: 34,
      height: 34,
      borderRadius: 11,
      borderWidth: 1,
      borderColor: "#E8E1D7",
      backgroundColor:
        "#FFFFFF",
      alignItems: "center",
      justifyContent:
        "center",
    },

    breakdownCopy: {
      flex: 1,
      minWidth: 0,
    },

    breakdownTitle: {
      color: "#171717",
      fontSize: 11,
      fontWeight: "900",
    },

    breakdownSubtitle: {
      marginTop: 2,
      color: "#99928A",
      fontSize: 8,
      fontWeight: "600",
    },

    breakdownValue: {
      marginTop: 13,
      color: "#171717",
      fontSize: 12,
      lineHeight: 16,
      fontWeight: "900",
    },

    breakdownSales: {
      marginTop: 3,
      color: "#8D867D",
      fontSize: 8.5,
      fontWeight: "600",
    },

    emptyProduct: {
      minHeight: 110,
      borderRadius: 17,
      borderWidth: 1,
      borderStyle: "dashed",
      borderColor: "#DDD6CC",
      backgroundColor:
        "#FAF9F6",
      alignItems: "center",
      justifyContent:
        "center",
      gap: 7,
    },

    emptyText: {
      color: "#8E877F",
      fontSize: 10,
      fontWeight: "600",
    },

    productList: {
      borderRadius: 17,
      borderWidth: 1,
      borderColor: "#EEE8DF",
      overflow: "hidden",
    },

    productRow: {
      minHeight: 62,
      paddingHorizontal: 12,
      paddingVertical: 11,
      flexDirection: "row",
      alignItems: "center",
      justifyContent:
        "space-between",
      gap: 12,
    },

    productRowBorder: {
      borderBottomWidth: 1,
      borderBottomColor:
        "#F0ECE6",
    },

    productCopy: {
      flex: 1,
      minWidth: 0,
    },

    productName: {
      color: "#171717",
      fontSize: 10.5,
      fontWeight: "900",
    },

    productSales: {
      marginTop: 3,
      color: "#918A82",
      fontSize: 8.5,
      fontWeight: "600",
    },

    productRevenue: {
      maxWidth: "45%",
      color: "#171717",
      fontSize: 10.5,
      lineHeight: 14,
      fontWeight: "900",
      textAlign: "right",
    },

    warningCard: {
      marginTop: 14,
      borderRadius: 22,
      borderWidth: 1,
      borderColor: "#E9CF99",
      backgroundColor:
        "#FFF8E7",
      padding: 15,
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 11,
    },

    warningIcon: {
      width: 38,
      height: 38,
      borderRadius: 13,
      borderWidth: 1,
      borderColor: "#E9CF99",
      backgroundColor:
        "#FFFFFF",
      alignItems: "center",
      justifyContent:
        "center",
    },

    warningCopy: {
      flex: 1,
      minWidth: 0,
    },

    warningTitle: {
      color: "#6F4D16",
      fontSize: 12,
      fontWeight: "900",
    },

    warningDescription: {
      marginTop: 4,
      color: "#8A6A32",
      fontSize: 9.5,
      lineHeight: 15,
      fontWeight: "600",
    },

    warningSummary: {
      marginTop: 11,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: "#EAD7AE",
      backgroundColor:
        "#FFFFFF",
      padding: 10,
      flexDirection: "row",
      alignItems: "center",
      justifyContent:
        "space-between",
      gap: 8,
    },

    warningCount: {
      color: "#7D715F",
      fontSize: 8.5,
      fontWeight: "700",
    },

    warningAmount: {
      color: "#171717",
      fontSize: 10,
      fontWeight: "900",
    },

    warningTransaction: {
      marginTop: 7,
      borderRadius: 12,
      backgroundColor:
        "rgba(255,255,255,0.72)",
      padding: 10,
      flexDirection: "row",
      alignItems: "center",
      justifyContent:
        "space-between",
      gap: 8,
    },

    warningTransactionCopy: {
      flex: 1,
      minWidth: 0,
    },

    warningTransactionName: {
      color: "#171717",
      fontSize: 9,
      fontWeight: "800",
    },

    warningTransactionDate: {
      marginTop: 2,
      color: "#998B76",
      fontSize: 7.5,
      fontWeight: "600",
    },

    warningTransactionAmount: {
      color: "#171717",
      fontSize: 9,
      fontWeight: "900",
    },

    footerMeta: {
      marginTop: 16,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: "#E9E3DA",
      flexDirection: "row",
      alignItems: "center",
      justifyContent:
        "space-between",
      gap: 10,
    },

    footerMetaText: {
      color: "#A09A91",
      fontSize: 7.5,
      fontWeight: "600",
    },
  });
