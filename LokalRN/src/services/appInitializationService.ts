import supabaseManager from './supabaseManager';
import databaseMigrationService from './databaseMigrationService';

interface AppStatus {
  initialized: boolean;
  databaseReady: boolean;
  migrationsComplete: boolean;
  capabilities: any;
  errors: string[];
}

class AppInitializationService {
  private status: AppStatus = {
    initialized: false,
    databaseReady: false,
    migrationsComplete: false,
    capabilities: null,
    errors: []
  };

  private initializationPromise: Promise<AppStatus> | null = null;

  // Initialize the app (singleton pattern)
  async initialize(): Promise<AppStatus> {
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = this.performInitialization();
    return this.initializationPromise;
  }

  private async performInitialization(): Promise<AppStatus> {
    console.log('🚀 Starting app initialization...');
    
    try {
      // Step 1: Initialize Supabase manager
      console.log('📋 Step 1: Initializing Supabase manager...');
      await this.waitForSupabase();
      
      if (supabaseManager.isReady()) {
        this.status.databaseReady = true;
        console.log('✅ Supabase manager initialized');
      } else {
        this.status.errors.push('Supabase manager failed to initialize');
        console.log('⚠️ Supabase manager not ready - continuing in demo mode');
      }

      // Step 2: Run database migrations
      console.log('📋 Step 2: Running database migrations...');
      if (this.status.databaseReady) {
        const migrationResult = await databaseMigrationService.runMigrations();
        this.status.migrationsComplete = migrationResult.success;
        
        if (migrationResult.success) {
          console.log('✅ Database migrations completed');
        } else {
          console.log('⚠️ Database migrations failed - continuing in demo mode');
        }
      } else {
        console.log('📝 Skipping migrations - database not ready');
      }

      // Step 3: Get database capabilities
      console.log('📋 Step 3: Checking database capabilities...');
      if (this.status.databaseReady) {
        this.status.capabilities = await databaseMigrationService.getDatabaseCapabilities();
        console.log('✅ Database capabilities assessed:', this.status.capabilities);
      } else {
        this.status.capabilities = {
          basicVideoColumns: false,
          extendedVideoColumns: false,
          productMatchesTable: false,
          version: 0
        };
        console.log('📝 Using demo capabilities');
      }

      // Step 4: Refresh schema caches
      console.log('📋 Step 4: Refreshing schema caches...');
      if (this.status.databaseReady) {
        await databaseMigrationService.refreshAllSchemas();
        console.log('✅ Schema caches refreshed');
      } else {
        console.log('📝 Skipping schema refresh - database not ready');
      }

      this.status.initialized = true;
      console.log('🎯 App initialization completed successfully');
      
      return this.status;

    } catch (error) {
      console.error('❌ App initialization failed:', error);
      this.status.errors.push(String(error));
      this.status.initialized = true; // Mark as initialized even with errors
      return this.status;
    }
  }

  private async waitForSupabase(timeoutMs: number = 10000): Promise<void> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeoutMs) {
      if (supabaseManager.isReady()) {
        return;
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log('⏰ Supabase initialization timeout - continuing anyway');
  }

  // Get current app status
  getStatus(): AppStatus {
    return { ...this.status };
  }

  // Check if app is ready for use
  isReady(): boolean {
    return this.status.initialized;
  }

  // Get database capabilities
  getCapabilities(): any {
    return this.status.capabilities;
  }

  // Force re-initialization
  async reinitialize(): Promise<AppStatus> {
    console.log('🔄 Forcing app re-initialization...');
    this.initializationPromise = null;
    this.status = {
      initialized: false,
      databaseReady: false,
      migrationsComplete: false,
      capabilities: null,
      errors: []
    };
    return this.initialize();
  }

  // Health check
  async healthCheck(): Promise<{
    healthy: boolean;
    status: AppStatus;
    details: any;
  }> {
    try {
      const dbHealth = await databaseMigrationService.healthCheck();
      
      return {
        healthy: this.status.initialized && (dbHealth.healthy || this.status.errors.length === 0),
        status: this.getStatus(),
        details: {
          database: dbHealth,
          supabase: supabaseManager.isReady()
        }
      };
    } catch (error) {
      return {
        healthy: false,
        status: this.getStatus(),
        details: { error: String(error) }
      };
    }
  }

  // Get initialization errors
  getErrors(): string[] {
    return [...this.status.errors];
  }

  // Clear errors
  clearErrors(): void {
    this.status.errors = [];
  }
}

// Export singleton instance
export const appInitializationService = new AppInitializationService();
export default appInitializationService; 