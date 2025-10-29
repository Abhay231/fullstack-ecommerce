import { useEffect, useRef } from 'react';

// Hook to prevent state updates on unmounted components
export const useIsMounted = () => {
  const isMounted = useRef(true);
  
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);
  
  return isMounted;
};

// Hook for safe async operations
export const useSafeAsync = () => {
  const isMounted = useIsMounted();
  
  const safeAsync = (asyncFunction) => {
    return async (...args) => {
      if (isMounted.current) {
        try {
          const result = await asyncFunction(...args);
          return result;
        } catch (error) {
          if (isMounted.current) {
            throw error;
          }
        }
      }
    };
  };
  
  return safeAsync;
};
