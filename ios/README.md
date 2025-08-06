# Lokal iOS App

A SwiftUI-based iOS application for shoppable video discovery using Railway backend.

## Features

- Video upload and processing
- Object detection using AI
- Product matching and recommendations
- Interactive video playback with hotspots
- Real-time video analysis
- Railway backend integration

## Requirements

- iOS 15.0+
- Xcode 14.0+
- Swift 5.7+

## Setup

1. Open the project in Xcode
2. Configure your Railway backend URL in `ContentView.swift`
3. Build and run the app

## Configuration

The app is configured to use the Railway backend at:
```
https://lokal-dev-production.up.railway.app/api
```

## Permissions

The app requires the following permissions:
- Camera access for video recording
- Photo library access for video selection
- Microphone access for audio recording
- Location access for personalized recommendations

## Architecture

- **SwiftUI**: Modern declarative UI framework
- **AVKit**: Video playback and processing
- **PhotosUI**: Photo and video selection
- **Railway Backend**: API integration for video processing

## Development

The app includes demo mode for testing without a backend connection. Enable/disable demo mode in `AppConfig.enableDemoMode`.

## Build

```bash
# Open in Xcode
open ios/Lokal.xcodeproj

# Or build from command line
xcodebuild -project ios/Lokal.xcodeproj -scheme Lokal -destination 'platform=iOS Simulator,name=iPhone 14'
``` 