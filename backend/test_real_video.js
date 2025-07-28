const objectDetectionService = require('./src/services/objectDetectionService');
const productService = require('./src/services/productService');

async function testRealVideo() {
  console.log('🧪 Testing YOLO Detection with Real Video...');
  
  try {
    const videoPath = '/Users/rawhive/Downloads/IMG_4656.MOV';
    
    console.log('📹 Testing video:', videoPath);
    console.log('📊 File size: ~155MB');
    
    // Test object detection
    console.log('🔍 Running object detection...');
    const objects = await objectDetectionService.detectObjects(videoPath);
    
    console.log('✅ Detection completed!');
    console.log('🎯 Detected objects:', objects);
    console.log('📊 Number of objects:', objects.length);
    
    if (objects.length > 0) {
      console.log('🎉 Real objects detected!');
      
      // Test product matching
      console.log('🛍️ Testing product matching...');
      const matchedProducts = await productService.matchProductsByObjects(objects);
      
      console.log('📦 Matched products:', matchedProducts.length);
      if (matchedProducts.length > 0) {
        console.log('✅ Products found:');
        matchedProducts.forEach((product, index) => {
          console.log(`  ${index + 1}. ${product.title} (${product.brand}) - $${product.price}`);
        });
      } else {
        console.log('⚠️ No product matches found for detected objects');
        
        // Test demo products
        console.log('🎭 Getting demo products...');
        const demoProducts = await productService.getDemoProducts(3);
        console.log('🎪 Demo products available:', demoProducts.length);
      }
    } else {
      console.log('⚠️ No objects detected');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('🔍 Error details:', error);
  }
}

// Run the test
testRealVideo(); 