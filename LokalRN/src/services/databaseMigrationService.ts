import supabaseManager from './supabaseManager';

interface MigrationStep {
  id: string;
  description: string;
  execute: () => Promise<boolean>;
  rollback?: () => Promise<boolean>;
}

interface DatabaseVersion {
  version: number;
  appliedAt: string;
  steps: string[];
}

class DatabaseMigrationService {
  private migrations: MigrationStep[] = [];
  private currentVersion: number = 0;

  constructor() {
    this.initializeMigrations();
  }

  private initializeMigrations() {
    // Migration 1: Ensure basic video columns exist
    this.migrations.push({
      id: '001_basic_video_columns',
      description: 'Ensure basic video table columns exist',
      execute: async () => {
        try {
          const columns = await supabaseManager.getAvailableColumns('videos');
          const requiredColumns = ['id', 'title', 'description', 'video_url', 'user_id', 'created_at', 'updated_at'];
          
          const missingColumns = requiredColumns.filter(col => !columns.includes(col));
          
          if (missingColumns.length > 0) {
            console.log(`⚠️ Missing basic columns: ${missingColumns.join(', ')}`);
            return false;
          }
          
          console.log('✅ Basic video columns verified');
          return true;
        } catch (error) {
          console.error('❌ Migration 001 failed:', error);
          return false;
        }
      }
    });

    // Migration 2: Ensure extended video columns exist
    this.migrations.push({
      id: '002_extended_video_columns',
      description: 'Ensure extended video table columns exist',
      execute: async () => {
        try {
          const columns = await supabaseManager.getAvailableColumns('videos');
          const extendedColumns = [
            'manual_product_name', 'affiliate_link', 'object_category',
            'bounding_box_coordinates', 'final_product_name', 'matched_label',
            'ai_suggestions', 'user_confirmed'
          ];
          
          const availableExtendedColumns = extendedColumns.filter(col => columns.includes(col));
          
          if (availableExtendedColumns.length > 0) {
            console.log(`✅ Extended columns available: ${availableExtendedColumns.join(', ')}`);
          } else {
            console.log('📝 No extended columns available - using basic mode');
          }
          
          return true; // This migration always succeeds (graceful degradation)
        } catch (error) {
          console.error('❌ Migration 002 failed:', error);
          return true; // Continue anyway
        }
      }
    });

    // Migration 3: Ensure product_matches table exists
    this.migrations.push({
      id: '003_product_matches_table',
      description: 'Ensure product_matches table exists',
      execute: async () => {
        try {
          const columns = await supabaseManager.getAvailableColumns('product_matches');
          
          if (columns.length === 0) {
            console.log('📝 Product matches table not available - using demo mode');
            return true; // Continue anyway
          }
          
          console.log(`✅ Product matches table available with columns: ${columns.join(', ')}`);
          return true;
        } catch (error) {
          console.log('📝 Product matches table not available - using demo mode');
          return true; // Continue anyway
        }
      }
    });
  }

  // Run all pending migrations
  async runMigrations(): Promise<{ success: boolean; version: number }> {
    console.log('🔄 Starting database migrations...');
    
    try {
      for (let i = this.currentVersion; i < this.migrations.length; i++) {
        const migration = this.migrations[i];
        console.log(`📋 Running migration ${i + 1}: ${migration.description}`);
        
        const success = await migration.execute();
        
        if (success) {
          this.currentVersion = i + 1;
          console.log(`✅ Migration ${i + 1} completed successfully`);
        } else {
          console.log(`❌ Migration ${i + 1} failed - stopping`);
          return { success: false, version: this.currentVersion };
        }
      }
      
      console.log(`🎯 All migrations completed. Database version: ${this.currentVersion}`);
      return { success: true, version: this.currentVersion };
      
    } catch (error) {
      console.error('❌ Migration process failed:', error);
      return { success: false, version: this.currentVersion };
    }
  }

  // Get current database capabilities
  async getDatabaseCapabilities(): Promise<{
    basicVideoColumns: boolean;
    extendedVideoColumns: boolean;
    productMatchesTable: boolean;
    version: number;
  }> {
    try {
      const videoColumns = await supabaseManager.getAvailableColumns('videos');
      const productMatchColumns = await supabaseManager.getAvailableColumns('product_matches');
      
      const basicVideoColumns = ['id', 'title', 'description', 'video_url', 'user_id', 'created_at', 'updated_at']
        .every(col => videoColumns.includes(col));
      
      const extendedVideoColumns = [
        'manual_product_name', 'affiliate_link', 'object_category',
        'bounding_box_coordinates', 'final_product_name', 'matched_label',
        'ai_suggestions', 'user_confirmed'
      ].some(col => videoColumns.includes(col));
      
      const productMatchesTable = productMatchColumns.length > 0;
      
      return {
        basicVideoColumns,
        extendedVideoColumns,
        productMatchesTable,
        version: this.currentVersion
      };
      
    } catch (error) {
      console.error('❌ Error getting database capabilities:', error);
      return {
        basicVideoColumns: false,
        extendedVideoColumns: false,
        productMatchesTable: false,
        version: 0
      };
    }
  }

  // Refresh schema cache for all tables
  async refreshAllSchemas(): Promise<void> {
    console.log('🔄 Refreshing all schema caches...');
    
    try {
      await supabaseManager.refreshSchemaCache('videos');
      await supabaseManager.refreshSchemaCache('product_matches');
      console.log('✅ Schema caches refreshed');
    } catch (error) {
      console.error('❌ Schema cache refresh failed:', error);
    }
  }

  // Health check with detailed information
  async healthCheck(): Promise<{
    healthy: boolean;
    capabilities: any;
    version: number;
    error?: string;
  }> {
    try {
      const dbHealth = await supabaseManager.healthCheck();
      
      if (!dbHealth.healthy) {
        return {
          healthy: false,
          capabilities: null,
          version: 0,
          error: dbHealth.error
        };
      }
      
      const capabilities = await this.getDatabaseCapabilities();
      
      return {
        healthy: true,
        capabilities,
        version: this.currentVersion
      };
      
    } catch (error) {
      return {
        healthy: false,
        capabilities: null,
        version: 0,
        error: String(error)
      };
    }
  }
}

// Export singleton instance
export const databaseMigrationService = new DatabaseMigrationService();
export default databaseMigrationService; 