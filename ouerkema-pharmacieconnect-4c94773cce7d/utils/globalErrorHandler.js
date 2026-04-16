/**
 * Global error handlers for uncaught exceptions and promise rejections
 */
import logger from './logger';

// Catch unhandled promise rejections
const unhandledRejectionHandler = (reason, promise) => {
  logger.error('UnhandledRejection', 'Unhandled Promise Rejection', {
    reason,
    promise,
  });
};

// Catch uncaught exceptions in async context
const uncaughtExceptionHandler = (error) => {
  logger.error('UncaughtException', 'Uncaught Exception', error);
};

export const setupGlobalErrorHandlers = () => {
  if (global.originalPromise) {
    return; // Already set up
  }

  // Store original promise for cleanup if needed
  global.originalPromise = Promise;

  // Handle unhandled rejections
  if (require('react-native').Platform.OS === 'web') {
    window.addEventListener('unhandledrejection', (event) => {
      unhandledRejectionHandler(event.reason, event.promise);
    });
  }

  // For native, we can use a more direct approach if needed
};

export default {
  setupGlobalErrorHandlers,
};
