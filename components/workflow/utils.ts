import type { DisplayApiAction } from "./workflow-types";

/**
 * Convert a workflow action string (e.g. "GET /api/foo") into a structured
 * object. Output placeholders like `{id}` are replaced with values from
 * `outputs` when available.
 */
export function parseApiAction(
  action: string,
  outputs: Record<string, unknown>,
): DisplayApiAction {
  let trimmed = action.trim();
  let isManual = false;

  if (/^manual:/i.test(trimmed)) {
    isManual = true;
    trimmed = trimmed.replace(/^manual:\s*/i, "");
  }

  const match = trimmed.match(/^([A-Z]+)\s+(.+)/);
  if (!match) {
    return { method: "", path: trimmed, isManual: true };
  }

  const [, method, rawPath] = match;
  const path = rawPath.replace(/\{([^{}]+)\}/g, (_, key) => {
    const val = Object.prototype.hasOwnProperty.call(outputs, key)
      ? // eslint-disable-next-line security/detect-object-injection
        outputs[key]
      : undefined;
    return val !== undefined ? String(val) : `{${key}}`;
  });

  return { method, path, isManual };
}

/**
 * Render a value for display in the UI, truncating long strings and
 * safely stringifying objects.
 */
export function formatValue(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") {
    return value.length > 50 ? `${value.slice(0, 47)}...` : value;
  }
  if (typeof value === "object") {
    try {
      const str = JSON.stringify(value);
      return str.length > 50 ? `${str.slice(0, 47)}...` : str;
    } catch {
      return "[object]";
    }
  }
  return String(value);
}
