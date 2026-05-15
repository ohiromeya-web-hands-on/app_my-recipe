import { NextResponse } from "next/server";
import {
  isOwnerAuthError,
  ownerAuthErrorResult,
  requireOwner
} from "@/features/auth/require-owner";

export async function POST() {
  try {
    await requireOwner();
  } catch (error) {
    if (isOwnerAuthError(error)) {
      return NextResponse.json(ownerAuthErrorResult(error), {
        status: error.status
      });
    }

    throw error;
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "NOT_CONFIGURED",
          message: "BLOB_READ_WRITE_TOKEN is not configured yet"
        }
      },
      { status: 501 }
    );
  }

  return NextResponse.json({
    ok: true,
    data: {
      strategy: "client-direct-upload",
      configured: true
    }
  });
}
