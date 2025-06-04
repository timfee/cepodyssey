import { NextResponse } from "next/server";
import type { ApiLogEntry } from "@/lib/redux/slices/debug-panel";

const g = globalThis as { __API_LOGS__?: ApiLogEntry[] };
const serverLogs: ApiLogEntry[] = g.__API_LOGS__ || [];

export async function GET() {
  return NextResponse.json({ logs: serverLogs });
}
