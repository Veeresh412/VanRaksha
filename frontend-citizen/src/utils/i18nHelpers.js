/** Map API / runtime error messages to i18n keys. */
const ERROR_MESSAGE_KEYS = {
  'Email or organization ID is required.': 'errors.loginRequired',
  'Password is required.': 'errors.passwordRequired',
  'Password must be at least 8 characters.': 'errors.passwordMinLength',
  'Enter a valid email address.': 'errors.emailInvalid',
  'Invalid email/organization ID or password.': 'errors.invalidCredentials',
  'An account with this email already exists.': 'errors.emailExists',
  'An account with this registration number already exists.': 'errors.orgIdExists',
  'Report not found.': 'errors.reportNotFound',
  'Password reset will be available when the backend is connected.':
    'errors.passwordResetUnavailable',
  'Geolocation is not supported by your browser.': 'errors.geolocationUnsupported',
};

export function translateErrorMessage(t, message) {
  if (!message) return '';
  const key = ERROR_MESSAGE_KEYS[message];
  return key ? t(key) : message;
}

export function getGreetingKey() {
  const hour = new Date().getHours();
  if (hour < 12) return 'greeting.morning';
  if (hour < 17) return 'greeting.afternoon';
  return 'greeting.evening';
}

export function translateValidationError(t, error) {
  if (!error) return '';
  if (typeof error === 'string') return t(error);
  if (error.key) {
    const params = { ...(error.params || {}) };
    if (params.label?.startsWith?.('validation.') || params.label?.startsWith?.('registration.')) {
      params.label = t(params.label);
    }
    return t(error.key, params);
  }
  return '';
}

export function formatFieldError(t, error) {
  return translateValidationError(t, error);
}
