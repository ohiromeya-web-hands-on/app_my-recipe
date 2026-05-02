import { NextResponse } from "next/server";
import { auth } from "@/auth";

export async function POST() {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json(
      { ok: false, error: { code: "UNAUTHORIZED", message: "Sign in required" } },
      { status: 401 }
    );
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
