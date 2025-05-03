import { useState, useCallback } from 'react';
import axios, { AxiosError } from 'axios';

type ErrorState = {
  message: string;
  status?: number;
  isError: boolean;
};

const defaultErrorState: ErrorState = {
  message: '',
  status: undefined,
  isError: false,
};

/**
 * A custom hook for standardized error handling in API calls
 * @returns {Object} Error handling utilities
 */
export function useErrorHandler() {
  const [error, setError] = useState<ErrorState>(defaultErrorState);

  /**
   * Handle API errors in a consistent way
   * @param error The error object, typically from axios
   * @param customMessage Optional custom message to display
   */
  const handleError = useCallback((err: unknown, customMessage?: string) => {
    // Reset to default first
    setError(defaultErrorState);

    if (axios.isAxiosError(err)) {
      const status = err.response?.status;
      
      // Handle different types of errors
      if (status === 404) {
        // For 404, we don't necessarily want to show an error to the user
        // Often this just means "no data" rather than a true error
        console.warn('Resource not found:', err.config?.url);
        setError({
          message: customMessage || 'The requested data could not be found',
          status: 404,
          isError: false // Not treating 404 as an error that should disrupt UI
        });
      } else if (status === 401 || status === 403) {
        setError({
          message: 'You don\'t have permission to access this resource',
          status,
          isError: true
        });
      } else if (status && status >= 500) {
        setError({
          message: 'A server error occurred. Please try again later.',
          status,
          isError: true
        });
      } else {
        setError({
          message: customMessage || err.message || 'An unexpected error occurred',
          status,
          isError: true
        });
      }
    } else if (err instanceof Error) {
      setError({
        message: customMessage || err.message || 'An unexpected error occurred',
        isError: true
      });
    } else {
      setError({
        message: customMessage || 'An unknown error occurred',
        isError: true
      });
    }
  }, []);

  /**
   * Clear any existing error state
   */
  const clearError = useCallback(() => {
    setError(defaultErrorState);
  }, []);

  return {
    error,
    handleError,
    clearError,
    // Helper shorthand for checking if there's a real error (not just a 404)
    hasError: error.isError
  };
}

export default useErrorHandler; 