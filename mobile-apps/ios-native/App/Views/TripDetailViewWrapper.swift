//
//  TripDetailViewWrapper.swift
//  Fleet Manager
//
//  Wrapper to display TripDetailView by ID
//

import SwiftUI

struct TripDetailViewWrapper: View {
    let tripId: String

    var body: some View {
        TripDetailView(tripId: tripId)
            .navigationTitle("Trip Details")
            .navigationBarTitleDisplayMode(.inline)
    }
}
