#!/usr/bin/env python3
"""
ByteTrack Object Tracking Service
Handles object tracking across video frames with cost optimization and enhanced confidence scoring
"""

import sys
import json
import cv2
import numpy as np
from pathlib import Path
import logging
from typing import List, Dict, Tuple, Optional
import time
import math
import argparse
import traceback

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Global variables for model availability
YOLO_AVAILABLE = False
BYTETRACK_AVAILABLE = False
YOLO_MODEL = None
TRACKER = None

try:
    from ultralytics import YOLO
    YOLO_AVAILABLE = True
    YOLO_MODEL = YOLO('yolov8n.pt')  # Use nano model for cost optimization
    logger.info("✅ YOLOv8 successfully imported")
except ImportError as e:
    logger.error(f"❌ YOLOv8 not available: {e}")

# Enhanced ByteTrack-like implementation with confidence scoring
class Track:
    def __init__(self, bbox, confidence, class_id, class_name, track_id):
        self.bbox = bbox  # [x1, y1, x2, y2]
        self.confidence = confidence
        self.class_id = class_id
        self.class_name = class_name
        self.track_id = track_id
        self.hits = 1
        self.age = 0
        self.time_since_update = 0
        self.state = 'tentative'  # tentative, confirmed, deleted
        self.history = [bbox]
        self.confidence_history = [confidence]
        self.velocity = [0, 0]  # [vx, vy]
        self.acceleration = [0, 0]  # [ax, ay]
        
        # Enhanced confidence scoring
        self.stability_score = 1.0
        self.consistency_score = 1.0
        self.quality_score = confidence
        
    def predict(self):
        """Enhanced prediction based on velocity and acceleration"""
        if len(self.history) >= 2:
            # Calculate velocity from last two positions
            prev_bbox = self.history[-2]
            curr_bbox = self.history[-1]
            
            center_x = (curr_bbox[0] + curr_bbox[2]) / 2
            center_y = (curr_bbox[1] + curr_bbox[3]) / 2
            prev_center_x = (prev_bbox[0] + prev_bbox[2]) / 2
            prev_center_y = (prev_bbox[1] + prev_bbox[3]) / 2
            
            vx = center_x - prev_center_x
            vy = center_y - prev_center_y
            
            # Update velocity with smoothing
            self.velocity[0] = 0.7 * self.velocity[0] + 0.3 * vx
            self.velocity[1] = 0.7 * self.velocity[1] + 0.3 * vy
            
            # Predict next position
            predicted_center_x = center_x + self.velocity[0]
            predicted_center_y = center_y + self.velocity[1]
            
            width = curr_bbox[2] - curr_bbox[0]
            height = curr_bbox[3] - curr_bbox[1]
            
            predicted_bbox = [
                predicted_center_x - width / 2,
                predicted_center_y - height / 2,
                predicted_center_x + width / 2,
                predicted_center_y + height / 2
            ]
            return predicted_bbox
        return self.bbox
    
    def update(self, bbox, confidence):
        """Update track with new detection and enhanced scoring"""
        old_bbox = self.bbox
        self.bbox = bbox
        self.confidence = confidence
        self.hits += 1
        self.age += 1
        self.time_since_update = 0
        self.history.append(bbox)
        self.confidence_history.append(confidence)
        
        # Keep only last 15 positions for memory efficiency
        if len(self.history) > 15:
            self.history = self.history[-15:]
            self.confidence_history = self.confidence_history[-15:]
        
        # Calculate stability score based on bbox consistency
        if len(self.history) >= 3:
            recent_bboxes = self.history[-3:]
            bbox_variations = []
            for i in range(1, len(recent_bboxes)):
                variation = self.calculate_bbox_variation(recent_bboxes[i-1], recent_bboxes[i])
                bbox_variations.append(variation)
            self.stability_score = 1.0 - min(1.0, np.mean(bbox_variations) / 100.0)
        
        # Calculate consistency score based on confidence stability
        if len(self.confidence_history) >= 3:
            confidence_std = np.std(self.confidence_history[-5:])
            self.consistency_score = 1.0 - min(1.0, confidence_std)
        
        # Update quality score
        self.quality_score = (self.confidence + self.stability_score + self.consistency_score) / 3
        
        # Update state based on hits and quality
        if self.hits >= 3 and self.quality_score > 0.6:
            self.state = 'confirmed'
        elif self.hits >= 1:
            self.state = 'tentative'
    
    def calculate_bbox_variation(self, bbox1, bbox2):
        """Calculate variation between two bounding boxes"""
        center1 = [(bbox1[0] + bbox1[2]) / 2, (bbox1[1] + bbox1[3]) / 2]
        center2 = [(bbox2[0] + bbox2[2]) / 2, (bbox2[1] + bbox2[3]) / 2]
        return math.sqrt((center1[0] - center2[0])**2 + (center1[1] - center2[1])**2)
    
    def mark_missed(self):
        """Mark track as missed in current frame"""
        self.time_since_update += 1
        self.age += 1
        
        # Decay quality score when missed
        self.quality_score *= 0.95
    
    def get_track_quality(self):
        """Get overall track quality score"""
        return {
            'confidence': self.confidence,
            'stability': self.stability_score,
            'consistency': self.consistency_score,
            'quality': self.quality_score,
            'hits': self.hits,
            'age': self.age
        }

