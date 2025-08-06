const { Pool } = require('pg');
require('dotenv').config({ path: '../env.production' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false
});

// Comprehensive function to validate video URL
function isValidVideoUrl(url) {
  if (!url || typeof url !== 'string') {
    return false;
  }
  
  // Check for invalid URL patterns
  const invalidPatterns = [
    /^demo:\/\//, // demo:// protocol
    /^example\.com/, // example.com domain
    /^sample-videos\.com/, // sample-videos.com domain
    /^https?:\/\/localhost/, // localhost URLs
    /^https?:\/\/127\.0\.0\.1/, // localhost IP
    /^file:\/\//, // file:// protocol (not accessible from mobile)
  ];
  
  for (const pattern of invalidPatterns) {
    if (pattern.test(url)) {
      return false;
    }
  }
  
  // Check if it's a valid HTTP/HTTPS URL
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch {
    return false;
  }
}

async function cleanupAllBadVideos() {
  try {
    console.log('🔍 Starting comprehensive cleanup of bad videos...');
    
    // Get all videos
    const result = await pool.query('SELECT id, title, video_url FROM videos');
    
    if (result.rows.length === 0) {
      console.log('✅ No videos found in database');
      return;
    }
    
    console.log(`📊 Found ${result.rows.length} videos in database`);
    
    const invalidVideos = [];
    const validVideos = [];
    
    // Check each video
    for (const video of result.rows) {
      if (!isValidVideoUrl(video.video_url)) {
        invalidVideos.push(video);
        console.log(`❌ Invalid video: ${video.title} (${video.video_url})`);
      } else {
        validVideos.push(video);
        console.log(`✅ Valid video: ${video.title} (${video.video_url})`);
      }
    }
    
    console.log(`\n📈 Summary:`);
    console.log(`   Valid videos: ${validVideos.length}`);
    console.log(`   Invalid videos: ${invalidVideos.length}`);
    
    if (invalidVideos.length === 0) {
      console.log('✅ No invalid videos to clean up');
      return;
    }
    
    // Delete invalid videos
    console.log('\n🗑️  Deleting invalid videos...');
    for (const video of invalidVideos) {
      try {
        await pool.query('DELETE FROM videos WHERE id = $1', [video.id]);
        console.log(`   ✅ Deleted: ${video.title}`);
      } catch (error) {
        console.error(`   ❌ Failed to delete ${video.title}:`, error.message);
      }
    }
    
    console.log('\n✅ Cleanup completed successfully!');
    
    // Show remaining videos
    const remainingResult = await pool.query('SELECT id, title, video_url FROM videos');
    console.log(`\n📊 Remaining videos: ${remainingResult.rows.length}`);
    remainingResult.rows.forEach(video => {
      console.log(`   ✅ ${video.title} (${video.video_url})`);
    });
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  } finally {
    await pool.end();
  }
}

// Run the cleanup
cleanupAllBadVideos(); 