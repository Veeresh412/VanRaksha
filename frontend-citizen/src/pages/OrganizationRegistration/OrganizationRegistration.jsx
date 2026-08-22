import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Building2,
  Mail,
  Phone,
  MapPin,
  User,
  Hash,
  Lock,
  Trees,
} from 'lucide-react';
import Button from '../../components/common/Button';
import { Input, Select, TextArea } from '../../components/common/Input';
import DocumentUpload from '../../components/registration/DocumentUpload';
import { useAuth } from '../../hooks/useAuth';
import { useTranslation } from '../../hooks/useTranslation';
import { registerOrganization } from '../../services/api';
import { formatFieldError, translateErrorMessage } from '../../utils/i18nHelpers';
import {
  ORGANIZATION_TYPE_VALUES,
  INDIAN_STATES,
  validateRegistrationForm,
  validateDocument,
} from '../../utils/registrationValidation';
import '../../styles/registration.css';

const INITIAL_FORM = {
  organizationName: '',
  organizationType: '',
  registrationNumber: '',
  email: '',
  phone: '',
  state: '',
  district: '',
  address: '',
  contactPersonName: '',
  registrationCertificate: null,
  authorizationDocument: null,
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

export default function OrganizationRegistration() {
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

  const handleDocumentChange = (file, fieldName) => {
    updateField(fieldName, file);
    if (file) {
      const labelKey =
        fieldName === 'registrationCertificate'
          ? 'validation.labels.registrationCertificate'
          : 'validation.labels.authorizationDocument';
      const fileError = validateDocument(file, labelKey);
      setErrors((prev) => ({ ...prev, [fieldName]: fileError }));
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitError('');

    const validationErrors = validateRegistrationForm(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});
    setLoading(true);

    try {
      await registerOrganization({
        organizationName: form.organizationName.trim(),
        organizationType: form.organizationType,
        registrationNumber: form.registrationNumber.trim(),
        email: form.email.trim(),
        phone: form.phone.replace(/\D/g, ''),
        state: form.state,
        district: form.district.trim(),
        address: form.address.trim(),
        contactPersonName: form.contactPersonName.trim(),
        registrationCertificate: form.registrationCertificate,
        authorizationDocument: form.authorizationDocument,
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

  const organizationTypeOptions = ORGANIZATION_TYPE_VALUES.map((value) => ({
    value,
    label: t(`registration.orgTypes.${value}`),
  }));

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
          <h1 className="registration-page__title">{t('registration.organizationRegistration')}</h1>
          <p className="registration-page__subtitle">
            {t('registration.organizationSubtitle')}
          </p>
        </div>
      </div>

      <div className="registration-page__body">
        <form onSubmit={handleSubmit}>
          <div className="registration-page__card">
            <h2 className="registration-page__section-title">{t('registration.organizationDetails')}</h2>

            {submitError && (
              <div className="registration-page__error-banner">{submitError}</div>
            )}

            <Input
              label={t('registration.organizationName')}
              icon={Building2}
              placeholder={t('registration.organizationNamePlaceholder')}
              value={form.organizationName}
              onChange={(e) => updateField('organizationName', e.target.value)}
              error={formatFieldError(t, errors.organizationName)}
              required
            />

            <Select
              label={t('registration.organizationType')}
              icon={Trees}
              options={organizationTypeOptions}
              placeholder={t('registration.selectOrganizationType')}
              value={form.organizationType}
              onChange={(e) => updateField('organizationType', e.target.value)}
              error={formatFieldError(t, errors.organizationType)}
              required
            />

            <Input
              label={t('registration.registrationNumber')}
              icon={Hash}
              placeholder={t('registration.registrationNumberPlaceholder')}
              value={form.registrationNumber}
              onChange={(e) => updateField('registrationNumber', e.target.value)}
              error={formatFieldError(t, errors.registrationNumber)}
              required
            />
          </div>

          <div className="registration-page__card">
            <h2 className="registration-page__section-title">{t('registration.contactLocation')}</h2>

            <Input
              label={t('registration.officialEmail')}
              type="email"
              icon={Mail}
              placeholder={t('registration.officialEmailPlaceholder')}
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

            <TextArea
              label={t('registration.address')}
              maxLength={300}
              placeholder={t('registration.addressPlaceholder')}
              value={form.address}
              onChange={(e) => updateField('address', e.target.value)}
              error={formatFieldError(t, errors.address)}
              rows={3}
            />

            <Input
              label={t('registration.contactPersonName')}
              icon={User}
              placeholder={t('registration.contactPersonPlaceholder')}
              value={form.contactPersonName}
              onChange={(e) => updateField('contactPersonName', e.target.value)}
              error={formatFieldError(t, errors.contactPersonName)}
              required
            />
          </div>

          <div className="registration-page__card">
            <h2 className="registration-page__section-title">{t('registration.documents')}</h2>

            <DocumentUpload
              label={t('registration.uploadRegistrationCert')}
              labelKey="validation.labels.registrationCertificate"
              file={form.registrationCertificate}
              fieldName="registrationCertificate"
              onChange={handleDocumentChange}
              error={errors.registrationCertificate}
            />

            <DocumentUpload
              label={t('registration.uploadAuthorizationDoc')}
              labelKey="validation.labels.authorizationDocument"
              file={form.authorizationDocument}
              fieldName="authorizationDocument"
              onChange={handleDocumentChange}
              error={errors.authorizationDocument}
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
