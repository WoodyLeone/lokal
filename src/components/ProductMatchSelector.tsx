import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ProductCard } from './ProductCard';
import { ProductFrontend } from '../types';

interface ProductMatchSelectorProps {
  detectedObjects: string[];
  matchedProducts: ProductFrontend[];
  manualProductName: string;
  aiSuggestions: string[];
  onConfirmMatch: (selectedProduct: string, matchType: 'manual' | 'ai_suggestion' | 'yolo_direct') => void;
  onSkip: () => void;
}

export const ProductMatchSelector: React.FC<ProductMatchSelectorProps> = ({
  detectedObjects,
  matchedProducts,
  manualProductName,
  aiSuggestions,
  onConfirmMatch,
  onSkip
}) => {
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [selectedMatchType, setSelectedMatchType] = useState<'manual' | 'ai_suggestion' | 'yolo_direct'>('manual');

  // Add logging to debug data flow
  console.log('🔧 ProductMatchSelector received data:');
  console.log('   detectedObjects:', detectedObjects);
  console.log('   matchedProducts:', matchedProducts);
  console.log('   manualProductName:', manualProductName);
  console.log('   aiSuggestions:', aiSuggestions);

  const handleConfirm = () => {
    if (!selectedProduct) {
      Alert.alert('Selection Required', 'Please select a product or confirm your manual input.');
      return;
    }
    onConfirmMatch(selectedProduct, selectedMatchType);
  };

  const handleProductSelect = (productName: string, matchType: 'manual' | 'ai_suggestion' | 'yolo_direct') => {
    setSelectedProduct(productName);
    setSelectedMatchType(matchType);
  };

  const getCategoryFromObjects = (objects: string[]): string => {
    if (objects.length === 0) return 'object';
    
    // Simple category mapping
    const categoryMap: { [key: string]: string } = {
      'person': 'person',
      'chair': 'furniture',
      'table': 'furniture',
      'laptop': 'electronics',
      'cell phone': 'electronics',
      'book': 'books',
      'cup': 'kitchen',
      'bottle': 'kitchen',
      'sneakers': 'footwear',
      'hat': 'clothing',
      'shirt': 'clothing',
      'pants': 'clothing',
      'handbag': 'accessories',
      'watch': 'accessories',
      'glasses': 'accessories',
      'couch': 'furniture',
      'tv': 'electronics',
      'lamp': 'furniture',
      'plant': 'home',
      'car': 'automotive',
      'bicycle': 'sports',
      'dog': 'pets',
      'cat': 'pets',
      'keyboard': 'electronics',
      'mouse': 'electronics',
      'coffee': 'kitchen',
      'mug': 'kitchen',
      'desk': 'furniture',
      'monitor': 'electronics',
      'headphones': 'electronics',
      'speaker': 'electronics',
      'camera': 'electronics',
      'remote': 'electronics'
    };

    for (const object of objects) {
      if (categoryMap[object.toLowerCase()]) {
        return categoryMap[object.toLowerCase()];
      }
    }
    
    return 'object';
  };

  const category = getCategoryFromObjects(detectedObjects);

  // Validate and sanitize data
  const validDetectedObjects = Array.isArray(detectedObjects) ? detectedObjects : [];
  const validMatchedProducts = Array.isArray(matchedProducts) ? matchedProducts : [];
  const validAiSuggestions = Array.isArray(aiSuggestions) ? aiSuggestions : [];
  const validManualProductName = typeof manualProductName === 'string' ? manualProductName : '';

  console.log('🔧 Validated data:');
  console.log('   validDetectedObjects:', validDetectedObjects);
  console.log('   validMatchedProducts:', validMatchedProducts);
  console.log('   validAiSuggestions:', validAiSuggestions);
  console.log('   validManualProductName:', validManualProductName);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Ionicons name="checkmark-circle" size={24} color="#10b981" />
        <Text style={styles.headerTitle}>Product Detection Complete!</Text>
      </View>

      {/* Detection Summary */}
      <View style={styles.summaryBox}>
        <Text style={styles.summaryTitle}>
          We detected a {category}, is this correct?
        </Text>
        <Text style={styles.summarySubtitle}>
          Detected objects: {validDetectedObjects.join(', ')}
        </Text>
      </View>

      {/* Manual Product Input (if provided) */}
      {validManualProductName && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Manual Input</Text>
          <TouchableOpacity
            style={[
              styles.optionCard,
              selectedProduct === validManualProductName && selectedMatchType === 'manual' && styles.selectedCard
            ]}
            onPress={() => handleProductSelect(validManualProductName, 'manual')}
          >
            <View style={styles.optionContent}>
              <Ionicons 
                name="create-outline" 
                size={20} 
                color={selectedProduct === validManualProductName ? "#6366f1" : "#94a3b8"} 
              />
              <Text style={[
                styles.optionText,
                selectedProduct === validManualProductName && styles.selectedText
              ]}>
                {validManualProductName}
              </Text>
            </View>
            {selectedProduct === validManualProductName && (
              <Ionicons name="checkmark-circle" size={20} color="#6366f1" />
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* AI Suggestions */}
      {validAiSuggestions.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>AI Suggestions</Text>
          {validAiSuggestions.map((suggestion, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.optionCard,
                selectedProduct === suggestion && selectedMatchType === 'ai_suggestion' && styles.selectedCard
              ]}
              onPress={() => handleProductSelect(suggestion, 'ai_suggestion')}
            >
              <View style={styles.optionContent}>
                <Ionicons 
                  name="sparkles-outline" 
                  size={20} 
                  color={selectedProduct === suggestion ? "#6366f1" : "#94a3b8"} 
                />
                <Text style={[
                  styles.optionText,
                  selectedProduct === suggestion && styles.selectedText
                ]}>
                  {suggestion}
                </Text>
              </View>
              {selectedProduct === suggestion && (
                <Ionicons name="checkmark-circle" size={20} color="#6366f1" />
              )}
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Matched Products */}
      {validMatchedProducts.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Matched Products</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.productsScroll}>
            {validMatchedProducts.map((product) => (
              <TouchableOpacity
                key={product.id}
                style={[
                  styles.productCard,
                  selectedProduct === product.title && selectedMatchType === 'yolo_direct' && styles.selectedProductCard
                ]}
                onPress={() => handleProductSelect(product.title, 'yolo_direct')}
              >
                <ProductCard product={product} />
                {selectedProduct === product.title && (
                  <View style={styles.selectedOverlay}>
                    <Ionicons name="checkmark-circle" size={24} color="#6366f1" />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={styles.skipButton}
          onPress={onSkip}
        >
          <Text style={styles.skipButtonText}>Skip for Now</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.confirmButton,
            !selectedProduct && styles.disabledButton
          ]}
          onPress={handleConfirm}
          disabled={!selectedProduct}
        >
          <Text style={styles.confirmButtonText}>
            Confirm Selection
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    color: '#000000',
    fontSize: 24,
    fontWeight: '700',
    marginLeft: 12,
  },
  summaryBox: {
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  summaryTitle: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  summarySubtitle: {
    color: '#8E8E93',
    fontSize: 14,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: '#000000',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  optionCard: {
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: 'transparent',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectedCard: {
    borderColor: '#007AFF',
    backgroundColor: '#E3F2FD',
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  optionText: {
    color: '#000000',
    fontSize: 16,
    marginLeft: 12,
    flex: 1,
  },
  selectedText: {
    color: '#007AFF',
    fontWeight: '600',
  },
  productsScroll: {
    marginHorizontal: -8,
  },
  productCard: {
    marginHorizontal: 8,
    position: 'relative',
  },
  selectedProductCard: {
    borderWidth: 2,
    borderColor: '#007AFF',
    borderRadius: 12,
  },
  selectedOverlay: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#007AFF',
    borderRadius: 12,
    padding: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  skipButton: {
    flex: 1,
    backgroundColor: '#8E8E93',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  skipButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#C7C7CC',
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
}); 