import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, Alert, ActivityIndicator, ScrollView } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { VideoPlayer } from '../components/VideoPlayer';
import { ProductCard } from '../components/ProductCard';
import { Video, Product, ProductFrontend } from '../types';
import { SupabaseService } from '../services/supabase';
import { ApiService } from '../services/api';
import { DemoDataService } from '../services/demoData';
import { generateThumbnail, validateVideo, isDemoMode } from '../utils/helpers';
import { ENV } from '../config/env';

export const UploadScreen: React.FC = () => {
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [detectedObjects, setDetectedObjects] = useState<string[]>([]);
  const [matchedProducts, setMatchedProducts] = useState<ProductFrontend[]>([]);
  const [currentStep, setCurrentStep] = useState<'select' | 'upload' | 'preview' | 'process' | 'verify' | 'complete'>('select');
  const [useDemoMode, setUseDemoMode] = useState(false);

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

  // Simulate object detection for demo mode
  const simulateObjectDetection = (): Promise<string[]> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const possibleObjects = [
          'person', 'chair', 'table', 'laptop', 'cell phone', 'book', 'cup', 'bottle',
          'sneakers', 'hat', 'shirt', 'pants', 'handbag', 'watch', 'glasses', 'couch',
          'tv', 'lamp', 'plant', 'car', 'bicycle', 'dog', 'cat', 'keyboard', 'mouse'
        ];
        
        // Return 3-6 random objects
        const numObjects = Math.floor(Math.random() * 4) + 3;
        const selectedObjects: string[] = [];
        
        for (let i = 0; i < numObjects; i++) {
          const randomObject = possibleObjects[Math.floor(Math.random() * possibleObjects.length)];
          if (!selectedObjects.includes(randomObject)) {
            selectedObjects.push(randomObject);
          }
        }
        
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

      // Always try to use real backend first for YOLO detection
      try {
        console.log('Attempting to use real backend for YOLO detection...');
        
        // Upload video metadata to backend for processing
        let uploadResponse;
        try {
          // Try file upload first (better for larger files)
          uploadResponse = await ApiService.uploadVideoFile(selectedVideo, title, description);
        } catch (error) {
          console.log('File upload failed, falling back to URL upload:', error);
          // Fallback to URL upload
          uploadResponse = await ApiService.uploadVideo('', title, description);
        }
        
        if (!uploadResponse.success || !uploadResponse.videoId) {
          throw new Error(uploadResponse.error || 'Failed to upload video');
        }

        console.log('Video uploaded successfully, starting object detection...');
        console.log('Upload response:', uploadResponse);
        console.log('Video ID for detection:', uploadResponse.videoId);

        // Start object detection
        const detectionResponse = await ApiService.detectObjects(uploadResponse.videoId);
        console.log('Detection response:', detectionResponse);
        
        if (detectionResponse.success && detectionResponse.objects) {
          setDetectedObjects(detectionResponse.objects);
          console.log('Real YOLO detection results:', detectionResponse.objects);

          // Match products
          const productResponse = await ApiService.matchProducts(detectionResponse.objects);
          console.log('Product response:', productResponse);
          if (productResponse.success && productResponse.products) {
            setMatchedProducts(productResponse.products);
            console.log('Setting step to verify with objects:', detectionResponse.objects, 'and products:', productResponse.products);
            setCurrentStep('verify');
            setUseDemoMode(false);
          } else {
            console.log('No products matched, but objects detected. Setting step to verify with objects:', detectionResponse.objects);
            setCurrentStep('verify');
            setUseDemoMode(false);
          }
        } else {
          console.log('No objects detected. Setting step to verify with empty results.');
          setCurrentStep('verify');
          setUseDemoMode(false);
        }
        
      } catch (backendError) {
        console.error('Backend processing failed, falling back to demo mode:', backendError);
        
        // Fallback to demo mode
        setUseDemoMode(true);
        await simulateObjectDetection().then(async (objects) => {
          setDetectedObjects(objects);
          console.log('Demo mode - detected objects:', objects);
          
          // Match products using demo service
          const products = DemoDataService.matchProductsByObjects(objects);
          setMatchedProducts(products);
          console.log('Demo mode - matched products:', products);
          
          console.log('Demo mode - setting step to verify');
          setCurrentStep('verify');
        });
      }

    } catch (error) {
      console.error('Upload error:', error);
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
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#0f172a' }}>
      <View style={{ padding: 16 }}>
        {/* Header */}
        <Text style={{ color: '#f8fafc', fontSize: 24, fontWeight: 'bold', marginBottom: 24 }}>
          Upload Video
        </Text>

        {/* Demo Mode Notice */}
        {useDemoMode && (
          <View style={{ 
            backgroundColor: '#1e293b', 
            padding: 12, 
            marginBottom: 24, 
            borderRadius: 8,
            borderLeftWidth: 4,
            borderLeftColor: '#6366f1'
          }}>
            <Text style={{ color: '#f8fafc', fontSize: 14, fontWeight: '600', marginBottom: 4 }}>
              Demo Mode
            </Text>
            <Text style={{ color: '#94a3b8', fontSize: 12 }}>
              Using simulated object detection and demo products.
            </Text>
          </View>
        )}

        {/* Step Indicator */}
        <View style={{ flexDirection: 'row', marginBottom: 24 }}>
          {['select', 'upload', 'preview', 'process', 'verify', 'complete'].map((step, index) => (
            <View key={step} style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: currentStep === step ? '#6366f1' : '#374151',
                justifyContent: 'center',
                alignItems: 'center',
              }}>
                <Text style={{ color: '#fff', fontSize: 12, fontWeight: 'bold' }}>
                  {index + 1}
                </Text>
              </View>
              {index < 3 && (
                <View style={{
                  width: 40,
                  height: 2,
                  backgroundColor: currentStep === step ? '#6366f1' : '#374151',
                  marginHorizontal: 8,
                }} />
              )}
            </View>
          ))}
        </View>

        {/* Step 1: Select Video */}
        {currentStep === 'select' && (
          <TouchableOpacity
            onPress={pickVideo}
            style={{
              borderWidth: 2,
              borderColor: '#6366f1',
              borderStyle: 'dashed',
              borderRadius: 12,
              padding: 40,
              alignItems: 'center',
              backgroundColor: '#1e293b',
            }}
          >
            <Ionicons name="videocam-outline" size={48} color="#6366f1" />
            <Text style={{ color: '#f8fafc', fontSize: 16, marginTop: 12 }}>
              Select Video
            </Text>
            <Text style={{ color: '#94a3b8', fontSize: 14, textAlign: 'center', marginTop: 8 }}>
                                  Choose a video (15s - 3min) from your camera roll
            </Text>
          </TouchableOpacity>
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
                  marginBottom: 24,
                }}
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
              {uploading ? 'Uploading Video...' : 'Processing Video...'}
            </Text>
            <Text style={{ color: '#94a3b8', fontSize: 14, textAlign: 'center', marginTop: 8 }}>
              {useDemoMode 
                ? 'Simulating object detection' 
                : uploading 
                  ? 'Uploading large video file (this may take a few minutes)'
                  : 'Detecting objects and matching products'
              }
            </Text>
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
                onPress={() => setCurrentStep('complete')}
                style={{
                  flex: 1,
                  backgroundColor: '#10b981',
                  borderRadius: 8,
                  padding: 16,
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: '#f8fafc', fontSize: 16, fontWeight: 'bold' }}>
                  Looks Good!
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Step 6: Final Results */}
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
              <Text style={{ color: '#94a3b8', fontSize: 14 }}>
                Products Matched: {matchedProducts.length} items
              </Text>
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
    </ScrollView>
  );
}; 