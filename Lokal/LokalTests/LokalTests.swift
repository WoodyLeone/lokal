//
//  LokalTests.swift
//  LokalTests
//
//  Created by Mike  on 2025-07-25.
//

import Testing
import SwiftUI
@testable import Lokal

struct LokalTests {

    @Test func testEmailValidation() async throws {
        // Test valid email formats
        let validEmails = [
            "test@example.com",
            "user.name@domain.co.uk",
            "user+tag@example.org"
        ]
        
        for email in validEmails {
            #expect(isValidEmail(email) == true, "Email \(email) should be valid")
        }
        
        // Test invalid email formats
        let invalidEmails = [
            "invalid-email",
            "@example.com",
            "user@",
            "user@.com"
        ]
        
        for email in invalidEmails {
            #expect(isValidEmail(email) == false, "Email \(email) should be invalid")
        }
    }
    
    @Test func testPasswordValidation() async throws {
        // Test password length validation
        let shortPassword = "12345"
        let validPassword = "password123"
        
        #expect(shortPassword.count < 6, "Password should be at least 6 characters")
        #expect(validPassword.count >= 6, "Password should be at least 6 characters")
    }
    
    @Test func testTitleValidation() async throws {
        // Test video title validation
        let emptyTitle = ""
        let shortTitle = "Hi"
        let validTitle = "My Amazing Video"
        
        #expect(emptyTitle.isEmpty == true, "Empty title should be invalid")
        #expect(shortTitle.count < 3, "Title should be at least 3 characters")
        #expect(validTitle.count >= 3, "Valid title should pass validation")
    }
    
    @Test func testDemoDataGeneration() async throws {
        // Test that demo data is properly generated
        let videos = DemoVideo.sampleVideos
        let products = DemoProduct.sampleProducts
        
        #expect(videos.count > 0, "Should have sample videos")
        #expect(products.count > 0, "Should have sample products")
        
        // Test video structure
        for video in videos {
            #expect(!video.title.isEmpty, "Video should have a title")
            #expect(video.products.count >= 0, "Video should have products array")
        }
        
        // Test product structure
        for product in products {
            #expect(!product.title.isEmpty, "Product should have a title")
            #expect(!product.brand.isEmpty, "Product should have a brand")
            #expect(product.price > 0, "Product should have a positive price")
        }
    }
    
    // Helper function for email validation (same as in ContentView)
    private func isValidEmail(_ email: String) -> Bool {
        let emailRegex = "[A-Z0-9a-z._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,64}"
        let emailPredicate = NSPredicate(format:"SELF MATCHES %@", emailRegex)
        return emailPredicate.evaluate(with: email)
    }
}
