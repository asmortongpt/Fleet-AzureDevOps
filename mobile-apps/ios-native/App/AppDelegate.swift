import UIKit

class AppDelegate: UIResponder, UIApplicationDelegate {

    var window: UIWindow?

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {

        print("✅ DCF Fleet Management - Minimal MVP")
        print("✅ NO MOCK DATA - Production First")

        // MARK: - Firebase Initialization
        print("🔥 Initializing Firebase...")

        // Initialize Firebase
        FirebaseManager.shared.configure(application: application)

        // Initialize Push Notifications
        PushNotificationManager.shared.configure(application: application)

        // Initialize Remote Config
        RemoteConfigManager.shared.configure()

        // Log app launch
        AnalyticsManager.shared.logSessionStart()
        AnalyticsManager.shared.logScreenView(screenName: "app_launch", screenClass: "AppDelegate")

        // Request notification permissions (optional, can be triggered later by user action)
        // Uncomment to auto-request on first launch:
        // PushNotificationManager.shared.requestNotificationPermissions()

        print("✅ Firebase initialization complete")

        return true
    }

    // MARK: - Push Notification Handlers

    /// Called when APNS registration succeeds
    func application(_ application: UIApplication, didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data) {
        PushNotificationManager.shared.didRegisterForRemoteNotifications(withDeviceToken: deviceToken)
    }

    /// Called when APNS registration fails
    func application(_ application: UIApplication, didFailToRegisterForRemoteNotificationsWithError error: Error) {
        PushNotificationManager.shared.didFailToRegisterForRemoteNotifications(withError: error)
    }

    /// Handle remote notification in background
    func application(_ application: UIApplication, didReceiveRemoteNotification userInfo: [AnyHashable: Any], fetchCompletionHandler completionHandler: @escaping (UIBackgroundFetchResult) -> Void) {
        print("📬 Remote notification received")

        // Check if this is a silent notification
        if let aps = userInfo["aps"] as? [String: Any], aps["content-available"] as? Int == 1 {
            // Silent notification for background sync
            PushNotificationManager.shared.handleSilentNotification(userInfo, completion: completionHandler)
        } else {
            // Regular notification
            completionHandler(.newData)
        }
    }

    func applicationWillResignActive(_ application: UIApplication) {
        // Sent when the application is about to move from active to inactive state. This can occur for certain types of temporary interruptions (such as an incoming phone call or SMS message) or when the user quits the application and it begins the transition to the background state.
        // Use this method to pause ongoing tasks, disable timers, and invalidate graphics rendering callbacks. Games should use this method to pause the game.
    }

    func applicationDidEnterBackground(_ application: UIApplication) {
        // Use this method to release shared resources, save user data, invalidate timers, and store enough application state information to restore your application to its current state in case it is terminated later.
        // If your application supports background execution, this method is called instead of applicationWillTerminate: when the user quits.

        // Log session end
        AnalyticsManager.shared.logSessionEnd()

        // Clear badge count when app goes to background (optional)
        // PushNotificationManager.shared.clearBadge()
    }

    func applicationWillEnterForeground(_ application: UIApplication) {
        // Called as part of the transition from the background to the active state; here you can undo many of the changes made on entering the background.

        // Refresh remote config if stale
        RemoteConfigManager.shared.refreshIfNeeded()
    }

    func applicationDidBecomeActive(_ application: UIApplication) {
        // Restart any tasks that were paused (or not yet started) while the application was inactive. If the application was previously in the background, optionally refresh the user interface.

        // Log session start
        AnalyticsManager.shared.logSessionStart()

        // Clear badge count when app becomes active
        PushNotificationManager.shared.clearBadge()
    }

    func applicationWillTerminate(_ application: UIApplication) {
        // Called when the application is about to terminate. Save data if appropriate. See also applicationDidEnterBackground:.

        // Log session end
        AnalyticsManager.shared.logSessionEnd()
    }

    func application(_ app: UIApplication, open url: URL, options: [UIApplication.OpenURLOptionsKey: Any] = [:]) -> Bool {
        // Handle URL schemes for the native app
        return true
    }

    func application(_ application: UIApplication, continue userActivity: NSUserActivity, restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void) -> Bool {
        // Handle Universal Links for the native app
        return true
    }

}
