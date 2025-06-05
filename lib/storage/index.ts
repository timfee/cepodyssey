export class SecureStorage {
  private encrypt(data: unknown): string {
    const json = JSON.stringify(data);
    if (typeof window === "undefined") {
      return Buffer.from(json).toString("base64");
    }
    return btoa(json);
  }

  private decrypt(data: string): unknown {
    const json = typeof window === "undefined"
      ? Buffer.from(data, "base64").toString("utf-8")
      : atob(data);
    return JSON.parse(json);
  }

  async save(key: string, data: unknown): Promise<void> {
    if (typeof window === "undefined") return;
    const encrypted = this.encrypt(data);
    try {
      localStorage.setItem(key, encrypted);
    } catch (e) {
      try {
        sessionStorage.setItem(key, encrypted);
      } catch (err) {
        console.error("Failed to persist data", e, err);
      }
    }
  }

  async load<T = unknown>(key: string): Promise<T | null> {
    if (typeof window === "undefined") return null;
    const raw = localStorage.getItem(key) ?? sessionStorage.getItem(key);
    if (!raw) return null;
    try {
      return this.decrypt(raw) as T;
    } catch (e) {
      console.error("Failed to parse stored data", e);
      return null;
    }
  }
}

export const secureStorage = new SecureStorage();
