import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Dimensions, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { EnhancedButton } from './EnhancedButton';
import { EnhancedCard } from './EnhancedCard';
import { EnhancedLoading } from './EnhancedLoading';
import { ShoppableVideoPlayer } from './ShoppableVideoPlayer';
import { ProductCard } from './ProductCard';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../utils/designSystem';

interface UGCUploadFlowProps {
  videoUri: string;
  title: string;
  description: string;
  detectedObjects: string[];
  matchedProducts: any[];
  currentStep: string;
  onStepChange: (step: string) => void;
  onUpload: () => void;
  onProductSelect: (product: any) => void;
  uploadProgress?: number;
  processingProgress?: number;
  isUploading?: boolean;
  isProcessing?: boolean;
}

const { width: screenWidth } = Dimensions.get('window');

const steps = [
  { id: 'select', title: 'Select Video', icon: 'videocam-outline' },
  { id: 'preview', title: 'Preview', icon: 'eye-outline' },
  { id: 'detect', title: 'AI Detection', icon: 'search-outline' }, // scan-outline doesn't exist
  { id: 'products', title: 'Match Products', icon: 'bag-outline' },
  { id: 'upload', title: 'Upload', icon: 'cloud-upload-outline' },
  { id: 'complete', title: 'Complete', icon: 'checkmark-circle-outline' },
];

