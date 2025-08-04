//
//  ContentView.swift
//  Lokal
//
//  Created by Mike  on 2025-07-25.
//

import SwiftUI
import AVKit
import PhotosUI

// MARK: - App Configuration
struct AppConfig {
    // API Configuration
    static let apiBaseURL = "http://localhost:3001/api"
    static let apiTimeout: TimeInterval = 30
    
    // Video Configuration
    static let maxVideoDuration: TimeInterval = 180 // 3 minutes
    static let maxVideoSize: Int64 = 100 * 1024 * 1024 // 100MB
    static let supportedVideoFormats = ["mp4", "mov", "avi", "mkv"]
    
    // Object Detection Configuration
    static let confidenceThreshold: Double = 0.5
    static let maxDetectedObjects = 10
    
    // NEW: Interactive Video Configuration
    static let enableInteractiveVideos = true
    static let enableItemTracking = true
    static let enableHotspots = true
    static let maxTrackedItems = 5
    static let trackingConfidenceThreshold: Double = 0.6
    static let hotspotVisibilityDuration: TimeInterval = 60 // seconds
    static let hotspotAnimationDuration: TimeInterval = 0.3 // seconds
    static let hotspotPulseInterval: TimeInterval = 2.0 // seconds
    
    // Product Configuration
    static let maxMatchedProducts = 6
    static let productMatchThreshold: Double = 0.3
    
    // UI Configuration
    static let videoAspectRatio: Double = 16.0 / 9.0
    static let productCardWidth: CGFloat = 120
    static let productCardHeight: CGFloat = 80
    
    // Feature Flags
    static let enableObjectDetection = true
    static let enableProductMatching = true
    static let enableVideoUpload = true
    static let enableDemoMode = true
    
    // Demo Configuration
    static let demoProcessingDelay: TimeInterval = 3.0
    static let demoObjects = ["laptop", "coffee cup", "desk", "plant"]
    
    // Error Messages
    static let errorMessages = [
        "network": "Network connection failed. Please check your internet connection.",
        "upload": "Video upload failed. Please try again.",
        "processing": "Video processing failed. Please try again.",
        "invalidVideo": "Invalid video format. Please select a supported video file.",
        "videoTooLarge": "Video file is too large. Maximum size is 100MB.",
        "videoTooLong": "Video is too long. Maximum duration is 3 minutes."
    ]
    
    // Validation
    static func isValidVideoFormat(_ filename: String) -> Bool {
        let fileExtension = filename.components(separatedBy: ".").last?.lowercased() ?? ""
        return supportedVideoFormats.contains(fileExtension)
    }
    
    static func isValidVideoSize(_ size: Int64) -> Bool {
        return size <= maxVideoSize
    }
    
    static func isValidVideoDuration(_ duration: TimeInterval) -> Bool {
        return duration <= maxVideoDuration
    }
    
    // URL Construction
    static func apiURL(for endpoint: String) -> URL? {
        return URL(string: "\(apiBaseURL)\(endpoint)")
    }
}

// MARK: - New Data Models for Interactive Video
struct TrackedItem: Identifiable, Codable {
    let id: String
    var name: String
    var x: Double // percentage position
    var y: Double // percentage position
    var startTime: TimeInterval // seconds
    var endTime: TimeInterval // seconds
    var product: DemoProduct?
    var isSelected: Bool
    
    init(id: String = UUID().uuidString, name: String, x: Double, y: Double, startTime: TimeInterval = 0, endTime: TimeInterval = 60, product: DemoProduct? = nil, isSelected: Bool = false) {
        self.id = id
        self.name = name
        self.x = x
        self.y = y
        self.startTime = startTime
        self.endTime = endTime
        self.product = product
        self.isSelected = isSelected
    }
}

struct Hotspot: Identifiable, Codable {
    let id: String
    var x: Double // percentage position
    var y: Double // percentage position
    var startTime: TimeInterval // seconds
    var endTime: TimeInterval // seconds
    var product: DemoProduct?
    var isVisible: Bool
    
    init(id: String = UUID().uuidString, x: Double, y: Double, startTime: TimeInterval = 0, endTime: TimeInterval = 60, product: DemoProduct? = nil, isVisible: Bool = true) {
        self.id = id
        self.x = x
        self.y = y
        self.startTime = startTime
        self.endTime = endTime
        self.product = product
        self.isVisible = isVisible
    }
}

struct VideoMetadata: Codable {
    let duration: TimeInterval
    let width: Int
    let height: Int
}

struct ContentView: View {
    @State private var selectedTab = 0
    @State private var isAuthenticated = false
    @State private var showingPrivacyPolicy = false
    @State private var showingTermsOfService = false
    
    var body: some View {
        Group {
            if isAuthenticated {
                TabView(selection: $selectedTab) {
                    HomeView()
                        .tabItem {
                            Image(systemName: "house.fill")
                            Text("Discover")
                        }
                        .tag(0)
                    
                    UploadView()
                        .tabItem {
                            Image(systemName: "plus.circle.fill")
                            Text("Upload")
                        }
                        .tag(1)
                    
                    ProfileView()
                        .tabItem {
                            Image(systemName: "person.fill")
                            Text("Profile")
                        }
                        .tag(2)
                }
                .accentColor(.accentColor)
                .preferredColorScheme(.none)
            } else {
                AuthView(
                    isAuthenticated: $isAuthenticated,
                    showingPrivacyPolicy: $showingPrivacyPolicy,
                    showingTermsOfService: $showingTermsOfService
                )
            }
        }
        .sheet(isPresented: $showingPrivacyPolicy) {
            PrivacyPolicyView()
        }
        .sheet(isPresented: $showingTermsOfService) {
            TermsOfServiceView()
        }
    }
}

// MARK: - Authentication View
struct AuthView: View {
    @Binding var isAuthenticated: Bool
    @Binding var showingPrivacyPolicy: Bool
    @Binding var showingTermsOfService: Bool
    @State private var isSignUp = false
    @State private var email = ""
    @State private var password = ""
    @State private var username = ""
    @State private var isLoading = false
    @State private var showingError = false
    @State private var errorMessage = ""
    @FocusState private var focusedField: Field?
    
    enum Field {
        case username, email, password
    }
    
    var body: some View {
        NavigationView {
            ZStack {
                // Background gradient
                LinearGradient(
                    gradient: Gradient(colors: [Color.accentColor, Color.accentColor.opacity(0.7)]),
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                )
                .ignoresSafeArea()
                
                ScrollView {
                    VStack(spacing: 30) {
                        // Logo and title
                        VStack(spacing: 16) {
                            Image(systemName: "video.circle.fill")
                                .font(.system(size: 80))
                                .foregroundColor(.white)
                            
                            Text("Lokal")
                                .font(.largeTitle)
                                .fontWeight(.bold)
                                .foregroundColor(.white)
                            
                            Text("Interactive Shoppable Video Platform")
                                .font(.subheadline)
                                .foregroundColor(.white.opacity(0.8))
                        }
                        .padding(.top, 60)
                        
                        // Auth form
                        VStack(spacing: 20) {
                            Text(isSignUp ? "Create Account" : "Welcome Back")
                                .font(.title2)
                                .fontWeight(.semibold)
                                .foregroundColor(.white)
                            
                            VStack(spacing: 16) {
                                if isSignUp {
                                    TextField("Username", text: $username)
                                        .textFieldStyle(.roundedBorder)
                                        .autocapitalization(.none)
                                        .focused($focusedField, equals: .username)
                                        .accessibilityLabel("Username")
                                }
                                
                                TextField("Email", text: $email)
                                    .textFieldStyle(.roundedBorder)
                                    .keyboardType(.emailAddress)
                                    .autocapitalization(.none)
                                    .focused($focusedField, equals: .email)
                                    .accessibilityLabel("Email address")
                                
                                SecureField("Password", text: $password)
                                    .textFieldStyle(.roundedBorder)
                                    .focused($focusedField, equals: .password)
                                    .accessibilityLabel("Password")
                            }
                            .padding(.horizontal)
                            
                            Button(action: handleAuth) {
                                if isLoading {
                                    ProgressView()
                                        .progressViewStyle(CircularProgressViewStyle(tint: .white))
                                } else {
                                    Text(isSignUp ? "Create Account" : "Sign In")
                                        .fontWeight(.semibold)
                                }
                            }
                            .frame(maxWidth: .infinity)
                            .padding()
                            .background(Color.white)
                            .foregroundColor(.accentColor)
                            .cornerRadius(12)
                            .padding(.horizontal)
                            .disabled(isLoading)
                            .accessibilityLabel(isSignUp ? "Create account button" : "Sign in button")
                            
                            Button(action: { isSignUp.toggle() }) {
                                Text(isSignUp ? "Already have an account? Sign In" : "Don't have an account? Sign Up")
                                    .foregroundColor(.white)
                                    .underline()
                            }
                        }
                        .padding()
                        .background(Color.white.opacity(0.1))
                        .cornerRadius(20)
                        .padding(.horizontal)
                        
                        // Demo info
                        VStack(spacing: 8) {
                            Text("Demo Mode")
                                .font(.caption)
                                .fontWeight(.medium)
                                .foregroundColor(.white.opacity(0.8))
                            
                            Text("Use any valid email format to test the app")
                                .font(.caption2)
                                .foregroundColor(.white.opacity(0.6))
                                .multilineTextAlignment(.center)
                        }
                        .padding(.bottom, 20)
                        
                        // Legal links
                        HStack(spacing: 20) {
                            Button("Privacy Policy") {
                                showingPrivacyPolicy = true
                            }
                            .font(.caption)
                            .foregroundColor(.white.opacity(0.8))
                            
                            Button("Terms of Service") {
                                showingTermsOfService = true
                            }
                            .font(.caption)
                            .foregroundColor(.white.opacity(0.8))
                        }
                        .padding(.bottom, 40)
                    }
                }
            }
        }
        .alert("Error", isPresented: $showingError) {
            Button("OK") { }
        } message: {
            Text(errorMessage)
        }
    }
    
