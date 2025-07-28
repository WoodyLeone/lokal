//
//  LokalUITests.swift
//  LokalUITests
//
//  Created by Mike  on 2025-07-25.
//

import XCTest

final class LokalUITests: XCTestCase {

    override func setUpWithError() throws {
        // Put setup code here. This method is called before the invocation of each test method in the class.

        // In UI tests it is usually best to stop immediately when a failure occurs.
        continueAfterFailure = false

        // In UI tests it's important to set the initial state - such as interface orientation - required for your tests before they run. The setUp method is a good place to do this.
    }

    override func tearDownWithError() throws {
        // Put teardown code here. This method is called after the invocation of each test method in the class.
    }

    @MainActor
    func testAppLaunch() throws {
        // Test that the app launches successfully
        let app = XCUIApplication()
        app.launch()
        
        // Verify the app launched and shows the authentication screen
        XCTAssertTrue(app.exists, "App should launch successfully")
    }
    
    @MainActor
    func testAuthenticationFlow() throws {
        // Test the authentication flow
        let app = XCUIApplication()
        app.launch()
        
        // Test sign up flow
        let emailTextField = app.textFields["Email address"]
        let passwordSecureTextField = app.secureTextFields["Password"]
        
        XCTAssertTrue(emailTextField.exists, "Email field should be present")
        XCTAssertTrue(passwordSecureTextField.exists, "Password field should be present")
        
        // Test with valid credentials
        emailTextField.tap()
        emailTextField.typeText("test@example.com")
        
        passwordSecureTextField.tap()
        passwordSecureTextField.typeText("password123")
        
        // Test sign in button
        let signInButton = app.buttons["Sign in button"]
        XCTAssertTrue(signInButton.exists, "Sign in button should be present")
        signInButton.tap()
        
        // Wait for authentication to complete
        let discoverTab = app.tabBars.buttons["Discover"]
        XCTAssertTrue(discoverTab.waitForExistence(timeout: 5), "Should navigate to main app after authentication")
    }
    
    @MainActor
    func testTabNavigation() throws {
        // Test tab bar navigation
        let app = XCUIApplication()
        app.launch()
        
        // Authenticate first
        let emailTextField = app.textFields["Email address"]
        let passwordSecureTextField = app.secureTextFields["Password"]
        
        emailTextField.tap()
        emailTextField.typeText("test@example.com")
        passwordSecureTextField.tap()
        passwordSecureTextField.typeText("password123")
        
        let signInButton = app.buttons["Sign in button"]
        signInButton.tap()
        
        // Test tab navigation
        let discoverTab = app.tabBars.buttons["Discover"]
        let uploadTab = app.tabBars.buttons["Upload"]
        let profileTab = app.tabBars.buttons["Profile"]
        
        XCTAssertTrue(discoverTab.exists, "Discover tab should be present")
        XCTAssertTrue(uploadTab.exists, "Upload tab should be present")
        XCTAssertTrue(profileTab.exists, "Profile tab should be present")
        
        // Test tab switching
        uploadTab.tap()
        XCTAssertTrue(app.navigationBars["Upload Video"].exists, "Should show upload screen")
        
        profileTab.tap()
        XCTAssertTrue(app.navigationBars["Profile"].exists, "Should show profile screen")
        
        discoverTab.tap()
        XCTAssertTrue(app.navigationBars["Discover"].exists, "Should show discover screen")
    }
    
    @MainActor
    func testAccessibilityFeatures() throws {
        // Test accessibility features
        let app = XCUIApplication()
        app.launch()
        
        // Test VoiceOver labels
        let emailField = app.textFields["Email address"]
        let passwordField = app.secureTextFields["Password"]
        
        XCTAssertTrue(emailField.exists, "Email field should have accessibility label")
        XCTAssertTrue(passwordField.exists, "Password field should have accessibility label")
        
        // Test button accessibility
        let signInButton = app.buttons["Sign in button"]
        XCTAssertTrue(signInButton.exists, "Sign in button should have accessibility label")
    }
    
    @MainActor
    func testPrivacyPolicyAndTerms() throws {
        // Test privacy policy and terms of service links
        let app = XCUIApplication()
        app.launch()
        
        // Test privacy policy link
        let privacyPolicyButton = app.buttons["Privacy Policy"]
        XCTAssertTrue(privacyPolicyButton.exists, "Privacy Policy link should be present")
        privacyPolicyButton.tap()
        
        // Verify privacy policy sheet appears
        let privacyPolicyTitle = app.navigationBars["Privacy Policy"]
        XCTAssertTrue(privacyPolicyTitle.waitForExistence(timeout: 2), "Privacy Policy sheet should appear")
        
        // Close privacy policy
        let doneButton = app.buttons["Done"]
        doneButton.tap()
        
        // Test terms of service link
        let termsButton = app.buttons["Terms of Service"]
        XCTAssertTrue(termsButton.exists, "Terms of Service link should be present")
        termsButton.tap()
        
        // Verify terms sheet appears
        let termsTitle = app.navigationBars["Terms of Service"]
        XCTAssertTrue(termsTitle.waitForExistence(timeout: 2), "Terms of Service sheet should appear")
        
        // Close terms
        doneButton.tap()
    }

    @MainActor
    func testLaunchPerformance() throws {
        // This measures how long it takes to launch your application.
        measure(metrics: [XCTApplicationLaunchMetric()]) {
            XCUIApplication().launch()
        }
    }
}
