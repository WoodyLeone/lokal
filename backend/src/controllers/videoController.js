const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const { PythonShell } = require('python-shell');
const hybridDetectionService = require('../services/hybridDetectionService');
const productService = require('../services/productService');

// In-memory storage for video processing status (in production, use Redis or database)
const videoProcessingStatus = new Map();

const videoController = {
  // Upload video and start processing
  async uploadVideo(req, res) {
    try {
      const { videoUrl, videoData, title, description } = req.body;

      if ((!videoUrl && !videoData && !req.file) || !title) {
        return res.status(400).json({
          success: false,
          error: 'Video file/data/URL and title are required'
        });
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
        createdAt: new Date().toISOString()
      });

      // Start object detection in background
      setTimeout(async () => {
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

          // Ensure we have a valid video path for processing
          if (!finalVideoPath || !fs.existsSync(finalVideoPath)) {
            throw new Error('No valid video file found for processing');
          }

          videoProcessingStatus.set(videoId, {
            ...videoProcessingStatus.get(videoId),
            progress: 50
          });

          // Run object detection
          const objects = await hybridDetectionService.detectObjectsWithOpenAI(finalVideoPath);
          
          // Match products with detected objects
          const matchedProducts = await productService.matchProductsByObjects(objects);
          
          videoProcessingStatus.set(videoId, {
            ...videoProcessingStatus.get(videoId),
            status: 'completed',
            progress: 100,
            detectedObjects: objects,
            matchedProducts: matchedProducts,
            completedAt: new Date().toISOString()
          });

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
  }
};

module.exports = videoController; 