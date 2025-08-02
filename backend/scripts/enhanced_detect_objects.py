#!/usr/bin/env python3
"""
Enhanced Object Detection Script for Lokal Backend
Uses OpenCV for frame extraction and ultralytics.YOLO for accurate object detection
"""

import sys
import json
import cv2
import numpy as np
from pathlib import Path
import logging
from typing import List, Dict, Tuple, Optional
import time

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Global variable for YOLO availability
YOLO_AVAILABLE = False
YOLO_MODEL = None
YOLO_CLASS_NAMES = {}

try:
    from ultralytics import YOLO
    YOLO_AVAILABLE = True
    # Load YOLOv8 model globally
    YOLO_MODEL = YOLO('yolov8n.pt')  # Use nano model for speed
    YOLO_CLASS_NAMES = YOLO_MODEL.names
    logger.info("✅ YOLOv8 successfully imported and model loaded")
    logger.info(f"📊 Model has {len(YOLO_CLASS_NAMES)} classes")
except ImportError as e:
    logger.error(f"❌ YOLOv8 not available: {e}")
    YOLO_AVAILABLE = False
except Exception as e:
    logger.error(f"❌ Failed to load YOLO model: {e}")
    YOLO_AVAILABLE = False

class EnhancedObjectDetector:
    def __init__(self, confidence_threshold: float = 0.5, iou_threshold: float = 0.45):
        """
        Initialize the enhanced object detector
        
        Args:
            confidence_threshold: Minimum confidence for object detection (0.0-1.0)
            iou_threshold: IoU threshold for non-maximum suppression (0.0-1.0)
        """
        self.confidence_threshold = confidence_threshold
        self.iou_threshold = iou_threshold

    def extract_frames(self, video_path: str, max_frames: int = 15, frame_interval: int = 30) -> List[np.ndarray]:
        """
        Extract frames from video with intelligent sampling
        
        Args:
            video_path: Path to video file
            max_frames: Maximum number of frames to extract
            frame_interval: Extract every Nth frame
            
        Returns:
            List of extracted frames as numpy arrays
        """
        try:
            cap = cv2.VideoCapture(video_path)
            
            if not cap.isOpened():
                logger.error(f"❌ Could not open video: {video_path}")
                return []
            
            # Get video properties
            total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
            fps = cap.get(cv2.CAP_PROP_FPS)
            duration = total_frames / fps if fps > 0 else 0
            
            logger.info(f"📹 Video info: {total_frames} frames, {fps:.2f} fps, {duration:.2f}s duration")
            
            frames = []
            frame_count = 0
            
            while cap.isOpened() and len(frames) < max_frames:
                ret, frame = cap.read()
                if not ret:
                    break
                
                # Extract frames at regular intervals
                if frame_count % frame_interval == 0:
                    # Resize frame for processing (maintain aspect ratio)
                    height, width = frame.shape[:2]
                    if width > 640:  # Resize if too large
                        scale = 640 / width
                        new_width = int(width * scale)
                        new_height = int(height * scale)
                        frame = cv2.resize(frame, (new_width, new_height))
                    
                    frames.append(frame)
                    logger.debug(f"📸 Extracted frame {frame_count} ({len(frames)}/{max_frames})")
                
                frame_count += 1
            
            cap.release()
            logger.info(f"✅ Extracted {len(frames)} frames from video")
            return frames
            
        except Exception as e:
            logger.error(f"❌ Error extracting frames: {e}")
            return []

    def detect_objects_in_frame(self, frame: np.ndarray) -> List[Dict]:
        """
        Detect objects in a single frame
        
        Args:
            frame: Input frame as numpy array
            
        Returns:
            List of detected objects with confidence scores
        """
        if not YOLO_AVAILABLE or YOLO_MODEL is None:
            return []
        
        try:
            # Run YOLO detection
            results = YOLO_MODEL(frame, verbose=False, conf=self.confidence_threshold, iou=self.iou_threshold)
            
            detections = []
            for result in results:
                boxes = result.boxes
                if boxes is not None:
                    for box in boxes:
                        # Get detection info
                        class_id = int(box.cls[0])
                        confidence = float(box.conf[0])
                        class_name = YOLO_CLASS_NAMES[class_id]
                        
                        # Only include high-confidence detections
                        if confidence >= self.confidence_threshold:
                            detections.append({
                                'class': class_name,
                                'confidence': confidence,
                                'class_id': class_id
                            })
            
            return detections
            
        except Exception as e:
            logger.error(f"❌ Error detecting objects in frame: {e}")
            return []

    def aggregate_detections(self, all_detections: List[List[Dict]]) -> List[Dict]:
        """
        Aggregate detections across multiple frames
        
        Args:
            all_detections: List of detections from each frame
            
        Returns:
            Aggregated detection results
        """
        # Count occurrences of each object class
        object_counts = {}
        confidence_sums = {}
        
        for frame_detections in all_detections:
            for detection in frame_detections:
                class_name = detection['class']
                confidence = detection['confidence']
                
                if class_name not in object_counts:
                    object_counts[class_name] = 0
                    confidence_sums[class_name] = 0
                
                object_counts[class_name] += 1
                confidence_sums[class_name] += confidence
        
        # Calculate average confidence and filter by frequency
        aggregated = []
        min_frequency = 1  # Allow objects that appear at least once
        
        for class_name, count in object_counts.items():
            if count >= min_frequency:
                avg_confidence = confidence_sums[class_name] / count
                aggregated.append({
                    'class': class_name,
                    'frequency': count,
                    'avg_confidence': avg_confidence,
                    'total_frames': len(all_detections)
                })
        
        # Sort by frequency and confidence
        aggregated.sort(key=lambda x: (x['frequency'], x['avg_confidence']), reverse=True)
        
        return aggregated

    def validate_detections(self, detections: List[Dict]) -> List[str]:
        """
        Validate and filter detections based on frequency and confidence
        
        Args:
            detections: List of detection dictionaries
            
        Returns:
            List of validated object class names
        """
        validated_objects = []
        
        for detection in detections:
            class_name = detection['class']
            frequency = detection['frequency']
            avg_confidence = detection['avg_confidence']
            
            # Enhanced validation criteria
            is_valid = True
            
            # Check frequency (object must appear in at least 30% of frames)
            min_frequency = max(3, 15 * 0.3)  # Use fixed frame count instead of dynamic
            if frequency < min_frequency:
                is_valid = False
                logger.debug(f"❌ Filtered {class_name}: low frequency ({frequency})")
            
            # Check confidence (must be above threshold)
            if avg_confidence < self.confidence_threshold:
                is_valid = False
                logger.debug(f"❌ Filtered {class_name}: low confidence ({avg_confidence:.3f})")
            
            # Enhanced object mapping for better product detection
            object_mapping = {
                'person': 'person',
                'shoe': 'sneakers',
                'sneaker': 'sneakers', 
                'boot': 'boots',
                'sandal': 'sandals',
                'footwear': 'sneakers',
                'cell phone': 'cell phone',
                'tv': 'tv',
                'laptop': 'laptop',
                'chair': 'chair',
                'table': 'table',
                'car': 'car',
                'truck': 'truck',
                'bicycle': 'bicycle',
                'motorcycle': 'motorcycle',
                'bus': 'bus',
                'train': 'train',
                'airplane': 'airplane',
                'boat': 'boat',
                'traffic light': 'traffic light',
                'fire hydrant': 'fire hydrant',
                'stop sign': 'stop sign',
                'parking meter': 'parking meter',
                'bench': 'bench',
                'bird': 'bird',
                'cat': 'cat',
                'dog': 'dog',
                'horse': 'horse',
                'sheep': 'sheep',
                'cow': 'cow',
                'elephant': 'elephant',
                'bear': 'bear',
                'zebra': 'zebra',
                'giraffe': 'giraffe',
                'backpack': 'backpack',
                'umbrella': 'umbrella',
                'handbag': 'handbag',
                'tie': 'tie',
                'suitcase': 'suitcase',
                'frisbee': 'frisbee',
                'skis': 'skis',
                'snowboard': 'snowboard',
                'sports ball': 'sports ball',
                'kite': 'kite',
                'baseball bat': 'baseball bat',
                'baseball glove': 'baseball glove',
                'skateboard': 'skateboard',
                'surfboard': 'surfboard',
                'tennis racket': 'tennis racket',
                'bottle': 'bottle',
                'wine glass': 'wine glass',
                'cup': 'cup',
                'fork': 'fork',
                'knife': 'knife',
                'spoon': 'spoon',
                'bowl': 'bowl',
                'banana': 'banana',
                'apple': 'apple',
                'sandwich': 'sandwich',
                'orange': 'orange',
                'broccoli': 'broccoli',
                'carrot': 'carrot',
                'hot dog': 'hot dog',
                'pizza': 'pizza',
                'donut': 'donut',
                'cake': 'cake',
                'couch': 'couch',
                'potted plant': 'plant',
                'bed': 'bed',
                'dining table': 'table',
                'toilet': 'toilet',
                'tv': 'tv',
                'laptop': 'laptop',
                'mouse': 'mouse',
                'remote': 'remote',
                'keyboard': 'keyboard',
                'cell phone': 'cell phone',
                'microwave': 'microwave',
                'oven': 'oven',
                'toaster': 'toaster',
                'sink': 'sink',
                'refrigerator': 'refrigerator',
                'book': 'book',
                'clock': 'clock',
                'vase': 'vase',
                'scissors': 'scissors',
                'teddy bear': 'teddy bear',
                'hair drier': 'hair drier',
                'toothbrush': 'toothbrush'
            }
            
            # Map detected class to product-friendly name
            mapped_name = object_mapping.get(class_name, class_name)
            
            if is_valid:
                validated_objects.append(mapped_name)
                logger.info(f"✅ Validated: {class_name} -> {mapped_name} (freq: {frequency}, conf: {avg_confidence:.3f})")
        
        return validated_objects

    def detect_objects(self, video_path: str) -> Dict:
        """
        Main detection function
        
        Args:
            video_path: Path to video file
            
        Returns:
            Dictionary with detection results
        """
        start_time = time.time()
        
        try:
            # Check if video file exists
            if not Path(video_path).exists():
                return {
                    "error": f"Video file not found: {video_path}",
                    "objects": [],
                    "detection_method": "None"
                }
            
            logger.info(f"🔍 Starting enhanced object detection for: {video_path}")
            
            # Extract frames
            frames = self.extract_frames(video_path)
            if not frames:
                return {
                    "error": "Could not extract frames from video",
                    "objects": [],
                    "detection_method": "None"
                }
            
            # Detect objects in each frame
            all_detections = []
            for i, frame in enumerate(frames):
                frame_detections = self.detect_objects_in_frame(frame)
                all_detections.append(frame_detections)
                logger.debug(f"Frame {i+1}: {len(frame_detections)} detections")
            
            # Aggregate detections across frames
            aggregated = self.aggregate_detections(all_detections)
            
            # Validate and filter detections
            validated_objects = self.validate_detections(aggregated)
            
            processing_time = time.time() - start_time
            
            result = {
                "objects": validated_objects,
                "frame_count": len(frames),
                "detection_method": "Enhanced YOLOv8" if YOLO_AVAILABLE else "None",
                "processing_time": f"{processing_time:.2f}s",
                "confidence_threshold": self.confidence_threshold,
                "total_detections": len(aggregated),
                "validated_detections": len(validated_objects),
                "raw_detections": aggregated
            }
            
            logger.info(f"✅ Detection complete: {len(validated_objects)} objects found in {processing_time:.2f}s")
            logger.info(f"📊 Objects: {validated_objects}")
            
            return result
            
        except Exception as e:
            logger.error(f"❌ Detection failed: {e}")
            return {
                "error": f"Detection failed: {str(e)}",
                "objects": [],
                "detection_method": "Error"
            }

def main():
    """Main function for command line usage"""
    if len(sys.argv) < 2 or len(sys.argv) > 3:
        print(json.dumps({
            "error": "Usage: python enhanced_detect_objects.py <video_path> [confidence_threshold]"
        }))
        sys.exit(1)
    
    video_path = sys.argv[1]
    confidence_threshold = float(sys.argv[2]) if len(sys.argv) > 2 else 0.6
    
    # Initialize detector with provided confidence threshold
    detector = EnhancedObjectDetector(confidence_threshold=confidence_threshold, iou_threshold=0.45)
    
    # Run detection
    result = detector.detect_objects(video_path)
    
    # Output result as JSON (single line for better parsing)
    print(json.dumps(result))

if __name__ == "__main__":
    main() 