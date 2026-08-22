import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, UserPlus, TreePine } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useTranslation } from '../../hooks/useTranslation';
import { translateErrorMessage } from '../../utils/i18nHelpers';
import Button from '../../components/common/Button';
import { Input } from '../../components/common/Input';
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

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
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

  return (
    <div className="login-page">
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
          <form onSubmit={handleSubmit}>
            {error && <div className="login-page__error">{error}</div>}

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
          </form>

          <div className="login-page__forgot">
            <Button variant="ghost" onClick={handleForgotPassword}>
              {t('login.forgotPassword')}
            </Button>
          </div>
        </div>

        <Button variant="outline" as={Link} to="/register">
          <UserPlus size={18} />
          {t('login.createAccount')}
        </Button>
      </div>
    </div>
  );
}
