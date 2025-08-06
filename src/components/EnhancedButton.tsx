import React, { useState } from 'react';
import { 
  TouchableOpacity, 
  Text, 
  ActivityIndicator, 
  StyleSheet, 
  ViewStyle, 
  TextStyle,
  Animated,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Colors, Typography, Spacing, BorderRadius, Shadows, Animation } from '../utils/designSystem';

interface EnhancedButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  loading?: boolean;
  disabled?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  iconPosition?: 'left' | 'right';
  style?: ViewStyle;
  textStyle?: TextStyle;
  hapticFeedback?: boolean;
  fullWidth?: boolean;
}

const { width: screenWidth } = Dimensions.get('window');

export const EnhancedButton: React.FC<EnhancedButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  loading = false,
  disabled = false,
  icon,
  iconPosition = 'left',
  style,
  textStyle,
  hapticFeedback = true,
  fullWidth = false,
}) => {
  const [scaleValue] = useState(new Animated.Value(1));
  const [isPressed, setIsPressed] = useState(false);

  const handlePressIn = () => {
    if (disabled || loading) return;
    
    setIsPressed(true);
    Animated.spring(scaleValue, {
      toValue: 0.95,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();

    if (hapticFeedback) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handlePressOut = () => {
    if (disabled || loading) return;
    
    setIsPressed(false);
    Animated.spring(scaleValue, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  };

  const handlePress = () => {
    if (disabled || loading) return;
    onPress();
  };

  const getButtonStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: BorderRadius.lg,
      ...Shadows.base,
    };

    // Size styles
    switch (size) {
      case 'small':
        baseStyle.paddingVertical = Spacing.sm;
        baseStyle.paddingHorizontal = Spacing.base;
        break;
      case 'large':
        baseStyle.paddingVertical = Spacing.lg;
        baseStyle.paddingHorizontal = Spacing['2xl'];
        break;
      default: // medium
        baseStyle.paddingVertical = Spacing.base;
        baseStyle.paddingHorizontal = Spacing.xl;
    }

    // Width
    if (fullWidth) {
      baseStyle.width = screenWidth - (Spacing.lg * 2);
    }

    // Variant styles
    switch (variant) {
      case 'secondary':
        baseStyle.backgroundColor = Colors.surface;
        baseStyle.borderWidth = 1;
        baseStyle.borderColor = Colors.border;
        break;
      case 'outline':
        baseStyle.backgroundColor = 'transparent';
        baseStyle.borderWidth = 2;
        baseStyle.borderColor = Colors.primary;
        break;
      case 'ghost':
        baseStyle.backgroundColor = 'transparent';
        break;
      default: // primary
        baseStyle.backgroundColor = Colors.primary;
    }

    // Disabled state
    if (disabled || loading) {
      baseStyle.backgroundColor = Colors.interactiveDisabled;
      baseStyle.opacity = 0.6;
    }

    // Pressed state
    if (isPressed && !disabled && !loading) {
      baseStyle.backgroundColor = variant === 'primary' ? Colors.primaryDark : Colors.surfaceLight;
    }

    return baseStyle;
  };

  const getTextStyle = (): TextStyle => {
    const baseStyle: TextStyle = {
      fontWeight: Typography.semibold,
      textAlign: 'center',
    };

    // Size styles
    switch (size) {
      case 'small':
        baseStyle.fontSize = Typography.sm;
        break;
      case 'large':
        baseStyle.fontSize = Typography.lg;
        break;
      default: // medium
        baseStyle.fontSize = Typography.base;
    }

    // Variant styles
    switch (variant) {
      case 'outline':
        baseStyle.color = Colors.primary;
        break;
      case 'ghost':
        baseStyle.color = Colors.primary;
        break;
      default:
        baseStyle.color = Colors.textPrimary;
    }

    // Disabled state
    if (disabled || loading) {
      baseStyle.color = Colors.textSecondary;
    }

    return baseStyle;
  };

  const getIconStyle = () => {
    const iconSize = size === 'small' ? 16 : size === 'large' ? 24 : 20;
    const iconColor = getTextStyle().color;
    const margin = Spacing.sm;

    return {
      size: iconSize,
      color: iconColor,
      marginLeft: iconPosition === 'right' ? margin : 0,
      marginRight: iconPosition === 'left' ? margin : 0,
    };
  };

  const iconStyle = getIconStyle();

  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity
        style={[getButtonStyle(), style]}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
        activeOpacity={1}
        disabled={disabled || loading}
      >
        {loading ? (
          <ActivityIndicator 
            size="small" 
            color={variant === 'primary' ? Colors.textPrimary : Colors.primary} 
          />
        ) : (
          <>
            {icon && iconPosition === 'left' && (
              <Ionicons 
                name={icon} 
                size={iconStyle.size} 
                color={iconStyle.color} 
                style={{ marginRight: iconStyle.marginRight }}
              />
            )}
            <Text style={[getTextStyle(), textStyle]}>{title}</Text>
            {icon && iconPosition === 'right' && (
              <Ionicons 
                name={icon} 
                size={iconStyle.size} 
                color={iconStyle.color} 
                style={{ marginLeft: iconStyle.marginLeft }}
              />
            )}
          </>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}; 