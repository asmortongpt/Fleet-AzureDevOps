import { logger } from '@/utils/logger';

/**
 * Azure Active Directory Single Sign-On Configuration
 * CTAFleet Production Authentication System
 */

import { Configuration, PublicClientApplication, LogLevel, AccountInfo } from '@azure/msal-browser';
import { AuthenticationResult } from '@azure/msal-common';

// MSAL Configuration
export const msalConfig: Configuration = {
  auth: {
    clientId: process.env.REACT_APP_AZURE_AD_CLIENT_ID || '4c8641fa-3a56-448f-985a-e763017d70d7',
    authority: process.env.REACT_APP_AZURE_AD_AUTHORITY || 'https://login.microsoftonline.com/0ec14b81-7b82-45ee-8f3d-cbc31ced5347',
    redirectUri: process.env.REACT_APP_AZURE_AD_REDIRECT_URI || window.location.origin + '/auth/callback',
    postLogoutRedirectUri: window.location.origin,
    navigateToLoginRequestUrl: true
  },
  cache: {
    cacheLocation: 'sessionStorage', // More secure than localStorage
    storeAuthStateInCookie: true, // Set to true for IE11/Edge support
    secureCookies: true
  },
  system: {
    loggerOptions: {
      loggerCallback: (level: LogLevel, message: string, containsPii: boolean) => {
        if (containsPii) return;
        switch (level) {
          case LogLevel.Error:
            logger.error(message);
            break;
          case LogLevel.Info:
            logger.info(message);
            break;
          case LogLevel.Verbose:
            console.debug(message);
            break;
          case LogLevel.Warning:
            logger.warn(message);
            break;
        }
      },
      piiLoggingEnabled: false
    },
    windowHashTimeout: 60000,
    iframeHashTimeout: 6000,
    loadFrameTimeout: 0,
    asyncPopups: false
  }
};

// MSAL Instance
export const msalInstance = new PublicClientApplication(msalConfig);

// Login Request Configuration
export const loginRequest = {
  scopes: ['openid', 'profile', 'email', 'User.Read'],
  prompt: 'select_account'
};

// Graph API Request Configuration
export const graphConfig = {
  graphMeEndpoint: 'https://graph.microsoft.com/v1.0/me',
  graphPhotoEndpoint: 'https://graph.microsoft.com/v1.0/me/photo/$value',
  graphGroupsEndpoint: 'https://graph.microsoft.com/v1.0/me/memberOf'
};

// Role Mapping
export const roleMapping = {
  'Fleet Administrator': 'admin',
  'Fleet Manager': 'manager',
  'Fleet Operator': 'operator',
  'Fleet Viewer': 'viewer'
};

// User Profile Interface
export interface UserProfile {
  id: string;
  displayName: string;
  email: string;
  jobTitle?: string;
  department?: string;
  officeLocation?: string;
  mobilePhone?: string;
  photo?: string;
  roles: string[];
  permissions: string[];
}

// Authentication Service
export class AzureAuthService {
  private static instance: AzureAuthService;
  private account: AccountInfo | null = null;
  private userProfile: UserProfile | null = null;

  private constructor() {
    this.initialize();
  }

  public static getInstance(): AzureAuthService {
    if (!AzureAuthService.instance) {
      AzureAuthService.instance = new AzureAuthService();
    }
    return AzureAuthService.instance;
  }

  private async initialize(): Promise<void> {
    try {
      // Handle redirect promise
      const response = await msalInstance.handleRedirectPromise();
      if (response) {
        this.handleResponse(response);
      }

      // Check if user is already signed in
      const accounts = msalInstance.getAllAccounts();
      if (accounts.length > 0) {
        this.account = accounts[0];
        msalInstance.setActiveAccount(this.account);
        await this.loadUserProfile();
      }
    } catch (error) {
      logger.error('Azure Auth initialization error:', error);
    }
  }

  public async login(): Promise<void> {
    try {
      const response = await msalInstance.loginPopup(loginRequest);
      this.handleResponse(response);
    } catch (error) {
      logger.error('Login error:', error);
      // Fallback to redirect if popup blocked
      await msalInstance.loginRedirect(loginRequest);
    }
  }

  public async logout(): Promise<void> {
    try {
      const logoutRequest = {
        account: msalInstance.getActiveAccount(),
        postLogoutRedirectUri: window.location.origin
      };
      await msalInstance.logoutPopup(logoutRequest);
      this.account = null;
      this.userProfile = null;
    } catch (error) {
      logger.error('Logout error:', error);
      // Fallback to redirect
      await msalInstance.logoutRedirect();
    }
  }

  private handleResponse(response: AuthenticationResult): void {
    if (response && response.account) {
      this.account = response.account;
      msalInstance.setActiveAccount(response.account);
      this.loadUserProfile();
    }
  }

