import React, { useRef, useState } from 'react';
import { View, Text, TouchableOpacity, Dimensions } from 'react-native';
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
    if (data.isLoaded && onLoad) {
      onLoad(data.durationMillis || 0);
    }
  };

  const handleProgress = (data: AVPlaybackStatus) => {
    if (data.isLoaded && onProgress) {
      const progress = data.positionMillis / (data.durationMillis || 1);
      onProgress(progress);
    }
  };

  const formatTime = (millis: number) => {
    const minutes = Math.floor(millis / 60000);
    const seconds = ((millis % 60000) / 1000).toFixed(0);
    return `${minutes}:${seconds.padStart(2, '0')}`;
  };

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
      />
      
      {/* Custom Controls Overlay */}
      {showControls && (
        <View style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: 'rgba(0,0,0,0.7)',
          padding: 16,
        }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <TouchableOpacity onPress={handlePlayPause}>
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
          
          <Text style={{ color: '#fff', fontSize: 12 }}>
            {status?.isLoaded 
              ? `${formatTime(status.positionMillis)} / ${formatTime(status.durationMillis || 0)}`
              : '0:00 / 0:00'
            }
          </Text>
        </View>
        </View>
      )}
    </View>
  );
}; 