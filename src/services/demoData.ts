import { VideoFrontend, ProductFrontend } from '../types';

// Enhanced demo products for shoppable videos
export const demoProducts: ProductFrontend[] = [
  // Fashion & Lifestyle
  {
    id: 'nike-air-max-270',
    title: 'Nike Air Max 270',
    description: 'Comfortable running shoes with Air Max technology',
    imageUrl: 'https://via.placeholder.com/300x200/6366f1/ffffff?text=Nike+Air+Max+270',
    price: 129.99,
    currency: 'USD',
    buyUrl: 'https://www.nike.com/t/air-max-270-mens-shoe-KkLcGR',
    category: 'footwear',
    brand: 'Nike',
    rating: 4.7,
    reviewCount: 2341,
    createdAt: '2024-01-15T10:30:00Z',
  },
  {
    id: 'adidas-ultraboost',
    title: 'Adidas Ultraboost 22',
    description: 'Premium running shoes with Boost midsole technology',
    imageUrl: 'https://via.placeholder.com/300x200/ef4444/ffffff?text=Adidas+Ultraboost',
    price: 179.99,
    currency: 'USD',
    buyUrl: 'https://www.adidas.com/us/ultraboost-22-shoes/GZ0127.html',
    category: 'footwear',
    brand: 'Adidas',
    rating: 4.8,
    reviewCount: 1892,
    createdAt: '2024-01-14T14:20:00Z',
  },
  {
    id: 'apple-watch-series-9',
    title: 'Apple Watch Series 9',
    description: 'Advanced health and fitness companion with ECG',
    imageUrl: 'https://via.placeholder.com/300x200/6366f1/ffffff?text=Apple+Watch+Series+9',
    price: 399.99,
    currency: 'USD',
    buyUrl: 'https://www.apple.com/apple-watch-series-9/',
    category: 'electronics',
    brand: 'Apple',
    rating: 4.9,
    reviewCount: 5678,
    createdAt: '2024-01-13T09:15:00Z',
  },
  {
    id: 'sony-wh1000xm5',
    title: 'Sony WH-1000XM5',
    description: 'Industry-leading noise cancellation headphones',
    imageUrl: 'https://via.placeholder.com/300x200/8b5cf6/ffffff?text=Sony+WH-1000XM5',
    price: 399.99,
    currency: 'USD',
    buyUrl: 'https://electronics.sony.com/audio/headphones/wh-1000xm5',
    category: 'electronics',
    brand: 'Sony',
    rating: 4.8,
    reviewCount: 3456,
    createdAt: '2024-01-12T16:45:00Z',
  },
  {
    id: 'macbook-pro-14',
    title: 'MacBook Pro 14" M3',
    description: 'Powerful laptop for creative professionals',
    imageUrl: 'https://via.placeholder.com/300x200/6366f1/ffffff?text=MacBook+Pro+14',
    price: 1999.99,
    currency: 'USD',
    buyUrl: 'https://www.apple.com/macbook-pro-14-and-16/',
    category: 'electronics',
    brand: 'Apple',
    rating: 4.9,
    reviewCount: 1234,
    createdAt: '2024-01-11T11:30:00Z',
  },
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
    reviewCount: 567,
    createdAt: '2024-01-10T13:20:00Z',
  },
  {
    id: 'dyson-v15-detect',
    title: 'Dyson V15 Detect',
    description: 'Cord-free vacuum with laser technology',
    imageUrl: 'https://via.placeholder.com/300x200/10b981/ffffff?text=Dyson+V15',
    price: 699.99,
    currency: 'USD',
    buyUrl: 'https://www.dyson.com/vacuums/cord-free/v15-detect',
    category: 'home',
    brand: 'Dyson',
    rating: 4.7,
    reviewCount: 892,
    createdAt: '2024-01-09T15:10:00Z',
  },
  {
    id: 'le-creuset-dutch-oven',
    title: 'Le Creuset Dutch Oven',
    description: 'Premium cast iron cookware for professional cooking',
    imageUrl: 'https://via.placeholder.com/300x200/f59e0b/ffffff?text=Le+Creuset',
    price: 399.99,
    currency: 'USD',
    buyUrl: 'https://www.lecreuset.com/en_US/cookware/dutch-ovens',
    category: 'kitchen',
    brand: 'Le Creuset',
    rating: 4.8,
    reviewCount: 1234,
    createdAt: '2024-01-08T12:00:00Z',
  },
  {
    id: 'canon-eos-r5',
    title: 'Canon EOS R5',
    description: 'Professional mirrorless camera with 8K video',
    imageUrl: 'https://via.placeholder.com/300x200/6366f1/ffffff?text=Canon+EOS+R5',
    price: 3899.99,
    currency: 'USD',
    buyUrl: 'https://www.canon.com/cameras/eos-r5/',
    category: 'electronics',
    brand: 'Canon',
    rating: 4.9,
    reviewCount: 456,
    createdAt: '2024-01-07T10:30:00Z',
  },
  {
    id: 'patagonia-down-jacket',
    title: 'Patagonia Down Sweater',
    description: 'Sustainable down jacket for outdoor adventures',
    imageUrl: 'https://via.placeholder.com/300x200/10b981/ffffff?text=Patagonia+Down',
    price: 229.99,
    currency: 'USD',
    buyUrl: 'https://www.patagonia.com/product/mens-down-sweater-jacket/84240.html',
    category: 'clothing',
    brand: 'Patagonia',
    rating: 4.7,
    reviewCount: 2341,
    createdAt: '2024-01-06T14:15:00Z',
  },
];

