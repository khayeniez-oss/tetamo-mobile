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
          height: 86,
          paddingTop: 8,
          paddingBottom: 18,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "700",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
        }}
      />

      <Tabs.Screen
        name="property"
        options={{
          title: "Property",
          tabBarIcon: ({ color, size }) => (
            <Building2 color={color} size={size} />
          ),
        }}
      />

      <Tabs.Screen
        name="add-listing"
        options={{
          title: "Add Listing",
          tabBarIcon: ({ color }) => (
            <Plus color={color} size={34} strokeWidth={2.6} />
          ),
        }}
      />

      <Tabs.Screen
        name="saved"
        options={{
          title: "Buyer",
          tabBarIcon: ({ color, size }) => (
            <UserRoundCheck color={color} size={size} />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => (
            <UserRound color={color} size={size} />
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