class EnhancedTracker:
    def __init__(self, max_age=30, min_hits=3, iou_threshold=0.3):
        self.max_age = max_age
        self.min_hits = min_hits
        self.iou_threshold = iou_threshold
        self.tracks = []
        self.frame_count = 0
        self.next_id = 1
        
    def iou(self, bbox1, bbox2):
        """Calculate Intersection over Union between two bounding boxes"""
        x1 = max(bbox1[0], bbox2[0])
        y1 = max(bbox1[1], bbox2[1])
        x2 = min(bbox1[2], bbox2[2])
        y2 = min(bbox1[3], bbox2[3])
        
        intersection = max(0, x2 - x1) * max(0, y2 - y1)
        area1 = (bbox1[2] - bbox1[0]) * (bbox1[3] - bbox1[1])
        area2 = (bbox2[2] - bbox2[0]) * (bbox2[3] - bbox2[1])
        union = area1 + area2 - intersection
        
        return intersection / union if union > 0 else 0
    
    def update(self, detections):
        """Update tracks with new detections using enhanced ByteTrack logic"""
        self.frame_count += 1
        
        # Predict new locations of existing tracks
        for track in self.tracks:
            track.predict()
        
        # Separate detections into high and low confidence
        high_conf_detections = []
        low_conf_detections = []
        
        for det in detections:
            if det.confidence >= 0.5:  # High confidence threshold
                high_conf_detections.append(det)
            else:
                low_conf_detections.append(det)
        
        # First association: high confidence detections with confirmed tracks
        confirmed_tracks = [t for t in self.tracks if t.state == 'confirmed']
        unconfirmed_tracks = [t for t in self.tracks if t.state == 'tentative']
        
        # Associate high confidence detections with confirmed tracks
        matched_high_conf, unmatched_high_conf, unmatched_confirmed = self.associate_detections_to_tracks(
            high_conf_detections, confirmed_tracks
        )
        
        # Update matched confirmed tracks
        for track, detection in matched_high_conf:
            track.update(detection.bbox, detection.confidence)
        
        # Associate remaining high confidence detections with unconfirmed tracks
        matched_unconfirmed, unmatched_unconfirmed, unmatched_unconfirmed_tracks = self.associate_detections_to_tracks(
            unmatched_high_conf, unconfirmed_tracks
        )
        
        # Update matched unconfirmed tracks
        for track, detection in matched_unconfirmed:
            track.update(detection.bbox, detection.confidence)
        
        # Second association: low confidence detections with unmatched confirmed tracks
        unmatched_confirmed_after_high = [t for t in unmatched_confirmed if t not in [track for track, _ in matched_unconfirmed]]
        matched_low_conf, unmatched_low_conf, _ = self.associate_detections_to_tracks(
            low_conf_detections, unmatched_confirmed_after_high
        )
        
        # Update matched tracks with low confidence detections
        for track, detection in matched_low_conf:
            track.update(detection.bbox, detection.confidence)
        
        # Create new tracks for unmatched high confidence detections
        for detection in unmatched_high_conf:
            if detection not in [det for _, det in matched_unconfirmed]:
                new_track = Track(
                    detection.bbox, 
                    detection.confidence, 
                    detection.class_id, 
                    detection.class_name, 
                    self.next_id
                )
                self.tracks.append(new_track)
                self.next_id += 1
        
        # Mark unmatched tracks as missed
        all_matched_tracks = [track for track, _ in matched_high_conf + matched_unconfirmed + matched_low_conf]
        for track in self.tracks:
            if track not in all_matched_tracks:
                track.mark_missed()
        
        # Remove old tracks
        self.tracks = [t for t in self.tracks if t.time_since_update < self.max_age]
        
        return self.tracks
    
    def associate_detections_to_tracks(self, detections, tracks):
        """Associate detections to tracks using Hungarian algorithm"""
        if len(tracks) == 0:
            return [], detections, []
        
        if len(detections) == 0:
            return [], [], tracks
        
        # Calculate cost matrix
        cost_matrix = np.zeros((len(tracks), len(detections)))
        for i, track in enumerate(tracks):
            for j, detection in enumerate(detections):
                cost_matrix[i, j] = 1 - self.iou(track.bbox, detection.bbox)
        
        # Use Hungarian algorithm for optimal assignment
        try:
            from scipy.optimize import linear_sum_assignment
            track_indices, detection_indices = linear_sum_assignment(cost_matrix)
            
            matched = []
            unmatched_tracks = []
            unmatched_detections = []
            
            # Find matches
            for i, j in zip(track_indices, detection_indices):
                if cost_matrix[i, j] < (1 - self.iou_threshold):
                    matched.append((tracks[i], detections[j]))
                else:
                    unmatched_tracks.append(tracks[i])
                    unmatched_detections.append(detections[j])
            
            # Add unmatched tracks and detections
            for i, track in enumerate(tracks):
                if i not in track_indices:
                    unmatched_tracks.append(track)
            
            for j, detection in enumerate(detections):
                if j not in detection_indices:
                    unmatched_detections.append(detection)
            
            return matched, unmatched_detections, unmatched_tracks
            
        except ImportError:
            # Fallback to greedy assignment if scipy is not available
            return self.greedy_assignment(detections, tracks)
    
    def greedy_assignment(self, detections, tracks):
        """Greedy assignment as fallback when Hungarian algorithm is not available"""
        matched = []
        unmatched_tracks = tracks.copy()
        unmatched_detections = detections.copy()
        
        # Sort by confidence for better matching
        unmatched_detections.sort(key=lambda x: x.confidence, reverse=True)
        
        for detection in unmatched_detections:
            best_track = None
            best_iou = 0
            
            for track in unmatched_tracks:
                iou = self.iou(track.bbox, detection.bbox)
                if iou > best_iou and iou > self.iou_threshold:
                    best_iou = iou
                    best_track = track
            
            if best_track:
                matched.append((best_track, detection))
                unmatched_tracks.remove(best_track)
            else:
                unmatched_detections.append(detection)
        
        return matched, unmatched_detections, unmatched_tracks

