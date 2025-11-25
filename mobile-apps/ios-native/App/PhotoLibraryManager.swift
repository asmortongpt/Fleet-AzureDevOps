/**
 * Photo Library Manager for Fleet Management
 * Handles photo library access, permissions, and image selection
 * Supports single and multiple photo selection
 * PHPicker integration for iOS 14+
 */

import SwiftUI
import PhotosUI
import Photos

// MARK: - Photo Library Manager
class PhotoLibraryManager: ObservableObject {
    @Published var authorizationStatus: PHAuthorizationStatus = .notDetermined
    @Published var selectedImages: [UIImage] = []
    @Published var error: PhotoLibraryError?

    init() {
        checkAuthorization()
    }

    // MARK: - Authorization
    func checkAuthorization() {
        authorizationStatus = PHPhotoLibrary.authorizationStatus(for: .readWrite)
    }

    func requestAuthorization() async {
        let status = await PHPhotoLibrary.requestAuthorization(for: .readWrite)

        await MainActor.run {
            self.authorizationStatus = status
        }
    }

    var isAuthorized: Bool {
        return authorizationStatus == .authorized || authorizationStatus == .limited
    }

    // MARK: - Save Image to Library
    func saveImage(_ image: UIImage, completion: @escaping (Result<String, Error>) -> Void) {
        PHPhotoLibrary.shared().performChanges({
            let request = PHAssetChangeRequest.creationRequestForAsset(from: image)
            request.creationDate = Date()
        }) { success, error in
            DispatchQueue.main.async {
                if let error = error {
                    completion(.failure(error))
                } else if success {
                    completion(.success("Photo saved to library"))
                } else {
                    completion(.failure(PhotoLibraryError.saveFailed))
                }
            }
        }
    }

    // MARK: - Save Multiple Images
    func saveImages(_ images: [UIImage], completion: @escaping (Result<Int, Error>) -> Void) {
        var savedCount = 0
        let group = DispatchGroup()
        var saveError: Error?

        for image in images {
            group.enter()

            saveImage(image) { result in
                switch result {
                case .success:
                    savedCount += 1
                case .failure(let error):
                    saveError = error
                }
                group.leave()
            }
        }

        group.notify(queue: .main) {
            if let error = saveError {
                completion(.failure(error))
            } else {
                completion(.success(savedCount))
            }
        }
    }

    // MARK: - Load Image from Asset
    func loadImage(from asset: PHAsset, targetSize: CGSize = PHImageManagerMaximumSize) async -> UIImage? {
        return await withCheckedContinuation { continuation in
            let options = PHImageRequestOptions()
            options.deliveryMode = .highQualityFormat
            options.isNetworkAccessAllowed = true
            options.isSynchronous = false

            PHImageManager.default().requestImage(
                for: asset,
                targetSize: targetSize,
                contentMode: .aspectFit,
                options: options
            ) { image, _ in
                continuation.resume(returning: image)
            }
        }
    }

    // MARK: - Fetch Recent Photos
    func fetchRecentPhotos(limit: Int = 20) -> [PHAsset] {
        let options = PHFetchOptions()
        options.sortDescriptors = [NSSortDescriptor(key: "creationDate", ascending: false)]
        options.fetchLimit = limit

        let results = PHAsset.fetchAssets(with: .image, options: options)
        var assets: [PHAsset] = []

        results.enumerateObjects { asset, _, _ in
            assets.append(asset)
        }

        return assets
    }
}

// MARK: - Photo Picker View (iOS 14+)
@available(iOS 14, *)
struct PhotoPickerView: UIViewControllerRepresentable {
    let configuration: PHPickerConfiguration
    let onComplete: ([UIImage]) -> Void
    let onCancel: () -> Void

    func makeUIViewController(context: Context) -> PHPickerViewController {
        let picker = PHPickerViewController(configuration: configuration)
        picker.delegate = context.coordinator
        return picker
    }

    func updateUIViewController(_ uiViewController: PHPickerViewController, context: Context) {
        // No updates needed
    }

    func makeCoordinator() -> Coordinator {
        Coordinator(onComplete: onComplete, onCancel: onCancel)
    }

    class Coordinator: NSObject, PHPickerViewControllerDelegate {
        let onComplete: ([UIImage]) -> Void
        let onCancel: () -> Void

        init(onComplete: @escaping ([UIImage]) -> Void, onCancel: @escaping () -> Void) {
            self.onComplete = onComplete
            self.onCancel = onCancel
        }

        func picker(_ picker: PHPickerViewController, didFinishPicking results: [PHPickerResult]) {
            picker.dismiss(animated: true)

            guard !results.isEmpty else {
                onCancel()
                return
            }

            var images: [UIImage] = []
            let group = DispatchGroup()

            for result in results {
                group.enter()

                result.itemProvider.loadObject(ofClass: UIImage.self) { object, error in
                    if let image = object as? UIImage {
                        images.append(image)
                    }
                    group.leave()
                }
            }

            group.notify(queue: .main) {
                self.onComplete(images)
            }
        }
    }
}

