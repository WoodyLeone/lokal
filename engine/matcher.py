"""
Matcher for Lokal Engine
Sends crops to OpenAI and returns product matches
"""

import os
import base64
import io
from typing import List, Dict, Optional
from openai import OpenAI
from PIL import Image
import numpy as np
from dotenv import load_dotenv

load_dotenv()

class ProductMatcher:
    def __init__(self, api_key: Optional[str] = None):
        """
        Initialize product matcher
        
        Args:
            api_key: OpenAI API key (will use env var if not provided)
        """
        self.api_key = api_key or os.getenv("OPENAI_API_KEY")
        
        if not self.api_key:
            raise ValueError("OpenAI API key is required")
        
        self.client = OpenAI(api_key=self.api_key)
        
        # Product categories for better matching
        self.product_categories = [
            "clothing", "shoes", "accessories", "electronics", "home", "beauty",
            "sports", "jewelry", "bags", "watches", "furniture", "kitchen"
        ]
    
    def image_to_base64(self, image: Image.Image) -> str:
        """
        Convert PIL Image to base64 string
        
        Args:
            image: PIL Image
            
        Returns:
            Base64 encoded string
        """
        buffer = io.BytesIO()
        image.save(buffer, format='PNG')
        img_str = base64.b64encode(buffer.getvalue()).decode()
        return img_str
    
    def match_product(self, image: Image.Image, context: str = "") -> Dict:
        """
        Match product in image using OpenAI GPT-4 Vision
        
        Args:
            image: PIL Image of the product
            context: Additional context about the image
            
        Returns:
            Dictionary with match results
        """
        try:
            # Convert image to base64
            base64_image = self.image_to_base64(image)
            
            # Prepare prompt
            prompt = self._create_matching_prompt(context)
            
            # Call OpenAI API
            response = self.client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {
                        "role": "system",
                        "content": "You are a product identification expert. Analyze the image and provide detailed product information."
                    },
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "text",
                                "text": prompt
                            },
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:image/png;base64,{base64_image}"
                                }
                            }
                        ]
                    }
                ],
                max_tokens=500,
                temperature=0.1
            )
            
            # Parse response
            result = self._parse_matching_response(response.choices[0].message.content)
            
            return result
            
        except Exception as e:
            print(f"Error matching product: {e}")
            return {
                "success": False,
                "error": str(e),
                "product_name": "Unknown",
                "category": "unknown",
                "confidence": 0.0,
                "description": "",
                "suggested_queries": []
            }
    
    def _create_matching_prompt(self, context: str) -> str:
        """
        Create prompt for product matching
        
        Args:
            context: Additional context
            
        Returns:
            Formatted prompt
        """
        prompt = f"""
        Analyze this product image and provide the following information in JSON format:
        
        {{
            "product_name": "Specific product name (e.g., 'Nike Air Max 90', 'iPhone 15 Pro')",
            "category": "Product category from: {', '.join(self.product_categories)}",
            "confidence": "Confidence score 0.0-1.0",
            "description": "Brief description of the product",
            "brand": "Brand name if identifiable",
            "color": "Primary color if visible",
            "suggested_queries": ["List of search terms for finding this product online"]
        }}
        
        Additional context: {context}
        
        Be specific and accurate. If you're not confident about the product, use a lower confidence score.
        """
        
        return prompt
    
    def _parse_matching_response(self, response: str) -> Dict:
        """
        Parse OpenAI response into structured format
        
        Args:
            response: Raw response from OpenAI
            
        Returns:
            Parsed result dictionary
        """
        try:
            # Try to extract JSON from response
            import json
            import re
            
            # Find JSON in response
            json_match = re.search(r'\{.*\}', response, re.DOTALL)
            if json_match:
                json_str = json_match.group()
                result = json.loads(json_str)
                
                # Ensure required fields
                result.setdefault("success", True)
                result.setdefault("product_name", "Unknown")
                result.setdefault("category", "unknown")
                result.setdefault("confidence", 0.0)
                result.setdefault("description", "")
                result.setdefault("brand", "")
                result.setdefault("color", "")
                result.setdefault("suggested_queries", [])
                
                return result
            else:
                # Fallback parsing
                return self._fallback_parsing(response)
                
        except Exception as e:
            print(f"Error parsing response: {e}")
            return self._fallback_parsing(response)
    
    def _fallback_parsing(self, response: str) -> Dict:
        """
        Fallback parsing when JSON extraction fails
        
        Args:
            response: Raw response
            
        Returns:
            Parsed result dictionary
        """
        # Simple keyword extraction
        response_lower = response.lower()
        
        # Extract product name (look for common patterns)
        product_name = "Unknown"
        if "nike" in response_lower:
            product_name = "Nike Product"
        elif "adidas" in response_lower:
            product_name = "Adidas Product"
        elif "iphone" in response_lower:
            product_name = "iPhone"
        elif "samsung" in response_lower:
            product_name = "Samsung Product"
        
        # Extract category
        category = "unknown"
        for cat in self.product_categories:
            if cat in response_lower:
                category = cat
                break
        
        return {
            "success": True,
            "product_name": product_name,
            "category": category,
            "confidence": 0.5,
            "description": response[:200] + "..." if len(response) > 200 else response,
            "brand": "",
            "color": "",
            "suggested_queries": [product_name, category]
        }
    
    def batch_match_products(self, images: List[Image.Image], 
                           contexts: Optional[List[str]] = None) -> List[Dict]:
        """
        Match multiple products in batch
        
        Args:
            images: List of PIL Images
            contexts: Optional list of context strings
            
        Returns:
            List of match results
        """
        if contexts is None:
            contexts = [""] * len(images)
        
        results = []
        
        for i, (image, context) in enumerate(zip(images, contexts)):
            print(f"Matching product {i+1}/{len(images)}...")
            result = self.match_product(image, context)
            results.append(result)
        
        return results
    
    def get_affiliate_suggestions(self, product_info: Dict) -> List[str]:
        """
        Generate affiliate link suggestions based on product info
        
        Args:
            product_info: Product information dictionary
            
        Returns:
            List of suggested affiliate platforms
        """
        suggestions = []
        
        category = product_info.get("category", "").lower()
        brand = product_info.get("brand", "").lower()
        
        # Category-based suggestions
        if category in ["clothing", "shoes", "accessories"]:
            suggestions.extend(["Amazon", "Zara", "H&M", "Nike", "Adidas"])
        elif category in ["electronics"]:
            suggestions.extend(["Amazon", "Best Buy", "Apple Store", "Samsung"])
        elif category in ["beauty"]:
            suggestions.extend(["Sephora", "Ulta", "Amazon"])
        elif category in ["home", "furniture"]:
            suggestions.extend(["IKEA", "Amazon", "Wayfair"])
        
        # Brand-based suggestions
        if "nike" in brand:
            suggestions.append("Nike Store")
        elif "adidas" in brand:
            suggestions.append("Adidas Store")
        elif "apple" in brand:
            suggestions.append("Apple Store")
        
        # Remove duplicates and return
        return list(set(suggestions)) 