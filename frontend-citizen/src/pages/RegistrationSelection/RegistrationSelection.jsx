import { Link } from 'react-router-dom';
import { ArrowLeft, User, Building2, ChevronRight } from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';
import '../../styles/registration.css';

function ForestSilhouette() {
  return (
    <div className="registration-page__forest" aria-hidden="true">
      <svg viewBox="0 0 400 80" preserveAspectRatio="none" fill="white">
        <polygon points="0,80 0,50 20,30 40,50 60,20 80,45 100,25 120,50 140,30 160,55 180,20 200,45 220,30 240,50 260,25 280,50 300,35 320,55 340,25 360,50 380,30 400,50 400,80" />
      </svg>
    </div>
  );
}

export default function RegistrationSelection() {
  const { t } = useTranslation();

  return (
    <div className="registration-page">
      <div className="registration-page__hero">
        <ForestSilhouette />
        <Link to="/login" className="registration-page__back">
          <ArrowLeft size={16} />
          {t('registration.backToLogin')}
        </Link>
        <div className="registration-page__header">
          <h1 className="registration-page__title">{t('registration.createAccount')}</h1>
          <p className="registration-page__subtitle">{t('registration.chooseParticipation')}</p>
        </div>
      </div>

      <div className="registration-page__body">
        <div className="registration-page__options">
          <Link to="/register/individual" className="registration-page__option">
            <div className="registration-page__option-icon registration-page__option-icon--individual">
              <User size={24} />
            </div>
            <div className="registration-page__option-content">
              <h2 className="registration-page__option-title">{t('registration.individualTitle')}</h2>
              <p className="registration-page__option-desc">{t('registration.individualDesc')}</p>
            </div>
            <ChevronRight size={20} className="registration-page__option-chevron" />
          </Link>

          <Link to="/register/organization" className="registration-page__option">
            <div className="registration-page__option-icon registration-page__option-icon--organization">
              <Building2 size={24} />
            </div>
            <div className="registration-page__option-content">
              <h2 className="registration-page__option-title">{t('registration.organizationTitle')}</h2>
              <p className="registration-page__option-desc">{t('registration.organizationDesc')}</p>
            </div>
            <ChevronRight size={20} className="registration-page__option-chevron" />
          </Link>
        </div>
      </div>
    </div>
  );
}