    private func handleAuth() {
        // Validate input
        if isSignUp && username.isEmpty {
            errorMessage = "Username is required"
            showingError = true
            return
        }
        
        if email.isEmpty {
            errorMessage = "Email is required"
            showingError = true
            return
        }
        
        if !isValidEmail(email) {
            errorMessage = "Please enter a valid email address"
            showingError = true
            return
        }
        
        if password.isEmpty {
            errorMessage = "Password is required"
            showingError = true
            return
        }
        
        if password.count < 6 {
            errorMessage = "Password must be at least 6 characters"
            showingError = true
            return
        }
        
        isLoading = true
        
        // Simulate authentication
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.5) {
            isLoading = false
            isAuthenticated = true
        }
    }
    
    private func isValidEmail(_ email: String) -> Bool {
        let emailRegex = "[A-Z0-9a-z._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,64}"
        let emailPredicate = NSPredicate(format:"SELF MATCHES %@", emailRegex)
        return emailPredicate.evaluate(with: email)
    }
}

// MARK: - Home View
struct HomeView: View {
    @State private var videos: [DemoVideo] = []
    @State private var isLoading = false
    @State private var showingError = false
    @State private var errorMessage = ""
    
    var body: some View {
        NavigationView {
            Group {
                if isLoading {
                    VStack {
                        ProgressView()
                            .scaleEffect(1.5)
                        Text("Loading videos...")
                            .padding(.top)
                    }
                } else {
                    ScrollView {
                        LazyVStack(spacing: 20) {
                            ForEach(videos) { video in
                                InteractiveVideoCard(video: video)
                            }
                        }
                        .padding()
                    }
                }
            }
            .navigationTitle("Discover")
            .navigationBarTitleDisplayMode(.large)
            .refreshable {
                await loadVideos()
            }
        }
        .alert("Error", isPresented: $showingError) {
            Button("OK") { }
        } message: {
            Text(errorMessage)
        }
        .task {
            await loadVideos()
        }
    }
    
    private func loadVideos() async {
        isLoading = true
        
        do {
            let loadedVideos = try await NetworkService.shared.getVideos()
            await MainActor.run {
                // If no videos from server, show demo data
                if loadedVideos.isEmpty {
                    videos = DemoVideo.sampleVideos
                } else {
                    videos = loadedVideos
                }
                isLoading = false
            }
        } catch {
            await MainActor.run {
                // Fallback to demo data if API fails
                videos = DemoVideo.sampleVideos
                isLoading = false
                errorMessage = "Failed to load videos from server. Showing demo data."
                showingError = true
            }
        }
    }
}

// MARK: - Interactive Video Card
struct InteractiveVideoCard: View {
    let video: DemoVideo
    @State private var player: AVPlayer?
    @State private var currentTime: TimeInterval = 0
    @State private var isPlaying = false
    @State private var showingProductDetail = false
    @State private var selectedProduct: DemoProduct?
    
    // Convert products to hotspots for interactive video
    private var hotspots: [Hotspot] {
        video.products.enumerated().map { index, product in
            Hotspot(
                x: 20 + Double(index * 20), // Spread hotspots horizontally
                y: 30 + Double(index * 15), // Spread hotspots vertically
                startTime: 0,
                endTime: 60, // Show for first 60 seconds
                product: product
            )
        }
    }
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            // Interactive Video Player
            ZStack {
                VideoPlayerView(videoURL: URL(string: video.videoUrl ?? ""))
                // NOTE: To track currentTime, use AVPlayer's addPeriodicTimeObserver in VideoPlayerView and bind to currentTime if needed.
                // The previous .onReceive(player?.publisher(for: \.currentTime)) was invalid and is removed.
                
                // Interactive Hotspots
                if AppConfig.enableInteractiveVideos {
                    ForEach(hotspots) { hotspot in
                        if isHotspotVisible(hotspot) {
                            HotspotView(
                                hotspot: hotspot,
                                onTap: {
                                    selectedProduct = hotspot.product
                                    showingProductDetail = true
                                }
                            )
                        }
                    }
                }
            }
            
            VStack(alignment: .leading, spacing: 8) {
                Text(video.title)
                    .font(.headline)
                
                if !video.description.isEmpty {
                    Text(video.description)
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                }
                
                Text(video.createdAt, style: .date)
                    .font(.caption)
                    .foregroundColor(.secondary)
                
                // Interactive indicator
                if !video.products.isEmpty && AppConfig.enableInteractiveVideos {
                    HStack {
                        Image(systemName: "sparkles")
                            .foregroundColor(.accentColor)
                        Text("Interactive - Tap items to shop!")
                            .font(.caption)
                            .fontWeight(.medium)
                            .foregroundColor(.accentColor)
                    }
                }
            }
            
            // Fallback product cards for non-interactive viewing
            if !video.products.isEmpty {
                VStack(alignment: .leading, spacing: 8) {
                    Text("Shop This Video")
                        .font(.subheadline)
                        .fontWeight(.semibold)
                    
                    ScrollView(.horizontal, showsIndicators: false) {
                        HStack(spacing: 12) {
                            ForEach(video.products) { product in
                                ProductCard(product: product)
                            }
                        }
                    }
                }
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(16)
        .shadow(radius: 2)
        .sheet(isPresented: $showingProductDetail) {
            if let product = selectedProduct {
                ProductDetailView(product: product)
            }
        }
    }
    
    private func isHotspotVisible(_ hotspot: Hotspot) -> Bool {
        return currentTime >= hotspot.startTime && currentTime <= hotspot.endTime
    }
}

// MARK: - Hotspot View
struct HotspotView: View {
    let hotspot: Hotspot
    let onTap: () -> Void
    @State private var isPulsing = false
    
    var body: some View {
        Button(action: onTap) {
            ZStack {
                // Pulsing background
                Circle()
                    .fill(Color.accentColor.opacity(0.3))
                    .frame(width: 50, height: 50)
                    .scaleEffect(isPulsing ? 1.2 : 1.0)
                    .animation(.easeInOut(duration: AppConfig.hotspotPulseInterval).repeatForever(autoreverses: true), value: isPulsing)
                
                // Main hotspot
                Circle()
                    .fill(Color.accentColor)
                    .frame(width: 40, height: 40)
                    .overlay(
                        Image(systemName: "bag.fill")
                            .foregroundColor(.white)
                            .font(.system(size: 16))
                    )
                    .shadow(radius: 4)
            }
        }
        .position(
            x: hotspot.x * UIScreen.main.bounds.width / 100,
            y: hotspot.y * 300 / 100 // Assuming video height of 300
        )
        .onAppear {
            isPulsing = true
        }
    }
}

// MARK: - Upload View
struct UploadView: View {
    @State private var selectedItem: PhotosPickerItem?
    @State private var selectedVideoData: Data?
    @State private var title = ""
    @State private var description = ""
    @State private var isProcessing = false
    @State private var currentStep: UploadStep = .select
    @State private var detectedObjects: [String] = []
    @State private var matchedProducts: [DemoProduct] = []
    @State private var trackedItems: [TrackedItem] = []
    @State private var videoMetadata: VideoMetadata?
    @State private var showingError = false
    @State private var errorMessage = ""
    @FocusState private var focusedField: UploadField?
    
