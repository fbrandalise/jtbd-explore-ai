import { useState, useEffect, useCallback } from 'react';
import { authRepo } from '@/lib/authRepo';
import { usersRepo } from '@/lib/usersRepo';
import type { Session, User } from '@supabase/supabase-js';
import type { UserProfile } from '@/lib/usersRepo';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const loadProfile = useCallback(async (userId: string) => {
    try {
      const { profile } = await usersRepo.getMyProfile();
      setProfile(profile);
    } catch (error) {
      console.error('Error loading profile:', error);
      setProfile(null);
    }
  }, []);

  useEffect(() => {
    // Set up auth state listener
    const subscription = authRepo.onAuthChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setIsAuthenticated(!!session?.user);
        
        if (session?.user) {
          // Defer profile loading to prevent auth state change deadlock
          setTimeout(() => {
            loadProfile(session.user.id);
          }, 0);
        } else {
          setProfile(null);
        }
        
        setIsLoading(false);
      }
    );

    // Check for existing session
    authRepo.getSession().then(({ session }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsAuthenticated(!!session?.user);
      
      if (session?.user) {
        setTimeout(() => {
          loadProfile(session.user.id);
        }, 0);
      }
      
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [loadProfile]);

  const signIn = useCallback(async (email: string, password: string) => {
    const result = await authRepo.signIn(email, password);
    return result;
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    const result = await authRepo.signUp(email, password);
    return result;
  }, []);

  const signOut = useCallback(async () => {
    const result = await authRepo.signOut();
    if (!result.error) {
      setUser(null);
      setSession(null);
      setProfile(null);
      setIsAuthenticated(false);
    }
    return result;
  }, []);

  const requestPasswordReset = useCallback(async (email: string) => {
    return await authRepo.requestPasswordReset(email);
  }, []);

  const updatePassword = useCallback(async (newPassword: string) => {
    return await authRepo.updatePassword(newPassword);
  }, []);

  const hasRole = useCallback((requiredRole: 'reader' | 'writer' | 'admin'): boolean => {
    if (!profile) return false;
    
    const roles = ['reader', 'writer', 'admin'];
    const userRoleIndex = roles.indexOf(profile.role);
    const requiredRoleIndex = roles.indexOf(requiredRole);
    
    return userRoleIndex >= requiredRoleIndex;
  }, [profile]);

  return {
    user,
    session,
    profile,
    isLoading,
    isAuthenticated,
    signIn,
    signUp,
    signOut,
    requestPasswordReset,
    updatePassword,
    hasRole,
    refreshProfile: () => user && loadProfile(user.id)
  };
};