import React from 'react';
import { View, Text, Image, TouchableOpacity, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as WebBrowser from 'expo-web-browser';
import { ProductFrontend } from '../types';
import { formatPrice, truncateText } from '../utils/helpers';

interface ProductCardProps {
  product: ProductFrontend;
  onPress?: () => void;
}

const { width } = Dimensions.get('window');
const cardWidth = width * 0.4;

export const ProductCard: React.FC<ProductCardProps> = ({ product, onPress }) => {
  const handlePress = async () => {
    if (onPress) {
      onPress();
    } else {
      // Open the buy URL in an in-app browser
      await WebBrowser.openBrowserAsync(product.buyUrl);
    }
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      style={{ width: cardWidth, marginRight: 16, borderRadius: 12, overflow: 'hidden' }}
    >
      <View style={{ backgroundColor: '#1e293b', borderRadius: 12, overflow: 'hidden' }}>
        <Image
          source={{ uri: product.imageUrl }}
          style={{ width: '100%', height: 128 }}
          resizeMode="cover"
        />
        <LinearGradient
          colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.8)']}
          style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 64 }}
        />
        
        <View style={{ padding: 12 }}>
          <Text 
            style={{ color: '#f8fafc', fontWeight: '600', fontSize: 14, marginBottom: 4 }}
            numberOfLines={2}
          >
            {truncateText(product.title, 40)}
          </Text>
          
          <Text 
            style={{ color: '#94a3b8', fontSize: 12, marginBottom: 8 }}
            numberOfLines={1}
          >
            {product.brand || product.category}
          </Text>
          
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={{ color: '#f59e0b', fontWeight: 'bold', fontSize: 18 }}>
              {formatPrice(product.price, product.currency)}
            </Text>
            
            {product.rating && (
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={{ color: '#fbbf24', fontSize: 12 }}>★</Text>
                <Text style={{ color: '#94a3b8', fontSize: 12, marginLeft: 4 }}>
                  {product.rating.toFixed(1)}
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}; 