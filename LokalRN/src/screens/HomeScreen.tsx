import React, { useState, useEffect, useRef } from 'react';
import { View, Text, FlatList, RefreshControl, Alert, TouchableOpacity, Dimensions, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ShoppableVideoPlayer } from '../components/ShoppableVideoPlayer';
import { ProductCard } from '../components/ProductCard';
import { VideoFrontend, ProductFrontend, Hotspot } from '../types';
import { DatabaseService } from '../services/databaseService';
import { DemoDataService } from '../services/demoData';
import { ApiService, checkNetworkStatus } from '../services/api';
import { formatDate, isDemoMode } from '../utils/helpers';
import { ENV } from '../config/env';
import { useNavigation } from '@react-navigation/native';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../utils/designSystem';
import * as WebBrowser from 'expo-web-browser';

const { height: screenHeight, width: screenWidth } = Dimensions.get('window');

export const HomeScreen: React.FC = () => {
  const navigation = useNavigation();
  const [videos, setVideos] = useState<VideoFrontend[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [useDemoData, setUseDemoData] = useState(false);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [networkStatus, setNetworkStatus] = useState<{ connected: boolean; latency?: number }>({ connected: false });
  const flatListRef = useRef<FlatList>(null);

  // Test network connectivity
  const testNetworkConnection = async () => {
    try {
      console.log('🔍 Testing network connection...');
      
      if (isDemoMode()) {
        console.log('🔧 Demo mode detected - skipping network test');
        setNetworkStatus({ connected: true });
        return;
      }
      
      const status = await checkNetworkStatus();
      setNetworkStatus(status);
      
      if (status.connected) {
        console.log('✅ Network test successful, latency:', status.latency);
      } else {
        console.log('❌ Network test failed');
      }
    } catch (error) {
      console.error('💥 Network test error:', error);
      setNetworkStatus({ connected: false });
    }
  };

  const loadVideos = async () => {
    try {
      setLoading(true);
      console.log('🔄 Loading shoppable videos...');
      
      await testNetworkConnection();
      
      if (isDemoMode()) {
        console.log('🔧 Using demo data mode');
        setUseDemoData(true);
        const demoVideos = DemoDataService.getVideos();
        setVideos(demoVideos);
        console.log('✅ Loaded demo videos:', demoVideos.length);
      } else {
        console.log('🔗 Using Railway PostgreSQL mode');
        const { data, error } = await DatabaseService.getVideos();
        if (error) {
          console.error('❌ Error loading videos from Railway PostgreSQL:', error);
          setUseDemoData(true);
          const demoVideos = DemoDataService.getVideos();
          setVideos(demoVideos);
          console.log('🔄 Fallback to demo videos:', demoVideos.length);
        } else {
          setUseDemoData(false);
          setVideos(data || []);
          console.log('✅ Loaded Railway PostgreSQL videos:', (data || []).length);
        }
      }
    } catch (error) {
      console.error('💥 Error loading videos:', error);
      setUseDemoData(true);
      const demoVideos = DemoDataService.getVideos();
      setVideos(demoVideos);
      console.log('🔄 Fallback to demo videos after error:', demoVideos.length);
    } finally {
      setLoading(false);
      console.log('🏁 Finished loading videos');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadVideos();
    setRefreshing(false);
  };

  useEffect(() => {
    loadVideos();
  }, []);

  // Convert products to interactive hotspots
  const createHotspotsFromProducts = (products: ProductFrontend[]): Hotspot[] => {
    return products.map((product, index) => ({
      id: product.id,
      x: 0.2 + (index * 0.15), // Spread hotspots horizontally
      y: 0.3 + (index * 0.1), // Spread hotspots vertically
      startTime: 0,
      endTime: 60, // Show for first 60 seconds
      product: {
        id: product.id,
        name: product.title,
        price: product.price,
        image: product.imageUrl,
        link: product.buyUrl
      },
      isVisible: true
    }));
  };

  const handleHotspotPress = async (hotspot: Hotspot) => {
    if (hotspot.product?.link) {
      try {
        await WebBrowser.openBrowserAsync(hotspot.product.link);
      } catch (error) {
        console.error('Error opening product link:', error);
        Alert.alert('Error', 'Unable to open product link');
      }
    }
  };

  const handleProductPress = async (product: ProductFrontend) => {
    try {
      await WebBrowser.openBrowserAsync(product.buyUrl);
    } catch (error) {
      console.error('Error opening product link:', error);
      Alert.alert('Error', 'Unable to open product link');
    }
  };

  const onViewableItemsChanged = ({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setCurrentVideoIndex(viewableItems[0].index);
    }
  };

  const renderShoppableVideo = ({ item, index }: { item: VideoFrontend; index: number }) => {
    const hotspots = createHotspotsFromProducts(item.products);
    const isCurrentVideo = index === currentVideoIndex;

    return (
      <View style={{ height: screenHeight, backgroundColor: '#000' }}>
        {/* Status Bar */}
        <StatusBar barStyle="light-content" backgroundColor="#000" />
        
        {/* Interactive Shoppable Video Player */}
        <ShoppableVideoPlayer
          uri={item.videoUrl}
          products={item.products}
          hotspots={hotspots}
          onHotspotPress={handleHotspotPress}
          onProductPress={handleProductPress}
          isInteractive={true}
          showProductOverlay={true}
          autoPlay={isCurrentVideo}
          loop={true}
          style={{ flex: 1 }}
        />
        
        {/* Video Info Overlay */}
        <View style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          padding: Spacing.lg,
          background: 'linear-gradient(transparent, rgba(0,0,0,0.8))',
        }}>
          <View style={{ marginBottom: Spacing.md }}>
            <Text style={{ 
              color: Colors.textPrimary, 
              fontSize: Typography.lg, 
              fontWeight: 'bold',
              marginBottom: Spacing.xs 
            }}>
              {item.title}
            </Text>
            {item.description && (
              <Text style={{ 
                color: Colors.textSecondary, 
                fontSize: Typography.sm,
                marginBottom: Spacing.sm 
              }}>
                {item.description}
              </Text>
            )}
            
            {/* Product Count */}
            {item.products.length > 0 && (
              <View style={{ 
                flexDirection: 'row', 
                alignItems: 'center',
                marginBottom: Spacing.sm 
              }}>
                <Ionicons name="bag-outline" size={16} color={Colors.primary} />
                <Text style={{ 
                  color: Colors.primary, 
                  fontSize: Typography.sm,
                  marginLeft: Spacing.xs,
                  fontWeight: '600'
                }}>
                  {item.products.length} shoppable items
                </Text>
              </View>
            )}
          </View>
          
          {/* Product Carousel */}
          {item.products.length > 0 && (
            <View style={{ marginBottom: Spacing.lg }}>
              <Text style={{ 
                color: Colors.textPrimary, 
                fontSize: Typography.md,
                fontWeight: '600',
                marginBottom: Spacing.sm 
              }}>
                Shop this video
              </Text>
              <FlatList
                data={item.products}
                horizontal
                showsHorizontalScrollIndicator={false}
                renderItem={({ item: product }) => (
                  <View style={{ marginRight: Spacing.md, width: 120 }}>
                    <ProductCard
                      product={product}
                      onPress={() => handleProductPress(product)}
                      compact={true}
                    />
                  </View>
                )}
                keyExtractor={(product) => product.id}
              />
            </View>
          )}
        </View>
        
        {/* Action Buttons */}
        <View style={{
          position: 'absolute',
          right: Spacing.md,
          bottom: 120,
          alignItems: 'center',
        }}>
          <TouchableOpacity style={{
            width: 50,
            height: 50,
            borderRadius: 25,
            backgroundColor: Colors.primary,
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: Spacing.md,
            ...Shadows.lg,
          }}>
            <Ionicons name="heart-outline" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          
          <TouchableOpacity style={{
            width: 50,
            height: 50,
            borderRadius: 25,
            backgroundColor: Colors.primary,
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: Spacing.md,
            ...Shadows.lg,
          }}>
            <Ionicons name="chatbubble-outline" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          
          <TouchableOpacity style={{
            width: 50,
            height: 50,
            borderRadius: 25,
            backgroundColor: Colors.primary,
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: Spacing.md,
            ...Shadows.lg,
          }}>
            <Ionicons name="share-outline" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={{ 
        flex: 1, 
        backgroundColor: '#000', 
        justifyContent: 'center', 
        alignItems: 'center' 
      }}>
        <Text style={{ color: Colors.textPrimary, fontSize: Typography.lg }}>
          Loading shoppable videos...
        </Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <FlatList
        ref={flatListRef}
        data={videos}
        renderItem={renderShoppableVideo}
        keyExtractor={(item) => item.id}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{
          itemVisiblePercentThreshold: 50
        }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
          />
        }
      />
    </View>
  );
}; 