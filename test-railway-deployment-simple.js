#!/usr/bin/env node

const axios = require('axios');

// Common Railway URL patterns for this project
const POSSIBLE_URLS = [
    'https://lokal-backend-production.up.railway.app',
    'https://backend-production.up.railway.app',
    'https://lokal-production.up.railway.app',
    'https://web-production.up.railway.app'
];

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

async function testURL(url) {
    try {
        console.log(`\n${colors.cyan}🧪 Testing: ${colors.bold}${url}${colors.reset}`);
        
        const startTime = Date.now();
        const response = await axios.get(`${url}/api/health`, {
            timeout: 10000,
            headers: {
                'User-Agent': 'Railway-Diagnostic-Tool/1.0'
            }
        });
        const duration = Date.now() - startTime;
        
        success(`Health check passed (${duration}ms)`);
        
        if (response.data) {
            console.log(`   Status: ${response.data.status || 'Unknown'}`);
            console.log(`   Message: ${response.data.message || 'No message'}`);
            
            if (response.data.database) {
                info(`Database connected: ${response.data.database.isConnected ? 'Yes' : 'No'}`);
                if (response.data.database.supabase) {
                    info(`Supabase: Connected`);
                }
                if (response.data.database.redis) {
                    info(`Redis: ${response.data.database.redis}`);
                }
            }
            
            if (response.data.uptime) {
                info(`Uptime: ${Math.round(response.data.uptime)} seconds`);
            }
        }
        
        return { url, success: true, data: response.data };
        
    } catch (err) {
        if (err.code === 'ECONNABORTED') {
            error(`Timeout after 10 seconds`);
        } else if (err.response) {
            error(`HTTP ${err.response.status}: ${err.response.statusText}`);
        } else if (err.code === 'ENOTFOUND') {
            error(`URL not found or not accessible`);
        } else {
            error(`${err.message}`);
        }
        
        return { url, success: false, error: err.message };
    }
}

async function testSpecificEndpoints(baseUrl) {
    const endpoints = [
        '/api/health',
        '/api/health/database',
        '/api/health/ready',
        '/api/health/memory',
        '/api/health/cache'
    ];
    
    console.log(`\n${colors.bold}🔍 Testing individual endpoints for ${baseUrl}${colors.reset}`);
    
    for (const endpoint of endpoints) {
        try {
            const response = await axios.get(`${baseUrl}${endpoint}`, { timeout: 5000 });
            success(`${endpoint} - HTTP ${response.status}`);
        } catch (err) {
            if (err.response) {
                warning(`${endpoint} - HTTP ${err.response.status}`);
            } else {
                error(`${endpoint} - ${err.message}`);
            }
        }
    }
}

async function main() {
    console.log(`${colors.bold}${colors.blue}🚂 Railway Deployment Connectivity Test${colors.reset}`);
    console.log(`${colors.bold}=======================================${colors.reset}\n`);
    
    info('Based on your log URL, testing common Railway deployment patterns...\n');
    
    const customUrl = process.argv[2];
    let urlsToTest = customUrl ? [customUrl] : POSSIBLE_URLS;
    
    if (customUrl) {
        info(`Testing custom URL: ${customUrl}`);
    } else {
        info('Testing common Railway URL patterns for Lokal backend...');
    }
    
    const results = [];
    
    for (const url of urlsToTest) {
        const result = await testURL(url);
        results.push(result);
        
        if (result.success) {
            await testSpecificEndpoints(url);
            break; // Found working URL, no need to test others
        }
    }
    
    console.log(`\n${colors.bold}📊 RESULTS SUMMARY${colors.reset}`);
    console.log(`${colors.bold}==================${colors.reset}`);
    
    const workingUrls = results.filter(r => r.success);
    const failedUrls = results.filter(r => !r.success);
    
    if (workingUrls.length > 0) {
        success(`Found ${workingUrls.length} working deployment(s):`);
        workingUrls.forEach(result => {
            console.log(`   ${colors.green}➤${colors.reset} ${result.url}`);
        });
        
        console.log(`\n${colors.bold}🎯 DEPLOYMENT STATUS: HEALTHY${colors.reset}`);
        console.log('Your Railway deployment appears to be working correctly!');
        
    } else {
        error('No working deployments found');
        
        console.log(`\n${colors.bold}🚨 DEPLOYMENT STATUS: ISSUES DETECTED${colors.reset}`);
        console.log('\n📋 Troubleshooting steps:');
        console.log('1. Check your Railway dashboard for the correct deployment URL');
        console.log('2. Verify environment variables are properly set');
        console.log('3. Check Railway logs for specific error messages');
        console.log('4. Ensure your application is starting on the correct port');
        
        if (failedUrls.some(r => r.error.includes('ENOTFOUND'))) {
            console.log('\n🔍 URL Issues detected:');
            console.log('• The deployment URL might be different than expected');
            console.log('• Check your Railway project dashboard for the actual URL');
            console.log('• The service might not be deployed yet');
        }
        
        if (failedUrls.some(r => r.error.includes('timeout'))) {
            console.log('\n⏱️  Timeout Issues detected:');
            console.log('• Application might be starting up (can take 1-2 minutes)');
            console.log('• Check Railway logs for startup errors');
            console.log('• Verify database connections in logs');
        }
    }
    
    console.log(`\n${colors.bold}🔗 Quick Links:${colors.reset}`);
    console.log(`• Railway Project: https://railway.com/project/99309a7a-c4ea-45fd-90eb-a34d5ccfa3d0`);
    console.log(`• Deployment Logs: https://railway.com/project/99309a7a-c4ea-45fd-90eb-a34d5ccfa3d0/logs`);
    
    console.log(`\n${colors.bold}📞 Next Steps:${colors.reset}`);
    
    if (workingUrls.length > 0) {
        const workingUrl = workingUrls[0].url;
        console.log('1. Your deployment is working! You can now:');
        console.log(`   • Update your frontend apps to use: ${workingUrl}`);
        console.log(`   • Test all endpoints with: node diagnose-railway-deployment.js ${workingUrl}`);
        console.log('   • Monitor performance and logs regularly');
    } else {
        console.log('1. Get your actual Railway URL from the dashboard');
        console.log('2. Run this test again with your URL: node test-railway-deployment-simple.js <your-url>');
        console.log('3. Check Railway logs for specific error messages');
        console.log('4. Verify all environment variables are set correctly');
    }
    
    console.log(`\n${colors.dim}💡 Tip: Your Railway deployment URL can be found in your project dashboard under the "Deployments" tab.${colors.reset}\n`);
}

if (require.main === module) {
    main().catch(console.error);
}