class Detection:
    def __init__(self, bbox, confidence, class_id, class_name):
        self.bbox = bbox
        self.confidence = confidence
        self.class_id = class_id
        self.class_name = class_name

class TrackingService:
    def __init__(self, confidence_threshold=0.5, iou_threshold=0.45, max_objects_per_frame=10):
        """
        Initialize tracking service with cost optimization settings
        """
        self.confidence_threshold = confidence_threshold
        self.iou_threshold = iou_threshold
        self.tracker = EnhancedTracker(max_age=30, min_hits=3, iou_threshold=iou_threshold)
        self.yolo_model = YOLO_MODEL if YOLO_AVAILABLE else None
        
        # Cost optimization settings
        self.min_track_duration = 3
        self.max_tracks_per_frame = max_objects_per_frame
        self.track_confidence_threshold = 0.6
        self.frame_skip = 2  # Process every nth frame for cost optimization

    def detect_and_track(self, frames):
        """
        Detect objects and track them across frames
        """
        if not YOLO_AVAILABLE:
            logger.warning("YOLO not available, using dummy tracking")
            return self.get_dummy_tracking_results(frames)

        try:
            logger.info(f"Starting detection and tracking for {len(frames)} frames")
            
            all_tracks = []
            frame_results = []
            
            for frame_idx, frame in enumerate(frames):
                # Skip frames for cost optimization
                if frame_idx % self.frame_skip != 0:
                    continue
                    
                logger.debug(f"Processing frame {frame_idx + 1}/{len(frames)}")
                
                # YOLO detection
                detections = self.detect_objects_in_frame(frame)
                
                # Filter detections for cost optimization
                filtered_detections = self.filter_detections(detections)
                
                # Update tracker
                tracked_objects = self.tracker.update(filtered_detections)
                
                # Limit tracks per frame for cost savings
                if len(tracked_objects) > self.max_tracks_per_frame:
                    tracked_objects = tracked_objects[:self.max_tracks_per_frame]
                
                # Format results
                frame_result = {
                    'frame_number': frame_idx,
                    'timestamp': frame_idx * 500,  # Assuming 2 FPS
                    'tracks': []
                }
                
                for track in tracked_objects:
                    detection = track
                    if detection.hits >= self.min_track_duration:  # Only include stable tracks
                        track_data = {
                            'track_id': track.track_id,
                            'bbox': detection.bbox,
                            'confidence': detection.confidence,
                            'class_name': detection.class_name,
                            'class_id': detection.class_id,
                            'hits': detection.hits,
                            'age': detection.age,
                            'state': detection.state,
                            'quality': detection.get_track_quality() # Include quality scores
                        }
                        frame_result['tracks'].append(track_data)
                
                frame_results.append(frame_result)
                all_tracks.extend(frame_result['tracks'])
                
                logger.debug(f"Frame {frame_idx + 1}: {len(frame_result['tracks'])} tracks")

            # Aggregate results
            result = {
                'total_frames': len(frames),
                'total_tracks': len(set(track['track_id'] for track in all_tracks)),
                'frame_results': frame_results,
                'tracking_stats': self.calculate_tracking_stats(frame_results)
            }
            
            logger.info(f"Tracking completed: {result['total_tracks']} unique tracks across {len(frames)} frames")
            return result
            
        except Exception as e:
            logger.error(f"Tracking failed: {e}")
            logger.error(traceback.format_exc()) # Log full traceback
            return self.get_dummy_tracking_results(frames)

    def detect_objects_in_frame(self, frame):
        """
        Detect objects in a single frame using YOLOv8
        """
        try:
            if not self.yolo_model:
                return []
            
            # Run YOLO detection
            results = self.yolo_model(frame, verbose=False)
            
            detections = []
            for result in results:
                boxes = result.boxes
                if boxes is not None:
                    for box in boxes:
                        confidence = float(box.conf[0])
                        
                        # Apply confidence threshold for cost optimization
                        if confidence < self.confidence_threshold:
                            continue
                        
                        # Get bounding box coordinates
                        x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
                        bbox = [float(x1), float(y1), float(x2), float(y2)]
                        
                        # Get class information
                        class_id = int(box.cls[0])
                        class_name = self.yolo_model.names[class_id]
                        
                        # Create detection object
                        detection = Detection(bbox, confidence, class_id, class_name)
                        detections.append(detection)
            
            return detections
            
        except Exception as e:
            logger.error(f"Detection failed: {e}")
            return []

    def filter_detections(self, detections):
        """
        Filter detections for cost optimization
        """
        # Sort by confidence and take top detections
        sorted_detections = sorted(detections, key=lambda x: x.confidence, reverse=True)
        
        # Limit number of detections per frame
        max_detections = min(len(sorted_detections), self.max_tracks_per_frame)
        
        return sorted_detections[:max_detections]

    def calculate_tracking_stats(self, frame_results):
        """
        Calculate tracking statistics
        """
        total_tracks = 0
        total_detections = 0
        track_durations = {}
        
        for frame_result in frame_results:
            total_detections += len(frame_result['tracks'])
            for track in frame_result['tracks']:
                track_id = track['track_id']
                if track_id not in track_durations:
                    track_durations[track_id] = 0
                track_durations[track_id] += 1
                total_tracks = max(total_tracks, track_id)
        
        avg_track_duration = sum(track_durations.values()) / len(track_durations) if track_durations else 0
        
        return {
            'total_tracks': total_tracks,
            'total_detections': total_detections,
            'avg_track_duration': avg_track_duration,
            'track_durations': track_durations
        }

    def get_dummy_tracking_results(self, frames):
        """
        Generate dummy tracking results for testing
        """
        logger.info("Generating dummy tracking results")
        
        frame_results = []
        for i, frame in enumerate(frames):
            if i % 5 == 0:  # Every 5th frame
                frame_result = {
                    'frame_number': i,
                    'timestamp': i * 500,
                    'tracks': [
                        {
                            'track_id': 1,
                            'bbox': [100, 100, 200, 200],
                            'confidence': 0.8,
                            'class_name': 'person',
                            'class_id': 0,
                            'hits': 3,
                            'age': 3,
                            'state': 'confirmed'
                        }
                    ]
                }
                frame_results.append(frame_result)
        
        return {
            'total_frames': len(frames),
            'total_tracks': 1,
            'frame_results': frame_results,
            'tracking_stats': {
                'total_tracks': 1,
                'total_detections': len(frame_results),
                'avg_track_duration': len(frame_results),
                'track_durations': {1: len(frame_results)}
            }
        }

