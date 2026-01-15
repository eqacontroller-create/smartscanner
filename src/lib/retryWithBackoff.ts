/**
 * Retry utility with exponential backoff for Edge Function calls
 */

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

interface RetryOptions {
  retries?: number;
  initialDelay?: number;
  maxDelay?: number;
  factor?: number;
}

/**
 * Executes a function with exponential backoff retry logic
 * @param fn - The async function to execute
 * @param options - Retry configuration
 * @returns The result of the function
 * @throws The last error if all retries fail
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    retries = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    factor = 2,
  } = options;

  let lastError: Error | null = null;
  let currentDelay = initialDelay;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (attempt < retries) {
        await delay(currentDelay);
        currentDelay = Math.min(currentDelay * factor, maxDelay);
      }
    }
  }

  throw lastError;
}

export default retryWithBackoff;
