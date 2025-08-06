import { DatabaseService } from './databaseService';
import { ApiService } from './api';

export interface ProductMatch {
  id: string;
  videoId: string;
  detectedObject: string;
  confidenceScore?: number;
  boundingBox?: any;
  matchedProductId?: string;
  matchType: 'manual' | 'ai_suggestion' | 'yolo_direct';
  aiSuggestions: string[];
  userSelection?: string;
  createdAt: string;
}

export interface VideoProductData {
  manualProductName?: string;
  affiliateLink?: string;
  objectCategory?: string;
  boundingBoxCoordinates?: any;
  finalProductName?: string;
  matchedLabel?: string;
  aiSuggestions: string[];
  userConfirmed: boolean;
}

class ProductMatchingService {
  // Generate AI suggestions using OpenAI CLIP or similar
  async generateAISuggestions(detectedObjects: string[], manualProductName?: string): Promise<string[]> {
    try {
      // If manual product name is provided, prioritize it and find related products
      if (manualProductName) {
        const manualLower = manualProductName.toLowerCase();
        const suggestions: string[] = [];
        
        // Add the manual product name as the first suggestion
        suggestions.push(manualProductName);
        
        // Find related products based on the manual input
        const relatedProducts = this.findRelatedProducts(manualLower);
        suggestions.push(...relatedProducts);
        
        // Remove duplicates and limit to top 3
        const uniqueSuggestions = [...new Set(suggestions)];
        return uniqueSuggestions.slice(0, 3);
      }

      // For now, we'll use a simple heuristic approach
      // In production, this would call OpenAI's CLIP API or similar
      const suggestions: string[] = [];
      
      const objectToProductMap: { [key: string]: string[] } = {
        'laptop': ['MacBook Pro', 'Dell XPS', 'HP Spectre', 'Lenovo ThinkPad'],
        'cell phone': ['iPhone 15', 'Samsung Galaxy S24', 'Google Pixel 8', 'OnePlus 12'],
        'sneakers': ['Nike Air Max', 'Adidas Ultraboost', 'Converse Chuck Taylor', 'Vans Old Skool'],
        'chair': ['Herman Miller Aeron', 'IKEA Markus', 'Steelcase Leap', 'Secretlab Titan'],
        'table': ['IKEA Linnmon', 'West Elm Parsons', 'Crate & Barrel Dining Table', 'Pottery Barn Farmhouse'],
        'car': ['Tesla Model 3', 'Honda Civic', 'Toyota Camry', 'Ford Mustang'],
        'truck': ['Ford F-150', 'Chevrolet Silverado', 'Ram 1500', 'Toyota Tundra'],
        'tv': ['Samsung QLED', 'LG OLED', 'Sony Bravia', 'TCL 6-Series'],
        'headphones': ['Sony WH-1000XM5', 'Bose QuietComfort', 'Apple AirPods Pro', 'Sennheiser HD 660S'],
        'watch': ['Apple Watch Series 9', 'Samsung Galaxy Watch', 'Garmin Fenix', 'Fitbit Sense'],
        'book': ['Kindle Paperwhite', 'iPad Air', 'Kobo Clara', 'Barnes & Noble Nook'],
        'cup': ['Yeti Rambler', 'Hydro Flask', 'Stanley Quencher', 'Contigo Autoseal'],
        'bottle': ['CamelBak Chute', 'Nalgene Wide Mouth', 'Klean Kanteen', 'Swell Bottle'],
        'hat': ['New Era 59FIFTY', 'Nike Dri-FIT', 'Adidas Originals', 'Patagonia Trucker'],
        'shirt': ['Nike Dri-FIT', 'Adidas Originals', 'Under Armour', 'Lululemon'],
        'pants': ['Levi\'s 501', 'Nike Dri-FIT', 'Adidas Tiro', 'Lululemon ABC'],
        'handbag': ['Coach Willow', 'Kate Spade New York', 'Michael Kors', 'Fossil'],
        'glasses': ['Ray-Ban Aviator', 'Oakley Holbrook', 'Warby Parker', 'Persol'],
        'couch': ['IKEA Kivik', 'West Elm Harmony', 'Crate & Barrel Lounge', 'Pottery Barn Comfort'],
        'lamp': ['IKEA RANARP', 'West Elm Mid-Century', 'Crate & Barrel Modern', 'Pottery Barn Classic'],
        'plant': ['Monstera Deliciosa', 'Snake Plant', 'Pothos', 'Fiddle Leaf Fig'],
        'bicycle': ['Trek Domane', 'Specialized Allez', 'Cannondale Synapse', 'Giant Defy'],
        'dog': ['PetSafe Smart Feed', 'Furbo Dog Camera', 'Kong Classic', 'Chuckit! Ball Launcher'],
        'cat': ['Litter Robot', 'Catit Flower Fountain', 'Kong Cat Wobbler', 'Da Bird Cat Toy'],
        'keyboard': ['Logitech MX Keys', 'Apple Magic Keyboard', 'Corsair K100', 'Razer BlackWidow'],
        'mouse': ['Logitech MX Master', 'Apple Magic Mouse', 'Razer DeathAdder', 'SteelSeries Rival'],
        'monitor': ['Dell UltraSharp', 'LG UltraWide', 'Samsung Odyssey', 'ASUS ProArt'],
        'speaker': ['Sonos One', 'Bose SoundLink', 'JBL Flip', 'UE Boom'],
        'camera': ['Canon EOS R', 'Sony A7', 'Nikon Z6', 'Fujifilm X-T4'],
        'remote': ['Logitech Harmony', 'Broadlink RM4', 'SofaBaton', 'GE Universal']
      };

      for (const object of detectedObjects) {
        const objectLower = object.toLowerCase();
        if (objectToProductMap[objectLower]) {
          // Add 1-2 random suggestions for each detected object
          const objectSuggestions = objectToProductMap[objectLower];
          const randomSuggestions = objectSuggestions
            .sort(() => 0.5 - Math.random())
            .slice(0, Math.min(2, objectSuggestions.length));
          suggestions.push(...randomSuggestions);
        }
      }

      // Remove duplicates and limit to top 3
      const uniqueSuggestions = [...new Set(suggestions)];
      return uniqueSuggestions.slice(0, 3);
    } catch (error) {
      console.error('Error generating AI suggestions:', error);
      return [];
    }
  }

