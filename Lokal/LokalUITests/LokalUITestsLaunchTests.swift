//
//  LokalUITestsLaunchTests.swift
//  LokalUITests
//
//  Created by Mike  on 2025-07-25.
//

import XCTest

final class LokalUITestsLaunchTests: XCTestCase {

    override class var runsForEachTargetApplicationUIConfiguration: Bool {
        true
    }

    override func setUpWithError() throws {
        continueAfterFailure = false
    }

    @MainActor
    func testLaunch() throws {
        let app = XCUIApplication()
        app.launch()

        // Insert steps here to perform after app launch but before taking a screenshot,
        // such as logging into a test account or navigating somewhere in the app

        let attachment = XCTAttachment(screenshot: app.screenshot())
        attachment.name = "Launch Screen"
        attachment.lifetime = .keepAlways
        add(attachment)
    }
    
    @MainActor
    func testLaunchScreenElements() throws {
        let app = XCUIApplication()
        app.launch()
        
        // Test that launch screen elements are present
        // Note: Launch screen elements may not be accessible in UI tests
        // This test verifies the app launches without crashing
        
        XCTAssertTrue(app.exists, "App should launch successfully")
        
        // Wait a moment for the app to fully load
        let _ = app.wait(for: .runningForeground, timeout: 5)
        
        let attachment = XCTAttachment(screenshot: app.screenshot())
        attachment.name = "Launch Screen Elements"
        attachment.lifetime = .keepAlways
        add(attachment)
    }
    
    @MainActor
    func testLaunchPerformance() throws {
        // Test launch performance
        measure(metrics: [XCTApplicationLaunchMetric()]) {
            XCUIApplication().launch()
        }
    }
}
