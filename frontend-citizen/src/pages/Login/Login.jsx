import { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, UserPlus, TreePine, Phone, Presentation, X } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useTranslation } from '../../hooks/useTranslation';
import { translateErrorMessage } from '../../utils/i18nHelpers';
import { DEMO_LOGIN_ACCOUNTS } from '../../services/authService';
import Button from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import OtpInput from '../../components/auth/OtpInput';
import {
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
import './Login.css';

function ForestSilhouette() {
  return (
    <div className="login-page__forest" aria-hidden="true">
      <svg viewBox="0 0 400 80" preserveAspectRatio="none" fill="white">
        <polygon points="0,80 0,50 20,30 40,50 60,20 80,45 100,25 120,50 140,30 160,55 180,20 200,45 220,30 240,50 260,25 280,50 300,35 320,55 340,25 360,50 380,30 400,50 400,80" />
      </svg>
    </div>
  );
}

function translateOtpError(t, message) {
  if (!message) return '';
  if (message.startsWith('otp.')) return t(message);
  return translateErrorMessage(t, message);
}

export default function Login() {
  const { login, loginWithPhone, loginDemoUser } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const demoMenuRef = useRef(null);

  const [method, setMethod] = useState('phone');
  const [step, setStep] = useState('credentials');

  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [demoHint, setDemoHint] = useState(null);
  const [resendSeconds, setResendSeconds] = useState(0);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showDemoMenu, setShowDemoMenu] = useState(false);

  useEffect(() => {
    if (!showDemoMenu) return undefined;

    const handleClickOutside = (event) => {
      if (demoMenuRef.current && !demoMenuRef.current.contains(event.target)) {
        setShowDemoMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showDemoMenu]);

  useEffect(() => {
    if (resendSeconds <= 0) return undefined;
    const timer = setInterval(() => {
      setResendSeconds((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendSeconds]);

  const startResendCooldown = useCallback(() => {
    setResendSeconds(RESEND_COOLDOWN_SECONDS);
  }, []);

  const handlePhoneSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const normalized = normalizePhone(phone);
    if (!normalized) {
      setError(t('otp.phoneRequired'));
      return;
    }
    if (!isValidIndianMobile(normalized)) {
      setError(t('otp.phoneInvalid'));
      return;
    }

    setLoading(true);
    try {
      const result = await requestOtp(normalized);
      setPhone(normalized);
      setOtp('');
      setDemoHint(result.demoOtp);
      setStep('otp');
      startResendCooldown();
    } catch (err) {
      setError(translateOtpError(t, err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleOtpVerify = async (e) => {
    e.preventDefault();
    setError('');

    if (!otp) {
      setError(t('otp.otpRequired'));
      return;
    }
    if (otp.length < OTP_LENGTH) {
      setError(t('otp.otpIncomplete'));
      return;
    }

    setLoading(true);
    try {
      await verifyOtp(phone, otp);
      await loginWithPhone(phone);
      navigate('/');
    } catch (err) {
      setError(translateOtpError(t, err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendSeconds > 0 || loading) return;
    setError('');
    setLoading(true);
    try {
      const result = await resendOtp(phone);
      setOtp('');
      setDemoHint(result.demoOtp);
      startResendCooldown();
    } catch (err) {
      setError(translateOtpError(t, err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleChangePhone = () => {
    setStep('credentials');
    setOtp('');
    setError('');
    setDemoHint(null);
    setResendSeconds(0);
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(translateErrorMessage(t, err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    alert(t('login.forgotPasswordAlert'));
  };

  const handleDemoLogin = async (demoUserId) => {
    setError('');
    setLoading(true);
    setShowDemoMenu(false);

    try {
      await loginDemoUser(demoUserId);
      navigate('/');
    } catch (err) {
      setError(translateErrorMessage(t, err.message));
    } finally {
      setLoading(false);
    }
  };

  const switchMethod = (next) => {
    setMethod(next);
    setStep('credentials');
    setError('');
    setOtp('');
    setDemoHint(null);
    setResendSeconds(0);
  };

  return (
    <div className="login-page">
      <div className="login-page__demo-login" ref={demoMenuRef}>
        <button
          type="button"
          className="login-page__demo-btn"
          onClick={() => setShowDemoMenu((open) => !open)}
          aria-expanded={showDemoMenu}
          aria-haspopup="dialog"
          disabled={loading}
        >
          <Presentation size={16} />
          {t('login.demoLogin')}
        </button>

        {showDemoMenu && (
          <div
            className="login-page__demo-menu"
            role="dialog"
            aria-label={t('login.demoLoginTitle')}
          >
            <div className="login-page__demo-menu-header">
              <span className="login-page__demo-menu-label">{t('login.demoOnly')}</span>
              <button
                type="button"
                className="login-page__demo-menu-close"
                onClick={() => setShowDemoMenu(false)}
                aria-label={t('common.close')}
              >
                <X size={16} />
              </button>
            </div>
            <p className="login-page__demo-menu-title">{t('login.demoLoginTitle')}</p>
            <p className="login-page__demo-menu-subtitle">{t('login.demoLoginSubtitle')}</p>
            <div className="login-page__demo-options">
              {DEMO_LOGIN_ACCOUNTS.map((account) => (
                <button
                  key={account.userId}
                  type="button"
                  className="login-page__demo-option"
                  onClick={() => handleDemoLogin(account.userId)}
                  disabled={loading}
                >
                  {t(account.labelKey)}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="login-page__hero">
        <ForestSilhouette />
        <div className="login-page__logo">
          <TreePine size={32} className="login-page__logo-icon" />
        </div>
        <h1 className="login-page__title">{t('brand.name')}</h1>
        <p className="login-page__subtitle">{t('brand.subtitle')}</p>
      </div>

      <div className="login-page__form">
        <div className="login-page__card">
          {step === 'credentials' && (
            <div className="login-page__tabs" role="tablist" aria-label={t('login.methodLabel')}>
              <button
                type="button"
                role="tab"
                aria-selected={method === 'phone'}
                className={`login-page__tab ${method === 'phone' ? 'login-page__tab--active' : ''}`}
                onClick={() => switchMethod('phone')}
              >
                {t('login.methodPhone')}
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={method === 'password'}
                className={`login-page__tab ${method === 'password' ? 'login-page__tab--active' : ''}`}
                onClick={() => switchMethod('password')}
              >
                {t('login.methodPassword')}
              </button>
            </div>
          )}

          {error && <div className="login-page__error">{error}</div>}

          {step === 'otp' ? (
            <form onSubmit={handleOtpVerify}>
              <p className="login-page__otp-heading">{t('otp.enterOtp')}</p>
              <p className="login-page__otp-sent">
                {t('otp.sentTo', { phone })}
              </p>

              {isDemoOtpMode() && demoHint && (
                <p className="login-page__demo-otp" role="status">
                  {t('otp.demoHint', { otp: demoHint || DEMO_OTP })}
                </p>
              )}

              <OtpInput
                value={otp}
                onChange={setOtp}
                disabled={loading}
                error={Boolean(error)}
                ariaLabelPrefix={t('otp.digitLabel')}
              />

              <Button type="submit" disabled={loading}>
                {loading ? t('otp.verifying') : t('otp.verify')}
              </Button>

              <div className="login-page__otp-actions">
                <button
                  type="button"
                  className="login-page__link-btn"
                  onClick={handleResend}
                  disabled={loading || resendSeconds > 0}
                >
                  {resendSeconds > 0
                    ? t('otp.resendIn', { seconds: resendSeconds })
                    : t('otp.resend')}
                </button>
                <button
                  type="button"
                  className="login-page__link-btn"
                  onClick={handleChangePhone}
                  disabled={loading}
                >
                  {t('otp.changePhone')}
                </button>
              </div>
            </form>
          ) : method === 'phone' ? (
            <form onSubmit={handlePhoneSubmit}>
              <Input
                label={t('login.phone')}
                type="tel"
                icon={Phone}
                placeholder={t('login.phonePlaceholder')}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                autoComplete="tel"
                inputMode="numeric"
              />
              <Button type="submit" disabled={loading}>
                {loading ? t('otp.sending') : t('otp.sendOtp')}
              </Button>
            </form>
          ) : (
            <form onSubmit={handlePasswordSubmit}>
              <Input
                label={t('login.emailOrOrgId')}
                type="text"
                icon={Mail}
                placeholder={t('login.emailOrOrgIdPlaceholder')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="username"
              />

              <Input
                label={t('login.password')}
                type="password"
                icon={Lock}
                placeholder={t('login.passwordPlaceholder')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />

              <Button type="submit" disabled={loading}>
                {loading ? t('common.signingIn') : t('common.signIn')}
              </Button>

              <div className="login-page__forgot">
                <Button variant="ghost" onClick={handleForgotPassword}>
                  {t('login.forgotPassword')}
                </Button>
              </div>
            </form>
          )}
        </div>

        {step === 'credentials' && (
          <Button variant="outline" as={Link} to="/register">
            <UserPlus size={18} />
            {t('login.createAccount')}
          </Button>
        )}
      </div>
    </div>
  );
}
