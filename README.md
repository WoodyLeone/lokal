# 🛍️ Lokal - Shoppable Video Platform

A modern React Native application for creating and discovering shoppable videos, powered by Railway PostgreSQL and AI object detection.

## 🎯 Vision

**Lokal** is a shoppable video platform where:
- **Content Creators** upload videos and track items to make them shoppable
- **AI Technology** automatically detects objects and suggests products
- **Viewers** interact with videos by clicking on tracked items to shop
- **Seamless Shopping** - direct purchase from video content

## 🏗️ Architecture

- **Frontend**: React Native with Expo
- **Database**: Railway PostgreSQL
- **Authentication**: JWT-based
- **Backend API**: Railway-hosted Node.js
- **Object Detection**: Python-based ML pipeline with YOLOv8
- **Video Processing**: Real-time object tracking and product matching

## 🚀 Quick Start

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Expo CLI
- Railway account (for database)

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd LokalRN
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Railway PostgreSQL**
   ```bash
   # Configure your Railway database connection
   npm run configure-railway
   ```

4. **Setup database schema**
   ```bash
   npm run setup-railway
   ```

5. **Test database connection**
   ```bash
   npm run test-database
   ```

6. **Start the development server**
   ```bash
   npm start
   ```

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
# Railway PostgreSQL Configuration
EXPO_PUBLIC_DATABASE_URL=postgresql://postgres:password@mainline.proxy.rlwy.net:25135/railway

# Backend API Configuration
EXPO_PUBLIC_API_BASE_URL=https://your-backend.railway.app/api

# App Configuration
EXPO_PUBLIC_APP_NAME=Lokal
EXPO_PUBLIC_APP_VERSION=1.0.0
```

### Railway PostgreSQL Setup

1. **Create Railway Project**
   - Go to [Railway](https://railway.app)
   - Create a new project
   - Add a PostgreSQL database

2. **Get Connection String**
   - Go to your PostgreSQL database in Railway
   - Click "Connect" tab
   - Copy the "Postgres Connection URL"

3. **Configure Locally**
   ```bash
   npm run configure-railway
   # Paste your connection string when prompted
   ```

## 🗄️ Database Schema

### Tables

- **users**: User authentication and profiles
- **profiles**: Extended user information
- **videos**: Video uploads and metadata with tracking data
- **products**: Product catalog and matching data
- **tracked_items**: Item tracking coordinates and timing
- **analytics**: Video performance and engagement metrics

### Sample Data

The database comes with sample products and a test user:
- **Test User**: `test@example.com` / `password`
- **Sample Products**: Nike Air Max 270, Adidas Ultraboost, Apple Watch Series 9, etc.

## 🛠️ Available Scripts

```bash
# Development
npm start              # Start Expo development server
npm run android        # Start Android emulator
npm run ios           # Start iOS simulator
npm run web           # Start web version

# Database Management
npm run configure-railway     # Configure Railway connection
npm run test-railway-connection  # Test database connection
npm run setup-railway         # Setup database schema
npm run test-database         # Test database operations

