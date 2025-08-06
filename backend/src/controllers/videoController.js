const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const { PythonShell } = require('python-shell');
const enhancedObjectDetectionService = require('../services/enhancedObjectDetectionService');
const productService = require('../services/productService');
const learningService = require('../services/learningService');
const videoProcessingPipeline = require('../services/videoProcessingPipeline');
const { Pool } = require('pg');

// Helper function to generate AI suggestions
function generateAISuggestionsForObjects(detectedObjects) {
  try {
    const suggestions = [];
    
    const objectToProductMap = {
      'laptop': ['MacBook Pro', 'Dell XPS', 'HP Spectre', 'Lenovo ThinkPad'],
      'cell phone': ['iPhone 15', 'Samsung Galaxy S24', 'Google Pixel 8', 'OnePlus 12'],
      'sneakers': ['Nike Air Max', 'Adidas Ultraboost', 'Converse Chuck Taylor', 'Vans Old Skool'],
      'chair': ['Herman Miller Aeron', 'IKEA Markus', 'Steelcase Leap', 'Secretlab Titan'],
      'table': ['IKEA Linnmon', 'West Elm Parsons', 'Crate & Barrel Dining Table', 'Pottery Barn Farmhouse'],
      'car': ['Tesla Model 3', 'Honda Civic', 'Toyota Camry', 'Ford Mustang'],
      'truck': ['Ford F-150', 'Chevrolet Silverado', 'Ram 1500', 'Toyota Tundra'],
      'tv': ['Samsung QLED', 'LG OLED', 'Sony Bravia', 'TCL 6-Series'],
      'headphones': ['Sony WH-1000XM5', 'Bose QuietComfort', 'Apple AirPods Pro', 'Sennheiser HD 660S'],
      'watch': ['Apple Watch Series 9', 'Samsung Galaxy Watch', 'Garmin Fenix', 'Fitbit Sense'],
      'book': ['Kindle Paperwhite', 'iPad Air', 'Kobo Clara', 'Barnes & Noble Nook'],
      'cup': ['Yeti Rambler', 'Hydro Flask', 'Stanley Quencher', 'Contigo Autoseal'],
      'bottle': ['CamelBak Chute', 'Nalgene Wide Mouth', 'Klean Kanteen', 'Swell Bottle'],
      'hat': ['New Era 59FIFTY', 'Nike Dri-FIT', 'Adidas Originals', 'Patagonia Trucker'],
      'shirt': ['Nike Dri-FIT', 'Adidas Originals', 'Under Armour', 'Lululemon'],
      'pants': ['Levi\'s 501', 'Nike Dri-FIT', 'Adidas Tiro', 'Lululemon ABC'],
      'handbag': ['Coach Willow', 'Kate Spade New York', 'Michael Kors', 'Fossil'],
      'glasses': ['Ray-Ban Aviator', 'Oakley Holbrook', 'Warby Parker', 'Persol'],
      'couch': ['IKEA Kivik', 'West Elm Harmony', 'Crate & Barrel Lounge', 'Pottery Barn Comfort'],
      'lamp': ['IKEA RANARP', 'West Elm Mid-Century', 'Crate & Barrel Modern', 'Pottery Barn Classic'],
      'plant': ['Monstera Deliciosa', 'Snake Plant', 'Pothos', 'Fiddle Leaf Fig'],
      'bicycle': ['Trek Domane', 'Specialized Allez', 'Cannondale Synapse', 'Giant Defy'],
      'dog': ['PetSafe Smart Feed', 'Furbo Dog Camera', 'Kong Classic', 'Chuckit! Ball Launcher'],
      'cat': ['Litter Robot', 'Catit Flower Fountain', 'Kong Cat Wobbler', 'Da Bird Cat Toy'],
      'keyboard': ['Logitech MX Keys', 'Apple Magic Keyboard', 'Corsair K100', 'Razer BlackWidow'],
      'mouse': ['Logitech MX Master', 'Apple Magic Mouse', 'Razer DeathAdder', 'SteelSeries Rival'],
      'monitor': ['Dell UltraSharp', 'LG UltraWide', 'Samsung Odyssey', 'ASUS ProArt'],
      'speaker': ['Sonos One', 'Bose SoundLink', 'JBL Flip', 'UE Boom'],
      'camera': ['Canon EOS R', 'Sony A7', 'Nikon Z6', 'Fujifilm X-T4'],
      'remote': ['Logitech Harmony', 'Broadlink RM4', 'SofaBaton', 'GE Universal']
    };

    for (const object of detectedObjects) {
      const objectLower = object.toLowerCase();
      if (objectToProductMap[objectLower]) {
        // Add 1-2 random suggestions for each detected object
        const objectSuggestions = objectToProductMap[objectLower];
        const randomSuggestions = objectSuggestions
          .sort(() => 0.5 - Math.random())
          .slice(0, Math.min(2, objectSuggestions.length));
        suggestions.push(...randomSuggestions);
      }
    }

    // Remove duplicates and limit to top 3
    const uniqueSuggestions = [...new Set(suggestions)];
    return uniqueSuggestions.slice(0, 3);
  } catch (error) {
    console.error('Error generating AI suggestions:', error);
    return [];
  }
}

