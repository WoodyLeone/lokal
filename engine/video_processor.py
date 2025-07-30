"""
Video processor for Lokal Engine
Uses OpenCV to extract frames from videos
"""

import cv2
import os
from typing import Generator, Tuple, Optional
import numpy as np
from PIL import Image

class VideoProcessor:
    def __init__(self, frame_rate: int = 30):
        """
        Initialize video processor
        
        Args:
            frame_rate: Number of frames to skip between extractions
        """
        self.frame_rate = frame_rate
        
    def extract_frames(self, video_path: str) -> Generator[Tuple[int, np.ndarray], None, None]:
        """
        Extract frames from video at specified frame rate
        
        Args:
            video_path: Path to video file
            
        Yields:
            Tuple of (frame_number, frame_array)
        """
        if not os.path.exists(video_path):
            raise FileNotFoundError(f"Video file not found: {video_path}")
        
        cap = cv2.VideoCapture(video_path)
        
        if not cap.isOpened():
            raise ValueError(f"Could not open video file: {video_path}")
        
        try:
            frame_count = 0
            extracted_count = 0
            
            while True:
                ret, frame = cap.read()
                if not ret:
                    break
                
                # Extract every nth frame based on frame_rate
                if frame_count % self.frame_rate == 0:
                    yield extracted_count, frame
                    extracted_count += 1
                
                frame_count += 1
                
        finally:
            cap.release()
    
    def get_video_info(self, video_path: str) -> dict:
        """
        Get video metadata
        
        Args:
            video_path: Path to video file
            
        Returns:
            Dictionary with video information
        """
        if not os.path.exists(video_path):
            raise FileNotFoundError(f"Video file not found: {video_path}")
        
        cap = cv2.VideoCapture(video_path)
        
        if not cap.isOpened():
            raise ValueError(f"Could not open video file: {video_path}")
        
        try:
            # Get video properties
            fps = cap.get(cv2.CAP_PROP_FPS)
            frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
            width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
            height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
            duration = frame_count / fps if fps > 0 else 0
            
            return {
                "fps": fps,
                "frame_count": frame_count,
                "width": width,
                "height": height,
                "duration": duration,
                "extracted_frames": frame_count // self.frame_rate if self.frame_rate > 0 else frame_count
            }
        finally:
            cap.release()
    
    def resize_frame(self, frame: np.ndarray, max_width: int = 1920, max_height: int = 1080) -> np.ndarray:
        """
        Resize frame to fit within specified dimensions while maintaining aspect ratio
        
        Args:
            frame: Input frame
            max_width: Maximum width
            max_height: Maximum height
            
        Returns:
            Resized frame
        """
        height, width = frame.shape[:2]
        
        # Calculate scaling factor
        scale = min(max_width / width, max_height / height)
        
        if scale < 1:
            new_width = int(width * scale)
            new_height = int(height * scale)
            frame = cv2.resize(frame, (new_width, new_height))
        
        return frame
    
    def frame_to_pil(self, frame: np.ndarray) -> Image.Image:
        """
        Convert OpenCV frame to PIL Image
        
        Args:
            frame: OpenCV frame (BGR format)
            
        Returns:
            PIL Image (RGB format)
        """
        # Convert BGR to RGB
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        
        # Convert to PIL Image
        pil_image = Image.fromarray(rgb_frame)
        
        return pil_image
    
    def save_frame(self, frame: np.ndarray, output_path: str) -> bool:
        """
        Save frame to file
        
        Args:
            frame: Frame to save
            output_path: Output file path
            
        Returns:
            True if successful, False otherwise
        """
        try:
            # Ensure output directory exists
            os.makedirs(os.path.dirname(output_path), exist_ok=True)
            
            # Save frame
            success = cv2.imwrite(output_path, frame)
            return success
        except Exception as e:
            print(f"Error saving frame: {e}")
            return False 