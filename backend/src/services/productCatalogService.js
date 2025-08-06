/**
 * Product Catalog Service
 * Manages product catalog, categories, and provides advanced search capabilities
 */

const winston = require('winston');
const redisService = require('./redisService');

// Configure logging
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'product-catalog' },
  transports: [
    new winston.transports.File({ filename: process.env.LOG_FILE || './logs/product-catalog.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

class ProductCatalogService {
  constructor() {
    this.isInitialized = false;
    this.categories = new Map();
    this.brands = new Map();
    this.priceRanges = new Map();
    
    // Product categories with subcategories
    this.categoryHierarchy = {
      'clothing': {
        name: 'Clothing',
        subcategories: ['shirts', 'pants', 'dresses', 'jackets', 'shoes', 'accessories'],
        keywords: ['apparel', 'fashion', 'wear', 'outfit']
      },
      'electronics': {
        name: 'Electronics',
        subcategories: ['phones', 'laptops', 'headphones', 'cameras', 'gaming'],
        keywords: ['tech', 'gadgets', 'devices', 'digital']
      },
      'home': {
        name: 'Home & Garden',
        subcategories: ['furniture', 'kitchen', 'decor', 'garden', 'tools'],
        keywords: ['household', 'domestic', 'interior', 'outdoor']
      },
      'beauty': {
        name: 'Beauty & Personal Care',
        subcategories: ['skincare', 'makeup', 'haircare', 'fragrances', 'wellness'],
        keywords: ['cosmetics', 'personal', 'grooming', 'health']
      },
      'sports': {
        name: 'Sports & Outdoors',
        subcategories: ['fitness', 'running', 'cycling', 'swimming', 'hiking'],
        keywords: ['athletic', 'exercise', 'outdoor', 'fitness']
      }
    };
  }

  /**
   * Initialize the service
   */
  async initialize() {
    try {
      await redisService.initialize();
      
      // Load initial catalog
      await this.loadCatalog();
      
      this.isInitialized = true;
      logger.info('Product Catalog Service initialized');
    } catch (error) {
      logger.error('Failed to initialize Product Catalog Service:', error);
      throw error;
    }
  }

  /**
   * Load product catalog from database or external source
   */
  async loadCatalog() {
    try {
      // In production, this would load from a real database
      // For now, we'll use a comprehensive mock catalog
      const catalog = this.generateMockCatalog();
      
      // Store in Redis for caching
      await redisService.setex('product_catalog', 3600, JSON.stringify(catalog));
      
      // Build indexes
      await this.buildIndexes(catalog);
      
      logger.info(`Loaded ${catalog.length} products into catalog`);
      
    } catch (error) {
      logger.error('Failed to load catalog:', error);
      throw error;
    }
  }

  /**
   * Generate comprehensive mock catalog
   */
  generateMockCatalog() {
    return [
      // Clothing & Fashion
      {
        id: 'clothing-1',
        title: 'Nike Air Max 270',
        description: 'Comfortable running shoes with Air Max technology and breathable mesh upper',
        category: 'clothing',
        subcategory: 'shoes',
        brand: 'Nike',
        price: 150.00,
        currency: 'USD',
        image_url: 'https://example.com/nike-air-max-270.jpg',
        buy_url: 'https://example.com/buy/nike-air-max-270',
        keywords: ['running', 'sports', 'comfortable', 'air max', 'athletic'],
        tags: ['nike', 'running', 'shoes', 'sports'],
        rating: 4.5,
        review_count: 1247,
        in_stock: true,
        variants: ['black', 'white', 'red']
      },
      {
        id: 'clothing-2',
        title: 'Adidas Ultraboost 22',
        description: 'Premium running shoes with responsive Boost midsole and Primeknit upper',
        category: 'clothing',
        subcategory: 'shoes',
        brand: 'Adidas',
        price: 180.00,
        currency: 'USD',
        image_url: 'https://example.com/adidas-ultraboost-22.jpg',
        buy_url: 'https://example.com/buy/adidas-ultraboost-22',
        keywords: ['running', 'premium', 'boost', 'responsive', 'athletic'],
        tags: ['adidas', 'running', 'shoes', 'premium'],
        rating: 4.7,
        review_count: 892,
        in_stock: true,
        variants: ['blue', 'grey', 'black']
      },
      {
        id: 'clothing-3',
        title: 'Nike Dri-FIT Training T-Shirt',
        description: 'Moisture-wicking training shirt with breathable fabric and comfortable fit',
        category: 'clothing',
        subcategory: 'shirts',
        brand: 'Nike',
        price: 35.00,
        currency: 'USD',
        image_url: 'https://example.com/nike-drifit-shirt.jpg',
        buy_url: 'https://example.com/buy/nike-drifit-shirt',
        keywords: ['training', 'moisture-wicking', 'breathable', 'athletic', 'workout'],
        tags: ['nike', 'training', 'shirt', 'athletic'],
        rating: 4.3,
        review_count: 567,
        in_stock: true,
        variants: ['black', 'white', 'grey']
      },
      
      // Electronics
      {
        id: 'electronics-1',
        title: 'iPhone 15 Pro',
        description: 'Latest iPhone with A17 Pro chip, titanium design, and advanced camera system',
        category: 'electronics',
        subcategory: 'phones',
        brand: 'Apple',
        price: 999.00,
        currency: 'USD',
        image_url: 'https://example.com/iphone-15-pro.jpg',
        buy_url: 'https://example.com/buy/iphone-15-pro',
        keywords: ['smartphone', 'camera', '5g', 'titanium', 'premium'],
        tags: ['apple', 'iphone', 'smartphone', 'premium'],
        rating: 4.8,
        review_count: 2341,
        in_stock: true,
        variants: ['natural titanium', 'blue titanium', 'white titanium']
      },
      {
        id: 'electronics-2',
        title: 'Sony WH-1000XM5',
        description: 'Premium noise-cancelling headphones with 30-hour battery life',
        category: 'electronics',
        subcategory: 'headphones',
        brand: 'Sony',
        price: 399.00,
        currency: 'USD',
        image_url: 'https://example.com/sony-wh-1000xm5.jpg',
        buy_url: 'https://example.com/buy/sony-wh-1000xm5',
        keywords: ['headphones', 'noise cancelling', 'wireless', 'bluetooth', 'premium'],
        tags: ['sony', 'headphones', 'wireless', 'premium'],
        rating: 4.6,
        review_count: 1567,
        in_stock: true,
        variants: ['black', 'silver']
      },
      {
        id: 'electronics-3',
        title: 'MacBook Pro 14-inch',
        description: 'Powerful laptop with M3 Pro chip, Liquid Retina XDR display, and all-day battery',
        category: 'electronics',
        subcategory: 'laptops',
        brand: 'Apple',
        price: 1999.00,
        currency: 'USD',
        image_url: 'https://example.com/macbook-pro-14.jpg',
        buy_url: 'https://example.com/buy/macbook-pro-14',
        keywords: ['laptop', 'macbook', 'powerful', 'retina', 'professional'],
        tags: ['apple', 'macbook', 'laptop', 'professional'],
        rating: 4.9,
        review_count: 892,
        in_stock: true,
        variants: ['space gray', 'silver']
      },
      
      // Home & Garden
      {
        id: 'home-1',
        title: 'IKEA KALLAX Shelf Unit',
        description: 'Versatile storage solution with multiple compartments for books, decor, and more',
        category: 'home',
        subcategory: 'furniture',
        brand: 'IKEA',
        price: 89.99,
        currency: 'USD',
        image_url: 'https://example.com/ikea-kallax.jpg',
        buy_url: 'https://example.com/buy/ikea-kallax',
        keywords: ['shelf', 'storage', 'furniture', 'versatile', 'organizer'],
        tags: ['ikea', 'furniture', 'storage', 'shelf'],
        rating: 4.2,
        review_count: 1234,
        in_stock: true,
        variants: ['white', 'black-brown', 'walnut']
      },
      
      // Beauty & Personal Care
      {
        id: 'beauty-1',
        title: 'La Mer Moisturizing Cream',
        description: 'Luxury moisturizing cream with Miracle Broth and marine ingredients',
        category: 'beauty',
        subcategory: 'skincare',
        brand: 'La Mer',
        price: 350.00,
        currency: 'USD',
        image_url: 'https://example.com/la-mer-cream.jpg',
        buy_url: 'https://example.com/buy/la-mer-cream',
        keywords: ['moisturizer', 'luxury', 'skincare', 'anti-aging', 'premium'],
        tags: ['la mer', 'skincare', 'moisturizer', 'luxury'],
        rating: 4.7,
        review_count: 2341,
        in_stock: true,
        variants: ['30ml', '60ml', '100ml']
      },
      
      // Sports & Outdoors
      {
        id: 'sports-1',
        title: 'Garmin Forerunner 945',
        description: 'Advanced GPS running watch with heart rate monitoring and training metrics',
        category: 'sports',
        subcategory: 'fitness',
        brand: 'Garmin',
        price: 599.99,
        currency: 'USD',
        image_url: 'https://example.com/garmin-forerunner-945.jpg',
        buy_url: 'https://example.com/buy/garmin-forerunner-945',
        keywords: ['gps', 'running', 'watch', 'fitness', 'heart rate'],
        tags: ['garmin', 'running', 'watch', 'fitness'],
        rating: 4.5,
        review_count: 892,
        in_stock: true,
        variants: ['black', 'blue']
      }
    ];
  }

  /**
   * Build search indexes for fast product lookup
   */
  async buildIndexes(catalog) {
    try {
      // Build category index
      for (const product of catalog) {
        if (!this.categories.has(product.category)) {
          this.categories.set(product.category, []);
        }
        this.categories.get(product.category).push(product.id);
        
        // Build brand index
        if (!this.brands.has(product.brand)) {
          this.brands.set(product.brand, []);
        }
        this.brands.get(product.brand).push(product.id);
        
        // Build price range index
        const priceRange = this.getPriceRange(product.price);
        if (!this.priceRanges.has(priceRange)) {
          this.priceRanges.set(priceRange, []);
        }
        this.priceRanges.get(priceRange).push(product.id);
      }
      
      // Store indexes in Redis
      await redisService.setex('catalog_indexes', 3600, JSON.stringify({
        categories: Object.fromEntries(this.categories),
        brands: Object.fromEntries(this.brands),
        priceRanges: Object.fromEntries(this.priceRanges)
      }));
      
      logger.info('Product catalog indexes built successfully');
      
    } catch (error) {
      logger.error('Failed to build indexes:', error);
      throw error;
    }
  }

  /**
   * Get price range category
   */
  getPriceRange(price) {
    if (price < 50) return 'budget';
    if (price < 200) return 'mid-range';
    if (price < 500) return 'premium';
    return 'luxury';
  }

  /**
   * Search products with advanced filtering
   */
  async searchProducts(query, filters = {}) {
    try {
      const catalog = await this.getCatalog();
      let results = [...catalog];
      
      // Text search
      if (query) {
        const searchTerms = query.toLowerCase().split(' ');
        results = results.filter(product => {
          const searchableText = [
            product.title,
            product.description,
            product.brand,
            product.category,
            ...product.keywords,
            ...product.tags
          ].join(' ').toLowerCase();
          
          return searchTerms.some(term => searchableText.includes(term));
        });
      }
      
      // Apply filters
      if (filters.category) {
        results = results.filter(product => product.category === filters.category);
      }
      
      if (filters.brand) {
        results = results.filter(product => product.brand === filters.brand);
      }
      
      if (filters.priceRange) {
        results = results.filter(product => this.getPriceRange(product.price) === filters.priceRange);
      }
      
      if (filters.minPrice !== undefined) {
        results = results.filter(product => product.price >= filters.minPrice);
      }
      
      if (filters.maxPrice !== undefined) {
        results = results.filter(product => product.price <= filters.maxPrice);
      }
      
      if (filters.inStock !== undefined) {
        results = results.filter(product => product.in_stock === filters.inStock);
      }
      
      if (filters.minRating !== undefined) {
        results = results.filter(product => product.rating >= filters.minRating);
      }
      
      // Sort results
      const sortBy = filters.sortBy || 'relevance';
      switch (sortBy) {
        case 'price_low':
          results.sort((a, b) => a.price - b.price);
          break;
        case 'price_high':
          results.sort((a, b) => b.price - a.price);
          break;
        case 'rating':
          results.sort((a, b) => b.rating - a.rating);
          break;
        case 'reviews':
          results.sort((a, b) => b.review_count - a.review_count);
          break;
        case 'newest':
          results.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
          break;
        default:
          // Relevance sorting (keep original order for now)
          break;
      }
      
      // Pagination
      const page = filters.page || 1;
      const limit = filters.limit || 20;
      const start = (page - 1) * limit;
      const end = start + limit;
      
      return {
        products: results.slice(start, end),
        total: results.length,
        page,
        limit,
        totalPages: Math.ceil(results.length / limit)
      };
      
    } catch (error) {
      logger.error('Failed to search products:', error);
      throw error;
    }
  }

  /**
   * Get product recommendations based on user behavior
   */
  async getRecommendations(userId, productId = null, limit = 10) {
    try {
      const catalog = await this.getCatalog();
      let recommendations = [];
      
      if (productId) {
        // Get similar products based on current product
        const currentProduct = catalog.find(p => p.id === productId);
        if (currentProduct) {
          recommendations = this.findSimilarProducts(currentProduct, catalog, limit);
        }
      } else {
        // Get popular products
        recommendations = catalog
          .sort((a, b) => b.rating * b.review_count - a.rating * a.review_count)
          .slice(0, limit);
      }
      
      return recommendations;
      
    } catch (error) {
      logger.error('Failed to get recommendations:', error);
      throw error;
    }
  }

  /**
   * Find similar products based on various criteria
   */
  findSimilarProducts(product, catalog, limit) {
    const similar = catalog
      .filter(p => p.id !== product.id)
      .map(p => ({
        product: p,
        score: this.calculateSimilarityScore(product, p)
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(item => item.product);
    
    return similar;
  }

  /**
   * Calculate similarity score between two products
   */
  calculateSimilarityScore(product1, product2) {
    let score = 0;
    
    // Category similarity (highest weight)
    if (product1.category === product2.category) {
      score += 0.4;
    }
    
    // Brand similarity
    if (product1.brand === product2.brand) {
      score += 0.3;
    }
    
    // Price range similarity
    if (this.getPriceRange(product1.price) === this.getPriceRange(product2.price)) {
      score += 0.2;
    }
    
    // Keyword overlap
    const keywords1 = new Set(product1.keywords);
    const keywords2 = new Set(product2.keywords);
    const overlap = [...keywords1].filter(k => keywords2.has(k)).length;
    score += (overlap / Math.max(keywords1.size, keywords2.size)) * 0.1;
    
    return score;
  }

  /**
   * Get catalog from cache or reload
   */
  async getCatalog() {
    try {
      const cached = await redisService.get('product_catalog');
      if (cached) {
        return JSON.parse(cached);
      }
      
      // Reload catalog if not cached
      await this.loadCatalog();
      const fresh = await redisService.get('product_catalog');
      return JSON.parse(fresh);
      
    } catch (error) {
      logger.error('Failed to get catalog:', error);
      return [];
    }
  }

  /**
   * Get product by ID
   */
  async getProduct(productId) {
    try {
      const catalog = await this.getCatalog();
      return catalog.find(p => p.id === productId);
    } catch (error) {
      logger.error('Failed to get product:', error);
      return null;
    }
  }

  /**
   * Get categories
   */
  async getCategories() {
    return this.categoryHierarchy;
  }

  /**
   * Get brands
   */
  async getBrands() {
    try {
      const catalog = await this.getCatalog();
      const brands = [...new Set(catalog.map(p => p.brand))];
      return brands.sort();
    } catch (error) {
      logger.error('Failed to get brands:', error);
      return [];
    }
  }

  /**
   * Get price ranges
   */
  getPriceRanges() {
    return [
      { key: 'budget', label: 'Under $50', max: 50 },
      { key: 'mid-range', label: '$50 - $200', min: 50, max: 200 },
      { key: 'premium', label: '$200 - $500', min: 200, max: 500 },
      { key: 'luxury', label: 'Over $500', min: 500 }
    ];
  }

  /**
   * Add product to catalog
   */
  async addProduct(product) {
    try {
      const catalog = await this.getCatalog();
      
      // Generate ID if not provided
      if (!product.id) {
        product.id = `product-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      }
      
      // Add metadata
      product.created_at = new Date().toISOString();
      product.updated_at = new Date().toISOString();
      
      catalog.push(product);
      
      // Update cache
      await redisService.setex('product_catalog', 3600, JSON.stringify(catalog));
      
      // Rebuild indexes
      await this.buildIndexes(catalog);
      
      logger.info(`Product added to catalog: ${product.id}`);
      return product;
      
    } catch (error) {
      logger.error('Failed to add product:', error);
      throw error;
    }
  }

  /**
   * Update product in catalog
   */
  async updateProduct(productId, updates) {
    try {
      const catalog = await this.getCatalog();
      const index = catalog.findIndex(p => p.id === productId);
      
      if (index === -1) {
        throw new Error(`Product not found: ${productId}`);
      }
      
      catalog[index] = {
        ...catalog[index],
        ...updates,
        updated_at: new Date().toISOString()
      };
      
      // Update cache
      await redisService.setex('product_catalog', 3600, JSON.stringify(catalog));
      
      // Rebuild indexes
      await this.buildIndexes(catalog);
      
      logger.info(`Product updated: ${productId}`);
      return catalog[index];
      
    } catch (error) {
      logger.error('Failed to update product:', error);
      throw error;
    }
  }

  /**
   * Remove product from catalog
   */
  async removeProduct(productId) {
    try {
      const catalog = await this.getCatalog();
      const filtered = catalog.filter(p => p.id !== productId);
      
      if (filtered.length === catalog.length) {
        throw new Error(`Product not found: ${productId}`);
      }
      
      // Update cache
      await redisService.setex('product_catalog', 3600, JSON.stringify(filtered));
      
      // Rebuild indexes
      await this.buildIndexes(filtered);
      
      logger.info(`Product removed: ${productId}`);
      return true;
      
    } catch (error) {
      logger.error('Failed to remove product:', error);
      throw error;
    }
  }

  /**
   * Get catalog statistics
   */
  async getStats() {
    try {
      const catalog = await this.getCatalog();
      
      const stats = {
        totalProducts: catalog.length,
        categories: {},
        brands: {},
        priceRanges: {},
        averagePrice: 0,
        totalValue: 0
      };
      
      // Calculate statistics
      for (const product of catalog) {
        // Category stats
        stats.categories[product.category] = (stats.categories[product.category] || 0) + 1;
        
        // Brand stats
        stats.brands[product.brand] = (stats.brands[product.brand] || 0) + 1;
        
        // Price range stats
        const priceRange = this.getPriceRange(product.price);
        stats.priceRanges[priceRange] = (stats.priceRanges[priceRange] || 0) + 1;
        
        // Price stats
        stats.totalValue += product.price;
      }
      
      stats.averagePrice = stats.totalValue / stats.totalProducts;
      
      return stats;
      
    } catch (error) {
      logger.error('Failed to get catalog stats:', error);
      return {};
    }
  }
}

module.exports = new ProductCatalogService(); 