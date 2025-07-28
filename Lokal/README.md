# Lokal - iOS App

A mobile-first shoppable video app that uses AI to detect objects in videos and match them with available products for purchase.

## Features

- **Video Upload & Sharing**: Upload and share videos with the community
- **AI Object Detection**: Automatically detect objects in uploaded videos
- **Product Matching**: Match detected objects with available products
- **Shoppable Content**: Purchase products directly through the app
- **User Profiles**: Manage your content and track your activity
- **Social Features**: Connect with other creators and discover new products

## Technical Requirements

- **iOS Version**: 15.0+
- **Xcode Version**: 14.0+
- **Swift Version**: 5.7+
- **Deployment Target**: iOS 15.0

## Setup Instructions

### Prerequisites

1. Install Xcode from the Mac App Store
2. Ensure you have a valid Apple Developer account
3. Clone this repository

### Installation

1. Open `Lokal.xcodeproj` in Xcode
2. Select your development team in the project settings
3. Update the Bundle Identifier to match your organization
4. Build and run the project

### Configuration

#### Required Permissions

The app requires the following permissions:

- **Camera**: For recording videos
- **Photo Library**: For selecting existing videos
- **Microphone**: For recording audio
- **Location**: For personalized recommendations (optional)

#### Environment Setup

1. Update `Info.plist` with your app's specific information
2. Configure your backend API endpoints
3. Set up your object detection service
4. Configure your product database

## Architecture

### App Structure

```
Lokal/
├── LokalApp.swift          # Main app entry point
├── ContentView.swift       # Main content view with navigation
├── Assets.xcassets/        # App icons and assets
├── Info.plist             # App configuration
├── PrivacyPolicy.md       # Privacy policy document
├── TermsOfService.md      # Terms of service document
└── AppStoreMetadata.md    # App Store submission guidelines
```

### Key Components

- **Authentication**: User sign-up and sign-in
- **Home Feed**: Discover videos and products
- **Upload Flow**: Video upload and processing
- **Profile Management**: User profile and settings
- **Product Discovery**: Browse and purchase products

## Apple Guidelines Compliance

### Human Interface Guidelines (HIG)

✅ **Navigation Patterns**
- Tab-based navigation for main sections
- Proper use of navigation bars and titles
- Consistent back button behavior

✅ **Visual Design**
- Uses system colors and fonts
- Supports both light and dark modes
- Proper contrast ratios for accessibility

✅ **Interaction Design**
- Clear touch targets (minimum 44pt)
- Proper feedback for user actions
- Intuitive gestures and animations

### App Store Guidelines

✅ **Content Guidelines**
- No objectionable or inappropriate content
- Clear content moderation policies
- Age-appropriate content (4+)

✅ **Privacy Requirements**
- Comprehensive Privacy Policy
- Clear data collection practices
- User consent mechanisms
- Data deletion options

✅ **Technical Requirements**
- Proper app icon set
- Launch screen implementation
- Accessibility features
- Error handling and validation

## Accessibility Features

- **VoiceOver Support**: All UI elements are properly labeled
- **Dynamic Type**: Text scales with system settings
- **High Contrast**: Supports high contrast mode
- **Reduced Motion**: Respects accessibility preferences
- **Focus Management**: Proper keyboard navigation

## Security Considerations

- **Data Encryption**: All sensitive data is encrypted
- **Secure Authentication**: Proper authentication flow
- **Input Validation**: All user inputs are validated
- **Privacy Protection**: User data is protected

## Testing

### Unit Tests
- Run tests with `Cmd+U` in Xcode
- Test coverage for core functionality
- Mock services for isolated testing

### UI Tests
- Automated UI testing
- Accessibility testing
- Performance testing

### Manual Testing
- Test on different device sizes
- Test with different iOS versions
- Test accessibility features
- Test edge cases and error scenarios

## Deployment

### App Store Submission

1. **Prepare Assets**
   - App icon (all required sizes)
   - Screenshots for different devices
   - App preview video (optional)

2. **Configure App Store Connect**
   - Create app record
   - Fill in metadata
   - Upload build

3. **Submit for Review**
   - Ensure all guidelines are met
   - Provide clear review notes
   - Respond to any feedback

### TestFlight Distribution

1. Upload build to App Store Connect
2. Add internal testers
3. Add external testers (if needed)
4. Monitor feedback and crash reports

## Legal Compliance

### Privacy Laws

- **GDPR**: European data protection compliance
- **CCPA**: California privacy rights
- **COPPA**: Children's online privacy protection

### Terms of Service

- Clear user agreement
- Content ownership and licensing
- Prohibited activities
- Termination policies

## Support

### Documentation
- [Apple Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)
- [App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [iOS Development Documentation](https://developer.apple.com/ios/)

### Contact
- **Development**: dev@lokal.com
- **Support**: support@lokal.com
- **Legal**: legal@lokal.com

## License

This project is proprietary software. All rights reserved.

## Version History

### v1.0.0 (Current)
- Initial release
- Core video upload and sharing features
- AI object detection
- Product matching and shopping
- User authentication and profiles
- Privacy policy and terms of service
- Accessibility features
- App Store compliance 