    enum UploadStep {
        case select, preview, track, upload, process, finalPreview, complete
    }
    
    enum UploadField {
        case title, description
    }
    
    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 24) {
                    // Step indicator
                    StepIndicator(currentStep: currentStep)
                    
                    switch currentStep {
                    case .select:
                        VideoSelectionView(selectedItem: $selectedItem, selectedVideoData: $selectedVideoData, currentStep: $currentStep)
                    case .preview:
                        VideoPreviewView(
                            title: $title,
                            description: $description,
                            selectedVideoData: $selectedVideoData,
                            focusedField: $focusedField,
                            onContinue: startTracking
                        )
                    case .track:
                        ItemTrackingView(
                            trackedItems: $trackedItems,
                            videoMetadata: videoMetadata,
                            onContinue: startUpload
                        )
                    case .upload:
                        UploadFormView(
                            title: $title,
                            description: $description,
                            selectedVideoData: $selectedVideoData,
                            trackedItems: trackedItems,
                            focusedField: $focusedField,
                            onUpload: startUpload
                        )
                    case .process:
                        ProcessingView()
                    case .finalPreview:
                        PreviewView(
                            title: title,
                            description: description,
                            detectedObjects: detectedObjects,
                            matchedProducts: matchedProducts,
                            onPublish: publishVideo,
                            onEdit: { currentStep = .upload }
                        )
                    case .complete:
                        ResultsView(
                            detectedObjects: detectedObjects,
                            matchedProducts: matchedProducts,
                            onReset: resetForm
                        )
                    }
                }
                .padding()
            }
            .navigationTitle("Upload Video")
            .navigationBarTitleDisplayMode(.large)
        }
        .alert("Error", isPresented: $showingError) {
            Button("OK") { }
        } message: {
            Text(errorMessage)
        }
    }
    
    private func startTracking() {
        guard !title.isEmpty else {
            errorMessage = "Please enter a title for your video"
            showingError = true
            return
        }
        
        // Initialize tracked items from detected objects
        trackedItems = detectedObjects.enumerated().map { index, object in
            TrackedItem(
                name: object,
                x: 20 + Double(index * 20),
                y: 30 + Double(index * 15),
                startTime: 0,
                endTime: videoMetadata?.duration ?? 60
            )
        }
        
        currentStep = .track
    }
    
    private func startUpload() {
        print("Starting upload process...")
        print("Title: \(title)")
        print("Description: \(description)")
        print("Video data available: \(selectedVideoData != nil)")
        print("Tracked items: \(trackedItems.count)")
        
        guard !title.isEmpty else {
            errorMessage = "Please enter a title for your video"
            showingError = true
            return
        }
        
        guard title.count >= 3 else {
            errorMessage = "Title must be at least 3 characters long"
            showingError = true
            return
        }
        
        guard let videoData = selectedVideoData else {
            errorMessage = "Please select a video first"
            showingError = true
            return
        }
        
        // Validate video size
        guard AppConfig.isValidVideoSize(Int64(videoData.count)) else {
            errorMessage = AppConfig.errorMessages["videoTooLarge"] ?? "Video file is too large"
            showingError = true
            return
        }
        
        currentStep = .process
        isProcessing = true
        
        Task {
            do {
                print("Starting real video upload...")
                
                // Upload video to backend
                let uploadResponse = try await NetworkService.shared.uploadVideo(
                    title: title,
                    description: description,
                    videoData: videoData,
                    trackedItems: trackedItems
                )
                
                if uploadResponse.success {
                    print("Video uploaded successfully, starting object detection...")
                    
                    // Wait for object detection to complete
                    try await Task.sleep(nanoseconds: 3_000_000_000) // 3 seconds for processing
                    
                    // Get detected objects from backend
                    let objectsResponse = try await NetworkService.shared.getDetectedObjects(videoId: uploadResponse.videoId ?? "")
                    
                    if objectsResponse.success {
                        detectedObjects = objectsResponse.objects ?? []
                        print("Detected objects: \(detectedObjects)")
                        
                        // Match products based on detected objects
                        let productsResponse = try await NetworkService.shared.matchProducts(objects: detectedObjects)
                        
                        if productsResponse.success {
                            matchedProducts = productsResponse.products
                            print("Matched products: \(matchedProducts.count) products")
                        } else {
                            // Fallback to demo products
                            matchedProducts = DemoProduct.sampleProducts
                            print("Product matching failed, using demo products")
                        }
                    } else {
                        // Fallback to demo objects
                        detectedObjects = ["laptop", "coffee cup", "desk", "plant", "chair", "phone"]
                        matchedProducts = DemoProduct.sampleProducts
                        print("Object detection failed, using demo data")
                    }
                    
                    await MainActor.run {
                        currentStep = .preview
                        isProcessing = false
                        print("Processing completed, showing preview!")
                    }
                } else {
                    await MainActor.run {
                        errorMessage = uploadResponse.error ?? "Upload failed"
                        showingError = true
                        currentStep = .upload
                        isProcessing = false
                        print("Upload failed: \(uploadResponse.error ?? "Unknown error")")
                    }
                }
                
            } catch {
                await MainActor.run {
                    errorMessage = error.localizedDescription
                    showingError = true
                    currentStep = .upload
                    isProcessing = false
                    print("Upload process failed: \(error.localizedDescription)")
                }
            }
        }
    }
    
    private func resetForm() {
        selectedItem = nil
        selectedVideoData = nil
        title = ""
        description = ""
        detectedObjects = []
        matchedProducts = []
        trackedItems = []
        videoMetadata = nil
        currentStep = .select
    }
    
    private func publishVideo() {
        currentStep = .complete
    }
}

// MARK: - Video Preview View
struct VideoPreviewView: View {
    @Binding var title: String
    @Binding var description: String
    @Binding var selectedVideoData: Data?
    var focusedField: FocusState<UploadView.UploadField?>.Binding
    let onContinue: () -> Void
    
