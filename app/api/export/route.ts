import { NextResponse } from "next/server";
import { buildExportPayload } from "@/features/export/queries";
import {
  isOwnerAuthError,
  ownerAuthErrorResult,
  requireOwner,
} from "@/features/auth/require-owner";

export async function GET() {
  try {
    await requireOwner();

    const payload = await buildExportPayload();
    return NextResponse.json(payload, {
      headers: {
        "Content-Disposition": `attachment; filename="mykitchen-export-${payload.exportedAt.slice(0, 10)}.json"`,
      },
    });
  } catch (error) {
    if (isOwnerAuthError(error)) {
      return NextResponse.json(ownerAuthErrorResult(error), {
        status: error.status,
      });
    }

    console.error("export failed", error);
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "INTERNAL",
          message: "Export failed",
        },
      },
      { status: 500 },
    );
  }
}
