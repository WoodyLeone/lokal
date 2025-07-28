import { Video, Product } from '../types';

// Demo videos for testing
export const demoVideos: Video[] = [
  {
    id: '1',
    userId: 'demo-user-1',
    title: 'My New Sneakers Collection',
    description: 'Check out these amazing sneakers I just got! Perfect for everyday wear.',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    thumbnailUrl: 'https://via.placeholder.com/300x200/6366f1/ffffff?text=Sneakers+Video',
    duration: 120,
    detectedObjects: ['sneakers', 'person', 'chair'],
    products: [
      {
        id: '1',
        title: 'Nike Air Max 270',
        description: 'Comfortable running shoes with Air Max technology',
        imageUrl: 'https://via.placeholder.com/300x200/6366f1/ffffff?text=Nike+Shoes',
        price: 129.99,
        currency: 'USD',
        buyUrl: 'https://www.nike.com/t/air-max-270-shoe',
        category: 'footwear',
        brand: 'Nike',
        rating: 4.5,
        reviewCount: 1247,
      },
      {
        id: '2',
        title: 'Adidas Ultraboost 22',
        description: 'Premium running shoes with responsive cushioning',
        imageUrl: 'https://via.placeholder.com/300x200/10b981/ffffff?text=Adidas+Shoes',
        price: 179.99,
        currency: 'USD',
        buyUrl: 'https://www.adidas.com/ultraboost-22',
        category: 'footwear',
        brand: 'Adidas',
        rating: 4.7,
        reviewCount: 892,
      },
    ],
    createdAt: '2024-01-15T10:30:00Z',
    updatedAt: '2024-01-15T10:30:00Z',
  },
  {
    id: '2',
    userId: 'demo-user-2',
    title: 'Tech Setup Tour',
    description: 'My complete tech setup including laptop, monitor, and accessories.',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    thumbnailUrl: 'https://via.placeholder.com/300x200/8b5cf6/ffffff?text=Tech+Setup',
    duration: 180,
    detectedObjects: ['laptop', 'monitor', 'keyboard', 'mouse', 'desk'],
    products: [
      {
        id: '3',
        title: 'Apple MacBook Pro 13"',
        description: 'Powerful laptop for professionals',
        imageUrl: 'https://via.placeholder.com/300x200/8b5cf6/ffffff?text=MacBook+Pro',
        price: 1299.99,
        currency: 'USD',
        buyUrl: 'https://www.apple.com/macbook-pro-13/',
        category: 'electronics',
        brand: 'Apple',
        rating: 4.8,
        reviewCount: 892,
      },
      {
        id: '4',
        title: 'Samsung 27" 4K Monitor',
        description: 'Ultra HD monitor for crisp visuals',
        imageUrl: 'https://via.placeholder.com/300x200/ef4444/ffffff?text=Samsung+Monitor',
        price: 399.99,
        currency: 'USD',
        buyUrl: 'https://www.samsung.com/monitor',
        category: 'electronics',
        brand: 'Samsung',
        rating: 4.6,
        reviewCount: 567,
      },
    ],
    createdAt: '2024-01-14T15:45:00Z',
    updatedAt: '2024-01-14T15:45:00Z',
  },
  {
    id: '3',
    userId: 'demo-user-3',
    title: 'Coffee Morning Routine',
    description: 'My favorite coffee setup and morning routine.',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    thumbnailUrl: 'https://via.placeholder.com/300x200/f59e0b/ffffff?text=Coffee+Setup',
    duration: 90,
    detectedObjects: ['cup', 'coffee', 'mug', 'table'],
    products: [
      {
        id: '5',
        title: 'Starbucks Coffee Mug',
        description: 'Classic ceramic coffee mug',
        imageUrl: 'https://via.placeholder.com/300x200/f59e0b/ffffff?text=Coffee+Mug',
        price: 12.99,
        currency: 'USD',
        buyUrl: 'https://www.starbucks.com/store/product/coffee-mug',
        category: 'kitchen',
        brand: 'Starbucks',
        rating: 4.2,
        reviewCount: 156,
      },
      {
        id: '6',
        title: 'Breville Coffee Maker',
        description: 'Professional coffee machine for home use',
        imageUrl: 'https://via.placeholder.com/300x200/8b5cf6/ffffff?text=Coffee+Maker',
        price: 299.99,
        currency: 'USD',
        buyUrl: 'https://www.breville.com/coffee-maker',
        category: 'kitchen',
        brand: 'Breville',
        rating: 4.5,
        reviewCount: 234,
      },
    ],
    createdAt: '2024-01-13T08:15:00Z',
    updatedAt: '2024-01-13T08:15:00Z',
  },
];

