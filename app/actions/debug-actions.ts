"use server";

import { store } from "@/lib/redux/store";
import { addApiLog, type ApiLogEntry } from "@/lib/redux/slices/debug-panel";

/**
 * Forwards API log entries produced on the server to the Redux store
 * so the client debug panel can display them.
 */
// Deprecated: server-side log forwarding is now handled via log collectors
// export async function forwardApiLog(entry: ApiLogEntry): Promise<void> {
//   store.dispatch(addApiLog(entry));
// }

