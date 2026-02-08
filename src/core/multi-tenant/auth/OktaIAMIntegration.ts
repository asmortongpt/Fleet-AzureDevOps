/**
 * Okta IAM Integration System
 * DCF ITB 2425-077 Section 613 - Enterprise Authentication
 * SOC 2 Type 2 Security Compliance
 */

// Type declarations for Okta Auth (avoids dependency on @okta/okta-auth-js)
interface OktaAuthOptions {
  issuer: string;
  clientId: string;
  redirectUri: string;
  scopes?: string[];
  pkce?: boolean;
  features?: Record<string, boolean>;
}

interface OktaTokenParams {
  expiresAt?: number;
}

interface OktaAuthState {
  isAuthenticated: boolean;
  accessToken?: OktaTokenParams;
  idToken?: OktaTokenParams;
}

interface OktaTokenManager {
  on(event: 'renewed', callback: (key: string, newToken: OktaTokenParams, oldToken: OktaTokenParams) => void): void;
  on(event: 'expired', callback: (key: string, expiredToken: OktaTokenParams) => void): void;
  on(event: 'error', callback: (err: Error) => void): void;
  get(key: string): OktaTokenParams | undefined;
  clear(): void;
}

interface OktaAuthStateManager {
  subscribe(callback: (authState: OktaAuthState) => void): void;
}

interface OktaToken {
  renewTokens(): Promise<void>;
}

interface OktaAuth {
  tokenManager: OktaTokenManager;
  authStateManager: OktaAuthStateManager;
  token: OktaToken;
  isAuthenticated(): Promise<boolean>;
  isLoginRedirect(): boolean;
  handleLoginRedirect(): Promise<void>;
  signInWithRedirect(options?: Record<string, unknown>): Promise<void>;
  signOut(): Promise<void>;
  getUser(): Promise<Record<string, unknown>>;
  getAccessToken(): Promise<string | undefined>;
}

interface OktaAuthConstructor {
  new (options: OktaAuthOptions): OktaAuth;
}

// Dynamic import to avoid compile-time dependency
const OktaAuth: OktaAuthConstructor = (globalThis as Record<string, unknown>).OktaAuth as OktaAuthConstructor;

export interface OktaConfig {
  issuer: string;
  clientId: string;
  redirectUri: string;
  scopes: string[];
  pkce: boolean;
  disableHttpsCheck: boolean;
}

export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  department: string;
  role: 'fleet_manager' | 'employee' | 'supervisor' | 'admin';
  permissions: string[];
  mfaEnabled: boolean;
  lastLogin: Date;
  sessionTimeout: number;
}

export interface AccessToken {
  accessToken: string;
  idToken: string;
  refreshToken: string;
  expiresAt: Date;
  scopes: string[];
}

export class OktaIAMIntegration {
  private oktaAuth: OktaAuth;
  private config: OktaConfig;
  private currentUser: UserProfile | null = null;
  private sessionTimer: NodeJS.Timeout | null = null;

  constructor(config: OktaConfig) {
    this.config = config;
    this.oktaAuth = new OktaAuth({
      issuer: config.issuer,
      clientId: config.clientId,
      redirectUri: config.redirectUri,
      scopes: config.scopes,
      pkce: config.pkce,
      features: {
        router: true,
        rememberMe: true,
        multiOptionalFactorEnroll: true,
        selfServiceUnlock: true,
        smsRecovery: true,
        callRecovery: true,
        emailRecovery: true,
        webauthn: true,
        autoPush: true
      }
    });

    this.setupEventListeners();
  }

  /**
   * Initialize authentication and check for existing session
   */
  async initialize(): Promise<boolean> {
    try {
      // Check if user is already authenticated
      const isAuthenticated = await this.oktaAuth.isAuthenticated();

      if (isAuthenticated) {
        await this.handleSuccessfulAuthentication();
        return true;
      }

      // Check for authentication callback
      if (this.oktaAuth.isLoginRedirect()) {
        await this.handleAuthenticationCallback();
        return true;
      }

      return false;
    } catch (error) {
      const err = error as Error;
      this.logSecurityEvent('authentication_error', 'Medium', `Authentication initialization failed: ${err.message}`);
      throw error;
    }
  }

