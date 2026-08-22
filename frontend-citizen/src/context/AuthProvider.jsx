import { useState, useCallback, useMemo } from 'react';
import * as authService from '../services/authService';
import { AuthContext } from './authContext';

function getInitialAuthState() {
  const stored = authService.getStoredUser();
  if (stored && authService.isAuthenticated()) {
    return { user: stored, loading: false };
  }
  return { user: null, loading: false };
}

export default function AuthProvider({ children }) {
  const [authState, setAuthState] = useState(getInitialAuthState);
  const { user, loading } = authState;

  const login = useCallback(async (email, password) => {
    const result = await authService.login(email, password);
    setAuthState({ user: result.user, loading: false });
    return result;
  }, []);

  const logout = useCallback(async () => {
    await authService.logout();
    setAuthState({ user: null, loading: false });
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated: !!user,
      login,
      logout,
    }),
    [user, loading, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
