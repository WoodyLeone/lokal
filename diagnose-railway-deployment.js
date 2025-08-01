#!/usr/bin/env node

const axios = require('axios');
const { performance } = require('perf_hooks');

// Get Railway URL from command line or environment
const RAILWAY_URL = process.argv[2] || process.env.RAILWAY_URL || 'https://lokal-backend-production.up.railway.app';

const colors = {
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
    reset: '\x1b[0m',
    bold: '\x1b[1m'
};

function log(color, symbol, message) {
    console.log(`${color}${symbol}${colors.reset} ${message}`);
}

function success(message) { log(colors.green, '✅', message); }
function error(message) { log(colors.red, '❌', message); }
function warning(message) { log(colors.yellow, '⚠️ ', message); }
function info(message) { log(colors.blue, 'ℹ️ ', message); }
function testing(message) { log(colors.cyan, '🧪', message); }

async function testEndpoint(url, description, timeout = 10000) {
    const start = performance.now();
    try {
        testing(`Testing ${description}...`);
        const response = await axios.get(url, { 
            timeout,
            headers: {
                'User-Agent': 'Railway-Diagnostic-Tool/1.0'
            }
        });
        const duration = Math.round(performance.now() - start);
        
        success(`${description} - ${response.status} (${duration}ms)`);
        return { success: true, data: response.data, status: response.status, duration };
    } catch (err) {
        const duration = Math.round(performance.now() - start);
        
        if (err.code === 'ECONNABORTED') {
            error(`${description} - Timeout after ${timeout}ms`);
        } else if (err.response) {
            error(`${description} - ${err.response.status} ${err.response.statusText} (${duration}ms)`);
            if (err.response.data) {
                console.log(`   Response: ${JSON.stringify(err.response.data, null, 2)}`);
            }
        } else {
            error(`${description} - ${err.message} (${duration}ms)`);
        }
        
        return { success: false, error: err.message, duration };
    }
}

