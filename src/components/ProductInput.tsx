import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { apiAdapter } from '../services/apiAdapter';
import { ApiService } from '../services/api'; // Fallback for missing methods
import { ProductFrontend, TagSuggestion } from '../types';

interface ProductInputProps {
  videoId: string;
  onProductSelect?: (product: ProductFrontend) => void;
  onTagsUpdate?: (tags: string[]) => void;
  initialTags?: string[];
  showTagSuggestions?: boolean;
  enableEnhancedMatching?: boolean;
}

interface TagSuggestion {
  tag: string;
  category: string;
  relevance: number;
  source: string;
}

export const ProductInput: React.FC<ProductInputProps> = ({
  videoId,
  onProductSelect,
  onTagsUpdate,
  initialTags = [],
  showTagSuggestions = true,
  enableEnhancedMatching = true,
}) => {
  const [manualProductName, setManualProductName] = useState('');
  const [affiliateLink, setAffiliateLink] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [matchedProducts, setMatchedProducts] = useState<ProductFrontend[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<ProductFrontend | null>(null);
  
  // Enhanced tag integration
  const [userTags, setUserTags] = useState<string[]>(initialTags);
  const [tagInput, setTagInput] = useState('');
  const [tagSuggestions, setTagSuggestions] = useState<TagSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [tagValidation, setTagValidation] = useState<any>(null);

  useEffect(() => {
    if (showTagSuggestions && videoId) {
      loadTagSuggestions();
    }
  }, [videoId, showTagSuggestions]);

  useEffect(() => {
    if (onTagsUpdate) {
      onTagsUpdate(userTags);
    }
  }, [userTags, onTagsUpdate]);

  const loadTagSuggestions = async () => {
    try {
      setIsLoadingSuggestions(true);
      const response = await ApiService.getTagSuggestions(videoId);
      
      if (response.success && response.suggestions) {
        setTagSuggestions(response.suggestions);
      }
    } catch (error) {
      console.error('Error loading tag suggestions:', error);
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  const validateTags = async (tags: string[]) => {
    try {
      const response = await ApiService.validateUserTags(tags);
      
      if (response.success) {
        setTagValidation(response.validation);
        return response.validation;
      }
    } catch (error) {
      console.error('Error validating tags:', error);
    }
    return null;
  };

  const addTag = async (tag: string) => {
    const cleanTag = tag.trim().toLowerCase();
    
    if (!cleanTag || userTags.includes(cleanTag)) {
      return;
    }

    const newTags = [...userTags, cleanTag];
    setUserTags(newTags);
    setTagInput('');
    setShowSuggestions(false);

    // Validate tags
    const validation = await validateTags(newTags);
    
    if (validation && validation.errors.length > 0) {
      Alert.alert(
        'Invalid Tags',
        `Some tags are invalid: ${validation.errors.join(', ')}`,
        [{ text: 'OK' }]
      );
    }
  };

  const removeTag = (tagToRemove: string) => {
    const newTags = userTags.filter(tag => tag !== tagToRemove);
    setUserTags(newTags);
    validateTags(newTags);
  };

  const handleSuggestionPress = (suggestion: TagSuggestion) => {
    addTag(suggestion.tag);
  };

  const handleManualProductMatch = async () => {
    if (!manualProductName.trim()) {
      Alert.alert('Error', 'Please enter a product name');
      return;
    }

    setIsLoading(true);
    try {
      let products: ProductFrontend[] = [];

      if (enableEnhancedMatching && userTags.length > 0) {
        // Use enhanced matching with user tags
        const response = await ApiService.matchProductsWithUserTags(videoId, userTags, {
          searchTerm: manualProductName
        });
        
        if (response.success && response.result?.matches) {
          products = response.result.matches.slice(0, 5);
        }
      } else {
        // Use basic product matching
        const response = await apiAdapter.matchProducts([manualProductName]);
        if (response.success && response.products) {
          products = response.products;
        }
      }

      setMatchedProducts(products);
      
      if (products.length === 0) {
        Alert.alert('No Matches', 'No products found matching your input');
      }
    } catch (error) {
      console.error('Error matching products:', error);
      Alert.alert('Error', 'Failed to match products. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleProductSelect = (product: ProductFrontend) => {
    setSelectedProduct(product);
    if (onProductSelect) {
      onProductSelect(product);
    }
  };

  const renderTagSuggestions = () => {
    if (!showSuggestions || tagSuggestions.length === 0) {
      return null;
    }

    return (
      <View style={styles.suggestionsContainer}>
        <Text style={styles.suggestionsTitle}>Suggested Tags:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {tagSuggestions.map((suggestion, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.suggestionChip,
                { backgroundColor: getCategoryColor(suggestion.category) }
              ]}
              onPress={() => handleSuggestionPress(suggestion)}
            >
              <Text style={styles.suggestionText}>{suggestion.tag}</Text>
              <Text style={styles.suggestionCategory}>{suggestion.category}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      product: '#6366f1',
      brand: '#10b981',
      style: '#f59e0b',
      color: '#ef4444',
      material: '#8b5cf6',
      description: '#06b6d4',
      detection: '#84cc16',
      category: '#f97316'
    };
    return colors[category as keyof typeof colors] || '#64748b';
  };

  const renderUserTags = () => {
    if (userTags.length === 0) {
      return null;
    }

    return (
      <View style={styles.tagsContainer}>
        <Text style={styles.tagsTitle}>Your Tags:</Text>
        <View style={styles.tagsList}>
          {userTags.map((tag, index) => (
            <View key={index} style={styles.tagChip}>
              <Text style={styles.tagText}>{tag}</Text>
              <TouchableOpacity
                onPress={() => removeTag(tag)}
                style={styles.removeTagButton}
              >
                <Ionicons name="close" size={16} color="#64748b" />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderTagValidation = () => {
    if (!tagValidation) {
      return null;
    }

    return (
      <View style={styles.validationContainer}>
        {tagValidation.invalid.length > 0 && (
          <View style={styles.validationError}>
            <Text style={styles.validationTitle}>Invalid Tags:</Text>
            {tagValidation.invalid.map((invalid: any, index: number) => (
              <Text key={index} style={styles.validationText}>
                • {invalid.tag}: {invalid.reason}
              </Text>
            ))}
          </View>
        )}
        
        {tagValidation.suggestions.length > 0 && (
          <View style={styles.validationSuggestions}>
            <Text style={styles.validationTitle}>Suggestions:</Text>
            {tagValidation.suggestions.map((suggestion: any, index: number) => (
              <TouchableOpacity
                key={index}
                style={styles.suggestionChip}
                onPress={() => addTag(suggestion.suggestion)}
              >
                <Text style={styles.suggestionText}>
                  {suggestion.original} → {suggestion.suggestion}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    );
  };

  return (
    <ScrollView style={styles.container}>
      {/* Tag Input Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Add Product Tags</Text>
        <Text style={styles.sectionDescription}>
          Add tags to help improve product matching accuracy
        </Text>
        
        <View style={styles.tagInputContainer}>
          <TextInput
            style={styles.tagInput}
            placeholder="Enter a tag (e.g., 'nike', 'running shoes')"
            value={tagInput}
            onChangeText={setTagInput}
            onSubmitEditing={() => addTag(tagInput)}
            onFocus={() => setShowSuggestions(true)}
          />
          <TouchableOpacity
            style={styles.addTagButton}
            onPress={() => addTag(tagInput)}
          >
            <Ionicons name="add" size={20} color="#ffffff" />
          </TouchableOpacity>
        </View>

        {renderUserTags()}
        {renderTagSuggestions()}
        {renderTagValidation()}
      </View>

      {/* Manual Product Input Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Manual Product Input</Text>
        <Text style={styles.sectionDescription}>
          Enter product details manually or let AI suggest matches
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Product name (e.g., 'Nike Air Max 270')"
          value={manualProductName}
          onChangeText={setManualProductName}
        />

        <TextInput
          style={styles.input}
          placeholder="Affiliate link (optional)"
          value={affiliateLink}
          onChangeText={setAffiliateLink}
        />

        <TouchableOpacity
          style={[styles.button, isLoading && styles.buttonDisabled]}
          onPress={handleManualProductMatch}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.buttonText}>
              {enableEnhancedMatching && userTags.length > 0 
                ? 'Find Enhanced Matches' 
                : 'Find Products'
              }
            </Text>
          )}
        </TouchableOpacity>

        {enableEnhancedMatching && userTags.length > 0 && (
          <Text style={styles.enhancedMatchingNote}>
            ✨ Using {userTags.length} user tags for enhanced matching
          </Text>
        )}
      </View>

      {/* Matched Products Section */}
      {matchedProducts.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Matched Products</Text>
          {matchedProducts.map((product, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.productCard,
                selectedProduct?.id === product.id && styles.selectedProduct
              ]}
              onPress={() => handleProductSelect(product)}
            >
              <View style={styles.productInfo}>
                <Text style={styles.productTitle}>{product.title}</Text>
                <Text style={styles.productPrice}>
                  {product.currency} {product.price}
                </Text>
                <Text style={styles.productBrand}>{product.brand}</Text>
              </View>
              <Ionicons 
                name={selectedProduct?.id === product.id ? "checkmark-circle" : "chevron-forward"} 
                size={24} 
                color={selectedProduct?.id === product.id ? "#10b981" : "#64748b"} 
              />
            </TouchableOpacity>
          ))}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f8fafc',
  },
  section: {
    marginBottom: 24,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 16,
  },
  tagInputContainer: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  tagInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#ffffff',
  },
  addTagButton: {
    backgroundColor: '#6366f1',
    borderRadius: 8,
    padding: 12,
    marginLeft: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tagsContainer: {
    marginBottom: 12,
  },
  tagsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  tagsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e0e7ff',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  tagText: {
    fontSize: 14,
    color: '#3730a3',
    marginRight: 4,
  },
  removeTagButton: {
    padding: 2,
  },
  suggestionsContainer: {
    marginBottom: 12,
  },
  suggestionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  suggestionChip: {
    backgroundColor: '#6366f1',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 4,
  },
  suggestionText: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: '500',
  },
  suggestionCategory: {
    fontSize: 10,
    color: '#ffffff',
    opacity: 0.8,
  },
  validationContainer: {
    marginTop: 12,
  },
  validationError: {
    backgroundColor: '#fef2f2',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  validationSuggestions: {
    backgroundColor: '#f0f9ff',
    borderRadius: 8,
    padding: 12,
  },
  validationTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  validationText: {
    fontSize: 12,
    color: '#dc2626',
    marginBottom: 2,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#ffffff',
    marginBottom: 12,
  },
  button: {
    backgroundColor: '#6366f1',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 8,
  },
  buttonDisabled: {
    backgroundColor: '#9ca3af',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  enhancedMatchingNote: {
    fontSize: 12,
    color: '#059669',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  productCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  selectedProduct: {
    borderColor: '#10b981',
    backgroundColor: '#f0fdf4',
  },
  productInfo: {
    flex: 1,
  },
  productTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 14,
    color: '#059669',
    fontWeight: '500',
    marginBottom: 2,
  },
  productBrand: {
    fontSize: 12,
    color: '#64748b',
  },
}); 