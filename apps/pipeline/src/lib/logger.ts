export type LogLevel = "debug" | "info" | "warn" | "error";

class Logger {
  private format(level: LogLevel, message: string, meta?: Record<string, unknown>): string {
    const timestamp = new Date().toISOString();
    const metaStr = meta && Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : "";
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${metaStr}`;
  }

  debug(message: string, meta?: Record<string, unknown>): void {
    if (process.env.LOG_LEVEL === "debug") {
      console.debug(this.format("debug", message, meta));
    }
  }

  info(message: string, meta?: Record<string, unknown>): void {
    console.info(this.format("info", message, meta));
  }

  warn(message: string, meta?: Record<string, unknown>): void {
    console.warn(this.format("warn", message, meta));
  }

  error(message: string, meta?: Record<string, unknown>): void {
    console.error(this.format("error", message, meta));
  }
}

export const logger = new Logger();
