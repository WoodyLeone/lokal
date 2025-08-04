import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  ViewStyle, 
  Animated,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Typography, Spacing, BorderRadius, Shadows, Animation } from '../utils/designSystem';

interface EnhancedCardProps {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  onPress?: () => void;
  variant?: 'default' | 'elevated' | 'outlined' | 'gradient';
  size?: 'small' | 'medium' | 'large';
  style?: ViewStyle;
  headerStyle?: ViewStyle;
  contentStyle?: ViewStyle;
  showShadow?: boolean;
  interactive?: boolean;
  loading?: boolean;
  badge?: string;
  badgeColor?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  gradientColors?: string[];
}

const { width: screenWidth } = Dimensions.get('window');

export const EnhancedCard: React.FC<EnhancedCardProps> = ({
  title,
  subtitle,
  children,
  onPress,
  variant = 'default',
  size = 'medium',
  style,
  headerStyle,
  contentStyle,
  showShadow = true,
  interactive = false,
  loading = false,
  badge,
  badgeColor = Colors.primary,
  icon,
  iconColor = Colors.primary,
  gradientColors = [Colors.surface, Colors.surfaceLight],
}) => {
  const [scaleValue] = useState(new Animated.Value(1));
  const [isPressed, setIsPressed] = useState(false);

  const handlePressIn = () => {
    if (!interactive || loading) return;
    
    setIsPressed(true);
    Animated.spring(scaleValue, {
      toValue: 0.98,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  };

  const handlePressOut = () => {
    if (!interactive || loading) return;
    
    setIsPressed(false);
    Animated.spring(scaleValue, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  };

  const getCardStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      borderRadius: BorderRadius.xl,
      overflow: 'hidden',
    };

    // Size styles
    switch (size) {
      case 'small':
        baseStyle.padding = Spacing.base;
        baseStyle.margin = Spacing.sm;
        break;
      case 'large':
        baseStyle.padding = Spacing.xl;
        baseStyle.margin = Spacing.lg;
        break;
      default: // medium
        baseStyle.padding = Spacing.lg;
        baseStyle.margin = Spacing.base;
    }

    // Variant styles
    switch (variant) {
      case 'elevated':
        baseStyle.backgroundColor = Colors.surface;
        if (showShadow) {
          Object.assign(baseStyle, Shadows.lg);
        }
        break;
      case 'outlined':
        baseStyle.backgroundColor = Colors.surface;
        baseStyle.borderWidth = 1;
        baseStyle.borderColor = Colors.border;
        break;
      case 'gradient':
        // Gradient will be handled by LinearGradient wrapper
        break;
      default: // default
        baseStyle.backgroundColor = Colors.surface;
        if (showShadow) {
          Object.assign(baseStyle, Shadows.base);
        }
    }

    // Interactive state
    if (interactive && isPressed) {
      baseStyle.opacity = 0.8;
    }

    // Loading state
    if (loading) {
      baseStyle.opacity = 0.6;
    }

    return baseStyle;
  };

  const getHeaderStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: Spacing.base,
    };

    return baseStyle;
  };

  const getContentStyle = (): ViewStyle => {
    return {
      flex: 1,
    };
  };

  const renderHeader = () => {
    if (!title && !subtitle && !icon && !badge) return null;

    return (
      <View style={[getHeaderStyle(), headerStyle]}>
        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
          {icon && (
            <Ionicons 
              name={icon} 
              size={Typography.lg} 
              color={iconColor} 
              style={{ marginRight: Spacing.sm }}
            />
          )}
          <View style={{ flex: 1 }}>
            {title && (
              <Text style={{
                color: Colors.textPrimary,
                fontSize: Typography.lg,
                fontWeight: Typography.semibold,
                marginBottom: subtitle ? Spacing.xs : 0,
              }}>
                {title}
              </Text>
            )}
            {subtitle && (
              <Text style={{
                color: Colors.textSecondary,
                fontSize: Typography.sm,
                lineHeight: Typography.sm * Typography.normal,
              }}>
                {subtitle}
              </Text>
            )}
          </View>
        </View>
        
        {badge && (
          <View style={{
            backgroundColor: badgeColor,
            paddingHorizontal: Spacing.sm,
            paddingVertical: Spacing.xs,
            borderRadius: BorderRadius.full,
            marginLeft: Spacing.sm,
          }}>
            <Text style={{
              color: Colors.textPrimary,
              fontSize: Typography.xs,
              fontWeight: Typography.semibold,
            }}>
              {badge}
            </Text>
          </View>
        )}
      </View>
    );
  };

  const renderContent = () => {
    if (loading) {
      return (
        <View style={{ alignItems: 'center', paddingVertical: Spacing.xl }}>
          <Ionicons name="hourglass-outline" size={32} color={Colors.textSecondary} />
          <Text style={{
            color: Colors.textSecondary,
            fontSize: Typography.sm,
            marginTop: Spacing.sm,
          }}>
            Loading...
          </Text>
        </View>
      );
    }

    return children;
  };

  const cardContent = (
    <View style={[getCardStyle(), style]}>
      {renderHeader()}
      <View style={[getContentStyle(), contentStyle]}>
        {renderContent()}
      </View>
    </View>
  );

  // Wrap with gradient if variant is gradient
  if (variant === 'gradient') {
    return (
      <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
        <TouchableOpacity
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          onPress={onPress}
          activeOpacity={1}
          disabled={!interactive || loading}
        >
          <LinearGradient
            colors={gradientColors}
            style={[getCardStyle(), style]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            {renderHeader()}
            <View style={[getContentStyle(), contentStyle]}>
              {renderContent()}
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    );
  }

  // Regular card with optional interaction
  if (interactive) {
    return (
      <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
        <TouchableOpacity
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          onPress={onPress}
          activeOpacity={1}
          disabled={loading}
        >
          {cardContent}
        </TouchableOpacity>
      </Animated.View>
    );
  }

  return cardContent;
}; 