export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  OFF = 999,
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  category?: string;
  data?: unknown[];
  stackTrace?: string;
}

import { config } from "@/lib/config";

export class Logger {
  private static level: LogLevel = LogLevel.INFO;
  private static logLevelToShowInToasts: LogLevel = LogLevel.WARN;
  private static isDevelopment = process.env.NODE_ENV === "development";
  private static isEnabled = config.NEXT_PUBLIC_LOG_TO_CONSOLE !== "false";
  private static history: LogEntry[] = [];
  private static maxHistorySize = 100;

  /**
   * Initialize logger from environment variables.
   */
  static initialize(): void {
    const envLevel = config.NEXT_PUBLIC_LOG_LEVEL?.toUpperCase();
    if (envLevel && LogLevel[envLevel as keyof typeof LogLevel] !== undefined) {
      this.level = LogLevel[envLevel as keyof typeof LogLevel];
    }
    const toastLevel = config.NEXT_PUBLIC_LOG_LEVEL_TO_SHOW_IN_TOASTS;
    if (toastLevel === "-1" || toastLevel === "undefined") {
      this.logLevelToShowInToasts = LogLevel.OFF;
    } else if (toastLevel && !isNaN(parseInt(toastLevel))) {
      this.logLevelToShowInToasts = parseInt(toastLevel) as LogLevel;
    }
  }

  static setLevel(level: LogLevel): void {
    this.level = level;
  }

  private static push(entry: LogEntry): void {
    this.history.push(entry);
    if (this.history.length > this.maxHistorySize) {
      this.history.shift();
    }
  }

  private static shouldLog(level: LogLevel): boolean {
    return this.isEnabled && level >= this.level && this.level !== LogLevel.OFF;
  }

  static debug(category: string, message: string, ...args: unknown[]): void {
    if (!this.shouldLog(LogLevel.DEBUG)) return;
    const entry: LogEntry = {
      level: LogLevel.DEBUG,
      message,
      timestamp: new Date().toISOString(),
      category,
      data: args,
    };
    this.push(entry);
    console.debug(`[${category}]`, message, ...args);
  }

  static info(category: string, message: string, ...args: unknown[]): void {
    if (!this.shouldLog(LogLevel.INFO)) return;
    const entry: LogEntry = {
      level: LogLevel.INFO,
      message,
      timestamp: new Date().toISOString(),
      category,
      data: args,
    };
    this.push(entry);
    console.info(`[${category}]`, message, ...args);
  }

  static warn(category: string, message: string, ...args: unknown[]): void {
    if (!this.shouldLog(LogLevel.WARN)) return;
    const entry: LogEntry = {
      level: LogLevel.WARN,
      message,
      timestamp: new Date().toISOString(),
      category,
      data: args,
    };
    this.push(entry);
    console.warn(`[${category}]`, message, ...args);
  }

  static error(
    category: string,
    message: string,
    error?: unknown,
    ...args: unknown[]
  ): void {
    if (!this.shouldLog(LogLevel.ERROR)) return;
    const entry: LogEntry = {
      level: LogLevel.ERROR,
      message,
      timestamp: new Date().toISOString(),
      category,
      data: [...(args ?? []), error],
      stackTrace: error instanceof Error ? error.stack : undefined,
    };
    this.push(entry);
    console.error(`[${category}]`, message, error, ...args);
  }

  static group(label: string): void {
    if (!this.isEnabled) return;
    console.group(label);
  }

  static groupEnd(): void {
    if (!this.isEnabled) return;
    console.groupEnd();
  }

  static table(data: unknown): void {
    if (!this.isEnabled) return;
    console.table(data);
  }

  /**
   * Get recent log history for diagnostics.
   */
  static getHistory(count: number = 50): LogEntry[] {
    return this.history.slice(-count);
  }

  /**
   * Clear log history.
   */
  static clearHistory(): void {
    this.history = [];
  }

  /**
   * Development-only detailed logging.
   */
  static dev(category: string, message: string, ...args: unknown[]): void {
    if (this.isDevelopment) {
      this.debug(category, `[DEV] ${message}`, ...args);
    }
  }
}
