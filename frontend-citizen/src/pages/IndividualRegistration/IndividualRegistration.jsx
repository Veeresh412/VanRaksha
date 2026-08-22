import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  MapPin,
  Lock,
} from 'lucide-react';
import Button from '../../components/common/Button';
import { Input, Select } from '../../components/common/Input';
import { useAuth } from '../../hooks/useAuth';
import { useTranslation } from '../../hooks/useTranslation';
import { registerIndividual } from '../../services/api';
import { formatFieldError, translateErrorMessage } from '../../utils/i18nHelpers';
import {
  INDIAN_STATES,
  validateIndividualRegistrationForm,
} from '../../utils/registrationValidation';
import '../../styles/registration.css';

const INITIAL_FORM = {
  fullName: '',
  email: '',
  phone: '',
  state: '',
  district: '',
  village: '',
  password: '',
  confirmPassword: '',
};

function ForestSilhouette() {
  return (
    <div className="registration-page__forest" aria-hidden="true">
      <svg viewBox="0 0 400 80" preserveAspectRatio="none" fill="white">
        <polygon points="0,80 0,50 20,30 40,50 60,20 80,45 100,25 120,50 140,30 160,55 180,20 200,45 220,30 240,50 260,25 280,50 300,35 320,55 340,25 360,50 380,30 400,50 400,80" />
      </svg>
    </div>
  );
}

export default function IndividualRegistration() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [loading, setLoading] = useState(false);

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitError('');

    const validationErrors = validateIndividualRegistrationForm(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});
    setLoading(true);

    try {
      await registerIndividual({
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        phone: form.phone.replace(/\D/g, ''),
        state: form.state,
        district: form.district.trim(),
        village: form.village.trim(),
        password: form.password,
      });
      await login(form.email.trim(), form.password);
      navigate('/');
    } catch (err) {
      setSubmitError(translateErrorMessage(t, err.message) || t('registration.submitFailed'));
    } finally {
      setLoading(false);
    }
  };

  const stateOptions = INDIAN_STATES.map((state) => ({
    value: state,
    label: state,
  }));

  return (
    <div className="registration-page">
      <div className="registration-page__hero">
        <ForestSilhouette />
        <Link to="/register" className="registration-page__back">
          <ArrowLeft size={16} />
          {t('common.back')}
        </Link>
        <div className="registration-page__header">
          <h1 className="registration-page__title">{t('registration.individualRegistration')}</h1>
          <p className="registration-page__subtitle">
            {t('registration.individualSubtitle')}
          </p>
        </div>
      </div>

      <div className="registration-page__body">
        <form onSubmit={handleSubmit}>
          <div className="registration-page__card">
            <h2 className="registration-page__section-title">{t('registration.personalDetails')}</h2>

            {submitError && (
              <div className="registration-page__error-banner">{submitError}</div>
            )}

            <Input
              label={t('registration.fullName')}
              icon={User}
              placeholder={t('registration.fullNamePlaceholder')}
              value={form.fullName}
              onChange={(e) => updateField('fullName', e.target.value)}
              error={formatFieldError(t, errors.fullName)}
              required
            />

            <Input
              label={t('registration.email')}
              type="email"
              icon={Mail}
              placeholder={t('registration.emailPlaceholder')}
              value={form.email}
              onChange={(e) => updateField('email', e.target.value)}
              error={formatFieldError(t, errors.email)}
              autoComplete="email"
              required
            />

            <Input
              label={t('registration.phone')}
              type="tel"
              icon={Phone}
              placeholder={t('registration.phonePlaceholder')}
              value={form.phone}
              onChange={(e) => updateField('phone', e.target.value)}
              error={formatFieldError(t, errors.phone)}
              autoComplete="tel"
              required
            />
          </div>

          <div className="registration-page__card">
            <h2 className="registration-page__section-title">{t('registration.location')}</h2>

            <Select
              label={t('registration.state')}
              icon={MapPin}
              options={stateOptions}
              placeholder={t('registration.selectState')}
              value={form.state}
              onChange={(e) => updateField('state', e.target.value)}
              error={formatFieldError(t, errors.state)}
              required
            />

            <Input
              label={t('registration.district')}
              icon={MapPin}
              placeholder={t('registration.districtPlaceholder')}
              value={form.district}
              onChange={(e) => updateField('district', e.target.value)}
              error={formatFieldError(t, errors.district)}
              required
            />

            <Input
              label={t('registration.villageLocality')}
              icon={MapPin}
              placeholder={t('registration.villagePlaceholder')}
              value={form.village}
              onChange={(e) => updateField('village', e.target.value)}
              error={formatFieldError(t, errors.village)}
              required
            />
          </div>

          <div className="registration-page__card">
            <h2 className="registration-page__section-title">{t('registration.accountSecurity')}</h2>

            <Input
              label={t('registration.password')}
              type="password"
              icon={Lock}
              placeholder={t('registration.passwordPlaceholder')}
              value={form.password}
              onChange={(e) => updateField('password', e.target.value)}
              error={formatFieldError(t, errors.password)}
              autoComplete="new-password"
              required
            />

            <Input
              label={t('registration.confirmPassword')}
              type="password"
              icon={Lock}
              placeholder={t('registration.confirmPasswordPlaceholder')}
              value={form.confirmPassword}
              onChange={(e) => updateField('confirmPassword', e.target.value)}
              error={formatFieldError(t, errors.confirmPassword)}
              autoComplete="new-password"
              required
            />

            <Button type="submit" disabled={loading}>
              {loading ? t('common.submitting') : t('registration.submitRegistration')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
