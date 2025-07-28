const productService = require('../services/productService');

const productController = {
  // Match products based on detected objects
  async matchProducts(req, res) {
    try {
      const { objects } = req.body;

      if (!objects || !Array.isArray(objects)) {
        return res.status(400).json({
          success: false,
          error: 'Objects array is required'
        });
      }

      const matchedProducts = await productService.matchProductsByObjects(objects);

      res.json({
        success: true,
        products: matchedProducts,
        count: matchedProducts.length
      });

    } catch (error) {
      console.error('Product matching error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to match products'
      });
    }
  },

  // Get all products
  async getAllProducts(req, res) {
    try {
      const products = await productService.getAllProducts();

      res.json({
        success: true,
        products,
        count: products.length
      });

    } catch (error) {
      console.error('Get products error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get products'
      });
    }
  },

  // Get product by ID
  async getProductById(req, res) {
    try {
      const { productId } = req.params;
      const product = await productService.getProductById(productId);

      if (!product) {
        return res.status(404).json({
          success: false,
          error: 'Product not found'
        });
      }

      res.json({
        success: true,
        product
      });

    } catch (error) {
      console.error('Get product error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get product'
      });
    }
  },

  // Get products by category
  async getProductsByCategory(req, res) {
    try {
      const { category } = req.params;
      const products = await productService.getProductsByCategory(category);

      res.json({
        success: true,
        products,
        count: products.length,
        category
      });

    } catch (error) {
      console.error('Get products by category error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get products by category'
      });
    }
  }
};

module.exports = productController; 