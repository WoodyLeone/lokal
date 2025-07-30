import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { VideoPlayer } from '../components/VideoPlayer';
import { ProductCard } from '../components/ProductCard';
import { ProductInput } from '../components/ProductInput';
import { ProductMatchSelector } from '../components/ProductMatchSelector';
import { DebugDataDisplay } from '../components/DebugDataDisplay';
import { VideoFrontend, ProductFrontend } from '../types';
import { ApiService, checkNetworkStatus } from '../services/api';
import { DemoDataService } from '../services/demoData';
import { productMatchingService } from '../services/productMatchingService';
import { formatDate, validateVideo } from '../utils/helpers';
import { ENV } from '../config/env';
import { LearningService } from '../services/learningService';
import { FeedbackModal } from '../components/FeedbackModal';

export const UploadScreen: React.FC = () => {
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [detectedObjects, setDetectedObjects] = useState<string[]>([]);
  const [matchedProducts, setMatchedProducts] = useState<ProductFrontend[]>([]);
  const [currentStep, setCurrentStep] = useState<'select' | 'preview' | 'upload' | 'process' | 'verify' | 'match' | 'complete'>('select');
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [finalSelection, setFinalSelection] = useState<string>('');
  const [videoId, setVideoId] = useState<string>('');
  const [useDemoMode, setUseDemoMode] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [processingStatus, setProcessingStatus] = useState('');
  
  // Product matching state
  const [manualProductName, setManualProductName] = useState('');
  const [affiliateLink, setAffiliateLink] = useState('');
  const [isProductInputExpanded, setIsProductInputExpanded] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [finalProductMatch, setFinalProductMatch] = useState<{
    productName: string;
    matchType: 'manual' | 'ai_suggestion' | 'yolo_direct';
  } | null>(null);

  const pickVideo = async () => {
    try {
      // Request permissions first
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant permission to access your photo library.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: true,
        quality: 0.8,
        videoMaxDuration: ENV.MAX_VIDEO_DURATION,
        aspect: [16, 9], // 16:9 aspect ratio
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        
        // Convert duration to seconds if it's in milliseconds
        let durationInSeconds = asset.duration;
        if (asset.duration && asset.duration > 1000) {
          // If duration is greater than 1000, it's likely in milliseconds
          durationInSeconds = asset.duration / 1000;
          console.log(`Converted duration from ${asset.duration}ms to ${durationInSeconds}s`);
        } else if (asset.duration && asset.duration < 1) {
          // If duration is less than 1, it might be in minutes, convert to seconds
          durationInSeconds = asset.duration * 60;
          console.log(`Converted duration from ${asset.duration}min to ${durationInSeconds}s`);
        } else if (asset.duration && asset.duration > 60) {
          // If duration is greater than 60, it might already be in seconds
          durationInSeconds = asset.duration;
          console.log(`Using duration as seconds: ${durationInSeconds}s`);
        }
        
        // Debug logging
        console.log('Selected video:', {
          uri: asset.uri,
          fileSize: asset.fileSize,
          originalDuration: asset.duration,
          durationInSeconds: durationInSeconds,
          type: asset.type,
          fileName: asset.fileName
        });
        
        // Additional debug for duration validation
        console.log('Duration validation debug:', {
          originalDuration: asset.duration,
          durationInSeconds: durationInSeconds,
          maxDuration: ENV.MAX_VIDEO_DURATION,
          isValid: durationInSeconds ? durationInSeconds <= ENV.MAX_VIDEO_DURATION : false
        });
        
        // Additional debug info
        console.log('Video validation settings:', {
          maxDuration: ENV.MAX_VIDEO_DURATION,
          maxSize: ENV.MAX_VIDEO_SIZE,
          supportedFormats: ENV.SUPPORTED_VIDEO_FORMATS
        });
        
        // Validate video with converted duration
        const validation = validateVideo(asset.uri, asset.fileSize || undefined, durationInSeconds || undefined);
        console.log('Video validation result:', validation);
        
        if (!validation.isValid) {
          Alert.alert('Invalid Video', validation.error || 'Please select a valid video file.');
          return;
        }

        setSelectedVideo(asset.uri);
        setCurrentStep('preview');
      }
    } catch (error) {
      console.error('Video picker error:', error);
      Alert.alert('Error', 'Failed to pick video. Please try again.');
    }
  };

  // Simulate object detection for demo mode with context awareness
  const simulateObjectDetection = (): Promise<string[]> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        // Analyze video title and description for context
        const videoText = `${title} ${description}`.toLowerCase();
        
        // Define context-based object sets
        const contextObjects: { [key: string]: string[] } = {
          person: ['person', 'shirt', 'pants', 'sneakers', 'hat', 'watch', 'glasses'],
          outdoor: ['person', 'car', 'bicycle', 'tree', 'building', 'sky', 'road'],
          indoor: ['person', 'chair', 'table', 'laptop', 'tv', 'lamp', 'couch'],
          tech: ['laptop', 'cell phone', 'keyboard', 'mouse', 'monitor', 'headphones'],
          fashion: ['person', 'shirt', 'pants', 'sneakers', 'hat', 'handbag', 'watch'],
          kitchen: ['person', 'cup', 'bottle', 'table', 'chair', 'lamp'],
          sports: ['person', 'sneakers', 'shirt', 'pants', 'bicycle', 'ball'],
          pets: ['person', 'dog', 'cat', 'chair', 'couch', 'floor']
        };
        
        // Determine context based on video content
        let context = 'person'; // default
        if (videoText.includes('walk') || videoText.includes('outdoor') || videoText.includes('street')) {
          context = 'outdoor';
        } else if (videoText.includes('tech') || videoText.includes('computer') || videoText.includes('laptop')) {
          context = 'tech';
        } else if (videoText.includes('fashion') || videoText.includes('clothes') || videoText.includes('style')) {
          context = 'fashion';
        } else if (videoText.includes('kitchen') || videoText.includes('cooking') || videoText.includes('food')) {
          context = 'kitchen';
        } else if (videoText.includes('sport') || videoText.includes('exercise') || videoText.includes('gym')) {
          context = 'sports';
        } else if (videoText.includes('pet') || videoText.includes('dog') || videoText.includes('cat')) {
          context = 'pets';
        } else if (videoText.includes('indoor') || videoText.includes('home') || videoText.includes('room')) {
          context = 'indoor';
        }
        
        // Get context-appropriate objects
        const contextObjectSet = contextObjects[context] || contextObjects.person;
        
        // Always include 'person' for videos with people
        const selectedObjects: string[] = ['person'];
        
        // Add 2-4 additional context-appropriate objects
        const numAdditionalObjects = Math.floor(Math.random() * 3) + 2;
        const availableObjects = contextObjectSet.filter(obj => obj !== 'person');
        
        for (let i = 0; i < numAdditionalObjects && availableObjects.length > 0; i++) {
          const randomIndex = Math.floor(Math.random() * availableObjects.length);
          const selectedObject = availableObjects.splice(randomIndex, 1)[0];
          if (!selectedObjects.includes(selectedObject)) {
            selectedObjects.push(selectedObject);
          }
        }
        
        console.log(`🎭 Demo detection context: ${context}, objects: ${selectedObjects.join(', ')}`);
        resolve(selectedObjects);
      }, 2000); // Simulate 2-second processing time
    });
  };

  const uploadVideo = async () => {
    if (!selectedVideo || !title.trim()) {
      Alert.alert('Error', 'Please select a video and enter a title');
      return;
    }

    try {
      setUploading(true);
      setCurrentStep('process');

      // Test network connectivity first
      console.log('🌐 Testing network connectivity before upload...');
      const networkStatus = await checkNetworkStatus();
      console.log('🌐 Network status:', networkStatus);
      
      if (!networkStatus.connected) {
        console.log('❌ No backend connectivity, using demo mode');
        setUseDemoMode(true);
        await simulateObjectDetection().then(async (objects) => {
          setDetectedObjects(objects);
          console.log('🎭 Demo mode - detected objects:', objects);
          
          const products = DemoDataService.matchProductsByObjects(objects);
          setMatchedProducts(products);
          console.log('🎭 Demo mode - matched products:', products);
          
          // Process hybrid product matching in demo mode
          console.log('🔄 Demo mode - processing hybrid product matching...');
          const matchingResult = await productMatchingService.processHybridMatching(
            'demo-video-id',
            objects,
            manualProductName,
            affiliateLink
          );
          
          if (matchingResult.success) {
            setAiSuggestions(matchingResult.aiSuggestions);
            console.log('✅ Demo mode - hybrid matching completed. AI suggestions:', matchingResult.aiSuggestions);
            setCurrentStep('match');
          } else {
            console.log('⚠️ Demo mode - hybrid matching failed, proceeding to verify step');
            setCurrentStep('verify');
          }
        });
        return;
      }

      console.log(`✅ Backend connectivity confirmed: ${networkStatus.url} (${networkStatus.latency}ms)`);

      // Always try to use real backend first for YOLO detection
      try {
        console.log('🚀 Starting video upload process...');
        console.log('📱 Selected video:', selectedVideo);
        console.log('📝 Title:', title);
        console.log('📝 Description:', description);
        
        // Upload video metadata to backend for processing
        let uploadResponse;
        try {
          console.log('📤 Attempting file upload...');
          // Try file upload first (better for larger files)
          uploadResponse = await ApiService.uploadVideoFile(selectedVideo, title, description, manualProductName, affiliateLink);
          console.log('📤 File upload response:', uploadResponse);
        } catch (error) {
          console.log('❌ File upload failed, falling back to URL upload:', error);
          // Fallback to URL upload
          uploadResponse = await ApiService.uploadVideo('', title, description, manualProductName, affiliateLink);
          console.log('📤 URL upload response:', uploadResponse);
        }
        
        // Validate upload response
        if (!uploadResponse) {
          throw new Error('No upload response received');
        }
        
        if (!uploadResponse.success) {
          throw new Error(uploadResponse.error || 'Upload failed');
        }
        
        if (!uploadResponse.videoId) {
          throw new Error('Upload succeeded but no video ID returned');
        }

        // Store video ID for product matching
        setVideoId(uploadResponse.videoId);

        console.log('✅ Video uploaded successfully, starting object detection...');
        console.log('🎯 Video ID for detection:', uploadResponse.videoId);

        // Wait for video processing to complete
        console.log('⏳ Waiting for video processing to complete...');
        setProcessingStatus('Processing video...');
        setProcessingProgress(0);
        
        const processingResult = await ApiService.waitForVideoProcessing(
          uploadResponse.videoId, 
          300000, // 5 minutes max wait
          (progress, status) => {
            setProcessingProgress(progress);
            setProcessingStatus(`Processing: ${status} (${progress}%)`);
          }
        );
        
        if (!processingResult.success) {
          throw new Error(processingResult.error || 'Video processing failed');
        }
        
        setProcessingProgress(100);
        setProcessingStatus('Processing completed!');
        
        console.log('✅ Video processing completed successfully');
        console.log('🎯 Detected objects:', processingResult.objects);
        console.log('🛍️ Matched products:', processingResult.products);
        
        // Ensure we have the correct data structure
        const detectedObjectsArray = Array.isArray(processingResult.objects) ? processingResult.objects : [];
        const matchedProductsArray = Array.isArray(processingResult.products) ? processingResult.products : [];
        
        console.log('🔧 Processed detected objects array:', detectedObjectsArray);
        console.log('🔧 Processed matched products array:', matchedProductsArray);
        
        if (detectedObjectsArray.length > 0) {
          setDetectedObjects(detectedObjectsArray);
          console.log('✅ Real YOLO detection results set:', detectedObjectsArray);

          if (matchedProductsArray.length > 0) {
            setMatchedProducts(matchedProductsArray);
            console.log('✅ Setting matched products:', matchedProductsArray);
          } else {
            setMatchedProducts([]);
            console.log('✅ No products matched');
          }
          
          // Process hybrid product matching
          console.log('🔄 Processing hybrid product matching...');
          const matchingResult = await productMatchingService.processHybridMatching(
            uploadResponse.videoId,
            detectedObjectsArray,
            manualProductName,
            affiliateLink
          );
          
          if (matchingResult.success) {
            const aiSuggestionsArray = Array.isArray(matchingResult.aiSuggestions) ? matchingResult.aiSuggestions : [];
            setAiSuggestions(aiSuggestionsArray);
            console.log('✅ Hybrid matching completed. AI suggestions:', aiSuggestionsArray);
            
            // Ensure we have data before moving to match step
            if (aiSuggestionsArray.length > 0 || matchedProductsArray.length > 0) {
              setCurrentStep('match');
              console.log('✅ Moving to match step with data');
            } else {
              setCurrentStep('verify');
              console.log('✅ Moving to verify step (no suggestions/products)');
            }
          } else {
            console.log('⚠️ Hybrid matching failed, proceeding to verify step');
            setCurrentStep('verify');
          }
          setUseDemoMode(false);
        } else {
          console.log('⚠️ No objects detected. Setting step to verify with empty results.');
          setDetectedObjects([]);
          setMatchedProducts([]);
          setCurrentStep('verify');
          setUseDemoMode(false);
        }
        
      } catch (backendError) {
        console.error('❌ Backend processing failed, falling back to demo mode:', backendError);
        
        // Fallback to demo mode
        setUseDemoMode(true);
        await simulateObjectDetection().then(async (objects) => {
          setDetectedObjects(objects);
          console.log('🎭 Demo mode - detected objects:', objects);
          
          // Match products using demo service
          const products = DemoDataService.matchProductsByObjects(objects);
          setMatchedProducts(products);
          console.log('🎭 Demo mode - matched products:', products);
          
          console.log('🎭 Demo mode - setting step to verify');
          setCurrentStep('verify');
        });
      }

    } catch (error) {
      console.error('❌ Upload error:', error);
      setUploading(false);
      setCurrentStep('upload');
      Alert.alert('Error', 'Failed to upload video. Please try again.');
    }
  };

  const resetForm = () => {
    setSelectedVideo(null);
    setTitle('');
    setDescription('');
    setDetectedObjects([]);
    setMatchedProducts([]);
    setCurrentStep('select');
    setUseDemoMode(false);
    setUploading(false);
    
    // Reset product matching state
    setManualProductName('');
    setAffiliateLink('');
    setIsProductInputExpanded(false);
    setAiSuggestions([]);
    setVideoId('');
    setFinalProductMatch(null);
  };

  const handleConfirmProductMatch = async (productName: string, matchType: 'manual' | 'ai_suggestion' | 'yolo_direct') => {
    try {
      console.log('✅ Product match confirmed:', { productName, matchType });
      
      setFinalProductMatch({
        productName,
        matchType
      });

      // Record final selection for learning
      setFinalSelection(productName);
      await LearningService.updateFinalSelection(videoId, productName);

      // Show feedback modal
      setShowFeedbackModal(true);
      
    } catch (error) {
      console.error('❌ Error confirming product match:', error);
      Alert.alert('Error', 'Failed to confirm product match. Please try again.');
    }
  };

  const handleFeedbackSubmitted = () => {
    setShowFeedbackModal(false);
    setCurrentStep('complete');
  };

  const handleSkipFeedback = () => {
    setShowFeedbackModal(false);
    setCurrentStep('complete');
  };

  const handleSkipProductMatch = () => {
    console.log('⏭️ Skipping product match');
    setCurrentStep('complete');
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#ffffff' }}>
      <View style={{ padding: 20 }}>
        {/* Header */}
        <Text style={{ color: '#000000', fontSize: 34, fontWeight: '700', marginBottom: 24, textAlign: 'center' }}>
          Upload Video
        </Text>

        {/* Demo Mode Notice */}
        {useDemoMode && (
          <View style={{ 
            backgroundColor: '#f0f9ff', 
            padding: 16, 
            marginBottom: 24, 
            borderRadius: 12,
            borderWidth: 1,
            borderColor: '#0ea5e9'
          }}>
            <Text style={{ color: '#0c4a6e', fontSize: 16, fontWeight: '600', marginBottom: 4 }}>
              Demo Mode
            </Text>
            <Text style={{ color: '#0369a1', fontSize: 14 }}>
              Using simulated object detection and demo products.
            </Text>
          </View>
        )}

        {/* Step Indicator */}
        <View style={{ flexDirection: 'row', marginBottom: 32, justifyContent: 'center' }}>
          {['select', 'preview', 'upload', 'process', 'verify', 'match', 'complete'].map((step, index) => (
            <View key={step} style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{
                width: 28,
                height: 28,
                borderRadius: 14,
                backgroundColor: currentStep === step ? '#007AFF' : '#E5E5EA',
                justifyContent: 'center',
                alignItems: 'center',
                marginHorizontal: 4,
              }}>
                <Text style={{ color: currentStep === step ? '#ffffff' : '#8E8E93', fontSize: 12, fontWeight: '600' }}>
                  {index + 1}
                </Text>
              </View>
              {index < 6 && (
                <View style={{
                  width: 20,
                  height: 2,
                  backgroundColor: currentStep === step ? '#007AFF' : '#E5E5EA',
                  marginHorizontal: 2,
                }} />
              )}
            </View>
          ))}
        </View>

        {/* Step 1: Select Video */}
        {currentStep === 'select' && (
          <View style={{ alignItems: 'center', paddingVertical: 40 }}>
            <TouchableOpacity
              onPress={pickVideo}
              style={{
                width: 120,
                height: 120,
                borderRadius: 60,
                backgroundColor: '#007AFF',
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: 24,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 8,
                elevation: 4,
              }}
            >
              <Ionicons name="videocam" size={48} color="#ffffff" />
            </TouchableOpacity>
            
            <Text style={{ color: '#000000', fontSize: 24, fontWeight: '600', marginBottom: 8, textAlign: 'center' }}>
              Select a Video
            </Text>
            <Text style={{ color: '#8E8E93', fontSize: 16, textAlign: 'center', lineHeight: 22, paddingHorizontal: 20 }}>
              Choose a video from your camera roll to upload and analyze
            </Text>
            
            <View style={{ 
              backgroundColor: '#F2F2F7', 
              padding: 16, 
              borderRadius: 12, 
              marginTop: 24,
              width: '100%'
            }}>
              <Text style={{ color: '#000000', fontSize: 14, fontWeight: '600', marginBottom: 8 }}>
                Requirements:
              </Text>
              <Text style={{ color: '#8E8E93', fontSize: 14, lineHeight: 20 }}>
                • Duration: 15 seconds to 3 minutes{'\n'}
                • Format: MP4, MOV, or AVI{'\n'}
                • Size: Up to 100MB
              </Text>
            </View>
          </View>
        )}

        {/* Step 2: Preview Video */}
        {currentStep === 'preview' && selectedVideo && (
          <View>
            <Text style={{ color: '#f8fafc', fontSize: 18, fontWeight: '600', marginBottom: 16 }}>
              Preview Your Video
            </Text>
            
            <VideoPlayer uri={selectedVideo} />
            
            <View style={{ marginTop: 16 }}>
              <Text style={{ color: '#f8fafc', fontSize: 16, marginBottom: 8 }}>
                Title *
              </Text>
              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder="Enter video title"
                placeholderTextColor="#64748b"
                style={{
                  backgroundColor: '#1e293b',
                  borderRadius: 8,
                  padding: 12,
                  color: '#f8fafc',
                  fontSize: 16,
                  marginBottom: 16,
                }}
              />

              <Text style={{ color: '#f8fafc', fontSize: 16, marginBottom: 8 }}>
                Description
              </Text>
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder="Enter video description (optional)"
                placeholderTextColor="#64748b"
                multiline
                numberOfLines={3}
                style={{
                  backgroundColor: '#1e293b',
                  borderRadius: 8,
                  padding: 12,
                  color: '#f8fafc',
                  fontSize: 16,
                  marginBottom: 16,
                }}
              />

              {/* Product Input Component */}
              <ProductInput
                manualProductName={manualProductName}
                setManualProductName={setManualProductName}
                affiliateLink={affiliateLink}
                setAffiliateLink={setAffiliateLink}
                onToggle={() => setIsProductInputExpanded(!isProductInputExpanded)}
                isExpanded={isProductInputExpanded}
              />

              <View style={{ flexDirection: 'row', gap: 12 }}>
                <TouchableOpacity
                  onPress={() => setCurrentStep('select')}
                  style={{
                    flex: 1,
                    backgroundColor: '#374151',
                    borderRadius: 8,
                    padding: 16,
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ color: '#f8fafc', fontSize: 16, fontWeight: 'bold' }}>
                    Back
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setCurrentStep('upload')}
                  disabled={!title.trim()}
                  style={{
                    flex: 1,
                    backgroundColor: title.trim() ? '#6366f1' : '#374151',
                    borderRadius: 8,
                    padding: 16,
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ color: '#f8fafc', fontSize: 16, fontWeight: 'bold' }}>
                    Continue
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* Step 3: Upload Confirmation */}
        {currentStep === 'upload' && selectedVideo && (
          <View>
            <View style={{ alignItems: 'center', marginBottom: 24 }}>
              <Ionicons name="cloud-upload" size={64} color="#6366f1" />
              <Text style={{ color: '#f8fafc', fontSize: 20, fontWeight: 'bold', marginTop: 12 }}>
                Ready to Upload
              </Text>
              <Text style={{ color: '#94a3b8', fontSize: 14, marginTop: 4, textAlign: 'center' }}>
                Your video will be processed to detect objects and match products
              </Text>
            </View>

            <View style={{ backgroundColor: '#1e293b', borderRadius: 8, padding: 16, marginBottom: 24 }}>
              <Text style={{ color: '#f8fafc', fontSize: 16, fontWeight: '600', marginBottom: 8 }}>
                Video Details
              </Text>
              <Text style={{ color: '#94a3b8', fontSize: 14, marginBottom: 4 }}>
                Title: {title}
              </Text>
              {description && (
                <Text style={{ color: '#94a3b8', fontSize: 14, marginBottom: 4 }}>
                  Description: {description}
                </Text>
              )}
            </View>

            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity
                onPress={() => setCurrentStep('preview')}
                style={{
                  flex: 1,
                  backgroundColor: '#374151',
                  borderRadius: 8,
                  padding: 16,
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: '#f8fafc', fontSize: 16, fontWeight: 'bold' }}>
                  Back
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={uploadVideo}
                disabled={uploading}
                style={{
                  flex: 1,
                  backgroundColor: !uploading ? '#6366f1' : '#374151',
                  borderRadius: 8,
                  padding: 16,
                  alignItems: 'center',
                }}
              >
                {uploading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={{ color: '#f8fafc', fontSize: 16, fontWeight: 'bold' }}>
                    Upload & Process
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Step 4: Processing */}
        {currentStep === 'process' && (
          <View style={{ alignItems: 'center', padding: 40 }}>
            <ActivityIndicator size="large" color="#6366f1" />
            <Text style={{ color: '#f8fafc', fontSize: 18, marginTop: 16 }}>
              {uploading ? 'Uploading Video...' : processingStatus || 'Processing Video...'}
            </Text>
            <Text style={{ color: '#94a3b8', fontSize: 14, textAlign: 'center', marginTop: 8 }}>
              {useDemoMode 
                ? 'Simulating object detection' 
                : uploading 
                  ? 'Uploading large video file (this may take a few minutes)'
                  : 'Detecting objects and matching products'
              }
            </Text>
            
            {/* Progress Bar */}
            {!uploading && !useDemoMode && (
              <View style={{ width: '100%', marginTop: 20 }}>
                <View style={{ 
                  width: '100%', 
                  height: 8, 
                  backgroundColor: '#374151', 
                  borderRadius: 4,
                  overflow: 'hidden'
                }}>
                  <View style={{ 
                    width: `${processingProgress}%`, 
                    height: '100%', 
                    backgroundColor: '#6366f1',
                    borderRadius: 4
                  }} />
                </View>
                <Text style={{ color: '#94a3b8', fontSize: 12, textAlign: 'center', marginTop: 8 }}>
                  {processingProgress}% Complete
                </Text>
              </View>
            )}
            
            {!useDemoMode && uploading && (
              <Text style={{ color: '#64748b', fontSize: 12, textAlign: 'center', marginTop: 8 }}>
                Please don't close the app during upload
              </Text>
            )}
          </View>
        )}

        {/* Step 5: Verify Results */}
        {currentStep === 'verify' && (
          <View>
            {(() => { console.log('VERIFY STEP - detectedObjects:', detectedObjects, 'matchedProducts:', matchedProducts, 'lengths:', detectedObjects.length, matchedProducts.length); return null; })()}
            <View style={{ alignItems: 'center', marginBottom: 24 }}>
              <Ionicons name="checkmark-circle" size={64} color="#10b981" />
              <Text style={{ color: '#f8fafc', fontSize: 20, fontWeight: 'bold', marginTop: 12 }}>
                Detection Complete!
              </Text>
              <Text style={{ color: '#94a3b8', fontSize: 14, marginTop: 4, textAlign: 'center' }}>
                Review the detected objects and matched products
              </Text>
              {useDemoMode && (
                <Text style={{ color: '#94a3b8', fontSize: 12, marginTop: 4 }}>
                  (Demo Mode)
                </Text>
              )}
            </View>

            {/* Detected Objects */}
            {detectedObjects.length > 0 ? (
              <View style={{ marginBottom: 24 }}>
                <Text style={{ color: '#f8fafc', fontSize: 16, fontWeight: '600', marginBottom: 12 }}>
                  Detected Objects ({detectedObjects.length}):
                </Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                  {detectedObjects.map((object, index) => (
                    <View
                      key={index}
                      style={{
                        backgroundColor: '#6366f1',
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderRadius: 16,
                        marginRight: 8,
                        marginBottom: 8,
                      }}
                    >
                      <Text style={{ color: '#fff', fontSize: 12 }}>
                        {object}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            ) : (
              <View style={{ marginBottom: 24 }}>
                <Text style={{ color: '#f8fafc', fontSize: 16, fontWeight: '600', marginBottom: 12 }}>
                  Detected Objects:
                </Text>
                <Text style={{ color: '#94a3b8', fontSize: 14, fontStyle: 'italic' }}>
                  No objects detected. This might be a processing issue.
                </Text>
              </View>
            )}

            {/* Matched Products */}
            {matchedProducts.length > 0 ? (
              <View style={{ marginBottom: 24 }}>
                <Text style={{ color: '#f8fafc', fontSize: 16, fontWeight: '600', marginBottom: 12 }}>
                  Matched Products ({matchedProducts.length}):
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {matchedProducts.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </ScrollView>
              </View>
            ) : (
              <View style={{ marginBottom: 24 }}>
                <Text style={{ color: '#f8fafc', fontSize: 16, fontWeight: '600', marginBottom: 12 }}>
                  Matched Products:
                </Text>
                <Text style={{ color: '#94a3b8', fontSize: 14, fontStyle: 'italic' }}>
                  No products matched. This might be a processing issue.
                </Text>
              </View>
            )}

            {/* Action Buttons */}
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity
                onPress={() => setCurrentStep('process')}
                style={{
                  flex: 1,
                  backgroundColor: '#374151',
                  borderRadius: 8,
                  padding: 16,
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: '#f8fafc', fontSize: 16, fontWeight: 'bold' }}>
                  Re-process
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setCurrentStep('match')}
                style={{
                  flex: 1,
                  backgroundColor: '#10b981',
                  borderRadius: 8,
                  padding: 16,
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: '#f8fafc', fontSize: 16, fontWeight: 'bold' }}>
                  Continue to Product Match
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Step 6: Product Match Selection */}
        {currentStep === 'match' && (
          <View>
            {/* Debug Data Display */}
            <DebugDataDisplay
              detectedObjects={detectedObjects}
              matchedProducts={matchedProducts}
              aiSuggestions={aiSuggestions}
              manualProductName={manualProductName}
              currentStep={currentStep}
            />
            
            <ProductMatchSelector
              detectedObjects={detectedObjects}
              matchedProducts={matchedProducts}
              manualProductName={manualProductName}
              aiSuggestions={aiSuggestions}
              onConfirmMatch={handleConfirmProductMatch}
              onSkip={handleSkipProductMatch}
            />
          </View>
        )}

        {/* Step 7: Final Results */}
        {currentStep === 'complete' && (
          <View>
            <View style={{ alignItems: 'center', marginBottom: 24 }}>
              <Ionicons name="checkmark-circle" size={64} color="#10b981" />
              <Text style={{ color: '#f8fafc', fontSize: 20, fontWeight: 'bold', marginTop: 12 }}>
                Published Successfully!
              </Text>
              <Text style={{ color: '#94a3b8', fontSize: 14, marginTop: 4, textAlign: 'center' }}>
                Your video has been published with {detectedObjects.length} detected objects and {matchedProducts.length} matched products
              </Text>
            </View>

            <View style={{ backgroundColor: '#1e293b', borderRadius: 8, padding: 16, marginBottom: 24 }}>
              <Text style={{ color: '#f8fafc', fontSize: 16, fontWeight: '600', marginBottom: 8 }}>
                Summary
              </Text>
              <Text style={{ color: '#94a3b8', fontSize: 14, marginBottom: 4 }}>
                Video Title: {title}
              </Text>
              <Text style={{ color: '#94a3b8', fontSize: 14, marginBottom: 4 }}>
                Objects Detected: {detectedObjects.join(', ')}
              </Text>
              <Text style={{ color: '#94a3b8', fontSize: 14, marginBottom: 4 }}>
                Products Matched: {matchedProducts.length} items
              </Text>
              {finalProductMatch && (
                <>
                  <Text style={{ color: '#94a3b8', fontSize: 14, marginBottom: 4 }}>
                    Final Product: {finalProductMatch.productName}
                  </Text>
                  <Text style={{ color: '#94a3b8', fontSize: 14, marginBottom: 4 }}>
                    Match Type: {finalProductMatch.matchType.replace('_', ' ')}
                  </Text>
                </>
              )}
              {affiliateLink && (
                <Text style={{ color: '#94a3b8', fontSize: 14 }}>
                  Affiliate Link: {affiliateLink}
                </Text>
              )}
            </View>

            <TouchableOpacity
              onPress={resetForm}
              style={{
                backgroundColor: '#6366f1',
                borderRadius: 8,
                padding: 16,
                alignItems: 'center',
              }}
            >
              <Text style={{ color: '#f8fafc', fontSize: 16, fontWeight: 'bold' }}>
                Upload Another Video
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Feedback Modal */}
      {showFeedbackModal && (
        <FeedbackModal
          videoId={videoId}
          detectedObjects={detectedObjects}
          finalSelection={finalSelection}
          onClose={handleSkipFeedback}
          onFeedbackSubmitted={handleFeedbackSubmitted}
        />
      )}
    </ScrollView>
  );
}; 