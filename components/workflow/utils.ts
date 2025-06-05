import type { DisplayApiAction } from "./workflow-types";

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
