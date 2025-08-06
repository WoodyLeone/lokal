const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

// Supabase configuration
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase credentials not found in environment variables');
  console.error('Please check your .env file and ensure EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY are set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function resetStorage() {
  console.log('🔄 Starting Supabase storage reset...\n');

  try {
    // List all buckets
    console.log('📋 Current storage buckets:');
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('❌ Error listing buckets:', bucketsError.message);
      return;
    }

    buckets.forEach(bucket => {
      console.log(`  - ${bucket.name} (${bucket.public ? 'public' : 'private'})`);
    });

    // Reset videos bucket
    console.log('\n🗑️  Clearing videos bucket...');
    const { data: videos, error: videosError } = await supabase.storage
      .from('videos')
      .list('', { limit: 1000 });

    if (videosError) {
      console.log('⚠️  Videos bucket might not exist yet, will create it');
    } else if (videos && videos.length > 0) {
      const videoFiles = videos.map(file => file.name);
      console.log(`  Found ${videoFiles.length} files to delete`);
      
      const { error: deleteVideosError } = await supabase.storage
        .from('videos')
        .remove(videoFiles);
      
      if (deleteVideosError) {
        console.error('❌ Error deleting videos:', deleteVideosError.message);
      } else {
        console.log('✅ Videos bucket cleared');
      }
    } else {
      console.log('✅ Videos bucket is already empty');
    }

    // Reset thumbnails bucket
    console.log('\n🗑️  Clearing thumbnails bucket...');
    const { data: thumbnails, error: thumbnailsError } = await supabase.storage
      .from('thumbnails')
      .list('', { limit: 1000 });

    if (thumbnailsError) {
      console.log('⚠️  Thumbnails bucket might not exist yet, will create it');
    } else if (thumbnails && thumbnails.length > 0) {
      const thumbnailFiles = thumbnails.map(file => file.name);
      console.log(`  Found ${thumbnailFiles.length} files to delete`);
      
      const { error: deleteThumbnailsError } = await supabase.storage
        .from('thumbnails')
        .remove(thumbnailFiles);
      
      if (deleteThumbnailsError) {
        console.error('❌ Error deleting thumbnails:', deleteThumbnailsError.message);
      } else {
        console.log('✅ Thumbnails bucket cleared');
      }
    } else {
      console.log('✅ Thumbnails bucket is already empty');
    }

    // Verify buckets exist and are properly configured
    console.log('\n🔍 Verifying bucket configuration...');
    
    const { data: finalBuckets, error: finalBucketsError } = await supabase.storage.listBuckets();
    
    if (finalBucketsError) {
      console.error('❌ Error verifying buckets:', finalBucketsError.message);
      return;
    }

    const bucketNames = finalBuckets.map(b => b.name);
    
    if (!bucketNames.includes('videos')) {
      console.log('⚠️  Videos bucket not found - you may need to create it manually in the Supabase dashboard');
    } else {
      console.log('✅ Videos bucket exists');
    }
    
    if (!bucketNames.includes('thumbnails')) {
      console.log('⚠️  Thumbnails bucket not found - you may need to create it manually in the Supabase dashboard');
    } else {
      console.log('✅ Thumbnails bucket exists');
    }

    console.log('\n🎉 Storage reset completed!');
    console.log('\n📝 Next steps:');
    console.log('1. Run the SQL reset script in your Supabase dashboard');
    console.log('2. Create storage buckets manually if they don\'t exist:');
    console.log('   - videos (public)');
    console.log('   - thumbnails (public)');
    console.log('3. Run: npm run verify-supabase');

  } catch (error) {
    console.error('❌ Unexpected error during storage reset:', error.message);
  }
}

// Run the reset
resetStorage(); 