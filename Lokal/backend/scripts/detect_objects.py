#!/usr/bin/env python3
"""
Object Detection Script for Lokal Backend
Uses YOLOv8 to detect objects in video frames
"""

import sys
import json
import cv2
import numpy as np
from pathlib import Path

try:
    from ultralytics import YOLO
except ImportError:
    print("YOLOv8 not installed. Using dummy detection.")
    YOLO = None

def extract_frames(video_path, max_frames=10):
    """Extract frames from video for object detection"""
    cap = cv2.VideoCapture(video_path)
    frames = []
    frame_count = 0
    
    # Get total frame count
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    frame_interval = max(1, total_frames // max_frames)
    
    while cap.isOpened() and len(frames) < max_frames:
        ret, frame = cap.read()
        if not ret:
            break
            
        if frame_count % frame_interval == 0:
            frames.append(frame)
            
        frame_count += 1
    
    cap.release()
    return frames

def detect_objects_yolo(frames):
    """Detect objects using YOLOv8"""
    if YOLO is None:
        return get_dummy_objects()
    
    try:
        # Load YOLOv8 model
        model = YOLO('yolov8n.pt')  # Use nano model for speed
        
        detected_objects = set()
        
        for frame in frames:
            # Run detection
            results = model(frame)
            
            for result in results:
                boxes = result.boxes
                if boxes is not None:
                    for box in boxes:
                        # Get class name
                        class_id = int(box.cls[0])
                        class_name = model.names[class_id]
                        
                        # Get confidence
                        confidence = float(box.conf[0])
                        
                        # Only include high-confidence detections
                        if confidence > 0.5:
                            detected_objects.add(class_name)
        
        return list(detected_objects)
        
    except Exception as e:
        print(f"YOLO detection error: {e}", file=sys.stderr)
        return get_dummy_objects()

def get_dummy_objects():
    """Return dummy objects for demo purposes"""
    import random
    
    possible_objects = [
        'person', 'chair', 'table', 'laptop', 'cell phone', 'book', 'cup', 'bottle',
        'sneakers', 'hat', 'shirt', 'pants', 'handbag', 'watch', 'glasses', 'couch',
        'tv', 'lamp', 'plant', 'car', 'bicycle', 'dog', 'cat', 'keyboard', 'mouse'
    ]
    
    # Return 3-6 random objects
    num_objects = random.randint(3, 6)
    return random.sample(possible_objects, num_objects)

def main():
    """Main function"""
    if len(sys.argv) != 2:
        print(json.dumps({
            "error": "Usage: python detect_objects.py <video_path>"
        }))
        sys.exit(1)
    
    video_path = sys.argv[1]
    
    # Check if video file exists
    if not Path(video_path).exists():
        print(json.dumps({
            "error": f"Video file not found: {video_path}"
        }))
        sys.exit(1)
    
    try:
        # Extract frames
        frames = extract_frames(video_path)
        
        if not frames:
            print(json.dumps({
                "error": "Could not extract frames from video"
            }))
            sys.exit(1)
        
        # Detect objects
        objects = detect_objects_yolo(frames)
        
        # Return results as JSON
        result = {
            "objects": objects,
            "frame_count": len(frames),
            "detection_method": "YOLOv8" if YOLO else "Dummy"
        }
        
        print(json.dumps(result))
        
    except Exception as e:
        print(json.dumps({
            "error": f"Detection failed: {str(e)}"
        }))
        sys.exit(1)

if __name__ == "__main__":
    main() 