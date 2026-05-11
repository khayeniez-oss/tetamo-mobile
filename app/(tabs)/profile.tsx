import { SafeAreaView, StyleSheet, Text, View } from "react-native";

export default function ProfileScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.center}>
        <Text style={styles.title}>Profile</Text>
        <Text style={styles.subtitle}>
          Login, account, and dashboard access will connect here.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#050505" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  title: { color: "#ffffff", fontSize: 28, fontWeight: "900" },
  subtitle: { color: "#9b9b9b", marginTop: 8, textAlign: "center" },
});