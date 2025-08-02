# 🚀 Lokal - React Native App

A modern React Native application for product matching and video analysis, powered by Railway PostgreSQL.

## 🏗️ Architecture

- **Frontend**: React Native with Expo
- **Database**: Railway PostgreSQL
- **Authentication**: JWT-based
- **Backend API**: Railway-hosted Node.js
- **Object Detection**: Python-based ML pipeline

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
- **videos**: Video uploads and metadata
- **products**: Product catalog and matching data

### Sample Data

The database comes with sample products and a test user:
- **Test User**: `test@example.com` / `password`
- **Sample Products**: Nike Air Max 270, Adidas Ultraboost, etc.

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
- **User Authentication**: Secure login/registration
- **Product Catalog**: Browse and search products
- **Video Upload**: Upload and process videos
- **Object Detection**: AI-powered product matching
- **Profile Management**: User settings and preferences

### Technical Features
- **Real-time Database**: Railway PostgreSQL with connection pooling
- **Offline Support**: Local data caching
- **Error Handling**: Comprehensive error recovery
- **Performance**: Optimized queries and caching

## 🏗️ Project Structure

```
LokalRN/
├── src/
│   ├── components/          # Reusable UI components
│   ├── screens/            # App screens
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
- [ ] API endpoints tested
- [ ] Authentication working
- [ ] Error handling implemented
- [ ] Performance optimized

## 🐛 Troubleshooting

### Common Issues

**Database Connection Failed**
```bash
# Test connection
npm run test-railway-connection

# Reconfigure if needed
npm run configure-railway
```

**App Won't Start**
```bash
# Clean and reinstall
npm run clean

# Check environment
npm run test-database
```

**Authentication Issues**
- Verify database is running
- Check JWT configuration
- Test with sample credentials

## 📊 Performance

### Database Performance
- **Connection Pooling**: Optimized with Railway
- **Query Optimization**: Indexed tables
- **Caching**: Local data caching
- **Real-time**: Live data updates

### App Performance
- **Lazy Loading**: Components load on demand
- **Image Optimization**: Compressed assets
- **Memory Management**: Efficient state management
- **Network Optimization**: Minimal API calls

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Check the troubleshooting section
- Review the documentation
- Test database connectivity
- Verify environment configuration

---

**Built with ❤️ using Railway PostgreSQL and React Native** 