    var body: some View {
        VStack(spacing: 16) {
            // Video status indicator
            if selectedVideoData != nil {
                HStack {
                    Image(systemName: "checkmark.circle.fill")
                        .foregroundColor(.green)
                    Text("Video ready for processing")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                .padding(.bottom, 8)
            } else {
                HStack {
                    Image(systemName: "exclamationmark.triangle.fill")
                        .foregroundColor(.orange)
                    Text("Loading video data...")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                .padding(.bottom, 8)
            }
            
            TextField("Video Title", text: $title)
                .textFieldStyle(.roundedBorder)
                .focused(focusedField, equals: .title)
                .accessibilityLabel("Video title")
            
            TextField("Description (optional)", text: $description, axis: .vertical)
                .textFieldStyle(.roundedBorder)
                .lineLimit(3...6)
                .focused(focusedField, equals: .description)
                .accessibilityLabel("Video description")
            
            Button("Continue to Item Tracking", action: onContinue)
                .frame(maxWidth: .infinity)
                .padding()
                .background(selectedVideoData != nil ? Color.accentColor : Color.gray)
                .foregroundColor(.white)
                .cornerRadius(12)
                .disabled(selectedVideoData == nil)
                .accessibilityLabel("Continue to item tracking button")
        }
    }
}

// MARK: - Item Tracking View
struct ItemTrackingView: View {
    @Binding var trackedItems: [TrackedItem]
    let videoMetadata: VideoMetadata?
    let onContinue: () -> Void
    @State private var selectedItem: TrackedItem?
    @State private var showingItemDetails = false
    
    var body: some View {
        VStack(spacing: 20) {
            Text("Select Items to Track")
                .font(.title2)
                .fontWeight(.bold)
            
            Text("Choose which items you want to make shoppable in your video")
                .font(.subheadline)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
            
            // Video preview with tracking overlays
            ZStack {
                Rectangle()
                    .fill(Color.gray.opacity(0.3))
                    .aspectRatio(16/9, contentMode: .fit)
                    .overlay(
                        VStack {
                            Image(systemName: "play.circle.fill")
                                .font(.system(size: 48))
                                .foregroundColor(.white)
                            Text("Video Preview")
                                .font(.caption)
                                .foregroundColor(.white)
                        }
                    )
                    .cornerRadius(12)
                
                // Tracking overlays
                ForEach(trackedItems) { item in
                    TrackedItemOverlay(
                        item: item,
                        onTap: {
                            selectedItem = item
                            showingItemDetails = true
                        }
                    )
                }
            }
            
            // Item selection list
            VStack(alignment: .leading, spacing: 12) {
                Text("Detected Items (\(trackedItems.filter(\.isSelected).count) selected)")
                    .font(.headline)
                    .fontWeight(.semibold)
                
                LazyVGrid(columns: Array(repeating: GridItem(.flexible()), count: 3), spacing: 12) {
                    ForEach($trackedItems) { $item in
                        TrackedItemCard(item: $item)
                    }
                }
            }
            
            // Timeline indicator
            if let metadata = videoMetadata {
                VStack(alignment: .leading, spacing: 8) {
                    Text("Video Duration: \(Int(metadata.duration))s")
                        .font(.caption)
                        .foregroundColor(.secondary)
                    
                    ProgressView(value: 0.3) // Example progress
                        .progressViewStyle(LinearProgressViewStyle())
                }
            }
            
            // Action buttons
            VStack(spacing: 12) {
                Button(action: onContinue) {
                    HStack {
                        Image(systemName: "checkmark.circle.fill")
                        Text("Continue to Upload (\(trackedItems.filter(\.isSelected).count) items selected)")
                            .fontWeight(.semibold)
                    }
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(Color.accentColor)
                    .foregroundColor(.white)
                    .cornerRadius(12)
                }
                
                Button("Back to Preview") {
                    // Navigate back
                }
                .frame(maxWidth: .infinity)
                .padding()
                .background(Color.gray.opacity(0.2))
                .foregroundColor(.primary)
                .cornerRadius(12)
            }
        }
        .sheet(isPresented: $showingItemDetails) {
            if let item = selectedItem {
                TrackedItemDetailView(item: item)
            }
        }
    }
}

// MARK: - Tracked Item Overlay
struct TrackedItemOverlay: View {
    let item: TrackedItem
    let onTap: () -> Void
    
    var body: some View {
        Button(action: onTap) {
            ZStack {
                Circle()
                    .fill(item.isSelected ? Color.accentColor.opacity(0.8) : Color.white.opacity(0.8))
                    .frame(width: 60, height: 60)
                    .overlay(
                        Circle()
                            .stroke(item.isSelected ? Color.accentColor : Color.gray, lineWidth: 3)
                    )
                
                Image(systemName: item.isSelected ? "checkmark" : "plus")
                    .font(.title2)
                    .foregroundColor(item.isSelected ? .white : .accentColor)
                
                if item.isSelected {
                    Circle()
                        .fill(Color.green)
                        .frame(width: 20, height: 20)
                        .overlay(
                            Image(systemName: "checkmark")
                                .font(.caption)
                                .foregroundColor(.white)
                        )
                        .offset(x: 20, y: -20)
                }
            }
        }
        .position(
            x: item.x * 300 / 100, // Assuming video width of 300
            y: item.y * 200 / 100  // Assuming video height of 200
        )
    }
}

// MARK: - Tracked Item Card
struct TrackedItemCard: View {
    @Binding var item: TrackedItem
    
    var body: some View {
        Button(action: {
            item.isSelected.toggle()
        }) {
            VStack(spacing: 8) {
                Image(systemName: item.isSelected ? "checkmark.circle.fill" : "circle")
                    .font(.title2)
                    .foregroundColor(item.isSelected ? .accentColor : .gray)
                
                Text(item.name.capitalized)
                    .font(.caption)
                    .fontWeight(.medium)
                    .multilineTextAlignment(.center)
                    .foregroundColor(item.isSelected ? .accentColor : .primary)
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 12)
            .background(item.isSelected ? Color.accentColor.opacity(0.1) : Color.gray.opacity(0.1))
            .cornerRadius(12)
        }
        .buttonStyle(PlainButtonStyle())
    }
}

// MARK: - Tracked Item Detail View
struct TrackedItemDetailView: View {
    let item: TrackedItem
    @Environment(\.dismiss) private var dismiss
    
    var body: some View {
        NavigationView {
            ScrollView {
                VStack(alignment: .leading, spacing: 20) {
                    VStack(alignment: .leading, spacing: 16) {
                        HStack {
                            Image(systemName: "tag.fill")
                                .font(.title)
                                .foregroundColor(.accentColor)
                            
                            Text(item.name.capitalized)
                                .font(.title2)
                                .fontWeight(.bold)
                        }
                        
                        VStack(alignment: .leading, spacing: 12) {
                            DetailRow(title: "Object Type", value: item.name.capitalized)
                            DetailRow(title: "Position", value: "\(Int(item.x))%, \(Int(item.y))%")
                            DetailRow(title: "Start Time", value: "\(Int(item.startTime))s")
                            DetailRow(title: "End Time", value: "\(Int(item.endTime))s")
                            DetailRow(title: "Selected", value: item.isSelected ? "Yes" : "No")
                        }
                        
                        Text("This item will be tracked throughout your video and made available for shoppers to interact with.")
                            .font(.caption)
                            .foregroundColor(.secondary)
                            .padding(.top)
                    }
                }
                .padding()
            }
            .navigationTitle("Item Details")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Done") {
                        dismiss()
                    }
                }
            }
        }
    }
}

// MARK: - Profile View
struct ProfileView: View {
    @State private var isAuthenticated = true
    
    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 24) {
                    // Profile header
                    VStack(spacing: 16) {
                        Image(systemName: "person.circle.fill")
                            .font(.system(size: 80))
                            .foregroundColor(.accentColor)
                        
                        Text("Demo User")
                            .font(.title2)
                            .fontWeight(.semibold)
                        
                        Text("demo@lokal.com")
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                    }
                    .padding()
                    
                    // Stats
                    HStack(spacing: 20) {
                        StatCard(title: "Videos", value: "12", icon: "video")
                        StatCard(title: "Products", value: "48", icon: "bag")
                    }
                    .padding(.horizontal)
                    
                    // Recent uploads
                    VStack(alignment: .leading, spacing: 16) {
                        Text("Recent Uploads")
                            .font(.headline)
                            .padding(.horizontal)
                        
                        ForEach(DemoVideo.sampleVideos.prefix(3)) { video in
                            VideoRow(video: video)
                        }
                    }
                    
                    Spacer()
                }
            }
            .navigationTitle("Profile")
            .navigationBarTitleDisplayMode(.large)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Sign Out") {
                        // Handle sign out
                    }
                    .foregroundColor(.red)
                }
            }
        }
    }
}

// MARK: - Supporting Views
struct StepIndicator: View {
    let currentStep: UploadView.UploadStep
    
    var body: some View {
        HStack(spacing: 8) {
            ForEach(0..<7) { index in
                Circle()
                    .fill(stepColor(for: index))
                    .frame(width: 32, height: 32)
                    .overlay(
                        Text("\(index + 1)")
                            .font(.caption)
                            .fontWeight(.bold)
                            .foregroundColor(.white)
                    )
                
                if index < 6 {
                    Rectangle()
                        .fill(stepColor(for: index))
                        .frame(height: 2)
                        .frame(maxWidth: .infinity)
                }
            }
        }
        .padding(.horizontal)
    }
    
    private func stepColor(for index: Int) -> Color {
        let stepIndex: Int
        switch currentStep {
        case .select: stepIndex = 0
        case .preview: stepIndex = 1
        case .track: stepIndex = 2
        case .upload: stepIndex = 3
        case .process: stepIndex = 4
        case .finalPreview: stepIndex = 5
        case .complete: stepIndex = 6
        }
        
        return index <= stepIndex ? .indigo : .gray.opacity(0.3)
    }
}

struct VideoSelectionView: View {
    @Binding var selectedItem: PhotosPickerItem?
    @Binding var selectedVideoData: Data?
    @Binding var currentStep: UploadView.UploadStep
    
