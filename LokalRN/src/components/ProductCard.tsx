import React from 'react';
import { View, Text, TouchableOpacity, Image, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ProductFrontend } from '../types';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../utils/designSystem';

const { width: screenWidth } = Dimensions.get('window');

interface ProductCardProps {
  product: ProductFrontend;
  onPress?: () => void;
  compact?: boolean;
  showPrice?: boolean;
  showRating?: boolean;
  variant?: 'default' | 'shoppable' | 'minimal';
}

export const ProductCard: React.FC<ProductCardProps> = ({ 
  product, 
  onPress, 
  compact = false,
  showPrice = true,
  showRating = true,
  variant = 'default'
}) => {
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
        <Ionicons key={`star-${i}`} name="star" size={12} color="#fbbf24" />
      );
    }

    if (hasHalfStar) {
      stars.push(
        <Ionicons key="star-half" name="star-half" size={12} color="#fbbf24" />
      );
    }

    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <Ionicons key={`star-empty-${i}`} name="star-outline" size={12} color="#d1d5db" />
      );
    }

    return stars;
  };

  if (variant === 'minimal') {
    return (
      <TouchableOpacity
        onPress={onPress}
        style={{
          backgroundColor: Colors.surface,
          borderRadius: BorderRadius.md,
          padding: Spacing.sm,
          alignItems: 'center',
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
        style={{
          backgroundColor: Colors.surface,
          borderRadius: BorderRadius.md,
          overflow: 'hidden',
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
            }}
            numberOfLines={1}
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
      <TouchableOpacity
        onPress={onPress}
        style={{
          backgroundColor: Colors.surface,
          borderRadius: BorderRadius.lg,
          overflow: 'hidden',
          marginBottom: Spacing.md,
          ...Shadows.md,
        }}
        activeOpacity={0.7}
      >
        <View style={{ position: 'relative' }}>
          <Image
            source={{ uri: product.imageUrl }}
            style={{
              width: '100%',
              height: 200,
              resizeMode: 'cover',
            }}
          />
          
          {/* Shoppable Badge */}
          <View style={{
            position: 'absolute',
            top: Spacing.sm,
            right: Spacing.sm,
            backgroundColor: Colors.primary,
            paddingHorizontal: Spacing.sm,
            paddingVertical: Spacing.xs,
            borderRadius: BorderRadius.full,
          }}>
            <Ionicons name="bag" size={12} color={Colors.textPrimary} />
          </View>
          
          {/* Price Badge */}
          <View style={{
            position: 'absolute',
            bottom: Spacing.sm,
            left: Spacing.sm,
            backgroundColor: Colors.success,
            paddingHorizontal: Spacing.sm,
            paddingVertical: Spacing.xs,
            borderRadius: BorderRadius.md,
          }}>
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
            
            <TouchableOpacity
              onPress={onPress}
              style={{
                backgroundColor: Colors.primary,
                paddingHorizontal: Spacing.md,
                paddingVertical: Spacing.sm,
                borderRadius: BorderRadius.md,
                flexDirection: 'row',
                alignItems: 'center',
              }}
            >
              <Ionicons name="bag-outline" size={16} color={Colors.textPrimary} />
              <Text style={{
                color: Colors.textPrimary,
                fontSize: Typography.sm,
                fontWeight: '600',
                marginLeft: Spacing.xs,
              }}>
                Shop Now
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  // Default variant
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.lg,
        overflow: 'hidden',
        marginBottom: Spacing.md,
        ...Shadows.md,
      }}
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
          
          <TouchableOpacity
            onPress={onPress}
            style={{
              backgroundColor: Colors.primary,
              paddingHorizontal: Spacing.md,
              paddingVertical: Spacing.sm,
              borderRadius: BorderRadius.md,
              flexDirection: 'row',
              alignItems: 'center',
            }}
          >
            <Ionicons name="bag-outline" size={16} color={Colors.textPrimary} />
            <Text style={{
              color: Colors.textPrimary,
              fontSize: Typography.sm,
              fontWeight: '600',
              marginLeft: Spacing.xs,
            }}>
              Buy Now
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}; 