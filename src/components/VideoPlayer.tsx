import React, { useRef, useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, Dimensions, ActivityIndicator, Modal, Alert } from 'react-native';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { Hotspot, ObjectDetection, ProductMatch } from '../types';
import { isValidVideoUrl } from '../utils/helpers';

interface VideoPlayerProps {
  uri: string;
  onLoad?: (duration: number) => void;
  onProgress?: (progress: number) => void;
  autoPlay?: boolean;
  loop?: boolean;
  showControls?: boolean;
  style?: any;
  hotspots?: Hotspot[];
  onHotspotPress?: (hotspot: Hotspot) => void;
  isInteractive?: boolean;
  // Enhanced tracking integration
  objectDetections?: ObjectDetection[];
  productMatches?: ProductMatch[];
  onObjectSelect?: (detection: ObjectDetection) => void;
  onProductSelect?: (match: ProductMatch) => void;
  enablePauseOnObject?: boolean;
  enableBuyOverlay?: boolean;
}

const { width } = Dimensions.get('window');
const videoHeight = width * 0.75;

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ 
  uri, 
  onLoad, 
  onProgress, 
  autoPlay = false, 
  loop = false, 
  showControls = true,
  style,
  hotspots = [],
  onHotspotPress,
  isInteractive = false,
  objectDetections = [],
  productMatches = [],
  onObjectSelect,
  onProductSelect,
  enablePauseOnObject = true,
  enableBuyOverlay = true
}) => {
  const videoRef = useRef<Video>(null);
  const [status, setStatus] = useState<AVPlaybackStatus | null>(null);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [showControlsOverlay, setShowControlsOverlay] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [showProductModal, setShowProductModal] = useState(false);
  const [selectedHotspot, setSelectedHotspot] = useState<Hotspot | null>(null);
  const [isUrlValid, setIsUrlValid] = useState(true);
  
  // Enhanced tracking state
  const [currentFrameObjects, setCurrentFrameObjects] = useState<ObjectDetection[]>([]);
  const [pausedObject, setPausedObject] = useState<ObjectDetection | null>(null);
  const [showBuyOverlay, setShowBuyOverlay] = useState(false);
  const [selectedObject, setSelectedObject] = useState<ObjectDetection | null>(null);
  const [videoDuration, setVideoDuration] = useState(0);

  useEffect(() => {
    // Validate URL on component mount
    const valid = isValidVideoUrl(uri);
    setIsUrlValid(valid);
    
    if (!valid) {
      console.warn('Invalid video URL:', uri);
      setHasError(true);
      setIsLoading(false);
    }
  }, [uri]);

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

  // Enhanced tracking integration
  useEffect(() => {
    if (objectDetections.length > 0 && videoDuration > 0) {
      updateCurrentFrameObjects();
    }
  }, [currentTime, objectDetections, videoDuration]);

  const updateCurrentFrameObjects = useCallback(() => {
    const currentTimeSeconds = currentTime / 1000;
    const frameRate = 30; // Assuming 30 FPS, could be made configurable
    const currentFrame = Math.floor(currentTimeSeconds * frameRate);
    
    const objectsInFrame = objectDetections.filter(detection => 
      detection.frame_number === currentFrame
    );
    
    setCurrentFrameObjects(objectsInFrame);
  }, [currentTime, objectDetections]);

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
    if (data.isLoaded) {
      setVideoDuration(data.durationMillis || 0);
      if (onLoad) {
        onLoad(data.durationMillis || 0);
      }
    }
  };

  const handleError = (error: string) => {
    console.error('Video error:', error);
    setIsLoading(false);
    setHasError(true);
  };

  const handleProgress = (data: AVPlaybackStatus) => {
    if (data.isLoaded) {
      const newTime = data.positionMillis || 0;
      setCurrentTime(newTime);
      
      if (onProgress) {
        onProgress(newTime / (data.durationMillis || 1));
      }
      
      // Check for pause on object detection
      if (enablePauseOnObject && isPlaying && currentFrameObjects.length > 0) {
        const shouldPause = currentFrameObjects.some(obj => obj.confidence > 0.8);
        if (shouldPause && !pausedObject) {
          handlePauseOnObject(currentFrameObjects[0]);
        }
      }
    }
  };

  const handlePauseOnObject = async (object: ObjectDetection) => {
    if (videoRef.current && isPlaying) {
      await videoRef.current.pauseAsync();
      setIsPlaying(false);
      setPausedObject(object);
      setShowBuyOverlay(true);
      
      // Auto-resume after 5 seconds if no interaction
      setTimeout(() => {
        if (showBuyOverlay) {
          handleResumeFromPause();
        }
      }, 5000);
    }
  };

  const handleResumeFromPause = async () => {
    if (videoRef.current && !isPlaying) {
      await videoRef.current.playAsync();
      setIsPlaying(true);
      setPausedObject(null);
      setShowBuyOverlay(false);
    }
  };

  const handleObjectPress = (object: ObjectDetection) => {
    setSelectedObject(object);
    
    // Find associated product match
    const productMatch = productMatches.find(match => 
      match.track_id === object.track_id
    );
    
    if (productMatch) {
      setSelectedHotspot({
        id: `object-${object.track_id}`,
        x: object.bbox.x,
        y: object.bbox.y,
        startTime: currentTime,
        endTime: currentTime + 1000,
        product: productMatch
      });
      setShowProductModal(true);
    }
    
    if (onObjectSelect) {
      onObjectSelect(object);
    }
  };

  const handleBuyPress = () => {
    if (selectedObject) {
      const productMatch = productMatches.find(match => 
        match.track_id === selectedObject.track_id
      );
      
      if (productMatch && productMatch.affiliate_link) {
        // Open affiliate link or handle purchase flow
        Alert.alert(
          'Purchase Product',
          `Would you like to purchase ${productMatch.product_name}?`,
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Buy Now', 
              onPress: () => {
                if (onProductSelect) {
                  onProductSelect(productMatch);
                }
                // Here you would typically open the affiliate link
                console.log('Opening affiliate link:', productMatch.affiliate_link);
              }
            }
          ]
        );
      }
    }
  };

  const handleVideoPress = () => {
    setShowControlsOverlay(!showControlsOverlay);
  };

  const formatTime = (millis: number) => {
    const seconds = Math.floor(millis / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const seekTo = async (position: number) => {
    if (videoRef.current && status?.isLoaded) {
      const newPosition = position * (status.durationMillis || 0);
      await videoRef.current.setPositionAsync(newPosition);
    }
  };

  // Check if hotspot should be visible at current time
  const isHotspotVisible = (hotspot: Hotspot) => {
    return currentTime >= hotspot.startTime && currentTime <= hotspot.endTime;
  };

  // Handle hotspot press
  const handleHotspotPress = (hotspot: Hotspot) => {
    if (onHotspotPress) {
      onHotspotPress(hotspot);
    } else {
      setSelectedHotspot(hotspot);
      setShowProductModal(true);
    }
  };

  // Render object detection overlay
  const renderObjectDetections = () => {
    if (!isInteractive || currentFrameObjects.length === 0) return null;
    
    return currentFrameObjects.map((object) => (
      <TouchableOpacity
        key={`${object.track_id}-${object.frame_number}`}
        style={{
          position: 'absolute',
          left: `${object.bbox.x}%`,
          top: `${object.bbox.y}%`,
          width: `${object.bbox.width}%`,
          height: `${object.bbox.height}%`,
          borderWidth: 2,
          borderColor: object.confidence > 0.8 ? '#10b981' : '#f59e0b',
          borderRadius: 4,
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          justifyContent: 'center',
          alignItems: 'center',
        }}
        onPress={() => handleObjectPress(object)}
        activeOpacity={0.7}
      >
        <View style={{
          position: 'absolute',
          top: -25,
          left: 0,
          backgroundColor: object.confidence > 0.8 ? '#10b981' : '#f59e0b',
          paddingHorizontal: 6,
          paddingVertical: 2,
          borderRadius: 10,
        }}>
          <Text style={{ color: '#ffffff', fontSize: 10, fontWeight: 'bold' }}>
            {object.class_name} ({Math.round(object.confidence * 100)}%)
          </Text>
        </View>
      </TouchableOpacity>
    ));
  };

  // Render buy overlay when paused on object
  const renderBuyOverlay = () => {
    if (!showBuyOverlay || !pausedObject) return null;
    
    return (
      <View style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        justifyContent: 'center',
        alignItems: 'center',
      }}>
        <View style={{
          backgroundColor: '#ffffff',
          borderRadius: 12,
          padding: 20,
          margin: 20,
          alignItems: 'center',
        }}>
          <Ionicons name="bag" size={48} color="#6366f1" />
          <Text style={{ fontSize: 18, fontWeight: 'bold', marginTop: 12, textAlign: 'center' }}>
            Object Detected!
          </Text>
          <Text style={{ fontSize: 14, color: '#64748b', marginTop: 8, textAlign: 'center' }}>
            {pausedObject.class_name} detected with {Math.round(pausedObject.confidence * 100)}% confidence
          </Text>
          
          <View style={{ flexDirection: 'row', marginTop: 20, gap: 12 }}>
            <TouchableOpacity
              style={{
                backgroundColor: '#64748b',
                paddingHorizontal: 20,
                paddingVertical: 10,
                borderRadius: 8,
              }}
              onPress={handleResumeFromPause}
            >
              <Text style={{ color: '#ffffff', fontWeight: 'bold' }}>Continue</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={{
                backgroundColor: '#6366f1',
                paddingHorizontal: 20,
                paddingVertical: 10,
                borderRadius: 8,
              }}
              onPress={handleBuyPress}
            >
              <Text style={{ color: '#ffffff', fontWeight: 'bold' }}>Buy Now</Text>
            </TouchableOpacity>
          </View>
        </View>
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
    <View style={[{ width: '100%', height: videoHeight, backgroundColor: '#000' }, style]}>
      <Video
        ref={videoRef}
        source={{ uri }}
        style={{ width: '100%', height: '100%' }}
        resizeMode={ResizeMode.CONTAIN}
        shouldPlay={autoPlay}
        isLooping={loop}
        onPlaybackStatusUpdate={(status) => {
          setStatus(status);
          handleProgress(status);
        }}
        onLoad={handleLoad}
        onError={handleError}
      />
      
      {/* Interactive Hotspots */}
      {isInteractive && hotspots.map((hotspot) => {
        const isVisible = isHotspotVisible(hotspot);
        if (!isVisible) return null;
        
        return (
          <TouchableOpacity
            key={hotspot.id}
            style={{
              position: 'absolute',
              left: `${hotspot.x}%`,
              top: `${hotspot.y}%`,
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: 'rgba(99, 102, 241, 0.8)',
              borderWidth: 3,
              borderColor: '#ffffff',
              justifyContent: 'center',
              alignItems: 'center',
              transform: [{ translateX: -20 }, { translateY: -20 }],
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.3,
              shadowRadius: 4,
              elevation: 5,
            }}
            onPress={() => handleHotspotPress(hotspot)}
            activeOpacity={0.7}
          >
            <Ionicons name="bag" size={20} color="#ffffff" />
          </TouchableOpacity>
        );
      })}
      
      {/* Loading Overlay */}
      {isLoading && (
        <View style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.7)',
          justifyContent: 'center',
          alignItems: 'center',
        }}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={{ color: '#f8fafc', marginTop: 12 }}>Loading video...</Text>
        </View>
      )}
      
      {/* Custom Controls Overlay */}
      {showControls && (showControlsOverlay || isLoading) && (
        <TouchableOpacity
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.3)',
          }}
          onPress={handleVideoPress}
        >
          <View style={{
            position: 'absolute',
            bottom: 20,
            left: 20,
            right: 20,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <Text style={{ color: '#f8fafc', fontSize: 14 }}>
              {status?.isLoaded ? formatTime(status.positionMillis || 0) : '0:00'}
            </Text>
            
            <TouchableOpacity
              style={{
                width: 50,
                height: 50,
                borderRadius: 25,
                backgroundColor: 'rgba(0,0,0,0.7)',
                justifyContent: 'center',
                alignItems: 'center',
              }}
              onPress={handlePlayPause}
            >
              <Ionicons 
                name={isPlaying ? 'pause' : 'play'} 
                size={24} 
                color="#fff" 
              />
            </TouchableOpacity>
            
            <Text style={{ color: '#f8fafc', fontSize: 14 }}>
              {status?.isLoaded ? formatTime(status.durationMillis || 0) : '0:00'}
            </Text>
          </View>
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
            backgroundColor: 'rgba(0,0,0,0.7)',
            justifyContent: 'center',
            alignItems: 'center',
          }}>
            <Ionicons name="play" size={24} color="#fff" />
          </View>
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
          backgroundColor: 'rgba(0,0,0,0.5)',
          justifyContent: 'center',
          alignItems: 'center',
          padding: 20,
        }}>
          <View style={{
            backgroundColor: '#ffffff',
            borderRadius: 16,
            padding: 24,
            width: '100%',
            maxWidth: 400,
          }}>
            {selectedHotspot?.product && (
              <>
                <View style={{ alignItems: 'center', marginBottom: 20 }}>
                  <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#000000', marginBottom: 8 }}>
                    {selectedHotspot.product.name}
                  </Text>
                  <Text style={{ fontSize: 18, color: '#6366f1', fontWeight: '600' }}>
                    ${selectedHotspot.product.price}
                  </Text>
                </View>
                
                <View style={{ flexDirection: 'row', gap: 12 }}>
                  <TouchableOpacity
                    style={{
                      flex: 1,
                      backgroundColor: '#374151',
                      paddingVertical: 12,
                      borderRadius: 8,
                      alignItems: 'center',
                    }}
                    onPress={() => setShowProductModal(false)}
                  >
                    <Text style={{ color: '#ffffff', fontWeight: '600' }}>
                      Cancel
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={{
                      flex: 1,
                      backgroundColor: '#6366f1',
                      paddingVertical: 12,
                      borderRadius: 8,
                      alignItems: 'center',
                    }}
                    onPress={() => {
                      // Handle purchase - open link or navigate to product
                      setShowProductModal(false);
                    }}
                  >
                    <Text style={{ color: '#ffffff', fontWeight: '600' }}>
                      Buy Now
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Object Detection Overlay */}
      {renderObjectDetections()}

      {/* Buy Overlay */}
      {renderBuyOverlay()}
    </View>
  );
}; 