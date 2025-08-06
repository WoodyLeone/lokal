import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ProductCard } from './ProductCard';
import { EnhancedButton } from './EnhancedButton';
import { EnhancedLoading } from './EnhancedLoading';
import { 
  Colors, 
  Typography, 
  Spacing, 
  BorderRadius, 
  Shadows, 
  ComponentStyles,
  Animations,
  Icons,
  TouchTargets,
  SkeletonLoader,
  Gradients
} from '../utils/designSystem';

const { width: screenWidth } = Dimensions.get('window');

// Mock product data for showcase
const mockProduct = {
  id: '1',
  title: 'Premium Wireless Headphones',
  description: 'High-quality wireless headphones with noise cancellation and premium sound quality. Perfect for music lovers and professionals.',
  price: 299.99,
  currency: 'USD',
  imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400',
  buyUrl: 'https://example.com/product',
  brand: 'AudioTech',
  rating: 4.8,
  reviewCount: 1247,
};

export const UIShowcase: React.FC = () => {
  const [showLoading, setShowLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('colors');

  const renderColorPalette = () => (
    <View style={{ padding: Spacing.lg }}>
      <Text style={{ 
        color: Colors.textPrimary, 
        fontSize: Typography.xl, 
        fontWeight: 'bold',
        marginBottom: Spacing.lg 
      }}>
        Color Palette
      </Text>
      
      <View style={{ gap: Spacing.md }}>
        {/* Primary Colors */}
        <View>
          <Text style={{ color: Colors.textSecondary, fontSize: Typography.sm, marginBottom: Spacing.sm }}>
            Primary Colors
          </Text>
          <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
            <View style={{ alignItems: 'center' }}>
              <View style={{ 
                width: 60, 
                height: 60, 
                backgroundColor: Colors.primary, 
                borderRadius: BorderRadius.md,
                marginBottom: Spacing.xs,
                ...Shadows.base,
              }} />
              <Text style={{ color: Colors.textSecondary, fontSize: Typography.xs }}>
                Primary
              </Text>
            </View>
            <View style={{ alignItems: 'center' }}>
              <View style={{ 
                width: 60, 
                height: 60, 
                backgroundColor: Colors.primaryLight, 
                borderRadius: BorderRadius.md,
                marginBottom: Spacing.xs,
                ...Shadows.base,
              }} />
              <Text style={{ color: Colors.textSecondary, fontSize: Typography.xs }}>
                Light
              </Text>
            </View>
            <View style={{ alignItems: 'center' }}>
              <View style={{ 
                width: 60, 
                height: 60, 
                backgroundColor: Colors.primaryDark, 
                borderRadius: BorderRadius.md,
                marginBottom: Spacing.xs,
                ...Shadows.base,
              }} />
              <Text style={{ color: Colors.textSecondary, fontSize: Typography.xs }}>
                Dark
              </Text>
            </View>
          </View>
        </View>

        {/* Status Colors */}
        <View>
          <Text style={{ color: Colors.textSecondary, fontSize: Typography.sm, marginBottom: Spacing.sm }}>
            Status Colors
          </Text>
          <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
            <View style={{ alignItems: 'center' }}>
              <View style={{ 
                width: 60, 
                height: 60, 
                backgroundColor: Colors.success, 
                borderRadius: BorderRadius.md,
                marginBottom: Spacing.xs,
                ...Shadows.base,
              }} />
              <Text style={{ color: Colors.textSecondary, fontSize: Typography.xs }}>
                Success
              </Text>
            </View>
            <View style={{ alignItems: 'center' }}>
              <View style={{ 
                width: 60, 
                height: 60, 
                backgroundColor: Colors.warning, 
                borderRadius: BorderRadius.md,
                marginBottom: Spacing.xs,
                ...Shadows.base,
              }} />
              <Text style={{ color: Colors.textSecondary, fontSize: Typography.xs }}>
                Warning
              </Text>
            </View>
            <View style={{ alignItems: 'center' }}>
              <View style={{ 
                width: 60, 
                height: 60, 
                backgroundColor: Colors.error, 
                borderRadius: BorderRadius.md,
                marginBottom: Spacing.xs,
                ...Shadows.base,
              }} />
              <Text style={{ color: Colors.textSecondary, fontSize: Typography.xs }}>
                Error
              </Text>
            </View>
            <View style={{ alignItems: 'center' }}>
              <View style={{ 
                width: 60, 
                height: 60, 
                backgroundColor: Colors.info, 
                borderRadius: BorderRadius.md,
                marginBottom: Spacing.xs,
                ...Shadows.base,
              }} />
              <Text style={{ color: Colors.textSecondary, fontSize: Typography.xs }}>
                Info
              </Text>
            </View>
          </View>
        </View>

        {/* Background Colors */}
        <View>
          <Text style={{ color: Colors.textSecondary, fontSize: Typography.sm, marginBottom: Spacing.sm }}>
            Background Colors
          </Text>
          <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
            <View style={{ alignItems: 'center' }}>
              <View style={{ 
                width: 60, 
                height: 60, 
                backgroundColor: Colors.background, 
                borderRadius: BorderRadius.md,
                marginBottom: Spacing.xs,
                borderWidth: 1,
                borderColor: Colors.border,
              }} />
              <Text style={{ color: Colors.textSecondary, fontSize: Typography.xs }}>
                Background
              </Text>
            </View>
            <View style={{ alignItems: 'center' }}>
              <View style={{ 
                width: 60, 
                height: 60, 
                backgroundColor: Colors.surface, 
                borderRadius: BorderRadius.md,
                marginBottom: Spacing.xs,
                ...Shadows.base,
              }} />
              <Text style={{ color: Colors.textSecondary, fontSize: Typography.xs }}>
                Surface
              </Text>
            </View>
            <View style={{ alignItems: 'center' }}>
              <View style={{ 
                width: 60, 
                height: 60, 
                backgroundColor: Colors.surfaceLight, 
                borderRadius: BorderRadius.md,
                marginBottom: Spacing.xs,
                ...Shadows.base,
              }} />
              <Text style={{ color: Colors.textSecondary, fontSize: Typography.xs }}>
                Surface Light
              </Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );

  const renderTypography = () => (
    <View style={{ padding: Spacing.lg }}>
      <Text style={{ 
        color: Colors.textPrimary, 
        fontSize: Typography.xl, 
        fontWeight: 'bold',
        marginBottom: Spacing.lg 
      }}>
        Typography
      </Text>
      
      <View style={{ gap: Spacing.md }}>
        <View>
          <Text style={{ color: Colors.textSecondary, fontSize: Typography.sm, marginBottom: Spacing.sm }}>
            Display Text
          </Text>
          <Text style={{ color: Colors.textPrimary, fontSize: Typography['4xl'], fontWeight: 'bold', marginBottom: Spacing.xs }}>
            Display 4XL (36px)
          </Text>
          <Text style={{ color: Colors.textPrimary, fontSize: Typography['3xl'], fontWeight: 'bold', marginBottom: Spacing.xs }}>
            Display 3XL (30px)
          </Text>
          <Text style={{ color: Colors.textPrimary, fontSize: Typography['2xl'], fontWeight: 'bold', marginBottom: Spacing.xs }}>
            Display 2XL (24px)
          </Text>
        </View>

        <View>
          <Text style={{ color: Colors.textSecondary, fontSize: Typography.sm, marginBottom: Spacing.sm }}>
            Body Text
          </Text>
          <Text style={{ color: Colors.textPrimary, fontSize: Typography.xl, marginBottom: Spacing.xs }}>
            Body XL (20px)
          </Text>
          <Text style={{ color: Colors.textPrimary, fontSize: Typography.lg, marginBottom: Spacing.xs }}>
            Body LG (18px)
          </Text>
          <Text style={{ color: Colors.textPrimary, fontSize: Typography.base, marginBottom: Spacing.xs }}>
            Body Base (16px)
          </Text>
          <Text style={{ color: Colors.textPrimary, fontSize: Typography.sm, marginBottom: Spacing.xs }}>
            Body SM (14px)
          </Text>
          <Text style={{ color: Colors.textPrimary, fontSize: Typography.xs, marginBottom: Spacing.xs }}>
            Body XS (12px)
          </Text>
        </View>

        <View>
          <Text style={{ color: Colors.textSecondary, fontSize: Typography.sm, marginBottom: Spacing.sm }}>
            Text Colors
          </Text>
          <Text style={{ color: Colors.textPrimary, fontSize: Typography.base, marginBottom: Spacing.xs }}>
            Primary Text Color
          </Text>
          <Text style={{ color: Colors.textSecondary, fontSize: Typography.base, marginBottom: Spacing.xs }}>
            Secondary Text Color
          </Text>
          <Text style={{ color: Colors.textTertiary, fontSize: Typography.base, marginBottom: Spacing.xs }}>
            Tertiary Text Color
          </Text>
        </View>
      </View>
    </View>
  );

  const renderComponents = () => (
    <View style={{ padding: Spacing.lg }}>
      <Text style={{ 
        color: Colors.textPrimary, 
        fontSize: Typography.xl, 
        fontWeight: 'bold',
        marginBottom: Spacing.lg 
      }}>
        Components
      </Text>
      
      <View style={{ gap: Spacing.lg }}>
        {/* Buttons */}
        <View>
          <Text style={{ color: Colors.textSecondary, fontSize: Typography.sm, marginBottom: Spacing.sm }}>
            Buttons
          </Text>
          <View style={{ gap: Spacing.sm }}>
            <EnhancedButton
              title="Primary Button"
              variant="primary"
              size="large"
              onPress={() => console.log('Primary pressed')}
            />
            <EnhancedButton
              title="Secondary Button"
              variant="secondary"
              size="large"
              onPress={() => console.log('Secondary pressed')}
            />
            <EnhancedButton
              title="Outline Button"
              variant="outline"
              size="large"
              onPress={() => console.log('Outline pressed')}
            />
            <EnhancedButton
              title="Disabled Button"
              variant="primary"
              size="large"
              disabled={true}
              onPress={() => console.log('Disabled pressed')}
            />
          </View>
        </View>

        {/* Product Cards */}
        <View>
          <Text style={{ color: Colors.textSecondary, fontSize: Typography.sm, marginBottom: Spacing.sm }}>
            Product Cards
          </Text>
          <View style={{ gap: Spacing.md }}>
            <ProductCard
              product={mockProduct}
              variant="enhanced"
              onPress={() => console.log('Enhanced card pressed')}
            />
            <ProductCard
              product={mockProduct}
              variant="shoppable"
              onPress={() => console.log('Shoppable card pressed')}
            />
            <ProductCard
              product={mockProduct}
              variant="default"
              onPress={() => console.log('Default card pressed')}
            />
          </View>
        </View>

        {/* Loading States */}
        <View>
          <Text style={{ color: Colors.textSecondary, fontSize: Typography.sm, marginBottom: Spacing.sm }}>
            Loading States
          </Text>
          <View style={{ gap: Spacing.sm }}>
            <TouchableOpacity
              onPress={() => setShowLoading(true)}
              style={{
                backgroundColor: Colors.primary,
                paddingHorizontal: Spacing.lg,
                paddingVertical: Spacing.base,
                borderRadius: BorderRadius.md,
                alignItems: 'center',
              }}
            >
              <Text style={{ color: Colors.textPrimary, fontSize: Typography.base, fontWeight: '600' }}>
                Show Loading Modal
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Skeleton Loaders */}
        <View>
          <Text style={{ color: Colors.textSecondary, fontSize: Typography.sm, marginBottom: Spacing.sm }}>
            Skeleton Loaders
          </Text>
          <View style={{ gap: Spacing.sm }}>
            <View style={SkeletonLoader.card} />
            <View style={SkeletonLoader.text} />
            <View style={SkeletonLoader.text} />
            <View style={SkeletonLoader.button} />
          </View>
        </View>
      </View>
    </View>
  );

  const renderSpacing = () => (
    <View style={{ padding: Spacing.lg }}>
      <Text style={{ 
        color: Colors.textPrimary, 
        fontSize: Typography.xl, 
        fontWeight: 'bold',
        marginBottom: Spacing.lg 
      }}>
        Spacing System
      </Text>
      
      <View style={{ gap: Spacing.md }}>
        {Object.entries(Spacing).map(([key, value]) => (
          <View key={key} style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ 
              width: value, 
              height: 20, 
              backgroundColor: Colors.primary, 
              borderRadius: BorderRadius.sm,
              marginRight: Spacing.sm,
            }} />
            <Text style={{ color: Colors.textSecondary, fontSize: Typography.sm }}>
              {key}: {value}px
            </Text>
          </View>
        ))}
      </View>
    </View>
  );

  const renderShadows = () => (
    <View style={{ padding: Spacing.lg }}>
      <Text style={{ 
        color: Colors.textPrimary, 
        fontSize: Typography.xl, 
        fontWeight: 'bold',
        marginBottom: Spacing.lg 
      }}>
        Shadows
      </Text>
      
      <View style={{ gap: Spacing.lg }}>
        {Object.entries(Shadows).map(([key, shadow]) => (
          <View key={key} style={{ alignItems: 'center' }}>
            <View style={{ 
              width: 100, 
              height: 100, 
              backgroundColor: Colors.surface, 
              borderRadius: BorderRadius.lg,
              ...shadow,
              justifyContent: 'center',
              alignItems: 'center',
            }}>
              <Text style={{ color: Colors.textPrimary, fontSize: Typography.sm, fontWeight: '600' }}>
                {key.toUpperCase()}
              </Text>
            </View>
            <Text style={{ color: Colors.textSecondary, fontSize: Typography.xs, marginTop: Spacing.xs }}>
              {key}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );

  const renderIcons = () => (
    <View style={{ padding: Spacing.lg }}>
      <Text style={{ 
        color: Colors.textPrimary, 
        fontSize: Typography.xl, 
        fontWeight: 'bold',
        marginBottom: Spacing.lg 
      }}>
        Icons
      </Text>
      
      <View style={{ gap: Spacing.lg }}>
        {/* Icon Sizes */}
        <View>
          <Text style={{ color: Colors.textSecondary, fontSize: Typography.sm, marginBottom: Spacing.sm }}>
            Icon Sizes
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md }}>
            <View style={{ alignItems: 'center' }}>
              <Ionicons name="star" size={Icons.sizes.xs} color={Colors.primary} />
              <Text style={{ color: Colors.textSecondary, fontSize: Typography.xs, marginTop: Spacing.xs }}>
                XS (12px)
              </Text>
            </View>
            <View style={{ alignItems: 'center' }}>
              <Ionicons name="star" size={Icons.sizes.sm} color={Colors.primary} />
              <Text style={{ color: Colors.textSecondary, fontSize: Typography.xs, marginTop: Spacing.xs }}>
                SM (16px)
              </Text>
            </View>
            <View style={{ alignItems: 'center' }}>
              <Ionicons name="star" size={Icons.sizes.md} color={Colors.primary} />
              <Text style={{ color: Colors.textSecondary, fontSize: Typography.xs, marginTop: Spacing.xs }}>
                MD (20px)
              </Text>
            </View>
            <View style={{ alignItems: 'center' }}>
              <Ionicons name="star" size={Icons.sizes.lg} color={Colors.primary} />
              <Text style={{ color: Colors.textSecondary, fontSize: Typography.xs, marginTop: Spacing.xs }}>
                LG (24px)
              </Text>
            </View>
            <View style={{ alignItems: 'center' }}>
              <Ionicons name="star" size={Icons.sizes.xl} color={Colors.primary} />
              <Text style={{ color: Colors.textSecondary, fontSize: Typography.xs, marginTop: Spacing.xs }}>
                XL (32px)
              </Text>
            </View>
          </View>
        </View>

        {/* Icon Colors */}
        <View>
          <Text style={{ color: Colors.textSecondary, fontSize: Typography.sm, marginBottom: Spacing.sm }}>
            Icon Colors
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md }}>
            <View style={{ alignItems: 'center' }}>
              <Ionicons name="heart" size={Icons.sizes.lg} color={Icons.colors.primary} />
              <Text style={{ color: Colors.textSecondary, fontSize: Typography.xs, marginTop: Spacing.xs }}>
                Primary
              </Text>
            </View>
            <View style={{ alignItems: 'center' }}>
              <Ionicons name="heart" size={Icons.sizes.lg} color={Icons.colors.success} />
              <Text style={{ color: Colors.textSecondary, fontSize: Typography.xs, marginTop: Spacing.xs }}>
                Success
              </Text>
            </View>
            <View style={{ alignItems: 'center' }}>
              <Ionicons name="heart" size={Icons.sizes.lg} color={Icons.colors.warning} />
              <Text style={{ color: Colors.textSecondary, fontSize: Typography.xs, marginTop: Spacing.xs }}>
                Warning
              </Text>
            </View>
            <View style={{ alignItems: 'center' }}>
              <Ionicons name="heart" size={Icons.sizes.lg} color={Icons.colors.error} />
              <Text style={{ color: Colors.textSecondary, fontSize: Typography.xs, marginTop: Spacing.xs }}>
                Error
              </Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'colors':
        return renderColorPalette();
      case 'typography':
        return renderTypography();
      case 'components':
        return renderComponents();
      case 'spacing':
        return renderSpacing();
      case 'shadows':
        return renderShadows();
      case 'icons':
        return renderIcons();
      default:
        return renderColorPalette();
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      {/* Header */}
      <View style={{ 
        backgroundColor: Colors.surface, 
        paddingTop: Spacing.xl, 
        paddingBottom: Spacing.lg,
        paddingHorizontal: Spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
        ...Shadows.base,
      }}>
        <Text style={{ 
          color: Colors.textPrimary, 
          fontSize: Typography['2xl'], 
          fontWeight: 'bold',
          textAlign: 'center',
        }}>
          UI Design System Showcase
        </Text>
        <Text style={{ 
          color: Colors.textSecondary, 
          fontSize: Typography.base,
          textAlign: 'center',
          marginTop: Spacing.xs,
        }}>
          Explore our comprehensive design system
        </Text>
      </View>

      {/* Navigation Tabs */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={{ 
          backgroundColor: Colors.surface, 
          borderBottomWidth: 1, 
          borderBottomColor: Colors.border 
        }}
        contentContainerStyle={{ paddingHorizontal: Spacing.lg }}
      >
        {[
          { key: 'colors', label: 'Colors', icon: 'color-palette' },
          { key: 'typography', label: 'Typography', icon: 'text' },
          { key: 'components', label: 'Components', icon: 'cube' },
          { key: 'spacing', label: 'Spacing', icon: 'resize' },
          { key: 'shadows', label: 'Shadows', icon: 'layers' },
          { key: 'icons', label: 'Icons', icon: 'star' },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.key}
            onPress={() => setActiveTab(tab.key)}
            style={{
              paddingHorizontal: Spacing.md,
              paddingVertical: Spacing.sm,
              marginRight: Spacing.sm,
              borderRadius: BorderRadius.md,
              backgroundColor: activeTab === tab.key ? Colors.primary + '20' : 'transparent',
              flexDirection: 'row',
              alignItems: 'center',
              minHeight: TouchTargets.minimum,
            }}
          >
            <Ionicons 
              name={tab.icon as any} 
              size={Icons.sizes.sm} 
              color={activeTab === tab.key ? Colors.primary : Colors.textSecondary} 
            />
            <Text style={{ 
              color: activeTab === tab.key ? Colors.primary : Colors.textSecondary, 
              fontSize: Typography.sm, 
              fontWeight: activeTab === tab.key ? '600' : '400',
              marginLeft: Spacing.xs,
            }}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Content */}
      <ScrollView style={{ flex: 1 }}>
        {renderContent()}
      </ScrollView>

      {/* Loading Modal */}
      <EnhancedLoading
        visible={showLoading}
        title="Processing..."
        message="Please wait while we process your request"
        progress={75}
        status="loading"
        onDismiss={() => setShowLoading(false)}
        autoDismiss={true}
        dismissDelay={3000}
      />
    </View>
  );
}; 