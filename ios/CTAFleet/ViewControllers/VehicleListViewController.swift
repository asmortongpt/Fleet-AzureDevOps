import UIKit

class VehicleListViewController: UIViewController {
    private var vehicles: [Vehicle] = []
    private let imageCache = NSCache<NSString, UIImage>()

    override func viewDidLoad() {
        super.viewDidLoad()
        setupViews()
        loadVehicles()
    }

    override func didReceiveMemoryWarning() {
        super.didReceiveMemoryWarning()

        imageCache.removeAllObjects()
        tableView.reloadData()

        logger.warning("Memory warning received, cleared caches")
    }

    deinit {
        apiClient.cancelAllRequests()
        NotificationCenter.default.removeObserver(self)
        vehicles.removeAll()
        imageCache.removeAllObjects()

        logger.debug("VehicleListViewController deallocated")
    }

    private func loadVehicles() {
        apiClient.fetchVehicles { [weak self] result in
            guard let self = self else { return }

            switch result {
            case .success(let vehicles):
                self.vehicles = vehicles
                self.tableView.reloadData()
            case .failure(let error):
                self.showError(error)
            }
        }
    }

    func loadImage(for url: String, completion: @escaping (UIImage?) -> Void) {
        if let cached = imageCache.object(forKey: url as NSString) {
            completion(cached)
            return
        }

        imageLoader.load(url) { [weak self] image in
            if let image = image {
                self?.imageCache.setObject(image, forKey: url as NSString)
            }
            completion(image)
        }
    }
}