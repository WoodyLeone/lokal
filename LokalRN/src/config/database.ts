import { Pool, PoolClient } from 'pg';
import { ENV } from './env';

// Railway PostgreSQL connection configuration
const pool = new Pool({
  connectionString: ENV.DATABASE_URL,
  ssl: ENV.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
});

// Helper function to check if database is properly configured
export const isDatabaseConfigured = (): boolean => {
  return !!ENV.DATABASE_URL && ENV.DATABASE_URL !== 'YOUR_DATABASE_URL';
};

// Helper function to get database pool
export const getDatabasePool = () => {
  if (!isDatabaseConfigured()) {
    throw new Error('Database is not configured. Please check your DATABASE_URL environment variable.');
  }
  return pool;
};

// Helper function to execute queries with proper error handling
export const executeQuery = async <T = any>(
  query: string, 
  params: any[] = []
): Promise<{ data: T | null; error: any }> => {
  let client: PoolClient | null = null;
  
  try {
    client = await pool.connect();
    const result = await client.query(query, params);
    return { data: result.rows, error: null };
  } catch (error) {
    console.error('Database query error:', error);
    return { 
      data: null, 
      error: error instanceof Error ? error.message : 'Database error' 
    };
  } finally {
    if (client) {
      client.release();
    }
  }
};

// Helper function to execute transactions
export const executeTransaction = async <T = any>(
  queries: Array<{ query: string; params?: any[] }>
): Promise<{ data: T | null; error: any }> => {
  let client: PoolClient | null = null;
  
  try {
    client = await pool.connect();
    await client.query('BEGIN');
    
    const results = [];
    for (const { query, params = [] } of queries) {
      const result = await client.query(query, params);
      results.push(result.rows);
    }
    
    await client.query('COMMIT');
    return { data: results, error: null };
  } catch (error) {
    if (client) {
      await client.query('ROLLBACK');
    }
    console.error('Database transaction error:', error);
    return { 
      data: null, 
      error: error instanceof Error ? error.message : 'Database transaction error' 
    };
  } finally {
    if (client) {
      client.release();
    }
  }
};

// Test database connection
export const testConnection = async (): Promise<boolean> => {
  try {
    const { data, error } = await executeQuery('SELECT NOW()');
    if (error) {
      console.error('Database connection test failed:', error);
      return false;
    }
    console.log('Database connection successful:', data);
    return true;
  } catch (error) {
    console.error('Database connection test failed:', error);
    return false;
  }
};

export { pool }; 