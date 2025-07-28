const hybridDetectionService = require('./src/services/hybridDetectionService');
const productService = require('./src/services/productService');

async function testHybridDetection() {
  console.log('🧪 Testing Hybrid Detection (YOLO + OpenAI)...');
  
  try {
    const videoPath = '/Users/rawhive/Downloads/IMG_4656.MOV';
    
    console.log('📹 Testing video:', videoPath);
    console.log('🔑 OpenAI API Key:', process.env.OPENAI_API_KEY ? '✅ Available' : '❌ Not set');
    
    // Test hybrid detection
    console.log('🔍 Running hybrid detection...');
    const objects = await hybridDetectionService.detectObjectsWithOpenAI(videoPath);
    
    console.log('✅ Detection completed!');
    console.log('🎯 Detected objects:', objects);
    console.log('📊 Number of objects:', objects.length);
    
    if (objects.length > 0) {
      console.log('🎉 Objects detected!');
      
      // Test product matching with enhanced objects
      console.log('🛍️ Testing product matching with enhanced objects...');
      const matchedProducts = await productService.matchProductsByObjects(objects);
      
      console.log('📦 Matched products:', matchedProducts.length);
      if (matchedProducts.length > 0) {
        console.log('✅ Products found:');
        matchedProducts.forEach((product, index) => {
          console.log(`  ${index + 1}. ${product.title} (${product.brand}) - $${product.price}`);
        });
      } else {
        console.log('⚠️ No product matches found');
        
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
testHybridDetection(); 