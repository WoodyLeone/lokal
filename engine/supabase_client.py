"""
Supabase client for Lokal Engine
Handles database operations and file storage
"""

import os
import uuid
from typing import Dict, List, Optional, Tuple
from supabase import create_client, Client
from dotenv import load_dotenv
import base64
from PIL import Image
import io

load_dotenv()

class SupabaseClient:
    def __init__(self):
        self.url = os.getenv("SUPABASE_URL")
        self.key = os.getenv("SUPABASE_KEY")
        
        if not self.url or not self.key:
            raise ValueError("SUPABASE_URL and SUPABASE_KEY must be set in environment")
        
        self.client: Client = create_client(self.url, self.key)
        
    def save_video_record(self, video_path: str, user_id: str) -> str:
        """Save video upload record to database"""
        try:
            response = self.client.table("video_uploads").insert({
                "user_id": user_id,
                "video_path": video_path,
                "status": "processing"
            }).execute()
            
            return response.data[0]['id']
        except Exception as e:
            print(f"Error saving video record: {e}")
            raise
    
    def save_detection(self, video_id: str, label: str, bbox: Tuple[int, int, int, int], 
                      crop_path: Optional[str] = None) -> str:
        """Save detected object to database"""
        try:
            response = self.client.table("detected_objects").insert({
                "video_id": video_id,
                "label": label,
                "bbox": {
                    "x1": bbox[0],
                    "y1": bbox[1], 
                    "x2": bbox[2],
                    "y2": bbox[3]
                },
                "crop_path": crop_path
            }).execute()
            
            return response.data[0]['id']
        except Exception as e:
            print(f"Error saving detection: {e}")
            raise
    
    def save_matched_product(self, object_id: str, label: str, 
                           match_type: str = "auto", affiliate_link: Optional[str] = None) -> str:
        """Save matched product to database"""
        try:
            response = self.client.table("matched_products").insert({
                "object_id": object_id,
                "match_type": match_type,
                "label": label,
                "affiliate_link": affiliate_link
            }).execute()
            
            return response.data[0]['id']
        except Exception as e:
            print(f"Error saving matched product: {e}")
            raise
    
    def upload_crop_image(self, image: Image.Image, object_id: str) -> str:
        """Upload cropped image to Supabase storage"""
        try:
            # Convert PIL image to bytes
            img_byte_arr = io.BytesIO()
            image.save(img_byte_arr, format='PNG')
            img_byte_arr = img_byte_arr.getvalue()
            
            # Generate unique filename
            filename = f"crops/{object_id}/{uuid.uuid4()}.png"
            
            # Upload to storage
            self.client.storage.from_("lokal-storage").upload(
                path=filename,
                file=img_byte_arr,
                file_options={"content-type": "image/png"}
            )
            
            # Get public URL
            url = self.client.storage.from_("lokal-storage").get_public_url(filename)
            return url
            
        except Exception as e:
            print(f"Error uploading crop image: {e}")
            raise
    
    def update_video_status(self, video_id: str, status: str):
        """Update video processing status"""
        try:
            self.client.table("video_uploads").update({
                "status": status
            }).eq("id", video_id).execute()
        except Exception as e:
            print(f"Error updating video status: {e}")
            raise
    
    def get_video_uploads(self, user_id: Optional[str] = None) -> List[Dict]:
        """Get video uploads, optionally filtered by user"""
        try:
            query = self.client.table("video_uploads").select("*")
            if user_id:
                query = query.eq("user_id", user_id)
            
            response = query.execute()
            return response.data
        except Exception as e:
            print(f"Error getting video uploads: {e}")
            raise
    
    def get_detected_objects(self, video_id: str) -> List[Dict]:
        """Get detected objects for a video"""
        try:
            response = self.client.table("detected_objects").select("*").eq("video_id", video_id).execute()
            return response.data
        except Exception as e:
            print(f"Error getting detected objects: {e}")
            raise
    
    def get_matched_products(self, object_id: Optional[str] = None) -> List[Dict]:
        """Get matched products, optionally filtered by object"""
        try:
            query = self.client.table("matched_products").select("*")
            if object_id:
                query = query.eq("object_id", object_id)
            
            response = query.execute()
            return response.data
        except Exception as e:
            print(f"Error getting matched products: {e}")
            raise 