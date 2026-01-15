import { AppError } from '../errors/AppError';
import { User } from '../types/user-management';

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
 * Requires database connection - no mock data fallback.
 *
 * @returns A promise that resolves to the current user data.
 * @throws {AppError} If the fetch operation fails.
 */
export const fetchCurrentUser = async (): Promise<User> => {
  try {
    const response = await fetch('/api/auth/me');
    if (!response.ok) {
      throw new AppError(`Authentication failed: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Network error occurred while fetching current user.');
  }
};