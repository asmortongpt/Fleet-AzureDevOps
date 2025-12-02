import Foundation
import UIKit

// MARK: - Error Handler
/// Centralized error handling with retry logic and recovery strategies
class ErrorHandler {

    // MARK: - Properties
    static let shared = ErrorHandler()

    private let logger = LoggingManager.shared
    private let maxRetryAttempts = 3
    private let baseDelay: TimeInterval = 1.0 // Base delay for exponential backoff

    // MARK: - Error Recovery Strategy
    enum RecoveryStrategy {
        case retry
        case fallbackToCache
        case useDefaultValue
        case promptUser
        case fail
    }

    // MARK: - Initialization
    private init() {}

    // MARK: - Public Methods

    /// Handle an error with automatic recovery strategy selection
    /// - Parameters:
    ///   - error: The error to handle
    ///   - context: Additional context about where the error occurred
    ///   - completion: Optional completion handler with recovery result
    func handle(_ error: Error, context: String, completion: ((Bool) -> Void)? = nil) {
        logger.log(.error, "Error in \(context): \(error.localizedDescription)", metadata: [
            "errorType": String(describing: type(of: error)),
            "context": context
        ])

        // Determine recovery strategy based on error type
        let strategy = determineRecoveryStrategy(for: error)

        // Execute recovery strategy
        executeRecoveryStrategy(strategy, for: error, context: context, completion: completion)
    }

    /// Handle error with custom recovery strategy
    /// - Parameters:
    ///   - error: The error to handle
    ///   - strategy: The recovery strategy to use
    ///   - context: Additional context
    ///   - completion: Optional completion handler
    func handle(_ error: Error, with strategy: RecoveryStrategy, context: String, completion: ((Bool) -> Void)? = nil) {
        logger.log(.error, "Error in \(context) with strategy \(strategy): \(error.localizedDescription)", metadata: [
            "errorType": String(describing: type(of: error)),
            "context": context,
            "strategy": String(describing: strategy)
        ])

        executeRecoveryStrategy(strategy, for: error, context: context, completion: completion)
    }

    /// Execute an operation with automatic retry logic and exponential backoff
    /// - Parameters:
    ///   - operation: The async operation to execute
    ///   - retries: Number of retry attempts (default: 3)
    ///   - context: Context for logging
    /// - Returns: The result of the operation
    func executeWithRetry<T>(
        _ operation: @escaping () async throws -> T,
        retries: Int = 3,
        context: String
    ) async throws -> T {
        var lastError: Error?

        for attempt in 0..<retries {
            do {
                let result = try await operation()

                // Log successful retry if not first attempt
                if attempt > 0 {
                    logger.log(.info, "Operation succeeded after \(attempt + 1) attempts in \(context)")
                }

                return result
            } catch {
                lastError = error

                // Don't retry if it's a non-retryable error
                if !isRetryable(error) {
                    logger.log(.warning, "Non-retryable error in \(context): \(error.localizedDescription)")
                    throw error
                }

                // Calculate exponential backoff delay
                let delay = calculateBackoffDelay(for: attempt)

                logger.log(.warning, "Attempt \(attempt + 1)/\(retries) failed in \(context). Retrying in \(delay)s...", metadata: [
                    "attempt": String(attempt + 1),
                    "maxRetries": String(retries),
                    "delay": String(delay)
                ])

                // Wait before retrying (except on last attempt)
                if attempt < retries - 1 {
                    try await Task.sleep(nanoseconds: UInt64(delay * 1_000_000_000))
                }
            }
        }

        // All retries exhausted
        logger.log(.error, "All \(retries) retry attempts exhausted in \(context)")
        throw lastError ?? FleetError.unknown("All retry attempts failed")
    }

    /// Get user-friendly error message
    /// - Parameter error: The error to convert
    /// - Returns: User-friendly error message
    func getUserFriendlyMessage(for error: Error) -> String {
        if let fleetError = error as? FleetError {
            return fleetError.userMessage
        }

        if let apiError = error as? APIError {
            return apiError.userMessage
        }

        // Handle standard errors
        switch error {
        case is URLError:
            if let urlError = error as? URLError {
                switch urlError.code {
                case .notConnectedToInternet:
                    return "No internet connection. Please check your network settings."
                case .timedOut:
                    return "The request took too long. Please try again."
                case .cannotFindHost, .cannotConnectToHost:
                    return "Unable to reach the server. Please try again later."
                default:
                    return "A network error occurred. Please check your connection."
                }
            }
            return "A network error occurred."

        case is DecodingError:
            return "We received unexpected data from the server. Please try again."

        default:
            return "Something went wrong. Please try again."
        }
    }

