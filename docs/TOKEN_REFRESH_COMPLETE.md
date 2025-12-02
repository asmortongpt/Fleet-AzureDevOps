import axios from 'axios';
import jwtDecode, { JwtPayload } from 'jwt-decode';

// Ensure TypeScript strict mode is enabled in tsconfig.json
// {
//   "compilerOptions": {
//     "strict": true
//   }
// }

interface TokenResponse {
  accessToken: string;
  refreshToken: string;
}

interface DecodedToken extends JwtPayload {
  exp: number;
}

const API_ENDPOINT = 'https://api.example.com/token/refresh';
const REFRESH_TOKEN_KEY = 'refreshToken';
const ACCESS_TOKEN_KEY = 'accessToken';

// Function to refresh JWT tokens
async function refreshToken(): Promise<void> {
  try {
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);

    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await axios.post<TokenResponse>(API_ENDPOINT, {
      refreshToken,
    });

    if (response.status !== 200) {
      throw new Error(`Failed to refresh token: ${response.statusText}`);
    }

    const { accessToken, refreshToken: newRefreshToken } = response.data;

    // Validate tokens
    validateToken(accessToken);
    validateToken(newRefreshToken);

    // Store new tokens
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, newRefreshToken);

    console.log('Token refresh complete');
  } catch (error) {
    // Log error details for troubleshooting
    console.error('Error refreshing token:', error);

    // FedRAMP Compliance: Ensure that sensitive information is not logged
    // Implement logging mechanisms that comply with FedRAMP logging requirements
  }
}

// Function to validate JWT token
function validateToken(token: string): void {
  try {
    const decoded = jwtDecode<DecodedToken>(token);

    if (!decoded.exp || Date.now() >= decoded.exp * 1000) {
      throw new Error('Token is expired or invalid');
    }
  } catch (error) {
    throw new Error('Invalid token format');
  }
}

// Call the refreshToken function periodically or based on application logic
// This should be integrated with the existing Fleet Local codebase
// Ensure that token rotation logic is seamlessly integrated with existing auth flows

// Note: Ensure that all network communications are encrypted (HTTPS) to comply with FedRAMP/SOC 2
// Ensure that access to tokens is restricted and audited as per compliance requirements