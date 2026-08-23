import { useState, useEffect, useCallback } from 'react';
import { Phone, BadgeCheck } from 'lucide-react';
import Button from '../common/Button';
import { Input } from '../common/Input';
import OtpInput from '../auth/OtpInput';
import { useTranslation } from '../../hooks/useTranslation';
import {
  // Demo only — replace with backend SMS OTP verification in production.
  DEMO_OTP,
  OTP_LENGTH,
  RESEND_COOLDOWN_SECONDS,
  isDemoOtpMode,
  isValidIndianMobile,
  normalizePhone,
  requestOtp,
  resendOtp,
  verifyOtp,
} from '../../services/otpService';
import './PhoneVerificationField.css';

function maskPhone(phone) {
  const digits = normalizePhone(phone);
  if (digits.length < 4) return digits;
  return `+91 ${'X'.repeat(Math.max(0, digits.length - 3))}${digits.slice(-3)}`;
}

function translateOtpError(t, message) {
  if (!message) return '';
  if (message.startsWith('otp.') || message.startsWith('registration.')) {
    return t(message);
  }
  return message;
}

/**
 * Phone field + demo OTP verification for registration.
 * Reuses OtpInput and otpService. Does not alter Login OTP behavior.
 */
export default function PhoneVerificationField({
  phone,
  onPhoneChange,
  phoneError,
  verified,
  onVerifiedChange,
  required = false,
}) {
  const { t } = useTranslation();
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState('');
  const [demoHint, setDemoHint] = useState(null);
  const [resendSeconds, setResendSeconds] = useState(0);
  const [busy, setBusy] = useState(false);
  const [verifiedPhone, setVerifiedPhone] = useState(null);

  const normalized = normalizePhone(phone);
  const phoneIsValid = isValidIndianMobile(normalized);
  const isVerified = Boolean(verified && verifiedPhone === normalized);

  useEffect(() => {
    if (resendSeconds <= 0) return undefined;
    const timer = setInterval(() => {
      setResendSeconds((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendSeconds]);

  const startCooldown = useCallback(() => {
    setResendSeconds(RESEND_COOLDOWN_SECONDS);
  }, []);

  const clearVerificationState = useCallback(() => {
    setVerifiedPhone(null);
    setOtpSent(false);
    setOtp('');
    setOtpError('');
    setDemoHint(null);
    setResendSeconds(0);
    onVerifiedChange(false);
  }, [onVerifiedChange]);

  const handlePhoneChange = (value) => {
    const nextNormalized = normalizePhone(value);
    onPhoneChange(value);
    setOtpError('');

    if (verifiedPhone && nextNormalized !== verifiedPhone) {
      clearVerificationState();
    }
  };

  const handleVerifyNumber = async () => {
    setOtpError('');

    if (!phoneIsValid) {
      setOtpError(t('otp.phoneInvalid'));
      return;
    }

    setBusy(true);
    try {
      // Demo only — replace with backend SMS OTP verification in production.
      const result = await requestOtp(normalized);
      setOtp('');
      setOtpSent(true);
      setDemoHint(result.demoOtp);
      startCooldown();
      if (isVerified) {
        setVerifiedPhone(null);
        onVerifiedChange(false);
      }
    } catch (err) {
      setOtpError(translateOtpError(t, err.message));
    } finally {
      setBusy(false);
    }
  };

  const handleVerifyOtp = async (event) => {
    event.preventDefault();
    setOtpError('');

    if (!otp) {
      setOtpError(t('otp.otpRequired'));
      return;
    }
    if (otp.length < OTP_LENGTH) {
      setOtpError(t('otp.otpIncomplete'));
      return;
    }

    setBusy(true);
    try {
      // Demo only — replace with backend SMS OTP verification in production.
      await verifyOtp(normalized, otp);
      setVerifiedPhone(normalized);
      setOtpSent(false);
      setOtp('');
      setDemoHint(null);
      onVerifiedChange(true);
    } catch {
      setOtpError(t('registration.invalidOtp'));
    } finally {
      setBusy(false);
    }
  };

  const handleResend = async () => {
    if (resendSeconds > 0 || busy) return;
    setOtpError('');
    setBusy(true);
    try {
      // Demo only — replace with backend SMS OTP verification in production.
      const result = await resendOtp(normalized);
      setOtp('');
      setDemoHint(result.demoOtp);
      startCooldown();
    } catch (err) {
      setOtpError(translateOtpError(t, err.message));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="phone-verification">
      <Input
        label={t('registration.phone')}
        type="tel"
        icon={Phone}
        placeholder={t('registration.phonePlaceholder')}
        value={phone}
        onChange={(e) => handlePhoneChange(e.target.value)}
        error={phoneError}
        autoComplete="tel"
        required={required}
      />

      <div className="phone-verification__actions">
        {isVerified ? (
          <Button type="button" variant="outline" disabled className="phone-verification__verified-btn">
            <BadgeCheck size={16} />
            {t('registration.verified')}
          </Button>
        ) : (
          phoneIsValid &&
          !otpSent && (
            <Button type="button" variant="outline" onClick={handleVerifyNumber} disabled={busy}>
              {busy ? t('otp.sending') : t('registration.verifyNumber')}
            </Button>
          )
        )}
      </div>

      {isVerified && (
        <div className="phone-verification__verified" role="status">
          <BadgeCheck size={18} />
          <span>{t('registration.phoneVerifiedSuccess')}</span>
        </div>
      )}

      {otpSent && !isVerified && (
        <div className="phone-verification__otp-panel">
          <p className="phone-verification__sent">
            {t('registration.otpSentTo', { phone: maskPhone(normalized) })}
          </p>
          <p className="phone-verification__otp-label">
            {t('registration.enterVerificationCode')}
          </p>

          {isDemoOtpMode() && demoHint && (
            <p className="phone-verification__demo-hint" role="status">
              {t('otp.demoHint', { otp: demoHint || DEMO_OTP })}
            </p>
          )}

          <OtpInput
            value={otp}
            onChange={setOtp}
            disabled={busy}
            error={Boolean(otpError)}
            ariaLabelPrefix={t('otp.digitLabel')}
          />

          {otpError && (
            <p className="phone-verification__error" role="alert">
              {otpError}
            </p>
          )}

          <Button type="button" onClick={handleVerifyOtp} disabled={busy}>
            {busy ? t('otp.verifying') : t('registration.verifyOtp')}
          </Button>

          <button
            type="button"
            className="phone-verification__resend"
            onClick={handleResend}
            disabled={busy || resendSeconds > 0}
          >
            {resendSeconds > 0
              ? t('otp.resendIn', { seconds: resendSeconds })
              : t('otp.resend')}
          </button>
        </div>
      )}

      {!otpSent && !isVerified && otpError && (
        <p className="phone-verification__error" role="alert">
          {otpError}
        </p>
      )}
    </div>
  );
}
