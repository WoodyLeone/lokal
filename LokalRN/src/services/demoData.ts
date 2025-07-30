import { VideoFrontend, ProductFrontend } from '../types';

// Demo videos for testing - using real videos with actual object detection results
// Using placeholder video URLs for immediate testing - these can be replaced with backend URLs later
export const demoVideos: VideoFrontend[] = [
  {
    id: 'demo-smartwatch-video',
    userId: 'demo-user',
    title: 'Using a Smartwatch at Home',
    description: 'A person using a smartwatch while having coffee at home',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    thumbnailUrl: 'https://via.placeholder.com/300x200/6366f1/ffffff?text=Smartwatch+Demo',
    duration: 45,
    detectedObjects: ['person', 'cup'],
    products: [], // Will be populated by matchProductsByObjects
    createdAt: '2024-01-15T10:30:00Z',
    updatedAt: '2024-01-15T10:30:00Z',
  },
  {
    id: 'demo-vintage-car-video',
    userId: 'demo-user',
    title: 'Shiny Red Vintage Car',
    description: 'A beautiful red vintage car showcasing classic automotive design',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    thumbnailUrl: 'https://via.placeholder.com/300x200/ef4444/ffffff?text=Vintage+Car+Demo',
    duration: 38,
    detectedObjects: ['truck', 'car'],
    products: [], // Will be populated by matchProductsByObjects
    createdAt: '2024-01-14T15:45:00Z',
    updatedAt: '2024-01-14T15:45:00Z',
  },
  {
    id: 'demo-walking-feet-video',
    userId: 'demo-user',
    title: 'Walking in the Park',
    description: 'Close-up view of feet walking through a beautiful park',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    thumbnailUrl: 'https://via.placeholder.com/300x200/10b981/ffffff?text=Walking+Demo',
    duration: 52,
    detectedObjects: ['person'],
    products: [], // Will be populated by matchProductsByObjects
    createdAt: '2024-01-13T08:15:00Z',
    updatedAt: '2024-01-13T08:15:00Z',
  },
  {
    id: 'demo-businessman-video',
    userId: 'demo-user',
    title: 'Businessman Walking',
    description: 'A professional businessman walking with luggage and accessories',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    thumbnailUrl: 'https://via.placeholder.com/300x200/8b5cf6/ffffff?text=Business+Demo',
    duration: 67,
    detectedObjects: ['suitcase', 'person', 'handbag'],
    products: [], // Will be populated by matchProductsByObjects
    createdAt: '2024-01-12T12:00:00Z',
    updatedAt: '2024-01-12T12:00:00Z',
  }
];

