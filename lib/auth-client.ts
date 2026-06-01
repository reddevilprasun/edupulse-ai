import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL, // Defaults to current origin if undefined (crucial for production co-located deployments)
});

export const { signIn, signUp, signOut, useSession } = authClient;