    var body: some View {
        VStack(spacing: 16) {
            PhotosPicker(selection: $selectedItem, matching: .videos) {
                VStack(spacing: 12) {
                    Image(systemName: "video.badge.plus")
                        .font(.system(size: 48))
                        .foregroundColor(.accentColor)
                    
                    Text("Select Video")
                        .font(.headline)
                    
                    Text("Choose a video (15s - 3min)")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                .frame(maxWidth: .infinity)
                .padding(40)
                .background(Color(.systemGray6))
                .cornerRadius(12)
            }
            .accessibilityLabel("Select video from photo library")
            
            if selectedItem != nil {
                VStack(spacing: 12) {
                    HStack {
                        Image(systemName: "checkmark.circle.fill")
                            .foregroundColor(.green)
                        Text("Video selected")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                    
                    Button("Continue to Details") {
                        currentStep = .preview
                    }
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(Color.accentColor)
                    .foregroundColor(.white)
                    .cornerRadius(12)
                }
            }
        }
        .onChange(of: selectedItem) { oldValue, newValue in
            if let newItem = newValue {
                // Load the video data
                Task {
                    do {
                        let videoData = try await newItem.loadTransferable(type: Data.self)
                        await MainActor.run {
                            selectedVideoData = videoData
                            // Automatically advance to next step after loading
                            currentStep = .preview
                        }
                    } catch {
                        print("Failed to load video data: \(error)")
                    }
                }
            }
        }
    }
}

struct UploadFormView: View {
    @Binding var title: String
    @Binding var description: String
    @Binding var selectedVideoData: Data?
    let trackedItems: [TrackedItem]
    var focusedField: FocusState<UploadView.UploadField?>.Binding
    let onUpload: () -> Void
    
    var body: some View {
        VStack(spacing: 16) {
            // Video status indicator
            if selectedVideoData != nil {
                HStack {
                    Image(systemName: "checkmark.circle.fill")
                        .foregroundColor(.green)
                    Text("Video ready for upload")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                .padding(.bottom, 8)
            } else {
                HStack {
                    Image(systemName: "exclamationmark.triangle.fill")
                        .foregroundColor(.orange)
                    Text("Loading video data...")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                .padding(.bottom, 8)
            }
            
            // Tracked items summary
            if !trackedItems.isEmpty {
                VStack(alignment: .leading, spacing: 8) {
                    HStack {
                        Image(systemName: "tag.fill")
                            .foregroundColor(.accentColor)
                        Text("Tracked Items (\(trackedItems.filter(\.isSelected).count) selected)")
                            .font(.subheadline)
                            .fontWeight(.medium)
                    }
                    
                    ScrollView(.horizontal, showsIndicators: false) {
                        HStack(spacing: 8) {
                            ForEach(trackedItems.filter(\.isSelected)) { item in
                                HStack {
                                    Image(systemName: "checkmark.circle.fill")
                                        .font(.caption)
                                        .foregroundColor(.green)
                                    Text(item.name.capitalized)
                                        .font(.caption)
                                        .fontWeight(.medium)
                                }
                                .padding(.horizontal, 8)
                                .padding(.vertical, 4)
                                .background(Color.green.opacity(0.1))
                                .foregroundColor(.green)
                                .cornerRadius(12)
                            }
                        }
                    }
                }
                .padding(.bottom, 8)
            }
            
            TextField("Video Title", text: $title)
                .textFieldStyle(.roundedBorder)
                .focused(focusedField, equals: .title)
                .accessibilityLabel("Video title")
            
            TextField("Description (optional)", text: $description, axis: .vertical)
                .textFieldStyle(.roundedBorder)
                .lineLimit(3...6)
                .focused(focusedField, equals: .description)
                .accessibilityLabel("Video description")
            
            Button("Upload & Process", action: onUpload)
                .frame(maxWidth: .infinity)
                .padding()
                .background(selectedVideoData != nil ? Color.accentColor : Color.gray)
                .foregroundColor(.white)
                .cornerRadius(12)
                .disabled(selectedVideoData == nil)
                .accessibilityLabel("Upload and process video button")
        }
    }
}

struct PreviewView: View {
    let title: String
    let description: String
    let detectedObjects: [String]
    let matchedProducts: [DemoProduct]
    let onPublish: () -> Void
    let onEdit: () -> Void
    @State private var showingObjectDetails = false
    @State private var selectedObject: String?
    @State private var showingAddObject = false
    @State private var newObjectName = ""
    @State private var editableObjects: [String]
    
    init(title: String, description: String, detectedObjects: [String], matchedProducts: [DemoProduct], onPublish: @escaping () -> Void, onEdit: @escaping () -> Void) {
        self.title = title
        self.description = description
        self.detectedObjects = detectedObjects
        self.matchedProducts = matchedProducts
        self.onPublish = onPublish
        self.onEdit = onEdit
        self._editableObjects = State(initialValue: detectedObjects)
    }
    
    var body: some View {
        ScrollView {
            VStack(spacing: 24) {
                // Header
                VStack(spacing: 8) {
                    Image(systemName: "eye.fill")
                        .font(.system(size: 48))
                        .foregroundColor(.blue)
                    
                    Text("Preview Your Video")
                        .font(.title2)
                        .fontWeight(.bold)
                    
                    Text("Review detected objects and matched products before publishing")
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                        .multilineTextAlignment(.center)
                }
                
                // Video preview section
                VStack(alignment: .leading, spacing: 16) {
                    Text("Video Preview")
                        .font(.headline)
                        .fontWeight(.semibold)
                    
                    VStack(alignment: .leading, spacing: 12) {
                        Text(title)
                            .font(.title3)
                            .fontWeight(.medium)
                        
                        if !description.isEmpty {
                            Text(description)
                                .font(.subheadline)
                                .foregroundColor(.secondary)
                        }
                        
                        // Video placeholder with play button
                        Rectangle()
                            .fill(Color.gray.opacity(0.3))
                            .aspectRatio(16/9, contentMode: .fit)
                            .overlay(
                                VStack {
                                    Image(systemName: "play.circle.fill")
                                        .font(.system(size: 48))
                                        .foregroundColor(.white)
                                    Text("Video Preview")
                                        .font(.caption)
                                        .foregroundColor(.white)
                                }
                            )
                            .cornerRadius(12)
                    }
                    .padding()
                    .background(Color(.systemGray6))
                    .cornerRadius(12)
                }
                
                // Detected objects section
                VStack(alignment: .leading, spacing: 16) {
                    HStack {
                        Image(systemName: "eye.fill")
                            .foregroundColor(.blue)
                        Text("Detected Objects (\(editableObjects.count))")
                            .font(.headline)
                            .fontWeight(.semibold)
                        
                        Spacer()
                        
                        Button("Add Object") {
                            showingAddObject = true
                        }
                        .font(.caption)
                        .foregroundColor(.blue)
                        
                        Button("View Details") {
                            showingObjectDetails = true
                        }
                        .font(.caption)
                        .foregroundColor(.blue)
                    }
                    
                    if editableObjects.isEmpty {
                        Text("No objects detected. Tap 'Add Object' to manually add items.")
                            .font(.caption)
                            .foregroundColor(.secondary)
                            .padding()
                            .frame(maxWidth: .infinity)
                            .background(Color(.systemGray6))
                            .cornerRadius(8)
                    } else {
                        LazyVGrid(columns: Array(repeating: GridItem(.flexible()), count: 3), spacing: 12) {
                            ForEach(editableObjects, id: \.self) { object in
                                Button(action: {
                                    selectedObject = object
                                    showingObjectDetails = true
                                }) {
                                    VStack(spacing: 8) {
                                        Image(systemName: "tag.fill")
                                            .font(.title2)
                                            .foregroundColor(.blue)
                                        
                                        Text(object.capitalized)
                                            .font(.caption)
                                            .fontWeight(.medium)
                                            .multilineTextAlignment(.center)
                                    }
                                    .frame(maxWidth: .infinity)
                                    .padding(.vertical, 12)
                                    .background(Color.blue.opacity(0.1))
                                    .foregroundColor(.blue)
                                    .cornerRadius(12)
                                    .contextMenu {
                                        Button("Remove", role: .destructive) {
                                            editableObjects.removeAll { $0 == object }
                                        }
                                    }
                                }
                                .buttonStyle(PlainButtonStyle())
                            }
                        }
                    }
                }
                
                // Matched products section
                if !matchedProducts.isEmpty {
                    VStack(alignment: .leading, spacing: 16) {
                        HStack {
                            Image(systemName: "bag.fill")
                                .foregroundColor(.green)
                            Text("Matched Products (\(matchedProducts.count))")
                                .font(.headline)
                                .fontWeight(.semibold)
                        }
                        
                        ScrollView(.horizontal, showsIndicators: false) {
                            HStack(spacing: 16) {
                                ForEach(matchedProducts) { product in
                                    ProductCard(product: product)
                                }
                            }
                            .padding(.horizontal)
                        }
                    }
                }
                
                // Summary section
                VStack(alignment: .leading, spacing: 16) {
                    Text("Publishing Summary")
                        .font(.headline)
                        .fontWeight(.semibold)
                    
                    VStack(spacing: 12) {
                        SummaryRow(icon: "video", title: "Video Title", value: title)
                        SummaryRow(icon: "text.quote", title: "Description", value: description.isEmpty ? "None" : description)
                        SummaryRow(icon: "eye", title: "Objects Detected", value: "\(editableObjects.count) items")
                        SummaryRow(icon: "bag", title: "Products Matched", value: "\(matchedProducts.count) products")
                    }
                    .padding()
                    .background(Color(.systemGray6))
                    .cornerRadius(12)
                }
                
                // Action buttons
                VStack(spacing: 12) {
                    Button(action: onPublish) {
                        HStack {
                            Image(systemName: "checkmark.circle.fill")
                            Text("Publish Video")
                                .fontWeight(.semibold)
                        }
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(Color.green)
                        .foregroundColor(.white)
                        .cornerRadius(12)
                    }
                    
                    Button(action: onEdit) {
                        HStack {
                            Image(systemName: "pencil")
                            Text("Edit Details")
                        }
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(Color.gray.opacity(0.2))
                        .foregroundColor(.primary)
                        .cornerRadius(12)
                    }
                }
            }
            .padding()
        }
        .sheet(isPresented: $showingObjectDetails) {
            ObjectDetailsView(
                detectedObjects: editableObjects,
                selectedObject: selectedObject
            )
        }
        .alert("Add Object", isPresented: $showingAddObject) {
            TextField("Object name", text: $newObjectName)
            Button("Cancel", role: .cancel) { }
            Button("Add") {
                if !newObjectName.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
                    editableObjects.append(newObjectName.trimmingCharacters(in: .whitespacesAndNewlines).lowercased())
                    newObjectName = ""
                }
            }
        } message: {
            Text("Enter the name of the object you want to add")
        }
    }
}

struct ObjectDetailsView: View {
    let detectedObjects: [String]
    let selectedObject: String?
    @Environment(\.dismiss) private var dismiss
    @State private var confidenceThreshold: Double = 0.5
    
    var body: some View {
        NavigationView {
            ScrollView {
                VStack(alignment: .leading, spacing: 20) {
                    if let selectedObject = selectedObject {
                        // Single object detail
                        VStack(alignment: .leading, spacing: 16) {
                            HStack {
                                Image(systemName: "tag.fill")
                                    .font(.title)
                                    .foregroundColor(.blue)
                                
                                Text(selectedObject.capitalized)
                                    .font(.title2)
                                    .fontWeight(.bold)
                            }
                            
                            VStack(alignment: .leading, spacing: 12) {
                                DetailRow(title: "Object Type", value: selectedObject.capitalized)
                                DetailRow(title: "Confidence", value: "High (95%)")
                                DetailRow(title: "Detection Method", value: "AI Computer Vision")
                                DetailRow(title: "Frame Count", value: "12 frames")
                                
                                VStack(alignment: .leading, spacing: 8) {
                                    Text("Confidence Threshold")
                                        .font(.subheadline)
                                        .foregroundColor(.secondary)
                                    
                                    HStack {
                                        Text("Low")
                                            .font(.caption)
                                            .foregroundColor(.secondary)
                                        
                                        Slider(value: $confidenceThreshold, in: 0.1...1.0, step: 0.1)
                                            .accentColor(.blue)
                                        
                                        Text("High")
                                            .font(.caption)
                                            .foregroundColor(.secondary)
                                    }
                                    
                                    Text("Current: \(Int(confidenceThreshold * 100))%")
                                        .font(.caption)
                                        .foregroundColor(.blue)
                                }
                                .padding(.top, 8)
                            }
                            
                            Text("This object was detected using advanced computer vision algorithms. The system analyzed multiple frames of your video to ensure accurate detection.")
                                .font(.caption)
                                .foregroundColor(.secondary)
                                .padding(.top)
                        }
                    } else {
                        // All objects overview
                        VStack(alignment: .leading, spacing: 16) {
                            Text("All Detected Objects")
                                .font(.title2)
                                .fontWeight(.bold)
                            
                            ForEach(detectedObjects, id: \.self) { object in
                                HStack {
                                    Image(systemName: "tag.fill")
                                        .foregroundColor(.blue)
                                    
                                    Text(object.capitalized)
                                        .font(.subheadline)
                                        .fontWeight(.medium)
                                    
                                    Spacer()
                                    
                                    Text("95%")
                                        .font(.caption)
                                        .foregroundColor(.green)
                                        .padding(.horizontal, 8)
                                        .padding(.vertical, 4)
                                        .background(Color.green.opacity(0.1))
                                        .cornerRadius(8)
                                }
                                .padding()
                                .background(Color(.systemGray6))
                                .cornerRadius(8)
                            }
                        }
                    }
                }
                .padding()
            }
            .navigationTitle(selectedObject != nil ? "Object Details" : "Detection Results")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Done") {
                        dismiss()
                    }
                }
            }
        }
    }
}

