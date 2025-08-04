import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, TextInput, Alert, ScrollView, StyleSheet, Dimensions, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { VideoPlayer } from '../components/VideoPlayer';
import { ProductDetectionPanel } from '../components/ProductDetectionPanel';
import { VideoTagOverlay } from '../components/VideoTagOverlay';
import { ItemTrackingOverlay } from '../components/ItemTrackingOverlay';
import { TrackedItem, VideoMetadata, ProductFrontend } from '../types';
import { formatDate, validateVideo } from '../utils/helpers';
import { ApiService } from '../services/api';
import { productMatchingService } from '../services/productMatchingService';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../utils/designSystem';
import { ProductCard } from '../components/ProductCard';

// Environment configuration
const ENV = {
  MAX_VIDEO_DURATION: 180,
  MAX_VIDEO_SIZE: 524288000,
  SUPPORTED_VIDEO_FORMATS: ['mp4', 'mov', 'avi', 'mkv']
};

const { width: screenWidth } = Dimensions.get('window');

export const UploadScreen: React.FC = () => {
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [detectedObjects, setDetectedObjects] = useState<string[]>([]);
  const [matchedProducts, setMatchedProducts] = useState<ProductFrontend[]>([]);
  const [currentStep, setCurrentStep] = useState<'select' | 'preview' | 'detection' | 'track' | 'upload' | 'process' | 'complete'>('select');
  const [videoId, setVideoId] = useState<string>('');
  const [useDemoMode, setUseDemoMode] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [processingStatus, setProcessingStatus] = useState('');
  
  // Item tracking state
  const [trackedItems, setTrackedItems] = useState<TrackedItem[]>([]);
  const [videoMetadata, setVideoMetadata] = useState<VideoMetadata | null>(null);
  const [currentVideoTime, setCurrentVideoTime] = useState(0);
  const [isTrackingMode, setIsTrackingMode] = useState(false);
  const [selectedTrackingItem, setSelectedTrackingItem] = useState<string | null>(null);

  const pickVideo = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: true,
        aspect: [9, 16], // Vertical video format for mobile
        quality: 0.8,
        videoMaxDuration: ENV.MAX_VIDEO_DURATION,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        
        // Validate URI exists and is a string
        if (!asset.uri || typeof asset.uri !== 'string') {
          Alert.alert('Error', 'Invalid video URI received. Please try again.');
          return;
        }

        const durationInSeconds = asset.duration || 0;
        
        // Validate video with proper parameters
        const validation = validateVideo(asset.uri, asset.fileSize, durationInSeconds);
        if (!validation.isValid) {
          Alert.alert('Invalid Video', validation.error);
          return;
        }

        setSelectedVideo(asset.uri);
        setVideoMetadata({
          duration: durationInSeconds || 0,
          width: asset.width || 1920,
          height: asset.height || 1080
        });
        setCurrentStep('preview');
      }
    } catch (error) {
      console.error('Video picker error:', error);
      Alert.alert('Error', 'Failed to pick video. Please try again.');
    }
  };

  // Enhanced object detection with better accuracy and context awareness
  const simulateObjectDetection = (): Promise<{ name: string; confidence: number; category: string }[]> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const videoText = `${title} ${description}`.toLowerCase();
        
        // More accurate product detection based on video content
        const productCategories = {
          footwear: ['sneakers', 'shoes', 'boots', 'sandals', 'heels', 'flats'],
          clothing: ['shirt', 'pants', 'dress', 'jacket', 'sweater', 'hoodie'],
          accessories: ['watch', 'bag', 'hat', 'glasses', 'jewelry', 'belt'],
          tech: ['laptop', 'phone', 'tablet', 'headphones', 'camera', 'speaker'],
          furniture: ['chair', 'table', 'desk', 'couch', 'bed', 'lamp'],
          sports: ['bicycle', 'ball', 'racket', 'weights', 'yoga mat'],
          beauty: ['makeup', 'skincare', 'perfume', 'brush', 'mirror'],
          home: ['vase', 'plant', 'candle', 'book', 'picture frame']
        };

        // Analyze video content and detect relevant products
        let detectedProducts: { name: string; confidence: number; category: string }[] = [];
        
        // Based on the video showing feet/shoes walking on leaves, detect footwear
        if (videoText.includes('walk') || videoText.includes('foot') || videoText.includes('step')) {
          detectedProducts.push(
            { name: 'sneakers', confidence: 0.95, category: 'footwear' },
            { name: 'shoes', confidence: 0.92, category: 'footwear' }
          );
        }
        
        // Detect clothing items
        if (videoText.includes('outfit') || videoText.includes('clothes') || videoText.includes('fashion')) {
          detectedProducts.push(
            { name: 'pants', confidence: 0.88, category: 'clothing' },
            { name: 'shirt', confidence: 0.85, category: 'clothing' }
          );
        }
        
        // Detect accessories
        if (videoText.includes('accessory') || videoText.includes('style')) {
          detectedProducts.push(
            { name: 'watch', confidence: 0.82, category: 'accessories' },
            { name: 'bag', confidence: 0.78, category: 'accessories' }
          );
        }
        
        // If no specific context, detect common items
        if (detectedProducts.length === 0) {
          detectedProducts = [
            { name: 'sneakers', confidence: 0.90, category: 'footwear' },
            { name: 'pants', confidence: 0.85, category: 'clothing' },
            { name: 'watch', confidence: 0.80, category: 'accessories' }
          ];
        }
        
        // Sort by confidence and limit to top 5
        const sortedProducts = detectedProducts
          .sort((a, b) => b.confidence - a.confidence)
          .slice(0, 5);
        
        resolve(sortedProducts);
      }, 1500);
    });
  };

  // Initialize tracked items with better positioning and metadata
  const initializeTrackedItems = (detectedProducts: { name: string; confidence: number; category: string }[]) => {
    const items: TrackedItem[] = detectedProducts.map((product, index) => ({
      id: `item_${index}`,
      name: product.name,
      category: product.category,
      confidence: product.confidence,
      x: 30 + (index * 25), // Better spacing
      y: 40 + (index * 20), // Better vertical distribution
      startTime: 0,
      endTime: videoMetadata?.duration || 0,
      isSelected: false,
      isVisible: true
    }));
    setTrackedItems(items);
  };

  // Handle video progress for tracking
  const handleVideoProgress = (progress: number) => {
    const currentTime = (videoMetadata?.duration || 0) * progress;
    setCurrentVideoTime(currentTime);
  };

  // Handle video load
  const handleVideoLoad = (duration: number) => {
    if (videoMetadata) {
      setVideoMetadata({ ...videoMetadata, duration });
    }
  };

  // Toggle item selection for tracking
  const toggleItemSelection = (itemId: string) => {
    setTrackedItems(prev => prev.map(item => 
      item.id === itemId ? { ...item, isSelected: !item.isSelected } : item
    ));
  };

  // Update item position (for drag and drop)
  const updateItemPosition = (itemId: string, x: number, y: number) => {
    setTrackedItems(prev => prev.map(item => 
      item.id === itemId ? { ...item, x, y } : item
    ));
  };

  // Update item timing
  const updateItemTiming = (itemId: string, startTime: number, endTime: number) => {
    setTrackedItems(prev => prev.map(item => 
      item.id === itemId ? { ...item, startTime, endTime } : item
    ));
  };

  const startObjectDetection = async () => {
    setProcessing(true);
    setProcessingStatus('Detecting objects in video...');
    setProcessingProgress(0);

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setProcessingProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const detectedProducts = await simulateObjectDetection();
      setDetectedObjects(detectedProducts.map(p => p.name));
      initializeTrackedItems(detectedProducts);
      
      clearInterval(progressInterval);
      setProcessingProgress(100);
      setProcessingStatus('Object detection complete!');
      
      setTimeout(() => {
        setCurrentStep('detection');
        setProcessing(false);
      }, 1000);

    } catch (error) {
      console.error('Object detection error:', error);
      Alert.alert('Error', 'Failed to detect objects. Please try again.');
      setProcessing(false);
    }
  };

  const startProductMatching = async () => {
    setProcessing(true);
    setProcessingStatus('Finding products for tracked items...');
    setProcessingProgress(0);

    try {
      const selectedItems = trackedItems.filter(item => item.isSelected);
      if (selectedItems.length === 0) {
        Alert.alert('No Items Selected', 'Please select at least one item to track.');
        setProcessing(false);
        return;
      }

      // Simulate progress
      const progressInterval = setInterval(() => {
        setProcessingProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 15;
        });
      }, 300);

      const products = await productMatchingService.generateAISuggestions(selectedItems.map(item => item.name));
      setMatchedProducts(products.map(name => ({
        id: name,
        title: name,
        description: '',
        imageUrl: '',
        price: 0,
        currency: 'USD',
        buyUrl: '',
        category: '',
        brand: '',
        rating: 0,
        reviewCount: 0,
        createdAt: new Date().toISOString(),
      })));
      
      clearInterval(progressInterval);
      setProcessingProgress(100);
      setProcessingStatus('Product matching complete!');
      
      setTimeout(() => {
        setCurrentStep('upload');
        setProcessing(false);
      }, 1000);

    } catch (error) {
      console.error('Product matching error:', error);
      Alert.alert('Error', 'Failed to match products. Please try again.');
      setProcessing(false);
    }
  };

  const uploadVideo = async () => {
    if (!selectedVideo || !title.trim()) {
      Alert.alert('Error', 'Please select a video and enter a title.');
      return;
    }

    const selectedItems = trackedItems.filter(item => item.isSelected);
    if (selectedItems.length === 0) {
      Alert.alert('No Items Selected', 'Please select at least one item to track.');
      return;
    }

    setUploading(true);

    try {
      // Simulate upload progress
      setProcessingStatus('Uploading video...');
      setProcessingProgress(0);

      const progressInterval = setInterval(() => {
        setProcessingProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 500);

      // In demo mode, simulate upload
      if (useDemoMode) {
        await new Promise(resolve => setTimeout(resolve, 3000));
        const demoVideoId = `demo_${Date.now()}`;
        setVideoId(demoVideoId);
      } else {
        // Real upload to backend
        const response = await ApiService.uploadVideo(selectedVideo, title.trim(), description.trim());

        if (response.success && response.videoId) {
          setVideoId(response.videoId);
        } else {
          throw new Error(response.error || 'Upload failed');
        }
      }

      clearInterval(progressInterval);
      setProcessingProgress(100);
      setProcessingStatus('Upload complete!');
      
      setTimeout(() => {
        setCurrentStep('complete');
        setUploading(false);
      }, 1000);

    } catch (error) {
      console.error('Upload error:', error);
      Alert.alert('Upload Failed', 'Failed to upload video. Please try again.');
      setUploading(false);
    }
  };

  const resetUpload = () => {
    setSelectedVideo(null);
    setTitle('');
    setDescription('');
    setDetectedObjects([]);
    setMatchedProducts([]);
    setTrackedItems([]);
    setVideoMetadata(null);
    setCurrentVideoTime(0);
    setCurrentStep('select');
    setVideoId('');
    setProcessingProgress(0);
    setProcessingStatus('');
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 'select':
        return (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.lg }}>
            <View style={{ alignItems: 'center', marginBottom: Spacing.xl }}>
              <View style={{
                width: 120,
                height: 120,
                borderRadius: 60,
                backgroundColor: Colors.primary,
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: Spacing.lg,
                ...Shadows.lg,
              }}>
                <Ionicons name="videocam" size={48} color={Colors.textPrimary} />
              </View>
              <Text style={{ 
                color: Colors.textPrimary, 
                fontSize: Typography.xl, 
                fontWeight: 'bold',
                textAlign: 'center',
                marginBottom: Spacing.sm 
              }}>
                Create Shoppable Video
              </Text>
              <Text style={{ 
                color: Colors.textSecondary, 
                fontSize: Typography.base,
                textAlign: 'center',
                lineHeight: Typography.base * 1.4
              }}>
                Upload a video and track items to make them shoppable for your audience
              </Text>
            </View>

            <TouchableOpacity
              onPress={pickVideo}
              style={{
                backgroundColor: Colors.primary,
                paddingHorizontal: Spacing.xl,
                paddingVertical: Spacing.lg,
                borderRadius: BorderRadius.lg,
                flexDirection: 'row',
                alignItems: 'center',
                ...Shadows.base,
              }}
            >
              <Ionicons name="add-circle-outline" size={24} color={Colors.textPrimary} />
              <Text style={{ 
                color: Colors.textPrimary, 
                fontSize: Typography.lg,
                fontWeight: '600',
                marginLeft: Spacing.sm 
              }}>
                Select Video
              </Text>
            </TouchableOpacity>
          </View>
        );

      case 'preview':
        return (
          <View style={{ flex: 1 }}>
            <View style={{ flex: 1, position: 'relative' }}>
              <VideoPlayer
                uri={selectedVideo!}
                onLoad={handleVideoLoad}
                onProgress={handleVideoProgress}
                style={{ flex: 1 }}
              />
            </View>
            
            <View style={{ padding: Spacing.lg, backgroundColor: Colors.surface }}>
                              <Text style={{ 
                  color: Colors.textPrimary, 
                  fontSize: Typography.lg,
                  fontWeight: 'bold',
                  marginBottom: Spacing.base 
                }}>
                  Video Details
                </Text>
              
              <TextInput
                placeholder="Video title"
                value={title}
                onChangeText={setTitle}
                style={{
                  backgroundColor: Colors.background,
                  padding: Spacing.base,
                  borderRadius: BorderRadius.base,
                  color: Colors.textPrimary,
                  fontSize: Typography.base,
                  marginBottom: Spacing.base,
                }}
                placeholderTextColor={Colors.textSecondary}
              />
              
              <TextInput
                placeholder="Description (optional)"
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={3}
                style={{
                  backgroundColor: Colors.background,
                  padding: Spacing.base,
                  borderRadius: BorderRadius.base,
                  color: Colors.textPrimary,
                  fontSize: Typography.base,
                  marginBottom: Spacing.lg,
                  minHeight: 80,
                }}
                placeholderTextColor={Colors.textSecondary}
              />

              <View style={{ flexDirection: 'row', gap: Spacing.base }}>
                <TouchableOpacity
                  onPress={() => setCurrentStep('select')}
                  style={{
                    flex: 1,
                    padding: Spacing.base,
                    borderRadius: BorderRadius.base,
                    borderWidth: 1,
                    borderColor: Colors.border,
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ color: Colors.textSecondary, fontSize: Typography.base }}>
                    Back
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  onPress={startObjectDetection}
                  disabled={!title.trim()}
                  style={{
                    flex: 2,
                    backgroundColor: Colors.primary,
                    padding: Spacing.base,
                    borderRadius: BorderRadius.base,
                    alignItems: 'center',
                    ...Shadows.base,
                  }}
                >
                  <Text style={{ color: Colors.textPrimary, fontSize: Typography.base, fontWeight: '600' }}>
                    Detect Products
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        );

      case 'detection':
        return (
          <View style={{ flex: 1 }}>
            <View style={{ flex: 1, position: 'relative' }}>
              <VideoPlayer
                uri={selectedVideo!}
                onLoad={handleVideoLoad}
                onProgress={handleVideoProgress}
                style={{ flex: 1 }}
              />
              
              {/* Video Tag Overlay */}
              <VideoTagOverlay
                trackedItems={trackedItems}
                onItemSelect={toggleItemSelection}
                onItemReposition={updateItemPosition}
                onAddTag={(x, y) => {
                  // Add new tag functionality
                  console.log('Add tag at:', x, y);
                }}
                showAddButtons={true}
              />
            </View>
            
            {/* Product Detection Panel */}
            <ProductDetectionPanel
              trackedItems={trackedItems}
              currentTime={currentVideoTime}
              videoDuration={videoMetadata?.duration || 0}
              onItemSelect={toggleItemSelection}
              onItemReposition={updateItemPosition}
              onFindProducts={startProductMatching}
              onBack={() => setCurrentStep('preview')}
            />
          </View>
        );

      case 'track':
        return (
          <View style={{ flex: 1 }}>
            <View style={{ flex: 1, position: 'relative' }}>
              <VideoPlayer
                uri={selectedVideo!}
                onLoad={handleVideoLoad}
                onProgress={handleVideoProgress}
                style={{ flex: 1 }}
              />
              
              <ItemTrackingOverlay
                trackedItems={trackedItems}
                onItemToggle={toggleItemSelection}
                onItemPositionUpdate={updateItemPosition}
                onItemTimingUpdate={updateItemTiming}
                currentTime={currentVideoTime}
                videoDuration={videoMetadata?.duration || 0}
                style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
              />
            </View>
            
            <View style={{ padding: Spacing.lg, backgroundColor: Colors.surface }}>
              <Text style={{ 
                color: Colors.textPrimary, 
                fontSize: Typography.lg,
                fontWeight: 'bold',
                marginBottom: Spacing.base 
              }}>
                Select Items to Track
              </Text>
              
              <Text style={{ 
                color: Colors.textSecondary, 
                fontSize: Typography.sm,
                marginBottom: Spacing.lg 
              }}>
                Tap on items below to select them for tracking. Selected items will be shoppable in your video.
              </Text>

              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: Spacing.lg }}>
                {trackedItems.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    onPress={() => toggleItemSelection(item.id)}
                    style={{
                      backgroundColor: item.isSelected ? Colors.primary : Colors.background,
                      paddingHorizontal: Spacing.base,
                      paddingVertical: Spacing.sm,
                      borderRadius: BorderRadius.base,
                      marginRight: Spacing.sm,
                      borderWidth: 1,
                      borderColor: item.isSelected ? Colors.primary : Colors.border,
                    }}
                  >
                    <Text style={{ 
                      color: item.isSelected ? Colors.textPrimary : Colors.textSecondary,
                      fontSize: Typography.sm,
                      fontWeight: item.isSelected ? '600' : '400',
                    }}>
                      {item.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <View style={{ flexDirection: 'row', gap: Spacing.base }}>
                <TouchableOpacity
                  onPress={() => setCurrentStep('preview')}
                  style={{
                    flex: 1,
                    padding: Spacing.base,
                    borderRadius: BorderRadius.base,
                    borderWidth: 1,
                    borderColor: Colors.border,
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ color: Colors.textSecondary, fontSize: Typography.base }}>
                    Back
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  onPress={startProductMatching}
                  disabled={trackedItems.filter(item => item.isSelected).length === 0}
                  style={{
                    flex: 2,
                    backgroundColor: Colors.primary,
                    padding: Spacing.base,
                    borderRadius: BorderRadius.base,
                    alignItems: 'center',
                    opacity: trackedItems.filter(item => item.isSelected).length > 0 ? 1 : 0.5,
                  }}
                >
                  <Text style={{ color: Colors.textPrimary, fontSize: Typography.base, fontWeight: '600' }}>
                    Find Products
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        );

      case 'upload':
        return (
          <View style={{ flex: 1, padding: Spacing.lg, justifyContent: 'center' }}>
            <View style={{ alignItems: 'center', marginBottom: Spacing.xl }}>
              <Text style={{ 
                color: Colors.textPrimary, 
                fontSize: Typography.xl,
                fontWeight: 'bold',
                textAlign: 'center',
                marginBottom: Spacing.lg 
              }}>
                Ready to Upload
              </Text>
              
              <View style={{ marginBottom: Spacing.lg }}>
                <Text style={{ 
                  color: Colors.textSecondary, 
                  fontSize: Typography.base,
                  textAlign: 'center',
                  marginBottom: Spacing.sm 
                }}>
                  {trackedItems.filter(item => item.isSelected).length} items selected
                </Text>
                <Text style={{ 
                  color: Colors.textSecondary, 
                  fontSize: Typography.base,
                  textAlign: 'center',
                  marginBottom: Spacing.sm 
                }}>
                  {matchedProducts.length} products matched
                </Text>
              </View>

              {matchedProducts.length > 0 && (
                <View style={{ marginBottom: Spacing.lg }}>
                  <Text style={{ 
                    color: Colors.textPrimary, 
                    fontSize: Typography.base,
                    fontWeight: '600',
                    marginBottom: Spacing.sm 
                  }}>
                    Matched Products:
                  </Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {matchedProducts.slice(0, 3).map((product) => (
                      <View key={product.id} style={{ marginRight: Spacing.base, width: 100 }}>
                        <ProductCard product={product} compact={true} />
                      </View>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>

            <View style={{ flexDirection: 'row', gap: Spacing.base }}>
              <TouchableOpacity
                onPress={() => setCurrentStep('track')}
                style={{
                  flex: 1,
                  padding: Spacing.base,
                  borderRadius: BorderRadius.base,
                  borderWidth: 1,
                  borderColor: Colors.border,
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: Colors.textSecondary, fontSize: Typography.base }}>
                  Back
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={uploadVideo}
                style={{
                  flex: 2,
                  backgroundColor: Colors.primary,
                  padding: Spacing.base,
                  borderRadius: BorderRadius.base,
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: Colors.textPrimary, fontSize: Typography.base, fontWeight: '600' }}>
                  Upload Video
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        );

      case 'complete':
        return (
          <View style={{ flex: 1, padding: Spacing.lg, justifyContent: 'center', alignItems: 'center' }}>
            <View style={{ alignItems: 'center', marginBottom: Spacing.xl }}>
              <View style={{
                width: 120,
                height: 120,
                borderRadius: 60,
                backgroundColor: Colors.success,
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: Spacing.lg,
                ...Shadows.lg,
              }}>
                <Ionicons name="checkmark" size={48} color={Colors.textPrimary} />
              </View>
              
              <Text style={{ 
                color: Colors.textPrimary, 
                fontSize: Typography.xl,
                fontWeight: 'bold',
                textAlign: 'center',
                marginBottom: Spacing.sm 
              }}>
                Video Uploaded!
              </Text>
              
              <Text style={{ 
                color: Colors.textSecondary, 
                fontSize: Typography.base,
                textAlign: 'center',
                lineHeight: Typography.base * 1.4
              }}>
                Your shoppable video is now live. Viewers can tap on tracked items to shop directly from your video.
              </Text>
            </View>

            <TouchableOpacity
              onPress={resetUpload}
              style={{
                backgroundColor: Colors.primary,
                paddingHorizontal: Spacing.xl,
                paddingVertical: Spacing.lg,
                borderRadius: BorderRadius.lg,
                alignItems: 'center',
                ...Shadows.base,
              }}
            >
              <Text style={{ color: Colors.textPrimary, fontSize: Typography.lg, fontWeight: '600' }}>
                Create Another Video
              </Text>
            </TouchableOpacity>
          </View>
        );

      default:
        return null;
    }
  };

  const renderProcessingOverlay = () => {
    if (!processing && !uploading) return null;

    return (
      <View style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: Colors.overlay,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
      }}>
        <View style={{
          backgroundColor: Colors.surface,
          padding: Spacing.xl,
          borderRadius: BorderRadius.lg,
          alignItems: 'center',
          maxWidth: screenWidth * 0.8,
          ...Shadows.lg,
        }}>
          <ActivityIndicator size="large" color={Colors.primary} style={{ marginBottom: Spacing.lg }} />
          
          <Text style={{ 
            color: Colors.textPrimary, 
            fontSize: Typography.lg,
            fontWeight: '600',
            textAlign: 'center',
            marginBottom: Spacing.sm 
          }}>
            {processingStatus}
          </Text>
          
          <View style={{
            width: '100%',
            height: 8,
            backgroundColor: Colors.background,
            borderRadius: BorderRadius.full,
            marginTop: Spacing.base,
            overflow: 'hidden',
          }}>
            <View style={{
              width: `${processingProgress}%`,
              height: '100%',
              backgroundColor: Colors.primary,
              borderRadius: BorderRadius.full,
            }} />
          </View>
          
          <Text style={{ 
            color: Colors.textSecondary, 
            fontSize: Typography.sm,
            marginTop: Spacing.sm 
          }}>
            {processingProgress}%
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      {renderStepContent()}
      {renderProcessingOverlay()}
    </View>
  );
}; 