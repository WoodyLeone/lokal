/**
 * Error Recovery System for Network Issues
 * Provides better error handling and recovery mechanisms
 */

export interface NetworkError {
  type: 'timeout' | 'connection' | 'server' | 'unknown';
  message: string;
  retryable: boolean;
  suggestedAction: string;
}

export interface ErrorRecoveryOptions {
  maxRetries: number;
  retryDelay: number;
  exponentialBackoff: boolean;
}

export class ErrorRecoveryService {
  private static instance: ErrorRecoveryService;
  private retryCount: Map<string, number> = new Map();
  
  static getInstance(): ErrorRecoveryService {
    if (!ErrorRecoveryService.instance) {
      ErrorRecoveryService.instance = new ErrorRecoveryService();
    }
    return ErrorRecoveryService.instance;
  }
  
  /**
   * Analyze network error and provide recovery suggestions
   */
  analyzeError(error: any): NetworkError {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    // Timeout errors
    if (errorMessage.includes('timeout') || errorMessage.includes('AbortError')) {
      return {
        type: 'timeout',
        message: 'Request timed out - server is taking too long to respond',
        retryable: true,
        suggestedAction: 'Try again in a few seconds'
      };
    }
    
    // Connection errors
    if (errorMessage.includes('Network request failed') || 
        errorMessage.includes('fetch') ||
        errorMessage.includes('connection')) {
      return {
        type: 'connection',
        message: 'Cannot connect to server - check your internet connection',
        retryable: true,
        suggestedAction: 'Check your internet connection and try again'
      };
    }
    
    // Server errors (5xx)
    if (errorMessage.includes('500') || errorMessage.includes('502') || errorMessage.includes('503')) {
      return {
        type: 'server',
        message: 'Server is experiencing issues',
        retryable: true,
        suggestedAction: 'Try again in a few minutes'
      };
    }
    
    // Client errors (4xx)
    if (errorMessage.includes('404') || errorMessage.includes('400') || errorMessage.includes('403')) {
      return {
        type: 'server',
        message: 'Request was invalid or resource not found',
        retryable: false,
        suggestedAction: 'Check your request and try again'
      };
    }
    
    // Unknown errors
    return {
      type: 'unknown',
      message: 'An unexpected error occurred',
      retryable: true,
      suggestedAction: 'Try again or contact support'
    };
  }
  
  /**
   * Check if an operation should be retried
   */
  shouldRetry(operationId: string, error: NetworkError, options: ErrorRecoveryOptions): boolean {
    if (!error.retryable) {
      return false;
    }
    
    const currentRetries = this.retryCount.get(operationId) || 0;
    if (currentRetries >= options.maxRetries) {
      return false;
    }
    
    return true;
  }
  
  /**
   * Calculate retry delay with exponential backoff
   */
  getRetryDelay(operationId: string, options: ErrorRecoveryOptions): number {
    const currentRetries = this.retryCount.get(operationId) || 0;
    
    if (options.exponentialBackoff) {
      return options.retryDelay * Math.pow(2, currentRetries);
    }
    
    return options.retryDelay;
  }
  
  /**
   * Increment retry count for an operation
   */
  incrementRetryCount(operationId: string): void {
    const currentCount = this.retryCount.get(operationId) || 0;
    this.retryCount.set(operationId, currentCount + 1);
  }
  
  /**
   * Reset retry count for an operation
   */
  resetRetryCount(operationId: string): void {
    this.retryCount.delete(operationId);
  }
  
  /**
   * Get user-friendly error message
   */
  getUserFriendlyMessage(error: NetworkError): string {
    switch (error.type) {
      case 'timeout':
        return 'The server is taking longer than expected to respond. Please try again.';
      case 'connection':
        return 'Unable to connect to the server. Please check your internet connection.';
      case 'server':
        return 'The server is currently experiencing issues. Please try again later.';
      case 'unknown':
        return 'Something went wrong. Please try again or contact support.';
      default:
        return 'An error occurred. Please try again.';
    }
  }
  
  /**
   * Get recovery action for the user
   */
  getRecoveryAction(error: NetworkError): string {
    return error.suggestedAction;
  }
  
  /**
   * Log error for debugging
   */
  logError(operationId: string, error: any, networkError: NetworkError): void {
    console.error(`🔴 Error Recovery - Operation: ${operationId}`);
    console.error(`📊 Error Type: ${networkError.type}`);
    console.error(`💬 Message: ${networkError.message}`);
    console.error(`🔄 Retryable: ${networkError.retryable}`);
    console.error(`💡 Suggested Action: ${networkError.suggestedAction}`);
    console.error(`📝 Original Error:`, error);
  }
}

// Export singleton instance
export const errorRecovery = ErrorRecoveryService.getInstance(); 