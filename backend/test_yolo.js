const objectDetectionService = require('./src/services/objectDetectionService');
const path = require('path');

async function testYOLODetection() {
  console.log('🧪 Testing YOLO Object Detection...');
  
  try {
    // Test with a sample video path (you can replace this with an actual video file)
    const testVideoPath = path.join(__dirname, 'src/temp/test-video.mp4');
    
    console.log('📹 Testing video path:', testVideoPath);
    
    // Test object detection
    const objects = await objectDetectionService.detectObjects(testVideoPath);
    
    console.log('✅ Detection completed successfully!');
    console.log('🎯 Detected objects:', objects);
    console.log('📊 Number of objects:', objects.length);
    
    if (objects.length > 0) {
      console.log('🎉 Real objects detected!');
    } else {
      console.log('⚠️  No objects detected, using dummy objects');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('🔍 Error details:', error);
  }
}

// Run the test
testYOLODetection(); 