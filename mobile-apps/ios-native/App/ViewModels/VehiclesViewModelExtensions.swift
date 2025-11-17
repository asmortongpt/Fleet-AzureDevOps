/**
 * VehiclesViewModelExtensions.swift
 * Fleet Management - Export/Import Extensions
 *
 * Extensions for VehiclesViewModel adding export and import functionality
 */

import Foundation
import UIKit
import SwiftUI

// MARK: - VehiclesViewModel Export/Import Extensions
extension VehiclesViewModel {

    /// Export vehicles to CSV and present share sheet
    func exportVehicles() {
        guard let url = ExportService.shared.exportVehiclesToCSV(vehicles) else {
            errorMessage = "Failed to export vehicles"
            print("❌ Failed to export vehicles")
            return
        }

        // Get the root view controller to present share sheet
        if let windowScene = UIApplication.shared.connectedScenes.first as? UIWindowScene,
           let rootVC = windowScene.windows.first?.rootViewController {
            // Find the top-most view controller
            var topVC = rootVC
            while let presentedVC = topVC.presentedViewController {
                topVC = presentedVC
            }
            ExportService.shared.shareCSV(url: url, from: topVC)
            print("✅ Presenting share sheet for \(vehicles.count) vehicles")
        } else {
            errorMessage = "Could not present share dialog"
            print("❌ Could not find root view controller")
        }
    }

    /// Import vehicles from CSV file URL
    func importVehiclesFromFile(_ url: URL) {
        let result = ExportService.shared.importVehiclesFromCSV(url: url)

        if result.success {
            // Add imported vehicles to the list (merge strategy)
            vehicles.append(contentsOf: result.vehicles)
            filteredVehicles = vehicles
            print("✅ Successfully imported \(result.vehicles.count) vehicles")

            if !result.errors.isEmpty {
                errorMessage = "Imported with \(result.errors.count) warnings:\n\(result.errorSummary ?? "")"
            }
        } else {
            errorMessage = "Import failed:\n\(result.errorSummary ?? "Unknown error")"
            print("❌ Import failed")
        }
    }
}
