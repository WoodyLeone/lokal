import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Modal,
  Alert,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface LoadingState {
  status: 'idle' | 'loading' | 'success' | 'error' | 'retrying';
  message: string;
  progress?: number;
  error?: string;
  retryCount?: number;
}

interface EnhancedLoadingProps {
  visible: boolean;
  title?: string;
  message?: string;
  progress?: number;
  status?: 'loading' | 'success' | 'error';
  onRetry?: () => void;
  onCancel?: () => void;
  onDismiss?: () => void;
  showProgress?: boolean;
  showCancel?: boolean;
  showRetry?: boolean;
  autoDismiss?: boolean;
  dismissDelay?: number;
  maxRetries?: number;
  children?: React.ReactNode;
}

export const EnhancedLoading: React.FC<EnhancedLoadingProps> = ({
  visible,
  title = 'Processing',
  message = 'Please wait...',
  progress = 0,
  status = 'loading',
  onRetry,
  onCancel,
  onDismiss,
  showProgress = true,
  showCancel = true,
  showRetry = true,
  autoDismiss = false,
  dismissDelay = 3000,
  maxRetries = 3,
  children,
}) => {
  const [loadingState, setLoadingState] = useState<LoadingState>({
    status: 'idle',
    message: message,
    progress: progress,
    retryCount: 0,
  });

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  // Update state when props change
  useEffect(() => {
    setLoadingState(prev => ({
      ...prev,
      status,
      message: message || prev.message,
      progress: progress || prev.progress,
    }));
  }, [status, message, progress]);

  // Handle visibility changes
  useEffect(() => {
    if (visible) {
      showModal();
    } else {
      hideModal();
    }
  }, [visible]);

  // Auto-dismiss on success
  useEffect(() => {
    if (autoDismiss && status === 'success' && visible) {
      const timer = setTimeout(() => {
        onDismiss?.();
      }, dismissDelay);
      return () => clearTimeout(timer);
    }
  }, [autoDismiss, status, visible, dismissDelay, onDismiss]);

  // Start animations
  useEffect(() => {
    if (visible) {
      startAnimations();
    }
  }, [visible]);

  // Progress animation
  useEffect(() => {
    if (showProgress && progress !== undefined) {
      Animated.timing(progressAnim, {
        toValue: progress,
        duration: 500,
        useNativeDriver: false,
      }).start();
    }
  }, [progress, showProgress]);

  const showModal = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const hideModal = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.8,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const startAnimations = () => {
    // Pulse animation for loading state
    if (status === 'loading') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }

    // Rotation animation for loading icon
    if (status === 'loading') {
      Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        })
      ).start();
    } else {
      rotateAnim.setValue(0);
    }
  };

  const handleRetry = () => {
    if (loadingState.retryCount && loadingState.retryCount >= maxRetries) {
      Alert.alert(
        'Max Retries Reached',
        'Maximum number of retry attempts reached. Please try again later.',
        [{ text: 'OK' }]
      );
      return;
    }

    setLoadingState(prev => ({
      ...prev,
      status: 'retrying',
      message: 'Retrying...',
      retryCount: (prev.retryCount || 0) + 1,
    }));

    onRetry?.();
  };

  const handleCancel = () => {
    Alert.alert(
      'Cancel Processing',
      'Are you sure you want to cancel? This action cannot be undone.',
      [
        { text: 'No', style: 'cancel' },
        { text: 'Yes', onPress: onCancel },
      ]
    );
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'success':
        return 'checkmark-circle';
      case 'error':
        return 'alert-circle';
      case 'loading':
      default:
        return 'sync';
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'success':
        return '#10b981';
      case 'error':
        return '#ef4444';
      case 'loading':
      default:
        return '#6366f1';
    }
  };

  const getBackgroundGradient = () => {
    switch (status) {
      case 'success':
        return ['#ecfdf5', '#d1fae5'];
      case 'error':
        return ['#fef2f2', '#fee2e2'];
      case 'loading':
      default:
        return ['#f0f9ff', '#e0f2fe'];
    }
  };

  const renderProgressBar = () => {
    if (!showProgress || progress === undefined) return null;

    return (
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <Animated.View
            style={[
              styles.progressFill,
              {
                width: progressAnim.interpolate({
                  inputRange: [0, 100],
                  outputRange: ['0%', '100%'],
                }),
                backgroundColor: getStatusColor(),
              },
            ]}
          />
        </View>
        <Text style={styles.progressText}>{Math.round(progress)}%</Text>
      </View>
    );
  };

  const renderRetryInfo = () => {
    if (status !== 'error' || !loadingState.retryCount) return null;

    return (
      <View style={styles.retryInfo}>
        <Text style={styles.retryText}>
          Retry attempt {loadingState.retryCount} of {maxRetries}
        </Text>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onDismiss}
    >
      <Animated.View
        style={[
          styles.overlay,
          {
            opacity: fadeAnim,
          },
        ]}
      >
        <Animated.View
          style={[
            styles.container,
            {
              transform: [
                { scale: scaleAnim },
                {
                  rotate: rotateAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0deg', '360deg'],
                  }),
                },
              ],
            },
          ]}
        >
          <LinearGradient
            colors={getBackgroundGradient()}
            style={styles.gradientBackground}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            {/* Status Icon */}
            <Animated.View
              style={[
                styles.iconContainer,
                {
                  transform: [{ scale: pulseAnim }],
                },
              ]}
            >
              <Ionicons
                name={getStatusIcon() as any}
                size={48}
                color={getStatusColor()}
              />
            </Animated.View>

            {/* Title */}
            <Text style={[styles.title, { color: getStatusColor() }]}>
              {title}
            </Text>

            {/* Message */}
            <Text style={styles.message}>{loadingState.message}</Text>

            {/* Progress Bar */}
            {renderProgressBar()}

            {/* Retry Info */}
            {renderRetryInfo()}

            {/* Custom Content */}
            {children && <View style={styles.customContent}>{children}</View>}

            {/* Action Buttons */}
            <View style={styles.actions}>
              {status === 'error' && showRetry && onRetry && (
                <TouchableOpacity
                  style={[styles.button, styles.retryButton]}
                  onPress={handleRetry}
                >
                  <Ionicons name="refresh" size={16} color="#ffffff" />
                  <Text style={styles.buttonText}>Retry</Text>
                </TouchableOpacity>
              )}

              {showCancel && onCancel && (
                <TouchableOpacity
                  style={[styles.button, styles.cancelButton]}
                  onPress={handleCancel}
                >
                  <Ionicons name="close" size={16} color="#64748b" />
                  <Text style={[styles.buttonText, styles.cancelButtonText]}>
                    Cancel
                  </Text>
                </TouchableOpacity>
              )}

              {status === 'success' && onDismiss && (
                <TouchableOpacity
                  style={[styles.button, styles.dismissButton]}
                  onPress={onDismiss}
                >
                  <Ionicons name="checkmark" size={16} color="#ffffff" />
                  <Text style={styles.buttonText}>Done</Text>
                </TouchableOpacity>
              )}
            </View>
          </LinearGradient>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: screenWidth * 0.85,
    maxWidth: 400,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  gradientBackground: {
    padding: 24,
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 16,
    padding: 16,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#374151',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  progressContainer: {
    width: '100%',
    marginBottom: 20,
  },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
  },
  retryInfo: {
    marginBottom: 16,
  },
  retryText: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
  },
  customContent: {
    width: '100%',
    marginBottom: 20,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'center',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 100,
    justifyContent: 'center',
    gap: 6,
  },
  retryButton: {
    backgroundColor: '#6366f1',
  },
  cancelButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  dismissButton: {
    backgroundColor: '#10b981',
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  cancelButtonText: {
    color: '#64748b',
  },
});

