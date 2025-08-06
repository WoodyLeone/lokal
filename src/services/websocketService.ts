/**
 * Frontend WebSocket Service
 * Handles real-time communication with the backend for live updates and progress tracking
 */

import { getBackendUrl } from '../config/env';

export interface WebSocketMessage {
  type: string;
  videoId?: string;
  data?: any;
  timestamp: string;
}

export interface ProgressData {
  status: string;
  progress: number;
  message?: string;
  timestamp: string;
  startTime?: number;
}

export interface ProcessingEstimate {
  elapsed: number;
  estimatedTotal: number;
  remaining: number;
  progress: number;
  timestamp: number;
}

export interface LiveStats {
  activeVideos: number;
  totalClients: number;
  messagesSent: number;
  lastUpdate: string;
}

export interface WebSocketEventHandlers {
  onConnection?: (clientId: string, serverInfo: any) => void;
  onDisconnection?: () => void;
  onProgressUpdate?: (videoId: string, progress: ProgressData) => void;
  onDetectionResults?: (videoId: string, results: any) => void;
  onProductMatches?: (videoId: string, matches: any) => void;
  onError?: (videoId: string, error: any) => void;
  onLiveStats?: (stats: LiveStats) => void;
  onStatusResponse?: (videoId: string, status: any) => void;
  onSubscriptionConfirmed?: (videoId: string) => void;
  onUnsubscriptionConfirmed?: (videoId: string) => void;
}

class WebSocketService {
  private ws: WebSocket | null = null;
  private clientId: string | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private pingInterval: NodeJS.Timeout | null = null;
  private eventHandlers: WebSocketEventHandlers = {};
  private subscriptions = new Set<string>();
  private isConnecting = false;
  private isConnected = false;

  /**
   * Initialize WebSocket connection
   */
  async connect(handlers: WebSocketEventHandlers = {}): Promise<boolean> {
    if (this.isConnecting || this.isConnected) {
      return this.isConnected;
    }

    this.eventHandlers = handlers;
    this.isConnecting = true;

    try {
      const backendUrl = await getBackendUrl();
      const wsUrl = backendUrl.replace('http', 'ws') + '/ws';
      
      this.ws = new WebSocket(wsUrl);
      
      this.ws.onopen = () => {
        this.handleOpen();
      };
      
      this.ws.onmessage = (event) => {
        this.handleMessage(event);
      };
      
      this.ws.onclose = () => {
        this.handleClose();
      };
      
      this.ws.onerror = (error) => {
        this.handleError(error);
      };

      return true;
    } catch (error) {
      console.error('Failed to connect to WebSocket:', error);
      this.isConnecting = false;
      return false;
    }
  }

  /**
   * Handle WebSocket open event
   */
  private handleOpen() {
    console.log('WebSocket connected');
    this.isConnecting = false;
    this.isConnected = true;
    this.reconnectAttempts = 0;
    
    // Start ping interval
    this.startPingInterval();
    
    // Resubscribe to previous subscriptions
    this.resubscribeToVideos();
    
    if (this.eventHandlers.onConnection) {
      this.eventHandlers.onConnection(this.clientId || '', {});
    }
  }

  /**
   * Handle WebSocket message event
   */
  private handleMessage(event: MessageEvent) {
    try {
      const message: WebSocketMessage = JSON.parse(event.data);
      console.debug('WebSocket message received:', message.type);
      
      switch (message.type) {
        case 'connection':
          this.clientId = message.data?.clientId;
          if (this.eventHandlers.onConnection) {
            this.eventHandlers.onConnection(this.clientId || '', message.data?.serverInfo || {});
          }
          break;
          
        case 'pipeline_status':
        case 'progress_update':
          if (message.videoId && message.data) {
            if (this.eventHandlers.onProgressUpdate) {
              this.eventHandlers.onProgressUpdate(message.videoId, message.data);
            }
          }
          break;
          
        case 'detection_results':
          if (message.videoId && message.data && this.eventHandlers.onDetectionResults) {
            this.eventHandlers.onDetectionResults(message.videoId, message.data);
          }
          break;
          
        case 'product_matches':
          if (message.videoId && message.data && this.eventHandlers.onProductMatches) {
            this.eventHandlers.onProductMatches(message.videoId, message.data);
          }
          break;
          
        case 'error':
          if (message.videoId && message.data && this.eventHandlers.onError) {
            this.eventHandlers.onError(message.videoId, message.data);
          }
          break;
          
        case 'live_stats':
          if (message.data && this.eventHandlers.onLiveStats) {
            this.eventHandlers.onLiveStats(message.data);
          }
          break;
          
        case 'status_response':
          if (message.videoId && message.data && this.eventHandlers.onStatusResponse) {
            this.eventHandlers.onStatusResponse(message.videoId, message.data);
          }
          break;
          
        case 'subscription_confirmed':
          if (message.videoId && this.eventHandlers.onSubscriptionConfirmed) {
            this.eventHandlers.onSubscriptionConfirmed(message.videoId);
          }
          break;
          
        case 'unsubscription_confirmed':
          if (message.videoId && this.eventHandlers.onUnsubscriptionConfirmed) {
            this.eventHandlers.onUnsubscriptionConfirmed(message.videoId);
          }
          break;
          
        case 'pong':
          // Handle pong response
          break;
          
        default:
          console.warn('Unknown WebSocket message type:', message.type);
      }
    } catch (error) {
      console.error('Failed to parse WebSocket message:', error);
    }
  }

