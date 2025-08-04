#!/usr/bin/env node

const https = require('https');

class PerformanceMonitor {
  constructor() {
    this.baseURL = 'https://lokal-prod-production.up.railway.app';
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
