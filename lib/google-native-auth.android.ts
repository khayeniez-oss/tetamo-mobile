import {
  GoogleOneTapSignIn,
  isCancelledResponse,
  isErrorWithCode,
  isSuccessResponse,
  statusCodes,
} from "react-native-nitro-google-signin";

export type NativeGoogleSignInResult = {
  idToken: string;
  email: string | null;
  fullName: string | null;
};

let configured = false;

function ensureConfigured() {
  const webClientId =
    process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID?.trim() || "";

  if (!webClientId) {
    throw new Error(
      "Konfigurasi Google Sign-In belum lengkap."
    );
  }

  if (configured) {
    return;
  }

  GoogleOneTapSignIn.configure({
    webClientId,
    offlineAccess: false,
    autoSelectOnSignIn: false,
  });

  configured = true;
}

export async function signInWithNativeGoogle(): Promise<
  NativeGoogleSignInResult | null
> {
  ensureConfigured();

  try {
    await GoogleOneTapSignIn.checkPlayServices(true);

    const response =
      await GoogleOneTapSignIn.presentExplicitSignIn();

    if (isCancelledResponse(response)) {
      return null;
    }

    if (!isSuccessResponse(response)) {
      throw new Error(
        "Akun Google tidak dapat dipilih. Silakan coba lagi."
      );
    }

    return {
      idToken: response.data.idToken,
      email: response.data.user.email,
      fullName: response.data.user.name,
    };
  } catch (error: unknown) {
    if (isErrorWithCode(error)) {
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        return null;
      }

      if (
        error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE
      ) {
        throw new Error(
          "Google Play Services tidak tersedia atau perlu diperbarui."
        );
      }

      if (error.code === statusCodes.DEVELOPER_ERROR) {
        throw new Error(
          "Konfigurasi Google Sign-In tidak valid."
        );
      }

      if (error.code === statusCodes.IN_PROGRESS) {
        throw new Error(
          "Proses login Google sedang berjalan."
        );
      }

      console.warn("[Tetamo native Google]", {
        code: error.code,
        message: error.message,
      });

      throw new Error(
        "Login dengan Google gagal. Silakan coba lagi."
      );
    }

    if (
      error instanceof Error &&
      error.message ===
        "Konfigurasi Google Sign-In belum lengkap."
    ) {
      throw error;
    }

    console.warn(
      "[Tetamo native Google unexpected]",
      error
    );

    throw new Error(
      "Login dengan Google gagal. Silakan coba lagi."
    );
  }
}
