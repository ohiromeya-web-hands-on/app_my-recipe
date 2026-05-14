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
    if (isOwnerAuthError(error) && error.code === "UNAUTHORIZED") {
      redirect("/api/auth/signin");
    }

    throw error;
  }

  return children;
}
