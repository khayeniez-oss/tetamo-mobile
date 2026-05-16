import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { supabase } from "../lib/supabase";

export const TETAMO_SOUND_FILE = "tetamo_notification.wav";
export const TETAMO_SOUND_CHANNEL_ID = "tetamo-alerts";
export const TETAMO_SILENT_CHANNEL_ID = "tetamo-silent";

Notifications.setNotificationHandler({
  handleNotification: async () =>
    ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    } as any),
});

export function getTetamoNotificationChannelId(soundEnabled: boolean) {
  return soundEnabled ? TETAMO_SOUND_CHANNEL_ID : TETAMO_SILENT_CHANNEL_ID;
}

export async function setupTetamoNotificationChannels() {
  if (Platform.OS !== "android") return;

  await Notifications.setNotificationChannelAsync(TETAMO_SOUND_CHANNEL_ID, {
    name: "Tetamo Alerts",
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: "#E6C15C",
    sound: TETAMO_SOUND_FILE,
  });

  await Notifications.setNotificationChannelAsync(TETAMO_SILENT_CHANNEL_ID, {
    name: "Tetamo Silent",
    importance: Notifications.AndroidImportance.DEFAULT,
    vibrationPattern: [0],
    lightColor: "#E6C15C",
    sound: null,
  });
}

function getExpoProjectId() {
  return (
    Constants.easConfig?.projectId ||
    Constants.expoConfig?.extra?.eas?.projectId ||
    ""
  );
}

export async function registerTetamoPushNotifications() {
  try {
    await setupTetamoNotificationChannels();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.id) {
      return {
        ok: false,
        status: "not_logged_in",
        token: "",
      };
    }

    if (!Device.isDevice) {
      return {
        ok: false,
        status: "physical_device_required",
        token: "",
      };
    }

    const existingPermission = await Notifications.getPermissionsAsync();
    let finalStatus = existingPermission.status;

    if (existingPermission.status !== "granted") {
      const requestedPermission = await Notifications.requestPermissionsAsync();
      finalStatus = requestedPermission.status;
    }

    if (finalStatus !== "granted") {
      return {
        ok: false,
        status: "permission_denied",
        token: "",
      };
    }

    const projectId = getExpoProjectId();

    const tokenResult = projectId
      ? await Notifications.getExpoPushTokenAsync({ projectId })
      : await Notifications.getExpoPushTokenAsync();

    const expoPushToken = tokenResult.data;

    const { error } = await supabase.from("push_tokens").upsert(
      {
        user_id: user.id,
        expo_push_token: expoPushToken,
        platform: Platform.OS,
        device_name: Device.deviceName || "",
        app_version:
          Constants.expoConfig?.version || Constants.manifest2?.extra?.expoClient?.version || "",
        project_id: projectId || null,
        status: "active",
        source: "tetamo-mobile",
        metadata: {
          app: "tetamo-mobile",
          device_brand: Device.brand || "",
          device_model: Device.modelName || "",
          os_name: Device.osName || "",
          os_version: Device.osVersion || "",
        },
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "expo_push_token",
      }
    );

    if (error) {
      return {
        ok: false,
        status: error.message,
        token: expoPushToken,
      };
    }

    return {
      ok: true,
      status: "registered",
      token: expoPushToken,
    };
  } catch (error: any) {
    return {
      ok: false,
      status: error?.message || "push_registration_failed",
      token: "",
    };
  }
}

export async function sendTetamoLocalTestNotification(soundEnabled: boolean) {
  await setupTetamoNotificationChannels();

  const channelId = getTetamoNotificationChannelId(soundEnabled);

  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Tetamo",
      body: soundEnabled
        ? "Notification sound is ON."
        : "Notification sound is OFF.",
      sound: soundEnabled ? TETAMO_SOUND_FILE : false,
    },
    trigger: {
      seconds: 1,
      channelId,
    } as any,
  });
}