# Lokal iOS App

A SwiftUI-based iOS app for the Lokal shoppable video platform. This app allows users to upload videos, detect objects using AI, and match them with purchasable products.

## 🚀 Current Status

### ✅ Completed Features
- **Authentication System**: Sign up/sign in with email validation
- **Home Feed**: Display uploaded videos with product matching
- **Video Upload**: Multi-step upload process with progress tracking
- **Object Detection**: AI-powered object detection (demo mode)
- **Product Matching**: Match detected objects to products
- **Product Details**: Interactive product cards with buy links
- **Profile Management**: User profile with upload history
- **Video Player**: Native video playback with AVKit
- **Network Layer**: API integration with backend services
- **Error Handling**: Comprehensive error handling and user feedback
- **Demo Mode**: Fallback system for testing without backend

### 🏗 Architecture
- **SwiftUI**: Modern declarative UI framework
- **MVVM Pattern**: Clean separation of concerns
- **Async/Await**: Modern concurrency for network calls
- **AVKit**: Native video playback
- **PhotosUI**: Photo library integration
- **Network Layer**: Custom API service with error handling

## 📱 Screenshots

*Screenshots will be added here*

## 🛠 Tech Stack

### Frontend
- **SwiftUI**: UI framework
- **AVKit**: Video playback
- **PhotosUI**: Media selection
- **Combine**: Reactive programming (planned)

### Backend Integration
- **RESTful API**: Node.js backend
- **JSON**: Data serialization
- **URLSession**: Network requests
- **Async/Await**: Modern concurrency

### Data Models
- **Codable**: JSON serialization
- **Identifiable**: SwiftUI list support
- **ObservableObject**: State management

## 🚀 Getting Started

