'use client';

import { useState, useEffect } from 'react';
import { getUserProfile, clearTokens } from '@/lib/api';
import type { Profile } from '@/lib/types';

export function useAuth() {
  const [user, setUser] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const profile = getUserProfile();
    setUser(profile);
    setLoading(false);
  }, []);

  const logout = () => {
    clearTokens();
    setUser(null);
    window.location.href = '/login';
  };

  return {
    user,
    loading,
    isAuthenticated: !!user,
    isBiro: user?.is_biro || false,
    logout,
    setUser,
  };
}
