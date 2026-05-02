"use client";

import { signIn, signOut } from "next-auth/react";

export function AuthActions({ isSignedIn }: { isSignedIn: boolean }) {
  if (isSignedIn) {
    return (
      <button className="button" type="button" onClick={() => signOut()}>
        Sign out
      </button>
    );
  }

  return (
    <button className="button" type="button" onClick={() => signIn("google")}>
      Sign in with Google
    </button>
  );
}
