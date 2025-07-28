# Hybrid Detection Setup Guide (YOLO + OpenAI)

## 🎯 Overview

This hybrid system combines YOLO object detection with OpenAI's Vision API to provide more detailed and accurate object recognition.

## 🚀 Benefits

### **YOLO (Fast & Reliable)**
- ✅ Real-time object detection
- ✅ Works offline
- ✅ Detects 80+ object categories
- ✅ High accuracy for general objects

### **OpenAI (Detailed & Specific)**
- ✅ Identifies specific makes/models
- ✅ Reads text and labels
- ✅ Provides context and details
- ✅ Understands brand names

### **Combined (Best of Both)**
- ✅ Fast initial detection (YOLO)
- ✅ Detailed analysis (OpenAI)
- ✅ Graceful fallback if OpenAI unavailable
- ✅ More accurate product matching

## 🔧 Setup Instructions

### 1. **Get OpenAI API Key**
```bash
# Visit: https://platform.openai.com/api-keys
# Create a new API key
```

### 2. **Set Environment Variable**
```bash
# Add to your .env file or export directly
export OPENAI_API_KEY="your-openai-api-key-here"
```

### 3. **Install Dependencies**
```bash
# The system already has the required packages
# axios (for API calls)
# fluent-ffmpeg (for frame extraction)
```

### 4. **Test the System**
```bash
# Test with your video
node test_hybrid_detection.js
```

## 🔄 How It Works

### **Step 1: YOLO Detection**
```
Video → YOLO → ["car", "oven"]
```

### **Step 2: Frame Extraction**
```
Video → Extract Frame → image.jpg
```

### **Step 3: OpenAI Analysis**
```
image.jpg + YOLO results → OpenAI Vision API → Detailed Analysis
```

### **Step 4: Enhanced Results**
```
YOLO: ["car", "oven"]
OpenAI: ["Toyota Matrix 2011", "KitchenAid Professional Oven"]
```

### **Step 5: Product Matching**
```
Enhanced objects → Product Database → Matched Products
```

## 💰 Cost Considerations

### **OpenAI API Costs**
- **GPT-4 Vision**: ~$0.01-0.03 per image
- **Your video**: ~$0.01-0.03 per analysis
- **Monthly cost**: Depends on usage volume

### **Cost Optimization**
- Only analyze videos with detected objects
- Cache results for similar videos
- Use lower-cost models for bulk processing

## 🎯 Expected Results

### **Without OpenAI (YOLO Only)**
```
Detected: ["car", "oven"]
Products: [Tesla Model 3, Honda Civic, KitchenAid Oven, GE Oven]
```

### **With OpenAI (Hybrid)**
```
Detected: ["Toyota Matrix 2011", "KitchenAid Professional Oven"]
Products: [Toyota Matrix 2011, KitchenAid Professional Oven]
```

## 🔧 Integration Options

### **Option 1: Automatic Hybrid (Recommended)**
```javascript
// Automatically uses OpenAI if available, falls back to YOLO
const objects = await hybridDetectionService.detectObjectsWithOpenAI(videoPath);
```

### **Option 2: Manual Selection**
```javascript
// Choose detection method based on requirements
if (useOpenAI) {
  objects = await hybridDetectionService.detectObjectsWithOpenAI(videoPath);
} else {
  objects = await objectDetectionService.detectObjects(videoPath);
}
```

### **Option 3: Progressive Enhancement**
```javascript
// Start with YOLO, enhance with OpenAI if needed
let objects = await objectDetectionService.detectObjects(videoPath);
if (objects.includes('car') && openaiAvailable) {
  objects = await hybridDetectionService.enhanceWithOpenAI(videoPath, objects);
}
```

## 🚀 Next Steps

1. **Get OpenAI API key**
2. **Test with your video**
3. **Compare results with YOLO-only**
4. **Adjust product database for better matching**
5. **Deploy to production**

## 💡 Tips

- **Start with YOLO-only** to establish baseline
- **Add OpenAI gradually** for premium features
- **Monitor API costs** and usage
- **Cache results** to reduce API calls
- **Use fallback gracefully** if OpenAI is unavailable

## 🔍 Testing

```bash
# Test YOLO only
node test_real_video.js

# Test hybrid (requires OpenAI API key)
node test_hybrid_detection.js
```

The hybrid system should provide much more specific and accurate detection for your Toyota Matrix video! 🎉 