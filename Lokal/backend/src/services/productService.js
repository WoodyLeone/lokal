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
    title: 'Apple Watch Series 9',
    description: 'Advanced health and fitness companion',
    imageUrl: 'https://via.placeholder.com/300x200/6366f1/ffffff?text=Apple+Watch',
    price: 399.99,
    currency: 'USD',
    buyUrl: 'https://www.apple.com/apple-watch-series-9/',
    category: 'electronics',
    brand: 'Apple',
    rating: 4.8,
    reviewCount: 892,
    keywords: ['watch', 'apple watch', 'smartwatch', 'apple', 'electronics', 'fitness', 'health']
  },
  {
    id: '10',
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
    keywords: ['chair', 'office chair', 'ergonomic', 'herman miller', 'furniture', 'aeron']
  }
];

class ProductService {
  // Match products based on detected objects
  async matchProductsByObjects(objects) {
    const matchedProducts = [];
    const objectKeywords = objects.map(obj => obj.toLowerCase());

    console.log('Matching products for objects:', objects);

    // Create a scoring system for better matching
    const productScores = [];

    for (const product of dummyProducts) {
      const productKeywords = product.keywords.map(keyword => keyword.toLowerCase());
      let score = 0;
      let matchedObjects = [];

      // Check for exact matches first (highest score)
      for (const object of objectKeywords) {
        for (const keyword of productKeywords) {
          if (keyword === object) {
            score += 10;
            matchedObjects.push(object);
            break;
          }
        }
      }

      // Check for partial matches (lower score)
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

      // Check for brand matches
      const brandLower = product.brand.toLowerCase();
      for (const object of objectKeywords) {
        if (brandLower.includes(object) || object.includes(brandLower)) {
          score += 3;
        }
      }

      if (score > 0) {
        productScores.push({
          product,
          score,
          matchedObjects
        });
        console.log(`Matched product: ${product.title} (score: ${score}) for objects: ${objects.join(', ')}`);
      }
    }

    // Sort by score and return top matches
    const sortedMatches = productScores
      .sort((a, b) => b.score - a.score)
      .slice(0, 6)
      .map(item => item.product);

    // If no matches found, return some relevant products based on category
    if (sortedMatches.length === 0) {
      console.log('No direct matches found, returning category-relevant products');
      
      // Try to find products in similar categories
      const categoryMap = {
        'person': ['clothing', 'accessories'],
        'chair': ['furniture'],
        'table': ['furniture'],
        'laptop': ['electronics'],
        'cell phone': ['electronics'],
        'watch': ['electronics', 'accessories'],
        'cup': ['kitchen'],
        'bottle': ['kitchen'],
        'sneakers': ['footwear'],
        'shirt': ['clothing'],
        'pants': ['clothing'],
        'tv': ['electronics'],
        'headphones': ['electronics'],
        'keyboard': ['electronics'],
        'mouse': ['electronics']
      };

      const relevantCategories = [];
      for (const object of objectKeywords) {
        if (categoryMap[object]) {
          relevantCategories.push(...categoryMap[object]);
        }
      }

      const uniqueCategories = [...new Set(relevantCategories)];
      const categoryProducts = dummyProducts.filter(product => 
        uniqueCategories.includes(product.category)
      );

      if (categoryProducts.length > 0) {
        return categoryProducts
          .sort((a, b) => b.rating - a.rating)
          .slice(0, 3);
      }

      // Last resort: return random products
      const shuffled = dummyProducts.sort(() => 0.5 - Math.random());
      return shuffled.slice(0, 3);
    }

    console.log(`Returning ${sortedMatches.length} matched products`);
    return sortedMatches;
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