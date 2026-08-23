/**
 * API layer — replace localStorage implementations with apiRequest calls when backend is ready.
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

const STORAGE_KEYS = {
  TOKEN: 'vanraksha_token',
  USER: 'vanraksha_user',
  USERS: 'vanraksha_users',
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function parseApiError(errorBody, status) {
  const detail = errorBody?.detail;

  if (typeof detail === 'string') {
    return detail;
  }

  if (Array.isArray(detail)) {
    return detail.map((item) => item.msg || item.message || String(item)).join(', ');
  }

  if (errorBody?.message) {
    return errorBody.message;
  }

  return `Request failed: ${status}`;
}

export async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
  const isFormData = options.body instanceof FormData;

  const config = {
    ...options,
    headers: {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  };

  const response = await fetch(url, config);

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(parseApiError(errorBody, response.status));
  }

  return response.json();
}

function readJson(key, fallback) {
  const raw = localStorage.getItem(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function getRegisteredUsers() {
  return readJson(STORAGE_KEYS.USERS, []);
}

function saveRegisteredUsers(users) {
  writeJson(STORAGE_KEYS.USERS, users);
}

function createToken() {
  return `local-token-${Date.now()}`;
}

function toSessionUser(record) {
  const user = { ...record };
  delete user.password;
  return user;
}

function validateLoginInput(identifier, password) {
  const trimmedId = identifier.trim();

  if (!trimmedId) {
    throw new Error('Email or organization ID is required.');
  }

  if (!password) {
    throw new Error('Password is required.');
  }

  if (password.length < 8) {
    throw new Error('Password must be at least 8 characters.');
  }

  if (trimmedId.includes('@') && !EMAIL_PATTERN.test(trimmedId)) {
    throw new Error('Enter a valid email address.');
  }
}

function findRegisteredUser(identifier) {
  const normalized = identifier.trim().toLowerCase();
  return getRegisteredUsers().find(
    (user) =>
      user.email?.toLowerCase() === normalized ||
      user.organizationId?.toLowerCase() === normalized
  );
}

function buildSessionUserFromLogin(identifier) {
  const trimmedId = identifier.trim();

  if (trimmedId.includes('@')) {
    return {
      id: `session-${Date.now()}`,
      accountType: 'individual',
      name: trimmedId.split('@')[0],
      email: trimmedId,
      verified: false,
    };
  }

  return {
    id: `session-${Date.now()}`,
    accountType: 'organization',
    name: trimmedId,
    organizationId: trimmedId,
    email: '',
    verified: false,
  };
}

function saveSession(user) {
  localStorage.setItem(STORAGE_KEYS.TOKEN, createToken());
  localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
}

export {
  saveSession,
  validateLoginInput,
  findRegisteredUser,
  toSessionUser,
  buildSessionUserFromLogin,
};

export function getStoredUser() {
  return readJson(STORAGE_KEYS.USER, null);
}

export function getStoredToken() {
  return localStorage.getItem(STORAGE_KEYS.TOKEN);
}

export function isAuthenticated() {
  return !!getStoredToken();
}

export async function login(identifier, password) {
  if (API_BASE_URL) {
    return apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ identifier, password }),
    });
  }

  validateLoginInput(identifier, password);

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
  if (API_BASE_URL) {
    try {
      await apiRequest('/auth/logout', { method: 'POST' });
    } catch {
      // Backend is optional during local development.
    }
  }

  localStorage.removeItem(STORAGE_KEYS.TOKEN);
  localStorage.removeItem(STORAGE_KEYS.USER);
}

export async function forgotPassword() {
  if (API_BASE_URL) {
    return apiRequest('/auth/forgot-password', { method: 'POST' });
  }

  throw new Error('Password reset will be available when the backend is connected.');
}

export async function registerIndividual(payload) {
  if (API_BASE_URL) {
    return apiRequest('/citizens/register', {
      method: 'POST',
      body: JSON.stringify({
        accountType: 'individual',
        ...payload,
      }),
    });
  }

  const users = getRegisteredUsers();
  const email = payload.email.trim().toLowerCase();

  if (users.some((user) => user.email?.toLowerCase() === email)) {
    throw new Error('An account with this email already exists.');
  }

  const userRecord = {
    id: `ind-${Date.now()}`,
    accountType: 'individual',
    name: payload.fullName.trim(),
    email: payload.email.trim(),
    phone: payload.phone,
    phoneVerified: payload.phoneVerified === true,
    state: payload.state,
    district: payload.district,
    village: payload.village,
    verified: false,
    registeredAt: new Date().toISOString(),
    password: payload.password,
  };

  saveRegisteredUsers([...users, userRecord]);

  return {
    success: true,
    registrationId: userRecord.id,
    email: userRecord.email,
  };
}

export async function registerOrganization(payload) {
  if (API_BASE_URL) {
    const formData = new FormData();
    formData.append('organizationName', payload.organizationName);
    formData.append('organizationType', payload.organizationType);
    formData.append('registrationNumber', payload.registrationNumber);
    formData.append('email', payload.email);
    formData.append('phone', payload.phone);
    formData.append('state', payload.state);
    formData.append('district', payload.district);
    formData.append('address', payload.address);
    formData.append('contactPersonName', payload.contactPersonName);
    formData.append('password', payload.password);
    formData.append('registrationCertificate', payload.registrationCertificate);
    formData.append('authorizationDocument', payload.authorizationDocument);

    return apiRequest('/organizations/register', {
      method: 'POST',
      body: formData,
      headers: {},
    });
  }

  const users = getRegisteredUsers();
  const email = payload.email.trim().toLowerCase();
  const orgId = payload.registrationNumber.trim();

  if (users.some((user) => user.email?.toLowerCase() === email)) {
    throw new Error('An account with this email already exists.');
  }

  if (users.some((user) => user.organizationId?.toLowerCase() === orgId.toLowerCase())) {
    throw new Error('An account with this registration number already exists.');
  }

  const userRecord = {
    id: `org-${Date.now()}`,
    accountType: 'organization',
    name: payload.organizationName.trim(),
    organizationId: orgId,
    organizationType: payload.organizationType,
    email: payload.email.trim(),
    phone: payload.phone,
    state: payload.state,
    district: payload.district,
    address: payload.address.trim(),
    contactPersonName: payload.contactPersonName.trim(),
    registrationCertificateName: payload.registrationCertificate?.name || null,
    authorizationDocumentName: payload.authorizationDocument?.name || null,
    verified: false,
    registeredAt: new Date().toISOString(),
    password: payload.password,
  };

  saveRegisteredUsers([...users, userRecord]);

  return {
    success: true,
    registrationId: userRecord.id,
    email: userRecord.email,
    organizationId: userRecord.organizationId,
  };
}