// Persistent storage for video processing status
const videoProcessingStatus = new Map();

// File-based persistence for video status (fallback when database is not available)
const VIDEO_STATUS_FILE = path.join(__dirname, '../data/video_status.json');

// Ensure data directory exists
const dataDir = path.dirname(VIDEO_STATUS_FILE);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Load existing video status from file
function loadVideoStatusFromFile() {
  try {
    if (fs.existsSync(VIDEO_STATUS_FILE)) {
      const data = fs.readFileSync(VIDEO_STATUS_FILE, 'utf8');
      const statusData = JSON.parse(data);
      for (const [videoId, status] of Object.entries(statusData)) {
        videoProcessingStatus.set(videoId, status);
      }
      console.log(`📁 Loaded ${videoProcessingStatus.size} video statuses from file`);
    }
  } catch (error) {
    console.error('Error loading video status from file:', error);
  }
}

// Save video status to file
function saveVideoStatusToFile() {
  try {
    const statusData = {};
    for (const [videoId, status] of videoProcessingStatus.entries()) {
      statusData[videoId] = status;
    }
    fs.writeFileSync(VIDEO_STATUS_FILE, JSON.stringify(statusData, null, 2));
  } catch (error) {
    console.error('Error saving video status to file:', error);
  }
}

// Helper function to update video status with persistence
function updateVideoStatus(videoId, status) {
  videoProcessingStatus.set(videoId, status);
  saveVideoStatusToFile();
  console.log(`📝 Updated video status for ${videoId}: ${status.status} (${status.progress}%)`);
}

// Helper function to update video in database
async function updateVideoInDatabase(videoId, status) {
  let supabase;
  try {
    supabase = databaseManager.getSupabase();
  } catch (error) {
    console.warn('⚠️ Supabase not available for update:', error.message);
    return;
  }
  
  if (supabase) {
    try {
      const updateData = {
        updated_at: new Date().toISOString()
      };

      // Add optional fields if they exist (only use columns that actually exist in the schema)
      if (status.detectedObjects) {
        updateData.detected_objects = status.detectedObjects;
      }
      if (status.matchedProducts) {
        updateData.products = status.matchedProducts;
      }

      const { error: dbError } = await supabase
        .from('videos')
        .update(updateData)
        .eq('id', videoId);

      if (dbError) {
        console.error('Error updating video in database:', dbError);
      } else {
        console.log(`✅ Updated video ${videoId} in database: ${status.status}`);
      }
    } catch (error) {
      console.error('Error updating video in database:', error);
    }
  }
}

// Initialize by loading existing statuses
loadVideoStatusFromFile();

