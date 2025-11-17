import Foundation
import SwiftUI

// MARK: - Supported Languages
public enum SupportedLanguage: String, CaseIterable, Codable {
    case english = "en"
    case spanish = "es"
    case french = "fr"
    case german = "de"
    case chinese = "zh"
    case japanese = "ja"

    public var displayName: String {
        switch self {
        case .english: return "English"
        case .spanish: return "Español"
        case .french: return "Français"
        case .german: return "Deutsch"
        case .chinese: return "中文"
        case .japanese: return "日本語"
        }
    }

    public var locale: Locale {
        return Locale(identifier: rawValue)
    }
}

// MARK: - Localization Manager
/// Manages app localization with proper @MainActor isolation for SwiftUI integration
@MainActor
public class LocalizationManager: ObservableObject {

    // MARK: - Singleton
    public static let shared = LocalizationManager()

    // MARK: - Published Properties
    @Published public private(set) var currentLanguage: SupportedLanguage
    @Published public private(set) var isRTL: Bool = false

    // MARK: - Properties
    private let userDefaultsKey = "app_language"
    private var localizedStrings: [String: [String: String]] = [:]

    // MARK: - Initialization
    private init() {
        // Load saved language or use system default
        if let savedLanguageCode = UserDefaults.standard.string(forKey: userDefaultsKey),
           let savedLanguage = SupportedLanguage(rawValue: savedLanguageCode) {
            self.currentLanguage = savedLanguage
        } else {
            // Try to match system language
            let systemLanguageCode = Locale.preferredLanguages.first?.prefix(2) ?? "en"
            self.currentLanguage = SupportedLanguage(rawValue: String(systemLanguageCode)) ?? .english
        }

        self.isRTL = checkIfRTL(language: currentLanguage)

        // Load localized strings
        loadLocalizedStrings()
    }

    // MARK: - Public Methods

    /// Change the current language
    /// - Parameter language: The language to switch to
    public func setLanguage(_ language: SupportedLanguage) {
        guard language != currentLanguage else { return }

        currentLanguage = language
        isRTL = checkIfRTL(language: language)

        // Save preference
        UserDefaults.standard.set(language.rawValue, forKey: userDefaultsKey)

        // Reload strings
        loadLocalizedStrings()

        // Post notification for UI updates
        NotificationCenter.default.post(name: .languageDidChange, object: nil)

        print("🌐 LocalizationManager: Language changed to \(language.displayName)")
    }

    /// Get localized string for a key
    /// - Parameters:
    ///   - key: The localization key
    ///   - comment: Optional comment (for documentation)
    /// - Returns: Localized string or the key if not found
    public func localizedString(forKey key: String, comment: String = "") -> String {
        // First try to get from loaded strings
        if let languageStrings = localizedStrings[currentLanguage.rawValue],
           let localizedValue = languageStrings[key] {
            return localizedValue
        }

        // Fallback to NSLocalizedString
        let bundle = Bundle.main
        let localizedValue = bundle.localizedString(forKey: key, value: nil, table: nil)

        // If still not found, return the key itself
        return localizedValue != key ? localizedValue : key
    }

    /// Get localized string with format arguments
    /// - Parameters:
    ///   - key: The localization key
    ///   - arguments: Format arguments
    /// - Returns: Formatted localized string
    public func localizedString(forKey key: String, arguments: CVarArg...) -> String {
        let format = localizedString(forKey: key)
        return String(format: format, arguments: arguments)
    }

    /// Get current locale
    /// - Returns: Current locale based on selected language
    public func getCurrentLocale() -> Locale {
        return currentLanguage.locale
    }

    /// Get all supported languages
    /// - Returns: Array of supported languages
    public func getSupportedLanguages() -> [SupportedLanguage] {
        return SupportedLanguage.allCases
    }

    /// Check if current language is RTL
    /// - Returns: True if RTL, false otherwise
    public func isRightToLeft() -> Bool {
        return isRTL
    }

    // MARK: - Private Methods

    private func checkIfRTL(language: SupportedLanguage) -> Bool {
        // Add RTL languages here (Arabic, Hebrew, etc.)
        // Currently none of our supported languages are RTL
        return false
    }

    private func loadLocalizedStrings() {
        // In a production app, this would load from JSON files or a remote server
        // For now, we'll use a simple in-memory dictionary

        localizedStrings = [
            "en": loadEnglishStrings(),
            "es": loadSpanishStrings(),
            "fr": loadFrenchStrings(),
            "de": loadGermanStrings(),
            "zh": loadChineseStrings(),
            "ja": loadJapaneseStrings()
        ]
    }

    // MARK: - String Loading Methods