// Demo products for testing - comprehensive real product list
export const demoProducts: ProductFrontend[] = [
  // Apple Products
  {
    id: 'apple-watch-9',
    title: 'Apple Watch Series 9',
    description: 'Advanced health and fitness companion with S9 chip',
    imageUrl: 'https://via.placeholder.com/300x200/6366f1/ffffff?text=Apple+Watch+Series+9',
    price: 399.00,
    currency: 'USD',
    buyUrl: 'https://www.apple.com/apple-watch-series-9/',
    category: 'electronics',
    brand: 'Apple',
    rating: 4.8,
    reviewCount: 3421,
    createdAt: '2024-01-15T10:30:00Z',
  },
  {
    id: 'iphone-15-pro',
    title: 'iPhone 15 Pro',
    description: 'Latest iPhone with A17 Pro chip and titanium design',
    imageUrl: 'https://via.placeholder.com/300x200/6366f1/ffffff?text=iPhone+15+Pro',
    price: 999.00,
    currency: 'USD',
    buyUrl: 'https://www.apple.com/iphone-15-pro/',
    category: 'electronics',
    brand: 'Apple',
    rating: 4.7,
    reviewCount: 2156,
    createdAt: '2024-01-14T15:45:00Z',
  },
  {
    id: 'macbook-pro-14',
    title: 'MacBook Pro 14"',
    description: 'Powerful laptop with M3 Pro chip for professionals',
    imageUrl: 'https://via.placeholder.com/300x200/8b5cf6/ffffff?text=MacBook+Pro+14',
    price: 1999.00,
    currency: 'USD',
    buyUrl: 'https://www.apple.com/macbook-pro-14/',
    category: 'electronics',
    brand: 'Apple',
    rating: 4.9,
    reviewCount: 892,
    createdAt: '2024-01-13T08:15:00Z',
  },
  {
    id: 'airpods-pro',
    title: 'AirPods Pro (2nd generation)',
    description: 'Active noise cancellation with spatial audio',
    imageUrl: 'https://via.placeholder.com/300x200/6366f1/ffffff?text=AirPods+Pro',
    price: 249.00,
    currency: 'USD',
    buyUrl: 'https://www.apple.com/airpods-pro/',
    category: 'electronics',
    brand: 'Apple',
    rating: 4.6,
    reviewCount: 1567,
    createdAt: '2024-01-12T12:00:00Z',
  },

  // Samsung Products
  {
    id: 'samsung-s24',
    title: 'Samsung Galaxy S24 Ultra',
    description: 'Premium smartphone with S Pen and AI features',
    imageUrl: 'https://via.placeholder.com/300x200/f59e0b/ffffff?text=Galaxy+S24+Ultra',
    price: 1299.99,
    currency: 'USD',
    buyUrl: 'https://www.samsung.com/galaxy-s24-ultra/',
    category: 'electronics',
    brand: 'Samsung',
    rating: 4.8,
    reviewCount: 1892,
    createdAt: '2024-01-11T09:30:00Z',
  },
  {
    id: 'samsung-tv-qled',
    title: 'Samsung 65" QLED 4K Smart TV',
    description: 'Quantum dot technology with HDR and gaming features',
    imageUrl: 'https://via.placeholder.com/300x200/ef4444/ffffff?text=Samsung+QLED+TV',
    price: 1499.99,
    currency: 'USD',
    buyUrl: 'https://www.samsung.com/qled-tv/',
    category: 'electronics',
    brand: 'Samsung',
    rating: 4.7,
    reviewCount: 2341,
    createdAt: '2024-01-10T14:20:00Z',
  },

  // Nike Products
  {
    id: 'nike-air-max',
    title: 'Nike Air Max 270',
    description: 'Comfortable running shoes with Air Max technology',
    imageUrl: 'https://via.placeholder.com/300x200/6366f1/ffffff?text=Nike+Air+Max+270',
    price: 150.00,
    currency: 'USD',
    buyUrl: 'https://www.nike.com/t/air-max-270-shoe',
    category: 'footwear',
    brand: 'Nike',
    rating: 4.5,
    reviewCount: 1247,
    createdAt: '2024-01-09T11:15:00Z',
  },
  {
    id: 'nike-dri-fit',
    title: 'Nike Dri-FIT Training Shirt',
    description: 'Moisture-wicking performance shirt for workouts',
    imageUrl: 'https://via.placeholder.com/300x200/10b981/ffffff?text=Nike+Dri-FIT',
    price: 45.00,
    currency: 'USD',
    buyUrl: 'https://www.nike.com/t/dri-fit-training-shirt',
    category: 'clothing',
    brand: 'Nike',
    rating: 4.3,
    reviewCount: 567,
    createdAt: '2024-01-08T16:30:00Z',
  },

  // Furniture
  {
    id: 'herman-miller-aeron',
    title: 'Herman Miller Aeron Chair',
    description: 'Ergonomic office chair for ultimate comfort',
    imageUrl: 'https://via.placeholder.com/300x200/8b5cf6/ffffff?text=Aeron+Chair',
    price: 1495.00,
    currency: 'USD',
    buyUrl: 'https://www.hermanmiller.com/products/seating/office-chairs/aeron-chairs/',
    category: 'furniture',
    brand: 'Herman Miller',
    rating: 4.9,
    reviewCount: 2341,
    createdAt: '2024-01-07T13:45:00Z',
  },
  {
    id: 'steelcase-leap',
    title: 'Steelcase Leap Chair',
    description: 'Adaptive office chair with LiveBack technology',
    imageUrl: 'https://via.placeholder.com/300x200/8b5cf6/ffffff?text=Steelcase+Leap',
    price: 1299.00,
    currency: 'USD',
    buyUrl: 'https://www.steelcase.com/products/office-chairs/leap/',
    category: 'furniture',
    brand: 'Steelcase',
    rating: 4.8,
    reviewCount: 1567,
    createdAt: '2024-01-06T10:20:00Z',
  },

  // Kitchen & Home
  {
    id: 'yeti-rambler',
    title: 'Yeti Rambler 20oz Tumbler',
    description: 'Vacuum insulated tumbler keeps drinks cold for hours',
    imageUrl: 'https://via.placeholder.com/300x200/f59e0b/ffffff?text=Yeti+Rambler',
    price: 34.99,
    currency: 'USD',
    buyUrl: 'https://www.yeti.com/en_US/rambler-20-oz-tumbler/YRAM20.html',
    category: 'kitchen',
    brand: 'Yeti',
    rating: 4.8,
    reviewCount: 3456,
    createdAt: '2024-01-05T08:30:00Z',
  },
  {
    id: 'hydro-flask',
    title: 'Hydro Flask 32oz Water Bottle',
    description: 'Temperature insulated water bottle for all-day hydration',
    imageUrl: 'https://via.placeholder.com/300x200/f59e0b/ffffff?text=Hydro+Flask',
    price: 44.95,
    currency: 'USD',
    buyUrl: 'https://www.hydroflask.com/32-oz-wide-mouth',
    category: 'kitchen',
    brand: 'Hydro Flask',
    rating: 4.7,
    reviewCount: 2891,
    createdAt: '2024-01-04T15:15:00Z',
  },

  // Gaming
  {
    id: 'ps5',
    title: 'Sony PlayStation 5',
    description: 'Next-generation gaming console with 4K graphics',
    imageUrl: 'https://via.placeholder.com/300x200/6366f1/ffffff?text=PlayStation+5',
    price: 499.99,
    currency: 'USD',
    buyUrl: 'https://www.playstation.com/en-us/ps5/',
    category: 'electronics',
    brand: 'Sony',
    rating: 4.8,
    reviewCount: 5678,
    createdAt: '2024-01-03T12:00:00Z',
  },
  {
    id: 'nintendo-switch',
    title: 'Nintendo Switch OLED',
    description: 'Handheld gaming console with 7-inch OLED screen',
    imageUrl: 'https://via.placeholder.com/300x200/ef4444/ffffff?text=Nintendo+Switch',
    price: 349.99,
    currency: 'USD',
    buyUrl: 'https://www.nintendo.com/switch/',
    category: 'electronics',
    brand: 'Nintendo',
    rating: 4.6,
    reviewCount: 3456,
    createdAt: '2024-01-02T09:45:00Z',
  },

  // Audio
  {
    id: 'sony-wh1000xm5',
    title: 'Sony WH-1000XM5 Headphones',
    description: 'Industry-leading noise cancellation with 30-hour battery',
    imageUrl: 'https://via.placeholder.com/300x200/6366f1/ffffff?text=Sony+WH-1000XM5',
    price: 399.99,
    currency: 'USD',
    buyUrl: 'https://electronics.sony.com/audio/headphones/wh-1000xm5',
    category: 'electronics',
    brand: 'Sony',
    rating: 4.8,
    reviewCount: 2341,
    createdAt: '2024-01-01T07:30:00Z',
  },

  // Automotive
  {
    id: 'tesla-model-3',
    title: 'Tesla Model 3',
    description: 'Electric sedan with autopilot and 358-mile range',
    imageUrl: 'https://via.placeholder.com/300x200/6366f1/ffffff?text=Tesla+Model+3',
    price: 38990.00,
    currency: 'USD',
    buyUrl: 'https://www.tesla.com/model3',
    category: 'automotive',
    brand: 'Tesla',
    rating: 4.8,
    reviewCount: 2156,
    createdAt: '2023-12-31T14:20:00Z',
  },

  // Fitness
  {
    id: 'peloton-bike',
    title: 'Peloton Bike+',
    description: 'Premium indoor cycling bike with rotating HD touchscreen',
    imageUrl: 'https://via.placeholder.com/300x200/ef4444/ffffff?text=Peloton+Bike',
    price: 2495.00,
    currency: 'USD',
    buyUrl: 'https://www.onepeloton.com/shop/bike',
    category: 'fitness',
    brand: 'Peloton',
    rating: 4.7,
    reviewCount: 3456,
    createdAt: '2023-12-30T11:10:00Z',
  },

  // Accessories
  {
    id: 'ray-ban-aviator',
    title: 'Ray-Ban Aviator Classic',
    description: 'Timeless aviator sunglasses with gold frame',
    imageUrl: 'https://via.placeholder.com/300x200/f59e0b/ffffff?text=Ray-Ban+Aviator',
    price: 169.00,
    currency: 'USD',
    buyUrl: 'https://www.ray-ban.com/usa/sunglasses/RB3025%20AVIATOR%20CLASSIC',
    category: 'accessories',
    brand: 'Ray-Ban',
    rating: 4.6,
    reviewCount: 2341,
    createdAt: '2023-12-29T16:40:00Z',
  },

  // Automotive & Travel
  {
    id: 'tesla-model-s',
    title: 'Tesla Model S',
    description: 'Luxury electric sedan with autopilot and 396-mile range',
    imageUrl: 'https://via.placeholder.com/300x200/6366f1/ffffff?text=Tesla+Model+S',
    price: 89990.00,
    currency: 'USD',
    buyUrl: 'https://www.tesla.com/models',
    category: 'automotive',
    brand: 'Tesla',
    rating: 4.9,
    reviewCount: 1892,
    createdAt: '2023-12-28T10:15:00Z',
  },
  {
    id: 'bmw-x5',
    title: 'BMW X5 xDrive40i',
    description: 'Luxury SUV with premium interior and advanced technology',
    imageUrl: 'https://via.placeholder.com/300x200/6366f1/ffffff?text=BMW+X5',
    price: 65900.00,
    currency: 'USD',
    buyUrl: 'https://www.bmwusa.com/vehicles/x-models/x5/overview.html',
    category: 'automotive',
    brand: 'BMW',
    rating: 4.7,
    reviewCount: 1247,
    createdAt: '2023-12-27T14:30:00Z',
  },
  {
    id: 'samsonite-luggage',
    title: 'Samsonite Omni PC Hardside Luggage',
    description: 'Durable hardside luggage with spinner wheels',
    imageUrl: 'https://via.placeholder.com/300x200/8b5cf6/ffffff?text=Samsonite+Luggage',
    price: 129.99,
    currency: 'USD',
    buyUrl: 'https://www.samsonite.com/omni-pc-hardside-luggage',
    category: 'travel',
    brand: 'Samsonite',
    rating: 4.5,
    reviewCount: 3456,
    createdAt: '2023-12-26T09:45:00Z',
  },
  {
    id: 'tumi-backpack',
    title: 'TUMI Alpha Bravo Backpack',
    description: 'Premium business backpack with laptop compartment',
    imageUrl: 'https://via.placeholder.com/300x200/8b5cf6/ffffff?text=TUMI+Backpack',
    price: 295.00,
    currency: 'USD',
    buyUrl: 'https://www.tumi.com/alpha-bravo-backpack',
    category: 'travel',
    brand: 'TUMI',
    rating: 4.8,
    reviewCount: 892,
    createdAt: '2023-12-25T16:20:00Z',
  },
  {
    id: 'starbucks-tumbler',
    title: 'Starbucks Stainless Steel Tumbler',
    description: 'Insulated tumbler keeps drinks hot or cold for hours',
    imageUrl: 'https://via.placeholder.com/300x200/f59e0b/ffffff?text=Starbucks+Tumbler',
    price: 24.95,
    currency: 'USD',
    buyUrl: 'https://www.starbucks.com/store/product/123456/stainless-steel-tumbler',
    category: 'kitchen',
    brand: 'Starbucks',
    rating: 4.4,
    reviewCount: 2156,
    createdAt: '2023-12-24T11:10:00Z',
  },
  {
    id: 'nike-running-shoes',
    title: 'Nike Air Zoom Pegasus 40',
    description: 'Comfortable running shoes with responsive cushioning',
    imageUrl: 'https://via.placeholder.com/300x200/10b981/ffffff?text=Nike+Pegasus+40',
    price: 129.99,
    currency: 'USD',
    buyUrl: 'https://www.nike.com/t/air-zoom-pegasus-40-road-running-shoes',
    category: 'footwear',
    brand: 'Nike',
    rating: 4.6,
    reviewCount: 1892,
    createdAt: '2023-12-23T13:25:00Z',
  }
];

