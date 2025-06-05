const getCookies = async () => (await import('next/headers')).cookies();
import crypto from 'crypto';
import type { LogEntry } from './types';
import { config } from "@/lib/config";

class ServerLogger {
  private static instance: ServerLogger;
  private logs = new Map<string, LogEntry[]>();
  private readonly MAX_LOGS_PER_SESSION = 100;

  private constructor() {}

  static getInstance(): ServerLogger {
    if (!this.instance) {
      this.instance = new ServerLogger();
    }
    return this.instance;
  }

  private async getSessionId(): Promise<string> {
    const cookieStore = await getCookies();
    let sessionId = cookieStore.get('debug-session')?.value;

    if (!sessionId) {
      sessionId = crypto.randomUUID();
      cookieStore.set('debug-session', sessionId, {
        httpOnly: true,
        secure: config.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24,
      });
    }

    return sessionId;
  }

  async log(entry: Omit<LogEntry, 'id' | 'timestamp'>): Promise<void> {
    const sessionId = await this.getSessionId();
    const fullEntry: LogEntry = {
      ...entry,
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
    };

    if (!this.logs.has(sessionId)) {
      this.logs.set(sessionId, []);
    }

    const sessionLogs = this.logs.get(sessionId)!;
    sessionLogs.unshift(fullEntry);

    if (sessionLogs.length > this.MAX_LOGS_PER_SESSION) {
      sessionLogs.splice(this.MAX_LOGS_PER_SESSION);
    }

    this.emit(sessionId, fullEntry);
  }

  async getRecentLogs(count = 50): Promise<LogEntry[]> {
    const sessionId = await this.getSessionId();
    const sessionLogs = this.logs.get(sessionId) || [];
    return sessionLogs.slice(0, count);
  }

  private clients = new Map<string, Set<ReadableStreamDefaultController>>();

  subscribe(sessionId: string, controller: ReadableStreamDefaultController) {
    if (!this.clients.has(sessionId)) {
      this.clients.set(sessionId, new Set());
    }
    this.clients.get(sessionId)!.add(controller);
  }

  unsubscribe(sessionId: string, controller: ReadableStreamDefaultController) {
    this.clients.get(sessionId)?.delete(controller);
  }

  private emit(sessionId: string, entry: LogEntry) {
    const clients = this.clients.get(sessionId);
    if (!clients) return;

    const data = `data: ${JSON.stringify(entry)}\n\n`;
    const encoder = new TextEncoder();

    clients.forEach((controller) => {
      try {
        controller.enqueue(encoder.encode(data));
      } catch {
        clients.delete(controller);
      }
    });
  }
}

export const serverLogger = ServerLogger.getInstance();
