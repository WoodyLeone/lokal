import React, { useState, useEffect, useRef } from 'react';
import { View, Text, FlatList, RefreshControl, Alert, TouchableOpacity, Dimensions, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ShoppableVideoPlayer } from '../components/ShoppableVideoPlayer';
import { ProductCard } from '../components/ProductCard';
import { ShoppableModal } from '../components/ShoppableModal';
import { VideoFrontend, ProductFrontend, Hotspot } from '../types';
import { DatabaseService } from '../services/databaseService';
import { DemoDataService } from '../services/demoData';

import { apiAdapter, checkNetworkStatus } from '../services/apiAdapter';
import { formatDate } from '../utils/helpers';
import { ENV } from '../config/env';
import { useNavigation } from '@react-navigation/native';
import { Colors, Typography, Spacing, BorderRadius, Shadows, TouchTargets, Icons } from '../utils/designSystem';
import { EnhancedButton } from '../components/EnhancedButton';
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
  
  // State for interactive buttons
  const [likedVideos, setLikedVideos] = useState<Set<string>>(new Set());
  const [showComments, setShowComments] = useState(false);
  const [showShoppableModal, setShowShoppableModal] = useState(false);
  const [selectedVideoForShopping, setSelectedVideoForShopping] = useState<VideoFrontend | null>(null);

  // Test network connectivity
  const testNetworkConnection = async () => {
    try {
      console.log('🔍 Testing network connection...');
      
      // Always test network connection - no demo mode
      
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
      
      // Always use Railway backend - no demo mode
      console.log('🔗 Using Railway PostgreSQL mode');
      const { data, error } = await DatabaseService.getVideos();
      if (error) {
        console.error('❌ Error loading videos from Railway PostgreSQL:', error);
        // Fallback to demo videos if database fails
        console.log('🔄 Falling back to demo videos due to database error');
        setUseDemoData(true);
        setVideos(DemoDataService.getVideos());
      } else if (!data || data.length === 0) {
        // If no valid videos in database, use demo videos
        console.log('🔄 No valid videos in database, using demo videos');
        setUseDemoData(true);
        setVideos(DemoDataService.getVideos());
      } else {
        // Double-check that all videos have valid URLs before using them
        const validVideos = data.filter(video => {
          const isValid = video.videoUrl && typeof video.videoUrl === 'string' && 
                          video.videoUrl.startsWith('http') && 
                          !video.videoUrl.includes('demo://') &&
                          !video.videoUrl.includes('example.com') &&
                          !video.videoUrl.includes('sample-videos.com');
          if (!isValid) {
            console.warn(`🚫 Filtering out invalid video: ${video.title} (${video.videoUrl})`);
          }
          return isValid;
        });
        
        if (validVideos.length === 0) {
          console.log('🔄 All database videos are invalid, using demo videos');
          setUseDemoData(true);
          setVideos(DemoDataService.getVideos());
        } else {
          setUseDemoData(false);
          setVideos(validVideos);
          console.log(`✅ Loaded ${validVideos.length} valid videos from Railway PostgreSQL`);
        }
      }
    } catch (error) {
      console.error('💥 Error loading videos:', error);
      // Fallback to demo videos on error
      console.log('🔄 Falling back to demo videos after error');
      setUseDemoData(true);
      setVideos(DemoDataService.getVideos());
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

  // Handle like button
  const handleLike = (videoId: string) => {
    const newLikedVideos = new Set(likedVideos);
    if (likedVideos.has(videoId)) {
      newLikedVideos.delete(videoId);
    } else {
      newLikedVideos.add(videoId);
    }
    setLikedVideos(newLikedVideos);
    
    // Show feedback
    Alert.alert('Success', likedVideos.has(videoId) ? 'Removed from favorites' : 'Added to favorites');
  };

  // Handle comment button
  const handleComment = (videoId: string) => {
    Alert.alert('Comments', 'Comment feature coming soon!', [
      { text: 'OK', style: 'default' }
    ]);
  };

  // Handle share button
  const handleShare = async (video: VideoFrontend) => {
    try {
      Alert.alert(
        'Share Video',
        `Share "${video.title}"`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Copy Link', onPress: () => console.log('Link copied') },
          { text: 'Share', onPress: () => console.log('Sharing video') }
        ]
      );
    } catch (error) {
      console.error('Error sharing video:', error);
    }
  };

  // Handle shopping bag - show curated products from business owner
  const handleShopVideo = (video: VideoFrontend) => {
    console.log('🛍️ Opening shop for video:', video.title);
    console.log('📦 Products tagged by business owner:', video.products.length);
    
    setSelectedVideoForShopping(video);
    setShowShoppableModal(true);
  };

  const renderShoppableVideo = ({ item, index }: { item: VideoFrontend; index: number }) => {
    // Temporarily disable hotspots to fix UI issue - will re-enable with proper positioning
    const hotspots: Hotspot[] = []; // createHotspotsFromProducts(item.products);
    const isCurrentVideo = index === currentVideoIndex;

    return (
      <View style={{ height: screenHeight, backgroundColor: Colors.background }}>
        {/* Status Bar */}
        <StatusBar barStyle="light-content" backgroundColor={Colors.background} />
        
        {/* Interactive Shoppable Video Player - The Magic Happens Here */}
        <ShoppableVideoPlayer
          uri={item.videoUrl}
          products={item.products}
          hotspots={hotspots}
          onHotspotPress={handleHotspotPress}
          onProductPress={handleProductPress}
          isInteractive={false} // Disable interactive mode to prevent duplicate elements
          showProductOverlay={false} // Keep it clean - no overlay
          showTrackingOverlay={false} // Disable tracking overlay temporarily
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
          paddingBottom: Spacing.xl, // Add extra padding to prevent overlap with navigation
          background: 'linear-gradient(transparent, rgba(0,0,0,0.8))',
        }}>
          <View style={{ marginBottom: Spacing.md }}>
            <Text style={{ 
              color: Colors.textPrimary, 
              fontSize: Typography.lg, 
              fontWeight: 'bold',
              marginBottom: Spacing.xs,
              numberOfLines: 2,
              ellipsizeMode: 'tail'
            }}>
              {item.title}
            </Text>
            {item.description && (
              <Text style={{ 
                color: Colors.textSecondary, 
                fontSize: Typography.sm,
                marginBottom: Spacing.sm,
                numberOfLines: 2,
                ellipsizeMode: 'tail'
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
          
          {/* Removed product carousel - keep it clean like TikTok */}
          {/* Products are now accessible via shopping bag button and hotspots */}
        </View>
        
        {/* Action Buttons */}
        <View style={{
          position: 'absolute',
          right: Spacing.lg,
          bottom: screenHeight * 0.15, // Dynamic positioning based on screen height
          alignItems: 'center',
          zIndex: 10,
        }}>
          {/* Like Button */}
          <TouchableOpacity 
            style={{
              width: TouchTargets.large,
              height: TouchTargets.large,
              borderRadius: TouchTargets.large / 2,
              backgroundColor: likedVideos.has(item.id) ? Colors.error : Colors.surface + 'DD',
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: Spacing.lg,
              ...Shadows.lg,
              borderWidth: 2,
              borderColor: likedVideos.has(item.id) ? Colors.error : Colors.border,
            }}
            onPress={() => handleLike(item.id)}
            activeOpacity={0.7}
          >
            <Ionicons 
              name={likedVideos.has(item.id) ? "heart" : "heart-outline"} 
              size={Icons.sizes.lg} 
              color={likedVideos.has(item.id) ? Colors.textPrimary : Colors.textPrimary} 
            />
          </TouchableOpacity>
          
          {/* Comment Button */}
          <TouchableOpacity 
            style={{
              width: TouchTargets.large,
              height: TouchTargets.large,
              borderRadius: TouchTargets.large / 2,
              backgroundColor: Colors.surface + 'DD',
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: Spacing.lg,
              ...Shadows.lg,
              borderWidth: 2,
              borderColor: Colors.border,
            }}
            onPress={() => handleComment(item.id)}
            activeOpacity={0.7}
          >
            <Ionicons name="chatbubble-outline" size={Icons.sizes.lg} color={Colors.textPrimary} />
          </TouchableOpacity>
          
          {/* Share Button */}
          <TouchableOpacity 
            style={{
              width: TouchTargets.large,
              height: TouchTargets.large,
              borderRadius: TouchTargets.large / 2,
              backgroundColor: Colors.surface + 'DD',
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: Spacing.lg,
              ...Shadows.lg,
              borderWidth: 2,
              borderColor: Colors.border,
            }}
            onPress={() => handleShare(item)}
            activeOpacity={0.7}
          >
            <Ionicons name="share-outline" size={Icons.sizes.lg} color={Colors.textPrimary} />
          </TouchableOpacity>
          
                     {/* Shopping Bag Button - The Magic Shopping Experience */}
           <TouchableOpacity 
             style={{
               width: TouchTargets.large,
               height: TouchTargets.large,
               borderRadius: TouchTargets.large / 2,
               backgroundColor: Colors.primary,
               justifyContent: 'center',
               alignItems: 'center',
               ...Shadows.lg,
               borderWidth: 2,
               borderColor: Colors.primaryDark,
             }}
             onPress={() => handleShopVideo(item)}
             activeOpacity={0.7}
           >
             <Ionicons name="bag" size={Icons.sizes.lg} color={Colors.textPrimary} />
             {/* Show badge if there are products */}
             {item.products.length > 0 && (
               <View style={{
                 position: 'absolute',
                 top: -8,
                 right: -8,
                 backgroundColor: Colors.error,
                 borderRadius: 12,
                 width: 24,
                 height: 24,
                 justifyContent: 'center',
                 alignItems: 'center',
                 borderWidth: 2,
                 borderColor: Colors.background,
               }}>
                 <Text style={{
                   color: Colors.textPrimary,
                   fontSize: 12,
                   fontWeight: 'bold',
                 }}>
                   {item.products.length}
                 </Text>
               </View>
             )}
           </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={{ 
        flex: 1, 
        backgroundColor: Colors.background, 
        justifyContent: 'center', 
        alignItems: 'center',
        padding: Spacing.xl,
      }}>
        <View style={{
          backgroundColor: Colors.surface,
          padding: Spacing.xl,
          borderRadius: BorderRadius.xl,
          alignItems: 'center',
          ...Shadows.lg,
        }}>
          <Text style={{ 
            color: Colors.textPrimary, 
            fontSize: Typography.xl,
            fontWeight: 'bold',
            marginBottom: Spacing.lg,
            textAlign: 'center',
          }}>
            Loading Shoppable Videos
          </Text>
          <Text style={{ 
            color: Colors.textSecondary, 
            fontSize: Typography.base,
            textAlign: 'center',
            lineHeight: Typography.base * 1.4,
          }}>
            Discovering amazing videos with interactive shopping experiences...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
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

      {/* Shopping Modal - The Magic Shopping Experience */}
      <ShoppableModal
        visible={showShoppableModal}
        video={selectedVideoForShopping}
        onClose={() => {
          setShowShoppableModal(false);
          setSelectedVideoForShopping(null);
        }}
        onProductPress={handleProductPress}
      />
    </View>
  );
}; 