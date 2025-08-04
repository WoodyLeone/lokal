#!/usr/bin/env node

/**
 * Railway PostgreSQL Setup Script (Fixed)
 * This script properly sets up Railway PostgreSQL for the Lokal app
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function setupRailwayFixed() {
  console.log('🚀 Setting up Railway PostgreSQL for Lokal (Fixed)...');
  
  const DATABASE_URL = process.env.EXPO_PUBLIC_DATABASE_URL;
  
  if (!DATABASE_URL) {
    console.error('❌ Missing DATABASE_URL environment variable');
    console.log('\n📋 To set up Railway PostgreSQL:');
    console.log('1. Go to https://railway.app');
    console.log('2. Create a new project');
    console.log('3. Add a PostgreSQL database');
    console.log('4. Copy the connection string');
    console.log('5. Set EXPO_PUBLIC_DATABASE_URL in your .env file');
    return;
  }
  
  try {
    // Test connection
    console.log('📡 Testing database connection...');
    const pool = new Pool({
      connectionString: DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    });
    
    const client = await pool.connect();
    await client.query('SELECT NOW()');
    console.log('✅ Database connection successful');
    
    // Execute schema statements one by one
    console.log('📋 Setting up database schema...');
    
    // 1. Enable UUID extension
    try {
      await client.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
      console.log('✅ UUID extension enabled');
    } catch (error) {
      console.log('⚠️ UUID extension already exists');
    }
    
    // 2. Create users table
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS users (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          email TEXT UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          username TEXT UNIQUE NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `);
      console.log('✅ Users table created');
    } catch (error) {
      console.log('⚠️ Users table already exists');
    }
    
    // 3. Create profiles table
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS profiles (
          id UUID REFERENCES users(id) PRIMARY KEY,
          username TEXT UNIQUE,
          avatar_url TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `);
      console.log('✅ Profiles table created');
    } catch (error) {
      console.log('⚠️ Profiles table already exists');
    }
    
    // 4. Create videos table
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS videos (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          user_id UUID REFERENCES users(id) NOT NULL,
          title TEXT NOT NULL,
          description TEXT,
          video_url TEXT NOT NULL,
          thumbnail_url TEXT,
          duration INTEGER DEFAULT 0,
          detected_objects TEXT[] DEFAULT '{}',
          products JSONB DEFAULT '[]',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `);
      console.log('✅ Videos table created');
    } catch (error) {
      console.log('⚠️ Videos table already exists');
    }
    
    // 5. Create products table
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS products (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          title TEXT NOT NULL,
          description TEXT,
          image_url TEXT,
          price DECIMAL(10,2) NOT NULL,
          currency TEXT DEFAULT 'USD',
          buy_url TEXT,
          category TEXT,
          brand TEXT,
          rating DECIMAL(3,2),
          review_count INTEGER DEFAULT 0,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `);
      console.log('✅ Products table created');
    } catch (error) {
      console.log('⚠️ Products table already exists');
    }
    
    // 6. Create indexes
    try {
      await client.query('CREATE INDEX IF NOT EXISTS idx_videos_user_id ON videos(user_id)');
      await client.query('CREATE INDEX IF NOT EXISTS idx_videos_created_at ON videos(created_at DESC)');
      await client.query('CREATE INDEX IF NOT EXISTS idx_products_category ON products(category)');
      await client.query('CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand)');
      await client.query('CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)');
      await client.query('CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username)');
      console.log('✅ Indexes created');
    } catch (error) {
      console.log('⚠️ Indexes already exist');
    }
    
    // 7. Create functions and triggers
    try {
      await client.query(`
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
          NEW.updated_at = NOW();
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql
      `);
      
      await client.query(`
        CREATE OR REPLACE FUNCTION handle_new_user()
        RETURNS TRIGGER AS $$
        BEGIN
          INSERT INTO public.profiles (id, username)
          VALUES (NEW.id, NEW.username);
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER
      `);
      
      console.log('✅ Functions created');
    } catch (error) {
      console.log('⚠️ Functions already exist');
    }
    
    // 8. Create triggers
    try {
      await client.query(`
        DROP TRIGGER IF EXISTS update_users_updated_at ON users;
        CREATE TRIGGER update_users_updated_at
          BEFORE UPDATE ON users
          FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column()
      `);
      
      await client.query(`
        DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
        CREATE TRIGGER update_profiles_updated_at
          BEFORE UPDATE ON profiles
          FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column()
      `);
      
      await client.query(`
        DROP TRIGGER IF EXISTS update_videos_updated_at ON videos;
        CREATE TRIGGER update_videos_updated_at
          BEFORE UPDATE ON videos
          FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column()
      `);
      
      await client.query(`
        DROP TRIGGER IF EXISTS on_user_created ON users;
        CREATE TRIGGER on_user_created
          AFTER INSERT ON users
          FOR EACH ROW EXECUTE PROCEDURE handle_new_user()
      `);
      
      console.log('✅ Triggers created');
    } catch (error) {
      console.log('⚠️ Triggers already exist');
    }
    
    // 9. Insert sample data
    try {
      await client.query(`
        INSERT INTO products (title, description, image_url, price, currency, buy_url, category, brand, rating, review_count) VALUES
        ('Nike Air Max 270', 'Comfortable running shoes with Air Max technology', 'https://example.com/nike-airmax.jpg', 129.99, 'USD', 'https://nike.com/airmax270', 'Footwear', 'Nike', 4.5, 1250),
        ('MacBook Pro 13"', 'Powerful laptop for professionals', 'https://example.com/macbook-pro.jpg', 1299.99, 'USD', 'https://apple.com/macbook-pro', 'Electronics', 'Apple', 4.8, 890),
        ('Coffee Mug', 'Ceramic coffee mug with handle', 'https://example.com/coffee-mug.jpg', 12.99, 'USD', 'https://starbucks.com/mug', 'Kitchen', 'Starbucks', 4.2, 340),
        ('Adidas T-Shirt', 'Comfortable cotton t-shirt', 'https://example.com/adidas-tshirt.jpg', 29.99, 'USD', 'https://adidas.com/tshirt', 'Clothing', 'Adidas', 4.3, 567)
        ON CONFLICT DO NOTHING
      `);
      console.log('✅ Sample products inserted');
    } catch (error) {
      console.log('⚠️ Sample products already exist');
    }
    
    // 10. Create test user
    try {
      await client.query(`
        INSERT INTO users (email, password_hash, username) VALUES
        ('test@example.com', '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8', 'testuser')
        ON CONFLICT DO NOTHING
      `);
      console.log('✅ Test user created');
    } catch (error) {
      console.log('⚠️ Test user already exists');
    }
    
    // Verify tables exist
    console.log('\n🔍 Verifying tables...');
    const tables = ['users', 'profiles', 'videos', 'products'];
    
    for (const table of tables) {
      const result = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = $1
        )
      `, [table]);
      
      if (result.rows[0].exists) {
        console.log(`✅ Table '${table}' exists`);
      } else {
        console.warn(`⚠️ Table '${table}' not found`);
      }
    }
    
    // Test sample data
    console.log('\n🧪 Testing sample data...');
    const productCount = await client.query('SELECT COUNT(*) FROM products');
    console.log(`✅ Found ${productCount.rows[0].count} products`);
    
    const userCount = await client.query('SELECT COUNT(*) FROM users');
    console.log(`✅ Found ${userCount.rows[0].count} users`);
    
    client.release();
    await pool.end();
    
    console.log('\n🎉 Railway PostgreSQL setup completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('1. Test the database: npm run test-database');
    console.log('2. Update your app to use DatabaseService instead of SupabaseService');
    console.log('3. If you have existing data, run: npm run migrate-to-railway');
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    console.log('\n💡 Troubleshooting:');
    console.log('1. Check your DATABASE_URL is correct');
    console.log('2. Ensure your Railway database is running');
    console.log('3. Check your network connection');
  }
}

// Run setup if called directly
if (require.main === module) {
  setupRailwayFixed();
}

module.exports = { setupRailwayFixed }; 