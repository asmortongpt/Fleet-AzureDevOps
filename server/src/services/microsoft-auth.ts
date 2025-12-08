import axios from 'axios';

import { MicrosoftTokenResponse, MicrosoftUserProfile } from '../types';

import { config } from './config';
import { logger } from './logger';

export class MicrosoftAuthService {
  private readonly authority: string;
  private readonly tokenEndpoint: string;
  private readonly graphEndpoint: string;

  constructor() {
    this.authority = config.azureAd.authority;
    this.tokenEndpoint = `${this.authority}/oauth2/v2.0/token`;
    this.graphEndpoint = 'https://graph.microsoft.com/v1.0';
  }

  /**
   * Generate the OAuth authorization URL for Microsoft login
   */
  getAuthorizationUrl(state?: string): string {
    const params = new URLSearchParams({
      client_id: config.azureAd.clientId,
      response_type: 'code',
      redirect_uri: config.azureAd.redirectUri,
      response_mode: 'query',
      scope: 'openid profile email User.Read',
      state: state || this.generateRandomState(),
    });

    return `${this.authority}/oauth2/v2.0/authorize?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access token
   */
  async exchangeCodeForToken(code: string): Promise<MicrosoftTokenResponse> {
    try {
      const params = new URLSearchParams({
        client_id: config.azureAd.clientId,
        client_secret: config.azureAd.clientSecret,
        code: code,
        redirect_uri: config.azureAd.redirectUri,
        grant_type: 'authorization_code',
        scope: 'openid profile email User.Read',
      });

      logger.info('Exchanging authorization code for token');

      const response = await axios.post<MicrosoftTokenResponse>(
        this.tokenEndpoint,
        params.toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      logger.info('Successfully exchanged code for token');
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        logger.error('Failed to exchange code for token', {
          status: error.response?.status,
          data: error.response?.data,
        });
        throw new Error(`Token exchange failed: ${error.response?.data?.error_description || error.message}`);
      }
      throw error;
    }
  }

  /**
   * Get user profile from Microsoft Graph API
   */
  async getUserProfile(accessToken: string): Promise<MicrosoftUserProfile> {
    try {
      logger.info('Fetching user profile from Microsoft Graph');

      const response = await axios.get<MicrosoftUserProfile>(
        `${this.graphEndpoint}/me`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      logger.info('Successfully fetched user profile', {
        id: response.data.id,
        email: response.data.mail || response.data.userPrincipalName,
      });

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        logger.error('Failed to fetch user profile', {
          status: error.response?.status,
          data: error.response?.data,
        });
        throw new Error(`Failed to fetch user profile: ${error.response?.data?.error?.message || error.message}`);
      }
      throw error;
    }
  }

  /**
   * Validate that the user belongs to the allowed domain
   */
  validateUserDomain(email: string): boolean {
    const allowedDomain = 'capitaltechalliance.com';
    const domain = email.split('@')[1];
    return domain === allowedDomain;
  }

  /**
   * Generate a random state parameter for CSRF protection
   */
  private generateRandomState(): string {
    return Math.random().toString(36).substring(2, 15) +
           Math.random().toString(36).substring(2, 15);
  }
}

export const microsoftAuth = new MicrosoftAuthService();
