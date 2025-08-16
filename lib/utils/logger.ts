/**
 * Unified Logger System
 * Works on both client and server side with configurable levels
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  NONE = 4
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  data?: any;
  context?: string;
  userId?: string;
  sessionId?: string;
}

class Logger {
  private static instance: Logger;
  private logLevel: LogLevel;
  private isProduction: boolean;
  private context: string = '';
  private sessionId: string = '';
  private userId: string = '';

  private constructor() {
    this.isProduction = process.env.NODE_ENV === 'production';
    this.logLevel = this.isProduction ? LogLevel.WARN : LogLevel.DEBUG;
    
    // Generate session ID for tracking
    this.sessionId = this.generateSessionId();
  }

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  /**
   * Set global context for all logs
   */
  setContext(context: string): void {
    this.context = context;
  }

  /**
   * Set user ID for tracking
   */
  setUserId(userId: string): void {
    this.userId = userId;
  }

  /**
   * Set log level
   */
  setLogLevel(level: LogLevel): void {
    this.logLevel = level;
  }

  /**
   * Debug level logging
   */
  debug(message: string, data?: any, context?: string): void {
    this.log(LogLevel.DEBUG, message, data, context);
  }

  /**
   * Info level logging
   */
  info(message: string, data?: any, context?: string): void {
    this.log(LogLevel.INFO, message, data, context);
  }

  /**
   * Warning level logging
   */
  warn(message: string, data?: any, context?: string): void {
    this.log(LogLevel.WARN, message, data, context);
  }

  /**
   * Error level logging
   */
  error(message: string, error?: Error | any, context?: string): void {
    const errorData = error instanceof Error ? {
      name: error.name,
      message: error.message,
      stack: error.stack
    } : error;
    
    this.log(LogLevel.ERROR, message, errorData, context);
  }

  /**
   * Core logging method
   */
  private log(level: LogLevel, message: string, data?: any, context?: string): void {
    // Skip if log level is too low
    if (level < this.logLevel) {
      return;
    }

    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      data,
      context: context || this.context,
      userId: this.userId,
      sessionId: this.sessionId
    };

    // Format and output the log
    this.outputLog(logEntry);

    // In production, you might want to send logs to external service
    if (this.isProduction && level >= LogLevel.ERROR) {
      this.sendToExternalService(logEntry);
    }
  }

  /**
   * Output log to console with formatting
   */
  private outputLog(entry: LogEntry): void {
    const levelName = LogLevel[entry.level];
    const contextStr = entry.context ? `[${entry.context}]` : '';
    const userStr = entry.userId ? `[User:${entry.userId}]` : '';
    const sessionStr = `[Session:${entry.sessionId?.slice(-8) || 'unknown'}]`;
    
    const prefix = `${entry.timestamp} ${levelName} ${contextStr}${userStr}${sessionStr}`;
    const message = `${prefix} ${entry.message}`;

    // Use appropriate console method based on level
    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(message, entry.data || '');
        break;
      case LogLevel.INFO:
        console.info(message, entry.data || '');
        break;
      case LogLevel.WARN:
        console.warn(message, entry.data || '');
        break;
      case LogLevel.ERROR:
        console.error(message, entry.data || '');
        break;
    }
  }

  /**
   * Send critical logs to external service (placeholder)
   */
  private sendToExternalService(entry: LogEntry): void {
    // TODO: Implement external logging service integration
    // Examples: Sentry, LogRocket, DataDog, etc.
    
    // For now, just ensure it's logged locally
    if (typeof window === 'undefined') {
      // Server-side: could send to logging service
      // console.error('EXTERNAL_LOG:', JSON.stringify(entry));
    }
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Create a scoped logger with specific context
   */
  createScopedLogger(context: string): ScopedLogger {
    return new ScopedLogger(this, context);
  }

  /**
   * Performance timing helper
   */
  time(label: string, context?: string): () => void {
    const startTime = performance.now();
    this.debug(`Timer started: ${label}`, { startTime }, context);
    
    return () => {
      const endTime = performance.now();
      const duration = endTime - startTime;
      this.info(`Timer finished: ${label}`, { 
        duration: `${duration.toFixed(2)}ms`,
        startTime,
        endTime 
      }, context);
    };
  }

  /**
   * Log API request/response
   */
  logApiCall(method: string, url: string, status?: number, duration?: number, context?: string): void {
    const level = status && status >= 400 ? LogLevel.ERROR : LogLevel.INFO;
    this.log(level, `API ${method} ${url}`, {
      method,
      url,
      status,
      duration: duration ? `${duration}ms` : undefined
    }, context || 'API');
  }

  /**
   * Log user action
   */
  logUserAction(action: string, details?: any, context?: string): void {
    this.info(`User action: ${action}`, details, context || 'USER_ACTION');
  }

  /**
   * Log business event
   */
  logBusinessEvent(event: string, data?: any, context?: string): void {
    this.info(`Business event: ${event}`, data, context || 'BUSINESS');
  }
}

/**
 * Scoped logger for specific contexts
 */
class ScopedLogger {
  constructor(private logger: Logger, private context: string) {}

  debug(message: string, data?: any): void {
    this.logger.debug(message, data, this.context);
  }

  info(message: string, data?: any): void {
    this.logger.info(message, data, this.context);
  }

  warn(message: string, data?: any): void {
    this.logger.warn(message, data, this.context);
  }

  error(message: string, error?: Error | any): void {
    this.logger.error(message, error, this.context);
  }

  time(label: string): () => void {
    return this.logger.time(label, this.context);
  }

  logApiCall(method: string, url: string, status?: number, duration?: number): void {
    this.logger.logApiCall(method, url, status, duration, this.context);
  }

  logUserAction(action: string, details?: any): void {
    this.logger.logUserAction(action, details, this.context);
  }

  logBusinessEvent(event: string, data?: any): void {
    this.logger.logBusinessEvent(event, data, this.context);
  }
}

// Export singleton instance
export const logger = Logger.getInstance();

// Export factory function for scoped loggers
export const createLogger = (context: string): ScopedLogger => {
  return logger.createScopedLogger(context);
};

// Convenience exports
export { Logger, ScopedLogger };
