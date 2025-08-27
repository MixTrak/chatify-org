'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from 'firebase/auth';
import { getCurrentUser, onAuthStateChange } from '@/lib/firebase';
import { UserProfile } from '@/lib/user';

interface AuthContextType {
  firebaseUser: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  fetchUserProfile: (uid: string) => Promise<UserProfile | null>;
}

const AuthContext = createContext<AuthContextType>({
  firebaseUser: null,
  userProfile: null,
  loading: true,
  fetchUserProfile: async () => null,
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Try to hydrate from localStorage first for instant UI without flicker
    if (typeof window !== 'undefined') {
      try {
        const storedUserRaw = window.localStorage.getItem('authUser');
        const storedProfileRaw = window.localStorage.getItem('userProfile');
        if (storedUserRaw) {
          // Stored user is a minimal snapshot; actual Firebase User will be provided by listener shortly
          // We set loading true until the listener confirms
          const minimalUser = JSON.parse(storedUserRaw) as Partial<User> & { uid: string };
          // We cannot construct a full Firebase User object; keep firebaseUser null to avoid misuse
          // Instead, we rely on profile hydration for immediate UI where possible
          if (storedProfileRaw) {
            const storedProfile = JSON.parse(storedProfileRaw);
            setUserProfile(storedProfile);
          }
        }
      } catch (_) {
        // ignore storage errors
      }
    }

    // Check if there's a current user on mount via Firebase (authoritative)
    const currentUser = getCurrentUser();
    if (currentUser) {
      setFirebaseUser(currentUser);
      fetchUserProfile(currentUser.uid);
    }

    // Set up auth state listener
    const unsubscribe = onAuthStateChange(async (user) => {
      setFirebaseUser(user);
      if (user) {
        // Persist minimal auth info
        if (typeof window !== 'undefined') {
          try {
            window.localStorage.setItem('authUser', JSON.stringify({ uid: user.uid, email: user.email, displayName: user.displayName, photoURL: user.photoURL }));
          } catch (_) {
            // ignore storage errors
          }
        }
        await fetchUserProfile(user.uid);
      } else {
        setUserProfile(null);
        if (typeof window !== 'undefined') {
          try {
            window.localStorage.removeItem('authUser');
            window.localStorage.removeItem('userProfile');
          } catch (_) {
            // ignore storage errors
          }
        }
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const fetchUserProfile = async (uid: string): Promise<UserProfile | null> => {
    try {
      const response = await fetch(`/api/auth/user?uid=${uid}`);
      if (response.ok) {
        const profile = await response.json();
        setUserProfile(profile);
        // Persist profile for quick rehydration
        if (typeof window !== 'undefined') {
          try {
            window.localStorage.setItem('userProfile', JSON.stringify(profile));
          } catch (_) {
            // ignore storage errors
          }
        }
        setLoading(false);
        return profile;
      }
      setLoading(false);
      return null;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      setLoading(false);
      return null;
    }
  };

  return (
    <AuthContext.Provider value={{ firebaseUser, userProfile, loading, fetchUserProfile }}>
      {children}
    </AuthContext.Provider>
  );
}