import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TrackedItem } from '../types';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../utils/designSystem';

interface ProductDetectionPanelProps {
  trackedItems: TrackedItem[];
  currentTime: number;
  videoDuration: number;
  onItemSelect: (itemId: string) => void;
  onItemReposition: (itemId: string, x: number, y: number) => void;
  onFindProducts: () => void;
  onBack: () => void;
}

export const ProductDetectionPanel: React.FC<ProductDetectionPanelProps> = ({
  trackedItems,
  currentTime,
  videoDuration,
  onItemSelect,
  onItemReposition,
  onFindProducts,
  onBack
}) => {
  const selectedItems = trackedItems.filter(item => item.isSelected);
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getCategoryIcon = (category: string) => {
    switch (category?.toLowerCase()) {
      case 'footwear': return 'footsteps-outline';
      case 'clothing': return 'shirt-outline';
      case 'accessories': return 'watch-outline';
      case 'tech': return 'laptop-outline';
      case 'furniture': return 'bed-outline';
      case 'sports': return 'bicycle-outline';
      case 'beauty': return 'sparkles-outline';
      case 'home': return 'home-outline';
      default: return 'ellipse-outline'; // Safe fallback
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return Colors.success;
    if (confidence >= 0.7) return Colors.warning;
    return Colors.error;
  };

  // Hide this component in production to prevent any overlay issues
  if (!__DEV__) {
    return null;
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>
          Product Detection
        </Text>
        <Text style={styles.subtitle}>
          {selectedItems.length} item{selectedItems.length !== 1 ? 's' : ''} selected
        </Text>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill, 
              { width: `${(currentTime / videoDuration) * 100}%` }
            ]} 
          />
        </View>
        <Text style={styles.timeText}>
          {formatTime(currentTime)} / {formatTime(videoDuration)}
        </Text>
      </View>

      {/* Detected Items */}
      <ScrollView style={styles.itemsContainer} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>Detected Items</Text>
        
        {trackedItems.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={[
              styles.itemCard,
              item.isSelected && styles.selectedItemCard
            ]}
            onPress={() => onItemSelect(item.id)}
            onLongPress={() => {
              // Handle repositioning
              console.log('Long press for repositioning:', item.id);
            }}
          >
            <View style={styles.itemHeader}>
              <View style={styles.itemIconContainer}>
                <Ionicons 
                  name={getCategoryIcon(item.category || '')} 
                  size={20} 
                  color={item.isSelected ? Colors.primary : Colors.textSecondary} 
                />
              </View>
              <View style={styles.itemInfo}>
                <Text style={[
                  styles.itemName,
                  item.isSelected && styles.selectedItemName
                ]}>
                  {item.name}
                </Text>
                <Text style={styles.itemCategory}>
                  {item.category}
                </Text>
              </View>
              <View style={styles.itemActions}>
                {item.confidence && (
                  <View style={[
                    styles.confidenceBadge,
                    { backgroundColor: getConfidenceColor(item.confidence) }
                  ]}>
                    <Text style={styles.confidenceText}>
                      {Math.round(item.confidence * 100)}%
                    </Text>
                  </View>
                )}
                {item.isSelected && (
                  <Ionicons name="checkmark-circle-outline" size={24} color={Colors.primary} />
                )}
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Instructions */}
      <View style={styles.instructionsContainer}>
                  <Ionicons name="information-circle-outline" size={16} color={Colors.textSecondary} />
        <Text style={styles.instructionsText}>
          Tap items to select • Long press to reposition • Selected items will be made shoppable
        </Text>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity 
          style={[styles.button, styles.backButton]} 
          onPress={onBack}
        >
          <Ionicons name="arrow-back-outline" size={20} color={Colors.textSecondary} />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[
            styles.button, 
            styles.findProductsButton,
            selectedItems.length === 0 && styles.disabledButton
          ]} 
          onPress={onFindProducts}
          disabled={selectedItems.length === 0}
        >
          <Ionicons name="search" size={20} color={Colors.textPrimary} />
          <Text style={styles.findProductsButtonText}>
            Find Products ({selectedItems.length})
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
    padding: Spacing.lg,
  },
  header: {
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: Typography.xl,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
  },
  progressContainer: {
    marginBottom: Spacing.lg,
  },
  progressBar: {
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.xs,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.sm,
  },
  timeText: {
    fontSize: Typography.xs,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  itemsContainer: {
    flex: 1,
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: Typography.lg,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  itemCard: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.sm,
  },
  selectedItemCard: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '10',
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: Typography.md,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  selectedItemName: {
    color: Colors.primary,
  },
  itemCategory: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    textTransform: 'capitalize',
  },
  itemActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  confidenceBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  confidenceText: {
    fontSize: Typography.xs,
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  instructionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
  },
  instructionsText: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    marginLeft: Spacing.sm,
    flex: 1,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    ...Shadows.sm,
  },
  backButton: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  backButtonText: {
    fontSize: Typography.md,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginLeft: Spacing.xs,
  },
  findProductsButton: {
    backgroundColor: Colors.primary,
  },
  findProductsButtonText: {
    fontSize: Typography.md,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginLeft: Spacing.xs,
  },
  disabledButton: {
    backgroundColor: Colors.border,
    opacity: 0.5,
  },
}); 