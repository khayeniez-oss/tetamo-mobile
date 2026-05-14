import { Tabs } from "expo-router";
import {
  Building2,
  Home,
  Plus,
  UserRound,
  UserRoundCheck,
} from "lucide-react-native";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#e6c15c",
        tabBarInactiveTintColor: "#8f8f8f",
        tabBarStyle: {
          backgroundColor: "#050505",
          borderTopColor: "#1f1f1f",
          height: 78,
          paddingTop: 7,
          paddingBottom: 14,
        },
        tabBarLabelStyle: {
          fontSize: 9.5,
          fontWeight: "700",
          letterSpacing: 0.1,
        },
        tabBarIconStyle: {
          marginBottom: 1,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, focused }) => (
            <Home color={color} size={focused ? 22 : 21} strokeWidth={2.2} />
          ),
        }}
      />

      <Tabs.Screen
        name="property"
        options={{
          title: "Property",
          tabBarIcon: ({ color, focused }) => (
            <Building2
              color={color}
              size={focused ? 22 : 21}
              strokeWidth={2.2}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="add-listing"
        options={{
          title: "Pasang Iklan",
          tabBarIcon: ({ color, focused }) => (
            <Plus
              color={color}
              size={focused ? 29 : 27}
              strokeWidth={2.5}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="saved"
        options={{
          title: "Buyer",
          tabBarIcon: ({ color, focused }) => (
            <UserRoundCheck
              color={color}
              size={focused ? 22 : 21}
              strokeWidth={2.2}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, focused }) => (
            <UserRound
              color={color}
              size={focused ? 22 : 21}
              strokeWidth={2.2}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="explore"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}