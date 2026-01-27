/**
 * OAuth Callback Handler
 * Handles the redirect from Microsoft OAuth/MSAL authentication
 *
 * This component:
 * 1. Shows a loading state while MSAL processes the OAuth response
 * 2. Waits for MSAL to complete authentication
 * 3. Redirects to dashboard on success or login on failure
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMsal } from '@azure/msal-react';
import { AuthenticationResult } from '@azure/msal-browser';
import logger from '@/utils/logger';

export function AuthCallback() {
  const navigate = useNavigate();
  const { instance, accounts } = useMsal();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleRedirect = async () => {
      try {
        logger.info('[AuthCallback] Processing OAuth redirect...');

        // MSAL automatically handles the redirect when the app loads
        // We just need to wait for it to complete
        const response: AuthenticationResult | null = await instance.handleRedirectPromise();

        if (response) {
          logger.info('[AuthCallback] MSAL authentication successful', {
            account: response.account.username,
            scopes: response.scopes
          });

          // Success - redirect to dashboard
          logger.info('[AuthCallback] Redirecting to dashboard');
          navigate('/', { replace: true });
        } else if (accounts.length > 0) {
          // Already authenticated (page refresh case)
          logger.info('[AuthCallback] Already authenticated, redirecting to dashboard');
          navigate('/', { replace: true });
        } else {
          // No response and no accounts - something went wrong
          logger.warn('[AuthCallback] No authentication response received');
          setError('Authentication failed. Please try again.');

          setTimeout(() => {
            navigate('/login', { replace: true });
          }, 3000);
        }
      } catch (err) {
        logger.error('[AuthCallback] Error processing redirect:', { error: err });
        setError('An error occurred during authentication. Redirecting to login...');

        setTimeout(() => {
          navigate('/login', { replace: true });
        }, 3000);
      }
    };

    handleRedirect();
  }, [instance, accounts, navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="text-center p-8">
        {error ? (
          <>
            <div className="mb-4">
              <svg
                className="mx-auto h-12 w-12 text-red-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Authentication Error
            </h2>
            <p className="text-gray-600 dark:text-gray-400">{error}</p>
          </>
        ) : (
          <>
            <div className="mb-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Completing Sign In
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Please wait while we authenticate you with Microsoft...
            </p>
          </>
        )}
      </div>
    </div>
  );
}
