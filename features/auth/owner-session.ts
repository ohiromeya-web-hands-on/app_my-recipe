import type { Session } from "next-auth";
import { auth, getAllowedOwnerEmails, normalizeOwnerEmail } from "@/auth";

function buildE2ESession(email: string): Session {
  return {
    user: {
      email,
    },
    expires: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
  } as Session;
}

export function getE2EOwnerSessionOrNull(): Session | null {
  if (
    process.env.VERCEL_ENV !== "production" &&
    process.env.PLAYWRIGHT_TEST === "1" &&
    process.env.E2E_OWNER_EMAIL
  ) {
    return buildE2ESession(process.env.E2E_OWNER_EMAIL);
  }

  return null;
}

export function getE2ESessionOrNull(): Session | null {
  if (
    process.env.VERCEL_ENV !== "production" &&
    process.env.PLAYWRIGHT_TEST === "1" &&
    process.env.E2E_AUTH_EMAIL
  ) {
    return buildE2ESession(process.env.E2E_AUTH_EMAIL);
  }

  return null;
}

export async function getOptionalOwnerSession(): Promise<Session | null> {
  const e2eOwnerSession = getE2EOwnerSessionOrNull();
  if (e2eOwnerSession) {
    return e2eOwnerSession;
  }

  const session = getE2ESessionOrNull() ?? await auth();

  if (!session?.user?.email) {
    return null;
  }

  const allowedEmails = getAllowedOwnerEmails();
  const sessionEmail = normalizeOwnerEmail(session.user.email);

  return allowedEmails.size > 0 && allowedEmails.has(sessionEmail) ? session : null;
}
