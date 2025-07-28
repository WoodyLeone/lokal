// Dummy product database for demo purposes
const dummyProducts = [
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
    keywords: ['sneakers', 'shoes', 'footwear', 'running', 'nike']
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
    keywords: ['laptop', 'computer', 'macbook', 'apple', 'electronics']
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
    keywords: ['cup', 'mug', 'coffee', 'drink', 'kitchen']
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
    keywords: ['shirt', 't-shirt', 'clothing', 'adidas', 'cotton']
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
    keywords: ['tv', 'television', 'samsung', '4k', 'electronics']
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
    keywords: ['bookcase', 'shelf', 'furniture', 'ikea', 'storage']
  },
  {
    id: '7',
    title: 'iPhone 15 Pro',
    description: 'Latest iPhone with advanced camera system',
    imageUrl: 'https://via.placeholder.com/300x200/6366f1/ffffff?text=iPhone+15+Pro',
    price: 999.99,
    currency: 'USD',
    buyUrl: 'https://www.apple.com/iphone-15-pro/',
    category: 'electronics',
    brand: 'Apple',
    rating: 4.7,
    reviewCount: 1234,
    keywords: ['phone', 'iphone', 'apple', 'smartphone', 'electronics']
  },
  {
    id: '8',
    title: 'Levi\'s 501 Jeans',
    description: 'Classic straight fit jeans',
    imageUrl: 'https://via.placeholder.com/300x200/1e40af/ffffff?text=Levis+Jeans',
    price: 59.99,
    currency: 'USD',
    buyUrl: 'https://www.levis.com/501-jeans',
    category: 'clothing',
    brand: 'Levi\'s',
    rating: 4.4,
    reviewCount: 456,
    keywords: ['pants', 'jeans', 'levis', 'clothing', 'denim']
  },
  {
    id: '9',
    title: 'KitchenAid Professional Oven',
    description: 'Professional-grade kitchen oven with convection',
    imageUrl: 'https://via.placeholder.com/300x200/f59e0b/ffffff?text=KitchenAid+Oven',
    price: 1299.99,
    currency: 'USD',
    buyUrl: 'https://www.kitchenaid.com/professional-oven',
    category: 'appliances',
    brand: 'KitchenAid',
    rating: 4.7,
    reviewCount: 234,
    keywords: ['oven', 'kitchen', 'appliance', 'cooking', 'kitchenaid']
  },
  {
    id: '10',
    title: 'Tesla Model 3',
    description: 'Electric sedan with autopilot capabilities',
    imageUrl: 'https://via.placeholder.com/300x200/10b981/ffffff?text=Tesla+Model+3',
    price: 39990.00,
    currency: 'USD',
    buyUrl: 'https://www.tesla.com/model3',
    category: 'automotive',
    brand: 'Tesla',
    rating: 4.8,
    reviewCount: 1567,
    keywords: ['car', 'tesla', 'electric', 'automotive', 'vehicle']
  },
  {
    id: '11',
    title: 'Honda Civic',
    description: 'Reliable compact car with great fuel efficiency',
    imageUrl: 'https://via.placeholder.com/300x200/ef4444/ffffff?text=Honda+Civic',
    price: 22990.00,
    currency: 'USD',
    buyUrl: 'https://www.honda.com/civic',
    category: 'automotive',
    brand: 'Honda',
    rating: 4.5,
    reviewCount: 892,
    keywords: ['car', 'honda', 'civic', 'automotive', 'vehicle']
  },
  {
    id: '12',
    title: 'GE Profile Oven',
    description: 'Smart oven with WiFi connectivity',
    imageUrl: 'https://via.placeholder.com/300x200/8b5cf6/ffffff?text=GE+Profile+Oven',
    price: 899.99,
    currency: 'USD',
    buyUrl: 'https://www.ge.com/profile-oven',
    category: 'appliances',
    brand: 'GE',
    rating: 4.3,
    reviewCount: 345,
    keywords: ['oven', 'ge', 'appliance', 'kitchen', 'smart']
  },
  {
    id: '13',
    title: 'Toyota Matrix 2011',
    description: 'Reliable compact hatchback with excellent fuel economy',
    imageUrl: 'https://via.placeholder.com/300x200/1e40af/ffffff?text=Toyota+Matrix+2011',
    price: 8500.00,
    currency: 'USD',
    buyUrl: 'https://www.toyota.com/matrix-2011',
    category: 'automotive',
    brand: 'Toyota',
    rating: 4.4,
    reviewCount: 678,
    keywords: ['car', 'toyota', 'matrix', 'automotive', 'vehicle', 'hatchback', 'compact']
  }
];