  private async loadUserProfile(): Promise<void> {
    if (!this.account) return;

    try {
      // Get access token for Graph API
      const tokenResponse = await this.getToken(['User.Read']);
      if (!tokenResponse) return;

      // Fetch user profile
      const profileResponse = await fetch(graphConfig.graphMeEndpoint, {
        headers: {
          Authorization: `Bearer ${tokenResponse.accessToken}`
        }
      });

      if (profileResponse.ok) {
        const profileData = await profileResponse.json();

        // Fetch user photo
        let photo: string | undefined;
        try {
          const photoResponse = await fetch(graphConfig.graphPhotoEndpoint, {
            headers: {
              Authorization: `Bearer ${tokenResponse.accessToken}`
            }
          });
          if (photoResponse.ok) {
            const blob = await photoResponse.blob();
            photo = URL.createObjectURL(blob);
          }
        } catch {
          // Photo might not exist
        }

        // Fetch user groups for role mapping
        const groupsResponse = await fetch(graphConfig.graphGroupsEndpoint, {
          headers: {
            Authorization: `Bearer ${tokenResponse.accessToken}`
          }
        });

        let roles: string[] = ['viewer']; // Default role
        let permissions: string[] = [];

        if (groupsResponse.ok) {
          const groupsData = await groupsResponse.json();
          roles = this.mapGroupsToRoles(groupsData.value);
          permissions = this.generatePermissions(roles);
        }

        this.userProfile = {
          id: profileData.id,
          displayName: profileData.displayName,
          email: profileData.mail || profileData.userPrincipalName,
          jobTitle: profileData.jobTitle,
          department: profileData.department,
          officeLocation: profileData.officeLocation,
          mobilePhone: profileData.mobilePhone,
          photo,
          roles,
          permissions
        };
      }
    } catch (error) {
      logger.error('Error loading user profile:', error);
    }
  }

  private mapGroupsToRoles(groups: any[]): string[] {
    const roles = new Set<string>(['viewer']); // Everyone gets viewer role

    groups.forEach(group => {
      if (group.displayName && roleMapping[group.displayName]) {
        roles.add(roleMapping[group.displayName]);
      }
    });

    return Array.from(roles);
  }

  private generatePermissions(roles: string[]): string[] {
    const permissions = new Set<string>();

    // Base permissions for all authenticated users
    permissions.add('view:dashboard');
    permissions.add('view:vehicles');
    permissions.add('view:reports');

    if (roles.includes('operator')) {
      permissions.add('edit:vehicle-status');
      permissions.add('create:fuel-records');
      permissions.add('create:inspection-reports');
      permissions.add('view:assignments');
    }

    if (roles.includes('manager')) {
      permissions.add('edit:vehicles');
      permissions.add('create:vehicles');
      permissions.add('edit:drivers');
      permissions.add('create:maintenance-schedules');
      permissions.add('view:analytics');
      permissions.add('export:reports');
    }

    if (roles.includes('admin')) {
      permissions.add('admin:all');
      permissions.add('delete:vehicles');
      permissions.add('edit:users');
      permissions.add('edit:settings');
      permissions.add('view:audit-logs');
      permissions.add('manage:compliance');
    }

    return Array.from(permissions);
  }

  public async getToken(scopes?: string[]): Promise<AuthenticationResult | null> {
    if (!this.account) return null;

    const request = {
      scopes: scopes || loginRequest.scopes,
      account: this.account
    };

    try {
      // Try silent token acquisition
      const response = await msalInstance.acquireTokenSilent(request);
      return response;
    } catch (error) {
      logger.error('Silent token acquisition failed, acquiring via popup', error);
      try {
        const response = await msalInstance.acquireTokenPopup(request);
        return response;
      } catch (popupError) {
        logger.error('Token acquisition failed', popupError);
        return null;
      }
    }
  }

  public isAuthenticated(): boolean {
    return !!this.account;
  }

  public getAccount(): AccountInfo | null {
    return this.account;
  }

  public getUserProfile(): UserProfile | null {
    return this.userProfile;
  }

  public hasRole(role: string): boolean {
    return this.userProfile?.roles.includes(role) || false;
  }

  public hasPermission(permission: string): boolean {
    return this.userProfile?.permissions.includes(permission) ||
           this.userProfile?.permissions.includes('admin:all') || false;
  }

  public async refreshToken(): Promise<void> {
    if (!this.account) return;

    try {
      await this.getToken();
    } catch (error) {
      logger.error('Token refresh failed:', error);
      // Force re-authentication
      await this.login();
    }
  }

  // Session management
  public startSessionTimeout(timeoutMinutes: number = 30): void {
    let timeoutId: NodeJS.Timeout;

    const resetTimeout = () => {
      if (timeoutId) clearTimeout(timeoutId);

      timeoutId = setTimeout(async () => {
        logger.warn('Session timeout - logging out');
        await this.logout();
      }, timeoutMinutes * 60 * 1000);
    };

    // Reset timeout on user activity
    ['mousedown', 'keypress', 'scroll', 'touchstart'].forEach(event => {
      document.addEventListener(event, resetTimeout, true);
    });

    resetTimeout();
  }
}

// Export singleton instance
export const authService = AzureAuthService.getInstance();