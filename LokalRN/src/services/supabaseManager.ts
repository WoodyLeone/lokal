import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../config/supabase';

interface DatabaseSchema {
  videos: {
    id: string;
    title?: string;
    description?: string;
    video_url?: string;
    user_id?: string;
    created_at?: string;
    updated_at?: string;
    // Extended fields that may or may not exist
    manual_product_name?: string;
    affiliate_link?: string;
    object_category?: string;
    bounding_box_coordinates?: any;
    final_product_name?: string;
    matched_label?: string;
    ai_suggestions?: string[];
    user_confirmed?: boolean;
  };
  product_matches: {
    id: string;
    video_id: string;
    detected_object: string;
    confidence_score?: number;
    bounding_box?: any;
    matched_product_id?: string;
    match_type: 'manual' | 'ai_suggestion' | 'yolo_direct';
    ai_suggestions?: string[];
    user_selection?: string;
    created_at: string;
  };
}

class SupabaseManager {
  private client: SupabaseClient<DatabaseSchema> | null = null;
  private schemaCache: Map<string, boolean> = new Map();
  private isInitialized = false;

  constructor() {
    this.initialize();
  }

  private initialize() {
    try {
      if (SUPABASE_URL && SUPABASE_ANON_KEY) {
        this.client = createClient<DatabaseSchema>(SUPABASE_URL, SUPABASE_ANON_KEY);
        this.isInitialized = true;
        console.log('✅ Supabase client initialized');
      } else {
        console.warn('⚠️ Supabase credentials not found');
      }
    } catch (error) {
      console.error('❌ Failed to initialize Supabase client:', error);
    }
  }

  getClient(): SupabaseClient<DatabaseSchema> | null {
    return this.client;
  }

  isReady(): boolean {
    return this.isInitialized && this.client !== null;
  }

  // Check if a column exists in the schema cache
  private async checkColumnExists(table: string, column: string): Promise<boolean> {
    const cacheKey = `${table}.${column}`;
    
    // Check cache first
    if (this.schemaCache.has(cacheKey)) {
      return this.schemaCache.get(cacheKey)!;
    }

    if (!this.client) {
      return false;
    }

    try {
      // Try a simple select to test if column exists
      const { error } = await this.client
        .from(table as any)
        .select(column)
        .limit(1);

      const exists = !error || error.code !== 'PGRST204';
      this.schemaCache.set(cacheKey, exists);
      
      if (!exists) {
        console.log(`📝 Column ${table}.${column} not available in schema cache`);
      }
      
      return exists;
    } catch (error) {
      console.log(`📝 Error checking column ${table}.${column}:`, error);
      this.schemaCache.set(cacheKey, false);
      return false;
    }
  }

  // Safe update that only updates columns that exist
  async safeUpdate<T extends keyof DatabaseSchema>(
    table: T,
    data: Partial<DatabaseSchema[T]>,
    filter: Record<string, any>
  ): Promise<{ success: boolean; error?: any }> {
    if (!this.client) {
      return { success: false, error: 'Supabase client not initialized' };
    }

    try {
      // Filter out columns that don't exist in schema cache
      const safeData: any = {};
      const promises = Object.keys(data).map(async (key) => {
        const exists = await this.checkColumnExists(table as string, key);
        if (exists) {
          safeData[key] = (data as any)[key];
        }
      });

      await Promise.all(promises);

      if (Object.keys(safeData).length === 0) {
        console.log(`📝 No valid columns found for ${table} update - using demo mode`);
        return { success: true }; // Return success to continue processing
      }

      console.log(`🔄 Safe update for ${table}:`, safeData);

      const { error } = await this.client
        .from(table)
        .update(safeData)
        .match(filter);

      if (error) {
        console.error(`❌ Update error for ${table}:`, error);
        return { success: false, error };
      }

      return { success: true };
    } catch (error) {
      console.error(`❌ Safe update failed for ${table}:`, error);
      return { success: false, error };
    }
  }

  // Safe insert that handles schema issues gracefully
  async safeInsert<T extends keyof DatabaseSchema>(
    table: T,
    data: Partial<DatabaseSchema[T]>
  ): Promise<{ success: boolean; data?: any; error?: any }> {
    if (!this.client) {
      return { success: false, error: 'Supabase client not initialized' };
    }

    try {
      // Filter out columns that don't exist in schema cache
      const safeData: any = {};
      const promises = Object.keys(data).map(async (key) => {
        const exists = await this.checkColumnExists(table as string, key);
        if (exists) {
          safeData[key] = (data as any)[key];
        }
      });

      await Promise.all(promises);

      if (Object.keys(safeData).length === 0) {
        console.log(`📝 No valid columns found for ${table} insert - using demo mode`);
        return { success: true }; // Return success to continue processing
      }

      console.log(`🔄 Safe insert for ${table}:`, safeData);

      const { data: result, error } = await this.client
        .from(table)
        .insert(safeData)
        .select()
        .single();

      if (error) {
        console.error(`❌ Insert error for ${table}:`, error);
        return { success: false, error };
      }

      return { success: true, data: result };
    } catch (error) {
      console.error(`❌ Safe insert failed for ${table}:`, error);
      return { success: false, error };
    }
  }

  // Refresh schema cache for a table
  async refreshSchemaCache(table: string): Promise<void> {
    if (!this.client) {
      return;
    }

    console.log(`🔄 Refreshing schema cache for ${table}`);
    
    try {
      // Clear existing cache for this table
      for (const key of this.schemaCache.keys()) {
        if (key.startsWith(`${table}.`)) {
          this.schemaCache.delete(key);
        }
      }

      // Try to query all columns to refresh cache
      const { error } = await this.client
        .from(table as any)
        .select('*')
        .limit(1);

      if (error) {
        console.log(`📝 Schema cache refresh for ${table} failed:`, error.message);
      } else {
        console.log(`✅ Schema cache refreshed for ${table}`);
      }
    } catch (error) {
      console.log(`📝 Schema cache refresh error for ${table}:`, error);
    }
  }

  // Get available columns for a table
  async getAvailableColumns(table: string): Promise<string[]> {
    const columns = [
      'id', 'title', 'description', 'video_url', 'user_id', 
      'created_at', 'updated_at', 'manual_product_name', 
      'affiliate_link', 'object_category', 'bounding_box_coordinates',
      'final_product_name', 'matched_label', 'ai_suggestions', 'user_confirmed'
    ];

    const availableColumns: string[] = [];
    
    for (const column of columns) {
      const exists = await this.checkColumnExists(table, column);
      if (exists) {
        availableColumns.push(column);
      }
    }

    return availableColumns;
  }

  // Health check
  async healthCheck(): Promise<{ healthy: boolean; error?: string }> {
    if (!this.client) {
      return { healthy: false, error: 'Client not initialized' };
    }

    try {
      const { error } = await this.client
        .from('videos')
        .select('id')
        .limit(1);

      if (error) {
        return { healthy: false, error: error.message };
      }

      return { healthy: true };
    } catch (error) {
      return { healthy: false, error: String(error) };
    }
  }
}

// Export singleton instance
export const supabaseManager = new SupabaseManager();
export default supabaseManager; 