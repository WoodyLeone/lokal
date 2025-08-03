"""
Railway PostgreSQL client for Lokal Engine
Replaces the deprecated Supabase client with direct PostgreSQL operations
"""

import os
import psycopg2
import psycopg2.extras
import json
import logging
from datetime import datetime
from typing import Dict, List, Optional, Any
from PIL import Image
import io
import base64

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class RailwayClient:
    def __init__(self):
        self.database_url = os.getenv("DATABASE_URL")
        
        if not self.database_url:
            raise ValueError("DATABASE_URL must be set in environment")
        
        self.connection = None
        self._connect()
    
    def _connect(self):
        """Establish database connection"""
        try:
            self.connection = psycopg2.connect(
                self.database_url,
                cursor_factory=psycopg2.extras.RealDictCursor
            )
            logger.info("Connected to Railway PostgreSQL database")
        except Exception as e:
            logger.error(f"Failed to connect to database: {e}")
            raise
    
    def _ensure_connection(self):
        """Ensure database connection is active"""
        if self.connection is None or self.connection.closed:
            self._connect()
    
    def _execute_query(self, query: str, params: tuple = None, fetch_one: bool = False, fetch_all: bool = False):
        """Execute a database query"""
        self._ensure_connection()
        
        try:
            with self.connection.cursor() as cursor:
                cursor.execute(query, params)
                
                if fetch_one:
                    result = cursor.fetchone()
                    self.connection.commit()
                    return dict(result) if result else None
                elif fetch_all:
                    results = cursor.fetchall()
                    self.connection.commit()
                    return [dict(row) for row in results]
                else:
                    self.connection.commit()
                    return cursor.rowcount
        except Exception as e:
            self.connection.rollback()
            logger.error(f"Database query failed: {e}")
            raise
    
    def save_video_record(self, video_path: str, user_id: str = "system") -> str:
        """Save video upload record and return video ID"""
        query = """
        INSERT INTO videos (file_path, user_id, status, created_at)
        VALUES (%s, %s, %s, %s)
        RETURNING id
        """
        
        result = self._execute_query(
            query,
            (video_path, user_id, "processing", datetime.now()),
            fetch_one=True
        )
        
        video_id = result["id"]
        logger.info(f"Saved video record with ID: {video_id}")
        return str(video_id)
    
    def update_video_status(self, video_id: str, status: str):
        """Update video processing status"""
        query = """
        UPDATE videos 
        SET status = %s, updated_at = %s 
        WHERE id = %s
        """
        
        self._execute_query(
            query,
            (status, datetime.now(), video_id)
        )
        
        logger.info(f"Updated video {video_id} status to: {status}")
    
    def save_detection(self, video_id: str, detection_data: Dict) -> str:
        """Save object detection result and return detection ID"""
        query = """
        INSERT INTO detections (video_id, class_name, confidence, bbox_x, bbox_y, bbox_width, bbox_height, created_at)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        RETURNING id
        """
        
        bbox = detection_data.get("bbox", [0, 0, 0, 0])
        result = self._execute_query(
            query,
            (
                video_id,
                detection_data.get("class"),
                detection_data.get("confidence"),
                bbox[0], bbox[1], bbox[2], bbox[3],
                datetime.now()
            ),
            fetch_one=True
        )
        
        detection_id = result["id"]
        logger.info(f"Saved detection with ID: {detection_id}")
        return str(detection_id)
    
    def upload_crop_image(self, pil_image: Image.Image, detection_id: str) -> str:
        """Convert PIL image to base64 and save crop data"""
        try:
            # Convert PIL image to base64
            buffer = io.BytesIO()
            pil_image.save(buffer, format='JPEG', quality=85)
            image_data = buffer.getvalue()
            base64_data = base64.b64encode(image_data).decode('utf-8')
            
            # Save crop data to database
            query = """
            UPDATE detections 
            SET crop_image_data = %s, crop_image_url = %s, updated_at = %s
            WHERE id = %s
            """
            
            # Create a data URL for the crop
            crop_url = f"data:image/jpeg;base64,{base64_data}"
            
            self._execute_query(
                query,
                (base64_data, crop_url, datetime.now(), detection_id)
            )
            
            logger.info(f"Saved crop image for detection {detection_id}")
            return crop_url
            
        except Exception as e:
            logger.error(f"Failed to save crop image: {e}")
            return ""
    
    def save_matched_product(self, detection_id: str, product_data: Dict) -> str:
        """Save matched product and return product ID"""
        query = """
        INSERT INTO product_matches (detection_id, product_name, product_brand, similarity_score, created_at)
        VALUES (%s, %s, %s, %s, %s)
        RETURNING id
        """
        
        result = self._execute_query(
            query,
            (
                detection_id,
                product_data.get("name", "Unknown Product"),
                product_data.get("brand", "Unknown Brand"),
                product_data.get("similarity", 0.0),
                datetime.now()
            ),
            fetch_one=True
        )
        
        product_id = result["id"]
        logger.info(f"Saved product match with ID: {product_id}")
        return str(product_id)
    
    def get_video_uploads(self) -> List[Dict]:
        """Get all video uploads"""
        query = "SELECT * FROM videos ORDER BY created_at DESC"
        results = self._execute_query(query, fetch_all=True)
        return results or []
    
    def get_detected_objects(self, video_id: str) -> List[Dict]:
        """Get all detected objects for a video"""
        query = "SELECT * FROM detections WHERE video_id = %s ORDER BY confidence DESC"
        results = self._execute_query(query, (video_id,), fetch_all=True)
        return results or []
    
    def get_matched_products(self, detection_id: str) -> List[Dict]:
        """Get all matched products for a detection"""
        query = "SELECT * FROM product_matches WHERE detection_id = %s ORDER BY similarity_score DESC"
        results = self._execute_query(query, (detection_id,), fetch_all=True)
        return results or []
    
    def create_tables(self):
        """Create necessary database tables if they don't exist"""
        tables = [
            """
            CREATE TABLE IF NOT EXISTS videos (
                id SERIAL PRIMARY KEY,
                file_path TEXT NOT NULL,
                user_id TEXT DEFAULT 'system',
                status TEXT DEFAULT 'processing',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
            """,
            """
            CREATE TABLE IF NOT EXISTS detections (
                id SERIAL PRIMARY KEY,
                video_id INTEGER REFERENCES videos(id) ON DELETE CASCADE,
                class_name TEXT NOT NULL,
                confidence REAL NOT NULL,
                bbox_x REAL DEFAULT 0,
                bbox_y REAL DEFAULT 0,
                bbox_width REAL DEFAULT 0,
                bbox_height REAL DEFAULT 0,
                crop_image_data TEXT,
                crop_image_url TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
            """,
            """
            CREATE TABLE IF NOT EXISTS product_matches (
                id SERIAL PRIMARY KEY,
                detection_id INTEGER REFERENCES detections(id) ON DELETE CASCADE,
                product_name TEXT NOT NULL,
                product_brand TEXT,
                similarity_score REAL DEFAULT 0.0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
            """
        ]
        
        for table_sql in tables:
            try:
                self._execute_query(table_sql)
                logger.info("Database table created/verified")
            except Exception as e:
                logger.error(f"Failed to create table: {e}")
    
    def close(self):
        """Close database connection"""
        if self.connection and not self.connection.closed:
            self.connection.close()
            logger.info("Database connection closed")