# Lokal Backend Server

Backend server for Lokal - a shoppable video app with object detection capabilities.

## Features

- **Video Upload & Processing**: Handle video uploads up to 500MB
- **Object Detection**: AI-powered object detection using YOLO
- **Product Matching**: Match detected objects with products
- **RESTful API**: Clean API endpoints for frontend integration
- **File Upload Support**: Direct file uploads and base64 fallback

## File Size Limits

### Current Configuration
- **Maximum Video Duration**: 3 minutes (180 seconds)
- **Maximum File Size**: 500MB
- **Supported Formats**: MP4, MOV, AVI, MKV, WebM

### Backend Limits
- Express JSON payload limit: 500MB
- Multer file upload limit: 500MB
- Upload timeout: 2 minutes
- Object detection timeout: 5 minutes

## API Endpoints

### Video Management
- `POST /api/videos/upload` - Upload video (supports both file upload and base64)
- `POST /api/videos/upload-file` - Direct file upload endpoint
- `POST /api/videos/:videoId/detect-objects` - Trigger object detection
- `GET /api/videos/:videoId/status` - Get video processing status
- `GET /api/videos` - Get all videos
- `GET /api/videos/:videoId` - Get video by ID

### Product Management
- `GET /api/products` - Get all products
- `POST /api/products/match` - Match products by objects
- `GET /api/products/category/:category` - Get products by category

### Health Check
- `GET /api/health` - Server health status

## Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables (create `.env` file):
```env
PORT=3001
NODE_ENV=development
```

3. Start the server:
```bash
npm start
```

For development with auto-restart:
```bash
npm run dev
```

## File Upload Methods

### Method 1: Direct File Upload (Recommended for large files)
```javascript
const formData = new FormData();
formData.append('video', videoFile);
formData.append('title', 'My Video');
formData.append('description', 'Video description');

fetch('/api/videos/upload-file', {
  method: 'POST',
  body: formData
});
```

### Method 2: Base64 Upload (Fallback)
```javascript
fetch('/api/videos/upload', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    videoData: base64String,
    title: 'My Video',
    description: 'Video description'
  })
});
```

### Method 3: URL Upload
```javascript
fetch('/api/videos/upload', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    videoUrl: 'https://example.com/video.mp4',
    title: 'My Video',
    description: 'Video description'
  })
});
```

## Object Detection

The server uses YOLO (You Only Look Once) for real-time object detection. The detection process:

1. Video is uploaded and saved temporarily
2. Frames are extracted from the video
3. YOLO model processes each frame
4. Objects are detected and classified
5. Results are returned to the client
6. Temporary files are cleaned up

## Error Handling

The server includes comprehensive error handling for:
- File size limits
- Invalid file types
- Upload timeouts
- Processing failures
- Network errors

## Development

### Project Structure
```
src/
├── controllers/     # Request handlers
├── middleware/      # Express middleware
├── routes/          # API route definitions
├── services/        # Business logic
├── temp/           # Temporary file storage
└── server.js       # Main server file
```

### Adding New Features
1. Create controller in `controllers/`
2. Define routes in `routes/`
3. Add middleware if needed in `middleware/`
4. Update this README

## Performance Considerations

- Large files (>100MB) should use direct file upload
- Object detection processing time scales with video length
- Consider implementing video compression for very large files
- Monitor server memory usage during processing

## Troubleshooting

### Common Issues

1. **File too large error**: Check that file size is under 500MB
2. **Upload timeout**: Increase timeout settings for very large files
3. **Processing fails**: Check that video format is supported
4. **Memory issues**: Monitor server resources during large file processing

### Logs
Check server logs for detailed error information:
```bash
npm run dev
```

## License

MIT License - see LICENSE file for details. 