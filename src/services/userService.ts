import { AppError } from '../errors/AppError';
import { User } from '../types/user-management';

/**
 * Default dev user returned when VITE_SKIP_AUTH is enabled and the
 * /api/auth/me endpoint is unavailable.  This keeps the Profile page
 * (and anything else that calls fetchCurrentUser) working during local
 * development without a running backend auth stack.
 *
 * Only used in non-production builds with VITE_SKIP_AUTH=true.
 */
const DEV_FALLBACK_USER: User = {
  id: '00000000-0000-0000-0000-000000000001',
  email: 'dev@fleet.local',
  emailVerified: true,
  displayName: 'Dev User',
  firstName: 'Dev',
  lastName: 'User',
  roleIds: ['SuperAdmin'],
  teamIds: [],
  status: 'active',
  createdAt: new Date().toISOString(),
};

/**
 * Returns true when the frontend auth bypass flag is active.
 * Intentionally restricted to non-production builds.
 */
const isSkipAuth = (): boolean =>
  !import.meta.env.PROD &&
  (import.meta.env.VITE_SKIP_AUTH === 'true' || import.meta.env.VITE_BYPASS_AUTH === 'true');

/**
 * Fetches user profile data from the API.
 * Requires database connection - no mock data fallback.
 *
 * @param userId - The ID of the user to fetch.
 * @returns A promise that resolves to the user data.
 * @throws {AppError} If the fetch operation fails.
 */
export const fetchUserProfile = async (userId: string): Promise<User> => {
  try {
    const response = await fetch(`/api/users/${encodeURIComponent(userId)}`);
    if (!response.ok) {
      throw new AppError(`Failed to fetch user profile: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Network error occurred while fetching user profile.');
  }
};

/**
 * Fetches the current user for the application.
 * Used to populate the currentUserAtom on app initialization.
 * Requires database connection - no mock data fallback in production.
 *
 * When VITE_SKIP_AUTH=true (dev only), a 401 / network failure will
 * return a default dev user instead of throwing, eliminating the
 * console error on the Profile page during local development.
 *
 * @returns A promise that resolves to the current user data.
 * @throws {AppError} If the fetch operation fails (production only).
 */
export const fetchCurrentUser = async (): Promise<User> => {
  try {
    const response = await fetch('/api/auth/me');
    if (!response.ok) {
      throw new AppError(`Authentication failed: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    // In SKIP_AUTH dev mode, gracefully return the fallback user
    // instead of surfacing a console error on the Profile page.
    if (isSkipAuth()) {
      return { ...DEV_FALLBACK_USER };
    }

    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Network error occurred while fetching current user.');
  }
};