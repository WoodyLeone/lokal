import { ENV } from './env';

// React Native-compatible database configuration
// Instead of direct database connections, we'll make API calls to the backend

// Helper function to check if database is properly configured
export const isDatabaseConfigured = (): boolean => {
  return !!ENV.DATABASE_URL && ENV.DATABASE_URL !== 'YOUR_DATABASE_URL';
};

// Helper function to make API calls to the backend
export const executeQuery = async <T = any>(
  endpoint: string, 
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
  body?: any,
  authHeader?: string
): Promise<{ data: T | null; error: any }> => {
  try {
    const baseUrl = ENV.API_BASE_URL.replace('/api', '');
    const url = `${baseUrl}/api/database${endpoint}`;
    
    const options: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    // Add authorization header if provided
    if (authHeader) {
      options.headers = {
        ...options.headers,
        'Authorization': authHeader,
      };
    }

    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    return { data: result.data, error: null };
  } catch (error) {
    // Don't log 401 errors as they're expected when no authentication token is provided
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (!errorMessage.includes('401')) {
      console.error('API call error:', error);
    }
    return { 
      data: null, 
      error: error instanceof Error ? error.message : 'API call failed' 
    };
  }
};

// Helper function to execute transactions (simplified for React Native)
export const executeTransaction = async <T = any>(
  operations: Array<{ endpoint: string; method: 'GET' | 'POST' | 'PUT' | 'DELETE'; body?: any }>
): Promise<{ data: T | null; error: any }> => {
  try {
    const results = [];
    for (const operation of operations) {
      const result = await executeQuery(operation.endpoint, operation.method, operation.body);
      if (result.error) {
        return { data: null, error: result.error };
      }
      results.push(result.data);
    }
    return { data: results as T, error: null };
  } catch (error) {
    console.error('Transaction error:', error);
    return { 
      data: null, 
      error: error instanceof Error ? error.message : 'Transaction failed' 
    };
  }
};

// Test database connection via API
export const testConnection = async (): Promise<boolean> => {
  try {
    const { data, error } = await executeQuery('/test');
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

// Mock pool for compatibility (not used in React Native)
export const pool = {
  connect: async () => {
    throw new Error('Direct database connections not supported in React Native. Use API calls instead.');
  }
};

export const getDatabasePool = () => {
  throw new Error('Direct database connections not supported in React Native. Use API calls instead.');
}; 