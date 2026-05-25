import { usePathname, useRouter } from "expo-router";
import {
  Building2,
  Home,
  Plus,
  Search,
  UserRound,
  UserSearch,
} from "lucide-react-native";
import type { ReactNode } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";

type FooterItem = {
  label: string;
  route: string;
  matchRoutes: string[];
  icon: (color: string, size: number) => ReactNode;
  isMain?: boolean;
};

const BASE_FOOTER_ITEMS: FooterItem[] = [
  {
    label: "Home",
    route: "/",
    matchRoutes: ["/"],
    icon: (color, size) => <Home color={color} size={size} />,
  },
  {
    label: "Property",
    route: "/property",
    matchRoutes: ["/property", "/search", "/properti"],
    icon: (color, size) => <Building2 color={color} size={size} />,
  },
  {
    label: "Add Listing",
    route: "/add-listing",
    matchRoutes: ["/add-listing", "/owner", "/agent"],
    icon: (color) => <Plus color={color} size={34} strokeWidth={2.6} />,
    isMain: true,
  },
  {
    label: "Buyer",
    route: "/buyer",
    matchRoutes: ["/buyer"],
    icon: (color, size) => <UserSearch color={color} size={size} />,
  },
  {
    label: "Profile",
    route: "/profile",
    matchRoutes: ["/profile", "/dashboard", "/settings"],
    icon: (color, size) => <UserRound color={color} size={size} />,
  },
];

const IOS_FOOTER_ITEMS: FooterItem[] = [
  {
    label: "Home",
    route: "/",
    matchRoutes: ["/"],
    icon: (color, size) => <Home color={color} size={size} />,
  },
  {
    label: "Property",
    route: "/property",
    matchRoutes: ["/property", "/properti"],
    icon: (color, size) => <Building2 color={color} size={size} />,
  },
  {
    label: "Search",
    route: "/search",
    matchRoutes: ["/search"],
    icon: (color) => <Search color={color} size={31} strokeWidth={2.6} />,
    isMain: true,
  },
  {
    label: "Buyer",
    route: "/buyer",
    matchRoutes: ["/buyer"],
    icon: (color, size) => <UserSearch color={color} size={size} />,
  },
  {
    label: "Profile",
    route: "/profile",
    matchRoutes: ["/profile", "/dashboard", "/settings"],
    icon: (color, size) => <UserRound color={color} size={size} />,
  },
];

function isActiveRoute(pathname: string, item: FooterItem) {
  if (item.route === "/" && pathname === "/") return true;

  return item.matchRoutes.some((route) => {
    if (route === "/") return pathname === "/";
    return pathname === route || pathname.startsWith(`${route}/`);
  });
}

export default function TetamoFooter() {
  const router = useRouter();
  const pathname = usePathname();

  const footerItems =
    Platform.OS === "ios" ? IOS_FOOTER_ITEMS : BASE_FOOTER_ITEMS;

  return (
    <View style={styles.footerWrap}>
      <View style={styles.footer}>
        {footerItems.map((item) => {
          const active = isActiveRoute(pathname, item);
          const color = active ? "#ffffff" : "#8f8f8f";

          return (
            <Pressable
              key={item.route}
              style={styles.footerItem}
              onPress={() => router.push(item.route as any)}
            >
              <View style={item.isMain ? styles.mainIconBox : styles.iconBox}>
                {item.icon(color, 24)}
              </View>

              <Text style={[styles.footerLabel, active && styles.activeLabel]}>
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  footerWrap: {
    backgroundColor: "#050505",
    borderTopWidth: 1,
    borderTopColor: "#1f1f1f",
  },
  footer: {
    minHeight: 86,
    paddingTop: 8,
    paddingBottom: 18,
    paddingHorizontal: 6,
    backgroundColor: "#050505",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
  },
  footerItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
  },
  iconBox: {
    minHeight: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  mainIconBox: {
    minHeight: 28,
    alignItems: "center",
    justifyContent: "center",
    marginTop: -2,
  },
  footerLabel: {
    color: "#8f8f8f",
    fontSize: 11,
    fontWeight: "700",
  },
  activeLabel: {
    color: "#ffffff",
  },
});