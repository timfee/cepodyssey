import { Logger } from "@/lib/utils/logger";

export class SecureStorage {
  private encrypt(data: unknown): string {
    try {
      const json = JSON.stringify(data);
      return btoa(json);
    } catch (err) {
      Logger.error('[SecureStorage]', 'Failed to encrypt data', err);
      return '';
    }
  }

  private decrypt(data: string): unknown {
    try {
      const json = atob(data);
      return JSON.parse(json);
    } catch (err) {
      Logger.error('[SecureStorage]', 'Failed to decrypt data', err);
      return null;
    }
  }

  async save(key: string, data: unknown): Promise<void> {
    if (typeof window === 'undefined') return;
    try {
      const encrypted = this.encrypt(data);
      localStorage.setItem(key, encrypted);
    } catch (error) {
      Logger.error('[SecureStorage]', 'SecureStorage primary save failed', error);
      try {
        const encrypted = this.encrypt(data);
        sessionStorage.setItem(key, encrypted);
      } catch (storageError) {
        Logger.error('[SecureStorage]', 'SecureStorage save failed', storageError);
      }
    }
  }

  load<T>(key: string): T | null {
    if (typeof window === 'undefined') return null;
    try {
      const encrypted = localStorage.getItem(key) || sessionStorage.getItem(key);
      if (!encrypted) return null;
      return this.decrypt(encrypted) as T;
    } catch (err) {
      Logger.error('[SecureStorage]', 'SecureStorage load failed', err);
      return null;
    }
  }
}

export const secureStorage = new SecureStorage();
