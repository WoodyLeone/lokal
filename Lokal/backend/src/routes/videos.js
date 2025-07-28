const express = require('express');
const router = express.Router();
const videoController = require('../controllers/videoController');
const { uploadVideo, handleUploadError } = require('../middleware/upload');

// Video upload endpoint with file upload middleware
router.post('/upload', uploadVideo, handleUploadError, videoController.uploadVideo);

// Direct file upload endpoint (alternative to base64)
router.post('/upload-file', uploadVideo, handleUploadError, videoController.uploadVideo);

// Object detection endpoint
router.post('/:videoId/detect-objects', videoController.detectObjects);

// Video status endpoint
router.get('/:videoId/status', videoController.getVideoStatus);

// Get all videos
router.get('/', videoController.getAllVideos);

// Get video by ID
router.get('/:videoId', videoController.getVideoById);

module.exports = router; 