struct DetailRow: View {
    let title: String
    let value: String
    
    var body: some View {
        HStack {
            Text(title)
                .font(.subheadline)
                .foregroundColor(.secondary)
            
            Spacer()
            
            Text(value)
                .font(.subheadline)
                .fontWeight(.medium)
        }
        .padding(.vertical, 4)
    }
}

struct SummaryRow: View {
    let icon: String
    let title: String
    let value: String
    
    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: icon)
                .font(.subheadline)
                .foregroundColor(.accentColor)
                .frame(width: 20)
            
            Text(title)
                .font(.subheadline)
                .foregroundColor(.secondary)
            
            Spacer()
            
            Text(value)
                .font(.subheadline)
                .fontWeight(.medium)
                .multilineTextAlignment(.trailing)
        }
    }
}

struct ProcessingView: View {
    @State private var currentPhase = 0
    let phases = [
        "Uploading video...",
        "Analyzing video frames...",
        "Detecting objects...",
        "Matching products...",
        "Finalizing results..."
    ]
    
    var body: some View {
        VStack(spacing: 24) {
            ProgressView()
                .scaleEffect(1.5)
            
            VStack(spacing: 8) {
                Text("Processing Video")
                    .font(.title2)
                    .fontWeight(.bold)
                
                Text(phases[currentPhase])
                    .font(.headline)
                    .foregroundColor(.accentColor)
                
                Text("This may take a few moments")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            
            // Progress steps
            VStack(spacing: 12) {
                ForEach(0..<phases.count, id: \.self) { index in
                    HStack {
                        Image(systemName: index <= currentPhase ? "checkmark.circle.fill" : "circle")
                            .foregroundColor(index <= currentPhase ? .green : .gray)
                        
                        Text(phases[index])
                            .font(.caption)
                            .foregroundColor(index <= currentPhase ? .primary : .secondary)
                        
                        Spacer()
                    }
                }
            }
            .padding(.horizontal)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .onAppear {
            startProgressAnimation()
        }
    }
    
    private func startProgressAnimation() {
        Timer.scheduledTimer(withTimeInterval: 1.0, repeats: true) { timer in
            withAnimation(.easeInOut(duration: 0.5)) {
                if currentPhase < phases.count - 1 {
                    currentPhase += 1
                } else {
                    timer.invalidate()
                }
            }
        }
    }
}

struct ResultsView: View {
    let detectedObjects: [String]
    let matchedProducts: [DemoProduct]
    let onReset: () -> Void
    
    var body: some View {
        ScrollView {
            VStack(spacing: 24) {
                VStack(spacing: 8) {
                    Image(systemName: "checkmark.circle.fill")
                        .font(.system(size: 64))
                        .foregroundColor(.green)
                    
                    Text("Upload Complete!")
                        .font(.title2)
                        .fontWeight(.bold)
                    
                    Text("Your video has been processed successfully")
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                }
                
                if !detectedObjects.isEmpty {
                    VStack(alignment: .leading, spacing: 12) {
                        HStack {
                            Image(systemName: "eye.fill")
                                .foregroundColor(.blue)
                            Text("Detected Objects (\(detectedObjects.count))")
                                .font(.headline)
                        }
                        
                        LazyVGrid(columns: Array(repeating: GridItem(.flexible()), count: 2), spacing: 8) {
                            ForEach(detectedObjects, id: \.self) { object in
                                HStack {
                                    Image(systemName: "tag.fill")
                                        .font(.caption)
                                    Text(object.capitalized)
                                        .font(.caption)
                                        .fontWeight(.medium)
                                }
                                .padding(.horizontal, 12)
                                .padding(.vertical, 8)
                                .background(Color.blue.opacity(0.1))
                                .foregroundColor(.blue)
                                .cornerRadius(16)
                            }
                        }
                    }
                }
                
                if !matchedProducts.isEmpty {
                    VStack(alignment: .leading, spacing: 12) {
                        HStack {
                            Image(systemName: "bag.fill")
                                .foregroundColor(.green)
                            Text("Matched Products (\(matchedProducts.count))")
                                .font(.headline)
                        }
                        
                        ScrollView(.horizontal, showsIndicators: false) {
                            HStack(spacing: 12) {
                                ForEach(matchedProducts) { product in
                                    ProductCard(product: product)
                                }
                            }
                            .padding(.horizontal)
                        }
                    }
                }
                
                VStack(spacing: 12) {
                    Button("View in Feed") {
                        // This would navigate to the home feed
                        onReset()
                    }
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(Color.accentColor)
                    .foregroundColor(.white)
                    .cornerRadius(12)
                    
                    Button("Upload Another Video", action: onReset)
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(Color.gray.opacity(0.2))
                        .foregroundColor(.primary)
                        .cornerRadius(12)
                }
            }
            .padding()
        }
    }
}

struct VideoCard: View {
    let video: DemoVideo
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            // Video placeholder
            VideoPlayerView(videoURL: URL(string: video.videoUrl ?? ""))
            
            VStack(alignment: .leading, spacing: 8) {
                Text(video.title)
                    .font(.headline)
                
                if !video.description.isEmpty {
                    Text(video.description)
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                }
                
                Text(video.createdAt, style: .date)
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            
            if !video.products.isEmpty {
                VStack(alignment: .leading, spacing: 8) {
                    Text("Shop This Video")
                        .font(.subheadline)
                        .fontWeight(.semibold)
                    
                    ScrollView(.horizontal, showsIndicators: false) {
                        HStack(spacing: 12) {
                            ForEach(video.products) { product in
                                ProductCard(product: product)
                            }
                        }
                    }
                }
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(16)
        .shadow(radius: 2)
    }
}

struct ProductCard: View {
    let product: DemoProduct
    @State private var showingProductDetail = false
    
    var body: some View {
        Button(action: {
            showingProductDetail = true
        }) {
            VStack(alignment: .leading, spacing: 8) {
                if let imageUrl = product.imageUrl, let url = URL(string: imageUrl) {
                    AsyncImage(url: url) { image in
                        image
                            .resizable()
                            .aspectRatio(contentMode: .fill)
                    } placeholder: {
                        Rectangle()
                            .fill(Color.gray.opacity(0.3))
                    }
                    .frame(width: 120, height: 80)
                    .cornerRadius(8)
                } else {
                    Rectangle()
                        .fill(Color.gray.opacity(0.3))
                        .frame(width: 120, height: 80)
                        .cornerRadius(8)
                }
                
                VStack(alignment: .leading, spacing: 4) {
                    Text(product.title)
                        .font(.caption)
                        .fontWeight(.medium)
                        .lineLimit(2)
                        .foregroundColor(.primary)
                    
                    Text(product.brand)
                        .font(.caption2)
                        .foregroundColor(.secondary)
                    
                    HStack {
                        Text("$\(String(format: "%.2f", product.price))")
                            .font(.caption)
                            .fontWeight(.bold)
                            .foregroundColor(.accentColor)
                        
                        if let rating = product.rating {
                            HStack(spacing: 2) {
                                Image(systemName: "star.fill")
                                    .font(.caption2)
                                    .foregroundColor(.yellow)
                                Text(String(format: "%.1f", rating))
                                    .font(.caption2)
                                    .foregroundColor(.secondary)
                            }
                        }
                    }
                }
            }
            .frame(width: 120)
        }
        .buttonStyle(PlainButtonStyle())
        .sheet(isPresented: $showingProductDetail) {
            ProductDetailView(product: product)
        }
    }
}

struct ProductDetailView: View {
    let product: DemoProduct
    @Environment(\.dismiss) private var dismiss
    
    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 20) {
                    if let imageUrl = product.imageUrl, let url = URL(string: imageUrl) {
                        AsyncImage(url: url) { image in
                            image
                                .resizable()
                                .aspectRatio(contentMode: .fit)
                        } placeholder: {
                            Rectangle()
                                .fill(Color.gray.opacity(0.3))
                                .aspectRatio(1, contentMode: .fit)
                        }
                        .cornerRadius(12)
                    } else {
                        Rectangle()
                            .fill(Color.gray.opacity(0.3))
                            .aspectRatio(1, contentMode: .fit)
                            .cornerRadius(12)
                    }
                    
                    VStack(alignment: .leading, spacing: 12) {
                        Text(product.title)
                            .font(.title2)
                            .fontWeight(.bold)
                        
                        Text(product.brand)
                            .font(.headline)
                            .foregroundColor(.secondary)
                        
                        HStack {
                            Text("$\(String(format: "%.2f", product.price))")
                                .font(.title)
                                .fontWeight(.bold)
                                .foregroundColor(.accentColor)
                            
                            if let rating = product.rating {
                                Spacer()
                                HStack(spacing: 4) {
                                    Image(systemName: "star.fill")
                                        .foregroundColor(.yellow)
                                    Text(String(format: "%.1f", rating))
                                        .fontWeight(.medium)
                                }
                            }
                        }
                        
                        if let buyUrl = product.buyUrl {
                            Button(action: {
                                if let url = URL(string: buyUrl) {
                                    UIApplication.shared.open(url)
                                }
                            }) {
                                HStack {
                                    Image(systemName: "cart.fill")
                                    Text("Buy Now")
                                }
                                .frame(maxWidth: .infinity)
                                .padding()
                                .background(Color.accentColor)
                                .foregroundColor(.white)
                                .cornerRadius(12)
                            }
                        }
                    }
                    .padding()
                }
            }
            .navigationTitle("Product Details")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Done") {
                        dismiss()
                    }
                }
            }
        }
    }
}

