# Lokal Engine 🎬

A powerful video processing pipeline that extracts frames, detects objects using YOLOv8, and matches products using OpenAI's GPT-4 Vision.

## 🚀 Features

- **Video Processing**: Extract frames from videos using OpenCV
- **Object Detection**: Detect objects using YOLOv8 with configurable confidence thresholds
- **Product Matching**: Match detected objects to products using OpenAI GPT-4 Vision
- **Database Integration**: Store results in Supabase with automatic image uploads
- **Modular Design**: Clean, testable components that can be used independently

## 📁 Project Structure

```
engine/
├── video_processor.py      # OpenCV frame extraction
├── object_detector.py      # YOLOv8 object detection
├── cropper.py             # Bounding box cropping
├── matcher.py             # OpenAI product matching
├── supabase_client.py     # Database operations
├── pipeline_runner.py     # Main orchestrator
├── requirements.txt       # Python dependencies
├── env.example           # Environment configuration
└── README.md             # This file
```

## 🛠️ Setup

### 1. Install Dependencies

```bash
cd engine
pip install -r requirements.txt
```

### 2. Environment Configuration

Copy the example environment file and configure your settings:

```bash
cp env.example .env
```

Edit `.env` with your credentials:

```env
# Supabase Configuration
SUPABASE_URL=your-supabase-url-here
SUPABASE_KEY=your-supabase-anon-key-here

# OpenAI Configuration
OPENAI_API_KEY=your-openai-api-key-here

# Processing Configuration
FRAME_RATE=30
YOLO_CONFIDENCE_THRESHOLD=0.5
YOLO_MODEL=yolov8n.pt
```

### 3. Download YOLO Model

The engine will automatically download the YOLOv8 model on first use, or you can download it manually:

```bash
# Download YOLOv8n (nano) model
wget https://github.com/ultralytics/assets/releases/download/v0.0.0/yolov8n.pt
```

## 🗄️ Database Schema

The engine expects the following Supabase tables:

### video_uploads
```sql
CREATE TABLE video_uploads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    video_path TEXT NOT NULL,
    status TEXT DEFAULT 'processing',
    timestamp TIMESTAMP DEFAULT NOW()
);
```

### detected_objects
```sql
CREATE TABLE detected_objects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    video_id UUID REFERENCES video_uploads(id),
    label TEXT NOT NULL,
    bbox JSONB NOT NULL,
    crop_path TEXT,
    timestamp TIMESTAMP DEFAULT NOW()
);
```

### matched_products
```sql
CREATE TABLE matched_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    object_id UUID REFERENCES detected_objects(id),
    match_type TEXT DEFAULT 'auto',
    label TEXT NOT NULL,
    affiliate_link TEXT,
    timestamp TIMESTAMP DEFAULT NOW()
);
```

## 🎯 Usage

### Basic Usage

```python
from pipeline_runner import LokalPipeline

# Initialize pipeline
pipeline = LokalPipeline(
    frame_rate=30,
    confidence_threshold=0.5,
    model_path="yolov8n.pt"
)

# Process a video
results = pipeline.process_video("path/to/video.mp4", "user-123")
print(f"Processing results: {results}")
```

### Component Usage

You can also use individual components:

```python
from video_processor import VideoProcessor
from object_detector import ObjectDetector
from cropper import Cropper
from matcher import ProductMatcher

# Video processing
processor = VideoProcessor(frame_rate=30)
for frame_num, frame in processor.extract_frames("video.mp4"):
    print(f"Processing frame {frame_num}")

# Object detection
detector = ObjectDetector()
detections = detector.detect_objects(frame)

# Cropping
cropper = Cropper()
cropped_detections = cropper.crop_detections(frame, detections)

# Product matching
matcher = ProductMatcher()
for detection in cropped_detections:
    pil_crop = cropper.crop_to_pil(detection["crop"])
    match = matcher.match_product(pil_crop)
    print(f"Matched: {match['product_name']}")
```

### API Integration

The engine can be easily integrated into a web API:

```python
from flask import Flask, request, jsonify
from pipeline_runner import LokalPipeline

app = Flask(__name__)
pipeline = LokalPipeline()

@app.route('/process-video', methods=['POST'])
def process_video():
    video_file = request.files['video']
    user_id = request.form['user_id']
    
    # Save video temporarily
    video_path = f"temp/{video_file.filename}"
    video_file.save(video_path)
    
    # Process video
    results = pipeline.process_video(video_path, user_id)
    
    return jsonify(results)

if __name__ == '__main__':
    app.run(debug=True)
```

## 🔧 Configuration

### Frame Rate
Control how many frames to skip between extractions:
```python
pipeline = LokalPipeline(frame_rate=15)  # Extract every 15th frame
```

### Confidence Threshold
Adjust YOLO detection sensitivity:
```python
pipeline = LokalPipeline(confidence_threshold=0.7)  # Higher confidence
```

### Model Selection
Use different YOLO models:
```python
# YOLOv8n (nano) - fastest
pipeline = LokalPipeline(model_path="yolov8n.pt")

# YOLOv8s (small) - balanced
pipeline = LokalPipeline(model_path="yolov8s.pt")

# YOLOv8m (medium) - more accurate
pipeline = LokalPipeline(model_path="yolov8m.pt")
```

## 📊 Performance

Typical performance metrics:

- **Frame Rate**: 30 FPS extraction (configurable)
- **Detection Speed**: ~50ms per frame with YOLOv8n
- **Matching Speed**: ~2-5 seconds per product (OpenAI API)
- **Memory Usage**: ~2GB RAM for video processing

## 🧪 Testing

Run tests to verify your setup:

```python
# Test video processing
from video_processor import VideoProcessor
processor = VideoProcessor()
info = processor.get_video_info("test_video.mp4")
print(f"Video info: {info}")

# Test object detection
from object_detector import ObjectDetector
detector = ObjectDetector()
detections = detector.detect_objects(frame)
print(f"Detections: {len(detections)}")

# Test product matching
from matcher import ProductMatcher
matcher = ProductMatcher()
result = matcher.match_product(pil_image)
print(f"Match: {result}")
```

## 🚨 Error Handling

The engine includes comprehensive error handling:

- **File not found**: Graceful handling of missing videos
- **API failures**: Retry logic for OpenAI API calls
- **Database errors**: Connection retry and fallback options
- **Memory issues**: Automatic cleanup of temporary files

## 🔒 Security

- Environment variables for sensitive credentials
- Input validation for all file paths
- Secure file handling with temporary directories
- API key protection

## 📈 Monitoring

Track processing progress:

```python
# Get processing statistics
stats = pipeline.get_processing_stats(video_id)
print(f"Detections: {stats['total_detections']}")
print(f"Matches: {stats['total_matches']}")
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details.

## 🆘 Support

For issues and questions:
1. Check the troubleshooting section
2. Review error logs
3. Open an issue with detailed information

---

**Lokal Engine** - Making video content shoppable with AI 🛍️ 