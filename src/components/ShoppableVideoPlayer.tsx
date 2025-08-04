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

interface ShoppableVideoPlayerProps {
  uri: string;
  products: ProductFrontend[];
  hotspots: Hotspot[];
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
}

const { width: screenWidth } = Dimensions.get('window');
const videoHeight = screenWidth * 0.75;

export const ShoppableVideoPlayer: React.FC<ShoppableVideoPlayerProps> = ({ 
  uri, 
  products,
  hotspots = [],
  onLoad, 
  onProgress, 
  autoPlay = false, 
  loop = false, 
  showControls = true,
  style,
  onHotspotPress,
  onProductPress,
  isInteractive = true,
  showProductOverlay = true
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

  const handlePlayPause = async () => {
    if (videoRef.current) {
      if (isPlaying) {
        await videoRef.current.pauseAsync();
      } else {
        await videoRef.current.playAsync();
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
    const product = products.find(p => p.id === hotspot.productId);
    if (product) {
      setSelectedProduct(product);
      setShowProductModal(true);
    }
  };

  const handleProductPress = async (product: ProductFrontend) => {
    if (onProductPress) {
      onProductPress(product);
    } else {
      // Open the buy URL in an in-app browser
      await WebBrowser.openBrowserAsync(product.buyUrl);
    }
  };

  const toggleHotspots = () => {
    setShowHotspots(!showHotspots);
  };

  return (
    <View style={[{ width: '100%', height: videoHeight }, style]}>
      <Video
        ref={videoRef}
        source={{ uri }}
        style={{ width: '100%', height: '100%' }}
        resizeMode={ResizeMode.CONTAIN}
        shouldPlay={autoPlay}
        isLooping={loop}
        onPlaybackStatusUpdate={setStatus}
        onLoad={handleLoad}
        onError={handleError}
        onProgress={handleProgress}
      />

      {/* Loading Overlay */}
      {isLoading && (
        <View style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: Colors.overlay,
          justifyContent: 'center',
          alignItems: 'center',
        }}>
          <View style={{ alignItems: 'center' }}>
            <Ionicons name="videocam-outline" size={48} color={Colors.primary} />
            <Text style={{ color: Colors.textPrimary, marginTop: Spacing.sm }}>
              Loading video...
            </Text>
          </View>
        </View>
      )}

      {/* Error Overlay */}
      {hasError && (
        <View style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: Colors.overlay,
          justifyContent: 'center',
          alignItems: 'center',
        }}>
          <View style={{ alignItems: 'center' }}>
            <Ionicons name="alert-circle-outline" size={48} color={Colors.error} />
            <Text style={{ color: Colors.textPrimary, marginTop: Spacing.sm }}>
              Failed to load video
            </Text>
          </View>
        </View>
      )}

      {/* Hotspots Overlay */}
      {isInteractive && showHotspots && hotspots.length > 0 && (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
          {hotspots.map((hotspot, index) => {
            if (!isHotspotVisible(hotspot)) return null;
            
            // Ensure hotspot position is within bounds
            const x = Math.max(20, Math.min(screenWidth - 52, hotspot.x * screenWidth));
            const y = Math.max(20, Math.min(videoHeight - 52, hotspot.y * videoHeight));
            
            return (
              <Animated.View
                key={`${hotspot.id}-${index}`}
                style={{
                  position: 'absolute',
                  left: x,
                  top: y,
                  transform: [{ scale: pulseAnim }],
                  zIndex: 5, // Ensure hotspots are above video but below other UI
                }}
              >
                <TouchableOpacity
                  onPress={() => handleHotspotPress(hotspot)}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    backgroundColor: Colors.primary,
                    justifyContent: 'center',
                    alignItems: 'center',
                    ...Shadows.lg,
                  }}
                >
                  <Ionicons name="shopping-bag" size={16} color={Colors.textPrimary} />
                </TouchableOpacity>
              </Animated.View>
            );
          })}
        </View>
      )}

      {/* Controls Overlay */}
      {showControls && (showControlsOverlay || isLoading) && (
        <TouchableOpacity
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
          }}
          onPress={handleVideoPress}
          activeOpacity={1}
        >
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.8)']}
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              padding: Spacing.lg,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <TouchableOpacity onPress={handlePlayPause} style={{ padding: Spacing.sm }}>
                <Ionicons 
                  name={isPlaying ? 'pause' : 'play'} 
                  size={24} 
                  color={Colors.textPrimary} 
                />
              </TouchableOpacity>
              
              <View style={{ flex: 1, marginHorizontal: Spacing.base }}>
                <View style={{ 
                  height: 4, 
                  backgroundColor: 'rgba(255,255,255,0.3)', 
                  borderRadius: BorderRadius.sm,
                  overflow: 'hidden'
                }}>
                  <View style={{
                    height: '100%',
                    backgroundColor: Colors.primary,
                    width: status?.isLoaded ? `${(status.positionMillis / (status.durationMillis || 1)) * 100}%` : '0%'
                  }} />
                </View>
              </View>
              
              <Text style={{ color: Colors.textPrimary, fontSize: Typography.sm, minWidth: 80, textAlign: 'right' }}>
                {status?.isLoaded 
                  ? `${formatTime(status.positionMillis)} / ${formatTime(status.durationMillis || 0)}`
                  : '0:00 / 0:00'
                }
              </Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>
      )}

      {/* Play Button Overlay */}
      {showControls && !isPlaying && !showControlsOverlay && !isLoading && (
        <TouchableOpacity
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            justifyContent: 'center',
            alignItems: 'center',
          }}
          onPress={handleVideoPress}
        >
          <View style={{
            width: 60,
            height: 60,
            borderRadius: 30,
            backgroundColor: Colors.overlay,
            justifyContent: 'center',
            alignItems: 'center',
            ...Shadows.lg,
          }}>
            <Ionicons name="play" size={24} color={Colors.textPrimary} />
          </View>
        </TouchableOpacity>
      )}

      {/* Product Overlay */}
      {showProductOverlay && products.length > 0 && (
        <View style={{
          position: 'absolute',
          bottom: showControlsOverlay ? 80 : 20,
          left: 20,
          right: 20,
        }}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: Spacing.sm }}
          >
            {products.map((product, index) => (
              <View key={product.id} style={{ marginRight: Spacing.base }}>
                <ProductCard 
                  product={product} 
                  onPress={() => handleProductPress(product)}
                />
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Hotspot Toggle Button */}
      {isInteractive && hotspots.length > 0 && (
        <TouchableOpacity
          onPress={toggleHotspots}
          style={{
            position: 'absolute',
            top: 20,
            right: 20,
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: showHotspots ? Colors.primary : Colors.surface,
            justifyContent: 'center',
            alignItems: 'center',
            ...Shadows.base,
          }}
        >
          <Ionicons 
            name={showHotspots ? 'eye' : 'eye-off'} 
            size={20} 
            color={showHotspots ? Colors.textPrimary : Colors.textSecondary} 
          />
        </TouchableOpacity>
      )}

      {/* Product Modal */}
      <Modal
        visible={showProductModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowProductModal(false)}
      >
        <View style={{
          flex: 1,
          backgroundColor: Colors.overlay,
          justifyContent: 'center',
          alignItems: 'center',
        }}>
          <View style={{
            backgroundColor: Colors.surface,
            borderRadius: BorderRadius.xl,
            padding: Spacing.xl,
            margin: Spacing.lg,
            maxWidth: screenWidth * 0.9,
            ...Shadows.xl,
          }}>
            {selectedProduct && (
              <View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.lg }}>
                  <Text style={{
                    color: Colors.textPrimary,
                    fontSize: Typography.xl,
                    fontWeight: Typography.bold,
                  }}>
                    Product Details
                  </Text>
                  <TouchableOpacity onPress={() => setShowProductModal(false)}>
                    <Ionicons name="close" size={24} color={Colors.textSecondary} />
                  </TouchableOpacity>
                </View>
                
                <ProductCard product={selectedProduct} onPress={() => handleProductPress(selectedProduct)} />
                
                <View style={{ marginTop: Spacing.lg, gap: Spacing.sm }}>
                  <EnhancedButton
                    title="Buy Now"
                    onPress={() => handleProductPress(selectedProduct)}
                    icon="shopping-cart"
                    variant="primary"
                    fullWidth
                  />
                  <EnhancedButton
                    title="Close"
                    onPress={() => setShowProductModal(false)}
                    variant="secondary"
                    fullWidth
                  />
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}; 