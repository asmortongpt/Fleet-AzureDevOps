// Type declarations for Okta authentication packages

declare module '@okta/okta-auth-js' {
    export interface OktaAuthOptions {
        issuer?: string;
        clientId?: string;
        redirectUri?: string;
        scopes?: string[];
        pkce?: boolean;
        responseType?: string;
        postLogoutRedirectUri?: string;
        storageType?: string;
    }
    export interface AccessToken {
        accessToken?: string;
        claims?: Record<string, unknown>;
        expiresAt?: number;
        tokenType?: string;
    }
    export interface IDToken {
        idToken?: string;
        claims?: Record<string, unknown>;
        expiresAt?: number;
    }
    export interface AuthState {
        isAuthenticated?: boolean;
        accessToken?: AccessToken;
        idToken?: IDToken;
    }
    export interface UserClaims {
        sub?: string;
        email?: string;
        given_name?: string;
        family_name?: string;
        name?: string;
        groups?: string[];
    }
    export class OktaAuth {
        constructor(options: OktaAuthOptions);
        signInWithRedirect(options?: { originalUri?: string }): Promise<void>;
        signOut(options?: { postLogoutRedirectUri?: string }): Promise<void>;
        getUser(): Promise<UserClaims>;
        getAccessToken(): Promise<string | undefined>;
        getIdToken(): Promise<string | undefined>;
        isAuthenticated(): Promise<boolean>;
        handleLoginRedirect(): Promise<void>;
    }
    export function toRelativeUrl(uri: string, origin: string): string;
}

declare module '@okta/okta-react' {
    import type { OktaAuth, AuthState } from '@okta/okta-auth-js';
    import type { ReactNode, ComponentType } from 'react';

    export interface SecurityProps {
        oktaAuth: OktaAuth;
        restoreOriginalUri: (oktaAuth: OktaAuth, originalUri: string) => Promise<void> | void;
        children?: ReactNode;
    }
    export const Security: ComponentType<SecurityProps>;

    export interface OktaAuthHookResult {
        oktaAuth: OktaAuth;
        authState: AuthState | null;
    }
    export function useOktaAuth(): OktaAuthHookResult;

    export interface LoginCallbackProps {
        errorComponent?: ComponentType<{ error: Error }>;
        loadingElement?: ReactNode;
    }
    export const LoginCallback: ComponentType<LoginCallbackProps>;
}
