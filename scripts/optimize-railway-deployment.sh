#!/bin/bash

# Railway Deployment Optimization Script
# This script optimizes the Railway deployment for better performance

set -e

echo "🚂 Optimizing Railway Deployment for Lokal Backend..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the correct directory
check_directory() {
    print_status "Checking project structure..."
    if [ ! -f "railway.json" ]; then
        print_error "railway.json not found. Please run this script from the project root."
        exit 1
    fi
    if [ ! -f "backend/package.json" ]; then
        print_error "backend/package.json not found. Please run this script from the project root."
        exit 1
    fi
    print_success "Project structure is correct"
}

# Optimize package.json for production
optimize_package_json() {
    print_status "Optimizing package.json for production..."
    
    cd backend
    
    # Check if we have production scripts
    if ! grep -q '"start":' package.json; then
        print_warning "No start script found in package.json"
        print_status "Adding optimized start script..."
        
        # Add optimized start script
        node -e "
        const fs = require('fs');
        const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
        pkg.scripts.start = 'node --max-old-space-size=512 --expose-gc --optimize-for-size app.js';
        pkg.scripts.start:prod = 'NODE_ENV=production node --max-old-space-size=512 --expose-gc --optimize-for-size app.js';
        fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));
        "
        print_success "Added optimized start scripts"
    fi
    
    cd ..
}

# Create optimized environment configuration
create_optimized_env() {
    print_status "Creating optimized environment configuration..."
    
    # Create production environment file
    cat > backend/env.production << EOF
# Lokal Backend Production Environment Configuration
# Optimized for Railway deployment

# =============================================================================
# SERVER CONFIGURATION
# =============================================================================
PORT=3001
NODE_ENV=production

# =============================================================================
# PERFORMANCE OPTIMIZATION
# =============================================================================
# Enable compression
ENABLE_COMPRESSION=true
COMPRESSION_LEVEL=6

# Connection pooling
MAX_CONNECTIONS=1000
KEEP_ALIVE_TIMEOUT=65000
HEADERS_TIMEOUT=66000

# Rate limiting (more permissive for production)
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=1000

# Caching
CACHE_TTL=1800
CACHE_TTL_PRODUCTS=3600
CACHE_TTL_DETECTION=7200
CACHE_TTL_MATCHING=1800

# Logging (minimal for production)
LOG_LEVEL=info
ENABLE_MORGAN=false

# Security
ENABLE_HELMET=true
ENABLE_CORS=true

# =============================================================================
# RAILWAY POSTGRESQL CONFIGURATION
# =============================================================================
DATABASE_URL=postgresql://postgres:olgtwNjDXPQbkNNuknFliLDomEKjaLTK@mainline.proxy.rlwy.net:25135/railway

# =============================================================================
# REDIS CONFIGURATION
# =============================================================================
REDIS_URL=https://exact-sturgeon-62017.upstash.io
REDIS_HOST=exact-sturgeon-62017.upstash.io
REDIS_PORT=6379
REDIS_PASSWORD=AfJBAAIjcDExOTg2MmU1YzI5ZDQ0ODNiODVlY2E5MGNiNjY4ZWFiY3AxMA
REDIS_DB=1

# =============================================================================
# YOLO CONFIGURATION (Production - Higher confidence)
# =============================================================================
YOLO_CONFIDENCE_THRESHOLD=0.5
YOLO_MODEL=yolov8n.pt

# =============================================================================
# PRODUCTION SPECIFIC SETTINGS
# =============================================================================
DEMO_MODE=false
PRODUCTION_MATCHING=true
ENABLE_FEEDBACK=true
ENABLE_LEARNING=true
DETECTION_CONFIDENCE_THRESHOLD=0.5
SUGGESTION_RELEVANCE_THRESHOLD=0.5
DEBUG_MODE=false
ENABLE_DEMO_FALLBACK=false

# =============================================================================
# MONITORING AND ALERTS
# =============================================================================
HEALTH_CHECK_INTERVAL=30000
HEALTH_CHECK_TIMEOUT=5000
ENABLE_METRICS=true
METRICS_INTERVAL=60

# =============================================================================
# UPSTASH REDIS CONFIGURATION
# =============================================================================
UPSTASH_REDIS_REST_URL=https://exact-sturgeon-62017.upstash.io
UPSTASH_REDIS_REST_TOKEN=AfJBAAIjcDExOTg2MmU1YzI5ZDQ0ODNiODVlY2E5MGNiNjY4ZWFiY3AxMA
EOF

    print_success "Created optimized production environment configuration"
}

# Update Railway configuration
update_railway_config() {
    print_status "Updating Railway configuration for optimization..."
    
    # Backup current configuration
    cp railway.json railway.json.backup
    print_success "Backed up current Railway configuration"
    
    # Update with optimized configuration
    cat > railway.json << EOF
{
  "\$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "cd backend && npm ci --only=production"
  },
  "deploy": {
    "startCommand": "cd backend && npm start",
    "healthcheckPath": "/api/health",
    "healthcheckTimeout": 300,
    "healthcheckInterval": 30,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 5,
    "numReplicas": 1,
    "maxReplicas": 3
  }
}
EOF

    print_success "Updated Railway configuration with optimizations"
}

