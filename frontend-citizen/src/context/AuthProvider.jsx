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

  const loginWithPhone = useCallback(async (phone) => {
    const result = await authService.loginWithVerifiedPhone(phone);
    setAuthState({ user: result.user, loading: false });
    return result;
  }, []);

  const loginDemoUser = useCallback(async (demoUserId) => {
    const result = await authService.loginDemoUser(demoUserId);
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
      loginWithPhone,
      loginDemoUser,
      logout,
    }),
    [user, loading, login, loginWithPhone, loginDemoUser, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