# Utilities
npm run clean                 # Clean and reinstall dependencies
npm run cleanup-env           # Clean environment file
```

## 🔐 Authentication

The app uses JWT-based authentication with Railway PostgreSQL:

- **Registration**: Create new user accounts
- **Login**: Authenticate with email/password
- **Profile Management**: Update user information
- **Session Management**: Automatic token refresh

## 📱 Features

### Core Features
- **Video Upload**: Upload videos from camera roll or local storage
- **AI Object Detection**: Automatic object detection using YOLOv8
- **Item Tracking**: Interactive item selection and tracking
- **Product Matching**: Intelligent product suggestions
- **Shoppable Videos**: Interactive hotspots and purchase flow
- **Creator Analytics**: Performance metrics and insights

### Technical Features
- **Real-time Database**: Railway PostgreSQL with connection pooling
- **Offline Support**: Local data caching
- **Error Handling**: Comprehensive error recovery
- **Performance**: Optimized queries and caching
- **AI Integration**: Python ML pipeline with Node.js

## 🎬 Shoppable Video Experience

### For Content Creators
1. **Upload Video**: Select video from camera roll
2. **AI Detection**: Automatic object detection
3. **Item Selection**: Choose items to track
4. **Product Matching**: AI suggests relevant products
5. **Publish**: Share shoppable video with audience

### For Viewers
1. **Discover**: Browse shoppable video feed
2. **Interact**: Tap on tracked items in videos
3. **Shop**: View product details and pricing
4. **Purchase**: Direct link to product pages
5. **Engage**: Like, share, and comment on videos

## 🏗️ Project Structure

```
LokalRN/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── ShoppableVideoPlayer.tsx
│   │   ├── ProductCard.tsx
│   │   ├── ItemTrackingOverlay.tsx
│   │   └── ...
│   ├── screens/            # App screens
│   │   ├── HomeScreen.tsx  # TikTok-style video feed
│   │   ├── UploadScreen.tsx # Video creation flow
│   │   ├── ProfileScreen.tsx # Creator profile
│   │   └── AuthScreen.tsx
│   ├── services/           # Business logic and API calls
│   ├── config/             # Configuration files
│   ├── types/              # TypeScript type definitions
│   └── utils/              # Utility functions
├── scripts/                # Database and setup scripts
├── assets/                 # Static assets
└── docs/                   # Documentation
```

## 🔧 Development

### Database Development

```bash
# Test database connection
npm run test-railway-connection

# Setup fresh database
npm run setup-railway

# Test all operations
npm run test-database
```

### Code Quality

- **TypeScript**: Full type safety
- **ESLint**: Code linting
- **Prettier**: Code formatting
- **Expo**: Modern React Native development

## 🚀 Deployment

### Railway Deployment

1. **Database**: Already configured on Railway
2. **Backend API**: Deployed on Railway
3. **Frontend**: Build and deploy to app stores

### Production Checklist

- [ ] Environment variables configured
- [ ] Database schema deployed
- [ ] AI object detection pipeline running
- [ ] Product catalog populated
- [ ] Analytics tracking enabled
- [ ] Payment processing configured
- [ ] Content moderation in place

## 🎯 Key Features

### AI-Powered Object Detection
- **YOLOv8 Integration**: Real-time object detection
- **Frame Extraction**: Automatic video processing
- **Confidence Filtering**: Quality control for detections
- **Fallback Systems**: Reliable processing pipeline

### Interactive Video Experience
- **Hotspot Tracking**: Clickable items in videos
- **Product Overlays**: Seamless shopping integration
- **Timeline Tracking**: Item visibility throughout video
- **Purchase Flow**: Direct product links

### Creator Tools
- **Video Analytics**: Performance insights
- **Product Management**: Catalog organization
- **Revenue Tracking**: Sales and commission data
- **Content Moderation**: Quality control tools

### Viewer Experience
- **TikTok-Style Feed**: Vertical video scrolling
- **Interactive Shopping**: Tap-to-shop functionality
- **Product Discovery**: AI-powered recommendations
- **Social Features**: Like, share, comment

## 🔮 Future Roadmap

### Phase 1: Core Platform ✅
- [x] Video upload and processing
- [x] AI object detection
- [x] Product matching
- [x] Interactive video player
- [x] Basic analytics

### Phase 2: Enhanced Features
- [ ] Advanced AI tracking
- [ ] Multi-platform sharing
- [ ] Creator marketplace
- [ ] Advanced analytics
- [ ] Mobile app stores

### Phase 3: Scale & Monetization
- [ ] Creator revenue sharing
- [ ] Brand partnerships
- [ ] Advanced AI features
- [ ] Global expansion
- [ ] Enterprise features

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Review the troubleshooting guide

---

**Lokal** - Transforming videos into shoppable experiences with AI-powered object detection and seamless e-commerce integration. 