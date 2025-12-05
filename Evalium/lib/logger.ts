/**
 * L-1: Centralized logging utility for Evalium
 * 
 * Provides structured logging that can be easily swapped for a real logging
 * service (e.g., Datadog, Sentry, LogRocket) in production.
 * 
 * Features:
 * - Suppresses debug logs in production
 * - Consistent log format with [Evalium] prefix
 * - Type-safe metadata support
 * - Works on both client and server
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogMeta {
  [key: string]: unknown;
}

const isProd = process.env.NODE_ENV === 'production';

/**
 * Formats the log payload for consistent output
 */
function formatPayload(message: string, meta?: LogMeta): string | object {
  if (meta && Object.keys(meta).length > 0) {
    return { message, ...meta };
  }
  return message;
}

/**
 * Core logging function
 */
function log(level: LogLevel, message: string, meta?: LogMeta): void {
  const timestamp = new Date().toISOString();
  const prefix = `[Evalium][${timestamp}]`;
  const payload = formatPayload(message, meta);

  switch (level) {
    case 'error':
      // Always log errors
      console.error(prefix, 'ERROR', payload);
      break;
    case 'warn':
      // Always log warnings
      console.warn(prefix, 'WARN', payload);
      break;
    case 'info':
      // Log info in all environments
      console.log(prefix, 'INFO', payload);
      break;
    case 'debug':
      // Suppress debug logs in production
      if (!isProd) {
        console.log(prefix, 'DEBUG', payload);
      }
      break;
  }
}

/**
 * Logger interface for application-wide use
 */
export const logger = {
  /**
   * Debug level - suppressed in production
   * Use for development-only information
   */
  debug: (message: string, meta?: LogMeta): void => log('debug', message, meta),

  /**
   * Info level - always logged
   * Use for important operational events
   */
  info: (message: string, meta?: LogMeta): void => log('info', message, meta),

  /**
   * Warn level - always logged
   * Use for potentially problematic situations
   */
  warn: (message: string, meta?: LogMeta): void => log('warn', message, meta),

  /**
   * Error level - always logged
   * Use for errors that need attention
   */
  error: (message: string, meta?: LogMeta): void => log('error', message, meta),
};

/**
 * Type-safe helper for logging errors with stack traces
 * Extracts safe error information without exposing sensitive details
 */
export function logError(message: string, error: unknown): void {
  const errorMeta: LogMeta = {};

  if (error instanceof Error) {
    errorMeta.errorName = error.name;
    errorMeta.errorMessage = error.message;
    // Only include stack in non-production
    if (!isProd) {
      errorMeta.stack = error.stack;
    }
  } else if (typeof error === 'string') {
    errorMeta.errorMessage = error;
  } else {
    errorMeta.errorType = typeof error;
  }

  logger.error(message, errorMeta);
}

export default logger;


