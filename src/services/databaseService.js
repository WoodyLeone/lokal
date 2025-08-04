const sql = require('../config/database.js');

class DatabaseService {
  // User operations
  static async createUser(userData) {
    try {
      const result = await sql`
        INSERT INTO profiles (id, username, avatar_url)
        VALUES (${userData.id}, ${userData.username}, ${userData.avatarUrl})
        RETURNING *
      `;
      return { data: result[0], error: null };
    } catch (error) {
      return { data: null, error: error.message };
    }
  }

  static async getUserById(userId) {
    try {
      const result = await sql`
        SELECT * FROM profiles WHERE id = ${userId}
      `;
      return { data: result[0] || null, error: null };
    } catch (error) {
      return { data: null, error: error.message };
    }
  }

  // Video operations
  static async createVideo(videoData) {
    try {
      const result = await sql`
        INSERT INTO videos (user_id, title, description, video_url, thumbnail_url, duration, detected_objects, products)
        VALUES (${videoData.userId}, ${videoData.title}, ${videoData.description}, ${videoData.videoUrl}, ${videoData.thumbnailUrl}, ${videoData.duration}, ${videoData.detectedObjects}, ${videoData.products})
        RETURNING *
      `;
      return { data: result[0], error: null };
    } catch (error) {
      return { data: null, error: error.message };
    }
  }

  static async getVideos(userId = null) {
    try {
      let query = sql`SELECT * FROM videos ORDER BY created_at DESC`;
      if (userId) {
        query = sql`SELECT * FROM videos WHERE user_id = ${userId} ORDER BY created_at DESC`;
      }
      const result = await query;
      return { data: result, error: null };
    } catch (error) {
      return { data: null, error: error.message };
    }
  }

  static async getVideoById(videoId) {
    try {
      const result = await sql`
        SELECT * FROM videos WHERE id = ${videoId}
      `;
      return { data: result[0] || null, error: null };
    } catch (error) {
      return { data: null, error: error.message };
    }
  }

  static async updateVideo(videoId, updates) {
    try {
      const result = await sql`
        UPDATE videos 
        SET title = ${updates.title}, 
            description = ${updates.description}, 
            detected_objects = ${updates.detectedObjects}, 
            products = ${updates.products},
            updated_at = NOW()
        WHERE id = ${videoId}
        RETURNING *
      `;
      return { data: result[0], error: null };
    } catch (error) {
      return { data: null, error: error.message };
    }
  }

  static async deleteVideo(videoId) {
    try {
      await sql`DELETE FROM videos WHERE id = ${videoId}`;
      return { error: null };
    } catch (error) {
      return { error: error.message };
    }
  }

  // Product operations
  static async createProduct(productData) {
    try {
      const result = await sql`
        INSERT INTO products (title, description, image_url, price, currency, buy_url, category, brand, rating, review_count)
        VALUES (${productData.title}, ${productData.description}, ${productData.imageUrl}, ${productData.price}, ${productData.currency}, ${productData.buyUrl}, ${productData.category}, ${productData.brand}, ${productData.rating}, ${productData.reviewCount})
        RETURNING *
      `;
      return { data: result[0], error: null };
    } catch (error) {
      return { data: null, error: error.message };
    }
  }

  static async getProducts() {
    try {
      const result = await sql`SELECT * FROM products ORDER BY created_at DESC`;
      return { data: result, error: null };
    } catch (error) {
      return { data: null, error: error.message };
    }
  }

  static async getProductById(productId) {
    try {
      const result = await sql`
        SELECT * FROM products WHERE id = ${productId}
      `;
      return { data: result[0] || null, error: null };
    } catch (error) {
      return { data: null, error: error.message };
    }
  }

  // Utility methods
  static async closeConnection() {
    try {
      await sql.end();
      return { error: null };
    } catch (error) {
      return { error: error.message };
    }
  }

  static async testConnection() {
    try {
      const result = await sql`SELECT version()`;
      return { data: result[0], error: null };
    } catch (error) {
      return { data: null, error: error.message };
    }
  }
}

module.exports = DatabaseService; 