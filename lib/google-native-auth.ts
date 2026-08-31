export type NativeGoogleSignInResult = {
  idToken: string;
  email: string | null;
  fullName: string | null;
};

export async function signInWithNativeGoogle(): Promise<
  NativeGoogleSignInResult | null
> {
  throw new Error(
    "Native Google Sign-In hanya tersedia di Android."
  );
}
