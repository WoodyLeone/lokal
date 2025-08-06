import React from 'react';
import { View, Text, Modal, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ProductFrontend, VideoFrontend } from '../types';
import { ProductCard } from './ProductCard';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../utils/designSystem';

interface ShoppableModalProps {
  visible: boolean;
  video: VideoFrontend | null;
  onClose: () => void;
  onProductPress: (product: ProductFrontend) => void;
}

const { height: screenHeight } = Dimensions.get('window');

export const ShoppableModal: React.FC<ShoppableModalProps> = ({
  visible,
  video,
  onClose,
  onProductPress,
}) => {
  if (!video) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={{ flex: 1, backgroundColor: Colors.background }}>
        {/* Header */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: Spacing.lg,
          paddingTop: Spacing.xl,
          borderBottomWidth: 1,
          borderBottomColor: Colors.border,
          backgroundColor: Colors.surface,
        }}>
          <View style={{ flex: 1 }}>
            <Text style={{
              fontSize: Typography.lg,
              fontWeight: 'bold',
              color: Colors.textPrimary,
              marginBottom: Spacing.xs,
            }}>
              Shop This Video
            </Text>
            <Text style={{
              fontSize: Typography.sm,
              color: Colors.textSecondary,
              numberOfLines: 1,
            }}>
              {video.title}
            </Text>
          </View>
          
          <TouchableOpacity
            onPress={onClose}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: Colors.surface,
              justifyContent: 'center',
              alignItems: 'center',
              marginLeft: Spacing.md,
            }}
          >
            <Ionicons name="close" size={24} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Content */}
        <ScrollView 
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: Spacing.lg }}
          showsVerticalScrollIndicator={false}
        >
          {/* Magic Message */}
          <View style={{
            backgroundColor: Colors.primary + '15',
            padding: Spacing.lg,
            borderRadius: BorderRadius.lg,
            marginBottom: Spacing.xl,
            borderLeftWidth: 4,
            borderLeftColor: Colors.primary,
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.sm }}>
              <Ionicons name="sparkles" size={20} color={Colors.primary} />
              <Text style={{
                fontSize: Typography.md,
                fontWeight: 'bold',
                color: Colors.primary,
                marginLeft: Spacing.sm,
              }}>
                AI-Detected Items
              </Text>
            </View>
            <Text style={{
              fontSize: Typography.sm,
              color: Colors.textSecondary,
              lineHeight: Typography.sm * 1.4,
            }}>
              These products were automatically detected and curated by the business owner. 
              Tap any item to learn more or purchase.
            </Text>
          </View>

          {/* Products Grid */}
          {video.products.length > 0 ? (
            <View style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
            }}>
              {video.products.map((product, index) => (
                <View 
                  key={product.id} 
                  style={{ 
                    width: '48%', 
                    marginBottom: Spacing.lg,
                  }}
                >
                  <ProductCard
                    product={product}
                    onPress={() => onProductPress(product)}
                    variant="modal"
                    animated={true}
                  />
                </View>
              ))}
            </View>
          ) : (
            <View style={{
              padding: Spacing.xl,
              alignItems: 'center',
              backgroundColor: Colors.surface,
              borderRadius: BorderRadius.lg,
              ...Shadows.sm,
            }}>
              <Ionicons name="bag-outline" size={48} color={Colors.textSecondary} />
              <Text style={{
                fontSize: Typography.lg,
                fontWeight: 'bold',
                color: Colors.textPrimary,
                marginTop: Spacing.md,
                marginBottom: Spacing.sm,
              }}>
                No Products Yet
              </Text>
              <Text style={{
                fontSize: Typography.sm,
                color: Colors.textSecondary,
                textAlign: 'center',
                lineHeight: Typography.sm * 1.4,
              }}>
                This video doesn't have any tagged products yet. The business owner can add products during the setup process.
              </Text>
            </View>
          )}
        </ScrollView>

        {/* Footer */}
        <View style={{
          padding: Spacing.lg,
          borderTopWidth: 1,
          borderTopColor: Colors.border,
          backgroundColor: Colors.surface,
        }}>
          <Text style={{
            fontSize: Typography.xs,
            color: Colors.textSecondary,
            textAlign: 'center',
            lineHeight: Typography.xs * 1.4,
          }}>
            Products are curated by verified business owners
          </Text>
        </View>
      </View>
    </Modal>
  );
};