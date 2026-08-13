import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
  Building2,
  LogOut,
  Megaphone,
  MessageCircle,
  ShieldCheck,
} from "lucide-react-native";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { supabase } from "../../lib/supabase";

type AdminProfile = {
  full_name: string | null;
  role: string | null;
};

export default function AdminHomeScreen() {
  const router = useRouter();

  const [loading, setLoading] =
    useState(true);

  const [name, setName] =
    useState("Admin");

  useEffect(() => {
    let mounted = true;

    async function checkAdmin() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace(
          "/login" as any
        );
        return;
      }

      const {
        data,
        error,
      } = await supabase
        .from("profiles")
        .select(
          "full_name, role"
        )
        .eq("id", user.id)
        .maybeSingle();

      if (!mounted) return;

      if (error) {
        await supabase.auth.signOut();

        router.replace(
          "/login" as any
        );

        return;
      }

      const profile =
        (data ||
          null) as AdminProfile | null;

      const role =
        String(
          profile?.role || ""
        ).toLowerCase();

      if (role !== "admin") {
        router.replace(
          "/(tabs)/profile" as any
        );

        return;
      }

      if (profile?.full_name) {
        setName(
          profile.full_name
        );
      }

      setLoading(false);
    }

    void checkAdmin();

    return () => {
      mounted = false;
    };
  }, [router]);

  async function handleLogout() {
    await supabase.auth.signOut();

    router.replace(
      "/login" as any
    );
  }

  if (loading) {
    return (
      <SafeAreaView
        style={styles.safeArea}
      >
        <StatusBar style="dark" />

        <View
          style={styles.loadingWrap}
        >
          <ActivityIndicator
            color="#B8892E"
          />

          <Text
            style={styles.loadingText}
          >
            Opening Admin...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

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
      >
        <View
          style={styles.topRow}
        >
          <View
            style={styles.adminBadge}
          >
            <ShieldCheck
              color="#8F6B1E"
              size={14}
            />

            <Text
              style={styles.adminBadgeText}
            >
              TETAMO ADMIN
            </Text>
          </View>

          <Pressable
            style={styles.logoutButton}
            onPress={() =>
              void handleLogout()
            }
          >
            <LogOut
              color="#171717"
              size={15}
            />

            <Text
              style={styles.logoutText}
            >
              Log out
            </Text>
          </Pressable>
        </View>

        <Text
          style={styles.title}
        >
          Admin Essentials
        </Text>

        <Text
          style={styles.subtitle}
        >
          Hi {name}. Manage the parts of
          Tetamo you need while you're
          away from your laptop.
        </Text>

        <View
          style={styles.cards}
        >
          <AdminCard
            icon={
              <Building2
                color="#171717"
                size={23}
              />
            }
            title="Listings"
            description="Review and manage Tetamo property listings."
            onPress={() =>
              router.push(
                "/admin/listings" as any
              )
            }
          />

          <AdminCard
            icon={
              <MessageCircle
                color="#171717"
                size={23}
              />
            }
            title="WhatsApp AI"
            description="View Mona conversations and reply from your phone."
            onPress={() =>
              router.push(
                "/admin/whatsapp" as any
              )
            }
          />

          <AdminCard
            icon={
              <Megaphone
                color="#171717"
                size={23}
              />
            }
            title="WhatsApp Campaign"
            description="Prepare and send approved WhatsApp campaigns."
          />
        </View>

        <Text
          style={styles.note}
        >
          We'll connect these three
          admin tools next.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function AdminCard({
  icon,
  title,
  description,
  onPress,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  onPress?: () => void;
}) {
  const Container =
    onPress
      ? Pressable
      : View;

  return (
    <Container
      style={styles.card}
      {...(
        onPress
          ? { onPress }
          : {}
      )}
    >
      <View
        style={styles.cardIcon}
      >
        {icon}
      </View>

      <View
        style={styles.cardCopy}
      >
        <Text
          style={styles.cardTitle}
        >
          {title}
        </Text>

        <Text
          style={
            styles.cardDescription
          }
        >
          {description}
        </Text>
      </View>

      <View
        style={styles.soonBadge}
      >
        <Text
          style={styles.soonText}
        >
          NEXT
        </Text>
      </View>
    </Container>
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
      paddingHorizontal: 20,
      paddingTop: 18,
      paddingBottom: 48,
    },

    loadingWrap: {
      flex: 1,
      alignItems: "center",
      justifyContent:
        "center",
      gap: 10,
    },

    loadingText: {
      color: "#777169",
      fontSize: 12,
      fontWeight: "700",
    },

    topRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent:
        "space-between",
      gap: 10,
    },

    adminBadge: {
      minHeight: 36,
      paddingHorizontal: 11,
      borderRadius: 999,
      backgroundColor:
        "#F4E8C5",
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },

    adminBadgeText: {
      color: "#705A27",
      fontSize: 9,
      fontWeight: "900",
      letterSpacing: 0.8,
    },

    logoutButton: {
      minHeight: 38,
      borderRadius: 13,
      borderWidth: 1,
      borderColor: "#E2DBD1",
      backgroundColor:
        "#FFFFFF",
      paddingHorizontal: 11,
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },

    logoutText: {
      color: "#171717",
      fontSize: 10,
      fontWeight: "900",
    },

    title: {
      marginTop: 30,
      color: "#171717",
      fontSize: 30,
      lineHeight: 35,
      fontWeight: "900",
      letterSpacing: -0.7,
    },

    subtitle: {
      marginTop: 8,
      color: "#777169",
      fontSize: 12.5,
      lineHeight: 19,
      fontWeight: "600",
      maxWidth: 330,
    },

    cards: {
      marginTop: 25,
      gap: 12,
    },

    card: {
      minHeight: 112,
      borderRadius: 22,
      borderWidth: 1,
      borderColor: "#E6DFD5",
      backgroundColor:
        "#FFFFFF",
      padding: 15,
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },

    cardIcon: {
      width: 48,
      height: 48,
      borderRadius: 17,
      backgroundColor:
        "#F0D889",
      alignItems: "center",
      justifyContent:
        "center",
    },

    cardCopy: {
      flex: 1,
    },

    cardTitle: {
      color: "#171717",
      fontSize: 14,
      fontWeight: "900",
    },

    cardDescription: {
      marginTop: 4,
      color: "#777169",
      fontSize: 10.8,
      lineHeight: 15,
      fontWeight: "600",
    },

    soonBadge: {
      borderRadius: 999,
      backgroundColor:
        "#F6F1E8",
      paddingHorizontal: 8,
      paddingVertical: 5,
    },

    soonText: {
      color: "#9A7624",
      fontSize: 7.5,
      fontWeight: "900",
      letterSpacing: 0.5,
    },

    note: {
      marginTop: 20,
      color: "#9A948B",
      fontSize: 10.5,
      lineHeight: 16,
      fontWeight: "600",
      textAlign: "center",
    },
  });
