import { toast } from "sonner";

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  OFF = 999,
}

interface LogEntry {
  level: LogLevel;
  levelName: string;
  message: string;
  timestamp: string;
  category?: string;
  data?: unknown[];
  stackTrace?: string;
}

/**
 * Centralized logging utility with environment-based configuration.
 * Supports console output, toast notifications, and log history.
 */
export class Logger {
  private static level: LogLevel = LogLevel.INFO;
  private static logLevelToShowInToasts: LogLevel = LogLevel.WARN;
  private static isDevelopment = process.env.NODE_ENV === "development";
  private static isEnabled = process.env.NEXT_PUBLIC_LOG_TO_CONSOLE !== "false";
  private static history: LogEntry[] = [];
  private static maxHistorySize = 100;
  private static initialized = false;

  /**
   * Initialize logger from environment variables.
   * Should be called once at application startup.
   */
  static initialize(): void {
    if (this.initialized) return;

    // Set console log level from env
    const envLevel = process.env.NEXT_PUBLIC_LOG_LEVEL?.toUpperCase();
    if (envLevel && LogLevel[envLevel as keyof typeof LogLevel] !== undefined) {
      this.level = LogLevel[envLevel as keyof typeof LogLevel];
    }

    // Set toast level from env
    const toastLevel = process.env.NEXT_PUBLIC_LOG_LEVEL_TO_SHOW_IN_TOASTS;
    if (toastLevel === "-1" || toastLevel === "undefined") {
      this.logLevelToShowInToasts = LogLevel.OFF;
    } else if (toastLevel && !isNaN(parseInt(toastLevel))) {
      this.logLevelToShowInToasts = parseInt(toastLevel);
    }

    this.initialized = true;
  }

  /**
   * Sets the minimum log level for console output.
   *
   * @param level - Minimum log level to display
   */
  static setLevel(level: LogLevel): void {
    this.level = level;
  }

  /**
   * Internal logging method that handles all log operations.
   */
  private static log(
    level: LogLevel,
    levelName: string,
    category: string,
    message: string,
    ...args: unknown[]
  ): void {
    if (!this.initialized) this.initialize();

    const timestamp = new Date().toISOString();
    const logEntry: LogEntry = {
      level,
      levelName,
      message,
      timestamp,
      category,
      data: args.length > 0 ? args : undefined,
    };

    // Add to history
    this.history.push(logEntry);
    if (this.history.length > this.maxHistorySize) {
      this.history.shift();
    }

    // Console output
    if (this.isEnabled && level >= this.level) {
      const prefix = `[${timestamp}] [${levelName}] ${category}`;
      switch (level) {
        case LogLevel.DEBUG:
          console.log(prefix, message, ...args);
          break;
        case LogLevel.INFO:
          console.info(prefix, message, ...args);
          break;
        case LogLevel.WARN:
          console.warn(prefix, message, ...args);
          break;
        case LogLevel.ERROR:
          console.error(prefix, message, ...args);
          break;
      }
    }

    // Toast notifications
    if (level >= this.logLevelToShowInToasts) {
      const toastMessage = `${category} ${message}`;
      switch (level) {
        case LogLevel.INFO:
          toast.info(toastMessage);
          break;
        case LogLevel.WARN:
          toast.warning(toastMessage);
          break;
        case LogLevel.ERROR:
          toast.error(toastMessage);
          break;
      }
    }
  }

  /**
   * Logs a debug message.
   *
   * @param category - Log category (e.g., "[Auth]", "[API]")
   * @param message - Log message
   * @param args - Additional data to log
   */
  static debug(category: string, message: string, ...args: unknown[]): void {
    this.log(LogLevel.DEBUG, "DEBUG", category, message, ...args);
  }

  /**
   * Logs an info message.
   *
   * @param category - Log category
   * @param message - Log message
   * @param args - Additional data to log
   */
  static info(category: string, message: string, ...args: unknown[]): void {
    this.log(LogLevel.INFO, "INFO", category, message, ...args);
  }

  /**
   * Logs a warning message.
   *
   * @param category - Log category
   * @param message - Log message
   * @param args - Additional data to log
   */
  static warn(category: string, message: string, ...args: unknown[]): void {
    this.log(LogLevel.WARN, "WARN", category, message, ...args);
  }

  /**
   * Logs an error message.
   *
   * @param category - Log category
   * @param message - Log message
   * @param error - Error object (optional)
   * @param args - Additional data to log
   */
  static error(category: string, message: string, error?: unknown, ...args: unknown[]): void {
    const logEntry: LogEntry = {
      level: LogLevel.ERROR,
      levelName: "ERROR",
      message,
      timestamp: new Date().toISOString(),
      category,
      data: args.length > 0 ? args : undefined,
    };

    if (error instanceof Error) {
      logEntry.stackTrace = error.stack;
      this.log(LogLevel.ERROR, "ERROR", category, message, error.message, error.stack, ...args);
    } else {
      this.log(LogLevel.ERROR, "ERROR", category, message, error, ...args);
    }
  }

  /**
   * Creates a collapsible group in the console.
   *
   * @param label - Group label
   */
  static group(label: string): void {
    if (this.isEnabled && this.level <= LogLevel.DEBUG) {
      console.group(label);
    }
  }

  /**
   * Ends the current console group.
   */
  static groupEnd(): void {
    if (this.isEnabled && this.level <= LogLevel.DEBUG) {
      console.groupEnd();
    }
  }

  /**
   * Displays tabular data in the console.
   *
   * @param data - Data to display in table format
   */
  static table(data: unknown): void {
    if (this.isEnabled && this.level <= LogLevel.DEBUG) {
      console.table(data);
    }
  }

  /**
   * Gets recent log history for diagnostics.
   *
   * @param count - Number of log entries to retrieve
   * @returns Array of recent log entries
   */
  static getHistory(count: number = 50): LogEntry[] {
    return this.history.slice(-count);
  }

  /**
   * Clears the log history.
   */
  static clearHistory(): void {
    this.history = [];
  }

  /**
   * Development-only detailed logging.
   *
   * @param category - Log category
   * @param message - Log message
   * @param args - Additional data to log
   */
  static dev(category: string, message: string, ...args: unknown[]): void {
    if (this.isDevelopment) {
      this.debug(category, `[DEV] ${message}`, ...args);
    }
  }
}
