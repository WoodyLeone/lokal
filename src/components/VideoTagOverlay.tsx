import React, { useState } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Dimensions, PanGestureHandler, State } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TrackedItem } from '../types';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../utils/designSystem';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface VideoTagOverlayProps {
  trackedItems: TrackedItem[];
  onItemSelect: (itemId: string) => void;
  onItemReposition: (itemId: string, x: number, y: number) => void;
  onAddTag: (x: number, y: number) => void;
  showAddButtons?: boolean;
}

export const VideoTagOverlay: React.FC<VideoTagOverlayProps> = ({
  trackedItems,
  onItemSelect,
  onItemReposition,
  onAddTag,
  showAddButtons = true
}) => {
  const [draggingItem, setDraggingItem] = useState<string | null>(null);

  const getCategoryIcon = (category: string): keyof typeof Ionicons.glyphMap => {
    const cat = category?.toLowerCase() || '';
    
    // Comprehensive category mapping to ensure no question marks
    if (cat.includes('foot') || cat.includes('shoe') || cat.includes('sneaker') || cat.includes('boot')) {
      return 'footsteps-outline';
    }
    if (cat.includes('cloth') || cat.includes('shirt') || cat.includes('dress') || cat.includes('jacket')) {
      return 'shirt-outline';
    }
    if (cat.includes('tech') || cat.includes('electron') || cat.includes('laptop') || cat.includes('phone') || cat.includes('robot')) {
      return 'laptop-outline';
    }
    if (cat.includes('furniture') || cat.includes('chair') || cat.includes('desk') || cat.includes('table')) {
      return 'bed-outline';
    }
    if (cat.includes('sport') || cat.includes('fitness') || cat.includes('gym') || cat.includes('bike')) {
      return 'bicycle-outline';
    }
    if (cat.includes('beauty') || cat.includes('cosmetic') || cat.includes('makeup') || cat.includes('sparkle')) {
      return 'sparkles-outline';
    }
    if (cat.includes('home') || cat.includes('house') || cat.includes('decor')) {
      return 'home-outline';
    }
    if (cat.includes('bag') || cat.includes('purse') || cat.includes('backpack')) {
      return 'bag-outline';
    }
    if (cat.includes('bottle') || cat.includes('drink') || cat.includes('beverage')) {
      return 'wine-outline';
    }
    if (cat.includes('watch') || cat.includes('access') || cat.includes('jewelry')) {
      return 'watch-outline';
    }
    if (cat.includes('nature') || cat.includes('plant') || cat.includes('tree') || cat.includes('landscape')) {
      return 'leaf-outline';
    }
    if (cat.includes('animal') || cat.includes('bunny') || cat.includes('elephant') || cat.includes('pet')) {
      return 'paw-outline';
    }
    if (cat.includes('fire') || cat.includes('effect') || cat.includes('visual') || cat.includes('animation')) {
      return 'flame-outline';
    }
    if (cat.includes('travel') || cat.includes('adventure') || cat.includes('journey')) {
      return 'airplane-outline';
    }
    
    // Safe fallback that definitely exists
    return 'ellipse-outline';
  };

  const getTagColor = (item: TrackedItem) => {
    if (item.isSelected) return Colors.primary;
    if (item.confidence && item.confidence >= 0.9) return Colors.success;
    if (item.confidence && item.confidence >= 0.7) return Colors.warning;
    return Colors.textSecondary;
  };

  const handleTagPress = (itemId: string) => {
    onItemSelect(itemId);
  };

  const handleTagLongPress = (itemId: string) => {
    setDraggingItem(itemId);
  };

  const handleAddTag = (x: number, y: number) => {
    onAddTag(x, y);
  };

  // Don't render any overlay elements in production to prevent UI issues
  if (!__DEV__) {
    return null;
  }

  return (
    <View style={styles.container}>
      {/* Existing Tags */}
      {trackedItems.map((item) => (
        <TouchableOpacity
          key={item.id}
          style={[
            styles.tag,
            {
              left: item.x,
              top: item.y,
              backgroundColor: getTagColor(item),
            },
            item.isSelected && styles.selectedTag
          ]}
          onPress={() => handleTagPress(item.id)}
          onLongPress={() => handleTagLongPress(item.id)}
        >
          <Ionicons 
            name={getCategoryIcon(item.category || '')} 
            size={16} 
            color={Colors.textPrimary} 
          />
          {item.isSelected && (
            <View style={styles.selectedIndicator}>
              <Ionicons name="checkmark" size={12} color={Colors.textPrimary} />
            </View>
          )}
        </TouchableOpacity>
      ))}

      {/* Add Tag Buttons - Only show in development */}
      {showAddButtons && __DEV__ && (
        <>
          <TouchableOpacity
            style={[styles.addButton, styles.addButtonTopLeft]}
            onPress={() => handleAddTag(50, 100)}
          >
            <Ionicons name="add" size={20} color={Colors.primary} />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.addButton, styles.addButtonTopRight]}
            onPress={() => handleAddTag(screenWidth - 80, 100)}
          >
            <Ionicons name="add" size={20} color={Colors.primary} />
          </TouchableOpacity>
        </>
      )}

      {/* Position Indicator (for debugging) */}
      {__DEV__ && (
        <View style={styles.positionIndicator}>
          <Text style={styles.positionText}>
            Position: {Math.round(trackedItems[0]?.x || 0)}%, {Math.round(trackedItems[0]?.y || 0)}%
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'box-none',
  },
  tag: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.lg,
    borderWidth: 2,
    borderColor: Colors.textPrimary,
  },
  selectedTag: {
    borderColor: Colors.textPrimary,
    transform: [{ scale: 1.2 }],
  },
  selectedIndicator: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.textPrimary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButton: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.primary,
    ...Shadows.md,
  },
  addButtonTopLeft: {
    top: 20,
    left: 20,
  },
  addButtonTopRight: {
    top: 20,
    right: 20,
  },
  positionIndicator: {
    position: 'absolute',
    top: 80,
    right: 20,
    backgroundColor: Colors.overlay,
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
  },
  positionText: {
    fontSize: Typography.xs,
    color: Colors.textPrimary,
  },
}); 