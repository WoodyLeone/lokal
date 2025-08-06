/**
 * WebSocket Service for Real-time Pipeline Updates
 * Handles real-time communication between backend and frontend with enhanced progress tracking
 */

const WebSocket = require('ws');
const winston = require('winston');

// Configure logging
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'websocket' },
  transports: [
    new winston.transports.File({ filename: process.env.LOG_FILE || './logs/websocket.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

class WebSocketService {
  constructor() {
    this.wss = null;
    this.clients = new Map(); // Map of client connections
    this.videoSubscriptions = new Map(); // Map of videoId -> Set of client IDs
    this.isInitialized = false;
    
    // Enhanced progress tracking
    this.progressUpdates = new Map(); // Map of videoId -> progress data
    this.processingEstimates = new Map(); // Map of videoId -> time estimates
    this.liveStats = {
      activeVideos: 0,
      totalClients: 0,
      messagesSent: 0,
      lastUpdate: new Date()
    };
    
    // Update interval for live stats
    this.statsUpdateInterval = null;
  }

  /**
   * Initialize WebSocket server
   */
  initialize(server) {
    try {
      this.wss = new WebSocket.Server({ server });
      
      this.wss.on('connection', (ws, req) => {
        this.handleConnection(ws, req);
      });

      this.isInitialized = true;
      logger.info('WebSocket server initialized');
      
      // Start stats update interval
      this.startStatsUpdates();
      
    } catch (error) {
      logger.error('Failed to initialize WebSocket server:', error);
      throw error;
    }
  }

  /**
   * Handle new WebSocket connection
   */
  handleConnection(ws, req) {
    const clientId = this.generateClientId();
    const clientInfo = {
      id: clientId,
      ws: ws,
      connectedAt: new Date(),
      subscriptions: new Set(),
      ip: req.socket.remoteAddress,
      lastActivity: new Date(),
      messageCount: 0
    };

    this.clients.set(clientId, clientInfo);
    this.liveStats.totalClients = this.clients.size;
    logger.info(`New WebSocket connection: ${clientId} from ${clientInfo.ip}`);

    // Send welcome message with server info
    this.sendToClient(clientId, {
      type: 'connection',
      clientId: clientId,
      message: 'Connected to Lokal WebSocket service',
      timestamp: new Date().toISOString(),
      serverInfo: {
        version: '1.0.0',
        features: ['real-time-updates', 'progress-tracking', 'live-stats'],
        maxSubscriptions: 10
      }
    });

    // Handle incoming messages
    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        clientInfo.lastActivity = new Date();
        clientInfo.messageCount++;
        this.handleMessage(clientId, message);
      } catch (error) {
        logger.error(`Failed to parse message from ${clientId}:`, error);
        this.sendToClient(clientId, {
          type: 'error',
          message: 'Invalid message format',
          timestamp: new Date().toISOString()
        });
      }
    });

    // Handle client disconnect
    ws.on('close', () => {
      this.handleDisconnect(clientId);
    });

    // Handle connection errors
    ws.on('error', (error) => {
      logger.error(`WebSocket error for client ${clientId}:`, error);
      this.handleDisconnect(clientId);
    });

    // Send initial stats
    this.sendToClient(clientId, {
      type: 'stats',
      data: this.liveStats,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Handle incoming WebSocket messages
   */
  handleMessage(clientId, message) {
    const client = this.clients.get(clientId);
    if (!client) {
      logger.warn(`Received message from unknown client: ${clientId}`);
      return;
    }

    logger.debug(`Received message from ${clientId}:`, message.type);

    switch (message.type) {
      case 'subscribe_video':
        this.handleVideoSubscription(clientId, message.videoId);
        break;
        
      case 'unsubscribe_video':
        this.handleVideoUnsubscription(clientId, message.videoId);
        break;
        
      case 'request_status':
        this.handleStatusRequest(clientId, message.videoId);
        break;
        
      case 'request_stats':
        this.handleStatsRequest(clientId);
        break;
        
      case 'ping':
        this.sendToClient(clientId, {
          type: 'pong',
          timestamp: new Date().toISOString()
        });
        break;
        
      default:
        logger.warn(`Unknown message type from ${clientId}: ${message.type}`);
        this.sendToClient(clientId, {
          type: 'error',
          message: `Unknown message type: ${message.type}`,
          timestamp: new Date().toISOString()
        });
    }
  }

  /**
   * Handle video subscription
   */
  handleVideoSubscription(clientId, videoId) {
    if (!videoId) {
      this.sendToClient(clientId, {
        type: 'error',
        message: 'Video ID is required for subscription',
        timestamp: new Date().toISOString()
      });
      return;
    }

    const client = this.clients.get(clientId);
    if (!client) return;

    // Check subscription limit
    if (client.subscriptions.size >= 10) {
      this.sendToClient(clientId, {
        type: 'error',
        message: 'Maximum subscription limit reached (10 videos)',
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Add subscription
    client.subscriptions.add(videoId);
    
    if (!this.videoSubscriptions.has(videoId)) {
      this.videoSubscriptions.set(videoId, new Set());
    }
    this.videoSubscriptions.get(videoId).add(clientId);

    logger.info(`Client ${clientId} subscribed to video ${videoId}`);

    // Send confirmation
    this.sendToClient(clientId, {
      type: 'subscription_confirmed',
      videoId: videoId,
      timestamp: new Date().toISOString()
    });

    // Send current progress if available
    const currentProgress = this.progressUpdates.get(videoId);
    if (currentProgress) {
      this.sendToClient(clientId, {
        type: 'progress_update',
        videoId: videoId,
        data: currentProgress,
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Handle video unsubscription
   */
  handleVideoUnsubscription(clientId, videoId) {
    const client = this.clients.get(clientId);
    if (!client) return;

    client.subscriptions.delete(videoId);
    
    if (this.videoSubscriptions.has(videoId)) {
      this.videoSubscriptions.get(videoId).delete(clientId);
      
      // Clean up empty subscription sets
      if (this.videoSubscriptions.get(videoId).size === 0) {
        this.videoSubscriptions.delete(videoId);
      }
    }

    logger.info(`Client ${clientId} unsubscribed from video ${videoId}`);

    this.sendToClient(clientId, {
      type: 'unsubscription_confirmed',
      videoId: videoId,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Handle status request
   */
  handleStatusRequest(clientId, videoId) {
    if (!videoId) {
      this.sendToClient(clientId, {
        type: 'error',
        message: 'Video ID is required for status request',
        timestamp: new Date().toISOString()
      });
      return;
    }

    const progress = this.progressUpdates.get(videoId);
    const estimate = this.processingEstimates.get(videoId);

    this.sendToClient(clientId, {
      type: 'status_response',
      videoId: videoId,
      data: {
        progress: progress || null,
        estimate: estimate || null,
        lastUpdate: progress ? progress.timestamp : null
      },
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Handle stats request
   */
  handleStatsRequest(clientId) {
    this.sendToClient(clientId, {
      type: 'stats_response',
      data: this.liveStats,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Handle client disconnect
   */
  handleDisconnect(clientId) {
    const client = this.clients.get(clientId);
    if (!client) return;

    // Remove from all video subscriptions
    for (const videoId of client.subscriptions) {
      if (this.videoSubscriptions.has(videoId)) {
        this.videoSubscriptions.get(videoId).delete(clientId);
        
        if (this.videoSubscriptions.get(videoId).size === 0) {
          this.videoSubscriptions.delete(videoId);
        }
      }
    }

    this.clients.delete(clientId);
    this.liveStats.totalClients = this.clients.size;
    
    logger.info(`Client ${clientId} disconnected`);
  }

  /**
   * Send message to specific client
   */
  sendToClient(clientId, message) {
    const client = this.clients.get(clientId);
    if (!client || client.ws.readyState !== WebSocket.OPEN) {
      return false;
    }

    try {
      client.ws.send(JSON.stringify(message));
      this.liveStats.messagesSent++;
      return true;
    } catch (error) {
      logger.error(`Failed to send message to client ${clientId}:`, error);
      return false;
    }
  }

  /**
   * Broadcast message to all clients subscribed to a video
   */
  broadcastToVideo(videoId, message) {
    if (!this.videoSubscriptions.has(videoId)) {
      return 0;
    }

    const subscribers = this.videoSubscriptions.get(videoId);
    let sentCount = 0;

    for (const clientId of subscribers) {
      if (this.sendToClient(clientId, message)) {
        sentCount++;
      }
    }

    logger.debug(`Broadcasted to ${sentCount} clients for video ${videoId}`);
    return sentCount;
  }

  /**
   * Enhanced pipeline status broadcasting with progress tracking
   */
  broadcastPipelineStatus(videoId, status, progress, data = {}) {
    const progressData = {
      status: status,
      progress: progress,
      timestamp: new Date().toISOString(),
      ...data
    };

    // Store progress for new subscribers
    this.progressUpdates.set(videoId, progressData);

    // Calculate processing estimates
    if (status === 'processing' && progress > 0) {
      this.updateProcessingEstimate(videoId, progress);
    }

    const message = {
      type: 'pipeline_status',
      videoId: videoId,
      data: progressData
    };

    const sentCount = this.broadcastToVideo(videoId, message);
    
    // Update live stats
    if (status === 'processing') {
      this.liveStats.activeVideos = this.progressUpdates.size;
    }
    
    this.liveStats.lastUpdate = new Date();
    
    return sentCount;
  }

  /**
   * Update processing time estimates
   */
  updateProcessingEstimate(videoId, progress) {
    const now = Date.now();
    const progressData = this.progressUpdates.get(videoId);
    
    if (!progressData || !progressData.startTime) {
      // First progress update, set start time
      progressData.startTime = now;
      this.progressUpdates.set(videoId, progressData);
      return;
    }

    if (progress > 0) {
      const elapsed = now - progressData.startTime;
      const estimatedTotal = (elapsed / progress) * 100;
      const remaining = estimatedTotal - elapsed;

      this.processingEstimates.set(videoId, {
        elapsed: elapsed,
        estimatedTotal: estimatedTotal,
        remaining: remaining,
        progress: progress,
        timestamp: now
      });
    }
  }

  /**
   * Broadcast detection results
   */
  broadcastDetectionResults(videoId, results) {
    const message = {
      type: 'detection_results',
      videoId: videoId,
      data: {
        objects: results.detections || [],
        summary: results.summary || {},
        timestamp: new Date().toISOString()
      }
    };

    return this.broadcastToVideo(videoId, message);
  }

  /**
   * Broadcast product matches
   */
  broadcastProductMatches(videoId, matches) {
    const message = {
      type: 'product_matches',
      videoId: videoId,
      data: {
        matches: matches || [],
        count: matches ? matches.length : 0,
        timestamp: new Date().toISOString()
      }
    };

    return this.broadcastToVideo(videoId, message);
  }

  /**
   * Broadcast error messages
   */
  broadcastError(videoId, error) {
    const message = {
      type: 'error',
      videoId: videoId,
      data: {
        message: error.message || 'An error occurred',
        code: error.code || 'UNKNOWN_ERROR',
        timestamp: new Date().toISOString()
      }
    };

    return this.broadcastToVideo(videoId, message);
  }

  /**
   * Broadcast live stats updates
   */
  broadcastLiveStats() {
    const message = {
      type: 'live_stats',
      data: this.liveStats,
      timestamp: new Date().toISOString()
    };

    let sentCount = 0;
    for (const clientId of this.clients.keys()) {
      if (this.sendToClient(clientId, message)) {
        sentCount++;
      }
    }

    return sentCount;
  }

  /**
   * Start periodic stats updates
   */
  startStatsUpdates() {
    this.statsUpdateInterval = setInterval(() => {
      this.broadcastLiveStats();
    }, 30000); // Update every 30 seconds
  }

  /**
   * Generate unique client ID
   */
  generateClientId() {
    return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get service statistics
   */
  getStats() {
    return {
      totalClients: this.clients.size,
      activeSubscriptions: this.videoSubscriptions.size,
      totalSubscriptions: Array.from(this.videoSubscriptions.values())
        .reduce((total, subscribers) => total + subscribers.size, 0),
      messagesSent: this.liveStats.messagesSent,
      activeVideos: this.liveStats.activeVideos,
      lastUpdate: this.liveStats.lastUpdate
    };
  }

  /**
   * Health check for the service
   */
  healthCheck() {
    return {
      status: this.isInitialized ? 'healthy' : 'unhealthy',
      initialized: this.isInitialized,
      serverRunning: !!this.wss,
      stats: this.getStats(),
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Cleanup resources
   */
  cleanup() {
    if (this.statsUpdateInterval) {
      clearInterval(this.statsUpdateInterval);
      this.statsUpdateInterval = null;
    }

    if (this.wss) {
      this.wss.close();
      this.wss = null;
    }

    this.clients.clear();
    this.videoSubscriptions.clear();
    this.progressUpdates.clear();
    this.processingEstimates.clear();
    
    this.isInitialized = false;
    logger.info('WebSocket service cleaned up');
  }
}

module.exports = new WebSocketService(); 