const videoController = {
  // Upload video and start processing
  async uploadVideo(req, res) {
    try {
      const { videoUrl, videoData, title, description, manualProductName, affiliateLink, userTags } = req.body;

      if (!title) {
        return res.status(400).json({
          success: false,
          error: 'Title is required'
        });
      }

      // For testing purposes, allow requests without video files
      if (!videoUrl && !videoData && !req.file) {
        console.log('⚠️ No video file provided - this is allowed for testing product matching');
      }

      // Generate videoId first
      const videoId = uuidv4();
      
      // Handle uploaded file
      let videoPath;
      if (req.file) {
        videoPath = req.file.path;
        console.log(`Video uploaded to: ${videoPath}`);
      }
      // Handle base64 video data (fallback)
      else if (videoData) {
        try {
          // Decode base64 video data
          const videoBuffer = Buffer.from(videoData, 'base64');
          videoPath = path.join(__dirname, '../temp', `${videoId}.mp4`);
          
          // Ensure temp directory exists
          const tempDir = path.dirname(videoPath);
          if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
          }
          
          // Write video file
          fs.writeFileSync(videoPath, videoBuffer);
          console.log(`Video saved to: ${videoPath}`);
        } catch (error) {
          console.error('Error saving video data:', error);
          return res.status(400).json({
            success: false,
            error: 'Invalid video data format'
          });
        }
      }
      
      // Save video to Railway PostgreSQL database
      console.log('🔍 Attempting to save video to Railway PostgreSQL database...');
      
      try {
        // Create database connection
        const pool = new Pool({
          connectionString: process.env.DATABASE_URL,
          ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
        });
        
        // Use authenticated user ID or create a demo user ID
        let userId = req.user?.id;
        if (!userId) {
          // Get the test user ID from the database
          const userEmail = req.body.userEmail || req.headers['x-user-email'] || 'test@example.com';
          const userResult = await pool.query(
            'SELECT id FROM users WHERE email = $1',
            [userEmail]
          );
          
          if (userResult.rows.length > 0) {
            userId = userResult.rows[0].id;
            console.log(`🔧 Using existing user ID: ${userId} for email: ${userEmail}`);
          } else {
            // Create a demo user if it doesn't exist
            const demoUserResult = await pool.query(
              `INSERT INTO users (email, password_hash, username) 
               VALUES ($1, $2, $3) 
               RETURNING id`,
              [userEmail, 'demo_password_hash', 'demo_user']
            );
            userId = demoUserResult.rows[0].id;
            console.log(`🔧 Created demo user ID: ${userId} for email: ${userEmail}`);
          }
        }
        
        // Determine the video URL based on what was provided
        let finalVideoUrl = videoUrl || '';
        if (req.file) {
          // For uploaded files, we need to create a proper URL
          // In production, this should be a CDN or storage service URL
          // For now, we'll use a placeholder that indicates it's a local file
          finalVideoUrl = `file://${req.file.path}`;
        } else if (videoData) {
          // For base64 data, use a placeholder
          finalVideoUrl = `data://${videoId}.mp4`;
        }

        let insertData = {
          user_id: userId,
          title: title,
          description: description || '',
          video_url: finalVideoUrl,
          thumbnail_url: '',
          duration: 0,
          detected_objects: [],
          products: [],
          status: 'uploaded',
          progress: 0
        };

        // Insert video record (without status column for now)
        const insertResult = await pool.query(
          `INSERT INTO videos (user_id, title, description, video_url, thumbnail_url, duration, detected_objects, products, progress) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
           RETURNING id`,
          [
            insertData.user_id,
            insertData.title,
            insertData.description,
            insertData.video_url,
            insertData.thumbnail_url,
            insertData.duration,
            JSON.stringify(insertData.detected_objects),
            JSON.stringify(insertData.products),
            insertData.progress
          ]
        );

        const insertedVideoId = insertResult.rows[0].id;
        console.log(`✅ Video saved to database with ID: ${insertedVideoId}`);

        // Save user tags if provided
        if (userTags && Array.isArray(userTags) && userTags.length > 0) {
          try {
            await pool.query(
              `INSERT INTO product_matches (video_id, detected_object, match_type, ai_suggestions) 
               VALUES ($1, $2, $3, $4)`,
              [
                insertedVideoId,
                'user_tags',
                'manual',
                JSON.stringify({ userTags, timestamp: new Date().toISOString() })
              ]
            );
            console.log(`✅ User tags saved: ${userTags.join(', ')}`);
          } catch (tagError) {
            console.error('Error saving user tags:', tagError);
          }
        }

        await pool.end();

      } catch (dbError) {
        console.error('❌ Database error:', dbError);
        return res.status(500).json({
          success: false,
          error: 'Failed to save video to database'
        });
      }

      // Initialize video status
      const initialStatus = {
        videoId: videoId,
        status: 'uploaded',
        progress: 0,
        message: 'Video uploaded successfully',
        videoPath: videoPath,
        videoUrl: videoUrl,
        title: title,
        description: description,
        userTags: userTags || [],
        manualProductName: manualProductName,
        affiliateLink: affiliateLink,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      updateVideoStatus(videoId, initialStatus);
      saveVideoStatusToFile();

      // Start object detection in background if video file is available
      if (videoPath && fs.existsSync(videoPath)) {
        setTimeout(async () => {
          try {
            console.log(`🚀 Starting object detection for video: ${videoId}`);
            
            // Update status to processing
            updateVideoStatus(videoId, {
              ...initialStatus,
              status: 'processing',
              progress: 10,
              message: 'Starting object detection'
            });
            saveVideoStatusToFile();

            // Use enhanced pipeline with user tags
            const usePipeline = process.env.USE_ENHANCED_PIPELINE || 'true';
            
            if (usePipeline === 'true') {
              console.log('🚀 Using enhanced video processing pipeline with user tags');
              
              try {
                // Initialize pipeline if not already done
                if (!videoProcessingPipeline.isInitialized) {
                  await videoProcessingPipeline.initialize();
                }

                // Process video through complete pipeline with user tags
                const pipelineResults = await videoProcessingPipeline.processVideo(videoId, videoPath, {
                  enableCostOptimization: true,
                  saveIntermediateResults: false,
                  userTags: userTags || [],
                  manualProductName: manualProductName,
                  affiliateLink: affiliateLink
                });

                console.log(`✅ Pipeline completed: ${pipelineResults.summary.totalMatches} matches found`);

                // Update final status
                updateVideoStatus(videoId, {
                  ...initialStatus,
                  status: 'completed',
                  progress: 100,
                  message: 'Processing completed successfully',
                  detectedObjects: pipelineResults.summary.totalObjects,
                  matchedProducts: pipelineResults.recommendations,
                  pipelineResults: pipelineResults
                });

              } catch (pipelineError) {
                console.error('Pipeline failed, falling back to basic detection:', pipelineError);
                
                // Fallback to basic detection
                const detectedObjects = await enhancedObjectDetectionService.detectObjects(videoId, videoPath);
                const aiSuggestions = generateAISuggestionsForObjects(detectedObjects);

                updateVideoStatus(videoId, {
                  ...initialStatus,
                  status: 'completed',
                  progress: 100,
                  message: 'Basic detection completed',
                  detectedObjects: detectedObjects,
                  aiSuggestions: aiSuggestions
                });
              }
            } else {
              // Use basic object detection
              console.log('🔍 Using basic object detection');
              
              const detectedObjects = await enhancedObjectDetectionService.detectObjects(videoId, videoPath);
              const aiSuggestions = generateAISuggestionsForObjects(detectedObjects);

              updateVideoStatus(videoId, {
                ...initialStatus,
                status: 'completed',
                progress: 100,
                message: 'Basic detection completed',
                detectedObjects: detectedObjects,
                aiSuggestions: aiSuggestions
              });
            }

            saveVideoStatusToFile();
            updateVideoInDatabase(videoId, videoProcessingStatus.get(videoId));

          } catch (error) {
            console.error('Processing error:', error);
            updateVideoStatus(videoId, {
              ...initialStatus,
              status: 'error',
              progress: 0,
              message: `Processing failed: ${error.message}`
            });
            saveVideoStatusToFile();
          }
        }, 1000);
      } else {
        // No video file, just return success
        console.log('📝 Video uploaded without file - processing will be manual');
      }

      return res.json({
        success: true,
        videoId: videoId,
        message: 'Video uploaded successfully',
        status: 'uploaded',
        userTags: userTags || []
      });

    } catch (error) {
      console.error('Upload error:', error);
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },

  // Trigger object detection for a video
  async detectObjects(req, res) {
    try {
      const { videoId } = req.params;
      const { usePipeline = 'true', userTags = [] } = req.body;

      console.log(`🔍 Starting object detection for video: ${videoId} with user tags: ${userTags.join(', ')}`);

      // Get current video status
      const videoStatus = videoProcessingStatus.get(videoId);
      if (!videoStatus) {
        return res.status(404).json({
          success: false,
          error: 'Video not found'
        });
      }

      // Get video file path
      const videoPath = videoStatus.videoPath || videoStatus.filePath;
      if (!videoPath || !fs.existsSync(videoPath)) {
        updateVideoStatus(videoId, {
          ...videoStatus,
          status: 'error',
          message: 'Video file not found'
        });
        return res.status(404).json({
          success: false,
          error: 'Video file not found'
        });
      }

      let detectedObjects, aiSuggestions, pipelineResults;

      if (usePipeline === 'true') {
        // Use new video processing pipeline with user tags
        console.log('🚀 Using enhanced video processing pipeline with user tags');
        
        try {
          // Initialize pipeline if not already done
          if (!videoProcessingPipeline.isInitialized) {
            await videoProcessingPipeline.initialize();
          }

          // Process video through complete pipeline with user tags
          pipelineResults = await videoProcessingPipeline.processVideo(videoId, videoPath, {
            enableCostOptimization: true,
            saveIntermediateResults: false,
            userTags: userTags,
            manualProductName: videoStatus.manualProductName,
            affiliateLink: videoStatus.affiliateLink
          });

          // Extract detected objects from pipeline results
          detectedObjects = pipelineResults.analysis.results.map(result => result.class_name);
          aiSuggestions = pipelineResults.recommendations.map(rec => rec.product.title);

          console.log(`✅ Pipeline completed: ${detectedObjects.length} objects detected, ${aiSuggestions.length} suggestions generated`);

        } catch (pipelineError) {
          console.error('Pipeline failed, falling back to basic detection:', pipelineError);
          
          // Fallback to basic detection
          detectedObjects = await enhancedObjectDetectionService.detectObjects(videoId, videoPath);
          aiSuggestions = generateAISuggestionsForObjects(detectedObjects);
        }
      } else {
        // Use basic object detection
        console.log('🔍 Using basic object detection');
        detectedObjects = await enhancedObjectDetectionService.detectObjects(videoId, videoPath);
        aiSuggestions = generateAISuggestionsForObjects(detectedObjects);
      }

      // Update video status
      const updatedStatus = {
        ...videoStatus,
        status: 'completed',
        progress: 100,
        detectedObjects: detectedObjects,
        aiSuggestions: aiSuggestions,
        userTags: userTags,
        completedAt: new Date().toISOString()
      };

      if (pipelineResults) {
        updatedStatus.pipelineResults = pipelineResults;
        updatedStatus.matchedProducts = pipelineResults.recommendations;
      }

      updateVideoStatus(videoId, updatedStatus);
      saveVideoStatusToFile();

      // Update database
      await updateVideoInDatabase(videoId, updatedStatus);

      return res.json({
        success: true,
        videoId: videoId,
        detectedObjects: detectedObjects,
        aiSuggestions: aiSuggestions,
        userTags: userTags,
        pipelineResults: pipelineResults || null
      });

    } catch (error) {
      console.error('Detection error:', error);
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },

  // Get video processing status
  async getVideoStatus(req, res) {
    try {
      const { videoId } = req.params;
      const videoStatus = videoProcessingStatus.get(videoId);

      if (!videoStatus) {
        return res.status(404).json({
          success: false,
          error: 'Video not found'
        });
      }

      res.json({
        success: true,
        status: videoStatus.status,
        progress: videoStatus.progress,
        detectedObjects: videoStatus.detectedObjects || [],
        matchedProducts: videoStatus.matchedProducts || [],
        manualProductName: videoStatus.manualProductName || null,
        aiSuggestions: videoStatus.aiSuggestions || [],
        detectionMethod: 'hybrid',
        error: videoStatus.error
      });

    } catch (error) {
      console.error('Status check error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get video status'
      });
    }
  },

  // Generate AI suggestions for detected objects
  async generateAISuggestions(detectedObjects) {
    try {
      const suggestions = [];
      
      const objectToProductMap = {
        'laptop': ['MacBook Pro', 'Dell XPS', 'HP Spectre', 'Lenovo ThinkPad'],
        'cell phone': ['iPhone 15', 'Samsung Galaxy S24', 'Google Pixel 8', 'OnePlus 12'],
        'sneakers': ['Nike Air Max', 'Adidas Ultraboost', 'Converse Chuck Taylor', 'Vans Old Skool'],
        'chair': ['Herman Miller Aeron', 'IKEA Markus', 'Steelcase Leap', 'Secretlab Titan'],
        'table': ['IKEA Linnmon', 'West Elm Parsons', 'Crate & Barrel Dining Table', 'Pottery Barn Farmhouse'],
        'car': ['Tesla Model 3', 'Honda Civic', 'Toyota Camry', 'Ford Mustang'],
        'truck': ['Ford F-150', 'Chevrolet Silverado', 'Ram 1500', 'Toyota Tundra'],
        'tv': ['Samsung QLED', 'LG OLED', 'Sony Bravia', 'TCL 6-Series'],
        'headphones': ['Sony WH-1000XM5', 'Bose QuietComfort', 'Apple AirPods Pro', 'Sennheiser HD 660S'],
        'watch': ['Apple Watch Series 9', 'Samsung Galaxy Watch', 'Garmin Fenix', 'Fitbit Sense'],
        'book': ['Kindle Paperwhite', 'iPad Air', 'Kobo Clara', 'Barnes & Noble Nook'],
        'cup': ['Yeti Rambler', 'Hydro Flask', 'Stanley Quencher', 'Contigo Autoseal'],
        'bottle': ['CamelBak Chute', 'Nalgene Wide Mouth', 'Klean Kanteen', 'Swell Bottle'],
        'hat': ['New Era 59FIFTY', 'Nike Dri-FIT', 'Adidas Originals', 'Patagonia Trucker'],
        'shirt': ['Nike Dri-FIT', 'Adidas Originals', 'Under Armour', 'Lululemon'],
        'pants': ['Levi\'s 501', 'Nike Dri-FIT', 'Adidas Tiro', 'Lululemon ABC'],
        'handbag': ['Coach Willow', 'Kate Spade New York', 'Michael Kors', 'Fossil'],
        'glasses': ['Ray-Ban Aviator', 'Oakley Holbrook', 'Warby Parker', 'Persol'],
        'couch': ['IKEA Kivik', 'West Elm Harmony', 'Crate & Barrel Lounge', 'Pottery Barn Comfort'],
        'lamp': ['IKEA RANARP', 'West Elm Mid-Century', 'Crate & Barrel Modern', 'Pottery Barn Classic'],
        'plant': ['Monstera Deliciosa', 'Snake Plant', 'Pothos', 'Fiddle Leaf Fig'],
        'bicycle': ['Trek Domane', 'Specialized Allez', 'Cannondale Synapse', 'Giant Defy'],
        'dog': ['PetSafe Smart Feed', 'Furbo Dog Camera', 'Kong Classic', 'Chuckit! Ball Launcher'],
        'cat': ['Litter Robot', 'Catit Flower Fountain', 'Kong Cat Wobbler', 'Da Bird Cat Toy'],
        'keyboard': ['Logitech MX Keys', 'Apple Magic Keyboard', 'Corsair K100', 'Razer BlackWidow'],
        'mouse': ['Logitech MX Master', 'Apple Magic Mouse', 'Razer DeathAdder', 'SteelSeries Rival'],
        'monitor': ['Dell UltraSharp', 'LG UltraWide', 'Samsung Odyssey', 'ASUS ProArt'],
        'speaker': ['Sonos One', 'Bose SoundLink', 'JBL Flip', 'UE Boom'],
        'camera': ['Canon EOS R', 'Sony A7', 'Nikon Z6', 'Fujifilm X-T4'],
        'remote': ['Logitech Harmony', 'Broadlink RM4', 'SofaBaton', 'GE Universal']
      };

      for (const object of detectedObjects) {
        const objectLower = object.toLowerCase();
        if (objectToProductMap[objectLower]) {
          // Add 1-2 random suggestions for each detected object
          const objectSuggestions = objectToProductMap[objectLower];
          const randomSuggestions = objectSuggestions
            .sort(() => 0.5 - Math.random())
            .slice(0, Math.min(2, objectSuggestions.length));
          suggestions.push(...randomSuggestions);
        }
      }

      // Remove duplicates and limit to top 3
      const uniqueSuggestions = [...new Set(suggestions)];
      return uniqueSuggestions.slice(0, 3);
    } catch (error) {
      console.error('Error generating AI suggestions:', error);
      return [];
    }
  },

  // Get all videos (for demo purposes)
  async getAllVideos(req, res) {
    try {
      const videos = Array.from(videoProcessingStatus.entries()).map(([id, status]) => ({
        id,
        title: status.title,
        description: status.description,
        status: status.status,
        progress: status.progress,
        createdAt: status.createdAt,
        completedAt: status.completedAt
      }));

      res.json({
        success: true,
        videos
      });

    } catch (error) {
      console.error('Get videos error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get videos'
      });
    }
  },

  // Get video by ID
  async getVideoById(req, res) {
    try {
      const { videoId } = req.params;
      const videoStatus = videoProcessingStatus.get(videoId);

      if (!videoStatus) {
        return res.status(404).json({
          success: false,
          error: 'Video not found'
        });
      }

      res.json({
        success: true,
        video: {
          id: videoId,
          title: videoStatus.title,
          description: videoStatus.description,
          videoUrl: videoStatus.videoUrl,
          status: videoStatus.status,
          progress: videoStatus.progress,
          detectedObjects: videoStatus.detectedObjects || [],
          createdAt: videoStatus.createdAt,
          completedAt: videoStatus.completedAt,
          error: videoStatus.error
        }
      });

    } catch (error) {
      console.error('Get video error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get video'
      });
    }
  },

  // Get learning statistics
  async getLearningStats(req, res) {
    try {
      const stats = learningService.getLearningStats();
      res.json({
        success: true,
        stats: stats
      });
    } catch (error) {
      console.error('Learning stats error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get learning statistics'
      });
    }
  },

  // Get pipeline status for a video
  async getPipelineStatus(req, res) {
    try {
      const { videoId } = req.params;
      
      if (!videoProcessingPipeline.isInitialized) {
        return res.status(503).json({
          success: false,
          error: 'Pipeline not initialized'
        });
      }

      const status = await videoProcessingPipeline.getPipelineStatus(videoId);
      
      if (!status) {
        return res.status(404).json({
          success: false,
          error: 'Pipeline status not found'
        });
      }

      res.json({
        success: true,
        status
      });

    } catch (error) {
      console.error('Pipeline status error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get pipeline status'
      });
    }
  },

  /**
   * Get pipeline statistics
   */
  async getPipelineStats(req, res) {
    try {
      const stats = videoProcessingPipeline.getPipelineStats();
      
      res.json({
        success: true,
        stats: {
          totalVideos: stats.totalVideos,
          successfulVideos: stats.successfulVideos,
          failedVideos: stats.failedVideos,
          averageProcessingTime: stats.averageProcessingTime,
          totalCost: stats.totalCost,
          fallbackModeUsed: stats.fallbackModeUsed,
          activeProcesses: videoProcessingPipeline.activeProcesses.size
        }
      });
    } catch (error) {
      console.error('Error getting pipeline stats:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get pipeline statistics'
      });
    }
  },

  /**
   * Get pipeline results for a video
   */
  async getPipelineResults(req, res) {
    try {
      const { videoId } = req.params;
      
      if (!videoId) {
        return res.status(400).json({
          success: false,
          error: 'Video ID is required'
        });
      }

      // Get results from database
      const databaseManager = require('../config/database');
      const results = await databaseManager.getPipelineResults(videoId);
      
      res.json({
        success: true,
        results: results || []
      });
    } catch (error) {
      console.error('Error getting pipeline results:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get pipeline results'
      });
    }
  },

  /**
   * Get object detections for a video
   */
  async getObjectDetections(req, res) {
    try {
      const { videoId } = req.params;
      
      if (!videoId) {
        return res.status(400).json({
          success: false,
          error: 'Video ID is required'
        });
      }

      // Get detections from database
      const databaseManager = require('../config/database');
      const detections = await databaseManager.getObjectDetections(videoId);
      
      res.json({
        success: true,
        detections: detections || []
      });
    } catch (error) {
      console.error('Error getting object detections:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get object detections'
      });
    }
  },

  /**
   * Get product matches for a video
   */
  async getProductMatches(req, res) {
    try {
      const { videoId } = req.params;
      
      if (!videoId) {
        return res.status(400).json({
          success: false,
          error: 'Video ID is required'
        });
      }

      // Get matches from database
      const databaseManager = require('../config/database');
      const matches = await databaseManager.getProductMatches(videoId);
      
      res.json({
        success: true,
        matches: matches || []
      });
    } catch (error) {
      console.error('Error getting product matches:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get product matches'
      });
    }
  },

  /**
   * Get complete video analysis results
   */
  async getVideoAnalysis(req, res) {
    try {
      const { videoId } = req.params;
      
      if (!videoId) {
        return res.status(400).json({
          success: false,
          error: 'Video ID is required'
        });
      }

      const databaseManager = require('../config/database');
      
      // Get all analysis data
      const [pipelineResults, detections, matches] = await Promise.all([
        databaseManager.getPipelineResults(videoId),
        databaseManager.getObjectDetections(videoId),
        databaseManager.getProductMatches(videoId)
      ]);

      // Get video status
      const videoStatus = videoProcessingStatus.get(videoId) || { status: 'unknown' };
      
      res.json({
        success: true,
        analysis: {
          videoId,
          status: videoStatus.status,
          pipelineResults: pipelineResults || [],
          detections: detections || [],
          matches: matches || [],
          summary: {
            totalDetections: detections?.length || 0,
            totalMatches: matches?.length || 0,
            uniqueObjects: new Set(detections?.map(d => d.class_name) || []).size,
            averageConfidence: detections?.length ? 
              detections.reduce((sum, d) => sum + d.confidence, 0) / detections.length : 0
          }
        }
      });
    } catch (error) {
      console.error('Error getting video analysis:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get video analysis'
      });
    }
  },

  /**
   * Save user feedback for product matches
   */
  async saveUserFeedback(req, res) {
    try {
      const { videoId, trackId, feedbackType, feedbackData } = req.body;
      
      if (!videoId || !trackId || !feedbackType) {
        return res.status(400).json({
          success: false,
          error: 'Video ID, track ID, and feedback type are required'
        });
      }

      const databaseManager = require('../config/database');
      
      // Save feedback to database
      const query = `
        INSERT INTO user_feedback (video_id, track_id, feedback_type, feedback_data)
        VALUES ($1, $2, $3, $4)
      `;
      
      await databaseManager.query(query, [
        videoId, 
        trackId, 
        feedbackType, 
        JSON.stringify(feedbackData || {})
      ]);

      // Update learning service with feedback
      await learningService.recordFeedback(videoId, trackId, feedbackType, feedbackData);
      
      res.json({
        success: true,
        message: 'Feedback saved successfully'
      });
    } catch (error) {
      console.error('Error saving user feedback:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to save user feedback'
      });
    }
  },

  /**
   * Get user feedback for a video
   */
  async getUserFeedback(req, res) {
    try {
      const { videoId } = req.params;
      
      if (!videoId) {
        return res.status(400).json({
          success: false,
          error: 'Video ID is required'
        });
      }

      const databaseManager = require('../config/database');
      
      const query = `
        SELECT * FROM user_feedback 
        WHERE video_id = $1 
        ORDER BY created_at DESC
      `;
      
      const result = await databaseManager.query(query, [videoId]);
      
      res.json({
        success: true,
        feedback: result.rows || []
      });
    } catch (error) {
      console.error('Error getting user feedback:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get user feedback'
      });
    }
  },

  /**
   * Validate user tags
   */
  async validateUserTags(req, res) {
    try {
      const { tags } = req.body;
      
      if (!tags || !Array.isArray(tags)) {
        return res.status(400).json({
          success: false,
          error: 'Tags must be an array'
        });
      }

      const productMatchingService = require('../services/productMatchingService');
      const validation = productMatchingService.validateUserTags(tags);
      
      res.json({
        success: true,
        validation: validation
      });
    } catch (error) {
      console.error('Error validating user tags:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to validate user tags'
      });
    }
  },

  /**
   * Get tag suggestions based on detected objects
   */
  async getTagSuggestions(req, res) {
    try {
      const { videoId } = req.params;
      
      if (!videoId) {
        return res.status(400).json({
          success: false,
          error: 'Video ID is required'
        });
      }

      // Get detected objects and analysis results
      const databaseManager = require('../config/database');
      const [detections, analysisResults] = await Promise.all([
        databaseManager.getObjectDetections(videoId),
        databaseManager.getPipelineResults(videoId)
      ]);

      const productMatchingService = require('../services/productMatchingService');
      const suggestions = await productMatchingService.getTagSuggestions(
        detections || [],
        analysisResults || []
      );
      
      res.json({
        success: true,
        suggestions: suggestions
      });
    } catch (error) {
      console.error('Error getting tag suggestions:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get tag suggestions'
      });
    }
  },

  /**
   * Enhanced product matching with user tags
   */
  async matchProductsWithUserTags(req, res) {
    try {
      const { videoId } = req.params;
      const { userTags = [], options = {} } = req.body;
      
      if (!videoId) {
        return res.status(400).json({
          success: false,
          error: 'Video ID is required'
        });
      }

      // Get analysis results
      const databaseManager = require('../config/database');
      const analysisResults = await databaseManager.getPipelineResults(videoId);
      
      if (!analysisResults || analysisResults.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'No analysis results found for this video'
        });
      }

      const productMatchingService = require('../services/productMatchingService');
      const matchingResult = await productMatchingService.matchProductsWithUserTags(
        analysisResults,
        userTags,
        options
      );
      
      res.json({
        success: true,
        result: matchingResult
      });
    } catch (error) {
      console.error('Error matching products with user tags:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to match products with user tags'
      });
    }
  },

  /**
   * Update video with user tags
   */
  async updateVideoTags(req, res) {
    try {
      const { videoId } = req.params;
      const { tags } = req.body;
      
      if (!videoId) {
        return res.status(400).json({
          success: false,
          error: 'Video ID is required'
        });
      }

      if (!tags || !Array.isArray(tags)) {
        return res.status(400).json({
          success: false,
          error: 'Tags must be an array'
        });
      }

      // Validate tags
      const productMatchingService = require('../services/productMatchingService');
      const validation = productMatchingService.validateUserTags(tags);
      
      if (validation.errors.length > 0) {
        return res.status(400).json({
          success: false,
          error: 'Invalid tags provided',
          validation: validation
        });
      }

      // Update video with tags
      const databaseManager = require('../config/database');
      const query = `
        UPDATE videos 
        SET metadata = jsonb_set(
          COALESCE(metadata, '{}'::jsonb), 
          '{user_tags}', 
          $2::jsonb
        ),
        updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
      `;
      
      await databaseManager.query(query, [videoId, JSON.stringify(validation.valid)]);
      
      // Trigger enhanced product matching with new tags
      const analysisResults = await databaseManager.getPipelineResults(videoId);
      if (analysisResults && analysisResults.length > 0) {
        const matchingResult = await productMatchingService.matchProductsWithUserTags(
          analysisResults,
          validation.valid
        );
        
        // Save enhanced matches
        if (matchingResult.matches.length > 0) {
          await databaseManager.saveProductMatches(videoId, matchingResult.matches);
        }
      }
      
      res.json({
        success: true,
        message: 'Video tags updated successfully',
        tags: validation.valid,
        validation: validation
      });
    } catch (error) {
      console.error('Error updating video tags:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update video tags'
      });
    }
  },

  /**
   * Get video tags
   */
  async getVideoTags(req, res) {
    try {
      const { videoId } = req.params;
      
      if (!videoId) {
        return res.status(400).json({
          success: false,
          error: 'Video ID is required'
        });
      }

      const databaseManager = require('../config/database');
      const query = `
        SELECT metadata->>'user_tags' as user_tags
        FROM videos 
        WHERE id = $1
      `;
      
      const result = await databaseManager.query(query, [videoId]);
      
      let tags = [];
      if (result.rows.length > 0 && result.rows[0].user_tags) {
        try {
          tags = JSON.parse(result.rows[0].user_tags);
        } catch (e) {
          console.warn('Failed to parse user tags for video:', videoId);
        }
      }
      
      res.json({
        success: true,
        tags: tags
      });
    } catch (error) {
      console.error('Error getting video tags:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get video tags'
      });
    }
  },

  // Record user feedback
  async recordFeedback(req, res) {
    try {
      const { videoId, feedback } = req.body;
      
      if (!videoId || !feedback) {
        return res.status(400).json({
          success: false,
          error: 'Video ID and feedback are required'
        });
      }

      const success = learningService.recordUserFeedback(videoId, feedback);
      
      if (success) {
        res.json({
          success: true,
          message: 'Feedback recorded successfully'
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Failed to record feedback'
        });
      }
    } catch (error) {
      console.error('Feedback recording error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to record feedback'
      });
    }
  },

  // Update final product selection for learning
  async updateFinalSelection(req, res) {
    try {
      const { videoId, finalSelection, userFeedback } = req.body;
      
      if (!videoId || !finalSelection) {
        return res.status(400).json({
          success: false,
          error: 'Video ID and final selection are required'
        });
      }

      const videoStatus = videoProcessingStatus.get(videoId);
      if (!videoStatus) {
        return res.status(404).json({
          success: false,
          error: 'Video not found'
        });
      }

      // Update the learning pattern with final selection
      const success = enhancedObjectDetectionService.recordDetectionPattern(
        videoId,
        videoStatus.videoPath || 'unknown',
        videoStatus.detectedObjects || [],
        videoStatus.aiSuggestions || [],
        finalSelection,
        userFeedback
      );

      if (success) {
        res.json({
          success: true,
          message: 'Final selection recorded for learning'
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Failed to record final selection'
        });
      }
    } catch (error) {
      console.error('Final selection update error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update final selection'
      });
    }
  }
};

module.exports = videoController; 