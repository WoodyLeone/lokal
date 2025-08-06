import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, TextInput, Alert, ScrollView, StyleSheet, Dimensions, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { VideoPlayer } from '../components/VideoPlayer';
import { ProductDetectionPanel } from '../components/ProductDetectionPanel';
import { VideoTagOverlay } from '../components/VideoTagOverlay';
import { ItemTrackingOverlay } from '../components/ItemTrackingOverlay';
import { TrackedItem, VideoMetadata, ProductFrontend } from '../types';
import { formatDate, validateVideo, isLocalFileUrl } from '../utils/helpers';
import { apiAdapter } from '../services/apiAdapter';
import { productMatchingService } from '../services/productMatchingService';
import { Colors, Typography, Spacing, BorderRadius, Shadows, TouchTargets, Icons, ComponentStyles } from '../utils/designSystem';
import { ProductCard } from '../components/ProductCard';
import { EnhancedButton } from '../components/EnhancedButton';
import { EnhancedLoading } from '../components/EnhancedLoading';

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

  const [processingProgress, setProcessingProgress] = useState(0);
  const [processingStatus, setProcessingStatus] = useState('');
  
  // Enhanced error handling and loading states
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [detectionProgress, setDetectionProgress] = useState(0);
  const [matchingProgress, setMatchingProgress] = useState(0);
  const [retryCount, setRetryCount] = useState(0);
  const [maxRetries] = useState(3);
  
  // Item tracking state
  const [trackedItems, setTrackedItems] = useState<TrackedItem[]>([]);
  const [videoMetadata, setVideoMetadata] = useState<VideoMetadata | null>(null);
  const [currentVideoTime, setCurrentVideoTime] = useState(0);
  const [isTrackingMode, setIsTrackingMode] = useState(false);
  const [selectedTrackingItem, setSelectedTrackingItem] = useState<string | null>(null);

  // Clear error when user takes action
  const clearError = () => setError(null);

  const pickVideo = async () => {
    try {
      clearError();
      setIsLoading(true);
      
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
          throw new Error('Invalid video URI received. Please try again.');
        }

        const durationInSeconds = asset.duration || 0;
        
        // Validate video with proper parameters
        const validation = validateVideo(asset.uri, asset.fileSize, durationInSeconds);
        if (!validation.isValid) {
          throw new Error(validation.error);
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
      setError(error instanceof Error ? error.message : 'Failed to pick video. Please try again.');
    } finally {
      setIsLoading(false);
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
          sports: ['basketball', 'soccer', 'tennis', 'golf', 'yoga', 'fitness'],
          beauty: ['makeup', 'skincare', 'perfume', 'brush', 'mirror', 'cosmetics'],
          kitchen: ['coffee', 'tea', 'cup', 'plate', 'utensils', 'appliances'],
          outdoor: ['car', 'bike', 'tent', 'backpack', 'hiking', 'camping'],
          home: ['plant', 'candle', 'book', 'art', 'decor', 'storage']
        };

        const detectedObjects = [];
        
        // Analyze video title and description for context
        for (const [category, items] of Object.entries(productCategories)) {
          for (const item of items) {
            if (videoText.includes(item)) {
              detectedObjects.push({
                name: item,
                confidence: 0.8 + Math.random() * 0.2,
                category
              });
            }
          }
        }

        // Add some random detections if none found
        if (detectedObjects.length === 0) {
          const randomItems = ['laptop', 'phone', 'headphones', 'watch', 'shoes'];
          const randomItem = randomItems[Math.floor(Math.random() * randomItems.length)];
          detectedObjects.push({
            name: randomItem,
            confidence: 0.7 + Math.random() * 0.3,
            category: 'tech'
          });
        }

        resolve(detectedObjects);
      }, 2000);
    });
  };

  const initializeTrackedItems = (detectedProducts: { name: string; confidence: number; category: string }[]) => {
    const items: TrackedItem[] = detectedProducts.map((product, index) => ({
      id: `item_${index}`,
      name: product.name,
      category: product.category,
      confidence: product.confidence,
      isSelected: true,
      x: 0.2 + (index * 0.2),
      y: 0.3,
      startTime: 0,
      endTime: videoMetadata?.duration || 10,
      isVisible: true
    }));
    setTrackedItems(items);
  };

  const handleVideoProgress = (progress: number) => {
    setCurrentVideoTime(progress);
  };

  const handleVideoLoad = (duration: number) => {
    if (videoMetadata) {
      setVideoMetadata({ ...videoMetadata, duration });
    }
  };

  const toggleItemSelection = (itemId: string) => {
    setTrackedItems(prev => prev.map(item => 
      item.id === itemId ? { ...item, isSelected: !item.isSelected } : item
    ));
  };

  const updateItemPosition = (itemId: string, x: number, y: number) => {
    setTrackedItems(prev => prev.map(item => 
      item.id === itemId ? { ...item, position: { x, y } } : item
    ));
  };

  const updateItemTiming = (itemId: string, startTime: number, endTime: number) => {
    setTrackedItems(prev => prev.map(item => 
      item.id === itemId ? { ...item, timing: { start: startTime, end: endTime } } : item
    ));
  };

  const startObjectDetection = async () => {
    try {
      clearError();
      setProcessing(true);
      setDetectionProgress(0);
      setCurrentStep('detection');

      // First, check if video needs to be uploaded
      if (!videoId) {
        if (!selectedVideo || !title.trim()) {
          throw new Error('Please provide a video title before detection');
        }

        setProcessingStatus('Uploading video...');
        
        // Upload the video first
        const uploadProgress = setInterval(() => {
          setDetectionProgress(prev => {
            if (prev >= 45) {
              clearInterval(uploadProgress);
              return 45;
            }
            return prev + 5;
          });
        }, 200);

        // Choose upload method based on whether it's a local file or remote URL
        let uploadResponse;
        if (isLocalFileUrl(selectedVideo)) {
          console.log('📤 Uploading local video file for detection...');
          uploadResponse = await apiAdapter.uploadVideoFile(selectedVideo, title.trim(), description.trim());
        } else {
          console.log('📤 Uploading remote video URL for detection...');
          uploadResponse = await apiAdapter.uploadVideo(selectedVideo, title.trim(), description.trim());
        }

        clearInterval(uploadProgress);

        if (!uploadResponse.success || !uploadResponse.videoId) {
          throw new Error(uploadResponse.error || 'Video upload failed');
        }

        setVideoId(uploadResponse.videoId);
        setDetectionProgress(50);
      }

      setProcessingStatus('Analyzing video for objects...');

      // Simulate detection progress
      const detectionProgress = setInterval(() => {
        setDetectionProgress(prev => {
          if (prev >= 90) {
            clearInterval(detectionProgress);
            return 90;
          }
          return prev + 10;
        });
      }, 300);

      let detectedProducts;
      
      // Real object detection with uploaded videoId
      const response = await apiAdapter.detectObjects(videoId);
      if (response.success && response.objects) {
        detectedProducts = response.objects.map((obj: string) => ({
          name: obj,
          confidence: 0.8,
          category: 'general'
        }));
      } else {
        throw new Error(response.error || 'Object detection failed');
      }

      clearInterval(detectionProgress);
      setDetectionProgress(100);
      setProcessingStatus('Objects detected successfully!');

      const objectNames = detectedProducts.map(p => p.name);
      setDetectedObjects(objectNames);
      initializeTrackedItems(detectedProducts);

      setTimeout(() => {
        setCurrentStep('track');
        setProcessing(false);
        setDetectionProgress(0);
      }, 1000);

    } catch (error) {
      console.error('Object detection error:', error);
      setError(error instanceof Error ? error.message : 'Object detection failed. Please try again.');
      setProcessing(false);
      setDetectionProgress(0);
      setCurrentStep('preview'); // Go back to preview on error
    }
  };

  const startProductMatching = async () => {
    try {
      clearError();
      setProcessing(true);
      setMatchingProgress(0);
      setProcessingStatus('Finding matching products...');

      const progressInterval = setInterval(() => {
        setMatchingProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 20;
        });
      }, 200);

      let products;
      
      const response = await apiAdapter.matchProducts(detectedObjects);
      if (response.success && response.products) {
        products = response.products;
      } else {
        throw new Error(response.error || 'Product matching failed');
      }

      clearInterval(progressInterval);
      setMatchingProgress(100);
      setProcessingStatus('Products matched successfully!');

      setMatchedProducts(products);

      setTimeout(() => {
        setCurrentStep('upload');
        setProcessing(false);
        setMatchingProgress(0);
      }, 1000);

    } catch (error) {
      console.error('Product matching error:', error);
      setError(error instanceof Error ? error.message : 'Product matching failed. Please try again.');
      setProcessing(false);
      setMatchingProgress(0);
    }
  };

  const uploadVideo = async () => {
    if (!selectedVideo || !title.trim()) {
      setError('Please select a video and enter a title.');
      return;
    }

    const selectedItems = trackedItems.filter(item => item.isSelected);
    if (selectedItems.length === 0) {
      setError('Please select at least one item to track.');
      return;
    }

    setUploading(true);
    clearError();

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

      // Choose upload method based on whether it's a local file or remote URL
      let response;
      if (isLocalFileUrl(selectedVideo)) {
        console.log('📤 Uploading local video file...');
        response = await apiAdapter.uploadVideoFile(selectedVideo, title.trim(), description.trim());
      } else {
        console.log('📤 Uploading remote video URL...');
        response = await apiAdapter.uploadVideo(selectedVideo, title.trim(), description.trim());
      }

      if (response.success && response.videoId) {
        setVideoId(response.videoId);
      } else {
        throw new Error(response.error || 'Upload failed');
      }

      clearInterval(progressInterval);
      setProcessingProgress(100);
      setProcessingStatus('Upload complete!');
      
      setTimeout(() => {
        setCurrentStep('complete');
        setUploading(false);
        setRetryCount(0); // Reset retry count on success
      }, 1000);

    } catch (error) {
      console.error('Upload error:', error);
      
      // Implement retry logic
      if (retryCount < maxRetries) {
        setRetryCount(prev => prev + 1);
        setError(`Upload failed. Retrying... (${retryCount + 1}/${maxRetries})`);
        
        // Auto-retry after 2 seconds
        setTimeout(() => {
          setError(null);
          uploadVideo();
        }, 2000);
      } else {
        setError(error instanceof Error ? error.message : 'Upload failed after multiple attempts. Please try again.');
        setUploading(false);
        setRetryCount(0);
      }
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
    setError(null);
    setRetryCount(0);
    setDetectionProgress(0);
    setMatchingProgress(0);
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
                <Ionicons name="videocam-outline" size={48} color={Colors.textPrimary} />
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
                Upload a video and we'll automatically detect products for your viewers to shop.
              </Text>
            </View>

            <EnhancedButton
              title={isLoading ? "Loading..." : "Select Video"}
              variant="primary"
              size="large"
              icon={isLoading ? undefined : "cloud-upload"}
              onPress={pickVideo}
              disabled={isLoading}
              loading={isLoading}
            />

            {/* Error Display */}
            {error && (
              <View style={{
                backgroundColor: Colors.error,
                padding: Spacing.base,
                borderRadius: BorderRadius.md,
                marginTop: Spacing.lg,
                maxWidth: screenWidth * 0.8,
              }}>
                <Text style={{ color: Colors.textPrimary, fontSize: Typography.sm, textAlign: 'center' }}>
                  {error}
                </Text>
              </View>
            )}


          </View>
        );

      case 'preview':
        return (
          <ScrollView style={{ flex: 1, padding: Spacing.lg }}>
            <View style={{ alignItems: 'center', marginBottom: Spacing.lg }}>
              <Text style={{ 
                color: Colors.textPrimary, 
                fontSize: Typography.xl, 
                fontWeight: 'bold',
                marginBottom: Spacing.sm 
              }}>
                Preview Video
              </Text>
              <Text style={{ 
                color: Colors.textSecondary, 
                fontSize: Typography.base,
                textAlign: 'center'
              }}>
                Review your video before processing
              </Text>
            </View>

            {selectedVideo && (
              <View style={{ marginBottom: Spacing.lg }}>
                <VideoPlayer
                  uri={selectedVideo}
                  onProgress={handleVideoProgress}
                  onLoad={handleVideoLoad}
                />
              </View>
            )}

            <View style={{ marginBottom: Spacing.lg }}>
              <Text style={{ 
                color: Colors.textPrimary, 
                fontSize: Typography.lg, 
                fontWeight: '600',
                marginBottom: Spacing.sm 
              }}>
                Video Details
              </Text>
              
              <TextInput
                placeholder="Video Title"
                value={title}
                onChangeText={setTitle}
                style={{
                  backgroundColor: Colors.surface,
                  padding: Spacing.base,
                  borderRadius: BorderRadius.md,
                  color: Colors.textPrimary,
                  fontSize: Typography.base,
                  marginBottom: Spacing.sm,
                  borderWidth: 1,
                  borderColor: Colors.border,
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
                  backgroundColor: Colors.surface,
                  padding: Spacing.base,
                  borderRadius: BorderRadius.md,
                  color: Colors.textPrimary,
                  fontSize: Typography.base,
                  borderWidth: 1,
                  borderColor: Colors.border,
                  textAlignVertical: 'top',
                }}
                placeholderTextColor={Colors.textSecondary}
              />
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: Spacing.md }}>
              <View style={{ flex: 1 }}>
                <EnhancedButton
                  title="Back"
                  variant="secondary"
                  size="medium"
                  onPress={() => setCurrentStep('select')}
                />
              </View>

              <View style={{ flex: 1 }}>
                <EnhancedButton
                  title="Upload & Detect"
                  variant="primary"
                  size="medium"
                  onPress={startObjectDetection}
                  disabled={!title.trim() || processing}
                  loading={processing}
                />
              </View>
            </View>

            {/* Error Display */}
            {error && (
              <View style={{
                backgroundColor: Colors.error,
                padding: Spacing.base,
                borderRadius: BorderRadius.md,
                marginTop: Spacing.lg,
              }}>
                <Text style={{ color: Colors.textPrimary, fontSize: Typography.sm, textAlign: 'center' }}>
                  {error}
                </Text>
              </View>
            )}
          </ScrollView>
        );

      case 'detection':
        return (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.lg }}>
            <View style={{ alignItems: 'center', marginBottom: Spacing.xl }}>
              <ActivityIndicator size="large" color={Colors.primary} style={{ marginBottom: Spacing.lg }} />
              <Text style={{ 
                color: Colors.textPrimary, 
                fontSize: Typography.xl, 
                fontWeight: 'bold',
                textAlign: 'center',
                marginBottom: Spacing.sm 
              }}>
                Detecting Objects
              </Text>
              <Text style={{ 
                color: Colors.textSecondary, 
                fontSize: Typography.base,
                textAlign: 'center',
                lineHeight: Typography.base * 1.4
              }}>
                Analyzing your video to identify products and objects...
              </Text>
            </View>

            {/* Progress Bar */}
            <View style={{
              width: '100%',
              height: 8,
              backgroundColor: Colors.background,
              borderRadius: BorderRadius.full,
              marginBottom: Spacing.sm,
              overflow: 'hidden',
            }}>
              <View style={{
                width: `${detectionProgress}%`,
                height: '100%',
                backgroundColor: Colors.primary,
                borderRadius: BorderRadius.full,
              }} />
            </View>
            
            <Text style={{ 
              color: Colors.textSecondary, 
              fontSize: Typography.sm 
            }}>
              {detectionProgress}% Complete
            </Text>

            {/* Error Display */}
            {error && (
              <View style={{
                backgroundColor: Colors.error,
                padding: Spacing.base,
                borderRadius: BorderRadius.md,
                marginTop: Spacing.xl,
                maxWidth: screenWidth * 0.8,
              }}>
                <Text style={{ color: Colors.textPrimary, fontSize: Typography.sm, textAlign: 'center' }}>
                  {error}
                </Text>
                <TouchableOpacity
                  onPress={startObjectDetection}
                  style={{
                    backgroundColor: Colors.primary,
                    padding: Spacing.sm,
                    borderRadius: BorderRadius.sm,
                    marginTop: Spacing.sm,
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ color: Colors.textPrimary, fontSize: Typography.sm }}>
                    Retry Detection
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        );

      case 'track':
        return (
          <View style={{ flex: 1 }}>
            <View style={{ padding: Spacing.lg }}>
              <Text style={{ 
                color: Colors.textPrimary, 
                fontSize: Typography.xl, 
                fontWeight: 'bold',
                marginBottom: Spacing.sm 
              }}>
                Track Products
              </Text>
              <Text style={{ 
                color: Colors.textSecondary, 
                fontSize: Typography.base,
                marginBottom: Spacing.lg 
              }}>
                Select which products to track and customize their positions
              </Text>
            </View>

            {selectedVideo && (
              <View style={{ flex: 1, position: 'relative' }}>
                <VideoPlayer
                  uri={selectedVideo}
                  onProgress={handleVideoProgress}
                  onLoad={handleVideoLoad}
                />
                
                {/* Hide tracking overlay in production - only show in development */}
                {__DEV__ && (
                  <ItemTrackingOverlay
                    trackedItems={trackedItems}
                    onItemToggle={toggleItemSelection}
                    onItemPositionUpdate={updateItemPosition}
                    onItemTimingUpdate={updateItemTiming}
                    currentTime={currentVideoTime}
                    videoDuration={videoMetadata?.duration || 0}
                  />
                )}
              </View>
            )}

            <View style={{ padding: Spacing.lg }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.lg }}>
                <TouchableOpacity
                  onPress={() => setCurrentStep('preview')}
                  style={{
                    backgroundColor: Colors.surface,
                    paddingHorizontal: Spacing.lg,
                    paddingVertical: Spacing.base,
                    borderRadius: BorderRadius.md,
                    borderWidth: 1,
                    borderColor: Colors.border,
                  }}
                >
                  <Text style={{ color: Colors.textPrimary, fontSize: Typography.base }}>
                    Back
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={startProductMatching}
                  disabled={trackedItems.filter(item => item.isSelected).length === 0 || processing}
                  style={{
                    backgroundColor: Colors.primary,
                    paddingHorizontal: Spacing.xl,
                    paddingVertical: Spacing.base,
                    borderRadius: BorderRadius.md,
                    opacity: (trackedItems.filter(item => item.isSelected).length === 0 || processing) ? 0.6 : 1,
                  }}
                >
                  <Text style={{ color: Colors.textPrimary, fontSize: Typography.base, fontWeight: '600' }}>
                    Find Products
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Error Display */}
              {error && (
                <View style={{
                  backgroundColor: Colors.error,
                  padding: Spacing.base,
                  borderRadius: BorderRadius.md,
                }}>
                  <Text style={{ color: Colors.textPrimary, fontSize: Typography.sm, textAlign: 'center' }}>
                    {error}
                  </Text>
                </View>
              )}
            </View>
          </View>
        );

      case 'upload':
        return (
          <ScrollView style={{ flex: 1, padding: Spacing.lg }}>
            <View style={{ alignItems: 'center', marginBottom: Spacing.lg }}>
              <Text style={{ 
                color: Colors.textPrimary, 
                fontSize: Typography.xl, 
                fontWeight: 'bold',
                marginBottom: Spacing.sm 
              }}>
                Ready to Upload
              </Text>
              <Text style={{ 
                color: Colors.textSecondary, 
                fontSize: Typography.base,
                textAlign: 'center'
              }}>
                Review your selections before uploading
              </Text>
            </View>

            <View style={{ marginBottom: Spacing.lg }}>
              <Text style={{ 
                color: Colors.textPrimary, 
                fontSize: Typography.lg, 
                fontWeight: '600',
                marginBottom: Spacing.sm 
              }}>
                Selected Products ({matchedProducts.length})
              </Text>
              
              {matchedProducts.map((product, index) => (
                <ProductCard
                  key={index}
                  product={product}
                  onPress={() => {}}
                  variant="enhanced"
                  animated={true}
                />
              ))}
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <TouchableOpacity
                onPress={() => setCurrentStep('track')}
                style={{
                  backgroundColor: Colors.surface,
                  paddingHorizontal: Spacing.lg,
                  paddingVertical: Spacing.base,
                  borderRadius: BorderRadius.md,
                  borderWidth: 1,
                  borderColor: Colors.border,
                }}
              >
                <Text style={{ color: Colors.textPrimary, fontSize: Typography.base }}>
                  Back
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={uploadVideo}
                disabled={uploading}
                style={{
                  backgroundColor: Colors.primary,
                  paddingHorizontal: Spacing.xl,
                  paddingVertical: Spacing.base,
                  borderRadius: BorderRadius.md,
                  opacity: uploading ? 0.6 : 1,
                }}
              >
                <Text style={{ color: Colors.textPrimary, fontSize: Typography.base, fontWeight: '600' }}>
                  {uploading ? 'Uploading...' : 'Upload Video'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Error Display */}
            {error && (
              <View style={{
                backgroundColor: Colors.error,
                padding: Spacing.base,
                borderRadius: BorderRadius.md,
                marginTop: Spacing.lg,
              }}>
                <Text style={{ color: Colors.textPrimary, fontSize: Typography.sm, textAlign: 'center' }}>
                  {error}
                </Text>
                {retryCount > 0 && (
                  <Text style={{ color: Colors.textSecondary, fontSize: Typography.sm, textAlign: 'center', marginTop: Spacing.sm }}>
                    Retry {retryCount}/{maxRetries}
                  </Text>
                )}
              </View>
            )}
          </ScrollView>
        );

      case 'complete':
        return (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.lg }}>
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
                Upload Complete!
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