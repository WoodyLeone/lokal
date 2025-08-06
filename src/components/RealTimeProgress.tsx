import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { websocketService, ProgressData, ProcessingEstimate, LiveStats } from '../services/websocketService';

interface RealTimeProgressProps {
  videoId: string;
  onStatusChange?: (status: string) => void;
  onProgressComplete?: () => void;
  showDetails?: boolean;
  autoSubscribe?: boolean;
}

interface ProgressState {
  status: string;
  progress: number;
  message: string;
  startTime?: number;
  estimate?: ProcessingEstimate;
  lastUpdate: string;
  isConnected: boolean;
}

export const RealTimeProgress: React.FC<RealTimeProgressProps> = ({
  videoId,
  onStatusChange,
  onProgressComplete,
  showDetails = true,
  autoSubscribe = true,
}) => {
  const [progressState, setProgressState] = useState<ProgressState>({
    status: 'waiting',
    progress: 0,
    message: 'Waiting for connection...',
    lastUpdate: new Date().toISOString(),
    isConnected: false,
  });

  const [liveStats, setLiveStats] = useState<LiveStats | null>(null);
  const [showStats, setShowStats] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // Animation values
  const progressAnimation = new Animated.Value(0);
  const pulseAnimation = new Animated.Value(1);

  useEffect(() => {
    if (autoSubscribe) {
      initializeWebSocket();
    }

    return () => {
      if (autoSubscribe) {
        websocketService.unsubscribeFromVideo(videoId);
      }
    };
  }, [videoId, autoSubscribe]);

  useEffect(() => {
    // Animate progress bar
    Animated.timing(progressAnimation, {
      toValue: progressState.progress,
      duration: 500,
      useNativeDriver: false,
    }).start();

    // Pulse animation for active processing
    if (progressState.status === 'processing') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnimation, {
            toValue: 1.1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnimation, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnimation.setValue(1);
    }
  }, [progressState.progress, progressState.status]);

  const initializeWebSocket = useCallback(async () => {
    try {
      const connected = await websocketService.connect({
        onConnection: (clientId, serverInfo) => {
          console.log('WebSocket connected:', clientId);
          setProgressState(prev => ({
            ...prev,
            isConnected: true,
            message: 'Connected to real-time updates',
          }));

          // Subscribe to video updates
          websocketService.subscribeToVideo(videoId);
        },

        onDisconnection: () => {
          setProgressState(prev => ({
            ...prev,
            isConnected: false,
            message: 'Connection lost. Reconnecting...',
          }));
        },

        onProgressUpdate: (videoId, progress: ProgressData) => {
          setProgressState(prev => ({
            ...prev,
            status: progress.status,
            progress: progress.progress,
            message: progress.message || getStatusMessage(progress.status),
            startTime: progress.startTime,
            lastUpdate: progress.timestamp,
          }));

          if (onStatusChange) {
            onStatusChange(progress.status);
          }

          if (progress.status === 'completed' && onProgressComplete) {
            onProgressComplete();
          }
        },

        onStatusResponse: (videoId, status) => {
          if (status.progress) {
            setProgressState(prev => ({
              ...prev,
              status: status.progress.status,
              progress: status.progress.progress,
              message: status.progress.message || getStatusMessage(status.progress.status),
              startTime: status.progress.startTime,
              lastUpdate: status.progress.timestamp,
            }));
          }

          if (status.estimate) {
            setProgressState(prev => ({
              ...prev,
              estimate: status.estimate,
            }));
          }
        },

        onLiveStats: (stats: LiveStats) => {
          setLiveStats(stats);
        },

        onError: (videoId, error) => {
          setProgressState(prev => ({
            ...prev,
            status: 'error',
            message: error.message || 'An error occurred',
          }));

          Alert.alert('Processing Error', error.message || 'An error occurred during processing');
        },

        onSubscriptionConfirmed: (videoId) => {
          console.log('Subscribed to video updates:', videoId);
          setProgressState(prev => ({
            ...prev,
            message: 'Subscribed to real-time updates',
          }));
        },
      });

      if (!connected) {
        setProgressState(prev => ({
          ...prev,
          status: 'error',
          message: 'Failed to connect to real-time updates',
        }));
      }
    } catch (error) {
      console.error('Failed to initialize WebSocket:', error);
      setProgressState(prev => ({
        ...prev,
        status: 'error',
        message: 'Failed to connect to real-time updates',
      }));
    }
  }, [videoId, onStatusChange, onProgressComplete]);

  const getStatusMessage = (status: string): string => {
    switch (status) {
      case 'waiting':
        return 'Waiting to start...';
      case 'initializing':
        return 'Initializing pipeline...';
      case 'extracting_frames':
        return 'Extracting video frames...';
      case 'detecting_objects':
        return 'Detecting objects...';
      case 'cropping_objects':
        return 'Cropping detected objects...';
      case 'analyzing_objects':
        return 'Analyzing objects with AI...';
      case 'matching_products':
        return 'Matching products...';
      case 'finalizing':
        return 'Finalizing results...';
      case 'completed':
        return 'Processing completed!';
      case 'failed':
        return 'Processing failed';
      case 'error':
        return 'An error occurred';
      default:
        return 'Processing...';
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'completed':
        return '#10b981';
      case 'failed':
      case 'error':
        return '#ef4444';
      case 'processing':
        return '#6366f1';
      default:
        return '#64748b';
    }
  };

  const getStatusIcon = (status: string): string => {
    switch (status) {
      case 'completed':
        return 'checkmark-circle';
      case 'failed':
      case 'error':
        return 'alert-circle';
      case 'processing':
        return 'sync';
      default:
        return 'time';
    }
  };

  const formatTime = (milliseconds: number): string => {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatTimeRemaining = (estimate: ProcessingEstimate): string => {
    if (estimate.remaining <= 0) return 'Almost done...';
    return formatTime(estimate.remaining);
  };

  const handleRefresh = () => {
    websocketService.requestVideoStatus(videoId);
  };

  const handleToggleStats = () => {
    setShowStats(!showStats);
    if (!showStats) {
      websocketService.requestLiveStats();
    }
  };

  const handleToggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  const connectionStatus = websocketService.getConnectionStatus();

  return (
    <View style={styles.container}>
      {/* Main Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.header}>
          <View style={styles.statusInfo}>
            <Animated.View style={[styles.statusIcon, { transform: [{ scale: pulseAnimation }] }]}>
              <Ionicons
                name={getStatusIcon(progressState.status) as any}
                size={20}
                color={getStatusColor(progressState.status)}
              />
            </Animated.View>
            <View style={styles.statusText}>
              <Text style={[styles.statusTitle, { color: getStatusColor(progressState.status) }]}>
                {progressState.status.replace('_', ' ').toUpperCase()}
              </Text>
              <Text style={styles.statusMessage}>{progressState.message}</Text>
            </View>
          </View>
          
          <View style={styles.actions}>
            <TouchableOpacity onPress={handleRefresh} style={styles.actionButton}>
              <Ionicons name="refresh" size={16} color="#64748b" />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleToggleStats} style={styles.actionButton}>
              <Ionicons name="bar-chart-outline" size={16} color="#64748b" />
            </TouchableOpacity>
            {showDetails && (
              <TouchableOpacity onPress={handleToggleExpand} style={styles.actionButton}>
                <Ionicons name={isExpanded ? "chevron-up" : "chevron-down"} size={16} color="#64748b" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressBarContainer}>
          <Animated.View
            style={[
              styles.progressBar,
              {
                width: progressAnimation.interpolate({
                  inputRange: [0, 100],
                  outputRange: ['0%', '100%'],
                }),
                backgroundColor: getStatusColor(progressState.status),
              },
            ]}
          />
          <Text style={styles.progressText}>{Math.round(progressState.progress)}%</Text>
        </View>

        {/* Connection Status */}
        <View style={styles.connectionStatus}>
          <View style={[styles.connectionDot, { backgroundColor: connectionStatus.isConnected ? '#10b981' : '#ef4444' }]} />
          <Text style={styles.connectionText}>
            {connectionStatus.isConnected ? 'Connected' : 'Disconnected'}
          </Text>
        </View>
      </View>

      {/* Expanded Details */}
      {showDetails && isExpanded && (
        <View style={styles.detailsContainer}>
          {/* Time Estimates */}
          {progressState.estimate && (
            <View style={styles.estimateContainer}>
              <Text style={styles.estimateTitle}>Time Estimates:</Text>
              <View style={styles.estimateRow}>
                <Text style={styles.estimateLabel}>Elapsed:</Text>
                <Text style={styles.estimateValue}>
                  {formatTime(progressState.estimate.elapsed)}
                </Text>
              </View>
              <View style={styles.estimateRow}>
                <Text style={styles.estimateLabel}>Remaining:</Text>
                <Text style={styles.estimateValue}>
                  {formatTimeRemaining(progressState.estimate)}
                </Text>
              </View>
              <View style={styles.estimateRow}>
                <Text style={styles.estimateLabel}>Total:</Text>
                <Text style={styles.estimateValue}>
                  {formatTime(progressState.estimate.estimatedTotal)}
                </Text>
              </View>
            </View>
          )}

          {/* Live Stats */}
          {showStats && liveStats && (
            <View style={styles.statsContainer}>
              <Text style={styles.statsTitle}>Live Statistics:</Text>
              <View style={styles.statsRow}>
                <Text style={styles.statsLabel}>Active Videos:</Text>
                <Text style={styles.statsValue}>{liveStats.activeVideos}</Text>
              </View>
              <View style={styles.statsRow}>
                <Text style={styles.statsLabel}>Connected Clients:</Text>
                <Text style={styles.statsValue}>{liveStats.totalClients}</Text>
              </View>
              <View style={styles.statsRow}>
                <Text style={styles.statsLabel}>Messages Sent:</Text>
                <Text style={styles.statsValue}>{liveStats.messagesSent}</Text>
              </View>
              <View style={styles.statsRow}>
                <Text style={styles.statsLabel}>Last Update:</Text>
                <Text style={styles.statsValue}>
                  {new Date(liveStats.lastUpdate).toLocaleTimeString()}
                </Text>
              </View>
            </View>
          )}

          {/* Connection Details */}
          <View style={styles.connectionDetails}>
            <Text style={styles.connectionDetailsTitle}>Connection Details:</Text>
            <View style={styles.connectionDetailsRow}>
              <Text style={styles.connectionDetailsLabel}>Client ID:</Text>
              <Text style={styles.connectionDetailsValue}>
                {connectionStatus.clientId || 'Not assigned'}
              </Text>
            </View>
            <View style={styles.connectionDetailsRow}>
              <Text style={styles.connectionDetailsLabel}>Subscriptions:</Text>
              <Text style={styles.connectionDetailsValue}>
                {connectionStatus.subscriptions.length}
              </Text>
            </View>
            <View style={styles.connectionDetailsRow}>
              <Text style={styles.connectionDetailsLabel}>Last Update:</Text>
              <Text style={styles.connectionDetailsValue}>
                {new Date(progressState.lastUpdate).toLocaleTimeString()}
              </Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  progressContainer: {
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statusIcon: {
    marginRight: 8,
  },
  statusText: {
    flex: 1,
  },
  statusTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  statusMessage: {
    fontSize: 12,
    color: '#64748b',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 4,
    borderRadius: 4,
    backgroundColor: '#f1f5f9',
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#e2e8f0',
    borderRadius: 4,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 8,
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    position: 'absolute',
    right: 4,
    top: -2,
    fontSize: 10,
    fontWeight: 'bold',
    color: '#374151',
  },
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  connectionDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  connectionText: {
    fontSize: 10,
    color: '#64748b',
  },
  detailsContainer: {
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 12,
    gap: 16,
  },
  estimateContainer: {
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 12,
  },
  estimateTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 8,
  },
  estimateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  estimateLabel: {
    fontSize: 11,
    color: '#64748b',
  },
  estimateValue: {
    fontSize: 11,
    fontWeight: '600',
    color: '#374151',
  },
  statsContainer: {
    backgroundColor: '#f0f9ff',
    borderRadius: 8,
    padding: 12,
  },
  statsTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 8,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  statsLabel: {
    fontSize: 11,
    color: '#64748b',
  },
  statsValue: {
    fontSize: 11,
    fontWeight: '600',
    color: '#374151',
  },
  connectionDetails: {
    backgroundColor: '#fef2f2',
    borderRadius: 8,
    padding: 12,
  },
  connectionDetailsTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 8,
  },
  connectionDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  connectionDetailsLabel: {
    fontSize: 11,
    color: '#64748b',
  },
  connectionDetailsValue: {
    fontSize: 11,
    fontWeight: '600',
    color: '#374151',
  },
}); 