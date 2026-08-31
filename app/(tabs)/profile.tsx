import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";

import {
  BarChart3,
  Bookmark,
  Bot,
  Building2,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock3,
  FileText,
  Heart,
  Home,
  Languages,
  LogIn,
  LogOut,
  Mail,
  MapPin,
  MessageCircle,
  PackageCheck,
  Pencil,
  Phone,
  Plus,
  ReceiptText,
  Settings,
  ShieldCheck,
  UserRound,
  Wallet,
} from "lucide-react-native";

import type { ReactNode } from "react";
import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { supabase } from "../../lib/supabase";

/*
 * =====================================================
 * TYPES
 * =====================================================
 */

type Language = "en" | "id";

type Role =
  | "owner"
  | "agent"
  | "developer"
  | "admin"
  | "guest";

type ProfileRow = {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  role: string | null;
  agency: string | null;
  address: string | null;
  photo_url: string | null;

  instagram_url?: string | null;
  facebook_url?: string | null;
  tiktok_url?: string | null;
  youtube_url?: string | null;
  linkedin_url?: string | null;
};

type PropertyRow = {
  id: string;
  user_id: string | null;
  kode: string | null;

  title: string | null;
  title_id: string | null;

  price: number | null;

  province: string | null;
  city: string | null;
  area: string | null;

  source: string | null;

  status: string | null;
  verification_status: string | null;
  transaction_status: string | null;

  listing_expires_at: string | null;

  created_at: string | null;
  posted_date: string | null;

  plan_id: string | null;
};

type PropertyImageRow = {
  id: string;
  property_id: string;
  image_url: string;

  sort_order: number | null;
  is_cover: boolean | null;
};

type AgentMembershipRow = {
  id: string;

  user_id: string | null;
  payment_id: string | null;

  package_id: string | null;
  package_name: string | null;

  billing_cycle: string | null;
  listing_limit: number | null;

  status: string | null;
  auto_renew: boolean | null;

  starts_at: string | null;
  expires_at: string | null;

  metadata:
    | Record<string, any>
    | null;

  created_at: string | null;
  updated_at: string | null;
};

type ListingCardRow =
  PropertyRow & {
    photo?: string;
  };

type SocialLink = {
  label: string;
  url: string;
};

/*
 * =====================================================
 * DESIGN
 * =====================================================
 */

const BLACK = "#111111";
const WHITE = "#FFFFFF";
const CREAM = "#FBFAF7";

const GOLD_DARK = "#B8892E";
const GOLD_ACTIVE = "#F0D889";
const GOLD_SOFT = "#F4E8C5";

const BORDER = "#E8E1D7";
const MUTED = "#777169";
const SOFT = "#F5F1EA";

/*
 * =====================================================
 * HELPERS
 * =====================================================
 */

function normalizeRole(
  value: unknown
): Role {
  const role = String(
    value || ""
  ).toLowerCase();

  if (role === "owner") {
    return "owner";
  }

  if (role === "agent") {
    return "agent";
  }

  if (role === "developer") {
    return "developer";
  }

  if (role === "admin") {
    return "admin";
  }

  return "guest";
}

function normalizePhotoUrl(
  value: unknown
) {
  const url = String(
    value || ""
  ).trim();

  if (!url) {
    return "";
  }

  if (
    !/^https?:\/\//i.test(url)
  ) {
    return "";
  }

  return encodeURI(url);
}

function normalizeExternalUrl(
  value: unknown
) {
  const url = String(
    value || ""
  ).trim();

  if (!url) {
    return "";
  }

  if (
    /^https?:\/\//i.test(url)
  ) {
    return url;
  }

  return `https://${url}`;
}

function formatIdr(
  value:
    | number
    | null
    | undefined
) {
  if (
    !value ||
    value <= 0
  ) {
    return "Price on Request";
  }

  return `Rp ${Number(
    value
  ).toLocaleString("id-ID")}`;
}

function formatDate(
  value:
    | string
    | null
    | undefined,
  language: Language
) {
  if (!value) {
    return "-";
  }

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
    language === "id"
      ? "id-ID"
      : "en-GB",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  ).format(date);
}

function isMembershipActive(
  membership:
    | AgentMembershipRow
    | null
) {
  if (!membership) {
    return false;
  }

  if (
    membership.status !==
    "active"
  ) {
    return false;
  }

  if (
    !membership.expires_at
  ) {
    return true;
  }

  const expiresAt =
    new Date(
      membership.expires_at
    );

  if (
    Number.isNaN(
      expiresAt.getTime()
    )
  ) {
    return true;
  }

  return (
    expiresAt.getTime() >=
    Date.now()
  );
}

function getMembershipNumber(
  membership:
    | AgentMembershipRow
    | null,
  key: string
) {
  const direct =
    Number(
      (membership as any)?.[
        key
      ] || 0
    );

  if (
    Number.isFinite(direct) &&
    direct > 0
  ) {
    return direct;
  }

  const metadataValue =
    Number(
      membership?.metadata?.[
        key
      ] || 0
    );

  if (
    Number.isFinite(
      metadataValue
    ) &&
    metadataValue > 0
  ) {
    return metadataValue;
  }

  return 0;
}

function getMembershipListingLimit(
  membership:
    | AgentMembershipRow
    | null
) {
  return (
    getMembershipNumber(
      membership,
      "listing_limit"
    ) ||
    getMembershipNumber(
      membership,
      "listingLimit"
    ) ||
    getMembershipNumber(
      membership,
      "active_listing_limit"
    ) ||
    getMembershipNumber(
      membership,
      "activeListingLimit"
    )
  );
}

function isListingSlotUsed(
  row: PropertyRow
) {
  if (
    row.transaction_status ===
    "sold"
  ) {
    return false;
  }

  if (
    row.transaction_status ===
    "rented"
  ) {
    return false;
  }

  if (
    row.status === "rejected"
  ) {
    return false;
  }

  if (
    !row.listing_expires_at
  ) {
    return true;
  }

  const expiresAt =
    new Date(
      row.listing_expires_at
    );

  if (
    Number.isNaN(
      expiresAt.getTime()
    )
  ) {
    return true;
  }

  return (
    expiresAt.getTime() >=
    Date.now()
  );
}

