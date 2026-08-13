import { usePathname, useRouter } from "expo-router";
import {
  Building2,
  Home,
  Search,
  UserRound,
  UserSearch,
} from "lucide-react-native";
import type { ReactNode } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type FooterItem = {
  label: string;
  route: string;
  matchRoutes: string[];
  icon: (
    color: string,
    size: number
  ) => ReactNode;
};

const FOOTER_ITEMS: FooterItem[] = [
  {
    label: "Home",
    route: "/",
    matchRoutes: ["/"],
    icon: (color, size) => (
      <Home
        color={color}
        size={size}
        strokeWidth={2}
      />
    ),
  },
  {
    label: "Property",
    route: "/property",
    matchRoutes: [
      "/property",
      "/properti",
    ],
    icon: (color, size) => (
      <Building2
        color={color}
        size={size}
        strokeWidth={2}
      />
    ),
  },
  {
    label: "Search",
    route: "/search",
    matchRoutes: ["/search"],
    icon: (color, size) => (
      <Search
        color={color}
        size={size}
        strokeWidth={2.1}
      />
    ),
  },
  {
    label: "Buyer",
    route: "/buyer",
    matchRoutes: ["/buyer"],
    icon: (color, size) => (
      <UserSearch
        color={color}
        size={size}
        strokeWidth={2}
      />
    ),
  },
  {
    label: "Profile",
    route: "/profile",
    matchRoutes: ["/profile", "/admin"],
    icon: (color, size) => (
      <UserRound
        color={color}
        size={size}
        strokeWidth={2}
      />
    ),
  },
];

function isActiveRoute(
  pathname: string,
  item: FooterItem
) {
  if (item.route === "/") {
    return pathname === "/";
  }

  return item.matchRoutes.some(
    (route) =>
      pathname === route ||
      pathname.startsWith(
        `${route}/`
      )
  );
}

/*
 * Footer belongs only to the public/main
 * marketplace navigation.
 *
 * Dashboard, settings, legal, auth,
 * support and listing workflows deliberately
 * render without the global bottom bar.
 */
function shouldShowFooter(
  pathname: string
) {
  if (pathname === "/") return true;

  if (pathname === "/property") {
    return true;
  }

  if (
    pathname === "/properti" ||
    pathname.startsWith("/properti/")
  ) {
    return true;
  }

  if (pathname === "/search") {
    return true;
  }

  if (pathname === "/buyer") {
    return true;
  }

  if (pathname === "/profile") {
    return true;
  }

  if (pathname === "/admin") {
    return true;
  }

  return false;
}

export default function TetamoFooter() {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();

  if (!shouldShowFooter(pathname)) {
    return null;
  }

  return (
    <View
      style={[
        styles.footerWrap,
        {
          paddingBottom:
            Math.max(
              insets.bottom,
              8
            ),
        },
      ]}
    >
      <View style={styles.footer}>
        {FOOTER_ITEMS.map(
          (item) => {
            const active =
              isActiveRoute(
                pathname,
                item
              );

            const iconColor =
              active
                ? "#111111"
                : "#8D8A83";

            return (
              <Pressable
                key={item.route}
                onPress={() =>
                  router.push(
                    item.route as any
                  )
                }
                style={({
                  pressed,
                }) => [
                  styles.footerItem,
                  pressed &&
                    styles.footerItemPressed,
                ]}
                accessibilityRole="tab"
                accessibilityLabel={
                  item.label
                }
                accessibilityState={{
                  selected: active,
                }}
              >
                <View
                  style={[
                    styles.iconBox,
                    active &&
                      styles.activeIconBox,
                  ]}
                >
                  {item.icon(
                    iconColor,
                    22
                  )}
                </View>

                <Text
                  style={[
                    styles.footerLabel,
                    active &&
                      styles.activeLabel,
                  ]}
                >
                  {item.label}
                </Text>

                <View
                  style={[
                    styles.activeIndicator,
                    active &&
                      styles.activeIndicatorVisible,
                  ]}
                />
              </Pressable>
            );
          }
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  footerWrap: {
    backgroundColor: "#FBFAF7",
    borderTopWidth: 1,
    borderTopColor: "#ECE6DC",

    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.04,
    shadowRadius: 12,

    elevation: 8,
  },

  footer: {
    minHeight: 66,
    paddingTop: 7,
    paddingHorizontal: 8,

    backgroundColor: "#FBFAF7",

    flexDirection: "row",
    alignItems: "center",
    justifyContent:
      "space-between",
  },

  footerItem: {
    flex: 1,

    alignItems: "center",
    justifyContent: "center",

    minHeight: 58,

    opacity: 1,
  },

  footerItemPressed: {
    opacity: 0.65,
  },

  iconBox: {
    width: 38,
    height: 31,

    borderRadius: 12,

    alignItems: "center",
    justifyContent: "center",

    backgroundColor:
      "transparent",
    borderWidth: 1,
    borderColor: "transparent",
  },

  activeIconBox: {
    backgroundColor: "#F2E7C9",
    borderColor: "#E1CA8A",
  },

  footerLabel: {
    marginTop: 3,

    color: "#8D8A83",

    fontSize: 10,
    lineHeight: 13,

    fontWeight: "600",
  },

  activeLabel: {
    color: "#111111",
    fontWeight: "800",
  },

  activeIndicator: {
    marginTop: 4,

    width: 14,
    height: 2,

    borderRadius: 999,

    backgroundColor:
      "transparent",
  },

  activeIndicatorVisible: {
    backgroundColor: "#C9A44D",
  },
});
