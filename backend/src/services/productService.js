// Comprehensive product database with real products
const dummyProducts = [
  // Travel & Luggage Products
  {
    id: 'samsonite-luggage',
    title: 'Samsonite Omni PC Hardside Luggage',
    description: 'Lightweight hardside spinner luggage with TSA lock',
    imageUrl: 'https://via.placeholder.com/300x200/10b981/ffffff?text=Samsonite+Luggage',
    price: 189.99,
    currency: 'USD',
    buyUrl: 'https://www.samsonite.com/omni-pc-hardside-luggage/',
    category: 'travel',
    brand: 'Samsonite',
    rating: 4.6,
    reviewCount: 1247,
    keywords: ['luggage', 'suitcase', 'travel', 'samsonite', 'hardside', 'spinner', 'tsa lock']
  },
  {
    id: 'away-luggage',
    title: 'Away The Carry-On',
    description: 'Premium polycarbonate carry-on with built-in battery',
    imageUrl: 'https://via.placeholder.com/300x200/3b82f6/ffffff?text=Away+Luggage',
    price: 275.00,
    currency: 'USD',
    buyUrl: 'https://www.awaytravel.com/luggage/carry-on',
    category: 'travel',
    brand: 'Away',
    rating: 4.7,
    reviewCount: 892,
    keywords: ['luggage', 'suitcase', 'travel', 'away', 'carry-on', 'polycarbonate', 'battery']
  },
  {
    id: 'delsey-luggage',
    title: 'Delsey Paris Helium Aero Hardside Luggage',
    description: 'Ultra-lightweight hardside luggage with smart features',
    imageUrl: 'https://via.placeholder.com/300x200/8b5cf6/ffffff?text=Delsey+Luggage',
    price: 299.99,
    currency: 'USD',
    buyUrl: 'https://www.delsey.com/helium-aero-hardside/',
    category: 'travel',
    brand: 'Delsey',
    rating: 4.5,
    reviewCount: 567,
    keywords: ['luggage', 'suitcase', 'travel', 'delsey', 'hardside', 'lightweight', 'helium']
  },
  {
    id: 'travelpro-luggage',
    title: 'Travelpro Maxlite 5 Softside Luggage',
    description: 'Ultra-lightweight softside luggage for frequent travelers',
    imageUrl: 'https://via.placeholder.com/300x200/f59e0b/ffffff?text=Travelpro+Luggage',
    price: 159.99,
    currency: 'USD',
    buyUrl: 'https://www.travelpro.com/maxlite-5-softside/',
    category: 'travel',
    brand: 'Travelpro',
    rating: 4.4,
    reviewCount: 734,
    keywords: ['luggage', 'suitcase', 'travel', 'travelpro', 'softside', 'lightweight', 'maxlite']
  },

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
    keywords: ['watch', 'apple watch', 'smartwatch', 'apple', 'electronics', 'fitness', 'health', 'wearable', 'series 9']
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
    keywords: ['phone', 'iphone', 'smartphone', 'apple', 'electronics', 'mobile', '15 pro']
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
    keywords: ['laptop', 'macbook', 'computer', 'apple', 'electronics', 'pro', 'm3']
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
    keywords: ['headphones', 'airpods', 'wireless', 'apple', 'electronics', 'noise cancellation']
  },
  {
    id: 'ipad-air',
    title: 'iPad Air (5th generation)',
    description: 'Powerful tablet with M1 chip and all-day battery',
    imageUrl: 'https://via.placeholder.com/300x200/8b5cf6/ffffff?text=iPad+Air',
    price: 599.00,
    currency: 'USD',
    buyUrl: 'https://www.apple.com/ipad-air/',
    category: 'electronics',
    brand: 'Apple',
    rating: 4.7,
    reviewCount: 945,
    keywords: ['tablet', 'ipad', 'apple', 'electronics', 'm1', 'air']
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
    keywords: ['phone', 'galaxy', 'smartphone', 'samsung', 'electronics', 's24', 'ultra', 's pen']
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
    keywords: ['tv', 'television', 'qled', 'samsung', 'electronics', '4k', 'smart tv']
  },
  {
    id: 'samsung-watch',
    title: 'Samsung Galaxy Watch 7',
    description: 'Advanced health monitoring with rotating bezel',
    imageUrl: 'https://via.placeholder.com/300x200/f59e0b/ffffff?text=Galaxy+Watch+7',
    price: 349.99,
    currency: 'USD',
    buyUrl: 'https://www.samsung.com/galaxy-watch-7/',
    category: 'electronics',
    brand: 'Samsung',
    rating: 4.5,
    reviewCount: 892,
    keywords: ['watch', 'galaxy watch', 'smartwatch', 'samsung', 'electronics', 'health']
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
    keywords: ['sneakers', 'shoes', 'footwear', 'running', 'nike', 'air max', 'athletic']
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
    keywords: ['shirt', 't-shirt', 'clothing', 'nike', 'dri-fit', 'training', 'athletic']
  },
  {
    id: 'nike-leggings',
    title: 'Nike Pro Training Leggings',
    description: 'High-performance leggings with compression fit',
    imageUrl: 'https://via.placeholder.com/300x200/10b981/ffffff?text=Nike+Pro+Leggings',
    price: 65.00,
    currency: 'USD',
    buyUrl: 'https://www.nike.com/t/pro-training-leggings',
    category: 'clothing',
    brand: 'Nike',
    rating: 4.4,
    reviewCount: 423,
    keywords: ['leggings', 'pants', 'clothing', 'nike', 'training', 'compression']
  },

  // Adidas Products
  {
    id: 'adidas-ultraboost',
    title: 'Adidas Ultraboost 22',
    description: 'Responsive running shoes with Boost midsole',
    imageUrl: 'https://via.placeholder.com/300x200/1e40af/ffffff?text=Adidas+Ultraboost',
    price: 190.00,
    currency: 'USD',
    buyUrl: 'https://www.adidas.com/ultraboost-22',
    category: 'footwear',
    brand: 'Adidas',
    rating: 4.6,
    reviewCount: 892,
    keywords: ['sneakers', 'shoes', 'footwear', 'running', 'adidas', 'ultraboost', 'boost']
  },
  {
    id: 'adidas-track-suit',
    title: 'Adidas Originals Track Suit',
    description: 'Classic three-stripe track suit for casual wear',
    imageUrl: 'https://via.placeholder.com/300x200/1e40af/ffffff?text=Adidas+Track+Suit',
    price: 120.00,
    currency: 'USD',
    buyUrl: 'https://www.adidas.com/originals-track-suit',
    category: 'clothing',
    brand: 'Adidas',
    rating: 4.2,
    reviewCount: 345,
    keywords: ['track suit', 'clothing', 'adidas', 'originals', 'casual', 'athletic']
  },

  // Furniture - Office Chairs
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
    keywords: ['chair', 'office chair', 'ergonomic', 'herman miller', 'furniture', 'aeron']
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
    keywords: ['chair', 'office chair', 'ergonomic', 'steelcase', 'furniture', 'leap']
  },
  {
    id: 'secretlab-titan',
    title: 'Secretlab Titan Gaming Chair',
    description: 'Premium gaming chair with memory foam and lumbar support',
    imageUrl: 'https://via.placeholder.com/300x200/8b5cf6/ffffff?text=Secretlab+Titan',
    price: 429.00,
    currency: 'USD',
    buyUrl: 'https://secretlab.co/collections/titan-series',
    category: 'furniture',
    brand: 'Secretlab',
    rating: 4.7,
    reviewCount: 892,
    keywords: ['chair', 'gaming chair', 'secretlab', 'furniture', 'titan', 'gaming']
  },

  // Furniture - Tables
  {
    id: 'ikea-linnmon',
    title: 'IKEA Linnmon Table Top',
    description: 'Versatile table top for desks and dining',
    imageUrl: 'https://via.placeholder.com/300x200/8b5cf6/ffffff?text=IKEA+Linnmon',
    price: 29.99,
    currency: 'USD',
    buyUrl: 'https://www.ikea.com/us/en/p/linnmon-table-top-white-00463850/',
    category: 'furniture',
    brand: 'IKEA',
    rating: 4.1,
    reviewCount: 2341,
    keywords: ['table', 'desk', 'furniture', 'ikea', 'linnmon', 'table top']
  },
  {
    id: 'west-elm-parsons',
    title: 'West Elm Parsons Dining Table',
    description: 'Modern dining table with clean lines',
    imageUrl: 'https://via.placeholder.com/300x200/8b5cf6/ffffff?text=West+Elm+Parsons',
    price: 899.00,
    currency: 'USD',
    buyUrl: 'https://www.westelm.com/products/parsons-dining-table/',
    category: 'furniture',
    brand: 'West Elm',
    rating: 4.5,
    reviewCount: 567,
    keywords: ['table', 'dining table', 'furniture', 'west elm', 'parsons', 'modern']
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
    keywords: ['tumbler', 'cup', 'mug', 'yeti', 'kitchen', 'insulated', 'vacuum']
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
    keywords: ['water bottle', 'bottle', 'hydro flask', 'kitchen', 'insulated', 'hydration']
  },
  {
    id: 'starbucks-mug',
    title: 'Starbucks Ceramic Coffee Mug',
    description: 'Classic ceramic coffee mug with Starbucks branding',
    imageUrl: 'https://via.placeholder.com/300x200/f59e0b/ffffff?text=Starbucks+Mug',
    price: 12.99,
    currency: 'USD',
    buyUrl: 'https://www.starbucks.com/store/product/coffee-mug',
    category: 'kitchen',
    brand: 'Starbucks',
    rating: 4.2,
    reviewCount: 156,
    keywords: ['mug', 'cup', 'coffee', 'starbucks', 'kitchen', 'ceramic']
  },

  // Clothing - Premium Brands
  {
    id: 'levis-501',
    title: 'Levi\'s 501 Original Jeans',
    description: 'Classic straight fit jeans with button fly',
    imageUrl: 'https://via.placeholder.com/300x200/1e40af/ffffff?text=Levis+501',
    price: 59.50,
    currency: 'USD',
    buyUrl: 'https://www.levis.com/en-us/clothing/men/jeans/501-original-fit-mens-jeans/005010019.html',
    category: 'clothing',
    brand: 'Levi\'s',
    rating: 4.4,
    reviewCount: 456,
    keywords: ['jeans', 'pants', 'levis', 'clothing', '501', 'denim', 'straight fit']
  },
  {
    id: 'lululemon-leggings',
    title: 'Lululemon Align Leggings',
    description: 'Buttery soft leggings for yoga and everyday wear',
    imageUrl: 'https://via.placeholder.com/300x200/10b981/ffffff?text=Lululemon+Align',
    price: 98.00,
    currency: 'USD',
    buyUrl: 'https://shop.lululemon.com/p/womens-leggings/Align-Pant-2/NW3CJ9S',
    category: 'clothing',
    brand: 'Lululemon',
    rating: 4.8,
    reviewCount: 2341,
    keywords: ['leggings', 'pants', 'lululemon', 'clothing', 'align', 'yoga', 'athletic']
  },
  {
    id: 'patagonia-jacket',
    title: 'Patagonia Nano Puff Jacket',
    description: 'Lightweight insulated jacket for outdoor adventures',
    imageUrl: 'https://via.placeholder.com/300x200/10b981/ffffff?text=Patagonia+Nano+Puff',
    price: 199.00,
    currency: 'USD',
    buyUrl: 'https://www.patagonia.com/product/mens-nano-puff-jacket/84240.html',
    category: 'clothing',
    brand: 'Patagonia',
    rating: 4.6,
    reviewCount: 892,
    keywords: ['jacket', 'coat', 'patagonia', 'clothing', 'nano puff', 'outdoor', 'insulated']
  },

  // Electronics - Gaming
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
    keywords: ['gaming', 'console', 'playstation', 'sony', 'electronics', 'ps5', '4k']
  },
  {
    id: 'xbox-series-x',
    title: 'Microsoft Xbox Series X',
    description: 'Most powerful Xbox ever with 4K gaming',
    imageUrl: 'https://via.placeholder.com/300x200/6366f1/ffffff?text=Xbox+Series+X',
    price: 499.99,
    currency: 'USD',
    buyUrl: 'https://www.xbox.com/en-US/consoles/xbox-series-x',
    category: 'electronics',
    brand: 'Microsoft',
    rating: 4.7,
    reviewCount: 4231,
    keywords: ['gaming', 'console', 'xbox', 'microsoft', 'electronics', 'series x', '4k']
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
    keywords: ['gaming', 'console', 'nintendo', 'switch', 'electronics', 'handheld', 'oled']
  },

  // Electronics - Audio
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
    keywords: ['headphones', 'wireless', 'sony', 'electronics', 'noise cancellation', 'wh-1000xm5']
  },
  {
    id: 'bose-quietcomfort',
    title: 'Bose QuietComfort 45',
    description: 'Premium noise-cancelling headphones with acoustic noise cancelling',
    imageUrl: 'https://via.placeholder.com/300x200/6366f1/ffffff?text=Bose+QuietComfort',
    price: 329.00,
    currency: 'USD',
    buyUrl: 'https://www.bose.com/en_us/products/headphones/quietcomfort-headphones-45.html',
    category: 'electronics',
    brand: 'Bose',
    rating: 4.7,
    reviewCount: 1892,
    keywords: ['headphones', 'wireless', 'bose', 'electronics', 'noise cancellation', 'quietcomfort']
  },
  {
    id: 'sonos-one',
    title: 'Sonos One Smart Speaker',
    description: 'Smart speaker with voice control and premium sound',
    imageUrl: 'https://via.placeholder.com/300x200/6366f1/ffffff?text=Sonos+One',
    price: 219.00,
    currency: 'USD',
    buyUrl: 'https://www.sonos.com/en-us/shop/sonos-one.html',
    category: 'electronics',
    brand: 'Sonos',
    rating: 4.6,
    reviewCount: 945,
    keywords: ['speaker', 'smart speaker', 'sonos', 'electronics', 'voice control', 'wireless']
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
    keywords: ['car', 'electric', 'tesla', 'automotive', 'model 3', 'autopilot', 'sedan']
  },
  {
    id: 'honda-civic',
    title: 'Honda Civic',
    description: 'Reliable compact car with excellent fuel efficiency',
    imageUrl: 'https://via.placeholder.com/300x200/10b981/ffffff?text=Honda+Civic',
    price: 22950.00,
    currency: 'USD',
    buyUrl: 'https://automobiles.honda.com/civic',
    category: 'automotive',
    brand: 'Honda',
    rating: 4.6,
    reviewCount: 1892,
    keywords: ['car', 'honda', 'automotive', 'civic', 'compact', 'fuel efficient']
  },
  {
    id: 'ford-f150',
    title: 'Ford F-150',
    description: 'America\'s best-selling pickup truck with advanced features',
    imageUrl: 'https://via.placeholder.com/300x200/ef4444/ffffff?text=Ford+F-150',
    price: 32445.00,
    currency: 'USD',
    buyUrl: 'https://www.ford.com/trucks/f150',
    category: 'automotive',
    brand: 'Ford',
    rating: 4.7,
    reviewCount: 3421,
    keywords: ['truck', 'pickup', 'ford', 'automotive', 'f-150', 'best-selling']
  },

  // Home & Garden
  {
    id: 'monstera-plant',
    title: 'Monstera Deliciosa Plant',
    description: 'Large tropical plant with distinctive split leaves',
    imageUrl: 'https://via.placeholder.com/300x200/10b981/ffffff?text=Monstera+Plant',
    price: 89.99,
    currency: 'USD',
    buyUrl: 'https://www.thesill.com/products/monstera-deliciosa',
    category: 'home',
    brand: 'The Sill',
    rating: 4.5,
    reviewCount: 567,
    keywords: ['plant', 'monstera', 'tropical', 'home', 'garden', 'indoor plant']
  },
  {
    id: 'dyson-v15',
    title: 'Dyson V15 Detect Cordless Vacuum',
    description: 'Powerful cordless vacuum with laser dust detection',
    imageUrl: 'https://via.placeholder.com/300x200/6366f1/ffffff?text=Dyson+V15',
    price: 699.99,
    currency: 'USD',
    buyUrl: 'https://www.dyson.com/vacuums/cord-free/v15-detect',
    category: 'home',
    brand: 'Dyson',
    rating: 4.8,
    reviewCount: 2341,
    keywords: ['vacuum', 'cordless', 'dyson', 'home', 'v15', 'detect', 'cleaning']
  },
  {
    id: 'philips-hue',
    title: 'Philips Hue Smart Bulb Starter Kit',
    description: 'Smart LED bulbs with voice control and app control',
    imageUrl: 'https://via.placeholder.com/300x200/f59e0b/ffffff?text=Philips+Hue',
    price: 199.99,
    currency: 'USD',
    buyUrl: 'https://www.philips-hue.com/en-us/p/hue-white-and-color-ambiance-starter-kit/046677458478',
    category: 'home',
    brand: 'Philips Hue',
    rating: 4.6,
    reviewCount: 1892,
    keywords: ['light bulb', 'smart bulb', 'philips hue', 'home', 'smart home', 'led']
  },

  // Sports & Fitness
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
    keywords: ['bike', 'exercise bike', 'peloton', 'fitness', 'cycling', 'indoor']
  },
  {
    id: 'fitbit-sense',
    title: 'Fitbit Sense 2',
    description: 'Advanced health smartwatch with stress management',
    imageUrl: 'https://via.placeholder.com/300x200/ef4444/ffffff?text=Fitbit+Sense',
    price: 299.95,
    currency: 'USD',
    buyUrl: 'https://www.fitbit.com/global/us/products/smartwatches/sense',
    category: 'electronics',
    brand: 'Fitbit',
    rating: 4.4,
    reviewCount: 892,
    keywords: ['watch', 'smartwatch', 'fitbit', 'electronics', 'health', 'fitness', 'sense']
  },
  {
    id: 'garmin-fenix',
    title: 'Garmin Fenix 7',
    description: 'Premium multisport GPS watch for outdoor adventures',
    imageUrl: 'https://via.placeholder.com/300x200/ef4444/ffffff?text=Garmin+Fenix',
    price: 699.99,
    currency: 'USD',
    buyUrl: 'https://www.garmin.com/en-US/p/722092',
    category: 'electronics',
    brand: 'Garmin',
    rating: 4.8,
    reviewCount: 567,
    keywords: ['watch', 'smartwatch', 'garmin', 'electronics', 'gps', 'outdoor', 'fenix']
  },

  // Books & Media
  {
    id: 'kindle-paperwhite',
    title: 'Kindle Paperwhite',
    description: 'Waterproof e-reader with weeks of battery life',
    imageUrl: 'https://via.placeholder.com/300x200/8b5cf6/ffffff?text=Kindle+Paperwhite',
    price: 139.99,
    currency: 'USD',
    buyUrl: 'https://www.amazon.com/kindle-paperwhite',
    category: 'electronics',
    brand: 'Amazon',
    rating: 4.7,
    reviewCount: 4567,
    keywords: ['kindle', 'e-reader', 'amazon', 'electronics', 'paperwhite', 'books']
  },
  {
    id: 'ipad-pro',
    title: 'iPad Pro 12.9"',
    description: 'Most powerful iPad with M2 chip and Liquid Retina XDR display',
    imageUrl: 'https://via.placeholder.com/300x200/8b5cf6/ffffff?text=iPad+Pro',
    price: 1099.00,
    currency: 'USD',
    buyUrl: 'https://www.apple.com/ipad-pro/',
    category: 'electronics',
    brand: 'Apple',
    rating: 4.9,
    reviewCount: 1234,
    keywords: ['tablet', 'ipad', 'apple', 'electronics', 'pro', 'm2', 'liquid retina']
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
    keywords: ['sunglasses', 'glasses', 'ray-ban', 'accessories', 'aviator', 'classic']
  },
  {
    id: 'coach-willow',
    title: 'Coach Willow Tote Bag',
    description: 'Luxury leather tote bag with signature hardware',
    imageUrl: 'https://via.placeholder.com/300x200/f59e0b/ffffff?text=Coach+Willow',
    price: 450.00,
    currency: 'USD',
    buyUrl: 'https://www.coach.com/outlet/willow-tote-24/',
    category: 'accessories',
    brand: 'Coach',
    rating: 4.5,
    reviewCount: 567,
    keywords: ['bag', 'tote', 'handbag', 'coach', 'accessories', 'leather', 'willow']
  }
];