# Create performance monitoring script
create_monitoring_script() {
    print_status "Creating performance monitoring script..."
    
    cat > scripts/monitor-performance.js << 'EOF'
#!/usr/bin/env node

const https = require('https');

class PerformanceMonitor {
  constructor() {
    this.baseURL = 'https://lokal-dev-production.up.railway.app';
    this.metrics = [];
  }

  async checkHealth() {
    return new Promise((resolve) => {
      const startTime = Date.now();
      
      const req = https.get(`${this.baseURL}/api/health`, (res) => {
        const endTime = Date.now();
        const latency = endTime - startTime;
        
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const healthData = JSON.parse(data);
            resolve({
              timestamp: new Date().toISOString(),
              status: res.statusCode,
              latency,
              uptime: healthData.uptime,
              memory: healthData.memory,
              database: healthData.database
            });
          } catch (e) {
            resolve({
              timestamp: new Date().toISOString(),
              status: res.statusCode,
              latency,
              error: 'Failed to parse response'
            });
          }
        });
      });
      
      req.on('error', (error) => {
        resolve({
          timestamp: new Date().toISOString(),
          status: 0,
          latency: 0,
          error: error.message
        });
      });
      
      req.setTimeout(10000, () => {
        req.destroy();
        resolve({
          timestamp: new Date().toISOString(),
          status: 0,
          latency: 0,
          error: 'Timeout'
        });
      });
    });
  }

  async monitor(interval = 60000) {
    console.log(`🚀 Starting performance monitoring (${interval/1000}s intervals)...`);
    
    const check = async () => {
      const result = await this.checkHealth();
      this.metrics.push(result);
      
      // Keep only last 100 metrics
      if (this.metrics.length > 100) {
        this.metrics = this.metrics.slice(-100);
      }
      
      const status = result.status === 200 ? '✅' : '❌';
      console.log(`${status} [${result.timestamp}] Status: ${result.status}, Latency: ${result.latency}ms`);
      
      // Alert if latency is too high
      if (result.latency > 2000) {
        console.log(`⚠️  HIGH LATENCY ALERT: ${result.latency}ms`);
      }
      
      // Alert if service is down
      if (result.status !== 200) {
        console.log(`🚨 SERVICE DOWN ALERT: Status ${result.status}`);
      }
    };
    
    // Initial check
    await check();
    
    // Set up interval
    setInterval(check, interval);
  }

  getStats() {
    const successfulMetrics = this.metrics.filter(m => m.status === 200);
    
    if (successfulMetrics.length === 0) {
      return { error: 'No successful metrics available' };
    }
    
    const latencies = successfulMetrics.map(m => m.latency);
    const avgLatency = latencies.reduce((sum, l) => sum + l, 0) / latencies.length;
    const minLatency = Math.min(...latencies);
    const maxLatency = Math.max(...latencies);
    
    return {
      totalChecks: this.metrics.length,
      successfulChecks: successfulMetrics.length,
      successRate: (successfulMetrics.length / this.metrics.length) * 100,
      avgLatency: avgLatency.toFixed(0),
      minLatency,
      maxLatency,
      uptime: successfulMetrics[successfulMetrics.length - 1]?.uptime || 'Unknown'
    };
  }
}

// Run monitoring if called directly
if (require.main === module) {
  const monitor = new PerformanceMonitor();
  monitor.monitor();
  
  // Show stats every 5 minutes
  setInterval(() => {
    const stats = monitor.getStats();
    console.log('\n📊 Performance Stats:', stats);
  }, 300000);
}

module.exports = PerformanceMonitor;
EOF

    chmod +x scripts/monitor-performance.js
    print_success "Created performance monitoring script"
}

# Deploy optimized configuration
deploy_optimized_config() {
    print_status "Deploying optimized configuration to Railway..."
    
    # Check if Railway CLI is available
    if ! command -v railway &> /dev/null; then
        print_error "Railway CLI is not installed. Please install it first:"
        echo "npm install -g @railway/cli"
        exit 1
    fi
    
    # Deploy to Railway
    if railway up; then
        print_success "Optimized configuration deployed to Railway!"
    else
        print_error "Failed to deploy optimized configuration"
        exit 1
    fi
}

# Main execution
main() {
    echo "🚀 Railway Deployment Optimization for Lokal Backend"
    echo "=================================================="
    echo ""
    
    check_directory
    optimize_package_json
    create_optimized_env
    update_railway_config
    create_monitoring_script
    
    echo ""
    print_success "Optimization complete!"
    echo ""
    echo "📋 What was optimized:"
    echo "   ✅ Production-ready package.json scripts"
    echo "   ✅ Optimized environment configuration"
    echo "   ✅ Enhanced Railway deployment settings"
    echo "   ✅ Performance monitoring script"
    echo ""
    echo "🚀 To deploy the optimized configuration:"
    echo "   ./scripts/optimize-railway-deployment.sh --deploy"
    echo ""
    echo "📊 To monitor performance:"
    echo "   node scripts/monitor-performance.js"
    echo ""
}

# Check for deploy flag
if [[ "$1" == "--deploy" ]]; then
    main
    deploy_optimized_config
else
    main
fi 