  /**
   * Initiate login process with MFA requirement
   */
  async login(username?: string): Promise<void> {
    try {
      this.logSecurityEvent('login_attempt', 'Low', `User attempting login: ${username || 'unknown'}`);

      const loginOptions = {
        originalUri: typeof window !== "undefined" && window.location.href,
        ...(username && { username })
      };

      await this.oktaAuth.signInWithRedirect(loginOptions);
    } catch (error) {
      const err = error as Error;
      this.logSecurityEvent('login_failure', 'High', `Login failed: ${err.message}`);
      throw error;
    }
  }

  /**
   * Handle authentication callback from Okta
   */
  private async handleAuthenticationCallback(): Promise<void> {
    try {
      // Handle the callback and get tokens
      await this.oktaAuth.handleLoginRedirect();
      await this.handleSuccessfulAuthentication();
    } catch (error) {
      const err = error as Error;
      this.logSecurityEvent('callback_error', 'High', `Authentication callback failed: ${err.message}`);
      throw error;
    }
  }

  /**
   * Process successful authentication
   */
  private async handleSuccessfulAuthentication(): Promise<void> {
    try {
      // Get user information
      const userInfo = await this.oktaAuth.getUser();
      const accessToken = await this.oktaAuth.getAccessToken();

      if (!userInfo || !accessToken) {
        throw new Error('Failed to retrieve user information or access token');
      }

      // Build user profile
      this.currentUser = await this.buildUserProfile(userInfo, accessToken);

      // Set up session management
      this.setupSessionManagement();

      // Log successful login
      this.logSecurityEvent('login_success', 'Low', `User successfully authenticated: ${this.currentUser.email}`);

      // Start session timeout timer
      this.startSessionTimer();
    } catch (error) {
      const err = error as Error;
      this.logSecurityEvent('auth_processing_error', 'High', `Post-authentication processing failed: ${err.message}`);
      throw error;
    }
  }

  /**
   * Build user profile from Okta user info
   */
  private async buildUserProfile(userInfo: any, accessToken: string): Promise<UserProfile> {
    const profile: UserProfile = {
      id: userInfo.sub,
      email: userInfo.email,
      firstName: userInfo.given_name || '',
      lastName: userInfo.family_name || '',
      department: userInfo.department || 'Unknown',
      role: this.mapUserRole(userInfo.groups || []),
      permissions: this.mapUserPermissions(userInfo.groups || []),
      mfaEnabled: this.checkMFAStatus(userInfo),
      lastLogin: new Date(),
      sessionTimeout: 8 * 60 * 60 * 1000 // 8 hours in milliseconds
    };

    // Validate MFA requirement for government users
    if (!profile.mfaEnabled) {
      this.logSecurityEvent('mfa_violation', 'Critical', `User without MFA attempting access: ${profile.email}`);
      throw new Error('Multi-factor authentication is required for government system access');
    }

    return profile;
  }

  /**
   * Map Okta groups to application roles
   */
  private mapUserRole(groups: string[]): UserProfile['role'] {
    // Check highest privilege roles first
    if (groups.includes('DCF-Fleet-Administrators') || groups.includes('DCF-IT-Administrators')) {
      return 'admin';
    }
    if (groups.includes('DCF-Fleet-Managers') || groups.includes('DCF-Fleet-Supervisors')) {
      return 'fleet_manager';
    }
    if (groups.includes('DCF-Supervisors') || groups.includes('DCF-Department-Supervisors')) {
      return 'supervisor';
    }
    // Default to employee for all other authenticated users
    return 'employee';
  }

