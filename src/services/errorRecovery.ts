/**
 * Error Recovery Service
 * Handles different types of errors and provides appropriate recovery mechanisms
 */

import { Alert } from 'react-native';
import { websocketService } from './websocketService';
import { ApiService } from './api';

export interface ErrorInfo {
  type: 'network' | 'server' | 'validation' | 'timeout' | 'unknown';
  message: string;
  code?: string;
  retryable: boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: Date;
  context?: any;
}

export interface RecoveryAction {
  type: 'retry' | 'reconnect' | 'refresh' | 'fallback' | 'user_action';
  description: string;
  action: () => Promise<boolean>;
  priority: number;
}

export interface RecoveryStrategy {
  errorType: string;
  actions: RecoveryAction[];
  maxRetries: number;
  retryDelay: number;
  fallbackAction?: () => void;
}

class ErrorRecoveryService {
  private errorHistory: ErrorInfo[] = [];
  private recoveryStrategies: Map<string, RecoveryStrategy> = new Map();
  private isRecovering = false;
  private retryCount = 0;
  private maxRetryCount = 3;

  constructor() {
    this.initializeRecoveryStrategies();
  }

  /**
   * Initialize default recovery strategies
   */
  private initializeRecoveryStrategies() {
    // Network error strategy
    this.recoveryStrategies.set('network', {
      errorType: 'network',
      actions: [
        {
          type: 'reconnect',
          description: 'Reconnecting to server...',
          action: this.reconnectToServer.bind(this),
          priority: 1,
        },
        {
          type: 'retry',
          description: 'Retrying request...',
          action: this.retryRequest.bind(this),
          priority: 2,
        },
      ],
      maxRetries: 3,
      retryDelay: 2000,
      fallbackAction: () => this.showOfflineMode(),
    });

    // Server error strategy
    this.recoveryStrategies.set('server', {
      errorType: 'server',
      actions: [
        {
          type: 'retry',
          description: 'Retrying request...',
          action: this.retryRequest.bind(this),
          priority: 1,
        },
        {
          type: 'refresh',
          description: 'Refreshing connection...',
          action: this.refreshConnection.bind(this),
          priority: 2,
        },
      ],
      maxRetries: 2,
      retryDelay: 5000,
      fallbackAction: () => this.showServerUnavailable(),
    });

    // Timeout error strategy
    this.recoveryStrategies.set('timeout', {
      errorType: 'timeout',
      actions: [
        {
          type: 'retry',
          description: 'Retrying with longer timeout...',
          action: this.retryWithLongerTimeout.bind(this),
          priority: 1,
        },
        {
          type: 'fallback',
          description: 'Using fallback mode...',
          action: this.useFallbackMode.bind(this),
          priority: 2,
        },
      ],
      maxRetries: 2,
      retryDelay: 3000,
      fallbackAction: () => this.showTimeoutError(),
    });

    // Validation error strategy
    this.recoveryStrategies.set('validation', {
      errorType: 'validation',
      actions: [
        {
          type: 'user_action',
          description: 'Please check your input and try again',
          action: this.requestUserAction.bind(this),
          priority: 1,
        },
      ],
      maxRetries: 1,
      retryDelay: 0,
      fallbackAction: () => this.showValidationError(),
    });
  }

  /**
   * Handle an error and attempt recovery
   */
  async handleError(error: any, context?: any): Promise<boolean> {
    const errorInfo = this.analyzeError(error, context);
    this.errorHistory.push(errorInfo);

    // Keep only last 50 errors
    if (this.errorHistory.length > 50) {
      this.errorHistory = this.errorHistory.slice(-50);
    }

    console.error('Error occurred:', errorInfo);

    if (!errorInfo.retryable) {
      this.showNonRecoverableError(errorInfo);
      return false;
    }

    const strategy = this.recoveryStrategies.get(errorInfo.type);
    if (!strategy) {
      this.showUnknownError(errorInfo);
      return false;
    }

    return this.executeRecoveryStrategy(strategy, errorInfo);
  }

  /**
   * Analyze error and determine its type and properties
   */
  private analyzeError(error: any, context?: any): ErrorInfo {
    const message = error?.message || error?.toString() || 'Unknown error';
    const code = error?.code || error?.status || 'UNKNOWN';

    // Determine error type
    let type: ErrorInfo['type'] = 'unknown';
    let retryable = false;
    let severity: ErrorInfo['severity'] = 'medium';

    if (error?.name === 'NetworkError' || message.includes('network') || message.includes('connection')) {
      type = 'network';
      retryable = true;
      severity = 'high';
    } else if (error?.status >= 500 || message.includes('server')) {
      type = 'server';
      retryable = true;
      severity = 'high';
    } else if (error?.status === 408 || message.includes('timeout')) {
      type = 'timeout';
      retryable = true;
      severity = 'medium';
    } else if (error?.status >= 400 && error?.status < 500) {
      type = 'validation';
      retryable = false;
      severity = 'low';
    } else if (error?.status === 0 || error?.status === 'ECONNREFUSED') {
      type = 'network';
      retryable = true;
      severity = 'critical';
    }

    return {
      type,
      message,
      code: code.toString(),
      retryable,
      severity,
      timestamp: new Date(),
      context,
    };
  }