function getStatusLabel(
  row: PropertyRow,
  language: Language
) {
  const status =
    String(
      row.status || ""
    ).toLowerCase();

  const verification =
    String(
      row.verification_status ||
        ""
    ).toLowerCase();

  const transaction =
    String(
      row.transaction_status ||
        ""
    ).toLowerCase();

  if (
    transaction === "sold"
  ) {
    return language === "id"
      ? "Terjual"
      : "Sold";
  }

  if (
    transaction === "rented"
  ) {
    return language === "id"
      ? "Tersewa"
      : "Rented";
  }

  if (
    status.includes("pending") ||
    verification.includes(
      "pending"
    ) ||
    verification.includes(
      "approval"
    )
  ) {
    return language === "id"
      ? "Menunggu Review"
      : "Pending Review";
  }

  if (
    status === "rejected"
  ) {
    return language === "id"
      ? "Ditolak"
      : "Rejected";
  }

  if (
    status === "active"
  ) {
    return language === "id"
      ? "Aktif"
      : "Active";
  }

  return (
    row.status ||
    (language === "id"
      ? "Aktif"
      : "Active")
  );
}

function getBillingCycleLabel(
  value:
    | string
    | null
    | undefined,
  language: Language
) {
  const cycle =
    String(
      value || ""
    ).toLowerCase();

  if (
    cycle === "monthly"
  ) {
    return language === "id"
      ? "Bulanan"
      : "Monthly";
  }

  if (
    cycle === "yearly"
  ) {
    return language === "id"
      ? "Tahunan"
      : "Yearly";
  }

  return "-";
}

function attachImages(
  properties: PropertyRow[],
  images: PropertyImageRow[]
) {
  return properties.map(
    (property) => {
      const propertyImages =
        images
          .filter(
            (image) =>
              image.property_id ===
              property.id
          )
          .sort((a, b) => {
            const coverA =
              a.is_cover ? 1 : 0;

            const coverB =
              b.is_cover ? 1 : 0;

            if (
              coverA !== coverB
            ) {
              return (
                coverB - coverA
              );
            }

            return (
              Number(
                a.sort_order || 0
              ) -
              Number(
                b.sort_order || 0
              )
            );
          });

      return {
        ...property,

        /*
         * No fake Unsplash fallback.
         */
        photo:
          propertyImages[0]
            ?.image_url || "",
      };
    }
  );
}

/*
 * =====================================================
 * PROFILE SCREEN
 * =====================================================
 */

