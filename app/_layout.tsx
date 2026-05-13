import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ListingDraftProvider } from "../components/listing/ListingDraftContext";

export default function RootLayout() {
  return (
    <ListingDraftProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="modal" options={{ presentation: "modal" }} />
      </Stack>

      <StatusBar style="light" />
    </ListingDraftProvider>
  );
}