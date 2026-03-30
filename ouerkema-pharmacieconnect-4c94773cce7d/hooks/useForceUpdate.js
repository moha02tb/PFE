import { useState, useCallback } from 'react';

// Custom hook to force component re-renders for instant RTL updates
export const useForceUpdate = () => {
  const [, setUpdateCount] = useState(0);

  const forceUpdate = useCallback(() => {
    setUpdateCount(count => count + 1);
  }, []);

  return forceUpdate;
};

export default useForceUpdate;