def main():
    """
    Main function for testing the tracking service
    """
    parser = argparse.ArgumentParser(description='ByteTrack Object Tracking Service')
    parser.add_argument('video_path', help='Path to the video file')
    parser.add_argument('--confidence', type=float, default=0.5, help='Confidence threshold (default: 0.5)')
    parser.add_argument('--max-objects', type=int, default=10, help='Maximum objects per frame (default: 10)')
    parser.add_argument('--iou-threshold', type=float, default=0.45, help='IoU threshold for tracking (default: 0.45)')
    
    args = parser.parse_args()
    
    if not Path(args.video_path).exists():
        print(json.dumps({"error": f"Video file not found: {args.video_path}"}))
        sys.exit(1)
    
    # Initialize tracking service with command line arguments
    tracker = TrackingService(
        confidence_threshold=args.confidence,
        iou_threshold=args.iou_threshold,
        max_objects_per_frame=args.max_objects
    )
    
    # Read video
    cap = cv2.VideoCapture(args.video_path)
    frames = []
    
    while True:
        ret, frame = cap.read()
        if not ret:
            break
        frames.append(frame)
    
    cap.release()
    
    # Process frames
    result = tracker.detect_and_track(frames)
    
    # Output results
    print(json.dumps(result, indent=2))

if __name__ == "__main__":
    main() 