// Enhanced demo videos with shoppable content
export const demoVideos: VideoFrontend[] = [
  {
    id: 'demo-video-1',
    userId: 'demo-user-1',
    title: 'Animated Adventure Story',
    description: 'Enjoy this delightful animated short featuring Big Buck Bunny and friends',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    thumbnailUrl: 'https://via.placeholder.com/400x600/6366f1/ffffff?text=Animated+Adventure',
    duration: 180,
    detectedObjects: ['bunny', 'butterfly', 'nature', 'animation'],
    products: [demoProducts[0], demoProducts[1]], // Nike and Adidas shoes for outdoor activities
    views: 15420,
    createdAt: '2024-01-15T08:00:00Z',
    updatedAt: '2024-01-15T08:00:00Z',
  },
  {
    id: 'demo-video-2',
    userId: 'demo-user-2',
    title: 'Creative Animation Showcase',
    description: 'Experience the magic of computer-generated animation and storytelling',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    thumbnailUrl: 'https://via.placeholder.com/400x600/8b5cf6/ffffff?text=Creative+Animation',
    duration: 240,
    detectedObjects: ['elephant', 'robot', 'steampunk', 'animation'],
    products: [demoProducts[2], demoProducts[3], demoProducts[4], demoProducts[5]], // Tech products for creators
    views: 8920,
    createdAt: '2024-01-14T12:30:00Z',
    updatedAt: '2024-01-14T12:30:00Z',
  },
  {
    id: 'demo-video-3',
    userId: 'demo-user-3',
    title: 'Dynamic Visual Experience',
    description: 'Immerse yourself in this vibrant visual journey with stunning effects',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    thumbnailUrl: 'https://via.placeholder.com/400x600/f59e0b/ffffff?text=Visual+Experience',
    duration: 150,
    detectedObjects: ['fire', 'effects', 'visuals', 'animation'],
    products: [demoProducts[7], demoProducts[6]], // Home products for comfort
    views: 6730,
    createdAt: '2024-01-13T16:45:00Z',
    updatedAt: '2024-01-13T16:45:00Z',
  },
  {
    id: 'demo-video-4',
    userId: 'demo-user-4',
    title: 'Epic Adventure Journey',
    description: 'Join us on an epic journey through breathtaking landscapes and scenes',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    thumbnailUrl: 'https://via.placeholder.com/400x600/6366f1/ffffff?text=Epic+Adventure',
    duration: 300,
    detectedObjects: ['landscape', 'nature', 'adventure', 'travel'],
    products: [demoProducts[8], demoProducts[9]], // Camera and outdoor gear
    views: 4560,
    createdAt: '2024-01-12T10:20:00Z',
    updatedAt: '2024-01-12T10:20:00Z',
  },
];

export class DemoDataService {
  static getVideos(): VideoFrontend[] {
    return demoVideos;
  }

  static getProducts(): ProductFrontend[] {
    return demoProducts;
  }

  static getVideoById(id: string): VideoFrontend | undefined {
    return demoVideos.find(video => video.id === id);
  }

  static getProductById(id: string): ProductFrontend | undefined {
    return demoProducts.find(product => product.id === id);
  }

  static matchProductsByObjects(objects: string[]): ProductFrontend[] {
    const matchedProducts: ProductFrontend[] = [];
    const objectKeywords = objects.map(obj => obj.toLowerCase());

    for (const product of demoProducts) {
      const productKeywords = [
        product.title.toLowerCase(),
        product.description.toLowerCase(),
        product.brand.toLowerCase(),
        product.category.toLowerCase(),
        ...product.title.toLowerCase().split(' '),
        ...product.description.toLowerCase().split(' '),
      ];

      // Check for matches
      for (const object of objectKeywords) {
        for (const keyword of productKeywords) {
          if (keyword.includes(object) || object.includes(keyword)) {
            if (!matchedProducts.find(p => p.id === product.id)) {
              matchedProducts.push(product);
            }
            break;
          }
        }
      }
    }

    // Return top 3 matches
    return matchedProducts.slice(0, 3);
  }

  static getTrendingVideos(): VideoFrontend[] {
    return demoVideos
      .sort((a, b) => (b.views || 0) - (a.views || 0))
      .slice(0, 5);
  }

  static getVideosByCategory(category: string): VideoFrontend[] {
    return demoVideos.filter(video => 
      video.products.some(product => product.category === category)
    );
  }

  static getProductsByCategory(category: string): ProductFrontend[] {
    return demoProducts.filter(product => product.category === category);
  }
} 