import { createClient } from '@supabase/supabase-js';
import { ENV } from './env';

// Create Supabase client with proper configuration
const supabaseUrl = ENV.SUPABASE_URL;
const supabaseAnonKey = ENV.SUPABASE_ANON_KEY;

// Only create Supabase client if we have valid credentials
let supabase: any = null;

if (supabaseUrl !== 'YOUR_SUPABASE_URL' && supabaseAnonKey !== 'YOUR_SUPABASE_ANON_KEY') {
  try {
    supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    });
  } catch (error) {
    console.warn('Failed to create Supabase client:', error);
  }
}

export { supabase };

// Helper function to check if Supabase is properly configured
export const isSupabaseConfigured = (): boolean => {
  return supabase !== null;
};

// Helper function to get Supabase client
export const getSupabaseClient = () => {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase is not configured. Please check your environment variables.');
  }
  return supabase;
}; 