export class DemoDataService {
  // Get all demo videos with matched products
  static getVideos(): VideoFrontend[] {
    return demoVideos.map(video => ({
      ...video,
      products: this.matchProductsByObjects(video.detectedObjects)
    }));
  }

  // Get demo video by ID
  static getVideoById(id: string): VideoFrontend | undefined {
    return demoVideos.find(video => video.id === id);
  }

  // Get all demo products
  static getProducts(): ProductFrontend[] {
    return demoProducts;
  }

  // Get demo product by ID
  static getProductById(id: string): ProductFrontend | undefined {
    return demoProducts.find(product => product.id === id);
  }

  // Get products by category
  static getProductsByCategory(category: string): ProductFrontend[] {
    return demoProducts.filter(product => 
      product.category.toLowerCase() === category.toLowerCase()
    );
  }

  // Search products
  static searchProducts(query: string): ProductFrontend[] {
    const searchTerm = query.toLowerCase();
    return demoProducts.filter(product => 
      product.title.toLowerCase().includes(searchTerm) ||
      product.description.toLowerCase().includes(searchTerm) ||
      (product.brand?.toLowerCase() || '').includes(searchTerm)
    );
  }

  // Match products by objects (improved matching with scoring)
  static matchProductsByObjects(objects: string[]): ProductFrontend[] {
    const objectKeywords = objects.map(obj => obj.toLowerCase());
    const productScores: Array<{product: ProductFrontend, score: number, matchedObjects: string[]}> = [];

    // Enhanced object-to-product mapping
    const objectProductMap: { [key: string]: string[] } = {
      'person': ['apple-watch-9', 'ray-ban-aviator', 'nike-dri-fit', 'nike-air-max'],
      'shirt': ['nike-dri-fit', 'ray-ban-aviator'],
      'pants': ['nike-dri-fit', 'nike-air-max'],
      'sneakers': ['nike-air-max', 'nike-running-shoes'],
      'hat': ['ray-ban-aviator'],
      'watch': ['apple-watch-9'],
      'glasses': ['ray-ban-aviator'],
      'cup': ['yeti-rambler', 'hydro-flask', 'starbucks-tumbler'],
      'bottle': ['hydro-flask', 'yeti-rambler'],
      'laptop': ['macbook-pro-14', 'iphone-15-pro'],
      'cell phone': ['iphone-15-pro', 'samsung-s24'],
      'tv': ['samsung-tv-qled'],
      'chair': ['herman-miller-aeron', 'steelcase-leap'],
      'table': ['herman-miller-aeron', 'steelcase-leap'],
      'couch': ['herman-miller-aeron', 'steelcase-leap'],
      'car': ['tesla-model-3', 'tesla-model-s', 'bmw-x5'],
      'truck': ['tesla-model-3', 'tesla-model-s', 'bmw-x5'],
      'suitcase': ['samsonite-luggage', 'tumi-backpack'],
      'handbag': ['tumi-backpack', 'samsonite-luggage'],
      'headphones': ['sony-wh1000xm5', 'airpods-pro'],
      'keyboard': ['macbook-pro-14'],
      'mouse': ['macbook-pro-14'],
      'monitor': ['samsung-tv-qled'],
      'tree': ['ray-ban-aviator'],
      'building': ['ray-ban-aviator'],
      'sky': ['ray-ban-aviator'],
      'road': ['nike-air-max', 'nike-running-shoes'],
      'ball': ['nike-air-max', 'nike-running-shoes'],
      'floor': ['nike-air-max', 'nike-running-shoes'],
      'dog': ['ray-ban-aviator'],
      'cat': ['ray-ban-aviator']
    };

    // Direct product matches (highest priority)
    const directMatches: ProductFrontend[] = [];
    for (const object of objectKeywords) {
      if (objectProductMap[object]) {
        for (const productId of objectProductMap[object]) {
          const product = demoProducts.find(p => p.id === productId);
          if (product && !directMatches.find(p => p.id === product.id)) {
            directMatches.push(product);
          }
        }
      }
    }

    // If we have direct matches, return them (prioritized)
    if (directMatches.length > 0) {
      return directMatches.slice(0, 4);
    }

    // Fallback to keyword matching for other products
    for (const product of demoProducts) {
      const productKeywords = [
        product.title.toLowerCase(),
        product.description.toLowerCase(),
        product.brand?.toLowerCase() || '',
        product.category.toLowerCase(),
      ];

      let score = 0;
      let matchedObjects: string[] = [];

      // Check for exact matches
      for (const object of objectKeywords) {
        for (const keyword of productKeywords) {
          if (keyword === object) {
            score += 10;
            matchedObjects.push(object);
            break;
          }
        }
      }

      // Check for partial matches
      for (const object of objectKeywords) {
        for (const keyword of productKeywords) {
          if (keyword.includes(object) || object.includes(keyword)) {
            if (!matchedObjects.includes(object)) {
              score += 5;
              matchedObjects.push(object);
            }
          }
        }
      }

      if (score > 0) {
        productScores.push({
          product,
          score,
          matchedObjects
        });
      }
    }

    // Sort by score and return top matches
    const sortedMatches = productScores
      .sort((a, b) => b.score - a.score)
      .slice(0, 4)
      .map(item => item.product);

    // If still no matches, return context-appropriate products
    if (sortedMatches.length === 0) {
      const categoryMap: { [key: string]: string[] } = {
        'person': ['clothing', 'accessories', 'footwear'],
        'outdoor': ['accessories', 'footwear'],
        'indoor': ['furniture', 'electronics'],
        'tech': ['electronics'],
        'fashion': ['clothing', 'accessories'],
        'kitchen': ['kitchen'],
        'sports': ['footwear', 'clothing'],
        'pets': ['accessories']
      };

      // Determine context from objects
      let context = 'person';
      if (objectKeywords.some(obj => ['car', 'truck', 'tree', 'building', 'sky', 'road'].includes(obj))) {
        context = 'outdoor';
      } else if (objectKeywords.some(obj => ['laptop', 'tv', 'keyboard', 'mouse', 'monitor'].includes(obj))) {
        context = 'tech';
      } else if (objectKeywords.some(obj => ['shirt', 'pants', 'sneakers', 'hat'].includes(obj))) {
        context = 'fashion';
      } else if (objectKeywords.some(obj => ['cup', 'bottle'].includes(obj))) {
        context = 'kitchen';
      } else if (objectKeywords.some(obj => ['ball', 'floor'].includes(obj))) {
        context = 'sports';
      }

      const relevantCategories = categoryMap[context] || categoryMap.person;
      const categoryProducts = demoProducts.filter(product => 
        relevantCategories.includes(product.category)
      );

      if (categoryProducts.length > 0) {
        return categoryProducts
          .sort((a, b) => (b.rating || 0) - (a.rating || 0))
          .slice(0, 3);
      }
    }

    return sortedMatches;
  }

  // Generate demo video with matched products
  static generateDemoVideo(title: string, description: string, detectedObjects: string[]): VideoFrontend {
    const matchedProducts = this.matchProductsByObjects(detectedObjects);
    
    return {
      id: `demo-${Date.now()}`,
      userId: 'demo-user',
      title,
      description,
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      thumbnailUrl: 'https://via.placeholder.com/300x200/6366f1/ffffff?text=Demo+Video',
      duration: 120,
      detectedObjects,
      products: matchedProducts,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }
} 