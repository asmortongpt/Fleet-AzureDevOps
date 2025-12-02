//
//  DashboardViewExtension.swift
//  Fleet Manager
//
//  Extension to integrate Checklist Widget into main DashboardView
//

import SwiftUI

extension DashboardView {
    /// Checklist widget section for dashboard
    var checklistWidgetSection: some View {
        ChecklistDashboardWidget()
            .padding(.horizontal)
    }
}

// MARK: - Integration Instructions
/*
 To integrate the checklist widget into the main DashboardView, add the following
 inside the LazyVStack in dashboardContent (after recentActivitySection):

 // Checklist Widget
 checklistWidgetSection

 Example placement:
 LazyVStack(spacing: 20) {
     statsSection
     quickActionsSection
     if viewModel.stats != nil {
         utilizationChartSection
     }
     recentActivitySection
     checklistWidgetSection  // Add here
     if !viewModel.alerts.isEmpty {
         alertsSection
     }
 }
*/
