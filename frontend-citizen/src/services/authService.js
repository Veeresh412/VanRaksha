/**
 * Auth service — UI components should use this module, not demoData or api directly.
 * Swap implementations for Person 2's FastAPI backend via VITE_API_BASE_URL.
 */

import {
  findDemoUser,
  toDemoSessionUser,
} from '../data/demoData';
import {
  logout as apiLogout,
  getStoredUser,
  getStoredToken,
  isAuthenticated,
  forgotPassword as apiForgotPassword,
  saveSession,
  validateLoginInput,
  findRegisteredUser,
  toSessionUser,
  buildSessionUserFromLogin,
} from './api';

export { getStoredToken, isAuthenticated };

export function getCurrentUser() {
  return getStoredUser();
}

export async function login(identifier, password) {
  validateLoginInput(identifier, password);

  const demoUser = findDemoUser(identifier, password);
  if (demoUser) {
    const user = toDemoSessionUser(demoUser);
    saveSession(user);
    return { token: getStoredToken(), user };
  }

  const registered = findRegisteredUser(identifier);
  if (registered) {
    if (registered.password !== password) {
      throw new Error('Invalid email/organization ID or password.');
    }
    const user = toSessionUser(registered);
    saveSession(user);
    return { token: getStoredToken(), user };
  }

  const user = buildSessionUserFromLogin(identifier);
  saveSession(user);
  return { token: getStoredToken(), user };
}

export async function logout() {
  return apiLogout();
}

export async function forgotPassword() {
  return apiForgotPassword();
}

/** @deprecated Use getCurrentUser() */
export { getStoredUser };
