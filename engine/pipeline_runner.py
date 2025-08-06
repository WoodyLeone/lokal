"""
Pipeline runner for Lokal Engine
Main orchestrator that coordinates all components
"""

import os
import time
from typing import List, Dict, Optional
from dotenv import load_dotenv

from video_processor import VideoProcessor
from object_detector import ObjectDetector
from cropper import Cropper
from matcher import ProductMatcher
from supabase_client import SupabaseClient

load_dotenv()

class LokalPipeline:
    def __init__(self, 
                 frame_rate: int = 30,
                 confidence_threshold: float = 0.5,
                 model_path: str = "yolov8n.pt"):
        """
        Initialize Lokal pipeline
        
        Args:
            frame_rate: Frames to skip between extractions
            confidence_threshold: YOLO confidence threshold
            model_path: Path to YOLO model
        """
        self.frame_rate = frame_rate
        self.confidence_threshold = confidence_threshold
        
        # Initialize components
        self.video_processor = VideoProcessor(frame_rate=frame_rate)
        self.object_detector = ObjectDetector(
            model_path=model_path,
            confidence_threshold=confidence_threshold
        )
        self.cropper = Cropper()
        self.matcher = ProductMatcher()
        self.supabase = SupabaseClient()
        
        print("✅ Lokal Pipeline initialized successfully")
    
    def process_video(self, video_path: str, user_id: str) -> Dict:
        """
        Process a video through the complete pipeline
        
        Args:
            video_path: Path to video file
            user_id: User ID for database records
            
        Returns:
            Processing results summary
        """
        start_time = time.time()
        
        try:
            print(f"🎬 Starting video processing: {video_path}")
            
            # Step 1: Save video record to database
            video_id = self.supabase.save_video_record(video_path, user_id)
            print(f"📝 Video record saved with ID: {video_id}")
            
            # Step 2: Get video information
            video_info = self.video_processor.get_video_info(video_path)
            print(f"📊 Video info: {video_info['frame_count']} frames, {video_info['duration']:.2f}s")
            
            # Step 3: Process frames
            total_detections = 0
            total_matches = 0
            processed_frames = 0
            
            for frame_num, frame in self.video_processor.extract_frames(video_path):
                print(f"🖼️  Processing frame {frame_num + 1}...")
                
                # Detect objects
                detections = self.object_detector.detect_objects(frame)
                
                if detections:
                    # Crop detected objects
                    cropped_detections = self.cropper.crop_detections(frame, detections)
                    
                    for detection in cropped_detections:
                        # Convert crop to PIL Image for matching
                        pil_crop = self.cropper.crop_to_pil(detection["crop"])
                        
                        # Match product
                        match_result = self.matcher.match_product(pil_crop)
                        
                        if match_result.get("success", False):
                            # Save detection to database
                            detection_id = self.supabase.save_detection(
                                video_id=video_id,
                                label=detection["class_name"],
                                bbox=detection["bbox"]
                            )
                            
                            # Upload crop image
                            crop_url = self.supabase.upload_crop_image(pil_crop, detection_id)
                            
                            # Save matched product
                            product_id = self.supabase.save_matched_product(
                                object_id=detection_id,
                                label=match_result["product_name"],
                                match_type="auto"
                            )
                            
                            total_matches += 1
                            print(f"✅ Matched: {match_result['product_name']} (confidence: {match_result['confidence']:.2f})")
                        
                        total_detections += 1
                
                processed_frames += 1
            
            # Step 4: Update video status
            self.supabase.update_video_status(video_id, "completed")
            
            # Calculate processing time
            processing_time = time.time() - start_time
            
            # Prepare results summary
            results = {
                "success": True,
                "video_id": video_id,
                "processing_time": processing_time,
                "video_info": video_info,
                "processed_frames": processed_frames,
                "total_detections": total_detections,
                "total_matches": total_matches,
                "fps": processed_frames / processing_time if processing_time > 0 else 0
            }
            
            print(f"🎉 Video processing completed!")
            print(f"⏱️  Processing time: {processing_time:.2f}s")
            print(f"📊 Results: {total_detections} detections, {total_matches} matches")
            
            return results
            
        except Exception as e:
            print(f"❌ Error processing video: {e}")
            
            # Update video status to failed
            if 'video_id' in locals():
                self.supabase.update_video_status(video_id, "failed")
            
            return {
                "success": False,
                "error": str(e),
                "processing_time": time.time() - start_time
            }
    
    def process_frame(self, frame, video_id: str) -> List[Dict]:
        """
        Process a single frame
        
        Args:
            frame: Input frame
            video_id: Video ID for database records
            
        Returns:
            List of detection results
        """
        results = []
        
        # Detect objects
        detections = self.object_detector.detect_objects(frame)
        
        if detections:
            # Crop detected objects
            cropped_detections = self.cropper.crop_detections(frame, detections)
            
            for detection in cropped_detections:
                # Convert crop to PIL Image
                pil_crop = self.cropper.crop_to_pil(detection["crop"])
                
                # Match product
                match_result = self.matcher.match_product(pil_crop)
                
                if match_result.get("success", False):
                    # Save to database
                    detection_id = self.supabase.save_detection(
                        video_id=video_id,
                        label=detection["class_name"],
                        bbox=detection["bbox"]
                    )
                    
                    # Upload crop
                    crop_url = self.supabase.upload_crop_image(pil_crop, detection_id)
                    
                    # Save match
                    product_id = self.supabase.save_matched_product(
                        object_id=detection_id,
                        label=match_result["product_name"],
                        match_type="auto"
                    )
                    
                    results.append({
                        "detection": detection,
                        "match": match_result,
                        "detection_id": detection_id,
                        "product_id": product_id,
                        "crop_url": crop_url
                    })
        
        return results
    
    def get_processing_stats(self, video_id: str) -> Dict:
        """
        Get processing statistics for a video
        
        Args:
            video_id: Video ID
            
        Returns:
            Statistics dictionary
        """
        try:
            # Get video info
            video_uploads = self.supabase.get_video_uploads()
            video_info = next((v for v in video_uploads if v["id"] == video_id), None)
            
            if not video_info:
                return {"error": "Video not found"}
            
            # Get detections
            detections = self.supabase.get_detected_objects(video_id)
            
            # Get matches
            matches = []
            for detection in detections:
                detection_matches = self.supabase.get_matched_products(detection["id"])
                matches.extend(detection_matches)
            
            return {
                "video_info": video_info,
                "total_detections": len(detections),
                "total_matches": len(matches),
                "detections": detections,
                "matches": matches
            }
            
        except Exception as e:
            return {"error": str(e)}
    
    def cleanup_temp_files(self, temp_dir: str = "./temp"):
        """
        Clean up temporary files
        
        Args:
            temp_dir: Directory to clean
        """
        import shutil
        
        try:
            if os.path.exists(temp_dir):
                shutil.rmtree(temp_dir)
                print(f"🧹 Cleaned up temporary directory: {temp_dir}")
        except Exception as e:
            print(f"Error cleaning up temp files: {e}")


def main():
    """Example usage of the Lokal Pipeline"""
    
    # Initialize pipeline
    pipeline = LokalPipeline(
        frame_rate=30,
        confidence_threshold=0.5,
        model_path="yolov8n.pt"
    )
    
    # Example video processing
    video_path = "path/to/your/video.mp4"
    user_id = "example-user-id"
    
    if os.path.exists(video_path):
        results = pipeline.process_video(video_path, user_id)
        print(f"Processing results: {results}")
    else:
        print(f"Video file not found: {video_path}")


if __name__ == "__main__":
    main() 