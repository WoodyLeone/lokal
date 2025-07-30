const express = require('express');
const router = express.Router();
const videoController = require('../controllers/videoController');
const { uploadVideo, handleUploadError } = require('../middleware/upload');

// Video upload and processing
router.post('/upload', uploadVideo, handleUploadError, videoController.uploadVideo);

// Video status and detection
router.get('/status/:videoId', videoController.getVideoStatus);
router.get('/detect/:videoId', videoController.detectObjects);

// Video management
router.get('/', videoController.getAllVideos);
router.get('/:id', videoController.getVideoById);

// Learning and feedback endpoints
router.get('/learning/stats', videoController.getLearningStats);
router.post('/feedback', videoController.recordFeedback);
router.post('/final-selection', videoController.updateFinalSelection);

module.exports = router; 