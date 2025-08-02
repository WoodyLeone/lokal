import { MongoClient, Db } from 'mongodb';
import { ENV } from './env';

// MongoDB connection configuration
let client: MongoClient | null = null;
let db: Db | null = null;

// Helper function to check if database is properly configured
export const isDatabaseConfigured = (): boolean => {
  return !!ENV.MONGODB_URI && ENV.MONGODB_URI !== 'YOUR_MONGODB_URI';
};

// Helper function to get MongoDB client
export const getMongoClient = async (): Promise<MongoClient> => {
  if (!isDatabaseConfigured()) {
    throw new Error('MongoDB is not configured. Please check your MONGODB_URI environment variable.');
  }
  
  if (!client) {
    client = new MongoClient(ENV.MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
  }
  
  return client;
};

// Helper function to get database instance
export const getDatabase = async (): Promise<Db> => {
  if (!db) {
    const client = await getMongoClient();
    await client.connect();
    db = client.db(ENV.MONGODB_DATABASE || 'lokal');
  }
  
  return db;
};

// Helper function to execute operations with proper error handling
export const executeMongoOperation = async <T = any>(
  operation: (db: Db) => Promise<T>
): Promise<{ data: T | null; error: any }> => {
  try {
    const database = await getDatabase();
    const result = await operation(database);
    return { data: result, error: null };
  } catch (error) {
    console.error('MongoDB operation error:', error);
    return { 
      data: null, 
      error: error instanceof Error ? error.message : 'Database error' 
    };
  }
};

// Test database connection
export const testConnection = async (): Promise<boolean> => {
  try {
    const database = await getDatabase();
    await database.command({ ping: 1 });
    console.log('MongoDB connection successful');
    return true;
  } catch (error) {
    console.error('MongoDB connection test failed:', error);
    return false;
  }
};

// Close database connection
export const closeConnection = async (): Promise<void> => {
  if (client) {
    await client.close();
    client = null;
    db = null;
  }
};

export { client, db }; 