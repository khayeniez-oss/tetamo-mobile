import { Tabs } from "expo-router";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          display: "none",
        },
      }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="property" />
      <Tabs.Screen name="add-listing" />
      <Tabs.Screen name="buyer" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}
