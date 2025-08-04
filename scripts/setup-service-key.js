#!/usr/bin/env node

/**
 * Set up service role key for backend
 */

console.log('🔑 Setting up Service Role Key for Backend...\n');

console.log('📋 Steps to enable database access:');
console.log('');
console.log('1️⃣ Get your Service Role Key:');
console.log('   - Go to your Supabase dashboard');
console.log('   - Navigate to Settings > API');
console.log('   - Copy the "service_role" key (NOT the anon key)');
console.log('');
console.log('2️⃣ Add to backend environment:');
console.log('   - Open backend/.env');
console.log('   - Add: SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here');
console.log('');
console.log('3️⃣ Update backend database config:');
console.log('   - The backend will automatically use service role when available');
console.log('   - This bypasses RLS for backend operations');
console.log('');
console.log('4️⃣ Test the connection:');
console.log('   - Run: cd backend && npm run test:backend');
console.log('');
console.log('⚠️  Security Note:');
console.log('   - Service role key has full database access');
console.log('   - Keep it secure and never expose it to the frontend');
console.log('   - Only use it in your backend server');
console.log('');
console.log('🎯 This will allow the backend to:');
console.log('   ✅ Save videos to database');
console.log('   ✅ Update video status');
console.log('   ✅ Access all video data');
console.log('   ✅ Bypass RLS policies'); 