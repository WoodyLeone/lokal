import React, { useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  ActivityIndicator, 
  StyleSheet, 
  Animated, 
  Dimensions,
  ViewStyle
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius, Animation } from '../utils/designSystem';

interface EnhancedLoadingProps {
  type?: 'spinner' | 'dots' | 'pulse' | 'progress';
  size?: 'small' | 'medium' | 'large';
  text?: string;
  subtitle?: string;
  progress?: number; // 0-100
  showIcon?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  style?: ViewStyle;
  color?: string;
  backgroundColor?: string;
}

const { width: screenWidth } = Dimensions.get('window');

export const EnhancedLoading: React.FC<EnhancedLoadingProps> = ({
  type = 'spinner',
  size = 'medium',
  text,
  subtitle,
  progress,
  showIcon = true,
  icon = 'hourglass-outline',
  style,
  color = Colors.primary,
  backgroundColor = Colors.background,
}) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const dotsAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  // Pulse animation
  useEffect(() => {
    if (type === 'pulse') {
      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: Animation.normal,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: Animation.normal,
            useNativeDriver: true,
          }),
        ])
      );
      pulseAnimation.start();
      return () => pulseAnimation.stop();
    }
  }, [type, pulseAnim]);

  // Rotation animation
  useEffect(() => {
    if (type === 'spinner') {
      const rotateAnimation = Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        })
      );
      rotateAnimation.start();
      return () => rotateAnimation.stop();
    }
  }, [type, rotateAnim]);

  // Dots animation
  useEffect(() => {
    if (type === 'dots') {
      const dotsAnimation = Animated.loop(
        Animated.timing(dotsAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        })
      );
      dotsAnimation.start();
      return () => dotsAnimation.stop();
    }
  }, [type, dotsAnim]);

  // Progress animation
  useEffect(() => {
    if (type === 'progress' && progress !== undefined) {
      Animated.timing(progressAnim, {
        toValue: progress / 100,
        duration: Animation.normal,
        useNativeDriver: false,
      }).start();
    }
  }, [type, progress, progressAnim]);

  const getSize = () => {
    switch (size) {
      case 'small':
        return { icon: 24, text: Typography.sm, container: 80 };
      case 'large':
        return { icon: 48, text: Typography.xl, container: 120 };
      default: // medium
        return { icon: 32, text: Typography.lg, container: 100 };
    }
  };

  const sizeConfig = getSize();

  const renderSpinner = () => (
    <Animated.View
      style={{
        transform: [
          {
            rotate: rotateAnim.interpolate({
              inputRange: [0, 1],
              outputRange: ['0deg', '360deg'],
            }),
          },
        ],
      }}
    >
      <ActivityIndicator size={sizeConfig.icon} color={color} />
    </Animated.View>
  );

  const renderDots = () => (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      {[0, 1, 2].map((index) => (
        <Animated.View
          key={index}
          style={{
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: color,
            marginHorizontal: 4,
            opacity: dotsAnim.interpolate({
              inputRange: [0, 0.33, 0.66, 1],
              outputRange: [0.3, 1, 0.3, 0.3],
              extrapolate: 'clamp',
            }),
            transform: [
              {
                scale: dotsAnim.interpolate({
                  inputRange: [0, 0.33, 0.66, 1],
                  outputRange: [0.8, 1.2, 0.8, 0.8],
                  extrapolate: 'clamp',
                }),
              },
            ],
          }}
        />
      ))}
    </View>
  );

  const renderPulse = () => (
    <Animated.View
      style={{
        transform: [{ scale: pulseAnim }],
        opacity: pulseAnim.interpolate({
          inputRange: [1, 1.2],
          outputRange: [0.8, 1],
        }),
      }}
    >
      {showIcon && (
        <Ionicons name={icon} size={sizeConfig.icon} color={color} />
      )}
    </Animated.View>
  );

  const renderProgress = () => (
    <View style={{ width: sizeConfig.container * 2, alignItems: 'center' }}>
      <View
        style={{
          width: '100%',
          height: 8,
          backgroundColor: Colors.surfaceLight,
          borderRadius: BorderRadius.full,
          overflow: 'hidden',
          marginBottom: Spacing.sm,
        }}
      >
        <Animated.View
          style={{
            height: '100%',
            backgroundColor: color,
            borderRadius: BorderRadius.full,
            width: progressAnim.interpolate({
              inputRange: [0, 1],
              outputRange: ['0%', '100%'],
            }),
          }}
        />
      </View>
      {progress !== undefined && (
        <Text style={{
          color: Colors.textSecondary,
          fontSize: Typography.sm,
          fontWeight: Typography.medium,
        }}>
          {Math.round(progress)}%
        </Text>
      )}
    </View>
  );

  const renderLoader = () => {
    switch (type) {
      case 'dots':
        return renderDots();
      case 'pulse':
        return renderPulse();
      case 'progress':
        return renderProgress();
      default: // spinner
        return renderSpinner();
    }
  };

  return (
    <View
      style={[
        {
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor,
          padding: Spacing.xl,
        },
        style,
      ]}
    >
      <View style={{ alignItems: 'center' }}>
        {renderLoader()}
        
        {text && (
          <Text
            style={{
              color: Colors.textPrimary,
              fontSize: sizeConfig.text,
              fontWeight: Typography.semibold,
              textAlign: 'center',
              marginTop: Spacing.lg,
              marginBottom: subtitle ? Spacing.xs : 0,
            }}
          >
            {text}
          </Text>
        )}
        
        {subtitle && (
          <Text
            style={{
              color: Colors.textSecondary,
              fontSize: Typography.sm,
              textAlign: 'center',
              lineHeight: Typography.sm * Typography.normal,
            }}
          >
            {subtitle}
          </Text>
        )}
      </View>
    </View>
  );
};

// Specialized loading components for common use cases
export const VideoLoading: React.FC<{ progress?: number }> = ({ progress }) => (
  <EnhancedLoading
    type="progress"
    text="Processing Video"
    subtitle="Analyzing content and detecting objects..."
    progress={progress}
    icon="videocam-outline"
    size="large"
  />
);

export const UploadLoading: React.FC<{ progress?: number }> = ({ progress }) => (
  <EnhancedLoading
    type="progress"
    text="Uploading Video"
    subtitle="Please wait while we upload your content..."
    progress={progress}
    icon="cloud-upload-outline"
    size="large"
  />
);

export const ProcessingLoading: React.FC = () => (
  <EnhancedLoading
    type="dots"
    text="Processing"
    subtitle="AI is analyzing your video..."
    icon="brain-outline"
    size="medium"
  />
);

export const NetworkLoading: React.FC = () => (
  <EnhancedLoading
    type="pulse"
    text="Connecting"
    subtitle="Establishing connection to server..."
    icon="wifi-outline"
    size="medium"
  />
); 