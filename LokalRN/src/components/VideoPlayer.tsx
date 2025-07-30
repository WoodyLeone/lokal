import React, { useRef, useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Dimensions, ActivityIndicator } from 'react-native';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';

interface VideoPlayerProps {
  uri: string;
  onLoad?: (duration: number) => void;
  onProgress?: (progress: number) => void;
  autoPlay?: boolean;
  loop?: boolean;
  showControls?: boolean;
  style?: any;
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
  style 
}) => {
  const videoRef = useRef<Video>(null);
  const [status, setStatus] = useState<AVPlaybackStatus | null>(null);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [showControlsOverlay, setShowControlsOverlay] = useState(false);

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
    if (data.isLoaded && onProgress) {
      const progress = data.positionMillis / (data.durationMillis || 1);
      onProgress(progress);
    }
  };

  const handleVideoPress = () => {
    if (showControls) {
      setShowControlsOverlay(!showControlsOverlay);
    }
  };

  const formatTime = (millis: number) => {
    const minutes = Math.floor(millis / 60000);
    const seconds = ((millis % 60000) / 1000).toFixed(0);
    return `${minutes}:${seconds.padStart(2, '0')}`;
  };

  const seekTo = async (position: number) => {
    if (videoRef.current && status?.isLoaded && status.durationMillis) {
      const newPosition = position * status.durationMillis;
      await videoRef.current.setPositionAsync(newPosition);
    }
  };

  if (hasError) {
    return (
      <View style={[{ width: '100%', height: videoHeight, backgroundColor: '#1e293b', justifyContent: 'center', alignItems: 'center' }, style]}>
        <Ionicons name="alert-circle-outline" size={48} color="#ef4444" />
        <Text style={{ color: '#f8fafc', fontSize: 16, marginTop: 12, textAlign: 'center' }}>
          Failed to load video
        </Text>
        <Text style={{ color: '#94a3b8', fontSize: 14, marginTop: 4, textAlign: 'center' }}>
          Please check your connection and try again
        </Text>
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
          }}
          onPress={handleVideoPress}
          activeOpacity={1}
        >
          <View style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: 'rgba(0,0,0,0.8)',
            padding: 16,
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <TouchableOpacity onPress={handlePlayPause} style={{ padding: 8 }}>
                <Ionicons 
                  name={isPlaying ? 'pause' : 'play'} 
                  size={24} 
                  color="#fff" 
                />
              </TouchableOpacity>
              
              <View style={{ flex: 1, marginHorizontal: 16 }}>
                <View style={{ 
                  height: 4, 
                  backgroundColor: 'rgba(255,255,255,0.3)', 
                  borderRadius: 2,
                  overflow: 'hidden'
                }}>
                  <View style={{
                    height: '100%',
                    backgroundColor: '#6366f1',
                    width: status?.isLoaded ? `${(status.positionMillis / (status.durationMillis || 1)) * 100}%` : '0%'
                  }} />
                </View>
              </View>
              
              <Text style={{ color: '#fff', fontSize: 12, minWidth: 80, textAlign: 'right' }}>
                {status?.isLoaded 
                  ? `${formatTime(status.positionMillis)} / ${formatTime(status.durationMillis || 0)}`
                  : '0:00 / 0:00'
                }
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      )}

      {/* Play Button Overlay (when paused and no controls shown) */}
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
    </View>
  );
}; 