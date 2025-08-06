import React, { useRef, useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Dimensions, Animated, Modal, ScrollView } from 'react-native';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as WebBrowser from 'expo-web-browser';
import { ProductFrontend, Hotspot } from '../types';
import { ProductCard } from './ProductCard';
import { EnhancedButton } from './EnhancedButton';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../utils/designSystem';
import { isValidVideoUrl } from '../utils/helpers';

interface TrackingResult {
  track_id: string;
  bbox: number[];
  confidence: number;
  class_name: string;
  class_id: number;
  hits: number;
  age: number;
  state: string;
}

interface FrameResult {
  frame_number: number;
  timestamp: number;
  tracks: TrackingResult[];
}

interface PipelineResult {
  videoId: string;
  tracking: {
    frameResults: FrameResult[];
  };
  recommendations: Array<{
    product: ProductFrontend;
    analysis: any;
    relevanceScore: number;
    confidence: number;
    searchTerms: string[];
  }>;
}

interface ShoppableVideoPlayerProps {
  uri: string;
  products: ProductFrontend[];
  hotspots: Hotspot[];
  pipelineResults?: PipelineResult;
  onLoad?: (duration: number) => void;
  onProgress?: (progress: number) => void;
  autoPlay?: boolean;
  loop?: boolean;
  showControls?: boolean;
  style?: any;
  onHotspotPress?: (hotspot: Hotspot) => void;
  onProductPress?: (product: ProductFrontend) => void;
  isInteractive?: boolean;
  showProductOverlay?: boolean;
  showTrackingOverlay?: boolean;
}

const { width: screenWidth } = Dimensions.get('window');
const videoHeight = screenWidth * 0.75;



