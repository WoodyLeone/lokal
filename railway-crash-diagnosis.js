#!/usr/bin/env node

const axios = require('axios');

const PROJECT_ID = '99309a7a-c4ea-45fd-90eb-a34d5ccfa3d0';

const colors = {
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
    magenta: '\x1b[35m',
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
function critical(message) { log(colors.red, '🚨', message); }

async function testServices() {
    console.log(`${colors.bold}${colors.red}🚨 RAILWAY PROJECT CRASH DIAGNOSIS${colors.reset}`);
    console.log(`${colors.bold}====================================${colors.reset}\n`);
    
    critical('Project is crashing - Running emergency diagnosis...\n');
    
    info(`Project ID: ${PROJECT_ID}`);
    info(`Analyzing: Lokal Backend Node.js Application\n`);

    // Test external services that the app depends on
    console.log(`${colors.bold}🔍 TESTING EXTERNAL DEPENDENCIES${colors.reset}`);
    console.log(`${colors.bold}=================================${colors.reset}\n`);

    // Test Supabase
    await testSupabase();
    
    // Test Redis
    await testRedis();
    
    // Common crash patterns
    console.log(`\n${colors.bold}🚨 COMMON CRASH PATTERNS FOR YOUR APP${colors.reset}`);
    console.log(`${colors.bold}======================================${colors.reset}\n`);
    
    analyzeCrashPatterns();
    
    console.log(`\n${colors.bold}🔧 EMERGENCY FIX CHECKLIST${colors.reset}`);
    console.log(`${colors.bold}=========================${colors.reset}\n`);
    
    emergencyChecklist();
}

async function testSupabase() {
    try {
        info('Testing Supabase connectivity...');
        
        const supabaseUrl = 'https://sgiuzcfsjzsspnukgdtf.supabase.co';
        const response = await axios.get(`${supabaseUrl}/rest/v1/`, {
            timeout: 5000,
            headers: {
                'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNnaXV6Y2Zzanpzc3BudWtnZHRmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM2NDMwODUsImV4cCI6MjA2OTIxOTA4NX0.6tqRwlkTAYMBu149QQWdAJccHxrSilcY-KukT7ab0a8'
            }
        });
        
        success('Supabase is accessible and responding');
        
    } catch (err) {
        error(`Supabase connection failed: ${err.message}`);
        critical('This could be causing your app to crash during startup!');
        
        console.log(`\n   ${colors.yellow}Supabase Issues:${colors.reset}`);
        console.log('   • Check if SUPABASE_URL is correctly set in Railway');
        console.log('   • Verify SUPABASE_ANON_KEY is valid');
        console.log('   • Ensure SUPABASE_SERVICE_ROLE_KEY is set');
        console.log('   • Check if Supabase project is active');
    }
}

async function testRedis() {
    try {
        info('Testing Redis connectivity...');
        
        // Test Redis REST API
        const redisUrl = 'https://exact-sturgeon-62017.upstash.io';
        const response = await axios.post(`${redisUrl}/ping`, {}, {
            timeout: 5000,
            headers: {
                'Authorization': 'Bearer AfJBAAIjcDExOTg2MmU1YzI5ZDQ0ODNiODVlY2E5MGNiNjY4ZWFiY3AxMA'
            }
        });
        
        success('Redis/Upstash is accessible and responding');
        
    } catch (err) {
        error(`Redis connection failed: ${err.message}`);
        warning('Redis failure might not crash the app, but could affect performance');
        
        console.log(`\n   ${colors.yellow}Redis Issues:${colors.reset}`);
        console.log('   • Check if REDIS_URL is correctly set');
        console.log('   • Verify REDIS_PASSWORD is valid');
        console.log('   • Ensure Upstash Redis instance is active');
    }
}

function analyzeCrashPatterns() {
    console.log(`${colors.red}🔴 CRITICAL CRASH PATTERNS:${colors.reset}`);
    console.log('\n1. **Missing Environment Variables**');
    console.log('   Look for: "Error: Missing required environment variable"');
    console.log('   Solution: Check Railway Variables tab');
    
    console.log('\n2. **Database Connection Failure**');
    console.log('   Look for: "connect ECONNREFUSED" or "password authentication failed"');
    console.log('   Solution: Verify Supabase credentials');
    
    console.log('\n3. **Port Binding Issues**');
    console.log('   Look for: "EADDRINUSE" or "Port already in use"');
    console.log('   Solution: Ensure PORT variable is set to Railway assigned port');
    
    console.log('\n4. **Module/Dependency Issues**');
    console.log('   Look for: "Cannot find module" or "Module parse failed"');
    console.log('   Solution: Check package.json and rebuild');
    
    console.log('\n5. **Memory/Resource Issues**');
    console.log('   Look for: "JavaScript heap out of memory" or "killed"');
    console.log('   Solution: Increase memory limits or optimize code');
    
    console.log(`\n${colors.yellow}🟡 NODE.JS SPECIFIC CRASHES:${colors.reset}`);
    console.log('   • Unhandled promise rejections');
    console.log('   • Syntax errors in code');
    console.log('   • Invalid JSON in config files');
    console.log('   • Missing start script in package.json');
}

function emergencyChecklist() {
    console.log(`${colors.red}🚨 IMMEDIATE ACTIONS (Check these NOW):${colors.reset}\n`);
    
    console.log('□ 1. **Railway Dashboard → Variables Tab**');
    console.log('     Ensure ALL these variables are set:');
    console.log('     • PORT (Railway auto-assigns this)');
    console.log('     • NODE_ENV=production');
    console.log('     • SUPABASE_URL');
    console.log('     • SUPABASE_ANON_KEY');
    console.log('     • SUPABASE_SERVICE_ROLE_KEY');
    console.log('     • REDIS_URL');
    console.log('     • REDIS_PASSWORD');
    
    console.log('\n□ 2. **Railway Dashboard → Deployments Tab**');
    console.log('     • Check if build completed successfully');
    console.log('     • Look for build errors or failures');
    console.log('     • Note any timeout issues');
    
    console.log('\n□ 3. **Railway Dashboard → Logs Tab**');
    console.log('     • Look for the FIRST error message');
    console.log('     • Check for "Error:", "Failed:", or "Cannot"');
    console.log('     • Note any startup sequence failures');
    
    console.log('\n□ 4. **Check package.json**');
    console.log('     • Ensure "start" script exists');
    console.log('     • Verify main entry point is correct');
    console.log('     • Check for missing dependencies');
    
    console.log(`\n${colors.blue}🔧 QUICK FIXES TO TRY:${colors.reset}\n`);
    
    console.log('🔄 **Force Redeploy:**');
    console.log('   1. Go to Railway Deployments tab');
    console.log('   2. Click "Redeploy" on latest deployment');
    console.log('   3. Watch logs during redeploy');
    
    console.log('\n⚙️  **Environment Variables Reset:**');
    console.log('   1. Copy ALL variables from railway-env-vars.txt');
    console.log('   2. Paste them one by one in Railway Variables tab');
    console.log('   3. Save and redeploy');
    
    console.log('\n🔄 **Restart Service:**');
    console.log('   1. Railway Dashboard → Settings');
    console.log('   2. Find "Restart" or "Redeploy" option');
    console.log('   3. Monitor startup logs carefully');
    
    console.log(`\n${colors.green}✅ SUCCESS INDICATORS TO LOOK FOR:${colors.reset}`);
    console.log('   • "Server starting on port 3001"');
    console.log('   • "Database connection established"');
    console.log('   • "Redis connection ready"');
    console.log('   • No error messages in first 30 seconds');
    
    console.log(`\n${colors.magenta}📞 NEXT STEPS:${colors.reset}`);
    console.log('1. Check Railway logs and share the FIRST error message you see');
    console.log('2. Verify environment variables are set correctly');
    console.log('3. Try a redeploy and monitor the startup sequence');
    console.log('4. If still failing, share the exact error from Railway logs');
    
    console.log(`\n${colors.bold}🔗 Direct Links:${colors.reset}`);
    console.log(`• Project: https://railway.com/project/${PROJECT_ID}`);
    console.log(`• Variables: https://railway.com/project/${PROJECT_ID}/settings`);
    console.log(`• Logs: https://railway.com/project/${PROJECT_ID}/logs`);
    console.log(`• Deployments: https://railway.com/project/${PROJECT_ID}/deployments`);
}

async function main() {
    await testServices();
    
    console.log(`\n${colors.bold}${colors.red}🚨 PROJECT CRASH ANALYSIS COMPLETE${colors.reset}`);
    console.log(`${colors.bold}===================================${colors.reset}\n`);
    
    console.log(`${colors.yellow}💡 MOST LIKELY CAUSE: Missing or incorrect environment variables${colors.reset}`);
    console.log(`${colors.yellow}🎯 FASTEST FIX: Copy all variables from railway-env-vars.txt to Railway Variables tab${colors.reset}\n`);
    
    console.log(`${colors.cyan}📋 Share these with me if app still crashes:${colors.reset}`);
    console.log('• The FIRST error message from Railway logs');
    console.log('• Screenshot of Railway Variables tab');
    console.log('• Railway deployment URL (if any)');
}

if (require.main === module) {
    main().catch(console.error);
}