### Prerequisites
- Xcode 15.0+
- iOS 17.0+
- Node.js backend running (optional for demo mode)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Lokal/Lokal
   ```

2. **Open in Xcode**
   ```bash
   open Lokal.xcodeproj
   ```

3. **Configure backend (optional)**
   - Update `AppConfig.swift` with your backend URL
   - Ensure backend server is running on specified port

4. **Build and run**
   - Select your target device/simulator
   - Press Cmd+R to build and run

### Demo Mode
The app works immediately in demo mode without any backend configuration:
- Simulated object detection
- Demo videos and products
- Full functionality for testing

## 📁 Project Structure

```
Lokal/
├── ContentView.swift          # Main app structure
├── AppConfig.swift           # Configuration and constants
├── LokalApp.swift            # App entry point
├── Assets.xcassets/          # App assets
├── Info.plist               # App configuration
└── README.md                # This file
```

### Key Components

#### ContentView.swift
- **ContentView**: Main app coordinator
- **AuthView**: Authentication screen
- **HomeView**: Video feed
- **UploadView**: Video upload flow
- **ProfileView**: User profile
- **NetworkService**: API integration
- **Data Models**: DemoVideo, DemoProduct
- **UI Components**: VideoCard, ProductCard, etc.

#### AppConfig.swift
- API configuration
- Video constraints
- Feature flags
- Error messages
- Validation helpers

## 🔧 Configuration

### Backend Integration
Update `AppConfig.swift` to point to your backend:

```swift
static let apiBaseURL = "http://your-backend-url:3001/api"
```

### Video Constraints
Configure video upload limits:

```swift
static let maxVideoDuration: TimeInterval = 180 // 3 minutes
static let maxVideoSize: Int64 = 100 * 1024 * 1024 // 100MB
```

### Feature Flags
Enable/disable features:

```swift
static let enableObjectDetection = true
static let enableProductMatching = true
static let enableDemoMode = true
```

## 🎯 Usage

### Authentication
1. Launch the app
2. Enter email and password
3. Tap "Sign In" or "Create Account"
4. App will authenticate and show main interface

### Uploading Videos
1. Navigate to "Upload" tab
2. Tap "Select Video" to choose from photo library
3. Enter title and description
4. Tap "Upload & Process"
5. Wait for object detection to complete
6. Review detected objects and matched products

### Viewing Videos
1. Navigate to "Home" tab
2. Scroll through uploaded videos
3. Tap on videos to play them
4. Scroll through matched products below videos
5. Tap on products to view details and buy

### Managing Profile
1. Go to "Profile" tab
2. View upload statistics
3. See recent uploads
4. Access app settings

## 🔮 Next Steps

### Immediate Priorities (Next 1-2 weeks)

#### 1. **Real Backend Integration**
- [ ] Connect to actual Node.js backend
- [ ] Implement real video upload to Supabase
- [ ] Add real object detection results
- [ ] Implement product matching API

#### 2. **Video Processing Enhancement**
- [ ] Add video compression before upload
- [ ] Implement thumbnail generation
- [ ] Add video duration validation
- [ ] Support for multiple video formats

#### 3. **User Experience Improvements**
- [ ] Add loading states and animations
- [ ] Implement pull-to-refresh
- [ ] Add video progress indicators
- [ ] Improve error messages and recovery

#### 4. **Product Interaction**
- [ ] Add product search functionality
- [ ] Implement product categories
- [ ] Add product filtering
- [ ] Implement product recommendations

### Medium Term (Next 1-2 months)

#### 5. **Advanced Features**
- [ ] Real-time video processing status
- [ ] Push notifications for processing completion
- [ ] Offline mode support
- [ ] Video editing capabilities

#### 6. **Social Features**
- [ ] User following system
- [ ] Video likes and comments
- [ ] Sharing functionality
- [ ] User discovery

#### 7. **E-commerce Integration**
- [ ] Payment processing
- [ ] Shopping cart functionality
- [ ] Order tracking
- [ ] Product reviews

### Long Term (Next 3-6 months)

#### 8. **AI Enhancement**
- [ ] Multiple object detection models
- [ ] Scene understanding
- [ ] Product recognition
- [ ] Personalized recommendations

#### 9. **Performance Optimization**
- [ ] Video caching
- [ ] CDN integration
- [ ] Background processing
- [ ] Memory optimization

#### 10. **Platform Expansion**
- [ ] iPad support
- [ ] Apple Watch companion app
- [ ] macOS app
- [ ] Web platform

## 🧪 Testing

### Manual Testing
- [ ] Authentication flow
- [ ] Video upload process
- [ ] Object detection
- [ ] Product matching
- [ ] Video playback
- [ ] Error handling

### Automated Testing (Planned)
- [ ] Unit tests for data models
- [ ] UI tests for critical flows
- [ ] Network layer tests
- [ ] Integration tests

## 🐛 Known Issues

1. **Video Upload**: Currently uses demo data - needs real backend integration
2. **Object Detection**: Uses simulated results - needs AI model integration
3. **Product Matching**: Uses dummy products - needs real product database
4. **Video Player**: Limited controls - needs enhanced player features

## 🔒 Security Considerations

- [ ] Input validation on all user inputs
- [ ] Secure API communication (HTTPS)
- [ ] User data privacy protection
- [ ] Content moderation
- [ ] Rate limiting

## 📊 Performance Metrics

### Current Capabilities
- **Video Processing**: Demo mode only
- **Object Detection**: Simulated results
- **Product Matching**: Demo products
- **Response Time**: <1 second for demo mode

### Target Metrics
- **Video Upload**: <30 seconds for 100MB video
- **Object Detection**: <60 seconds processing time
- **Product Matching**: <5 seconds response time
- **App Launch**: <3 seconds cold start

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For questions or support:
- Create an issue on GitHub
- Check the troubleshooting section below
- Review the backend documentation

## 🔧 Troubleshooting

### Common Issues

#### App Won't Launch
- Check Xcode version compatibility
- Verify iOS deployment target
- Check for missing dependencies

#### Video Upload Fails
- Verify backend server is running
- Check network connectivity
- Validate video format and size

#### Object Detection Not Working
- Ensure backend AI service is configured
- Check Python dependencies on backend
- Verify YOLOv8 model is available

#### API Connection Issues
- Verify backend URL in AppConfig.swift
- Check CORS configuration on backend
- Ensure network permissions are granted

## 🎯 Success Metrics

### User Experience
- **Intuitive Interface**: Easy video upload and product discovery
- **Fast Processing**: Quick object detection and matching
- **Reliable Performance**: Consistent app functionality
- **Beautiful Design**: Modern, engaging UI

### Technical Excellence
- **Code Quality**: Clean SwiftUI architecture
- **Error Handling**: Graceful failure management
- **Performance**: Optimized for iOS devices
- **Scalability**: Ready for production deployment

### Business Value
- **Shoppable Content**: Direct path from video to purchase
- **AI Integration**: Automated product discovery
- **User Engagement**: Interactive video experience
- **Monetization Ready**: E-commerce integration points

---

**Next Steps**: Focus on backend integration and real video processing to move from wireframe to production-ready app. 