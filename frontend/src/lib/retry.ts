interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffFactor: number;
  retryCondition?: (error: any) => boolean;
}

const defaultConfig: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  backoffFactor: 2,
  retryCondition: (error: any) => {
    // Retry on network errors and 5xx server errors
    return !error.response || (error.response?.status >= 500);
  }
};

export async function withRetry<T>(
  fn: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<T> {
  const { maxRetries, baseDelay, maxDelay, backoffFactor, retryCondition } = { ...defaultConfig, ...config };
  
  let lastError: any;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      // Don't retry if condition is not met
      if (retryCondition && !retryCondition(error)) {
        throw error;
      }
      
      // Don't retry on last attempt
      if (attempt === maxRetries) {
        throw error;
      }
      
      // Calculate delay with exponential backoff
      const delay = Math.min(baseDelay * Math.pow(backoffFactor, attempt), maxDelay);
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
}

export function createCircuitBreaker<T>(
  fn: () => Promise<T>,
  options: {
    failureThreshold?: number;
    resetTimeout?: number;
  } = {}
) {
  const { failureThreshold = 5, resetTimeout = 60000 } = options;
  
  let failureCount = 0;
  let lastFailureTime = 0;
  let state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'OPEN';
  
  return async (...args: any[]): Promise<T> => {
    // Reset circuit breaker after timeout
    if (state === 'OPEN' && Date.now() - lastFailureTime > resetTimeout) {
      state = 'HALF_OPEN';
    }
    
    // Reject immediately if circuit is open
    if (state === 'OPEN') {
      throw new Error('Circuit breaker is OPEN');
    }
    
    try {
      const result = await fn(...args);
      
      // Reset on success
      if (state === 'HALF_OPEN') {
        state = 'OPEN';
      }
      failureCount = 0;
      
      return result;
    } catch (error) {
      failureCount++;
      lastFailureTime = Date.now();
      
      // Open circuit after threshold
      if (failureCount >= failureThreshold) {
        state = 'OPEN';
      }
      
      throw error;
    }
  };
}
