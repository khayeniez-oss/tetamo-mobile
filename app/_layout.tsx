import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { View } from "react-native";
import { ListingDraftProvider } from "../components/listing/ListingDraftContext";
import TetamoFooter from "../components/navigation/TetamoFooter";

export default function RootLayout() {
  return (
    <ListingDraftProvider>
      <View style={{ flex: 1, backgroundColor: "#050505" }}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="modal" options={{ presentation: "modal" }} />
        </Stack>

        <TetamoFooter />
      </View>

      <StatusBar style="light" />
    </ListingDraftProvider>
  );
}
