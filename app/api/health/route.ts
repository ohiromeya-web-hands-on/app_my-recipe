import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({
    ok: true,
    app: "MyKitchen",
    framework: "Next.js App Router",
    runtime: "node"
  });
}