    /// Get error icon for display
    /// - Parameter error: The error
    /// - Returns: SF Symbol name for the error
    func getErrorIcon(for error: Error) -> String {
        if let fleetError = error as? FleetError {
            return fleetError.icon
        }

        if let apiError = error as? APIError {
            return apiError.icon
        }

        // Handle standard errors
        if let urlError = error as? URLError {
            switch urlError.code {
            case .notConnectedToInternet:
                return "wifi.slash"
            case .timedOut:
                return "clock.arrow.circlepath"
            default:
                return "exclamationmark.triangle"
            }
        }

        return "exclamationmark.triangle"
    }

    // MARK: - Private Methods

    /// Determine the best recovery strategy for an error
    private func determineRecoveryStrategy(for error: Error) -> RecoveryStrategy {
        // Network errors - retry
        if error is URLError || error is APIError {
            return .retry
        }

        // Authentication errors - prompt user
        if let apiError = error as? APIError {
            switch apiError {
            case .authenticationFailed, .unauthorized:
                return .promptUser
            default:
                return .retry
            }
        }

        // Decoding errors - fail immediately
        if error is DecodingError {
            return .fail
        }

        // Fleet-specific errors
        if let fleetError = error as? FleetError {
            switch fleetError {
            case .networkError, .serverError, .timeout:
                return .retry
            case .authenticationRequired:
                return .promptUser
            case .dataNotFound:
                return .fallbackToCache
            default:
                return .fail
            }
        }

        // Default strategy
        return .retry
    }

    /// Execute the recovery strategy
    private func executeRecoveryStrategy(_ strategy: RecoveryStrategy, for error: Error, context: String, completion: ((Bool) -> Void)?) {
        switch strategy {
        case .retry:
            logger.log(.info, "Attempting recovery strategy: retry for \(context)")
            // Retry will be handled by the caller using executeWithRetry
            completion?(false)

        case .fallbackToCache:
            logger.log(.info, "Attempting recovery strategy: fallback to cache for \(context)")
            // Attempt to load from cache
            completion?(true)

        case .useDefaultValue:
            logger.log(.info, "Attempting recovery strategy: use default value for \(context)")
            completion?(true)

        case .promptUser:
            logger.log(.info, "Attempting recovery strategy: prompt user for \(context)")
            // Show error to user
            DispatchQueue.main.async {
                self.showErrorToUser(error, context: context)
            }
            completion?(false)

        case .fail:
            logger.log(.error, "Recovery strategy: fail for \(context)")
            completion?(false)
        }
    }

    /// Check if an error is retryable
    private func isRetryable(_ error: Error) -> Bool {
        // Network errors are generally retryable
        if let urlError = error as? URLError {
            switch urlError.code {
            case .timedOut, .cannotConnectToHost, .networkConnectionLost, .notConnectedToInternet:
                return true
            case .badURL, .unsupportedURL:
                return false
            default:
                return true
            }
        }

        // API errors
        if let apiError = error as? APIError {
            switch apiError {
            case .networkError, .timeout, .serverError:
                return true
            case .unauthorized, .authenticationFailed, .invalidURL, .decodingError, .badRequest:
                return false
            default:
                return true
            }
        }

        // Fleet errors
        if let fleetError = error as? FleetError {
            switch fleetError {
            case .networkError, .serverError, .timeout:
                return true
            case .invalidCredentials, .invalidData, .authenticationRequired:
                return false
            default:
                return true
            }
        }

        // Default: retry
        return true
    }

    /// Calculate exponential backoff delay
    private func calculateBackoffDelay(for attempt: Int) -> TimeInterval {
        // Exponential backoff: baseDelay * 2^attempt with jitter
        let exponentialDelay = baseDelay * pow(2.0, Double(attempt))

        // Add random jitter (±20%) to prevent thundering herd
        let jitter = Double.random(in: 0.8...1.2)
        let delay = exponentialDelay * jitter

        // Cap maximum delay at 30 seconds
        return min(delay, 30.0)
    }

    /// Show error to user
    private func showErrorToUser(_ error: Error, context: String) {
        // This would typically show an alert or notification
        // For now, just log it
        let message = getUserFriendlyMessage(for: error)
        logger.log(.error, "Showing error to user: \(message)", metadata: [
            "context": context
        ])

        // In a real implementation, you might post a notification
        NotificationCenter.default.post(
            name: NSNotification.Name("ShowErrorNotification"),
            object: nil,
            userInfo: [
                "error": error,
                "message": message,
                "context": context
            ]
        )
    }
}