    private func loadEnglishStrings() -> [String: String] {
        return [
            "app_name": "Fleet Manager",
            "dashboard": "Dashboard",
            "vehicles": "Vehicles",
            "maintenance": "Maintenance",
            "reports": "Reports",
            "settings": "Settings",
            "login": "Login",
            "logout": "Logout",
            "welcome": "Welcome",
            "loading": "Loading...",
            "error": "Error",
            "success": "Success",
            "cancel": "Cancel",
            "save": "Save",
            "delete": "Delete",
            "edit": "Edit",
            "add": "Add",
            "search": "Search",
            "filter": "Filter",
            "sort": "Sort",
            "no_data": "No data available",
            "refresh": "Refresh"
        ]
    }

    private func loadSpanishStrings() -> [String: String] {
        return [
            "app_name": "Administrador de Flota",
            "dashboard": "Panel de Control",
            "vehicles": "Vehículos",
            "maintenance": "Mantenimiento",
            "reports": "Informes",
            "settings": "Configuración",
            "login": "Iniciar Sesión",
            "logout": "Cerrar Sesión",
            "welcome": "Bienvenido",
            "loading": "Cargando...",
            "error": "Error",
            "success": "Éxito",
            "cancel": "Cancelar",
            "save": "Guardar",
            "delete": "Eliminar",
            "edit": "Editar",
            "add": "Agregar",
            "search": "Buscar",
            "filter": "Filtrar",
            "sort": "Ordenar",
            "no_data": "No hay datos disponibles",
            "refresh": "Actualizar"
        ]
    }

    private func loadFrenchStrings() -> [String: String] {
        return [
            "app_name": "Gestionnaire de Flotte",
            "dashboard": "Tableau de Bord",
            "vehicles": "Véhicules",
            "maintenance": "Maintenance",
            "reports": "Rapports",
            "settings": "Paramètres",
            "login": "Connexion",
            "logout": "Déconnexion",
            "welcome": "Bienvenue",
            "loading": "Chargement...",
            "error": "Erreur",
            "success": "Succès",
            "cancel": "Annuler",
            "save": "Enregistrer",
            "delete": "Supprimer",
            "edit": "Modifier",
            "add": "Ajouter",
            "search": "Rechercher",
            "filter": "Filtrer",
            "sort": "Trier",
            "no_data": "Aucune donnée disponible",
            "refresh": "Actualiser"
        ]
    }

    private func loadGermanStrings() -> [String: String] {
        return [
            "app_name": "Flottenmanager",
            "dashboard": "Dashboard",
            "vehicles": "Fahrzeuge",
            "maintenance": "Wartung",
            "reports": "Berichte",
            "settings": "Einstellungen",
            "login": "Anmelden",
            "logout": "Abmelden",
            "welcome": "Willkommen",
            "loading": "Laden...",
            "error": "Fehler",
            "success": "Erfolg",
            "cancel": "Abbrechen",
            "save": "Speichern",
            "delete": "Löschen",
            "edit": "Bearbeiten",
            "add": "Hinzufügen",
            "search": "Suchen",
            "filter": "Filtern",
            "sort": "Sortieren",
            "no_data": "Keine Daten verfügbar",
            "refresh": "Aktualisieren"
        ]
    }

    private func loadChineseStrings() -> [String: String] {
        return [
            "app_name": "车队管理器",
            "dashboard": "仪表板",
            "vehicles": "车辆",
            "maintenance": "维护",
            "reports": "报告",
            "settings": "设置",
            "login": "登录",
            "logout": "登出",
            "welcome": "欢迎",
            "loading": "加载中...",
            "error": "错误",
            "success": "成功",
            "cancel": "取消",
            "save": "保存",
            "delete": "删除",
            "edit": "编辑",
            "add": "添加",
            "search": "搜索",
            "filter": "筛选",
            "sort": "排序",
            "no_data": "无数据",
            "refresh": "刷新"
        ]
    }

    private func loadJapaneseStrings() -> [String: String] {
        return [
            "app_name": "フリートマネージャー",
            "dashboard": "ダッシュボード",
            "vehicles": "車両",
            "maintenance": "メンテナンス",
            "reports": "レポート",
            "settings": "設定",
            "login": "ログイン",
            "logout": "ログアウト",
            "welcome": "ようこそ",
            "loading": "読み込み中...",
            "error": "エラー",
            "success": "成功",
            "cancel": "キャンセル",
            "save": "保存",
            "delete": "削除",
            "edit": "編集",
            "add": "追加",
            "search": "検索",
            "filter": "フィルター",
            "sort": "並べ替え",
            "no_data": "データがありません",
            "refresh": "更新"
        ]
    }
}

// MARK: - Notification Name Extension
extension Notification.Name {
    static let languageDidChange = Notification.Name("languageDidChange")
}

// MARK: - String Extension for Convenience
@MainActor
extension String {
    /// Get localized version of the string
    public var localized: String {
        return LocalizationManager.shared.localizedString(forKey: self)
    }

    /// Get localized version with format arguments
    public func localized(arguments: CVarArg...) -> String {
        let format = LocalizationManager.shared.localizedString(forKey: self)
        return String(format: format, arguments: arguments)
    }
}
