/**
 * OTP service — dummy/local verification for development.
 * Replace requestOtp / verifyOtp with FastAPI calls when SMS OTP is ready.
 *
 * Demo only — replace with backend SMS OTP verification in production.
 */

export const DEMO_OTP = '123456';
export const OTP_LENGTH = 6;
export const RESEND_COOLDOWN_SECONDS = 30;

const PHONE_PATTERN = /^[6-9]\d{9}$/;

/** In-memory pending OTP sessions keyed by normalized phone. */
const pendingOtps = new Map();

export function normalizePhone(phone) {
  return String(phone || '').replace(/\D/g, '').slice(-10);
}

export function isValidIndianMobile(phone) {
  return PHONE_PATTERN.test(normalizePhone(phone));
}

export function isDemoOtpMode() {
  return import.meta.env.DEV || import.meta.env.MODE === 'development';
}

/**
 * Request an OTP for the given phone number.
 * Currently stores a dummy OTP locally — swap for POST /auth/otp/request later.
 */
export async function requestOtp(phone) {
  const normalized = normalizePhone(phone);

  if (!normalized) {
    throw new Error('otp.phoneRequired');
  }

  if (!isValidIndianMobile(normalized)) {
    throw new Error('otp.phoneInvalid');
  }

  // Demo only — replace with backend SMS OTP verification in production.
  pendingOtps.set(normalized, {
    code: DEMO_OTP,
    requestedAt: Date.now(),
  });

  return {
    phone: normalized,
    expiresInSeconds: RESEND_COOLDOWN_SECONDS * 2,
    demoOtp: isDemoOtpMode() ? DEMO_OTP : null,
  };
}

/**
 * Verify OTP for a phone number.
 * Swap for POST /auth/otp/verify later.
 */
export async function verifyOtp(phone, otp) {
  const normalized = normalizePhone(phone);
  const code = String(otp || '').replace(/\D/g, '');

  if (!code) {
    throw new Error('otp.otpRequired');
  }

  if (code.length < OTP_LENGTH) {
    throw new Error('otp.otpIncomplete');
  }

  if (code.length > OTP_LENGTH) {
    throw new Error('otp.otpIncorrect');
  }

  const pending = pendingOtps.get(normalized);

  // Accept demo OTP even if request was skipped (resilience for UI reloads).
  const expected = pending?.code || DEMO_OTP;

  if (code !== expected) {
    throw new Error('otp.otpIncorrect');
  }

  pendingOtps.delete(normalized);

  return {
    phone: normalized,
    verified: true,
  };
}

/**
 * Resend OTP — regenerates/stores the dummy OTP and resets cooldown in the UI.
 */
export async function resendOtp(phone) {
  return requestOtp(phone);
}