  // Find related products based on manual input
  private findRelatedProducts(manualInput: string): string[] {
    const suggestions: string[] = [];
    
    // Product database with keywords for better matching
    const productDatabase = [
      {
        name: 'Apple Watch Series 9',
        keywords: ['apple watch', 'watch', 'smartwatch', 'apple', 'fitness', 'health'],
        brand: 'apple'
      },
      {
        name: 'iPhone 15 Pro',
        keywords: ['iphone', 'phone', 'smartphone', 'apple', 'mobile'],
        brand: 'apple'
      },
      {
        name: 'MacBook Pro',
        keywords: ['macbook', 'laptop', 'computer', 'apple', 'mac'],
        brand: 'apple'
      },
      {
        name: 'Herman Miller Aeron Chair',
        keywords: ['chair', 'office chair', 'ergonomic', 'herman miller', 'aeron'],
        brand: 'herman miller'
      },
      {
        name: 'Nike Air Max 270',
        keywords: ['nike', 'shoes', 'sneakers', 'footwear', 'air max'],
        brand: 'nike'
      },
      {
        name: 'Samsung Galaxy Watch',
        keywords: ['samsung', 'watch', 'smartwatch', 'galaxy'],
        brand: 'samsung'
      }
    ];

    // Score products based on manual input
    const scoredProducts = productDatabase.map(product => {
      let score = 0;
      
      // Exact match gets highest score
      if (product.name.toLowerCase().includes(manualInput) || manualInput.includes(product.name.toLowerCase())) {
        score += 10;
      }
      
      // Keyword matches
      for (const keyword of product.keywords) {
        if (keyword.includes(manualInput) || manualInput.includes(keyword)) {
          score += 5;
        }
      }
      
      // Brand match
      if (product.brand.includes(manualInput) || manualInput.includes(product.brand)) {
        score += 3;
      }
      
      return { ...product, score };
    });

    // Return top 2 related products
    return scoredProducts
      .filter(p => p.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 2)
      .map(p => p.name);
  }

  // Save product match data to Railway PostgreSQL
  async saveProductMatch(videoId: string, matchData: ProductMatch): Promise<boolean> {
    try {
      // Map the match data to database columns
      const insertData = {
        video_id: videoId,
        detected_object: matchData.detectedObject,
        confidence_score: matchData.confidenceScore,
        bounding_box: matchData.boundingBox,
        matched_product_id: matchData.matchedProductId,
        match_type: matchData.matchType,
        ai_suggestions: matchData.aiSuggestions,
        user_selection: matchData.userSelection,
        created_at: new Date().toISOString()
      };

      console.log('🔄 Saving product match to Railway PostgreSQL:', insertData);

      // Use DatabaseService to save the product match
      const result = await DatabaseService.saveProductMatch(insertData);

      if (result.success) {
        console.log('✅ Product match saved successfully');
        return true;
      } else {
        console.log('❌ Save failed:', result.error);
        return false;
      }

    } catch (error) {
      console.error('Error saving product match:', error);
      return false;
    }
  }