struct StatCard: View {
    let title: String
    let value: String
    let icon: String
    
    var body: some View {
        VStack(spacing: 8) {
            Image(systemName: icon)
                .font(.title2)
                .foregroundColor(.accentColor)
            
            Text(value)
                .font(.title)
                .fontWeight(.bold)
            
            Text(title)
                .font(.caption)
                .foregroundColor(.secondary)
        }
        .frame(maxWidth: .infinity)
        .padding()
        .background(Color(.systemGray6))
        .cornerRadius(12)
        .accessibilityElement(children: .combine)
        .accessibilityLabel("\(title): \(value)")
    }
}

struct VideoRow: View {
    let video: DemoVideo
    
    var body: some View {
        HStack(spacing: 12) {
            Rectangle()
                .fill(Color.gray.opacity(0.3))
                .frame(width: 60, height: 40)
                .cornerRadius(8)
            
            VStack(alignment: .leading, spacing: 4) {
                Text(video.title)
                    .font(.subheadline)
                    .fontWeight(.medium)
                
                Text(video.createdAt, style: .date)
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            
            Spacer()
            
            Text("\(video.products.count) products")
                .font(.caption)
                .foregroundColor(.accentColor)
        }
        .padding(.horizontal)
    }
}

// MARK: - Data Models
struct DemoVideo: Identifiable, Codable {
    let id: String
    let title: String
    let description: String
    let createdAt: Date
    let products: [DemoProduct]
    let videoUrl: String?
    let thumbnailUrl: String?
    let detectedObjects: [String]?
    
    static let sampleVideos = [
        DemoVideo(
            id: UUID().uuidString,
            title: "My New Sneakers Collection",
            description: "Check out these amazing sneakers I just got!",
            createdAt: Date(),
            products: DemoProduct.sampleProducts,
            videoUrl: nil,
            thumbnailUrl: nil,
            detectedObjects: ["sneakers", "shoes", "footwear"]
        ),
        DemoVideo(
            id: UUID().uuidString,
            title: "Tech Setup Tour",
            description: "My complete tech setup including laptop and accessories.",
            createdAt: Date().addingTimeInterval(-86400),
            products: DemoProduct.sampleProducts,
            videoUrl: nil,
            thumbnailUrl: nil,
            detectedObjects: ["laptop", "desk", "chair"]
        ),
        DemoVideo(
            id: UUID().uuidString,
            title: "Coffee Morning Routine",
            description: "My favorite coffee setup and morning routine.",
            createdAt: Date().addingTimeInterval(-172800),
            products: DemoProduct.sampleProducts,
            videoUrl: nil,
            thumbnailUrl: nil,
            detectedObjects: ["coffee", "mug", "cup"]
        )
    ]
}

struct DemoProduct: Identifiable, Codable {
    let id: String
    let title: String
    let brand: String
    let price: Double
    let imageUrl: String?
    let buyUrl: String?
    let rating: Double?
    
    static let sampleProducts = [
        DemoProduct(
            id: UUID().uuidString,
            title: "Nike Air Max 270",
            brand: "Nike",
            price: 129.99,
            imageUrl: nil,
            buyUrl: "https://nike.com/airmax270",
            rating: 4.5
        ),
        DemoProduct(
            id: UUID().uuidString,
            title: "MacBook Pro 13\"",
            brand: "Apple",
            price: 1299.99,
            imageUrl: nil,
            buyUrl: "https://apple.com/macbook-pro",
            rating: 4.8
        ),
        DemoProduct(
            id: UUID().uuidString,
            title: "Coffee Mug",
            brand: "Starbucks",
            price: 12.99,
            imageUrl: nil,
            buyUrl: "https://starbucks.com/mug",
            rating: 4.2
        ),
        DemoProduct(
            id: UUID().uuidString,
            title: "Adidas T-Shirt",
            brand: "Adidas",
            price: 29.99,
            imageUrl: nil,
            buyUrl: "https://adidas.com/tshirt",
            rating: 4.3
        )
    ]
}

// MARK: - Privacy Policy View
struct PrivacyPolicyView: View {
    @Environment(\.dismiss) private var dismiss
    