class ProductService {
  constructor() {
    this.demoMode = process.env.DEMO_MODE === 'true';
    this.productionMatching = process.env.PRODUCTION_MATCHING === 'true';
    this.suggestionThreshold = process.env.SUGGESTION_RELEVANCE_THRESHOLD || 0.5;
    
    console.log(`🛍️ Product Service initialized:`);
    console.log(`   - Demo Mode: ${this.demoMode}`);
    console.log(`   - Production Matching: ${this.productionMatching}`);
    console.log(`   - Suggestion Threshold: ${this.suggestionThreshold}`);
  }

  // Match products based on detected objects with production logic
  async matchProductsByObjects(objects, manualProductName = null) {
    const matchedProducts = [];
    const objectKeywords = objects.map(obj => obj.toLowerCase());

    console.log('🛍️ Matching products for objects:', objects);
    console.log('🛍️ Manual product name:', manualProductName || 'None');

    // If no objects detected and no manual product name, return empty array
    if ((!objects || objects.length === 0) && !manualProductName) {
      console.log('⚠️ No objects detected and no manual product name, returning empty product list');
      return [];
    }

    // In production mode, prioritize manual product name over detected objects
    let searchTerms = [];
    if (manualProductName) {
      searchTerms.push(manualProductName.toLowerCase());
      console.log(`🎯 Prioritizing manual product name: ${manualProductName}`);
    }
    if (objects && objects.length > 0) {
      searchTerms.push(...objectKeywords);
    }

    // Enhanced matching with production logic
    const scoredProducts = [];

    for (const product of dummyProducts) {
      let score = 0;
      const productTitle = product.title.toLowerCase();
      const productKeywords = product.keywords.map(keyword => keyword.toLowerCase());
      const productBrand = product.brand.toLowerCase();
      
      // Calculate match score for each search term
      for (const searchTerm of searchTerms) {
        // Manual product name gets highest priority
        if (manualProductName && searchTerm === manualProductName.toLowerCase()) {
          // Exact match in product title (highest score for manual input)
          if (productTitle.includes(searchTerm) || searchTerm.includes(productTitle)) {
            score += 20;
            console.log(`🎯 Manual exact title match: ${product.title} for: ${searchTerm}`);
          }
          
          // Exact match in keywords (high score for manual input)
          if (productKeywords.includes(searchTerm)) {
            score += 15;
            console.log(`✅ Manual exact keyword match: ${product.title} for: ${searchTerm}`);
          }
          
          // Brand match for manual input
          if (productBrand.includes(searchTerm) || searchTerm.includes(productBrand)) {
            score += 12;
            console.log(`🏷️ Manual brand match: ${product.title} for: ${searchTerm}`);
          }
        } else {
          // Regular object detection matching (lower priority)
          if (productTitle.includes(searchTerm) || searchTerm.includes(productTitle)) {
            score += 10;
            console.log(`🎯 Exact title match: ${product.title} for object: ${searchTerm}`);
          }
          
          if (productKeywords.includes(searchTerm)) {
            score += 8;
            console.log(`✅ Exact keyword match: ${product.title} for object: ${searchTerm}`);
          }
        }
        
        // Partial match in keywords (medium score)
        for (const keyword of productKeywords) {
          if (keyword.includes(searchTerm) || searchTerm.includes(keyword)) {
            if (keyword.length > 3 && searchTerm.length > 3) { // Avoid matching short words
              const partialScore = manualProductName ? 8 : 5;
              score += partialScore;
              console.log(`🔍 Partial keyword match: ${product.title} (${keyword}) for: ${searchTerm}`);
            }
          }
        }
        
        // Category-based matching (lower score)
        if (product.category && product.category.includes(searchTerm)) {
          const categoryScore = manualProductName ? 5 : 3;
          score += categoryScore;
          console.log(`📂 Category match: ${product.title} (${product.category}) for: ${searchTerm}`);
        }
      }
      
      // Bonus points for high-rated products
      if (product.rating >= 4.5) {
        score += 2;
      }
      
      // Add product to scored list if it meets threshold
      if (score > 0) {
        const matchType = score >= 15 ? 'exact' : score >= 8 ? 'partial' : 'category';
        scoredProducts.push({
          product,
          score,
          matchType
        });
      }
    }

    // Sort by score (highest first) and then by rating
    scoredProducts.sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      return b.product.rating - a.product.rating;
    });

    // Group by match type for better organization
    const exactMatches = scoredProducts.filter(item => item.matchType === 'exact');
    const partialMatches = scoredProducts.filter(item => item.matchType === 'partial');
    const categoryMatches = scoredProducts.filter(item => item.matchType === 'category');

    console.log(`📊 Match Summary:`);
    console.log(`   Exact matches: ${exactMatches.length}`);
    console.log(`   Partial matches: ${partialMatches.length}`);
    console.log(`   Category matches: ${categoryMatches.length}`);

    // Return top matches (prioritize exact matches, then partial, then category)
    const result = [
      ...exactMatches.slice(0, 3),
      ...partialMatches.slice(0, 2),
      ...categoryMatches.slice(0, 1)
    ].slice(0, 6).map(item => item.product);

    console.log(`🎉 Returning ${result.length} matched products:`);
    result.forEach((product, index) => {
      const matchInfo = scoredProducts.find(item => item.product.id === product.id);
      console.log(`   ${index + 1}. ${product.title} (Score: ${matchInfo.score}, Type: ${matchInfo.matchType})`);
    });

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