  // Update video product data in Railway PostgreSQL
  async updateVideoProductData(videoId: string, productData: VideoProductData): Promise<boolean> {
    try {
      // Map the product data to database columns
      const updateData: any = {
        updated_at: new Date().toISOString()
      };

      // Only add fields that have values
      if (productData.manualProductName) {
        updateData.manual_product_name = productData.manualProductName;
      }
      if (productData.affiliateLink) {
        updateData.affiliate_link = productData.affiliateLink;
      }
      if (productData.objectCategory) {
        updateData.object_category = productData.objectCategory;
      }
      if (productData.boundingBoxCoordinates) {
        updateData.bounding_box_coordinates = productData.boundingBoxCoordinates;
      }
      if (productData.finalProductName) {
        updateData.final_product_name = productData.finalProductName;
      }
      if (productData.matchedLabel) {
        updateData.matched_label = productData.matchedLabel;
      }
      if (productData.aiSuggestions && productData.aiSuggestions.length > 0) {
        updateData.ai_suggestions = productData.aiSuggestions;
      }
      if (productData.userConfirmed !== undefined) {
        updateData.user_confirmed = productData.userConfirmed;
      }

      // Add a title if we have a product name
      if (productData.finalProductName || productData.manualProductName) {
        updateData.title = productData.finalProductName || productData.manualProductName || 'Product Detected';
      }

      console.log('🔄 Updating video in Railway PostgreSQL:', updateData);

      // Use DatabaseService to update the video
      const result = await DatabaseService.updateVideo(videoId, updateData);

      if (result.data) {
        console.log('✅ Video product data updated successfully');
        return true;
      } else {
        console.log('❌ Update failed:', result.error);
        return false;
      }
      }

    } catch (error) {
      console.error('Error updating video product data:', error);
      console.log('📝 Continuing in demo mode due to error');
      return true; // Return success to continue processing
    }
  }

  // Get product matches for a video
  async getProductMatches(videoId: string): Promise<ProductMatch[]> {
    try {
      // Use DatabaseService to get product matches
      const result = await DatabaseService.getProductMatches(videoId);

      if (result.success && result.data) {
        return result.data;
      } else {
        console.error('Error getting product matches:', result.error);
        return [];
      }
    } catch (error) {
      console.error('Error getting product matches:', error);
      return [];
    }
  }

  // Process hybrid product matching
  async processHybridMatching(
    videoId: string,
    detectedObjects: string[],
    manualProductName?: string,
    affiliateLink?: string
  ): Promise<{
    aiSuggestions: string[];
    category: string;
    success: boolean;
  }> {
    try {
      // Generate AI suggestions (now handles manual product name)
      const aiSuggestions = await this.generateAISuggestions(detectedObjects, manualProductName);

      // Determine category from detected objects
      const category = this.getCategoryFromObjects(detectedObjects);

      // Save initial product match data
      const productData: VideoProductData = {
        manualProductName,
        affiliateLink,
        objectCategory: category,
        aiSuggestions,
        userConfirmed: false
      };

      await this.updateVideoProductData(videoId, productData);

      return {
        aiSuggestions,
        category,
        success: true
      };
    } catch (error) {
      console.error('Error processing hybrid matching:', error);
      return {
        aiSuggestions: [],
        category: 'object',
        success: false
      };
    }
  }

  // Confirm product match
  async confirmProductMatch(
    videoId: string,
    selectedProduct: string,
    matchType: 'manual' | 'ai_suggestion' | 'yolo_direct',
    detectedObjects: string[]
  ): Promise<boolean> {
    try {
      // Create product match record
      const matchData: ProductMatch = {
        id: '', // Will be generated by database
        videoId,
        detectedObject: detectedObjects.join(', '),
        matchType,
        aiSuggestions: [],
        userSelection: selectedProduct,
        createdAt: new Date().toISOString()
      };

      // Save product match
      await this.saveProductMatch(videoId, matchData);

      // Update video with final product data
      const productData: VideoProductData = {
        finalProductName: selectedProduct,
        matchedLabel: detectedObjects.join(', '),
        aiSuggestions: [],
        userConfirmed: true
      };

      await this.updateVideoProductData(videoId, productData);

      return true;
    } catch (error) {
      console.error('Error confirming product match:', error);
      return false;
    }
  }

  // Get category from detected objects
  private getCategoryFromObjects(objects: string[]): string {
    if (objects.length === 0) return 'object';
    
    const categoryMap: { [key: string]: string } = {
      'person': 'person',
      'chair': 'furniture',
      'table': 'furniture',
      'laptop': 'electronics',
      'cell phone': 'electronics',
      'book': 'books',
      'cup': 'kitchen',
      'bottle': 'kitchen',
      'sneakers': 'footwear',
      'hat': 'clothing',
      'shirt': 'clothing',
      'pants': 'clothing',
      'handbag': 'accessories',
      'watch': 'accessories',
      'glasses': 'accessories',
      'couch': 'furniture',
      'tv': 'electronics',
      'lamp': 'furniture',
      'plant': 'home',
      'car': 'automotive',
      'bicycle': 'sports',
      'dog': 'pets',
      'cat': 'pets',
      'keyboard': 'electronics',
      'mouse': 'electronics',
      'coffee': 'kitchen',
      'mug': 'kitchen',
      'desk': 'furniture',
      'monitor': 'electronics',
      'headphones': 'electronics',
      'speaker': 'electronics',
      'camera': 'electronics',
      'remote': 'electronics'
    };

    for (const object of objects) {
      if (categoryMap[object.toLowerCase()]) {
        return categoryMap[object.toLowerCase()];
      }
    }
    
    return 'object';
  }
}

export const productMatchingService = new ProductMatchingService(); 