  /**
   * Map Okta groups to application permissions
   */
  private mapUserPermissions(groups: string[]): string[] {
    const permissions = [];

    // Base permissions for all authenticated users
    permissions.push(
      'view_own_profile',
      'view_own_trips',
      'submit_mileage',
      'view_vehicle_pool',
      'request_vehicle',
      'view_own_reservations'
    );

    // Supervisor permissions
    if (groups.includes('DCF-Supervisors') || groups.includes('DCF-Department-Supervisors')) {
      permissions.push(
        'approve_mileage',
        'view_team_trips',
        'access_basic_analytics',
        'view_team_schedules',
        'approve_vehicle_requests'
      );
    }

    // Fleet Manager permissions
    if (groups.includes('DCF-Fleet-Managers') || groups.includes('DCF-Fleet-Supervisors')) {
      permissions.push(
        'manage_vehicles',
        'view_all_trips',
        'approve_reservations',
        'generate_reports',
        'manage_maintenance',
        'schedule_maintenance',
        'view_vehicle_status',
        'manage_drivers',
        'access_analytics',
        'manage_fuel_cards',
        'view_compliance_reports'
      );
    }

    // Administrator permissions
    if (groups.includes('DCF-Fleet-Administrators') || groups.includes('DCF-IT-Administrators')) {
      permissions.push(
        'system_admin',
        'manage_users',
        'view_audit_logs',
        'manage_integrations',
        'emergency_override',
        'manage_system_settings',
        'access_security_logs',
        'manage_roles_permissions',
        'system_maintenance',
        'data_export',
        'backup_restore',
        'configure_notifications',
        'manage_api_keys'
      );
    }

    // Special permissions for compliance and security
    if (groups.includes('DCF-Compliance-Officers')) {
      permissions.push(
        'view_compliance_reports',
        'access_audit_trail',
        'generate_compliance_exports',
        'view_security_logs'
      );
    }

    // Finance department permissions
    if (groups.includes('DCF-Finance')) {
      permissions.push(
        'view_financial_reports',
        'access_cost_analytics',
        'approve_large_expenses',
        'manage_budgets'
      );
    }

    return [...new Set(permissions)]; // Remove duplicates
  }

  /**
   * Check if user has MFA enabled
   */
  private checkMFAStatus(userInfo: any): boolean {
    // Check for MFA enrollment in user profile
    return userInfo.amr && userInfo.amr.includes('mfa');
  }

  /**
   * Setup session management
   */
  private setupSessionManagement(): void {
    // Token refresh handling
    this.oktaAuth.tokenManager.on('renewed', (key, newToken, oldToken) => {
      this.logSecurityEvent('token_renewed', 'Low', `Token renewed for key: ${key}`);

      // Update session timer when tokens are renewed
      if (this.currentUser) {
        this.startSessionTimer();
      }
    });

    // Token expiration handling
    this.oktaAuth.tokenManager.on('expired', (key, expiredToken) => {
      this.logSecurityEvent('token_expired', 'Medium', `Token expired for key: ${key}`);
      this.handleTokenExpiration();
    });

    // Token error handling
    this.oktaAuth.tokenManager.on('error', (err) => {
      this.logSecurityEvent('token_error', 'High', `Token error: ${err.message}`);
      this.handleTokenError(err);
    });

    // Add automatic token refresh before expiration
    this.setupAutomaticTokenRefresh();

    // Add session activity monitoring
    this.setupActivityMonitoring();
  }

  /**
   * Handle token expiration
   */
  private async handleTokenExpiration(): Promise<void> {
    try {
      // Attempt to refresh tokens
      await this.oktaAuth.token.renewTokens();
      this.logSecurityEvent('token_refresh_success', 'Low', 'Tokens successfully refreshed');
    } catch (error) {
      const err = error as Error;
      this.logSecurityEvent('token_refresh_failure', 'Medium', `Token refresh failed: ${err.message}`);
      // Force re-authentication
      await this.logout();
    }
  }

