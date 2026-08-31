import * as Notifications from "expo-notifications";
import { router, Stack, useRootNavigationState } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef, useState } from "react";
import { View } from "react-native";

import { ListingDraftProvider } from "../components/listing/ListingDraftContext";
import TetamoFooter from "../components/navigation/TetamoFooter";
import { supabase } from "../lib/supabase";

function readNotificationString(
  data: Record<string, unknown>,
  key: string,
) {
  const value = data?.[key];

  return typeof value === "string"
    ? value.trim()
    : "";
}

function normalizeNotificationType(
  value: string,
) {
  return value
    .trim()
    .toLowerCase();
}

function buildRouteWithParams(
  pathname: string,
  params: Record<string, string>,
) {
  const query = Object.entries(params)
    .filter(([, value]) => Boolean(value))
    .map(
      ([key, value]) =>
        `${encodeURIComponent(key)}=${encodeURIComponent(value)}`,
    )
    .join("&");

  return query
    ? `${pathname}?${query}`
    : pathname;
}

function isLegacyBusinessDestination(
  destination: string,
) {
  const pathname =
    destination.split("?")[0];

  return (
    pathname === "/dashboard/listings" ||
    pathname === "/dashboard/leads" ||
    pathname === "/dashboard/viewing-schedule" ||
    pathname === "/dashboard/payments" ||
    pathname === "/add-listing" ||
    pathname.startsWith("/owner/") ||
    pathname.startsWith("/agent/") ||
    pathname.startsWith("/developer/")
  );
}

async function getSafePushNotificationDestination(
  destination: string,
) {
  if (
    !isLegacyBusinessDestination(
      destination,
    )
  ) {
    return destination;
  }

  try {
    const {
      data: { user },
    } =
      await supabase.auth.getUser();

    if (!user?.id) {
      return "/dashboard/notifications";
    }

    const {
      data: profile,
      error,
    } =
      await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

    if (error) {
      return "/dashboard/notifications";
    }

    const role =
      normalizeNotificationType(
        String(
          profile?.role || ""
        ),
      );

    /*
     * Preserve existing Admin routing.
     * Marketplace users stay consumer-side.
     */
    if (role === "admin") {
      return destination;
    }

    return "/dashboard/notifications";
  } catch {
    return "/dashboard/notifications";
  }
}

function getPushNotificationRoute(
  notification: Notifications.Notification,
) {
  const rawData =
    notification.request.content.data ?? {};

  const data = rawData as Record<string, unknown>;

  const type = normalizeNotificationType(
    readNotificationString(
      data,
      "type",
    ),
  );

  const leadId =
    readNotificationString(
      data,
      "leadId",
    );

  const propertyId =
    readNotificationString(
      data,
      "propertyId",
    );

  const actionUrl =
    readNotificationString(
      data,
      "actionUrl",
    );

  /*
   * If the database notification explicitly provides
   * a Tetamo internal route, prefer it.
   *
   * External URLs are intentionally not opened here.
   */
  if (
    actionUrl.startsWith("/") &&
    !actionUrl.startsWith("//")
  ) {
    return actionUrl;
  }

  /*
   * Leads / WhatsApp inquiries
   */
  if (
    type.includes("lead") ||
    type.includes("whatsapp") ||
    type.includes("inquiry")
  ) {
    return buildRouteWithParams(
      "/dashboard/leads",
      {
        lead_id: leadId,
        property_id: propertyId,
        type,
      },
    );
  }

  /*
   * Viewing requests / schedules
   */
  if (
    type.includes("viewing") ||
    type.includes("schedule")
  ) {
    return buildRouteWithParams(
      "/dashboard/viewing-schedule",
      {
        lead_id: leadId,
        property_id: propertyId,
        type,
      },
    );
  }

  /*
   * Payments / memberships
   */
  if (
    type.includes("payment") ||
    type.includes("invoice") ||
    type.includes("receipt") ||
    type.includes("membership") ||
    type.includes("package") ||
    type.includes("checkout") ||
    type.includes("transaction")
  ) {
    return buildRouteWithParams(
      "/dashboard/payments",
      {
        property_id: propertyId,
        type,
      },
    );
  }

  /*
   * Listings / property status
   */
  if (
    type.includes("listing") ||
    type.includes("property") ||
    type.includes("approval") ||
    type.includes("approved") ||
    type.includes("rejected") ||
    type.includes("verification")
  ) {
    return buildRouteWithParams(
      "/dashboard/listings",
      {
        property_id: propertyId,
        type,
      },
    );
  }

  /*
   * Safe fallback.
   */
  return "/dashboard/notifications";
}

function useNotificationObserver() {
  const rootNavigationState =
    useRootNavigationState();

  const handledNotificationIds =
    useRef<Set<string>>(new Set());

  const [
    pendingDestination,
    setPendingDestination,
  ] = useState<string | null>(null);

  /*
   * Listen for notification interactions immediately,
   * but do NOT navigate immediately during a cold start.
   *
   * The root navigator may not be mounted yet.
   */
  useEffect(() => {
    function queueNotification(
      notification: Notifications.Notification,
    ) {
      const requestId =
        notification.request.identifier;

      if (
        requestId &&
        handledNotificationIds.current.has(
          requestId,
        )
      ) {
        return;
      }

      if (requestId) {
        handledNotificationIds.current.add(
          requestId,
        );
      }

      const destination =
        getPushNotificationRoute(
          notification,
        );

      setPendingDestination(
        destination,
      );
    }

    /*
     * Handles a notification that launched Tetamo
     * from a completely terminated state.
     */
    const initialResponse =
      Notifications.getLastNotificationResponse();

    if (
      initialResponse?.notification &&
      initialResponse.actionIdentifier ===
        Notifications.DEFAULT_ACTION_IDENTIFIER
    ) {
      queueNotification(
        initialResponse.notification,
      );
    }

    /*
     * Handles taps while Tetamo is already running
     * or sitting in the background.
     */
    const subscription =
      Notifications.addNotificationResponseReceivedListener(
        (response) => {
          if (
            response.actionIdentifier !==
            Notifications.DEFAULT_ACTION_IDENTIFIER
          ) {
            return;
          }

          queueNotification(
            response.notification,
          );
        },
      );

    return () => {
      subscription.remove();
    };
  }, []);

  /*
   * Navigate only AFTER Expo Router's root navigator
   * has mounted.
   */
  useEffect(() => {
    if (
      !pendingDestination ||
      !rootNavigationState?.key
    ) {
      return;
    }

    const destination =
      pendingDestination;

    let cancelled = false;

    async function navigatePendingNotification() {
      const safeDestination =
        await getSafePushNotificationDestination(
          destination,
        );

      if (cancelled) {
        return;
      }

      setPendingDestination(null);

      router.push(
        safeDestination as any,
      );

      Notifications.clearLastNotificationResponse();
    }

    void navigatePendingNotification();

    return () => {
      cancelled = true;
    };
  }, [
    pendingDestination,
    rootNavigationState?.key,
  ]);
}

export default function RootLayout() {
  useNotificationObserver();

  return (
    <ListingDraftProvider>
      <View
        style={{
          flex: 1,
          backgroundColor: "#050505",
        }}
      >
        <Stack
          screenOptions={{
            headerShown: false,
          }}
        >
          <Stack.Screen name="(tabs)" />

          <Stack.Screen
            name="modal"
            options={{
              presentation: "modal",
            }}
          />
        </Stack>

        <TetamoFooter />
      </View>

      <StatusBar style="light" />
    </ListingDraftProvider>
  );
}
