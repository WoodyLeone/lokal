# Lokal Backend

A Node.js backend server for Lokal - a shoppable video app with AI-powered object detection and product matching.

## 🚀 Features

- **Video Processing**: Upload and process videos for object detection
- **AI Object Detection**: YOLOv8-powered object detection in video frames
- **Product Matching**: Match detected objects with product databases
- **Real-time Updates**: Socket.IO for real-time video processing status
- **Caching**: Redis-based caching for improved performance
- **Database**: Supabase integration for data persistence
- **Security**: Rate limiting, CORS, and security middleware

## 📁 Project Structure

```
backend/
├── app.js                 # Main entry point for Railway
├── package.json           # Dependencies and scripts
├── Procfile              # Railway deployment configuration
├── railway.json          # Railway-specific configuration
├── .railwayignore        # Files to exclude from Railway deployment
├── .gitignore           # Git ignore rules
├── env.example          # Environment variables template
├── src/
│   ├── server.js        # Main server implementation
│   ├── config/
│   │   └── database.js  # Database configuration
│   ├── controllers/
│   │   ├── productController.js
│   │   └── videoController.js
│   ├── middleware/
│   │   └── upload.js    # File upload middleware
│   ├── routes/
│   │   ├── health.js    # Health check endpoint
│   │   ├── products.js  # Product API routes
│   │   └── videos.js    # Video API routes
│   ├── services/
│   │   ├── objectDetectionService.js
│   │   ├── productService.js
│   │   └── ...
│   └── utils/
│       └── memoryMonitor.js
└── scripts/
    ├── detect_objects.py     # Python object detection script
    ├── download-models.js    # Model download script
    └── check-deployment-readiness.js
```

## 🛠️ Setup

### Prerequisites

- Node.js 18+ 
- Python 3.8+ (for object detection)
- Redis instance
- Supabase project

### Installation

1. **Clone and install dependencies:**
   ```bash
   cd backend
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp env.example .env
   # Edit .env with your actual credentials
   ```

3. **Install Python dependencies:**
   ```bash
   pip install -r scripts/requirements.txt
   ```

4. **Download AI models:**
   ```bash
   npm run download-models
   ```

### Environment Variables

Copy `env.example` to `.env` and configure:

#### Critical Credentials (Keep Secure)
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_ANON_KEY` - Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key
- `REDIS_URL` - Redis connection URL
- `REDIS_PASSWORD` - Redis password
- `OPENAI_API_KEY` - OpenAI API key (for enhanced features)

#### Server Configuration
- `PORT` - Server port (default: 3001)
- `NODE_ENV` - Environment (development/production)
- `CORS_ORIGIN` - Allowed CORS origins

## 🚂 Railway Deployment

### Pre-deployment Check

Run the deployment readiness check:

```bash
npm run check-deployment
```

This will verify:
- ✅ All required files are present
- ✅ No conflicting files exist
- ✅ Configuration is correct
- ✅ Dependencies are properly set up

### Deployment Steps

1. **Commit your changes:**
   ```bash
   git add .
   git commit -m "Clean up for Railway deployment"
   git push
   ```

2. **Deploy to Railway:**
   - Push to your Railway-connected repository
   - Or use Railway CLI: `railway up`

3. **Set environment variables in Railway dashboard:**
   - Use `env.example` as reference
   - Set all critical credentials
   - Configure production settings

4. **Monitor deployment:**
   - Check Railway logs for successful startup
   - Test health endpoint: `https://your-app.railway.app/api/health`

### Railway Configuration

- **Start Command**: `npm start` (runs `node app.js`)
- **Health Check**: `/api/health`
- **Build**: Automatic via Nixpacks
- **Model Download**: Automatic via postinstall script

## 🧪 Development

### Start Development Server

```bash
npm run dev
```

### Run Tests

```bash
npm test
npm run test:db
```

### Health Check

```bash
curl http://localhost:3001/api/health
```

## 📡 API Endpoints

### Health Check
- `GET /api/health` - Server health status

### Videos
- `POST /api/videos/upload` - Upload video for processing
- `GET /api/videos/:id` - Get video processing status
- `GET /api/videos` - List processed videos

### Products
- `GET /api/products` - List products
- `POST /api/products` - Create product
- `GET /api/products/match` - Match products with objects

## 🔧 Configuration

### Object Detection
- YOLOv8 model: `yolov8n.pt` (downloaded automatically)
- Confidence threshold: 0.5 (configurable)
- Max frames per video: 10 (configurable)

### Caching
- Redis-based caching
- Configurable TTL for different data types
- Automatic cache invalidation

### Security
- Rate limiting: 100 requests per 15 minutes
- CORS protection
- Helmet security headers
- Session management with Redis

## 🐛 Troubleshooting

### Common Issues

1. **Model not found:**
   ```bash
   npm run download-models
   ```

2. **Database connection failed:**
   - Check Supabase credentials in `.env`
   - Verify network connectivity

3. **Redis connection failed:**
   - Check Redis credentials in `.env`
   - Verify Redis instance is running

4. **Python dependencies missing:**
   ```bash
   pip install -r scripts/requirements.txt
   ```

### Logs

- Application logs: `./logs/app.log`
- Railway logs: Available in Railway dashboard
- Development logs: Console output

## 📝 License

MIT License - see LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests: `npm test`
5. Submit a pull request

## 📞 Support

For issues and questions:
- Check the troubleshooting section
- Review Railway deployment logs
- Open an issue in the repository 