export default function ProfileScreen() {
  const router =
    useRouter();

  const isIOS =
    Platform.OS === "ios";

  const [
    language,
    setLanguage,
  ] =
    useState<Language>("en");

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    profile,
    setProfile,
  ] =
    useState<ProfileRow | null>(
      null
    );

  const [
    properties,
    setProperties,
  ] =
    useState<
      ListingCardRow[]
    >([]);

  const [
    memberships,
    setMemberships,
  ] =
    useState<
      AgentMembershipRow[]
    >([]);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  const [
    avatarLoadFailed,
    setAvatarLoadFailed,
  ] = useState(false);

  const isId =
    language === "id";

  const role =
    normalizeRole(
      profile?.role
    );

  const avatarUrl =
    normalizePhotoUrl(
      profile?.photo_url
    );

  /*
   * ===================================================
   * AVATAR
   * ===================================================
   */

  useEffect(() => {
    setAvatarLoadFailed(
      false
    );
  }, [avatarUrl]);

  /*
   * ===================================================
   * SOCIALS
   * ===================================================
   */

  const socialLinks =
    useMemo<
      SocialLink[]
    >(() => {
      if (!profile) {
        return [];
      }

      return [
        {
          label:
            "Instagram",

          url:
            normalizeExternalUrl(
              profile.instagram_url
            ),
        },

        {
          label:
            "Facebook",

          url:
            normalizeExternalUrl(
              profile.facebook_url
            ),
        },

        {
          label:
            "TikTok",

          url:
            normalizeExternalUrl(
              profile.tiktok_url
            ),
        },

        {
          label:
            "YouTube",

          url:
            normalizeExternalUrl(
              profile.youtube_url
            ),
        },

        {
          label:
            "LinkedIn",

          url:
            normalizeExternalUrl(
              profile.linkedin_url
            ),
        },
      ].filter(
        (item) =>
          Boolean(item.url)
      );
    }, [profile]);

  /*
   * ===================================================
   * LISTINGS
   * ===================================================
   */

  const ownerListings =
    useMemo(() => {
      return properties.filter(
        (item) =>
          String(
            item.source || ""
          ) !== "agent"
      );
    }, [properties]);

  const agentListings =
    useMemo(() => {
      return properties.filter(
        (item) =>
          String(
            item.source || ""
          ) === "agent"
      );
    }, [properties]);

  /*
   * ===================================================
   * MEMBERSHIP
   * ===================================================
   */

  const activeMembership =
    useMemo(() => {
      return (
        memberships.find(
          (membership) =>
            isMembershipActive(
              membership
            )
        ) || null
      );
    }, [memberships]);

  const latestMembership =
    useMemo(() => {
      return (
        activeMembership ||
        memberships[0] ||
        null
      );
    }, [
      activeMembership,
      memberships,
    ]);

  const agentListingLimit =
    useMemo(() => {
      return getMembershipListingLimit(
        activeMembership
      );
    }, [activeMembership]);

  const usedAgentSlots =
    useMemo(() => {
      return agentListings.filter(
        isListingSlotUsed
      ).length;
    }, [agentListings]);

  const remainingAgentSlots =
    Math.max(
      agentListingLimit -
        usedAgentSlots,
      0
    );

  /*
   * ===================================================
   * OWNER STATS
   * ===================================================
   */

  const ownerStats =
    useMemo(() => {
      const pending =
        ownerListings.filter(
          (item) => {
            const status =
              String(
                item.status || ""
              ).toLowerCase();

            const verification =
              String(
                item.verification_status ||
                  ""
              ).toLowerCase();

            return (
              status.includes(
                "pending"
              ) ||
              verification.includes(
                "pending"
              )
            );
          }
        ).length;

      const active =
        ownerListings.filter(
          (item) => {
            const status =
              String(
                item.status || ""
              ).toLowerCase();

            return (
              status === "active" ||
              !status
            );
          }
        ).length;

      return {
        total:
          ownerListings.length,

        active,

        pending,
      };
    }, [ownerListings]);

  /*
   * ===================================================
   * AGENT STATS
   * ===================================================
   */

  const agentStats =
    useMemo(() => {
      const pending =
        agentListings.filter(
          (item) => {
            const status =
              String(
                item.status || ""
              ).toLowerCase();

            const verification =
              String(
                item.verification_status ||
                  ""
              ).toLowerCase();

            return (
              status.includes(
                "pending"
              ) ||
              verification.includes(
                "pending"
              )
            );
          }
        ).length;

      return {
        total:
          agentListings.length,

        pending,
      };
    }, [agentListings]);

  /*
   * ===================================================
   * LOAD PROFILE
   * ===================================================
   */

  useEffect(() => {
    let ignore = false;

    async function loadProfileDashboard() {
      setLoading(true);
      setErrorMessage("");

      try {
        const {
          data: { user },
          error: userError,
        } =
          await supabase.auth.getUser();

        if (ignore) {
          return;
        }

        if (
          userError ||
          !user
        ) {
          setProfile(null);
          setProperties([]);
          setMemberships([]);
          setLoading(false);

          return;
        }

        const {
          data: profileRow,
          error: profileError,
        } =
          await supabase
            .from("profiles")
            .select(
              "id, full_name, email, phone, role, agency, address, photo_url, instagram_url, facebook_url, tiktok_url, youtube_url, linkedin_url"
            )
            .eq("id", user.id)
            .maybeSingle();

        if (ignore) {
          return;
        }

        if (profileError) {
          throw profileError;
        }

        const safeProfile: ProfileRow =
          {
            id: user.id,

            full_name:
              profileRow?.full_name ||
              String(
                user.user_metadata
                  ?.full_name ||
                  ""
              ) ||
              String(
                user.user_metadata
                  ?.name ||
                  ""
              ),

            email:
              profileRow?.email ||
              user.email ||
              "",

            phone:
              profileRow?.phone ||
              "",

            role:
              profileRow?.role ||
              "",

            agency:
              profileRow?.agency ||
              "",

            address:
              profileRow?.address ||
              "",

            photo_url:
              String(
                profileRow?.photo_url ||
                  ""
              ).trim(),

            instagram_url:
              profileRow?.instagram_url ||
              "",

            facebook_url:
              profileRow?.facebook_url ||
              "",

            tiktok_url:
              profileRow?.tiktok_url ||
              "",

            youtube_url:
              profileRow?.youtube_url ||
              "",

            linkedin_url:
              profileRow?.linkedin_url ||
              "",
          };

        const [
          {
            data: propertyRows,
            error: propertyError,
          },

          {
            data: membershipRows,
            error: membershipError,
          },
        ] =
          await Promise.all([
            supabase
              .from("properties")
              .select(
                "id, user_id, kode, title, title_id, price, province, city, area, source, status, verification_status, transaction_status, listing_expires_at, created_at, posted_date, plan_id"
              )
              .eq(
                "user_id",
                user.id
              )
              .order(
                "created_at",
                {
                  ascending: false,
                }
              ),

            supabase
              .from(
                "agent_memberships"
              )
              .select(
                "id, user_id, payment_id, package_id, package_name, billing_cycle, listing_limit, status, auto_renew, starts_at, expires_at, metadata, created_at, updated_at"
              )
              .eq(
                "user_id",
                user.id
              )
              .order(
                "created_at",
                {
                  ascending: false,
                }
              ),
          ]);

        if (ignore) {
          return;
        }

        if (propertyError) {
          throw propertyError;
        }

        if (membershipError) {
          throw membershipError;
        }

        const propertyList =
          (propertyRows ||
            []) as PropertyRow[];

        const propertyIds =
          propertyList.map(
            (item) => item.id
          );

        let imageRows: PropertyImageRow[] =
          [];

        if (
          propertyIds.length > 0
        ) {
          const {
            data: images,
            error: imageError,
          } =
            await supabase
              .from(
                "property_images"
              )
              .select(
                "id, property_id, image_url, sort_order, is_cover"
              )
              .in(
                "property_id",
                propertyIds
              );

          if (imageError) {
            throw imageError;
          }

          imageRows =
            (images ||
              []) as PropertyImageRow[];
        }

        setProfile(
          safeProfile
        );

        setProperties(
          attachImages(
            propertyList,
            imageRows
          )
        );

        setMemberships(
          (membershipRows ||
            []) as AgentMembershipRow[]
        );

        setLoading(false);
      } catch (
        error: any
      ) {
        if (!ignore) {
          console.log(
            "Tetamo mobile profile dashboard error:",
            error
          );

          setErrorMessage(
            error?.message ||
              (isId
                ? "Gagal memuat profile."
                : "Failed to load profile.")
          );

          setLoading(false);
        }
      }
    }

    void loadProfileDashboard();

    const {
      data: { subscription },
    } =
      supabase.auth.onAuthStateChange(
        () => {
          void loadProfileDashboard();
        }
      );

    return () => {
      ignore = true;

      subscription.unsubscribe();
    };
  }, [isId]);

  /*
   * ===================================================
   * ACTIONS
   * ===================================================
   */

  async function handleLogout() {
    await supabase.auth.signOut();

    setProfile(null);
    setProperties([]);
    setMemberships([]);

    router.replace(
      "/login" as any
    );
  }

  async function openSocial(
    url: string
  ) {
    const finalUrl =
      normalizeExternalUrl(
        url
      );

    if (!finalUrl) {
      return;
    }

    const canOpen =
      await Linking.canOpenURL(
        finalUrl
      );

    if (!canOpen) {
      Alert.alert(
        isId
          ? "Link tidak valid."
          : "Invalid link.",

        finalUrl
      );

      return;
    }

    await Linking.openURL(
      finalUrl
    );
  }

  /*
   * ===================================================
   * LOADING
   * ===================================================
   */

  if (loading) {
    return (
      <SafeAreaView
        style={styles.safeArea}
      >
        <StatusBar style="dark" />

        <View
          style={styles.loadingBox}
        >
          <View
            style={
              styles.loadingIcon
            }
          >
            <UserRound
              color={GOLD_DARK}
              size={24}
            />
          </View>

          <ActivityIndicator
            color={GOLD_DARK}
          />

          <Text
            style={
              styles.loadingText
            }
          >
            {isId
              ? "Memuat profile..."
              : "Loading profile..."}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  /*
   * ===================================================
   * GUEST
   * ===================================================
   */

  if (!profile) {
    return (
      <SafeAreaView
        style={styles.safeArea}
      >
        <StatusBar style="dark" />

        <View
          style={styles.topBar}
        >
          <View>
            <Text
              style={
                styles.topTitle
              }
            >
              Profile
            </Text>

            <Text
              style={
                styles.topSub
              }
            >
              {isId
                ? "Akun Tetamo Anda"
                : "Your Tetamo account"}
            </Text>
          </View>

          <LanguageControl
            language={language}
            onChange={
              setLanguage
            }
          />
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={
            styles.guestContent
          }
          showsVerticalScrollIndicator={
            false
          }
        >
          <View
            style={styles.guestCard}
          >
            <View
              style={
                styles.guestIcon
              }
            >
              <UserRound
                color={GOLD_DARK}
                size={30}
              />
            </View>

            <Text
              style={
                styles.guestTitle
              }
            >
              {isId
                ? "Masuk ke Tetamo"
                : "Log in to Tetamo"}
            </Text>

            <Text
              style={
                styles.guestText
              }
            >
              {isId
                ? "Login untuk melihat akun, properti tersimpan, favorit, dan pengaturan Anda."
                : "Log in to view your account, saved properties, favourites, and settings."}
            </Text>

            <View
              style={
                styles.guestButtons
              }
            >
              <Pressable
                style={
                  styles.primaryButton
                }
                onPress={() =>
                  router.push(
                    "/login" as any
                  )
                }
              >
                <LogIn
                  color={BLACK}
                  size={16}
                />

                <Text
                  style={
                    styles.primaryButtonText
                  }
                >
                  {isId
                    ? "Masuk"
                    : "Log In"}
                </Text>
              </Pressable>

              <Pressable
                style={
                  styles.secondaryButton
                }
                onPress={() =>
                  router.push(
                    "/signup" as any
                  )
                }
              >
                <Text
                  style={
                    styles.secondaryButtonText
                  }
                >
                  {isId
                    ? "Daftar"
                    : "Sign Up"}
                </Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  /*
   * ===================================================
   * DISPLAY
   * ===================================================
   */

  const displayName =
    profile.full_name ||
    (isId
      ? "Pengguna Tetamo"
      : "Tetamo User");

  const displayLocation =
    profile.address || "";

  const displayEmail =
    profile.email || "-";

  const displayPhone =
    profile.phone || "-";

  const displayAgency =
    profile.agency || "";

  const showAvatarImage =
    Boolean(avatarUrl) &&
    !avatarLoadFailed;

  const roleLabel =
    role === "owner"
      ? isId
        ? "PEMILIK PROPERTI"
        : "PROPERTY OWNER"
      : role === "agent"
        ? isId
          ? "AGEN PROPERTI"
          : "PROPERTY AGENT"
        : String(
            role || "USER"
          ).toUpperCase();

  /*
   * ===================================================
   * PROFILE
   * ===================================================
   */

  return (
    <SafeAreaView
      style={styles.safeArea}
    >
      <StatusBar style="dark" />

      {/* =================================
          HEADER
      ================================= */}

      <View
        style={styles.topBar}
      >
        <View>
          <Text
            style={styles.topTitle}
          >
            Profile
          </Text>

          <Text
            style={styles.topSub}
          >
            {isId
              ? "Akun Tetamo Anda"
              : "Your Tetamo account"}
          </Text>
        </View>

        <LanguageControl
          language={language}
          onChange={
            setLanguage
          }
        />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={
          styles.content
        }
        showsVerticalScrollIndicator={
          false
        }
      >
        {/* =================================
            ERROR
        ================================= */}

        {errorMessage ? (
          <View
            style={
              styles.errorBanner
            }
          >
            <Text
              style={
                styles.errorBannerText
              }
            >
              {errorMessage}
            </Text>
          </View>
        ) : null}

        {/* =================================
            PROFILE CARD
        ================================= */}

        <View
          style={styles.profileCard}
        >
          <View
            style={styles.profileTop}
          >
            <View
              style={styles.avatar}
            >
              {showAvatarImage ? (
                <Image
                  key={avatarUrl}
                  source={{
                    uri: avatarUrl,
                  }}
                  style={
                    styles.avatarImage
                  }
                  resizeMode="cover"
                  onError={() => {
                    setAvatarLoadFailed(
                      true
                    );
                  }}
                />
              ) : (
                <UserRound
                  color={GOLD_DARK}
                  size={31}
                />
              )}
            </View>

            <View
              style={
                styles.profileTextBox
              }
            >
              <View
                style={
                  styles.rolePill
                }
              >
                <Text
                  style={
                    styles.rolePillText
                  }
                >
                  {roleLabel}
                </Text>
              </View>

              <Text
                style={
                  styles.nameText
                }
                numberOfLines={1}
              >
                {displayName}
              </Text>

              {role === "agent" &&
              displayAgency ? (
                <Text
                  style={
                    styles.agencyText
                  }
                  numberOfLines={1}
                >
                  {displayAgency}
                </Text>
              ) : null}

              {displayLocation ? (
                <View
                  style={
                    styles.locationRow
                  }
                >
                  <MapPin
                    color={GOLD_DARK}
                    size={12}
                  />

                  <Text
                    style={
                      styles.locationText
                    }
                    numberOfLines={2}
                  >
                    {
                      displayLocation
                    }
                  </Text>
                </View>
              ) : null}
            </View>
          </View>

          <View
            style={
              styles.profileInfoGrid
            }
          >
            <MiniInfo
              icon={
                <Mail
                  color={GOLD_DARK}
                  size={14}
                />
              }
              label="Email"
              value={
                displayEmail
              }
            />

            <MiniInfo
              icon={
                <Phone
                  color={GOLD_DARK}
                  size={14}
                />
              }
              label="WhatsApp"
              value={
                displayPhone
              }
            />
          </View>

          {socialLinks.length >
          0 ? (
            <View
              style={
                styles.socialSection
              }
            >
              <Text
                style={
                  styles.socialTitle
                }
              >
                Social Media
              </Text>

              <View
                style={
                  styles.socialRow
                }
              >
                {socialLinks.map(
                  (item) => (
                    <Pressable
                      key={
                        item.label
                      }
                      style={
                        styles.socialPill
                      }
                      onPress={() =>
                        void openSocial(
                          item.url
                        )
                      }
                    >
                      <Text
                        style={
                          styles.socialPillText
                        }
                      >
                        {item.label}
                      </Text>
                    </Pressable>
                  )
                )}
              </View>
            </View>
          ) : null}
        </View>

        {/* =================================
            ADMIN
        ================================= */}

        {role === "admin" ? (
          <>
            <SectionTitle
              title={
                isId
                  ? "Admin Tetamo"
                  : "Tetamo Admin"
              }
              subtitle={
                isId
                  ? "Kelola fitur admin utama dari aplikasi"
                  : "Manage essential admin tools from the app"
              }
            />

            <View
              style={
                styles.toolGrid
              }
            >
              <ToolCard
                icon={
                  <ShieldCheck
                    color={BLACK}
                    size={18}
                  />
                }
                title="Admin Essentials"
                subtitle={
                  isId
                    ? "Listing, WhatsApp AI, Campaign & Revenue"
                    : "Listings, WhatsApp AI, Campaigns & Revenue"
                }
                featured
                onPress={() =>
                  router.push(
                    "/admin" as any
                  )
                }
              />
            </View>
          </>
        ) : null}

        {/* =================================
            MARKETPLACE
        ================================= */}

        {role !== "admin" ? (
          <>
            <SectionTitle
              title={
                isId
                  ? "Aktivitas Saya"
                  : "My Activity"
              }
              subtitle={
                isId
                  ? "Properti tersimpan dan favorit Anda"
                  : "Your saved and favourite properties"
              }
            />

            <View
              style={
                styles.toolGrid
              }
            >
              <ToolCard
                icon={
                  <Bookmark
                    color={GOLD_DARK}
                    size={18}
                  />
                }
                title={
                  isId
                    ? "Tersimpan"
                    : "Saved"
                }
                subtitle={
                  isId
                    ? "Properti tersimpan"
                    : "Saved properties"
                }
                onPress={() =>
                  router.push(
                    "/dashboard/saved" as any
                  )
                }
              />

              <ToolCard
                icon={
                  <Heart
                    color={GOLD_DARK}
                    size={18}
                  />
                }
                title={
                  isId
                    ? "Favorit"
                    : "Favourites"
                }
                subtitle={
                  isId
                    ? "Properti favorit"
                    : "Favourite properties"
                }
                onPress={() =>
                  router.push(
                    "/dashboard/liked" as any
                  )
                }
              />
            </View>
          </>
        ) : null}

        {/* =================================
            ACCOUNT
        ================================= */}

        <SectionTitle
          title={
            isId
              ? "Akun"
              : "Account"
          }
          subtitle={
            isId
              ? "Pengaturan profile dan akun"
              : "Profile and account settings"
          }
        />

        <View
          style={
            styles.accountCard
          }
        >
          <ToolRow
            icon={
              <Settings
                color={GOLD_DARK}
                size={17}
              />
            }
            title={
              isId
                ? "Pengaturan"
                : "Settings"
            }
            subtitle={
              isId
                ? "Update profile"
                : "Update profile"
            }
            onPress={() =>
              router.push(
                "/dashboard/settings" as any
              )
            }
          />

          <View
            style={
              styles.accountDivider
            }
          />

          <ToolRow
            icon={
              <LogOut
                color="#B64343"
                size={17}
              />
            }
            title={
              isId
                ? "Keluar"
                : "Log Out"
            }
            subtitle={
              isId
                ? "Keluar dari akun Tetamo"
                : "Sign out of Tetamo"
            }
            danger
            onPress={
              handleLogout
            }
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

/*
 * =====================================================
 * LANGUAGE
 * =====================================================
 */

function LanguageControl({
  language,
  onChange,
}: {
  language: Language;
  onChange: (
    value: Language
  ) => void;
}) {
  return (
    <View
      style={
        styles.languageControl
      }
    >
      <Languages
        color={GOLD_DARK}
        size={14}
      />

      {(
        ["en", "id"] as Language[]
      ).map((item) => {
        const active =
          language === item;

        return (
          <Pressable
            key={item}
            style={[
              styles.languageButton,

              active &&
                styles.languageButtonActive,
            ]}
            onPress={() =>
              onChange(item)
            }
          >
            <Text
              style={[
                styles.languageText,

                active &&
                  styles.languageTextActive,
              ]}
            >
              {item.toUpperCase()}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/*
 * =====================================================
 * SECTION TITLE
 * =====================================================
 */

function SectionTitle({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <View
      style={
        styles.sectionHeader
      }
    >
      <Text
        style={
          styles.sectionTitle
        }
      >
        {title}
      </Text>

      {subtitle ? (
        <Text
          style={
            styles.sectionSubtitle
          }
        >
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}

/*
 * =====================================================
 * PROFILE INFO
 * =====================================================
 */

function MiniInfo({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <View
      style={styles.miniInfo}
    >
      <View
        style={
          styles.miniInfoHeader
        }
      >
        {icon}

        <Text
          style={
            styles.miniInfoLabel
          }
        >
          {label}
        </Text>
      </View>

      <Text
        style={
          styles.miniInfoValue
        }
        numberOfLines={2}
      >
        {value}
      </Text>
    </View>
  );
}

/*
 * =====================================================
 * MEMBERSHIP STAT
 * =====================================================
 */

function MiniStat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <View
      style={styles.miniStat}
    >
      <Text
        style={
          styles.miniStatLabel
        }
      >
        {label}
      </Text>

      <Text
        style={
          styles.miniStatValue
        }
        numberOfLines={1}
      >
        {value}
      </Text>
    </View>
  );
}

/*
 * =====================================================
 * STAT CARD
 * =====================================================
 */

function StatCard({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
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
        style={styles.statValue}
      >
        {value}
      </Text>

      <Text
        style={styles.statLabel}
        numberOfLines={2}
      >
        {label}
      </Text>
    </View>
  );
}

/*
 * =====================================================
 * TOOL CARD
 * =====================================================
 */

function ToolCard({
  icon,
  title,
  subtitle,
  featured,
  onPress,
}: {
  icon: ReactNode;
  title: string;
  subtitle: string;
  featured?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={[
        styles.toolCard,

        featured &&
          styles.toolCardFeatured,
      ]}
      onPress={onPress}
    >
      <View
        style={[
          styles.toolIcon,

          featured &&
            styles.toolIconFeatured,
        ]}
      >
        {icon}
      </View>

      <View
        style={
          styles.toolCardArrow
        }
      >
        <ChevronRight
          color="#9A938A"
          size={14}
        />
      </View>

      <Text
        style={styles.toolTitle}
        numberOfLines={1}
      >
        {title}
      </Text>

      <Text
        style={
          styles.toolSubtitle
        }
        numberOfLines={2}
      >
        {subtitle}
      </Text>
    </Pressable>
  );
}

/*
 * =====================================================
 * ACCOUNT ROW
 * =====================================================
 */

function ToolRow({
  icon,
  title,
  subtitle,
  danger,
  onPress,
}: {
  icon: ReactNode;
  title: string;
  subtitle: string;
  danger?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={styles.toolRow}
      onPress={onPress}
    >
      <View
        style={[
          styles.toolRowIcon,

          danger &&
            styles.toolRowIconDanger,
        ]}
      >
        {icon}
      </View>

      <View
        style={
          styles.toolRowTextBox
        }
      >
        <Text
          style={[
            styles.toolRowTitle,

            danger &&
              styles.toolRowTitleDanger,
          ]}
        >
          {title}
        </Text>

        <Text
          style={
            styles.toolRowSubtitle
          }
        >
          {subtitle}
        </Text>
      </View>

      <ChevronRight
        color={
          danger
            ? "#B64343"
            : "#958E85"
        }
        size={16}
      />
    </Pressable>
  );
}

/*
 * =====================================================
 * LISTING PREVIEW
 * =====================================================
 */

function ListingPreview({
  title,
  emptyText,
  listings,
  language,
  onEdit,
}: {
  title: string;
  emptyText: string;
  listings: ListingCardRow[];
  language: Language;
  onEdit: (
    item: ListingCardRow
  ) => void;
}) {
  return (
    <View
      style={
        styles.listingSection
      }
    >
      <SectionTitle
        title={title}
      />

      {listings.length === 0 ? (
        <View
          style={styles.emptyBox}
        >
          <View
            style={
              styles.emptyIcon
            }
          >
            <FileText
              color={GOLD_DARK}
              size={21}
            />
          </View>

          <Text
            style={
              styles.emptyText
            }
          >
            {emptyText}
          </Text>
        </View>
      ) : (
        <View
          style={
            styles.listingList
          }
        >
          {listings.map(
            (item) => (
              <View
                key={item.id}
                style={
                  styles.listingCard
                }
              >
                {item.photo ? (
                  <Image
                    source={{
                      uri: item.photo,
                    }}
                    style={
                      styles.listingImage
                    }
                    resizeMode="cover"
                  />
                ) : (
                  <View
                    style={
                      styles.listingPlaceholder
                    }
                  >
                    <Building2
                      color="#B5ADA2"
                      size={25}
                    />
                  </View>
                )}

                <View
                  style={
                    styles.listingTextBox
                  }
                >
                  <Text
                    style={
                      styles.listingTitle
                    }
                    numberOfLines={2}
                  >
                    {language ===
                    "id"
                      ? item.title_id ||
                        item.title ||
                        "-"
                      : item.title ||
                        item.title_id ||
                        "-"}
                  </Text>

                  <Text
                    style={
                      styles.listingMeta
                    }
                    numberOfLines={1}
                  >
                    {item.city ||
                      item.area ||
                      item.province ||
                      "-"}{" "}
                    •{" "}
                    {item.kode ||
                      "-"}
                  </Text>

                  <Text
                    style={
                      styles.listingPrice
                    }
                    numberOfLines={1}
                  >
                    {formatIdr(
                      item.price
                    )}
                  </Text>

                  <View
                    style={
                      styles.listingBottomRow
                    }
                  >
                    <View
                      style={
                        styles.statusPill
                      }
                    >
                      <Text
                        style={
                          styles.statusPillText
                        }
                        numberOfLines={1}
                      >
                        {getStatusLabel(
                          item,
                          language
                        )}
                      </Text>
                    </View>

                    <Pressable
                      style={
                        styles.editButton
                      }
                      onPress={() =>
                        onEdit(item)
                      }
                    >
                      <Pencil
                        color={BLACK}
                        size={12}
                      />

                      <Text
                        style={
                          styles.editButtonText
                        }
                      >
                        Edit
                      </Text>
                    </Pressable>
                  </View>
                </View>
              </View>
            )
          )}
        </View>
      )}
    </View>
  );
}

/*
 * =====================================================
 * STYLES
 * =====================================================
 */

const styles =
  StyleSheet.create({
    safeArea: {
      flex: 1,

      backgroundColor:
        CREAM,
    },

    scroll: {
      flex: 1,

      backgroundColor:
        CREAM,
    },

    /*
     * HEADER
     */

    topBar: {
      minHeight: 60,

      paddingHorizontal: 16,
      paddingVertical: 8,

      flexDirection: "row",
      alignItems: "center",
      justifyContent:
        "space-between",

      gap: 10,

      backgroundColor:
        CREAM,

      borderBottomWidth: 1,
      borderBottomColor:
        BORDER,
    },

    topTitle: {
      color: BLACK,

      fontSize: 18,
      fontWeight: "900",

      letterSpacing: -0.2,
    },

    topSub: {
      marginTop: 2,

      color: MUTED,

      fontSize: 9.5,
      fontWeight: "600",
    },

    languageControl: {
      minHeight: 37,

      paddingHorizontal: 4,

      borderRadius: 13,

      flexDirection: "row",
      alignItems: "center",

      gap: 2,

      backgroundColor:
        WHITE,

      borderWidth: 1,
      borderColor:
        BORDER,
    },

    languageButton: {
      width: 31,
      height: 28,

      borderRadius: 9,

      alignItems: "center",
      justifyContent: "center",
    },

    languageButtonActive: {
      backgroundColor:
        GOLD_ACTIVE,
    },

    languageText: {
      color: "#918A81",

      fontSize: 8.5,
      fontWeight: "800",
    },

    languageTextActive: {
      color: BLACK,

      fontWeight: "900",
    },

    /*
     * CONTENT
     */

    content: {
      paddingHorizontal: 16,
      paddingTop: 14,

      paddingBottom: 125,
    },

    /*
     * LOADING
     */

    loadingBox: {
      flex: 1,

      alignItems: "center",
      justifyContent: "center",

      gap: 9,

      padding: 24,
    },

    loadingIcon: {
      width: 52,
      height: 52,

      marginBottom: 3,

      borderRadius: 17,

      alignItems: "center",
      justifyContent: "center",

      backgroundColor:
        GOLD_SOFT,
    },

    loadingText: {
      color: MUTED,

      fontSize: 10,
      fontWeight: "700",
    },

    /*
     * ERROR
     */

    errorBanner: {
      marginBottom: 11,

      padding: 11,

      borderRadius: 14,

      backgroundColor:
        "#FFF2F2",

      borderWidth: 1,
      borderColor:
        "#EFCBCB",
    },

    errorBannerText: {
      color: "#973737",

      fontSize: 9.5,
      lineHeight: 14,

      fontWeight: "600",
    },

    /*
     * PROFILE
     */

    profileCard: {
      padding: 15,

      borderRadius: 23,

      backgroundColor:
        WHITE,

      borderWidth: 1,
      borderColor:
        BORDER,

      marginBottom: 18,
    },

    profileTop: {
      flexDirection: "row",
      alignItems: "center",

      gap: 12,
    },

    avatar: {
      width: 72,
      height: 72,

      borderRadius: 22,

      overflow: "hidden",

      alignItems: "center",
      justifyContent: "center",

      backgroundColor:
        GOLD_SOFT,

      borderWidth: 1,
      borderColor:
        "#DFCFA6",
    },

    avatarImage: {
      width: "100%",
      height: "100%",
    },

    profileTextBox: {
      flex: 1,
      minWidth: 0,
    },

    rolePill: {
      alignSelf:
        "flex-start",

      minHeight: 24,

      paddingHorizontal: 8,

      borderRadius: 999,

      alignItems: "center",
      justifyContent: "center",

      backgroundColor:
        GOLD_SOFT,
    },

    rolePillText: {
      color: "#705A27",

      fontSize: 7,
      fontWeight: "900",

      letterSpacing: 0.55,
    },

    nameText: {
      marginTop: 7,

      color: BLACK,

      fontSize: 18,
      fontWeight: "900",

      letterSpacing: -0.25,
    },

    agencyText: {
      marginTop: 2,

      color: "#4F4A44",

      fontSize: 9.5,
      fontWeight: "700",
    },

    locationRow: {
      marginTop: 5,

      flexDirection: "row",
      alignItems: "flex-start",

      gap: 4,
    },

    locationText: {
      flex: 1,

      color: MUTED,

      fontSize: 8.8,
      lineHeight: 12,

      fontWeight: "600",
    },

    /*
     * CONTACT INFO
     */

    profileInfoGrid: {
      marginTop: 14,

      flexDirection: "row",

      gap: 7,
    },

    miniInfo: {
      flex: 1,

      minHeight: 68,

      padding: 10,

      borderRadius: 15,

      backgroundColor:
        CREAM,

      borderWidth: 1,
      borderColor:
        BORDER,
    },

    miniInfoHeader: {
      flexDirection: "row",
      alignItems: "center",

      gap: 5,
    },

    miniInfoLabel: {
      color: "#8C857B",

      fontSize: 7.5,
      fontWeight: "800",
    },

    miniInfoValue: {
      marginTop: 7,

      color: BLACK,

      fontSize: 8.8,
      lineHeight: 12,

      fontWeight: "800",
    },

    /*
     * SOCIAL
     */

    socialSection: {
      marginTop: 13,
      paddingTop: 12,

      borderTopWidth: 1,
      borderTopColor:
        "#EEE7DD",
    },

    socialTitle: {
      color: BLACK,

      fontSize: 9.5,
      fontWeight: "900",

      marginBottom: 7,
    },

    socialRow: {
      flexDirection: "row",
      flexWrap: "wrap",

      gap: 6,
    },

    socialPill: {
      minHeight: 29,

      paddingHorizontal: 9,

      borderRadius: 999,

      alignItems: "center",
      justifyContent: "center",

      backgroundColor:
        GOLD_SOFT,
    },

    socialPillText: {
      color: "#705A27",

      fontSize: 7.8,
      fontWeight: "900",
    },

    /*
     * SECTION
     */

    sectionHeader: {
      marginTop: 3,
      marginBottom: 9,
    },

    sectionTitle: {
      color: BLACK,

      fontSize: 15,
      fontWeight: "900",

      letterSpacing: -0.2,
    },

    sectionSubtitle: {
      marginTop: 2,

      color: MUTED,

      fontSize: 8.5,
      fontWeight: "500",
    },

    /*
     * STATS
     */

    statsGrid: {
      flexDirection: "row",

      gap: 7,

      marginBottom: 17,
    },

    statCard: {
      flex: 1,

      minHeight: 95,

      padding: 10,

      borderRadius: 17,

      backgroundColor:
        WHITE,

      borderWidth: 1,
      borderColor:
        BORDER,
    },

    statIcon: {
      width: 31,
      height: 31,

      borderRadius: 10,

      alignItems: "center",
      justifyContent: "center",

      backgroundColor:
        SOFT,
    },

    statValue: {
      marginTop: 8,

      color: BLACK,

      fontSize: 18,
      fontWeight: "900",
    },

    statLabel: {
      marginTop: 1,

      color: MUTED,

      fontSize: 7.5,
      lineHeight: 10,

      fontWeight: "700",
    },

    /*
     * TOOLS
     */

    toolGrid: {
      flexDirection: "row",
      flexWrap: "wrap",

      gap: 8,

      marginBottom: 18,
    },

    toolCard: {
      width: "48.7%",

      minHeight: 106,

      padding: 11,

      borderRadius: 18,

      position: "relative",

      backgroundColor:
        WHITE,

      borderWidth: 1,
      borderColor:
        BORDER,
    },

    toolCardFeatured: {
      backgroundColor:
        "#F7EBC6",

      borderColor:
        "#E3CC88",
    },

    toolIcon: {
      width: 35,
      height: 35,

      borderRadius: 11,

      alignItems: "center",
      justifyContent: "center",

      backgroundColor:
        GOLD_SOFT,
    },

    toolIconFeatured: {
      backgroundColor:
        GOLD_ACTIVE,
    },

    toolCardArrow: {
      position: "absolute",

      top: 13,
      right: 10,
    },

    toolTitle: {
      marginTop: 9,

      color: BLACK,

      fontSize: 10.5,
      fontWeight: "900",
    },

    toolSubtitle: {
      marginTop: 3,

      color: MUTED,

      fontSize: 8,
      lineHeight: 11,

      fontWeight: "500",
    },

    /*
     * MEMBERSHIP
     */

    membershipCard: {
      padding: 14,

      marginBottom: 11,

      borderRadius: 20,

      backgroundColor:
        "#F7F0DE",

      borderWidth: 1,
      borderColor:
        "#DFCFA6",
    },

    membershipTop: {
      flexDirection: "row",
      alignItems: "center",

      gap: 9,
    },

    membershipIcon: {
      width: 42,
      height: 42,

      borderRadius: 13,

      alignItems: "center",
      justifyContent: "center",

      backgroundColor:
        GOLD_SOFT,
    },

    membershipTextBox: {
      flex: 1,
    },

    membershipTitle: {
      color: BLACK,

      fontSize: 12,
      fontWeight: "900",
    },

    membershipSub: {
      marginTop: 2,

      color: MUTED,

      fontSize: 8.8,
      fontWeight: "600",
    },

    membershipStats: {
      marginTop: 11,

      flexDirection: "row",
      flexWrap: "wrap",

      gap: 7,
    },

    miniStat: {
      width: "48.7%",

      minHeight: 55,

      padding: 9,

      borderRadius: 13,

      backgroundColor:
        WHITE,

      borderWidth: 1,
      borderColor:
        "#E4D8BA",
    },

    miniStatLabel: {
      color: "#8C8374",

      fontSize: 7.5,
      fontWeight: "700",
    },

    miniStatValue: {
      marginTop: 4,

      color: BLACK,

      fontSize: 9.5,
      fontWeight: "900",
    },

    membershipButton: {
      minHeight: 42,

      marginTop: 10,

      paddingHorizontal: 10,

      borderRadius: 13,

      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",

      gap: 5,

      backgroundColor:
        GOLD_ACTIVE,
    },

    membershipButtonText: {
      color: BLACK,

      fontSize: 9,
      fontWeight: "900",
    },

    /*
     * LISTINGS
     */

    listingSection: {
      marginBottom: 18,
    },

    listingList: {
      gap: 8,
    },

    listingCard: {
      minHeight: 104,

      padding: 9,

      borderRadius: 18,

      flexDirection: "row",

      gap: 10,

      backgroundColor:
        WHITE,

      borderWidth: 1,
      borderColor:
        BORDER,
    },

    listingImage: {
      width: 105,
      minHeight: 86,

      borderRadius: 14,

      backgroundColor:
        SOFT,
    },

    listingPlaceholder: {
      width: 105,
      minHeight: 86,

      borderRadius: 14,

      alignItems: "center",
      justifyContent: "center",

      backgroundColor:
        "#EEEAE3",
    },

    listingTextBox: {
      flex: 1,
      minWidth: 0,
    },

    listingTitle: {
      color: BLACK,

      fontSize: 10.5,
      lineHeight: 14,

      fontWeight: "900",
    },

    listingMeta: {
      marginTop: 3,

      color: MUTED,

      fontSize: 7.7,
      fontWeight: "600",
    },

    listingPrice: {
      marginTop: 5,

      color: GOLD_DARK,

      fontSize: 9.5,
      fontWeight: "900",
    },

    listingBottomRow: {
      marginTop: 7,

      flexDirection: "row",
      alignItems: "center",

      gap: 5,
    },

    statusPill: {
      flex: 1,

      minHeight: 27,

      paddingHorizontal: 6,

      borderRadius: 999,

      alignItems: "center",
      justifyContent: "center",

      backgroundColor:
        SOFT,
    },

    statusPillText: {
      color: "#625D56",

      fontSize: 7.5,
      fontWeight: "800",
    },

    editButton: {
      minHeight: 29,

      paddingHorizontal: 9,

      borderRadius: 999,

      flexDirection: "row",
      alignItems: "center",

      gap: 4,

      backgroundColor:
        GOLD_ACTIVE,
    },

    editButtonText: {
      color: BLACK,

      fontSize: 7.8,
      fontWeight: "900",
    },

    /*
     * EMPTY LISTING
     */

    emptyBox: {
      minHeight: 120,

      padding: 17,

      borderRadius: 18,

      alignItems: "center",
      justifyContent: "center",

      backgroundColor:
        WHITE,

      borderWidth: 1,
      borderColor:
        BORDER,
    },

    emptyIcon: {
      width: 43,
      height: 43,

      borderRadius: 14,

      alignItems: "center",
      justifyContent: "center",

      backgroundColor:
        GOLD_SOFT,
    },

    emptyText: {
      maxWidth: 250,

      marginTop: 8,

      color: MUTED,

      fontSize: 9,
      lineHeight: 13,

      fontWeight: "500",

      textAlign: "center",
    },

    /*
     * ACCOUNT
     */

    accountCard: {
      paddingHorizontal: 12,

      borderRadius: 19,

      backgroundColor:
        WHITE,

      borderWidth: 1,
      borderColor:
        BORDER,
    },

    toolRow: {
      minHeight: 65,

      paddingVertical: 9,

      flexDirection: "row",
      alignItems: "center",

      gap: 10,
    },

    toolRowIcon: {
      width: 38,
      height: 38,

      borderRadius: 12,

      alignItems: "center",
      justifyContent: "center",

      backgroundColor:
        GOLD_SOFT,
    },

    toolRowIconDanger: {
      backgroundColor:
        "#FBE9E9",
    },

    toolRowTextBox: {
      flex: 1,
    },

    toolRowTitle: {
      color: BLACK,

      fontSize: 10.5,
      fontWeight: "900",
    },

    toolRowTitleDanger: {
      color: "#A33B3B",
    },

    toolRowSubtitle: {
      marginTop: 2,

      color: MUTED,

      fontSize: 8,
      fontWeight: "500",
    },

    accountDivider: {
      height: 1,

      backgroundColor:
        "#EEE7DD",
    },

    /*
     * UNSUPPORTED ROLE
     */

    unsupportedCard: {
      marginBottom: 17,

      padding: 17,

      borderRadius: 20,

      alignItems: "center",

      backgroundColor:
        WHITE,

      borderWidth: 1,
      borderColor:
        BORDER,
    },

    unsupportedTitle: {
      marginTop: 8,

      color: BLACK,

      fontSize: 13,
      fontWeight: "900",
    },

    unsupportedText: {
      maxWidth: 260,

      marginTop: 4,

      color: MUTED,

      fontSize: 9,
      lineHeight: 14,

      fontWeight: "500",

      textAlign: "center",
    },

    /*
     * GUEST
     */

    guestContent: {
      flexGrow: 1,

      paddingHorizontal: 18,
      paddingTop: 30,
      paddingBottom: 125,

      justifyContent: "center",
    },

    guestCard: {
      padding: 22,

      borderRadius: 24,

      alignItems: "center",

      backgroundColor:
        WHITE,

      borderWidth: 1,
      borderColor:
        BORDER,
    },

    guestIcon: {
      width: 64,
      height: 64,

      borderRadius: 20,

      alignItems: "center",
      justifyContent: "center",

      backgroundColor:
        GOLD_SOFT,
    },

    guestTitle: {
      marginTop: 15,

      color: BLACK,

      fontSize: 20,
      fontWeight: "900",

      textAlign: "center",
    },

    guestText: {
      maxWidth: 285,

      marginTop: 6,

      color: MUTED,

      fontSize: 10,
      lineHeight: 16,

      fontWeight: "500",

      textAlign: "center",
    },

    guestButtons: {
      width: "100%",

      marginTop: 18,

      gap: 8,
    },

    primaryButton: {
      minHeight: 48,

      paddingHorizontal: 14,

      borderRadius: 14,

      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",

      gap: 6,

      backgroundColor:
        GOLD_ACTIVE,
    },

    primaryButtonText: {
      color: BLACK,

      fontSize: 10.5,
      fontWeight: "900",
    },

    secondaryButton: {
      minHeight: 48,

      borderRadius: 14,

      alignItems: "center",
      justifyContent: "center",

      backgroundColor:
        WHITE,

      borderWidth: 1,
      borderColor:
        BORDER,
    },

    secondaryButtonText: {
      color: BLACK,

      fontSize: 10.5,
      fontWeight: "900",
    },
  });
