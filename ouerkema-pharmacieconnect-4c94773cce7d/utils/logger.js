/**
 * Centralized Logger Utility
 * Provides consistent log formatting with level support and environment awareness
 */

const LOG_LEVELS = {
  DEBUG: 'DEBUG',
  INFO: 'INFO',
  WARN: 'WARN',
  ERROR: 'ERROR',
};

// Check if running in production
const isProduction = process.env.NODE_ENV === 'production';

/**
 * Format log message with timestamp, level, and prefix
 * @param {string} level - Log level (DEBUG, INFO, WARN, ERROR)
 * @param {string} prefix - Component or module name
 * @param {string} message - Log message
 * @param {any} data - Optional additional data
 * @returns {string} Formatted log message
 */
const formatLog = (level, prefix, message, data) => {
  const timestamp = new Date().toISOString();
  const levelStr = `[${level}]`.padEnd(8);
  const prefixStr = `[${prefix}]`.padEnd(20);

  if (data !== undefined) {
    return `${timestamp} ${levelStr} ${prefixStr} ${message}`;
  }
  return `${timestamp} ${levelStr} ${prefixStr} ${message}`;
};

/**
 * Logger object with methods for each log level
 */
const logger = {
  /**
   * Log debug message
   * @param {string} prefix - Component or module name
   * @param {string} message - Log message
   * @param {any} data - Optional additional data to log
   */
  debug: (prefix, message, data) => {
    if (isProduction) return;
    const formatted = formatLog(LOG_LEVELS.DEBUG, prefix, message);
    if (data !== undefined) {
      console.debug(formatted, data);
    } else {
      console.debug(formatted);
    }
  },

  /**
   * Log info message
   * @param {string} prefix - Component or module name
   * @param {string} message - Log message
   * @param {any} data - Optional additional data to log
   */
  info: (prefix, message, data) => {
    if (isProduction) return;
    const formatted = formatLog(LOG_LEVELS.INFO, prefix, message);
    if (data !== undefined) {
      console.info(formatted, data);
    } else {
      console.info(formatted);
    }
  },

  /**
   * Log warning message (shown in all environments)
   * @param {string} prefix - Component or module name
   * @param {string} message - Log message
   * @param {any} data - Optional additional data to log
   */
  warn: (prefix, message, data) => {
    const formatted = formatLog(LOG_LEVELS.WARN, prefix, message);
    if (data !== undefined) {
      console.warn(formatted, data);
    } else {
      console.warn(formatted);
    }
  },

  /**
   * Log error message (shown in all environments)
   * @param {string} prefix - Component or module name
   * @param {string} message - Log message
   * @param {any} error - Optional error object
   */
  error: (prefix, message, error) => {
    const formatted = formatLog(LOG_LEVELS.ERROR, prefix, message);
    if (error !== undefined) {
      console.error(formatted, error);
    } else {
      console.error(formatted);
    }
  },

  /**
   * Get current log level configuration
   * @returns {object} Current logger config
   */
  getConfig: () => ({
    isProduction,
    logLevels: LOG_LEVELS,
  }),
};

export default logger;
