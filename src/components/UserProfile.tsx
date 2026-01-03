import React, { useState, useEffect } from 'react';

import { AppError } from '../errors/AppError';
import { fetchUserProfile } from '../services/userService';
import type { User } from '@/lib/types';

/**
 * UserProfile component displays user information.
 * 
 * @component
 * @example
 * return (
 *   <UserProfile userId="123" />
 * )
 */
const UserProfile: React.FC<{ userId: string }> = ({ userId }) => {
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadUserProfile = async () => {
      try {
        const userData = await fetchUserProfile(userId);
        if (userData) {
          setUser(userData as unknown as User);
        }
      } catch (err) {
        if (err instanceof AppError) {
          setError(err.message);
        } else {
          setError('An unexpected error occurred.');
        }
      }
    };

    loadUserProfile();
  }, [userId]);

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h1>{user.name}</h1>
      <p>Email: {user.email}</p>
    </div>
  );
};

export default UserProfile;