// MARK: - Fleet Error Types
enum FleetError: Error, LocalizedError {
    case networkError(String)
    case serverError(String)
    case authenticationRequired
    case invalidCredentials
    case timeout
    case dataNotFound
    case invalidData(String)
    case unknown(String)
    case permissionDenied
    case resourceNotFound
    case serviceUnavailable
    case rateLimited

    var errorDescription: String? {
        switch self {
        case .networkError(let message):
            return "Network error: \(message)"
        case .serverError(let message):
            return "Server error: \(message)"
        case .authenticationRequired:
            return "Authentication required"
        case .invalidCredentials:
            return "Invalid credentials"
        case .timeout:
            return "Request timed out"
        case .dataNotFound:
            return "Data not found"
        case .invalidData(let message):
            return "Invalid data: \(message)"
        case .unknown(let message):
            return "Unknown error: \(message)"
        case .permissionDenied:
            return "Permission denied"
        case .resourceNotFound:
            return "Resource not found"
        case .serviceUnavailable:
            return "Service unavailable"
        case .rateLimited:
            return "Rate limit exceeded"
        }
    }

    var userMessage: String {
        switch self {
        case .networkError:
            return "Unable to connect to the server. Please check your internet connection."
        case .serverError:
            return "The server encountered an error. Please try again later."
        case .authenticationRequired:
            return "Please sign in to continue."
        case .invalidCredentials:
            return "Your email or password is incorrect. Please try again."
        case .timeout:
            return "The request took too long. Please try again."
        case .dataNotFound:
            return "The requested information could not be found."
        case .invalidData:
            return "We received unexpected data. Please try again."
        case .unknown:
            return "Something went wrong. Please try again."
        case .permissionDenied:
            return "You don't have permission to perform this action."
        case .resourceNotFound:
            return "The requested item could not be found."
        case .serviceUnavailable:
            return "The service is temporarily unavailable. Please try again later."
        case .rateLimited:
            return "Too many requests. Please wait a moment and try again."
        }
    }

    var icon: String {
        switch self {
        case .networkError:
            return "wifi.exclamationmark"
        case .serverError:
            return "server.rack"
        case .authenticationRequired, .invalidCredentials:
            return "person.crop.circle.badge.exclamationmark"
        case .timeout:
            return "clock.arrow.circlepath"
        case .dataNotFound, .resourceNotFound:
            return "questionmark.folder"
        case .invalidData:
            return "exclamationmark.square"
        case .permissionDenied:
            return "hand.raised"
        case .serviceUnavailable:
            return "exclamationmark.triangle"
        case .rateLimited:
            return "slowmo"
        case .unknown:
            return "exclamationmark.triangle"
        }
    }
}

// MARK: - API Error Extensions
extension APIError {
    var userMessage: String {
        switch self {
        case .invalidURL:
            return "The server address is invalid. Please contact support."
        case .authenticationFailed, .unauthorized:
            return "Your session has expired. Please sign in again."
        case .networkError:
            return "Unable to connect to the server. Please check your internet connection."
        case .serverError:
            return "The server encountered an error. Please try again later."
        case .decodingError:
            return "We received unexpected data from the server. Please try again."
        case .timeout:
            return "The request took too long. Please try again."
        case .badRequest(let message):
            return "Invalid request: \(message)"
        case .notFound:
            return "The requested information could not be found."
        case .forbidden:
            return "You don't have permission to access this information."
        case .rateLimitExceeded:
            return "Too many requests. Please wait a moment and try again."
        case .serviceUnavailable:
            return "The service is temporarily unavailable. Please try again later."
        case .unknown(let code):
            return "An unexpected error occurred (code: \(code)). Please try again."
        }
    }

    var icon: String {
        switch self {
        case .invalidURL:
            return "link.badge.exclamationmark"
        case .authenticationFailed, .unauthorized:
            return "person.crop.circle.badge.exclamationmark"
        case .networkError:
            return "wifi.exclamationmark"
        case .serverError:
            return "server.rack"
        case .decodingError:
            return "exclamationmark.square"
        case .timeout:
            return "clock.arrow.circlepath"
        case .badRequest:
            return "exclamationmark.bubble"
        case .notFound:
            return "questionmark.folder"
        case .forbidden:
            return "hand.raised"
        case .rateLimitExceeded:
            return "slowmo"
        case .serviceUnavailable:
            return "exclamationmark.triangle"
        case .unknown:
            return "questionmark.circle"
        }
    }
}