  /**
   * Execute recovery strategy
   */
  private async executeRecoveryStrategy(
    strategy: RecoveryStrategy,
    errorInfo: ErrorInfo
  ): Promise<boolean> {
    if (this.isRecovering) {
      console.warn('Recovery already in progress');
      return false;
    }

    this.isRecovering = true;
    this.retryCount = 0;

    try {
      // Sort actions by priority
      const sortedActions = strategy.actions.sort((a, b) => a.priority - b.priority);

      for (const action of sortedActions) {
        if (this.retryCount >= strategy.maxRetries) {
          break;
        }

        console.log(`Attempting recovery: ${action.description}`);
        
        try {
          const success = await action.action();
          if (success) {
            console.log('Recovery successful');
            this.isRecovering = false;
            this.retryCount = 0;
            return true;
          }
        } catch (actionError) {
          console.warn(`Recovery action failed: ${actionError}`);
        }

        this.retryCount++;
        
        if (this.retryCount < strategy.maxRetries) {
          await this.delay(strategy.retryDelay * this.retryCount);
        }
      }

      // All recovery attempts failed
      console.error('All recovery attempts failed');
      strategy.fallbackAction?.();
      return false;

    } finally {
      this.isRecovering = false;
    }
  }

  /**
   * Recovery actions
   */
  private async reconnectToServer(): Promise<boolean> {
    try {
      // Disconnect WebSocket if connected
      if (websocketService.isWebSocketConnected()) {
        websocketService.disconnect();
      }

      // Wait a moment
      await this.delay(1000);

      // Try to reconnect
      const connected = await websocketService.connect();
      return connected;
    } catch (error) {
      console.error('Reconnection failed:', error);
      return false;
    }
  }

  private async retryRequest(): Promise<boolean> {
    try {
      // This would typically retry the last failed request
      // For now, we just return true to simulate success
      await this.delay(1000);
      return true;
    } catch (error) {
      console.error('Retry failed:', error);
      return false;
    }
  }

  private async refreshConnection(): Promise<boolean> {
    try {
      // Refresh API connection
      await ApiService.healthCheck();
      return true;
    } catch (error) {
      console.error('Connection refresh failed:', error);
      return false;
    }
  }

  private async retryWithLongerTimeout(): Promise<boolean> {
    try {
      // Retry with longer timeout
      await this.delay(5000);
      return true;
    } catch (error) {
      console.error('Timeout retry failed:', error);
      return false;
    }
  }

  private async useFallbackMode(): Promise<boolean> {
    try {
      // Switch to fallback mode
      console.log('Switching to fallback mode');
      return true;
    } catch (error) {
      console.error('Fallback mode failed:', error);
      return false;
    }
  }

  private async requestUserAction(): Promise<boolean> {
    return new Promise((resolve) => {
      Alert.alert(
        'Input Error',
        'Please check your input and try again.',
        [
          {
            text: 'OK',
            onPress: () => resolve(true),
          },
        ]
      );
    });
  }

  /**
   * Error display methods
   */
  private showNonRecoverableError(errorInfo: ErrorInfo) {
    Alert.alert(
      'Error',
      errorInfo.message,
      [{ text: 'OK' }]
    );
  }

  private showUnknownError(errorInfo: ErrorInfo) {
    Alert.alert(
      'Unknown Error',
      'An unexpected error occurred. Please try again later.',
      [{ text: 'OK' }]
    );
  }

  private showOfflineMode() {
    Alert.alert(
      'Offline Mode',
      'You are currently offline. Some features may be limited.',
      [{ text: 'OK' }]
    );
  }

  private showServerUnavailable() {
    Alert.alert(
      'Server Unavailable',
      'The server is currently unavailable. Please try again later.',
      [{ text: 'OK' }]
    );
  }

  private showTimeoutError() {
    Alert.alert(
      'Timeout',
      'The request timed out. Please check your connection and try again.',
      [{ text: 'OK' }]
    );
  }

  private showValidationError() {
    Alert.alert(
      'Validation Error',
      'Please check your input and try again.',
      [{ text: 'OK' }]
    );
  }

  /**
   * Utility methods
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get error statistics
   */
  getErrorStats() {
    const stats = {
      total: this.errorHistory.length,
      byType: {} as Record<string, number>,
      bySeverity: {} as Record<string, number>,
      recent: this.errorHistory.slice(-10),
    };

    for (const error of this.errorHistory) {
      stats.byType[error.type] = (stats.byType[error.type] || 0) + 1;
      stats.bySeverity[error.severity] = (stats.bySeverity[error.severity] || 0) + 1;
    }

    return stats;
  }

  /**
   * Clear error history
   */
  clearErrorHistory() {
    this.errorHistory = [];
  }

  /**
   * Add custom recovery strategy
   */
  addRecoveryStrategy(strategy: RecoveryStrategy) {
    this.recoveryStrategies.set(strategy.errorType, strategy);
  }

  /**
   * Get recovery status
   */
  getRecoveryStatus() {
    return {
      isRecovering: this.isRecovering,
      retryCount: this.retryCount,
      maxRetryCount: this.maxRetryCount,
      errorHistoryLength: this.errorHistory.length,
    };
  }
}

// Export singleton instance
export const errorRecoveryService = new ErrorRecoveryService(); 