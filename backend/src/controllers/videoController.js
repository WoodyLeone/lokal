const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const { PythonShell } = require('python-shell');
const enhancedObjectDetectionService = require('../services/enhancedObjectDetectionService');
const productService = require('../services/productService');
const learningService = require('../services/learningService');
const databaseManager = require('../config/database');

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
      const { videoUrl, videoData, title, description, manualProductName, affiliateLink } = req.body;

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
      
      // Save video to database (now with service role access)
      console.log('🔍 Attempting to save video to database...');
      let supabase;
      try {
        supabase = databaseManager.getSupabase();
        console.log('✅ Supabase client obtained successfully');
      } catch (error) {
        console.warn('⚠️ Supabase not available:', error.message);
        supabase = null;
      }
      
      if (supabase) {
        console.log('🔍 Supabase is available, proceeding with database save...');
        
        // Use authenticated user ID or create a demo user ID
        let userId = req.user?.id;
        if (!userId) {
          // Create a demo user ID using UUID for proper format
          const userEmail = req.body.userEmail || req.headers['x-user-email'] || 'demo@lokal.com';
          // Generate a deterministic UUID based on email
          const emailHash = require('crypto').createHash('md5').update(userEmail).digest('hex');
          userId = `${emailHash.slice(0, 8)}-${emailHash.slice(8, 12)}-${emailHash.slice(12, 16)}-${emailHash.slice(16, 20)}-${emailHash.slice(20, 32)}`;
          console.log(`🔧 Using demo user ID: ${userId} for email: ${userEmail}`);
        }
        
        let insertData = {
          id: videoId,
          title,
          description: description || '',
          video_url: videoUrl || 'demo://test-video', // Provide default for NOT NULL constraint
          user_id: userId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        console.log('🔍 Inserting video data:', JSON.stringify(insertData, null, 2));
        const { data: videoRecord, error: dbError } = await supabase
          .from('videos')
          .insert(insertData)
          .select()
          .single();

        if (dbError) {
          console.error('❌ Error saving video to database:', dbError);
          console.error('❌ Error details:', JSON.stringify(dbError, null, 2));
          console.warn('⚠️ Continuing with in-memory storage only');
        } else {
          console.log(`✅ Video saved to database with ID: ${videoId}`);
          console.log('✅ Database record:', JSON.stringify(videoRecord, null, 2));
        }
      } else {
        console.warn('⚠️ Supabase not available, using in-memory storage only');
      }

      // Initialize processing status
      updateVideoStatus(videoId, {
        status: 'uploaded',
        progress: 0,
        videoUrl,
        title,
        description,
        manualProductName,
        affiliateLink,
        createdAt: new Date().toISOString()
      });

      // Start object detection immediately (no setTimeout to avoid restart issues)
      console.log(`🚀 Starting immediate processing for video: ${videoId}`);
      
      // Process video in background without blocking the response
      setImmediate(async function() {
        try {
          console.log(`📊 Updating status to processing for video: ${videoId}`);
          updateVideoStatus(videoId, {
            ...videoProcessingStatus.get(videoId),
            status: 'processing',
            progress: 25
          });

          let finalVideoPath = videoPath;

          // If we have videoUrl but no videoPath, download the video
          if (videoUrl && !videoPath) {
            // Only download if videoUrl is a valid HTTP/HTTPS URL
            if (videoUrl.startsWith('http://') || videoUrl.startsWith('https://')) {
              const downloadPath = path.join(__dirname, '../temp', `${videoId}.mp4`);
              
              // Ensure temp directory exists
              const tempDir = path.dirname(downloadPath);
              if (!fs.existsSync(tempDir)) {
                fs.mkdirSync(tempDir, { recursive: true });
              }
              
              const response = await axios({
                method: 'GET',
                url: videoUrl,
                responseType: 'stream'
              });

              const writer = fs.createWriteStream(downloadPath);
              response.data.pipe(writer);

              await new Promise((resolve, reject) => {
                writer.on('finish', resolve);
                writer.on('error', reject);
              });

              finalVideoPath = downloadPath;
            } else {
              console.error('Invalid video URL protocol:', videoUrl);
              throw new Error('Invalid video URL protocol. Only HTTP/HTTPS URLs are supported.');
            }
          }

          // Handle case where no video file is provided (for testing)
          if (!finalVideoPath || !fs.existsSync(finalVideoPath)) {
            console.log('⚠️ No video file available - using demo objects for testing');
            
            // Use demo objects for testing when no video file is provided
            const demoObjects = ['laptop', 'chair', 'car'];
            const manualProductName = videoProcessingStatus.get(videoId).manualProductName;
            
            let matchedProducts;
            let aiSuggestions = [];
            
            if (manualProductName) {
              // If manual product name is provided, prioritize it in matching
              console.log(`🎯 Demo mode - Manual product name provided: ${manualProductName}`);
              matchedProducts = await productService.matchProductsByObjects(demoObjects, manualProductName);
              aiSuggestions = generateAISuggestionsForObjects([manualProductName]);
            } else {
              // Use only detected objects for matching
              matchedProducts = await productService.matchProductsByObjects(demoObjects);
              aiSuggestions = generateAISuggestionsForObjects(demoObjects);
            }
            
            const finalStatus = {
              ...videoProcessingStatus.get(videoId),
              status: 'completed',
              progress: 100,
              detectedObjects: demoObjects,
              matchedProducts: matchedProducts,
              aiSuggestions: aiSuggestions,
              completedAt: new Date().toISOString()
            };
            updateVideoStatus(videoId, finalStatus);
            await updateVideoInDatabase(videoId, finalStatus);
            return;
          }

          updateVideoStatus(videoId, {
            ...videoProcessingStatus.get(videoId),
            progress: 50
          });

          // Run enhanced object detection with manual product name context
          const manualProductName = videoProcessingStatus.get(videoId).manualProductName;
          const objects = await enhancedObjectDetectionService.detectObjects(finalVideoPath, manualProductName);
          console.log('🎯 Detection results:', objects);
          
          // Match products with detected objects and manual product name
          let matchedProducts;
          let aiSuggestions = [];
          
          if (manualProductName) {
            // If manual product name is provided, prioritize it in matching
            console.log(`🎯 Manual product name provided: ${manualProductName}`);
            
            // Use the improved matching logic that prioritizes manual product name
            matchedProducts = await productService.matchProductsByObjects(objects, manualProductName);
            
            // Generate AI suggestions based on manual product name
            aiSuggestions = generateAISuggestionsForObjects([manualProductName]);
          } else {
            // Use only detected objects for matching
            matchedProducts = await productService.matchProductsByObjects(objects);
            aiSuggestions = generateAISuggestionsForObjects(objects);
          }
          
          // Handle empty results - don't fall back to demo data in production
          if (!matchedProducts || matchedProducts.length === 0) {
            console.log('⚠️ No products matched - returning empty results');
            const finalStatus = {
              ...videoProcessingStatus.get(videoId),
              status: 'completed',
              progress: 100,
              detectedObjects: objects || [],
              matchedProducts: [],
              aiSuggestions: aiSuggestions || [],
              completedAt: new Date().toISOString()
            };
            updateVideoStatus(videoId, finalStatus);
            await updateVideoInDatabase(videoId, finalStatus);
            
            // Record detection pattern for learning
            enhancedObjectDetectionService.recordDetectionPattern(videoId, finalVideoPath, objects || [], aiSuggestions || [], null);
            return;
          }
          
          const finalStatus = {
            ...videoProcessingStatus.get(videoId),
            status: 'completed',
            progress: 100,
            detectedObjects: objects,
            matchedProducts: matchedProducts,
            aiSuggestions: aiSuggestions,
            completedAt: new Date().toISOString()
          };
          updateVideoStatus(videoId, finalStatus);
          await updateVideoInDatabase(videoId, finalStatus);

          // Record detection pattern for learning (without final selection yet)
          enhancedObjectDetectionService.recordDetectionPattern(videoId, finalVideoPath, objects, aiSuggestions);

          // Clean up temp file
          if (fs.existsSync(finalVideoPath)) {
            fs.unlinkSync(finalVideoPath);
          }

        } catch (error) {
          console.error('Processing error:', error);
          const errorStatus = {
            ...videoProcessingStatus.get(videoId),
            status: 'error',
            error: error.message
          };
          updateVideoStatus(videoId, errorStatus);
          await updateVideoInDatabase(videoId, errorStatus);
        }
      });

      res.json({
        success: true,
        videoId,
        message: 'Video uploaded successfully. Processing started.'
      });

    } catch (error) {
      console.error('Upload error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to upload video'
      });
    }
  },

  // Trigger object detection for a video
  async detectObjects(req, res) {
    try {
      const { videoId } = req.params;
      const videoStatus = videoProcessingStatus.get(videoId);

      if (!videoStatus) {
        return res.status(404).json({
          success: false,
          error: 'Video not found'
        });
      }

      if (videoStatus.status === 'completed' && videoStatus.detectedObjects) {
        return res.json({
          success: true,
          objects: videoStatus.detectedObjects,
          matchedProducts: videoStatus.matchedProducts || [],
          manualProductName: videoStatus.manualProductName || null,
          aiSuggestions: videoStatus.aiSuggestions || [],
          detectionMethod: 'hybrid'
        });
      }

      if (videoStatus.status === 'error') {
        return res.status(500).json({
          success: false,
          error: videoStatus.error || 'Processing failed'
        });
      }

      // If still processing, return current status
      res.json({
        success: false,
        error: 'Video is still being processed',
        status: videoStatus.status,
        progress: videoStatus.progress
      });

    } catch (error) {
      console.error('Detection error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to detect objects'
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