const express = require('express');
const router = express.Router();
const videoController = require('../controllers/videoController');
const { uploadVideo, handleUploadError } = require('../middleware/upload');
const path = require('path');
const fs = require('fs');

// Video upload and processing
router.post('/upload', uploadVideo, handleUploadError, videoController.uploadVideo);
router.post('/upload-file', uploadVideo, handleUploadError, videoController.uploadVideo);

// Video serving endpoint
router.get('/serve/:videoId', async (req, res) => {
  try {
    const { videoId } = req.params;
    
    // Get video info from database
    const { Pool } = require('pg');
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    });
    
    const result = await pool.query(
      'SELECT video_url FROM videos WHERE id = $1',
      [videoId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Video not found' });
    }
    
    const videoUrl = result.rows[0].video_url;
    
    // Handle different URL types
    if (videoUrl.startsWith('file://')) {
      const filePath = videoUrl.replace('file://', '');
      
      // Check if file exists
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'Video file not found' });
      }
      
      // Get file stats
      const stats = fs.statSync(filePath);
      const fileSize = stats.size;
      const range = req.headers.range;
      
      if (range) {
        const parts = range.replace(/bytes=/, "").split("-");
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
        const chunksize = (end - start) + 1;
        const file = fs.createReadStream(filePath, { start, end });
        const head = {
          'Content-Range': `bytes ${start}-${end}/${fileSize}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': chunksize,
          'Content-Type': 'video/mp4',
        };
        res.writeHead(206, head);
        file.pipe(res);
      } else {
        const head = {
          'Content-Length': fileSize,
          'Content-Type': 'video/mp4',
        };
        res.writeHead(200, head);
        fs.createReadStream(filePath).pipe(res);
      }
    } else if (videoUrl.startsWith('http')) {
      // Redirect to external URL
      res.redirect(videoUrl);
    } else {
      res.status(400).json({ error: 'Invalid video URL format' });
    }
    
    await pool.end();
  } catch (error) {
    console.error('Error serving video:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Video status and detection
router.get('/status/:videoId', videoController.getVideoStatus);
router.get('/detect/:videoId', videoController.detectObjects);

// Pipeline endpoints
router.get('/pipeline/status/:videoId', videoController.getPipelineStatus);
router.get('/pipeline/stats', videoController.getPipelineStats);
router.get('/pipeline/results/:videoId', videoController.getPipelineResults);

// Data retrieval endpoints
router.get('/detections/:videoId', videoController.getObjectDetections);
router.get('/matches/:videoId', videoController.getProductMatches);
router.get('/analysis/:videoId', videoController.getVideoAnalysis);

// User feedback endpoints
router.post('/feedback', videoController.recordFeedback);
router.get('/feedback/:videoId', videoController.getUserFeedback);
router.post('/user-feedback', videoController.saveUserFeedback);

// User tag integration endpoints
router.post('/tags/validate', videoController.validateUserTags);
router.get('/tags/suggestions/:videoId', videoController.getTagSuggestions);
router.post('/tags/match/:videoId', videoController.matchProductsWithUserTags);
router.put('/tags/:videoId', videoController.updateVideoTags);
router.get('/tags/:videoId', videoController.getVideoTags);

// Learning and feedback endpoints
router.get('/learning/stats', videoController.getLearningStats);
router.post('/final-selection', videoController.updateFinalSelection);

// Video management (these must come after specific routes)
router.get('/', videoController.getAllVideos);
router.get('/:id', videoController.getVideoById);

module.exports = router; 