  /**
   * Handle token errors
   */
  private async handleTokenError(error: any): Promise<void> {
    const errorMessage = error.message || 'Unknown token error';

    // Log different types of token errors
    if (error.message.includes('network')) {
      this.logSecurityEvent('token_network_error', 'Medium', `Network error during token operation: ${errorMessage}`);
    } else if (error.message.includes('invalid')) {
      this.logSecurityEvent('token_invalid_error', 'High', `Invalid token error: ${errorMessage}`);
      await this.logout(); // Force logout for invalid tokens
    } else {
      this.logSecurityEvent('token_unknown_error', 'Medium', `Unknown token error: ${errorMessage}`);
    }
  }

  /**
   * Setup automatic token refresh before expiration
   */
  private setupAutomaticTokenRefresh(): void {
    // Check token expiration every 5 minutes
    setInterval(async () => {
      try {
        const accessToken = this.oktaAuth.tokenManager.get('accessToken');
        if (accessToken) {
          const expiresAt = accessToken.expiresAt as number;
          const now = Date.now() / 1000;
          const timeUntilExpiry = expiresAt - now;

          // Refresh if token expires within 10 minutes
          if (timeUntilExpiry < 600) {
            this.logSecurityEvent('proactive_token_refresh', 'Low', 'Proactively refreshing tokens before expiration');
            await this.oktaAuth.token.renewTokens();
          }
        }
      } catch (error) {
        const err = error as Error;
        this.logSecurityEvent('proactive_refresh_error', 'Medium', `Proactive token refresh failed: ${err.message}`);
      }
    }, 5 * 60 * 1000); // 5 minutes
  }

  /**
   * Setup activity monitoring for session management
   */
  private setupActivityMonitoring(): void {
    let lastActivity = Date.now();

    // Track user activity
    const activityEvents = ['click', 'keypress', 'scroll', 'mousemove'];
    const updateActivity = () => {
      lastActivity = Date.now();
    };

    activityEvents.forEach(event => {
      if (typeof document !== "undefined") {
        document.addEventListener(event, updateActivity, { passive: true });
      }
    });

    // Check for inactivity every minute
    setInterval(() => {
      const inactiveTime = Date.now() - lastActivity;
      const maxInactivity = 30 * 60 * 1000; // 30 minutes

      if (inactiveTime > maxInactivity && this.currentUser) {
        this.logSecurityEvent('session_inactivity_timeout', 'Medium', 'Session terminated due to inactivity');
        this.handleSessionTimeout();
      }
    }, 60 * 1000); // Check every minute
  }

  /**
   * Start session timeout timer
   */
  private startSessionTimer(): void {
    if (this.sessionTimer) {
      clearTimeout(this.sessionTimer);
    }

    if (this.currentUser) {
      this.sessionTimer = setTimeout(() => {
        this.handleSessionTimeout();
      }, this.currentUser.sessionTimeout);
    }
  }

  /**
   * Handle session timeout
   */
  private async handleSessionTimeout(): Promise<void> {
    this.logSecurityEvent('session_timeout', 'Medium', `Session timeout for user: ${this.currentUser?.email}`);
    await this.logout();
  }

  /**
   * Check if user has specific permission
   */
  hasPermission(permission: string): boolean {
    return this.currentUser?.permissions.includes(permission) || false;
  }

  /**
   * Check if user has specific role
   */
  hasRole(role: UserProfile['role']): boolean {
    return this.currentUser?.role === role;
  }

