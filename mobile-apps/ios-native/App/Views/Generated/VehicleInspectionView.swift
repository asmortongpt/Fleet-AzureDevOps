t
//
//  VehicleInspectionView.swift
//  Fleet Manager
//
//  Conduct inspections with photo capture and signature
//

import SwiftUI
import PhotosUI
import PencilKit

// MARK: - Inspection
struct Inspection: Identifiable {
    let id = UUID()
    let vehicleId: String
    var photo: UIImage?
    var signature: PKDrawing?
}

// MARK: - VehicleInspectionView
struct VehicleInspectionView: View {
    @StateObject private var viewModel = VehicleInspectionViewModel()
    @State private var isCameraPresented = false
    @State private var isSignaturePresented = false

    var body: some View {
        NavigationView {
            Form {
                Section(header: Text("Vehicle")) {
                    Text(viewModel.inspection.vehicleId)
                        .accessibility(label: Text("Vehicle ID"))
                }
                Section(header: Text("Photo")) {
                    if let photo = viewModel.inspection.photo {
                        Image(uiImage: photo)
                            .resizable()
                            .aspectRatio(contentMode: .fit)
                    } else {
                        Button(action: {
                            isCameraPresented = true
                        }) {
                            Label("Capture Photo", systemImage: "camera")
                        }
                    }
                }
                Section(header: Text("Signature")) {
                    if viewModel.inspection.signature != nil {
                        SignatureDrawingView(drawing: $viewModel.inspection.signature)
                    } else {
                        Button(action: {
                            isSignaturePresented = true
                        }) {
                            Label("Add Signature", systemImage: "signature")
                        }
                    }
                }
            }
            .navigationTitle("Vehicle Inspection")
            .sheet(isPresented: $isCameraPresented) {
                PHPickerViewController.View(image: $viewModel.inspection.photo)
            }
            .sheet(isPresented: $isSignaturePresented) {
                SignatureDrawingView(drawing: $viewModel.inspection.signature)
            }
        }
    }
}

// MARK: - VehicleInspectionViewModel
class VehicleInspectionViewModel: ObservableObject {
    @Published var inspection = Inspection(vehicleId: "12345")
}

// MARK: - SignatureDrawingView
struct SignatureDrawingView: View {
    @Binding var drawing: PKDrawing?

    var body: some View {
        PKCanvasViewRepresentable(drawing: $drawing)
    }
}

// MARK: - Preview
#if DEBUG
struct VehicleInspectionView_Previews: PreviewProvider {
    static var previews: some View {
        VehicleInspectionView()
    }
}
#endif