import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { runDailyMaintenance } from "@/features/maintenance/daily-maintenance";

function safeTokenEquals(actual: string | null, expected: string) {
  if (!actual) {
    return false;
  }

  const actualBuffer = Buffer.from(actual);
  const expectedBuffer = Buffer.from(`Bearer ${expected}`);

  if (actualBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return timingSafeEqual(actualBuffer, expectedBuffer);
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const expected = process.env.CRON_SECRET;

  if (!expected || !safeTokenEquals(authHeader, expected)) {
    return NextResponse.json(
      { ok: false, error: { code: "UNAUTHORIZED", message: "Invalid cron secret" } },
      { status: 401 }
    );
  }

  try {
    const result = await runDailyMaintenance();

    return NextResponse.json({
      ok: true,
      data: {
        job: "daily-maintenance",
        actions: ["purge-soft-deleted-recipes", "purge-orphan-shopping-items"],
        ...result,
      },
    });
  } catch (error) {
    console.error("daily-maintenance failed", error);
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "INTERNAL",
          message: "Daily maintenance failed",
        },
      },
      { status: 500 },
    );
  }
}
