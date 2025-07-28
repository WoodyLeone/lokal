const hybridDetectionService = require('./src/services/hybridDetectionService');
const productService = require('./src/services/productService');

async function testImprovedFlow() {
  console.log('🧪 Testing Improved Flow: YOLO → OpenAI → Product Matching');
  console.log('=' .repeat(60));
  
  try {
    const videoPath = '/Users/rawhive/Downloads/IMG_4656.MOV';
    
    console.log('📹 Testing video:', videoPath);
    console.log('🔑 OpenAI API Key:', process.env.OPENAI_API_KEY ? '✅ Available' : '❌ Not set');
    console.log('');
    
    // Step 1: YOLO Detection
    console.log('🎯 STEP 1: YOLO Detection');
    console.log('-' .repeat(30));
    const yoloObjects = await hybridDetectionService.runYOLODetection(videoPath);
    console.log('YOLO detected:', yoloObjects);
    console.log('');
    
    // Step 2: OpenAI Enhancement (if available)
    let enhancedObjects = yoloObjects;
    if (process.env.OPENAI_API_KEY) {
      console.log('🤖 STEP 2: OpenAI Enhancement');
      console.log('-' .repeat(30));
      enhancedObjects = await hybridDetectionService.enhanceWithOpenAI(videoPath, yoloObjects);
      console.log('Enhanced objects:', enhancedObjects);
      console.log('');
    } else {
      console.log('⚠️  STEP 2: OpenAI Enhancement (Skipped - no API key)');
      console.log('-' .repeat(30));
      console.log('Using YOLO objects only:', enhancedObjects);
      console.log('');
    }
    
    // Step 3: Product Matching
    console.log('🛍️ STEP 3: Product Matching');
    console.log('-' .repeat(30));
    const matchedProducts = await productService.matchProductsByObjects(enhancedObjects);
    
    console.log('📦 Matched products:', matchedProducts.length);
    if (matchedProducts.length > 0) {
      console.log('✅ Products found:');
      matchedProducts.forEach((product, index) => {
        const matchType = index === 0 ? '🎯' : '🔍';
        console.log(`  ${matchType} ${index + 1}. ${product.title} (${product.brand}) - $${product.price}`);
      });
    } else {
      console.log('⚠️ No product matches found');
      
      // Show demo products
      console.log('🎭 Demo products available:');
      const demoProducts = await productService.getDemoProducts(3);
      demoProducts.forEach((product, index) => {
        console.log(`  ${index + 1}. ${product.title} (${product.brand}) - $${product.price}`);
      });
    }
    
    console.log('');
    console.log('📊 FLOW SUMMARY:');
    console.log('-' .repeat(30));
    console.log(`YOLO Input: ${yoloObjects.join(', ')}`);
    console.log(`Enhanced: ${enhancedObjects.join(', ')}`);
    console.log(`Matches: ${matchedProducts.length} products`);
    
    if (matchedProducts.length > 0) {
      const exactMatches = matchedProducts.filter(p => 
        enhancedObjects.some(obj => 
          p.title.toLowerCase().includes(obj.toLowerCase()) ||
          obj.toLowerCase().includes(p.title.toLowerCase())
        )
      );
      console.log(`Exact matches: ${exactMatches.length}`);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('🔍 Error details:', error);
  }
}

// Run the test
testImprovedFlow(); 