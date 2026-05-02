import { NextRequest, NextResponse } from "next/server";

export function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const expected = process.env.CRON_SECRET;

  if (!expected || authHeader !== `Bearer ${expected}`) {
    return NextResponse.json(
      { ok: false, error: { code: "UNAUTHORIZED", message: "Invalid cron secret" } },
      { status: 401 }
    );
  }

  return NextResponse.json({
    ok: true,
    data: {
      job: "daily-maintenance",
      actions: ["purge-soft-deleted-recipes", "purge-orphan-shopping-items"],
      mode: "stub"
    }
  });
}