// Export a simplified loading component for common use cases
export const SimpleLoading: React.FC<{
  visible: boolean;
  message?: string;
  onCancel?: () => void;
}> = ({ visible, message = 'Loading...', onCancel }) => (
  <EnhancedLoading
    visible={visible}
    title="Loading"
    message={message}
    showProgress={false}
    showRetry={false}
    onCancel={onCancel}
  />
);

// Export a progress loading component
export const ProgressLoading: React.FC<{
  visible: boolean;
  title?: string;
  message?: string;
  progress?: number;
  onCancel?: () => void;
}> = ({ visible, title = 'Processing', message, progress, onCancel }) => (
  <EnhancedLoading
    visible={visible}
    title={title}
    message={message}
    progress={progress}
    showProgress={true}
    showRetry={false}
    onCancel={onCancel}
  />
);

// Export a success loading component
export const SuccessLoading: React.FC<{
  visible: boolean;
  title?: string;
  message?: string;
  onDismiss?: () => void;
  autoDismiss?: boolean;
}> = ({ visible, title = 'Success', message = 'Operation completed successfully', onDismiss, autoDismiss = true }) => (
  <EnhancedLoading
    visible={visible}
    title={title}
    message={message}
    status="success"
    showProgress={false}
    showCancel={false}
    showRetry={false}
    onDismiss={onDismiss}
    autoDismiss={autoDismiss}
  />
);

// Export an error loading component
export const ErrorLoading: React.FC<{
  visible: boolean;
  title?: string;
  message?: string;
  onRetry?: () => void;
  onCancel?: () => void;
  retryCount?: number;
  maxRetries?: number;
}> = ({ visible, title = 'Error', message = 'Something went wrong', onRetry, onCancel, retryCount = 0, maxRetries = 3 }) => (
  <EnhancedLoading
    visible={visible}
    title={title}
    message={message}
    status="error"
    showProgress={false}
    showRetry={true}
    onRetry={onRetry}
    onCancel={onCancel}
  />
); 