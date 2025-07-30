"""
Object detector for Lokal Engine
Runs YOLOv8 for object detection
"""

import os
import numpy as np
from typing import List, Tuple, Dict, Optional
from ultralytics import YOLO
import cv2
from PIL import Image

class ObjectDetector:
    def __init__(self, model_path: str = "yolov8n.pt", confidence_threshold: float = 0.5):
        """
        Initialize object detector
        
        Args:
            model_path: Path to YOLO model file
            confidence_threshold: Minimum confidence for detections
        """
        self.confidence_threshold = confidence_threshold
        
        # Load YOLO model
        try:
            self.model = YOLO(model_path)
            print(f"✅ YOLO model loaded: {model_path}")
        except Exception as e:
            print(f"❌ Error loading YOLO model: {e}")
            raise
    
    def detect_objects(self, frame: np.ndarray) -> List[Dict]:
        """
        Detect objects in a frame
        
        Args:
            frame: Input frame (numpy array)
            
        Returns:
            List of detection dictionaries with bbox, confidence, and class
        """
        try:
            # Run YOLO detection
            results = self.model.predict(
                source=frame,
                conf=self.confidence_threshold,
                verbose=False
            )
            
            detections = []
            
            if results and len(results) > 0:
                result = results[0]  # Get first result
                
                if result.boxes is not None:
                    boxes = result.boxes
                    
                    for i in range(len(boxes)):
                        # Get bounding box coordinates
                        bbox = boxes.xyxy[i].cpu().numpy()
                        x1, y1, x2, y2 = map(int, bbox)
                        
                        # Get confidence
                        confidence = float(boxes.conf[i].cpu().numpy())
                        
                        # Get class
                        class_id = int(boxes.cls[i].cpu().numpy())
                        class_name = self.model.names[class_id]
                        
                        detection = {
                            "bbox": (x1, y1, x2, y2),
                            "confidence": confidence,
                            "class_id": class_id,
                            "class_name": class_name
                        }
                        
                        detections.append(detection)
            
            return detections
            
        except Exception as e:
            print(f"Error during object detection: {e}")
            return []
    
    def filter_detections(self, detections: List[Dict], 
                         min_confidence: Optional[float] = None,
                         classes: Optional[List[str]] = None) -> List[Dict]:
        """
        Filter detections based on confidence and class
        
        Args:
            detections: List of detections
            min_confidence: Minimum confidence threshold
            classes: List of allowed class names
            
        Returns:
            Filtered list of detections
        """
        filtered = detections
        
        # Filter by confidence
        if min_confidence is not None:
            filtered = [d for d in filtered if d["confidence"] >= min_confidence]
        
        # Filter by class
        if classes is not None:
            filtered = [d for d in filtered if d["class_name"] in classes]
        
        return filtered
    
    def draw_detections(self, frame: np.ndarray, detections: List[Dict], 
                       draw_labels: bool = True) -> np.ndarray:
        """
        Draw detection bounding boxes on frame
        
        Args:
            frame: Input frame
            detections: List of detections
            draw_labels: Whether to draw class labels
            
        Returns:
            Frame with drawn detections
        """
        frame_copy = frame.copy()
        
        for detection in detections:
            bbox = detection["bbox"]
            x1, y1, x2, y2 = bbox
            confidence = detection["confidence"]
            class_name = detection["class_name"]
            
            # Draw bounding box
            cv2.rectangle(frame_copy, (x1, y1), (x2, y2), (0, 255, 0), 2)
            
            # Draw label
            if draw_labels:
                label = f"{class_name}: {confidence:.2f}"
                label_size = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.5, 2)[0]
                
                # Draw label background
                cv2.rectangle(frame_copy, 
                            (x1, y1 - label_size[1] - 10), 
                            (x1 + label_size[0], y1), 
                            (0, 255, 0), -1)
                
                # Draw label text
                cv2.putText(frame_copy, label, (x1, y1 - 5), 
                           cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 0), 2)
        
        return frame_copy
    
    def get_available_classes(self) -> List[str]:
        """
        Get list of available class names
        
        Returns:
            List of class names
        """
        return list(self.model.names.values())
    
    def get_class_id(self, class_name: str) -> Optional[int]:
        """
        Get class ID for a given class name
        
        Args:
            class_name: Name of the class
            
        Returns:
            Class ID if found, None otherwise
        """
        for class_id, name in self.model.names.items():
            if name == class_name:
                return class_id
        return None 