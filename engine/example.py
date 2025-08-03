#!/usr/bin/env python3
"""
Example usage of Lokal Engine
Demonstrates how to use the video processing pipeline
"""

import os
import sys
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def example_basic_usage():
    """Example of basic pipeline usage"""
    print("🎬 Example: Basic Pipeline Usage")
    print("="*50)
    
    try:
        from pipeline_runner import LokalPipeline
        
        # Initialize pipeline
        pipeline = LokalPipeline(
            frame_rate=30,  # Extract every 30th frame
            confidence_threshold=0.5,  # YOLO confidence threshold
            model_path="yolov8n.pt"  # Use YOLOv8 nano model
        )
        
        # Example video path (replace with your video)
        video_path = "test_video.mp4"
        user_id = "example-user-123"
        
        if os.path.exists(video_path):
            print(f"Processing video: {video_path}")
            results = pipeline.process_video(video_path, user_id)
            
            if results["success"]:
                print(f"✅ Processing completed!")
                print(f"📊 Results:")
                print(f"   - Processing time: {results['processing_time']:.2f}s")
                print(f"   - Frames processed: {results['processed_frames']}")
                print(f"   - Detections: {results['total_detections']}")
                print(f"   - Matches: {results['total_matches']}")
                print(f"   - FPS: {results['fps']:.2f}")
            else:
                print(f"❌ Processing failed: {results.get('error', 'Unknown error')}")
        else:
            print(f"⚠️  Video file not found: {video_path}")
            print("   Create a test video first or update the path")
    
    except Exception as e:
        print(f"❌ Error in basic usage example: {e}")

def example_component_usage():
    """Example of using individual components"""
    print("\n🔧 Example: Individual Component Usage")
    print("="*50)
    
    try:
        from video_processor import VideoProcessor
        from object_detector import ObjectDetector
        from cropper import Cropper
        from matcher import ProductMatcher
        
        # Initialize components
        processor = VideoProcessor(frame_rate=15)
        detector = ObjectDetector(confidence_threshold=0.6)
        cropper = Cropper(min_size=100)
        matcher = ProductMatcher()
        
        # Example video path
        video_path = "test_video.mp4"
        
        if os.path.exists(video_path):
            print(f"Processing video: {video_path}")
            
            # Get video info
            video_info = processor.get_video_info(video_path)
            print(f"📊 Video info: {video_info['frame_count']} frames, {video_info['duration']:.2f}s")
            
            # Process first few frames
            frame_count = 0
            for frame_num, frame in processor.extract_frames(video_path):
                if frame_count >= 3:  # Only process first 3 frames for demo
                    break
                
                print(f"\n🖼️  Processing frame {frame_num + 1}...")
                
                # Detect objects
                detections = detector.detect_objects(frame)
                print(f"   Detected {len(detections)} objects")
                
                if detections:
                    # Crop detected objects
                    cropped_detections = cropper.crop_detections(frame, detections)
                    print(f"   Cropped {len(cropped_detections)} objects")
                    
                    # Match products (if OpenAI API is available)
                    for i, detection in enumerate(cropped_detections):
                        print(f"   Object {i+1}: {detection['class_name']} (confidence: {detection['confidence']:.2f})")
                        
                        # Convert to PIL for matching
                        pil_crop = cropper.crop_to_pil(detection["crop"])
                        
                        # Try to match product
                        try:
                            match_result = matcher.match_product(pil_crop)
                            if match_result.get("success", False):
                                print(f"     → Matched: {match_result['product_name']}")
                            else:
                                print(f"     → No match found")
                        except Exception as e:
                            print(f"     → Matching failed: {e}")
                
                frame_count += 1
        else:
            print(f"⚠️  Video file not found: {video_path}")
    
    except Exception as e:
        print(f"❌ Error in component usage example: {e}")

def example_custom_configuration():
    """Example of custom configuration"""
    print("\n⚙️  Example: Custom Configuration")
    print("="*50)
    
    try:
        from pipeline_runner import LokalPipeline
        
        # Custom configuration for different use cases
        
        # High-speed processing (lower quality, faster)
        fast_pipeline = LokalPipeline(
            frame_rate=60,  # Extract every 60th frame
            confidence_threshold=0.7,  # Higher confidence = fewer detections
            model_path="yolov8n.pt"  # Fastest model
        )
        print("🚀 Fast pipeline configured for speed")
        
        # High-quality processing (higher quality, slower)
        quality_pipeline = LokalPipeline(
            frame_rate=15,  # Extract every 15th frame
            confidence_threshold=0.3,  # Lower confidence = more detections
            model_path="yolov8s.pt"  # Better model (if available)
        )
        print("🎯 Quality pipeline configured for accuracy")
        
        # Balanced processing
        balanced_pipeline = LokalPipeline(
            frame_rate=30,
            confidence_threshold=0.5,
            model_path="yolov8n.pt"
        )
        print("⚖️  Balanced pipeline configured for efficiency")
        
    except Exception as e:
        print(f"❌ Error in custom configuration example: {e}")

def example_error_handling():
    """Example of error handling"""
    print("\n🛡️  Example: Error Handling")
    print("="*50)
    
    try:
        from pipeline_runner import LokalPipeline
        
        # Initialize pipeline
        pipeline = LokalPipeline()
        
        # Try to process non-existent video
        results = pipeline.process_video("non_existent_video.mp4", "user-123")
        
        if not results["success"]:
            print(f"✅ Error handled gracefully: {results.get('error', 'Unknown error')}")
        
        # Clean up temporary files
        pipeline.cleanup_temp_files()
        print("✅ Temporary files cleaned up")
        
    except Exception as e:
        print(f"❌ Error in error handling example: {e}")

def main():
    """Run all examples"""
    print("🎬 Lokal Engine Examples")
    print("="*60)
    
    # Check if environment is set up
    if not os.path.exists(".env"):
        print("⚠️  No .env file found. Please run setup.py first.")
        print("   Or create .env with your credentials:")
        print("   DATABASE_URL=postgresql://user:password@host:port/database")
        print("   OPENAI_API_KEY=your-key")
        print()
    
    # Run examples
    examples = [
        example_basic_usage,
        example_component_usage,
        example_custom_configuration,
        example_error_handling,
    ]
    
    for example_func in examples:
        try:
            example_func()
        except Exception as e:
            print(f"❌ Example failed: {e}")
        
        print("\n" + "-"*60 + "\n")
    
    print("🎉 Examples completed!")
    print("\nNext steps:")
    print("1. Set up your .env file with credentials")
    print("2. Create or obtain a test video")
    print("3. Run the examples again")
    print("4. Integrate the engine into your application")

if __name__ == "__main__":
    main() 