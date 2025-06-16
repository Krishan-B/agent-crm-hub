
import { useState, useCallback } from 'react';

interface UseRetryOptions {
  maxAttempts?: number;
  delay?: number;
  backoff?: boolean;
}

interface RetryState {
  isRetrying: boolean;
  attemptCount: number;
  error: Error | null;
}

export const useRetry = (options: UseRetryOptions = {}) => {
  const { maxAttempts = 3, delay = 1000, backoff = true } = options;
  
  const [state, setState] = useState<RetryState>({
    isRetrying: false,
    attemptCount: 0,
    error: null
  });

  const retry = useCallback(async <T>(
    operation: () => Promise<T>,
    customMaxAttempts?: number
  ): Promise<T> => {
    const attempts = customMaxAttempts || maxAttempts;
    let lastError: Error;

    setState(prev => ({ ...prev, isRetrying: true, error: null }));

    for (let attempt = 1; attempt <= attempts; attempt++) {
      try {
        setState(prev => ({ ...prev, attemptCount: attempt }));
        const result = await operation();
        
        setState({ isRetrying: false, attemptCount: 0, error: null });
        return result;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        if (attempt === attempts) {
          setState(prev => ({ ...prev, isRetrying: false, error: lastError }));
          throw lastError;
        }

        // Calculate delay with optional backoff
        const currentDelay = backoff ? delay * Math.pow(2, attempt - 1) : delay;
        await new Promise(resolve => setTimeout(resolve, currentDelay));
      }
    }

    throw lastError!;
  }, [maxAttempts, delay, backoff]);

  const reset = useCallback(() => {
    setState({ isRetrying: false, attemptCount: 0, error: null });
  }, []);

  return {
    retry,
    reset,
    isRetrying: state.isRetrying,
    attemptCount: state.attemptCount,
    error: state.error
  };
};