    var body: some View {
        NavigationView {
            ScrollView {
                VStack(alignment: .leading, spacing: 16) {
                    Text("Privacy Policy")
                        .font(.largeTitle)
                        .fontWeight(.bold)
                        .padding(.bottom)
                    
                    Group {
                        Text("Last updated: January 2025")
                            .font(.caption)
                            .foregroundColor(.secondary)
                        
                        Text("Welcome to Lokal. We are committed to protecting your privacy and ensuring you have a positive experience on our mobile-first shoppable video app.")
                            .padding(.bottom)
                        
                        Text("Information We Collect")
                            .font(.headline)
                            .fontWeight(.semibold)
                        
                        Text("We collect information you provide directly to us, such as when you create an account, upload content, or contact us. This may include your name, email address, username, and any content you upload.")
                            .padding(.bottom)
                        
                        Text("How We Use Your Information")
                            .font(.headline)
                            .fontWeight(.semibold)
                        
                        Text("We use the information we collect to provide, maintain, and improve our services, process your transactions, and communicate with you.")
                            .padding(.bottom)
                        
                        Text("Information Sharing")
                            .font(.headline)
                            .fontWeight(.semibold)
                        
                        Text("We do not sell, trade, or rent your personal information to third parties. We may share your information only in limited circumstances as described in our full privacy policy.")
                            .padding(.bottom)
                        
                        Text("Your Rights")
                            .font(.headline)
                            .fontWeight(.semibold)
                        
                        Text("You have the right to access, correct, or delete your personal information. You can also opt out of certain communications and control your privacy settings.")
                            .padding(.bottom)
                        
                        Text("Contact Us")
                            .font(.headline)
                            .fontWeight(.semibold)
                        
                        Text("If you have questions about this Privacy Policy, please contact us at privacy@lokal.com")
                    }
                }
                .padding()
            }
            .navigationTitle("Privacy Policy")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Done") {
                        dismiss()
                    }
                }
            }
        }
    }
}

// MARK: - Terms of Service View
struct TermsOfServiceView: View {
    @Environment(\.dismiss) private var dismiss
    
    var body: some View {
        NavigationView {
            ScrollView {
                VStack(alignment: .leading, spacing: 16) {
                    Text("Terms of Service")
                        .font(.largeTitle)
                        .fontWeight(.bold)
                        .padding(.bottom)
                    
                    Group {
                        Text("Last updated: January 2025")
                            .font(.caption)
                            .foregroundColor(.secondary)
                        
                        Text("By using the Lokal app, you agree to be bound by these Terms of Service. If you do not agree to these terms, do not use the app.")
                            .padding(.bottom)
                        
                        Text("Description of Service")
                            .font(.headline)
                            .fontWeight(.semibold)
                        
                        Text("Lokal is a mobile-first shoppable video app that allows users to upload videos, detect objects using AI, and match them with available products for purchase.")
                            .padding(.bottom)
                        
                        Text("User Accounts")
                            .font(.headline)
                            .fontWeight(.semibold)
                        
                        Text("You must be at least 13 years old to create an account. You are responsible for maintaining the security of your account and all activities under it.")
                            .padding(.bottom)
                        
                        Text("User Content")
                            .font(.headline)
                            .fontWeight(.semibold)
                        
                        Text("You retain ownership of content you upload, but grant us a license to use it for providing our services. You agree not to upload content that violates laws or our community guidelines.")
                            .padding(.bottom)
                        
                        Text("Prohibited Activities")
                            .font(.headline)
                            .fontWeight(.semibold)
                        
                        Text("You agree not to use the app for illegal purposes, attempt to gain unauthorized access, or interfere with the app's functionality.")
                            .padding(.bottom)
                        
                        Text("Contact Us")
                            .font(.headline)
                            .fontWeight(.semibold)
                        
                        Text("If you have questions about these Terms, please contact us at legal@lokal.com")
                    }
                }
                .padding()
            }
            .navigationTitle("Terms of Service")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Done") {
                        dismiss()
                    }
                }
            }
        }
    }
}

// MARK: - Network Service
class NetworkService: ObservableObject {
    static let shared = NetworkService()
    private let baseURL = AppConfig.apiBaseURL
    private let timeout = AppConfig.apiTimeout
    
    private init() {}
    
    func uploadVideo(title: String, description: String, videoData: Data, trackedItems: [TrackedItem]) async throws -> VideoUploadResponse {
        guard let url = URL(string: "\(baseURL)/videos/upload") else {
            throw NetworkError.invalidURL
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        let body: [String: Any] = [
            "title": title,
            "description": description,
            "videoData": videoData.base64EncodedString(),
            "trackedItems": try JSONEncoder().encode(trackedItems)
        ]
        
        request.httpBody = try JSONSerialization.data(withJSONObject: body)
        
        let (data, response) = try await URLSession.shared.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse,
              httpResponse.statusCode == 200 else {
            throw NetworkError.serverError
        }
        
        return try JSONDecoder().decode(VideoUploadResponse.self, from: data)
    }
    
    func getVideos() async throws -> [DemoVideo] {
        guard let url = URL(string: "\(baseURL)/videos") else {
            throw NetworkError.invalidURL
        }
        
        let (data, response) = try await URLSession.shared.data(from: url)
        
        guard let httpResponse = response as? HTTPURLResponse,
              httpResponse.statusCode == 200 else {
            throw NetworkError.serverError
        }
        
        let videoResponse = try JSONDecoder().decode(VideoListResponse.self, from: data)
        
        // If the API returns an empty array, return empty array (will show demo data)
        return videoResponse.videos
    }
    
    func matchProducts(objects: [String]) async throws -> ProductMatchResponse {
        guard let url = URL(string: "\(baseURL)/products/match") else {
            throw NetworkError.invalidURL
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        let body: [String: Any] = ["objects": objects]
        request.httpBody = try JSONSerialization.data(withJSONObject: body)
        
        let (data, response) = try await URLSession.shared.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse,
              httpResponse.statusCode == 200 else {
            throw NetworkError.serverError
        }
        
        let productResponse = try JSONDecoder().decode(ProductMatchResponse.self, from: data)
        return productResponse
    }
    
    func getDetectedObjects(videoId: String) async throws -> ObjectDetectionResponse {
        guard let url = URL(string: "\(baseURL)/videos/\(videoId)/status") else {
            throw NetworkError.invalidURL
        }
        
        let (data, response) = try await URLSession.shared.data(from: url)
        
        guard let httpResponse = response as? HTTPURLResponse,
              httpResponse.statusCode == 200 else {
            throw NetworkError.serverError
        }
        
        let objectsResponse = try JSONDecoder().decode(ObjectDetectionResponse.self, from: data)
        return objectsResponse
    }
}

// MARK: - Network Models
struct VideoUploadResponse: Codable {
    let success: Bool
    let videoId: String?
    let message: String?
    let error: String?
}

struct VideoListResponse: Codable {
    let success: Bool
    let videos: [DemoVideo]
}

struct ProductMatchResponse: Codable {
    let success: Bool
    let products: [DemoProduct]
    let count: Int
}

struct ObjectDetectionResponse: Codable {
    let success: Bool
    let objects: [String]?
    let status: String?
    let error: String?
}

enum NetworkError: Error {
    case invalidURL
    case serverError
    case decodingError
}

// MARK: - Video Player View
struct VideoPlayerView: View {
    let videoURL: URL?
    @State private var player: AVPlayer?
    
    var body: some View {
        Group {
            if let player = player {
                VideoPlayer(player: player)
                    .aspectRatio(16/9, contentMode: .fit)
                    .cornerRadius(12)
                    .onAppear {
                        player.play()
                    }
                    .onDisappear {
                        player.pause()
                    }
            } else {
                Rectangle()
                    .fill(Color.gray.opacity(0.3))
                    .aspectRatio(16/9, contentMode: .fit)
                    .overlay(
                        Image(systemName: "play.circle.fill")
                            .font(.system(size: 48))
                            .foregroundColor(.white)
                    )
                    .cornerRadius(12)
            }
        }
        .onAppear {
            if let videoURL = videoURL {
                player = AVPlayer(url: videoURL)
            }
        }
    }
}

#Preview {
    ContentView()
}
