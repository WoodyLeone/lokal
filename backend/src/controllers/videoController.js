const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const { PythonShell } = require('python-shell');
const enhancedObjectDetectionService = require('../services/enhancedObjectDetectionService');
const productService = require('../services/productService');
const learningService = require('../services/learningService');

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

// In-memory storage for video processing status (in production, use Redis or database)
const videoProcessingStatus = new Map();

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
      
      // Initialize processing status
      videoProcessingStatus.set(videoId, {
        status: 'uploaded',
        progress: 0,
        videoUrl,
        title,
        description,
        manualProductName,
        affiliateLink,
        createdAt: new Date().toISOString()
      });

      // Start object detection in background
      const self = this;
      setTimeout(async function() {
        try {
          videoProcessingStatus.set(videoId, {
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
            // Use demo objects for testing
            const demoObjects = ['laptop', 'chair', 'car'];
            const manualProductName = videoProcessingStatus.get(videoId).manualProductName;
            
            let matchedProducts;
            let aiSuggestions = [];
            
            if (manualProductName) {
              // If manual product name is provided, prioritize it in matching
              console.log(`🎯 Demo mode - Manual product name provided: ${manualProductName}`);
              const searchTerms = [manualProductName, ...demoObjects];
              matchedProducts = await productService.matchProductsByObjects(searchTerms);
              aiSuggestions = generateAISuggestionsForObjects([manualProductName]);
            } else {
              // Use only detected objects for matching
              matchedProducts = await productService.matchProductsByObjects(demoObjects);
              aiSuggestions = generateAISuggestionsForObjects(demoObjects);
            }
            
            videoProcessingStatus.set(videoId, {
              ...videoProcessingStatus.get(videoId),
              status: 'completed',
              progress: 100,
              detectedObjects: demoObjects,
              matchedProducts: matchedProducts,
              aiSuggestions: aiSuggestions,
              completedAt: new Date().toISOString()
            });
            return;
          }

          videoProcessingStatus.set(videoId, {
            ...videoProcessingStatus.get(videoId),
            progress: 50
          });

          // Run enhanced object detection
          const objects = await enhancedObjectDetectionService.detectObjects(finalVideoPath);
          console.log('🎯 Detection results:', objects);
          
          // Handle empty detection results
          if (!objects || objects.length === 0) {
            console.log('⚠️ No objects detected - setting empty results');
            videoProcessingStatus.set(videoId, {
              ...videoProcessingStatus.get(videoId),
              status: 'completed',
              progress: 100,
              detectedObjects: [],
              matchedProducts: [],
              aiSuggestions: [],
              completedAt: new Date().toISOString()
            });
            
            // Record empty detection pattern for learning
            enhancedObjectDetectionService.recordDetectionPattern(videoId, finalVideoPath, [], [], null);
            return;
          }
          
          // Match products with detected objects and manual product name
          let matchedProducts;
          let aiSuggestions = [];
          
          const manualProductName = videoProcessingStatus.get(videoId).manualProductName;
          
          if (manualProductName) {
            // If manual product name is provided, prioritize it in matching
            console.log(`🎯 Manual product name provided: ${manualProductName}`);
            
            // Create a combined search that prioritizes the manual product name
            const searchTerms = [manualProductName, ...objects];
            matchedProducts = await productService.matchProductsByObjects(searchTerms);
            
            // Generate AI suggestions based on manual product name
            aiSuggestions = generateAISuggestionsForObjects([manualProductName]);
          } else {
            // Use only detected objects for matching
            matchedProducts = await productService.matchProductsByObjects(objects);
            aiSuggestions = generateAISuggestionsForObjects(objects);
          }
          
          videoProcessingStatus.set(videoId, {
            ...videoProcessingStatus.get(videoId),
            status: 'completed',
            progress: 100,
            detectedObjects: objects,
            matchedProducts: matchedProducts,
            aiSuggestions: aiSuggestions,
            completedAt: new Date().toISOString()
          });

          // Record detection pattern for learning (without final selection yet)
          enhancedObjectDetectionService.recordDetectionPattern(videoId, finalVideoPath, objects, aiSuggestions);

          // Clean up temp file
          if (fs.existsSync(finalVideoPath)) {
            fs.unlinkSync(finalVideoPath);
          }

        } catch (error) {
          console.error('Processing error:', error);
          videoProcessingStatus.set(videoId, {
            ...videoProcessingStatus.get(videoId),
            status: 'error',
            error: error.message
          });
        }
      }, 1000);

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