  /**
   * Handle WebSocket close event
   */
  private handleClose() {
    console.log('WebSocket disconnected');
    this.isConnected = false;
    this.stopPingInterval();
    
    if (this.eventHandlers.onDisconnection) {
      this.eventHandlers.onDisconnection();
    }
    
    // Attempt to reconnect
    this.attemptReconnect();
  }

  /**
   * Handle WebSocket error event
   */
  private handleError(error: Event) {
    console.error('WebSocket error:', error);
  }

  /**
   * Attempt to reconnect to WebSocket
   */
  private attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    
    console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`);
    
    this.reconnectTimeout = setTimeout(() => {
      this.connect(this.eventHandlers);
    }, delay);
  }

  /**
   * Start ping interval to keep connection alive
   */
  private startPingInterval() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
    }
    
    this.pingInterval = setInterval(() => {
      this.sendMessage({ type: 'ping' });
    }, 30000); // Send ping every 30 seconds
  }

  /**
   * Stop ping interval
   */
  private stopPingInterval() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  /**
   * Send message to WebSocket server
   */
  private sendMessage(message: any): boolean {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn('WebSocket not connected, cannot send message');
      return false;
    }

    try {
      this.ws.send(JSON.stringify(message));
      return true;
    } catch (error) {
      console.error('Failed to send WebSocket message:', error);
      return false;
    }
  }

  /**
   * Subscribe to video updates
   */
  subscribeToVideo(videoId: string): boolean {
    if (!this.isConnected) {
      console.warn('WebSocket not connected, cannot subscribe');
      return false;
    }

    const success = this.sendMessage({
      type: 'subscribe_video',
      videoId: videoId
    });

    if (success) {
      this.subscriptions.add(videoId);
    }

    return success;
  }

  /**
   * Unsubscribe from video updates
   */
  unsubscribeFromVideo(videoId: string): boolean {
    if (!this.isConnected) {
      console.warn('WebSocket not connected, cannot unsubscribe');
      return false;
    }

    const success = this.sendMessage({
      type: 'unsubscribe_video',
      videoId: videoId
    });

    if (success) {
      this.subscriptions.delete(videoId);
    }

    return success;
  }

  /**
   * Request status for a video
   */
  requestVideoStatus(videoId: string): boolean {
    if (!this.isConnected) {
      console.warn('WebSocket not connected, cannot request status');
      return false;
    }

    return this.sendMessage({
      type: 'request_status',
      videoId: videoId
    });
  }

  /**
   * Request live stats
   */
  requestLiveStats(): boolean {
    if (!this.isConnected) {
      console.warn('WebSocket not connected, cannot request stats');
      return false;
    }

    return this.sendMessage({
      type: 'request_stats'
    });
  }

  /**
   * Resubscribe to previously subscribed videos
   */
  private resubscribeToVideos() {
    for (const videoId of this.subscriptions) {
      this.subscribeToVideo(videoId);
    }
  }

  /**
   * Update event handlers
   */
  updateEventHandlers(handlers: WebSocketEventHandlers) {
    this.eventHandlers = { ...this.eventHandlers, ...handlers };
  }

  /**
   * Get connection status
   */
  getConnectionStatus(): {
    isConnected: boolean;
    isConnecting: boolean;
    clientId: string | null;
    subscriptions: string[];
  } {
    return {
      isConnected: this.isConnected,
      isConnecting: this.isConnecting,
      clientId: this.clientId,
      subscriptions: Array.from(this.subscriptions)
    };
  }

  /**
   * Disconnect from WebSocket
   */
  disconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    this.stopPingInterval();
    
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.isConnected = false;
    this.isConnecting = false;
    this.subscriptions.clear();
    
    console.log('WebSocket disconnected');
  }

  /**
   * Check if WebSocket is connected
   */
  isWebSocketConnected(): boolean {
    return this.isConnected && this.ws?.readyState === WebSocket.OPEN;
  }
}

// Export singleton instance
export const websocketService = new WebSocketService(); 