export const UGCUploadFlow: React.FC<UGCUploadFlowProps> = ({
  videoUri,
  title,
  description,
  detectedObjects,
  matchedProducts,
  currentStep,
  onStepChange,
  onUpload,
  onProductSelect,
  uploadProgress = 0,
  processingProgress = 0,
  isUploading = false,
  isProcessing = false,
}) => {
  const [stepAnimations] = useState(() => 
    steps.map(() => new Animated.Value(0))
  );

  useEffect(() => {
    const currentStepIndex = steps.findIndex(step => step.id === currentStep);
    if (currentStepIndex >= 0) {
      Animated.spring(stepAnimations[currentStepIndex], {
        toValue: 1,
        useNativeDriver: true,
        tension: 50,
        friction: 7,
      }).start();
    }
  }, [currentStep, stepAnimations]);

  const getStepStatus = (stepId: string) => {
    const stepIndex = steps.findIndex(step => step.id === stepId);
    const currentStepIndex = steps.findIndex(step => step.id === currentStep);
    
    if (stepIndex < currentStepIndex) return 'completed';
    if (stepIndex === currentStepIndex) return 'active';
    return 'pending';
  };

  const renderStepIndicator = () => (
    <View style={{ marginBottom: Spacing.xl }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        {steps.map((step, index) => {
          const status = getStepStatus(step.id);
          const isActive = status === 'active';
          const isCompleted = status === 'completed';
          
          return (
            <Animated.View
              key={step.id}
              style={{
                flex: 1,
                alignItems: 'center',
                transform: [{
                  scale: stepAnimations[index].interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.8, 1],
                  })
                }],
                opacity: stepAnimations[index],
              }}
            >
              <View style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: isCompleted ? Colors.success : isActive ? Colors.primary : Colors.surfaceLight,
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: Spacing.sm,
                ...Shadows.base,
              }}>
                {isCompleted ? (
                  <Ionicons name="checkmark" size={20} color={Colors.textPrimary} />
                ) : (
                  <Ionicons name={step.icon as keyof typeof Ionicons.glyphMap} size={20} color={isActive ? Colors.textPrimary : Colors.textSecondary} />
                )}
              </View>
              
              <Text style={{
                color: isActive ? Colors.primary : Colors.textSecondary,
                fontSize: Typography.xs,
                fontWeight: isActive ? Typography.semibold : Typography.normal,
                textAlign: 'center',
              }}>
                {step.title}
              </Text>
              
              {index < steps.length - 1 && (
                <View style={{
                  position: 'absolute',
                  top: 20,
                  left: 30,
                  width: screenWidth / steps.length - 60,
                  height: 2,
                  backgroundColor: isCompleted ? Colors.success : Colors.surfaceLight,
                }} />
              )}
            </Animated.View>
          );
        })}
      </View>
    </View>
  );

  const renderVideoPreview = () => (
    <EnhancedCard
      title="Video Preview"
      subtitle="Review your content before upload"
      variant="elevated"
      style={{ marginBottom: Spacing.lg }}
    >
      <ShoppableVideoPlayer
        uri={videoUri}
        products={matchedProducts}
        hotspots={[]}
        showControls={true}
        isInteractive={false}
        showProductOverlay={false}
      />
      
      <View style={{ marginTop: Spacing.lg }}>
        <Text style={{
          color: Colors.textPrimary,
          fontSize: Typography.lg,
          fontWeight: Typography.semibold,
          marginBottom: Spacing.sm,
        }}>
          {title || 'Untitled Video'}
        </Text>
        
        {description && (
          <Text style={{
            color: Colors.textSecondary,
            fontSize: Typography.sm,
            lineHeight: Typography.sm * Typography.normal,
          }}>
            {description}
          </Text>
        )}
      </View>
    </EnhancedCard>
  );

  const renderObjectDetection = () => (
    <EnhancedCard
      title="AI Object Detection"
      subtitle="Analyzing your video content"
      variant="elevated"
      style={{ marginBottom: Spacing.lg }}
    >
      {isProcessing ? (
        <View style={{ alignItems: 'center', paddingVertical: Spacing.xl }}>
          <EnhancedLoading
            type="dots"
            text="Detecting Objects"
            subtitle="AI is analyzing your video..."
            icon="scan-outline"
            size="large"
          />
          
          <View style={{ marginTop: Spacing.lg, width: '100%' }}>
            <View style={{
              width: '100%',
              height: 8,
              backgroundColor: Colors.surfaceLight,
              borderRadius: BorderRadius.full,
              overflow: 'hidden',
            }}>
              <Animated.View style={{
                height: '100%',
                backgroundColor: Colors.primary,
                width: `${processingProgress}%`,
              }} />
            </View>
            <Text style={{
              color: Colors.textSecondary,
              fontSize: Typography.sm,
              textAlign: 'center',
              marginTop: Spacing.sm,
            }}>
              {processingProgress}% Complete
            </Text>
          </View>
        </View>
      ) : (
        <View>
          <Text style={{
            color: Colors.textPrimary,
            fontSize: Typography.base,
            fontWeight: Typography.semibold,
            marginBottom: Spacing.base,
          }}>
            Detected Objects ({detectedObjects.length}):
          </Text>
          
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm }}>
            {detectedObjects.map((object, index) => (
              <View key={index} style={{
                backgroundColor: Colors.primary,
                paddingHorizontal: Spacing.base,
                paddingVertical: Spacing.sm,
                borderRadius: BorderRadius.full,
              }}>
                <Text style={{
                  color: Colors.textPrimary,
                  fontSize: Typography.sm,
                  fontWeight: Typography.medium,
                }}>
                  {object}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </EnhancedCard>
  );

  const renderProductMatching = () => (
    <EnhancedCard
      title="Product Matching"
      subtitle="Products found in your video"
      variant="elevated"
      style={{ marginBottom: Spacing.lg }}
    >
      {matchedProducts.length > 0 ? (
        <View>
          <Text style={{
            color: Colors.textPrimary,
            fontSize: Typography.base,
            fontWeight: Typography.semibold,
            marginBottom: Spacing.base,
          }}>
            Matched Products ({matchedProducts.length}):
          </Text>
          
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: Spacing.sm }}
          >
            {matchedProducts.map((product, index) => (
              <View key={product.id || index} style={{ marginRight: Spacing.base }}>
                <ProductCard 
                  product={product} 
                  onPress={() => onProductSelect(product)}
                />
              </View>
            ))}
          </ScrollView>
          
          <Text style={{
            color: Colors.textSecondary,
            fontSize: Typography.sm,
            marginTop: Spacing.base,
            textAlign: 'center',
            fontStyle: 'italic',
          }}>
            Tap on products to view details and purchase options
          </Text>
        </View>
      ) : (
        <View style={{ alignItems: 'center', paddingVertical: Spacing.xl }}>
          <Ionicons name="bag-outline" size={48} color={Colors.textSecondary} />
          <Text style={{
            color: Colors.textSecondary,
            fontSize: Typography.lg,
            marginTop: Spacing.base,
            textAlign: 'center',
          }}>
            No products matched yet
          </Text>
          <Text style={{
            color: Colors.textTertiary,
            fontSize: Typography.sm,
            marginTop: Spacing.sm,
            textAlign: 'center',
          }}>
            Products will appear here after object detection
          </Text>
        </View>
      )}
    </EnhancedCard>
  );

  const renderUploadProgress = () => (
    <EnhancedCard
      title="Uploading Video"
      subtitle="Sharing your content with the world"
      variant="elevated"
      style={{ marginBottom: Spacing.lg }}
    >
      {isUploading ? (
        <View style={{ alignItems: 'center', paddingVertical: Spacing.xl }}>
          <EnhancedLoading
            type="progress"
            text="Uploading"
            subtitle="Please wait while we upload your video..."
            progress={uploadProgress}
            icon="cloud-upload-outline"
            size="large"
          />
          
          <View style={{ marginTop: Spacing.lg, width: '100%' }}>
            <View style={{
              width: '100%',
              height: 8,
              backgroundColor: Colors.surfaceLight,
              borderRadius: BorderRadius.full,
              overflow: 'hidden',
            }}>
              <Animated.View style={{
                height: '100%',
                backgroundColor: Colors.success,
                width: `${uploadProgress}%`,
              }} />
            </View>
            <Text style={{
              color: Colors.textSecondary,
              fontSize: Typography.sm,
              textAlign: 'center',
              marginTop: Spacing.sm,
            }}>
              {uploadProgress}% Complete
            </Text>
          </View>
        </View>
      ) : (
        <View style={{ alignItems: 'center', paddingVertical: Spacing.xl }}>
          <Ionicons name="cloud-upload-outline" size={48} color={Colors.primary} />
          <Text style={{
            color: Colors.textPrimary,
            fontSize: Typography.lg,
            marginTop: Spacing.base,
            textAlign: 'center',
          }}>
            Ready to Upload
          </Text>
          <Text style={{
            color: Colors.textSecondary,
            fontSize: Typography.sm,
            marginTop: Spacing.sm,
            textAlign: 'center',
          }}>
            Your video is ready to be shared
          </Text>
        </View>
      )}
    </EnhancedCard>
  );

  const renderCompletion = () => (
    <EnhancedCard
      title="Upload Complete!"
      subtitle="Your video is now live"
      variant="gradient"
      gradientColors={[Colors.success, Colors.primary]}
      style={{ marginBottom: Spacing.lg }}
    >
      <View style={{ alignItems: 'center', paddingVertical: Spacing.xl }}>
        <View style={{
          width: 80,
          height: 80,
          borderRadius: 40,
          backgroundColor: Colors.textPrimary,
          justifyContent: 'center',
          alignItems: 'center',
          marginBottom: Spacing.lg,
          ...Shadows.lg,
        }}>
          <Ionicons name="checkmark" size={40} color={Colors.success} />
        </View>
        
        <Text style={{
          color: Colors.textPrimary,
          fontSize: Typography.xl,
          fontWeight: Typography.bold,
          marginBottom: Spacing.sm,
          textAlign: 'center',
        }}>
          Success!
        </Text>
        
        <Text style={{
          color: Colors.textPrimary,
          fontSize: Typography.base,
          textAlign: 'center',
          lineHeight: Typography.base * Typography.normal,
        }}>
          Your shoppable video has been uploaded and is now available for viewers to discover and shop from.
        </Text>
        
        <View style={{ marginTop: Spacing.xl, gap: Spacing.sm }}>
          <EnhancedButton
            title="View My Video"
            onPress={() => onStepChange('complete')}
            icon="play-circle-outline"
            variant="outline"
            fullWidth
          />
          <EnhancedButton
            title="Upload Another"
            onPress={() => onStepChange('select')}
            icon="add-circle-outline"
            variant="primary"
            fullWidth
          />
        </View>
      </View>
    </EnhancedCard>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'preview':
        return renderVideoPreview();
      case 'detect':
        return renderObjectDetection();
      case 'products':
        return renderProductMatching();
      case 'upload':
        return renderUploadProgress();
      case 'complete':
        return renderCompletion();
      default:
        return null;
    }
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: Colors.background }}>
      <View style={{ padding: Spacing.lg }}>
        {/* Header */}
        <View style={{ marginBottom: Spacing.xl }}>
          <Text style={{
            color: Colors.textPrimary,
            fontSize: Typography['3xl'],
            fontWeight: Typography.bold,
            marginBottom: Spacing.sm,
          }}>
            Create Shoppable Video
          </Text>
          <Text style={{
            color: Colors.textSecondary,
            fontSize: Typography.base,
            lineHeight: Typography.base * Typography.normal,
          }}>
            Upload your video and let AI help you make it shoppable
          </Text>
        </View>

        {/* Step Indicator */}
        {renderStepIndicator()}

        {/* Current Step Content */}
        {renderCurrentStep()}

        {/* Action Buttons */}
        {currentStep === 'products' && !isProcessing && (
          <View style={{ gap: Spacing.base }}>
            <EnhancedButton
              title="Upload Video"
              onPress={onUpload}
              icon="cloud-upload-outline"
              variant="primary"
              size="large"
              fullWidth
            />
            <EnhancedButton
              title="Back to Preview"
              onPress={() => onStepChange('preview')}
              icon="arrow-back-outline"
              variant="secondary"
              fullWidth
            />
          </View>
        )}
      </View>
    </ScrollView>
  );
}; 