class ProductService {
  // Match products based on detected objects
  async matchProductsByObjects(objects) {
    const matchedProducts = [];
    const objectKeywords = objects.map(obj => obj.toLowerCase());

    console.log('Matching products for objects:', objects);

    // If no objects detected, return empty array instead of random products
    if (!objects || objects.length === 0) {
      console.log('No objects detected, returning empty product list');
      return [];
    }

    // First pass: Look for exact matches (highest priority)
    const exactMatches = [];
    for (const product of dummyProducts) {
      const productTitle = product.title.toLowerCase();
      const productKeywords = product.keywords.map(keyword => keyword.toLowerCase());
      
      // Check for exact matches in object names
      const hasExactMatch = objectKeywords.some(object => {
        // Check if object contains product title or vice versa
        return productTitle.includes(object) || 
               object.includes(productTitle) ||
               productKeywords.some(keyword => 
                 object.includes(keyword) && keyword.length > 3 // Avoid matching short words like "car"
               );
      });

      if (hasExactMatch) {
        exactMatches.push(product);
        console.log(`✅ Exact match: ${product.title} for objects: ${objects.join(', ')}`);
      }
    }

    // Second pass: Look for partial matches (lower priority)
    const partialMatches = [];
    for (const product of dummyProducts) {
      // Skip products already in exact matches
      if (exactMatches.some(p => p.id === product.id)) continue;
      
      const productKeywords = product.keywords.map(keyword => keyword.toLowerCase());
      
      // Check for partial matches
      const hasPartialMatch = objectKeywords.some(object => 
        productKeywords.some(keyword => 
          keyword.includes(object) || object.includes(keyword)
        )
      );

      if (hasPartialMatch) {
        partialMatches.push(product);
        console.log(`🔍 Partial match: ${product.title} for objects: ${objects.join(', ')}`);
      }
    }

    // Combine results with exact matches first
    const allMatches = [...exactMatches, ...partialMatches];

    // If no matches found, return empty array instead of random products
    if (allMatches.length === 0) {
      console.log('No matches found for objects:', objects);
      return [];
    }

    // Return up to 6 matched products, sorted by exact matches first, then by rating
    const result = allMatches
      .sort((a, b) => {
        // Sort exact matches first
        const aExact = exactMatches.some(p => p.id === a.id);
        const bExact = exactMatches.some(p => p.id === b.id);
        if (aExact && !bExact) return -1;
        if (!aExact && bExact) return 1;
        // Then sort by rating
        return b.rating - a.rating;
      })
      .slice(0, 6);
    
    console.log(`Returning ${result.length} matched products (${exactMatches.length} exact, ${partialMatches.length} partial)`);
    return result;
  }

  // Get demo products for when no real matches are found
  async getDemoProducts(count = 3) {
    const shuffled = dummyProducts.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }

  // Get all products
  async getAllProducts() {
    return dummyProducts;
  }

  // Get product by ID
  async getProductById(productId) {
    return dummyProducts.find(product => product.id === productId);
  }

  // Get products by category
  async getProductsByCategory(category) {
    return dummyProducts.filter(product => 
      product.category.toLowerCase() === category.toLowerCase()
    );
  }

  // Search products by keyword
  async searchProducts(query) {
    const searchTerm = query.toLowerCase();
    return dummyProducts.filter(product => 
      product.title.toLowerCase().includes(searchTerm) ||
      product.description.toLowerCase().includes(searchTerm) ||
      product.brand.toLowerCase().includes(searchTerm) ||
      product.keywords.some(keyword => keyword.toLowerCase().includes(searchTerm))
    );
  }
}

module.exports = new ProductService(); 