// Demo products for testing
export const demoProducts: Product[] = [
  {
    id: '1',
    title: 'Nike Air Max 270',
    description: 'Comfortable running shoes with Air Max technology',
    imageUrl: 'https://via.placeholder.com/300x200/6366f1/ffffff?text=Nike+Shoes',
    price: 129.99,
    currency: 'USD',
    buyUrl: 'https://www.nike.com/t/air-max-270-shoe',
    category: 'footwear',
    brand: 'Nike',
    rating: 4.5,
    reviewCount: 1247,
  },
  {
    id: '2',
    title: 'Apple MacBook Pro 13"',
    description: 'Powerful laptop for professionals',
    imageUrl: 'https://via.placeholder.com/300x200/8b5cf6/ffffff?text=MacBook+Pro',
    price: 1299.99,
    currency: 'USD',
    buyUrl: 'https://www.apple.com/macbook-pro-13/',
    category: 'electronics',
    brand: 'Apple',
    rating: 4.8,
    reviewCount: 892,
  },
  {
    id: '3',
    title: 'Starbucks Coffee Mug',
    description: 'Classic ceramic coffee mug',
    imageUrl: 'https://via.placeholder.com/300x200/f59e0b/ffffff?text=Coffee+Mug',
    price: 12.99,
    currency: 'USD',
    buyUrl: 'https://www.starbucks.com/store/product/coffee-mug',
    category: 'kitchen',
    brand: 'Starbucks',
    rating: 4.2,
    reviewCount: 156,
  },
  {
    id: '4',
    title: 'Adidas T-Shirt',
    description: 'Comfortable cotton t-shirt',
    imageUrl: 'https://via.placeholder.com/300x200/10b981/ffffff?text=Adidas+Shirt',
    price: 29.99,
    currency: 'USD',
    buyUrl: 'https://www.adidas.com/t-shirt',
    category: 'clothing',
    brand: 'Adidas',
    rating: 4.3,
    reviewCount: 234,
  },
  {
    id: '5',
    title: 'Samsung 55" 4K TV',
    description: 'Ultra HD Smart TV with HDR',
    imageUrl: 'https://via.placeholder.com/300x200/ef4444/ffffff?text=Samsung+TV',
    price: 699.99,
    currency: 'USD',
    buyUrl: 'https://www.samsung.com/tv',
    category: 'electronics',
    brand: 'Samsung',
    rating: 4.6,
    reviewCount: 567,
  },
  {
    id: '6',
    title: 'IKEA Billy Bookcase',
    description: 'Versatile bookcase for any room',
    imageUrl: 'https://via.placeholder.com/300x200/8b5cf6/ffffff?text=IKEA+Bookcase',
    price: 89.99,
    currency: 'USD',
    buyUrl: 'https://www.ikea.com/bookcase',
    category: 'furniture',
    brand: 'IKEA',
    rating: 4.1,
    reviewCount: 789,
  },
];

export class DemoDataService {
  // Get all demo videos
  static getVideos(): Video[] {
    return demoVideos;
  }

  // Get demo video by ID
  static getVideoById(id: string): Video | undefined {
    return demoVideos.find(video => video.id === id);
  }

  // Get all demo products
  static getProducts(): Product[] {
    return demoProducts;
  }

  // Get demo product by ID
  static getProductById(id: string): Product | undefined {
    return demoProducts.find(product => product.id === id);
  }

  // Get products by category
  static getProductsByCategory(category: string): Product[] {
    return demoProducts.filter(product => 
      product.category.toLowerCase() === category.toLowerCase()
    );
  }

  // Search products
  static searchProducts(query: string): Product[] {
    const searchTerm = query.toLowerCase();
    return demoProducts.filter(product => 
      product.title.toLowerCase().includes(searchTerm) ||
      product.description.toLowerCase().includes(searchTerm) ||
      (product.brand?.toLowerCase() || '').includes(searchTerm)
    );
  }

  // Match products by objects (simplified matching)
  static matchProductsByObjects(objects: string[]): Product[] {
    const objectKeywords = objects.map(obj => obj.toLowerCase());
    const matchedProducts: Product[] = [];

    for (const product of demoProducts) {
      const productKeywords = [
        product.title.toLowerCase(),
        product.description.toLowerCase(),
        product.brand?.toLowerCase() || '',
        product.category.toLowerCase(),
      ];

      const hasMatch = objectKeywords.some(object => 
        productKeywords.some(keyword => 
          keyword.includes(object) || object.includes(keyword)
        )
      );

      if (hasMatch) {
        matchedProducts.push(product);
      }
    }

    return matchedProducts
      .sort((a, b) => (b.rating || 0) - (a.rating || 0))
      .slice(0, 6);
  }

  // Generate demo video with matched products
  static generateDemoVideo(title: string, description: string, detectedObjects: string[]): Video {
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