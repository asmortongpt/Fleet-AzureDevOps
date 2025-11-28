//
//  AzureSSOManager.swift
//  Fleet Manager - Azure AD SSO Integration
//
//  Handles Microsoft Azure AD authentication using MSAL
//  Supports Single Sign-On with Capital Tech Alliance Azure tenant
//

import Foundation
import SwiftUI

// MARK: - Azure AD Configuration

struct AzureADConfig {
    // From global .env file
    static let clientId = "baae0851-0c24-4214-8587-e3fabc46bd4a"
    static let tenantId = "0ec14b81-7b82-45ee-8f3d-cbc31ced5347"
    static let redirectUri = "msauth.com.capitaltechalliance.fleetmanagement://auth"

    // Authority URL
    static let authority = "https://login.microsoftonline.com/\(tenantId)"

    // Scopes requested
    static let scopes = [
        "User.Read",
        "email",
        "profile",
        "openid"
    ]
}

// MARK: - Azure SSO Manager

@MainActor
class AzureSSOManager: ObservableObject {
    static let shared = AzureSSOManager()

    @Published var isLoading = false
    @Published var errorMessage: String?

    private init() {}

    // MARK: - SSO Login

    /// Initiate Azure AD SSO login flow
    func loginWithSSO() async -> (success: Bool, user: AuthenticationService.User?, accessToken: String?) {
        isLoading = true
        errorMessage = nil

        defer { isLoading = false }

        // Simulate SSO flow for now (MSAL requires pod install)
        // In production, this would use MSALPublicClientApplication

        do {
            // Simulate network delay
            try await Task.sleep(nanoseconds: 1_500_000_000) // 1.5 seconds

            // For now, return mock success with Azure AD user
            let mockUser = AuthenticationService.User(
                id: 1,
                email: "andrew.m@capitaltechalliance.com",
                name: "Andrew Morton",
                role: "admin",
                organizationId: 1
            )

            let mockToken = generateMockToken()

            return (true, mockUser, mockToken)

        } catch {
            errorMessage = "SSO authentication failed: \(error.localizedDescription)"
            return (false, nil, nil)
        }
    }

    // MARK: - Silent Token Acquisition

    /// Silently acquire token using cached credentials
    func acquireTokenSilently() async -> String? {
        // In production with MSAL:
        // 1. Get account from cache
        // 2. Call acquireTokenSilent
        // 3. Return access token

        return generateMockToken()
    }

    // MARK: - Account Management

    /// Get current signed-in account
    func getCurrentAccount() async -> AzureAccount? {
        // In production: query MSAL for current account
        return AzureAccount(
            username: "andrew.m@capitaltechalliance.com",
            name: "Andrew Morton",
            tenantId: AzureADConfig.tenantId
        )
    }

    /// Sign out from Azure AD
    func signOut() async {
        isLoading = true
        defer { isLoading = false }

        // In production:
        // 1. Remove account from MSAL cache
        // 2. Clear local tokens
        // 3. Optionally call server logout endpoint

        try? await Task.sleep(nanoseconds: 500_000_000)
    }

    // MARK: - Helper Methods

    private func generateMockToken() -> String {
        // Generate a JWT-like mock token for testing
        let header = "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9"
        let payload = Data("""
        {
            "aud": "\(AzureADConfig.clientId)",
            "iss": "https://sts.windows.net/\(AzureADConfig.tenantId)/",
            "iat": \(Int(Date().timeIntervalSince1970)),
            "exp": \(Int(Date().timeIntervalSince1970) + 3600),
            "email": "andrew.m@capitaltechalliance.com",
            "name": "Andrew Morton",
            "oid": "12345678-1234-1234-1234-123456789abc",
            "preferred_username": "andrew.m@capitaltechalliance.com",
            "roles": ["admin"]
        }
        """.utf8).base64EncodedString()
        let signature = "MOCK_SIGNATURE"

        return "\(header).\(payload).\(signature)"
    }
}

// MARK: - Azure Account Model

struct AzureAccount {
    let username: String
    let name: String
    let tenantId: String
}

// MARK: - Production MSAL Implementation Guide

/*

 TO ENABLE REAL AZURE AD SSO:

 1. Add MSAL to Podfile:
    ```
    pod 'MSAL', '~> 1.2'
    ```

 2. Run `pod install`

 3. Update Info.plist with redirect URI:
    ```xml
    <key>CFBundleURLTypes</key>
    <array>
        <dict>
            <key>CFBundleURLSchemes</key>
            <array>
                <string>msauth.com.capitaltechalliance.fleetmanagement</string>
            </array>
        </dict>
    </array>

    <key>LSApplicationQueriesSchemes</key>
    <array>
        <string>msauthv2</string>
        <string>msauthv3</string>
    </array>
    ```

 4. Replace this file's implementation with MSAL SDK calls:

    ```swift
    import MSAL

    @MainActor
    class AzureSSOManager: ObservableObject {
        private var msalApplication: MSALPublicClientApplication?

        init() {
            setupMSAL()
        }

        private func setupMSAL() {
            guard let authorityURL = URL(string: AzureADConfig.authority) else { return }

            let msalConfiguration = MSALPublicClientApplicationConfig(
                clientId: AzureADConfig.clientId,
                redirectUri: AzureADConfig.redirectUri,
                authority: try? MSALAADAuthority(url: authorityURL)
            )

            msalApplication = try? MSALPublicClientApplication(configuration: msalConfiguration)
        }

        func loginWithSSO() async -> (success: Bool, user: AuthenticationService.User?, accessToken: String?) {
            guard let application = msalApplication else {
                errorMessage = "MSAL not configured"
                return (false, nil, nil)
            }

            let webViewParameters = MSALWebviewParameters(authPresentationViewController: getRootViewController())
            let interactiveParameters = MSALInteractiveTokenParameters(
                scopes: AzureADConfig.scopes,
                webviewParameters: webViewParameters
            )

            do {
                let result = try await application.acquireToken(with: interactiveParameters)
                let user = parseUserFromToken(result)
                return (true, user, result.accessToken)
            } catch {
                errorMessage = error.localizedDescription
                return (false, nil, nil)
            }
        }

        func acquireTokenSilently() async -> String? {
            guard let application = msalApplication,
                  let account = try? application.allAccounts().first else {
                return nil
            }

            let parameters = MSALSilentTokenParameters(scopes: AzureADConfig.scopes, account: account)

            do {
                let result = try await application.acquireTokenSilent(with: parameters)
                return result.accessToken
            } catch {
                return nil
            }
        }
    }
    ```

 5. Configure Azure AD App Registration:
    - Go to Azure Portal → Azure Active Directory → App registrations
    - Select app: baae0851-0c24-4214-8587-e3fabc46bd4a
    - Add Redirect URI: msauth.com.capitaltechalliance.fleetmanagement://auth
    - Enable "Public client flows" under Authentication
    - Add API permissions: User.Read, email, profile, openid

 6. Test SSO flow:
    - Tapping "Sign in with Microsoft" should open browser
    - User authenticates with @capitaltechalliance.com account
    - App receives token and user info
    - User is logged into Fleet Manager

 */
