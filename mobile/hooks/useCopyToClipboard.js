import { useCallback } from 'react';
import * as Clipboard from 'expo-clipboard';
import logger from '../utils/logger';

export const useCopyToClipboard = (onSuccess, onError) => {
  const copyToClipboard = useCallback(
    async (text) => {
      try {
        await Clipboard.setStringAsync(text);
        if (onSuccess) {
          onSuccess();
        }
      } catch (error) {
        logger.error('useCopyToClipboard', 'Error copying to clipboard', error);
        if (onError) {
          onError(error);
        }
      }
    },
    [onSuccess, onError]
  );

  return { copyToClipboard };
};
