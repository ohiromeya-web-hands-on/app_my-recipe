import { redirect } from "next/navigation";
import {
  isOwnerAuthError,
  requireOwner
} from "@/features/auth/require-owner";

export default async function OwnerLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  try {
    await requireOwner();
  } catch (error) {
    if (isOwnerAuthError(error)) {
      if (error.code === "UNAUTHORIZED") {
        redirect("/api/auth/signin");
      }

      redirect("/api/auth/signin?error=AccessDenied");
    }

    throw error;
  }

  return children;
}