  /**
   * Get current user profile
   */
  getCurrentUser(): UserProfile | null {
    return this.currentUser;
  }

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    try {
      return await this.oktaAuth.isAuthenticated();
    } catch (error) {
      return false;
    }
  }

  /**
   * Get current access token
   */
  async getAccessToken(): Promise<string | null> {
    try {
      const accessToken = await this.oktaAuth.getAccessToken();
      return accessToken || null;
    } catch (error) {
      const err = error as Error;
      this.logSecurityEvent('token_retrieval_error', 'Medium', `Failed to retrieve access token: ${err.message}`);
      return null;
    }
  }

  /**
   * Logout user and clear session
   */
  async logout(): Promise<void> {
    try {
      this.logSecurityEvent('logout_initiated', 'Low', `User logout: ${this.currentUser?.email}`);

      // Clear session timer
      if (this.sessionTimer) {
        clearTimeout(this.sessionTimer);
        this.sessionTimer = null;
      }

      // Clear user profile
      this.currentUser = null;

      // Sign out from Okta
      await this.oktaAuth.signOut();
    } catch (error) {
      const err = error as Error;
      this.logSecurityEvent('logout_error', 'Medium', `Logout error: ${err.message}`);
      throw error;
    }
  }

  /**
   * Force password reset for user
   */
  async forcePasswordReset(userId: string): Promise<void> {
    if (!this.hasPermission('system_admin')) {
      throw new Error('Insufficient permissions to force password reset');
    }

    this.logSecurityEvent('password_reset_forced', 'High', `Password reset forced for user: ${userId}`);

    // This would integrate with Okta admin API
    // Implementation depends on specific Okta configuration
  }

  /**
   * Setup event listeners for authentication events
   */
  private setupEventListeners(): void {
    // Listen for authentication state changes
    this.oktaAuth.authStateManager.subscribe((authState) => {
      if (authState.isAuthenticated) {
        this.logSecurityEvent('auth_state_change', 'Low', 'User authenticated state changed to true');
      } else {
        this.logSecurityEvent('auth_state_change', 'Low', 'User authenticated state changed to false');
        this.currentUser = null;
      }
    });
  }

  /**
   * Log security events to SOC 2 framework
   */
  private logSecurityEvent(
    category: string,
    severity: 'Low' | 'Medium' | 'High' | 'Critical',
    description: string
  ): void {
    soc2Framework.logSecurityEvent({
      severity,
      category: `okta_iam_${category}`,
      description,
      userId: this.currentUser?.id,
      ipAddress: this.getClientIP(),
      userAgent: navigator.userAgent,
      response: 'Logged to audit trail',
      resolved: severity === 'Low'
    });
  }

  /**
   * Get client IP address (would integrate with actual IP detection)
   */
  private getClientIP(): string {
    // This would integrate with actual IP detection service
    return '0.0.0.0';
  }

  /**
   * Perform emergency logout (for security incidents)
   */
  async emergencyLogout(reason: string): Promise<void> {
    this.logSecurityEvent('emergency_logout', 'Critical', `Emergency logout triggered: ${reason}`);

    // Clear all tokens immediately
    this.oktaAuth.tokenManager.clear();

    // Clear user session
    this.currentUser = null;

    // Clear session timer
    if (this.sessionTimer) {
      clearTimeout(this.sessionTimer);
      this.sessionTimer = null;
    }

    // Redirect to logout
    await this.oktaAuth.signOut();
  }

  /**
   * Get authentication headers for API calls
   */
  async getAuthHeaders(): Promise<Record<string, string>> {
    const accessToken = await this.getAccessToken();

    if (!accessToken) {
      throw new Error('No valid access token available');
    }

    return {
      'Authorization': `Bearer ${accessToken}`,
      "Content-Type": "application/json"
    };
  }
}

// Declare SOC2 framework (would be imported from actual security module)
declare const soc2Framework: {
  logSecurityEvent: (event: any) => void;
};

// Configuration for DCF production environment
export const oktaConfig: OktaConfig = {
  issuer: import.meta.env.VITE_OKTA_ISSUER || '',
  clientId: import.meta.env.VITE_OKTA_CLIENT_ID || '',
  redirectUri: import.meta.env.VITE_OKTA_REDIRECT_URI || (typeof window !== 'undefined' ? `${window.location.origin}/login/callback` : ''),
  scopes: import.meta.env.VITE_OKTA_SCOPES?.split(',') || ['openid', 'profile', 'email', 'groups'],
  pkce: true,
  disableHttpsCheck: import.meta.env.DEV === true
};

// Export singleton instance
export const oktaIAM = new OktaIAMIntegration(oktaConfig);
