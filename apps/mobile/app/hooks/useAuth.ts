/**
 * UJUz - useAuth Hook
 * 인증 상태 관리 훅
 */

import { useCallback, useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';
import * as authService from '../services/supabase/auth';
import type { SignUpInput, SignInInput } from '../types/auth';

export function useAuth() {
  const {
    user,
    children,
    isAuthenticated,
    isLoading,
    setUser,
    setLoading,
    logout: storeLogout,
  } = useAuthStore();

  useEffect(() => {
    const unsubscribe = authService.onAuthStateChange((updatedUser) => {
      setUser(updatedUser);
    });

    return () => {
      unsubscribe?.();
    };
  }, [setUser]);

  const signUp = useCallback(
    async (input: SignUpInput) => {
      setLoading(true);
      try {
        const { user: newUser, error } = await authService.signUpWithEmail(input);
        if (error) return { error };
        setUser(newUser);
        return { error: null };
      } finally {
        setLoading(false);
      }
    },
    [setUser, setLoading]
  );

  const signIn = useCallback(
    async (input: SignInInput) => {
      setLoading(true);
      try {
        const { user: loggedInUser, error } = await authService.signInWithEmail(input);
        if (error) return { error };
        setUser(loggedInUser);
        return { error: null };
      } finally {
        setLoading(false);
      }
    },
    [setUser, setLoading]
  );

  const signInWithKakao = useCallback(async () => {
    setLoading(true);
    try {
      const { error } = await authService.signInWithOAuth('kakao');
      return { error };
    } finally {
      setLoading(false);
    }
  }, [setLoading]);

  const signInWithApple = useCallback(async () => {
    setLoading(true);
    try {
      const { error } = await authService.signInWithOAuth('apple');
      return { error };
    } finally {
      setLoading(false);
    }
  }, [setLoading]);

  const logout = useCallback(async () => {
    setLoading(true);
    try {
      await authService.signOut();
      storeLogout();
    } finally {
      setLoading(false);
    }
  }, [setLoading, storeLogout]);

  const refresh = useCallback(async () => {
    const { user: refreshedUser } = await authService.refreshSession();
    if (refreshedUser) setUser(refreshedUser);
  }, [setUser]);

  return {
    user,
    children,
    isAuthenticated,
    isLoading,
    signUp,
    signIn,
    signInWithKakao,
    signInWithApple,
    logout,
    refresh,
  };
}