// MARK: - Photo Picker Button
struct PhotoPickerButton: View {
    let maxSelection: Int
    let onComplete: ([UIImage]) -> Void

    @State private var showingPicker = false

    var body: some View {
        Button(action: { showingPicker = true }) {
            Label("Choose from Library", systemImage: "photo.on.rectangle")
        }
        .sheet(isPresented: $showingPicker) {
            if #available(iOS 14, *) {
                PhotoPickerSheet(maxSelection: maxSelection, onComplete: onComplete)
            }
        }
    }
}

@available(iOS 14, *)
struct PhotoPickerSheet: View {
    let maxSelection: Int
    let onComplete: ([UIImage]) -> Void

    @Environment(\.dismiss) private var dismiss

    var body: some View {
        PhotoPickerView(
            configuration: {
                var config = PHPickerConfiguration()
                config.selectionLimit = maxSelection
                config.filter = .images
                return config
            }(),
            onComplete: { images in
                onComplete(images)
                dismiss()
            },
            onCancel: {
                dismiss()
            }
        )
    }
}

// MARK: - Image Picker (Legacy - iOS 13)
struct ImagePickerLegacy: UIViewControllerRepresentable {
    let sourceType: UIImagePickerController.SourceType
    let onComplete: (UIImage) -> Void
    let onCancel: () -> Void

    func makeUIViewController(context: Context) -> UIImagePickerController {
        let picker = UIImagePickerController()
        picker.sourceType = sourceType
        picker.delegate = context.coordinator
        return picker
    }

    func updateUIViewController(_ uiViewController: UIImagePickerController, context: Context) {
        // No updates needed
    }

    func makeCoordinator() -> Coordinator {
        Coordinator(onComplete: onComplete, onCancel: onCancel)
    }

    class Coordinator: NSObject, UIImagePickerControllerDelegate, UINavigationControllerDelegate {
        let onComplete: (UIImage) -> Void
        let onCancel: () -> Void

        init(onComplete: @escaping (UIImage) -> Void, onCancel: @escaping () -> Void) {
            self.onComplete = onComplete
            self.onCancel = onCancel
        }

        func imagePickerController(
            _ picker: UIImagePickerController,
            didFinishPickingMediaWithInfo info: [UIImagePickerController.InfoKey: Any]
        ) {
            picker.dismiss(animated: true)

            if let image = info[.originalImage] as? UIImage {
                onComplete(image)
            } else {
                onCancel()
            }
        }

        func imagePickerControllerDidCancel(_ picker: UIImagePickerController) {
            picker.dismiss(animated: true)
            onCancel()
        }
    }
}

// MARK: - Photo Source Picker
struct PhotoSourcePicker: View {
    let onSelectCamera: () -> Void
    let onSelectLibrary: () -> Void

    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationView {
            List {
                Button(action: {
                    onSelectCamera()
                    dismiss()
                }) {
                    Label("Take Photo", systemImage: "camera.fill")
                }

                Button(action: {
                    onSelectLibrary()
                    dismiss()
                }) {
                    Label("Choose from Library", systemImage: "photo.on.rectangle")
                }
            }
            .navigationTitle("Add Photo")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Cancel") {
                        dismiss()
                    }
                }
            }
        }
    }
}

// MARK: - Photo Grid View
struct PhotoGridView: View {
    let photos: [CapturedPhoto]
    let columns = [
        GridItem(.adaptive(minimum: 100, maximum: 150), spacing: 8)
    ]

    var body: some View {
        ScrollView {
            LazyVGrid(columns: columns, spacing: 8) {
                ForEach(photos) { photo in
                    PhotoGridItem(photo: photo)
                }
            }
            .padding()
        }
    }
}

struct PhotoGridItem: View {
    let photo: CapturedPhoto

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Image(uiImage: photo.image)
                .resizable()
                .scaledToFill()
                .frame(width: 100, height: 100)
                .clipShape(RoundedRectangle(cornerRadius: 8))

            Text(photo.photoType.title)
                .font(.caption2)
                .foregroundColor(.secondary)
                .lineLimit(1)
        }
    }
}

// MARK: - Photo Library Error
enum PhotoLibraryError: Error, LocalizedError {
    case notAuthorized
    case saveFailed
    case loadFailed
    case noImageSelected

    var errorDescription: String? {
        switch self {
        case .notAuthorized:
            return "Photo library access not authorized. Please enable in Settings."
        case .saveFailed:
            return "Failed to save photo to library"
        case .loadFailed:
            return "Failed to load photo from library"
        case .noImageSelected:
            return "No image selected"
        }
    }
}

// MARK: - Photo Library Helpers
extension PhotoLibraryManager {
    func openSettings() {
        if let url = URL(string: UIApplication.openSettingsURLString) {
            UIApplication.shared.open(url)
        }
    }
}

// MARK: - Photo Asset Extension
extension PHAsset {
    var creationDateFormatted: String {
        guard let date = creationDate else { return "Unknown" }
        let formatter = DateFormatter()
        formatter.dateStyle = .medium
        formatter.timeStyle = .short
        return formatter.string(from: date)
    }

    var location: CLLocation? {
        return self.location
    }
}
