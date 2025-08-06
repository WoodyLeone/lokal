import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, Dimensions, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ProductFrontend } from '../types';
import { 
  Colors, 
  Typography, 
  Spacing, 
  BorderRadius, 
  Shadows, 
  ComponentStyles,
  Animations,
  Icons,
  TouchTargets
} from '../utils/designSystem';

const { width: screenWidth } = Dimensions.get('window');

interface ProductCardProps {
  product: ProductFrontend;
  onPress?: () => void;
  compact?: boolean;
  showPrice?: boolean;
  showRating?: boolean;
  variant?: 'default' | 'shoppable' | 'minimal' | 'enhanced' | 'modal';
  showBuyButton?: boolean;
  animated?: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = ({ 
  product, 
  onPress, 
  compact = false,
  showPrice = true,
  showRating = true,
  variant = 'default',
  showBuyButton = true,
  animated = true
}) => {
  const [scaleAnim] = useState(new Animated.Value(1));
  const [isPressed, setIsPressed] = useState(false);

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
    }).format(price);
  };

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <Ionicons key={`star-${i}`} name="star" size={Icons.sizes.sm} color="#fbbf24" />
      );
    }

    if (hasHalfStar) {
      stars.push(
                  <Ionicons key="star-half" name="star-half-outline" size={Icons.sizes.sm} color="#fbbf24" />
      );
    }

    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <Ionicons key={`star-empty-${i}`} name="star-outline" size={Icons.sizes.sm} color="#d1d5db" />
      );
    }

    return stars;
  };

  const handlePressIn = () => {
    if (animated) {
      setIsPressed(true);
      Animated.spring(scaleAnim, {
        toValue: 0.95,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }).start();
    }
  };

  const handlePressOut = () => {
    if (animated) {
      setIsPressed(false);
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }).start();
    }
  };

  const CardContainer = animated ? Animated.View : View;
  const cardStyle = animated ? { transform: [{ scale: scaleAnim }] } : {};

  if (variant === 'minimal') {
    return (
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={{
          backgroundColor: Colors.surface,
          borderRadius: BorderRadius.md,
          padding: Spacing.sm,
          alignItems: 'center',
          minHeight: TouchTargets.comfortable,
          ...Shadows.sm,
        }}
        activeOpacity={0.7}
      >
        <Image
          source={{ uri: product.imageUrl }}
          style={{
            width: 60,
            height: 60,
            borderRadius: BorderRadius.sm,
            marginBottom: Spacing.xs,
          }}
          resizeMode="cover"
        />
        <Text
          style={{
            color: Colors.textPrimary,
            fontSize: Typography.xs,
            fontWeight: '500',
            textAlign: 'center',
            numberOfLines: 2,
          }}
          numberOfLines={2}
        >
          {product.title}
        </Text>
        {showPrice && (
          <Text
            style={{
              color: Colors.primary,
              fontSize: Typography.xs,
              fontWeight: '600',
              marginTop: Spacing.xs,
            }}
          >
            {formatPrice(product.price, product.currency)}
          </Text>
        )}
      </TouchableOpacity>
    );
  }

  if (compact) {
    return (
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={{
          backgroundColor: Colors.surface,
          borderRadius: BorderRadius.md,
          overflow: 'hidden',
          width: 120,
          minHeight: TouchTargets.comfortable,
          ...Shadows.sm,
        }}
        activeOpacity={0.7}
      >
        <Image
          source={{ uri: product.imageUrl }}
          style={{
            width: '100%',
            height: 80,
            resizeMode: 'cover',
          }}
        />
        <View style={{ padding: Spacing.sm }}>
          <Text
            style={{
              color: Colors.textPrimary,
              fontSize: Typography.xs,
              fontWeight: '600',
              marginBottom: Spacing.xs,
              lineHeight: Typography.xs * 1.2,
            }}
            numberOfLines={2}
            ellipsizeMode="tail"
          >
            {product.title}
          </Text>
          {showPrice && (
            <Text
              style={{
                color: Colors.primary,
                fontSize: Typography.xs,
                fontWeight: '700',
              }}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {formatPrice(product.price, product.currency)}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  }

  if (variant === 'shoppable') {
    return (
      <CardContainer style={[ComponentStyles.productCard.container, cardStyle]}>
        <TouchableOpacity
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          activeOpacity={0.7}
        >
          <View style={ComponentStyles.productCard.imageContainer}>
            <Image
              source={{ uri: product.imageUrl }}
              style={{
                width: '100%',
                height: 200,
                resizeMode: 'cover',
              }}
            />
            
            {/* Shoppable Badge */}
            <View style={ComponentStyles.productCard.shoppableBadge}>
              <Ionicons name="bag" size={Icons.sizes.sm} color={Colors.textPrimary} />
            </View>
            
            {/* Price Badge */}
            <View style={ComponentStyles.productCard.priceBadge}>
              <Text style={{
                color: Colors.textPrimary,
                fontSize: Typography.sm,
                fontWeight: '700',
              }}>
                {formatPrice(product.price, product.currency)}
              </Text>
            </View>
          </View>
          
          <View style={{ padding: Spacing.md }}>
            <Text
              style={{
                color: Colors.textPrimary,
                fontSize: Typography.md,
                fontWeight: '600',
                marginBottom: Spacing.xs,
              }}
              numberOfLines={2}
            >
              {product.title}
            </Text>
            
            <Text
              style={{
                color: Colors.textSecondary,
                fontSize: Typography.sm,
                marginBottom: Spacing.sm,
              }}
              numberOfLines={2}
            >
              {product.description}
            </Text>
            
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              {showRating && (
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={{ flexDirection: 'row', marginRight: Spacing.xs }}>
                    {renderStars(product.rating)}
                  </View>
                  <Text style={{
                    color: Colors.textSecondary,
                    fontSize: Typography.xs,
                  }}>
                    ({product.reviewCount})
                  </Text>
                </View>
              )}
              
              {showBuyButton && (
                <TouchableOpacity
                  onPress={onPress}
                  style={{
                    backgroundColor: Colors.primary,
                    paddingHorizontal: Spacing.md,
                    paddingVertical: Spacing.sm,
                    borderRadius: BorderRadius.md,
                    flexDirection: 'row',
                    alignItems: 'center',
                    minHeight: TouchTargets.minimum,
                  }}
                >
                  <Ionicons name="bag-outline" size={Icons.sizes.sm} color={Colors.textPrimary} />
                  <Text style={{
                    color: Colors.textPrimary,
                    fontSize: Typography.sm,
                    fontWeight: '600',
                    marginLeft: Spacing.xs,
                  }}>
                    Shop Now
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </TouchableOpacity>
      </CardContainer>
    );
  }

  if (variant === 'enhanced') {
    return (
      <CardContainer style={[ComponentStyles.productCard.container, cardStyle]}>
        <TouchableOpacity
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          activeOpacity={0.7}
        >
          <View style={ComponentStyles.productCard.imageContainer}>
            <Image
              source={{ uri: product.imageUrl }}
              style={{
                width: '100%',
                height: 220,
                resizeMode: 'cover',
              }}
            />
            
            {/* Enhanced Badges */}
            <View style={ComponentStyles.productCard.shoppableBadge}>
              <Ionicons name="sparkles" size={Icons.sizes.sm} color={Colors.textPrimary} />
            </View>
            
            <View style={ComponentStyles.productCard.priceBadge}>
              <Text style={{
                color: Colors.textPrimary,
                fontSize: Typography.sm,
                fontWeight: '700',
              }}>
                {formatPrice(product.price, product.currency)}
              </Text>
            </View>

            {/* Brand Badge */}
            <View style={{
              position: 'absolute',
              bottom: Spacing.sm,
              left: Spacing.sm,
              backgroundColor: Colors.surface + 'CC',
              paddingHorizontal: Spacing.sm,
              paddingVertical: Spacing.xs,
              borderRadius: BorderRadius.md,
              ...Shadows.sm,
            }}>
              <Text style={{
                color: Colors.textPrimary,
                fontSize: Typography.xs,
                fontWeight: '600',
                textTransform: 'uppercase',
              }}>
                {product.brand}
              </Text>
            </View>
          </View>
          
          <View style={{ padding: Spacing.lg }}>
            <Text
              style={{
                color: Colors.textPrimary,
                fontSize: Typography.lg,
                fontWeight: '700',
                marginBottom: Spacing.xs,
                lineHeight: Typography.lg * 1.3,
              }}
              numberOfLines={2}
            >
              {product.title}
            </Text>
            
            <Text
              style={{
                color: Colors.textSecondary,
                fontSize: Typography.base,
                marginBottom: Spacing.md,
                lineHeight: Typography.base * 1.4,
              }}
              numberOfLines={3}
            >
              {product.description}
            </Text>
            
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.md }}>
              {showRating && (
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={{ flexDirection: 'row', marginRight: Spacing.sm }}>
                    {renderStars(product.rating)}
                  </View>
                  <Text style={{
                    color: Colors.textSecondary,
                    fontSize: Typography.sm,
                    fontWeight: '500',
                  }}>
                    {product.rating.toFixed(1)} ({product.reviewCount})
                  </Text>
                </View>
              )}
              
              <View style={{
                backgroundColor: Colors.success + '20',
                paddingHorizontal: Spacing.sm,
                paddingVertical: Spacing.xs,
                borderRadius: BorderRadius.md,
              }}>
                <Text style={{
                  color: Colors.success,
                  fontSize: Typography.xs,
                  fontWeight: '600',
                  textTransform: 'uppercase',
                }}>
                  In Stock
                </Text>
              </View>
            </View>
            
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View>
                <Text style={{
                  color: Colors.textSecondary,
                  fontSize: Typography.sm,
                  textTransform: 'uppercase',
                  fontWeight: '500',
                  marginBottom: Spacing.xs,
                }}>
                  {product.brand}
                </Text>
                <Text style={{
                  color: Colors.primary,
                  fontSize: Typography.xl,
                  fontWeight: '800',
                }}>
                  {formatPrice(product.price, product.currency)}
                </Text>
              </View>
              
              {showBuyButton && (
                <TouchableOpacity
                  onPress={onPress}
                  style={{
                    backgroundColor: Colors.primary,
                    paddingHorizontal: Spacing.xl,
                    paddingVertical: Spacing.md,
                    borderRadius: BorderRadius.lg,
                    flexDirection: 'row',
                    alignItems: 'center',
                    minHeight: TouchTargets.large,
                    ...Shadows.base,
                  }}
                >
                  <Ionicons name="bag" size={Icons.sizes.md} color={Colors.textPrimary} />
                  <Text style={{
                    color: Colors.textPrimary,
                    fontSize: Typography.md,
                    fontWeight: '700',
                    marginLeft: Spacing.sm,
                  }}>
                    Buy Now
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </TouchableOpacity>
      </CardContainer>
    );
  }

  // Default variant
  return (
    <CardContainer style={[ComponentStyles.productCard.container, cardStyle]}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.7}
      >
        <Image
          source={{ uri: product.imageUrl }}
          style={{
            width: '100%',
            height: 180,
            resizeMode: 'cover',
          }}
        />
        
        <View style={{ padding: Spacing.md }}>
          <Text
            style={{
              color: Colors.textPrimary,
              fontSize: Typography.md,
              fontWeight: '600',
              marginBottom: Spacing.xs,
            }}
            numberOfLines={2}
          >
            {product.title}
          </Text>
          
          <Text
            style={{
              color: Colors.textSecondary,
              fontSize: Typography.sm,
              marginBottom: Spacing.sm,
            }}
            numberOfLines={2}
          >
            {product.description}
          </Text>
          
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.sm }}>
            {showRating && (
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ flexDirection: 'row', marginRight: Spacing.xs }}>
                  {renderStars(product.rating)}
                </View>
                <Text style={{
                  color: Colors.textSecondary,
                  fontSize: Typography.xs,
                }}>
                  ({product.reviewCount})
                </Text>
              </View>
            )}
            
            {showPrice && (
              <Text style={{
                color: Colors.primary,
                fontSize: Typography.lg,
                fontWeight: '700',
              }}>
                {formatPrice(product.price, product.currency)}
              </Text>
            )}
          </View>
          
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={{
              color: Colors.textSecondary,
              fontSize: Typography.xs,
              textTransform: 'uppercase',
              fontWeight: '500',
            }}>
              {product.brand}
            </Text>
            
            {showBuyButton && (
              <TouchableOpacity
                onPress={onPress}
                style={{
                  backgroundColor: Colors.primary,
                  paddingHorizontal: Spacing.md,
                  paddingVertical: Spacing.sm,
                  borderRadius: BorderRadius.md,
                  flexDirection: 'row',
                  alignItems: 'center',
                  minHeight: TouchTargets.minimum,
                }}
              >
                <Ionicons name="bag-outline" size={Icons.sizes.sm} color={Colors.textPrimary} />
                <Text style={{
                  color: Colors.textPrimary,
                  fontSize: Typography.sm,
                  fontWeight: '600',
                  marginLeft: Spacing.xs,
                }}>
                  Buy Now
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </TouchableOpacity>
    </CardContainer>
  );
}; 