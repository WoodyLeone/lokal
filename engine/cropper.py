"""
Cropper for Lokal Engine
Crops bounding boxes with OpenCV
"""

import cv2
import numpy as np
from typing import List, Tuple, Optional
from PIL import Image
import os

class Cropper:
    def __init__(self, min_size: int = 50):
        """
        Initialize cropper
        
        Args:
            min_size: Minimum size (width or height) for valid crops
        """
        self.min_size = min_size
    
    def crop_bbox(self, frame: np.ndarray, bbox: Tuple[int, int, int, int]) -> Optional[np.ndarray]:
        """
        Crop a bounding box from a frame
        
        Args:
            frame: Input frame
            bbox: Bounding box coordinates (x1, y1, x2, y2)
            
        Returns:
            Cropped image or None if invalid
        """
        x1, y1, x2, y2 = bbox
        
        # Validate coordinates
        if not self._validate_bbox(frame, bbox):
            return None
        
        # Crop the region
        crop = frame[y1:y2, x1:x2]
        
        # Check minimum size
        if crop.shape[0] < self.min_size or crop.shape[1] < self.min_size:
            return None
        
        return crop
    
    def crop_detections(self, frame: np.ndarray, detections: List[dict]) -> List[dict]:
        """
        Crop all detections from a frame
        
        Args:
            frame: Input frame
            detections: List of detection dictionaries
            
        Returns:
            List of detections with added 'crop' field
        """
        cropped_detections = []
        
        for detection in detections:
            bbox = detection["bbox"]
            crop = self.crop_bbox(frame, bbox)
            
            if crop is not None:
                detection_copy = detection.copy()
                detection_copy["crop"] = crop
                cropped_detections.append(detection_copy)
        
        return cropped_detections
    
    def _validate_bbox(self, frame: np.ndarray, bbox: Tuple[int, int, int, int]) -> bool:
        """
        Validate bounding box coordinates
        
        Args:
            frame: Input frame
            bbox: Bounding box coordinates
            
        Returns:
            True if valid, False otherwise
        """
        x1, y1, x2, y2 = bbox
        height, width = frame.shape[:2]
        
        # Check bounds
        if x1 < 0 or y1 < 0 or x2 > width or y2 > height:
            return False
        
        # Check size
        if x2 <= x1 or y2 <= y1:
            return False
        
        return True
    
    def resize_crop(self, crop: np.ndarray, target_size: Tuple[int, int] = (224, 224)) -> np.ndarray:
        """
        Resize crop to target size
        
        Args:
            crop: Input crop
            target_size: Target size (width, height)
            
        Returns:
            Resized crop
        """
        return cv2.resize(crop, target_size)
    
    def crop_to_pil(self, crop: np.ndarray) -> Image.Image:
        """
        Convert cropped numpy array to PIL Image
        
        Args:
            crop: Cropped image (BGR format)
            
        Returns:
            PIL Image (RGB format)
        """
        # Convert BGR to RGB
        rgb_crop = cv2.cvtColor(crop, cv2.COLOR_BGR2RGB)
        
        # Convert to PIL Image
        pil_image = Image.fromarray(rgb_crop)
        
        return pil_image
    
    def save_crop(self, crop: np.ndarray, output_path: str) -> bool:
        """
        Save crop to file
        
        Args:
            crop: Crop to save
            output_path: Output file path
            
        Returns:
            True if successful, False otherwise
        """
        try:
            # Ensure output directory exists
            os.makedirs(os.path.dirname(output_path), exist_ok=True)
            
            # Save crop
            success = cv2.imwrite(output_path, crop)
            return success
        except Exception as e:
            print(f"Error saving crop: {e}")
            return False
    
    def enhance_crop(self, crop: np.ndarray, 
                    brightness: float = 1.0,
                    contrast: float = 1.0) -> np.ndarray:
        """
        Enhance crop with brightness and contrast adjustments
        
        Args:
            crop: Input crop
            brightness: Brightness multiplier
            contrast: Contrast multiplier
            
        Returns:
            Enhanced crop
        """
        # Apply brightness and contrast
        enhanced = cv2.convertScaleAbs(crop, alpha=contrast, beta=(brightness - 1) * 100)
        
        return enhanced
    
    def get_crop_info(self, crop: np.ndarray) -> dict:
        """
        Get information about a crop
        
        Args:
            crop: Input crop
            
        Returns:
            Dictionary with crop information
        """
        height, width = crop.shape[:2]
        
        return {
            "width": width,
            "height": height,
            "aspect_ratio": width / height if height > 0 else 0,
            "area": width * height,
            "channels": crop.shape[2] if len(crop.shape) > 2 else 1
        } 