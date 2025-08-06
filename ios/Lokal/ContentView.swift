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
    static let apiBaseURL = "https://lokal-dev-production.up.railway.app/api"
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

// MARK: - Data Models for Interactive Video
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
    var timestamp: TimeInterval // seconds
    var product: DemoProduct?
    var isVisible: Bool
    
    init(id: String = UUID().uuidString, x: Double, y: Double, timestamp: TimeInterval, product: DemoProduct? = nil, isVisible: Bool = true) {
        self.id = id
        self.x = x
        self.y = y
        self.timestamp = timestamp
        self.product = product
        self.isVisible = isVisible
    }
}

struct DemoProduct: Identifiable, Codable {
    let id: String
    let name: String
    let price: String
    let imageURL: String
    let description: String
    let category: String
    
    init(id: String = UUID().uuidString, name: String, price: String, imageURL: String, description: String, category: String) {
        self.id = id
        self.name = name
        self.price = price
        self.imageURL = imageURL
        self.description = description
        self.category = category
    }
}

// MARK: - Main Content View
struct ContentView: View {
    @State private var selectedVideo: PhotosPickerItem?
    @State private var videoURL: URL?
    @State private var isProcessing = false
    @State private var processingProgress: Double = 0.0
    @State private var detectedObjects: [String] = []
    @State private var matchedProducts: [DemoProduct] = []
    @State private var showResults = false
    @State private var errorMessage: String?
    @State private var showError = false
    
    // Interactive Video States
    @State private var trackedItems: [TrackedItem] = []
    @State private var hotspots: [Hotspot] = []
    @State private var currentVideoTime: TimeInterval = 0
    @State private var isVideoPlaying = false
    
    var body: some View {
        NavigationView {
            VStack(spacing: 20) {
                // Header
                headerView
                
                // Main Content
                if videoURL == nil {
                    uploadView
                } else if isProcessing {
                    processingView
                } else if showResults {
                    resultsView
                } else {
                    videoPreviewView
                }
                
                Spacer()
            }
            .padding()
            .navigationTitle("Lokal")
            .navigationBarTitleDisplayMode(.large)
        }
        .onChange(of: selectedVideo) { newItem in
            Task {
                await loadVideo(from: newItem)
            }
        }
        .alert("Error", isPresented: $showError) {
            Button("OK") { }
        } message: {
            Text(errorMessage ?? "An unknown error occurred")
        }
    }
    
    // MARK: - Header View
    private var headerView: some View {
        VStack(spacing: 8) {
            Text("Lokal")
                .font(.largeTitle)
                .fontWeight(.bold)
            
            Text("Shoppable Video Discovery")
                .font(.subheadline)
                .foregroundColor(.secondary)
        }
    }
    
    // MARK: - Upload View
    private var uploadView: some View {
        VStack(spacing: 20) {
            Image(systemName: "video.badge.plus")
                .font(.system(size: 60))
                .foregroundColor(.blue)
            
            Text("Upload a Video")
                .font(.title2)
                .fontWeight(.semibold)
            
            Text("Record or select a video to discover products")
                .font(.body)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
            
            PhotosPicker(selection: $selectedVideo, matching: .videos) {
                HStack {
                    Image(systemName: "plus.circle.fill")
                    Text("Select Video")
                }
                .font(.headline)
                .foregroundColor(.white)
                .padding()
                .background(Color.blue)
                .cornerRadius(10)
            }
        }
        .padding()
    }
    
    // MARK: - Processing View
    private var processingView: some View {
        VStack(spacing: 20) {
            ProgressView(value: processingProgress)
                .progressViewStyle(LinearProgressViewStyle())
                .scaleEffect(x: 1, y: 2, anchor: .center)
            
            Text("Processing Video...")
                .font(.headline)
            
            Text("\(Int(processingProgress * 100))%")
                .font(.subheadline)
                .foregroundColor(.secondary)
            
            // Demo processing simulation
            if AppConfig.enableDemoMode {
                Text("Demo Mode: Simulating processing...")
                    .font(.caption)
                    .foregroundColor(.orange)
            }
        }
        .padding()
        .onAppear {
            startProcessing()
        }
    }
    
    // MARK: - Video Preview View
    private var videoPreviewView: some View {
        VStack(spacing: 20) {
            if let videoURL = videoURL {
                VideoPlayer(player: AVPlayer(url: videoURL))
                    .frame(height: 300)
                    .cornerRadius(12)
                    .onAppear {
                        setupInteractiveVideo()
                    }
            }
            
            HStack(spacing: 20) {
                Button("Process Video") {
                    startProcessing()
                }
                .buttonStyle(.borderedProminent)
                
                Button("Select New Video") {
                    resetState()
                }
                .buttonStyle(.bordered)
            }
        }
        .padding()
    }
    
    // MARK: - Results View
    private var resultsView: some View {
        ScrollView {
            VStack(spacing: 20) {
                // Detected Objects
                if !detectedObjects.isEmpty {
                    detectedObjectsSection
                }
                
                // Matched Products
                if !matchedProducts.isEmpty {
                    matchedProductsSection
                }
                
                // Interactive Video Player
                if !trackedItems.isEmpty {
                    interactiveVideoSection
                }
                
                // Action Buttons
                actionButtons
            }
            .padding()
        }
    }
    
    // MARK: - Detected Objects Section
    private var detectedObjectsSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Detected Objects")
                .font(.headline)
            
