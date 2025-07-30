#!/usr/bin/env node

const learningService = require('./src/services/learningService');
const enhancedObjectDetectionService = require('./src/services/enhancedObjectDetectionService');

async function testLearningSystem() {
  console.log('🧪 Testing Learning System...\n');

  try {
    // Test 1: Record a video pattern
    console.log('1. Testing video pattern recording...');
    const videoId = 'test-video-001';
    const videoPath = '/Users/rawhive/Downloads/new videos for LOKAL/Close-up_Of_Man_Feet_Walking_In_A_Park_fhd_1246653.mp4';
    const detectedObjects = ['person'];
    const contextItems = ['sneakers', 'athletic shoes', 'running shoes'];
    const finalSelection = 'sneakers';

    const patternSuccess = learningService.recordVideoPattern(
      videoId,
      videoPath,
      detectedObjects,
      contextItems,
      finalSelection
    );

    console.log('   Pattern recording:', patternSuccess ? '✅ Success' : '❌ Failed');

    // Test 2: Get improved suggestions
    console.log('\n2. Testing improved suggestions...');
    const suggestions = learningService.getImprovedContextSuggestions(detectedObjects, videoPath);
    console.log('   Learning-based suggestions:', suggestions);

    // Test 3: Record user feedback
    console.log('\n3. Testing user feedback recording...');
    const feedback = {
      accuracy: 'good',
      comments: 'Great detection for footwear!'
    };

    const feedbackSuccess = learningService.recordUserFeedback(videoId, feedback);
    console.log('   Feedback recording:', feedbackSuccess ? '✅ Success' : '❌ Failed');

    // Test 4: Get learning statistics
    console.log('\n4. Testing learning statistics...');
    const stats = learningService.getLearningStats();
    console.log('   Total videos:', stats.totalVideos);
    console.log('   Total feedback:', stats.totalFeedback);
    console.log('   Accuracy trend:', stats.accuracyTrend.toFixed(1) + '%');
    console.log('   Top detected objects:', stats.topDetectedObjects.slice(0, 3));

    // Test 5: Test enhanced detection with learning
    console.log('\n5. Testing enhanced detection with learning...');
    const detectionResult = await enhancedObjectDetectionService.detectObjects(videoPath);
    console.log('   Detection result:', detectionResult.objects);

    // Test 6: Record detection pattern through enhanced service
    console.log('\n6. Testing detection pattern recording...');
    const patternRecordSuccess = enhancedObjectDetectionService.recordDetectionPattern(
      'test-video-002',
      videoPath,
      detectionResult.objects,
      detectionResult.objects,
      'athletic shoes'
    );
    console.log('   Pattern recording through service:', patternRecordSuccess ? '✅ Success' : '❌ Failed');

    // Test 7: Get updated statistics
    console.log('\n7. Testing updated statistics...');
    const updatedStats = learningService.getLearningStats();
    console.log('   Updated total videos:', updatedStats.totalVideos);
    console.log('   Updated accuracy trend:', updatedStats.accuracyTrend.toFixed(1) + '%');

    console.log('\n🎉 Learning system test completed successfully!');
    console.log('\n📊 Final Statistics:');
    console.log('   Videos processed:', updatedStats.totalVideos);
    console.log('   Feedback received:', updatedStats.totalFeedback);
    console.log('   Overall accuracy:', updatedStats.accuracyTrend.toFixed(1) + '%');
    console.log('   Categories detected:', Object.keys(updatedStats.categoryDistribution).length);

  } catch (error) {
    console.error('❌ Error testing learning system:', error);
  }
}

// Run the test
testLearningSystem(); 