export const ShoppableVideoPlayer: React.FC<ShoppableVideoPlayerProps> = ({ 
  uri, 
  products,
  hotspots = [],
  pipelineResults,
  onLoad, 
  onProgress, 
  autoPlay = false, 
  loop = false, 
  showControls = true,
  style,
  onHotspotPress,
  onProductPress,
  isInteractive = true,
  showProductOverlay = true,
  showTrackingOverlay = true
}) => {
  const videoRef = useRef<Video>(null);
  const [status, setStatus] = useState<AVPlaybackStatus | null>(null);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [showControlsOverlay, setShowControlsOverlay] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [showProductModal, setShowProductModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductFrontend | null>(null);
  const [showHotspots, setShowHotspots] = useState(true);
  const [pulseAnim] = useState(new Animated.Value(1));
  const [isPaused, setIsPaused] = useState(false);
  const [showPauseOverlay, setShowPauseOverlay] = useState(false);
  const [currentFrameTracks, setCurrentFrameTracks] = useState<TrackingResult[]>([]);
  const [isUrlValid, setIsUrlValid] = useState(true);

  // Validate URL on component mount
  useEffect(() => {
    const valid = isValidVideoUrl(uri);
    setIsUrlValid(valid);
    
    if (!valid) {
      console.warn('Invalid video URL:', uri);
      setHasError(true);
      setIsLoading(false);
    }
  }, [uri]);

  // Pulse animation for hotspots
  useEffect(() => {
    if (showHotspots && hotspots.length > 0) {
      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
      pulseAnimation.start();
      return () => pulseAnimation.stop();
    }
  }, [showHotspots, hotspots.length, pulseAnim]);

  // Auto-hide controls overlay
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    if (showControlsOverlay) {
      timeoutId = setTimeout(() => {
        setShowControlsOverlay(false);
      }, 3000);
    }
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [showControlsOverlay]);

  // Update current frame tracks based on pipeline results
  useEffect(() => {
    if (pipelineResults?.tracking?.frameResults) {
      const currentFrame = pipelineResults.tracking.frameResults.find(
        frame => Math.abs(frame.timestamp - currentTime) < 0.5
      );
      setCurrentFrameTracks(currentFrame?.tracks || []);
    }
  }, [currentTime, pipelineResults]);

  // Handle pause detection
  useEffect(() => {
    if (isPaused && showTrackingOverlay && currentFrameTracks.length > 0) {
      setShowPauseOverlay(true);
    } else {
      setShowPauseOverlay(false);
    }
  }, [isPaused, showTrackingOverlay, currentFrameTracks]);

  const handlePlayPause = async () => {
    if (videoRef.current) {
      if (isPlaying) {
        await videoRef.current.pauseAsync();
        setIsPaused(true);
      } else {
        await videoRef.current.playAsync();
        setIsPaused(false);
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleLoad = (data: AVPlaybackStatus) => {
    setIsLoading(false);
    if (data.isLoaded && onLoad) {
      onLoad(data.durationMillis || 0);
    }
  };

  const handleError = (error: string) => {
    console.error('Video error:', error);
    setIsLoading(false);
    setHasError(true);
  };

  const handleProgress = (data: AVPlaybackStatus) => {
    if (data.isLoaded) {
      const progress = data.positionMillis / (data.durationMillis || 1);
      const timeInSeconds = data.positionMillis / 1000;
      setCurrentTime(timeInSeconds);
      if (onProgress) {
        onProgress(progress);
      }
    }
  };

  const handleVideoPress = () => {
    if (showControls) {
      setShowControlsOverlay(!showControlsOverlay);
    }
  };

  const formatTime = (millis: number) => {
    const minutes = Math.floor(millis / 60000);
    const seconds = Math.floor((millis % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const seekTo = async (position: number) => {
    if (videoRef.current && status?.isLoaded) {
      await videoRef.current.setPositionAsync(position);
    }
  };

  const isHotspotVisible = (hotspot: Hotspot) => {
    return currentTime >= hotspot.startTime && currentTime <= hotspot.endTime;
  };

  const handleHotspotPress = (hotspot: Hotspot) => {
    if (onHotspotPress) {
      onHotspotPress(hotspot);
    }
    // Find associated product and show modal
    const product = products.find(p => p.id === hotspot.product?.id);
    if (product) {
      setSelectedProduct(product);
      setShowProductModal(true);
    }
  };

  const handleProductPress = async (product: ProductFrontend) => {
    if (onProductPress) {
      onProductPress(product);
    }
    
    if (product.buyUrl) {
      try {
        await WebBrowser.openBrowserAsync(product.buyUrl);
      } catch (error) {
        console.error('Error opening product URL:', error);
      }
    }
  };

  const toggleHotspots = () => {
    setShowHotspots(!showHotspots);
  };

  const handleTrackPress = (track: TrackingResult) => {
    // Find products that match this tracked object
    const matchingProducts = products.filter(product => 
      product.title.toLowerCase().includes(track.class_name.toLowerCase()) ||
      product.description?.toLowerCase().includes(track.class_name.toLowerCase())
    );
    
    if (matchingProducts.length > 0) {
      setSelectedProduct(matchingProducts[0]);
      setShowProductModal(true);
    }
  };

  const renderTrackingOverlay = () => {
    if (!showTrackingOverlay || !pipelineResults) {
      return null;
    }

    return (
      <View style={styles.trackingOverlay}>
        {currentFrameTracks.map((track) => {
          const [x1, y1, x2, y2] = track.bbox;
          const centerX = ((x1 + x2) / 2) * (screenWidth / 100);
          const centerY = ((y1 + y2) / 2) * (videoHeight / 100);
          const width = (x2 - x1) * (screenWidth / 100);
          const height = (y2 - y1) * (videoHeight / 100);

          return (
            <TouchableOpacity
              key={track.track_id}
              style={[
                styles.trackBox,
                {
                  left: centerX - width / 2,
                  top: centerY - height / 2,
                  width: width,
                  height: height,
                  borderColor: track.state === 'confirmed' ? Colors.primary : Colors.warning,
                  opacity: track.confidence
                }
              ]}
              onPress={() => handleTrackPress(track)}
              activeOpacity={0.7}
            >
              <View style={styles.trackLabel}>
                <Text style={styles.trackText}>{track.class_name}</Text>
                <Text style={styles.trackConfidence}>{Math.round(track.confidence * 100)}%</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  const renderPauseOverlay = () => {
    if (!showPauseOverlay || !isPaused) {
      return null;
    }

    return (
      <View style={styles.pauseOverlay}>
        <LinearGradient
          colors={['rgba(0,0,0,0.7)', 'rgba(0,0,0,0.3)']}
          style={styles.pauseGradient}
        >
          <View style={styles.pauseContent}>
            <Text style={styles.pauseTitle}>Objects Detected</Text>
            <Text style={styles.pauseSubtitle}>Tap on objects to see products</Text>
            
            {currentFrameTracks.length > 0 && (
              <View style={styles.detectedObjects}>
                {currentFrameTracks.slice(0, 3).map((track) => (
                  <TouchableOpacity
                    key={track.track_id}
                    style={styles.objectButton}
                    onPress={() => handleTrackPress(track)}
                  >
                    <Text style={styles.objectButtonText}>
                      {track.class_name} ({Math.round(track.confidence * 100)}%)
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </LinearGradient>
      </View>
    );
  };

  // Show error state for invalid URLs or failed loads
  if (hasError || !isUrlValid) {
    return (
      <View style={[{ width: '100%', height: videoHeight, backgroundColor: '#1e293b', justifyContent: 'center', alignItems: 'center' }, style]}>
        <Ionicons name="alert-circle-outline" size={48} color="#ef4444" />
        <Text style={{ color: '#f8fafc', fontSize: 16, marginTop: 12, textAlign: 'center' }}>
          {!isUrlValid ? 'Invalid video URL' : 'Failed to load video'}
        </Text>
        <Text style={{ color: '#94a3b8', fontSize: 14, marginTop: 4, textAlign: 'center' }}>
          {!isUrlValid ? 'The video URL is not accessible' : 'Please check your connection and try again'}
        </Text>
        {!isUrlValid && (
          <Text style={{ color: '#64748b', fontSize: 12, marginTop: 8, textAlign: 'center', paddingHorizontal: 20 }}>
            URL: {uri}
          </Text>
        )}
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <TouchableOpacity
        style={styles.videoContainer}
        onPress={handleVideoPress}
        activeOpacity={1}
      >
        <Video
          ref={videoRef}
          source={{ uri }}
          style={styles.video}
          resizeMode={ResizeMode.CONTAIN}
          shouldPlay={autoPlay}
          isLooping={loop}
          onLoad={handleLoad}
          onError={handleError}
          onPlaybackStatusUpdate={handleProgress}
        />

        {/* Loading overlay */}
        {isLoading && (
          <View style={styles.loadingOverlay}>
            <Text style={styles.loadingText}>Loading video...</Text>
          </View>
        )}

        {/* Error overlay */}
        {hasError && (
          <View style={styles.errorOverlay}>
            <Text style={styles.errorText}>Failed to load video</Text>
          </View>
        )}

        {/* Tracking overlay */}
        {renderTrackingOverlay()}

        {/* Pause overlay with detected objects */}
        {renderPauseOverlay()}

        {/* Hotspots overlay */}
        {showHotspots && isInteractive && (
          <View style={styles.hotspotsOverlay}>
            {hotspots.map((hotspot) => {
              if (!isHotspotVisible(hotspot)) return null;
              
              return (
                <Animated.View
                  key={hotspot.id}
                  style={[
                    styles.hotspot,
                    {
                      left: hotspot.x * screenWidth,
                      top: hotspot.y * videoHeight,
                      transform: [{ scale: pulseAnim }]
                    }
                  ]}
                >
                  <TouchableOpacity
                    style={styles.hotspotButton}
                    onPress={() => handleHotspotPress(hotspot)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="bag-outline" size={20} color={Colors.white} />
                  </TouchableOpacity>
                </Animated.View>
              );
            })}
          </View>
        )}

        {/* Controls overlay */}
        {showControls && showControlsOverlay && (
          <View style={styles.controlsOverlay}>
            <LinearGradient
              colors={['rgba(0,0,0,0.7)', 'transparent']}
              style={styles.controlsGradient}
            >
              <View style={styles.controlsContent}>
                <TouchableOpacity
                  style={styles.controlButton}
                  onPress={handlePlayPause}
                >
                  <Ionicons
                    name={isPlaying ? 'pause' : 'play'}
                    size={24}
                    color={Colors.white}
                  />
                </TouchableOpacity>

                <Text style={styles.timeText}>
                  {formatTime(status?.positionMillis || 0)} / {formatTime(status?.durationMillis || 0)}
                </Text>

                <TouchableOpacity
                  style={styles.controlButton}
                  onPress={toggleHotspots}
                >
                  <Ionicons
                    name={showHotspots ? 'eye' : 'eye-off'}
                    size={24}
                    color={Colors.white}
                  />
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </View>
        )}
      </TouchableOpacity>

      {/* Product Modal */}
      <Modal
        visible={showProductModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowProductModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowProductModal(false)}
            >
              <Ionicons name="close" size={24} color={Colors.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Product Details</Text>
          </View>

          <ScrollView style={styles.modalContent}>
            {selectedProduct && (
              <ProductCard
                product={selectedProduct}
                onPress={() => handleProductPress(selectedProduct)}
                showBuyButton={true}
              />
            )}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
};

const styles = {
  container: {
    width: screenWidth,
    height: videoHeight,
    backgroundColor: Colors.background,
  },
  videoContainer: {
    flex: 1,
    position: 'relative' as const,
  },
  video: {
    width: '100%',
    height: '100%',
  },
  loadingOverlay: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  loadingText: {
    color: Colors.white,
    fontSize: Typography.lg,
  },
  errorOverlay: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,0,0,0.3)',
  },
  errorText: {
    color: Colors.white,
    fontSize: Typography.lg,
  },
  trackingOverlay: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  trackBox: {
    position: 'absolute' as const,
    borderWidth: 2,
    borderRadius: BorderRadius.sm,
  },
  trackLabel: {
    position: 'absolute' as const,
    top: -25,
    left: 0,
    backgroundColor: 'rgba(0,0,0,0.8)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  trackText: {
    color: Colors.white,
    fontSize: Typography.xs,
    fontWeight: '600',
  },
  trackConfidence: {
    color: Colors.white,
    fontSize: Typography.xs,
    opacity: 0.8,
  },
  pauseOverlay: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  pauseGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pauseContent: {
    alignItems: 'center',
    padding: Spacing.xl,
  },
  pauseTitle: {
    color: Colors.white,
    fontSize: Typography.xl,
    fontWeight: '700',
    marginBottom: Spacing.sm,
  },
  pauseSubtitle: {
    color: Colors.white,
    fontSize: Typography.base,
    opacity: 0.8,
    marginBottom: Spacing.lg,
  },
  detectedObjects: {
    width: '100%',
  },
  objectButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.base,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
  },
  objectButtonText: {
    color: Colors.white,
    fontSize: Typography.base,
    fontWeight: '600',
    textAlign: 'center' as const,
  },
  hotspotsOverlay: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  hotspot: {
    position: 'absolute' as const,
  },
  hotspotButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.medium,
  },
  controlsOverlay: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  controlsGradient: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    height: 80,
  },
  controlsContent: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
  },
  controlButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  timeText: {
    color: Colors.white,
    fontSize: Typography.base,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  modalHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  closeButton: {
    padding: Spacing.sm,
  },
  modalTitle: {
    flex: 1,
    fontSize: Typography.lg,
    fontWeight: '600',
    color: Colors.textPrimary,
    textAlign: 'center' as const,
  },
  modalContent: {
    flex: 1,
    padding: Spacing.lg,
  },
}; 