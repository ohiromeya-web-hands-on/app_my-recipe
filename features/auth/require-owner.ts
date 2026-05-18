import type { Session } from "next-auth";
import { auth, getAllowedOwnerEmails, normalizeOwnerEmail } from "@/auth";
import { getE2EOwnerSessionOrNull } from "@/features/auth/owner-session";
import type { ApiResult, ErrorCode } from "@/lib/result";

type OwnerSession = Session;
type OwnerAuthErrorCode = Extract<ErrorCode, "UNAUTHORIZED" | "FORBIDDEN">;

export class OwnerAuthError extends Error {
  code: OwnerAuthErrorCode;
  status: 401 | 403;

  constructor(code: OwnerAuthErrorCode, message: string) {
    super(message);
    this.name = "OwnerAuthError";
    this.code = code;
    this.status = code === "UNAUTHORIZED" ? 401 : 403;
  }
}

export async function requireOwner(): Promise<OwnerSession> {
  const e2eOwnerSession = getE2EOwnerSessionOrNull();
  if (e2eOwnerSession) {
    return e2eOwnerSession;
  }

  const session = await auth();

  if (!session?.user?.email) {
    throw new OwnerAuthError("UNAUTHORIZED", "Sign in required");
  }

  const allowedEmails = getAllowedOwnerEmails();
  const sessionEmail = normalizeOwnerEmail(session.user.email);

  if (allowedEmails.size === 0 || !allowedEmails.has(sessionEmail)) {
    throw new OwnerAuthError("FORBIDDEN", "Owner access required");
  }

  return session;
}

export function isOwnerAuthError(error: unknown): error is OwnerAuthError {
  return error instanceof OwnerAuthError;
}

export function ownerAuthErrorResult(error: OwnerAuthError): ApiResult<never> {
  return {
    ok: false,
    error: {
      code: error.code,
      message: error.message
    }
  };
}
