import Foundation
import Photos
import UIKit

// MARK: - Photo Library Manager
class PhotoLibraryManager {
    static let shared = PhotoLibraryManager()

    private init() {}

    /// Save image to photo library
    func saveImage(_ image: UIImage, completion: @escaping (Bool, Error?) -> Void) {
        PHPhotoLibrary.requestAuthorization { status in
            guard status == .authorized else {
                completion(false, NSError(domain: "PhotoLibrary", code: -1, userInfo: [NSLocalizedDescriptionKey: "Photo library access denied"]))
                return
            }

            PHPhotoLibrary.shared().performChanges({
                PHAssetChangeRequest.creationRequestForAsset(from: image)
            }, completionHandler: { success, error in
                DispatchQueue.main.async {
                    completion(success, error)
                }
            })
        }
    }

    /// Save image data to photo library
    func saveImageData(_ imageData: Data, completion: @escaping (Bool, Error?) -> Void) {
        guard let image = UIImage(data: imageData) else {
            completion(false, NSError(domain: "PhotoLibrary", code: -2, userInfo: [NSLocalizedDescriptionKey: "Invalid image data"]))
            return
        }

        saveImage(image, completion: completion)
    }
}