async function diagnoseDeployment() {
    console.log(`${colors.bold}${colors.blue}🚂 Railway Deployment Diagnostic Tool${colors.reset}`);
    console.log(`${colors.bold}===========================================${colors.reset}\n`);
    
    info(`Target URL: ${RAILWAY_URL}`);
    info(`Timestamp: ${new Date().toISOString()}\n`);

    const tests = [
        // Basic connectivity
        { url: `${RAILWAY_URL}`, desc: 'Root endpoint' },
        { url: `${RAILWAY_URL}/api/health`, desc: 'Health check' },
        { url: `${RAILWAY_URL}/api/health/live`, desc: 'Liveness probe' },
        { url: `${RAILWAY_URL}/api/health/ready`, desc: 'Readiness probe' },
        
        // Database connectivity
        { url: `${RAILWAY_URL}/api/health/database`, desc: 'Database health' },
        { url: `${RAILWAY_URL}/api/health/cache`, desc: 'Cache health' },
        
        // Performance
        { url: `${RAILWAY_URL}/api/health/memory`, desc: 'Memory status' },
        { url: `${RAILWAY_URL}/api/health/connection`, desc: 'Connection status' },
        
        // API endpoints
        { url: `${RAILWAY_URL}/api/products`, desc: 'Products endpoint' },
        { url: `${RAILWAY_URL}/api/videos`, desc: 'Videos endpoint' }
    ];

    const results = [];
    let successCount = 0;
    
    for (const test of tests) {
        const result = await testEndpoint(test.url, test.desc);
        results.push({ ...test, ...result });
        if (result.success) successCount++;
        
        // Add a small delay between tests
        await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log(`\n${colors.bold}📊 SUMMARY${colors.reset}`);
    console.log(`${colors.bold}==========${colors.reset}`);
    
    const totalTests = tests.length;
    const failureCount = totalTests - successCount;
    
    if (successCount === totalTests) {
        success(`All ${totalTests} tests passed! 🎉`);
        success('Your Railway deployment is healthy and responding correctly.');
    } else {
        warning(`${successCount}/${totalTests} tests passed (${failureCount} failures)`);
        
        if (failureCount > 0) {
            console.log(`\n${colors.bold}🔍 FAILED TESTS:${colors.reset}`);
            results.filter(r => !r.success).forEach(r => {
                error(`${r.desc}: ${r.error || 'Unknown error'}`);
            });
        }
    }

    // Health check analysis
    const healthCheck = results.find(r => r.desc === 'Health check');
    if (healthCheck && healthCheck.success) {
        console.log(`\n${colors.bold}🏥 HEALTH CHECK ANALYSIS${colors.reset}`);
        console.log(`${colors.bold}========================${colors.reset}`);
        
        const health = healthCheck.data;
        info(`Status: ${health.status}`);
        info(`Uptime: ${Math.round(health.uptime)} seconds`);
        info(`Memory RSS: ${Math.round(health.memory.rss / 1024 / 1024)}MB`);
        
        if (health.database) {
            console.log(`\n${colors.cyan}📀 Database Status:${colors.reset}`);
            info(`Connected: ${health.database.isConnected ? 'Yes' : 'No'}`);
            info(`Supabase: ${health.database.supabase ? 'Connected' : 'Disconnected'}`);
            info(`Redis: ${health.database.redis}`);
            info(`Cache: ${health.database.cache ? 'Available' : 'Unavailable'}`);
        }
        
        if (health.features) {
            console.log(`\n${colors.cyan}🎯 Features Status:${colors.reset}`);
            Object.entries(health.features).forEach(([key, value]) => {
                info(`${key}: ${value}`);
            });
        }
    }

    // Performance analysis
    const avgResponseTime = results
        .filter(r => r.success)
        .reduce((sum, r) => sum + r.duration, 0) / successCount;
    
    console.log(`\n${colors.bold}⚡ PERFORMANCE${colors.reset}`);
    console.log(`${colors.bold}=============${colors.reset}`);
    info(`Average response time: ${Math.round(avgResponseTime)}ms`);
    
    const slowTests = results.filter(r => r.duration > 2000);
    if (slowTests.length > 0) {
        warning('Slow responses detected:');
        slowTests.forEach(t => {
            warning(`  ${t.desc}: ${t.duration}ms`);
        });
    }

    console.log(`\n${colors.bold}🔧 TROUBLESHOOTING GUIDE${colors.reset}`);
    console.log(`${colors.bold}========================${colors.reset}`);
    
    if (failureCount > 0) {
        console.log('\n📋 Common issues to check in Railway logs:');
        console.log('   • Environment variables missing or incorrect');
        console.log('   • Database connection failures (Supabase/Redis)');
        console.log('   • Memory limits exceeded');
        console.log('   • Port binding issues');
        console.log('   • Build/deployment failures');
        console.log('   • Application startup errors');
        
        console.log('\n🔍 In Railway logs, look for:');
        console.log('   • Error messages during startup');
        console.log('   • Database connection errors');
        console.log('   • "EADDRINUSE" or port conflicts');
        console.log('   • Memory or timeout errors');
        console.log('   • Missing environment variables warnings');
    }
    
    console.log('\n📱 Next steps:');
    console.log('   1. Check Railway logs for any error messages');
    console.log('   2. Verify all environment variables are set correctly');
    console.log('   3. Check Supabase and Redis connectivity');
    console.log('   4. Monitor memory usage and performance');
    console.log('   5. Test specific API endpoints that failed');
    
    console.log(`\n${colors.bold}🌐 Deployment URL: ${RAILWAY_URL}${colors.reset}`);
    console.log(`${colors.bold}📊 Test completed at: ${new Date().toISOString()}${colors.reset}\n`);
}

// Handle command line usage
if (require.main === module) {
    if (process.argv.includes('--help') || process.argv.includes('-h')) {
        console.log('Railway Deployment Diagnostic Tool');
        console.log('');
        console.log('Usage:');
        console.log('  node diagnose-railway-deployment.js [URL]');
        console.log('');
        console.log('Examples:');
        console.log('  node diagnose-railway-deployment.js https://your-app.up.railway.app');
        console.log('  RAILWAY_URL=https://your-app.up.railway.app node diagnose-railway-deployment.js');
        console.log('');
    } else {
        diagnoseDeployment().catch(console.error);
    }
}

module.exports = { diagnoseDeployment, testEndpoint };