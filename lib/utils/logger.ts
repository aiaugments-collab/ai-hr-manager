/**
 * Simple Logger System - Use as functions directly
 * Works on both client and server side
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
}

// Internal logger instance
class InternalLogger {
  private logLevel: LogLevel;
  private isProduction: boolean;

  constructor() {
    this.isProduction = process.env.NODE_ENV === 'production';
    this.logLevel = this.isProduction ? LogLevel.WARN : LogLevel.DEBUG;
  }

  setLogLevel(level: LogLevel): void {
    this.logLevel = level;
  }

  log(level: LogLevel, message: string, data?: any, context?: string): void {
    // Skip if log level is too low
    if (level < this.logLevel) {
      return;
    }

    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      data,
      context
    };

    this.outputLog(logEntry);
  }

  private outputLog(entry: LogEntry): void {
    const levelName = LogLevel[entry.level];
    const contextStr = entry.context ? `[${entry.context}]` : '';
    const prefix = `${entry.timestamp} ${levelName} ${contextStr}`;
    const message = `${prefix} ${entry.message}`;

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
}

// Create singleton instance
const internalLogger = new InternalLogger();

// Export simple function-based API
export const logger = {
  /**
   * Debug level logging
   */
  debug: (message: string, data?: any, context?: string): void => {
    internalLogger.log(LogLevel.DEBUG, message, data, context);
  },

  /**
   * Info level logging
   */
  info: (message: string, data?: any, context?: string): void => {
    internalLogger.log(LogLevel.INFO, message, data, context);
  },

  /**
   * Warning level logging
   */
  warn: (message: string, data?: any, context?: string): void => {
    internalLogger.log(LogLevel.WARN, message, data, context);
  },

  /**
   * Error level logging
   */
  error: (message: string, error?: Error | any, context?: string): void => {
    const errorData = error instanceof Error ? {
      name: error.name,
      message: error.message,
      stack: error.stack
    } : error;
    
    internalLogger.log(LogLevel.ERROR, message, errorData, context);
  },

  /**
   * Set log level
   */
  setLogLevel: (level: LogLevel): void => {
    internalLogger.setLogLevel(level);
  },

  /**
   * Performance timing helper
   */
  time: (label: string, context?: string): (() => void) => {
    const startTime = performance.now();
    logger.debug(`Timer started: ${label}`, { startTime }, context);
    
    return () => {
      const endTime = performance.now();
      const duration = endTime - startTime;
      logger.info(`Timer finished: ${label}`, { 
        duration: `${duration.toFixed(2)}ms`,
        startTime,
        endTime 
      }, context);
    };
  },

  /**
   * Log API request/response
   */
  logApiCall: (method: string, url: string, status?: number, duration?: number, context?: string): void => {
    const level = status && status >= 400 ? LogLevel.ERROR : LogLevel.INFO;
    internalLogger.log(level, `API ${method} ${url}`, {
      method,
      url,
      status,
      duration: duration ? `${duration}ms` : undefined
    }, context || 'API');
  },

  /**
   * Log user action
   */
  logUserAction: (action: string, details?: any, context?: string): void => {
    logger.info(`User action: ${action}`, details, context || 'USER_ACTION');
  },

  /**
   * Log business event
   */
  logBusinessEvent: (event: string, data?: any, context?: string): void => {
    logger.info(`Business event: ${event}`, data, context || 'BUSINESS');
  }
};

// LogLevel is already exported above
