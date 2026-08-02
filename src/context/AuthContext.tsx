// AuthContext: Manages Supabase Anonymous Auth and User Preferences

import React, { createContext, useContext, useEffect, useState } from 'react';
import { UserPreferences } from '../types';
import { getOrCreateAnonymousUser, fetchUserPreferences, saveUserPreferences } from '../lib/supabase';

interface AuthContextType {
  userId: string | null;
  preferences: UserPreferences | null;
  isLoading: boolean;
  hasCompletedOnboarding: boolean;
  updatePreferences: (prefs: Omit<UserPreferences, 'id' | 'user_id'>) => Promise<void>;
  refreshPreferences: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  userId: null,
  preferences: null,
  isLoading: true,
  hasCompletedOnboarding: false,
  updatePreferences: async () => {},
  refreshPreferences: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userId, setUserId] = useState<string | null>(null);
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function initAuth() {
      try {
        const id = await getOrCreateAnonymousUser();
        setUserId(id);
        const prefs = await fetchUserPreferences(id);
        setPreferences(prefs);
      } catch (err) {
        console.error('Error initializing anonymous auth:', err);
      } finally {
        setIsLoading(false);
      }
    }
    initAuth();
  }, []);

  const updatePreferences = async (newPrefs: Omit<UserPreferences, 'id' | 'user_id'>) => {
    if (!userId) return;
    setIsLoading(true);
    try {
      const saved = await saveUserPreferences(userId, newPrefs);
      setPreferences(saved);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshPreferences = async () => {
    if (!userId) return;
    const prefs = await fetchUserPreferences(userId);
    setPreferences(prefs);
  };

  const hasCompletedOnboarding = Boolean(
    preferences &&
    preferences.interests &&
    preferences.interests.length > 0 &&
    preferences.primary_goal
  );

  return (
    <AuthContext.Provider
      value={{
        userId,
        preferences,
        isLoading,
        hasCompletedOnboarding,
        updatePreferences,
        refreshPreferences,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