            LazyVGrid(columns: Array(repeating: GridItem(.flexible()), count: 2), spacing: 8) {
                ForEach(detectedObjects, id: \.self) { object in
                    HStack {
                        Image(systemName: "eye.fill")
                            .foregroundColor(.blue)
                        Text(object)
                            .font(.subheadline)
                    }
                    .padding(.horizontal, 12)
                    .padding(.vertical, 8)
                    .background(Color.blue.opacity(0.1))
                    .cornerRadius(8)
                }
            }
        }
    }
    
    // MARK: - Matched Products Section
    private var matchedProductsSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Matched Products")
                .font(.headline)
            
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
    
    // MARK: - Interactive Video Section
    private var interactiveVideoSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Interactive Video")
                .font(.headline)
            
            if let videoURL = videoURL {
                ZStack {
                    VideoPlayer(player: AVPlayer(url: videoURL))
                        .frame(height: 300)
                        .cornerRadius(12)
                    
                    // Overlay tracked items
                    ForEach(trackedItems) { item in
                        if currentVideoTime >= item.startTime && currentVideoTime <= item.endTime {
                            Circle()
                                .fill(Color.red.opacity(0.6))
                                .frame(width: 20, height: 20)
                                .position(
                                    x: CGFloat(item.x) * 300,
                                    y: CGFloat(item.y) * 300
                                )
                                .scaleEffect(item.isSelected ? 1.2 : 1.0)
                                .animation(.easeInOut(duration: 0.3), value: item.isSelected)
                        }
                    }
                }
            }
        }
    }
    
    // MARK: - Action Buttons
    private var actionButtons: some View {
        VStack(spacing: 12) {
            Button("Process New Video") {
                resetState()
            }
            .buttonStyle(.borderedProminent)
            
            Button("Share Results") {
                // Share functionality
            }
            .buttonStyle(.bordered)
        }
    }
    
    // MARK: - Helper Methods
    private func loadVideo(from item: PhotosPickerItem?) async {
        guard let item = item else { return }
        
        do {
            if let videoData = try await item.loadTransferable(type: Data.self) {
                let tempURL = FileManager.default.temporaryDirectory.appendingPathComponent("video.mp4")
                try videoData.write(to: tempURL)
                
                await MainActor.run {
                    self.videoURL = tempURL
                    self.selectedVideo = nil
                }
            }
        } catch {
            await MainActor.run {
                self.errorMessage = AppConfig.errorMessages["upload"]
                self.showError = true
            }
        }
    }
    
    private func startProcessing() {
        isProcessing = true
        processingProgress = 0.0
        
        // Simulate processing with demo data
        if AppConfig.enableDemoMode {
            simulateProcessing()
        } else {
            // Real processing would go here
            processVideoWithAPI()
        }
    }
    
    private func simulateProcessing() {
        Timer.scheduledTimer(withTimeInterval: 0.1, repeats: true) { timer in
            processingProgress += 0.02
            
            if processingProgress >= 1.0 {
                timer.invalidate()
                
                // Add demo data
                detectedObjects = AppConfig.demoObjects
                matchedProducts = generateDemoProducts()
                trackedItems = generateDemoTrackedItems()
                
                isProcessing = false
                showResults = true
            }
        }
    }
    
    private func processVideoWithAPI() {
        // Real API processing would go here
        // This would call the Railway backend
    }
    
    private func setupInteractiveVideo() {
        // Setup video player for interactive features
    }
    
    private func resetState() {
        videoURL = nil
        isProcessing = false
        processingProgress = 0.0
        detectedObjects = []
        matchedProducts = []
        trackedItems = []
        hotspots = []
        showResults = false
        errorMessage = nil
        showError = false
    }
    
    private func generateDemoProducts() -> [DemoProduct] {
        return [
            DemoProduct(name: "MacBook Pro", price: "$1,299", imageURL: "", description: "Latest MacBook Pro with M2 chip", category: "Electronics"),
            DemoProduct(name: "Coffee Mug", price: "$15", imageURL: "", description: "Ceramic coffee mug", category: "Kitchen"),
            DemoProduct(name: "Desk Lamp", price: "$45", imageURL: "", description: "LED desk lamp", category: "Home"),
            DemoProduct(name: "Plant Pot", price: "$25", imageURL: "", description: "Decorative plant pot", category: "Home")
        ]
    }
    
    private func generateDemoTrackedItems() -> [TrackedItem] {
        return [
            TrackedItem(name: "laptop", x: 0.3, y: 0.4, startTime: 0, endTime: 30),
            TrackedItem(name: "coffee cup", x: 0.7, y: 0.6, startTime: 5, endTime: 25),
            TrackedItem(name: "desk", x: 0.5, y: 0.8, startTime: 0, endTime: 60)
        ]
    }
}

// MARK: - Product Card View
struct ProductCard: View {
    let product: DemoProduct
    
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Rectangle()
                .fill(Color.gray.opacity(0.3))
                .frame(width: AppConfig.productCardWidth, height: AppConfig.productCardHeight)
                .cornerRadius(8)
            
            Text(product.name)
                .font(.caption)
                .fontWeight(.medium)
                .lineLimit(2)
            
            Text(product.price)
                .font(.caption)
                .foregroundColor(.blue)
                .fontWeight(.semibold)
        }
        .frame(width: AppConfig.productCardWidth)
    }
}

// MARK: - Preview
struct ContentView_Previews: PreviewProvider {
    static var previews: some View {
        ContentView()
    }
} 